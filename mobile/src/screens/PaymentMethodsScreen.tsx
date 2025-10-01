import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';

interface PaymentMethod {
  id: string;
  method_type: string;
  provider: string;
  account_details: any;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PaymentMethodsScreen = ({navigation}: any): React.JSX.Element => {
  const {doctor} = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    provider: '',
    account_name: '',
    phone_number: '',
    account_number: '',
    bank_name: '',
    routing_number: '',
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    if (!doctor?.id) {
      console.log('No doctor ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('💳 Loading payment methods for doctor:', doctor.id);

      const response = await apiService.getDoctorPayoutMethods(doctor.id);

      console.log('📊 Payment Methods API Response:', response);

      if (response.success && response.data) {
        setPaymentMethods(response.data);
        console.log('✅ Loaded payment methods:', response.data.length, 'methods');
      } else {
        console.log('❌ No payment methods data in response');
        setPaymentMethods([]);
      }
    } catch (err) {
      console.error('❌ Error loading payment methods:', err);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaymentMethods();
    setRefreshing(false);
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    const accountDetails = typeof method.account_details === 'string' 
      ? JSON.parse(method.account_details) 
      : method.account_details;
    
    setFormData({
      provider: method.provider,
      account_name: accountDetails.account_name || '',
      phone_number: accountDetails.phone_number || '',
      account_number: accountDetails.account_number || '',
      bank_name: accountDetails.bank_name || '',
      routing_number: accountDetails.routing_number || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateMethod = async () => {
    if (!editingMethod || !doctor?.id) return;

    try {
      const accountDetails: any = {};
      
      if (editingMethod.method_type === 'mobile_money') {
        accountDetails.account_name = formData.account_name;
        accountDetails.phone_number = formData.phone_number;
      } else if (editingMethod.method_type === 'bank_transfer') {
        accountDetails.account_name = formData.account_name;
        accountDetails.account_number = formData.account_number;
        accountDetails.bank_name = formData.bank_name;
        if (formData.routing_number) {
          accountDetails.routing_number = formData.routing_number;
        }
      }

      const updateData = {
        method_type: editingMethod.method_type,
        provider: formData.provider,
        account_details: accountDetails,
        is_default: editingMethod.is_default,
      };

      console.log('🔄 Updating payment method:', updateData);

      const response = await apiService.updateDoctorPayoutMethod(
        doctor.id,
        editingMethod.id,
        updateData
      );

      if (response.success) {
        Alert.alert('Success', 'Payment method updated successfully!');
        setShowEditModal(false);
        setEditingMethod(null);
        await loadPaymentMethods();
      } else {
        Alert.alert('Error', 'Failed to update payment method');
      }
    } catch (err) {
      console.error('❌ Error updating payment method:', err);
      Alert.alert('Error', 'Failed to update payment method');
    }
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    if (!doctor?.id) return;

    try {
      const accountDetails = typeof method.account_details === 'string' 
        ? JSON.parse(method.account_details) 
        : method.account_details;

      const updateData = {
        method_type: method.method_type,
        provider: method.provider,
        account_details: accountDetails,
        is_default: true,
      };

      console.log('⭐ Setting default payment method:', updateData);

      const response = await apiService.updateDoctorPayoutMethod(
        doctor.id,
        method.id,
        updateData
      );

      if (response.success) {
        Alert.alert('Success', 'Default payment method updated!');
        await loadPaymentMethods();
      } else {
        Alert.alert('Error', 'Failed to set default payment method');
      }
    } catch (err) {
      console.error('❌ Error setting default payment method:', err);
      Alert.alert('Error', 'Failed to set default payment method');
    }
  };

  const handleDeleteMethod = async (method: PaymentMethod) => {
    if (!doctor?.id) return;

    Alert.alert(
      'Delete Payment Method',
      `Are you sure you want to delete this ${method.provider} payment method?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteDoctorPayoutMethod(
                doctor.id,
                method.id
              );

              if (response.success) {
                Alert.alert('Success', 'Payment method deleted successfully!');
                await loadPaymentMethods();
              } else {
                Alert.alert('Error', 'Failed to delete payment method');
              }
            } catch (err) {
              console.error('❌ Error deleting payment method:', err);
              Alert.alert('Error', 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

  const getMethodIcon = (methodType: string) => {
    switch (methodType) {
      case 'mobile_money':
        return 'phone';
      case 'bank_transfer':
        return 'card';
      case 'paypal':
        return 'logo-paypal';
      default:
        return 'help';
    }
  };

  const getMethodColor = (methodType: string) => {
    switch (methodType) {
      case 'mobile_money':
        return '#4CAF50';
      case 'bank_transfer':
        return '#2196F3';
      case 'paypal':
        return '#0070BA';
      default:
        return '#666666';
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => {
    const accountDetails = typeof method.account_details === 'string' 
      ? JSON.parse(method.account_details) 
      : method.account_details;

    let displayNumber = 'Not configured';
    if (method.method_type === 'mobile_money' && accountDetails.phone_number) {
      displayNumber = accountDetails.phone_number;
    } else if (method.method_type === 'bank_transfer' && accountDetails.account_number) {
      displayNumber = accountDetails.account_number;
    }

    return (
      <View key={method.id} style={styles.paymentMethodItem}>
        <View style={styles.methodLeft}>
          <View style={[styles.methodIcon, {backgroundColor: getMethodColor(method.method_type)}]}>
            <SimpleIcon 
              name={getMethodIcon(method.method_type)} 
              size={24} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.methodDetails}>
            <Text style={styles.methodProvider}>{method.provider}</Text>
            <Text style={styles.methodNumber}>{displayNumber}</Text>
            {accountDetails.account_name && (
              <Text style={styles.methodAccountName}>{accountDetails.account_name}</Text>
            )}
            {method.is_default && (
              <Text style={styles.defaultBadge}>Default</Text>
            )}
          </View>
        </View>
        <View style={styles.methodActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditMethod(method)}
          >
            <SimpleIcon name="create" size={20} color="#1976D2" />
          </TouchableOpacity>
          {!method.is_default && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSetDefault(method)}
            >
              <SimpleIcon name="star" size={20} color="#FF9800" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteMethod(method)}
          >
            <SimpleIcon name="trash" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <SimpleIcon name="error" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPaymentMethods}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <SimpleIcon name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddPaymentMethod')}
          >
            <SimpleIcon name="add" size={24} color="#1976D2" />
          </TouchableOpacity>
        </View>

        {/* Payment Methods List */}
        <View style={styles.content}>
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <SimpleIcon name="card" size={64} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Payment Methods</Text>
              <Text style={styles.emptyDescription}>
                Add your first payment method to start receiving payouts
              </Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => navigation.navigate('AddPaymentMethod')}
              >
                <SimpleIcon name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addFirstButtonText}>Add Payment Method</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Your Payment Methods</Text>
              {paymentMethods.map(renderPaymentMethod)}
            </>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowEditModal(false)}
            >
              <SimpleIcon name="close" size={24} color="#666666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Payment Method</Text>
            <TouchableOpacity 
              style={styles.modalSaveButton}
              onPress={handleUpdateMethod}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Provider</Text>
              <TextInput
                style={styles.input}
                value={formData.provider}
                onChangeText={(text) => setFormData({...formData, provider: text})}
                placeholder="Enter provider name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Account Name</Text>
              <TextInput
                style={styles.input}
                value={formData.account_name}
                onChangeText={(text) => setFormData({...formData, account_name: text})}
                placeholder="Enter account name"
              />
            </View>

            {editingMethod?.method_type === 'mobile_money' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone_number}
                  onChangeText={(text) => setFormData({...formData, phone_number: text})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>
            )}

            {editingMethod?.method_type === 'bank_transfer' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.bank_name}
                    onChangeText={(text) => setFormData({...formData, bank_name: text})}
                    placeholder="Enter bank name"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Number</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.account_number}
                    onChangeText={(text) => setFormData({...formData, account_number: text})}
                    placeholder="Enter account number"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Routing Number (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.routing_number}
                    onChangeText={(text) => setFormData({...formData, routing_number: text})}
                    placeholder="Enter routing number"
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  addButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodDetails: {
    flex: 1,
  },
  methodProvider: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  methodNumber: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  methodAccountName: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  defaultBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 4,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
});

export default PaymentMethodsScreen;
