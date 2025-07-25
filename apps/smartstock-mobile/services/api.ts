export interface AppUser {
  name: string;
  surname: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    name: string;
    surname: string;
  };
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

const getBaseUrl = () => {
  return process.env.API_BASE_URL;
};

export class ApiService {
  private static readonly BASE_URL = getBaseUrl();

  private static async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeoutMs: number = 10000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ Request failed to ${url}:`, error);
      throw error;
    }
  }

  private static async tryMultipleHosts<T>(
    path: string, 
    options: RequestInit
  ): Promise<T> {
    const errors: string[] = [];
    
    try {
      const response = await this.fetchWithTimeout(`${this.BASE_URL}${path}`, options, 10000);
      
      if (response.ok) {
        return await response.json();
      } else {
        const errorText = await response.text();
        errors.push(`Main URL (${this.BASE_URL}): HTTP ${response.status} - ${errorText}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Main URL (${this.BASE_URL}): ${errorMsg}`);
    }

    for (const baseUrl of FALLBACK_IPS) {
      try {
        const response = await this.fetchWithTimeout(`${baseUrl}${path}`, options, 5000);
        
        if (response.ok) {
          return await response.json();
        } else {
          const errorText = await response.text();
          errors.push(`${baseUrl}: HTTP ${response.status} - ${errorText}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${baseUrl}: ${errorMsg}`);
      }
    }
    
    throw new Error(`Could not connect to server. Tried ${errors.length} endpoints:\n${errors.join('\n')}`);
  }

  static async login(credentials: AppUser): Promise<AuthResponse> {
    try {
      const data = await this.tryMultipleHosts<AuthResponse>('/app-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      return data;
    } catch (error) {
      console.error('API Service: Login failed:', error);
      throw error;
    }
  }

  static async register(credentials: AppUser): Promise<any> {
    try {
      const data = await this.tryMultipleHosts<any>('/app-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      return data;
    } catch (error) {
      console.error('API Service: Registration failed:', error);
      throw error;
    }
  }

  static async updateStock(
    componentName: string,
    amount: number,
    absolute: boolean = false,
    token: string,
    scannedBy: string = "mobile-app"
  ): Promise<any> {
    try {
      const data = await this.tryMultipleHosts<any>(
        `/components/${encodeURIComponent(componentName)}/stock?amount=${amount}&absolute=${absolute}&scannedBy=${encodeURIComponent(scannedBy)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return data;
    } catch (error) {
      console.error('API Service: Stock update failed:', error);
      throw error;
    }
  }

  static async getComponent(componentName: string, token: string): Promise<any> {
    try {
      const data = await this.tryMultipleHosts<any>(
        `/component/${encodeURIComponent(componentName)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return data;
    } catch (error) {
      console.error('API Service: Failed to fetch component:', error);
      throw error;
    }
  }

  static async updateComponent(componentName: string, componentData: any, token: string): Promise<any> {
    try {
      const data = await this.tryMultipleHosts<any>(
        `/components/${encodeURIComponent(componentName)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(componentData),
        }
      );

      return data;
    } catch (error) {
      console.error('Error updating component:', error);
      throw error;
    }
  }

  static async createComponent(componentData: any, root: string = "", token: string): Promise<any> {
    try {
      const data = await this.tryMultipleHosts<any>(
        `/components?root=${encodeURIComponent(root)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(componentData),
        }
      );

      return data;
    } catch (error) {
      console.error('Error creating component:', error);
      throw error;
    }
  }

  static async updateStockWithQRCode(
    componentName: string,
    amount: number,
    absolute: boolean = false,
    token: string,
    scannedBy: string = "mobile-qr-scanner"
  ): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        component_name: componentName,
        amount: amount.toString(),
        absolute: absolute.toString(),
        scannedBy: scannedBy
      });

      const data = await this.tryMultipleHosts<any>(
        `/components/scan-update?${queryParams.toString()}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return data;
    } catch (error) {
      console.error('API Service: Stock update with QR code failed:', error);
      throw error;
    }
  }

  static async updateStockWithImage(
    imageUri: string,
    amount: number,
    absolute: boolean = false,
    token: string,
    scannedBy: string = "mobile-app"
  ): Promise<any> {
    try {
      const formData = new FormData();
      
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'barcode_image.jpg',
      } as any);
      
      formData.append('amount', amount.toString());
      formData.append('absolute', absolute.toString());
      formData.append('scannedBy', scannedBy);

      const data = await this.tryMultipleHosts<any>(
        `/components/scan-update`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      return data;
    } catch (error) {
      console.error('API Service: Stock update with image failed:', error);
      throw error;
    }
  }

  static async getAllComponents(token: string): Promise<any[]> {
    try {
      const data = await this.tryMultipleHosts<any[]>('/all_components', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return data;
    } catch (error) {
      console.error('API Service: Failed to fetch components:', error);
      throw error;
    }
  }

  static async getAllComponentsLightPaginated(page: number = 1, pageSize: number = 50, token: string): Promise<{ data: any[], pagination: any }> {
    try {
      const data = await this.tryMultipleHosts<{ data: any[], pagination: any }>(`/all_components_light_paginated?page=${page}&page_size=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return data;
    } catch (error) {
      console.error('API Service: Failed to fetch paginated components:', error);
      throw error;
    }
  }

  static async searchComponents(query: string, page: number = 1, pageSize: number = 50, token: string): Promise<{ data: any[], pagination: any, search_query: string }> {
    try {
      const data = await this.tryMultipleHosts<{ data: any[], pagination: any, search_query: string }>(`/search_components?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return data;
    } catch (error) {
      console.error('API Service: Failed to search components:', error);
      throw error;
    }
  }

  static async testConnectivity(): Promise<string> {
    try {
      const data = await this.tryMultipleHosts<any>('/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return `Connected successfully: ${data.message}`;
    } catch (error) {
      console.error('Connectivity test failed:', error);
      throw new Error('Cannot connect to server. Check your network connection.');
    }
  }
}

export default ApiService; 