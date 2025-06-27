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
  Text,
  Box,
  List,
  ListItem,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { MdSearch, MdInfo } from 'react-icons/md';
import { ApiService } from '../../services/service';

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
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [allComponents, setAllComponents] = useState<string[]>([]);
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (component) {
      setFormData(component);
    }
  }, [component]);

  // Fetch all components when dialog opens for create mode
  useEffect(() => {
    if (isOpen && mode === 'create' && !componentsLoaded) {
      const fetchAllComponents = async () => {
        try {
          setIsSearching(true);
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/all_components`);
          if (!response.ok) {
            throw new Error('Failed to fetch components');
          }
          const data = await response.json();
          const componentNames = (data || []).map((component: any) => 
            component.componentName || component.name || component
          );
          setAllComponents(componentNames);
          setComponentsLoaded(true);
        } catch (error) {
          console.error('Error fetching all components:', error);
          setAllComponents([]);
        } finally {
          setIsSearching(false);
        }
      };

      fetchAllComponents();
    }
  }, [isOpen, mode, componentsLoaded]);

  // Reset components cache when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setComponentsLoaded(false);
      setAllComponents([]);
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [isOpen]);

  // Client-side fuzzy search using cached components
  const performFuzzySearch = (query: string): string[] => {
    if (!query || query.length < 2) {
      return [];
    }

    const queryLower = query.toLowerCase();
    
    // Simple fuzzy search algorithm
    const matches = allComponents.filter(componentName => {
      const nameLower = componentName.toLowerCase();
      
      // Exact match gets highest priority
      if (nameLower === queryLower) return true;
      
      // Starts with query
      if (nameLower.startsWith(queryLower)) return true;
      
      // Contains query
      if (nameLower.includes(queryLower)) return true;
      
      // Fuzzy match - check if all characters of query exist in order
      let queryIndex = 0;
      for (let i = 0; i < nameLower.length && queryIndex < queryLower.length; i++) {
        if (nameLower[i] === queryLower[queryIndex]) {
          queryIndex++;
        }
      }
      return queryIndex === queryLower.length;
    });
    
    // Sort matches by relevance
    const sortedMatches = matches.sort((a, b) => {
      const aName = a.toLowerCase();
      const bName = b.toLowerCase();
      
      // Exact matches first
      if (aName === queryLower && bName !== queryLower) return -1;
      if (bName === queryLower && aName !== queryLower) return 1;
      
      // Starts with query
      if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
      if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;
      
      // Contains query
      const aContains = aName.includes(queryLower);
      const bContains = bName.includes(queryLower);
      if (aContains && !bContains) return -1;
      if (bContains && !aContains) return 1;
      
      // Alphabetical order
      return aName.localeCompare(bName);
    });
    
    // Return limited results
    return sortedMatches.slice(0, 10);
  };

  // Fuzzy search for existing components (now uses cached data)
  const handleComponentNameSearch = (value: string) => {
    handleChange('componentName', value);
    
    if (mode === 'create' && value.length >= 2) {
      const results = performFuzzySearch(value);
      setSearchResults(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (componentName: string) => {
    if (!initialComponent) {
      toast({
        title: 'Error',
        description: 'No root component specified for creating component',
        status: 'error',
        duration: 5000,
      });
      return;
    }
    
    setShowSuggestions(false);
    setIsSubmitting(true);
    
    try {
      // Create the component data with the suggested name
      const componentData = {
        ...formData,
        componentName: componentName
      };
      
      // Use the onSubmit callback to ensure proper canvas refresh
      await onSubmit(componentData, mode === 'create' ? { amount: relationshipAmount } : undefined);
      
      toast({
        title: 'Component Created',
        description: `${componentName} has been added to ${initialComponent}`,
        status: 'success',
        duration: 3000,
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating component:', error);
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

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader color="#4318FF">
            {mode === 'create' ? 'Create New Component' : 'Edit Component'}
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl position="relative">
                <FormLabel>
                  <HStack spacing={2}>
                    <Text>Component Name</Text>
                    {mode === 'create' && (
                      <Icon as={MdSearch} color="gray.400" boxSize={4} />
                    )}
                  </HStack>
                </FormLabel>
                <Input
                  value={formData.componentName}
                  onChange={(e) => handleComponentNameSearch(e.target.value)}
                  onBlur={handleInputBlur}
                  onFocus={() => {
                    if (mode === 'create' && searchResults.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  isReadOnly={mode === 'edit'}
                  placeholder={mode === 'create' ? 'Type to search existing components...' : 'Enter component name'}
                />
                
                {mode === 'create' && showSuggestions && searchResults.length > 0 && (
                  <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    zIndex={1000}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    maxH="200px"
                    overflowY="auto"
                    boxShadow="lg"
                  >
                    <Box p={2} bg="blue.50" borderBottom="1px solid" borderColor="blue.200">
                      <HStack spacing={2}>
                        <Icon as={MdInfo} color="blue.500" boxSize={4} />
                        <Text fontSize="xs" color="blue.700" fontWeight="medium">
                          Click to create component with this name:
                        </Text>
                      </HStack>
                    </Box>
                    <List spacing={0}>
                      {searchResults.map((result, index) => (
                        <ListItem
                          key={index}
                          p={3}
                          cursor="pointer"
                          _hover={{ bg: 'blue.50', transform: 'translateX(2px)' }}
                          _active={{ bg: 'blue.100' }}
                          borderBottom={index < searchResults.length - 1 ? '1px solid' : 'none'}
                          borderColor="gray.100"
                          transition="all 0.2s"
                          onClick={() => handleSuggestionClick(result)}
                        >
                          <HStack spacing={2}>
                            <Icon as={MdSearch} color="blue.400" boxSize={4} />
                            <Text fontSize="sm" fontWeight="medium" color="blue.600">
                              {result}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              (click to add)
                            </Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {mode === 'create' && isSearching && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Searching existing components...
                  </Text>
                )}
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
    </>
  );
}
