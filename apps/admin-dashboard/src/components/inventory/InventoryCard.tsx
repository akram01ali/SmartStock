import React from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Flex,
  VStack,
  Badge,

  HStack,
} from '@chakra-ui/react';

import {
    Measures,
  TypeOfComponent,
} from '../graph/types';
import SmoothCard from 'components/card/MotionCard';

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

// Optimized component card with memoization
const InventoryCard = React.memo(
  ({
    item,
    index,
    onItemClick,
    getTypeGradient,
    textColor,
    textColorSecondary,
    cardShadow,
    imageFallbackBg,
  }: {
    item: Component;
    index: number;
    onItemClick: (item: Component) => void;
    getTypeGradient: (type: TypeOfComponent) => string;
    textColor: string;
    textColorSecondary: string;
    cardShadow: string;
    imageFallbackBg: string;
  }) => {
    return (
      <SmoothCard
        onClick={() => onItemClick(item)}
        cursor="pointer"
        boxShadow={cardShadow}
        position="relative"
        overflow="hidden"
        _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
        transition="all 0.2s"
      >
        {/* Card Header with Gradient */}
        <Box
          bg={getTypeGradient(item.type)}
          p={4}
          borderRadius="20px 20px 0 0"
          mb={4}
          position="relative"
        >
          <Flex justify="space-between" align="center">
            <Text color="white" fontSize="lg" fontWeight="bold" noOfLines={1}>
              {item.componentName}
            </Text>
            <Badge
              bg="rgba(255, 255, 255, 0.2)"
              color="white"
              borderRadius="full"
              px={3}
              py={1}
              backdropFilter="blur(10px)"
            >
              {item.type}
            </Badge>
          </Flex>
        </Box>

        {/* Card Content */}
        <VStack align="stretch" spacing={3} p={4} pt={0}>
          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                Amount
              </Text>
              <Text color={textColor} fontWeight="bold" fontSize="lg">
                {item.amount}
              </Text>
              <Text color={textColorSecondary} fontSize="xs">
                {item.measure}
              </Text>
            </Box>
            <Box>
              <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                Cost
              </Text>
              <Text color={textColor} fontWeight="bold" fontSize="lg">
                €{item.cost}
              </Text>
              <Text color={textColorSecondary} fontSize="xs">
                per unit
              </Text>
            </Box>
          </SimpleGrid>

          {/* Stock Status */}
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text color={textColorSecondary} fontSize="sm">
                Stock Level
              </Text>
              {item.amount < item.triggerMinAmount && (
                <Badge colorScheme="red" size="sm">
                  Low Stock
                </Badge>
              )}
            </HStack>
            <Box bg="gray.100" borderRadius="full" h="6px" overflow="hidden">
              <Box
                bg={
                  item.amount < item.triggerMinAmount ? 'red.400' : 'green.400'
                }
                h="100%"
                w={`${Math.min(
                  (item.amount / (item.triggerMinAmount || 1)) * 100,
                  100,
                )}%`}
                transition="all 0.3s ease"
              />
            </Box>
          </Box>

          {/* Supplier Info */}
          <Text color={textColorSecondary} fontSize="xs" noOfLines={1}>
            Supplier:{' '}
            <Text as="span" color={textColor} fontWeight="500">
              {item.supplier}
            </Text>
          </Text>
        </VStack>
      </SmoothCard>
    );
  },
);

export default InventoryCard;