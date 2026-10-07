/* ================================================================
   AI CHIEF OF STAFF — dibangun di atas record asli Anda
   Tidak ada jawaban yang dikarang: setiap angka di sini dihitung dari
   record yang Anda entri sendiri, dan sumbernya selalu disebutkan.
   Bila datanya belum ada, sistem mengatakan begitu — bukan menebak.
   ================================================================ */

/* ---------------- pengumpul sinyal ---------------- */
function aiHasData(){
  return ['LOG','TSK','MTG','PER','INT','PRO','MLS','DEC','RIT','GOL','KNW','BUS','OPS','CNT','FAM','EVT','TRP'].some(t => recs(t).length);
}
function aiSignals(){
  const T = todayISO();
  const openT = openTsk();
  const projs = recs('PRO').map(p => Object.assign({ p }, projStats(p)));
  const rits  = recs('RIT').map(r => Object.assign({ r }, ritStat(r)));
  const logs7 = recs('LOG').filter(l => l.date && daysBetween(l.date, T) <= 7 && l.date <= T);
  const prom  = promises();
  const lastLog = recs('LOG').map(l => l.date).filter(Boolean).sort().pop();
  return {
    T,
    log: logFor(T), lastLog,
    sinceLog: lastLog ? daysBetween(lastLog, T) : null,
    energy7: logs7.length ? Math.round(logs7.reduce((s,l) => s + (Number(l.energy)||0), 0) / logs7.length * 10) / 10 : null,
    nLog7: logs7.length,
    openT, lateT: openT.filter(t => t.due && t.due < T), dueT: openT.filter(t => t.due === T),
    noOwnerT: openT.filter(t => !t.owner), p1: openT.filter(t => t.pri && t.pri.indexOf('P1') === 0),
    done7: recs('TSK').filter(t => t.status === 'Selesai' && t.done && daysBetween(t.done, T) <= 7),
    mtg: mtgFor(T),
    projs, projLate: projs.filter(x => x.overdue), projRisk: projs.filter(x => x.late > 0),
    projStall: projs.filter(x => x.p.status === 'Berjalan' && x.n === 0),
    msLate: recs('MLS').filter(m => m.status === 'Belum tercapai' && m.date && m.date < T),
    contacts: dueContacts(), cold: dueContacts().filter(x => x.st === 'cold'),
    prom, promLate: prom.filter(i => i.nextDate && i.nextDate < T),
    decDue: decNeedsReview(), decNoAssume: recs('DEC').filter(d => !d.assume),
    rits, ritBroken: rits.filter(x => x.st === 'broken'), ritDue: rits.filter(x => x.st === 'due'),
    wl: workload(), goals: recs('GOL'), goalsLate: recs('GOL').filter(g => g.status === 'Tertinggal'),
    cntLate: (typeof cntLate === 'function' ? cntLate() : []),
    opsCrit: (typeof opsOpen === 'function' ? opsOpen().filter(o => o.sev === 'Kritis') : []),
    famSoon: recs('FAM').filter(x => x.dob).map(x => Object.assign({ f:x }, nextAnniv(x.dob) || {}))
              .filter(x => x.inDays !== undefined && x.inDays <= 7),
    tripNext: recs('TRP').map(x => Object.assign({ t:x }, tripStat(x)))
              .filter(x => x.upcoming && x.inDays <= 14).sort((a,b) => a.inDays - b.inDays)
  };
}
const nOr = (n, one, many) => n + ' ' + (many || one);

/* ---------------- kartu insight ---------------- */
/* type: FACT   = dihitung langsung dari record Anda
   type: INFER  = tafsiran saya atas angka itu — boleh Anda tolak */
