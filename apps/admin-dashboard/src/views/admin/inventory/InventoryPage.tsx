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
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  HStack,
  Image,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { ApiService } from '../../../services/service';
import { MdAdd, MdInventory, MdWarning, MdTrendingUp, MdAttachMoney } from 'react-icons/md';
import InventoryComponent from './InventoryComponent';
import { ComponentDialog } from '../../../components/graph/componentDialog';
import { ComponentCreate, Measures, TypeOfComponent } from '../../../components/graph/types';
import { useSearch } from '../../../contexts/SearchContext';
import SmoothCard from 'components/card/MotionCard';
import SmoothMotionBox, { fadeIn, slideInFromLeft } from 'components/transitions/MotionBox';
import { AnimatePresence } from 'framer-motion';

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
  const cardShadow = useColorModeValue('0px 18px 40px rgba(112, 144, 176, 0.12)', 'unset');
  const brandColor = useColorModeValue('brand.500', 'white');

  const fetchInventory = async () => {
    try {
      const data = await ApiService.getAllComponents();
      setInventory(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error fetching inventory',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Clear search query when leaving the inventory page
  useEffect(() => {
    return () => {
      setSearchQuery('');
    };
  }, [setSearchQuery]);

  // Filter inventory based on search query and type filter
  const filteredInventory = inventory.filter((component) => {
    // Search filter
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matchesSearch = (
        component.componentName.toLowerCase().includes(query) ||
        component.type.toLowerCase().includes(query) ||
        component.supplier.toLowerCase().includes(query) ||
        component.scannedBy.toLowerCase().includes(query)
      );
    }

    // Type filter
    let matchesType = true;
    if (typeFilter !== 'all') {
      matchesType = component.type === typeFilter;
    }

    return matchesSearch && matchesType;
  });

  // Calculate statistics
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.amount < item.triggerMinAmount).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.cost * item.amount), 0);

  const handleItemClick = (item: Component) => {
    setSelectedComponent(item);
  };

  const handleBackToList = () => {
    setSelectedComponent(null);
  };

  const handleAddComponent = async (componentData: ComponentCreate) => {
    try {
      await ApiService.createComponent(componentData, null);
      toast({
        title: 'Component created',
        status: 'success',
        duration: 3000,
      });
      await fetchInventory();
      onClose();
    } catch (error) {
      toast({
        title: 'Error creating component',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleEditComponent = async (updatedComponent: Component) => {
    try {
      // Update local state with the new data
      setSelectedComponent(updatedComponent);
      // Refresh the full inventory
      await fetchInventory();
    } catch (error) {
      toast({
        title: 'Error refreshing data',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteComponent = async (componentName: string) => {
    try {
      await fetchInventory(); // Refresh the inventory data
    } catch (error) {
      toast({
        title: 'Error refreshing inventory',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getTypeColor = (type: TypeOfComponent) => {
    switch (type) {
      case TypeOfComponent.Printer: return 'blue';
      case TypeOfComponent.Group: return 'purple';
      case TypeOfComponent.Assembly: return 'green';
      case TypeOfComponent.Component: return 'orange';
      default: return 'gray';
    }
  };

  const getTypeGradient = (type: TypeOfComponent) => {
    switch (type) {
      case TypeOfComponent.Printer: return 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)';
      case TypeOfComponent.Group: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case TypeOfComponent.Assembly: return 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)';
      case TypeOfComponent.Component: return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
      default: return 'linear-gradient(135deg, #718096 0%, #4a5568 100%)';
    }
  };

  if (loading) {
    return (
      <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }} variants={fadeIn}>
        <Flex justify="center" align="center" minH="200px">
          <VStack spacing={4}>
            <MdInventory size="48px" color={brandColor} />
            <Text fontSize="lg" color={textColorSecondary}>Loading Inventory...</Text>
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
                <Heading size="lg" color={textColor}>Components Inventory</Heading>
                {(searchQuery || typeFilter !== 'all') && (
                  <Text color={textColorSecondary} fontSize="sm">
                    Showing {filteredInventory.length} of {inventory.length} components
                    {searchQuery && ` matching "${searchQuery}"`}
                    {typeFilter !== 'all' && ` filtered by "${typeFilter}"`}
                  </Text>
                )}
              </VStack>
              <Button
                leftIcon={<MdAdd style={{ fontSize: '16px' }} />}
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
                    <StatLabel color={textColorSecondary}>Total Items</StatLabel>
                    <StatNumber color={textColor}>{totalItems}</StatNumber>
                    <StatHelpText color={textColorSecondary}>Components in stock</StatHelpText>
                  </Stat>
                  <Box
                    bg="linear-gradient(135deg, #868CFF 0%, #4318FF 100%)"
                    borderRadius="20px"
                    p="15px"
                  >
                    <MdInventory size="24px" color="white" />
                  </Box>
                </Flex>
              </SmoothCard>

              <SmoothCard boxShadow={cardShadow}>
                <Flex align="center" justify="space-between">
                  <Stat>
                    <StatLabel color={textColorSecondary}>Low Stock Alert</StatLabel>
                    <StatNumber color={lowStockItems > 0 ? 'red.500' : textColor}>
                      {lowStockItems}
                    </StatNumber>
                    <StatHelpText color={textColorSecondary}>Items below minimum</StatHelpText>
                  </Stat>
                  <Box
                    bg={lowStockItems > 0 ? 'linear-gradient(135deg, #F56565 0%, #E53E3E 100%)' : 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)'}
                    borderRadius="20px"
                    p="15px"
                  >
                    <MdWarning size="24px" color="white" />
                  </Box>
                </Flex>
              </SmoothCard>

              <SmoothCard boxShadow={cardShadow}>
                <Flex align="center" justify="space-between">
                  <Stat>
                    <StatLabel color={textColorSecondary}>Total Value</StatLabel>
                    <StatNumber color={textColor}>€{totalValue.toFixed(2)}</StatNumber>
                    <StatHelpText color={textColorSecondary}>Inventory worth</StatHelpText>
                  </Stat>
                  <Box
                    bg="linear-gradient(135deg, #48BB78 0%, #38A169 100%)"
                    borderRadius="20px"
                    p="15px"
                  >
                    <MdAttachMoney size="24px" color="white" />
                  </Box>
                </Flex>
              </SmoothCard>
            </SimpleGrid>

            {/* Type Filter Buttons */}
            <Box mb={6}>
              <Text color={textColorSecondary} fontSize="sm" mb={3} fontWeight="500">
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
                  variant={typeFilter === TypeOfComponent.Component ? 'solid' : 'outline'}
                  colorScheme="orange"
                  onClick={() => setTypeFilter(TypeOfComponent.Component)}
                >
                  Components ({inventory.filter(item => item.type === TypeOfComponent.Component).length})
                </Button>
                <Button
                  size="sm"
                  variant={typeFilter === TypeOfComponent.Assembly ? 'solid' : 'outline'}
                  colorScheme="green"
                  onClick={() => setTypeFilter(TypeOfComponent.Assembly)}
                >
                  Assemblies ({inventory.filter(item => item.type === TypeOfComponent.Assembly).length})
                </Button>
                <Button
                  size="sm"
                  variant={typeFilter === TypeOfComponent.Group ? 'solid' : 'outline'}
                  colorScheme="purple"
                  onClick={() => setTypeFilter(TypeOfComponent.Group)}
                >
                  Groups ({inventory.filter(item => item.type === TypeOfComponent.Group).length})
                </Button>
                <Button
                  size="sm"
                  variant={typeFilter === TypeOfComponent.Printer ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onClick={() => setTypeFilter(TypeOfComponent.Printer)}
                >
                  Printers ({inventory.filter(item => item.type === TypeOfComponent.Printer).length})
                </Button>
              </HStack>
            </Box>

            {/* Inventory Grid */}
            {filteredInventory.length === 0 && searchQuery ? (
              <SmoothCard boxShadow={cardShadow} p={10}>
                <VStack spacing={4}>
                  <MdInventory size="48px" color="gray.400" />
                  <Text fontSize="lg" color="gray.500" textAlign="center">
                    No components found matching "{searchQuery}"
                  </Text>
                  <Text fontSize="sm" color="gray.400" textAlign="center">
                    Try adjusting your search terms or clear the search to see all components.
                  </Text>
                </VStack>
              </SmoothCard>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                {filteredInventory.map((item: Component, index: number) => (
                  <SmoothCard
                    key={item.componentName}
                    onClick={() => handleItemClick(item)}
                    cursor="pointer"
                    boxShadow={cardShadow}
                    position="relative"
                    overflow="hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: index * 0.1, duration: 0.3 }
                    }}
                  >
                    {/* Card Header with Gradient */}
                    <Box
                      bg={getTypeGradient(item.type)}
                      p={4}
                      borderRadius="20px 20px 0 0"
                      mb={4}
                      position="relative"
                    >
                      <Flex justify="space-between" align="center">
                        <Text color="white" fontSize="lg" fontWeight="bold">
                          {item.componentName}
                        </Text>
                        <Badge 
                          bg="rgba(255, 255, 255, 0.2)" 
                          color="white" 
                          borderRadius="full"
                          px={3}
                          py={1}
                          backdropFilter="blur(10px)"
                        >
                          {item.type}
                        </Badge>
                      </Flex>
                    </Box>

                    {/* Card Content */}
                    <VStack align="stretch" spacing={4} p={4} pt={0}>
                      {/* Image Preview if available */}
                      {item.image && (
                        <Box>
                          <Image
                            src={item.image}
                            alt={`${item.componentName} preview`}
                            h="120px"
                            w="100%"
                            objectFit="cover"
                            borderRadius="md"
                            fallback={
                              <Box
                                h="120px"
                                bg={useColorModeValue('gray.100', 'gray.600')}
                                borderRadius="md"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Text color={textColorSecondary} fontSize="sm">No image</Text>
                              </Box>
                            }
                          />
                        </Box>
                      )}

                      {/* Description Preview if available */}
                      {item.description && (
                        <Box>
                          <Text color={textColorSecondary} fontSize="sm" fontWeight="500" mb={1}>
                            Description
                          </Text>
                          <Text 
                            color={textColor} 
                            fontSize="sm" 
                            noOfLines={2}
                            lineHeight="1.4"
                          >
                            {item.description}
                          </Text>
                        </Box>
                      )}

                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                            Amount
                          </Text>
                          <Text color={textColor} fontWeight="bold" fontSize="lg">
                            {item.amount}
                          </Text>
                          <Text color={textColorSecondary} fontSize="xs">
                            {item.measure}
                          </Text>
                        </Box>
                        <Box>
                          <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                            Cost
                          </Text>
                          <Text color={textColor} fontWeight="bold" fontSize="lg">
                            €{item.cost}
                          </Text>
                          <Text color={textColorSecondary} fontSize="xs">
                            per unit
                          </Text>
                        </Box>
                      </SimpleGrid>

                      {/* Stock Status */}
                      <Box>
                        <HStack justify="space-between" mb={2}>
                          <Text color={textColorSecondary} fontSize="sm">
                            Stock Level
                          </Text>
                          {item.amount < item.triggerMinAmount && (
                            <Badge colorScheme="red" size="sm">
                              Low Stock
                            </Badge>
                          )}
                        </HStack>
                        <Box bg="gray.100" borderRadius="full" h="6px" overflow="hidden">
                          <Box
                            bg={item.amount < item.triggerMinAmount ? 'red.400' : 'green.400'}
                            h="100%"
                            w={`${Math.min((item.amount / item.triggerMinAmount) * 100, 100)}%`}
                            transition="all 0.3s ease"
                          />
                        </Box>
                      </Box>

                      {/* Additional Info */}
                      <VStack align="start" spacing={1}>
                        <Text color={textColorSecondary} fontSize="xs">
                          Supplier: <Text as="span" color={textColor} fontWeight="500">{item.supplier}</Text>
                        </Text>
                        <Text color={textColorSecondary} fontSize="xs">
                          Last scanned: <Text as="span" color={textColor} fontWeight="500">{new Date(item.lastScanned).toLocaleDateString()}</Text>
                        </Text>
                      </VStack>
                    </VStack>
                  </SmoothCard>
                ))}
              </SimpleGrid>
            )}

            <ComponentDialog
              isOpen={isOpen}
              onClose={onClose}
              onSubmit={handleAddComponent}
              component={null} // No component when creating new
              mode="create" // Set to create mode
            />
          </SmoothMotionBox>
        )}
      </AnimatePresence>
    </SmoothMotionBox>
  );
}
