-- =====================================================================
-- 0006_evaluasi.sql — ANGKA AGREGAT UNTUK EVALUASI (NP-V09)
--
-- Masalah yang sama seperti 0005, di tempat yang berbeda.
--
-- Kebijakan `fb_sendiri` membuat tabel feedback hanya terbaca pemiliknya,
-- dan `fb_admin` menambah admin. Itu benar. Tetapi akibatnya layar rekap
-- yang dibuka fasilitator akan menghitung dari nol baris dan menuliskan
-- "rata-rata 0" — padahal yang benar adalah "belum ada respons".
--
-- Ketentuan NP-V09 menyebutnya terang-terangan:
--   "Nol respons tidak menghasilkan rata-rata nol."
--   "Tidak merespons bukan otomatis gagal."
--   "Laporan selesai bukan hasil yang telah diverifikasi."
--   "Jangan memakai wellbeing sebagai ranking atau skor kelayakan."
--
-- Yang dibangun di sini:
--   jml_responden(sesi)    -> cacah responden; NULL bila tidak berhak
--   rekap_feedback(sesi)   -> rata-rata per pertanyaan angka, dengan
--                             penyebutnya sendiri. TIDAK ADA BARIS kalau
--                             belum ada respons — bukan baris bernilai 0.
--   teks_feedback(sesi)    -> jawaban teks TANPA identitas pengirim,
--                             beserta penanda apakah boleh dikutip
--   rekap_wellbeing(sesi)  -> agregat Life Circle, hanya kalau respondennya
--                             cukup banyak untuk tidak menunjuk orang
--   tindak_lanjut_sesi     -> view yang dijanjikan komentar di 0003:
--                             STATUS action plan untuk staf sesi, tanpa
--                             isi tujuan, langkah, atau bukti
--
-- Tidak satu pun fungsi di sini mengembalikan jawaban perorangan yang
-- bisa ditelusuri ke orangnya. Aman dijalankan ulang.
-- =====================================================================

set search_path = ajios, public;

-- ------------------------------------------------- cacah responden
create or replace function jml_responden(s uuid) returns int
language sql stable security definer set search_path = ajios, public as $$
  select case when staf_sesi(s)
              then (select count(*)::int from feedback where sesi_id = s)
              else null end;
$$;

comment on function jml_responden(uuid) is
  'Jumlah peserta yang mengirim evaluasi sesi. NULL bila pemanggil bukan staf '
  'sesi — NULL berarti tidak berhak menghitung, BUKAN nol responden.';

