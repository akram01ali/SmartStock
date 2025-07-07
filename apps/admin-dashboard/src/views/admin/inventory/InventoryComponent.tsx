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
  StatHelpText,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { ApiService } from '../../../services/service';
import {
  MdArrowBack,
  MdDelete,
  MdEdit,
  MdInventory,
  MdAttachMoney,
  MdPerson,
  MdAccessTime,
  MdBusiness,
  MdWarning,
} from 'react-icons/md';
import { ComponentDialog } from '../../../components/graph/componentDialog';
import { ComponentCreate, Measures, TypeOfComponent } from '../../../components/graph/types';

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

export default function InventoryComponent({
  component,
  onBack,
  onEdit,
  onDelete,
}: InventoryComponentProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const isLowStock = component.amount < component.triggerMinAmount;

  const getTypeColor = (type: TypeOfComponent) => {
    switch (type) {
      case TypeOfComponent.Printer: return 'blue';
      case TypeOfComponent.Group: return 'purple';
      case TypeOfComponent.Component: return 'green';
      case TypeOfComponent.Assembly: return 'orange';
      default: return 'gray';
    }
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

  const handleEditSubmit = async (editedComponent: ComponentCreate) => {
    try {
      const componentData = {
        ...editedComponent,
        componentName: component.componentName,
      };
      
      const updatedComponent = (await ApiService.updateComponent(
        componentData,
      )) as Component;

      toast({
        title: 'Component updated',
        status: 'success',
        duration: 3000,
      });

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
    <Box minH="100vh" bg={bgColor} p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Button
          leftIcon={<MdArrowBack />}
          variant="ghost"
          onClick={onBack}
          size="lg"
          fontWeight="600"
        >
          Back to Inventory
        </Button>

        <HStack spacing={3}>
          <Button
            leftIcon={<MdEdit />}
            colorScheme="blue"
            onClick={onOpen}
            size="md"
          >
            Edit
          </Button>
          <Button
            leftIcon={<MdDelete />}
            colorScheme="red"
            onClick={handleDelete}
            size="md"
          >
            Delete
          </Button>
        </HStack>
      </Flex>

      {/* Main Content */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Component Info Card */}
        <Card bg={cardBg} gridColumn={{ base: 1, lg: '1 / 3' }}>
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
                      <Badge colorScheme="red" px={3} py={1} borderRadius="full">
                        Low Stock
                      </Badge>
                    )}
                  </HStack>
                </VStack>

                <VStack align="end" spacing={1}>
                  <Text fontSize="sm" color={textColorSecondary}>Current Stock</Text>
                  <Heading size="lg" color={isLowStock ? 'red.500' : textColor}>
                    {component.amount} {component.measure}
                  </Heading>
                </VStack>
              </Flex>

              <Divider />

              {/* Key Stats */}
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} w="100%">
                <Stat>
                  <StatLabel color={textColorSecondary}>
                    <HStack>
                      <MdAttachMoney size="16px" />
                      <Text>Unit Cost</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color={textColor}>€{component.cost}</StatNumber>
                </Stat>

                <Stat>
                  <StatLabel color={textColorSecondary}>
                    <HStack>
                      <MdWarning size="16px" />
                      <Text>Min. Amount</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color={textColor}>{component.triggerMinAmount}</StatNumber>
                </Stat>

                <Stat>
                  <StatLabel color={textColorSecondary}>
                    <HStack>
                      <MdBusiness size="16px" />
                      <Text>Supplier</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="md" color={textColor} noOfLines={1}>
                    {component.supplier || 'Not specified'}
                  </StatNumber>
                </Stat>

                <Stat>
                  <StatLabel color={textColorSecondary}>
                    <HStack>
                      <MdAccessTime size="16px" />
                      <Text>Dev. Time</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color={textColor}>{component.durationOfDevelopment} days</StatNumber>
                </Stat>
              </SimpleGrid>

              <Divider />

              {/* Additional Info */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                <HStack>
                  <MdPerson size="20px" color="gray" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color={textColorSecondary}>Last Scanned By</Text>
                    <Text fontWeight="500" color={textColor}>
                      {component.scannedBy || 'Not specified'}
                    </Text>
                  </VStack>
                </HStack>

                <HStack>
                  <MdAccessTime size="20px" color="gray" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color={textColorSecondary}>Last Scanned</Text>
                    <Text fontWeight="500" color={textColor}>
                      {new Date(component.lastScanned).toLocaleDateString()}
                    </Text>
                  </VStack>
                </HStack>
              </SimpleGrid>

              {/* Description */}
              {component.description && (
                <>
                  <Divider />
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
          <Card bg={cardBg}>
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
                  bg={useColorModeValue('gray.50', 'gray.700')}
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
                        bg={useColorModeValue('gray.100', 'gray.600')}
                      >
                        <Text color={textColorSecondary}>Image not available</Text>
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
