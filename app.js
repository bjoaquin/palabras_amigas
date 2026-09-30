const VOCALES = "AEIOU";
const $ = (id) => document.getElementById(id);
const lista = $("lista"), input = $("palabra"), sug = $("sugerencias");
const vista = $("vista"), resultado = $("resultado");
const filtro = $("filtro"), rango = $("rango"), rMin = $("rango-min"), rMax = $("rango-max");
const filtroValor = $("filtro-valor"), filtroTitulo = $("filtro-titulo");
let listado = null;  // estado del listado completo actual
const estado = { freq: true, desc: false };  // orden: frecuencia/alfabético, descendente/ascendente
const swFreq = $("sw-freq"), swDesc = $("sw-desc");

let palabras = [];   // [{ texto, clave, patron }]
let activo = -1;     // sugerencia resaltada

/* ---------- Normalización ---------- */
// Mayúsculas, sin tildes (conserva la Ñ), solo letras y espacios.
function normalizar(s) {
  return s
    .toUpperCase()
    .replace(/Ñ/g, "#")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/#/g, "Ñ")
    .replace(/['’]/g, "")
    .replace(/[^A-ZÑ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const clave = (t) => t.replace(/ /g, "");
const patron = (t) => [...clave(t)].map((c) => (VOCALES.includes(c) ? "V" : "C")).join("");
const invertir = (p) => p.replace(/[VC]/g, (x) => (x === "V" ? "C" : "V"));

/* ---------- Render ---------- */
function palabraColoreada(texto, tag = "span") {
  const el = document.createElement(tag);
  el.className = "palabra";
  for (const ch of texto) {
    if (ch === " ") { el.append(" "); continue; }
    const s = document.createElement("span");
    s.className = VOCALES.includes(ch) ? "v" : "c";
    s.textContent = ch;
    el.append(s);
  }
  return el;
}

function actualizarVista() {
  const q = normalizar(input.value);
  vista.replaceChildren();
  if (!clave(q)) return;
  vista.append(palabraColoreada(q, "div"));
  const p = document.createElement("div");
  p.className = "pat";
  p.textContent = "Estructura: " + patron(q).split("").join(" ");
  vista.append(p);
}

/* ---------- Sugerencias ---------- */
function cerrarSugerencias() {
  sug.hidden = true; sug.replaceChildren(); activo = -1;
  input.setAttribute("aria-expanded", "false");
}
function actualizarSugerencias() {
  const q = normalizar(input.value);
  cerrarSugerencias();
  if (!q) return;
  const items = palabras.filter((w) => w.texto.startsWith(q) && w.texto !== q).slice(0, 8);
  if (!items.length) return;
  items.forEach((w, i) => {
    const li = document.createElement("li");
    li.role = "option"; li.id = "sug-" + i;
    li.append(palabraColoreada(w.texto));
    li.addEventListener("mousedown", (e) => { e.preventDefault(); elegir(w.texto); });
    sug.append(li);
  });
  sug.hidden = false;
  input.setAttribute("aria-expanded", "true");
}
function elegir(texto) {
  input.value = texto;
  cerrarSugerencias();
  actualizarVista();
}
function moverActivo(d) {
  const lis = [...sug.children];
  if (!lis.length) return;
  activo = (activo + d + lis.length) % lis.length;
  lis.forEach((li, i) => li.setAttribute("aria-selected", i === activo));
  input.setAttribute("aria-activedescendant", lis[activo].id);
}

input.addEventListener("input", () => { actualizarVista(); actualizarSugerencias(); });
input.addEventListener("blur", cerrarSugerencias);
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); moverActivo(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); moverActivo(-1); }
  else if (e.key === "Escape") cerrarSugerencias();
  else if (e.key === "Enter" && activo >= 0) { e.preventDefault(); elegir(sug.children[activo].textContent); }
});

/* ---------- Búsqueda ---------- */
function buscar(modo) {
  const q = normalizar(input.value);
  resultado.replaceChildren();
  filtro.hidden = true; listado = null;
  if (!clave(q)) { mensaje("Escribí una palabra para buscar."); return; }

  const pat = patron(q);
  const objetivo = modo === "amigos" ? pat : invertir(pat);
  const hallados = palabras.filter((w) => w.patron === objetivo && w.clave !== clave(q));

  const h = document.createElement("h2");
  const n = hallados.length;
  const sust = modo === "amigos" ? ["amigo", "amigos"] : ["enemigo", "enemigos"];
  h.textContent = `${n} ${n === 1 ? sust[0] : sust[1]} de ${q} en «${lista.selectedOptions[0].textContent}»`;
  resultado.append(h);

  const nota = document.createElement("p");
  nota.className = "nota";
  nota.textContent = "Estructura buscada: " + objetivo.split("").join(" ");
  resultado.append(nota);

  if (!n) { mensaje("Ninguna palabra de esta lista tiene esa estructura."); return; }
  const ul = document.createElement("ul");
  ul.className = "lista";
  hallados.forEach((w) => {
    const li = document.createElement("li");
    li.append(palabraColoreada(w.texto));
    ul.append(li);
  });
  resultado.append(ul);
}
function mensaje(txt) {
  const p = document.createElement("p");
  p.className = "nota"; p.textContent = txt;
  resultado.append(p);
}
$("btn-amigos").addEventListener("click", () => buscar("amigos"));
$("btn-enemigos").addEventListener("click", () => buscar("enemigos"));


/* ---------- Listado completo ---------- */
// Para cada palabra de la lista, cuenta sus amigos/enemigos y ordena de menor a mayor.
function listarTodo(modo) {
  resultado.replaceChildren();
  filtro.hidden = true; listado = null;
  if (!palabras.length) { mensaje("La lista está vacía o no se cargó."); return; }

  const grupos = new Map();
  for (const w of palabras) {
    if (!grupos.has(w.patron)) grupos.set(w.patron, []);
    grupos.get(w.patron).push(w);
  }
  const filas = palabras.map((w) => {
    const objetivo = modo === "amigos" ? w.patron : invertir(w.patron);
    const relacionadas = (grupos.get(objetivo) || []).filter((x) => x.clave !== w.clave);
    return { w, relacionadas };
  }).sort((a, b) => a.relacionadas.length - b.relacionadas.length); // estable: empates en orden alfabético

  const conResultados = filas.filter((f) => f.relacionadas.length > 0);
  const omitidas = filas.length - conResultados.length;
  const nombreLista = lista.selectedOptions[0].textContent;
  if (!conResultados.length) {
    mensaje(`Ninguna palabra de «${nombreLista}» tiene ${modo}.`);
    return;
  }

  const h = document.createElement("h2");
  const nota = document.createElement("p");
  nota.className = "nota";
  const cont = document.createElement("div");
  cont.className = "filas";
  resultado.append(h, nota, cont);
  listado = { modo, filas: conResultados, omitidas, nombreLista, h, nota, cont };

  // El rango va de 1 a la mayor cantidad de amigos/enemigos que tiene alguna palabra
  // (la lista está ordenada de menos a más, así que es la última fila).
  const N = conResultados[conResultados.length - 1].relacionadas.length;
  filtroTitulo.textContent = "Cantidad de " + modo;
  for (const r of [rMin, rMax]) { r.min = 1; r.max = N; r.disabled = N === 1; }
  rMin.value = 1; rMax.value = N;
  filtro.hidden = false;
  pintarListado();
}

function filaDesplegable(w, relacionadas) {
  const cuenta = document.createElement("span");
  cuenta.className = "cuenta";
  cuenta.textContent = relacionadas.length;
  const det = document.createElement("details");
  det.className = "fila";
  const sum = document.createElement("summary");
  sum.append(palabraColoreada(w.texto), cuenta);
  det.append(sum);
  let armado = false;
  det.addEventListener("toggle", () => {   // se arma al abrir, para no inflar el DOM
    if (!det.open || armado) return;
    armado = true;
    const ul = document.createElement("ul");
    ul.className = "lista";
    relacionadas.forEach((r) => {
      const li = document.createElement("li");
      li.append(palabraColoreada(r.texto));
      ul.append(li);
    });
    det.append(ul);
  });
  return det;
}

function pintarListado() {
  if (!listado) return;
  const { modo, filas, omitidas, nombreLista, h, nota, cont } = listado;
  const min = +rMin.value, max = +rMax.value, N = +rMax.max;

  filtroValor.textContent = min === max ? String(min) : `de ${min} a ${max}`;
  rango.style.setProperty("--a", N > 1 ? (min - 1) / (N - 1) : 0);
  rango.style.setProperty("--b", N > 1 ? (max - 1) / (N - 1) : 1);
  rMin.style.zIndex = min > (N + 1) / 2 ? 3 : 1;   // si ambas puntas se juntan a la derecha, la del mínimo queda accesible

  const dir = estado.desc ? -1 : 1;
  const porTexto = (a, b) => a.w.texto.localeCompare(b.w.texto, "es");
  const visibles = filas
    .filter((f) => f.relacionadas.length >= min && f.relacionadas.length <= max)
    .sort(estado.freq
      ? (a, b) => dir * (a.relacionadas.length - b.relacionadas.length) || porTexto(a, b)  // empates: A-Z
      : (a, b) => dir * porTexto(a, b));

  const orden = estado.freq
    ? `Ordenadas de ${estado.desc ? "más a menos" : "menos a más"} ${modo}.`
    : `Ordenadas alfabéticamente${estado.desc ? " al revés (Z-A)" : ""}.`;
  h.textContent = `${visibles.length} de ${filas.length} palabras de «${nombreLista}» con ${modo}`;
  nota.textContent = orden + " Hacé clic en una palabra para ver sus " + modo + "." +
    (omitidas ? ` Se omitieron ${omitidas} sin ${modo}.` : "");

  cont.replaceChildren();
  if (!visibles.length) {
    const p = document.createElement("p");
    p.className = "nota";
    p.style.padding = ".75rem .9rem";
    p.textContent = `Ninguna palabra tiene entre ${min} y ${max} ${modo}.`;
    cont.append(p);
    return;
  }
  for (const { w, relacionadas } of visibles) cont.append(filaDesplegable(w, relacionadas));
}

let pendiente = false;
function pedirRepintado() {       // agrupa varios eventos de arrastre en un solo repintado
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => { pendiente = false; pintarListado(); });
}
rMin.addEventListener("input", () => { if (+rMin.value > +rMax.value) rMin.value = rMax.value; pedirRepintado(); });
rMax.addEventListener("input", () => { if (+rMax.value < +rMin.value) rMax.value = rMin.value; pedirRepintado(); });

