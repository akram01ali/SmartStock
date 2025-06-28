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
import {
  MdGroups,
  MdPrint,
  MdAdd,
  MdBuild,
  MdArrowBack,
  MdDelete,
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

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
        mb={6}
        onClick={onBack}
        leftIcon={<MdArrowBack />}
        size="lg"
        variant="ghost"
        _hover={{ bg: 'gray.100' }}
      >
        Back to Inventory
      </Button>

      <Card>
        <VStack spacing={8} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="lg">{component.componentName}</Heading>
            <Text
              px={3}
              py={1}
              borderRadius="full"
              bg={
                component.amount < component.triggerMinAmount
                  ? 'red.100'
                  : 'green.100'
              }
              color={
                component.amount < component.triggerMinAmount
                  ? 'red.700'
                  : 'green.700'
              }
              fontWeight="medium"
            >
              {component.type}
            </Text>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <Box
              borderWidth="1px"
              borderRadius="xl"
              p={6}
              bg={bgColor}
              borderColor={borderColor}
              shadow="sm"
            >
              <Heading size="md" mb={6} color="blue.600">
                Stock Information
              </Heading>
              <SimpleGrid columns={2} spacing={6}>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.600">
                    Amount
                  </FormLabel>
                  <Text fontSize="lg">
                    {component.amount} {component.measure}
                  </Text>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.600">
                    Minimum Amount
                  </FormLabel>
                  <Text fontSize="lg">{component.triggerMinAmount}</Text>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.600">
                    Cost
                  </FormLabel>
                  <Text fontSize="lg">€{component.cost}</Text>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.600">
                    Supplier
                  </FormLabel>
                  <Text fontSize="lg">
                    {component.supplier || 'Not specified'}
                  </Text>
                </FormControl>
              </SimpleGrid>
            </Box>

            <Box
              borderWidth="1px"
              borderRadius="xl"
              p={6}
              bg={bgColor}
              borderColor={borderColor}
              shadow="sm"
            >
              <Heading size="md" mb={6} color="blue.600">
                Development Details
              </Heading>
              <SimpleGrid columns={2} spacing={6}>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.600">
                    Development Time
                  </FormLabel>
                  <Text fontSize="lg">
                    {component.durationOfDevelopment} days
                  </Text>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.600">
                    Type
                  </FormLabel>
                  <Text fontSize="lg">{component.type}</Text>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.600">
                    Last Scanned
                  </FormLabel>
                  <Text fontSize="lg">
                    {new Date(component.lastScanned).toLocaleDateString()}
                  </Text>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.600">
                    Scanned By
                  </FormLabel>
                  <Text fontSize="lg">
                    {component.scannedBy || 'Not specified'}
                  </Text>
                </FormControl>
              </SimpleGrid>
            </Box>
          </SimpleGrid>

          <HStack spacing={4} mt={4} justify="flex-end">
            <Button
              leftIcon={<MdBuild />}
              colorScheme="blue"
              size="lg"
              onClick={handleEditClick}
              _hover={{ transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              Edit Component
            </Button>
            <Button
              leftIcon={<Icon as={MdDelete} />}
              colorScheme="red"
              size="lg"
              onClick={handleDelete}
              _hover={{ transform: 'translateY(-2px)' }}
              transition="all 0.2s"
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
