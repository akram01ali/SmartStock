import React, { useEffect, useState, useCallback } from 'react';
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
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';

import { ApiService } from '../../../services/service';
import InventoryComponent from './InventoryComponent';
import InventoryCard from '../../../components/inventory/InventoryCard';
import {
  Measures,
  TypeOfComponent,
} from '../../../components/graph/types';
import SmoothCard from 'components/card/MotionCard';
import SmoothMotionBox, {
  fadeIn,
  slideInFromLeft,
} from 'components/transitions/MotionBox';
import {
  BackIcon,
  WarningIcon,
} from '../../../components/common/IconWrapper';

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

interface LowStockViewProps {
  onBack: () => void;
  onEdit: (component: Component) => Promise<void>;
  onDelete: (componentName: string) => Promise<void>;
  typeFilter: 'all' | TypeOfComponent;
}

// Constants
const TOAST_DURATION = 3000;

const TYPE_GRADIENTS = {
  [TypeOfComponent.Printer]: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)',
  [TypeOfComponent.Group]: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  [TypeOfComponent.Assembly]: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
  [TypeOfComponent.Component]: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
} as const;

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #718096 0%, #4a5568 100%)';

export default function LowStockView({ onBack, onEdit, onDelete, typeFilter }: LowStockViewProps) {
  // State
  const [lowStockComponents, setLowStockComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const toast = useToast();

  // Color mode values
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'white');
  const cardShadow = useColorModeValue(
    '0px 18px 40px rgba(112, 144, 176, 0.12)',
    'unset',
  );
  const brandColor = useColorModeValue('brand.500', 'white');
  const imageFallbackBg = useColorModeValue('gray.100', 'gray.600');

  // Utility functions
  const getTypeGradient = useCallback((type: TypeOfComponent) => {
    return TYPE_GRADIENTS[type] || DEFAULT_GRADIENT;
  }, []);

  const showToast = useCallback((title: string, description: string, status: 'success' | 'error') => {
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

  // API functions
  const fetchLowStockComponents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use the new low-stock endpoint
      const components = await ApiService.getLowStockComponents() as Component[];
      
      // Apply type filter if needed
      const filteredComponents = typeFilter === 'all' 
        ? components 
        : components.filter(component => component.type === typeFilter);
      
      setLowStockComponents(filteredComponents);
      
      showToast(
        'Low Stock Components Loaded',
        `Found ${filteredComponents.length} component(s) below minimum stock level`,
        'success'
      );
    } catch (error) {
      console.error('Error fetching low stock components:', error);
      showErrorToast(error, 'Error loading low stock components');
      setLowStockComponents([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, showToast, showErrorToast]);

  // Event handlers
  const handleItemClick = useCallback(async (item: Component) => {
    if (!item.image) {
      try {
        const fullComponent = await ApiService.getComponent(item.componentName);
        setSelectedComponent(fullComponent);
      } catch (error) {
        console.error('Error fetching full component:', error);
        setSelectedComponent(item);
      }
    } else {
      setSelectedComponent(item);
    }
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedComponent(null);
  }, []);

  const handleEditComponent = useCallback(async (updatedComponent: Component) => {
    try {
      await onEdit(updatedComponent);
      // Refresh the low stock list after edit
      await fetchLowStockComponents();
      setSelectedComponent(null);
    } catch (error) {
      console.error('Error editing component:', error);
    }
  }, [onEdit, fetchLowStockComponents]);

  const handleDeleteComponent = useCallback(async (componentName: string) => {
    try {
      await onDelete(componentName);
      // Refresh the low stock list after delete
      await fetchLowStockComponents();
      setSelectedComponent(null);
    } catch (error) {
      console.error('Error deleting component:', error);
    }
  }, [onDelete, fetchLowStockComponents]);

  // Effects
  useEffect(() => {
    fetchLowStockComponents();
  }, [fetchLowStockComponents]);

  // Loading state
  if (loading) {
    return (
      <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }} variants={fadeIn}>
        <Flex justify="center" align="center" minH="200px">
          <VStack spacing={4}>
            <Spinner size="xl" color={brandColor} thickness="4px" />
            <Text fontSize="lg" color={textColorSecondary}>
              Loading Low Stock Components...
            </Text>
          </VStack>
        </Flex>
      </SmoothMotionBox>
    );
  }

  return (
    <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <AnimatePresence mode="wait">
        {selectedComponent ? (
          <SmoothMotionBox key="component-detail" variants={slideInFromLeft}>
            <InventoryComponent
              component={selectedComponent}
              onBack={handleBackToList}
              onEdit={handleEditComponent}
              onDelete={handleDeleteComponent}
            />
          </SmoothMotionBox>
        ) : (
          <SmoothMotionBox key="low-stock-list">
            {/* Header */}
            <Flex justify="space-between" align="center" mb={6}>
              <VStack align="start" spacing={2}>
                <Flex align="center" gap={3}>
                  <WarningIcon size="28px" color="red.500" />
                  <Heading size="lg" color={textColor}>
                    Low Stock Alert
                  </Heading>
                  <Badge colorScheme="red" px={3} py={1} borderRadius="full">
                    {lowStockComponents.length} Items
                  </Badge>
                </Flex>
                <Text color={textColorSecondary} fontSize="md">
                  Components below their minimum stock threshold
                  {typeFilter !== 'all' && ` (${typeFilter} type only)`}
                </Text>
              </VStack>
              <Button
                leftIcon={<BackIcon size="16px" />}
                colorScheme="gray"
                variant="outline"
                size="lg"
                onClick={onBack}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                transition="all 0.2s"
              >
                Back to Inventory
              </Button>
            </Flex>

            {/* Low Stock Grid */}
            {lowStockComponents.length === 0 ? (
              <SmoothCard boxShadow={cardShadow} p={10}>
                <VStack spacing={4}>
                  <WarningIcon size="48px" color="green.400" />
                  <Text fontSize="lg" color="green.500" textAlign="center" fontWeight="bold">
                    Great! No Low Stock Items
                  </Text>
                  <Text fontSize="sm" color={textColorSecondary} textAlign="center">
                    All components are above their minimum stock levels
                    {typeFilter !== 'all' && ` for ${typeFilter} type`}.
                  </Text>
                </VStack>
              </SmoothCard>
            ) : (
              <>
                {/* Summary Card */}
                <SmoothCard boxShadow={cardShadow} p={6} mb={6} bg="red.50" borderColor="red.200" borderWidth="1px">
                  <Flex align="center" gap={4}>
                    <Box bg="linear-gradient(135deg, #F56565 0%, #E53E3E 100%)" borderRadius="20px" p="15px">
                      <WarningIcon size="24px" color="white" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color="red.700">
                        {lowStockComponents.length} Component{lowStockComponents.length !== 1 ? 's' : ''} Need Restocking
                      </Text>
                      <Text fontSize="sm" color="red.600">
                        These items are below their configured minimum stock levels and may need immediate attention.
                      </Text>
                    </VStack>
                  </Flex>
                </SmoothCard>

                {/* Components Grid */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                  {lowStockComponents.map((item, index) => (
                    <InventoryCard
                      key={item.componentName}
                      item={item}
                      index={index}
                      onItemClick={handleItemClick}
                      getTypeGradient={getTypeGradient}
                      textColor={textColor}
                      textColorSecondary={textColorSecondary}
                      cardShadow={cardShadow}
                      imageFallbackBg={imageFallbackBg}
                    />
                  ))}
                </SimpleGrid>
              </>
            )}
          </SmoothMotionBox>
        )}
      </AnimatePresence>
    </SmoothMotionBox>
  );
} 