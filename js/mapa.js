/* Minimapa redondo (abajo a la izquierda) y mapa completo del reino.
   Se pinta con el mismo arte del juego, en miniatura. */
(function () {
  const U = J.U, C = J.CFG;
  const Mp = { abierto: false, base: null, rumbo: -Math.PI / 2, pausadoJul: false };
  // píxeles de la miniatura por unidad de mundo: se ajusta para que la miniatura
  // no pase de ~2000 px de ancho aunque el reino crezca
  const ESC = Math.min(0.25, 2000 / C.MUNDO_W);
  const RADIO_MUNDO = 820;   // radio del mundo que cabe en el minimapa
  const S = 150;             // tamaño lógico del minimapa (px CSS)
  const $ = (id) => document.getElementById(id);

  // Miniatura del reino entero, pintada una sola vez con las mismas funciones del juego
  Mp.construirBase = function () {
    const D = J.Dibujo, M = J.Mundo;
    const c = document.createElement('canvas');
    c.width = Math.round(C.MUNDO_W * ESC); c.height = Math.round(C.MUNDO_H * ESC);
    const g = c.getContext('2d');
    g.setTransform(ESC, 0, 0, ESC, 0, 0);
    D.sueloFijo(g, { x0: 0, y0: 0, x1: C.MUNDO_W, y1: C.MUNDO_H, w: C.MUNDO_W, h: C.MUNDO_H });
    // flores como puntitos de color (se notan en la Pradera de las Flores)
    for (const f of M.flores) { g.fillStyle = f.color; g.fillRect(f.x - 7, f.y - 7, 14, 14); }
    const lista = M.objetos.filter((o) => o.x < C.MUNDO_W).sort((a, b) => a.orden - b.orden);
    for (const o of lista) {
      switch (o.tipo) {
        case 'colina': D.dibColina(g, o); break;
        case 'plataforma': D.dibPlataforma(g, o); break;
        case 'arbol': D.dibArbol(g, o, 0); break;
        case 'arbusto': D.dibArbusto(g, o, 0, -1e6, -1e6); break;
        case 'roca': D.dibRoca(g, o); break;
        case 'hongo': D.dibHongo(g, o, 0); break;
        case 'portal': D.dibPortal(g, o, 0); break;
        case 'castillo': D.dibCastillo(g, o, 0, 0); break;
      }
    }
    Mp.base = c;
  };

  // Punto del mapa donde está Julieth (dentro de un castillo, en su puerta)
  function posicion() {
    const s = J.Mundo.salaActiva, Ju = J.Jul;
    return s ? { x: s.castillo.x, y: s.castillo.y + 40 } : { x: Ju.x, y: Ju.y };
  }

  // Insignia de un castillo: el emblema, un aro dorado si falta visitarlo, y una tilde si ya se visitó
  function insignia(g, c, x, y, r, t) {
    const D = J.Dibujo;
    if (!c.visitado) {
      const k = (t * 1.2 + c.indice * 0.3) % 1;
      g.strokeStyle = `rgba(255,201,60,${1 - k})`; g.lineWidth = Math.max(1.5, r * 0.25);
      g.beginPath(); g.arc(x, y, r * (1.4 + k * 0.9), 0, U.TAU); g.stroke();
    }
    D.emblema(g, c.id, x, y, r);
    if (c.visitado) {
      const bx = x + r * 1.1, by = y + r * 1.0, br = r * 0.72;
      D.circ(g, bx, by, br, '#3fc25a', '#fff', Math.max(1.2, r * 0.16));
      g.strokeStyle = '#fff'; g.lineWidth = br * 0.34; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(bx - br * 0.42, by + br * 0.02); g.lineTo(bx - br * 0.1, by + br * 0.36); g.lineTo(bx + br * 0.46, by - br * 0.32); g.stroke();
    }
  }

  // ---------- Fotos de la cámara (J.Fotos puede no existir) ----------
  // Las más viejas primero, así las nuevas quedan dibujadas arriba
  function fotos() {
    const F = J.Fotos;
    if (!F || !F.lista || !J.Marco) return [];
    return F.lista().slice().sort((a, b) => (a.fecha || 0) - (b.fecha || 0));
  }
  // Miniaturas con marco ya pintadas, por foto y tamaño (se tiran cuando cambian las fotos)
  const miniFotos = new Map();
  let escuchandoFotos = false;
  function escucharFotos() {
    if (escuchandoFotos || !J.Fotos || !Array.isArray(J.Fotos.alCambiar)) return;
    escuchandoFotos = true;
    J.Fotos.alCambiar.push(() => {
      miniFotos.clear();
      if (Mp.abierto) { Mp.ponerEstado(); Mp.dibGrande(0); }
    });
  }
  function miniFoto(f, w, h, k) {
    const img = J.Fotos.imagen ? J.Fotos.imagen(f) : null;
    const clave = f.id + '|' + Math.round(w * k) + '|' + (img ? 1 : 0);
    let c = miniFotos.get(clave);
    if (!c) {
      const m = Math.ceil(h * 0.45); // margen para la corona, la sombra y los moñitos
      c = document.createElement('canvas');
      c.width = Math.ceil((w + m * 2) * k); c.height = Math.ceil((h + m * 2) * k);
      const g = c.getContext('2d'); g.scale(k, k);
      J.Marco.dibujar(g, img, w / 2 + m, h / 2 + m, w, h);
      c.m = m;
      if (img) for (const cl of miniFotos.keys()) if (cl.startsWith(f.id + '|')) miniFotos.delete(cl);
      miniFotos.set(clave, c);
    }
    return c;
  }
  // Cada foto en su lugar: un marquito con un piquito que señala el punto exacto
  function dibFotos(g, e, w, h, k, t) {
    const lista = fotos(); if (!lista.length) return;
    escucharFotos();
    const fw = U.limitar(w / 20, 34, 58), fh = fw * 0.78, pico = fh * 0.38;
    // primero todas las sombritas del punto, después los marcos (queda más prolijo si se apilan)
    for (const f of lista) {
      g.fillStyle = 'rgba(60,20,50,0.35)';
      g.beginPath(); g.ellipse(f.x * e, f.y * e, fw * 0.12, fw * 0.05, 0, 0, U.TAU); g.fill();
    }
    for (const f of lista) {
      const px = f.x * e, py = f.y * e;
      const cx = U.limitar(px, fw * 0.55, w - fw * 0.55);
      const cy = Math.max(fh * 0.75, py - pico - fh / 2);
      // piquito dorado del pin
      const base = cy + fh / 2 - 1;
      g.fillStyle = '#ffc93c'; g.strokeStyle = '#6b2460'; g.lineWidth = 1.5; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(cx - fw * 0.11, base); g.lineTo(px, py); g.lineTo(cx + fw * 0.11, base); g.closePath(); g.fill(); g.stroke();
      const c = miniFoto(f, fw, fh, k);
      g.drawImage(c, cx - fw / 2 - c.m, cy - fh / 2 - c.m, c.width / k, c.height / k);
    }
  }

  // ---------- Minimapa (siempre visible abajo a la izquierda) ----------
  // Vehículos y bote para los mapas: [{x, y, color, montado}]
  function transportes() {
    const out = [], V = J.Vehiculos, B = J.Bote;
    if (V && V.posiciones) for (const o of V.posiciones()) out.push({ x: o.x, y: o.y, montado: o.montado, color: o.tipo === 'auto' ? '#ff5d8f' : '#b07cff' });
    if (B && B.listo) out.push({ x: B.x, y: B.y, montado: B.montado(), color: '#ffffff' });
    return out;
  }

  Mp.dibMini = function (t) {
    if (!Mp.base) return;
    const g = Mp.miniG, T = Mp.mini.width, M = J.Mundo, Ju = J.Jul, Ci = J.Cielo;
    const p = posicion(), R = S / 2 - 8, e = R / RADIO_MUNDO;
    g.setTransform(T / S, 0, 0, T / S, 0, 0); g.clearRect(0, 0, S, S);

    g.save();
    g.beginPath(); g.arc(S / 2, S / 2, R, 0, U.TAU); g.clip();
    g.fillStyle = '#2f8f4e'; g.fillRect(0, 0, S, S);
    g.translate(S / 2, S / 2); g.scale(e / ESC, e / ESC);
    g.drawImage(Mp.base, -p.x * ESC, -p.y * ESC);
    g.restore();
    g.save();
    g.beginPath(); g.arc(S / 2, S / 2, R, 0, U.TAU); g.clip();
    if (Ci.noche > 0.02) { g.fillStyle = `rgba(22,26,90,${0.42 * Ci.noche})`; g.fillRect(0, 0, S, S); }
    if (J.Ruta && !M.salaActiva) J.Ruta.dibujarMini(g, S / 2, S / 2, p, e, t);
    // fotos: una camarita rosa con corona en cada lugar donde se sacó una
    if (J.Marco && J.Marco.icono) for (const f of fotos()) {
      const dx = (f.x - p.x) * e, dy = (f.y - p.y) * e;
      if (Math.hypot(dx, dy) > R - 6) continue;
      J.Marco.icono(g, S / 2 + dx, S / 2 + dy, 4.5);
    }
    // castillos: dentro del círculo en su lugar; los lejanos, pegados al borde en su dirección
    for (const c of M.castillos) {
      let dx = (c.x - p.x) * e, dy = (c.y - p.y) * e;
      const d = Math.hypot(dx, dy), max = R - 14, lejos = d > max;
      if (lejos) { dx *= max / d; dy *= max / d; }
      insignia(g, c, S / 2 + dx, S / 2 + dy, lejos ? 6 : 8, t);
    }
    // vehículos (rosa = auto, lila = caballito) y el bote-cisne (blanco)
    for (const o of transportes()) {
      if (o.montado) continue;
      const dx = (o.x - p.x) * e, dy = (o.y - p.y) * e;
      if (Math.hypot(dx, dy) > R - 6) continue;
      J.Dibujo.circ(g, S / 2 + dx, S / 2 + dy, 3.6, o.color, '#6b2460', 1.5);
    }
    // Julieth: flecha que mira hacia donde camina
    if (!M.salaActiva && Math.hypot(Ju.vx, Ju.vy) > 40) Mp.rumbo = Math.atan2(Ju.vy, Ju.vx);
    g.translate(S / 2, S / 2); g.rotate(Mp.rumbo + Math.PI / 2);
    g.fillStyle = '#ff5d8f'; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(0, -9); g.lineTo(7, 7); g.lineTo(0, 3.5); g.lineTo(-7, 7); g.closePath(); g.fill(); g.stroke();
    g.restore();

    // aro estilo juego y etiqueta N
    g.strokeStyle = '#6b2460'; g.lineWidth = 8; g.beginPath(); g.arc(S / 2, S / 2, R + 1, 0, U.TAU); g.stroke();
    g.strokeStyle = '#ff9dc8'; g.lineWidth = 3; g.beginPath(); g.arc(S / 2, S / 2, R + 1, 0, U.TAU); g.stroke();
    J.Dibujo.circ(g, S / 2, 9, 9, '#6b2460', '#fff', 2);
    g.fillStyle = '#fff'; g.font = '900 12px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', S / 2, 9.5);
  };

  // ---------- Mapa completo (al tocar el minimapa o pulsar M) ----------
  function medir() {
    const prop = C.MUNDO_W / C.MUNDO_H;
    const w = Math.max(240, Math.min(window.innerWidth - 40, (window.innerHeight - 170) * prop, 1100));
    const DPR = Math.min(2, window.devicePixelRatio || 1), cv = Mp.lienzo;
    cv.style.width = w + 'px'; cv.style.height = (w / prop) + 'px';
    cv.width = Math.round(w * DPR); cv.height = Math.round((w / prop) * DPR);
    Mp.anchoCss = w;
  }

  // Rótulo redondeado tipo cartel, con el mismo contorno morado del juego
  function rotulo(g, texto, x, y, relleno, color, tam) {
    g.font = `900 ${tam}px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(texto).width + tam * 1.2, h = tam * 1.7;
    g.fillStyle = relleno; g.strokeStyle = '#6b2460'; g.lineWidth = Math.max(2, tam * 0.16);
    J.Dibujo.redondo(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill(); g.stroke();
    g.fillStyle = color; g.fillText(texto, x, y + tam * 0.05);
  }

  Mp.dibGrande = function (t) {
    if (!Mp.base) return;
    const g = Mp.lienzoG, cv = Mp.lienzo, w = Mp.anchoCss, M = J.Mundo, Ju = J.Jul, Ci = J.Cielo, D = J.Dibujo;
    const k = cv.width / w, e = w / C.MUNDO_W, h = w * C.MUNDO_H / C.MUNDO_W;
    g.setTransform(k, 0, 0, k, 0, 0);
    g.drawImage(Mp.base, 0, 0, w, h);
    if (Ci.noche > 0.02) { g.fillStyle = `rgba(22,26,90,${0.36 * Ci.noche})`; g.fillRect(0, 0, w, h); }
    const tam = U.limitar(w / 66, 9, 16), conEstado = w >= 760; // con 11 castillos: en mapas angostos solo el nombre (la tilde ya indica la visita)

    // nombres de las regiones (praderas, lago, nieve...)
    g.save(); g.globalAlpha = 0.85;
    for (const l of M.lugares || []) rotulo(g, l.nombre, U.limitar(l.x * e, tam * 6, w - tam * 6), U.limitar(l.y * e, tam * 1.5, h - tam * 1.5), 'rgba(255,255,255,0.75)', '#3d5a80', tam * 0.75);
    g.restore();
    // muelles: un puntito de madera
    for (const m of M.muelles || []) {
      const x = m.tx * e, y = m.ty * e;
      D.circ(g, x, y, tam * 0.55, '#b9763f', '#6b2460', Math.max(1.5, tam * 0.12));
    }
    dibFotos(g, e, w, h, k, t); // fotos con marco de princesa: sobre el terreno, debajo de los marcadores
    if (J.Ruta) J.Ruta.dibujarMapa(g, e, t, tam); // destino elegido y sus rutas

    for (const o of transportes()) if (!o.montado) D.circ(g, o.x * e, o.y * e, tam * 0.42, o.color, '#6b2460', Math.max(1.5, tam * 0.12));

    for (const c of M.castillos) {
      const x = c.x * e, y = c.y * e;
      insignia(g, c, x, y - tam * 3.4, tam * 1.05, t);
      const xx = U.limitar(x, tam * 7, w - tam * 7), yy = U.limitar(y + tam * 1.4, tam * 2, h - tam * (conEstado ? 4.2 : 2));
      rotulo(g, c.nombre, xx, yy, '#fff6e5', '#6b2460', tam);
      if (conEstado) rotulo(g, c.visitado ? '✓ Visitado' : '★ Por visitar', xx, yy + tam * 1.9, c.visitado ? '#3fc25a' : '#ffc93c', c.visitado ? '#fff' : '#6b2460', tam * 0.85);
    }

    // Julieth: un globito con su carita que salta
    const p = posicion(), jx = p.x * e, jy = p.y * e;
    const salto = Math.abs(Math.sin(t * 3.2)) * tam * 0.5, r = tam * 1.25;
    const cy = jy - r * 2.3 - salto;
    g.fillStyle = 'rgba(20,40,60,0.3)'; g.beginPath(); g.ellipse(jx, jy, r * 0.5, r * 0.2, 0, 0, U.TAU); g.fill();
    g.fillStyle = '#ff5d8f'; g.strokeStyle = '#6b2460'; g.lineWidth = Math.max(2, tam * 0.18); g.lineJoin = 'round';
    g.beginPath(); g.moveTo(jx - r * 0.45, cy + r * 0.8); g.lineTo(jx, jy - salto); g.lineTo(jx + r * 0.45, cy + r * 0.8); g.closePath(); g.fill(); g.stroke();
    D.circ(g, jx, cy, r, '#ffe3ef', '#6b2460', Math.max(2, tam * 0.18));
    g.save(); g.beginPath(); g.arc(jx, cy, r - 1, 0, U.TAU); g.clip();
    g.translate(jx, cy + r * 1.9); g.scale(r / 30, r / 30);
    Ju.figura(g, { t, fase: Ju.fase, pose: Ju.pose(), velTrenza: Ju.velTrenza });
    g.restore();
    rotulo(g, 'Julieth', jx, cy - r - tam * 1.1, '#ff5d8f', '#fff', tam * 0.85);
  };

  // Texto de abajo del mapa: castillos visitados y, si hay, la leyenda de las fotos
  Mp.ponerEstado = function () {
    const n = J.Mundo.castillos.filter((c) => c.visitado).length, total = J.Mundo.castillos.length;
    const nf = fotos().length;
    Mp.estadoEl.textContent = (n === total ? `¡Visitaste los ${total} castillos!` : `Castillos visitados: ${n} de ${total}`) +
      (nf ? ` · 📷 Fotos: ${nf}` : '');
  };

  Mp.abrir = function () {
    const Ju = J.Jul;
    if (Mp.abierto || !document.body.classList.contains('jugando') || J.Dialogo.abierto || (J.Aula && J.Aula.abierto) || Ju.estado === 'puerta' || Ju.estado === 'escalera') return;
    Mp.abierto = true;
    J.Entrada.teclas = {}; if (J.Entrada._soltarPalanca) J.Entrada._soltarPalanca();
    if (Ju.estado === 'normal') { Ju.estado = 'charla'; Mp.pausadoJul = true; } // Julieth se queda quieta mientras mira el mapa
    Mp.ponerEstado();
    Mp.panel.classList.add('visible'); document.body.classList.add('mapa');
    medir(); Mp.dibGrande(0);
    if (J.Audio.puerta) J.Audio.puerta();
  };
  Mp.cerrar = function () {
    if (!Mp.abierto) return;
    Mp.abierto = false; Mp.panel.classList.remove('visible'); document.body.classList.remove('mapa');
    if (Mp.confirmando) Mp.rechazarDestino();
    if (J.Ruta && J.Ruta.destino) J.Ruta.calcular(); // al volver al juego, la ruta parte de donde está Julieth
    if (Mp.pausadoJul && J.Jul.estado === 'charla') J.Jul.estado = 'normal';
    Mp.pausadoJul = false;
    J.Entrada.consumirSalto();
  };

  // ---------- Confirmar el destino elegido ----------
  Mp.preguntar = function (si) {
    Mp.confirmando = si;
    Mp.confirmEl.classList.toggle('visible', si);
    if (si) $('mapa-si').focus();
  };
  Mp.aceptarDestino = function () {
    const R = J.Ruta;
    if (!R || !R.pendiente) { Mp.preguntar(false); return; }
    const d = R.pendiente; R.pendiente = null;
    Mp.preguntar(false);
    R.fijar(d.x, d.y);
    Mp.cerrar(); // cierra el mapa y Julieth ya puede ponerse en marcha siguiendo la ruta verde
  };
  Mp.rechazarDestino = function () {
    if (J.Ruta) J.Ruta.pendiente = null;
    Mp.preguntar(false);
    if (Mp.abierto) Mp.dibGrande(0);
  };

  Mp.iniciar = function () {
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    Mp.mini = $('minimapa-lienzo'); Mp.miniG = Mp.mini.getContext('2d');
    Mp.mini.width = Mp.mini.height = Math.round(S * DPR);
    Mp.panel = $('mapa'); Mp.lienzo = $('mapa-lienzo-grande'); Mp.lienzoG = Mp.lienzo.getContext('2d');
    Mp.estadoEl = $('mapa-estado');
    $('minimapa').addEventListener('click', (ev) => { ev.currentTarget.blur(); Mp.abrir(); });
    $('mapa-cerrar').addEventListener('click', Mp.cerrar);
    // tocar el mapa fija un destino; tocar la banderita lo quita
    Mp.lienzo.addEventListener('click', (ev) => {
      const R = J.Ruta; if (!R) return;
      const b = Mp.lienzo.getBoundingClientRect(), e = b.width / C.MUNDO_W;
      const x = (ev.clientX - b.left) / e, y = (ev.clientY - b.top) / e;
      const tam = U.limitar(Mp.anchoCss / 66, 9, 16);
      if (R.destino && Math.hypot((x - R.destino.x) * e, (y - R.destino.y) * e) < tam * 2) { R.quitar(); if (J.Audio.puerta) J.Audio.puerta(); }
      else { R.pendiente = { x, y }; Mp.preguntar(true); if (J.Audio.moneda) J.Audio.moneda(); }
      Mp.dibGrande(0);
    });
    // confirmación: "¿Deseas ir a este lugar?"
    Mp.confirmEl = $('mapa-confirmar');
    $('mapa-si').addEventListener('click', Mp.aceptarDestino);
    $('mapa-no').addEventListener('click', Mp.rechazarDestino);
    Mp.confirmEl.addEventListener('click', (ev) => { if (ev.target === Mp.confirmEl) Mp.rechazarDestino(); });
    Mp.panel.addEventListener('click', (ev) => { if (ev.target === Mp.panel) Mp.cerrar(); });
    window.addEventListener('resize', () => { if (Mp.abierto) medir(); });
    window.addEventListener('keydown', (e) => {
      if (Mp.abierto && Mp.confirmando) {
        e.stopImmediatePropagation();
        if (e.code === 'Enter' || e.code === 'KeyS') { e.preventDefault(); Mp.aceptarDestino(); }
        else if (e.code === 'Escape' || e.code === 'KeyN') { e.preventDefault(); Mp.rechazarDestino(); }
      } else if (Mp.abierto) {
        if (['Escape', 'KeyM', 'Enter', 'Space'].includes(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); Mp.cerrar(); }
        else { e.stopImmediatePropagation(); }
      } else if (e.code === 'KeyM' && !e.repeat && document.body.classList.contains('jugando')) {
        e.preventDefault(); e.stopImmediatePropagation(); Mp.abrir();
      }
    }, true);
    Mp.construirBase();
    escucharFotos(); // si J.Fotos carga después, se registra al dibujar la primera foto
  };

  J.Mapa = Mp;
})();
