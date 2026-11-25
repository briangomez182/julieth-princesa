/* Bote-cisne de la princesa: un barquito rosa con cuello de cisne y coronita
   que solo navega por el agua del río. Muelles en las orillas, inercia,
   deriva con la corriente, estelas, ondas y balanceo.

   Detección de agua (lo que se asumió de mundo.js):
   - El río es una polilínea suavizada en J.Mundo.rio ([{x,y}, ...]) con ancho
     J.Mundo.RIO_ANCHO (agua = distancia a la polilínea < ancho/2, igual que
     J.Mundo.enRio). La corriente va en el orden de los puntos de la polilínea.
   - Si existe J.Mundo.rios (varios ríos) también se usa: cada elemento puede
     ser una polilínea [{x,y}] o un objeto { puntos|pts|linea|camino: [...], ancho }.
   - Lagos: J.Mundo.lagos = [{x, y, rx, ry}] (elipses), igual que J.Mundo.enLago.
     En los lagos no hay corriente, solo un remolino muy suave.
   - Muelles: si J.Mundo.muelles trae datos ({x, y: agua junto a la punta,
     tx, ty: tierra, puente}) se usan esos (mundo.js ya los dibuja como puentes
     caminables). Si no hay, este archivo genera y dibuja muelles propios a lo
     largo del río.
   - Todo se lee en J.Bote.iniciar(mundo), que va DESPUÉS de J.Mundo.generar().
     No hay coordenadas fijas.
   - Tierra firme = no es agua + J.Mundo.bloqueado(x, y, 0, r) falso
     + J.Mundo.altura(x, y) == 0 (si existen). */
