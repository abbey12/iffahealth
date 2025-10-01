import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';

interface Medication {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  sideEffects: string[];
  contraindications: string[];
  interactions: string[];
  description: string;
}

interface MedicationLibraryScreenProps {
  route: { params?: Record<string, unknown> };
  navigation: any;
}

const MedicationLibraryScreen = ({route, navigation}: MedicationLibraryScreenProps): React.JSX.Element => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const medicationLibrary: Medication[] = [
    {
      id: '1',
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      category: 'Antibiotics',
      dosage: '500mg',
      frequency: 'Three times daily',
      duration: '7 days',
      instructions: 'Take with food to reduce stomach upset',
      sideEffects: ['Nausea', 'Diarrhea', 'Rash', 'Allergic reactions'],
      contraindications: ['Penicillin allergy', 'Severe kidney disease'],
      interactions: ['Warfarin', 'Methotrexate', 'Allopurinol'],
      description: 'Broad-spectrum antibiotic used to treat bacterial infections',
    },
    {
      id: '2',
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      category: 'Pain Relief',
      dosage: '400mg',
      frequency: 'As needed for pain',
      duration: '5 days',
      instructions: 'Take with water, not more than 3 times daily',
      sideEffects: ['Stomach upset', 'Dizziness', 'Headache'],
      contraindications: ['Stomach ulcers', 'Severe heart failure', 'Kidney disease'],
      interactions: ['Aspirin', 'Warfarin', 'Lithium'],
      description: 'Non-steroidal anti-inflammatory drug for pain and inflammation',
    },
    {
      id: '3',
      name: 'Metformin',
      genericName: 'Metformin',
      category: 'Diabetes',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '30 days',
      instructions: 'Take with meals to reduce stomach upset',
      sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste'],
      contraindications: ['Severe kidney disease', 'Liver disease', 'Heart failure'],
      interactions: ['Contrast dye', 'Alcohol', 'Furosemide'],
      description: 'First-line medication for type 2 diabetes management',
    },
    {
      id: '4',
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      category: 'Cardiovascular',
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: 'Take in the morning, same time each day',
      sideEffects: ['Dry cough', 'Dizziness', 'Fatigue'],
      contraindications: ['Pregnancy', 'Bilateral renal artery stenosis'],
      interactions: ['Potassium supplements', 'NSAIDs', 'Lithium'],
      description: 'ACE inhibitor for hypertension and heart failure',
    },
    {
      id: '5',
      name: 'Azithromycin',
      genericName: 'Azithromycin',
      category: 'Antibiotics',
      dosage: '250mg',
      frequency: 'Once daily',
      duration: '5 days',
      instructions: 'Take on empty stomach, 1 hour before or 2 hours after meals',
      sideEffects: ['Nausea', 'Diarrhea', 'Stomach pain'],
      contraindications: ['Severe liver disease', 'QT prolongation'],
      interactions: ['Warfarin', 'Digoxin', 'Theophylline'],
      description: 'Macrolide antibiotic for respiratory and skin infections',
    },
    {
      id: '6',
      name: 'Omeprazole',
      genericName: 'Omeprazole',
      category: 'Gastrointestinal',
      dosage: '20mg',
      frequency: 'Once daily',
      duration: '14 days',
      instructions: 'Take before breakfast, swallow whole',
      sideEffects: ['Headache', 'Nausea', 'Diarrhea'],
      contraindications: ['Severe liver disease'],
      interactions: ['Warfarin', 'Phenytoin', 'Diazepam'],
      description: 'Proton pump inhibitor for acid reflux and ulcers',
    },
    {
      id: '7',
      name: 'Atorvastatin',
      genericName: 'Atorvastatin',
      category: 'Cardiovascular',
      dosage: '20mg',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: 'Take in the evening, with or without food',
      sideEffects: ['Muscle pain', 'Liver problems', 'Memory issues'],
      contraindications: ['Active liver disease', 'Pregnancy'],
      interactions: ['Grapefruit juice', 'Warfarin', 'Digoxin'],
      description: 'Statin medication for cholesterol management',
    },
    {
      id: '8',
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      category: 'Pain Relief',
      dosage: '500mg',
      frequency: 'Every 6 hours',
      duration: '3 days',
      instructions: 'Take with water, maximum 4 doses per day',
      sideEffects: ['Liver damage (overdose)', 'Skin rash'],
      contraindications: ['Severe liver disease', 'Alcoholism'],
      interactions: ['Warfarin', 'Alcohol'],
      description: 'Analgesic and antipyretic for pain and fever',
    },
  ];

  const categories = ['all', 'Antibiotics', 'Pain Relief', 'Diabetes', 'Cardiovascular', 'Gastrointestinal'];

  const filteredMedications = medicationLibrary.filter(medication => {
    const matchesSearch = medication.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medication.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medication.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || medication.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectMedication = (medication: Medication) => {
    Alert.alert(
      'Add Medication',
      `Add ${medication.name} to prescription?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Add',
          onPress: () => {
            navigation.navigate({ name: 'NewPrescription', params: { selectedMedication: medication }, merge: true });
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderCategoryFilter = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(category)}>
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category && styles.categoryButtonTextActive,
      ]}>
        {category === 'all' ? 'All' : category}
      </Text>
    </TouchableOpacity>
  );

  const renderMedication = (medication: Medication) => (
    <TouchableOpacity
      key={medication.id}
      style={styles.medicationCard}
      onPress={() => handleSelectMedication(medication)}>
      <View style={styles.medicationHeader}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.genericName}>{medication.genericName}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{medication.category}</Text>
        </View>
      </View>

      <Text style={styles.description}>{medication.description}</Text>

      <View style={styles.medicationDetails}>
        <View style={styles.detailRow}>
          <SimpleIcon name="medical" size={14} color="#666666" />
          <Text style={styles.detailText}>{medication.dosage}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="time" size={14} color="#666666" />
          <Text style={styles.detailText}>{medication.frequency}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="calendar" size={14} color="#666666" />
          <Text style={styles.detailText}>{medication.duration}</Text>
        </View>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>{medication.instructions}</Text>
      </View>

      <View style={styles.addButton}>
        <SimpleIcon name="add" size={16} color="#1976D2" />
        <Text style={styles.addButtonText}>Add to Prescription</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <SimpleIcon name="arrow-back" size={24} color="#1976D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication Library</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SimpleIcon name="search" size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medications..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(renderCategoryFilter)}
        </ScrollView>
      </View>

      {/* Medications List */}
      <ScrollView style={styles.medicationsList} showsVerticalScrollIndicator={false}>
        {filteredMedications.length > 0 ? (
          filteredMedications.map(renderMedication)
        ) : (
          <View style={styles.emptyContainer}>
            <SimpleIcon name="medical" size={60} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Medications Found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or category filter
            </Text>
          </View>
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 32,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#1976D2',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  medicationsList: {
    flex: 1,
    padding: 20,
  },
  medicationCard: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  genericName: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  medicationDetails: {
    marginBottom: 12,
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
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 12,
    color: '#2E7D32',
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
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

export default MedicationLibraryScreen;
