import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../../components/SimpleIcon';

const {width} = Dimensions.get('window');

interface DoctorDashboardScreenProps {
  navigation: any;
}

const DoctorDashboardScreen = ({navigation}: DoctorDashboardScreenProps): React.JSX.Element => {
  const [selectedFilter, setSelectedFilter] = useState('today');

  // Sample data for doctor dashboard
  const todayAppointments = [
    {
      id: '1',
      patientName: 'Kwame Asante',
      time: '9:00 AM',
      type: 'Follow-up',
      status: 'confirmed',
      color: '#4CAF50',
    },
    {
      id: '2',
      patientName: 'Ama Osei',
      time: '10:30 AM',
      type: 'Consultation',
      status: 'confirmed',
      color: '#2196F3',
    },
    {
      id: '3',
      patientName: 'Kofi Mensah',
      time: '2:00 PM',
      type: 'New Patient',
      status: 'pending',
      color: '#FF9800',
    },
  ];

  const quickStats = [
    {
      title: 'Today\'s Appointments',
      value: '8',
      icon: 'event',
      color: '#1976D2',
      gradient: ['#1976D2', '#42A5F5'],
    },
    {
      title: 'Active Patients',
      value: '156',
      icon: 'people',
      color: '#4CAF50',
      gradient: ['#4CAF50', '#66BB6A'],
    },
    {
      title: 'Pending Reviews',
      value: '12',
      icon: 'assignment',
      color: '#FF9800',
      gradient: ['#FF9800', '#FFB74D'],
    },
    {
      title: 'Messages',
      value: '5',
      icon: 'message',
      color: '#9C27B0',
      gradient: ['#9C27B0', '#BA68C8'],
    },
  ];

  const quickActions = [
    {
      title: 'View Patients',
      icon: 'people',
      color: '#1976D2',
      gradient: ['#1976D2', '#42A5F5'],
    },
    {
      title: 'Schedule Appointment',
      icon: 'event',
      color: '#4CAF50',
      gradient: ['#4CAF50', '#66BB6A'],
    },
    {
      title: 'Medical Records',
      icon: 'folder',
      color: '#FF9800',
      gradient: ['#FF9800', '#FFB74D'],
    },
    {
      title: 'Prescriptions',
      icon: 'medication',
      color: '#9C27B0',
      gradient: ['#9C27B0', '#BA68C8'],
    },
  ];

  const renderAppointment = (appointment: any) => (
    <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentTime}>
          <Text style={styles.timeText}>{appointment.time}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: appointment.color + '20'}]}>
          <Text style={[styles.statusText, {color: appointment.color}]}>
            {appointment.status}
          </Text>
        </View>
      </View>
      <Text style={styles.patientName}>{appointment.patientName}</Text>
      <Text style={styles.appointmentType}>{appointment.type}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1976D2', '#42A5F5']}
        style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.doctorInfo}>
            <Text style={styles.greetingText}>Good Morning, Dr. Sarah</Text>
            <Text style={styles.dateText}>Monday, January 15, 2024</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <SimpleIcon name="account-circle" size={40} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <TouchableOpacity key={index} style={styles.statCard}>
                <LinearGradient
                  colors={stat.gradient}
                  style={styles.statGradient}>
                  <SimpleIcon name={stat.icon} size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.appointmentsList}>
            {todayAppointments.map(renderAppointment)}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionCard}>
                <LinearGradient
                  colors={action.gradient}
                  style={styles.actionGradient}>
                  <SimpleIcon name={action.icon} size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
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
    color: '#333',
    marginBottom: 15,
    marginTop: 25,
    paddingHorizontal: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  appointmentsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  appointmentCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTime: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 14,
    color: '#666666',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionGradient: {
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
  actionText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default DoctorDashboardScreen;
