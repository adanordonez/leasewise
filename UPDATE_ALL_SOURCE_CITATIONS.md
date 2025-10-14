# Update Instructions for All SourceCitation Components

## Summary Cards - Update Pattern

For each summary card in `LeaseWiseApp.tsx`, update from:
```tsx
<SourceCitation sourceText={analysisResult.summary.sources?.field} label="Label" />
```

To:
```tsx
<SourceCitation 
  sourceText={analysisResult.summary.sources?.field} 
  label="Label"
  pageNumber={analysisResult.summary.pageNumbers?.field}
  pdfUrl={analysisResult.pdfUrl}
  searchText={analysisResult.summary.sources?.field}
/>
```

### Fields to Update:
1. ✅ monthlyRent (DONE)
2. securityDeposit
3. leaseStart
4. leaseEnd

## Red Flags Section - Update Pattern

From:
```tsx
<SourceCitation sourceText={flag.source} label={`Red Flag: ${flag.issue}`} />
```

To:
```tsx
<SourceCitation 
  sourceText={flag.source} 
  label={`Red Flag: ${flag.issue}`}
  pageNumber={flag.page_number}
  pdfUrl={analysisResult.pdfUrl}
  searchText={flag.source}
/>
```

## Rights Section - Update Pattern

From:
```tsx
<SourceCitation sourceText={right.source} label="Your Right Source" />
```

To:
```tsx
<SourceCitation 
  sourceText={right.source} 
  label="Your Right Source"
  pageNumber={right.page_number}
  pdfUrl={analysisResult.pdfUrl}
  searchText={right.source}
/>
```

## Key Dates Section - Update Pattern

From:
```tsx
<SourceCitation sourceText={date.source} label={`Key Date: ${date.event}`} />
```

To:
```tsx
<SourceCitation 
  sourceText={date.source} 
  label={`Key Date: ${date.event}`}
  pageNumber={date.page_number}
  pdfUrl={analysisResult.pdfUrl}
  searchText={date.source}
/>
```

---

## What This Achieves

1. **Page Numbers**: Each source citation shows which page the info came from
2. **PDF Viewing**: Users can click to view the exact location in the PDF
3. **Text Highlighting**: PDF viewer attempts to highlight the search text
4. **Better UX**: Users can verify information directly in the source document

---

## Next Steps

After updating all SourceCitation components:
1. Test with a real PDF lease
2. Verify page numbers appear correctly
3. Test PDF viewer opens and shows correct page
4. Check highlighting works (may need PDF.js text layer)
5. Test on mobile (PDF viewer is responsive)

