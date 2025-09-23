
const $ = (q,root=document)=>root.querySelector(q);
const $$ = (q,root=document)=>[...root.querySelectorAll(q)];
const CSV_URL = "data/seeds.csv"; // Cambia por tu Sheets CSV


// === Iconos por semilla (fruto/especie) ===
const ICONS = {
  "tomate":"🍅","tomate cherry":"🍅","lechuga":"🥬","aji":"🌶️","ají":"🌶️","pimiento":"🫑","pimentón":"🫑",
  "cebolla":"🧅","pepino":"🥒","zanahoria":"🥕","brocoli":"🥦","brócoli":"🥦","maiz":"🌽","maíz":"🌽",
  "ajo":"🧄","papa":"🥔","frutilla":"🍓","acelga":"🥬","espinaca":"🥬","cilantro":"🌿","perejil":"🌿","albahaca":"🌿",
  "melon":"🍈","melón":"🍈","sandia":"🍉","sandía":"🍉","zapallo":"🎃","zapallito":"🎃","poroto":"🫘","arveja":"🟢",
  "rabano":"🔴","rábano":"🔴","repollo":"🥬","coliflor":"🥦","apio":"🥬","aloe":"🌵","albahaca morada":"🌿"
};
function iconFor(seed){
  const keys = [seed.name, seed.species, seed.type, (seed.tags||[]).join(' ')].filter(Boolean).join(' ').toLowerCase();
  for (const k in ICONS){ if(keys.includes(k)) return ICONS[k]; }
  return "🌱";
}
const state = { base: [], overlay: [], filters:{tipo:"",ciclo:"",epoca:"",etiqueta:""}, query:"", readonly:false, table:false };

function loadOverlay(){ try{ state.overlay = JSON.parse(localStorage.getItem("seeds_overlay_v3")||"[]"); }catch{ state.overlay=[]; } }
function saveOverlay(){ localStorage.setItem("seeds_overlay_v3", JSON.stringify(state.overlay)); }
function makeKey(s){ return `${s.name}__${s.species}`.toLowerCase(); }
function currentSeeds(){
  const del = new Set(state.overlay.filter(o=>o.__op==="delete").map(o=>o.key));
  const add = state.overlay.filter(o=>o.__op==="add").map(o=>o.seed);
  const base = state.base.filter(s=>!del.has(makeKey(s)));
  return [...add, ...base];
}

async function loadSeeds(){
  const text = await fetch(CSV_URL).then(r=>r.text());
  state.base = parseCSV(text);
  loadOverlay();
  renderAll();
}

function parseCSV(text){
  const lines = text.replace(/\r/g,'').split('\n').filter(Boolean);
  if(!lines.length) return [];
  const headers = splitCSVLine(lines[0]).map(h=>h.trim().toLowerCase());
  const out=[];
  for(let i=1;i<lines.length;i++){
    const cols = splitCSVLine(lines[i]);
    const row = Object.fromEntries(headers.map((h,idx)=>[h, cols[idx] ?? ""]));
    out.push(toSeed(row));
  }
  return out;
}
function splitCSVLine(line){
  const out=[]; let cur=""; let q=false;
  for(let i=0;i<line.length;i++){
    const c=line[i], n=line[i+1];
    if(c=='"'){ if(q && n=='"'){cur+='"'; i++;} else{ q=!q; } }
    else if(c==',' && !q){ out.push(cur); cur=""; }
    else{ cur+=c; }
  }
  out.push(cur);
  return out;
}
function toSeed(r){
  return {
    name: r.name||r.nombre||"",
    species: r.species||r.especie||"",
    type: r.type||r.tipo||"",
    cycle: r.cycle||r.ciclo||"",
    periodo_siembra: r.periodo_siembra||"",
    periodo_trasplante: r.periodo_trasplante||"",
    germination: { days_min: Number(r.germination_min||r.germinacion_min||0), days_max: Number(r.germination_max||r.germinacion_max||0) },
    depth: r.depth||r.profundidad||"",
    spacing: r.spacing||r.distancia||"",
    watering: r.watering||r.riego||"",
    location: r.location||r.ubicacion||"",
    stock: Number(r.stock||0),
    responsable: r.responsable||"",
    curso: r.curso||"",
    uso: r.uso||"",
    grow: { indoor: (String(r.indoor||r.interior||"").toLowerCase().trim()==="true"||r.indoor=="1"||r.interior=="1"),
            outdoor: (String(r.outdoor||r.exterior||"").toLowerCase().trim()==="true"||r.outdoor=="1"||r.exterior=="1") },
    sowing: r.sowing||r.siembra||"",
    notes: (r.notes||r.notas||"").split('|').join(',').split(',').map(s=>s.trim()).filter(Boolean),
    tags: (r.tags||r.etiquetas||"").split('|').join(',').split(',').map(s=>s.trim()).filter(Boolean),
    qr: r.qr||""
  };
}

