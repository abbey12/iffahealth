import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import { apiService } from '../services/apiService';
import LinearGradient from 'react-native-linear-gradient';
import {useData} from '../context/DataContext';

const {width} = Dimensions.get('window');

interface HealthRecord {
  id: string;
  title: string;
  date: string;
  dateISO?: string;
  type: 'lab' | 'imaging' | 'prescription' | 'visit' | 'vaccination';
  status: 'completed' | 'pending' | 'available';
  description: string;
  doctor?: string;
  color: string;
  icon: string;
}

interface MedicalHistory {
  id: string;
  condition: string;
  diagnosisDate: string;
  status: 'active' | 'resolved' | 'chronic';
  doctor: string;
  notes: string;
  color: string;
}

const HealthRecordsScreen = (): React.JSX.Element => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [rxItemsForRecord, setRxItemsForRecord] = useState<any[]>([]);
  const [rxLoading, setRxLoading] = useState(false);
  
  // Get data from context
  const { 
    patient, 
    healthRecords, 
    recentHealthRecords, 
    patientPrescriptions,
    isLoading, 
    error, 
    loadHealthRecords, 
    loadRecentHealthRecords 
  } = useData();

  // Load data when component mounts
  useEffect(() => {
    if (patient?.id) {
      loadHealthRecords(patient.id);
      loadRecentHealthRecords(patient.id);
    }
  }, [patient?.id]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    if (patient?.id) {
      await Promise.all([
        loadHealthRecords(patient.id),
        loadRecentHealthRecords(patient.id)
      ]);
    }
    setRefreshing(false);
  };

  // Transform API data to match the UI interface
  const toISODate = (input: any): string => {
    if (!input) return '';
    try {
      if (input instanceof Date) {
        if (!isNaN(input.getTime())) return input.toISOString().slice(0,10);
      }
      const raw = String(input).trim();
      if (!raw) return '';
      if (raw.includes('T')) {
        const dp = raw.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dp)) return dp;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return raw;
      }
      const monthMap: Record<string, number> = {
        Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
        Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
      };
      // e.g., "Mon, Sep 29, 2025" or "Mon Sep 29 2025" or "Sep 29, 2025"
      const re = /^(?:[A-Za-z]{3},?\s+)?([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/;
      const m = re.exec(raw);
      if (m) {
        const mon = monthMap[m[1] as keyof typeof monthMap];
        const day = parseInt(m[2], 10);
        const year = parseInt(m[3], 10);
        if (mon && day && year) {
          const mm = String(mon).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          return `${year}-${mm}-${dd}`;
        }
      }
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0,10);
    } catch {}
    return '';
  };

  const formatRecordDate = (input: any): string => {
    if (!input) return '';
    try {
      const iso = toISODate(input);
      if (iso) {
        const [y, mo, d] = iso.split('-').map(n => parseInt(n, 10));
        const dt = new Date(y, mo - 1, d);
        if (!isNaN(dt.getTime())) return dt.toDateString();
      }
    } catch {}
    // Fallback to string
    return String(input);
  };

  const transformHealthRecord = (record: any): HealthRecord => {
    const getTypeInfo = (type: string) => {
      switch (type) {
        case 'lab':
          return { color: '#2196F3', icon: 'science' };
        case 'imaging':
          return { color: '#4CAF50', icon: 'visibility' };
        case 'prescription':
          return { color: '#FF9800', icon: 'medication' };
        case 'consultation':
          return { color: '#1976D2', icon: 'description' };
        case 'visit':
          return { color: '#9C27B0', icon: 'person' };
        case 'vaccination':
          return { color: '#E91E63', icon: 'vaccines' };
        default:
          return { color: '#666', icon: 'description' };
      }
    };

    const typeInfo = getTypeInfo(record.type);
    // Prefer backend-provided "doctor" field; fall back to first/last name
    const rawDoctor = record.doctor 
      || (record.doctor_first_name && record.doctor_last_name 
        ? `${record.doctor_first_name} ${record.doctor_last_name}`
        : null);
    const doctorName = rawDoctor || 'Unknown Doctor';

    const iso = toISODate(record.record_date || record.created_at);
    return {
      id: record.id,
      title: record.title || 'Health Record',
      date: formatRecordDate(record.record_date || record.created_at),
      dateISO: iso,
      type: record.type || 'visit',
      status: 'available', // Default status
      description: record.description || record.notes || 'No description available',
      doctor: doctorName,
      color: typeInfo.color,
      icon: typeInfo.icon,
    };
  };

  // Map prescriptions into health-record-like items so they show under Prescriptions
  const mapPrescriptionToRecord = (p: any): HealthRecord => {
    const title = p.title || `Prescription`;
    const descParts: string[] = [];
    if (p.notes) descParts.push(p.notes);
    if (Array.isArray(p.medications) && p.medications.length > 0) {
      descParts.push(`Medications: ${p.medications.length}`);
    }
    return {
      id: p.id,
      title: title,
      date: p.prescriptionDate || p.createdAt || new Date().toISOString().slice(0,10),
      type: 'prescription',
      status: 'available',
      description: descParts.join(' • ') || 'Prescription record',
      doctor: p.prescribedBy || p.doctorName || 'Unknown Doctor',
      color: '#FF9800',
      icon: 'medication',
    } as HealthRecord;
  };

  // Use real data from context, plus mapped prescriptions
  const displayRecords = useMemo(() => {
    const base = healthRecords.map(transformHealthRecord);
    const rx = (patientPrescriptions || []).map(mapPrescriptionToRecord);
    // de-duplicate by id (prescription id may collide with record id but unlikely)
    const seen = new Set<string>();
    const combined: HealthRecord[] = [];
    [...base, ...rx].forEach(r => {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        combined.push(r);
      }
    });
    return combined;
  }, [healthRecords, patientPrescriptions]);

  // Transform medical history from patient data
  const transformMedicalHistory = (historyItem: string, index: number): MedicalHistory => {
    // Parse the medical history item - it might be a simple string or contain structured data
    // For now, we'll treat each item as a condition name
    const getStatusColor = (condition: string) => {
      const lowerCondition = condition.toLowerCase();
      if (lowerCondition.includes('diabetes') || lowerCondition.includes('hypertension') || lowerCondition.includes('chronic')) {
        return '#F44336'; // Red for chronic conditions
      } else if (lowerCondition.includes('cold') || lowerCondition.includes('flu') || lowerCondition.includes('resolved')) {
        return '#4CAF50'; // Green for resolved conditions
      } else if (lowerCondition.includes('allergy') || lowerCondition.includes('sensitive')) {
        return '#FF9800'; // Orange for allergies
      } else {
        return '#9C27B0'; // Purple for other conditions
      }
    };

    const getStatus = (condition: string) => {
      const lowerCondition = condition.toLowerCase();
      if (lowerCondition.includes('chronic') || lowerCondition.includes('diabetes') || lowerCondition.includes('hypertension')) {
        return 'chronic';
      } else if (lowerCondition.includes('resolved') || lowerCondition.includes('cured')) {
        return 'resolved';
      } else {
        return 'active';
      }
    };

    const color = getStatusColor(historyItem);
    const status = getStatus(historyItem);

    return {
      id: `history_${index}`,
      condition: historyItem,
      diagnosisDate: 'Unknown', // We don't have diagnosis dates in the current schema
      status: status as 'active' | 'resolved' | 'chronic',
      doctor: 'Unknown Doctor', // We don't have doctor info in medical history
      notes: 'No additional notes available',
      color: color,
    };
  };

  // Transform medical history from patient data
  const displayMedicalHistory = (patient?.medicalHistory || []).map(transformMedicalHistory);

  const filterOptions = [
    {key: 'all', label: 'All Records', icon: 'list'},
    {key: 'lab', label: 'Lab Results', icon: 'science'},
    {key: 'imaging', label: 'Imaging', icon: 'visibility'},
    {key: 'prescription', label: 'Prescriptions', icon: 'medication'},
    {key: 'visit', label: 'Visits', icon: 'person'},
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'available':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'available':
        return 'Available';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const filteredRecords = useMemo(() => {
    const base = selectedFilter === 'all' 
      ? displayRecords 
      : displayRecords.filter(record => record.type === selectedFilter);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(r => (
      (r.title || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.doctor || '').toLowerCase().includes(q)
    ));
  }, [displayRecords, selectedFilter, searchQuery]);

  const groupedRecords = useMemo(() => {
    const groups: { key: string; label: string; items: HealthRecord[] }[] = [];
    const map: Record<string, HealthRecord[]> = {};
    const toKey = (rec: HealthRecord) => rec.dateISO || (rec.date?.includes('T') ? rec.date.slice(0, 10) : rec.date);
    filteredRecords
      .slice()
      .sort((a, b) => {
        const da = a.dateISO ? new Date(a.dateISO) : new Date(a.date);
        const db = b.dateISO ? new Date(b.dateISO) : new Date(b.date);
        return db.getTime() - da.getTime();
      })
      .forEach(rec => {
        const key = toKey(rec) || '';
        if (!map[key]) map[key] = [];
        map[key].push(rec);
      });
    Object.keys(map)
      .sort((a, b) => (new Date(b).getTime() - new Date(a).getTime()))
      .forEach(k => {
        const label = new Date(k).toDateString();
        groups.push({ key: k, label, items: map[k] });
      });
    return groups;
  }, [filteredRecords]);

  // Load medications when opening a prescription record
  useEffect(() => {
    const loadRxItems = async () => {
      if (!showDetailModal || !selectedRecord || selectedRecord.type !== 'prescription') return;
      try {
        setRxLoading(true);
        setRxItemsForRecord([]);
        const resp = await apiService.getPrescriptionItems(String(selectedRecord.id));
        if (resp?.success && Array.isArray(resp.data)) {
          setRxItemsForRecord(resp.data);
        }
      } catch (e) {
        setRxItemsForRecord([]);
      } finally {
        setRxLoading(false);
      }
    };
    loadRxItems();
  }, [showDetailModal, selectedRecord?.id, selectedRecord?.type]);

  const renderHealthRecord = (record: HealthRecord) => (
    <TouchableOpacity key={record.id} style={styles.recordCard} onPress={() => { setSelectedRecord(record); setShowDetailModal(true); }}>
      <View style={styles.recordHeader}>
        <View style={[styles.recordIcon, {backgroundColor: record.color + '20'}]}>
          <SimpleIcon name={record.icon} size={24} color={record.color} />
        </View>
        <View style={styles.recordInfo}>
          <View style={styles.rowBetween}>
            <Text style={styles.recordTitle} numberOfLines={1}>{record.title}</Text>
            <View style={[styles.typeChip, {borderColor: record.color}]}> 
              <Text style={[styles.typeChipText, {color: record.color}]}>{record.type}</Text>
            </View>
          </View>
          <Text style={styles.recordDate}>{record.date}</Text>
          <Text style={styles.recordDescription} numberOfLines={2}>{record.description}</Text>
          {record.doctor && (
            <Text style={styles.recordDoctor}>Dr. {record.doctor}</Text>
          )}
        </View>
        <View style={styles.recordStatus}>
          <View style={[styles.statusDot, {backgroundColor: getStatusColor(record.status)}]} />
          <Text style={[styles.statusText, {color: getStatusColor(record.status)}]}>
            {getStatusText(record.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMedicalHistory = (history: MedicalHistory) => (
    <View key={history.id} style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyCondition}>{history.condition}</Text>
        <View style={[styles.historyStatus, {backgroundColor: history.color + '20'}]}>
          <Text style={[styles.historyStatusText, {color: history.color}]}>
            {history.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.historyDate}>Diagnosed: {history.diagnosisDate}</Text>
      <Text style={styles.historyDoctor}>Doctor: {history.doctor}</Text>
      <Text style={styles.historyNotes}>{history.notes}</Text>
    </View>
  );

  // Loading state
  if (isLoading && displayRecords.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading health records...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <SimpleIcon name="error" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Error Loading Records</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
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

        {/* Health Records */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Records</Text>
          </View>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <SimpleIcon name="search" size={18} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search records (title, doctor, notes)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>
          </View>
          <View style={styles.recordsList}>
            {groupedRecords.length === 0 ? (
              <View style={styles.emptyContainer}>
                <SimpleIcon name="folder-open" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No Health Records Found</Text>
                <Text style={styles.emptyMessage}>
                  {displayRecords.length === 0 
                    ? 'You don\'t have any health records yet.'
                    : 'No records match your current filter.'
                  }
                </Text>
              </View>
            ) : (
              groupedRecords.map(group => (
                <View key={group.key}>
                  <Text style={styles.groupHeader}>{group.label}</Text>
                  {group.items.map(renderHealthRecord)}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Medical History removed per request */}

        {/* Quick Actions removed per request */}
      </ScrollView>
      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailModalCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedRecord?.title}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <SimpleIcon name="close" size={22} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.detailMeta}>{selectedRecord?.date} • {selectedRecord?.type}</Text>
            {selectedRecord?.doctor ? (
              <Text style={styles.detailDoctor}>Doctor: Dr. {selectedRecord?.doctor}</Text>
            ) : null}
            <ScrollView style={styles.detailBody} contentContainerStyle={styles.detailBodyContent} showsVerticalScrollIndicator={false}>
              {selectedRecord?.type === 'prescription' ? (
                <View>
                  {rxLoading ? (
                    <Text style={styles.detailDescription}>Loading medications...</Text>
                  ) : rxItemsForRecord.length === 0 ? (
                    <Text style={styles.detailDescription}>No medications found for this prescription.</Text>
                  ) : (
                    <View style={styles.rxList}>
                      {rxItemsForRecord.map((it, idx) => (
                        <View key={it.id || idx} style={styles.rxItem}>
                          <View style={styles.rxItemHeader}>
                            <SimpleIcon name="medication" size={18} color="#FF9800" />
                            <Text style={styles.rxItemTitle}>{it.medicationName || it.name || 'Medication'}</Text>
                          </View>
                          <Text style={styles.rxItemLine}>
                            {(it.dosage || '') + (it.frequency ? ` • ${it.frequency}` : '') + (it.quantity ? ` • Qty: ${it.quantity}` : '')}
                          </Text>
                          {!!it.instructions && (
                            <Text style={styles.rxItemInstructions}>Instructions: {it.instructions}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.detailDescription}>{selectedRecord?.description}</Text>
              )}
            </ScrollView>
            <View style={styles.detailActions}>
              <TouchableOpacity style={styles.detailPrimaryBtn} onPress={() => setShowDetailModal(false)}>
                <Text style={styles.detailPrimaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchRow: {
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    paddingVertical: 0,
    color: '#1A1A1A',
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
  recordsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  groupHeader: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  recordCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recordInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  typeChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  recordDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  recordDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 20,
  },
  recordDoctor: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  recordStatus: {
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
  historyList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  historyCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCondition: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  historyDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  historyDoctor: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  historyNotes: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    maxHeight: '70%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  detailMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  detailDoctor: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 10,
  },
  detailBody: {
    maxHeight: '60%',
  },
  detailBodyContent: {
    paddingBottom: 8,
  },
  detailDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
  },
  rxList: {
    marginTop: 6,
    marginBottom: 12,
  },
  rxItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rxItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rxItemTitle: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  rxItemLine: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  rxItemInstructions: {
    fontSize: 12,
    color: '#666',
  },
  // Loading, Error, and Empty States
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HealthRecordsScreen;
