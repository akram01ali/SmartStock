const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export class ForecastingService {
  static getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async handleResponse(response) {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Request failed: ${response.status} ${response.statusText}`);
      } catch (parseError) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }
    }
    return await response.json();
  }

  // Reservation Management
  static async createReservation(reservationData) {
    const { title, componentName, quantity, priority, neededByDate } = reservationData;
    
    const params = new URLSearchParams({
      title,
      componentName,
      quantity: quantity.toString(),
      priority: priority.toString(),
    });

    if (neededByDate) {
      params.append('neededByDate', neededByDate);
    }

    const response = await fetch(`${API_URL}/forecasting/reservations?${params}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  static async getReservations(status = null, includeChildren = false) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (includeChildren) params.append('include_children', 'true');

    const response = await fetch(`${API_URL}/forecasting/reservations?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  static async getReservationBreakdown(reservationId) {
    const response = await fetch(`${API_URL}/forecasting/reservations/${reservationId}/breakdown`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  static async getReservationAllocations(reservationId) {
    const response = await fetch(`${API_URL}/forecasting/reservations/${reservationId}/allocations`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Availability & Planning
  static async checkAvailability(componentName, quantity) {
    const params = new URLSearchParams({
      quantity: quantity.toString()
    });

    const response = await fetch(`${API_URL}/forecasting/availability/${componentName}?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  static async getPurchaseRequirements(status = 'pending') {
    const params = new URLSearchParams({ status });

    const response = await fetch(`${API_URL}/forecasting/purchase-requirements?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  static async processAllocations() {
    const response = await fetch(`${API_URL}/forecasting/process-allocations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }
} 