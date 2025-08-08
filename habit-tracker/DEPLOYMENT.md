<!-- @format -->

# Deployment Guide

This guide will help you deploy the Habit Tracker application to production.

## Prerequisites

1. **Supabase Project**

   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `frontend/database/schema.sql`
   - Get your project URL and anon key

2. **Firebase Project**

   - Create a project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication
   - Enable Email/Password and Google sign-in
   - Generate a service account key for the backend

3. **Google Cloud Project** (for backend)

   - Create or use existing GCP project
   - Enable Cloud Run API
   - Enable Container Registry API

4. **Vercel Account** (for frontend)
   - Create account at [vercel.com](https://vercel.com)

## Frontend Deployment (Vercel)

### 1. Prepare Repository

Ensure your code is pushed to GitHub, GitLab, or Bitbucket.

### 2. Deploy to Vercel

1. **Connect Repository**

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select your repository

2. **Configure Build Settings**

   - Framework Preset: Next.js
   - Root Directory: `habit-tracker/frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables**

   In Vercel dashboard, add these environment variables:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=https://your-backend-url
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application

### 3. Configure Custom Domain (Optional)

1. Add your domain in Vercel dashboard
2. Update DNS records as instructed
3. SSL certificate will be automatically provisioned

## Backend Deployment (Google Cloud Run)

### 1. Setup Google Cloud

1. **Install Google Cloud SDK**

   ```bash
   # macOS
   brew install google-cloud-sdk

   # Or download from https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate**

   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable APIs**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

### 2. Prepare Environment Variables

Create a secret manager or use Cloud Run environment variables:

```bash
# Set environment variables for Cloud Run
gcloud run deploy habit-tracker-backend \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="SUPABASE_URL=your_supabase_url" \
  --set-env-vars="SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" \
  --set-env-vars="FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_service_account_json" \
  --set-env-vars="FRONTEND_URL=https://your-frontend-domain.vercel.app"
```

### 3. Deploy Backend

1. **Build and Deploy**

   ```bash
   cd habit-tracker/backend
   gcloud builds submit --config cloudbuild.yaml
   ```

2. **Alternative: Manual Docker Build**

   ```bash
   # Build Docker image
   docker build -t gcr.io/YOUR_PROJECT_ID/habit-tracker-backend .

   # Push to Container Registry
   docker push gcr.io/YOUR_PROJECT_ID/habit-tracker-backend

   # Deploy to Cloud Run
   gcloud run deploy habit-tracker-backend \
     --image gcr.io/YOUR_PROJECT_ID/habit-tracker-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### 4. Configure Custom Domain (Optional)

1. **Map custom domain**

   ```bash
   gcloud run domain-mappings create \
     --service habit-tracker-backend \
     --domain api.yourdomain.com \
     --region us-central1
   ```

2. **Update DNS records** as instructed by Google Cloud

## Database Configuration

### 1. Supabase Setup

1. **Create Project**

   - Go to [supabase.com](https://supabase.com)
   - Create new project

2. **Run Database Schema**

   - Go to SQL Editor in Supabase dashboard
   - Copy and run the SQL from `frontend/database/schema.sql`

3. **Configure RLS Policies**
   - Policies are included in the schema
   - Verify they're enabled in the Authentication > Policies section

### 2. Firebase Setup

1. **Authentication Configuration**

   - Enable Email/Password provider
   - Enable Google provider
   - Add your production domain to authorized domains

2. **Service Account**
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Use the JSON content for `FIREBASE_SERVICE_ACCOUNT_KEY`

## Post-Deployment Checklist

### Frontend

- [ ] Application loads correctly
- [ ] Authentication works (sign up/sign in)
- [ ] Habit creation and management works
- [ ] Public profiles are accessible
- [ ] All environment variables are set

### Backend

- [ ] Health check endpoint responds (`/health`)
- [ ] API endpoints work with authentication
- [ ] CORS is configured for frontend domain
- [ ] Database operations work correctly

### Security

- [ ] HTTPS is enabled on both frontend and backend
- [ ] Firebase authentication is working
- [ ] Supabase RLS policies are active
- [ ] Environment variables are secure

## Monitoring and Maintenance

### Logs

- **Frontend**: View deployment logs in Vercel dashboard
- **Backend**: Use `gcloud logs read` or Cloud Logging console

### Performance

- Monitor Core Web Vitals in Vercel Analytics
- Set up Cloud Monitoring for backend metrics

### Updates

- Frontend: Push to main branch for automatic deployment
- Backend: Run Cloud Build or update Cloud Run service

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Verify `FRONTEND_URL` is set correctly in backend
   - Check Firebase authorized domains

2. **Database Connection Issues**

   - Verify Supabase credentials
   - Check RLS policies

3. **Authentication Problems**

   - Verify Firebase configuration
   - Check service account permissions

4. **Build Failures**
   - Check environment variables
   - Verify all dependencies are installed

### Getting Help

- Check deployment logs for specific error messages
- Verify all environment variables are set correctly
- Test API endpoints directly with curl or Postman