function aiInsights(){
  const s = aiSignals(), out = [];
  const add = (type, conf, c, title, body, act, go_) => out.push({ type, conf, c, title, body, act, go: go_ });

  if(s.lateT.length){
    const oldest = s.lateT.slice().sort((a,b) => a.due < b.due ? -1 : 1)[0];
    add('FACT','CONFIRMED','red', nOr(s.lateT.length,'tugas') + ' lewat tenggat',
      `Tertua: "${h(oldest.n)}" — terlambat ${daysBetween(oldest.due, s.T)} hari.`,
      'Buka papan tugas', "TF={q:'',st:'late',owner:'',proj:'',pri:'',grp:'due'};PJ_TAB='tasks';go('projects')");
  }
  if(s.promLate.length){
    const p0 = s.promLate[0], per = p0.per ? recById(p0.per) : null;
    add('FACT','CONFIRMED','red', nOr(s.promLate.length,'janji') + ' lewat tanggalnya',
      `Yang tertua: "${h(p0.next)}"${per ? ' kepada ' + h(SCHEMA.PER.t(per)) : ''} — ${daysBetween(p0.nextDate, s.T)} hari lalu.`,
      'Buka Network', "NW_TAB='due';go('network')");
  }
  if(s.decDue.length){
    add('FACT','CONFIRMED','orange', nOr(s.decDue.length,'keputusan') + ' menunggu peninjauan',
      `Yang paling lama: "${h(s.decDue[0].n)}" — jadwal tinjauan ${dOnly(s.decDue[0].review)}.`,
      'Tinjau sekarang', `reviewDec('${s.decDue[0].id}')`);
  }
  if(s.ritBroken.length){
    add('FACT','CONFIRMED','red', nOr(s.ritBroken.length,'ritme') + ' terputus',
      s.ritBroken.map(x => `${h(x.r.n)} (lewat ${x.over} hari)`).join(' · '),
      'Buka Ritme', "OS_TAB='rit';go('os')");
  }
  if(s.cold.length){
    add('FACT','CONFIRMED','orange', nOr(s.cold.length,'relasi') + ' mendingin',
      s.cold.slice(0,3).map(x => `${h(SCHEMA.PER.t(x.p))} (${x.over} hari lewat ritmenya)`).join(' · '),
      'Buka Network', "NW_TAB='due';go('network')");
  }
  if(s.msLate.length){
    add('FACT','CONFIRMED','red', nOr(s.msLate.length,'milestone') + ' terlewat tanggalnya',
      s.msLate.slice(0,3).map(m => h(m.n)).join(' · ') + '.',
      'Buka Milestone', "PJ_TAB='ms';go('projects')");
  }
  if(s.opsCrit.length){
    add('FACT','CONFIRMED','red', nOr(s.opsCrit.length,'isu kritis') + ' masih terbuka',
      s.opsCrit.slice(0,3).map(o => h(o.n)).join(' · ') + '.',
      'Buka Business Empire', "BF={unit:'',sev:'Kritis',st:'open'};BZ_TAB='iss';go('business')");
  }
  if(s.cntLate.length){
    add('FACT','CONFIRMED','orange', nOr(s.cntLate.length,'konten') + ' lewat tanggal tayang',
      s.cntLate.slice(0,3).map(c => h(c.n)).join(' · ') + '.',
      'Buka pipeline konten', "go('brand')");
  }
  if(s.famSoon.length){
    add('FACT','CONFIRMED','pink', nOr(s.famSoon.length,'ulang tahun keluarga') + ' dalam 7 hari',
      s.famSoon.map(x => h(SCHEMA.FAM.t(x.f)) + ' (' + (x.inDays === 0 ? 'hari ini' : x.inDays + ' hari') + ', ke-' + x.years + ')').join(' · ') + '.',
      'Buka Family', "go('family')");
  }
  if(s.tripNext.length && s.tripNext[0].items.length && s.tripNext[0].pct < 100){
    const tr = s.tripNext[0];
    add('FACT','CONFIRMED','blue', 'Persiapan ' + h(SCHEMA.TRP.t(tr.t)) + ' baru ' + tr.pct + '%',
      'Berangkat ' + relDay(tr.t.start).toLowerCase() + ' — ' + (tr.items.length - tr.done) + ' langkah persiapan belum dicentang.',
      'Buka Travel', "go('travel')");
  }
  if(s.sinceLog !== null && s.sinceLog >= 3){
    add('FACT','CONFIRMED','blue', `Check-in terakhir ${s.sinceLog} hari lalu`,
      'Tanpa check-in, kartu energi dan fokus di My Day kosong — dan tren tidak bisa dihitung.',
      'Check-in sekarang', "openForm('LOG')");
  }

  /* --- tafsiran, bukan fakta --- */
  const heavy = s.wl.filter(x => x.id !== '_none' && x.open >= 5);
  if(heavy.length){
    add('INFER','MEDIUM','orange', 'Beban menumpuk pada ' + h(heavy[0].name),
      heavy[0].open + ' tugas terbuka' + (heavy[0].late ? ', ' + heavy[0].late + ' di antaranya terlambat' : '') +
      '. Angkanya fakta; kesimpulan bahwa ini kelebihan beban adalah tafsiran saya — Anda yang tahu kapasitas sebenarnya.',
      'Lihat beban tim', "PJ_TAB='load';go('projects')");
  }
  if(s.projStall.length){
    add('INFER','MEDIUM','orange', nOr(s.projStall.length,'proyek') + ' berstatus Berjalan tanpa satu pun tugas',
      s.projStall.map(x => h(SCHEMA.PRO.t(x.p))).join(' · ') + '. Selama tidak ada tugas, progresnya tidak bisa dihitung dan hanya bergantung angka manual.',
      'Buka papan proyek', "PJ_TAB='board';go('projects')");
  }
  if(s.noOwnerT.length >= 3){
    add('INFER','MEDIUM','blue', nOr(s.noOwnerT.length,'tugas') + ' belum punya penanggung jawab',
      'Tugas tanpa pemilik cenderung menjadi tugas Anda sendiri secara diam-diam. Ini pola yang saya lihat di data, bukan aturan.',
      'Lihat tugas itu', "TF={q:'',st:'open',owner:'_none',proj:'',pri:'',grp:'status'};PJ_TAB='tasks';go('projects')");
  }
  if(s.decNoAssume.length && recs('DEC').length >= 3){
    add('INFER','MEDIUM','purple', nOr(s.decNoAssume.length,'keputusan') + ' tanpa asumsi tertulis',
      'Saat ditinjau nanti, keputusan ini hanya bisa dinilai dari hasilnya — bukan dari apakah cara berpikirnya benar.',
      'Buka decision log', "OS_TAB='dec';go('os')");
  }
  if(s.goalsLate.length){
    add('INFER','MEDIUM','red', nOr(s.goalsLate.length,'sasaran') + ' Anda tandai tertinggal',
      s.goalsLate.slice(0,3).map(g => h(g.n)).join(' · ') + '. Status ini Anda sendiri yang menetapkan.',
      'Buka Goal', "OS_TAB='goal';go('os')");
  }
  return out;
}

