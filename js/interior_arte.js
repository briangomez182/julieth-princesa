/* Arte de los interiores: salones de los castillos, tronos, columnas,
   adornos y los diez príncipes (personajes originales del juego). */
(function () {
  const U = J.U, D = J.Dibujo, TINTA = D.TINTA;
  const circ = D.circ, elip = D.elip, redondo = D.redondo, estrella = D.estrella;

  const SALA = {
    real: { zocalo: '#f2a9bf', piso: ['#fff3dc', '#ffdbe4'], alfombra: '#e23d5a', alfBorde: '#ffc93c', marco: '#ffc93c', pendon: '#ff5d8f' },
    bosque: { zocalo: '#6e4424', piso: ['#d6a86c', '#c4925a'], alfombra: '#3fae5a', alfBorde: '#ffd23f', marco: '#5f3c22', pendon: '#3fb357' },
    cristal: { zocalo: '#8a7cf0', piso: ['#f0faff', '#cfe9ff'], alfombra: '#7a6be8', alfBorde: '#ffffff', marco: '#ffffff', pendon: '#5ad1ff' },
    nubes: { zocalo: '#ffc6e6', piso: ['#ffffff', '#ffeaf5'], alfombra: '#7fc8ff', alfBorde: '#ffd23f', marco: '#ffd23f', pendon: '#c38bff' },
    hielo: { zocalo: '#8fcbea', piso: ['#f4fcff', '#d6efff'], alfombra: '#5fb7e8', alfBorde: '#ffffff', marco: '#eaf8ff', pendon: '#7fd0f5' },
    luna: { zocalo: '#3c3f8f', piso: ['#2f3374', '#3a3f88'], alfombra: '#b9a8ff', alfBorde: '#ffe9a8', marco: '#f5e6a8', pendon: '#5b5fc7' },
    fuego: { zocalo: '#7a3a2a', piso: ['#5c3c38', '#6c4642'], alfombra: '#ff7a3d', alfBorde: '#ffd23f', marco: '#ffb347', pendon: '#ff5a3c' },
    trueno: { zocalo: '#6b5aa8', piso: ['#dedbf2', '#c9c4e6'], alfombra: '#8a6be0', alfBorde: '#ffe14d', marco: '#ffe14d', pendon: '#5f4fb0' },
    mar: { zocalo: '#2f9fb0', piso: ['#e2f9f6', '#c2eeee'], alfombra: '#ff8fa8', alfBorde: '#fff1c8', marco: '#fff1c8', pendon: '#2cb6c9' },
    arena: { zocalo: '#c98a4a', piso: ['#f6dfae', '#ecd09a'], alfombra: '#e0703c', alfBorde: '#ffd23f', marco: '#ffd23f', pendon: '#2fb5a3' },
    huerto: { zocalo: '#8fd47a', piso: ['#f6e0b8', '#efd4a6'], alfombra: '#ff8fb5', alfBorde: '#ffd23f', marco: '#ffffff', pendon: '#7fc8ff' }
  };

  // Los príncipes: nombre, aspecto y colores
  const PRINCIPE = {
    real: { nombre: 'Príncipe Leo', piel: '#f3c9a3', pielS: '#dba57c', pelo: '#7a4a22', peloL: '#a56a36', tunica: '#e23d5a', tunicaL: '#f46a82', capa: '#3d5fd0', pantalon: '#f4ead8', gema: '#ff5d8f', peinado: 'ondas' },
    bosque: { nombre: 'Príncipe Roble', piel: '#9a6238', pielS: '#7d4c28', pelo: '#1f1612', peloL: '#3a2a22', tunica: '#3fae5a', tunicaL: '#66cc78', capa: '#7a4a22', pantalon: '#5a3c22', gema: '#8fe39a', peinado: 'rizos' },
    cristal: { nombre: 'Príncipe Zafiro', piel: '#fbe1cf', pielS: '#e8bfa6', pelo: '#bfe6ff', peloL: '#ffffff', ceja: '#8fb8d8', tunica: '#5aa9ec', tunicaL: '#8fd3ff', capa: '#7a6be8', pantalon: '#e9f4ff', gema: '#6fc3ff', peinado: 'puntas' },
    nubes: { nombre: 'Príncipe Nimbo', piel: '#d9a273', pielS: '#bd8456', pelo: '#f6d36b', peloL: '#fff0b0', tunica: '#9fd8ff', tunicaL: '#d3eeff', capa: '#ffffff', pantalon: '#c9b5ff', gema: '#ffd23f', peinado: 'nube' },
    hielo: { nombre: 'Príncipe Escarcha', piel: '#f7d7c4', pielS: '#e2b6a0', pelo: '#f4fbff', peloL: '#bfe8ff', ceja: '#9cc4e0', tunica: '#dff3ff', tunicaL: '#ffffff', capa: '#5fb7e8', pantalon: '#a6d8f2', gema: '#9fe6ff', peinado: 'escarcha', acc: 'bufanda' },
    luna: { nombre: 'Príncipe Lucero', piel: '#6e4128', pielS: '#56301c', pelo: '#262a6b', peloL: '#4b52b0', tunica: '#4a4fb8', tunicaL: '#6f75d8', capa: '#ffe9a8', pantalon: '#2f3374', gema: '#fff2b0', peinado: 'estrellado', acc: 'medallon' },
    fuego: { nombre: 'Príncipe Brasa', piel: '#e3ad86', pielS: '#c98d66', pelo: '#ff5a2a', peloL: '#ffc04a', ceja: '#d8401c', tunica: '#ff7a3d', tunicaL: '#ffa66b', capa: '#c83a3a', pantalon: '#6c4642', gema: '#ffd23f', peinado: 'llamas', acc: 'llamita' },
    trueno: { nombre: 'Príncipe Centella', piel: '#b97a4f', pielS: '#9c623b', pelo: '#ffd83a', peloL: '#fff3a0', ceja: '#d9a400', tunica: '#7a5fd0', tunicaL: '#9d86ea', capa: '#4a3f8f', pantalon: '#d9d6ee', gema: '#ffe14d', peinado: 'electrico', acc: 'rayo' },
    mar: { nombre: 'Príncipe Coral', piel: '#8a5634', pielS: '#6e4024', pelo: '#2cc9c0', peloL: '#9ff3ea', ceja: '#1a8f88', tunica: '#2cb6c9', tunicaL: '#6ad8e3', capa: '#ff8fa8', pantalon: '#f2ead0', gema: '#ffb3c9', peinado: 'olas', acc: 'concha' },
    arena: { nombre: 'Príncipe Oasis', piel: '#c99062', pielS: '#ad7548', pelo: '#4a2e1a', peloL: '#6e4628', panuelo: '#ffcf4a', panueloS: '#e0a020', tunica: '#2fb5a3', tunicaL: '#5fd3c3', capa: '#e0703c', pantalon: '#f6dfae', gema: '#3fd6c0', peinado: 'turbante' }
  };
  D.PRINCIPE = PRINCIPE; D.SALA = SALA;

  // ---------- Salón: parte fija (va a la caché del suelo) ----------
  function arco(g, x, y, w, h) { // ventana con arco; (x,y) = centro
    g.beginPath(); g.moveTo(x - w / 2, y + h / 2); g.lineTo(x - w / 2, y - h / 2 + w / 2);
    g.arc(x, y - h / 2 + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w / 2, y + h / 2); g.closePath();
  }
  D.arco = arco;
  // número "al azar" fijo para cada baldosa (siempre el mismo dibujo)
  function azar(i, j) { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); }
  function copo(g, x, y, r) { // copito de nieve de 6 puntas
    g.beginPath();
    for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3, dx = Math.cos(a) * r, dy = Math.sin(a) * r; g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy); }
    g.stroke();
  }
  function rayito(g, x, y, e, color) { // rayito en zigzag; (x,y) = centro
    g.fillStyle = color; g.beginPath(); g.moveTo(x + 3 * e, y - 16 * e); g.lineTo(x - 7 * e, y + 2 * e); g.lineTo(x - 1 * e, y + 2 * e);
    g.lineTo(x - 4 * e, y + 16 * e); g.lineTo(x + 8 * e, y - 3 * e); g.lineTo(x + 2 * e, y - 3 * e); g.closePath(); g.fill();
  }

  D.salaFija = function (ctx, s) {
    if (s.huerto) return salaHuertoFija(ctx, s);
    const T = D.TEMA[s.id], Z = SALA[s.id], w = s.x1 - s.x0, h = s.y1 - s.y0, A = s.alto, cx = s.cx;
    // muro exterior
    ctx.fillStyle = T.borde; redondo(ctx, s.x0 - 30, s.y0 - A - 30, w + 60, A + h + 60, 20); ctx.fill();
    // pared del fondo
    const gr = ctx.createLinearGradient(0, s.y0 - A, 0, s.y0);
    gr.addColorStop(0, T.muro); gr.addColorStop(1, T.luz);
    ctx.fillStyle = gr; ctx.fillRect(s.x0, s.y0 - A, w, A);
    D.texturaMuro(ctx, T, s.id, s.x0, s.y0 - A, w, A - 58);
    ctx.fillStyle = T.sombra; ctx.fillRect(s.x0, s.y0 - A, w, 18);
    ctx.fillStyle = T.detalle; ctx.fillRect(s.x0, s.y0 - A + 18, w, 5);
    // zócalo
    ctx.fillStyle = Z.zocalo; ctx.fillRect(s.x0, s.y0 - 58, w, 58);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(s.x0, s.y0 - 58, w, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let x = s.x0 + 46; x < s.x1; x += 92) ctx.fillRect(x, s.y0 - 50, 3, 50);
    // marcos de las ventanas (el cielo se pinta en vivo)
    for (const vx of s.ventanas) { ctx.fillStyle = Z.marco; arco(ctx, vx, s.y0 - A * 0.56, 92, 132); ctx.fill(); ctx.strokeStyle = T.borde; ctx.lineWidth = 3; ctx.stroke(); }
    // emblema del castillo
    D.emblema(ctx, s.id, cx, s.y0 - A * 0.7, 26);
    // piso de baldosas
    const nx = 12, ny = 10, tw = w / nx, th = h / ny;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { ctx.fillStyle = Z.piso[(i + j) % 2]; ctx.fillRect(s.x0 + i * tw, s.y0 + j * th, tw + 0.5, th + 0.5); }
    if (s.id === 'bosque') { // vetas de madera
      ctx.strokeStyle = 'rgba(95,60,34,0.25)'; ctx.lineWidth = 2;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = s.x0 + i * tw + 14, y = s.y0 + j * th + th / 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + tw / 3, y - 7, x + tw - 28, y); ctx.stroke(); }
    } else if (s.id === 'hielo') { // hielo brillante con copitos de escarcha
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let j = 0; j < ny; j++) for (let i = (j % 2); i < nx; i += 2) { redondo(ctx, s.x0 + i * tw + 10, s.y0 + j * th + 8, tw * 0.42, 6, 3); ctx.fill(); }
      ctx.strokeStyle = 'rgba(140,200,235,0.7)'; ctx.lineWidth = 2;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (azar(i, j) < 0.4) copo(ctx, s.x0 + (i + 0.3 + azar(j, i) * 0.4) * tw, s.y0 + (j + 0.55) * th, 7 + azar(i + 3, j) * 5);
    } else if (s.id === 'luna') { // cielo de noche con constelaciones
      ctx.fillStyle = 'rgba(255,240,190,0.55)';
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (azar(i, j) < 0.45) { estrella(ctx, s.x0 + (i + azar(j, i)) * tw, s.y0 + (j + azar(i + 7, j)) * th, 2 + azar(i, j + 5) * 3, 4, 0.4); ctx.fill(); }
      for (let c = 0; c < 8; c++) {
        let px = s.x0 + 40 + azar(c, 1) * (w - 80), py = s.y0 + 40 + azar(c, 2) * (h - 80);
        const pts = [[px, py]];
        for (let m = 0; m < 4; m++) { px = U.limitar(px + (azar(c, m + 3) - 0.3) * 150, s.x0 + 20, s.x1 - 20); py = U.limitar(py + (azar(m, c + 9) - 0.5) * 110, s.y0 + 20, s.y1 - 20); pts.push([px, py]); }
        ctx.strokeStyle = 'rgba(255,240,190,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
        ctx.fillStyle = '#fff2b0'; pts.forEach((p) => { estrella(ctx, p[0], p[1], 6, 5, 0.45); ctx.fill(); });
      }
    } else if (s.id === 'fuego') { // piedra volcánica con vetas calentitas
      ctx.strokeStyle = 'rgba(30,15,15,0.35)'; ctx.lineWidth = 2;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) ctx.strokeRect(s.x0 + i * tw + 2, s.y0 + j * th + 2, tw - 4, th - 4);
      ctx.strokeStyle = 'rgba(255,140,60,0.55)'; ctx.lineWidth = 2.5;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (azar(i, j) < 0.55) {
        let x = s.x0 + i * tw + 8, y = s.y0 + j * th + th * (0.2 + azar(j, i) * 0.6);
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let k = 1; k <= 4; k++) { x += (tw - 16) / 4; y += (azar(i + k, j + k) - 0.5) * 14; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (azar(i + 11, j) < 0.25) circ(ctx, s.x0 + (i + 0.5) * tw, s.y0 + (j + 0.5) * th, 3, 'rgba(255,190,80,0.5)');
    } else if (s.id === 'trueno') { // nubecitas en zigzag con rayitos
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = s.x0 + (i + 0.5) * tw, y = s.y0 + (j + 0.5) * th + ((i % 2) ? -8 : 8);
        if ((i + j) % 2) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; [[-10, 2, 8], [0, -3, 10], [10, 2, 8]].forEach((p) => { ctx.beginPath(); ctx.arc(x + p[0], y + p[1], p[2], 0, U.TAU); ctx.fill(); }); }
        else if (azar(i, j) < 0.5) rayito(ctx, x, y, 0.7, 'rgba(255,215,60,0.7)');
      }
    } else if (s.id === 'mar') { // olitas y burbujas
      ctx.strokeStyle = 'rgba(40,160,180,0.3)'; ctx.lineWidth = 3;
      for (let y = s.y0 + 26; y < s.y1; y += 40) { ctx.beginPath(); for (let x = s.x0; x < s.x1; x += 34) ctx.arc(x + 17, y, 17, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (azar(i, j) < 0.35) {
        const x = s.x0 + (i + azar(j, i)) * tw, y = s.y0 + (j + azar(i + 4, j)) * th, r = 4 + azar(i, j + 2) * 6;
        ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.stroke(); circ(ctx, x - r * 0.35, y - r * 0.35, r * 0.25, 'rgba(255,255,255,0.9)');
      }
    } else if (s.id === 'arena') { // arena con ondas
      ctx.strokeStyle = 'rgba(180,120,60,0.28)'; ctx.lineWidth = 3;
      for (let y = s.y0 + 20; y < s.y1; y += 34) { ctx.beginPath(); ctx.moveTo(s.x0, y); for (let x = s.x0; x <= s.x1; x += 20) ctx.lineTo(x, y + Math.sin((x - s.x0) * 0.025 + y * 0.05) * 7); ctx.stroke(); }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (azar(i, j) < 0.3) elip(ctx, s.x0 + (i + azar(j, i)) * tw, s.y0 + (j + azar(i + 2, j)) * th, 4, 2.5, 'rgba(160,100,50,0.35)');
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let j = 0; j < ny; j++) for (let i = (j % 2); i < nx; i += 2) { redondo(ctx, s.x0 + i * tw + 10, s.y0 + j * th + 8, tw * 0.42, 6, 3); ctx.fill(); }
    }
    // sombra bajo la pared y a los lados
    let so = ctx.createLinearGradient(0, s.y0, 0, s.y0 + 54);
    so.addColorStop(0, 'rgba(50,25,60,0.3)'); so.addColorStop(1, 'rgba(50,25,60,0)');
    ctx.fillStyle = so; ctx.fillRect(s.x0, s.y0, w, 54);
    // tapete del trono y alfombra hasta la puerta
    elip(ctx, cx, s.y0 + 96, 178, 74, Z.alfBorde); elip(ctx, cx, s.y0 + 96, 166, 64, Z.alfombra);
    ctx.fillStyle = Z.alfBorde; ctx.fillRect(cx - 68, s.y0 + 96, 136, h - 96 + 30);
    ctx.fillStyle = Z.alfombra; ctx.fillRect(cx - 58, s.y0 + 96, 116, h - 96 + 30);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (let y = s.y0 + 190; y < s.y1 - 20; y += 84) { estrella(ctx, cx, y, 18, 4, 0.5); ctx.fill(); }
    // puerta de salida (abajo, al centro)
    ctx.fillStyle = T.detalle; ctx.fillRect(cx - 84, s.y1, 16, 30); ctx.fillRect(cx + 68, s.y1, 16, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(cx - 58, s.y1 + 22, 116, 8);
  };

  // ---------- Salón: parte viva (ventanas con el cielo de afuera, pendones, flechas) ----------
  D.dibSala = function (ctx, s, t) {
    if (s.huerto) return salaHuertoViva(ctx, s, t);
    const Z = SALA[s.id], A = s.alto, Ci = J.Cielo, y = s.y0 - A * 0.56;
    for (let i = 0; i < s.ventanas.length; i++) {
      const vx = s.ventanas[i];
      ctx.save(); arco(ctx, vx, y, 74, 114); ctx.clip();
      const gr = ctx.createLinearGradient(0, y - 57, 0, y + 57);
      gr.addColorStop(0, U.rgb(Ci.cielo)); gr.addColorStop(1, U.rgb(U.mezclaColor(Ci.cielo, [255, 255, 255], 0.45)));
      ctx.fillStyle = gr; ctx.fillRect(vx - 40, y - 60, 80, 120);
      if (Ci.noche > 0.1) {
        ctx.fillStyle = `rgba(255,250,220,${Ci.noche})`;
        [[-18, -30, 4], [14, -12, 5], [-6, 8, 3.5], [20, 28, 4], [-22, 34, 3]].forEach((p, k) => { estrella(ctx, vx + p[0], y + p[1], p[2] * (0.8 + 0.3 * Math.sin(t * 3 + k + i)), 4, 0.3); ctx.fill(); });
        if (i === 1) { circ(ctx, vx + 6, y - 22, 13, '#fdf6d8'); circ(ctx, vx + 12, y - 26, 11, U.rgb(Ci.cielo)); }
      } else {
        const nx = vx - 50 + ((t * 7 + i * 37) % 110);
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        [[0, 0, 11], [12, -4, 13], [25, 1, 10]].forEach((p) => { ctx.beginPath(); ctx.arc(nx + p[0], y - 18 + p[1] + i * 9, p[2], 0, U.TAU); ctx.fill(); });
        ctx.fillStyle = '#6fdc5f'; ctx.beginPath(); ctx.ellipse(vx, y + 66, 60, 26, 0, 0, U.TAU); ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = Z.marco; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(vx, y - 57); ctx.lineTo(vx, y + 57); ctx.moveTo(vx - 37, y + 4); ctx.lineTo(vx + 37, y + 4); ctx.stroke();
    }
    // pendones que ondean a los lados del emblema
    for (const lado of [-1, 1]) {
      const px = s.cx + lado * 150, py = s.y0 - A + 30, o = Math.sin(t * 2.6 + lado) * 5;
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(px - 34, py - 4, 68, 6);
      ctx.fillStyle = Z.pendon; ctx.beginPath(); ctx.moveTo(px - 28, py); ctx.lineTo(px + 28, py);
      ctx.quadraticCurveTo(px + 28 + o, py + 60, px + 26 + o, py + 112); ctx.lineTo(px + o, py + 92); ctx.lineTo(px - 26 + o, py + 112);
      ctx.quadraticCurveTo(px - 28 + o, py + 60, px - 28, py); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; estrella(ctx, px + o * 0.5, py + 46, 13, 5, 0.5); ctx.fill();
    }
    // flechas que marcan la salida
    const k = (t * 1.6) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.9 - k * 0.6})`; ctx.lineWidth = 7;
    for (let i = 0; i < 2; i++) { const yy = s.y1 - 54 + i * 20 + k * 10; ctx.beginPath(); ctx.moveTo(s.cx - 20, yy); ctx.lineTo(s.cx, yy + 15); ctx.lineTo(s.cx + 20, yy); ctx.stroke(); }
  };

  function llama(g, x, y, h, lean, color) { // llamita con la base en (x,y)
    g.fillStyle = color; g.beginPath(); g.moveTo(x - h * 0.32, y);
    g.quadraticCurveTo(x - h * 0.4, y - h * 0.55, x + lean, y - h); g.quadraticCurveTo(x + h * 0.4, y - h * 0.5, x + h * 0.32, y); g.closePath(); g.fill();
  }

  // ---------- Muebles ----------
  D.dibTrono = function (ctx, o) {
    const T = D.TEMA[o.id], x = o.x, y = o.y;
    D.sombra(ctx, x, y + 2, 58, 0.22);
    ctx.fillStyle = T.techoSombra; redondo(ctx, x - 44, y - 150, 88, 150, 30); ctx.fill();
    ctx.fillStyle = T.techo; redondo(ctx, x - 38, y - 144, 76, 120, 26); ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 5; redondo(ctx, x - 44, y - 150, 88, 150, 30); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; redondo(ctx, x - 30, y - 136, 22, 96, 11); ctx.fill();
    // asiento y apoyabrazos
    ctx.fillStyle = '#ffd23f'; redondo(ctx, x - 56, y - 52, 22, 52, 9); ctx.fill(); redondo(ctx, x + 34, y - 52, 22, 52, 9); ctx.fill();
    ctx.fillStyle = '#e8a81c'; redondo(ctx, x - 40, y - 28, 80, 28, 8); ctx.fill();
    ctx.fillStyle = '#fff3d0'; redondo(ctx, x - 36, y - 40, 72, 18, 9); ctx.fill();
    circ(ctx, x - 45, y - 54, 9, '#ffe873', '#d98500', 2); circ(ctx, x + 45, y - 54, 9, '#ffe873', '#d98500', 2);
    D.emblema(ctx, o.id, x, y - 162, 13);
  };
  D.dibColumna = function (ctx, o) {
    const T = D.TEMA[o.id], x = o.x, y = o.y, H = 190;
    D.sombra(ctx, x, y + 2, 34, 0.22);
    const gr = ctx.createLinearGradient(x - 22, 0, x + 22, 0);
    gr.addColorStop(0, T.luz); gr.addColorStop(0.45, T.muro); gr.addColorStop(1, T.sombra);
    ctx.fillStyle = T.sombra; redondo(ctx, x - 30, y - 16, 60, 18, 6); ctx.fill();
    ctx.fillStyle = gr; ctx.fillRect(x - 21, y - H, 42, H - 12);
    ctx.strokeStyle = T.borde; ctx.lineWidth = 2.5; ctx.strokeRect(x - 21, y - H, 42, H - 12);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 3;
    for (const dx of [-9, 4, 14]) { ctx.beginPath(); ctx.moveTo(x + dx, y - H + 6); ctx.lineTo(x + dx, y - 18); ctx.stroke(); }
    ctx.fillStyle = T.luz; redondo(ctx, x - 30, y - H - 14, 60, 18, 6); ctx.fill(); ctx.strokeStyle = T.borde; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = T.detalle; ctx.fillRect(x - 22, y - H + 6, 44, 5);
    if (o.id === 'bosque') { ctx.strokeStyle = '#3fb357'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 20, y - 30); for (let k = 1; k < 8; k++) ctx.lineTo(x + (k % 2 ? 20 : -20), y - 30 - k * 20); ctx.stroke(); }
    else if (o.id === 'hielo') { // carámbanos bajo el capitel
      ctx.fillStyle = 'rgba(230,248,255,0.95)';
      [[-18, 16], [-9, 24], [0, 14], [9, 20], [18, 12]].forEach((p) => { ctx.beginPath(); ctx.moveTo(x + p[0] - 4, y - H + 4); ctx.lineTo(x + p[0] + 4, y - H + 4); ctx.lineTo(x + p[0], y - H + 4 + p[1]); ctx.closePath(); ctx.fill(); });
    } else if (o.id === 'luna') { // estrellitas pegadas
      ctx.fillStyle = '#fff2b0'; [[-8, 50, 6], [9, 95, 5], [-6, 140, 7]].forEach((p) => { estrella(ctx, x + p[0], y - H + p[1], p[2], 5, 0.45); ctx.fill(); });
    } else if (o.id === 'fuego') { // vetas que brillan
      ctx.strokeStyle = 'rgba(255,140,60,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 14, y - 30); ctx.lineTo(x - 4, y - 70); ctx.lineTo(x - 12, y - 110); ctx.lineTo(x + 2, y - 160); ctx.moveTo(x - 4, y - 70); ctx.lineTo(x + 12, y - 95); ctx.stroke();
    } else if (o.id === 'trueno') { rayito(ctx, x, y - 100, 2, '#ffe14d'); }
    else if (o.id === 'mar') { // algas que suben
      ctx.strokeStyle = '#3fbf8f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 12, y - 18); for (let k = 1; k <= 6; k++) ctx.quadraticCurveTo(x + (k % 2 ? 6 : -22), y - 18 - k * 14 + 7, x - 12, y - 18 - k * 14); ctx.stroke();
      circ(ctx, x + 10, y - 120, 4, null, '#fff', 2); circ(ctx, x + 6, y - 140, 2.5, null, '#fff', 1.5);
    } else if (o.id === 'arena') { // franjas pintadas
      ctx.fillStyle = '#2fb5a3'; ctx.fillRect(x - 21, y - 60, 42, 7); ctx.fillStyle = '#e0703c'; ctx.fillRect(x - 21, y - 50, 42, 5);
      ctx.fillStyle = '#ffd23f'; for (const dx of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(x + dx - 5, y - 60); ctx.lineTo(x + dx, y - 68); ctx.lineTo(x + dx + 5, y - 60); ctx.closePath(); ctx.fill(); }
    }
  };
  D.dibAdorno = function (ctx, o, t) {
    const x = o.x, y = o.y;
    D.sombra(ctx, x, y + 1, 30, 0.2);
    if (o.id === 'real') { // maceta con rosas
      ctx.fillStyle = '#d98846'; ctx.beginPath(); ctx.moveTo(x - 22, y - 30); ctx.lineTo(x + 22, y - 30); ctx.lineTo(x + 16, y); ctx.lineTo(x - 16, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f0a860'; ctx.fillRect(x - 25, y - 36, 50, 9);
      [[-16, -52, 16], [16, -52, 16], [0, -66, 20]].forEach((p) => circ(ctx, x + p[0], y + p[1], p[2], '#34b257'));
      [[-16, -56], [14, -50], [2, -72], [-4, -48]].forEach((p) => { circ(ctx, x + p[0], y + p[1], 7, '#ff5d8f'); circ(ctx, x + p[0] - 1, y + p[1] - 1, 3, '#ffb3c9'); });
    } else if (o.id === 'bosque') { // hongo farolito
      ctx.fillStyle = '#fff6e5'; redondo(ctx, x - 9, y - 40, 18, 42, 8); ctx.fill();
      const b = 0.75 + Math.sin(t * 2 + x) * 0.15;
      ctx.fillStyle = `rgba(255,232,115,${0.3 * b})`; ctx.beginPath(); ctx.arc(x, y - 50, 44, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(x - 30, y - 40); ctx.bezierCurveTo(x - 30, y - 78, x + 30, y - 78, x + 30, y - 40); ctx.closePath(); ctx.fill();
      [[-14, -52, 5], [10, -58, 6], [2, -46, 4]].forEach((p) => circ(ctx, x + p[0], y + p[1], p[2], '#fff6b0'));
    } else if (o.id === 'cristal') { // racimo de cristales
      [[-14, 0, 14, 44, '#8fd8ff'], [14, 0, 13, 38, '#b9a4ff'], [0, 2, 18, 68, '#6fc3ff']].forEach((p) => {
        const px = x + p[0], py = y + p[1];
        ctx.fillStyle = p[4]; ctx.beginPath(); ctx.moveTo(px, py - p[3]); ctx.lineTo(px + p[2], py - p[3] * 0.35); ctx.lineTo(px + p[2] * 0.6, py); ctx.lineTo(px - p[2] * 0.6, py); ctx.lineTo(px - p[2], py - p[3] * 0.35); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(px, py - p[3]); ctx.lineTo(px - p[2], py - p[3] * 0.35); ctx.lineTo(px - p[2] * 0.6, py); ctx.lineTo(px - p[2] * 0.1, py - p[3] * 0.3); ctx.closePath(); ctx.fill();
      });
      const d = (t * 1.2 + x * 0.01) % 2; if (d < 0.5) { ctx.fillStyle = '#fff'; estrella(ctx, x + 8, y - 56, Math.sin((d / 0.5) * Math.PI) * 10, 4, 0.25); ctx.fill(); }
    } else if (o.id === 'nubes') { // cojín de nube
      const f = Math.sin(t * 1.8 + x) * 3;
      ctx.fillStyle = '#ffffff'; [[-20, -18, 18], [18, -18, 18], [0, -30, 24], [0, -12, 20]].forEach((p) => { ctx.beginPath(); ctx.arc(x + p[0], y + p[1] + f, p[2], 0, U.TAU); ctx.fill(); });
      ctx.fillStyle = '#ffe873'; estrella(ctx, x, y - 26 + f, 11, 5, 0.5); ctx.fill();
      elip(ctx, x - 16, y - 16 + f, 5, 3, 'rgba(255,150,180,0.5)'); elip(ctx, x + 16, y - 16 + f, 5, 3, 'rgba(255,150,180,0.5)');
    } else if (o.id === 'hielo') { // muñeco de nieve con bufanda
      circ(ctx, x, y - 20, 20, '#ffffff', '#bfe2f5', 2); circ(ctx, x, y - 52, 15, '#ffffff', '#bfe2f5', 2);
      ctx.fillStyle = '#5fb7e8'; redondo(ctx, x - 15, y - 41, 30, 7, 3.5); ctx.fill(); redondo(ctx, x + 4, y - 40, 7, 17, 3); ctx.fill();
      circ(ctx, x - 5, y - 55, 2.2, '#2a1810'); circ(ctx, x + 5, y - 55, 2.2, '#2a1810');
      ctx.fillStyle = '#ff9a3c'; ctx.beginPath(); ctx.moveTo(x - 1, y - 51); ctx.lineTo(x + 11, y - 49); ctx.lineTo(x - 1, y - 47); ctx.closePath(); ctx.fill();
      elip(ctx, x - 9, y - 48, 3, 2, 'rgba(255,150,180,0.6)');
      circ(ctx, x, y - 26, 2.5, '#5fb7e8'); circ(ctx, x, y - 16, 2.5, '#5fb7e8');
      const d = (t * 1.1 + x * 0.01) % 2.4; if (d < 0.5) { ctx.fillStyle = '#fff'; estrella(ctx, x + 16, y - 66, Math.sin((d / 0.5) * Math.PI) * 8, 4, 0.25); ctx.fill(); }
    } else if (o.id === 'luna') { // farolito de luna
      ctx.fillStyle = '#5b5fc7'; ctx.fillRect(x - 3, y - 54, 6, 54); redondo(ctx, x - 14, y - 6, 28, 7, 3); ctx.fill();
      const b = 0.75 + Math.sin(t * 2 + x) * 0.2;
      ctx.fillStyle = `rgba(255,240,180,${0.35 * b})`; ctx.beginPath(); ctx.arc(x, y - 72, 34, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#ffe9a8'; redondo(ctx, x - 14, y - 90, 28, 34, 9); ctx.fill(); ctx.strokeStyle = '#5b5fc7'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#5b5fc7'; redondo(ctx, x - 10, y - 96, 20, 7, 3); ctx.fill();
      circ(ctx, x - 1, y - 73, 9, '#fff6c8'); circ(ctx, x + 4, y - 76, 8, '#ffe9a8');
    } else if (o.id === 'fuego') { // brasero tierno con llamita
      ctx.strokeStyle = '#5c3c38'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x - 8, y - 22); ctx.moveTo(x + 14, y); ctx.lineTo(x + 8, y - 22); ctx.stroke();
      const f = Math.sin(t * 8 + x) * 2, b = 0.7 + Math.sin(t * 5 + x) * 0.2;
      ctx.fillStyle = `rgba(255,150,60,${0.3 * b})`; ctx.beginPath(); ctx.arc(x, y - 44, 36, 0, U.TAU); ctx.fill();
      llama(ctx, x, y - 30, 30 + f, f * 0.8, '#ff7a3d'); llama(ctx, x, y - 30, 17 - f * 0.5, -f * 0.5, '#ffd23f');
      ctx.fillStyle = '#7a3a2a'; ctx.beginPath(); ctx.moveTo(x - 24, y - 34); ctx.lineTo(x + 24, y - 34); ctx.quadraticCurveTo(x + 22, y - 16, x, y - 16); ctx.quadraticCurveTo(x - 22, y - 16, x - 24, y - 34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffb347'; ctx.fillRect(x - 25, y - 37, 50, 5);
      circ(ctx, x - 7, y - 26, 2.2, '#2a1810'); circ(ctx, x + 7, y - 26, 2.2, '#2a1810');
      ctx.strokeStyle = '#2a1810'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y - 24, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    } else if (o.id === 'trueno') { // nube juguetona con rayito
      const f = Math.sin(t * 1.6 + x) * 3, ch = (t * 0.9 + x * 0.013) % 1.6 < 0.35;
      ctx.fillStyle = '#6b5aa8'; redondo(ctx, x - 16, y - 8, 32, 8, 4); ctx.fill();
      if (ch) { ctx.fillStyle = 'rgba(255,230,80,0.35)'; ctx.beginPath(); ctx.arc(x, y - 30, 30, 0, U.TAU); ctx.fill(); }
      rayito(ctx, x + 2, y - 28 + f, 1, ch ? '#fff6a0' : '#ffd23f');
      ctx.fillStyle = '#c9c4e6'; [[-18, -54, 14], [16, -54, 14], [0, -62, 18], [0, -48, 14]].forEach((p) => { ctx.beginPath(); ctx.arc(x + p[0], y + p[1] + f, p[2], 0, U.TAU); ctx.fill(); });
      circ(ctx, x - 6, y - 56 + f, 2, '#2a1810'); circ(ctx, x + 6, y - 56 + f, 2, '#2a1810');
      elip(ctx, x - 12, y - 51 + f, 4, 2.5, 'rgba(255,150,180,0.5)'); elip(ctx, x + 12, y - 51 + f, 4, 2.5, 'rgba(255,150,180,0.5)');
    } else if (o.id === 'mar') { // almeja con perla
      const ab = 0.25 + (Math.sin(t * 1.3 + x) * 0.5 + 0.5) * 0.35;
      ctx.fillStyle = '#ff8fa8'; ctx.beginPath(); ctx.moveTo(x - 26, y - 8); ctx.quadraticCurveTo(x, y + 6, x + 26, y - 8); ctx.quadraticCurveTo(x, y - 20, x - 26, y - 8); ctx.fill();
      circ(ctx, x, y - 16, 8, '#fff8f0', '#e0c8d8', 1.5); circ(ctx, x - 3, y - 19, 2.5, '#ffffff');
      ctx.save(); ctx.translate(x - 26, y - 10); ctx.rotate(-ab);
      ctx.fillStyle = '#ffb3c9'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(26, -34, 52, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(200,80,110,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); for (const dx of [14, 26, 38]) { ctx.moveTo(26, -2); ctx.lineTo(dx, -18); } ctx.stroke();
      ctx.restore();
      const bb = (t * 0.8 + x * 0.01) % 1; circ(ctx, x + 14, y - 40 - bb * 40, 3 + bb * 2, null, `rgba(255,255,255,${1 - bb})`, 1.5);
    } else if (o.id === 'arena') { // vasija con cactus
      ctx.fillStyle = '#3fae5a'; redondo(ctx, x - 8, y - 78, 16, 58, 8); ctx.fill();
      redondo(ctx, x - 22, y - 60, 9, 22, 4.5); ctx.fill(); ctx.fillRect(x - 18, y - 44, 12, 7);
      redondo(ctx, x + 13, y - 68, 9, 22, 4.5); ctx.fill(); ctx.fillRect(x + 6, y - 52, 12, 7);
      ctx.fillStyle = '#66cc78'; redondo(ctx, x - 5, y - 74, 4, 48, 2); ctx.fill();
      circ(ctx, x, y - 80, 5, '#ff5d8f'); circ(ctx, x, y - 80, 2, '#ffd23f');
      ctx.fillStyle = '#e0703c'; ctx.beginPath(); ctx.moveTo(x - 14, y - 34); ctx.lineTo(x + 14, y - 34); ctx.quadraticCurveTo(x + 26, y - 14, x + 12, y); ctx.lineTo(x - 12, y); ctx.quadraticCurveTo(x - 26, y - 14, x - 14, y - 34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2fb5a3'; ctx.fillRect(x - 20, y - 20, 40, 5); ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 16, y - 38, 32, 6);
    } else { // adorno genérico: estrellita sobre un pedestal
      ctx.fillStyle = '#e8d8c0'; redondo(ctx, x - 12, y - 30, 24, 30, 5); ctx.fill();
      ctx.fillStyle = '#ffd23f'; estrella(ctx, x, y - 44 + Math.sin(t * 2 + x) * 2, 13, 5, 0.5); ctx.fill();
    }
  };

  // ---------- Príncipes ----------
  // Accesorio chiquito sobre la túnica (se ve también en el retrato del diálogo)
  function accesorio(g, P, t) {
    if (P.acc === 'bufanda') { // bufanda de hielo
      g.fillStyle = '#3f8fd6'; redondo(g, -12, -52, 24, 7, 3.5); g.fill();
      g.save(); g.translate(-9, -47); g.rotate(0.25 + Math.sin(t * 2) * 0.08); redondo(g, -3, 0, 7, 15, 3); g.fill(); g.restore();
      g.fillStyle = '#ffffff'; for (const dx of [-7, 0, 7]) g.fillRect(dx - 1, -52, 2, 7);
    } else if (P.acc === 'medallon') { // medallón de luna
      g.strokeStyle = '#ffe9a8'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-7, -47); g.lineTo(1, -39); g.lineTo(8, -47); g.stroke();
      circ(g, 1, -37, 5, '#ffd23f', '#d98500', 1); circ(g, 0, -37, 3.2, '#fff6c8'); circ(g, 1.8, -38.2, 2.8, '#ffd23f');
    } else if (P.acc === 'llamita') { // broche de llamita
      llama(g, 2, -34, 10 + Math.sin(t * 7) * 1.2, 1, '#ffd23f'); llama(g, 2, -34, 5.5, 0.5, '#fff3a0');
    } else if (P.acc === 'rayo') { rayito(g, 2, -39, 0.45, '#ffe14d'); } // broche de rayito
    else if (P.acc === 'concha') { // collar con conchita
      g.strokeStyle = '#fff1c8'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-7, -47); g.quadraticCurveTo(1, -38, 8, -47); g.stroke();
      g.fillStyle = '#ffb3c9'; g.beginPath(); g.moveTo(1, -37); g.lineTo(-4, -42); g.quadraticCurveTo(1, -47, 6, -42); g.closePath(); g.fill();
      g.strokeStyle = '#e07a96'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(1, -37); g.lineTo(1, -44); g.moveTo(1, -37); g.lineTo(-2, -43); g.moveTo(1, -37); g.lineTo(4, -43); g.stroke();
    }
  }

  // Dibuja un príncipe con los pies en (0,0) mirando a la derecha.
  D.figuraPrincipe = function (g, id, o) {
    const P = PRINCIPE[id], t = o.t, resp = Math.sin(t * 2.2) * 1.1 + 1.1;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.translate(0, -resp);
    // capa
    const ond = Math.sin(t * 2) * 2;
    g.fillStyle = P.capa; g.beginPath(); g.moveTo(-11, -46); g.lineTo(9, -46); g.lineTo(13 + ond, -8);
    g.quadraticCurveTo(4, -3, -4, -8); g.quadraticCurveTo(-12, -3, -20 + ond, -8); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 1.5; g.stroke();
    // piernas y botas
    g.strokeStyle = P.pantalon; g.lineWidth = 8; g.beginPath(); g.moveTo(-5, -22); g.lineTo(-5, -5 + resp); g.moveTo(5, -22); g.lineTo(5, -5 + resp); g.stroke();
    elip(g, -3, -1 + resp, 8, 5, '#6b3f22'); elip(g, 8, -1 + resp, 8, 5, '#6b3f22');
    // brazo de atrás
    g.strokeStyle = P.tunica; g.lineWidth = 7; g.beginPath(); g.moveTo(-9, -42); g.lineTo(-13, -28); g.stroke(); circ(g, -13, -27, 3.6, P.pielS);
    // túnica
    g.fillStyle = P.tunica; redondo(g, -12, -48, 24, 30, 8); g.fill();
    g.fillStyle = P.tunicaL; redondo(g, -12, -48, 12, 30, 7); g.fill();
    g.fillStyle = '#ffd23f'; g.fillRect(-1.5, -47, 3, 26); redondo(g, -13, -27, 26, 5, 2.5); g.fill();
    circ(g, 0, -24.5, 3.2, '#fff6b0', '#d98500', 1);
    g.fillStyle = '#ffd23f'; redondo(g, -13, -50, 9, 6, 3); g.fill(); redondo(g, 4, -50, 9, 6, 3); g.fill();
    accesorio(g, P, t);
    // cabeza
    g.save(); g.translate(1, -64);
    if (P.peinado === 'rizos') [[-14, -6, 9], [-16, 4, 8], [-8, -15, 9], [3, -18, 9], [13, -13, 8]].forEach((p) => circ(g, p[0], p[1], p[2], P.pelo));
    else if (P.peinado === 'estrellado') { circ(g, -2, -1, 19.5, P.pelo); g.fillStyle = P.pelo; redondo(g, -21, -4, 20, 30, 9); g.fill(); g.fillStyle = P.peloL; redondo(g, -18, 4, 5, 20, 2.5); g.fill(); }
    else if (P.peinado === 'olas') { circ(g, -2, -1, 19.5, P.pelo); [[-17, 9, 7], [-13, 15, 6], [-19, 1, 6]].forEach((p) => circ(g, p[0], p[1], p[2], P.pelo)); g.strokeStyle = P.peloL; g.lineWidth = 1.6; g.beginPath(); g.arc(-15, 12, 3.5, 0.3, Math.PI * 1.6); g.stroke(); }
    else if (P.peinado === 'escarcha') { circ(g, -2, -1, 19.5, P.pelo); g.fillStyle = P.pelo; g.beginPath(); g.moveTo(-20, -2); g.lineTo(-24, 8); g.lineTo(-17, 6); g.lineTo(-18, 14); g.lineTo(-11, 8); g.closePath(); g.fill(); }
    else if (P.peinado === 'turbante') { circ(g, -2, 0, 19, P.pelo); circ(g, -14, 8, 6, P.pelo); }
    else circ(g, -2, -1, 19.5, P.pelo);
    circ(g, 0, 0, 18, P.piel);
    circ(g, -16, 3, 3.3, P.pielS);
    // peinado de adelante
    g.fillStyle = P.pelo;
    if (P.peinado === 'ondas') { g.beginPath(); g.arc(0, 0, 18.6, Math.PI * 0.95, Math.PI * 1.92); g.quadraticCurveTo(10, -6, 4, -9); g.quadraticCurveTo(-2, -4, -8, -8); g.quadraticCurveTo(-13, -3, -17.5, 1); g.closePath(); g.fill(); g.strokeStyle = P.peloL; g.lineWidth = 1.6; g.beginPath(); g.arc(-2, 0, 14, Math.PI * 1.2, Math.PI * 1.6); g.stroke(); }
    else if (P.peinado === 'rizos') { [[-10, -12, 8], [0, -15, 8], [10, -12, 7], [-15, -4, 6]].forEach((p) => circ(g, p[0], p[1], p[2], P.pelo)); circ(g, -4, -17, 2.5, P.peloL); circ(g, 8, -15, 2, P.peloL); }
    else if (P.peinado === 'puntas') { g.beginPath(); g.arc(0, 0, 18.6, Math.PI * 0.95, Math.PI * 1.95); g.lineTo(12, -8); g.lineTo(8, -15); g.lineTo(4, -7); g.lineTo(0, -16); g.lineTo(-5, -7); g.lineTo(-10, -14); g.lineTo(-13, -4); g.closePath(); g.fill(); g.fillStyle = P.peloL; g.beginPath(); g.moveTo(0, -16); g.lineTo(-5, -7); g.lineTo(-2, -8); g.closePath(); g.fill(); }
    else if (P.peinado === 'escarcha') { // mechones de hielo que terminan en puntita
      g.beginPath(); g.arc(0, 0, 18.6, Math.PI * 0.95, Math.PI * 1.95); g.lineTo(13, -10); g.lineTo(10, -7.5); g.lineTo(7, -11); g.lineTo(3, -7.5); g.lineTo(-1, -11); g.lineTo(-5, -6); g.lineTo(-9, -10); g.lineTo(-13, -2); g.closePath(); g.fill();
      g.fillStyle = P.peloL; [[-9, -10, -5], [-1, -11, 3], [7, -11, 10]].forEach((p) => { g.beginPath(); g.moveTo(p[0], p[1] - 6); g.lineTo(p[2], p[1] - 6); g.lineTo((p[0] + p[2]) / 2, p[1] + 3); g.closePath(); g.fill(); });
      const d = (t * 0.9) % 2.2; if (d < 0.5) { g.fillStyle = '#fff'; estrella(g, 10, -14, Math.sin((d / 0.5) * Math.PI) * 4.5, 4, 0.25); g.fill(); }
    } else if (P.peinado === 'estrellado') { // flequillo de noche con estrellitas
      g.beginPath(); g.arc(0, 0, 18.6, Math.PI * 0.95, Math.PI * 1.92); g.quadraticCurveTo(8, -5, 2, -9); g.quadraticCurveTo(-8, -5, -17.5, 2); g.closePath(); g.fill();
      g.fillStyle = '#fff2b0'; [[-9, -11, 2.6, 0], [-1, -15, 2, 1.7], [-16, 6, 2.2, 3.1], [7, -13, 1.8, 4.4]].forEach((p) => { estrella(g, p[0], p[1], p[2] * (0.8 + 0.35 * Math.sin(t * 3 + p[3])), 5, 0.45); g.fill(); });
    } else if (P.peinado === 'llamas') { // pelo en forma de llamita
      const f = Math.sin(t * 6) * 1.5;
      [[-15, -6, 20, -7], [-6, -12, 26, -5], [4, -12, 23, -3], [12, -7, 16, -2]].forEach((p, k) => llama(g, p[0], p[1] + 4, p[2] + (k % 2 ? f : -f), p[3] + f * 0.4, P.pelo));
      g.fillStyle = P.pelo; g.beginPath(); g.arc(0, 0, 18.6, Math.PI * 0.95, Math.PI * 1.95); g.lineTo(12, -9); g.quadraticCurveTo(7, -5, 3, -9); g.quadraticCurveTo(-3, -5, -8, -8); g.quadraticCurveTo(-13, -3, -17.5, 1); g.closePath(); g.fill();
      [[-7, -12, 15, -4], [4, -12, 12, -2]].forEach((p) => llama(g, p[0], p[1] + 2, p[2] - f * 0.5, p[3], P.peloL));
    } else if (P.peinado === 'electrico') { // pelo de punta en zigzag
      g.beginPath(); g.moveTo(-18, 3); g.lineTo(-23, -11); g.lineTo(-15, -12); g.lineTo(-15, -24); g.lineTo(-6, -17); g.lineTo(-2, -29); g.lineTo(4, -18); g.lineTo(12, -26); g.lineTo(12, -15); g.lineTo(21, -16); g.lineTo(16, -7);
      g.lineTo(12, -9); g.lineTo(9, -5.5); g.lineTo(5, -9); g.lineTo(1, -6); g.lineTo(-4, -10); g.lineTo(-8, -6); g.lineTo(-12, -9); g.lineTo(-16, 0); g.closePath(); g.fill();
      g.strokeStyle = P.peloL; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-8, -20); g.lineTo(-5, -14); g.lineTo(-8, -13); g.lineTo(-5, -8); g.stroke();
    } else if (P.peinado === 'olas') { // flequillo ondulado como olas
      g.beginPath(); g.arc(0, 0, 18.6, Math.PI * 0.95, Math.PI * 1.95); g.lineTo(14, -8); g.quadraticCurveTo(12, -3, 8, -8); g.quadraticCurveTo(5, -3, 1, -8); g.quadraticCurveTo(-3, -3, -7, -8); g.quadraticCurveTo(-12, -2, -17.5, 1); g.closePath(); g.fill();
      g.strokeStyle = P.peloL; g.lineWidth = 1.6; g.beginPath(); g.arc(-6, -13, 3, Math.PI * 0.2, Math.PI * 1.5); g.moveTo(7, -14); g.arc(4, -14, 3, 0, Math.PI * 1.3); g.stroke();
    } else if (P.peinado === 'turbante') { // pañuelo dorado enroscado
      g.fillStyle = P.panuelo; g.beginPath(); g.arc(0, -4, 20.5, Math.PI * 0.97, Math.PI * 2.03); g.quadraticCurveTo(0, -20, -20.5, -3); g.closePath(); g.fill();
      g.strokeStyle = P.panueloS; g.lineWidth = 1.6; g.stroke();
      g.beginPath(); g.moveTo(-17, -12); g.quadraticCurveTo(0, -24, 17, -13); g.moveTo(-19, -5); g.quadraticCurveTo(-2, -20, 18, -6); g.stroke();
      circ(g, 9, -10, 3.2, P.gema, '#ffffff', 1.2);
      circ(g, -19, -8, 5.5, P.panuelo, P.panueloS, 1.4); g.fillStyle = P.panuelo; redondo(g, -24, -6, 7, 13, 3.5); g.fill(); g.stroke();
    } else { [[-12, -10, 9], [-2, -15, 10], [10, -12, 8], [-17, -1, 6]].forEach((p) => circ(g, p[0], p[1], p[2], P.pelo)); circ(g, -4, -18, 3.5, P.peloL); circ(g, 8, -15, 2.5, P.peloL); }
    // corona
    g.save(); g.translate(1, -19); g.rotate(-0.06);
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#d98500'; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(-10, 3); g.lineTo(-10, -6); g.lineTo(-5, -1); g.lineTo(0, -8); g.lineTo(5, -1); g.lineTo(10, -6); g.lineTo(10, 3); g.closePath(); g.fill(); g.stroke();
    circ(g, 0, -1, 2.3, P.gema); g.restore();
    // carita
    elip(g, 0, 8, 4, 2.4, 'rgba(255,120,130,0.4)'); elip(g, 14, 7, 3.2, 2.2, 'rgba(255,120,130,0.4)');
    const cerrados = (t + id.length * 0.7) % 3.9 < 0.13;
    if (cerrados) { g.strokeStyle = '#2a1810'; g.lineWidth = 2.2; g.beginPath(); g.arc(4, 1, 3.2, 0.15, Math.PI - 0.15); g.stroke(); g.beginPath(); g.arc(12.5, 1, 3, 0.15, Math.PI - 0.15); g.stroke(); }
    else { elip(g, 4, 1, 3, 4.1, '#2a1810'); elip(g, 12.5, 1, 2.8, 3.9, '#2a1810'); circ(g, 5, -0.5, 1.3, '#fff'); circ(g, 13.3, -0.5, 1.2, '#fff'); }
    g.strokeStyle = P.ceja || P.pelo; g.lineWidth = 2; g.beginPath(); g.moveTo(0.5, -6); g.lineTo(7, -6.5); g.moveTo(10, -6.5); g.lineTo(15.5, -6); g.stroke();
    if (o.hablando) { const ab = 2.2 + Math.abs(Math.sin(t * 13)) * 3.6; elip(g, 8.5, 9, 4.2, ab, '#8c2f3f'); }
    else { g.strokeStyle = '#8c2f3f'; g.lineWidth = 2; g.beginPath(); g.arc(8.5, 6.5, 5.2, 0.2, Math.PI - 0.2); g.stroke(); }
    g.restore();
    // brazo de adelante (saluda cuando Julieth está cerca)
    const a = o.saluda ? 2.5 + Math.sin(t * 9) * 0.35 : 0.2, L = o.saluda ? 19 : 15;
    const hx = 9 + Math.sin(a) * L, hy = -42 + Math.cos(a) * L;
    g.strokeStyle = P.tunicaL; g.lineWidth = 7; g.beginPath(); g.moveTo(9, -42); g.lineTo(hx, hy); g.stroke(); circ(g, hx, hy, 3.8, P.piel);
    g.restore();
  };

  // ---------- Espejo mágico: marco dorado ovalado sobre un pie, con una carita amable en el vidrio ----------
  D.caraEspejo = function (g, x, y, e, t, o) { // carita del Espejito Mágico; (x,y) = centro, e = escala
    o = o || {};
    const a = o.alfa === undefined ? 1 : o.alfa;
    if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(e, e);
    const fl = Math.sin(t * 2) * 1.5;
    g.translate(0, fl);
    const hl = g.createRadialGradient(0, -4, 2, 0, 0, 34);
    hl.addColorStop(0, 'rgba(255,255,255,0.95)'); hl.addColorStop(0.6, 'rgba(210,200,255,0.75)'); hl.addColorStop(1, 'rgba(170,150,255,0)');
    g.fillStyle = hl; g.beginPath(); g.arc(0, 0, 34, 0, U.TAU); g.fill();
    // ojitos dulces
    const parpadeo = (t % 4.2) < 0.14;
    g.strokeStyle = '#5a3fa0'; g.fillStyle = '#5a3fa0'; g.lineWidth = 2.6; g.lineCap = 'round';
    for (const ox of [-10, 10]) {
      if (parpadeo || o.feliz) { g.beginPath(); g.arc(ox, -3, 5, Math.PI + 0.3, -0.3); g.stroke(); }
      else { elip(g, ox, -4, 4.2, 5.4, '#5a3fa0'); circ(g, ox + 1.4, -6, 1.6, '#fff'); }
    }
    elip(g, -17, 6, 5, 3, 'rgba(255,130,170,0.55)'); elip(g, 17, 6, 5, 3, 'rgba(255,130,170,0.55)');
    if (o.hablando) { const ab = 2 + Math.abs(Math.sin(t * 12)) * 5; elip(g, 0, 9, 6, ab, '#8c2f6f'); }
    else { g.strokeStyle = '#8c2f6f'; g.lineWidth = 2.6; g.beginPath(); g.arc(0, 5, 7, 0.25, Math.PI - 0.25); g.stroke(); }
    g.restore();
  };

  D.dibEspejo = function (ctx, o, t, jx, jy) {
    const x = o.x, y = o.y, tt = t + o.fase, cerca = Math.hypot(jx - x, jy - y) < 150;
    const ORO = '#ffc93c', ORO_S = '#d98a00', ORO_L = '#fff0a8';
    D.sombra(ctx, x, y, 38, 0.24);
    // pie: patitas y columna
    ctx.lineWidth = 3; ctx.strokeStyle = TINTA;
    ctx.fillStyle = ORO_S; redondo(ctx, x - 34, y - 12, 68, 14, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ORO; redondo(ctx, x - 8, y - 52, 16, 42, 6); ctx.fill(); ctx.stroke();
    circ(ctx, x, y - 52, 10, ORO); ctx.stroke();
    // marco ovalado
    const cy = y - 128, rx = 46, ry = 66;
    ctx.fillStyle = ORO_S; ctx.beginPath(); ctx.ellipse(x, cy, rx + 12, ry + 12, 0, 0, U.TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ORO; ctx.beginPath(); ctx.ellipse(x, cy, rx + 8, ry + 8, 0, 0, U.TAU); ctx.fill();
    // bolitas del marco
    for (let k = 0; k < 14; k++) { const a = k / 14 * U.TAU; circ(ctx, x + Math.cos(a) * (rx + 8), cy + Math.sin(a) * (ry + 8), 3.2, ORO_L); }
    // corona con gema arriba
    ctx.fillStyle = ORO; ctx.beginPath();
    ctx.moveTo(x - 22, cy - ry - 8); ctx.lineTo(x - 24, cy - ry - 30); ctx.lineTo(x - 11, cy - ry - 18); ctx.lineTo(x, cy - ry - 36);
    ctx.lineTo(x + 11, cy - ry - 18); ctx.lineTo(x + 24, cy - ry - 30); ctx.lineTo(x + 22, cy - ry - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    circ(ctx, x, cy - ry - 18, 5, D.PRINCIPE[o.id] ? D.PRINCIPE[o.id].gema : '#ff5d8f'); ctx.stroke();
    // vidrio plateado con brillo que pasa
    const gr = ctx.createLinearGradient(x - rx, cy - ry, x + rx, cy + ry);
    gr.addColorStop(0, '#eef4ff'); gr.addColorStop(0.5, '#b9c8f0'); gr.addColorStop(1, '#8e9fd8');
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, U.TAU); ctx.fillStyle = gr; ctx.fill(); ctx.clip();
    const pasa = ((tt * 0.35) % 1.6) - 0.3, bx = x - rx + pasa * rx * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath();
    ctx.moveTo(bx - 10, cy - ry); ctx.lineTo(bx + 8, cy - ry); ctx.lineTo(bx - 22, cy + ry); ctx.lineTo(bx - 40, cy + ry); ctx.closePath(); ctx.fill();
    D.caraEspejo(ctx, x, cy + 2, 1.05, tt, { alfa: 0.55 + Math.sin(tt * 1.6) * 0.25 + (cerca ? 0.2 : 0), feliz: cerca });
    ctx.restore();
    ctx.strokeStyle = TINTA; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, U.TAU); ctx.stroke();
    // destellos alrededor
    for (let k = 0; k < 4; k++) {
      const a = tt * 0.8 + k * U.TAU / 4, r = 1 + Math.sin(tt * 3 + k) * 0.5;
      ctx.fillStyle = 'rgba(255,250,200,' + (0.5 + 0.4 * Math.sin(tt * 4 + k)) + ')';
      estrella(ctx, x + Math.cos(a) * (rx + 26), cy + Math.sin(a) * (ry + 20), 5 * r, 4, 0.4); ctx.fill();
    }
    // globito: "¡pregúntame!"
    if (cerca) {
      const b = Math.sin(t * 3) * 3, gx = x + 44, gy = cy - ry - 30 + b;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5;
      redondo(ctx, gx - 22, gy - 16, 44, 30, 13); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b48cff'; estrella(ctx, gx, gy - 1, 10, 4, 0.42); ctx.fill();
    }
  };

  D.dibPrincipe = function (ctx, p, t, jx, jy) {
    const cerca = Math.hypot(jx - p.x, jy - p.y) < 150, hablando = J.Dialogo.abierto && J.Dialogo.principe === p;
    if (Math.abs(jx - p.x) > 12) p.dir = jx > p.x ? 1 : -1;
    D.sombra(ctx, p.x, p.y, 21, 0.26);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.dir * 1.32, 1.32);
    D.figuraPrincipe(ctx, p.id, { t: t + p.fase, saluda: cerca && !hablando, hablando: hablando && J.Dialogo.escribiendo });
    ctx.restore();
    // globito de "hablemos"
    if (!hablando) {
      const b = Math.sin(t * 3) * 3, gx = p.x + 30, gy = p.y - 128 + b;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5;
      redondo(ctx, gx - 22, gy - 16, 44, 30, 13); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx - 10, gy + 13); ctx.lineTo(gx - 16, gy + 24); ctx.lineTo(gx - 2, gy + 13); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(gx - 11, gy + 10, 10, 4);
      for (let i = 0; i < 3; i++) circ(ctx, gx - 10 + i * 10, gy - 1 + (Math.floor(t * 3) % 3 === i ? -3 : 0), 3, D.PRINCIPE[p.id].tunica);
    }
  };
  // =====================================================================
  // ---------- El Huerto: jardín de infantes (hall, aulas, escaleras, pizarrón, pupitres y seños) ----------
  // =====================================================================
  const FUENTE = (px) => `900 ${px}px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif`;
  function texto(g, str, x, y, px, color, maxW) { // texto centrado; se angosta si no entra
    g.font = FUENTE(px); g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(str).width, k = maxW && w > maxW ? maxW / w : 1;
    if (k < 1) { g.save(); g.translate(x, y); g.scale(k, 1); g.fillText(str, 0, 0); g.restore(); } else g.fillText(str, x, y);
  }
  const MATERIA = {
    matematica: { nombre: 'Matemática', color: '#3f8fd6' },
    lectura: { nombre: 'Lectura', color: '#d9467e' },
    modales: { nombre: 'Modales', color: '#3a9a4f' },
    ingles: { nombre: 'Inglés', color: '#d9662a' }
  };
  D.MATERIA = MATERIA;
  const COLORES = ['#ff8fb5', '#ffd23f', '#7fc8ff', '#7fd36b', '#c9a2ff', '#ffa95a'];

  function banderaUSA(g, x, y, w, h) { // banderita de Estados Unidos; (x,y) = esquina superior izquierda
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = '#fff'; g.fillRect(x, y, w, h);
    const f = h / 13; g.fillStyle = '#d8323c';
    for (let k = 0; k < 13; k += 2) g.fillRect(x, y + k * f, w, f);
    const cw = w * 0.42, ch = f * 7;
    g.fillStyle = '#2f4fb0'; g.fillRect(x, y, cw, ch);
    g.fillStyle = '#fff'; const r = Math.max(0.5, ch * 0.06);
    for (let fi = 0; fi < 4; fi++) for (let co = 0; co < 5; co++) {
      g.beginPath(); g.arc(x + cw * (co + 0.5 + (fi % 2) * 0.25 - 0.1) / 5.2, y + ch * (fi + 0.5) / 4, r, 0, Math.PI * 2); g.fill();
    }
    g.restore(); g.lineCap = 'round';
  }
  // Iconito dibujado de cada materia (sin emojis); (x,y) = centro, s ≈ radio
  function iconoMateria(g, m, x, y, s) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    if (m === 'matematica') { // ábaco
      g.fillStyle = '#fff6e0'; redondo(g, x - s, y - s * 0.8, s * 2, s * 1.6, s * 0.25); g.fill();
      g.strokeStyle = '#a8683a'; g.lineWidth = Math.max(1.5, s * 0.18); g.stroke();
      g.lineWidth = Math.max(1, s * 0.08); g.strokeStyle = '#8a5a2e';
      for (let k = 0; k < 3; k++) { const yy = y - s * 0.4 + k * s * 0.4; g.beginPath(); g.moveTo(x - s * 0.85, yy); g.lineTo(x + s * 0.85, yy); g.stroke(); for (let b = 0; b < 3; b++) circ(g, x - s * 0.55 + b * s * 0.32 + k * s * 0.12, yy, s * 0.15, ['#ff5d8f', '#ffd23f', '#5fb7e8'][k]); }
    } else if (m === 'lectura') { // libro abierto
      g.fillStyle = '#fff'; g.strokeStyle = '#d9467e'; g.lineWidth = Math.max(1.5, s * 0.16);
      g.beginPath(); g.moveTo(x, y - s * 0.55); g.quadraticCurveTo(x - s * 0.5, y - s * 0.8, x - s, y - s * 0.6); g.lineTo(x - s, y + s * 0.6); g.quadraticCurveTo(x - s * 0.5, y + s * 0.4, x, y + s * 0.65);
      g.quadraticCurveTo(x + s * 0.5, y + s * 0.4, x + s, y + s * 0.6); g.lineTo(x + s, y - s * 0.6); g.quadraticCurveTo(x + s * 0.5, y - s * 0.8, x, y - s * 0.55); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(x, y - s * 0.55); g.lineTo(x, y + s * 0.65); g.stroke();
      g.strokeStyle = 'rgba(90,60,120,0.5)'; g.lineWidth = Math.max(1, s * 0.08);
      for (let k = 0; k < 3; k++) { const yy = y - s * 0.25 + k * s * 0.25; g.beginPath(); g.moveTo(x - s * 0.8, yy); g.lineTo(x - s * 0.2, yy); g.moveTo(x + s * 0.2, yy); g.lineTo(x + s * 0.8, yy); g.stroke(); }
    } else if (m === 'modales') { // tulipán
      g.strokeStyle = '#3a9a4f'; g.lineWidth = Math.max(1.5, s * 0.16); g.beginPath(); g.moveTo(x, y + s); g.lineTo(x, y - s * 0.1); g.stroke();
      g.fillStyle = '#4cc45f'; g.beginPath(); g.ellipse(x + s * 0.32, y + s * 0.5, s * 0.34, s * 0.14, -0.6, 0, U.TAU); g.fill();
      g.fillStyle = '#ff5d8f'; g.beginPath(); g.moveTo(x - s * 0.6, y - s * 0.75); g.lineTo(x - s * 0.3, y - s * 0.35); g.lineTo(x, y - s * 0.85); g.lineTo(x + s * 0.3, y - s * 0.35); g.lineTo(x + s * 0.6, y - s * 0.75);
      g.quadraticCurveTo(x + s * 0.65, y + s * 0.1, x, y + s * 0.1); g.quadraticCurveTo(x - s * 0.65, y + s * 0.1, x - s * 0.6, y - s * 0.75); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(x - s * 0.25, y - s * 0.3, s * 0.1, s * 0.25, 0.2, 0, U.TAU); g.fill();
    } else if (m === 'ingles') { // banderita en un palito
      g.strokeStyle = '#8a5a2e'; g.lineWidth = Math.max(1.5, s * 0.14); g.beginPath(); g.moveTo(x - s * 0.8, y + s); g.lineTo(x - s * 0.8, y - s * 0.9); g.stroke();
      banderaUSA(g, x - s * 0.75, y - s * 0.9, s * 1.7, s * 1.1);
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.strokeRect(x - s * 0.75, y - s * 0.9, s * 1.7, s * 1.1);
    } else { g.fillStyle = '#ff8a3d'; estrella(g, x, y, s, 5, 0.45); g.fill(); }
    g.restore();
  }
  D.iconoMateria = iconoMateria;

  // ventanas redondas del Huerto (posición fija para la parte fija y la viva)
  function ventanasHuerto(s) {
    if (!s.aula) return [{ x: s.x0 + 76, y: s.y0 - 160, r: 34 }, { x: s.x1 - 76, y: s.y0 - 160, r: 34 }];
    const v = s.ventanas || [s.x0 + (s.x1 - s.x0) * 0.12, 0, 0, s.x0 + (s.x1 - s.x0) * 0.88];
    return [{ x: v[0], y: s.y0 - 142, r: 42 }, { x: v[3], y: s.y0 - 142, r: 42 }];
  }
  function perchero(ctx, x0, x1, y) { // tabla con ganchitos y mochilitas colgadas
    ctx.fillStyle = '#c98a4f'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2; redondo(ctx, x0, y - 6, x1 - x0, 11, 4); ctx.fill(); ctx.stroke();
    const n = Math.max(2, Math.floor((x1 - x0) / 30));
    for (let k = 0; k < n; k++) {
      const px = x0 + (x1 - x0) * (k + 0.5) / n, col = COLORES[(k * 2 + Math.round(x0 / 7)) % COLORES.length];
      circ(ctx, px, y, 3, '#ffd23f', '#a8683a', 1.2);
      ctx.strokeStyle = 'rgba(60,40,40,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px - 5, y + 10); ctx.quadraticCurveTo(px, y - 1, px + 5, y + 10); ctx.stroke();
      ctx.fillStyle = col; redondo(ctx, px - 11, y + 8, 22, 27, 7); ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; redondo(ctx, px - 11, y + 8, 22, 10, 6); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; redondo(ctx, px - 7, y + 22, 14, 9, 3); ctx.fill();
      if (k % 2) { ctx.fillStyle = '#fff'; estrella(ctx, px, y + 26, 4, 5, 0.45); ctx.fill(); } else { ctx.fillStyle = '#fff'; D.corazon(ctx, px, y + 25, 3.4); ctx.fill(); }
    }
  }
  function alfombraEva(ctx, cx, cy, nx, ny, L) { // alfombra de goma eva de colores (piezas de rompecabezas)
    const x0 = cx - nx * L / 2, y0 = cy - ny * L / 2;
    ctx.fillStyle = 'rgba(80,50,40,0.18)'; ctx.fillRect(x0 + 4, y0 + 6, nx * L, ny * L);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const c = COLORES[(i + j * 2) % COLORES.length], x = x0 + i * L, y = y0 + j * L;
      ctx.fillStyle = c; ctx.fillRect(x, y, L + 0.5, L + 0.5);
      if (i < nx - 1) circ(ctx, x + L, y + L / 2, L * 0.12, c);
      if (j < ny - 1) circ(ctx, x + L / 2, y + L, L * 0.12, c);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
    for (let i = 1; i < nx; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * L, y0); ctx.lineTo(x0 + i * L, y0 + ny * L); ctx.stroke(); }
    for (let j = 1; j < ny; j++) { ctx.beginPath(); ctx.moveTo(x0, y0 + j * L); ctx.lineTo(x0 + nx * L, y0 + j * L); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(91,42,78,0.35)'; ctx.lineWidth = 2.5; ctx.strokeRect(x0, y0, nx * L, ny * L);
  }
  function afiche(ctx, x, y, m, lado) { // afiche de la materia en la pared; (x,y) = centro
    const W = 116, H = 124, col = MATERIA[m] ? MATERIA[m].color : '#ff5d8f';
    ctx.fillStyle = 'rgba(80,50,40,0.15)'; ctx.fillRect(x - W / 2 + 4, y - H / 2 + 5, W, H);
    ctx.fillStyle = '#fffdf6'; ctx.fillRect(x - W / 2, y - H / 2, W, H);
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.strokeRect(x - W / 2 + 5, y - H / 2 + 5, W - 10, H - 10);
    ctx.fillStyle = 'rgba(255,240,160,0.85)'; ctx.save(); ctx.translate(x - W / 2 + 6, y - H / 2 + 2); ctx.rotate(-0.5); ctx.fillRect(-10, -4, 20, 8); ctx.restore();
    ctx.save(); ctx.translate(x + W / 2 - 6, y - H / 2 + 2); ctx.rotate(0.5); ctx.fillRect(-10, -4, 20, 8); ctx.restore();
    if (m === 'matematica') {
      if (lado < 0) { // figuras
        circ(ctx, x - 24, y - 22, 15, '#ff5d8f', TINTA, 2);
        ctx.fillStyle = '#5fb7e8'; ctx.fillRect(x + 8, y - 37, 30, 30); ctx.strokeStyle = TINTA; ctx.lineWidth = 2; ctx.strokeRect(x + 8, y - 37, 30, 30);
        ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(x - 24, y + 8); ctx.lineTo(x - 6, y + 40); ctx.lineTo(x - 42, y + 40); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7fd36b'; estrella(ctx, x + 23, y + 24, 17, 5, 0.45); ctx.fill(); ctx.stroke();
      } else { // 1 2 3 con puntitos
        [1, 2, 3].forEach((n, i) => {
          const yy = y - 34 + i * 34;
          texto(ctx, String(n), x - 28, yy, 26, ['#ff5d8f', '#3f8fd6', '#3a9a4f'][i]);
          for (let k = 0; k < n; k++) circ(ctx, x + 4 + k * 15, yy, 5.5, ['#ff5d8f', '#3f8fd6', '#3a9a4f'][i]);
        });
      }
    } else if (m === 'lectura') {
      if (lado < 0) { ['MA', 'PA', 'SA'].forEach((sl, i) => texto(ctx, sl, x, y - 34 + i * 34, 28, ['#d9467e', '#3f8fd6', '#d9662a'][i])); }
      else { // A de abeja... y de árbol: "A a" con una manzanita
        texto(ctx, 'A a', x, y - 26, 34, '#d9467e');
        circ(ctx, x, y + 24, 17, '#ff4d5e', TINTA, 2); circ(ctx, x - 6, y + 18, 4, 'rgba(255,255,255,0.6)');
        ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x + 2, y); ctx.stroke();
        ctx.fillStyle = '#4cc45f'; ctx.beginPath(); ctx.ellipse(x + 9, y + 3, 7, 3.5, -0.4, 0, U.TAU); ctx.fill();
      }
    } else if (m === 'modales') {
      ctx.fillStyle = lado < 0 ? '#ff5d8f' : '#ff8fb5'; D.corazon(ctx, x, y - 18, 22); ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = 2; ctx.stroke();
      circ(ctx, x - 7, y - 20, 2.2, TINTA); circ(ctx, x + 7, y - 20, 2.2, TINTA);
      ctx.strokeStyle = TINTA; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 15, 5, 0.3, Math.PI - 0.3); ctx.stroke();
      texto(ctx, lado < 0 ? 'por favor' : 'gracias', x, y + 38, 19, '#3a9a4f', W - 18);
    } else if (m === 'ingles') {
      if (lado < 0) { texto(ctx, 'Hello!', x, y - 28, 26, '#d9662a', W - 16); banderaUSA(ctx, x - 30, y + 2, 60, 38); ctx.strokeStyle = TINTA; ctx.lineWidth = 2; ctx.strokeRect(x - 30, y + 2, 60, 38); }
      else {
        [['red', '#ff4d5e'], ['blue', '#3f8fd6'], ['yellow', '#f2b400']].forEach((c, i) => {
          const yy = y - 34 + i * 34;
          circ(ctx, x - 30, yy, 11, c[1], TINTA, 1.5); texto(ctx, c[0], x + 14, yy, 17, c[1], 60);
        });
      }
    }
  }

  function salaHuertoFija(ctx, s) {
    const T = D.TEMA.huerto, Z = SALA.huerto, w = s.x1 - s.x0, h = s.y1 - s.y0, A = s.alto, cx = s.cx;
    ctx.fillStyle = T.borde; redondo(ctx, s.x0 - 30, s.y0 - A - 30, w + 60, A + h + 60, 20); ctx.fill();
    // pared amarillo pastel con florcitas pintadas
    const gr = ctx.createLinearGradient(0, s.y0 - A, 0, s.y0);
    gr.addColorStop(0, T.muro); gr.addColorStop(1, T.luz);
    ctx.fillStyle = gr; ctx.fillRect(s.x0, s.y0 - A, w, A);
    D.texturaMuro(ctx, T, 'huerto', s.x0, s.y0 - A, w, A - 58);
    ctx.fillStyle = '#ffd98a'; ctx.fillRect(s.x0, s.y0 - A, w, 18);
    ctx.fillStyle = T.detalle; ctx.fillRect(s.x0, s.y0 - A + 18, w, 5);
    // zócalo verde con borde de festones
    ctx.fillStyle = Z.zocalo; ctx.fillRect(s.x0, s.y0 - 58, w, 58);
    ctx.fillStyle = '#b6ec9a'; for (let x = s.x0 + 10; x < s.x1; x += 20) { ctx.beginPath(); ctx.arc(x, s.y0 - 58, 10, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let x = s.x0 + 40; x < s.x1; x += 80) { for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 1.2566) * 4, s.y0 - 24 + Math.sin(k * 1.2566) * 4, 3, 0, U.TAU); ctx.fill(); } }
    // marcos de las ventanas redondas (el cielo se pinta en vivo)
    for (const v of ventanasHuerto(s)) {
      circ(ctx, v.x, v.y, v.r + 9, Z.marco, T.borde, 3);
      ['#ff5d8f', '#ffd23f', '#c38bff', '#ffffff', '#ff8fb5'].forEach((c, i) => { const fx = v.x - v.r * 0.8 + i * v.r * 0.4; elip(ctx, fx - 3, v.y + v.r + 9, 5, 3, '#4cc45f'); circ(ctx, fx, v.y + v.r + 6, 4.5, c); circ(ctx, fx, v.y + v.r + 6, 1.6, '#ff8a3d'); });
      ctx.fillStyle = '#c97a3f'; redondo(ctx, v.x - v.r - 8, v.y + v.r + 9, v.r * 2 + 16, 11, 4); ctx.fill(); ctx.strokeStyle = T.borde; ctx.lineWidth = 2; ctx.stroke();
    }
    if (!s.aula) { // hall: percheros con mochilitas y el emblema
      perchero(ctx, s.x0 + 14, s.x0 + 140, s.y0 - 106); perchero(ctx, s.x1 - 140, s.x1 - 14, s.y0 - 106);
      D.emblema(ctx, 'huerto', cx, s.y0 - 120, 18);
    } else { // aula: afiches de la materia y cartel arriba al centro
      const v = s.ventanas || [0, s.x0 + w * 0.29, s.x0 + w * 0.71];
      afiche(ctx, v[1], s.y0 - 138, s.aula, -1); afiche(ctx, v[2], s.y0 - 138, s.aula, 1);
      const M = MATERIA[s.aula] || { nombre: s.aula, color: TINTA }, by = s.y0 - A + 50;
      ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = M.color; ctx.lineWidth = 3; redondo(ctx, cx - 110, by - 19, 220, 38, 14); ctx.fill(); ctx.stroke();
      iconoMateria(ctx, s.aula, cx - 84, by, 12);
      texto(ctx, 'Sala de ' + M.nombre, cx + 12, by + 1, 18, M.color, 168);
    }
    // piso de tablas de madera clarita
    const ph = 30;
    for (let j = 0, y = s.y0; y < s.y1; j++, y += ph) {
      ctx.fillStyle = Z.piso[j % 2]; ctx.fillRect(s.x0, y, w, Math.min(ph, s.y1 - y) + 0.5);
      ctx.fillStyle = 'rgba(150,100,50,0.22)'; ctx.fillRect(s.x0, y, w, 2);
      for (let x = s.x0 + ((j * 97) % 210) + 30; x < s.x1; x += 210) { ctx.fillRect(x, y, 2, Math.min(ph, s.y1 - y)); if (azar(j, x) < 0.3) elip(ctx, x + 60, y + ph / 2, 5, 2.5, 'rgba(150,100,50,0.18)'); }
    }
    // sombra bajo la pared
    const so = ctx.createLinearGradient(0, s.y0, 0, s.y0 + 54);
    so.addColorStop(0, 'rgba(50,25,60,0.3)'); so.addColorStop(1, 'rgba(50,25,60,0)');
    ctx.fillStyle = so; ctx.fillRect(s.x0, s.y0, w, 54);
    if (!s.aula) {
      alfombraEva(ctx, cx, s.y0 + 360, 6, 3, 62);
      // camino hasta la puerta de salida
      ctx.fillStyle = Z.alfBorde; ctx.fillRect(cx - 50, s.y0 + 453, 100, h - 453 + 30);
      ctx.fillStyle = Z.alfombra; ctx.fillRect(cx - 40, s.y0 + 453, 80, h - 453 + 30);
      ctx.fillStyle = T.detalle; ctx.fillRect(cx - 84, s.y1, 16, 30); ctx.fillRect(cx + 68, s.y1, 16, 30);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(cx - 58, s.y1 + 22, 116, 8);
    } else alfombraEva(ctx, cx, s.y0 + 300, 5, 3, 58);
  }

  // tarjetita colgada de la guirnalda (k = cuál, tipo = hall o materia); origen arriba al centro
  function tarjeta(ctx, tipo, k) {
    const W = 30, H = 34;
    let fondo = '#ffffff';
    if (tipo === 'matematica' || tipo === 'lectura') fondo = COLORES[k % COLORES.length];
    else if (tipo === 'ingles') fondo = k % 2 ? '#ffffff' : ['#ff4d5e', '#3f8fd6', '#f2b400', '#3fae4a'][(k >> 1) % 4];
    else if (tipo === 'modales') fondo = '#fff4f8';
    ctx.fillStyle = fondo; ctx.fillRect(-W / 2, 4, W, H); ctx.strokeStyle = 'rgba(91,42,78,0.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(-W / 2, 4, W, H);
    ctx.fillStyle = '#c98a4f'; ctx.fillRect(-2.5, -1, 5, 9); // broche
    const cy = 4 + H / 2;
    if (tipo === 'matematica') texto(ctx, String((k % 9) + 1), 0, cy + 1, 22, '#fff');
    else if (tipo === 'lectura') texto(ctx, 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'[k % 27], 0, cy + 1, 22, '#fff');
    else if (tipo === 'modales') { ctx.fillStyle = ['#ff5d8f', '#ff8fb5', '#e0508a'][k % 3]; D.corazon(ctx, 0, cy - 1, 9); ctx.fill(); }
    else if (tipo === 'ingles') {
      if (k % 2) banderaUSA(ctx, -12, cy - 8, 24, 16);
      else texto(ctx, ['red', 'blue', 'yellow', 'green'][(k >> 1) % 4], 0, cy + 1, 10, '#fff', 26);
    } else { // dibujitos de los chicos
      const d = k % 6;
      ctx.lineWidth = 2;
      if (d === 0) { circ(ctx, 0, cy, 7, '#ffd23f'); ctx.strokeStyle = '#ffb02e'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.moveTo(Math.cos(a) * 9, cy + Math.sin(a) * 9); ctx.lineTo(Math.cos(a) * 12, cy + Math.sin(a) * 12); } ctx.stroke(); }
      else if (d === 1) { ctx.fillStyle = '#ff8fb5'; ctx.fillRect(-8, cy - 2, 16, 12); ctx.fillStyle = '#ff4d5e'; ctx.beginPath(); ctx.moveTo(-11, cy - 2); ctx.lineTo(0, cy - 11); ctx.lineTo(11, cy - 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#8a5a2e'; ctx.fillRect(-2, cy + 3, 5, 7); }
      else if (d === 2) { ctx.strokeStyle = '#3fae4a'; ctx.beginPath(); ctx.moveTo(0, cy + 13); ctx.lineTo(0, cy); ctx.stroke(); for (let i = 0; i < 5; i++) circ(ctx, Math.cos(i * 1.2566) * 5, cy - 3 + Math.sin(i * 1.2566) * 5, 3.5, '#c38bff'); circ(ctx, 0, cy - 3, 2.5, '#ffd23f'); }
      else if (d === 3) { ctx.fillStyle = '#ff5d8f'; D.corazon(ctx, 0, cy - 1, 8); ctx.fill(); }
      else if (d === 4) { ['#ff5d8f', '#ffd23f', '#7fc8ff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, cy + 8, 11 - i * 3.5, Math.PI, 0); ctx.stroke(); }); }
      else { elip(ctx, -1, cy, 9, 5.5, '#5fb7e8'); ctx.fillStyle = '#5fb7e8'; ctx.beginPath(); ctx.moveTo(7, cy); ctx.lineTo(13, cy - 5); ctx.lineTo(13, cy + 5); ctx.closePath(); ctx.fill(); circ(ctx, -5, cy - 1, 1.5, TINTA); }
    }
  }
  function guirnalda(ctx, s, t) {
    const tipo = s.aula || 'hall', y = s.y0 - s.alto + 30, x0 = s.x0 + 14, x1 = s.x1 - 14, N = 5, tramo = (x1 - x0) / N;
    let k = 0;
    for (let i = 0; i < N; i++) {
      const a = x0 + i * tramo, b = a + tramo, sag = s.aula ? 16 : 6;
      if (s.aula && a < s.cx + 115 && b > s.cx - 115) continue; // ahí va el cartel de la sala
      ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a, y); ctx.quadraticCurveTo((a + b) / 2, y + sag * 2, b, y); ctx.stroke();
      circ(ctx, a, y, 3.5, '#ff5d8f'); circ(ctx, b, y, 3.5, '#ff5d8f');
      for (let m = 0; m < 4; m++, k++) {
        const u = (m + 0.5) / 4, px = a + tramo * u, py = y + sag * 4 * u * (1 - u);
        ctx.save(); ctx.translate(px, py); ctx.rotate(Math.sin(t * 1.5 + k * 0.9) * 0.07); tarjeta(ctx, tipo, k); ctx.restore();
      }
    }
  }
  function salaHuertoViva(ctx, s, t) {
    const Ci = J.Cielo, Z = SALA.huerto;
    ventanasHuerto(s).forEach((v, i) => { // el cielo de afuera por las ventanas redondas
      ctx.save(); ctx.beginPath(); ctx.arc(v.x, v.y, v.r, 0, U.TAU); ctx.clip();
      const gr = ctx.createLinearGradient(0, v.y - v.r, 0, v.y + v.r);
      gr.addColorStop(0, U.rgb(Ci.cielo)); gr.addColorStop(1, U.rgb(U.mezclaColor(Ci.cielo, [255, 255, 255], 0.45)));
      ctx.fillStyle = gr; ctx.fillRect(v.x - v.r, v.y - v.r, v.r * 2, v.r * 2);
      if (Ci.noche > 0.1) {
        ctx.fillStyle = `rgba(255,250,220,${Ci.noche})`;
        [[-14, -16, 4], [12, -6, 4.5], [-4, 12, 3.5]].forEach((p, k) => { estrella(ctx, v.x + p[0], v.y + p[1], p[2] * (0.8 + 0.3 * Math.sin(t * 3 + k + i)), 4, 0.3); ctx.fill(); });
      } else {
        const nx = v.x - v.r - 30 + ((t * 7 + i * 37) % (v.r * 2 + 60));
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        [[0, 0, 9], [10, -3, 11], [21, 1, 8]].forEach((p) => { ctx.beginPath(); ctx.arc(nx + p[0], v.y - 10 + p[1], p[2], 0, U.TAU); ctx.fill(); });
        ctx.fillStyle = '#6fdc5f'; ctx.beginPath(); ctx.ellipse(v.x, v.y + v.r + 8, v.r * 1.3, v.r * 0.6, 0, 0, U.TAU); ctx.fill();
        circ(ctx, v.x + v.r * 0.4, v.y + v.r * 0.55, 4, '#ffd23f');
      }
      ctx.restore();
      ctx.strokeStyle = Z.marco; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(v.x, v.y - v.r); ctx.lineTo(v.x, v.y + v.r); ctx.moveTo(v.x - v.r, v.y); ctx.lineTo(v.x + v.r, v.y); ctx.stroke();
    });
    guirnalda(ctx, s, t);
    if (!s.aula) { // flechas que marcan la salida (solo en el hall)
      const k = (t * 1.6) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.9 - k * 0.6})`; ctx.lineWidth = 7;
      for (let i = 0; i < 2; i++) { const yy = s.y1 - 54 + i * 20 + k * 10; ctx.beginPath(); ctx.moveTo(s.cx - 20, yy); ctx.lineTo(s.cx, yy + 15); ctx.lineTo(s.cx + 20, yy); ctx.stroke(); }
    }
  }

  // ---------- Escalera de cuento ----------
  const ESCALON = ['#ff9dbb', '#ffd98a', '#a8e6a0', '#9fd3ff', '#c9a8ff', '#ffb98a'];
  function chevron(ctx, x, y, s, abajo, alfa) {
    const d = abajo ? 1 : -1;
    ctx.globalAlpha = alfa;
    ctx.strokeStyle = TINTA; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x, y + d * s * 0.8); ctx.lineTo(x + s, y); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5.5; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function cartelEscalera(ctx, x, y, linea1, linea2, materia, color) { // (x,y) = centro del cartel
    ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 50, y - 22); ctx.lineTo(x - 40, y - 38); ctx.moveTo(x + 50, y - 22); ctx.lineTo(x + 40, y - 38); ctx.stroke();
    circ(ctx, x - 40, y - 38, 3, '#ffd23f'); circ(ctx, x + 40, y - 38, 3, '#ffd23f');
    ctx.fillStyle = '#fff6e0'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5; redondo(ctx, x - 70, y - 23, 140, 46, 12); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = 2; redondo(ctx, x - 65, y - 18, 130, 36, 9); ctx.stroke();
    iconoMateria(ctx, materia, x - 46, y, 13);
    texto(ctx, linea1, x + 14, y - 8, 12, TINTA, 90);
    texto(ctx, linea2, x + 14, y + 9, 16, color, 92);
  }
  D.dibEscalera = function (ctx, o, t) {
    const x = o.x, y = o.y, M = MATERIA[o.materia] || { nombre: o.materia || '', color: '#ff5d8f' };
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (o.baja && !o.sube) { escaleraBaja(ctx, o, t, M); ctx.restore(); return; }
    const N = 6, paso = 26, W0 = 112, W1 = 90, yt = y - N * paso;
    D.sombra(ctx, x, y + 2, 66, 0.18);
    // puertita al piso de arriba
    const ah = 92, aw = 84;
    ctx.fillStyle = '#d99a58'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5; arco(ctx, x, yt - ah / 2 + 2, aw + 18, ah + 10); ctx.fill(); ctx.stroke();
    const gp = ctx.createLinearGradient(0, yt - ah, 0, yt);
    gp.addColorStop(0, '#fff3c4'); gp.addColorStop(1, '#ffd98a');
    ctx.fillStyle = gp; arco(ctx, x, yt - ah / 2 + 6, aw, ah); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; estrella(ctx, x + 18, yt - ah + 30 + Math.sin(t * 2 + x) * 3, 6, 4, 0.35); ctx.fill();
    // escalones (de atrás hacia adelante)
    for (let i = N - 1; i >= 0; i--) {
      const wi = W0 + (W1 - W0) * i / (N - 1), yy = y - (i + 1) * paso;
      ctx.fillStyle = '#f6dcb0'; ctx.fillRect(x - wi / 2, yy, wi, 11);
      ctx.fillStyle = ESCALON[i % ESCALON.length]; ctx.fillRect(x - wi / 2, yy + 11, wi, paso - 11);
      ctx.strokeStyle = TINTA; ctx.lineWidth = 2; ctx.strokeRect(x - wi / 2, yy, wi, paso);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x - wi / 2 + 4, yy + 2, wi - 8, 3);
    }
    // barandas de colores
    for (const lado of [-1, 1]) {
      const tops = [];
      for (let i = 0; i <= N; i++) {
        const wi = W0 + (W1 - W0) * Math.min(i, N - 1) / (N - 1), px = x + lado * (wi / 2 + 4), base = y - i * paso, alto = i === 0 ? 48 : 40;
        ctx.fillStyle = ESCALON[(i + (lado > 0 ? 3 : 0)) % ESCALON.length]; ctx.strokeStyle = TINTA; ctx.lineWidth = 1.8;
        redondo(ctx, px - 3.5, base - alto, 7, alto, 3); ctx.fill(); ctx.stroke();
        tops.push([px, base - alto]);
      }
      ctx.strokeStyle = TINTA; ctx.lineWidth = 9; ctx.beginPath(); tops.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      ctx.strokeStyle = lado < 0 ? '#ff5d8f' : '#5fb7e8'; ctx.lineWidth = 5.5; ctx.stroke();
      circ(ctx, tops[0][0], tops[0][1] - 4, 7, '#ffd23f', TINTA, 2);
    }
    // cartelito con el piso y la materia
    cartelEscalera(ctx, x, yt - ah - 20, 'Piso ' + (o.piso || ''), M.nombre, o.materia, M.color);
    // flechitas que invitan a subir
    const k = (t * 1.3) % 1;
    for (let j = 0; j < 2; j++) chevron(ctx, x, y - 34 - j * 30 - k * 22, 15, false, Math.max(0, 0.95 - k * 0.7));
    ctx.restore();
  };
  function escaleraBaja(ctx, o, t, M) { // abertura en el piso con escalones que bajan
    const x = o.x, y = o.y, top = y - 92, bot = y - 6, W = 128;
    ctx.fillStyle = '#c98a4f'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5; redondo(ctx, x - W / 2 - 10, top - 8, W + 20, bot - top + 14, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a2e4a'; ctx.fillRect(x - W / 2, top, W, bot - top);
    for (let i = 0; i < 5; i++) {
      const yy = top + 4 + i * 16, wi = W - 8 - i * 10, osc = 1 - i * 0.17;
      ctx.fillStyle = `rgba(246,220,176,${osc})`; ctx.fillRect(x - wi / 2, yy, wi, 7);
      ctx.fillStyle = ESCALON[i % ESCALON.length]; ctx.globalAlpha = osc; ctx.fillRect(x - wi / 2, yy + 7, wi, 8); ctx.globalAlpha = 1;
    }
    const sb = ctx.createLinearGradient(0, top, 0, bot);
    sb.addColorStop(0, 'rgba(40,20,50,0)'); sb.addColorStop(1, 'rgba(40,20,50,0.55)');
    ctx.fillStyle = sb; ctx.fillRect(x - W / 2, top, W, bot - top);
    // barandas a los costados
    for (const lado of [-1, 1]) {
      const px = x + lado * (W / 2 + 4);
      for (let i = 0; i < 4; i++) { const py = top + i * 26; ctx.fillStyle = ESCALON[(i + (lado > 0 ? 2 : 0)) % 6]; ctx.strokeStyle = TINTA; ctx.lineWidth = 1.8; redondo(ctx, px - 3.5, py - 30, 7, 32, 3); ctx.fill(); ctx.stroke(); }
      ctx.strokeStyle = TINTA; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(px, top - 32); ctx.lineTo(px, top + 48); ctx.stroke();
      ctx.strokeStyle = lado < 0 ? '#ff5d8f' : '#5fb7e8'; ctx.lineWidth = 5.5; ctx.stroke();
      circ(ctx, px, top - 34, 6.5, '#ffd23f', TINTA, 2);
    }
    // flechitas hacia abajo
    const k = (t * 1.3) % 1;
    for (let j = 0; j < 2; j++) chevron(ctx, x, top + 18 + j * 26 + k * 18, 15, true, Math.max(0, 0.95 - k * 0.7));
    // cartelito en un poste
    const sx = x + W / 2 + 92, sy = y - 78;
    ctx.fillStyle = '#a8683a'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2; redondo(ctx, sx - 4, sy, 8, y - sy, 3); ctx.fill(); ctx.stroke();
    D.sombra(ctx, sx, y, 14, 0.18);
    cartelEscalera(ctx, sx, sy - 6, 'Piso ' + (o.piso || '') + ' · Bajar', 'Al hall', o.materia, M.color);
  }

  // ---------- Pizarrón ----------
  const TIZA = 'rgba(255,255,255,0.93)';
  function tizaTexto(ctx, str, x, y, px, color, maxW) { ctx.globalAlpha = 0.35; texto(ctx, str, x + 1.2, y + 1, px, color, maxW); ctx.globalAlpha = 1; texto(ctx, str, x, y, px, color, maxW); }
  D.dibPizarron = function (ctx, o, t) {
    const x = o.x, y = o.y, W = 260, H = 148, yb = y - 58, yt = yb - H;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    D.sombra(ctx, x, y + 2, 120, 0.14);
    for (const d of [-1, 1]) { // patas
      const px = x + d * (W / 2 - 26);
      ctx.fillStyle = '#a8683a'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.2;
      redondo(ctx, px - 6, yb - 6, 12, y - yb, 5); ctx.fill(); ctx.stroke();
      redondo(ctx, px - 20, y - 9, 40, 10, 5); ctx.fill(); ctx.stroke();
    }
    // marco de madera
    ctx.fillStyle = '#c98a4f'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5; redondo(ctx, x - W / 2 - 13, yt - 13, W + 26, H + 26, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; redondo(ctx, x - W / 2 - 8, yt - 10, W + 16, 5, 2.5); ctx.fill();
    // pizarra verde
    const gr = ctx.createLinearGradient(0, yt, 0, yb);
    gr.addColorStop(0, '#3f8f5f'); gr.addColorStop(1, '#2d6c47');
    ctx.fillStyle = gr; redondo(ctx, x - W / 2, yt, W, H, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; [[-80, 40, 40, 14], [70, 110, 50, 12], [10, 80, 70, 10]].forEach((p) => elip(ctx, x + p[0], yt + p[1], p[2], p[3], 'rgba(255,255,255,0.06)'));
    // lo escrito con tiza según la materia
    const m = o.materia;
    if (m === 'matematica') {
      [1, 2, 3].forEach((n, i) => {
        const px = x - 78 + i * 78, c = ['#ffe36e', '#ff9dc4', '#9fd8ff'][i];
        tizaTexto(ctx, String(n), px, yt + 46, 40, TIZA);
        for (let k = 0; k < n; k++) circ(ctx, px - (n - 1) * 8 + k * 16, yt + 100, 6.5, c);
      });
      tizaTexto(ctx, '+', x - 39, yt + 48, 24, 'rgba(255,255,255,0.6)'); tizaTexto(ctx, '+', x + 39, yt + 48, 24, 'rgba(255,255,255,0.6)');
    } else if (m === 'lectura') {
      tizaTexto(ctx, 'MA-MÁ', x, yt + 54, 44, TIZA, W - 30);
      tizaTexto(ctx, 'MA   PA   SA', x, yt + 112, 24, '#ff9dc4', W - 40);
    } else if (m === 'modales') {
      tizaTexto(ctx, 'Gracias', x - 16, yt + 56, 40, TIZA, W - 80);
      ctx.fillStyle = '#ff9dc4'; D.corazon(ctx, x + 92, yt + 54, 14); ctx.fill();
      tizaTexto(ctx, 'por favor', x, yt + 112, 24, '#ffe36e', W - 40);
    } else if (m === 'ingles') {
      tizaTexto(ctx, 'Hello!', x, yt + 54, 42, TIZA, W - 40);
      ['A', 'B', 'C'].forEach((l, i) => tizaTexto(ctx, l, x - 46 + i * 46, yt + 112, 30, ['#ff9dc4', '#ffe36e', '#9fd8ff'][i]));
    } else tizaTexto(ctx, '¡Hola!', x, yt + 74, 40, TIZA);
    // destellito de tiza
    const d = (t * 0.7 + x * 0.003) % 3;
    if (d < 0.6) { ctx.fillStyle = '#fff'; estrella(ctx, x + W / 2 - 34, yt + 26, Math.sin((d / 0.6) * Math.PI) * 7, 4, 0.3); ctx.fill(); }
    // bandejita con tizas y borrador
    ctx.fillStyle = '#b0703a'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2; redondo(ctx, x - W / 2 - 6, yb + 4, W + 12, 10, 4); ctx.fill(); ctx.stroke();
    ['#ffffff', '#ff9dc4', '#ffe36e', '#9fd8ff'].forEach((c, i) => { ctx.fillStyle = c; redondo(ctx, x - 110 + i * 22, yb - 1, 16, 6, 3); ctx.fill(); });
    ctx.fillStyle = '#e9b97c'; redondo(ctx, x + 56, yb - 9, 44, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7d82a0'; ctx.fillRect(x + 58, yb, 40, 4);
    // manzanita para la seño sobre el marco
    circ(ctx, x + W / 2 - 18, yt - 20, 9, '#ff4d5e', TINTA, 2); circ(ctx, x + W / 2 - 21, yt - 23, 2.5, 'rgba(255,255,255,0.7)');
    ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + W / 2 - 18, yt - 28); ctx.lineTo(x + W / 2 - 16, yt - 34); ctx.stroke();
    ctx.fillStyle = '#4cc45f'; ctx.beginPath(); ctx.ellipse(x + W / 2 - 11, yt - 32, 5, 2.5, -0.4, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  // ---------- Pupitres ----------
  D.dibPupitre = function (ctx, o) {
    const x = o.x, y = o.y, bebe = o.quien === 'giulia';
    const nombre = bebe ? 'Giulia' : 'Julieth', col = bebe ? '#ffd23f' : '#ff8fb5', colS = bebe ? '#e0a820' : '#e0608f';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    D.sombra(ctx, x, y + 2, 38, 0.2);
    ctx.strokeStyle = TINTA; ctx.lineWidth = 2;
    const cartel = (cy, w) => { ctx.fillStyle = '#fff'; redondo(ctx, x - w / 2, cy - 8, w, 16, 6); ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.5; ctx.stroke(); texto(ctx, nombre, x, cy + 0.5, 11, colS, w - 6); };
    if (!bebe) {
      // mesita
      ctx.fillStyle = '#c98a4f';
      [[-30, -48, 30], [26, -48, 30]].forEach((p) => { redondo(ctx, x + p[0] - 2, y + p[1], 6, p[2], 2); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle = '#f2d29b'; redondo(ctx, x - 38, y - 62, 76, 16, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d99a58'; ctx.fillRect(x - 36, y - 48, 72, 5);
      ctx.fillStyle = '#7fc8ff'; ctx.save(); ctx.translate(x - 14, y - 56); ctx.rotate(-0.1); ctx.fillRect(-9, -4, 18, 8); ctx.restore(); // cuaderno
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 6, y - 53); ctx.lineTo(x + 24, y - 58); ctx.stroke(); // lápiz
      ctx.strokeStyle = '#ff8fb5'; ctx.beginPath(); ctx.moveTo(x + 24, y - 58); ctx.lineTo(x + 27, y - 59); ctx.stroke();
      // sillita (de espaldas, mirando al pizarrón)
      ctx.strokeStyle = TINTA; ctx.lineWidth = 2; ctx.fillStyle = colS;
      [[-20, -22], [16, -22]].forEach((p) => { redondo(ctx, x + p[0], y + p[1], 5, 22, 2); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle = col; redondo(ctx, x - 24, y - 28, 48, 10, 4); ctx.fill(); ctx.stroke();
      redondo(ctx, x - 26, y - 62, 52, 30, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; redondo(ctx, x - 22, y - 59, 44, 6, 3); ctx.fill();
      cartel(y - 44, 46);
    } else {
      // sillita alta de bebé
      ctx.strokeStyle = TINTA; ctx.lineWidth = 2;
      ctx.strokeStyle = colS; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x - 15, y - 56); ctx.lineTo(x - 26, y - 3); ctx.moveTo(x + 15, y - 56); ctx.lineTo(x + 26, y - 3); ctx.moveTo(x - 21, y - 26); ctx.lineTo(x + 21, y - 26); ctx.stroke();
      elip(ctx, x - 26, y - 2, 6, 3, TINTA); elip(ctx, x + 26, y - 2, 6, 3, TINTA);
      ctx.strokeStyle = TINTA; ctx.lineWidth = 2;
      ctx.fillStyle = '#ffffff'; redondo(ctx, x - 32, y - 84, 64, 9, 4); ctx.fill(); ctx.stroke(); // bandeja (del otro lado)
      ctx.fillStyle = col; redondo(ctx, x - 22, y - 62, 44, 9, 4); ctx.fill(); ctx.stroke(); // asiento
      redondo(ctx, x - 22, y - 104, 44, 46, 14); ctx.fill(); ctx.stroke(); // respaldo
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; redondo(ctx, x - 18, y - 100, 36, 6, 3); ctx.fill();
      ctx.fillStyle = '#ff8fb5'; estrella(ctx, x, y - 94, 5, 5, 0.45); ctx.fill();
      cartel(y - 76, 42);
    }
    ctx.restore();
  };

  // ---------- Las seños ----------
  const SENO = {
    matematica: { nombre: 'Seño Aurora', piel: '#f6d2b8', pielS: '#e2b096', pelo: '#f0c04a', peloL: '#ffe08a', peinado: 'rodete', vestido: '#ffc98a', vestidoL: '#ffe0b8', delantal: '#5fa8f0', mono: '#ff5d8f', gema: '#5ad1ff', acc: 'abaco' },
    lectura: { nombre: 'Seño Isabela', piel: '#8d5a3b', pielS: '#714228', pelo: '#2a1a14', peloL: '#4e3426', peinado: 'afro', vestido: '#c9a2ff', vestidoL: '#e2ccff', delantal: '#ff7aa8', mono: '#ffd23f', gema: '#ff5d8f', acc: 'libro' },
    modales: { nombre: 'Seño Rosalinda', piel: '#e6b48e', pielS: '#cc976f', pelo: '#d9572a', peloL: '#ff8a4a', peinado: 'trenza', vestido: '#ffb3d1', vestidoL: '#ffd8e8', delantal: '#5fc46a', mono: '#ff5d8f', gema: '#7fd36b', acc: 'taza' },
    ingles: { nombre: 'Seño Celeste', piel: '#b47a50', pielS: '#98603a', pelo: '#1f2238', peloL: '#3c4270', peinado: 'colitas', vestido: '#8fd8f5', vestidoL: '#c4ecfb', delantal: '#f5b82a', mono: '#3f8fd6', gema: '#ff5d8f', acc: 'bandera' }
  };
  D.SENO = SENO;

  function accesorioSeno(g, S, t, hx, hy) { // lo que la seño tiene en la mano de atrás
    if (S.acc === 'abaco') {
      g.save(); g.translate(hx - 2, hy + 4); g.rotate(-0.12);
      g.fillStyle = '#fff6e0'; redondo(g, -12, -9, 24, 19, 3); g.fill(); g.strokeStyle = '#a8683a'; g.lineWidth = 2.5; g.stroke();
      g.strokeStyle = '#8a5a2e'; g.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        const yy = -4 + k * 5; g.beginPath(); g.moveTo(-10, yy); g.lineTo(10, yy); g.stroke();
        const corre = k === 1 ? (Math.sin(t * 1.5) * 0.5 + 0.5) * 6 : 0;
        for (let b = 0; b < 3; b++) circ(g, -7 + b * 3.6 + corre, yy, 1.9, ['#ff5d8f', '#ffd23f', '#5fb7e8'][k]);
      }
      g.restore();
    } else if (S.acc === 'libro') {
      g.save(); g.translate(hx - 1, hy + 2); g.rotate(0.15);
      g.fillStyle = '#fff'; g.fillRect(-7, -10, 15, 20);
      g.fillStyle = '#3f8fd6'; redondo(g, -9, -11, 15, 22, 2); g.fill(); g.strokeStyle = TINTA; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = '#ffd23f'; estrella(g, -1.5, 0, 4.5, 5, 0.45); g.fill();
      g.restore();
    } else if (S.acc === 'taza') {
      const x = hx + 1, y = hy - 3;
      elip(g, x, y + 7, 10, 2.6, '#ffffff', '#d8b8c8', 1);
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - 7, y - 4); g.lineTo(x + 7, y - 4); g.quadraticCurveTo(x + 7, y + 6, x, y + 6); g.quadraticCurveTo(x - 7, y + 6, x - 7, y - 4); g.closePath(); g.fill();
      g.strokeStyle = '#d8b8c8'; g.lineWidth = 1; g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(x + 8, y, 3, -1.2, 1.2); g.stroke();
      circ(g, x - 2, y + 1, 2, '#ff8fb5'); circ(g, x + 3, y + 2, 1.5, '#7fd36b');
      const v = (t * 0.8) % 1; g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - v)})`; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x, y - 6 - v * 6); g.quadraticCurveTo(x + 3, y - 9 - v * 6, x, y - 12 - v * 6); g.stroke();
    } else if (S.acc === 'bandera') {
      g.strokeStyle = '#8a5a2e'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(hx, hy + 6); g.lineTo(hx, hy - 26); g.stroke();
      const o = Math.sin(t * 4) * 1.2;
      g.save(); g.translate(hx + 1, hy - 26); g.transform(1, o * 0.03, 0, 1, 0, 0); banderaUSA(g, 0, 0, 18, 12); g.restore();
    }
  }

  // Dibuja una seño con los pies en (0,0) mirando a la derecha (misma escala que figuraPrincipe).
  D.figuraSeno = function (g, materia, o) {
    o = o || {};
    const S = SENO[materia] || SENO.matematica, t = o.t || 0, resp = Math.sin(t * 2.2) * 1.1 + 1.1;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.translate(0, -resp);
    // zapatitos
    elip(g, -4, -1 + resp, 6.5, 4, '#c0506e'); elip(g, 8, -1 + resp, 6.5, 4, '#c0506e');
    // brazo de atrás
    g.strokeStyle = S.vestidoL; g.lineWidth = 6.5; g.beginPath(); g.moveTo(-8, -48); g.lineTo(-14, -31); g.stroke();
    // falda de princesa (campana) con volados
    g.fillStyle = S.vestido; g.beginPath(); g.moveTo(-10, -42); g.quadraticCurveTo(-16, -22, -22, -4); g.quadraticCurveTo(0, 1, 22, -4); g.quadraticCurveTo(16, -22, 10, -42); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 1.5; g.stroke();
    for (let k = -18; k <= 18; k += 6) circ(g, k, -3.5 + Math.abs(k) * 0.03, 3.4, S.vestidoL);
    // cuello
    g.fillStyle = S.pielS; g.fillRect(-3, -58, 7, 6);
    // delantal a cuadrillé (el guardapolvo de la seño)
    const del = () => { g.beginPath(); g.moveTo(-11, -55); g.lineTo(11, -55); g.lineTo(15, -12); g.quadraticCurveTo(0, -8, -15, -12); g.closePath(); };
    del(); g.fillStyle = '#ffffff'; g.fill();
    g.save(); del(); g.clip(); g.globalAlpha = 0.45; g.fillStyle = S.delantal;
    for (let px = -16; px < 16; px += 7) g.fillRect(px, -56, 3.5, 46);
    for (let py = -56; py < -8; py += 7) g.fillRect(-16, py, 32, 3.5);
    g.globalAlpha = 1; g.restore();
    del(); g.strokeStyle = S.delantal; g.lineWidth = 1.6; g.stroke();
    // bolsillo con un lápiz
    g.strokeStyle = '#ffd23f'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(5, -27); g.lineTo(7, -36); g.stroke();
    g.strokeStyle = '#ff8fb5'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(7, -36); g.lineTo(7.4, -38); g.stroke();
    g.fillStyle = '#ffffff'; redondo(g, 1, -30, 10, 8, 2); g.fill(); g.strokeStyle = S.delantal; g.lineWidth = 1.2; g.stroke();
    // mangas abullonadas
    circ(g, -9, -51, 5.5, S.vestidoL); circ(g, 10, -51, 5.5, S.vestidoL);
    // moño grande en el cuello
    g.fillStyle = S.mono; g.beginPath(); g.moveTo(1, -52); g.lineTo(-7, -57); g.lineTo(-7, -47); g.closePath(); g.moveTo(1, -52); g.lineTo(9, -57); g.lineTo(9, -47); g.closePath(); g.fill();
    circ(g, 1, -52, 2.6, S.mono, 'rgba(0,0,0,0.2)', 1);
    // accesorio de la materia y la mano de atrás
    accesorioSeno(g, S, t, -14, -30); circ(g, -14, -30, 3.5, S.pielS);
    // cabeza
    g.save(); g.translate(1, -69);
    if (S.peinado === 'afro') [[-12, -10, 14], [1, -16, 14], [13, -11, 11], [-18, 2, 12], [-14, 13, 9], [16, -1, 7]].forEach((p) => circ(g, p[0], p[1], p[2], S.pelo));
    else circ(g, -2, -1, 19, S.pelo);
    if (S.peinado === 'rodete') { circ(g, -13, -15, 9, S.pelo); circ(g, -15, -18, 3, S.peloL); }
    else if (S.peinado === 'colitas') {
      [[-24, -2, 0.5], [-17, -21, -0.6]].forEach((p) => { g.fillStyle = S.pelo; g.beginPath(); g.ellipse(p[0], p[1], 6, 11, p[2], 0, U.TAU); g.fill(); });
      circ(g, -19, -5, 3, S.mono); circ(g, -14, -17, 3, S.mono);
    }
    circ(g, 0, 0, 17.5, S.piel);
    circ(g, -15, 3, 3.2, S.pielS);
    g.fillStyle = S.pelo;
    if (S.peinado === 'rodete') { g.beginPath(); g.arc(0, 0, 18.3, Math.PI * 0.95, Math.PI * 1.92); g.quadraticCurveTo(9, -7, 3, -9); g.quadraticCurveTo(-4, -4, -9, -8); g.quadraticCurveTo(-13, -3, -17, 2); g.closePath(); g.fill(); g.strokeStyle = S.peloL; g.lineWidth = 1.6; g.beginPath(); g.arc(-2, 0, 14, Math.PI * 1.2, Math.PI * 1.55); g.stroke(); }
    else if (S.peinado === 'afro') { [[-10, -13, 7], [0, -16, 7], [9, -14, 6], [-15, -6, 6]].forEach((p) => circ(g, p[0], p[1], p[2], S.pelo)); circ(g, -4, -18, 2.5, S.peloL); g.strokeStyle = S.mono; g.lineWidth = 3.5; g.beginPath(); g.arc(0, 0, 17.5, Math.PI * 1.08, Math.PI * 1.85); g.stroke(); }
    else if (S.peinado === 'trenza') {
      g.beginPath(); g.arc(0, 0, 18.3, Math.PI * 0.95, Math.PI * 1.95); g.quadraticCurveTo(4, -12, -6, -7); g.quadraticCurveTo(-12, -3, -17, 2); g.closePath(); g.fill();
      for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? S.peloL : S.pelo; g.beginPath(); g.ellipse(-12 + k * 0.6, 14 + k * 6.5, 4.6 - k * 0.3, 4, 0.3, 0, U.TAU); g.fill(); }
      circ(g, -9, 46, 3, S.mono);
    } else { g.beginPath(); g.arc(0, 0, 18.3, Math.PI * 0.95, Math.PI * 1.97); g.lineTo(16, -6); g.lineTo(-4, -6); g.lineTo(-17, 2); g.closePath(); g.fill(); g.strokeStyle = S.peloL; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-6, -14); g.lineTo(-4, -7); g.moveTo(4, -15); g.lineTo(5, -7); g.stroke(); }
    // tiarita
    g.save(); g.translate(2, -17); g.rotate(-0.08);
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#d98500'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-8, 2.5); g.quadraticCurveTo(0, -1, 8, 2.5); g.lineTo(5, -2); g.lineTo(2.5, 0); g.lineTo(0, -6); g.lineTo(-2.5, 0); g.lineTo(-5, -2); g.closePath(); g.fill(); g.stroke();
    circ(g, 0, -1, 1.9, S.gema); g.restore();
    // carita
    elip(g, 1, 8, 3.8, 2.3, 'rgba(255,120,130,0.45)'); elip(g, 14, 7, 3, 2.1, 'rgba(255,120,130,0.45)');
    const cerrados = (t + materia.length * 0.6) % 4.1 < 0.13;
    if (cerrados) { g.strokeStyle = '#2a1810'; g.lineWidth = 2; g.beginPath(); g.arc(4, 1, 3, 0.15, Math.PI - 0.15); g.stroke(); g.beginPath(); g.arc(12.5, 1, 2.8, 0.15, Math.PI - 0.15); g.stroke(); }
    else { elip(g, 4, 1, 2.8, 3.9, '#2a1810'); elip(g, 12.5, 1, 2.6, 3.7, '#2a1810'); circ(g, 4.9, -0.5, 1.2, '#fff'); circ(g, 13.2, -0.5, 1.1, '#fff'); }
    g.strokeStyle = '#2a1810'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(1.5, -2.5); g.lineTo(0, -4.5); g.moveTo(10, -2.6); g.lineTo(9.2, -4.8); g.stroke(); // pestañas
    g.strokeStyle = S.pelo; g.lineWidth = 1.6; g.beginPath(); g.moveTo(1, -6.5); g.quadraticCurveTo(4, -8, 7, -6.8); g.moveTo(10, -7); g.quadraticCurveTo(13, -8, 15.5, -6.2); g.stroke();
    if (o.hablando) { const ab = 2 + Math.abs(Math.sin(t * 13)) * 3.4; elip(g, 8.5, 9, 3.9, ab, '#b0304a'); }
    else { g.strokeStyle = '#c0405a'; g.lineWidth = 2; g.beginPath(); g.arc(8.5, 6.5, 4.8, 0.2, Math.PI - 0.2); g.stroke(); }
    g.restore();
    // brazo de adelante (saluda; cuando explica, gesticula)
    const a = o.saluda ? 2.5 + Math.sin(t * 9) * 0.35 : o.hablando ? 1.3 + Math.sin(t * 4) * 0.35 : 0.22, L = o.saluda ? 19 : 15;
    const hx = 9 + Math.sin(a) * L, hy = -44 + Math.cos(a) * L;
    g.strokeStyle = S.vestidoL; g.lineWidth = 6.5; g.beginPath(); g.moveTo(9, -48); g.lineTo(hx, hy); g.stroke(); circ(g, hx, hy, 3.6, S.piel);
    g.restore();
  };

  D.dibSeno = function (ctx, o, t, jx, jy) {
    const Au = J.Aula, enClase = !!(Au && Au.abierto && (Au.seno === o || (Au.seno && Au.seno.materia === o.materia)));
    const cerca = Math.hypot(jx - o.x, jy - o.y) < 150;
    if (Math.abs(jx - o.x) > 12) o.dir = jx > o.x ? 1 : -1;
    D.sombra(ctx, o.x, o.y, 22, 0.26);
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale((o.dir || 1) * 1.32, 1.32);
    D.figuraSeno(ctx, o.materia, { t: t + (o.fase || 0), saluda: cerca && !enClase, hablando: enClase && !!Au.hablando });
    ctx.restore();
    if (cerca && !enClase) { // globito "¡Clase!" con un lapicito
      const b = Math.sin(t * 3) * 3, gx = o.x + 44, gy = o.y - 140 + b;
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.fillStyle = '#fff'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5;
      redondo(ctx, gx - 40, gy - 16, 80, 30, 13); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx - 26, gy + 13); ctx.lineTo(gx - 34, gy + 24); ctx.lineTo(gx - 16, gy + 13); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(gx - 27, gy + 10, 12, 4);
      ctx.save(); ctx.translate(gx - 24, gy - 1); ctx.rotate(-0.7 + Math.sin(t * 6) * 0.15);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(-9, -3, 14, 6); ctx.fillStyle = '#ff8fb5'; ctx.fillRect(-12, -3, 3, 6);
      ctx.fillStyle = '#f6dcb0'; ctx.beginPath(); ctx.moveTo(5, -3); ctx.lineTo(10, 0); ctx.lineTo(5, 3); ctx.closePath(); ctx.fill(); circ(ctx, 9, 0, 1.2, TINTA);
      ctx.restore();
      texto(ctx, '¡Clase!', gx + 8, gy, 15, MATERIA[o.materia] ? MATERIA[o.materia].color : TINTA, 52);
      ctx.restore();
    }
  };
})();
