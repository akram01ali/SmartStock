import React, { useCallback } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Flex,
  VStack,
  Badge,
  HStack,
  Image,
  Center,
  AspectRatio,
  useColorModeValue,
} from '@chakra-ui/react';

import { Measures, TypeOfComponent } from '../graph/types';
import SmoothCard from 'components/card/MotionCard';
import { InventoryIcon } from '../common/IconWrapper';

// Types
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

interface InventoryCardProps {
  item: Component;
  index: number;
  onItemClick: (item: Component) => void;
  getTypeGradient: (type: TypeOfComponent) => string;
  textColor: string;
  textColorSecondary: string;
  cardShadow: string;
  imageFallbackBg: string;
}

// Constants
const IMAGE_ASPECT_RATIO = 4 / 3;
const ICON_SIZE = '32px';
const PROGRESS_BAR_HEIGHT = '6px';

// Optimized component card with memoization
const InventoryCard = React.memo<InventoryCardProps>(({
  item,
  index,
  onItemClick,
  getTypeGradient,
  textColor,
  textColorSecondary,
  cardShadow,
  imageFallbackBg,
}) => {
  // Color mode values
  const fallbackIconColor = useColorModeValue('gray.400', 'gray.500');
  const progressBarBg = useColorModeValue('gray.100', 'gray.600');

  // Computed values
  const isLowStock = item.amount < item.triggerMinAmount;
  const stockPercentage = Math.min((item.amount / (item.triggerMinAmount || 1)) * 100, 100);
  const stockColor = isLowStock ? 'red.400' : 'green.400';

  // Event handlers
  const handleClick = useCallback(() => {
    onItemClick(item);
  }, [item, onItemClick]);

  const handleImageError = useCallback(() => {
    console.log(`Image failed to load for ${item.componentName}:`, item.image);
  }, [item.componentName, item.image]);

  // Render helpers
  const renderImageFallback = useCallback(() => (
    <Center bg={imageFallbackBg} w="100%" h="100%">
      <VStack spacing={2}>
        <InventoryIcon size={ICON_SIZE} color={fallbackIconColor} />
        <Text fontSize="xs" color={fallbackIconColor} textAlign="center" px={2}>
          {item.image ? 'No Image' : 'No Image Available'}
        </Text>
      </VStack>
    </Center>
  ), [imageFallbackBg, fallbackIconColor, item.image]);

  const renderImage = useCallback(() => (
    <AspectRatio ratio={IMAGE_ASPECT_RATIO} bg={imageFallbackBg} borderRadius="20px 20px 0 0">
      {item.image ? (
        <Image
          src={item.image}
          alt={item.componentName}
          objectFit="cover"
          borderRadius="20px 20px 0 0"
          fallback={renderImageFallback()}
          onError={handleImageError}
        />
      ) : (
        renderImageFallback()
      )}
    </AspectRatio>
  ), [item.image, item.componentName, imageFallbackBg, renderImageFallback, handleImageError]);

  const renderHeader = useCallback(() => (
    <Box bg={getTypeGradient(item.type)} p={3} position="relative">
      <Flex justify="space-between" align="center">
        <Text color="white" fontSize="md" fontWeight="bold" noOfLines={1}>
          {item.componentName}
        </Text>
        <Badge
          bg="rgba(255, 255, 255, 0.2)"
          color="white"
          borderRadius="full"
          px={2}
          py={1}
          fontSize="xs"
          backdropFilter="blur(10px)"
        >
          {item.type}
        </Badge>
      </Flex>
    </Box>
  ), [getTypeGradient, item.type, item.componentName]);

  const renderStatItem = useCallback((label: string, value: string | number, unit?: string) => (
    <Box>
      <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
        {label}
      </Text>
      <Text color={textColor} fontWeight="bold" fontSize="lg">
        {value}
      </Text>
      {unit && (
        <Text color={textColorSecondary} fontSize="xs">
          {unit}
        </Text>
      )}
    </Box>
  ), [textColor, textColorSecondary]);

  const renderStockLevel = useCallback(() => (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text color={textColorSecondary} fontSize="sm">
          Stock Level
        </Text>
        {isLowStock && (
          <Badge colorScheme="red" size="sm">
            Low Stock
          </Badge>
        )}
      </HStack>
      <Box bg={progressBarBg} borderRadius="full" h={PROGRESS_BAR_HEIGHT} overflow="hidden">
        <Box
          bg={stockColor}
          h="100%"
          w={`${stockPercentage}%`}
          transition="all 0.3s ease"
        />
      </Box>
    </Box>
  ), [textColorSecondary, isLowStock, progressBarBg, stockColor, stockPercentage]);

  const renderSupplierInfo = useCallback(() => (
    <Text color={textColorSecondary} fontSize="xs" noOfLines={1}>
      Supplier:{' '}
      <Text as="span" color={textColor} fontWeight="500">
        {item.supplier}
      </Text>
    </Text>
  ), [textColorSecondary, textColor, item.supplier]);

  return (
    <SmoothCard
      onClick={handleClick}
      cursor="pointer"
      boxShadow={cardShadow}
      position="relative"
      overflow="hidden"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
      transition="all 0.2s"
    >
      {/* Image Section */}
      {renderImage()}

      {/* Card Header with Gradient */}
      {renderHeader()}

      {/* Card Content */}
      <VStack align="stretch" spacing={3} p={4}>
        {/* Stats Grid */}
        <SimpleGrid columns={2} spacing={4}>
          {renderStatItem('Amount', item.amount, item.measure)}
          {renderStatItem('Cost', `€${item.cost}`, 'per unit')}
        </SimpleGrid>

        {/* Stock Status */}
        {renderStockLevel()}

        {/* Supplier Info */}
        {renderSupplierInfo()}
      </VStack>
    </SmoothCard>
  );
});

// Set display name for debugging
InventoryCard.displayName = 'InventoryCard';

export default InventoryCard;