/* ---------------- morning brief dari data nyata ---------------- */
function aiBrief(){
  const s = aiSignals();
  if(!aiHasData()) return `<p class="sub">Belum ada satu pun record di sistem, jadi tidak ada yang bisa saya ringkas.
    Briefing ini dibangun dari check-in, tugas, agenda, interaksi, keputusan, dan ritme Anda — bukan dari sumber luar.</p>
    <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:14px">
      <button class="btn solid" onclick="closeModal();openForm('LOG')">${ic('sun')} Check-in</button>
      <button class="btn gold" onclick="closeModal();openForm('TSK')">${ic('check')} Tambah tugas</button></div>`;
  const sec = (icn, title, color, lines) => `
    <div class="card" style="padding:14px;margin-bottom:11px">
      <div class="flexr" style="gap:9px;margin-bottom:7px">
        <div class="ic" style="width:28px;height:28px;border-radius:9px;display:grid;place-items:center;flex:0 0 28px;background:${CT(color)};color:${CV(color)}">${ic(icn)}</div>
        <b style="font-size:13px">${title}</b></div>
      ${lines.map(l => `<div style="font-size:13px;line-height:1.55;margin-bottom:3px">${l}</div>`).join('')}
    </div>`;
  const none = t => `<span class="sub">${t}</span>`;
  return `
  <p class="sub" style="margin-bottom:14px">${fmtDay(s.T)} · disusun dari record Anda sendiri. Angka apa pun di bawah ini bisa Anda telusuri ke modulnya.</p>
  ${sec('sun','Keadaan Anda','blue', [
    s.log ? `Energi <b>${h(String(s.log.energy))}/10</b>${s.log.focus ? `, fokus hari ini: <b>${h(s.log.focus)}</b>` : ''}.`
          : none(s.sinceLog === null ? 'Belum ada check-in sama sekali.' : `Belum check-in hari ini — terakhir ${s.sinceLog} hari lalu.`),
    s.energy7 !== null ? `Rata-rata energi ${s.nLog7} check-in terakhir: <b>${String(s.energy7).replace('.',',')}/10</b>.` : ''
  ].filter(Boolean))}
  ${sec('clock','Hari ini','purple', [
    s.mtg.length ? `${nOr(s.mtg.length,'agenda')}: ${s.mtg.map(m => `<b>${h(m.time||'—')}</b> ${h(m.n)}`).join(' · ')}.` : none('Tidak ada agenda tercatat hari ini.'),
    s.dueT.length ? `${nOr(s.dueT.length,'tugas')} jatuh tempo hari ini.` : '',
    s.p1.length ? `${nOr(s.p1.length,'tugas')} bertanda P1 masih terbuka.` : ''
  ].filter(Boolean))}
  ${sec('flag','Yang menagih','red', [
    s.lateT.length ? `${nOr(s.lateT.length,'tugas')} lewat tenggat.` : '',
    s.promLate.length ? `${nOr(s.promLate.length,'janji')} kepada orang lain lewat tanggalnya.` : '',
    s.decDue.length ? `${nOr(s.decDue.length,'keputusan')} menunggu peninjauan.` : '',
    s.ritBroken.length ? `${nOr(s.ritBroken.length,'ritme')} terputus.` : '',
    s.cold.length ? `${nOr(s.cold.length,'relasi')} mendingin.` : '',
    s.msLate.length ? `${nOr(s.msLate.length,'milestone')} terlewat.` : ''
  ].filter(Boolean).length ? [
    s.lateT.length ? `${nOr(s.lateT.length,'tugas')} lewat tenggat.` : '',
    s.promLate.length ? `${nOr(s.promLate.length,'janji')} kepada orang lain lewat tanggalnya.` : '',
    s.decDue.length ? `${nOr(s.decDue.length,'keputusan')} menunggu peninjauan.` : '',
    s.ritBroken.length ? `${nOr(s.ritBroken.length,'ritme')} terputus.` : '',
    s.cold.length ? `${nOr(s.cold.length,'relasi')} mendingin.` : '',
    s.msLate.length ? `${nOr(s.msLate.length,'milestone')} terlewat.` : ''
  ].filter(Boolean) : [none('Tidak ada yang lewat jadwal. Bersih.')])}
  ${sec('layers','Pekerjaan','gold', [
    s.projs.length ? `${nOr(s.projs.length,'proyek')} tercatat${s.projLate.length ? `, ${s.projLate.length} lewat target` : ''}${s.projRisk.length ? `, ${s.projRisk.length} punya tugas terlambat` : ''}.` : none('Belum ada proyek tercatat.'),
    s.done7.length ? `${nOr(s.done7.length,'tugas')} ditutup dalam 7 hari terakhir.` : none('Belum ada tugas yang ditutup minggu ini.'),
    s.wl.length ? `Beban terbesar: <b>${h(s.wl[0].name)}</b> dengan ${s.wl[0].open} tugas terbuka.` : ''
  ].filter(Boolean))}
  <div class="statebar" style="margin:4px 0 0">
    <span class="dbadge" style="background:var(--green)">SUMBER</span>
    <div style="flex:1;min-width:220px">Seluruh isi briefing ini dihitung dari record ber-<code>is_dummy = false</code> di peramban ini.
      Tidak ada angka dari luar sistem, dan tidak ada yang saya karang.</div>
  </div>`;
}
function morningBriefLive(){
  modal('Briefing Pagi', 'Aji AI Chief of Staff', aiBrief(),
    `<button class="btn solid" onclick="closeModal();go('ai')">Buka AI Command Center</button>
     <button class="btn ghost" onclick="closeModal()">Tutup</button>`, true);
}

