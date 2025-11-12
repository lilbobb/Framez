# Framez - Social Media Mobile App

A modern, Threads-inspired social media application built with React Native and Expo. Share moments, connect with others, and engage with posts in a beautiful dark-themed interface.

![Framez](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## Features

- **User Authentication** - Secure sign up, login, and persistent sessions
- **Create Posts** - Share text and images with your followers
- **Feed** - View posts from all users in real-time
- **Like Posts** - Engage with content you love
- **User Profile** - View your posts and account information
- **Real-time Updates** - See new posts instantly
- **Native Experience** - Smooth animations and native components

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/lilbobb/framez.git
cd framez

## Install dependencies
npm install

Set up Supabase

Create a new project at supabase.com

Copy your project URL and anon key

Run the SQL schema (see Database Setup below)

Configure environment

cp constants.ts

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

Update Supabase config
Edit src/config/supabase.ts and replace the placeholder values:

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

Start the development server

npx expo start

Run on device/simulator

Press i for iOS simulator

Press a for Android emulator

Scan QR code with Expo Go app on physical device

Project Structure

framez/
├── App.tsx                       # Root component
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
└── src/
    ├── config/
    │   ├── supabase.ts           # Supabase client setup
    │   └── constants.ts          # environment variables
    ├── contexts/
    │   ├── AuthContext.tsx       # Authentication context
    │   └── PostsContext.tsx      # Posts context
    ├── navigation/
    │   ├── AppNavigator.tsx      # Main navigation
    │   ├── AuthNavigator.tsx     # Auth flow
    │   ├── MainNavigator.tsx     # Tab navigation
    │   └── WebNavigator.tsx      # Web navigation
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   └── SignUpScreen.tsx
    │   └── main/
    │       ├── FeedScreen.tsx
    │       ├── ProfileScreen.tsx
    │       └── CreatePostScreen.tsx
    ├── components/
    │   └── Post.js
    ├── types/
    │   └── AppNaindex.ts
    └── utils/
        ├── helpers.ts
        └── validation.ts

Database Setup
1. Run SQL Schema in Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts are viewable by everyone" 
  ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" 
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" 
  ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" 
  ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by everyone" 
  ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like posts" 
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" 
  ON likes FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX likes_post_id_idx ON likes(post_id);
CREATE INDEX likes_user_id_idx ON likes(user_id);

2. Set up Storage Bucket

Go to Storage in Supabase dashboard

Create a new bucket named post-images and make it public

Add these policies:

CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'post-images' AND auth.uid() = owner);

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-images' AND auth.uid() = owner);

Authentication Setup

Supabase Auth allows:

Sign up with email/password

Login

Persistent sessions

Logout securely

Email Confirmation (Optional)

To disable email confirmation for development:

Go to Authentication → Settings

Disable "Enable email confirmations"

Dependencies
Core Dependencies

{
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/bottom-tabs": "^6.5.11",
  "@react-navigation/native-stack": "^6.9.17",
  "@react-native-async-storage/async-storage": "1.23.1",
  "@expo/vector-icons": "^14.0.0",
  "expo-image-picker": "~15.0.5",
  "@supabase/supabase-js": "^2.39.0",
  "react-native-url-polyfill": "^2.0.0",
  "date-fns": "^3.0.0"
}

UI/UX Features

Dark Theme

Smooth Animations

Pull to Refresh

Image Preview

Real-time Like Updates

Keyboard Aware

Loading States

Testing

# iOS Simulator (Mac only)
npx expo start --ios

# Android Emulator
npx expo start --android

# Physical Device
npx expo start

Building for Production

# iOS
npm install -g eas-cli
eas build:configure
eas build --platform ios

# Android
eas build --platform android --profile preview
eas build --platform android --profile production

Deployment to Appetize.io

Build the app

Download APK/IPA

Upload to Appetize.io

Share public link

Troubleshooting

# Metro bundler cache issues
npx expo start -c

# Dependency conflicts
rm -rf node_modules package-lock.json
npm install

Supabase connection issues → verify URL, anon key, IP, and RLS policies

Image upload fails → check bucket and policies

Auth not persisting → check AsyncStorage and Supabase config

API Documentation
Authentication
const { data, error } = await signUp(email, password, name);
const { data, error } = await signIn(email, password);
await signOut();
const { user } = useAuth();

Posts

await supabase.from('posts').insert({
  user_id: user.id,
  content: 'Hello World',
  image_url: 'https://...'
});

const { data } = await supabase
  .from('posts')
  .select('*, profiles(*), likes(*)')
  .order('created_at', { ascending: false });

await supabase.from('posts').delete().eq('id', postId);

Likes
await supabase.from('likes').insert({ post_id, user_id });
await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);

Contributing

Fork the repository

Create feature branch

Commit changes

Push to branch

Open Pull Request

License

MIT License - see LICENSE

Author

GitHub: @lilbobb

Email: ukurowo@gmail.com

Acknowledgments

Expo

Supabase

React Navigation


Demo Video

Watch Demo Video

Links

Live Demo: Appetize.io Link

GitHub: Repository


---