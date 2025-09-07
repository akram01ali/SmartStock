import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Text,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Select,
  InputGroup,
  InputLeftElement,
  Input,
  Icon,
  Flex,
  useColorModeValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { MdAdd, MdRefresh, MdSearch } from 'react-icons/md';
import { ForecastingService } from '../../../services/forecastingService';
import { ApiService } from '../../../services/service';
import {
  Reservation,
  ReservationStatus,
  PurchaseRequirement,
  ForecastingSummary as ForecastingSummaryType,
} from '../../../types/forecasting';
import ForecastingSummary from '../../../components/forecasting/ForecastingSummary';
import ReservationCard from '../../../components/forecasting/ReservationCard';
import CreateReservationModal from '../../../components/forecasting/CreateReservationModal';
import { ReservationDetailsModal } from '../../../components/forecasting/ReservationDetailsModal';
import SmoothMotionBox, { fadeInUp } from '../../../components/transitions/MotionBox';

const ForecastingPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [purchaseRequirements, setPurchaseRequirements] = useState<PurchaseRequirement[]>([]);
  const [availableComponents, setAvailableComponents] = useState<string[]>([]);
  const [summary, setSummary] = useState<ForecastingSummaryType>({
    totalReservations: 0,
    pendingReservations: 0,
    totalPurchaseRequirements: 0,
    urgentRequirements: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isDetailsOpen, 
    onOpen: onDetailsOpen, 
    onClose: onDetailsClose 
  } = useDisclosure();
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Color mode values (consistent with other pages)
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'white');
  const cardShadow = useColorModeValue(
    '0px 18px 40px rgba(112, 144, 176, 0.12)',
    'unset',
  );
  const selectBg = useColorModeValue('white', 'gray.700');
  const selectBorderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter reservations when status or search changes
  useEffect(() => {
    loadReservations();
  }, [selectedStatus]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadReservations(),
        loadPurchaseRequirements(),
        // Removed loadAvailableComponents() - will load when modal opens
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReservations = async () => {
    setReservationsLoading(true);
    try {
      const status = selectedStatus === 'all' ? null : selectedStatus as ReservationStatus;
      const data = await ForecastingService.getReservations(status);
      setReservations(data);
      updateSummary(data);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setReservationsLoading(false);
    }
  };

  const loadPurchaseRequirements = async () => {
    try {
      const data = await ForecastingService.getPurchaseRequirements();
      setPurchaseRequirements(data);
    } catch (err) {
      console.error('Failed to load purchase requirements:', err);
    }
  };

  const loadAvailableComponents = async () => {
    try {
      const data = await ApiService.getAllComponents();
      // Type assertion since we know the API returns an array of components
      const components = data as any[];
      setAvailableComponents(components.map((component: any) => component.componentName));
    } catch (err) {
      console.error('Failed to load components:', err);
    }
  };

  const updateSummary = (reservationData: Reservation[]) => {
    const pending = reservationData.filter(r => r.status === ReservationStatus.PENDING);
    setSummary({
      totalReservations: reservationData.length,
      pendingReservations: pending.length,
      totalPurchaseRequirements: purchaseRequirements.length,
      urgentRequirements: purchaseRequirements.filter(r => {
        const neededDate = new Date(r.neededByDate);
        const urgentThreshold = new Date();
        urgentThreshold.setDate(urgentThreshold.getDate() + 7); // 7 days
        return neededDate <= urgentThreshold;
      }).length,
    });
  };

  const handleReservationCreated = () => {
    loadReservations();
    loadPurchaseRequirements();
    toast({
      title: 'Success',
      description: 'Reservation created and BOM exploded successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleViewBreakdown = async (reservationId: string) => {
    setSelectedReservationId(reservationId);
    onDetailsOpen();
  };

  const handleDeleteReservation = (reservationId: string) => {
    setReservationToDelete(reservationId);
    onDeleteOpen();
  };

  const confirmDeleteReservation = async () => {
    if (!reservationToDelete) return;

    try {
      await ForecastingService.deleteReservation(reservationToDelete);
      toast({
        title: 'Success',
        description: 'Reservation deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadReservations();
      loadPurchaseRequirements();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete reservation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setReservationToDelete(null);
    }
  };

  const handleProcessAllocations = async () => {
    try {
      await ForecastingService.processAllocations();
      toast({
        title: 'Allocations Processed',
        description: 'Stock allocations have been recalculated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadReservations();
      loadPurchaseRequirements();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to process allocations',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleOpenModal = () => {
    onOpen();
    // Load components when modal opens
    if (availableComponents.length === 0) {
      loadAvailableComponents();
    }
  };

  const filteredReservations = reservations.filter(reservation =>
    reservation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.componentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Center h="400px">
          <VStack>
            <Spinner size="xl" />
            <Text color={textColorSecondary}>Loading forecasting data...</Text>
          </VStack>
        </Center>
      </SmoothMotionBox>
    );
  }

  if (error) {
    return (
      <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </SmoothMotionBox>
    );
  }

  return (
    <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={2}>
            <Heading size="lg" color={textColor}>
              Forecasting & Reservations
            </Heading>
            <Text color={textColorSecondary} fontSize="sm">
              Manage inventory reservations and forecasting requirements
            </Text>
          </VStack>
          <HStack>
            <Button
              leftIcon={<Icon as={MdRefresh as any} />}
              onClick={handleProcessAllocations}
              variant="outline"
              size="sm"
              colorScheme="gray"
            >
              Process Allocations
            </Button>
            <Button
              leftIcon={<Icon as={MdAdd as any} />}
              colorScheme="blue"
              onClick={handleOpenModal}
            >
              New Reservation
            </Button>
          </HStack>
        </Flex>

        {/* Summary Cards */}
        <SmoothMotionBox variants={fadeInUp}>
          <ForecastingSummary summary={summary} />
        </SmoothMotionBox>

        {/* Main Content Tabs */}
        <SmoothMotionBox variants={fadeInUp}>
          <Tabs colorScheme="blue" variant="enclosed">
            <TabList>
              <Tab>Reservations</Tab>
              <Tab>Purchase Requirements</Tab>
            </TabList>

            <TabPanels>
              {/* Reservations Panel */}
              <TabPanel p={0} pt={6}>
                <VStack spacing={6} align="stretch">
                  {/* Filters */}
                  <HStack spacing={4} flexWrap="wrap">
                    <Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      maxW="200px"
                      bg={selectBg}
                      borderColor={selectBorderColor}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>

                    <InputGroup maxW="300px">
                      <InputLeftElement>
                        <Icon as={MdSearch as any} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search reservations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg={inputBg}
                        borderColor={inputBorderColor}
                      />
                    </InputGroup>
                  </HStack>

                  {/* Reservations Grid */}
                  {reservationsLoading ? (
                    <Center py={12}>
                      <VStack>
                        <Spinner size="lg" />
                        <Text color={textColorSecondary}>Loading reservations...</Text>
                      </VStack>
                    </Center>
                  ) : filteredReservations.length === 0 ? (
                    <Center py={12}>
                      <VStack spacing={4}>
                        <Icon as={MdSearch as any} size="48px" color="gray.400" />
                        <Text color={textColorSecondary} fontSize="lg">
                          No reservations found
                        </Text>
                        <Text color={textColorSecondary} fontSize="sm">
                          {searchTerm ? `No results for "${searchTerm}"` : 'Create your first reservation to get started'}
                        </Text>
                      </VStack>
                    </Center>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {filteredReservations.map((reservation) => (
                        <SmoothMotionBox key={reservation.id} variants={fadeInUp}>
                          <ReservationCard
                            reservation={reservation}
                            onViewBreakdown={handleViewBreakdown}
                            onDelete={handleDeleteReservation}
                          />
                        </SmoothMotionBox>
                      ))}
                    </SimpleGrid>
                  )}
                </VStack>
              </TabPanel>

              {/* Purchase Requirements Panel */}
              <TabPanel p={0} pt={6}>
                {purchaseRequirements.length === 0 ? (
                  <Center py={12}>
                    <VStack spacing={4}>
                      <Icon as={MdRefresh as any} size="48px" color="gray.400" />
                      <Text color={textColorSecondary} fontSize="lg">
                        No purchase requirements
                      </Text>
                      <Text color={textColorSecondary} fontSize="sm">
                        Purchase requirements will appear here when components need to be ordered
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {purchaseRequirements.map((req) => {
                      const fakeReservation: Reservation = {
                        id: req.id,
                        isRoot: true,
                        level: 0,
                        title: req.componentName,
                        componentName: req.componentName,
                        quantity: req.requiredQuantity,
                        priority: 10,
                        requestedBy: 'Purchase System',
                        neededByDate: req.neededByDate,
                        status: ReservationStatus.PENDING,
                        createdAt: req.createdAt,
                      };
                      return (
                        <SmoothMotionBox key={req.id} variants={fadeInUp}>
                          <ReservationCard
                            reservation={fakeReservation}
                            onViewBreakdown={handleViewBreakdown}
                          />
                        </SmoothMotionBox>
                      );
                    })}
                  </SimpleGrid>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </SmoothMotionBox>
      </VStack>

      {/* Create Reservation Modal */}
      <CreateReservationModal
        isOpen={isOpen}
        onClose={onClose}
        onReservationCreated={handleReservationCreated}
        availableComponents={availableComponents}
      />

      {/* Reservation Details Modal */}
      <ReservationDetailsModal
        isOpen={isDetailsOpen}
        onClose={onDetailsClose}
        reservationId={selectedReservationId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Reservation
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this reservation? This action cannot be undone and will also delete all associated child reservations and allocations.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteReservation} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </SmoothMotionBox>
  );
};

export default ForecastingPage; 