export const getStockStatus = (current: number, threshold: number): string => {
  if (current <= 0) return 'out-of-stock';
  if (current <= threshold) return 'low-stock';
  return 'in-stock';
};

export const getStockStatusColor = (status: string) => {
  switch (status) {
    case 'out-of-stock':
      return { color: '#FF4757' };
    case 'low-stock':
      return { color: '#FFA726' };
    case 'in-stock':
    default:
      return { color: '#4CAF50' };
  }
}; 