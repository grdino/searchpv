# 06 Technical Architecture.md

# Project Atlas
## Technical Architecture

---

## Purpose

This document defines the technical structure of Atlas.

It translates the Atlas vision, architecture, state model, roadmap, and design principles into implementation rules.

This document may evolve as the platform grows.

The goal is not to predict every future feature.

The goal is to preserve clear boundaries between systems so Atlas can expand without becoming difficult to maintain.

---

# 1. Technology Stack

Atlas is built within the existing SearchPV platform.

Core technologies:

- Next.js App Router
- TypeScript
- React
- Mapbox GL JS
- Supabase PostgreSQL
- SearchPV geographic entity model
- Existing SearchPV market intelligence and property data
- Python ETL for source-data ingestion and maintenance

Atlas should reuse existing SearchPV infrastructure wherever practical.

New infrastructure should only be introduced when Atlas has a clear requirement that existing systems cannot satisfy.

---

# 2. High-Level Architecture

Atlas consists of several independent layers.

Atlas Shell
|
|-- Atlas Viewport
|     |
|     `-- Atlas Map
|
|-- Atlas Overlay
|     |
|     |-- Atlas Search
|     |-- Atlas Bottom Sheet
|     `-- Floating Controls
|
|-- Atlas State
|
|-- Atlas Controllers
|     |
|     |-- Camera Controller
|     `-- Navigation Controller
|
|-- Atlas Services
|     |
|     |-- Entity Service
|     |-- Geography Service
|     |-- Market Service
|     |-- Nearby Service
|     `-- Property Service
|
`-- SearchPV Data
      |
      |-- geo.*
      |-- dw.*
      `-- public APIs / RPCs

Each layer has a clearly defined responsibility.

---

# 3. Component Responsibilities

## AtlasShell

AtlasShell assembles the permanent Atlas application structure.

It should contain very little application logic.

Its responsibility is composition.

---

## AtlasViewport

AtlasViewport owns the geographic display area.

It provides the physical viewport in which Mapbox renders.

It should not know about market statistics, search results, listings, or bottom-sheet content.

---

## AtlasMap

AtlasMap owns the Mapbox GL JS instance.

Responsibilities include:

- initializing Mapbox
- map lifecycle
- source registration
- layer registration
- map events
- resize handling

AtlasMap should not become the primary home for Atlas business logic.

---

## AtlasOverlay

AtlasOverlay contains interface elements that float above the map.

Examples:

- search
- bottom sheet
- map controls
- notifications
- future contextual cards

The overlay should not own geographic state.

---

## AtlasSearch

AtlasSearch allows users to locate geographic entities and other supported Atlas objects.

Search results ultimately resolve to canonical Atlas identities.

Search should not directly manipulate Mapbox.

It updates Atlas State.

---

## AtlasBottomSheet

AtlasBottomSheet is the primary mobile workspace.

It presents content associated with the current Atlas State.

The sheet supports multiple positions such as:

- collapsed
- half
- focused

Its content changes independently of the underlying map.

---

# 4. Atlas State

Atlas State is the single source of truth for the current Atlas experience.

Conceptually it may contain:

