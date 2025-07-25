import { useState, useCallback } from 'react';

interface PaginationState {
  currentPage: number;
  hasMore: boolean;
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
}

export const usePagination = (pageSize: number = 30) => {
  const [state, setState] = useState<PaginationState>({
    currentPage: 1,
    hasMore: true,
    totalCount: 0,
    loading: false,
    loadingMore: false,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setLoadingMore = useCallback((loadingMore: boolean) => {
    setState(prev => ({ ...prev, loadingMore }));
  }, []);

  const updatePagination = useCallback((pagination: any, page: number) => {
    setState(prev => ({
      ...prev,
      currentPage: page,
      hasMore: pagination.has_next || false,
      totalCount: pagination.total_count || 0,
      loading: false,
      loadingMore: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      currentPage: 1,
      hasMore: true,
      totalCount: 0,
      loading: false,
      loadingMore: false,
    });
  }, []);

  return {
    ...state,
    setLoading,
    setLoadingMore,
    updatePagination,
    reset,
    pageSize,
  };
}; 