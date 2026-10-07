/* ================================================================
   FINANCE · SOCIAL MOVEMENT · DASHBOARD · OPERATIONS
   Tiga modul terakhir berpindah ke data asli, dan Dashboard berhenti
   menjadi tampilan contoh — ia sekarang membaca seluruh modul.
   ================================================================ */

/* ================================================================
   ⑭ FINANCE & WEALTH — catatan pribadi, bukan pembukuan
   ================================================================ */
const rp = v => 'Rp ' + Number(v || 0).toLocaleString('id-ID') + ' Jt';
function finStats(){
  const T = todayISO(), y = T.slice(0,4);
  const tx = recs('TXN'), as = recs('AST');
  const num = v => Number(v) || 0;
  const inN  = tx.filter(t => t.dir === 'Masuk'), outN = tx.filter(t => t.dir === 'Keluar');
  const sum = a => a.reduce((s,t) => s + num(t.amount), 0);
  const m30 = tx.filter(t => t.date && daysBetween(t.date, T) <= 30 && t.date <= T);
  const byCat = {}, byMonth = {};
  tx.forEach(t => {
    const k = t.cat || 'Tanpa kategori';
    byCat[k] = (byCat[k] || 0) + (t.dir === 'Keluar' ? num(t.amount) : 0);
    if(t.date){ const mk = t.date.slice(0,7);
      byMonth[mk] = byMonth[mk] || { in:0, out:0 };
      byMonth[mk][t.dir === 'Masuk' ? 'in' : 'out'] += num(t.amount); }
  });
  const byAst = {};
  as.forEach(a => { const k = a.cat || 'Lainnya'; byAst[k] = (byAst[k] || 0) + num(a.value); });
  return { tx, as, in: sum(inN), out: sum(outN), net: sum(inN) - sum(outN),
    in30: sum(m30.filter(t => t.dir === 'Masuk')), out30: sum(m30.filter(t => t.dir === 'Keluar')),
    byCat, byMonth, byAst, astTotal: as.reduce((s,a) => s + num(a.value), 0), year: y };
}

