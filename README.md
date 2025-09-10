# Banco de Semillas — Dashboard
Panel web estático (HTML/CSS/JS) para gestionar tu banco de semillas en el invernadero.

## Funciones clave
- 📊 **KPIs**: total de variedades, stock, próximas a caducar.
- 🔎 **Búsqueda y filtros** por tipo, ciclo, época de siembra/trasplante y etiquetas (PIE, orgánica, semilla propia).
- 🧭 **Tabla** con: nombre, científico, tipo, periodos, germinación, profundidad/distancia, riego, ubicación, stock, responsable.
- ➕ **Añadir/Editar** semillas en un modal con validación. Campos para *Profesor responsable, Curso/Proyecto y Uso previsto*.
- 📥 **Importar CSV** y 📤 **Exportar CSV** (compatible con Google Sheets).
- 📅 **Calendario** de siembras sugeridas (próximos 6 meses) según `Periodo de siembra`.
- 🎯 **Enlace para QR** por semilla (copiado al portapapeles) para fichas rápidas en terreno.
- 🎨 **Botones multicolor con iconos** estilo “portafolio unificado”.

## Uso
1. Abre `index.html` (puedes subirlo a GitHub Pages).
2. Para datos de ejemplo, se carga `data/seeds_sample.csv` la primera vez. Luego los datos quedan en `localStorage`.
3. Importa tu propio CSV si ya tienes un inventario.
4. Exporta CSV cuando quieras respaldar/compartir.

## Formato CSV
Incluye estas columnas (puedes exportar desde el panel para ver el formato completo):

```
id,nombre,cientifico,familia,tipo,ciclo,siembra,trasplante,germinacion,temp,prof,dist,luz,riego,ubicacion,stock,lote,vida,responsable,curso,uso,asocia,anti,plagas,reco,notas,pie,organica,propia
```

- `siembra` y `trasplante` aceptan rangos por mes en formato `sep-oct, mar-abr`.
- `vida` es años de vida útil estimada para estimar caducidad.
- `pie`, `organica`, `propia` son booleanos (`true`/`false`).

## Créditos
Diseño y desarrollo colaborativo con **Francisco Pinto Aravena** para el Liceo Bicentenario de Excelencia Polivalente San Nicolás (Ñuble, Chile).
