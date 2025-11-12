import * as FileSystem from 'expo-file-system';
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { Comment, Post } from '../types';
import { useAuth } from './AuthContext';

interface PostsState {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  comments: { [postId: string]: Comment[] };
  likes: { [postId: string]: { liked: boolean; count: number } };
  error: string | null;
}

type PostsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_POSTS'; payload: Post[] }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'UPDATE_POST'; payload: Post }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'SET_COMMENTS'; payload: { postId: string; comments: Comment[] } }
  | { type: 'ADD_COMMENT'; payload: { postId: string; comment: Comment } }
  | { type: 'DELETE_COMMENT'; payload: { postId: string; commentId: string } }
  | { type: 'SET_LIKE'; payload: { postId: string; liked: boolean; count: number } }
  | { type: 'UPDATE_LIKE'; payload: { postId: string; liked: boolean } }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: PostsState = {
  posts: [],
  loading: true,
  refreshing: false,
  comments: {},
  likes: {},
  error: null,
};

const postsReducer = (state: PostsState, action: PostsAction): PostsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };
    case 'SET_POSTS':
      return { ...state, posts: action.payload };
    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts] };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.id ? action.payload : post
        ),
      };
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload),
      };
    case 'SET_COMMENTS':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.postId]: action.payload.comments,
        },
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.postId]: [
            ...(state.comments[action.payload.postId] || []),
            action.payload.comment,
          ],
        },
      };
    case 'DELETE_COMMENT':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.postId]: (state.comments[action.payload.postId] || []).filter(
            comment => comment.id !== action.payload.commentId
          ),
        },
      };
    case 'SET_LIKE':
      return {
        ...state,
        likes: {
          ...state.likes,
          [action.payload.postId]: {
            liked: action.payload.liked,
            count: action.payload.count,
          },
        },
      };
    case 'UPDATE_LIKE':
      return {
        ...state,
        likes: {
          ...state.likes,
          [action.payload.postId]: {
            ...state.likes[action.payload.postId],
            liked: action.payload.liked,
            count: action.payload.liked
              ? (state.likes[action.payload.postId]?.count || 0) + 1
              : Math.max((state.likes[action.payload.postId]?.count || 0) - 1, 0),
          },
        },
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

interface PostsContextType {
  state: PostsState;
  fetchPosts: (userId?: string) => Promise<void>;
  createPost: (content: string, imageUri?: string | null) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  initializeLikes: (postId: string) => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(postsReducer, initialState);
  const { user } = useAuth();

  const likesRef = useRef(state.likes);

  useEffect(() => {
    likesRef.current = state.likes;
  }, [state.likes]);

  const fetchUserProfiles = async (userIds: string[]) => {
    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0) return {};

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', uniqueUserIds);

    if (error) {
      console.error('Error fetching profiles:', error);
      return {};
    }

    return profiles?.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>) || {};
  };

  const fetchPosts = useCallback(async (userId?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      if (postsData && postsData.length > 0) {
        const userIds = postsData.map(post => post.user_id);
        const userProfiles = await fetchUserProfiles(userIds);

        const postsWithUsers = postsData.map(post => ({
          ...post,
          profiles: userProfiles[post.user_id] || {
            name: 'Unknown User',
            avatar_url: null,
          },
          likes: [],
        }));

        dispatch({ type: 'SET_POSTS', payload: postsWithUsers });
      } else {
        dispatch({ type: 'SET_POSTS', payload: [] });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      dispatch({ type: 'SET_POSTS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);


  const uploadImage = async (uri: string, user: any): Promise<string> => {
    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();

        const { data, error } = await supabase.storage
          .from('post-images')
          .upload(fileName, blob, {
            contentType: `image/${fileExt}`,
            upsert: false
          });

        if (error) throw error;
      } else {
        try {
          const filePath = `${user.id}/${fileName}`;
          const { data: { session } } = await supabase.auth.getSession();

          if (!session) {
            throw new Error('No authentication session found');
          }

          const formData = new FormData();
          formData.append('file', {
            uri: uri,
            type: `image/${fileExt}`,
            name: fileName,
          } as any);

          const response = await fetch(
            `https://ugqnmjleptxqfopyajqm.supabase.co/storage/v1/object/post-images/${filePath}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }
        } catch (mobileError) {
          console.log('FormData upload failed, trying base64:', mobileError);
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const { error } = await supabase.storage
            .from('post-images')
            .upload(fileName, `data:image/${fileExt};base64,${base64}`, {
              contentType: `image/${fileExt}`,
              upsert: false
            });

          if (error) throw error;
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createPost = useCallback(
    async (content: string, imageUri?: string | null) => {
      if (!user) throw new Error('User not authenticated');

      let imageUrl: string | null = null;

      if (imageUri) {
        try {
          imageUrl = await uploadImage(imageUri, user);
        } catch (error) {
          console.error('Image upload failed, creating text-only post:', error);
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          image_url: imageUrl,
        })
        .select('*')
        .single();

      if (error) throw error;

      const userProfiles = await fetchUserProfiles([user.id]);
      const postWithUser = {
        ...data,
        profiles: userProfiles[user.id] || {
          name: 'Unknown User',
          avatar_url: null,
        },
        likes: [],
      };

      dispatch({ type: 'ADD_POST', payload: postWithUser });

      return data;
    },
    [user]
  );

  const deletePost = useCallback(async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
    dispatch({ type: 'DELETE_POST', payload: postId });
  }, []);

  const refreshPosts = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    await fetchPosts();
    dispatch({ type: 'SET_REFRESHING', payload: false });
  }, [fetchPosts]);

  const addComment = useCallback(
    async (postId: string, content: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        })
        .select(`
          *,
          profiles:user_id (name, avatar_url)
        `)
        .single();

      if (error) throw error;

      dispatch({
        type: 'ADD_COMMENT',
        payload: { postId, comment: data },
      });
    },
    [user]
  );

  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      dispatch({
        type: 'DELETE_COMMENT',
        payload: { postId, commentId },
      });
    },
    [user]
  );

  const initializeLikes = useCallback(
    async (postId: string) => {
      if (!user) return;

      try {
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        const { count, error: countError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (!countError) {
          dispatch({
            type: 'SET_LIKE',
            payload: {
              postId,
              liked: !!likeData,
              count: count || 0,
            },
          });
        }
      } catch (error) {
        console.error('Error initializing likes:', error);
      }
    },
    [user]
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) return;

      const currentLike = likesRef.current[postId];
      const currentlyLiked = currentLike?.liked || false;

      try {
        if (currentlyLiked) {
          const { error } = await supabase
            .from('likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from('likes').insert({
            post_id: postId,
            user_id: user.id,
          });

          if (error) throw error;
        }

        dispatch({
          type: 'UPDATE_LIKE',
          payload: { postId, liked: !currentlyLiked },
        });
      } catch (error) {
        console.error('Error toggling like:', error);
      }
    },
    [user]
  );

  useEffect(() => {
    const postsSubscription = supabase
      .channel('posts-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
    };
  }, [fetchPosts]);

  const value: PostsContextType = {
    state,
    fetchPosts,
    createPost,
    deletePost,
    refreshPosts,
    addComment,
    deleteComment,
    toggleLike,
    initializeLikes,
  };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};