VIEWS.finance = () => {
  const s = finStats();
  const head = liveHead('Finance &amp; Wealth',
    'Catatan keuangan pribadi dan daftar aset. Angka grup tetap bersumber dari Finance Drive.',
    `<button class="btn gold sm" onclick="openForm('TXN')">${ic('plus')} Catatan</button>
     <button class="btn ghost sm" onclick="openForm('AST')">${ic('crown')} Aset</button>
     <button class="btn ghost sm" onclick="openImport('TXN')">${ic('doc')} Impor</button>`);
  const disclaimer = `<div class="statebar" style="margin:0 0 18px">
    <span class="dbadge" style="background:var(--blue)">BATAS MODUL INI</span>
    <div style="flex:1;min-width:240px">Ini <b>catatan pribadi</b>, bukan pembukuan dan bukan pengganti laporan akuntan.
      Revenue, laba, kas, dan piutang grup tetap dibaca dari laporan konsolidasi di Finance Drive — ditampilkan di bawah dengan penanda
      <span class="pill green">SOURCE_REFERENCE</span>. Dua angka itu sengaja tidak dijumlahkan supaya tidak ada versi ganda.</div>
  </div>`;

  if(!s.tx.length && !s.as.length) return head + disclaimer + emptyCard('wallet','green','Belum ada catatan pribadi',
    'Catat pemasukan dan pengeluaran pribadi, serta daftar aset beserta nilainya. Yang dicatat di sini hanya yang tidak masuk pembukuan perusahaan.',
    `<button class="btn solid" onclick="openForm('TXN')">${ic('plus')} Catatan pertama</button>
     <button class="btn gold" onclick="openForm('AST')">${ic('crown')} Aset pertama</button>`) + finRef();

  const months = Object.keys(s.byMonth).sort().slice(-6);
  const mxM = Math.max.apply(null, months.map(m => Math.max(s.byMonth[m].in, s.byMonth[m].out)).concat([1]));
  const catKeys = Object.keys(s.byCat).filter(k => s.byCat[k] > 0).sort((a,b) => s.byCat[b] - s.byCat[a]);
  const palette = ['green','blue','purple','gold','teal','pink','orange','red','gray'];
  const astKeys = Object.keys(s.byAst).sort((a,b) => s.byAst[b] - s.byAst[a]);

  return head + disclaimer + kpiRow([
    ['Masuk 30 hari', rp(s.in30), 'green','wallet'],
    ['Keluar 30 hari', rp(s.out30), 'red','flag'],
    ['Selisih tercatat', rp(s.net), s.net >= 0 ? 'green' : 'red', 'scale'],
    ['Nilai aset tercatat', rp(s.astTotal), 'gold','crown']]) + `

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('chart','Arus per bulan','green',`<span class="mini">${months.length} bulan terakhir</span>`)}
      ${months.length ? months.map(m => {
        const d = s.byMonth[m], lbl = BLN[Number(m.slice(5,7)) - 1].slice(0,3) + ' ' + m.slice(2,4);
        return `<div style="margin-bottom:11px">
          <div class="flexr" style="justify-content:space-between;margin-bottom:4px">
            <b style="font-size:12px">${lbl}</b>
            <span class="mini">masuk ${rp(d.in)} · keluar ${rp(d.out)}</span></div>
          <div style="display:flex;gap:4px;height:14px">
            <div style="flex:1;background:var(--surface-3);border-radius:5px;overflow:hidden"><i style="display:block;height:100%;width:${d.in/mxM*100}%;background:var(--green)"></i></div>
            <div style="flex:1;background:var(--surface-3);border-radius:5px;overflow:hidden"><i style="display:block;height:100%;width:${d.out/mxM*100}%;background:var(--red)"></i></div>
          </div></div>`; }).join('')
        : '<p class="sub" style="margin:0">Belum ada catatan bertanggal.</p>'}
      <div class="card-f flexr" style="gap:14px">
        <span class="mini"><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(--green);margin-right:5px"></i>masuk</span>
        <span class="mini"><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(--red);margin-right:5px"></i>keluar</span>
      </div>
    </div>
    <div class="card">
      ${cardH('scale','Pengeluaran per kategori','red')}
      ${catKeys.length ? catKeys.map(k => barLine(k, s.byCat[k], s.byCat[catKeys[0]], 'red')).join('')
        : '<p class="sub" style="margin:0">Belum ada pengeluaran tercatat.</p>'}
      <div class="card-f"><span class="mini">Satuan juta rupiah, dari kolom yang Anda isi sendiri.</span></div>
    </div>
  </div>

  ${s.as.length ? `<div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('crown','Aset tercatat','gold',`<button class="btn gold sm" onclick="openForm('AST')">${ic('plus')} Aset</button>`)}
      <div style="overflow-x:auto"><table class="tbl"><thead><tr>
        <th>Aset</th><th>Jenis</th><th>Perolehan</th><th>Lokasi</th><th style="text-align:right">Nilai</th>
      </tr></thead><tbody>${s.as.slice().sort((a,b) => (Number(b.value)||0) - (Number(a.value)||0)).map(a => `
        <tr style="cursor:pointer" onclick="recDetail('${a.id}')">
          <td><b>${h(a.n)}</b>${a.doc ? `<div class="mini">${h(a.doc)}</div>` : ''}</td>
          <td>${h(a.cat || '—')}</td>
          <td class="mini">${a.acq ? dOnly(a.acq) : '—'}</td>
          <td class="mini">${h(a.loc || '—')}</td>
          <td style="text-align:right;font-variant-numeric:tabular-nums">${a.value ? rp(a.value) : '—'}</td>
        </tr>`).join('')}</tbody></table></div>
      <div class="card-f"><span class="mini">Nilai perkiraan yang Anda isi sendiri — bukan penilaian pasar dan bukan angka akuntansi.</span></div>
    </div>
    <div class="card">
      ${cardH('layers','Sebaran aset','gold')}
      <div class="flexr" style="gap:20px;align-items:center">
        ${donut(astKeys.map((k,i) => ({ v:s.byAst[k], c:palette[i % palette.length] })), 132)}
        <div style="flex:1;min-width:140px">${astKeys.map((k,i) => `
          <div class="flexr" style="gap:8px;margin-bottom:6px;flex-wrap:nowrap">
            <span style="width:9px;height:9px;border-radius:3px;background:${CV(palette[i % palette.length])};flex:0 0 9px"></span>
            <span style="flex:1;min-width:0;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h(k)}</span>
            <b style="font-size:12px;font-variant-numeric:tabular-nums">${rp(s.byAst[k])}</b></div>`).join('')}</div>
      </div>
    </div>
  </div>` : ''}

  ${s.tx.length ? `<div class="card" style="margin-bottom:18px">
    ${cardH('wallet','Catatan terakhir','green',`<span class="cnt">${s.tx.length}</span>`)}
    <div class="rows">${s.tx.slice().sort((a,b) => (a.date||'') < (b.date||'') ? 1 : -1).slice(0,12).map(t => {
      const u = t.unit ? recById(t.unit) : null;
      return `<div class="row-i" style="align-items:flex-start" onclick="recDetail('${t.id}')">
        <span class="pill ${t.dir === 'Masuk' ? 'green' : 'red'}" style="margin-top:1px">${t.dir === 'Masuk' ? '+' : '−'} ${rp(t.amount)}</span>
        <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(t.n)}</span>
          <span class="s">${[t.date ? dOnly(t.date) : '', h(t.cat||''), u ? h(SCHEMA.BUS.t(u)) : ''].filter(Boolean).join(' · ')}</span></span>
      </div>`; }).join('')}</div>
  </div>` : ''}` + finRef();
};
function finRef(){
  return `<div class="sect" style="margin-top:30px">
    <div><h2>Angka konsolidasi grup</h2><p>Dibaca langsung dari laporan Finance Drive — tidak dientri di modul ini.</p></div>
    <div class="sp">${srcPill(true)}</div>
  </div>${FIN_BODY()}`;
}

