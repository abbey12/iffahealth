import React, {useEffect, useState} from 'react';
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
import SimpleIcon from '../components/SimpleIcon';
import apiService from '../services/apiService';
import {useData} from '../context/DataContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  refills: number;
}

interface FavoriteMedTemplate {
  name: string;
  indication?: string;
  timesPerDay: number;
  gramsPerDose: number;
  durationDays: number;
  instructions?: string;
}

const NewPrescriptionScreen = ({navigation}: any): React.JSX.Element => {
  const { doctor } = useData();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notes, setNotes] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Manual medication entry state
  const [medName, setMedName] = useState('');
  const [medIndication, setMedIndication] = useState('');
  const [timesPerDay, setTimesPerDay] = useState('');
  const [gramsPerDose, setGramsPerDose] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [medInstructions, setMedInstructions] = useState('');
  const [favoriteMeds, setFavoriteMeds] = useState<FavoriteMedTemplate[]>([]);

  const FAVORITES_KEY = doctor?.id ? `doctor:${doctor.id}:favorite_meds` : undefined;

  // Load patients from backend (basic list doctor can prescribe to)
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingPatients(true);
        // Reuse doctor patients API if available, otherwise fallback to /patients (if exposed)
        let data: any[] = [];
        try {
          if (doctor?.id) {
            const resp = await apiService.getDoctorPatients(doctor.id, { limit: 100 });
            if (resp.success) data = resp.data;
          }
        } catch {}
        if (!data || data.length === 0) {
          // Fallback to recent patients via prescriptions list mapping if needed; skip for now
        }
        const mapped: Patient[] = (data || []).map((p: any) => ({
          id: p.id || p.patient_id,
          name: `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || 'Patient',
          age: p.age || 0,
          gender: p.gender || 'Unknown',
          phone: p.phone || p.contact_phone || '',
        }));
        setPatients(mapped);
      } catch (e) {
        // Keep empty silently
      } finally {
        setLoadingPatients(false);
      }
    };
    load();
  }, [doctor?.id]);

  // If returned from MedicationLibrary with a selectedMedication param, merge it
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      const params = navigation.getState()?.routes?.find((r: any) => r.name === 'NewPrescription')?.params as any;
      if (params?.selectedMedication) {
        const med = params.selectedMedication as Medication;
        setMedications(prev => [...prev, med]);
        // Clear the param so it doesn't re-add
        navigation.setParams({ selectedMedication: undefined });
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Load favorite meds for this doctor
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        if (!FAVORITES_KEY) return;
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as FavoriteMedTemplate[];
          setFavoriteMeds(Array.isArray(parsed) ? parsed : []);
        }
      } catch {}
    };
    loadFavorites();
  }, [FAVORITES_KEY]);

  const saveFavorites = async (list: FavoriteMedTemplate[]) => {
    try {
      if (!FAVORITES_KEY) return;
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list.slice(0, 12)));
    } catch {}
  };

  const addFavoriteIfNew = async (tpl: FavoriteMedTemplate) => {
    const key = `${tpl.name}|${tpl.gramsPerDose}|${tpl.timesPerDay}|${tpl.durationDays}`.toLowerCase();
    const exists = favoriteMeds.some(f => `${f.name}|${f.gramsPerDose}|${f.timesPerDay}|${f.durationDays}`.toLowerCase() === key);
    if (!exists) {
      const next = [tpl, ...favoriteMeds];
      setFavoriteMeds(next);
      await saveFavorites(next);
    }
  };

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery) ||
    patient.id.includes(searchQuery)
  );

  const handleAddMedication = () => {
    if (!medName.trim()) {
      Alert.alert('Medication name required', 'Enter the medication name.');
      return;
    }
    const times = parseInt(timesPerDay || '0', 10);
    const grams = parseFloat(gramsPerDose || '0');
    const days = parseInt(durationDays || '0', 10);
    if (!times || times <= 0) {
      Alert.alert('Times per day required', 'Enter a valid number of times per day.');
      return;
    }
    if (!grams || grams <= 0) {
      Alert.alert('Grams per dose required', 'Enter a valid grams per dose value.');
      return;
    }
    if (!days || days <= 0) {
      Alert.alert('Duration required', 'Enter a valid duration in days.');
      return;
    }
    const newMed: Medication = {
      id: `${Date.now()}`,
      name: medName.trim(),
      dosage: `${grams} g`,
      frequency: `${times} times daily`,
      duration: `${days} days`,
      instructions: [
        medInstructions?.trim() ? medInstructions.trim() : null,
        medIndication?.trim() ? `Indication: ${medIndication.trim()}` : null,
        `Duration: ${days} days`,
      ].filter(Boolean).join('\n'),
      quantity: times * days,
      refills: 0,
    };
    setMedications(prev => [...prev, newMed]);
    // persist favorite template
    addFavoriteIfNew({
      name: medName.trim(),
      indication: medIndication.trim() || undefined,
      timesPerDay: times,
      gramsPerDose: grams,
      durationDays: days,
      instructions: medInstructions.trim() || undefined,
    });
    // clear form
    setMedName('');
    setMedIndication('');
    setTimesPerDay('');
    setGramsPerDose('');
    setDurationDays('');
    setMedInstructions('');
  };

  const handleRemoveMedication = (medicationId: string) => {
    setMedications(medications.filter(med => med.id !== medicationId));
  };

  const handleEditMedication = (medication: Medication) => {
    navigation.navigate('EditMedication', { medication });
  };

  const handleCreatePrescription = async () => {
    if (!selectedPatient) {
      Alert.alert('Missing Information', 'Please select a patient.');
      return;
    }

    if (medications.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one medication.');
      return;
    }
    try {
      setSubmitting(true);
      // 1) Create prescription with items
      const items = medications.map(m => ({
        medicationName: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        quantity: m.quantity || 1,
        instructions: m.instructions || '',
      }));
      const createResp = await apiService.createPrescription({
        patient_id: selectedPatient.id,
        doctor_id: doctor?.id,
        prescription_date: new Date().toISOString().split('T')[0],
        notes,
        status: 'active',
        items,
      });
      const created = createResp?.data;
      if (!created?.id) throw new Error('Create prescription failed');

            Alert.alert('Success', 'Prescription created successfully!');
            navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to create prescription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPatientCard = (patient: Patient) => (
    <TouchableOpacity
      key={patient.id}
      style={[
        styles.patientCard,
        selectedPatient?.id === patient.id && styles.patientCardSelected,
      ]}
      onPress={() => setSelectedPatient(patient)}>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{patient.name}</Text>
        <Text style={styles.patientDetails}>
          {patient.age}y • {patient.gender}
        </Text>
        <Text style={styles.patientPhone}>{patient.phone}</Text>
      </View>
      {selectedPatient?.id === patient.id && (
        <SimpleIcon name="checkmark-circle" size={20} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  const renderMedication = (medication: Medication) => (
    <View key={medication.id} style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.medicationDosage}>{medication.dosage}</Text>
        </View>
        <View style={styles.medicationActions}>
          <TouchableOpacity
            style={styles.editMedButton}
            onPress={() => handleEditMedication(medication)}>
            <SimpleIcon name="edit" size={16} color="#1976D2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeMedButton}
            onPress={() => handleRemoveMedication(medication.id)}>
            <SimpleIcon name="close" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.medicationDetails}>
        <View style={styles.detailRow}>
          <SimpleIcon name="time" size={14} color="#666666" />
          <Text style={styles.detailText}>{medication.frequency}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="calendar" size={14} color="#666666" />
          <Text style={styles.detailText}>{medication.duration}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="medical" size={14} color="#666666" />
          <Text style={styles.detailText}>Qty: {medication.quantity}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="refresh" size={14} color="#666666" />
          <Text style={styles.detailText}>Refills: {medication.refills}</Text>
        </View>
      </View>

      {medication.instructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>{medication.instructions}</Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <SimpleIcon name="search" size={20} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search patients by name, phone, or ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <SimpleIcon name="close" size={16} color="#666666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Step 1: Select Patient */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Select Patient</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.resultsCount}>
                {filteredPatients.length} result{filteredPatients.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          {loadingPatients ? (
            <View style={styles.noResultsContainer}><Text>Loading patients…</Text></View>
          ) : filteredPatients.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filteredPatients.map(renderPatientCard)}
            </ScrollView>
          ) : (
            <View style={styles.noResultsContainer}>
              <SimpleIcon name="search" size={40} color="#CCCCCC" />
              <Text style={styles.noResultsText}>No patients found</Text>
              <Text style={styles.noResultsSubtext}>Try a different search term</Text>
            </View>
          )}
        </View>

        {/* Step 2: Add Medications */}
        {selectedPatient && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>2. Add Medications</Text>
            </View>
            {/* Manual medication entry form */}
            <View style={styles.cardBox}>
              <Text style={styles.formLabel}>Medication name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Amoxicillin"
                value={medName}
                onChangeText={setMedName}
              />

              <Text style={styles.formLabel}>What is it for (indication)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Bacterial infection"
                value={medIndication}
                onChangeText={setMedIndication}
              />

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.formLabel}>Times per day</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 3"
                    keyboardType="number-pad"
                    value={timesPerDay}
                    onChangeText={setTimesPerDay}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.formLabel}>Grams per dose</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 0.5"
                    keyboardType="decimal-pad"
                    value={gramsPerDose}
                    onChangeText={setGramsPerDose}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.formLabel}>Duration (days)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 7"
                    keyboardType="number-pad"
                    value={durationDays}
                    onChangeText={setDurationDays}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.formLabel}>Quantity (auto)</Text>
                  <Text style={styles.quantityPreview}>
                    {(() => {
                      const t = parseInt(timesPerDay || '0', 10) || 0;
                      const d = parseInt(durationDays || '0', 10) || 0;
                      return t > 0 && d > 0 ? t * d : 0;
                    })()}
                  </Text>
                </View>
              </View>

              <Text style={styles.formLabel}>Medication instructions</Text>
              <TextInput
                style={[styles.input, {height: 80, textAlignVertical: 'top'}]}
                placeholder="e.g., Take after meals"
                value={medInstructions}
                onChangeText={setMedInstructions}
                multiline
              />

              <TouchableOpacity style={styles.primaryButton} onPress={handleAddMedication}>
                <SimpleIcon name="add" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Add medication to list</Text>
              </TouchableOpacity>
            </View>

            {/* Saved/Frequently used medications */}
            {favoriteMeds.length > 0 && (
              <View style={{marginBottom: 8}}>
                <Text style={styles.sectionSubTitle}>Saved medications</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 8}}>
                  {favoriteMeds.map((f, idx) => (
                    <TouchableOpacity
                      key={`${f.name}-${idx}`}
                      style={styles.chip}
                      onPress={() => {
                        setMedName(f.name);
                        setMedIndication(f.indication ? String(f.indication) : '');
                        setTimesPerDay(String(f.timesPerDay));
                        setGramsPerDose(String(f.gramsPerDose));
                        setDurationDays(String(f.durationDays));
                        setMedInstructions(f.instructions ? String(f.instructions) : '');
                      }}>
                      <Text style={styles.chipText}>{f.name} • {f.gramsPerDose}g • {f.timesPerDay}x • {f.durationDays}d</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {medications.length > 0 ? (
              medications.map(renderMedication)
            ) : (
              <View style={styles.emptyMedications}>
                <SimpleIcon name="medical" size={40} color="#CCCCCC" />
                <Text style={styles.emptyText}>No medications added yet</Text>
                <Text style={styles.emptySubtext}>Fill the form above and tap Add</Text>
              </View>
            )}
          </View>
        )}

        {/* Step 3: Prescription Notes */}
        {selectedPatient && medications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Prescription Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Enter prescription notes (optional)..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Step 4: Doctor Notes */}
        {selectedPatient && medications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Doctor's Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Enter doctor's notes (optional)..."
              value={doctorNotes}
              onChangeText={setDoctorNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Prescription Summary */}
        {selectedPatient && medications.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Prescription Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Patient:</Text>
              <Text style={styles.summaryValue}>{selectedPatient.name}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Medications:</Text>
              <Text style={styles.summaryValue}>{medications.length}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Refills:</Text>
              <Text style={styles.summaryValue}>
                {medications.reduce((total, med) => total + med.refills, 0)}
              </Text>
            </View>
          </View>
        )}

        {/* Create Button */}
        {selectedPatient && medications.length > 0 && (
          <View style={styles.createButtonContainer}>
            <TouchableOpacity style={styles.createButton} onPress={handleCreatePrescription}>
              <SimpleIcon name="save" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Prescription</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  section: {
    padding: 20,
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
  },
  sectionSubTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  resultsCount: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 160,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  patientCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  patientDetails: {
    fontSize: 12,
    color: '#666666',
  },
  patientPhone: {
    fontSize: 10,
    color: '#1976D2',
    marginTop: 2,
  },
  addMedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  addMedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 4,
  },
  emptyMedications: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
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
  medicationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editMedButton: {
    padding: 4,
  },
  removeMedButton: {
    padding: 4,
  },
  medicationDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 6,
  },
  instructionsContainer: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#2E7D32',
    fontStyle: 'italic',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  createButtonContainer: {
    padding: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 16,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  // Manual entry styles
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  quantityPreview: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
    borderWidth: 1,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default NewPrescriptionScreen;
