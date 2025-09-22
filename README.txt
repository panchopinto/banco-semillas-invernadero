Banco de Semillas — Dashboard (CSV v2)
======================================
Mejoras:
- **Borrar** registros (confirmación). *No toca tu CSV remoto; guarda en LocalStorage para no romper producción.*
- **Detalle** por semilla en **drawer** (especie, germinación, interior/exterior, siembra, notas, tags).
- **Importar CSV** desde archivo — fusiona en memoria.
- **Persistencia local**: Añadidos y borrados sobreviven recarga.
- **Modo Solo Lectura** (Config) — oculta Añadir/Borrar para vista de colegas/administrativos.
- Botones conectados: Refresh (resetea a CSV), Exportar (CSV), Imprimir (vista actual).

Cómo conectar a Google Sheets
-----------------------------
1) Publica tu hoja como CSV (Archivo → Compartir → Publicar en la web → CSV).
2) Reemplaza en `js/app_csv_v2.js`: `const CSV_URL = "data/seeds.csv"` por tu URL pública.

Notas
-----
- Para un entorno multiusuario real (varios profes a la vez), conviene un backend (Sheet API con Apps Script o supabase).
- El borrado actual es "no destructivo": se registra en LocalStorage y se aplica sobre los datos del CSV base.