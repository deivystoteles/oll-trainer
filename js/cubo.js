// Todo lo que toca al <twisty-player>: mostrar un caso, inspección de cámara y animación.
const player = document.getElementById("cubo");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const nextFrame = () => new Promise(r => requestAnimationFrame(r));

// IMPORTANTE: no tocar propiedades del player (alg, etc.) antes de que el custom
// element esté definido; si no, se crea una propiedad propia que tapa el setter real.
export const playerListo = customElements.whenDefined("twisty-player");

export async function mostrarCaso(setupAlg) {
  await playerListo;
  player.pause(); // corta cualquier animación en curso
  player.alg = "";
  player.setAttribute("experimental-setup-alg", setupAlg);
}

/* ---------- Inspección: balanceo corto de cámara ---------- */
let animId = null;
const detenerInspeccion = () => cancelAnimationFrame(animId);

export function inspeccion() {
  detenerInspeccion();
  const dur = 1400, t0 = performance.now();
  const LAT_BASE = 58, AMP_LAT = 6, AMP_LON = 22;

  function frame(now) {
    const t = Math.min(1, (now - t0) / dur);
    player.setAttribute("camera-longitude", (AMP_LON * Math.sin(t * 2 * Math.PI)).toFixed(1));
    player.setAttribute("camera-latitude", (LAT_BASE - AMP_LAT * Math.sin(t * Math.PI)).toFixed(1));
    if (t < 1) animId = requestAnimationFrame(frame);
  }
  animId = requestAnimationFrame(frame);
}

// Si agarras el cubo con el mouse, se detiene la animación
player.addEventListener("pointerdown", detenerInspeccion);

/* ---------- Resolver (animación) ---------- */
// Espera a que el modelo procese el alg (la línea de tiempo deja de ser 0)
async function esperarLineaDeTiempo() {
  for (let i = 0; i < 40; i++) {
    const r = await player.experimentalModel.timeRange.get();
    if (r && r.end > r.start) return true;
    await sleep(50);
  }
  return false;
}

export async function animarSolucion(alg) {
  try {
    await playerListo;
    detenerInspeccion();
    player.pause();
    player.alg = alg;
    if (!await esperarLineaDeTiempo()) return console.warn("[cubo] el alg no se aplicó");
    player.jumpToStart({ flash: false });
    await nextFrame();
    await nextFrame();
    player.play();
  } catch (e) {
    console.error("[cubo] error al animar:", e);
  }
}