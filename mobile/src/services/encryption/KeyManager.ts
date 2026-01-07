import * as Keychain from 'react-native-keychain';
import { randomBytes } from 'react-native-quick-crypto';
import { Platform } from 'react-native';

/**
 * KeyManager
 *
 * Manages encryption keys using native OS secure storage
 * - iOS: Keychain Services with Secure Enclave (hardware-backed when available)
 * - Android: Keystore System with StrongBox/TEE (hardware-backed when available)
 */
class KeyManager {
  private static instance: KeyManager;
  private readonly MASTER_KEY_SERVICE = 'griot.master';
  private readonly DB_KEY_SERVICE = 'griot.database';
  private readonly KEY_SIZE = 32; // 256 bits for AES-256

  private masterKey: Buffer | null = null;
  private dbKey: string | null = null;

  private constructor() {}

  public static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }

  /**
   * Get or create master encryption key
   * Stored in iOS Keychain / Android Keystore with hardware backing
   */
  public async getMasterKey(): Promise<Buffer> {
    if (this.masterKey) {
      return this.masterKey;
    }

    try {
      // Try to retrieve existing key
      const credentials = await Keychain.getGenericPassword({
        service: this.MASTER_KEY_SERVICE,
      });

      if (credentials) {
        console.log('[KeyManager] Retrieved existing master key from secure storage');
        this.masterKey = Buffer.from(credentials.password, 'hex');
        return this.masterKey;
      }

      // Generate new key if none exists
      console.log('[KeyManager] Generating new master key');
      const newKey = randomBytes(this.KEY_SIZE);

      // Store in secure storage with hardware backing
      await Keychain.setGenericPassword('master_key', newKey.toString('hex'), {
        service: this.MASTER_KEY_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        accessControl: this.getAccessControl(),
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      });

      console.log('[KeyManager] Master key stored in secure hardware');
      this.masterKey = newKey;
      return this.masterKey;
    } catch (error) {
      console.error('[KeyManager] Failed to get/create master key:', error);
      throw new Error(`Key management failed: ${error}`);
    }
  }

  /**
   * Get or create database encryption key
   */
  public async getDatabaseKey(): Promise<string> {
    if (this.dbKey) {
      return this.dbKey;
    }

    try {
      // Try to retrieve existing key
      const credentials = await Keychain.getGenericPassword({
        service: this.DB_KEY_SERVICE,
      });

      if (credentials) {
        console.log('[KeyManager] Retrieved existing database key');
        this.dbKey = credentials.password;
        return this.dbKey;
      }

      // Generate new database key
      console.log('[KeyManager] Generating new database key');
      const newKey = randomBytes(this.KEY_SIZE);
      const keyHex = newKey.toString('hex');

      // Store in secure storage
      await Keychain.setGenericPassword('db_key', keyHex, {
        service: this.DB_KEY_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      });

      console.log('[KeyManager] Database key stored');
      this.dbKey = keyHex;
      return this.dbKey;
    } catch (error) {
      console.error('[KeyManager] Failed to get/create database key:', error);
      throw new Error(`Database key management failed: ${error}`);
    }
  }

  /**
   * Check if hardware-backed encryption is available
   */
  public async hasSecureHardware(): Promise<boolean> {
    try {
      const securityLevel = await Keychain.getSecurityLevel();
      const isHardwareBacked = securityLevel === Keychain.SECURITY_LEVEL.SECURE_HARDWARE;

      if (isHardwareBacked) {
        if (Platform.OS === 'ios') {
          console.log('[KeyManager] iOS Secure Enclave available');
        } else {
          console.log('[KeyManager] Android StrongBox/TEE available');
        }
      } else {
        console.warn('[KeyManager] Hardware-backed encryption not available (fallback to software)');
      }

      return isHardwareBacked;
    } catch (error) {
      console.error('[KeyManager] Failed to check security level:', error);
      return false;
    }
  }

  /**
   * Get platform-specific access control
   */
  private getAccessControl(): Keychain.ACCESS_CONTROL | undefined {
    if (Platform.OS === 'ios') {
      // iOS: Use biometrics when available (optional)
      return Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE;
    }
    // Android: No access control needed for basic encryption
    return undefined;
  }

  /**
   * Reset all encryption keys (DANGEROUS - will lose access to encrypted data)
   */
  public async resetKeys(): Promise<void> {
    console.warn('[KeyManager] RESETTING ALL ENCRYPTION KEYS');

    try {
      await Keychain.resetGenericPassword({ service: this.MASTER_KEY_SERVICE });
      await Keychain.resetGenericPassword({ service: this.DB_KEY_SERVICE });

      this.masterKey = null;
      this.dbKey = null;

      console.log('[KeyManager] All keys reset');
    } catch (error) {
      console.error('[KeyManager] Failed to reset keys:', error);
      throw error;
    }
  }

  /**
   * Clear cached keys from memory (NOT from secure storage)
   */
  public clearCache(): void {
    this.masterKey = null;
    this.dbKey = null;
    console.log('[KeyManager] Key cache cleared');
  }
}

export { KeyManager };
