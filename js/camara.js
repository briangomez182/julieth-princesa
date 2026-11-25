/* Cámara de fotos: Julieth se saca una foto con la cámara frontal en cualquier
   lugar del reino. Si toca "Guardar", la foto queda guardada en ese punto del mapa
   (J.Fotos se encarga de guardarla y de dibujar la camarita). */
(function () {
  const TEXTOS = {
    abriendo: 'Abriendo la cámara… ✨',
    lista: '¡Sonreí, princesa! 👑',
    preview: '¿Te gusta cómo saliste? 💕',
    guardando: 'Guardando… ✨',
    guardada: '¡Foto guardada! 📷',
    sinCamara: 'No pude abrir la cámara 😢 Pedile a un adulto que abra el juego con el servidor (node servidor.js)',
    sinPermiso: 'No me dieron permiso para usar la cámara 😢 Pedile a un adulto que lo habilite en el navegador',
    noGuardo: 'Uy, no pude guardar la foto 😢 Probá otra vez'
  };
  const LADO_MAX = 960;   // tamaño máximo de la foto guardada (px)
  const CALIDAD = 0.85;   // calidad JPEG

  const C = { abierto: false, stream: null, token: 0, estado: '', foto: null, timers: [] };
  const $ = (id) => document.getElementById(id);
  const son = (n) => { try { if (J.Audio && typeof J.Audio[n] === 'function') J.Audio[n](); } catch (_) {} };

  function el(tag, props, padre) {
    const e = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === 'texto') e.textContent = props[k];
      else if (k === 'clase') e.className = props[k];
      else e.setAttribute(k, props[k]);
    }
    if (padre) padre.appendChild(e);
    return e;
  }
  function luego(f, ms) {
    const tk = C.token;
    C.timers.push(setTimeout(() => { if (tk === C.token && C.abierto) f(); }, ms));
  }
  function limpiarTimers() { C.timers.forEach(clearTimeout); C.timers.length = 0; }

  // ---- Armado del modal (todo por JS) ----
  function crearModal() {
    const m = el('div', { id: 'camara', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Cámara de fotos' }, document.body);
    const escena = el('div', { clase: 'camara-escena' }, m);
    const marco = el('div', { clase: 'camara-marco' }, escena);
    el('div', { clase: 'camara-corona', 'aria-hidden': 'true' }, marco);
    ['c1', 'c2', 'c3', 'c4'].forEach((c) => el('span', { clase: 'camara-deco corazon ' + c, 'aria-hidden': 'true', texto: '💖' }, marco));
    ['e1', 'e2', 'e3', 'e4'].forEach((c) => el('span', { clase: 'camara-deco estrella ' + c, 'aria-hidden': 'true', texto: '✨' }, marco));
    const vidrio = el('div', { clase: 'camara-vidrio' }, marco);
    C.video = el('video', { id: 'camara-video', playsinline: '', muted: '', autoplay: '' }, vidrio);
    C.video.muted = true; C.video.playsInline = true;
    C.lienzo = el('canvas', { id: 'camara-foto' }, vidrio);
    C.cuenta = el('div', { id: 'camara-cuenta', 'aria-live': 'assertive' }, vidrio);
    C.flash = el('div', { id: 'camara-flash' }, vidrio);
    C.texto = el('p', { id: 'camara-texto', 'aria-live': 'polite' }, escena);
    const bot = el('div', { id: 'camara-botones' }, escena);
    C.btnSacar = el('button', { id: 'camara-sacar', type: 'button', clase: 'principal', texto: '📸 ¡Sacar foto!' }, bot);
    C.btnGuardar = el('button', { id: 'camara-guardar', type: 'button', clase: 'principal', texto: '💖 Guardar' }, bot);
    C.btnOtra = el('button', { id: 'camara-otra', type: 'button', texto: '🔄 Otra' }, bot);
    C.btnCerrar = el('button', { id: 'camara-cerrar', type: 'button', texto: 'Cerrar ✕' }, bot);
    C.modal = m; C.marco = marco;

    const clic = (b, f) => b.addEventListener('click', (ev) => { ev.stopPropagation(); b.blur(); f(); });
    clic(C.btnSacar, sacar);
    clic(C.btnGuardar, guardar);
    clic(C.btnOtra, otra);
    clic(C.btnCerrar, C.cerrar);
    // que los toques del modal no lleguen a los controles del juego
    ['pointerdown', 'touchstart', 'mousedown'].forEach((t) => m.addEventListener(t, (e) => e.stopPropagation()));
  }

  function mostrarTexto(t) { C.texto.textContent = t || ''; }
  // estados: 'abriendo' | 'vivo' | 'cuenta' | 'preview' | 'guardando' | 'error'
  function estado(s) {
    C.estado = s;
    C.modal.dataset.estado = s;
    C.btnSacar.hidden = s !== 'vivo' && s !== 'cuenta';
    C.btnSacar.disabled = s === 'cuenta';
    C.btnGuardar.hidden = s !== 'preview' && s !== 'guardando';
    C.btnGuardar.disabled = s === 'guardando';
    C.btnOtra.hidden = s !== 'preview';
    C.btnCerrar.hidden = false;
  }

  // ---- Cámara frontal (mismo enfoque que el espejo mágico) ----
  function abrirCamara() {
    const tk = C.token;
    estado('abriendo'); mostrarTexto(TEXTOS.abriendo);
    const md = navigator.mediaDevices;
    if (!window.isSecureContext || !md || !md.getUserMedia) { error(TEXTOS.sinCamara); return; }
    md.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then((st) => {
        if (tk !== C.token || !C.abierto) { st.getTracks().forEach((k) => k.stop()); return; }
        C.stream = st; C.video.srcObject = st;
        const p = C.video.play(); if (p && p.catch) p.catch(() => {});
        estado('vivo'); mostrarTexto(TEXTOS.lista);
      })
      .catch((e) => {
        if (tk !== C.token) return;
        const n = e && e.name;
        error(n === 'NotAllowedError' || n === 'SecurityError' ? TEXTOS.sinPermiso : TEXTOS.sinCamara);
      });
  }
  function detenerCamara() {
    if (C.stream) { C.stream.getTracks().forEach((k) => k.stop()); C.stream = null; }
    if (C.video) { try { C.video.pause(); } catch (_) {} C.video.srcObject = null; }
  }
  function error(t) { detenerCamara(); estado('error'); mostrarTexto(t); }

  // ---- Sacar foto: cuenta 3-2-1, flash y captura ----
  function sacar() {
    if (C.estado !== 'vivo') return;
    estado('cuenta');
    let n = 3;
    const paso = () => {
      if (n === 0) { C.cuenta.textContent = ''; C.cuenta.classList.remove('late'); capturar(); return; }
      C.cuenta.textContent = String(n);
      C.cuenta.classList.remove('late'); void C.cuenta.offsetWidth; C.cuenta.classList.add('late');
      son('blip');
      n--; luego(paso, 900);
    };
    paso();
  }
  function capturar() {
    const v = C.video, vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || !vh) { estado('vivo'); mostrarTexto(TEXTOS.lista); return; }
    const k = Math.min(1, LADO_MAX / Math.max(vw, vh));
    const w = Math.round(vw * k), h = Math.round(vh * k);
    const c = C.lienzo; c.width = w; c.height = h;
    const g = c.getContext('2d');
    // espejada, igual que se ve en pantalla
    g.setTransform(-1, 0, 0, 1, w, 0);
    g.drawImage(v, 0, 0, w, h);
    g.setTransform(1, 0, 0, 1, 0, 0);
    C.flash.classList.remove('flash'); void C.flash.offsetWidth; C.flash.classList.add('flash');
    son('estrella');
    C.modal.classList.add('con-foto');
    estado('preview'); mostrarTexto(TEXTOS.preview);
  }
  function otra() {
    C.modal.classList.remove('con-foto');
    if (C.stream) { estado('vivo'); mostrarTexto(TEXTOS.lista); } else abrirCamara();
  }

  // ---- Guardar: canvas → JPEG → J.Fotos ----
  function guardar() {
    if (C.estado !== 'preview') return;
    if (!J.Fotos || typeof J.Fotos.agregar !== 'function') { mostrarTexto(TEXTOS.noGuardo); return; }
    estado('guardando'); mostrarTexto(TEXTOS.guardando);
    const tk = C.token;
    const x = J.Jul ? J.Jul.x : 0, y = J.Jul ? J.Jul.y : 0;
    const fallo = () => { if (tk === C.token && C.abierto) { estado('preview'); mostrarTexto(TEXTOS.noGuardo); son('auch'); } };
    C.lienzo.toBlob((blob) => {
      if (tk !== C.token || !C.abierto) return;
      if (!blob) { fallo(); return; }
      Promise.resolve()
        .then(() => J.Fotos.agregar(blob, x, y))
        .then(() => {
          if (tk !== C.token || !C.abierto) return;
          mostrarTexto(TEXTOS.guardada); son('fiesta');
          C.modal.classList.add('guardada');
          luego(() => {
            C.cerrar();
            if (J.HUD && J.HUD.aviso) J.HUD.aviso(TEXTOS.guardada, 2.5);
          }, 1300);
        })
        .catch(fallo);
    }, 'image/jpeg', CALIDAD);
  }

  // ---- Abrir / cerrar ----
  C.abrir = function () {
    if (C.abierto) return;
    C.abierto = true; C.token++;
    const Ju = J.Jul;
    if (Ju) { Ju.vx = 0; Ju.vy = 0; }
    if (J.Entrada) { J.Entrada.teclas = {}; if (J.Entrada._soltarPalanca) J.Entrada._soltarPalanca(); }
    C.modal.classList.remove('con-foto', 'guardada');
    C.cuenta.textContent = '';
    C.modal.classList.add('visible'); document.body.classList.add('camara-abierta');
    son('blip');
    abrirCamara();
  };
  C.cerrar = function () {
    if (!C.abierto) return;
    C.abierto = false; C.token++;
    limpiarTimers(); detenerCamara();
    C.modal.classList.remove('visible', 'con-foto', 'guardada');
    document.body.classList.remove('camara-abierta');
    C.cuenta.textContent = '';
    if (J.Entrada) { J.Entrada.teclas = {}; if (J.Entrada.consumirSalto) J.Entrada.consumirSalto(); }
  };

  function puedeAbrir() {
    if (!document.body.classList.contains('jugando')) return false;
    if (J.Dialogo && J.Dialogo.abierto) return false;
    if (J.Mapa && J.Mapa.abierto) return false;
    if (J.Espejo && J.Espejo.abierto) return false;
    return true;
  }

  C.iniciar = function () {
    if (C.modal) return;
    crearModal();
    estado('abriendo');

    // botón redondo en el HUD, al principio de #botones
    const cont = $('botones');
    if (cont) {
      const b = el('button', { id: 'btn-camara', type: 'button', title: 'Cámara de fotos', 'aria-label': 'Cámara de fotos' });
      el('span', { clase: 'emoji', 'aria-hidden': 'true', texto: '📷' }, b);
      cont.insertBefore(b, cont.firstChild);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); b.blur(); if (puedeAbrir()) C.abrir(); });
      C.boton = b;
    }

    window.addEventListener('keydown', (e) => {
      if (C.abierto) {
        // con el modal abierto, las teclas no llegan al juego
        e.stopImmediatePropagation();
        if (e.code === 'Escape') { e.preventDefault(); C.cerrar(); }
        else if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) {
          e.preventDefault();
          if (C.estado === 'vivo') sacar(); else if (C.estado === 'preview') guardar();
        }
        return;
      }
      if (e.code === 'KeyC' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && puedeAbrir()) {
        e.preventDefault(); e.stopImmediatePropagation(); C.abrir();
      }
    }, true);

    // si la pestaña se oculta, apagamos la cámara
    document.addEventListener('visibilitychange', () => { if (document.hidden && C.abierto) C.cerrar(); });
  };

  J.CamaraFotos = C;
})();
