import React, { useState } from 'react';
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
  onSubmit: (amount: number) => Promise<void>;
}

export function RelationshipDialog({
  isOpen,
  onClose,
  sourceComponent,
  targetComponent,
  onSubmit,
}: RelationshipDialogProps) {
  const [amount, setAmount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader color="#4318FF">Create Relationship</ModalHeader>
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
            Create
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
