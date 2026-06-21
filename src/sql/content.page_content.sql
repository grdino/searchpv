create table content.page_content (
    content_id bigint generated always as identity
        primary key,

    content_type text not null,
        -- description
        -- seo_intro
        -- faq
        -- disclaimer
        -- market_commentary

    entity_type text not null,
        -- zone
        -- area
        -- community
        -- development
        -- property_type
        -- market_segment
        -- page

    entity_slug text not null,

    zone_slug text,
    area_slug text,
    community_slug text,

    title text,

    body text not null,

    sort_order integer not null default 1,

    active_fl boolean not null default true,

    created_dt timestamp not null default current_timestamp,
    updated_dt timestamp not null default current_timestamp,

    constraint uq_page_content
        unique (
            content_type,
            entity_type,
            entity_slug,
            sort_order
        )
);

-- **************************************
--INDEXES:

create index ix_page_content_entity
    on content.page_content (
        entity_type,
        entity_slug
    );

create index ix_page_content_area
    on content.page_content (
        area_slug
    );

create index ix_page_content_community
    on content.page_content (
        community_slug
    );

create index ix_page_content_active
    on content.page_content (
        active_fl
    );

-- **************************************
---PUBLIC VIEW ****
-- **************************************
create or replace view public.page_content as
select *
from content.page_content
where active_fl = true;

-- **************************************
---  SAMPLE INSERTS:
-- **************************************
insert into content.page_content (
    content_type,
    entity_type,
    entity_slug,
    zone_slug,
    area_slug,
    title,
    body
)
values (
    'description',
    'area',
    'centro-south',
    'puerto-vallarta',
    'centro-south',
    'About Centro South',
    'Centro South is one of Puerto Vallarta''s most sought-after real estate markets...'
);

insert into content.page_content (
    content_type,
    entity_type,
    entity_slug,
    zone_slug,
    area_slug,
    community_slug,
    title,
    body
)
values (
    'description',
    'community',
    'emiliano-zapata',
    'puerto-vallarta',
    'centro-south',
    'emiliano-zapata',
    'About Emiliano Zapata',
    'Emiliano Zapata, commonly known as Zona Romántica...'
);
