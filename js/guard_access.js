
// === Anti-copia básica (obstaculiza, no es infalible) ===
(function(){
  let __ownerWarnShown = sessionStorage.getItem('ownerWarnShown')==='1';
  function ownerWarn(msg){
    if(__ownerWarnShown) return; __ownerWarnShown=true; sessionStorage.setItem('ownerWarnShown','1');
    const t = document.createElement('div');
    t.className='toast-owner'; t.textContent = msg || 'Acceso restringido: solo OWNER.';
    Object.assign(t.style,{position:'fixed',top:'12px',right:'12px',padding:'10px 14px',background:'rgba(20,27,52,.95)',color:'#fff',border:'1px solid #2b3a74',borderRadius:'10px',zIndex:9999,boxShadow:'0 6px 18px rgba(0,0,0,.35)'});
    document.body.appendChild(t);
    setTimeout(()=>{ t.remove(); }, 3000);
  }

  // Bloquea menú contextual
  document.addEventListener('contextmenu', e => e.preventDefault());
  // Bloquea arrastre de imágenes
  document.addEventListener('dragstart', e => { if(e.target && e.target.tagName==='IMG'){ e.preventDefault(); }});
  // Bloquea combinaciones típicas
  document.addEventListener('keydown', (e)=>{
    const k = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    // F12, Ctrl+Shift+I/C, Ctrl+U, Ctrl+S, Ctrl+P
    if (k === 'f12' || (ctrl && shift && ['i','c','j'].includes(k)) || (ctrl && ['u','s','p'].includes(k))) {
      e.preventDefault(); e.stopPropagation();
    }
  }, true);
  // Evita copiar directo
  document.addEventListener('copy', (e)=>{
    e.preventDefault();
  });

// === Papelera simple para restaurar borrados ===
window.SeedRecycleBin = {
  _deleted: [],
  add(seed){ this._deleted.push(seed); localStorage.setItem("seeds_recycle", JSON.stringify(this._deleted)); },
  load(){ try{ this._deleted = JSON.parse(localStorage.getItem("seeds_recycle")||"[]"); }catch(e){ this._deleted=[]; } },
  list(){ return this._deleted; },
  restoreLast(){ if(!this._deleted.length){ alert("Papelera vacía."); return; } const s=this._deleted.pop(); 
    localStorage.setItem("seeds_recycle", JSON.stringify(this._deleted));
    document.dispatchEvent(new CustomEvent("recycle-restore",{detail:s}));
    alert("Semilla restaurada: "+(s.name||"sin nombre")); },
};
SeedRecycleBin.load();
// Tecla rápida: Ctrl+Shift+Z = restaurar último
document.addEventListener("keydown", e=>{ if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==="z"){ SeedRecycleBin.restoreLast(); }});


// === Protección adicional de navegación a vistas restringidas (hash/URL/click) ===
function protectRestrictedViews(){
  function blocked(view){
    try{
      const sess = ACCESS.getSession();
      if (view === 'reportes' || view === 'config'){
        return sess.role !== 'owner';
      }
      return false;
    }catch(e){ return true; }
  }
  // Intercepta clicks en tabs
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('button.tab[data-view]');
    if (!btn) return;
    const view = btn.getAttribute('data-view');
    if (blocked(view)){
      e.preventDefault(); e.stopPropagation();
      ownerWarn("Acceso restringido: solo OWNER.");
    }
  }, true);

  // Intercepta hashchange (por si alguien navega directo)
  window.addEventListener('hashchange', ()=>{
    const h = (location.hash||"").toLowerCase();
    const view = h.replace(/^#/, '');
    if (blocked(view)){
      alert("Acceso restringido: solo OWNER.");
      // vuelve a una vista segura (tarjetas/lista)
      const safe = document.querySelector('button.tab[data-view="tarjetas"]') || document.querySelector('button.tab[data-view="tabla"]');
      safe && safe.click();
      history.replaceState(null, "", "#tarjetas");
    }
  });

  // Observa cambios en main por si una app cambia de vista sin hash
  const mo = new MutationObserver(()=>{
    // si existe una sección de config o reportes visible, y no eres owner, ocultar
    const sess = ACCESS.getSession();
    if (sess.role === 'owner') return;
    const bad = document.querySelector('[data-view-active="config"], [data-view-active="reportes"], #view-config:not(.hidden), #view-reportes:not(.hidden)');
    if (bad){
      alert("Acceso restringido: solo OWNER.");
      const safe = document.querySelector('button.tab[data-view="tarjetas"]') || document.querySelector('button.tab[data-view="tabla"]');
      safe && safe.click();
    }
  });
  mo.observe(document.body, {subtree:true, attributes:true, childList:true});
}

