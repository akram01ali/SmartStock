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
  Badge,
  Divider,
  Avatar,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../../services/service';
import Card from 'components/card/Card';
import {
  MdGroups,
  MdPrint,
  MdAdd,
  MdBuild,
  MdArrowBack,
  MdDelete,
  MdInventory,
  MdTrendingUp,
  MdAccessTime,
  MdPerson,
  MdAttachMoney,
  MdWarning,
  MdCheckCircle,
} from 'react-icons/md';
import { ComponentDialog } from '../../../components/flowchart/componentDialog';

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

interface InventoryComponentProps {
  component: Component;
  onBack: () => void;
  onEdit?: (component: Component) => Promise<void>;
  onDelete?: (componentName: string) => Promise<void>;
}

export default function InventoryComponent({
  component,
  onBack,
  onEdit,
  onDelete,
}: InventoryComponentProps) {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.800');
  const shadowColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const isLowStock = component.amount < component.triggerMinAmount;
  const stockPercentage = Math.min((component.amount / (component.triggerMinAmount * 2)) * 100, 100);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'printer': return 'blue';
      case 'group': return 'purple';
      case 'component': return 'green';
      case 'assembly': return 'orange';
      default: return 'gray';
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'printer': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'group': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'component': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'assembly': return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  const handleEditClick = () => {
    onOpen();
  };

  const handleDelete = async () => {
    try {
      await ApiService.deleteComponent(component.componentName, true);
      toast({
        title: 'Component deleted',
        status: 'success',
        duration: 3000,
      });
      if (onDelete) {
        await onDelete(component.componentName);
      }
      onBack();
    } catch (error) {
      toast({
        title: 'Error deleting component',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleEditSubmit = async (editedComponent: Component) => {
    try {
      // Pass the original component name
      editedComponent.componentName = component.componentName;

      const updatedComponent = (await ApiService.updateComponent(
        editedComponent,
      )) as Component; // Type assertion here

      toast({
        title: 'Component updated',
        status: 'success',
        duration: 3000,
      });

      // Update parent component and close dialog
      if (onEdit) {
        await onEdit(updatedComponent);
      }
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating component',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Button
        mb={8}
        onClick={onBack}
        leftIcon={<MdArrowBack />}
        size="lg"
        variant="ghost"
        color={textColor}
        _hover={{ 
          bg: useColorModeValue('gray.100', 'gray.600'),
          transform: 'translateX(-4px)',
        }}
        transition="all 0.3s ease"
        fontWeight="600"
      >
        Back to Inventory
      </Button>

      <Card 
        bg={cardBg}
        boxShadow={`0 20px 40px ${shadowColor}`}
        borderRadius="20px"
        overflow="hidden"
      >
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <Box
            bg={getTypeGradient(component.type)}
            p={8}
            m={-6}
            mb={0}
            borderRadius="20px 20px 0 0"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top="0"
              right="0"
              w="100px"
              h="100px"
              bg="rgba(255,255,255,0.1)"
              borderRadius="full"
              transform="translate(30px, -30px)"
            />
            <Flex justify="space-between" align="center" position="relative">
              <VStack align="start" spacing={2}>
                <Heading size="xl" color="white" fontWeight="700">
                  {component.componentName}
                </Heading>
                <HStack spacing={3}>
                  <Badge 
                    colorScheme={getTypeColor(component.type)} 
                    variant="solid"
                    px={3}
                    py={1}
                    borderRadius="full"
                    bg="rgba(255,255,255,0.2)"
                    color="white"
                    fontWeight="600"
                    textTransform="capitalize"
                  >
                    {component.type}
                  </Badge>
                  {isLowStock && (
                    <Badge 
                      colorScheme="red" 
                      variant="solid"
                      px={3}
                      py={1}
                      borderRadius="full"
                      bg="rgba(255,0,0,0.2)"
                      color="white"
                      fontWeight="600"
                    >
                      Low Stock
                    </Badge>
                  )}
                </HStack>
              </VStack>
              
              <VStack align="end" spacing={1}>
                <Text color="rgba(255,255,255,0.8)" fontSize="sm" fontWeight="500">
                  Current Stock
                </Text>
                <Heading size="2xl" color="white" fontWeight="800">
                  {component.amount}
                </Heading>
                <Text color="rgba(255,255,255,0.9)" fontSize="md" fontWeight="500">
                  {component.measure}
                </Text>
              </VStack>
            </Flex>
          </Box>

          {/* Main Content Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} px={2}>
            {/* Stock Information Card */}
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderRadius="16px"
              p={6}
              borderColor={borderColor}
              boxShadow={`0 8px 32px ${shadowColor}`}
              transition="all 0.3s ease"
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 48px ${shadowColor}`,
              }}
            >
              <HStack spacing={4} mb={6}>
                <Box
                  bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                  borderRadius="12px"
                  p={3}
                >
                  <Icon as={MdInventory} w="24px" h="24px" color="white" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="md" color={textColor} fontWeight="600">
                    Stock Information
                  </Heading>
                  <Text color={textColorSecondary} fontSize="sm">
                    Current inventory details
                  </Text>
                </VStack>
              </HStack>

              <SimpleGrid columns={2} spacing={6}>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color={textColorSecondary} fontWeight="500">
                    Amount
                  </Text>
                  <Text fontSize="xl" fontWeight="700" color={textColor}>
                    {component.amount} {component.measure}
                  </Text>
                </VStack>
                
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color={textColorSecondary} fontWeight="500">
                    Minimum Amount
                  </Text>
                  <Text fontSize="xl" fontWeight="700" color={isLowStock ? "red.500" : textColor}>
                    {component.triggerMinAmount}
                  </Text>
                </VStack>
                
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color={textColorSecondary} fontWeight="500">
                    Unit Cost
                  </Text>
                  <HStack>
                    <Icon as={MdAttachMoney} color="green.500" w="20px" h="20px" />
                    <Text fontSize="xl" fontWeight="700" color={textColor}>
                      €{component.cost}
                    </Text>
                  </HStack>
                </VStack>
                
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color={textColorSecondary} fontWeight="500">
                    Supplier
                  </Text>
                  <HStack>
                    <Avatar 
                      size="xs" 
                      name={component.supplier || 'Unknown'} 
                      bg="blue.500"
                    />
                    <Text fontSize="lg" fontWeight="600" color={textColor} noOfLines={1}>
                      {component.supplier || 'Not specified'}
                    </Text>
                  </HStack>
                </VStack>
              </SimpleGrid>

              <Divider my={4} />
              
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color={textColorSecondary}>
                    Stock Level
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color={isLowStock ? "red.500" : "green.500"}>
                    {isLowStock ? "Below minimum" : "Above minimum"}
                  </Text>
                </VStack>
                <CircularProgress 
                  value={stockPercentage} 
                  size="50px" 
                  color={isLowStock ? "red.500" : "green.500"}
                  thickness="6px"
                >
                  <CircularProgressLabel fontSize="xs" fontWeight="bold">
                    {Math.round(stockPercentage)}%
                  </CircularProgressLabel>
                </CircularProgress>
              </HStack>
            </Box>

            {/* Development Details Card */}
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderRadius="16px"
              p={6}
              borderColor={borderColor}
              boxShadow={`0 8px 32px ${shadowColor}`}
              transition="all 0.3s ease"
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 48px ${shadowColor}`,
              }}
            >
              <HStack spacing={4} mb={6}>
                <Box
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  borderRadius="12px"
                  p={3}
                >
                  <Icon as={MdTrendingUp} w="24px" h="24px" color="white" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="md" color={textColor} fontWeight="600">
                    Development Details
                  </Heading>
                  <Text color={textColorSecondary} fontSize="sm">
                    Production & tracking info
                  </Text>
                </VStack>
              </HStack>

              <SimpleGrid columns={2} spacing={6}>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color={textColorSecondary} fontWeight="500">
                    Development Time
                  </Text>
                  <HStack>
                    <Icon as={MdAccessTime} color="orange.500" w="20px" h="20px" />
                    <Text fontSize="xl" fontWeight="700" color={textColor}>
                      {component.durationOfDevelopment} days
                    </Text>
                  </HStack>
                </VStack>
                
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color={textColorSecondary} fontWeight="500">
                    Component Type
                  </Text>
                  <Badge 
                    colorScheme={getTypeColor(component.type)} 
                    variant="subtle"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontWeight="600"
                    textTransform="capitalize"
                  >
                    {component.type}
                  </Badge>
                </VStack>
                
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color={textColorSecondary} fontWeight="500">
                    Last Scanned
                  </Text>
                  <Text fontSize="lg" fontWeight="600" color={textColor}>
                    {new Date(component.lastScanned).toLocaleDateString()}
                  </Text>
                </VStack>
                
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color={textColorSecondary} fontWeight="500">
                    Scanned By
                  </Text>
                  <HStack>
                    <Icon as={MdPerson} color="purple.500" w="20px" h="20px" />
                    <Text fontSize="lg" fontWeight="600" color={textColor} noOfLines={1}>
                      {component.scannedBy || 'Not specified'}
                    </Text>
                  </HStack>
                </VStack>
              </SimpleGrid>
            </Box>
          </SimpleGrid>

          {/* Action Buttons */}
          <HStack spacing={4} justify="flex-end" pt={4}>
            <Button
              leftIcon={<MdBuild />}
              colorScheme="blue"
              size="lg"
              onClick={handleEditClick}
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              color="white"
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
              }}
              _active={{
                transform: 'translateY(0px)',
              }}
              transition="all 0.3s ease"
              fontWeight="600"
              borderRadius="12px"
              px={8}
            >
              Edit Component
            </Button>
            <Button
              leftIcon={<Icon as={MdDelete} />}
              colorScheme="red"
              size="lg"
              onClick={handleDelete}
              bg="linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)"
              color="white"
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
              }}
              _active={{
                transform: 'translateY(0px)',
              }}
              transition="all 0.3s ease"
              fontWeight="600"
              borderRadius="12px"
              px={8}
            >
              Delete
            </Button>
          </HStack>

          <ComponentDialog
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleEditSubmit}
            component={component}
            mode="edit"
          />
        </VStack>
      </Card>
    </Box>
  );
}
