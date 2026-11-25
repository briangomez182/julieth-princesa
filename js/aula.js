/* El Huerto: el jardín de infantes. Cuando Julieth habla con una seño, las nenas se sientan
   en sus pupitres y la clase aparece en primer plano: un pizarrón verde de tiza con la seño
   al costado. Se elige el nivel (Julieth 5 años / Giulia 1 añito), se hacen 6 preguntas del
   banco J.AulaPreguntas con control del error Montessori (sin castigo: se prueba otra vez) y
   al final, al tocar "Ver resultado", la seño muestra cuántas salieron al primer intento. */
(function () {
  const N_PREGUNTAS = 6;
  const AUTO_SIGUIENTE = 2000; // ms tras el "¡bien!" hasta pasar sola a la siguiente
  const NIVELES = {
    julieth: { boton: '👧 Nivel Julieth (5 años)', nombre: 'Julieth' },
    giulia: { boton: '👶 Nivel Giulia (1 añito)', nombre: 'Giulia' }
  };

  const A = {
    abierto: false, token: 0, vozN: 0, hablando: false, t: 0, _ult: 0,
    seno: null, info: null, materia: '', nivel: '', fase: '',
    preguntas: [], idx: 0, resultados: [], intentos: 0, resuelta: false,
    opciones: [], principal: null, _corteGiulia: null
  };

  // ---------- Ayudas ----------
  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }
  function boton(clase, texto, f) {
    const b = el('button', clase, texto);
    b.type = 'button';
    b.addEventListener('click', (ev) => { ev.stopPropagation(); b.blur(); if (!b.disabled) f(b); });
    return b;
  }
  function paso(f) { const tk = A.token; return () => { if (tk === A.token && A.abierto) f(); }; }
  function mezclar(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; const k = a[i]; a[i] = a[j]; a[j] = k; }
    return a;
  }
  const sonar = (n) => { try { const S = J.Audio; if (S && S[n]) S[n](); } catch (_) {} };

  // ---------- Voz de la seño ----------
  function voz(texto, alTerminar) {
    const n = ++A.vozN;
    const fin = () => {
      if (n !== A.vozN) return;
      A.hablando = false;
      if (alTerminar) { const f = alTerminar; alTerminar = null; f(); }
    };
    texto = String(texto || '').trim();
    if (!texto) { A.hablando = false; if (alTerminar) setTimeout(fin, 0); return; }
    A.hablando = true;
    const respaldo = setTimeout(fin, 900 + texto.length * 75); // por si el navegador no avisa
    try {
      const ss = window.speechSynthesis;
      if (!ss || !J.Audio || !J.Audio.sonidoOn) return;
      ss.cancel();
      const voces = ss.getVoices().filter((k) => /^es/i.test(k.lang));
      const v = voces.find((k) => /female|mujer|paulina|monica|mónica|helena|elvira|sabina|lucia|lucía|google/i.test(k.name)) || voces[0];
      const u = new SpeechSynthesisUtterance(texto.replace(/[^\p{L}\p{N}\p{P}\s]/gu, ''));
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'es-ES'; u.rate = 0.88; u.pitch = 1.25; u.volume = 1;
      u.onend = () => { clearTimeout(respaldo); setTimeout(fin, 150); };
      u.onerror = () => {};
      ss.speak(u);
    } catch (_) { /* sin voz: queda el globito de texto */ }
  }
  function callar() {
    A.vozN++; A.hablando = false;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (_) {}
  }
  // dice algo y lo muestra en el globito junto a la seño
  function decir(texto, alTerminar) {
    A.globo.textContent = texto || '';
    A.globo.hidden = !texto;
    A.globo.classList.remove('entra'); void A.globo.offsetWidth; A.globo.classList.add('entra');
    voz(texto, alTerminar);
  }

  // ---------- Sonidos suaves ----------
  function nota(f, dur, vol, cuando, tipo) {
    const S = J.Audio; if (!S || !S.ctx || !S.sonidoOn) return;
    const t0 = S.ctx.currentTime + (cuando || 0), o = S.ctx.createOscillator(), g = S.ctx.createGain();
    o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(S.maestro); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  const sonCampanita = () => [659, 880, 1319].forEach((f, i) => nota(f, 0.5, 0.06, i * 0.12, 'triangle'));
  const sonOtraVez = () => { nota(392, 0.22, 0.05, 0, 'sine'); nota(330, 0.3, 0.05, 0.14, 'sine'); };

  // ---------- Brillitos (DOM) ----------
  function brillitos(desde, n) {
    if (!desde || !A.panel) return;
    const r = desde.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const fig = ['✨', '⭐', '🌟', '💖', '✨'];
    for (let i = 0; i < (n || 14); i++) {
      const s = el('span', 'aula-brillo', fig[i % fig.length]);
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.setProperty('--dx', Math.cos(a) * d + 'px');
      s.style.setProperty('--dy', Math.sin(a) * d - 30 + 'px');
      s.style.animationDelay = (Math.random() * 0.15).toFixed(2) + 's';
      A.panel.appendChild(s);
      setTimeout(() => s.remove(), 1300);
    }
  }

  // ---------- Pantallas ----------
  function limpiar() {
    A.token++;
    A.tiza.textContent = ''; A.botones.textContent = '';
    A.botones.className = 'aula-botones';
    A.opciones = []; A.principal = null;
    A.pizarron.classList.remove('festeja');
  }
  function progreso() {
    const p = el('div', 'aula-progreso');
    p.setAttribute('aria-label', 'Pregunta ' + Math.min(A.idx + 1, A.preguntas.length) + ' de ' + A.preguntas.length);
    for (let i = 0; i < A.preguntas.length; i++) {
      const r = A.resultados[i];
      let c = 'falta', s = '⭐';
      if (r) { c = 'hecha'; s = r.primero ? '🌟' : '⭐'; } else if (i === A.idx && A.fase === 'pregunta') c = 'ahora';
      p.appendChild(el('span', 'aula-paso ' + c, s));
    }
    return p;
  }

  function pantallaNivel() {
    limpiar(); A.fase = 'nivel';
    const I = A.info;
    A.tiza.appendChild(el('h2', 'aula-titulo', (I.emoji ? I.emoji + ' ' : '') + I.nombre));
    if (I.saludo) A.tiza.appendChild(el('p', 'aula-saludo', I.saludo));
    if (I.metodo) A.tiza.appendChild(el('p', 'aula-metodo', I.metodo));
    A.tiza.appendChild(el('p', 'aula-pregunta-nivel', '¿Para quién es la clase?'));
    Object.keys(NIVELES).forEach((k) => {
      const b = boton('aula-opcion aula-nivel', NIVELES[k].boton, () => { sonar('blip'); empezarClase(k); });
      A.botones.appendChild(b); A.opciones.push(b);
    });
    A.botones.classList.add('dos');
    decir([I.saludo, I.metodo, '¿Para quién es la clase?'].filter(Boolean).join(' '));
  }

  function empezarClase(nivel) {
    A.nivel = nivel; A.idx = 0; A.resultados = [];
    let lista = [];
    try { lista = (J.AulaPreguntas.sortear(A.materia, nivel, N_PREGUNTAS) || []).filter(Boolean); } catch (_) { lista = []; }
    A.preguntas = lista;
    if (!lista.length) { sinClase(); return; }
    pantallaPregunta();
  }

  function correctaDe(p) {
    const ops = p.opciones || [];
    if (typeof p.correcta === 'number' && ops[p.correcta] != null && !ops.includes(p.correcta)) return String(ops[p.correcta]);
    return String(p.correcta);
  }

  function pantallaPregunta() {
    limpiar(); A.fase = 'pregunta';
    const p = A.preguntas[A.idx], pz = p.pizarra || {};
    A.intentos = 0; A.resuelta = false;
    A.tiza.appendChild(progreso());
    if (p.material) A.tiza.appendChild(el('div', 'aula-material', '🧺 Material Montessori: ' + p.material));
    A.tiza.appendChild(el('p', 'aula-enunciado', p.enunciado || ''));
    const pizarra = el('div', 'aula-pizarra');
    if (pz.emojis) pizarra.appendChild(el('div', 'aula-emojis', Array.isArray(pz.emojis) ? pz.emojis.join(' ') : pz.emojis));
    if (pz.texto) pizarra.appendChild(el('div', 'aula-texto-tiza' + (String(pz.texto).length > 8 ? ' largo' : ''), pz.texto));
    if (pz.nota) pizarra.appendChild(el('div', 'aula-nota', pz.nota));
    A.tiza.appendChild(pizarra);

    const bien = correctaDe(p), bebe = A.nivel === 'giulia';
    const ops = mezclar((p.opciones || []).map(String));
    A.botones.classList.add(bebe ? 'bebe' : (ops.length <= 2 ? 'dos' : ops.length === 3 ? 'tres' : 'cuatro'));
    ops.forEach((txt, i) => {
      const b = boton('aula-opcion' + (bebe ? ' enorme' : ''), '', (bt) => responder(bt, txt === bien));
      if (!bebe && ops.length > 1) b.appendChild(el('span', 'aula-tecla', String(i + 1)));
      b.appendChild(el('span', 'aula-op-txt', txt));
      b.setAttribute('aria-label', 'Opción ' + (i + 1) + ': ' + txt);
      A.botones.appendChild(b); A.opciones.push(b);
    });
    sonCampanita();
    decir([p.guia, p.enunciado].filter(Boolean).join(' '));
  }

  function responder(b, acierto) {
    if (A.fase !== 'pregunta' || A.resuelta) return;
    const p = A.preguntas[A.idx];
    A.intentos++;
    if (acierto) {
      A.resuelta = true;
      A.resultados[A.idx] = { enunciado: p.enunciado || '', primero: A.intentos === 1, id: p.id };
      b.classList.add('bien');
      A.opciones.forEach((o) => { if (o !== b) { o.disabled = true; o.classList.add('apagado'); } });
      sonar('estrella'); brillitos(b, 16);
      A.pizarron.classList.remove('festeja'); void A.pizarron.offsetWidth; A.pizarron.classList.add('festeja');
      // refresca las estrellitas de progreso
      const viejo = A.tiza.querySelector('.aula-progreso'); if (viejo) viejo.replaceWith(progreso());
      const ultima = A.idx >= A.preguntas.length - 1;
      const sig = boton('aula-accion', ultima ? '🎉 ¡Terminé!' : 'Siguiente ▶', ultima ? pantallaFin : siguiente);
      A.botones.appendChild(sig); A.principal = ultima ? pantallaFin : siguiente;
      const tk = A.token, idx = A.idx;
      decir(p.bien || '¡Muy bien!', () => setTimeout(() => {
        if (tk === A.token && A.abierto && A.idx === idx && A.fase === 'pregunta') A.principal && A.principal();
      }, AUTO_SIGUIENTE));
    } else {
      b.classList.remove('mal'); void b.offsetWidth; b.classList.add('mal');
      b.disabled = true;
      setTimeout(() => b.classList.add('apagado'), 450);
      sonOtraVez();
      decir(p.pista || '¡Casi! Probemos otra vez.');
    }
  }

  function siguiente() {
    if (A.idx < A.preguntas.length - 1) { A.idx++; pantallaPregunta(); } else pantallaFin();
  }

  function pantallaFin() {
    limpiar(); A.fase = 'fin';
    A.tiza.appendChild(progreso());
    A.tiza.appendChild(el('h2', 'aula-titulo', '¡Terminamos la clase! 🎉'));
    A.tiza.appendChild(el('p', 'aula-saludo', 'Toca el botón para ver tu resultado.'));
    const b = boton('aula-accion grande', '📊 Ver resultado', pantallaResultado);
    A.botones.appendChild(b); A.principal = pantallaResultado;
    sonCampanita();
    decir('¡Terminamos la clase! Toca el botón para ver tu resultado.');
  }

  function mensaje(n, total, quien) {
    if (n >= total) return '¡Perfecto, ' + quien + '! ¡Todo al primer intento! Eres una estrella brillante.';
    if (n >= total - 2) return '¡Muy bien, ' + quien + '! Aprendiste un montón hoy.';
    if (n >= Math.ceil(total / 3)) return '¡Bien hecho, ' + quien + '! Cada intento te hace más fuerte.';
    return '¡Qué valiente, ' + quien + '! Probaste y probaste hasta lograrlo. ¡Eso es aprender!';
  }

  function pantallaResultado() {
    limpiar(); A.fase = 'resultado';
    const total = A.preguntas.length, n = A.resultados.filter((r) => r && r.primero).length;
    const quien = (NIVELES[A.nivel] || NIVELES.julieth).nombre, msg = mensaje(n, total, quien);
    A.tiza.appendChild(el('p', 'aula-dice', A.info.nombre + ' dice:'));
    const est = el('div', 'aula-estrellas');
    for (let i = 0; i < total; i++) est.appendChild(el('span', i < n ? 'si' : 'no', '⭐'));
    A.tiza.appendChild(est);
    A.tiza.appendChild(el('p', 'aula-puntaje', n + ' de ' + total + ' al primer intento'));
    A.tiza.appendChild(el('p', 'aula-mensaje', msg));
    const ul = el('ul', 'aula-lista');
    A.preguntas.forEach((p, i) => {
      const r = A.resultados[i], li = el('li');
      li.appendChild(el('span', 'marca', r && r.primero ? '✅' : '🔁'));
      li.appendChild(el('span', 'txt', p.enunciado || ('Pregunta ' + (i + 1))));
      ul.appendChild(li);
    });
    A.tiza.appendChild(ul);
    A.tiza.appendChild(el('p', 'aula-leyenda', '✅ al primer intento · 🔁 con otro intento'));
    const otra = boton('aula-accion', '🔄 Otra clase', pantallaNivel);
    const salir = boton('aula-accion salir', 'Salir ✕', () => A.cerrar());
    A.botones.appendChild(otra); A.botones.appendChild(salir);
    A.botones.classList.add('dos');
    A.principal = pantallaNivel;
    sonar('fiesta');
    brillitos(est, 24);
    A.pizarron.classList.add('festeja');
    const s = A.seno;
    try {
      if (s && J.Part) {
        if (J.Part.confeti) J.Part.confeti(s.x, s.y, 120, 50 + n * 8);
        if (J.Part.corazones) J.Part.corazones(s.x, s.y, 130, 6 + n);
      }
    } catch (_) {}
    decir(A.info.nombre + ' dice: ' + n + ' de ' + total + ' al primer intento. ' + msg);
  }

  function sinClase() {
    limpiar(); A.fase = 'nivel';
    A.tiza.appendChild(el('h2', 'aula-titulo', '📚 Un momentito…'));
    A.tiza.appendChild(el('p', 'aula-saludo', 'La seño está preparando la clase. ¡Vuelve en un ratito!'));
    const b = boton('aula-accion salir', 'Salir ✕', () => A.cerrar());
    A.botones.appendChild(b); A.principal = () => A.cerrar();
    decir('La seño está preparando la clase. ¡Vuelve en un ratito!');
  }

  // ---------- Retrato animado de la seño ----------
  function dibujar(ms) {
    if (!A.abierto) return;
    requestAnimationFrame(dibujar);
    const ahora = ms / 1000, dt = Math.min(0.05, A._ult ? ahora - A._ult : 0.016); A._ult = ahora;
    A.t += dt;
    const c = A.retrato, r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (r.width < 2 || r.height < 2) return;
    const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const g = A.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    const D = J.Dibujo;
    if (D && typeof D.figuraSeno === 'function') {
      try {
        const k = Math.min(H / 112, W / 70);
        g.translate(W / 2, H * 0.97); g.scale(k, k);
        D.figuraSeno(g, A.materia, { t: A.t, hablando: A.hablando });
        return;
      } catch (_) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); }
    }
    // respaldo: el emoji de la seño que se mece mientras habla
    const em = (A.info && A.info.emoji) || '👩‍🏫';
    const bob = Math.sin(A.t * (A.hablando ? 9 : 2)) * (A.hablando ? 0.035 : 0.015);
    g.save(); g.translate(W / 2, H * 0.55); g.rotate(bob); g.scale(1 + Math.abs(bob), 1 + Math.abs(bob));
    g.font = Math.round(Math.min(W, H) * 0.72) + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(em, 0, 0);
    g.restore();
  }

  // ---------- Sentar a las nenas ----------
  function sentar(s) {
    const pu = (s && s.pupitres) || [], M = J.Mundo;
    const alt = (x, y) => { try { return M && M.altura ? M.altura(x, y) : 0; } catch (_) { return 0; } };
    const mira = (x) => (s && typeof s.x === 'number' ? (s.x >= x ? 1 : -1) : 1);
    const pj = pu.find((p) => p && p.quien === 'julieth') || pu[0];
    const pg = pu.find((p) => p && p.quien === 'giulia') || pu[1];
    const Ju = J.Jul;
    if (pj && Ju) { Ju.x = pj.x; Ju.y = pj.y; Ju.z = alt(pj.x, pj.y); Ju.vx = Ju.vy = 0; Ju.dir = mira(pj.x); }
    const G = J.Giulia;
    A._corteGiulia = null;
    if (pg && G && G.listo && !G.abordo && !G.salto && !G.tunel) {
      G.x = pg.x; G.y = pg.y; G.z = alt(pg.x, pg.y); G.vx = G.vy = 0; G.dir = mira(pg.x); G.pose = 'quieta';
      // mientras dura la clase ignora sus recuerdos (como tras un portal): se queda en su pupitre
      A._corteGiulia = G.corte; G.corte = Infinity;
    }
  }
  function levantar() {
    const G = J.Giulia;
    if (G && A._corteGiulia !== null) { G.corte = A._corteGiulia; A._corteGiulia = null; }
  }

  // ---------- Abrir / cerrar ----------
  A.abrir = function (seno) {
    if (A.abierto) return;
    if (!A.panel) A.iniciar();
    const AP = J.AulaPreguntas;
    A.seno = seno || {}; A.materia = A.seno.materia || 'matematica';
    const I = (AP && AP.SENOS && AP.SENOS[A.materia]) || {};
    A.info = { nombre: I.nombre || 'La seño', materia: I.materia || A.materia, emoji: I.emoji || '👩‍🏫',
      piso: I.piso, saludo: I.saludo || '¡Hola, princesas! Bienvenidas a la clase.', metodo: I.metodo || '' };
    A.abierto = true; A.t = 0; A._ult = 0;
    const Ju = J.Jul;
    sentar(A.seno);
    if (Ju) { Ju.estado = 'charla'; Ju.vx = Ju.vy = 0; }
    if (J.Entrada) { J.Entrada.teclas = {}; if (J.Entrada._soltarPalanca) J.Entrada._soltarPalanca(); }
    if (J.Audio && J.Audio.busMusica) J.Audio.busMusica.gain.value = 0.08;
    A.nombreEl.textContent = A.info.nombre;
    A.panel.setAttribute('aria-label', 'Clase con ' + A.info.nombre);
    A.panel.dataset.materia = A.materia;
    A.panel.classList.add('visible'); document.body.classList.add('aula');
    if (AP && typeof AP.sortear === 'function') pantallaNivel(); else sinClase();
    requestAnimationFrame(dibujar);
  };

  A.cerrar = function () {
    if (!A.abierto) return;
    A.abierto = false; A.token++;
    callar(); levantar();
    A.panel.classList.remove('visible'); document.body.classList.remove('aula');
    A.panel.querySelectorAll('.aula-brillo').forEach((b) => b.remove());
    if (J.Audio && J.Audio.busMusica) J.Audio.busMusica.gain.value = 0.5;
    if (J.Jul && J.Jul.estado === 'charla') J.Jul.estado = 'normal';
    if (J.Entrada) { J.Entrada.teclas = {}; if (J.Entrada.consumirSalto) J.Entrada.consumirSalto(); }
    const s = A.seno;
    try { if (s && J.Part && J.Part.corazones && typeof s.x === 'number') J.Part.corazones(s.x, s.y, 150, 4); } catch (_) {}
  };

  A.iniciar = function () {
    if (A.panel) return;
    const panel = el('div'); panel.id = 'aula';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Clase');
    const x = boton('aula-x', '✕', () => A.cerrar()); x.setAttribute('aria-label', 'Cerrar la clase');
    const escena = el('div', 'aula-escena');
    const seno = el('div', 'aula-seno');
    const marcoRet = el('div', 'aula-retrato-marco');
    const retrato = el('canvas', 'aula-retrato'); retrato.width = 140; retrato.height = 200;
    marcoRet.appendChild(retrato);
    const nombre = el('div', 'aula-nombre');
    const globo = el('p', 'aula-globo'); globo.setAttribute('aria-live', 'polite'); globo.hidden = true;
    const ladoRet = el('div', 'aula-seno-fig'); ladoRet.appendChild(marcoRet); ladoRet.appendChild(nombre);
    seno.appendChild(ladoRet); seno.appendChild(globo);
    const pizarron = el('div', 'aula-pizarron');
    const tiza = el('div', 'aula-tiza');
    pizarron.appendChild(tiza);
    pizarron.appendChild(el('div', 'aula-repisa'));
    escena.appendChild(seno); escena.appendChild(pizarron);
    const botones = el('div', 'aula-botones');
    panel.appendChild(x); panel.appendChild(escena); panel.appendChild(botones);
    document.body.appendChild(panel);
    A.panel = panel; A.retrato = retrato; A.g = retrato.getContext('2d'); A.nombreEl = nombre;
    A.globo = globo; A.pizarron = pizarron; A.tiza = tiza; A.botones = botones;

    window.addEventListener('keydown', (e) => {
      if (!A.abierto) return;
      e.stopImmediatePropagation();
      if (e.code === 'Escape') { e.preventDefault(); A.cerrar(); return; }
      if (e.repeat) return;
      if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
        e.preventDefault();
        if (A.principal) { sonar('blip'); A.principal(); }
        return;
      }
      const m = /^(?:Digit|Numpad)([1-4])$/.exec(e.code);
      if (m) {
        const b = A.opciones[+m[1] - 1];
        if (b && !b.disabled && b.isConnected) { e.preventDefault(); b.click(); }
      }
    }, true);
    try { if (window.speechSynthesis) window.speechSynthesis.getVoices(); } catch (_) {}
  };

  J.Aula = A;
})();
