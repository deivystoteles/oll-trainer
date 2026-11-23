// Entrenador OLL: estado, pesos, UI y eventos.
import { TOTAL, casoOLL, diagrama, invertAlg, ROTACIONES } from "./algoritmos.js";
import { playerListo, mostrarCaso, inspeccion, animarSolucion } from "./cubo.js";

const $ = id => document.getElementById(id);

/* ---------- Configuración ---------- */
const PESO_INICIAL = 4, PESO_MIN = 1, PESO_MAX = 16;
const KEY_PESOS = "oll-pesos", KEY_COLOR = "oll-color-arriba";

// rot = giro del cubo entero que deja ese color arriba
const COLORES = {
  white:  { css: "#ffffff", rot: ""   },
  yellow: { css: "#ffd500", rot: "z2" },
  green:  { css: "#00c853", rot: "x"  },
  blue:   { css: "#2962ff", rot: "x'" },
  red:    { css: "#e53935", rot: "z'" },
  orange: { css: "#ff9100", rot: "z"  },
};

// Familias de formas para filtrar la lista. rep = caso que se dibuja como icono.
const FAMILIAS = [
  { id: "punto",    nombre: "Punto",       rep: 1,  casos: [1, 2, 3, 4, 17, 18, 19, 20] },
  { id: "cruz",     nombre: "Cruz",        rep: 21, casos: [21, 22, 23, 24, 25, 26, 27] },
  { id: "esquinas", nombre: "Esquinas",    rep: 28, casos: [28, 57] },
  { id: "cuadrado", nombre: "Cuadrado",    rep: 5,  casos: [5, 6] },
  { id: "rayo-p",   nombre: "Rayo peq.",   rep: 7,  casos: [7, 8, 11, 12] },
  { id: "rayo-g",   nombre: "Rayo grande", rep: 39, casos: [39, 40] },
  { id: "pez",      nombre: "Pez",         rep: 9,  casos: [9, 10, 35, 37] },
  { id: "caballo",  nombre: "Caballo",     rep: 13, casos: [13, 14, 15, 16] },
  { id: "raro",     nombre: "Raro",        rep: 29, casos: [29, 30, 41, 42] },
  { id: "p",        nombre: "P",           rep: 31, casos: [31, 32, 43, 44] },
  { id: "t",        nombre: "T",           rep: 33, casos: [33, 45] },
  { id: "c",        nombre: "C",           rep: 34, casos: [34, 46] },
  { id: "w",        nombre: "W",           rep: 36, casos: [36, 38] },
  { id: "linea",    nombre: "Línea",       rep: 51, casos: [51, 52, 55, 56] },
  { id: "l",        nombre: "L",           rep: 47, casos: [47, 48, 49, 50, 53, 54] },
];

/* ---------- Pesos (localStorage) ---------- */
let pesos = {};
try { pesos = JSON.parse(localStorage.getItem(KEY_PESOS)) || {}; } catch {}
const pesoDe = num => pesos[num] ?? PESO_INICIAL;

function registrarPeso(num, ok) {
  const w = pesoDe(num);
  pesos[num] = ok ? Math.max(PESO_MIN, w / 2) : Math.min(PESO_MAX, w * 2);
  try { localStorage.setItem(KEY_PESOS, JSON.stringify(pesos)); } catch {}
}

/* ---------- Color de la capa de arriba ---------- */
let colorArriba = "yellow";
try {
  const g = localStorage.getItem(KEY_COLOR);
  if (g && COLORES[g]) colorArriba = g;
} catch {}

function pintarColores() {
  const cont = $("colores");
  cont.innerHTML = "";
  for (const [nombre, c] of Object.entries(COLORES)) {
    const b = document.createElement("button");
    b.className = "swatch" + (nombre === colorArriba ? " activo" : "");
    b.style.background = c.css;
    b.title = nombre;
    b.addEventListener("click", () => {
      colorArriba = nombre;
      try { localStorage.setItem(KEY_COLOR, nombre); } catch {}
      pintarColores();
      mostrarActual();
      refrescarDetalles();
      $("vista-lista").style.setProperty("--top", COLORES[colorArriba].css);
    });
    cont.appendChild(b);
  }
}