function normalize(s){ return (s||"").toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
function haystack(s){ return normalize([s.name,s.species,s.type,s.cycle,s.periodo_siembra,s.periodo_trasplante,s.sowing,(s.notes||[]).join(' '),(s.tags||[]).join(' '),s.responsable,s.curso,s.uso].join(' ')); }

function matchFilters(s){
  if(state.filters.tipo && (s.type||"")!==state.filters.tipo) return false;
  if(state.filters.ciclo && (s.cycle||"")!==state.filters.ciclo) return false;
  if(state.filters.etiqueta && !(s.tags||[]).map(x=>normalize(x)).includes(normalize(state.filters.etiqueta))) return false;
  if(state.filters.epoca){
    // epoca coincide si periodo_siembra contiene esa estación (texto libre)
    if(!normalize(s.periodo_siembra).includes(normalize(state.filters.epoca))) return false;
  }
  const q = normalize(state.query);
  if(q && !haystack(s).includes(q)) return false;
  return true;
}

function computeKPIs(list){
  const variedades = list.length;
  const stock = list.reduce((a,s)=>a + (Number(s.stock)||0),0);
  // prox caducar: interpretamos si notes incluye "vence:" con AAAA-MM o si periodo_siembra está fuera de rango (heurística simple: 6 meses sin ventana)
  const soon = list.filter(s=>{
    const hit = (s.notes||[]).find(n=>/vence\s*:\s*\d{4}-\d{2}/i.test(n));
    if(hit){ 
      const m = hit.match(/(\d{4})-(\d{2})/); 
      if(m){ 
        const exp = new Date(Number(m[1]), Number(m[2])-1, 1);
        const now = new Date(); const diff = (exp - now) / (1000*60*60*24*30);
        return diff >= 0 && diff <= 3; // 3 meses
      }
    }
    return false;
  }).length;
  $('#kpi-variedades').textContent = variedades;
  $('#kpi-stock').textContent = stock;
  $('#kpi-caducar').textContent = soon;
}

function renderAll(){
  const list = currentSeeds().filter(matchFilters);
  renderKPIs();
  renderGrid(list);
  renderTable(list);
  renderCalendar(currentSeeds());
  renderCount(list);
}
function renderKPIs(){ computeKPIs(currentSeeds()); }
function renderCount(list){ $('#seed-count').textContent = `${list.length} semillas mostradas de ${currentSeeds().length}`; }

function cardTemplate(s){
  const key = makeKey(s);
  return `
  <article class="card">
    <div class=\"header\"><div class=\"fruit-ico\">${iconFor(s)}</div><h3 class=\"title\">${s.name}</h3><span class="badge">${s.germination.days_min}-${s.germination.days_max} días</span></div>
    <p><strong>Especie:</strong> ${s.species||'—'}</p>
    <p><strong>Tipo/Ciclo:</strong> ${s.type||'—'} / ${s.cycle||'—'}</p>
    <p><strong>Época siembra:</strong> ${s.periodo_siembra||'—'}</p>
    <div class="tags">${(s.tags||[]).map(t=>`<span class="pill">${t}</span>`).join('')}</div>
    <div class="actions">
      <button class="btn btn-detail" data-key="${key}">🔎 Detalle</button>
      <button class="btn btn-qr" data-key="${key}">🎯 QR</button>
      <button class="btn btn-delete" data-guard="owner" data-key="${key}">🗑️ Borrar</button>
    </div>
  </article>`;
}
function renderGrid(items){
  const grid = $('#seed-grid');
  grid.innerHTML = items.map(cardTemplate).join('');
  $('#empty').classList.toggle('hidden', items.length>0);
  $$('.btn-detail').forEach(b=>b.addEventListener('click', ()=>openDetail(b.dataset.key)));
  $$('.btn-delete').forEach(b=>b.addEventListener('click', ()=>onDelete(b.dataset.key)));
  $$('.btn-qr').forEach(b=>b.addEventListener('click', ()=>copyQR(b.dataset.key)));
  applyReadonly();
}

function renderTable(items){
  const tb = $('#seed-table tbody');
  tb.innerHTML = items.map(s=>{
    const key = makeKey(s);
    return `<tr>
      <td><button class="btn btn-qr" data-key="${key}">🎯</button></td>
      <td class="fruit-ico-td">${iconFor(s)}</td>
      <td>${s.name}</td>
      <td>${s.species||''}</td>
      <td>${s.type||''}</td>
      <td>${s.periodo_siembra||''} / ${s.periodo_trasplante||''}</td>
      <td>${s.germination.days_min}-${s.germination.days_max}</td>
      <td>${s.depth||''} / ${s.spacing||''}</td>
      <td>${s.watering||''}</td>
      <td>${s.location||''}</td>
      <td>${s.stock||0}</td>
      <td>${s.responsable||''}</td>
      <td>
        <button class="btn btn-detail" data-key="${key}">🔎</button>
        <button class="btn btn-delete" data-guard="owner" data-key="${key}">🗑️</button>
      </td>
    </tr>`;
  }).join('');
  $$('#seed-table .btn-detail').forEach(b=>b.addEventListener('click', ()=>openDetail(b.dataset.key)));
  $$('#seed-table .btn-delete').forEach(b=>b.addEventListener('click', ()=>onDelete(b.dataset.key)));
  $$('#seed-table .btn-qr').forEach(b=>b.addEventListener('click', ()=>copyQR(b.dataset.key)));
  applyReadonly();
  $('#tableWrap').classList.toggle('hidden', !state.table);
  $('#seed-grid').classList.toggle('hidden', state.table);
}

function openDetail(key){
  const s = currentSeeds().find(x=>makeKey(x)===key); if(!s) return;
  $('#detailTitle').textContent = s.name;
  $('#detailBody').innerHTML = `
    <div class="row"><strong>Especie:</strong><span>${s.species||'—'}</span></div>
    <div class="row"><strong>Tipo / Ciclo:</strong><span>${s.type||'—'} / ${s.cycle||'—'}</span></div>
    <div class="row"><strong>Germinación:</strong><span>${s.germination.days_min}-${s.germination.days_max} días</span></div>
    <div class="row"><strong>Prof./Dist.:</strong><span>${s.depth||'—'} / ${s.spacing||'—'}</span></div>
    <div class="row"><strong>Riego:</strong><span>${s.watering||'—'}</span></div>
    <div class="row"><strong>Interior / Exterior:</strong><span>${s.grow.indoor?'Sí':'No'} / ${s.grow.outdoor?'Sí':'No'}</span></div>
    <div class="row"><strong>Época siembra:</strong><span>${s.periodo_siembra||'—'}</span></div>
    <div class="row"><strong>Época trasplante:</strong><span>${s.periodo_trasplante||'—'}</span></div>
    <div class="row"><strong>Ubicación:</strong><span>${s.location||'—'}</span></div>
    <div class="row"><strong>Stock:</strong><span>${s.stock||0}</span></div>
    <div class="row"><strong>Responsable:</strong><span>${s.responsable||'—'}</span></div>
    <div class="row"><strong>Curso/Proyecto:</strong><span>${s.curso||'—'}</span></div>
    <div class="row"><strong>Uso previsto:</strong><span>${s.uso||'—'}</span></div>
    <div class="row"><strong>Notas:</strong><span>${(s.notes||[]).join(' · ')||'—'}</span></div>
    <div class="row"><strong>Etiquetas:</strong><span>${(s.tags||[]).join(', ')||'—'}</span></div>
  `;
  $('#detailDrawer').classList.add('open');
  $('#detailDrawer').setAttribute('aria-hidden','false');
}
$('#closeDrawer').addEventListener('click', ()=>{
  $('#detailDrawer').classList.remove('open');
  $('#detailDrawer').setAttribute('aria-hidden','true');
});
$('#detailDrawer').addEventListener('click', (e)=>{ if(e.target.id==='detailDrawer') $('#closeDrawer').click(); });

function copyQR(key){
  const s = currentSeeds().find(x=>makeKey(x)===key); if(!s) return;
  const base = location.origin + location.pathname.replace(/\/[^\/]*$/, '/'); // carpeta actual
  const url = s.qr ? s.qr : (base + `?q=${encodeURIComponent(s.name)}`);
  navigator.clipboard.writeText(url).then(()=> alert("Enlace QR copiado: " + url));
}

function onDelete(key){
  // Guard de rol (owner-only)
  try{
    const sess = window.ACCESS && ACCESS.getSession ? ACCESS.getSession() : {role:'viewer'};
    if (sess.role !== 'owner'){ alert("No tienes permiso para borrar semillas."); return; }
  }catch(e){ alert("Acción no disponible."); return; }
if(state.readonly) return;
  const s = currentSeeds().find(x=>makeKey(x)===key); if(!s) return;
  if(confirm(`¿Borrar "${s.name}" de esta vista? (no borra tu CSV fuente)`)){
    state.overlay.push({__op:"delete", key}); saveOverlay(); renderAll();
  }
}

function setupTabs(){
  $$('.tab').forEach(btn=>btn.addEventListener('click', ()=>{
    $$('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    const v=btn.dataset.view; $$('.view').forEach(x=>x.classList.remove('active')); $('#view-'+v).classList.add('active');
  }));
}
function setupSearch(){ $('#search').addEventListener('input', ()=>{ state.query = $('#search').value; renderAll(); }); }
function setupFilters(){
  $('#filterTipo').addEventListener('change', e=>{ state.filters.tipo=e.target.value; renderAll(); });
  $('#filterCiclo').addEventListener('change', e=>{ state.filters.ciclo=e.target.value; renderAll(); });
  $('#filterEpoca').addEventListener('change', e=>{ state.filters.epoca=e.target.value; renderAll(); });
  $('#filterEtiqueta').addEventListener('change', e=>{ state.filters.etiqueta=e.target.value; renderAll(); });
  $('#clearFilters').addEventListener('click', ()=>{
    state.filters={tipo:"",ciclo:"",epoca:"",etiqueta:""};
    ['filterTipo','filterCiclo','filterEpoca','filterEtiqueta'].forEach(id=>$('#'+id).value="");
    renderAll();
  });
}
function setupViewToggle(){ $('#toggleViewBtn').addEventListener('click', ()=>{ state.table = !state.table; $('#toggleViewBtn').textContent = state.table ? '🧭 Tarjetas' : '🧭 Tabla'; renderAll(); }); }

// Modal add/edit
function openModal(seed=null){
  const dlg = $('#seedModal'); const f = $('#seedForm'); $('#formError').classList.add('hidden');
  $('#modalTitle').textContent = seed ? '✏️ Editar semilla' : '➕ Semilla';
  f.reset();
  if(seed){
    f.name.value = seed.name; f.species.value = seed.species; f.type.value = seed.type||""; f.cycle.value = seed.cycle||"";
    f.gmin.value = seed.germination.days_min; f.gmax.value = seed.germination.days_max;
    f.depth.value = seed.depth||""; f.spacing.value = seed.spacing||""; f.watering.value = seed.watering||""; f.location.value = seed.location||"";
    f.stock.value = seed.stock||0; f.periodo_siembra.value = seed.periodo_siembra||""; f.periodo_trasplante.value = seed.periodo_trasplante||"";
    f.indoor.checked = !!seed.grow.indoor; f.outdoor.checked = !!seed.grow.outdoor;
    f.sowing.value = seed.sowing||""; f.notes.value = (seed.notes||[]).join(', '); f.tags.value = (seed.tags||[]).join(', ');
    f.responsable.value = seed.responsable||""; f.curso.value = seed.curso||""; f.uso.value = seed.uso||"";
  }
  dlg.showModal();
  $('#saveSeedBtn').onclick = (e)=>{
    e.preventDefault();
    if(!f.checkValidity()){ $('#formError').classList.remove('hidden'); return; }
    const seedNew = {
      name: f.name.value.trim(),
      species: f.species.value.trim(),
      type: f.type.value.trim(),
      cycle: f.cycle.value.trim(),
      periodo_siembra: f.periodo_siembra.value.trim(),
      periodo_trasplante: f.periodo_trasplante.value.trim(),
      germination: { days_min: Number(f.gmin.value||0), days_max: Number(f.gmax.value||0) },
      depth: f.depth.value.trim(), spacing: f.spacing.value.trim(), watering: f.watering.value.trim(), location: f.location.value.trim(),
      stock: Number(f.stock.value||0),
      responsable: f.responsable.value.trim(), curso: f.curso.value.trim(), uso: f.uso.value.trim(),
      grow: { indoor: !!f.indoor.checked, outdoor: !!f.outdoor.checked },
      sowing: f.sowing.value.trim(),
      notes: f.notes.value.split(',').map(s=>s.trim()).filter(Boolean),
      tags: f.tags.value.split(',').map(s=>s.trim()).filter(Boolean),
      qr: ""
    };
    if(seed){ // edit -> delete old + add new to overlay
      state.overlay.push({__op:"delete", key: makeKey(seed)});
    }
    state.overlay.push({__op:"add", seed: seedNew});
    saveOverlay(); dlg.close(); renderAll();
  };
}
function setupAddEdit(){
  $('#addSeedBtn').addEventListener('click', ()=>openModal(null));
  // Edit from Detail drawer would need an Edit button; for ahora, doble click en título de la tarjeta para editar:
  $('#seed-grid').addEventListener('dblclick', (e)=>{
    const card = e.target.closest('.card'); if(!card) return;
    const key = card.querySelector('.btn-detail')?.dataset.key; if(!key) return;
    const s = currentSeeds().find(x=>makeKey(x)===key);
    if(s) openModal(s);
  });
}

function setupImport(){
  const picker = $('#filePicker');
  $('#importBtn').addEventListener('click', ()=> picker.click());
  picker.addEventListener('change', async ()=>{
    const file = picker.files[0]; if(!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    rows.forEach(seed=> state.overlay.push({__op:"add", seed}));
    saveOverlay(); renderAll(); alert(`Importadas ${rows.length} semillas (en memoria).`);
    picker.value = "";
  });
}
function setupExport(){
  $('#exportBtn').addEventListener('click', ()=>downloadCSV(currentSeeds()));
  $('#downloadCSV').addEventListener('click', ()=>downloadCSV(currentSeeds()));
}
function downloadCSV(arr){
  const head = ["name","species","type","cycle","periodo_siembra","periodo_trasplante","germination_min","germination_max","depth","spacing","watering","location","stock","responsable","curso","uso","indoor","outdoor","sowing","notes","tags","qr"];
  const rows = [head, ...arr.map(s=>[
    s.name, s.species, s.type||"", s.cycle||"", s.periodo_siembra||"", s.periodo_trasplante||"",
    s.germination.days_min, s.germination.days_max, s.depth||"", s.spacing||"", s.watering||"", s.location||"", s.stock||0,
    s.responsable||"", s.curso||"", s.uso||"", s.grow.indoor, s.grow.outdoor, s.sowing||"",
    (s.notes||[]).join('|'), (s.tags||[]).join('|'), s.qr||""
  ])].map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([rows], {type:"text/csv;charset=utf-8"});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "semillas.csv"; a.click(); URL.revokeObjectURL(a.href);
}
function setupRefresh(){ $('#refreshBtn').addEventListener('click', ()=>{ state.overlay=[]; saveOverlay(); loadSeeds(); }); }
function setupReadonly(){
  const t = $('#readonlyToggle'); if(t){ t.addEventListener('change', ()=>{ state.readonly = t.checked; applyReadonly(); }); }
}
function applyReadonly(){
  $('#addSeedBtn')?.classList.toggle('hidden', state.readonly);
  $$('.btn-delete').forEach(b=>b.classList.toggle('hidden', state.readonly));
}

// Calendar (next 6 months based on periodo_siembra)
function renderCalendar(all){
  const host = $('#calGrid'); host.innerHTML = "";
  const now = new Date(); const months=[];
  for(let i=0;i<6;i++){ const d=new Date(now.getFullYear(), now.getMonth()+i, 1); months.push(d); }
  const monthNames = "Ene,Feb,Mar,Abr,May,Jun,Jul,Ago,Sep,Oct,Nov,Dic".split(',');
  months.forEach(m=>{
    const label = monthNames[m.getMonth()] + " " + m.getFullYear();
    const items = all.filter(s=> s.periodo_siembra && normalize(s.periodo_siembra).includes(normalize(monthNames[m.getMonth()])));
    const html = `<div class="cell"><h4>${label}</h4>${items.length?items.map(s=>`<span class="tag">${s.name}</span>`).join(''):'<span class="tag">—</span>'}</div>`;
    host.insertAdjacentHTML('beforeend', html);
  });
}

function setupBasic(){
  $('#printView').addEventListener('click', ()=>window.print());
  $('#toggleViewBtn').addEventListener('click', ()=>{}); // handled in setupViewToggle
}

document.addEventListener('DOMContentLoaded', ()=>{
  setupTabs(); setupSearch(); setupFilters(); setupViewToggle(); setupAddEdit(); setupImport(); setupExport(); setupRefresh(); setupReadonly(); setupBasic();
  loadSeeds();
});
