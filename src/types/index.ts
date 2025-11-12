export interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  } | null; 
  likes: {
    user_id: string;
  }[] | null;
  comments?: Comment[];
};

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export interface PostWithDetails extends Post {
  author_name: string;
  author_avatar: string;
  likes_count: number;
  is_liked: boolean;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Post: undefined;
  Profile: undefined;
};

export type FeedStackParamList = {
  FeedMain: undefined;
  CreatePost: undefined;
};