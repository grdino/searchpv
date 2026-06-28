/*
SearchPV Gold Standard Development Profile
Development: EVA
Location: Emiliano Zapata, Centro South, Puerto Vallarta

Review before publishing. This is intended as the first curated profile example.
*/

insert into app.development_profile (
    zone_slug,
    area_slug,
    community_slug,
    development_slug,
    development_name,

    official_name,
    profile_title,
    overview,
    building_facts,
    location_description,
    lifestyle,
    buyer_notes,
    investor_notes,

    address,
    neighborhood_label,
    property_type,
    developer,
    website,

    parking,
    pet_policy,
    rental_policy,
    views,

    has_pool,
    has_gym,
    has_security,
    has_elevator,
    has_parking,
    has_rooftop,
    has_jacuzzi,
    has_bbq,
    has_concierge,
    has_coworking,
    has_steam_room,
    has_sauna,
    has_spa,
    has_storage,
    has_lockoff_units,
    has_lobby,
    has_restaurant_retail,

    nearby_summary,
    nearby_restaurants_count,
    nearby_bars_count,
    nearby_galleries_count,
    nearby_cafes_count,
    nearby_beach_minutes,
    nearby_grocery_minutes,
    nearby_notes,

    seo_title,
    seo_description,
    seo_keywords,

    source_urls,
    source_notes,
    profile_status,
    content_status,
    last_reviewed
)
values (
    'puerto-vallarta',
    'centro-south',
    'emiliano-zapata',
    'eva',
    'EVA',

    'EVA Puerto Vallarta',
    'About EVA Puerto Vallarta',

    'EVA is a contemporary condominium development in Emiliano Zapata, near Puerto Vallarta''s Romantic Zone. Its location on Basilio Badillo places it close to restaurants, cafés, galleries, nightlife, and Los Muertos Beach, while still sitting within one of the city''s most active residential and vacation-home markets.

The project is positioned for buyers who want newer construction, walkability, and access to the day-to-day conveniences of central Puerto Vallarta. Based on available public materials, EVA includes a mix of one-, two-, and three-bedroom residences, with selected floor plans designed around lock-off configurations that may appeal to vacation owners and rental-oriented buyers.',

    'Public marketing materials describe EVA as a modern condominium development with one-, two-, and three-bedroom residences. Selected two- and three-bedroom layouts include lock-off configurations, allowing portions of a residence to function more independently depending on ownership and rental strategy. Unit counts and final building details should be verified against condominium documents and current developer or administrator records.',

    'EVA is located on Basilio Badillo in Colonia Emiliano Zapata, at the edge of Puerto Vallarta''s Romantic Zone. This is one of the city''s most walkable areas, with restaurants, cafés, galleries, shops, entertainment, and beach access nearby. For buyers who prefer to spend less time driving, the location is one of EVA''s main advantages.',

    'EVA is likely to appeal to buyers who want a newer building in a highly walkable part of Puerto Vallarta. The location may suit full-time residents, seasonal owners, vacation homeowners, and buyers who want convenient access to restaurants, nightlife, and beach-oriented activities without being isolated from local services.',

    'Buyers should review the specific unit orientation, view corridor, parking situation, storage availability, HOA budget, and rental rules before comparing EVA units. As with many central Puerto Vallarta developments, individual unit value may vary meaningfully based on floor level, layout, lock-off configuration, outdoor space, and exposure to street or neighborhood activity.',

    'EVA''s walkable location and lock-off-oriented floor plans may be attractive to rental-focused buyers, but rental performance should be evaluated carefully. Buyers should confirm current building rules, platform restrictions, HOA policies, management options, operating costs, and tax implications before relying on rental income assumptions.',

    'Basilio Badillo 378, Emiliano Zapata, Puerto Vallarta, Jalisco',
    'Emiliano Zapata / Romantic Zone',
    'Condominium',
    'Grupo Gova and Beat Developments',
    'https://evapv.com/',

    null,
    null,
    'Verify current building and HOA rental rules before purchase.',
    'Bay, city, mountain, and neighborhood views may vary by unit and floor.',

    true,
    true,
    null,
    null,
    null,
    true,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    true,
    true,
    true,

    'EVA sits in one of Puerto Vallarta''s most walkable restaurant and nightlife corridors. Detailed nearby counts will be added as the SearchPV location database is expanded.',
    null,
    null,
    null,
    null,
    null,
    null,
    'Nearby counts are pending GIS/place-data enrichment. Until verified, SearchPV should avoid displaying exact counts for restaurants, bars, cafés, galleries, or beach walking time.',

    'EVA Puerto Vallarta Market Report | SearchPV',
    'Explore EVA Puerto Vallarta with live inventory, pending listings, 12-month sales, pricing, market insight, and a curated development profile from SearchPV.',
    'EVA Puerto Vallarta, EVA condos, Emiliano Zapata condos, Romantic Zone condos, Puerto Vallarta market report, SearchPV',

    array[
        'https://evapv.com/',
        'https://evapv.com/wp-content/uploads/2023/12/EVA-Profile-Sheet-ENG.pdf',
        'https://realestate.mexicoinsider.mx/property/eva-3-br-b2/',
        'https://www.condominiumsinpuertovallarta.com/property/eva-40/',
        'https://mexlife.com/wp-content/uploads/2023/06/EVA-Features-and-Finishes-1.0.pdf'
    ],
    'First SearchPV gold-standard draft. Public sources differ on final unit count, so residences/units were intentionally left blank pending verification.',
    'draft',
    'needs_review',
    now()
)
on conflict (zone_slug, area_slug, community_slug, development_slug)
do update set
    development_name = excluded.development_name,
    official_name = excluded.official_name,
    profile_title = excluded.profile_title,
    overview = excluded.overview,
    building_facts = excluded.building_facts,
    location_description = excluded.location_description,
    lifestyle = excluded.lifestyle,
    buyer_notes = excluded.buyer_notes,
    investor_notes = excluded.investor_notes,
    address = excluded.address,
    neighborhood_label = excluded.neighborhood_label,
    property_type = excluded.property_type,
    developer = excluded.developer,
    website = excluded.website,
    parking = excluded.parking,
    pet_policy = excluded.pet_policy,
    rental_policy = excluded.rental_policy,
    views = excluded.views,
    has_pool = excluded.has_pool,
    has_gym = excluded.has_gym,
    has_security = excluded.has_security,
    has_elevator = excluded.has_elevator,
    has_parking = excluded.has_parking,
    has_rooftop = excluded.has_rooftop,
    has_jacuzzi = excluded.has_jacuzzi,
    has_bbq = excluded.has_bbq,
    has_concierge = excluded.has_concierge,
    has_coworking = excluded.has_coworking,
    has_steam_room = excluded.has_steam_room,
    has_sauna = excluded.has_sauna,
    has_spa = excluded.has_spa,
    has_storage = excluded.has_storage,
    has_lockoff_units = excluded.has_lockoff_units,
    has_lobby = excluded.has_lobby,
    has_restaurant_retail = excluded.has_restaurant_retail,
    nearby_summary = excluded.nearby_summary,
    nearby_restaurants_count = excluded.nearby_restaurants_count,
    nearby_bars_count = excluded.nearby_bars_count,
    nearby_galleries_count = excluded.nearby_galleries_count,
    nearby_cafes_count = excluded.nearby_cafes_count,
    nearby_beach_minutes = excluded.nearby_beach_minutes,
    nearby_grocery_minutes = excluded.nearby_grocery_minutes,
    nearby_notes = excluded.nearby_notes,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    seo_keywords = excluded.seo_keywords,
    source_urls = excluded.source_urls,
    source_notes = excluded.source_notes,
    profile_status = excluded.profile_status,
    content_status = excluded.content_status,
    last_reviewed = excluded.last_reviewed,
    last_updated = now();
