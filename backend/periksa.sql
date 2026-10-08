-- =====================================================================
-- periksa.sql — jalankan SETELAH pasang_semua.sql (lima migrasi).
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
       where s.nspname='ajios' and pr.proname in ('me','punya_peran','staf_sesi','boleh_promosi','hapus_data_pribadi',
                            'jml_pengirim','jml_responden','rekap_feedback','teks_feedback')),
a as (select count(*) n from pg_proc pr join pg_namespace s on s.oid=pr.pronamespace
       where s.nspname='auth' and pr.proname='uid'),
-- Definisi view dibaca dari katalog pg_views, BUKAN lewat
-- pg_get_viewdef('...'::regclass). Cast regclass pada teks tetap itu
-- dinilai saat rencana dibuat, jadi pada basis data yang view-nya belum
-- ada, seluruh pemeriksaan ini berhenti dengan error — padahal justru
-- itu keadaan yang harus dilaporkan, bukan ditabrak.
vdef as (select definition d from pg_views
          where schemaname = 'ajios' and viewname = 'progres_aktivitas'),
wdef as (select definition d from pg_views
          where schemaname = 'ajios' and viewname = 'tindak_lanjut_sesi'),
v as (select case when not exists (select 1 from vdef) then 0
                 when (select d from vdef) like '%jml_pengirim%' then 1
                 else 0 end n),
-- NP-V09: rekap evaluasi harus lewat fungsi agregat, dan view tindak lanjut
-- harus bergerbang staf_sesi() tanpa memuat isi rencana pribadi.
w as (select case when to_regprocedure('ajios.jml_responden(uuid)') is null then 0
                 when to_regprocedure('ajios.rekap_feedback(uuid)') is null then 0
                 when to_regprocedure('ajios.teks_feedback(uuid)') is null then 0
                 when to_regprocedure('ajios.rekap_wellbeing(uuid,int)') is null then 0
                 when not exists (select 1 from wdef) then 0
                 when (select d from wdef) !~* 'staf_sesi' then 0
                 when (select d from wdef)
                      ~* '\mtujuan\M|\mlangkah_7hari\M|\mdukungan\M' then 0
                 else 1 end n)
select * from (
  values
  ('1. Tabel di schema ajios',        (select n from t)::text, '26',  (select n from t)=26),
  ('2. Tabel dengan RLS aktif',       (select n from r)::text, '26',  (select n from r)=(select n from t) and (select n from t)>0),
  ('3. Kebijakan izin terpasang',     (select n from p)::text, '57',  (select n from p)>=50),
  ('4. Hak akses untuk authenticated',(select n from g)::text, 'ada', (select n from g)>0),
  ('5. Tujuan persetujuan terisi',    (select n from c)::text, '4',   (select n from c)=4),
  ('6. Fungsi penolong izin',         (select n from f)::text, '9',   (select n from f)=9),
  ('7. auth.uid() tersedia',          (select n from a)::text, '1',   (select n from a)=1),
  ('8. Progres agregat (bukan nol palsu)', (select n from v)::text, '1', (select n from v)=1),
  ('9. Rekap evaluasi (nol respons bukan nol)', (select n from w)::text, '1', (select n from w)=1)
) as x(pemeriksaan, hasil, diharapkan, lulus)
union all
select '>>> KESIMPULAN',
       case when (select n from t)=26 and (select n from r)=(select n from t)
                 and (select n from p)>=50 and (select n from g)>0
                 and (select n from c)=4 and (select n from f)=9
                 and (select n from v)=1 and (select n from w)=1
            then 'SEMUA BENAR' else 'ADA YANG BELUM' end,
       'SEMUA BENAR',
       ((select n from t)=26 and (select n from r)=(select n from t)
        and (select n from p)>=50 and (select n from g)>0
        and (select n from c)=4 and (select n from f)=9
        and (select n from v)=1 and (select n from w)=1)
order by 1;
