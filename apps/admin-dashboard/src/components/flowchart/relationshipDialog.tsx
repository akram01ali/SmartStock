import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  FormControl,
  FormLabel,
  useToast,
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

// Helper function to validate float input during typing
const isValidFloatInput = (value: string): boolean => {
  if (!value || value.trim() === '') return true;
  const trimmed = value.trim();
  return /^-?(\d*\.?\d*|\.\d*)$/.test(trimmed);
};

interface RelationshipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
  sourceComponent: string;
  targetComponent: string;
  initialAmount: number;
  isEditMode?: boolean;
}

export default function RelationshipDialog({
  isOpen,
  onClose,
  onSubmit,
  sourceComponent,
  targetComponent,
  initialAmount,
  isEditMode = false,
}: RelationshipDialogProps) {
  const [amountStr, setAmountStr] = useState(initialAmount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.800');

  // Update amount when initialAmount changes (for editing existing relationships)
  useEffect(() => {
    if (isOpen) {
      setAmountStr(initialAmount.toString());
      setAmountError(null); // Clear previous errors
    }
  }, [isOpen, initialAmount]);

  const handleAmountChange = (inputValue: string) => {
    setAmountStr(inputValue);
    setAmountError(null);
    
    if (!isValidFloatInput(inputValue)) {
      setAmountError('Please enter a valid number');
    }
  };

  const handleAmountBlur = () => {
    const { value, error } = parseFloatSafe(amountStr);
    if (error) {
      setAmountError(error);
      return;
    }
    setAmountStr(value.toString());
    setAmountError(null);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const { value, error } = parseFloatSafe(amountStr);
      if (error) {
        setAmountError(error);
        setIsSubmitting(false);
        return;
      }
      await onSubmit(value);
      toast({
        title: `Relationship ${isEditMode ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
      toast({
        title: `Error ${isEditMode ? 'updating' : 'creating'} relationship`,
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader color={textColor}>
          {isEditMode ? 'Edit Relationship' : 'Create Relationship'}
        </ModalHeader>
        <ModalBody>
          <FormControl isInvalid={!!amountError}>
            <FormLabel color={textColor}>
              Amount from {sourceComponent} to {targetComponent}
            </FormLabel>
            <Input
              type="text"
              value={amountStr}
              onChange={(e) => handleAmountChange(e.target.value)}
              onBlur={handleAmountBlur}
              placeholder="Enter amount"
              bg={inputBg}
              borderColor={borderColor}
              color={textColor}
            />
            {amountError && <FormErrorMessage>{amountError}</FormErrorMessage>}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText={isEditMode ? 'Updating...' : 'Creating...'}
            mr={3}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
