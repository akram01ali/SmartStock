import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { MdWarning, MdDelete, MdLinkOff } from 'react-icons/md';
import { ApiService } from '../../services/service';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  componentName: string;
  parentComponent: string;
  onDeleteFromDatabase: () => Promise<void>;
  onDeleteFromSubassembly: () => Promise<void>;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  componentName,
  parentComponent,
  onDeleteFromDatabase,
  onDeleteFromSubassembly,
}: DeleteConfirmationDialogProps) {
  const [impactPreview, setImpactPreview] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (isOpen && componentName) {
      loadImpactPreview();
    }
  }, [isOpen, componentName, parentComponent]);

  const loadImpactPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const preview = await ApiService.previewDeletionImpact(componentName, parentComponent);
      setImpactPreview(preview);
    } catch (error) {
      console.error('Error loading impact preview:', error);
      setImpactPreview({ affectedComponents: [componentName], count: 1, descendants: [] });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDeleteFromDatabase = async () => {
    await onDeleteFromDatabase();
    onClose();
  };

  const handleDeleteFromSubassembly = async () => {
    await onDeleteFromSubassembly();
    onClose();
  };

  const hasDescendants = impactPreview?.descendants?.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader color="#4318FF">
          <HStack spacing={3}>
            <MdWarning color="orange" size="24px" />
            <Text>Delete Component</Text>
          </HStack>
        </ModalHeader>
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={2}>
                What would you like to delete?
              </Text>
              <Text color="gray.600">
                You are about to delete component: <Text as="span" fontWeight="bold" color="#4318FF">{componentName}</Text>
              </Text>
              
              {isLoadingPreview ? (
                <HStack mt={3} spacing={2}>
                  <Spinner size="sm" color="#4318FF" />
                  <Text fontSize="sm" color="gray.500">Loading impact preview...</Text>
                </HStack>
              ) : impactPreview && hasDescendants && (
                <Box mt={3} p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                  <Text fontSize="sm" fontWeight="semibold" color="blue.700" mb={1}>
                    Impact Preview:
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    This will also affect <Badge colorScheme="blue">{impactPreview.descendants.length}</Badge> subcomponent(s):
                  </Text>
                  <Text fontSize="xs" color="blue.500" mt={1}>
                    {impactPreview.descendants.slice(0, 3).join(', ')}
                    {impactPreview.descendants.length > 3 && ` +${impactPreview.descendants.length - 3} more`}
                  </Text>
                </Box>
              )}
            </Box>

            <VStack spacing={3} align="stretch">
              <Box
                p={4}
                border="2px solid"
                borderColor="red.200"
                borderRadius="lg"
                bg="red.50"
              >
                <HStack spacing={3} mb={2}>
                  <MdDelete color="red" size="20px" />
                  <Text fontWeight="semibold" color="red.700">
                    Delete from Database
                  </Text>
                </HStack>
                <Text fontSize="sm" color="red.600">
                  This will permanently remove the component from the entire system.
                  All relationships from the root to this component and its subcomponents will be removed.
                  Internal relationships between subcomponents will be preserved.
                </Text>
              </Box>

              <Box
                p={4}
                border="2px solid"
                borderColor="orange.200"
                borderRadius="lg"
                bg="orange.50"
              >
                <HStack spacing={3} mb={2}>
                  <MdLinkOff color="orange" size="20px" />
                  <Text fontWeight="semibold" color="orange.700">
                    Remove from "{parentComponent}" Subassembly
                  </Text>
                </HStack>
                <Text fontSize="sm" color="orange.600">
                  This will remove the relationships from "{parentComponent}" to 
                  "{componentName}" and all its subcomponents. Internal relationships 
                  between the subcomponents will be preserved. All components remain in the database.
                </Text>
              </Box>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter pt={0}>
          <HStack spacing={3} w="full" justify="flex-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              leftIcon={<MdLinkOff style={{ fontSize: '16px' }} />}
              onClick={handleDeleteFromSubassembly}
              isDisabled={isLoadingPreview}
            >
              Remove from Subassembly
            </Button>
            <Button
              colorScheme="red"
              leftIcon={<MdDelete style={{ fontSize: '16px' }} />}
              onClick={handleDeleteFromDatabase}
              isDisabled={isLoadingPreview}
            >
              Delete from Database
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 