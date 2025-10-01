import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import LinearGradient from 'react-native-linear-gradient';
import { apiService } from '../services/apiService';

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
  isCurrentlyAvailable?: boolean;
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  emergencyAvailability?: boolean;
  timezone?: string;
}

const DoctorListScreen = ({ navigation }: any) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specialties = [
    'All',
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Gynecology',
    'Orthopedics',
    'Psychiatry',
    'Neurology',
    'Oncology',
  ];

  // Load doctors from API with availability filtering
  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading doctors with params:', {
        specialty: selectedSpecialty === 'All' ? undefined : selectedSpecialty,
        search: searchQuery,
        checkAvailability: true
      });
      
      const response = await apiService.getDoctors(
        selectedSpecialty === 'All' ? undefined : selectedSpecialty, 
        searchQuery,
        true // Enable availability checking
      );
      
      console.log('📊 API Response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        data: response.data
      });
      
      if (response.success) {
        // Transform API data to match our interface
        const transformedDoctors: Doctor[] = response.data.map((doctor: any) => ({
          id: doctor.id,
          firstName: doctor.firstName || doctor.first_name,
          lastName: doctor.lastName || doctor.last_name,
          specialty: doctor.specialty,
          consultationFee: doctor.consultationFee || doctor.consultation_fee,
          bio: doctor.bio,
          languages: doctor.languages || [],
          experienceYears: doctor.experienceYears || doctor.experience_years || 0,
          profileImageUrl: doctor.profileImageUrl || doctor.profile_image_url,
          isVerified: doctor.isVerified || doctor.is_verified || false,
          city: doctor.city,
          hospitalAffiliation: doctor.hospitalAffiliation || doctor.hospital_affiliation,
          averageRating: doctor.averageRating || doctor.average_rating || 0,
          totalReviews: doctor.totalReviews || doctor.total_reviews || 0,
          isAvailable: doctor.isAvailable || doctor.is_available || false,
          isCurrentlyAvailable: doctor.isCurrentlyAvailable || false,
          workingDays: doctor.workingDays || doctor.working_days || [],
          workingHours: doctor.workingHours || doctor.working_hours || {},
          emergencyAvailability: doctor.emergencyAvailability || doctor.emergency_availability || false,
          timezone: doctor.timezone || 'UTC'
        }));
        
        console.log('✅ Transformed doctors:', transformedDoctors.length);
        setDoctors(transformedDoctors);
        setFilteredDoctors(transformedDoctors);
      } else {
        console.log('❌ API returned success: false');
        setError('Failed to load doctors');
      }
    } catch (error) {
      console.error('❌ Error loading doctors:', error);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty, searchQuery]);

  useEffect(() => {
    filterDoctors();
  }, [searchQuery, selectedSpecialty, doctors, showOnlyAvailable]);

  const filterDoctors = () => {
    let filtered = doctors;

    if (selectedSpecialty !== 'All') {
      filtered = filtered.filter(doctor => doctor.specialty === selectedSpecialty);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(doctor =>
        `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by availability if enabled
    if (showOnlyAvailable) {
      filtered = filtered.filter(doctor => 
        doctor.isCurrentlyAvailable !== undefined 
          ? doctor.isCurrentlyAvailable 
          : doctor.isAvailable
      );
    }

    setFilteredDoctors(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDoctors();
    setRefreshing(false);
  };

  const handleDoctorPress = (doctor: Doctor) => {
    navigation.navigate('DoctorProfile', { doctor });
  };

  const handleBookAppointment = (doctor: Doctor) => {
    navigation.navigate('BookAppointment', { doctor });
  };

  const renderSpecialtyFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        data={specialties}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedSpecialty === item && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedSpecialty(item)}
          >
            <Text
              style={[
                styles.filterText,
                selectedSpecialty === item && styles.activeFilterText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderAvailabilityFilter = () => (
    <View style={styles.availabilityFilterContainer}>
      <TouchableOpacity
        style={[
          styles.availabilityToggle,
          showOnlyAvailable && styles.activeAvailabilityToggle
        ]}
        onPress={() => setShowOnlyAvailable(!showOnlyAvailable)}
      >
        <SimpleIcon 
          name={showOnlyAvailable ? "check-circle" : "circle"} 
          size={16} 
          color={showOnlyAvailable ? "#4CAF50" : "#666"} 
        />
        <Text style={[
          styles.availabilityToggleText,
          showOnlyAvailable && styles.activeAvailabilityToggleText
        ]}>
          Show only available doctors
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDoctorCard = ({ item: doctor }: { item: Doctor }) => (
    <View style={styles.doctorCard}>
      <View style={styles.cardGradient}>
        {/* Header with Doctor Info */}
        <View style={styles.cardHeader}>
          <Image 
            source={{ 
              uri: doctor.profileImageUrl || 'https://via.placeholder.com/150x150/007AFF/FFFFFF?text=DR' 
            }} 
            style={styles.doctorImage} 
          />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName} numberOfLines={1} ellipsizeMode="tail">
              Dr. {doctor.firstName} {doctor.lastName}
            </Text>
            <Text style={styles.doctorSpecialty} numberOfLines={1} ellipsizeMode="tail">{doctor.specialty}</Text>
            {doctor.hospitalAffiliation && (
              <Text style={styles.doctorHospital} numberOfLines={1} ellipsizeMode="tail">
                {doctor.hospitalAffiliation}
              </Text>
            )}
            <View style={styles.ratingContainer}>
              <SimpleIcon name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{doctor.averageRating || 0}</Text>
              <Text style={styles.reviewCount}>({doctor.totalReviews || 0} reviews)</Text>
            </View>
          </View>
        </View>

        {/* Availability Section */}
        <View style={styles.availabilitySection}>
          <View style={[
            styles.availabilityBadge,
            (doctor.isCurrentlyAvailable !== undefined ? doctor.isCurrentlyAvailable : doctor.isAvailable) 
              ? styles.availableBadge : styles.unavailableBadge
          ]}>
            <Text style={[
              styles.availabilityText,
              (doctor.isCurrentlyAvailable !== undefined ? doctor.isCurrentlyAvailable : doctor.isAvailable)
                ? styles.availableText : styles.unavailableText
            ]}>
              {doctor.isCurrentlyAvailable !== undefined 
                ? (doctor.isCurrentlyAvailable ? 'Available Now' : 'Busy Now')
                : (doctor.isAvailable ? 'Available' : 'Busy')
              }
            </Text>
          </View>
          {doctor.workingHours && doctor.workingHours.start && doctor.workingHours.end && (
            <Text style={styles.nextSlotText}>
              {doctor.workingHours.start} - {doctor.workingHours.end}
            </Text>
          )}
          {doctor.city && (
            <Text style={styles.nextSlotText}>
              {doctor.city}
            </Text>
          )}
        </View>

        {/* Body with Doctor Details */}
        <View style={styles.cardBody}>
          <View style={styles.experienceContainer}>
            <SimpleIcon name="work" size={14} color="#666" />
            <Text style={styles.experienceText} numberOfLines={1} ellipsizeMode="tail">{doctor.experienceYears} years experience</Text>
          </View>
          
          <View style={styles.feeContainer}>
            <Text style={styles.feeLabel}>Consultation Fee:</Text>
            <Text style={styles.feeAmount}>₵{doctor.consultationFee}</Text>
          </View>

          {doctor.languages && doctor.languages.length > 0 && (
            <View style={styles.languagesContainer}>
              <SimpleIcon name="language" size={14} color="#666" />
              <Text style={styles.languagesText} numberOfLines={1} ellipsizeMode="tail">
                {doctor.languages.join(', ')}
              </Text>
            </View>
          )}

               <View style={styles.consultationTypes}>
                 <View style={styles.consultationType}>
                   <SimpleIcon name="videocam" size={14} color="#4CAF50" />
                   <Text style={styles.consultationTypeText}>Video Call Only</Text>
                 </View>
               </View>
        </View>

        {/* Footer with Action Buttons */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => handleDoctorPress(doctor)}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.bookButton,
              (!doctor.isAvailable || (doctor.isCurrentlyAvailable !== undefined && !doctor.isCurrentlyAvailable)) && styles.disabledBookButton
            ]}
            onPress={() => handleBookAppointment(doctor)}
            disabled={!doctor.isAvailable || (doctor.isCurrentlyAvailable !== undefined && !doctor.isCurrentlyAvailable)}
          >
            <Text style={[
              styles.bookButtonText,
              (!doctor.isAvailable || (doctor.isCurrentlyAvailable !== undefined && !doctor.isCurrentlyAvailable)) && styles.disabledBookButtonText
            ]}>
               Book Doctor
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading && doctors.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading doctors...</Text>
          <Text style={styles.loadingText}>Debug: {error || 'No error'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SimpleIcon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors by name or specialty..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Specialty Filter */}
      {renderSpecialtyFilter()}

      {/* Availability Filter */}
      {renderAvailabilityFilter()}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDoctors}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Doctors List */}
      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctorCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <SimpleIcon name="person-search" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No doctors found</Text>
              <Text style={styles.emptySubtext}>
                {doctors.length === 0 
                  ? 'No doctors are currently available in the system'
                  : 'Try adjusting your search or filter criteria'
                }
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterChip: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingVertical: 20,
  },
  doctorCard: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  cardGradient: {
    borderRadius: 16,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  doctorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
    paddingRight: 4,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  availabilitySection: {
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingRight: 4,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  availableBadge: {
    backgroundColor: '#E8F5E8',
  },
  unavailableBadge: {
    backgroundColor: '#FFE8E8',
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availableText: {
    color: '#4CAF50',
  },
  unavailableText: {
    color: '#F44336',
  },
  nextSlotText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
  },
  cardBody: {
    marginBottom: 12,
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  experienceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  feeLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  feeAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  languagesText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  consultationTypes: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  consultationType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  consultationTypeText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
  viewProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    flex: 1,
    alignItems: 'center',
    marginRight: 6,
  },
  viewProfileText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  bookButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    flex: 1,
    alignItems: 'center',
  },
  disabledBookButton: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledBookButtonText: {
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
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
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  doctorHospital: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  availabilityFilterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeAvailabilityToggle: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  availabilityToggleText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeAvailabilityToggleText: {
    color: '#4CAF50',
  },
});

export default DoctorListScreen;
