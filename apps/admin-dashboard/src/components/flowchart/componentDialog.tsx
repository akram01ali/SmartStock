import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Button,
  FormControl,
  FormLabel,
  VStack,
  useToast,
} from '@chakra-ui/react';

interface ComponentData {
  componentName: string;
  amount: number;
  measure: 'centimeters' | 'meters' | 'amount';
  lastScanned: string;
  scannedBy: string;
  durationOfDevelopment: number;
  triggerMinAmount: number;
  supplier: string;
  cost: number;
  type: 'printer' | 'group' | 'component';
}

interface ComponentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  component: ComponentData | null;
  mode: 'create' | 'edit';
  initialComponent?: string;
  onSubmit: (
    data: ComponentData,
    relationshipData?: { amount: number },
  ) => Promise<void>;
}

export function ComponentDialog({
  isOpen,
  onClose,
  component,
  mode = 'edit',
  initialComponent,
  onSubmit,
}: ComponentDialogProps) {
  const [formData, setFormData] = useState<ComponentData>({
    componentName: '',
    amount: 0,
    measure: 'amount',
    lastScanned: new Date().toISOString(),
    scannedBy: '',
    durationOfDevelopment: 0,
    triggerMinAmount: 0,
    supplier: '',
    cost: 0,
    type: 'component',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relationshipAmount, setRelationshipAmount] = useState(1);
  const toast = useToast();

  useEffect(() => {
    if (component) {
      setFormData(component);
    }
  }, [component]);

  const handleChange = (field: keyof ComponentData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(
        formData,
        mode === 'create' ? { amount: relationshipAmount } : undefined,
      );
      toast({
        title: `Component ${mode === 'create' ? 'created' : 'updated'}`,
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
      toast({
        title: `Error ${mode === 'create' ? 'creating' : 'updating'} component`,
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader color="#4318FF">
          {mode === 'create' ? 'Create New Component' : 'Edit Component'}
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Component Name</FormLabel>
              <Input
                value={formData.componentName}
                onChange={(e) => handleChange('componentName', e.target.value)}
                isReadOnly={mode === 'edit'}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Amount</FormLabel>
              <NumberInput
                value={formData.amount}
                onChange={(_, val) => handleChange('amount', val)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Measure</FormLabel>
              <Select
                value={formData.measure}
                onChange={(e) => handleChange('measure', e.target.value)}
              >
                <option value="centimeters">Centimeters</option>
                <option value="meters">Meters</option>
                <option value="amount">Amount</option>
              </Select>
            </FormControl>

            {mode === 'create' && initialComponent && (
              <FormControl>
                <FormLabel>Initial Amount in {initialComponent}</FormLabel>
                <NumberInput
                  value={relationshipAmount}
                  onChange={(_, val) => setRelationshipAmount(Number(val))}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Trigger Min Amount</FormLabel>
              <NumberInput
                value={formData.triggerMinAmount}
                onChange={(_, val) => handleChange('triggerMinAmount', val)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Supplier</FormLabel>
              <Input
                value={formData.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Cost</FormLabel>
              <NumberInput
                value={formData.cost}
                onChange={(_, val) => handleChange('cost', val)}
                precision={2}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Development Duration (days)</FormLabel>
              <NumberInput
                value={formData.durationOfDevelopment}
                onChange={(_, val) =>
                  handleChange('durationOfDevelopment', val)
                }
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Type</FormLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                <option value="printer">Printer</option>
                <option value="group">Group</option>
                <option value="component">Component</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {mode === 'create' ? 'Create' : 'Save Changes'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
