import React from 'react';
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  HStack,
} from '@chakra-ui/react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { ApiService } from '../../../services/service';
import InventoryComponent from './InventoryComponent';
import InventoryCard from '../../../components/inventory/InventoryCard';
import { ComponentDialog } from '../../../components/graph/componentDialog';
import {
  ComponentCreate,
  Measures,
  TypeOfComponent,
} from '../../../components/graph/types';
import { useSearch } from '../../../contexts/SearchContext';
import SmoothCard from 'components/card/MotionCard';
import SmoothMotionBox, {
  fadeIn,
  slideInFromLeft,
} from 'components/transitions/MotionBox';
import { AnimatePresence } from 'framer-motion';
import {
  AddIcon,
  InventoryIcon,
  WarningIcon,
  MoneyIcon,
} from '../../../components/common/IconWrapper';

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

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null,
  );
  const [typeFilter, setTypeFilter] = useState<'all' | TypeOfComponent>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { searchQuery, setSearchQuery } = useSearch();
  const toast = useToast();

  // Chakra Color Mode
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'white');
  const cardShadow = useColorModeValue(
    '0px 18px 40px rgba(112, 144, 176, 0.12)',
    'unset',
  );
  const brandColor = useColorModeValue('brand.500', 'white');
  const imageFallbackBg = useColorModeValue('gray.100', 'gray.600');

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      // Use lightweight endpoint for better performance
      const data = await ApiService.getAllComponentsLight();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error fetching inventory',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    return () => {
      setSearchQuery('');
    };
  }, [setSearchQuery]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((component) => {
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        matchesSearch =
          component.componentName.toLowerCase().includes(query) ||
          component.type.toLowerCase().includes(query) ||
          component.supplier.toLowerCase().includes(query) ||
          component.scannedBy.toLowerCase().includes(query);
      }

      let matchesType = true;
      if (typeFilter !== 'all') {
        matchesType = component.type === typeFilter;
      }

      return matchesSearch && matchesType;
    });
  }, [inventory, searchQuery, typeFilter]);

  const statistics = useMemo(() => {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(
      (item) => item.amount < item.triggerMinAmount,
    ).length;
    const totalValue = inventory.reduce(
      (sum, item) => sum + item.cost * item.amount,
      0,
    );
    return { totalItems, lowStockItems, totalValue };
  }, [inventory]);

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

  const handleAddComponent = useCallback(
    async (componentData: ComponentCreate) => {
      try {
        await ApiService.createComponent(componentData, 'root');
        toast({
          title: 'Component created',
          description: `${componentData.componentName} has been added to inventory.`,
          status: 'success',
          duration: 3000,
        });
        onClose();
        fetchInventory();
      } catch (error) {
        console.error('Error creating component:', error);
        toast({
          title: 'Error creating component',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 3000,
        });
      }
    },
    [toast, onClose, fetchInventory],
  );

  const handleEditComponent = useCallback(
    async (updatedComponent: Component) => {
      try {
        await ApiService.updateComponent(updatedComponent);
        toast({
          title: 'Component updated',
          description: `${updatedComponent.componentName} has been updated.`,
          status: 'success',
          duration: 3000,
        });
        fetchInventory();
        setSelectedComponent(null);
      } catch (error) {
        console.error('Error updating component:', error);
        toast({
          title: 'Error updating component',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 3000,
        });
      }
    },
    [toast, fetchInventory],
  );

  const handleDeleteComponent = useCallback(
    async (componentName: string) => {
      try {
        await ApiService.deleteComponent(componentName, true);
        toast({
          title: 'Component deleted',
          description: `${componentName} has been removed from inventory.`,
          status: 'success',
          duration: 3000,
        });
        fetchInventory();
        setSelectedComponent(null);
      } catch (error) {
        console.error('Error deleting component:', error);
        toast({
          title: 'Error deleting component',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 3000,
        });
      }
    },
    [toast, fetchInventory],
  );


  const getTypeGradient = useCallback((type: TypeOfComponent) => {
    switch (type) {
      case TypeOfComponent.Printer:
        return 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)';
      case TypeOfComponent.Group:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case TypeOfComponent.Assembly:
        return 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)';
      case TypeOfComponent.Component:
        return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
      default:
        return 'linear-gradient(135deg, #718096 0%, #4a5568 100%)';
    }
  }, []);

  if (loading) {
    return (
      <SmoothMotionBox
        pt={{ base: '130px', md: '80px', xl: '80px' }}
        variants={fadeIn}
      >
        <Flex justify="center" align="center" minH="200px">
          <VStack spacing={4}>
            <InventoryIcon size="48px" color={brandColor} />
            <Text fontSize="lg" color={textColorSecondary}>
              Loading Inventory...
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
          <SmoothMotionBox key="inventory-list">
            {/* Header with Stats */}
            <Flex justify="space-between" align="center" mb={6}>
              <VStack align="start" spacing={2}>
                <Heading size="lg" color={textColor}>
                  Components Inventory
                </Heading>
                {(searchQuery || typeFilter !== 'all') && (
                  <Text color={textColorSecondary} fontSize="sm">
                    Showing {filteredInventory.length} of {inventory.length}{' '}
                    components
                    {searchQuery && ` matching "${searchQuery}"`}
                    {typeFilter !== 'all' && ` filtered by "${typeFilter}"`}
                  </Text>
                )}
              </VStack>
              <Button
                leftIcon={<AddIcon size="16px" />}
                colorScheme="blue"
                size="lg"
                onClick={onOpen}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                transition="all 0.2s"
              >
                Add Component
              </Button>
            </Flex>

            {/* Statistics Cards */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
              <SmoothCard boxShadow={cardShadow}>
                <Flex align="center" justify="space-between">
                  <Stat>
                    <StatLabel color={textColorSecondary}>
                      Total Items
                    </StatLabel>
                    <StatNumber color={textColor}>
                      {statistics.totalItems}
                    </StatNumber>
                    <StatHelpText color={textColorSecondary}>
                      Components in stock
                    </StatHelpText>
                  </Stat>
                  <Box
                    bg="linear-gradient(135deg, #868CFF 0%, #4318FF 100%)"
                    borderRadius="20px"
                    p="15px"
                  >
                    <InventoryIcon size="24px" color="white" />
                  </Box>
                </Flex>
              </SmoothCard>

              <SmoothCard boxShadow={cardShadow}>
                <Flex align="center" justify="space-between">
                  <Stat>
                    <StatLabel color={textColorSecondary}>
                      Low Stock Alert
                    </StatLabel>
                    <StatNumber
                      color={
                        statistics.lowStockItems > 0 ? 'red.500' : textColor
                      }
                    >
                      {statistics.lowStockItems}
                    </StatNumber>
                    <StatHelpText color={textColorSecondary}>
                      Items below minimum
                    </StatHelpText>
                  </Stat>
                  <Box
                    bg={
                      statistics.lowStockItems > 0
                        ? 'linear-gradient(135deg, #F56565 0%, #E53E3E 100%)'
                        : 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)'
                    }
                    borderRadius="20px"
                    p="15px"
                  >
                    <WarningIcon size="24px" color="white" />
                  </Box>
                </Flex>
              </SmoothCard>

              <SmoothCard boxShadow={cardShadow}>
                <Flex align="center" justify="space-between">
                  <Stat>
                    <StatLabel color={textColorSecondary}>
                      Total Value
                    </StatLabel>
                    <StatNumber color={textColor}>
                      €{statistics.totalValue.toFixed(2)}
                    </StatNumber>
                    <StatHelpText color={textColorSecondary}>
                      Inventory worth
                    </StatHelpText>
                  </Stat>
                  <Box
                    bg="linear-gradient(135deg, #48BB78 0%, #38A169 100%)"
                    borderRadius="20px"
                    p="15px"
                  >
                    <MoneyIcon size="24px" color="white" />
                  </Box>
                </Flex>
              </SmoothCard>
            </SimpleGrid>

            {/* Type Filter Buttons */}
            <Box mb={6}>
              <Text
                color={textColorSecondary}
                fontSize="sm"
                mb={3}
                fontWeight="500"
              >
                Filter by Type:
              </Text>
              <HStack spacing={3} flexWrap="wrap">
                <Button
                  size="sm"
                  variant={typeFilter === 'all' ? 'solid' : 'outline'}
                  colorScheme="gray"
                  onClick={() => setTypeFilter('all')}
                >
                  All ({inventory.length})
                </Button>
                <Button
                  size="sm"
                  variant={
                    typeFilter === TypeOfComponent.Component
                      ? 'solid'
                      : 'outline'
                  }
                  colorScheme="orange"
                  onClick={() => setTypeFilter(TypeOfComponent.Component)}
                >
                  Components (
                  {
                    inventory.filter(
                      (item) => item.type === TypeOfComponent.Component,
                    ).length
                  }
                  )
                </Button>
                <Button
                  size="sm"
                  variant={
                    typeFilter === TypeOfComponent.Assembly
                      ? 'solid'
                      : 'outline'
                  }
                  colorScheme="green"
                  onClick={() => setTypeFilter(TypeOfComponent.Assembly)}
                >
                  Assemblies (
                  {
                    inventory.filter(
                      (item) => item.type === TypeOfComponent.Assembly,
                    ).length
                  }
                  )
                </Button>
                <Button
                  size="sm"
                  variant={
                    typeFilter === TypeOfComponent.Group ? 'solid' : 'outline'
                  }
                  colorScheme="purple"
                  onClick={() => setTypeFilter(TypeOfComponent.Group)}
                >
                  Groups (
                  {
                    inventory.filter(
                      (item) => item.type === TypeOfComponent.Group,
                    ).length
                  }
                  )
                </Button>
                <Button
                  size="sm"
                  variant={
                    typeFilter === TypeOfComponent.Printer ? 'solid' : 'outline'
                  }
                  colorScheme="blue"
                  onClick={() => setTypeFilter(TypeOfComponent.Printer)}
                >
                  Printers (
                  {
                    inventory.filter(
                      (item) => item.type === TypeOfComponent.Printer,
                    ).length
                  }
                  )
                </Button>
              </HStack>
            </Box>

            {/* Inventory Grid */}
            {filteredInventory.length === 0 && searchQuery ? (
              <SmoothCard boxShadow={cardShadow} p={10}>
                <VStack spacing={4}>
                  <InventoryIcon size="48px" color="gray.400" />
                  <Text fontSize="lg" color="gray.500" textAlign="center">
                    No components found matching "{searchQuery}"
                  </Text>
                  <Text fontSize="sm" color="gray.400" textAlign="center">
                    Try adjusting your search terms or clear the search to see
                    all components.
                  </Text>
                </VStack>
              </SmoothCard>
            ) : (
              <SimpleGrid
                columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
                spacing={6}
              >
                {filteredInventory.map((item: Component, index: number) => (
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
            )}

            <ComponentDialog
              isOpen={isOpen}
              onClose={onClose}
              onSubmit={handleAddComponent}
              component={null} 
              mode="create" 
            />
          </SmoothMotionBox>
        )}
      </AnimatePresence>
    </SmoothMotionBox>
  );
}
