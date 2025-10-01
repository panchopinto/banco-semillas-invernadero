
(function(){
  const host = document.getElementById('bs-dashboard-root');
  if(!host) return;
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `<style>
:host{all:initial; display:block; font-family: Inter, system-ui, Segoe UI, Roboto, Arial, sans-serif;}
*{box-sizing:border-box}
:host{--bg:#0d0f1a; --text:#ecf2f8; --muted:#9bb2c0; --card:#12172a; --panel:#0f1324; --line:#28314a;
--g-green:linear-gradient(135deg,#00e676,#31ffa6);
--g-blue:linear-gradient(135deg,#4f86ff,#5ad1ff);
--g-orange:linear-gradient(135deg,#ff8a00,#ffc13b);
--g-pink:linear-gradient(135deg,#ff3d81,#ff7eb3);
--g-purple:linear-gradient(135deg,#7a5cff,#a07bff);
--danger:#ff4d6d;}
.container{color:var(--text); background:transparent}
.topbar{ display:flex; align-items:center; justify-content:space-between; gap:1rem;
  padding:.6rem 0; border-bottom:1px solid #1f2742; }
.brand{display:flex; gap:.6rem; align-items:center}
.logo{width:26px; height:26px; border-radius:8px; background: conic-gradient(from 180deg,#00e676,#4f86ff,#ff8a00,#ff3d81,#7a5cff,#00e676)}
.brand h1{font-size:1rem; margin:0}
.subtitle{margin:.1rem 0 0; color:var(--muted); font-size:.8rem}
.actions-right{display:flex; align-items:center; gap:.6rem}
input[type="search"]{ width:min(42vw,420px); background:#0e1425; border:1px solid #273055; color:var(--text); padding:.5rem .7rem; border-radius:10px; outline:none }
.tabs{ display:flex; gap:.5rem; padding:.5rem 0; flex-wrap:wrap }
.tab{ display:inline-flex; align-items:center; gap:.5rem; padding:.45rem .7rem; border:1px solid #263259; border-radius:10px; background:#141b34; color:#dbe8ff; cursor:pointer; font-weight:700 }
.tab .ico{width:16px; height:16px; display:inline-block; border-radius:4px; background:#ffffffaa}
.tab.active{box-shadow:0 6px 18px rgba(47,74,200,.35), inset 0 1px 0 rgba(255,255,255,.08); border-color:#4b63b8}
.ico-seed{background-image: linear-gradient(135deg,#31ffa6,#00e676)}
.ico-calendar{background-image: linear-gradient(135deg,#4f86ff,#5ad1ff)}
.ico-report{background-image: linear-gradient(135deg,#ff8a00,#ffc13b)}
.ico-settings{background-image: linear-gradient(135deg,#7a5cff,#a07bff)}
.btn{display:inline-flex; align-items:center; gap:.45rem; padding:.5rem .8rem; border-radius:10px; border:1px solid #263259; color:#0a1225; font-weight:800}
.ghost{background:#0e1425; color:#cfe3ff}
.grad-green{background: var(--g-green)}
.grad-blue{background: var(--g-blue)}
.grad-orange{background: var(--g-orange)}
.grad-pink{background: var(--g-pink)}
.grad-purple{background: var(--g-purple)}
.kpis{display:grid; gap:.6rem; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); padding:.4rem 0}
.kpi{display:flex; gap:.6rem; align-items:center; padding:.6rem; border-radius:12px; color:#07131d; box-shadow:0 10px 24px rgba(0,0,0,.2)}
.kpi-title{font-weight:800; font-size:.85rem}
.kpi-value{font-weight:900; font-size:1.2rem}
.view{display:none}
.view.active{display:block}
.toolbar{display:flex; align-items:center; justify-content:space-between; gap:1rem; margin:.5rem 0 .8rem}
.filters{display:flex; gap:.4rem; flex-wrap:wrap}
.filters select, .filters button{background:#0e1425; border:1px solid #273055; color:#ecf2f8; padding:.45rem .6rem; border-radius:8px}
.count{color:var(--muted); margin:.2rem 0 .4rem}
.grid{display:grid; gap:.8rem; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))}
.card{ background: linear-gradient(180deg, #131a2f, #0e1425); border:1px solid #263259; border-radius:14px; padding:.8rem; box-shadow:0 10px 24px rgba(0,0,0,.24) }
.card .header{display:flex; align-items:center; justify-content:space-between; gap:.6rem}
.title{font-weight:800; margin:0}
.badge{display:inline-flex; gap:.35rem; align-items:center; padding:.18rem .5rem; border-radius:999px; font-size:.76rem; background:#14213a; color:#d2e6ff; border:1px solid #30406b}
.tags{display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.35rem}
.pill{display:inline-flex; gap:.35rem; align-items:center; padding:.18rem .5rem; border-radius:999px; font-size:.75rem; background:#15223f; border:1px solid #2b3f6c}
.empty{padding:1rem; border:1px dashed #2a3560; border-radius:12px; text-align:center; color:var(--muted)}
.card .actions{display:flex; gap:.4rem; margin-top:.5rem; justify-content:flex-end}
.btn-delete{background:#ff4d6d; color:white; border-color:#8b1f33}
.btn-detail{background:#2a3560; color:#dfe9ff; border-color:#2a3560}
.btn-qr{background:#31ffa6; color:#072417; border-color:#0b5d40}
#tableWrap{padding:.5rem 0}
table{width:100%; border-collapse:separate; border-spacing:0 .4rem}
th, td{background:#0e1425; border:1px solid #273055; padding:.45rem .55rem}
th{position:sticky; top:0; background:#111a33; z-index:1}
td:first-child, th:first-child{border-top-left-radius:8px; border-bottom-left-radius:8px}
td:last-child, th:last-child{border-top-right-radius:8px; border-bottom-right-radius:8px}
.grid-6{display:grid; grid-template-columns:repeat(6,1fr); gap:.5rem}
.cell{background:#0f162b; border:1px solid #27325a; border-radius:12px; padding:.55rem}
.cell h4{margin:.1rem 0 .35rem; font-size:1rem}
.cell .tag{display:inline-block; background:#1a2542; border:1px solid #2c4277; color:#d5e3ff; border-radius:999px; padding:.16rem .46rem; font-size:.72rem; margin:.15rem .2rem 0 0}
#detailDrawer{position:fixed; inset:0; display:none; background:rgba(0,0,0,.45)}
#detailDrawer.open{display:block}
.drawer{position:absolute; right:0; top:0; bottom:0; width:min(720px, 96vw); background:#0f162b; border-left:1px solid #27325a; box-shadow:-20px 0 40px rgba(0,0,0,.5); padding:1rem}
.drawer header{display:flex; align-items:center; justify-content:space-between; margin-bottom:.6rem}
.drawer-body{display:grid; gap:.5rem}
.drawer .row{display:flex; gap:.5rem; justify-content:space-between; border-bottom:1px dashed #27325a; padding:.35rem 0}
dialog{border:none; padding:0; border-radius:14px; background:#0f162b; color:var(--text); box-shadow:0 20px 60px rgba(0,0,0,.5)}
.modal{min-width:min(92vw, 980px); padding:1rem}
.modal header{display:flex; align-items:center; gap:.6rem; margin-bottom:.6rem}
.grid-2{display:grid; grid-template-columns:1fr 1fr; gap:.7rem}
.grid-2 .full{grid-column:1 / span 2}
label{display:flex; flex-direction:column; gap:.35rem; font-size:.92rem}
input, textarea, select{background:#0e1425; border:1px solid #273055; color:var(--text); padding:.6rem .75rem; border-radius:10px}
.form-error{color:#ffb0b0; margin-top:.5rem}
.modal-actions{display:flex; justify-content:flex-end; gap:.6rem; margin-top:.8rem}
.hidden{display:none !important}
.footer{padding:.6rem 0; color:var(--muted); text-align:center}
mark.find{background:#ffc13b55; border-radius:4px; padding:0 .15rem}

.kpis{display:grid; gap:.6rem; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); padding:.4rem 0}
.kpi{display:flex; flex-direction:column; border:1px solid #22304f; border-radius:10px; background:#0f1426; box-shadow:0 6px 14px rgba(0,0,0,.18); padding:0}
.kpi .kpi-head{display:flex; align-items:center; justify-content:space-between; padding:.35rem .5rem; border-bottom:1px solid #22304f; border-top-left-radius:10px; border-top-right-radius:10px}
.kpi .kpi-title{font-weight:800; font-size:.82rem; color:#e5edfa}
.kpi .kpi-icon{font-size:1.05rem; opacity:.9}
.kpi .kpi-body{padding:.45rem .55rem}
.kpi .kpi-value{font-weight:900; font-size:1.15rem; color:#ffffff}
.kpi.theme-green .kpi-head{background:#133a2f}
.kpi.theme-blue .kpi-head{background:#132e4a}
.kpi.theme-orange .kpi-head{background:#3a2a13}

</style> <div class="container">
  <header class="topbar">
    <div class="brand"><div class="logo"></div><div><h1>Banco de Semillas</h1><p class="subtitle">Invernadero • Gestión y seguimiento</p></div></div>
    <div class="actions-right"><input id="search" type="search" placeholder="🔎 Buscar por nombre, especie, etiqueta…" aria-label="Buscar" /><button class="btn ghost" id="refreshBtn" title="Actualizar desde CSV" aria-label="Actualizar">↻</button></div>
  </header>
  <nav class="tabs"><button class="tab active" data-view="inventario"><span class="ico ico-seed"></span> Inventario</button><button class="tab" data-view="calendario"><span class="ico ico-calendar"></span> Calendario</button><button class="tab" data-view="reportes"><span class="ico ico-report"></span> Reportes</button><button class="tab" data-view="config"><span class="ico ico-settings"></span> Configuración</button></nav>
  <section class="kpis" id="kpis">
    <div class="kpi grad-green"><div class="kpi-icon">📦</div><div class="kpi-body"><div class="kpi-title">Variedades</div><div class="kpi-value" id="kpi-variedades">—</div></div></div>
    <div class="kpi grad-blue"><div class="kpi-icon">📊</div><div class="kpi-body"><div class="kpi-title">Stock total</div><div class="kpi-value" id="kpi-stock">—</div></div></div>
    <div class="kpi grad-orange"><div class="kpi-icon">⏳</div><div class="kpi-body"><div class="kpi-title">Próx. a caducar</div><div class="kpi-value" id="kpi-caducar">—</div></div></div>
  </section>
  <main>
    <section class="view active" id="view-inventario">
      <div class="toolbar">
        <div class="left">
          <button class="btn grad-green" id="addSeedBtn">➕ Añadir</button>
          <input id="filePicker" type="file" accept=".csv,text/csv" hidden>
          <button class="btn grad-blue" id="importBtn">📥 Importar CSV</button>
          <button class="btn grad-orange" id="exportBtn">📤 Exportar</button>
          <button class="btn grad-purple" id="toggleViewBtn">🧭 Tabla</button>
        </div>
        <div class="right">
          <div class="filters">
            <select id="filterTipo"><option value="">Tipo</option><option>Hoja</option><option>Fruto</option><option>Flor</option><option>Raíz</option><option>Bulbo</option></select>
            <select id="filterCiclo"><option value="">Ciclo</option><option>Anual</option><option>Bianual</option><option>Perenne</option></select>
            <select id="filterEpoca"><option value="">Época</option><option>Primavera</option><option>Verano</option><option>Otoño</option><option>Invierno</option></select>
            <select id="filterEtiqueta"><option value="">Etiqueta</option><option>PIE</option><option>orgánica</option><option>semilla propia</option></select>
            <button class="btn ghost" id="clearFilters">♻️ Limpiar</button>
          </div>
        </div>
      </div>
      <div id="seed-count" class="count"></div>
      <div id="seed-grid" class="grid"></div>
      <div id="empty" class="empty hidden">Sin resultados para tu búsqueda / filtros.</div>
      <div id="tableWrap" class="hidden">
        <table class="table" id="seed-table" aria-label="Tabla de semillas">
          <thead><tr><th>QR</th><th>Nombre</th><th>Científico</th><th>Tipo</th><th>Periodos</th><th>Germinación</th><th>Prof./Dist.</th><th>Riego</th><th>Ubicación</th><th>Stock</th><th>Responsable</th><th>Acciones</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>
    <section class="view" id="view-calendario">
      <div class="card"><div class="cal-header"><h2>📅 Siembras sugeridas — próximos 6 meses</h2></div><div id="calGrid" class="grid-6"></div></div>
    </section>
    <section class="view" id="view-reportes">
      <div class="card"><h2>📊 Reportes</h2><p>Exporta CSV del inventario actual o imprime la vista.</p><div class="actions"><button class="btn grad-purple" id="downloadCSV">📤 Exportar CSV</button><button class="btn grad-pink" id="printView">🖨️ Imprimir</button></div></div>
    </section>
    <section class="view" id="view-config">
      <div class="card"><h2>⚙️ Configuración</h2><p>Reemplaza la URL del CSV por tu Google Sheets publicado:</p><pre class="code">const CSV_URL = "data/seeds.csv";</pre><label><input type="checkbox" id="readonlyToggle"> Modo solo lectura</label></div>
    </section>
  </main>
  <aside id="detailDrawer" aria-hidden="true"><div class="drawer"><header><h3 id="detailTitle">Ficha de semilla</h3><button id="closeDrawer" class="btn ghost">Cerrar</button></header><div id="detailBody" class="drawer-body"></div></div></aside>
  <dialog id="seedModal"><form method="dialog" class="modal" id="seedForm" novalidate>
    <header><h3 id="modalTitle">➕ Semilla</h3></header>
    <div class="grid-2">
      <label>Nombre<input required name="name" /></label>
      <label>Especie<input name="species" /></label>
      <label>Tipo<select name="type"><option></option><option>Hoja</option><option>Fruto</option><option>Flor</option><option>Raíz</option><option>Bulbo</option></select></label>
      <label>Ciclo<select name="cycle"><option></option><option>Anual</option><option>Bianual</option><option>Perenne</option></select></label>
      <label>Germinación mín (días)<input type="number" min="0" name="gmin" value="5"/></label>
      <label>Germinación máx (días)<input type="number" min="0" name="gmax" value="10"/></label>
      <label>Profundidad siembra<input name="depth" placeholder="mm/cm"/></label>
      <label>Distancia plantas<input name="spacing" placeholder="cm"/></label>
      <label>Riego<input name="watering" placeholder="bajo/medio/alto"/></label>
      <label>Ubicación<input name="location" placeholder="invernadero, cantero A, etc."/></label>
      <label>Stock<input type="number" min="0" name="stock" value="0"/></label>
      <label>Periodo siembra<input name="periodo_siembra" placeholder="Ene-Feb, Sep-Nov"/></label>
      <label>Periodo trasplante<input name="periodo_trasplante" placeholder="Meses"/></label>
      <label>Interior<input type="checkbox" name="indoor" checked/></label>
      <label>Exterior<input type="checkbox" name="outdoor" checked/></label>
      <label class="full">Siembra<textarea name="sowing" rows="2" placeholder="Cómo sembrar…"></textarea></label>
      <label class="full">Notas<input name="notes" placeholder="separadas por coma"/></label>
      <label class="full">Etiquetas<input name="tags" placeholder="PIE, orgánica, semilla propia"/></label>
      <label>Profesor responsable<input name="responsable" /></label>
      <label>Curso/Proyecto<input name="curso" /></label>
      <label class="full">Uso previsto<textarea name="uso" rows="2"></textarea></label>
    </div>
    <footer class="modal-actions"><button class="btn ghost" value="cancel">Cancelar</button><button class="btn grad-green" id="saveSeedBtn" value="default">Guardar</button></footer>
    <p class="form-error hidden" id="formError">Revisa los campos obligatorios.</p>
  </form></dialog>
  <div class="footer"><small>© Banco de Semillas — Liceo Bicentenario San Nicolás.</small></div>
</div>`;

  const $ = (q,root=shadow)=>root.querySelector(q);
  const $$ = (q,root=shadow)=>[...root.querySelectorAll(q)];
  const CSV_URL = "data/seeds.csv";

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
      if(!normalize(s.periodo_siembra).includes(normalize(state.filters.epoca))) return false;
    }
    const q = normalize(state.query);
    if(q && !haystack(s).includes(q)) return false;
    return true;
  }

  function computeKPIs(list){
    const variedades = list.length;
    const stock = list.reduce((a,s)=>a + (Number(s.stock)||0),0);
    const soon = list.filter(s=>{
      const hit = (s.notes||[]).find(n=>/vence\s*:\s*\d{4}-\d{2}/i.test(n));
      if(hit){ 
        const m = hit.match(/(\d{4})-(\d{2})/); 
        if(m){ 
          const exp = new Date(Number(m[1]), Number(m[2])-1, 1);
          const now = new Date(); const diff = (exp - now) / (1000*60*60*24*30);
          return diff >= 0 && diff <= 3;
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
    computeKPIs(currentSeeds());
    renderGrid(list);
    renderTable(list);
    renderCalendar(currentSeeds());
    $('#seed-count').textContent = `${list.length} semillas mostradas de ${currentSeeds().length}`;
  }

  function cardTemplate(s){
    const key = makeKey(s);
    return `
    <article class="card">
      <div class="header"><h3 class="title">${s.name}</h3><span class="badge">${s.germination.days_min}-${s.germination.days_max} días</span></div>
      <p><strong>Especie:</strong> ${s.species||'—'}</p>
      <p><strong>Tipo/Ciclo:</strong> ${s.type||'—'} / ${s.cycle||'—'}</p>
      <p><strong>Época siembra:</strong> ${s.periodo_siembra||'—'}</p>
      <div class="tags">${(s.tags||[]).map(t=>`<span class="pill">${t}</span>`).join('')}</div>
      <div class="actions">
        <button class="btn btn-detail" data-key="${key}">🔎 Detalle</button>
        <button class="btn btn-qr" data-key="${key}">🎯 QR</button>
        <button class="btn btn-delete" data-key="${key}">🗑️ Borrar</button>
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
        <td><button class="btn btn-detail" data-key="${key}">🔎</button><button class="btn btn-delete" data-key="${key}">🗑️</button></td>
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
    $('#detailDrawer').classList.add('open'); $('#detailDrawer').setAttribute('aria-hidden','false');
  }
  $('#closeDrawer').addEventListener('click', ()=>{ $('#detailDrawer').classList.remove('open'); $('#detailDrawer').setAttribute('aria-hidden','true'); });
  $('#detailDrawer').addEventListener('click', (e)=>{ if(e.target.id==='detailDrawer') $('#closeDrawer').click(); });

  function copyQR(key){
    const s = currentSeeds().find(x=>makeKey(x)===key); if(!s) return;
    const base = location.origin + location.pathname.replace(/\/[^\/]*$/, '/');
    const url = s.qr ? s.qr : (base + `?q=${encodeURIComponent(s.name)}`);
    navigator.clipboard.writeText(url).then(()=> console.warn("Enlace QR copiado: " + url));
  }

  function onDelete(key){
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
        name: f.name.value.trim(), species: f.species.value.trim(), type: f.type.value.trim(), cycle: f.cycle.value.trim(),
        periodo_siembra: f.periodo_siembra.value.trim(), periodo_trasplante: f.periodo_trasplante.value.trim(),
        germination: { days_min: Number(f.gmin.value||0), days_max: Number(f.gmax.value||0) },
        depth: f.depth.value.trim(), spacing: f.spacing.value.trim(), watering: f.watering.value.trim(), location: f.location.value.trim(),
        stock: Number(f.stock.value||0), responsable: f.responsable.value.trim(), curso: f.curso.value.trim(), uso: f.uso.value.trim(),
        grow: { indoor: !!f.indoor.checked, outdoor: !!f.outdoor.checked }, sowing: f.sowing.value.trim(),
        notes: f.notes.value.split(',').map(s=>s.trim()).filter(Boolean), tags: f.tags.value.split(',').map(s=>s.trim()).filter(Boolean), qr: ""
      };
      if(seed){ state.overlay.push({__op:"delete", key: makeKey(seed)}); }
      state.overlay.push({__op:"add", seed: seedNew});
      saveOverlay(); dlg.close(); renderAll();
    };
  }
  function setupAddEdit(){
    $('#addSeedBtn').addEventListener('click', ()=>openModal(null));
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
      saveOverlay(); renderAll(); console.warn(`Importadas ${rows.length} semillas (en memoria).`);
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
  function setupReadonly(){ const t = $('#readonlyToggle'); if(t){ t.addEventListener('change', ()=>{ state.readonly = t.checked; applyReadonly(); }); } }
  function applyReadonly(){ $('#addSeedBtn')?.classList.toggle('hidden', state.readonly); $$('.btn-delete').forEach(b=>b.classList.toggle('hidden', state.readonly)); }
  function setupBasic(){ $('#printView').addEventListener('click', ()=>window.print()); }
  function setupTabs(){ $$('.tab').forEach(btn=>btn.addEventListener('click', ()=>{ $$('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const v=btn.dataset.view; $$('.view').forEach(x=>x.classList.remove('active')); $('#view-'+v).classList.add('active'); })); }

  // Calendar (next 6 months)
  function renderCalendar(all){
    const host = $('#calGrid'); host.innerHTML = "";
    const now = new Date(); const months=[];
    for(let i=0;i<6;i++){ months.push(new Date(now.getFullYear(), now.getMonth()+i, 1)); }
    const monthNames = "Ene,Feb,Mar,Abr,May,Jun,Jul,Ago,Sep,Oct,Nov,Dic".split(',');
    months.forEach(m=>{
      const label = monthNames[m.getMonth()] + " " + m.getFullYear();
      const items = all.filter(s=> s.periodo_siembra && (normalize(s.periodo_siembra).includes(normalize(monthNames[m.getMonth()]))
        || normalize(s.periodo_siembra).includes(normalize(label.split(' ')[0])) ));
      const html = `<div class="cell"><h4>${label}</h4>${items.length?items.map(s=>`<span class="tag">${s.name}</span>`).join(''):'<span class="tag">—</span>'}</div>`;
      host.insertAdjacentHTML('beforeend', html);
    });
  }

  // Events
  function init(){
    setupTabs(); setupSearch(); setupFilters(); setupViewToggle(); setupAddEdit(); setupImport(); setupExport(); setupRefresh(); setupReadonly(); setupBasic();
    $('#closeDrawer').addEventListener('click', ()=>{ $('#detailDrawer').classList.remove('open'); $('#detailDrawer').setAttribute('aria-hidden','true'); });
    $('#detailDrawer').addEventListener('click', (e)=>{ if(e.target.id==='detailDrawer') $('#closeDrawer').click(); });
    loadSeeds();
  }

  // Helpers
  function makeKey(s){ return `${s.name}__${s.species}`.toLowerCase(); }

  init();
})();