/* Arte procedural: todo el mundo se dibuja por código (y se guarda en
   "sprites" para que vaya a 60 FPS). Si en ./mundo/ hay texturas de
   pasto / camino / agua, se usan en lugar de las generadas. */
(function () {
  const U = J.U, K = J.CFG.COLOR;
  const D = { patron: {}, spr: {}, castillo: {} };
  const TINTA = '#5b2a4e';

  // ---------- Ayudas ----------
  function lienzo(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
  function sprite(w, h, ox, oy, fn, S) {
    S = S || 2;
    const c = lienzo(w * S, h * S), g = c.getContext('2d');
    g.scale(S, S); g.translate(ox, oy); g.lineJoin = 'round'; g.lineCap = 'round';
    fn(g);
    return { c, w, h, ox, oy };
  }
  D.pon = function (ctx, s, x, y, esc) {
    esc = esc || 1;
    ctx.drawImage(s.c, x - s.ox * esc, y - s.oy * esc, s.w * esc, s.h * esc);
  };
  function circ(g, x, y, r, relleno, borde, ancho) {
    g.beginPath(); g.arc(x, y, r, 0, U.TAU);
    if (relleno) { g.fillStyle = relleno; g.fill(); }
    if (borde) { g.strokeStyle = borde; g.lineWidth = ancho || 2; g.stroke(); }
  }
  function elip(g, x, y, rx, ry, relleno, borde, ancho) {
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, U.TAU);
    if (relleno) { g.fillStyle = relleno; g.fill(); }
    if (borde) { g.strokeStyle = borde; g.lineWidth = ancho || 2; g.stroke(); }
  }
  function redondo(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function estrella(g, x, y, r, puntas, interior) {
    puntas = puntas || 5; interior = interior || 0.45;
    g.beginPath();
    for (let i = 0; i < puntas * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / puntas, rr = i % 2 ? r * interior : r;
      g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
  }
  function corazon(g, x, y, s) {
    g.beginPath();
    g.moveTo(x, y + s * 0.9);
    g.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.35);
    g.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.5, y - s * 0.1, x, y + s * 0.9);
    g.closePath();
  }
  D.circ = circ; D.elip = elip; D.redondo = redondo; D.estrella = estrella; D.corazon = corazon; D.TINTA = TINTA;

  D.sombra = function (ctx, x, y, rx, alfa) {
    ctx.fillStyle = `rgba(20,40,60,${alfa === undefined ? 0.22 : alfa})`;
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.42, 0, 0, U.TAU); ctx.fill();
  };

  // ---------- Patrones del suelo ----------
  function patronPasto() {
    const c = lienzo(256, 256), g = c.getContext('2d'), r = U.semilla(7);
    g.fillStyle = K.pasto; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = i % 2 ? 'rgba(139,227,106,0.35)' : 'rgba(63,174,74,0.22)';
      const x = r() * 256, y = r() * 256, rad = 18 + r() * 34;
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { g.beginPath(); g.ellipse(x + ox, y + oy, rad, rad * 0.6, 0, 0, U.TAU); g.fill(); }
    }
    g.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const x = 6 + r() * 244, y = 8 + r() * 244;
      g.strokeStyle = i % 3 ? 'rgba(47,150,62,0.55)' : 'rgba(170,240,120,0.7)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 4, y - 6); g.moveTo(x, y); g.lineTo(x, y - 8); g.moveTo(x + 3, y); g.lineTo(x + 5, y - 6); g.stroke();
    }
    return c;
  }
  function patronLadrillo() {
    const c = lienzo(96, 64), g = c.getContext('2d');
    g.fillStyle = K.ladrilloOscuro; g.fillRect(0, 0, 96, 64);
    const fila = (y, corr) => {
      for (let i = -1; i < 3; i++) {
        const x = i * 48 + corr;
        g.fillStyle = (i + (y ? 1 : 0)) % 2 ? K.ladrillo : '#ffdc5e';
        redondo(g, x + 2, y + 2, 44, 28, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.45)'; redondo(g, x + 6, y + 5, 30, 6, 3); g.fill();
      }
    };
    fila(0, 0); fila(32, 24);
    return c;
  }
  function patronMuro() {
    const c = lienzo(64, 44), g = c.getContext('2d');
    g.fillStyle = '#d9713f'; g.fillRect(0, 0, 64, 44);
    const fila = (y, corr) => { for (let i = -1; i < 3; i++) { g.fillStyle = '#f29a5c'; redondo(g, i * 32 + corr + 2, y + 2, 28, 18, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(i * 32 + corr + 5, y + 4, 18, 3); } };
    fila(0, 0); fila(22, 16);
    return c;
  }
  D.refrescarPatrones = function (ctx) {
    const A = J.Assets.img;
    D.patron.pasto = ctx.createPattern(A.pasto || patronPasto(), 'repeat');
    D.patron.camino = ctx.createPattern(A.camino || patronLadrillo(), 'repeat');
    D.patron.agua = A.agua ? ctx.createPattern(A.agua, 'repeat') : null;
    D.patron.muro = ctx.createPattern(patronMuro(), 'repeat');
    if (D.limpiarSuelo) D.limpiarSuelo();
  };

  // ---------- Suelo: pasto, zonas, río, caminos, puentes, patios, flores ----------
  function trazo(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  }
  const ZONA_COLOR = { bosque: ['rgba(34,120,70,0.75)', 'rgba(34,120,70,0)'], cristal: ['rgba(214,244,255,0.95)', 'rgba(214,244,255,0)'], nubes: ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0)'],
    flores: ['rgba(255,214,236,0.6)', 'rgba(255,214,236,0)'], nieve: ['rgba(246,251,255,0.99)', 'rgba(232,244,255,0)'],
    luna: ['rgba(132,122,214,0.72)', 'rgba(132,122,214,0)'], volcan: ['rgba(122,74,64,0.85)', 'rgba(122,74,64,0)'], tormenta: ['rgba(118,134,122,0.7)', 'rgba(118,134,122,0)'],
    mar: ['rgba(252,238,196,0.96)', 'rgba(252,238,196,0)'], desierto: ['rgba(247,214,140,0.98)', 'rgba(247,214,140,0)'],
    huerto: ['rgba(206,236,150,0.75)', 'rgba(206,236,150,0)'] };
  const PATIO = { real: ['#ffe9c7', '#ff9dbb'], bosque: ['#d8c08a', '#7ac96b'], cristal: ['#e6f7ff', '#9a8cff'], nubes: ['#fff5fb', '#ffc6e6'],
    hielo: ['#eef9ff', '#8fd0f5'], luna: ['#dcd8ff', '#6a62c8'], fuego: ['#ffdcbc', '#e8603c'], trueno: ['#e8e3f4', '#8a7fc0'], mar: ['#fff1dc', '#4fcdc4'], arena: ['#fbe6b4', '#d99a4e'], huerto: ['#fff4d2', '#ff8a5c'] };
  // Detalles fijos sobre las manchas de las zonas nuevas (van a la caché de baldosas)
  const ZONA_DETALLE = {
    luna: (ctx, x, y, r, i) => { // cráteres y chispitas
      if (i % 3) { elip(ctx, x, y, r * 1.6, r * 0.8, 'rgba(78,68,160,0.3)'); elip(ctx, x, y - r * 0.15, r * 1.25, r * 0.55, 'rgba(206,200,255,0.35)'); }
      else { ctx.fillStyle = 'rgba(255,246,190,0.85)'; estrella(ctx, x, y, 5 + r * 0.2, 4, 0.35); ctx.fill(); }
    },
    volcan: (ctx, x, y, r, i) => { // rocas oscuras y grietas tibias
      if (i % 2) { elip(ctx, x, y, r * 1.4, r * 0.8, 'rgba(60,36,34,0.45)'); elip(ctx, x - r * 0.3, y - r * 0.25, r * 0.6, r * 0.3, 'rgba(160,110,100,0.4)'); }
      else { ctx.strokeStyle = 'rgba(255,140,60,0.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - r * 1.5, y); ctx.lineTo(x - r * 0.5, y - r * 0.4); ctx.lineTo(x + r * 0.3, y + r * 0.3); ctx.lineTo(x + r * 1.5, y - r * 0.2); ctx.stroke(); }
    },
    tormenta: (ctx, x, y, r, i) => { // matas de pasto gris y charquitos
      if (i % 3) { ctx.strokeStyle = 'rgba(70,92,78,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 7, y - 9); ctx.moveTo(x, y); ctx.lineTo(x, y - 12); ctx.moveTo(x + 5, y); ctx.lineTo(x + 8, y - 9); ctx.stroke(); }
      else elip(ctx, x, y, r * 1.5, r * 0.6, 'rgba(130,150,200,0.4)');
    },
    mar: (ctx, x, y, r, i) => { // conchitas y ondas de arena
      if (i % 3) { ctx.strokeStyle = 'rgba(214,180,120,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y + r, r * 1.6, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
      else { ctx.fillStyle = i % 2 ? '#ffb3c8' : '#ffe2b8'; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.arc(x, y, 7, Math.PI, 0); ctx.closePath(); ctx.fill(); }
    },
    desierto: (ctx, x, y, r) => { // ondas del viento sobre la arena
      ctx.strokeStyle = 'rgba(200,150,80,0.45)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - r * 2, y); ctx.quadraticCurveTo(x - r, y - r * 0.6, x, y); ctx.quadraticCurveTo(x + r, y + r * 0.6, x + r * 2, y); ctx.stroke();
    },
    huerto: (ctx, x, y, r, i) => { // surquitos de tierra con brotes
      if (i % 3) { elip(ctx, x, y, r * 1.6, r * 0.45, 'rgba(150,100,60,0.3)'); ctx.fillStyle = '#4cb84a'; [-0.8, 0, 0.8].forEach((k) => { ctx.beginPath(); ctx.ellipse(x + k * r - 2.5, y - 4, 4, 2, -0.6, 0, U.TAU); ctx.ellipse(x + k * r + 2.5, y - 4, 4, 2, 0.6, 0, U.TAU); ctx.fill(); }); }
      else { circ(ctx, x, y, 4.5, '#fff6c8'); circ(ctx, x, y, 2, '#ffb02e'); }
    }
  };

  // Parte fija del suelo. Se pinta una sola vez por "baldosa" de 800×800 y se
  // guarda en caché; así cada fotograma solo hay que copiar unas pocas imágenes.
  D.sueloFijo = function (ctx, v) {
    const M = J.Mundo;
    const fuera = (x, y, mx, my) => x + mx < v.x0 || x - mx > v.x1 || y + my < v.y0 || y - my > v.y1;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // Más allá del mapa están los salones de los castillos (interiores)
    if (v.x0 >= J.CFG.MUNDO_W + 300) {
      ctx.fillStyle = '#2a1838'; ctx.fillRect(v.x0 - 2, v.y0 - 2, v.w + 4, v.h + 4);
      for (const s of M.salas) if (!(s.x1 + 40 < v.x0 || s.x0 - 40 > v.x1 || s.y1 + 60 < v.y0 || s.y0 - s.alto - 40 > v.y1)) D.salaFija(ctx, s);
      return;
    }
    ctx.fillStyle = D.patron.pasto; ctx.fillRect(v.x0 - 2, v.y0 - 2, v.w + 4, v.h + 4);

    for (const z of M.zonas) {
      if (fuera(z.x, z.y, z.rx, z.ry)) continue;
      ctx.save(); ctx.translate(z.x, z.y); ctx.scale(1, z.ry / z.rx);
      const gr = ctx.createRadialGradient(0, 0, z.rx * 0.45, 0, 0, z.rx);
      const zc = ZONA_COLOR[z.id] || ZONA_COLOR.flores;
      gr.addColorStop(0, zc[0]); gr.addColorStop(1, zc[1]);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, z.rx, 0, U.TAU); ctx.fill(); ctx.restore();
      const det = ZONA_DETALLE[z.id];
      if (det) {
        const r = U.semilla((z.x * 13 + z.y) | 0), n = Math.round((z.rx * z.ry) / 9000);
        for (let i = 0; i < n; i++) {
          const a = r() * U.TAU, d = Math.sqrt(r()) * 0.8, x = z.x + Math.cos(a) * z.rx * d, y = z.y + Math.sin(a) * z.ry * d, rr = 8 + r() * 14;
          if (!fuera(x, y, 40, 30)) det(ctx, x, y, rr, i);
        }
      }
    }

    // Río cristalino (orilla de arena, borde y agua)
    trazo(ctx, M.rio);
    ctx.strokeStyle = '#f6e7a8'; ctx.lineWidth = M.RIO_ANCHO + 22; ctx.stroke();
    ctx.strokeStyle = K.aguaBorde; ctx.lineWidth = M.RIO_ANCHO; ctx.stroke();
    ctx.strokeStyle = D.patron.agua || K.agua; ctx.lineWidth = M.RIO_ANCHO - 18; ctx.stroke();
    ctx.strokeStyle = 'rgba(168,240,255,0.55)'; ctx.lineWidth = M.RIO_ANCHO - 70; ctx.stroke();

    // Lagos (mismas capas que el río: arena, borde, agua y reflejo)
    for (const l of M.lagos) {
      if (fuera(l.x, l.y, l.rx + 40, l.ry + 40)) continue;
      elip(ctx, l.x, l.y, l.rx + 11, l.ry + 11, '#f6e7a8');
      elip(ctx, l.x, l.y, l.rx, l.ry, K.aguaBorde);
      elip(ctx, l.x, l.y, l.rx - 9, l.ry - 9, D.patron.agua || K.agua);
      elip(ctx, l.x - l.rx * 0.08, l.y - l.ry * 0.1, l.rx * 0.72, l.ry * 0.62, 'rgba(168,240,255,0.45)');
      for (let k = 0; k < 9; k++) { // juncos y nenúfares en la orilla
        const a = k * 0.7 + 0.3, x = l.x + Math.cos(a) * (l.rx - 40), y = l.y + Math.sin(a) * (l.ry - 30);
        elip(ctx, x, y, 16, 9, '#4cc45f'); elip(ctx, x + 3, y - 1, 5, 3, '#ff9dc8');
      }
    }

    // Patios de los castillos
    for (const c of M.castillos) {
      if (fuera(c.patio.x, c.patio.y - 60, 230, 220)) continue;
      const col = PATIO[c.id] || PATIO.real;
      elip(ctx, c.patio.x, c.patio.y, 215, 135, col[1]);
      elip(ctx, c.patio.x, c.patio.y, 198, 120, col[0]);
      ctx.strokeStyle = col[1]; ctx.lineWidth = 5; ctx.setLineDash([18, 14]);
      ctx.beginPath(); ctx.ellipse(c.patio.x, c.patio.y, 150, 88, 0, 0, U.TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col[1]; estrella(ctx, c.patio.x, c.patio.y, 34, 8, 0.6); ctx.fill();
      // alfombra hasta la puerta
      ctx.fillStyle = col[1]; ctx.fillRect(c.x - 34, c.y - 4, 68, 70);
      ctx.fillStyle = col[0]; ctx.fillRect(c.x - 24, c.y - 4, 48, 70);
    }

    // Caminos de ladrillos amarillos
    for (const c of M.caminos) { trazo(ctx, c); ctx.strokeStyle = K.ladrilloOscuro; ctx.lineWidth = 98; ctx.stroke(); }
    for (const c of M.caminos) { trazo(ctx, c); ctx.strokeStyle = '#fff3b8'; ctx.lineWidth = 88; ctx.stroke(); }
    for (const c of M.caminos) { trazo(ctx, c); ctx.strokeStyle = D.patron.camino; ctx.lineWidth = 80; ctx.stroke(); }

    // Puentes de madera
    for (const p of M.puentes) {
      const L = p.L || Math.max(p.w, p.h), A = p.A || Math.min(p.w, p.h);
      if (fuera(p.x, p.y, L / 2 + 40, L / 2 + 40)) continue;
      const angP = p.ang !== undefined ? p.ang : p.vertical ? Math.PI / 2 : 0; // alineado con el camino
      // sombra siempre hacia abajo de la pantalla, aunque el puente esté girado
      ctx.save(); ctx.translate(p.x + 4, p.y + 10); ctx.rotate(angP);
      ctx.fillStyle = 'rgba(20,40,60,0.25)'; ctx.fillRect(-L / 2, -A / 2, L, A); ctx.restore();
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(angP);
      ctx.fillStyle = '#b9763f'; redondo(ctx, -L / 2, -A / 2, L, A, 8); ctx.fill();
      for (let x = -L / 2 + 4; x < L / 2 - 6; x += 22) {
        ctx.fillStyle = '#d99a58'; redondo(ctx, x, -A / 2 + 4, 18, A - 8, 4); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 3, -A / 2 + 8, 3, A - 16);
      }
      ctx.fillStyle = '#8a4f27';
      redondo(ctx, -L / 2 - 6, -A / 2 - 5, L + 12, 11, 5); ctx.fill();
      redondo(ctx, -L / 2 - 6, A / 2 - 6, L + 12, 11, 5); ctx.fill();
      ctx.restore();
    }

    // Charcos resbaladizos
    for (const p of M.charcos) {
      if (fuera(p.x, p.y, 60, 40)) continue;
      elip(ctx, p.x, p.y, 48, 25, '#6f9ad6');
      elip(ctx, p.x - 2, p.y - 2, 43, 21, '#9cd0ff');
    }
  };

  // Parte animada del suelo: brillos del agua y flores que se mecen
  D.sueloVivo = function (ctx, v, t) {
    const M = J.Mundo;
    if (v.x0 > J.CFG.MUNDO_W) return; // interiores: sin río ni flores
    if (M.rioCaja.x1 > v.x0 && M.rioCaja.x0 < v.x1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 5;
      trazo(ctx, M.rio); ctx.setLineDash([26, 86]); ctx.lineDashOffset = -t * 46; ctx.stroke();
      ctx.save(); ctx.translate(26, 8); trazo(ctx, M.rio);
      ctx.setLineDash([14, 120]); ctx.lineDashOffset = -t * 60 + 40; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(-28, -6); trazo(ctx, M.rio);
      ctx.setLineDash([18, 104]); ctx.lineDashOffset = -t * 38 + 70; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
      ctx.setLineDash([]);
    }
    for (const l of M.lagos) { // destellos que van y vienen sobre los lagos
      if (l.x + l.rx < v.x0 || l.x - l.rx > v.x1 || l.y + l.ry < v.y0 || l.y - l.ry > v.y1) continue;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4;
      for (let k = 0; k < 14; k++) {
        const a = k * 2.399, r = 0.15 + ((k * 0.37) % 0.7), x = l.x + Math.cos(a) * l.rx * r, y = l.y + Math.sin(a) * l.ry * r;
        const o = Math.sin(t * 1.6 + k) * 10, al = 0.35 + 0.35 * Math.sin(t * 2.2 + k * 1.3);
        ctx.globalAlpha = Math.max(0, al); ctx.beginPath(); ctx.moveTo(x - 16 + o, y); ctx.lineTo(x + 16 + o, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    for (const p of M.charcos) {
      if (Math.abs(p.x - v.cx) > v.w / 2 + 80 || Math.abs(p.y - v.cy) > v.h / 2 + 80) continue;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
      const o = Math.sin(t * 2 + p.fase) * 4;
      ctx.beginPath(); ctx.ellipse(p.x - 12 + o, p.y - 6, 14, 5, -0.2, 3.4, 5.6); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(p.x + 14 - o, p.y + 6, 10, 4, -0.2, 0.2, 2.4); ctx.stroke();
    }
    // las flores están ordenadas por y: búsqueda binaria de la primera visible
    const F = M.flores; let lo = 0, hi = F.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (F[m].y < v.y0 - 20) lo = m + 1; else hi = m; }
    for (let i = lo; i < F.length; i++) {
      const f = F[i];
      if (f.y > v.y1 + 30) break;
      if (f.x < v.x0 - 20 || f.x > v.x1 + 20) continue;
      // floración especial del clima (tras lluvia o nieve) y vaivén con el viento
      const st = J.Clima ? J.Clima.florEstilo(f, t) : null, s = f.t * (st ? st.escala : 1);
      const m = Math.sin(t * 1.7 + f.fase) * 5 * f.t * (st ? st.mecer : 1), tx = f.x + m, ty = f.y - 15 * f.t;
      ctx.strokeStyle = '#2f9a4a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo(f.x, f.y - 8, tx, ty); ctx.stroke();
      ctx.fillStyle = st ? st.color : f.color; ctx.beginPath();
      const giro = st ? st.giro : 0;
      for (let i = 0; i < 5; i++) {
        const a = i * 1.2566 + f.fase + giro, px = tx + Math.cos(a) * 4.6 * s, py = ty + Math.sin(a) * 4.6 * s;
        ctx.moveTo(px + 3.6 * s, py); ctx.arc(px, py, 3.6 * s, 0, U.TAU);
      }
      ctx.fill();
      ctx.fillStyle = st && st.centro ? st.centro : f.color === '#ffd23f' ? '#ff8a3d' : '#ffe066';
      ctx.beginPath(); ctx.arc(tx, ty, 3 * s, 0, U.TAU); ctx.fill();
      if (st) J.Clima.dibFlorExtra(ctx, tx, ty, st, f.t);
    }
  };

  // Caché de baldosas del suelo
  const TB = 800, MAX_BALDOSAS = 16;
  let baldosas = new Map(), escBaldosa = 1, reloj = 0;
  D.limpiarSuelo = function () { baldosas.clear(); };
  D.suelo = function (ctx, v, t, escala) {
    const rs = U.limitar(Math.round(escala * 8) / 8, 0.625, 1.25);
    if (rs !== escBaldosa) { escBaldosa = rs; baldosas.clear(); }
    for (let i = Math.floor(v.x0 / TB); i <= Math.floor(v.x1 / TB); i++) {
      for (let j = Math.floor(v.y0 / TB); j <= Math.floor(v.y1 / TB); j++) {
        const k = i + ',' + j;
        let b = baldosas.get(k);
        if (!b) {
          const c = lienzo(TB * rs + 1, TB * rs + 1), g = c.getContext('2d', { alpha: false });
          g.setTransform(rs, 0, 0, rs, -i * TB * rs, -j * TB * rs);
          D.sueloFijo(g, { x0: i * TB, y0: j * TB, x1: (i + 1) * TB + 2, y1: (j + 1) * TB + 2, w: TB + 2, h: TB + 2 });
          b = { c }; baldosas.set(k, b);
        }
        b.uso = ++reloj;
        ctx.drawImage(b.c, i * TB, j * TB, b.c.width / rs, b.c.height / rs);
      }
    }
    if (baldosas.size > MAX_BALDOSAS) {
      const viejas = [...baldosas.entries()].sort((a, b) => a[1].uso - b[1].uso).slice(0, baldosas.size - MAX_BALDOSAS);
      viejas.forEach((e) => baldosas.delete(e[0]));
    }
    D.sueloVivo(ctx, v, t);
  };

  // ---------- Árboles, arbustos, rocas (sprites) ----------
  function copa(g, pts, base, luz, sombra) {
    g.fillStyle = sombra; pts.forEach((p) => { g.beginPath(); g.arc(p[0], p[1] + 5, p[2], 0, U.TAU); g.fill(); });
    g.fillStyle = base; pts.forEach((p) => { g.beginPath(); g.arc(p[0], p[1], p[2], 0, U.TAU); g.fill(); });
    g.fillStyle = luz; pts.forEach((p) => { g.beginPath(); g.arc(p[0] - p[2] * 0.25, p[1] - p[2] * 0.3, p[2] * 0.55, 0, U.TAU); g.fill(); });
  }
  function tronco(g, color, sombra, alto) {
    g.fillStyle = sombra; redondo(g, -9, -alto, 18, alto + 2, 6); g.fill();
    g.fillStyle = color; redondo(g, -9, -alto, 11, alto + 2, 5); g.fill();
  }
  const ARBOL = {
    redondo: (g) => { tronco(g, '#b3723f', '#8b5230', 52); copa(g, [[-26, -78, 30], [26, -80, 30], [0, -104, 36], [0, -70, 30]], '#3fb357', '#74d86b', '#2a8f4b'); },
    frutal: (g) => {
      ARBOL.redondo(g);
      [[-28, -70], [20, -66], [2, -98], [30, -92], [-12, -116]].forEach((p) => { circ(g, p[0], p[1], 7, '#ff4d5e'); circ(g, p[0] - 2, p[1] - 2, 2.2, '#ffd0d5'); });
    },
    pino: (g) => {
      tronco(g, '#9c6238', '#75452a', 34);
      [[0, -30, 46], [0, -62, 38], [0, -92, 29], [0, -118, 20]].forEach((p, i) => {
        g.fillStyle = '#1f7a4d'; g.beginPath(); g.moveTo(-p[2], p[1]); g.quadraticCurveTo(0, p[1] + 16, p[2], p[1]); g.lineTo(0, p[1] - 46 + i * 2); g.closePath(); g.fill();
        g.fillStyle = '#35a05f'; g.beginPath(); g.moveTo(-p[2], p[1]); g.quadraticCurveTo(-p[2] * 0.4, p[1] + 10, 0, p[1] + 8); g.lineTo(0, p[1] - 46 + i * 2); g.closePath(); g.fill();
      });
    },
    cristal: (g) => {
      tronco(g, '#cfd9ff', '#9aa6e6', 40);
      [[-22, -52, 20, 54, '#8fd8ff'], [20, -50, 20, 58, '#b9a4ff'], [0, -60, 26, 84, '#6fc3ff']].forEach((p) => {
        g.fillStyle = p[4]; g.beginPath(); g.moveTo(p[0], p[1] - p[3]); g.lineTo(p[0] + p[2], p[1] - p[3] * 0.4); g.lineTo(p[0] + p[2] * 0.6, p[1] + 14); g.lineTo(p[0] - p[2] * 0.6, p[1] + 14); g.lineTo(p[0] - p[2], p[1] - p[3] * 0.4); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(p[0], p[1] - p[3]); g.lineTo(p[0] - p[2], p[1] - p[3] * 0.4); g.lineTo(p[0] - p[2] * 0.6, p[1] + 14); g.lineTo(p[0] - p[2] * 0.15, p[1] - p[3] * 0.35); g.closePath(); g.fill();
      });
    },
    nevado: (g) => { // pino con la copa nevada
      ARBOL.pino(g);
      [[0, -30, 46], [0, -62, 38], [0, -92, 29], [0, -118, 20]].forEach((p, i) => {
        const tip = p[1] - 46 + i * 2, f = 0.45, yb = tip + (p[1] - tip) * f, hw = p[2] * f;
        g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, tip);
        g.lineTo(hw, yb); g.quadraticCurveTo(hw * 0.5, yb + 7, 0, yb + 1); g.quadraticCurveTo(-hw * 0.5, yb + 7, -hw, yb); g.closePath(); g.fill();
        g.fillStyle = 'rgba(190,215,245,0.8)'; g.beginPath(); g.moveTo(0, tip); g.lineTo(hw, yb); g.quadraticCurveTo(hw * 0.5, yb + 7, 0, yb + 1); g.closePath(); g.fill();
      });
    },
    algodon: (g) => { tronco(g, '#fff0d8', '#f0cfa8', 54); copa(g, [[-26, -80, 28], [26, -82, 28], [0, -106, 34], [0, -72, 28]], '#ffb3d9', '#ffe0f1', '#e58fc0'); copa(g, [[-34, -98, 13], [36, -100, 12]], '#c9b5ff', '#e7deff', '#a994f0'); },
    palmera: (g) => { // tronco curvo de anillos, hojas largas y cocos
      for (let i = 0; i < 10; i++) { const k = i / 9; elip(g, Math.sin(k * 1.6) * 14, -k * 108 - 4, 10 - k * 2.5, 8, i % 2 ? '#c98f55' : '#b37a45'); }
      const tx = 14, ty = -112;
      const hoja = (a, L, col) => {
        const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + 16, mx = tx + Math.cos(a) * L * 0.5, my = ty + Math.sin(a) * L * 0.5 - 12;
        g.fillStyle = col; g.beginPath(); g.moveTo(tx, ty - 3); g.quadraticCurveTo(mx, my - 8, ex, ey); g.quadraticCurveTo(mx, my + 10, tx, ty + 5); g.fill();
      };
      [2.6, 0.5].forEach((a) => hoja(a, 48, '#2a9a4a'));
      [-2.95, -2.3, -1.65, -0.95, -0.2].forEach((a, i) => hoja(a, 56, i % 2 ? '#3fb357' : '#4cc45f'));
      circ(g, tx - 6, ty + 6, 6.5, '#8a5a2e'); circ(g, tx + 6, ty + 8, 6.5, '#7a4a24'); circ(g, tx - 8, ty + 4, 2, '#c99a6a');
    },
    volcanico: (g) => { // copa de brasas tiernas con llamitas
      tronco(g, '#5a3a38', '#3f2827', 52);
      copa(g, [[-26, -78, 30], [26, -80, 30], [0, -104, 36], [0, -70, 30]], '#ff7a3d', '#ffc35a', '#d9452a');
      [[0, -138, 12], [-30, -104, 9], [30, -106, 9]].forEach((p) => {
        g.fillStyle = '#ff9a3d'; g.beginPath(); g.moveTo(p[0] - p[2], p[1] + p[2]); g.quadraticCurveTo(p[0] - p[2], p[1] - p[2] * 0.6, p[0], p[1] - p[2] * 1.6); g.quadraticCurveTo(p[0] + p[2], p[1] - p[2] * 0.6, p[0] + p[2], p[1] + p[2]); g.closePath(); g.fill();
        circ(g, p[0], p[1] + p[2] * 0.3, p[2] * 0.5, '#ffe066');
      });
      [[-14, -84], [18, -72], [-30, -66], [8, -100]].forEach((p) => circ(g, p[0], p[1], 3, '#ffe9a0'));
    },
    coral: (g) => { // ramas de coral rosa sobre una roquita
      elip(g, 0, -4, 30, 12, '#c7b9a8'); elip(g, -6, -8, 16, 6, '#e6dccf');
      const ramas = [[[0, -6], [0, -70], [-6, -140]], [[0, -40], [-30, -80], [-38, -120]], [[-30, -80], [-56, -96]], [[0, -55], [28, -90], [34, -130]], [[28, -90], [54, -102]], [[-4, -105], [-22, -128]]];
      [[12, '#e85a8a'], [8, '#ff7fa8'], [3, '#ffc2d6']].forEach((e, j) => {
        g.strokeStyle = e[1]; g.lineWidth = e[0];
        ramas.forEach((r) => { g.beginPath(); g.moveTo(r[0][0] + j, r[0][1]); for (let i = 1; i < r.length; i++) g.lineTo(r[i][0] + (j ? -1 : 0), r[i][1]); g.stroke(); });
      });
      [[-6, -140], [-38, -120], [-56, -96], [34, -130], [54, -102], [-22, -128]].forEach((p) => { circ(g, p[0], p[1], 7, '#ff7fa8'); circ(g, p[0] - 2, p[1] - 2, 2.5, '#fff'); });
    },
    lunar: (g) => { // azul noche con estrellitas y una lunita
      tronco(g, '#6d66c2', '#4a439a', 52);
      copa(g, [[-26, -78, 30], [26, -80, 30], [0, -104, 36], [0, -70, 30]], '#3a4596', '#5a68c8', '#262f73');
      g.fillStyle = '#ffe58a';
      [[-24, -84, 6], [20, -70, 5], [6, -112, 7], [30, -96, 4], [-8, -66, 4]].forEach((p) => { estrella(g, p[0], p[1], p[2], 5, 0.45); g.fill(); });
      lunita(g, -22, -112, 9, '#fff3b0');
    },
    tormenta: (g) => { // gris violeta con destellos amarillos
      tronco(g, '#7a7392', '#57506f', 52);
      copa(g, [[-26, -78, 30], [26, -80, 30], [0, -104, 36], [0, -70, 30]], '#7d6fb0', '#a497d6', '#56498a');
      [[-22, -96], [18, -76], [6, -122]].forEach((p) => rayito(g, p[0], p[1], 9, '#ffe14d'));
    }
  };
  // Media luna abierta hacia la derecha
  function lunita(g, x, y, R, color) {
    g.beginPath(); g.arc(x, y, R, -Math.PI / 2, Math.PI / 2, true); g.ellipse(x - R * 0.05, y, R * 0.42, R, 0, Math.PI / 2, -Math.PI / 2, false); g.closePath();
    g.fillStyle = color; g.fill();
  }
  // Rayito en zigzag (alto ≈ 2·s)
  function rayito(g, x, y, s, color, borde) {
    g.beginPath(); g.moveTo(x + s * 0.3, y - s); g.lineTo(x - s * 0.55, y + s * 0.15); g.lineTo(x - s * 0.02, y + s * 0.12); g.lineTo(x - s * 0.35, y + s);
    g.lineTo(x + s * 0.6, y - s * 0.2); g.lineTo(x + s * 0.05, y - s * 0.17); g.closePath();
    g.fillStyle = color; g.fill(); if (borde) { g.strokeStyle = borde; g.lineWidth = Math.max(1, s * 0.12); g.stroke(); }
  }
  D.lunita = lunita; D.rayito = rayito;
  const ROCA = [[[0, -14, 22, 16]], [[-8, -12, 18, 14], [12, -9, 14, 11]], [[0, -18, 20, 20], [16, -8, 12, 9]]];

  D.construirSprites = function () {
    Object.keys(ARBOL).forEach((k) => (D.spr['arbol_' + k] = sprite(150, 170, 75, 160, ARBOL[k])));
    const arbusto = (base, luz, sombra) => (g) => copa(g, [[-22, -16, 18], [22, -16, 18], [0, -26, 24]], base, luz, sombra);
    D.spr.arbusto_pradera = sprite(100, 64, 50, 56, arbusto('#34b257', '#6fdc6c', '#218c47'));
    D.spr.arbusto_bosque = sprite(100, 64, 50, 56, arbusto('#23915a', '#49bd74', '#17703f'));
    D.spr.arbusto_cristal = sprite(100, 64, 50, 56, arbusto('#63d6c9', '#b4f5ea', '#3aa99d'));
    D.spr.arbusto_nubes = sprite(100, 64, 50, 56, arbusto('#ffc1e3', '#ffe6f4', '#f08fc6'));
    D.spr.arbusto_nieve = sprite(100, 64, 50, 56, arbusto('#dcecff', '#ffffff', '#a9c3e6'));
    D.spr.arbusto_flores = sprite(100, 64, 50, 56, (g) => {
      arbusto('#3fbf5c', '#7fe06a', '#24924a')(g);
      [[-24, -24, '#ff5d8f'], [6, -36, '#ffd23f'], [24, -20, '#c38bff'], [-6, -14, '#ffffff']].forEach((p) => { circ(g, p[0], p[1], 5, p[2]); circ(g, p[0], p[1], 2, '#ff8a3d'); });
    });
    D.spr.arbusto_luna = sprite(100, 64, 50, 56, (g) => {
      arbusto('#3a4596', '#5a68c8', '#262f73')(g);
      g.fillStyle = '#ffe58a'; [[-28, -26, 4], [4, -42, 5], [28, -24, 4]].forEach((p) => { estrella(g, p[0], p[1], p[2], 5, 0.45); g.fill(); });
    });
    D.spr.arbusto_volcan = sprite(100, 64, 50, 56, (g) => {
      arbusto('#e8603c', '#ffa45a', '#b8402a')(g);
      [[-30, -24], [0, -44], [30, -22]].forEach((p) => { circ(g, p[0], p[1], 3.5, '#ffe066'); });
    });
    D.spr.arbusto_tormenta = sprite(100, 64, 50, 56, (g) => {
      arbusto('#8a82ad', '#b4acd6', '#635b8a')(g);
      rayito(g, 2, -40, 6, '#ffe14d'); rayito(g, -30, -24, 4, '#ffe14d');
    });
    D.spr.arbusto_mar = sprite(100, 64, 50, 56, (g) => {
      arbusto('#3fc9b0', '#8ff0dc', '#22978a')(g);
      [[-30, -22, '#ffb3c8'], [28, -26, '#fff1dc']].forEach((p) => { g.fillStyle = p[2]; g.beginPath(); g.moveTo(p[0], p[1] + 4); g.arc(p[0], p[1], 5, Math.PI, 0); g.closePath(); g.fill(); });
      circ(g, 2, -44, 3, 'rgba(255,255,255,0.8)');
    });
    D.spr.arbusto_desierto = sprite(100, 64, 50, 56, (g) => { // matita de cactus redondito con florcita
      arbusto('#7fb85a', '#b0dc7a', '#5a913f')(g);
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.5;
      [[-30, -20], [30, -22], [-16, -34], [18, -36]].forEach((p) => { g.beginPath(); g.moveTo(p[0] - 2, p[1]); g.lineTo(p[0] + 2, p[1]); g.moveTo(p[0], p[1] - 2); g.lineTo(p[0], p[1] + 2); g.stroke(); });
      circ(g, 0, -46, 5, '#ff7fb0'); circ(g, 0, -46, 2, '#ffe066');
    });
    ROCA.forEach((r, i) => (D.spr['roca_' + i] = sprite(80, 56, 40, 48, (g) => {
      r.forEach((p) => { elip(g, p[0], p[1] + 3, p[2], p[3], '#8791a8'); elip(g, p[0], p[1], p[2], p[3], '#b9c2d6'); elip(g, p[0] - p[2] * 0.3, p[1] - p[3] * 0.35, p[2] * 0.45, p[3] * 0.35, '#e3e9f5'); });
    })));
    D.spr.nube = sprite(260, 130, 130, 70, (g) => {
      g.fillStyle = 'rgba(255,255,255,0.96)';
      [[-70, 10, 40], [-28, -14, 52], [34, -8, 46], [80, 12, 36], [0, 18, 50]].forEach((p) => { g.beginPath(); g.arc(p[0], p[1], p[2], 0, U.TAU); g.fill(); });
      circ(g, -22, 0, 5, '#4a5a8a'); circ(g, 22, 0, 5, '#4a5a8a'); circ(g, -20, -2, 1.8, '#fff'); circ(g, 24, -2, 1.8, '#fff');
      g.strokeStyle = '#4a5a8a'; g.lineWidth = 3.5; g.beginPath(); g.arc(0, 8, 13, 0.25, Math.PI - 0.25); g.stroke();
      elip(g, -40, 12, 9, 5, 'rgba(255,150,180,0.6)'); elip(g, 40, 12, 9, 5, 'rgba(255,150,180,0.6)');
    });
    Object.keys(TEMA).forEach((id) => (D.castillo[id] = construirCastillo(id)));
  };

  // ---------- Castillos ----------
  const TEMA = {
    real: { luz: '#fffaf0', muro: '#ffeccb', sombra: '#f2c79a', borde: '#b9825f', techo: '#ff5d8f', techoSombra: '#d93a72', detalle: '#ffc93c', puerta: '#a8572f', estilo: 'cono', bandera: '#ff3d7f' },
    bosque: { luz: '#d7a871', muro: '#b98450', sombra: '#8f5f37', borde: '#5f3c22', techo: '#3fb357', techoSombra: '#23803f', detalle: '#ffd23f', puerta: '#6e4424', estilo: 'copa', bandera: '#ffd23f' },
    cristal: { luz: '#f2fbff', muro: '#bfe6ff', sombra: '#8fb8f5', borde: '#5a79c9', techo: '#9a8cff', techoSombra: '#6a5be0', detalle: '#ffffff', puerta: '#6a5be0', estilo: 'cristal', bandera: '#5ad1ff' },
    nubes: { luz: '#ffffff', muro: '#fff4fb', sombra: '#e6d4f5', borde: '#b79ad6', techo: '#8fd3ff', techoSombra: '#5aa9ec', detalle: '#ffd23f', puerta: '#ff9dcb', estilo: 'cupula', bandera: '#c38bff' },
    hielo: { luz: '#f6fdff', muro: '#d4f0ff', sombra: '#a2d0f0', borde: '#5b93c4', techo: '#c6ecff', techoSombra: '#86c8ee', detalle: '#ffffff', puerta: '#6aa8d8', estilo: 'carambano', bandera: '#7fd6ff' },
    luna: { luz: '#cfcaf7', muro: '#a39de4', sombra: '#726bc6', borde: '#3e3788', techo: '#34408f', techoSombra: '#20286a', detalle: '#ffe58a', puerta: '#3e3788', estilo: 'lunar', bandera: '#ffe066' },
    fuego: { luz: '#ffd6ad', muro: '#ec9a6c', sombra: '#bd6442', borde: '#7a3424', techo: '#ff6a3d', techoSombra: '#d63c28', detalle: '#ffd23f', puerta: '#7a3424', estilo: 'volcan', bandera: '#ffb02e' },
    trueno: { luz: '#e6e2f2', muro: '#bcb5d6', sombra: '#8c84b0', borde: '#4f4775', techo: '#7d6fb0', techoSombra: '#54478a', detalle: '#ffe14d', puerta: '#54478a', estilo: 'rayo', bandera: '#ffe14d' },
    mar: { luz: '#fff8f2', muro: '#c2f1ea', sombra: '#86d3cc', borde: '#3c8f9a', techo: '#62d8d2', techoSombra: '#2fa9b0', detalle: '#ffc9dc', puerta: '#2f8f9a', estilo: 'caracola', bandera: '#ff8fb5' },
    arena: { luz: '#fff2cc', muro: '#f3cf8a', sombra: '#d9a65e', borde: '#9a6a34', techo: '#ffbf4d', techoSombra: '#e08a2a', detalle: '#5fd6c8', puerta: '#9a6a34', estilo: 'cebolla', bandera: '#3fc6b8' },
    // El Huerto: jardín de infantes de cuento (paredes amarillo pastel, techos de teja, marcos verdes)
    huerto: { luz: '#fffbe6', muro: '#ffeaa6', sombra: '#f2c97c', borde: '#a8683a', techo: '#ec5f45', techoSombra: '#bf3d2c', detalle: '#7fd36b', puerta: '#b06a35', estilo: 'escuela', bandera: '#ff8fb5' }
  };
  D.TEMA = TEMA;

  let campanaHuerto = null; // dónde cuelga la campana del campanario (la anima ANIM.huerto)
  function filasDeTejas(g, x0, x1, yb, yt) { // festones de tejas (dentro de un clip)
    g.strokeStyle = 'rgba(120,30,20,0.42)'; g.lineWidth = 2;
    for (let fy = yb, f = 0; fy > yt - 8; fy -= 10, f++) {
      g.beginPath();
      for (let fx = x0 - (f % 2) * 7; fx < x1; fx += 14) { g.moveTo(fx, fy - 6); g.arc(fx + 7, fy - 6, 7, Math.PI, 0, true); }
      g.stroke();
    }
  }
  function techo(g, T, x, w, y) {
    const r = w / 2 + 9;
    if (T.estilo === 'escuela') { // techo a dos aguas de tejas con frontón y, en la torre grande, campanario
      const R = w / 2 + 14, h = w * 0.5 + 16, yb = y + 4, Ri = w / 2 + 1, hi = h * Ri / R - 8;
      const tri = (rr, hh) => { g.beginPath(); g.moveTo(x - rr, yb); g.lineTo(x, yb - hh); g.lineTo(x + rr, yb); g.closePath(); };
      tri(R, h); g.fillStyle = T.techo; g.fill();
      g.save(); tri(R, h); g.clip();
      g.fillStyle = T.techoSombra; g.beginPath(); g.moveTo(x, yb - h); g.lineTo(x + R, yb); g.lineTo(x, yb); g.closePath(); g.fill();
      filasDeTejas(g, x - R, x + R, yb, yb - h);
      g.restore();
      g.strokeStyle = T.borde; g.lineWidth = 2.5; tri(R, h); g.stroke();
      // frontón pintado
      tri(Ri, hi); g.fillStyle = T.muro; g.fill(); g.strokeStyle = T.borde; g.lineWidth = 2; g.stroke();
      const oy = yb - hi * 0.4, or = Math.min(hi * 0.24, Ri * 0.3);
      if (w >= 150) emblema(g, 'huerto', x, oy, or / 1.5);
      else {
        circ(g, x, oy, or + 3, T.detalle, T.borde, 1.5); circ(g, x, oy, or, '#3b3f7a');
        g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - or, oy); g.lineTo(x + or, oy); g.moveTo(x, oy - or); g.lineTo(x, oy + or); g.stroke();
      }
      if (w < 150) return yb - h;
      // campanario sobre la cumbrera
      const bw = w * 0.3, bh = 58, bb = yb - h + 34, bt = bb - bh;
      g.fillStyle = T.luz; g.fillRect(x - bw / 2, bt, bw, bh); g.strokeStyle = T.borde; g.lineWidth = 2.5; g.strokeRect(x - bw / 2, bt, bw, bh);
      g.fillStyle = '#6a3f2a'; g.beginPath(); g.moveTo(x - bw * 0.32, bb - 8); g.lineTo(x - bw * 0.32, bt + bw * 0.42); g.arc(x, bt + bw * 0.42, bw * 0.32, Math.PI, 0); g.lineTo(x + bw * 0.32, bb - 8); g.closePath(); g.fill();
      g.fillStyle = T.detalle; g.fillRect(x - bw / 2 - 3, bb - 10, bw + 6, 6); g.strokeStyle = T.borde; g.lineWidth = 1.5; g.strokeRect(x - bw / 2 - 3, bb - 10, bw + 6, 6);
      campanaHuerto = { x, y: bt + bw * 0.2, r: bw * 0.24 };
      const tr = bw / 2 + 9, th = 28;
      g.fillStyle = T.techo; g.beginPath(); g.moveTo(x - tr, bt + 2); g.lineTo(x, bt - th); g.lineTo(x + tr, bt + 2); g.closePath(); g.fill();
      g.save(); g.clip(); g.fillStyle = T.techoSombra; g.fillRect(x, bt - th, tr, th + 2); filasDeTejas(g, x - tr, x + tr, bt + 2, bt - th); g.restore();
      g.strokeStyle = T.borde; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - tr, bt + 2); g.lineTo(x, bt - th); g.lineTo(x + tr, bt + 2); g.closePath(); g.stroke();
      return bt - th;
    }
    if (T.estilo === 'cono') {
      const h = w * 0.95 + 20;
      g.fillStyle = T.techoSombra; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + 14, x + r, y); g.lineTo(x, y - h); g.closePath(); g.fill();
      g.fillStyle = T.techo; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x - r * 0.3, y + 11, x + r * 0.15, y + 9); g.lineTo(x, y - h); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(x - r * 0.7, y + 2); g.lineTo(x - r * 0.42, y + 5); g.lineTo(x - 2, y - h + 8); g.closePath(); g.fill();
      g.strokeStyle = T.borde; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + 14, x + r, y); g.lineTo(x, y - h); g.closePath(); g.stroke();
      return y - h;
    }
    if (T.estilo === 'copa') {
      const s = w / 80;
      copa(g, [[x - 30 * s, y - 14 * s, 30 * s], [x + 30 * s, y - 14 * s, 30 * s], [x, y - 44 * s, 38 * s], [x, y - 8 * s, 30 * s]], T.techo, '#74d86b', T.techoSombra);
      [[-24, -30], [18, -22], [4, -62]].forEach((p) => circ(g, x + p[0] * s, y + p[1] * s, 5 * s, '#ff5d8f'));
      return y - 80 * s;
    }
    if (T.estilo === 'cristal') {
      const h = w * 1.3 + 20;
      g.fillStyle = T.techoSombra; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.lineTo(x + r * 0.55, y - h * 0.55); g.lineTo(x, y - h); g.lineTo(x - r * 0.55, y - h * 0.55); g.closePath(); g.fill();
      g.fillStyle = T.techo; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r * 0.1, y); g.lineTo(x, y - h); g.lineTo(x - r * 0.55, y - h * 0.55); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(x - r * 0.8, y); g.lineTo(x - r * 0.4, y); g.lineTo(x - r * 0.15, y - h * 0.7); g.lineTo(x - r * 0.5, y - h * 0.5); g.closePath(); g.fill();
      g.strokeStyle = T.borde; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.lineTo(x + r * 0.55, y - h * 0.55); g.lineTo(x, y - h); g.lineTo(x - r * 0.55, y - h * 0.55); g.closePath(); g.stroke();
      return y - h;
    }
    if (T.estilo === 'carambano') { // agujas de carámbano translúcidas con gorrito de nieve
      const h = w * 1.25 + 20;
      const pico = (cx, hw, hh) => { g.beginPath(); g.moveTo(cx - hw, y); g.quadraticCurveTo(cx - hw * 0.35, y - hh * 0.45, cx, y - hh); g.quadraticCurveTo(cx + hw * 0.35, y - hh * 0.45, cx + hw, y); g.closePath(); };
      [[x - r * 0.6, r * 0.45, h * 0.55], [x + r * 0.6, r * 0.45, h * 0.55], [x, r * 0.68, h]].forEach((p) => {
        pico(p[0], p[1], p[2]); g.fillStyle = 'rgba(150,212,248,0.82)'; g.fill();
        g.strokeStyle = T.borde; g.lineWidth = 2.2; g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(p[0] - p[1] * 0.6, y - 2); g.quadraticCurveTo(p[0] - p[1] * 0.25, y - p[2] * 0.45, p[0] - 1, y - p[2] + 6); g.lineTo(p[0] - p[1] * 0.2, y - 2); g.closePath(); g.fill();
      });
      g.fillStyle = '#ffffff'; g.strokeStyle = '#bcd6ee'; g.lineWidth = 1.5;
      for (let k = -3; k <= 3; k++) { g.beginPath(); g.arc(x + k * r * 0.3, y - 1, r * 0.2, Math.PI, 0); g.fill(); }
      g.fillStyle = 'rgba(210,240,255,0.95)'; // carámbanos colgando
      for (let k = -2; k <= 2; k++) { const cx = x + k * r * 0.36; g.beginPath(); g.moveTo(cx - 4, y); g.lineTo(cx, y + 9 + (k & 1) * 6); g.lineTo(cx + 4, y); g.closePath(); g.fill(); }
      return y - h;
    }
    if (T.estilo === 'lunar') { // cúpula azul noche con estrellitas y media luna dorada
      const h = w * 0.72 + 12;
      const forma = () => { g.beginPath(); g.moveTo(x - r, y); g.bezierCurveTo(x - r, y - h * 1.3, x + r, y - h * 1.3, x + r, y); g.closePath(); };
      forma(); g.fillStyle = T.techoSombra; g.fill();
      g.save(); forma(); g.clip(); elip(g, x - r * 0.25, y - h * 0.35, r * 0.75, h * 0.75, T.techo);
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(x - r * 0.45, y - h * 0.5, r * 0.14, h * 0.28, 0.4, 0, U.TAU); g.fill(); g.restore();
      g.fillStyle = '#ffe58a';
      [[-0.45, 0.3, 0.13], [0.35, 0.45, 0.1], [0.05, 0.7, 0.11], [0.55, 0.18, 0.08], [-0.15, 0.15, 0.07]].forEach((p) => { estrella(g, x + p[0] * r, y - p[1] * h, Math.max(3, p[2] * r), 5, 0.45); g.fill(); });
      g.strokeStyle = T.borde; g.lineWidth = 2.5; forma(); g.stroke();
      g.fillStyle = '#ffd23f'; g.fillRect(x - r, y - 5, r * 2, 6); g.strokeRect(x - r, y - 5, r * 2, 6);
      g.strokeStyle = '#e0a800'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - h * 0.96); g.lineTo(x, y - h - 12); g.stroke();
      const R = Math.max(7, w * 0.11); lunita(g, x, y - h - 12 - R, R, '#ffd23f');
      return y - h - 12 - R * 2;
    }
    if (T.estilo === 'volcan') { // cono rojo-naranja con craterito y llamita tierna
      const h = w * 0.82 + 18, tw = r * 0.3;
      g.fillStyle = T.techoSombra; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + 14, x + r, y); g.lineTo(x + tw, y - h); g.lineTo(x - tw, y - h); g.closePath(); g.fill();
      g.fillStyle = T.techo; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x - r * 0.3, y + 11, x + r * 0.15, y + 9); g.lineTo(x + tw * 0.2, y - h); g.lineTo(x - tw, y - h); g.closePath(); g.fill();
      // lava que chorrea del borde
      g.fillStyle = '#ffb02e'; g.beginPath(); g.moveTo(x - tw, y - h); g.lineTo(x + tw, y - h); g.lineTo(x + tw * 1.3, y - h + h * 0.14); g.lineTo(x - tw * 1.3, y - h + h * 0.14); g.closePath(); g.fill();
      [[-0.85, 0.2, 0.22], [0.05, 0.28, 0.26], [0.8, 0.18, 0.2]].forEach((p) => elip(g, x + p[0] * tw, y - h + h * p[1], tw * p[2] + 2, h * 0.06 + 2, '#ffb02e'));
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(x - r * 0.7, y + 2); g.lineTo(x - r * 0.45, y + 5); g.lineTo(x - tw * 0.7, y - h * 0.8); g.closePath(); g.fill();
      g.strokeStyle = T.borde; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + 14, x + r, y); g.lineTo(x + tw, y - h); g.lineTo(x - tw, y - h); g.closePath(); g.stroke();
      elip(g, x, y - h, tw, tw * 0.38 + 1, '#7a3424'); elip(g, x, y - h + 1, tw * 0.7, tw * 0.24 + 1, '#ffd23f');
      const f = tw * 0.9 + 4;
      g.fillStyle = '#ff7a2a'; g.beginPath(); g.moveTo(x - f * 0.6, y - h); g.quadraticCurveTo(x - f * 0.7, y - h - f * 0.9, x, y - h - f * 1.8); g.quadraticCurveTo(x + f * 0.7, y - h - f * 0.9, x + f * 0.6, y - h); g.closePath(); g.fill();
      g.fillStyle = '#ffe066'; g.beginPath(); g.moveTo(x - f * 0.3, y - h); g.quadraticCurveTo(x - f * 0.35, y - h - f * 0.6, x, y - h - f * 1.1); g.quadraticCurveTo(x + f * 0.35, y - h - f * 0.6, x + f * 0.3, y - h); g.closePath(); g.fill();
      return y - h - f * 1.8;
    }
    if (T.estilo === 'rayo') { // aguja en zigzag gris-violeta con un rayito amarillo
      const h = w * 1.15 + 20;
      const forma = () => {
        g.beginPath(); g.moveTo(x - r, y); g.lineTo(x - r * 0.5, y - h * 0.34); g.lineTo(x - r * 0.78, y - h * 0.37); g.lineTo(x - r * 0.25, y - h * 0.68); g.lineTo(x - r * 0.46, y - h * 0.7); g.lineTo(x, y - h);
        g.lineTo(x + r * 0.46, y - h * 0.7); g.lineTo(x + r * 0.25, y - h * 0.68); g.lineTo(x + r * 0.78, y - h * 0.37); g.lineTo(x + r * 0.5, y - h * 0.34); g.lineTo(x + r, y); g.closePath();
      };
      forma(); g.fillStyle = T.techoSombra; g.fill();
      g.save(); forma(); g.clip(); g.fillStyle = T.techo; g.fillRect(x - r - 2, y - h - 2, r * 1.05, h + 4);
      g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(x - r * 0.62, y - h, r * 0.16, h); g.restore();
      g.strokeStyle = T.borde; g.lineWidth = 2.5; forma(); g.stroke();
      rayito(g, x + r * 0.05, y - h * 0.38, Math.max(8, r * 0.36), '#ffe14d', '#c99a00');
      circ(g, x, y - h - 3, 5, '#ffe14d', T.borde, 2);
      return y - h - 6;
    }
    if (T.estilo === 'caracola') { // cúpula de caracola en espiral turquesa y nácar
      const h = w * 1.1 + 18;
      const forma = () => { g.beginPath(); g.moveTo(x - r, y); g.bezierCurveTo(x - r * 1.05, y - h * 0.45, x - r * 0.2, y - h * 0.75, x, y - h); g.bezierCurveTo(x + r * 0.2, y - h * 0.75, x + r * 1.05, y - h * 0.45, x + r, y); g.quadraticCurveTo(x, y + 12, x - r, y); g.closePath(); };
      forma(); g.fillStyle = T.techo; g.fill();
      g.save(); forma(); g.clip();
      g.fillStyle = T.techoSombra; g.beginPath(); g.ellipse(x + r * 0.9, y - h * 0.3, r * 0.75, h * 0.8, 0, 0, U.TAU); g.fill();
      for (let i = 0; i < 5; i++) { // vueltas de la espiral
        const yy = y - h * (0.1 + i * 0.19), ww = r * (1.1 - i * 0.2);
        g.strokeStyle = '#fff3ea'; g.lineWidth = 5; g.beginPath(); g.ellipse(x, yy, ww, ww * 0.3, -0.22, 0.15, Math.PI - 0.15); g.stroke();
        g.strokeStyle = 'rgba(255,170,200,0.8)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, yy + 4, ww, ww * 0.3, -0.22, 0.3, Math.PI - 0.3); g.stroke();
      }
      g.restore();
      g.strokeStyle = T.borde; g.lineWidth = 2.5; forma(); g.stroke();
      circ(g, x, y - h - 5, 6, '#fff8fb', T.borde, 2); circ(g, x - 2, y - h - 7, 2, '#ffd0e0');
      return y - h - 10;
    }
    if (T.estilo === 'cebolla') { // cúpula de cebolla dorada sobre un tamborcito turquesa
      const h = w * 1.05 + 20, yb = y - 8;
      g.fillStyle = T.detalle; g.fillRect(x - r * 0.62, yb, r * 1.24, 8); g.strokeStyle = T.borde; g.lineWidth = 2; g.strokeRect(x - r * 0.62, yb, r * 1.24, 8);
      const forma = () => { g.beginPath(); g.moveTo(x - r * 0.62, yb); g.bezierCurveTo(x - r * 1.45, yb - h * 0.32, x - r * 0.15, yb - h * 0.62, x, yb - h); g.bezierCurveTo(x + r * 0.15, yb - h * 0.62, x + r * 1.45, yb - h * 0.32, x + r * 0.62, yb); g.closePath(); };
      forma(); g.fillStyle = T.techo; g.fill();
      g.save(); forma(); g.clip();
      g.fillStyle = T.techoSombra; g.beginPath(); g.ellipse(x + r * 0.85, yb - h * 0.3, r * 0.6, h * 0.6, 0, 0, U.TAU); g.fill();
      g.strokeStyle = 'rgba(154,106,52,0.45)'; g.lineWidth = 2;
      [-0.5, 0, 0.5].forEach((k) => { g.beginPath(); g.moveTo(x + k * r * 0.9, yb); g.quadraticCurveTo(x + k * r * 1.4, yb - h * 0.4, x, yb - h); g.stroke(); });
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(x - r * 0.45, yb - h * 0.3, r * 0.16, h * 0.18, 0.3, 0, U.TAU); g.fill();
      g.restore();
      for (let k = -2; k <= 2; k++) circ(g, x + k * r * 0.26, yb - h * 0.18 + Math.abs(k) * 2, 2.6, T.detalle);
      g.strokeStyle = T.borde; g.lineWidth = 2.5; forma(); g.stroke();
      circ(g, x, yb - h - 4, 5, '#ffd23f', T.borde, 2);
      return yb - h - 8;
    }
    // cúpula (castillo de las nubes)
    const h = w * 0.9 + 16;
    const forma = () => { g.beginPath(); g.moveTo(x - r * 0.75, y); g.bezierCurveTo(x - r * 1.5, y - h * 0.45, x - r * 0.5, y - h * 0.8, x, y - h); g.bezierCurveTo(x + r * 0.5, y - h * 0.8, x + r * 1.5, y - h * 0.45, x + r * 0.75, y); g.closePath(); };
    g.save(); forma(); g.clip();
    ['#ff9dcb', '#ffd98a', '#a8f0c6', '#8fd3ff', '#c9a8ff'].forEach((c, i) => { g.fillStyle = c; g.fillRect(x - r * 1.3 + i * r * 0.52, y - h, r * 0.53, h); });
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(x - r * 0.45, y - h * 0.45, r * 0.22, h * 0.3, 0.3, 0, U.TAU); g.fill();
    g.restore();
    g.strokeStyle = T.borde; g.lineWidth = 2.5; forma(); g.stroke();
    circ(g, x, y - h - 4, 6, '#ffd23f', T.borde, 2);
    return y - h - 8;
  }

  function texturaMuro(g, T, id, x, y, w, h) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    const r = U.semilla(Math.abs(x * 31 + w * 7 + h) | 0);
    if (id === 'real') {
      g.fillStyle = 'rgba(185,130,95,0.3)';
      for (let i = 0; i < (w * h) / 1400; i++) { const bx = x + r() * (w - 20), by = y + 8 + r() * (h - 16); redondo(g, bx, by, 18, 7, 3); g.fill(); }
    } else if (id === 'bosque') {
      g.strokeStyle = 'rgba(95,60,34,0.45)'; g.lineWidth = 2;
      for (let px = x + 14; px < x + w; px += 16) { g.beginPath(); g.moveTo(px, y); g.lineTo(px, y + h); g.stroke(); }
      g.strokeStyle = '#3fb357'; g.lineWidth = 4;
      for (let i = 0; i < w / 60; i++) {
        const vx = x + 10 + r() * (w - 20); g.beginPath(); g.moveTo(vx, y);
        for (let k = 1; k < 6; k++) g.lineTo(vx + (k % 2 ? 7 : -7), y + (k * h * 0.6) / 6); g.stroke();
      }
    } else if (id === 'cristal') {
      g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 3;
      for (let i = -h; i < w; i += 34) { g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + h * 0.6, y); g.stroke(); }
      g.fillStyle = '#fff';
      for (let i = 0; i < (w * h) / 3000; i++) { estrella(g, x + r() * w, y + r() * h, 5, 4, 0.3); g.fill(); }
    } else if (id === 'hielo') { // bloques de hielo, nieve arriba y carámbanos
      g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2;
      for (let fy = y + 6, f = 0; fy < y + h; fy += 26, f++) for (let fx = x - (f % 2) * 20; fx < x + w; fx += 40) { redondo(g, fx + 3, fy, 34, 21, 6); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3;
      for (let i = 0; i < w / 50; i++) { const sx = x + r() * w, sy = y + 20 + r() * (h - 30); g.beginPath(); g.moveTo(sx, sy + 10); g.lineTo(sx + 7, sy - 4); g.stroke(); }
      g.fillStyle = '#ffffff';
      for (let px = x - 6; px < x + w + 10; px += 16) { g.beginPath(); g.arc(px, y, 9 + ((px * 3) % 4), 0, Math.PI); g.fill(); }
      g.fillStyle = 'rgba(225,246,255,0.95)';
      for (let px = x + 8; px < x + w - 4; px += 22) { g.beginPath(); g.moveTo(px - 4, y + 6); g.lineTo(px, y + 16 + r() * 10); g.lineTo(px + 4, y + 6); g.closePath(); g.fill(); }
    } else if (id === 'luna') { // estrellitas y lunitas sobre piedra lila
      g.fillStyle = 'rgba(62,55,136,0.22)';
      for (let i = 0; i < (w * h) / 1500; i++) { redondo(g, x + r() * (w - 20), y + 6 + r() * (h - 14), 20, 9, 4); g.fill(); }
      g.fillStyle = '#ffe58a';
      for (let i = 0; i < (w * h) / 2600; i++) { estrella(g, x + r() * w, y + r() * h, 3 + r() * 3, 5, 0.45); g.fill(); }
      for (let i = 0; i < w / 90; i++) lunita(g, x + 8 + r() * (w - 16), y + 10 + r() * (h - 20), 5, 'rgba(255,246,200,0.9)');
    } else if (id === 'fuego') { // piedra de lava con vetas tibias
      g.strokeStyle = 'rgba(122,52,36,0.4)'; g.lineWidth = 2;
      for (let fy = y + 18; fy < y + h; fy += 22) { g.beginPath(); g.moveTo(x, fy); g.lineTo(x + w, fy); g.stroke(); }
      g.strokeStyle = 'rgba(255,190,70,0.85)'; g.lineWidth = 3;
      for (let i = 0; i < (w * h) / 3200; i++) {
        let vx = x + r() * w, vy = y + r() * h; g.beginPath(); g.moveTo(vx, vy);
        for (let k = 0; k < 3; k++) { vx += 6 + r() * 8; vy += (k % 2 ? -1 : 1) * (5 + r() * 6); g.lineTo(vx, vy); } g.stroke();
      }
    } else if (id === 'trueno') { // piedras de tormenta con rayitos
      g.fillStyle = 'rgba(79,71,117,0.22)';
      for (let i = 0; i < (w * h) / 1300; i++) { redondo(g, x + r() * (w - 16), y + 6 + r() * (h - 14), 14 + r() * 10, 9, 4); g.fill(); }
      for (let i = 0; i < (w * h) / 4500; i++) rayito(g, x + 6 + r() * (w - 12), y + 10 + r() * (h - 20), 6, 'rgba(255,225,77,0.95)');
    } else if (id === 'mar') { // escamas de ola y burbujitas
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2.5;
      for (let fy = y + 10, f = 0; fy < y + h + 10; fy += 14, f++) for (let fx = x - (f % 2) * 10; fx < x + w + 10; fx += 20) { g.beginPath(); g.arc(fx, fy, 10, 0, Math.PI); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2;
      for (let i = 0; i < (w * h) / 3000; i++) { g.beginPath(); g.arc(x + r() * w, y + r() * h, 3 + r() * 4, 0, U.TAU); g.stroke(); }
    } else if (id === 'arena') { // capas de arenisca y una guarda de mosaicos
      g.strokeStyle = 'rgba(154,106,52,0.32)'; g.lineWidth = 3;
      for (let fy = y + 16; fy < y + h; fy += 18) { g.beginPath(); g.moveTo(x, fy); for (let px = x; px <= x + w; px += 24) g.quadraticCurveTo(px + 6, fy - 4, px + 12, fy); g.stroke(); }
      const gy = y + Math.min(h * 0.22, 34);
      g.fillStyle = '#e08a2a'; g.fillRect(x, gy - 6, w, 12);
      for (let px = x + 8; px < x + w; px += 16) { g.fillStyle = (px / 16) & 1 ? '#5fd6c8' : '#ffffff'; g.beginPath(); g.moveTo(px, gy - 5); g.lineTo(px + 5, gy); g.lineTo(px, gy + 5); g.lineTo(px - 5, gy); g.closePath(); g.fill(); }
    } else if (id === 'huerto') { // tablitas pintadas con florcitas
      g.strokeStyle = 'rgba(168,104,58,0.2)'; g.lineWidth = 2;
      for (let fy = y + 16; fy < y + h; fy += 16) { g.beginPath(); g.moveTo(x, fy); g.lineTo(x + w, fy); g.stroke(); }
      const FL = ['#ff8fb5', '#ffffff', '#8fd3ff', '#c9a2ff'];
      for (let i = 0; i < (w * h) / 2600; i++) {
        const fx = x + r() * w, fy = y + 6 + r() * (h - 12);
        g.fillStyle = FL[i % 4]; g.beginPath();
        for (let k = 0; k < 5; k++) { const a = k * 1.2566, px = fx + Math.cos(a) * 3.2, py = fy + Math.sin(a) * 3.2; g.moveTo(px + 2.4, py); g.arc(px, py, 2.4, 0, U.TAU); }
        g.fill(); circ(g, fx, fy, 1.9, '#ffb02e');
      }
    } else {
      g.strokeStyle = 'rgba(183,154,214,0.4)'; g.lineWidth = 3;
      for (let i = 0; i < (w * h) / 2600; i++) { const cx = x + r() * w, cy = y + r() * h; g.beginPath(); g.arc(cx, cy, 9, Math.PI, U.TAU); g.arc(cx + 14, cy, 6, Math.PI, U.TAU); g.stroke(); }
    }
    g.restore();
  }

  D.texturaMuro = texturaMuro;

  const CON_ALMENAS = { lunar: 1, volcan: 1, rayo: 1, cebolla: 1 }, SIN_HUECO = { carambano: 1, caracola: 1, escuela: 1 };

  // Lo que va DETRÁS de los castillos nuevos (como el arcoíris del de las nubes)
  function fondoCastillo(g, id) {
    if (id === 'hielo') { // aurora boreal
      ['rgba(130,255,200,0.4)', 'rgba(120,200,255,0.38)', 'rgba(255,160,230,0.32)'].forEach((c, i) => {
        g.strokeStyle = c; g.lineWidth = 20; g.beginPath();
        for (let px = -320; px <= 320; px += 16) g[px === -320 ? 'moveTo' : 'lineTo'](px, -440 + i * 22 + Math.sin(px * 0.014 + i * 1.3) * 26);
        g.stroke();
      });
    } else if (id === 'luna') { // luna llena grandota y estrellitas
      circ(g, 210, -445, 70, 'rgba(255,246,200,0.35)'); circ(g, 210, -445, 56, '#fff6c8', '#e8d78a', 3);
      [[190, -460, 11], [232, -432, 8], [206, -420, 6], [236, -468, 5]].forEach((p) => elip(g, p[0], p[1], p[2], p[2] * 0.8, '#efe0a0'));
      g.fillStyle = '#fff3b0';
      [[-280, -400, 9], [-210, -470, 7], [-300, -300, 6], [300, -330, 8], [110, -520, 6], [-120, -530, 7]].forEach((p) => { estrella(g, p[0], p[1], p[2], 5, 0.45); g.fill(); });
    } else if (id === 'fuego') { // calorcito anaranjado y un volcancito simpático
      const gr = g.createRadialGradient(0, -240, 40, 0, -240, 330);
      gr.addColorStop(0, 'rgba(255,150,70,0.45)'); gr.addColorStop(1, 'rgba(255,150,70,0)');
      g.fillStyle = gr; g.fillRect(-330, -590, 660, 600);
      g.fillStyle = '#8a5a4a'; g.beginPath(); g.moveTo(-330, -120); g.lineTo(-290, -330); g.lineTo(-240, -330); g.lineTo(-170, -120); g.closePath(); g.fill();
      g.fillStyle = '#ff9a3d'; g.beginPath(); g.moveTo(-290, -330); g.lineTo(-240, -330); g.lineTo(-232, -300); g.quadraticCurveTo(-255, -290, -262, -312); g.quadraticCurveTo(-280, -290, -296, -305); g.closePath(); g.fill();
      [[-262, -360, 14], [-246, -392, 11], [-268, -420, 9]].forEach((p) => circ(g, p[0], p[1], p[2], 'rgba(230,220,230,0.75)'));
    } else if (id === 'trueno') { // nubarrón juguetón con lluvita
      g.strokeStyle = 'rgba(150,170,230,0.7)'; g.lineWidth = 3;
      for (let px = -300; px <= 300; px += 26) { if (Math.abs(px) < 120) continue; g.beginPath(); g.moveTo(px, -400); g.lineTo(px - 8, -370); g.stroke(); }
      [[-1, 1], [1, 1]].forEach((s) => {
        [[-60, 0, 34], [-20, -22, 42], [30, -12, 38], [66, 6, 28], [0, 10, 34]].forEach((p) => circ(g, s[0] * 230 + p[0], -440 + p[1], p[2], '#8f88ad'));
        [[-24, -30, 26], [24, -22, 22]].forEach((p) => circ(g, s[0] * 230 + p[0], -440 + p[1], p[2], '#b3acd0'));
        circ(g, s[0] * 230 - 14, -432, 4, '#3a3360'); circ(g, s[0] * 230 + 14, -432, 4, '#3a3360');
        g.strokeStyle = '#3a3360'; g.lineWidth = 3; g.beginPath(); g.arc(s[0] * 230, -426, 8, 0.3, Math.PI - 0.3); g.stroke();
      });
      rayito(g, -200, -360, 20, '#ffe14d', '#c99a00'); rayito(g, 255, -365, 16, '#ffe14d', '#c99a00');
    } else if (id === 'mar') { // gran concha abanico de nácar
      g.save(); g.translate(0, -110);
      g.fillStyle = '#ffe3ec'; g.beginPath(); g.moveTo(0, 30);
      for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; g.lineTo(Math.cos(a) * 320, Math.sin(a) * 330); if (i < 12) { const am = a + Math.PI / 24; g.quadraticCurveTo(Math.cos(am) * 350, Math.sin(am) * 360, Math.cos(a + Math.PI / 12) * 320, Math.sin(a + Math.PI / 12) * 330); } }
      g.closePath(); g.fill(); g.strokeStyle = '#f4a9c4'; g.lineWidth = 4; g.stroke();
      g.strokeStyle = 'rgba(244,169,196,0.8)'; g.lineWidth = 5;
      for (let i = 1; i < 12; i++) { const a = Math.PI + (i / 12) * Math.PI; g.beginPath(); g.moveTo(0, 20); g.lineTo(Math.cos(a) * 310, Math.sin(a) * 320); g.stroke(); }
      g.restore();
    } else if (id === 'arena') { // solazo sonriente
      g.strokeStyle = '#ffb02e'; g.lineWidth = 7;
      for (let i = 0; i < 12; i++) { const a = (i / 12) * U.TAU; g.beginPath(); g.moveTo(-220 + Math.cos(a) * 64, -450 + Math.sin(a) * 64); g.lineTo(-220 + Math.cos(a) * 84, -450 + Math.sin(a) * 84); g.stroke(); }
      circ(g, -220, -450, 54, '#ffd23f', '#f2a200', 3);
      circ(g, -238, -458, 5, '#a8572f'); circ(g, -202, -458, 5, '#a8572f');
      g.strokeStyle = '#a8572f'; g.lineWidth = 3.5; g.beginPath(); g.arc(-220, -446, 16, 0.3, Math.PI - 0.3); g.stroke();
      elip(g, -252, -440, 8, 5, 'rgba(255,120,90,0.5)'); elip(g, -188, -440, 8, 5, 'rgba(255,120,90,0.5)');
    } else if (id === 'huerto') { // frutales detrás y un barrilete de colores
      [[-292, -1], [292, 1]].forEach((p) => {
        tronco2(g, p[0], -30, 120);
        copa(g, [[p[0] - 30, -168, 34], [p[0] + 30, -172, 34], [p[0], -206, 40], [p[0], -160, 34]], '#3fb357', '#74d86b', '#2a8f4b');
        [[-26, -160], [22, -150], [0, -200], [30, -190], [-20, -214]].forEach((q) => { circ(g, p[0] + q[0], q[1], 7, p[1] < 0 ? '#ff4d5e' : '#ffb02e'); circ(g, p[0] + q[0] - 2, q[1] - 2, 2.2, '#fff0d0'); });
      });
      // barrilete (cometa) con su colita
      const kx = -215, ky = -470;
      g.strokeStyle = 'rgba(90,60,40,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(kx, ky + 34); g.quadraticCurveTo(kx - 30, ky + 160, kx - 70, ky + 260); g.stroke();
      [['#ff5d8f', 0, -1], ['#ffd23f', 1, 0], ['#7fc8ff', 0, 1], ['#7fd36b', -1, 0]].forEach((c, i) => {
        const pts = [[0, -34], [26, 0], [0, 34], [-26, 0]];
        g.fillStyle = c[0]; g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + pts[i][0], ky + pts[i][1]); g.lineTo(kx + pts[(i + 1) % 4][0], ky + pts[(i + 1) % 4][1]); g.closePath(); g.fill();
      });
      g.strokeStyle = TINTA; g.lineWidth = 2; g.beginPath(); g.moveTo(kx, ky - 34); g.lineTo(kx + 26, ky); g.lineTo(kx, ky + 34); g.lineTo(kx - 26, ky); g.closePath(); g.stroke();
      g.strokeStyle = '#ff8fb5'; g.lineWidth = 2; g.beginPath(); g.moveTo(kx, ky + 34);
      for (let k = 1; k <= 5; k++) g.lineTo(kx + (k % 2 ? 9 : -9), ky + 34 + k * 14); g.stroke();
      [[9, 48], [-9, 62], [9, 76]].forEach((q, i) => { g.fillStyle = ['#ffd23f', '#7fc8ff', '#ff5d8f'][i]; g.beginPath(); g.moveTo(kx + q[0] - 6, ky + q[1] - 4); g.lineTo(kx + q[0] + 6, ky + q[1] + 4); g.lineTo(kx + q[0] + 6, ky + q[1] - 4); g.lineTo(kx + q[0] - 6, ky + q[1] + 4); g.closePath(); g.fill(); });
    }
  }
  function tronco2(g, x, y, alto) { // tronco suelto (para árboles dibujados dentro de otros sprites)
    g.fillStyle = '#8b5230'; redondo(g, x - 10, y - alto, 20, alto + 2, 6); g.fill();
    g.fillStyle = '#b3723f'; redondo(g, x - 10, y - alto, 12, alto + 2, 5); g.fill();
  }

  // Piezas de la huerta (se usan en la base del Huerto)
  function zanahoria(g, x, y, fuera) { // asoma de la tierra; fuera = cuánto se ve
    g.strokeStyle = '#2f9a4a'; g.lineWidth = 3;
    [[-7, -22], [0, -27], [7, -21]].forEach((q) => { g.beginPath(); g.moveTo(x, y - fuera + 2); g.quadraticCurveTo(x + q[0] * 0.4, y - fuera + q[1] * 0.5, x + q[0], y - fuera + q[1]); g.stroke(); });
    g.fillStyle = '#4cc45f'; [[-7, -22], [0, -27], [7, -21]].forEach((q) => { g.beginPath(); g.ellipse(x + q[0], y - fuera + q[1], 4, 6, q[0] * 0.08, 0, U.TAU); g.fill(); });
    g.fillStyle = '#ff8a3d'; g.beginPath(); g.moveTo(x - 7, y - fuera + 2); g.quadraticCurveTo(x, y - fuera - 2, x + 7, y - fuera + 2); g.lineTo(x + 4, y); g.lineTo(x - 4, y); g.closePath(); g.fill();
    g.strokeStyle = '#d9661f'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 4, y - fuera + 6); g.lineTo(x, y - fuera + 6); g.stroke();
  }
  function lechuga(g, x, y, r) {
    circ(g, x, y - r * 0.6, r, '#3fae4a');
    [[-0.6, -0.5], [0.6, -0.5], [0, -0.95]].forEach((q) => circ(g, x + q[0] * r, y - r * 0.6 + q[1] * r * 0.5, r * 0.62, '#74d86b'));
    circ(g, x, y - r * 0.8, r * 0.45, '#b6f08a');
    g.strokeStyle = 'rgba(40,120,50,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y - r * 0.3); g.lineTo(x - r * 0.4, y - r); g.moveTo(x, y - r * 0.3); g.lineTo(x + r * 0.4, y - r); g.stroke();
  }
  function girasol(g, x, y, alto, R) {
    g.strokeStyle = '#3a9a3f'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - alto * 0.5, x, y - alto); g.stroke();
    g.fillStyle = '#4cc45f'; [[-1, 0.35], [1, 0.55]].forEach((q) => { g.beginPath(); g.ellipse(x + q[0] * 12, y - alto * q[1], 12, 6, q[0] * -0.5, 0, U.TAU); g.fill(); });
    g.fillStyle = '#ffd23f';
    for (let k = 0; k < 12; k++) { const a = k * U.TAU / 12; g.beginPath(); g.ellipse(x + Math.cos(a) * R * 0.95, y - alto + Math.sin(a) * R * 0.95, R * 0.5, R * 0.24, a, 0, U.TAU); g.fill(); }
    circ(g, x, y - alto, R * 0.62, '#8a5226', TINTA, 1.5);
    g.fillStyle = '#5e3414'; for (let k = 0; k < 6; k++) circ(g, x + Math.cos(k) * R * 0.32, y - alto + Math.sin(k) * R * 0.32, 1.6, '#5e3414');
    circ(g, x - R * 0.22, y - alto - R * 0.05, 1.8, '#2a1810'); circ(g, x + R * 0.22, y - alto - R * 0.05, 1.8, '#2a1810');
    g.strokeStyle = '#2a1810'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y - alto + R * 0.08, R * 0.22, 0.3, Math.PI - 0.3); g.stroke();
  }
  function regadera(g, x, y) {
    g.fillStyle = '#5fb7e8'; g.strokeStyle = '#2f6f9a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x + 14, y - 14); g.lineTo(x + 34, y - 30); g.lineTo(x + 37, y - 26); g.lineTo(x + 16, y - 8); g.closePath(); g.fill(); g.stroke();
    elip(g, x + 37, y - 29, 4, 6, '#8fd3ff', '#2f6f9a', 1.5);
    redondo(g, x - 16, y - 26, 32, 26, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(x - 2, y - 26, 12, Math.PI, 0); g.lineWidth = 4; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.45)'; redondo(g, x - 12, y - 22, 6, 16, 3); g.fill();
    circ(g, x + 2, y - 13, 5, '#ffd23f'); circ(g, x + 2, y - 13, 2, '#ff8a3d');
  }

  // Lo que va DELANTE, al pie de los castillos nuevos
  function baseCastillo(g, id) {
    if (id === 'hielo') {
      [[-300, 10, 50], [-200, 12, 36], [-110, 12, 30], [110, 12, 30], [200, 12, 36]].forEach((p) => { elip(g, p[0], p[1], p[2], p[2] * 0.45, '#ffffff'); elip(g, p[0] - p[2] * 0.25, p[1] - p[2] * 0.12, p[2] * 0.5, p[2] * 0.2, '#eef8ff'); });
      // muñeco de nieve
      const sx = 290;
      circ(g, sx, -16, 24, '#ffffff', '#bcd6ee', 2); circ(g, sx, -52, 16, '#ffffff', '#bcd6ee', 2);
      circ(g, sx - 5, -55, 2.5, '#2a2340'); circ(g, sx + 5, -55, 2.5, '#2a2340');
      g.fillStyle = '#ff8a3d'; g.beginPath(); g.moveTo(sx, -51); g.lineTo(sx + 13, -48); g.lineTo(sx, -46); g.closePath(); g.fill();
      g.fillStyle = '#ff5d8f'; g.fillRect(sx - 15, -40, 30, 7); g.fillRect(sx + 6, -38, 7, 16);
      circ(g, sx, -20, 3, '#5b93c4'); circ(g, sx, -8, 3, '#5b93c4');
      [[-270, 4, 20], [-250, 6, 12]].forEach((p) => { // cristales de hielo
        g.fillStyle = 'rgba(170,225,255,0.9)'; g.beginPath(); g.moveTo(p[0], p[1] - p[2] * 2); g.lineTo(p[0] + p[2] * 0.55, p[1] - p[2] * 0.5); g.lineTo(p[0] + p[2] * 0.35, p[1]); g.lineTo(p[0] - p[2] * 0.35, p[1]); g.lineTo(p[0] - p[2] * 0.55, p[1] - p[2] * 0.5); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.moveTo(p[0], p[1] - p[2] * 2); g.lineTo(p[0] - p[2] * 0.55, p[1] - p[2] * 0.5); g.lineTo(p[0] - p[2] * 0.35, p[1]); g.closePath(); g.fill();
      });
    } else if (id === 'luna') {
      [[-290, 8, 30], [-120, 10, 20], [120, 10, 20], [292, 8, 28]].forEach((p) => {
        elip(g, p[0], p[1], p[2], p[2] * 0.6, '#b3acec', '#6a62c8', 2);
        elip(g, p[0] - p[2] * 0.3, p[1] - p[2] * 0.1, p[2] * 0.25, p[2] * 0.14, '#8f86d6'); elip(g, p[0] + p[2] * 0.35, p[1] + p[2] * 0.12, p[2] * 0.18, p[2] * 0.1, '#8f86d6');
      });
      [[-250, 6], [-180, 8], [180, 8], [250, 6]].forEach((p, i) => {
        g.strokeStyle = '#6a62c8'; g.lineWidth = 3; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] - 36 - i % 2 * 8); g.stroke();
        circ(g, p[0], p[1] - 44 - i % 2 * 8, 12, 'rgba(255,240,160,0.35)');
        g.fillStyle = '#ffe066'; estrella(g, p[0], p[1] - 44 - i % 2 * 8, 9, 5, 0.45); g.fill();
      });
    } else if (id === 'fuego') {
      [[-292, 8, 30], [-118, 10, 20], [118, 10, 20], [292, 8, 28]].forEach((p) => {
        elip(g, p[0] + p[2] * 0.6, p[1] + 4, p[2] * 0.8, p[2] * 0.28, 'rgba(255,176,46,0.6)');
        elip(g, p[0], p[1] - p[2] * 0.3, p[2], p[2] * 0.7, '#5a3a38', '#3f2827', 2);
        elip(g, p[0] - p[2] * 0.3, p[1] - p[2] * 0.6, p[2] * 0.35, p[2] * 0.2, '#7a5450');
        g.strokeStyle = '#ffb02e'; g.lineWidth = 3; g.beginPath(); g.moveTo(p[0] - p[2] * 0.5, p[1] - p[2] * 0.2); g.lineTo(p[0], p[1] - p[2] * 0.5); g.lineTo(p[0] + p[2] * 0.2, p[1] - p[2] * 0.1); g.lineTo(p[0] + p[2] * 0.6, p[1] - p[2] * 0.4); g.stroke();
      });
    } else if (id === 'trueno') {
      [[-292, 0, 1], [-122, 4, 0.7], [124, 4, 0.7], [292, 0, 1]].forEach((p) => {
        const s = p[2];
        [[-22, 0, 18], [0, -10, 22], [22, 0, 18], [0, 6, 18]].forEach((q) => circ(g, p[0] + q[0] * s, p[1] + q[1] * s, q[2] * s, '#9a93b8'));
        circ(g, p[0] - 6 * s, p[1] - 14 * s, 10 * s, '#c2bcd8');
        if (s === 1) { circ(g, p[0] - 7, p[1] - 4, 3, '#3a3360'); circ(g, p[0] + 7, p[1] - 4, 3, '#3a3360'); elip(g, p[0] - 15, p[1] + 2, 4, 2.5, 'rgba(255,140,170,0.7)'); elip(g, p[0] + 15, p[1] + 2, 4, 2.5, 'rgba(255,140,170,0.7)'); }
        else rayito(g, p[0], p[1] - 32, 8, '#ffe14d', '#c99a00');
      });
    } else if (id === 'mar') {
      [[-310, 0], [-292, 4], [292, 4], [312, 0]].forEach((p, i) => { // algas
        g.strokeStyle = i % 2 ? '#3fb357' : '#2a9a7a'; g.lineWidth = 7; g.beginPath(); g.moveTo(p[0], p[1]);
        for (let k = 1; k <= 4; k++) g.lineTo(p[0] + (k % 2 ? 8 : -8), p[1] - k * 18); g.stroke();
      });
      [[-120, 8, '#ffb3c8'], [124, 8, '#fff1dc'], [-210, 10, '#ffd0a8']].forEach((p) => { // conchas abanico
        g.fillStyle = p[2]; g.beginPath(); g.moveTo(p[0], p[1] + 4); g.arc(p[0], p[1] - 4, 16, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(200,110,140,0.6)'; g.lineWidth = 2;
        for (let k = 0; k < 5; k++) { const a = Math.PI * (1.15 + k * 0.175); g.beginPath(); g.moveTo(p[0], p[1] + 2); g.lineTo(p[0] + Math.cos(a) * 15, p[1] - 4 + Math.sin(a) * 15); g.stroke(); }
      });
      g.fillStyle = '#ff9a5a'; estrella(g, 210, 4, 16, 5, 0.45); g.fill(); circ(g, 205, 0, 2, '#fff'); circ(g, 214, 0, 2, '#fff');
      [[-250, -30, 6], [-262, -52, 4], [258, -60, 5], [250, -84, 3.5]].forEach((p) => circ(g, p[0], p[1], p[2], 'rgba(255,255,255,0.3)', '#ffffff', 2));
    } else if (id === 'arena') {
      [[-290, 14, 80, 30], [-150, 14, 46, 16], [160, 14, 52, 18], [296, 14, 76, 28]].forEach((p) => { elip(g, p[0], p[1], p[2], p[3], '#f3cf8a'); elip(g, p[0] - p[2] * 0.2, p[1] - p[3] * 0.35, p[2] * 0.55, p[3] * 0.35, '#fbe3ae'); });
      [[-282, -10], [288, -8]].forEach((p, j) => { // palmeritas
        const d = j ? -1 : 1;
        g.strokeStyle = '#b37a45'; g.lineWidth = 9; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + d * 14, p[1] - 40, p[0] + d * 6, p[1] - 76); g.stroke();
        const tx = p[0] + d * 6, ty = p[1] - 76;
        [-2.8, -2.1, -1.0, -0.35, 0.4, 2.7].forEach((a, i) => {
          const ex = tx + Math.cos(a) * 36, ey = ty + Math.sin(a) * 18 + 10;
          g.fillStyle = i % 2 ? '#3fb357' : '#2a9a4a'; g.beginPath(); g.moveTo(tx, ty - 2); g.quadraticCurveTo((tx + ex) / 2, Math.min(ty, ey) - 14, ex, ey); g.quadraticCurveTo((tx + ex) / 2, Math.min(ty, ey) - 2, tx, ty + 4); g.fill();
        });
        circ(g, tx - 4, ty + 5, 5, '#8a5a2e'); circ(g, tx + 5, ty + 6, 5, '#7a4a24');
      });
      // cactus redondito
      g.fillStyle = '#6fbf5a'; redondo(g, -128, -34, 18, 40, 9); g.fill(); redondo(g, -142, -24, 10, 18, 5); g.fill(); redondo(g, -112, -30, 10, 16, 5); g.fill();
      circ(g, -119, -34, 4, '#ff7fb0');
    } else if (id === 'huerto') { // la huerta: canteros, zanahorias, lechugas, girasoles y regadera
      girasol(g, -318, 4, 124, 15); girasol(g, 316, 6, 108, 14);
      [[-1, -292], [1, 112]].forEach((c) => {
        const x0 = c[1], cw = 180;
        g.fillStyle = '#7a4a2a'; redondo(g, x0, -20, cw, 16, 6); g.fill();
        elip(g, x0 + cw * 0.3, -14, 22, 3, 'rgba(255,255,255,0.12)');
        if (c[0] < 0) {
          for (let k = 0; k < 6; k++) zanahoria(g, x0 + 18 + k * 29, -10, k === 2 ? 22 : 7);
          // palita clavada
          g.strokeStyle = '#a8683a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + cw - 8, -14); g.lineTo(x0 + cw + 4, -52); g.stroke();
          g.fillStyle = '#b9c2d6'; g.beginPath(); g.moveTo(x0 + cw - 14, -12); g.lineTo(x0 + cw - 2, -10); g.lineTo(x0 + cw - 5, 2); g.closePath(); g.fill();
        } else {
          for (let k = 0; k < 5; k++) lechuga(g, x0 + 20 + k * 35, -8, 13 - (k % 2) * 2);
          circ(g, x0 + 38, -16, 4.5, '#ff4d5e'); circ(g, x0 + 108, -14, 4.5, '#ff4d5e');
        }
        g.fillStyle = '#d99a58'; g.strokeStyle = '#8a5a2e'; g.lineWidth = 2;
        redondo(g, x0 - 5, -8, cw + 10, 22, 5); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(138,90,46,0.5)'; g.beginPath(); g.moveTo(x0, 3); g.lineTo(x0 + cw, 3); g.stroke();
        [x0 + 2, x0 + cw - 2].forEach((px) => circ(g, px, -2, 2.2, '#8a5a2e'));
      });
      girasol(g, -84, 10, 66, 10); girasol(g, 84, 12, 58, 9);
      regadera(g, 232, 40);
      // florcitas del cantero y mariquita
      [[-232, 34, '#ff5d8f'], [-150, 38, '#c38bff'], [160, 36, '#ffffff']].forEach((p) => { [0, 1, 2, 3, 4].forEach((k) => circ(g, p[0] + Math.cos(k * 1.2566) * 4, p[1] + Math.sin(k * 1.2566) * 4, 3, p[2])); circ(g, p[0], p[1], 2.4, '#ffd23f'); });
      circ(g, -205, -2, 4, '#ff4d5e'); circ(g, -205, -2, 1.2, '#2a1810'); g.strokeStyle = '#2a1810'; g.lineWidth = 1; g.beginPath(); g.moveTo(-205, -6); g.lineTo(-205, 2); g.stroke();
    }
  }
  function construirCastillo(id) {
    const T = TEMA[id], banderas = [], ventanas = [];
    const ventana = (g, x, y, w, h) => {
      if (T.estilo === 'escuela') { // ventana redonda con macetero de flores
        const r = (w + h) / 4, mw = r * 2 + 10;
        circ(g, x, y, r + 4, T.detalle, T.borde, 2); circ(g, x, y, r, '#3b3f7a');
        g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke();
        ['#ff5d8f', '#ffd23f', '#ffffff', '#c38bff'].forEach((c, i) => { const fx = x - mw * 0.36 + i * mw * 0.24; elip(g, fx - 3, y + r + 2, 4, 2.4, '#4cc45f'); circ(g, fx, y + r - 1, 3.6, c); circ(g, fx, y + r - 1, 1.4, '#ff8a3d'); });
        g.fillStyle = '#c97a3f'; redondo(g, x - mw / 2, y + r + 2, mw, 8, 3); g.fill(); g.strokeStyle = T.borde; g.lineWidth = 1.5; g.stroke();
        ventanas.push({ x, y, w, h, r });
        return;
      }
      g.fillStyle = T.detalle; g.beginPath(); g.moveTo(x - w / 2 - 3, y + h / 2 + 3); g.lineTo(x - w / 2 - 3, y - h / 4); g.arc(x, y - h / 4, w / 2 + 3, Math.PI, 0); g.lineTo(x + w / 2 + 3, y + h / 2 + 3); g.closePath(); g.fill();
      g.fillStyle = '#3b3f7a'; g.beginPath(); g.moveTo(x - w / 2, y + h / 2); g.lineTo(x - w / 2, y - h / 4); g.arc(x, y - h / 4, w / 2, Math.PI, 0); g.lineTo(x + w / 2, y + h / 2); g.closePath(); g.fill();
      ventanas.push({ x, y, w, h });
    };
    const cuerpo = (g, x, y, w, h) => {
      const gr = g.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, T.luz); gr.addColorStop(0.5, T.muro); gr.addColorStop(1, T.sombra);
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      texturaMuro(g, T, id, x, y, w, h);
      g.strokeStyle = T.borde; g.lineWidth = 3; g.strokeRect(x, y, w, h);
    };
    const almenas = (g, x, y, w) => {
      g.fillStyle = T.muro; g.strokeStyle = T.borde; g.lineWidth = 2.5;
      const n = Math.max(3, Math.round(w / 22) | 1), mw = w / n;
      for (let i = 0; i < n; i += 2) { g.fillRect(x + i * mw, y - 13, mw, 14); g.strokeRect(x + i * mw, y - 13, mw, 14); }
      g.fillStyle = T.luz; g.fillRect(x - 3, y, w + 6, 12); g.strokeRect(x - 3, y, w + 6, 12);
    };
    const torre = (g, x, w, h, conVentana) => {
      cuerpo(g, x - w / 2, -h, w, h);
      if (T.estilo === 'cono' || T.estilo === 'cupula' || CON_ALMENAS[T.estilo]) almenas(g, x - w / 2 - 6, -h - 10, w + 12);
      const punta = techo(g, T, x, w, -h - (T.estilo === 'copa' || SIN_HUECO[T.estilo] ? 0 : 10));
      banderas.push({ x, y: punta });
      if (conVentana !== false) ventana(g, x, -h * 0.66, w * 0.28, w * 0.44);
    };
    const spr = sprite(660, 640, 330, 590, (g) => {
      if (id === 'nubes') { // arcoíris detrás
        ['#ff7aa8', '#ffb86b', '#ffe873', '#8fe39a', '#7fc8ff', '#b79aff'].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 15; g.beginPath(); g.arc(0, -60, 318 - i * 14, Math.PI, 0); g.stroke(); });
      }
      fondoCastillo(g, id);
      torre(g, -150, 84, 232); torre(g, 150, 84, 232);
      torre(g, 0, 158, 300);
      const escuela = T.estilo === 'escuela';
      if (!escuela) { ventana(g, -38, -120 - 100, 26, 40); ventana(g, 38, -120 - 100, 26, 40); }
      // muro frontal
      cuerpo(g, -232, -112, 464, 112);
      if (escuela) { // alero de tejas en lugar de almenas
        g.fillStyle = T.techo; redondo(g, -244, -126, 488, 18, 5); g.fill();
        g.save(); redondo(g, -244, -126, 488, 18, 5); g.clip(); filasDeTejas(g, -250, 250, -106, -126); g.restore();
        g.strokeStyle = T.borde; g.lineWidth = 2.5; redondo(g, -244, -126, 488, 18, 5); g.stroke();
      } else almenas(g, -232, -122, 464);
      [-150, -92, 92, 150].forEach((x) => ventana(g, x, -62, 24, 38));
      torre(g, -232, 78, 182); torre(g, 232, 78, 182);
      // puerta
      g.fillStyle = T.detalle; g.beginPath(); g.moveTo(-48, 0); g.lineTo(-48, -52); g.arc(0, -52, 48, Math.PI, 0); g.lineTo(48, 0); g.closePath(); g.fill();
      g.fillStyle = T.puerta; g.beginPath(); g.moveTo(-39, 0); g.lineTo(-39, -52); g.arc(0, -52, 39, Math.PI, 0); g.lineTo(39, 0); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2.5;
      [-20, 0, 20].forEach((x) => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, -84 + Math.abs(x) * 0.35); g.stroke(); });
      circ(g, -8, -38, 4.5, '#ffd23f'); circ(g, 8, -38, 4.5, '#ffd23f');
      if (escuela) { // banderines de colores, alero sobre la puerta y cartel del jardín
        [[-268, -88], [88, 268]].forEach((tr) => {
          const ya = -108, sag = 14, L = tr[1] - tr[0];
          g.strokeStyle = '#8a5a2e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(tr[0], ya); g.quadraticCurveTo((tr[0] + tr[1]) / 2, ya + sag * 2, tr[1], ya); g.stroke();
          const n = Math.floor(L / 20);
          for (let k = 0; k < n; k++) {
            const u = (k + 0.5) / n, px = tr[0] + L * u, py = ya + sag * 4 * u * (1 - u);
            g.fillStyle = ['#ff5d8f', '#ffd23f', '#7fc8ff', '#7fd36b', '#c38bff'][k % 5];
            g.beginPath(); g.moveTo(px - 7, py); g.lineTo(px + 7, py); g.lineTo(px, py + 13); g.closePath(); g.fill();
          }
        });
        g.fillStyle = '#e9b97c'; g.strokeStyle = '#8a5a2e'; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(-84, -126); g.lineTo(-76, -152); g.lineTo(76, -152); g.lineTo(84, -126); g.closePath();
        redondo(g, -84, -154, 168, 30, 9); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(138,90,46,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-78, -139); g.lineTo(78, -139); g.stroke();
        g.fillStyle = '#7a3f1a'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '900 16px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';
        const tw = g.measureText('Jardín El Huerto').width, ks = Math.min(1, 140 / Math.max(1, tw));
        g.save(); g.translate(0, -138); g.scale(ks, 1); g.fillText('Jardín El Huerto', 0, 0); g.restore();
        [-76, 76].forEach((fx) => { [0, 1, 2, 3, 4].forEach((k) => circ(g, fx + Math.cos(k * 1.2566) * 4.5, -154 + Math.sin(k * 1.2566) * 4.5, 3.4, fx < 0 ? '#ff8fb5' : '#8fd3ff')); circ(g, fx, -154, 2.8, '#ffd23f'); });
      } else emblema(g, id, 0, -150 + 26, 15); // emblema sobre la puerta
      // base temática
      if (id === 'nubes') { g.fillStyle = '#ffffff'; for (let x = -300; x <= 300; x += 46) { if (Math.abs(x) < 60) continue; g.beginPath(); g.arc(x, 4, 30 + ((x * 7) % 11), 0, U.TAU); g.fill(); } }
      if (id === 'bosque') [[-290, 8], [-120, 10], [130, 10], [292, 8]].forEach((p) => copa(g, [[p[0] - 16, p[1] - 14, 14], [p[0] + 16, p[1] - 14, 14], [p[0], p[1] - 22, 18]], '#34b257', '#6fdc6c', '#218c47'));
      if (id === 'cristal') [[-286, 6, 26], [-262, 8, 16], [284, 6, 28], [258, 8, 15], [-110, 8, 14], [112, 8, 14]].forEach((p) => {
        g.fillStyle = '#8fd8ff'; g.beginPath(); g.moveTo(p[0], p[1] - p[2] * 2); g.lineTo(p[0] + p[2] * 0.6, p[1] - p[2] * 0.6); g.lineTo(p[0] + p[2] * 0.4, p[1]); g.lineTo(p[0] - p[2] * 0.4, p[1]); g.lineTo(p[0] - p[2] * 0.6, p[1] - p[2] * 0.6); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(p[0], p[1] - p[2] * 2); g.lineTo(p[0] - p[2] * 0.6, p[1] - p[2] * 0.6); g.lineTo(p[0] - p[2] * 0.4, p[1]); g.closePath(); g.fill();
      });
      if (id === 'real') [[-120, 6], [120, 6]].forEach((p) => { copa(g, [[p[0], p[1] - 16, 17]], '#34b257', '#6fdc6c', '#218c47'); circ(g, p[0] - 6, p[1] - 20, 4, '#ff5d8f'); circ(g, p[0] + 7, p[1] - 12, 4, '#fff'); });
      baseCastillo(g, id);
    }, 1.5);
    return { spr, banderas, ventanas, T };
  }

  function emblema(g, id, x, y, s) {
    circ(g, x, y, s * 1.5, '#fff', TEMA[id].borde, 2.5);
    if (id === 'real') { g.fillStyle = '#ff5d8f'; corazon(g, x, y, s * 0.85); g.fill(); }
    else if (id === 'bosque') { g.fillStyle = '#3fb357'; g.beginPath(); g.ellipse(x, y, s * 0.55, s, 0.6, 0, U.TAU); g.fill(); g.strokeStyle = '#23803f'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - s * 0.5, y + s * 0.6); g.lineTo(x + s * 0.5, y - s * 0.6); g.stroke(); }
    else if (id === 'cristal') { g.fillStyle = '#6fc3ff'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.75, y - s * 0.2); g.lineTo(x, y + s); g.lineTo(x - s * 0.75, y - s * 0.2); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x - s * 0.75, y - s * 0.2); g.lineTo(x, y); g.closePath(); g.fill(); }
    else if (id === 'hielo') { // copo de nieve
      g.strokeStyle = '#4fa8e6'; g.lineWidth = Math.max(1.6, s * 0.2); g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 2, c = Math.cos(a), n = Math.sin(a), bx = x + c * s * 0.6, by = y + n * s * 0.6;
        g.moveTo(x, y); g.lineTo(x + c * s * 1.05, y + n * s * 1.05);
        g.moveTo(bx, by); g.lineTo(bx + Math.cos(a - 0.8) * s * 0.35, by + Math.sin(a - 0.8) * s * 0.35);
        g.moveTo(bx, by); g.lineTo(bx + Math.cos(a + 0.8) * s * 0.35, by + Math.sin(a + 0.8) * s * 0.35);
      }
      g.stroke(); circ(g, x, y, s * 0.18, '#4fa8e6');
    }
    else if (id === 'luna') { // media luna con estrella sobre cielo de noche
      circ(g, x, y, s * 1.25, '#34408f');
      lunita(g, x - s * 0.2, y, s * 0.85, '#ffd23f');
      g.fillStyle = '#fff3b0'; estrella(g, x + s * 0.42, y - s * 0.1, s * 0.42, 5, 0.45); g.fill();
    }
    else if (id === 'fuego') { // llamita
      g.fillStyle = '#ff6a3d'; g.beginPath(); g.moveTo(x, y - s * 1.1); g.bezierCurveTo(x + s * 0.4, y - s * 0.5, x + s * 0.95, y - s * 0.1, x + s * 0.75, y + s * 0.45);
      g.bezierCurveTo(x + s * 0.6, y + s * 0.95, x - s * 0.6, y + s * 0.95, x - s * 0.75, y + s * 0.45); g.bezierCurveTo(x - s * 0.9, y - s * 0.05, x - s * 0.3, y - s * 0.3, x, y - s * 1.1); g.closePath(); g.fill();
      g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(x, y - s * 0.3); g.bezierCurveTo(x + s * 0.25, y, x + s * 0.5, y + s * 0.25, x + s * 0.38, y + s * 0.5);
      g.bezierCurveTo(x + s * 0.25, y + s * 0.78, x - s * 0.25, y + s * 0.78, x - s * 0.38, y + s * 0.5); g.bezierCurveTo(x - s * 0.48, y + s * 0.2, x - s * 0.2, y, x, y - s * 0.3); g.closePath(); g.fill();
    }
    else if (id === 'trueno') rayito(g, x, y, s * 1.05, '#ffd23f', '#c98a00');
    else if (id === 'mar') { // concha abanico turquesa
      g.fillStyle = '#2fb8b8'; g.beginPath(); g.moveTo(x, y + s * 0.85); g.arc(x, y - s * 0.05, s * 0.95, Math.PI * 1.08, Math.PI * 1.92); g.closePath(); g.fill();
      g.strokeStyle = '#c8f6f2'; g.lineWidth = Math.max(1.2, s * 0.13); g.beginPath();
      for (let k = 0; k < 4; k++) { const a = Math.PI * (1.25 + k * 0.167); g.moveTo(x, y + s * 0.7); g.lineTo(x + Math.cos(a) * s * 0.85, y - s * 0.05 + Math.sin(a) * s * 0.85); }
      g.stroke(); elip(g, x, y + s * 0.8, s * 0.32, s * 0.16, '#2fb8b8');
    }
    else if (id === 'arena') { // sol sobre la duna
      g.save(); g.beginPath(); g.arc(x, y, s * 1.38, 0, U.TAU); g.clip();
      circ(g, x, y - s * 0.2, s * 0.55, '#ffb02e');
      g.strokeStyle = '#ffb02e'; g.lineWidth = Math.max(1.2, s * 0.14); g.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; g.moveTo(x + Math.cos(a) * s * 0.72, y - s * 0.2 + Math.sin(a) * s * 0.72); g.lineTo(x + Math.cos(a) * s * 0.98, y - s * 0.2 + Math.sin(a) * s * 0.98); }
      g.stroke();
      elip(g, x + s * 0.5, y + s * 1.05, s * 1.3, s * 0.68, '#e8a84a'); elip(g, x - s * 0.7, y + s * 1.15, s * 1.1, s * 0.62, '#f3cf8a');
      g.restore();
    }
    else if (id === 'huerto') { // zanahoria con hojitas
      g.save(); g.translate(x + s * 0.08, y + s * 0.05); g.rotate(-0.6);
      g.fillStyle = '#3fb357';
      [[-0.32, -0.25], [0, 0], [0.32, 0.25]].forEach((q) => { g.save(); g.translate(0, -s * 0.5); g.rotate(q[1]); g.beginPath(); g.ellipse(q[0] * s * 0.6, -s * 0.38, s * 0.17, s * 0.4, q[1], 0, U.TAU); g.fill(); g.restore(); });
      g.fillStyle = '#ff8a3d'; g.beginPath(); g.moveTo(-s * 0.42, -s * 0.42); g.quadraticCurveTo(0, -s * 0.66, s * 0.42, -s * 0.42);
      g.quadraticCurveTo(s * 0.22, s * 0.45, 0, s * 1.02); g.quadraticCurveTo(-s * 0.22, s * 0.45, -s * 0.42, -s * 0.42); g.closePath(); g.fill();
      g.strokeStyle = '#d9661f'; g.lineWidth = Math.max(1, s * 0.11); g.beginPath();
      [[-0.15, -0.1, 0.12], [0.1, 0.25, 0.32], [-0.05, 0.55, 0.12]].forEach((q) => { g.moveTo(q[0] * s - s * 0.12, q[1] * s); g.lineTo(q[2] * s, q[1] * s); }); g.stroke();
      g.restore();
    }
    else { g.fillStyle = '#8fd3ff'; [[-s * 0.5, s * 0.2, s * 0.5], [s * 0.45, s * 0.25, s * 0.45], [0, -s * 0.2, s * 0.6]].forEach((p) => { g.beginPath(); g.arc(x + p[0], y + p[1], p[2], 0, U.TAU); g.fill(); }); }
  }
  D.emblema = emblema;

  D.dibCastillo = function (ctx, c, t, noche) {
    const k = D.castillo[c.id];
    D.sombra(ctx, c.x, c.y + 4, 290, 0.2);
    D.pon(ctx, k.spr, c.x, c.y);
    // flechas que invitan a entrar por la puerta
    const fk = (t * 1.6) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.95 - fk * 0.6})`; ctx.lineWidth = 6;
    for (let i = 0; i < 2; i++) { const yy = c.y + 52 - i * 18 - fk * 9; ctx.beginPath(); ctx.moveTo(c.x - 16, yy); ctx.lineTo(c.x, yy - 12); ctx.lineTo(c.x + 16, yy); ctx.stroke(); }
    // ventanas iluminadas de noche
    if (noche > 0.02) {
      const br = 0.85 + Math.sin(t * 3 + c.x) * 0.08;
      ctx.fillStyle = `rgba(255,222,120,${noche * br})`;
      for (const v of k.ventanas) {
        if (v.r) { ctx.beginPath(); ctx.arc(c.x + v.x, c.y + v.y, v.r, 0, U.TAU); ctx.fill(); continue; }
        ctx.beginPath(); ctx.moveTo(c.x + v.x - v.w / 2, c.y + v.y + v.h / 2); ctx.lineTo(c.x + v.x - v.w / 2, c.y + v.y - v.h / 4);
        ctx.arc(c.x + v.x, c.y + v.y - v.h / 4, v.w / 2, Math.PI, 0); ctx.lineTo(c.x + v.x + v.w / 2, c.y + v.y + v.h / 2); ctx.closePath(); ctx.fill();
      }
    }
    // banderines ondeando
    for (let i = 0; i < k.banderas.length; i++) {
      const b = k.banderas[i], x = c.x + b.x, y = c.y + b.y;
      ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y - 34); ctx.stroke();
      circ(ctx, x, y - 35, 3.5, '#ffd23f');
      const o1 = Math.sin(t * 5 + i * 1.7) * 4, o2 = Math.sin(t * 5 + i * 1.7 + 1.2) * 6;
      ctx.fillStyle = k.T.bandera;
      ctx.beginPath(); ctx.moveTo(x, y - 33); ctx.quadraticCurveTo(x + 14, y - 34 + o1, x + 30, y - 25 + o2);
      ctx.quadraticCurveTo(x + 14, y - 20 + o1, x, y - 17); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    if (ANIM[c.id]) ANIM[c.id](ctx, c, k, t, noche);
  };
  // Detallitos animados (baratos) de algunos castillos nuevos
  const ANIM = {
    huerto: (ctx, c, k, t) => { // la campana se mece y una mariposa revolotea sobre la huerta
      const cb = campanaHuerto;
      if (cb) {
        const a = Math.sin(t * 2.6) * 0.32, x = c.x + cb.x, y = c.y + cb.y, r = cb.r;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = '#ffc93c'; ctx.strokeStyle = '#b07a00'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-r, r * 1.5); ctx.quadraticCurveTo(-r * 0.9, 0, 0, -r * 0.2); ctx.quadraticCurveTo(r * 0.9, 0, r, r * 1.5); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff0a8'; ctx.fillRect(-r * 0.55, r * 0.3, r * 0.22, r * 0.9);
        circ(ctx, 0, r * 1.65, r * 0.28, '#b07a00');
        ctx.restore();
        const ph = (t * 0.5) % 1; // notita musical de vez en cuando
        if (Math.abs(a) > 0.28 || ph < 0.5) {
          const p = (t * 0.6) % 1, nx = x + 26 + p * 18, ny = y - 4 - p * 30;
          ctx.globalAlpha = 1 - p; ctx.fillStyle = '#ff5d8f'; ctx.strokeStyle = '#ff5d8f'; ctx.lineWidth = 2;
          elip(ctx, nx, ny, 4, 3, '#ff5d8f'); ctx.beginPath(); ctx.moveTo(nx + 3.5, ny); ctx.lineTo(nx + 3.5, ny - 13); ctx.lineTo(nx + 9, ny - 10); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      const bx = c.x - 190 + Math.sin(t * 0.7) * 70, by = c.y - 50 + Math.sin(t * 1.9) * 16, al = Math.abs(Math.sin(t * 14)) * 0.8 + 0.2;
      ctx.fillStyle = '#ff9dcb'; ctx.beginPath(); ctx.ellipse(bx - 5 * al, by - 3, 6 * al, 5, 0, 0, U.TAU); ctx.ellipse(bx + 5 * al, by - 3, 6 * al, 5, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#c38bff'; ctx.beginPath(); ctx.ellipse(bx - 3.5 * al, by + 3, 4 * al, 3, 0, 0, U.TAU); ctx.ellipse(bx + 3.5 * al, by + 3, 4 * al, 3, 0, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = TINTA; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by - 5); ctx.lineTo(bx, by + 5); ctx.stroke();
    },
    fuego: (ctx, c, k, t) => { // humito del volcán por la torre central
      const b = k.banderas[2], x0 = c.x + b.x - 12, y0 = c.y + b.y + 10;
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.32 + i / 3) % 1;
        circ(ctx, x0 - p * 16 + Math.sin(t * 1.4 + i * 2) * 5, y0 - p * 90, 6 + p * 13, `rgba(238,228,238,${(1 - p) * 0.6})`);
      }
    },
    trueno: (ctx, c, k, t) => { // destello del rayo de vez en cuando
      const ph = (t + c.x * 0.001) % 6.5, izq = Math.floor((t + c.x * 0.001) / 6.5) % 2;
      if (ph > 0.4) return;
      const a = 1 - ph / 0.4, x = c.x + (izq ? -205 : 230), y = c.y - 345;
      ctx.globalAlpha = a * 0.35; circ(ctx, x, y, 60, '#fff6b0');
      ctx.globalAlpha = a; rayito(ctx, x, y, 30, '#ffe14d', '#c99a00'); ctx.globalAlpha = 1;
    },
    luna: (ctx, c, k, t, noche) => { // brillo de la luna de noche
      if (noche <= 0.02) return;
      const b = k.banderas[2], br = noche * (0.5 + Math.sin(t * 1.8) * 0.12);
      ctx.globalAlpha = br * 0.5; circ(ctx, c.x + b.x, c.y + b.y + 17, 30, '#fff3b0');
      ctx.globalAlpha = br * 0.3; circ(ctx, c.x + 210, c.y - 445, 88, '#fff6c8');
      ctx.globalAlpha = 1;
    },
    hielo: (ctx, c, k, t) => { // destellitos sobre el hielo
      ctx.fillStyle = '#ffffff';
      [[-150, -330], [150, -300], [0, -470], [-232, -230], [232, -215]].forEach((p, i) => {
        const a = Math.sin(t * 2.4 + i * 1.9); if (a <= 0.2) return;
        ctx.globalAlpha = a; estrella(ctx, c.x + p[0] + 10, c.y + p[1], 4 + a * 5, 4, 0.25); ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
    mar: (ctx, c, k, t) => { // burbujitas que suben
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const p = (t * 0.35 + i / 4) % 1, x = c.x + (i % 2 ? 262 : -258) + Math.sin(t * 2 + i) * 6;
        ctx.globalAlpha = 1 - p; ctx.beginPath(); ctx.arc(x, c.y - 30 - p * 130, 3 + i % 3 * 1.5, 0, U.TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  };

  // ---------- Colinas y plataformas ----------
  const COLINA = {
    pradera: { top: '#6fdc5f', luz: '#9aee7a', borde: '#3fae4a', lado: '#f0a860', raya: '#d98846' },
    bosque: { top: '#3fae5a', luz: '#5fca72', borde: '#23803f', lado: '#b9814f', raya: '#96623a' },
    cristal: { top: '#e9f9ff', luz: '#ffffff', borde: '#9ad0f0', lado: '#b9a4ff', raya: '#9a84ec' },
    nubes: { top: '#ffffff', luz: '#ffffff', borde: '#f0c6e6', lado: '#ffc1e3', raya: '#f59ccd' },
    flores: { top: '#7fe06a', luz: '#ffd6ea', borde: '#3fae4a', lado: '#f0a860', raya: '#d98846' },
    nieve: { top: '#f4faff', luz: '#ffffff', borde: '#bcd6ee', lado: '#a9c3e6', raya: '#8fa9d6' },
    desierto: { top: '#f7d58f', luz: '#ffe9b8', borde: '#d9a95a', lado: '#e8b46a', raya: '#c98f45', extra: 'duna' },
    volcan: { top: '#6b4a48', luz: '#86605b', borde: '#4a302f', lado: '#5a3a38', raya: '#3f2827', veta: '#ff8a3d', extra: 'brasa' },
    luna: { top: '#c9c2f0', luz: '#e2dcff', borde: '#8f86d6', lado: '#7d74c8', raya: '#5e56a8', extra: 'crater' },
    mar: { top: '#fbeccb', luz: '#fff7e6', borde: '#e6cf9a', lado: '#f2d9a6', raya: '#dcbf86', extra: 'concha' },
    tormenta: { top: '#8fae8c', luz: '#a9c4a4', borde: '#5f7d66', lado: '#9a93ad', raya: '#7a7392' }
  };
  D.dibColina = function (ctx, c) {
    const P = COLINA[c.zona] || COLINA.pradera, yb = c.y - c.base, yt = c.y - c.cima;
    if (c.base === 0) { ctx.fillStyle = 'rgba(20,40,60,0.2)'; ctx.beginPath(); ctx.ellipse(c.x, yb + 9, c.rx + 8, c.ry + 4, 0, 0, U.TAU); ctx.fill(); }
    const lado = () => { ctx.beginPath(); ctx.moveTo(c.x + c.rx, yt); ctx.lineTo(c.x + c.rx, yb); ctx.ellipse(c.x, yb, c.rx, c.ry, 0, 0, Math.PI); ctx.lineTo(c.x - c.rx, yt); ctx.closePath(); };
    const gr = ctx.createLinearGradient(c.x - c.rx, 0, c.x + c.rx, 0);
    gr.addColorStop(0, P.raya); gr.addColorStop(0.3, P.lado); gr.addColorStop(0.7, P.lado); gr.addColorStop(1, P.raya);
    lado(); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); lado(); ctx.clip(); ctx.strokeStyle = P.veta || P.raya; ctx.lineWidth = 6; ctx.globalAlpha = 0.55;
    if (P.veta) { // vetas tibias en zigzag (roca volcánica)
      ctx.lineWidth = 4; ctx.globalAlpha = 0.8;
      for (let x = c.x - c.rx + 22; x < c.x + c.rx; x += 46) { ctx.beginPath(); ctx.moveTo(x, yt); for (let y = yt + 12, k = 0; y < yb + c.ry; y += 14, k++) ctx.lineTo(x + (k % 2 ? 7 : -7), y); ctx.stroke(); }
    } else for (let x = c.x - c.rx + 22; x < c.x + c.rx; x += 34) { ctx.beginPath(); ctx.moveTo(x, yt); ctx.lineTo(x, yb + c.ry); ctx.stroke(); }
    ctx.restore();
    // cima de pasto con flequillo
    ctx.fillStyle = P.borde; ctx.beginPath(); ctx.ellipse(c.x, yt + 7, c.rx + 3, c.ry + 3, 0, 0, U.TAU); ctx.fill();
    for (let a = 0.15; a < Math.PI; a += 0.26) circ(ctx, c.x + Math.cos(a) * (c.rx - 2), yt + 6 + Math.sin(a) * (c.ry + 1), 9, P.borde);
    elip(ctx, c.x, yt, c.rx + 3, c.ry + 3, P.top);
    elip(ctx, c.x - c.rx * 0.12, yt - c.ry * 0.14, c.rx * 0.7, c.ry * 0.62, P.luz);
    if (P.extra) COLINA_EXTRA[P.extra](ctx, c, yt);
  };
  const COLINA_EXTRA = {
    duna: (ctx, c, yt) => { // ondas de viento en la cima
      ctx.strokeStyle = 'rgba(201,143,69,0.55)'; ctx.lineWidth = 3;
      for (let k = -1; k <= 1; k++) { const y = yt + k * c.ry * 0.38, w = c.rx * (0.7 - Math.abs(k) * 0.22); ctx.beginPath(); ctx.moveTo(c.x - w, y); ctx.quadraticCurveTo(c.x - w / 2, y - 7, c.x, y); ctx.quadraticCurveTo(c.x + w / 2, y + 7, c.x + w, y); ctx.stroke(); }
    },
    brasa: (ctx, c, yt) => { // grietas brillantes en la cima
      ctx.strokeStyle = 'rgba(255,150,60,0.85)'; ctx.lineWidth = 3.5; ctx.beginPath();
      ctx.moveTo(c.x - c.rx * 0.5, yt + c.ry * 0.1); ctx.lineTo(c.x - c.rx * 0.15, yt - c.ry * 0.2); ctx.lineTo(c.x + c.rx * 0.1, yt + c.ry * 0.15); ctx.lineTo(c.x + c.rx * 0.45, yt - c.ry * 0.1);
      ctx.moveTo(c.x - c.rx * 0.15, yt - c.ry * 0.2); ctx.lineTo(c.x - c.rx * 0.05, yt - c.ry * 0.55); ctx.stroke();
    },
    crater: (ctx, c, yt) => { // cráteres lunares
      [[-0.38, -0.05, 0.17], [0.3, 0.2, 0.13], [0.12, -0.38, 0.1]].forEach((p) => {
        const x = c.x + p[0] * c.rx, y = yt + p[1] * c.ry, r = p[2] * c.rx;
        elip(ctx, x, y, r, r * 0.5, '#9a91dc'); elip(ctx, x + r * 0.1, y + r * 0.08, r * 0.8, r * 0.36, '#b3abea');
      });
    },
    concha: (ctx, c, yt) => { // conchitas sobre la arena
      [[-0.35, 0.1, '#ffb3c8'], [0.32, -0.15, '#ffd0a8']].forEach((p) => {
        const x = c.x + p[0] * c.rx, y = yt + p[1] * c.ry;
        ctx.fillStyle = p[2]; ctx.beginPath(); ctx.moveTo(x, y + 5); ctx.arc(x, y, 9, Math.PI, 0); ctx.closePath(); ctx.fill();
      });
    }
  };
  D.dibPlataforma = function (ctx, p) {
    const w = p.x1 - p.x0, yt0 = p.y0 - p.cima, yt1 = p.y1 - p.cima;
    ctx.fillStyle = 'rgba(20,40,60,0.2)'; ctx.fillRect(p.x0 - 4, p.y1 - 6, w + 8, 16);
    ctx.fillStyle = D.patron.muro; ctx.fillRect(p.x0, yt1, w, p.cima - p.base);
    ctx.strokeStyle = '#a54a2a'; ctx.lineWidth = 3; ctx.strokeRect(p.x0, yt1, w, p.cima - p.base);
    ctx.fillStyle = '#ffe9c7'; ctx.fillRect(p.x0, yt0, w, yt1 - yt0);
    ctx.fillStyle = '#fff6e5'; ctx.fillRect(p.x0 + 8, yt0 + 8, w - 16, yt1 - yt0 - 16);
    ctx.strokeStyle = '#e0a66a'; ctx.lineWidth = 3; ctx.strokeRect(p.x0, yt0, w, yt1 - yt0);
    ctx.fillStyle = '#ffd98a'; estrella(ctx, p.x, (yt0 + yt1) / 2, 14, 4, 0.5); ctx.fill();
  };

  // ---------- Decoración viva ----------
  D.dibArbol = function (ctx, o, t) {
    const s = D.spr['arbol_' + o.variante];
    D.sombra(ctx, o.x, o.y, 34 * o.esc);
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(Math.sin(t * 1.3 + o.fase) * 0.018);
    D.pon(ctx, s, 0, 0, o.esc); ctx.restore();
  };
  D.dibArbusto = function (ctx, o, t, jx, jy) {
    const s = D.spr['arbusto_' + o.zona] || D.spr.arbusto_pradera, e = o.esc;
    D.sombra(ctx, o.x, o.y, 36 * e, 0.18);
    const resp = 1 + Math.sin(t * 2 + o.fase) * 0.025;
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(e, e * resp);
    D.pon(ctx, s, 0, 0);
    // ojitos amigables que siguen a Julieth y parpadean
    const cerrados = (t + o.parpadeo) % 4.2 < 0.14;
    const a = Math.atan2(jy - o.y, jx - o.x), px = Math.cos(a) * 2.4, py = Math.sin(a) * 2;
    for (const ex of [-10, 10]) {
      if (cerrados) { ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ex, -22, 5, 0.2, Math.PI - 0.2); ctx.stroke(); }
      else { elip(ctx, ex, -23, 6, 7.5, '#fff'); circ(ctx, ex + px, -22 + py, 3.3, '#2a2340'); circ(ctx, ex + px - 1, -23.4 + py, 1.2, '#fff'); }
    }
    ctx.strokeStyle = TINTA; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -14, 5, 0.3, Math.PI - 0.3); ctx.stroke();
    elip(ctx, -19, -15, 4.5, 2.8, 'rgba(255,140,170,0.65)'); elip(ctx, 19, -15, 4.5, 2.8, 'rgba(255,140,170,0.65)');
    ctx.restore();
  };
  D.dibRoca = function (ctx, o) { D.sombra(ctx, o.x, o.y, 26 * o.esc, 0.18); D.pon(ctx, D.spr['roca_' + o.variante], o.x, o.y, o.esc); };
  D.dibAntorcha = function (ctx, o, t) {
    D.sombra(ctx, o.x, o.y, 12, 0.2);
    ctx.fillStyle = '#7a4a2a'; redondo(ctx, o.x - 4, o.y - 46, 8, 48, 3); ctx.fill();
    ctx.fillStyle = '#ffc93c'; redondo(ctx, o.x - 9, o.y - 54, 18, 11, 4); ctx.fill();
    const f = Math.sin(t * 11 + o.fase) * 2.5, f2 = Math.sin(t * 17 + o.fase) * 2;
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(o.x - 9, o.y - 54); ctx.quadraticCurveTo(o.x - 12 + f2, o.y - 70, o.x + f, o.y - 84 + f2); ctx.quadraticCurveTo(o.x + 12 + f2, o.y - 70, o.x + 9, o.y - 54); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.moveTo(o.x - 5, o.y - 55); ctx.quadraticCurveTo(o.x - 6, o.y - 64, o.x + f * 0.5, o.y - 73); ctx.quadraticCurveTo(o.x + 6, o.y - 64, o.x + 5, o.y - 55); ctx.closePath(); ctx.fill();
  };

  // ---------- Objetos interactivos ----------
  // Moneda gigante (del tamaño de un melón: 44 de diámetro ≈ media Julieth)
  D.dibMoneda = function (ctx, x, y, t, fase, esc) {
    const R = 22 * (esc || 1), a = t * 3.2 + fase, c = Math.cos(a), w = Math.abs(c), grosor = 7 * (1 - w) + 3;
    const sx = Math.max(w, 0.08) * R, lado = Math.sin(a) > 0 ? 1 : -1;
    // canto grueso
    ctx.fillStyle = K.oroOscuro;
    ctx.beginPath(); ctx.ellipse(x - (lado * grosor) / 2, y, sx, R, 0, 0, U.TAU); ctx.fill();
    ctx.fillRect(x - grosor / 2, y - R, grosor, R * 2);
    // cara
    const gr = ctx.createLinearGradient(x - sx, y - R, x + sx, y + R);
    gr.addColorStop(0, K.oroClaro); gr.addColorStop(0.45, K.oro); gr.addColorStop(1, '#f2a200');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x + (lado * grosor) / 2, y, sx, R, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = '#b86a00'; ctx.lineWidth = 2; ctx.stroke();
    if (w > 0.3) {
      const cx = x + (lado * grosor) / 2;
      ctx.strokeStyle = 'rgba(184,106,0,0.75)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(cx, y, sx * 0.74, R * 0.74, 0, 0, U.TAU); ctx.stroke();
      // corona grabada
      ctx.fillStyle = '#d98500'; ctx.save(); ctx.translate(cx, y + 1); ctx.scale(w * (esc || 1), esc || 1);
      ctx.beginPath(); ctx.moveTo(-10, 7); ctx.lineTo(-11, -6); ctx.lineTo(-5, 0); ctx.lineTo(0, -9); ctx.lineTo(5, 0); ctx.lineTo(11, -6); ctx.lineTo(10, 7); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(cx - sx * 0.35, y - R * 0.45, sx * 0.22, R * 0.14, -0.6, 0, U.TAU); ctx.fill();
    }
    // destello
    const d = (t * 1.3 + fase) % 2.2;
    if (d < 0.5) {
      const s = Math.sin((d / 0.5) * Math.PI) * 9;
      ctx.fillStyle = '#fff'; estrella(ctx, x + R * 0.55, y - R * 0.6, s, 4, 0.22); ctx.fill();
    }
  };

  const COMIDA = {
    manzana: (g) => {
      g.fillStyle = '#e8283c'; g.beginPath(); g.moveTo(0, -11); g.bezierCurveTo(-20, -22, -22, 12, -6, 15); g.quadraticCurveTo(0, 12, 6, 15); g.bezierCurveTo(22, 12, 20, -22, 0, -11); g.fill();
      g.strokeStyle = '#9c1226'; g.lineWidth = 2; g.stroke();
      elip(g, -8, -4, 4, 6, 'rgba(255,255,255,0.55)');
      g.strokeStyle = '#7a4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -11); g.quadraticCurveTo(1, -18, 5, -20); g.stroke();
      g.fillStyle = '#4fc25a'; g.beginPath(); g.ellipse(9, -17, 7, 3.5, -0.5, 0, U.TAU); g.fill();
    },
    fresa: (g) => {
      g.fillStyle = '#ff3d6e'; g.beginPath(); g.moveTo(0, 17); g.bezierCurveTo(-22, 2, -18, -14, 0, -11); g.bezierCurveTo(18, -14, 22, 2, 0, 17); g.fill();
      g.strokeStyle = '#b3123f'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#ffe58a'; [[-7, -3], [6, -4], [0, 4], [-9, 4], [9, 3], [-3, 10], [4, 10]].forEach((p) => { g.beginPath(); g.ellipse(p[0], p[1], 1.4, 2, 0, 0, U.TAU); g.fill(); });
      g.fillStyle = '#4fc25a'; estrella(g, 0, -12, 10, 5, 0.4); g.fill();
    },
    pastel: (g) => {
      g.fillStyle = '#f7c98b'; redondo(g, -17, -4, 34, 20, 5); g.fill(); g.strokeStyle = '#c98a4a'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#ff9dbb'; g.fillRect(-16, 4, 32, 4);
      g.fillStyle = '#fffaf2'; g.beginPath(); g.moveTo(-18, -2); g.quadraticCurveTo(-18, -14, 0, -14); g.quadraticCurveTo(18, -14, 18, -2);
      g.quadraticCurveTo(14, 4, 10, -1); g.quadraticCurveTo(5, 5, 0, -1); g.quadraticCurveTo(-5, 5, -10, -1); g.quadraticCurveTo(-14, 4, -18, -2); g.fill();
      g.strokeStyle = '#e8cfc0'; g.lineWidth = 1.5; g.stroke();
      circ(g, 0, -17, 5.5, '#ff2d55', '#a8122e', 1.5); circ(g, -2, -19, 1.6, '#ffd0d8');
    },
    estrella: (g) => {
      g.fillStyle = '#ffd23f'; estrella(g, 0, 0, 19, 5, 0.52); g.fill(); g.strokeStyle = '#e08a00'; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#fff6b0'; estrella(g, -2, -2, 9, 5, 0.52); g.fill();
      circ(g, -5, 1, 2, TINTA); circ(g, 5, 1, 2, TINTA);
      g.strokeStyle = TINTA; g.lineWidth = 1.8; g.beginPath(); g.arc(0, 4, 4, 0.2, Math.PI - 0.2); g.stroke();
    }
  };
  // Corazón flotante de los castillos: late, brilla y tiene un halo rosado
  D.dibCorazon = function (ctx, x, y, t, fase) {
    const late = 1 + Math.max(0, Math.sin(t * 6 + fase)) * 0.12;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.8 + fase) * 0.12); ctx.scale(late, late);
    ctx.fillStyle = 'rgba(255,120,170,0.28)'; ctx.beginPath(); ctx.arc(0, -1, 24 + Math.sin(t * 5 + fase) * 2, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#ff3d6e'; corazon(ctx, 0, 0, 16); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ff7fa2'; corazon(ctx, -1, -1, 10); ctx.fill();
    elip(ctx, -6, -7, 3.5, 2.2, 'rgba(255,255,255,0.85)');
    ctx.restore();
    const d = (t * 1.1 + fase) % 2.2;
    if (d < 0.45) { ctx.fillStyle = '#fff'; estrella(ctx, x + 14, y - 14, Math.sin((d / 0.45) * Math.PI) * 7, 4, 0.25); ctx.fill(); }
  };
  D.construirComida = function () { Object.keys(COMIDA).forEach((k) => (D.spr[k] = sprite(52, 52, 26, 28, COMIDA[k], 2.5))); };
  D.dibComida = function (ctx, clase, x, y, t, fase) {
    const p = 1 + Math.sin(t * 4 + fase) * 0.06;
    if (clase === 'estrella') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + fase) * 0.25);
      ctx.fillStyle = 'rgba(255,230,120,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 25 + Math.sin(t * 5 + fase) * 3, 0, U.TAU); ctx.fill();
      D.pon(ctx, D.spr.estrella, 0, 0, p); ctx.restore();
    } else D.pon(ctx, D.spr[clase], x, y, p);
    const d = (t * 1.1 + fase) % 2.6;
    if (d < 0.45) { ctx.fillStyle = '#fff'; estrella(ctx, x + 12, y - 14, Math.sin((d / 0.45) * Math.PI) * 7, 4, 0.25); ctx.fill(); }
  };

  // Caja sorpresa dorada (cofre-regalo flotante con estrella)
  D.dibCaja = function (ctx, c, t) {
    const T = 46, bote = c.golpe > 0 ? Math.sin((c.golpe / 0.22) * Math.PI) * 14 : 0;
    const flota = Math.sin(t * 2.2 + c.x * 0.01) * 3;
    const x = c.x - T / 2, y = c.y - c.z - T - bote + flota, vacia = c.usos <= 0;
    D.sombra(ctx, c.x, c.y, 22, 0.2);
    ctx.fillStyle = vacia ? '#b9a68a' : '#c97a00'; redondo(ctx, x, y + 5, T, T, 9); ctx.fill();
    const gr = ctx.createLinearGradient(x, y, x + T, y + T);
    if (vacia) { gr.addColorStop(0, '#f0e2c6'); gr.addColorStop(1, '#d6c3a0'); } else { gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.5, '#ffcf3a'); gr.addColorStop(1, '#ffab1a'); }
    ctx.fillStyle = gr; redondo(ctx, x, y, T, T, 9); ctx.fill();
    ctx.strokeStyle = vacia ? '#a08a66' : '#a85e00'; ctx.lineWidth = 3; ctx.stroke();
    if (!vacia) {
      ctx.fillStyle = '#ff5d8f'; ctx.fillRect(x + T / 2 - 5, y + 1.5, 10, T - 3); ctx.fillRect(x + 1.5, y + T / 2 - 5, T - 3, 10);
      const s = 1 + Math.sin(t * 5 + c.x) * 0.08;
      ctx.fillStyle = '#fff'; estrella(ctx, c.x, y + T / 2, 13 * s, 5, 0.5); ctx.fill();
      ctx.strokeStyle = '#a85e00'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; redondo(ctx, x + 6, y + 5, 12, 5, 2.5); ctx.fill();
    } else { circ(ctx, x + 9, y + 9, 2.5, '#a08a66'); circ(ctx, x + T - 9, y + 9, 2.5, '#a08a66'); circ(ctx, x + 9, y + T - 9, 2.5, '#a08a66'); circ(ctx, x + T - 9, y + T - 9, 2.5, '#a08a66'); }
  };

  // Hongo gigante trampolín
  const HONGO = [['#ff8fc7', '#ffc6e4', '#e0609f'], ['#b79aff', '#ddd0ff', '#8a6ae6'], ['#5ad1c8', '#b4f5ea', '#2fa79d']];
  D.dibHongo = function (ctx, h, t) {
    const col = HONGO[h.tinte], a = h.aplasta > 0 ? Math.sin((h.aplasta / 0.35) * Math.PI) : 0;
    const sy = 1 - a * 0.32, sx = 1 + a * 0.2;
    D.sombra(ctx, h.x, h.y, 44, 0.22);
    ctx.save(); ctx.translate(h.x, h.y); ctx.scale(sx, sy);
    ctx.fillStyle = '#f2dcc0'; redondo(ctx, -17, -32, 34, 36, 12); ctx.fill();
    ctx.fillStyle = '#fff6e5'; redondo(ctx, -17, -32, 22, 36, 11); ctx.fill();
    ctx.fillStyle = col[2]; ctx.beginPath(); ctx.ellipse(0, -30, 46, 13, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = col[0]; ctx.beginPath(); ctx.moveTo(-46, -32); ctx.bezierCurveTo(-46, -68, 46, -68, 46, -32); ctx.bezierCurveTo(30, -22, -30, -22, -46, -32); ctx.fill();
    ctx.fillStyle = col[1]; ctx.beginPath(); ctx.ellipse(-12, -50, 20, 8, -0.2, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#fff'; [[-26, -38, 5], [22, -44, 6], [2, -34, 4.5]].forEach((p) => { corazon(ctx, p[0], p[1], p[2]); ctx.fill(); });
    ctx.restore();
  };

  // Portal arcoíris (atajo)
  D.dibPortal = function (ctx, p, t) {
    D.sombra(ctx, p.x, p.y, 46, 0.2);
    const col = ['#ff7aa8', '#ffb86b', '#ffe873', '#8fe39a', '#7fc8ff'];
    ctx.save(); ctx.translate(p.x, p.y);
    // interior mágico
    const gr = ctx.createRadialGradient(0, -34, 4, 0, -34, 40);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, p.color); gr.addColorStop(1, '#5b2a9e');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-30, -38); ctx.arc(0, -38, 30, Math.PI, 0); ctx.lineTo(30, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { const a = t * 2.4 + i * 2.1; ctx.beginPath(); ctx.arc(0, -36, 8 + i * 7, a, a + 1.6); ctx.stroke(); }
    col.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-34 - i * 5.5, 2); ctx.lineTo(-34 - i * 5.5, -38); ctx.arc(0, -38, 34 + i * 5.5, Math.PI, 0); ctx.lineTo(34 + i * 5.5, 2); ctx.stroke(); });
    ctx.fillStyle = p.color; estrella(ctx, 0, -104 + Math.sin(t * 3) * 3, 12, 5, 0.5); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  };

  // ---------- Peligros cómicos ----------
  D.dibCactus = function (ctx, p, t) {
    const r = Math.sin(t * 1.6 + p.fase), sy = 1 + r * 0.04;
    D.sombra(ctx, p.x, p.y, 30, 0.22);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, sy);
    ctx.fillStyle = '#d98846'; ctx.beginPath(); ctx.moveTo(-20, -16); ctx.lineTo(20, -16); ctx.lineTo(15, 2); ctx.lineTo(-15, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f0a860'; ctx.fillRect(-23, -21, 46, 8);
    elip(ctx, 0, -40, 23, 27, '#3fae6a', '#1f7a4d', 2.5);
    elip(ctx, -7, -46, 9, 14, 'rgba(160,240,170,0.5)');
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    [[-22, -44, -30, -47], [-20, -30, -28, -28], [22, -44, 30, -47], [20, -30, 28, -28], [-12, -64, -15, -71], [12, -64, 15, -71]].forEach((s) => { ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); ctx.stroke(); });
    // carita dormida
    ctx.strokeStyle = TINTA; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(-8, -41, 4.5, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.beginPath(); ctx.arc(8, -41, 4.5, 0.15, Math.PI - 0.15); ctx.stroke();
    elip(ctx, 0, -31, 3 + r, 3.5 + r, '#7a2b4a');
    // gorrito de dormir
    ctx.fillStyle = '#7fc8ff'; ctx.beginPath(); ctx.moveTo(-17, -60); ctx.quadraticCurveTo(0, -84, 22, -72); ctx.quadraticCurveTo(10, -66, 17, -60); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; redondo(ctx, -19, -63, 38, 8, 4); ctx.fill(); circ(ctx, 24, -71, 5.5, '#fff');
    ctx.restore();
    // Zzz
    const z = (t * 0.6 + p.fase) % 1;
    ctx.fillStyle = `rgba(255,255,255,${1 - z})`; ctx.font = `bold ${12 + z * 10}px ui-rounded, system-ui, sans-serif`;
    ctx.fillText('z', p.x + 22 + z * 14, p.y - 70 - z * 30);
  };
  D.dibZarza = function (ctx, p, t) {
    D.sombra(ctx, p.x, p.y, 38, 0.22);
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = '#eef2ff';
    for (let i = 0; i < 11; i++) { const a = Math.PI + (i / 10) * Math.PI, x = Math.cos(a) * 30, y = -18 + Math.sin(a) * 22; ctx.beginPath(); ctx.moveTo(x - 4, y + 3); ctx.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13); ctx.lineTo(x + 4, y + 3); ctx.closePath(); ctx.fill(); }
    copa(ctx, [[-18, -14, 17], [18, -14, 17], [0, -24, 21]], '#7a4fb5', '#a47be0', '#55328c');
    ctx.fillStyle = '#eef2ff'; [[-14, -22], [10, -30], [16, -12], [-4, -10]].forEach((s) => { ctx.beginPath(); ctx.moveTo(s[0] - 3, s[1] + 3); ctx.lineTo(s[0], s[1] - 7); ctx.lineTo(s[0] + 3, s[1] + 3); ctx.closePath(); ctx.fill(); });
    // carita traviesa
    circ(ctx, -7, -20, 3, '#fff'); circ(ctx, 7, -20, 3, '#fff'); circ(ctx, -7, -20, 1.5, TINTA); circ(ctx, 7, -20, 1.5, TINTA);
    ctx.strokeStyle = TINTA; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, -26); ctx.lineTo(-4, -24); ctx.moveTo(11, -26); ctx.lineTo(4, -24); ctx.stroke();
    ctx.restore();
  };
  D.dibCaracol = function (ctx, p, t) {
    const d = p.dir, paso = Math.sin(t * 5 + p.fase), mare = p.mareado > 0;
    D.sombra(ctx, p.x, p.y, 28, 0.22);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(d, 1);
    if (!mare) {
      // cuerpo
      ctx.fillStyle = '#ffd9a0'; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-28, -9, -14, -9); ctx.lineTo(16, -9 - paso); ctx.quadraticCurveTo(30, -30, 24, -34); ctx.quadraticCurveTo(14, -32, 14, -14); ctx.lineTo(26 + paso * 2, -3); ctx.quadraticCurveTo(28, 0, 22, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#c98a4a'; ctx.lineWidth = 2; ctx.stroke();
      // antenas y ojos gruñones
      ctx.strokeStyle = '#c98a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, -32); ctx.lineTo(17, -44); ctx.moveTo(26, -32); ctx.lineTo(31, -43); ctx.stroke();
      circ(ctx, 17, -45, 4.5, '#fff', TINTA, 1.5); circ(ctx, 31, -44, 4.5, '#fff', TINTA, 1.5); circ(ctx, 18, -45, 2, TINTA); circ(ctx, 32, -44, 2, TINTA);
      ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(12, -52); ctx.lineTo(21, -48); ctx.moveTo(36, -50); ctx.lineTo(28, -48); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(24, -19, 4, Math.PI + 0.3, U.TAU - 0.3); ctx.stroke();
    }
    // concha
    const cy = mare ? -17 : -24;
    circ(ctx, -4, cy, 19, '#ff8a5c', '#b8482a', 2.5);
    ctx.strokeStyle = '#ffd0b0'; ctx.lineWidth = 3.5; ctx.beginPath();
    for (let a = 0; a < 9; a += 0.3) { const r = 2 + a * 1.6, x = -4 + Math.cos(a + (mare ? t * 6 : 0)) * r, y = cy + Math.sin(a + (mare ? t * 6 : 0)) * r; a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.restore();
    if (mare) { ctx.fillStyle = '#ffe066'; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; estrella(ctx, p.x + Math.cos(a) * 20, p.y - 44 + Math.sin(a) * 6, 5, 5, 0.5); ctx.fill(); } }
  };

  J.Dibujo = D;
})();
