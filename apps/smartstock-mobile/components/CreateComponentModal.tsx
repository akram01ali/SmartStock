import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { showImagePickerAlert, openCamera, openImagePicker } from '../utils/imageUtils';

interface NewComponent {
  componentName: string;
  amount: number;
  measure: string;
  supplier: string;
  cost: number;
  type: string;
  description?: string;
  scannedBy: string;
  durationOfDevelopment: number;
  triggerMinAmount: number;
}

interface CreateComponentModalProps {
  visible: boolean;
  component: NewComponent;
  selectedImage: ImagePicker.ImageInfo | null;
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
  onComponentChange: (component: NewComponent) => void;
  onImageChange: (image: ImagePicker.ImageInfo | null) => void;
  styles: any;
}

export const CreateComponentModal: React.FC<CreateComponentModalProps> = ({
  visible,
  component,
  selectedImage,
  loading,
  onClose,
  onSave,
  onComponentChange,
  onImageChange,
  styles,
}) => {
  const handleImagePicker = () => {
    showImagePickerAlert(
      async () => {
        const image = await openCamera();
        if (image) onImageChange(image);
      },
      async () => {
        const image = await openImagePicker();
        if (image) onImageChange(image);
      }
    );
  };

  const updateField = (field: keyof NewComponent, value: any) => {
    onComponentChange({ ...component, [field]: value });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Component</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <FormField
              label="Component Name *"
              value={component.componentName}
              onChangeText={(text) => updateField('componentName', text)}
              placeholder="Enter component name"
              styles={styles}
            />

            <FormField
              label="Amount"
              value={String(component.amount)}
              onChangeText={(text) => updateField('amount', parseFloat(text) || 0)}
              placeholder="Enter amount"
              keyboardType="numeric"
              styles={styles}
            />

            <FormField
              label="Measure"
              value={component.measure}
              onChangeText={(text) => updateField('measure', text)}
              placeholder="Enter measure unit"
              styles={styles}
            />

            <FormField
              label="Supplier"
              value={component.supplier}
              onChangeText={(text) => updateField('supplier', text)}
              placeholder="Enter supplier name"
              styles={styles}
            />

            <FormField
              label="Cost"
              value={String(component.cost)}
              onChangeText={(text) => updateField('cost', parseFloat(text) || 0)}
              placeholder="Enter cost"
              keyboardType="numeric"
              styles={styles}
            />

            <FormField
              label="Type"
              value={component.type}
              onChangeText={(text) => updateField('type', text)}
              placeholder="Enter component type"
              styles={styles}
            />

            <FormField
              label="Duration of Development (days)"
              value={String(component.durationOfDevelopment)}
              onChangeText={(text) => updateField('durationOfDevelopment', parseInt(text) || 0)}
              placeholder="Enter development duration"
              keyboardType="numeric"
              styles={styles}
            />

            <FormField
              label="Trigger Min Amount"
              value={String(component.triggerMinAmount)}
              onChangeText={(text) => updateField('triggerMinAmount', parseFloat(text) || 0)}
              placeholder="Enter minimum trigger amount"
              keyboardType="numeric"
              styles={styles}
            />

            <FormField
              label="Description"
              value={component.description || ''}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Enter description"
              multiline
              numberOfLines={3}
              style={styles.textArea}
              styles={styles}
            />

            <FormField
              label="Scanned By"
              value={component.scannedBy}
              onChangeText={(text) => updateField('scannedBy', text)}
              placeholder="Enter scanner name"
              styles={styles}
            />

            {/* Image Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Component Image</Text>
              <TouchableOpacity style={styles.imageButton} onPress={handleImagePicker}>
                <Text style={styles.imageButtonText}>
                  {selectedImage ? "Change Image" : "Add Image"}
                </Text>
              </TouchableOpacity>
              {selectedImage && (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => onImageChange(null)}
                  >
                    <Text style={styles.removeImageText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={onSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Creating..." : "Create Component"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
  styles: any;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  style,
  styles,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[styles.textInput, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCorrect={false}
      autoCapitalize={multiline ? 'sentences' : 'none'}
    />
  </View>
);