/* ================================================================
   ⑮ SOCIAL MOVEMENT
   ================================================================ */
VIEWS.social = () => {
  const all = recs('MOV');
  const head = liveHead('Social Movement', 'Dampak, komunitas, dan kontribusi — warisan di luar bisnis.',
    `<button class="btn gold sm" onclick="openForm('MOV')">${ic('plus')} Gerakan</button>
     <button class="btn ghost sm" onclick="openImport('MOV')">${ic('doc')} Impor</button>`);
  if(!all.length) return head + emptyCard('globe','orange','Belum ada gerakan tercatat',
    'Catat inisiatif sosial beserta isu yang diangkat, mitra, dan dampaknya. Kolom penerima manfaat diisi angka yang Anda yakini benar — sistem tidak mengarangnya.',
    `<button class="btn solid" onclick="openForm('MOV')">${ic('plus')} Gerakan pertama</button>`) + demoTail(SOC_BODY);

  const running = all.filter(m => m.status === 'Berjalan');
  const ben = all.reduce((s,m) => s + (Number(m.ben) || 0), 0);
  const withBen = all.filter(m => m.ben);
  const partners = all.filter(m => m.partner).length;
  const ST_MOV = ['Ide','Persiapan','Berjalan','Selesai','Dihentikan'];
  const byStatus = {}; all.forEach(m => byStatus[m.status || 'Tanpa status'] = (byStatus[m.status || 'Tanpa status'] || 0) + 1);

  return head + kpiRow([
    ['Gerakan tercatat', all.length, 'orange','globe'],
    ['Sedang berjalan', running.length, 'green','bolt'],
    ['Penerima manfaat', ben ? ben.toLocaleString('id-ID') : '—', 'teal','users'],
    ['Punya mitra', partners, 'blue','net']]) + `

  <div class="card" style="margin-bottom:18px">
    ${cardH('globe','Gerakan','orange',`<button class="btn gold sm" onclick="openForm('MOV')">${ic('plus')} Gerakan</button>`)}
    <div class="g g2" style="margin:0">${all.slice().sort((a,b) => (a.start||'') < (b.start||'') ? 1 : -1).map(m => {
      const c = m.status === 'Berjalan' ? 'green' : m.status === 'Selesai' ? 'blue' : m.status === 'Dihentikan' ? 'gray' : 'orange';
      return `<div class="card click" style="padding:15px" onclick="recDetail('${m.id}')">
        <div class="flexr" style="gap:10px;margin-bottom:8px">
          <div class="ic" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center;flex:0 0 34px;background:${CT(c)};color:${CV(c)}">${ic('globe')}</div>
          <span style="min-width:0;flex:1"><span class="tt">${h(SCHEMA.MOV.t(m))}</span>
            <span class="ts">${h(m.cause || '—')}</span></span>
          <span class="pill ${c}">${h(m.status || '—')}</span>
        </div>
        <div class="flexr" style="gap:6px">
          ${m.ben ? `<span class="pill teal">${Number(m.ben).toLocaleString('id-ID')} penerima manfaat</span>` : '<span class="pill gray">dampak belum diangkakan</span>'}
          ${m.start ? `<span class="pill gray">mulai ${dOnly(m.start)}</span>` : ''}
          ${m.partner ? `<span class="pill blue">${h(String(m.partner).split(',')[0])}${String(m.partner).split(',').length > 1 ? ' +' + (String(m.partner).split(',').length - 1) : ''}</span>` : ''}
        </div>
        ${m.impact ? `<p class="sub" style="margin:10px 0 0;font-size:12.5px">${h(String(m.impact).slice(0,140))}${String(m.impact).length > 140 ? '…' : ''}</p>` : ''}
      </div>`; }).join('')}</div>
  </div>

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('chart','Tahap gerakan','orange')}
      ${ST_MOV.filter(k => byStatus[k]).map(k => barLine(k, byStatus[k], Math.max.apply(null, Object.values(byStatus)),
        k === 'Berjalan' ? 'green' : k === 'Selesai' ? 'blue' : k === 'Dihentikan' ? 'gray' : 'orange')).join('')}
    </div>
    <div class="card">
      ${cardH('users','Dampak yang diangkakan','teal',`<span class="mini">${withBen.length} dari ${all.length} gerakan</span>`)}
      ${withBen.length ? `<div class="rows">${withBen.slice().sort((a,b) => (Number(b.ben)||0) - (Number(a.ben)||0)).map(m => `
        <div class="row-i" onclick="recDetail('${m.id}')">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--teal);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(SCHEMA.MOV.t(m))}</span></span>
          <span class="rt"><b style="font-size:13px;font-variant-numeric:tabular-nums">${Number(m.ben).toLocaleString('id-ID')}</b></span>
        </div>`).join('')}</div>`
        : '<p class="sub" style="margin:0">Belum ada gerakan yang mengisi jumlah penerima manfaat.</p>'}
      <div class="card-f"><span class="mini">Angka ini Anda yang mengisi. Sistem tidak memperkirakan dampak sosial — itu bukan sesuatu yang pantas ditebak.</span></div>
    </div>
  </div>` + demoTail(SOC_BODY);
};

