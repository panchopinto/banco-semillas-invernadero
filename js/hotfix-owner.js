
// --- HOTFIX: silencia alert de "Acceso restringido: solo OWNER" sin romper otros alerts ---
(function(){
  const origAlert = window.alert;
  window.alert = function(msg){
    try{
      const s = String(msg||"");
      if (s.toLowerCase().includes("acceso restringido: solo owner")){
        // opcional: pequeño aviso no intrusivo
        if (!window.__ownerToastShown){
          window.__ownerToastShown = true;
          const t = document.createElement('div');
          t.textContent = "Acceso restringido: solo OWNER.";
          Object.assign(t.style,{position:'fixed',top:'12px',right:'12px',padding:'10px 14px',background:'rgba(20,27,52,.95)',color:'#fff',border:'1px solid #2b3a74',borderRadius:'10px',zIndex:9999,boxShadow:'0 6px 18px rgba(0,0,0,.35)'});
          document.body.appendChild(t); setTimeout(()=>t.remove(), 2500);
        }
        return; // suprime el alert
      }
    }catch(e){}
    return origAlert.apply(window, arguments);
  };

  // --- Override visual del login: botones arriba, extremos, mayúsculas, draggable ---
  const overrideLogin = function(){
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
    if(btnA) btnA.onclick = ()=>{
      err && err.classList.add('hidden');
      try{ if(window.ACCESS && ACCESS.login){ const ok = ACCESS.login(email?.value?.trim()||'', code?.value?.trim()||''); if(!ok){ err && err.classList.remove('hidden'); return; } } }catch(e){}
      dlg.close();
    };
    // Draggable
    (function(){ const header = dlg.querySelector('.drag-handle'); if(!header) return;
      let down=false,sx=0,sy=0,sl=0,st=0;
      header.addEventListener('mousedown',(e)=>{down=true; const r=dlg.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; sl=r.left; st=r.top; dlg.style.position='fixed'; dlg.style.margin='0';});
      document.addEventListener('mousemove',(e)=>{ if(!down) return; dlg.style.left=(sl+e.clientX-sx)+'px'; dlg.style.top=(st+e.clientY-sy)+'px'; });
      document.addEventListener('mouseup',()=>{ down=false; });
    })();
    dlg.showModal();
  };

  // Forzar que el botón de la topbar use este modal
  document.addEventListener('DOMContentLoaded', ()=>{
    const b = document.querySelector('#btnLogin, #btnAcceder, [data-action=login]');
    if(b){ b.addEventListener('click', (e)=>{ e.preventDefault(); overrideLogin(); }); }
    // si otro script define openLoginModal, lo reemplazamos
    window.openLoginModal = overrideLogin;
  });
})();
