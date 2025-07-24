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

// Smart API URL detection for different environments
const getBaseUrl = () => {
  return "http://10.0.0.104:8000"

};

// Fallback URLs to try in order
const FALLBACK_IPS = [
  'http://10.0.0.99:8000',      // Your current WiFi IP (primary working)
  'http://192.168.1.99:8000',   // Alternative common router IP
  'http://192.168.0.99:8000',   // Another common router IP
];

export class ApiService {
  private static readonly BASE_URL = getBaseUrl();

  // Helper function to add timeout to fetch
  private static async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeoutMs: number = 10000  // Increased timeout for production
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`🌐 Making request to: ${url}`);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log(`✅ Response received: ${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ Request failed to ${url}:`, error);
      throw error;
    }
  }

  // Try multiple hosts with better error reporting
  private static async tryMultipleHosts<T>(
    path: string, 
    options: RequestInit
  ): Promise<T> {
    const errors: string[] = [];
    
    // Try main URL first
    try {
      console.log('🔄 Trying main URL:', `${this.BASE_URL}${path}`);
      const response = await this.fetchWithTimeout(`${this.BASE_URL}${path}`, options, 10000);
      
      if (response.ok) {
        console.log('✅ Success with main URL:', this.BASE_URL);
        return await response.json();
      } else {
        const errorText = await response.text();
        errors.push(`Main URL (${this.BASE_URL}): HTTP ${response.status} - ${errorText}`);
        console.log('❌ Main URL failed:', response.status, response.statusText);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Main URL (${this.BASE_URL}): ${errorMsg}`);
      console.log('❌ Main URL failed with error:', errorMsg);
    }

    // Try fallback URLs
    for (const baseUrl of FALLBACK_IPS) {
      try {
        console.log('🔄 Trying fallback URL:', `${baseUrl}${path}`);
        const response = await this.fetchWithTimeout(`${baseUrl}${path}`, options, 5000); // Shorter timeout for fallback
        
        if (response.ok) {
          console.log('✅ Success with fallback URL:', baseUrl);
          return await response.json();
        } else {
          const errorText = await response.text();
          errors.push(`${baseUrl}: HTTP ${response.status} - ${errorText}`);
          console.log('❌ Fallback failed:', baseUrl, response.status);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${baseUrl}: ${errorMsg}`);
        console.log('❌ Fallback failed:', baseUrl, errorMsg);
      }
    }
    
    console.log('🚨 All connection attempts failed. Errors:', errors);
    throw new Error(`Could not connect to server. Tried ${errors.length} endpoints:\n${errors.join('\n')}`);
  }

  static async login(credentials: AppUser): Promise<AuthResponse> {
    try {
      console.log('API Service: Starting login with credentials:', { name: credentials.name, surname: credentials.surname });
      
      const data = await this.tryMultipleHosts<AuthResponse>('/app-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('API Service: Login successful:', data);
      return data;
    } catch (error) {
      console.error('API Service: Login failed:', error);
      throw error;
    }
  }

  static async register(credentials: AppUser): Promise<any> {
    try {
      console.log('API Service: Starting registration with credentials:', { name: credentials.name, surname: credentials.surname });
      
      const data = await this.tryMultipleHosts<any>('/app-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('API Service: Registration successful:', data);
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
    token: string
  ): Promise<any> {
    try {
      const data = await this.tryMultipleHosts<any>(
        `/components/${encodeURIComponent(componentName)}/stock?amount=${amount}&absolute=${absolute}&scannedBy=mobile-app`,
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
      console.log('Starting component update for:', componentName);
      
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

      console.log('Component updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating component:', error);
      throw error;
    }
  }

  static async createComponent(componentData: any, root: string = "", token: string): Promise<any> {
    try {
      console.log('Starting component creation:', componentData);
      
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

      console.log('Component created successfully:', data);
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
    token: string
  ): Promise<any> {
    try {
      console.log('API Service: Starting stock update with QR code scan');
      console.log('Component Name (from QR):', componentName);
      console.log('Amount:', amount);
      console.log('Absolute:', absolute);
      
      // Use query parameters approach for the scan-update endpoint
      const queryParams = new URLSearchParams({
        component_name: componentName,
        amount: amount.toString(),
        absolute: absolute.toString(),
        scannedBy: 'mobile-qr-scanner'
      });

      console.log('Making request to scan-update endpoint...');

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

      console.log('API Service: Stock update with QR code successful:', data);
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
    token: string
  ): Promise<any> {
    try {
      console.log('API Service: Starting stock update with image');
      console.log('Amount:', amount);
      console.log('Absolute:', absolute);
      
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add the image file - React Native specific format
      // The key difference is we need to specify the file properly
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'barcode_image.jpg',
      } as any);
      
      // Add other parameters as strings
      formData.append('amount', amount.toString());
      formData.append('absolute', absolute.toString());
      formData.append('scannedBy', 'mobile-app');

      console.log('FormData created, making request...');

      const data = await this.tryMultipleHosts<any>(
        `/components/scan-update`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type for FormData - let React Native handle it
          },
          body: formData,
        }
      );

      console.log('API Service: Stock update with image successful:', data);
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
      console.log(`API Service: Fetching paginated components - page ${page}, pageSize ${pageSize}`);
      
      const data = await this.tryMultipleHosts<{ data: any[], pagination: any }>(`/all_components_light_paginated?page=${page}&page_size=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log(`API Service: Fetched ${data.data.length} components for page ${page}`);
      return data;
    } catch (error) {
      console.error('API Service: Failed to fetch paginated components:', error);
      throw error;
    }
  }

  static async searchComponents(query: string, page: number = 1, pageSize: number = 50, token: string): Promise<{ data: any[], pagination: any, search_query: string }> {
    try {
      console.log(`API Service: Searching components with query "${query}" - page ${page}, pageSize ${pageSize}`);
      
      const data = await this.tryMultipleHosts<{ data: any[], pagination: any, search_query: string }>(`/search_components?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log(`API Service: Found ${data.data.length} components matching "${query}" for page ${page}`);
      return data;
    } catch (error) {
      console.error('API Service: Failed to search components:', error);
      throw error;
    }
  }

  // Connectivity test method for debugging
  static async testConnectivity(): Promise<string> {
    try {
      console.log('Testing connectivity to server...');
      const data = await this.tryMultipleHosts<any>('/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Connectivity test successful:', data);
      return `Connected successfully: ${data.message}`;
    } catch (error) {
      console.error('Connectivity test failed:', error);
      throw new Error('Cannot connect to server. Check your network connection.');
    }
  }
}

export default ApiService; 
