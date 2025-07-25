import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  useColorModeValue,
  FormErrorMessage,
} from '@chakra-ui/react';

// Helper function to safely parse float values with comprehensive validation
const parseFloatSafe = (value: string): { value: number; error: string | null } => {
  if (!value || value.trim() === '') {
    return { value: 1, error: null }; // Default to 1 for relationships
  }
  
  const trimmed = value.trim();
  
  // Check for invalid characters (allow numbers, decimals, negative signs)
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    return { value: 1, error: 'Please enter a valid number' };
  }
  
  const parsed = parseFloat(trimmed);
  
  if (isNaN(parsed)) {
    return { value: 1, error: 'Please enter a valid number' };
  }
  
  if (!isFinite(parsed)) {
    return { value: 1, error: 'Number is too large' };
  }
  
  // Check for reasonable bounds (relationships should be positive)
  if (parsed <= 0 || parsed > 1000000) {
    return { value: 1, error: 'Amount must be between 0 and 1,000,000' };
  }
  
  return { value: parsed, error: null };
};

interface RelationshipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceComponent: string;
  targetComponent: string;
  initialAmount?: number; // Optional initial amount for editing existing relationships
  onSubmit: (amount: number) => Promise<void>;
}

export function RelationshipDialog({
  isOpen,
  onClose,
  sourceComponent,
  targetComponent,
  initialAmount = 1.0, // Default to 1.0 for new relationships
  onSubmit,
}: RelationshipDialogProps) {
  const [amountStr, setAmountStr] = useState(initialAmount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.800');

  // Update amount when initialAmount changes (for editing existing relationships)
  useEffect(() => {
    if (isOpen) {
      setAmountStr(initialAmount.toString());
      setError(null);
    }
  }, [isOpen, initialAmount]);

  const handleAmountChange = (value: string) => {
    setAmountStr(value);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const parseResult = parseFloatSafe(amountStr);
      if (parseResult.error) {
        setError(parseResult.error);
        setIsSubmitting(false);
        return;
      }
      await onSubmit(parseResult.value);
      onClose();
    } catch (error) {
      console.error('Error submitting relationship:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = initialAmount !== 1.0; // Consider it edit mode if initialAmount is not the default value

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor}>
        <ModalHeader color="#4318FF">
          {isEditMode ? 'Edit Relationship' : 'Create Relationship'}
        </ModalHeader>
        <ModalBody>
          <FormControl isInvalid={!!error}>
            <FormLabel color={textColor}>
              Amount from {sourceComponent} to {targetComponent}
            </FormLabel>
            <Input
              type="text"
              value={amountStr}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter amount"
              bg={inputBg}
              borderColor={borderColor}
              color={textColor}
            />
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
