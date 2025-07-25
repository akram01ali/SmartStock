import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  Button,
  FormControl,
  FormLabel,
  VStack,
  useToast,
  useColorModeValue,
  Text,
  Box,
  List,
  ListItem,
  HStack,
  FormErrorMessage,
} from '@chakra-ui/react';
import { SearchIcon, InfoIcon } from '../common/IconWrapper';
import { ApiService } from '../../services/service';

// Helper function to safely parse float values with comprehensive validation
const parseFloatSafe = (value: string): { value: number; error: string | null } => {
  if (!value || value.trim() === '') {
    return { value: 0, error: null };
  }
  
  const trimmed = value.trim();
  
  // Check for invalid characters (allow numbers, decimals, negative signs)
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    return { value: 0, error: 'Please enter a valid number' };
  }
  
  const parsed = parseFloat(trimmed);
  
  if (isNaN(parsed)) {
    return { value: 0, error: 'Please enter a valid number' };
  }
  
  if (!isFinite(parsed)) {
    return { value: 0, error: 'Number is too large' };
  }
  
  // Check for reasonable bounds
  if (parsed < -1000000 || parsed > 1000000) {
    return { value: 0, error: 'Number must be between -1,000,000 and 1,000,000' };
  }
  
  return { value: parsed, error: null };
};

// Helper function to validate float input during typing
const isValidFloatInput = (value: string): boolean => {
  if (!value || value.trim() === '') return true;
  const trimmed = value.trim();
  return /^-?(\d*\.?\d*|\.\d*)$/.test(trimmed);
};

// Helper function to format display value
const formatDisplayValue = (value: string, precision?: number): string => {
  const parseResult = parseFloatSafe(value);
  if (parseResult.error || value === '') return value;
  
  if (precision !== undefined) {
    return parseResult.value.toFixed(precision);
  }
  
  return parseResult.value.toString();
};

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
  type: 'printer' | 'group' | 'component' | 'assembly';
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

// Reusable FloatInput component with validation
interface FloatInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  precision?: number;
  bg: string;
  borderColor: string;
  color: string;
  textColorSecondary: string;
  isReadOnly?: boolean;
}

