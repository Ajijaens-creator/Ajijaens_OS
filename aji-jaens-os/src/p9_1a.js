/* ============ PHASE 1A — SYSTEM FOUNDATION · GLOBAL CREATE · GLOBAL INBOX ============ */

/* ---------------- SYSTEM FOUNDATION (halaman admin Phase 1) ---------------- */
let fTab='architecture';
const F_TABS=[['architecture','Architecture'],['sources','Data Sources'],['dictionary','Data Dictionary'],
  ['staging','Import Staging'],['dummy','Dummy Data'],['core','Core Intelligence'],
  ['perm','Permissions'],['audit','Audit'],['health','System Health']];

VIEWS.foundation = () => `
  <div class="page-h">
    <div><h1>System Foundation</h1><p>Halaman admin Phase 1 — arsitektur, sumber data, governance, dan kesehatan sistem.</p></div>
    <div class="sp"><span class="pill purple">PHASE 1 · CORE FOUNDATION</span><span class="pill red">SYSTEM_ONLY</span></div>
  </div>
  <div class="tabbar">${F_TABS.map(([k,n])=>`<button class="${fTab===k?'on':''}" onclick="fTab='${k}';go('foundation')">${n}</button>`).join('')}</div>
  <div id="fBody">${F_VIEW[fTab]()}</div>`;

const F_VIEW = {};

F_VIEW.architecture = () => `
  <div class="g g4">
    ${[['Modul aktif','15','layers','purple'],['Entity terdefinisi','23','grid','blue'],
       ['Privacy level','9','shield','red'],['Fase selesai','1A · 1B','check','green']].map(x=>
      `<div class="card kpi">${cardH(x[2],x[0],x[3])}<div class="val">${x[1]}</div></div>`).join('')}
  </div>
  <div class="g g21">
    <div class="card">${cardH('cpu','Sistem ID Global','gold')}
      <p class="sub" style="margin-bottom:12px">Setiap entity punya ID stabil yang tidak pernah dipakai ulang. Format <code style="background:var(--surface-2);padding:1px 5px;border-radius:5px">PREFIX-000001</code>.</p>
      <div class="tw"><table class="tbl"><thead><tr><th>Prefix</th><th>Entity</th><th>Jumlah record</th><th>Contoh</th></tr></thead>
      <tbody>${[['PER','Person',DB.people.length,gid('PER',DB.people,DB.people[0].id)],
        ['BUS','Business Unit',DB.units.length,gid('BUS',DB.units,DB.units[0].id)],
        ['PRO','Project',DB.projects.length,gid('PRO',DB.projects,DB.projects[0].id)],
        ['DEC','Decision',DB.decisions.length,gid('DEC',DB.decisions,DB.decisions[0].id)],
        ['KNW','Knowledge',DB.knowledge.length,gid('KNW',DB.knowledge,DB.knowledge[0].id)],
        ['TRP','Trip',DB.trips.length,gid('TRP',DB.trips,DB.trips[0].id)],
        ['FAM','Family Member',DB.family.length,gid('FAM',DB.family,DB.family[0].id)],
        ['ORG','Organization',DB.social.length,'ORG-000001'],
        ['CNT','Content',DB.content.length,'CNT-000001'],
        ['TSK','Task','—','TSK-000001'],['MTG','Meeting','—','MTG-000001'],['AST','Asset','—','AST-000001']].map(r=>
        `<tr onclick="toast('${r[1]} — prefix ${r[0]}')"><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="num">${r[2]}</td><td class="mini">${r[3]}</td></tr>`).join('')}</tbody></table></div>
      <div class="card-f mini">TSK · MTG · AST terdefinisi di schema tetapi belum punya record — dibangun di Fase 3 dan 5.</div></div>
    <div class="stack">
      <div class="card">${cardH('shield','Privacy Level','red')}
        <div class="rows">${DB.privacyLevels.map(p=>`<div class="row-i" style="cursor:default;padding:6px 8px">
          <span class="pill ${p.c}">${p.k}</span><span class="s" style="font-size:11.5px">${p.d}</span></div>`).join('')}</div>
        <div class="card-f mini">Ditegakkan di lapisan database/API — menyembunyikan di frontend bukan penegakan.</div></div>
      <div class="card">${cardH('flag','Aturan Drive','orange')}
        <div class="rows">
          <div class="row-i" style="cursor:default">${ic('check','')}<span><span class="t" style="font-size:12.5px">Drive lama READ ONLY</span><span class="s">Tidak ada move/rename/edit/delete</span></span></div>
          <div class="row-i" style="cursor:default">${ic('check','')}<span><span class="t" style="font-size:12.5px">COPY — NEVER MOVE</span><span class="s">Sumber asli tetap di lokasinya</span></span></div>
          <div class="row-i" style="cursor:default">${ic('shield','')}<span><span class="t" style="font-size:12.5px">Care Estate PROTECTED</span><span class="s">DO NOT TOUCH — SRC-000008</span></span></div>
        </div></div>
    </div>
  </div>
  <div class="card">${cardH('layers','Development Phases','purple')}
    <div class="tw"><table class="tbl"><thead><tr><th>Fase</th><th>Modul</th><th>Status</th></tr></thead>
    <tbody>${DB.phases.map(p=>`<tr onclick="toast('${p.p}: ${esc(p.m)}')"><td><b>${p.p}</b></td><td class="mini">${p.m}</td>
      <td><span class="pill ${p.c}">${p.st}</span></td></tr>`).join('')}</tbody></table></div></div>`;

