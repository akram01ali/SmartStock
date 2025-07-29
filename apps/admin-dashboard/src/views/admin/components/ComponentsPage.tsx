import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdGroups, MdPrint, MdBuild } from 'react-icons/md';

import { ApiService } from '../../../services/service';
import SmoothCard from 'components/card/MotionCard';
import SmoothMotionBox, { fadeInUp } from 'components/transitions/MotionBox';
import { useSearch } from '../../../contexts/SearchContext';
import { ComponentDialog } from '../../../components/graph/componentDialog';
import { ComponentCreate, Measures, TypeOfComponent } from '../../../components/graph/types';
import { AddIcon } from '../../../components/common/IconWrapper';

// Types
interface Component {
  componentName: string;
  type: TypeOfComponent;
}

type CreateType = 'printer' | 'group' | 'assembly';

// Constants
const TOAST_DURATION = 3000;

const COMPONENT_SECTIONS = [
  {
    type: 'printer' as CreateType,
    title: 'Printers',
    icon: MdPrint,
    gradient: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)',
    colorScheme: 'blue',
    componentType: TypeOfComponent.Printer,
  },
  {
    type: 'group' as CreateType,
    title: 'Groups',
    icon: MdGroups,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    colorScheme: 'purple',
    componentType: TypeOfComponent.Group,
  },
  {
    type: 'assembly' as CreateType,
    title: 'Assemblies',
    icon: MdBuild,
    gradient: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
    colorScheme: 'green',
    componentType: TypeOfComponent.Assembly,
  },
] as const;

const CREATE_API_MAP = {
  printer: (data: ComponentCreate, root: string) => ApiService.createPrinter(data, root),
  group: (data: ComponentCreate, root: string) => ApiService.createGroup(data, root),
  assembly: (data: ComponentCreate, root: string) => ApiService.createAssembly(data, root),
} as const;

type SectionConfig = typeof COMPONENT_SECTIONS[number];

