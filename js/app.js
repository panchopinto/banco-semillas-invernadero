// Banco de Semillas — lógica principal
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const storeKey = "semillas_db_v1";

let DB = []; // arreglo de semillas

function uid(){ return Math.random().toString(36).slice(2,9); }

function saveLocal(){
  localStorage.setItem(storeKey, JSON.stringify(DB));
}
function loadLocal(){
  const raw = localStorage.getItem(storeKey);
  if(raw){ DB = JSON.parse(raw); }
}

// CSV helpers
function toCSV(rows){
  const header = Object.keys(rows[0] || {});
  const escape = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
  const lines = [header.join(",")].concat(rows.map(r => header.map(k => escape(r[k])).join(",")));
  return lines.join("\n");
}
function fromCSV(text){
  // simple CSV parser (handles quotes)
  const lines = text.replace(/\r/g,"").split("\n").filter(Boolean);
  if(!lines.length) return [];
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = splitCSVLine(line);
    const obj = {};
    headers.forEach((h,i)=>obj[h]=cells[i] ?? "");
    return obj;
  });
}
function splitCSVLine(line){
  const out=[]; let cur=""; let q=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"' && line[i+1]==='"'){ cur+='"'; i++; continue; }
    if(c==='"' ){ q=!q; continue; }
    if(c===',' && !q){ out.push(cur); cur=""; continue; }
    cur+=c;
  }
  out.push(cur);
  return out;
}

// UI
function render(){
  populateFamilias();
  // KPIs
  $("#kpi-total").textContent = DB.length;
  $("#kpi-stock").textContent = DB.reduce((a,b)=>a+(+b.stock||0),0);
  const expSoon = DB.filter(s => isExpiring(s)).length;
  $("#kpi-exp").textContent = expSoon;
  const tipos = groupCount(DB, "tipo");
  $("#kpi-tipos").textContent = Object.entries(tipos).map(([k,v])=>`${k}: ${v}`).join(" · ") || "—";

  // Tabla
  const rows = $("#rows");
  rows.innerHTML = "";
  const tpl = $("#row-tpl");
  filtered(DB).forEach(item => {
    const el = tpl.content.cloneNode(true);
    el.querySelector(".row").dataset.id = item.id;
    el.querySelector(".nombre").textContent = item.nombre;
    el.querySelector(".cientifico").textContent = item.cientifico || "—";
    el.querySelector(".familia").textContent = item.familia || "—";
    el.querySelector(".tipo").innerHTML = badge(item.tipo);
    const inSeason = inMonthRange(new Date(), item.siembra);
    el.querySelector(".siembra").innerHTML = (item.siembra || "—") + (item.siembra? ` <span class="flag ${inSeason? 'ok':'warn'}">${inSeason? 'en época':'fuera de época'}</span>` : "");
    if(inSeason) el.querySelector(".row").classList.add("inseason");
    el.querySelector(".germ").textContent = (item.germinacion||"—")+" días";
    el.querySelector(".profdist").textContent = (item.prof||"—")+"cm / "+(item.dist||"—")+"cm";
    el.querySelector(".riego").textContent = item.riego || "—";
    el.querySelector(".ubicacion").textContent = item.ubicacion || "—";
    el.querySelector(".stock").textContent = item.stock ?? "0";
    el.querySelector(".resp").textContent = item.responsable || "—";
    const [bEdit,bDel,bQR] = el.querySelectorAll(".icon-btn");
    bEdit.addEventListener("click", ()=>openEdit(item.id));
    bDel.addEventListener("click", ()=>remove(item.id));
    bQR.addEventListener("click", ()=>openQR(item));
    rows.appendChild(el);
  });

  renderChart();
  renderCalendar();
}
function badge(txt){
  const colors = { "Hortaliza":"ok", "Frutal":"ok", "Hierba/Aromática":"ok", "Flor":"warn", "Legumbre/Grano":"ok", "Nativo":"warn" };
  const cls = colors[txt] || "ok";
  return `<span class="badge ${cls}">${txt}</span>`;
}

function populateFamilias(){
  const sel = $("#f-familia");
  if(!sel) return;
  const cur = sel.value;
  const fams = Array.from(new Set(DB.map(s=>s.familia).filter(Boolean))).sort();
  sel.innerHTML = '<option value="">Familia (todas)</option>' + fams.map(f=>`<option ${f===cur?'selected':''}>${f}</option>`).join('');
}

function groupCount(arr,key){
  return arr.reduce((m,o)=> (m[o[key]]=(m[o[key]]||0)+1, m), {});
}

