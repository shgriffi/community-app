import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { permissionManager, PermissionType } from '@/utils/permissions/PermissionManager';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/tokens';

interface PermissionRequestProps {
  visible: boolean;
  permissionType: PermissionType;
  onGranted: () => void;
  onDenied: () => void;
  onClose: () => void;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({
  visible,
  permissionType,
  onGranted,
  onDenied,
  onClose,
}) => {
  const [requesting, setRequesting] = React.useState(false);

  const handleRequest = async () => {
    setRequesting(true);

    try {
      const status = await permissionManager.requestPermission(permissionType);

      if (status === 'granted') {
        onGranted();
        onClose();
      } else {
        onDenied();
      }
    } catch (error) {
      console.error('Permission request error:', error);
      onDenied();
    } finally {
      setRequesting(false);
    }
  };

  const getIcon = (): string => {
    switch (permissionType) {
      case 'camera':
        return 'camera';
      case 'microphone':
        return 'microphone';
      case 'storage':
        return 'folder';
      case 'location':
        return 'map-marker';
      default:
        return 'shield-check';
    }
  };

  const getTitle = (): string => {
    switch (permissionType) {
      case 'camera':
        return 'Camera Access';
      case 'microphone':
        return 'Microphone Access';
      case 'storage':
        return 'Storage Access';
      case 'location':
        return 'Location Access';
      default:
        return 'Permission Required';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Icon name={getIcon()} size={48} color={Colors.primary} />
          </View>

          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.message}>{permissionManager.getRationale(permissionType)}</Text>

          <View style={styles.buttonContainer}>
            <PrimaryButton
              title="Grant Permission"
              onPress={handleRequest}
              loading={requesting}
              style={styles.button}
            />
            <SecondaryButton
              title="Not Now"
              onPress={() => {
                onDenied();
                onClose();
              }}
              disabled={requesting}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Colors.elevation.medium,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});