-- ------------------------------------------------- rekap angka
-- Satu baris per pertanyaan berjenis angka, dengan penyebutnya sendiri.
-- Pertanyaan yang tidak dijawab siapa pun TIDAK muncul sebagai 0: ia
-- tidak muncul sama sekali, dan layar yang memanggil wajib mengatakan
-- "belum ada respons" alih-alih menggambar angka.
create or replace function rekap_feedback(s uuid)
returns table(kunci text, jml int, rata numeric, terendah numeric, tertinggi numeric)
language sql stable security definer set search_path = ajios, public as $$
  select e.key::text,
         count(*)::int,
         round(avg((e.value #>> '{}')::numeric), 2),
         min((e.value #>> '{}')::numeric),
         max((e.value #>> '{}')::numeric)
    from feedback f, jsonb_each(f.jawaban) e
   where f.sesi_id = s
     and staf_sesi(s)
     and jsonb_typeof(e.value) = 'number'
   group by e.key
   order by e.key;
$$;

comment on function rekap_feedback(uuid) is
  'Rata-rata per pertanyaan angka, dengan jumlah penjawabnya. Nol respons '
  'menghasilkan NOL BARIS, bukan rata-rata nol. Tidak mengembalikan jawaban '
  'perorangan dan tidak mengembalikan person_id.';

-- ------------------------------------------------- jawaban teks
-- Tanpa person_id. Kutipan hanya boleh dipakai di luar kalau
-- boleh_dikutip bernilai benar — dan memilikinya pun bukan izin untuk
-- menerbitkan otomatis.
create or replace function teks_feedback(s uuid)
returns table(kunci text, isi text, boleh_dikutip boolean, dikirim_pada timestamptz)
language sql stable security definer set search_path = ajios, public as $$
  select e.key::text, e.value #>> '{}', f.boleh_dikutip, f.dikirim_pada
    from feedback f, jsonb_each(f.jawaban) e
   where f.sesi_id = s
     and staf_sesi(s)
     and jsonb_typeof(e.value) = 'string'
     and length(btrim(e.value #>> '{}')) > 0
   order by f.dikirim_pada, e.key;
$$;

comment on function teks_feedback(uuid) is
  'Jawaban teks evaluasi TANPA identitas pengirim. boleh_dikutip menandai '
  'izin mengutip yang diberikan peserta sendiri; izin itu bukan perintah '
  'menerbitkan, dan tidak ada yang diterbitkan otomatis.';

-- ------------------------------------------------- agregat wellbeing
-- Life Circle adalah refleksi pribadi. Di sini hanya agregat, dan hanya
-- kalau respondennya cukup banyak sehingga satu baris tidak menunjuk satu
-- orang. Bukan ranking, bukan skor kelayakan, bukan diagnosis.
create or replace function rekap_wellbeing(s uuid, minimum int default 5)
returns table(aspek text, jml int, rata numeric)
language sql stable security definer set search_path = ajios, public as $$
  with isi as (
    select sc.aspek, sc.nilai
      from life_circle_entry e
      join life_circle_score sc on sc.entry_id = e.id
     where e.sesi_id = s and e.baseline and sc.nilai is not null
  ), orang as (
    select count(distinct e.person_id)::int n
      from life_circle_entry e
     where e.sesi_id = s and e.baseline
  )
  select i.aspek, count(*)::int, round(avg(i.nilai), 2)
    from isi i
   where staf_sesi(s)
     and (select n from orang) >= greatest(minimum, 1)
   group by i.aspek
   order by i.aspek;
$$;

comment on function rekap_wellbeing(uuid, int) is
  'Agregat Life Circle per aspek, hanya bila jumlah pengisi mencapai batas '
  'minimum supaya tidak menunjuk orang tertentu. BUKAN ranking, bukan skor '
  'kelayakan, bukan diagnosis. Nilai 0 adalah jawaban sah; aspek yang '
  'dilewati (NULL) tidak ikut dihitung dan tidak dianggap nol.';

-- ------------------------------------------------- tindak lanjut
-- View yang dijanjikan komentar di 0003_rls.sql: staf sesi melihat STATUS
-- action plan untuk menindaklanjuti, TANPA isi tujuan, langkah, dukungan,
-- atau bukti. Gerbangnya ada di dalam view: staf_sesi(ap.sesi_id).
drop view if exists tindak_lanjut_sesi;
create view tindak_lanjut_sesi
with (security_invoker = false) as
select ap.sesi_id,
       p.id   as person_id,
       p.nama,
       ap.status,
       ap.diperbarui_pada,
       (ap.bukti is not null and length(btrim(ap.bukti)) > 0) as ada_catatan_bukti,
       (ap.tenggat is not null and ap.tenggat < current_date
        and ap.status <> 'Dilaporkan selesai')                as lewat_tenggat
  from action_plan ap
  join person p on p.id = ap.person_id
 where staf_sesi(ap.sesi_id);

comment on view tindak_lanjut_sesi is
  'Status action plan peserta untuk tindak lanjut staf sesi. Isi tujuan, '
  'langkah, dukungan, dan bukti TIDAK ikut — hanya ada/tidaknya catatan '
  'bukti. "Dilaporkan selesai" adalah laporan peserta, bukan hasil yang '
  'sudah diverifikasi, dan "Belum diperbarui" bukan kegagalan.';

-- ------------------------------------------------- hak akses
grant execute on function jml_responden(uuid)        to anon, authenticated, service_role;
grant execute on function rekap_feedback(uuid)       to anon, authenticated, service_role;
grant execute on function teks_feedback(uuid)        to anon, authenticated, service_role;
grant execute on function rekap_wellbeing(uuid, int) to anon, authenticated, service_role;
grant select  on tindak_lanjut_sesi                  to anon, authenticated, service_role;

-- ------------------------------------------------- pemeriksaan sendiri
do $$
declare hilang text := '';
begin
  if to_regprocedure('ajios.jml_responden(uuid)') is null then hilang := hilang || ' jml_responden'; end if;
  if to_regprocedure('ajios.rekap_feedback(uuid)') is null then hilang := hilang || ' rekap_feedback'; end if;
  if to_regprocedure('ajios.teks_feedback(uuid)') is null then hilang := hilang || ' teks_feedback'; end if;
  if to_regprocedure('ajios.rekap_wellbeing(uuid,int)') is null then hilang := hilang || ' rekap_wellbeing'; end if;
  if to_regclass('ajios.tindak_lanjut_sesi') is null then hilang := hilang || ' tindak_lanjut_sesi'; end if;
  if hilang <> '' then
    raise exception 'Belum terpasang:%', hilang;
  end if;

  -- View tindak lanjut TIDAK BOLEH membocorkan isi rencana pribadi.
  if pg_get_viewdef('ajios.tindak_lanjut_sesi'::regclass) ~* '\mtujuan\M|\mlangkah_7hari\M|\mdukungan\M' then
    raise exception 'tindak_lanjut_sesi memuat isi rencana pribadi — '
      'hanya status yang boleh terlihat oleh staf sesi.';
  end if;
  if pg_get_viewdef('ajios.tindak_lanjut_sesi'::regclass) !~* 'staf_sesi' then
    raise exception 'tindak_lanjut_sesi tidak punya gerbang staf_sesi() — '
      'tanpa itu view ini terbuka untuk siapa pun yang bisa membacanya.';
  end if;

  raise notice 'Evaluasi NP-V09 terpasang: rekap agregat tanpa jawaban perorangan.';
end $$;
