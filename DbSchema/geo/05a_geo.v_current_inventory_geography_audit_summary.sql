create or replace view geo.v_current_inventory_geography_audit_summary as

select
    listing_status_cd,
    audit_status_cd,
    count(*) as listing_count,

    round
    (
        100.0 * count(*)
        /
        nullif
        (
            sum(count(*)) over
            (
                partition by listing_status_cd
            ),
            0
        ),
        2
    ) as status_pct

from geo.v_current_inventory_geography_audit

group by
    listing_status_cd,
    audit_status_cd;