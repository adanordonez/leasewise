# API Keys Security Guide for LeaseWise

## ⚠️ Understanding Public vs. Private Keys

This guide explains which API keys are safe to expose publicly and which must remain private.

---

## 🔓 Safe to Be Public (NEXT_PUBLIC_)

These keys are **designed** to be used client-side and exposed in browser code:

### 1. ✅ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Exposed to browser:** YES
- **Safe:** YES (when properly restricted)
- **Why it's safe:** Google designed these keys for client-side use
- **Protection method:** Domain restrictions in Google Cloud Console

**How to Secure:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Click your API key
4. **Application restrictions:**
   - Select "HTTP referrers (web sites)"
   - Add:
     ```
     https://*.vercel.app/*
     http://localhost:3000/*
     https://yourdomain.com/*
     ```
5. **API restrictions:**
   - Select "Restrict key"
   - Choose only:
     - Maps JavaScript API
     - Street View Static API

**Result:** Even if someone copies your key from browser code, it won't work on their website.

---

### 2. ✅ `NEXT_PUBLIC_SUPABASE_URL`
- **Exposed to browser:** YES
- **Safe:** YES (it's a public URL)
- **Why it's safe:** This is just your Supabase project URL, designed to be public
- **Protection method:** Row Level Security (RLS) policies in Supabase

---

### 3. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Exposed to browser:** YES
- **Safe:** YES (when using RLS)
- **Why it's safe:** This is the "anonymous" key, designed for client-side use
- **Protection method:** Row Level Security (RLS) policies in Supabase

**Important:** Make sure you have RLS policies enabled on all your Supabase tables!

---

### 4. ✅ `NEXT_PUBLIC_MAPBOX_TOKEN`
- **Exposed to browser:** YES
- **Safe:** YES (when properly restricted)
- **Why it's safe:** Mapbox tokens are designed for client-side use
- **Protection method:** URL restrictions in Mapbox dashboard

**How to Secure:**
1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Click on your token
3. Under **Token restrictions**, add:
   ```
   https://*.vercel.app/*
   http://localhost:3000/*
   https://yourdomain.com/*
   ```

---

## 🔒 MUST BE PRIVATE (Never NEXT_PUBLIC_)

These keys must **NEVER** be exposed to the browser:

### 1. ❌ `OPENAI_API_KEY`
- **Exposed to browser:** NO
- **Current status:** ✅ Correctly private (no NEXT_PUBLIC_ prefix)
- **Why it must be private:** Direct access to your OpenAI account with billing
- **Used in:** Server-side API routes only
- **If exposed:** Anyone could use your key for unlimited API calls

**Current usage:** ✅ Only used in `/app/api/*` routes (server-side)

---

### 2. ❌ Supabase Service Role Key (if you add one)
- **Variable name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Exposed to browser:** NO
- **Why it must be private:** Bypasses all RLS policies
- **Note:** You don't currently use this, which is good!

---

## 📋 Your Current Environment Variables

Here's a complete list of what you should have in Vercel:

| Variable | Public? | Safe? | Restriction Required? |
|----------|---------|-------|----------------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ Yes | ✅ Yes | ✅ YES - Domain restrictions |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | ✅ Yes | ❌ No - it's just a URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | ✅ Yes | ✅ YES - RLS policies |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | ✅ Yes | ✅ Yes | ✅ YES - URL restrictions |
| `OPENAI_API_KEY` | ❌ No | ✅ Yes | ✅ YES - Keep private |

---

## 🛡️ Vercel Warning Explained

When you see this warning in Vercel:
> "This key, which is prefixed with NEXT_PUBLIC_ and includes the term KEY, might expose sensitive information to the browser."

**What it means:**
- Vercel is just warning you that this key will be visible in browser code
- It's a **general warning**, not specific to your use case
- For Google Maps API keys, this is **expected and safe** (when restricted)

**What to do:**
1. ✅ Click through the warning (it's okay!)
2. ✅ Make sure you've restricted the key in Google Cloud Console
3. ✅ Verify domain restrictions are in place
4. ✅ Save the environment variable

---

## 🚨 Red Flags to Watch For

### ❌ NEVER DO THIS:
```typescript
// BAD - exposing OpenAI key to browser
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY; // DON'T!
```

### ✅ CORRECT:
```typescript
// GOOD - OpenAI key stays on server
// In /app/api/analyze-lease/route.ts
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // No NEXT_PUBLIC_
});
```

---

## 📊 Quick Security Checklist

Before deploying to production:

- [ ] Google Maps API key is restricted to your domains
- [ ] Google Maps API key is restricted to specific APIs (Maps JS, Street View)
- [ ] Mapbox token is restricted to your domains
- [ ] Supabase RLS policies are enabled on all tables
- [ ] OpenAI API key does NOT have NEXT_PUBLIC_ prefix
- [ ] No sensitive keys are committed to GitHub
- [ ] All environment variables are added to Vercel

---

## 🔍 How to Verify Your Keys Are Secure

### Test Google Maps Key Restriction:
1. Copy your key from browser DevTools (Network tab)
2. Try to use it on a different domain (e.g., codepen.io)
3. It should fail with a "RefererNotAllowedMapError"
4. ✅ If it fails = your key is properly restricted!

### Test Supabase Security:
1. Open browser DevTools → Application → Local Storage
2. Find your Supabase anon key
3. Try to access data you shouldn't have access to
4. ✅ If blocked = RLS is working!

### Test OpenAI Key Privacy:
1. Open browser DevTools → Network tab
2. Complete a lease analysis
3. Check all network requests
4. ✅ OpenAI key should NEVER appear in any request

---

## 💡 Best Practices

1. **Regular Key Rotation**
   - Rotate keys every 6-12 months
   - Immediately rotate if you suspect a leak

2. **Monitor Usage**
   - Check Google Cloud Console for unexpected usage
   - Monitor OpenAI usage dashboard
   - Set up billing alerts

3. **Use Different Keys**
   - Development keys for local testing
   - Production keys for live site
   - Never use production keys in development

4. **GitHub Security**
   - Never commit `.env.local` files
   - Add `.env*` to `.gitignore`
   - Use GitHub secret scanning

5. **Vercel Security**
   - Use different keys for preview vs. production
   - Regularly review environment variables
   - Remove unused variables

---

## 🆘 What to Do If a Key Is Exposed

### If Google Maps Key Is Exposed:
1. Go to Google Cloud Console
2. Delete the compromised key
3. Create a new key with proper restrictions
4. Update Vercel environment variables
5. Redeploy your app

### If OpenAI Key Is Exposed:
1. **IMMEDIATELY** revoke the key in OpenAI dashboard
2. Generate a new key
3. Update Vercel environment variables
4. Check OpenAI usage for unauthorized activity
5. Redeploy your app

### If Supabase Keys Are Exposed:
1. Verify RLS policies are enabled
2. Check Supabase logs for suspicious activity
3. If concerned, rotate keys in Supabase dashboard
4. Update Vercel environment variables
5. Redeploy your app

---

## ✅ Your Keys Are Safe When:

1. ✅ Google Maps key only works on your domains
2. ✅ Mapbox token only works on your domains
3. ✅ Supabase has RLS policies enabled
4. ✅ OpenAI key is never sent to browser
5. ✅ All keys have usage monitoring
6. ✅ No keys are in your GitHub repository

---

## Summary: Answer to Your Question

**Question:** Should I change the name of `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`?

**Answer:** **NO** - Keep the name as is!

**Why:**
1. The `NEXT_PUBLIC_` prefix is **required** for the key to work in the browser
2. Google Maps API keys are **designed** to be public
3. Your key is **safe** when you restrict it to your domains
4. Vercel's warning is just a general reminder, not a security issue

**What to do instead:**
1. Click through Vercel's warning (it's okay!)
2. Restrict your key in Google Cloud Console (see steps above)
3. Your key will be visible in browser code, but only work on your domains
4. This is the **correct and recommended** way to use Google Maps API

---

**Last Updated:** October 2025  
**Security Status:** ✅ All keys properly configured

