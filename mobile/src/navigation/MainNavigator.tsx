import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { Logo } from '@/components/branding/Logo';
import { Colors } from '@/styles/tokens';

export type MainTabParamList = {
  Home: undefined;
  Discovery: undefined;
  Family: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main Navigator
 *
 * Bottom tab navigation for authenticated users
 */
export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <Logo size="small" />,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
