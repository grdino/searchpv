CREATE SCHEMA IF NOT EXISTS geo;

CREATE  TABLE geo.entity_source_lu ( 
	entity_source_cd     text  NOT NULL  ,
	entity_source_nm     text  NOT NULL  ,
	entity_source_ds     text    ,
	CONSTRAINT source_lu_pk PRIMARY KEY ( entity_source_cd )
 );

COMMENT ON TABLE geo.entity_source_lu IS '_cd		_nm				-ds
MLS		MLS
ME		Manual Entry
GM		Google Maps
GE		Google Earth
INEGI	INEGI
OSM	OpenStreetMap';

CREATE  TABLE geo.entity_type_lu ( 
	entity_type_cd       text  NOT NULL  ,
	entity_type_nm       text    ,
	entity_type_ds       text    ,
	CONSTRAINT pk_entity_type_lu PRIMARY KEY ( entity_type_cd )
 );

COMMENT ON TABLE geo.entity_type_lu IS 'Defines the kinds of geographic entities that can exist in the geography model.
It answers the question: "What is this thing?"
Examples: Zone, Area, Community, Development, Building
_cd		_nm				_ds
ZN		Zone
AR		Area
CM		Community
DV		Development
BD		Building
NB		Neighborhood
PL		Place';

CREATE  TABLE geo.language_lu ( 
	language_cd          text  NOT NULL  ,
	language_nm          text    ,
	CONSTRAINT pk_language_lu PRIMARY KEY ( language_cd )
 );

COMMENT ON COLUMN geo.language_lu.language_cd IS 'EN
SP
FR';

COMMENT ON COLUMN geo.language_lu.language_nm IS 'English
Spanish
French';

CREATE  TABLE geo.relationship_type_lu ( 
	relationship_type_cd text  NOT NULL  ,
	relationship_type_nm text  NOT NULL  ,
	relationship_type_ds text    ,
	CONSTRAINT relationship_type_lu_pk PRIMARY KEY ( relationship_type_cd )
 );

COMMENT ON TABLE geo.relationship_type_lu IS '_cd	_nm				_ds
CB	Contained By	Immediate geographic parent
PO	Part Of			Immediate physical or organizational parent (Tower in development)';

CREATE  TABLE geo.variant_type_lu ( 
	variant_type_cd      text  NOT NULL  ,
	variant_type_nm      text  NOT NULL  ,
	variant_type_ds      text    ,
	CONSTRAINT name_type_lu_pk PRIMARY KEY ( variant_type_cd )
 );

COMMENT ON TABLE geo.variant_type_lu IS '_cd  _mn                  _ds
CA	Canonical	Official SearchPV name for a language. One active canonical name per entity and language.
ML	MLS			Name exactly as it appears in FlexMLS.
CO	Common		Commonly used local name.
AL	Alias		Alternate recognized name.
AB	Abbreviation	Shortened version of the name.
LE	Legacy		Historical name.
MS	Misspelling	Common misspelling retained for searching.';

CREATE  TABLE geo.entity ( 
	entity_ky            bigserial  NOT NULL  ,
	entity_identifier_cd text  NOT NULL  ,
	entity_type_cd       text  NOT NULL  ,
	longitude_nb         numeric(11,7)    ,
	latitude_nb          numeric(10,7)    ,
	entity_source_cd     text  NOT NULL  ,
	CONSTRAINT entity_ak1 UNIQUE ( entity_identifier_cd ) ,
	CONSTRAINT pk_entity PRIMARY KEY ( entity_ky )
 );

ALTER TABLE geo.entity ADD CONSTRAINT entity_identifier_not_blank_ck CHECK ( btrim(entity_identifier_cd) <> '' );

ALTER TABLE geo.entity ADD CONSTRAINT entity_lat_valid_ck CHECK ( latitude_nb IS NULL
OR latitude_nb BETWEEN -90 AND 90 );

ALTER TABLE geo.entity ADD CONSTRAINT entity_long_valid_ck CHECK ( longitude_nb IS NULL
OR longitude_nb BETWEEN -180 AND 180 );

