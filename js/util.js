/* Utilidades matemáticas y de color */
(function () {
  const U = {};

  U.limitar = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.mezcla = (a, b, t) => a + (b - a) * t;
  U.suave = (t) => t * t * (3 - 2 * t);
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.TAU = Math.PI * 2;

  // Generador pseudoaleatorio con semilla (el mundo sale igual siempre)
  U.semilla = function (s) {
    let a = s >>> 0;
    const f = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.rango = (min, max) => min + f() * (max - min);
    f.entero = (min, max) => Math.floor(f.rango(min, max + 1));
    f.elige = (arr) => arr[Math.floor(f() * arr.length)];
    return f;
  };

  U.azar = (min, max) => min + Math.random() * (max - min);

  // Colores: '#rrggbb' <-> [r,g,b]
  U.hex = function (h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.mezclaColor = function (c1, c2, t) {
    return [
      Math.round(U.mezcla(c1[0], c2[0], t)),
      Math.round(U.mezcla(c1[1], c2[1], t)),
      Math.round(U.mezcla(c1[2], c2[2], t))
    ];
  };
  U.rgb = (c, a) => (a === undefined ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`);

  // Interpola una lista de fotogramas clave [{t, c:[r,g,b]}] (t entre 0 y 1, cíclico)
  U.claveColor = function (claves, t) {
    for (let i = 0; i < claves.length - 1; i++) {
      const a = claves[i], b = claves[i + 1];
      if (t >= a.t && t <= b.t) {
        return U.mezclaColor(a.c, b.c, U.suave((t - a.t) / (b.t - a.t || 1)));
      }
    }
    return claves[claves.length - 1].c;
  };

  // Suaviza una polilínea con Catmull-Rom y devuelve muchos puntos
  U.suavizarLinea = function (pts, pasos) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let s = 0; s < pasos; s++) {
        const t = s / pasos, t2 = t * t, t3 = t2 * t;
        out.push({
          x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        });
      }
    }
    out.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y });
    return out;
  };

  // Distancia de un punto a una polilínea
  U.distALinea = function (pts, x, y) {
    let mejor = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i].x, ay = pts[i].y, bx = pts[i + 1].x, by = pts[i + 1].y;
      const dx = bx - ax, dy = by - ay;
      const l2 = dx * dx + dy * dy || 1;
      let t = ((x - ax) * dx + (y - ay) * dy) / l2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
      if (d < mejor) mejor = d;
    }
    return mejor;
  };

  // Puntos repartidos a lo largo de una polilínea cada "paso" unidades
  U.puntosCada = function (pts, paso, inicio) {
    const out = [];
    let acum = inicio || 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i].x, ay = pts[i].y, bx = pts[i + 1].x, by = pts[i + 1].y;
      const l = Math.hypot(bx - ax, by - ay);
      while (acum <= l) {
        const t = acum / (l || 1);
        out.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, nx: -(by - ay) / (l || 1), ny: (bx - ax) / (l || 1) });
        acum += paso;
      }
      acum -= l;
    }
    return out;
  };

  J.U = U;
})();
