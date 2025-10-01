
// HOTFIX v4: quitar alert OWNER, usar UN solo modal, y poner ACCEDER/CANCELAR ABAJO (extremos).
(function(){
  // 1) Suprimir alert molestoso
  const origAlert = window.alert;
  window.alert = function(msg){
    try{
      const s = String(msg||"");
      if (s.toLowerCase().includes("acceso restringido: solo owner")){
        if (!window.__ownerToastShown){
          window.__ownerToastShown = true;
          const t = document.createElement('div');
          t.textContent = "Acceso restringido: solo OWNER.";
          Object.assign(t.style,{position:'fixed',top:'12px',right:'12px',padding:'10px 14px',background:'rgba(20,27,52,.95)',color:'#fff',border:'1px solid #2b3a74',borderRadius:'10px',zIndex:9999,boxShadow:'0 6px 18px rgba(0,0,0,.35)'});
          document.body.appendChild(t); setTimeout(()=>t.remove(), 2000);
        }
        return;
      }
    }catch(e){}
    return origAlert.apply(window, arguments);
  };

  function ensureOneLoginDialog(){
    const all = [...document.querySelectorAll('dialog')].filter(d => /Acceso restringido/i.test(d.textContent||"") || d.id==='loginModal');
    if(all.length > 1){
      // Keep the first visible; close/remove others
      const keep = all[0];
      all.slice(1).forEach(d => { try{ d.close(); }catch(e){} d.remove(); });
      return keep;
    }
    return all[0] || null;
  }

  function upgradeLoginDialog(dlg){
    if(!dlg) return null;
    const form = dlg.querySelector('form') || dlg;
    form.classList.add('modal','login-modal');
    // Header draggable (si no existe)
    if(!dlg.querySelector('.modal-header')){
      const h = document.createElement('header');
      h.className = 'modal-header drag-handle';
      h.innerHTML = '<h3>Acceso restringido</h3>';
      form.insertBefore(h, form.firstChild);
    }
    // Asegurar sección scroll para cuerpo
    if(!form.querySelector('.modal-scroll')){
      const section = document.createElement('section');
      section.className = 'modal-scroll';
      const moves = [];
      [...form.children].forEach(ch => {
        const keep = ch.matches('header, .modal-header, .modal-toolbar, footer, .modal-actions');
        if(!keep) moves.push(ch);
      });
      moves.forEach(n => section.appendChild(n));
      form.appendChild(section);
    }

    // FOOTER en la parte de abajo con botones en extremos
    let footer = form.querySelector('footer.modal-actions');
    if(!footer){
      footer = document.createElement('footer');
      footer.className = 'modal-actions';
      form.appendChild(footer);
    }
    footer.classList.remove('hidden');
    footer.innerHTML = '<div class="modal-actions-inner"><button type="button" id="btnLoginAccept" class="btn grad-green small upper left-btn">🔓 ACCEDER</button><span class="spacer"></span><button type="button" id="btnLoginCancel" class="btn grad-orange small upper right-btn">✖️ CANCELAR</button></div>';

    // Wire
    const email = form.querySelector('input[type=email], #loginEmail');
    const code  = form.querySelector('input[type=password], #loginCode');
    const btnA  = footer.querySelector('#btnLoginAccept');
    const btnC  = footer.querySelector('#btnLoginCancel');
    if(btnC) btnC.onclick = ()=> dlg.close();
    if(btnA) btnA.onclick = ()=>{
      try{
        if(window.ACCESS && typeof ACCESS.login === 'function'){
          const ok = ACCESS.login((email && email.value || '').trim(), (code && code.value || '').trim());
          if(!ok){
            let err = form.querySelector('#loginError');
            if(!err){ err=document.createElement('p'); err.id='loginError'; err.className='form-error'; form.appendChild(err); }
            err.textContent = 'Credenciales inválidas.';
            return;
          }
        }
      }catch(e){ console.warn(e); }
      dlg.close();
    };

    // Draggable
    (function(){
      const header = dlg.querySelector('.drag-handle'); if(!header) return;
      let down=false,sx=0,sy=0,sl=0,st=0;
      header.addEventListener('mousedown',(e)=>{down=true; const r=dlg.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; sl=r.left; st=r.top; dlg.style.position='fixed'; dlg.style.margin='0';});
      document.addEventListener('mousemove',(e)=>{ if(!down) return; dlg.style.left=(sl+e.clientX-sx)+'px'; dlg.style.top=(st+e.clientY-sy)+'px'; });
      document.addEventListener('mouseup',()=>{ down=false; });
    })();

    return dlg;
  }

  function openOne(){
    // usa el existente o crea uno mínimo
    let dlg = ensureOneLoginDialog();
    if(!dlg){
      dlg = document.createElement('dialog'); dlg.id='loginModal';
      const f = document.createElement('form'); f.setAttribute('method','dialog');
      f.innerHTML = '<label>Correo<input type="email" id="loginEmail" required/></label><label>Código (colaborador)<input type="password" id="loginCode"/></label>';
      dlg.appendChild(f); document.body.appendChild(dlg);
    }
    dlg = upgradeLoginDialog(dlg);
    if(dlg && !dlg.open) dlg.showModal();
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // Enlaza botones de login (evita doble binding)
    ['#btnLogin','#btnAcceder','[data-action=login]','.actions-right .btn'].forEach(sel=>{
      document.querySelectorAll(sel).forEach(el=>{
        if(el.__loginBound) return; el.__loginBound=true;
        el.addEventListener('click',(e)=>{ e.preventDefault(); e.stopImmediatePropagation(); openOne(); });
      });
    });
    // Reemplaza global
    window.openLoginModal = openOne;
  });
})();
