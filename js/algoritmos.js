// Lógica pura de algoritmos OLL: inversión, mini simulador y diagramas SVG.
// No toca el DOM (salvo generar strings SVG) ni el reproductor.
// Usa el global OLL definido en oll-data.js.

// Giros del cubo entero (eje vertical) que se aplican al azar a cada caso.
export const ROTACIONES = ["", "y", "y'", "y2"];

export const TOTAL = Object.keys(OLL).length;

/* ---------- Inversión de algoritmos ---------- */
function invertMove(m) {
  if (m.endsWith("2")) return m;
  if (m.endsWith("'")) return m.slice(0, -1);
  return m + "'";
}

export function invertAlg(alg) {
  return alg
    .trim()
    .split(/\s+/)
    .filter(Boolean) // "" (sin giro) debe dar "", no "'"
    .reverse()
    .map(invertMove)
    .join(" ");
}

// El setup ya no se guarda a mano: es la inversa exacta del solve.
// Así: setup + solve = cubo resuelto.
export const casoOLL = num => {
  const solve = OLL[num].solve;
  return { setup: invertAlg(solve), solve };
};

/* ---------- Mini simulador ----------
   Cada sticker tiene posición (x,y,z) y normal; U = +y, F = +z, R = +x */
const ROT = {
  X:  ([x, y, z]) => [x, z, -y],
  Xi: ([x, y, z]) => [x, -z, y],
  Y:  ([x, y, z]) => [-z, y, x],
  Yi: ([x, y, z]) => [z, y, -x],
  Z:  ([x, y, z]) => [y, -x, z],
  Zi: ([x, y, z]) => [-y, x, z],
};
const INV = { X: "Xi", Xi: "X", Y: "Yi", Yi: "Y", Z: "Zi", Zi: "Z" };
const MOV = {
  R: [p => p[0] === 1,  "X"],  r: [p => p[0] >= 0, "X"],
  L: [p => p[0] === -1, "Xi"], l: [p => p[0] <= 0, "Xi"], M: [p => p[0] === 0, "Xi"],
  U: [p => p[1] === 1,  "Y"],  D: [p => p[1] === -1, "Yi"],
  F: [p => p[2] === 1,  "Z"],  f: [p => p[2] >= 0, "Z"],
  B: [p => p[2] === -1, "Zi"],
};

// Patrón de la última capa tras aplicar caseAlg desde el cubo resuelto
export function patronCaso(caseAlg) {
  const st = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const pos = [x, y, z];
    [[x, 0, 0], [0, y, 0], [0, 0, z]].forEach(n => {
      if (n[0] || n[1] || n[2]) st.push({ pos: pos.slice(), n, color: n.join() });
    });
  }

  for (const tok of caseAlg.trim().split(/\s+/).filter(Boolean)) {
    if (!MOV[tok[0]]) throw new Error(`Movimiento no soportado: "${tok}" (alg: ${caseAlg})`);
    const [cond, rotBase] = MOV[tok[0]];
    const suf = tok.slice(1);
    const rot = ROT[suf === "'" ? INV[rotBase] : rotBase];
    const veces = suf === "2" ? 2 : 1;
    for (const s of st) {
      if (!cond(s.pos)) continue;
      for (let k = 0; k < veces; k++) { s.pos = rot(s.pos); s.n = rot(s.n); }
    }
  }

  const ARRIBA = "0,1,0";
  const top = [[false, false, false], [false, false, false], [false, false, false]];
  const lados = []; // { lado: "arriba"|"abajo"|"izq"|"der", i: 0..2 }
  for (const s of st) {
    if (s.pos[1] !== 1 || s.color !== ARRIBA) continue;
    const [nx, ny, nz] = s.n;
    if (ny === 1) top[s.pos[2] + 1][s.pos[0] + 1] = true;
    else if (nz === -1) lados.push({ lado: "arriba", i: s.pos[0] + 1 });
    else if (nz === 1)  lados.push({ lado: "abajo",  i: s.pos[0] + 1 });
    else if (nx === -1) lados.push({ lado: "izq",    i: s.pos[2] + 1 });
    else if (nx === 1)  lados.push({ lado: "der",    i: s.pos[2] + 1 });
  }
  return { top, lados };
}

// Caso al que se aplica directamente este algoritmo de solución
const patronOLL = solve => patronCaso(invertAlg(solve));

/* ---------- Diagrama estilo libro ---------- */
// Forma del color de arriba + barritas en los costados. Usa var(--top) para el color.
export function diagrama(alg) {
  const { top, lados } = patronOLL(alg);
  let s = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    s += `<rect x="${15 + c * 24}" y="${15 + r * 24}" width="22" height="22" ` +
         `fill="${top[r][c] ? "var(--top)" : "#33333d"}"/>`;
  }
  for (const { lado, i } of lados) {
    const p = 15 + i * 24;
    if (lado === "arriba")     s += `<rect x="${p}" y="6"  width="22" height="6" fill="var(--top)"/>`;
    else if (lado === "abajo") s += `<rect x="${p}" y="88" width="22" height="6" fill="var(--top)"/>`;
    else if (lado === "izq")   s += `<rect x="6"  y="${p}" width="6" height="22" fill="var(--top)"/>`;
    else                       s += `<rect x="88" y="${p}" width="6" height="22" fill="var(--top)"/>`;
  }
  return s + "</svg>";
}