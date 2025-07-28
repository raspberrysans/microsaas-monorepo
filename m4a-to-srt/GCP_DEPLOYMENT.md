<!-- @format -->

# M4A to SRT Converter - GCP Deployment Guide

This guide explains how to deploy the M4A to SRT converter on Google Cloud Platform (GCP) for free using Cloud Run.

## Prerequisites

1. **Google Cloud Account**: Sign up at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud CLI**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk)
3. **Docker**: Install from [docker.com](https://docker.com)

## Free Tier Benefits

GCP offers a generous free tier for Cloud Run:

- **2 million requests per month**
- **360,000 vCPU-seconds per month**
- **180,000 GiB-seconds of memory per month**
- **1 GB of network egress per month**

This is typically sufficient for personal or small-scale usage.

## Step 1: Setup Google Cloud Project

1. **Create a new project** (or use existing):

   ```bash
   gcloud projects create m4a-to-srt-converter --name="M4A to SRT Converter"
   gcloud config set project m4a-to-srt-converter
   ```

2. **Enable required APIs**:

   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

3. **Set up billing** (required even for free tier):
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to Billing
   - Link a billing account to your project

## Step 2: Build and Push Docker Image

1. **Navigate to the backend directory**:

   ```bash
   cd m4a-to-srt/backend
   ```

2. **Build and push the Docker image**:

   ```bash
   # Build the image
   gcloud builds submit --tag gcr.io/m4a-to-srt-converter/m4a-to-srt:latest .

   # Or build locally and push
   docker build -t gcr.io/m4a-to-srt-converter/m4a-to-srt:latest .
   docker push gcr.io/m4a-to-srt-converter/m4a-to-srt:latest
   ```

## Step 3: Deploy to Cloud Run

1. **Deploy the service**:

   ```bash
   gcloud run deploy m4a-to-srt-service \
     --image gcr.io/m4a-to-srt-converter/m4a-to-srt:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 2 \
     --timeout 900 \
     --max-instances 1 \
     --port 8000
   ```

2. **Important flags explained**:
   - `--allow-unauthenticated`: Allows public access (no authentication required)
   - `--memory 2Gi`: Allocates 2GB RAM (Whisper needs significant memory)
   - `--cpu 2`: Allocates 2 CPU cores for faster processing
   - `--timeout 900`: Sets 15-minute timeout for long audio files
   - `--max-instances 1`: Limits to 1 instance to stay within free tier
   - `--port 8000`: Matches the port exposed in Dockerfile

## Step 4: Verify Deployment

1. **Get the service URL**:

   ```bash
   gcloud run services describe m4a-to-srt-service --region us-central1 --format="value(status.url)"
   ```

2. **Test the health endpoint**:

   ```bash
   curl https://your-service-url/health
   ```

3. **Test the conversion endpoint**:
   ```bash
   curl -X POST "https://your-service-url/api/convert" \
     -F "file=@test-audio.m4a" \
     -F "words_per_segment=10" \
     --output test-subtitles.srt
   ```

## Step 5: Environment Variables (Optional)

If you need to customize settings, you can set environment variables:

```bash
gcloud run services update m4a-to-srt-service \
  --region us-central1 \
  --set-env-vars "LOG_LEVEL=INFO,MAX_FILE_SIZE=100MB"
```

## API Usage

### Convert M4A to SRT

**Endpoint**: `POST /api/convert`

**Parameters**:

- `file`: M4A audio file (multipart/form-data)
- `words_per_segment` (optional): Number of words per subtitle segment (default: 8)
- `frame_rate` (optional): Frame rate for timing calculations (default: 30.0)

**Example using curl**:

```bash
curl -X POST "https://your-service-url/api/convert" \
  -F "file=@audio.m4a" \
  -F "words_per_segment=10" \
  -F "frame_rate=30.0" \
  --output subtitles.srt
```

**Example using JavaScript**:

```javascript
const formData = new FormData();
formData.append('file', audioFile);
formData.append('words_per_segment', '10');
formData.append('frame_rate', '30.0');

const response = await fetch('https://your-service-url/api/convert', {
	method: 'POST',
	body: formData,
});

if (response.ok) {
	const blob = await response.blob();
	// Download the SRT file
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'subtitles.srt';
	a.click();
}
```

### Health Check

**Endpoint**: `GET /health`

Returns the API status.

### Frontend

**Endpoint**: `GET /`

Serves the web interface for file upload and conversion.

## Cost Optimization

To stay within the free tier:

1. **Monitor usage**:

   ```bash
   gcloud billing budgets create --billing-account=YOUR_BILLING_ACCOUNT \
     --budget-amount=0.00USD \
     --budget-filter-projects=projects/m4a-to-srt-converter
   ```

2. **Set up alerts**:

   - Go to Google Cloud Console
   - Navigate to Monitoring > Alerting
   - Create alerts for billing thresholds

3. **Optimize resource usage**:
   - Use `--max-instances 1` to limit concurrent requests
   - Consider reducing memory/CPU if not needed
   - Implement request queuing for high traffic

## Troubleshooting

### Common Issues

1. **Out of Memory Errors**:

   - Increase memory allocation: `--memory 4Gi`
   - Process smaller audio files
   - Use a smaller Whisper model

2. **Timeout Errors**:

   - Increase timeout: `--timeout 1800` (30 minutes)
   - Process shorter audio files
   - Optimize audio preprocessing

3. **Cold Start Delays**:
   - This is normal for serverless deployments
   - First request may take 10-30 seconds
   - Subsequent requests are faster

### Logs and Monitoring

1. **View logs**:

   ```bash
   gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=m4a-to-srt-service" --limit=50
   ```

2. **Monitor metrics**:
   - Go to Google Cloud Console
   - Navigate to Cloud Run > m4a-to-srt-service
   - View request count, latency, and error rates

## Cleanup

To avoid charges when not using the service:

1. **Delete the service**:

   ```bash
   gcloud run services delete m4a-to-srt-service --region us-central1
   ```

2. **Delete the container image**:

   ```bash
   gcloud container images delete gcr.io/m4a-to-srt-converter/m4a-to-srt:latest
   ```

3. **Delete the project** (optional):
   ```bash
   gcloud projects delete m4a-to-srt-converter
   ```

## Security Considerations

1. **HTTPS**: Cloud Run automatically provides HTTPS
2. **CORS**: The API allows all origins (`*`) - consider restricting for production
3. **File Upload Limits**: Implement client-side file size validation
4. **Rate Limiting**: Consider implementing rate limiting for production use

## Performance Tips

1. **Audio Optimization**:

   - Convert to mono channel
   - Use 16kHz sample rate
   - Compress audio before upload

2. **Batch Processing**:

   - Process multiple files sequentially
   - Implement progress tracking
   - Use webhooks for completion notifications

3. **Caching**:
   - Cache Whisper model in memory
   - Implement result caching for identical files
   - Use CDN for static assets

This deployment guide provides a complete setup for running your M4A to SRT converter on GCP's free tier while maintaining good performance and cost control.
