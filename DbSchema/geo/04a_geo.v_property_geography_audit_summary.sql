create or replace view geo.v_property_geography_audit_summary as

select
    audit_status_cd,
    count(*) as property_count,

    round
    (
        100.0 * count(*) / nullif(sum(count(*)) over (), 0),
        2
    ) as property_pct

from geo.v_property_geography_audit

group by
    audit_status_cd;