// Activar protección avanzada al iniciar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', protectRestrictedViews);
} else {
  protectRestrictedViews();
}

})();

// === Control de acceso simple (estático) ===
// Nota: Para control real por correo, usa un proveedor de auth (p.ej., Firebase Auth) y reglas de Firestore.
// Aquí implementamos un "modo propietario/colaborador/visor" con allowlist básica y un "código de acceso".

const ACCESS = (function(){
  let __ownerWarnShown = sessionStorage.getItem('ownerWarnShown')==='1';
  function ownerWarn(msg){
    if(__ownerWarnShown) return; __ownerWarnShown=true; sessionStorage.setItem('ownerWarnShown','1');
    const t = document.createElement('div');
    t.className='toast-owner'; t.textContent = msg || 'Acceso restringido: solo OWNER.';
    Object.assign(t.style,{position:'fixed',top:'12px',right:'12px',padding:'10px 14px',background:'rgba(20,27,52,.95)',color:'#fff',border:'1px solid #2b3a74',borderRadius:'10px',zIndex:9999,boxShadow:'0 6px 18px rgba(0,0,0,.35)'});
    document.body.appendChild(t);
    setTimeout(()=>{ t.remove(); }, 3000);
  }

  const OWNER_EMAIL = "franciscoandresp@gmail.com";
    const ALLOWLIST = [
    OWNER_EMAIL,
    "cesarvilla@liceosannicolas.cl",
    "ignacioalfaro@liceosannicolas.cl",
    "pamelaonate@liceosannicolas.cl",
    "macarenaalvarez@liceosannicolas.cl",
    "belensegura@liceosannicolas.cl",
    "lilianpenroz@liceosannicolas.cl",
    "belenacuna@liceosannicolas.cl",
    "marlenelipan@liceosannicolas.cl",
    "diegoacuna@liceosannicolas.cl",
    "utp.sannicolas@gmail.com"
  ]; // <-- Cambia/añade correos aquí
  const DEFAULT_CODE = "SEMILLAS-2025"; // <-- Puedes cambiarlo. Sirve como 2FA simple (no subas esta clave pública).
  const LS_KEY= "bsi_access_v1";

  function roleFromEmail(email){
    if (!email) return "viewer";
    if (email.toLowerCase() === OWNER_EMAIL) return "owner";
    if (ALLOWLIST.map(e=>e.toLowerCase()).includes(email.toLowerCase())) return "editor";
    return "viewer";
  }

  function saveSession(sess){ localStorage.setItem(LS_KEY, JSON.stringify(sess)); }
  function getSession(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY)||"null") || {email:null, role:"viewer"}; }catch(_){ return {email:null, role:"viewer"}; }
  }
  function clear(){ localStorage.removeItem(LS_KEY); applyGuards({email:null, role:"viewer"}); }

  function login(email, code){
    if (!email) return {ok:false, msg:"Ingresa tu correo"};
    const role = roleFromEmail(email);
    if (role==="viewer") return {ok:false, msg:"Correo no autorizado"};
    // Pide código si no es propietario
    if (role!=="owner"){
      if (!code || code !== DEFAULT_CODE) return {ok:false, msg:"Código inválido"};
    }
    const sess = {email, role};
    saveSession(sess);
    applyGuards(sess);
    return {ok:true, role};
  }

  function applyGuards(sess){
    // 1) Tabs restringidos
    const tabReportes = document.querySelector('button.tab[data-view="reportes"]');
    const tabConfig    = document.querySelector('button.tab[data-view="config"]');
    if (tabReportes) tabReportes.style.display = (sess.role==="owner") ? "" : "none";
    if (tabConfig) tabConfig.style.display = (sess.role==="owner") ? "" : "none"; // opcional: editores ven Config

    // 2) Acciones peligrosas (borrar/exportar masivo) — añade data-guard="owner" en HTML si corresponde
    document.querySelectorAll('[data-guard="owner"]').forEach(el=>{
      el.style.display = (sess.role==="owner") ? "" : "none";
      if (sess.role!=="owner") el.disabled = true;
    });
    document.querySelectorAll('[data-guard="editor"]').forEach(el=>{
      el.style.display = (sess.role==="owner"||sess.role==="editor") ? "" : "none";
      if (!(sess.role==="owner"||sess.role==="editor")) el.disabled = true;
    });

    // 3) Mostrar email activo en UI
    const badge = document.getElementById('access-badge');
    if (badge){
      badge.textContent = sess.email ? (sess.role.toUpperCase()+" · "+sess.email) : "VISOR";
    }
  }

  // Editar solo la semilla seleccionada — botón flotante
  function setupEditFab(){
    const fab = document.getElementById('editSelected');
    if (!fab) return;
    function updateFab(){
      const selected = document.querySelector('.card.selected, tr.selected');
      const sess = getSession();
      const canEdit = (sess.role==="owner"||sess.role==="editor");
      fab.style.display = selected && canEdit ? 'inline-flex' : 'none';
    }
    document.addEventListener('click', (e)=>{
      // Marcar selección en tarjetas/filas
      const card = e.target.closest('.card');
      const row  = e.target.closest('tr');
      let changed = false;
      if (card){
        document.querySelectorAll('.card.selected').forEach(c=>c.classList.remove('selected'));
        card.classList.add('selected'); changed = true;
      }else if (row && row.parentElement && row.parentElement.tagName==='TBODY'){
        document.querySelectorAll('tr.selected').forEach(r=>r.classList.remove('selected'));
        row.classList.add('selected'); changed = true;
      }
      if (changed) updateFab();
    });
    // Intento de editar
    fab.addEventListener('click', ()=>{
      const target = document.querySelector('.card.selected, tr.selected');
      if (!target) return;
      // Dispara evento custom para que app.js abra el modal de edición si existe
      const ev = new CustomEvent('request-edit-selected', {detail:{target}});
      document.dispatchEvent(ev);
    });
    // Actualiza al cambiar de vista o render
    const mo = new MutationObserver(()=>updateFab());
    mo.observe(document.body, {subtree:true, childList:true, attributes:true});
  }

  function init(){
    // Inserta botón de acceso en topbar
    const topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('access-controls')){
      const div = document.createElement('div');
      div.id = 'access-controls';
      div.style.marginLeft = 'auto';
      div.innerHTML = `
        <span id="access-badge" class="pill small" style="margin-right:.5rem;">VISOR</span>
        <button id="btnLogin" class="btn small">Acceder</button>
        <button id="btnLogout" class="btn small" style="display:none;">Salir</button>
      `;
      topbar.appendChild(div);
      const btnLogin = div.querySelector('#btnLogin');
      const btnLogout= div.querySelector('#btnLogout');
      btnLogin.addEventListener('click', ()=>openLoginModal());
      btnLogout.addEventListener('click', ()=>{ clear(); btnLogout.style.display='none'; btnLogin.style.display=''; });
    }

    // Crea modal de login si no existe
    if (!document.getElementById('login-modal')){
      const m = document.createElement('div');
      m.id = 'login-modal';
      m.style.position='fixed'; m.style.inset='0';
      m.style.background='rgba(0,0,0,.4)'; m.style.display='none'; m.style.zIndex='9999';
      m.innerHTML = `
        <div style="max-width:360px;margin:10vh auto;background:#111;border:1px solid #333;border-radius:16px;padding:16px;">
          <h3>Acceso restringido</h3>
          <p>Ingresa tu correo autorizado. (Para colaboradores, se requiere código)</p>
          <label>Correo<br/><input id="login-email" type="email" style="width:100%"/></label>
          <label style="display:block;margin-top:.5rem;">Código (colaborador)<br/><input id="login-code" type="password" style="width:100%"/></label>
          <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:1rem;">
            <button id="login-cancel" class="btn">Cancelar</button>
            <button id="login-ok" class="btn">Acceder</button>
          </div>
        </div>`;
      document.body.appendChild(m);
      m.addEventListener('click', (e)=>{ if(e.target.id==='login-modal') m.style.display='none'; });
      $('#login-cancel')?.addEventListener('click', ()=> m.style.display='none');
      $('#login-ok')?.addEventListener('click', ()=>{
        const email = document.getElementById('login-email').value.trim();
        const code  = document.getElementById('login-code').value.trim();
        const res = login(email, code);
        if (!res.ok){ alert(res.msg); return; }
        document.getElementById('btnLogout').style.display='';
        document.getElementById('btnLogin').style.display='none';
        m.style.display='none';
      });
    }

    // Botón flotante para "Editar seleccionado"
    if (!document.getElementById('editSelected')){
      const b = document.createElement('button');
      b.id = 'editSelected';
      b.className = 'fab';
      b.style.display='none';
      b.textContent = '✏️ Editar seleccionado';
      document.body.appendChild(b);
    }

    applyGuards(getSession());
    setupEditFab();
  }

  function openLoginModal(){ document.getElementById('login-modal').style.display='block'; }

  // init al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { getSession, applyGuards };

