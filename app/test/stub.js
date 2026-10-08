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
    activity_response: [], feedback: [], action_plan: [], staff: []
  };

  /* peran yang sedang disimulasikan */
  /* Peran dibaca SAAT DIMUAT, sebelum halaman sempat boot — kalau disetel
     belakangan, pengujian berlomba dengan boot() dan hasilnya tidak bisa dipercaya. */
  const PERAN_AWAL = (g.__PERAN_UJI === undefined) ? 'admin' : g.__PERAN_UJI;
  g.__STUB = { peran: PERAN_AWAL, user: { id: 'u-admin' }, gagalkan: null };
  const TERLARANG = { cs: ['life_circle_score','feedback','action_plan','activity_response'],
                      fasilitator: ['life_circle_score','feedback','action_plan','business','business_relationship'] };

  function kueri(tabel) {
    let rows = (DB[tabel] || []).slice();
    const q = {
      _eq: [], _order: null, _single: false,
      select(sel) { q._sel = sel; return q; },
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
          const dibuat = satuan.map(x => {
            const baris = Object.assign({ id: 'x' + Math.random().toString(36).slice(2, 8) }, x);
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

  g.supabase = {
    createClient() {
      return {
        from: kueri,
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
