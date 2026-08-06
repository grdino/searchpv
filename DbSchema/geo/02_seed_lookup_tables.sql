BEGIN;

-- ============================================================
-- Entity types
-- ============================================================

INSERT INTO geo.entity_type_lu (
    entity_type_cd,
    entity_type_nm,
    entity_type_ds
)
VALUES
    ('ZN', 'Zone',         'Top-level MLS geographic zone.'),
    ('AR', 'Area',         'MLS area contained within a zone.'),
    ('CM', 'Community',    'MLS community contained within an area.'),
    ('DV', 'Development',  'Named real estate development or condominium complex.'),
    ('BD', 'Building',     'Individual building or tower within a development.'),
    ('NB', 'Neighborhood', 'Named neighborhood or colonia outside or alongside the MLS hierarchy.'),
    ('PL', 'Place',        'Other named geographic place or point of interest.')
ON CONFLICT (entity_type_cd)
DO UPDATE SET
    entity_type_nm = EXCLUDED.entity_type_nm,
    entity_type_ds = EXCLUDED.entity_type_ds;


-- ============================================================
-- Entity sources
-- ============================================================

INSERT INTO geo.entity_source_lu (
    entity_source_cd,
    entity_source_nm,
    entity_source_ds
)
VALUES
    ('MLS',   'MLS',            'Entity derived from FlexMLS property data.'),
    ('ME',    'Manual Entry',   'Entity created or maintained manually by SearchPV.'),
    ('GM',    'Google Maps',    'Entity or representative coordinates derived from Google Maps.'),
    ('GE',    'Google Earth',   'Entity or representative coordinates derived from Google Earth.'),
    ('INEGI', 'INEGI',          'Entity derived from Mexico''s national geographic and statistical authority.'),
    ('OSM',   'OpenStreetMap',  'Entity derived from OpenStreetMap data.')
ON CONFLICT (entity_source_cd)
DO UPDATE SET
    entity_source_nm = EXCLUDED.entity_source_nm,
    entity_source_ds = EXCLUDED.entity_source_ds;


-- ============================================================
-- Relationship types
-- ============================================================

INSERT INTO geo.relationship_type_lu (
    relationship_type_cd,
    relationship_type_nm,
    relationship_type_ds
)
VALUES
    ('CB', 'Contained By', 'Immediate geographic parent relationship.'),
    ('PO', 'Part Of',      'Immediate physical or organizational parent relationship, such as a building within a development.')
ON CONFLICT (relationship_type_cd)
DO UPDATE SET
    relationship_type_nm = EXCLUDED.relationship_type_nm,
    relationship_type_ds = EXCLUDED.relationship_type_ds;


-- ============================================================
-- Variant types
-- ============================================================

INSERT INTO geo.variant_type_lu (
    variant_type_cd,
    variant_type_nm,
    variant_type_ds
)
VALUES
    ('CA', 'Canonical',    'Official SearchPV name for an entity and language.'),
    ('ML', 'MLS',          'Name exactly as it appears in FlexMLS.'),
    ('CO', 'Common',       'Commonly used local name.'),
    ('AL', 'Alias',        'Alternate recognized name.'),
    ('AB', 'Abbreviation', 'Shortened form of a name.'),
    ('LE', 'Legacy',       'Historical or former name.'),
    ('MS', 'Misspelling',  'Common misspelling retained for search matching.')
ON CONFLICT (variant_type_cd)
DO UPDATE SET
    variant_type_nm = EXCLUDED.variant_type_nm,
    variant_type_ds = EXCLUDED.variant_type_ds;


-- ============================================================
-- Languages
-- ============================================================

INSERT INTO geo.language_lu (
    language_cd,
    language_nm
)
VALUES
    ('EN', 'English'),
    ('ES', 'Spanish'),
    ('FR', 'French')
ON CONFLICT (language_cd)
DO UPDATE SET
    language_nm = EXCLUDED.language_nm;

COMMIT;