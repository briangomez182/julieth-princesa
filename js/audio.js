/* Sonido 100 % sintetizado con Web Audio API (sin archivos de audio) */
(function () {
  const S = { ctx: null, maestro: null, sonidoOn: true, musicaOn: true, noche: 0 };

  S.iniciar = function () {
    if (S.ctx) { if (S.ctx.state === 'suspended') S.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    S.ctx = new AC();
    S.maestro = S.ctx.createGain();
    S.maestro.gain.value = 0.55;
    S.maestro.connect(S.ctx.destination);
    S.busMusica = S.ctx.createGain();
    S.busMusica.gain.value = 0.5;
    S.busMusica.connect(S.maestro);
    S._proximaNota = S.ctx.currentTime + 0.2;
    S._paso = 0;
    setInterval(S._programarMusica, 90);
  };

  // Una nota: frecuencia, duración, forma de onda, volumen, retraso, frecuencia final (deslizar)
  function nota(f, dur, tipo, vol, cuando, fFin, destino) {
    if (!S.ctx) return;
    const t0 = S.ctx.currentTime + (cuando || 0);
    const o = S.ctx.createOscillator(), g = S.ctx.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (fFin) o.frequency.exponentialRampToValueAtTime(fFin, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(destino || S.maestro);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function ruido(dur, vol, cuando, fFiltro) {
    if (!S.ctx) return;
    const t0 = S.ctx.currentTime + (cuando || 0);
    const n = Math.floor(S.ctx.sampleRate * dur);
    const buf = S.ctx.createBuffer(1, n, S.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = S.ctx.createBufferSource(); src.buffer = buf;
    const fl = S.ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = fFiltro || 1200;
    const g = S.ctx.createGain(); g.gain.value = vol || 0.1;
    src.connect(fl); fl.connect(g); g.connect(S.maestro);
    src.start(t0);
  }

  const fx = (f) => function () { if (S.ctx && S.sonidoOn) f.apply(null, arguments); };

  // --- Efectos ---
  S.moneda = fx(() => {            // "ding-diiing" resonante de moneda
    nota(988, 0.09, 'square', 0.13);
    nota(1319, 0.55, 'square', 0.13, 0.08);
    nota(2637, 0.6, 'sine', 0.08, 0.08);
    nota(1976, 0.5, 'triangle', 0.05, 0.08);
  });
  S.salto = fx(() => nota(320, 0.2, 'square', 0.09, 0, 760));
  S.rebote = fx(() => { nota(180, 0.32, 'sine', 0.25, 0, 720); nota(360, 0.3, 'triangle', 0.1, 0.02, 1300); });
  S.caja = fx(() => { nota(220, 0.09, 'square', 0.13, 0, 150); nota(660, 0.14, 'triangle', 0.14, 0.05, 990); });
  S.cajaVacia = fx(() => nota(160, 0.1, 'square', 0.1, 0, 110));
  S.comida = fx(() => [523, 659, 784, 1047].forEach((f, i) => nota(f, 0.14, 'triangle', 0.16, i * 0.055)));
  S.estrella = fx(() => [659, 784, 988, 1175, 1568, 1976].forEach((f, i) => nota(f, 0.2, 'triangle', 0.15, i * 0.06)));
  S.auch = fx(() => { nota(520, 0.14, 'square', 0.12, 0, 300); nota(300, 0.22, 'square', 0.1, 0.12, 170); });
  S.resbalon = fx(() => { nota(900, 0.35, 'sine', 0.14, 0, 240); ruido(0.25, 0.08, 0, 2500); });
  S.chapuzon = fx(() => ruido(0.3, 0.14, 0, 900));
  S.tunel = fx(() => { nota(300, 0.5, 'sine', 0.16, 0, 1500); nota(1500, 0.45, 'sine', 0.12, 0.4, 300); });
  S.pisoton = fx(() => { nota(500, 0.1, 'square', 0.12, 0, 250); nota(250, 0.15, 'triangle', 0.14, 0.06, 500); });
  S.siesta = fx(() => [784, 659, 523, 392].forEach((f, i) => nota(f, 0.5, 'sine', 0.13, i * 0.38)));
  S.despertar = fx(() => [523, 659, 784, 1047, 1319].forEach((f, i) => nota(f, 0.16, 'triangle', 0.15, i * 0.07)));
  S.fiesta = fx(() => {
    const m = [523, 523, 523, 659, 784, 659, 784, 1047];
    const d = [0, 0.12, 0.24, 0.36, 0.5, 0.66, 0.78, 0.92];
    m.forEach((f, i) => { nota(f, 0.22, 'square', 0.1, d[i]); nota(f / 2, 0.22, 'triangle', 0.12, d[i]); });
    nota(1568, 0.7, 'triangle', 0.1, 0.92);
  });
  S.corazon = fx(() => [587, 740, 880, 1175].forEach((f, i) => nota(f, 0.22, 'sine', 0.16, i * 0.07)));
  S.paso = fx(() => ruido(0.05, 0.035, 0, 700));
  S.puerta = fx(() => { nota(196, 0.16, 'triangle', 0.16, 0, 147); nota(294, 0.3, 'triangle', 0.13, 0.14, 392); ruido(0.18, 0.05, 0, 500); });
  S.blip = fx(() => nota(520 + Math.random() * 160, 0.045, 'triangle', 0.045));

  // --- Música de fondo: melodía propia en escala pentatónica, generada en vivo ---
  const ESC = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880];
  const MELO = [4, -1, 5, 7, 5, -1, 4, 2, 4, 5, 7, -1, 8, 7, 5, -1, 2, 4, 5, 4, 2, -1, 0, 2, 4, 5, 7, 5, 4, -1, 2, -1];
  const BAJO = [0, 0, 3, 3, 4, 4, 3, 3];
  S._programarMusica = function () {
    if (!S.ctx || S.ctx.state !== 'running') return;
    const t = S.ctx.currentTime;
    if (S._proximaNota < t) S._proximaNota = t + 0.05;
    while (S._proximaNota < t + 0.3) {
      const tempo = S.noche > 0.5 ? 0.34 : 0.24;
      if (S.musicaOn) {
        const cuando = S._proximaNota - t;
        const i = MELO[S._paso % MELO.length];
        if (i >= 0) {
          const f = ESC[i] * (S.noche > 0.5 ? 0.5 : 1);
          nota(f, tempo * 1.6, S.noche > 0.5 ? 'sine' : 'triangle', 0.1, cuando, 0, S.busMusica);
        }
        if (S._paso % 4 === 0) {
          const b = ESC[BAJO[(S._paso / 4) % BAJO.length | 0]] / 2;
          nota(b, tempo * 3.4, 'sine', 0.12, cuando, 0, S.busMusica);
        }
        if (S.noche <= 0.5 && S._paso % 2 === 1) nota(ESC[7], 0.05, 'sine', 0.018, cuando, 0, S.busMusica);
      }
      S._proximaNota += tempo;
      S._paso++;
    }
  };

  J.Audio = S;
})();
