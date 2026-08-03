-- SearchPV Geography Office module
-- Run in Supabase SQL Editor.
--
-- Assumptions:
--   geo.entity
--   geo.entity_variant
--   geo.entity_relationship
--   geo.entity_type_lu
--   geo.entity_source_lu
--   geo.variant_type_lu
--   geo.language_lu
--
-- Immediate hierarchy relationship:
--   relationship_type_cd = 'CB'
--
-- Canonical variant:
--   variant_type_cd = 'CA'

create or replace function public.geography_summary()
returns table
(
    entity_type_cd text,
    entity_type_nm text,
    entity_ct bigint,
    missing_coordinate_ct bigint,
    missing_parent_ct bigint
)
language sql
stable
security definer
set search_path = public, geo, pg_temp
as $function$
    select
        t.entity_type_cd,
        t.entity_type_nm,
        count(e.entity_ky)::bigint as entity_ct,
        count(*) filter
        (
            where e.entity_ky is not null
              and (e.longitude_nb is null or e.latitude_nb is null)
        )::bigint as missing_coordinate_ct,
        count(*) filter
        (
            where e.entity_ky is not null
              and e.entity_type_cd <> 'ZN'
              and r.parent_entity_ky is null
        )::bigint as missing_parent_ct
    from geo.entity_type_lu t
    left join geo.entity e
        on e.entity_type_cd = t.entity_type_cd
    left join geo.entity_relationship r
        on r.child_entity_ky = e.entity_ky
       and r.relationship_type_cd = 'CB'
    group by
        t.entity_type_cd,
        t.entity_type_nm
    order by
        min(
            case t.entity_type_cd
                when 'ZN' then 1
                when 'AR' then 2
                when 'CM' then 3
                when 'DV' then 4
                when 'BD' then 5
                when 'NB' then 6
                when 'PL' then 7
                else 99
            end
        );
$function$;


create or replace function public.geography_lookup_data()
returns jsonb
language sql
stable
security definer
set search_path = public, geo, pg_temp
as $function$
    select jsonb_build_object(
        'entity_types',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'code', t.entity_type_cd,
                        'name', t.entity_type_nm
                    )
                    order by
                        case t.entity_type_cd
                            when 'ZN' then 1
                            when 'AR' then 2
                            when 'CM' then 3
                            when 'DV' then 4
                            when 'BD' then 5
                            when 'NB' then 6
                            when 'PL' then 7
                            else 99
                        end,
                        t.entity_type_nm
                )
                from geo.entity_type_lu t
            ),
            '[]'::jsonb
        ),
        'entity_sources',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'code', s.entity_source_cd,
                        'name', s.entity_source_nm
                    )
                    order by s.entity_source_nm
                )
                from geo.entity_source_lu s
            ),
            '[]'::jsonb
        ),
        'variant_types',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'code', v.variant_type_cd,
                        'name', v.variant_type_nm
                    )
                    order by v.variant_type_nm
                )
                from geo.variant_type_lu v
            ),
            '[]'::jsonb
        ),
        'languages',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'code', l.language_cd,
                        'name', l.language_nm
                    )
                    order by l.language_nm
                )
                from geo.language_lu l
            ),
            '[]'::jsonb
        )
    );
$function$;


