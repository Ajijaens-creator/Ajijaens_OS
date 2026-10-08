/* =====================================================================
   NP-V08 — SESI & KENDALI FASILITATOR

   Yang dipegang ketat:
   - Timer dihitung dari waktu mulai yang TERSIMPAN, bukan dari saat
     halaman dibuka. Muat ulang tidak mengulang hitungan.
   - Terdaftar BUKAN hadir. Dua angka terpisah, keduanya disebut.
   - Membuka aktivitas di portal BERBEDA dari menampilkannya di proyektor.
   - Menutup aktivitas tidak menghapus jawaban yang sudah terkirim.
   - Progres dihitung dari peserta UNIK, dengan penyebut yang disebutkan.
   - Proyektor tidak pernah menampilkan catatan presenter, kontak, omzet,
     atau jawaban perorangan.
   - Pembaruan ini POLLING, bukan realtime, dan dikatakan apa adanya.
   ===================================================================== */
(function () {
  'use strict';
  const A = window.AJIOS, esc = A.esc, el = A.el, UI = A.UI;

  const JEDA_POLL = 12000;   /* 12 detik */
  let SESI = null, PERAN = null, TAB = 'kendali', POLL = null, DETIK = null;
  let DATA = { reg: [], hadir: [], akt: [], tanya: [], prog: [] };
  let TERAKHIR = null;

  /* ===================== boot ===================== */
  async function boot() {
    try {
      const u = await A.auth.user();
      if (!u) { el('gerbang').hidden = false; return; }
      PERAN = await A.peranSaya();
      el('peran').textContent = PERAN || 'bukan pengelola';
      el('peran').className = 'lbl ' + (PERAN ? 'emas' : 'abu');
      el('keluar').hidden = false;
      if (!PERAN || ['admin', 'fasilitator', 'operator'].indexOf(PERAN) === -1) {
        el('bukanStaf').hidden = false; return;
      }
      el('isi').hidden = false;
      await pilihSesi();
    } catch (e) { el('isi').hidden = false; UI.gagal('daftarSesi', e); }
  }

  el('kirimKode').onclick = function () {
    A.sekaliSaja(this, async () => {
      await A.auth.kirimOtp(el('email').value.trim());
      el('tahapKode').hidden = false; UI.pesan('Kode dikirim', 'sukses');
    });
  };
  el('verifKode').onclick = function () {
    A.sekaliSaja(this, async () => {
      await A.auth.verifikasiOtp(el('email').value.trim(), el('kode').value.trim());
      A.lupakanCache(); el('gerbang').hidden = true; await boot();
    });
  };
  el('keluar').onclick = async () => { await A.auth.keluar(); location.reload(); };

  /* ===================== pilih sesi ===================== */
  async function pilihSesi() {
    UI.memuat('daftarSesi', 'Memuat sesi…');
    const { data, error } = await A.from('sesi').select('*').order('mulai_pada', { ascending: false });
    if (error) return UI.gagal('daftarSesi', error);
    const list = data || [];
    if (!list.length) return UI.kosong('daftarSesi', 'Belum ada sesi',
      'Sesi dibuat dari program yang sudah siap. Kesiapan program tidak sama dengan selesainya sesi.',
      '<button class="btn" id="buatSesi">Buat sesi</button>') || pasangBuat();
    el('daftarSesi').innerHTML = list.map(s =>
      '<button class="baris" style="width:100%;text-align:left;background:none;border-top:1px solid var(--border-soft);cursor:pointer" data-sesi="' + s.id + '">' +
      '<span class="pokok"><b>' + esc(s.judul) + '</b><span>' +
      (s.mulai_pada ? A.tgl(s.mulai_pada) + ' · ' + A.jam(s.mulai_pada) : 'belum dijadwalkan') +
      (s.kode_sesi ? ' · kode ' + esc(s.kode_sesi) : '') + '</span></span>' +
      '<span class="lbl ' + warnaStatus(s.status) + '">' + esc(s.status) + '</span></button>').join('') +
      '<div class="deret" style="margin-top:14px"><button class="btn hantu kecil" id="buatSesi">+ Sesi baru</button></div>';
    el('daftarSesi').querySelectorAll('[data-sesi]').forEach(b =>
      b.onclick = () => muatSesi(b.dataset.sesi));
    pasangBuat();
  }
  const warnaStatus = s => ({ Draft: 'abu', Terjadwal: 'biru', Berlangsung: 'hijau',
                              Selesai: 'abu', Dibatalkan: 'merah' }[s] || 'abu');
  function pasangBuat() {
    const b = el('buatSesi'); if (!b) return;
    b.onclick = async () => {
      const v = await A.formulir('Sesi baru',
        'Sesi dibuat sebagai <b>Draft</b>. Statusnya Anda naikkan sendiri — ' +
        'kesiapan program tidak otomatis berarti sesi siap.',
        [{ k: 'judul', l: 'Judul sesi', wajib: true },
         { k: 'mulai', l: 'Mulai', t: 'datetime-local' },
         { k: 'durasi', l: 'Durasi (menit)', t: 'number', ph: '150' },
         { k: 'lokasi', l: 'Lokasi' },
         { k: 'kapasitas', l: 'Kapasitas', t: 'number' },
         { k: 'kode', l: 'Kode sesi', bantu: 'Dipakai peserta untuk bergabung. Huruf dan angka saja.' }]);
      if (!v) return;
      const { data, error } = await A.from('sesi').insert({
        judul: v.judul, mulai_pada: v.mulai || null,
        durasi_menit: v.durasi ? Number(v.durasi) : null, lokasi: v.lokasi || null,
        kapasitas: v.kapasitas ? Number(v.kapasitas) : null,
        kode_sesi: (v.kode || '').toUpperCase().replace(/[^A-Z0-9-]/g, '') || null,
        status: 'Draft'
      }).select().single();
      if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
      UI.pesan('Sesi dibuat sebagai Draft', 'sukses');
      muatSesi(data.id);
    };
  }

  /* ===================== muat satu sesi ===================== */
  async function muatSesi(id) {
    el('pilih').hidden = true; el('kerja').hidden = false;
    UI.memuat('isiTab', 'Memuat…');
    await segarkan(id, true);
    if (POLL) clearInterval(POLL);
    POLL = setInterval(() => segarkan(SESI.id, false), JEDA_POLL);
    if (DETIK) clearInterval(DETIK);
    DETIK = setInterval(gambarTimer, 1000);
  }

  async function segarkan(id, penuh) {
    try {
      /* Progres diambil dari view `progres_aktivitas`, BUKAN dari tabel
         activity_response. Jawaban perorangan memang tertutup untuk
         fasilitator — kalau dihitung langsung dari tabelnya, hasilnya
         selalu 0 dan layar ini akan menuliskan angka palsu. */
      const [s, reg, hadir, akt, tanya, prog] = await Promise.all([
        A.from('sesi').select('*').eq('id', id).maybeSingle(),
        A.from('session_registration').select('*, person:person_id(nama, kategori)').eq('sesi_id', id),
        A.from('attendance').select('*').eq('sesi_id', id),
        A.from('activity').select('*').eq('sesi_id', id),
        A.from('pertanyaan').select('*').eq('sesi_id', id).order('dikirim_pada', { ascending: false }),
        A.from('progres_aktivitas').select('*').eq('sesi_id', id)
      ]);
      [s, reg, hadir, akt, tanya, prog].forEach(x => { if (x.error) throw x.error; });
      SESI = s.data;
      DATA = { reg: reg.data || [], hadir: hadir.data || [], akt: akt.data || [],
               tanya: tanya.data || [], prog: prog.data || [] };
      TERAKHIR = new Date();
      if (penuh) gambarSemua(); else { gambarAngka(); gambarTab(); gambarKoneksi(); }
    } catch (e) {
      el('koneksi').innerHTML = '<span class="lbl merah">terputus</span>';
      if (penuh) UI.gagal('isiTab', e);
    }
  }

  function gambarKoneksi() {
    const detik = TERAKHIR ? Math.round((Date.now() - TERAKHIR) / 1000) : null;
    el('koneksi').innerHTML = '<span class="lbl ' + (detik !== null && detik < 40 ? 'hijau' : 'oranye') + '">' +
      (detik === null ? 'belum terhubung' : 'diperbarui ' + detik + ' detik lalu') + '</span>';
  }

  /* ===================== tampilan ===================== */
  function gambarSemua() {
    el('judulSesi').textContent = SESI.judul;
    el('subSesi').textContent = [SESI.lokasi, SESI.durasi_menit ? SESI.durasi_menit + ' menit' : '',
      SESI.kode_sesi ? 'kode ' + SESI.kode_sesi : ''].filter(Boolean).join(' · ');
    el('statusSesi').innerHTML = '<span class="lbl ' + warnaStatus(SESI.status) + '">' + esc(SESI.status) + '</span>';
    gambarAngka(); gambarTimer(); gambarTab(); gambarKoneksi();
  }

  /* Jumlah pengirim satu aktivitas, apa adanya:
       angka  -> berhak menghitung, itu hasilnya (0 pun sah)
       null   -> TIDAK berhak menghitung
       undefined -> barisnya belum termuat
     Tiga keadaan ini tidak boleh dilebur menjadi 0. */
  function pengirim(aktId) {
    const p = DATA.prog.find(x => x.activity_id === aktId);
    return p ? p.pengirim : undefined;
  }
  function tulisPengirim(n, penyebut) {
    if (n === null) return '<span class="nihil">belum bisa dihitung di sini</span>';
    if (n === undefined) return '<span class="nihil">belum termuat</span>';
    return '<b>' + n + ' peserta unik</b> dari <b>' + penyebut + ' yang hadir</b> sudah mengirim';
  }

  function gambarAngka() {
    const terdaftar = DATA.reg.length;
    const hadir = DATA.hadir.filter(a => a.hadir).length;
    const lc = DATA.akt.find(a => a.jenis === 'life_circle');
    const nLC = lc ? pengirim(lc.id) : undefined;
    const tanya = DATA.tanya.length;
    el('angka').innerHTML = [
      ['Terdaftar', terdaftar, 'orang mendaftar'],
      ['Hadir', hadir, 'dari ' + terdaftar + ' terdaftar'],
      [lc ? esc(lc.judul) : 'Aktivitas',
       lc ? (nLC === null || nLC === undefined ? '—' : nLC) : 0,
       lc ? (nLC === null ? 'jumlah pengirim tidak terbuka untuk peran ini'
            : nLC === undefined ? 'belum termuat'
            : 'dari ' + hadir + ' yang hadir')
          : 'belum ada aktivitas'],
      ['Pertanyaan masuk', tanya, 'dari peserta']
    ].map(([l, n, ket]) => '<div class="kartu" style="flex:1;min-width:150px">' +
      '<div class="mini">' + l + '</div><div style="font-family:var(--fd);font-size:30px;line-height:1.1">' + n + '</div>' +
      '<div class="mini">' + ket + '</div></div>').join('');
  }

  /* Timer dari waktu tersimpan. Muat ulang tidak mengubah apa pun. */
  function gambarTimer() {
    const n = el('timer'); if (!n || !SESI) return;
    if (!SESI.dimulai_pada) { n.textContent = '00:00'; n.className = 'mini'; return; }
    const akhir = SESI.diakhiri_pada ? new Date(SESI.diakhiri_pada) : new Date();
    let det = Math.max(0, Math.floor((akhir - new Date(SESI.dimulai_pada)) / 1000) - (SESI.jeda_detik || 0));
    const mm = String(Math.floor(det / 60)).padStart(2, '0'), ss = String(det % 60).padStart(2, '0');
    const target = (SESI.durasi_menit || 0) * 60;
    n.textContent = mm + ':' + ss + (target ? ' / ' + String(Math.floor(target / 60)).padStart(2, '0') + ':00' : '');
    n.className = target && det > target ? 'lbl merah' : 'lbl hijau';
  }

  const TABS = [['kendali', 'Kendali Sesi'], ['peserta', 'Peserta'], ['aktivitas', 'Aktivitas'], ['tanya', 'Pertanyaan']];
  el('tabSesi').innerHTML = TABS.map(([k, n]) =>
    '<button role="tab" aria-selected="' + (k === 'kendali') + '" data-t="' + k + '">' + n + '</button>').join('');
  el('tabSesi').onclick = (e) => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    TAB = b.dataset.t;
    el('tabSesi').querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    gambarTab();
  };

  function gambarTab() {
    const V = { kendali: tKendali, peserta: tPeserta, aktivitas: tAktivitas, tanya: tTanya };
    el('isiTab').innerHTML = (V[TAB] || tKendali)();
    pasangTab();
  }

  /* ---------- Kendali ---------- */
  function tKendali() {
    const url = alamatSesi();
    return '<div class="kisi dua">' +
      '<div class="kartu"><div class="kartu-h"><h3>Status sesi</h3></div>' +
      '<p class="mini" style="margin-bottom:12px">Draft → Terjadwal → Berlangsung → Selesai. ' +
      '<b>Kesiapan program bukan selesainya sesi.</b></p>' +
      '<div class="deret">' +
      (SESI.status !== 'Berlangsung' && SESI.status !== 'Selesai'
        ? '<button class="btn" data-mulai>Mulai sesi</button>' : '') +
      (SESI.status === 'Berlangsung' ? '<button class="btn bahaya" data-akhiri>Akhiri sesi</button>' : '') +
      '<button class="btn hantu" data-proyektor>Buka layar proyektor</button></div>' +
      (SESI.dimulai_pada ? '<p class="mini" style="margin-top:10px">Dimulai ' + A.jam(SESI.dimulai_pada) +
        '. Penghitung waktu berjalan dari jam itu — memuat ulang halaman tidak mengulanginya.</p>' : '') +
      '</div>' +

      '<div class="kartu"><div class="kartu-h"><h3>Akses peserta</h3></div>' +
      '<div id="qr" style="display:grid;place-items:center;min-height:150px;background:#fff;border:1px solid var(--border);border-radius:10px;padding:12px"></div>' +
      '<p class="mini" style="margin-top:10px">Kode sesi: <b>' + esc(SESI.kode_sesi || 'belum diisi') + '</b></p>' +
      '<p class="mini" style="word-break:break-all">' + esc(url) + '</p>' +
      '<p class="mini" style="margin-top:8px">QR ini dibuat dari alamat di atas. <b>Pindai sendiri sekali</b> ' +
      'sebelum sesi untuk memastikan — saya tidak bisa memindainya dari sini.</p>' +
      '<p class="mini">QR ini publik dan tidak membawa hak akses apa pun.</p></div>' +
      '</div>' +

      '<div class="kartu" style="margin-top:14px"><div class="kartu-h"><h3>Kendali aktivitas</h3></div>' +
      (DATA.akt.length ? DATA.akt.map(a => {
        const hadir = DATA.hadir.filter(x => x.hadir).length;
        return '<div class="baris"><div class="pokok"><b>' + esc(a.judul) + '</b>' +
          '<span>' + tulisPengirim(pengirim(a.id), hadir) + '</span></div>' +
          '<span class="lbl ' + (a.status === 'Dibuka' ? 'hijau' : a.status === 'Ditutup' ? 'abu' : 'biru') + '">' +
          esc(a.status) + '</span>' +
          '<button class="btn hantu kecil" data-akt="' + a.id + '">Ubah</button></div>';
      }).join('') : '<p class="mini">Belum ada aktivitas di sesi ini.</p>') +
      '<div class="deret" style="margin-top:12px"><button class="btn hantu kecil" data-tambahakt>+ Aktivitas</button></div>' +
      '<p class="mini" style="margin-top:10px"><b>Membuka aktivitas tidak otomatis menampilkannya di proyektor.</b> ' +
      'Keduanya tombol berbeda, dan memang disengaja.</p></div>';
  }

  /* ---------- Peserta ---------- */
  function tPeserta() {
    const H = {}; DATA.hadir.forEach(a => { H[a.person_id] = a; });
    return '<div class="kartu"><div class="kartu-h"><h3>Kehadiran</h3>' +
      '<span class="lbl abu">' + DATA.hadir.filter(a => a.hadir).length + ' dari ' + DATA.reg.length + '</span></div>' +
      '<p class="mini" style="margin-bottom:12px"><b>Terdaftar berbeda dari hadir.</b> Peserta yang belum ' +
      'check-in bukan berarti tidak datang — bisa jadi hanya belum tercatat.</p>' +
      (DATA.reg.length ? DATA.reg.map(r => {
        const a = H[r.person_id];
        return '<div class="baris"><div class="pokok"><b>' + esc((r.person && r.person.nama) || '—') + '</b>' +
          '<span>' + esc((r.person && r.person.kategori) || 'kategori belum diisi') +
          (a ? ' · check-in ' + A.jam(a.check_in_pada) + ' · ' + esc(a.metode) : '') + '</span></div>' +
          (a ? '<span class="lbl hijau">Hadir</span>' +
               '<button class="btn hantu kecil" data-koreksi="' + r.person_id + '">Koreksi</button>'
             : '<span class="lbl abu">Belum check-in</span>' +
               '<button class="btn hantu kecil" data-checkin="' + r.person_id + '">Check-in</button>') +
          '</div>';
      }).join('') : '<p class="mini">Belum ada peserta terdaftar.</p>') +
      '<p class="mini" style="margin-top:12px">Check-in oleh operator tercatat beserta siapa yang mencatatnya. ' +
      'Koreksi wajib menyertakan alasan.</p></div>';
  }

  /* ---------- Aktivitas ---------- */
  function tAktivitas() {
    const hadir = DATA.hadir.filter(a => a.hadir).length;
    return '<div class="kartu"><div class="kartu-h"><h3>Progres aktivitas</h3></div>' +
      (DATA.akt.length ? DATA.akt.map(a => {
        const unik = pengirim(a.id);
        const bisa = typeof unik === 'number';
        const pct = bisa && hadir ? Math.min(100, Math.round(unik / hadir * 100)) : 0;
        return '<div style="margin-bottom:16px"><div class="deret" style="justify-content:space-between">' +
          '<b>' + esc(a.judul) + '</b><span class="lbl ' + (a.status === 'Dibuka' ? 'hijau' : 'abu') + '">' +
          esc(a.status) + '</span></div>' +
          /* Batang tidak digambar kalau angkanya tidak diketahui. Batang
             kosong terbaca sebagai "nol", dan itu bukan yang kita tahu. */
          (bisa
            ? '<div style="height:8px;border-radius:6px;background:var(--surface-3);overflow:hidden;margin:7px 0">' +
              '<i style="display:block;height:100%;width:' + pct + '%;background:var(--gold)"></i></div>'
            : '') +
          '<p class="mini">' + tulisPengirim(unik, hadir) +
          (bisa ? '. Penyebutnya kehadiran, bukan pendaftaran.'
                : '. Peran Anda tidak berhak menghitung pengirim, jadi tidak ada angka yang ditampilkan — ' +
                  'bukan berarti nol.') + '</p></div>';
      }).join('') : '<p class="mini">Belum ada aktivitas.</p>') +
      '<p class="mini" style="margin-top:8px">Menutup aktivitas <b>tidak menghapus</b> jawaban yang sudah terkirim.</p></div>';
  }

  /* ---------- Pertanyaan ---------- */
  function tTanya() {
    return '<div class="kartu"><div class="kartu-h"><h3>Pertanyaan peserta</h3>' +
      '<span class="lbl abu">' + DATA.tanya.length + '</span></div>' +
      '<p class="mini" style="margin-bottom:12px">Fasilitator meninjau sebelum menayangkan. Peserta bisa memilih ' +
      'tanpa nama — <b>identitasnya tetap terlihat oleh pengelola</b>, dan itu dikatakan kepada peserta.</p>' +
      (DATA.tanya.length ? DATA.tanya.map(t =>
        '<div class="baris"><div class="pokok"><b>' + esc(t.isi) + '</b>' +
        '<span>' + A.jam(t.dikirim_pada) + ' · ' + (t.tanpa_nama ? 'minta tanpa nama' : 'dengan nama') + '</span></div>' +
        '<span class="lbl ' + (t.terjawab ? 'hijau' : t.ditayangkan ? 'biru' : 'abu') + '">' +
        (t.terjawab ? 'Terjawab' : t.ditayangkan ? 'Ditayangkan' : 'Belum dibahas') + '</span>' +
        '<button class="btn hantu kecil" data-tayang="' + t.id + '">' +
        (t.ditayangkan ? 'Tandai terjawab' : 'Tayangkan') + '</button></div>').join('')
        : '<p class="mini">Belum ada pertanyaan.</p>') + '</div>';
  }

  /* ===================== aksi ===================== */
  /* Alamat yang dipindai peserta. Harus menunjuk PORTAL PESERTA, bukan
     folder kendali ini. Kalau config.origin diisi, itu yang dipakai;
     kalau tidak, dihitung dari alamat halaman dengan membuang segmen
     folder kendali supaya tidak menghasilkan /sesi/sesi/. */
  function alamatSesi() {
    let dasar = A.CFG.origin || (location.origin + location.pathname.replace(/\/[^/]*$/, ''));
    dasar = dasar.replace(/\/+$/, '').replace(/\/(sesi|admin|portal)$/, '');
    return dasar + '/portal/?sesi=' + encodeURIComponent(SESI.kode_sesi || SESI.id);
  }

  function gambarQR() {
    const kotak = el('qr'); if (!kotak) return;
    const url = alamatSesi();
    kotak.dataset.url = url;
    try {
      if (!window.AJIQR) throw new Error('pembuat QR tidak termuat');
      kotak.innerHTML = window.AJIQR.svg(url, { margin: 2 });
      kotak.dataset.qr = 'nyata';
    } catch (e) {
      /* Tidak pernah menggambar QR palsu. Kalau tidak bisa dibuat, katakan. */
      kotak.dataset.qr = 'gagal';
      kotak.innerHTML = '<div class="keadaan" style="border:0;background:none;padding:10px">' +
        '<b>QR tidak bisa dibuat</b><p>Pembuat QR gagal, jadi tidak ada gambar yang ditampilkan — ' +
        'sebuah kotak hiasan justru lebih berbahaya daripada tidak ada. Peserta tetap bisa bergabung ' +
        'lewat kode sesi atau alamat di bawah.</p></div>';
    }
  }

  function pasangTab() {
    const q = (s) => el('isiTab').querySelector(s);
    const mulai = q('[data-mulai]');
    if (mulai) mulai.onclick = function () { A.sekaliSaja(this, async () => {
      const { error } = await A.from('sesi').update({
        status: 'Berlangsung', dimulai_pada: SESI.dimulai_pada || new Date().toISOString()
      }).eq('id', SESI.id);
      if (error) throw error;
      UI.pesan('Sesi dimulai', 'sukses'); await segarkan(SESI.id, true);
    }); };

    const akhiri = q('[data-akhiri]');
    if (akhiri) akhiri.onclick = async () => {
      const v = await A.formulir('Akhiri sesi?',
        'Mengakhiri sesi <b>tidak menghapus data apa pun</b>. Jawaban, kehadiran, dan pertanyaan tetap tersimpan. ' +
        'Yang berubah hanya statusnya.',
        [{ k: 'ya', l: 'Ketik AKHIRI untuk melanjutkan', wajib: true,
           periksa: v => v.trim().toUpperCase() === 'AKHIRI' ? '' : 'Ketik AKHIRI persis' }]);
      if (!v) return;
      const { error } = await A.from('sesi').update({
        status: 'Selesai', diakhiri_pada: new Date().toISOString() }).eq('id', SESI.id);
      if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
      UI.pesan('Sesi selesai. Tidak ada data yang dihapus.', 'sukses'); await segarkan(SESI.id, true);
    };

    const proy = q('[data-proyektor]');
    if (proy) proy.onclick = () => window.open('proyektor.html#' + SESI.id, '_blank', 'noopener');

    el('isiTab').querySelectorAll('[data-akt]').forEach(b => b.onclick = () => ubahAktivitas(b.dataset.akt));
    const tambah = q('[data-tambahakt]'); if (tambah) tambah.onclick = tambahAktivitas;
    el('isiTab').querySelectorAll('[data-checkin]').forEach(b => b.onclick = () => checkin(b.dataset.checkin));
    el('isiTab').querySelectorAll('[data-koreksi]').forEach(b => b.onclick = () => koreksi(b.dataset.koreksi));
    el('isiTab').querySelectorAll('[data-tayang]').forEach(b => b.onclick = () => tayang(b.dataset.tayang));
    if (TAB === 'kendali') gambarQR();
  }

  async function ubahAktivitas(id) {
    const a = DATA.akt.find(x => x.id === id); if (!a) return;
    const v = await A.formulir('Kendali: ' + a.judul,
      a.status === 'Dibuka'
        ? 'Menutup aktivitas <b>tidak menghapus jawaban</b> yang sudah terkirim.'
        : a.status === 'Ditutup'
          ? 'Membuka kembali tercatat beserta siapa yang membukanya.'
          : 'Membuka aktivitas membuatnya muncul di portal peserta. <b>Tidak otomatis tampil di proyektor.</b>',
      [{ k: 'status', l: 'Status', t: 'pilih', opt: ['Belum dibuka', 'Dibuka', 'Ditutup'] },
       { k: 'terima', l: 'Terima kiriman setelah ditutup?', t: 'pilih', opt: ['Tidak', 'Ya'] }]);
    if (!v) return;
    const patch = { status: v.status, terima_setelah_tutup: v.terima === 'Ya' };
    if (v.status === 'Dibuka') patch.dibuka_pada = new Date().toISOString();
    if (v.status === 'Ditutup') patch.ditutup_pada = new Date().toISOString();
    const { error } = await A.from('activity').update(patch).eq('id', id);
    if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
    await A.from('audit_log').insert({ aksi: 'AKTIVITAS_' + v.status.toUpperCase().replace(/ /g, '_'),
      tabel: 'activity', baris_id: id, keterangan: a.judul });
    UI.pesan('Aktivitas: ' + v.status, 'sukses'); await segarkan(SESI.id, true);
  }

  async function tambahAktivitas() {
    const v = await A.formulir('Aktivitas baru', '',
      [{ k: 'judul', l: 'Judul', wajib: true },
       { k: 'kode', l: 'Kode', wajib: true, ph: 'lc' },
       { k: 'jenis', l: 'Jenis', t: 'pilih', opt: ['life_circle', 'kuis', 'refleksi', 'action_plan', 'skala', 'materi'] }]);
    if (!v) return;
    const { error } = await A.from('activity').insert({
      sesi_id: SESI.id, judul: v.judul, kode: v.kode.toLowerCase(), jenis: v.jenis, status: 'Belum dibuka' });
    if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
    UI.pesan('Aktivitas ditambahkan, belum dibuka', 'sukses'); await segarkan(SESI.id, true);
  }

  async function checkin(personId) {
    const { error } = await A.from('attendance').insert({
      sesi_id: SESI.id, person_id: personId, hadir: true,
      metode: 'Operator', dicatat_oleh: (await A.auth.user()).id });
    if (error) {
      if (error.code === '23505') { UI.pesan('Sudah tercatat hadir — tidak dihitung dua kali', 'gagal'); return; }
      UI.pesan(UI.bacaError(error).isi, 'gagal'); return;
    }
    UI.pesan('Check-in tercatat', 'sukses'); await segarkan(SESI.id, true);
  }

  async function koreksi(personId) {
    const v = await A.formulir('Koreksi kehadiran',
      'Koreksi <b>wajib menyertakan alasan</b>, dan alasannya tersimpan bersama catatan kehadiran.',
      [{ k: 'hadir', l: 'Keadaan sebenarnya', t: 'pilih', opt: ['Hadir', 'Tidak hadir'] },
       { k: 'alasan', l: 'Alasan koreksi', t: 'panjang', wajib: true }]);
    if (!v) return;
    const { error } = await A.from('attendance').update({
      hadir: v.hadir === 'Hadir', alasan_koreksi: v.alasan }).eq('sesi_id', SESI.id).eq('person_id', personId);
    if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
    UI.pesan('Koreksi tersimpan beserta alasannya', 'sukses'); await segarkan(SESI.id, true);
  }

  async function tayang(id) {
    const t = DATA.tanya.find(x => x.id === id); if (!t) return;
    const patch = t.ditayangkan ? { terjawab: true } : { ditinjau: true, ditayangkan: true };
    const { error } = await A.from('pertanyaan').update(patch).eq('id', id);
    if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
    await segarkan(SESI.id, true);
  }

  el('kembaliSesi').onclick = () => {
    if (POLL) clearInterval(POLL); if (DETIK) clearInterval(DETIK);
    el('kerja').hidden = true; el('pilih').hidden = false; pilihSesi();
  };

  boot();
})();
