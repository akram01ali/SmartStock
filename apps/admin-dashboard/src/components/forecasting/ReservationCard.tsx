import React from 'react';
import {
  Box,
  Text,
  Badge,
  HStack,
  VStack,
  IconButton,
  Tooltip,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { MdVisibility, MdPriorityHigh, MdSchedule } from 'react-icons/md';
import { Reservation } from '../../types/forecasting';
import SmoothCard from '../card/MotionCard';

interface ReservationCardProps {
  reservation: Reservation;
  onViewBreakdown?: (reservationId: string) => void;
  showBreakdownButton?: boolean;
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onViewBreakdown,
  showBreakdownButton = true,
}) => {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'white');
  const iconBoxBg = useColorModeValue('gray.100', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'confirmed':
        return 'blue';
      case 'in_progress':
        return 'yellow';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'red.500';
    if (priority <= 5) return 'orange.500';
    return 'green.500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SmoothCard p={6} h="100%">
      <VStack align="stretch" spacing={4} h="100%">
        {/* Header with Status and Priority */}
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1} flex={1}>
            <Text color={textColor} fontSize="lg" fontWeight="600" noOfLines={1}>
              {reservation.title}
            </Text>
            <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
              {reservation.componentName}
            </Text>
            <Text color={textColorSecondary} fontSize="xs">
              by {reservation.requestedBy}
            </Text>
          </VStack>
          <VStack spacing={2} align="end">
            <Badge
              colorScheme={getStatusColor(reservation.status)}
              variant="subtle"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="md"
            >
              {reservation.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {reservation.priority > 0 && (
              <HStack spacing={1}>
                <Icon as={MdPriorityHigh as any} w="12px" h="12px" color={getPriorityColor(reservation.priority)} />
                <Text fontSize="xs" color={getPriorityColor(reservation.priority)} fontWeight="500">
                  P{reservation.priority}
                </Text>
              </HStack>
            )}
          </VStack>
        </HStack>

        {/* Quantity Display */}
        <Box
          bg={iconBoxBg}
          p={3}
          borderRadius="lg"
          textAlign="center"
        >
          <Text color={textColorSecondary} fontSize="xs" fontWeight="500" mb={1}>
            QUANTITY
          </Text>
          <Text color={textColor} fontSize="xl" fontWeight="700">
            {reservation.quantity}
          </Text>
        </Box>

        {/* Dates Section */}
        <VStack spacing={2} align="stretch" flex={1}>
          {reservation.neededByDate && (
            <HStack spacing={2}>
              <Icon as={MdSchedule as any} w="14px" h="14px" color="blue.500" />
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="xs" color={textColorSecondary} fontWeight="500">
                  Needed by
                </Text>
                <Text fontSize="sm" color={textColor}>
                  {formatDate(reservation.neededByDate)}
                </Text>
              </VStack>
            </HStack>
          )}
          
          <HStack spacing={2}>
            <Box w="14px" h="14px" />
            <VStack align="start" spacing={0} flex={1}>
              <Text fontSize="xs" color={textColorSecondary} fontWeight="500">
                Created
              </Text>
              <Text fontSize="sm" color={textColor}>
                {formatDateTime(reservation.createdAt)}
              </Text>
            </VStack>
          </HStack>
        </VStack>

        {/* Action Button */}
        {showBreakdownButton && onViewBreakdown && (
          <Box pt={2} borderTop="1px solid" borderColor={borderColor}>
            <Tooltip label="View BOM Breakdown">
              <IconButton
                aria-label="View breakdown"
                icon={<Icon as={MdVisibility as any} />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                w="100%"
                onClick={() => onViewBreakdown(reservation.id)}
              />
            </Tooltip>
          </Box>
        )}
      </VStack>
    </SmoothCard>
  );
};

export default ReservationCard; 