/* ================================================================
   ⑯a OPERATIONS — pandangan lintas unit
   ================================================================ */
VIEWS.operations = () => {
  const T = todayISO();
  const units = recs('BUS'), iss = recs('OPS');
  const open = typeof opsOpen === 'function' ? opsOpen() : [];
  const rits = recs('RIT').filter(r => r.unit).map(r => Object.assign({ r }, ritStat(r), { u: recById(r.unit) }));
  const head = liveHead('Operations', 'Pandangan lintas unit — kesehatan mesin operasional secara keseluruhan.',
    `<button class="btn gold sm" onclick="openForm('OPS')">${ic('plus')} Isu</button>
     <button class="btn ghost sm" onclick="go('business')">Per unit → Business Empire</button>`);
  const split = `<div class="statebar" style="margin:0 0 18px">
    <span class="dbadge" style="background:var(--blue)">PEMBAGIAN</span>
    <div style="flex:1;min-width:240px"><b>Business Empire</b> menjawab "bagaimana keadaan tiap unit".
      <b>Operations</b> menjawab "bagaimana mesinnya berjalan secara keseluruhan" — umur isu, kedisiplinan checklist, dan isu yang ditutup tanpa akar.
      Datanya sama, sudut pandangnya berbeda; tidak ada yang dientri dua kali.</div>
  </div>`;

  if(!units.length && !iss.length) return head + split + emptyCard('cog','orange','Belum ada data operasional',
    'Modul ini membaca unit, isu, dan checklist yang Anda catat di Business Empire. Begitu ada isinya, halaman ini menunjukkan pola lintas unit.',
    `<button class="btn solid" onclick="go('business')">Buka Business Empire</button>`) + demoTail(OPSV_BODY);

  const aged = open.filter(o => o.opened).map(o => ({ o, age: daysBetween(o.opened, T) })).sort((a,b) => b.age - a.age);
  const buckets = [['0–7 hari', aged.filter(x => x.age <= 7).length, 'green'],
                   ['8–30 hari', aged.filter(x => x.age > 7 && x.age <= 30).length, 'yellow'],
                   ['31–90 hari', aged.filter(x => x.age > 30 && x.age <= 90).length, 'orange'],
                   ['> 90 hari', aged.filter(x => x.age > 90).length, 'red']];
  const mxB = Math.max.apply(null, buckets.map(b => b[1]).concat([1]));
  const closedNoRoot = iss.filter(o => o.status === 'Selesai' && !o.root);
  const keepAvg = rits.filter(x => x.keep !== null);
  const avgKeep = keepAvg.length ? Math.round(keepAvg.reduce((s,x) => s + x.keep, 0) / keepAvg.length) : null;
  const byUnit = {};
  open.forEach(o => { const k = o.unit || '_none'; byUnit[k] = (byUnit[k] || 0) + 1; });
  const unitKeys = Object.keys(byUnit).sort((a,b) => byUnit[b] - byUnit[a]);

  return head + split + kpiRow([
    ['Isu terbuka lintas unit', open.length, open.length?'orange':'green','cog'],
    ['Isu tertua', aged.length ? aged[0].age + ' hari' : '—', aged.length && aged[0].age > 30 ? 'red' : 'gray','clock'],
    ['Kedisiplinan checklist', avgKeep === null ? '—' : avgKeep + '%', avgKeep === null ? 'gray' : avgKeep >= 80 ? 'green' : avgKeep >= 50 ? 'orange' : 'red','check'],
    ['Ditutup tanpa akar', closedNoRoot.length, closedNoRoot.length?'orange':'green','shield']]) + `

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('clock','Umur isu terbuka','orange',`<span class="mini">makin ke kanan makin lama menganggur</span>`)}
      ${buckets.map(b => barLine(b[0], b[1], mxB, b[2])).join('')}
      ${aged.length ? `<div class="card-f"><span class="mini">Tertua: <b>${h(aged[0].o.n)}</b> — ${aged[0].age} hari${aged[0].o.unit && recById(aged[0].o.unit) ? ' di ' + h(SCHEMA.BUS.t(recById(aged[0].o.unit))) : ''}.</span></div>` : ''}
    </div>
    <div class="card">
      ${cardH('brief','Beban isu per unit','blue')}
      ${unitKeys.length ? unitKeys.map(k => {
        const u = k === '_none' ? null : recById(k);
        return barLine(u ? SCHEMA.BUS.t(u) : 'Tanpa unit', byUnit[k], byUnit[unitKeys[0]], 'blue'); }).join('')
        : '<p class="sub" style="margin:0">Tidak ada isu terbuka di unit mana pun.</p>'}
      <div class="card-f"><span class="mini">Unit dengan isu paling banyak belum tentu unit paling bermasalah — bisa juga unit yang paling rajin mencatat.</span></div>
    </div>
  </div>

  ${rits.length ? `<div class="card" style="margin-bottom:18px">
    ${cardH('check','Kedisiplinan checklist lintas unit','gold',`<span class="mini">${rits.length} checklist di ${new Set(rits.map(x => x.r.unit)).size} unit</span>`)}
    <div style="overflow-x:auto"><table class="tbl"><thead><tr>
      <th>Checklist</th><th>Unit</th><th>Frekuensi</th><th>Status</th><th style="text-align:right">Kedisiplinan 90 hari</th><th></th>
    </tr></thead><tbody>${rits.slice().sort((a,b) => (a.keep === null ? 999 : a.keep) - (b.keep === null ? 999 : b.keep)).map(x => `
      <tr><td><b>${h(x.r.n)}</b></td>
        <td>${x.u ? h(SCHEMA.BUS.t(x.u)) : '—'}</td>
        <td class="mini">${h(x.r.freq || '—')}</td>
        <td><span class="pill ${RIT_COLOR[x.st]}">${RIT_LABEL[x.st]}</span></td>
        <td style="text-align:right;font-variant-numeric:tabular-nums;${x.keep !== null && x.keep < 50 ? 'color:var(--red);font-weight:700' : ''}">${x.keep === null ? '—' : x.keep + '%'}</td>
        <td>${x.st !== 'paused' ? `<button class="btn ghost sm" onclick="runRitme('${x.r.id}')">Jalankan</button>` : ''}</td>
      </tr>`).join('')}</tbody></table></div>
  </div>` : ''}

  ${aged.length ? `<div class="card" style="margin-bottom:18px">
    ${cardH('cog','Isu paling lama menganggur','red',`<span class="cnt">${Math.min(aged.length, 10)}</span>`)}
    <div class="rows">${aged.slice(0,10).map(x => issueRow(x.o)).join('')}</div>
  </div>` : ''}

  ${closedNoRoot.length ? `<div class="statebar" style="margin:0">
    <span class="dbadge" style="background:var(--orange)">POLA</span>
    <div style="flex:1;min-width:240px"><b>${closedNoRoot.length} isu ditutup tanpa akar masalah tertulis.</b>
      Bila isu serupa muncul lagi nanti, tidak ada catatan yang bisa dipakai untuk melihat apakah ini pengulangan.</div>
  </div>` : ''}` + demoTail(OPSV_BODY, 'Tampilan contoh', 'Skor kesehatan unit contoh di bawah ini belum memakai data Anda.');
};

