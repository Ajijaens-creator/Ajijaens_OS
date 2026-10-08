-- =====================================================================
-- 0005_progres.sql — ANGKA AGREGAT UNTUK FASILITATOR
--
-- Masalah yang diperbaiki di sini, ditemukan saat menguji layar kendali:
--
--   Kebijakan `resp_sendiri` membuat activity_response hanya terbaca oleh
--   PEMILIKNYA. Itu benar dan harus tetap begitu — fasilitator tidak boleh
--   membaca jawaban perorangan. Tetapi akibatnya, hitungan
--   `count(distinct person_id)` yang dijalankan fasilitator selalu
--   menghasilkan 0, termasuk di view `progres_aktivitas` yang memakai
--   security_invoker. Layar kendali lalu menuliskan
--   "0 dari 12 peserta hadir sudah mengirim" — sebuah PERNYATAAN SALAH,
--   bukan keadaan kosong. Itu jenis kebohongan yang paling berbahaya,
--   karena terlihat seperti data.
--
-- Perbaikannya: satu fungsi SECURITY DEFINER yang mengembalikan HANYA
-- JUMLAH, dan memeriksa sendiri apakah pemanggilnya staf sesi itu.
--   - staf sesi / admin  -> angka sebenarnya
--   - siapa pun lain     -> NULL, bukan 0
--
-- NULL dan 0 wajib dibedakan di antarmuka: NULL berarti "tidak berhak
-- menghitung", 0 berarti "berhak, dan memang belum ada yang mengirim".
--
-- Fungsi ini tidak pernah mengembalikan isi jawaban, hanya cacahnya.
-- Aman dijalankan ulang.
-- =====================================================================

set search_path = ajios, public;

-- ------------------------------------------------- jumlah pengirim
create or replace function jml_pengirim(a uuid) returns int
language sql stable security definer set search_path = ajios, public as $$
  select case
    when staf_sesi((select sesi_id from activity where id = a))
    then (select count(distinct ar.person_id)::int
            from activity_response ar
           where ar.activity_id = a
             and ar.dikirim_pada is not null)
    else null
  end;
$$;

comment on function jml_pengirim(uuid) is
  'Jumlah peserta unik yang sudah mengirim pada satu aktivitas. '
  'Hanya cacah, tidak pernah isi jawaban. NULL bila pemanggil bukan staf sesi — '
  'NULL berarti tidak berhak menghitung, BUKAN nol.';

-- ------------------------------------------------- view progres
-- Dibuat ulang supaya `pengirim` memakai fungsi di atas. Sisanya tetap
-- security_invoker: kehadiran dan pendaftaran memang sudah punya
-- kebijakan yang mengizinkan staf sesi membacanya.
drop view if exists progres_aktivitas;
create view progres_aktivitas
with (security_invoker = true) as
select act.id as activity_id, act.sesi_id, act.judul, act.status,
       jml_pengirim(act.id) as pengirim,
       (select count(*) from attendance a
         where a.sesi_id = act.sesi_id and a.hadir) as hadir,
       (select count(*) from session_registration r
         where r.sesi_id = act.sesi_id) as terdaftar
from activity act;

comment on view progres_aktivitas is
  'Progres agregat per aktivitas. `pengirim` NULL = tidak berhak menghitung, '
  'bukan nol. Penyebut yang dipakai di layar adalah `hadir`, dan itu disebutkan.';

-- ------------------------------------------------- hak akses
-- 0004 sudah memberi hak pada SEMUA fungsi dan tabel yang ada SAAT ITU.
-- Yang dibuat di berkas ini perlu diberi hak sendiri.
grant execute on function jml_pengirim(uuid) to anon, authenticated, service_role;
grant select  on progres_aktivitas         to anon, authenticated, service_role;

-- ------------------------------------------------- pemeriksaan sendiri
do $$
declare t text;
begin
  if to_regprocedure('ajios.jml_pengirim(uuid)') is null then
    raise exception 'jml_pengirim belum terpasang.';
  end if;
  select pg_get_viewdef('ajios.progres_aktivitas'::regclass) into t;
  if position('jml_pengirim' in t) = 0 then
    raise exception 'progres_aktivitas masih memakai hitungan langsung — '
      'fasilitator akan melihat 0 pengirim terus-menerus.';
  end if;
  raise notice 'Progres agregat terpasang: pengirim dihitung lewat jml_pengirim().';
end $$;
