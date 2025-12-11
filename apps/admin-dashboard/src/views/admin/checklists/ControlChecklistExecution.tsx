import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Button,
  Input,
  Select,
  Text,
  useColorModeValue,
  useToast,
  Checkbox,
  Heading,
  Divider,
  Card,
  CardBody,
  Badge,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Flex,
  IconButton,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { MdAddCircle, MdCheckCircle, MdLocalShipping, MdDownload, MdDelete } from 'react-icons/md';
import { ApiService } from '../../../services/service';
import { useSearch } from '../../../contexts/SearchContext';

interface Template {
  id: string;
  name: string;
  description?: string;
  items: Array<{
    id: string;
    label: string;
    type: 'test' | 'control';
    order: number;
  }>;
}

interface Entry {
  id?: string;
  itemId: string;
  isChecked: boolean;
  value?: string;
  comment?: string;
}

interface Checklist {
  id: string;
  printerSerialNumber: string;
  templateId: string;
  status: 'draft' | 'completed' | 'shipped';
  shippedAt?: string;
  createdAt: string;
  entries: Entry[];
}

export default function ControlChecklistExecution() {
  const navigate = useNavigate();
  const { searchQuery } = useSearch();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [allChecklists, setAllChecklists] = useState<Checklist[]>([]);
  const [filteredChecklists, setFilteredChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newTemplateId, setNewTemplateId] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Colors - Horizon UI theme
  const bgColor = useColorModeValue('#ffffff', 'navy.800');
  const bgColorSecondary = useColorModeValue('gray.50', 'navy.700');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'gray.400');
  const testSectionBg = useColorModeValue('linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');

  // Load all checklists on mount
  useEffect(() => {
    loadAllChecklists();
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllChecklists = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getAllControlChecklists();
      setAllChecklists(data || []);
      setFilteredChecklists(data || []);
    } catch (error) {
      console.error('Error loading checklists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load checklists',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle search filtering with fuzzy search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChecklists(allChecklists);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allChecklists.filter((checklist) =>
      checklist.printerSerialNumber.toLowerCase().includes(query)
    );
    setFilteredChecklists(filtered);
  }, [searchQuery, allChecklists]);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await ApiService.getControlChecklistTemplates();
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  const handleSelectChecklist = useCallback((checklist: Checklist) => {
    setSelectedChecklist(checklist);
    const template = templates.find((t) => t.id === checklist.templateId);
    if (template) {
      setEntries(checklist.entries);
    }
  }, [templates]);

  const handleAddSystem = useCallback(async () => {
    if (!newSerialNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Serial number is required',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!newTemplateId) {
      toast({
        title: 'Error',
        description: 'Please select a template',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const template = templates.find((t) => t.id === newTemplateId);
      if (!template) return;

      const newChecklist = await ApiService.createControlChecklist({
        printerSerialNumber: newSerialNumber,
        templateId: newTemplateId,
        entries: template.items.map((item) => ({
          itemId: item.id,
          isChecked: false,
          value: '',
          comment: '',
        })),
      });

      toast({
        title: 'Success',
        description: 'System added successfully',
        status: 'success',
        duration: 3000,
      });

      setNewSerialNumber('');
      setNewTemplateId('');
      onClose();
      await loadAllChecklists();
      handleSelectChecklist(newChecklist as any);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create checklist',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [newSerialNumber, newTemplateId, templates, toast, onClose, loadAllChecklists, handleSelectChecklist]);

  const handleEntryChange = useCallback(
    (itemId: string, field: keyof Entry, value: any) => {
      const updated = entries.map((entry) =>
        entry.itemId === itemId ? { ...entry, [field]: value } : entry
      );
      setEntries(updated);
    },
    [entries]
  );

  const handleSaveChecklist = useCallback(async () => {
    if (!selectedChecklist) return;

    try {
      setIsLoading(true);
      await ApiService.updateControlChecklist(selectedChecklist.id, {
        entries: entries.map((e) => ({
          itemId: e.itemId,
          isChecked: e.isChecked,
          value: e.value,
          comment: e.comment,
        })),
      });

      toast({
        title: 'Success',
        description: 'Checklist saved',
        status: 'success',
        duration: 3000,
      });

      await loadAllChecklists();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save checklist',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedChecklist, entries, toast, loadAllChecklists]);

  const handleDownloadPDF = useCallback(async () => {
    if (!selectedChecklist) return;

    try {
      setIsLoading(true);
      await ApiService.generateChecklistPDF(selectedChecklist.id);

      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download PDF',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedChecklist, toast]);

  const handleDeleteChecklist = useCallback(async () => {
    if (!selectedChecklist) return;

    if (!window.confirm(`Are you sure you want to delete the checklist for printer ${selectedChecklist.printerSerialNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      await ApiService.deleteControlChecklist(selectedChecklist.id);

      toast({
        title: 'Success',
        description: 'Checklist deleted successfully',
        status: 'success',
        duration: 3000,
      });

      setSelectedChecklist(null);
      setEntries([]);
      await loadAllChecklists();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete checklist',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedChecklist, toast, loadAllChecklists]);

  const handleCompleteChecklist = useCallback(async () => {
    if (!selectedChecklist) return;

    try {
      setIsLoading(true);
      await ApiService.updateControlChecklistStatus(selectedChecklist.id, 'completed');
      setSelectedChecklist({ ...selectedChecklist, status: 'completed' });
      toast({
        title: 'Success',
        description: 'Checklist marked as completed',
        status: 'success',
        duration: 3000,
      });
      await loadAllChecklists();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update checklist',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedChecklist, toast, loadAllChecklists]);

  const handleShipPrinter = useCallback(async () => {
    if (!selectedChecklist) return;

    try {
      setIsLoading(true);
      await ApiService.updateControlChecklistStatus(selectedChecklist.id, 'shipped');
      setSelectedChecklist({ ...selectedChecklist, status: 'shipped', shippedAt: new Date().toISOString() });
      toast({
        title: 'Success',
        description: 'System marked as shipped',
        status: 'success',
        duration: 3000,
      });
      await loadAllChecklists();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to ship system',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedChecklist, toast, loadAllChecklists]);

  const getTestItems = () => {
    if (!selectedChecklist) return [];
    const template = templates.find((t) => t.id === selectedChecklist.templateId);
    return template?.items.filter((i) => i.type === 'test') || [];
  };

  const getControlItems = () => {
    if (!selectedChecklist) return [];
    const template = templates.find((t) => t.id === selectedChecklist.templateId);
    return template?.items.filter((i) => i.type === 'control') || [];
  };

  return (
    <Box pt="130px" px={{ base: '24px', md: '24px' }} pb="40px">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" color={textColor} mb={1}>
            📋 Quality Control Checklists
          </Heading>
          <Text color={textColorSecondary} fontSize="sm">
            Manage printer quality control and testing procedures
          </Text>
        </Box>

        {/* Main Content */}
        <HStack align="start" spacing={6} h="calc(100vh - 280px)">
          {/* Systems Sidebar */}
          <Card
            w={{ base: '100%', lg: '350px' }}
            flexShrink={0}
            h="100%"
            boxShadow="0px 3.5px 5.5px rgba(0, 0, 0, 0.12)"
            overflowY="auto"
          >
            <CardBody p={6}>
              <VStack spacing={4} align="stretch" h="100%">
                {/* Header Controls */}
                <VStack spacing={3} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Heading size="md" color={textColor}>
                      Systems
                    </Heading>
                    <Tooltip label="Add new system" placement="left">
                      <IconButton
                        icon={<Icon as={MdAddCircle as any} w={5} h={5} />}
                        aria-label="Add system"
                        colorScheme="blue"
                        size="sm"
                        onClick={onOpen}
                      />
                    </Tooltip>
                  </Flex>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => navigate('/admin/checklist-templates')}
                    w="full"
                    fontSize="xs"
                  >
                    Manage Templates
                  </Button>
                </VStack>

                <Divider />

                {/* Systems List */}
                {isLoading ? (
                  <VStack justify="center" py={10} flex={1}>
                    <Spinner color="brand.500" size="lg" />
                  </VStack>
                ) : filteredChecklists.length === 0 ? (
                  <Box textAlign="center" py={8} flex={1} display="flex" flexDirection="column" justifyContent="center">
                    <Text color={textColorSecondary} fontSize="sm" mb={4}>
                      No systems yet
                    </Text>
                    <Button size="sm" colorScheme="blue" onClick={onOpen}>
                      Create First System
                    </Button>
                  </Box>
                ) : (
                  <VStack spacing={2} align="stretch" overflowY="auto" flex={1}>
                    {filteredChecklists.map((checklist) => (
                      <Box
                        key={checklist.id}
                        p={3}
                        borderRadius="12px"
                        bg={selectedChecklist?.id === checklist.id ? 'brand.500' : bgColorSecondary}
                        borderWidth={selectedChecklist?.id === checklist.id ? '0' : '1px'}
                        borderColor={borderColor}
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{
                          bg: selectedChecklist?.id === checklist.id ? 'brand.500' : 'gray.100',
                          transform: 'translateX(2px)',
                        }}
                        onClick={() => handleSelectChecklist(checklist)}
                      >
                        <VStack align="start" spacing={1}>
                          <HStack spacing={2} w="100%">
                            <Text
                              fontWeight="600"
                              color={selectedChecklist?.id === checklist.id ? 'white' : textColor}
                              noOfLines={1}
                              fontSize="sm"
                            >
                              {checklist.printerSerialNumber}
                            </Text>
                            <Badge
                              colorScheme={
                                checklist.status === 'shipped'
                                  ? 'green'
                                  : checklist.status === 'completed'
                                  ? 'blue'
                                  : 'yellow'
                              }
                              fontSize="xs"
                              ml="auto"
                            >
                              {checklist.status}
                            </Badge>
                          </HStack>
                          <Text
                            fontSize="xs"
                            color={selectedChecklist?.id === checklist.id ? 'whiteAlpha.700' : textColorSecondary}
                          >
                            {new Date(checklist.createdAt).toLocaleDateString()}
                          </Text>
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Main Detail Area */}
          {selectedChecklist ? (
            <Card
              flex={1}
              h="100%"
              boxShadow="0px 3.5px 5.5px rgba(0, 0, 0, 0.12)"
              overflowY="auto"
            >
              <CardBody p={8}>
                <VStack spacing={6} align="stretch">
                  {/* Header with Actions */}
                  <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
                    <VStack align="start" spacing={1}>
                      <Heading size="lg" color={textColor}>
                        {selectedChecklist.printerSerialNumber}
                      </Heading>
                      <Text fontSize="sm" color={textColorSecondary}>
                        {templates.find((t) => t.id === selectedChecklist.templateId)?.name}
                      </Text>
                    </VStack>
                    <HStack spacing={2}>
                      {selectedChecklist.status === 'draft' && (
                        <>
                          <Tooltip label="Mark checklist as completed">
                            <Button
                              size="sm"
                              colorScheme="blue"
                              // @ts-ignore
                              leftIcon={<Icon as={MdCheckCircle} />}
                              onClick={handleCompleteChecklist}
                              isLoading={isLoading}
                            >
                              Complete
                            </Button>
                          </Tooltip>
                          <Tooltip label="Mark system as shipped">
                            <Button
                              size="sm"
                              colorScheme="green"
                              // @ts-ignore
                              leftIcon={<Icon as={MdLocalShipping} />}
                              onClick={handleShipPrinter}
                              isLoading={isLoading}
                            >
                              Ship
                            </Button>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip label="Download checklist as PDF">
                        <Button
                          size="sm"
                          colorScheme="purple"
                          // @ts-ignore
                          leftIcon={<Icon as={MdDownload} />}
                          onClick={handleDownloadPDF}
                          isLoading={isLoading}
                        >
                          Download PDF
                        </Button>
                      </Tooltip>
                      <Button
                        size="sm"
                        colorScheme="brand"
                        onClick={handleSaveChecklist}
                        isLoading={isLoading}
                      >
                        Save Changes
                      </Button>
                      <Tooltip label="Delete this checklist">
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          // @ts-ignore
                          leftIcon={<Icon as={MdDelete} />}
                          onClick={handleDeleteChecklist}
                          isLoading={isLoading}
                        >
                          Delete
                        </Button>
                      </Tooltip>
                    </HStack>
                  </Flex>

                  <Divider />

                  {/* Testing Section */}
                  {getTestItems().length > 0 && (
                    <Box>
                      <Heading size="md" color={textColor} mb={4} display="flex" alignItems="center" gap={2}>
                        <Box as="span">✅ Testing</Box>
                      </Heading>
                      <Box
                        bg={testSectionBg}
                        p={5}
                        borderRadius="16px"
                        boxShadow="0px 2px 8px rgba(0, 0, 0, 0.1)"
                      >
                        <VStack spacing={0} align="stretch">
                          {getTestItems().map((item, idx) => {
                            const entry = entries.find((e) => e.itemId === item.id);
                            return (
                              <Box key={item.id}>
                                <HStack spacing={4} align="center" py={3} px={2}>
                                  <Checkbox
                                    isChecked={entry?.isChecked || false}
                                    onChange={(e) =>
                                      handleEntryChange(item.id, 'isChecked', e.target.checked)
                                    }
                                    colorScheme="whiteAlpha"
                                    flexShrink={0}
                                    size="lg"
                                  />
                                  <Text fontWeight="500" color="white" flex={1} noOfLines={2}>
                                    {item.label}
                                  </Text>
                                  <Input
                                    placeholder="Comment..."
                                    value={entry?.comment || ''}
                                    onChange={(e) =>
                                      handleEntryChange(item.id, 'comment', e.target.value)
                                    }
                                    size="sm"
                                    bg="whiteAlpha.200"
                                    borderColor="whiteAlpha.300"
                                    color="white"
                                    _placeholder={{ color: 'whiteAlpha.500' }}
                                    w="220px"
                                    flexShrink={0}
                                  />
                                </HStack>
                                {idx < getTestItems().length - 1 && (
                                  <Divider borderColor="whiteAlpha.200" my={0} />
                                )}
                              </Box>
                            );
                          })}
                        </VStack>
                      </Box>
                    </Box>
                  )}

                  {/* Facts Section */}
                  {getControlItems().length > 0 && (
                    <Box>
                      <Heading size="md" color={textColor} mb={4} display="flex" alignItems="center" gap={2}>
                        <Box as="span">📋 Facts</Box>
                      </Heading>
                      <Card bg={bgColorSecondary} borderWidth="1px" borderColor={borderColor}>
                        <CardBody p={5}>
                          <VStack spacing={4} align="stretch">
                            {getControlItems().map((item) => {
                              const entry = entries.find((e) => e.itemId === item.id);
                              return (
                                <HStack key={item.id} spacing={4} align="center">
                                  <Text fontWeight="600" color={textColor} w="180px" flexShrink={0} fontSize="sm">
                                    {item.label}
                                  </Text>
                                  <Input
                                    placeholder="Enter value"
                                    value={entry?.value || ''}
                                    onChange={(e) =>
                                      handleEntryChange(item.id, 'value', e.target.value)
                                    }
                                    size="md"
                                    bg={bgColor}
                                    borderColor={borderColor}
                                    flex={1}
                                  />
                                </HStack>
                              );
                            })}
                          </VStack>
                        </CardBody>
                      </Card>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <Card flex={1} h="100%" boxShadow="0px 3.5px 5.5px rgba(0, 0, 0, 0.12)">
              <CardBody display="flex" alignItems="center" justifyContent="center" h="100%">
                <VStack spacing={4} textAlign="center">
                  <Heading size="md" color={textColorSecondary}>
                    No System Selected
                  </Heading>
                  <Text color={textColorSecondary} fontSize="sm">
                    Click on a system from the list to view and manage its checklist
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </HStack>
      </VStack>

      {/* Add System Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg={bgColor} color={textColor} boxShadow="0px 3.5px 5.5px rgba(0, 0, 0, 0.12)">
          <ModalHeader fontSize="lg" fontWeight="700">
            ➕ Add New System
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2} color={textColor}>
                  Serial Number
                  <Text as="span" color="red.500" ml={1}>
                    *
                  </Text>
                </Text>
                <Input
                  placeholder="e.g., PRINTER-2025-001"
                  value={newSerialNumber}
                  onChange={(e) => setNewSerialNumber(e.target.value)}
                  bg={bgColorSecondary}
                  borderColor={borderColor}
                  focusBorderColor="brand.500"
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2} color={textColor}>
                  Template
                  <Text as="span" color="red.500" ml={1}>
                    *
                  </Text>
                </Text>
                <Select
                  placeholder="Select a template"
                  value={newTemplateId}
                  onChange={(e) => setNewTemplateId(e.target.value)}
                  bg={bgColorSecondary}
                  borderColor={borderColor}
                  focusBorderColor="brand.500"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2} borderTopWidth="1px" borderTopColor={borderColor} pt={4}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAddSystem}
              isLoading={isLoading}
            >
              Create System
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
