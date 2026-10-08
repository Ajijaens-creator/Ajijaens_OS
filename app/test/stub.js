/* =====================================================================
   Tiruan klien Supabase untuk pengujian lokal.
   HANYA dimuat oleh halaman uji. Tidak pernah ikut ke produksi.

   Meniru yang penting saja, tetapi meniru dengan jujur:
   - RLS ditiru: peran menentukan baris mana yang kembali.
   - Nol dan NULL dibedakan, tidak disamakan.
   - Error dikembalikan dengan kode yang sama seperti PostgREST.
   ===================================================================== */
(function (g) {
  'use strict';

  const NOW = '2026-10-08T02:00:00.000Z';
  const DB = {
    person: [
      { id: 'p1', nama: 'Peserta Contoh 01', kategori: 'Mahasiswa', email: 'c1@contoh.id',
        whatsapp: '0812 0000 0001', kota: 'Denpasar', auth_user_id: 'u-p1',
        sumber_masuk: 'Portal', dibuat_pada: NOW, diubah_pada: NOW },
      { id: 'p2', nama: 'Peserta Contoh 02', kategori: 'Pengusaha Pemula', email: 'c2@contoh.id',
        whatsapp: null, kota: 'Ubud', auth_user_id: null,
        sumber_masuk: 'Ditambahkan pengelola', dibuat_pada: NOW, diubah_pada: NOW },
      { id: 'p3', nama: 'Peserta Contoh 03', kategori: 'Siswa SMA', email: null,
        whatsapp: null, kota: null, auth_user_id: null, sumber_masuk: null,
        dibuat_pada: NOW, diubah_pada: NOW }
    ],
    business: [
      { id: 'b1', nama: 'Homestay Contoh', brand: 'Homestay Kita', tahun_mulai: 2022, tanggal_mulai: null,
        industri: 'Hospitality', bidang: 'Jasa homestay', bentuk: 'Usaha perorangan',
        tim_aktif: 4, omzet_rentang: '100-<500 juta', omzet_periode: '12 bulan terakhir',
        omzet_sumber: 'Pernyataan peserta' },
      /* tim_aktif 0 — nol yang SAH, bukan kosong */
      { id: 'b2', nama: 'Usaha Contoh B', brand: null, tahun_mulai: 2026, tanggal_mulai: null,
        industri: 'F&B', bidang: null, bentuk: 'Belum dibentuk',
        tim_aktif: 0, omzet_rentang: 'Belum menghasilkan', omzet_periode: '2026',
        omzet_sumber: 'Pernyataan peserta' },
      /* peserta yang tidak bersedia menyebut omzet — BUKAN nol */
      { id: 'b3', nama: 'Usaha Contoh C', brand: null, tahun_mulai: null, tanggal_mulai: null,
        industri: 'Retail', bidang: null, bentuk: 'PT',
        tim_aktif: 25, omzet_rentang: 'Belum bersedia mengisi', omzet_periode: null,
        omzet_sumber: 'Pernyataan peserta' }
    ],
    business_relationship: [
      { id: 'r1', person_id: 'p2', business_id: 'b1', peran: 'Pemilik', utama: true },
      { id: 'r2', person_id: 'p2', business_id: 'b2', peran: 'Pemilik', utama: false },
      /* satu usaha, dua pemilik */
      { id: 'r3', person_id: 'p1', business_id: 'b1', peran: 'Co-founder', utama: true },
      { id: 'r4', person_id: 'p3', business_id: 'b3', peran: 'Pemilik', utama: true }
    ],
    community_membership: [
      { id: 'k1', person_id: 'p1', komunitas: '#mulaiajadulu', status: 'Member aktif',
        dikonfirmasi_peserta: true, dikonfirmasi_pada: NOW },
      { id: 'k2', person_id: 'p2', komunitas: '#mulaiajadulu', status: 'Berminat',
        dikonfirmasi_peserta: false, dikonfirmasi_pada: null }
    ],
    follow_up_task: [
      { id: 't1', person_id: 'p1', sesi_id: 's1', tujuan: 'Tinjau langkah pertama', pic: null,
        jadwal: '2026-10-15', kanal: 'WhatsApp', catatan: null, status: 'Terjadwal' }
    ],
    session_registration: [
      { id: 'g1', sesi_id: 's1', person_id: 'p1', terdaftar_pada: NOW },
      { id: 'g2', sesi_id: 's1', person_id: 'p2', terdaftar_pada: NOW }
    ],
    attendance: [ { id: 'a1', sesi_id: 's1', person_id: 'p1', hadir: true, check_in_pada: NOW } ],
    sesi: [ { id: 's1', judul: 'Hospitality Skills Can Be a Business', mulai_pada: NOW, status: 'Selesai' } ],
    interaction: [],
    bonus_event: [
      { id: 'e1', person_id: 'p1', jenis: 'follow_ig_dikonfirmasi', terjadi_pada: NOW },
      { id: 'e2', person_id: 'p1', jenis: 'klik_spotify', terjadi_pada: NOW }
    ],
    consent_purpose: [
      { kode: 'kegiatan', nama: 'Penyelenggaraan kegiatan', deskripsi: 'Memproses pendaftaran dan aktivitas sesi.', dasar: 'Perjanjian', wajib: true },
      { kode: 'komunitas', nama: 'Keanggotaan #mulaiajadulu', deskripsi: 'Mencatat minat dan keanggotaan.', dasar: 'Persetujuan', wajib: false },
      { kode: 'promosi', nama: 'Informasi program', deskripsi: 'Kabar program berikutnya.', dasar: 'Persetujuan', wajib: false },
      { kode: 'riset', nama: 'Ringkasan tanpa identitas', deskripsi: 'Ringkasan kelas tanpa identitas.', dasar: 'Persetujuan', wajib: false }
    ],
    consent: [
      { id: 'c1', person_id: 'p1', purpose: 'kegiatan', diberikan: true, pada: '2026-10-01T00:00:00Z', urut: 1, sumber: 'portal', dicabut_pada: null },
      { id: 'c2', person_id: 'p1', purpose: 'promosi', diberikan: true, pada: '2026-10-01T00:00:01Z', urut: 2, sumber: 'portal', dicabut_pada: null },
      /* dicabut belakangan — harus terbaca sebagai DICABUT */
      { id: 'c3', person_id: 'p1', purpose: 'promosi', diberikan: true, pada: '2026-10-05T00:00:00Z', urut: 3, sumber: 'portal', dicabut_pada: '2026-10-05T00:00:00Z' }
    ],
    /* tabel yang TIDAK boleh terbaca peran cs/fasilitator */
    life_circle_score: [ { entry_id: 'le1', aspek: 'Kesehatan', nilai: 0 } ],
    life_circle_entry: [],
    life_circle_template: [ { id: 'tpl1', nama: 'Life Circle Dasar', versi: 1, aktif: true,
      aspek: ['Kesehatan & energi','Keuangan','Hubungan','Karier','Spiritual','Belajar','Jeda','Kontribusi'] } ],
    activity: [ { id: 'ak1', sesi_id: 's1', kode: 'lc', judul: 'Wellbeing Life Circle',
      jenis: 'life_circle', status: 'Dibuka' },
      { id: 'ak2', sesi_id: 's1', kode: 'pdf', judul: 'Materi PDF', jenis: 'materi', status: 'Belum dibuka' } ],
    education_profile: [],
    data_subject_request: [],
    activity_response: [], feedback: [], action_plan: [], staff: [],
    pertanyaan: [], audit_log: [], tindak_lanjut_sesi: []
  };

  /* Sesi contoh dilengkapi supaya layar kendali NP-V08 bisa diuji apa adanya:
     satu sesi berlangsung yang sudah punya waktu mulai tersimpan. */
  DB.sesi.push({ id: 's2', judul: 'Sesi Uji Berlangsung', mulai_pada: NOW, status: 'Berlangsung',
    kode_sesi: 'UJI-2', durasi_menit: 150, lokasi: 'Ubud', kapasitas: 30,
    dimulai_pada: '2026-10-08T01:30:00.000Z', jeda_detik: 0, diakhiri_pada: null });
  /* Sesi terjadwal yang BELUM punya pendaftar — dipakai menguji
     pendaftaran lewat tautan/QR sesi di portal peserta. */
  DB.sesi.push({ id: 's3', judul: 'Sesi Uji Terjadwal', mulai_pada: NOW, status: 'Terjadwal',
    kode_sesi: 'UJI-3', durasi_menit: 150, lokasi: 'Ubud', kapasitas: 30,
    dimulai_pada: null, jeda_detik: 0, diakhiri_pada: null });
  DB.session_registration.push(
    { id: 'g3', sesi_id: 's2', person_id: 'p1', terdaftar_pada: NOW },
    { id: 'g4', sesi_id: 's2', person_id: 'p2', terdaftar_pada: NOW },
    { id: 'g5', sesi_id: 's2', person_id: 'p3', terdaftar_pada: NOW });
  DB.attendance.push({ id: 'a2', sesi_id: 's2', person_id: 'p1', hadir: true,
    check_in_pada: NOW, metode: 'Mandiri' });
  DB.attendance.push({ id: 'a3', sesi_id: 's2', person_id: 'p2', hadir: true,
    check_in_pada: NOW, metode: 'Operator' });
  DB.activity.push(
    { id: 'ak3', sesi_id: 's2', kode: 'lc', judul: 'Wellbeing Life Circle',
      jenis: 'life_circle', status: 'Dibuka', terima_setelah_tutup: false },
    { id: 'ak4', sesi_id: 's2', kode: 'ap', judul: 'Action Plan 7 Hari',
      jenis: 'action_plan', status: 'Belum dibuka', terima_setelah_tutup: false },
    /* Aktivitas evaluasi yang sudah dibuka fasilitator — itulah yang
       membuka formulir evaluasi di portal peserta. Terdaftar saja tidak
       cukup: terdaftar bukan hadir, dan bukan juga sudah ikut. */
    { id: 'ak5', sesi_id: 's2', kode: 'ev', judul: 'Evaluasi Sesi',
      jenis: 'evaluasi', status: 'Dibuka', terima_setelah_tutup: true });
  /* satu terkirim, satu masih draft — draft tidak boleh ikut dihitung */
  DB.activity_response.push(
    { id: 'ar1', activity_id: 'ak3', person_id: 'p1', jawaban: { x: 1 }, dikirim_pada: NOW },
    { id: 'ar2', activity_id: 'ak3', person_id: 'p2', draft: { x: 2 }, dikirim_pada: null });
  DB.pertanyaan.push(
    { id: 'q1', sesi_id: 's2', person_id: 'p1', isi: 'Bagaimana memulai tanpa modal?',
      tanpa_nama: true, ditinjau: false, ditayangkan: false, terjawab: false, dikirim_pada: NOW },
    { id: 'q2', sesi_id: 's2', person_id: 'p2', isi: 'Apakah izin usaha wajib di awal?',
      tanpa_nama: false, ditinjau: true, ditayangkan: true, terjawab: false, dikirim_pada: NOW });

  /* Kunci unik yang ditiru, supaya percobaan ganda menghasilkan 23505
     seperti di Postgres — bukan baris kedua yang diam-diam masuk. */
  const UNIK = {
    attendance: ['sesi_id', 'person_id'],
    session_registration: ['sesi_id', 'person_id'],
    activity_response: ['activity_id', 'person_id']
  };

  /* Peran yang berhak menghitung pengirim. Di basis data ini ditegakkan
     oleh jml_pengirim() (SECURITY DEFINER) — di sini ditiru supaya
     perbedaan NULL dan 0 ikut teruji. */
  /* --- data evaluasi contoh untuk sesi s2 ---
     Dua responden: satu memberi angka lengkap + teks dan MENGIZINKAN
     kutipan; satu hanya memberi satu angka, dan angkanya 0 — nol yang
     sah. Satu pertanyaan dilewati sama sekali, supaya penyebut yang
     berbeda per pertanyaan ikut teruji. */
  DB.feedback.push(
    { id: 'f1', sesi_id: 's2', person_id: 'p1',
      jawaban: { keseluruhan: 9, kejelasan: 8, relevansi: 7,
                 paling_bermanfaat: 'Bagian menghitung harga kamar' },
      boleh_dikutip: true, template_versi: 1, dikirim_pada: NOW },
    { id: 'f2', sesi_id: 's2', person_id: 'p2',
      jawaban: { keseluruhan: 0, perlu_diperbaiki: '   ' },
      boleh_dikutip: false, template_versi: 1, dikirim_pada: NOW });

  DB.action_plan.push(
    { id: 'ap1', person_id: 'p1', sesi_id: 's2', tujuan: 'Pasang harga baru',
      langkah_7hari: 'Hitung biaya per kamar', dukungan: 'Contoh perhitungan',
      status: 'Dilaporkan selesai', bukti: 'Sudah saya terapkan', tenggat: null,
      diperbarui_pada: NOW },
    { id: 'ap2', person_id: 'p2', sesi_id: 's2', tujuan: 'Buka akun usaha',
      langkah_7hari: 'Siapkan dokumen', dukungan: null,
      status: 'Belum diperbarui', bukti: null, tenggat: '2026-09-01',
      diperbarui_pada: null });

  /* Life Circle s2: lima pengisi, supaya batas minimum agregat terlampaui.
     Satu nilai 0 (sah) dan beberapa aspek dilewati (null) — dua keadaan
     yang harus tetap bisa dibedakan di agregatnya. */
  ['p1', 'p2', 'p3', 'p4u', 'p5u'].forEach((pid, i) => {
    const eid = 'lcs' + i;
    DB.life_circle_entry.push({ id: eid, person_id: pid, template_id: 'tpl1',
      template_versi: 1, sesi_id: 's2', baseline: true, diisi_pada: NOW });
    DB.life_circle_score.push(
      { entry_id: eid, aspek: 'Kesehatan & energi', nilai: i === 0 ? 0 : 5 + i },
      { entry_id: eid, aspek: 'Keuangan', nilai: i < 2 ? null : 6 });
  });

  const BOLEH_HITUNG = ['admin', 'fasilitator', 'operator'];

  /* View tindak_lanjut_sesi: STATUS saja. Isi tujuan, langkah, dukungan,
     dan bukti TIDAK ikut — hanya ada/tidaknya catatan bukti. Kalau tiruan
     ini membocorkannya, pengujian kebocoran jadi tidak ada artinya. */
  function tindakLanjut() {
    if (BOLEH_HITUNG.indexOf(g.__STUB.peran) === -1) return [];
    const hariIni = NOW.slice(0, 10);
    return DB.action_plan.map(ap => {
      const p = DB.person.find(x => x.id === ap.person_id) || {};
      return { sesi_id: ap.sesi_id, person_id: ap.person_id, nama: p.nama || null,
               status: ap.status, diperbarui_pada: ap.diperbarui_pada || null,
               ada_catatan_bukti: !!(ap.bukti && ap.bukti.trim()),
               lewat_tenggat: !!(ap.tenggat && ap.tenggat < hariIni &&
                                 ap.status !== 'Dilaporkan selesai') };
    });
  }
  function progresAktivitas() {
    const boleh = BOLEH_HITUNG.indexOf(g.__STUB.peran) !== -1;
    return DB.activity.map(a => ({
      activity_id: a.id, sesi_id: a.sesi_id, judul: a.judul, status: a.status,
      pengirim: boleh
        ? new Set(DB.activity_response.filter(r => r.activity_id === a.id && r.dikirim_pada)
            .map(r => r.person_id)).size
        : null,
      hadir: DB.attendance.filter(x => x.sesi_id === a.sesi_id && x.hadir).length,
      terdaftar: DB.session_registration.filter(x => x.sesi_id === a.sesi_id).length
    }));
  }

  /* peran yang sedang disimulasikan */
  /* Peran dibaca SAAT DIMUAT, sebelum halaman sempat boot — kalau disetel
     belakangan, pengujian berlomba dengan boot() dan hasilnya tidak bisa dipercaya. */
  const PERAN_AWAL = (g.__PERAN_UJI === undefined) ? 'admin' : g.__PERAN_UJI;
  g.__STUB = { peran: PERAN_AWAL, user: { id: 'u-admin' }, gagalkan: null };
  const TERLARANG = { cs: ['life_circle_score','feedback','action_plan','activity_response'],
                      fasilitator: ['life_circle_score','feedback','action_plan','activity_response',
                                    'business','business_relationship'],
                      operator: ['life_circle_score','feedback','action_plan','activity_response',
                                 'business','business_relationship'] };

  function kueri(tabel) {
    let rows = (tabel === 'progres_aktivitas' ? progresAktivitas()
              : tabel === 'tindak_lanjut_sesi' ? tindakLanjut()
              : (DB[tabel] || [])).slice();
    const q = {
      _eq: [], _order: null, _single: false,
      select(sel, opt) {
        q._sel = sel;
        if (opt && opt.count) { q._count = true; q._head = !!opt.head; }
        return q;
      },
      eq(k, v) { q._eq.push([k, v]); return q; },
      order(k, o) { q._order = [k, !o || o.ascending !== false]; return q; },
      limit(n) { q._limit = n; return q; },
      maybeSingle() { q._single = true; return q; },
      single() { q._single = true; q._wajib = true; return q; },
      insert(obj) { q._insert = obj; return q; },
      update(obj) { q._update = obj; return q; },
      then(res, rej) { return jalankan().then(res, rej); }
    };
    function jalankan() {
      return new Promise((resolve) => {
        if (g.__STUB.gagalkan === tabel)
          return resolve({ data: null, error: { code: '42501', message: 'permission denied for table ' + tabel } });
        const larangan = TERLARANG[g.__STUB.peran] || [];
        if (larangan.indexOf(tabel) !== -1) return resolve({ data: [], error: null });
        if (q._insert) {
          const satuan = Array.isArray(q._insert) ? q._insert : [q._insert];
          const kunci = UNIK[tabel];
          if (kunci) {
            const bentrok = satuan.some(x =>
              (DB[tabel] || []).some(r => kunci.every(k => r[k] === x[k])));
            if (bentrok) return resolve({ data: null, error: {
              code: '23505', message: 'duplicate key value violates unique constraint' } });
          }
          /* Kolom bernilai bawaan di basis data juga diisi di sini, supaya
             baris hasil insert tidak tampak kosong padahal di Postgres
             terisi sendiri. */
          const BAWAAN = {
            session_registration: { terdaftar_pada: NOW },
            attendance: { check_in_pada: NOW, hadir: true },
            pertanyaan: { dikirim_pada: NOW, tanpa_nama: true, ditinjau: false,
                          ditayangkan: false, terjawab: false },
            activity: { status: 'Belum dibuka', terima_setelah_tutup: false },
            audit_log: { pada: NOW }
          };
          const dibuat = satuan.map(x => {
            const baris = Object.assign({ id: 'x' + Math.random().toString(36).slice(2, 8) },
                                        BAWAAN[tabel] || {}, x);
            if (!baris.dibuat_pada) baris.dibuat_pada = NOW;
            (DB[tabel] = DB[tabel] || []).unshift(baris);
            return baris;
          });
          return resolve({ data: q._single ? dibuat[0] : dibuat, error: null });
        }
        if (q._update) {
          const kena = rows.filter(r => q._eq.every(([k, v]) => r[k] === v));
          kena.forEach(r => Object.assign(r, q._update));
          return resolve({ data: q._single ? (kena[0] || null) : kena, error: null });
        }
        let out = rows.filter(r => q._eq.every(([k, v]) => r[k] === v));
        if (q._order) { const [k, asc] = q._order;
          out.sort((a, b) => String(a[k] ?? '').localeCompare(String(b[k] ?? '')) * (asc ? 1 : -1)); }
        /* tiruan select bersarang: "*, business:business_id(*)" */
        const sel = q._sel || '*';
        const m = /(\w+):(\w+)\((\*|[\w, ]+)\)/g; let mm;
        while ((mm = m.exec(sel))) {
          const [, alias, fk, _f] = mm;
          const tujuan = fk.replace(/_id$/, '');
          const peta = (DB[tujuan === 'person' ? 'person' : tujuan] || []);
          out = out.map(r => Object.assign({}, r, { [alias]: peta.find(x => x.id === r[fk]) || null }));
        }
        if (q._limit) out = out.slice(0, q._limit);
        if (q._count) return resolve({ data: q._head ? null : out, count: out.length, error: null });
        resolve({ data: q._single ? (out[0] || null) : out, error: null });
      });
    }
    return q;
  }

  /* Keadaan awal dibaca SAAT DIMUAT, supaya tidak berlomba dengan boot().
     __MASUK_UJI=false meniru pengunjung yang belum masuk sama sekali.
     __TANPA_PROFIL=true meniru akun baru yang belum punya baris person. */
  g.__STUB.masuk = (g.__MASUK_UJI === undefined) ? true : !!g.__MASUK_UJI;
  if (g.__TANPA_PROFIL) DB.person = [];
  /* Jadikan satu peserta contoh sebagai "saya", supaya jalur peserta yang
     sudah terdaftar bisa diuji tanpa memuat ulang halaman. */
  if (g.__PROFIL_SAYA) {
    DB.person.forEach(x => { if (x.auth_user_id === 'u-admin') x.auth_user_id = null; });
    const saya = DB.person.find(x => x.id === g.__PROFIL_SAYA);
    if (saya) saya.auth_user_id = 'u-admin';
  }

  /* ------------------------------------------------ fungsi agregat
     Meniru fungsi SECURITY DEFINER di basis data, termasuk perbedaan yang
     paling mudah salah: NULL (tidak berhak menghitung) BUKAN 0 (berhak,
     memang belum ada). Kalau tiruan ini melebur keduanya, pengujiannya
     lulus sementara produknya menulis angka palsu. */
  const MIN_WB = 5;
  function rpc(nama, arg) {
    const a = arg || {};
    const boleh = BOLEH_HITUNG.indexOf(g.__STUB.peran) !== -1;
    const fb = DB.feedback.filter(f => f.sesi_id === a.s);

    if (nama === 'jml_responden')
      return Promise.resolve({ data: boleh ? fb.length : null, error: null });

    if (nama === 'rekap_feedback') {
      if (!boleh) return Promise.resolve({ data: [], error: null });
      const per = {};
      fb.forEach(f => Object.keys(f.jawaban || {}).forEach(k => {
        if (typeof f.jawaban[k] !== 'number') return;
        (per[k] = per[k] || []).push(f.jawaban[k]);
      }));
      const out = Object.keys(per).sort().map(k => {
        const v = per[k];
        return { kunci: k, jml: v.length,
                 rata: Math.round(v.reduce((x, y) => x + y, 0) / v.length * 100) / 100,
                 terendah: Math.min.apply(null, v), tertinggi: Math.max.apply(null, v) };
      });
      return Promise.resolve({ data: out, error: null });
    }

    if (nama === 'teks_feedback') {
      if (!boleh) return Promise.resolve({ data: [], error: null });
      const out = [];
      fb.forEach(f => Object.keys(f.jawaban || {}).forEach(k => {
        const v = f.jawaban[k];
        if (typeof v !== 'string' || !v.trim()) return;
        /* person_id SENGAJA tidak dibawa, persis seperti fungsinya. */
        out.push({ kunci: k, isi: v, boleh_dikutip: !!f.boleh_dikutip, dikirim_pada: f.dikirim_pada || NOW });
      }));
      return Promise.resolve({ data: out, error: null });
    }

    if (nama === 'rekap_wellbeing') {
      if (!boleh) return Promise.resolve({ data: [], error: null });
      const minimum = a.minimum === undefined ? MIN_WB : a.minimum;
      const entri = DB.life_circle_entry.filter(e => e.sesi_id === a.s && e.baseline);
      const orang = new Set(entri.map(e => e.person_id)).size;
      if (orang < Math.max(minimum, 1)) return Promise.resolve({ data: [], error: null });
      const per = {};
      DB.life_circle_score.forEach(sc => {
        if (!entri.some(e => e.id === sc.entry_id)) return;
        if (sc.nilai === null || sc.nilai === undefined) return;   /* dilewati ≠ nol */
        (per[sc.aspek] = per[sc.aspek] || []).push(sc.nilai);
      });
      const out = Object.keys(per).sort().map(k => ({ aspek: k, jml: per[k].length,
        rata: Math.round(per[k].reduce((x, y) => x + y, 0) / per[k].length * 100) / 100 }));
      return Promise.resolve({ data: out, error: null });
    }

    return Promise.resolve({ data: null, error: { code: '42883', message: 'fungsi tiruan tidak ada: ' + nama } });
  }

  g.supabase = {
    createClient() {
      return {
        from: kueri,
        rpc,
        auth: {
          getSession: () => Promise.resolve({
            data: { session: g.__STUB.masuk ? { user: g.__STUB.user } : null }, error: null }),
          signInWithOtp: () => Promise.resolve({ error: null }),
          verifyOtp: () => { g.__STUB.masuk = true;
            return Promise.resolve({ data: { session: { user: g.__STUB.user } }, error: null }); },
          signOut: () => Promise.resolve({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
        }
      };
    }
  };

  /* peranSaya() membaca tabel staff; isi sesuai peran yang disimulasikan */
  DB.staff = PERAN_AWAL ? [{ auth_user_id: g.__STUB.user.id, peran: PERAN_AWAL, aktif: true }] : [];
  g.__STUB.setPeran = function (p) {
    g.__STUB.peran = p;
    DB.staff = p ? [{ auth_user_id: g.__STUB.user.id, peran: p, aktif: true }] : [];
  };
  g.__STUB.DB = DB;
})(window);
