import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import apiService from '../services/apiService';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  refills: number;
  remainingRefills: number;
}

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  date: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  medications: Medication[];
  totalMedications: number;
  nextRefillDate?: string;
  notes: string;
  doctorNotes?: string;
}

interface PrescriptionDetailScreenProps {
  route: {
    params: {
      prescription: Prescription;
    };
  };
  navigation: any;
}

const PrescriptionDetailScreen = ({route, navigation}: PrescriptionDetailScreenProps): React.JSX.Element => {
  const {prescription} = route.params || { prescription: undefined as any };
  if (!prescription) {
    return (
      <View style={styles.container}>
        <View style={[styles.section, {marginTop: 24}]}> 
          <Text style={{color: '#D32F2F', fontSize: 16, fontWeight: '600'}}>Prescription not found</Text>
          <Text style={{color: '#666666', marginTop: 6}}>Please go back and try again.</Text>
        </View>
      </View>
    );
  }
  const [showAllMedications, setShowAllMedications] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const handleShare = async () => {
    try {
      const shareContent = `Prescription for ${prescription.patientName}\n\n` +
        `Date: ${formatDate(prescription.date)}\n` +
        `Status: ${getStatusText(prescription.status)}\n\n` +
        `Medications:\n${prescription.medications.map(med => 
          `• ${med.name} ${med.dosage} - ${med.frequency} for ${med.duration}`
        ).join('\n')}\n\n` +
        `Notes: ${prescription.notes}`;
      
      await Share.share({
        message: shareContent,
        title: 'Prescription Details',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRefillMedication = (medication: Medication) => {
    Alert.alert(
      'Refill Medication',
      `Refill ${medication.name} for ${prescription.patientName}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Refill',
          onPress: () => {
            // In real app, this would make API call
            Alert.alert('Success', 'Medication refilled successfully');
          },
        },
      ]
    );
  };

  const handleEditPrescription = () => {
    // Route to NewPrescription to edit/create; pass basic context to prefill/select
    navigation.navigate('NewPrescription', {
      from: 'PrescriptionDetail',
      patientId: (prescription as any).patientId,
      patientName: (prescription as any).patientName,
    });
  };

  const handlePrintPrescription = () => {
    Alert.alert(
      'Print Prescription',
      'This will generate a printable prescription form.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Print',
          onPress: () => {
            // In real app, this would generate PDF
            Alert.alert('Success', 'Prescription sent to printer');
          },
        },
      ]
    );
  };

  const renderMedication = (medication: Medication, index: number) => (
    <View key={medication.id} style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.medicationDosage}>{medication.dosage}</Text>
        </View>
        {medication.remainingRefills > 0 && (
          <View style={styles.refillBadge}>
            <Text style={styles.refillText}>{medication.remainingRefills} refills left</Text>
          </View>
        )}
      </View>

      <View style={styles.medicationDetails}>
        <View style={styles.detailRow}>
          <SimpleIcon name="time" size={16} color="#666666" />
          <Text style={styles.detailText}>{medication.frequency}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="calendar" size={16} color="#666666" />
          <Text style={styles.detailText}>Duration: {medication.duration}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="medical" size={16} color="#666666" />
          <Text style={styles.detailText}>Quantity: {medication.quantity}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="information" size={16} color="#666666" />
          <Text style={styles.detailText}>{medication.instructions}</Text>
        </View>
      </View>

      {medication.remainingRefills > 0 && (
        <TouchableOpacity
          style={styles.refillButton}
          onPress={() => handleRefillMedication(medication)}>
          <SimpleIcon name="refresh" size={16} color="#4CAF50" />
          <Text style={styles.refillButtonText}>Refill</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const [loadedMedications, setLoadedMedications] = useState<Medication[]>([]);

  const baseMeds = Array.isArray(prescription.medications) ? prescription.medications : [];

  useEffect(() => {
    const loadItems = async () => {
      try {
        if (!prescription?.id) return;
        const resp = await apiService.getPrescriptionItems(prescription.id);
        if (resp?.success && Array.isArray(resp.data)) {
          const mapped: Medication[] = resp.data.map((it: any) => ({
            id: it.id || `${it.medicationName}-${it.dosage}`,
            name: it.medicationName || it.name || 'Medication',
            dosage: it.dosage || '',
            frequency: it.frequency || '',
            duration: '',
            instructions: it.instructions || '',
            quantity: it.quantity || 0,
            refills: 0,
            remainingRefills: 0,
          }));
          setLoadedMedications(mapped);
        }
      } catch {}
    };
    if (baseMeds.length === 0) {
      loadItems();
    }
  }, [prescription?.id]);

  const meds = (loadedMedications.length > 0 ? loadedMedications : baseMeds);
  const displayedMedications = showAllMedications ? meds : meds.slice(0, 2);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{prescription.patientName}</Text>
              <Text style={styles.patientDetails}>
                {prescription.patientAge}y • {prescription.patientGender} • {prescription.patientPhone}
              </Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(prescription.status)}
            ]}>
              <SimpleIcon 
                name={getStatusIcon(prescription.status)} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusText}>{getStatusText(prescription.status)}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <SimpleIcon name="share" size={20} color="#1976D2" />
          </TouchableOpacity>
        </View>

        {/* Prescription Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescription Information</Text>
          
          <View style={styles.detailRow}>
            <SimpleIcon name="calendar" size={16} color="#666666" />
            <Text style={styles.detailText}>
              Prescribed: {formatDate((prescription as any).date || (prescription as any).prescriptionDate || (prescription as any).createdAt)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <SimpleIcon name="medical" size={16} color="#666666" />
            <Text style={styles.detailText}>
              {(prescription.totalMedications ?? meds.length)} medication{(prescription.totalMedications ?? meds.length) !== 1 ? 's' : ''}
            </Text>
          </View>

          {prescription.nextRefillDate && (
            <View style={styles.detailRow}>
              <SimpleIcon name="refresh" size={16} color="#FF9800" />
              <Text style={styles.detailText}>
                Next refill: {formatDate(prescription.nextRefillDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Medications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medications</Text>
            {meds.length > 2 && (
              <TouchableOpacity onPress={() => setShowAllMedications(!showAllMedications)}>
                <Text style={styles.toggleText}>
                  {showAllMedications ? 'Show Less' : `Show All (${meds.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {displayedMedications.map(renderMedication)}
        </View>

        {/* Notes */}
        {prescription.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prescription Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{prescription.notes}</Text>
            </View>
          </View>
        )}

        {/* Doctor Notes */}
        {prescription.doctorNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor's Notes</Text>
            <View style={styles.doctorNotesContainer}>
              <Text style={styles.doctorNotesText}>{prescription.doctorNotes}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditPrescription}>
            <SimpleIcon name="edit" size={16} color="#1976D2" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.printButton}
            onPress={handlePrintPrescription}>
            <SimpleIcon name="print" size={16} color="#FFFFFF" />
            <Text style={styles.printButtonText}>Print</Text>
          </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
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
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  shareButton: {
    padding: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  toggleText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  medicationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  refillBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refillText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  medicationDetails: {
    marginBottom: 12,
  },
  refillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  refillButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  notesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  notesText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  doctorNotesContainer: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  doctorNotesText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 8,
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    borderRadius: 8,
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default PrescriptionDetailScreen;