// === Papelera simple para restaurar borrados ===
window.SeedRecycleBin = {
  _deleted: [],
  add(seed){ this._deleted.push(seed); localStorage.setItem("seeds_recycle", JSON.stringify(this._deleted)); },
  load(){ try{ this._deleted = JSON.parse(localStorage.getItem("seeds_recycle")||"[]"); }catch(e){ this._deleted=[]; } },
  list(){ return this._deleted; },
  restoreLast(){ if(!this._deleted.length){ alert("Papelera vacía."); return; } const s=this._deleted.pop(); 
    localStorage.setItem("seeds_recycle", JSON.stringify(this._deleted));
    document.dispatchEvent(new CustomEvent("recycle-restore",{detail:s}));
    alert("Semilla restaurada: "+(s.name||"sin nombre")); },
};
SeedRecycleBin.load();
// Tecla rápida: Ctrl+Shift+Z = restaurar último
document.addEventListener("keydown", e=>{ if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==="z"){ SeedRecycleBin.restoreLast(); }});


// === Protección adicional de navegación a vistas restringidas (hash/URL/click) ===
function protectRestrictedViews(){
  function blocked(view){
    try{
      const sess = ACCESS.getSession();
      if (view === 'reportes' || view === 'config'){
        return sess.role !== 'owner';
      }
      return false;
    }catch(e){ return true; }
  }
  // Intercepta clicks en tabs
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('button.tab[data-view]');
    if (!btn) return;
    const view = btn.getAttribute('data-view');
    if (blocked(view)){
      e.preventDefault(); e.stopPropagation();
      ownerWarn("Acceso restringido: solo OWNER.");
    }
  }, true);

  // Intercepta hashchange (por si alguien navega directo)
  window.addEventListener('hashchange', ()=>{
    const h = (location.hash||"").toLowerCase();
    const view = h.replace(/^#/, '');
    if (blocked(view)){
      alert("Acceso restringido: solo OWNER.");
      // vuelve a una vista segura (tarjetas/lista)
      const safe = document.querySelector('button.tab[data-view="tarjetas"]') || document.querySelector('button.tab[data-view="tabla"]');
      safe && safe.click();
      history.replaceState(null, "", "#tarjetas");
    }
  });

  // Observa cambios en main por si una app cambia de vista sin hash
  const mo = new MutationObserver(()=>{
    // si existe una sección de config o reportes visible, y no eres owner, ocultar
    const sess = ACCESS.getSession();
    if (sess.role === 'owner') return;
    const bad = document.querySelector('[data-view-active="config"], [data-view-active="reportes"], #view-config:not(.hidden), #view-reportes:not(.hidden)');
    if (bad){
      alert("Acceso restringido: solo OWNER.");
      const safe = document.querySelector('button.tab[data-view="tarjetas"]') || document.querySelector('button.tab[data-view="tabla"]');
      safe && safe.click();
    }
  });
  mo.observe(document.body, {subtree:true, attributes:true, childList:true});
}

