/* =====================================================================
   LAPISAN BERSAMA — klien Supabase, autentikasi, peran, dan keadaan UI.
   Dipakai portal peserta maupun sisi pengelola.

   Prinsip yang dipegang di sini:
   - Tidak pernah menyatakan "tersimpan" sebelum server menjawab berhasil.
   - Tidak pernah menyembunyikan tombol sebagai pengganti izin; yang
     menolak tetap basis data. UI hanya menjelaskan penolakannya.
   - Nol dan kosong dibedakan di seluruh lapisan ini.
   ===================================================================== */

(function (global) {
  'use strict';

  const CFG = global.AJIOS_CONFIG || {};
  const ORIGIN = CFG.origin || global.location.origin + global.location.pathname.replace(/\/[^/]*$/, '');

  /* ---------------------------------------------------------- klien */
  let _sb = null;
  function sb() {
    if (_sb) return _sb;
    if (!global.supabase || !global.supabase.createClient)
      throw new Error('Pustaka Supabase belum termuat. Periksa koneksi internet.');
    if (!CFG.url || !CFG.anon || CFG.anon.indexOf('ISI_DENGAN') === 0)
      throw new Error('config.js belum diisi. Masukkan Project URL dan anon public key.');
    _sb = global.supabase.createClient(CFG.url, CFG.anon, {
      db: { schema: CFG.schema || 'ajios' },
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return _sb;
  }
  /* Beberapa tabel PDP ada di schema yang sama; disiapkan kalau nanti berbeda. */
  const from = (t) => sb().from(t);

  /* ------------------------------------------------------ autentikasi */
  const auth = {
    async sesiSekarang() {
      const { data, error } = await sb().auth.getSession();
      if (error) throw error;
      return data.session || null;
    },
    async user() {
      const s = await auth.sesiSekarang();
      return s ? s.user : null;
    },
    /* OTP lewat email. Tidak ada kata sandi yang kami simpan atau minta. */
    async kirimOtp(email, tujuan) {
      const { error } = await sb().auth.signInWithOtp({
        email: String(email || '').trim(),
        options: { emailRedirectTo: tujuan || (ORIGIN + '/') }
      });
      if (error) throw error;
      return true;
    },
    async verifikasiOtp(email, kode) {
      const { data, error } = await sb().auth.verifyOtp({
        email: String(email || '').trim(), token: String(kode || '').trim(), type: 'email'
      });
      if (error) throw error;
      return data.session;
    },
    async keluar() { await sb().auth.signOut(); _profilCache = null; _peranCache = null; },
    onBerubah(fn) { sb().auth.onAuthStateChange((_e, s) => fn(s)); }
  };

  /* --------------------------------------------------- profil & peran */
  let _profilCache = null, _peranCache = null;

  /* Baris person milik pengguna yang sedang masuk. null kalau belum ada
     — itu keadaan sah, bukan error: akun bisa ada sebelum profilnya diisi. */
  async function profilSaya() {
    if (_profilCache !== null) return _profilCache;
    const u = await auth.user();
    if (!u) return (_profilCache = false);
    const { data, error } = await from('person').select('*').eq('auth_user_id', u.id).maybeSingle();
    if (error) throw error;
    return (_profilCache = (data || false));
  }

  /* Peran internal. Peserta biasa tidak punya baris staff, dan RLS membuat
     kueri ini mengembalikan kosong untuk mereka — bukan error. */
  async function peranSaya() {
    if (_peranCache !== null) return _peranCache;
    const u = await auth.user();
    if (!u) return (_peranCache = null);
    const { data, error } = await from('staff').select('peran, aktif').eq('auth_user_id', u.id).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return (_peranCache = (data && data.aktif ? data.peran : null));
  }
  const adalahStaf = async (...p) => { const r = await peranSaya(); return !!r && (!p.length || p.indexOf(r) !== -1); };
  function lupakanCache() { _profilCache = null; _peranCache = null; }

  /* ------------------------------------------------------------ nilai */
  /* Tiga keadaan yang tidak boleh tertukar sepanjang aplikasi ini. */
  const KOSONG = Symbol('belum diisi');
  function tampilNilai(v, opsi) {
    const o = opsi || {};
    if (v === null || v === undefined || v === '') return o.kosong || '<span class="nihil">belum diisi</span>';
    if (v === 0) return o.nol !== undefined ? o.nol : '0';
    return esc(String(v));
  }
  /* Omzet: "Belum menghasilkan" dan "Belum bersedia mengisi" BUKAN nol. */
  function tampilOmzet(rentang, periode) {
    if (!rentang) return '<span class="nihil">belum diisi</span>';
    if (rentang === 'Belum bersedia mengisi') return '<span class="nihil">belum bersedia</span>';
    if (rentang === 'Belum menghasilkan') return 'Belum menghasilkan';
    return esc(rentang) + (periode ? ' <span class="mini">· ' + esc(periode) + '</span>' : '');
  }

  /* ----------------------------------------------------------- utilitas */
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function el(id) { return document.getElementById(id); }
  function tgl(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return iso; }
  }
  function jam(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return iso; }
  }

  /* -------------------------------------------------- keadaan tampilan */
  const UI = {
    memuat(target, teks) {
      const n = typeof target === 'string' ? el(target) : target;
      if (n) n.innerHTML = '<div class="keadaan memuat"><span class="putar"></span>' +
        esc(teks || 'Memuat…') + '</div>';
    },
    kosong(target, judul, isi, aksi) {
      const n = typeof target === 'string' ? el(target) : target;
      if (n) n.innerHTML = '<div class="keadaan"><b>' + esc(judul) + '</b><p>' + (isi || '') + '</p>' +
        (aksi || '') + '</div>';
    },
    /* Pesan error menjelaskan apa yang terjadi DAN apa yang bisa dilakukan. */
    gagal(target, e, konteks) {
      const n = typeof target === 'string' ? el(target) : target;
      const p = UI.bacaError(e);
      if (n) n.innerHTML = '<div class="keadaan gagal"><b>' + esc(p.judul) + '</b><p>' + esc(p.isi) + '</p>' +
        (konteks ? '<p class="mini">' + esc(konteks) + '</p>' : '') +
        '<button class="btn" onclick="location.reload()">Muat ulang</button></div>';
      if (global.console) console.error(e);
    },
    bacaError(e) {
      const kode = (e && (e.code || e.status)) || '';
      const pesan = (e && (e.message || e.error_description)) || String(e);
      if (/Failed to fetch|NetworkError/i.test(pesan))
        return { judul: 'Tidak tersambung', isi: 'Koneksi ke server terputus. Jawaban yang belum terkirim belum tersimpan.' };
      if (kode === '42501' || /permission denied/i.test(pesan))
        return { judul: 'Tidak punya akses', isi: 'Akun Anda tidak berhak membuka data ini. Kalau ini keliru, hubungi pengelola.' };
      if (kode === 'PGRST301' || kode === 401 || /JWT|not authenticated/i.test(pesan))
        return { judul: 'Sesi berakhir', isi: 'Silakan masuk kembali.' };
      if (kode === '23505') return { judul: 'Sudah pernah tersimpan', isi: 'Data yang sama sudah ada. Tidak ada yang digandakan.' };
      if (kode === 'PGRST205' || /schema cache|does not exist/i.test(pesan))
        return { judul: 'Schema belum dibuka', isi: 'Tambahkan "ajios" di Integrations → Data API → Settings → Exposed schemas.' };
      if (!CFG.anon || CFG.anon.indexOf('ISI_DENGAN') === 0)
        return { judul: 'Belum dikonfigurasi', isi: 'config.js belum diisi anon public key.' };
      return { judul: 'Gagal', isi: pesan };
    },
    /* Toast hanya muncul SETELAH server menjawab. */
    pesan(teks, jenis) {
      let t = el('ajios-toast');
      if (!t) {
        t = document.createElement('div'); t.id = 'ajios-toast'; t.className = 'toast';
        document.body.appendChild(t);
      }
      t.textContent = teks; t.className = 'toast on ' + (jenis || '');
      clearTimeout(t._t); t._t = setTimeout(() => { t.className = 'toast ' + (jenis || ''); }, 3400);
    }
  };

  /* ------------------------------------------------ tombol anti-ganda */
  /* Mencegah submit dobel yang membuat record kembar. */
  function sekaliSaja(btn, kerja) {
    if (btn.dataset.sibuk === '1') return Promise.resolve();
    btn.dataset.sibuk = '1';
    const teksLama = btn.textContent;
    btn.disabled = true; btn.textContent = 'Menyimpan…';
    return Promise.resolve()
      .then(kerja)
      .catch(e => { UI.pesan(UI.bacaError(e).judul + ' — ' + UI.bacaError(e).isi, 'gagal'); throw e; })
      .finally(() => { btn.dataset.sibuk = '0'; btn.disabled = false; btn.textContent = teksLama; });
  }

  /* ------------------------------------------------------- persetujuan */
  const consent = {
    async tujuan() {
      const { data, error } = await from('consent_purpose').select('*').order('wajib', { ascending: false });
      if (error) throw error; return data || [];
    },
    async milikSaya(personId) {
      const { data, error } = await from('consent').select('*').eq('person_id', personId)
        .order('pada', { ascending: false }).order('urut', { ascending: false });
      if (error) throw error;
      const terakhir = {};
      (data || []).forEach(r => { if (!(r.purpose in terakhir)) terakhir[r.purpose] = r; });
      return { histori: data || [], terakhir };
    },
    /* Pencabutan ditambahkan sebagai baris baru. Histori tidak pernah dihapus. */
    async catat(personId, purpose, diberikan, sumber, teks) {
      const { error } = await from('consent').insert({
        person_id: personId, purpose, diberikan: !!diberikan,
        sumber: sumber || 'portal', teks_saat_itu: teks || null,
        dicabut_pada: diberikan ? null : new Date().toISOString()
      });
      if (error) throw error; return true;
    }
  };

  /* ------------------------------------------------------- formulir */
  /* prompt() bawaan peramban tidak bisa divalidasi, tidak bisa diberi
     keterangan, dan di sebagian penampil tidak muncul sama sekali.
     Semua isian di aplikasi ini memakai formulir sendiri. */
  function formulir(judul, keterangan, medan) {
    return new Promise((selesai) => {
      const lapis = document.createElement('div');
      lapis.className = 'lapis';
      lapis.innerHTML = '<div class="lapis-kotak" role="dialog" aria-modal="true" aria-label="' +
        esc(judul) + '"><h3>' + esc(judul) + '</h3>' +
        (keterangan ? '<p class="mini" style="margin:6px 0 14px">' + keterangan + '</p>' : '') +
        medan.map(m => '<div class="isian" data-k="' + esc(m.k) + '">' +
          '<label for="f-' + esc(m.k) + '">' + esc(m.l) + (m.wajib ? ' <i>*</i>' : '') + '</label>' +
          (m.t === 'pilih'
            ? '<select id="f-' + esc(m.k) + '">' + (m.opt || []).map(o =>
                '<option value="' + esc(o) + '">' + esc(o) + '</option>').join('') + '</select>'
            : m.t === 'panjang'
              ? '<textarea id="f-' + esc(m.k) + '" placeholder="' + esc(m.ph || '') + '"></textarea>'
              : '<input id="f-' + esc(m.k) + '" type="' + esc(m.t || 'text') + '" placeholder="' +
                esc(m.ph || '') + '">') +
          (m.bantu ? '<span class="bantu">' + m.bantu + '</span>' : '') +
          '<span class="galat" hidden></span></div>').join('') +
        '<div class="deret" style="margin-top:6px"><button class="btn" data-ok>Simpan</button>' +
        '<button class="btn hantu" data-batal>Batal</button></div></div>';
      document.body.appendChild(lapis);
      const tutup = (hasil) => { lapis.remove(); selesai(hasil); };
      lapis.querySelector('[data-batal]').onclick = () => tutup(null);
      lapis.onclick = (e) => { if (e.target === lapis) tutup(null); };
      lapis.querySelector('[data-ok]').onclick = () => {
        const nilai = {}; let bermasalah = false;
        medan.forEach(m => {
          const kotak = lapis.querySelector('[data-k="' + m.k + '"]');
          const v = (kotak.querySelector('input,select,textarea').value || '').trim();
          nilai[m.k] = v;
          const galat = m.wajib && !v ? 'Wajib diisi'
            : (v && m.periksa ? m.periksa(v) : '');
          kotak.classList.toggle('salah', !!galat);
          const g = kotak.querySelector('.galat'); g.textContent = galat || ''; g.hidden = !galat;
          if (galat) bermasalah = true;
        });
        if (!bermasalah) tutup(nilai);
      };
      const awal = lapis.querySelector('input,select,textarea'); if (awal) awal.focus();
      lapis.addEventListener('keydown', (e) => { if (e.key === 'Escape') tutup(null); });
    });
  }

  global.AJIOS = {
    sb, from, auth, profilSaya, peranSaya, adalahStaf, lupakanCache,
    esc, el, tgl, jam, tampilNilai, tampilOmzet, UI, sekaliSaja, consent, formulir,
    CFG, ORIGIN, KOSONG
  };
})(window);
