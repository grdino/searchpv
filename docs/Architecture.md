# SearchPV Architecture

**Project:** SearchPV – Puerto Vallarta Market Intelligence

**Status:** Active Development

---

# Vision

SearchPV is a market intelligence platform for Puerto Vallarta and Riviera Nayarit.

It combines:

- MLS listing data
- Historical sales
- Geographic intelligence
- Market analytics
- AI-assisted search
- Development profiles

The long-term goal is to provide the most accurate, transparent, and data-driven real estate information available for the region.

---

# Design Principles

## Single Source of Truth

Every statistic originates from the warehouse.

AI never invents statistics.

---

## AI Uses Services

The AI does not query SQL directly.

Instead:

AI
↓

Service Layer

↓

Views / Functions

↓

Warehouse

---

## Domain Driven

The AI understands concepts such as:

- Property
- Geography
- Development
- Market
- Statistics

It does not understand database column names.

The service layer translates between the domain model and the warehouse.

---

## Geography First

All geographic understanding flows through the Geography Resolver.

Examples:

Old Town

↓

Emiliano Zapata

Romantic Zone

↓

Emiliano Zapata

Zona Romántica

↓

Emiliano Zapata

---

## Existing Reporting Comes First

Whenever possible:

AI reuses existing reporting views.

Duplicate SQL is avoided.

---

# Major Components

## Data Warehouse

Source:

FlexMLS

ETL

↓

dw schema

↓

public reporting views

---

## Geography

geo.entity

geo.entity_variant

geo.entity_relationship

↓

resolve_geography()

---

## Service Layer

src/lib/ask-searchpv/services/

Current services:

- Geography

Planned:

- Property Search
- Market Statistics
- Development
- Navigation

---

## AI Layer

Responsible only for:

- intent classification
- parameter extraction
- answer composition

Never business logic.

---

## UI Layer

The UI renders reusable response blocks.

Examples:

- Metric cards
- Listing tables
- History charts
- Development profiles

The UI never interprets warehouse data.

---

# Long-Term Goals

Future capabilities include:

- Saved searches
- Client dashboards
- Personalized alerts
- AI market reports
- Natural-language market explorer
- Voice interaction
- Multi-language support