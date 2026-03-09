import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  Flex,
  Button,
  VStack,
  useToast,
  useDisclosure,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Textarea,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import SmoothMotionBox, { fadeIn } from 'components/transitions/MotionBox';
import { AddIcon } from '../../../components/common/IconWrapper';
import { ApiService } from '../../../services/service';

interface LaborProfile {
  id: string;
  name: string;
  hourlyRate: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  hourlyRate: string;
  description: string;
}

const TOAST_DURATION = 3000;
const INITIAL_FORM_DATA: FormData = {
  name: '',
  hourlyRate: '18.5',
  description: '',
};

export default function LaborProfilesPage() {
  // State
  const [profiles, setProfiles] = useState<LaborProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Color mode values
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'gray.400');
  const bgColor = useColorModeValue('gray.50', 'navy.900');
  const cardBg = useColorModeValue('white', 'navy.700');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');

  // Utility functions
  const showToast = useCallback(
    (title: string, description: string, status: 'success' | 'error') => {
      toast({
        title,
        description,
        status,
        duration: TOAST_DURATION,
      });
    },
    [toast]
  );

  const showErrorToast = useCallback(
    (error: unknown, title: string) => {
      const description = error instanceof Error ? error.message : 'Unknown error';
      showToast(title, description, 'error');
    },
    [showToast]
  );

  // API calls
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ApiService.getAllLaborProfiles();
      setProfiles(data);
    } catch (error) {
      showErrorToast(error, 'Error fetching labor profiles');
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Profile name is required';
    }

    const rate = parseFloat(formData.hourlyRate);
    if (isNaN(rate) || rate < 0) {
      errors.hourlyRate = 'Hourly rate must be a valid positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    onOpen();
  };

  const handleOpenEdit = (profile: LaborProfile) => {
    setEditingId(profile.id);
    setFormData({
      name: profile.name,
      hourlyRate: profile.hourlyRate.toString(),
      description: profile.description || '',
    });
    setFormErrors({});
    onOpen();
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const submitData = {
        name: formData.name.trim(),
        hourlyRate: parseFloat(formData.hourlyRate),
        description: formData.description.trim() || undefined,
      };

      if (editingId) {
        await ApiService.updateLaborProfile(editingId, submitData);
        showToast(
          'Profile Updated',
          `Labor profile "${submitData.name}" has been updated`,
          'success'
        );
      } else {
        await ApiService.createLaborProfile(submitData);
        showToast(
          'Profile Created',
          `Labor profile "${submitData.name}" has been created`,
          'success'
        );
      }

      await fetchProfiles();
      onClose();
    } catch (error) {
      showErrorToast(error, editingId ? 'Error updating profile' : 'Error creating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the profile "${name}"?`)) {
      return;
    }

    try {
      await ApiService.deleteLaborProfile(id);
      showToast('Profile Deleted', `Labor profile "${name}" has been deleted`, 'success');
      await fetchProfiles();
    } catch (error) {
      showErrorToast(error, 'Error deleting profile');
    }
  };

  // Effects
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return (
    <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }} variants={fadeIn}>
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={2}>
          <Heading size="lg" color={textColor}>
            Labor Cost Profiles
          </Heading>
          <Text color={textColorSecondary}>
            Create and manage labor cost profiles with different hourly rates
          </Text>
        </VStack>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          size="lg"
          onClick={handleOpenCreate}
        >
          Create Profile
        </Button>
      </Flex>

      <Box bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor} p={6}>
        {loading ? (
          <Center minH="400px">
            <Spinner size="lg" color="blue.500" />
          </Center>
        ) : profiles.length === 0 ? (
          <Center minH="300px">
            <VStack spacing={4}>
              <Text color={textColorSecondary} fontSize="lg">
                No labor profiles yet
              </Text>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={handleOpenCreate}
              >
                Create Your First Profile
              </Button>
            </VStack>
          </Center>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr borderBottomColor={borderColor}>
                <Th color={textColorSecondary}>Profile Name</Th>
                <Th color={textColorSecondary} isNumeric>
                  Hourly Rate (EUR)
                </Th>
                <Th color={textColorSecondary}>Description</Th>
                <Th color={textColorSecondary} textAlign="center">
                  Actions
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {profiles.map((profile) => (
                <Tr
                  key={profile.id}
                  borderBottomColor={borderColor}
                  _hover={{ bg: hoverBg }}
                  transition="background 0.2s"
                >
                  <Td>
                    <Text fontWeight="600" color={textColor}>
                      {profile.name}
                    </Text>
                  </Td>
                  <Td isNumeric>
                    <Text color={textColor}>
                      €{profile.hourlyRate.toFixed(2)}
                    </Text>
                  </Td>
                  <Td>
                    <Text color={textColorSecondary} fontSize="sm" noOfLines={1}>
                      {profile.description || '—'}
                    </Text>
                  </Td>
                  <Td textAlign="center">
                    <HStack spacing={2} justify="center">
                      <IconButton
                        icon={<EditIcon />}
                        aria-label="Edit profile"
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => handleOpenEdit(profile)}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label="Delete profile"
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(profile.id, profile.name)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={cardBg}>
          <ModalHeader color={textColor}>
            {editingId ? 'Edit Labor Profile' : 'Create New Labor Profile'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={Boolean(formErrors.name)}>
                <FormLabel color={textColor} fontSize="sm" fontWeight="500">
                  Profile Name
                </FormLabel>
                <Input
                  placeholder="e.g., Senior Developer, Junior Developer"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  color={textColor}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.400' }}
                />
                {formErrors.name && (
                  <FormErrorMessage>{formErrors.name}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={Boolean(formErrors.hourlyRate)}>
                <FormLabel color={textColor} fontSize="sm" fontWeight="500">
                  Hourly Rate (EUR)
                </FormLabel>
                <Input
                  type="number"
                  placeholder="18.50"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourlyRate: e.target.value })
                  }
                  step="0.01"
                  min="0"
                  color={textColor}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.400' }}
                />
                {formErrors.hourlyRate && (
                  <FormErrorMessage>{formErrors.hourlyRate}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl>
                <FormLabel color={textColor} fontSize="sm" fontWeight="500">
                  Description (Optional)
                </FormLabel>
                <Textarea
                  placeholder="e.g., Full-time senior developer with 10+ years experience"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  color={textColor}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.400' }}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSave}
                isLoading={isSubmitting}
              >
                {editingId ? 'Update' : 'Create'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SmoothMotionBox>
  );
}
