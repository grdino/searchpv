03 Atlas State.md → How everything stays synchronized.

# Project Atlas
## Atlas State

---

## Purpose

Atlas State is the central nervous system of Atlas.

Every part of the application observes and responds to the same shared state.

Atlas State does not render anything.

It does not draw the map.

It does not query the database.

It simply answers one question:

> **What is Atlas currently exploring?**

Everything else reacts to that answer.

---

## The Single Source of Truth

There is only one Atlas State.

Every component reads from it.

No component should maintain its own understanding of:

- the selected place
- the selected property
- the current workspace
- the current camera target

This guarantees that every part of Atlas remains synchronized.

---

## Atlas Flow

Every interaction follows the same sequence.

User Action

↓

Resolve Intent

↓

Update Atlas State

↓

Components React

↓

Render Updated Experience

The user never manipulates components directly.

Components react to Atlas State.

---

## What Atlas State Represents

Atlas State describes the user's current exploration.

Conceptually it contains information such as:

Current Geographic Entity

Current Workspace

Current View

Camera Target

Bottom Sheet Position

Selection History

Search Context

The exact implementation may evolve over time, but the purpose remains constant.

---

## Canonical Entity

Every interaction ultimately resolves to a single canonical entity.

Examples:

Search:

"Romantic Zone"

↓

Canonical Entity

Community

Emiliano Zapata

Entity KY: 422

Map tap:

Community Polygon

↓

Entity KY: 422

AI Request:

"Show me Amapas."

↓

Entity KY: ####

Regardless of how the user arrives, Atlas State always stores the canonical entity.

Everything else is derived from it.

---

## Reactive Components

Every Atlas component watches Atlas State.

Examples:

Atlas Camera

Moves to the current entity.

Atlas Bottom Sheet

Displays information about the current entity.

Market Intelligence

Loads statistics for the current entity.

Nearby

Loads nearby places.

Listings

Loads properties for the current entity.

No component communicates directly with another.

Communication occurs through Atlas State.

---

## Camera

The camera is controlled exclusively through Atlas State.

UI components never manipulate the map directly.

Instead:

User selects entity

↓

Atlas State updates

↓

Camera Controller responds

↓

Map animates

This creates predictable behavior throughout the application.

---

## Workspace

The workspace represents the current context.

Examples:

Explore

Community

Development

Property

Market

Listings

Nearby

AI

Changing the workspace does not change the selected entity.

It changes how that entity is presented.

---

## Bottom Sheet

The bottom sheet is a presentation of Atlas State.

Its position is part of Atlas State.

Examples:

Collapsed

Half

Focused

Changing the sheet never changes the selected place.

It only changes how much information is visible.

---

## History

Atlas State may maintain navigation history.

This allows:

Back

Forward

Recent Places

Future deep-linking

The user should feel as though Atlas remembers where they have been.

---

## Synchronization

Every feature must remain synchronized through Atlas State.

Examples:

Search

↓

Camera

↓

Bottom Sheet

↓

Charts

↓

Listings

↓

Nearby

↓

AI

Every one of these responds to the same state.

None of them communicate directly with one another.

---

## What Atlas State Does NOT Do

Atlas State does not:

- perform database queries
- render UI
- perform animations
- calculate market statistics
- render polygons

Its responsibility is coordination.

Nothing more.

---

## Guiding Principle

Whenever a new feature is added, ask:

"Does this feature need to know what Atlas is currently exploring?"

If the answer is yes, it belongs in Atlas State.

If the answer is no, it belongs somewhere else.

---

## Architectural Goal

Atlas should always feel like one coherent application.

No matter how many capabilities are added—AI, listings, neighborhoods, developments, market intelligence, nearby places, or future tools—they all remain synchronized because they observe the same Atlas State.

The user experiences one conversation with one place.

Everything else is simply another view of that place.

# One More Concept

I think Atlas should distinguish between selection and focus.

For example:

Selection = "The user is exploring Amapas."
Focus = "The user is currently looking at Market Intelligence."

Those are different.

The selection doesn't change when they switch from Community to Listings to Nearby. Only the focus changes.

That distinction will make the application much easier to reason about as it grows.

I also think we've discovered something about Atlas over the last couple of days:

The map is not the center of Atlas.

The selected place is.

That's a subtle but profound difference. It means if you ever decide to add a list view, AI chat, immersive neighborhood pages, or even AR in the future, they're all simply different ways of interacting with the same selected place. The architecture stays intact because the geographic entity—not the map—is the heart of the system.