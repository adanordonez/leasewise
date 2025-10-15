# Generate Open Graph Image

## Option 1: Use the Dynamic Image (Recommended)

The dynamic image at `/api/og` will automatically generate a beautiful social media preview image. This is already set up in your `layout.tsx`.

## Option 2: Create a Static Image

If you want to create a static image, you can:

1. **Open the HTML preview:**
   - Go to `http://localhost:3000/og-image.html`
   - Take a screenshot of the page
   - Save it as `public/og-image.png` (1200x630 pixels)

2. **Use a design tool:**
   - Canva, Figma, or similar
   - Create a 1200x630 pixel image
   - Include the LeaseWise branding and description

## Option 3: Use the Existing Image

You already have an `og-image.png` file. If it looks good, you can update the layout.tsx to use it:

```typescript
images: [
  {
    url: "/og-image.png",  // Use static image
    width: 1200,
    height: 630,
    alt: "LeaseWise - AI Lease Analysis",
  },
],
```

## Testing Your Social Media Preview

1. **Facebook Debugger:**
   - Go to https://developers.facebook.com/tools/debug/
   - Enter your URL: `https://getleasewise.com`
   - Click "Debug" to see how it will look

2. **Twitter Card Validator:**
   - Go to https://cards-dev.twitter.com/validator
   - Enter your URL: `https://getleasewise.com`
   - See how it will appear on Twitter

3. **LinkedIn Post Inspector:**
   - Go to https://www.linkedin.com/post-inspector/
   - Enter your URL: `https://getleasewise.com`
   - Preview how it will look on LinkedIn

## Current Setup

Your app is currently configured to use the dynamic image at `/api/og` which will generate a beautiful, branded social media preview automatically.
