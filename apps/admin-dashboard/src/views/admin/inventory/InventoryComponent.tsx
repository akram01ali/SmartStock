import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  useColorModeValue,
  Flex,
  Button,
  VStack,
  useToast,
  useDisclosure,
  HStack,
  Badge,
  Divider,
  Image,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
} from '@chakra-ui/react';

import { ApiService } from '../../../services/service';
import {
  BackIcon,
  EditIcon,
  DeleteIcon,
  PersonIcon,
  TimeIcon,
} from '../../../components/common/IconWrapper';
import { ComponentDialog } from '../../../components/graph/componentDialog';
import {
  ComponentCreate,
  Measures,
  TypeOfComponent,
} from '../../../components/graph/types';

// Types
interface Component {
  componentName: string;
  amount: number;
  measure: Measures;
  lastScanned: string;
  scannedBy: string;
  durationOfDevelopment: number;
  triggerMinAmount: number;
  supplier: string;
  cost: number;
  type: TypeOfComponent;
  description?: string;
  image?: string;
}

interface InventoryComponentProps {
  component: Component;
  onBack: () => void;
  onEdit?: (component: Component) => Promise<void>;
  onDelete?: (componentName: string) => Promise<void>;
}

// Constants
const TOAST_DURATION = 3000;

const TYPE_COLOR_MAP = {
  [TypeOfComponent.Printer]: 'blue',
  [TypeOfComponent.Group]: 'purple',
  [TypeOfComponent.Component]: 'green',
  [TypeOfComponent.Assembly]: 'orange',
} as const;

const DEFAULT_TYPE_COLOR = 'gray';