/* Switches de orden */
function pintarSwitches() {
  swFreq.setAttribute("aria-checked", String(estado.freq));
  swDesc.setAttribute("aria-checked", String(estado.desc));
  document.querySelectorAll(".sw-txt").forEach((b) => {
    b.classList.toggle("activo", (b.dataset.v === "1") === estado[b.dataset.sw]);
  });
}
swFreq.addEventListener("click", () => { estado.freq = !estado.freq; pintarSwitches(); pintarListado(); });
swDesc.addEventListener("click", () => { estado.desc = !estado.desc; pintarSwitches(); pintarListado(); });
document.querySelectorAll(".sw-txt").forEach((b) => b.addEventListener("click", () => {
  estado[b.dataset.sw] = b.dataset.v === "1"; pintarSwitches(); pintarListado();
}));
pintarSwitches();

$("btn-todos-amigos").addEventListener("click", () => listarTodo("amigos"));
$("btn-todos-enemigos").addEventListener("click", () => listarTodo("enemigos"));

/* ---------- Carga de listas ---------- */
async function cargarLista(archivo) {
  resultado.replaceChildren();
  filtro.hidden = true; listado = null;
  try {
    const res = await fetch("words/" + archivo);
    if (!res.ok) throw new Error(res.status);
    const texto = await res.text();
    const vistos = new Set();
    palabras = texto.split(/\r?\n/).map(normalizar).filter((t) => {
      if (!clave(t) || vistos.has(t)) return false;
      vistos.add(t); return true;
    }).map((t) => ({ texto: t, clave: clave(t), patron: patron(t) }))
      .sort((a, b) => a.texto.localeCompare(b.texto, "es"));
  } catch {
    palabras = [];
    mensaje("No se pudo cargar «" + archivo + "». Si abriste index.html con doble clic, levantá un servidor local (ver README).");
  }
  actualizarSugerencias();
}
lista.addEventListener("change", () => cargarLista(lista.value));

(async function iniciar() {
  try {
    const res = await fetch("words/manifest.json");
    const items = await res.json();
    items.forEach(({ file, label }) => lista.append(new Option(label, file)));
    await cargarLista(lista.value);
  } catch {
    mensaje("No se pudo leer words/manifest.json. Si abriste index.html con doble clic, levantá un servidor local (ver README).");
  }
})();