(function () {
  const U = J.U;

  // ---------- Constantes ajustables del bote ----------
  const BOTE = {
    ESC: 1.15,                 // tamaño del dibujo
    ACEL: 300,                 // empuje de los remos (px/s²)
    FACTOR_CORRER: 1.4,        // empuje extra manteniendo Correr
    ARRASTRE: 1.3,             // freno del agua (más = menos inercia)
    VEL_MAX: 240,              // velocidad máxima respecto del agua
    CORRIENTE: 34,             // deriva del río en el centro (px/s)
    CORRIENTE_LAGO: 9,         // remolino suave en los lagos
    MARGEN_ORILLA: 30,         // distancia mínima del centro del bote a la orilla
    REBOTE: 0.35,              // rebote suave contra la orilla
    FRENO_ESTACIONADO: 3,      // sin nadie a bordo el bote se queda casi quieto
    RADIO_SUBIR_BOTE: 90,      // distancia a la que se puede subir al bote
    RADIO_SUBIR_MUELLE: 62,    // distancia al inicio del muelle para subir
    AUTO_SUBIR: true,          // subir solo al caminar hacia el bote o hacia el agua desde un muelle
    RADIO_AUTO_BOTE: 80,
    RADIO_AUTO_MUELLE: 46,
    ENFRIAR: 1.1,              // segundos tras bajar antes de poder subir otra vez
    EMPUJE_BAJAR_SEG: 0.32,    // empujar contra la orilla este tiempo = desembarcar
    ORILLA_BAJAR: 12,          // qué tan pegado a la orilla debe estar para bajar
    ORILLA_SALTO: 46,          // con Saltar se baja si está a menos de esto de la orilla
    DIST_MUELLES: 950,         // cada cuánto hay un muelle a lo largo del río
    INICIO_MUELLES: 260,       // dónde empieza a contar desde el nacimiento del río
    SEP_MIN_MUELLES: 520,      // separación mínima entre muelles
    LEJOS_PUENTE: 240,         // los muelles no se ponen junto a los puentes
    ANCHO_MUELLE: 44,
    PUNTA_MUELLE: 20,          // hasta dónde entra el muelle (desde la orilla hacia adentro)
    AMARRE_LADO: 54,           // el bote amarra al costado del muelle
    ESTELA_CADA: 0.06,
    ONDA_CADA: 1.1,
    MAX_ONDAS: 110,
    GRAVEDAD_SALTO: 1500,
    IMPULSO_SALTO: 300,
    BORDE_ESTE: 260            // distancia mínima al borde este del mundo (donde el río sale del mapa)
  };

  const B = {
    BOTE,
    rios: [], lagos: [], muelles: [], ondas: [],
    x: 0, y: 0, vx: 0, vy: 0, dir: 1, t: 0, alto: 0, valto: 0, inclina: 0, aleteo: 0,
    listo: false, _montado: false, enfriar: 0, rearmar: true, empuje: 0, avisado: false,
    tEstela: 0, tOnda: 0, tRemo: 0, julieth: null,
    objeto: { tipo: 'bote', parte: 'bote', x: 0, y: 0, orden: 0 }
  };

  // ---------- Ayudas seguras ----------
  const son = (n) => { const S = J.Audio; if (S && typeof S[n] === 'function') { try { S[n](); } catch (_) {} } };
  const part = (n, ...a) => { const P = J.Part; if (P && typeof P[n] === 'function') { try { P[n](...a); } catch (_) {} } };
  const aviso = (txt, s) => { const H = J.HUD; if (H && typeof H.aviso === 'function') { try { H.aviso(txt, s); } catch (_) {} } };
  const mundo = () => B.mundo || J.Mundo || {};
  const TINTA = () => (J.Dibujo && J.Dibujo.TINTA) || '#5b2a4e';

  // ---------- Ríos y consultas de agua ----------
  function normalizarRio(r, anchoDef) {
    let pts = null, ancho = anchoDef;
    if (Array.isArray(r)) pts = r;
    else if (r && typeof r === 'object') { pts = r.puntos || r.pts || r.linea || r.camino || null; if (r.ancho) ancho = r.ancho; }
    if (!pts || pts.length < 2) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
    return { pts, ancho, x0, y0, x1, y1 };
  }
  function leerRios(M) {
    const def = M.RIO_ANCHO || 120, lista = [], vistos = new Set();
    const agregar = (r) => { const k = Array.isArray(r) ? r : (r && (r.puntos || r.pts || r.linea || r.camino)) || r; if (!r || vistos.has(k)) return; vistos.add(k); const n = normalizarRio(r, def); if (n) lista.push(n); };
    if (Array.isArray(M.rios)) M.rios.forEach(agregar);
    if (Array.isArray(M.rio)) agregar(M.rio);
    return lista;
  }

  function leerLagos(M) {
    return (Array.isArray(M.lagos) ? M.lagos : []).filter((l) => l && l.rx > 0 && l.ry > 0).map((l) => ({ x: l.x, y: l.y, rx: l.rx, ry: l.ry }));
  }

  // Consulta de agua unificada (río o lago): el agua "más adentro" gana.
  // ref = punto de referencia (cauce del río o centro del lago); u = dirección
  // de ref hacia el punto; alcance = distancia de ref a la orilla a lo largo de u;
  // borde = alcance - d (>0 dentro del agua); (tx, ty) = dirección de la corriente.
  // Objeto reutilizable: copiar lo que se necesite antes de volver a consultar.
  const Q = { tipo: 'rio', refx: 0, refy: 0, ux: 0, uy: 1, d: 0, alcance: 60, borde: 0, tx: 1, ty: 0, ancho: 120, rio: null, lago: null };
  function cerca(x, y, expansion) {
    let mejor = -Infinity, hallado = false;
    for (const r of B.rios) {
      const e = expansion === undefined ? r.ancho : expansion;
      if (x < r.x0 - e || x > r.x1 + e || y < r.y0 - e || y > r.y1 + e) continue;
      const p = r.pts;
      for (let i = 0; i < p.length - 1; i++) {
        const ax = p[i].x, ay = p[i].y, dx = p[i + 1].x - ax, dy = p[i + 1].y - ay;
        const l2 = dx * dx + dy * dy || 1;
        let s = ((x - ax) * dx + (y - ay) * dy) / l2; s = s < 0 ? 0 : s > 1 ? 1 : s;
        const qx = ax + dx * s, qy = ay + dy * s;
        const dd = Math.sqrt((x - qx) * (x - qx) + (y - qy) * (y - qy));
        const borde = r.ancho / 2 - dd;
        if (borde > mejor) {
          mejor = borde; hallado = true;
          const l = Math.sqrt(l2);
          Q.tipo = 'rio'; Q.refx = qx; Q.refy = qy; Q.d = dd; Q.alcance = r.ancho / 2; Q.borde = borde;
          Q.tx = dx / l; Q.ty = dy / l; Q.ancho = r.ancho; Q.rio = r; Q.lago = null;
        }
      }
    }
    for (const l of B.lagos) {
      const e = expansion === undefined ? 200 : expansion, dx = x - l.x, dy = y - l.y;
      if (Math.abs(dx) > l.rx + e || Math.abs(dy) > l.ry + e) continue;
      const dd = Math.hypot(dx, dy), ux = dd > 0.001 ? dx / dd : 1, uy = dd > 0.001 ? dy / dd : 0;
      const alcance = 1 / Math.hypot(ux / l.rx, uy / l.ry), borde = alcance - dd;
      if (borde > mejor) {
        mejor = borde; hallado = true;
        Q.tipo = 'lago'; Q.refx = l.x; Q.refy = l.y; Q.d = dd; Q.alcance = alcance; Q.borde = borde;
        Q.tx = -uy; Q.ty = ux; Q.ancho = Math.min(l.rx, l.ry) * 2; Q.rio = null; Q.lago = l;
        Q.ux = ux; Q.uy = uy;
      }
    }
    if (!hallado) return null;
    if (Q.tipo === 'rio') {
      let ux = x - Q.refx, uy = y - Q.refy; const ln = Math.hypot(ux, uy);
      if (ln > 0.001) { ux /= ln; uy /= ln; } else { ux = -Q.ty; uy = Q.tx; }
      Q.ux = ux; Q.uy = uy;
    }
    return Q;
  }

  // ¿Es agua? margen > 0 exige estar al menos tan lejos de la orilla.
  B.esAgua = function (x, y, margen) {
    if (!B.rios.length && !B.lagos.length) { const M = mundo(); const f = M.enAgua || M.enRio; return typeof f === 'function' ? !!f(x, y, -(margen || 0)) : false; }
    const q = cerca(x, y, Math.max(0, -(margen || 0)) + 1);
    return !!q && q.borde > (margen || 0);
  };
  // Distancia a la orilla (positiva dentro del agua) y dirección de la corriente
  B.consultaAgua = function (x, y) {
    const q = cerca(x, y, 2000);
    return q ? { tipo: q.tipo, borde: q.borde, tx: q.tx, ty: q.ty, nx: q.ux, ny: q.uy, ancho: q.ancho } : null;
  };

  function tierraValida(x, y) {
    const M = mundo(), C = J.CFG;
    if (B.esAgua(x, y, -10)) return false;
    if (x < 80 || y < 100 || x > C.MUNDO_W - 80 || y > C.MUNDO_H - 70) return false;
    if (typeof M.bloqueado === 'function' && M.bloqueado(x, y, 0, 16)) return false;
    if (typeof M.altura === 'function' && M.altura(x, y) > 0) return false;
    return true;
  }
  // Se puede pisar (incluye pasarelas de muelles y puentes sobre el agua)
  function caminable(x, y) {
    const M = mundo(), C = J.CFG;
    if (x < 80 || y < 100 || x > C.MUNDO_W - 80 || y > C.MUNDO_H - 70) return false;
    if (typeof M.bloqueado === 'function') return !M.bloqueado(x, y, 0, 16);
    return tierraValida(x, y);
  }

  // ---------- Muelles ----------
  // Forma común: x,y = inicio en tierra; nx,ny = hacia tierra; ux,uy = a lo largo de la orilla;
  // ax,ay = donde amarra el bote (agua); px,py = punta donde Julieth sube o baja;
  // propio = lo dibuja este archivo (si no, ya lo dibuja mundo.js como puente).
  function crearMuelle(o) {
    const m = Object.assign({ fase: (o.x * 0.011 + o.y * 0.007) % U.TAU }, o);
    m.ux = -m.ny; m.uy = m.nx; m.angAgua = Math.atan2(-m.ny, -m.nx);
    const lado = (m.anchoPasarela || BOTE.ANCHO_MUELLE) / 2 + 12;
    const px = m.x + m.ux * lado + m.nx * 6, py = m.y + m.uy * lado + m.ny * 6;
    m.poste = { tipo: 'bote', parte: 'poste', muelle: m, x: px, y: py, orden: py };
    B.muelles.push(m);
    return m;
  }

  // Amarre navegable cerca de (x, y): retrocede hacia el agua (-n) si hace falta
  function amarreNavegable(x, y, nx, ny) {
    for (let k = 0; k <= 160; k += 8) {
      const ax = x - nx * k, ay = y - ny * k;
      if (B.esAgua(ax, ay, BOTE.MARGEN_ORILLA + 2)) return { x: ax, y: ay };
    }
    return null;
  }

  function muellesDelMundo(M) {
    for (const mm of M.muelles || []) {
      if (!mm || mm.tx === undefined) continue;
      let nx = mm.tx - mm.x, ny = mm.ty - mm.y; const L = Math.hypot(nx, ny);
      if (L < 1) continue;
      nx /= L; ny /= L;
      const a = amarreNavegable(mm.x, mm.y, nx, ny);
      if (!a) continue;
      // punta de la pasarela: el último punto caminable yendo desde tierra hacia el agua
      let px = mm.tx, py = mm.ty;
      for (let k = 0; k <= L; k += 6) { const x = mm.tx - nx * k, y = mm.ty - ny * k; if (!caminable(x, y)) break; px = x; py = y; }
      px += nx * 10; py += ny * 10;
      const pu = mm.puente, ancho = pu ? Math.min(pu.w, pu.h) : 96;
      crearMuelle({ x: mm.tx, y: mm.ty, nx, ny, ax: a.x, ay: a.y, px, py, propio: false, anchoPasarela: ancho, nombre: mm.nombre, largo: L });
    }
  }

  function intentarMuelle(r, p, lado) {
    const M = mundo(), h = r.ancho / 2;
    const nx = p.nx * lado, ny = p.ny * lado;     // normal hacia la orilla elegida
    const ux = -ny, uy = nx;                      // a lo largo de la orilla
    const x = p.x + nx * (h + 38), y = p.y + ny * (h + 38); // inicio en tierra
    if (!tierraValida(x, y)) return false;
    if (!tierraValida(x + ux * 30, y + uy * 30) || !tierraValida(x - ux * 30, y - uy * 30)) return false;
    const ax = p.x + nx * (h - BOTE.MARGEN_ORILLA - 6) + ux * BOTE.AMARRE_LADO;
    const ay = p.y + ny * (h - BOTE.MARGEN_ORILLA - 6) + uy * BOTE.AMARRE_LADO;
    if (!B.esAgua(ax, ay, BOTE.MARGEN_ORILLA - 4)) return false;
    for (const pu of M.puentes || []) if (U.dist(x, y, pu.x, pu.y) < BOTE.LEJOS_PUENTE || U.dist(ax, ay, pu.x, pu.y) < BOTE.LEJOS_PUENTE) return false;
    for (const m of B.muelles) if (U.dist(x, y, m.x, m.y) < BOTE.SEP_MIN_MUELLES) return false;
    let px = p.x + nx * (h + 6), py = p.y + ny * (h + 6);
    if (!caminable(px, py)) { px = x; py = y; }
    crearMuelle({ x, y, nx, ny, ax, ay, px, py, propio: true, largo: 38 + BOTE.PUNTA_MUELLE + 18 });
    return true;
  }
  function generarMuelles() {
    let lado = 1;
    for (const r of B.rios) {
      for (const p of U.puntosCada(r.pts, BOTE.DIST_MUELLES, BOTE.INICIO_MUELLES)) {
        intentarMuelle(r, p, lado) || intentarMuelle(r, p, -lado);
        lado = -lado;
      }
    }
    // red de seguridad: al menos un muelle por río, probando más seguido
    for (const r of B.rios) {
      if (B.muelles.some((m) => cerca(m.ax, m.ay, 200) && Q.rio === r)) continue;
      for (const p of U.puntosCada(r.pts, 90, 40)) if (intentarMuelle(r, p, 1) || intentarMuelle(r, p, -1)) break;
    }
  }

  // ---------- API ----------
  B.iniciar = function (M) {
    B.mundo = M || J.Mundo;
    B.rios = leerRios(B.mundo);
    B.lagos = leerLagos(B.mundo);
    B.ondas.length = 0; B.muelles.length = 0;
    B._montado = false; B.julieth = null; B.vx = B.vy = 0; B.alto = B.valto = 0;
    muellesDelMundo(B.mundo);
    if (!B.muelles.length) generarMuelles();
    if (B.muelles.length) {
      // el bote empieza en el primer muelle del mundo (o el más cercano al centro, si son propios)
      const C = J.CFG; let m0 = B.muelles[0], dm = Infinity;
      if (m0.propio) for (const m of B.muelles) { const d = U.dist(m.x, m.y, C.MUNDO_W / 2, C.MUNDO_H / 2); if (d < dm) { dm = d; m0 = m; } }
      B.x = m0.ax; B.y = m0.ay;
    } else if (B.lagos.length) { B.x = B.lagos[0].x; B.y = B.lagos[0].y; }
    else if (B.rios.length) { const p = B.rios[0].pts[Math.floor(B.rios[0].pts.length / 2)]; B.x = p.x; B.y = p.y; }
    B.listo = B.rios.length > 0 || B.lagos.length > 0;
    sincronizarObjeto();
    return B;
  };

  B.montado = () => B._montado;

  // Lo más cercano a lo que Julieth se puede subir: { tipo:'bote'|'muelle', x, y, dist, muelle? } o null
  B.cercano = function (j) {
    const M = mundo();
    if (!B.listo || B._montado || M.salaActiva || !j || (j.z || 0) > 30) return null;
    const db = U.dist(j.x, j.y, B.x, B.y);
    if (db < BOTE.RADIO_SUBIR_BOTE) return { tipo: 'bote', x: B.x, y: B.y, dist: db };
    let mejor = null;
    for (const m of B.muelles) {
      const d = Math.min(U.dist(j.x, j.y, m.px, m.py), U.dist(j.x, j.y, m.x, m.y) + 20);
      if (d < BOTE.RADIO_SUBIR_MUELLE && (!mejor || d < mejor.dist)) mejor = { tipo: 'muelle', x: m.px, y: m.py, dist: d, muelle: m };
    }
    return mejor;
  };

  B.subir = function (j, objetivo) {
    j = j || J.Jul;
    const c = objetivo || B.cercano(j);
    if (!c || !j || B._montado) return false;
    if (c.tipo === 'muelle' && U.dist(B.x, B.y, c.muelle.ax, c.muelle.ay) > 140) {
      // el cisne mágico acude al muelle
      part('chispas', B.x, B.y, 20, 14, '#ffffff');
      B.x = c.muelle.ax; B.y = c.muelle.ay;
      part('chispas', B.x, B.y, 30, 18, '#ff9dcb');
    }
    B._montado = true; B.julieth = j; B.vx = B.vy = 0; B.empuje = 0; B.gracia = 0.5;
    if (Math.abs(B.x - j.x) > 4) B.dir = B.x > j.x ? 1 : -1;
    j.x = B.x; j.y = B.y; j.z = 0; j.vx = j.vy = j.vz = 0; j.enSuelo = true; j.dir = B.dir;
    part('gotas', B.x, B.y, 10); son('chapuzon');
    part('texto', B.x, B.y, 120, '¡A navegar!', '#ffe0ec', 24);
    if (!B.avisado) { B.avisado = true; aviso('¡A navegar! Empuja hacia la orilla o pulsa Saltar para bajar', 4); }
    return true;
  };

  function muelleAmarre(x, y, r) {
    let mejor = null, dm = r;
    for (const m of B.muelles) { const d = U.dist(x, y, m.ax, m.ay); if (d < dm) { dm = d; mejor = m; } }
    return mejor;
  }

  // Punto de tierra válido más cercano al bote (prefiere un muelle cercano)
  function puntoDesembarco(pref) {
    const m = pref === undefined ? muelleAmarre(B.x, B.y, 70) : pref;
    if (m) {
      if (caminable(m.px, m.py)) return { x: m.px, y: m.py };
      if (caminable(m.x, m.y)) return { x: m.x, y: m.y };
    }
    const q = cerca(B.x, B.y, 2000);
    if (q) {
      const rx = q.refx, ry = q.refy, ux = q.ux, uy = q.uy, tx = q.tx, ty = q.ty, al = q.alcance;
      for (const s of [1, -1]) for (let extra = 24; extra <= 100; extra += 16) for (const desl of [0, 30, -30, 60, -60, 100, -100]) {
        const x = rx + ux * s * (al + extra) + tx * desl, y = ry + uy * s * (al + extra) + ty * desl;
        if (s < 0 && U.dist(x, y, B.x, B.y) > 260) continue; // la otra orilla solo si queda cerca (río angosto)
        if (tierraValida(x, y)) return { x, y };
      }
    }
    for (let r = 60; r < 420; r += 20) for (let a = 0; a < 16; a++) {
      const x = B.x + Math.cos(a * U.TAU / 16) * r, y = B.y + Math.sin(a * U.TAU / 16) * r;
      if (tierraValida(x, y)) return { x, y };
    }
    return null;
  }

  // muelle (opcional): forzar a bajar en ese muelle (null = en la orilla más cercana)
  B.bajar = function (j, muelle) {
    j = j || B.julieth || J.Jul;
    if (!B._montado || !j) return false;
    let p = puntoDesembarco(muelle);
    if (!p && B.muelles.length) {
      // sin orilla a mano: el cisne mágico lleva a Julieth al muelle más cercano
      let mm = B.muelles[0];
      for (const m of B.muelles) if (U.dist(B.x, B.y, m.ax, m.ay) < U.dist(B.x, B.y, mm.ax, mm.ay)) mm = m;
      part('chispas', B.x, B.y, 20, 14, '#ffffff');
      B.x = mm.ax; B.y = mm.ay; B.vx = B.vy = 0;
      part('chispas', B.x, B.y, 30, 18, '#ff9dcb');
      p = puntoDesembarco(mm);
    }
    if (!p) { part('texto', B.x, B.y, 110, '¡Aquí no se puede bajar!', '#ffffff', 20); return false; }
    B._montado = false; B.enfriar = BOTE.ENFRIAR; B.rearmar = false; B.empuje = 0;
    B.vx *= 0.3; B.vy *= 0.3;
    const a = Math.atan2(p.y - B.y, p.x - B.x);
    j.x = p.x; j.y = p.y; j.z = 0; j.vx = Math.cos(a) * 60; j.vy = Math.sin(a) * 50; j.vz = 320;
    j.enSuelo = false; if (j.cortoSalto !== undefined) j.cortoSalto = false;
    if (Math.abs(Math.cos(a)) > 0.2) j.dir = Math.cos(a) > 0 ? 1 : -1;
    part('gotas', B.x, B.y, 8); son('salto');
    B.julieth = null;
    return true;
  };

  // ---------- Física ----------
  function moverBote(dt) {
    let nx = B.x + B.vx * dt, ny = B.y + B.vy * dt;
    const q = cerca(nx, ny, 600);
    if (!q) { B.vx = B.vy = 0; return; }
    const lim = Math.max(4, q.alcance - BOTE.MARGEN_ORILLA);
    if (q.d > lim) {
      const ux = q.ux, uy = q.uy;
      nx = q.refx + ux * lim; ny = q.refy + uy * lim;
      const vn = B.vx * ux + B.vy * uy;
      if (vn > 0) {
        B.vx -= ux * vn * (1 + BOTE.REBOTE); B.vy -= uy * vn * (1 + BOTE.REBOTE);
        if (vn > 90) { part('gotas', nx + ux * 30, ny + uy * 30, 4); son('chapuzon'); }
      }
    }
    const C = J.CFG;
    // el río sale del mapa por el este: el bote se detiene antes del borde para que siempre haya orilla donde bajar
    if (nx < 70) { nx = 70; B.vx = Math.max(0, B.vx); } else if (nx > C.MUNDO_W - BOTE.BORDE_ESTE) { nx = C.MUNDO_W - BOTE.BORDE_ESTE; B.vx = Math.min(0, B.vx); }
    if (ny < 90) { ny = 90; B.vy = Math.max(0, B.vy); } else if (ny > C.MUNDO_H - 60) { ny = C.MUNDO_H - 60; B.vy = Math.min(0, B.vy); }
    B.x = nx; B.y = ny;
  }

  // Portales en las puntas del río: el bote entra por uno y reaparece en el otro extremo
  function portalRio(dt, j) {
    B.enfriarPortal = Math.max(0, (B.enfriarPortal || 0) - dt);
    const lista = mundo().portalesRio;
    if (!B._montado || B.enfriarPortal > 0 || !lista || !lista.length) return;
    for (const p of lista) {
      if (U.dist(B.x, B.y, p.x, p.y) > 75) continue;
      const d = p.par, sp = Math.max(120, Math.hypot(B.vx, B.vy));
      part('chispas', p.x, p.y, 40, 20, p.color); son('tunel');
      B.x = d.x + d.adentro.x * 150; B.y = d.y + d.adentro.y * 150;
      B.vx = d.adentro.x * sp; B.vy = d.adentro.y * sp;
      B.enfriarPortal = 2.5;
      part('chispas', B.x, B.y, 40, 22, '#ffffff');
      if (j) { j.x = B.x; j.y = B.y + 0.5; }
      if (J.Camara) J.Camara.saltarA(B.x, B.y);
      onda({ tipo: 'anillo', x: B.x, y: B.y, r: 34, vr: 80, vida: 0.9 });
      break;
    }
  }

  function onda(o) {
    if (B.ondas.length >= BOTE.MAX_ONDAS) B.ondas.shift();
    o.vida = o.max = o.vida || 1; o.vx = o.vx || 0; o.vy = o.vy || 0;
    B.ondas.push(o);
  }

  B.actualizar = function (dt, j, E) {
    if (!B.listo) return;
    B.t += dt;
    const M = mundo();
    j = j || J.Jul;

    // ondas y estelas
    for (let i = B.ondas.length - 1; i >= 0; i--) {
      const o = B.ondas[i];
      o.vida -= dt; o.r += o.vr * dt; o.x += o.vx * dt; o.y += o.vy * dt;
      if (o.vida <= 0) { B.ondas[i] = B.ondas[B.ondas.length - 1]; B.ondas.pop(); }
    }

    // salto del bote (con Saltar en aguas abiertas)
    if (B.alto > 0 || B.valto > 0) {
      B.valto -= BOTE.GRAVEDAD_SALTO * dt; B.alto += B.valto * dt;
      if (B.alto <= 0) { B.alto = 0; B.valto = 0; part('gotas', B.x, B.y, 8); son('chapuzon'); onda({ tipo: 'anillo', x: B.x, y: B.y, r: 34, vr: 60, vida: 0.9 }); }
    }

    let ix = 0, iy = 0, correr = false;
    if (B._montado && E) { ix = E.x || 0; iy = E.y || 0; correr = !!E.correr; }

    // corriente del río en la posición del bote
    let cx = 0, cy = 0, borde = 999, onx = 0, ony = 0;
    const q = cerca(B.x, B.y, 600);
    if (q) {
      borde = q.borde - BOTE.MARGEN_ORILLA; onx = q.ux; ony = q.uy;
      const centro = U.limitar(q.borde / (q.ancho / 2), 0, 1);
      const f = q.tipo === 'lago' ? BOTE.CORRIENTE_LAGO * centro : BOTE.CORRIENTE * (0.35 + 0.65 * centro);
      cx = q.tx * f; cy = q.ty * f;
    }

    if (B._montado) {
      const acel = BOTE.ACEL * (correr ? BOTE.FACTOR_CORRER : 1);
      B.vx += ix * acel * dt; B.vy += iy * acel * 0.85 * dt;
      const k = 1 - Math.exp(-BOTE.ARRASTRE * dt);
      B.vx += (cx - B.vx) * k; B.vy += (cy - B.vy) * k;
      const rx = B.vx - cx, ry = B.vy - cy, sp = Math.hypot(rx, ry), vmax = BOTE.VEL_MAX * (correr ? BOTE.FACTOR_CORRER : 1);
      if (sp > vmax) { B.vx = cx + rx * vmax / sp; B.vy = cy + ry * vmax / sp; }
    } else {
      const k = Math.exp(-BOTE.FRENO_ESTACIONADO * dt); B.vx *= k; B.vy *= k;
    }
    moverBote(dt);
    portalRio(dt, j);

    const vel = Math.hypot(B.vx, B.vy);
    if (Math.abs(B.vx) > 25) B.dir = B.vx > 0 ? 1 : -1;
    const kk = Math.min(1, dt * 4);
    B.inclina += (-U.limitar(Math.abs(B.vx) / BOTE.VEL_MAX, 0, 1) * 0.06 * B.dir - B.inclina) * kk;
    B.aleteo += dt * (2 + vel * 0.03);

    // estelas al moverse, ondas al estar quieto, chapoteo de las patitas al remar
    if (vel > 40) {
      B.tEstela -= dt;
      if (B.tEstela <= 0) {
        B.tEstela = BOTE.ESTELA_CADA * U.limitar(160 / vel, 0.6, 2);
        const ux = B.vx / vel, uy = B.vy / vel, sx = B.x - ux * 34, sy = B.y - uy * 14;
        const lat = 30 + Math.min(40, vel * 0.12);
        onda({ tipo: 'estela', x: sx, y: sy, r: 8, vr: 14, vx: -uy * lat, vy: ux * lat * 0.6, vida: 1.1 });
        onda({ tipo: 'estela', x: sx, y: sy, r: 8, vr: 14, vx: uy * lat, vy: -ux * lat * 0.6, vida: 1.1 });
      }
    }
    B.tOnda -= dt;
    if (B.tOnda <= 0) { B.tOnda = BOTE.ONDA_CADA * (vel > 40 ? 0.6 : 1); onda({ tipo: 'anillo', x: B.x, y: B.y + 2, r: 40, vr: 26, vida: 1.6 }); }
    if (B._montado && (ix || iy)) {
      B.tRemo -= dt;
      if (B.tRemo <= 0) { B.tRemo = correr ? 0.32 : 0.48; son('paso'); onda({ tipo: 'anillo', x: B.x - B.dir * 30, y: B.y + 4, r: 6, vr: 40, vida: 0.6 }); }
    }

    if (B._montado) {
      // Julieth va sentada en el bote
      j.x = B.x; j.y = B.y + 0.5; j.z = 0; j.vx = B.vx; j.vy = B.vy; j.vz = 0; j.enSuelo = true; j.dir = B.dir;
      if (j.invul > 0) j.invul = Math.max(0, j.invul - dt);
      if (j.turbo > 0) j.turbo = Math.max(0, j.turbo - dt);
      if (j.parpadeo !== undefined) j.parpadeo += dt;
      if (j.fase !== undefined) j.fase += dt * 3;
      if (j.velTrenza !== undefined) j.velTrenza += (Math.min(1, vel / 300) - j.velTrenza) * kk;

      // bajar: empujando contra la orilla, en un muelle o con Saltar cerca de tierra
      const salto = E && typeof E.consumirSalto === 'function' && E.consumirSalto();
      const empujaOrilla = (ix * onx + iy * ony) > 0.55 && borde <= BOTE.ORILLA_BAJAR;
      const m = muelleAmarre(B.x, B.y, 85);
      const empujaMuelle = m && (ix * m.nx + iy * m.ny) > 0.4;
      B.gracia = Math.max(0, (B.gracia || 0) - dt); // recién subida: no se baja enseguida
      B.empuje = (empujaOrilla || empujaMuelle) && B.gracia <= 0 ? B.empuje + dt : 0;
      if (B.empuje >= BOTE.EMPUJE_BAJAR_SEG) B.bajar(j, empujaMuelle && !empujaOrilla ? m : null);
      else if (salto && m) B.bajar(j, m);
      else if (salto && borde <= BOTE.ORILLA_SALTO) B.bajar(j, null);
      else if (salto && B.alto <= 0) { B.valto = BOTE.IMPULSO_SALTO; B.alto = 0.01; son('salto'); }
    } else {
      // subir solo: caminando hacia el bote o hacia el agua desde un muelle
      B.enfriar = Math.max(0, B.enfriar - dt);
      if (!B.rearmar) {
        const lejos = U.dist(j.x, j.y, B.x, B.y) > BOTE.RADIO_SUBIR_BOTE + 30 && B.muelles.every((mm) => U.dist(j.x, j.y, mm.x, mm.y) > BOTE.RADIO_SUBIR_MUELLE + 30);
        if (lejos) B.rearmar = true;
      } else if (BOTE.AUTO_SUBIR && B.enfriar <= 0 && E && j.estado === 'normal' && j.enSuelo && !M.salaActiva) {
        const ex = E.x || 0, ey = E.y || 0;
        if (ex || ey) {
          const db = U.dist(j.x, j.y, B.x, B.y) || 1;
          if (db < BOTE.RADIO_AUTO_BOTE && ((B.x - j.x) * ex + (B.y - j.y) * ey) / db > 0.3) B.subir(j, { tipo: 'bote', x: B.x, y: B.y, dist: db });
          else for (const m of B.muelles) {
            if (U.dist(j.x, j.y, m.px, m.py) < BOTE.RADIO_AUTO_MUELLE && (-m.nx * ex - m.ny * ey) > 0.3) { B.subir(j, { tipo: 'muelle', x: m.px, y: m.py, dist: 0, muelle: m }); break; }
          }
        }
      }
    }
    sincronizarObjeto();
  };

  function sincronizarObjeto() { B.objeto.x = B.x; B.objeto.y = B.y; B.objeto.orden = B.y + 1; }

  // ---------- Dibujo ----------
  function vista(cam) {
    if (cam && cam.x0 !== undefined) return cam;
    const cx = cam && cam.x !== undefined ? cam.x : B.x, cy = cam && cam.y !== undefined ? cam.y : B.y;
    return { x0: cx - 1300, y0: cy - 900, x1: cx + 1300, y1: cy + 900 };
  }
  const enVista = (v, x, y, mx, arriba, abajo) => !(x < v.x0 - mx || x > v.x1 + mx || y < v.y0 - arriba || y > v.y1 + abajo);

  function dibujarMuelle(ctx, m) {
    const D = J.Dibujo, A = BOTE.ANCHO_MUELLE, L = m.largo;
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.angAgua);
    ctx.fillStyle = 'rgba(20,40,60,0.25)'; ctx.fillRect(-14 + 4, -A / 2 + 8, L + 16, A);
    ctx.fillStyle = '#8a4f27'; D.redondo(ctx, -16, -A / 2, L + 16, A, 7); ctx.fill();
    for (let x = -12; x < L - 4; x += 13) {
      ctx.fillStyle = '#d99a58'; D.redondo(ctx, x, -A / 2 + 3, 10, A - 6, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x + 2, -A / 2 + 6, 2.5, A - 12);
    }
    // pilotes con espuma
    const esp = 0.5 + Math.sin(B.t * 2.4 + m.fase) * 0.2;
    for (const s of [-1, 1]) {
      ctx.strokeStyle = `rgba(255,255,255,${esp})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(L - 6, s * (A / 2 + 1), 10 + Math.sin(B.t * 3 + s) * 1.5, 6, 0, 0, U.TAU); ctx.stroke();
      D.circ(ctx, L - 6, s * (A / 2 + 1), 6.5, '#6b3a1c', TINTA(), 2);
      D.circ(ctx, L - 7.5, s * (A / 2 + 1) - 1.5, 2.2, '#a8683a');
    }
    ctx.restore();
  }

  function dibujarPoste(ctx, m) {
    const D = J.Dibujo, o = m.poste, t = B.t;
    D.sombra(ctx, o.x, o.y, 12, 0.22);
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = '#8a4f27'; D.redondo(ctx, -3.5, -62, 7, 64, 3); ctx.fill();
    ctx.strokeStyle = TINTA(); ctx.lineWidth = 2; ctx.stroke();
    // banderín rosa que ondea
    const ola = Math.sin(t * 4 + m.fase) * 4;
    ctx.fillStyle = '#ff5d8f'; ctx.beginPath(); ctx.moveTo(3, -60); ctx.quadraticCurveTo(16, -58 + ola, 30, -52 + ola * 0.6);
    ctx.quadraticCurveTo(16, -48 - ola * 0.3, 3, -44); ctx.closePath(); ctx.fill(); ctx.stroke();
    D.corazon(ctx, 13, -52 + ola * 0.4, 3.2); ctx.fillStyle = '#fff6b0'; ctx.fill();
    // estrella dorada en la punta y un salvavidas
    ctx.fillStyle = '#ffd23f'; D.estrella(ctx, 0, -66, 7); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, -26, 8, 0, U.TAU); ctx.stroke();
    ctx.strokeStyle = '#ff5d8f'; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(0, -26, 8, 0, U.TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }

  function dibujarOndas(ctx, v) {
    for (const o of B.ondas) {
      if (!enVista(v, o.x, o.y, o.r + 20, o.r + 20, o.r + 20)) continue;
      const k = o.vida / o.max;
      ctx.strokeStyle = `rgba(255,255,255,${(o.tipo === 'estela' ? 0.65 : 0.45) * k})`;
      ctx.lineWidth = o.tipo === 'estela' ? 3 : 2.2;
      ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r, o.r * 0.42, 0, 0, U.TAU); ctx.stroke();
    }
  }

  // Capa del suelo: muelles, ondas y estelas (dibujar después de D.suelo y antes de los objetos)
  B.dibujarSuelo = function (ctx, cam) {
    if (!B.listo || mundo().salaActiva) return;
    const v = vista(cam);
    for (const m of B.muelles) if (m.propio && enVista(v, m.x, m.y, 120, 120, 120)) dibujarMuelle(ctx, m);
    dibujarOndas(ctx, v);
  };

  // Julieth sentada en el bote (en coordenadas locales del bote, mirando a la derecha)
  B.dibujarConJulieth = function (ctx, j) {
    const Ju = J.Jul;
    if (!Ju || typeof Ju.figura !== 'function') return;
    const vel = Math.hypot(B.vx, B.vy);
    ctx.save();
    ctx.translate(-6, 9);
    ctx.scale(1.25 / BOTE.ESC, 1.25 / BOTE.ESC);
    if (j && j.invul > 0 && Math.floor(B.t * 12) % 2 === 0) ctx.globalAlpha = 0.35;
    Ju.figura(ctx, { t: B.t, fase: (j && j.fase) || 0, pose: vel > 210 || B.alto > 0 ? 'celebra' : 'quieta', velTrenza: (j && j.velTrenza) || 0 });
    ctx.restore();
  };

  function dibujarBote(ctx) {
    const D = J.Dibujo, t = B.t, tinta = TINTA();
    const bob = Math.sin(t * 2.2) * 2;
    const roll = Math.sin(t * 1.7) * 0.045 + B.inclina;
    ctx.save(); ctx.translate(B.x, B.y);
    // reflejo oscuro en el agua
    ctx.fillStyle = 'rgba(20,60,110,0.22)'; ctx.beginPath(); ctx.ellipse(0, 4, 56 - B.alto * 0.05, 14, 0, 0, U.TAU); ctx.fill();
    ctx.translate(0, -bob - B.alto); ctx.rotate(roll); ctx.scale(B.dir * BOTE.ESC, BOTE.ESC);

    // cola de plumas (popa)
    ctx.fillStyle = '#fff'; ctx.strokeStyle = tinta; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-38, -15); ctx.quadraticCurveTo(-52, -20, -55, -36 + Math.sin(t * 3) * 1.5);
    ctx.quadraticCurveTo(-44, -30, -32, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
    // interior del casco (detrás de Julieth)
    D.elip(ctx, -2, -17, 37, 6.5, '#c94f86', tinta, 2);

    if (J.Giulia) J.Giulia.dibujarPasajera(ctx, B, t); // la Duquesa Giulia Bebé, en la popa
    if (B._montado) B.dibujarConJulieth(ctx, B.julieth || J.Jul);

    // casco rosa
    const gr = ctx.createLinearGradient(0, -20, 0, 10);
    gr.addColorStop(0, '#ffc2de'); gr.addColorStop(1, '#ff6fae');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(-40, -16);
    ctx.lineTo(34, -18);
    ctx.quadraticCurveTo(47, -12, 38, 0);
    ctx.quadraticCurveTo(0, 13, -36, 0);
    ctx.quadraticCurveTo(-46, -6, -40, -16);
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = tinta; ctx.lineWidth = 2.5; ctx.stroke();
    // ribete dorado
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-37, -14); ctx.lineTo(33, -15.5); ctx.stroke();
    // ala de plumas
    const al = Math.sin(B.aleteo) * 0.06;
    ctx.save(); ctx.translate(-4, -9); ctx.rotate(al);
    [[-12, 1, 16, 7], [0, 0, 14, 6.2], [10, -1, 11, 5]].forEach((p) => D.elip(ctx, p[0], p[1], p[2], p[3], '#ffffff', '#f7a6c9', 2));
    ctx.restore();
    // corazón dorado en la proa
    D.corazon(ctx, 27, -8, 4); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = tinta; ctx.lineWidth = 1.5; ctx.stroke();

    // cuello y cabeza de cisne con coronita
    const cab = Math.sin(t * 2.6) * 1.6;
    ctx.beginPath(); ctx.moveTo(31, -16); ctx.bezierCurveTo(48, -30, 30, -48, 40, -60 + cab);
    ctx.strokeStyle = tinta; ctx.lineWidth = 13; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9; ctx.stroke();
    D.circ(ctx, 42, -62 + cab, 8, '#ffffff', tinta, 2);
    ctx.fillStyle = '#ff9a3d'; ctx.beginPath(); ctx.moveTo(48, -65 + cab); ctx.lineTo(59, -61 + cab); ctx.lineTo(48, -58 + cab); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = tinta; ctx.lineWidth = 1.6; ctx.stroke();
    D.circ(ctx, 44.5, -64 + cab, 1.7, '#2b2030'); D.circ(ctx, 42, -59 + cab, 2.2, 'rgba(255,111,174,0.6)');
    ctx.fillStyle = '#ffd23f'; ctx.beginPath();
    ctx.moveTo(36, -68 + cab); ctx.lineTo(37, -76 + cab); ctx.lineTo(40, -71 + cab); ctx.lineTo(42.5, -78 + cab); ctx.lineTo(45, -71 + cab);
    ctx.lineTo(48, -76 + cab); ctx.lineTo(48.5, -68 + cab); ctx.closePath(); ctx.fill(); ctx.strokeStyle = tinta; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();

    // línea de agua: el fondo del casco queda bajo el agua y la espuma lo rodea
    ctx.save(); ctx.translate(B.x, B.y);
    ctx.fillStyle = 'rgba(62,201,240,0.55)'; ctx.beginPath(); ctx.ellipse(0, 3, 50, 7, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let x = -50; x <= 50; x += 5) { const y = -1 + Math.sin(x * 0.3 + t * 6) * 1.4; x === -50 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.restore();
  }

  // Para el ordenado por profundidad de main.js: agrega a la lista los objetos visibles
  // ({ tipo:'bote', parte:'bote'|'poste', orden }) y luego dibújalos con dibujarObjeto.
  B.agregarVisibles = function (lista, cam) {
    if (!B.listo || mundo().salaActiva) return;
    const v = vista(cam);
    if (enVista(v, B.x, B.y, 120, 40, 160)) lista.push(B.objeto);
    for (const m of B.muelles) if (enVista(v, m.poste.x, m.poste.y, 60, 20, 120)) lista.push(m.poste);
  };
  B.dibujarObjeto = function (ctx, o) {
    if (!o || o.tipo !== 'bote') return;
    if (o.parte === 'poste') dibujarPoste(ctx, o.muelle); else dibujarBote(ctx);
  };

  // Dibujo todo-en-uno (sin ordenar con el resto): suelo + postes + bote, con culling
  B.dibujar = function (ctx, cam) {
    if (!B.listo || mundo().salaActiva) return;
    const v = vista(cam);
    B.dibujarSuelo(ctx, v);
    for (const m of B.muelles) if (enVista(v, m.poste.x, m.poste.y, 60, 20, 120)) dibujarPoste(ctx, m);
    if (enVista(v, B.x, B.y, 120, 40, 160)) dibujarBote(ctx);
  };

  // Luces nocturnas opcionales (farolito de cada muelle y la coronita del cisne)
  B.luces = function (cam) {
    const v = vista(cam), out = [];
    if (!B.listo || mundo().salaActiva) return out;
    for (const m of B.muelles) if (enVista(v, m.poste.x, m.poste.y, 200, 200, 200)) out.push({ x: m.poste.x, y: m.poste.y - 66, r: 110, f: 0.6 });
    if (enVista(v, B.x, B.y, 200, 200, 200)) out.push({ x: B.x + B.dir * 48, y: B.y - 80, r: 90, f: 0.5 });
    return out;
  };

  J.Bote = B;
})();
