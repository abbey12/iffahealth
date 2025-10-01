import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';

interface PayoutRequest {
  id: string;
  doctorId: string;
  amount: number;
  method: string;
  accountDetails: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestDate: string;
  processedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const PayoutTrackingScreen = ({navigation}: any): React.JSX.Element => {
  const {doctor} = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');

  useEffect(() => {
    loadPayoutRequests();
  }, []);

  const loadPayoutRequests = async () => {
    if (!doctor?.id) {
      console.log('No doctor ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('💳 Loading payout requests for doctor:', doctor.id);

      const response = await apiService.getPayoutRequests(doctor.id, {
        page: 1,
        limit: 50,
        status: selectedStatus === 'all' ? undefined : selectedStatus
      });

      console.log('📊 Payout Requests API Response:', response);

      if (response.success && response.data) {
        setPayoutRequests(response.data);
        console.log('✅ Loaded payout requests:', response.data.length, 'requests');
      } else {
        console.log('❌ No payout requests data in response');
        setPayoutRequests([]);
      }
    } catch (err) {
      console.error('❌ Error loading payout requests:', err);
      setError('Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayoutRequests();
    setRefreshing(false);
  };

  // Reload when status filter changes
  useEffect(() => {
    loadPayoutRequests();
  }, [selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'processing': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'cancelled': return '#9E9E9E';
      default: return '#666666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time';
      case 'processing': return 'refresh';
      case 'completed': return 'checkmark-circle';
      case 'failed': return 'close-circle';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `GHS ${amount.toFixed(2)}`;
  };

  const handleCancelRequest = (requestId: string) => {
    if (!doctor?.id) return;

    Alert.alert(
      'Cancel Payout Request',
      'Are you sure you want to cancel this payout request?',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.cancelPayoutRequest(doctor.id, requestId);
              if (response.success) {
                Alert.alert('Success', 'Payout request cancelled successfully');
                await loadPayoutRequests();
              } else {
                Alert.alert('Error', 'Failed to cancel payout request');
              }
            } catch (err) {
              console.error('❌ Error cancelling payout request:', err);
              Alert.alert('Error', 'Failed to cancel payout request');
            }
          },
        },
      ]
    );
  };

  const handleRetryRequest = (requestId: string) => {
    if (!doctor?.id) return;

    Alert.alert(
      'Retry Payout Request',
      'Do you want to retry this failed payout request?',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Retry',
          onPress: async () => {
            try {
              const response = await apiService.retryPayoutRequest(doctor.id, requestId);
              if (response.success) {
                Alert.alert('Success', 'Payout request retried successfully');
                await loadPayoutRequests();
              } else {
                Alert.alert('Error', 'Failed to retry payout request');
              }
            } catch (err) {
              console.error('❌ Error retrying payout request:', err);
              Alert.alert('Error', 'Failed to retry payout request');
            }
          },
        },
      ]
    );
  };

  const filteredRequests = payoutRequests.filter(request => 
    selectedStatus === 'all' || request.status === selectedStatus
  );

  const renderStatusFilter = (status: string, label: string) => (
    <TouchableOpacity
      key={status}
      style={[
        styles.filterButton,
        selectedStatus === status && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedStatus(status as any)}>
      <Text style={[
        styles.filterButtonText,
        selectedStatus === status && styles.filterButtonTextActive,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPayoutRequest = (request: PayoutRequest) => {
    const accountDetails = typeof request.accountDetails === 'string' 
      ? JSON.parse(request.accountDetails) 
      : request.accountDetails;

    let displayMethod = 'Unknown Method';
    if (request.method === 'mobile_money' && accountDetails?.phone_number) {
      displayMethod = `Mobile Money - ${accountDetails.phone_number}`;
    } else if (request.method === 'bank_transfer' && accountDetails?.account_number) {
      displayMethod = `Bank Transfer - ${accountDetails.account_number}`;
    }

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.requestAmount}>{formatCurrency(request.amount)}</Text>
            <Text style={styles.requestReference}>ID: {request.id.slice(0, 8)}</Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: getStatusColor(request.status)}]}>
            <SimpleIcon name={getStatusIcon(request.status)} size={16} color="#FFFFFF" />
            <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <SimpleIcon name="card" size={16} color="#666666" />
            <Text style={styles.detailText}>
              {displayMethod}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <SimpleIcon name="calendar" size={16} color="#666666" />
            <Text style={styles.detailText}>
              Requested: {formatDate(request.requestDate)}
            </Text>
          </View>

          {request.processedDate && (
            <View style={styles.detailRow}>
              <SimpleIcon name="refresh" size={16} color="#666666" />
              <Text style={styles.detailText}>
                Processed: {formatDate(request.processedDate)}
              </Text>
            </View>
          )}

          {request.notes && (
            <View style={styles.detailRow}>
              <SimpleIcon name="document-text" size={16} color="#666666" />
              <Text style={styles.detailText}>
                Notes: {request.notes}
              </Text>
            </View>
          )}
        </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {request.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelRequest(request.id)}>
            <SimpleIcon name="cancel" size={16} color="#F44336" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        
        {request.status === 'failed' && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => handleRetryRequest(request.id)}>
            <SimpleIcon name="refresh" size={16} color="#1976D2" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
        
        {request.status === 'completed' && (
          <View style={styles.completedBadge}>
            <SimpleIcon name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.completedText}>Payment Received</Text>
          </View>
        )}
      </View>
    </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading payout requests...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <SimpleIcon name="error" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPayoutRequests}>
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
        
        {/* Status Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderStatusFilter('all', 'All')}
            {renderStatusFilter('pending', 'Pending')}
            {renderStatusFilter('processing', 'Processing')}
            {renderStatusFilter('completed', 'Completed')}
            {renderStatusFilter('failed', 'Failed')}
          </ScrollView>
        </View>

        {/* Payout Requests */}
        <View style={styles.requestsContainer}>
          {payoutRequests.length > 0 ? (
            payoutRequests.map(renderPayoutRequest)
          ) : (
            <View style={styles.emptyContainer}>
              <SimpleIcon name="receipt" size={60} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Payout Requests</Text>
              <Text style={styles.emptySubtitle}>
                {selectedStatus === 'all' 
                  ? 'You haven\'t made any payout requests yet'
                  : `No ${selectedStatus} payout requests found`
                }
              </Text>
            </View>
          )}
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
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#1976D2',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  requestsContainer: {
    padding: 20,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  requestReference: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  requestDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E8F5E8',
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default PayoutTrackingScreen;
