import React, { useState, useCallback } from 'react';
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

  // Computed values
  const isLowStock = component.amount < component.triggerMinAmount;

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
      const componentData = {
        ...editedComponent,
        componentName: component.componentName,
      };

      const updatedComponent = (await ApiService.updateComponent(componentData)) as Component;
      showToast(
        'Component Updated Successfully',
        `${component.componentName} details have been saved`,
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
                {renderStatCard('Dev. Time', component.durationOfDevelopment, 'hours')}
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