/* ---------------- mesin jawaban ---------------- */
function aiFindPerson(s){
  const list = recs('PER');
  return list.find(p => s.includes(String(p.n).toLowerCase())) ||
         list.find(p => String(p.n).toLowerCase().split(' ').filter(w => w.length > 3).some(w => s.includes(w)));
}
function aiAnswerLive(q){
  const s = String(q).toLowerCase().trim();
  const g = aiSignals();
  const has = aiHasData();
  const bullets = arr => arr.map(x => '• ' + x).join('\n');
  const src = t => `\n\n_Sumber: ${t} — record Anda sendiri._`;

  /* pertanyaan tentang satu orang */
  const per = aiFindPerson(s);
  if(per && /kapan|terakhir|siapa|bagaimana|apa kabar|hubungi|temu|bertemu|janji|tugas/.test(s)){
    const cs = contactStat(per);
    const op = promises().filter(i => i.per === per.id);
    const tk = openTsk().filter(t => t.owner === per.id);
    return `**${SCHEMA.PER.t(per)}** — ${[per.pos, per.org].filter(Boolean).join(', ') || per.cat || '—'}\n\n` +
      (cs.last ? `Terakhir tercatat ${dOnly(cs.last)} (${cs.days} hari lalu)${cs.target ? `, ritme yang Anda tetapkan ${per.cadence} — status **${ST_LABEL[cs.st]}**` : ''}.`
               : 'Belum ada interaksi yang tercatat dengannya.') +
      `\n\n${cs.n} interaksi tercatat, ${cs.recent} dalam 12 bulan terakhir (tier ${cs.tier}).` +
      (cs.ints.length ? `\n\nTerakhir dibahas: "${cs.ints[0].topic || '—'}"${cs.ints[0].outcome ? ` — ${cs.ints[0].outcome}` : ''}.` : '') +
      (op.length ? `\n\n**Janji Anda yang belum ditepati:**\n${bullets(op.map(i => i.next + (i.nextDate ? ' (' + relDay(i.nextDate).toLowerCase() + ')' : '')))}` : '') +
      (tk.length ? `\n\n**Tugas yang dia pegang:** ${tk.length} terbuka.` : '') +
      src('Network');
  }

  const rules = [
    { k:['prioritas','tiga hal','3 hal','paling penting','hari ini apa'], a:() => {
        const t3 = top3(g.T);
        if(!t3.length) return has ? 'Tidak ada tugas terbuka untuk hari ini. Papan tugas Anda bersih.' + src('Projects')
                                  : 'Belum ada tugas di sistem, jadi belum ada prioritas yang bisa saya susun.';
        return `Tiga hal terpenting hari ini, dipilih dari prioritas dan tenggat yang Anda tetapkan sendiri:\n\n` +
          t3.map((t,i) => `${i+1}. **${t.n}** — ${[t.pri || '', t.due ? 'tenggat ' + relDay(t.due).toLowerCase() : 'tanpa tenggat'].filter(Boolean).join(' · ')}`).join('\n') +
          src('My Day & Projects'); } },
    { k:['terlambat','lewat tenggat','telat','tertunda'], a:() => g.lateT.length
        ? `${nOr(g.lateT.length,'tugas')} lewat tenggat:\n\n` +
          bullets(g.lateT.slice(0,8).map(t => `**${t.n}** — terlambat ${daysBetween(t.due, g.T)} hari${t.owner ? ', ' + ownerName(t.owner) : ''}`)) + src('Projects')
        : 'Tidak ada tugas yang lewat tenggat.' + (has ? src('Projects') : '') },
    { k:['hubungi','follow up','relasi','dingin','mendingin','jaringan','network'], a:() => g.contacts.length
        ? `${nOr(g.contacts.length,'kontak')} sudah lewat ritme yang Anda tetapkan:\n\n` +
          bullets(g.contacts.slice(0,8).map(x => `**${SCHEMA.PER.t(x.p)}** — ${x.st === 'never' ? 'belum pernah tercatat' : x.over + ' hari lewat dari ritme ' + (x.p.cadence||'').toLowerCase()}`)) + src('Network')
        : recs('PER').length ? 'Tidak ada relasi yang lewat ritmenya.' + src('Network')
        : 'Belum ada kontak di sistem. Isi kontak dan tetapkan ritmenya dulu — baru saya bisa menagih.' },
    { k:['janji','komitmen','saya berjanji','belum saya tepati'], a:() => g.prom.length
        ? `${nOr(g.prom.length,'janji')} belum ditepati${g.promLate.length ? `, ${g.promLate.length} sudah lewat tanggalnya` : ''}:\n\n` +
          bullets(g.prom.slice(0,8).map(i => { const p = i.per ? recById(i.per) : null;
            return `**${i.next}**${p ? ' — kepada ' + SCHEMA.PER.t(p) : ''}${i.nextDate ? ' (' + relDay(i.nextDate).toLowerCase() + ')' : ''}`; })) + src('Network')
        : 'Tidak ada janji yang menggantung.' + (recs('INT').length ? src('Network') : '') },
    { k:['keputusan','decision','memutuskan','peninjauan','tinjau ulang','harus saya tinjau'], a:() => {
        if(!recs('DEC').length) return 'Belum ada keputusan tercatat. Catat keputusan besar beserta asumsinya — sistem akan menagihnya kembali pada tanggal peninjauan.';
        const judged = recs('DEC').filter(d => d.verdict);
        return (g.decDue.length ? `${nOr(g.decDue.length,'keputusan')} sudah waktunya ditinjau:\n\n` +
            bullets(g.decDue.map(d => `**${d.n}** — jadwal tinjauan ${dOnly(d.review)}, telat ${daysBetween(d.review, g.T)} hari`)) + '\n\n'
          : 'Tidak ada keputusan yang menunggu peninjauan.\n\n') +
          `Total ${recs('DEC').length} keputusan tercatat, ${judged.length} sudah dinilai` +
          (judged.length ? ` (${VERDICTS.map(v => judged.filter(d => d.verdict === v).length + ' ' + v.toLowerCase()).filter(x => x[0] !== '0').join(', ')})` : '') + '.' + src('Operating System'); } },
    { k:['ritme','terputus','rutin','review mingguan','kebiasaan','disiplin'], a:() => {
        if(!recs('RIT').length) return 'Belum ada ritme yang Anda tetapkan. Ritme adalah peninjauan berulang dengan daftar periksa — mingguan, bulanan, kuartalan.';
        return g.rits.map(x => `**${x.r.n}** (${x.r.freq}) — ${RIT_LABEL[x.st]}${x.keep !== null ? `, kedisiplinan 90 hari ${x.keep}%` : ''}`).join('\n') + src('Operating System'); } },
    { k:['proyek','project','bermasalah','risiko'], a:() => {
        if(!recs('PRO').length) return 'Belum ada proyek tercatat.';
        const worst = g.projs.slice().sort((a,b) => (b.late + (b.overdue?5:0)) - (a.late + (a.overdue?5:0)))[0];
        return `${nOr(g.projs.length,'proyek')} tercatat.\n\n` +
          (g.projLate.length ? `Lewat target: ${g.projLate.map(x => '**' + SCHEMA.PRO.t(x.p) + '**').join(', ')}.\n` : '') +
          (g.projRisk.length ? `Punya tugas terlambat: ${g.projRisk.map(x => SCHEMA.PRO.t(x.p) + ' (' + x.late + ')').join(', ')}.\n` : '') +
          (worst ? `\nPaling perlu perhatian: **${SCHEMA.PRO.t(worst.p)}** — progres ${worst.pct}%${worst.auto ? ` (${worst.done}/${worst.n} tugas selesai)` : ' (angka manual, belum ada tugas)'}.` : '') + src('Projects'); } },
    { k:['beban','kelebihan','siapa sibuk','delegasi','delegasikan','workload'], a:() => g.wl.length
        ? `Beban tugas terbuka:\n\n` + bullets(g.wl.map(x => `**${x.name}** — ${x.open} terbuka${x.late ? ', ' + x.late + ' terlambat' : ''}${x.p1 ? ', ' + x.p1 + ' P1' : ''}`)) +
          `\n\nAngka ini fakta dari papan tugas. Apakah ini berarti kelebihan beban — Anda yang tahu kapasitas sebenarnya.` + src('Projects')
        : 'Belum ada tugas terbuka, jadi belum ada beban yang bisa dihitung.' },
    { k:['energi','wellbeing','check-in','checkin','kondisi saya','tidur'], a:() => {
        if(!recs('LOG').length) return 'Belum ada check-in sama sekali. Begitu Anda mulai mencatat energi dan fokus harian, saya bisa menunjukkan trennya.';
        return (g.log ? `Hari ini Anda mencatat energi **${g.log.energy}/10**${g.log.focus ? `, fokus: ${g.log.focus}` : ''}.`
                      : `Belum check-in hari ini — terakhir ${g.sinceLog} hari lalu.`) +
          (g.energy7 !== null ? `\n\nRata-rata ${g.nLog7} check-in terakhir: **${String(g.energy7).replace('.',',')}/10**.` : '') +
          `\n\nIni angka yang Anda catat sendiri — saya tidak menafsirkannya jadi kesimpulan kesehatan.` + src('My Day'); } },
    { k:['agenda','jadwal','meeting','pertemuan hari ini'], a:() => g.mtg.length
        ? `${nOr(g.mtg.length,'agenda')} hari ini:\n\n` + bullets(g.mtg.map(m => `**${m.time || '—'}** ${m.n}${m.loc ? ' — ' + m.loc : ''}`)) + src('My Day')
        : 'Tidak ada agenda tercatat hari ini.' + (recs('MTG').length ? src('My Day') : ' Agenda diisi lewat entitas Meeting.') },
    { k:['sasaran','goal','target','visi'], a:() => {
        if(!recs('GOL').length) return 'Belum ada sasaran tercatat.';
        return `${nOr(g.goals.length,'sasaran')} tercatat` + (g.goalsLate.length ? `, ${g.goalsLate.length} Anda tandai tertinggal:\n\n` +
          bullets(g.goalsLate.map(x => `**${x.n}** — ${x.horizon || ''}`)) : '. Tidak ada yang Anda tandai tertinggal.') + src('Operating System'); } },
    { k:['ringkas','briefing','brief','pagi','apa yang harus saya tahu'], a:() => {
        const l = [];
        if(g.lateT.length) l.push(`${nOr(g.lateT.length,'tugas')} lewat tenggat`);
        if(g.promLate.length) l.push(`${nOr(g.promLate.length,'janji')} lewat tanggalnya`);
        if(g.decDue.length) l.push(`${nOr(g.decDue.length,'keputusan')} menunggu peninjauan`);
        if(g.ritBroken.length) l.push(`${nOr(g.ritBroken.length,'ritme')} terputus`);
        if(g.cold.length) l.push(`${nOr(g.cold.length,'relasi')} mendingin`);
        return (l.length ? `Yang menagih hari ini: ${l.join(', ')}.\n\n` : 'Tidak ada yang lewat jadwal hari ini.\n\n') +
          (g.mtg.length ? `${nOr(g.mtg.length,'agenda')} tercatat. ` : '') +
          (g.dueT.length ? `${nOr(g.dueT.length,'tugas')} jatuh tempo hari ini. ` : '') +
          `\n\nBuka Briefing Pagi untuk versi lengkapnya.` + src('semua modul'); } },
    { k:['konten','pipeline','tayang','posting'], a:() => {
        if(!recs('CNT').length) return 'Belum ada konten tercatat di pipeline.';
        const byS = {}; recs('CNT').forEach(c => byS[c.status] = (byS[c.status]||0)+1);
        return `${recs('CNT').length} konten di pipeline: ` + Object.keys(byS).map(k => byS[k] + ' ' + k.toLowerCase()).join(', ') + '.' +
          (g.cntLate.length ? `\n\n**Lewat tanggal tayang:**\n` + bullets(g.cntLate.map(c => `${c.n} (${h(c.channel||'—')}, ${dOnly(c.date)})`)) : '') + src('Branding & CRM'); } },
    { k:['keluarga','ulang tahun','anak','istri','famili'], a:() => {
        if(!recs('FAM').length && !recs('EVT').length) return 'Belum ada data keluarga tercatat.';
        const b60 = recs('FAM').filter(x => x.dob).map(x => Object.assign({ f:x }, nextAnniv(x.dob) || {}))
          .filter(x => x.inDays !== undefined && x.inDays <= 60).sort((a,b) => a.inDays - b.inDays);
        return (b60.length ? `Ulang tahun dalam 60 hari:\n\n` + bullets(b60.map(x => `**${SCHEMA.FAM.t(x.f)}** — ${x.inDays === 0 ? 'hari ini' : x.inDays + ' hari lagi'}, ke-${x.years}`))
                           : 'Tidak ada ulang tahun dalam 60 hari ke depan.') +
          `\n\n${recs('FAM').length} anggota keluarga dan ${recs('EVT').length} acara tercatat.` + src('Family'); } },
    { k:['perjalanan','trip','berangkat','travel'], a:() => {
        if(!recs('TRP').length) return 'Belum ada perjalanan tercatat.';
        if(!g.tripNext.length) return `${recs('TRP').length} perjalanan tercatat, tidak ada yang dijadwalkan dalam 14 hari ke depan.` + src('Travel');
        const t0 = g.tripNext[0];
        return `Berikutnya: **${SCHEMA.TRP.t(t0.t)}** — ${relDay(t0.t.start).toLowerCase()}${t0.nights ? ', ' + t0.nights + ' hari' : ''}.` +
          (t0.items.length ? `\n\nPersiapan ${t0.pct}% (${t0.done}/${t0.items.length} langkah).` : '\n\nBelum ada daftar persiapan.') + src('Travel'); } },
    { k:['isu','operasional','outlet','unit bisnis'], a:() => {
        if(typeof opsOpen !== 'function' || !recs('OPS').length) return 'Belum ada isu operasional tercatat.';
        const o = opsOpen();
        return `${o.length} isu terbuka di ${recs('BUS').length} unit.\n\n` +
          bullets(o.slice(0,8).map(x => { const u = x.unit ? recById(x.unit) : null;
            return `**${x.n}** — ${x.sev}${u ? ', ' + SCHEMA.BUS.t(u) : ''}${x.opened ? ', terbuka ' + daysBetween(x.opened, g.T) + ' hari' : ''}`; })) + src('Business Empire'); } },
    { k:['catatan','knowledge','pelajaran','arsip'], a:() => {
        if(!recs('KNW').length) return 'Belum ada catatan di arsip.';
        const wl = recs('KNW').filter(k => k.lesson);
        return `${recs('KNW').length} catatan tersimpan, ${wl.length} sudah punya kolom "pelajaran yang saya ambil".` +
          `\n\nUntuk mencari isi catatan, buka Knowledge lalu pakai "Tanya arsip saya" — di sana pencariannya menjangkau isi, bukan hanya judul.` + src('Knowledge'); } },
    { k:['berapa record','jumlah record','total record','record saya','data saya','berapa banyak record'], a:() => {
        const rows = SCH_ORDER.map(t => ({ t, n: recs(t).length })).filter(x => x.n);
        return rows.length ? `Record asli Anda saat ini:\n\n` + bullets(rows.map(x => `${SCHEMA[x.t].n}: **${x.n}**`)) +
          `\n\nSemuanya bertanda \`is_dummy = false\`.` : 'Belum ada satu pun record asli di sistem.'; } }
  ];

  const hit = rules.find(r => r.k.some(k => s.includes(k)));
  if(hit) return hit.a();

  /* cari di seluruh record sebelum menyerah */
  const found = [];
  SCH_ORDER.forEach(t => {
    recs(t).forEach(r => { if(JSON.stringify(r).toLowerCase().includes(s) && found.length < 6)
      found.push(`**${SCHEMA[t].t(r)}** — ${SCHEMA[t].n} · ${r.id}`); });
  });
  if(found.length) return `Saya tidak punya jawaban khusus untuk itu, tetapi menemukan ${found.length} record yang menyebutnya:\n\n${bullets(found)}\n\nBuka lewat ⌘K untuk melihat isinya.`;

  return `Saya tidak punya jawaban untuk itu dari data yang ada — dan saya tidak akan mengarang.\n\n` +
    (has ? `Yang bisa saya jawab dari record Anda sekarang: prioritas hari ini, tugas terlambat, siapa yang perlu dihubungi, janji yang belum ditepati, keputusan yang menunggu peninjauan, ritme yang terputus, proyek bermasalah, beban tim, agenda, sasaran, dan energi harian.`
         : `Belum ada record apa pun di sistem. Mulai dari satu check-in atau satu tugas — setelah itu saya punya bahan untuk menjawab.`);
}

