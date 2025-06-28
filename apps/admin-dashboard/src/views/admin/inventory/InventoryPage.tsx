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
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { ApiService } from '../../../services/service';
import { MdAdd } from 'react-icons/md';
import InventoryComponent from './InventoryComponent';
import { ComponentDialog } from '../../../components/flowchart/componentDialog';
import { useSearch } from '../../../contexts/SearchContext';

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
  const bgColor = useColorModeValue('white', 'gray.700');

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

  if (loading) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Text>Loading Inventory...</Text>
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
          <Flex justify="space-between" align="center" mb={6}>
            <VStack align="start" spacing={2}>
              <Heading size="lg">Components Inventory</Heading>
              {searchQuery && (
                <Text color="gray.500" fontSize="sm">
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
              _hover={{ transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              Add Component
            </Button>
          </Flex>

          {filteredInventory.length === 0 && searchQuery ? (
            <Box textAlign="center" py={10}>
              <Text fontSize="lg" color="gray.500">
                No components found matching "{searchQuery}"
              </Text>
              <Text fontSize="sm" color="gray.400" mt={2}>
                Try adjusting your search terms or clear the search to see all components.
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredInventory.map((item: Component) => (
                <Box
                  key={item.componentName}
                  onClick={() => handleItemClick(item)}
                  borderWidth="1px"
                  borderRadius="lg"
                  p={6}
                  cursor="pointer"
                  bg={bgColor}
                  _hover={{
                    transform: 'translateY(-4px)',
                    shadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  <VStack align="stretch" spacing={4}>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">{item.componentName}</Heading>
                      <Text
                        px={3}
                        py={1}
                        borderRadius="full"
                        bg={
                          item.amount < item.triggerMinAmount
                            ? 'red.100'
                            : 'green.100'
                        }
                        color={
                          item.amount < item.triggerMinAmount
                            ? 'red.700'
                            : 'green.700'
                        }
                        fontSize="sm"
                        fontWeight="medium"
                      >
                        {item.type}
                      </Text>
                    </Flex>

                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text color="gray.500" fontSize="sm">
                          Amount
                        </Text>
                        <Text fontWeight="bold">
                          {item.amount} {item.measure}
                        </Text>
                      </Box>
                      <Box>
                        <Text color="gray.500" fontSize="sm">
                          Cost
                        </Text>
                        <Text fontWeight="bold">€{item.cost}</Text>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                </Box>
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
