import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import {useNavigation} from '@react-navigation/native';
import type {NavigationProp} from '@react-navigation/native';
import {useData} from '../context/DataContext';

interface ProfileScreenProps {
  onLogout?: () => void;
  navigation?: any;
  userType?: 'patient' | 'doctor';
}

const ProfileScreen = ({onLogout, navigation: propNavigation, userType = 'patient'}: ProfileScreenProps): React.JSX.Element => {
  const navigation = useNavigation();
  const {patient, doctor, isLoading} = useData();
  const [isProfileComplete, setIsProfileComplete] = useState(true); // Profile completion is now handled at dashboard level
  
  // Get the current user data based on userType
  const currentUser = userType === 'patient' ? patient : doctor;
  
  // Show loading state if data is not available
  if (isLoading || !currentUser) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <SimpleIcon name="person" size={60} color="#1976D2" />
            </View>
            {(currentUser as any)?.isVerified && (
              <View style={styles.verifiedBadge}>
                <SimpleIcon name="check" size={16} color="#ffffff" />
              </View>
            )}
          </View>
          <Text style={styles.name}>
            {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Loading...'}
          </Text>
          <Text style={styles.email}>
            {currentUser?.email || 'Loading...'}
          </Text>
          <Text style={styles.phone}>
            {currentUser?.phone || 'No phone number'}
          </Text>
          
          {/* Patient-specific information */}
          {userType === 'patient' && currentUser && (
            <>
              <Text style={styles.detailText}>
                Date of Birth: {(currentUser as any).dateOfBirth ? new Date((currentUser as any).dateOfBirth).toLocaleDateString() : 'Not specified'}
              </Text>
              <Text style={styles.detailText}>
                Gender: {(currentUser as any).gender ? (currentUser as any).gender.charAt(0).toUpperCase() + (currentUser as any).gender.slice(1) : 'Not specified'}
              </Text>
            </>
          )}
          
          {/* Doctor-specific information */}
          {userType === 'doctor' && currentUser && (
            <>
              <Text style={styles.specialty}>
                {(currentUser as any).specialty || 'General Medicine'}
              </Text>
              <Text style={styles.experience}>
                {(currentUser as any).experienceYears ? `${(currentUser as any).experienceYears} years experience` : 'Experience not specified'}
              </Text>
              <Text style={styles.license}>
                License: {(currentUser as any).licenseNumber || 'Not specified'}
              </Text>
              {(currentUser as any).consultationFee && (
                <Text style={styles.consultationFee}>
                  Consultation Fee: GHS {(currentUser as any).consultationFee}
                </Text>
              )}
            </>
          )}
          
          <View style={styles.profileStatus}>
            <SimpleIcon 
              name={currentUser?.isProfileComplete ? "verified" : "warning"} 
              size={16} 
              color={currentUser?.isProfileComplete ? "#4CAF50" : "#FF9800"} 
            />
            <Text style={styles.profileStatusText}>
              {currentUser?.isProfileComplete ? 'Profile Complete' : 'Profile Incomplete'}
            </Text>
          </View>
        </View>

        {/* Patient-specific detailed information */}
        {userType === 'patient' && currentUser && (
          <>
            {/* Address Information */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Address Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <SimpleIcon name="home" size={20} color="#1976D2" />
                  <Text style={styles.infoLabel}>Street Address:</Text>
                  <Text style={styles.infoValue}>
                    {(currentUser as any).address?.street || 'Not provided'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <SimpleIcon name="location-city" size={20} color="#1976D2" />
                  <Text style={styles.infoLabel}>City:</Text>
                  <Text style={styles.infoValue}>
                    {(currentUser as any).address?.city || 'Not provided'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <SimpleIcon name="public" size={20} color="#1976D2" />
                  <Text style={styles.infoLabel}>Country:</Text>
                  <Text style={styles.infoValue}>
                    {(currentUser as any).address?.country || 'Ghana'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Insurance Information */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Insurance Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <SimpleIcon name="verified" size={20} color="#1976D2" />
                  <Text style={styles.infoLabel}>Provider:</Text>
                  <Text style={styles.infoValue}>
                    {(currentUser as any).insurance?.provider || 'Not provided'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <SimpleIcon name="credit-card" size={20} color="#1976D2" />
                  <Text style={styles.infoLabel}>Policy Number:</Text>
                  <Text style={styles.infoValue}>
                    {(currentUser as any).insurance?.number || 'Not provided'}
                  </Text>
                </View>
                {(currentUser as any).insurance?.startDate && (
                  <View style={styles.infoRow}>
                    <SimpleIcon name="calendar-today" size={20} color="#1976D2" />
                    <Text style={styles.infoLabel}>Start Date:</Text>
                    <Text style={styles.infoValue}>
                      {new Date((currentUser as any).insurance.startDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {(currentUser as any).insurance?.expiryDate && (
                  <View style={styles.infoRow}>
                    <SimpleIcon name="event" size={20} color="#1976D2" />
                    <Text style={styles.infoLabel}>Expiry Date:</Text>
                    <Text style={styles.infoValue}>
                      {new Date((currentUser as any).insurance.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Medical Information */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Medical Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <SimpleIcon name="medical-services" size={20} color="#1976D2" />
                  <Text style={styles.infoLabel}>Medical History:</Text>
                  <Text style={styles.infoValue}>
                    {(currentUser as any).medicalHistory?.length > 0 ? (currentUser as any).medicalHistory.join(', ') : 'None recorded'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <SimpleIcon name="warning" size={20} color="#FF9800" />
                  <Text style={styles.infoLabel}>Allergies:</Text>
                  <Text style={styles.infoValue}>
                    {(currentUser as any).allergies?.length > 0 ? (currentUser as any).allergies.join(', ') : 'None recorded'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <SimpleIcon name="medication" size={20} color="#1976D2" />
                  <Text style={styles.infoLabel}>Current Medications:</Text>
                  <Text style={styles.infoValue}>
                    {(currentUser as any).currentMedications?.length > 0 ? (currentUser as any).currentMedications.join(', ') : 'None recorded'}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => (navigation as any).navigate('EditProfile', {userType})}
          >
            <SimpleIcon name="edit" size={24} color="#1976D2" />
            <Text style={styles.optionText}>Edit Profile</Text>
            <SimpleIcon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          {/* Doctor-specific options */}
          {userType === 'doctor' && (
            <>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => (navigation as any).navigate('DoctorAvailabilitySettings', { doctorId: currentUser.id })}
              >
                <SimpleIcon name="schedule" size={24} color="#1976D2" />
                <Text style={styles.optionText}>Availability Settings</Text>
                <SimpleIcon name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem}>
                <SimpleIcon name="payment" size={24} color="#1976D2" />
                <Text style={styles.optionText}>Payment Settings</Text>
                <SimpleIcon name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem}>
                <SimpleIcon name="verified" size={24} color="#1976D2" />
                <Text style={styles.optionText}>Verification Status</Text>
                <SimpleIcon name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.optionItem}>
            <SimpleIcon name="security" size={24} color="#1976D2" />
            <Text style={styles.optionText}>Security & Privacy</Text>
            <SimpleIcon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <SimpleIcon name="notifications" size={24} color="#1976D2" />
            <Text style={styles.optionText}>Notifications</Text>
            <SimpleIcon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <SimpleIcon name="help" size={24} color="#1976D2" />
            <Text style={styles.optionText}>Help & Support</Text>
            <SimpleIcon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <SimpleIcon name="info" size={24} color="#1976D2" />
            <Text style={styles.optionText}>About</Text>
            <SimpleIcon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionItem, styles.logoutItem]}
            onPress={handleLogout}>
            <SimpleIcon name="logout" size={24} color="#D32F2F" />
            <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
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
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#1976D2',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#666666',
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 16,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#D32F2F',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
  },
  profileStatusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  specialty: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    marginTop: 8,
    textAlign: 'center',
  },
  experience: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  license: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
    textAlign: 'center',
  },
  consultationFee: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginTop: 4,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  infoSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
    minWidth: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
});

export default ProfileScreen;
