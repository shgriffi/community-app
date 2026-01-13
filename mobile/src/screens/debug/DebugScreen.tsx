import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useRecordingStore } from '@/store/recordingStore';
import { useUploadQueueStore } from '@/store/uploadQueueStore';
import { connectivityMonitor, ConnectivityStatus } from '@/services/sync/ConnectivityMonitor';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/tokens';

/**
 * Debug Screen
 *
 * Developer screen to test and showcase Phase 2 infrastructure
 */
export const DebugScreen = () => {
  const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus>(
    connectivityMonitor.getStatus()
  );

  // Recording store
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    updateDuration,
    reset: resetRecording,
  } = useRecordingStore();

  // Upload queue store
  const { queue, addToQueue, updateProgress, updateStatus, clearCompleted } = useUploadQueueStore();

  // Monitor connectivity changes
  useEffect(() => {
    const unsubscribe = connectivityMonitor.subscribe((status) => {
      setConnectivityStatus(status);
    });

    return unsubscribe;
  }, []);

  // Update recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording && !isPaused) {
      // Update duration every second
      interval = setInterval(() => {
        updateDuration(duration + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, isPaused, duration, updateDuration]);

  // Simulate recording
  const handleStartRecording = () => {
    startRecording('/mock/path/video-' + Date.now() + '.mp4');
  };

  // Simulate adding upload
  const handleAddUpload = () => {
    const fileSize = Math.floor(Math.random() * 500000000) + 10000000; // 10MB - 500MB
    addToQueue({
      filePath: '/mock/path/video-' + Date.now() + '.mp4',
      fileName: `Family Story ${Date.now()}.mp4`,
      fileSize,
      mimeType: 'video/mp4',
      chunkSize: 5242880, // 5MB chunks
      totalChunks: Math.ceil(fileSize / 5242880),
      maxRetries: 3,
    });
  };

  // Simulate upload progress
  const handleSimulateProgress = (uploadId: string) => {
    const upload = queue.find((u) => u.id === uploadId);
    if (!upload) return;

    const newUploadedBytes = Math.min(
      upload.uploadedBytes + upload.chunkSize,
      upload.fileSize
    );
    const newUploadedChunks = Math.ceil(newUploadedBytes / upload.chunkSize);

    updateProgress(uploadId, newUploadedBytes, newUploadedChunks);

    if (newUploadedBytes >= upload.fileSize) {
      updateStatus(uploadId, 'completed');
    }
  };

  const getConnectionIcon = () => {
    switch (connectivityStatus.type) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'signal';
      case 'ethernet':
        return 'ethernet';
      default:
        return 'wifi-off';
    }
  };

  const getQualityColor = () => {
    switch (connectivityStatus.quality) {
      case 'excellent':
        return Colors.success;
      case 'good':
        return '#10b981';
      case 'fair':
        return Colors.warning;
      case 'poor':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Phase 2 Infrastructure Demo</Text>

        {/* Connectivity Monitor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Connectivity Monitor</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon
                name={getConnectionIcon()}
                size={32}
                color={connectivityStatus.isConnected ? Colors.success : Colors.error}
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>
                  {connectivityStatus.isConnected ? 'Connected' : 'Disconnected'}
                </Text>
                <Text style={styles.statusDetail}>Type: {connectivityStatus.type}</Text>
                <View style={styles.row}>
                  <Text style={styles.statusDetail}>Quality: </Text>
                  <Text style={[styles.statusDetail, { color: getQualityColor() }]}>
                    {connectivityStatus.quality}
                  </Text>
                </View>
                <Text style={styles.statusDetail}>
                  Can Upload: {connectivityMonitor.canUpload() ? 'Yes ✓' : 'No ✗'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recording Store */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎥 Recording Store</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>
                {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Stopped'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Duration:</Text>
              <Text style={styles.value}>{duration}s</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, isRecording && styles.smallButtonDisabled]}
                onPress={handleStartRecording}
                disabled={isRecording}
              >
                <Text style={styles.smallButtonText}>Start</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallButton, (!isRecording || isPaused) && styles.smallButtonDisabled]}
                onPress={pauseRecording}
                disabled={!isRecording || isPaused}
              >
                <Text style={styles.smallButtonText}>Pause</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallButton, (!isPaused) && styles.smallButtonDisabled]}
                onPress={resumeRecording}
                disabled={!isPaused}
              >
                <Text style={styles.smallButtonText}>Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallButton, !isRecording && styles.smallButtonDisabled]}
                onPress={stopRecording}
                disabled={!isRecording}
              >
                <Text style={styles.smallButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetRecording}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload Queue */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📤 Upload Queue ({queue.length})</Text>
            <TouchableOpacity onPress={clearCompleted}>
              <Text style={styles.link}>Clear Completed</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton title="Add Mock Upload" onPress={handleAddUpload} />

          {queue.map((upload) => (
            <View key={upload.id} style={styles.uploadCard}>
              <Text style={styles.uploadName} numberOfLines={1}>
                {upload.fileName}
              </Text>
              <Text style={styles.uploadDetail}>
                {(upload.fileSize / 1048576).toFixed(1)} MB
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${upload.progress}%` }]} />
              </View>
              <View style={styles.uploadFooter}>
                <Text style={styles.uploadStatus}>{upload.status}</Text>
                <Text style={styles.uploadProgress}>{upload.progress.toFixed(0)}%</Text>
              </View>

              {upload.status === 'pending' && (
                <TouchableOpacity
                  style={styles.progressButton}
                  onPress={() => handleSimulateProgress(upload.id)}
                >
                  <Text style={styles.progressButtonText}>Simulate Progress</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {queue.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No uploads in queue</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Infrastructure Info</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              ✅ TokenManager - Auth token refresh{'\n'}
              ✅ ErrorHandler - API error handling with retry{'\n'}
              ✅ ConnectivityMonitor - Real-time network status{'\n'}
              ✅ Recording Store - Video recording state{'\n'}
              ✅ Upload Queue - Persistent upload management
            </Text>
          </View>
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
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
    ...Colors.elevation.small,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statusDetail: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  value: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  smallButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
  },
  smallButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  smallButtonText: {
    ...Typography.label,
    color: Colors.white,
    fontWeight: '600',
  },
  resetButton: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  resetButtonText: {
    ...Typography.label,
    color: Colors.primary,
  },
  link: {
    ...Typography.label,
    color: Colors.primary,
  },
  uploadCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.small,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  uploadDetail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  uploadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadStatus: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  uploadProgress: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  progressButton: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.info,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
  },
  progressButtonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    ...Colors.elevation.small,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
});
