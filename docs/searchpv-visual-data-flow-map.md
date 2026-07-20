# SearchPV Visual Data-Flow Map

**Scope:** SearchPV Next.js repository and the current Supabase metadata snapshot supplied in July 2026.

This document is deliberately visual and high level. It answers:

- What database objects feed each feature?
- Which Next.js files query those objects?
- Which components receive the results?
- What page, report, chart, table, or export is produced?

Detailed business rules should remain as comments beside the relevant code.

---

## 1. Master SearchPV Flow

```mermaid
flowchart LR
    subgraph SOURCE["Supabase source tables"]
        DW["dw.clndr<br/>dw.prprty<br/>dw.lstng<br/>dw.invntry_snap<br/>dw.clsd_sale<br/>dw.prc_hstry"]
        APP["app.development_profile<br/>app.development_nearby<br/>app.development_nearby_rollup<br/>app.place_display_map"]
        CONTENT["content.page_content"]
    end

    subgraph MODEL["Database reporting and application layer"]
        RPT["rpt views<br/>snapshots, drilldowns,<br/>active and pending listings"]
        PUBLIC["public views<br/>application-facing datasets"]
        INTERNAL["internal views<br/>closed/pending participation"]
        RPC["public RPC functions<br/>agent and agency reporting"]
    end

    subgraph NEXT["Next.js data-access files"]
        PAGES["page.tsx server pages"]
        ROUTES["route.ts API/export endpoints"]
        AUTH["Supabase SSR auth<br/>proxy, login, protected layout"]
    end

    subgraph UI["React presentation layer"]
        COMPONENTS["filters, metric cards,<br/>charts, navigation,<br/>report controls"]
    end

    subgraph OUTPUT["User-visible outputs"]
        MARKET["Explore Market pages"]
        INTEL["Market Intelligence"]
        REPORTS["Reports and exports"]
        OFFICE["Protected office reporting"]
        SITE["Sitemap and public navigation"]
    end

    DW --> RPT
    DW --> PUBLIC
    DW --> INTERNAL
    APP --> PUBLIC
    CONTENT --> PUBLIC

    RPT --> PUBLIC
    INTERNAL --> RPC

    PUBLIC --> PAGES
    PUBLIC --> ROUTES
    RPC --> PAGES
    AUTH --> OFFICE

    PAGES --> COMPONENTS
    ROUTES --> REPORTS
    COMPONENTS --> MARKET
    COMPONENTS --> INTEL
    COMPONENTS --> OFFICE
    PAGES --> SITE
```

---

## 2. Market Exploration and Home Page

```mermaid
flowchart LR
    subgraph TABLES["Warehouse tables"]
        T1["dw.clndr"]
        T2["dw.prprty"]
        T3["dw.lstng"]
        T4["dw.invntry_snap"]
        T5["dw.clsd_sale"]
    end

    subgraph RPT["Reporting views"]
        R1["rpt.community_snapshot"]
        R2["rpt.area_snapshot"]
        R3["rpt.development_snapshot"]
        R4["rpt.area_listing_drilldown"]
        R5["rpt.community_listing_drilldown"]
        R6["rpt.development_listing_drilldown"]
    end

    subgraph PUBLIC["Public application views"]
        P1["public.community_snapshot"]
        P2["public.area_snapshot"]
        P3["public.development_snapshot"]
        P4["public.area_listing_drilldown"]
        P5["public.community_listing_drilldown"]
        P6["public.development_listing_drilldown"]
    end

    subgraph FILES["Next.js pages"]
        F1["src/app/page.tsx"]
        F2["markets/.../areas/[areaSlug]/page.tsx"]
        F3["markets/.../communities/[communitySlug]/page.tsx"]
        F4["markets/.../developments/[developmentSlug]/page.tsx"]
    end

    subgraph COMPONENTS["Main UI components"]
        C1["ZoneAreaFilters"]
        C2["HierarchySelects"]
        C3["ToggleMetricCard"]
        C4["Header / branding"]
    end

    subgraph OUTPUTS["Outputs"]
        O1["Home market explorer"]
        O2["Area overview"]
        O3["Community overview"]
        O4["Development overview"]
        O5["Active, pending, closed metrics<br/>and listing drilldowns"]
    end

    T1 --> R1
    T2 --> R1
    T3 --> R1
    T4 --> R1
    T5 --> R1

    T2 --> R3
    T3 --> R3
    T4 --> R3
    T5 --> R3

    T2 --> R4
    T3 --> R4
    T4 --> R4
    T5 --> R4
    T2 --> R5
    T3 --> R5
    T4 --> R5
    T5 --> R5
    T2 --> R6
    T3 --> R6
    T4 --> R6
    T5 --> R6

    R1 --> P1
    P1 --> R2
    R2 --> P2
    R3 --> P3
    R4 --> P4
    R5 --> P5
    R6 --> P6

    P1 --> F1
    P3 --> F1
    P4 --> F1
    P5 --> F1
    P6 --> F1

    P1 --> F2
    P4 --> F2
    P5 --> F2

    P1 --> F3
    P3 --> F3
    P5 --> F3
    P6 --> F3

    P3 --> F4
    P6 --> F4

    F1 --> C1
    F1 --> C2
    F2 --> C3
    F3 --> C3
    F4 --> C3
    F1 --> C4
    F2 --> C4
    F3 --> C4
    F4 --> C4

    C1 --> O1
    C2 --> O1
    C3 --> O2
    C3 --> O3
    C3 --> O4
    F1 --> O5
    F2 --> O5
    F3 --> O5
    F4 --> O5
```