function filtered(arr){
  const q = $("#q").value.trim().toLowerCase();
  const tipo = $("#f-tipo").value;
  const ciclo = $("#f-ciclo").value;
  const familia = $("#f-familia").value;
  const epoca = $("#f-epoca").value;
  const cInv = $("#c-invernadero").checked;
  const cExt = $("#c-exterior").checked;
  const cPIE = $("#c-pie").checked;
  const cProp = $("#c-semilla-propia").checked;
  const cOrg = $("#c-organica").checked;

  return arr.filter(s => {
    if(q && !JSON.stringify(s).toLowerCase().includes(q)) return false;
    if(tipo && s.tipo !== tipo) return false;
    if(ciclo && s.ciclo !== ciclo) return false;
    if(familia && s.familia !== familia) return false;
    if(epoca==="siembra" && !inMonthRange(new Date(), s.siembra)) return false;
    if(epoca==="transplante" && !inMonthRange(new Date(), s.trasplante)) return false;
    if(cInv && !/invernadero/i.test(s.notas+s.reco+s.ubicacion)) return false;
    if(cExt && !/exterior|afuera|campo/i.test(s.notas+s.reco)) return false;
    if(cPIE && !s.pie) return false;
    if(cProp && !s.propia) return false;
    if(cOrg && !s.organica) return false;
    return true;
  });
}

