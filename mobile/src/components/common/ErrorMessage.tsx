import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/tokens';

interface ErrorMessageProps {
  message: string;
  title?: string;
  style?: ViewStyle;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = 'Error',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Icon name="alert-circle" size={24} color={Colors.error} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.errorBackground,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    borderRadius: BorderRadius.small,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  title: {
    ...Typography.bodyBold,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
});
