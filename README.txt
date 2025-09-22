Banco de Semillas — Dashboard (CSV v3)
======================================

Incluye:
- 📊 KPIs (Variedades, Stock, Próximas a caducar)
- 🔎 Búsqueda + filtros por Tipo, Ciclo, Época, Etiquetas
- 🧭 Vista **Tabla** con columnas administrativas
- ➕/✏️ Modal con validación y nuevos campos (Responsable, Curso/Proyecto, Uso)
- 📥/📤 Importar/Exportar CSV (compatible con Google Sheets)
- 📅 Calendario próximos 6 meses según `periodo_siembra`
- 🎯 QR por semilla (copia enlace)
- 🎨 Botones multicolor con iconos

Conectar a Google Sheets
------------------------
Publica el sheet como CSV y reemplaza en `js/app_csv_v3.js`:
  const CSV_URL = "data/seeds.csv";

CSV esperado (cabeceras recomendadas)
-------------------------------------
name,species,type,cycle,periodo_siembra,periodo_trasplante,
germination_min,germination_max,depth,spacing,watering,location,stock,
responsable,curso,uso,indoor,outdoor,sowing,notes,tags,qr

Seguridad / vista pública
-------------------------
Activa **Modo solo lectura** en Config para ocultar Añadir/Borrar. Para multiusuario real, conviene backend (Apps Script/Sheets API).