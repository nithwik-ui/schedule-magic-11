

# Fix Dynamic Dropdowns and Timetable Data

## What's Wrong Now
1. **Year values are wrong** -- Our app sends "1", "2", "3", "4" but the university expects "First", "Second", "Third", "Fourth"
2. **Batch values are wrong** -- Our app sends "A", "B", "C" etc. but the university uses roll-number-style codes like "24BTCAIAIB01", "24BTCAIAIB02", etc.
3. **Year and Batch are loaded dynamically** -- On the university website, selecting a degree triggers an AJAX call to load available years, then selecting a year loads available batches. We need to replicate this.
4. **Type detection is broken** -- The API returns `ltp` as "Lecture", "Lab", "Tutorial" directly, but our `inferType` function doesn't check for these simple strings.

## What's Working
The core timetable API (`searchBatchReport2Public`) works correctly when given the right values. Testing with `degree=BTECH-CSE`, `year=Second`, `batch=24BTCAIAIB01` returned real timetable data with subjects, faculty, rooms, etc.

## Plan

### Step 1: Create `fetch-options` Backend Function
A new backend function at `supabase/functions/fetch-options/index.ts` that:
- Accepts `{ action: "getYears" | "getBatches", degree: string, year?: string }`
- Fetches the university page to get CSRF token and session cookies
- For `getYears`: POSTs to `https://timetable.sruniv.com/getYearByDegreePublic` with `{ _token, degree }` and returns the year list (e.g., ["First", "Second", "Third", "Fourth"])
- For `getBatches`: POSTs to `https://timetable.sruniv.com/getBatchByYearPublic` (or similar endpoint) with `{ _token, degree, year }` and returns the batch list (e.g., ["24BTCAIAIB01", "24BTCAIAIB02", ...])
- If the first URL pattern doesn't work, tries common alternatives (`/getYear`, `/getBatch`, `/getYearByDegree`, etc.)

### Step 2: Update `fetch-timetable` Backend Function
- Fix the `inferType` function to recognize "Lecture", "Lab", "Tutorial" as direct values from the `ltp` field
- The function already works correctly otherwise

### Step 3: Update `constants.ts`
- Update `DEGREES` to include ALL 45 degrees from the university website
- Remove hardcoded `YEARS` array (years will now be fetched dynamically)
- Keep `TIME_SLOTS` and `DAYS` as-is

### Step 4: Rewrite `ProfileSetup.tsx` with Cascading Dropdowns
- **Degree dropdown**: Static list of all degrees
- **Year dropdown**: Disabled until degree is selected. When degree changes, calls `fetch-options` with `action: "getYears"` to load available years. Shows a loading spinner while fetching.
- **Batch dropdown**: Disabled until year is selected. When year changes, calls `fetch-options` with `action: "getBatches"` to load available batches. Shows a loading spinner while fetching.
- Save the exact values (e.g., "Second", "24BTCAIAIB01") to the user's profile

### Step 5: Update `Dashboard.tsx`
- Display batch code properly in the header (show the roll-number-style batch)
- Pass exact values to TimetableView

### Step 6: Fix `TimetableView.tsx`
- Update type mapping to use the direct `ltp` values ("Lecture" -> lecture, "Lab" -> lab, "Tutorial" -> tutorial)
- The component already handles the data structure correctly

## Technical Details

### New file: `supabase/functions/fetch-options/index.ts`
```text
Accepts: { action, degree, year? }
Returns: { success: true, options: string[] }

Flow:
1. GET batchReport page -> extract CSRF + cookies
2. POST to year/batch endpoint with CSRF + cookies
3. Parse response and return options array
```

### Database: profiles table
No schema change needed -- the `year` and `batch` columns are already text type, so they can store "Second" and "24BTCAIAIB01" instead of "2" and "F".

### Updated files
- `supabase/functions/fetch-options/index.ts` (new)
- `supabase/functions/fetch-timetable/index.ts` (fix inferType)
- `src/lib/constants.ts` (full degree list, remove YEARS)
- `src/components/ProfileSetup.tsx` (cascading dynamic dropdowns)
- `src/components/TimetableView.tsx` (fix type mapping)
- `src/pages/Dashboard.tsx` (minor display update)
- `supabase/config.toml` (add fetch-options function config)
