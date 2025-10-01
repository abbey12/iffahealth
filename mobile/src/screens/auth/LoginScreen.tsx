import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../../components/SimpleIcon';

const {width, height} = Dimensions.get('window');

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen = ({navigation}: LoginScreenProps): React.JSX.Element => {
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);

  const handleRoleSelection = (role: 'patient' | 'doctor') => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole === 'patient') {
      navigation.navigate('PatientLogin');
    } else if (selectedRole === 'doctor') {
      navigation.navigate('DoctorLogin');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1976D2', '#42A5F5', '#90CAF9']}
        style={styles.backgroundGradient}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        
        {/* Main Content */}
        <View style={styles.content}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Welcome to</Text>
              <Text style={styles.title}>IFFA HEALTH</Text>
            </View>
            <Text style={styles.subtitle}>Your trusted healthcare companion</Text>
            <Text style={styles.description}>Please select your role to continue</Text>
          </View>

          {/* Role Selection Cards */}
          <View style={styles.roleContainer}>
            {/* Patient Role Card */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'patient' && styles.roleCardSelected,
              ]}
              onPress={() => {
                handleRoleSelection('patient');
                setTimeout(() => {
                  navigation.navigate('PatientLogin');
                }, 100);
              }}>
              <LinearGradient
                colors={selectedRole === 'patient' ? ['#4CAF50', '#45A049'] : ['#FFFFFF', '#F8F9FA']}
                style={styles.roleCardGradient}
              >
                <View style={styles.roleCardContent}>
                  <View style={[
                    styles.roleIconContainer,
                    selectedRole === 'patient' && styles.roleIconContainerSelected
                  ]}>
                    <SimpleIcon 
                      name="person" 
                      size={48} 
                      color={selectedRole === 'patient' ? '#FFFFFF' : '#4CAF50'} 
                    />
                  </View>
                  <Text style={[
                    styles.roleTitle,
                    selectedRole === 'patient' && styles.roleTitleSelected,
                  ]}>
                    Patient
                  </Text>
                  <Text style={[
                    styles.roleDescription,
                    selectedRole === 'patient' && styles.roleDescriptionSelected,
                  ]}>
                    Access your health records, book appointments, and manage your care
                  </Text>
                  {selectedRole === 'patient' && (
                    <View style={styles.selectedIndicator}>
                      <SimpleIcon name="check-circle" size={28} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Doctor Role Card */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'doctor' && styles.roleCardSelected,
              ]}
              onPress={() => {
                handleRoleSelection('doctor');
                setTimeout(() => {
                  navigation.navigate('DoctorLogin');
                }, 100);
              }}>
              <LinearGradient
                colors={selectedRole === 'doctor' ? ['#FF9800', '#F57C00'] : ['#FFFFFF', '#F8F9FA']}
                style={styles.roleCardGradient}
              >
                <View style={styles.roleCardContent}>
                  <View style={[
                    styles.roleIconContainer,
                    selectedRole === 'doctor' && styles.roleIconContainerSelected
                  ]}>
                    <SimpleIcon 
                      name="medical-services" 
                      size={48} 
                      color={selectedRole === 'doctor' ? '#FFFFFF' : '#FF9800'} 
                    />
                  </View>
                  <Text style={[
                    styles.roleTitle,
                    selectedRole === 'doctor' && styles.roleTitleSelected,
                  ]}>
                    Doctor
                  </Text>
                  <Text style={[
                    styles.roleDescription,
                    selectedRole === 'doctor' && styles.roleDescriptionSelected,
                  ]}>
                    Manage patients, schedule appointments, and access medical records
                  </Text>
                  {selectedRole === 'doctor' && (
                    <View style={styles.selectedIndicator}>
                      <SimpleIcon name="check-circle" size={28} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1976D2',
  },
  
  // Background and Decorative Elements
  backgroundGradient: {
    flex: 1,
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 100,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: -100,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Content Layout
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'flex-end',
  },
  
  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  titleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Role Selection
  roleContainer: {
    marginBottom: 0,
  },
  roleCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  roleCardSelected: {
    elevation: 12,
    shadowOpacity: 0.25,
    transform: [{ scale: 1.02 }],
  },
  roleCardGradient: {
    borderRadius: 20,
  },
  roleCardContent: {
    padding: 28,
    alignItems: 'center',
    position: 'relative',
  },
  roleIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleIconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  roleTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  roleTitleSelected: {
    color: '#FFFFFF',
  },
  roleDescription: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  roleDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },

});

export default LoginScreen;
