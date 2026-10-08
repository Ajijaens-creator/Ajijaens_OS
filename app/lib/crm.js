/* =====================================================================
   NP-V05 — Database Peserta, CRM & Funnel Komunitas
   Semua pembatasan akses ditegakkan basis data. Halaman ini hanya
   menjelaskan penolakannya, tidak menggantikannya.
   ===================================================================== */
(function () {
  'use strict';
  const A = window.AJIOS, esc = A.esc, el = A.el, UI = A.UI;

  const KATEGORI = ['Siswa SMA','Mahasiswa','Pengusaha Pemula','Pengusaha 5th+','Pengusaha 10th+'];
  const BENTUK   = ['Belum dibentuk','Usaha perorangan','CV','Firma','PT Perorangan','PT','Koperasi','Yayasan','Lainnya'];
  const OMZET    = ['Belum menghasilkan','<100 juta','100-<500 juta','500 juta-<1 miliar','1-<5 miliar','5-<10 miliar','>=10 miliar','Belum bersedia mengisi'];
  const KOMUNITAS= ['Belum bergabung','Berminat','Diundang','Member aktif','Tidak aktif','Keluar'];
  const PERIODE  = ['12 bulan terakhir','2026','2025','2024'];
  const WARNA_KOM= { 'Belum bergabung':'abu','Berminat':'biru','Diundang':'oranye','Member aktif':'hijau','Tidak aktif':'abu','Keluar':'merah' };

  let ORANG = [], USAHA = {}, KOM = {}, TUGAS = [];

  /* ======================= gerbang ======================= */
  async function boot() {
    try {
      const u = await A.auth.user();
      if (!u) return tampil('gerbang');
      const peran = await A.peranSaya();
      el('peran').textContent = peran ? peran : 'bukan pengelola';
      el('peran').className = 'lbl ' + (peran === 'admin' ? 'emas' : peran ? 'biru' : 'abu');
      el('keluar').hidden = false;
      if (!peran || ['admin','cs'].indexOf(peran) === -1) return tampil('bukanStaf');
      tampil('isi');
      isiFilter();
      await muatSemua();
    } catch (e) { tampil('isi'); UI.gagal('tabelOrang', e); }
  }
  function tampil(id) {
    ['gerbang','bukanStaf','isi'].forEach(k => { el(k).hidden = (k !== id); });
  }

  el('kirimKode').onclick = function () {
    const b = this, email = el('email').value.trim();
    el('i-email').classList.toggle('salah', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
    if (el('i-email').classList.contains('salah')) { UI.pesan('Alamat email belum benar', 'gagal'); return; }
    A.sekaliSaja(b, async () => {
      await A.auth.kirimOtp(email);
      el('tahapKode').hidden = false;
      UI.pesan('Kode dikirim ke ' + email, 'sukses');
    });
  };
  el('verifKode').onclick = function () {
    const b = this;
    A.sekaliSaja(b, async () => {
      await A.auth.verifikasiOtp(el('email').value.trim(), el('kode').value.trim());
      A.lupakanCache(); await boot();
    });
  };
  el('keluar').onclick = el('keluar2').onclick = async () => { await A.auth.keluar(); location.reload(); };

  /* ======================= filter ======================= */
  function isiFilter() {
    const pasang = (id, arr) => { const s = el(id);
      arr.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; s.appendChild(o); }); };
    pasang('f-kat', KATEGORI); pasang('f-bentuk', BENTUK); pasang('f-omzet', OMZET);
    pasang('f-kom', KOMUNITAS); pasang('f-periode', PERIODE);
    ['cari','f-kat','f-bentuk','f-omzet','f-kom','f-tim','f-periode'].forEach(id => {
      el(id).addEventListener('input', gambarTabel);
      el(id).addEventListener('change', gambarTabel);
    });
  }

  /* ======================= muat data ======================= */
  async function muatSemua() {
    UI.memuat('tabelOrang', 'Memuat peserta…');
    try {
      const [o, br, km, tg] = await Promise.all([
        A.from('person').select('*').order('dibuat_pada', { ascending: false }),
        A.from('business_relationship').select('*, business:business_id(*)'),
        A.from('community_membership').select('*'),
        A.from('follow_up_task').select('*, person:person_id(nama)').order('jadwal', { ascending: true })
      ]);
      [o, br, km, tg].forEach(r => { if (r.error) throw r.error; });
      ORANG = o.data || [];
      USAHA = {}; (br.data || []).forEach(r => {
        (USAHA[r.person_id] = USAHA[r.person_id] || []).push(Object.assign({}, r.business, { _peran: r.peran, _utama: r.utama }));
      });
      KOM = {}; (km.data || []).forEach(r => { KOM[r.person_id] = r; });
      TUGAS = tg.data || [];
      gambarTabel(); gambarFunnel(); gambarTugas();
    } catch (e) { UI.gagal('tabelOrang', e, 'Kalau pesannya soal schema, tambahkan "ajios" di Exposed schemas.'); }
  }

  /* ======================= tabel ======================= */
  function cocok(p) {
    const q = el('cari').value.trim().toLowerCase();
    const us = USAHA[p.id] || [];
    if (q) {
      const bahan = [p.nama, p.email, p.whatsapp, p.kota].concat(us.map(u => u.nama + ' ' + (u.brand || '')))
        .join(' ').toLowerCase();
      if (bahan.indexOf(q) === -1) return false;
    }
    const fk = el('f-kat').value;      if (fk && p.kategori !== fk) return false;
    const fb = el('f-bentuk').value;   if (fb && !us.some(u => u.bentuk === fb)) return false;
    const fo = el('f-omzet').value;    if (fo && !us.some(u => u.omzet_rentang === fo)) return false;
    const fp = el('f-periode').value;  if (fp && !us.some(u => u.omzet_periode === fp)) return false;
    const fkm = el('f-kom').value;
    if (fkm) { const k = KOM[p.id]; if (!k || k.status !== fkm) return false; }
    const ft = el('f-tim').value;
    if (ft) {
      const t = us.reduce((m, u) => Math.max(m, Number(u.tim_aktif) || 0), 0);
      if (ft === '0'    && t !== 0) return false;
      if (ft === '1-5'  && !(t >= 1 && t <= 5)) return false;
      if (ft === '6-20' && !(t >= 6 && t <= 20)) return false;
      if (ft === '21+'  && !(t >= 21)) return false;
    }
    return true;
  }

  function gambarTabel() {
    if (!ORANG.length) {
      return UI.kosong('tabelOrang', 'Belum ada peserta',
        'Peserta masuk lewat portal, atau Anda tambahkan sendiri di sini. ' +
        'Yang ditambahkan manual tidak otomatis punya akun dan tidak otomatis menyetujui apa pun.',
        '<button class="btn" onclick="document.getElementById(\'tambahOrang\').click()">+ Tambah peserta pertama</button>');
    }
    const rows = ORANG.filter(cocok);
    const ringkas = '<p class="mini" style="margin-bottom:10px">Menampilkan <b>' + rows.length +
      '</b> dari ' + ORANG.length + ' peserta.</p>';
    if (!rows.length) return el('tabelOrang').innerHTML = ringkas +
      '<div class="keadaan"><b>Tidak ada yang cocok</b><p>Saringan Anda tidak menemukan peserta. ' +
      ORANG.length + ' peserta lain tetap ada.</p></div>';

    el('tabelOrang').innerHTML = ringkas + '<div class="gulir"><table class="data">' +
      '<thead><tr><th>Peserta</th><th>Kategori</th><th>Usaha / Pendidikan</th>' +
      '<th class="angka">Tim</th><th>Omzet / periode</th><th>Komunitas</th><th>Follow-up</th></tr></thead><tbody>' +
      rows.map(p => {
        const us = USAHA[p.id] || [], u = us.find(x => x._utama) || us[0];
        const k = KOM[p.id];
        const tg = TUGAS.filter(t => t.person_id === p.id && (t.status === 'Terjadwal' || t.status === 'Dikerjakan'));
        const tim = u && u.tim_aktif !== null && u.tim_aktif !== undefined ? String(u.tim_aktif) : '<span class="nihil">—</span>';
        return '<tr style="cursor:pointer" data-id="' + p.id + '">' +
          '<td><b>' + esc(p.nama) + '</b>' + (us.length > 1 ? '<br><span class="mini">' + us.length + ' usaha</span>' : '') + '</td>' +
          '<td>' + (p.kategori ? '<span class="lbl abu">' + esc(p.kategori) + '</span>' : '<span class="nihil">belum diisi</span>') + '</td>' +
          '<td>' + (u ? esc(u.nama) + (u.industri ? '<br><span class="mini">' + esc(u.industri) + '</span>' : '')
                       : '<span class="nihil">belum diisi</span>') + '</td>' +
          '<td class="angka">' + tim + '</td>' +
          '<td>' + (u ? A.tampilOmzet(u.omzet_rentang, u.omzet_periode) : '<span class="nihil">tidak berlaku</span>') + '</td>' +
          '<td>' + (k ? '<span class="lbl ' + (WARNA_KOM[k.status] || 'abu') + '">' + esc(k.status) + '</span>'
                      : '<span class="lbl abu">Belum bergabung</span>') + '</td>' +
          '<td>' + (tg.length ? '<span class="lbl oranye">' + tg.length + ' terbuka</span>' : '<span class="mini">—</span>') + '</td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>';
    el('tabelOrang').querySelectorAll('tr[data-id]').forEach(tr => {
      tr.onclick = () => bukaPanel(tr.dataset.id);
    });
  }

  /* ======================= funnel ======================= */
  function gambarFunnel() {
    const kolom = ['Berminat','Diundang','Member aktif'];
    el('papanFunnel').style.gridTemplateColumns = 'repeat(auto-fit,minmax(240px,1fr))';
    el('papanFunnel').innerHTML = kolom.map(st => {
      const isi = ORANG.filter(p => (KOM[p.id] || {}).status === st);
      return '<div class="kartu"><div class="kartu-h"><h3>' + esc(st) + '</h3>' +
        '<span class="lbl ' + (WARNA_KOM[st] || 'abu') + '">' + isi.length + '</span></div>' +
        (isi.length ? isi.map(p => {
          const k = KOM[p.id];
          return '<div class="baris"><div class="pokok"><b>' + esc(p.nama) + '</b>' +
            '<span>' + (k.dikonfirmasi_peserta ? 'dikonfirmasi peserta ' + A.tgl(k.dikonfirmasi_pada)
                                                : 'belum dikonfirmasi peserta') + '</span></div>' +
            '<button class="btn hantu kecil" data-buka="' + p.id + '">Buka</button></div>';
        }).join('') : '<p class="mini">Belum ada.</p>') +
        (st === 'Member aktif' ? '<p class="mini" style="margin-top:10px">Hanya peserta yang sudah ' +
          'mengkonfirmasi sendiri yang bisa berada di sini.</p>' : '') + '</div>';
    }).join('');
    el('papanFunnel').querySelectorAll('[data-buka]').forEach(b => b.onclick = () => bukaPanel(b.dataset.buka));
  }

  /* ======================= follow-up ======================= */
  function gambarTugas() {
    if (!TUGAS.length) return UI.kosong('daftarTugas', 'Belum ada tugas tindak lanjut',
      'Tugas dibuat dari profil peserta. Membuatnya mencatat rencana — tidak mengirim pesan.');
    el('daftarTugas').innerHTML = TUGAS.map(t =>
      '<div class="baris"><div class="pokok"><b>' + esc(t.tujuan) + '</b>' +
      '<span>' + esc((t.person && t.person.nama) || '—') + ' · ' +
      (t.jadwal ? A.tgl(t.jadwal) : 'tanpa jadwal') + (t.kanal ? ' · ' + esc(t.kanal) : '') + '</span></div>' +
      '<span class="lbl ' + (t.status === 'Selesai' ? 'hijau' : t.status === 'Dibatalkan' ? 'abu' : 'oranye') + '">' +
      esc(t.status) + '</span></div>').join('') +
      '<p class="mini" style="margin-top:12px">Status di sini adalah catatan pengelola, bukan bukti bahwa ' +
      'peserta sudah dihubungi.</p>';
  }

  /* ======================= panel detail ======================= */
  let PANEL_ID = null, PANEL_TAB = 'profil';
  function bukaPanel(id) { PANEL_ID = id; PANEL_TAB = 'profil'; el('panel').hidden = false; gambarPanel(); }
  el('tutupPanel').onclick = () => { el('panel').hidden = true; PANEL_ID = null; };
  el('panel').onclick = (e) => { if (e.target === el('panel')) { el('panel').hidden = true; PANEL_ID = null; } };
  el('p-tab').onclick = (e) => {
    const b = e.target.closest('[data-pt]'); if (!b) return;
    PANEL_TAB = b.dataset.pt; gambarPanel();
  };

  async function gambarPanel() {
    const p = ORANG.find(x => x.id === PANEL_ID); if (!p) return;
    el('p-nama').textContent = p.nama;
    el('p-sub').textContent = [p.kategori, p.kota, p.sumber_masuk ? 'masuk lewat ' + p.sumber_masuk : '']
      .filter(Boolean).join(' · ') || 'belum ada keterangan';
    el('p-tab').querySelectorAll('[data-pt]').forEach(b =>
      b.setAttribute('aria-selected', String(b.dataset.pt === PANEL_TAB)));
    const V = { profil: pProfil, usaha: pUsaha, belajar: pBelajar, interaksi: pInteraksi, consent: pConsent };
    UI.memuat('p-isi');
    try { el('p-isi').innerHTML = await (V[PANEL_TAB] || pProfil)(p); pasangAksi(p); }
    catch (e) { UI.gagal('p-isi', e); }
  }

  function pProfil(p) {
    const k = KOM[p.id];
    return Promise.resolve(
      '<dl class="kv">' +
      '<dt>Nama</dt><dd>' + esc(p.nama) + '</dd>' +
      '<dt>Kategori</dt><dd>' + A.tampilNilai(p.kategori) + '</dd>' +
      '<dt>WhatsApp</dt><dd>' + A.tampilNilai(p.whatsapp) + '</dd>' +
      '<dt>Email</dt><dd>' + A.tampilNilai(p.email) + '</dd>' +
      '<dt>Kota</dt><dd>' + A.tampilNilai(p.kota) + '</dd>' +
      '<dt>Akun</dt><dd>' + (p.auth_user_id ? 'sudah pernah masuk' :
        '<span class="nihil">belum punya akun</span>') + '</dd>' +
      '<dt>Sumber masuk</dt><dd>' + A.tampilNilai(p.sumber_masuk) + '</dd>' +
      '<dt>Terdaftar</dt><dd>' + A.tgl(p.dibuat_pada) + '</dd>' +
      '<dt>Komunitas</dt><dd>' + (k ? esc(k.status) +
        (k.dikonfirmasi_peserta ? ' · dikonfirmasi peserta' : ' · belum dikonfirmasi peserta')
        : 'Belum bergabung') + '</dd>' +
      '</dl>' +
      '<p class="mini" style="margin-top:14px">Jawaban refleksi dan Wellbeing Life Circle ' +
      '<b>tidak ditampilkan di sini</b> dan tidak terbaca oleh tim CRM. Basis data menolaknya, ' +
      'bukan halaman ini yang menyembunyikannya.</p>');
  }

  function pUsaha(p) {
    const us = USAHA[p.id] || [];
    if (!us.length) return Promise.resolve(
      '<div class="keadaan"><b>Belum ada data usaha atau pendidikan</b>' +
      '<p>Untuk siswa dan mahasiswa, kolom usaha memang <b>tidak berlaku</b> — itu berbeda dari kosong.</p></div>');
    return Promise.resolve(us.map(u =>
      '<div class="kartu" style="margin-bottom:12px"><div class="kartu-h"><h3>' + esc(u.nama) + '</h3>' +
      (u._utama ? '<span class="lbl emas">utama</span>' : '') +
      '<span class="lbl abu">' + esc(u._peran) + '</span></div>' +
      '<dl class="kv">' +
      '<dt>Brand</dt><dd>' + A.tampilNilai(u.brand) + '</dd>' +
      '<dt>Industri</dt><dd>' + A.tampilNilai(u.industri) + '</dd>' +
      '<dt>Bidang</dt><dd>' + A.tampilNilai(u.bidang) + '</dd>' +
      '<dt>Bentuk usaha</dt><dd>' + A.tampilNilai(u.bentuk) + '</dd>' +
      '<dt>Mulai</dt><dd>' + (u.tanggal_mulai ? A.tgl(u.tanggal_mulai)
        : u.tahun_mulai ? esc(u.tahun_mulai) + ' <span class="mini">· usia usaha perkiraan, hanya tahun yang diketahui</span>'
        : '<span class="nihil">belum diisi</span>') + '</dd>' +
      '<dt>Tim aktif</dt><dd>' + (u.tim_aktif === 0 ? '0 <span class="mini">· termasuk pemilik yang bekerja</span>'
        : A.tampilNilai(u.tim_aktif)) + '</dd>' +
      '<dt>Omzet</dt><dd>' + A.tampilOmzet(u.omzet_rentang, u.omzet_periode) + '</dd>' +
      '<dt>Sumber angka</dt><dd>' + esc(u.omzet_sumber || 'Pernyataan peserta') +
        ' <span class="mini">· bukan angka teraudit</span></dd>' +
      '</dl></div>').join('') +
      '<p class="mini">Satu usaha bisa punya beberapa pemilik, dan satu orang bisa punya beberapa usaha. ' +
      'Nama yang sama tidak pernah dipakai untuk menggabungkan usaha.</p>');
  }

  async function pBelajar(p) {
    const [reg, hadir] = await Promise.all([
      A.from('session_registration').select('*, sesi:sesi_id(judul, mulai_pada, status)').eq('person_id', p.id),
      A.from('attendance').select('sesi_id, hadir, check_in_pada').eq('person_id', p.id)
    ]);
    if (reg.error) throw reg.error;
    const H = {}; (hadir.data || []).forEach(a => { H[a.sesi_id] = a; });
    const r = reg.data || [];
    if (!r.length) return '<div class="keadaan"><b>Belum terdaftar di sesi mana pun</b>' +
      '<p>Pendaftaran tercatat saat peserta mendaftar lewat portal.</p></div>';
    return r.map(x => {
      const a = H[x.sesi_id];
      return '<div class="baris"><div class="pokok"><b>' + esc((x.sesi && x.sesi.judul) || '—') + '</b>' +
        '<span>Terdaftar ' + A.tgl(x.terdaftar_pada) + '</span></div>' +
        (a ? '<span class="lbl hijau">Hadir · ' + A.jam(a.check_in_pada) + '</span>'
           : '<span class="lbl abu">Belum check-in</span>') + '</div>';
    }).join('') + '<p class="mini" style="margin-top:12px"><b>Terdaftar berbeda dari hadir.</b> ' +
      'Tidak check-in bukan berarti tidak datang — bisa jadi hanya belum tercatat.</p>';
  }

  async function pInteraksi(p) {
    const [itr, tgs, bon] = await Promise.all([
      A.from('interaction').select('*').eq('person_id', p.id).order('terjadi_pada', { ascending: false }),
      A.from('follow_up_task').select('*').eq('person_id', p.id).order('jadwal', { ascending: true }),
      A.from('bonus_event').select('*').eq('person_id', p.id).order('terjadi_pada', { ascending: false })
    ]);
    [itr, tgs, bon].forEach(x => { if (x.error) throw x.error; });
    const i = itr.data || [], t = tgs.data || [], b = bon.data || [];
    return '<h3 style="margin-bottom:8px">Tugas tindak lanjut</h3>' +
      (t.length ? t.map(x => '<div class="baris"><div class="pokok"><b>' + esc(x.tujuan) + '</b>' +
        '<span>' + (x.jadwal ? A.tgl(x.jadwal) : 'tanpa jadwal') + (x.kanal ? ' · ' + esc(x.kanal) : '') + '</span></div>' +
        '<span class="lbl ' + (x.status === 'Selesai' ? 'hijau' : 'oranye') + '">' + esc(x.status) + '</span></div>').join('')
        : '<p class="mini">Belum ada.</p>') +
      '<div class="deret" style="margin:12px 0 20px"><button class="btn hantu kecil" data-aksi="tugas">+ Tugas baru</button></div>' +
      '<h3 style="margin-bottom:8px">Riwayat interaksi</h3>' +
      (i.length ? i.map(x => '<div class="baris"><div class="pokok"><b>' + esc(x.ringkasan || x.kanal || '—') + '</b>' +
        '<span>' + A.tgl(x.terjadi_pada) + (x.kanal ? ' · ' + esc(x.kanal) : '') + '</span></div></div>').join('')
        : '<p class="mini">Belum ada.</p>') +
      '<h3 style="margin:20px 0 8px">Bonus</h3>' +
      (b.length ? b.map(x => '<div class="baris"><div class="pokok"><b>' +
        (x.jenis === 'follow_ig_dikonfirmasi' ? 'Follow Instagram — dikonfirmasi peserta' :
         x.jenis === 'klik_spotify' ? 'Klik Spotify tercatat' : esc(x.jenis)) + '</b>' +
        '<span>' + A.tgl(x.terjadi_pada) + '</span></div></div>').join('')
        : '<p class="mini">Belum ada.</p>') +
      '<p class="mini" style="margin-top:12px">Klik Spotify adalah peristiwa klik, <b>bukan bukti selesai ' +
      'mendengarkan</b>. Follow Instagram adalah pernyataan peserta, bukan terverifikasi otomatis.</p>';
  }

  async function pConsent(p) {
    const [tujuan, milik] = await Promise.all([A.consent.tujuan(), A.consent.milikSaya(p.id)]);
    return '<div class="gulir"><table class="data" style="min-width:440px"><thead><tr>' +
      '<th>Tujuan</th><th>Dasar</th><th>Keadaan</th><th>Terakhir</th></tr></thead><tbody>' +
      tujuan.map(t => {
        const c = milik.terakhir[t.kode];
        const aktif = c && c.diberikan && !c.dicabut_pada;
        return '<tr><td><b>' + esc(t.nama) + '</b><br><span class="mini">' + esc(t.deskripsi) + '</span></td>' +
          '<td><span class="lbl abu">' + esc(t.dasar) + '</span>' + (t.wajib ? '<br><span class="mini">wajib</span>' : '') + '</td>' +
          '<td>' + (!c ? '<span class="nihil">belum ditanyakan</span>'
            : aktif ? '<span class="lbl hijau">disetujui</span>'
            : c.dicabut_pada ? '<span class="lbl merah">dicabut</span>'
            : '<span class="lbl abu">ditolak</span>') + '</td>' +
          '<td>' + (c ? A.tgl(c.pada) : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<h3 style="margin:20px 0 8px">Histori lengkap</h3>' +
      (milik.histori.length ? milik.histori.map(h =>
        '<div class="baris"><div class="pokok"><b>' + esc(h.purpose) + ' — ' +
        (h.dicabut_pada ? 'dicabut' : h.diberikan ? 'disetujui' : 'ditolak') + '</b>' +
        '<span>' + A.tgl(h.pada) + (h.sumber ? ' · ' + esc(h.sumber) : '') + '</span></div></div>').join('')
        : '<p class="mini">Belum ada catatan persetujuan.</p>') +
      '<p class="mini" style="margin-top:12px">Histori tidak pernah ditimpa. Pencabutan ditambahkan sebagai ' +
      'baris baru supaya tetap bisa dibuktikan. <b>Persetujuan promosi tidak pernah menjadi syarat ' +
      'menerima materi.</b></p>';
  }

  function pasangAksi(p) {
    const b = el('p-isi').querySelector('[data-aksi="tugas"]');
    if (b) b.onclick = () => tugasBaru(p);
  }

  /* ======================= aksi ======================= */
  async function tugasBaru(p) {
    const v = await A.formulir('Tugas tindak lanjut — ' + p.nama,
      '<b>Membuat tugas tidak mengirim pesan apa pun.</b> Ini pencatatan rencana, bukan pengiriman.',
      [{ k: 'tujuan', l: 'Tujuan', wajib: true, ph: 'Tinjau langkah pertama' },
       { k: 'jadwal', l: 'Jadwal', t: 'date', bantu: 'Boleh dikosongkan.' },
       { k: 'kanal',  l: 'Kanal', t: 'pilih', opt: ['', 'WhatsApp', 'Telepon', 'Email', 'Tatap muka'] },
       { k: 'catatan', l: 'Catatan', t: 'panjang' }]);
    if (!v) return;
    const { error } = await A.from('follow_up_task').insert({
      person_id: p.id, tujuan: v.tujuan, jadwal: v.jadwal || null,
      kanal: v.kanal || null, catatan: v.catatan || null });
    if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
    UI.pesan('Tugas dicatat. Tidak ada pesan yang dikirim.', 'sukses');
    await muatSemua(); gambarPanel();
  }

  el('tambahOrang').onclick = async function () {
    const v = await A.formulir('Tambah peserta',
      'Peserta yang ditambahkan di sini <b>tidak otomatis punya akun</b> dan ' +
      '<b>tidak otomatis menyetujui apa pun</b>. Persetujuan hanya sah kalau peserta sendiri yang memberikannya.',
      [{ k: 'nama', l: 'Nama lengkap', wajib: true },
       { k: 'kategori', l: 'Kategori', t: 'pilih', opt: [''].concat(KATEGORI) },
       { k: 'whatsapp', l: 'WhatsApp' },
       { k: 'email', l: 'Email', t: 'email',
         periksa: v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? '' : 'Format email belum benar' },
       { k: 'kota', l: 'Kota' }]);
    if (!v) return;
    const { error } = await A.from('person').insert({
      nama: v.nama, kategori: v.kategori || null, whatsapp: v.whatsapp || null,
      email: v.email || null, kota: v.kota || null, sumber_masuk: 'Ditambahkan pengelola' });
    if (error) { UI.pesan(UI.bacaError(error).isi, 'gagal'); return; }
    UI.pesan('Peserta ditambahkan.', 'sukses');
    await muatSemua();
  };

  /* ======================= tab utama ======================= */
  document.querySelector('.tab[role="tablist"]').onclick = (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    document.querySelectorAll('.tab[role="tablist"] [data-tab]').forEach(x =>
      x.setAttribute('aria-selected', String(x === b)));
    ['db','funnel','tugas'].forEach(k => { el('tab-' + k).hidden = (k !== b.dataset.tab); });
  };

  boot();
  A.auth.onBerubah(() => {});
})();
