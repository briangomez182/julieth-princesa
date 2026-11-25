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

    function soltarPalanca() {
      T.activo = false; T.id = null; T.x = 0; T.y = 0;
      if (base) { base.classList.remove('viva'); base.style.left = base.style.top = ''; perilla.style.transform = 'translate(-50%,-50%)'; }
    }
    E._soltarPalanca = soltarPalanca;

    if (zona) {
      zona.addEventListener('pointerdown', (e) => {
        if (T.activo) return;
        e.preventDefault();
        T.activo = true; T.id = e.pointerId; T.ox = e.clientX; T.oy = e.clientY;
        base.style.left = e.clientX + 'px'; base.style.top = e.clientY + 'px';
        perilla.style.transform = 'translate(-50%,-50%)';
        base.classList.add('viva');
        try { zona.setPointerCapture(e.pointerId); } catch (_) {}
      });
      zona.addEventListener('pointermove', (e) => {
        if (!T.activo || e.pointerId !== T.id) return;
        let dx = e.clientX - T.ox, dy = e.clientY - T.oy;
        const d = Math.hypot(dx, dy);
        if (d > RADIO) { dx *= RADIO / d; dy *= RADIO / d; }
        T.x = dx / RADIO; T.y = dy / RADIO;
        perilla.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      });
      const fin = (e) => { if (e.pointerId === T.id) soltarPalanca(); };
      zona.addEventListener('pointerup', fin);
      zona.addEventListener('pointercancel', fin);
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
