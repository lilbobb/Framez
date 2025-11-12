## Framez - Social Media Mobile App

A modern, Threads-inspired social media application built with React Native and Expo. Share moments, connect with others, and engage with posts in a beautiful dark-themed interface.

![Framez](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

##  Features

-  **User Authentication** - Secure sign up, login, and persistent sessions
-  **Create Posts** - Share text and images with your followers
-  **Feed** - View posts from all users in real-time
-  **Like Posts** - Engage with content you love
-  **User Profile** - View your posts and account information
-  **Real-time Updates** - See new posts instantly
-  **Native Experience** - Smooth animations and native components

##  Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Supabase account (free tier available)

### Installation

1. **Clone the repository**

git clone https://github.com/lilbobb/framez.git
cd framez


2. **Install dependencies**

npm install


3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Run the SQL schema (see Database Setup below)

4. **Configure environment**

cp contants.ts

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

5. **Update Supabase config**

Edit `src/config/supabase.ts` and replace the placeholder values:

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

6. **Start the development server**

npx expo start

7. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

##  Project Structure

framez/\
├── App.tsx                          # Root component\
├── app.json                        # Expo configuration\
├── package.json                    # Dependencies\
├\
│\
└── src/\
    ├── config/\
    │   └── supabase.ts            # Supabase client setup\
    |   └── constants.ts            # environment variables\
    │\
    ├── contexts/\
    │   └── AuthContext.tsx         # Authentication context\
    |   └── PostsContext.tsx         # Posts context\
    │\
    ├── navigation/\
    │   ├── AppNavigator.tsx        # Main navigation\
    │   ├── AuthNavigator.tsx       # Auth flow\
    │   └── MainNavigator.tsx       # Tab navigation\
    |   └── WebNavigator.tsx       # web navigation\
    │\
    ├── screens/\
    │   ├── auth/\
    │   │   ├── LoginScreen.tsx     # Login screen\
    │   │   └── SignUpScreen.tsx    # Sign up screen\
    │   │\
    │   └── main/\
    │       ├── FeedScreen.tsx      # Home feed\
    │       ├── ProfileScreen.tsx    # User profile\
    │       └── CreatePostScreen.tsx  # Create post\
    │\
    └── components/\
    |   └── Post.js                # Post component\
    |\
    |\
    └── types/\
    │   └── AppNaindex.ts        # types\
    │   
    └── utils/\
    │   └── helpers.ts       # Tab navigation\
    |   └── validation.ts       # Tab navigation
    


## 🗄️ Database Setup

### 1. Run SQL Schema in Supabase

Go to your Supabase project → SQL Editor → New Query, and run the following:

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

CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Posts are viewable by everyone" 
  ON posts FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create posts" 
  ON posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" 
  ON posts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" 
  ON posts FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by everyone" 
  ON likes FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can like posts" 
  ON likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" 
  ON likes FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX likes_post_id_idx ON likes(post_id);
CREATE INDEX likes_user_id_idx ON likes(user_id);

### 2. Set up Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket named `post-images`
3. Make it **public**
4. Go to **Policies** tab and add these policies:

CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-images' 
    AND auth.uid() = owner
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images' 
    AND auth.uid() = owner
  );

## 🔐 Authentication Setup

Supabase Auth is automatically configured. Users can:
- Sign up with email/password
- Login with existing credentials
- Stay logged in (persistent sessions)
- Logout securely

### Email Confirmation (Optional)

By default, Supabase requires email confirmation. To disable for development:

1. Go to **Authentication** → **Settings**
2. Disable "Enable email confirmations"

##  Dependencies

### Core Dependencies
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

##  UI/UX Features

- **Dark Theme** - Modern black theme inspired by Threads
- **Smooth Animations** - Native transitions and interactions
- **Pull to Refresh** - Refresh feed with native gesture
- **Image Preview** - View full images before posting
- **Real-time Like Updates** - Instant feedback on likes
- **Keyboard Aware** - Smart keyboard handling
- **Loading States** - Clear loading indicators

## Testing

### Run on iOS Simulator (Mac only)
npx expo start --ios

### Run on Android Emulator

npx expo start --android

### Run on Physical Device
1. Install **Expo Go** from App Store/Play Store
2. Run `npx expo start`
3. Scan QR code with Expo Go (Android) or Camera (iOS)

## Building for Production

### iOS Build
npm install -g eas-cli

eas build:configure

eas build --platform ios


### Android Build

eas build --platform android --profile preview

eas build --platform android --profile production


##  Deployment to Appetize.io

1. **Build the app**
eas build --platform android --profile preview

2. **Download the APK** from EAS build dashboard

3. **Upload to Appetize.io**
   - Go to [appetize.io](https://appetize.io)
   - Click "Upload App"
   - Upload your APK/IPA file
   - Configure device settings
   - Get shareable public link

4. **Share your app**
   - Copy the public link
   - Share with testers or add to README

##  Troubleshooting

### Metro bundler cache issues

npx expo start -c


### Dependency conflicts

rm -rf node_modules package-lock.json
npm install

### Supabase connection issues
- Verify your URL and anon key are correct
- Check if your IP is allowed in Supabase settings
- Ensure RLS policies are set up correctly

### Image upload fails
- Verify storage bucket exists and is public
- Check storage policies are correctly configured
- Ensure bucket name matches 'post-images'

### Auth not persisting
- Check AsyncStorage permissions
- Verify Supabase auth configuration
- Clear app data and try again

## API Documentation

### Authentication

const { data, error } = await signUp(email, password, name);

const { data, error } = await signIn(email, password);

await signOut();

const { user } = useAuth();

### Posts

await supabase.from('posts').insert({
  user_id: user.id,
  content: 'Hello World',
  image_url: 'https://...'
});

const { data } = await supabase
  .from('posts')
  .select('*, profiles(*), likes(*)')
  .order('created_at', { ascending: false });

await supabase
  .from('posts')
  .delete()
  .eq('id', postId);

### Likes

await supabase
  .from('likes')
  .insert({ post_id, user_id });

await supabase
  .from('likes')
  .delete()
  .eq('post_id', postId)
  .eq('user_id', userId);

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

- GitHub: [@lilbobb](https://github.com/lilbobb)
- Email: ukurowo@gmail.com

##  Acknowledgments

- [Expo](https://expo.dev/) - For the amazing development platform
- [Supabase](https://supabase.com/) - For the backend infrastructure
- [React Navigation](https://reactnavigation.org/) - For navigation
- [Threads](https://threads.net) - For UI/UX inspiration

## Demo Video

[Watch Demo Video](https://your-demo-video-link.com)

## Links

- **Live Demo**: [Appetize.io Link](https://appetize.io/app/your-app-id)
- **GitHub**: [Repository](https://github.com/lilbobb/framez)

---
#   F r a m e z 
 
 
