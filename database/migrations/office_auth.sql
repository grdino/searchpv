insert into public.office_user_app (user_id, app_key)
select user_id, 'seller_declarations'
from public.office_user
where lower(email) = lower('gerry@ronmorgan.net')
on conflict do nothing;