---

## 3. Development Profile and Nearby Places

```mermaid
flowchart LR
    A1["app.development_profile"] --> P1["public.development_profile"]
    A2["app.development_nearby"] --> P2["public.development_nearby"]
    A3["app.development_nearby_rollup"] --> P3["public.development_nearby_rollup"]

    P1 --> PAGE["development page.tsx"]
    P2 --> PAGE
    P3 --> PAGE
    P4["public.development_snapshot"] --> PAGE
    P5["public.development_listing_drilldown"] --> PAGE

    PAGE --> M1["MetricCard / ToggleMetricCard"]
    PAGE --> N1["NearbySection"]
    N1 --> W1["WalkabilityInfo"]

    M1 --> OUT1["Development market metrics"]
    N1 --> OUT2["Nearby services and attractions"]
    W1 --> OUT3["Walkability explanation"]
```

**Page file**

```text
src/app/markets/[marketSlug]/areas/[areaSlug]/communities/[communitySlug]/developments/[developmentSlug]/page.tsx
```

---

## 4. Public Closed-Sales Analytics

```mermaid
flowchart LR
    subgraph TABLES["Warehouse tables"]
        T1["dw.prprty"]
        T2["dw.lstng"]
        T3["dw.clsd_sale"]
        T4["dw.clndr"]
    end

    subgraph VIEWS["Public views"]
        V1["public.closed_listing_list"]
        V2["public.closed_listing_detail"]
        V3["public.closed_sales_mls_list"]
        V4["public.community_snapshot"]
        V5["public.development_snapshot"]
    end

    subgraph FILES["Next.js pages"]
        P1["market-intelligence/closed-sales/page.tsx"]
        P2["closed-sales/search-results/page.tsx"]
        P3["closed-sales/[mls]/page.tsx"]
    end

    subgraph COMPONENTS["Components"]
        C1["ClosedListingFilters"]
        C2["ClosedSalesMonthlyChart"]
        C3["Header / branding"]
    end

    subgraph OUTPUTS["Outputs"]
        O1["Closed-sales dashboard"]
        O2["Summary cards"]
        O3["12-month year-over-year chart"]
        O4["Filtered MLS results table"]
        O5["Individual closed-listing detail"]
    end

    T1 --> V1
    T2 --> V1
    T3 --> V1

    T1 --> V3
    T2 --> V3
    T3 --> V3
    T4 --> V3

    V1 --> V2
    V4 --> V2
    V5 --> V2

    V1 --> P1
    V3 --> P2
    V2 --> P3

    P1 --> C1
    P1 --> C2
    P1 --> C3
    P2 --> C3
    P3 --> C3

    C1 --> O1
    P1 --> O2
    C2 --> O3
    P2 --> O4
    P3 --> O5
```

---

## 5. Active-Listings Report and Exports

```mermaid
flowchart LR
    T1["dw.prprty"] --> R["rpt.active_listing"]
    T2["dw.lstng"] --> R
    T3["dw.invntry_snap"] --> R
    T4["dw.prc_hstry"] --> R

    R --> V["public.active_listing"]

    V --> PAGE["reports/active-listings-report/page.tsx"]
    V --> PDF["api/reports/active-listings/pdf/route.ts"]
    V --> XLSX["api/reports/active-listings/excel/route.ts"]

    PAGE --> F["ReportHierarchyFilters"]
    PAGE --> E["ReportExportButtons"]

    F --> OUT1["Interactive active-listings report"]
    E --> PDF
    E --> XLSX
    PDF --> OUT2["Printable PDF"]
    XLSX --> OUT3["Excel workbook"]
```

**Important:** This is currently the only mapped public report that directly depends on `dw.prc_hstry`.

---

## 6. Protected Office Agency Reporting

