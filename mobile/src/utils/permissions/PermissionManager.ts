import { Platform, PermissionsAndroid, Permission, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission as RNPermission } from 'react-native-permissions';

export type PermissionType = 'camera' | 'microphone' | 'storage' | 'location';
export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

/**
 * PermissionManager
 *
 * Handles runtime permissions for camera, microphone, storage, and location
 * Provides unified interface across iOS and Android
 */
class PermissionManager {
  private static instance: PermissionManager;

  private constructor() {}

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Request permission with rationale
   */
  async requestPermission(type: PermissionType): Promise<PermissionStatus> {
    console.log(`[PermissionManager] Requesting ${type} permission`);

    const permission = this.getPermission(type);
    if (!permission) {
      return 'unavailable';
    }

    try {
      // Check current status first
      const currentStatus = await this.checkPermission(type);

      if (currentStatus === 'granted') {
        return 'granted';
      }

      if (currentStatus === 'blocked') {
        this.showBlockedAlert(type);
        return 'blocked';
      }

      // Request permission
      const result = await request(permission);

      return this.mapResult(result);
    } catch (error) {
      console.error(`[PermissionManager] Error requesting ${type} permission:`, error);
      return 'denied';
    }
  }

  /**
   * Check permission status
   */
  async checkPermission(type: PermissionType): Promise<PermissionStatus> {
    const permission = this.getPermission(type);
    if (!permission) {
      return 'unavailable';
    }

    try {
      const result = await check(permission);
      return this.mapResult(result);
    } catch (error) {
      console.error(`[PermissionManager] Error checking ${type} permission:`, error);
      return 'unavailable';
    }
  }

  /**
   * Request multiple permissions at once
   */
  async requestMultiplePermissions(types: PermissionType[]): Promise<Record<PermissionType, PermissionStatus>> {
    const results: Record<string, PermissionStatus> = {};

    for (const type of types) {
      results[type] = await this.requestPermission(type);
    }

    return results as Record<PermissionType, PermissionStatus>;
  }

  /**
   * Check if all required permissions are granted
   */
  async hasAllPermissions(types: PermissionType[]): Promise<boolean> {
    for (const type of types) {
      const status = await this.checkPermission(type);
      if (status !== 'granted') {
        return false;
      }
    }
    return true;
  }

  /**
   * Get platform-specific permission
   */
  private getPermission(type: PermissionType): RNPermission | null {
    switch (type) {
      case 'camera':
        return Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

      case 'microphone':
        return Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO;

      case 'storage':
        if (Platform.OS === 'ios') {
          return PERMISSIONS.IOS.PHOTO_LIBRARY;
        } else {
          // Android 13+ uses different permissions
          if (Platform.Version >= 33) {
            return PERMISSIONS.ANDROID.READ_MEDIA_VIDEO;
          } else {
            return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
          }
        }

      case 'location':
        return Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      default:
        return null;
    }
  }

  /**
   * Map react-native-permissions result to our PermissionStatus
   */
  private mapResult(result: string): PermissionStatus {
    switch (result) {
      case RESULTS.GRANTED:
        return 'granted';
      case RESULTS.DENIED:
        return 'denied';
      case RESULTS.BLOCKED:
        return 'blocked';
      case RESULTS.UNAVAILABLE:
      default:
        return 'unavailable';
    }
  }

  /**
   * Show alert for blocked permission with instructions to open settings
   */
  private showBlockedAlert(type: PermissionType): void {
    const permissionName = this.getPermissionName(type);

    Alert.alert(
      `${permissionName} Permission Required`,
      `${permissionName} access has been blocked. Please enable it in your device settings to use this feature.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            // Open app settings
            const { openSettings } = require('react-native-permissions');
            openSettings();
          },
        },
      ]
    );
  }

  /**
   * Get user-friendly permission name
   */
  private getPermissionName(type: PermissionType): string {
    switch (type) {
      case 'camera':
        return 'Camera';
      case 'microphone':
        return 'Microphone';
      case 'storage':
        return 'Storage';
      case 'location':
        return 'Location';
      default:
        return 'Permission';
    }
  }

  /**
   * Get rationale message for permission
   */
  getRationale(type: PermissionType): string {
    switch (type) {
      case 'camera':
        return 'Camera access is required to record videos of family stories.';
      case 'microphone':
        return 'Microphone access is required to record audio for stories.';
      case 'storage':
        return 'Storage access is required to save and access your family stories.';
      case 'location':
        return 'Location access is optional and helps associate stories with meaningful places.';
      default:
        return '';
    }
  }
}

export const permissionManager = PermissionManager.getInstance();
export default permissionManager;
