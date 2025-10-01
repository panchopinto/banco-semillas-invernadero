
// Ensures login modal has bottom buttons ACCEDER (left) / CANCELAR (right) without duplicating dialog
(function(){
  function relayout(){
    var dlg = document.querySelector('dialog#loginModal') || Array.from(document.querySelectorAll('dialog')).find(d=>/Acceso restringido/i.test(d.textContent||''));
    if(!dlg) return;
    var form = dlg.querySelector('form') || dlg;
    // move/ensure footer
    var footer = form.querySelector('footer.modal-actions') || form.querySelector('footer') || (function(){ var f=document.createElement('footer'); f.className='modal-actions'; form.appendChild(f); return f; })();
    footer.classList.remove('hidden');
    if(!footer.querySelector('#btnLoginAccept')){
      footer.innerHTML = '<div class="modal-actions-inner"><button type="button" id="btnLoginAccept" class="btn grad-green small upper">🔓 ACCEDER</button><span class="spacer"></span><button type="button" id="btnLoginCancel" class="btn grad-orange small upper">✖️ CANCELAR</button></div>';
      var email = form.querySelector('input[type=email], #loginEmail');
      var code  = form.querySelector('input[type=password], #loginCode');
      footer.querySelector('#btnLoginCancel').onclick = function(){ dlg.close(); };
      footer.querySelector('#btnLoginAccept').onclick = function(){
        try{ if(window.ACCESS && typeof ACCESS.login==='function'){ var ok = ACCESS.login((email&&email.value||'').trim(), (code&&code.value||'').trim()); if(!ok){ return; } } }catch(e){}
        dlg.close();
      };
    }
  }
  document.addEventListener('click', function(e){
    // when user opens login, relayout shortly after
    setTimeout(relayout, 10);
  }, true);
  document.addEventListener('DOMContentLoaded', relayout);
})();
