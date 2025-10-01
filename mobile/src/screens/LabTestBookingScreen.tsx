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
import SimpleIcon from '../components/SimpleIcon';

interface LabTest {
  id: string;
  name: string;
  type: 'blood' | 'urine' | 'imaging' | 'other';
  description: string;
  price: number;
  duration: string;
  preparation: string;
  category: string;
}

interface Lab {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  distance: string;
  availableSlots: string[];
}

const LabTestBookingScreen = ({navigation}: any): React.JSX.Element => {
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');

  const availableTests: LabTest[] = [
    {
      id: '1',
      name: 'Complete Blood Count (CBC)',
      type: 'blood',
      description: 'Measures different components of blood including red and white blood cells, platelets, and hemoglobin.',
      price: 50,
      duration: '15 minutes',
      preparation: 'Fast for 12 hours before the test',
      category: 'General Health',
    },
    {
      id: '2',
      name: 'Lipid Profile',
      type: 'blood',
      description: 'Measures cholesterol levels, triglycerides, and other fats in the blood.',
      price: 75,
      duration: '20 minutes',
      preparation: 'Fast for 12 hours before the test',
      category: 'Cardiovascular',
    },
    {
      id: '3',
      name: 'Blood Glucose Test',
      type: 'blood',
      description: 'Measures blood sugar levels to screen for diabetes.',
      price: 30,
      duration: '10 minutes',
      preparation: 'Fast for 8 hours before the test',
      category: 'Diabetes',
    },
    {
      id: '4',
      name: 'Urinalysis',
      type: 'urine',
      description: 'Analyzes urine for various substances to detect infections or diseases.',
      price: 25,
      duration: '5 minutes',
      preparation: 'Collect mid-stream urine sample',
      category: 'General Health',
    },
    {
      id: '5',
      name: 'Chest X-Ray',
      type: 'imaging',
      description: 'X-ray imaging of the chest to examine lungs, heart, and chest wall.',
      price: 100,
      duration: '30 minutes',
      preparation: 'Remove all jewelry and metal objects',
      category: 'Imaging',
    },
    {
      id: '6',
      name: 'Thyroid Function Test',
      type: 'blood',
      description: 'Measures thyroid hormone levels to assess thyroid function.',
      price: 80,
      duration: '15 minutes',
      preparation: 'No special preparation required',
      category: 'Endocrine',
    },
  ];

  const availableLabs: Lab[] = [
    {
      id: '1',
      name: 'Accra Medical Lab',
      address: '123 Lab Street, Accra',
      phone: '+233 24 123 4567',
      rating: 4.8,
      distance: '2.5 km',
      availableSlots: ['09:00 AM', '10:30 AM', '02:00 PM', '03:30 PM'],
    },
    {
      id: '2',
      name: 'Ghana Health Lab',
      address: '456 Health Avenue, Accra',
      phone: '+233 24 987 6543',
      rating: 4.6,
      distance: '3.2 km',
      availableSlots: ['08:30 AM', '11:00 AM', '01:30 PM', '04:00 PM'],
    },
    {
      id: '3',
      name: 'Radiology Center',
      address: '789 Imaging Road, Accra',
      phone: '+233 24 555 1234',
      rating: 4.9,
      distance: '1.8 km',
      availableSlots: ['09:30 AM', '11:30 AM', '02:30 PM', '03:45 PM'],
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blood': return 'water';
      case 'urine': return 'flask';
      case 'imaging': return 'scan';
      case 'other': return 'medical';
      default: return 'help';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blood': return '#F44336';
      case 'urine': return '#FF9800';
      case 'imaging': return '#2196F3';
      case 'other': return '#9C27B0';
      default: return '#666666';
    }
  };

  const handleBookTest = () => {
    if (!selectedTest || !selectedLab || !selectedSlot) {
      Alert.alert('Missing Information', 'Please select a test, lab, and time slot.');
      return;
    }

    Alert.alert(
      'Confirm Booking',
      `Book ${selectedTest.name} at ${selectedLab.name} for ${selectedSlot}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: () => {
            // In real app, this would make API call
            Alert.alert('Success', 'Lab test booked successfully!');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderTestCard = (test: LabTest) => (
    <TouchableOpacity
      key={test.id}
      style={[
        styles.testCard,
        selectedTest?.id === test.id && styles.testCardSelected,
      ]}
      onPress={() => setSelectedTest(test)}>
      <View style={styles.testHeader}>
        <View style={styles.testInfo}>
          <View style={styles.testTitleRow}>
            <SimpleIcon 
              name={getTypeIcon(test.type)} 
              size={20} 
              color={getTypeColor(test.type)} 
            />
            <Text style={styles.testName}>{test.name}</Text>
          </View>
          <Text style={styles.testCategory}>{test.category}</Text>
        </View>
        <Text style={styles.testPrice}>GHS {test.price}</Text>
      </View>
      
      <Text style={styles.testDescription}>{test.description}</Text>
      
      <View style={styles.testDetails}>
        <View style={styles.detailItem}>
          <SimpleIcon name="time" size={14} color="#666666" />
          <Text style={styles.detailText}>{test.duration}</Text>
        </View>
        <View style={styles.detailItem}>
          <SimpleIcon name="information" size={14} color="#666666" />
          <Text style={styles.detailText}>{test.preparation}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLabCard = (lab: Lab) => (
    <TouchableOpacity
      key={lab.id}
      style={[
        styles.labCard,
        selectedLab?.id === lab.id && styles.labCardSelected,
      ]}
      onPress={() => setSelectedLab(lab)}>
      <View style={styles.labHeader}>
        <View style={styles.labInfo}>
          <Text style={styles.labName}>{lab.name}</Text>
          <View style={styles.labRating}>
            <SimpleIcon name="star" size={14} color="#FFC107" />
            <Text style={styles.ratingText}>{lab.rating}</Text>
            <Text style={styles.distanceText}>• {lab.distance}</Text>
          </View>
        </View>
        <SimpleIcon name="location" size={16} color="#666666" />
      </View>
      
      <Text style={styles.labAddress}>{lab.address}</Text>
      <Text style={styles.labPhone}>{lab.phone}</Text>
    </TouchableOpacity>
  );

  const renderTimeSlot = (slot: string) => (
    <TouchableOpacity
      key={slot}
      style={[
        styles.timeSlot,
        selectedSlot === slot && styles.timeSlotSelected,
      ]}
      onPress={() => setSelectedSlot(slot)}>
      <Text style={[
        styles.timeSlotText,
        selectedSlot === slot && styles.timeSlotTextSelected,
      ]}>
        {slot}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <SimpleIcon name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Lab Test</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Step 1: Select Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Select Test</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableTests.map(renderTestCard)}
          </ScrollView>
        </View>

        {/* Step 2: Select Lab */}
        {selectedTest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Select Lab</Text>
            {availableLabs.map(renderLabCard)}
          </View>
        )}

        {/* Step 3: Select Time Slot */}
        {selectedTest && selectedLab && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Select Time Slot</Text>
            <View style={styles.timeSlotsContainer}>
              {selectedLab.availableSlots.map(renderTimeSlot)}
            </View>
          </View>
        )}

        {/* Step 4: Additional Notes */}
        {selectedTest && selectedLab && selectedSlot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Additional Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any special instructions or notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Booking Summary */}
        {selectedTest && selectedLab && selectedSlot && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Test:</Text>
              <Text style={styles.summaryValue}>{selectedTest.name}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lab:</Text>
              <Text style={styles.summaryValue}>{selectedLab.name}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{selectedSlot}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price:</Text>
              <Text style={styles.summaryPrice}>GHS {selectedTest.price}</Text>
            </View>
          </View>
        )}

        {/* Book Button */}
        {selectedTest && selectedLab && selectedSlot && (
          <View style={styles.bookButtonContainer}>
            <TouchableOpacity style={styles.bookButton} onPress={handleBookTest}>
              <SimpleIcon name="calendar" size={20} color="#FFFFFF" />
              <Text style={styles.bookButtonText}>Book Lab Test</Text>
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  testCardSelected: {
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  testInfo: {
    flex: 1,
  },
  testTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  testCategory: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  testPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  testDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  testDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 6,
    flex: 1,
  },
  labCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  labCardSelected: {
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  labHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  labInfo: {
    flex: 1,
  },
  labName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  labRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  labAddress: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  labPhone: {
    fontSize: 14,
    color: '#1976D2',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeSlotSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
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
  summaryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  bookButtonContainer: {
    padding: 20,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 16,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default LabTestBookingScreen;
