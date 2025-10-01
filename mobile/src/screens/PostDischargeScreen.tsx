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
import LinearGradient from 'react-native-linear-gradient';

interface CarePlan {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
}

interface Nurse {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  nextVisit: string;
  status: 'assigned' | 'available';
}

const PostDischargeScreen = (): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<'care' | 'nurse' | 'recovery'>('care');

  const carePlans: CarePlan[] = [
    {
      id: '1',
      title: 'Take Medication',
      description: 'Take prescribed antibiotics twice daily',
      dueDate: '2024-09-25',
      status: 'pending',
      priority: 'high',
    },
    {
      id: '2',
      title: 'Wound Care',
      description: 'Clean and dress surgical wound daily',
      dueDate: '2024-09-24',
      status: 'completed',
      priority: 'high',
    },
    {
      id: '3',
      title: 'Follow-up Appointment',
      description: 'Schedule follow-up with Dr. Mensah',
      dueDate: '2024-09-30',
      status: 'pending',
      priority: 'medium',
    },
    {
      id: '4',
      title: 'Physical Therapy',
      description: 'Complete daily exercises as prescribed',
      dueDate: '2024-09-26',
      status: 'pending',
      priority: 'medium',
    },
  ];

  const assignedNurse: Nurse = {
    id: '1',
    name: 'Nurse Grace Asante',
    specialty: 'Post-Surgical Care',
    phone: '+233 24 123 4567',
    nextVisit: '2024-09-25',
    status: 'assigned',
  };

  const recoveryMetrics = [
    {label: 'Pain Level', value: '3/10', trend: 'improving'},
    {label: 'Mobility', value: '75%', trend: 'improving'},
    {label: 'Sleep Quality', value: 'Good', trend: 'stable'},
    {label: 'Appetite', value: 'Normal', trend: 'improving'},
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#2196F3';
      case 'overdue':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'schedule';
      case 'overdue':
        return 'warning';
      default:
        return 'help';
    }
  };

  const renderCarePlan = (plan: CarePlan) => (
    <View key={plan.id} style={styles.carePlanCard}>
      <View style={styles.carePlanHeader}>
        <View style={styles.carePlanInfo}>
          <Text style={styles.carePlanTitle}>{plan.title}</Text>
          <Text style={styles.carePlanDescription}>{plan.description}</Text>
        </View>
        <View style={styles.priorityBadge}>
          <View
            style={[
              styles.priorityDot,
              {backgroundColor: getPriorityColor(plan.priority)},
            ]}
          />
          <Text
            style={[
              styles.priorityText,
              {color: getPriorityColor(plan.priority)},
            ]}>
            {plan.priority.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.carePlanFooter}>
        <View style={styles.dueDateContainer}>
          <SimpleIcon name="calendar-today" size={16} color="#666666" />
          <Text style={styles.dueDateText}>Due: {plan.dueDate}</Text>
        </View>
        <View style={styles.statusContainer}>
          <SimpleIcon
            name={getStatusIcon(plan.status)}
            size={16}
            color={getStatusColor(plan.status)}
          />
          <Text
            style={[
              styles.statusText,
              {color: getStatusColor(plan.status)},
            ]}>
            {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
          </Text>
        </View>
      </View>
      {plan.status === 'pending' && (
        <TouchableOpacity
          style={styles.markCompleteButton}
          onPress={() => Alert.alert('Success', 'Task marked as complete!')}>
          <Text style={styles.markCompleteText}>Mark Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderNurseInfo = () => (
    <View style={styles.nurseCard}>
      <LinearGradient
        colors={['#2E7D32', '#4CAF50']}
        style={styles.nurseHeader}>
        <View style={styles.nurseInfo}>
          <SimpleIcon name="person" size={32} color="#FFFFFF" />
          <View style={styles.nurseDetails}>
            <Text style={styles.nurseName}>{assignedNurse.name}</Text>
            <Text style={styles.nurseSpecialty}>{assignedNurse.specialty}</Text>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.nurseBody}>
        <View style={styles.nurseContact}>
          <SimpleIcon name="phone" size={20} color="#2E7D32" />
          <Text style={styles.contactText}>{assignedNurse.phone}</Text>
        </View>
        <View style={styles.nurseContact}>
          <SimpleIcon name="schedule" size={20} color="#2E7D32" />
          <Text style={styles.contactText}>
            Next Visit: {assignedNurse.nextVisit}
          </Text>
        </View>
        <View style={styles.nurseActions}>
          <TouchableOpacity style={styles.callButton}>
            <SimpleIcon name="call" size={20} color="#FFFFFF" />
            <Text style={styles.callButtonText}>Call Nurse</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButton}>
            <SimpleIcon name="message" size={20} color="#2E7D32" />
            <Text style={styles.messageButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderRecoveryMetrics = () => (
    <View style={styles.metricsContainer}>
      <Text style={styles.metricsTitle}>Recovery Progress</Text>
      <View style={styles.metricsGrid}>
        {recoveryMetrics.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <View style={styles.trendContainer}>
              <SimpleIcon
                name={
                  metric.trend === 'improving'
                    ? 'trending-up'
                    : metric.trend === 'declining'
                    ? 'trending-down'
                    : 'trending-flat'
                }
                size={16}
                color={
                  metric.trend === 'improving'
                    ? '#4CAF50'
                    : metric.trend === 'declining'
                    ? '#F44336'
                    : '#FF9800'
                }
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      metric.trend === 'improving'
                        ? '#4CAF50'
                        : metric.trend === 'declining'
                        ? '#F44336'
                        : '#FF9800',
                  },
                ]}>
                {metric.trend}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1976D2', '#42A5F5']}
        style={styles.header}>
        <Text style={styles.headerTitle}>Post-Discharge Care</Text>
        <Text style={styles.headerSubtitle}>
          Your recovery journey continues
        </Text>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'care' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('care')}>
          <SimpleIcon
            name="assignment"
            size={20}
            color={activeTab === 'care' ? '#1976D2' : '#666666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'care' && styles.activeTabText,
            ]}>
            Care Plan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'nurse' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('nurse')}>
          <SimpleIcon
            name="person"
            size={20}
            color={activeTab === 'nurse' ? '#1976D2' : '#666666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'nurse' && styles.activeTabText,
            ]}>
            Nurse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'recovery' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('recovery')}>
          <SimpleIcon
            name="trending-up"
            size={20}
            color={activeTab === 'recovery' ? '#1976D2' : '#666666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'recovery' && styles.activeTabText,
            ]}>
            Recovery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'care' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Your Care Plan</Text>
            {carePlans.map(renderCarePlan)}
          </View>
        )}

        {activeTab === 'nurse' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Assigned Nurse</Text>
            {renderNurseInfo()}
          </View>
        )}

        {activeTab === 'recovery' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Recovery Progress</Text>
            {renderRecoveryMetrics()}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976D2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 5,
  },
  activeTabText: {
    color: '#1976D2',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  carePlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  carePlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  carePlanInfo: {
    flex: 1,
  },
  carePlanTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  carePlanDescription: {
    fontSize: 14,
    color: '#666666',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  carePlanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  markCompleteButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  markCompleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nurseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  nurseHeader: {
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  nurseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nurseDetails: {
    marginLeft: 15,
  },
  nurseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nurseSpecialty: {
    fontSize: 14,
    color: '#E8F5E8',
    marginTop: 2,
  },
  nurseBody: {
    padding: 20,
  },
  nurseContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 10,
  },
  nurseActions: {
    flexDirection: 'row',
    marginTop: 15,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#E8F5E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  messageButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  metricsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default PostDischargeScreen;
