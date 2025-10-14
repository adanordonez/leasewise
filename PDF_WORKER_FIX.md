# PDF.js Worker Fix

## Issue
The PDF viewer was failing to load with errors:
```
Setting up fake worker failed: "Failed to fetch dynamically imported module: 
http://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.js"
```

## Root Cause
The CDN URL for the PDF.js worker was:
1. Using HTTP instead of HTTPS (mixed content issue)
2. Potentially blocked by ad blockers or content security policies
3. Unreliable in some network environments
4. Added latency from external CDN

## Solution Applied

### 1. ✅ Local Worker File
Copied the PDF.js worker to the public directory:
```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

### 2. ✅ Updated Worker Source
Changed from CDN to local file in `components/PDFViewer.tsx`:

**Before:**
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

**After:**
```typescript
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}
```

### 3. ✅ Automated Copy Script
Created `scripts/copy-pdf-worker.js` to automate worker file copying.

### 4. ✅ PostInstall Hook
Added to `package.json`:
```json
"scripts": {
  "postinstall": "node scripts/copy-pdf-worker.js"
}
```

Now the worker file is automatically copied after every `npm install`.

## Benefits

### Reliability
✅ No dependency on external CDN
✅ Works in all network environments
✅ Not blocked by ad blockers
✅ No mixed content issues

### Performance
✅ Faster loading (local file)
✅ No CDN latency
✅ Works offline (if app is cached)

### Security
✅ Controlled by your domain
✅ No third-party scripts
✅ Passes CSP policies

## File Locations

### Source
```
node_modules/pdfjs-dist/build/pdf.worker.min.mjs
```

### Destination
```
public/pdf.worker.min.mjs
```

### Served As
```
https://your-domain.com/pdf.worker.min.mjs
```

## Deployment Notes

### Vercel/Production
The `public/` directory is automatically deployed, so the worker file will be available at:
```
https://your-app.vercel.app/pdf.worker.min.mjs
```

### Git
The worker file (1MB) should be committed to git:
```bash
git add public/pdf.worker.min.mjs
```

This ensures:
- Consistent deployments
- No need to run postinstall on CI/CD
- Works immediately after clone

**Alternative**: Add to `.gitignore` if you prefer to generate it during build:
```gitignore
# .gitignore
public/pdf.worker.min.mjs
```

Then ensure your build process runs:
```bash
npm install  # Runs postinstall automatically
```

## Maintenance

### Updating pdfjs-dist
When you update the pdfjs-dist package:
```bash
npm update pdfjs-dist
```

The postinstall script automatically copies the new worker version.

### Manual Copy
If needed, manually copy the worker:
```bash
npm run postinstall
# or
node scripts/copy-pdf-worker.js
```

## Testing

### Verify Worker Loads
1. Open dev tools → Network tab
2. Upload a lease and open PDF viewer
3. Look for request to `/pdf.worker.min.mjs`
4. Should return 200 OK and ~1MB file

### Check Console
No errors should appear:
- ✅ No "Failed to fetch" errors
- ✅ No "fake worker" errors
- ✅ PDF pages render correctly

## Troubleshooting

### Worker not found (404)
```bash
# Re-run the copy script
node scripts/copy-pdf-worker.js

# Verify file exists
ls -lh public/pdf.worker.min.mjs

# Restart dev server
npm run dev
```

### Worker still using CDN
Clear browser cache or hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### File size issues
The worker file is ~1MB, which is normal:
```bash
$ ls -lh public/pdf.worker.min.mjs
-rw-r--r--  1.0M  pdf.worker.min.mjs
```

## Alternative Solutions

If you prefer not to include the 1MB worker file:

### Option 1: CDN with HTTPS
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = 
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
```

### Option 2: Dynamic Import
```typescript
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

### Option 3: Build-time Copy
Only copy during build, not postinstall:
```json
"scripts": {
  "prebuild": "node scripts/copy-pdf-worker.js"
}
```

## Summary

✅ **Fixed**: PDF worker loads reliably from local file
✅ **Automated**: Postinstall script keeps it updated
✅ **Fast**: No CDN latency
✅ **Secure**: No third-party scripts
✅ **Reliable**: Works in all environments

The PDF viewer should now work perfectly!

---

**Status**: ✅ FIXED
**Location**: `public/pdf.worker.min.mjs` (1.0MB)
**Loading**: Local file, not CDN
**Automation**: Postinstall script
**Ready**: Test PDF viewer now!

