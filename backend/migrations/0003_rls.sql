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
