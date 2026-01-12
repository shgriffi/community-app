import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '@/screens/auth/LoginScreen';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  PasswordReset: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Auth Navigator
 *
 * Navigation stack for unauthenticated users
 */
export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};
