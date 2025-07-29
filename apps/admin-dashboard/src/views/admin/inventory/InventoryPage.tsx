import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  useColorModeValue,
  Flex,
  Button,
  VStack,
  useToast,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  HStack,
  Spinner,
  Badge,
  Center,
  ButtonGroup,
  IconButton,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { AnimatePresence } from 'framer-motion';

import { ApiService } from '../../../services/service';
import InventoryComponent from './InventoryComponent';
import LowStockView from './LowStockView';
import InventoryCard from '../../../components/inventory/InventoryCard';
import { ComponentDialog } from '../../../components/graph/componentDialog';
import {
  ComponentCreate,
  Measures,
  TypeOfComponent,
} from '../../../components/graph/types';
import { useSearch } from '../../../contexts/SearchContext';
import SmoothCard from 'components/card/MotionCard';
import SmoothMotionBox, {
  fadeIn,
  slideInFromLeft,
} from 'components/transitions/MotionBox';
import {
  AddIcon,
  InventoryIcon,
  WarningIcon,
  MoneyIcon,
} from '../../../components/common/IconWrapper';

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

interface PaginationInfo {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface Statistics {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
}

// Constants
const PAGE_SIZE = 10;
const TOAST_DURATION = 3000;

const TYPE_GRADIENTS = {
  [TypeOfComponent.Printer]: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)',
  [TypeOfComponent.Group]: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  [TypeOfComponent.Assembly]: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
  [TypeOfComponent.Component]: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
} as const;

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #718096 0%, #4a5568 100%)';

const TYPE_FILTER_CONFIG = [
  { key: 'all' as const, label: 'All Types', colorScheme: 'gray' as const },
  { key: TypeOfComponent.Component, label: 'Components', colorScheme: 'orange' as const },
  { key: TypeOfComponent.Assembly, label: 'Assemblies', colorScheme: 'green' as const },
  { key: TypeOfComponent.Group, label: 'Groups', colorScheme: 'purple' as const },
  { key: TypeOfComponent.Printer, label: 'Printers', colorScheme: 'blue' as const },
] as const;

type FilterConfig = typeof TYPE_FILTER_CONFIG[number];

