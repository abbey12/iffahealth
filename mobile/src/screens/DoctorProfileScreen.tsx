import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import LinearGradient from 'react-native-linear-gradient';
import { apiService, apiClient } from '../services/apiService';

const { width } = Dimensions.get('window');

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
  medicalSchool?: string;
  graduationYear?: number;
  licenseNumber?: string;
}

interface DoctorProfileScreenProps {
  navigation: any;
  route: {
    params: {
      doctor: Doctor;
    };
  };
}

const DoctorProfileScreen = ({ navigation, route }: DoctorProfileScreenProps) => {
  const { doctor: initialDoctor } = route.params;
  const [doctor, setDoctor] = useState<Doctor | null>(initialDoctor);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [availabilitySettings, setAvailabilitySettings] = useState<any>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Fetch availability settings
  const fetchAvailabilitySettings = async (doctorId: string) => {
    setIsLoadingAvailability(true);
    try {
      // Use axios directly since apiService doesn't have a generic get method
      const response = await apiClient.get(`/doctors/${doctorId}/availability-settings`);
      if (response.data.success) {
        setAvailabilitySettings(response.data.data);
      }
    } catch (error) {
      console.error('Error loading availability settings:', error);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Fetch detailed doctor data if only ID is provided
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      if (initialDoctor && typeof initialDoctor === 'string') {
        setIsLoading(true);
        try {
          const response = await apiService.getDoctorProfile(initialDoctor);
          if (response.success) {
            setDoctor(response.data);
            // Fetch availability settings for the doctor
            fetchAvailabilitySettings(initialDoctor);
          } else {
            Alert.alert('Error', 'Failed to load doctor details');
          }
        } catch (error) {
          console.error('Error loading doctor details:', error);
          Alert.alert('Error', 'Failed to load doctor details');
        } finally {
          setIsLoading(false);
        }
      } else if (initialDoctor && initialDoctor.id) {
        // If we have a doctor object with ID, fetch availability settings
        fetchAvailabilitySettings(initialDoctor.id);
      }
    };

    fetchDoctorDetails();
  }, [initialDoctor]);

  const handleBookAppointment = () => {
    if (doctor) {
      navigation.navigate('BookAppointment', { doctor });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading doctor details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Doctor information not available</Text>
        </View>
      </SafeAreaView>
    );
  }



  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
        onPress={() => setSelectedTab('overview')}
      >
        <SimpleIcon 
          name="person" 
          size={18} 
          color={selectedTab === 'overview' ? '#1976D2' : '#9E9E9E'} 
        />
        <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]} numberOfLines={1}>
          Overview
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'qualifications' && styles.activeTab]}
        onPress={() => setSelectedTab('qualifications')}
      >
        <SimpleIcon 
          name="school" 
          size={18} 
          color={selectedTab === 'qualifications' ? '#1976D2' : '#9E9E9E'} 
        />
        <Text style={[styles.tabText, selectedTab === 'qualifications' && styles.activeTabText]} numberOfLines={1}>
          Qualifications
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'reviews' && styles.activeTab]}
        onPress={() => setSelectedTab('reviews')}
      >
        <SimpleIcon 
          name="star" 
          size={18} 
          color={selectedTab === 'reviews' ? '#1976D2' : '#9E9E9E'} 
        />
        <Text style={[styles.tabText, selectedTab === 'reviews' && styles.activeTabText]} numberOfLines={1}>
          Reviews
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'availability' && styles.activeTab]}
        onPress={() => setSelectedTab('availability')}
      >
        <SimpleIcon 
          name="schedule" 
          size={18} 
          color={selectedTab === 'availability' ? '#1976D2' : '#9E9E9E'} 
        />
        <Text style={[styles.tabText, selectedTab === 'availability' && styles.activeTabText]} numberOfLines={1}>
          Availability
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* About Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SimpleIcon name="person" size={20} color="#1976D2" />
          <Text style={styles.cardTitle}>About Dr. {doctor.firstName} {doctor.lastName}</Text>
        </View>
        <Text style={styles.bioText}>{doctor.bio || 'No bio available'}</Text>
      </View>

      {/* Experience & Education Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SimpleIcon name="work" size={20} color="#1976D2" />
          <Text style={styles.cardTitle}>Experience & Education</Text>
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <SimpleIcon name="work" size={24} color="#4CAF50" />
            <Text style={styles.infoCardLabel}>Experience</Text>
            <Text style={styles.infoCardValue}>{doctor.experienceYears} years</Text>
          </View>
          
          {doctor.medicalSchool && (
            <View style={styles.infoCard}>
              <SimpleIcon name="school" size={24} color="#2196F3" />
              <Text style={styles.infoCardLabel}>Education</Text>
              <Text style={styles.infoCardValue}>{doctor.medicalSchool}</Text>
              {doctor.graduationYear && (
                <Text style={styles.infoCardSubtext}>Class of {doctor.graduationYear}</Text>
              )}
            </View>
          )}
        </View>

        {doctor.hospitalAffiliation && (
          <View style={styles.infoRow}>
            <SimpleIcon name="business" size={20} color="#FF9800" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Hospital Affiliation</Text>
              <Text style={styles.infoValue}>{doctor.hospitalAffiliation}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Languages Card */}
      {doctor.languages && doctor.languages.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SimpleIcon name="language" size={20} color="#1976D2" />
            <Text style={styles.cardTitle}>Languages Spoken</Text>
          </View>
          <View style={styles.languagesContainer}>
            {doctor.languages.map((language, index) => (
              <View key={index} style={styles.languageTag}>
                <Text style={styles.languageText}>{language}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Consultation Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SimpleIcon name="videocam" size={20} color="#1976D2" />
          <Text style={styles.cardTitle}>Consultation Details</Text>
        </View>
        
        <View style={styles.consultationGrid}>
          <View style={styles.consultationCard}>
            <SimpleIcon name="videocam" size={32} color="#4CAF50" />
            <Text style={styles.consultationCardTitle}>Video Call</Text>
            <Text style={styles.consultationCardSubtext}>Available</Text>
          </View>
          
          <View style={styles.consultationCard}>
            <SimpleIcon name="attach-money" size={32} color="#FF9800" />
            <Text style={styles.consultationCardTitle}>Consultation Fee</Text>
            <Text style={styles.consultationCardSubtext}>₵{doctor.consultationFee}</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SimpleIcon name="analytics" size={20} color="#1976D2" />
          <Text style={styles.cardTitle}>Quick Stats</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{doctor.experienceYears}</Text>
            <Text style={styles.statLabel}>Years Experience</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{doctor.averageRating || 0}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{doctor.totalReviews || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderQualifications = () => (
    <View style={styles.tabContent}>
      {/* Professional Qualifications Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SimpleIcon name="verified" size={20} color="#1976D2" />
          <Text style={styles.cardTitle}>Professional Qualifications</Text>
        </View>
        
        <View style={styles.qualificationsList}>
          <View style={styles.qualificationItem}>
            <View style={styles.qualificationIcon}>
              <SimpleIcon name="school" size={20} color="#4CAF50" />
            </View>
            <View style={styles.qualificationContent}>
              <Text style={styles.qualificationTitle}>Medical Degree</Text>
              <Text style={styles.qualificationText}>{doctor.medicalSchool || 'Medical School'}</Text>
              {doctor.graduationYear && (
                <Text style={styles.qualificationYear}>Class of {doctor.graduationYear}</Text>
              )}
            </View>
          </View>

          {doctor.licenseNumber && (
            <View style={styles.qualificationItem}>
              <View style={styles.qualificationIcon}>
                <SimpleIcon name="badge" size={20} color="#2196F3" />
              </View>
              <View style={styles.qualificationContent}>
                <Text style={styles.qualificationTitle}>Medical License</Text>
                <Text style={styles.qualificationText}>License #{doctor.licenseNumber}</Text>
                <Text style={styles.qualificationYear}>Valid & Current</Text>
              </View>
            </View>
          )}

          <View style={styles.qualificationItem}>
            <View style={styles.qualificationIcon}>
              <SimpleIcon name="verified" size={20} color="#FF9800" />
            </View>
            <View style={styles.qualificationContent}>
              <Text style={styles.qualificationTitle}>Verification Status</Text>
              <Text style={styles.qualificationText}>Verified Professional</Text>
              <Text style={styles.qualificationYear}>Background Checked</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Specializations Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SimpleIcon name="medical-services" size={20} color="#1976D2" />
          <Text style={styles.cardTitle}>Specializations</Text>
        </View>
        
        <View style={styles.specializationContainer}>
          <View style={styles.specializationTag}>
            <SimpleIcon name="star" size={16} color="#FFFFFF" />
            <Text style={styles.specializationText}>{doctor.specialty}</Text>
          </View>
        </View>
      </View>

      {/* Professional Experience Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SimpleIcon name="work" size={20} color="#1976D2" />
          <Text style={styles.cardTitle}>Professional Experience</Text>
        </View>
        
        <View style={styles.experienceCard}>
          <View style={styles.experienceHeader}>
            <Text style={styles.experienceTitle}>{doctor.specialty} Specialist</Text>
            <View style={styles.experienceBadge}>
              <Text style={styles.experienceBadgeText}>{doctor.experienceYears} years</Text>
            </View>
          </View>
          <Text style={styles.experienceDescription}>
            Providing comprehensive healthcare services with a focus on patient-centered care
            and evidence-based medicine. Committed to delivering high-quality medical care
            and maintaining the highest professional standards.
          </Text>
          
          <View style={styles.experienceHighlights}>
            <View style={styles.highlightItem}>
              <SimpleIcon name="check" size={16} color="#4CAF50" />
              <Text style={styles.highlightText}>Patient-centered care</Text>
            </View>
            <View style={styles.highlightItem}>
              <SimpleIcon name="check" size={16} color="#4CAF50" />
              <Text style={styles.highlightText}>Evidence-based medicine</Text>
            </View>
            <View style={styles.highlightItem}>
              <SimpleIcon name="check" size={16} color="#4CAF50" />
              <Text style={styles.highlightText}>Continuous learning</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderReviews = () => (
    <View style={styles.tabContent}>
      {/* Rating Summary Card */}
      <View style={styles.card}>
        <View style={styles.ratingSummary}>
          <View style={styles.ratingMain}>
            <Text style={styles.ratingNumber}>{doctor.averageRating || 0}</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <SimpleIcon
                  key={star}
                  name={star <= Math.floor(doctor.averageRating || 0) ? 'star' : 'star-border'}
                  size={24}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.ratingCount}>{doctor.totalReviews || 0} reviews</Text>
          </View>
          
          <View style={styles.ratingBreakdown}>
            <View style={styles.ratingBar}>
              <Text style={styles.ratingBarLabel}>5★</Text>
              <View style={styles.ratingBarContainer}>
                <View style={[styles.ratingBarFill, { width: '85%' }]} />
              </View>
              <Text style={styles.ratingBarCount}>85%</Text>
            </View>
            <View style={styles.ratingBar}>
              <Text style={styles.ratingBarLabel}>4★</Text>
              <View style={styles.ratingBarContainer}>
                <View style={[styles.ratingBarFill, { width: '10%' }]} />
              </View>
              <Text style={styles.ratingBarCount}>10%</Text>
            </View>
            <View style={styles.ratingBar}>
              <Text style={styles.ratingBarLabel}>3★</Text>
              <View style={styles.ratingBarContainer}>
                <View style={[styles.ratingBarFill, { width: '3%' }]} />
              </View>
              <Text style={styles.ratingBarCount}>3%</Text>
            </View>
            <View style={styles.ratingBar}>
              <Text style={styles.ratingBarLabel}>2★</Text>
              <View style={styles.ratingBarContainer}>
                <View style={[styles.ratingBarFill, { width: '1%' }]} />
              </View>
              <Text style={styles.ratingBarCount}>1%</Text>
            </View>
            <View style={styles.ratingBar}>
              <Text style={styles.ratingBarLabel}>1★</Text>
              <View style={styles.ratingBarContainer}>
                <View style={[styles.ratingBarFill, { width: '1%' }]} />
              </View>
              <Text style={styles.ratingBarCount}>1%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Reviews List Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SimpleIcon name="rate-review" size={20} color="#1976D2" />
          <Text style={styles.cardTitle}>Patient Reviews</Text>
        </View>
        
        {doctor.totalReviews && doctor.totalReviews > 0 ? (
          [
            {
              id: 1,
              patient: 'Sarah M.',
              rating: 5,
              comment: 'Dr. ' + doctor.lastName + ' was very thorough and explained everything clearly. Highly recommended!',
              date: '2 days ago',
              verified: true,
            },
            {
              id: 2,
              patient: 'John D.',
              rating: 5,
              comment: 'Excellent doctor with great bedside manner. The video consultation was seamless.',
              date: '1 week ago',
              verified: true,
            },
            {
              id: 3,
              patient: 'Aisha K.',
              rating: 4,
              comment: 'Very professional and knowledgeable. Would definitely book again.',
              date: '2 weeks ago',
              verified: false,
            },
          ].map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewPatientInfo}>
                  <Text style={styles.reviewPatient}>{review.patient}</Text>
                  {review.verified && (
                    <View style={styles.verifiedReviewBadge}>
                      <SimpleIcon name="check" size={12} color="#4CAF50" />
                      <Text style={styles.verifiedReviewText}>Verified</Text>
                    </View>
                  )}
                </View>
                <View style={styles.reviewRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <SimpleIcon
                      key={star}
                      name={star <= review.rating ? 'star' : 'star-border'}
                      size={16}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyReviews}>
            <SimpleIcon name="rate-review" size={48} color="#E0E0E0" />
            <Text style={styles.emptyReviewsText}>No reviews yet</Text>
            <Text style={styles.emptyReviewsSubtext}>Be the first to review this doctor</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAvailability = () => (
    <View style={styles.tabContent}>
      {isLoadingAvailability ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading availability settings...</Text>
        </View>
      ) : availabilitySettings ? (
        <>
          {/* Current Availability Status */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <SimpleIcon name="schedule" size={20} color="#1976D2" />
              <Text style={styles.cardTitle}>Current Availability</Text>
            </View>
            <View style={styles.availabilityStatus}>
              <View style={[
                styles.statusIndicator,
                availabilitySettings.isAvailable ? styles.availableIndicator : styles.unavailableIndicator
              ]}>
                <SimpleIcon 
                  name={availabilitySettings.isAvailable ? "check-circle" : "pause-circle"} 
                  size={24} 
                  color={availabilitySettings.isAvailable ? "#4CAF50" : "#F44336"} 
                />
                <Text style={[
                  styles.statusText,
                  availabilitySettings.isAvailable ? styles.availableText : styles.unavailableText
                ]}>
                  {availabilitySettings.isAvailable ? 'Available for appointments' : 'Currently unavailable'}
                </Text>
              </View>
            </View>
          </View>

          {/* Working Days */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <SimpleIcon name="calendar-today" size={20} color="#1976D2" />
              <Text style={styles.cardTitle}>Working Days</Text>
            </View>
            <View style={styles.workingDaysContainer}>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <View key={day} style={styles.dayItem}>
                  <View style={[
                    styles.dayChip,
                    availabilitySettings.workingDays?.includes(day) ? styles.activeDayChip : styles.inactiveDayChip
                  ]}>
                    <Text style={[
                      styles.dayText,
                      availabilitySettings.workingDays?.includes(day) ? styles.activeDayText : styles.inactiveDayText
                    ]}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Working Hours */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <SimpleIcon name="access-time" size={20} color="#1976D2" />
              <Text style={styles.cardTitle}>Working Hours</Text>
            </View>
            <View style={styles.hoursContainer}>
              <View style={styles.hourItem}>
                <SimpleIcon name="schedule" size={16} color="#4CAF50" />
                <Text style={styles.hourLabel}>Start Time</Text>
                <Text style={styles.hourValue}>{availabilitySettings.workingHours?.start || '09:00'}</Text>
              </View>
              <View style={styles.hourItem}>
                <SimpleIcon name="schedule" size={16} color="#F44336" />
                <Text style={styles.hourLabel}>End Time</Text>
                <Text style={styles.hourValue}>{availabilitySettings.workingHours?.end || '17:00'}</Text>
              </View>
            </View>
          </View>

          {/* Appointment Settings */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <SimpleIcon name="settings" size={20} color="#1976D2" />
              <Text style={styles.cardTitle}>Appointment Settings</Text>
            </View>
            <View style={styles.settingsContainer}>
              <View style={styles.settingItem}>
                <SimpleIcon name="timer" size={16} color="#FF9800" />
                <Text style={styles.settingLabel}>Appointment Duration</Text>
                <Text style={styles.settingValue}>{availabilitySettings.appointmentDuration} minutes</Text>
              </View>
              <View style={styles.settingItem}>
                <SimpleIcon name="event" size={16} color="#2196F3" />
                <Text style={styles.settingLabel}>Max Appointments/Day</Text>
                <Text style={styles.settingValue}>{availabilitySettings.maxAppointmentsPerDay}</Text>
              </View>
              <View style={styles.settingItem}>
                <SimpleIcon name="date-range" size={16} color="#9C27B0" />
                <Text style={styles.settingLabel}>Advance Booking</Text>
                <Text style={styles.settingValue}>{availabilitySettings.advanceBookingDays} days</Text>
              </View>
              <View style={styles.settingItem}>
                <SimpleIcon name="emergency" size={16} color="#F44336" />
                <Text style={styles.settingLabel}>Emergency Availability</Text>
                <Text style={[
                  styles.settingValue,
                  availabilitySettings.emergencyAvailability ? styles.emergencyAvailable : styles.emergencyUnavailable
                ]}>
                  {availabilitySettings.emergencyAvailability ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          </View>

          {/* Timezone */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <SimpleIcon name="language" size={20} color="#1976D2" />
              <Text style={styles.cardTitle}>Timezone</Text>
            </View>
            <View style={styles.timezoneContainer}>
              <SimpleIcon name="public" size={16} color="#666" />
              <Text style={styles.timezoneText}>{availabilitySettings.timezone || 'UTC'}</Text>
            </View>
          </View>

          {/* Edit Settings Button */}
          <TouchableOpacity
            style={styles.editSettingsButton}
            onPress={() => navigation.navigate('DoctorAvailabilitySettings', { doctorId: doctor?.id })}
          >
            <LinearGradient
              colors={['#1976D2', '#1565C0']}
              style={styles.editSettingsGradient}
            >
              <SimpleIcon name="edit" size={20} color="#FFFFFF" />
              <Text style={styles.editSettingsText}>Edit Availability Settings</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyState}>
          <SimpleIcon name="schedule" size={48} color="#E0E0E0" />
          <Text style={styles.emptyStateText}>Availability settings not found</Text>
          <Text style={styles.emptyStateSubtext}>Contact support if this issue persists</Text>
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'qualifications':
        return renderQualifications();
      case 'reviews':
        return renderReviews();
      case 'availability':
        return renderAvailability();
      default:
        return renderOverview();
    }
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[
          styles.bookButton,
          !doctor.isAvailable && styles.disabledBookButton
        ]}
        onPress={handleBookAppointment}
        disabled={!doctor.isAvailable}
      >
        <LinearGradient
          colors={doctor.isAvailable ? ['#1976D2', '#1565C0'] : ['#BDBDBD', '#9E9E9E']}
          style={styles.bookButtonGradient}
        >
          <SimpleIcon name="event" size={20} color="#ffffff" />
          <Text style={styles.bookButtonText}>
             {doctor.isAvailable ? 'Book Doctor' : 'Currently Unavailable'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.favoriteButton}>
        <SimpleIcon name="favorite-border" size={20} color="#1976D2" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      {/* Single scroll with sticky tab bar */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Header (index 0) */}
        <LinearGradient
          colors={['#1976D2', '#1565C0', '#0D47A1']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <SimpleIcon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.profileCard}>
              <View style={styles.profileImageContainer}>
                <Image 
                  source={{ 
                    uri: doctor.profileImageUrl || 'https://via.placeholder.com/120x120/FFFFFF/1976D2?text=DR' 
                  }} 
                  style={styles.profileImage} 
                />
                {doctor.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <SimpleIcon name="check" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.doctorName}>Dr. {doctor.firstName} {doctor.lastName}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                <View style={styles.ratingSection}>
                  <View style={styles.ratingContainer}>
                    <SimpleIcon name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{doctor.averageRating || 0}</Text>
                    <Text style={styles.reviewCount}>({doctor.totalReviews || 0} reviews)</Text>
                  </View>
                </View>
                <View style={styles.keyInfoRow}>
                  <View style={styles.infoItem}>
                    <SimpleIcon name="work" size={14} color="#E3F2FD" />
                    <Text style={styles.infoText}>{doctor.experienceYears} years exp</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <SimpleIcon name="location-on" size={14} color="#E3F2FD" />
                    <Text style={styles.infoText}>{doctor.city}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <SimpleIcon name="attach-money" size={14} color="#E3F2FD" />
                    <Text style={styles.infoText}>₵{doctor.consultationFee}</Text>
                  </View>
                </View>
                <View style={[
                  styles.availabilityBadge,
                  doctor.isAvailable ? styles.availableBadge : styles.unavailableBadge
                ]}>
                  <SimpleIcon 
                    name={doctor.isAvailable ? "check-circle" : "pause-circle"} 
                    size={16} 
                    color={doctor.isAvailable ? "#4CAF50" : "#F44336"} 
                  />
                  <Text style={[
                    styles.availabilityText,
                    doctor.isAvailable ? styles.availableText : styles.unavailableText
                  ]}>
                    {doctor.isAvailable ? 'Available Now' : 'Currently Busy'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Sticky Tab Bar (index 1) */}
        <View style={styles.stickyTabBar}>
          {renderTabBar()}
        </View>

        {/* Tab Content (index 2) */}
        <View>
          {renderTabContent()}
          {/* Action Buttons at bottom of content */}
          {renderActionButtons()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Header Styles
  headerGradient: {
    paddingTop: 10,
    paddingBottom: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileImageContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#1976D2',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  ratingSection: {
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  keyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 4,
    fontWeight: '600',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  availableBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  unavailableBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  availableText: {
    color: '#4CAF50',
  },
  unavailableText: {
    color: '#F44336',
  },

  // Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1976D2',
  },
  tabText: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#1976D2',
    fontWeight: '700',
  },

  // Content Styles
  content: {
    flex: 1,
  },
  stickyTabBar: {
    backgroundColor: '#FFFFFF',
  },
  tabContent: {
    padding: 20,
  },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },

  // Bio Styles
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },

  // Info Grid Styles
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  infoCardSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  // Languages Styles
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },

  // Consultation Styles
  consultationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  consultationCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  consultationCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 4,
  },
  consultationCardSubtext: {
    fontSize: 12,
    color: '#666',
  },

  // Stats Styles
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Qualifications Styles
  qualificationsList: {
    marginTop: 8,
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  qualificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qualificationContent: {
    flex: 1,
  },
  qualificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  qualificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  qualificationYear: {
    fontSize: 12,
    color: '#999',
  },

  // Specialization Styles
  specializationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specializationTag: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  specializationText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Experience Styles
  experienceCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  experienceBadge: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  experienceBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  experienceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  experienceHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },

  // Reviews Styles
  ratingSummary: {
    padding: 20,
  },
  ratingMain: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingCount: {
    fontSize: 16,
    color: '#666',
  },
  ratingBreakdown: {
    marginTop: 16,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBarLabel: {
    fontSize: 12,
    color: '#666',
    width: 30,
  },
  ratingBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  ratingBarFill: {
    height: 6,
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  ratingBarCount: {
    fontSize: 12,
    color: '#666',
    width: 30,
    textAlign: 'right',
  },
  reviewItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  verifiedReviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  verifiedReviewText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 2,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyReviewsSubtext: {
    fontSize: 14,
    color: '#999',
  },

  // Action Buttons Styles
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  bookButton: {
    flex: 1,
    marginRight: 12,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  disabledBookButton: {
    opacity: 0.6,
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  // Loading and Error Styles
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
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },

  // Availability Styles
  availabilityStatus: {
    padding: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  availableIndicator: {
    backgroundColor: '#E8F5E8',
  },
  unavailableIndicator: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  workingDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  dayItem: {
    marginRight: 8,
    marginBottom: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    fontSize: 12,
    fontWeight: '600',
  },
  activeDayText: {
    color: '#FFFFFF',
  },
  inactiveDayText: {
    color: '#9E9E9E',
  },
  hoursContainer: {
    padding: 16,
  },
  hourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hourLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  hourValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  settingsContainer: {
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  emergencyAvailable: {
    color: '#4CAF50',
  },
  emergencyUnavailable: {
    color: '#F44336',
  },
  timezoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  timezoneText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8,
    textAlign: 'center',
  },
  editSettingsButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editSettingsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  editSettingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default DoctorProfileScreen;
