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


// === Daltonic & Reset ===
(function(){
  const root=document.body;
  const save=()=>{
    const prefs = {
      contrast: root.classList.contains('is-contrast'),
      readable: root.classList.contains('is-readable'),
      daltonic: root.classList.contains('is-daltonic'),
      theme: (['theme-garden','theme-light','theme-dark'].find(t=>root.classList.contains(t)))||null,
      fontSize: parseFloat(getComputedStyle(document.documentElement).fontSize)
    };
    localStorage.setItem('a11y:prefs', JSON.stringify(prefs));
  };
  document.querySelector('#a11y-daltonic')?.addEventListener('click', ()=>{
    root.classList.toggle('is-daltonic'); save();
  });
  document.querySelector('#a11y-reset')?.addEventListener('click', ()=>{
    root.classList.remove('is-contrast','is-readable','is-daltonic','theme-garden','theme-light','theme-dark');
    document.documentElement.style.fontSize = '';
    localStorage.removeItem('a11y:prefs');
  });
})();


  // Daltónicos (CVD) mode
  $('#a11y-cvd')?.addEventListener('click', ()=>{
    document.body.classList.toggle('is-cvd');
    save();
  });

  // Reset estilos
  $('#a11y-reset')?.addEventListener('click', ()=>{
    try{ localStorage.removeItem('a11y:prefs'); }catch(e){}
    const root = document.body;
    root.classList.remove('is-contrast','is-readable','theme-garden','theme-light','theme-dark','is-cvd');
    document.documentElement.style.fontSize = '';
  });


