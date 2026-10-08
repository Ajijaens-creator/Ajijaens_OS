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