create or replace function public.geography_entity_list(
    p_search text default null,
    p_entity_type_cd text default null,
    p_limit integer default 200,
    p_offset integer default 0
)
returns table
(
    entity_ky bigint,
    entity_identifier_cd text,
    entity_type_cd text,
    entity_type_nm text,
    canonical_nm text,
    entity_source_cd text,
    longitude_nb numeric,
    latitude_nb numeric,
    parent_entity_ky bigint,
    parent_nm text,
    variant_ct bigint,
    child_ct bigint
)
language sql
stable
security definer
set search_path = public, geo, pg_temp
as $function$
    with canonical as
    (
        select distinct on (v.entity_ky)
            v.entity_ky,
            v.entity_variant_nm
        from geo.entity_variant v
        where v.variant_type_cd = 'CA'
        order by
            v.entity_ky,
            case when v.language_cd = 'EN' then 0 else 1 end,
            v.entity_variant_ky
    ),
    parents as
    (
        select
            r.child_entity_ky,
            r.parent_entity_ky,
            coalesce(pc.entity_variant_nm, pe.entity_identifier_cd) as parent_nm
        from geo.entity_relationship r
        join geo.entity pe
            on pe.entity_ky = r.parent_entity_ky
        left join canonical pc
            on pc.entity_ky = pe.entity_ky
        where r.relationship_type_cd = 'CB'
    ),
    variant_counts as
    (
        select
            v.entity_ky,
            count(*)::bigint as variant_ct
        from geo.entity_variant v
        group by v.entity_ky
    ),
    child_counts as
    (
        select
            r.parent_entity_ky as entity_ky,
            count(*)::bigint as child_ct
        from geo.entity_relationship r
        where r.relationship_type_cd = 'CB'
        group by r.parent_entity_ky
    )
    select
        e.entity_ky,
        e.entity_identifier_cd,
        e.entity_type_cd,
        t.entity_type_nm,
        coalesce(c.entity_variant_nm, e.entity_identifier_cd) as canonical_nm,
        e.entity_source_cd,
        e.longitude_nb,
        e.latitude_nb,
        p.parent_entity_ky,
        p.parent_nm,
        coalesce(vc.variant_ct, 0)::bigint as variant_ct,
        coalesce(cc.child_ct, 0)::bigint as child_ct
    from geo.entity e
    left join geo.entity_type_lu t
        on t.entity_type_cd = e.entity_type_cd
    left join canonical c
        on c.entity_ky = e.entity_ky
    left join parents p
        on p.child_entity_ky = e.entity_ky
    left join variant_counts vc
        on vc.entity_ky = e.entity_ky
    left join child_counts cc
        on cc.entity_ky = e.entity_ky
    where
        (p_entity_type_cd is null or e.entity_type_cd = p_entity_type_cd)
        and
        (
            p_search is null
            or btrim(p_search) = ''
            or e.entity_identifier_cd ilike '%' || btrim(p_search) || '%'
            or c.entity_variant_nm ilike '%' || btrim(p_search) || '%'
            or exists
            (
                select 1
                from geo.entity_variant sv
                where sv.entity_ky = e.entity_ky
                  and sv.entity_variant_nm ilike '%' || btrim(p_search) || '%'
            )
        )
    order by
        case e.entity_type_cd
            when 'ZN' then 1
            when 'AR' then 2
            when 'CM' then 3
            when 'DV' then 4
            when 'BD' then 5
            when 'NB' then 6
            when 'PL' then 7
            else 99
        end,
        coalesce(c.entity_variant_nm, e.entity_identifier_cd)
    limit greatest(1, least(coalesce(p_limit, 200), 500))
    offset greatest(coalesce(p_offset, 0), 0);
$function$;


