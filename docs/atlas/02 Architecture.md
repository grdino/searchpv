02 Architecture.md → How it's organized.

# Project Atlas
"Atlas is not a collection of pages. It is a geographic operating system for exploring Puerto Vallarta."

## Architecture

---

## Overview

Atlas is organized as a collection of independent systems that communicate through a single shared state.

No component owns the application.

Each component has a single responsibility.

The map renders geography.

The overlay presents information.

The Atlas State coordinates everything.

---

## Architectural Principles

Atlas follows five core principles.

### 1. Geography is the Foundation

Every interaction begins with a geographic entity.

Users may arrive through:

- Search
- Map
- AI
- Listings
- Market Intelligence

Regardless of how they arrive, Atlas always resolves the interaction to a single canonical geographic entity.

---

### 2. Atlas State is the Single Source of Truth

Every component reads from the same Atlas State.

No component should maintain its own version of the currently selected place.

Atlas State coordinates:

- current entity
- camera
- workspace
- bottom sheet
- active view

---

### 3. The Map is a View

The map is not the application.

The map is one visualization of Atlas State.

Removing the map should not fundamentally change the architecture.

Future interfaces could present the same information without a map.

---

### 4. UI Layers are Independent

Atlas separates rendering into independent layers.

Map Layer

- Mapbox
- polygons
- markers
- overlays

Overlay Layer

- search
- bottom sheet
- floating controls
- dialogs

Workspace Layer

- community information
- listings
- market intelligence
- AI
- nearby places

Each layer communicates only through Atlas State.

---

### 5. Components Have One Responsibility

Components should remain small.

A component should have one clear purpose.

Examples:

AtlasViewport

Responsible only for displaying geography.

AtlasSearch

Responsible only for selecting places.

AtlasBottomSheet

Responsible only for presenting workspace content.

AtlasMap

Responsible only for rendering Mapbox.

No component should become responsible for unrelated behavior.

---

## Entity-Centric Design

Atlas is built around canonical geographic entities.

Every entity has a unique identifier.

Examples include:

- Zone
- Area
- Community
- Development
- Beach
- Point of Interest

Everything ultimately references the same entity model.

---

## Navigation

Atlas minimizes traditional page navigation.

Instead of changing pages, Atlas changes context.

The map remains active while the workspace changes.

Navigation is driven by:

Current Entity

↓

Current Workspace

↓

Current View

---

## Progressive Geography

Geographic data improves continuously.

Some entities may have:

- complete boundaries
- provisional boundaries
- centroid only
- no geometry

Atlas must function correctly regardless of geographic completeness.

Geometry enhances the experience but never defines it.

---

## Extensibility

Every new Atlas feature should answer one question:

"What existing component does this belong to?"

If the answer is "none," reconsider the design before creating another major system.

Atlas should grow through extension rather than duplication.

---

## Architectural Goal

The architecture should allow new capabilities to be added without requiring significant changes to existing components.

Future additions should feel like new tools added to the same workspace rather than entirely new applications.


There is one thing I would add that I think is unique to SearchPV

Most software architectures talk about components.

I think Atlas should talk about flows.

    For example:

    User

    ↓

    Intent

    ↓

    Atlas State

    ↓

    Services

    ↓

    UI

    ↓

    User

That is how every feature should work.

    Example:

    Tap Amapas

    ↓

    Resolve entity

    ↓

    Update Atlas State

    ↓

    Camera moves

    ↓

    Bottom sheet updates

    ↓

    Nearby loads

    ↓

    Market snapshot loads

    Everything follows the same pipeline.

    No shortcuts.

    No exceptions.