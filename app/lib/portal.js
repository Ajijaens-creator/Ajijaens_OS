/* =====================================================================
   NP-V04 — PORTAL PESERTA LIFE BY DESIGN

   Yang dipegang ketat di berkas ini:
   - Login BUKAN check-in kehadiran. Dua peristiwa berbeda.
   - Persetujuan dipisah per tujuan, tidak satu pun tercentang otomatis,
     dan persetujuan promosi TIDAK PERNAH jadi syarat menerima materi.
   - Life Circle: jawaban awal null, 0 adalah jawaban sah, diagram dihitung
     dari jawaban. Bukan diagnosis, bukan peringkat.
   - Pengisian baru tidak menimpa baseline.
   - Bonus: tidak pernah meminta kata sandi Instagram/Spotify. Follow
     adalah pernyataan peserta; klik Spotify adalah peristiwa klik.
   ===================================================================== */
(function () {
  'use strict';
  const A = window.AJIOS, esc = A.esc, el = A.el, UI = A.UI;

  const IG = 'https://www.instagram.com/ajijaens.official';
  const SPOTIFY = 'https://open.spotify.com/show/2Z2fCyIBqym3OgKBkZUI0N';

  const KATEGORI = [
    ['Siswa SMA', 'Masih sekolah menengah'],
    ['Mahasiswa', 'Sedang kuliah'],
    ['Pengusaha Pemula', 'Usaha berjalan di bawah 5 tahun, termasuk tahap ide'],
    ['Pengusaha 5th+', 'Usaha berjalan 5 sampai di bawah 10 tahun'],
    ['Pengusaha 10th+', 'Usaha berjalan 10 tahun atau lebih']
  ];
  const BENTUK = ['Belum dibentuk','Usaha perorangan','CV','Firma','PT Perorangan','PT','Koperasi','Yayasan','Lainnya'];
  const OMZET  = ['Belum menghasilkan','<100 juta','100-<500 juta','500 juta-<1 miliar','1-<5 miliar','5-<10 miliar','>=10 miliar','Belum bersedia mengisi'];
  const PERIODE= ['12 bulan terakhir','2026','2025','2024'];
  const adalahPengusaha = k => k && k.indexOf('Pengusaha') === 0;

  let SAYA = null, LANGKAH = 1, DRAF = {};

  /* Tautan/QR sesi: ?sesi=KODE. Kodenya hanya penunjuk sesi —
     tidak membawa hak akses apa pun, dan tetap harus masuk sendiri. */
  const KODE_URL = (function () {
    try { return (new URLSearchParams(location.search).get('sesi') || '').trim(); }
    catch (e) { return ''; }
  })();
  let GABUNG = null;   /* {jenis:'sukses'|'ada'|'gagal', judul?, isi} */

  /* ===================== boot ===================== */
  async function boot() {
    try {
      const u = await A.auth.user();
      if (!u) return layar('pembuka');
      SAYA = await A.profilSaya();
      if (!SAYA) { DRAF.email = u.email || ''; return mulaiDaftar(); }
      if (!SAYA.kategori) return mulaiDaftar();
      return sesiSaya();
    } catch (e) { layar('pembuka'); UI.pesan(UI.bacaError(e).isi, 'gagal'); }
  }
  function layar(id) {
    ['pembuka','masuk','daftar','sesi'].forEach(k => { const n = el('l-' + k); if (n) n.hidden = (k !== id); });
    if (id === 'pembuka') tandaTautan();
    window.scrollTo(0, 0);
  }

  /* Pemberitahuan di halaman pembuka kalau datang dari QR/tautan sesi. */
  function tandaTautan() {
    const n = el('tautanSesi'); if (!n) return;
    if (!KODE_URL) { n.hidden = true; return; }
    n.hidden = false;
    n.innerHTML = 'Anda membuka tautan sesi <b>' + esc(KODE_URL) + '</b>. ' +
      'Masuk dulu dengan email, lalu Anda didaftarkan ke sesi ini. ' +
      'Tautan ini tidak memberi akses apa pun dengan sendirinya.';
  }

  /* ---------- gabung ke sesi dari tautan ----------
     Mendaftar BUKAN hadir. Yang ditulis di sini hanya pendaftaran;
     kehadiran tetap dicatat terpisah saat check-in di lokasi. */
  async function gabungDariTautan() {
    if (!KODE_URL || !SAYA) return;
    const kode = KODE_URL;
    try {
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(kode);
      const { data: s, error: e1 } = await (uuid
        ? A.from('sesi').select('id, judul, status').eq('id', kode).maybeSingle()
        : A.from('sesi').select('id, judul, status').eq('kode_sesi', kode.toUpperCase()).maybeSingle());
      if (e1) throw e1;
      if (!s) {
        GABUNG = { jenis: 'gagal', isi: 'Sesi dengan kode <b>' + esc(kode) + '</b> tidak ditemukan, ' +
          'atau belum dibuka untuk pendaftaran. Sesi yang masih berstatus Draft memang belum terlihat. ' +
          'Tanyakan kodenya ke fasilitator.' };
        return;
      }
      if (s.status === 'Dibatalkan') {
        GABUNG = { jenis: 'gagal', judul: s.judul,
          isi: 'Sesi ini <b>dibatalkan</b>, jadi Anda tidak didaftarkan.' };
        return;
      }
      const { data: ada, error: e2 } = await A.from('session_registration')
        .select('id').eq('sesi_id', s.id).eq('person_id', SAYA.id).maybeSingle();
      if (e2) throw e2;
      if (ada) {
        GABUNG = { jenis: 'ada', judul: s.judul,
          isi: 'Anda sudah terdaftar di sesi ini sebelumnya — tidak didaftarkan dua kali.' };
        return;
      }
      const { error: e3 } = await A.from('session_registration')
        .insert({ sesi_id: s.id, person_id: SAYA.id });
      if (e3) {
        if (e3.code === '23505') {
          GABUNG = { jenis: 'ada', judul: s.judul,
            isi: 'Anda sudah terdaftar di sesi ini — tidak didaftarkan dua kali.' };
          return;
        }
        throw e3;
      }
      GABUNG = { jenis: 'sukses', judul: s.judul,
        isi: 'Anda <b>terdaftar</b> di sesi ini. <b>Terdaftar belum berarti hadir</b> — ' +
             'kehadiran dicatat terpisah saat Anda check-in di lokasi.' };
    } catch (e) {
      GABUNG = { jenis: 'gagal', isi: 'Pendaftaran lewat tautan sesi belum berhasil: ' +
        esc(UI.bacaError(e).isi) + ' Pendaftaran Anda <b>tidak</b> tersimpan.' };
    }
  }

  function kartuGabung() {
    if (!GABUNG) return '';
    const w = GABUNG.jenis === 'sukses' ? 'hijau' : GABUNG.jenis === 'ada' ? 'biru' : 'merah';
    return '<div class="kartu"><div class="kartu-h"><h3>' +
      esc(GABUNG.judul || 'Tautan sesi') + '</h3><span class="lbl ' + w + '">' +
      (GABUNG.jenis === 'sukses' ? 'terdaftar' : GABUNG.jenis === 'ada' ? 'sudah terdaftar' : 'tidak terdaftar') +
      '</span></div><p class="mini">' + GABUNG.isi + '</p></div>';
  }

  /* ===================== masuk ===================== */
  el('keMasuk').onclick = el('keMasuk2').onclick = () => layar('masuk');
  el('kembaliPembuka').onclick = () => layar('pembuka');

  el('kirimKode').onclick = function () {
    const email = el('m-email').value.trim();
    const sah = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    el('i-m-email').classList.toggle('salah', !sah);
    el('i-m-email').querySelector('.galat').textContent = sah ? '' : 'Alamat email belum benar';
    el('i-m-email').querySelector('.galat').hidden = sah;
    if (!sah) return;
    A.sekaliSaja(this, async () => {
      await A.auth.kirimOtp(email);
      el('tahapKode').hidden = false;
      el('ketKode').textContent = 'Kode 6 angka dikirim ke ' + email + '. Periksa juga folder spam.';
      UI.pesan('Kode dikirim', 'sukses');
    });
  };
  el('verifKode').onclick = function () {
    A.sekaliSaja(this, async () => {
      await A.auth.verifikasiOtp(el('m-email').value.trim(), el('m-kode').value.trim());
      A.lupakanCache(); DRAF.email = el('m-email').value.trim();
      await boot();
    });
  };

  /* ===================== pendaftaran ===================== */
  function mulaiDaftar() { LANGKAH = 1; layar('daftar'); gambarLangkah(); }

  function gambarLangkah() {
    el('bar1').className = LANGKAH >= 1 ? 'on' : '';
    el('bar2').className = LANGKAH >= 2 ? 'on' : '';
    el('bar3').className = LANGKAH >= 3 ? 'on' : '';
    el('ketLangkah').textContent = 'Langkah ' + LANGKAH + ' dari 3';
    const V = { 1: langkah1, 2: langkah2, 3: langkah3 };
    el('isiDaftar').innerHTML = V[LANGKAH]();
    pasangLangkah();
  }

  function langkah1() {
    return '<h2>Profil Peserta</h2>' +
      '<p class="mini" style="margin:6px 0 18px">Dipakai untuk mengirim materi dan mencatat kehadiran Anda di sesi.</p>' +
      isi('nama', 'Nama lengkap', 'text', DRAF.nama, true) +
      isi('whatsapp', 'WhatsApp', 'tel', DRAF.whatsapp, true, 'Dipakai hanya untuk hal yang berkaitan dengan sesi ini.') +
      isi('email', 'Email', 'email', DRAF.email, true) +
      '<div class="isian"><label>Kategori peserta <i>*</i></label>' +
      KATEGORI.map(([k, ket]) =>
        '<label class="pilihan"><input type="radio" name="kat" value="' + esc(k) + '"' +
        (DRAF.kategori === k ? ' checked' : '') + '><span><b>' + esc(k) + '</b><em>' + esc(ket) + '</em></span></label>'
      ).join('') +
      '<span class="galat" id="g-kat" hidden></span>' +
      '<span class="bantu">Usia usaha dihitung dari tanggal mulai. Kalau hanya tahunnya yang Anda ingat, ' +
      'usianya kami catat sebagai perkiraan.</span></div>' +
      '<button class="btn lebar" data-lanjut>Lanjutkan</button>';
  }

  function langkah2() {
    const k = DRAF.kategori;
    let inti;
    if (k === 'Siswa SMA') {
      inti = '<h2>Profil Pendidikan</h2><p class="mini" style="margin:6px 0 18px">Kolom usaha tidak berlaku untuk kategori Anda — bukan dikosongkan, memang tidak berlaku.</p>' +
        isi('institusi', 'Nama sekolah', 'text', DRAF.institusi) +
        isi('kelas', 'Kelas', 'text', DRAF.kelas, false, 'Misalnya: XII') +
        isi('jurusan', 'Peminatan', 'text', DRAF.jurusan, false, 'Kosongkan kalau sekolah Anda tidak memakai peminatan.');
    } else if (k === 'Mahasiswa') {
      inti = '<h2>Profil Pendidikan</h2><p class="mini" style="margin:6px 0 18px">Kolom usaha tidak berlaku untuk kategori Anda.</p>' +
        isi('institusi', 'Kampus', 'text', DRAF.institusi) +
        isi('jurusan', 'Jurusan', 'text', DRAF.jurusan) +
        isi('semester', 'Semester', 'number', DRAF.semester);
    } else {
      inti = '<h2>Profil Usaha</h2>' +
        '<p class="mini" style="margin:6px 0 18px">Data usaha <b>tidak tampil di profil publik</b> dan hanya terbaca Anda sendiri serta pengelola berizin.</p>' +
        isi('usaha_nama', 'Nama usaha / brand', 'text', DRAF.usaha_nama, true) +
        isi('usaha_tahun', 'Tahun mulai', 'number', DRAF.usaha_tahun, false, 'Kalau tanggal pastinya ingat, isi di kolom berikutnya.') +
        isi('usaha_tanggal', 'Tanggal mulai', 'date', DRAF.usaha_tanggal, false, 'Boleh dikosongkan. Kalau diisi, usia usaha dihitung tepat.') +
        isi('usaha_industri', 'Industri utama', 'text', DRAF.usaha_industri) +
        isi('usaha_bidang', 'Bidang spesifik', 'text', DRAF.usaha_bidang) +
        pilih('usaha_bentuk', 'Bentuk usaha', BENTUK, DRAF.usaha_bentuk) +
        isi('usaha_tim', 'Tim aktif', 'number', DRAF.usaha_tim, false,
            'Termasuk pemilik yang ikut bekerja. Kalau Anda bekerja sendiri, isi 1. Isi 0 kalau belum ada yang bekerja.') +
        pilih('usaha_omzet', 'Omzet tahunan', OMZET, DRAF.usaha_omzet) +
        pilih('usaha_periode', 'Periode omzet', PERIODE, DRAF.usaha_periode) +
        '<p class="mini" style="margin:-6px 0 16px">Omzet adalah penjualan <b>sebelum biaya</b>, dan tersimpan sebagai ' +
        'pernyataan Anda — bukan angka teraudit. Boleh memilih <b>belum bersedia mengisi</b>; itu bukan nol.</p>';
    }
    return inti + '<div class="deret"><button class="btn hantu" data-mundur>Kembali</button>' +
      '<button class="btn" style="flex:1" data-lanjut>Lanjutkan</button></div>';
  }

  function langkah3() {
    return '<h2>Impian &amp; Persetujuan</h2>' +
      '<p class="mini" style="margin:6px 0 18px">Tiga pertanyaan ini membantu Aji menyesuaikan isi sesi. Boleh dikosongkan.</p>' +
      panjang('impian', 'Impian utama', DRAF.impian) +
      panjang('tantangan', 'Tantangan saat ini', DRAF.tantangan) +
      panjang('harapan', 'Harapan dari sesi ini', DRAF.harapan) +
      '<div class="kartu" style="background:var(--surface-2);margin:18px 0">' +
      '<h3 style="margin-bottom:8px">Penggunaan data Anda</h3>' +
      '<p class="mini" style="margin-bottom:14px">Tiga pilihan di bawah terpisah dan <b>tidak satu pun tercentang ' +
      'otomatis</b>. Yang pertama diperlukan supaya sesi bisa berjalan. Dua yang lain sepenuhnya pilihan Anda, ' +
      'dan <b>tidak memengaruhi materi yang Anda terima</b>.</p>' +
      setuju('kegiatan', 'Penyelenggaraan kegiatan',
        'Memproses pendaftaran, kehadiran, materi, dan aktivitas sesi yang Anda ikuti.', true) +
      setuju('komunitas', 'Bergabung #mulaiajadulu',
        'Mencatat minat Anda bergabung di komunitas belajar. Keanggotaan baru aktif setelah Anda konfirmasi lagi.', false) +
      setuju('promosi', 'Menerima info program berikutnya',
        'Kabar program lain dari Aji Jaens. Bisa Anda cabut kapan saja, dan mencabutnya tidak menghilangkan materi Anda.', false) +
      '<p class="mini" style="margin-top:12px">Anda berhak meminta salinan, perbaikan, atau penghapusan data Anda ' +
      'kapan saja lewat halaman ini.</p></div>' +
      '<span class="galat" id="g-setuju" hidden></span>' +
      '<div class="deret"><button class="btn hantu" data-mundur>Kembali</button>' +
      '<button class="btn" style="flex:1" data-simpan>Selesaikan pendaftaran</button></div>';
  }

  /* --- pembantu medan --- */
  function isi(k, l, t, v, wajib, bantu) {
    return '<div class="isian" id="i-' + k + '"><label for="f-' + k + '">' + esc(l) +
      (wajib ? ' <i>*</i>' : '') + '</label>' +
      '<input id="f-' + k + '" type="' + t + '" value="' + esc(v || '') + '"' +
      (t === 'email' ? ' inputmode="email" autocomplete="email"' : '') +
      (t === 'tel' ? ' inputmode="tel" autocomplete="tel"' : '') + '>' +
      (bantu ? '<span class="bantu">' + bantu + '</span>' : '') +
      '<span class="galat" hidden></span></div>';
  }
  function pilih(k, l, opt, v) {
    return '<div class="isian" id="i-' + k + '"><label for="f-' + k + '">' + esc(l) + '</label>' +
      '<select id="f-' + k + '"><option value="">— belum dipilih —</option>' +
      opt.map(o => '<option' + (v === o ? ' selected' : '') + '>' + esc(o) + '</option>').join('') +
      '</select><span class="galat" hidden></span></div>';
  }
  function panjang(k, l, v) {
    return '<div class="isian" id="i-' + k + '"><label for="f-' + k + '">' + esc(l) + '</label>' +
      '<textarea id="f-' + k + '" maxlength="500">' + esc(v || '') + '</textarea>' +
      '<span class="bantu"><span id="n-' + k + '">' + (v || '').length + '</span>/500</span></div>';
  }
  function setuju(kode, judul, ket, wajib) {
    return '<label class="pilihan"><input type="checkbox" data-setuju="' + kode + '"' +
      (DRAF['s_' + kode] ? ' checked' : '') + '><span><b>' + esc(judul) +
      (wajib ? ' <i style="color:var(--merah);font-style:normal">*</i>' : '') +
      '</b><em>' + esc(ket) + '</em></span></label>';
  }

  function pasangLangkah() {
    const w = el('isiDaftar');
    w.querySelectorAll('textarea').forEach(t => {
      t.oninput = () => { const n = el('n-' + t.id.slice(2)); if (n) n.textContent = t.value.length; };
    });
    const maju = w.querySelector('[data-lanjut]');  if (maju) maju.onclick = lanjut;
    const mundur = w.querySelector('[data-mundur]'); if (mundur) mundur.onclick = () => { simpanDraf(); LANGKAH--; gambarLangkah(); };
    const simpan = w.querySelector('[data-simpan]'); if (simpan) simpan.onclick = function () { kirimPendaftaran(this); };
  }

  function simpanDraf() {
    el('isiDaftar').querySelectorAll('input[id^="f-"],select[id^="f-"],textarea[id^="f-"]').forEach(n => {
      DRAF[n.id.slice(2)] = n.value;
    });
    const r = el('isiDaftar').querySelector('input[name="kat"]:checked');
    if (r) DRAF.kategori = r.value;
    el('isiDaftar').querySelectorAll('[data-setuju]').forEach(c => { DRAF['s_' + c.dataset.setuju] = c.checked; });
  }

  function lanjut() {
    simpanDraf();
    if (LANGKAH === 1) {
      let bermasalah = false;
      [['nama', 'Nama wajib diisi'], ['whatsapp', 'Nomor WhatsApp wajib diisi'], ['email', 'Email wajib diisi']]
        .forEach(([k, pesan]) => {
          const kotak = el('i-' + k), v = (DRAF[k] || '').trim();
          let g = v ? '' : pesan;
          if (!g && k === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) g = 'Format email belum benar';
          kotak.classList.toggle('salah', !!g);
          const n = kotak.querySelector('.galat'); n.textContent = g; n.hidden = !g;
          if (g) bermasalah = true;
        });
      const gk = el('g-kat');
      gk.textContent = DRAF.kategori ? '' : 'Pilih satu kategori';
      gk.hidden = !!DRAF.kategori;
      if (!DRAF.kategori) bermasalah = true;
      if (bermasalah) { UI.pesan('Ada isian yang perlu diperbaiki', 'gagal'); return; }
    }
    if (LANGKAH === 2 && adalahPengusaha(DRAF.kategori) && !(DRAF.usaha_nama || '').trim()) {
      const kotak = el('i-usaha_nama');
      kotak.classList.add('salah');
      const n = kotak.querySelector('.galat'); n.textContent = 'Nama usaha wajib diisi'; n.hidden = false;
      UI.pesan('Nama usaha wajib diisi', 'gagal'); return;
    }
    LANGKAH++; gambarLangkah();
  }

  async function kirimPendaftaran(btn) {
    simpanDraf();
    if (!DRAF.s_kegiatan) {
      const g = el('g-setuju');
      g.textContent = 'Persetujuan penyelenggaraan kegiatan diperlukan supaya sesi bisa berjalan. ' +
        'Dua pilihan lainnya tetap bebas.';
      g.hidden = false; UI.pesan('Satu persetujuan masih diperlukan', 'gagal'); return;
    }
    el('g-setuju').hidden = true;

    await A.sekaliSaja(btn, async () => {
      const u = await A.auth.user();
      /* 1. profil orang */
      let person = await A.profilSaya();
      const isiOrang = {
        nama: DRAF.nama.trim(), whatsapp: DRAF.whatsapp.trim(), email: DRAF.email.trim(),
        kategori: DRAF.kategori, auth_user_id: u.id, sumber_masuk: 'Portal'
      };
      if (person) {
        const { error } = await A.from('person').update(isiOrang).eq('id', person.id);
        if (error) throw error;
      } else {
        const { data, error } = await A.from('person').insert(isiOrang).select().single();
        if (error) throw error; person = data;
      }
      A.lupakanCache(); SAYA = person;

      /* 2. pendidikan atau usaha — sesuai kategori, tidak keduanya */
      if (DRAF.kategori === 'Siswa SMA' || DRAF.kategori === 'Mahasiswa') {
        const { error } = await A.from('education_profile').insert({
          person_id: person.id,
          jenjang: DRAF.kategori === 'Siswa SMA' ? 'SMA' : 'Perguruan tinggi',
          institusi: DRAF.institusi || null, jurusan: DRAF.jurusan || null,
          kelas: DRAF.kelas || null, semester: DRAF.semester ? Number(DRAF.semester) : null
        });
        if (error) throw error;
      } else if (adalahPengusaha(DRAF.kategori)) {
        const { data: biz, error: e1 } = await A.from('business').insert({
          nama: DRAF.usaha_nama.trim(), brand: DRAF.usaha_nama.trim(),
          tahun_mulai: DRAF.usaha_tahun ? Number(DRAF.usaha_tahun) : null,
          tanggal_mulai: DRAF.usaha_tanggal || null,
          industri: DRAF.usaha_industri || null, bidang: DRAF.usaha_bidang || null,
          bentuk: DRAF.usaha_bentuk || null,
          /* 0 adalah jawaban sah; kosong tetap null */
          tim_aktif: DRAF.usaha_tim === '' || DRAF.usaha_tim === undefined ? null : Number(DRAF.usaha_tim),
          omzet_rentang: DRAF.usaha_omzet || null, omzet_periode: DRAF.usaha_periode || null
        }).select().single();
        if (e1) throw e1;
        const { error: e2 } = await A.from('business_relationship')
          .insert({ person_id: person.id, business_id: biz.id, peran: 'Pemilik', utama: true });
        if (e2) throw e2;
      }

      /* 3. persetujuan — satu baris per tujuan, apa adanya */
      for (const kode of ['kegiatan', 'komunitas', 'promosi']) {
        await A.consent.catat(person.id, kode, !!DRAF['s_' + kode], 'portal');
      }
      /* minat komunitas hanya "Berminat" — keanggotaan aktif butuh konfirmasi lagi */
      if (DRAF.s_komunitas) {
        await A.from('community_membership').insert({
          person_id: person.id, status: 'Berminat', dikonfirmasi_peserta: false
        });
      }

      UI.pesan('Pendaftaran tersimpan', 'sukses');
      DRAF = {}; await sesiSaya();
    });
  }

  /* ===================== Sesi Saya ===================== */
  async function sesiSaya() {
    layar('sesi');
    el('halo').textContent = SAYA ? SAYA.nama : '';
    UI.memuat('isiSesi');
    try {
      await gabungDariTautan();
      const [reg, akt, lc, ap, bon, kom, ev] = await Promise.all([
        A.from('session_registration').select('*, sesi:sesi_id(*)').eq('person_id', SAYA.id),
        A.from('activity').select('*'),
        A.from('life_circle_entry').select('*').eq('person_id', SAYA.id).order('diisi_pada', { ascending: true }),
        A.from('action_plan').select('*').eq('person_id', SAYA.id),
        A.from('bonus_event').select('*').eq('person_id', SAYA.id),
        A.from('community_membership').select('*').eq('person_id', SAYA.id),
        A.from('feedback').select('*').eq('person_id', SAYA.id)
      ]);
      [reg, akt, lc, ap, bon, kom, ev].forEach(x => { if (x.error) throw x.error; });
      gambarSesi(reg.data || [], akt.data || [], lc.data || [], ap.data || [],
                 bon.data || [], (kom.data || [])[0], ev.data || []);
    } catch (e) { UI.gagal('isiSesi', e); }
  }

  function gambarSesi(reg, akt, lc, ap, bon, kom, ev) {
    const sudahIG = bon.some(b => b.jenis === 'follow_ig_dikonfirmasi');
    const sudahSpot = bon.some(b => b.jenis === 'klik_spotify');
    const baseline = lc.find(x => x.baseline);

    const kartuSesi = reg.length
      ? reg.map(r => '<div class="kartu"><div class="kartu-h"><h3>' + esc((r.sesi && r.sesi.judul) || 'Sesi') + '</h3>' +
          '<span class="lbl abu">' + esc((r.sesi && r.sesi.status) || '—') + '</span></div>' +
          '<p class="mini">Terdaftar ' + A.tgl(r.terdaftar_pada) + '. ' +
          '<b>Terdaftar belum berarti hadir</b> — kehadiran dicatat saat Anda check-in di lokasi.</p></div>').join('')
      : '<div class="keadaan"><b>Belum terdaftar di sesi mana pun</b>' +
        '<p>Begitu Anda terdaftar, materi dan aktivitasnya muncul di sini.</p></div>';

    const aktifLC = akt.find(a => a.jenis === 'life_circle' && a.status === 'Dibuka');

    /* ---- Evaluasi: untuk sesi mana saja yang sudah layak dievaluasi ----
       Dibuka kalau fasilitator membuka aktivitas evaluasi, atau kalau
       sesinya sudah Selesai. Tidak dibuka sendiri hanya karena peserta
       terdaftar — terdaftar bukan hadir, dan bukan juga sudah ikut. */
    const sesiEval = reg.map(r => r.sesi).filter(Boolean).filter(x =>
      x.status === 'Selesai' ||
      akt.some(a => a.sesi_id === x.id && a.jenis === 'evaluasi' && a.status === 'Dibuka'));
    const kartuEval = sesiEval.length
      ? '<div class="kartu"><div class="kartu-h"><h3>Evaluasi sesi</h3></div>' +
        '<p class="mini" style="margin-bottom:12px">Masukan Anda dipakai memperbaiki sesi berikutnya. ' +
        '<b>Boleh dilewati</b>, dan tidak ada bagian yang wajib dijawab.</p>' +
        sesiEval.map(x => {
          const sudah = ev.find(f => f.sesi_id === x.id);
          return '<div class="baris"><div class="pokok"><b>' + esc(x.judul) + '</b><span>' +
            (sudah ? 'terkirim ' + A.tgl(sudah.dikirim_pada) +
                     (sudah.boleh_dikutip ? ' · Anda mengizinkan kutipan' : ' · tanpa izin kutipan')
                   : 'belum diisi') + '</span></div>' +
            '<button class="btn hantu kecil" data-eval="' + x.id + '">' +
            (sudah ? 'Ubah jawaban' : 'Isi evaluasi') + '</button></div>';
        }).join('') +
        '<p class="mini" style="margin-top:12px">Pengelola melihat <b>rata-rata dan jawaban teks tanpa nama</b> — ' +
        'bukan daftar siapa menjawab apa. Kutipan hanya dipakai di luar kalau Anda mengizinkannya, ' +
        'dan izin itu pun <b>tidak membuat apa pun terbit otomatis</b>.</p></div>'
      : '';

    el('isiSesi').innerHTML =
      kartuGabung() +
      kartuEval +
      kartuSesi +
      /* ---- Materi ---- */
      '<div class="kartu"><div class="kartu-h"><h3>Materi</h3></div>' +
      (akt.some(a => a.jenis === 'materi' && a.status === 'Dibuka')
        ? '<p>Materi sesi sudah dibuka fasilitator.</p>'
        : '<p class="mini">Materi dibuka oleh fasilitator saat sesi berlangsung. ' +
          'Ketersediaannya tidak bergantung pada persetujuan promosi.</p>') + '</div>' +

      /* ---- Life Circle ---- */
      '<div class="kartu"><div class="kartu-h"><h3>Wellbeing Life Circle</h3>' +
      (baseline ? '<span class="lbl hijau">sudah diisi</span>' : '<span class="lbl abu">belum diisi</span>') + '</div>' +
      '<p class="mini" style="margin-bottom:12px">Refleksi diri, <b>bukan diagnosis dan bukan peringkat</b>. ' +
      'Hasilnya hanya Anda yang melihat.</p>' +
      (aktifLC
        ? '<button class="btn" id="bukaLC" data-akt="' + aktifLC.id + '">' +
          (baseline ? 'Isi lagi (baseline tetap tersimpan)' : 'Mulai refleksi') + '</button>'
        : '<p class="mini">Aktivitas ini belum dibuka fasilitator.</p>') +
      (lc.length > 1 ? '<p class="mini" style="margin-top:10px">Anda sudah mengisi ' + lc.length +
        ' kali. Pengisian baru <b>tidak menimpa</b> yang pertama.</p>' : '') + '</div>' +

      /* ---- Action plan ---- */
      '<div class="kartu"><div class="kartu-h"><h3>Action Plan 7 hari</h3>' +
      (ap.length ? '<span class="lbl biru">' + esc(ap[0].status) + '</span>' : '') + '</div>' +
      (ap.length
        ? '<p><b>' + esc(ap[0].tujuan || '—') + '</b></p><p class="mini">' + esc(ap[0].langkah_7hari || '') + '</p>' +
          '<div class="deret" style="margin-top:10px"><button class="btn hantu kecil" id="perbaruiAP">Perbarui status</button></div>'
        : '<p class="mini" style="margin-bottom:10px">Langkah kecil yang konsisten selama tujuh hari.</p>' +
          '<button class="btn" id="buatAP">Buat action plan</button>') + '</div>' +

      /* ---- Bonus ---- */
      '<div class="kartu"><div class="kartu-h"><h3>Bonus audio</h3></div>' +
      '<p style="margin-bottom:4px"><b>100 Habits for a Better Future</b> — Aji Jaens Suputtra</p>' +
      '<p class="mini" style="margin-bottom:14px">Podcast di Spotify. <b>Bukan Spotify Premium</b>, dan isinya ' +
      'memang terbuka untuk umum — tombol di sini hanya mengantar Anda ke sana.</p>' +
      '<ol style="margin:0 0 12px;padding-left:20px;font-size:14.5px">' +
      '<li style="margin-bottom:8px">Buka Instagram: <a href="' + IG + '" target="_blank" rel="noopener">@ajijaens.official</a></li>' +
      '<li style="margin-bottom:8px"><label class="pilihan" style="margin:6px 0"><input type="checkbox" id="cekIG"' +
      (sudahIG ? ' checked disabled' : '') + '><span><b>Saya sudah mengikuti akun ini</b>' +
      '<em>Tercatat sebagai pernyataan Anda. Kami tidak memeriksanya ke Instagram, dan tidak pernah meminta kata sandi.</em>' +
      '</span></label></li>' +
      '<li><a class="btn' + (sudahIG ? '' : ' hantu') + '" id="keSpotify" href="' + SPOTIFY +
      '" target="_blank" rel="noopener"' + (sudahIG ? '' : ' aria-disabled="true"') + '>Dengarkan di Spotify</a></li></ol>' +
      (sudahSpot ? '<p class="mini">Klik Spotify sudah tercatat. Itu peristiwa klik — ' +
        '<b>bukan bukti Anda selesai mendengarkan</b>.</p>' : '') + '</div>' +

      /* ---- Komunitas ---- */
      '<div class="kartu"><div class="kartu-h"><h3>#mulaiajadulu</h3>' +
      (kom ? '<span class="lbl ' + (kom.status === 'Member aktif' ? 'hijau' : 'biru') + '">' + esc(kom.status) + '</span>'
           : '<span class="lbl abu">Belum bergabung</span>') + '</div>' +
      (kom && kom.status !== 'Member aktif'
        ? '<p class="mini" style="margin-bottom:10px">Minat Anda tercatat. Keanggotaan baru aktif setelah ' +
          'Anda konfirmasi sendiri di bawah.</p><button class="btn" id="konfirmasiKom">Konfirmasi bergabung</button>'
        : kom ? '<p class="mini">Anda anggota aktif sejak ' + A.tgl(kom.dikonfirmasi_pada) + '.</p>'
              : '<p class="mini">Anda belum menyatakan minat bergabung.</p>') + '</div>' +

      /* ---- Hak data ---- */
      '<div class="kartu"><div class="kartu-h"><h3>Data Anda</h3></div>' +
      '<p class="mini" style="margin-bottom:12px">Anda berhak meminta salinan, perbaikan, atau penghapusan data ' +
      'Anda. Permohonan dicatat dan dijawab — diterima maupun ditolak, alasannya disampaikan.</p>' +
      '<div class="deret"><button class="btn hantu kecil" data-hak="Akses">Minta salinan data</button>' +
      '<button class="btn hantu kecil" data-hak="Perbaikan">Minta perbaikan</button>' +
      '<button class="btn hantu kecil" data-hak="Penghapusan">Minta penghapusan</button>' +
      '<button class="btn hantu kecil" id="aturConsent">Atur persetujuan</button></div></div>';

    pasangSesi(akt, lc, ap, kom, sudahIG, ev);
  }

  function pasangSesi(akt, lc, ap, kom, sudahIG, ev) {
    const q = (s) => el('isiSesi').querySelector(s);
    const lcBtn = q('#bukaLC');
    if (lcBtn) lcBtn.onclick = () => bukaLifeCircle(lcBtn.dataset.akt, lc,
      (akt.find(a => a.id === lcBtn.dataset.akt) || {}).sesi_id || null);
    const igBox = q('#cekIG');
    if (igBox && !igBox.disabled) igBox.onchange = async () => {
      if (!igBox.checked) return;
      const { error } = await A.from('bonus_event').insert({ person_id: SAYA.id, jenis: 'follow_ig_dikonfirmasi' });
      if (error) { igBox.checked = false; UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
      UI.pesan('Tercatat sebagai pernyataan Anda', 'sukses'); sesiSaya();
    };
    const spot = q('#keSpotify');
    if (spot) spot.onclick = async (e) => {
      if (!sudahIG) { e.preventDefault(); UI.pesan('Centang dulu konfirmasi follow Instagram', 'gagal'); return; }
      await A.from('bonus_event').insert({ person_id: SAYA.id, jenis: 'klik_spotify' });
    };
    const km = q('#konfirmasiKom');
    if (km) km.onclick = function () { A.sekaliSaja(this, async () => {
      const { error } = await A.from('community_membership').update({
        status: 'Member aktif', dikonfirmasi_peserta: true, dikonfirmasi_pada: new Date().toISOString()
      }).eq('person_id', SAYA.id);
      if (error) throw error;
      UI.pesan('Keanggotaan dikonfirmasi', 'sukses'); sesiSaya();
    }); };
    const buatAP = q('#buatAP'); if (buatAP) buatAP.onclick = () => formActionPlan(null);
    const ubahAP = q('#perbaruiAP'); if (ubahAP) ubahAP.onclick = () => formActionPlan(ap[0]);
    const consent = q('#aturConsent'); if (consent) consent.onclick = aturConsent;
    el('isiSesi').querySelectorAll('[data-hak]').forEach(b => b.onclick = () => mintaHak(b.dataset.hak));
    el('isiSesi').querySelectorAll('[data-eval]').forEach(b => b.onclick = () =>
      bukaEvaluasi(b.dataset.eval, ev.find(f => f.sesi_id === b.dataset.eval) || null));
  }

  /* ---------- Evaluasi sesi ----------
     Skala dimulai dari "belum dijawab", bukan dari angka tengah. Nol
     adalah jawaban sah dan harus bisa dipilih; yang dilewati tersimpan
     sebagai tidak-ada-kunci, bukan sebagai 0. */
  async function bukaEvaluasi(sesiId, sudah) {
    const lama = (sudah && sudah.jawaban) || {};
    const nilai = {};
    A.EVAL.medan.forEach(m => {
      nilai[m.k] = (lama[m.k] === undefined || lama[m.k] === null) ? null : lama[m.k];
    });

    const skala = A.EVAL.medan.filter(m => m.t === 'skala');
    const teks  = A.EVAL.medan.filter(m => m.t === 'teks');

    const lapis = document.createElement('div');
    lapis.className = 'lapis';
    lapis.innerHTML = '<div class="lapis-kotak" role="dialog" aria-modal="true" aria-label="Evaluasi sesi">' +
      '<h3>' + (sudah ? 'Ubah evaluasi' : 'Evaluasi sesi') + '</h3>' +
      '<p class="mini" style="margin:6px 0 16px">' +
      (sudah ? 'Mengirim ulang <b>menggantikan</b> jawaban Anda sebelumnya. Jawaban lama tidak disimpan ganda.'
             : 'Beri nilai 0–10, atau lewati. <b>Yang dilewati tercatat belum dijawab</b> — ' +
               'dan itu berbeda dari memberi nilai 0.') + '</p>' +
      skala.map((m, i) =>
        '<div class="isian" data-k="' + esc(m.k) + '"><label for="ev' + i + '">' + esc(m.l) +
        ' <span class="nilai-lc" id="ev-v' + i + '">' +
        (nilai[m.k] === null ? 'belum dijawab' : nilai[m.k] + ' / 10') + '</span></label>' +
        '<input id="ev' + i + '" type="range" min="0" max="10" step="1" value="' +
        (nilai[m.k] === null ? 5 : nilai[m.k]) + '">' +
        '<div class="deret" style="gap:6px">' +
        '<button class="btn hantu kecil" data-set="' + i + '">Pakai nilai ini</button>' +
        '<button class="btn hantu kecil" data-lewati="' + i + '">Lewati</button></div></div>').join('') +
      teks.map((m, i) =>
        '<div class="isian"><label for="evt' + i + '">' + esc(m.l) + '</label>' +
        '<textarea id="evt' + i + '" maxlength="700" data-k="' + esc(m.k) + '">' +
        esc(nilai[m.k] || '') + '</textarea></div>').join('') +
      '<label class="pilihan" style="margin:6px 0 2px"><input type="checkbox" id="ev-kutip"' +
      (sudah && sudah.boleh_dikutip ? ' checked' : '') + '><span>' +
      '<b>Boleh mengutip jawaban teks saya</b>' +
      '<em>Tanpa nama kecuali Anda diminta lagi dan setuju. Mencentang ini tidak menerbitkan apa pun — ' +
      'ia hanya menandai bahwa Anda tidak keberatan.</em></span></label>' +
      '<div class="deret" style="margin-top:12px">' +
      '<button class="btn" data-kirim style="flex:1">' + (sudah ? 'Kirim ulang' : 'Kirim evaluasi') + '</button>' +
      '<button class="btn hantu" data-batal>Batal</button></div>' +
      '<p class="mini" style="margin-top:10px">Tidak mengisi evaluasi <b>tidak menghilangkan</b> materi, ' +
      'bonus, atau keanggotaan Anda.</p></div>';
    document.body.appendChild(lapis);

    lapis.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
      const i = b.dataset.set, r = lapis.querySelector('#ev' + i);
      nilai[skala[i].k] = Number(r.value);
      lapis.querySelector('#ev-v' + i).textContent = r.value + ' / 10';
    });
    lapis.querySelectorAll('[data-lewati]').forEach(b => b.onclick = () => {
      const i = b.dataset.lewati;
      nilai[skala[i].k] = null;
      lapis.querySelector('#ev-v' + i).textContent = 'belum dijawab';
    });
    lapis.querySelector('[data-batal]').onclick = () => lapis.remove();
    lapis.querySelector('[data-kirim]').onclick = function () {
      A.sekaliSaja(this, async () => {
        teks.forEach((m, i) => {
          const v = lapis.querySelector('#evt' + i).value.trim();
          nilai[m.k] = v || null;
        });
        /* Kunci yang null DIBUANG, tidak dikirim sebagai 0 atau string kosong.
           Yang tidak dijawab harus tetap terbaca sebagai tidak dijawab. */
        const jawaban = {};
        Object.keys(nilai).forEach(k => { if (nilai[k] !== null) jawaban[k] = nilai[k]; });
        const kutip = lapis.querySelector('#ev-kutip').checked;

        const { error } = sudah
          ? await A.from('feedback').update({
              jawaban, boleh_dikutip: kutip, template_versi: A.EVAL.versi,
              dikirim_pada: new Date().toISOString() }).eq('id', sudah.id)
          : await A.from('feedback').insert({
              sesi_id: sesiId, person_id: SAYA.id, jawaban,
              boleh_dikutip: kutip, template_versi: A.EVAL.versi });
        if (error) {
          if (error.code === '23505') {
            UI.pesan('Anda sudah pernah mengirim evaluasi sesi ini — muat ulang halaman untuk mengubahnya', 'gagal');
            return;
          }
          throw error;
        }
        lapis.remove();
        UI.pesan(Object.keys(jawaban).length ? 'Evaluasi terkirim' : 'Evaluasi terkirim tanpa jawaban', 'sukses');
        sesiSaya();
      });
    };
  }

  /* ---------- Life Circle ---------- */
  /* sesiId wajib ikut tersimpan: rekap agregat wellbeing di sisi pengelola
     disaring per sesi, jadi entri tanpa sesi_id tidak akan pernah terhitung
     dan layar rekap akan menyebut "belum ada pengisi" padahal ada. */
  async function bukaLifeCircle(aktId, riwayat, sesiId) {
    const { data: tpl, error } = await A.from('life_circle_template').select('*').eq('aktif', true).limit(1);
    if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
    const t = (tpl || [])[0];
    if (!t) { UI.pesan('Template Life Circle belum disiapkan pengelola', 'gagal'); return; }
    const aspek = Array.isArray(t.aspek) ? t.aspek : JSON.parse(t.aspek || '[]');

    /* null = belum dijawab. Slider TIDAK dimulai dari 0, karena 0 jawaban sah. */
    const nilai = {}; aspek.forEach(a => { nilai[a] = null; });

    const lapis = document.createElement('div');
    lapis.className = 'lapis';
    lapis.innerHTML = '<div class="lapis-kotak" role="dialog" aria-modal="true" aria-label="Wellbeing Life Circle">' +
      '<h3>Wellbeing Life Circle</h3>' +
      '<p class="mini" style="margin:6px 0 16px">Beri nilai 0–10 pada setiap aspek. <b>Boleh dilewati</b> — ' +
      'yang dilewati tercatat belum dijawab, dan itu berbeda dari nilai 0.</p>' +
      aspek.map((a, i) =>
        '<div class="isian" data-aspek="' + esc(a) + '"><label for="lc' + i + '">' + esc(a) +
        ' <span class="nilai-lc" id="v' + i + '">belum dijawab</span></label>' +
        '<input id="lc' + i + '" type="range" min="0" max="10" step="1" value="5" data-belum="1">' +
        '<div class="deret" style="gap:6px"><button class="btn hantu kecil" data-set="' + i + '">Pakai nilai ini</button>' +
        '<button class="btn hantu kecil" data-lewati="' + i + '">Lewati</button></div></div>').join('') +
      '<div class="isian"><label for="lc-prioritas">Aspek prioritas</label>' +
      '<select id="lc-prioritas"><option value="">— belum dipilih —</option>' +
      aspek.map(a => '<option>' + esc(a) + '</option>').join('') + '</select></div>' +
      '<div class="isian"><label for="lc-langkah">Langkah saya dalam 7 hari</label>' +
      '<textarea id="lc-langkah" maxlength="500" placeholder="Tulis langkah konkretnya…"></textarea></div>' +
      '<div class="deret"><button class="btn" data-simpan style="flex:1">Simpan refleksi</button>' +
      '<button class="btn hantu" data-batal>Batal</button></div>' +
      '<p class="mini" style="margin-top:10px">Hasil ini pribadi. Fasilitator hanya melihat <b>berapa orang</b> ' +
      'yang sudah mengisi, bukan isinya.</p></div>';
    document.body.appendChild(lapis);

    lapis.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
      const i = b.dataset.set, r = lapis.querySelector('#lc' + i);
      r.dataset.belum = '0'; nilai[aspek[i]] = Number(r.value);
      lapis.querySelector('#v' + i).textContent = r.value + ' / 10';
    });
    lapis.querySelectorAll('[data-lewati]').forEach(b => b.onclick = () => {
      const i = b.dataset.lewati, r = lapis.querySelector('#lc' + i);
      r.dataset.belum = '1'; nilai[aspek[i]] = null;
      lapis.querySelector('#v' + i).textContent = 'belum dijawab';
    });
    lapis.querySelector('[data-batal]').onclick = () => lapis.remove();
    lapis.querySelector('[data-simpan]').onclick = function () {
      A.sekaliSaja(this, async () => {
        const { data: entry, error: e1 } = await A.from('life_circle_entry').insert({
          person_id: SAYA.id, template_id: t.id, template_versi: t.versi,
          sesi_id: sesiId || null,
          baseline: !riwayat.some(x => x.baseline),
          aspek_prioritas: lapis.querySelector('#lc-prioritas').value || null,
          langkah_7hari: lapis.querySelector('#lc-langkah').value.trim() || null
        }).select().single();
        if (e1) throw e1;
        const baris = aspek.map(a => ({ entry_id: entry.id, aspek: a, nilai: nilai[a] }));
        const { error: e2 } = await A.from('life_circle_score').insert(baris);
        if (e2) throw e2;
        lapis.remove(); UI.pesan('Refleksi tersimpan', 'sukses'); sesiSaya();
      });
    };
  }

  /* ---------- action plan ---------- */
  async function formActionPlan(ada) {
    const v = await A.formulir(ada ? 'Perbarui action plan' : 'Action plan 7 hari',
      ada ? 'Melaporkan selesai berarti <b>Anda melaporkannya</b> — bukan hasil yang sudah diverifikasi.'
          : 'Satu langkah kecil yang benar-benar bisa Anda jalankan dalam tujuh hari.',
      ada
        ? [{ k: 'status', l: 'Status', t: 'pilih',
             opt: ['Belum diperbarui','Dilaporkan berjalan','Dilaporkan selesai','Perlu bantuan'] },
           { k: 'bukti', l: 'Catatan atau tautan bukti', t: 'panjang' }]
        : [{ k: 'tujuan', l: 'Tujuan', wajib: true },
           { k: 'langkah_7hari', l: 'Langkah 7 hari', t: 'panjang', wajib: true },
           { k: 'dukungan', l: 'Dukungan yang saya butuhkan', t: 'panjang' }]);
    if (!v) return;
    const q = ada
      ? A.from('action_plan').update({ status: v.status, bukti: v.bukti || null,
          diperbarui_pada: new Date().toISOString() }).eq('id', ada.id)
      : A.from('action_plan').insert({ person_id: SAYA.id, tujuan: v.tujuan,
          langkah_7hari: v.langkah_7hari, dukungan: v.dukungan || null });
    const { error } = await q;
    if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
    UI.pesan('Tersimpan', 'sukses'); sesiSaya();
  }

  /* ---------- hak subjek data ---------- */
  async function mintaHak(jenis) {
    const v = await A.formulir('Permohonan: ' + jenis,
      'Permohonan Anda dicatat dengan waktunya dan wajib dijawab. ' +
      (jenis === 'Penghapusan' ? '<b>Penghapusan menghilangkan jawaban dan refleksi Anda secara permanen.</b> ' +
        'Catatan persetujuan dan jejak audit tetap disimpan — justru itu bukti bahwa penghapusannya sah.' : ''),
      [{ k: 'isi', l: 'Keterangan', t: 'panjang', wajib: jenis === 'Perbaikan',
         ph: jenis === 'Perbaikan' ? 'Bagian mana yang perlu diperbaiki?' : 'Boleh dikosongkan.' }]);
    if (!v) return;
    const { error } = await A.from('data_subject_request').insert({
      person_id: SAYA.id, jenis, isi: v.isi || null, pemohon_email: SAYA.email || null });
    if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
    UI.pesan('Permohonan tercatat. Anda akan dihubungi.', 'sukses');
  }

  /* ---------- atur persetujuan ---------- */
  async function aturConsent() {
    const [tujuan, milik] = await Promise.all([A.consent.tujuan(), A.consent.milikSaya(SAYA.id)]);
    const bisaDiubah = tujuan.filter(t => !t.wajib);
    const v = await A.formulir('Atur persetujuan',
      'Mencabut persetujuan <b>tidak menghilangkan materi</b> yang sudah menjadi hak Anda.',
      bisaDiubah.map(t => {
        const c = milik.terakhir[t.kode];
        const aktif = c && c.diberikan && !c.dicabut_pada;
        return { k: t.kode, l: t.nama, t: 'pilih', opt: aktif ? ['Tetap setuju', 'Cabut'] : ['Tidak setuju', 'Setuju'],
                 bantu: esc(t.deskripsi) };
      }));
    if (!v) return;
    for (const t of bisaDiubah) {
      const pilihan = v[t.kode];
      if (pilihan === 'Cabut') await A.consent.catat(SAYA.id, t.kode, false, 'portal');
      if (pilihan === 'Setuju') await A.consent.catat(SAYA.id, t.kode, true, 'portal');
    }
    UI.pesan('Persetujuan diperbarui', 'sukses');
  }

  el('keluarPortal').onclick = async () => { await A.auth.keluar(); location.reload(); };

  boot();
})();
