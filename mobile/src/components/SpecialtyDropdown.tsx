import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import SimpleIcon from './SimpleIcon';

const {width, height} = Dimensions.get('window');

interface SpecialtyDropdownProps {
  selectedSpecialty: string;
  onSpecialtySelect: (specialty: string) => void;
  placeholder?: string;
}

const medicalSpecialties = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Hematology',
  'Infectious Disease',
  'Nephrology',
  'Neurology',
  'Oncology',
  'Pulmonology',
  'Rheumatology',
  'Anesthesiology',
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Obstetrics & Gynecology',
  'Ophthalmology',
  'Orthopedics',
  'Otolaryngology',
  'Pathology',
  'Pediatrics',
  'Physical Medicine & Rehabilitation',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology',
  'Allergy & Immunology',
  'Geriatrics',
  'Sports Medicine',
  'Pain Management',
  'Sleep Medicine',
  'Addiction Medicine',
  'Preventive Medicine',
  'Occupational Medicine',
  'Aerospace Medicine',
  'Forensic Medicine',
  'Nuclear Medicine',
  'Radiation Oncology',
  'Plastic Surgery',
  'Neurosurgery',
  'Cardiothoracic Surgery',
  'Vascular Surgery',
  'Pediatric Surgery',
  'Surgical Oncology',
  'Transplant Surgery',
  'Trauma Surgery',
  'Minimally Invasive Surgery',
  'Robotic Surgery',
  'Other'
];

const SpecialtyDropdown: React.FC<SpecialtyDropdownProps> = ({
  selectedSpecialty,
  onSpecialtySelect,
  placeholder = 'Select your medical specialty',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSpecialtySelect = (specialty: string) => {
    onSpecialtySelect(specialty);
    setIsOpen(false);
  };

  const renderSpecialtyItem = ({item}: {item: string}) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        selectedSpecialty === item && styles.selectedItem,
      ]}
      onPress={() => handleSpecialtySelect(item)}
    >
      <Text
        style={[
          styles.dropdownItemText,
          selectedSpecialty === item && styles.selectedItemText,
        ]}
      >
        {item}
      </Text>
      {selectedSpecialty === item && (
        <SimpleIcon name="check" size={20} color="#1976D2" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(true)}
      >
        <Text
          style={[
            styles.dropdownButtonText,
            !selectedSpecialty && styles.placeholderText,
          ]}
        >
          {selectedSpecialty || placeholder}
        </Text>
        <SimpleIcon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666666"
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Medical Specialty</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <SimpleIcon name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={medicalSpecialties}
              keyExtractor={(item) => item}
              renderItem={renderSpecialtyItem}
              style={styles.dropdownList}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  placeholderText: {
    color: '#999999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: height * 0.7,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  closeButton: {
    padding: 4,
  },
  dropdownList: {
    maxHeight: height * 0.5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  selectedItem: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  selectedItemText: {
    color: '#1976D2',
    fontWeight: '600',
  },
});

export default SpecialtyDropdown;
