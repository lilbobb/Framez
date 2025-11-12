import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Post from '../../components/Post';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import WebNavBar from '../../components/WebNavBar';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../contexts/PostsContext';
import { MainTabParamList } from '../../types';

type ProfileScreenProps = BottomTabScreenProps<MainTabParamList, 'Profile'>;

const Avatar = ({ url, name, size = 80, onPress }: {
  url: string | null;
  name: string;
  size?: number;
  onPress?: () => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!url);

  const getInitials = (name: string) =>
    name.split(' ').map(part => part.charAt(0)).join('').toUpperCase().slice(0, 2);

  const getBackgroundColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  if (!url || imageError) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: getBackgroundColor(name) }]}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{getInitials(name)}</Text>
        {onPress && (
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={size * 0.25} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} style={{ position: 'relative' }}>
      {imageLoading && <View style={[styles.avatarLoading, { width: size, height: size, borderRadius: size / 2 }]}><ActivityIndicator size="small" color="#FFFFFF" /></View>}
      <Image
        source={{ uri: url }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, imageLoading && { opacity: 0 }]}
        onError={() => { setImageError(true); setImageLoading(false); }}
        onLoad={() => setImageLoading(false)}
        onLoadEnd={() => setImageLoading(false)}
        resizeMode="cover"
      />
      {onPress && (
        <View style={styles.editBadge}>
          <Ionicons name="camera" size={size * 0.25} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { state, fetchPosts, refreshPosts } = usePosts();
  const { posts, loading } = state;

  useEffect(() => {
    if (user?.id) {
      fetchPosts(user.id);
    }
  }, [user?.id, fetchPosts]);

  const uploadProfilePhoto = async (uri: string): Promise<string> => {
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;
      const response = await fetch(uri);
      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, uint8Array, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Profile photo upload failed', error);
      throw error;
    }
  };

  const handleChangePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed', 'Please grant photo library access');

      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true);
        const photoUrl = await uploadProfilePhoto(result.assets[0].uri);
        await updateProfile({ avatar_url: photoUrl });
        refreshPosts();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(); }
    catch (error) { Alert.alert('Error', 'Failed to sign out'); }
  };

  const renderHeader = () => {
    const avatarUrl = profile?.avatar_url || null;
    const displayName = profile?.name || user?.email?.split('@')[0] || 'User';

    return (
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            {uploadingPhoto ? (
              <View style={[styles.avatarFallback, { width: 80, height: 80, borderRadius: 40, backgroundColor: '#27272a' }]}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            ) : (
              <Avatar url={avatarUrl} name={displayName} size={80} onPress={handleChangePhoto} />
            )}
            <View style={styles.userInfo}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutModal(true)}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Posts</Text>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;

  return (
    <View style={styles.mainContainer}>
      {Platform.OS === 'web' && <WebNavBar />}
      <View style={styles.contentContainer}>
        <ResponsiveContainer>
          <View style={styles.container}>
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <Post post={item} onUpdate={refreshPosts} />}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={() => <View style={styles.emptyContainer}><Text style={styles.emptyText}>No posts yet</Text></View>}
            />
          </View>
        </ResponsiveContainer>
      </View>

      <Modal transparent visible={showLogoutModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowLogoutModal(false)} style={styles.modalButton}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => { setShowLogoutModal(false); await handleSignOut(); }}
                style={[styles.modalButton, { backgroundColor: '#ef4444' }]}
              >
                <Text style={{ color: '#fff' }}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingTop: Platform.OS === 'web' ? 20 : 0,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatar: {
    backgroundColor: '#e1e1e1',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarLoading: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#27272a',
  },
  initials: {
    color: '#fff',
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  userInfo: {
    gap: 4,
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    color: '#71717a',
  },
  bio: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 16,
  },
  logoutButton: {
    padding: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#71717a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 50 : 60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'flex-start',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    width: 280,
    marginLeft: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalMessage: {
    color: '#fff',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 100,
    alignItems: 'center',
  },
});