// Calendario: mostrar próximos meses con conteo de siembras recomendadas
function renderCalendar(){
  const host = $("#calendar");
  host.innerHTML = "";
  const now = new Date();
  for(let i=0;i<6;i++){
    const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    const label = d.toLocaleDateString('es-CL', { month:'long', year:'numeric' });
    const count = DB.filter(s => inMonthRange(d, s.siembra)).length;
    const el = document.createElement("div");
    el.className = "slot";
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <strong>${label}</strong><span class="badge ${count? 'ok':'warn'}">${count} siembras</span>
    </div>`;
    host.appendChild(el);
  }
}

// Chart.js (from CDN) - graceful if not loaded
function renderChart(){
  const canvas = $("#chartTipos");
  if(!window.Chart){ canvas.replaceWith(document.createTextNode("")); return; }
  if(window._chart){ window._chart.destroy(); }
  const tipos = groupCount(DB,"tipo");
  window._chart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: { labels: Object.keys(tipos), datasets: [{ data: Object.values(tipos) }]},
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

// Épocas "sep-oct, mar-abr" → ¿incluye fecha dada?
const MES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
function inMonthRange(date, rango){
  if(!rango) return false;
  // soporta "sep-oct" o "mar-abr, sep-oct"
  const m = date.getMonth(); // 0-based
  return rango.split(",").some(part => {
    const [a,b] = part.trim().split("-");
    if(!a||!b) return false;
    const ia = MES.indexOf(a.trim().slice(0,3));
    const ib = MES.indexOf(b.trim().slice(0,3));
    if(ia<0||ib<0) return false;
    if(ia<=ib) return m>=ia && m<=ib; // dentro del año
    // envuelve fin de año (ej: nov-feb)
    return m>=ia || m<=ib;
  });
}

function isExpiring(s){
  const vida = parseFloat(s.vida||"0");
  if(!vida || !s.lote) return false;
  // lote como "2023-09" o fecha suelta
  const y = parseInt(String(s.lote).slice(0,4));
  if(isNaN(y)) return false;
  const expYear = y + vida;
  const nowY = new Date().getFullYear();
  return expYear - nowY <= 1; // caduca en <= 1 año
}

// CRUD
function openNew(){
  $("#modal-title").textContent = "Nueva semilla";
  $("#form").reset();
  $("#id").value = "";
  $("#modal").showModal();
}
function openEdit(id){
  const s = DB.find(x=>x.id===id);
  if(!s) return;
  $("#modal-title").textContent = "Editar semilla";
  for(const k in s){
    const el = $("#"+k);
    if(!el) continue;
    if(el.type==="checkbox"){ el.checked = !!s[k]; }
    else { el.value = s[k]; }
  }
  $("#modal").showModal();
}

function remove(id){
  if(!confirm("¿Eliminar esta semilla?")) return;
  DB = DB.filter(x=>x.id!==id);
  saveLocal(); render();
}

function openQR(item){
  // crea una URL con los datos serializados (para que la puedas convertir a QR con cualquier herramienta)
  const url = location.origin + location.pathname + "#seed=" + encodeURIComponent(JSON.stringify(item));
  navigator.clipboard.writeText(url).then(()=> alert("Enlace copiado al portapapeles. Puedes generar un QR con este enlace."));
}

// Form submit
$("#form").addEventListener("submit", (e)=>{
  e.preventDefault();
  const data = {};
  ["id","nombre","cientifico","familia","tipo","ciclo","siembra","trasplante","germinacion","temp","prof","dist","luz","riego","ubicacion","stock","lote","vida","responsable","curso","uso","asocia","anti","plagas","reco","notas"].forEach(id=>{
    data[id] = $("#"+id)?.value || "";
  });
  ["pie","organica","propia"].forEach(id=> data[id] = $("#"+id).checked );
  if(!data.nombre){ alert("Nombre es requerido"); return; }
  if(data.id){
    const i = DB.findIndex(x=>x.id===data.id);
    if(i>=0){ DB[i] = {...DB[i], ...data}; }
  }else{
    data.id = uid();
    DB.push(data);
  }
  saveLocal();
  $("#modal").close();
  render();
});

$("#btn-cancel").addEventListener("click", ()=> $("#modal").close());

// Actions
$("#btn-add").addEventListener("click", openNew);
$("#btn-aplicar").addEventListener("click", render);
$("#btn-reset").addEventListener("click", ()=>{ $("#q").value=""; $("#f-tipo").value=""; $("#f-ciclo").value=""; $("#f-epoca").value=""; $$(".filters input[type=checkbox]").forEach(c=>c.checked=false); render(); });

$("#btn-theme").addEventListener("click", ()=>{
  document.documentElement.classList.toggle("light");
});

$("#btn-import").addEventListener("click", ()=> $("#file-input").click());
$("#file-input").addEventListener("change", async (ev)=>{
  const file = ev.target.files[0];
  if(!file) return;
  const text = await file.text();
  const rows = fromCSV(text);
  // mapea claves si vienen con otros nombres
  rows.forEach(r=>{
    r.id = r.id || uid();
  });
  DB = rows;
  saveLocal(); render();
});

$("#btn-export").addEventListener("click", ()=>{
  if(!DB.length){ alert("No hay datos para exportar."); return; }
  const csv = toCSV(DB);
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "banco_semillas.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#btn-calendar").addEventListener("click", ()=>{
  alert("El calendario del panel izquierdo muestra las siembras recomendadas por mes (próximos 6 meses) según el campo 'Periodo de siembra' de cada semilla (ej: 'sep-oct, mar-abr').");
});

// Filters live
["q","f-tipo","f-familia","f-ciclo","f-epoca","c-invernadero","c-exterior","c-pie","c-semilla-propia","c-organica"].forEach(id=>{
  const el = $("#"+id);
  if(!el) return;
  el.addEventListener("input", render);
});

// Inicialización
(function init(){
  loadLocal();
  if(DB.length===0){
    fetch("data/seeds_sample.csv").then(r=>r.text()).then(text=>{
      DB = fromCSV(text).map(r=>({ ...r, id: uid() }));
      saveLocal(); render();
      // cargar Chart.js de CDN de forma perezosa
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
      document.body.appendChild(s);
    });
  }else{
    render();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    document.body.appendChild(s);
  }
})();


// === Accesibilidad y temas ===
(function(){
  const $ = (q)=>document.querySelector(q);
  const root = document.body;
  const LS = (k,v)=>v===undefined?localStorage.getItem(k):localStorage.setItem(k,v);

  // Apply saved prefs
  try{
    const prefs = JSON.parse(LS('a11y:prefs')||'{}');
    if(prefs.contrast) root.classList.add('is-contrast');
    if(prefs.readable) root.classList.add('is-readable');
    if(prefs.theme) root.classList.add(prefs.theme);
    if(prefs.fontSize) document.documentElement.style.fontSize = prefs.fontSize + 'px';
  }catch(e){}

  function save(){
    const prefs = {
      contrast: root.classList.contains('is-contrast'),
      readable: root.classList.contains('is-readable'),
      theme: (['theme-garden','theme-light','theme-dark'].find(t=>root.classList.contains(t)))||null,
      fontSize: parseFloat(getComputedStyle(document.documentElement).fontSize)
    };
    localStorage.setItem('a11y:prefs', JSON.stringify(prefs));
  }

  const incFont = ()=>{
    const cur = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const next = Math.min(cur+1, 22);
    document.documentElement.style.fontSize = next+'px';
    save();
  };
  const decFont = ()=>{
    const cur = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const next = Math.max(cur-1, 13);
    document.documentElement.style.fontSize = next+'px';
    save();
  };

  $('#a11y-contrast')?.addEventListener('click', ()=>{ root.classList.toggle('is-contrast'); save(); });
  $('#a11y-readable')?.addEventListener('click', ()=>{ root.classList.toggle('is-readable'); save(); });
  $('#a11y-font-plus')?.addEventListener('click', incFont);
  $('#a11y-font-minus')?.addEventListener('click', decFont);
  $('#a11y-theme-garden')?.addEventListener('click', ()=>{
    root.classList.remove('theme-light','theme-dark');
    root.classList.toggle('theme-garden');
    save();
  });
  $('#a11y-theme-light')?.addEventListener('click', ()=>{
    root.classList.remove('theme-garden','theme-dark');
    root.classList.add('theme-light');
    save();
  });
  $('#a11y-theme-dark')?.addEventListener('click', ()=>{
    root.classList.remove('theme-garden','theme-light');
    root.classList.remove('theme-light'); // ensure dark = default (no class)
    save();
  });
})();