/* ---------------- pertanyaan yang disarankan, dibangun dari data nyata ---------------- */
function aiQuestionsLive(){
  const g = aiSignals(), q = [];
  if(g.lateT.length) q.push('Apa saja tugas yang terlambat?');
  if(g.contacts.length) q.push('Siapa yang perlu saya hubungi?');
  if(g.prom.length) q.push('Janji apa yang belum saya tepati?');
  if(g.decDue.length) q.push('Keputusan apa yang harus saya tinjau?');
  if(g.ritBroken.length) q.push('Ritme mana yang terputus?');
  if(recs('TSK').length) q.push('Apa tiga hal paling penting hari ini?');
  if(recs('PRO').length) q.push('Proyek mana yang paling bermasalah?');
  if(g.wl.length) q.push('Siapa yang bebannya paling berat?');
  if(recs('LOG').length) q.push('Bagaimana energi saya belakangan ini?');
  const p = recs('PER')[0];
  if(p) q.push('Kapan terakhir saya bertemu ' + SCHEMA.PER.t(p) + '?');
  q.push('Berapa jumlah record saya sekarang?');
  return q;
}

/* ---------------- pasang ke chat & briefing ---------------- */
aiAnswer = function(q){ return dataMode() ? aiAnswerLive(q) : aiAnswerDemo(q); };
function aiAnswerDemo(q){
  const s = q.toLowerCase();
  const hit = AI_BRAIN.find(b => b.k.some(k => s.includes(k)));
  if(hit) return hit.a();
  return aiAnswerLive(q);
}
/* Mode data: begitu ada record asli, AI berhenti memakai naskah contoh */
function dataMode(){ return aiHasData(); }
/* Briefing pagi ikut berpindah ke data nyata */
const _briefDemo = morningBrief;
morningBrief = function(){ return dataMode() ? morningBriefLive() : _briefDemo(); };

