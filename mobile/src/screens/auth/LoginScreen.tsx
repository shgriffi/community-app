import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Logo } from '@/components/branding/Logo';
import { useAuthStore } from '@/store/authStore';
import { Colors, Typography, Spacing } from '@/styles/tokens';

/**
 * Login Screen
 *
 * Entry point for unauthenticated users
 * For development, includes a "Skip Login" button to explore the app
 */
export const LoginScreen = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSkipLogin = () => {
    // Mock user for development
    const mockUser = {
      id: 'dev-user-1',
      email: 'developer@griotandgrits.com',
      name: 'Development User',
      membershipTier: 'premium' as const,
      storageQuota: 10737418240, // 10 GB
      storageUsed: 1073741824, // 1 GB
    };
    const mockToken = 'dev-token-' + Date.now();

    setAuth(mockUser, mockToken);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Logo size="large" showTitle showTagline />
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title="Skip Login (Development)"
            onPress={handleSkipLogin}
          />
          <Text style={styles.devNote}>
            Authentication screens will be implemented in Phase 21
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xxl,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    gap: Spacing.md,
  },
  devNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
