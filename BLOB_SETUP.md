# Vercel Blob Storage Setup

This app now supports files up to 20MB using a hybrid approach:
- **Files ≤ 4MB**: Direct upload (works without setup)
- **Files > 4MB**: Vercel Blob Storage (requires setup)

## Quick Start (No Setup Required)

For files under 4MB, the app works immediately without any configuration!

## Full Setup (For 20MB Support)

To support files up to 20MB, set up Vercel Blob Storage:

### 1. Enable Vercel Blob Storage

1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to the "Storage" tab
4. Click "Create Database" and select "Blob"
5. Follow the setup instructions

### 2. Environment Variables

Add these environment variables to your Vercel project:

```bash
# OpenAI API Key (already configured)
OPENAI_API_KEY=your_openai_api_key_here

# Vercel Blob Storage Token
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

### 3. How It Works

**Hybrid Approach:**
- **Small files (≤4MB)**: Direct upload through serverless function (immediate, no setup)
- **Large files (>4MB)**: Upload to Vercel Blob Storage, then process via serverless function

**Process:**
1. **File Upload**: Files are uploaded directly to Vercel Blob Storage (bypassing the 4.5MB serverless function limit)
2. **Analysis**: The serverless function downloads the file from blob storage and processes it
3. **Storage**: Files are automatically cleaned up after processing

### 4. Benefits

- ✅ **Immediate functionality** for files up to 4MB (no setup required)
- ✅ **Supports files up to 20MB** with blob storage setup
- ✅ **No payload size limits** for large files
- ✅ **Automatic file cleanup**
- ✅ **Better performance** for large files
- ✅ **Production-ready solution**

### 5. Deployment

After setting up the environment variables, deploy your app:

```bash
npm run build
vercel --prod
```

The app will now handle large PDF files without the "Request Entity Too Large" error!

## 6. Troubleshooting

### "Failed to get upload URL" Error

If you see this error, check:

1. **Environment Variable**: Make sure `BLOB_READ_WRITE_TOKEN` is set in your Vercel project
2. **Blob Storage**: Ensure Vercel Blob Storage is enabled in your project
3. **Token Validity**: Verify the token is correct and not expired

### Debug Steps

1. Check the browser console for detailed error messages
2. Check Vercel function logs in the dashboard
3. Verify the environment variable is set: `vercel env ls`

### Common Issues

- **Missing Token**: "Blob storage not configured" error
- **Invalid Token**: "Invalid blob storage token" error  
- **Network Issues**: "Network error connecting to blob storage" error

### Testing Locally

For local development, create a `.env.local` file:

```bash
BLOB_READ_WRITE_TOKEN=your_blob_token_here
OPENAI_API_KEY=your_openai_api_key_here
```