/* ---------- Flujo de casos ---------- */
let last = -1;
let actual = null; // { num, solucion, giro, setup }
const ultimoGiro = {}; // último giro del cubo mostrado de cada caso

// Sorteo con pesos, sin repetir el caso anterior
function elegirIndice() {
  let total = 0;
  const lista = Array.from({ length: TOTAL }, (_, i) => {
    const w = i === last ? 0 : pesoDe(i + 1);
    total += w;
    return w;
  });
  let r = Math.random() * total;
  for (let i = 0; i < lista.length; i++) {
    r -= lista[i];
    if (r <= 0 && lista[i] > 0) return i;
  }
  return lista.findIndex(w => w > 0);
}

const mostrarActual = () =>
  actual && mostrarCaso((COLORES[colorArriba].rot + " " + actual.setup).trim());

// Carga un caso concreto (por sorteo o forzado desde la lista)
function cargarCaso(num) {
  last = num - 1;
  const caso = casoOLL(num); // caso.setup = inverso(solve)

  // Giro del cubo entero distinto al de la última vez que salió este caso
  const opciones = [0, 1, 2, 3].filter(k => k !== ultimoGiro[num]);
  const k = opciones[Math.floor(Math.random() * opciones.length)];
  ultimoGiro[num] = k;

  // Mezcla: inverso(solve) + giro
  actual = {
    num,
    solucion: caso.solve,
    giro: ROTACIONES[k],
    setup: (caso.setup + " " + ROTACIONES[k]).trim(),
  };
  mostrarActual();
  inspeccion();
  refrescarDetalles();
}

function siguienteCaso() {
  cargarCaso(elegirIndice() + 1);
}

// ok = true (✓ lo recordé): peso a la mitad. ok = false (✗): peso al doble.
function registrar(ok) {
  if (!actual) return;
  avisar(ok ? "ok" : "fallo");
  registrarPeso(actual.num, ok);
  siguienteCaso();
}

function saltar() {
  if (!actual) return;
  avisar("salto");
  siguienteCaso();
}

/* ---------- Aviso (✓ ✗ ➜) ---------- */
const ICONOS  = { ok: "✓", fallo: "✗", salto: "➜" };
const BOTONES = { ok: "btn-ok", fallo: "btn-fallo", salto: "siguiente" };

function avisar(tipo) {
  const aviso = $("aviso");
  aviso.className = "";
  void aviso.offsetWidth; // reinicia la animación aunque se presione muy rápido
  aviso.textContent = ICONOS[tipo];
  aviso.className = tipo + " show";

  const b = $(BOTONES[tipo]);
  b.classList.remove("pulso");
  void b.offsetWidth;
  b.classList.add("pulso");
}

/* ---------- Panel de detalles ---------- */
const detalles = $("detalles");

function renderDetalles() {
  detalles.style.setProperty("--top", COLORES[colorArriba].css);
  detalles.innerHTML =
    `<strong>OLL ${actual.num}</strong>` +
    `<div class="sol-label">Solución:</div>` +
    `<div class="sol">${actual.solucion}</div>` +
    `<div class="sol-label">Posición para aplicarlo:</div>` +
    `<div class="dib-mini">${diagrama(actual.solucion)}</div>` +
    `<button id="btn-resolver">▶ Resolver</button>` +
    `<button id="btn-reiniciar">↺ Reiniciar</button>`;
}

// Redibuja solo si el panel está abierto
function refrescarDetalles() {
  if (actual && !detalles.hidden) renderDetalles();
}

// Fase 1: deshacer el giro del cubo. Fase 2: aplicar el solve.
function resolver() {
  if (!actual) return;
  const fase1 = invertAlg(actual.giro);
  animarSolucion((fase1 + " " + actual.solucion).trim());
}

/* ---------- Vista: todos los algoritmos ---------- */
const vistaLista = $("vista-lista");
const gridAlgs = $("grid-algs");
const barras = [];
const cards = [];                 // cards[n - 1] = tarjeta del caso n
const filtrosActivos = new Set(); // ids de familias marcadas

function colorPeso(w) {
  // 1 (dominado) = verde ... 16 (muy flojo) = rojo
  const t = (Math.log2(w) - Math.log2(PESO_MIN)) / (Math.log2(PESO_MAX) - Math.log2(PESO_MIN));
  return `hsl(${Math.round(130 - 130 * t)}, 70%, 50%)`;
}

