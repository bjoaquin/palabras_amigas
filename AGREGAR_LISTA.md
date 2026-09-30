# Cómo agregar una lista nueva

Ejemplo: sumar una lista de animales (`animales.txt`).

## 1. Crear el archivo `.txt`

Guardalo dentro de la carpeta `words/`.

- Una palabra o expresión por línea.
- Codificación **UTF-8** (en el Bloc de notas de Windows: *Guardar como* → Codificación: UTF-8).
- Mayúsculas y tildes no importan: la app las normaliza sola.
- Las repeticiones se ignoran, así que no hace falta limpiar duplicados.
- Nombre del archivo en minúsculas, sin espacios ni tildes (`animales.txt`, no `Animales Salvajes.txt`).

```
perro
gato
caballo
vaca
```

## 2. Registrarlo en `words/manifest.json`

La app no puede listar la carpeta sola, así que hay que agregar una línea con el nombre del archivo y el texto que se verá en el desplegable:

```json
[
  { "file": "colores.txt", "label": "Colores" },
  { "file": "paises.txt", "label": "Países" },
  { "file": "nombres.txt", "label": "Nombres" },
  { "file": "animales.txt", "label": "Animales" }
]
```

Cuidado con las comas: todas las líneas llevan coma al final **menos la última**.

## 3. Probar en local

Desde la carpeta del proyecto:

```
python -m http.server
```

Abrí `http://localhost:8000` y recargá sin caché con `Ctrl+F5` (`Cmd+Shift+R` en Mac). La lista nueva debería aparecer en el desplegable.

## 4. Subir a GitHub

```
git add words/
git commit -m "Agrego lista de animales"
git push
```

Vercel o Netlify vuelven a publicar solos en uno o dos minutos. Después recargá la página con `Ctrl+F5`.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| La lista no aparece en el desplegable | Falta la línea en `manifest.json` o hay un error de comas. |
| Aparece, pero dice que no pudo cargarla | El valor de `file` no coincide **exactamente** con el nombre del archivo. |
| Funciona en local pero no en Vercel o Netlify | Diferencia de mayúsculas: Windows y Mac no distinguen `Animales.txt` de `animales.txt`, pero el servidor sí. |
| Letras raras (`Ã±`, `Ã³`) | El archivo no está guardado en UTF-8. |
| Sigo viendo la versión vieja | Recargá con `Ctrl+F5`. |
