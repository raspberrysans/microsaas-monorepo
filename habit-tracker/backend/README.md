<!-- @format -->

# Habit Tracker Backend

Node.js/Express API backend for the Habit Tracker application.

## Features

- 🔐 Firebase Authentication middleware
- 🗄️ Supabase database integration
- 📊 RESTful API for habits and categories
- 👤 User profile management
- 🔒 Row Level Security enforcement
- 🐳 Docker containerization
- ☁️ Google Cloud Run deployment

## Tech Stack

- **Node.js** with TypeScript
- **Express.js** for API routes
- **Firebase Admin SDK** for authentication
- **Supabase** for database operations
- **Docker** for containerization

## API Endpoints

### Authentication

All habit endpoints require Firebase ID token in Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### Habits

- `GET /api/habits` - Get all categories and habits for user
- `POST /api/habits/categories` - Create new habit category
- `PUT /api/habits/categories/:id` - Update habit category
- `DELETE /api/habits/categories/:id` - Delete habit category
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/logs` - Log habit completion
- `GET /api/habits/:id/logs` - Get habit completion logs

### Profiles

- `GET /api/profiles` - Get authenticated user's profile
- `POST /api/profiles` - Create/update user profile
- `GET /api/profiles/:username` - Get public profile by username

### Health Check

- `GET /health` - Health check endpoint

## Local Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

3. **Configure environment variables**

   - Supabase URL and service role key
   - Firebase service account JSON
   - Frontend URL for CORS

4. **Start development server**
   ```bash
   npm run dev
   ```

## Deployment

### Google Cloud Run

1. **Build and deploy using Cloud Build**

   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

2. **Set environment variables in Cloud Run**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FIREBASE_SERVICE_ACCOUNT_KEY`
   - `FRONTEND_URL`

### Docker

1. **Build Docker image**

   ```bash
   docker build -t habit-tracker-backend .
   ```

2. **Run container**
   ```bash
   docker run -p 3001:3001 \
     -e SUPABASE_URL=your_url \
     -e SUPABASE_SERVICE_ROLE_KEY=your_key \
     habit-tracker-backend
   ```

## Environment Variables

| Variable                       | Description                          | Required |
| ------------------------------ | ------------------------------------ | -------- |
| `PORT`                         | Server port (default: 3001)          | No       |
| `NODE_ENV`                     | Environment (development/production) | No       |
| `FRONTEND_URL`                 | Frontend URL for CORS                | Yes      |
| `SUPABASE_URL`                 | Supabase project URL                 | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`    | Supabase service role key            | Yes      |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account JSON        | Yes      |

## Error Handling

The API returns consistent error responses:

```json
{
	"error": "Error message"
}
```

HTTP status codes used:

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Security

- Firebase ID token verification for authentication
- CORS enabled for frontend domain only
- Helmet.js for security headers
- Row Level Security enforced through Supabase
- User data isolation by Firebase UID
