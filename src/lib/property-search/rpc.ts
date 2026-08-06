import type { PropertySearchFilters } from "./filters";

export function buildFilteredSnapshotRpcParams(
  groupLevel: "summary" | "area" | "community" | "development",
  filters: PropertySearchFilters
) {
  return {
    p_group_level: groupLevel,

    p_market_segment: filters.market,
    p_property_type_segment: filters.propertyType,

    p_zone_name: filters.zone,
    p_area_name: filters.area,
    p_community_name: filters.community,
    p_development_name: filters.development,

    p_min_beds: filters.minBeds,
    p_max_beds: filters.maxBeds,

    p_min_baths: filters.minBaths,
    p_max_baths: filters.maxBaths,

    p_min_price: filters.minPrice,
    p_max_price: filters.maxPrice,

    p_waterfront: filters.waterfront,
    p_ocean_view: filters.oceanView,
    p_pet_friendly: filters.petFriendly,
    p_pool: filters.pool,
    p_parking: filters.parking,
    p_furnished: filters.furnished,

    p_min_hoa_mxn: filters.minHoa,
    p_max_hoa_mxn: filters.maxHoa,
  };
}
