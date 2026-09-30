# Palabras amigas y enemigas

- **Amigas**: misma cantidad de letras y misma estructura vocal/consonante (PASEO ↔ PIQUE).
- **Enemigas**: misma cantidad de letras con la estructura invertida.

## Listado completo
"Ver todos los amigos/enemigos" muestra cada palabra de la lista con su cantidad de
amigos/enemigos, de menos a más. Un clic en la fila despliega el detalle.
Las palabras sin amigos/enemigos se omiten del listado.
Dos switches permiten ordenar por frecuencia o alfabéticamente, y en forma ascendente o descendente.
Un selector de doble punta filtra por cantidad (de 1 a la mayor cantidad registrada para una palabra de la lista).

## Agregar listas
1. Poné un `.txt` en `words/` (una palabra o expresión por línea).
2. Sumalo a `words/manifest.json` con su `file` y su `label`.

Reglas de normalización: se pasa a mayúsculas, se ignoran tildes (la Ñ se conserva),
los espacios y guiones no cuentan como letras, y la Y se considera consonante.

## Probar en local
`fetch` no funciona abriendo el archivo con doble clic. Desde esta carpeta:

    npx serve .
    # o: python3 -m http.server 8000

## Publicar
Es un sitio estático, sin build. En Vercel o Netlify: importá el repo de GitHub,
dejá el comando de build vacío y el directorio de salida en la raíz (`.`).
