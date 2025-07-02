import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  useColorModeValue,
  Flex,
  Icon,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  FormControl,
  FormLabel,
  VStack,
  useToast,
  useDisclosure,
  HStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../../services/service';
import SmoothCard from 'components/card/MotionCard';
import SmoothMotionBox, { fadeInUp } from 'components/transitions/MotionBox';
import { MdGroups, MdPrint, MdAdd, MdBuild } from 'react-icons/md';
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

export default function ComponentsPage() {
  const [groups, setGroups] = useState<Component[]>([]);
  const [printers, setPrinters] = useState<Component[]>([]);
  const [assemblies, setAssemblies] = useState<Component[]>([]);
  const [formData, setFormData] = useState({
    componentName: '',
    amount: 0,
    measure: 'amount' as 'centimeters' | 'meters' | 'amount',
    lastScanned: new Date().toISOString(),
    scannedBy: '',
    durationOfDevelopment: 0,
    triggerMinAmount: 0,
    supplier: '',
    cost: 0,
  });
  const [createType, setCreateType] = useState<
    'printer' | 'group' | 'assembly' | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { searchQuery, setSearchQuery } = useSearch();

  // Chakra Color Mode
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'white');
  const cardShadow = useColorModeValue(
    '0px 18px 40px rgba(112, 144, 176, 0.12)',
    'unset',
  );
  const iconBg = useColorModeValue('secondaryGray.300', 'navy.900');

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        console.log('Fetching components...');
        const [groupsData, printersData, assembliesData] = await Promise.all([
          ApiService.getGroups(),
          ApiService.getPrinters(),
          ApiService.getAssemblies(),
        ]);
        console.log('Groups:', groupsData);
        console.log('Printers:', printersData);
        console.log('Assemblies:', assembliesData);
        setGroups(groupsData);
        setPrinters(printersData);
        setAssemblies(assembliesData);
      } catch (error) {
        console.error('Error fetching components:', error);
      }
    };

    fetchComponents();
  }, []);

  // Clear search query when leaving the components page
  useEffect(() => {
    return () => {
      setSearchQuery('');
    };
  }, [setSearchQuery]);

  // Filter components based on search query
  const filterComponents = (components: Component[]) => {
    if (!searchQuery) return components;

    const query = searchQuery.toLowerCase();
    return components.filter(
      (component) =>
        component.componentName.toLowerCase().includes(query) ||
        component.supplier.toLowerCase().includes(query) ||
        component.type.toLowerCase().includes(query),
    );
  };

  const filteredGroups = filterComponents(groups);
  const filteredPrinters = filterComponents(printers);
  const filteredAssemblies = filterComponents(assemblies);

  const getTotalResults = () => {
    return (
      filteredGroups.length +
      filteredPrinters.length +
      filteredAssemblies.length
    );
  };

  const getTotalComponents = () => {
    return groups.length + printers.length + assemblies.length;
  };

  const handleCardClick = (initialComponent: string) => {
    navigate(`/admin/graph/${initialComponent}`);
  };

  const handleCreateClick = (type: 'printer' | 'group' | 'assembly') => {
    setCreateType(type);
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
    });
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.componentName) {
      toast({
        title: 'Validation Error',
        description: 'Component name is required',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const componentData = {
        ...formData,
        type: createType,
      };

      if (createType === 'printer') {
        // For printers, they are their own root component
        await ApiService.createPrinter(componentData, formData.componentName);
      } else if (createType === 'group') {
        // For groups, they are their own root component
        await ApiService.createGroup(componentData, formData.componentName);
      } else if (createType === 'assembly') {
        // For assemblies, they are their own root component
        await ApiService.createAssembly(componentData, formData.componentName);
      }

      toast({
        title: `${
          createType.charAt(0).toUpperCase() + createType.slice(1)
        } Created`,
        description: `${formData.componentName} has been created successfully`,
        status: 'success',
        duration: 3000,
      });

      // Refresh the data
      const [groupsData, printersData, assembliesData] = await Promise.all([
        ApiService.getGroups(),
        ApiService.getPrinters(),
        ApiService.getAssemblies(),
      ]);
      setGroups(groupsData);
      setPrinters(printersData);
      setAssemblies(assembliesData);

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create component',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderComponentSection = (
    title: string,
    components: Component[],
    filteredComponents: Component[],
    createType: 'printer' | 'group' | 'assembly',
    icon: any,
    gradientBg: string,
    buttonColor: string,
  ) => {
    const getSingularForm = (title: string) => {
      return title.endsWith('s') ? title.slice(0, -1) : title;
    };

    return (
      <SmoothMotionBox key={title} variants={fadeInUp}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color={textColor}>
            {title} ({components.length})
          </Heading>
          <Button
            leftIcon={<MdAdd />}
            colorScheme={buttonColor}
            size="sm"
            onClick={() => handleCreateClick(createType)}
          >
            Create {getSingularForm(title)}
          </Button>
        </Flex>

        {filteredComponents.length === 0 && searchQuery ? (
          <SmoothCard textAlign="center" py={10} borderRadius="lg" bg="gray.50">
            <Text fontSize="lg" color="gray.500">
              No {title.toLowerCase()} found matching "{searchQuery}"
            </Text>
          </SmoothCard>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
            {filteredComponents.map((component, index) => (
              <SmoothCard
                key={component.componentName}
                onClick={() => handleCardClick(component.componentName)}
                cursor="pointer"
                p="20px"
                boxShadow={cardShadow}
                bg={gradientBg}
                color="white"
                borderRadius="20px"
                position="relative"
                overflow="hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.1, duration: 0.3 },
                }}
              >
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  minH="120px"
                >
                  <Box
                    bg="rgba(255, 255, 255, 0.2)"
                    borderRadius="16px"
                    p="12px"
                    mb="16px"
                    backdropFilter="blur(10px)"
                  >
                    <Icon as={icon} w="32px" h="32px" color="white" />
                  </Box>
                  <Text
                    fontSize="lg"
                    fontWeight="700"
                    textAlign="center"
                    lineHeight="1.2"
                  >
                    {component.componentName}
                  </Text>
                </Flex>
              </SmoothCard>
            ))}
          </SimpleGrid>
        )}
      </SmoothMotionBox>
    );
  };

  return (
    <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={2}>
            <Heading size="lg" color={textColor}>
              Components
            </Heading>
            {searchQuery && (
              <Text color={textColorSecondary} fontSize="sm">
                Showing {getTotalResults()} of {getTotalComponents()} components
                {searchQuery && ` matching "${searchQuery}"`}
              </Text>
            )}
          </VStack>
        </Flex>

        {/* Render component sections */}
        {renderComponentSection(
          'Printers',
          printers,
          filteredPrinters,
          'printer',
          MdPrint,
          'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)',
          'blue',
        )}

        {renderComponentSection(
          'Groups',
          groups,
          filteredGroups,
          'group',
          MdGroups,
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'purple',
        )}

        {renderComponentSection(
          'Assemblies',
          assemblies,
          filteredAssemblies,
          'assembly',
          MdBuild,
          'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
          'green',
        )}
      </VStack>

      {/* Modal for creating components */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Create New{' '}
            {createType?.charAt(0).toUpperCase() + createType?.slice(1)}
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Component Name</FormLabel>
                <Input
                  value={formData.componentName}
                  onChange={(e) =>
                    handleInputChange('componentName', e.target.value)
                  }
                  placeholder="Enter component name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Amount</FormLabel>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    handleInputChange('amount', parseInt(e.target.value))
                  }
                  placeholder="Enter amount"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Supplier</FormLabel>
                <Input
                  value={formData.supplier}
                  onChange={(e) =>
                    handleInputChange('supplier', e.target.value)
                  }
                  placeholder="Enter supplier name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Cost</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    handleInputChange('cost', parseFloat(e.target.value))
                  }
                  placeholder="Enter cost"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Minimum Amount Trigger</FormLabel>
                <Input
                  type="number"
                  value={formData.triggerMinAmount}
                  onChange={(e) =>
                    handleInputChange(
                      'triggerMinAmount',
                      parseInt(e.target.value),
                    )
                  }
                  placeholder="Enter minimum amount"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Scanned By</FormLabel>
                <Input
                  value={formData.scannedBy}
                  onChange={(e) =>
                    handleInputChange('scannedBy', e.target.value)
                  }
                  placeholder="Enter scanner name"
                />
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
              isLoading={isSubmitting}
              loadingText="Creating..."
            >
              Create{' '}
              {createType?.charAt(0).toUpperCase() + createType?.slice(1)}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SmoothMotionBox>
  );
}
