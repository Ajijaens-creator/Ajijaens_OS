-- =====================================================================
-- PASANG SEMUA — AJI JAENS OS, fondasi backend (NP-V00)
--
-- Satu berkas, satu kali tempel, satu kali Run.
-- Dibungkus transaksi: kalau ada satu saja yang gagal, SELURUHNYA
-- dibatalkan dan basis data kembali seperti semula. Tidak ada keadaan
-- setengah jadi — dan keadaan setengah jadi itulah yang berbahaya,
-- karena tabel bisa berdiri tanpa pembatasan akses.
--
-- Berkas ini DIRAKIT oleh rakit.sh dari folder migrations/. Jangan diedit
-- langsung: suntingan di sini akan hilang pada perakitan berikutnya.
--
-- Setelah ini berhasil, jalankan periksa.sql di query terpisah.
-- =====================================================================
BEGIN;


-- ################################################################
-- ###  BAGIAN: 0001_schema.sql
-- ################################################################

-- =====================================================================
-- NP-V00 · FONDASI BACKEND AJI JAENS OS
-- 0001_schema.sql — struktur data
--
-- Acuan: model data NP-V05, Ketentuan Bersama, Aturan 5 Master Transfer
-- Pack ("privacy ditegakkan di backend"), dan PP 33/2026.
--
-- Dapat dijalankan ulang tanpa duplikasi: semua objek pakai IF NOT EXISTS
-- atau CREATE OR REPLACE. Tidak ada DROP, tidak ada data yang hilang.
-- =====================================================================

create extension if not exists "pgcrypto";

create schema if not exists ajios;
set search_path = ajios, public;

-- ---------------------------------------------------------------- enum
do $$ begin
  create type peran_internal as enum ('admin','fasilitator','operator','cs');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kategori_peserta as enum
    ('Siswa SMA','Mahasiswa','Pengusaha Pemula','Pengusaha 5th+','Pengusaha 10th+');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bentuk_usaha as enum
    ('Belum dibentuk','Usaha perorangan','CV','Firma','PT Perorangan','PT','Koperasi','Yayasan','Lainnya');
exception when duplicate_object then null; end $$;

