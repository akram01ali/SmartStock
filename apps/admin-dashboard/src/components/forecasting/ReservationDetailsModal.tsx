import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Flex,
  Icon
} from '@chakra-ui/react';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { ForecastingService } from '../../services/forecastingService';
import { Reservation, ReservationDetails, PurchaseRequirement } from '../../types/forecasting';

interface ReservationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
}

// Level color scheme
const getLevelColor = (level: number): string => {
  const colors = [
    'blue',    // Level 0 (root)
    'green',   // Level 1
    'orange',  // Level 2
    'purple',  // Level 3
    'red',     // Level 4
    'teal',    // Level 5
    'pink',    // Level 6+
  ];
  return colors[Math.min(level, colors.length - 1)];
};

const getLevelBgColor = (level: number, colorMode: 'light' | 'dark'): string => {
  const color = getLevelColor(level);
  return colorMode === 'light' ? `${color}.50` : `${color}.900`;
};

const getLevelBorderColor = (level: number): string => {
  const color = getLevelColor(level);
  return `${color}.200`;
};

export const ReservationDetailsModal: React.FC<ReservationDetailsModalProps> = ({
  isOpen,
  onClose,
  reservationId
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<ReservationDetails | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const colorMode = useColorModeValue('light', 'dark');

  const fetchDetails = async () => {
    if (!reservationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [breakdown, allocations, purchaseRequirements] = await Promise.all([
        ForecastingService.getReservationBreakdown(reservationId),
        ForecastingService.getReservationAllocations(reservationId),
        ForecastingService.getPurchaseRequirements()
      ]);

      // Sort breakdown by level for proper hierarchy display
      const sortedBreakdown = breakdown.breakdown.sort((a: Reservation, b: Reservation) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.componentName.localeCompare(b.componentName);
      });

      const mainReservation = sortedBreakdown.find((r: Reservation) => r.isRoot);
      const childReservations = sortedBreakdown.filter((r: Reservation) => !r.isRoot);

      // Filter purchase requirements to only show those related to this reservation's components
      const componentNames = sortedBreakdown.map((r: Reservation) => r.componentName);
      const relatedPurchaseRequirements = purchaseRequirements.filter((req: PurchaseRequirement) => 
        componentNames.includes(req.componentName)
      );

      setDetails({
        mainReservation: mainReservation || null,
        childReservations,
        allocations,
        purchaseRequirements: relatedPurchaseRequirements
      });
    } catch (err) {
      setError('Failed to fetch reservation details');
      console.error('Error fetching reservation details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && reservationId) {
      fetchDetails();
    }
  }, [isOpen, reservationId]);

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <Flex justify="center" align="center" h="200px">
              <Spinner size="xl" />
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Reservation Details
          {details?.mainReservation && (
            <Text fontSize="sm" color="gray.500" mt={1}>
              {details.mainReservation.title} - {details.mainReservation.componentName}
            </Text>
          )}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {details?.mainReservation ? (
            <VStack spacing={6} align="stretch">
              {/* Main Reservation Info */}
              <Box 
                p={4} 
                bg={getLevelBgColor(0, colorMode)}
                borderLeft="4px solid"
                borderLeftColor={`${getLevelColor(0)}.400`}
                borderRadius="md"
              >
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="semibold">
                      {details.mainReservation.componentName}
                    </Text>
                    <HStack spacing={4}>
                      <Text fontSize="sm" color="gray.600">
                        Quantity: {details.mainReservation.quantity}
                      </Text>
                      {(() => {
                        const allocation = details.allocations.find(a => a.componentName === details.mainReservation.componentName);
                        if (allocation) {
                          return (
                            <>
                              <Text fontSize="sm" color="green.500" fontWeight="semibold">
                                Allocated: {allocation.allocatedQuantity}
                              </Text>
                              {allocation.shortfallQuantity > 0 && (
                                <Text fontSize="sm" color="red.500" fontWeight="semibold">
                                  Shortfall: {allocation.shortfallQuantity}
                                </Text>
                              )}
                            </>
                          );
                        }
                        return null;
                      })()}
                    </HStack>
                    {details.mainReservation.neededByDate && (
                      <Text fontSize="sm" color="gray.500">
                        Needed by: {new Date(details.mainReservation.neededByDate).toLocaleDateString()}
                      </Text>
                    )}
                    <HStack spacing={2} pt={2}>
                      <Badge colorScheme={getLevelColor(0)} variant="solid">
                        Level {details.mainReservation.level} (Root)
                      </Badge>
                      <Badge 
                        colorScheme={details.mainReservation.status === 'pending' ? 'yellow' : 'green'}
                        variant="outline"
                      >
                        {details.mainReservation.status}
                      </Badge>
                    </HStack>
                  </VStack>
                </HStack>
              </Box>

              {/* Tabs for detailed information */}
              <Tabs variant="enclosed">
                <TabList>
                  <Tab>BOM Hierarchy ({(details.childReservations.length + (details.mainReservation ? 1 : 0))})</Tab>
                  <Tab>Allocations ({details.allocations.length})</Tab>
                  <Tab>Purchase Requirements ({details.purchaseRequirements.length})</Tab>
                </TabList>

                <TabPanels>
                  {/* BOM Hierarchy Tab */}
                  <TabPanel>
                    <VStack spacing={3} align="stretch">
                      {/* Show root reservation first */}
                      {details.mainReservation && (
                        <Box
                          p={4}
                          bg={getLevelBgColor(0, colorMode)}
                          borderLeft="4px solid"
                          borderLeftColor={`${getLevelColor(0)}.400`}
                          borderRadius="md"
                        >
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={2}>
                              <HStack>
                                <Badge colorScheme={getLevelColor(0)} variant="solid">
                                  Level {details.mainReservation.level} (Root)
                                </Badge>
                                <Badge 
                                  colorScheme={details.mainReservation.status === 'pending' ? 'yellow' : 'green'}
                                  variant="outline"
                                >
                                  {details.mainReservation.status}
                                </Badge>
                              </HStack>
                              <Text fontWeight="semibold">
                                {details.mainReservation.componentName}
                              </Text>
                              <HStack spacing={4}>
                                <Text fontSize="sm" color="gray.600">
                                  Quantity: {details.mainReservation.quantity}
                                </Text>
                                {(() => {
                                  const allocation = details.allocations.find(a => a.componentName === details.mainReservation.componentName);
                                  if (allocation) {
                                    return (
                                      <>
                                        <Text fontSize="sm" color="green.500" fontWeight="semibold">
                                          Allocated: {allocation.allocatedQuantity}
                                        </Text>
                                        {allocation.shortfallQuantity > 0 && (
                                          <Text fontSize="sm" color="red.500" fontWeight="semibold">
                                            Shortfall: {allocation.shortfallQuantity}
                                          </Text>
                                        )}
                                      </>
                                    );
                                  }
                                  return null;
                                })()}
                              </HStack>
                              {details.mainReservation.neededByDate && (
                                <Text fontSize="sm" color="gray.500">
                                  Needed by: {new Date(details.mainReservation.neededByDate).toLocaleDateString()}
                                </Text>
                              )}
                            </VStack>
                          </HStack>
                        </Box>
                      )}
                      
                      {/* Show child reservations */}
                      {details.childReservations.length > 0 ? (
                        details.childReservations.map((reservation, index) => (
                          <Box
                            key={`${reservation.id}-${reservation.componentName}`}
                            p={4}
                            bg={getLevelBgColor(reservation.level, colorMode)}
                            borderLeft="4px solid"
                            borderLeftColor={`${getLevelColor(reservation.level)}.400`}
                            borderRadius="md"
                            ml={`${reservation.level * 20}px`} // Indent based on level
                          >
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={2}>
                                <Text fontWeight="semibold">
                                  {reservation.componentName}
                                </Text>
                                <HStack spacing={4}>
                                  <Text fontSize="sm" color="gray.600">
                                    Quantity: {reservation.quantity}
                                  </Text>
                                  {(() => {
                                    const allocation = details.allocations.find(a => a.componentName === reservation.componentName);
                                    if (allocation) {
                                      return (
                                        <>
                                          <Text fontSize="sm" color="green.500" fontWeight="semibold">
                                            Allocated: {allocation.allocatedQuantity}
                                          </Text>
                                          {allocation.shortfallQuantity > 0 && (
                                            <Text fontSize="sm" color="red.500" fontWeight="semibold">
                                              Shortfall: {allocation.shortfallQuantity}
                                            </Text>
                                          )}
                                        </>
                                      );
                                    }
                                    return null;
                                  })()}
                                </HStack>
                                {reservation.neededByDate && (
                                  <Text fontSize="sm" color="gray.500">
                                    Needed by: {new Date(reservation.neededByDate).toLocaleDateString()}
                                  </Text>
                                )}
                                <HStack spacing={2} pt={2}>
                                  <Badge colorScheme={getLevelColor(reservation.level)} variant="solid">
                                    Level {reservation.level}
                                  </Badge>
                                  <Badge 
                                    colorScheme={reservation.status === 'pending' ? 'yellow' : 'green'}
                                    variant="outline"
                                  >
                                    {reservation.status}
                                  </Badge>
                                  {reservation.level > 1 && (
                                    <Icon as={MdKeyboardArrowRight as any} color="gray.400" />
                                  )}
                                </HStack>
                              </VStack>
                            </HStack>
                          </Box>
                        ))
                      ) : (
                        <Text color="gray.500" textAlign="center" py={4}>
                          No child components in BOM
                        </Text>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Allocations Tab */}
                  <TabPanel>
                    {details.allocations.length > 0 ? (
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Component</Th>
                            <Th isNumeric>Allocated</Th>
                            <Th isNumeric>Shortfall</Th>
                            <Th>Order</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {details.allocations.map((allocation, index) => (
                            <Tr key={`${allocation.reservationId}-${allocation.componentName}`}>
                              <Td>{allocation.componentName}</Td>
                              <Td isNumeric color="green.500" fontWeight="semibold">
                                {allocation.allocatedQuantity}
                              </Td>
                              <Td isNumeric color={allocation.shortfallQuantity > 0 ? "red.500" : "gray.500"}>
                                {allocation.shortfallQuantity}
                              </Td>
                              <Td>{allocation.allocationOrder}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <Text color="gray.500" textAlign="center" py={8}>
                        No allocations found
                      </Text>
                    )}
                  </TabPanel>

                  {/* Purchase Requirements Tab */}
                  <TabPanel>
                    {details.purchaseRequirements.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {details.purchaseRequirements.map((req) => (
                          <Box
                            key={req.id}
                            p={4}
                            bg={bgColor}
                            border="1px solid"
                            borderColor={borderColor}
                            borderRadius="md"
                          >
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={2}>
                                <HStack>
                                  <Badge colorScheme="red" variant="solid">
                                    Purchase Required
                                  </Badge>
                                  <Badge colorScheme="gray" variant="outline">
                                    {req.status}
                                  </Badge>
                                </HStack>
                                <Text fontWeight="semibold">{req.componentName}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  Quantity: {req.requiredQuantity}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  Needed by: {new Date(req.neededByDate).toLocaleDateString()}
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Text color="gray.500" textAlign="center" py={8}>
                        No purchase requirements
                      </Text>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              No reservation details found
            </Text>
          )}
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 