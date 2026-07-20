# SearchPV Business Rules

## Inventory

Active and pending listings represent inventory as of a snapshot date.

Pending reporting is currently snapshot-based. A pending listing's presence in
a snapshot does not establish the exact date it became pending unless a valid
pending date exists.

## Closed Sales

Closed sales must use the recorded sold date.

Closed-sale price analysis uses `sold_price_usd`.

The following percentages are distinct:

- Sold-to-list percentage:
  sold price divided by final list price.
- Sold-versus-list percentage:
  percentage difference between sold price and final list price.
- Sold-versus-original percentage:
  percentage difference between sold price and original list price.

These measures must never be labeled interchangeably.

## Agent Participation

A transaction may contain:

- Listing agent
- Listing co-agent
- Selling agent
- Selling co-agent

An agent representing both sides appears in both participation roles.

Volume may be presented as:

- Full-side volume
- Split-side volume
- Transaction volume

The response must identify which method is used.

## Property Types

SearchPV property types may include:

- Condos
- Houses
- Land
- Commercial
- Multi-Family
- Business
- Fractional

Some existing analytics are residential-only. A capability must explicitly
state which property types it supports.

## Geographic Hierarchy

The authoritative MLS hierarchy is:

Zone → Area → Community → Development

User-facing geographic terms may refer to an MLS geography, a colonia, a group
of MLS geographies, or an informal market name. These terms must be resolved
through the SearchPV geographic resolver.