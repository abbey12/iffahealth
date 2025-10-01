import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  Clipboard,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import {apiService} from '../services/apiService';
import paystackService from '../services/paystackService';

interface PaymentScreenProps {
  navigation: any;
  route: {
    params: {
      appointmentId: string;
      doctorId: string;
      doctorName: string;
      specialty: string;
      consultationFee: number;
      appointmentDate: string;
      appointmentTime: string;
      patientId: string;
      patientEmail: string;
      meetLink?: any; // Google Meet link
    };
  };
}

const PaymentScreen = ({navigation, route}: PaymentScreenProps): React.JSX.Element => {
  const {
    appointmentId,
    doctorId,
    doctorName,
    specialty,
    consultationFee,
    appointmentDate,
    appointmentTime,
    patientId,
    patientEmail,
    meetLink,
  } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [lastReference, setLastReference] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const lastVerificationRef = useRef<string | null>(null);

  const handleVerification = useCallback(
    async (reference: string) => {
      try {
        setVerificationStatus('pending');
        setLastReference(reference);
        const verificationResponse = await paystackService.verifyPayment(reference);

        if (verificationResponse.data.status === 'success') {
          lastVerificationRef.current = reference;
          setVerificationStatus('success');
          
                 // Update appointment status after successful payment
                 try {
                   await apiService.updateAppointment(appointmentId, {
                     status: 'confirmed', // Confirm appointment after payment
                   });

                   console.log('✅ Appointment confirmed after payment');
                 } catch (error) {
                   console.error('❌ Error updating appointment:', error);
                   // Continue with success flow even if update fails
                 }
          
          setShowSuccessModal(true);
      Alert.alert(
        'Payment Successful!',
        'Your appointment has been booked and payment processed successfully.',
        [
          {
            text: 'View Appointments',
            onPress: () => {
              navigation.navigate('Appointments', {
                screen: 'AppointmentsList',
                params: {
                  refresh: Date.now(),
                  highlightPayment: {
                    reference,
                    amount: verificationResponse.data.amount,
                    status: verificationResponse.data.status,
                  },
                },
              });
            },
          },
        ],
      );
        } else {
          setVerificationStatus('failed');
        Alert.alert(
          'Payment Incomplete',
          `Status reported by Paystack: ${verificationResponse.data.status}. Please try again or contact support if you have been debited.`,
          [
            {
              text: 'Retry Verification',
              onPress: () => handleVerification(reference),
            },
            {text: 'Close'},
          ],
        );
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('failed');
        Alert.alert('Verification Error', 'Failed to verify payment. Please contact support.');
      }
    },
    [navigation],
  );

  useEffect(() => {
    const handleLink = ({url}: {url: string}) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'iffahealth:' && parsed.host === 'payment-callback') {
          const reference = parsed.searchParams.get('reference');
          if (reference && reference !== lastVerificationRef.current) {
            lastVerificationRef.current = reference;
            handleVerification(reference);
          }
        }
      } catch (error) {
        console.error('Error processing deep link in PaymentScreen:', error);
      }
    };

    const subscription = Linking.addEventListener('url', handleLink);

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        handleLink({url: initialUrl});
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleVerification]);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await apiService.getPaymentMethods();
      setPaymentMethods(response.data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods([]); // Set empty array on error
    }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Initialize payment with Paystack
      const paymentResponse = await paystackService.initializePayment({
        amount: consultationFee,
        email: patientEmail,
        reference: `IFFA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          appointmentId: appointmentId, // Use the real appointment ID passed from BookAppointmentScreen
          patientId,
          doctorId,
          doctorName,
          appointmentDate,
          appointmentTime,
        },
      });

      console.log('💳 Paystack initialize response:', paymentResponse);

      setPaymentData(paymentResponse.data);
      lastVerificationRef.current = paymentResponse.data.reference;

      // Open Paystack checkout
      const authorizationUrl = paymentResponse.data.authorization_url;
      console.log('🔗 Opening Paystack URL:', authorizationUrl);
      
      // Check if URL is valid
      if (!authorizationUrl || !authorizationUrl.startsWith('https://')) {
        console.error('❌ Invalid authorization URL:', authorizationUrl);
        Alert.alert('Error', 'Invalid payment URL received. Please try again.');
        return;
      }
      
      try {
        // Try to open the URL directly
        const canOpen = await Linking.canOpenURL(authorizationUrl);
        console.log('🔍 Can open URL:', canOpen);
        
        if (canOpen) {
          await Linking.openURL(authorizationUrl);
          setVerificationStatus('pending');
          setLastReference(paymentResponse.data.reference);
          console.log('✅ Successfully opened Paystack URL');
        } else {
          // Fallback: try to open anyway
          console.log('⚠️ canOpenURL returned false, trying to open anyway...');
          await Linking.openURL(authorizationUrl);
          setVerificationStatus('pending');
          setLastReference(paymentResponse.data.reference);
          console.log('✅ Successfully opened Paystack URL (fallback)');
        }
      } catch (error) {
        console.error('❌ Error opening Paystack URL:', error);
        
        // Show the URL to the user as a fallback
        Alert.alert(
          'Payment Page', 
          `Please open this URL in your browser to complete payment:\n\n${authorizationUrl}`,
          [
            {
              text: 'Copy URL',
              onPress: () => {
                // Copy to clipboard if available
                if (Clipboard && Clipboard.setString) {
                  Clipboard.setString(authorizationUrl);
                  Alert.alert('Copied', 'Payment URL copied to clipboard');
                }
              }
            },
            {
              text: 'OK',
              onPress: () => {
                setVerificationStatus('pending');
                setLastReference(paymentResponse.data.reference);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', 'Failed to initialize payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentVerification = async (reference: string) => {
    await handleVerification(reference);
  };

  const renderPaymentMethod = (method: any) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethodCard,
        selectedMethod === method.id && styles.selectedPaymentMethod,
      ]}
      onPress={() => setSelectedMethod(method.id)}>
      <View style={styles.paymentMethodContent}>
        <SimpleIcon
          name={
            method.type === 'card'
              ? 'credit-card'
              : method.type === 'bank'
              ? 'account-balance'
              : 'phone-android'
          }
          size={24}
          color={selectedMethod === method.id ? '#1976D2' : '#666'}
        />
        <Text
          style={[
            styles.paymentMethodText,
            selectedMethod === method.id && styles.selectedPaymentMethodText,
          ]}>
          {method.name}
        </Text>
        {selectedMethod === method.id && (
          <SimpleIcon name="check-circle" size={20} color="#1976D2" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <SimpleIcon name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
        </View>

        {/* Appointment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Appointment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Doctor:</Text>
            <Text style={styles.summaryValue}>{doctorName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Specialty:</Text>
            <Text style={styles.summaryValue}>{specialty}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{appointmentDate}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{appointmentTime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type:</Text>
            <Text style={styles.summaryValue}>Video Call</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethodsSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods && paymentMethods.length > 0 ? paymentMethods.map(renderPaymentMethod) : (
            <View style={styles.loadingContainer}>
              <SimpleIcon name="info" size={20} color="#1976D2" />
              <Text style={styles.loadingText}>Payment methods are currently not available. Please proceed with default card payment.</Text>
            </View>
          )}
        </View>

        {/* Payment Summary */}
        <View style={styles.paymentSummaryCard}>
          <View style={styles.paymentSummaryRow}>
            <Text style={styles.paymentSummaryLabel}>Consultation Fee:</Text>
            <Text style={styles.paymentSummaryValue}>₵{consultationFee}</Text>
          </View>
          <View style={styles.paymentSummaryRow}>
            <Text style={styles.paymentSummaryLabel}>Platform Fee:</Text>
            <Text style={styles.paymentSummaryValue}>₵0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.paymentSummaryRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₵{consultationFee}</Text>
          </View>
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          style={[styles.payButton, isLoading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <SimpleIcon name="payment" size={20} color="#FFFFFF" />
              <Text style={styles.payButtonText}>Pay ₵{consultationFee}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <SimpleIcon name="security" size={16} color="#4CAF50" />
          <Text style={styles.securityText}>
            Your payment is secured by Paystack. We never store your card details.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={verificationStatus === 'pending'} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.modalTitle}>Processing Payment</Text>
            <Text style={styles.modalMessage}>
              We are verifying your payment with Paystack. Please do not close this screen.
            </Text>
            {lastReference && (
              <TouchableOpacity style={styles.retryButton} onPress={() => handleVerification(lastReference)}>
                <Text style={styles.retryButtonText}>Retry Verification</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.successCard}>
            <SimpleIcon name="check-circle" size={48} color="#4CAF50" />
            <Text style={styles.modalTitle}>Payment Successful</Text>
            <Text style={styles.modalMessage}>
              Your appointment has been booked and payment completed successfully.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setShowSuccessModal(false);
                // Navigate to appointments screen after successful payment
                navigation.navigate('Appointments', {
                  screen: 'AppointmentsList',
                  params: {
                    refresh: Date.now(),
                    highlightPayment: {
                      reference: lastReference,
                      amount: consultationFee,
                      status: 'success',
                    },
                  },
                });
              }}>
              <SimpleIcon name="event" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Go to Appointments</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  paymentMethodsSection: {
    margin: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 16,
  },
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedPaymentMethod: {
    borderColor: '#1976D2',
    backgroundColor: '#F3F8FF',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    color: '#333',
  },
  selectedPaymentMethodText: {
    color: '#1976D2',
    fontWeight: '500',
  },
  paymentSummaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentSummaryValue: {
    fontSize: 14,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  payButton: {
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  payButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 8,
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  successCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1976D2',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1976D2',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PaymentScreen;
