-- =====================================================================
-- uji_rls.sql — membuktikan izin benar-benar ditegakkan basis data.
-- Dijalankan dari peran 'authenticated', bukan superuser.
-- Setiap baris UJI punya harapan yang eksplisit; gagal = keluar tidak nol.
-- =====================================================================
set search_path = ajios, public;

create table if not exists _hasil_uji (
  no serial primary key, label text, dapat text, harap text, lulus boolean);
truncate _hasil_uji;

grant all on _hasil_uji to authenticated, anon;
grant all on sequence _hasil_uji_no_seq to authenticated, anon;

create or replace function uji(l text, dapat text, harap text) returns void
language plpgsql security definer as $$
begin
  insert into _hasil_uji(label, dapat, harap, lulus) values (l, dapat, harap, dapat = harap);
end $$;

-- ------------------------------------------------------------- data uji
-- Dibuat sebagai pemilik (bypass RLS), meniru penyisipan oleh service role.
do $$
declare
  uA uuid := '11111111-1111-1111-1111-111111111111';
  uB uuid := '22222222-2222-2222-2222-222222222222';
  uF uuid := '33333333-3333-3333-3333-333333333333';
  uAd uuid := '44444444-4444-4444-4444-444444444444';
  pA uuid; pB uuid; pF uuid; pAd uuid; s uuid; biz uuid; act uuid; tpl uuid; eA uuid; eB uuid;
begin
  -- Pembersihan harus mengenali juga baris yang sudah dianonimkan oleh
  -- hapus_data_pribadi() — namanya berganti dan auth_user_id-nya dikosongkan,
  -- jadi menyapu berdasarkan nama saja tidak cukup.
  delete from audit_log where person_id in (
    select id from person where nama like 'UJI %' or nama = 'Dihapus atas permintaan');
  delete from person where nama like 'UJI %'
     or nama = 'Dihapus atas permintaan'
     or auth_user_id in (uA, uB, uF, uAd);
  delete from sesi where judul like 'UJI %';
  delete from business where nama like 'UJI %';
  delete from staff where auth_user_id in (uF, uAd);
  delete from life_circle_template where nama = 'UJI Template';

  insert into person(nama, kategori, auth_user_id) values
    ('UJI Peserta A','Mahasiswa',uA) returning id into pA;
  insert into person(nama, kategori, auth_user_id) values
    ('UJI Peserta B','Pengusaha Pemula',uB) returning id into pB;
  insert into person(nama, auth_user_id) values ('UJI Fasilitator',uF) returning id into pF;
  insert into person(nama, auth_user_id) values ('UJI Admin',uAd) returning id into pAd;

  insert into staff(auth_user_id, peran) values (uF,'fasilitator'), (uAd,'admin');

  insert into sesi(judul, status, kode_sesi) values ('UJI Sesi','Berlangsung','UJI-1') returning id into s;
  insert into sesi_staff(sesi_id, auth_user_id, peran) values (s, uF, 'fasilitator');
  insert into session_registration(sesi_id, person_id) values (s,pA), (s,pB);
  insert into attendance(sesi_id, person_id, metode) values (s,pA,'Mandiri');

  insert into business(nama, omzet_rentang, omzet_periode)
    values ('UJI Homestay B','100-<500 juta','12 bulan terakhir') returning id into biz;
  insert into business_relationship(person_id, business_id, utama) values (pB, biz, true);

  insert into activity(sesi_id, kode, judul, jenis, status)
    values (s,'lc','UJI Life Circle','life_circle','Dibuka') returning id into act;

  insert into life_circle_template(nama, versi, aspek)
    values ('UJI Template',1,'["Kesehatan","Keuangan"]'::jsonb) returning id into tpl;
  insert into life_circle_entry(person_id, template_id, template_versi, sesi_id, baseline)
    values (pA,tpl,1,s,true) returning id into eA;
  insert into life_circle_entry(person_id, template_id, template_versi, sesi_id, baseline)
    values (pB,tpl,1,s,true) returning id into eB;
  -- 0 adalah jawaban sah; NULL berarti belum dijawab. Dua-duanya diuji.
  insert into life_circle_score(entry_id, aspek, nilai) values
    (eA,'Kesehatan',0), (eA,'Keuangan',null),
    (eB,'Kesehatan',7), (eB,'Keuangan',5);

  -- Dua kiriman terkirim + satu draft yang BELUM terkirim. Draft tidak
  -- boleh ikut dihitung sebagai pengirim.
  insert into activity_response(activity_id, person_id, jawaban, dikirim_pada)
    values (act,pA,'{"x":1}'::jsonb, now());
  insert into activity_response(activity_id, person_id, draft)
    values (act,pB,'{"x":2}'::jsonb);

  insert into action_plan(person_id, sesi_id, tujuan) values (pA,s,'UJI rencana A');
  insert into action_plan(person_id, sesi_id, tujuan) values (pB,s,'UJI rencana B');
  insert into feedback(sesi_id, person_id, jawaban) values (s,pB,'{"saran":"rahasia B"}'::jsonb);