F_VIEW.sources = () => `
  <div class="card">${cardH('cpu','Data Source Registry','blue',`<span class="pill blue">${DB.dataSources.length} sumber</span>`)}
    <div class="tw"><table class="tbl"><thead><tr><th>ID</th><th>Sumber</th><th>Tipe</th><th>Klasifikasi</th><th>Status</th><th>Risiko</th></tr></thead>
    <tbody>${DB.dataSources.map(s=>`<tr onclick="toast('${s.id} — ${esc(s.n)}')">
      <td>${idPill(s.id)}</td><td><b>${s.n}</b></td><td class="mini">${s.type}</td>
      <td><span class="pill ${s.cls==='PROTECTED'?'red':'green'}">${s.cls}</span></td>
      <td class="mini">${s.st}</td><td><span class="pill ${s.risk==='PROTECTED'?'red':s.risk==='MEDIUM'?'orange':'green'}">${s.risk}</span></td></tr>`).join('')}</tbody></table></div>
    <div class="card-f mini">Setiap record hasil impor menyimpan source_file_id, source_url, copied_at, dan import_batch_id — sehingga pertanyaan "data ini asalnya dari mana?" selalu bisa dijawab.</div></div>
  <div class="g g2">
    <div class="card">${cardH('flag','Integration Registry','teal')}
      <div class="rows">
        <div class="row-i" style="cursor:default"><span class="pill green">CONNECTED</span><span><span class="t" style="font-size:12.5px">Google Drive — read + write</span><span class="s">Tulis hanya di folder AJI JAENS OS</span></span></div>
        <div class="row-i" style="cursor:default"><span class="pill green">CONNECTED</span><span><span class="t" style="font-size:12.5px">Google Sheets — Finance Drive</span><span class="s">READ ONLY · P&amp;L + Balance Sheet 2026</span></span></div>
        <div class="row-i" style="cursor:default"><span class="pill orange">PLANNED</span><span><span class="t" style="font-size:12.5px">Calendar · Gmail · WhatsApp · POS</span><span class="s">Fase v1.2 dan v1.3</span></span></div>
        <div class="row-i" style="cursor:default"><span class="pill red">BLOCKED</span><span><span class="t" style="font-size:12.5px">Care Estate OS</span><span class="s">PROTECTED — tidak boleh disambungkan tanpa izin Aji</span></span></div>
      </div></div>
    <div class="card">${cardH('doc','Artefak Governance di Drive','gold')}
      <div class="rows">${['01 Data Source Registry','02 Data Dictionary','03 Data Mapping','04 Integration Registry','05 Permission Matrix','06 AI Context Rules','07 Import Logs','08 Data Migration Logs','09 Dummy Data Registry','10 Audit Trail','11 Schema Documentation','12 OS Configuration'].map(x=>
        `<div class="row-i" style="cursor:default;padding:5px 8px">${ic('check','')}<span class="t" style="font-size:12.5px;font-weight:500">${x}</span></div>`).join('')}</div>
      <div class="card-f mini">Seluruhnya berada di folder <b>00 — SYSTEM &amp; GOVERNANCE</b>.</div></div>
  </div>`;

