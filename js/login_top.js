
// login_top.js: put ACCEDER/CANCELAR at the TOP (sticky) ONLY in the *login* dialog.
// Does NOT touch the seed modal.
(function(){
  function isLoginDialog(dlg){
    return /Acceso restringido/i.test((dlg.textContent||''));
  }
  function enhance(){
    const dialogs = Array.from(document.querySelectorAll('dialog')).filter(isLoginDialog);
    dialogs.forEach(dlg => {
      const form = dlg.querySelector('form') || dlg;
      // header draggable
      if(!dlg.querySelector('.modal-header')){
        const h = document.createElement('header');
        h.className = 'modal-header drag-handle';
        h.innerHTML = '<h3>Acceso restringido</h3>';
        form.insertBefore(h, form.firstChild);
      }
      // toolbar top
      if(!dlg.querySelector('.modal-toolbar')){
        const tb = document.createElement('div');
        tb.className = 'modal-toolbar';
        tb.innerHTML = '<button type="button" id="btnLoginAccept" class="btn grad-green small upper left-btn">🔓 ACCEDER</button><button type="button" id="btnLoginCancel" class="btn grad-orange small upper right-btn">✖️ CANCELAR</button>';
        const header = dlg.querySelector('.modal-header');
        header.nextSibling ? form.insertBefore(tb, header.nextSibling) : form.appendChild(tb);
        // wire
        const email = form.querySelector('input[type=email], #loginEmail');
        const code  = form.querySelector('input[type=password], #loginCode');
        tb.querySelector('#btnLoginCancel').onclick = ()=> dlg.close();
        tb.querySelector('#btnLoginAccept').onclick = ()=>{
          try{ if(window.ACCESS && typeof ACCESS.login==='function'){ const ok = ACCESS.login((email&&email.value||'').trim(), (code&&code.value||'').trim()); if(!ok){ return; } } }catch(e){}
          dlg.close();
        };
      }
      // draggable
      (function(){
        const header = dlg.querySelector('.drag-handle'); if(!header) return;
        let down=false,sx=0,sy=0,sl=0,st=0;
        header.addEventListener('mousedown',(e)=>{down=true; const r=dlg.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; sl=r.left; st=r.top; dlg.style.position='fixed'; dlg.style.margin='0';});
        document.addEventListener('mousemove',(e)=>{ if(!down) return; dlg.style.left=(sl+e.clientX-sx)+'px'; dlg.style.top=(st+e.clientY-sy)+'px'; });
        document.addEventListener('mouseup',()=>{ down=false; });
      })();
    });
  }
  document.addEventListener('click', ()=> setTimeout(enhance, 0), true);
  document.addEventListener('DOMContentLoaded', enhance);
})();
