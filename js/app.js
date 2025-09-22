
const $ = (q,root=document)=>root.querySelector(q);
const $$ = (q,root=document)=>[...root.querySelectorAll(q)];

const state = {
  seeds: [],
  filters: new Set(),
  query: ""
};

async function loadSeeds(){
  const res = await fetch('data/seeds.json');
  state.seeds = await res.json();
  render();
}

function normalize(s){ return (s||"").toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }

function matchSeed(seed){
  const q = normalize(state.query);
  const hay = normalize([seed.name, seed.species, (seed.notes||[]).join(' '), (seed.tags||[]).join(' ')].join(' '));
  const matchQ = !q || hay.includes(q);
  const matchF = !state.filters.size || [...state.filters].every(f => hay.includes(normalize(f)));
  return matchQ && matchF;
}

function highlight(text, q){
  if(!q) return text;
  const n = normalize(text); const t = normalize(q);
  let i = n.indexOf(t);
  if(i === -1) return text;
  // naive highlight on same indices
  const before = text.slice(0,i);
  const mid = text.slice(i, i+t.length);
  const after = text.slice(i+t.length);
  return `${before}<mark class="find">${mid}</mark>${after}`;
}

function render(){
  const list = $('#seed-list');
  const count = $('#seed-count');
  const q = state.query;
  const items = state.seeds.filter(matchSeed);
  list.innerHTML = items.map(s => `
    <article class="card">
      <div class="header">
        <h3 class="title">${highlight(s.name, q)}</h3>
        <span class="badge">${s.germination.days_min}-${s.germination.days_max} días</span>
      </div>
      <p><strong>Especie:</strong> ${s.species||'—'}</p>
      <p><strong>Interior/Exterior:</strong> ${s.grow.indoor && s.grow.outdoor ? 'Ambos' : (s.grow.indoor ? 'Interior' : 'Exterior')}</p>
      <p><strong>Siembra:</strong> ${s.sowing||'—'}</p>
      <div class="tags">
        ${(s.tags||[]).map(t=>`<span class="pill">${t}</span>`).join('')}
      </div>
    </article>
  `).join('');
  $('#empty').classList.toggle('hidden', items.length>0);
  count.textContent = `${items.length} semillas mostradas de ${state.seeds.length}`;
}

function setupSearch(){
  const input = $('#search');
  input.addEventListener('input', ()=>{ state.query = input.value; render(); });
}

function setupTabs(){
  $$('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      $$('.view').forEach(v=>v.classList.remove('active'));
      $('#view-' + view).classList.add('active');
    });
  });
}

function setupChips(){
  $$('#chips .chip').forEach(ch=>{
    if(ch.classList.contains('clear')){
      ch.addEventListener('click', ()=>{ state.filters.clear(); $$('#chips .chip').forEach(c=>c.classList.remove('active')); render(); });
      return;
    }
    ch.addEventListener('click', ()=>{
      const f = ch.dataset.filter;
      if(state.filters.has(f)){ state.filters.delete(f); ch.classList.remove('active'); }
      else{ state.filters.add(f); ch.classList.add('active'); }
      render();
    });
  });
}

function setupAddSeed(){
  const dlg = $('#addSeedModal');
  $('#addSeedBtn').addEventListener('click', ()=> dlg.showModal());
  $('#saveSeedBtn').addEventListener('click', (e)=>{
    e.preventDefault();
    const form = dlg.querySelector('form');
    const fd = new FormData(form);
    const seed = {
      name: fd.get('name') || '',
      species: fd.get('species') || '',
      germination: { days_min: Number(fd.get('gmin')||0), days_max: Number(fd.get('gmax')||0) },
      grow: { indoor: !!fd.get('indoor'), outdoor: !!fd.get('outdoor') },
      sowing: fd.get('sowing') || '',
      notes: (fd.get('notes')||'').split(',').map(s=>s.trim()).filter(Boolean),
      tags: (fd.get('tags')||'').split(',').map(s=>s.trim()).filter(Boolean)
    };
    state.seeds.unshift(seed);
    render();
    dlg.close();
  });
}

function setupExport(){
  $('#downloadCSV').addEventListener('click', ()=>{
    const rows = [
      ["name","species","germination_min","germination_max","indoor","outdoor","sowing","notes","tags"],
      ...state.seeds.map(s=>[
        s.name, s.species, s.germination.days_min, s.germination.days_max,
        s.grow.indoor, s.grow.outdoor, s.sowing,
        (s.notes||[]).join('|'), (s.tags||[]).join('|')
      ])
    ].map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([rows], {type:"text/csv;charset=utf-8"});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = "semillas.csv"; a.click(); URL.revokeObjectURL(a.href);
  });
}

function setupBasic(){
  $('#refreshBtn').addEventListener('click', ()=>loadSeeds());
}

document.addEventListener('DOMContentLoaded', ()=>{
  setupTabs(); setupSearch(); setupChips(); setupAddSeed(); setupExport(); setupBasic(); loadSeeds();
});