CREATE INDEX entity_type_ix ON geo.entity  ( entity_type_cd );

COMMENT ON TABLE geo.entity IS 'Each row represents one specific geographic thing:

one zone
one area
one community
one development
one building
one neighborhood
one other named place

For example:

entity_id: 1042
entity_cd: DEV_SIERRA_DEL_MAR
entity_type_cd: DEVELOPMENT
canonical_name_tx: Sierra del Mar

Everything else in the model attaches to that row.

I''d write one paragraph in the design document:

An entity represents one unique geographic object.

Variants represent every accepted textual representation of that entity, including canonical names, MLS names, abbreviations, alternate spellings, legacy names, common names, and names in multiple languages.';

COMMENT ON COLUMN geo.entity.entity_ky IS 'The internal numeric identifier. This is the true identity of the entity inside SearchPV.
Example: 1042
Why it matters: names are not always unique. You could have two developments named Las Palmas
Their names may match, but their entity_id values will be different.';

COMMENT ON COLUMN geo.entity.entity_identifier_cd IS 'A stable, human-readable business cd. 
Example: SIERRA_DEL_MAR
Unlike entity_id, this code is meaningful to a person and may be useful in configuration files, ETL mappings, or APIs.
It should remain stable even if the canonical display name changes.';

COMMENT ON COLUMN geo.entity.entity_type_cd IS 'Defines what kind of entity this is.
It links to: entity_type_lu
Possible values include: ZONE, AREA, COMMUNITY, DEVELOPMENT, ...';

COMMENT ON COLUMN geo.entity.longitude_nb IS 'Longitude coordinate of the representative point for the entity, expressed
in decimal degrees using the WGS 84 coordinate system.

Valid values range from -180 to 180.

Positive values are east of the prime meridian. Negative values are west of
the prime meridian.

For a building, this normally represents the approximate center of the
building. For a larger geographic entity, it represents the selected
reference or center point.

Example: -105.225812';

COMMENT ON COLUMN geo.entity.latitude_nb IS 'Latitude coordinate of the representative point for the entity, expressed
in decimal degrees using the WGS 84 coordinate system.

Valid values range from -90 to 90.

Positive values are north of the equator. Negative values are south of the
equator.

For a building, this normally represents the approximate center of the
building. For a larger geographic entity, it represents the selected
reference or center point.

Example: 20.653421';

CREATE  TABLE geo.entity_relationship ( 
	entity_relationship_ky bigserial  NOT NULL  ,
	child_entity_ky      bigint  NOT NULL  ,
	relationship_type_cd text  NOT NULL  ,
	parent_entity_ky     bigint  NOT NULL  ,
	CONSTRAINT entity_relationship_ak1 UNIQUE ( child_entity_ky, parent_entity_ky, relationship_type_cd ) ,
	CONSTRAINT pk_entity_relationship PRIMARY KEY ( entity_relationship_ky )
 );

CREATE UNIQUE INDEX uq_entity_cb_parent
ON geo.entity_relationship (
    child_entity_ky,
    relationship_type_cd
)
WHERE relationship_type_cd = 'CB';

ALTER TABLE geo.entity_relationship ADD CONSTRAINT entity_relationship_no_self_ck CHECK ( child_entity_ky <> parent_entity_ky );

CREATE INDEX entity_relationship_child_ix ON geo.entity_relationship  ( child_entity_ky );

CREATE INDEX entity_relationship_parent_ix ON geo.entity_relationship  ( parent_entity_ky );

CREATE INDEX entity_relationship_type_ix ON geo.entity_relationship  ( relationship_type_cd );

COMMENT ON TABLE geo.entity_relationship IS 'Child	Relationship	Parent	
Amapas	Contained By	South Shore
The Reef	Contained By	Amapas	
Tower 1	Part Of		The Reef	

_ky	child_ky	relationship_cd	parent_ky	
1	200		CB				100
2	300		CB				200
3	400		PO				300';

