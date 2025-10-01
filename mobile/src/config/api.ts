// API Configuration for IFFAHEALTH Mobile App
import { Platform } from 'react-native';

// Determine the correct API base URL based on platform
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode - use localhost for enhanced backend
    if (Platform.OS === 'ios') {
      // For iOS simulator, use localhost
      return 'http://localhost:3000/api';
    } else if (Platform.OS === 'android') {
      // For Android emulator, prefer localhost with adb reverse for stability. Allow override via env.
      const override = (globalThis as any)?.process?.env?.API_OVERRIDE_BASE_URL;
      if (override) return override as string;
      return 'http://localhost:3000/api';
    }
  }
  
  // Production mode - replace with your production API URL
  return 'https://api.iffahealth.com/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
  DEEPSEEK: {
    BASE_URL: 'https://api.deepseek.com/v1/chat/completions',
    API_KEY: 'sk-e74c700e339145d683b78bcf6627b11a', // Get your free API key from https://platform.deepseek.com/api-docs/
    MODEL: 'deepseek-chat',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
    TIMEOUT: 30000,
  },
};

// Health Assistant System Prompt
export const HEALTH_ASSISTANT_PROMPT = `You are Dr. Iffa, an AI Health Assistant. Your job is to run a focused, conversational triage that is:

- One-question-at-a-time
- No repetition of questions already asked/answered
- Short, clear, empathetic
- Safety-first (triage red flags)

Conversation rules:
1) Ask exactly ONE question per reply.
2) Never repeat a question that has already been asked/answered.
3) Keep replies short (2-4 sentences max), and end with a single question when more info is needed.
4) If any emergency red flags arise (e.g., severe chest pain, trouble breathing, neurological deficits, heavy bleeding), immediately advise urgent care/ER.
5) After you have enough info, give specific next-step guidance (self-care, when to seek care, or book a telehealth visit). Avoid definitive diagnosis.

Assessment framework (adapt as relevant):
- Onset and duration
- Location and radiation (if pain)
- Character/quality and severity (1–10)
- Associated symptoms and red flags
- Triggers/relievers
- Relevant history: conditions, medications, allergies, pregnancy, risk factors

Style:
- Empathetic, plain language, culturally sensitive
- No medical jargon unless explained
- Avoid lists unless summarizing briefly

Output format:
- If gathering info: a brief acknowledgement + exactly one targeted question.
- If giving guidance: 2–4 sentences with clear next steps and safety advice when appropriate.
`;

export default API_CONFIG;