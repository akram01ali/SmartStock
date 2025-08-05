import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  VStack,
  useToast,
  Text,
  Box,
  List,
  ListItem,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import { MdSearch } from 'react-icons/md';
import Fuse from 'fuse.js';
import { ForecastingService } from '../../services/forecastingService';

interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReservationCreated: () => void;
  availableComponents: string[];
}

const CreateReservationModal: React.FC<CreateReservationModalProps> = ({
  isOpen,
  onClose,
  onReservationCreated,
  availableComponents,
}) => {
  const [title, setTitle] = useState('');
  const [componentSearch, setComponentSearch] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [priority, setPriority] = useState(5);
  const [neededByDate, setNeededByDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [errors, setErrors] = useState({
    title: '',
    componentName: '',
    quantity: '',
    neededByDate: '',
  });

  const toast = useToast();

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(availableComponents, {
      threshold: 0.3, // Lower = more strict matching
      distance: 100,
      minMatchCharLength: 1,
    });
  }, [availableComponents]);

  // Get fuzzy search results
  const searchResults = useMemo(() => {
    if (!componentSearch.trim()) {
      return availableComponents.slice(0, 10); // Show first 10 components when no search
    }
    
    const results = fuse.search(componentSearch);
    return results.map(result => result.item).slice(0, 10); // Limit to 10 results
  }, [componentSearch, fuse, availableComponents]);

  const resetForm = () => {
    setTitle('');
    setComponentSearch('');
    setSelectedComponent('');
    setQuantityInput('');
    setPriority(5);
    setNeededByDate('');
    setErrors({ title: '', componentName: '', quantity: '', neededByDate: '' });
    setShowSuggestions(false);
  };

  const validateForm = () => {
    const newErrors = { title: '', componentName: '', quantity: '', neededByDate: '' };
    let isValid = true;

    // Validate title
    if (!title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    // Validate component selection
    if (!selectedComponent) {
      newErrors.componentName = 'Please select a component';
      isValid = false;
    }

    // Validate quantity (must be a valid positive float)
    const quantityValue = parseFloat(quantityInput);
    if (!quantityInput.trim()) {
      newErrors.quantity = 'Quantity is required';
      isValid = false;
    } else if (isNaN(quantityValue) || quantityValue <= 0) {
      newErrors.quantity = 'Quantity must be a valid positive number';
      isValid = false;
    }

    // Validate date format (dd/mm/yyyy)
    if (neededByDate) {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = neededByDate.match(dateRegex);
      
      if (!match) {
        newErrors.neededByDate = 'Date must be in format dd/mm/yyyy';
        isValid = false;
      } else {
        const [, day, month, year] = match;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Check if date is valid
        if (
          date.getDate() !== parseInt(day) ||
          date.getMonth() !== parseInt(month) - 1 ||
          date.getFullYear() !== parseInt(year)
        ) {
          newErrors.neededByDate = 'Please enter a valid date';
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const quantity = parseFloat(quantityInput);
      
      // Convert dd/mm/yyyy to ISO date if provided
      let isoDate = null;
      if (neededByDate) {
        const [day, month, year] = neededByDate.split('/');
        isoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
      }

      await ForecastingService.createReservation({
        title,
        componentName: selectedComponent,
        quantity,
        priority,
        neededByDate: isoDate,
      });

      toast({
        title: 'Success',
        description: 'Reservation created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onReservationCreated();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create reservation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComponentSelect = (component: string) => {
    setSelectedComponent(component);
    setComponentSearch(component);
    setShowSuggestions(false);
    setErrors(prev => ({ ...prev, componentName: '' }));
  };

  const handleComponentSearchChange = (value: string) => {
    setComponentSearch(value);
    setSelectedComponent('');
    setShowSuggestions(true);
    if (errors.componentName) {
      setErrors(prev => ({ ...prev, componentName: '' }));
    }
  };

  const handleQuantityChange = (value: string) => {
    setQuantityInput(value);
    if (errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: '' }));
    }
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  };

  const handleDateChange = (value: string) => {
    // Allow only digits and slashes, format as dd/mm/yyyy
    let formatted = value.replace(/[^\d/]/g, '');
    
    // Auto-add slashes
    if (formatted.length >= 2 && formatted.charAt(2) !== '/') {
      formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
    }
    if (formatted.length >= 5 && formatted.charAt(5) !== '/') {
      formatted = formatted.substring(0, 5) + '/' + formatted.substring(5);
    }
    
    // Limit to 10 characters (dd/mm/yyyy)
    formatted = formatted.substring(0, 10);
    
    setNeededByDate(formatted);
    if (errors.neededByDate) {
      setErrors(prev => ({ ...prev, neededByDate: '' }));
    }
  };

  // Close suggestions when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowSuggestions(false);
      resetForm();
    }
  }, [isOpen]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Reservation</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {/* Title Input */}
            <FormControl isInvalid={!!errors.title}>
              <FormLabel>Title</FormLabel>
              <Input
                placeholder="Enter reservation title (e.g., 'Component A Order')"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
              <FormErrorMessage>{errors.title}</FormErrorMessage>
            </FormControl>

            {/* Component Search with Fuzzy Matching */}
            <FormControl isInvalid={!!errors.componentName}>
              <FormLabel>Component Name</FormLabel>
              <Box position="relative" onClick={(e) => e.stopPropagation()}>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={MdSearch as any} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search for a component..."
                    value={componentSearch}
                    onChange={(e) => handleComponentSearchChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    autoComplete="off"
                  />
                </InputGroup>
                
                {/* Suggestions Dropdown */}
                {showSuggestions && searchResults.length > 0 && (
                  <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    boxShadow="lg"
                    zIndex={1000}
                    maxH="200px"
                    overflowY="auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <List>
                      {searchResults.map((component, index) => (
                        <ListItem
                          key={index}
                          px={3}
                          py={2}
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                          onClick={() => handleComponentSelect(component)}
                          borderBottom={index < searchResults.length - 1 ? "1px solid" : "none"}
                          borderColor="gray.100"
                        >
                          <Text fontSize="sm">{component}</Text>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
              <FormErrorMessage>{errors.componentName}</FormErrorMessage>
              {selectedComponent && (
                <Text fontSize="sm" color="green.500" mt={1}>
                  Selected: {selectedComponent}
                </Text>
              )}
            </FormControl>

            {/* Quantity Input */}
            <FormControl isInvalid={!!errors.quantity}>
              <FormLabel>Quantity</FormLabel>
              <Input
                placeholder="Enter quantity (e.g., 10.5)"
                value={quantityInput}
                onChange={(e) => handleQuantityChange(e.target.value)}
              />
              <FormErrorMessage>{errors.quantity}</FormErrorMessage>
            </FormControl>

            {/* Priority */}
            <FormControl>
              <FormLabel>Priority (1-10, where 1 is highest)</FormLabel>
              <Input
                type="number"
                min={1}
                max={10}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
              />
            </FormControl>

            {/* Needed By Date */}
            <FormControl isInvalid={!!errors.neededByDate}>
              <FormLabel>Needed By Date (Optional)</FormLabel>
              <Input
                placeholder="dd/mm/yyyy"
                value={neededByDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              <FormErrorMessage>{errors.neededByDate}</FormErrorMessage>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Format: dd/mm/yyyy (e.g., 25/12/2024)
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="Creating..."
          >
            Create Reservation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateReservationModal; 