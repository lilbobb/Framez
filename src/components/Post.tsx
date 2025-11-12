import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';
import Modal from 'react-native-modal';
import { usePosts } from '../contexts/PostsContext';
import { Post as PostType } from '../types';
import { formatTimeAgo } from '../utils/helpers';


const Avatar = ({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getInitials = (name: string): string =>
    name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getBackgroundColor = (name: string): string => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  if (!url || imageError) {
    return (
      <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: getBackgroundColor(name) }]}>
        <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{getInitials(name)}</Text>
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      {imageLoading && (
        <View style={[styles.avatarLoading, { width: size, height: size, borderRadius: size / 2 }]}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}
      <Image
        source={{ uri: url, cache: 'force-cache' }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, imageLoading && { opacity: 0 }]}
        onError={() => { setImageError(true); setImageLoading(false); }}
        onLoadEnd={() => setImageLoading(false)}
        resizeMode="cover"
      />
    </View>
  );
};

interface PostProps {
  post: PostType;
  onUpdate?: () => void;
}

export default function Post({ post, onUpdate }: PostProps): React.JSX.Element {
  const {
    state,
    toggleLike,
    initializeLikes,
    addComment
  } = usePosts();

  const { likes, comments } = state;

  const postLikes = likes[post.id] || { liked: false, count: 0 };
  const postComments = comments[post.id] || [];

  const [modalVisible, setModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const visibleComments = showAllComments ? postComments : postComments.slice(0, 2);


  useEffect(() => {
    initializeLikes(post.id);
  }, [initializeLikes, post.id]);

  const handleLike = async () => {
    try {
      await toggleLike(post.id);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment(post.id, newComment);
      setNewComment('');
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post on MyApp! \n\n${post.content}\n\nhttps://yourapp.com/post/${post.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyLink = async (postId: string) => {
    const link = `https://yourapp.vercel.app/posts/${postId}`;
    await Clipboard.setStringAsync(link);

    if (Platform.OS === 'android') {
      ToastAndroid.show('Link copied!', ToastAndroid.SHORT);
    } else if (Platform.OS === 'ios') {
      Alert.alert('Copied', 'Link copied to clipboard');
    } else if (Platform.OS === 'web') {
      alert('Link copied!');
    }
  };

  const handleShareOptions = async (postId: string) => {
    if (Platform.OS === 'web') {
      await handleCopyLink(postId);
    } else {
      Alert.alert(
        'Share Post',
        'Choose an option',
        [
          { text: 'Copy Link', onPress: () => handleCopyLink(postId) },
          { text: 'Share via...', onPress: handleShare },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [comments]);

  const timeAgo = formatTimeAgo(post.created_at);
  const authorName = post.profiles?.name || 'Unknown User';
  const authorAvatar = post.profiles?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.name || 'User')}&background=random`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar url={authorAvatar} name={authorName} size={40} />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{authorName}</Text>
          <Text style={styles.timestamp}>{timeAgo}</Text>
        </View>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      {post.image_url && <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons name={postLikes.liked ? 'heart' : 'heart-outline'} size={24} color={postLikes.liked ? '#ef4444' : '#71717a'} />
          <Text style={[styles.actionText, postLikes.liked && styles.likedText]}>{postLikes.count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="chatbubble-outline" size={24} color="#71717a" />
          <Text style={styles.actionText}>{postComments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleShareOptions(post.id)}>
          <Ionicons name="share-outline" size={20} color="#71717a" />
        </TouchableOpacity>

      </View>

      <ScrollView style={{ marginTop: 8 }}>
        {visibleComments.map((c) => (
          <View key={c.id} style={{ marginTop: 4 }}>
            <Text style={{ color: '#fff', fontSize: 14 }}>
              <Text style={{ fontWeight: '600' }}>{c.profiles?.name || 'Unknown'}: </Text>
              {c.content}
            </Text>
          </View>
        ))}

        {postComments.length > 2 && !showAllComments && (
          <TouchableOpacity onPress={() => setShowAllComments(true)}>
            <Text style={{ color: '#888', marginTop: 4 }}>See more comments</Text>
          </TouchableOpacity>
        )}

        {showAllComments && postComments.length > 2 && (
          <TouchableOpacity onPress={() => setShowAllComments(false)}>
            <Text style={{ color: '#888', marginTop: 4 }}>Show less</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.bottomModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        swipeDirection="down"
        onSwipeComplete={() => setModalVisible(false)}
        propagateSwipe
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Add Comment</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#999"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            autoFocus
          />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddComment} style={[styles.modalButton, { backgroundColor: '#ef4444' }]}>
              <Text style={[styles.modalButtonText, { color: '#fff' }]}>Post</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    padding: 16
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  avatar: {
    backgroundColor: '#e1e1e1'
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarLoading: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#27272a'
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  userInfo: {
    flex: 1,
    marginLeft: 12
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  timestamp: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 2
  },

  content: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 12
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12
  },

  actions: {
    flexDirection: 'row',
    gap: 16
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  actionText: {
    fontSize: 14,
    color: '#71717a'
  },
  likedText: {
    color: '#ef4444'
  },

  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0
  },
  modalContent: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12
  },
  commentInput: {
    backgroundColor: '#2c2c2c',
    color: '#fff',
    padding: 8,
    borderRadius: 8,
    minHeight: 60
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 30,

  },
  modalButtonText: {
    fontWeight: '600',
    color: '#fff'
  },
});
