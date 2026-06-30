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
  HStack,
  Input,
  IconButton,
  Text,
  Heading,
  Divider,
  Select,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '../common/IconWrapper';
import { ApiService } from '../../services/service';
import {
  ComponentCreate,
  ComponentDialogProps,
  Measures,
  TypeOfComponent,
  ProductionStage,
} from './types';
import { FormField, componentFormFields } from './componentFormfield';
import { Suggestions } from './Suggestions';
import { ImageUpload } from './ImageUpload';

function getInitialFormData(): ComponentCreate {
  return {
    componentName: '',
    amount: '0',
    measure: Measures.Amount,
    lastScanned: new Date().toISOString(),
    scannedBy: '',
    triggerMinAmount: '0',
    supplier: '',
    cost: '0',
    type: TypeOfComponent.Component,
    description: '',
    image: '',
    location: '',
    productionStages: [],
  };
}

// Helper function to safely parse float values for submission
function parseFloatSafe(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value.toString().trim() === '') return 0;
  const parsed = parseFloat(value.toString());
  return isNaN(parsed) ? 0 : parsed;
}

/** Convert a float hours value to "HH:MM" string for a time input */
function hoursToTimeString(hours: number | string): string {
  const h = parseFloatSafe(hours);
  const totalMinutes = Math.round(h * 60);
  const hh = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const mm = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Convert "HH:MM" string back to float hours */
function timeStringToHours(time: string): number {
  if (!time) return 0;
  const [hh, mm] = time.split(':').map(Number);
  return (hh || 0) + (mm || 0) / 60;
}

// Helper function to prepare form data for submission
function prepareFormDataForSubmission(formData: ComponentCreate): ComponentCreate {
  return {
    ...formData,
    amount: parseFloatSafe(formData.amount),
    triggerMinAmount: parseFloatSafe(formData.triggerMinAmount),
    cost: parseFloatSafe(formData.cost),
    productionStages: (formData.productionStages || []).map((stage: any) => ({
      ...stage,
      duration: timeStringToHours(stage.duration),
    })),
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
  const [laborProfiles, setLaborProfiles] = useState<{ id: string; name: string; hourlyRate: number }[]>([]);
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
      const components = await ApiService.getAllComponents() as any[];
      setAllComponents(components.map((comp: any) => comp.componentName || comp.name));
    } catch (error) {
      console.error('Error loading components for suggestions:', error);
      toast({
        title: 'Warning',
        description: 'Could not load component suggestions',
        status: 'warning',
        duration: 3000,
      });
      setAllComponents([]); // Set empty array as fallback
    } finally {
      setIsSearching(false);
    }
  };

  // Effects and handlers
  useEffect(() => {
    if (isOpen) {
      // Load labor profiles whenever dialog opens
      ApiService.getAllLaborProfiles()
        .then((profiles: any) => setLaborProfiles(profiles || []))
        .catch(() => setLaborProfiles([]));

      if (component && mode === 'edit') {
        setFormData({
          ...component,
          amount: component.amount?.toString() || '0',
          triggerMinAmount: component.triggerMinAmount?.toString() || '0',
          cost: component.cost?.toString() || '0',
          lastScanned: component.lastScanned || new Date().toISOString(),
          productionStages: (component.productionStages || []).map((stage: any) => ({
            id: stage.id,
            stageName: stage.stageName,
            duration: hoursToTimeString(stage.duration ?? 0),
            order: stage.order || 0,
            laborProfileId: stage.laborProfileId || '',
          })),
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

  const handleAddProductionStage = () => {
    const newStage: ProductionStage = {
      stageName: '',
      duration: '00:00',
      order: (formData.productionStages?.length || 0) + 1,
    };
    setFormData((prev) => ({
      ...prev,
      productionStages: [...(prev.productionStages || []), newStage],
    }));
  };

  const handleUpdateProductionStage = (index: number, field: string, value: any) => {
    const stages = [...(formData.productionStages || [])];
    stages[index] = { ...stages[index], [field]: value };
    setFormData((prev) => ({ ...prev, productionStages: stages }));
  };

  const handleRemoveProductionStage = (index: number) => {
    const stages = (formData.productionStages || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, productionStages: stages }));
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
      
      const componentData = prepareFormDataForSubmission({
        ...formData,
        componentName: suggestion
      });
      
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
      
      // Enhanced validation with better error messages
      if (!formData.componentName.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Component name is required',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const amount = parseFloatSafe(formData.amount);
      if (amount < 0) {
        toast({
          title: 'Validation Error',
          description: 'Amount cannot be negative',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const cost = parseFloatSafe(formData.cost);
      if (cost < 0) {
        toast({
          title: 'Validation Error',
          description: 'Cost cannot be negative',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const triggerMin = parseFloatSafe(formData.triggerMinAmount);
      if (triggerMin < 0) {
        toast({
          title: 'Validation Error',
          description: 'Trigger minimum amount cannot be negative',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      // Prepare relationship data for create mode
      const relationshipData = mode === 'create' && initialComponent ? 
        { amount: relationshipAmount } : 
        undefined;

      await onSubmit(prepareFormDataForSubmission(formData), relationshipData);
      onClose();
    } catch (error) {
      console.error('Error submitting component:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save component. Please try again.',
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

            {/* Production Stages Section */}
            <Box width="100%">
              <Divider my={2} borderColor={colors.borderColor} />
              <Heading size="sm" color={colors.textColor} mb={3}>
                Production Stages
              </Heading>
              
              <VStack spacing={3} align="stretch">
                {(formData.productionStages || []).map((stage, index) => (
                  <Box
                    key={index}
                    p={3}
                    bg={colors.inputBg}
                    borderRadius="md"
                    borderColor={colors.borderColor}
                    borderWidth="1px"
                  >
                    <HStack spacing={2} align="flex-start">
                      <VStack flex={1} spacing={2} align="stretch">
                        <Input
                          placeholder="Stage name (e.g., Design, Manufacturing, Testing)"
                          value={stage.stageName}
                          onChange={(e) => handleUpdateProductionStage(index, 'stageName', e.target.value)}
                          bg="transparent"
                          borderColor={colors.borderColor}
                          color={colors.textColor}
                          size="sm"
                        />
                        <HStack spacing={2}>
                          <Box flex={1}>
                            <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                              Duration
                            </Text>
                            <HStack spacing={1}>
                              <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={(() => {
                                  const t = (stage.duration as string) || '00:00';
                                  return parseInt(t.split(':')[0] || '0', 10);
                                })()}
                                onChange={(e) => {
                                  const current = (stage.duration as string) || '00:00';
                                  const mm = current.split(':')[1] || '00';
                                  const hh = Math.max(0, parseInt(e.target.value) || 0).toString().padStart(2, '0');
                                  handleUpdateProductionStage(index, 'duration', `${hh}:${mm}`);
                                }}
                                bg="transparent"
                                borderColor={colors.borderColor}
                                color={colors.textColor}
                                size="sm"
                                w="60px"
                              />
                              <Text fontSize="xs" color={colors.textColorSecondary}>h</Text>
                              <Input
                                type="number"
                                min={0}
                                max={59}
                                placeholder="0"
                                value={(() => {
                                  const t = (stage.duration as string) || '00:00';
                                  return parseInt(t.split(':')[1] || '0', 10);
                                })()}
                                onChange={(e) => {
                                  const current = (stage.duration as string) || '00:00';
                                  const hh = current.split(':')[0] || '00';
                                  const mm = Math.min(59, Math.max(0, parseInt(e.target.value) || 0)).toString().padStart(2, '0');
                                  handleUpdateProductionStage(index, 'duration', `${hh}:${mm}`);
                                }}
                                bg="transparent"
                                borderColor={colors.borderColor}
                                color={colors.textColor}
                                size="sm"
                                w="60px"
                              />
                              <Text fontSize="xs" color={colors.textColorSecondary}>m</Text>
                            </HStack>
                          </Box>
                          <Box flex={1}>
                            <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                              Order
                            </Text>
                            <Input
                              placeholder="1"
                              type="number"
                              value={stage.order}
                              onChange={(e) => handleUpdateProductionStage(index, 'order', parseInt(e.target.value) || 0)}
                              bg="transparent"
                              borderColor={colors.borderColor}
                              color={colors.textColor}
                              size="sm"
                              min="1"
                            />
                          </Box>
                        </HStack>
                        <Box>
                          <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                            Labor Profile
                          </Text>
                          <Select
                            value={(stage as any).laborProfileId || ''}
                            onChange={(e) => handleUpdateProductionStage(index, 'laborProfileId', e.target.value)}
                            bg="transparent"
                            borderColor={colors.borderColor}
                            color={colors.textColor}
                            size="sm"
                            placeholder="No labor profile"
                          >
                            {laborProfiles.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (€{p.hourlyRate.toFixed(2)}/hr)
                              </option>
                            ))}
                          </Select>
                        </Box>
                      </VStack>
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label="Delete stage"
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleRemoveProductionStage(index)}
                        mt={1}
                      />
                    </HStack>
                  </Box>
                ))}
                
                <Button
                  size="sm"
                  leftIcon={<AddIcon />}
                  onClick={handleAddProductionStage}
                  colorScheme="blue"
                  variant="outline"
                  width="100%"
                >
                  Add Production Stage
                </Button>
              </VStack>
              <Divider my={2} borderColor={colors.borderColor} />
            </Box>

            {/* Image Upload */}
            <ImageUpload
              value={formData.image}
              onChange={(imageUrl) => handleChange('image', imageUrl || '')}
              textColor={colors.textColor}
              inputBg={colors.inputBg}
              borderColor={colors.borderColor}
            />


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
