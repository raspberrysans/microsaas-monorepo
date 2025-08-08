<!-- @format -->

# Habit Tracker

A beautiful and aesthetic habit tracking application built with modern web technologies.

## Features

- ✅ **Habit Management**: Create, update, and delete habits with categories
- 🎯 **Priority System**: Mark habits as low, medium, or high priority
- ⭐ **Non-Negotiables**: Set essential habits that are must-dos
- 📊 **Frequency Tracking**: Daily, weekly, and monthly habit frequencies
- 🎨 **Category Organization**: Group habits by custom categories with colors
- 👥 **Public Profiles**: Share your habit dashboard with custom URLs
- 🔐 **Firebase Authentication**: Secure login with email and Google
- 📱 **Responsive Design**: Beautiful UI that works on all devices

## Tech Stack

### Frontend

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **Firebase Auth** for authentication
- **Supabase** for database
- **Lucide React** for icons
- **Date-fns** for date utilities

### Backend

- **Node.js** with TypeScript
- **Express.js** for API routes
- **Supabase** as database
- **Google Cloud Run** for deployment

### Database

- **Supabase (PostgreSQL)** with Row Level Security
- **Firebase Auth** for user management

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Firebase project

### Frontend Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo>
   cd habit-tracker/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Fill in your environment variables:

   - Firebase configuration
   - Supabase URL and anon key

4. **Set up the database**

   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql` in the Supabase SQL editor

5. **Configure Firebase**

   - Create a Firebase project
   - Enable Authentication
   - Enable Email/Password and Google sign-in methods
   - Add your domain to authorized domains

6. **Start the development server**
   ```bash
   npm run dev
   ```

### Database Schema

The app uses the following main tables:

- `profiles` - User profile information
- `habit_categories` - Habit categories with colors and icons
- `habits` - Individual habits with priority and frequency settings
- `habit_logs` - Daily habit completion tracking

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API (for production)
NEXT_PUBLIC_API_URL=https://your-backend-url
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Google Cloud Run)

1. Set up Google Cloud project
2. Configure Docker and Cloud Run
3. Deploy using the provided configuration

## Usage

### Creating Habit Categories

1. Click "Add Category" on the dashboard
2. Choose a name, description, and color
3. Start adding habits to the category

### Adding Habits

1. Click "Add Habit" in any category
2. Set the habit name and description
3. Choose priority level (low, medium, high)
4. Mark as non-negotiable if it's essential
5. Set frequency (daily, weekly, monthly)
6. Choose if it should be public

### Public Profiles

1. Go to Settings
2. Set up your profile information
3. Generate or create a custom public URL
4. Share your habit tracking journey with others

### Tracking Progress

- Click the circle next to any habit to mark it complete for today
- View your progress over time
- Non-negotiable habits are highlighted in red

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you have any questions or issues, please open an issue on GitHub.
