import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import LinearGradient from 'react-native-linear-gradient';

const {width} = Dimensions.get('window');

interface LabTest {
  id: string;
  name: string;
  type: 'blood' | 'urine' | 'imaging' | 'cardiac' | 'other';
  date: string;
  status: 'scheduled' | 'completed' | 'pending' | 'cancelled';
  doctor: string;
  location: string;
  instructions: string;
  results?: string;
  color: string;
  icon: string;
}

interface LabResult {
  id: string;
  testName: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | 'abnormal';
  date: string;
  color: string;
}

const LabTestsScreen = (): React.JSX.Element => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Sample lab tests data
  const labTests: LabTest[] = [
    {
      id: '1',
      name: 'Complete Blood Count (CBC)',
      type: 'blood',
      date: '2024-01-15',
      status: 'completed',
      doctor: 'Dr. Sarah Mensah',
      location: 'Lab Center - Accra',
      instructions: 'Fasting required for 12 hours before test',
      results: 'All values within normal range',
      color: '#F44336',
      icon: 'science',
    },
    {
      id: '2',
      name: 'Lipid Panel',
      type: 'blood',
      date: '2024-01-20',
      status: 'scheduled',
      doctor: 'Dr. Kwame Asante',
      location: 'Lab Center - Accra',
      instructions: 'Fasting required for 12 hours before test',
      color: '#F44336',
      icon: 'science',
    },
    {
      id: '3',
      name: 'Urinalysis',
      type: 'urine',
      date: '2024-01-10',
      status: 'completed',
      doctor: 'Dr. Ama Osei',
      location: 'Lab Center - Accra',
      instructions: 'First morning urine sample preferred',
      results: 'No abnormalities detected',
      color: '#4CAF50',
      icon: 'local-drink',
    },
    {
      id: '4',
      name: 'Chest X-Ray',
      type: 'imaging',
      date: '2024-01-12',
      status: 'completed',
      doctor: 'Dr. Sarah Mensah',
      location: 'Radiology Department',
      instructions: 'Remove all jewelry and metal objects',
      results: 'Clear lungs, no abnormalities',
      color: '#2196F3',
      icon: 'visibility',
    },
    {
      id: '5',
      name: 'ECG (Electrocardiogram)',
      type: 'cardiac',
      date: '2024-01-18',
      status: 'pending',
      doctor: 'Dr. Kwame Asante',
      location: 'Cardiology Department',
      instructions: 'Avoid caffeine 4 hours before test',
      color: '#9C27B0',
      icon: 'favorite',
    },
  ];

  const labResults: LabResult[] = [
    {
      id: '1',
      testName: 'Hemoglobin',
      value: '14.2',
      unit: 'g/dL',
      normalRange: '12.0 - 16.0',
      status: 'normal',
      date: '2024-01-15',
      color: '#4CAF50',
    },
    {
      id: '2',
      testName: 'White Blood Cells',
      value: '7.5',
      unit: 'K/μL',
      normalRange: '4.5 - 11.0',
      status: 'normal',
      date: '2024-01-15',
      color: '#4CAF50',
    },
    {
      id: '3',
      testName: 'Glucose',
      value: '95',
      unit: 'mg/dL',
      normalRange: '70 - 100',
      status: 'normal',
      date: '2024-01-15',
      color: '#4CAF50',
    },
    {
      id: '4',
      testName: 'Cholesterol',
      value: '220',
      unit: 'mg/dL',
      normalRange: '< 200',
      status: 'high',
      date: '2024-01-20',
      color: '#FF9800',
    },
  ];

  const filterOptions = [
    {key: 'all', label: 'All Tests', icon: 'list'},
    {key: 'scheduled', label: 'Scheduled', icon: 'schedule'},
    {key: 'completed', label: 'Completed', icon: 'check-circle'},
    {key: 'pending', label: 'Pending', icon: 'hourglass-empty'},
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getResultStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return '#4CAF50';
      case 'high':
        return '#FF9800';
      case 'low':
        return '#2196F3';
      case 'abnormal':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const filteredTests = selectedFilter === 'all' 
    ? labTests 
    : labTests.filter(test => test.status === selectedFilter);

  const renderLabTest = (test: LabTest) => (
    <TouchableOpacity key={test.id} style={styles.testCard}>
      <View style={styles.testHeader}>
        <View style={[styles.testIcon, {backgroundColor: test.color + '20'}]}>
          <SimpleIcon name={test.icon} size={24} color={test.color} />
        </View>
        <View style={styles.testInfo}>
          <Text style={styles.testName}>{test.name}</Text>
          <Text style={styles.testDate}>{test.date}</Text>
          <Text style={styles.testLocation}>{test.location}</Text>
          <Text style={styles.testDoctor}>Dr. {test.doctor}</Text>
        </View>
        <View style={styles.testStatus}>
          <View style={[styles.statusDot, {backgroundColor: getStatusColor(test.status)}]} />
          <Text style={[styles.statusText, {color: getStatusColor(test.status)}]}>
            {getStatusText(test.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.testDetails}>
        <Text style={styles.instructionsText}>{test.instructions}</Text>
        {test.results && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Results:</Text>
            <Text style={styles.resultsText}>{test.results}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderLabResult = (result: LabResult) => (
    <View key={result.id} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultName}>{result.testName}</Text>
        <View style={[styles.resultStatus, {backgroundColor: getResultStatusColor(result.status) + '20'}]}>
          <Text style={[styles.resultStatusText, {color: getResultStatusColor(result.status)}]}>
            {result.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.resultValues}>
        <Text style={styles.resultValue}>{result.value} {result.unit}</Text>
        <Text style={styles.resultRange}>Normal: {result.normalRange}</Text>
      </View>
      <Text style={styles.resultDate}>{result.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

        {/* Lab Tests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lab Tests</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Book Test</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.testsList}>
            {filteredTests.map(renderLabTest)}
          </View>
        </View>

        {/* Lab Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Results</Text>
          <View style={styles.resultsList}>
            {labResults.map(renderLabResult)}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#F44336', '#EF5350']}
                style={styles.quickActionGradient}>
                <SimpleIcon name="add" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Book Test</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#2196F3', '#42A5F5']}
                style={styles.quickActionGradient}>
                <SimpleIcon name="download" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Download Results</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#4CAF50', '#66BB6A']}
                style={styles.quickActionGradient}>
                <SimpleIcon name="share" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Share Results</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#FF9800', '#FFB74D']}
                style={styles.quickActionGradient}>
                <SimpleIcon name="history" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Test History</Text>
            </TouchableOpacity>
          </View>
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
  testsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  testCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  testIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  testInfo: {
    flex: 1,
    minWidth: 0,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  testDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  testLocation: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  testDoctor: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  testStatus: {
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
  testDetails: {
    marginLeft: 64,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  resultsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
  },
  resultsText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  resultsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  resultCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  resultStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  resultRange: {
    fontSize: 12,
    color: '#666666',
  },
  resultDate: {
    fontSize: 12,
    color: '#999999',
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
});

export default LabTestsScreen;
