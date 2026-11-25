/* Destino elegido en el mapa del reino y rutas para llegar:
   la más corta, en verde; el tramo ya recorrido se va borrando.
   Búsqueda A* sobre una rejilla del mundo; los portales arcoíris cuentan como atajos. */
(function () {
  const U = J.U, C = J.CFG;
  const CEL = 40;                                   // tamaño de cada casilla de la rejilla (unidades del mundo)
  const GW = Math.ceil(C.MUNDO_W / CEL), GH = Math.ceil(C.MUNDO_H / CEL), N = GW * GH;
  const RADIO_LLEGADA = 130;                        // a esta distancia del destino se da por llegada
  const RECALCULAR_SEG = 2;                         // la ruta se rehace cada RECALCULAR_SEG*3 s o al desviarse
  const R = {
    destino: null, pendiente: null, optima: [], t: 0, tCalc: 0, desde: null,
    pasable: null, costo: null, portal: null
  };

  const idx = (cx, cy) => cy * GW + cx;
  const celda = (x, y) => idx(U.limitar(Math.floor(x / CEL), 0, GW - 1), U.limitar(Math.floor(y / CEL), 0, GH - 1));
  const centro = (i) => ({ x: (i % GW) * CEL + CEL / 2, y: Math.floor(i / GW) * CEL + CEL / 2 });

  // ---------- Rejilla de casillas transitables (se arma una sola vez) ----------
  function prepararRejilla() {
    if (R.pasable) return;
    const M = J.Mundo, sala = M.salaActiva;
    M.salaActiva = null; // la rejilla es del exterior aunque Julieth esté dentro de un castillo
    R.pasable = new Uint8Array(N); R.costo = new Float32Array(N); R.portal = new Int32Array(N).fill(-1);
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      const x = cx * CEL + CEL / 2, y = cy * CEL + CEL / 2, i = idx(cx, cy);
      R.pasable[i] = M.bloqueado(x, y, 0, 14) ? 0 : 1;
      R.costo[i] = M.enCamino && M.enCamino(x, y) ? 0.85 : 1; // los caminos se prefieren un poquito
    }
    M.salaActiva = sala;
    // portales arcoíris: entrar en una casilla del portal lleva a la salida del otro
    for (const p of M.portales || []) {
      const a = cercanaPasable(p.x, p.y - 4), b = cercanaPasable(p.par.x, p.par.y + 46);
      if (a >= 0 && b >= 0) R.portal[a] = b;
    }
  }

  // casilla transitable más cercana a un punto (búsqueda en anillos)
  function cercanaPasable(x, y) {
    const cx0 = Math.floor(x / CEL), cy0 = Math.floor(y / CEL);
    for (let r = 0; r < 25; r++) {
      let mejor = -1, md = Infinity;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const cx = cx0 + dx, cy = cy0 + dy;
        if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue;
        const i = idx(cx, cy);
        if (!R.pasable[i]) continue;
        const d = dx * dx + dy * dy;
        if (d < md) { md = d; mejor = i; }
      }
      if (mejor >= 0) return mejor;
    }
    return -1;
  }

  // ---------- A* ----------
  const g = new Float32Array(N), padre = new Int32Array(N), visto = new Uint32Array(N), cerrado = new Uint32Array(N);
  let marca = 0;
  const heapI = new Int32Array(N * 2), heapF = new Float32Array(N * 2);
  let hn = 0;
  function push(i, f) {
    let k = hn++;
    while (k > 0) { const p = (k - 1) >> 1; if (heapF[p] <= f) break; heapI[k] = heapI[p]; heapF[k] = heapF[p]; k = p; }
    heapI[k] = i; heapF[k] = f;
  }
  function pop() {
    const top = heapI[0], li = heapI[--hn], lf = heapF[hn];
    let k = 0;
    for (;;) {
      let c = 2 * k + 1;
      if (c >= hn) break;
      if (c + 1 < hn && heapF[c + 1] < heapF[c]) c++;
      if (heapF[c] >= lf) break;
      heapI[k] = heapI[c]; heapF[k] = heapF[c]; k = c;
    }
    heapI[k] = li; heapF[k] = lf;
    return top;
  }
  const VEC = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];

  function aEstrella(ini, fin, penal) {
    if (++marca >= 0xffffffff) { marca = 1; visto.fill(0); cerrado.fill(0); }
    const fx = fin % GW, fy = Math.floor(fin / GW);
    // heurística admisible: distancia octil por el costo mínimo (camino); los portales la vuelven optimista, está bien
    const h = (i) => { const dx = Math.abs(i % GW - fx), dy = Math.abs(Math.floor(i / GW) - fy); return (Math.max(dx, dy) + 0.4142 * Math.min(dx, dy)) * 0.85; };
    hn = 0; g[ini] = 0; padre[ini] = -1; visto[ini] = marca; push(ini, h(ini));
    while (hn > 0) {
      const i = pop();
      if (cerrado[i] === marca) continue;
      cerrado[i] = marca;
      if (i === fin) break;
      const cx = i % GW, cy = Math.floor(i / GW), gi = g[i];
      const vecino = (j, paso) => {
        if (cerrado[j] === marca) return;
        const ng = gi + paso;
        if (visto[j] !== marca || ng < g[j]) { visto[j] = marca; g[j] = ng; padre[j] = i; push(j, ng + h(j)); }
      };
      for (const [dx, dy, d] of VEC) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const j = idx(nx, ny);
        if (!R.pasable[j]) continue;
        if (dx && dy && (!R.pasable[idx(cx + dx, cy)] || !R.pasable[idx(cx, cy + dy)])) continue; // sin cortar esquinas
        vecino(j, d * (R.costo[j] + (penal ? penal[j] : 0)));
      }
      if (R.portal[i] >= 0) vecino(R.portal[i], 3);
    }
    if (cerrado[fin] !== marca) return null;
    const camino = [];
    for (let k = fin; k >= 0; k = padre[k]) camino.push(k);
    camino.reverse();
    return { celdas: camino, costo: g[fin] };
  }

  // ---------- De casillas a una línea suave (cortada en los saltos de portal) ----------
  function visible(a, b) {
    const d = U.dist(a.x, a.y, b.x, b.y), n = Math.ceil(d / (CEL * 0.4));
    for (let k = 1; k < n; k++) {
      const x = a.x + (b.x - a.x) * k / n, y = a.y + (b.y - a.y) * k / n;
      // margen: también las casillas vecinas en cruz deben ser transitables, así la línea no roza obstáculos
      const cx = Math.floor(x / CEL), cy = Math.floor(y / CEL);
      if (!R.pasable[idx(cx, cy)]) return false;
    }
    return true;
  }
  function suavizar(pts) {
    if (pts.length < 3) return pts;
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = Math.min(pts.length - 1, i + 60);
      while (j > i + 1 && !visible(pts[i], pts[j])) j--;
      out.push(pts[j]); i = j;
    }
    // Chaikin: redondea las esquinas
    let res = out;
    for (let it = 0; it < 2; it++) {
      const nv = [res[0]];
      for (let k = 0; k < res.length - 1; k++) {
        const a = res[k], b = res[k + 1];
        nv.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
      }
      nv.push(res[res.length - 1]); res = nv;
    }
    return res;
  }
  function aTramos(celdas, x0, y0, x1, y1) {
    const tramos = []; let actual = [{ x: x0, y: y0 }];
    for (let k = 0; k < celdas.length; k++) {
      const c = centro(celdas[k]);
      if (k > 0) {
        const a = celdas[k - 1], b = celdas[k];
        if (Math.abs(a % GW - b % GW) > 1 || Math.abs(Math.floor(a / GW) - Math.floor(b / GW)) > 1) { tramos.push(actual); actual = []; } // cruzó un portal
      }
      actual.push(c);
    }
    actual.push({ x: x1, y: y1 });
    tramos.push(actual);
    return tramos.filter((t) => t.length > 1).map(suavizar);
  }

  // ---------- Calcular ----------
  function posJulieth() {
    const s = J.Mundo.salaActiva, Ju = J.Jul;
    return s ? { x: s.castillo.x, y: s.castillo.y + 60 } : { x: Ju.x, y: Ju.y };
  }

  R.calcular = function () {
    if (!R.destino) return;
    prepararRejilla();
    const p = posJulieth(), ini = cercanaPasable(p.x, p.y), fin = cercanaPasable(R.destino.x, R.destino.y);
    R.tCalc = 0; R.desde = p;
    if (ini < 0 || fin < 0) { R.optima = []; return; }
    const op = aEstrella(ini, fin, null);
    if (!op) { R.optima = []; return; }
    R.optima = aTramos(op.celdas, p.x, p.y, R.destino.x, R.destino.y);
  };

  R.fijar = function (x, y) {
    R.destino = { x: U.limitar(x, 90, C.MUNDO_W - 90), y: U.limitar(y, 110, C.MUNDO_H - 80) };
    R.calcular();
  };
  R.quitar = function () { R.destino = null; R.optima = []; };

  // ---------- Actualizar mientras se juega ----------
  R.actualizar = function (dt) {
    R.t += dt;
    if (!R.destino) return;
    const Ju = J.Jul, M = J.Mundo;
    if (!M.salaActiva && U.dist(Ju.x, Ju.y, R.destino.x, R.destino.y) < RADIO_LLEGADA) {
      R.quitar();
      if (J.HUD && J.HUD.aviso) J.HUD.aviso('¡Llegaste a tu destino! 🎉', 2.5);
      if (J.Audio && J.Audio.estrella) J.Audio.estrella();
      return;
    }
    R.tCalc += dt;
    const p = posJulieth();
    const d = recortar(p);
    // se desvió (o cruzó un portal): rehacer la ruta desde donde está
    if ((d > 110 && R.tCalc > 0.6) || R.tCalc > RECALCULAR_SEG * 3) R.calcular();
  };
  // Borra el trazo ya recorrido: proyecta a Julieth sobre el primer tramo y corta todo lo anterior.
  // Devuelve a qué distancia quedó de la ruta.
  function recortar(p) {
    const tr = R.optima;
    if (!tr.length) return Infinity;
    // si ya pasó al tramo siguiente (cruzó un portal), se descarta el anterior
    if (tr.length > 1) { const s1 = tr[1][0]; if (U.dist(p.x, p.y, s1.x, s1.y) < 160) tr.shift(); }
    const t0 = tr[0];
    if (t0.length < 2) return U.dist(p.x, p.y, t0[0].x, t0[0].y);
    let mejor = -1, md = Infinity, mx = 0, my = 0, recorrido = 0;
    for (let k = 0; k < t0.length - 1; k++) {
      const a = t0[k], b = t0[k + 1], vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy || 1;
      const u = U.limitar(((p.x - a.x) * vx + (p.y - a.y) * vy) / L2, 0, 1);
      const qx = a.x + vx * u, qy = a.y + vy * u, dd = Math.hypot(p.x - qx, p.y - qy);
      if (dd <= md + 0.5) { md = Math.min(md, dd); mejor = k; mx = qx; my = qy; } // ante empate, el segmento más adelantado
      recorrido += Math.sqrt(L2);
      if (recorrido > 900) break; // sólo se mira el trecho cercano
    }
    if (mejor >= 0 && md < 110) {
      // la ruta arranca justo bajo los pies de Julieth y sigue desde el punto proyectado
      t0.splice(0, mejor + 1);
      const sig = t0[0];
      if (!sig || Math.hypot(sig.x - mx, sig.y - my) > 1) t0.unshift({ x: mx, y: my });
      if (Math.hypot(t0[0].x - p.x, t0[0].y - p.y) > 1) t0.unshift({ x: p.x, y: p.y });
      if (t0.length < 2) t0.push({ x: t0[0].x, y: t0[0].y });
    }
    return md;
  }

  // ---------- Dibujo ----------
  function linea(ctx, tramos, tx, ty, s) {
    ctx.beginPath();
    for (const t of tramos) {
      ctx.moveTo(tx(t[0].x), ty(t[0].y));
      for (let k = 1; k < t.length; k++) ctx.lineTo(tx(t[k].x), ty(t[k].y));
    }
  }
  function trazarRutas(ctx, tx, ty, s, t) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (R.optima.length) {
      linea(ctx, R.optima, tx, ty);
      ctx.strokeStyle = 'rgba(20, 90, 45, 0.35)'; ctx.lineWidth = 26 * s; ctx.stroke();
      ctx.strokeStyle = 'rgba(70, 215, 100, 0.88)'; ctx.lineWidth = 18 * s; ctx.stroke();
      ctx.setLineDash([4 * s, 26 * s]); ctx.lineDashOffset = -t * 60 * s;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; ctx.lineWidth = 6 * s; ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }
  // banderita del destino
  function bandera(ctx, x, y, s, t) {
    const k = (t * 0.9) % 1;
    ctx.save();
    ctx.strokeStyle = `rgba(70, 215, 100, ${1 - k})`; ctx.lineWidth = 5 * s;
    ctx.beginPath(); ctx.ellipse(x, y, (30 + k * 50) * s, (14 + k * 24) * s, 0, 0, U.TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(20, 60, 40, 0.3)'; ctx.beginPath(); ctx.ellipse(x, y, 14 * s, 6 * s, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = '#6b2460'; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 80 * s); ctx.stroke();
    const o = Math.sin(t * 5) * 5 * s;
    ctx.fillStyle = '#46d764'; ctx.beginPath(); ctx.moveTo(x, y - 80 * s); ctx.quadraticCurveTo(x + 24 * s, y - 84 * s + o, x + 46 * s, y - 70 * s + o);
    ctx.quadraticCurveTo(x + 24 * s, y - 58 * s - o, x, y - 54 * s); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3 * s; ctx.stroke();
    J.Dibujo.circ(ctx, x, y - 82 * s, 6 * s, '#ffd23f', '#6b2460', 2.5 * s);
    ctx.restore();
  }

  // En el mundo (coordenadas del mundo, debajo de los objetos)
  R.dibujarSuelo = function (ctx, v, t) {
    if (!R.destino || J.Mundo.salaActiva) return;
    const id = (a) => a;
    trazarRutas(ctx, id, id, 1, t);
    bandera(ctx, R.destino.x, R.destino.y, 1, t);
  };
  // En el mapa grande (e = píxeles por unidad del mundo)
  R.dibujarMapa = function (ctx, e, t, tam) {
    if (R.pendiente) bandera(ctx, R.pendiente.x * e, R.pendiente.y * e, Math.max(0.3, tam / 40), t);
    if (!R.destino) return;
    const s = Math.max(0.12, tam / 70);
    trazarRutas(ctx, (x) => x * e, (y) => y * e, Math.max(s, 0.18), t);
    bandera(ctx, R.destino.x * e, R.destino.y * e, Math.max(0.3, tam / 40), t);
  };
  // En el minimapa (centrado en p, e = píxeles por unidad del mundo)
  R.dibujarMini = function (ctx, cx, cy, p, e, t) {
    if (!R.destino) return;
    trazarRutas(ctx, (x) => cx + (x - p.x) * e, (y) => cy + (y - p.y) * e, 0.2, t);
    const dx = (R.destino.x - p.x) * e, dy = (R.destino.y - p.y) * e;
    J.Dibujo.circ(ctx, cx + dx, cy + dy, 4, '#46d764', '#fff', 1.5);
  };

  J.Ruta = R;
})();
