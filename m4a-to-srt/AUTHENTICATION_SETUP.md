<!-- @format -->

# M4A to SRT Authentication Setup

This guide will help you set up Firebase authentication and usage tracking for your M4A to SRT converter.

## 🚀 Quick Setup Overview

I've implemented the following features:

- ✅ Firebase authentication (Email/Password + Google OAuth)
- ✅ User usage tracking (2 free conversions per user)
- ✅ Admin access (unlimited conversions for you)
- ✅ Secure backend with authentication checks
- ✅ Modern authentication UI with modal

## 📋 Prerequisites

1. Firebase project
2. Node.js 18+ (backend uses Firebase Admin SDK)
3. Firebase service account key

## 🔧 Frontend Setup

### 1. Install Dependencies

```bash
cd nextjs-frontend
npm install
```

### 2. Firebase Configuration

1. Copy the environment file:

   ```bash
   cp env.example .env.local
   ```

2. Update `.env.local` with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_ADMIN_EMAIL=your-actual-email@domain.com
   ```

### 3. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (optional but recommended)
4. Enable Firestore:
   - Go to Firestore Database
   - Create database in production mode
   - Set rules (see below)

### 4. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
cd ../backend
pip install -r requirements.txt
```

### 2. Firebase Admin SDK Setup

You need a service account key for the Firebase Admin SDK.

#### Option A: Service Account JSON String

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Copy the entire JSON content
4. Set as environment variable:
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_JSON='{"type": "service_account", "project_id": "your-project", ...}'
   ```

#### Option B: Service Account File

1. Download the service account key file
2. Set the file path:
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account-key.json
   ```

### 3. Environment Variables

```bash
cp env.example .env
```

Update `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_JSON=your_service_account_json
# OR
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account-key.json

ADMIN_EMAIL=your-actual-email@domain.com
PORT=8000
```

## 🎯 How It Works

### Frontend Features

- **Authentication Modal**: Clean signup/signin with email or Google
- **Usage Tracking**: Shows remaining free conversions (2 total)
- **Admin Badge**: Special "👑 Admin" badge for you
- **Conversion Limits**: Blocks conversion attempts when limit reached

### Backend Security

- **Token Verification**: All conversion requests require valid Firebase token
- **Usage Tracking**: Automatically increments usage count
- **Admin Override**: Your email gets unlimited conversions
- **Database Integration**: Stores user data in Firestore

### User Flow

1. User visits the app
2. When they try to upload/convert, auth modal appears
3. After signing in, they see their usage status
4. Can convert files until they hit the 2-conversion limit
5. Admin (you) has unlimited access

## 🔑 Admin Access

You get unlimited conversions by setting your email in the environment variables:

- Frontend: `NEXT_PUBLIC_ADMIN_EMAIL`
- Backend: `ADMIN_EMAIL`

Make sure both match your actual email address!

## 🚀 Running the Application

### Development

```bash
# Frontend
cd nextjs-frontend
npm run dev

# Backend (in another terminal)
cd ../backend
python main.py
```

### Production

- Frontend: Deploy to Vercel/Netlify
- Backend: Deploy to Railway/Render/Google Cloud

## 🛠️ Testing

1. **Sign up** with a new email
2. **Convert 2 files** - should work fine
3. **Try a 3rd conversion** - should be blocked
4. **Sign in with admin email** - should have unlimited access

## 💡 Next Steps

When you're ready to add payments:

1. Integrate Lemon Squeezy
2. Add subscription status to user data
3. Update `can_user_convert()` to check subscription
4. Add upgrade flow in the frontend

## 🐛 Troubleshooting

- **Firebase errors**: Check your API keys and project ID
- **Admin not working**: Verify email matches in both environments
- **Backend auth fails**: Ensure service account key is valid
- **CORS issues**: Make sure backend allows your frontend origin

The app is now ready for authenticated users! 🎉
