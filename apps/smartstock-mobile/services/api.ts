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

// Smart API URL detection for web vs mobile with multiple fallbacks
const getBaseUrl = () => {
  // Check if we're running in a web environment
  if (typeof window !== 'undefined' && window.location) {
    // Web environment - use localhost
    return 'http://localhost:8000';
  }
  
  // Mobile environment - use your current WiFi IP
  return 'http://10.0.0.100:8000';
};

// Updated fallback IPs based on your current network configuration
const FALLBACK_IPS = [
  'http://10.0.0.100:8000',     // Your current WiFi IP (primary)
  'http://172.21.0.1:8000',     // Your active Docker bridge IP
  'http://172.20.0.1:8000',     // Docker bridge (if hotspot is active)
  'http://172.17.0.1:8000',     // Default Docker bridge
  'http://172.18.0.1:8000',     // Another Docker bridge
  'http://172.19.0.1:8000',     // Another Docker bridge
  'http://192.168.137.1:8000',  // Windows hotspot default
  'http://172.20.10.1:8000',    // iPhone hotspot default  
  'http://192.168.43.1:8000',   // Android hotspot default
  'http://10.42.0.1:8000',      // Linux hotspot default
  'http://192.168.1.1:8000',    // Router default
  'http://192.168.0.1:8000',    // Another router default
  'http://192.168.1.100:8000',  // Common home network range
  'http://192.168.0.100:8000',  // Another common range  
];

export class ApiService {
  private static readonly BASE_URL = getBaseUrl();

  // Helper function to add timeout to fetch
  private static async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeoutMs: number = 5000
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
      throw error;
    }
  }

  // Try multiple IPs until one works
  private static async tryMultipleHosts<T>(
    path: string, 
    options: RequestInit
  ): Promise<T> {
    const errors: string[] = [];
    
    // Try main URL first
    try {
      console.log('🔄 Trying main URL:', `${this.BASE_URL}${path}`);
      const response = await this.fetchWithTimeout(`${this.BASE_URL}${path}`, options, 5000);
      
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

    // Try fallback IPs
    for (const baseUrl of FALLBACK_IPS) {
      try {
        console.log('🔄 Trying fallback URL:', `${baseUrl}${path}`);
        const response = await this.fetchWithTimeout(`${baseUrl}${path}`, options, 3000);
        
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
        continue;
      }
    }
    
    console.log('🚨 All connection attempts failed. Errors:', errors);
    throw new Error(`Could not connect to server. Tried ${errors.length} endpoints:\n${errors.join('\n')}`);
  }

  static async login(credentials: AppUser): Promise<AuthResponse> {
    try {
      console.log('API Service: Starting login with credentials:', { name: credentials.name, surname: credentials.surname });
      
      const data = await this.tryMultipleHosts<AuthResponse>('/app/login', {
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
      
      const data = await this.tryMultipleHosts<any>('/app/register', {
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
        `/stock?componentName=${encodeURIComponent(componentName)}&amount=${amount}&absolute=${absolute}`,
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

  static async updateStockWithImage(
    imageUri: string,
    amount: number,
    absolute: boolean = false,
    token: string
  ): Promise<any> {
    try {
      console.log('API Service: Starting stock update with image');
      
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add the image file
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'barcode_image.jpg',
      } as any);
      
      const data = await this.tryMultipleHosts<any>(
        `/stock?amount=${amount}&absolute=${absolute}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type for FormData - let the browser set it with boundary
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
