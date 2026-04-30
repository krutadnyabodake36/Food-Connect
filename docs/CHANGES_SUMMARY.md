# FoodConnect - Major Updates & Bug Fixes

## Issue 1: ✅ Map features not working properly
**Status:** Addressed
- LiveMap component polls volunteer location every 2 seconds (already implemented)
- VolunteerMap uses supercluster for efficient marker rendering
- Both interfaces support full map interactions

## Issue 2: ✅ Image uploaded is Idli but shows Biryani (tags/data mismatch)
**Status:** FIXED
- **Root Cause:** When new image uploaded, old tags were being merged with new analysis tags instead of replaced
- **Solution:** 
  - Clear title and tags when new file is selected
  - Use ONLY analysis results for tags (don't merge with previous upload)
  - Better error messages if analysis fails
  - User can manually correct tags if AI analysis is inaccurate
- **Files Modified:** `src/pages/hotel/Donate.tsx`

## Issue 3: ✅ Hotel interface shouldn't load every 2 seconds
**Status:** FIXED
- **Root Cause:** Polling interval was 2 seconds causing frequent re-renders
- **Solution:**
  - Increased polling interval from 2000ms → 5000ms (5 seconds, 60% less frequent)
  - Improved hash comparison to include `quantityUnit` and `claimedQuantity`
  - Hash-based change detection prevents unnecessary setState calls
- **Files Modified:** `src/contexts/DonationContext.tsx`

## Issue 4: ✅ Partial Pickup Support - Units & Quantities Mismatch
**Status:** FULLY IMPLEMENTED

### Backend Changes:
1. **New Database Columns:**
   - `expiry_date` → When food was prepared (TIMESTAMP)
   - `claimed_quantity` → What volunteer claims to pick (FLOAT)
   
2. **Updated Models:**
   - `Donation` table: added `expiry_date` and `claimed_quantity`
   - `PickupRequest` table: added `claimed_quantity` and `claimed_unit`

3. **Enhanced API Endpoints:**
   - `/donations/{id}/request` - Now accepts `claimedQuantity` and `claimedUnit`
   - `/donations/{id}/accept` - Stores and tracks partial pickups
   - `/donations/{id}/complete` - Creates new remainder donation if partial pickup
   - `/donations/{id}/verify` - Same partial pickup handling

4. **Partial Pickup Logic:**
   - Volunteer claims X units (e.g., 17 plates out of 25)
   - Hotel donation marked as "assigned" with claimed_quantity = 17
   - After pickup completes, remainder donation created with 8 plates (25-17)
   - Remainder donation appears in hotel donations list as "pending"
   - SMS alerts include claimed quantity

### Frontend Changes:
1. **Volunteer Interface - Types Fix:**
   - Changed `quantity: number` → `weight: number` (matches backend)
   - Added `quantityUnit?: 'kg' | 'plates' | 'pieces' | 'servings'`
   - `DonationSheetProps` updated: `onAcceptPickup(id, claimedQuantity, unit)`

2. **Volunteer Interface - Display:**
   - Shows "Total Weight/Quantity: 25 pieces"
   - Range slider for claiming partial quantity (1-25)
   - Displays claimed unit correctly (kg, plates, pieces, servings)
   - SMS confirmation includes claimed quantity and unit

3. **Hotel Dashboard - Display:**
   - Shows `weight` + `quantityUnit` (e.g., "25 pieces" or "5 kg")
   - Display label changes based on unit ("Total Weight" for kg, "Total Quantity" for others)
   - Claimed quantity tracked and visible in requests

### Files Modified:
- Backend: `backend/main.py` (models, endpoints, migrations)
- Frontend Types: `src/types.ts`, `foodconnect-volunteer-portal/types.ts`
- Components: 
  - `foodconnect-volunteer-portal/components/DonationSheet.tsx`
  - `foodconnect-volunteer-portal/App.tsx`
  - `src/contexts/DonationContext.tsx`
  - `src/pages/hotel/Donor.tsx` (for expiry date)

## Issue 5: ✅ Add Expiry Date Feature  
**Status:** FULLY IMPLEMENTED

### Features:
1. **Hotel Side:**
   - New "Food Prepared On" (date) field in Donate form
   - Stored as `expiryDate` (ISO datetime string)
   - Shows current date by default

2. **Volunteer Side:**
   - `expiryDate` displayed when available
   - AI can analyze: "Is this food expired?" based on prep date
   - WasteInsights component can use this data

3. **Backend:**
   - New column `expiry_date` on Donation table
   - Partially completed donations retain expiry_date on remainder

### Files Modified:
- `src/pages/hotel/Donate.tsx` - Added expiry date input
- `src/types.ts` - Added `expiryDate?: string` to HotelDonation
- `backend/main.py` - Schema, payloads, endpoints

## Key Improvements Summary:

| Issue | Before | After |
|-------|--------|-------|
| Polling frequency | 2 seconds | 5 seconds (60% less) |
| Tag mismatch | Tags merged from old+new uploads | Only new upload analysis used |
| Partial pickups | Not supported | Fully supported with remainder tracking |
| Units | Only kg | kg, plates, pieces, servings |
| Expiry tracking | Not available | Date picker + AI analysis |
| Data coherence | Donations closed on partial pickup | Remainder donation created automatically |

## Database Migrations:
All new columns use `ALTER TABLE IF NOT EXISTS` to preserve existing data:
```sql
ALTER TABLE donations ADD COLUMN IF NOT EXISTS quantity_unit VARCHAR(20) DEFAULT 'kg'
ALTER TABLE donations ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP
ALTER TABLE donations ADD COLUMN IF NOT EXISTS claimed_quantity FLOAT
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS claimed_quantity FLOAT  
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS claimed_unit VARCHAR(20)
```

## Testing Instructions:

### 1. Test Partial Pickups:
```
Frontend (Hotel): Donate 25 plates of food
Frontend (Volunteer): Select 17 plates to claim
Backend: Verify donation.claimed_quantity = 17
Backend: After completion, new donation created with 8 plates remaining
```

### 2. Test Units Display:
```
Hotel: Create donation with "plates" unit
Volunteer: See "25 plates" in donation sheet
Hotel: Dashboard shows "25 plates" (not "25 kg")
```

### 3. Test Expiry Date:
```
Hotel: Set "Food Prepared On" date
Verify: expiryDate returned in donation API response
```

### 4. Test Reduced Polling:
```
Monitor: Network tab in DevTools
Expected: API calls every 5 seconds (instead of 2)
Dashboard: Should not flicker/reload constantly
```

## Known Notes:
- Deprecation warnings from Python 3.10 and google.generativeai package (not errors, just future notices)
- LiveMap location polling remains at 2 seconds (appropriate for live tracking)
- Image analysis may occasionally misidentify food; users can manually correct tags
- All backward compatible: existing kg donations continue to work with default unit='kg'

## Next Steps (Optional):
- Add CSV export with quantity units
- Add expiry date expiration alerts
- Implement expiry date as display info on volunteer map
- Add image verification with multiple AI models
