-- =====================================================================
-- shim_lokal.sql — HANYA untuk pengujian di Postgres biasa.
-- JANGAN dijalankan di Supabase: di sana schema auth, auth.uid(), dan
-- peran authenticated/anon sudah ada, dan menimpanya berbahaya.
--
-- Tujuannya satu: membuat lingkungan lokal berperilaku sama seperti
-- Supabase, supaya kebijakan RLS yang sama bisa diuji sungguhan.
-- =====================================================================

create schema if not exists auth;

-- Di Supabase ini membaca klaim 'sub' dari JWT. Di sini dari setelan sesi.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;

grant usage on schema ajios, auth to anon, authenticated;
grant select, insert, update, delete on all tables in schema ajios to authenticated;
grant select on all tables in schema ajios to anon;
grant usage, select on all sequences in schema ajios to authenticated;
grant execute on all functions in schema ajios, auth to anon, authenticated;

alter default privileges in schema ajios
  grant select, insert, update, delete on tables to authenticated;

-- Berpura-pura menjadi seseorang, persis seperti permintaan ber-JWT.
create or replace function auth.masuk_sebagai(u uuid) returns void
language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), false);
  execute 'set role authenticated';
end $$;

create or replace function auth.keluar() returns void
language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', false);
  execute 'set role anon';
end $$;

-- kembali menjadi pemilik, untuk menyiapkan data uji berikutnya
create or replace function auth.jadi_pemilik() returns void
language plpgsql as $$ begin execute 'reset role'; perform set_config('request.jwt.claim.sub','',false); end $$;