CREATE  TABLE geo.entity_variant ( 
	entity_variant_ky    bigserial  NOT NULL  ,
	entity_ky            bigint  NOT NULL  ,
	variant_type_cd      text  NOT NULL  ,
	entity_variant_nm    text  NOT NULL  ,
	language_cd          text    ,
	CONSTRAINT pk_entity_variant PRIMARY KEY ( entity_variant_ky ),
	CONSTRAINT entity_variant_ak1 UNIQUE ( entity_ky, variant_type_cd, language_cd, entity_variant_nm ) 
 );

create unique index uq_entity_variant_canonical_language
    on geo.entity_variant (
        entity_ky,
        language_cd
    )
    where variant_type_cd = 'CA';

ALTER TABLE geo.entity_variant ADD CONSTRAINT entity_variant_not_blank_ck CHECK ( btrim(entity_variant_nm) <> '' );

CREATE INDEX entity_variant_entity_ix ON geo.entity_variant  ( entity_ky );

COMMENT ON TABLE geo.entity_variant IS 'Stores every name associated with an entity, (an ALIAS table) including:
alternate names, MLS spellings, abbreviations, historical names, common misspellings, names in different languages
One entity can have many rows in entity_name.
*This is where Sp/En is handled
1042	es	✓	Zona Romántica
1042	en	✓	Romantic Zone

I''d write one paragraph in the design document:

An entity represents one unique geographic object.

Variants represent every accepted textual representation of that entity, including canonical names, MLS names, abbreviations, alternate spellings, legacy names, common names, and names in multiple languages.';

COMMENT ON COLUMN geo.entity_variant.entity_variant_ky IS 'Unique identifier for this specific name record.';

COMMENT ON COLUMN geo.entity_variant.entity_ky IS 'dentifies the geographic entity that owns this name.
Foreign key to: geo.entity
Example: 
1042
Every name belongs to exactly one entity.';

COMMENT ON COLUMN geo.entity_variant.variant_type_cd IS 'Classifies what kind of name this is.
Foreign key to: variant_type_lu
Examples: CANONICAL, MLS, COMMON, ALIAS, ABBREVIATION, LEGACY, MISSPELLING';

COMMENT ON COLUMN geo.entity_variant.entity_variant_nm IS 'Stores the exact text of this name variant. This may be a canonical name, an alias, an MLS spelling, 
a historical name, an abbreviation, or another recognized form. Whether it is displayed by default 
depends on variant_type_cd, and the language requested.';

ALTER TABLE geo.entity ADD CONSTRAINT entity_type_cd FOREIGN KEY ( entity_type_cd ) REFERENCES geo.entity_type_lu( entity_type_cd );

ALTER TABLE geo.entity ADD CONSTRAINT fk_entity_entity_source_lu FOREIGN KEY ( entity_source_cd ) REFERENCES geo.entity_source_lu( entity_source_cd );

ALTER TABLE geo.entity_relationship ADD CONSTRAINT entity_relationship_child_fk FOREIGN KEY ( child_entity_ky ) REFERENCES geo.entity( entity_ky ) ON DELETE CASCADE;

ALTER TABLE geo.entity_relationship ADD CONSTRAINT entity_relationship_parent_fk FOREIGN KEY ( parent_entity_ky ) REFERENCES geo.entity( entity_ky ) ON DELETE CASCADE;

ALTER TABLE geo.entity_relationship ADD CONSTRAINT entity_relationship_type_fk FOREIGN KEY ( relationship_type_cd ) REFERENCES geo.relationship_type_lu( relationship_type_cd );

ALTER TABLE geo.entity_variant ADD CONSTRAINT entity_variant_entity_fk FOREIGN KEY ( entity_ky ) REFERENCES geo.entity( entity_ky ) ON DELETE CASCADE;

ALTER TABLE geo.entity_variant ADD CONSTRAINT entity_variant_type_fk FOREIGN KEY ( variant_type_cd ) REFERENCES geo.variant_type_lu( variant_type_cd );

ALTER TABLE geo.entity_variant ADD CONSTRAINT fk_entity_variant_language_lu FOREIGN KEY ( language_cd ) REFERENCES geo.language_lu( language_cd );