```mermaid
flowchart LR
    subgraph TABLES["Warehouse tables"]
        T1["dw.clndr"]
        T2["dw.prprty"]
        T3["dw.lstng"]
        T4["dw.clsd_sale"]
    end

    D["internal.closed_sales_detail"]
    A["internal.closed_agent_participation"]

    T1 --> D
    T2 --> D
    T3 --> D
    T4 --> D
    D --> A

    A --> R1["closed_sales_by_agency()"]
    A --> R2["closed_sales_agency_report_summary()"]

    V["public.closed_listing_list<br/>(filter-option source)"] --> PAGE["office/(protected)/closed-sales/agencies/page.tsx"]
    R1 --> PAGE
    R2 --> PAGE

    PAGE --> FILTERS["AgencyClosedSalesFilters"]
    PAGE --> UTILS["agency-report-utils"]
    FILTERS --> OUT["Agency rankings, sides,<br/>volume, percentages and metrics"]
    UTILS --> OUT
```

---

## 7. Protected Office Agent Reporting

```mermaid
flowchart LR
    subgraph TABLES["Warehouse tables"]
        T1["dw.clndr"]
        T2["dw.prprty"]
        T3["dw.lstng"]
        T4["dw.clsd_sale"]
    end

    D["internal.closed_sales_detail"]
    A["internal.closed_agent_participation"]

    T1 --> D
    T2 --> D
    T3 --> D
    T4 --> D
    D --> A

    A --> R1["closed_sales_by_agent()"]
    A --> R2["closed_sales_agent_report_summary()"]
    D --> R3["closed_sales_agent_detail()"]

    V["public.closed_listing_list<br/>(filter-option source)"] --> PAGE1["office/(protected)/closed-sales/agents/page.tsx"]
    R1 --> PAGE1
    R2 --> PAGE1

    PAGE1 --> FILTERS["AgentClosedSalesFilters"]
    PAGE1 --> UTILS["agent-report-utils"]
    FILTERS --> OUT1["Agent rankings and summary metrics"]
    UTILS --> OUT1

    PAGE1 --> LINK["Agent detail link"]
    LINK --> PAGE2["agents/detail/page.tsx"]
    R3 --> PAGE2
    PAGE2 --> EXPORT["AgentDetailExportButtons"]
    PAGE2 --> OUT2["Transaction-level agent report"]
    EXPORT --> OUT3["Print / export controls"]
```

---

## 8. Authentication and Protected Routes

```mermaid
flowchart LR
    BROWSER["Browser request"] --> PROXY["src/proxy.ts"]
    PROXY --> SESSION["src/lib/supabase/proxy.ts<br/>updateSession()"]
    SESSION --> CLAIMS["supabase.auth.getClaims()"]

    CLAIMS -->|Not signed in| LOGIN["/office/login"]
    LOGIN --> ACTION["office/login/actions.ts"]
    ACTION --> PASSWORD["signInWithPassword()"]

    CLAIMS -->|Signed in| LAYOUT["office/(protected)/layout.tsx"]
    LAYOUT --> OFFICE["Protected office pages"]

    OFFICE --> LOGOUT["office/(protected)/actions.ts"]
    LOGOUT --> SIGNOUT["supabase.auth.signOut()"]
```

The office protection is enforced at the server layout/proxy layer, not only by hiding navigation links.

---

## 9. Content and Older Standalone Area/Development Routes

```mermaid
flowchart LR
    C["content.page_content"] --> PV["public.page_content"]
    PV --> AREA["src/app/areas/[zoneSlug]/[areaSlug]/page.tsx"]
    AS["public.area_snapshot"] --> AREA
    AREA --> OUT1["Standalone area content page"]

    DS["public.development_snapshot"] --> DEV["src/app/developments/[slug]/page.tsx"]
    DEV --> OUT2["Standalone development page"]
```

These coexist with the newer hierarchical routes under:

```text
/markets/[marketSlug]/areas/[areaSlug]/communities/[communitySlug]/developments/[developmentSlug]
```

That distinction is useful when reviewing possible route consolidation or cleanup.

---

## 10. Sitemap Flow

```mermaid
flowchart LR
    A["public.area_snapshot"] --> S["src/app/sitemap.ts"]
    C["public.community_snapshot"] --> S
    D["public.development_snapshot"] --> S
    S --> X["Generated XML sitemap"]
    X --> Y["Search-engine discovery of geographic pages"]
```

---

## 11. Compact Where-Used Index

