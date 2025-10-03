# Re-run Connector to Extract Real PDF Text

## Current Status
- ✅ Jina AI extraction code is implemented in `supabase/functions/_shared/helpers.ts`
- ❌ Database still has placeholder text: `[PDF content from https://services.austintexas.gov/edims/document.cfm?id=438891]`
- 🔄 Need to re-run connector to populate database with real extracted text

## How to Re-run the Connector

### 1. Navigate to Admin Page
Go to: `/admin/connectors`

### 2. Find Austin Ordinances Connector
Look for:
- **Key**: `austin.ordinances`
- **ID**: `e568cdad-1ff0-4244-aa3a-e434588d0a7f`
- **Status**: Last run at 2025-10-03 01:10:33 (before code update)

### 3. Click "Run now" Button
- Make sure the connector is **enabled** (switch should be ON)
- Click the "Run now" button
- You'll see "Running..." with a spinner

### 4. Watch Edge Function Logs
Open Lovable Backend → Edge Functions → `run-connector`

Look for these log messages:
```
Extracting PDF text via Jina AI: https://services.austintexas.gov/edims/document.cfm?id=438891
Successfully extracted X characters from PDF
```

### 5. Verify in Database
After the connector finishes:

**Check legislation table:**
```sql
SELECT 
  external_id, 
  title, 
  LENGTH(full_text) as text_length,
  SUBSTRING(full_text, 1, 200) as text_preview 
FROM legislation 
WHERE external_id = 'ORD-2024-005'
```

**Expected result:**
- `text_length`: Should be >1000 (real content, not 80 chars)
- `text_preview`: Should show actual ordinance text, not placeholder

### 6. Test on Legislation Page
Visit: `/legislation/c1577494-d079-4b16-9d14-e2ed4e42f46c`

**Expected behavior:**
1. PDF tries to load inline (5 seconds)
2. Shows alert: "PDF cannot be displayed inline..."
3. Shows link: "View Original Document"
4. **Shows real extracted text below** (searchable)

## Troubleshooting

### If Jina AI Extraction Fails
Test manually: https://r.jina.ai/https://services.austintexas.gov/edims/document.cfm?id=438891

**If it returns text**: Connector should work
**If it returns error**: Austin's EDIMS system may not be compatible

### If Still Shows Placeholder
Check edge function logs for errors:
- Network timeouts
- Jina AI service errors
- PDF size limit exceeded (>15MB)

### Common Issues
- **"Rate limited"**: Wait a few minutes, Jina AI has rate limits
- **"PDF too large"**: Default limit is 15MB, increase `PDF_MAX_MB` env var
- **"Empty response"**: Some PDFs may not be extractable

## What Happens When It Works

### During Connector Run
```
[austin.ordinances] Starting...
Extracting PDF text via Jina AI: https://services.austintexas.gov/edims/document.cfm?id=438891
Successfully extracted 8247 characters from PDF
Updated legislation: ORD-2024-005
[austin.ordinances] Complete: 0 new, 1 updated, 0 errors
```

### After Successful Run
- Database `full_text` field contains real ordinance text
- Legislation page displays searchable content
- Users can find keywords in actual document text
- Search functionality works on real content

## Next Steps After First Successful Run

1. **Re-run other connectors** to extract text from all PDFs:
   - `austin.councilMeetings` (meeting agendas)
   - Any other connectors with PDF content

2. **Monitor for errors** - Some PDFs may fail to extract

3. **Consider scheduling** - Connectors run on schedule to fetch new data automatically