end $$;

-- ===================================================== PESERTA A
select auth.masuk_sebagai('11111111-1111-1111-1111-111111111111');

select uji('A membaca Life Circle miliknya sendiri',
  (select count(*)::text from life_circle_score), '2');

select uji('A TIDAK bisa membaca Life Circle milik B',
  (select count(*)::text from life_circle_score s
    join life_circle_entry e on e.id = s.entry_id
    join person p on p.id = e.person_id where p.nama = 'UJI Peserta B'), '0');

select uji('Nilai 0 tersimpan sebagai jawaban sah, bukan kosong',
  (select nilai::text from life_circle_score s join life_circle_entry e on e.id = s.entry_id
    where e.person_id = me() and s.aspek = 'Kesehatan'), '0');

select uji('Aspek yang belum dijawab tetap NULL, bukan 0',
  (select coalesce(nilai::text,'NULL') from life_circle_score s
    join life_circle_entry e on e.id = s.entry_id
    where e.person_id = me() and s.aspek = 'Keuangan'), 'NULL');

select uji('A TIDAK bisa membaca action plan milik B',
  (select count(*)::text from action_plan where tujuan = 'UJI rencana B'), '0');

select uji('A TIDAK bisa membaca feedback milik B',
  (select count(*)::text from feedback), '0');

select uji('A TIDAK bisa membaca data usaha milik B',
  (select count(*)::text from business where nama = 'UJI Homestay B'), '0');

select uji('A hanya melihat dirinya di tabel orang',
  (select count(*)::text from person), '1');

-- percobaan menulis ke milik orang lain
do $$
declare n int;
begin
  update action_plan set tujuan = 'DIBAJAK' where tujuan = 'UJI rencana B';
  get diagnostics n = row_count;
  perform uji('A mencoba menulis action plan B: baris yang berubah', n::text, '0');
exception when insufficient_privilege then
  perform uji('A mencoba menulis action plan B: baris yang berubah', '0', '0');
end $$;

-- Peserta tidak berhak menghitung pengirim. Jawabannya NULL — bukan 0.
-- Nol berarti "berhak menghitung, memang belum ada". Dua keadaan berbeda.
select uji('Peserta: jumlah pengirim NULL, bukan nol',
  (select coalesce(jml_pengirim(id)::text, 'NULL') from activity where kode = 'lc'), 'NULL');
select auth.jadi_pemilik();

-- ===================================================== FASILITATOR
select auth.masuk_sebagai('33333333-3333-3333-3333-333333333333');

select uji('Fasilitator melihat roster sesinya',
  (select count(*)::text from roster_sesi), '2');

select uji('Fasilitator melihat siapa yang sudah hadir',
  (select count(*)::text from roster_sesi where hadir), '1');

select uji('Fasilitator TIDAK bisa membaca Life Circle siapa pun',
  (select count(*)::text from life_circle_score), '0');

select uji('Fasilitator TIDAK bisa membaca feedback perorangan',
  (select count(*)::text from feedback), '0');

select uji('Fasilitator TIDAK bisa membaca omzet',
  (select count(*)::text from business), '0');

select uji('Fasilitator TIDAK bisa membaca action plan perorangan',
  (select count(*)::text from action_plan), '0');

select uji('Fasilitator melihat progres agregat, bukan jawaban',
  (select (terdaftar::text || '/' || hadir::text) from progres_aktivitas limit 1), '2/1');

-- Inti perbaikan 0005: fasilitator mendapat CACAH yang benar tanpa bisa
-- membaca satu pun baris jawaban. Sebelum ini angkanya selalu 0 — salah,
-- dan terlihat seperti data.
select uji('Fasilitator TIDAK bisa membaca baris jawaban aktivitas',
  (select count(*)::text from activity_response), '0');
select uji('Fasilitator tetap mendapat jumlah pengirim yang benar',
  (select pengirim::text from progres_aktivitas limit 1), '1');
