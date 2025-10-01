import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import LinearGradient from 'react-native-linear-gradient';
import { apiService, apiClient } from '../services/apiService';

interface AvailabilitySettings {
  availabilitySchedule: any;
  workingDays: string[];
  workingHours: { start: string; end: string };
  breakTimes: any[];
  appointmentDuration: number;
  maxAppointmentsPerDay: number;
  advanceBookingDays: number;
  emergencyAvailability: boolean;
  timezone: string;
  isAvailable: boolean;
}

interface DoctorAvailabilitySettingsScreenProps {
  navigation: any;
  route: {
    params: {
      doctorId: string;
    };
  };
}

const DoctorAvailabilitySettingsScreen = ({ navigation, route }: DoctorAvailabilitySettingsScreenProps) => {
  const { doctorId } = route.params;
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '17:00' });
  const [appointmentDuration, setAppointmentDuration] = useState('30');
  const [maxAppointments, setMaxAppointments] = useState('20');
  const [advanceBooking, setAdvanceBooking] = useState('30');
  const [emergencyAvailability, setEmergencyAvailability] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    fetchAvailabilitySettings();
  }, []);

  const fetchAvailabilitySettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/availability-settings`);
      if (response.data.success) {
        const data = response.data.data;
        setSettings(data);
        setSelectedDays(data.workingDays || []);
        setWorkingHours(data.workingHours || { start: '09:00', end: '17:00' });
        setAppointmentDuration(data.appointmentDuration?.toString() || '30');
        setMaxAppointments(data.maxAppointmentsPerDay?.toString() || '20');
        setAdvanceBooking(data.advanceBookingDays?.toString() || '30');
        setEmergencyAvailability(data.emergencyAvailability || true);
        setIsAvailable(data.isAvailable || true);
      }
    } catch (error) {
      console.error('Error fetching availability settings:', error);
      Alert.alert('Error', 'Failed to load availability settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        workingDays: selectedDays,
        workingHours: workingHours,
        appointmentDuration: parseInt(appointmentDuration),
        maxAppointmentsPerDay: parseInt(maxAppointments),
        advanceBookingDays: parseInt(advanceBooking),
        emergencyAvailability: emergencyAvailability,
        isAvailable: isAvailable,
      };

      const response = await apiClient.patch(`/doctors/${doctorId}/availability-settings`, updateData);
      if (response.data.success) {
        Alert.alert('Success', 'Availability settings updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update availability settings');
      }
    } catch (error) {
      console.error('Error updating availability settings:', error);
      Alert.alert('Error', 'Failed to update availability settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <SimpleIcon name="arrow-back" size={24} color="#1976D2" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Availability Settings</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderWorkingDays = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Working Days</Text>
      <View style={styles.daysContainer}>
        {days.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayChip,
              selectedDays.includes(day) ? styles.activeDayChip : styles.inactiveDayChip
            ]}
            onPress={() => toggleDay(day)}
          >
            <Text style={[
              styles.dayText,
              selectedDays.includes(day) ? styles.activeDayText : styles.inactiveDayText
            ]}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderWorkingHours = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Working Hours</Text>
      <View style={styles.hoursContainer}>
        <View style={styles.hourInput}>
          <Text style={styles.hourLabel}>Start Time</Text>
          <TextInput
            style={styles.timeInput}
            value={workingHours.start}
            onChangeText={(text) => setWorkingHours(prev => ({ ...prev, start: text }))}
            placeholder="09:00"
          />
        </View>
        <View style={styles.hourInput}>
          <Text style={styles.hourLabel}>End Time</Text>
          <TextInput
            style={styles.timeInput}
            value={workingHours.end}
            onChangeText={(text) => setWorkingHours(prev => ({ ...prev, end: text }))}
            placeholder="17:00"
          />
        </View>
      </View>
    </View>
  );

  const renderAppointmentSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Appointment Settings</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Appointment Duration (minutes)</Text>
        <TextInput
          style={styles.numberInput}
          value={appointmentDuration}
          onChangeText={setAppointmentDuration}
          keyboardType="numeric"
          placeholder="30"
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Max Appointments per Day</Text>
        <TextInput
          style={styles.numberInput}
          value={maxAppointments}
          onChangeText={setMaxAppointments}
          keyboardType="numeric"
          placeholder="20"
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Advance Booking (days)</Text>
        <TextInput
          style={styles.numberInput}
          value={advanceBooking}
          onChangeText={setAdvanceBooking}
          keyboardType="numeric"
          placeholder="30"
        />
      </View>
    </View>
  );

  const renderAvailabilitySettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Availability Settings</Text>
      
      <View style={styles.switchRow}>
        <View style={styles.switchLabel}>
          <SimpleIcon name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.switchText}>Available for appointments</Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          thumbColor={isAvailable ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchLabel}>
          <SimpleIcon name="emergency" size={20} color="#F44336" />
          <Text style={styles.switchText}>Emergency availability</Text>
        </View>
        <Switch
          value={emergencyAvailability}
          onValueChange={setEmergencyAvailability}
          trackColor={{ false: '#E0E0E0', true: '#F44336' }}
          thumbColor={emergencyAvailability ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading availability settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderWorkingDays()}
        {renderWorkingHours()}
        {renderAppointmentSettings()}
        {renderAvailabilitySettings()}
        
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleSaveSettings}
            disabled={isSaving}
          >
            <LinearGradient
              colors={isSaving ? ['#BDBDBD', '#9E9E9E'] : ['#1976D2', '#1565C0']}
              style={styles.saveButtonGradient}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <SimpleIcon name="save" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
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
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  activeDayChip: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  inactiveDayChip: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeDayText: {
    color: '#FFFFFF',
  },
  inactiveDayText: {
    color: '#9E9E9E',
  },
  hoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hourInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  hourLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#000000',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
    backgroundColor: '#F8F9FA',
    color: '#000000',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  saveButtonContainer: {
    marginTop: 32,
    marginBottom: 32,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default DoctorAvailabilitySettingsScreen;
