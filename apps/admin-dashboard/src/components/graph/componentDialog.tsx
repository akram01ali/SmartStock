import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  useToast,
  useColorModeValue,
  Box,
} from '@chakra-ui/react';
import { ApiService } from '../../services/service';
import {
  ComponentCreate,
  ComponentDialogProps,
  Measures,
  TypeOfComponent,
} from './types';
import { FormField, componentFormFields } from './componentFormfield';
import { Suggestions } from './Suggestions';
import { ImageUpload } from './ImageUpload';

function getInitialFormData(): ComponentCreate {
  return {
    componentName: '',
    amount: 0,
    measure: Measures.Amount,
    lastScanned: new Date().toISOString(),
    scannedBy: '',
    durationOfDevelopment: 0,
    triggerMinAmount: 0,
    supplier: '',
    cost: 0,
    type: TypeOfComponent.Component,
    description: '',
    image: '',
  };
}

function performFuzzySearch(query: string, allComponents: string[]): string[] {
  if (!query || query.length < 2) return [];

  const queryLower = query.toLowerCase();
  return allComponents
    .filter((name) => name.toLowerCase().includes(queryLower))
    .sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      if (aLower === queryLower) return -1;
      if (bLower === queryLower) return 1;
      return aLower.indexOf(queryLower) - bLower.indexOf(queryLower);
    })
    .slice(0, 10);
}

export function ComponentDialog({
  isOpen,
  onClose,
  component,
  mode = 'edit',
  initialComponent,
  onSubmit,
}: ComponentDialogProps) {
  const [formData, setFormData] = useState<ComponentCreate>(
    getInitialFormData(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relationshipAmount, setRelationshipAmount] = useState(1.0);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [allComponents, setAllComponents] = useState<string[]>([]);
  const toast = useToast();

  // Color mode values
  const colors = {
    bgColor: useColorModeValue('white', 'gray.700'),
    textColor: useColorModeValue('gray.800', 'white'),
    textColorSecondary: useColorModeValue('gray.600', 'gray.400'),
    borderColor: useColorModeValue('gray.200', 'gray.600'),
    suggestionsBg: useColorModeValue('white', 'gray.800'),
    suggestionsHoverBg: useColorModeValue('blue.50', 'gray.700'),
    headerBg: useColorModeValue('blue.50', 'blue.900'),
    headerBorderColor: useColorModeValue('blue.200', 'blue.600'),
    inputBg: useColorModeValue('white', 'gray.800'),
  };

  // Load all components for suggestions
  const loadAllComponents = async () => {
    try {
      setIsSearching(true);
      const components = await ApiService.getAllComponents();
      setAllComponents(components.map((comp: any) => comp.componentName || comp.name));
    } catch (error) {
      console.error('Error loading components for suggestions:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Effects and handlers
  useEffect(() => {
    if (isOpen) {
      if (component && mode === 'edit') {
        setFormData({
          ...component,
          lastScanned: component.lastScanned || new Date().toISOString(),
        });
      } else if (mode === 'create') {
        setFormData(getInitialFormData());
        loadAllComponents();
      }
    }
  }, [isOpen, component, mode]);

  // Handle component name changes and search
  useEffect(() => {
    if (mode === 'create' && formData.componentName) {
      const results = performFuzzySearch(formData.componentName, allComponents);
      setSearchResults(results);
      setShowSuggestions(results.length > 0 && formData.componentName.length >= 2);
    } else {
      setShowSuggestions(false);
    }
  }, [formData.componentName, allComponents, mode]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (mode !== 'create' || !initialComponent) {
      setFormData((prev) => ({ ...prev, componentName: suggestion }));
      setShowSuggestions(false);
      return;
    }

    // Auto-create the component when suggestion is clicked in create mode
    try {
      setIsSubmitting(true);
      setShowSuggestions(false);
      
      const componentData = {
        ...formData,
        componentName: suggestion
      };
      
      const relationshipData = { amount: relationshipAmount };
      
      await onSubmit(componentData, relationshipData);
      
      toast({
        title: 'Component Created',
        description: `${suggestion} has been added to ${initialComponent}`,
        status: 'success',
        duration: 3000,
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating component from suggestion:', error);
      toast({
        title: 'Error Creating Component',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Basic validation
      if (!formData.componentName.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Component name is required',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      if (formData.amount < 0) {
        toast({
          title: 'Validation Error',
          description: 'Amount cannot be negative',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      // Prepare relationship data for create mode
      const relationshipData = mode === 'create' && initialComponent ? 
        { amount: relationshipAmount } : 
        undefined;

      await onSubmit(formData, relationshipData);
      onClose();
    } catch (error) {
      console.error('Error submitting component:', error);
      toast({
        title: 'Error',
        description: 'Failed to save component. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form fields dynamically
  const renderFormFields = () => {
    return componentFormFields.map((field) => (
      <FormField
        key={field.id}
        label={field.label}
        name={field.id}
        type={field.type as 'text' | 'number' | 'select'}
        value={formData[field.id as keyof ComponentCreate]}
        onChange={handleChange}
        options={field.options}
        placeholder={field.placeholder}
        precision={field.precision}
        textColor={colors.textColor}
        inputBg={colors.inputBg}
        borderColor={colors.borderColor}
        optionBg={colors.inputBg}
        optionColor={colors.textColor}
      />
    ));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg={colors.bgColor}>
        <ModalHeader color={colors.textColor}>
          {mode === 'create' ? 'Create New Component' : 'Edit Component'}
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            {/* Component name field with suggestions */}
            <Box position="relative" width="100%">
              <FormField
                label="Component Name"
                name="componentName"
                type="text"
                value={formData.componentName}
                onChange={handleChange}
                placeholder="Enter component name"
                textColor={colors.textColor}
                inputBg={colors.inputBg}
                borderColor={colors.borderColor}
                optionBg={colors.inputBg}
                optionColor={colors.textColor}
                isReadOnly={mode === 'edit'}
              />

              {showSuggestions && searchResults.length > 0 && (
                <Suggestions
                  searchResults={searchResults}
                  onSelect={handleSuggestionClick}
                  colors={colors}
                />
              )}
            </Box>

            {/* Dynamic form fields */}
            {renderFormFields()}

            {/* Image Upload */}
            <ImageUpload
              value={formData.image}
              onChange={(imageUrl) => handleChange('image', imageUrl || '')}
              textColor={colors.textColor}
              inputBg={colors.inputBg}
              borderColor={colors.borderColor}
            />

            {/* Relationship amount field for create mode */}
            {mode === 'create' && initialComponent && (
              <FormField
                label={`Initial Amount in ${initialComponent}`}
                name="relationshipAmount"
                type="number"
                value={relationshipAmount}
                onChange={(name, val) => setRelationshipAmount(Number(val))}
                precision={2}
                textColor={colors.textColor}
                inputBg={colors.inputBg}
                borderColor={colors.borderColor}
                optionBg={colors.inputBg}
                optionColor={colors.textColor}
              />
            )}
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
