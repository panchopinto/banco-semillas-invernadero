
const $ = (q,root=document)=>root.querySelector(q);
const $$ = (q,root=document)=>[...root.querySelectorAll(q)];

const CSV_URL = "data/seeds.csv"; // Cambia por tu Google Sheets CSV si quieres remoto


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
const state = {
  base: [],        // datos cargados del CSV (base)
  overlay: [],     // cambios locales (añadidos o borrados) que persisten en localStorage
  filters: new Set(),
  query: "",
  readonly: false
};

function loadOverlay(){
  try{
    state.overlay = JSON.parse(localStorage.getItem("seeds_overlay")||"[]");
  }catch{ state.overlay=[]; }
}
function saveOverlay(){
  localStorage.setItem("seeds_overlay", JSON.stringify(state.overlay));
}

function currentSeeds(){
  // Mezcla base + overlay: overlay puede tener {__op:"delete", name:..., species:...} o {__op:"add", seed:{...}}
  const deleted = new Set(state.overlay.filter(o=>o.__op==="delete").map(o=>o.key));
  const added = state.overlay.filter(o=>o.__op==="add").map(o=>o.seed);
  const keep = state.base.filter(s=>!deleted.has(makeKey(s)));
  return [...added, ...keep];
}

async function loadSeeds(){
  const csv = await fetch(CSV_URL).then(r=>r.text());
  state.base = parseCSV(csv);
  loadOverlay();
  render();
}

function parseCSV(text){
  const lines = text.replace(/\r/g,'').split('\n').filter(Boolean);
  if(lines.length === 0) return [];
  const headers = splitCSVLine(lines[0]).map(h=>h.trim().toLowerCase());
  const out = [];
  for(let i=1;i<lines.length;i++){
    const cols = splitCSVLine(lines[i]);
    const row = Object.fromEntries(headers.map((h,idx)=>[h, cols[idx] ?? ""]));
    out.push(toSeed(row));
  }
  return out;
}

function toSeed(row){
  return {
    name: row.name || row.nombre || "",
    species: row.species || row.especie || "",
    germination: {
      days_min: Number(row.germination_min || row.germinacion_min || row.germinacionmin || 0),
      days_max: Number(row.germination_max || row.germinacion_max || row.germinacionmax || 0)
    },
    grow: {
      indoor: (String(row.indoor||row.interior||"").toLowerCase().trim() === "true" || row.indoor=="1" || row.interior=="1"),
      outdoor: (String(row.outdoor||row.exterior||"").toLowerCase().trim() === "true" || row.outdoor=="1" || row.exterior=="1")
    },
    sowing: row.sowing || row.siembra || "",
    notes: (row.notes || row.notas || "").split('|').join(',').split(',').map(s=>s.trim()).filter(Boolean),
    tags: (row.tags || row.etiquetas || "").split('|').join(',').split(',').map(s=>s.trim()).filter(Boolean)
  };
}
function splitCSVLine(line){
  const out = []; let cur = ""; let inQ = false;
  for(let i=0;i<line.length;i++){
    const c = line[i]; const n = line[i+1];
    if(c === '"' ){
      if(inQ && n === '"'){ cur += '"'; i++; } else { inQ = !inQ; }
    }else if(c === ',' && !inQ){ out.push(cur); cur = ""; }
    else{ cur += c; }
  }
  out.push(cur);
  return out;
}