// Activar protección avanzada al iniciar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', protectRestrictedViews);
} else {
  protectRestrictedViews();
}

})();

// Listener de integración con app.js (si existe)
document.addEventListener('request-edit-selected', (e)=>{
  // Busca data-id en elemento seleccionado o intenta obtener por título
  const el = e.detail?.target;
  let name = el?.querySelector?.('.title')?.textContent?.trim();
  if (!name && el && el.querySelector) {
    const firstCell = el.querySelector('td');
    if (firstCell) name = firstCell.textContent.trim();
  }
  if (!name) { alert("No se pudo identificar la semilla seleccionada."); return; }
  // Si app.js expone una función global para abrir el editor, la usamos:
  if (window.openSeedEditorByName) {
    window.openSeedEditorByName(name);
  } else {
    console.warn("Editor no disponible (legacy hook): "+name);
  }
});


// === FORCE override of openLoginModal to ensure sticky/extreme buttons + draggable ===
window.openLoginModal = function(){
  let dlg = document.getElementById('loginModal');
  if(!dlg){
    dlg = document.createElement('dialog');
    dlg.id = 'loginModal';
    dlg.innerHTML = '<form method="dialog" class="modal login-modal"><header class="modal-header drag-handle"><h3>Acceso restringido</h3></header><div class="modal-toolbar"><button type="button" id="btnLoginAccept" class="btn grad-green small upper left-btn">🔓 ACCEDER</button><button type="button" id="btnLoginCancel" class="btn grad-orange small upper right-btn">✖️ CANCELAR</button></div><section class="modal-scroll"><p class="muted">Ingresa tu correo autorizado. (Para colaboradores, se requiere código)</p><label>Correo<input type="email" id="loginEmail" required/></label><label>Código (colaborador)<input type="password" id="loginCode"/></label><p class="form-error hidden" id="loginError">Credenciales inválidas.</p></section><footer class="modal-actions hidden"><button class="btn ghost" value="cancel">Cancelar</button><button class="btn grad-green" value="default">Acceder</button></footer></form>';
    document.body.appendChild(dlg);
  }else{
    // If exists, ensure classes and toolbar/buttons present
    const form = dlg.querySelector('form'); if(form) form.classList.add('modal','login-modal');
    // header
    if(!dlg.querySelector('.modal-header')){
      const h = document.createElement('header'); h.className='modal-header drag-handle'; h.innerHTML='<h3>Acceso restringido</h3>';
      dlg.firstElementChild.insertBefore(h, dlg.firstElementChild.firstChild);
    }
    // toolbar + buttons
    if(!dlg.querySelector('.modal-toolbar')){
      const tb = document.createElement('div'); tb.className='modal-toolbar';
      tb.innerHTML = '<button type="button" id="btnLoginAccept" class="btn grad-green small upper left-btn">🔓 ACCEDER</button><button type="button" id="btnLoginCancel" class="btn grad-orange small upper right-btn">✖️ CANCELAR</button>';
      dlg.firstElementChild.insertBefore(tb, dlg.querySelector('section, .content') || dlg.firstElementChild.children[1]);
    }
    // hide any footer action bar to avoid duplicates
    const ft = dlg.querySelector('footer.modal-actions'); if(ft) ft.classList.add('hidden');
  }
  // Wire buttons
  const email = dlg.querySelector('#loginEmail'); const code = dlg.querySelector('#loginCode'); const err = dlg.querySelector('#loginError');
  const btnA = dlg.querySelector('#btnLoginAccept'); const btnC = dlg.querySelector('#btnLoginCancel');
  if(btnC) btnC.onclick = ()=> dlg.close();
  if(btnA) btnA.onclick = ()=>{
    err && err.classList.add('hidden');
    try{ if(window.ACCESS && ACCESS.login){ const ok = ACCESS.login(email?.value?.trim()||'', code?.value?.trim()||''); if(!ok){ err && err.classList.remove('hidden'); return; } } }catch(e){ console.warn(e); }
    dlg.close();
  };
  // Draggable
  (function(){
    const header = dlg.querySelector('.drag-handle'); if(!header) return;
    let down=false, sx=0, sy=0, sl=0, st=0;
    header.onmousedown = (e)=>{ down=true; const r=dlg.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; sl=r.left; st=r.top; dlg.style.position='fixed'; dlg.style.margin='0'; };
    document.onmousemove = (e)=>{ if(!down) return; dlg.style.left=(sl+e.clientX-sx)+'px'; dlg.style.top=(st+e.clientY-sy)+'px'; };
    document.onmouseup = ()=>{ down=false; };
  })();
  dlg.showModal();
};


