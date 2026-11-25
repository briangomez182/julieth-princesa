/* Clima interactivo: despejado, lluvia, viento y nieve con transiciones suaves.
   - Lluvia: gotas, charcos que aparecen cerca de la cámara (se puede salpicar) y se secan con el sol.
   - Nieve: copos y el suelo se cubre de blanco poco a poco (suelo resbaladizo).
   - Viento: hojas y pétalos volando, ráfagas y un empujoncito suave.
   - Al volver el sol tras lluvia o nieve, las flores se abren de una forma especial.
   Todo cuelga de J.Clima. Dentro de los salones el clima no se dibuja ni afecta. */
(function () {
  const U = J.U, C = J.CFG;

  // ---------- Números ajustables del clima ----------
  const CLIMA = {
    INICIAL: 'despejado',
    // segundos [mín, máx] que dura cada clima
    DURACION: { despejado: [70, 130], lluvia: [35, 60], viento: [25, 45], nieve: [40, 65] },
    PRIMERO: [45, 80],                                // el primer despejado de la partida
    PROB: { lluvia: 0.4, viento: 0.33, nieve: 0.27 }, // qué viene después de un despejado
    TRANSICION_SEG: 6,        // fundido entre climas
    // Lluvia y charcos
    GOTAS_MAX: 260,           // gotas en pantalla con lluvia plena
    CHARCOS_MAX: 12,          // charcos de lluvia cerca de la cámara
    CHARCO_CADA_SEG: 1.6,     // cada cuánto intenta aparecer un charco nuevo
    CHARCO_CRECER_SEG: 9,     // tiempo en llenarse
    SECADO_SEG: 22,           // tiempo en secarse cuando vuelve el sol
    SALPICAR_ESPERA: 0.22,    // pausa mínima entre salpicones automáticos
    // Nieve
    COPOS_MAX: 190,
    ACUMULAR_SEG: 30,         // tiempo en cubrirse de blanco por completo
    DERRETIR_SEG: 26,
    FRICCION_MIN: 0.22,       // con todo nevado (1 = normal; menos = patina)
    // Viento
    HOJAS_MAX: 34,
    VIENTO_FUERZA: 70,        // empuje máximo (unidades de mundo / s)
    VIENTO_LLUVIA: 0.3,       // un poco de viento también durante la lluvia
    // Floración especial tras la lluvia o la nieve
    FLORACION_ABRIR_SEG: 2.8,
    FLORACION_SEG: 45,
    FLORACION_APAGAR_SEG: 8,
    TECLA_DEPURAR: 'KeyC'
  };

  const ORDEN = ['despejado', 'lluvia', 'viento', 'nieve'];
  const NOMBRE = { despejado: '¡Sol radiante!', lluvia: '¡Empieza a llover!', viento: '¡Sopla el viento!', nieve: '¡Está nevando!' };

  const Cl = {
    CLIMA,
    estado: CLIMA.INICIAL,   // clima objetivo
    tiempo: 0,               // segundos que le quedan al clima actual
    pausado: false,          // true = no se dibuja ni afecta (p. ej. dentro de un castillo)
    autoSalpicar: true,      // Julieth salpica sola al pisar charcos (si se pasa en actualizar)
    // intensidades 0..1 con fundido
    lluvia: 0, kViento: 0, nieve: 0,
    cobertura: 0,            // nieve acumulada en el suelo 0..1
    dirViento: 1,            // 1 = hacia la derecha, -1 = izquierda
    charcos: [], gotas: [], copos: [], hojas: [], ondas: [],
    ultimoHumedo: null,      // 'lluvia' | 'nieve': último clima mojado
    flor: { k: 0, tipo: null, t: 0 }
  };
  let reloj = 0, ultDt = 1 / 60, tCharco = 0, tSalpicar = 0, camPrev = null, dCam = { x: 0, y: 0 }, antesEnSuelo = true, rafaga = 0;
  const celdasNieve = new Map();

  const azarDe = (r) => U.azar(r[0], r[1]);
  const dentro = () => Cl.pausado || !!(J.Mundo && J.Mundo.salaActiva);
  const acercar = (v, meta, vel, dt) => (v < meta ? Math.min(meta, v + vel * dt) : Math.max(meta, v - vel * dt));

  // ---------- Ciclo de climas ----------
  function siguiente() {
    if (Cl.estado !== 'despejado') return 'despejado'; // siempre vuelve el sol entre climas
    let r = Math.random() * (CLIMA.PROB.lluvia + CLIMA.PROB.viento + CLIMA.PROB.nieve);
    if ((r -= CLIMA.PROB.lluvia) < 0) return 'lluvia';
    if ((r -= CLIMA.PROB.viento) < 0) return 'viento';
    return 'nieve';
  }

  function cambiar(estado, seg, avisar) {
    if (ORDEN.indexOf(estado) < 0) return;
    if (estado === 'lluvia' || estado === 'nieve') Cl.ultimoHumedo = estado;
    if (estado === 'viento' || estado === 'lluvia') Cl.dirViento = Math.random() < 0.5 ? -1 : 1;
    Cl.estado = estado;
    Cl.tiempo = seg || azarDe(CLIMA.DURACION[estado]);
    if (avisar && J.HUD && J.HUD.aviso && !dentro()) J.HUD.aviso(NOMBRE[estado], 2.5);
  }

  Cl.iniciar = function () {
    Cl.estado = CLIMA.INICIAL; Cl.tiempo = azarDe(CLIMA.PRIMERO);
    Cl.lluvia = Cl.estado === 'lluvia' ? 1 : 0; Cl.kViento = Cl.estado === 'viento' ? 1 : 0; Cl.nieve = Cl.estado === 'nieve' ? 1 : 0;
    window.addEventListener('keydown', (e) => {
      if (e.code !== CLIMA.TECLA_DEPURAR || e.repeat) return;
      if (J.Dialogo && J.Dialogo.abierto) return;
      if (!document.body.classList.contains('jugando')) return;
      Cl.forzar(ORDEN[(ORDEN.indexOf(Cl.estado) + 1) % ORDEN.length]);
    });
  };

  // Cambia el clima a mano: J.Clima.forzar('nieve') o forzar('lluvia', 30)
  Cl.forzar = function (estado, seg) { cambiar(estado, seg, true); };
  Cl.pausar = function (si) { Cl.pausado = si !== false; };

  // ---------- Actualizar ----------
  // camara: {x, y} centro en mundo. julieth (opcional): J.Jul para salpicar sola en los charcos.
  Cl.actualizar = function (dt, camara, julieth) {
    reloj += dt;
    Cl.tiempo -= dt;
    if (Cl.tiempo <= 0) cambiar(siguiente(), 0, true);

    // fundido de intensidades
    ultDt = dt;
    const v = 1 / CLIMA.TRANSICION_SEG;
    const vientoMeta = Cl.estado === 'viento' ? 1 : Cl.estado === 'lluvia' ? CLIMA.VIENTO_LLUVIA : 0;
    Cl.lluvia = acercar(Cl.lluvia, Cl.estado === 'lluvia' ? 1 : 0, v, dt);
    Cl.nieve = acercar(Cl.nieve, Cl.estado === 'nieve' ? 1 : 0, v, dt);
    Cl.kViento = acercar(Cl.kViento, vientoMeta, v, dt);
    rafaga = 0.65 + 0.35 * Math.sin(reloj * 0.9) * Math.sin(reloj * 0.37 + 1.3);

    // nieve en el suelo
    if (Cl.nieve > 0.3) Cl.cobertura = Math.min(1, Cl.cobertura + (dt / CLIMA.ACUMULAR_SEG) * Cl.nieve);
    else Cl.cobertura = Math.max(0, Cl.cobertura - (dt / CLIMA.DERRETIR_SEG) * (1 + Cl.lluvia * 1.5));

    // floración: empieza cuando el cielo ya está casi limpio tras lluvia/nieve
    const humedo = Cl.lluvia + Cl.nieve, F = Cl.flor;
    if (Cl.estado === 'despejado' && Cl.ultimoHumedo && humedo < 0.12) {
      F.tipo = Cl.ultimoHumedo; F.t = 0; Cl.ultimoHumedo = null;
    }
    if (F.tipo) {
      F.t += dt;
      const fin = CLIMA.FLORACION_ABRIR_SEG + CLIMA.FLORACION_SEG;
      if (humedo > 0.25) F.t = Math.max(F.t, fin); // vuelve a llover/nevar: se apaga
      F.k = F.t < CLIMA.FLORACION_ABRIR_SEG ? U.suave(F.t / CLIMA.FLORACION_ABRIR_SEG)
        : F.t < fin ? 1 : Math.max(0, 1 - (F.t - fin) / CLIMA.FLORACION_APAGAR_SEG);
      if (F.t > fin && F.k <= 0) { F.tipo = null; F.k = 0; }
    }

    // movimiento de la cámara (para que gotas y copos parezcan del mundo)
    if (camara) {
      if (camPrev) { dCam.x = camara.x - camPrev.x; dCam.y = camara.y - camPrev.y; } else camPrev = { x: 0, y: 0 };
      if (Math.abs(dCam.x) > 400 || Math.abs(dCam.y) > 400) dCam.x = dCam.y = 0; // teletransporte / portal
      camPrev.x = camara.x; camPrev.y = camara.y;
    }

    actualizarCharcos(dt, camara);
    for (let i = Cl.ondas.length - 1; i >= 0; i--) { const o = Cl.ondas[i]; o.vida -= dt; if (o.vida <= 0) Cl.ondas.splice(i, 1); }

    // salpicar solo al pisar charcos
    tSalpicar -= dt;
    if (julieth && Cl.autoSalpicar && !dentro()) {
      const p = Cl.charcoEn(julieth.x, julieth.y), vel = Math.hypot(julieth.vx || 0, julieth.vy || 0);
      const aterriza = julieth.enSuelo && !antesEnSuelo;
      if (p && julieth.enSuelo && (aterriza || (vel > 60 && tSalpicar <= 0))) {
        Cl.salpicar(julieth.x, julieth.y, aterriza ? 1.6 : 0.8 + vel / 400);
        tSalpicar = CLIMA.SALPICAR_ESPERA * (200 / Math.max(120, vel));
      }
      antesEnSuelo = !!julieth.enSuelo;
    }
  };

  // ---------- Charcos de lluvia ----------
  function lugarCharco(x, y) {
    const M = J.Mundo;
    if (!M || x < 120 || y < 140 || x > C.MUNDO_W - 120 || y > C.MUNDO_H - 100) return false;
    if (M.altura(x, y) > 0 || M.bloqueado(x, y, 0, 40)) return false;
    if (M.enRio && M.enRio(x, y, 50)) return false;
    for (const p of Cl.charcos) if (Math.abs(p.x - x) < p.rx + 80 && Math.abs(p.y - y) < p.ry + 60) return false;
    for (const p of M.charcos || []) if (U.dist(p.x, p.y, x, y) < 110) return false;
    return true;
  }

  function actualizarCharcos(dt, cam) {
    if (dentro() || !cam) return;
    if (Cl.lluvia > 0.4 && (tCharco -= dt) <= 0 && Cl.charcos.length < CLIMA.CHARCOS_MAX) {
      tCharco = CLIMA.CHARCO_CADA_SEG;
      for (let i = 0; i < 6; i++) {
        const x = cam.x + U.azar(-900, 900), y = cam.y + U.azar(-520, 560);
        if (!lugarCharco(x, y)) continue;
        const rx = U.azar(30, 54);
        // contorno "gracioso": blob con bultitos
        const bultos = [];
        for (let b = 0; b < 7; b++) bultos.push(U.azar(0.82, 1.14));
        Cl.charcos.push({ x, y, rx, ry: rx * U.azar(0.45, 0.6), k: 0, fase: Math.random() * 6, bultos, gota: 0 });
        break;
      }
    }
    const crecer = dt / CLIMA.CHARCO_CRECER_SEG, secar = dt / CLIMA.SECADO_SEG;
    for (let i = Cl.charcos.length - 1; i >= 0; i--) {
      const p = Cl.charcos[i];
      p.k = Cl.lluvia > 0.3 ? Math.min(1, p.k + crecer * Cl.lluvia) : p.k - secar * (1 + Cl.cobertura);
      if (p.k <= 0 || U.dist(p.x, p.y, cam.x, cam.y) > 2200) { Cl.charcos.splice(i, 1); continue; }
      // gotitas cayendo en el charco
      if (Cl.lluvia > 0.2 && (p.gota -= dt) <= 0) {
        p.gota = U.azar(0.15, 0.5) / Cl.lluvia;
        Cl.ondas.push({ x: p.x + U.azar(-0.6, 0.6) * p.rx * p.k, y: p.y + U.azar(-0.5, 0.5) * p.ry * p.k, vida: 0.7, max: 0.7, r: U.azar(6, 11) });
      }
    }
  }

  // Devuelve el charco de lluvia que hay en (x, y) o null
  Cl.charcoEn = function (x, y) {
    if (dentro()) return null;
    for (const p of Cl.charcos) {
      if (p.k < 0.25) continue;
      const dx = (x - p.x) / (p.rx * p.k), dy = (y - p.y) / (p.ry * p.k);
      if (dx * dx + dy * dy < 1) return p;
    }
    return null;
  };

  // Salpicón: gotitas + aros en el agua + "plof". fuerza ≈ 0.5..2
  Cl.salpicar = function (x, y, fuerza) {
    const f = fuerza || 1, P = J.Part;
    if (P && P.crear) {
      const n = Math.round(8 + f * 7);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * U.TAU, v = U.azar(50, 150) * f;
        P.crear({ tipo: 'oro', x, y, z: 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.45, vz: U.azar(160, 340) * (0.7 + f * 0.3), g: 950, vida: U.azar(0.45, 0.75), tam: U.azar(2.5, 5), color: i % 3 ? '#a8f0ff' : '#ffffff' });
      }
    }
    Cl.ondas.push({ x, y, vida: 0.6, max: 0.6, r: 22 * f });
    Cl.ondas.push({ x, y, vida: 0.9, max: 0.9, r: 34 * f });
    sonidoSalpicar(f);
  };

  function sonidoSalpicar(f) {
    const S = J.Audio;
    if (!S || !S.ctx || !S.sonidoOn || !S.maestro) return;
    try {
      const a = S.ctx, t0 = a.currentTime;
      // "plip" de gota
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(900 + Math.random() * 300, t0); o.frequency.exponentialRampToValueAtTime(260, t0 + 0.12);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12 * Math.min(1.4, f), t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g); g.connect(S.maestro); o.start(t0); o.stop(t0 + 0.2);
      // "chof" de agua
      if (S.chapuzon && f > 1.2) { S.chapuzon(); return; }
      const n = Math.floor(a.sampleRate * 0.16), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
      const src = a.createBufferSource(), fl = a.createBiquadFilter(), g2 = a.createGain();
      src.buffer = buf; fl.type = 'bandpass'; fl.frequency.value = 1400; fl.Q.value = 0.8; g2.gain.value = 0.09 * Math.min(1.5, f);
      src.connect(fl); fl.connect(g2); g2.connect(S.maestro); src.start(t0);
    } catch (_) { /* sin audio: se juega igual */ }
  }

  // ---------- Efectos sobre el movimiento ----------
  // 1 = normal; menos = resbaladizo (multiplica la aceleración de Julieth)
  Cl.friccion = function () {
    if (dentro()) return 1;
    return 1 - (1 - CLIMA.FRICCION_MIN) * U.suave(Cl.cobertura);
  };
  // Empuje suave del viento en unidades de mundo por segundo: {x, y}
  Cl.viento = function () {
    if (dentro()) return { x: 0, y: 0 };
    const f = CLIMA.VIENTO_FUERZA * Cl.viento_k() * rafaga;
    return { x: f * Cl.dirViento, y: f * 0.12 * Math.sin(reloj * 0.6) };
  };
  Cl.viento_k = () => Cl.kViento; // intensidad 0..1

  // ---------- Floración ----------
  // {k: 0..1 fuerza del efecto, tipo: 'lluvia'|'nieve'|null, apertura: 0..1 (animación de abrirse)}
  Cl.floracion = function () {
    const F = Cl.flor;
    return { k: F.k, tipo: F.tipo, apertura: F.tipo ? U.limitar(F.t / CLIMA.FLORACION_ABRIR_SEG, 0, 1) : 1 };
  };

  // Estilo listo para usar al dibujar UNA flor. f = flor de J.Mundo.flores ({x, y, color, fase, t}).
  // Devuelve {escala, color, centro, extra (0..1 brillo/gota/escarcha), giro, mecer} o null si no hay efecto.
  const COLOR_LLUVIA = { '#ffd23f': '#ffb000', '#ff5d8f': '#ff2e7a', '#ffffff': '#c9f3ff' };
  const COLOR_NIEVE = ['#e8f4ff', '#d9ccff', '#bfe9ff', '#ffe3f1'];
  Cl.florEstilo = function (f, t) {
    const F = Cl.flor;
    const mecer = 1 + Cl.viento_k() * 2.2 * rafaga;
    if (!F.tipo || F.k <= 0.001 || dentro()) return mecer > 1.01 ? { escala: 1, color: f.color, centro: null, extra: 0, giro: 0, mecer } : null;
    // cada flor se abre con un pequeño desfase y un rebote
    const ret = (f.fase % 1) * 0.6, a = U.limitar((F.t - ret) / CLIMA.FLORACION_ABRIR_SEG, 0, 1);
    const rebote = a < 1 ? Math.sin(a * Math.PI) * 0.35 : 0;
    const apertura = U.suave(a) + rebote;
    if (F.tipo === 'lluvia') {
      return {
        escala: 1 + 0.45 * F.k * apertura,
        color: mezclaHex(f.color, COLOR_LLUVIA[f.color] || saturar(f.color), F.k),
        centro: '#fff6b0', extra: F.k * (0.5 + 0.5 * Math.sin(t * 3 + f.fase * 5)), // gota de rocío brillante
        giro: (1 - apertura) * 1.2, mecer
      };
    }
    const fria = COLOR_NIEVE[Math.floor(f.fase * 10) % COLOR_NIEVE.length];
    return {
      escala: 1 + 0.25 * F.k * apertura,
      color: mezclaHex(f.color, fria, F.k * 0.8),
      centro: '#9fd8ff', extra: F.k * 0.8,                                           // escarcha / destellos
      giro: (1 - apertura) * 3 + F.k * t * 0.6, mecer                                // giran al abrirse
    };
  };

  function mezclaHex(a, b, k) {
    if (!a || a[0] !== '#' || !b) return a;
    return U.rgb(U.mezclaColor(U.hex(a), U.hex(b), U.limitar(k, 0, 1)));
  }
  function saturar(hex) {
    if (!hex || hex[0] !== '#') return hex;
    const c = U.hex(hex), m = (c[0] + c[1] + c[2]) / 3;
    return '#' + c.map((v) => U.limitar(Math.round(m + (v - m) * 1.5), 0, 255).toString(16).padStart(2, '0')).join('');
  }

  // Dibuja el brillo extra de una flor (rocío o escarcha). Llamar después de la flor, con st = florEstilo(...)
  Cl.dibFlorExtra = function (ctx, tx, ty, st, tam) {
    if (!st || st.extra < 0.05) return;
    const r = (tam || 1) * st.escala;
    if (Cl.flor.tipo === 'lluvia') {
      ctx.fillStyle = `rgba(220,248,255,${0.85 * st.extra})`;
      ctx.beginPath(); ctx.arc(tx + 4 * r, ty - 4 * r, 1.8 * r, 0, U.TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${st.extra})`; ctx.fillRect(tx + 3.4 * r, ty - 4.8 * r, 1, 1);
    } else {
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * st.extra})`; ctx.lineWidth = 1;
      const s = 2.5 * r;
      ctx.beginPath(); ctx.moveTo(tx - s, ty - 6 * r); ctx.lineTo(tx + s, ty - 6 * r); ctx.moveTo(tx, ty - 6 * r - s); ctx.lineTo(tx, ty - 6 * r + s); ctx.stroke();
    }
  };

  // ---------- Dibujo en coordenadas de mundo (justo después del suelo) ----------
  // v = vista de main.js {x0, y0, x1, y1, w, h, cx, cy}
  Cl.dibujarSuelo = function (ctx, v, t) {
    if (dentro() || v.x0 > C.MUNDO_W) return;
    t = t || reloj;
    if (Cl.cobertura > 0.01) dibNieveSuelo(ctx, v);
    for (const p of Cl.charcos) {
      if (p.x < v.x0 - 80 || p.x > v.x1 + 80 || p.y < v.y0 - 60 || p.y > v.y1 + 60) continue;
      dibCharco(ctx, p, t);
    }
    for (const o of Cl.ondas) {
      if (o.x < v.x0 - 60 || o.x > v.x1 + 60 || o.y < v.y0 - 40 || o.y > v.y1 + 40) continue;
      const k = 1 - o.vida / o.max;
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r * (0.3 + k), o.r * 0.45 * (0.3 + k), 0, 0, U.TAU); ctx.stroke();
    }
    // aros de gotas sobre el pasto
    if (Cl.lluvia > 0.05) {
      const n = Math.round(26 * Cl.lluvia);
      ctx.strokeStyle = 'rgba(220,240,255,0.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const sem = Math.floor(t * 3 + i * 0.37), fr = (t * 3 + i * 0.37) % 1;
        const h1 = hash(sem * 31 + i, 7), h2 = hash(sem * 17 + i, 13);
        const x = v.x0 + h1 * v.w, y = v.y0 + h2 * v.h, r = 3 + fr * 9;
        ctx.moveTo(x + r, y); ctx.ellipse(x, y, r, r * 0.42, 0, 0, U.TAU);
      }
      ctx.globalAlpha = 1; ctx.stroke();
    }
  };
  Cl.dibujarFondo = Cl.dibujarSuelo; // alias

  function hash(a, b) { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }

  function dibCharco(ctx, p, t) {
    const k = U.suave(Math.min(1, p.k * 1.15)), rx = p.rx * k, ry = p.ry * k;
    if (rx < 2) return;
    const blob = (esc, dx, dy) => {
      ctx.beginPath();
      const n = p.bultos.length;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * U.TAU, b = p.bultos[i % n] * (1 + Math.sin(t * 1.5 + p.fase + i) * 0.02);
        const x = p.x + dx + Math.cos(a) * rx * b * esc, y = p.y + dy + Math.sin(a) * ry * b * esc;
        if (i === 0) ctx.moveTo(x, y); else {
          const am = ((i - 0.5) / n) * U.TAU, bm = (p.bultos[i - 1] + p.bultos[i % n]) / 2 * 1.06;
          ctx.quadraticCurveTo(p.x + dx + Math.cos(am) * rx * bm * esc, p.y + dy + Math.sin(am) * ry * bm * esc, x, y);
        }
      }
      ctx.closePath();
    };
    ctx.globalAlpha = Math.min(1, p.k * 2);
    ctx.fillStyle = '#4f86c9'; blob(1.08, 0, 2); ctx.fill();          // borde húmedo
    ctx.fillStyle = '#7fb7ee'; blob(1, 0, 0); ctx.fill();
    ctx.fillStyle = '#b6e2ff'; blob(0.62, -rx * 0.18, -ry * 0.22); ctx.fill(); // reflejo del cielo
    // brillitos que se mueven
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.5;
    const o = Math.sin(t * 2 + p.fase) * 3;
    ctx.beginPath(); ctx.ellipse(p.x - rx * 0.35 + o, p.y - ry * 0.3, rx * 0.25, ry * 0.18, -0.2, 3.4, 5.6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(p.x + rx * 0.4 - o * 0.5, p.y + ry * 0.15, 2.2, 0, U.TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Manchones de nieve repartidos en una rejilla del mundo: aparecen poco a poco según la cobertura
  const CELDA_N = 110;
  const SIN_NIEVE = { volcan: 1, desierto: 1 }; // en el volcán y el desierto la nieve no cuaja
  function dibNieveSuelo(ctx, v) {
    const M = J.Mundo, cob = Cl.cobertura;
    // velo blanco general
    ctx.fillStyle = `rgba(244,250,255,${0.32 * U.suave(cob)})`;
    ctx.fillRect(v.x0, v.y0, v.w, v.h);
    ctx.fillStyle = 'rgba(250,253,255,0.9)';
    ctx.beginPath();
    for (let i = Math.floor(v.x0 / CELDA_N) - 1; i <= Math.floor(v.x1 / CELDA_N) + 1; i++) {
      for (let j = Math.floor(v.y0 / CELDA_N) - 1; j <= Math.floor(v.y1 / CELDA_N) + 1; j++) {
        const key = i * 100000 + j;
        let c = celdasNieve.get(key);
        if (!c) {
          const x = (i + hash(i, j)) * CELDA_N, y = (j + hash(j, i + 3)) * CELDA_N;
          c = { x, y, umbral: hash(i + 11, j - 5) * 0.85, r: 34 + hash(i - 2, j + 9) * 40, ok: !(M && M.enRio && M.enRio(x, y, 40)) && !(M && M.zonaEn && SIN_NIEVE[M.zonaEn(x, y)]) };
          if (celdasNieve.size > 6000) celdasNieve.clear();
          celdasNieve.set(key, c);
        }
        if (!c.ok || cob <= c.umbral) continue;
        const k = U.suave(U.limitar((cob - c.umbral) / 0.25, 0, 1)), r = c.r * k;
        ctx.moveTo(c.x + r, c.y); ctx.ellipse(c.x, c.y, r, r * 0.5, 0, 0, U.TAU);
        ctx.moveTo(c.x + r * 0.9, c.y - r * 0.15); ctx.ellipse(c.x + r * 0.5, c.y - r * 0.15, r * 0.45, r * 0.28, 0, 0, U.TAU);
      }
    }
    ctx.globalAlpha = Math.min(1, cob * 1.6);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ---------- Dibujo en coordenadas de pantalla ----------
  // Llamar con ctx.setTransform(DPR,0,0,DPR,0,0). zoom = el de la cámara (opcional, 1 por defecto).
  Cl.dibujarPantalla = function (ctx, W, H, zoom, t) {
    if (dentro()) return;
    zoom = zoom || 1; t = t || reloj;
    const mx = -dCam.x * zoom, my = -dCam.y * zoom; // desplazamiento por cámara (píxeles)
    const vk = Cl.viento_k(), vx = Cl.dirViento * vk * rafaga;

    // tinte del cielo
    if (Cl.lluvia > 0.01) { ctx.fillStyle = `rgba(70,90,130,${0.22 * Cl.lluvia})`; ctx.fillRect(0, 0, W, H); }
    if (Cl.nieve > 0.01) { ctx.fillStyle = `rgba(215,230,255,${0.16 * Cl.nieve})`; ctx.fillRect(0, 0, W, H); }

    // lluvia
    const nG = Math.round(CLIMA.GOTAS_MAX * Cl.lluvia * Math.min(1.4, (W * H) / (1420 * 780)));
    while (Cl.gotas.length < nG) Cl.gotas.push({ x: Math.random() * W, y: Math.random() * H, v: U.azar(700, 1000), l: U.azar(12, 22) });
    if (Cl.gotas.length > nG) Cl.gotas.length = nG;
    if (Cl.gotas.length) {
      const dt = ultDt, inc = 60 + vx * 260;
      ctx.strokeStyle = 'rgba(200,225,255,0.55)'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (const g of Cl.gotas) {
        g.y += g.v * dt + my; g.x += inc * dt * (g.v / 800) + mx;
        if (g.y > H + 20) { g.y = -20 - Math.random() * 40; g.x = Math.random() * (W + 200) - 100; }
        if (g.y < -80) g.y = H + 10;
        if (g.x > W + 100) g.x -= W + 200; else if (g.x < -100) g.x += W + 200;
        const k = g.l / g.v;
        ctx.moveTo(g.x, g.y); ctx.lineTo(g.x - inc * k, g.y - g.v * k);
      }
      ctx.stroke();
    }

    // nieve
    const nC = Math.round(CLIMA.COPOS_MAX * Cl.nieve * Math.min(1.4, (W * H) / (1420 * 780)));
    while (Cl.copos.length < nC) Cl.copos.push({ x: Math.random() * W, y: Math.random() * H - H * 0.3, v: U.azar(35, 80), r: U.azar(1.8, 4.6), f: Math.random() * 6 });
    if (Cl.copos.length > nC) Cl.copos.length = nC;
    if (Cl.copos.length) {
      const dt = ultDt;
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath();
      for (const c of Cl.copos) {
        const par = c.r / 4; // los grandes (más cerca) se mueven más con la cámara
        c.y += c.v * dt + my * par; c.x += (Math.sin(t * 1.3 + c.f) * 22 + vx * 90) * dt + mx * par;
        if (c.y > H + 10) { c.y = -10; c.x = Math.random() * W; }
        if (c.y < -40) c.y = H + 5;
        if (c.x > W + 20) c.x -= W + 40; else if (c.x < -20) c.x += W + 40;
        ctx.moveTo(c.x + c.r, c.y); ctx.arc(c.x, c.y, c.r, 0, U.TAU);
      }
      ctx.fill();
    }

    // viento: hojas, pétalos y ráfagas
    const nH = Math.round(CLIMA.HOJAS_MAX * Math.max(0, vk - 0.15) / 0.85);
    while (Cl.hojas.length < nH) Cl.hojas.push(nuevaHoja(W, H, true));
    if (Cl.hojas.length > nH && Math.random() < 0.05) Cl.hojas.pop();
    if (Cl.hojas.length) {
      const dt = ultDt;
      for (let i = 0; i < Cl.hojas.length; i++) {
        const h = Cl.hojas[i];
        h.x += Cl.dirViento * h.v * (0.5 + rafaga) * dt * 60 + mx;
        h.y += (Math.sin(t * h.w + h.f) * 40 + 18) * dt + my;
        h.g += dt * h.w * 2;
        if (h.x > W + 40 || h.x < -40 || h.y > H + 40 || h.y < -60) Cl.hojas[i] = nuevaHoja(W, H, false);
        dibHoja(ctx, h);
      }
    }
    if (vk > 0.4) {
      const a = (vk - 0.4) / 0.6 * rafaga;
      ctx.strokeStyle = `rgba(255,255,255,${0.35 * a})`; ctx.lineWidth = 2.5;
      for (let i = 0; i < 5; i++) {
        const fr = (t * 0.45 + i * 0.21) % 1, y = hash(i, Math.floor(t * 0.45 + i * 0.21)) * H;
        const x0 = Cl.dirViento > 0 ? -200 + fr * (W + 400) : W + 200 - fr * (W + 400), L = 120 * Cl.dirViento;
        ctx.beginPath(); ctx.moveTo(x0, y);
        ctx.bezierCurveTo(x0 + L * 0.4, y - 10, x0 + L * 0.7, y + 10, x0 + L, y - 4);
        ctx.arc(x0 + L, y - 14, 10, Math.PI / 2, Cl.dirViento > 0 ? -Math.PI * 0.3 : Math.PI * 1.3, Cl.dirViento < 0);
        ctx.stroke();
      }
    }
  };

  const COL_HOJA = ['#7bd35a', '#4fb04a', '#ffb3cf', '#ff8fb8', '#ffd23f', '#ffffff'];
  function nuevaHoja(W, H, enCualquierLado) {
    return {
      x: enCualquierLado ? Math.random() * W : Cl.dirViento > 0 ? -30 : W + 30,
      y: Math.random() * H * 0.9, v: U.azar(140, 260) / 60, w: U.azar(1, 2.4), f: Math.random() * 6, g: Math.random() * 6,
      tam: U.azar(5, 9), color: COL_HOJA[Math.floor(Math.random() * COL_HOJA.length)]
    };
  }
  function dibHoja(ctx, h) {
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.g);
    ctx.scale(1, 0.55 + 0.45 * Math.cos(h.g * 1.7));
    ctx.fillStyle = h.color; ctx.beginPath(); ctx.ellipse(0, 0, h.tam, h.tam * 0.5, 0, 0, U.TAU); ctx.fill();
    if (h.color[1] !== 'f') { ctx.strokeStyle = 'rgba(40,110,50,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-h.tam, 0); ctx.lineTo(h.tam, 0); ctx.stroke(); }
    ctx.restore();
  }

  // Estado legible (para el HUD o depurar)
  Cl.info = () => ({ estado: Cl.estado, quedan: Math.round(Cl.tiempo), lluvia: +Cl.lluvia.toFixed(2), viento: +Cl.viento_k().toFixed(2), nieve: +Cl.nieve.toFixed(2), cobertura: +Cl.cobertura.toFixed(2), charcos: Cl.charcos.length, floracion: Cl.floracion() });

  J.Clima = Cl;
})();