-- Rentang omzet. 'Belum bersedia' BUKAN nol dan BUKAN kosong — tiga hal berbeda.
do $$ begin
  create type rentang_omzet as enum
    ('Belum menghasilkan','<100 juta','100-<500 juta','500 juta-<1 miliar',
     '1-<5 miliar','5-<10 miliar','>=10 miliar','Belum bersedia mengisi');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_sesi as enum ('Draft','Terjadwal','Berlangsung','Selesai','Dibatalkan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_aktivitas as enum ('Belum dibuka','Dibuka','Ditutup');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_komunitas as enum ('Belum bergabung','Berminat','Diundang','Member aktif','Tidak aktif','Keluar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_tugas as enum ('Terjadwal','Dikerjakan','Selesai','Dibatalkan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_action_plan as enum
    ('Belum diperbarui','Dilaporkan berjalan','Dilaporkan selesai','Perlu bantuan');
exception when duplicate_object then null; end $$;

-- Enam dasar pemrosesan, Pasal 20 UU 27/2022
do $$ begin
  create type dasar_pemrosesan as enum
    ('Persetujuan','Perjanjian','Kewajiban hukum','Kepentingan vital',
     'Pelayanan publik','Kepentingan sah lain');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------- orang & akun
-- Akun (login), profil orang, dan pendaftaran sesi SENGAJA dipisah.
-- Satu orang bisa ada tanpa akun (diimpor), dan login bukan kehadiran.

create table if not exists person (
  id            uuid primary key default gen_random_uuid(),
  nama          text not null,
  whatsapp      text,
  email         text,
  kategori      kategori_peserta,
  kota          text,
  catatan       text,
  -- auth.users.id Supabase. NULL = orang ini belum punya akun.
  auth_user_id  uuid unique,
  sumber_masuk  text,
  dibuat_pada   timestamptz not null default now(),
  diubah_pada   timestamptz not null default now(),
  dibuat_oleh   uuid
);
comment on column person.auth_user_id is
  'Akun login. NULL berarti orang ini ada di basis data tetapi belum pernah login.';

-- Peran internal. Tidak disimpan di person: peran adalah hak akses, bukan identitas.
create table if not exists staff (
  auth_user_id  uuid primary key,
  peran         peran_internal not null,
  aktif         boolean not null default true,
  dibuat_pada   timestamptz not null default now()
);

create table if not exists education_profile (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references person(id) on delete cascade,
  jenjang     text,
  institusi   text,
  jurusan     text,
  kelas       text,
  semester    int,
  diubah_pada timestamptz not null default now()
);

create table if not exists business (
  id              uuid primary key default gen_random_uuid(),
  nama            text not null,
  brand           text,
  tahun_mulai     int,
  tanggal_mulai   date,
  industri        text,
  bidang          text,
  bentuk          bentuk_usaha,
  tim_aktif       int,
  omzet_rentang   rentang_omzet,
  omzet_nominal   numeric,
  omzet_periode   text,
  -- Omzet adalah PERNYATAAN peserta, bukan angka teraudit.
  omzet_sumber    text not null default 'Pernyataan peserta',
  dibuat_pada     timestamptz not null default now(),
  diubah_pada     timestamptz not null default now()
);
comment on column business.tahun_mulai is
  'Kalau hanya tahun yang diketahui, usia usaha adalah PERKIRAAN. Pakai tanggal_mulai bila ada.';
comment on column business.omzet_rentang is
  'Belum menghasilkan / Belum bersedia mengisi / NULL adalah tiga keadaan berbeda. Bukan nol.';

-- Satu orang bisa punya banyak usaha; satu usaha bisa punya banyak pemilik.
-- Nama sama TIDAK cukup untuk menggabungkan usaha.
create table if not exists business_relationship (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references person(id) on delete cascade,
  business_id  uuid not null references business(id) on delete cascade,
  peran        text not null default 'Pemilik',
  utama        boolean not null default false,
  mulai        date,
  selesai      date,
  unique (person_id, business_id, peran)
);

-- ------------------------------------------------------------- sesi
create table if not exists sesi (
  id              uuid primary key default gen_random_uuid(),
  judul           text not null,
  program_ref     text,              -- id PRG di aplikasi OS
  program_versi   text,
  mulai_pada      timestamptz,
  zona_waktu      text not null default 'Asia/Makassar',
  durasi_menit    int,
  lokasi          text,
  daring          boolean not null default false,
  kapasitas       int,
  status          status_sesi not null default 'Draft',
  kode_sesi       text unique,
  -- timer: dihitung dari waktu nyata, tidak reset karena refresh
  dimulai_pada    timestamptz,
  jeda_detik      int not null default 0,
  diakhiri_pada   timestamptz,
  dibuat_pada     timestamptz not null default now()
);

create table if not exists sesi_staff (
  sesi_id       uuid not null references sesi(id) on delete cascade,
  auth_user_id  uuid not null,
  peran         peran_internal not null,
  primary key (sesi_id, auth_user_id)
);

create table if not exists session_registration (
  id            uuid primary key default gen_random_uuid(),
  sesi_id       uuid not null references sesi(id) on delete cascade,
  person_id     uuid not null references person(id) on delete cascade,
  terdaftar_pada timestamptz not null default now(),
  impian        text,
  tantangan     text,
  harapan       text,
  unique (sesi_id, person_id)
);

-- Terdaftar BERBEDA dari hadir. Check-in adalah peristiwa tersendiri.
create table if not exists attendance (
  id             uuid primary key default gen_random_uuid(),
  sesi_id        uuid not null references sesi(id) on delete cascade,
  person_id      uuid not null references person(id) on delete cascade,
  hadir          boolean not null default true,
  check_in_pada  timestamptz not null default now(),
  dicatat_oleh   uuid,
  metode         text not null default 'Mandiri',
  alasan_koreksi text,
  unique (sesi_id, person_id)      -- cegah hitungan ganda
);

-- --------------------------------------------------------- aktivitas
create table if not exists activity (
  id           uuid primary key default gen_random_uuid(),
  sesi_id      uuid not null references sesi(id) on delete cascade,
  kode         text not null,
  judul        text not null,
  jenis        text not null,      -- life_circle | kuis | refleksi | action_plan | skala
  status       status_aktivitas not null default 'Belum dibuka',
  dibuka_pada  timestamptz,
  ditutup_pada timestamptz,
  terima_setelah_tutup boolean not null default false,
  unique (sesi_id, kode)
);

create table if not exists activity_response (
  id            uuid primary key default gen_random_uuid(),
  activity_id   uuid not null references activity(id) on delete cascade,
  person_id     uuid not null references person(id) on delete cascade,
  draft         jsonb,
  jawaban       jsonb,
  dikirim_pada  timestamptz,
  diubah_pada   timestamptz not null default now(),
  unique (activity_id, person_id)  -- cegah submit ganda
);

-- Life Circle: template berversi, skor 0-10 integer, NULL = belum dijawab.
create table if not exists life_circle_template (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  versi       int not null default 1,
  aspek       jsonb not null,
  aktif       boolean not null default true,
  unique (nama, versi)
);

create table if not exists life_circle_entry (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid not null references person(id) on delete cascade,
  sesi_id       uuid references sesi(id) on delete set null,
  template_id   uuid not null references life_circle_template(id),
  template_versi int not null,
  baseline      boolean not null default false,
  aspek_prioritas text,
  langkah_7hari text,
  diisi_pada    timestamptz not null default now()
);

create table if not exists life_circle_score (
  entry_id  uuid not null references life_circle_entry(id) on delete cascade,
  aspek     text not null,
  -- NULL = belum dijawab. 0 = jawaban sah. Dua hal berbeda.
  nilai     int check (nilai is null or (nilai between 0 and 10)),
  primary key (entry_id, aspek)
);

create table if not exists action_plan (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid not null references person(id) on delete cascade,
  sesi_id       uuid references sesi(id) on delete set null,
  tujuan        text,
  langkah_7hari text,
  tenggat       date,
  dukungan      text,
  status        status_action_plan not null default 'Belum diperbarui',
  bukti         text,
  diperbarui_pada timestamptz,
  dibuat_pada   timestamptz not null default now()
);
comment on column action_plan.status is
  'Dilaporkan selesai BUKAN hasil terverifikasi. Tidak merespons BUKAN gagal.';

create table if not exists feedback (
  id            uuid primary key default gen_random_uuid(),
  sesi_id       uuid not null references sesi(id) on delete cascade,
  person_id     uuid not null references person(id) on delete cascade,
  template_versi int not null default 1,
  jawaban       jsonb not null,
  boleh_dikutip boolean not null default false,
  dikirim_pada  timestamptz not null default now(),
  unique (sesi_id, person_id)
);

create table if not exists pertanyaan (
  id            uuid primary key default gen_random_uuid(),
  sesi_id       uuid not null references sesi(id) on delete cascade,
  person_id     uuid references person(id) on delete set null,
  isi           text not null,
  tanpa_nama    boolean not null default true,
  ditinjau      boolean not null default false,
  ditayangkan   boolean not null default false,
  terjawab      boolean not null default false,
  dikirim_pada  timestamptz not null default now()
);

-- ------------------------------------------------- komunitas & CRM
create table if not exists community_membership (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid not null references person(id) on delete cascade,
  komunitas     text not null default '#mulaiajadulu',
  status        status_komunitas not null default 'Belum bergabung',
  -- Member aktif HANYA setelah peserta mengkonfirmasi sendiri.
  dikonfirmasi_peserta boolean not null default false,
  dikonfirmasi_pada    timestamptz,
  diubah_pada   timestamptz not null default now(),
  unique (person_id, komunitas)
);

create table if not exists interaction (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references person(id) on delete cascade,
  kanal       text,
  ringkasan   text,
  terjadi_pada timestamptz not null default now(),
  dicatat_oleh uuid
);

create table if not exists follow_up_task (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references person(id) on delete cascade,
  sesi_id     uuid references sesi(id) on delete set null,
  tujuan      text not null,
  pic         uuid,
  jadwal      date,
  kanal       text,
  catatan     text,
  status      status_tugas not null default 'Terjadwal',
  dibuat_pada timestamptz not null default now(),
  -- cegah tugas ganda untuk follow-up yang sama
  unique (person_id, sesi_id, tujuan)
);
comment on table follow_up_task is
  'Membuat tugas TIDAK mengirim pesan apa pun. Ini pencatatan, bukan pengiriman.';

create table if not exists bonus_event (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references person(id) on delete cascade,
  jenis       text not null,   -- follow_ig_dikonfirmasi | klik_spotify
  terjadi_pada timestamptz not null default now(),
  catatan     text
);
comment on table bonus_event is
  'Klik Spotify adalah peristiwa klik, BUKAN bukti selesai mendengarkan. '
  'Follow IG adalah pernyataan peserta, BUKAN terverifikasi otomatis.';

create index if not exists idx_person_auth on person(auth_user_id);
create index if not exists idx_reg_sesi on session_registration(sesi_id);
create index if not exists idx_att_sesi on attendance(sesi_id);
create index if not exists idx_resp_act on activity_response(activity_id);
create index if not exists idx_lce_person on life_circle_entry(person_id);
create index if not exists idx_br_person on business_relationship(person_id);

-- ################################################################
-- ###  BAGIAN: 0002_pdp.sql
-- ################################################################

-- =====================================================================
-- 0002_pdp.sql — PP 33/2026 & UU 27/2022
--
-- Berlaku 16 Januari 2027. Yang dibangun di sini BUKAN pelengkap:
-- tanpa ini, mengumpulkan data peserta tidak punya dasar dan tidak punya
-- jalan keluar bagi orang yang ingin datanya dihapus.
--
-- Ini struktur teknis, bukan nasihat hukum. Cakupan "data spesifik"
-- (termasuk apakah Wellbeing Life Circle termasuk) perlu dipastikan
-- penasihat hukum, bukan oleh sistem ini.
-- =====================================================================

set search_path = ajios, public;

-- --------------------------------------------------------- persetujuan
-- Satu baris per tujuan. TIDAK ada satu kotak centang untuk semuanya.
-- Persetujuan promosi tidak boleh menjadi syarat menerima materi.
create table if not exists consent_purpose (
  kode        text primary key,
  nama        text not null,
  deskripsi   text not null,
  dasar       dasar_pemrosesan not null,
  wajib       boolean not null default false,
  versi       int not null default 1
);

insert into consent_purpose (kode, nama, deskripsi, dasar, wajib) values
  ('kegiatan',  'Penyelenggaraan kegiatan',
   'Memproses pendaftaran, kehadiran, materi, dan aktivitas sesi yang Anda ikuti.',
   'Perjanjian', true),
  ('komunitas', 'Keanggotaan #mulaiajadulu',
   'Mencatat minat dan keanggotaan Anda di komunitas belajar.',
   'Persetujuan', false),
  ('promosi',   'Informasi program',
   'Mengirimkan kabar program berikutnya. Tidak menjadi syarat menerima materi.',
   'Persetujuan', false),
  ('riset',     'Ringkasan tanpa identitas',
   'Memakai jawaban Anda dalam ringkasan kelas tanpa identitas.',
   'Persetujuan', false)
on conflict (kode) do nothing;

create table if not exists consent (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references person(id) on delete cascade,
  purpose      text not null references consent_purpose(kode),
  diberikan    boolean not null,
  versi        int not null default 1,
  -- bukti kapan dan dari mana, Pasal 20 UU 27/2022
  pada         timestamptz not null default clock_timestamp(),
  -- Pemutus seri: dua perubahan pada detik yang sama tetap punya urutan pasti.
  -- Tanpa ini, "persetujuan terakhir" bisa terbaca terbalik.
  urut         bigserial not null,
  sumber       text,
  teks_saat_itu text,
  dicabut_pada timestamptz
);
create index if not exists idx_consent_person on consent(person_id, purpose);

comment on table consent is
  'Histori, bukan keadaan. Pencabutan ditambahkan sebagai baris baru — '
  'baris lama tidak dihapus, supaya riwayatnya tetap dapat dibuktikan.';

-- Keadaan persetujuan terkini, dibaca dari baris terakhir per tujuan.
create or replace view consent_now as
select distinct on (person_id, purpose)
  person_id, purpose, diberikan, versi, pada, dicabut_pada, urut
from consent
order by person_id, purpose, pada desc, urut desc;

-- Boleh dikirimi promosi?
create or replace function boleh_promosi(p uuid) returns boolean
language sql stable as $$
  select coalesce((select diberikan and dicabut_pada is null
                   from consent_now where person_id = p and purpose = 'promosi'), false);
$$;

-- ------------------------------------------------- hak subjek data
-- Pasal 20-27 PP 33/2026: kanal permohonan yang mudah diakses.
do $$ begin
  create type jenis_permohonan as enum
    ('Akses','Perbaikan','Penghapusan','Penarikan persetujuan',
     'Pembatasan pemrosesan','Portabilitas','Keberatan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_permohonan as enum ('Diterima','Diverifikasi','Dipenuhi','Ditolak');
exception when duplicate_object then null; end $$;

create table if not exists data_subject_request (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid references person(id) on delete set null,
  pemohon_email text,
  jenis         jenis_permohonan not null,
  isi           text,
  status        status_permohonan not null default 'Diterima',
  diterima_pada timestamptz not null default now(),
  diverifikasi_pada timestamptz,
  diputuskan_pada   timestamptz,
  alasan_penolakan  text,
  ditangani_oleh    uuid
);
comment on table data_subject_request is
  'Permohonan hak subjek data wajib punya kanal yang mudah diakses, '
  'wajib diverifikasi, dan keputusannya — dipenuhi atau ditolak — wajib dicatat.';

-- ------------------------------------------------ kegagalan pelindungan
-- Pasal 114-119: pemberitahuan tertulis paling lambat 3x24 jam.
create table if not exists breach_log (
  id              uuid primary key default gen_random_uuid(),
  diketahui_pada  timestamptz not null,
  ringkasan       text not null,
  data_terdampak  text,
  jumlah_subjek   int,
  -- 3x24 jam dihitung dari saat diketahui secara pasti.
  -- Bukan kolom generated: timestamptz + interval bergantung zona waktu,
  -- jadi Postgres menolaknya sebagai nilai tetap. Diisi trigger di bawah.
  batas_lapor     timestamptz,
  lapor_subjek_pada  timestamptz,
  lapor_lembaga_pada timestamptz,
  lapor_publik_pada  timestamptz,
  tindakan        text,
  ditutup_pada    timestamptz
);

-- batas_lapor selalu 3x24 jam dari diketahui_pada, tidak bisa diakali manual.
create or replace function set_batas_lapor() returns trigger
language plpgsql as $$
begin
  new.batas_lapor := new.diketahui_pada + interval '72 hours';
  return new;
end $$;
drop trigger if exists trg_batas_lapor on breach_log;
create trigger trg_batas_lapor before insert or update of diketahui_pada on breach_log
  for each row execute function set_batas_lapor();

create or replace view breach_terlambat as
select id, diketahui_pada, batas_lapor, ringkasan,
       (lapor_lembaga_pada is null or lapor_lembaga_pada > batas_lapor) as lembaga_lewat,
       (lapor_subjek_pada  is null or lapor_subjek_pada  > batas_lapor) as subjek_lewat
from breach_log
where now() > batas_lapor and (lapor_lembaga_pada is null or lapor_subjek_pada is null);

-- -------------------------------------------------------------- audit
-- Setiap pembacaan data pribadi oleh peran internal dicatat.
create table if not exists audit_log (
  id           bigserial primary key,
  pada         timestamptz not null default now(),
  auth_user_id uuid,
  aksi         text not null,
  tabel        text,
  baris_id     uuid,
  person_id    uuid,
  keterangan   text
);
create index if not exists idx_audit_person on audit_log(person_id, pada desc);

create or replace function catat_audit(
  p_aksi text, p_tabel text, p_baris uuid, p_person uuid, p_ket text default null)
returns void language plpgsql security definer set search_path = ajios, public as $$
begin
  insert into audit_log (auth_user_id, aksi, tabel, baris_id, person_id, keterangan)
  values (auth.uid(), p_aksi, p_tabel, p_baris, p_person, p_ket);
end $$;

-- ------------------------------------------- penghapusan yang benar
-- Menghapus orang TIDAK boleh menghapus jejak hukumnya (consent, audit,
-- permohonan). Yang dihapus adalah data pribadinya.
create or replace function hapus_data_pribadi(p uuid, alasan text)
returns void language plpgsql security definer set search_path = ajios, public as $$
begin
  perform catat_audit('HAPUS_DATA_PRIBADI','person',p,p,alasan);
  update person set nama = 'Dihapus atas permintaan', whatsapp = null, email = null,
                    kota = null, catatan = null, auth_user_id = null, diubah_pada = now()
   where id = p;
  delete from education_profile where person_id = p;
  delete from life_circle_score where entry_id in (select id from life_circle_entry where person_id = p);
  delete from life_circle_entry where person_id = p;
  delete from activity_response where person_id = p;
  delete from action_plan where person_id = p;
  delete from feedback where person_id = p;
  update pertanyaan set person_id = null where person_id = p;
  delete from interaction where person_id = p;
  delete from bonus_event where person_id = p;
  -- consent, data_subject_request, dan audit_log SENGAJA dipertahankan:
  -- itu bukti bahwa penghapusan ini sah dan sudah dilakukan.
end $$;

-- ################################################################
-- ###  BAGIAN: 0003_rls.sql
-- ################################################################

-- =====================================================================
-- 0003_rls.sql — PENEGAKAN IZIN DI BASIS DATA
--
-- Aturan 5 Master Transfer Pack: "privacy ditegakkan di backend".
-- Ketentuan Bersama: "Jangan menganggap menyembunyikan tombol sebagai
-- penegakan izin."
--
-- Di sini izin ditegakkan oleh Postgres pada SETIAP baris, setiap query.
-- Kalau antarmuka salah, basis data tetap menolak.
--
-- Peran:
--   peserta      — hanya barisnya sendiri. Tidak bisa melihat peserta lain.
--   operator     — check-in dan buka/tutup aktivitas sesi yang ditugaskan.
--   fasilitator  — daftar hadir, progres agregat, pertanyaan. TIDAK bisa
--                  membaca Life Circle, feedback perorangan, atau omzet.
--   cs           — kontak dan tindak lanjut. TIDAK bisa membaca omzet
--                  atau jawaban pribadi.
--   admin        — CRM penuh termasuk usaha dan omzet, dengan audit.
-- =====================================================================

set search_path = ajios, public;

-- ---------------------------------------------------------------------
-- PRASYARAT. Seluruh kebijakan di bawah bergantung pada auth.uid().
-- Di Supabase fungsi ini sudah ada. Di Postgres biasa belum — dan tanpa
-- penjaga ini, migrasi gagal di tengah dengan pesan yang membingungkan,
-- meninggalkan basis data TANPA RLS sama sekali: terbuka untuk siapa pun.
-- ---------------------------------------------------------------------
do $$
begin
  if to_regprocedure('auth.uid()') is null then
    raise exception using message =
      'auth.uid() tidak ditemukan. Di Supabase fungsi ini sudah tersedia. '
      'Di PostgreSQL biasa, jalankan test/shim_lokal.sql lebih dulu. '
      'JANGAN lanjut tanpa ini: tabel akan berdiri tanpa pembatasan akses.';
  end if;
end $$;


-- ------------------------------------------------------- penolong
create or replace function me() returns uuid
language sql stable security definer set search_path = ajios, public as $$
  select id from person where auth_user_id = auth.uid();
$$;

create or replace function punya_peran(variadic p peran_internal[]) returns boolean
language sql stable security definer set search_path = ajios, public as $$
  select exists (select 1 from staff
                 where auth_user_id = auth.uid() and aktif and peran = any(p));
$$;

create or replace function staf_sesi(s uuid) returns boolean
language sql stable security definer set search_path = ajios, public as $$
  select exists (select 1 from sesi_staff where sesi_id = s and auth_user_id = auth.uid())
      or punya_peran('admin');
$$;

-- orang-orang yang terdaftar di sesi yang saya tangani
create or replace function peserta_sesi_saya(p uuid) returns boolean
language sql stable security definer set search_path = ajios, public as $$
  select exists (
    select 1 from session_registration r
     where r.person_id = p
       and (staf_sesi(r.sesi_id)));
$$;

-- ------------------------------------------------ nyalakan RLS
do $$
declare t text;
begin
  foreach t in array array[
    'person','staff','education_profile','business','business_relationship',
    'sesi','sesi_staff','session_registration','attendance','activity',
    'activity_response','life_circle_template','life_circle_entry','life_circle_score',
    'action_plan','feedback','pertanyaan','community_membership','interaction',
    'follow_up_task','bonus_event','consent','consent_purpose',
    'data_subject_request','breach_log','audit_log']
  loop
    execute format('alter table ajios.%I enable row level security', t);
    execute format('alter table ajios.%I force row level security', t);
  end loop;
end $$;

-- Bersihkan kebijakan lama supaya migrasi bisa diulang tanpa duplikat.
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'ajios'
  loop execute format('drop policy if exists %I on ajios.%I', r.policyname, r.tablename); end loop;
end $$;

-- ===================================================== PERSON
create policy person_baca_sendiri on person for select
  using (auth_user_id = auth.uid());
create policy person_baca_staf on person for select
  using (punya_peran('admin','cs') or peserta_sesi_saya(id));
create policy person_ubah_sendiri on person for update
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy person_kelola_admin on person for all
  using (punya_peran('admin')) with check (punya_peran('admin'));
create policy person_daftar_sendiri on person for insert
  with check (auth_user_id = auth.uid());

-- ===================================================== STAFF
-- Peran hanya bisa dilihat dan diubah admin. Peserta tidak melihatnya.
create policy staff_admin on staff for all
  using (punya_peran('admin')) with check (punya_peran('admin'));
create policy staff_lihat_sendiri on staff for select
  using (auth_user_id = auth.uid());

-- ===================================================== PENDIDIKAN
create policy edu_sendiri on education_profile for all
  using (person_id = me()) with check (person_id = me());
create policy edu_staf on education_profile for select
  using (punya_peran('admin') or peserta_sesi_saya(person_id));

-- ===================================================== USAHA & OMZET
-- Hanya pemiliknya dan admin. Fasilitator, operator, dan cs TIDAK bisa.
create policy usaha_pemilik on business for select
  using (exists (select 1 from business_relationship br
                 where br.business_id = business.id and br.person_id = me()));
create policy usaha_ubah_pemilik on business for update
  using (exists (select 1 from business_relationship br
                 where br.business_id = business.id and br.person_id = me()))
  with check (true);
create policy usaha_buat on business for insert with check (me() is not null);
create policy usaha_admin on business for all
  using (punya_peran('admin')) with check (punya_peran('admin'));

create policy rel_sendiri on business_relationship for all
  using (person_id = me()) with check (person_id = me());
create policy rel_admin on business_relationship for all
  using (punya_peran('admin')) with check (punya_peran('admin'));

-- ===================================================== SESI
create policy sesi_baca_umum on sesi for select
  using (status in ('Terjadwal','Berlangsung','Selesai'));
create policy sesi_kelola on sesi for all
  using (staf_sesi(id)) with check (staf_sesi(id));

create policy sesistaf_baca on sesi_staff for select using (staf_sesi(sesi_id));
create policy sesistaf_admin on sesi_staff for all
  using (punya_peran('admin')) with check (punya_peran('admin'));

-- ===================================================== PENDAFTARAN
create policy reg_sendiri on session_registration for all
  using (person_id = me()) with check (person_id = me());
create policy reg_staf on session_registration for select using (staf_sesi(sesi_id));

-- ===================================================== KEHADIRAN
-- Peserta boleh check-in sendiri; koreksi hanya oleh staf berizin.
create policy hadir_sendiri on attendance for select using (person_id = me());
create policy hadir_checkin_sendiri on attendance for insert
  with check (person_id = me() and metode = 'Mandiri');
create policy hadir_staf on attendance for all
  using (staf_sesi(sesi_id)) with check (staf_sesi(sesi_id));

-- ===================================================== AKTIVITAS
create policy akt_baca_peserta on activity for select
  using (exists (select 1 from session_registration r
                 where r.sesi_id = activity.sesi_id and r.person_id = me()));
create policy akt_kelola on activity for all
  using (staf_sesi(sesi_id)) with check (staf_sesi(sesi_id));

-- Jawaban aktivitas: HANYA pemiliknya. Fasilitator pun tidak.
create policy resp_sendiri on activity_response for all
  using (person_id = me()) with check (person_id = me());
create policy resp_admin on activity_response for select
  using (punya_peran('admin'));

-- ===================================================== LIFE CIRCLE
create policy lct_baca on life_circle_template for select using (true);
create policy lct_admin on life_circle_template for all
  using (punya_peran('admin')) with check (punya_peran('admin'));

-- Jawaban wellbeing TIDAK terbuka untuk seluruh tim. Pemiliknya saja.
create policy lce_sendiri on life_circle_entry for all
  using (person_id = me()) with check (person_id = me());
create policy lcs_sendiri on life_circle_score for all
  using (exists (select 1 from life_circle_entry e
                 where e.id = life_circle_score.entry_id and e.person_id = me()))
  with check (exists (select 1 from life_circle_entry e
                 where e.id = life_circle_score.entry_id and e.person_id = me()));

-- ===================================================== ACTION PLAN
create policy ap_sendiri on action_plan for all
  using (person_id = me()) with check (person_id = me());
-- Staf sesi boleh melihat STATUS-nya untuk tindak lanjut, lewat view terbatas
-- di bawah — bukan lewat tabel ini.

-- ===================================================== FEEDBACK
create policy fb_sendiri on feedback for all
  using (person_id = me()) with check (person_id = me());
create policy fb_admin on feedback for select using (punya_peran('admin'));

-- ===================================================== PERTANYAAN
create policy tanya_kirim on pertanyaan for insert with check (person_id = me());
create policy tanya_sendiri on pertanyaan for select using (person_id = me());
create policy tanya_staf on pertanyaan for all
  using (staf_sesi(sesi_id)) with check (staf_sesi(sesi_id));

-- ===================================================== KOMUNITAS
create policy kom_sendiri on community_membership for all
  using (person_id = me()) with check (person_id = me());
create policy kom_staf on community_membership for select
  using (punya_peran('admin','cs'));
create policy kom_admin on community_membership for all
  using (punya_peran('admin')) with check (punya_peran('admin'));

-- ===================================================== CRM
create policy int_staf on interaction for all
  using (punya_peran('admin','cs')) with check (punya_peran('admin','cs'));
create policy tugas_staf on follow_up_task for all
  using (punya_peran('admin','cs')) with check (punya_peran('admin','cs'));
create policy tugas_sendiri on follow_up_task for select using (person_id = me());

create policy bonus_sendiri on bonus_event for all
  using (person_id = me()) with check (person_id = me());
create policy bonus_staf on bonus_event for select using (punya_peran('admin','cs'));

-- ===================================================== PERSETUJUAN
create policy consent_sendiri on consent for select using (person_id = me());
create policy consent_beri on consent for insert with check (person_id = me());
create policy consent_staf on consent for select using (punya_peran('admin'));
create policy cp_baca on consent_purpose for select using (true);
create policy cp_admin on consent_purpose for all
  using (punya_peran('admin')) with check (punya_peran('admin'));

-- ===================================================== HAK SUBJEK DATA
create policy dsr_ajukan on data_subject_request for insert
  with check (person_id = me() or person_id is null);
create policy dsr_sendiri on data_subject_request for select using (person_id = me());
create policy dsr_admin on data_subject_request for all
  using (punya_peran('admin')) with check (punya_peran('admin'));

-- ===================================================== BREACH & AUDIT
create policy breach_admin on breach_log for all
  using (punya_peran('admin')) with check (punya_peran('admin'));
create policy audit_admin on audit_log for select using (punya_peran('admin'));
create policy audit_sendiri on audit_log for select using (person_id = me());

-- =====================================================================
-- VIEW TERBATAS — yang boleh dilihat fasilitator
-- Nama dan kehadiran, tanpa omzet, tanpa jawaban pribadi.
-- =====================================================================
create or replace view roster_sesi
with (security_invoker = true) as
select r.sesi_id, p.id as person_id, p.nama, p.kategori,
       (a.id is not null) as hadir, a.check_in_pada
from session_registration r
join person p on p.id = r.person_id
left join attendance a on a.sesi_id = r.sesi_id and a.person_id = r.person_id;

-- Progres aktivitas: jumlah peserta unik, dengan penyebut yang disebutkan.
-- Tidak ada jawaban perorangan di sini.
create or replace view progres_aktivitas
with (security_invoker = true) as
select act.id as activity_id, act.sesi_id, act.judul, act.status,
       (select count(distinct ar.person_id) from activity_response ar
         where ar.activity_id = act.id and ar.dikirim_pada is not null) as pengirim,
       (select count(*) from attendance a where a.sesi_id = act.sesi_id and a.hadir) as hadir,
       (select count(*) from session_registration r where r.sesi_id = act.sesi_id) as terdaftar
from activity act;

-- ---------------------------------------------------------------------
-- PEMERIKSAAN AKHIR. Berkas ini tidak boleh dianggap selesai kalau masih
-- ada tabel tanpa RLS — itu pintu terbuka, dan lebih baik migrasinya
-- berhenti sekarang daripada ketahuan saat peserta pertama mendaftar.
-- ---------------------------------------------------------------------
do $$
declare lepas text; jml int;
begin
  select string_agg(c.relname, ', ' order by c.relname) into lepas
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'ajios' and c.relkind = 'r' and not c.relrowsecurity;
  if lepas is not null then
    raise exception 'TABEL TANPA RLS: %', lepas;
  end if;
  select count(*) into jml from pg_policies where schemaname = 'ajios';
  if jml < 40 then
    raise exception 'Hanya % kebijakan terpasang — diharapkan jauh lebih banyak. Periksa error di atas.', jml;
  end if;
  raise notice 'RLS aktif di seluruh tabel ajios, % kebijakan terpasang.', jml;
end $$;

-- ################################################################
-- ###  BAGIAN: 0004_grants.sql
-- ################################################################

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

-- ################################################################
-- ###  BAGIAN: 0005_progres.sql
-- ################################################################

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

-- ################################################################
-- ###  BAGIAN: 0006_evaluasi.sql
-- ################################################################

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

COMMIT;

-- Kalau Anda sampai di sini tanpa pesan merah, 6 bagian masuk utuh.
-- Langkah berikutnya: jalankan periksa.sql.
