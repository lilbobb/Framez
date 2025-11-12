import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import { PostsProvider } from './src/contexts/PostsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>       
      <PostsProvider>     
        <NavigationContainer>  
          <StatusBar style="light" />
          <AppNavigator />     
        </NavigationContainer>
      </PostsProvider>
    </AuthProvider>
  );
}