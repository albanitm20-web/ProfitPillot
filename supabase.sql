-- Run once in the project's Supabase SQL Editor. No paid extensions required.
-- One versioned document per account preserves the existing chronological ledger.
begin;
create table if not exists public.profitpilot_books (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null,
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 constraint profitpilot_document check (
  jsonb_typeof(data)='object' and data->>'schema'='3'
  and jsonb_typeof(data->'entries')='array'
  and jsonb_typeof(data->'items')='array'
  and jsonb_typeof(data->'budgets')='array'
  and jsonb_typeof(data->'goals')='array'
  and octet_length(data::text)<=15000000
 )
);
alter table public.profitpilot_books enable row level security;
alter table public.profitpilot_books force row level security;
revoke all on public.profitpilot_books from anon, authenticated;
grant select on public.profitpilot_books to authenticated;
drop policy if exists own_books on public.profitpilot_books;
create policy own_books on public.profitpilot_books for select to authenticated using ((select auth.uid())=user_id);

-- All writes go through an authenticated compare-and-swap operation.
-- A concurrent writer receives HTTP 409 instead of silently replacing newer data.
create or replace function public.save_profitpilot(payload jsonb, expected_revision bigint)
returns bigint language plpgsql security definer set search_path='' as $$
declare who uuid:=auth.uid(); current_revision bigint; n bigint; e jsonb; field text; collection text; ids text[]:=array[]::text[];
begin
 if who is null then raise sqlstate 'PT401' using message='Authentication required'; end if;
 if expected_revision is null or expected_revision<0 then raise sqlstate 'PT400' using message='Invalid revision'; end if;
 if payload is null or jsonb_typeof(payload) is distinct from 'object'
  or payload->>'schema' is distinct from '3'
  or coalesce(payload->>'profile','') not in ('general','retail','food','service')
  or jsonb_typeof(payload->'entries') is distinct from 'array'
  or jsonb_typeof(payload->'items') is distinct from 'array'
  or jsonb_typeof(payload->'budgets') is distinct from 'array'
  or jsonb_typeof(payload->'goals') is distinct from 'array'
  or octet_length(payload::text)>15000000 then
  raise sqlstate 'PT400' using message='Invalid document';
 end if;
 if jsonb_array_length(payload->'entries')>20000 or jsonb_array_length(payload->'items')>2000
  or jsonb_array_length(payload->'budgets')>1200 or jsonb_array_length(payload->'goals')>100 then
  raise sqlstate 'PT400' using message='Document too large';
 end if;
 for e in select value from jsonb_array_elements(payload->'entries') loop
  if jsonb_typeof(e) is distinct from 'object' or e ? 'opening'
   or length(coalesce(e->>'id','')) not between 1 and 80
   or length(coalesce(e->>'note',''))>160
   or length(coalesce(e->>'category',''))>80
   or coalesce(e->>'book','') not in ('personal','business')
   or coalesce(e->>'type','') not in ('income','expense','purchase','waste','capital','draw','openingCash','borrow','lend','openingDebt','payment','refund','transfer')
   or coalesce(e->>'payment','') not in ('cash','credit')
   or jsonb_typeof(e->'deleted') is distinct from 'boolean'
   or coalesce(e->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then
   raise sqlstate 'PT400' using message='Invalid entry';
  end if;
  foreach field in array array['amount','directCost','fee','price','qty'] loop
   if jsonb_typeof(e->field) is distinct from 'number' or (e->>field)::numeric<0 or (e->>field)::numeric>1000000000000 or trunc((e->>field)::numeric)<>(e->>field)::numeric then
    raise sqlstate 'PT400' using message='Invalid amount';
   end if;
  end loop;
  if (e->>'qty')::numeric<1 or (e->>'qty')::numeric>1000000 then raise sqlstate 'PT400' using message='Invalid quantity';end if;
  foreach field in array array['discount','packaging'] loop
   if e ? field and (jsonb_typeof(e->field) is distinct from 'number' or (e->>field)::numeric<0 or (e->>field)::numeric>1000000000000 or trunc((e->>field)::numeric)<>(e->>field)::numeric) then
    raise sqlstate 'PT400' using message='Invalid sale cost';
   end if;
  end loop;
  foreach field in array array['id','book','type','date','note','category','ref','itemId','due','alias','payment','direction'] loop
   if jsonb_typeof(e->field) is distinct from 'string' or length(e->>field)>160 then raise sqlstate 'PT400' using message='Invalid entry text';end if;
  end loop;
  if e->>'direction' not in ('payable','receivable') or e->>'id'=any(ids) then raise sqlstate 'PT400' using message='Invalid identity or direction';end if;
  ids:=array_append(ids,e->>'id');
  if (e->>'date')::date not between date '1900-01-01' and date '2200-12-31' then raise sqlstate 'PT400' using message='Invalid date';end if;
  if e->>'due'<>'' and (e->>'due')::date<(e->>'date')::date then raise sqlstate 'PT400' using message='Invalid due date';end if;
 end loop;
 foreach collection in array array['items','budgets','goals'] loop
  for e in select value from jsonb_array_elements(payload->collection) loop
   if jsonb_typeof(e) is distinct from 'object' then raise sqlstate 'PT400' using message='Invalid record';end if;
   if collection='items' then
    foreach field in array array['id','name','unit','date'] loop
     if jsonb_typeof(e->field) is distinct from 'string' or length(e->>field) not between 1 and 80 then raise sqlstate 'PT400' using message='Invalid item';end if;
    end loop;
    foreach field in array array['openingQty','openingCost','minimum'] loop
     if jsonb_typeof(e->field) is distinct from 'number' or (e->>field)::numeric<0 or (e->>field)::numeric>1000000000000 or trunc((e->>field)::numeric)<>(e->>field)::numeric then raise sqlstate 'PT400' using message='Invalid stock';end if;
    end loop;
    if (e->>'openingQty')::numeric>1000000 or (e->>'minimum')::numeric>1000000 or (e->>'openingQty')::numeric*(e->>'openingCost')::numeric>1000000000000 or e->>'id'=any(ids) then raise sqlstate 'PT400' using message='Invalid stock bounds';end if;
    ids:=array_append(ids,e->>'id');
    if (e->>'date')::date not between date '1900-01-01' and date '2200-12-31' then raise sqlstate 'PT400' using message='Invalid item date';end if;
   elsif collection='budgets' then
    if jsonb_typeof(e->'category') is distinct from 'string' or length(e->>'category') not between 1 and 80 or coalesce(e->>'month','') !~ '^\d{4}-\d{2}$' or jsonb_typeof(e->'amount') is distinct from 'number' or (e->>'amount')::numeric<1 or (e->>'amount')::numeric>1000000000000 or trunc((e->>'amount')::numeric)<>(e->>'amount')::numeric then raise sqlstate 'PT400' using message='Invalid budget';end if;
   else
    if jsonb_typeof(e->'id') is distinct from 'string' or length(e->>'id') not between 1 and 80 or jsonb_typeof(e->'name') is distinct from 'string' or length(e->>'name') not between 1 and 80 then raise sqlstate 'PT400' using message='Invalid goal';end if;
    foreach field in array array['target','saved'] loop
     if jsonb_typeof(e->field) is distinct from 'number' or (e->>field)::numeric<0 or (e->>field)::numeric>1000000000000 or trunc((e->>field)::numeric)<>(e->>field)::numeric then raise sqlstate 'PT400' using message='Invalid goal amount';end if;
    end loop;
    if (e->>'target')::numeric<1 or (e->>'saved')::numeric>(e->>'target')::numeric then raise sqlstate 'PT400' using message='Invalid goal progress';end if;
   end if;
  end loop;
 end loop;
 -- Serializes initial insert as well as subsequent updates for this user only.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(who::text,0));
 select revision into current_revision from public.profitpilot_books where user_id=who for update;
 if coalesce(current_revision,0)<>expected_revision then raise sqlstate 'PT409' using message='Revision conflict'; end if;
 n:=expected_revision+1;
 insert into public.profitpilot_books(user_id,data,revision) values(who,payload,n)
 on conflict(user_id) do update set data=excluded.data, revision=n, updated_at=now();
 return n;
exception when invalid_datetime_format or datetime_field_overflow or invalid_text_representation then
 raise sqlstate 'PT400' using message='Invalid value';
end;$$;
revoke all on function public.save_profitpilot(jsonb,bigint) from public,anon;
grant execute on function public.save_profitpilot(jsonb,bigint) to authenticated;
commit;