function crearGrid() {
  for (let n = 1; n <= TOTAL; n++) {
    const alg = casoOLL(n).solve;
    const card = document.createElement("div");
    card.className = "card-alg";
    card.innerHTML =
      `<div class="num">OLL ${n}</div>` +
      `<div class="dib">${diagrama(alg)}</div>` +
      `<div class="alg">${alg}</div>` +
      `<div class="peso"><i></i></div>`;
    // Clic: fuerza este caso y vuelve a la vista de práctica
    card.addEventListener("click", () => {
      cerrarLista();
      cargarCaso(n);
    });
    gridAlgs.appendChild(card);
    cards.push(card);
    barras.push(card.querySelector("i"));
  }
}

// Sin filtros marcados se ven los 57; con filtros, solo las familias marcadas
function aplicarFiltro() {
  const visibles = new Set();
  for (const f of FAMILIAS) {
    if (filtrosActivos.has(f.id)) f.casos.forEach(n => visibles.add(n));
  }
  cards.forEach((card, i) => {
    card.style.display = !filtrosActivos.size || visibles.has(i + 1) ? "" : "none";
  });
}

function crearFiltros() {
  const cont = $("filtros");
  for (const f of FAMILIAS) {
    const b = document.createElement("button");
    b.className = "filtro";
    b.title = `${f.nombre} (${f.casos.length} casos)`;
    b.innerHTML =
      `<span class="dib-f">${diagrama(casoOLL(f.rep).solve)}</span>` +
      `<span class="nom">${f.nombre}</span>`;
    b.addEventListener("click", () => {
      const activo = b.classList.toggle("activo");
      if (activo) filtrosActivos.add(f.id);
      else filtrosActivos.delete(f.id);
      aplicarFiltro();
    });
    cont.appendChild(b);
  }
}

function pintarPesos() {
  barras.forEach((b, i) => {
    const w = pesoDe(i + 1);
    b.style.width = (w / PESO_MAX * 100) + "%";
    b.style.background = colorPeso(w);
    b.parentElement.title = "Peso: " + w;
  });
}

function abrirLista() {
  if (!barras.length) { crearGrid(); crearFiltros(); }
  vistaLista.style.setProperty("--top", COLORES[colorArriba].css);
  pintarPesos();
  $("config").hidden = true;
  vistaLista.hidden = false;
  vistaLista.scrollTop = 0;
}
const cerrarLista = () => { vistaLista.hidden = true; };

/* ---------- Eventos ---------- */
$("siguiente").addEventListener("click", saltar);
$("btn-ok").addEventListener("click", () => registrar(true));
$("btn-fallo").addEventListener("click", () => registrar(false));

$("btn-detalles").addEventListener("click", () => {
  if (!actual) return;
  if (detalles.hidden) { renderDetalles(); detalles.hidden = false; }
  else detalles.hidden = true;
});
detalles.addEventListener("click", e => {
  if (e.target.id === "btn-resolver") resolver();
  else if (e.target.id === "btn-reiniciar") mostrarActual(); // vuelve al caso sin resolver
});

$("btn-config").addEventListener("click", () => { $("config").hidden = !$("config").hidden; });
$("btn-lista").addEventListener("click", abrirLista);
$("btn-cerrar-lista").addEventListener("click", cerrarLista);

document.addEventListener("keydown", e => {
  // Con la lista abierta solo Esc hace algo
  if (!vistaLista.hidden) {
    if (e.key === "Escape") cerrarLista();
    return;
  }
  if (e.repeat) return; // evita saltos si dejas la tecla apretada

  // Quita el foco de cualquier botón para que Espacio/Enter no dispare un clic extra
  if (document.activeElement?.tagName === "BUTTON") document.activeElement.blur();

  if (e.code === "Space") { e.preventDefault(); saltar(); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); registrar(false); }
  else if (e.key === "ArrowRight") { e.preventDefault(); registrar(true); }
});

/* ---------- Inicio ---------- */
pintarColores();
playerListo.then(siguienteCaso); // no se toca el player hasta que esté definido