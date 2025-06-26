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
import Card from 'components/card/Card';
import { MdGroups, MdPrint, MdAdd } from 'react-icons/md';

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
  type: 'printer' | 'group' | 'component';
}

export default function ComponentsPage() {
  const [groups, setGroups] = useState<Component[]>([]);
  const [printers, setPrinters] = useState<Component[]>([]);
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
  const [createType, setCreateType] = useState<'printer' | 'group' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

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
        const [groupsData, printersData] = await Promise.all([
          ApiService.getGroups(),
          ApiService.getPrinters(),
        ]);
        console.log('Groups:', groupsData);
        console.log('Printers:', printersData);
        setGroups(groupsData);
        setPrinters(printersData);
      } catch (error) {
        console.error('Error fetching components:', error);
      }
    };

    fetchComponents();
  }, []);

  const handleCardClick = (componentName: string) => {
    navigate(`/admin/graph/${componentName}`);
  };

  const handleCreateClick = (type: 'printer' | 'group') => {
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
      } else {
        // For groups, they are their own root component
        await ApiService.createGroup(componentData, formData.componentName);
      }

      toast({
        title: `${createType.charAt(0).toUpperCase() + createType.slice(1)} Created`,
        description: `${formData.componentName} has been created successfully`,
        status: 'success',
        duration: 3000,
      });

      // Refresh the data
      const [groupsData, printersData] = await Promise.all([
        ApiService.getGroups(),
        ApiService.getPrinters(),
      ]);
      setGroups(groupsData);
      setPrinters(printersData);

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create component',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Box p={8}>
        <HStack justify="space-between" align="center" mb={8}>
          <Heading size="xl" color={textColor} fontWeight="700">
            Groups
          </Heading>
          <Button
            leftIcon={<Icon as={MdAdd} />}
            colorScheme="purple"
            onClick={() => handleCreateClick('group')}
          >
            Create Group
          </Button>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
          {groups.map((group) => (
            <Card
              key={group.componentName}
              onClick={() => handleCardClick(group.componentName)}
              cursor="pointer"
              p="20px"
              boxShadow={cardShadow}
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              color="white"
              borderRadius="20px"
              position="relative"
              overflow="hidden"
              _hover={{
                transform: 'translateY(-8px)',
                transition: 'all 0.3s ease',
                boxShadow: '0px 20px 60px rgba(112, 144, 176, 0.25)',
                filter: 'brightness(1.1)',
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
                  <Icon as={MdGroups as any} w="32px" h="32px" color="white" />
                </Box>
                <Text
                  fontSize="lg"
                  fontWeight="700"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  {group.componentName}
                </Text>
              </Flex>
            </Card>
          ))}
        </SimpleGrid>

        <HStack justify="space-between" align="center" mt={16} mb={8}>
          <Heading size="xl" color={textColor} fontWeight="700">
            Printers
          </Heading>
          <Button
            leftIcon={<Icon as={MdAdd} />}
            colorScheme="blue"
            onClick={() => handleCreateClick('printer')}
          >
            Create Printer
          </Button>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
          {printers.map((printer) => (
            <Card
              key={printer.componentName}
              onClick={() => handleCardClick(printer.componentName)}
              cursor="pointer"
              p="20px"
              boxShadow={cardShadow}
              bg="linear-gradient(135deg, #868CFF 0%, #4318FF 100%)"
              color="white"
              borderRadius="20px"
              position="relative"
              overflow="hidden"
              _hover={{
                transform: 'translateY(-8px)',
                transition: 'all 0.3s ease',
                boxShadow: '0px 20px 60px rgba(67, 24, 255, 0.25)',
                filter: 'brightness(1.1)',
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
                  <Icon as={MdPrint as any} w="32px" h="32px" color="white" />
                </Box>
                <Text
                  fontSize="lg"
                  fontWeight="700"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  {printer.componentName}
                </Text>
              </Flex>
            </Card>
          ))}
        </SimpleGrid>

        {/* Create Dialog */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent>
            <ModalHeader color="#4318FF">
              Create New {createType?.charAt(0).toUpperCase()}{createType?.slice(1)}
            </ModalHeader>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Component Name</FormLabel>
                  <Input
                    value={formData.componentName}
                    onChange={(e) => handleInputChange('componentName', e.target.value)}
                    placeholder={`Enter ${createType} name`}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Supplier</FormLabel>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Enter supplier name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Cost</FormLabel>
                  <Input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                    placeholder="Enter cost"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Development Duration (days)</FormLabel>
                  <Input
                    type="number"
                    value={formData.durationOfDevelopment}
                    onChange={(e) => handleInputChange('durationOfDevelopment', parseInt(e.target.value) || 0)}
                    placeholder="Enter development duration"
                  />
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
                Create {createType?.charAt(0).toUpperCase()}{createType?.slice(1)}
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
}
