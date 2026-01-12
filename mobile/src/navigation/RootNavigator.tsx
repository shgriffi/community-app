import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

/**
 * Root Navigator
 *
 * Routes to Auth or Main navigator based on authentication state
 */
export const RootNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
