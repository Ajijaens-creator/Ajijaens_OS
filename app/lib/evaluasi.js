/* =====================================================================
   NP-V09 — EVALUASI & TINDAK LANJUT

   Ketentuan yang dipegang ketat di berkas ini:

   - Nol respons TIDAK menghasilkan rata-rata nol. Kalau belum ada yang
     mengisi, yang ditulis "belum ada respons" dan tidak ada satu angka
     pun digambar. Batang kosong terbaca sebagai nol, jadi batangnya pun
     tidak digambar.
   - Tidak merespons BUKAN otomatis gagal. Peserta yang tidak mengisi
     disebut "belum mengisi", bukan "tidak puas" atau "gagal".
   - "Dilaporkan selesai" adalah laporan peserta, BUKAN hasil yang sudah
     diverifikasi. Kata itu muncul di layar setiap kali angkanya muncul.
   - Klik Spotify adalah peristiwa klik, bukan bukti selesai mendengarkan.
   - Wellbeing bukan ranking, bukan skor kelayakan investasi. Hanya
     agregat, dan hanya kalau pengisinya cukup banyak untuk tidak
     menunjuk satu orang.
   - Membuat tugas tindak lanjut TIDAK mengirim pesan apa pun.
   - Kutipan hanya dari peserta yang mengizinkan, dan izin itu bukan
     perintah menerbitkan.
   ===================================================================== */
