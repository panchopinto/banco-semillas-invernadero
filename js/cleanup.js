
document.addEventListener('DOMContentLoaded', () => {
  const labels = ["🧩 Daltónicos","♻️ Reset estilos","📖 Lectura","🌞 Tema claro","🌙 Tema oscuro"]
    .map(s => s.trim().toLowerCase());
  const all = [...document.querySelectorAll('button, a, .btn, [role="button"]')];
  all.forEach(el => {
    const txt = (el.textContent || '').trim().toLowerCase();
    if(labels.includes(txt)){ el.remove(); }
  });
});
