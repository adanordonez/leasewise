# Mapbox Setup Instructions

## Overview
This app now uses Mapbox for beautiful, interactive maps with custom markers. You'll need to get a free Mapbox API key.

## Step 1: Get Mapbox API Key

1. **Go to Mapbox**: Visit [https://www.mapbox.com/](https://www.mapbox.com/)
2. **Sign up**: Create a free account (no credit card required)
3. **Get API Key**: 
   - Go to your [Account page](https://account.mapbox.com/)
   - Copy your **Default public token**
   - This gives you 50,000 free map loads per month

## Step 2: Add to Environment Variables

Add this to your `.env.local` file:

```bash
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

## Step 3: Features

The new Mapbox map includes:

### 🎨 **Beautiful Design**
- Modern, professional map styling
- Smooth animations and transitions
- Responsive design for all screen sizes

### 📍 **Custom Markers**
- **Color-coded by rent price**:
  - 🟢 Green: Under $2,000 (affordable)
  - 🟡 Yellow: $2,000-$3,500 (moderate)
  - 🔴 Red: $3,500-$5,000 (expensive)
  - 🟣 Purple: Over $5,000 (luxury)
- **Size-coded by rent price** (larger = more expensive)
- **Animated pulsing effect**
- **Price labels** on hover

### 💬 **Rich Popups**
- **Building information** with icons
- **Both addresses** (user input + property address)
- **Financial details** in colored cards
- **Property specs** (size, bedrooms, bathrooms)
- **Amenities** with tags
- **Landlord/management info**
- **Market percentile** indicator

### 🗺️ **Interactive Features**
- **Click markers** to see detailed popups
- **Smooth zoom and pan**
- **Auto-centering** on all lease locations
- **Responsive popup positioning**

## Step 4: Test the Map

1. **Upload a lease** with an address
2. **Go to dashboard** (`/dashboard`)
3. **See the beautiful map** with custom markers
4. **Click markers** to see detailed popups

## Troubleshooting

### Map Not Loading
- Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly
- Verify the token is valid in your Mapbox account
- Check browser console for errors

### No Markers Showing
- Ensure the database migration has been run (see `SUPABASE_MIGRATION.md`)
- Check that leases have `user_address` populated
- Verify geocoding is working (check browser console)

### Styling Issues
- Make sure Mapbox CSS is imported (already done in `globals.css`)
- Check that custom popup styles are applied

## Cost

- **Free tier**: 50,000 map loads per month
- **Paid plans**: Start at $5/month for higher limits
- **Perfect for development and small production apps**

## Next Steps

Once you have the Mapbox token set up:
1. The map will automatically use your token
2. Markers will appear at user input addresses
3. Click markers to see beautiful popups with lease details
4. Enjoy the professional, modern map experience!

The map is now much more beautiful and functional than the basic Leaflet version! 🎉
