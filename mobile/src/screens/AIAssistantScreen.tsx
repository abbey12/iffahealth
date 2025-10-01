import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SimpleIcon from '../components/SimpleIcon';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { API_CONFIG, HEALTH_ASSISTANT_PROMPT } from '../config/api';
import apiService from '../services/apiService';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface AssessmentState {
  symptom: string;
  stage: 'initial' | 'duration' | 'severity' | 'associated' | 'triggers' | 'conclusion';
  responses: {
    duration?: string;
    severity?: string;
    associated?: string;
    triggers?: string;
  };
}

const {width, height} = Dimensions.get('window');
const { DEEPSEEK } = API_CONFIG;

const AIAssistantScreen = (): React.JSX.Element => {
  const isAndroid = Platform.OS === 'android';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m Dr. Iffa, your AI Health Assistant. I\'m here to help assess your health concerns and provide guidance.\n\nWhat symptoms or health questions can I help you with today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  // Keyboard handled by KeyboardAvoidingView
  const [assessmentState, setAssessmentState] = useState<AssessmentState | null>(null);
  const [suggestedDoctorsOnce, setSuggestedDoctorsOnce] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Ensure scroll stays at bottom
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // DeepSeek API call function
  const callDeepSeekAPI = async (userInput: string): Promise<string> => {
    try {
      const response = await axios.post(
        DEEPSEEK.BASE_URL,
        {
          model: DEEPSEEK.MODEL,
          messages: buildChatMessages(userInput),
          max_tokens: DEEPSEEK.MAX_TOKENS,
          temperature: DEEPSEEK.TEMPERATURE,
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK.API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: DEEPSEEK.TIMEOUT,
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw error;
    }
  };

  // Detect if AI advised urgent care
  const shouldSuggestDoctors = (aiText: string): boolean => {
    const t = (aiText || '').toLowerCase();
    return (
      t.includes('emergency services') ||
      t.includes('urgent care') ||
      t.includes('seek immediate medical') ||
      t.includes('go to the nearest emergency')
    );
  };

  // Fetch available doctors with openings based on symptom context
  const fetchDoctorSuggestions = async (): Promise<string | null> => {
    try {
      // Infer specialty from current assessment
      const symptom = assessmentState?.symptom || '';
      const specialty = inferSpecialtyFromSymptom(symptom);

      // Fetch doctors, forcing availability checks
      const resp = await apiService.getDoctors(specialty, undefined, true);
      if (!resp?.success || !Array.isArray(resp.data) || resp.data.length === 0) {
        return null;
      }

      // Take up to 3 doctors and verify they have at least one slot today/tomorrow
      const today = new Date();
      const datesToCheck = [today, new Date(today.getTime() + 24 * 60 * 60 * 1000)];

      const selected: Array<{ name: string; specialty: string; id: string; nextSlot?: string }> = [];

      for (const doc of resp.data.slice(0, 6)) {
        let nextSlot: string | undefined;
        for (const d of datesToCheck) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          try {
            const availResp = await apiService.getDoctorAvailability(doc.id || doc.profileId || doc.doctor_id || doc.uuid, dateStr);
            const slots = availResp?.data?.availableSlots || [];
            if (slots.length > 0) {
              nextSlot = `${dateStr} ${slots[0]}`;
              break;
            }
          } catch {}
        }
        if (nextSlot) {
          selected.push({
            name: `${doc.first_name || doc.firstName || ''} ${doc.last_name || doc.lastName || ''}`.trim() || 'Doctor',
            specialty: doc.specialty || specialty || 'General Practice',
            id: doc.id || doc.profileId || doc.doctor_id || '',
            nextSlot,
          });
        }
        if (selected.length >= 3) break;
      }

      if (selected.length === 0) return null;

      const lines = selected.map((s, i) => `${i + 1}. ${s.name} — ${s.specialty} — Next: ${s.nextSlot}`);
      return `Here are available doctors you can book now:\n\n${lines.join('\n')}\n\nWould you like me to open the doctors list so you can book?`;
    } catch (e) {
      return null;
    }
  };

  const inferSpecialtyFromSymptom = (symptom: string): string | undefined => {
    const s = symptom.toLowerCase();
    if (s.includes('chest')) return 'Cardiology';
    if (s.includes('abdominal') || s.includes('stomach')) return 'Gastroenterology';
    if (s.includes('headache')) return 'Neurology';
    if (s.includes('fever')) return 'General Practice';
    if (s.includes('anxiety') || s.includes('stress')) return 'Psychiatry';
    if (s.includes('sleep')) return 'Family Medicine';
    return undefined;
  };

  // Build messages with lightweight memory to prevent repetition and enforce one-question-at-a-time
  const buildChatMessages = (latestUserInput: string) => {
    const history = messages.slice(-6).map(m => ({
      role: m.isUser ? 'user' as const : 'assistant' as const,
      content: m.text
    }));

    // Summarize what has been asked to avoid repetition
    const askedQuestions = messages
      .filter(m => !m.isUser)
      .map(m => m.text)
      .slice(-5)
      .join('\n- ');

    const systemPreamble = `${HEALTH_ASSISTANT_PROMPT}\n\nContext:\n- Recent assistant prompts:\n- ${askedQuestions || 'None yet'}\n\nImportant: Ask exactly one new, non-repeated question now.`;

    return [
      { role: 'system', content: systemPreamble },
      ...history,
      { role: 'user', content: latestUserInput }
    ];
  };

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsTyping(true);

    try {
      // Try DeepSeek API first
      if (DEEPSEEK.API_KEY && DEEPSEEK.API_KEY.trim() !== '') {
        const aiResponse = await callDeepSeekAPI(currentInput);
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsApiConnected(true);

        // Suggest doctors if urgent care is advised
        if (shouldSuggestDoctors(aiResponse) && !suggestedDoctorsOnce) {
          try {
            const suggestions = await fetchDoctorSuggestions();
            if (suggestions) {
              const suggestionsMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                text: suggestions,
                isUser: false,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, suggestionsMessage]);
              setSuggestedDoctorsOnce(true);
            }
          } catch {}
        }
      } else {
        // Fallback to local response if API key not configured
        setTimeout(() => {
          const aiResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: generateAIResponse(currentInput),
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiResponse]);

          // Suggest doctors if urgent care is advised
          if (shouldSuggestDoctors(aiResponse.text) && !suggestedDoctorsOnce) {
            fetchDoctorSuggestions().then((suggestions) => {
              if (suggestions) {
                const suggestionsMessage: ChatMessage = {
                  id: (Date.now() + 2).toString(),
                  text: suggestions,
                  isUser: false,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, suggestionsMessage]);
                setSuggestedDoctorsOnce(true);
              }
            }).catch(() => {});
          }
        }, 1500);
      }
    } catch (error) {
      // Fallback to local response on API error
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: generateAIResponse(currentInput),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1500);
    } finally {
      setIsTyping(false);
    }
  };

  const detectSymptom = (input: string): string | null => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('headache') || lowerInput.includes('head pain')) return 'headache';
    if (lowerInput.includes('fever') || lowerInput.includes('temperature')) return 'fever';
    if (lowerInput.includes('chest pain') || lowerInput.includes('chest discomfort')) return 'chest pain';
    if (lowerInput.includes('stomach') || lowerInput.includes('abdominal') || lowerInput.includes('belly')) return 'abdominal pain';
    if (lowerInput.includes('pain') && !lowerInput.includes('chest') && !lowerInput.includes('head')) return 'general pain';
    if (lowerInput.includes('sleep') || lowerInput.includes('insomnia') || lowerInput.includes('tired')) return 'sleep issues';
    if (lowerInput.includes('anxiety') || lowerInput.includes('stress') || lowerInput.includes('worried')) return 'anxiety';
    if (lowerInput.includes('emergency') || lowerInput.includes('urgent')) return 'emergency';
    
    return null;
  };

  const getNextQuestion = (state: AssessmentState): string => {
    const { symptom, stage, responses } = state;
    
    switch (stage) {
      case 'initial':
        return `I understand you're experiencing ${symptom}. Let me help assess this with you step by step.\n\nFirst, how long have you been experiencing this ${symptom}?`;
      
      case 'duration':
        return `Thank you. Now, can you describe the ${symptom}? Is it sharp, dull, throbbing, burning, or something else?`;
      
      case 'severity':
        return `I see. On a scale of 1-10, how would you rate the severity of your ${symptom}? (1 being very mild, 10 being unbearable)`;
      
      case 'associated':
        return `Are you experiencing any other symptoms along with your ${symptom}? For example, nausea, dizziness, fever, or changes in vision?`;
      
      case 'triggers':
        return `Have you noticed anything that makes your ${symptom} better or worse? Any specific triggers or activities?`;
      
      case 'conclusion':
        return generateConclusion(state);
      
      default:
        return 'Thank you for sharing. How can I help you further?';
    }
  };

  const generateConclusion = (state: AssessmentState): string => {
    const { symptom, responses } = state;
    
    let conclusion = `Based on what you've told me about your ${symptom}:\n\n`;
    
    if (responses.duration) {
      conclusion += `• Duration: ${responses.duration}\n`;
    }
    if (responses.severity) {
      conclusion += `• Severity: ${responses.severity}\n`;
    }
    if (responses.associated) {
      conclusion += `• Associated symptoms: ${responses.associated}\n`;
    }
    if (responses.triggers) {
      conclusion += `• Triggers/relief: ${responses.triggers}\n`;
    }
    
    conclusion += `\nWhile I can provide general health information, I cannot diagnose medical conditions. `;
    
    // Add specific guidance based on symptom
    if (symptom === 'chest pain' || symptom === 'emergency') {
      conclusion += `Given the nature of your symptoms, I strongly recommend seeking immediate medical attention. If you're experiencing severe chest pain, difficulty breathing, or signs of a medical emergency, please call emergency services right away.`;
    } else if (symptom === 'fever') {
      conclusion += `For fever management, rest and stay hydrated. If your fever persists for more than 3 days or reaches above 103°F, please consult a healthcare provider.`;
    } else {
      conclusion += `If your symptoms persist, worsen, or significantly impact your daily life, I recommend consulting with a healthcare professional for proper evaluation and treatment.`;
    }
    
    conclusion += `\n\nWould you like me to help you book an appointment with a doctor, or do you have any other health concerns?`;
    
    return conclusion;
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Check for emergency keywords first
    if (input.includes('emergency') || input.includes('urgent') || 
        input.includes('can\'t breathe') || input.includes('severe chest pain')) {
      return '🚨 **This sounds like a medical emergency.** Please call emergency services immediately or go to the nearest emergency room. I cannot provide emergency medical care through this chat.\n\nFor immediate help, call your local emergency number.';
    }
    
    // If we're in an ongoing assessment
    if (assessmentState) {
      const { stage, responses } = assessmentState;
      
      // Store the user's response based on current stage
      if (stage === 'duration') {
        responses.duration = userInput;
        setAssessmentState({ ...assessmentState, stage: 'severity', responses });
        return getNextQuestion({ ...assessmentState, stage: 'severity', responses });
      } else if (stage === 'severity') {
        responses.severity = userInput;
        setAssessmentState({ ...assessmentState, stage: 'associated', responses });
        return getNextQuestion({ ...assessmentState, stage: 'associated', responses });
      } else if (stage === 'associated') {
        responses.associated = userInput;
        setAssessmentState({ ...assessmentState, stage: 'triggers', responses });
        return getNextQuestion({ ...assessmentState, stage: 'triggers', responses });
      } else if (stage === 'triggers') {
        responses.triggers = userInput;
        setAssessmentState({ ...assessmentState, stage: 'conclusion', responses });
        return getNextQuestion({ ...assessmentState, stage: 'conclusion', responses });
      } else if (stage === 'conclusion') {
        // Reset assessment state for new conversation
        setAssessmentState(null);
        return 'Thank you for sharing your concerns with me. What other health questions can I help you with today?';
      }
    }
    
    // Detect new symptom and start assessment
    const detectedSymptom = detectSymptom(input);
    if (detectedSymptom) {
      const newState: AssessmentState = {
        symptom: detectedSymptom,
        stage: 'initial',
        responses: {}
      };
      setAssessmentState(newState);
      return getNextQuestion(newState);
    }
    
    // General response for unrecognized symptoms
    return 'I understand you\'re experiencing some health concerns. To help me better assess your situation, could you tell me what specific symptoms you\'re experiencing? For example, are you having pain, fever, digestive issues, or something else?';
  };

  const renderMessage = (message: ChatMessage) => (
    <View key={message.id} style={styles.messageContainer}>
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          {message.text}
        </Text>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={styles.messageContainer}>
      <View style={[styles.messageBubble, styles.aiBubble]}>
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color="#666666" />
          <Text style={styles.typingText}>Dr. Iffa is typing...</Text>
        </View>
      </View>
    </View>
  );

  return (
    Platform.OS === 'ios' ? (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={'padding'}
          keyboardVerticalOffset={12}
        >
          {/* Chat Messages */}
          <View style={styles.chatContainer}>
          <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.messagesContent,
              isAndroid ? { paddingBottom: 88 } : null,
            ]}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)}
            >
              {messages.map(renderMessage)}
              {isTyping && renderTypingIndicator()}
            </ScrollView>
          </View>

          {/* Input Area */}
          <View
            style={[
              styles.inputArea,
              isAndroid
                ? { position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 12, backgroundColor: '#FFFFFF' }
                : { paddingBottom: 20 },
            ]}
          >
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Message"
                  value={inputText}
                  onChangeText={setInputText}
                  onFocus={() => {
                    setIsInputFocused(true);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                  onBlur={() => setIsInputFocused(false)}
                  multiline
                  maxLength={500}
                  placeholderTextColor="#8E8E93"
                  textAlignVertical="center"
                  returnKeyType="send"
                  blurOnSubmit={false}
                  autoCorrect={true}
                  autoCapitalize="sentences"
                  enablesReturnKeyAutomatically={true}
                  onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    inputText.trim() === '' && styles.sendButtonDisabled
                  ]}
                  onPress={sendMessage}
                  disabled={inputText.trim() === ''}
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                >
                  <SimpleIcon name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    ) : (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {/* No SafeAreaView / KAV on Android; rely on adjustResize */}
        <View style={{ flex: 1 }}>
          {/* Chat Messages */}
          <View style={styles.chatContainer}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)}
            >
              {messages.map(renderMessage)}
              {isTyping && renderTypingIndicator()}
            </ScrollView>
          </View>

          {/* Input Area */}
          <View style={[styles.inputArea, { paddingBottom: 12 }]}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Message"
                  value={inputText}
                  onChangeText={setInputText}
                  onFocus={() => {
                    setIsInputFocused(true);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                  onBlur={() => setIsInputFocused(false)}
                  multiline
                  maxLength={500}
                  placeholderTextColor="#8E8E93"
                  textAlignVertical="center"
                  returnKeyType="send"
                  blurOnSubmit={false}
                  autoCorrect={true}
                  autoCapitalize="sentences"
                  enablesReturnKeyAutomatically={true}
                  onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    inputText.trim() === '' && styles.sendButtonDisabled
                  ]}
                  onPress={sendMessage}
                  disabled={inputText.trim() === ''}
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                >
                  <SimpleIcon name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  

  // Chat Container
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingBottom: 20,
  },

  // Messages
  messageContainer: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#F2F2F7',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  aiMessageText: {
    color: '#000000',
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
    textAlign: 'right',
  },

  // Typing Indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginLeft: 8,
  },

  // Input Area
  inputArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: Platform.OS === 'ios' ? 20 : 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    minHeight: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
    elevation: 0,
    shadowOpacity: 0,
  },
});

export default AIAssistantScreen;