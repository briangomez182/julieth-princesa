/* El espejo mágico de los castillos: el Espejito Mágico aparece en primer plano, lee una
   pregunta al azar del banco de su castillo (J.EspejoPreguntas), piensa 5 segundos, responde
   quién gana (Julieth o Giulia) y abre la cámara frontal para que se vean reflejadas.
   5 s después de la respuesta ofrece 3 preguntas nuevas (sin repetir en esta visita). */
(function () {
  const TEXTOS = {
    hola: '¡Hola, princesas! Soy el Espejito Mágico.',
    pensando: 'Mmm… déjame pensar…',
    elige: 'Elige otra pregunta para el espejo mágico',
    mirense: '¡Mírense en el espejo mágico, princesas!',
    sinCamara: 'No pude abrir la cámara. Revisa que el navegador tenga permiso para usarla.'
  };
  const ESPERA = 5; // segundos de suspenso antes de responder
  const OPCIONES = 5; // segundos tras la respuesta hasta ofrecer otras preguntas

  const Es = { abierto: false, fase: '', t: 0, tFase: 0, hablando: false, token: 0, stream: null, espejo: null, brillos: [],
    castillo: '', hechas: [], pregunta: null, ganadora: 'Julieth', opciones: [] };
  const $ = (id) => document.getElementById(id);

  function voz(texto, alTerminar) {
    const tk = Es.token;
    const fin = () => { if (tk !== Es.token) return; Es.hablando = false; if (alTerminar) { const f = alTerminar; alTerminar = null; f(); } };
    Es.hablando = true;
    // respaldo por si el navegador no avisa cuándo terminó de hablar (o no hay voz)
    const respaldo = setTimeout(fin, 900 + texto.length * 75);
    try {
      const ss = window.speechSynthesis;
      if (!ss || !J.Audio.sonidoOn) return;
      ss.cancel();
      const voces = ss.getVoices().filter((k) => /^es/i.test(k.lang));
      const v = voces.find((k) => /female|mujer|paulina|monica|mónica|helena|elvira|sabina|lucia|lucía|google/i.test(k.name)) || voces[0];
      const u = new SpeechSynthesisUtterance(texto.replace(/[^\p{L}\p{N}\p{P}\s]/gu, ''));
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'es-ES'; u.rate = 0.9; u.pitch = 1.35; u.volume = 1;
      u.onend = () => { clearTimeout(respaldo); setTimeout(fin, 150); };
      u.onerror = () => {};
      ss.speak(u);
    } catch (_) { /* sin voz: solo texto */ }
  }
  function callar() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (_) {} Es.hablando = false; }

  function mostrarTexto(t, grande) {
    Es.textoEl.textContent = t;
    Es.textoEl.classList.toggle('grande', !!grande);
    Es.textoEl.classList.remove('entra'); void Es.textoEl.offsetWidth; Es.textoEl.classList.add('entra');
  }
  function fase(f) { Es.fase = f; Es.tFase = 0; }
  function botones(cam, otra) {
    Es.btnCam.hidden = !cam; Es.btnOtra.hidden = !otra;
  }

  // ---- Sonidos mágicos (Web Audio) ----
  function nota(f, dur, vol, cuando, tipo) {
    const S = J.Audio; if (!S.ctx || !S.sonidoOn) return;
    const t0 = S.ctx.currentTime + (cuando || 0), o = S.ctx.createOscillator(), g = S.ctx.createGain();
    o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(S.maestro); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  const sonAparece = () => [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => nota(f, 0.6, 0.07, i * 0.07, 'triangle'));
  const sonSuspenso = () => { for (let i = 0; i < 5; i++) { nota(330 + i * 20, 0.9, 0.05, i, 'sine'); nota(1320 + i * 80, 0.25, 0.03, i + 0.5, 'triangle'); } };

  // ---- Opciones de preguntas ----
  function ocultarOpciones() { Es.opciones = []; Es.opcEl.hidden = true; Es.opcEl.textContent = ''; }
  function mostrarOpciones() {
    const EP = J.EspejoPreguntas;
    Es.opciones = (EP.opciones(Es.castillo, Es.hechas, 3) || []).filter(Boolean);
    Es.opcEl.textContent = '';
    if (!Es.opciones.length) { Es.opcEl.hidden = true; return; }
    Es.opciones.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'espejo-opcion';
      b.textContent = '🔮 ¿' + String(p.corta).replace(/^¿|\?$/g, '') + '?';
      b.addEventListener('click', (ev) => { ev.stopPropagation(); b.blur(); otraPregunta(p); });
      Es.opcEl.appendChild(b);
    });
    Es.opcEl.hidden = false;
    if (Es.fase !== 'camara') mostrarTexto(TEXTOS.elige);
  }

  // ---- Secuencia ----
  function reiniciar() {
    Es.token++; callar();
    Es.brillos.length = 0;
    detenerCamara();
    Es.marco.classList.remove('camara');
    botones(false, false); ocultarOpciones();
  }
  function nueva() {
    const EP = J.EspejoPreguntas;
    return EP.azar(Es.castillo, Es.hechas) || EP.azar(Es.castillo, []);
  }
  function empezar() {
    reiniciar();
    fase('aparece'); mostrarTexto('');
    sonAparece();
    setTimeout(paso(() => {
      fase('hola'); mostrarTexto(TEXTOS.hola);
      voz(TEXTOS.hola, () => preguntar(nueva()));
    }), 900);
  }
  // otra pregunta sin el "hola": la elegida en las opciones o una al azar nueva
  function otraPregunta(p) { reiniciar(); preguntar(p || nueva()); }
  function preguntar(p) {
    Es.pregunta = p; if (!Es.hechas.includes(p.id)) Es.hechas.push(p.id);
    Es.ganadora = J.EspejoPreguntas.ganadora(p);
    fase('pregunta'); mostrarTexto(p.texto, true);
    voz(p.texto, () => {
      fase('pensando'); mostrarTexto(TEXTOS.pensando); sonSuspenso();
      setTimeout(paso(responder), ESPERA * 1000);
    });
  }
  function paso(f) { const tk = Es.token; return () => { if (tk === Es.token && Es.abierto) f(); }; }
  function responder() {
    const frase = J.EspejoPreguntas.respuesta(Es.pregunta, Es.ganadora);
    fase('respuesta'); mostrarTexto(frase, true);
    J.Audio.fiesta();
    for (let i = 0; i < 70; i++) brillo(true);
    setTimeout(paso(mostrarOpciones), OPCIONES * 1000);
    voz(frase, () => setTimeout(paso(() => {
      mostrarTexto(TEXTOS.mirense);
      voz(TEXTOS.mirense);
      abrirCamara();
    }), 600));
  }

  // ---- Cámara frontal ----
  function abrirCamara() {
    botones(false, true);
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) { mostrarTexto(TEXTOS.sinCamara); botones(true, true); return; }
    const tk = Es.token;
    md.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then((st) => {
        if (tk !== Es.token || !Es.abierto) { st.getTracks().forEach((k) => k.stop()); return; }
        Es.stream = st; Es.video.srcObject = st;
        const p = Es.video.play(); if (p && p.catch) p.catch(() => {});
        Es.marco.classList.add('camara'); fase('camara');
        mostrarTexto('👑 ' + Es.ganadora + ' 👑', true);
        for (let i = 0; i < 40; i++) brillo(true);
      })
      .catch(() => { if (tk === Es.token) { mostrarTexto(TEXTOS.sinCamara); botones(true, true); } });
  }
  function detenerCamara() {
    if (Es.stream) { Es.stream.getTracks().forEach((k) => k.stop()); Es.stream = null; }
    if (Es.video) Es.video.srcObject = null;
  }

  // ---- Dibujo del vidrio: carita, brillos y corazones ----
  function brillo(fuerte) {
    const a = Math.random() * Math.PI * 2, v = fuerte ? 60 + Math.random() * 160 : 10 + Math.random() * 25;
    Es.brillos.push({
      x: 0.5 + (fuerte ? 0 : (Math.random() - 0.5) * 0.9), y: fuerte ? 0.55 : 0.5 + (Math.random() - 0.5) * 0.9,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - (fuerte ? 40 : 10), vida: 1.2 + Math.random() * 1.4, t: 0,
      r: 4 + Math.random() * 7, corazon: fuerte && Math.random() < 0.45,
      color: ['#fff6b0', '#ffd1e8', '#d9ccff', '#ffffff', '#ff9fc6'][Math.random() * 5 | 0]
    });
  }
  function dibujar(ms) {
    if (!Es.abierto) return;
    requestAnimationFrame(dibujar);
    const ahora = ms / 1000, dt = Math.min(0.05, Es._ult ? ahora - Es._ult : 0.016); Es._ult = ahora;
    Es.t += dt; Es.tFase += dt;
    const c = Es.lienzo, r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const g = Es.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    const camara = Es.fase === 'camara', t = Es.t;

    // carita en primer plano (se desvanece cuando aparece el reflejo)
    if (!camara) {
      let alfa = 1, esc = 1;
      if (Es.fase === 'aparece') { const k = Math.min(1, Es.tFase / 0.9); alfa = k; esc = 0.6 + 0.4 * J.U.suave(k); }
      const pensando = Es.fase === 'pensando';
      const e = Math.min(W, H) / 78 * esc;
      // remolino mágico mientras piensa
      if (pensando) {
        for (let i = 0; i < 18; i++) {
          const a = t * 2.2 + i / 18 * Math.PI * 2, rr = Math.min(W, H) * (0.34 + 0.04 * Math.sin(t * 3 + i));
          g.fillStyle = `rgba(255,245,200,${0.35 + 0.35 * Math.sin(t * 5 + i)})`;
          estrella(g, W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr * 1.2, 5 * dpr + 3 * dpr * Math.sin(t * 4 + i));
        }
        // cuenta regresiva de puntitos
        const n = Math.min(ESPERA, Math.floor(Es.tFase) + 1);
        for (let i = 0; i < ESPERA; i++) {
          g.fillStyle = i < n ? '#fff6b0' : 'rgba(255,255,255,0.25)';
          g.beginPath(); g.arc(W / 2 + (i - (ESPERA - 1) / 2) * 18 * dpr, H * 0.86, 5 * dpr, 0, Math.PI * 2); g.fill();
        }
      }
      J.Dibujo.caraEspejo(g, W / 2, H * (pensando ? 0.47 + Math.sin(t * 2) * 0.01 : 0.48), e, t, {
        alfa, hablando: Es.hablando, feliz: Es.fase === 'respuesta' || (pensando && Math.sin(t * 1.5) > 0.6)
      });
      // ojitos mirando arriba mientras piensa: un signo de pregunta flotante
      if (pensando) {
        g.save(); g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3);
        g.font = `900 ${Math.round(H * 0.11)}px ${getComputedStyle(document.body).fontFamily}`;
        g.fillStyle = '#fff6b0'; g.textAlign = 'center'; g.fillText('?', W * 0.72, H * 0.24 + Math.sin(t * 2.5) * 6 * dpr);
        g.restore();
      }
    }

    // brillitos que siempre flotan en el vidrio
    if (Math.random() < dt * (camara ? 9 : 5)) brillo(false);
    for (let i = Es.brillos.length - 1; i >= 0; i--) {
      const b = Es.brillos[i]; b.t += dt;
      if (b.t > b.vida) { Es.brillos.splice(i, 1); continue; }
      b.x += b.vx * dt / (W / dpr); b.y += b.vy * dt / (H / dpr); b.vy += 30 * dt; b.vx *= 1 - dt * 0.8;
      const a = Math.sin(Math.PI * b.t / b.vida);
      g.globalAlpha = a; g.fillStyle = b.color;
      if (b.corazon) corazon(g, b.x * W, b.y * H, b.r * dpr * 1.2);
      else estrella(g, b.x * W, b.y * H, b.r * dpr * (0.7 + 0.3 * Math.sin(t * 8 + i)));
    }
    g.globalAlpha = 1;
    // brillo de cristal que cruza el espejo
    const pasa = ((t * 0.3) % 1.8) - 0.4;
    g.fillStyle = camara ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.18)';
    g.beginPath(); g.moveTo(W * pasa, 0); g.lineTo(W * (pasa + 0.12), 0); g.lineTo(W * (pasa - 0.18), H); g.lineTo(W * (pasa - 0.3), H); g.closePath(); g.fill();
  }
  function estrella(g, x, y, r) {
    g.beginPath();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? r * 0.38 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  }
  function corazon(g, x, y, r) {
    g.beginPath(); g.moveTo(x, y + r * 0.9);
    g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4);
    g.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
    g.fill();
  }

  // ---- Abrir / cerrar ----
  Es.abrir = function (espejo) {
    if (Es.abierto) return;
    const Ju = J.Jul;
    Es.abierto = true; Es.espejo = espejo; Es.t = 0; Es._ult = 0;
    Es.castillo = (espejo && espejo.id) || ''; Es.hechas = [];
    Ju.estado = 'charla'; Ju.vx = Ju.vy = 0;
    J.Entrada.teclas = {}; if (J.Entrada._soltarPalanca) J.Entrada._soltarPalanca();
    if (J.Audio.busMusica) J.Audio.busMusica.gain.value = 0.08; // el espejo se escucha en primer plano
    Es.panel.classList.add('visible'); document.body.classList.add('espejo');
    empezar();
    requestAnimationFrame(dibujar);
  };
  Es.cerrar = function () {
    if (!Es.abierto) return;
    Es.abierto = false; Es.token++;
    callar(); detenerCamara(); ocultarOpciones();
    Es.panel.classList.remove('visible'); document.body.classList.remove('espejo');
    Es.marco.classList.remove('camara');
    if (J.Audio.busMusica) J.Audio.busMusica.gain.value = 0.5;
    if (J.Jul.estado === 'charla') J.Jul.estado = 'normal';
    J.Entrada.consumirSalto();
    const e = Es.espejo;
    if (e) { J.Part.corazones(e.x, e.y, 150, 5); J.Part.texto(e.x, e.y, 200, '¡Espejito mágico! ✨', '#fff6b0', 22); }
  };

  Es.iniciar = function () {
    Es.panel = $('espejo'); Es.marco = Es.panel.querySelector('.espejo-marco');
    Es.video = $('espejo-video'); Es.lienzo = $('espejo-lienzo'); Es.g = Es.lienzo.getContext('2d');
    Es.textoEl = $('espejo-texto'); Es.btnCam = $('espejo-camara'); Es.btnOtra = $('espejo-otra');
    Es.opcEl = $('espejo-opciones');
    if (!Es.opcEl) { // respaldo si el HTML no trae el contenedor
      Es.opcEl = document.createElement('div'); Es.opcEl.id = 'espejo-opciones';
      const esc = Es.panel.querySelector('.espejo-escena') || Es.panel, bs = $('espejo-botones');
      if (bs && bs.parentNode === esc) bs.after(Es.opcEl); else esc.appendChild(Es.opcEl);
    }
    Es.opcEl.hidden = true;
    const clic = (b, f) => b.addEventListener('click', (ev) => { ev.stopPropagation(); b.blur(); f(); });
    clic(Es.btnCam, abrirCamara);
    clic(Es.btnOtra, () => otraPregunta());
    clic($('espejo-cerrar'), Es.cerrar);
    window.addEventListener('keydown', (e) => {
      if (!Es.abierto) return;
      e.stopImmediatePropagation();
      if (e.code === 'Escape' || e.code === 'KeyE') { e.preventDefault(); Es.cerrar(); }
      else if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); if (!e.repeat && !Es.btnOtra.hidden) otraPregunta(); }
      else if (/^(Digit|Numpad)[1-3]$/.test(e.code) && !Es.opcEl.hidden) {
        const p = Es.opciones[+e.code.slice(-1) - 1]; if (p && !e.repeat) { e.preventDefault(); otraPregunta(p); }
      }
    }, true);
    // las voces del navegador a veces cargan tarde
    try { if (window.speechSynthesis) window.speechSynthesis.getVoices(); } catch (_) {}
  };

  J.Espejo = Es;
})();
