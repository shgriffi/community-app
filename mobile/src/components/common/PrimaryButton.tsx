import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/tokens';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Primary Button Component
 *
 * Gradient button for primary actions (e.g., Record, Upload, Login)
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={
          disabled
            ? [Colors.disabled, Colors.disabled]
            : [Colors.primaryGradientStart, Colors.primaryGradientEnd]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={Colors.textOnPrimary} />
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  text: {
    ...Typography.button,
    color: Colors.textOnPrimary,
  },
});
