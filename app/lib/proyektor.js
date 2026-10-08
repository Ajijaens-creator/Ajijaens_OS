/* =====================================================================
   NP-V08 — LAYAR PROYEKTOR

   Layar ini dilihat seluruh ruangan. Karena itu yang TIDAK ditampilkan
   di sini sama pentingnya dengan yang ditampilkan:

   TIDAK PERNAH tampil:
     - catatan presenter
     - nama, kontak, email, WhatsApp peserta
     - omzet atau data usaha
     - jawaban perorangan, refleksi, Life Circle siapa pun
     - tombol kendali (mulai / akhiri / buka / tutup / koreksi)
     - tautan edit atau tautan admin

   Yang tampil hanya: judul sesi, penghitung waktu, cara bergabung
   (kode + QR), aktivitas yang sedang dibuka, angka agregat, dan
   pertanyaan yang SUDAH ditayangkan fasilitator.

   Pembaruan di sini juga POLLING, bukan realtime, dan dikatakan apa
   adanya di sudut layar.
   ===================================================================== */
(function () {
  'use strict';
  const A = window.AJIOS, esc = A.esc, el = A.el, UI = A.UI;

  const JEDA = 10000;
  let ID = (location.hash || '').replace(/^#/, '').trim();
  let SESI = null, DATA = { akt: [], prog: [], tanya: [], hadir: 0, terdaftar: 0 };
  let TERAKHIR = null, TAMPILQR = true;

  function alamatSesi() {
    let dasar = A.CFG.origin || (location.origin + location.pathname.replace(/\/[^/]*$/, ''));
    dasar = dasar.replace(/\/+$/, '').replace(/\/(sesi|admin|portal)$/, '');
    return dasar + '/portal/?sesi=' + encodeURIComponent((SESI && SESI.kode_sesi) || ID);
  }

  async function muat() {
    if (!ID) {
      el('isi').innerHTML = '<div class="keadaan"><b>Sesi belum dipilih</b>' +
        '<p>Layar ini dibuka dari tombol <i>Buka layar proyektor</i> di halaman kendali, ' +
        'supaya alamatnya membawa sesi mana yang ditayangkan.</p></div>';
      return;
    }
    try {
      const [s, akt, prog, tanya, hadir, reg] = await Promise.all([
        A.from('sesi').select('*').eq('id', ID).maybeSingle(),
        A.from('activity').select('*').eq('sesi_id', ID),
        A.from('progres_aktivitas').select('*').eq('sesi_id', ID),
        A.from('pertanyaan').select('id, isi, ditayangkan, terjawab, dikirim_pada')
          .eq('sesi_id', ID).eq('ditayangkan', true).order('dikirim_pada', { ascending: true }),
        A.from('attendance').select('id', { count: 'exact', head: true }).eq('sesi_id', ID).eq('hadir', true),
        A.from('session_registration').select('id', { count: 'exact', head: true }).eq('sesi_id', ID)
      ]);
      if (s.error) throw s.error;
      if (!s.data) {
        el('isi').innerHTML = '<div class="keadaan"><b>Sesi tidak terbaca</b>' +
          '<p>Sesi ini tidak ditemukan, atau akun di peramban ini tidak berhak membacanya. ' +
          'Masuk sebagai pengelola sesi di tab yang sama, lalu muat ulang.</p></div>';
        return;
      }
      SESI = s.data;
      DATA = {
        akt: akt.data || [], prog: prog.data || [],
        tanya: tanya.data || [],
        hadir: typeof hadir.count === 'number' ? hadir.count : null,
        terdaftar: typeof reg.count === 'number' ? reg.count : null
      };
      TERAKHIR = new Date();
      gambar();
    } catch (e) {
      el('isi').innerHTML = '';
      UI.gagal('isi', e, 'Layar proyektor tidak menampilkan angka yang tidak bisa dibaca.');
    }
  }

  function pengirim(id) {
    const p = DATA.prog.find(x => x.activity_id === id);
    return p ? p.pengirim : undefined;
  }

  function gambar() {
    const aktif = DATA.akt.filter(a => a.status === 'Dibuka');
    el('judul').textContent = SESI.judul;
    el('status').textContent = SESI.status;
    el('status').className = 'tanda ' + (SESI.status === 'Berlangsung' ? 'jalan' : 'henti');

    el('isi').innerHTML =
      /* ---------- aktivitas yang sedang dibuka ---------- */
      (aktif.length
        ? aktif.map(a => {
            const n = pengirim(a.id), bisa = typeof n === 'number';
            return '<div class="panggung">' +
              '<div class="cap">Sedang berjalan</div>' +
              '<h2>' + esc(a.judul) + '</h2>' +
              '<p class="arah">Buka portal di ponsel Anda, lalu kirim jawaban Anda. ' +
              'Jawaban Anda hanya terlihat oleh Anda sendiri.</p>' +
              (bisa
                ? '<div class="takar"><i style="width:' +
                  (DATA.hadir ? Math.min(100, Math.round(n / DATA.hadir * 100)) : 0) + '%"></i></div>' +
                  '<p class="angka-ket"><b>' + n + '</b> dari <b>' + (DATA.hadir === null ? '—' : DATA.hadir) +
                  '</b> yang hadir sudah mengirim</p>'
                : '<p class="angka-ket">Jumlah pengirim tidak ditampilkan di layar ini.</p>') +
              '</div>';
          }).join('')
        : '<div class="panggung"><div class="cap">Menunggu</div>' +
          '<h2>Belum ada aktivitas yang dibuka</h2>' +
          '<p class="arah">Fasilitator akan membuka aktivitas berikutnya. ' +
          'Aktivitas yang sudah ditutup tidak menghapus jawaban yang sudah terkirim.</p></div>') +

      /* ---------- cara bergabung ---------- */
      '<div class="kisi-proy">' +
      '<div class="kotak"><div class="cap">Cara bergabung</div>' +
      '<p class="kode-besar">' + esc(SESI.kode_sesi || 'belum ada kode') + '</p>' +
      '<p class="arah kecil">' + esc(alamatSesi()) + '</p>' +
      '<div id="qr" class="' + (TAMPILQR ? '' : 'sembunyi') + '"></div>' +
      '<p class="arah kecil">Memindai QR hanya membuka halaman pendaftaran. ' +
      'QR ini tidak membawa hak akses apa pun.</p></div>' +

      /* ---------- angka ruangan ---------- */
      '<div class="kotak"><div class="cap">Ruangan</div>' +
      '<p class="angka-besar">' + (DATA.hadir === null ? '—' : DATA.hadir) + '</p>' +
      '<p class="arah kecil">hadir, dari ' + (DATA.terdaftar === null ? '—' : DATA.terdaftar) + ' terdaftar. ' +
      '<b>Terdaftar berbeda dari hadir.</b></p></div>' +
      '</div>' +

      /* ---------- pertanyaan yang ditayangkan ---------- */
      (DATA.tanya.length
        ? '<div class="kotak lebar"><div class="cap">Pertanyaan</div>' +
          DATA.tanya.map(t => '<p class="tanya' + (t.terjawab ? ' sudah' : '') + '">' +
            esc(t.isi) + '</p>').join('') +
          '<p class="arah kecil">Pertanyaan ditayangkan tanpa nama pengirim di layar ini.</p></div>'
        : '');

    gambarQR();
    gambarWaktu();
  }

  function gambarQR() {
    const k = el('qr'); if (!k) return;
    if (!TAMPILQR) { k.innerHTML = ''; return; }
    const url = alamatSesi();
    k.dataset.url = url;
    try {
      if (!window.AJIQR) throw new Error('pembuat QR tidak termuat');
      k.innerHTML = window.AJIQR.svg(url, { margin: 2 });
      k.dataset.qr = 'nyata';
    } catch (e) {
      /* Tidak pernah menggambar kotak hiasan yang menyerupai QR. */
      k.dataset.qr = 'gagal';
      k.innerHTML = '<p class="arah kecil"><b>QR tidak bisa dibuat.</b> ' +
        'Pembuat QR gagal, jadi tidak ada gambar yang ditampilkan. ' +
        'Peserta bergabung lewat kode sesi di atas.</p>';
    }
  }

  function gambarWaktu() {
    const n = el('jam'); if (!n) return;
    if (!SESI || !SESI.dimulai_pada) { n.textContent = 'belum dimulai'; return; }
    const akhir = SESI.diakhiri_pada ? new Date(SESI.diakhiri_pada) : new Date();
    const det = Math.max(0, Math.floor((akhir - new Date(SESI.dimulai_pada)) / 1000) - (SESI.jeda_detik || 0));
    const mm = String(Math.floor(det / 60)).padStart(2, '0'), ss = String(det % 60).padStart(2, '0');
    n.textContent = mm + ':' + ss + (SESI.durasi_menit ? ' / ' + SESI.durasi_menit + ':00' : '');
    n.className = SESI.durasi_menit && det > SESI.durasi_menit * 60 ? 'jam lewat' : 'jam';
    const d = TERAKHIR ? Math.round((Date.now() - TERAKHIR) / 1000) : null;
    el('segar').textContent = d === null ? 'belum terhubung' : 'diperbarui ' + d + ' detik lalu';
  }

  /* Kendali tampilan — bukan kendali sesi. Tidak ada tombol di layar ini
     yang mengubah data. */
  el('penuh').onclick = () => {
    const d = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (d.requestFullscreen) d.requestFullscreen();
  };
  el('togelQR').onclick = () => {
    TAMPILQR = !TAMPILQR;
    el('togelQR').textContent = TAMPILQR ? 'Sembunyikan QR' : 'Tampilkan QR';
    if (SESI) gambar();
  };
  window.addEventListener('hashchange', () => {
    ID = (location.hash || '').replace(/^#/, '').trim(); muat();
  });

  muat();
  setInterval(muat, JEDA);
  setInterval(gambarWaktu, 1000);

  window.__PROY = { gambar, gambarQR, alamatSesi, pengirim,
                    data: () => DATA, sesi: () => SESI };
})();
