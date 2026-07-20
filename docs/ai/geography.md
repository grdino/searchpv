# SearchPV Geographic Resolution

## Purpose

Users may describe the same place using:

- Official MLS hierarchy names
- Spanish names
- English names
- Municipal colonias
- Development names
- Abbreviations
- Informal neighborhood names
- Historical names
- Misspellings

The geographic resolver converts those terms into one or more SearchPV
geographic entities.

## Authoritative Search Geography

The primary reporting hierarchy is:

Zone → Area → Community → Development

Every resolved geographic query must ultimately produce one or more approved
SearchPV geography IDs or property IDs.

## Resolution Types

A user term may resolve as:

1. Exact MLS entity
2. Alias of one MLS entity
3. Alias covering multiple MLS entities
4. Colonia cross-reference
5. Development
6. Polygon-based custom geography
7. Ambiguous term requiring user selection
8. Unsupported or unknown geography

## Examples

"Versalles"

May resolve to the SearchPV community for Versalles.

"Romantic Zone"

May resolve to the approved SearchPV geographic grouping representing the
commonly understood Romantic Zone.

"Zona Romántica"

Must resolve to the same approved grouping as "Romantic Zone."

"Old Town"

May be broader or more ambiguous than Romantic Zone. The resolver must use the
approved mapping and must not allow the language model to improvise boundaries.

"Marina"

May mean:

- Marina Vallarta community
- Marina Vallarta zone or area
- A specific marina development
- Properties with marina views

The resolver should use context or return ranked candidates.