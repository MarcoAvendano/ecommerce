create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create sequence if not exists public.document_number_seq;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.generate_document_number(prefix text)
returns text
language plpgsql
as $$
declare
  next_value bigint;
begin
  next_value := nextval('public.document_number_seq');
  return upper(prefix) || '-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || lpad(next_value::text, 6, '0');
end;
$$;