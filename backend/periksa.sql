-- =====================================================================
-- periksa.sql — jalankan SETELAH keempat migrasi.
-- Memberi satu tabel jawaban: mana yang sudah benar, mana yang belum.
-- Tidak mengubah apa pun. Aman dijalankan kapan saja, berkali-kali.
-- =====================================================================
with
t as (select count(*) n from pg_class c join pg_namespace s on s.oid=c.relnamespace
       where s.nspname='ajios' and c.relkind='r'),
r as (select count(*) n from pg_class c join pg_namespace s on s.oid=c.relnamespace
       where s.nspname='ajios' and c.relkind='r' and c.relrowsecurity),
p as (select count(*) n from pg_policies where schemaname='ajios'),
g as (select count(*) n from information_schema.role_table_grants
       where table_schema='ajios' and grantee='authenticated'),
c as (select count(*) n from ajios.consent_purpose),
f as (select count(*) n from pg_proc pr join pg_namespace s on s.oid=pr.pronamespace
       where s.nspname='ajios' and pr.proname in ('me','punya_peran','staf_sesi','boleh_promosi','hapus_data_pribadi')),
a as (select count(*) n from pg_proc pr join pg_namespace s on s.oid=pr.pronamespace
       where s.nspname='auth' and pr.proname='uid')
select * from (
  values
  ('1. Tabel di schema ajios',        (select n from t)::text, '26',  (select n from t)=26),
  ('2. Tabel dengan RLS aktif',       (select n from r)::text, '26',  (select n from r)=(select n from t) and (select n from t)>0),
  ('3. Kebijakan izin terpasang',     (select n from p)::text, '57',  (select n from p)>=50),
  ('4. Hak akses untuk authenticated',(select n from g)::text, 'ada', (select n from g)>0),
  ('5. Tujuan persetujuan terisi',    (select n from c)::text, '4',   (select n from c)=4),
  ('6. Fungsi penolong izin',         (select n from f)::text, '5',   (select n from f)=5),
  ('7. auth.uid() tersedia',          (select n from a)::text, '1',   (select n from a)=1)
) as x(pemeriksaan, hasil, diharapkan, lulus)
union all
select '>>> KESIMPULAN',
       case when (select n from t)=26 and (select n from r)=(select n from t)
                 and (select n from p)>=50 and (select n from g)>0
                 and (select n from c)=4 and (select n from f)=5
            then 'SEMUA BENAR' else 'ADA YANG BELUM' end,
       'SEMUA BENAR',
       ((select n from t)=26 and (select n from r)=(select n from t)
        and (select n from p)>=50 and (select n from g)>0
        and (select n from c)=4 and (select n from f)=5)
order by 1;
