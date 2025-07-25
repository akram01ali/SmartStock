import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { showImagePickerAlert, openCamera, openImagePicker } from '../utils/imageUtils';

interface EditableComponent {
  componentName: string;
  amount: number;
  measure: string;
  supplier: string;
  cost: number;
  type: string;
  description?: string;
  lastScanned: string;
  scannedBy: string;
  durationofDevelopment: number;
  triggerMinAmount: number;
}

interface EditComponentModalProps {
  visible: boolean;
  component: EditableComponent;
  loading: boolean;
  selectedImage: ImagePicker.ImageInfo | null;
  onClose: () => void;
  onSave: () => void;
  onComponentChange: (component: EditableComponent) => void;
  onImageChange: (image: ImagePicker.ImageInfo | null) => void;
  styles: any; // You would import proper styles here
}

export const EditComponentModal: React.FC<EditComponentModalProps> = ({
  visible,
  component,
  loading,
  selectedImage,
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

  const updateField = (field: keyof EditableComponent, value: any) => {
    onComponentChange({ ...component, [field]: value });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Component</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder="Component Name"
              value={component.componentName || ''}
              onChangeText={(text) => updateField('componentName', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={String(component.amount || 0)}
              onChangeText={(text) => updateField('amount', Number(text) || 0)}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Measure"
              value={component.measure || ''}
              onChangeText={(text) => updateField('measure', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="Supplier"
              value={component.supplier || ''}
              onChangeText={(text) => updateField('supplier', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="Cost"
              value={String(component.cost || 0)}
              onChangeText={(text) => updateField('cost', Number(text) || 0)}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Type"
              value={component.type || ''}
              onChangeText={(text) => updateField('type', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="Duration of Development (hours)"
              value={String(component.durationofDevelopment || 0)}
              onChangeText={(text) => updateField('durationofDevelopment', Number(text) || 0)}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Trigger Minimum Amount"
              value={String(component.triggerMinAmount || 0)}
              onChangeText={(text) => updateField('triggerMinAmount', Number(text) || 0)}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={component.description || ''}
              onChangeText={(text) => updateField('description', text)}
              multiline={true}
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="Scanned By"
              value={component.scannedBy || ''}
              onChangeText={(text) => updateField('scannedBy', text)}
            />

            {/* Image Section */}
            <View style={styles.imageEditSection}>
              <Text style={styles.inputLabel}>Component Image</Text>
              
              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => onImageChange(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#DC3545" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noImagePreview}>
                  <Ionicons name="image-outline" size={32} color="#CCCCCC" />
                  <Text style={styles.noImageText}>No image selected</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handleImagePicker}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.imagePickerButtonText}>
                  {selectedImage ? 'Change Image' : 'Add Image'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={onSave}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}; 