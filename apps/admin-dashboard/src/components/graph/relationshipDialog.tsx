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
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';

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
  initialAmount = 1, // Default to 1 for new relationships
  onSubmit,
}: RelationshipDialogProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update amount when initialAmount changes (for editing existing relationships)
  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount);
    }
  }, [isOpen, initialAmount]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(amount);
      onClose();
    } catch (error) {
      console.error('Error submitting relationship:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = initialAmount > 1; // Consider it edit mode if initialAmount is greater than 1

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader color="#4318FF">
          {isEditMode ? 'Edit Relationship' : 'Create Relationship'}
        </ModalHeader>
        <ModalBody>
          <FormControl>
            <FormLabel>
              Amount from {sourceComponent} to {targetComponent}
            </FormLabel>
            <NumberInput
              value={amount}
              onChange={(_, val) => setAmount(Number(val))}
              min={1}
            >
              <NumberInputField />
            </NumberInput>
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