// === Tooltips móviles: botón de ayuda "?" ===
(function(){
  const labels = document.querySelectorAll('label[data-tip]');
  labels.forEach((lab)=>{
    if(lab.querySelector('.help-btn')) return;
    lab.style.position = lab.style.position || 'relative';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'help-btn';
    b.setAttribute('aria-label','Ayuda: ' + (lab.textContent || '').trim());
    b.setAttribute('aria-expanded','false');
    b.textContent = '?';
    b.addEventListener('click', (e)=>{
      e.stopPropagation();
      const open = lab.getAttribute('data-tip-open') === '1';
      // Cerrar otros
      document.querySelectorAll('label[data-tip][data-tip-open="1"]').forEach(el=>{
        el.setAttribute('data-tip-open','0');
        const hb = el.querySelector('.help-btn');
        hb && hb.setAttribute('aria-expanded','false');
      });
      lab.setAttribute('data-tip-open', open ? '0' : '1');
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    b.addEventListener('blur', ()=>{
      setTimeout(()=>{
        if(!lab.contains(document.activeElement)){
          lab.setAttribute('data-tip-open','0');
          b.setAttribute('aria-expanded','false');
        }
      }, 50);
    });
    lab.prepend(b);
  });

  document.addEventListener('click', ()=>{
    document.querySelectorAll('label[data-tip][data-tip-open="1"]').forEach(el=>{
      el.setAttribute('data-tip-open','0');
      const hb = el.querySelector('.help-btn');
      hb && hb.setAttribute('aria-expanded','false');
    });
  }, { capture: true });
})();


// === Tooltips móviles también para botones ===
(function(){
  const buttons = document.querySelectorAll('.actions .btn[data-tip]');
  buttons.forEach((btn)=>{
    if(btn.querySelector('.help-btn')) return;
    btn.style.position = btn.style.position || 'relative';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'help-btn';
    b.setAttribute('aria-label','Ayuda: ' + (btn.textContent || '').trim());
    b.setAttribute('aria-expanded','false');
    b.textContent = '?';
    b.addEventListener('click', (e)=>{
      e.stopPropagation();
      const open = btn.getAttribute('data-tip-open') === '1';
      document.querySelectorAll('.actions .btn[data-tip][data-tip-open="1"]').forEach(el=>{
        el.setAttribute('data-tip-open','0');
        const hb = el.querySelector('.help-btn');
        hb && hb.setAttribute('aria-expanded','false');
      });
      btn.setAttribute('data-tip-open', open ? '0' : '1');
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    b.addEventListener('blur', ()=>{
      setTimeout(()=>{
        if(!btn.contains(document.activeElement)){
          btn.setAttribute('data-tip-open','0');
          b.setAttribute('aria-expanded','false');
        }
      }, 50);
    });
    btn.appendChild(b);
  });
  document.addEventListener('click', ()=>{
    document.querySelectorAll('.actions .btn[data-tip][data-tip-open="1"]').forEach(el=>{
      el.setAttribute('data-tip-open','0');
      const hb = el.querySelector('.help-btn');
      hb && hb.setAttribute('aria-expanded','false');
    });
  }, { capture: true });
})();


// === Tooltips móviles para botones del dashboard ===
(function(){
  const act = document.querySelector('.actions');
  if(!act) return;
  const isTouch = matchMedia('(hover: none)').matches;
  const buttons = act.querySelectorAll('.btn[data-tip]');
  buttons.forEach(btn=>{
    // Wrap
    if(btn.parentElement && btn.parentElement.classList.contains('btn-wrap')) return;
    const wrap = document.createElement('span');
    wrap.className = 'btn-wrap';
    btn.parentElement.insertBefore(wrap, btn);
    wrap.appendChild(btn);
    // Mini help button
    const hb = document.createElement('button');
    hb.type = 'button';
    hb.className = 'help-btn-mini';
    hb.setAttribute('aria-label','Ayuda: ' + (btn.textContent||'').trim());
    hb.setAttribute('aria-expanded','false');
    hb.textContent = '?';
    wrap.appendChild(hb);
    hb.addEventListener('click', (e)=>{
      e.stopPropagation();
      const open = btn.getAttribute('data-tip-open') === '1';
      // close others
      act.querySelectorAll('.btn[data-tip][data-tip-open="1"]').forEach(b=>{
        b.setAttribute('data-tip-open','0');
      });
      btn.setAttribute('data-tip-open', open ? '0' : '1');
      hb.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });
  // Close on outside click
  document.addEventListener('click', ()=>{
    act.querySelectorAll('.btn[data-tip][data-tip-open="1"]').forEach(b=> b.setAttribute('data-tip-open','0'));
  }, { capture:true });
})();


// === Gestión de Asignaciones, Etiquetas, Calendario y Viabilidad ===
(function(){
  const $ = (q)=>document.querySelector(q);
  const $$ = (q)=>document.querySelectorAll(q);

  // Fuente de verdad: las filas (semillas) están en memoria en app.js (supone que ya existen funciones de carga)
  // Usaremos window._seeds como almacén simple si no existe
  window._seeds = window._seeds || [];

  // Viabilidad: estima % en base a 'vida' (años) y 'lote' (AAAA-MM o AAAA-MM-DD)
  function viability(seed){
    const vida = parseFloat(seed.vida||"0")||0;
    if(!vida) return {pct: 100, cls:'ok', hint:'sin vida útil definida'};
    const lote = (seed.lote||'').trim();
    let since = null;
    const m = lote.match(/(\d{4})([-/](\d{2}))?([-/](\d{2}))?/);
    if(m){
      const y = +m[1], mo = m[3]? (+m[3]-1):0, d = m[5]? +m[5]:1;
      since = new Date(y, mo, d);
    }
    if(!since) return {pct: 100, cls:'ok', hint:'sin fecha válida'};
    const now = new Date();
    const years = (now - since)/(365.25*24*3600*1000);
    let pct = Math.max(5, Math.round(100 * Math.max(0, (vida - years)) / Math.max(vida, 0.01)));
    let cls = pct>=70?'ok': pct>=40?'mid':'low';
    return {pct, cls, hint:`${pct}% estimado`};
  }

  // Render viabilidad en la tabla principal si existe #rows
  const rowsEl = $('#rows');
  if(rowsEl){
    const observer = new MutationObserver(()=>{
      rowsEl.querySelectorAll('.row').forEach(r=>{
        if(r.dataset.viabBound) return;
        const id = r.getAttribute('data-id');
        const seed = window._seeds.find(s=>String(s.id)===String(id));
        if(!seed) return;
        const badge = document.createElement('span');
        const v = viability(seed);
        badge.className = `badge ${v.cls}`;
        badge.title = 'Viabilidad estimada según vida útil y fecha de lote';
        badge.textContent = `Viabilidad ${v.pct}%`;
        // Insert after nombre (assume name in column index 1)
        const nameCell = r.children[1];
        nameCell && nameCell.appendChild(document.createTextNode(' '));
        nameCell && nameCell.appendChild(badge);
        r.dataset.viabBound = '1';
      });
    });
    observer.observe(rowsEl, {childList:true});
  }

  // === Asignaciones ===
  const asig = JSON.parse(localStorage.getItem('asignaciones')||'[]');
  function saveAsign(){ localStorage.setItem('asignaciones', JSON.stringify(asig)); }
  function addAsignacion(seed, cantidad){
    const item = {
      fecha: new Date().toISOString().slice(0,10),
      nombre: seed.nombre||'',
      responsable: seed.responsable||'',
      curso: seed.curso||'',
      uso: seed.uso||'',
      cantidad: cantidad||1
    };
    asig.push(item); saveAsign();
    renderAsignaciones();
  }
  function renderAsignaciones(){
    const rows = $('#asig-rows'); if(!rows) return;
    rows.innerHTML='';
    const fprof = ($('#flt-prof')?.value||'').toLowerCase();
    const fcurso = ($('#flt-curso')?.value||'').toLowerCase();
    const fuso = ($('#flt-uso')?.value||'').toLowerCase();
    asig.filter(a=>
      (!fprof || a.responsable.toLowerCase().includes(fprof)) &&
      (!fcurso || a.curso.toLowerCase().includes(fcurso)) &&
      (!fuso || a.uso.toLowerCase().includes(fuso))
    ).forEach(a=>{
      const row = document.createElement('div'); row.className='row';
      row.innerHTML = `<div>${a.fecha}</div>
        <div>${a.nombre}</div>
        <div>${a.responsable||'-'}</div>
        <div>${a.curso||'-'}</div>
        <div>${a.uso||'-'}</div>
        <div class="qty">${a.cantidad||1}</div>
        <div><button class="btn grad-orange btn-sm" data-action="undo">↩️ Deshacer</button></div>`;
      row.querySelector('[data-action="undo"]').addEventListener('click', ()=>{
        const idx = asig.indexOf(a);
        if(idx>-1){ asig.splice(idx,1); saveAsign(); renderAsignaciones(); }
      });
      rows.appendChild(row);
    });
  }
  $('#flt-prof')?.addEventListener('input', renderAsignaciones);
  $('#flt-curso')?.addEventListener('input', renderAsignaciones);
  $('#flt-uso')?.addEventListener('input', renderAsignaciones);
  $('#btn-exp-asig')?.addEventListener('click', ()=>{
    const headers = ['fecha','nombre','responsable','curso','uso','cantidad'];
    const csv = [headers.join(',')].concat(asig.map(a=>headers.map(h=>`"${String(a[h]||'').replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `asignaciones_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  });
  renderAsignaciones();

  // Hook: botón en la tabla principal para "Entregar/Reservar" si existe
  // Agrega un mini botón en cada fila con id data-id
  if(rowsEl){
    const obs2 = new MutationObserver(()=>{
      rowsEl.querySelectorAll('.row').forEach(r=>{
        if(r.dataset.asigBound) return;
        const id = r.getAttribute('data-id');
        const seed = window._seeds.find(s=>String(s.id)===String(id));
        if(!seed) return;
        const cellActions = r.lastElementChild;
        if(cellActions){
          const btn = document.createElement('button');
          btn.className = 'btn grad-blue btn-sm';
          btn.textContent = '🎒 Entregar';
          btn.title = 'Registrar entrega / reserva para una actividad';
          btn.addEventListener('click', ()=>{
            const cant = Math.max(1, parseInt(prompt('Cantidad a entregar:', '1')||'1',10));
            addAsignacion(seed, cant);
            // Update stock if number
            const st = parseInt(seed.stock||'0',10);
            if(!isNaN(st)){ seed.stock = Math.max(0, st - cant); }
          });
          cellActions.appendChild(btn);
        }
        r.dataset.asigBound='1';
      });
    });
    obs2.observe(rowsEl, {childList:true});
  }

  // === Etiquetas con QR ===
  function makeQRUrl(text, size){ // usa servicio público por ahora
    const u = 'https://api.qrserver.com/v1/create-qr-code/?size='+encodeURIComponent(size+'x'+size)+'&data='+encodeURIComponent(text);
    return u;
  }
  function renderEtiquetas(seeds){
    const cont = $('#etq-preview'); if(!cont) return;
    cont.innerHTML='';
    seeds.forEach(s=>{
      const wrap = document.createElement('div'); wrap.className='label-card';
      const info = document.createElement('div');
      const sci = s.cientifico? `<small><em>${s.cientifico}</em></small>`:'';
      const ubic = s.ubicacion? `<small>Ubicación: ${s.ubicacion}</small>`:'';
      info.innerHTML = `<div class="name">${s.nombre||'(sin nombre)'}</div>${sci}${ubic}`;
      const qr = document.createElement('div'); qr.className='qr';
      const img = document.createElement('img');
      const payload = `seed:${s.id||''}|${s.nombre||''}|${s.cientifico||''}`;
      img.src = makeQRUrl(payload, 120);
      img.alt = 'QR '+(s.nombre||'');
      qr.appendChild(img);
      wrap.appendChild(info); wrap.appendChild(qr);
      cont.appendChild(wrap);
    });
    window.print(); // abre diálogo de impresión directo
  }
  $('#btn-etq-seleccion')?.addEventListener('click', ()=>{
    const selected = (window._seeds||[]).filter(s=>s._selected);
    if(selected.length===0){ alert('No hay semillas seleccionadas. Selecciona alguna en la tabla.'); return; }
    renderEtiquetas(selected);
  });
  $('#btn-etq-todas')?.addEventListener('click', ()=> renderEtiquetas(window._seeds||[]) );

  // === Calendario de siembras ===
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  function parseMeses(str){
    // soporta "sep-oct, mar-abr" etc.
    const map = {ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11};
    const arr = new Array(12).fill(false);
    (str||'').split(',').map(s=>s.trim()).forEach(tok=>{
      if(!tok) return;
      const m = tok.toLowerCase().match(/([a-záéíóú]{3})\s*-\s*([a-záéíóú]{3})/);
      if(m){
        let a = map[m[1].normalize('NFD').replace(/[\u0300-\u036f]/g,'')]; 
        let b = map[m[2].normalize('NFD').replace(/[\u0300-\u036f]/g,'')];
        if(a!=null && b!=null){
          let i=a; while(true){
            arr[i]=true; if(i==b) break; i=(i+1)%12;
            if(i==a) break;
          }
        }
      }else{
        const k = map[tok.normalize('NFD').replace(/[\u0300-\u036f]/g,'')];
        if(k!=null) arr[k]=true;
      }
    });
    return arr;
  }
  function renderCalendario(){
    const grid = $('#cal-grid'); if(!grid) return;
    grid.innerHTML='';
    const q = ($('#cal-buscar')?.value||'').toLowerCase();
    const seeds = (window._seeds||[]).filter(s=>!q || (s.nombre||'').toLowerCase().includes(q));
    // encabezado
    const hdr = document.createElement('div'); hdr.className='row';
    for(let i=0;i<12;i++){ const m=document.createElement('div'); m.className='month'; m.textContent=meses[i]; grid.appendChild(m); }
    seeds.forEach(s=>{
      const arr = parseMeses(s.siembra||'');
      arr.forEach((on, i)=>{
        const d = document.createElement('div');
        d.className = 'chip ' + (on?'chip-on':'chip-off');
        d.textContent = (s.nombre||''); if(!on) d.textContent='';
        d.title = (s.nombre||'') + (on?': recomendado':''); 
        grid.appendChild(d);
      });
    });
  }
  $('#cal-buscar')?.addEventListener('input', renderCalendario);
  $('#btn-cal-ics')?.addEventListener('click', ()=>{
    // Por ahora, un evento por mes "on" con recordatorio 7 días antes
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//BancoSemillas//ES\n";
    (window._seeds||[]).forEach(s=>{
      const arr = parseMeses(s.siembra||'');
      arr.forEach((on, i)=>{
        if(!on) return;
        const year = new Date().getFullYear();
        const dt = `${year}${String(i+1).padStart(2,'0')}01`;
        ics += "BEGIN:VEVENT\n";
        ics += "UID:" + (s.id||Math.random()).toString().replace(/\W/g,'')+"-"+i+"@bsem\n";
        ics += "DTSTART;VALUE=DATE:"+dt+"\n";
        ics += "SUMMARY:Siembra — "+(s.nombre||'')+"\n";
        ics += "DESCRIPTION:"+ (s.reco||'')+"\n";
        ics += "BEGIN:VALARM\nTRIGGER:-P7D\nACTION:DISPLAY\nDESCRIPTION:Recordatorio siembra "+(s.nombre||'')+"\nEND:VALARM\n";
        ics += "END:VEVENT\n";
      });
    });
    ics += "END:VCALENDAR";
    const blob = new Blob([ics], {type:'text/calendar;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "siembras.ics";
    a.click();
  });

  // Inicializa render de calendario al cargar
  document.addEventListener('DOMContentLoaded', renderCalendario);
})();
