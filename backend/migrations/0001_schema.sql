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
