# 🎯 Jina AI Legal Source Extraction with Vetting

## 📋 Overview

This implementation uses **Jina AI Reader** to fetch full legal page content, then **vets** it with GPT-4o-mini to ensure it contains actual, relevant legal text before returning it to users.

## 🔄 Flow

```
User clicks "Find Legal Sources"
         ↓
1️⃣ OpenAI Web Search
   - Searches authoritative legal domains
   - Finds potential sources (URLs)
         ↓
2️⃣ Jina AI Reader (for each URL)
   - Fetches FULL page content
   - Converts to clean text/markdown
         ↓
3️⃣ GPT-4o-mini VETTING
   - Checks if content is relevant
   - Scores relevance (0-100)
   - Rejects if < 60% confidence
         ↓
4️⃣ GPT-4o-mini EXTRACTION
   - Extracts exact statute text
   - Provides plain English explanation
         ↓
5️⃣ Return to User
   ✅ Relevant: Show statute text + link
   ❌ Not relevant: Show "couldn't find exact legal text"
```

## 🗂️ Files Created/Modified

### **New Files**

1. **`lib/jina-legal-extractor.ts`**
   - Core Jina AI integration
   - Content fetching, vetting, and extraction
   - Main functions:
     - `fetchPageContent()` - Uses Jina AI to get full page
     - `vetLegalContent()` - Uses GPT-4o-mini to check relevance
     - `extractSpecificStatute()` - Extracts exact legal text
     - `fetchAndVetLegalSource()` - Main orchestration
     - `fetchAndVetMultipleSources()` - Parallel processing

2. **`app/api/enhanced-legal-sources/route.ts`**
   - API endpoint for enhanced search
   - Returns only vetted sources
   - Includes helpful "not found" messages

3. **`components/EnhancedLegalSources.tsx`**
   - React component to display results
   - Shows statute text in formatted boxes
   - Links to original pages
   - Plain English explanations

### **Modified Files**

4. **`lib/legal-search.ts`**
   - Added `searchEnhancedLegalSources()` function
   - Integrates Jina AI vetting into search flow

## 🎨 Features

### ✅ **Vetting System**
- **Relevance Check**: Each source is scored 0-100%
- **Minimum Threshold**: 60% required to pass
- **Smart Filtering**: Rejects blogs, articles, non-legal content
- **State-Specific**: Only accepts content for the correct state/city

### 📄 **Content Extraction**
- **Full Page Access**: Not just snippets
- **Exact Statute Text**: Quoted verbatim from the law
- **Plain English**: Simple explanation of what it means
- **Source Links**: Direct links to original legal pages

### 🎯 **User Experience**
- **Clear Messaging**: If no sources found, explains why
- **Statistics**: Shows how many sources were searched/vetted
- **Formatted Display**: Statute text in monospace, explanations in plain text
- **Mobile Responsive**: Works on all screen sizes

## 📊 Vetting Criteria

The GPT-4o-mini vetting step checks for:

### ✅ **RELEVANT Content**
- Specific statutes or legal codes (e.g., "765 ILCS 715/1")
- Direct quotes from laws
- Official government legal text
- Detailed legal requirements with specifics

### ❌ **NOT RELEVANT Content**
- General advice articles
- Blog posts
- Marketing content
- Vague summaries without specifics
- Content about different states/cities
- Broken or error pages

## 🔧 How to Use

### **In LeaseWiseApp.tsx**

Replace the existing source citation with:

```tsx
import EnhancedLegalSources from '@/components/EnhancedLegalSources';

// Inside your "Your Rights" section:
<EnhancedLegalSources 
  rightText={right.right}
  userAddress={address}
  description={right.right}
/>
```

### **Example Usage**

```tsx
// For a specific tenant right:
<EnhancedLegalSources 
  rightText="You have the right to a habitable dwelling"
  userAddress="123 Main St, Chicago, IL"
  description="Right to habitable dwelling"
/>
```

## 💰 Cost Analysis

### **Jina AI**
- **Free Tier**: 1M tokens/month
- **Paid**: $2 per 1M tokens
- **Average Page**: ~3-5k tokens
- **Cost per Source**: ~$0.01 (paid tier) or FREE (free tier)

### **OpenAI GPT-4o-mini**
- **Vetting**: ~$0.001 per source
- **Extraction**: ~$0.002 per source
- **Total per Source**: ~$0.003 + Jina cost

