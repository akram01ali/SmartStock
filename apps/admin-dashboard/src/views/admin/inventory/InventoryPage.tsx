import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  useColorModeValue,
  Flex,
  Icon,
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
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { ApiService } from '../../../services/service';
import { MdAdd, MdInventory, MdWarning, MdTrendingUp, MdAttachMoney } from 'react-icons/md';
import InventoryComponent from './InventoryComponent';
import { ComponentDialog } from '../../../components/flowchart/componentDialog';
import { useSearch } from '../../../contexts/SearchContext';
import Card from 'components/card/Card';

interface Component {
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
  onSubmit: (componentData: Component) => Promise<void>;
  component?: Component | null; // Component being edited, if any
  mode: 'create' | 'edit'; // Dialog mode
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null,
  );
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

  // Filter inventory based on search query
  const filteredInventory = inventory.filter((component) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      component.componentName.toLowerCase().includes(query) ||
      component.type.toLowerCase().includes(query) ||
      component.supplier.toLowerCase().includes(query) ||
      component.scannedBy.toLowerCase().includes(query)
    );
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

  const handleAddComponent = async (componentData: Component) => {
    try {
      await ApiService.createComponent(componentData);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'printer': return 'blue';
      case 'group': return 'purple';
      case 'assembly': return 'green';
      case 'component': return 'orange';
      default: return 'gray';
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'printer': return 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)';
      case 'group': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'assembly': return 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)';
      case 'component': return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
      default: return 'linear-gradient(135deg, #718096 0%, #4a5568 100%)';
    }
  };

  if (loading) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Flex justify="center" align="center" minH="200px">
          <VStack spacing={4}>
            <Icon as={MdInventory} w="48px" h="48px" color={brandColor} />
            <Text fontSize="lg" color={textColorSecondary}>Loading Inventory...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {selectedComponent ? (
        <InventoryComponent
          component={selectedComponent}
          onBack={handleBackToList}
          onEdit={handleEditComponent}
          onDelete={handleDeleteComponent}
        />
      ) : (
        <Box>
          {/* Header with Stats */}
          <Flex justify="space-between" align="center" mb={6}>
            <VStack align="start" spacing={2}>
              <Heading size="lg" color={textColor}>Components Inventory</Heading>
              {searchQuery && (
                <Text color={textColorSecondary} fontSize="sm">
                  Showing {filteredInventory.length} of {inventory.length} components
                  {searchQuery && ` matching "${searchQuery}"`}
                </Text>
              )}
            </VStack>
            <Button
              leftIcon={<MdAdd />}
              colorScheme="blue"
              size="lg"
              onClick={onOpen}
              boxShadow={cardShadow}
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: '0px 20px 60px rgba(112, 144, 176, 0.25)'
              }}
              transition="all 0.3s ease"
            >
              Add Component
            </Button>
          </Flex>

          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            <Card boxShadow={cardShadow}>
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
                  <Icon as={MdInventory} w="24px" h="24px" color="white" />
                </Box>
              </Flex>
            </Card>

            <Card boxShadow={cardShadow}>
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
                  <Icon as={MdWarning} w="24px" h="24px" color="white" />
                </Box>
              </Flex>
            </Card>

            <Card boxShadow={cardShadow}>
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
                  <Icon as={MdAttachMoney} w="24px" h="24px" color="white" />
                </Box>
              </Flex>
            </Card>
          </SimpleGrid>

          {/* Inventory Grid */}
          {filteredInventory.length === 0 && searchQuery ? (
            <Card boxShadow={cardShadow} p={10}>
              <VStack spacing={4}>
                <Icon as={MdInventory} w="48px" h="48px" color="gray.400" />
                <Text fontSize="lg" color="gray.500" textAlign="center">
                  No components found matching "{searchQuery}"
                </Text>
                <Text fontSize="sm" color="gray.400" textAlign="center">
                  Try adjusting your search terms or clear the search to see all components.
                </Text>
              </VStack>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
              {filteredInventory.map((item: Component) => (
                <Card
                  key={item.componentName}
                  onClick={() => handleItemClick(item)}
                  cursor="pointer"
                  boxShadow={cardShadow}
                  position="relative"
                  overflow="hidden"
                  _hover={{
                    transform: 'translateY(-8px)',
                    transition: 'all 0.3s ease',
                    boxShadow: '0px 20px 60px rgba(112, 144, 176, 0.25)',
                  }}
                  transition="all 0.3s ease"
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
                </Card>
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
        </Box>
      )}
    </Box>
  );
}
