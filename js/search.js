
(function(){
  const $ = (q,root=document)=>root.querySelector(q);
  const $$ = (q,root=document)=>[...root.querySelectorAll(q)];
  const normalize = s => (s||"").toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  function highlight(el, term){
    const t = term && normalize(term);
    $$("mark.find", el).forEach(m=>{ const p=m.parentNode; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); });
    if(!t) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode(node){
      if(!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const n = normalize(node.nodeValue); return n.includes(t) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }});
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const frag=document.createDocumentFragment(); const raw=node.nodeValue; let i=0; const low=normalize(raw); let idx;
      while((idx=low.indexOf(t,i))!==-1){ const before=raw.slice(i,idx); const match=raw.slice(idx, idx+t.length);
        if(before) frag.appendChild(document.createTextNode(before));
        const mark=document.createElement('mark'); mark.className='find'; mark.textContent=match; frag.appendChild(mark); i=idx+t.length; }
      const after=raw.slice(i); if(after) frag.appendChild(document.createTextNode(after)); node.parentNode.replaceChild(frag,node);
    });
  }
  function setupSearch(){
    const input = $('[data-search]') || $('#search, input[type="search"]');
    const items = $$('.seed, .card.seed, [data-seed], .seed-card'); // amplio para distintos HTML
    if(!input || !items.length) return;
    const index = items.map(el=>{
      const data = {
        el,
        name: el.getAttribute('data-name') || el.querySelector('[data-name], .name, .title, h3')?.textContent || '',
        especie: el.getAttribute('data-species') || el.querySelector('[data-species], .species')?.textContent || '',
        notas: el.getAttribute('data-notes') || el.querySelector('[data-notes], .notes, .desc')?.textContent || '',
        tags: (el.getAttribute('data-tags') || el.querySelector('.tags')?.textContent || '').replace(/\s+/g,' ')
      };
      const haystack = normalize([data.name, data.especie, data.notas, data.tags].join(' '));
      return { data, haystack };
    });
    let empty = $('#empty'); if(!empty){ empty = document.createElement('div'); empty.id='empty'; empty.className='empty hidden'; empty.textContent='Sin resultados para tu búsqueda.'; input.parentNode.appendChild(empty); }
    function apply(term){
      const q = normalize(term); let any = false;
      index.forEach(item=>{
        const match = !q || item.haystack.includes(q);
        item.data.el.classList.toggle('hidden', !match);
        if(match) any = true;
        highlight(item.data.el, term);
      });
      empty.classList.toggle('hidden', any);
    }
    let t=0; input.addEventListener('input', ()=>{ clearTimeout(t); t = setTimeout(()=>apply(input.value), 120); });
    const params = new URLSearchParams(location.search); const q0 = params.get('q'); if(q0){ input.value = q0; }
    apply(input.value);
  }
  document.addEventListener('DOMContentLoaded', setupSearch);
})();
