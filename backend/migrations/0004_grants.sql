-- =====================================================================
-- 0004_grants.sql — HAK AKSES SCHEMA UNTUK SUPABASE
--
-- Tanpa berkas ini, ketiga migrasi sebelumnya berhasil dijalankan tetapi
-- aplikasi tetap tidak bisa membaca apa pun: schema `ajios` belum diberi
-- hak pakai, jadi PostgREST menolak setiap permintaan dengan 42501.
--
-- Hak di sini adalah hak LUAS (boleh menyentuh tabel). Yang menentukan
-- BARIS mana yang boleh dilihat tetap kebijakan RLS di 0003. Dua lapis:
-- tanpa grant tidak bisa masuk pintu; tanpa RLS bisa masuk tapi tidak
-- melihat apa-apa. Keduanya harus ada.
--
-- Jalankan SETELAH 0003_rls.sql. Aman dijalankan ulang.
-- =====================================================================

do $$
begin
  -- Di Postgres biasa peran ini belum tentu ada; di Supabase sudah.
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls; end if;
end $$;

grant usage on schema ajios to anon, authenticated, service_role;

grant select                         on all tables   in schema ajios to anon;
grant select, insert, update, delete on all tables   in schema ajios to authenticated;
grant all                            on all tables   in schema ajios to service_role;
grant usage, select                  on all sequences in schema ajios to authenticated, service_role;
grant execute                        on all functions in schema ajios to anon, authenticated, service_role;

-- Tabel yang dibuat migrasi berikutnya ikut mendapat hak yang sama.
alter default privileges in schema ajios
  grant select on tables to anon;
alter default privileges in schema ajios
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema ajios
  grant all on tables to service_role;
alter default privileges in schema ajios
  grant usage, select on sequences to authenticated, service_role;
alter default privileges in schema ajios
  grant execute on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- PEMERIKSAAN SENDIRI — gagalkan migrasi kalau ada tabel tanpa RLS.
-- Satu tabel tanpa RLS adalah pintu terbuka, dan lebih baik ketahuan
-- sekarang daripada saat peserta pertama mendaftar.
-- ---------------------------------------------------------------------
do $$
declare lepas text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into lepas
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'ajios' and c.relkind = 'r' and not c.relrowsecurity;
  if lepas is not null then
    raise exception 'TABEL TANPA RLS: %. Jalankan 0003_rls.sql lebih dulu.', lepas;
  end if;
  raise notice 'Pemeriksaan lulus: seluruh tabel ajios punya RLS aktif.';
end $$;