export default function InventoryComponent({
  component,
  onBack,
  onEdit,
  onDelete,
}: InventoryComponentProps) {
  // State
  const [isDeleting, setIsDeleting] = useState(false);
  const [hourlyRateInput, setHourlyRateInput] = useState('18.5');
  const [hourlyRateError, setHourlyRateError] = useState<string | null>(null);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Hooks
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Color mode values - FIXED: Use proper background colors
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'gray.400');
  const bgColor = useColorModeValue('gray.50', 'navy.900'); // Fixed: proper background
  const cardBg = useColorModeValue('white', 'navy.700');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  const imageBg = useColorModeValue('gray.50', 'gray.700');
  const fallbackBg = useColorModeValue('gray.100', 'gray.600');
  const inputBg = useColorModeValue('gray.100', 'gray.800');
  const analyticsBg = useColorModeValue('blue.50', 'blue.900');
  const analyticsBorderColor = useColorModeValue('blue.200', 'blue.600');
  const analyticsTextColor = useColorModeValue('blue.700', 'blue.200');
  const totalCostColor = useColorModeValue('blue.600', 'blue.300');

  // Computed values
  const isLowStock = component.amount < component.triggerMinAmount;
  const hourlyRate = parseFloat(hourlyRateInput) || 0;

  // Utility functions
  const getTypeColor = useCallback((type: TypeOfComponent) => {
    return TYPE_COLOR_MAP[type] || DEFAULT_TYPE_COLOR;
  }, []);

  const showToast = useCallback((title: string, description?: string, status: 'success' | 'error' = 'success') => {
    toast({
      title,
      description,
      status,
      duration: TOAST_DURATION,
    });
  }, [toast]);

  const showErrorToast = useCallback((error: unknown, title: string) => {
    const description = error instanceof Error ? error.message : 'Unknown error';
    showToast(title, description, 'error');
  }, [showToast]);

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString();
  }, []);

  // Event handlers
  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await ApiService.deleteComponent(component.componentName, true);
      showToast(
        'Component Deleted Successfully', 
        `${component.componentName} has been permanently removed from the inventory`,
        'success'
      );
      
      if (onDelete) {
        await onDelete(component.componentName);
      }
      onBack();
    } catch (error) {
      showErrorToast(error, 'Error deleting component');
    } finally {
      setIsDeleting(false);
    }
  }, [component.componentName, onDelete, onBack, showToast, showErrorToast]);

  const handleEditSubmit = useCallback(async (editedComponent: ComponentCreate) => {
    try {
      const originalComponentName = component.componentName;
      const componentData = {
        ...editedComponent,
        componentName: editedComponent.componentName,
      };

      const updatedComponent = (await ApiService.updateComponent(componentData, originalComponentName)) as Component;
      showToast(
        'Component Updated Successfully',
        `${editedComponent.componentName} details have been saved`,
        'success'
      );

      if (onEdit) {
        await onEdit(updatedComponent);
      }
      onClose();
    } catch (error) {
      showErrorToast(error, 'Error updating component');
    }
  }, [component.componentName, onEdit, onClose, showToast, showErrorToast]);

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHourlyRateInput(value);
    setHourlyRateError(null);
  };

  const handleHourlyRateBlur = () => {
    if (!hourlyRateInput) {
      setHourlyRateError('Hourly rate is required.');
    } else if (isNaN(parseFloat(hourlyRateInput))) {
      setHourlyRateError('Please enter a valid number.');
    } else if (parseFloat(hourlyRateInput) <= 0) {
      setHourlyRateError('Hourly rate must be positive.');
    }
  };

  const handleCalculateCost = useCallback(async () => {
    if (!hourlyRateInput) {
      setHourlyRateError('Hourly rate is required.');
      return;
    }

    if (isNaN(parseFloat(hourlyRateInput))) {
      setHourlyRateError('Please enter a valid number.');
      return;
    }

    if (parseFloat(hourlyRateInput) <= 0) {
      setHourlyRateError('Hourly rate must be positive.');
      return;
    }

    setIsCalculatingCost(true);
    try {
      const data = await ApiService.getComponentTotalCost(component.componentName, hourlyRate);
      setAnalyticsData(data);
      showToast('Cost Calculated Successfully', 'Total cost and production time calculated.', 'success');
    } catch (error) {
      showErrorToast(error, 'Error calculating cost');
    } finally {
      setIsCalculatingCost(false);
    }
  }, [hourlyRateInput, component.componentName, hourlyRate, showToast, showErrorToast]);

  // Auto-calculate cost on component mount with default hourly rate
  useEffect(() => {
    const calculateInitialCost = async () => {
      setIsCalculatingCost(true);
      try {
        const data = await ApiService.getComponentTotalCost(component.componentName, 18.5);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error calculating initial cost:', error);
        // Don't show error toast on initial load, just log it
      } finally {
        setIsCalculatingCost(false);
      }
    };

    calculateInitialCost();
  }, [component.componentName]);

  // Render helpers
  const renderStatCard = (label: string, value: string | number, unit?: string) => (
    <Stat>
      <StatLabel color={textColorSecondary}>
        <Text>{label}</Text>
      </StatLabel>
      <StatNumber fontSize="md" color={textColor} noOfLines={1}>
        {value}{unit ? ` ${unit}` : ''}
      </StatNumber>
    </Stat>
  );

  const renderInfoItem = (icon: React.ReactNode, label: string, value: string) => (
    <HStack>
      {icon}
      <VStack align="start" spacing={0}>
        <Text fontSize="sm" color={textColorSecondary}>
          {label}
        </Text>
        <Text fontSize="md" fontWeight="bold" color={textColor}>
          {value}
        </Text>
      </VStack>
    </HStack>
  );

  return (
    <Box minH="100vh" bg={bgColor} p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Button
          leftIcon={<BackIcon />}
          variant="ghost"
          onClick={onBack}
          size="lg"
          color={textColor}
          _hover={{ bg: useColorModeValue('gray.100', 'whiteAlpha.100') }}
        >
          Back to Inventory
        </Button>

        <HStack spacing={3}>
          <Button
            leftIcon={<EditIcon />}
            colorScheme="blue"
            onClick={onOpen}
            size="md"
          >
            Edit Component
          </Button>
          <Button
            leftIcon={<DeleteIcon />}
            colorScheme="red"
            onClick={handleDelete}
            size="md"
            isLoading={isDeleting}
            loadingText="Deleting..."
          >
            Delete
          </Button>
        </HStack>
      </Flex>

      {/* Main Content */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Component Info Card */}
        <Card bg={cardBg} gridColumn={{ base: 1, lg: '1 / 3' }} shadow="sm">
          <CardBody>
            <VStack align="start" spacing={6}>
              {/* Title and Type */}
              <Flex justify="space-between" align="start" w="100%">
                <VStack align="start" spacing={2}>
                  <Heading size="xl" color={textColor}>
                    {component.componentName}
                  </Heading>
                  <HStack spacing={3}>
                    <Badge
                      colorScheme={getTypeColor(component.type)}
                      px={3}
                      py={1}
                      borderRadius="full"
                      textTransform="capitalize"
                    >
                      {component.type}
                    </Badge>
                    {isLowStock && (
                      <Badge
                        colorScheme="red"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        Low Stock
                      </Badge>
                    )}
                  </HStack>
                </VStack>

                <VStack align="end" spacing={1}>
                  <Text fontSize="sm" color={textColorSecondary}>
                    Current Stock
                  </Text>
                  <Heading size="lg" color={isLowStock ? 'red.500' : textColor}>
                    {component.amount} {component.measure}
                  </Heading>
                </VStack>
              </Flex>

              <Divider borderColor={borderColor} />

              {/* Key Stats */}
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} w="100%">
                {renderStatCard('Unit Cost', `€${component.cost}`)}
                {renderStatCard('Min. Amount', component.triggerMinAmount)}
                {renderStatCard('Supplier', component.supplier || 'Not specified')}
                {renderStatCard('Production Time', component.durationOfDevelopment, 'hours')}
              </SimpleGrid>

              <Divider borderColor={borderColor} />

              {/* Additional Info */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                {renderInfoItem(
                  <PersonIcon size="20px" color={textColorSecondary} />,
                  'Last Scanned By',
                  component.scannedBy
                )}
                {renderInfoItem(
                  <TimeIcon size="20px" color={textColorSecondary} />,
                  'Last Scanned',
                  formatDateTime(component.lastScanned)
                )}
              </SimpleGrid>

              {/* Description */}
              {component.description && (
                <>
                  <Divider borderColor={borderColor} />
                  <VStack align="start" spacing={3} w="100%">
                    <Text fontSize="lg" fontWeight="600" color={textColor}>
                      Description
                    </Text>
                    <Text
                      color={textColorSecondary}
                      lineHeight="1.6"
                      whiteSpace="pre-wrap"
                    >
                      {component.description}
                    </Text>
                  </VStack>
                </>
              )}
              <Divider borderColor={borderColor} />

              {/* Analytics */}
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="600" color={textColor}>
                  Cost Analytics
                </Text>
                
                <FormControl isInvalid={Boolean(hourlyRateError)}>
                  <FormLabel color={textColor} fontSize="sm" fontWeight="500">
                    Hourly Rate (EUR)
                  </FormLabel>
                  <HStack spacing={3}>
                    <Input
                      type="text"
                      value={hourlyRateInput}
                      onChange={handleHourlyRateChange}
                      onBlur={handleHourlyRateBlur}
                      placeholder="18.5"
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      size="sm"
                      maxW="120px"
                      _placeholder={{ color: textColorSecondary }}
                    />
                    <Button
                      onClick={handleCalculateCost}
                      colorScheme="blue"
                      size="sm"
                      isLoading={isCalculatingCost}
                      loadingText="Calculating..."
                      isDisabled={!hourlyRate || Boolean(hourlyRateError)}
                    >
                      Recalculate
                    </Button>
                  </HStack>
                  {hourlyRateError && (
                    <FormErrorMessage fontSize="xs">{hourlyRateError}</FormErrorMessage>
                  )}
                  <FormHelperText fontSize="xs" color={textColorSecondary}>
                    Default rate is €18.5/hr. Change the rate and click "Recalculate" to update the cost analysis.
                  </FormHelperText>
                </FormControl>

                {(analyticsData || isCalculatingCost) && (
                  <Box
                    p={4}
                    bg={analyticsBg}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={analyticsBorderColor}
                  >
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="md" fontWeight="600" color={analyticsTextColor}>
                          Cost Analysis Results
                        </Text>
                        {isCalculatingCost && (
                          <Text fontSize="xs" color={textColorSecondary}>
                            Calculating...
                          </Text>
                        )}
                      </HStack>
                      
                      {isCalculatingCost ? (
                        <Flex justify="center" align="center" minH="100px">
                          <Text color={textColorSecondary}>
                            Calculating cost breakdown...
                          </Text>
                        </Flex>
                      ) : analyticsData ? (
                        <>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color={textColorSecondary} fontWeight="500">
                                MATERIAL COST
                              </Text>
                              <Text fontSize="lg" fontWeight="700" color={textColor}>
                                €{analyticsData.material_cost?.toFixed(2) || '0.00'}
                              </Text>
                            </VStack>
                            
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color={textColorSecondary} fontWeight="500">
                                LABOR COST
                              </Text>
                              <Text fontSize="lg" fontWeight="700" color={textColor}>
                                €{analyticsData.labor_cost?.toFixed(2) || '0.00'}
                              </Text>
                            </VStack>
                            
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color={textColorSecondary} fontWeight="500">
                                TOTAL COST
                              </Text>
                              <Text fontSize="xl" fontWeight="800" color={totalCostColor}>
                                €{analyticsData.total_cost?.toFixed(2) || '0.00'}
                              </Text>
                            </VStack>
                            
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color={textColorSecondary} fontWeight="500">
                                HOURLY RATE USED
                              </Text>
                              <Text fontSize="lg" fontWeight="700" color={textColor}>
                                €{analyticsData.hourly_rate?.toFixed(2) || '0.00'}/hr
                              </Text>
                            </VStack>
                          </SimpleGrid>
                          
                          {analyticsData.total_development_time && (
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color={textColorSecondary} fontWeight="500">
                                TOTAL PRODUCTION TIME
                              </Text>
                              <Text fontSize="md" fontWeight="600" color={textColor}>
                                {analyticsData.total_development_time} hours
                              </Text>
                            </VStack>
                          )}
                        </>
                      ) : null}
                    </VStack>
                  </Box>
                )}
              </VStack>

              <Divider borderColor={borderColor} />

            </VStack>
          </CardBody>
        </Card>

        {/* Image Card */}
        {component.image && (
          <Card bg={cardBg} shadow="sm">
            <CardBody>
              <VStack spacing={4}>
                <Text fontSize="lg" fontWeight="600" color={textColor}>
                  Component Image
                </Text>
                <Box
                  borderRadius="lg"
                  overflow="hidden"
                  border="1px solid"
                  borderColor={borderColor}
                  w="100%"
                  bg={imageBg}
                >
                  <Image
                    src={component.image}
                    alt={`${component.componentName} image`}
                    w="100%"
                    maxH="400px"
                    objectFit="contain"
                    fallback={
                      <Flex
                        h="200px"
                        align="center"
                        justify="center"
                        bg={fallbackBg}
                      >
                        <Text color={textColorSecondary}>
                          Image not available
                        </Text>
                      </Flex>
                    }
                  />
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}
      </SimpleGrid>

      <ComponentDialog
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleEditSubmit}
        component={component as ComponentCreate}
        mode="edit"
      />
    </Box>
  );
}
