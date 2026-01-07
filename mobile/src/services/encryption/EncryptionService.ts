import { createCipheriv, createDecipheriv, randomBytes } from 'react-native-quick-crypto';
import RNFS from 'react-native-fs';
import { KeyManager } from './KeyManager';

/**
 * EncryptionService
 *
 * Handles file encryption/decryption using AES-256-GCM with native OS crypto
 * Leverages iOS CommonCrypto and Android OpenSSL/BoringSSL
 */
class EncryptionService {
  private static instance: EncryptionService;
  private keyManager: KeyManager;
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 12; // 96 bits for GCM
  private readonly AUTH_TAG_LENGTH = 16; // 128 bits
  private readonly CHUNK_SIZE = 64 * 1024; // 64KB chunks for streaming

  private constructor() {
    this.keyManager = KeyManager.getInstance();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Get master encryption key
   * Delegates to KeyManager for hardware-backed storage
   */
  public async getMasterKey(): Promise<Buffer> {
    return this.keyManager.getMasterKey();
  }

  /**
   * Get database encryption key
   */
  public async getDatabaseKey(): Promise<string> {
    return this.keyManager.getDatabaseKey();
  }

  /**
   * Encrypt a file using AES-256-GCM
   * Uses streaming for large files (60-minute videos)
   *
   * @param inputPath - Path to file to encrypt
   * @param outputPath - Path for encrypted file
   * @returns Auth tag for verification
   */
  public async encryptFile(
    inputPath: string,
    outputPath: string
  ): Promise<{ iv: string; authTag: string }> {
    try {
      console.log(`[EncryptionService] Encrypting file: ${inputPath}`);
      const startTime = Date.now();

      // Get master key
      const key = await this.getMasterKey();

      // Generate random IV
      const iv = randomBytes(this.IV_LENGTH);

      // Create cipher
      const cipher = createCipheriv(this.ALGORITHM, key, iv);

      // Get file stats
      const stats = await RNFS.stat(inputPath);
      const fileSize = parseInt(stats.size, 10);

      console.log(`[EncryptionService] File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // Stream encryption in chunks
      let offset = 0;
      const encryptedChunks: Buffer[] = [];

      while (offset < fileSize) {
        const chunkSize = Math.min(this.CHUNK_SIZE, fileSize - offset);

        // Read chunk
        const chunkData = await RNFS.read(inputPath, chunkSize, offset, 'base64');
        const chunk = Buffer.from(chunkData, 'base64');

        // Encrypt chunk
        const encryptedChunk = cipher.update(chunk);
        encryptedChunks.push(encryptedChunk);

        offset += chunkSize;

        // Progress logging every 10MB
        if (offset % (10 * 1024 * 1024) === 0) {
          const progress = ((offset / fileSize) * 100).toFixed(1);
          console.log(`[EncryptionService] Progress: ${progress}%`);
        }
      }

      // Finalize encryption
      const final = cipher.final();
      encryptedChunks.push(final);

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine all encrypted chunks
      const encryptedData = Buffer.concat(encryptedChunks);

      // Write encrypted data to output file
      await RNFS.writeFile(outputPath, encryptedData.toString('base64'), 'base64');

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[EncryptionService] Encryption complete in ${duration}s`);

      return {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      console.error('[EncryptionService] Encryption failed:', error);
      throw new Error(`File encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt a file using AES-256-GCM
   *
   * @param inputPath - Path to encrypted file
   * @param outputPath - Path for decrypted file
   * @param iv - Initialization vector (hex string)
   * @param authTag - Authentication tag (hex string)
   */
  public async decryptFile(
    inputPath: string,
    outputPath: string,
    iv: string,
    authTag: string
  ): Promise<void> {
    try {
      console.log(`[EncryptionService] Decrypting file: ${inputPath}`);
      const startTime = Date.now();

      // Get master key
      const key = await this.getMasterKey();

      // Convert IV and auth tag from hex
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');

      // Create decipher
      const decipher = createDecipheriv(this.ALGORITHM, key, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      // Get file stats
      const stats = await RNFS.stat(inputPath);
      const fileSize = parseInt(stats.size, 10);

      // Stream decryption in chunks
      let offset = 0;
      const decryptedChunks: Buffer[] = [];

      while (offset < fileSize) {
        const chunkSize = Math.min(this.CHUNK_SIZE, fileSize - offset);

        // Read encrypted chunk
        const chunkData = await RNFS.read(inputPath, chunkSize, offset, 'base64');
        const chunk = Buffer.from(chunkData, 'base64');

        // Decrypt chunk
        const decryptedChunk = decipher.update(chunk);
        decryptedChunks.push(decryptedChunk);

        offset += chunkSize;
      }

      // Finalize decryption
      const final = decipher.final();
      decryptedChunks.push(final);

      // Combine all decrypted chunks
      const decryptedData = Buffer.concat(decryptedChunks);

      // Write decrypted data to output file
      await RNFS.writeFile(outputPath, decryptedData.toString('base64'), 'base64');

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[EncryptionService] Decryption complete in ${duration}s`);
    } catch (error) {
      console.error('[EncryptionService] Decryption failed:', error);
      throw new Error(`File decryption failed: ${error}`);
    }
  }

  /**
   * Securely delete a file (overwrite before delete)
   */
  public async secureDelete(filePath: string): Promise<void> {
    try {
      // Get file size
      const stats = await RNFS.stat(filePath);
      const fileSize = parseInt(stats.size, 10);

      // Overwrite with random data
      const randomData = randomBytes(fileSize);
      await RNFS.writeFile(filePath, randomData.toString('base64'), 'base64');

      // Delete file
      await RNFS.unlink(filePath);

      console.log(`[EncryptionService] Secure delete: ${filePath}`);
    } catch (error) {
      console.error('[EncryptionService] Secure delete failed:', error);
      throw error;
    }
  }
}

export { EncryptionService };
