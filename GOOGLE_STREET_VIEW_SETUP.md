# 🗺️ Google Street View Setup Guide

## Overview
LeaseWise now displays Google Street View images of rental properties in the lease analysis report, giving users visual context of the property location.

## What You Need

### 1. Google Cloud Account
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Sign in with your Google account
- Create a new project or select an existing one

### 2. Enable Required APIs
Enable these APIs for your project:
1. **Maps JavaScript API** (for general maps functionality)
2. **Street View Static API** (for static street view images)
3. **Geocoding API** (for address-to-coordinates conversion)

**How to enable:**
1. Go to "APIs & Services" → "Library"
2. Search for each API
3. Click "Enable"

### 3. Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. **Restrict the key** (recommended):
   - Application restrictions: HTTP referrers (for web)
   - Add your domains (e.g., `localhost:*`, `yourdomain.com/*`)
   - API restrictions: Select only the APIs you enabled above

### 4. Add API Key to Environment Variables
Create or update `.env.local` in the root of your project:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important:** The `NEXT_PUBLIC_` prefix is required for client-side access.

### 5. Restart Development Server
```bash
npm run dev
```

## Usage

### In the App
Once configured, Street View images will automatically appear:
- ✅ On the lease analysis results page
- ✅ Below the header and above the summary cards
- ✅ Shows a fallback message if Street View is unavailable for the location

### API Costs
Google Street View Static API pricing (as of 2024):
- **First 28,000 requests/month**: Free
- **Additional requests**: $7.00 per 1,000 requests

**Cost Management Tips:**
- Set up billing alerts in Google Cloud Console
- Enable Street View only for verified addresses
- Use caching to reduce duplicate requests

## Testing

### Test Without API Key
If no API key is configured:
- ✅ The app will still work
- ✅ A fallback message will display: "Street View Not Available"
- ⚠️ You'll see a console warning

### Test With API Key
1. Complete a lease analysis with a valid address
2. Check the results page for the Street View image
3. Verify the image shows the correct location

### Test Addresses
**Good test addresses** (known to have Street View):
- `1600 Amphitheatre Parkway, Mountain View, CA` (Google HQ)
- `350 Fifth Avenue, New York, NY` (Empire State Building)
- `1060 West Addison Street, Chicago, IL` (Wrigley Field)

**Addresses without Street View:**
- New constructions
- Private roads
- Rural areas with limited coverage

## Troubleshooting

### Issue: "Street View Not Available"
**Possible causes:**
1. API key not configured
2. API key restrictions too strict
3. Location doesn't have Street View coverage
4. Address geocoding failed

**Solutions:**
1. Check `.env.local` for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Verify API key restrictions in Google Cloud Console
3. Test with a known good address (see above)
4. Check browser console for error messages

### Issue: Image Not Loading
**Possible causes:**
1. API quota exceeded
2. Billing not enabled in Google Cloud
3. CORS issues

**Solutions:**
1. Check Google Cloud Console quotas
2. Enable billing (free tier available)
3. Verify HTTP referrer restrictions

### Issue: Wrong Location Shown
**Possible causes:**
1. Address ambiguous or poorly formatted
2. Geocoding returned approximate location

**Solutions:**
1. Use full, complete addresses with ZIP codes
2. Verify address format before analysis

## Security Best Practices

### DO ✅
- Use API key restrictions (HTTP referrers)
- Enable only required APIs
- Set up billing alerts
- Rotate keys periodically
- Monitor usage in Google Cloud Console

### DON'T ❌
- Commit API keys to version control
- Use unrestricted API keys in production
- Share API keys publicly
- Ignore billing alerts

## Features

### Current Implementation
- ✅ Display Street View on results page
- ✅ Graceful fallback when unavailable
- ✅ Loading state
- ✅ Address overlay on image
- ✅ Responsive design

### Future Enhancements (Optional)
- 📋 Add Street View to PDF export
- 📋 Interactive 360° Street View
- 📋 Multiple property angles
- 📋 Historical Street View imagery
- 📋 Nearby property comparisons

## Support

For issues with:
- **Google Maps API**: [Google Maps Platform Support](https://developers.google.com/maps/support)
- **LeaseWise Integration**: Check application logs and console errors

## Cost Estimation

### Example Usage
- **100 analyses/month**: Free (well under 28,000 limit)
- **1,000 analyses/month**: Free (still under limit)
- **50,000 analyses/month**: ~$154/month ((50,000 - 28,000) × $7 / 1,000)

The free tier is generous and suitable for most use cases!

