export type LookupOption = {
  code: string;
  name: string | null;
};

export type GeographyLookupData = {
  entity_types: LookupOption[];
  entity_sources: LookupOption[];
  variant_types: LookupOption[];
  languages: LookupOption[];
};

export type GeographySummaryRow = {
  entity_type_cd: string;
  entity_type_nm: string | null;
  entity_ct: number;
  missing_coordinate_ct: number;
  missing_parent_ct: number;
};

export type GeographyEntityListRow = {
  entity_ky: number;
  entity_identifier_cd: string;
  entity_type_cd: string;
  entity_type_nm: string | null;
  canonical_nm: string;
  entity_source_cd: string;
  longitude_nb: number | null;
  latitude_nb: number | null;
  parent_entity_ky: number | null;
  parent_nm: string | null;
  variant_ct: number;
  child_ct: number;
};

export type GeographyEntityRecord = {
  entity_ky: number;
  entity_identifier_cd: string;
  entity_type_cd: string;
  longitude_nb: number | null;
  latitude_nb: number | null;
  entity_source_cd: string;
};

export type GeographyCanonical = {
  entity_variant_ky: number;
  entity_variant_nm: string;
  language_cd: string | null;
};

export type GeographyVariant = {
  entity_variant_ky: number;
  variant_type_cd: string;
  variant_type_nm: string | null;
  entity_variant_nm: string;
  language_cd: string | null;
};

export type GeographyParent = {
  entity_ky: number;
  entity_identifier_cd: string;
  entity_type_cd: string;
  canonical_nm: string;
};

export type GeographyEntityDetail = {
  entity: GeographyEntityRecord | null;
  canonical: GeographyCanonical | null;
  variants: GeographyVariant[];
  parent: GeographyParent | null;
  child_count: number;
};

export type GeographyParentOption = {
  entity_ky: number;
  entity_identifier_cd: string;
  entity_type_cd: string;
  canonical_nm: string;
};
