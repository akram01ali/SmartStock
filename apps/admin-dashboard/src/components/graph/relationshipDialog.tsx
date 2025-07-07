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
  initialAmount = 1.0, // Default to 1.0 for new relationships
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

  const isEditMode = initialAmount !== 1.0; // Consider it edit mode if initialAmount is not the default value

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
            <Input
              type="number"
              value={amount}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setAmount(isNaN(value) ? 0 : value);
              }}
              min={0.1}
              step={0.1}
              placeholder="Enter amount"
            />
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
