import { apiClient } from './ApiClient';

/**
 * TokenManager
 *
 * Handles authentication token refresh logic
 */
class TokenManager {
  private refreshPromise: Promise<string> | null = null;
  private isRefreshing = false;

  /**
   * Refresh the authentication token
   * Prevents multiple simultaneous refresh requests
   */
  async refreshToken(currentToken: string): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;

    this.refreshPromise = this.performRefresh(currentToken)
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private async performRefresh(currentToken: string): Promise<string> {
    try {
      const response = await apiClient.post<{ token: string; refreshToken: string }>(
        '/auth/refresh',
        {
          token: currentToken,
        }
      );

      const { token } = response.data;

      // Update the API client with the new token
      apiClient.setAuthToken(token);

      return token;
    } catch (error) {
      // If refresh fails, clear the token
      apiClient.setAuthToken(null);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Check if a token is expired or about to expire
   * @param token JWT token to check
   * @param bufferSeconds Seconds before expiry to consider token expired (default: 300 = 5 minutes)
   */
  isTokenExpired(token: string, bufferSeconds: number = 300): boolean {
    try {
      // Decode JWT token (without verification - just for expiry check)
      const payload = this.decodeToken(token);

      if (!payload || !payload.exp) {
        return true;
      }

      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = bufferSeconds * 1000;

      return currentTime >= (expiryTime - bufferTime);
    } catch (error) {
      // If we can't decode the token, consider it expired
      return true;
    }
  }

  /**
   * Decode JWT token payload (client-side only, not verified)
   */
  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;