openAI = function(q){
  document.getElementById('aiDr').classList.add('on');
  if(!CHAT.length){
    const g = aiSignals();
    CHAT.push({ r:'ai', t: dataMode()
      ? `Selamat datang, Aji. Saya membaca **record Anda sendiri** — bukan naskah.\n\n` +
        (g.log ? `Check-in hari ini: energi ${g.log.energy}/10${g.log.focus ? `, fokus "${g.log.focus}"` : ''}.\n\n` : '') +
        ([g.lateT.length ? `${g.lateT.length} tugas lewat tenggat` : '',
          g.promLate.length ? `${g.promLate.length} janji lewat tanggalnya` : '',
          g.decDue.length ? `${g.decDue.length} keputusan menunggu peninjauan` : '',
          g.ritBroken.length ? `${g.ritBroken.length} ritme terputus` : '',
          g.cold.length ? `${g.cold.length} relasi mendingin` : ''].filter(Boolean).join(', ') || 'Tidak ada yang lewat jadwal hari ini') + '.' +
        `\n\nApa yang ingin Anda dalami?`
      : `Selamat datang, Aji. Belum ada record asli di sistem, jadi untuk sekarang saya hanya bisa menjawab dari **data contoh** — dan itu tidak boleh jadi dasar keputusan.\n\nBegitu Anda mulai entri data, jawaban saya berpindah ke angka Anda sendiri.` });
  }
  document.getElementById('aiSug').innerHTML = (dataMode() ? aiQuestionsLive() : AI_Q).slice(0,4)
    .map(x => `<button class="chip" style="font-size:11.5px;padding:4px 10px" onclick="ask('${esc(x)}')">${x}</button>`).join('');
  renderChat();
  if(q) setTimeout(() => ask(q), 160);
};

