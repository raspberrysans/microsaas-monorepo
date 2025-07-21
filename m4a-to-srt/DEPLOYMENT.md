<!-- @format -->

# Render Deployment Guide

This guide will walk you through deploying the M4A to SRT Converter to Render.

## Prerequisites

- A GitHub account
- A Render account (free tier available)
- Your code pushed to a GitHub repository

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your repository structure looks like this:

```
m4a-to-srt/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── render.yaml
│   └── .dockerignore
├── frontend/
│   └── index.html
└── README.md
```

### 2. Connect to Render

1. **Sign up/Login to Render**

   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account

2. **Create New Web Service**
   - Click "New +" in your dashboard
   - Select "Web Service"
   - Connect your GitHub repository

### 3. Configure the Service

#### Option A: Using render.yaml (Recommended)

If you have the `render.yaml` file in your repository:

1. **Render will auto-detect the configuration**
2. **Click "Create Web Service"**
3. **The service will be configured automatically**

#### Option B: Manual Configuration

If not using `render.yaml`, configure manually:

- **Name**: `m4a-to-srt-converter` (or your preferred name)
- **Environment**: `Python`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `m4a-to-srt/backend`
- **Build Command**: `pip install --upgrade pip && pip install torch --extra-index-url https://download.pytorch.org/whl/cpu && pip install git+https://github.com/openai/whisper.git && pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Python Version**: `3.11.0`

### 4. Environment Variables (Optional)

For production deployments, you might want to add:

- `PYTHON_VERSION`: `3.11.0`
- `WHISPER_MODEL`: `base` (or `tiny`, `small`, `medium`, `large`)

### 5. Deploy

1. **Click "Create Web Service"**
2. **Wait for the build to complete** (5-10 minutes)
3. **Your app will be available at**: `https://your-app-name.onrender.com`

## Service Plans

### Free Tier

- **Memory**: 512 MB RAM
- **CPU**: Shared
- **Bandwidth**: 100 GB/month
- **Sleep**: After 15 minutes of inactivity
- **Perfect for**: Testing and small projects

### Paid Plans

- **Starter**: $7/month - 512 MB RAM, always on
- **Standard**: $25/month - 1 GB RAM, always on
- **Pro**: $50/month - 2 GB RAM, always on

## Monitoring Your Deployment

### 1. Build Logs

- Check build logs for any errors
- Common issues: missing dependencies, Python version conflicts

### 2. Runtime Logs

- Monitor application logs for runtime errors
- Check for memory usage and performance issues

### 3. Health Checks

- Visit `/health` endpoint to verify service is running
- Use Render's built-in health check monitoring

## Troubleshooting

### Build Failures

**Issue**: `ModuleNotFoundError: No module named 'whisper'`
**Solution**: Ensure `openai-whisper==20231117` is in `requirements.txt`

**Issue**: `ffmpeg not found`
**Solution**: The Dockerfile includes ffmpeg installation, ensure it's present

**Issue**: `Python version mismatch`
**Solution**: Set `PYTHON_VERSION` environment variable to `3.11.0`

### Runtime Errors

**Issue**: `Out of memory`
**Solution**:

- Upgrade to a paid plan with more RAM
- Use smaller Whisper model (`tiny` instead of `base`)
- Process smaller audio files

**Issue**: `Service sleeping`
**Solution**:

- Upgrade to paid plan for always-on service
- Use external monitoring service to ping your app

**Issue**: `File upload timeout`
**Solution**:

- Check file size limits
- Consider chunked uploads for large files
- Monitor Render's bandwidth limits

### Performance Optimization

1. **Model Selection**

   ```python
   # In main.py, change the model size
   _model = whisper.load_model("tiny")  # Faster, less accurate
   _model = whisper.load_model("base")  # Balanced (default)
   _model = whisper.load_model("small") # More accurate, slower
   ```

2. **Memory Management**

   - Process files in chunks
   - Implement proper cleanup
   - Monitor memory usage

3. **Caching**
   - Consider caching frequently used models
   - Implement result caching for repeated requests

## Custom Domain (Optional)

1. **Add Custom Domain**

   - Go to your service settings
   - Click "Custom Domains"
   - Add your domain

2. **Configure DNS**
   - Point your domain to Render's servers
   - Wait for DNS propagation

## SSL Certificate

- **Automatic**: Render provides free SSL certificates
- **Custom**: Upload your own certificate if needed

## Scaling Considerations

### Horizontal Scaling

- Render supports multiple instances
- Configure auto-scaling based on traffic

### Vertical Scaling

- Upgrade service plan for more resources
- Monitor usage patterns

## Cost Optimization

### Free Tier Tips

- Use smaller Whisper models
- Implement request queuing
- Cache results when possible

### Paid Tier Optimization

- Monitor resource usage
- Set up alerts for high usage
- Consider reserved instances for predictable traffic

## Security Best Practices

1. **Input Validation**

   - Validate file types and sizes
   - Implement rate limiting
   - Sanitize user inputs

2. **File Handling**

   - Use temporary files
   - Implement proper cleanup
   - Scan for malicious content

3. **API Security**
   - Use HTTPS (automatic with Render)
   - Implement authentication if needed
   - Monitor for abuse

## Backup and Recovery

1. **Code Backup**

   - Use Git for version control
   - Regular commits and pushes
   - Branch protection rules

2. **Data Backup**
   - Implement result caching
   - Store processed files if needed
   - Use external storage for large files

## Support and Resources

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **Whisper Documentation**: [github.com/openai/whisper](https://github.com/openai/whisper)

## Next Steps

After successful deployment:

1. **Test the API endpoints**
2. **Monitor performance and logs**
3. **Set up alerts for issues**
4. **Consider implementing additional features**
5. **Optimize based on usage patterns**

Your M4A to SRT Converter is now ready for production use! 🚀
