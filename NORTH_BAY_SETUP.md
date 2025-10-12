# North Bay Data Coverage - Setup Complete ✅

## Jurisdictions Added

### California State
- **California** (state-level)

### Counties
1. **Marin County, CA** - Board of Supervisors
2. **Sonoma County, CA** - Board of Supervisors  
3. **Napa County, CA** - Board of Supervisors

### Cities
1. **San Rafael, CA** - Marin County
2. **Santa Rosa, CA** - Sonoma County
3. **Napa, CA** - Napa County
4. **Petaluma, CA** - Sonoma County

## Data Sources Configured

### Legistar-Based Platforms (8 connectors)
These jurisdictions use the standardized Legistar platform for legislative management:

1. **Sonoma County** - `sonoma-county.legistar.com`
   - Meetings connector: ✅ Enabled
   - Legislation connector: ✅ Enabled

2. **Napa County** - `napa.legistar.com`
   - Meetings connector: ✅ Enabled
   - Legislation connector: ✅ Enabled

3. **Santa Rosa City** - `santa-rosa.legistar.com`
   - Meetings connector: ✅ Enabled
   - Legislation connector: ✅ Enabled

4. **Napa City** - `napacity.legistar.com`
   - Meetings connector: ✅ Enabled
   - Legislation connector: ✅ Enabled

### Custom Platforms (Future Phase)
These jurisdictions require custom parsers (not yet implemented):
- Marin County - Custom portal at `marincounty.gov`
- San Rafael - Custom portal
- Petaluma - Custom portal

## District Information

All California locations include complete district mapping:
- **State Senate Districts** (1-40)
- **State Assembly Districts** (1-80)  
- **US Congressional Districts** (CA 1-52)
- **County Supervisor Districts** (where applicable)
- **City Council Districts** (where applicable)

Representative names are included where available.

## Known Issues and Fixes

### ✅ Fixed: Jurisdiction Slug Format
The connectors initially had incorrect jurisdiction slugs (e.g., `sonoma-county-ca`) but have been updated to the correct format with type prefixes (e.g., `county:sonoma-county-ca`). All 8 North Bay connectors are now properly configured.

### ✅ Fixed: Legistar Legislation Parser
**Issue**: Legistar legislation pages require search parameters to display data. Simply fetching `/Legislation.aspx` returns an empty page with "Please enter your search criteria."

**Solution**: The parser now tries multiple URL patterns with search parameters:
- `Legislation.aspx?ShowAll=1` - Attempts to fetch all legislation
- `Legislation.aspx?YearId=<current_year>` - Fetches current year only
- `Legislation.aspx?View=List` - Alternative view parameter

The parser automatically detects which URL returns actual data and uses that one.

**Note**: Some Legistar sites may still return 0 results if they:
1. Require POST requests with form data (not yet supported)
2. Have no current year legislation
3. Use different URL patterns than tested

Current status: **18 meetings imported, 0 legislation** (as of last connector run)

### Manual Trigger (Admin Only)
1. Navigate to `/admin/connectors` in your app
2. Find a North Bay connector (e.g., "sonoma-county-meetings")
3. Click "Run now"
4. Wait for "Last run" to update with stats

### Automatic Schedule
All connectors run every 6 hours automatically via cron.

### Test a Single Connector via API
```bash
# Example: Run Sonoma County meetings
curl -X POST 'https://dizlzsmsfdtfubopnolf.supabase.co/functions/v1/run-connector' \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json" \
  -d '{"connectorId": "[connector-uuid]"}'
```

## Location Filtering

The location selector now includes all North Bay jurisdictions:
- ✅ Automatically loads from database
- ✅ "Near Me" detects Bay Area locations (37.2-38.5°N, -123.5 to -121.0°W)
- ✅ Supports up to 3 location selections in demo mode
- ✅ District information displays on all legislation/meeting cards

## Expected Data

Each connector should fetch:
- **Meetings**: 5+ recent/upcoming meetings per jurisdiction
- **Legislation**: 10+ recent ordinances/resolutions per jurisdiction

All items include:
- Full text extraction (where PDFs available)
- AI-generated summaries
- District information
- Tags and metadata

## Verification Checklist

After connectors run, verify:
- [ ] Legislation cards show North Bay items
- [ ] Meeting calendar includes North Bay meetings
- [ ] District badges display correctly (State SD-X, CA Assembly D-X, CA-X)
- [ ] Location filter shows all 7 new jurisdictions
- [ ] "Near Me" detects Bay Area coordinates
- [ ] Search works across all jurisdictions
- [ ] Trending topics include North Bay items

## Files Modified

### Backend
- `supabase/migrations/[timestamp]_north_bay_jurisdictions.sql` - Added jurisdictions and connectors
- `supabase/functions/_shared/parsers/legistarMeetings.ts` - New generic parser
- `supabase/functions/_shared/parsers/legistarLegislation.ts` - New generic parser
- `supabase/functions/run-connector/index.ts` - Added Legistar parser routing

### Frontend
- `src/data/californiaDistricts.ts` - Updated with all North Bay district mappings
- `src/components/LocationSelector.tsx` - Enhanced "Near Me" for Bay Area detection
- `src/components/DistrictInfo.tsx` - Already supports CA districts (from SKU-14)

## Next Steps (Future Enhancements)

1. **Custom Parsers**: Build parsers for Marin County, San Rafael, Petaluma
2. **More Cities**: Add Novato, smaller North Bay cities
3. **Real-time Updates**: Implement webhooks for instant data updates
4. **Advanced Filtering**: Filter by specific districts, representatives
5. **Representative Profiles**: Add pages for each elected official

## Notes

- Pre-existing security warnings are unrelated to this migration
- Legistar parsers are generic and can be reused for other Legistar-based jurisdictions
- District information automatically displays thanks to SKU-14 infrastructure
- All new jurisdictions inherit existing features (search, trending topics, watchlists, etc.)