/* ---------------- halaman AI Command Center ---------------- */
function aiCoverage(){
  const mods = [['LOG','My Day'],['TSK','Projects'],['MTG','My Day'],['PER','Network'],['INT','Network'],
                ['PRO','Projects'],['MLS','Projects'],['DEC','Operating System'],['RIT','Operating System'],
                ['GOL','Operating System'],['KNW','Knowledge'],['BUS','Business Empire'],['OPS','Business Empire'],
                ['CNT','Branding & CRM'],['FAM','Family'],['EVT','Family'],['TRP','Travel']];
  const filled = mods.filter(m => recs(m[0]).length).length;
  return `<div class="card">
    ${cardH('shield','Bahan yang saya punya','green',`<span class="pill ${filled >= 8 ? 'green' : filled >= 4 ? 'orange' : 'red'}">${filled} dari ${mods.length} sumber terisi</span>`)}
    <p class="sub" style="margin-bottom:12px">Kualitas jawaban saya persis sebatas data yang ada. Sumber yang kosong berarti pertanyaan di area itu tidak bisa saya jawab.</p>
    <div style="display:flex;gap:7px;flex-wrap:wrap">${mods.map(m => {
      const n = recs(m[0]).length;
      return `<span class="chip ${n ? 'on' : ''}" style="cursor:default;${n ? '' : 'opacity:.5'}">${h(SCHEMA[m[0]].n)} · ${n}</span>`;
    }).join('')}</div>
  </div>`;
}

