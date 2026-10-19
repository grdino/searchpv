-- Run once in the Supabase SQL editor. Uses existing Office access functions.
begin;
insert into public.office_app(app_key,name,href,active,sort_order)
values ('seller_declarations','Seller Declarations','/office/seller-declarations',true,60)
on conflict (app_key) do update set name=excluded.name,href=excluded.href;

create table public.seller_declaration (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 family_id uuid not null,
 revision integer not null default 1 check (revision > 0),
 version integer not null default 1 check (version > 0),
 status text not null default 'draft' check (status in ('draft','final')),
 content jsonb not null check (jsonb_typeof(content)='object' and octet_length(content::text)<700000),
 pdf_path text,
 updated_at timestamptz not null default now(),
 unique(family_id,revision),
 check ((status='draft' and pdf_path is null) or (status='final' and pdf_path is not null))
);
create index seller_declaration_owner on public.seller_declaration(owner_id,updated_at desc);
alter table public.seller_declaration enable row level security;
revoke all on public.seller_declaration from anon, authenticated;
grant select,insert,update on public.seller_declaration to authenticated;
create policy declaration_owner on public.seller_declaration for all to authenticated
using (owner_id=auth.uid() and public.current_user_has_office_app('seller_declarations'))
with check (owner_id=auth.uid() and public.current_user_has_office_app('seller_declarations'));

create function public.guard_seller_declaration() returns trigger
language plpgsql set search_path = '' as $$
begin
 if TG_OP='UPDATE' then
  if OLD.status='final' then raise exception 'Finalized declarations are immutable. Create a revision.'; end if;
  if (NEW.id,NEW.owner_id,NEW.family_id,NEW.revision) is distinct from (OLD.id,OLD.owner_id,OLD.family_id,OLD.revision)
    then raise exception 'Declaration identity cannot change'; end if;
  if NEW.version<>OLD.version+1 then raise exception 'Version must increment'; end if;
 else
  if NEW.version<>1 or NEW.status<>'draft' then raise exception 'New declarations must be drafts'; end if;
  if NEW.revision=1 then
   if NEW.family_id<>NEW.id then raise exception 'Invalid family'; end if;
  elsif not exists(select 1 from public.seller_declaration d where d.family_id=NEW.family_id and d.owner_id=NEW.owner_id and d.revision=NEW.revision-1 and d.status='final') then
   raise exception 'Finalize the previous revision first';
  end if;
 end if;
 NEW.updated_at=now();
 return NEW;
end $$;
create trigger guard_seller_declaration before insert or update on public.seller_declaration
for each row execute function public.guard_seller_declaration();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('seller-declarations','seller-declarations',false,25000000,array['image/jpeg','application/pdf']);
-- Objects are append-only: replacing/deleting a photo would change an old declaration.
create policy declaration_files_read on storage.objects for select to authenticated
using (bucket_id='seller-declarations' and (storage.foldername(name))[1]=auth.uid()::text
 and public.current_user_has_office_app('seller_declarations'));
create policy declaration_files_insert on storage.objects for insert to authenticated
with check (bucket_id='seller-declarations' and (storage.foldername(name))[1]=auth.uid()::text
 and public.current_user_has_office_app('seller_declarations'));

-- Grant access explicitly after migration (replace with your Office email):
-- insert into public.office_user_app(user_id,app_key)
-- select user_id,'seller_declarations' from public.office_user where email='YOUR_EMAIL'
-- on conflict do nothing;
commit;