export default function InventoryPage() {
  // State
  const [inventory, setInventory] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | TypeOfComponent>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({ 
    totalItems: 0, 
    lowStockItems: 0, 
    totalValue: 0 
  });
  const [isLowStockFilterActive, setIsLowStockFilterActive] = useState(false);

  // Hooks
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { searchQuery, setSearchQuery } = useSearch();
  const toast = useToast();

  // Color mode values
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'white');
  const cardShadow = useColorModeValue(
    '0px 18px 40px rgba(112, 144, 176, 0.12)',
    'unset',
  );
  const brandColor = useColorModeValue('brand.500', 'white');
  const imageFallbackBg = useColorModeValue('gray.100', 'gray.600');

  // Utility functions
  const getTypeGradient = useCallback((type: TypeOfComponent) => {
    return TYPE_GRADIENTS[type] || DEFAULT_GRADIENT;
  }, []);

  const showToast = useCallback((title: string, description: string, status: 'success' | 'error') => {
    toast({
      title,
      description,
      status,
      duration: TOAST_DURATION,
    });
  }, [toast]);

  const showErrorToast = useCallback((error: unknown, title: string) => {
    const description = error instanceof Error ? error.message : 'Unknown error';
    showToast(title, description, 'error');
  }, [showToast]);

  // API functions
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await ApiService.getComponentsStatistics(
        searchQuery || null,
        typeFilter === 'all' ? null : typeFilter,
        true
      ) as { total_count: number; low_stock_count: number; total_value: number };
      setStatistics({
        totalItems: stats.total_count,
        lowStockItems: stats.low_stock_count,
        totalValue: stats.total_value
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      showErrorToast(error, 'Error loading statistics');
      // Set default values on error
      setStatistics({
        totalItems: 0,
        lowStockItems: 0,
        totalValue: 0
      });
    }
  }, [searchQuery, typeFilter, showErrorToast]);

  const fetchInventory = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      const apiCall = searchQuery 
        ? () => ApiService.searchComponents(searchQuery, page, PAGE_SIZE, true, typeFilter === 'all' ? null : typeFilter)
        : () => ApiService.getAllComponentsWithImagesPaginated(page, PAGE_SIZE, true, 'url', typeFilter === 'all' ? null : typeFilter);
      
      const result = await apiCall() as { data: Component[]; pagination: PaginationInfo };
      const data = result.data || [];
      const paginationInfo = result.pagination;
      
      setInventory(data);
      setPagination(paginationInfo);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showErrorToast(error, 'Error fetching inventory');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, showErrorToast]);

  const refreshData = useCallback(() => {
    fetchInventory(currentPage);
    fetchStatistics();
  }, [fetchInventory, fetchStatistics, currentPage]);

  // Event handlers
  const handleItemClick = useCallback(async (item: Component) => {
    if (!item.image) {
      try {
        const fullComponent = await ApiService.getComponent(item.componentName);
        setSelectedComponent(fullComponent);
      } catch (error) {
        console.error('Error fetching full component:', error);
        setSelectedComponent(item);
      }
    } else {
      setSelectedComponent(item);
    }
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedComponent(null);
  }, []);

  const handleLowStockClick = useCallback(() => {
    setIsLowStockFilterActive(true);
    showToast(
      'Low Stock Filter Applied',
      `Showing ${statistics.lowStockItems} component(s) below minimum stock level`,
      'success'
    );
  }, [statistics.lowStockItems, showToast]);

  const handleClearLowStockFilter = useCallback(() => {
    setIsLowStockFilterActive(false);
    fetchInventory(1);
    showToast(
      'Filter Cleared',
      'Showing all components',
      'success'
    );
  }, [fetchInventory, showToast]);

  const handleAddComponent = useCallback(async (componentData: ComponentCreate) => {
    try {
      await ApiService.createComponent(componentData, 'root');
      showToast('Component created', `${componentData.componentName} has been added to inventory.`, 'success');
      onClose();
      refreshData();
    } catch (error) {
      console.error('Error creating component:', error);
      showErrorToast(error, 'Error creating component');
    }
  }, [showToast, showErrorToast, onClose, refreshData]);

  const handleEditComponent = useCallback(async (updatedComponent: Component) => {
    try {
      await ApiService.updateComponent(updatedComponent);
      showToast('Component updated', `${updatedComponent.componentName} has been updated.`, 'success');
      refreshData();
      setSelectedComponent(null);
    } catch (error) {
      console.error('Error updating component:', error);
      showErrorToast(error, 'Error updating component');
    }
  }, [showToast, showErrorToast, refreshData]);

  const handleDeleteComponent = useCallback(async (componentName: string) => {
    try {
      await ApiService.deleteComponent(componentName, true);
      showToast('Component deleted', `${componentName} has been removed from inventory.`, 'success');
      refreshData();
      setSelectedComponent(null);
    } catch (error) {
      console.error('Error deleting component:', error);
      showErrorToast(error, 'Error deleting component');
    }
  }, [showToast, showErrorToast, refreshData]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Effects
  useEffect(() => {
    fetchInventory(1);
    fetchStatistics();
  }, [searchQuery, typeFilter, fetchInventory, fetchStatistics]);

  useEffect(() => {
    fetchInventory(currentPage);
  }, [fetchInventory, currentPage]);

  useEffect(() => {
    return () => setSearchQuery('');
  }, [setSearchQuery]);

  // Computed values
  const hasFilters = searchQuery || typeFilter !== 'all';
  const isFiltered = hasFilters;

  // Render helpers
  const renderStatCard = (
    icon: React.ReactNode,
    label: string,
    value: string | number,
    helpText: string,
    gradient: string,
    color?: string,
    onClick?: () => void
  ) => (
    <SmoothCard 
      boxShadow={cardShadow}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      _hover={onClick ? { transform: 'translateY(-2px)', boxShadow: 'xl' } : {}}
      transition="all 0.2s"
    >
      <Flex align="center" justify="space-between">
        <Stat>
          <StatLabel color={textColorSecondary}>{label}</StatLabel>
          <StatNumber color={color || textColor}>{value}</StatNumber>
          <StatHelpText color={textColorSecondary}>{helpText}</StatHelpText>
        </Stat>
        <Box bg={gradient} borderRadius="20px" p="15px">
          {icon}
        </Box>
      </Flex>
    </SmoothCard>
  );

  const renderTypeFilterButton = (config: FilterConfig) => (
    <Button
      key={config.key}
      size="sm"
      variant={typeFilter === config.key ? 'solid' : 'outline'}
      colorScheme={config.colorScheme}
      onClick={() => setTypeFilter(config.key as any)}
    >
      {config.label}
    </Button>
  );

  const renderPaginationNumbers = () => {
    if (!pagination) return null;
    
    const { page, total_pages } = pagination;
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(total_pages, startPage + 4);
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
      const pageNum = startPage + i;
      return (
        <Button
          key={pageNum}
          onClick={() => handlePageChange(pageNum)}
          variant={pageNum === page ? 'solid' : 'outline'}
          colorScheme={pageNum === page ? 'blue' : 'gray'}
        >
          {pageNum}
        </Button>
      );
    });
  };

  // Loading state
  if (loading) {
    return (
      <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }} variants={fadeIn}>
        <Flex justify="center" align="center" minH="200px">
          <VStack spacing={4}>
            <Spinner size="xl" color={brandColor} thickness="4px" />
            <Text fontSize="lg" color={textColorSecondary}>
              Loading Inventory...
            </Text>
          </VStack>
        </Flex>
      </SmoothMotionBox>
    );
  }

  return (
    <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <AnimatePresence mode="wait">
        {selectedComponent ? (
          <SmoothMotionBox key="component-detail" variants={slideInFromLeft}>
            <InventoryComponent
              component={selectedComponent}
              onBack={handleBackToList}
              onEdit={handleEditComponent}
              onDelete={handleDeleteComponent}
            />
          </SmoothMotionBox>
        ) : isLowStockFilterActive ? (
          <SmoothMotionBox key="low-stock-view" variants={slideInFromLeft}>
            <LowStockView
              onBack={handleClearLowStockFilter}
              onEdit={handleEditComponent}
              onDelete={handleDeleteComponent}
              typeFilter={typeFilter}
            />
          </SmoothMotionBox>
        ) : (
          <SmoothMotionBox key="inventory-list">
            {/* Header */}
            <Flex justify="space-between" align="center" mb={6}>
              <VStack align="start" spacing={2}>
                <Flex align="center" gap={3}>
                  <Heading size="lg" color={textColor}>
                    Components Inventory
                  </Heading>
                </Flex>
                {hasFilters && (
                  <Text color={textColorSecondary} fontSize="sm">
                    Showing {inventory.length} of {pagination?.total_count || 0} components
                    {searchQuery && ` matching "${searchQuery}"`}
                    {typeFilter !== 'all' && ` of type "${typeFilter}"`}
                  </Text>
                )}
                {pagination && (
                  <HStack spacing={2}>
                    <Badge colorScheme="blue" variant="subtle">
                      Page {pagination.page} of {pagination.total_pages}
                    </Badge>
                    <Badge colorScheme="gray" variant="outline">
                      {pagination.total_count} total components
                      {typeFilter !== 'all' && ` (${typeFilter} type)`}
                    </Badge>
                  </HStack>
                )}
              </VStack>
              <Button
                leftIcon={<AddIcon size="16px" />}
                colorScheme="blue"
                size="lg"
                onClick={onOpen}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                transition="all 0.2s"
              >
                Add Component
              </Button>
            </Flex>

            {/* Statistics Cards */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
              {renderStatCard(
                <InventoryIcon size="24px" color="white" />,
                'Total Items',
                statistics.totalItems,
                isFiltered ? 'Matching your filters' : 'Components in database',
                'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)'
              )}
              {renderStatCard(
                <WarningIcon size="24px" color="white" />,
                'Low Stock Alert',
                statistics.lowStockItems,
                isFiltered 
                  ? `Click to view ${statistics.lowStockItems} low stock items (filtered)`
                  : `Click to view ${statistics.lowStockItems} items below minimum`,
                statistics.lowStockItems > 0
                  ? 'linear-gradient(135deg, #F56565 0%, #E53E3E 100%)'
                  : 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
                statistics.lowStockItems > 0 ? 'red.500' : textColor,
                statistics.lowStockItems > 0 ? handleLowStockClick : undefined
              )}
              {renderStatCard(
                <MoneyIcon size="24px" color="white" />,
                'Total Value',
                `€${statistics.totalValue.toFixed(2)}`,
                isFiltered ? 'Filtered inventory worth' : 'Total inventory worth',
                'linear-gradient(135deg, #48BB78 0%, #38A169 100%)'
              )}
            </SimpleGrid>

            {/* Type Filter Buttons */}
            <Box mb={6}>
              <Text color={textColorSecondary} fontSize="sm" mb={3} fontWeight="500">
                Filter by Type (server-side filtering):
              </Text>
              <HStack spacing={3} flexWrap="wrap">
                {TYPE_FILTER_CONFIG.map(renderTypeFilterButton)}
              </HStack>
            </Box>

            {/* Inventory Grid */}
            {inventory.length === 0 && searchQuery ? (
              <SmoothCard boxShadow={cardShadow} p={10}>
                <VStack spacing={4}>
                  <InventoryIcon size="48px" color="gray.400" />
                  <Text fontSize="lg" color="gray.500" textAlign="center">
                    No components found matching "{searchQuery}"
                  </Text>
                  <Text fontSize="sm" color="gray.400" textAlign="center">
                    Try adjusting your search terms or clear the search to see all components.
                  </Text>
                </VStack>
              </SmoothCard>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6} mb={8}>
                  {inventory.map((item, index) => (
                    <InventoryCard
                      key={item.componentName}
                      item={item}
                      index={index}
                      onItemClick={handleItemClick}
                      getTypeGradient={getTypeGradient}
                      textColor={textColor}
                      textColorSecondary={textColorSecondary}
                      cardShadow={cardShadow}
                      imageFallbackBg={imageFallbackBg}
                    />
                  ))}
                </SimpleGrid>

                {/* Pagination Controls */}
                {pagination && pagination.total_pages > 1 && (
                  <Center mb={8}>
                    <SmoothCard boxShadow={cardShadow} p={4}>
                      <VStack spacing={4}>
                        <Text fontSize="sm" color={textColorSecondary}>
                          Page {pagination.page} of {pagination.total_pages} • {pagination.total_count} total components
                        </Text>
                        <ButtonGroup size="sm" isAttached variant="outline">
                          <IconButton
                            aria-label="Previous page"
                            icon={<ChevronLeftIcon />}
                            onClick={() => handlePageChange(pagination.page - 1)}
                            isDisabled={!pagination.has_prev}
                          />
                          {renderPaginationNumbers()}
                          <IconButton
                            aria-label="Next page"
                            icon={<ChevronRightIcon />}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            isDisabled={!pagination.has_next}
                          />
                        </ButtonGroup>
                      </VStack>
                    </SmoothCard>
                  </Center>
                )}
              </>
            )}

            <ComponentDialog
              isOpen={isOpen}
              onClose={onClose}
              onSubmit={handleAddComponent}
              component={null} 
              mode="create" 
            />
          </SmoothMotionBox>
        )}
      </AnimatePresence>
    </SmoothMotionBox>
  );
}