(function () {
  'use strict';
  const A = window.AJIOS, esc = A.esc, el = A.el, UI = A.UI;

  /* Batas minimum pengisi sebelum agregat wellbeing ditampilkan. Angka
     kecil mudah ditelusuri ke orangnya, dan itu yang mau dihindari. */
  const MIN_WELLBEING = 5;

  let PERAN = null, SESI = null, TAB = 'ringkas';
  let D = { rekap: [], teks: [], responden: null, hadir: null, terdaftar: null,
            tindak: [], bonus: [], wellbeing: [], tugas: [] };

  /* ===================== boot ===================== */
  async function boot() {
    try {
      const u = await A.auth.user();
      if (!u) { el('gerbang').hidden = false; return; }
      PERAN = await A.peranSaya();
      el('peran').textContent = PERAN || 'bukan pengelola';
      el('peran').className = 'lbl ' + (PERAN ? 'emas' : 'abu');
      el('keluar').hidden = false;
      if (!PERAN || ['admin', 'fasilitator', 'operator', 'cs'].indexOf(PERAN) === -1) {
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
      'Evaluasi muncul setelah ada sesi yang dijalankan.');
    el('daftarSesi').innerHTML = list.map(s =>
      '<button class="baris" style="width:100%;text-align:left;background:none;' +
      'border-top:1px solid var(--border-soft);cursor:pointer" data-sesi="' + s.id + '">' +
      '<span class="pokok"><b>' + esc(s.judul) + '</b><span>' +
      (s.mulai_pada ? A.tgl(s.mulai_pada) : 'belum dijadwalkan') + '</span></span>' +
      '<span class="lbl ' + (s.status === 'Selesai' ? 'abu' : s.status === 'Berlangsung' ? 'hijau' : 'biru') +
      '">' + esc(s.status) + '</span></button>').join('');
    el('daftarSesi').querySelectorAll('[data-sesi]').forEach(b =>
      b.onclick = () => muat(b.dataset.sesi, list.find(x => x.id === b.dataset.sesi)));
  }

  /* ===================== muat satu sesi ===================== */
  async function muat(id, sesi) {
    SESI = sesi;
    el('pilih').hidden = true; el('kerja').hidden = false;
    el('judulSesi').textContent = sesi.judul;
    el('subSesi').textContent = [sesi.mulai_pada ? A.tgl(sesi.mulai_pada) : 'belum dijadwalkan',
      sesi.lokasi, sesi.status].filter(Boolean).join(' · ');
    UI.memuat('isiTab', 'Memuat rekap…');
    try {
      const [rekap, teks, hadir, reg, tindak, bonus, well, tugas] = await Promise.all([
        A.rpc('rekap_feedback', { s: id }),
        A.rpc('teks_feedback', { s: id }),
        A.from('attendance').select('id', { count: 'exact', head: true }).eq('sesi_id', id).eq('hadir', true),
        A.from('session_registration').select('id', { count: 'exact', head: true }).eq('sesi_id', id),
        A.from('tindak_lanjut_sesi').select('*').eq('sesi_id', id),
        A.from('bonus_event').select('jenis'),
        A.rpc('rekap_wellbeing', { s: id, minimum: MIN_WELLBEING }),
        A.from('follow_up_task').select('*, person:person_id(nama)').eq('sesi_id', id)
      ]);
      [rekap, teks, hadir, reg, tindak, bonus, well, tugas].forEach(x => { if (x.error) throw x.error; });

      const resp = await A.rpc('jml_responden', { s: id });
      if (resp.error) throw resp.error;

      D = {
        rekap: rekap.data || [],
        teks: teks.data || [],
        /* null = tidak berhak menghitung. 0 = berhak, memang belum ada.
           Dua keadaan ini tidak boleh dilebur. */
        responden: resp.data === null || resp.data === undefined ? null : Number(resp.data),
        hadir: typeof hadir.count === 'number' ? hadir.count : null,
        terdaftar: typeof reg.count === 'number' ? reg.count : null,
        tindak: tindak.data || [],
        bonus: bonus.data || [],
        wellbeing: well.data || [],
        tugas: tugas.data || []
      };
      gambarTab();
    } catch (e) { UI.gagal('isiTab', e); }
  }

  const TABS = [['ringkas', 'Ringkasan'], ['jawaban', 'Jawaban teks'],
                ['tindak', 'Tindak lanjut'], ['wellbeing', 'Wellbeing']];
  el('tabEv').innerHTML = TABS.map(([k, n]) =>
    '<button role="tab" aria-selected="' + (k === 'ringkas') + '" data-t="' + k + '">' + n + '</button>').join('');
  el('tabEv').onclick = (e) => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    TAB = b.dataset.t;
    el('tabEv').querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    gambarTab();
  };

  function gambarTab() {
    const V = { ringkas: tRingkas, jawaban: tJawaban, tindak: tTindak, wellbeing: tWellbeing };
    el('isiTab').innerHTML = (V[TAB] || tRingkas)();
    pasang();
  }

  /* ---------------- Ringkasan ---------------- */
  function tRingkas() {
    const r = D.responden;
    const belumBerhak = r === null;
    const kosong = r === 0;

    const kartuAngka =
      '<div class="deret" style="gap:10px;flex-wrap:wrap;margin-bottom:16px">' +
      [['Terdaftar', D.terdaftar === null ? '—' : D.terdaftar, 'orang mendaftar'],
       ['Hadir', D.hadir === null ? '—' : D.hadir,
        D.terdaftar === null ? 'penyebut belum terbaca' : 'dari ' + D.terdaftar + ' terdaftar'],
       ['Mengisi evaluasi', belumBerhak ? '—' : r,
        belumBerhak ? 'peran Anda tidak berhak menghitung'
                    : (D.hadir ? 'dari ' + D.hadir + ' yang hadir' : 'belum ada yang tercatat hadir')]]
      .map(([l, n, k]) => '<div class="kartu" style="flex:1;min-width:150px">' +
        '<div class="mini">' + l + '</div>' +
        '<div style="font-family:var(--fd);font-size:30px;line-height:1.1">' + n + '</div>' +
        '<div class="mini">' + k + '</div></div>').join('') + '</div>';

    /* Inti ketentuan: nol respons tidak boleh jadi angka. */
    if (belumBerhak) {
      return kartuAngka + '<div class="keadaan"><b>Rekap evaluasi tidak terbuka untuk peran ini</b>' +
        '<p>Jawaban evaluasi dibatasi di sisi basis data, bukan disembunyikan di layar. ' +
        'Yang Anda lihat kosong karena tidak berhak dihitung — <b>bukan karena tidak ada respons</b>.</p></div>';
    }
    if (kosong || !D.rekap.length) {
      return kartuAngka + '<div class="keadaan"><b>Belum ada respons</b>' +
        '<p>Tidak ada satu pun evaluasi yang masuk untuk sesi ini, jadi tidak ada rata-rata yang bisa dihitung. ' +
        '<b>Belum ada respons bukan berarti nilainya nol</b>, dan peserta yang belum mengisi ' +
        'bukan peserta yang menilai buruk.</p>' +
        (D.hadir ? '<p class="mini">Buka aktivitas evaluasi di layar kendali sesi, atau tunggu — ' +
          'peserta masih bisa mengisi setelah sesi selesai.</p>' : '') + '</div>';
    }

    return kartuAngka +
      '<div class="kartu"><div class="kartu-h"><h3>Rata-rata per pertanyaan</h3>' +
      '<span class="lbl abu">skala 0–10</span></div>' +
      D.rekap.map(x => {
        const lebar = Math.max(0, Math.min(100, Number(x.rata) * 10));
        return '<div style="margin-bottom:16px">' +
          '<div class="deret" style="justify-content:space-between;align-items:baseline">' +
          '<b>' + esc(A.EVAL.label(x.kunci)) + '</b>' +
          '<span style="font-family:var(--fd);font-size:20px">' + esc(String(x.rata)) + '</span></div>' +
          '<div style="height:8px;border-radius:6px;background:var(--surface-3);overflow:hidden;margin:7px 0">' +
          '<i style="display:block;height:100%;width:' + lebar + '%;background:var(--gold)"></i></div>' +
          '<p class="mini">Dari <b>' + x.jml + ' orang</b> yang menjawab pertanyaan ini' +
          (D.hadir ? ', dari ' + D.hadir + ' yang hadir' : '') + '. ' +
          'Terendah ' + esc(String(x.terendah)) + ', tertinggi ' + esc(String(x.tertinggi)) + '. ' +
          'Yang melewati pertanyaan ini <b>tidak dihitung sebagai 0</b>.</p></div>';
      }).join('') +
      '<p class="mini">Penyebut setiap baris bisa berbeda, karena setiap pertanyaan boleh dilewati. ' +
      'Itu disebutkan satu per satu dan tidak diseragamkan.</p></div>' +

      /* ---- bonus: klik bukan selesai mendengarkan ---- */
      '<div class="kartu"><div class="kartu-h"><h3>Bonus audio</h3></div>' +
      '<p><b>' + D.bonus.filter(b => b.jenis === 'follow_ig_dikonfirmasi').length + '</b> peserta ' +
      'menyatakan sudah mengikuti Instagram. <span class="mini">Pernyataan peserta, tidak diperiksa ke Instagram.</span></p>' +
      '<p style="margin-top:6px"><b>' + D.bonus.filter(b => b.jenis === 'klik_spotify').length + '</b> peserta ' +
      'mengklik tautan Spotify. <span class="mini">Itu <b>peristiwa klik</b> — bukan bukti ada yang ' +
      'selesai mendengarkan, dan tidak boleh dilaporkan sebagai jumlah pendengar.</span></p>' +
      '<p class="mini" style="margin-top:8px">Angka ini lintas sesi, bukan per sesi: peristiwa bonus ' +
      'tidak terikat ke satu sesi.</p></div>' +

      '<div class="deret" style="margin-top:14px"><button class="btn hantu kecil" data-csv>Unduh CSV rekap</button></div>';
  }

  /* ---------------- Jawaban teks ---------------- */
  function tJawaban() {
    if (D.responden === null) {
      return '<div class="keadaan"><b>Tidak terbuka untuk peran ini</b>' +
        '<p>Jawaban teks dibatasi di sisi basis data.</p></div>';
    }
    if (!D.teks.length) {
      return '<div class="keadaan"><b>Belum ada jawaban teks</b>' +
        '<p>Bisa jadi belum ada yang mengisi, bisa jadi yang mengisi hanya memberi nilai angka. ' +
        'Keduanya sah, dan tidak satu pun berarti penilaian buruk.</p></div>';
    }
    const kelompok = {};
    D.teks.forEach(t => { (kelompok[t.kunci] = kelompok[t.kunci] || []).push(t); });
    return '<div class="kartu"><div class="kartu-h"><h3>Jawaban teks</h3>' +
      '<span class="lbl abu">' + D.teks.length + ' jawaban</span></div>' +
      '<p class="mini" style="margin-bottom:14px">Tanpa nama pengirim — <b>bukan disembunyikan di layar, ' +
      'memang tidak diambil dari basis data</b>. Jawaban bertanda <i>boleh dikutip</i> adalah yang ' +
      'pemiliknya mengizinkan; izin itu <b>bukan perintah menerbitkan</b>, dan tidak ada yang terbit ' +
      'sendiri ke mana pun.</p>' +
      Object.keys(kelompok).map(k =>
        '<div style="margin-bottom:18px"><div class="cap" style="font-size:11px;letter-spacing:.2em;' +
        'text-transform:uppercase;color:var(--text-3);margin-bottom:8px">' +
        esc(A.EVAL.label(k)) + '</div>' +
        kelompok[k].map(t =>
          '<div style="border-left:3px solid ' + (t.boleh_dikutip ? 'var(--gold)' : 'var(--border)') +
          ';padding-left:12px;margin-bottom:10px">' +
          '<p style="margin:0 0 4px">' + esc(t.isi) + '</p>' +
          '<span class="lbl ' + (t.boleh_dikutip ? 'hijau' : 'abu') + '">' +
          (t.boleh_dikutip ? 'boleh dikutip' : 'tidak untuk dikutip') + '</span></div>').join('') +
        '</div>').join('') + '</div>';
  }

  /* ---------------- Tindak lanjut ---------------- */
  function tTindak() {
    const n = D.tindak.length;
    const hitung = {};
    D.tindak.forEach(x => { hitung[x.status] = (hitung[x.status] || 0) + 1; });
    return '<div class="kartu"><div class="kartu-h"><h3>Action plan peserta</h3>' +
      '<span class="lbl abu">' + n + ' rencana</span></div>' +
      '<p class="mini" style="margin-bottom:14px"><b>"Dilaporkan selesai" adalah laporan peserta, ' +
      'bukan hasil yang sudah diverifikasi.</b> Dan <b>"Belum diperbarui" bukan kegagalan</b> — ' +
      'bisa jadi rencananya berjalan tanpa dilaporkan. Isi tujuan dan langkahnya tidak ditampilkan ' +
      'di sini: itu milik peserta.</p>' +
      (n
        ? '<div class="deret" style="gap:8px;flex-wrap:wrap;margin-bottom:14px">' +
          Object.keys(hitung).map(k => '<span class="lbl ' +
            (k === 'Dilaporkan selesai' ? 'hijau' : k === 'Perlu bantuan' ? 'oranye' : 'abu') + '">' +
            esc(k) + ': ' + hitung[k] + '</span>').join('') + '</div>' +
          D.tindak.map(x => '<div class="baris"><div class="pokok"><b>' + esc(x.nama || '—') + '</b><span>' +
            esc(x.status) +
            (x.diperbarui_pada ? ' · diperbarui ' + A.tgl(x.diperbarui_pada) : ' · belum pernah diperbarui') +
            (x.ada_catatan_bukti ? ' · ada catatan bukti' : '') +
            (x.lewat_tenggat ? ' · lewat tenggat' : '') + '</span></div>' +
            '<button class="btn hantu kecil" data-tugas="' + x.person_id + '">Buat tugas</button></div>').join('')
        : '<p class="mini">Belum ada peserta sesi ini yang membuat action plan.</p>') +
      '</div>' +

      '<div class="kartu"><div class="kartu-h"><h3>Tugas tindak lanjut</h3>' +
      '<span class="lbl abu">' + D.tugas.length + '</span></div>' +
      '<p class="mini" style="margin-bottom:12px"><b>Membuat tugas di sini tidak mengirim pesan apa pun.</b> ' +
      'Ini pencatatan, bukan pengiriman — integrasi WhatsApp dan email belum ada.</p>' +
      (D.tugas.length
        ? D.tugas.map(t => '<div class="baris"><div class="pokok"><b>' + esc(t.tujuan) + '</b><span>' +
            esc((t.person && t.person.nama) || '—') +
            (t.jadwal ? ' · ' + A.tgl(t.jadwal) : ' · tanpa jadwal') +
            (t.kanal ? ' · ' + esc(t.kanal) : '') + '</span></div>' +
            '<span class="lbl ' + (t.status === 'Selesai' ? 'hijau' : 'biru') + '">' + esc(t.status) + '</span>' +
            '</div>').join('')
        : '<p class="mini">Belum ada tugas untuk sesi ini.</p>') + '</div>';
  }

  /* ---------------- Wellbeing ---------------- */
  function tWellbeing() {
    const cukup = D.wellbeing.length > 0;
    return '<div class="kartu"><div class="kartu-h"><h3>Agregat Wellbeing Life Circle</h3></div>' +
      '<p class="mini" style="margin-bottom:14px"><b>Ini bukan ranking peserta, bukan skor kelayakan ' +
      'investasi, dan bukan diagnosis.</b> Life Circle adalah refleksi pribadi; yang terbaca di sini ' +
      'hanya rata-rata per aspek, tanpa nama, dan hanya kalau pengisinya minimal ' + MIN_WELLBEING +
      ' orang — supaya satu baris tidak bisa ditelusuri ke satu orang.</p>' +
      (cukup
        ? D.wellbeing.map(x => {
            const lebar = Math.max(0, Math.min(100, Number(x.rata) * 10));
            return '<div style="margin-bottom:14px">' +
              '<div class="deret" style="justify-content:space-between;align-items:baseline">' +
              '<b>' + esc(x.aspek) + '</b><span style="font-family:var(--fd);font-size:19px">' +
              esc(String(x.rata)) + '</span></div>' +
              '<div style="height:8px;border-radius:6px;background:var(--surface-3);overflow:hidden;margin:6px 0">' +
              '<i style="display:block;height:100%;width:' + lebar + '%;background:var(--sage,#8AA87B)"></i></div>' +
              '<p class="mini">' + x.jml + ' orang menjawab aspek ini. Aspek yang dilewati tidak ikut ' +
              'dihitung dan <b>tidak dianggap nol</b>; nilai 0 yang benar-benar dipilih ikut dihitung.</p></div>';
          }).join('')
        : '<div class="keadaan" style="margin:0"><b>Belum bisa ditampilkan</b>' +
          '<p>Pengisi Life Circle sesi ini belum mencapai ' + MIN_WELLBEING + ' orang. ' +
          'Angkanya memang ada, tetapi menampilkannya sekarang sama dengan menunjuk orang tertentu — ' +
          'jadi ditahan. <b>Ini bukan berarti nilainya nol atau tidak ada yang mengisi.</b></p></div>') +
      '</div>';
  }

  /* ===================== aksi ===================== */
  function pasang() {
    const csv = el('isiTab').querySelector('[data-csv]');
    if (csv) csv.onclick = unduhCsv;
    el('isiTab').querySelectorAll('[data-tugas]').forEach(b =>
      b.onclick = () => buatTugas(b.dataset.tugas,
        (D.tindak.find(x => x.person_id === b.dataset.tugas) || {}).nama));
  }

  /* Sel CSV yang dimulai dengan = + - @ tab atau CR dijadikan teks, supaya
     Excel dan Sheets tidak menjalankannya sebagai formula. */
  function sel(v) {
    if (v === null || v === undefined) return '';
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function unduhCsv() {
    const baris = [['pertanyaan', 'penjawab', 'rata_rata', 'terendah', 'tertinggi', 'hadir_saat_itu']];
    D.rekap.forEach(x => baris.push([A.EVAL.label(x.kunci), x.jml, x.rata, x.terendah, x.tertinggi,
      D.hadir === null ? '' : D.hadir]));
    baris.push([]);
    baris.push(['catatan', 'Rata-rata hanya dari yang menjawab pertanyaan itu. ' +
      'Yang melewati pertanyaan tidak dihitung sebagai 0. ' +
      'Jumlah responden: ' + (D.responden === null ? 'tidak berhak dihitung' : D.responden) +
      ' dari ' + (D.hadir === null ? 'penyebut tidak terbaca' : D.hadir + ' yang hadir') + '.']);
    const isi = baris.map(r => r.map(sel).join(',')).join('\r\n');
    const nama = 'evaluasi-' + (SESI.kode_sesi || SESI.id).replace(/[^A-Za-z0-9-]/g, '') + '.csv';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + isi], { type: 'text/csv;charset=utf-8' }));
    a.download = nama; a.click(); URL.revokeObjectURL(a.href);
    UI.pesan('CSV diunduh', 'sukses');
  }

  async function buatTugas(personId, nama) {
    const v = await A.formulir('Tugas tindak lanjut' + (nama ? ' — ' + esc(nama) : ''),
      '<b>Menyimpan tugas tidak mengirim pesan apa pun.</b> Yang tercatat di sini adalah niat ' +
      'menindaklanjuti, bukan pengirimannya.',
      [{ k: 'tujuan', l: 'Yang akan dilakukan', wajib: true, ph: 'Tanyakan hambatan langkah pertama' },
       { k: 'jadwal', l: 'Jadwal', t: 'date' },
       { k: 'kanal', l: 'Lewat apa', t: 'pilih', opt: ['WhatsApp', 'Telepon', 'Email', 'Tatap muka', 'Belum ditentukan'] },
       { k: 'catatan', l: 'Catatan', t: 'panjang' }]);
    if (!v) return;
    const { error } = await A.from('follow_up_task').insert({
      person_id: personId, sesi_id: SESI.id, tujuan: v.tujuan,
      jadwal: v.jadwal || null, kanal: v.kanal === 'Belum ditentukan' ? null : v.kanal,
      catatan: v.catatan || null });
    if (error) {
      if (error.code === '23505') { UI.pesan('Tugas dengan tujuan yang sama sudah ada — tidak dibuat dua kali', 'gagal'); return; }
      UI.pesan(UI.bacaError(error).isi, 'gagal'); return;
    }
    UI.pesan('Tugas tercatat. Tidak ada pesan yang dikirim.', 'sukses');
    await muat(SESI.id, SESI);
  }

  el('kembaliEv').onclick = () => {
    el('kerja').hidden = true; el('pilih').hidden = false; pilihSesi();
  };

  boot();
})();
