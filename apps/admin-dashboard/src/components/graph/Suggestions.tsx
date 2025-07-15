import React from 'react';
import { Box, List, ListItem, HStack, Text } from '@chakra-ui/react';
import { InfoIcon, SearchIcon } from '../common/IconWrapper';

interface SuggestionsProps {
  searchResults: string[];
  onSelect: (result: string) => void;
  colors: {
    suggestionsBg: string;
    borderColor: string;
    headerBg: string;
    headerBorderColor: string;
    suggestionsHoverBg: string;
    textColorSecondary: string;
  };
}

export const Suggestions: React.FC<SuggestionsProps> = ({
  searchResults,
  onSelect,
  colors,
}) => (
  <Box
    position="absolute"
    top="100%"
    left={0}
    right={0}
    zIndex={1000}
    bg={colors.suggestionsBg}
    border="1px solid"
    borderColor={colors.borderColor}
    borderRadius="md"
    maxH="200px"
    overflowY="auto"
    boxShadow="lg"
  >
    <Box
      p={2}
      bg={colors.headerBg}
      borderBottom="1px solid"
      borderColor={colors.headerBorderColor}
    >
      <HStack spacing={2}>
        <InfoIcon size="16px" color="blue" />
        <Text fontSize="xs" fontWeight="medium">
          Click to create component with this name:
        </Text>
      </HStack>
    </Box>
    <List spacing={0}>
      {searchResults.map((result, index) => (
        <ListItem
          key={index}
          p={3}
          cursor="pointer"
          _hover={{
            bg: colors.suggestionsHoverBg,
            transform: 'translateX(2px)',
          }}
          borderBottom={index < searchResults.length - 1 ? '1px solid' : 'none'}
          borderColor={colors.borderColor}
          transition="all 0.2s"
          onClick={() => onSelect(result)}
        >
          <HStack spacing={2}>
            <SearchIcon size="16px" color="blue" />
            <Text fontSize="sm" fontWeight="medium">
              {result}
            </Text>
            <Text fontSize="xs" color={colors.textColorSecondary}>
              (click to add)
            </Text>
          </HStack>
        </ListItem>
      ))}
    </List>
  </Box>
);
