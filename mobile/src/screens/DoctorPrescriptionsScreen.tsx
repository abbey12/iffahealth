import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  prescriptionDate: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  notes?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  // These will be populated when fetching full prescription details
  medications?: Array<{
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    quantity: number;
    instructions?: string;
    createdAt: string;
  }>;
  totalMedications?: number;
}

const DoctorPrescriptionsScreen = ({navigation}: any): React.JSX.Element => {
  const {doctor} = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed' | 'cancelled' | 'expired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (doctor?.id) {
      loadPrescriptions();
    }
  }, [doctor?.id, selectedStatus]);

  const loadPrescriptions = async () => {
    if (!doctor?.id) {
      console.log('No doctor ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('💊 Loading prescriptions for doctor:', doctor.id);
      console.log('💊 Selected status filter:', selectedStatus);

      const response = await apiService.getDoctorPrescriptions(doctor.id, {
        page: 1,
        limit: 50,
        status: selectedStatus === 'all' ? undefined : selectedStatus
      });

      console.log('📊 Prescriptions API Response:', response);

      if (response.success && response.data) {
        // Transform API data to match our interface
        const transformedPrescriptions = response.data.map((prescription: any) => ({
          id: prescription.id,
          patientId: prescription.patientId,
          patientName: prescription.patientName || 'Unknown Patient',
          patientPhone: prescription.patientPhone,
          prescriptionDate: prescription.prescriptionDate || prescription.createdAt,
          status: prescription.status as 'active' | 'completed' | 'cancelled' | 'expired',
          notes: prescription.notes,
          followUpDate: prescription.followUpDate,
          createdAt: prescription.createdAt,
          updatedAt: prescription.updatedAt,
          totalMedications: 0
        }));

        // Fetch items count per prescription
        const withCounts = await Promise.all(transformedPrescriptions.map(async (p: any) => {
          try {
            const itemsResp = await apiService.getPrescriptionItems(p.id);
            if (itemsResp?.success && Array.isArray(itemsResp.data)) {
              return { ...p, totalMedications: itemsResp.data.length };
            }
          } catch {}
          return p;
        }));

        setPrescriptions(withCounts);
        console.log('✅ Loaded prescriptions:', withCounts.length, 'prescriptions');
      } else {
        console.log('❌ No prescriptions data in response');
        setPrescriptions([]);
      }
    } catch (err) {
      console.error('❌ Error loading prescriptions:', err);
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrescriptions();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      case 'expired': return '#FF9800';
      default: return '#666666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'checkmark-circle';
      case 'completed': return 'done';
      case 'cancelled': return 'close-circle';
      case 'expired': return 'time';
      default: return 'help';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleViewPrescription = (prescription: Prescription) => {
    navigation.navigate('PrescriptionDetail', {prescription});
  };

  const handleCreatePrescription = () => {
    navigation.navigate('NewPrescription');
  };

  const handleEditPrescription = (prescription: Prescription) => {
    navigation.navigate('PrescriptionDetail', { prescription, mode: 'edit' });
  };

  const handleRefillPrescription = (prescription: Prescription) => {
    Alert.alert(
      'Refill Prescription',
      `Refill prescription for ${prescription.patientName}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Refill',
          onPress: () => {
            // In real app, this would make API call
            Alert.alert('Success', 'Prescription refilled successfully');
          },
        },
      ]
    );
  };

  const handleCancelPrescription = (prescription: Prescription) => {
    Alert.alert(
      'Cancel Prescription',
      `Cancel prescription for ${prescription.patientName}?`,
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // In real app, this would make API call
            Alert.alert('Success', 'Prescription cancelled successfully');
          },
        },
      ]
    );
  };

  const filteredPrescriptions = prescriptions.filter(prescription => 
    selectedStatus === 'all' || prescription.status === selectedStatus
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

  const renderPrescription = (prescription: Prescription) => (
    <View key={prescription.id} style={styles.prescriptionCard}>
      <View style={styles.prescriptionHeader}>
        <View style={styles.prescriptionInfo}>
          <Text style={styles.patientName}>{prescription.patientName}</Text>
          <Text style={styles.patientDetails}>
            {prescription.patientPhone || 'No phone number'}
          </Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(prescription.status)}]}>
          <SimpleIcon name={getStatusIcon(prescription.status)} size={16} color="#FFFFFF" />
          <Text style={styles.statusText}>{getStatusText(prescription.status)}</Text>
        </View>
      </View>

      <View style={styles.prescriptionDetails}>
        <View style={styles.detailRow}>
          <SimpleIcon name="calendar" size={16} color="#666666" />
          <Text style={styles.detailText}>
            Prescribed: {formatDate(prescription.prescriptionDate)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="medical" size={16} color="#666666" />
          <Text style={styles.detailText}>
            {prescription.totalMedications || 0} medication{(prescription.totalMedications || 0) !== 1 ? 's' : ''}
          </Text>
        </View>

        {prescription.followUpDate && (
          <View style={styles.detailRow}>
            <SimpleIcon name="refresh" size={16} color="#FF9800" />
            <Text style={styles.detailText}>
              Follow-up: {formatDate(prescription.followUpDate)}
            </Text>
          </View>
        )}

        {prescription.notes && (
          <View style={styles.detailRow}>
            <SimpleIcon name="document" size={16} color="#666666" />
            <Text style={styles.detailText} numberOfLines={2}>
              {prescription.notes}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewPrescription(prescription)}>
          <SimpleIcon name="visibility" size={16} color="#1976D2" />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
        
        {prescription.status === 'active' && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditPrescription(prescription)}>
            <SimpleIcon name="edit" size={16} color="#FF9800" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        
        {prescription.status === 'active' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelPrescription(prescription)}>
            <SimpleIcon name="close" size={16} color="#F44336" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading prescriptions...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <SimpleIcon name="error" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPrescriptions}>
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
        
        {/* Header with Create Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Prescriptions</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreatePrescription}>
            <SimpleIcon name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>New Prescription</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderStatusFilter('all', 'All')}
            {renderStatusFilter('active', 'Active')}
            {renderStatusFilter('completed', 'Completed')}
            {renderStatusFilter('cancelled', 'Cancelled')}
            {renderStatusFilter('expired', 'Expired')}
          </ScrollView>
        </View>

        {/* Prescriptions */}
        <View style={styles.prescriptionsContainer}>
          {filteredPrescriptions.length > 0 ? (
            filteredPrescriptions.map(renderPrescription)
          ) : (
            <View style={styles.emptyContainer}>
              <SimpleIcon name="medical" size={60} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Prescriptions</Text>
              <Text style={styles.emptySubtitle}>
                {selectedStatus === 'all' 
                  ? 'No prescriptions have been created yet'
                  : `No ${selectedStatus} prescriptions found`
                }
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreatePrescription}>
                <Text style={styles.emptyButtonText}>Create First Prescription</Text>
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
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
  prescriptionsContainer: {
    padding: 20,
  },
  prescriptionCard: {
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
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  prescriptionInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#666666',
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
  prescriptionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    gap: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 4,
  },
  refillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  refillButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
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
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DoctorPrescriptionsScreen;
