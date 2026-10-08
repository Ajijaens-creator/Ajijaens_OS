/* =====================================================================
   QR — pembuat kode QR mandiri, tanpa pustaka luar.

   Mengapa ditulis sendiri dan tidak mengambil dari CDN:

   1. Layar sesi dipakai di ruangan, kadang dengan internet yang buruk.
      Kalau QR-nya bergantung pada CDN, satu kegagalan muat berarti
      peserta tidak bisa bergabung.
   2. Ketentuan NP-V08: "Buat QR nyata dari URL sesi yang valid. Jangan
      memakai QR ilustrasi." Kode di sini DIUJI dengan cara dibaca
      kembali oleh pembaca QR sungguhan (OpenCV) dari gambar hasil
      render — bukan sekadar dianggap benar.

   Cakupan yang disengaja: mode byte (UTF-8), tingkat koreksi M,
   versi 1 sampai 10 (maksimum 216 bita). Di atas itu fungsi ini
   MELEMPAR error, bukan menghasilkan gambar yang salah. Alamat sesi
   jauh di bawah batas itu.

   Acuan: ISO/IEC 18004.
   ===================================================================== */
(function (global) {
  'use strict';

  /* ---------------- tabel: [total kodeword, ecc per blok, blok grup1,
                              data grup1, blok grup2, data grup2] ----- */
  var M_TABEL = {
    1:  [26,  10, 1, 16, 0, 0],
    2:  [44,  16, 1, 28, 0, 0],
    3:  [70,  26, 1, 44, 0, 0],
    4:  [100, 18, 2, 32, 0, 0],
    5:  [134, 24, 2, 43, 0, 0],
    6:  [172, 16, 4, 27, 0, 0],
    7:  [196, 18, 4, 31, 0, 0],
    8:  [242, 22, 2, 38, 2, 39],
    9:  [292, 22, 3, 36, 2, 37],
    10: [346, 26, 4, 43, 1, 44]
  };
  var SEJAJAR = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };

  /* ---------------- GF(256) ---------------- */
  var EXP = new Array(512), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  function polGenerator(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var baru = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) {
        baru[j] ^= g[j];
        baru[j + 1] ^= gmul(g[j], EXP[i]);
      }
      g = baru;
    }
    return g;
  }

  function ecc(data, n) {
    var g = polGenerator(n), sisa = data.slice().concat(new Array(n).fill(0));
    for (var i = 0; i < data.length; i++) {
      var k = sisa[i];
      if (k === 0) continue;
      for (var j = 0; j < g.length; j++) sisa[i + j] ^= gmul(g[j], k);
    }
    return sisa.slice(data.length);
  }

  /* ---------------- UTF-8 ---------------- */
  function bita(s) {
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.codePointAt(i);
      if (c > 0xFFFF) i++;
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  /* ---------------- bit stream ---------------- */
  function Bits() { this.b = []; }
  Bits.prototype.tulis = function (nilai, panjang) {
    for (var i = panjang - 1; i >= 0; i--) this.b.push((nilai >>> i) & 1);
  };

  /* ---------------- BCH ---------------- */
  function bchFormat(data) {
    var d = data << 10;
    while (derajat(d) >= 11) d ^= 0x537 << (derajat(d) - 11);
    return ((data << 10) | d) ^ 0x5412;
  }
  function bchVersi(data) {
    var d = data << 12;
    while (derajat(d) >= 13) d ^= 0x1F25 << (derajat(d) - 13);
    return (data << 12) | d;
  }
  function derajat(n) { var d = 0; while (n !== 0) { d++; n >>>= 1; } return d; }

  /* ---------------- matriks ---------------- */
  function kosong(size) {
    var m = [];
    for (var i = 0; i < size; i++) m.push(new Array(size).fill(null));
    return m;
  }

  function taruhFinder(m, r, c) {
    for (var i = -1; i <= 7; i++) for (var j = -1; j <= 7; j++) {
      var y = r + i, x = c + j;
      if (y < 0 || x < 0 || y >= m.length || x >= m.length) continue;
      var di = (i >= 0 && i <= 6 && (j === 0 || j === 6)) ||
               (j >= 0 && j <= 6 && (i === 0 || i === 6)) ||
               (i >= 2 && i <= 4 && j >= 2 && j <= 4);
      m[y][x] = di ? 1 : 0;
    }
  }

  function taruhSejajar(m, versi) {
    var pos = SEJAJAR[versi], size = m.length;
    for (var a = 0; a < pos.length; a++) for (var b = 0; b < pos.length; b++) {
      var r = pos[a], c = pos[b];
      /* lewati yang bertabrakan dengan finder */
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
      for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++)
        m[r + i][c + j] = (Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)) ? 1 : 0;
    }
  }

  function taruhTiming(m) {
    for (var i = 8; i < m.length - 8; i++) {
      if (m[6][i] === null) m[6][i] = (i % 2 === 0) ? 1 : 0;
      if (m[i][6] === null) m[i][6] = (i % 2 === 0) ? 1 : 0;
    }
  }

  /* posisi 15 bit format, dua salinan */
  function selFormat(size) {
    var a = [], i;
    for (i = 0; i <= 5; i++) a.push([8, i]);
    a.push([8, 7]); a.push([8, 8]); a.push([7, 8]);
    for (i = 5; i >= 0; i--) a.push([i, 8]);
    var b = [];
    for (i = 0; i <= 6; i++) b.push([size - 1 - i, 8]);
    for (i = 7; i >= 0; i--) b.push([8, size - 8 + (7 - i)]);
    return [a, b];
  }

  function cadangkanFormat(m) {
    var size = m.length, f = selFormat(size), i;
    for (i = 0; i < 15; i++) { m[f[0][i][0]][f[0][i][1]] = 0; m[f[1][i][0]][f[1][i][1]] = 0; }
    m[size - 8][8] = 1;   /* modul gelap */
  }

  function cadangkanVersi(m, versi) {
    if (versi < 7) return;
    var size = m.length;
    for (var i = 0; i < 18; i++) {
      m[Math.floor(i / 3)][size - 11 + (i % 3)] = 0;
      m[size - 11 + (i % 3)][Math.floor(i / 3)] = 0;
    }
  }

  function tulisVersi(m, versi) {
    if (versi < 7) return;
    var size = m.length, v = bchVersi(versi);
    for (var i = 0; i < 18; i++) {
      var bit = (v >>> i) & 1;
      m[Math.floor(i / 3)][size - 11 + (i % 3)] = bit;
      m[size - 11 + (i % 3)][Math.floor(i / 3)] = bit;
    }
  }

  function tulisFormat(m, mask) {
    var size = m.length, f = selFormat(size);
    var v = bchFormat((0 << 3) | mask);   /* 00 = tingkat M */
    for (var i = 0; i < 15; i++) {
      var bit = (v >>> (14 - i)) & 1;
      m[f[0][i][0]][f[0][i][1]] = bit;
      m[f[1][i][0]][f[1][i][1]] = bit;
    }
    m[size - 8][8] = 1;
  }

  function maskFn(k, i, j) {
    switch (k) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      case 7: return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0;
    }
  }

  function denda(m) {
    var size = m.length, n = 0, i, j, r, c;
    /* aturan 1: deret >= 5 */
    for (i = 0; i < size; i++) {
      var deretB = 1, deretK = 1;
      for (j = 1; j < size; j++) {
        if (m[i][j] === m[i][j - 1]) deretB++;
        else { if (deretB >= 5) n += 3 + (deretB - 5); deretB = 1; }
        if (m[j][i] === m[j - 1][i]) deretK++;
        else { if (deretK >= 5) n += 3 + (deretK - 5); deretK = 1; }
      }
      if (deretB >= 5) n += 3 + (deretB - 5);
      if (deretK >= 5) n += 3 + (deretK - 5);
    }
    /* aturan 2: blok 2x2 */
    for (i = 0; i < size - 1; i++) for (j = 0; j < size - 1; j++) {
      var v = m[i][j];
      if (v === m[i][j + 1] && v === m[i + 1][j] && v === m[i + 1][j + 1]) n += 3;
    }
    /* aturan 3: pola 1:1:3:1:1 dengan ruang kosong 4 */
    var polaA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    var polaB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    function cocok(get, k) {
      for (var t = 0; t < 11; t++) if (get(k + t) !== polaA[t]) return false;
      return true;
    }
    function cocokB(get, k) {
      for (var t = 0; t < 11; t++) if (get(k + t) !== polaB[t]) return false;
      return true;
    }
    for (i = 0; i < size; i++) {
      for (j = 0; j + 11 <= size; j++) {
        var gb = (function (ii) { return function (x) { return m[ii][x]; }; })(i);
        var gk = (function (jj) { return function (x) { return m[x][jj]; }; })(i);
        if (cocok(gb, j) || cocokB(gb, j)) n += 40;
        if (cocok(gk, j) || cocokB(gk, j)) n += 40;
      }
    }
    /* aturan 4: keseimbangan gelap-terang */
    var gelap = 0;
    for (i = 0; i < size; i++) for (j = 0; j < size; j++) if (m[i][j]) gelap++;
    var persen = gelap * 100 / (size * size);
    n += Math.floor(Math.abs(persen - 50) / 5) * 10;
    return n;
  }

  /* ---------------- utama ---------------- */
  function matriks(teks) {
    var d = bita(teks), versi = 0, i, j;
    for (var v = 1; v <= 10; v++) {
      var t = M_TABEL[v];
      var dataKw = t[2] * t[3] + t[4] * t[5];
      var hitungBit = 4 + (v < 10 ? 8 : 16) + d.length * 8;
      if (hitungBit <= dataKw * 8) { versi = v; break; }
    }
    if (!versi) throw new Error('Teks terlalu panjang untuk QR versi 1-10 (maksimum 216 bita).');

    var tab = M_TABEL[versi];
    var eccPer = tab[1], b1 = tab[2], d1 = tab[3], b2 = tab[4], d2 = tab[5];
    var totalData = b1 * d1 + b2 * d2;

    var bs = new Bits();
    bs.tulis(4, 4);                               /* mode byte */
    bs.tulis(d.length, versi < 10 ? 8 : 16);
    for (i = 0; i < d.length; i++) bs.tulis(d[i], 8);
    var sisaBit = totalData * 8 - bs.b.length;
    bs.tulis(0, Math.min(4, sisaBit));            /* terminator */
    while (bs.b.length % 8 !== 0) bs.b.push(0);
    var pad = [0xEC, 0x11], p = 0;
    while (bs.b.length / 8 < totalData) { bs.tulis(pad[p % 2], 8); p++; }

    var kw = [];
    for (i = 0; i < bs.b.length; i += 8) {
      var byt = 0;
      for (j = 0; j < 8; j++) byt = (byt << 1) | bs.b[i + j];
      kw.push(byt);
    }

    /* pecah ke blok, hitung ECC */
    var blokData = [], blokEcc = [], ofs = 0, k;
    for (k = 0; k < b1; k++) { blokData.push(kw.slice(ofs, ofs + d1)); ofs += d1; }
    for (k = 0; k < b2; k++) { blokData.push(kw.slice(ofs, ofs + d2)); ofs += d2; }
    for (k = 0; k < blokData.length; k++) blokEcc.push(ecc(blokData[k], eccPer));

    /* selang-seling */
    var urut = [], maxD = Math.max(d1, d2);
    for (i = 0; i < maxD; i++) for (k = 0; k < blokData.length; k++)
      if (i < blokData[k].length) urut.push(blokData[k][i]);
    for (i = 0; i < eccPer; i++) for (k = 0; k < blokEcc.length; k++) urut.push(blokEcc[k][i]);

    var bit = [];
    for (i = 0; i < urut.length; i++) for (j = 7; j >= 0; j--) bit.push((urut[i] >>> j) & 1);

    /* rangka */
    var size = versi * 4 + 17, m = kosong(size);
    taruhFinder(m, 0, 0); taruhFinder(m, 0, size - 7); taruhFinder(m, size - 7, 0);
    taruhSejajar(m, versi); taruhTiming(m);
    cadangkanFormat(m); cadangkanVersi(m, versi);

    /* tempat data: kolom berpasangan dari kanan, zigzag, lewati kolom 6 */
    var kerangka = m.map(function (r) { return r.slice(); });
    var idx = 0, naik = true;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col = 5;
      for (var s = 0; s < size; s++) {
        var row = naik ? size - 1 - s : s;
        for (var dc = 0; dc < 2; dc++) {
          var cc = col - dc;
          if (kerangka[row][cc] !== null) continue;
          m[row][cc] = idx < bit.length ? bit[idx] : 0;
          idx++;
        }
      }
      naik = !naik;
    }

    /* pilih mask dengan denda terkecil */
    var terbaik = null, dendaTerbaik = Infinity;
    for (var mk = 0; mk < 8; mk++) {
      var cand = m.map(function (r) { return r.slice(); });
      for (i = 0; i < size; i++) for (j = 0; j < size; j++)
        if (kerangka[i][j] === null && maskFn(mk, i, j)) cand[i][j] ^= 1;
      tulisFormat(cand, mk); tulisVersi(cand, versi);
      var sk = denda(cand);
      if (sk < dendaTerbaik) { dendaTerbaik = sk; terbaik = cand; }
    }
    return terbaik;
  }

  /* ---------------- SVG ---------------- */
  function svg(teks, opsi) {
    var o = opsi || {}, tepi = o.margin === undefined ? 2 : o.margin;
    var m = matriks(teks), size = m.length, total = size + tepi * 2;
    var jalur = '';
    for (var i = 0; i < size; i++) for (var j = 0; j < size; j++)
      if (m[i][j]) jalur += 'M' + (j + tepi) + ' ' + (i + tepi) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" ' +
      'shape-rendering="crispEdges" role="img" aria-label="Kode QR alamat sesi">' +
      '<rect width="' + total + '" height="' + total + '" fill="#fff"/>' +
      '<path d="' + jalur + '" fill="#000"/></svg>';
  }

  global.AJIQR = { matriks: matriks, svg: svg };
})(typeof window !== 'undefined' ? window : globalThis);
