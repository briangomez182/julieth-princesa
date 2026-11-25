/* Marco de princesa para las fotos de la cámara: borde dorado con brillo,
   perlitas, coronita con gemas y estrellitas en las esquinas.
   Lo usan el mapa del reino y las fotos que quedan en el mundo.
   Es autosuficiente (no depende de J.Dibujo) para poder cargarse en cualquier orden. */
(function () {
  const TAU = Math.PI * 2;
  const TINTA = '#6b2460';
  const Mk = {};

  // ---------- Ayudas ----------
  function redondo(g, x, y, w, h, r, sumar) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (!sumar) g.beginPath();   // con "sumar" se agrega al trazo actual (para recortes evenodd)
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
  function circ(g, x, y, r, relleno, borde, ancho) {
    g.beginPath(); g.arc(x, y, r, 0, TAU);
    if (relleno) { g.fillStyle = relleno; g.fill(); }
    if (borde) { g.strokeStyle = borde; g.lineWidth = ancho || 1; g.stroke(); }
  }
  function oro(g, x0, y0, x1, y1) {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, '#fff1a8'); gr.addColorStop(0.35, '#ffc93c');
    gr.addColorStop(0.65, '#e09a1e'); gr.addColorStop(1, '#ffe27a');
    return gr;
  }

  // Silueta de camarita (para cuando la foto todavía no cargó, y para el ícono)
  function camarita(g, cx, cy, s, cuerpo, lente) {
    const w = s, h = s * 0.68, x = cx - w / 2, y = cy - h / 2 + s * 0.06;
    g.fillStyle = cuerpo;
    redondo(g, cx - w * 0.2, y - h * 0.22, w * 0.4, h * 0.3, h * 0.1); g.fill();   // jorobita del visor
    redondo(g, x, y, w, h, h * 0.22); g.fill();
    circ(g, cx, y + h * 0.52, h * 0.34, lente);
    circ(g, cx, y + h * 0.52, h * 0.2, cuerpo);
    circ(g, cx - h * 0.08, y + h * 0.44, h * 0.07, 'rgba(255,255,255,0.9)');
    circ(g, x + w * 0.83, y + h * 0.2, h * 0.07, lente);                           // flash
  }

  // Coronita dorada con gemas, con la base apoyada en (cx, base)
  function corona(g, cx, base, ancho, chico) {
    const a = ancho, alto = a * 0.62, x = cx - a / 2, top = base - alto;
    g.beginPath();
    g.moveTo(x, base);
    g.lineTo(x - a * 0.04, top + alto * 0.18);
    g.lineTo(x + a * 0.25, top + alto * 0.5);
    g.lineTo(cx, top);
    g.lineTo(x + a * 0.75, top + alto * 0.5);
    g.lineTo(x + a * 1.04, top + alto * 0.18);
    g.lineTo(x + a, base);
    g.closePath();
    g.fillStyle = oro(g, x, top, x + a, base); g.fill();
    g.strokeStyle = TINTA; g.lineWidth = Math.max(0.8, a * 0.06); g.lineJoin = 'round'; g.stroke();
    // banda de la base
    g.fillStyle = '#e09a1e'; g.fillRect(x + a * 0.06, base - alto * 0.24, a * 0.88, alto * 0.16);
    if (chico) { circ(g, cx, base - alto * 0.42, a * 0.09, '#ff4f8b'); return; }
    // puntitas con perlas y gemas
    circ(g, cx, top, a * 0.07, '#fff', TINTA, Math.max(0.6, a * 0.025));
    circ(g, x - a * 0.04, top + alto * 0.18, a * 0.055, '#fff');
    circ(g, x + a * 1.04, top + alto * 0.18, a * 0.055, '#fff');
    circ(g, cx, base - alto * 0.4, a * 0.1, '#ff4f8b', '#fff', Math.max(0.6, a * 0.025));
    circ(g, x + a * 0.24, base - alto * 0.34, a * 0.065, '#5fc8ff');
    circ(g, x + a * 0.76, base - alto * 0.34, a * 0.065, '#b07cff');
  }

  // Moñito rosa (esquinas de abajo en los marcos grandes)
  function monio(g, x, y, s) {
    g.fillStyle = '#ff7eb6'; g.strokeStyle = TINTA; g.lineWidth = Math.max(0.7, s * 0.12); g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - s * 1.1, y - s * 0.9, x - s * 1.05, y); g.quadraticCurveTo(x - s * 1.1, y + s * 0.9, x, y); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * 1.1, y - s * 0.9, x + s * 1.05, y); g.quadraticCurveTo(x + s * 1.1, y + s * 0.9, x, y); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - s * 0.15, y); g.lineTo(x - s * 0.55, y + s * 1.0); g.moveTo(x + s * 0.15, y); g.lineTo(x + s * 0.55, y + s * 1.0); g.stroke();
    circ(g, x, y, s * 0.32, '#ff4f8b', TINTA, Math.max(0.6, s * 0.1));
  }

  function estrellita(g, x, y, r, alfa) {
    g.save(); g.globalAlpha *= alfa;
    estrella(g, x, y, r, 4, 0.38); g.fillStyle = '#fffbe0'; g.fill();
    g.strokeStyle = '#ffb703'; g.lineWidth = Math.max(0.5, r * 0.18); g.stroke();
    g.restore();
  }

  // ---------- Foto con marco ----------
  Mk.dibujar = function (ctx, img, cx, cy, w, h, t) {
    const g = ctx, s = Math.min(w, h), tt = t || 0;
    const chico = w < 48, mediano = w < 100;
    const x = cx - w / 2, y = cy - h / 2;
    const b = Math.max(2.5, s * (chico ? 0.13 : 0.1));   // grosor del borde dorado
    const r = s * 0.16, ri = Math.max(1, r - b * 0.6);
    const ix = x + b, iy = y + b, iw = w - b * 2, ih = h - b * 2;
    g.save();
    g.lineJoin = 'round'; g.lineCap = 'round';

    // sombrita suave
    if (!chico) {
      g.fillStyle = 'rgba(60,20,50,0.25)';
      redondo(g, x + s * 0.03, y + s * 0.06, w, h, r); g.fill();
    }
    // borde dorado
    redondo(g, x, y, w, h, r);
    g.fillStyle = oro(g, x, y, x + w, y + h); g.fill();
    g.strokeStyle = TINTA; g.lineWidth = Math.max(1, s * 0.03); g.stroke();

    // la foto (recorte tipo "cover") o el fondito rosa con la camarita
    g.save();
    redondo(g, ix, iy, iw, ih, ri); g.clip();
    const iwN = img && (img.naturalWidth || img.width), ihN = img && (img.naturalHeight || img.height);
    if (img && iwN && ihN) {
      const k = Math.max(iw / iwN, ih / ihN), sw = iw / k, sh = ih / k;
      g.drawImage(img, (iwN - sw) / 2, (ihN - sh) / 2, sw, sh, ix, iy, iw, ih);
    } else {
      const gr = g.createLinearGradient(ix, iy, ix, iy + ih);
      gr.addColorStop(0, '#ffe3ef'); gr.addColorStop(1, '#ffb3d1');
      g.fillStyle = gr; g.fillRect(ix, iy, iw, ih);
      camarita(g, cx, cy, Math.min(iw * 0.6, ih * 0.75), '#ff7eb6', '#fff');
    }
    g.restore();
    // filete interior
    redondo(g, ix, iy, iw, ih, ri);
    g.strokeStyle = chico ? '#b5701a' : '#fff6d0'; g.lineWidth = Math.max(0.7, s * 0.018); g.stroke();

    // destello que recorre el borde dorado
    if (t != null) {
      g.save();
      g.beginPath();
      g.rect(x - 2, y - 2, w + 4, h + 4);
      redondo(g, ix, iy, iw, ih, ri, true);
      g.clip('evenodd');
      redondo(g, x, y, w, h, r); g.clip();
      const fase = ((tt * 0.35) % 1.8) - 0.4, px = x + fase * (w + h);
      const gr = g.createLinearGradient(px - s * 0.3, y, px + s * 0.3 - h, y + h);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      g.restore();
    }

    // perlitas en el borde (con un corazoncito al medio de abajo)
    if (!chico) {
      const pr = Math.max(1, b * 0.24), paso = Math.max(pr * 4.2, mediano ? 9 : 12);
      const m = b / 2, X0 = x + m, Y0 = y + m, X1 = x + w - m, Y1 = y + h - m;
      const perla = (px, py) => {
        circ(g, px, py, pr, '#fffaf3', 'rgba(150,90,40,0.6)', Math.max(0.4, pr * 0.25));
        circ(g, px - pr * 0.3, py - pr * 0.3, pr * 0.35, '#fff');
      };
      const linea = (ax, ay, bx, by, saltarCentro) => {
        const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / paso));
        for (let i = 1; i < n; i++) {
          const f = i / n;
          if (saltarCentro && Math.abs(f - 0.5) < 0.18) continue;
          perla(ax + (bx - ax) * f, ay + (by - ay) * f);
        }
      };
      const ins = r * 0.6;
      linea(X0 + ins, Y0, X1 - ins, Y0, true);     // arriba (ahí va la corona)
      linea(X0 + ins, Y1, X1 - ins, Y1, true);     // abajo (ahí va el corazón)
      linea(X0, Y0 + ins, X0, Y1 - ins, false);
      linea(X1, Y0 + ins, X1, Y1 - ins, false);
      corazon(g, cx, Y1 - b * 0.08, b * 0.42);
      g.fillStyle = '#ff4f8b'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = Math.max(0.5, b * 0.1); g.stroke();
    }

    // esquinas: estrellitas que titilan (y moñitos abajo en los marcos grandes)
    const er = Math.max(2.2, b * (chico ? 0.75 : 0.62));
    const tit = (i) => 0.75 + 0.25 * Math.sin(tt * 3 + i * 1.7);
    estrellita(g, x + b * 0.5, y + b * 0.5, er, tit(0));
    estrellita(g, x + w - b * 0.5, y + b * 0.5, er, tit(1));
    if (!mediano) {
      monio(g, x + b * 0.5, y + h - b * 0.5, b * 0.55);
      monio(g, x + w - b * 0.5, y + h - b * 0.5, b * 0.55);
    } else if (!chico) {
      estrellita(g, x + b * 0.5, y + h - b * 0.5, er, tit(2));
      estrellita(g, x + w - b * 0.5, y + h - b * 0.5, er, tit(3));
    }

    // coronita arriba al centro
    corona(g, cx, y + b * 0.75, Math.max(9, Math.min(w * 0.34, s * 0.5)), chico);

    // destellito que aparece de a ratos
    if (t != null && !chico) {
      const k = (tt * 0.5) % 1, a = Math.max(0, Math.sin(k * Math.PI)) ** 3;
      if (a > 0.02) {
        g.save(); g.globalAlpha = a;
        estrella(g, x + w - b * 0.2, y + h * 0.35, b * 0.7, 4, 0.25);
        g.fillStyle = '#fff'; g.fill();
        g.restore();
      }
    }
    g.restore();
  };

  // ---------- Ícono chiquito para el minimapa: camarita rosa con corona ----------
  Mk.icono = function (ctx, cx, cy, r) {
    const g = ctx;
    g.save();
    g.lineJoin = 'round';
    circ(g, cx, cy, r, '#fff', TINTA, Math.max(1, r * 0.22));
    camarita(g, cx, cy + r * 0.12, r * 1.25, '#ff5d8f', '#fff');
    // coronita encima
    const a = r * 0.95, base = cy - r * 0.62, top = base - a * 0.55, x = cx - a / 2;
    g.beginPath();
    g.moveTo(x, base); g.lineTo(x, top + a * 0.15); g.lineTo(x + a * 0.25, top + a * 0.32);
    g.lineTo(cx, top); g.lineTo(x + a * 0.75, top + a * 0.32); g.lineTo(x + a, top + a * 0.15); g.lineTo(x + a, base);
    g.closePath();
    g.fillStyle = '#ffc93c'; g.fill();
    g.strokeStyle = TINTA; g.lineWidth = Math.max(0.6, r * 0.12); g.stroke();
    g.restore();
  };

  J.Marco = Mk;
})();
