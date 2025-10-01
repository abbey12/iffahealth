import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../components/SimpleIcon';

interface PayoutMethod {
  type: 'mobile_money';
  provider: 'MTN' | 'Airtel' | 'Vodafone';
  number: string;
  isDefault: boolean;
}

const AddPayoutMethodScreen = ({navigation}: any): React.JSX.Element => {
  const [selectedProvider, setSelectedProvider] = useState<'MTN' | 'Airtel' | 'Vodafone'>('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const providers = [
    {id: 'MTN', name: 'MTN Mobile Money', color: '#FFD700', icon: 'phone'},
    {id: 'Airtel', name: 'AirtelTigo Money', color: '#E60012', icon: 'phone'},
    {id: 'Vodafone', name: 'Vodafone Cash', color: '#E60012', icon: 'phone'},
  ];

  const validatePhoneNumber = (number: string, provider: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    
    switch (provider) {
      case 'MTN':
        return /^0(24|54|55|59)\d{7}$/.test(cleanNumber);
      case 'Airtel':
        return /^0(26|56|66)\d{7}$/.test(cleanNumber);
      case 'Vodafone':
        return /^0(20|50|57)\d{7}$/.test(cleanNumber);
      default:
        return false;
    }
  };

  const handleSave = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber, selectedProvider)) {
      Alert.alert(
        'Invalid Number',
        `Please enter a valid ${selectedProvider} phone number. ${selectedProvider} numbers should start with the correct prefix.`
      );
      return;
    }

    setIsLoading(true);

    try {
      // In real app, this would make API call to save payout method
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Success',
        'Payout method added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add payout method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as 0XX XXX XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const renderProviderOption = (provider: any) => (
    <TouchableOpacity
      key={provider.id}
      style={[
        styles.providerOption,
        selectedProvider === provider.id && styles.providerOptionSelected,
      ]}
      onPress={() => setSelectedProvider(provider.id)}>
      <View style={styles.providerLeft}>
        <View style={[styles.providerIcon, {backgroundColor: provider.color}]}>
          <SimpleIcon name={provider.icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={[
          styles.providerName,
          selectedProvider === provider.id && styles.providerNameSelected,
        ]}>
          {provider.name}
        </Text>
      </View>
      {selectedProvider === provider.id && (
        <SimpleIcon name="checkmark-circle" size={24} color="#1976D2" />
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <SimpleIcon name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Payout Method</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Provider Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Mobile Money Provider</Text>
            <Text style={styles.sectionSubtitle}>
              Choose your preferred mobile money service provider
            </Text>
            
            <View style={styles.providerList}>
              {providers.map(renderProviderOption)}
            </View>
          </View>

          {/* Phone Number Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phone Number</Text>
            <Text style={styles.sectionSubtitle}>
              Enter your {selectedProvider} mobile money registered phone number
            </Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <SimpleIcon name="phone" size={20} color="#666666" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder={`Enter ${selectedProvider} number`}
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                keyboardType="phone-pad"
                maxLength={12}
                autoCapitalize="none"
              />
            </View>
            
            <Text style={styles.inputHint}>
              {selectedProvider} numbers start with: {
                selectedProvider === 'MTN' ? '024, 054, 055, 059' :
                selectedProvider === 'Airtel' ? '026, 056, 066' :
                '020, 050, 057'
              }
            </Text>
          </View>

          {/* Default Option */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.defaultOption}
              onPress={() => setIsDefault(!isDefault)}>
              <View style={styles.defaultLeft}>
                <View style={[
                  styles.checkbox,
                  isDefault && styles.checkboxSelected,
                ]}>
                  {isDefault && (
                    <SimpleIcon name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.defaultTextContainer}>
                  <Text style={styles.defaultTitle}>Set as Default</Text>
                  <Text style={styles.defaultSubtitle}>
                    Use this method for automatic payouts
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <SimpleIcon name="security" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>
              Your payout information is encrypted and secure. We never store your full phone number.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!phoneNumber.trim() || isLoading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!phoneNumber.trim() || isLoading}>
          <LinearGradient
            colors={['#1976D2', '#42A5F5']}
            style={styles.saveButtonGradient}>
            {isLoading ? (
              <Text style={styles.saveButtonText}>Adding...</Text>
            ) : (
              <>
                <SimpleIcon name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Add Payout Method</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  providerList: {
    gap: 12,
  },
  providerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  providerOptionSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  providerNameSelected: {
    color: '#1976D2',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  defaultOption: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  defaultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  defaultTextContainer: {
    flex: 1,
  },
  defaultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  defaultSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default AddPayoutMethodScreen;