create or replace function public.geography_entity_detail(
    p_entity_ky bigint
)
returns jsonb
language sql
stable
security definer
set search_path = public, geo, pg_temp
as $function$
    select jsonb_build_object(
        'entity',
        (
            select jsonb_build_object(
                'entity_ky', e.entity_ky,
                'entity_identifier_cd', e.entity_identifier_cd,
                'entity_type_cd', e.entity_type_cd,
                'longitude_nb', e.longitude_nb,
                'latitude_nb', e.latitude_nb,
                'entity_source_cd', e.entity_source_cd
            )
            from geo.entity e
            where e.entity_ky = p_entity_ky
        ),
        'canonical',
        (
            select jsonb_build_object(
                'entity_variant_ky', v.entity_variant_ky,
                'entity_variant_nm', v.entity_variant_nm,
                'language_cd', v.language_cd
            )
            from geo.entity_variant v
            where v.entity_ky = p_entity_ky
              and v.variant_type_cd = 'CA'
            order by
                case when v.language_cd = 'EN' then 0 else 1 end,
                v.entity_variant_ky
            limit 1
        ),
        'variants',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'entity_variant_ky', v.entity_variant_ky,
                        'variant_type_cd', v.variant_type_cd,
                        'variant_type_nm', vt.variant_type_nm,
                        'entity_variant_nm', v.entity_variant_nm,
                        'language_cd', v.language_cd
                    )
                    order by
                        case when v.variant_type_cd = 'CA' then 0 else 1 end,
                        v.entity_variant_nm
                )
                from geo.entity_variant v
                left join geo.variant_type_lu vt
                    on vt.variant_type_cd = v.variant_type_cd
                where v.entity_ky = p_entity_ky
            ),
            '[]'::jsonb
        ),
        'parent',
        (
            select jsonb_build_object(
                'entity_ky', p.entity_ky,
                'entity_identifier_cd', p.entity_identifier_cd,
                'entity_type_cd', p.entity_type_cd,
                'canonical_nm',
                    coalesce(
                        (
                            select pv.entity_variant_nm
                            from geo.entity_variant pv
                            where pv.entity_ky = p.entity_ky
                              and pv.variant_type_cd = 'CA'
                            order by
                                case when pv.language_cd = 'EN' then 0 else 1 end,
                                pv.entity_variant_ky
                            limit 1
                        ),
                        p.entity_identifier_cd
                    )
            )
            from geo.entity_relationship r
            join geo.entity p
                on p.entity_ky = r.parent_entity_ky
            where r.child_entity_ky = p_entity_ky
              and r.relationship_type_cd = 'CB'
            limit 1
        ),
        'child_count',
        (
            select count(*)
            from geo.entity_relationship r
            where r.parent_entity_ky = p_entity_ky
              and r.relationship_type_cd = 'CB'
        )
    );
$function$;


create or replace function public.geography_parent_options(
    p_child_entity_type_cd text,
    p_search text default null,
    p_limit integer default 500
)
returns table
(
    entity_ky bigint,
    entity_identifier_cd text,
    entity_type_cd text,
    canonical_nm text
)
language sql
stable
security definer
set search_path = public, geo, pg_temp
as $function$
    with allowed_parent as
    (
        select case p_child_entity_type_cd
            when 'AR' then 'ZN'
            when 'CM' then 'AR'
            when 'DV' then 'CM'
            when 'BD' then 'DV'
            when 'NB' then 'CM'
            when 'PL' then 'CM'
            else null
        end as entity_type_cd
    ),
    canonical as
    (
        select distinct on (v.entity_ky)
            v.entity_ky,
            v.entity_variant_nm
        from geo.entity_variant v
        where v.variant_type_cd = 'CA'
        order by
            v.entity_ky,
            case when v.language_cd = 'EN' then 0 else 1 end,
            v.entity_variant_ky
    )
    select
        e.entity_ky,
        e.entity_identifier_cd,
        e.entity_type_cd,
        coalesce(c.entity_variant_nm, e.entity_identifier_cd) as canonical_nm
    from geo.entity e
    cross join allowed_parent a
    left join canonical c
        on c.entity_ky = e.entity_ky
    where e.entity_type_cd = a.entity_type_cd
      and
      (
          p_search is null
          or btrim(p_search) = ''
          or e.entity_identifier_cd ilike '%' || btrim(p_search) || '%'
          or c.entity_variant_nm ilike '%' || btrim(p_search) || '%'
      )
    order by coalesce(c.entity_variant_nm, e.entity_identifier_cd)
    limit greatest(1, least(coalesce(p_limit, 500), 1000));
$function$;


create or replace function public.geography_entity_save(
    p_entity_ky bigint default null,
    p_entity_identifier_cd text default null,
    p_entity_type_cd text default null,
    p_canonical_nm text default null,
    p_longitude_nb numeric default null,
    p_latitude_nb numeric default null,
    p_entity_source_cd text default 'ME',
    p_language_cd text default 'EN',
    p_parent_entity_ky bigint default null
)
returns bigint
language plpgsql
security definer
set search_path = public, geo, pg_temp
as $function$
declare
    v_entity_ky bigint;
    v_expected_parent_type text;
    v_actual_parent_type text;