export default function ComponentsPage() {
  // State
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [createType, setCreateType] = useState<CreateType | null>(null);

  // Hooks
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { searchQuery, setSearchQuery } = useSearch();

  // Color mode values
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textColorSecondary = useColorModeValue('secondaryGray.600', 'white');
  const cardShadow = useColorModeValue(
    '0px 18px 40px rgba(112, 144, 176, 0.12)',
    'unset',
  );

  // Utility functions
  const showToast = useCallback((title: string, description: string, status: 'success' | 'error') => {
    toast({
      title,
      description,
      status,
      duration: TOAST_DURATION,
    });
  }, [toast]);

  const showErrorToast = useCallback((error: unknown, title: string) => {
    const description = error instanceof Error ? error.message : 'Failed to complete operation';
    showToast(title, description, 'error');
  }, [showToast]);

  // Memoized filtered components by type
  const componentsByType = useMemo(() => {
    const filterComponents = (type: TypeOfComponent) => {
      let filtered = components.filter(component => component.type === type);
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(component =>
          component.componentName.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    };

    return {
      printers: filterComponents(TypeOfComponent.Printer),
      groups: filterComponents(TypeOfComponent.Group),
      assemblies: filterComponents(TypeOfComponent.Assembly),
    };
  }, [components, searchQuery]);

  const totalResults = useMemo(() => {
    return componentsByType.printers.length + componentsByType.groups.length + componentsByType.assemblies.length;
  }, [componentsByType]);

  const totalComponents = components.length;

  // API functions
  const fetchAllComponents = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching printers, groups, and assemblies...');
      const components = await ApiService.getPrintersGroupsAssemblies() as Component[];
      console.log('Components loaded:', components);
      setComponents(components || []);
    } catch (error) {
      console.error('Error fetching components:', error);
      showErrorToast(error, 'Error fetching components');
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  // Event handlers
  const handleCardClick = useCallback((componentName: string) => {
    navigate(`/admin/graph/${componentName}`);
  }, [navigate]);

  const handleCreateClick = useCallback((type: CreateType) => {
    setCreateType(type);
    onOpen();
  }, [onOpen]);

  const handleComponentSubmit = useCallback(async (componentData: ComponentCreate) => {
    if (!createType) {
      showToast('Validation Error', 'Component type is required', 'error');
      return;
    }

    try {
      const section = COMPONENT_SECTIONS.find(s => s.type === createType);
      if (!section) {
        throw new Error('Invalid component type');
      }

      const finalComponentData = {
        ...componentData,
        type: section.componentType,
      };

      const createFunction = CREATE_API_MAP[createType];
      await createFunction(finalComponentData, componentData.componentName);

      showToast(
        `${section.title.slice(0, -1)} Created`,
        `${componentData.componentName} has been created successfully`,
        'success'
      );

      // Refresh data
      await fetchAllComponents();
      onClose();
    } catch (error) {
      showErrorToast(error, 'Error creating component');
    }
  }, [createType, showToast, showErrorToast, fetchAllComponents, onClose]);

  const getInitialComponent = useCallback((): ComponentCreate | null => {
    if (!createType) return null;
    
    const section = COMPONENT_SECTIONS.find(s => s.type === createType);
    if (!section) return null;
    
    return {
      componentName: '',
      amount: 0,
      measure: Measures.Amount,
      lastScanned: new Date().toISOString(),
      scannedBy: '',
      durationOfDevelopment: 0,
      triggerMinAmount: 0,
      supplier: '',
      cost: 0,
      type: section.componentType,
      description: '',
      image: '',
    };
  }, [createType]);

  // Render helpers
  const renderComponentCard = useCallback((component: Component, index: number, gradient: string) => (
    <SmoothCard
      key={component.componentName}
      onClick={() => handleCardClick(component.componentName)}
      cursor="pointer"
      p="20px"
      boxShadow={cardShadow}
      bg={gradient}
      color="white"
      borderRadius="20px"
      position="relative"
      overflow="hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.1, duration: 0.3 },
      }}
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
      transition="all 0.2s"
    >
      <Flex direction="column" align="center" justify="center" minH="120px">
        <Text fontSize="lg" fontWeight="700" textAlign="center" lineHeight="1.2">
          {component.componentName}
        </Text>
      </Flex>
    </SmoothCard>
  ), [handleCardClick, cardShadow]);

  const renderComponentSection = useCallback((section: SectionConfig) => {
    const sectionComponents = componentsByType[section.type === 'printer' ? 'printers' : 
                                              section.type === 'group' ? 'groups' : 'assemblies'];
    const allSectionComponents = components.filter(c => c.type === section.componentType);

    return (
      <SmoothMotionBox key={section.title} variants={fadeInUp}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color={textColor}>
            {section.title} ({allSectionComponents.length})
          </Heading>
          <Button
            leftIcon={<AddIcon size="16px" />}
            colorScheme={section.colorScheme}
            size="sm"
            onClick={() => handleCreateClick(section.type)}
          >
            Create {section.title.slice(0, -1)}
          </Button>
        </Flex>

        {sectionComponents.length === 0 && searchQuery ? (
          <SmoothCard textAlign="center" py={10} borderRadius="lg" bg="gray.50">
            <Text fontSize="lg" color="gray.500">
              No {section.title.toLowerCase()} found matching "{searchQuery}"
            </Text>
          </SmoothCard>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
            {sectionComponents.map((component, index) => 
              renderComponentCard(component, index, section.gradient)
            )}
          </SimpleGrid>
        )}
      </SmoothMotionBox>
    );
  }, [componentsByType, components, textColor, searchQuery, handleCreateClick, renderComponentCard]);

  // Effects
  useEffect(() => {
    fetchAllComponents();
  }, [fetchAllComponents]);

  useEffect(() => {
    return () => setSearchQuery('');
  }, [setSearchQuery]);

  if (loading) {
    return (
      <SmoothMotionBox pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Flex justify="center" align="center" minH="200px">
          <Text fontSize="lg" color={textColorSecondary}>
            Loading Components...
          </Text>
        </Flex>
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
              Components
            </Heading>
            {searchQuery && (
              <Text color={textColorSecondary} fontSize="sm">
                Showing {totalResults} of {totalComponents} components matching "{searchQuery}"
              </Text>
            )}
          </VStack>
        </Flex>

        {/* Render component sections */}
        {COMPONENT_SECTIONS.map(renderComponentSection)}
      </VStack>

      <ComponentDialog
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleComponentSubmit}
        component={getInitialComponent()}
        mode="create"
      />
    </SmoothMotionBox>
  );
}
