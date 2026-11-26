/* Entrada: teclado (WASD / flechas, Shift, Espacio) y controles táctiles */
(function () {
  const E = {
    teclas: {}, x: 0, y: 0, correr: false,
    saltoAbajo: false, _saltoPulsado: false,
    tactil: { activo: false, id: null, ox: 0, oy: 0, x: 0, y: 0, correr: false, salto: false }
  };

  const MAPA = {
    ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der',
    ArrowUp: 'arr', KeyW: 'arr', ArrowDown: 'aba', KeyS: 'aba',
    ShiftLeft: 'correr', ShiftRight: 'correr', Space: 'salto',
    KeyE: 'montar', KeyF: 'montar' // subir/bajar del auto, del caballito o del bote
  };

  E.iniciar = function () {
    window.addEventListener('keydown', (e) => {
      const k = MAPA[e.code];
      if (!k) return;
      e.preventDefault();
      if (k === 'salto' && !E.teclas.salto) E._saltoPulsado = true;
      if (k === 'montar' && !e.repeat && !E.teclas.montar) E._montarPulsado = true;
      E.teclas[k] = true;
    });
    window.addEventListener('keyup', (e) => {
      const k = MAPA[e.code];
      if (k) { E.teclas[k] = false; e.preventDefault(); }
    });
    window.addEventListener('blur', () => { E.teclas = {}; soltarPalanca(); });

    // --- Táctil ---
    const zona = document.getElementById('zona-palanca');
    const base = document.getElementById('palanca-base');
    const perilla = document.getElementById('palanca-perilla');
    const T = E.tactil;
    const RADIO = 60;

    // Palanca FIJA: la base nunca se mueve (su lugar lo define el CSS). El toque en la
    // zona izquierda la activa y la perilla se desplaza respecto al centro fijo de la base.
    function centrarPalanca() {
      if (!base) return;
      const r = base.getBoundingClientRect();
      if (r.width) { T.ox = r.left + r.width / 2; T.oy = r.top + r.height / 2; }
    }
    function soltarPalanca() {
      const id = T.id;
      T.activo = false; T.id = null; T.x = 0; T.y = 0;
      if (zona && id !== null) { try { if (zona.hasPointerCapture(id)) zona.releasePointerCapture(id); } catch (_) {} }
      if (base) { base.classList.remove('viva'); perilla.style.transform = 'translate(-50%,-50%)'; }
    }
    E._soltarPalanca = soltarPalanca;
    E._palancaVisible = () => !!(zona && zona.getClientRects().length);

    function moverPerilla(cx, cy) {
      let dx = cx - T.ox, dy = cy - T.oy;
      const d = Math.hypot(dx, dy);
      if (d > RADIO) { dx *= RADIO / d; dy *= RADIO / d; }
      T.x = dx / RADIO; T.y = dy / RADIO;
      perilla.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    if (zona && base && perilla) {
      zona.addEventListener('pointerdown', (e) => {
        // Un toque nuevo con la palanca "activa" pero sin su puntero vivo = estado colgado: se recupera.
        if (T.activo && T.id !== e.pointerId) {
          let vivo = false;
          try { vivo = zona.hasPointerCapture(T.id); } catch (_) {}
          if (vivo) return; // ya hay un dedo en la palanca
          soltarPalanca();
        }
        e.preventDefault();
        centrarPalanca();
        T.activo = true; T.id = e.pointerId;
        base.classList.add('viva');
        try { zona.setPointerCapture(e.pointerId); } catch (_) {}
        moverPerilla(e.clientX, e.clientY);
      });
      zona.addEventListener('pointermove', (e) => {
        if (!T.activo || e.pointerId !== T.id) return;
        moverPerilla(e.clientX, e.clientY);
      });
      const fin = (e) => { if (T.activo && e.pointerId === T.id) soltarPalanca(); };
      zona.addEventListener('pointerup', fin);
      zona.addEventListener('pointercancel', fin);
      zona.addEventListener('lostpointercapture', fin);
      window.addEventListener('pointerup', fin);
      window.addEventListener('pointercancel', fin);
      // Respaldo con eventos touch: si ya no queda ningún dedo en pantalla, la palanca se suelta.
      const finTouch = (e) => { if (T.activo && (!e.touches || e.touches.length === 0)) soltarPalanca(); };
      window.addEventListener('touchend', finTouch, { passive: true });
      window.addEventListener('touchcancel', finTouch, { passive: true });
      document.addEventListener('visibilitychange', () => { if (document.hidden) { E.teclas = {}; soltarPalanca(); } });
      const recentrar = () => { soltarPalanca(); centrarPalanca(); };
      window.addEventListener('resize', recentrar);
      window.addEventListener('orientationchange', recentrar);
      zona.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    const boton = (id, alBajar, alSubir) => {
      const b = document.getElementById(id);
      if (!b) return;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('pulsado'); alBajar(); });
      const sube = () => { b.classList.remove('pulsado'); alSubir(); };
      b.addEventListener('pointerup', sube);
      b.addEventListener('pointercancel', sube);
      b.addEventListener('pointerleave', sube);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    };
    boton('btn-saltar', () => { T.salto = true; E._saltoPulsado = true; }, () => { T.salto = false; });
    boton('btn-correr', () => { T.correr = true; }, () => { T.correr = false; });
    boton('btn-montar', () => { E._montarPulsado = true; }, () => {});

    // Mostrar controles táctiles si el dispositivo tiene pantalla táctil
    const mostrar = () => document.body.classList.add('tactil');
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) mostrar();
    window.addEventListener('touchstart', mostrar, { once: true, passive: true });
  };

  // Se llama una vez por fotograma
  E.leer = function () {
    const k = E.teclas, T = E.tactil;
    let x = (k.der ? 1 : 0) - (k.izq ? 1 : 0);
    let y = (k.aba ? 1 : 0) - (k.arr ? 1 : 0);
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    // Si los controles se ocultaron (diálogo, espejo, menú) con el dedo apoyado, no llega pointerup: soltar.
    if (T.activo && E._palancaVisible && !E._palancaVisible()) E._soltarPalanca();
    if (T.activo) {
      const m = Math.hypot(T.x, T.y);
      if (m > 0.18) { x = T.x / Math.max(m, 0.75); y = T.y / Math.max(m, 0.75); const n = Math.hypot(x, y); if (n > 1) { x /= n; y /= n; } }
    }
    E.x = x; E.y = y;
    E.correr = !!k.correr || T.correr;
    E.saltoAbajo = !!k.salto || T.salto;
  };

  // true solo en el fotograma en que se pulsó subir/bajar (E, F o el botón táctil)
  E.consumirMontar = function () {
    const v = E._montarPulsado; E._montarPulsado = false; return !!v;
  };

  // true solo en el fotograma en que se pulsó saltar
  E.consumirSalto = function () {
    const v = E._saltoPulsado; E._saltoPulsado = false; return v;
  };

  J.Entrada = E;
})();
