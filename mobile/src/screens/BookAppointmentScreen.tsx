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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useData } from '../context/DataContext';
import { apiService } from '../services/apiService';
import { googleMeetService, GoogleMeetConfig } from '../services/googleMeetService';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  consultationFee: number;
  bio?: string;
  languages?: string[];
  experienceYears: number;
  profileImageUrl?: string;
  isVerified: boolean;
  city: string;
  hospitalAffiliation?: string;
  averageRating?: number;
  totalReviews?: number;
  isAvailable: boolean;
}

interface BookAppointmentScreenProps {
  navigation: any;
  route: {
    params: {
      doctor: Doctor;
    };
  };
}

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

const BookAppointmentScreen = ({ navigation, route }: BookAppointmentScreenProps) => {
  const { doctor: doctorParam } = route.params;
  const { patient } = useData();
  const [doctor, setDoctor] = useState<Doctor | null>(doctorParam);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const appointmentType = 'video'; // Fixed to video call only
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(false);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Load doctor details if only ID is provided
  useEffect(() => {
    const loadDoctorDetails = async () => {
      if (doctorParam && typeof doctorParam === 'string') {
        setIsLoadingDoctor(true);
        try {
          const response = await apiService.getDoctorProfile(doctorParam);
          if (response.success) {
            setDoctor(response.data);
          }
        } catch (error) {
          console.error('Error loading doctor details:', error);
          Alert.alert('Error', 'Failed to load doctor details');
        } finally {
          setIsLoadingDoctor(false);
        }
      }
    };

    loadDoctorDetails();
  }, [doctorParam]);

  // Load doctor availability for selected date
  const loadDoctorAvailability = async (date: Date) => {
    if (!doctor?.id) return;
    
    setIsLoadingAvailability(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const response = await apiService.getDoctorAvailability(doctor.id, dateString);
      
      if (response.success) {
        const now = new Date();
        const slots: TimeSlot[] = response.data.availableSlots
          .map((time: string) => {
            const timeString = time.substring(0, 5); // Remove seconds
            const [hours, minutes] = timeString.split(':').map(Number);
            const slotDate = new Date(date);
            slotDate.setHours(hours, minutes, 0, 0);
            
            return {
              id: time,
              time: timeString,
              isAvailable: slotDate > now, // Only available if in the future
              slotDate: slotDate,
            };
          })
          .filter(slot => slot.isAvailable) // Only show future slots
          .map(slot => ({
            id: slot.id,
            time: slot.time,
            isAvailable: true, // All filtered slots are available
          }));
        
        setTimeSlots(slots);
      }
    } catch (error) {
      console.error('Error loading doctor availability:', error);
      // Fallback to basic time slots if API fails
      generateBasicTimeSlots(date);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Fallback method to generate basic time slots
  const generateBasicTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const now = new Date();
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        
        // Only include slots that are in the future
        if (slotDate > now) {
          slots.push({
            id: `${hour}-${minute}`,
            time: timeString,
            isAvailable: true, // All filtered slots are available
          });
        }
      }
    }
    
    return slots;
  };

  useEffect(() => {
    if (doctor?.id) {
      loadDoctorAvailability(selectedDate);
    } else {
      setTimeSlots(generateBasicTimeSlots(selectedDate));
    }
  }, [selectedDate, doctor?.id]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setSelectedTimeSlot(null);
    }
  };

  const handleTimeSlotSelect = (slotId: string) => {
    setSelectedTimeSlot(slotId);
  };

  const handleBookAppointment = async () => {
    if (!selectedTimeSlot) {
      Alert.alert('Select Time', 'Please select a time slot for your appointment.');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Appointment Reason', 'Please provide a reason for your appointment.');
      return;
    }

    if (!doctor?.id) {
      Alert.alert('Error', 'Doctor information not available.');
      return;
    }

    if (!patient?.id) {
      Alert.alert('Error', 'Please log in to book an appointment.');
      return;
    }

    setIsLoading(true);
    try {
      const selectedTime = timeSlots.find(slot => slot.id === selectedTimeSlot)?.time;
      if (selectedTime) {
        const patientRecordId = patient?.profileId || patient?.id;

        if (!patientRecordId) {
          console.error('❌ Missing patient record ID for appointment');
          Alert.alert('Error', 'Unable to determine your patient profile. Please log in again.');
          return;
        }

        console.log('🔍 Patient data for appointment:', {
          patientId: patient?.id,
          profileId: patient?.profileId,
          willUse: patientRecordId,
        });

        // Generate Google Meet link for the appointment
        const meetConfig: GoogleMeetConfig = {
          appointmentId: '', // Will be set after appointment creation
          doctorId: doctor.id,
          patientId: patientRecordId,
          doctorName: `${doctor.firstName} ${doctor.lastName}`,
          patientName: `${patient.firstName} ${patient.lastName}`,
          appointmentDate: selectedDate.toISOString().split('T')[0],
          appointmentTime: selectedTime,
        };

        const appointmentData = {
          patient_id: patientRecordId,
          doctor_id: doctor.id,
          appointment_date: selectedDate.toISOString().split('T')[0],
          appointment_time: selectedTime,
          type: 'video',
          notes: reason,
          // No meeting_link here - will be generated after payment
        };

        console.log('📝 Appointment data being sent:', appointmentData);

        const response = await apiService.createAppointment(appointmentData);
        
        if (response.success) {
          // Navigate to payment screen (no Google Meet link yet)
          navigation.navigate('Payment', {
            appointmentId: response.data.id,
            doctorId: doctor.id,
            doctorName: `${doctor.firstName} ${doctor.lastName}`,
            specialty: doctor.specialty,
            consultationFee: doctor.consultationFee,
            appointmentDate: selectedDate.toISOString().split('T')[0],
            appointmentTime: selectedTime,
            patientId: patient.profileId || patient.id, // Use patient table ID for foreign key
            patientEmail: patient.email,
            // No meetLink here - will be generated after payment
          });
        } else {
          Alert.alert('Error', 'Failed to create appointment. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', 'Failed to create appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };


  const renderDoctorInfo = () => {
    if (isLoadingDoctor) {
      return (
        <View style={styles.doctorInfoCard}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading doctor details...</Text>
          </View>
        </View>
      );
    }

    if (!doctor) {
      return (
        <View style={styles.doctorInfoCard}>
          <Text style={styles.errorText}>Doctor information not available</Text>
        </View>
      );
    }

    return (
      <View style={styles.doctorInfoCard}>
        <View style={styles.doctorInfoHeader}>
          <Text style={styles.doctorName}>{`${doctor.firstName} ${doctor.lastName}`}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
          {doctor.hospitalAffiliation && (
            <Text style={styles.doctorHospital}>{doctor.hospitalAffiliation}</Text>
          )}
          {doctor.city && (
            <Text style={styles.doctorLocation}>{doctor.city}</Text>
          )}
        </View>
        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Consultation Fee:</Text>
          <Text style={styles.feeAmount}>₵{doctor.consultationFee}</Text>
        </View>
        {doctor.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bioText}>{doctor.bio}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderAppointmentType = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Appointment Type</Text>
      <View style={styles.typeContainer}>
        <View style={[styles.typeOption, styles.selectedTypeOption]}>
          <SimpleIcon
            name="videocam"
            size={24}
            color="#007AFF"
          />
          <Text style={[styles.typeText, styles.selectedTypeText]}>
            Video Call
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDateSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <SimpleIcon name="calendar-today" size={20} color="#007AFF" />
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        <SimpleIcon name="keyboard-arrow-down" size={20} color="#666" />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );

  const renderTimeSlots = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Available Time Slots</Text>
      {isLoadingAvailability ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading available slots...</Text>
        </View>
      ) : (
        <View style={styles.timeSlotsContainer}>
          {timeSlots.length === 0 ? (
            <Text style={styles.noSlotsText}>No available slots for this date</Text>
          ) : (
            timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlot,
                  selectedTimeSlot === slot.id && styles.selectedTimeSlot,
                  !slot.isAvailable && styles.unavailableTimeSlot,
                ]}
                onPress={() => slot.isAvailable && handleTimeSlotSelect(slot.id)}
                disabled={!slot.isAvailable}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTimeSlot === slot.id && styles.selectedTimeSlotText,
                    !slot.isAvailable && styles.unavailableTimeSlotText,
                  ]}
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );

  const renderReasonInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reason for Appointment</Text>
      <TextInput
        style={styles.reasonInput}
        placeholder="Please describe your symptoms or reason for the appointment..."
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        placeholderTextColor="#999"
      />
    </View>
  );

  const renderBookingSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Booking Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Doctor:</Text>
        <Text style={styles.summaryValue}>
          {doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Loading...'}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Type:</Text>
        <Text style={styles.summaryValue}>Video Call</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Date:</Text>
        <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
      </View>
      {selectedTimeSlot && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time:</Text>
          <Text style={styles.summaryValue}>
            {timeSlots.find(slot => slot.id === selectedTimeSlot)?.time}
          </Text>
        </View>
      )}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Fee:</Text>
        <Text style={styles.summaryValue}>
          {doctor ? `₵${doctor.consultationFee}` : 'Loading...'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderDoctorInfo()}
        {renderAppointmentType()}
        {renderDateSelection()}
        {renderTimeSlots()}
        {renderReasonInput()}
        {renderBookingSummary()}
      </ScrollView>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedTimeSlot || !reason.trim() || isLoading) && styles.disabledBookButton,
          ]}
          onPress={handleBookAppointment}
          disabled={!selectedTimeSlot || !reason.trim() || isLoading}
        >
          <Text style={styles.bookButtonText}>
            {isLoading ? 'Processing...' : 'Proceed to Payment'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  doctorInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  doctorInfoHeader: {
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeLabel: {
    fontSize: 14,
    color: '#666',
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  selectedTypeOption: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  disabledTypeOption: {
    opacity: 0.5,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  selectedTypeText: {
    color: '#007AFF',
  },
  disabledTypeText: {
    color: '#999',
  },
  unavailableText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  unavailableTimeSlot: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#007AFF',
  },
  unavailableTimeSlotText: {
    color: '#999',
  },
  reasonInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledBookButton: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    paddingVertical: 20,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  doctorHospital: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  doctorLocation: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  bioContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default BookAppointmentScreen;
