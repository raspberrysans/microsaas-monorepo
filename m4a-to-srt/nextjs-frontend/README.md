<!-- @format -->

# M4A to SRT Converter - Frontend

A modern Next.js frontend application for converting M4A audio files to SRT subtitle files using AI transcription.

## Features

- 🎵 **Drag & Drop File Upload**: Easy M4A file upload with drag and drop support
- 🤖 **AI-Powered Transcription**: Uses OpenAI Whisper for accurate speech recognition
- ⚙️ **Customizable Settings**: Adjust words per segment and frame rate
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🌙 **Dark Mode Support**: Automatic dark/light theme switching
- 📊 **Real-time Progress**: Live progress tracking during conversion
- 💾 **Instant Download**: Direct download of generated SRT files

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React 19** for UI components

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see backend README)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Update the backend URL in `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable                  | Description     | Default                 |
| ------------------------- | --------------- | ----------------------- |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:8000` |

## Usage

1. **Upload File**: Drag and drop or click to select an M4A audio file (max 100MB)
2. **Configure Settings**:
   - **Words per Segment**: Number of words in each subtitle (1-50)
   - **Frame Rate**: Video frame rate for timing (1-120 fps)
3. **Convert**: Click "Convert to SRT" to start the AI transcription
4. **Download**: Download the generated SRT file when ready

## API Integration

The frontend communicates with the backend API:

- **Endpoint**: `POST /api/convert`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: M4A audio file
  - `words_per_segment`: Number of words per subtitle
  - `frame_rate`: Frame rate for timing calculations

## Components

- **FileUploader**: Handles M4A file upload with validation
- **ConversionSettings**: Configuration panel for transcription settings
- **ConversionResult**: Displays progress and download interface

## File Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and Tailwind
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Main conversion interface
└── components/
    ├── FileUploader.tsx     # File upload component
    ├── ConversionSettings.tsx # Settings configuration
    └── ConversionResult.tsx  # Result display and download
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub repository
2. Connect to Vercel
3. Set environment variable: `NEXT_PUBLIC_BACKEND_URL`
4. Deploy

### Other Platforms

1. Build the application: `npm run build`
2. Deploy the `out` directory
3. Configure environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