VIEWS.ai = () => {
  const g = aiSignals(), ins = aiInsights(), live = dataMode();
  const head = `
  <div class="page-h">
    <div><h1>AI Command Center</h1><p>${live ? 'Membaca record Anda sendiri — setiap angka bisa ditelusuri ke modulnya.' : 'Belum ada data asli — untuk sementara hanya menampilkan contoh.'}</p></div>
    <div class="sp">
      ${live ? '<span class="pill green">● DATA ASLI</span>' : '<span class="pill dummy">⚠ DATA CONTOH</span>'}
      <button class="btn gold sm" onclick="morningBriefLive()">${ic('sun')} Briefing Pagi</button>
      <button class="btn pur sm" onclick="openAI()">${ic('spark')} Buka Chat</button>
    </div>
  </div>
  ${dummyOn() ? '' : dummyStateBar()}`;

  if(!live) return head + `
    <div class="card" style="text-align:center;padding:48px 26px;margin-bottom:18px">
      <div style="width:62px;height:62px;border-radius:19px;background:var(--purple-t);color:var(--purple);display:grid;place-items:center;margin:0 auto 16px">
        <span style="display:block;width:29px;height:29px">${ic('spark')}</span></div>
      <h2 style="font-family:var(--fd);font-size:24px;font-weight:600;margin:0 0 8px">Belum ada yang bisa saya baca</h2>
      <p class="sub" style="max-width:490px;margin:0 auto 20px">AI Chief of Staff di sini tidak mengarang dan tidak mengambil data dari luar —
        ia hanya membaca record yang Anda entri. Satu check-in atau satu tugas sudah cukup untuk memulai.</p>
      <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
        <button class="btn solid" onclick="openForm('LOG')">${ic('sun')} Check-in</button>
        <button class="btn gold" onclick="openForm('TSK')">${ic('check')} Tambah tugas</button>
        <button class="btn ghost" onclick="openImport()">${ic('doc')} Impor dari Sheets</button>
      </div></div>` + (dummyOn() ? aiDemoBlock() : '');

  const facts = ins.filter(x => x.type === 'FACT'), infers = ins.filter(x => x.type === 'INFER');
  const summary = facts.length
    ? facts.slice(0,3).map(f => f.title.toLowerCase()).join(', ')
    : 'tidak ada yang lewat jadwal';

  return head + `
  <div class="aibanner" style="margin-bottom:18px">
    <div class="z" style="flex:1;min-width:240px"><div class="lb">Ringkasan Eksekutif · ${fmtDay(g.T)}</div>
      <h4>${facts.length ? 'Yang menagih hari ini: ' + h(summary) + '.' : 'Tidak ada yang lewat jadwal hari ini.'}
        ${g.mtg.length ? h(nOr(g.mtg.length,'agenda')) + ' tercatat.' : ''}
        ${g.dueT.length ? h(nOr(g.dueT.length,'tugas')) + ' jatuh tempo.' : ''}</h4></div>
    <div class="btnw"><button class="btn-w" onclick="morningBriefLive()">Briefing Pagi →</button></div>
  </div>

  <div class="g g4" style="margin-bottom:18px">
    ${[['Temuan faktual', facts.length, facts.length?'red':'green','flag'],
       ['Tafsiran saya', infers.length, 'purple','spark'],
       ['Tugas terbuka', g.openT.length, 'blue','check'],
       ['Interaksi tercatat', recs('INT').length, 'teal','phone']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>

  <div class="sect"><div><h2>Temuan</h2><p>Dihitung langsung dari record Anda — bukan tafsiran</p></div>
    <div class="sp"><span class="pill green">FACT · CONFIRMED</span></div></div>
  ${facts.length ? `<div class="g g2" style="margin-bottom:22px">${facts.map(f => aiCard(f)).join('')}</div>`
    : `<div class="card" style="margin-bottom:22px"><p class="sub" style="margin:0">Tidak ada tugas terlambat, janji menggantung, keputusan menunggu, ritme terputus, atau relasi mendingin. Semuanya di dalam jadwal.</p></div>`}

  <div class="sect"><div><h2>Tafsiran saya</h2><p>Kesimpulan saya atas angka di atas — boleh Anda tolak</p></div>
    <div class="sp"><span class="pill purple">AI_INFERENCE</span></div></div>
  ${infers.length ? `<div class="g g2" style="margin-bottom:22px">${infers.map(f => aiCard(f)).join('')}</div>`
    : `<div class="card" style="margin-bottom:22px"><p class="sub" style="margin:0">Tidak ada pola yang cukup kuat untuk saya tafsirkan dari data saat ini.</p></div>`}

  <div class="g g21 top" style="margin-bottom:18px">
    ${aiCoverage()}
    <div class="card">
      ${cardH('spark','Tanya saya','purple')}
      <p class="sub" style="margin-bottom:12px">Pertanyaan di bawah ini disusun dari keadaan data Anda saat ini.</p>
      <div style="display:flex;gap:7px;flex-wrap:wrap">${aiQuestionsLive().map(q =>
        `<button class="chip" onclick="openAI('${esc(q)}')">${h(q)}</button>`).join('')}</div>
    </div>
  </div>

  <div class="statebar" style="margin:0">
    <span class="dbadge" style="background:var(--blue)">BATAS YANG SAYA AKUI</span>
    <div style="flex:1;min-width:240px">Saya hanya membaca record di peramban ini. Saya tidak melihat Google Drive, kalender, email, atau rekening —
      dan saya tidak menyimpulkan apa pun tentang kesehatan Anda dari angka energi yang Anda catat.
      Kalau saya tidak tahu, saya akan bilang tidak tahu.</div>
  </div>` + (dummyOn() ? aiDemoBlock() : '');
};

function aiCard(f){
  return `<div class="card">
    <div class="flexr" style="margin-bottom:9px;gap:7px">
      <span class="pill ${f.type === 'FACT' ? 'green' : 'purple'}">${f.type === 'FACT' ? 'FACT' : 'AI_INFERENCE'}</span>
      <span class="pill gray">${f.conf}</span>
      <span class="mini" style="margin-left:auto">${f.type === 'FACT' ? 'dihitung dari record' : 'tafsiran, bukan fakta'}</span>
    </div>
    <b style="font-size:14.5px;line-height:1.45;display:block;color:${CV(f.c)}">${f.title}</b>
    <p class="sub" style="margin:7px 0 0">${f.body}</p>
    <div class="card-f"><button class="btn ghost sm" onclick="${f.act ? f.go : ''}">${f.act || 'Buka'} →</button></div>
  </div>`;
}

function aiDemoBlock(){
  return `
  <div class="sect" style="margin-top:30px">
    <div><h2>Tampilan contoh</h2><p>Insight dan decision engine versi contoh — dibangun dari data dummy, bukan record Anda.</p></div>
    <div class="sp"><span class="pill dummy">⚠ DUMMY DATA</span>
      <button class="btn ghost sm" onclick="setDummyMode('hidden')">Sembunyikan</button></div>
  </div>
  ${AI_BODY()}`;
}