| Database object | Direct application consumers | Main output |
|---|---|---|
| `public.community_snapshot` | Home, area, community pages, sitemap | Geographic options and market summaries |
| `public.area_snapshot` | Standalone area page, sitemap | Area page and area URLs |
| `public.development_snapshot` | Home, community, development pages, sitemap | Development summaries and URLs |
| `public.area_listing_drilldown` | Home and area pages | Listing-level area drilldown |
| `public.community_listing_drilldown` | Home, area and community pages | Listing-level community drilldown |
| `public.development_listing_drilldown` | Home, community and development pages | Listing-level development drilldown |
| `public.development_profile` | Hierarchical development page | Descriptive development profile |
| `public.development_nearby` | Hierarchical development page | Nearby-place details |
| `public.development_nearby_rollup` | Hierarchical development page | Nearby category summaries |
| `public.closed_listing_list` | Closed-sales dashboard; office filter options | Public sales analytics and office filters |
| `public.closed_sales_mls_list` | Closed-sales search-results page | Detailed filtered sales table |
| `public.closed_listing_detail` | Closed-sale MLS detail page | Individual sale detail |
| `public.active_listing` | Active-listings page, PDF route, Excel route | Interactive and exported report |
| `public.page_content` | Standalone area page | Editorial area content |
| `closed_sales_by_agency()` | Protected agency page | Agency ranking dataset |
| `closed_sales_agency_report_summary()` | Protected agency page | Agency report totals |
| `closed_sales_by_agent()` | Protected agent page | Agent ranking dataset |
| `closed_sales_agent_report_summary()` | Protected agent page | Agent report totals |
| `closed_sales_agent_detail()` | Protected agent-detail page | Transaction-level agent history |

---

## 12. Current Security Shape

```mermaid
flowchart LR
    ANON["anon / public browser"]
    AUTH["authenticated office user"]
    VIEWS["Application-facing public views"]
    RPCS["SECURITY DEFINER office RPCs"]
    TABLES["Underlying app, content and dw tables"]
    OFFICE["Protected Next.js office routes"]

    ANON --> VIEWS
    AUTH --> VIEWS
    AUTH --> OFFICE
    OFFICE --> RPCS
    VIEWS --> TABLES
    RPCS --> INTERNAL["internal.closed_agent_participation<br/>internal.closed_sales_detail"]
    INTERNAL --> TABLES
```

Current metadata observations:

- No RLS policies were returned for the selected SearchPV schemas.
- No custom triggers were returned.
- RLS is disabled on the 19 underlying application tables included in the export.
- The five office sales RPCs are `SECURITY DEFINER`.
- Those five RPCs have a fixed `search_path` of `public, internal, pg_temp`.
- Final exposure therefore depends heavily on grants, public views, RPC execution privileges, and the Next.js server-side auth boundary.

This is a flow description, not yet a full security verdict.

---

## 13. Files That Directly Touch Supabase

| File | Reads/calls |
|---|---|
| `src/app/api/reports/active-listings/excel/route.ts` | `active_listing` |
| `src/app/api/reports/active-listings/pdf/route.ts` | `active_listing` |
| `src/app/areas/[zoneSlug]/[areaSlug]/page.tsx` | `area_snapshot`, `page_content` |
| `src/app/developments/[slug]/page.tsx` | `development_snapshot` |
| `src/app/market-intelligence/closed-sales/[mls]/page.tsx` | `closed_listing_detail` |
| `src/app/market-intelligence/closed-sales/page.tsx` | `closed_listing_list` |
| `src/app/market-intelligence/closed-sales/search-results/page.tsx` | `closed_sales_mls_list` |
| `src/app/markets/[marketSlug]/areas/[areaSlug]/communities/[communitySlug]/developments/[developmentSlug]/page.tsx` | `development_listing_drilldown`, `development_nearby`, `development_nearby_rollup`, `development_profile`, `development_snapshot` |
| `src/app/markets/[marketSlug]/areas/[areaSlug]/communities/[communitySlug]/page.tsx` | `community_listing_drilldown`, `community_snapshot`, `development_listing_drilldown`, `development_snapshot` |
| `src/app/markets/[marketSlug]/areas/[areaSlug]/page.tsx` | `area_listing_drilldown`, `community_listing_drilldown`, `community_snapshot` |
| `src/app/office/(protected)/closed-sales/agencies/page.tsx` | `closed_listing_list`, `closed_sales_agency_report_summary()`, `closed_sales_by_agency()` |
| `src/app/office/(protected)/closed-sales/agents/detail/page.tsx` | `closed_sales_agent_detail()` |
| `src/app/office/(protected)/closed-sales/agents/page.tsx` | `closed_listing_list`, `closed_sales_agent_report_summary()`, `closed_sales_by_agent()` |
| `src/app/page.tsx` | `area_listing_drilldown`, `community_listing_drilldown`, `community_snapshot`, `development_listing_drilldown`, `development_snapshot` |
| `src/app/reports/active-listings-report/page.tsx` | `active_listing` |
| `src/app/sitemap.ts` | `area_snapshot`, `community_snapshot`, `development_snapshot` |


---

## 14. Maintenance Rule

Update this map only when a change alters one of these connections:

1. A page or API route starts or stops querying a database object.
2. A view or RPC changes its upstream tables/views.
3. A component becomes responsible for a new major output.
4. A report or export endpoint is added, removed, or replaced.
5. The authentication boundary for an office route changes.

Small styling changes, local calculations, and ordinary refactoring do not require a map update.