// PATCH LOGIN OVERRIDE START

window.openLoginModal = function(){
  let dlg = document.getElementById('loginModal');
  if(!dlg){
    dlg = document.createElement('dialog'); dlg.id='loginModal';
    dlg.innerHTML = '<form method="dialog" class="modal login-modal">\
<header class="modal-header drag-handle"><h3>Acceso restringido</h3></header>\
<div class="modal-toolbar">\
  <button type="button" id="btnLoginAccept" class="btn grad-green small upper left-btn">🔓 ACCEDER</button>\
  <button type="button" id="btnLoginCancel" class="btn grad-orange small upper right-btn">✖️ CANCELAR</button>\
</div>\
<section class="modal-scroll">\
  <p class="muted">Ingresa tu correo autorizado. (Para colaboradores, se requiere código)</p>\
  <label>Correo<input type="email" id="loginEmail" required placeholder="tu@correo.com"/></label>\
  <label>Código (colaborador)<input type="password" id="loginCode" placeholder="••••••••"/></label>\
  <p class="form-error hidden" id="loginError">Credenciales inválidas.</p>\
</section>\
<footer class="modal-actions hidden"><button class="btn ghost" value="cancel">Cancelar</button><button class="btn grad-green" value="default">Acceder</button></footer>\
</form>';
    document.body.appendChild(dlg);
  }else{
    const form = dlg.querySelector('form'); if(form) form.classList.add('modal','login-modal');
    if(!dlg.querySelector('.modal-header')){ const h=document.createElement('header'); h.className='modal-header drag-handle'; h.innerHTML='<h3>Acceso restringido</h3>'; dlg.firstElementChild.insertBefore(h, dlg.firstElementChild.firstChild); }
    if(!dlg.querySelector('.modal-toolbar')){ const tb=document.createElement('div'); tb.className='modal-toolbar'; tb.innerHTML='<button type="button" id="btnLoginAccept" class="btn grad-green small upper left-btn">🔓 ACCEDER</button><button type="button" id="btnLoginCancel" class="btn grad-orange small upper right-btn">✖️ CANCELAR</button>'; dlg.firstElementChild.insertBefore(tb, dlg.querySelector('section, .content') || dlg.firstElementChild.children[1]); }
    const ft = dlg.querySelector('footer.modal-actions'); if(ft) ft.classList.add('hidden');
  }
  const email = dlg.querySelector('#loginEmail'); const code = dlg.querySelector('#loginCode'); const err = dlg.querySelector('#loginError');
  const btnA = dlg.querySelector('#btnLoginAccept'); const btnC = dlg.querySelector('#btnLoginCancel');
  if(btnC) btnC.onclick = ()=> dlg.close();
  if(btnA) btnA.onclick = ()=>{ err && err.classList.add('hidden'); try{ if(window.ACCESS && ACCESS.login){ const ok = ACCESS.login(email?.value?.trim()||'', code?.value?.trim()||''); if(!ok){ err && err.classList.remove('hidden'); return; } } }catch(e){ console.warn(e); } dlg.close(); };
  (function(){ const header=dlg.querySelector('.drag-handle'); if(!header) return; let d=false,sx=0,sy=0,sl=0,st=0; header.onmousedown=(e)=>{d=true; const r=dlg.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; sl=r.left; st=r.top; dlg.style.position='fixed'; dlg.style.margin='0';}; })(); // placeholder, we'll replace next
};

(function(){
  const dlg=document.getElementById('loginModal');
  if(!dlg) return;
  let d=false,sx=0,sy=0,sl=0,st=0;
  const header=dlg.querySelector('.drag-handle');
  if(header){
    header.addEventListener('mousedown',(e)=>{d=true; const r=dlg.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; sl=r.left; st=r.top; dlg.style.position='fixed'; dlg.style.margin='0';});
    document.addEventListener('mousemove',(e)=>{ if(!d) return; dlg.style.left=(sl+e.clientX-sx)+'px'; dlg.style.top=(st+e.clientY-sy)+'px'; });
    document.addEventListener('mouseup',()=>{ d=false; });
  }
})();

// PATCH LOGIN OVERRIDE END
