import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  Text,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Select,
  IconButton,
  Heading,
  Divider,
  Badge,
  Card,
  CardBody,
  SimpleGrid,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { MdAddCircle, MdDelete, MdArrowBack } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../../services/service';

interface TemplateItem {
  id?: string;
  label: string;
  type: 'test' | 'control';
  order: number;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  items: TemplateItem[];
  createdAt: string;
}

export default function TemplateManager() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newItems, setNewItems] = useState<TemplateItem[]>([
    { label: '', type: 'test', order: 0 },
  ]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Colors - Horizon UI theme
  const bgColor = useColorModeValue('#ffffff', 'navy.800');
  const bgColorSecondary = useColorModeValue('gray.50', 'navy.700');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'gray.400');

  // Load templates
  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getControlChecklistTemplates();
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleAddItem = useCallback(() => {
    setNewItems([
      ...newItems,
      { label: '', type: 'test', order: newItems.length },
    ]);
  }, [newItems]);

  const handleRemoveItem = useCallback((index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  }, [newItems]);

  const handleItemChange = useCallback(
    (index: number, field: keyof TemplateItem, value: any) => {
      const updated = [...newItems];
      updated[index] = { ...updated[index], [field]: value };
      setNewItems(updated);
    },
    [newItems]
  );

  const handleDeleteTemplate = useCallback(
    async (templateId: string) => {
      if (!window.confirm('Are you sure you want to delete this template?')) return;

      try {
        await ApiService.deleteControlChecklistTemplate(templateId);
        toast({
          title: 'Success',
          description: 'Template deleted successfully',
          status: 'success',
          duration: 3000,
        });
        await loadTemplates();
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete template',
          status: 'error',
          duration: 3000,
        });
      }
    },
    [toast, loadTemplates]
  );

  const handleEditTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setIsEditMode(true);
    setNewTemplateName(template.name);
    setNewTemplateDescription(template.description || '');
    setNewItems(template.items);
    onOpen();
  }, [onOpen]);

  const resetForm = () => {
    setSelectedTemplate(null);
    setIsEditMode(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
    setNewItems([{ label: '', type: 'test', order: 0 }]);
  };

  const handleSaveTemplate = useCallback(async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (newItems.some((item) => !item.label.trim())) {
      toast({
        title: 'Error',
        description: 'All items must have a label',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      if (isEditMode && selectedTemplate) {
        // Update existing template
        await ApiService.updateControlChecklistTemplate(selectedTemplate.id, {
          name: newTemplateName,
          description: newTemplateDescription,
          items: newItems,
        });
        toast({
          title: 'Success',
          description: 'Template updated successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        // Create new template
        await ApiService.createControlChecklistTemplate({
          name: newTemplateName,
          description: newTemplateDescription,
          items: newItems,
        });
        toast({
          title: 'Success',
          description: 'Template created successfully',
          status: 'success',
          duration: 3000,
        });
      }

      resetForm();
      onClose();
      await loadTemplates();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        status: 'error',
        duration: 3000,
      });
    }
  }, [newTemplateName, newTemplateDescription, newItems, toast, onClose, loadTemplates, isEditMode, selectedTemplate]);

  return (
    <Box pt="130px" px={{ base: '24px', md: '24px' }} pb="40px">
      <VStack spacing={6} align="stretch">
        {/* Header with Back Button */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1} flex={1}>
            <Heading size="xl" color={textColor}>
              📋 Checklist Templates
            </Heading>
            <Text fontSize="sm" color={textColorSecondary}>
              Create and manage quality control templates for different printer models
            </Text>
          </VStack>
          <HStack spacing={2}>
            <Tooltip label="Back to checklists">
              <IconButton
                aria-label="Back"
                icon={<Icon as={MdArrowBack as any} w={5} h={5} />}
                colorScheme="gray"
                variant="ghost"
                onClick={() => navigate('/admin/control-checklists')}
              />
            </Tooltip>
            <Button
              colorScheme="blue"
              // @ts-ignore
              leftIcon={<Icon as={MdAddCircle} />}
              onClick={onOpen}
              size="md"
            >
              New Template
            </Button>
          </HStack>
        </HStack>

        <Divider />

        {/* Templates Grid */}
        {isLoading ? (
          <Box textAlign="center" py={20}>
            <Heading size="md" color={textColorSecondary}>
              Loading templates...
            </Heading>
          </Box>
        ) : templates.length === 0 ? (
          <Box textAlign="center" py={20}>
            <Heading size="md" color={textColor} mb={2}>
              No templates yet
            </Heading>
            <Text color={textColorSecondary} mb={6}>
              Create your first template to get started
            </Text>
            <Button
              colorScheme="blue"
              // @ts-ignore
              leftIcon={<Icon as={MdAddCircle} />}
              onClick={onOpen}
            >
              Create First Template
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {templates.map((template) => (
              <Card
                key={template.id}
                bg={bgColor}
                borderColor={borderColor}
                borderWidth="1px"
                boxShadow="0px 3.5px 5.5px rgba(0, 0, 0, 0.12)"
                cursor="pointer"
                transition="all 0.3s ease"
                _hover={{
                  boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-4px)',
                }}
                onClick={() => handleEditTemplate(template)}
              >
                <CardBody>
                  <VStack align="start" spacing={4} h="100%">
                    {/* Title and Delete */}
                    <HStack justify="space-between" w="100%">
                      <VStack align="start" spacing={1} flex={1}>
                        <Heading size="md" color={textColor}>
                          {template.name}
                        </Heading>
                        {template.description && (
                          <Text fontSize="xs" color={textColorSecondary} noOfLines={2}>
                            {template.description}
                          </Text>
                        )}
                      </VStack>
                      <Tooltip label="Delete template">
                        <IconButton
                          icon={<Icon as={MdDelete as any} w={5} h={5} />}
                          aria-label="Delete template"
                          colorScheme="red"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                        />
                      </Tooltip>
                    </HStack>

                    <Divider />

                    {/* Items Preview */}
                    <VStack align="start" spacing={2} w="100%">
                      <Text fontSize="xs" fontWeight="600" color={textColorSecondary} textTransform="uppercase" letterSpacing="0.5px">
                        Items ({template.items.length})
                      </Text>
                      {template.items.slice(0, 3).map((item, index) => (
                        <HStack key={index} spacing={2} w="100%">
                          <Badge
                            colorScheme={item.type === 'test' ? 'purple' : 'pink'}
                            fontSize="xs"
                            fontWeight="600"
                          >
                            {item.type}
                          </Badge>
                          <Text fontSize="sm" color={textColor} noOfLines={1} flex={1}>
                            {item.label}
                          </Text>
                        </HStack>
                      ))}
                      {template.items.length > 3 && (
                        <Text fontSize="xs" color="brand.500" fontWeight="600">
                          +{template.items.length - 3} more items
                        </Text>
                      )}
                    </VStack>

                    {/* Footer */}
                    <Box w="100%" pt={2} borderTopWidth="1px" borderTopColor={borderColor}>
                      <Text fontSize="xs" color={textColorSecondary}>
                        Created {new Date(template.createdAt).toLocaleDateString()}
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Create Template Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg={bgColor} color={textColor} boxShadow="0px 3.5px 5.5px rgba(0, 0, 0, 0.12)">
          <ModalHeader fontSize="lg" fontWeight="700">
            {isEditMode ? '✏️ Edit Template' : '➕ Create New Template'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Template Name */}
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2} color={textColor}>
                  Template Name
                  <Text as="span" color="red.500" ml={1}>
                    *
                  </Text>
                </Text>
                <Input
                  placeholder="e.g., Printer Model X - 2025"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  bg={bgColorSecondary}
                  borderColor={borderColor}
                  focusBorderColor="brand.500"
                />
              </Box>

              {/* Description */}
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2} color={textColor}>
                  Description
                </Text>
                <Textarea
                  placeholder="What is this template for?"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  bg={bgColorSecondary}
                  borderColor={borderColor}
                  focusBorderColor="brand.500"
                  minH="80px"
                />
              </Box>

              {/* Items */}
              <Box>
                <HStack justify="space-between" mb={3}>
                  <Text fontSize="sm" fontWeight="600" color={textColor}>
                    Items
                    <Text as="span" color="red.500" ml={1}>
                      *
                    </Text>
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    // @ts-ignore
                    leftIcon={<Icon as={MdAddCircle} />}
                    onClick={handleAddItem}
                  >
                    Add Item
                  </Button>
                </HStack>

                <VStack spacing={3} align="stretch">
                  {newItems.map((item, index) => (
                    <HStack key={index} spacing={2}>
                      <Input
                        placeholder="Item label"
                        value={item.label}
                        onChange={(e) =>
                          handleItemChange(index, 'label', e.target.value)
                        }
                        bg={bgColorSecondary}
                        borderColor={borderColor}
                        focusBorderColor="brand.500"
                        flex={2}
                      />
                      <Select
                        value={item.type}
                        onChange={(e) =>
                          handleItemChange(index, 'type', e.target.value)
                        }
                        bg={bgColorSecondary}
                        borderColor={borderColor}
                        focusBorderColor="brand.500"
                        flex={1}
                      >
                        <option value="test">Testing</option>
                        <option value="control">Facts</option>
                      </Select>
                      <Tooltip label="Remove item">
                        <IconButton
                          icon={<Icon as={MdDelete as any} w={5} h={5} />}
                          aria-label="Remove item"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleRemoveItem(index)}
                        />
                      </Tooltip>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter gap={2} borderTopWidth="1px" borderTopColor={borderColor} pt={4}>
            <Button variant="ghost" onClick={() => {
              resetForm();
              onClose();
            }}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveTemplate}
            >
              {isEditMode ? 'Update Template' : 'Create Template'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
