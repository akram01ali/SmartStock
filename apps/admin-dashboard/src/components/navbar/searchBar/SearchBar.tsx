import {
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useSearch } from '../../../contexts/SearchContext';
import { useLocation } from 'react-router-dom';

export function SearchBar(props: {
  variant?: string;
  background?: string;
  children?: JSX.Element;
  placeholder?: string;
  borderRadius?: string | number;
  [x: string]: any;
}) {
  // Pass the computed styles into the `__css` prop
  const { variant, background, children, placeholder, borderRadius, ...rest } =
    props;
  
  const { searchQuery, setSearchQuery } = useSearch();
  const location = useLocation();
  
  // Check which page we're on
  const isInventoryPage = location.pathname.includes('/inventory');
  const isComponentsPage = location.pathname.includes('/components');
  const isChecklistPage = location.pathname.includes('/control-checklists');
  
  // Chakra Color Mode
  const searchIconColor = useColorModeValue('gray.700', 'white');
  const inputBg = useColorModeValue('secondaryGray.300', 'navy.900');
  const inputText = useColorModeValue('gray.700', 'gray.100');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
  };

  const getPlaceholder = () => {
    if (isInventoryPage) {
      return 'Search components...';
    } else if (isComponentsPage) {
      return 'Search groups, assemblies, printers...';
    } else if (isChecklistPage) {
      return 'Search systems...';
    }
    return placeholder || 'Search...';
  };

  // Only show search functionality on inventory, components, and checklist pages
  const isSearchEnabled = isInventoryPage || isComponentsPage || isChecklistPage;

  return (
    <InputGroup w={{ base: '100%', md: '200px' }} {...rest}>
      <InputLeftElement
        children={
          <IconButton
            aria-label="search"
            bg="inherit"
            borderRadius="inherit"
            _active={{
              bg: 'inherit',
              transform: 'none',
              borderColor: 'transparent',
            }}
            _focus={{
              boxShadow: 'none',
            }}
            icon={<SearchIcon color={searchIconColor} w="15px" h="15px" />}
          />
        }
      />
      <Input
        variant="search"
        fontSize="sm"
        bg={background ? background : inputBg}
        color={inputText}
        fontWeight="500"
        _placeholder={{ color: 'gray.400', fontSize: '14px' }}
        borderRadius={borderRadius ? borderRadius : '30px'}
        placeholder={getPlaceholder()}
        value={isSearchEnabled ? searchQuery : ''}
        onChange={isSearchEnabled ? handleSearchChange : undefined}
        disabled={!isSearchEnabled}
      />
    </InputGroup>
  );
}
