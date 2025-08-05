export interface Reservation {
  id: string;
  isRoot: boolean;
  level: number;
  title: string;
  componentName: string;
  quantity: number;
  priority: number;
  requestedBy: string;
  neededByDate?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface ReservationCreate {
  title: string;
  componentName: string;
  quantity: number;
  priority: number;
  neededByDate?: string;
}

export interface ReservationBreakdown {
  reservationId: string;
  breakdown: Reservation[];
}

export interface ReservationDetails {
  mainReservation: Reservation | null;
  allocations: ReservationAllocation[];
  purchaseRequirements: PurchaseRequirement[];
  childReservations: Reservation[];
}

export interface AvailabilityCheck {
  componentName: string;
  requestedQuantity: number;
  currentStock: number;
  alreadyAllocated: number;
  availableStock: number;
  canFulfill: boolean;
  shortfall: number;
}

export interface PurchaseRequirement {
  id: string;
  componentName: string;
  requiredQuantity: number;
  neededByDate: string;
  status: string;
  createdAt: string;
}

export interface ReservationAllocation {
  reservationId: string;
  componentName: string;
  allocatedQuantity: number;
  shortfallQuantity: number;
  allocationOrder: number;
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ForecastingSummary {
  totalReservations: number;
  pendingReservations: number;
  totalPurchaseRequirements: number;
  urgentRequirements: number;
} 