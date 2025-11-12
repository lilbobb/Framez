import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform } from 'react-native';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import FeedScreen from '../screens/main/FeedScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { FeedStackParamList, MainTabParamList } from '../types';
import WebNavigator from './WebNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<FeedStackParamList>();

function FeedStack(): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FeedMain"
        component={FeedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          presentation: 'modal',
          headerTitle: 'New Post',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
        }}
      />
    </Stack.Navigator>
  );
}

function CameraTabScreen(): React.JSX.Element {
  return <CreatePostScreen />;
}

function MobileNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#27272a',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#71717a',
        headerStyle: {
          backgroundColor: '#000000',
          borderBottomColor: '#27272a',
        },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Post"
        component={CameraTabScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator(): React.JSX.Element {
  return Platform.OS === 'web' ? <WebNavigator /> : <MobileNavigator />;
}