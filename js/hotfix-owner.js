
// HOTFIX v3b: Upgrades existing login dialog; prevents duplicate; suppress OWNER alerts.
(function(){
  const origAlert = window.alert;
  window.alert = function(msg){
    try{ const t=(msg||'')+''; if(t.toLowerCase().includes('acceso restringido: solo owner')){ if(!window.__ownerToastShown){ window.__ownerToastShown=true; const d=document.createElement('div'); d.textContent='Acceso restringido: solo OWNER.'; Object.assign(d.style,{position:'fixed',top:'12px',right:'12px',padding:'10px 14px',background:'rgba(20,27,52,.95)',color:'#fff',border:'1px solid #2b3a74',borderRadius:'10px',zIndex:9999,boxShadow:'0 6px 18px rgba(0,0,0,.35)'}); document.body.appendChild(d); setTimeout(()=>d.remove(),2200);} return; } }catch(e){} return origAlert.apply(window, arguments); };

  function upgrade(dlg){
    if(!dlg) return;
    dlg.style.zIndex = 9998;
    const form = dlg.querySelector('form')||dlg; form.classList.add('modal','login-modal');
    if(!dlg.querySelector('.modal-header')){ const h=document.createElement('header'); h.className='modal-header drag-handle'; h.innerHTML='<h3>Acceso restringido</h3>'; form.insertBefore(h, form.firstChild); }
    if(!dlg.querySelector('.modal-toolbar')){ const tb=document.createElement('div'); tb.className='modal-toolbar'; tb.innerHTML='<button type="button" id="btnLoginAccept" class="btn grad-green small upper left-btn">🔓 ACCEDER</button><button type="button" id="btnLoginCancel" class="btn grad-orange small upper right-btn">✖️ CANCELAR</button>'; const header=dlg.querySelector('.modal-header'); header.nextSibling?form.insertBefore(tb, header.nextSibling):form.appendChild(tb); }
    // wrap body into scroll
    if(!form.querySelector('.modal-scroll')){ const sec=document.createElement('section'); sec.className='modal-scroll'; const moves=[]; [...form.children].forEach(ch=>{ const keep=ch.matches('header, .modal-header, .modal-toolbar, footer'); if(!keep) moves.push(ch); }); moves.forEach(n=>sec.appendChild(n)); form.insertBefore(sec, form.querySelector('footer')||null); }
    const ft=form.querySelector('footer'); if(ft) ft.classList.add('hidden');
    const email=form.querySelector('input[type=email], #loginEmail'); const code=form.querySelector('input[type=password], #loginCode');
    const btnA=form.querySelector('#btnLoginAccept'); const btnC=form.querySelector('#btnLoginCancel');
    if(btnC) btnC.onclick=()=> dlg.close();
    if(btnA) btnA.onclick=()=>{ try{ if(window.ACCESS && typeof ACCESS.login==='function'){ const ok=ACCESS.login((email&&email.value||'').trim(), (code&&code.value||'').trim()); if(!ok){ let err=form.querySelector('#loginError'); if(!err){ err=document.createElement('p'); err.id='loginError'; err.className='form-error'; form.appendChild(err);} err.textContent='Credenciales inválidas.'; return; } } }catch(e){} dlg.close(); };
    // draggable
    (function(){ const header=dlg.querySelector('.drag-handle'); if(!header) return; let down=false,sx=0,sy=0,sl=0,st=0; header.addEventListener('mousedown',(e)=>{down=true; const r=dlg.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; sl=r.left; st=r.top; dlg.style.position='fixed'; dlg.style.margin='0';}); document.addEventListener('mousemove',(e)=>{ if(!down) return; dlg.style.left=(sl+e.clientX-sx)+'px'; dlg.style.top=(st+e.clientY-sy)+'px'; }); document.addEventListener('mouseup',()=>{ down=false; }); })();
    return dlg;
  }

  function openOne(){
    // prefer the already existing login dialog
    let dlg = document.querySelector('dialog#loginModal') || [...document.querySelectorAll('dialog')].find(d=>/Acceso restringido/i.test(d.textContent||''));
    if(!dlg){ dlg=document.createElement('dialog'); dlg.id='loginModal'; const f=document.createElement('form'); f.setAttribute('method','dialog'); f.innerHTML='<label>Correo<input type="email" id="loginEmail" required/></label><label>Código (colaborador)<input type="password" id="loginCode"/></label>'; dlg.appendChild(f); document.body.appendChild(dlg); }
    upgrade(dlg); if(!dlg.open) dlg.showModal();
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // hijack any login buttons
    ['#btnLogin','#btnAcceder','[data-action=login]','.actions-right .btn'].forEach(sel=>{
      document.querySelectorAll(sel).forEach(el=>{
        if(el.__loginBound) return; el.__loginBound=true;
        el.addEventListener('click',(e)=>{ e.preventDefault(); e.stopImmediatePropagation(); openOne(); });
      });
    });
    // replace global
    window.openLoginModal = openOne;
  });
})();
