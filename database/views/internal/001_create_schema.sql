-- ============================================================================
-- File: 001_create_schema.sql
-- Purpose: Create the schema used for private brokerage reporting objects.
-- ============================================================================

create schema if not exists internal;

comment on schema internal is
    'Private brokerage reporting views. Not intended for anonymous/public access.';

-- No grants are issued here intentionally.
-- Add access only after the internal application authentication model is ready.
--
-- Example for a future authenticated application role:
--
-- grant usage on schema internal to authenticated;