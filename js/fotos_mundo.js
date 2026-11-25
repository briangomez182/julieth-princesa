/* Fotos en el mundo: cada foto que saca la nena queda como una camarita
   flotando en el lugar donde la sacó. Si Julieth pasa cerca, se ve la foto
   enmarcada arriba y aparece el botón "Borrar foto" (o Supr / Borrar).
   Depende (con chequeos) de J.Fotos, J.Marco, J.Part, J.Dibujo, J.HUD y J.Audio. */
(function () {
  const TAU = Math.PI * 2;
  const TINTA = '#5b2a4e';
  const DIST_CERCA = 110;     // a qué distancia de una foto aparece "Borrar"
  const MINI = 120;           // ancho aprox. de la miniatura enmarcada en el mundo

  const FM = {
    cercana: null,            // la foto que está cerca de Julieth (o null)
    confirmando: null,        // la foto que se está por borrar (diálogo abierto)
    t: 0
  };
  const entradas = new Map(); // id → { tipo: 'foto', foto, orden, vis, fase }
  let btn = null, dlg = null, dlgLienzo = null, dlgSi = null, dlgNo = null;
  let suscripto = false, borrando = false, listaCache = [];

  // ---------- Ayudas ----------
  const hayFotos = () => !!(J.Fotos && typeof J.Fotos.lista === 'function');
  function obtenerLista() {
    if (!hayFotos()) return [];
    try { return J.Fotos.lista() || []; } catch (_) { return []; }
  }
  function imagenDe(foto) {
    if (!J.Fotos || typeof J.Fotos.imagen !== 'function') return null;
    try {
      const im = J.Fotos.imagen(foto);
      if (!im) return null;
      if (im.tagName === 'IMG' && !(im.complete && im.naturalWidth)) return null;
      return im;
    } catch (_) { return null; }
  }
  function tamImagen(im) {
    const w = im.naturalWidth || im.width || 4, h = im.naturalHeight || im.height || 3;
    return { w, h };
  }
  function entradaDe(foto) {
    let e = entradas.get(foto.id);
    if (!e) { e = { tipo: 'foto', foto, orden: foto.y, vis: 0, fase: Math.random() * TAU }; entradas.set(foto.id, e); }
    e.foto = foto; e.orden = foto.y;
    return e;
  }
  function podarEntradas() {
    const vivos = new Set(listaCache.map((f) => f.id));
    for (const id of entradas.keys()) if (!vivos.has(id)) entradas.delete(id);
    if (FM.cercana && !vivos.has(FM.cercana.id)) FM.cercana = null;
    if (FM.confirmando && !vivos.has(FM.confirmando.id)) cerrarConfirmacion();
  }
  function suscribir() {
    if (suscripto || !J.Fotos || !Array.isArray(J.Fotos.alCambiar)) return;
    suscripto = true; listaCache = obtenerLista();
    J.Fotos.alCambiar.push(() => { listaCache = obtenerLista(); podarEntradas(); });
  }
  function puedeJugar() {
    const b = document.body;
    if (!b || !b.classList.contains('jugando')) return false;
    if (J.Dialogo && (J.Dialogo.abierto)) return false;
    if (J.Mapa && J.Mapa.abierto) return false;
    if (J.Espejo && J.Espejo.abierto) return false;
    return true;
  }

  // ---------- Marco (usa J.Marco si está; si no, uno dorado sencillo) ----------
  function marcoSimple(ctx, img, cx, cy, w, h) {
    const p = Math.max(5, w * 0.07), x = cx - w / 2, y = cy - h / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(60,20,70,0.25)';
    redondo(ctx, x - p + 3, y - p + 5, w + p * 2, h + p * 2, p * 1.4); ctx.fill();
    const g = ctx.createLinearGradient(x, y - p, x + w, y + h + p);
    g.addColorStop(0, '#fff1a8'); g.addColorStop(0.5, '#ffc93c'); g.addColorStop(1, '#e89a1a');
    ctx.fillStyle = g; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5;
    redondo(ctx, x - p, y - p, w + p * 2, h + p * 2, p * 1.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff6e5'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    if (img) ctx.drawImage(img, x, y, w, h);
    else { ctx.fillStyle = '#ffd6e6'; ctx.fillRect(x, y, w, h); }
    ctx.strokeStyle = 'rgba(91,42,78,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
    // corazoncitos en las esquinas
    ctx.fillStyle = '#ff5d8f';
    const r = p * 0.55;
    for (const [qx, qy] of [[x - p / 2, y - p / 2], [x + w + p / 2, y - p / 2], [x - p / 2, y + h + p / 2], [x + w + p / 2, y + h + p / 2]]) {
      corazon(ctx, qx, qy, r); ctx.fill();
    }
    ctx.restore();
  }
  function dibujarMarco(ctx, img, cx, cy, w, h, t) {
    if (img && J.Marco && typeof J.Marco.dibujar === 'function') {
      try { J.Marco.dibujar(ctx, img, cx, cy, w, h, t); return; } catch (_) { /* cae al marco simple */ }
    }
    marcoSimple(ctx, img, cx, cy, w, h);
  }

  // helpers de dibujo: los de J.Dibujo si están, si no unos propios
  function redondo(g, x, y, w, h, r) {
    if (J.Dibujo && J.Dibujo.redondo) return J.Dibujo.redondo(g, x, y, w, h, r);
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function corazon(g, x, y, s) {
    if (J.Dibujo && J.Dibujo.corazon) return J.Dibujo.corazon(g, x, y, s);
    g.beginPath(); g.arc(x, y, s, 0, TAU);
  }
  function estrella(g, x, y, r, puntas, interior) {
    if (J.Dibujo && J.Dibujo.estrella) return J.Dibujo.estrella(g, x, y, r, puntas, interior);
    g.beginPath(); g.arc(x, y, r * 0.6, 0, TAU);
  }
  function sombra(ctx, x, y, rx, alfa) {
    if (J.Dibujo && J.Dibujo.sombra) return J.Dibujo.sombra(ctx, x, y, rx, alfa);
    ctx.fillStyle = `rgba(20,40,60,${alfa})`; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.42, 0, 0, TAU); ctx.fill();
  }

  // ---------- Interfaz (botón + confirmación) ----------
  function crearInterfaz() {
    if (typeof document === 'undefined' || !document.body) return;
    btn = document.getElementById('btn-borrar-foto');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'btn-borrar-foto'; btn.type = 'button';
      btn.innerHTML = '<span class="ico">🗑️</span> <span>Borrar foto</span> <kbd>Supr</kbd>';
      document.body.appendChild(btn);
    }
    btn.setAttribute('aria-label', 'Borrar foto');
    btn.addEventListener('click', (e) => { e.preventDefault(); btn.blur(); abrirConfirmacion(); });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());

    dlg = document.getElementById('confirmar-foto');
    if (!dlg) {
      dlg = document.createElement('div');
      dlg.id = 'confirmar-foto';
      dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
      dlg.innerHTML =
        '<div class="tarjeta-foto">' +
        '<canvas class="mini-foto" width="440" height="340"></canvas>' +
        '<p class="pregunta">¿Borrar esta foto?</p>' +
        '<div class="opciones-foto">' +
        '<button type="button" class="si">🗑️ Sí, borrar</button>' +
        '<button type="button" class="no">💖 No</button>' +
        '</div></div>';
      document.body.appendChild(dlg);
    }
    dlgLienzo = dlg.querySelector('canvas');
    dlgSi = dlg.querySelector('.si'); dlgNo = dlg.querySelector('.no');
    if (dlgSi) dlgSi.addEventListener('click', (e) => { e.preventDefault(); e.currentTarget.blur(); confirmarBorrado(); });
    if (dlgNo) dlgNo.addEventListener('click', (e) => { e.preventDefault(); e.currentTarget.blur(); cerrarConfirmacion(); });
    dlg.addEventListener('pointerdown', (e) => { if (e.target === dlg) cerrarConfirmacion(); }); // tocar afuera = No
  }

  function mostrarBoton(si) {
    if (!btn) return;
    btn.classList.toggle('visible', !!si);
  }

  function dibujarMiniaturaDialogo() {
    if (!dlgLienzo || !FM.confirmando) return;
    const g = dlgLienzo.getContext('2d'), W = dlgLienzo.width, H = dlgLienzo.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const img = imagenDe(FM.confirmando);
    let w = W * 0.74, h = H * 0.68;
    if (img) {
      const s = tamImagen(img), k = Math.min(w / s.w, h / s.h);
      w = s.w * k; h = s.h * k;
    }
    dibujarMarco(g, img, W / 2, H / 2, w, h, FM.t);
  }

  function abrirConfirmacion() {
    const f = FM.cercana;
    if (!f || !dlg || borrando || !puedeJugar()) return;
    FM.confirmando = f;
    dlg.classList.add('visible');
    document.body.classList.add('confirmando-foto');
    mostrarBoton(false);
    dibujarMiniaturaDialogo();
    if (J.Audio && typeof J.Audio.blip === 'function') try { J.Audio.blip(); } catch (_) {}
    if (dlgNo) setTimeout(() => { try { dlgNo.focus({ preventScroll: true }); } catch (_) {} }, 30);
  }
  function cerrarConfirmacion() {
    if (!FM.confirmando && !(dlg && dlg.classList.contains('visible'))) return;
    FM.confirmando = null;
    if (dlg) dlg.classList.remove('visible');
    document.body.classList.remove('confirmando-foto');
    if (document.activeElement && dlg && dlg.contains(document.activeElement)) document.activeElement.blur();
  }

  function festejo(x, y) {
    const P = J.Part;
    if (P) {
      try {
        if (P.chispas) P.chispas(x, y, 30, 26, '#ffd23f');
        if (P.confeti) P.confeti(x, y, 24, 22);
        if (P.corazones) P.corazones(x, y, 30, 5);
        if (P.texto) P.texto(x, y, 96, '¡Foto borrada!', '#ff8fb8', 24);
      } catch (_) {}
    } else if (J.HUD && J.HUD.aviso) J.HUD.aviso('¡Foto borrada!', 2);
    if (J.Audio && typeof J.Audio.estrella === 'function') try { J.Audio.estrella(); } catch (_) {}
  }

  function confirmarBorrado() {
    const f = FM.confirmando;
    cerrarConfirmacion();
    if (!f || borrando || !J.Fotos || typeof J.Fotos.borrar !== 'function') return;
    borrando = true;
    const x = f.x, y = f.y;
    let p;
    try { p = Promise.resolve(J.Fotos.borrar(f.id)); } catch (err) { p = Promise.reject(err); }
    p.then(() => {
      entradas.delete(f.id);
      if (FM.cercana && FM.cercana.id === f.id) FM.cercana = null;
      listaCache = obtenerLista();
      festejo(x, y);
    }).catch(() => {
      if (J.HUD && J.HUD.aviso) J.HUD.aviso('Uy, no se pudo borrar la foto', 2.5);
    }).then(() => { borrando = false; });
  }

  // ---------- Teclado: Supr / Borrar abre la confirmación; Enter = Sí, Esc = No ----------
  function alTeclear(e) {
    const tg = e.target;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
    if (FM.confirmando) {
      if (e.code === 'Escape' || e.code === 'KeyN') { e.preventDefault(); e.stopImmediatePropagation(); cerrarConfirmacion(); }
      else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyS' || e.code === 'Delete') {
        // Enter sobre un botón enfocado lo deja al click del botón
        if ((e.code === 'Enter' || e.code === 'NumpadEnter') && tg && tg.tagName === 'BUTTON' && dlg.contains(tg)) return;
        e.preventDefault(); e.stopImmediatePropagation(); confirmarBorrado();
      }
      return;
    }
    if ((e.code === 'Delete' || e.code === 'Backspace') && !e.repeat && FM.cercana && puedeJugar()) {
      e.preventDefault();
      abrirConfirmacion();
    }
  }

  // ---------- API ----------
  FM.iniciar = function () {
    crearInterfaz();
    suscribir();
    listaCache = obtenerLista();
    if (document.body && 'ontouchstart' in window) document.body.classList.add('tactil-foto');
    window.addEventListener('keydown', alTeclear, true); // en captura, para ganarle al Esc de la pausa
  };

  FM.actualizar = function (dt, ju) {
    FM.t += dt || 0;
    if (!suscripto) suscribir();
    if (!suscripto || (FM.t % 1) < (dt || 0)) listaCache = obtenerLista(); // sin aviso de cambios: refresca 1 vez por segundo
    let mejor = null;
    if (ju && listaCache.length && puedeJugar() && ju.estado !== 'puerta' && ju.estado !== 'escalera') {
      let md = DIST_CERCA * DIST_CERCA;
      for (const f of listaCache) {
        const dx = f.x - ju.x, dy = f.y - ju.y, d = dx * dx + dy * dy;
        if (d < md) { md = d; mejor = f; }
      }
    }
    if (mejor !== FM.cercana && !(mejor && FM.cercana && mejor.id === FM.cercana.id)) {
      FM.cercana = mejor;
      if (FM.confirmando && (!mejor || mejor.id !== FM.confirmando.id)) cerrarConfirmacion();
    }
    if (FM.confirmando && !puedeJugar()) cerrarConfirmacion();
    mostrarBoton(!!FM.cercana && !FM.confirmando && !borrando);
    // la miniatura del mundo aparece y desaparece suave
    const k = Math.min(1, (dt || 0) * 7);
    for (const e of entradas.values()) {
      const meta = FM.cercana && e.foto.id === FM.cercana.id ? 1 : 0;
      e.vis += (meta - e.vis) * k;
      if (e.vis < 0.01 && !meta) e.vis = 0;
    }
    if (FM.confirmando) dibujarMiniaturaDialogo(); // por si el marco tiene brillitos animados
  };

  // ¿qué foto hay en este punto del mundo? (para tocarla y verla en grande)
  FM.fotoEn = function (x, y) {
    let mejor = null, md = Infinity;
    const dentro = (r) => r && Math.abs(x - r.x) <= r.w / 2 && Math.abs(y - r.y) <= r.h / 2;
    for (const e of entradas.values()) {
      const h = e.hit; if (!h) continue;
      if (dentro(h.marco)) return e.foto;
      if (dentro(h)) { const d = Math.hypot(x - h.x, y - h.y); if (d < md) { md = d; mejor = e.foto; } }
    }
    return mejor;
  };

  FM.agregarVisibles = function (vista, lista) {
    const L = listaCache.length || !hayFotos() ? listaCache : (listaCache = obtenerLista());
    if (!L.length || !lista) return lista;
    const v = vista || { x0: -Infinity, x1: Infinity, y0: -Infinity, y1: Infinity };
    for (const f of L) {
      if (f.x < v.x0 - 120 || f.x > v.x1 + 120 || f.y < v.y0 - 60 || f.y > v.y1 + 260) continue;
      lista.push(entradaDe(f));
    }
    return lista;
  };

  // la camarita de princesa (centrada en 0,0)
  function dibCamara(ctx, t) {
    // cuerpo
    ctx.fillStyle = '#ff8fb8'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.5;
    redondo(ctx, -15, -14, 12, 8, 3); ctx.fill(); ctx.stroke();              // visor
    redondo(ctx, -22, -9, 44, 28, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffc2d8'; redondo(ctx, -19, -6, 38, 7, 4); ctx.fill();   // brillo de arriba
    ctx.fillStyle = '#ff5d8f'; redondo(ctx, -22, 9, 44, 10, 6); ctx.fill();   // franja de abajo
    ctx.strokeStyle = TINTA; redondo(ctx, -22, -9, 44, 28, 8); ctx.stroke();
    // flash dorado y botoncito
    ctx.fillStyle = '#ffe873'; redondo(ctx, 10, -5, 8, 5, 2); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(-16, -11, 2.2, 0, TAU); ctx.fill();
    // lente: aro dorado, vidrio celeste y brillo
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(0, 5, 11.5, 0, TAU); ctx.fill(); ctx.stroke();
    const g = ctx.createRadialGradient(-3, 2, 1, 0, 5, 8);
    g.addColorStop(0, '#e6fbff'); g.addColorStop(0.5, '#8fdcff'); g.addColorStop(1, '#3a8fd1');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 5, 7.5, 0, TAU); ctx.fill();
    ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(-2.6, 2.2, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff5d8f'; corazon(ctx, 15, 13, 2.6); ctx.fill();
    // coronita encima
    ctx.save(); ctx.translate(3, -14); ctx.rotate(0.12);
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = TINTA; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(-9, -9); ctx.lineTo(-4, -4); ctx.lineTo(0, -11);
    ctx.lineTo(4, -4); ctx.lineTo(9, -9); ctx.lineTo(8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5d8f'; ctx.beginPath(); ctx.arc(0, -3, 1.6, 0, TAU); ctx.fill();
    ctx.restore();
    // destellito que titila
    const a = 0.5 + 0.5 * Math.sin(t * 3.1);
    ctx.globalAlpha = a; ctx.fillStyle = '#fff6b0';
    estrella(ctx, 20, -16, 4 + a * 2, 4, 0.3); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function burbuja(ctx, x, y, t) {
    const tactil = document.body.classList.contains('tactil') || document.body.classList.contains('tactil-foto');
    const txt = tactil ? '¡Toca Borrar!' : 'Supr  Borrar';
    y += Math.sin(t * 4) * 3;
    ctx.save();
    ctx.font = '900 16px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(txt).width + 24;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = TINTA; ctx.lineWidth = 3;
    redondo(ctx, x - w / 2, y - 14, w, 28, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5d8f'; ctx.fillText(txt, x, y + 1);
    ctx.restore();
  }

  FM.dibujar = function (ctx, o, t) {
    const f = o && o.foto; if (!f) return;
    t = t === undefined ? FM.t : t;
    const fase = o.fase || 0, flota = Math.sin(t * 2.2 + fase) * 4;
    const alto = 36 + flota;
    ctx.save();
    sombra(ctx, f.x, f.y, 15 - flota * 0.6, 0.2);
    ctx.translate(f.x, f.y - alto);
    ctx.rotate(Math.sin(t * 1.6 + fase) * 0.06);
    const e = 1 + o.vis * 0.12; ctx.scale(e, e);
    dibCamara(ctx, t + fase);
    ctx.restore();
    o.hit = { x: f.x, y: f.y - alto, w: 70, h: 64, marco: null }; // zona tocable (camarita)

    // si es la cercana: la foto enmarcada arriba + burbuja
    if (o.vis > 0.02) {
      const img = imagenDe(f);
      let w = MINI, h = MINI * 0.75;
      if (img) { const s = tamImagen(img), k = Math.min(MINI / s.w, (MINI * 1.1) / s.h); w = s.w * k; h = s.h * k; }
      const sube = (1 - o.vis) * 18;
      const cy = f.y - alto - 44 - h / 2 + sube + Math.sin(t * 2) * 2;
      ctx.save();
      ctx.globalAlpha = Math.min(1, o.vis);
      ctx.translate(f.x, cy); const s = 0.7 + 0.3 * o.vis; ctx.scale(s, s);
      dibujarMarco(ctx, img, 0, 0, w, h, t);
      ctx.restore();
      if (o.vis > 0.3) o.hit.marco = { x: f.x, y: cy, w: w * s + 40, h: h * s + 40 }; // y el cuadrito enmarcado
      ctx.save(); ctx.globalAlpha = Math.min(1, o.vis);
      burbuja(ctx, f.x, cy - h / 2 - 34, t);
      ctx.restore();
    }
  };

  J.FotosMundo = FM;
})();
