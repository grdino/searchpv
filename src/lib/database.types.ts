export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_listing: {
        Row: {
          address: string | null
          area_name: string | null
          baths: number | null
          beds: number | null
          bldng_ds: string | null
          community_name: string | null
          current_price: number | null
          data_current_as_of: string | null
          development: string | null
          development_name: string | null
          dom: number | null
          flr_nb: string | null
          invntry_snap_date_ky: number | null
          invntry_snap_ky: number | null
          lat_nb: number | null
          load_dt: string | null
          long_nb: number | null
          lot_sqft: number | null
          lot_sqm: number | null
          lstng_agncy_ds: string | null
          lstng_agnt_nm: string | null
          lstng_co_agnt_nm: string | null
          lstng_ky: number | null
          market_type: string | null
          mls: number | null
          original_price: number | null
          price_change_amount: number | null
          price_change_percent: number | null
          price_changes: number | null
          price_per_sqft: number | null
          price_per_sqm: number | null
          prmy_view_nm: string | null
          prprty_fngrprnt_id: string | null
          prprty_ky: number | null
          prprty_type: string | null
          prprty_type_cd: string | null
          scndry_view_nm: string | null
          sqft: number | null
          sqm: number | null
          tax_id: string | null
          unit_id: string | null
          year_blt_dt: number | null
          zone_name: string | null
        }
        Relationships: []
      }
      area_listing_drilldown: {
        Row: {
          area_name: string | null
          area_slug: string | null
          bedroom_segment: string | null
          listing_count: number | null
          listing_ids: string | null
          market_segment: string | null
          metric_group: string | null
          property_type_segment: string | null
          zone_name: string | null
          zone_slug: string | null
        }
        Relationships: []
      }
      area_snapshot: {
        Row: {
          active_0br: number | null
          active_1br: number | null
          active_2br: number | null
          active_3br_plus: number | null
          active_count: number | null
          area_name: string | null
          area_slug: string | null
          avg_list_price: number | null
          avg_list_price_ft2: number | null
          avg_sold_price: number | null
          avg_sold_price_ft2: number | null
          avg_sold_price_ft2_0br: number | null
          avg_sold_price_ft2_1br: number | null
          avg_sold_price_ft2_2br: number | null
          avg_sold_price_ft2_3br_plus: number | null
          community_count: number | null
          current_avg_dom: number | null
          market_segment: string | null
          median_list_price: number | null
          median_sold_price: number | null
          median_sold_price_0br: number | null
          median_sold_price_1br: number | null
          median_sold_price_2br: number | null
          median_sold_price_3br_plus: number | null
          months_inventory: number | null
          months_inventory_0br: number | null
          months_inventory_1br: number | null
          months_inventory_2br: number | null
          months_inventory_3br_plus: number | null
          pending_0br: number | null
          pending_1br: number | null
          pending_2br: number | null
          pending_3br_plus: number | null
          pending_count: number | null
          property_type_segment: string | null
          sales_0br_12mo: number | null
          sales_12mo: number | null
          sales_1br_12mo: number | null
          sales_2br_12mo: number | null
          sales_3br_plus_12mo: number | null
          sales_period_end: string | null
          sales_period_start: string | null
          snapshot_date: string | null
          sold_avg_dom_12mo: number | null
          zone_name: string | null
          zone_slug: string | null
        }
        Relationships: []
      }
      closed_listing: {
        Row: {
          address: string | null
          area_name: string | null
          baths: number | null
          bedroom_segment: string | null
          beds: number | null
          clsd_sale_ky: number | null
          community_active_count: number | null
          community_bedroom_median_sold_price: number | null
          community_bedroom_median_sold_price_sqft: number | null
          community_bedroom_months_inventory: number | null
          community_median_sold_price: number | null
          community_median_sold_price_sqft: number | null
          community_months_inventory: number | null
          community_name: string | null
          community_pending_count: number | null
          community_sales_12mo: number | null
          data_current_as_of: string | null
          days_on_market: number | null
          development_active_count: number | null
          development_median_sold_price: number | null
          development_median_sold_price_sqft: number | null
          development_months_inventory: number | null
          development_name: string | null
          development_pending_count: number | null
          development_sales_12mo: number | null
          discount_from_final_list: number | null
          discount_from_final_list_pct: number | null
          discount_from_original_list: number | null
          discount_from_original_list_pct: number | null
          final_list_price: number | null
          lstng_ky: number | null
          market_sales_period_end: string | null
          market_sales_period_start: string | null
          market_segment: string | null
          market_snapshot_date: string | null
          mls: number | null
          original_list_price: number | null
          pre_construction: boolean | null
          property_type_segment: string | null
          prprty_ky: number | null
          prprty_type: string | null
          prprty_type_cd: string | null
          sold_date: string | null
          sold_date_ky: number | null
          sold_minus_final_list: number | null
          sold_minus_original_list: number | null
          sold_price: number | null
          sold_price_per_sqft: number | null
          sold_price_per_sqm: number | null
          sold_price_sqft_vs_community_median_pct: number | null
          sold_price_sqft_vs_development_median_pct: number | null
          sold_price_vs_bedroom_median_pct: number | null
          sold_price_vs_community_median_pct: number | null
          sold_price_vs_development_median_pct: number | null
          sold_to_final_list_pct: number | null
          sold_to_final_list_ratio: number | null
          sold_to_original_list_pct: number | null
          sold_to_original_list_ratio: number | null
          sqft: number | null
          sqm: number | null
          zone_name: string | null
        }
        Relationships: []
      }
      closed_listing_detail: {
        Row: {
          address: string | null
          area_name: string | null
          baths: number | null
          bedroom_segment: string | null
          beds: number | null
          clsd_sale_ky: number | null
          community_active_count: number | null
          community_bedroom_median_sold_price: number | null
          community_bedroom_median_sold_price_sqft: number | null
          community_bedroom_months_inventory: number | null
          community_median_sold_price: number | null
          community_median_sold_price_sqft: number | null
          community_months_inventory: number | null
          community_name: string | null
          community_pending_count: number | null
          community_sales_12mo: number | null
          data_current_as_of: string | null
          days_on_market: number | null
          development_active_count: number | null
          development_median_sold_price: number | null
          development_median_sold_price_sqft: number | null
          development_months_inventory: number | null
          development_name: string | null
          development_pending_count: number | null
          development_sales_12mo: number | null
          discount_from_final_list: number | null
          discount_from_final_list_pct: number | null
          discount_from_original_list: number | null
          discount_from_original_list_pct: number | null
          final_list_price: number | null
          lstng_ky: number | null
          market_sales_period_end: string | null
          market_sales_period_start: string | null
          market_segment: string | null
          market_snapshot_date: string | null
          mls: number | null
          original_list_price: number | null
          pre_construction: boolean | null
          property_type_segment: string | null
          prprty_ky: number | null
          prprty_type: string | null
          prprty_type_cd: string | null
          sold_date: string | null
          sold_date_ky: number | null
          sold_price: number | null
          sold_price_per_sqft: number | null
          sold_price_per_sqm: number | null
          sold_price_sqft_vs_community_median_pct: number | null
          sold_price_sqft_vs_development_median_pct: number | null
          sold_price_vs_bedroom_median_pct: number | null
          sold_price_vs_community_median_pct: number | null
          sold_price_vs_development_median_pct: number | null
          sold_to_final_list_pct: number | null
          sold_to_original_list_pct: number | null
          sqft: number | null
          sqm: number | null
          unit: string | null
          zone_name: string | null
        }
        Relationships: []
      }
      closed_listing_list: {
        Row: {
          address: string | null
          area_name: string | null
          baths: number | null
          bedroom_segment: string | null
          beds: number | null
          clsd_sale_ky: number | null
          community_name: string | null
          data_current_as_of: string | null
          days_on_market: number | null
          development_name: string | null
          final_list_price: number | null
          lstng_ky: number | null
          market_segment: string | null
          mls: number | null
          original_list_price: number | null
          pre_construction: boolean | null
          property_type_segment: string | null
          prprty_ky: number | null
          prprty_type: string | null
          prprty_type_cd: string | null
          sold_date: string | null
          sold_date_ky: number | null
          sold_price: number | null
          sold_price_per_sqft: number | null
          sold_price_per_sqm: number | null
          sold_to_final_list_pct: number | null
          sold_to_original_list_pct: number | null
          sqft: number | null
          sqm: number | null
          unit: string | null
          zone_name: string | null
        }
        Relationships: []
      }
      closed_sales_mls_list: {
        Row: {
          address: string | null
          area_name: string | null
          beds: number | null
          building: string | null
          clsd_sale_ky: number | null
          community_name: string | null
          development: string | null
          dom: number | null
          floor: string | null
          ft2: number | null
          full_baths: number | null
          half_baths: number | null
          latitude: number | null
          list_price: number | null
          longitude: number | null
          lot_ft2: number | null
          lot_m2: number | null
          lstng_ky: number | null
          m2: number | null
          mls: string | null
          orig_price: number | null
          pre_construction: boolean | null
          primary_view: string | null
          property_type: string | null
          prprty_fngrprnt_id: string | null
          prprty_ky: number | null
          secondary_view: string | null
          sold_date: string | null
          sold_date_ky: number | null
          sold_month: number | null
          sold_month_abbr: string | null
          sold_month_name: string | null
          sold_price: number | null
          sold_price_ft2: number | null
          sold_price_m2: number | null
          sold_quarter: number | null
          sold_year: number | null
          sold_year_month: string | null
          unit: string | null
          year_built: number | null
          zone_name: string | null
        }
        Relationships: []
      }
      community_listing_drilldown: {
        Row: {
          area_name: string | null
          area_slug: string | null
          bedroom_segment: string | null
          community_name: string | null
          community_slug: string | null
          listing_count: number | null
          listing_ids: string | null
          market_segment: string | null
          metric_group: string | null
          property_type_segment: string | null
          zone_name: string | null
          zone_slug: string | null
        }
        Relationships: []
      }
      community_snapshot: {
        Row: {
          active_0br: number | null
          active_1br: number | null
          active_2br: number | null
          active_3br_plus: number | null
          active_count: number | null
          area_name: string | null
          area_slug: string | null
          avg_list_price: number | null
          avg_list_price_ft2: number | null
          avg_list_price_m2: number | null
          avg_sold_price: number | null
          avg_sold_price_0br: number | null
          avg_sold_price_1br: number | null
          avg_sold_price_2br: number | null
          avg_sold_price_3br_plus: number | null
          avg_sold_price_ft2: number | null
          avg_sold_price_ft2_0br: number | null
          avg_sold_price_ft2_1br: number | null
          avg_sold_price_ft2_2br: number | null
          avg_sold_price_ft2_3br_plus: number | null
          avg_sold_price_m2: number | null
          avg_sold_price_m2_0br: number | null
          avg_sold_price_m2_1br: number | null
          avg_sold_price_m2_2br: number | null
          avg_sold_price_m2_3br_plus: number | null
          community_name: string | null
          community_slug: string | null
          current_avg_dom: number | null
          market_segment: string | null
          median_list_price: number | null
          median_sold_price: number | null
          median_sold_price_0br: number | null
          median_sold_price_1br: number | null
          median_sold_price_2br: number | null
          median_sold_price_3br_plus: number | null
          median_sold_price_ft2: number | null
          median_sold_price_ft2_0br: number | null
          median_sold_price_ft2_1br: number | null
          median_sold_price_ft2_2br: number | null
          median_sold_price_ft2_3br_plus: number | null
          median_sold_price_m2: number | null
          median_sold_price_m2_0br: number | null
          median_sold_price_m2_1br: number | null
          median_sold_price_m2_2br: number | null
          median_sold_price_m2_3br_plus: number | null
          months_inventory: number | null
          months_inventory_0br: number | null
          months_inventory_1br: number | null
          months_inventory_2br: number | null
          months_inventory_3br_plus: number | null
          pending_0br: number | null
          pending_1br: number | null
          pending_2br: number | null
          pending_3br_plus: number | null
          pending_count: number | null
          property_type_segment: string | null
          sales_0br_12mo: number | null
          sales_12mo: number | null
          sales_1br_12mo: number | null
          sales_2br_12mo: number | null
          sales_3br_plus_12mo: number | null
          sales_period_end: string | null
          sales_period_start: string | null
          snapshot_date: string | null
          sold_avg_dom_12mo: number | null
          zone_name: string | null
          zone_slug: string | null
        }
        Relationships: []
      }
      development_listing_drilldown: {
        Row: {
          area_name: string | null
          area_slug: string | null
          bedroom_segment: string | null
          community_name: string | null
          community_slug: string | null
          development_name: string | null
          development_slug: string | null
          listing_count: number | null
          listing_ids: string | null
          market_segment: string | null
          metric_group: string | null
          property_type_segment: string | null
          zone_name: string | null
          zone_slug: string | null
        }
        Relationships: []
      }
      development_nearby: {
        Row: {
          area_slug: string | null
          community_slug: string | null
          development_nearby_ky: number | null
          development_slug: string | null
          display_order: number | null
          distance_m: number | null
          is_highlight: boolean | null
          last_refreshed_at: string | null
          place_category: string | null
          place_ky: number | null
          place_name: string | null
          source: string | null
          walk_minutes: number | null
          why_it_matters: string | null
          zone_slug: string | null
        }
        Insert: {
          area_slug?: string | null
          community_slug?: string | null
          development_nearby_ky?: number | null
          development_slug?: string | null
          display_order?: number | null
          distance_m?: number | null
          is_highlight?: boolean | null
          last_refreshed_at?: string | null
          place_category?: string | null
          place_ky?: number | null
          place_name?: string | null
          source?: string | null
          walk_minutes?: number | null
          why_it_matters?: string | null
          zone_slug?: string | null
        }
        Update: {
          area_slug?: string | null
          community_slug?: string | null
          development_nearby_ky?: number | null
          development_slug?: string | null
          display_order?: number | null
          distance_m?: number | null
          is_highlight?: boolean | null
          last_refreshed_at?: string | null
          place_category?: string | null
          place_ky?: number | null
          place_name?: string | null
          source?: string | null
          walk_minutes?: number | null
          why_it_matters?: string | null
          zone_slug?: string | null
        }
        Relationships: []
      }
      development_nearby_rollup: {
        Row: {
          area_slug: string | null
          bar_count: number | null
          cafe_count: number | null
          community_slug: string | null
          development_nearby_rollup_ky: number | null
          development_slug: string | null
          gallery_count: number | null
          grocery_count: number | null
          gym_count: number | null
          last_refreshed_at: string | null
          lifestyle_summary: string | null
          nearest_beach_m: number | null
          nearest_grocery_m: number | null
          nearest_hospital_urgent_care_m: number | null
          nearest_pharmacy_m: number | null
          park_count: number | null
          pharmacy_count: number | null
          restaurant_count: number | null
          walkability_label: string | null
          walkability_score: number | null
          walkability_summary: string | null
          zone_slug: string | null
        }
        Insert: {
          area_slug?: string | null
          bar_count?: number | null
          cafe_count?: number | null
          community_slug?: string | null
          development_nearby_rollup_ky?: number | null
          development_slug?: string | null
          gallery_count?: number | null
          grocery_count?: number | null
          gym_count?: number | null
          last_refreshed_at?: string | null
          lifestyle_summary?: string | null
          nearest_beach_m?: number | null
          nearest_grocery_m?: number | null
          nearest_hospital_urgent_care_m?: number | null
          nearest_pharmacy_m?: number | null
          park_count?: number | null
          pharmacy_count?: number | null
          restaurant_count?: number | null
          walkability_label?: string | null
          walkability_score?: number | null
          walkability_summary?: string | null
          zone_slug?: string | null
        }
        Update: {
          area_slug?: string | null
          bar_count?: number | null
          cafe_count?: number | null
          community_slug?: string | null
          development_nearby_rollup_ky?: number | null
          development_slug?: string | null
          gallery_count?: number | null
          grocery_count?: number | null
          gym_count?: number | null
          last_refreshed_at?: string | null
          lifestyle_summary?: string | null
          nearest_beach_m?: number | null
          nearest_grocery_m?: number | null
          nearest_hospital_urgent_care_m?: number | null
          nearest_pharmacy_m?: number | null
          park_count?: number | null
          pharmacy_count?: number | null
          restaurant_count?: number | null
          walkability_label?: string | null
          walkability_score?: number | null
          walkability_summary?: string | null
          zone_slug?: string | null
        }
        Relationships: []
      }
      development_profile: {
        Row: {
          address: string | null
          architect: string | null
          area_slug: string | null
          beach_access: string | null
          building_facts: string | null
          buyer_notes: string | null
          community_slug: string | null
          completion_status: string | null
          completion_year: number | null
          construction_type: string | null
          content_status: string | null
          cross_streets: string | null
          description: string | null
          developer: string | null
          development_name: string | null
          development_profile_id: number | null
          development_slug: string | null
          floors: number | null
          has_bbq: boolean | null
          has_concierge: boolean | null
          has_coworking: boolean | null
          has_elevator: boolean | null
          has_gym: boolean | null
          has_jacuzzi: boolean | null
          has_lobby: boolean | null
          has_lockoff_units: boolean | null
          has_parking: boolean | null
          has_pool: boolean | null
          has_restaurant_retail: boolean | null
          has_rooftop: boolean | null
          has_sauna: boolean | null
          has_security: boolean | null
          has_spa: boolean | null
          has_steam_room: boolean | null
          has_storage: boolean | null
          hero_image_url: string | null
          hoa_notes: string | null
          investor_notes: string | null
          is_profiled: boolean | null
          is_published: boolean | null
          last_reviewed: string | null
          last_updated: string | null
          latitude: number | null
          lifestyle: string | null
          location_description: string | null
          longitude: number | null
          meta_description: string | null
          nearby_bars_count: number | null
          nearby_beach_minutes: number | null
          nearby_cafes_count: number | null
          nearby_galleries_count: number | null
          nearby_grocery_minutes: number | null
          nearby_notes: string | null
          nearby_restaurants_count: number | null
          nearby_summary: string | null
          neighborhood_label: string | null
          notes: string | null
          num_buildings: number | null
          num_units: number | null
          official_name: string | null
          overview: string | null
          parking: string | null
          pet_policy: string | null
          profile_priority: number | null
          profile_status: string | null
          profile_title: string | null
          property_type: string | null
          rental_policy: string | null
          residences: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          searchpv_insights: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          source_notes: string | null
          source_urls: string[] | null
          stories: number | null
          views: string | null
          walkability_notes: string | null
          website: string | null
          year_built: number | null
          zone_slug: string | null
        }
        Insert: {
          address?: string | null
          architect?: string | null
          area_slug?: string | null
          beach_access?: string | null
          building_facts?: string | null
          buyer_notes?: string | null
          community_slug?: string | null
          completion_status?: string | null
          completion_year?: number | null
          construction_type?: string | null
          content_status?: string | null
          cross_streets?: string | null
          description?: string | null
          developer?: string | null
          development_name?: string | null
          development_profile_id?: number | null
          development_slug?: string | null
          floors?: number | null
          has_bbq?: boolean | null
          has_concierge?: boolean | null
          has_coworking?: boolean | null
          has_elevator?: boolean | null
          has_gym?: boolean | null
          has_jacuzzi?: boolean | null
          has_lobby?: boolean | null
          has_lockoff_units?: boolean | null
          has_parking?: boolean | null
          has_pool?: boolean | null
          has_restaurant_retail?: boolean | null
          has_rooftop?: boolean | null
          has_sauna?: boolean | null
          has_security?: boolean | null
          has_spa?: boolean | null
          has_steam_room?: boolean | null
          has_storage?: boolean | null
          hero_image_url?: string | null
          hoa_notes?: string | null
          investor_notes?: string | null
          is_profiled?: boolean | null
          is_published?: boolean | null
          last_reviewed?: string | null
          last_updated?: string | null
          latitude?: number | null
          lifestyle?: string | null
          location_description?: string | null
          longitude?: number | null
          meta_description?: string | null
          nearby_bars_count?: number | null
          nearby_beach_minutes?: number | null
          nearby_cafes_count?: number | null
          nearby_galleries_count?: number | null
          nearby_grocery_minutes?: number | null
          nearby_notes?: string | null
          nearby_restaurants_count?: number | null
          nearby_summary?: string | null
          neighborhood_label?: string | null
          notes?: string | null
          num_buildings?: number | null
          num_units?: number | null
          official_name?: string | null
          overview?: string | null
          parking?: string | null
          pet_policy?: string | null
          profile_priority?: number | null
          profile_status?: string | null
          profile_title?: string | null
          property_type?: string | null
          rental_policy?: string | null
          residences?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          searchpv_insights?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          source_notes?: string | null
          source_urls?: string[] | null
          stories?: number | null
          views?: string | null
          walkability_notes?: string | null
          website?: string | null
          year_built?: number | null
          zone_slug?: string | null
        }
        Update: {
          address?: string | null
          architect?: string | null
          area_slug?: string | null
          beach_access?: string | null
          building_facts?: string | null
          buyer_notes?: string | null
          community_slug?: string | null
          completion_status?: string | null
          completion_year?: number | null
          construction_type?: string | null
          content_status?: string | null
          cross_streets?: string | null
          description?: string | null
          developer?: string | null
          development_name?: string | null
          development_profile_id?: number | null
          development_slug?: string | null
          floors?: number | null
          has_bbq?: boolean | null
          has_concierge?: boolean | null
          has_coworking?: boolean | null
          has_elevator?: boolean | null
          has_gym?: boolean | null
          has_jacuzzi?: boolean | null
          has_lobby?: boolean | null
          has_lockoff_units?: boolean | null
          has_parking?: boolean | null
          has_pool?: boolean | null
          has_restaurant_retail?: boolean | null
          has_rooftop?: boolean | null
          has_sauna?: boolean | null
          has_security?: boolean | null
          has_spa?: boolean | null
          has_steam_room?: boolean | null
          has_storage?: boolean | null
          hero_image_url?: string | null
          hoa_notes?: string | null
          investor_notes?: string | null
          is_profiled?: boolean | null
          is_published?: boolean | null
          last_reviewed?: string | null
          last_updated?: string | null
          latitude?: number | null
          lifestyle?: string | null
          location_description?: string | null
          longitude?: number | null
          meta_description?: string | null
          nearby_bars_count?: number | null
          nearby_beach_minutes?: number | null
          nearby_cafes_count?: number | null
          nearby_galleries_count?: number | null
          nearby_grocery_minutes?: number | null
          nearby_notes?: string | null
          nearby_restaurants_count?: number | null
          nearby_summary?: string | null
          neighborhood_label?: string | null
          notes?: string | null
          num_buildings?: number | null
          num_units?: number | null
          official_name?: string | null
          overview?: string | null
          parking?: string | null
          pet_policy?: string | null
          profile_priority?: number | null
          profile_status?: string | null
          profile_title?: string | null
          property_type?: string | null
          rental_policy?: string | null
          residences?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          searchpv_insights?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          source_notes?: string | null
          source_urls?: string[] | null
          stories?: number | null
          views?: string | null
          walkability_notes?: string | null
          website?: string | null
          year_built?: number | null
          zone_slug?: string | null
        }
        Relationships: []
      }
      development_snapshot: {
        Row: {
          active_0br: number | null
          active_1br: number | null
          active_2br: number | null
          active_3br_plus: number | null
          active_count: number | null
          area_name: string | null
          area_slug: string | null
          avg_list_price: number | null
          avg_list_price_ft2: number | null
          avg_list_price_m2: number | null
          avg_sold_price: number | null
          avg_sold_price_0br: number | null
          avg_sold_price_1br: number | null
          avg_sold_price_2br: number | null
          avg_sold_price_3br_plus: number | null
          avg_sold_price_ft2: number | null
          avg_sold_price_ft2_0br: number | null
          avg_sold_price_ft2_1br: number | null
          avg_sold_price_ft2_2br: number | null
          avg_sold_price_ft2_3br_plus: number | null
          avg_sold_price_m2: number | null
          avg_sold_price_m2_0br: number | null
          avg_sold_price_m2_1br: number | null
          avg_sold_price_m2_2br: number | null
          avg_sold_price_m2_3br_plus: number | null
          community_name: string | null
          community_slug: string | null
          condo_property_count: number | null
          current_avg_dom: number | null
          development_name: string | null
          development_slug: string | null
          house_property_count: number | null
          market_segment: string | null
          median_list_price: number | null
          median_sold_price: number | null
          median_sold_price_0br: number | null
          median_sold_price_1br: number | null
          median_sold_price_2br: number | null
          median_sold_price_3br_plus: number | null
          median_sold_price_ft2: number | null
          median_sold_price_ft2_0br: number | null
          median_sold_price_ft2_1br: number | null
          median_sold_price_ft2_2br: number | null
          median_sold_price_ft2_3br_plus: number | null
          median_sold_price_m2: number | null
          median_sold_price_m2_0br: number | null
          median_sold_price_m2_1br: number | null
          median_sold_price_m2_2br: number | null
          median_sold_price_m2_3br_plus: number | null
          months_inventory: number | null
          months_inventory_0br: number | null
          months_inventory_1br: number | null
          months_inventory_2br: number | null
          months_inventory_3br_plus: number | null
          pending_0br: number | null
          pending_1br: number | null
          pending_2br: number | null
          pending_3br_plus: number | null
          pending_count: number | null
          property_count: number | null
          property_type_segment: string | null
          sales_0br_12mo: number | null
          sales_12mo: number | null
          sales_1br_12mo: number | null
          sales_2br_12mo: number | null
          sales_3br_plus_12mo: number | null
          sales_period_end: string | null
          sales_period_start: string | null
          snapshot_date: string | null
          sold_avg_dom_12mo: number | null
          zone_name: string | null
          zone_slug: string | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      page_content: {
        Row: {
          active_fl: boolean | null
          area_slug: string | null
          body: string | null
          community_slug: string | null
          content_id: number | null
          content_type: string | null
          created_dt: string | null
          entity_slug: string | null
          entity_type: string | null
          sort_order: number | null
          title: string | null
          updated_dt: string | null
          zone_slug: string | null
        }
        Insert: {
          active_fl?: boolean | null
          area_slug?: string | null
          body?: string | null
          community_slug?: string | null
          content_id?: number | null
          content_type?: string | null
          created_dt?: string | null
          entity_slug?: string | null
          entity_type?: string | null
          sort_order?: number | null
          title?: string | null
          updated_dt?: string | null
          zone_slug?: string | null
        }
        Update: {
          active_fl?: boolean | null
          area_slug?: string | null
          body?: string | null
          community_slug?: string | null
          content_id?: number | null
          content_type?: string | null
          created_dt?: string | null
          entity_slug?: string | null
          entity_type?: string | null
          sort_order?: number | null
          title?: string | null
          updated_dt?: string | null
          zone_slug?: string | null
        }
        Relationships: []
      }
      pending_listing: {
        Row: {
          address: string | null
          area_name: string | null
          baths: number | null
          beds: number | null
          bldng_ds: string | null
          community_name: string | null
          current_price: number | null
          data_current_as_of: string | null
          development: string | null
          development_name: string | null
          dom: number | null
          flr_nb: string | null
          invntry_snap_date_ky: number | null
          invntry_snap_ky: number | null
          lat_nb: number | null
          load_dt: string | null
          long_nb: number | null
          lot_sqft: number | null
          lot_sqm: number | null
          lstng_agncy_ds: string | null
          lstng_agnt_nm: string | null
          lstng_co_agnt_nm: string | null
          lstng_ky: number | null
          market_type: string | null
          mls: number | null
          original_price: number | null
          price_change_amount: number | null
          price_change_percent: number | null
          price_changes: number | null
          price_per_sqft: number | null
          price_per_sqm: number | null
          prmy_view_nm: string | null
          prprty_fngrprnt_id: string | null
          prprty_ky: number | null
          prprty_type: string | null
          prprty_type_cd: string | null
          scndry_view_nm: string | null
          sqft: number | null
          sqm: number | null
          tax_id: string | null
          unit_id: string | null
          year_blt_dt: number | null
          zone_name: string | null
        }
        Relationships: []
      }
      place_display_map: {
        Row: {
          active_fl: boolean | null
          created_at: string | null
          display_category: string | null
          display_icon: string | null
          display_label: string | null
          display_order: number | null
          place_category: string | null
          place_display_map_ky: number | null
          place_name_match: string | null
          place_subcategory: string | null
          rule_priority: number | null
          updated_at: string | null
          why_it_matters: string | null
        }
        Insert: {
          active_fl?: boolean | null
          created_at?: string | null
          display_category?: string | null
          display_icon?: string | null
          display_label?: string | null
          display_order?: number | null
          place_category?: string | null
          place_display_map_ky?: number | null
          place_name_match?: string | null
          place_subcategory?: string | null
          rule_priority?: number | null
          updated_at?: string | null
          why_it_matters?: string | null
        }
        Update: {
          active_fl?: boolean | null
          created_at?: string | null
          display_category?: string | null
          display_icon?: string | null
          display_label?: string | null
          display_order?: number | null
          place_category?: string | null
          place_display_map_ky?: number | null
          place_name_match?: string | null
          place_subcategory?: string | null
          rule_priority?: number | null
          updated_at?: string | null
          why_it_matters?: string | null
        }
        Relationships: []
      }
      profile_set_priority_one: {
        Row: {
          active_fl: boolean | null
          area_slug: string | null
          community_slug: string | null
          created_at: string | null
          development_name: string | null
          development_slug: string | null
          profile_set_priority_one_id: number | null
          reason: string | null
          updated_at: string | null
          zone_slug: string | null
        }
        Insert: {
          active_fl?: boolean | null
          area_slug?: string | null
          community_slug?: string | null
          created_at?: string | null
          development_name?: string | null
          development_slug?: string | null
          profile_set_priority_one_id?: number | null
          reason?: string | null
          updated_at?: string | null
          zone_slug?: string | null
        }
        Update: {
          active_fl?: boolean | null
          area_slug?: string | null
          community_slug?: string | null
          created_at?: string | null
          development_name?: string | null
          development_slug?: string | null
          profile_set_priority_one_id?: number | null
          reason?: string | null
          updated_at?: string | null
          zone_slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      closed_sales_agency_report_summary: {
        Args: {
          p_area_nm?: string
          p_community_nm?: string
          p_development_nm?: string
          p_end_date?: string
          p_market_type_nm?: string
          p_property_type_cd?: string
          p_start_date?: string
          p_zone_nm?: string
        }
        Returns: {
          average_dom: number
          average_sold_price_usd: number
          average_sold_to_list_pc: number
          average_sold_vs_list_pc: number
          both_sides: number
          both_sides_pc: number
          closed_transactions: number
          listing_sides: number
          listing_volume_usd: number
          median_dom: number
          median_sold_price_usd: number
          median_sold_to_list_pc: number
          median_sold_vs_list_pc: number
          selling_sides: number
          selling_volume_usd: number
          side_capture_pc: number
          total_side_volume_usd: number
          total_sides: number
          transaction_volume_usd: number
        }[]
      }
      closed_sales_by_agency: {
        Args: {
          p_area_nm?: string
          p_community_nm?: string
          p_development_nm?: string
          p_end_date?: string
          p_market_type_nm?: string
          p_property_type_cd?: string
          p_start_date?: string
          p_zone_nm?: string
        }
        Returns: {
          agency_nm: string
          average_dom: number
          average_sold_price_usd: number
          average_sold_to_list_pc: number
          average_sold_vs_list_pc: number
          both_sides: number
          both_sides_pc: number
          closed_transactions: number
          listing_sides: number
          listing_volume_usd: number
          median_dom: number
          median_sold_price_usd: number
          median_sold_to_list_pc: number
          median_sold_vs_list_pc: number
          selling_sides: number
          selling_volume_usd: number
          side_capture_pc: number
          total_side_volume_usd: number
          total_sides: number
          transaction_volume_usd: number
        }[]
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unaccent: { Args: { "": string }; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