/* ================================================================
   ⑯b DASHBOARD — ringkasan lintas modul dari data asli
   ================================================================ */
VIEWS.dashboard = () => {
  const g = aiSignals();
  const live = aiHasData();
  const head = liveHead('Dashboard',
    live ? 'Ringkasan lintas modul dari record Anda sendiri — bukan duplikasi, hanya sinyal dan jalan pintas.'
         : 'Belum ada data asli — untuk sementara hanya menampilkan contoh.',
    `${live ? '<span class="pill green">● DATA ASLI</span>' : '<span class="pill dummy">⚠ DATA CONTOH</span>'}
     <button class="btn gold sm" onclick="morningBrief()">${ic('sun')} Briefing Pagi</button>
     <button class="btn ghost sm" onclick="go('ai')">AI Command Center</button>`);

  if(!live) return head + emptyCard('grid','blue','Dashboard menunggu data',
    'Halaman ini merangkum seluruh modul. Selama belum ada record asli, tidak ada yang bisa dirangkum — dan saya tidak akan mengisinya dengan angka karangan.',
    `<button class="btn solid" onclick="openForm('LOG')">${ic('sun')} Check-in</button>
     <button class="btn gold" onclick="openForm('TSK')">${ic('check')} Tambah tugas</button>
     <button class="btn ghost" onclick="openImport()">${ic('doc')} Impor dari Sheets</button>`) + demoTail(DSH_BODY);

  const fin = finStats();
  const nag = [
    g.lateT.length ? [g.lateT.length + ' tugas lewat tenggat', 'red', "TF={q:'',st:'late',owner:'',proj:'',pri:'',grp:'due'};PJ_TAB='tasks';go('projects')"] : null,
    g.promLate.length ? [g.promLate.length + ' janji lewat tanggalnya', 'red', "NW_TAB='due';go('network')"] : null,
    g.decDue.length ? [g.decDue.length + ' keputusan menunggu peninjauan', 'orange', "OS_TAB='dec';go('os')"] : null,
    g.ritBroken.length ? [g.ritBroken.length + ' ritme terputus', 'red', "OS_TAB='rit';go('os')"] : null,
    g.cold.length ? [g.cold.length + ' relasi mendingin', 'orange', "NW_TAB='due';go('network')"] : null,
    g.opsCrit.length ? [g.opsCrit.length + ' isu kritis terbuka', 'red', "BF={unit:'',sev:'Kritis',st:'open'};BZ_TAB='iss';go('business')"] : null,
    g.cntLate.length ? [g.cntLate.length + ' konten lewat tanggal tayang', 'orange', "go('brand')"] : null,
    g.msLate.length ? [g.msLate.length + ' milestone terlewat', 'red', "PJ_TAB='ms';go('projects')"] : null
  ].filter(Boolean);

  const tile = (icn, title, color, main, sub, target) => `
    <div class="card click" onclick="${target}">
      ${cardH(icn, title, color)}
      <div class="val" style="font-size:26px">${main}</div>
      <div class="lbl">${sub}</div>
    </div>`;

  return head +
  (nag.length ? `<div class="card" style="margin-bottom:18px;border-color:var(--red)">
    ${cardH('flag','Yang menagih hari ini','red',`<span class="cnt" style="background:var(--red);color:#fff">${nag.length}</span>`)}
    <div style="display:flex;gap:8px;flex-wrap:wrap">${nag.map(x =>
      `<button class="chip" style="border-color:${CV(x[1])};color:${CV(x[1])}" onclick="${x[2]}">${x[0]} →</button>`).join('')}</div>
  </div>` : `<div class="statebar" style="margin-bottom:18px">
    <span class="dbadge" style="background:var(--green)">BERSIH</span>
    <div style="flex:1;min-width:220px">Tidak ada tugas terlambat, janji menggantung, keputusan menunggu, ritme terputus, relasi mendingin, isu kritis, konten telat, atau milestone terlewat.</div>
  </div>`) + `

  <div class="g g4" style="margin-bottom:18px">
    ${tile('sun','Hari ini','blue',
      g.log ? h(String(g.log.energy)) + '<small>/10</small>' : '—',
      g.log ? (g.log.focus ? h(String(g.log.focus).slice(0,42)) : 'sudah check-in') : 'belum check-in hari ini', "go('myday')")}
    ${tile('check','Tugas terbuka','purple', g.openT.length,
      g.lateT.length ? g.lateT.length + ' terlambat' : 'tidak ada yang terlambat', "PJ_TAB='tasks';go('projects')")}
    ${tile('net','Relasi perlu disapa','teal', g.contacts.length,
      recs('INT').length + ' interaksi tercatat', "NW_TAB='due';go('network')")}
    ${tile('brief','Isu operasional','orange', g.opsCrit.length + (typeof opsOpen === 'function' ? opsOpen().length - g.opsCrit.length : 0),
      recs('BUS').length + ' unit tercatat', "BZ_TAB='units';go('business')")}
  </div>

  <div class="g g4" style="margin-bottom:18px">
    ${tile('layers','Proyek berjalan','purple', g.projs.filter(x => x.p.status === 'Berjalan').length,
      g.projLate.length ? g.projLate.length + ' lewat target' : g.projs.length + ' proyek tercatat', "PJ_TAB='board';go('projects')")}
    ${tile('scale','Keputusan tercatat','red', recs('DEC').length,
      g.decDue.length ? g.decDue.length + ' menunggu peninjauan' : 'tidak ada yang menunggu', "OS_TAB='dec';go('os')")}
    ${tile('mega','Konten di pipeline','pink', recs('CNT').length,
      g.cntLate.length ? g.cntLate.length + ' lewat tanggal' : 'semua sesuai jadwal', "go('brand')")}
    ${tile('book','Catatan arsip','gold', recs('KNW').length,
      recs('KNW').filter(k => k.lesson).length + ' punya pelajaran', "go('knowledge')")}
  </div>

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('users','Ruang pribadi','pink')}
      <div class="rows">
        <div class="row-i" onclick="go('family')">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--pink);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Keluarga</span>
            <span class="s">${recs('FAM').length} anggota · ${g.famSoon.length ? g.famSoon.length + ' ulang tahun dalam 7 hari' : 'tidak ada ulang tahun minggu ini'}</span></span></div>
        <div class="row-i" onclick="go('travel')">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--blue);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Perjalanan</span>
            <span class="s">${g.tripNext.length ? h(SCHEMA.TRP.t(g.tripNext[0].t)) + ' — ' + relDay(g.tripNext[0].t.start).toLowerCase() : recs('TRP').length + ' perjalanan tercatat, tidak ada dalam 14 hari'}</span></span></div>
        <div class="row-i" onclick="go('wellbeing')">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--green);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Wellbeing</span>
            <span class="s">${g.energy7 !== null ? 'rata-rata energi 7 hari ' + String(g.energy7).replace('.',',') + '/10' : 'belum cukup check-in'}</span></span></div>
        <div class="row-i" onclick="go('social')">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--orange);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Social Movement</span>
            <span class="s">${recs('MOV').length} gerakan · ${recs('MOV').filter(m => m.status === 'Berjalan').length} berjalan</span></span></div>
        <div class="row-i" onclick="go('finance')">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--gold);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Finance pribadi</span>
            <span class="s">${fin.tx.length} catatan · aset tercatat ${rp(fin.astTotal)}</span></span></div>
      </div>
    </div>
    <div class="card">
      ${cardH('shield','Kelengkapan data','green')}
      <p class="sub" style="margin-bottom:12px">Dashboard ini sekuat data yang mengisinya. Modul kosong berarti bagian itu tidak bisa dirangkum.</p>
      <div style="display:flex;gap:7px;flex-wrap:wrap">${[['LOG','Check-in'],['TSK','Tugas'],['PER','Kontak'],['INT','Interaksi'],['PRO','Proyek'],['DEC','Keputusan'],
         ['RIT','Ritme'],['BUS','Unit bisnis'],['OPS','Isu'],['CNT','Konten'],['FAM','Keluarga'],['TRP','Perjalanan'],
         ['KNW','Catatan'],['MOV','Gerakan'],['TXN','Keuangan'],['AST','Aset']].map(m => {
        const n = recs(m[0]).length;
        return `<span class="chip ${n ? 'on' : ''}" style="cursor:default;${n ? '' : 'opacity:.45'}">${m[1]} · ${n}</span>`;
      }).join('')}</div>
      <div class="card-f"><span class="mini">Seluruh angka di halaman ini berasal dari record ber-<code>is_dummy = false</code> di peramban ini.</span></div>
    </div>
  </div>` + demoTail(DSH_BODY, 'Dashboard contoh', 'Kartu KPI contoh di bawah ini masih memakai data dummy.');
};

