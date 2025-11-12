import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function WebNavBar() {
  const navigation = useNavigation<any>();
  const route = useRoute();

  if (Platform.OS !== 'web') return null;

  const isActive = (screenName: string) => {
    return route.name === screenName;
  };

  const handleFeedPress = () => {
    navigation.navigate('Feed', { screen: 'FeedMain' });
  };

  const handleCreatePostPress = () => {
    navigation.navigate('Feed', { screen: 'CreatePost' });
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.navItem, isActive('FeedMain') && styles.activeItem]}
        onPress={handleFeedPress}
      >
        <Ionicons
          name={isActive('FeedMain') ? 'home' : 'home-outline'}
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem]}
        onPress={handleCreatePostPress}
      >
        <Ionicons
          name="add-circle-outline"
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, isActive('Profile') && styles.activeItem]}
        onPress={handleProfilePress}
      >
        <Ionicons
          name={isActive('Profile') ? 'person' : 'person-outline'}
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    top: 250,
    flexDirection: 'column',
    gap: 30,
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        zIndex: 1000,
      },
    }),
  },
  navItem: {
    padding: 12,
    borderRadius: 8,
  },
  activeItem: {
    backgroundColor: '#27272a',
  },
});