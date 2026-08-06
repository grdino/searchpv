Important interpretation

A MISMATCH does not automatically mean the approved boundary is wrong.

It means only:

The MLS community entered for the property
does not match any recognized variant
of the approved SearchPV community.

That mismatch may result from:

incorrect MLS community entry;
an incorrect property coordinate;
an incorrect boundary approval;
a legitimate local naming ambiguity;
a missing alias in geo.entity_variant.

The first thing to review after creating the views is the summary count—not 
individual rows yet. That will tell us whether the disagreement is small, widespread, or 
concentrated in a few communities.


Inspect the overall result
select *
from geo.v_property_geography_audit_summary
order by
    case audit_status_cd
        when 'MATCH' then 1
        when 'MISMATCH' then 2
        when 'NO_APPROVED_BOUNDARY' then 3
        when 'MULTIPLE_APPROVED_BOUNDARIES' then 4
        when 'MISSING_COORDINATES' then 5
        else 6
    end;


See the mismatched properties

select
    prprty_ky,
    adrs_ds,
    mls_zone_nm,
    mls_area_nm,
    mls_community_nm,
    spv_community_nm,
    boundary_ky,
    lat_nb,
    long_nb
from geo.v_property_geography_audit
where audit_status_cd = 'MISMATCH'
order by
    spv_community_nm,
    mls_community_nm,
    adrs_ds;

Find properties outside approved boundaries
select
    prprty_ky,
    adrs_ds,
    mls_zone_nm,
    mls_area_nm,
    mls_community_nm,
    lat_nb,
    long_nb
from geo.v_property_geography_audit
where audit_status_cd = 'NO_APPROVED_BOUNDARY'
order by
    mls_zone_nm,
    mls_area_nm,
    mls_community_nm,
    adrs_ds;

Find overlapping approved polygons
select
    prprty_ky,
    adrs_ds,
    mls_community_nm,
    approved_boundary_count,
    approved_boundary_matches_js,
    lat_nb,
    long_nb
from geo.v_property_geography_audit
where audit_status_cd = 'MULTIPLE_APPROVED_BOUNDARIES'
order by
    approved_boundary_co