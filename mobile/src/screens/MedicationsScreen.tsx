import React, {useState, useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import LinearGradient from 'react-native-linear-gradient';
import {useData} from '../context/DataContext';
import {apiService} from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncReminders } from '../services/notificationService';
import DateTimePicker from '@react-native-community/datetimepicker';

const {width} = Dimensions.get('window');

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  nextDose: string;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  doctor: string;
  instructions: string;
  sideEffects?: string[];
  color: string;
  icon: string;
}

interface MedicationReminder {
  id: string;
  medicationId: string;
  medicationName: string;
  time: string;
  isEnabled: boolean;
  days: string[];
}

const MedicationsScreen = (): React.JSX.Element => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Get data from context
  const { 
    patient, 
    medications, 
    currentMedications, 
    patientPrescriptions,
    isLoading, 
    error, 
    loadMedications, 
    loadCurrentMedications,
    loadPatientPrescriptions,
    loadHealthRecords,
  } = useData();

  // State for medication reminders
  const [medicationReminders, setMedicationReminders] = useState<MedicationReminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [rxItems, setRxItems] = useState<Medication[]>([]);
  const hasUserRemindersRef = useRef<boolean>(false);

  // Manual Set Reminder modal state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const REMINDER_KEY = patient?.id ? `patient:${patient.id}:medication_reminders` : undefined;

  // Generate medication reminders based on current medications
  const generateMedicationReminders = (meds: any[]): MedicationReminder[] => {
    const reminders: MedicationReminder[] = [];
    
    meds.forEach((med) => {
      if (med.status === 'active') {
        // Generate reminders based on frequency
        const frequency = med.frequency.toLowerCase();
        let times: string[] = [];
        
        if (frequency.includes('once daily') || frequency.includes('once a day')) {
          times = ['8:00 AM'];
        } else if (frequency.includes('twice daily') || frequency.includes('twice a day')) {
          times = ['8:00 AM', '8:00 PM'];
        } else if (frequency.includes('three times') || frequency.includes('three times daily')) {
          times = ['8:00 AM', '2:00 PM', '8:00 PM'];
        } else if (frequency.includes('four times') || frequency.includes('four times daily')) {
          times = ['8:00 AM', '12:00 PM', '4:00 PM', '8:00 PM'];
        } else {
          // Default to once daily
          times = ['8:00 AM'];
        }
        
        times.forEach((time, index) => {
          reminders.push({
            id: `${med.id}_${index}`,
            medicationId: med.id,
            medicationName: med.name,
            time: time,
            isEnabled: true,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          });
        });
      }
    });
    
    return reminders;
  };

  // Load data when component mounts (use profileId if present)
  useEffect(() => {
    const profileId = patient?.profileId;
    const userId = patient?.id;
    if (profileId) {
      // endpoints that use profile id
      loadMedications(profileId);
      loadPatientPrescriptions(profileId);
    }
    if (userId) {
      // current medications endpoint uses auth user id
      loadCurrentMedications(userId);
    }
  }, [patient?.id, patient?.profileId]);

  // Removed auto-clear/overwrite effect to preserve user-set reminders

  // Load patient prescription items and map to Medication shape
  useEffect(() => {
    const loadRx = async () => {
      try {
        if (!patientPrescriptions || patientPrescriptions.length === 0) {
          setRxItems([]);
          return;
        }
        const results: Medication[] = [];
        for (const p of patientPrescriptions.slice(0, 10)) {
          try {
            const resp = await apiService.getPrescriptionItems(p.id);
            if (resp?.success && Array.isArray(resp.data)) {
              resp.data.forEach((it: any, idx: number) => {
                results.push({
                  id: it.id || `${p.id}_${idx}`,
                  name: it.medicationName || it.name || 'Medication',
                  dosage: it.dosage || '',
                  frequency: it.frequency || 'once daily',
                  nextDose: 'As prescribed',
                  status: 'active',
                  startDate: p.prescriptionDate,
                  endDate: undefined,
                  doctor: p.doctorName || 'Doctor',
                  instructions: it.instructions || '',
                  sideEffects: [],
                  color: '#2196F3',
                  icon: 'medication',
                });
              });
            }
          } catch {}
        }
        setRxItems(results);
      } catch {
        setRxItems([]);
      }
    };
    loadRx();
  }, [patientPrescriptions]);

  // Persist reminders
  useEffect(() => {
    const loadStored = async () => {
      try {
        if (!REMINDER_KEY) return;
        const raw = await AsyncStorage.getItem(REMINDER_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setMedicationReminders(parsed);
            if (parsed.length > 0) hasUserRemindersRef.current = true;
          }
        }
      } catch {}
    };
    loadStored();
  }, [REMINDER_KEY]);

  const saveReminders = async (list: MedicationReminder[]) => {
    try {
      if (!REMINDER_KEY) return;
      await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(list));
      // Sync notifications
      await syncReminders(list as any);
    } catch {}
  };

  const toggleReminder = (med: Medication) => {
    const existing = medicationReminders.filter(r => r.medicationId === med.id);
    if (existing.length > 0) {
      // disable
      const next = medicationReminders.filter(r => r.medicationId !== med.id);
      setMedicationReminders(next);
      saveReminders(next);
    } else {
      const generated = generateMedicationReminders([{ id: med.id, name: med.name, dosage: med.dosage, frequency: med.frequency, status: 'active' } as any]);
      const next = [...medicationReminders, ...generated];
      setMedicationReminders(next);
      saveReminders(next);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    const profileId = patient?.profileId;
    const userId = patient?.id;
    if (profileId || userId) {
      await Promise.all([
        profileId ? loadMedications(profileId) : Promise.resolve(),
        profileId ? loadPatientPrescriptions(profileId) : Promise.resolve(),
        userId ? loadCurrentMedications(userId) : Promise.resolve(),
      ]);
    }
    setRefreshing(false);
  };

  // Transform API data to match the UI interface
  const transformMedication = (med: any): Medication => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active':
          return '#4CAF50';
        case 'paused':
          return '#FF9800';
        case 'completed':
          return '#9E9E9E';
        default:
          return '#2196F3';
      }
    };

    const getNextDoseTime = (frequency: string) => {
      // Simple logic to determine next dose time based on frequency
      const now = new Date();
      const hour = now.getHours();
      
      if (frequency.toLowerCase().includes('twice')) {
        return hour < 12 ? '8:00 AM' : '8:00 PM';
      } else if (frequency.toLowerCase().includes('once')) {
        return '8:00 AM';
      } else if (frequency.toLowerCase().includes('three')) {
        return hour < 8 ? '8:00 AM' : hour < 16 ? '2:00 PM' : '8:00 PM';
      } else {
        return '8:00 AM';
      }
    };

    const color = getStatusColor(med.status);
    const nextDose = getNextDoseTime(med.frequency);

    return {
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      nextDose: nextDose,
      status: med.status as 'active' | 'paused' | 'completed',
      startDate: med.startDate || med.start_date,
      endDate: med.endDate || med.end_date,
      doctor: med.prescribedBy || 'Unknown Doctor',
      instructions: med.instructions || 'No instructions provided',
      sideEffects: med.sideEffects || med.side_effects || [],
      color: color,
      icon: 'medication',
    };
  };

  // Use real data from context, fallback to empty array (memoized for stable identity)
  const displayMedications = useMemo(() => {
    const combined = [
      ...medications.map(transformMedication),
      ...currentMedications.map(transformMedication),
      ...rxItems,
    ];
    const deduped = combined.reduce((acc: Medication[], curr) => {
      const key = `${curr.name}|${curr.dosage}`.toLowerCase();
      if (!acc.some(m => `${m.name}|${m.dosage}`.toLowerCase() === key)) acc.push(curr);
      return acc;
    }, [] as Medication[]);
    return deduped;
  }, [medications, currentMedications, rxItems]);

  // Auto-generate and schedule reminders from all active meds (including prescription items)
  const activeMeds = useMemo(() => (
    displayMedications.filter((m: any) => (m.status || 'active') === 'active')
  ), [displayMedications]);

  const activeMedsSignature = useMemo(() => {
    const copy = activeMeds.map(m => ({ id: m.id, name: m.name, dosage: m.dosage, frequency: m.frequency, status: m.status }));
    copy.sort((a, b) => (String(a.id)).localeCompare(String(b.id)));
    return JSON.stringify(copy);
  }, [activeMeds]);

  const lastScheduledSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeMeds.length === 0) return;
    if (hasUserRemindersRef.current) return; // don't overwrite user-saved reminders
    if (lastScheduledSignatureRef.current === activeMedsSignature) return;
    const reminders = generateMedicationReminders(activeMeds as any[]);
    setMedicationReminders(reminders);
    syncReminders(reminders as any).catch(() => {});
    lastScheduledSignatureRef.current = activeMedsSignature;
  }, [activeMedsSignature]);

  // Helpers for manual reminder
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${mm} ${period}`;
  };

  const getTimesForFrequency = (base: Date, frequency: string): string[] => {
    const f = String(frequency || '').toLowerCase();
    let timesPerDay = 1;
    if (f.includes('twice') || f.includes('2')) timesPerDay = 2;
    else if (f.includes('three') || f.includes('3')) timesPerDay = 3;
    else if (f.includes('four') || f.includes('4')) timesPerDay = 4;

    if (timesPerDay <= 1) return [formatTime(base)];

    const results: string[] = [];
    const intervalHours = 24 / timesPerDay;
    for (let i = 0; i < timesPerDay; i++) {
      const d = new Date(base);
      d.setHours(d.getHours() + Math.round(i * intervalHours));
      d.setSeconds(0, 0);
      results.push(formatTime(d));
    }
    return Array.from(new Set(results));
  };

  const openSetReminderModal = () => {
    const initialMedId = displayMedications[0]?.id || null;
    setSelectedMedId(initialMedId);
    const now = new Date();
    now.setSeconds(0, 0);
    setSelectedTime(now);
    setShowReminderModal(true);
  };

  const handleSaveManualReminder = async () => {
    // Allow saving even if no active meds by using any displayed med or a generic label
    let med: any | undefined = undefined;
    if (selectedMedId) {
      med = [...displayMedications].find((m: any) => m.id === selectedMedId);
    } else if (displayMedications.length > 0) {
      med = displayMedications[0];
    }
    const medKey = selectedMedId || med?.id || 'custom';
    const existingForMed = medicationReminders.filter(r => r.medicationId === medKey).length;
    const times = getTimesForFrequency(selectedTime, med?.frequency || 'once daily');
    const generated = times.map((t, idx) => ({
      id: `${medKey}_${existingForMed + idx}`,
      medicationId: medKey,
      medicationName: med?.name || 'Medication',
      time: t,
      isEnabled: true,
      days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    } as MedicationReminder));
    const next = [...medicationReminders, ...generated];
    hasUserRemindersRef.current = true;
    setMedicationReminders(next);
    await saveReminders(next);
    // Also log this as a medical record (prescription-type note)
    try {
      if (patient?.profileId) {
        const detailParts = [
          med?.dosage ? `Dosage: ${med.dosage}` : '',
          med?.frequency ? `Frequency: ${med.frequency}` : '',
          med?.instructions ? `Instructions: ${med.instructions}` : ''
        ].filter(Boolean);
        const detail = [`Times: ${generated.map(g => g.time).join(', ')}`, ...detailParts].join(' | ');
        await apiService.createMedicalRecord({
          patient_id: patient.profileId,
          type: 'prescription',
          title: `Prescription: ${med?.name || 'Medication'}`,
          description: detail,
          record_date: new Date().toISOString().slice(0,10),
          doctor_id: null,
          hospital_id: null,
          attachments: [],
        });
        // Refresh health records so it appears immediately
        await loadHealthRecords(patient.profileId);
      }
    } catch {}
    // ensure UI reflects persisted reminders immediately by reloading from storage
    try {
      if (REMINDER_KEY) {
        const raw = await AsyncStorage.getItem(REMINDER_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setMedicationReminders(parsed);
        }
      }
    } catch {}
    setShowReminderModal(false);
  };


  const filterOptions = [
    {key: 'all', label: 'All Medications', icon: 'list'},
    {key: 'active', label: 'Active', icon: 'check-circle'},
    {key: 'paused', label: 'Paused', icon: 'pause-circle'},
    {key: 'completed', label: 'Completed', icon: 'check-circle-outline'},
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'paused':
        return '#FF9800';
      case 'completed':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const filteredMedications = selectedFilter === 'all' 
    ? displayMedications 
    : displayMedications.filter(med => med.status === selectedFilter);

  const renderMedication = (medication: Medication) => (
    <TouchableOpacity key={medication.id} style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <View style={[styles.medicationIcon, {backgroundColor: medication.color + '20'}]}>
          <SimpleIcon name={medication.icon} size={24} color={medication.color} />
        </View>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.medicationDosage}>{medication.dosage} • {medication.frequency}</Text>
          <Text style={styles.medicationDoctor}>Dr. {medication.doctor}</Text>
        </View>
        <View style={styles.medicationStatus}>
          <View style={[styles.statusDot, {backgroundColor: getStatusColor(medication.status)}]} />
          <Text style={[styles.statusText, {color: getStatusColor(medication.status)}]}>
            {getStatusText(medication.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.medicationDetails}>
        <View style={styles.detailRow}>
          <SimpleIcon name="schedule" size={16} color="#666666" />
          <Text style={styles.detailText}>Next dose: {medication.nextDose}</Text>
        </View>
        <View style={styles.detailRow}>
          <SimpleIcon name="calendar-today" size={16} color="#666666" />
          <Text style={styles.detailText}>Started: {medication.startDate}</Text>
        </View>
        {medication.endDate && (
          <View style={styles.detailRow}>
            <SimpleIcon name="event" size={16} color="#666666" />
            <Text style={styles.detailText}>Ended: {medication.endDate}</Text>
          </View>
        )}
        <Text style={styles.instructionsText}>{medication.instructions}</Text>
        {medication.sideEffects && medication.sideEffects.length > 0 && (
          <View style={styles.sideEffectsContainer}>
            <Text style={styles.sideEffectsTitle}>Possible side effects:</Text>
            <View style={styles.sideEffectsList}>
              {medication.sideEffects.map((effect, index) => (
                <View key={index} style={styles.sideEffectTag}>
                  <Text style={styles.sideEffectText}>{effect}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading && displayMedications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <SimpleIcon name="error" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Error Loading Medications</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Filter Options */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              {filterOptions.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter.key && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedFilter(filter.key)}>
                  <SimpleIcon 
                    name={filter.icon} 
                    size={20} 
                    color={selectedFilter === filter.key ? '#FFFFFF' : '#1976D2'} 
                  />
                  <Text style={[
                    styles.filterText,
                    selectedFilter === filter.key && styles.filterTextActive,
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Medications List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Medications</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Add New</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.medicationsList}>
            {filteredMedications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <SimpleIcon name="medication" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No Medications Found</Text>
                <Text style={styles.emptyMessage}>
                  {displayMedications.length === 0 
                    ? 'You don\'t have any medications yet.'
                    : 'No medications match your current filter.'
                  }
                </Text>
              </View>
            ) : (
              filteredMedications.map(renderMedication)
            )}
          </View>
        </View>

        {/* Medication Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Reminders</Text>
          <View style={styles.remindersList}>
            {medicationReminders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <SimpleIcon name="schedule" size={48} color="#ccc" />
                <Text style={styles.emptyTitle}>No Reminders Set</Text>
                <Text style={styles.emptyMessage}>
                  {currentMedications.length === 0 
                    ? 'Add medications to automatically generate reminders.'
                    : 'No active medications found to create reminders.'
                  }
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={openSetReminderModal}>
                  <Text style={styles.primaryButtonText}>Set a Reminder</Text>
                </TouchableOpacity>
              </View>
            ) : (
              medicationReminders.map((reminder) => (
                <View key={reminder.id} style={styles.reminderCard}>
                  <View style={styles.reminderHeader}>
                    <SimpleIcon name="schedule" size={20} color="#1976D2" />
                    <Text style={styles.reminderTime}>{reminder.time}</Text>
                    <View style={[styles.reminderToggle, {backgroundColor: reminder.isEnabled ? '#4CAF50' : '#E0E0E0'}]}>
                      <SimpleIcon name="check" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.reminderMedication}>{reminder.medicationName}</Text>
                  <Text style={styles.reminderDays}>{reminder.days.join(', ')}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions removed per request */}
      </ScrollView>

      {/* Set Reminder Modal */}
      <Modal
        visible={showReminderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Medication Reminder</Text>
            <Text style={styles.modalSubtitle}>Medication</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12}}>
              <View style={{flexDirection: 'row'}}>
                {activeMeds.map((m: any) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.pill, selectedMedId === m.id ? styles.pillActive : null]}
                    onPress={() => setSelectedMedId(m.id)}>
                    <Text style={[styles.pillText, selectedMedId === m.id ? styles.pillTextActive : null]}>
                      {m.name}
                    </Text>
            </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.modalSubtitle}>Time</Text>
            <TouchableOpacity style={styles.timePickerButton} onPress={() => setTimePickerVisible(true)}>
              <SimpleIcon name="access-time" size={18} color="#1976D2" />
              <Text style={styles.timePickerText}>{formatTime(selectedTime)}</Text>
            </TouchableOpacity>
            {timePickerVisible && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, d) => {
                  setTimePickerVisible(false);
                  if (d) setSelectedTime(d);
                }}
              />)
            }
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowReminderModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveManualReminder}>
                <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  scrollView: {
    flex: 1,
  },
  filterSection: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  medicationsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  medicationCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medicationInfo: {
    flex: 1,
    minWidth: 0,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  medicationDoctor: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  medicationStatus: {
    alignItems: 'center',
    marginLeft: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  medicationDetails: {
    marginLeft: 64,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  instructionsText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  sideEffectsContainer: {
    marginTop: 8,
  },
  sideEffectsTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
    fontWeight: '500',
  },
  sideEffectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sideEffectTag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  sideEffectText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '500',
  },
  remindersList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  reminderCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reminderTime: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  reminderToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderDays: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 28,
  },
  reminderMedication: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    marginLeft: 28,
    marginBottom: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  quickActionOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  // Loading, Error, and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  pill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  pillText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 12,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  timePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancel: {
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
  },
  modalCancelText: {
    color: '#333333',
    fontWeight: '600',
  },
  modalSave: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1976D2',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default MedicationsScreen;