function normalize(s){ return (s||"").toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
function matchSeed(seed){
  const q = normalize(state.query);
  const hay = normalize([seed.name, seed.species, (seed.notes||[]).join(' '), (seed.tags||[]).join(' '), seed.sowing].join(' '));
  const matchQ = !q || hay.includes(q);
  const matchF = !state.filters.size || [...state.filters].every(f => hay.includes(normalize(f)));
  return matchQ && matchF;
}
function highlight(text, q){
  if(!q) return text;
  const n = normalize(text); const t = normalize(q);
  const i = n.indexOf(t); if(i === -1) return text;
  const before = text.slice(0,i); const mid = text.slice(i, i+t.length); const after = text.slice(i+t.length);
  return `${before}<mark class="find">${mid}</mark>${after}`;
}

function makeKey(s){ return `${s.name}__${s.species}`.toLowerCase(); }

function render(){
  const list = $('#seed-list');
  const count = $('#seed-count');
  const items = currentSeeds().filter(matchSeed);
  list.innerHTML = items.map(s => cardTemplate(s)).join('');
  $('#empty').classList.toggle('hidden', items.length>0);
  count.textContent = `${items.length} semillas mostradas de ${currentSeeds().length}`;
  // bind detail / delete buttons
  $$('.btn-detail').forEach(btn=>btn.addEventListener('click', ()=>openDetail(btn.dataset.key)));
  $$('.btn-delete').forEach(btn=>btn.addEventListener('click', ()=>onDelete(btn.dataset.key)));
  applyReadonly();
}

function cardTemplate(s){
  const key = makeKey(s);
  return `
    <article class="card" data-key="${key}">
      <div class=\"header\"><div class=\"fruit-ico\">${iconFor(s)}</div>
        <h3 class="title">${highlight(s.name, state.query)}</h3>
        <span class="badge">${s.germination.days_min}-${s.germination.days_max} días</span>
      </div>
      <p><strong>Especie:</strong> ${s.species||'—'}</p>
      <p><strong>Interior/Exterior:</strong> ${s.grow.indoor && s.grow.outdoor ? 'Ambos' : (s.grow.indoor ? 'Interior' : (s.grow.outdoor ? 'Exterior' : '—'))}</p>
      <p><strong>Siembra:</strong> ${s.sowing||'—'}</p>
      <div class="tags">${(s.tags||[]).map(t=>`<span class="pill">${t}</span>`).join('')}</div>
      <div class="actions">
        <button class="btn btn-detail" data-key="${key}">Detalle</button>
        <button class="btn btn-delete" data-guard="owner" data-key="${key}">Borrar</button>
      </div>
    </article>
  `;
}

// Detail drawer
function openDetail(key){
  const s = currentSeeds().find(x=>makeKey(x)===key); if(!s) return;
  $('#detailTitle').textContent = s.name;
  $('#detailBody').innerHTML = `
    <div class="row"><strong>Especie:</strong><span>${s.species||'—'}</span></div>
    <div class="row"><strong>Germinación:</strong><span>${s.germination.days_min}-${s.germination.days_max} días</span></div>
    <div class="row"><strong>Interior:</strong><span>${s.grow.indoor ? 'Sí' : 'No'}</span></div>
    <div class="row"><strong>Exterior:</strong><span>${s.grow.outdoor ? 'Sí' : 'No'}</span></div>
    <div class="row"><strong>Siembra:</strong><span>${s.sowing||'—'}</span></div>
    <div class="row"><strong>Notas:</strong><span>${(s.notes||[]).join(' · ')||'—'}</span></div>
    <div class="row"><strong>Tags:</strong><span>${(s.tags||[]).join(', ')||'—'}</span></div>
  `;
  $('#detailDrawer').classList.add('open');
  $('#detailDrawer').setAttribute('aria-hidden','false');
}
$('#closeDrawer')?.addEventListener('click', ()=>{
  $('#detailDrawer').classList.remove('open');
  $('#detailDrawer').setAttribute('aria-hidden','true');
});
$('#detailDrawer')?.addEventListener('click', (e)=>{
  if(e.target.id === 'detailDrawer'){ $('#closeDrawer').click(); }
});

// Delete
function onDelete(key){
  // Guard de rol (owner-only) usando ACCESS si está disponible
  try {
    const sess = window.ACCESS && ACCESS.getSession ? ACCESS.getSession() : {role:'viewer'};
    if (sess.role !== 'owner') { console.warn("No tienes permiso para borrar semillas."); return; }
  } catch(e){ /* sin ACCESS => bloquear por defecto */ console.warn("Acción no disponible."); return; }
if(state.readonly) return;
  const s = currentSeeds().find(x=>makeKey(x)===key);
  if(!s) return;
  const ok = confirm(`¿Borrar "${s.name}" (${s.species}) de la vista? Esto no elimina tu CSV original.`);
  if(!ok) return;
  state.overlay.push({__op:"delete", key});
  if(window.SeedRecycleBin && s){ SeedRecycleBin.add(s); }
  saveOverlay();
  render();
}

// Search, tabs, chips, add, import/export/refresh
function setupSearch(){ $('#search').addEventListener('input', ()=>{ state.query = $('#search').value; render(); }); }
function setupTabs(){
  $$('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      $$('.view').forEach(v=>v.classList.remove('active'));
      $('#view-' + view).classList.add('active');
    });
  });
}
function setupChips(){
  $$('#chips .chip').forEach(ch=>{
    if(ch.classList.contains('clear')){
      ch.addEventListener('click', ()=>{ state.filters.clear(); $$('#chips .chip').forEach(c=>c.classList.remove('active')); render(); });
      return;
    }
    ch.addEventListener('click', ()=>{
      const f = ch.dataset.filter;
      if(state.filters.has(f)){ state.filters.delete(f); ch.classList.remove('active'); }
      else{ state.filters.add(f); ch.classList.add('active'); }
      render();
    });
  });
}
function setupAddSeed(){
  const dlg = $('#addSeedModal');
  $('#addSeedBtn').addEventListener('click', ()=> dlg.showModal());
  $('#saveSeedBtn').addEventListener('click', (e)=>{
    e.preventDefault();
    const form = dlg.querySelector('form');
    const fd = new FormData(form);
    const seed = {
      name: fd.get('name') || '',
      species: fd.get('species') || '',
      germination: { days_min: Number(fd.get('gmin')||0), days_max: Number(fd.get('gmax')||0) },
      grow: { indoor: !!fd.get('indoor'), outdoor: !!fd.get('outdoor') },
      sowing: fd.get('sowing') || '',
      notes: (fd.get('notes')||'').split(',').map(s=>s.trim()).filter(Boolean),
      tags: (fd.get('tags')||'').split(',').map(s=>s.trim()).filter(Boolean)
    };
    state.overlay.unshift({__op:"add", seed});
    saveOverlay();
    render();
    dlg.close();
  });
}
function setupImport(){
  const picker = $('#filePicker');
  $('#importBtn').addEventListener('click', ()=> picker.click());
  picker.addEventListener('change', async ()=>{
    const file = picker.files[0]; if(!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    // añadimos como overlay add (no modificamos CSV base)
    rows.forEach(seed=> state.overlay.push({__op:"add", seed}));
    saveOverlay(); render(); console.warn(`Importadas ${rows.length} semillas (en memoria).`);
    picker.value = "";
  });
}
function setupExport(){
  $('#exportBtn').addEventListener('click', ()=>downloadCSV(currentSeeds()));
  $('#downloadCSV').addEventListener('click', ()=>downloadCSV(currentSeeds()));
}
function downloadCSV(arr){
  const rows = [
    ["name","species","germination_min","germination_max","indoor","outdoor","sowing","notes","tags"],
    ...arr.map(s=>[
      s.name, s.species, s.germination.days_min, s.germination.days_max,
      s.grow.indoor, s.grow.outdoor, s.sowing,
      (s.notes||[]).join('|'), (s.tags||[]).join('|')
    ])
  ].map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([rows], {type:"text/csv;charset=utf-8"});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = "semillas.csv"; a.click(); URL.revokeObjectURL(a.href);
}
function setupRefresh(){ $('#refreshBtn').addEventListener('click', ()=>{ state.overlay=[]; saveOverlay(); loadSeeds(); }); }
function setupPrint(){ $('#printView').addEventListener('click', ()=>window.print()); }
function setupReadonly(){
  const toggle = $('#readonlyToggle');
  if(toggle){
    toggle.addEventListener('change', ()=>{ state.readonly = toggle.checked; applyReadonly(); });
  }
}
function applyReadonly(){
  $('#addSeedBtn')?.classList.toggle('hidden', state.readonly);
  $$('.btn-delete').forEach(b=>b.classList.toggle('hidden', state.readonly));
}

document.addEventListener('DOMContentLoaded', ()=>{
  setupTabs(); setupSearch(); setupChips(); setupAddSeed(); setupImport(); setupExport(); setupRefresh(); setupPrint(); setupReadonly();
  loadSeeds();
});
