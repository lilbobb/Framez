import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import WebNavBar from '../../components/WebNavBar';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../contexts/PostsContext';
import { validatePostContent } from '../../utils/validation';

export default function CreatePostScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [content, setContent] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { user } = useAuth();
  const { createPost } = usePosts();

  const pickImage = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to share photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePost = async (): Promise<void> => {
    const contentValidation = validatePostContent(content);
    if (!contentValidation.valid) {
      Alert.alert('Error', contentValidation.error || 'Invalid post content');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to post');
      return;
    }

    setUploading(true);
    try {
      await createPost(content, imageUri);
      navigation.goBack();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() || imageUri) {
      setShowCancelModal(true);
    } else {
      navigation.goBack();
    }
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    navigation.goBack();
  };

  const isPostButtonDisabled = !content.trim() || uploading;

  return (
    <View style={styles.mainContainer}>
      {Platform.OS === 'web' && <WebNavBar />}
      <View style={styles.contentContainer}>
        <ResponsiveContainer>
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleCancel} disabled={uploading}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Post</Text>
              <TouchableOpacity
                style={[
                  styles.postButtonHeader,
                  isPostButtonDisabled && styles.buttonDisabled
                ]}
                onPress={handlePost}
                disabled={isPostButtonDisabled}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.postButtonTextHeader}>Post</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="What's on your mind?"
                  placeholderTextColor="#71717a"
                  multiline
                  value={content}
                  onChangeText={setContent}
                  autoFocus
                  editable={!uploading}
                  maxLength={5000}
                />
                <Text style={styles.characterCount}>
                  {content.length} / 5000
                </Text>
              </View>

              {imageUri && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => setImageUri(null)}
                    disabled={uploading}
                  >
                    <Ionicons name="close-circle" size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.imagePickerButton, uploading && styles.buttonDisabled]}
                onPress={pickImage}
                disabled={uploading}
              >
                <Ionicons name="image-outline" size={24} color="#FFFFFF" />
                <Text style={styles.imagePickerText}>
                  {imageUri ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>

              {uploading && (
                <View style={styles.uploadStatus}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.uploadStatusText}>
                    {imageUri ? 'Uploading post...' : 'Creating post...'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </ResponsiveContainer>
      </View>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Discard Post?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to discard this post?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.keepEditingButton]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonText}>Keep Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.discardButton]}
                onPress={confirmCancel}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Discard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
  },
  cancelButton: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  postButtonHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonTextHeader: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  input: {
    fontSize: 18,
    color: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'right',
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  imagePickerText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  uploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginHorizontal: 16,
  },
  uploadStatusText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#18181b',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalMessage: {
    color: '#d4d4d8',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  keepEditingButton: {
    backgroundColor: '#3f3f46',
  },
  discardButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});