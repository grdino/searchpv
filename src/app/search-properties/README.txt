SEARCHPV RANGE FILTER UPDATE

Apply in this order:

1. Run:
   01_update_property_search_range_functions.sql

2. Replace:
   src/lib/property-search/filters.ts
   src/lib/property-search/rpc.ts
   src/app/components/PropertySearchMoreFilters.tsx
   src/app/search-properties/page.tsx

3. No change is required to:
   src/lib/property-search/service.ts

4. Run:
   npm run build

5. Test:
   - All bedroom chip
   - Studio chip
   - 1 BR, 2 BR, 3 BR, 4+ BR chips
   - Minimum and maximum bedroom range
   - Minimum and maximum bathroom range
   - Open-ended price range
   - Open-ended HOA range
   - Existing boolean filters
   - Area -> community -> development -> IDX navigation

Important:
The SQL script drops the old function signatures inside a transaction before
creating the new signatures. Running only CREATE FUNCTION would leave the old
PostgreSQL overloads in place.