begin
    if btrim(coalesce(p_entity_identifier_cd, '')) = '' then
        raise exception 'Entity identifier is required.';
    end if;

    if btrim(coalesce(p_entity_type_cd, '')) = '' then
        raise exception 'Entity type is required.';
    end if;

    if btrim(coalesce(p_canonical_nm, '')) = '' then
        raise exception 'Canonical name is required.';
    end if;

    if p_latitude_nb is not null and (p_latitude_nb < -90 or p_latitude_nb > 90) then
        raise exception 'Latitude must be between -90 and 90.';
    end if;

    if p_longitude_nb is not null and (p_longitude_nb < -180 or p_longitude_nb > 180) then
        raise exception 'Longitude must be between -180 and 180.';
    end if;

    v_expected_parent_type :=
        case p_entity_type_cd
            when 'AR' then 'ZN'
            when 'CM' then 'AR'
            when 'DV' then 'CM'
            when 'BD' then 'DV'
            when 'NB' then 'CM'
            when 'PL' then 'CM'
            else null
        end;

    if p_parent_entity_ky is not null then
        select e.entity_type_cd
        into v_actual_parent_type
        from geo.entity e
        where e.entity_ky = p_parent_entity_ky;

        if v_actual_parent_type is null then
            raise exception 'Selected parent does not exist.';
        end if;

        if v_expected_parent_type is not null
           and v_actual_parent_type <> v_expected_parent_type then
            raise exception
                'A % entity must have a % parent, not %.',
                p_entity_type_cd,
                v_expected_parent_type,
                v_actual_parent_type;
        end if;
    end if;

    if p_entity_ky is null then
        insert into geo.entity
        (
            entity_identifier_cd,
            entity_type_cd,
            longitude_nb,
            latitude_nb,
            entity_source_cd
        )
        values
        (
            btrim(p_entity_identifier_cd),
            p_entity_type_cd,
            p_longitude_nb,
            p_latitude_nb,
            p_entity_source_cd
        )
        returning entity_ky into v_entity_ky;
    else
        update geo.entity
        set
            entity_identifier_cd = btrim(p_entity_identifier_cd),
            entity_type_cd = p_entity_type_cd,
            longitude_nb = p_longitude_nb,
            latitude_nb = p_latitude_nb,
            entity_source_cd = p_entity_source_cd
        where entity_ky = p_entity_ky;

        if not found then
            raise exception 'Entity % was not found.', p_entity_ky;
        end if;

        v_entity_ky := p_entity_ky;
    end if;

    if p_parent_entity_ky = v_entity_ky then
        raise exception 'An entity cannot be its own parent.';
    end if;

    delete from geo.entity_variant
    where entity_ky = v_entity_ky
      and variant_type_cd = 'CA';

    insert into geo.entity_variant
    (
        entity_ky,
        variant_type_cd,
        entity_variant_nm,
        language_cd
    )
    values
    (
        v_entity_ky,
        'CA',
        btrim(p_canonical_nm),
        p_language_cd
    );

    delete from geo.entity_relationship
    where child_entity_ky = v_entity_ky
      and relationship_type_cd = 'CB';

    if p_parent_entity_ky is not null then
        insert into geo.entity_relationship
        (
            child_entity_ky,
            relationship_type_cd,
            parent_entity_ky
        )
        values
        (
            v_entity_ky,
            'CB',
            p_parent_entity_ky
        );
    end if;

    return v_entity_ky;
end;
$function$;


create or replace function public.geography_variant_save(
    p_entity_variant_ky bigint default null,
    p_entity_ky bigint default null,
    p_variant_type_cd text default null,
    p_entity_variant_nm text default null,
    p_language_cd text default 'EN'
)
returns bigint
language plpgsql
security definer
set search_path = public, geo, pg_temp
as $function$
declare
    v_entity_variant_ky bigint;
