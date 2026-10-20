-- Run after deploying the matching update. Safe to rerun.
begin;
-- Newly finalized PDFs must use their permanent namespace. This also prevents
-- an old preview/legacy file from becoming a final reference during cleanup.
create or replace function public.guard_seller_declaration_final_path() returns trigger
language plpgsql set search_path = '' as $$
begin
 if NEW.status = 'final' and OLD.status <> 'final' then
  if NEW.pdf_path is null or NEW.pdf_path !~ ('^' || NEW.owner_id::text || '/final/[0-9a-f-]{36}\.pdf$') then
   raise exception 'Final PDFs require a permanent final path. Refresh the app and generate the PDF again.';
  end if;
 end if;
 return NEW;
end $$;
drop trigger if exists guard_seller_declaration_final_path on public.seller_declaration;
create trigger guard_seller_declaration_final_path before update on public.seller_declaration
for each row execute function public.guard_seller_declaration_final_path();

create index if not exists seller_declaration_pdf_path on public.seller_declaration(pdf_path) where pdf_path is not null;

-- Read metadata only. The scheduled server job deletes bytes through Storage API.
-- Permanent /final/ files, all photos, and every stored PDF reference are excluded.
create or replace function public.expired_seller_declaration_previews()
returns table(path text)
language sql stable security definer set search_path = '' as $$
 select o.name::text
 from storage.objects o
 where o.bucket_id = 'seller-declarations'
   and o.created_at < now() - interval '24 hours'
   and o.name ~ '^[0-9a-f-]{36}/(preview/)?[0-9a-f-]{36}\.pdf$'
   and not exists(select 1 from public.seller_declaration d where d.pdf_path = o.name)
 order by o.created_at, o.name
 limit 500;
$$;
revoke all on function public.expired_seller_declaration_previews() from public, anon, authenticated;
grant execute on function public.expired_seller_declaration_previews() to service_role;
commit;
