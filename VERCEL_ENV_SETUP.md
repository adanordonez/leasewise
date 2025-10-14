# Adding Environment Variables to Vercel

This guide explains how to add your Google Maps API key (and other environment variables) to Vercel for your LeaseWise deployment.

## Prerequisites

- A Vercel account with your LeaseWise project deployed
- Your Google Maps API key (for Street View images)

## Steps to Add Environment Variables

### 1. Access Your Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Navigate to your **LeaseWise** project

### 2. Navigate to Project Settings

1. Click on your **LeaseWise** project
2. Click on the **Settings** tab at the top
3. In the left sidebar, click on **Environment Variables**

### 3. Add Your Google Maps API Key

1. In the **Key** field, enter:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   ```

2. In the **Value** field, paste your Google Maps API key:
   ```
   YOUR_ACTUAL_GOOGLE_MAPS_API_KEY_HERE
   ```

3. Select which environments to apply this to:
   - ✅ **Production** (for live site)
   - ✅ **Preview** (for pull request previews)
   - ✅ **Development** (for local development with Vercel CLI)

4. **⚠️ You will see a warning:**
   > "This key, which is prefixed with NEXT_PUBLIC_ and includes the term KEY, might expose sensitive information to the browser."
   
   **This is OKAY!** Click through the warning. Google Maps API keys are designed to be used publicly. You protect them by restricting them to your domains (see step 5 below).

5. Click **Save**

### 4. Add Other Environment Variables

You should also add all other required environment variables from your `.env.local` file:

#### Required Variables:

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key for Street View | `AIzaSyC...` |
| `OPENAI_API_KEY` | OpenAI API key for lease analysis | `sk-proj-...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbG...` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox token for maps | `pk.eyJ1...` |

**Important Notes:**
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Variables without this prefix are server-side only
- Never commit actual API keys to your repository

### 5. Redeploy Your Application

After adding environment variables, you need to redeploy:

1. **Option A - Automatic Redeploy:**
   - Make a small change to your code (e.g., add a comment)
   - Commit and push to your repository
   - Vercel will automatically redeploy with the new environment variables

2. **Option B - Manual Redeploy:**
   - In your Vercel project dashboard
   - Go to the **Deployments** tab
   - Click the three dots `...` on the latest deployment
   - Click **Redeploy**
   - Confirm the redeployment

### 6. Verify Environment Variables

To verify your environment variables are working:

1. Visit your deployed site
2. Complete a lease analysis
3. Check if the Street View image loads in the exported PDF
4. Check the browser console for any API key errors

## Getting a Google Maps API Key

If you don't have a Google Maps API key yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Enable the following APIs for your project:
   - **Maps JavaScript API**
   - **Street View Static API**
6. (Optional but recommended) Restrict your API key:
   - Click on your API key to edit it
   - Under **Application restrictions**, select **HTTP referrers**
   - Add your domain: `*.vercel.app` and your custom domain if you have one
   - Under **API restrictions**, select **Restrict key**
   - Choose the APIs listed above

## Security Best Practices

1. **Never commit API keys** to your repository
2. **Use environment variables** for all sensitive data
3. **Restrict API keys** to specific domains and APIs
4. **Monitor API usage** in Google Cloud Console
5. **Rotate keys regularly** if they're compromised
6. **Use different keys** for development and production

## Troubleshooting

### Environment Variables Not Working

- Make sure you've redeployed after adding variables
- Check that variable names match exactly (case-sensitive)
- Verify the correct environments are selected
- Check the Vercel deployment logs for errors

### Street View Images Not Loading

- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Check that Street View Static API is enabled in Google Cloud
- Verify API key restrictions allow your Vercel domain
- Check browser console for specific error messages

### API Key Quota Exceeded

- Check your Google Cloud Console for usage
- Consider upgrading to a paid plan
- Add billing information to Google Cloud

## Support

If you encounter issues:
- Check Vercel deployment logs
- Review browser console for errors
- Verify all environment variables are set correctly
- Ensure APIs are enabled in Google Cloud Console

---

**Last Updated:** October 2025