const FloatInput: React.FC<FloatInputProps> = ({
  value,
  onChange,
  placeholder = "0",
  precision = 2,
  bg,
  borderColor,
  color,
  textColorSecondary,
  isReadOnly = false,
}) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalValue(formatDisplayValue(value.toString(), precision));
  }, [value, precision]);

  const handleChange = (inputValue: string) => {
    setLocalValue(inputValue);
    setError(null);
    
    if (inputValue === '') {
      onChange(0);
      return;
    }
    
    if (!isValidFloatInput(inputValue)) {
      setError('Please enter a valid number');
      return;
    }
    
    const parseResult = parseFloatSafe(inputValue);
    if (parseResult.error) {
      setError(parseResult.error);
      return;
    }
    
    onChange(parseResult.value);
  };

  const handleBlur = () => {
    const parseResult = parseFloatSafe(localValue);
    if (parseResult.error) {
      setError(parseResult.error);
      setLocalValue('0');
      onChange(0);
      return;
    }
    
    const formattedValue = formatDisplayValue(localValue, precision);
    setLocalValue(formattedValue);
    onChange(parseResult.value);
    setError(null);
  };

  return (
    <FormControl isInvalid={!!error}>
      <Input
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        bg={bg}
        borderColor={borderColor}
        color={color}
        _placeholder={{ color: textColorSecondary }}
        isReadOnly={isReadOnly}
        type="text"
      />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
};

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

  // Color mode values for dark mode support
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const suggestionsBg = useColorModeValue('white', 'gray.800');
  const suggestionsHoverBg = useColorModeValue('blue.50', 'gray.700');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  const headerBorderColor = useColorModeValue('blue.200', 'blue.600');
  const inputBg = useColorModeValue('white', 'gray.800');
  const optionBg = useColorModeValue('white', '#2D3748');
  const optionColor = useColorModeValue('#1A202C', 'white');

  useEffect(() => {
    if (isOpen) {
      if (component && mode === 'edit') {
        // Pre-fill form with existing component data for edit mode
        setFormData({
          ...component,
          lastScanned: component.lastScanned || new Date().toISOString(),
        });
      } else if (mode === 'create') {
        // Reset form for create mode
        setFormData({
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
      }
    }
  }, [isOpen, component, mode]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setComponentsLoaded(false);
      setAllComponents([]);
      setSearchResults([]);
      setShowSuggestions(false);
      setRelationshipAmount(1);
      // Don't reset formData here as it might interfere with the opening logic
    }
  }, [isOpen]);

  // Fetch all components when dialog opens for create mode
  useEffect(() => {
    console.log('useEffect for fetching components:', { isOpen, mode, componentsLoaded });
    
    if (isOpen && mode === 'create' && !componentsLoaded) {
      const fetchAllComponents = async () => {
        try {
          console.log('Starting to fetch all components...');
          setIsSearching(true);
          const data = await ApiService.getAllComponents() as any[];
          console.log('Received data from getAllComponents:', data);
          
          const componentNames = (data || []).map((component: any) => 
            component.componentName || component.name || component
          );
          console.log('Extracted component names:', componentNames);
          
          setAllComponents(componentNames);
          setComponentsLoaded(true);
          console.log('Components loaded successfully');
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

  // Client-side fuzzy search using cached components
  const performFuzzySearch = (query: string): string[] => {
    console.log('performFuzzySearch called with:', query);
    console.log('allComponents available:', allComponents.length);
    
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
    const results = sortedMatches.slice(0, 10);
    console.log('Search results:', results);
    return results;
  };

  // Fuzzy search for existing components (now uses cached data)
  const handleComponentNameSearch = (value: string) => {
    console.log('handleComponentNameSearch called with:', value);
    handleChange('componentName', value);
    
    if (mode === 'create' && value.length >= 2) {
      const results = performFuzzySearch(value);
      setSearchResults(results);
      setShowSuggestions(results.length > 0);
      console.log('Setting showSuggestions to:', results.length > 0);
      console.log('searchResults set to:', results);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
      console.log('Clearing suggestions');
    }
  };

  const handleSuggestionClick = async (componentName: string) => {
    console.log('=== HANDLE SUGGESTION CLICK START ===');
    console.log('handleSuggestionClick called with:', componentName);
    console.log('initialComponent:', initialComponent);
    console.log('onSubmit function type:', typeof onSubmit);
    console.log('onSubmit function:', onSubmit);
    console.log('mode:', mode);
    console.log('Current formData:', JSON.stringify(formData, null, 2));
    console.log('relationshipAmount:', relationshipAmount);
    
    if (!initialComponent) {
      console.log('❌ No initialComponent, showing error toast');
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
    console.log('✅ About to call onSubmit...');
    
    try {
      // Create the component data with the suggested name
      const componentData = {
        ...formData,
        componentName: componentName
      };
      
      console.log('📝 Component data to submit:', JSON.stringify(componentData, null, 2));
      const relationshipData = mode === 'create' ? { amount: relationshipAmount } : undefined;
      console.log('🔗 Relationship data:', relationshipData);
      
      console.log('🚀 Calling onSubmit with data...');
      // Use the onSubmit callback to ensure proper canvas refresh
      const result = await onSubmit(componentData, relationshipData);
      
      console.log('✅ onSubmit completed successfully, result:', result);
      
      toast({
        title: 'Component Created',
        description: `${componentName} has been added to ${initialComponent}`,
        status: 'success',
        duration: 3000,
      });
      
      console.log('✅ Success toast shown, closing dialog');
      onClose();
    } catch (error) {
      console.error('❌ Error creating component:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        error: error
      });
      toast({
        title: 'Error Creating Component',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      console.log('=== HANDLE SUGGESTION CLICK END ===');
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
        <ModalContent bg={bgColor} color={textColor}>
          <ModalHeader color={useColorModeValue("#4318FF", "#868CFF")}>
            {mode === 'create' ? 'Create New Component' : 'Edit Component'}
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl position="relative">
                <FormLabel color={textColor}>
                  <HStack spacing={2}>
                    <Text>Component Name</Text>
                    {mode === 'create' && (
                      <SearchIcon size="16px" color={textColorSecondary} />
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
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                  _placeholder={{ color: textColorSecondary }}
                />
                
                {mode === 'create' && showSuggestions && searchResults.length > 0 && (() => {
                  console.log('Rendering suggestions box with results:', searchResults);
                  return (
                    <Box
                      position="absolute"
                      top="100%"
                      left={0}
                      right={0}
                      zIndex={1000}
                      bg={suggestionsBg}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="md"
                      maxH="200px"
                      overflowY="auto"
                      boxShadow="lg"
                    >
                      <Box p={2} bg={headerBg} borderBottom="1px solid" borderColor={headerBorderColor}>
                        <HStack spacing={2}>
                          <InfoIcon size="16px" color="blue" />
                          <Text fontSize="xs" color={useColorModeValue("blue.700", "blue.300")} fontWeight="medium">
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
                            _hover={{ bg: suggestionsHoverBg, transform: 'translateX(2px)' }}
                            _active={{ bg: useColorModeValue('blue.100', 'gray.600') }}
                            borderBottom={index < searchResults.length - 1 ? '1px solid' : 'none'}
                            borderColor={borderColor}
                            transition="all 0.2s"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent blur from firing
                              console.log('ListItem onMouseDown for result:', result);
                              handleSuggestionClick(result);
                            }}
                          >
                            <HStack spacing={2}>
                              <SearchIcon size="16px" color="blue" />
                              <Text fontSize="sm" fontWeight="medium" color={useColorModeValue("blue.600", "blue.300")}>
                                {result}
                              </Text>
                              <Text fontSize="xs" color={textColorSecondary}>
                                (click to add)
                              </Text>
                            </HStack>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  );
                })()}
                
                {mode === 'create' && isSearching && (
                  <Text fontSize="xs" color={textColorSecondary} mt={1}>
                    Searching existing components...
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Amount</FormLabel>
                <FloatInput
                  value={formData.amount}
                  onChange={(value) => handleChange('amount', value)}
                  placeholder="Enter amount"
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                  textColorSecondary={textColorSecondary}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Measure</FormLabel>
                <Select
                  value={formData.measure}
                  onChange={(e) => handleChange('measure', e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                >
                  <option value="centimeters" style={{ backgroundColor: optionBg, color: optionColor }}>Centimeters</option>
                  <option value="meters" style={{ backgroundColor: optionBg, color: optionColor }}>Meters</option>
                  <option value="amount" style={{ backgroundColor: optionBg, color: optionColor }}>Amount</option>
                </Select>
              </FormControl>

              {mode === 'create' && initialComponent && (
                <FormControl>
                  <FormLabel color={textColor}>Initial Amount in {initialComponent}</FormLabel>
                  <FloatInput
                    value={relationshipAmount}
                    onChange={(value) => setRelationshipAmount(value)}
                    placeholder="Enter initial amount"
                    bg={inputBg}
                    borderColor={borderColor}
                    color={textColor}
                    textColorSecondary={textColorSecondary}
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel color={textColor}>Trigger Min Amount</FormLabel>
                <FloatInput
                  value={formData.triggerMinAmount}
                  onChange={(value) => handleChange('triggerMinAmount', value)}
                  placeholder="Enter trigger min amount"
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                  textColorSecondary={textColorSecondary}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Supplier</FormLabel>
                <Input
                  value={formData.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                  _placeholder={{ color: textColorSecondary }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Scanned By</FormLabel>
                <Input
                  value={formData.scannedBy}
                  onChange={(e) => handleChange('scannedBy', e.target.value)}
                  placeholder="Enter who scanned this component"
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                  _placeholder={{ color: textColorSecondary }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Cost</FormLabel>
                <FloatInput
                  value={formData.cost}
                  onChange={(value) => handleChange('cost', value)}
                  placeholder="Enter cost"
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                  textColorSecondary={textColorSecondary}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Development Duration (days)</FormLabel>
                <FloatInput
                  value={formData.durationOfDevelopment}
                  onChange={(value) => handleChange('durationOfDevelopment', value)}
                  placeholder="Enter development duration"
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                  textColorSecondary={textColorSecondary}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                >
                  <option value="printer" style={{ backgroundColor: optionBg, color: optionColor }}>Printer</option>
                  <option value="group" style={{ backgroundColor: optionBg, color: optionColor }}>Group</option>
                  <option value="component" style={{ backgroundColor: optionBg, color: optionColor }}>Component</option>
                  <option value="assembly" style={{ backgroundColor: optionBg, color: optionColor }}>Assembly</option>
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
