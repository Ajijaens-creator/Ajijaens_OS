/* ================================================================
   HALAMAN — papan · kalender · daftar · tim · arsip
   ================================================================ */
let CUR = 'board';
const VIEWS = {};
const NAV = [
  ['board','Papan Pipeline','layers'],
  ['cal','Kalender Tayang','calendar'],
  ['list','Semua Konten','doc'],
  ['team','Tim','users'],
  ['arsip','Arsip','shield']
];

function go(id){
  CUR = VIEWS[id] ? id : 'board';
  document.querySelectorAll('.nav-i').forEach(b => b.classList.toggle('on', b.dataset.v === CUR));
  document.getElementById('view').innerHTML = VIEWS[CUR]();
  document.getElementById('sidebar').classList.remove('on');
  document.getElementById('scrim').classList.remove('on');
  window.scrollTo(0,0);
}
function renderNav(){
  document.getElementById('nav').innerHTML = NAV.map(([id,n,icn]) =>
    `<button class="nav-i" data-v="${id}" onclick="go('${id}')">${ic(icn)}<span>${n}</span></button>`).join('');
}

const kpiRow = items => `<div class="g g4" style="margin-bottom:18px">${items.map(s => `
  <div class="card"><div class="kpi">
    <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
    <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}</div>`;

const lateCnt = () => recs('CNT').filter(c => c.date && c.date < todayISO() && c.status !== 'Tayang' && c.status !== 'Dibatalkan');

function pageHead(title, sub, actions){
  return `<div class="page-h">
    <div><h1>${title}</h1><p>${sub}</p></div>
    <div class="sp">${actions||''}</div></div>` + scopeBar();
}

/* Pernyataan lingkup — selalu terlihat, bukan di halaman "tentang" */
function scopeBar(){
  return `<div class="statebar" style="margin-bottom:18px">
    <span class="dbadge" style="background:var(--teal)">RUANG KERJA TIM</span>
    <div style="flex:1;min-width:240px">Ruang ini berisi <b>konten saja</b>. Ia terpisah penuh dari AJI JAENS OS —
      tidak ada data keluarga, keuangan, kesehatan, keputusan, atau kontak pribadi di sini, bukan disembunyikan tapi memang tidak ada.
      Pertukaran dengan OS pribadi lewat ekspor CSV.</div>
    <button class="btn ghost sm" onclick="whoDialog()">${ic('users')} ${h(WHO || 'Siapa Anda?')}</button>
  </div>`;
}

/* ---------------- siapa yang memakai ---------------- */
function whoDialog(){
  modal('Siapa yang sedang bekerja?', 'Nama ini dipakai sebagai penulis perubahan di linimasa.',
    `<div class="statebar" style="margin:0 0 14px">
       <span class="dbadge" style="background:var(--orange)">PERLU JUJUR</span>
       <div style="flex:1;min-width:220px">Ini <b>bukan login</b> dan bukan pengamanan. Siapa pun yang punya tautan halaman ini
         bisa membuka dan mengubah isinya, serta bisa mengetik nama siapa saja di sini. Gunanya hanya supaya linimasa
         terbaca: siapa menggeser apa, kapan.</div>
     </div>
     <div class="frm"><div class="fld full"><label>Nama Anda</label>
       <input id="whoIn" type="text" value="${h(WHO)}" placeholder="Kadek Ayu" autocomplete="name">
       <span class="fhint">Tersimpan di peramban ini saja — tiap orang menyetelnya sendiri di perangkatnya.</span></div></div>`,
    `<button class="btn solid" onclick="saveWho()">Simpan</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>`);
}
function saveWho(){
  const v = (document.getElementById('whoIn').value || '').trim();
  WHO = v; try{ localStorage.setItem(WHO_KEY, v); }catch(e){}
  closeModal(); toast(v ? 'Halo, ' + v : 'Nama dikosongkan'); go(CUR);
}

/* ================================================================ */
VIEWS.board = () => {
  const all = recs('CNT'), late = lateCnt(), T = todayISO();
  const wk = all.filter(c => c.status === 'Terjadwal' && c.date && c.date >= T && c.date <= shiftISO(T,7));
  const pub30 = all.filter(c => c.status === 'Tayang' && c.date && daysBetween(c.date,T) >= 0 && daysBetween(c.date,T) <= 30);
  const head = pageHead('Papan Pipeline', 'Dari ide sampai tayang — geser kartunya, statusnya ikut berubah.',
    `<button class="btn gold sm" onclick="openForm('CNT')">${ic('plus')} Konten</button>
     <button class="btn ghost sm" onclick="exportCSV('CNT')">${ic('doc')} Ekspor CSV</button>`);

  if(!all.length) return head + `<div class="card" style="text-align:center;padding:48px 26px">
    <div style="width:62px;height:62px;border-radius:19px;background:var(--pink-t);color:var(--pink);display:grid;place-items:center;margin:0 auto 16px">
      <span style="display:block;width:29px;height:29px">${ic('mega')}</span></div>
    <h2 style="font-family:var(--fd);font-size:24px;font-weight:600;margin:0 0 8px">Papan masih kosong</h2>
    <p class="sub" style="max-width:460px;margin:0 auto 20px">Mulai dari satu ide. Begitu kartunya ada, papan ini jadi tempat
      seluruh tim melihat konten mana yang sedang di tangan siapa.</p>
    <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
      <button class="btn solid" onclick="openForm('CNT')">${ic('plus')} Konten pertama</button>
      <button class="btn gold" onclick="openForm('TIM')">${ic('users')} Tambah anggota tim</button></div></div>`;

  return head + kpiRow([
    ['Total konten', all.length, 'pink','mega'],
    ['Lewat tanggal', late.length, late.length?'red':'gray','flag'],
    ['Terjadwal 7 hari', wk.length, 'purple','clock'],
    ['Tayang 30 hari', pub30.length, 'green','check']
  ]) + (late.length ? `<div class="statebar del" style="margin-bottom:18px">
    <span class="dbadge" style="background:var(--red)">PERLU DIKEJAR</span>
    <div style="flex:1;min-width:240px">${late.length} konten sudah lewat tanggal tayang dan belum tayang:
      ${late.slice(0,3).map(c => h(c.n)).join(' · ')}${late.length>3?' …':''}</div></div>` : '') + `

  <div class="card" style="margin-bottom:18px">
    ${cardH('layers','Papan pipeline','pink',`<span class="mini">${all.length} kartu</span>`)}
    <p class="kan-hint">${ic('arrow')} Geser kartu antar kolom untuk mengubah <b>status</b>.
      Di ponsel: tahan sebentar sampai kartu terangkat. Tanpa tetikus: <kbd>Tab</kbd> ke kartu,
      <kbd>Enter</kbd> mengangkat, <kbd>←</kbd> <kbd>→</kbd> memilih kolom, <kbd>Enter</kbd> melepas, <kbd>Esc</kbd> batal.</p>
    ${boardHTML()}
    <div class="card-f"><span class="mini">Urutan di dalam kolom mengikuti tanggal tayang, bukan posisi geseran.
      Yang disimpan dari geseran adalah perpindahan kolomnya, dan itu tercatat di linimasa konten.</span></div>
  </div>`;
};

/* ================================================================ */
let CAL_M = todayISO().slice(0,7);
function calShift(n){
  const [y,m] = CAL_M.split('-').map(Number);
  const d = new Date(Date.UTC(y, m-1+n, 1));
  CAL_M = d.toISOString().slice(0,7); go('cal');
}
VIEWS.cal = () => {
  const [y,m] = CAL_M.split('-').map(Number);
  const first = new Date(Date.UTC(y, m-1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;  /* Senin = 0 */
  const byDay = {};
  recs('CNT').forEach(c => { if(c.date && c.date.slice(0,7) === CAL_M) (byDay[c.date] = byDay[c.date] || []).push(c); });
  const monthName = first.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  const cells = [];
  for(let i=0;i<lead;i++) cells.push('<div class="cal-c cal-x"></div>');
  for(let d=1; d<=days; d++){
    const iso = CAL_M + '-' + String(d).padStart(2,'0');
    const list = byDay[iso] || [];
    cells.push(`<div class="cal-c${iso===todayISO()?' cal-now':''}">
      <span class="cal-d">${d}</span>
      ${list.map(c => `<button class="cal-i" style="background:${CT(CNT_COLOR[c.status]||'gray')};color:${CV(CNT_COLOR[c.status]||'gray')}"
          onclick="recDetail('${c.id}')" title="${h(c.n)} — ${h(c.status)}">${h(c.n)}</button>`).join('')}
    </div>`);
  }
  const total = Object.keys(byDay).reduce((s,k) => s + byDay[k].length, 0);
  return pageHead('Kalender Tayang', 'Konten yang punya tanggal — supaya terlihat kapan menumpuk dan kapan kosong.',
    `<button class="btn gold sm" onclick="openForm('CNT')">${ic('plus')} Konten</button>`) + `
  <div class="card">
    ${cardH('calendar', h(monthName), 'purple',
      `<span class="mini">${total} konten</span>
       <button class="btn ghost sm" style="margin-left:9px" onclick="calShift(-1)">← Bulan lalu</button>
       <button class="btn ghost sm" onclick="calShift(1)">Bulan depan →</button>`)}
    <div class="cal-hd">${['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d=>`<span>${d}</span>`).join('')}</div>
    <div class="cal">${cells.join('')}</div>
    <div class="card-f"><span class="mini">Konten tanpa tanggal tayang tidak muncul di sini — bukan hilang, memang belum dijadwalkan.
      Lihat semuanya di tab Semua Konten.</span></div>
  </div>`;
};

/* ================================================================ */
let LF = { q:'', ch:'', pil:'', own:'', st:'' };
function lfSet(k,v){ LF[k] = v; go('list'); }
VIEWS.list = () => {
  let list = recs('CNT');
  if(LF.q){ const q = LF.q.toLowerCase();
    list = list.filter(c => ((c.n||'')+(c.brief||'')+(c.notes||'')).toLowerCase().includes(q)); }
  if(LF.ch)  list = list.filter(c => c.channel === LF.ch);
  if(LF.pil) list = list.filter(c => c.pillar === LF.pil);
  if(LF.own) list = list.filter(c => c.owner === LF.own);
  if(LF.st)  list = list.filter(c => c.status === LF.st);
  list = list.slice().sort((a,b) => String(b.date||'0000').localeCompare(String(a.date||'0000')));
  const sel = (k,opts,ph) => `<select onchange="lfSet('${k}',this.value)"
      style="border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:6px 10px;font:inherit;font-size:12.5px;max-width:190px">
      <option value="">${ph}</option>${opts.map(o => `<option value="${h(o[0])}"${LF[k]===o[0]?' selected':''}>${h(o[1])}</option>`).join('')}</select>`;

  return pageHead('Semua Konten', 'Seluruh konten, termasuk yang belum punya tanggal.',
    `<button class="btn gold sm" onclick="openForm('CNT')">${ic('plus')} Konten</button>
     <button class="btn ghost sm" onclick="exportCSV('CNT')">${ic('doc')} Ekspor CSV</button>`) + `
  <div class="card">
    ${cardH('doc','Daftar konten','blue',`<span class="mini">menampilkan <b>${list.length}</b> dari ${recs('CNT').length}</span>`)}
    <div class="flexr" style="gap:8px;margin-bottom:14px">
      <input type="text" value="${h(LF.q)}" placeholder="Cari judul, pesan utama, catatan…" oninput="LF.q=this.value;go('list')"
        style="flex:1;min-width:170px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:7px 11px;font:inherit;font-size:13px;outline:0">
      ${sel('st',  CNT_ST.map(s=>[s,s]), 'Semua status')}
      ${sel('ch',  CHANNELS.map(s=>[s,s]), 'Semua kanal')}
      ${sel('pil', PILLARS.map(s=>[s,s]), 'Semua pilar')}
      ${sel('own', recs('TIM').map(p=>[p.id,p.n]), 'Semua penanggung jawab')}
      ${(LF.q||LF.ch||LF.pil||LF.own||LF.st) ? `<button class="btn ghost sm" onclick="LF={q:'',ch:'',pil:'',own:'',st:''};go('list')">Bersihkan</button>` : ''}
    </div>
    ${list.length ? `<div style="overflow-x:auto"><table class="tbl"><thead><tr>
      <th>Judul</th><th>Kanal</th><th>Status</th><th>Tayang</th><th>Penanggung jawab</th></tr></thead>
      <tbody>${list.map(c => { const late = c.date && c.date < todayISO() && c.status !== 'Tayang' && c.status !== 'Dibatalkan';
        return `<tr onclick="recDetail('${c.id}')">
          <td><b>${h(c.n)}</b><div class="mini">${h(c.pillar||'tanpa pilar')}</div></td>
          <td class="mini">${h(c.channel||'—')}</td>
          <td><span class="pill ${CNT_COLOR[c.status]||'gray'}">${h(c.status||'—')}</span></td>
          <td class="mini">${c.date ? (late?`<span style="color:var(--red)">${h(dOnly(c.date))}</span>`:h(dOnly(c.date))) : '—'}</td>
          <td class="mini">${c.owner ? h(ownerName(c.owner)) : '<span style="color:var(--orange)">belum ada</span>'}</td>
        </tr>`; }).join('')}</tbody></table></div>`
      : `<p class="empty">Tidak ada konten yang cocok dengan saringan ini.</p>`}
  </div>`;
};

/* ================================================================ */
VIEWS.team = () => {
  const team = recs('TIM'), all = recs('CNT');
  const openSt = ['Ide','Draft','Menunggu review','Revisi','Terjadwal'];
  const load = team.map(p => {
    const mine = all.filter(c => c.owner === p.id);
    return { p, n: mine.length, open: mine.filter(c => openSt.indexOf(c.status) >= 0).length,
      late: mine.filter(c => c.date && c.date < todayISO() && c.status !== 'Tayang' && c.status !== 'Dibatalkan').length };
  }).sort((a,b) => b.open - a.open);
  const noOwner = all.filter(c => !c.owner).length;
  const max = Math.max(1, ...load.map(x => x.n));

  return pageHead('Tim', 'Siapa memikul apa — dihitung dari konten yang menunjuk namanya.',
    `<button class="btn gold sm" onclick="openForm('TIM')">${ic('plus')} Anggota tim</button>`) +
    (!team.length ? `<div class="card" style="text-align:center;padding:44px 26px">
      <div style="width:58px;height:58px;border-radius:17px;background:var(--teal-t);color:var(--teal);display:grid;place-items:center;margin:0 auto 15px">
        <span style="display:block;width:27px;height:27px">${ic('users')}</span></div>
      <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Belum ada anggota tim</h2>
      <p class="sub" style="max-width:430px;margin:0 auto 18px">Tambahkan nama dulu, baru konten bisa ditugaskan ke orangnya.</p>
      <button class="btn solid" onclick="openForm('TIM')">${ic('plus')} Anggota pertama</button></div>`
    : (noOwner ? `<div class="statebar" style="margin-bottom:18px">
        <span class="dbadge" style="background:var(--orange)">BELUM DITUGASKAN</span>
        <div style="flex:1;min-width:240px">${noOwner} konten belum punya penanggung jawab. Pekerjaan tanpa nama biasanya tidak bergerak.</div>
      </div>` : '') + `
    <div class="card" style="margin-bottom:18px">
      ${cardH('users','Beban per orang','teal',`<span class="mini">${team.length} orang</span>`)}
      ${load.map(x => `<div class="wl" style="cursor:pointer" onclick="LF={q:'',ch:'',pil:'',own:'${x.p.id}',st:''};go('list')">
        <span class="wn">${h(x.p.n)}<div class="mini">${h(x.p.role||'')}</div></span>
        <span class="wb"><i style="width:${Math.round(x.open/max*100)}%;background:var(--blue)"></i>
          <i style="width:${Math.round((x.n-x.open)/max*100)}%;background:var(--green)"></i></span>
        <span class="wv">${x.open} berjalan${x.late?` · <b style="color:var(--red)">${x.late} telat</b>`:''}</span>
      </div>`).join('')}
      <div class="card-f"><span class="mini">Biru = sedang dikerjakan · hijau = sudah tayang atau batal.
        Angka ini dihitung dari kartu, bukan diketik manual.</span></div>
    </div>
    <div class="card">
      ${cardH('doc','Daftar anggota','gray',`<button class="btn ghost sm" onclick="exportCSV('TIM')">Ekspor CSV</button>`)}
      <div class="rows">${team.map(p => `
        <div class="row-i" onclick="recDetail('${p.id}')">
          <span class="avatar sm">${h((p.n||'?').slice(0,2).toUpperCase())}</span>
          <span style="min-width:0;flex:1"><span class="t">${h(p.n)}</span><span class="s">${h(p.role||'')}${p.note?' · '+h(p.note):''}</span></span>
          <span class="rt">${idPill(p.id)}</span></div>`).join('')}</div>
    </div>`);
};

/* ================================================================ */
VIEWS.arsip = () => {
  const items = SCH_ORDER.flatMap(t => arcRecs(t));
  return pageHead('Arsip', 'Yang diarsipkan tidak dihapus — hanya disingkirkan dari papan dan daftar.', '') + `
  <div class="card">
    ${cardH('shield','Record terarsip','orange',`<span class="cnt">${items.length}</span>`)}
    ${items.length ? `<div class="rows">${items.map(r => `
      <div class="row-i">
        <span class="pill gray">${h(SCHEMA[typeOf(r)].n)}</span>
        <span style="min-width:0;flex:1" onclick="recDetail('${r.id}')">
          <span class="t">${h(SCHEMA[typeOf(r)].t(r))}</span>
          <span class="s">diarsipkan ${h(dtID(r._m.updated_at))} oleh ${h(r._m.updated_by||'—')}</span></span>
        <span class="rt"><button class="btn ghost sm" onclick="restoreRec('${r.id}')">Pulihkan</button></span>
      </div>`).join('')}</div>`
      : `<p class="empty">Belum ada yang diarsipkan.</p>`}
  </div>`;
};
