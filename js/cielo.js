/* Ciclo día / noche: color del ambiente, nubes sonrientes, estrellas,
   luciérnagas y luces cálidas (antorchas, ventanas y la corona de Julieth). */
(function () {
  const U = J.U, C = J.CFG;
  const Ci = { hora: C.HORA_INICIAL, noche: 0, ambiente: [255, 255, 255], cielo: [120, 205, 255], nubes: [], bichos: [], estrellas: [], luces: [] };

  // Color que "tiñe" el mundo según la hora (0–1)
  const CLAVES = [
    { t: 0.0, c: [255, 190, 170] }, { t: 0.05, c: [255, 228, 205] }, { t: 0.11, c: [255, 255, 255] },
    { t: 0.5, c: [255, 255, 255] }, { t: 0.56, c: [255, 208, 140] }, { t: 0.62, c: [255, 166, 120] },
    { t: 0.68, c: [150, 108, 172] }, { t: 0.74, c: [66, 82, 168] }, { t: 0.91, c: [60, 76, 162] },
    { t: 0.96, c: [170, 126, 172] }, { t: 1.0, c: [255, 190, 170] }
  ];
  const paso = (a, b, x) => U.suave(U.limitar((x - a) / (b - a), 0, 1));

  // Etapas del día [inicio, fin] en "hora" (0–1). El amanecer cruza la medianoche (0.93 → 1.08).
  // El reloj avanza más rápido o más lento según la etapa para que todas duren C.ETAPA_SEG segundos.
  const ETAPAS = [[0.08, 0.3], [0.3, 0.52], [0.52, 0.68], [0.68, 0.93], [0.93, 1.08]];
  function largoEtapa(h) {
    for (const e of ETAPAS) if ((h >= e[0] && h < e[1]) || (h + 1 >= e[0] && h + 1 < e[1])) return e[1] - e[0];
    return 0.2;
  }

  Ci.momento = function () {
    const h = Ci.hora;
    return h < 0.08 ? 'Amanecer' : h < 0.3 ? 'Mañana' : h < 0.52 ? 'Tarde' : h < 0.68 ? 'Atardecer' : h < 0.93 ? 'Noche' : 'Amanecer';
  };

  Ci.iniciar = function () {
    const r = U.semilla(99);
    for (let i = 0; i < 4; i++) Ci.nubes.push({ x: i * 620 + r() * 200, y: (i * 0.37 + r() * 0.15) % 1, v: r.rango(9, 20), esc: r.rango(0.7, 1.1) });
    for (let i = 0; i < 90; i++) Ci.estrellas.push({ x: r(), y: r() * 0.5, tam: r.rango(1.5, 4.2), fase: r() * 6 });
    for (let i = 0; i < 46; i++) Ci.bichos.push({ x: -9999, y: 0, fase: r() * 6, v: r.rango(0.5, 1.2) });
    // sprite de resplandor (se reutiliza para todas las luces)
    Ci.brillo = document.createElement('canvas'); Ci.brillo.width = Ci.brillo.height = 128;
    let g = Ci.brillo.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,214,140,1)'); gr.addColorStop(0.35, 'rgba(255,180,100,0.55)'); gr.addColorStop(1, 'rgba(255,150,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    Ci.brilloVerde = document.createElement('canvas'); Ci.brilloVerde.width = Ci.brilloVerde.height = 64;
    g = Ci.brilloVerde.getContext('2d'); gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(240,255,170,1)'); gr.addColorStop(0.3, 'rgba(190,255,110,0.6)'); gr.addColorStop(1, 'rgba(150,255,90,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    Ci.mapa = document.createElement('canvas');
  };

  Ci.actualizar = function (dt) {
    Ci.hora = (Ci.hora + dt * largoEtapa(Ci.hora) / C.ETAPA_SEG) % 1;
    Ci.ambiente = U.claveColor(CLAVES, Ci.hora);
    Ci.noche = Ci.hora < 0.5 ? 0 : paso(0.62, 0.73, Ci.hora) * (1 - paso(0.91, 0.99, Ci.hora));
    J.Audio.noche = Ci.noche;
    // color del cielo (para el relojito y las ventanas de los salones)
    const h = Ci.hora;
    let c = U.mezclaColor([120, 205, 255], [255, 150, 110], paso(0.5, 0.62, h) * (1 - paso(0.62, 0.72, h)) + (h < 0.08 ? 1 - paso(0, 0.08, h) : 0));
    Ci.cielo = U.mezclaColor(c, [30, 36, 100], Ci.noche);
    for (const n of Ci.nubes) n.x += n.v * dt;
  };

  // Nubes sonrientes que pasan flotando (se vuelven transparentes cerca de Julieth)
  Ci.dibNubes = function (ctx, W, H, cam, jx, jy) {
    const a = 1 - Ci.noche;
    if (a < 0.03) return;
    const ancho = W + 520;
    for (const n of Ci.nubes) {
      const x = ((n.x - cam.x * 0.35) % ancho + ancho) % ancho - 260;
      const y = ((n.y * (H + 300) - cam.y * 0.35) % (H + 300) + (H + 300)) % (H + 300) - 150;
      const d = Math.hypot(x - jx, y - jy);
      ctx.globalAlpha = a * U.limitar((d - 120) / 300, 0.1, 0.62);
      J.Dibujo.pon(ctx, J.Dibujo.spr.nube, x, y, n.esc);
    }
    ctx.globalAlpha = 1;
  };

  // Tinte del ambiente + luces cálidas. "luces" = [{x,y,r,f}] en píxeles de pantalla.
  Ci.iluminar = function (ctx, W, H, t, dentro) {
    // dentro de un salón casi no oscurece: lo alumbran las antorchas
    const amb = dentro ? U.mezclaColor(Ci.ambiente, [255, 246, 232], 0.8) : Ci.ambiente, n = Ci.noche;
    if (amb[0] > 252 && amb[1] > 252 && amb[2] > 252) return;
    const E = 4, mw = Math.ceil(W / E), mh = Math.ceil(H / E), m = Ci.mapa;
    if (m.width !== mw || m.height !== mh) { m.width = mw; m.height = mh; }
    const g = m.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = U.rgb(amb); g.fillRect(0, 0, mw, mh);
    if (n > 0.02) {
      g.globalCompositeOperation = 'lighter';
      for (const l of Ci.luces) {
        const r = (l.r / E) * (1 + Math.sin(t * 9 + l.x) * 0.03 * (l.titila || 0));
        g.globalAlpha = Math.min(1, n * (l.f || 1));
        g.drawImage(Ci.brillo, l.x / E - r, l.y / E - r, r * 2, r * 2);
      }
    }
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(m, 0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  };

  // Cielo nocturno: estrellas que titilan, halo de luces y luciérnagas
  Ci.dibNoche = function (ctx, W, H, t, cam, zoom) {
    const n = Ci.noche;
    if (n < 0.03) return;
    const gr = ctx.createLinearGradient(0, 0, 0, H * 0.42);
    gr.addColorStop(0, `rgba(16,20,74,${0.5 * n})`); gr.addColorStop(1, 'rgba(16,20,74,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H * 0.42);
    ctx.globalCompositeOperation = 'lighter';
    for (const s of Ci.estrellas) {
      const a = n * (0.45 + 0.55 * Math.sin(t * 2.2 + s.fase)) * (1 - s.y / 0.5);
      if (a <= 0.02) continue;
      ctx.fillStyle = `rgba(255,250,220,${a})`;
      J.Dibujo.estrella(ctx, s.x * W, s.y * H, s.tam, 4, 0.3); ctx.fill();
    }
    // halo cálido sobre las llamas y la corona
    for (const l of Ci.luces) {
      if (!l.halo) continue;
      const r = l.halo * zoom;
      ctx.globalAlpha = n * 0.55;
      ctx.drawImage(Ci.brillo, l.x - r, l.y - r, r * 2, r * 2);
    }
    // luciérnagas
    const vw = W / zoom, vh = H / zoom;
    for (const b of Ci.bichos) {
      if (b.x < cam.x - vw / 2 - 80 || b.x > cam.x + vw / 2 + 80 || b.y < cam.y - vh / 2 - 80 || b.y > cam.y + vh / 2 + 80) {
        b.x = cam.x + U.azar(-vw / 2, vw / 2); b.y = cam.y + U.azar(-vh / 2, vh / 2);
      }
      b.x += Math.cos(t * b.v + b.fase) * 0.5; b.y += Math.sin(t * b.v * 1.3 + b.fase * 2) * 0.35;
      const x = (b.x - cam.x) * zoom + W / 2, y = (b.y - cam.y) * zoom + H / 2 - (30 + Math.sin(t * 2 + b.fase) * 14) * zoom;
      ctx.globalAlpha = n * (0.35 + 0.65 * Math.max(0, Math.sin(t * 2.6 * b.v + b.fase * 3)));
      const r = 13 * zoom;
      ctx.drawImage(Ci.brilloVerde, x - r, y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };

  // Relojito del HUD: sol y luna girando
  Ci.dibReloj = function (g, T) {
    const h = Ci.hora, n = Ci.noche, c = Ci.cielo;
    g.clearRect(0, 0, T, T);
    g.save(); g.beginPath(); g.arc(T / 2, T / 2, T / 2 - 1, 0, U.TAU); g.clip();
    g.fillStyle = U.rgb(c); g.fillRect(0, 0, T, T);
    if (n > 0.1) { g.fillStyle = `rgba(255,255,255,${n})`; [[0.25, 0.3], [0.7, 0.22], [0.55, 0.5], [0.2, 0.6], [0.82, 0.55]].forEach((p) => g.fillRect(p[0] * T, p[1] * T, 1.6, 1.6)); }
    // el sol recorre el cielo de h=0 a 0.62; la luna de 0.62 a 1
    const ang = (h / 0.62) * Math.PI, sx = T / 2 - Math.cos(ang) * T * 0.36, sy = T * 0.72 - Math.sin(ang) * T * 0.46;
    if (h < 0.66) { g.fillStyle = '#ffe066'; g.beginPath(); g.arc(sx, sy, T * 0.16, 0, U.TAU); g.fill(); g.strokeStyle = '#ffb82e'; g.lineWidth = 2; g.stroke(); }
    const am = ((h - 0.62) / 0.38) * Math.PI, mx = T / 2 - Math.cos(am) * T * 0.36, my = T * 0.72 - Math.sin(am) * T * 0.46;
    if (h > 0.6) { g.fillStyle = '#fdf6d8'; g.beginPath(); g.arc(mx, my, T * 0.15, 0, U.TAU); g.fill(); g.fillStyle = U.rgb(c); g.beginPath(); g.arc(mx + T * 0.07, my - T * 0.04, T * 0.12, 0, U.TAU); g.fill(); }
    g.fillStyle = '#5fcf5a'; g.beginPath(); g.ellipse(T / 2, T * 1.02, T * 0.7, T * 0.3, 0, 0, U.TAU); g.fill();
    g.restore();
  };

  J.Cielo = Ci;
})();
