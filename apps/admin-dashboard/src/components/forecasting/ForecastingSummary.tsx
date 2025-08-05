import React from 'react';
import {
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Box,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import {
  MdInventory,
  MdPending,
  MdShoppingCart,
  MdPriorityHigh,
} from 'react-icons/md';
import { ForecastingSummary as ForecastingSummaryType } from '../../types/forecasting';
import SmoothCard from '../card/MotionCard';

interface ForecastingSummaryProps {
  summary: ForecastingSummaryType;
  isLoading?: boolean;
}

const ForecastingSummary: React.FC<ForecastingSummaryProps> = ({
  summary,
  isLoading = false,
}) => {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'white');
  const cardShadow = useColorModeValue(
    '0px 18px 40px rgba(112, 144, 176, 0.12)',
    'unset',
  );

  const statCards = [
    {
      label: 'Total Reservations',
      value: summary.totalReservations,
      helpText: 'All active reservations',
      icon: MdInventory,
      gradient: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)',
    },
    {
      label: 'Pending Reservations',
      value: summary.pendingReservations,
      helpText: 'Awaiting allocation',
      icon: MdPending,
      gradient: 'linear-gradient(135deg, #F56565 0%, #E53E3E 100%)',
    },
    {
      label: 'Purchase Requirements',
      value: summary.totalPurchaseRequirements,
      helpText: 'Components to order',
      icon: MdShoppingCart,
      gradient: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
    },
    {
      label: 'Urgent Requirements',
      value: summary.urgentRequirements,
      helpText: 'Needed within 7 days',
      icon: MdPriorityHigh,
      gradient: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
    },
  ];

  const renderStatCard = (
    icon: React.ReactNode,
    label: string,
    value: string | number,
    helpText: string,
    gradient: string
  ) => (
    <SmoothCard boxShadow={cardShadow}>
      <Flex align="center" justify="space-between">
        <Stat>
          <StatLabel color={textColorSecondary}>{label}</StatLabel>
          <StatNumber color={textColor}>{isLoading ? '...' : value}</StatNumber>
          <StatHelpText color={textColorSecondary}>{helpText}</StatHelpText>
        </Stat>
        <Box bg={gradient} borderRadius="20px" p="15px">
          {icon}
        </Box>
      </Flex>
    </SmoothCard>
  );

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
      {statCards.map((card, index) => (
        <React.Fragment key={index}>
          {renderStatCard(
            <Icon as={card.icon as any} w="24px" h="24px" color="white" />,
            card.label,
            card.value,
            card.helpText,
            card.gradient
          )}
        </React.Fragment>
      ))}
    </SimpleGrid>
  );
};

export default ForecastingSummary; 