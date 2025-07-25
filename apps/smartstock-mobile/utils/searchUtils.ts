import { useEffect, useState, useCallback } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useDebouncedSearch = (
  searchFunction: (query: string) => void,
  delay: number = 500
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, delay);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchFunction(debouncedQuery);
    }
  }, [debouncedQuery, searchFunction]);

  return { searchQuery, setSearchQuery };
}; 