F_VIEW.dictionary = () => `
  <div class="card">${cardH('book','Data Dictionary — Metadata Universal','purple')}
    <p class="sub" style="margin-bottom:12px">Setiap record di seluruh sistem mendukung field berikut. Tanpa ini, jejak sumber dan penegakan privasi tidak mungkin.</p>
    <div class="tw"><table class="tbl"><thead><tr><th>Field</th><th>Tipe</th><th>Wajib</th><th>Keterangan</th></tr></thead>
    <tbody>${[['created_at','timestamp','YA','Waktu record dibuat'],['updated_at','timestamp','YA','Waktu terakhir diubah'],
      ['created_by','ref PER','YA','Siapa yang membuat'],['updated_by','ref PER','YA','Siapa yang terakhir mengubah'],
      ['status','enum','YA','Status record'],
      ['source_type','enum','YA','SOURCE_REFERENCE · DUMMY · LIVE · HISTORICAL · ARCHIVED'],
      ['source_id','string','TIDAK','ID di Data Source Registry — contoh SRC-000001'],
      ['source_url','url','TIDAK','Tautan langsung ke sumber asli'],
      ['privacy_level','enum','YA','Salah satu dari 9 level'],
      ['is_dummy','boolean','YA','Wajib true untuk seluruh data hasil copy saat pengembangan'],
      ['is_archived','boolean','YA','Soft delete — record tidak dihapus permanen'],
      ['tags','array','TIDAK','Label bebas']].map(r=>
      `<tr onclick="toast('${r[0]} — ${esc(r[3])}')"><td><b style="font-family:ui-monospace,Menlo,monospace;font-size:12.5px">${r[0]}</b></td>
      <td class="mini">${r[1]}</td><td><span class="pill ${r[2]==='YA'?'red':'gray'}">${r[2]}</span></td><td class="mini">${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="card">${cardH('net','Relationship Graph','teal')}
    <p class="sub" style="margin-bottom:12px">Relasi disimpan di tabel terpisah berbentuk <code style="background:var(--surface-2);padding:1px 5px;border-radius:5px">(from_entity, from_id, relation_type, to_entity, to_id, valid_from, valid_until)</code> — bukan kolom foreign key yang menyebar.</p>
    <div class="tw"><table class="tbl"><thead><tr><th>Dari</th><th>Relasi</th><th>Ke</th></tr></thead>
    <tbody>${[['Person','works_at','Business Unit'],['Person','attends','Meeting'],['Meeting','creates','Decision'],
      ['Decision','affects','Project'],['Project','belongs_to','Business Unit'],['Document','related_to','Project'],
      ['Task','assigned_to','Person'],['Trip','contains','Meeting'],['Goal','cascades_to','Goal'],
      ['Asset','owned_by','Person | Family | Business Unit']].map(r=>
      `<tr style="cursor:default"><td><b>${r[0]}</b></td><td><span class="pill teal" style="font-family:ui-monospace,Menlo,monospace">${r[1]}</span></td><td><b>${r[2]}</b></td></tr>`).join('')}</tbody></table></div>
    <div class="card-f mini">Hindari modul terisolasi — setiap entity harus bisa ditautkan ke entity lain.</div></div>`;

F_VIEW.staging = () => `
  <div class="card" style="margin-bottom:18px">${cardH('arrow','Import Workflow','blue')}
    <div class="flexr" style="gap:8px;flex-wrap:wrap;font-size:12.5px;font-weight:600">
      ${['EXISTING DRIVE','READ ONLY','ANALYZE','COPY','90 STAGING','CLASSIFY','TRANSFORM','95 DUMMY','DEMO / TEST'].map((s,i)=>
        `<span class="pill ${i===0?'gray':i===1?'red':i<7?'blue':'orange'}">${s}</span>${i<8?'<span style="color:var(--text-3)">→</span>':''}`).join('')}
    </div>
    <div class="card-f mini"><b style="color:var(--red)">Jangan pernah mengimpor data sumber langsung ke produksi.</b> Setiap berkas melewati staging dan klasifikasi lebih dulu.</div></div>
  <div class="g g21">
    <div class="card">${cardH('doc','Antrean 90 — Import Staging','yellow',`<span class="pill green">0 item</span>`)}
      <div class="empty">Folder staging kosong.<br><span class="mini">Target: kosong setiap akhir minggu.</span></div></div>
    <div class="card">${cardH('flag','Error Handling','red')}
      <div class="rows">${[['SUCCESS','Impor berhasil penuh','green'],['PARTIAL','Sebagian berhasil — sisanya ke review','orange'],
        ['FAILED','Gagal — referensi sumber tetap disimpan','red'],['RETRY','Dicoba ulang otomatis','blue'],
        ['REVIEW_REQUIRED','Butuh keputusan manusia','purple']].map(x=>
        `<div class="row-i" style="cursor:default;padding:6px 8px"><span class="pill ${x[2]}">${x[0]}</span><span class="s" style="font-size:11.5px">${x[1]}</span></div>`).join('')}</div>
      <div class="card-f mini">Tidak pernah gagal diam-diam. Tidak pernah kehilangan data diam-diam.</div></div>
  </div>`;

F_VIEW.dummy = () => {
  const tot=DB.dummyBatches.reduce((s,b)=>s+b.recs,0);
  return `
  ${dummyControl()}
  <div class="g g4">
    ${[['Batch aktif',DB.dummyBatches.length,'layers','orange'],['Record dummy',tot,'doc','orange'],
       ['Record live','0','check','gray'],['Source reference','47','shield','green']].map(x=>
      `<div class="card kpi">${cardH(x[2],x[0],x[3])}<div class="val">${x[1]}</div></div>`).join('')}
  </div>
  <div class="card" style="margin-bottom:18px">${cardH('layers','Dummy Data Registry','orange')}
    <div class="tw"><table class="tbl"><thead><tr><th>Batch ID</th><th>Modul</th><th class="num">Record</th><th>Status</th><th></th></tr></thead>
    <tbody>${DB.dummyBatches.map(b=>`<tr>
      <td>${idPill(b.id)}</td><td><b>${b.mod}</b></td><td class="num">${b.recs}</td>
      <td><span class="pill ${b.st==='ACTIVE'?'orange':b.st==='HIDDEN'?'blue':'red'}">${b.st}</span></td>
      <td style="display:flex;gap:5px">
        <button class="btn ghost sm" onclick="event.stopPropagation();toast('Batch ${b.id} — re-import dari sumber')">Re-import</button>
        <button class="btn ghost sm" onclick="event.stopPropagation();setDummyMode('hidden')">Hide</button>
        <button class="btn ghost sm" style="color:var(--red);border-color:var(--red)" onclick="event.stopPropagation();toast('Batch ${b.id} dihapus')">Delete</button>
      </td></tr>`).join('')}</tbody></table></div></div>
  <div class="card" style="border-color:var(--red)">
    ${cardH('flag','Zona Berbahaya','red')}
    <p class="sub" style="color:var(--text)">Menghapus seluruh data dummy hanya menyentuh record dengan <code style="background:var(--surface-2);padding:1px 5px;border-radius:5px">is_dummy = true</code>.</p>
    <p class="sub" style="margin-top:8px"><b style="color:var(--text)">Tidak akan pernah menghapus:</b> sumber Google Drive asli · data produksi · Data Source Registry · pengaturan integrasi · konfigurasi sistem.</p>
    <div class="card-f flexr"><button class="btn red" onclick="deleteDummyFlow()">${ic('flag')} DELETE ALL DUMMY DATA</button>
      <button class="btn ghost" onclick="setDummyMode('show')">Pulihkan semua</button></div>
  </div>`;
};

F_VIEW.core = () => {
  const filled = new Set(DB.core.map(c=>c.dom));
  return `
  <div class="card" style="background:linear-gradient(140deg,var(--purple-t),var(--gold-tint));margin-bottom:18px">
    ${cardH('spark','Aji Core Intelligence','purple',`<span class="pill orange">Sesi ${DB.coreMeta.sessions} dari 6</span>`)}
    <p class="sub" style="color:var(--text);font-size:13.5px">Lapisan konteks yang dibaca seluruh agent. Bukan halaman biografi — ini profil kognitif dan operasional yang hidup, dan hanya diisi dari pernyataan Aji sendiri.</p>
    <div class="g g4" style="gap:12px;margin:16px 0 0">
      ${[['Item tersimpan',DB.core.length],['Domain terisi',filled.size+' / '+DB.coreMeta.domainsTotal],
         ['Confidence CONFIRMED',DB.core.filter(c=>c.conf==='CONFIRMED').length],['Menunggu konfirmasi',DB.coreObs.length]].map(x=>
        `<div class="stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('')}
    </div>
  </div>

  <div class="card" style="margin-bottom:18px">${cardH('check','Tersimpan — dari pernyataan Aji','green',`<span class="pill green">USER_STATEMENT · CONFIRMED</span>`)}
    <div class="tw"><table class="tbl"><thead><tr><th>ID</th><th>Domain</th><th>Pernyataan</th><th>Tipe</th><th>Confidence</th><th>Berlaku</th></tr></thead>
    <tbody>${DB.core.map(c=>`<tr onclick="coreDetail('${c.id}')">
      <td>${idPill(c.id)}</td>
      <td><b>${c.dom}</b><div class="mini" style="font-family:ui-monospace,Menlo,monospace">${c.sub}</div></td>
      <td style="max-width:420px">${c.st}</td>
      <td><span class="pill blue">${c.type}</span></td>
      <td><span class="pill green">${c.conf}</span></td>
      <td class="mini">${c.from}</td></tr>`).join('')}</tbody></table></div>
    <div class="card-f mini">Setiap item punya <code>valid_from</code>, <code>valid_until</code>, dan <code>superseded_by</code>. Pemikiran lama tidak pernah ditimpa.</div></div>

  <div class="card" style="margin-bottom:18px;border-color:var(--orange)">${cardH('bulb','Menunggu konfirmasi Anda','orange',`<span class="pill orange">Belum disimpan sebagai fakta</span>`)}
    <p class="sub" style="margin-bottom:14px">Dua hal yang saya perhatikan saat membandingkan jawaban Anda dengan angka Finance Drive. Keduanya <b style="color:var(--text)">belum</b> masuk Core Intelligence — sesuai aturan, inferensi AI tidak pernah disimpan sebagai fakta tanpa persetujuan Anda.</p>
    ${DB.coreObs.map(o=>`
      <div style="padding:14px;border-radius:12px;background:var(--surface-2);border:1px solid var(--border);margin-bottom:11px">
        <div class="flexr" style="margin-bottom:8px">${idPill(o.id)}
          <span class="pill ${o.type==='OBSERVATION'?'teal':'orange'}">${o.type}</span>
          <span class="pill ${o.conf==='HIGH'?'blue':'orange'}">${o.conf}</span>
          <span class="mini" style="margin-left:auto">${o.dom}</span></div>
        <div style="font-size:13.5px;line-height:1.55;margin-bottom:8px">${o.st}</div>
        <div class="mini" style="margin-bottom:4px"><b>Dasar:</b> ${o.basis}</div>
        <div class="mini" style="margin-bottom:10px"><b>Yang dibutuhkan:</b> ${o.act}</div>
        <div style="display:flex;gap:7px;flex-wrap:wrap">
          <button class="btn grn sm" onclick="toast('${o.id} disimpan ke Core Intelligence sebagai USER_STATEMENT · CONFIRMED')">${ic('check')} Simpan</button>
          <button class="btn ghost sm" onclick="toast('Buka editor — ubah kalimatnya sebelum disimpan')">Edit dulu</button>
          <button class="btn ghost sm" onclick="toast('${o.id} diabaikan — tidak disimpan')">Abaikan</button>
        </div></div>`).join('')}
  </div>

  <div class="g g2">
    <div class="card">${cardH('grid','21 Domain Konteks','gold',`<span class="pill orange">${filled.size} terisi</span>`)}
      <div style="display:flex;gap:7px;flex-wrap:wrap">${DB.coreDomains.map(d=>
        `<span class="chip ${filled.has(d)?'on':''}" onclick="toast('${filled.has(d)?'Domain '+d+' — sudah ada isinya':'Domain '+d+' menunggu wawancara'}')">${filled.has(d)?'✓ ':''}${d}</span>`).join('')}</div>
      <div class="card-f mini">Chip bertanda ✓ sudah punya isi. Sisanya menunggu sesi wawancara berikutnya.</div></div>
    <div class="card">${cardH('shield','Aturan Penyimpanan','red')}
      <div class="rows">
        <div class="row-i" style="cursor:default;align-items:flex-start">${ic('check','')}<span><span class="t" style="font-size:12.5px">Hanya dari pernyataan Aji</span><span class="s">Jawaban wawancara disimpan sebagai USER_STATEMENT dengan confidence CONFIRMED</span></span></div>
        <div class="row-i" style="cursor:default;align-items:flex-start">${ic('shield','')}<span><span class="t" style="font-size:12.5px">Inferensi AI bukan fakta</span><span class="s">Selalu ditampilkan terpisah dan butuh persetujuan sebelum disimpan</span></span></div>
        <div class="row-i" style="cursor:default;align-items:flex-start">${ic('clock','')}<span><span class="t" style="font-size:12.5px">Tidak pernah menimpa</span><span class="s">Pemikiran lama disimpan dengan valid_until dan superseded_by</span></span></div>
        <div class="row-i" style="cursor:default;align-items:flex-start">${ic('flag','')}<span><span class="t" style="font-size:12.5px">Keputusan sensitif</span><span class="s">Hanya bersandar pada confidence CONFIRMED atau HIGH</span></span></div>
      </div>
      <div class="card-f"><span class="pill red">AJI_ONLY</span></div></div>
  </div>

  <div class="card">${cardH('spark','Sisa jadwal wawancara','purple')}
    <div class="tw"><table class="tbl"><thead><tr><th>Sesi</th><th>Domain</th><th>Status</th></tr></thead>
    <tbody>${[['Sesi 1','Decision Framework · Risk Appetite','Selesai','green'],
      ['Sesi 2','Values · Leadership Philosophy','Berikutnya','orange'],
      ['Sesi 3','Communication Style · Personal Brand Voice','Menunggu','gray'],
      ['Sesi 4','Goal Hierarchy · Vision · Current Focus','Menunggu','gray'],
      ['Sesi 5','Family Philosophy · Financial Philosophy','Menunggu','gray'],
      ['Sesi 6','Personal Narrative · Legacy · Lessons Learned','Menunggu','gray']].map(r=>
      `<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="mini">${r[1]}</td><td><span class="pill ${r[3]}">${r[2]}</span></td></tr>`).join('')}</tbody></table></div>
    <div class="card-f mini">Wawancara berjalan lewat percakapan, bukan formulir. Katakan saja "lanjut 1C" untuk sesi berikutnya.</div></div>`;
};
function coreDetail(id){
  const c=DB.core.find(x=>x.id===id); if(!c)return;
  modal(c.dom, `${c.sub} · ${c.src}`,
   `<div class="flexr" style="margin-bottom:16px">${idPill(c.id)}<span class="pill blue">${c.type}</span><span class="pill green">${c.conf}</span><span class="pill red">${c.priv}</span></div>
    <p style="font-size:15px;line-height:1.6;font-family:var(--fd);color:var(--text)">"${c.st}"</p>
    <div class="sep" style="margin:16px 0"></div>
    <dl class="kv"><dt>Domain</dt><dd>${c.dom}</dd><dt>Subdomain</dt><dd>${c.sub}</dd>
      <dt>Sumber</dt><dd>${c.src}</dd><dt>Berlaku sejak</dt><dd>${c.from}</dd>
      <dt>Berlaku sampai</dt><dd>${c.until}</dd><dt>Prioritas</dt><dd>${c.pri}</dd></dl>
    <div class="mini" style="margin-top:14px">Dibaca oleh seluruh agent sebagai konteks. Jika pandangan Anda berubah, item ini tidak dihapus — versi barunya dibuat dan yang lama diberi <code>superseded_by</code>.</div>`,
   `<button class="btn gold" onclick="toast('Editor terbuka — versi baru akan dibuat, versi ini disimpan sebagai historis')">Perbarui pandangan</button>
    <button class="btn ghost" onclick="toast('Item dinonaktifkan — active = false')">Nonaktifkan</button>`);
}

F_VIEW.perm = () => `
  <div class="card" style="margin-bottom:18px">${cardH('users','Role','purple')}
    <div style="display:flex;gap:7px;flex-wrap:wrap">${DB.roles.map((r,i)=>
      `<span class="pill ${i===0?'gold':'gray'}">${r}</span>`).join('')}</div></div>
  <div class="card">${cardH('shield','Permission Matrix','red',`<span class="pill red">Ditegakkan di DB/API</span>`)}
    <div class="tw"><table class="tbl"><thead><tr><th>Modul</th><th>Default privacy</th><th>Aji</th><th>Spouse</th><th>Chief PA</th><th>CFO</th><th>COO</th><th>AI Agent</th></tr></thead>
    <tbody>${[['My Day','AJI_ONLY','FULL','—','READ','—','—','READ+CTX'],
      ['Dashboard','EXECUTIVE','FULL','—','READ','SUMMARY','SUMMARY','READ'],
      ['Knowledge','MIXED','FULL','PARTIAL','R/W','SCOPED','SCOPED','READ_SCOPED'],
      ['Wellbeing','AJI_ONLY','FULL','—','—','—','—','CONSENT'],
      ['Business Empire','BUSINESS_UNIT','FULL','—','READ','FULL','FULL','READ'],
      ['Family','FAMILY','FULL','FULL','SCOPED','—','—','CONSENT'],
      ['Network','MIXED','FULL','PARTIAL','R/W','TIER A/B','TIER A/B','READ_SCOPED'],
      ['Branding &amp; CRM','TEAM','FULL','—','R/W','—','—','READ'],
      ['Finance — bisnis','EXECUTIVE','FULL','—','—','FULL','SUMMARY','READ_SCOPED'],
      ['Finance — pribadi','AJI_ONLY','FULL','—','—','—','—','—'],
      ['Operating System','AJI_ONLY','FULL','—','READ','—','—','READ'],
      ['AI Command Center','SYSTEM_ONLY','FULL','—','READ','—','—','SELF']].map(r=>
      `<tr style="cursor:default"><td><b>${r[0]}</b></td><td><span class="pill ${r[1].includes('AJI')?'red':r[1]==='TEAM'||r[1]==='BUSINESS_UNIT'?'blue':r[1]==='FAMILY'?'pink':'gold'}">${r[1]}</span></td>
      ${r.slice(2).map(c=>`<td class="mini" style="color:${c==='FULL'?'var(--green)':c==='—'?'var(--text-3)':'var(--text-2)'}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="card-f mini">AI tunduk pada matriks yang sama dengan manusia. Tidak ada mode "AI boleh baca semua". Data AJI_ONLY hanya dibaca agent bila Anda mengaktifkannya untuk keperluan itu.</div></div>`;

F_VIEW.audit = () => `
  <div class="card" style="margin-bottom:18px">${cardH('doc','Audit Trail','blue',`<span class="pill blue">${DB.audit.length} entri terakhir</span>`)}
    <div class="tw"><table class="tbl"><thead><tr><th>Waktu</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th><th>Status</th></tr></thead>
    <tbody>${DB.audit.map(a=>`<tr onclick="toast('${a.act} — ${esc(a.eid)}')">
      <td class="mini">${a.ts}</td><td><b>${a.user}</b></td><td class="mini">${a.role}</td>
      <td><span class="pill ${a.act==='DELETE'||a.act==='DATA_DELETE'?'red':a.act==='PERMISSION_CHANGE'?'orange':a.act.startsWith('AI')?'purple':'blue'}">${a.act}</span></td>
      <td class="mini">${a.ent} · ${a.eid}</td>
      <td><span class="pill ${a.st==='SUCCESS'?'green':a.st==='PARTIAL'?'orange':'red'}">${a.st}</span></td></tr>`).join('')}</tbody></table></div></div>
  <div class="g g2">
    <div class="card">${cardH('flag','Action yang Tercatat','purple')}
      <div style="display:flex;gap:6px;flex-wrap:wrap">${['CREATE','UPDATE','DELETE','MOVE','IMPORT','EXPORT','PERMISSION_CHANGE','LOGIN','AI_ACTION','AI_RECOMMENDATION','DATA_DELETE'].map(a=>
        `<span class="pill ${a.includes('DELETE')?'red':a.startsWith('AI')?'purple':'blue'}">${a}</span>`).join('')}</div>
      <div class="card-f mini">Setiap entri menyimpan before_value dan after_value.</div></div>
    <div class="card">${cardH('shield','Soft Delete','orange')}
      <p class="sub">Record produksi memakai <code style="background:var(--surface-2);padding:1px 5px;border-radius:5px">is_archived</code>, <code style="background:var(--surface-2);padding:1px 5px;border-radius:5px">archived_at</code>, <code style="background:var(--surface-2);padding:1px 5px;border-radius:5px">archived_by</code>. Penghapusan permanen butuh otorisasi tingkat tinggi dan tercatat di audit.</p></div>
  </div>`;

F_VIEW.health = () => {
  const H=DB.health;
  return `
  <div class="g g4">
    ${[['Data sources',H.data_sources,'cpu','blue'],['Integrasi aktif',H.active_integrations,'net','green'],
       ['Record dummy',H.dummy_records,'layers','orange'],['Source reference',H.source_reference_records,'shield','green']].map(x=>
      `<div class="card kpi">${cardH(x[2],x[0],x[3])}<div class="val">${x[1]}</div></div>`).join('')}
  </div>
  <div class="g g21">
    <div class="card">${cardH('shield','Indikator Kesehatan','green')}
      <div class="rows">${[['Record live',H.live_records,'gray','Belum ada — Phase 1 masih source reference + dummy'],
        ['Record belum terklasifikasi',H.unclassified,'orange','Diarahkan ke 98 — UNSORTED / REVIEW'],
        ['Kandidat duplikat',H.duplicate_candidates,'orange','Blok Januari Balance Sheet — dua versi'],
        ['Broken link',H.broken_links,'green','Tidak ada'],
        ['Data basi',H.stale_data,'orange','Cash Flow Daily berhenti Mei 2026'],
        ['Masalah permission',H.permission_issues,'green','Tidak ada'],
        ['Konflik konteks AI',H.ai_context_conflicts,'green','Belum ada — Core Intelligence belum diisi']].map(r=>
        `<div class="row-i" style="cursor:default"><span class="pill ${r[2]}">${r[1]}</span>
        <span style="min-width:0"><span class="t" style="font-size:12.5px">${r[0]}</span><span class="s">${r[3]}</span></span></div>`).join('')}</div></div>
    <div class="card">${cardH('cpu','Environment','purple')}
      <div class="rows">
        <div class="row-i" style="cursor:default"><span class="pill green">AKTIF</span><span><span class="t" style="font-size:12.5px">DEVELOPMENT</span><span class="s">Prototipe HTML · seluruh data dummy + source reference</span></span></div>
        <div class="row-i" style="cursor:default"><span class="pill gray">BELUM</span><span><span class="t" style="font-size:12.5px">STAGING</span><span class="s">Dibangun saat backend berdiri</span></span></div>
        <div class="row-i" style="cursor:default"><span class="pill gray">BELUM</span><span><span class="t" style="font-size:12.5px">PRODUCTION</span><span class="s">Setelah arsitektur Phase 1 dikunci</span></span></div>
      </div>
      <div class="card-f mini">Prototipe saat ini memvalidasi arsitektur informasi dan UX. Penegakan permission di backend adalah pekerjaan implementasi setelah Phase 1 dikunci.</div></div>
  </div>
  <div class="card">${cardH('check','Phase 1 Acceptance Checklist','gold')}
    <div class="tw"><table class="tbl"><thead><tr><th>Kriteria</th><th>Kategori</th><th>Status</th></tr></thead>
    <tbody>${[['15 modul ada','Architecture','PASS'],['Urutan sidebar benar','Architecture','PASS'],['My Day default','Architecture','PASS'],
      ['Dashboard agregat saja','Architecture','PASS'],['Universal ID berfungsi','Data','PASS'],['Relasi antar-entity','Data','PASS'],
      ['Metadata privasi ada','Data','PASS'],['Audit logging berjalan','Data','PARTIAL'],
      ['Drive lama tidak tersentuh','Drive','PASS'],['Struktur AJI JAENS OS ada','Drive','PASS'],['Source Registry ada','Drive','PASS'],
      ['Import Staging ada','Drive','PASS'],['Dummy Data ada','Drive','PASS'],['Penghapusan batch dummy','Drive','PASS'],
      ['Domain konteks ada','Core Intelligence','FAIL'],['Fact/inference distinction','Core Intelligence','PASS'],
      ['Versi temporal','Core Intelligence','PASS'],['Agent dapat membaca konteks','Core Intelligence','FAIL'],
      ['RBAC berfungsi','Governance','PARTIAL'],['Pemisahan environment','Governance','FAIL'],
      ['Audit berfungsi','Governance','PARTIAL'],['System health ada','Governance','PASS']].map(r=>
      `<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="mini">${r[1]}</td>
      <td><span class="pill ${r[2]==='PASS'?'green':r[2]==='PARTIAL'?'orange':'red'}">${r[2]}</span></td></tr>`).join('')}</tbody></table></div>
    <div class="card-f mini"><b style="color:var(--text)">16 PASS · 3 PARTIAL · 3 FAIL.</b> Yang FAIL semuanya butuh backend nyata atau wawancara 1C — bukan sesuatu yang bisa diselesaikan di prototipe front-end.</div></div>`;
};

function deleteDummyFlow(){
  modal('Hapus Seluruh Data Dummy','Tindakan ini hanya menyentuh record dengan is_dummy = true.',
   `<div class="dummybar" style="margin-bottom:16px"><span class="dbadge">PERINGATAN</span>
      <div style="flex:1;min-width:200px">Akan menghapus <b>${DB.dummyBatches.reduce((s,b)=>s+b.recs,0)} record</b> dari ${DB.dummyBatches.length} batch di 10 modul. Layar yang datanya contoh akan menjadi kosong sampai sumber aslinya disambungkan.</div></div>
    <p class="sub"><b style="color:var(--green)">Tidak akan disentuh:</b> sumber Google Drive asli · data produksi · Data Source Registry · pengaturan integrasi · konfigurasi sistem · seluruh sistem Care Estate.</p>
    <div class="sep" style="margin:16px 0"></div>
    <div class="mini" style="font-weight:700;margin-bottom:7px">Ketik <code style="background:var(--surface-2);padding:2px 6px;border-radius:5px">DELETE DUMMY</code> untuk mengaktifkan tombol hapus</div>
    <div class="askbar"><input id="delConfirm" placeholder="DELETE DUMMY" oninput="document.getElementById('delBtn').disabled = this.value.trim()!=='DELETE DUMMY';
      document.getElementById('delBtn').style.opacity = this.value.trim()==='DELETE DUMMY'?'1':'.4'"></div>`,
   `<button class="btn ghost" onclick="closeModal()">Batal</button>
    <button class="btn red" id="delBtn" disabled style="opacity:.4;margin-left:auto" onclick="closeModal();setDummyMode('deleted')">Hapus Seluruh Data Dummy</button>`);
  setTimeout(()=>{const b=document.getElementById('delBtn'); if(b) b.disabled=true;},50);
}

/* ---------------- GLOBAL CREATE ---------------- */
const CREATE_ITEMS=[
  {n:'Task',ic:'check',c:'blue',d:'Tugas dengan owner dan deadline',p:'TSK'},
  {n:'Meeting',ic:'users',c:'teal',d:'Pertemuan — otomatis menautkan orang',p:'MTG'},
  {n:'Person',ic:'net',c:'teal',d:'Kontak baru di Network',p:'PER'},
  {n:'Note',ic:'doc',c:'purple',d:'Catatan cepat ke Knowledge',p:'KNW'},
  {n:'Idea',ic:'bulb',c:'yellow',d:'Ide mentah — masuk ke Inbox',p:'KNW'},
  {n:'Project',ic:'layers',c:'purple',d:'Proyek dengan budget dan milestone',p:'PRO'},
  {n:'Document',ic:'doc',c:'blue',d:'Dokumen atau unggahan',p:'DOC'},
  {n:'Decision',ic:'scale',c:'red',d:'Keputusan dengan opsi dan rekomendasi',p:'DEC'},
  {n:'Trip',ic:'plane',c:'blue',d:'Perjalanan dengan itinerary',p:'TRP'},
  {n:'Reminder',ic:'clock',c:'orange',d:'Pengingat waktu tertentu',p:'RMD'},
  {n:'Goal',ic:'target',c:'gold',d:'Sasaran dalam hierarki goal',p:'GOL'}
];
function openCreate(){
  const ctx = NAV.find(n=>n.id===CUR);
  modal('Tambah Baru', `Konteks saat ini: <b>${ctx?ctx.n:'System'}</b> — entity baru akan otomatis ditautkan ke sini bila relevan.`,
   `<div class="g g3" style="gap:11px;margin:0">${CREATE_ITEMS.map(x=>`
     <div class="card click" style="padding:14px" onclick="createEntity('${x.n}','${x.p}')">
       <div class="flexr" style="gap:9px;margin-bottom:6px">
         <div class="ic" style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:${CT(x.c)};color:${CV(x.c)};flex:0 0 30px">${ic(x.ic)}</div>
         <b style="font-size:14px">${x.n}</b></div>
       <p class="sub" style="margin:0;font-size:12px">${x.d}</p>
       <div class="mini" style="margin-top:7px;font-family:ui-monospace,Menlo,monospace">${x.p}-</div>
     </div>`).join('')}</div>`,
   `<span class="mini" style="align-self:center">Setiap entity baru otomatis mendapat ID global, metadata universal, dan privacy level default.</span>`,true);
}
function createEntity(name,prefix){
  closeModal();
  const ctx = NAV.find(n=>n.id===CUR);
  toast(`${name} baru dibuat — ${prefix}-${String(Math.floor(Math.random()*900)+100).padStart(6,'0')} · ditautkan ke ${ctx?ctx.n:'System'} · is_dummy = true`);
}

/* ---------------- GLOBAL INBOX ---------------- */
const INBOX_ST=['NEW','REVIEW','ROUTED','ACTIONED','ARCHIVED'];
function openInbox(){ renderInbox(); document.getElementById('inboxDr').classList.add('on'); }
const closeInbox=()=>document.getElementById('inboxDr').classList.remove('on');
function renderInbox(){
  const el=document.getElementById('inboxB');
  el.innerHTML = INBOX_ST.map(st=>{
    const items=DB.inbox.filter(i=>i.st===st); if(!items.length) return '';
    return `<div class="pal-g">${st} · ${items.length}</div>` + items.map(i=>`
      <div class="row-i" style="align-items:flex-start" onclick="routeInbox('${i.id}')">
        <span class="pill ${i.c}" style="margin-top:2px">${i.type}</span>
        <span style="min-width:0"><span class="t" style="font-size:13px">${i.t}</span><span class="s">${i.src} · ${i.d}</span></span>
      </div>`).join('');
  }).join('') + `<div style="padding:14px 8px"><div class="mini">Status bergerak: NEW → REVIEW → ROUTED → ACTIONED → ARCHIVED. Kosongkan antrean NEW setiap Weekly Review.</div></div>`;
  const c=document.getElementById('inboxCount'); if(c) c.textContent=DB.inbox.filter(i=>i.st==='NEW'||i.st==='REVIEW').length;
}
function routeInbox(id){
  const it=DB.inbox.find(x=>x.id===id); if(!it)return;
  modal(it.t, `${it.type} · ${it.src} · ${it.d}`,
   `<dl class="kv"><dt>Status</dt><dd><span class="pill ${it.c}">${it.st}</span></dd>
      <dt>Sumber</dt><dd>${it.src}</dd><dt>Klasifikasi</dt><dd><span class="pill orange">DUMMY</span></dd>
      <dt>Privacy</dt><dd><span class="pill blue">TEAM</span></dd></dl>
    <div class="sep" style="margin:16px 0"></div>
    <div class="card-h"><h3>Rute ke modul</h3></div>
    <div style="display:flex;gap:7px;flex-wrap:wrap">${NAV.slice(2).map(n=>
      `<button class="chip" onclick="closeModal();closeInbox();go('${n.id}');toast('Dirutekan ke ${n.n} — status ROUTED')">${n.n}</button>`).join('')}</div>`,
   `<button class="btn grn" onclick="closeModal();toast('Ditandai ACTIONED')">${ic('check')} Actioned</button>
    <button class="btn ghost" onclick="closeModal();toast('Diarsipkan ke 99 — OS ARCHIVE')">Arsipkan</button>
    <button class="btn red" style="margin-left:auto" onclick="closeModal();toast('Dipindahkan ke 98 — UNSORTED / REVIEW')">Belum jelas → 98</button>`);
}
function captureInbox(){
  const i=document.getElementById('inboxIn'); const v=(i.value||'').trim(); if(!v)return;
  DB.inbox.unshift({id:'in'+Date.now(), t:v, src:'Quick capture', type:'Note', st:'NEW', d:'Baru saja', c:'yellow'});
  i.value=''; renderInbox(); toast('Tertangkap ke Inbox — belum dirutekan');
}

