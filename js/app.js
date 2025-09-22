
async function loadSeeds(){
  const cont = document.getElementById('seed-list');
  if(!cont) return;
  try{
    const res = await fetch('data/seeds.json'); const data = await res.json();
    cont.innerHTML = data.map(s => `
      <article class="card seed-card"
        data-name="${s.name}"
        data-species="${s.species||''}"
        data-notes="${(s.notes||'').join(', ')}"
        data-tags="${(s.tags||[]).join(',')}">
        <div class="card-header">
          <span class="badge">${s.germination.days_min}-${s.germination.days_max} días</span>
          <h3 class="card-title">${s.name}</h3>
        </div>
        <div class="card-body">
          <p><strong>Especie:</strong> ${s.species||'—'}</p>
          <p><strong>Interior/Exterior:</strong> ${s.grow.indoor && s.grow.outdoor ? 'Ambos' : (s.grow.indoor ? 'Interior' : 'Exterior')}</p>
          <p><strong>Siembra:</strong> ${s.sowing||'—'}</p>
          <p><strong>Notas:</strong> ${(s.notes||[]).join(' · ')||'—'}</p>
          <div class="tags">
            ${(s.tags||[]).map(t=>`<span class="pill">${t}</span>`).join('')}
          </div>
        </div>
      </article>
    `).join('');
  }catch(e){
    cont.innerHTML = '<div class="empty">No se pudieron cargar las semillas.</div>';
  }
}
document.addEventListener('DOMContentLoaded', loadSeeds);
