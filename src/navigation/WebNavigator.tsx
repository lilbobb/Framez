import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import FeedScreen from '../screens/main/FeedScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { FeedStackParamList, MainTabParamList } from '../types';

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

export default function WebNavigator(): React.JSX.Element {
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: '#000000',
              borderTopColor: '#27272a',
              display: 'none',
            },
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
              headerShown: false,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              headerShown: false,
            }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
}