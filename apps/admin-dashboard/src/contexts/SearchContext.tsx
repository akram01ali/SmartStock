import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredComponents: any[];
  setFilteredComponents: (components: any[]) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredComponents, setFilteredComponents] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const value = {
    searchQuery,
    setSearchQuery,
    filteredComponents,
    setFilteredComponents,
    isSearching,
    setIsSearching,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}; 