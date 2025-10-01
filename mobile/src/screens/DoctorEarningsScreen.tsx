import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayout: number;
  totalPaid: number;
  currency: string;
}

interface Transaction {
  id: string;
  date: string;
  patientName: string;
  amount: number;
  type: 'consultation' | 'payout' | 'refund';
  status: 'completed' | 'pending' | 'processing';
  description: string;
}

interface PayoutMethod {
  id: string;
  type: 'mobile_money' | 'bank_transfer' | 'paypal';
  provider: string;
  number: string;
  isDefault: boolean;
  accountDetails?: any;
}

const DoctorEarningsScreen = ({navigation}: any): React.JSX.Element => {
  const {doctor} = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayout: 0,
    totalPaid: 0,
    currency: 'GHS',
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);

  useEffect(() => {
    loadEarningsData();
    loadPayoutMethods();
  }, []);

  useEffect(() => {
    console.log('🔍 Rendering payout methods:', payoutMethods.length, 'methods');
  }, [payoutMethods]);

  const loadEarningsData = async () => {
    if (!doctor?.id) {
      console.log('No doctor ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('💰 Loading earnings data for doctor:', doctor.id);

      // Fetch current month earnings
      const currentMonthResponse = await apiService.getDoctorEarnings(doctor.id, 'month');
      
      // Fetch last month earnings (we'll calculate this from the API response)
      const lastMonthResponse = await apiService.getDoctorEarnings(doctor.id, 'month');

      console.log('📊 Earnings API Response:', currentMonthResponse);

      if (currentMonthResponse.success && currentMonthResponse.data) {
        const summary = currentMonthResponse.data.summary;
        const recentEarnings = currentMonthResponse.data.recentEarnings || [];
        
        // Transform API data to UI format
        setEarningsData({
          totalEarnings: summary.totalEarnings || 0,
          thisMonth: summary.netEarnings || 0,
          lastMonth: 0, // We'll need to implement last month calculation
          pendingPayout: summary.totalEarnings - (summary.netEarnings || 0),
          totalPaid: summary.netEarnings || 0,
          currency: 'GHS',
        });

        // Transform recent earnings to transactions
        const transformedTransactions = recentEarnings.map((earning: any) => ({
          id: earning.id,
          date: earning.earnedDate || earning.createdAt,
          patientName: `${earning.patientFirstName || ''} ${earning.patientLastName || ''}`.trim() || 'Unknown Patient',
          amount: earning.netAmount || earning.amount || 0,
          status: earning.status || 'completed',
          type: 'consultation' as const,
          description: `Consultation with ${earning.patientFirstName || 'Patient'}`,
        }));

        setTransactions(transformedTransactions);
        console.log('✅ Transformed earnings data:', transformedTransactions.length, 'transactions');
      } else {
        console.log('❌ No earnings data in response');
        setEarningsData({
          totalEarnings: 0,
          thisMonth: 0,
          lastMonth: 0,
          pendingPayout: 0,
          totalPaid: 0,
          currency: 'GHS',
        });
        setTransactions([]);
      }
    } catch (err) {
      console.error('❌ Error loading earnings data:', err);
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = () => {
    // Transactions are now loaded as part of loadEarningsData
    // This function is kept for compatibility but does nothing
  };

  const loadPayoutMethods = async () => {
    if (!doctor?.id) {
      console.log('No doctor ID available for payout methods');
      return;
    }

    try {
      console.log('💳 Loading payout methods for doctor:', doctor.id);

      // Get doctor's configured payout methods
      const doctorMethodsResponse = await apiService.getDoctorPayoutMethods(doctor.id);

      console.log('📊 Doctor Payout Methods API Response:', doctorMethodsResponse);

      if (doctorMethodsResponse.success && doctorMethodsResponse.data) {
        const configuredMethods = doctorMethodsResponse.data || [];
        
        // Transform configured methods to UI format
        const transformedMethods = configuredMethods.map((method: any) => {
          const accountDetails = typeof method.account_details === 'string' 
            ? JSON.parse(method.account_details) 
            : method.account_details;
          
          let displayNumber = 'Not configured';
          if (method.method_type === 'mobile_money' && accountDetails.phone_number) {
            displayNumber = accountDetails.phone_number;
          } else if (method.method_type === 'bank_transfer' && accountDetails.account_number) {
            displayNumber = accountDetails.account_number;
          }

          return {
            id: method.id,
            type: method.method_type,
            provider: method.provider,
            number: displayNumber,
            isDefault: method.is_default,
            accountDetails: accountDetails,
          };
        });

        setPayoutMethods(transformedMethods);
        console.log('✅ Transformed payout methods:', transformedMethods.length, 'methods');
        console.log('📋 Payout methods data:', JSON.stringify(transformedMethods, null, 2));
      } else {
        console.log('❌ No configured payout methods found');
        setPayoutMethods([]);
      }
    } catch (err) {
      console.error('❌ Error loading payout methods:', err);
      // Fallback to empty array on error
      setPayoutMethods([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadEarningsData(),
      loadPayoutMethods(),
    ]);
    setRefreshing(false);
  };

  const handleRequestPayout = () => {
    if (earningsData.pendingPayout < 50) {
      Alert.alert(
        'Minimum Payout',
        'Minimum payout amount is GHS 50.00. Continue earning to reach the minimum threshold.',
        [{text: 'OK'}]
      );
      return;
    }

    Alert.alert(
      'Request Payout',
      `Request payout of ${earningsData.currency} ${earningsData.pendingPayout.toFixed(2)} to your default mobile money account?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Request',
          onPress: () => {
            // In real app, this would make API call
            Alert.alert('Success', 'Payout request submitted successfully!');
          },
        },
      ]
    );
  };

  const handleAddPayoutMethod = () => {
    navigation.navigate('AddPayoutMethod');
  };

  const handleManagePayoutMethods = () => {
    navigation.navigate('PaymentMethods');
  };

  const handleTrackPayouts = () => {
    navigation.navigate('PayoutTracking');
  };

  const formatCurrency = (amount: number) => {
    return `${earningsData.currency} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'videocam';
      case 'payout':
        return 'cash';
      case 'refund':
        return 'refresh';
      default:
        return 'help';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return '#4CAF50';
      case 'payout':
        return '#2196F3';
      case 'refund':
        return '#FF9800';
      default:
        return '#666666';
    }
  };

  const renderEarningsCard = (title: string, amount: number, icon: string, color: string) => (
    <View style={styles.earningsCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <SimpleIcon name={icon} size={20} color={color} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Text style={styles.cardAmount}>{formatCurrency(amount)}</Text>
      </View>
    </View>
  );

  const renderTransactionItem = (transaction: Transaction) => (
    <View key={transaction.id} style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, {backgroundColor: getTransactionColor(transaction.type)}]}>
          <SimpleIcon 
            name={getTransactionIcon(transaction.type)} 
            size={20} 
            color="#FFFFFF" 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{transaction.description}</Text>
          <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
          {transaction.type === 'consultation' && (
            <Text style={styles.transactionPatient}>Patient: {transaction.patientName}</Text>
          )}
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          {color: transaction.type === 'payout' ? '#2196F3' : '#4CAF50'}
        ]}>
          {transaction.type === 'payout' ? '-' : '+'}{formatCurrency(transaction.amount)}
        </Text>
        <View style={[
          styles.statusBadge,
          {backgroundColor: transaction.status === 'completed' ? '#4CAF50' : '#FF9800'}
        ]}>
          <Text style={styles.statusText}>{transaction.status}</Text>
        </View>
      </View>
    </View>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <SimpleIcon name="error" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEarningsData}>
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
        
        {/* Earnings Overview */}
        <View style={styles.earningsSection}>
          <View style={styles.earningsGrid}>
            {renderEarningsCard('Total Earnings', earningsData.totalEarnings, 'cash', '#4CAF50')}
            {renderEarningsCard('This Month', earningsData.thisMonth, 'calendar', '#2196F3')}
            {renderEarningsCard('Pending Payout', earningsData.pendingPayout, 'time', '#FF9800')}
            {renderEarningsCard('Total Paid', earningsData.totalPaid, 'checkmark-circle', '#9C27B0')}
          </View>
        </View>

        {/* Payout Methods */}
        <View style={styles.payoutSection}>
          <Text style={styles.sectionTitle}>Payout Methods</Text>
          
          {payoutMethods.length === 0 ? (
            <View style={styles.noMethodsContainer}>
              <SimpleIcon name="warning" size={48} color="#FF9800" />
              <Text style={styles.noMethodsTitle}>No Payment Methods Set Up</Text>
              <Text style={styles.noMethodsDescription}>
                You need to set up at least one payment method to receive payouts. 
                Add your mobile money or bank account details to get started.
              </Text>
              <TouchableOpacity style={styles.setupMethodButton} onPress={handleAddPayoutMethod}>
                <SimpleIcon name="add" size={20} color="#FFFFFF" />
                <Text style={styles.setupMethodText}>Set Up Payment Method</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {payoutMethods.map((method) => (
                <TouchableOpacity 
                  key={method.id} 
                  style={styles.payoutMethodItem}
                  onPress={handleManagePayoutMethods}
                >
                  <SimpleIcon 
                    name={method.type === 'mobile_money' ? 'phone' : 'card'} 
                    size={20} 
                    color="#1976D2" 
                  />
                  <View style={styles.payoutMethodDetails}>
                    <Text style={styles.payoutMethodProvider}>{method.provider}</Text>
                    <Text style={styles.payoutMethodNumber}>
                      {method.number}
                    </Text>
                    {method.accountDetails && method.accountDetails.account_name && (
                      <Text style={styles.payoutMethodAccountName}>
                        {method.accountDetails.account_name}
                      </Text>
                    )}
                  </View>
                  <View style={styles.payoutMethodRight}>
                    {method.isDefault && (
                      <Text style={styles.defaultText}>Default</Text>
                    )}
                    <SimpleIcon 
                      name="chevron-right" 
                      size={16} 
                      color="#666666" 
                    />
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity style={styles.addMethodButton} onPress={handleAddPayoutMethod}>
                <SimpleIcon name="add" size={20} color="#1976D2" />
                <Text style={styles.addMethodText}>Add Another Method</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity style={styles.manageMethodsButton} onPress={handleManagePayoutMethods}>
            <SimpleIcon name="settings" size={20} color="#1976D2" />
            <Text style={styles.manageMethodsText}>Manage Payment Methods</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.trackPayoutsButton} onPress={handleTrackPayouts}>
            <SimpleIcon name="receipt" size={20} color="#1976D2" />
            <Text style={styles.trackPayoutsText}>Track Payouts</Text>
          </TouchableOpacity>
        </View>

        {/* Request Payout Button */}
        <View style={styles.payoutButtonContainer}>
          <TouchableOpacity
            style={[
              styles.payoutButton,
              {opacity: earningsData.pendingPayout < 50 ? 0.5 : 1}
            ]}
            onPress={handleRequestPayout}
            disabled={earningsData.pendingPayout < 50}>
            <SimpleIcon name="cash" size={20} color="#FFFFFF" />
            <Text style={styles.payoutButtonText}>
              Request Payout ({formatCurrency(earningsData.pendingPayout)})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {transactions.map(renderTransactionItem)}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  earningsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  earningsCard: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 8,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  payoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  payoutMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  payoutMethodDetails: {
    flex: 1,
    marginLeft: 12,
  },
  payoutMethodProvider: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  payoutMethodNumber: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  payoutMethodAccountName: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  payoutMethodRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 12,
  },
  manageMethodsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  manageMethodsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 12,
  },
  trackPayoutsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
    marginTop: 8,
  },
  trackPayoutsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 12,
  },
  payoutButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  payoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  transactionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transactionItem: {
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
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  transactionPatient: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  noMethodsContainer: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  noMethodsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  noMethodsDescription: {
    fontSize: 14,
    color: '#BF360C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  setupMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  setupMethodText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DoctorEarningsScreen;
