import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Post from '../../components/Post';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import WebNavBar from '../../components/WebNavBar';
import { usePosts } from '../../contexts/PostsContext';
import { FeedStackParamList, MainTabParamList } from '../../types';

type FeedScreenProps = CompositeScreenProps<
  NativeStackScreenProps<FeedStackParamList, 'FeedMain'>,
  BottomTabScreenProps<MainTabParamList>
>;

export default function FeedScreen({ navigation }: FeedScreenProps): React.JSX.Element {
  const { state, fetchPosts, refreshPosts } = usePosts();
  const { posts, loading, refreshing, error } = state;

  const memoizedFetchPosts = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    memoizedFetchPosts();
  }, [memoizedFetchPosts]);

  const onRefresh = useCallback(() => {
    refreshPosts();
  }, [refreshPosts]);

  const renderHeader = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="camera" size={28} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Framez</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [navigation]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="camera-outline" size={64} color="#3f3f46" />
      <Text style={styles.emptyText}>No posts yet</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Text style={styles.createButtonText}>Create First Post</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="warning-outline" size={50} color="#ff4d4d" />
      <Text style={styles.errorText}>Failed to load posts</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchPosts()}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {renderHeader}
        {renderLoading()}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader}
        {renderError()}
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {Platform.OS === 'web' && <WebNavBar />}
      <View style={styles.contentContainer}>
        <ResponsiveContainer>
          <View style={styles.container}>
            {renderHeader}
            <FlatList
              data={posts}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => <Post post={item} onUpdate={refreshPosts} />}
              contentContainerStyle={posts.length === 0 ? styles.emptyList : undefined}
              ListEmptyComponent={renderEmpty}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#FFFFFF"
                  colors={['#FFFFFF']}
                  progressBackgroundColor="#000000"
                />
              }
              initialNumToRender={5}
              windowSize={10}
              removeClippedSubviews
            />
          </View>
        </ResponsiveContainer>
      </View>
    </View>
  );
}

/** ────────────── Styles ────────────── */

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#030101ff',
  },
  header: {
    borderBottomWidth: Platform.OS === 'ios' ? 1 : 0,
    borderBottomColor: '#27272a',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    backgroundColor: '#000000',
    elevation: Platform.OS === 'android' ? 4 : 0,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    padding: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#71717a',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 16,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#000000',
    fontWeight: '600',
  },
});
