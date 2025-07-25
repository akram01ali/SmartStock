import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

interface StockUpdateModalProps {
  visible: boolean;
  component: any;
  isAbsoluteUpdate: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  styles: any;
}

export const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  visible,
  component,
  isAbsoluteUpdate,
  inputValue,
  onInputChange,
  onSubmit,
  onCancel,
  styles,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>
          {isAbsoluteUpdate ? 'Set New Total' : 'Add/Subtract Amount'}
        </Text>
        <Text style={styles.modalMessage}>
          {component && (
            `Component: ${component.componentName}\nCurrent stock: ${component.amount} ${component.measure}\n\n${
              isAbsoluteUpdate 
                ? 'Enter the new total amount:' 
                : 'Enter amount to add (positive) or subtract (negative):'
            }`
          )}
        </Text>
        <TextInput
          style={styles.modalInput}
          value={inputValue}
          onChangeText={onInputChange}
          placeholder={isAbsoluteUpdate ? "e.g. 25" : "e.g. +5 or -3"}
          keyboardType="numeric"
          autoFocus={true}
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.submitButton]}
            onPress={onSubmit}
          >
            <Text style={styles.submitButtonText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
); 