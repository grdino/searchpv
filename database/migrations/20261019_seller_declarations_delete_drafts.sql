-- Run after 20261019_seller_declarations.sql. Safe to rerun.
begin;
-- The existing owner/app RLS policy still controls access; DELETE is limited to drafts.
drop policy if exists declaration_draft_delete_only on public.seller_declaration;
create policy declaration_draft_delete_only on public.seller_declaration
as restrictive for delete to authenticated
using (status = 'draft');

-- Protect finalized records even when deletion bypasses RLS (for example, admin SQL).
create or replace function public.guard_seller_declaration_delete() returns trigger
language plpgsql set search_path = '' as $$
begin
 if OLD.status <> 'draft' then
  raise exception 'Finalized declarations cannot be deleted.';
 end if;
 return OLD;
end $$;
drop trigger if exists guard_seller_declaration_delete on public.seller_declaration;
create trigger guard_seller_declaration_delete before delete on public.seller_declaration
for each row execute function public.guard_seller_declaration_delete();
grant delete on public.seller_declaration to authenticated;
commit;
-- Photo/PDF objects are retained; they may be referenced by earlier finalized revisions.