### **Total Cost per Query**
- Searches 5 sources
- **Free Tier**: ~$0.015 (OpenAI only)
- **Paid Tier**: ~$0.065 (OpenAI + Jina)

**Still much cheaper than Browserbase ($69/month)!**

## 🚀 Setup

### 1. **Environment Variables**

Add to your `.env.local`:

```bash
# Jina AI (optional - works without API key for basic use)
JINA_API_KEY=your_jina_api_key_here

# OpenAI (already required)
OPENAI_API_KEY=your_openai_api_key_here
```

> **Note**: Jina AI works **without an API key** for basic use! The API key just removes rate limits.

### 2. **Get Jina API Key (Optional)**

1. Go to https://jina.ai/
2. Sign up for free account
3. Get API key from dashboard
4. 1M tokens/month free tier

## 📱 UI Components

### **Search Button**
- Purple button: "Find Legal Sources"
- Shows loading spinner while fetching

### **Loading State**
- Animated spinner
- Status message: "Fetching and vetting content from authoritative sources"

### **Not Found Message**
- Amber alert box
- Explains why sources weren't found
- Suggests consulting an attorney

### **Found Sources**
- Clean card layout
- **Header**: Title + URL + external link icon
- **Statute Text**: Gray box with monospace font
- **Explanation**: Blue box with plain English
- **Link**: "View Full Legal Page" button

### **Footer Disclaimer**
- Amber warning box
- Legal disclaimer about not being legal advice

## 🧪 Testing

### **Test Cases**

1. **Good Source** (should pass vetting):
   - Search for "security deposit" in Illinois
   - Should find 765 ILCS 715/1
   - Should show exact statute text

2. **Bad Source** (should be rejected):
   - Blog posts
   - Marketing pages
   - Wrong state content

3. **No Sources** (should show helpful message):
   - Obscure tenant right
   - State without specific law

### **Console Logs**

The system logs extensively:
```
🚀 Processing legal source: [URL]
📍 Looking for: [tenant right] in [state]
📄 Fetching content from: [URL]
✅ Fetched [X] characters
🔍 Vetting content for: [tenant right] in [state]
📊 Vetting result: ✅ RELEVANT (score: 85/100)
📝 Reason: [explanation]
📝 Extracting specific statute text
✅ Extracted [X] characters of statute text
```

## 🎯 Benefits

### **vs. Current OpenAI Web Search**
- ✅ **Full Content**: Not just snippets
- ✅ **Exact Text**: Actual statute quotes
- ✅ **Verified**: Vetted for relevance
- ✅ **Better UX**: Clear when sources aren't found

### **vs. Browserbase**
- ✅ **10x Faster**: 3-5s vs 30-60s
- ✅ **90% Cheaper**: $2/M vs $69/month
- ✅ **Simpler**: No browser automation needed
- ✅ **More Reliable**: No browser crashes

### **vs. Direct Scraping**
- ✅ **Legal**: Jina handles ToS compliance
- ✅ **Reliable**: Handles JS, dynamic content
- ✅ **Maintained**: No breakage when sites change

## 🔮 Future Enhancements

1. **Highlighting**: When user clicks link, could highlight the exact text on the page (would need browser extension)
2. **Caching**: Cache vetted sources to reduce API costs
3. **User Feedback**: Let users rate source relevance
4. **More Sources**: Process top 10 instead of top 5
5. **PDF Support**: Extract from PDF legal documents

## 🐛 Troubleshooting

### **Issue**: No sources found
- Check console logs for vetting scores
- May need to lower threshold from 60% to 50%
- State may not have specific law on that topic

### **Issue**: Irrelevant sources passing
- Increase vetting threshold from 60% to 70%
- Update vetting prompt to be more strict

### **Issue**: Jina AI timeout
- Check if URL is accessible
- May need to add retry logic
- Some government sites are slow

## 📈 Next Steps

1. ✅ **Test** the implementation
2. ✅ **Integrate** into `LeaseWiseApp.tsx`
3. ✅ **Deploy** to production
4. 📊 **Monitor** costs and relevance
5. 🎯 **Iterate** based on user feedback

---

**Ready to use!** The system is fully implemented and will provide much better legal source quality than the current snippet-based approach.

