/* Run after DDL and after the historical load. */

SELECT COUNT(*) AS attribute_count FROM dw.attribute;
SELECT COUNT(*) AS attribute_source_count FROM dw.attribute_source;
SELECT COUNT(*) AS listing_attribute_value_count FROM dw.lstng_attribute_value;
SELECT COUNT(*) AS listing_search_profile_count FROM dw.lstng_search_attribute;

SELECT
    COUNT(*) FILTER (WHERE pet_friendly_fl IS TRUE) AS pet_yes,
    COUNT(*) FILTER (WHERE pet_friendly_fl IS FALSE) AS pet_no,
    COUNT(*) FILTER (WHERE pet_friendly_fl IS NULL) AS pet_unknown,
    COUNT(*) FILTER (WHERE beachfront_fl IS TRUE) AS beachfront_yes,
    COUNT(*) FILTER (WHERE beachfront_fl IS FALSE) AS beachfront_no,
    COUNT(*) FILTER (WHERE beachfront_fl IS NULL) AS beachfront_unknown
FROM dw.lstng_search_attribute;

SELECT
    a.attribute_category_cd,
    COUNT(*) AS attribute_count,
    COUNT(lav.lstng_attribute_value_ky) AS current_value_count
FROM dw.attribute a
LEFT JOIN dw.lstng_attribute_value lav
  ON lav.attribute_ky = a.attribute_ky
GROUP BY a.attribute_category_cd
ORDER BY a.attribute_category_cd;

SELECT *
FROM dw.v_lstng_attribute_detail
ORDER BY lstng_nb, attribute_category_cd, attribute_nm
LIMIT 200;
