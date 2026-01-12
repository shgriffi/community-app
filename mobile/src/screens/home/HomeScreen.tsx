import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/tokens';

/**
 * Home Screen
 *
 * Main landing page for authenticated users
 * Shows welcome message, quick actions, and app status
 */
export const HomeScreen = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const networkStatus = useUIStore((state) => state.networkStatus);

  const handleRecord = () => {
    // TODO: Navigate to recording screen (Phase 3)
    console.log('Record button pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Welcome Section */}
        <View style={styles.section}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}!</Text>
        </View>

        {/* Network Status */}
        <View style={[styles.card, styles.statusCard]}>
          <Icon
            name={networkStatus === 'online' ? 'wifi' : 'wifi-off'}
            size={24}
            color={networkStatus === 'online' ? Colors.success : Colors.error}
          />
          <Text style={styles.statusText}>
            {networkStatus === 'online' ? 'Online' : 'Offline'}
            {networkStatus === 'offline' && ' - Recording available'}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.card}>
            <Icon name="video" size={48} color={Colors.primary} />
            <Text style={styles.cardTitle}>Record Family Story</Text>
            <Text style={styles.cardDescription}>
              Capture precious memories and oral histories
            </Text>
            <PrimaryButton
              title="Start Recording"
              onPress={handleRecord}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Implementation Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Development Status</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Phase 2: Foundation Complete ✅</Text>
            <Text style={styles.infoText}>
              • Navigation & Authentication{'\n'}
              • State Management (Zustand){'\n'}
              • API Client Infrastructure{'\n'}
              • UI Component Library
            </Text>
            <Text style={[styles.infoTitle, { marginTop: Spacing.md }]}>
              Next: Phase 3 - Recording Feature
            </Text>
            <Text style={styles.infoText}>
              Ready to implement video recording, editing, and upload functionality
            </Text>
          </View>
        </View>

        {/* Storage Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Membership:</Text>
              <Text style={styles.infoValue}>{user?.membershipTier?.toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Storage Used:</Text>
              <Text style={styles.infoValue}>
                {((user?.storageUsed || 0) / 1073741824).toFixed(2)} GB / {' '}
                {((user?.storageQuota || 0) / 1073741824).toFixed(0)} GB
              </Text>
            </View>
          </View>
        </View>

        {/* Dev Actions */}
        <View style={styles.section}>
          <PrimaryButton
            title="Logout"
            onPress={logout}
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  userName: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Colors.elevation.small,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  statusText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  actionButton: {
    width: '100%',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    ...Colors.elevation.small,
  },
  infoTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  logoutButton: {
    marginTop: Spacing.lg,
  },
});