begin
    if p_entity_ky is null then
        raise exception 'Entity key is required.';
    end if;

    if btrim(coalesce(p_variant_type_cd, '')) = '' then
        raise exception 'Variant type is required.';
    end if;

    if p_variant_type_cd = 'CA' then
        raise exception 'Canonical names must be maintained in the entity editor.';
    end if;

    if btrim(coalesce(p_entity_variant_nm, '')) = '' then
        raise exception 'Variant name is required.';
    end if;

    if p_entity_variant_ky is null then
        insert into geo.entity_variant
        (
            entity_ky,
            variant_type_cd,
            entity_variant_nm,
            language_cd
        )
        values
        (
            p_entity_ky,
            p_variant_type_cd,
            btrim(p_entity_variant_nm),
            p_language_cd
        )
        returning entity_variant_ky into v_entity_variant_ky;
    else
        update geo.entity_variant
        set
            variant_type_cd = p_variant_type_cd,
            entity_variant_nm = btrim(p_entity_variant_nm),
            language_cd = p_language_cd
        where entity_variant_ky = p_entity_variant_ky
          and entity_ky = p_entity_ky
          and variant_type_cd <> 'CA'
        returning entity_variant_ky into v_entity_variant_ky;

        if v_entity_variant_ky is null then
            raise exception 'Variant % was not found or cannot be edited here.',
                p_entity_variant_ky;
        end if;
    end if;

    return v_entity_variant_ky;
end;
$function$;


create or replace function public.geography_variant_delete(
    p_entity_variant_ky bigint
)
returns void
language plpgsql
security definer
set search_path = public, geo, pg_temp
as $function$
begin
    if exists
    (
        select 1
        from geo.entity_variant
        where entity_variant_ky = p_entity_variant_ky
          and variant_type_cd = 'CA'
    ) then
        raise exception 'Canonical names must be maintained in the entity editor.';
    end if;

    delete from geo.entity_variant
    where entity_variant_ky = p_entity_variant_ky;
end;
$function$;


create or replace function public.geography_entity_delete(
    p_entity_ky bigint
)
returns void
language plpgsql
security definer
set search_path = public, geo, pg_temp
as $function$
begin
    if exists
    (
        select 1
        from geo.entity_relationship
        where parent_entity_ky = p_entity_ky
          and relationship_type_cd = 'CB'
    ) then
        raise exception 'This entity has child entities and cannot be deleted.';
    end if;

    delete from geo.entity
    where entity_ky = p_entity_ky;

    if not found then
        raise exception 'Entity % was not found.', p_entity_ky;
    end if;
end;
$function$;


revoke all on function public.geography_summary() from public;
revoke all on function public.geography_lookup_data() from public;
revoke all on function public.geography_entity_list(text, text, integer, integer) from public;
revoke all on function public.geography_entity_detail(bigint) from public;
revoke all on function public.geography_parent_options(text, text, integer) from public;
revoke all on function public.geography_entity_save(
    bigint, text, text, text, numeric, numeric, text, text, bigint
) from public;
revoke all on function public.geography_variant_save(
    bigint, bigint, text, text, text
) from public;
revoke all on function public.geography_variant_delete(bigint) from public;
revoke all on function public.geography_entity_delete(bigint) from public;

grant execute on function public.geography_summary() to authenticated;
grant execute on function public.geography_lookup_data() to authenticated;
grant execute on function public.geography_entity_list(text, text, integer, integer) to authenticated;
grant execute on function public.geography_entity_detail(bigint) to authenticated;
grant execute on function public.geography_parent_options(text, text, integer) to authenticated;
grant execute on function public.geography_entity_save(
    bigint, text, text, text, numeric, numeric, text, text, bigint
) to authenticated;
grant execute on function public.geography_variant_save(
    bigint, bigint, text, text, text
) to authenticated;
grant execute on function public.geography_variant_delete(bigint) to authenticated;
grant execute on function public.geography_entity_delete(bigint) to authenticated;