```ts
type AtlasState = {
  selectedEntityKy: number | null;
  selectedEntityType: string | null;

  workspaceView:
    | "discover"
    | "community"
    | "development"
    | "market"
    | "listings"
    | "nearby"
    | "property";

  sheetState:
    | "collapsed"
    | "half"
    | "focused";

  cameraTarget: AtlasCameraTarget | null;

  selectedPropertyKy: number | null;
};

# **************************************************
# Lots more information
# **************************************************
5. Controllers

Controllers translate state changes into behavior.

Camera Controller

The Camera Controller is the only system responsible for intentional camera movement.

Examples:

fly to entity
fit entity boundary
center on centroid
frame a group of results
restore prior camera position

UI components should not call map.flyTo() or map.fitBounds() directly.

Instead they update state or invoke a defined Atlas action.

Navigation Controller

The Navigation Controller manages movement between Atlas contexts.

Examples:

Community -> Market

Community -> Listings

Development -> Property

Search Result -> Community

The goal is to preserve geographic context while changing the workspace.

6. Entity Model

Canonical SearchPV geographic entities are the primary identity system for Atlas.

The canonical identifier is:

entity_ky

Atlas should never rely on a display name as a unique identifier.

This is especially important because names can duplicate across:

zones
areas
communities
municipalities
states
developments

The existing Zone -> Area -> Community hierarchy remains authoritative.

Aliases are used for discovery and display.

Canonical entities are used for application identity.

7. Geometry

Geometry enhances entities but does not define them.

An entity may have:

verified boundary
reviewed boundary
provisional boundary
centroid only
no geometry

Atlas must continue to function in every case.

Conceptually:

type BoundaryStatus =
  | "none"
  | "centroid_only"
  | "provisional"
  | "reviewed"
  | "verified";

Public map behavior should depend on boundary quality.

Incomplete or questionable boundaries should not block the rest of Atlas.

8. Jalisco and Nayarit

Atlas is designed for mixed geographic coverage.

Jalisco may initially support detailed interactive boundaries.

Nayarit may initially use:

canonical hierarchy
entity search
cards
market intelligence
listings
centroids
community browsing

Interactive boundaries can be added progressively.

The architecture must never assume that every entity has polygon geometry.

9. Atlas Entity Service

Atlas should expose a consistent representation of a geographic entity.

Conceptually:

type AtlasEntity = {
  entityKy: number;
  entityType: string;

  canonicalName: string;
  displayName: string;

  hierarchy: {
    zone?: AtlasEntityReference;
    area?: AtlasEntityReference;
    community?: AtlasEntityReference;
  };

  centroid?: {
    longitude: number;
    latitude: number;
  };

  boundaryStatus: BoundaryStatus;

  hasMarketData: boolean;
  hasNearbyData: boolean;
  hasListings: boolean;
};

Atlas components should consume normalized Atlas objects rather than independently interpreting raw database rows.

10. API Layer

The browser should not need to understand the underlying SearchPV schemas.

Atlas API endpoints or server-side services should translate database structures into Atlas-specific responses.

Examples:

/api/atlas/entity/[entityKy]

/api/atlas/geography

/api/atlas/search

Later:

/api/atlas/market

/api/atlas/nearby

/api/atlas/listings

These endpoints should reuse existing SearchPV functions and views wherever practical.

11. Map Data

Initial geographic rendering should favor simplicity.

Early Atlas versions may use GeoJSON for:

zones
areas
communities
beaches
selected points of interest

Each geographic feature should carry the canonical identity required to connect it back to Atlas.

Example:

{
  "type": "Feature",
  "properties": {
    "entity_ky": 422,
    "entity_type_cd": "CM"
  },
  "geometry": {}
}

If geographic volume eventually requires it, Atlas may migrate selected layers to vector tiles or another optimized delivery mechanism without changing the entity model.

12. Map Layers

Map layers should be organized by purpose.

Examples:

base geography
zones
areas
communities
selected entity
beaches
developments
nearby places
listings
market visualization

Only information relevant to the current context should be emphasized.

Atlas should avoid displaying every available layer simultaneously.

13. Search

Search should resolve human language into canonical identities.

Examples:

"Romantic Zone"

"Zona Romántica"

"Emiliano Zapata"

may all resolve to the same canonical community.

Ambiguous results should preserve hierarchy.

Example:

Community Name
Area
Zone

This prevents duplicate community names from being treated as interchangeable.

14. Workspace

The Atlas Workspace represents the information currently presented about the selected context.

Possible views include:

Discover
Community
Development
Property
Market
Listings
Nearby
AI

Changing workspace view does not necessarily change the selected geographic entity.

15. Bottom Sheet Behavior

Mobile is the primary interaction model.

The Atlas Bottom Sheet should support three primary positions:

Collapsed

Map-dominant discovery.

Half

Browsing and exploration.

Focused

Detailed content.

The sheet should move independently while Atlas retains geographic context.

Desktop may later adapt this workspace into a side panel or floating panel without changing the content model.

16. Data Loading Strategy

Atlas should progressively load information.

Initial load:

application shell
Mapbox
essential geography

After interaction:

selected entity details
hierarchy
lightweight market snapshot

As requested:

nearby places
developments
listings
historical market data
richer imagery

Atlas should not download every available dataset at startup.

17. Caching

Stable geographic information should be cached aggressively.

Examples:

entity identity
hierarchy
aliases
reviewed geometry
descriptions

More dynamic information should use shorter cache lifetimes.

Examples:

active listings
pending listings
inventory
market snapshots

Caching strategy should reflect how frequently the underlying source changes.

18. Performance

Atlas is mobile-first.

Performance priorities include:

fast initial render
minimal blocking JavaScript
limited initial geography
WebGL layers instead of large numbers of DOM markers
progressive data loading
lazy loading of detailed workspace content
controlled animation

Visual richness should not come at the expense of responsiveness.

19. Deep Linking

Atlas should eventually support direct links to meaningful state.

Examples:

/atlas?entity=422

Later potentially:

/atlas?entity=422&view=market

or

/atlas?entity=422&view=listings

Deep links should restore Atlas context rather than redirect users into disconnected experiences.

20. Existing SearchPV Pages

Atlas does not require existing SearchPV pages to disappear.

During development and migration, Atlas may link to existing:

Search Properties
Market Intelligence
reports
development pages

Over time, selected capabilities may become native Atlas workspace views.

This transition should be gradual.

21. AI

AI is not a separate architecture.

AI is another controller of Atlas State.

Example:

User:

"Show me beachfront condos under $700k."

AI resolves the request.

↓

Atlas State updates.

↓

Map changes.

↓

Listings change.

↓

Workspace updates.

The AI should manipulate the same state and services available to normal user interactions.

22. Error and Data-Quality Handling

Atlas must degrade gracefully.

Examples:

No boundary:

Use centroid.

No centroid:

Show hierarchy/card without camera movement.

No market data:

Hide the market module.

No photography:

Use a neutral visual treatment.

No nearby data:

Do not present an empty nearby section.

Incomplete data should reduce functionality gracefully rather than break the experience.

23. Folder Structure

Initial structure:

src/app/components/atlas/
    AtlasShell.tsx
    AtlasViewport.tsx
    AtlasMap.tsx
    AtlasOverlay.tsx
    AtlasSearch.tsx
    AtlasBottomSheet.tsx

src/lib/atlas/
    state/
    services/
    controllers/
    types/

The structure should evolve only when additional complexity justifies it.

Avoid premature fragmentation.

24. Architectural Boundaries

Atlas should preserve these boundaries:

UI does not query the database directly.

Search does not manipulate Mapbox directly.

Mapbox does not define geographic identity.

Geometry does not define geographic identity.

Market Intelligence does not maintain its own geographic selection.

AI does not bypass Atlas State.

Components do not communicate through ad hoc cross-component callbacks when shared state is the appropriate mechanism.

25. Technical North Star

The technical architecture is successful when a new capability can be added without redesigning Atlas.

Examples:

Adding beaches should not require changing the state model.

Adding listings should not require redesigning the map.

Adding AI should not require replacing search.

Adding Nayarit boundaries should not require changing navigation.

Adding market analytics should not require changing entity identity.

Atlas should become more capable by extension, not reconstruction.


I’d make **Section 24 — Architectural Boundaries** especially important. That is the part we can come back to six months from now when something tempting seems expedient but would create a mess.

There’s also one technical decision I would *not* put in stone yet: **which React state library we use**. We know we need Atlas State, but we don’t need to decide today whether that means Zustand, React Context + reducer, or something else. `06 Technical Architecture.md` should specify the behavior and ownership rules first; the implementation choice can be recorded once we evaluate what Atlas actually needs.

And now that these six documents exist, I think we have enough written architecture. The sensible next move is to return to `/atlas` and implement the first piece from the roadmap: **Atlas State itself**, starting very small—selected entity, workspace view, and bottom-sheet position. 