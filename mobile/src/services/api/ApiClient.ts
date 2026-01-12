import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import Config from 'react-native-config';

/**
 * Base API Client for Griot and Grits backend
 *
 * Features:
 * - Automatic auth token injection
 * - Request correlation IDs for distributed tracing
 * - Error handling and retry logic
 * - Request/response interceptors
 */
class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    const baseURL = Config.API_BASE_URL || 'http://localhost:3000/api';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Platform': Platform.OS,
        'X-App-Version': Config.APP_VERSION || '1.0.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add correlation ID for request tracking
        const correlationId = this.generateCorrelationId();
        config.headers['X-Correlation-ID'] = correlationId;
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add auth token if available
        if (this.authToken) {
          config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // Handle 401 Unauthorized - token might be expired
        if (error.response?.status === 401) {
          this.authToken = null;
          // Token refresh logic would go here
        }

        return Promise.reject(error);
      }
    );
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Set authentication token for all subsequent requests
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * HTTP GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  /**
   * HTTP POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * HTTP PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * HTTP PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  /**
   * HTTP DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