select uji('Draft yang belum terkirim tidak dihitung sebagai pengirim',
  (select jml_pengirim(id)::text from activity where kode = 'lc'), '1');
select auth.jadi_pemilik();

-- ===================================================== ADMIN
select auth.masuk_sebagai('44444444-4444-4444-4444-444444444444');
select uji('Admin bisa membaca usaha dan omzet',
  (select omzet_rentang::text from business where nama = 'UJI Homestay B'), '100-<500 juta');
select uji('Admin bisa membaca seluruh peserta uji',
  (select count(*)::text from person where nama like 'UJI %'), '4');
select auth.jadi_pemilik();

-- ===================================================== TANPA LOGIN
select auth.keluar();
select uji('Tanpa login: tidak ada orang yang terbaca',
  (select count(*)::text from person), '0');
select uji('Tanpa login: tidak ada Life Circle yang terbaca',
  (select count(*)::text from life_circle_score), '0');
select uji('Tanpa login: tidak ada usaha yang terbaca',
  (select count(*)::text from business), '0');
select uji('Tanpa login: sesi terjadwal tetap terbaca (untuk halaman pembuka)',
  (select count(*)::text from sesi where judul = 'UJI Sesi'), '1');
select auth.jadi_pemilik();

-- ===================================================== PERSETUJUAN & PDP
do $$
declare pA uuid;
begin
  select id into pA from person where nama = 'UJI Peserta A';
  insert into consent(person_id, purpose, diberikan, sumber)
    values (pA,'kegiatan',true,'uji'), (pA,'promosi',false,'uji');
  perform uji('Promosi ditolak di awal: tidak boleh dikirimi', boleh_promosi(pA)::text, 'false');

  insert into consent(person_id, purpose, diberikan, sumber) values (pA,'promosi',true,'uji');
  perform uji('Setelah disetujui: boleh dikirimi', boleh_promosi(pA)::text, 'true');

  insert into consent(person_id, purpose, diberikan, sumber, dicabut_pada)
    values (pA,'promosi',true,'uji',now());
  perform uji('Setelah dicabut: tidak boleh lagi', boleh_promosi(pA)::text, 'false');

  perform uji('Histori persetujuan tersimpan utuh, tidak ditimpa',
    (select count(*)::text from consent where person_id = pA and purpose = 'promosi'), '3');
end $$;

do $$
declare b uuid;
begin
  insert into breach_log(diketahui_pada, ringkasan, jumlah_subjek)
    values (now() - interval '80 hours','UJI kebocoran',5) returning id into b;
  perform uji('Batas lapor dihitung 3x24 jam dari saat diketahui',
    (select extract(epoch from (batas_lapor - diketahui_pada))::int::text
       from breach_log where id = b), '259200');
  perform uji('Kebocoran yang lewat tenggat muncul di daftar terlambat',
    (select count(*)::text from breach_terlambat where id = b), '1');
  delete from breach_log where id = b;
end $$;

do $$
declare pA uuid; sisa int;
begin
  select id into pA from person where nama = 'UJI Peserta A';
  perform hapus_data_pribadi(pA,'UJI permintaan hapus');
  perform uji('Setelah dihapus: nama diganti',
    (select nama from person where id = pA), 'Dihapus atas permintaan');
  perform uji('Setelah dihapus: Life Circle ikut terhapus',
    (select count(*)::text from life_circle_entry where person_id = pA), '0');
  perform uji('Setelah dihapus: bukti persetujuan DIPERTAHANKAN',
    (select (count(*) > 0)::text from consent where person_id = pA), 'true');
  perform uji('Setelah dihapus: jejak audit DIPERTAHANKAN',
    (select (count(*) > 0)::text from audit_log where person_id = pA), 'true');
end $$;

-- ===================================================== HASIL
\pset format aligned
select case when lulus then '  ok  ' else '  GAGAL  ' end || label ||
       case when lulus then '' else '   (dapat: ' || coalesce(dapat,'NULL') || ', harap: ' || harap || ')' end
  as "HASIL UJI RLS & PDP"
from _hasil_uji order by no;

select count(*) filter (where lulus) || ' lulus, ' ||
       count(*) filter (where not lulus) || ' gagal' as "RINGKASAN" from _hasil_uji;

do $$
declare g int;
begin
  select count(*) into g from _hasil_uji where not lulus;
  if g > 0 then raise exception 'ADA % UJI YANG GAGAL', g; end if;
end $$;
