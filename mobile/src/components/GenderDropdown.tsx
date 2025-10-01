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

interface GenderDropdownProps {
  selectedGender: string;
  onGenderSelect: (gender: string) => void;
  placeholder?: string;
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const GenderDropdown: React.FC<GenderDropdownProps> = ({
  selectedGender,
  onGenderSelect,
  placeholder = 'Select your gender',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleGenderSelect = (gender: string) => {
    onGenderSelect(gender);
    setIsOpen(false);
  };

  const renderGenderItem = ({item}: {item: {value: string, label: string}}) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        selectedGender === item.value && styles.selectedItem,
      ]}
      onPress={() => handleGenderSelect(item.value)}
    >
      <Text
        style={[
          styles.dropdownItemText,
          selectedGender === item.value && styles.selectedItemText,
        ]}
      >
        {item.label}
      </Text>
      {selectedGender === item.value && (
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
            !selectedGender && styles.placeholderText,
          ]}
        >
          {selectedGender ? genderOptions.find(option => option.value === selectedGender)?.label || selectedGender : placeholder}
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
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <SimpleIcon name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={genderOptions}
              keyExtractor={(item) => item.value}
              renderItem={renderGenderItem}
              style={styles.dropdownList}
              showsVerticalScrollIndicator={false}
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
    width: width * 0.8,
    maxHeight: height * 0.4,
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
    maxHeight: height * 0.2,
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

export default GenderDropdown;
