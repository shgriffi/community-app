import { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: any;
  isRetryable: boolean;
}

/**
 * ErrorHandler
 *
 * Centralized error handling and retry logic for API requests
 */
class ErrorHandler {
  /**
   * Handle and normalize API errors
   */
  handleError(error: unknown): ApiError {
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }

    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        isRetryable: false,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      isRetryable: false,
    };
  }

  /**
   * Check if error is an AxiosError
   */
  private isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError === true;
  }

  /**
   * Handle Axios-specific errors
   */
  private handleAxiosError(error: AxiosError): ApiError {
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return {
          code: 'TIMEOUT',
          message: 'Request timed out',
          isRetryable: true,
        };
      }

      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        isRetryable: true,
      };
    }

    // HTTP status code errors
    switch (status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: data?.message || 'Invalid request',
          status,
          details: data?.errors,
          isRetryable: false,
        };

      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: data?.message || 'Authentication required',
          status,
          isRetryable: false,
        };

      case 403:
        return {
          code: 'FORBIDDEN',
          message: data?.message || 'Access denied',
          status,
          isRetryable: false,
        };

      case 404:
        return {
          code: 'NOT_FOUND',
          message: data?.message || 'Resource not found',
          status,
          isRetryable: false,
        };

      case 409:
        return {
          code: 'CONFLICT',
          message: data?.message || 'Resource conflict',
          status,
          details: data?.conflictData,
          isRetryable: false,
        };

      case 429:
        return {
          code: 'RATE_LIMIT',
          message: data?.message || 'Too many requests',
          status,
          isRetryable: true,
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: 'SERVER_ERROR',
          message: data?.message || 'Server error occurred',
          status,
          isRetryable: true,
        };

      default:
        return {
          code: 'HTTP_ERROR',
          message: data?.message || `HTTP ${status} error`,
          status,
          isRetryable: status >= 500,
        };
    }
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetry(error: ApiError, retryCount: number, maxRetries: number = 3): boolean {
    if (retryCount >= maxRetries) {
      return false;
    }

    return error.isRetryable;
  }

  /**
   * Calculate retry delay using exponential backoff
   * @param retryCount Current retry attempt (0-based)
   * @param baseDelay Base delay in milliseconds (default: 1000)
   * @param maxDelay Maximum delay in milliseconds (default: 30000)
   */
  getRetryDelay(retryCount: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    const delay = Math.min(exponentialDelay + jitter, maxDelay);

    return Math.floor(delay);
  }

  /**
   * Retry a failed operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    onRetry?: (error: ApiError, retryCount: number, delay: number) => void
  ): Promise<T> {
    let retryCount = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        const apiError = this.handleError(error);

        if (!this.shouldRetry(apiError, retryCount, maxRetries)) {
          throw apiError;
        }

        retryCount++;
        const delay = this.getRetryDelay(retryCount - 1);

        if (onRetry) {
          onRetry(apiError, retryCount, delay);
        }

        await this.sleep(delay);
      }
    }
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const errorHandler = new ErrorHandler();
export default errorHandler;
