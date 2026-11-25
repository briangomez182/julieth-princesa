/* Vehículos terrestres / monturas: el Auto de princesa (kart rosa y dorado)
   y el Unicornio mágico con patas que galopan (crin arcoíris, estela de estrellitas).

   Módulo independiente: expone J.Vehiculos. Mientras Julieth va montada,
   el vehículo mueve a Julieth (J.Jul.x/y/z/vx/vy quedan sincronizados, así la
   cámara y los objetos del mundo la siguen sin cambios) y Ju.estado = 'montada'.
   Ver la API pública al final del archivo. */
(function () {
  const U = J.U;

  // ============================================================
  //  Números ajustables (aquí y no en config.js)
  // ============================================================
  const VEHICULOS = {
    DIST_SUBIR: 80,              // a qué distancia de un vehículo aparece "Subir"
    TECLAS_MONTAR: ['KeyE', 'KeyF'], // teclas propias (si tecladoPropio está activo)
    VOLVER_SEG: 120,             // un vehículo abandonado lejos vuelve a su parada tras estos segundos
    CREAR_BOTON: true,           // si no existe #btn-montar en el HTML, se crea uno simple
    GRAVEDAD: 2250,
    // Paradas: null = se generan solas (junto a la salida y a los patios de los castillos).
    // También se puede poner una lista: [{ tipo: 'auto'|'caballo', x, y, dir?: 1|-1, exacto?: true }]
    // o llamar a J.Vehiculos.colocar(lista) en cualquier momento.
    PARADAS: null,

    auto: {
      VEL_MAX: 640,          // Julieth corre a 345: el kart va casi al doble
      ACEL: 820,             // aceleración hacia adelante (unidades/s²)
      FRENO: 1500,           // al pedir la dirección contraria
      ROCE: 340,             // frenado al soltar el acelerador
      GIRO: 3.3,             // rad/s de giro a buena velocidad (a baja velocidad gira la mitad)
      GIRO_DERRAPE: 1.3,     // multiplicador de giro mientras derrapa
      AGARRE: 11,            // cuánto "muerde" el piso (más = menos patina)
      AGARRE_DERRAPE: 3.2,   // agarre durante el derrape (patina de lado)
      VEL_DERRAPE: 250,      // velocidad mínima para derrapar
      CARGA_NIVELES: [0.45, 1.0, 1.7],    // segundos de derrape para mini-turbo azul / naranja / rosa
      MINITURBO_SEG: [0.45, 0.8, 1.2],
      MINITURBO_MULT: 1.35,
      TURBO_COMIDA: 1.2,     // con comida/estrella (Ju.turbo) va un 20 % más rápido
      SALTITO: 360,          // saltito al tocar la bocina
      REBOTE: 0.35,          // cuánto rebota al chocar
      RADIO: 24,             // radio de colisión
      ESCALA: 1.15
    },
    caballo: {
      VEL_MAX: 450,          // más lento que el auto pero gira al instante
      VEL_GALOPE: 560,       // manteniendo Correr
      AGIL: 7.5,             // respuesta de la dirección (más = más ágil)
      AGIL_AIRE: 3.2,        // durante un salto grande
      SALTITO: 250,          // referencia para la inclinación en el aire
      SALTO: 820,            // salto con Espacio (sube a colinas y plataformas, rebota en hongos)
      TURBO_COMIDA: 1.2,
      REBOTE: 0.4,
      RADIO: 20,
      ESCALA: 1.1,
      PLANEO_Z: 60,          // sobre el río (o un lago) planea a esta altura hasta llegar a la otra orilla
      PLANEO_VEL: 330,       // velocidad mínima con la que cruza el agua aunque no se toque nada
      SALTO_ORILLA: 150      // galopando hacia el agua a esta velocidad, salta solo
    }
  };

  const V = {
    VEHICULOS, lista: [], t: 0,
    tecladoPropio: true,      // el integrador puede apagarlo y llamar a V.alternar(Ju) desde entrada.js
    _montado: null, _cercano: null, _pedido: false, _iniciado: false,
    marcas: [], _boton: null, _botonCreado: false, _botonEstado: ''
  };

  const PI = Math.PI;
  const difAng = (a, b) => { let d = (a - b) % (2 * PI); if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI; return d; };
  const cfg = (v) => VEHICULOS[v.tipo];
  const M = () => V._mundo || J.Mundo;
  const P = () => J.Part;
  const grav = () => (J.CFG && J.CFG.GRAVEDAD) || VEHICULOS.GRAVEDAD;

  // ============================================================
  //  Sonido (Web Audio usando el contexto y el volumen de J.Audio)
  // ============================================================
  const Son = { motor: null, _ruido: null };
  Son.ok = () => { const S = J.Audio; return !!(S && S.ctx && S.maestro && S.sonidoOn && S.ctx.state === 'running'); };
  Son.nota = function (f, dur, tipo, vol, cuando, fFin) {
    if (!Son.ok()) return;
    const S = J.Audio, t0 = S.ctx.currentTime + (cuando || 0);
    const o = S.ctx.createOscillator(), g = S.ctx.createGain();
    o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (fFin) o.frequency.exponentialRampToValueAtTime(fFin, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(S.maestro); o.start(t0); o.stop(t0 + dur + 0.05);
    return o;
  };
  Son.ruido = function (dur, vol, cuando, filtro, tipoFiltro) {
    if (!Son.ok()) return;
    const S = J.Audio, ac = S.ctx, t0 = ac.currentTime + (cuando || 0);
    if (!Son._ruido) {
      const n = ac.sampleRate, b = ac.createBuffer(1, n, n), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      Son._ruido = b;
    }
    const src = ac.createBufferSource(); src.buffer = Son._ruido;
    const fl = ac.createBiquadFilter(); fl.type = tipoFiltro || 'lowpass'; fl.frequency.value = filtro || 1200;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol || 0.08, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl); fl.connect(g); g.connect(S.maestro); src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.05);
  };
  Son.bocina = () => { [0, 0.17].forEach((d) => { Son.nota(622, 0.13, 'square', 0.08, d); Son.nota(784, 0.13, 'square', 0.06, d); Son.nota(1245, 0.13, 'triangle', 0.04, d); }); };
  Son.arranque = () => { Son.nota(70, 0.45, 'sawtooth', 0.08, 0, 190); Son.nota(140, 0.3, 'square', 0.035, 0.2, 230); Son.magia(); };
  Son.magia = () => [1047, 1319, 1568, 2093].forEach((f, i) => Son.nota(f, 0.18, 'triangle', 0.06, i * 0.05));
  Son.turbo = (nivel) => { Son.nota(300 + nivel * 80, 0.35, 'sawtooth', 0.06, 0, 900 + nivel * 200); Son.ruido(0.3, 0.06, 0, 2600, 'bandpass'); };
  Son.derrape = () => Son.ruido(0.12, 0.035, 0, 3200, 'bandpass');
  Son.choque = () => { Son.nota(160, 0.14, 'square', 0.09, 0, 80); Son.ruido(0.12, 0.08, 0, 700); };
  Son.boing = () => { Son.nota(220, 0.28, 'sine', 0.16, 0, 660); };
  Son.clop = (alto) => { Son.nota(alto ? 980 : 760, 0.05, 'triangle', 0.05); Son.ruido(0.04, 0.03, 0, 2400, 'bandpass'); };
  Son.relincho = function () {
    if (!Son.ok()) return;
    const ac = J.Audio.ctx, t0 = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(700, t0); o.frequency.exponentialRampToValueAtTime(1350, t0 + 0.14);
    o.frequency.exponentialRampToValueAtTime(620, t0 + 0.6);
    lfo.frequency.value = 23; lg.gain.value = 70; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.62);
    o.connect(g); g.connect(J.Audio.maestro); o.start(t0); lfo.start(t0); o.stop(t0 + 0.7); lfo.stop(t0 + 0.7);
    Son.magia();
  };
  // ronroneo del motor del kart (continuo mientras se maneja)
  Son.motorActualizar = function (k, turbo) {
    const S = J.Audio;
    if (!S || !S.ctx || !S.maestro) return;
    const ac = S.ctx;
    if (!Son.motor) {
      const o1 = ac.createOscillator(), o2 = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain();
      o1.type = 'sawtooth'; o2.type = 'square'; fl.type = 'lowpass'; fl.frequency.value = 500; g.gain.value = 0.0001;
      o1.connect(fl); o2.connect(fl); fl.connect(g); g.connect(S.maestro); o1.start(); o2.start();
      Son.motor = { o1, o2, fl, g };
    }
    const m = Son.motor, ahora = ac.currentTime;
    const f = 62 + 150 * k + (turbo ? 45 : 0);
    m.o1.frequency.setTargetAtTime(f, ahora, 0.06); m.o2.frequency.setTargetAtTime(f * 1.505, ahora, 0.06);
    m.fl.frequency.setTargetAtTime(450 + 1100 * k, ahora, 0.08);
    m.g.gain.setTargetAtTime(S.sonidoOn ? 0.022 + 0.02 * k : 0.0001, ahora, 0.08);
  };
  Son.motorParar = function () {
    const m = Son.motor; if (!m) return;
    Son.motor = null;
    try {
      const ac = J.Audio.ctx, a = ac.currentTime;
      m.g.gain.setTargetAtTime(0.0001, a, 0.08); m.o1.stop(a + 0.5); m.o2.stop(a + 0.5);
    } catch (_) {}
  };

  // ============================================================
  //  Creación y paradas
  // ============================================================
  function crear(tipo, x, y, dir) {
    dir = dir || 1;
    return {
      tipo, x, y, z: 0, vx: 0, vy: 0, vz: 0, ang: dir > 0 ? 0 : PI, dir, escorzo: 1,
      enSuelo: true, casa: { x, y, dir }, fase: Math.random() * 6, rueda: 0,
      derrape: false, dirDerrape: 0, carga: 0, miniTurbo: 0, trompo: 0, trompoDir: 1,
      rebote: 0, celebra: 0, solo: 0, tEscape: 0, tChispa: 0, tHumo: 0, golpe: 0, tBocina: 0, buffer: 0,
      giro: 0, lateral: 0, granSalto: false, _ultMarca: null,
      _entrada: null, _jx: 0, _jy: 0, _jz: 0, _jvz: 0
    };
  }

  // ¿Cabe un vehículo de radio r en (x, y) a nivel del suelo?
  function lugarLibre(x, y, r) {
    const Mu = M();
    if (!Mu) return true;
    if (Mu.bloqueado(x, y, 0, r + 8)) return false;
    if (Mu.altura(x, y) > 0) return false;
    if (Mu.enRio && Mu.rio && Mu.rio.length && Mu.enRio(x, y, r + 40)) return false;
    for (const c of Mu.castillos || []) if (Math.abs(x - c.x) < 34 + r && y < c.y + 30 && y > c.y - 30) return false; // no tapar puertas
    for (const p of Mu.portales || []) if (U.dist(x, y, p.x, p.y) < 70 + r) return false;
    for (const p of Mu.peligros || []) if (U.dist(x, y, p.x, p.y) < (p.r || 30) + r + 30) return false;
    for (const v of V.lista) if (U.dist(x, y, v.casa.x, v.casa.y) < 120) return false;
    return true;
  }
  // Busca el lugar libre más cercano en espiral (devuelve null si no hay)
  function buscarLibre(x, y, r) {
    if (lugarLibre(x, y, r)) return { x, y };
    for (let d = 20; d < 600; d += 20) {
      const n = Math.max(8, Math.round(d / 12));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * U.TAU, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.75;
        if (lugarLibre(px, py, r)) return { x: px, y: py };
      }
    }
    return null;
  }

  // Paradas automáticas: dos junto a la salida y una (alternando) al lado de cada patio de castillo.
  V.paradasPorDefecto = function () {
    const Mu = M(), Ju = J.Jul, out = [];
    const sx = Ju ? Ju.x : (J.CFG.MUNDO_W || 5200) / 2, sy = Ju ? Ju.y : (J.CFG.MUNDO_H || 3800) / 2;
    out.push({ tipo: 'auto', x: sx + 190, y: sy + 80, dir: 1 });
    out.push({ tipo: 'caballo', x: sx - 190, y: sy + 80, dir: -1 });
    (Mu && Mu.castillos || []).forEach((c, i) => {
      if (U.dist(c.patio.x, c.patio.y, sx, sy) < 500) return; // el castillo de la salida ya tiene
      const lado = i % 2 ? -1 : 1;
      out.push({ tipo: i % 2 ? 'caballo' : 'auto', x: c.patio.x + lado * 320, y: c.patio.y + 90, dir: -lado });
    });
    return out;
  };

  // Reemplaza todos los vehículos por los de la lista (se ajustan a un lugar libre salvo exacto:true)
  V.colocar = function (lista) {
    if (V._montado && J.Jul) V.bajar(J.Jul);
    V.lista = []; V.marcas.length = 0; V._cercano = null;
    for (const p of lista || []) {
      if (p.tipo !== 'auto' && p.tipo !== 'caballo') continue;
      const r = VEHICULOS[p.tipo].RADIO;
      const pos = p.exacto ? { x: p.x, y: p.y } : buscarLibre(p.x, p.y, r);
      if (!pos) continue;
      V.lista.push(crear(p.tipo, pos.x, pos.y, p.dir));
    }
    return V.lista;
  };
  // Agrega un vehículo suelto (devuelve el vehículo o null)
  V.agregar = function (tipo, x, y, dir, exacto) {
    if (!VEHICULOS[tipo]) return null;
    const pos = exacto ? { x, y } : buscarLibre(x, y, VEHICULOS[tipo].RADIO);
    if (!pos) return null;
    const v = crear(tipo, pos.x, pos.y, dir); V.lista.push(v); return v;
  };
  // Mueve la parada (casa) de un vehículo
  V.reubicar = function (v, x, y) { v.casa.x = x; v.casa.y = y; if (v !== V._montado) { v.x = x; v.y = y; v.vx = v.vy = 0; } };

  // Llamar después de J.Mundo.generar()
  V.iniciar = function (mundo) {
    if (mundo) V._mundo = mundo;
    V.colocar(VEHICULOS.PARADAS || V.paradasPorDefecto());
    if (!V._iniciado) {
      V._iniciado = true;
      window.addEventListener('keydown', (e) => {
        if (!V.tecladoPropio || e.repeat || VEHICULOS.TECLAS_MONTAR.indexOf(e.code) < 0) return;
        if (!document.body.classList.contains('jugando')) return;
        if ((J.Dialogo && (J.Dialogo.abierto || J.Dialogo.cerca)) || (J.Mapa && J.Mapa.abierto)) return;
        if (!V._montado && !V._cercano) return;
        e.preventDefault(); V._pedido = true;
      });
      prepararBoton();
    }
  };

  function prepararBoton() {
    if (typeof document === 'undefined' || !document.body) return;
    let b = document.getElementById('btn-montar');
    if (!b && VEHICULOS.CREAR_BOTON) {
      b = document.createElement('button'); b.id = 'btn-montar'; b.type = 'button';
      b.innerHTML = '<span>Subir</span> <kbd>E</kbd>';
      Object.assign(b.style, {
        position: 'fixed', left: '50%', bottom: 'calc(150px + 5vh + env(safe-area-inset-bottom))', transform: 'translateX(-50%)',
        display: 'none', zIndex: 30, font: '900 20px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif', color: '#fff',
        background: '#ff5d8f', border: '3px solid #fff', borderRadius: '999px', padding: '8px 22px',
        boxShadow: '0 4px 0 #5b2a4e', touchAction: 'none', cursor: 'pointer'
      });
      document.body.appendChild(b); V._botonCreado = true;
    }
    if (!b) return;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('pulsado'); if (V.tecladoPropio) V._pedido = true; }); // sin teclado propio, main.js maneja el botón
    const sube = () => b.classList.remove('pulsado');
    b.addEventListener('pointerup', sube); b.addEventListener('pointerleave', sube);
    b.addEventListener('click', (e) => { e.preventDefault(); b.blur(); });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    V._boton = b;
  }
  function refrescarBoton() {
    const b = V._boton; if (!b || !V.tecladoPropio) return; // unificado: main.js decide el texto y la visibilidad
    const jugando = document.body.classList.contains('jugando') && !(J.Dialogo && J.Dialogo.abierto) && !(J.Mapa && J.Mapa.abierto);
    const estado = !jugando ? '' : V._montado ? 'Bajar' : V._cercano ? 'Subir' : '';
    if (estado === V._botonEstado) return;
    V._botonEstado = estado;
    b.classList.toggle('visible', !!estado);
    if (V._botonCreado) b.style.display = estado ? 'block' : 'none';
    const s = b.querySelector('span'); if (s && estado) s.textContent = estado;
  }

  // ============================================================
  //  Subir / bajar
  // ============================================================
  V.montado = () => V._montado;

  V.cercano = function (ju) {
    ju = ju || J.Jul;
    const Mu = M();
    if (!ju || V._montado || ju.estado !== 'normal' || (Mu && Mu.salaActiva)) return null;
    if (J.Bote && J.Bote.montado && J.Bote.montado()) return null; // navegando: no se sube al auto
    const suelo = Mu ? Mu.altura(ju.x, ju.y) : 0;
    if (ju.z - suelo > 45) return null;
    let mejor = null, md = VEHICULOS.DIST_SUBIR;
    for (const v of V.lista) {
      const d = Math.hypot(v.x - ju.x, (v.y - ju.y) * 1.3);
      if (d < md && Math.abs(v.z - ju.z) < 60) { md = d; mejor = v; }
    }
    return mejor;
  };

  V.subir = function (ju, v) {
    ju = ju || J.Jul; v = v || V.cercano(ju);
    if (!ju || !v || V._montado || ju.estado !== 'normal') return false;
    V._montado = v; V._cercano = null;
    ju.estado = 'montada'; ju.tEstado = 0; ju.vx = ju.vy = 0; ju.corriendo = false;
    v.solo = 0; v.rebote = 1; v.celebra = 0; v.derrape = false; v.carga = 0; v.buffer = 0;
    if (!v.enSuelo && v.vz === 0) v.enSuelo = true;
    sincronizar(v, ju);
    const Pa = P();
    if (Pa) { Pa.chispas(v.x, v.y, v.z + 60, 16, v.tipo === 'auto' ? '#ffd23f' : '#ff9dcb'); Pa.texto(v.x, v.y, v.z + 150, v.tipo === 'auto' ? '¡Brum brum!' : '¡Arre, caballito!', '#fff6b0', 22); }
    if (v.tipo === 'auto') Son.arranque(); else Son.relincho();
    if (J.Entrada && J.Entrada.consumirSalto) J.Entrada.consumirSalto();
    return true;
  };

  V.bajar = function (ju) {
    ju = ju || J.Jul; const v = V._montado;
    if (!ju || !v) return false;
    if (v.tipo === 'caballo' && !v.enSuelo && v.granSalto) return false; // en pleno salto (o sobre el agua) no se baja
    const Mu = M();
    V._montado = null;
    if (v.tipo === 'auto') Son.motorParar();
    // busca un costado libre (a los lados, luego atrás, luego adelante)
    const c = Math.cos(v.ang), s = Math.sin(v.ang), cand = [];
    for (const d of [62, 90]) cand.push([-s * d, c * d * 0.8], [s * d, -c * d * 0.8], [-c * d, -s * d * 0.8], [c * d, s * d * 0.8]);
    let pos = null;
    for (const k of cand) {
      const x = v.x + k[0], y = v.y + k[1];
      if (!Mu || (!Mu.bloqueado(x, y, v.z) && Mu.altura(x, y) <= v.z + 16)) { pos = { x, y }; break; }
    }
    if (!pos) pos = { x: v.x, y: v.y + 4 };
    ju.x = pos.x; ju.y = pos.y; ju.z = v.z; ju.vx = v.vx * 0.3; ju.vy = v.vy * 0.3;
    ju.vz = 360; ju.enSuelo = false; ju.cortoSalto = false; ju.estado = 'normal'; ju.tEstado = 0;
    ju.invul = Math.max(ju.invul || 0, 0.8); ju.dir = v.dir;
    v.derrape = false; v.carga = 0; v.miniTurbo = 0; v.solo = 0; v.rebote = 0.6;
    if (P()) P().chispas(ju.x, ju.y, ju.z + 40, 8, '#ffffff');
    if (J.Entrada && J.Entrada.consumirSalto) J.Entrada.consumirSalto();
    return true;
  };

  // Sube si hay un vehículo cerca o baja si ya va montada. Devuelve true si hizo algo.
  V.alternar = function (ju) {
    ju = ju || J.Jul;
    if (V._montado) return V.bajar(ju);
    const v = V.cercano(ju);
    return v ? V.subir(ju, v) : false;
  };
  V.pedirMontar = function () { V._pedido = true; };

  // ============================================================
  //  Física común
  // ============================================================
  function bloq(v, x, y) {
    const Mu = M(); if (!Mu) return false;
    const b = Mu.bloqueado(x, y, v.z, cfg(v).RADIO);
    if (b === 'rio' && v.tipo === 'caballo' && !v.enSuelo && v.granSalto) return false; // el unicornio salta por encima del agua
    if (b) return b;
    if (Mu.altura(x, y) > v.z + 16) return 'alto';
    if (typeof V.bloqueoExtra === 'function') return V.bloqueoExtra(v, x, y) || false; // gancho opcional
    return false;
  }

  function mover(v, dt) {
    const K = cfg(v), vel = Math.hypot(v.vx, v.vy);
    const pasos = Math.max(1, Math.ceil((vel * dt) / 10)), h = dt / pasos;
    let choque = null;
    for (let i = 0; i < pasos; i++) {
      const nx = v.x + v.vx * h, bx = bloq(v, nx, v.y);
      if (!bx) v.x = nx; else { choque = choque || bx; v.vx *= -K.REBOTE; }
      const ny = v.y + v.vy * 0.85 * h, by = bloq(v, v.x, ny);
      if (!by) v.y = ny; else { choque = choque || by; v.vy *= -K.REBOTE; }
    }
    return choque ? { tipo: choque, vel } : null;
  }

  // ¿El unicornio está volando sobre el agua (río o lago, fuera de los puentes)?
  function sobreAgua(v) {
    const Mu = M();
    return !!(Mu && !Mu.salaActiva && Mu.enAgua(v.x, v.y, -8) && !Mu.enPuente(v.x, v.y));
  }
  // Planeo mágico: si al caer todavía hay agua debajo, flota y sigue derecho hasta la otra orilla
  function planear(v, dt) {
    const K = VEHICULOS.caballo;
    if (v.tipo !== 'caballo' || v.enSuelo || !v.granSalto || !sobreAgua(v)) { v.planeo = 0; return false; }
    if (v.vz > 0 || v.z > K.PLANEO_Z) return false; // todavía subiendo o bien alto: vuela normal
    v.planeo = (v.planeo || 0) + dt;
    v.z = K.PLANEO_Z + Math.sin(v.planeo * 6) * 4; v.vz = 0;
    const vel = Math.hypot(v.vx, v.vy);
    if (vel < K.PLANEO_VEL) { // sin tocar nada igual cruza, hacia donde iba
      const a = vel > 30 ? Math.atan2(v.vy, v.vx) : (v.angSalto !== undefined ? v.angSalto : v.ang);
      v.vx = Math.cos(a) * K.PLANEO_VEL; v.vy = Math.sin(a) * K.PLANEO_VEL;
    }
    const Pa = P();
    if (Pa && Math.random() < dt * 30) Pa.crear({ tipo: 'chispa', x: v.x + U.azar(-30, 30), y: v.y, z: v.z + U.azar(0, 20), vz: -40, vida: 0.6, tam: U.azar(3, 7), color: `hsl(${(V.t * 200 + Math.random() * 80) % 360},100%,78%)` });
    if (v.planeo > 6) { v.planeo = 0; v.z = 0; v.enSuelo = true; v.granSalto = false; desatascar(v); } // por las dudas: a la orilla más cercana
    return true;
  }

  function gravedad(v, dt) {
    const Mu = M(), suelo = Mu ? Mu.altura(v.x, v.y) : 0;
    let golpe = 0;
    if (planear(v, dt)) return 0;
    if (!v.enSuelo || v.z > suelo + 0.5) {
      v.vz -= grav() * dt; v.z += v.vz * dt; v.enSuelo = false;
      if (v.z <= suelo && v.vz <= 0) { golpe = -v.vz; v.z = suelo; v.vz = 0; v.enSuelo = true; v.granSalto = false; }
    } else { v.z = suelo; v.vz = 0; }
    return golpe;
  }

  function desatascar(v) {
    const Mu = M(); if (!Mu || !Mu.bloqueado(v.x, v.y, v.z, cfg(v).RADIO)) return;
    if (v.tipo === 'caballo' && !v.enSuelo && v.granSalto && Mu.bloqueado(v.x, v.y, v.z, cfg(v).RADIO) === 'rio') return; // volando sobre el agua
    for (let r = 12; r < 420; r += 12) for (let a = 0; a < 12; a++) {
      const x = v.x + Math.cos(a * 0.5236) * r, y = v.y + Math.sin(a * 0.5236) * r;
      if (!Mu.bloqueado(x, y, v.z, cfg(v).RADIO)) { v.x = x; v.y = y; return; }
    }
  }

  function efectoChoque(v, ch) {
    const Pa = P(); if (!ch || !Pa) return;
    if (ch.tipo === 'rio') { Pa.gotas(v.x + Math.cos(v.ang) * 30, v.y + Math.sin(v.ang) * 20, 10); if (J.Audio && J.Audio.chapuzon) J.Audio.chapuzon(); return; }
    if (ch.vel > 220 && v.golpe <= 0) {
      v.golpe = 0.35; v.rebote = 1;
      Pa.polvo(v.x + Math.cos(v.ang) * 30, v.y, 4); Pa.chispas(v.x + Math.cos(v.ang) * 30, v.y, v.z + 30, 6, '#ffffff');
      if (ch.vel > 380) Pa.texto(v.x, v.y, v.z + 130, U.azar(0, 1) < 0.5 ? '¡Pum!' : '¡Uy!', '#ffe0ec', 20);
      Son.choque();
    }
  }

  // Peligros cómicos: el vehículo protege a Julieth (no quita corazones) pero rebota.
  function peligros(v, dt) {
    const Mu = M(), Pa = P(), K = cfg(v);
    if (!Mu || !Mu.peligros || v.golpe > 0) return;
    for (const p of Mu.peligros) {
      const dx = v.x - p.x, dy = v.y - p.y;
      if (Math.abs(dx) > 120 || Math.abs(dy) > 90) continue;
      if (p.tipo === 'charco') {
        if (v.z < 3 && (dx * dx) / (50 * 50) + (dy * dy) / (24 * 24) < 1) {
          v.golpe = 0.8; Pa && Pa.gotas(v.x, v.y, 12);
          if (v.tipo === 'auto' && Math.hypot(v.vx, v.vy) > 200) { v.trompo = 0.85; v.trompoDir = Math.random() < 0.5 ? -1 : 1; v.derrape = false; v.carga = 0; if (J.Audio && J.Audio.resbalon) J.Audio.resbalon(); Pa && Pa.texto(v.x, v.y, v.z + 130, '¡Trompo!', '#a8f0ff', 22); }
          else { v.vx *= 0.6; v.vy *= 0.6; if (J.Audio && J.Audio.chapuzon) J.Audio.chapuzon(); }
        }
        continue;
      }
      const rr = (p.r || 26) + K.RADIO - 4, d2 = dx * dx + dy * dy * 1.7;
      if (d2 > rr * rr || v.z >= (p.alto || 40)) continue;
      if (p.tipo === 'caracol' && v.vz < -60 && v.z > 12) { // caer encima con el caballito: ¡pisotón!
        p.mareado = 4.5; v.vz = 560; v.enSuelo = false; v.golpe = 0.3;
        if (J.Audio && J.Audio.pisoton) J.Audio.pisoton();
        Pa && Pa.chispas(p.x, p.y, 40, 12, '#ffe873'); Pa && Pa.texto(p.x, p.y, 80, '¡Boing!', '#fff6b0', 22);
        continue;
      }
      const d = Math.sqrt(d2) || 1, nx = dx / d, ny = (dy * 1.3) / d, n = Math.hypot(nx, ny) || 1;
      const vel = Math.max(240, Math.hypot(v.vx, v.vy) * 0.55);
      v.vx = (nx / n) * vel; v.vy = (ny / n) * vel; v.vz = Math.max(v.vz, 260); v.enSuelo = false;
      v.golpe = 0.5; v.rebote = 1; v.derrape = false; v.carga = 0;
      if (p.tipo === 'caracol') p.mareado = Math.max(p.mareado || 0, 3);
      Son.boing();
      Pa && Pa.chispas(v.x, v.y, v.z + 40, 8, '#ffffff'); Pa && Pa.texto(v.x, v.y, v.z + 140, '¡Boing!', '#fff6b0', 22);
      break;
    }
  }

  // ============================================================
  //  Auto de princesa (kart en vista cenital con inercia)
  // ============================================================
  function conducirAuto(v, dt, ix, iy, correr, saltar, Ju) {
    const K = VEHICULOS.auto, Pa = P();
    const mag = Math.hypot(ix, iy);
    let vmax = K.VEL_MAX;
    if (Ju && Ju.turbo > 0) vmax *= K.TURBO_COMIDA;
    if (v.miniTurbo > 0) vmax *= K.MINITURBO_MULT;
    v.miniTurbo = Math.max(0, v.miniTurbo - dt);

    // 1) avance según el rumbo actual
    let c = Math.cos(v.ang), s = Math.sin(v.ang);
    const f0 = v.vx * c + v.vy * s;
    let df = 0, d = 0;
    if (v.trompo > 0) {
      v.trompo -= dt; v.ang += 13 * dt * v.trompoDir;
      df = -Math.sign(f0) * Math.min(Math.abs(f0), K.ROCE * 1.5 * dt);
    } else if (mag > 0.15) {
      d = difAng(Math.atan2(iy, ix), v.ang);
      if (Math.abs(d) > 2.5 && f0 > 140 && !v.derrape) {
        df = -K.FRENO * dt; // pide ir para atrás: frena primero
      } else {
        let giro = K.GIRO * (0.5 + 0.5 * Math.min(1, Math.abs(f0) / 260));
        if (v.derrape) giro *= K.GIRO_DERRAPE;
        v.ang += U.limitar(d, -giro * dt, giro * dt);
        const objetivo = mag * vmax * (Math.abs(d) > 1.3 ? 0.55 : 1);
        if (objetivo > f0) df = Math.min(objetivo - f0, K.ACEL * dt * (v.miniTurbo > 0 ? 2.4 : f0 < 0 ? 2 : 1));
        else df = -Math.min(f0 - objetivo, K.ROCE * 1.4 * dt);
      }
    } else df = -Math.sign(f0) * Math.min(Math.abs(f0), K.ROCE * dt);
    v.giro += (U.limitar(d, -1, 1) - v.giro) * Math.min(1, dt * 8);

    // 2) derrape estilo kart: Correr + girar a buena velocidad; al soltar, mini-turbo
    const quiere = correr && v.enSuelo && f0 > K.VEL_DERRAPE && Math.abs(d) > 0.22 && v.trompo <= 0;
    if (quiere && !v.derrape) {
      v.derrape = true; v.dirDerrape = Math.sign(d) || 1; v.carga = 0;
      v.vz = 170; v.enSuelo = false; // saltito al empezar a derrapar
      Son.derrape();
    }
    if (v.derrape) {
      if (!correr || f0 < K.VEL_DERRAPE * 0.55 || v.trompo > 0) {
        let nivel = 0; for (const n of K.CARGA_NIVELES) if (v.carga >= n) nivel++;
        if (nivel > 0) {
          v.miniTurbo = K.MINITURBO_SEG[nivel - 1]; Son.turbo(nivel);
          Pa && Pa.chispas(v.x - v.dir * 50, v.y, v.z + 20, 10 + nivel * 4, colorCarga(nivel));
          if (nivel >= 2 && Pa) Pa.texto(v.x, v.y, v.z + 140, nivel === 3 ? '¡Súper turbo!' : '¡Turbo!', '#fff6b0', 22);
        }
        v.derrape = false; v.carga = 0;
      } else v.carga += dt;
    }

    // 3) inercia: la velocidad se queda, el kart gira; el agarre come la parte lateral
    c = Math.cos(v.ang); s = Math.sin(v.ang);
    let f = v.vx * c + v.vy * s, l = -v.vx * s + v.vy * c;
    f += df;
    const agarre = v.trompo > 0 ? 1.2 : v.derrape ? K.AGARRE_DERRAPE : v.enSuelo ? K.AGARRE : K.AGARRE * 0.25;
    l *= Math.exp(-agarre * dt);
    if (v.derrape) l += -v.dirDerrape * Math.min(120, f * 0.25) * dt; // se abre hacia afuera de la curva
    v.vx = f * c - l * s; v.vy = f * s + l * c;
    v.lateral = l;

    // 4) bocina + saltito
    v.tBocina -= dt;
    if (saltar && v.tBocina <= 0) {
      v.tBocina = 0.35; Son.bocina();
      if (v.enSuelo) { v.vz = K.SALTITO; v.enSuelo = false; }
      Pa && Pa.texto(v.x + v.dir * 50, v.y, v.z + 90, '¡Bip bip!', '#ffe0ec', 18);
    }

    v.rueda += (f * dt) / 13;
    Son.motorActualizar(U.limitar(Math.abs(f) / K.VEL_MAX, 0, 1.4), v.miniTurbo > 0);
  }

  function colorCarga(n) { return n >= 3 ? '#ff6fd0' : n === 2 ? '#ffa12e' : '#5ad1ff'; }

  function efectosAuto(v, dt, t) {
    const Pa = P(), K = VEHICULOS.auto; if (!Pa) return;
    const vel = Math.hypot(v.vx, v.vy), es = K.ESCALA * v.escorzo;
    const atrasX = v.x - v.dir * 54 * es, zEsc = v.z + 20 * K.ESCALA;
    // tubo de escape con brillitos
    v.tEscape -= dt;
    if (v.tEscape <= 0) {
      v.tEscape = v.miniTurbo > 0 ? 0.025 : vel > 60 ? 0.05 : 0.22;
      const col = v.miniTurbo > 0 ? ['#ff6fd0', '#ffa12e', '#fff6b0'][Math.random() * 3 | 0] : ['#ffd23f', '#ff9dcb', '#ffffff', '#fff6b0'][Math.random() * 4 | 0];
      Pa.crear({ tipo: 'chispa', x: atrasX + U.azar(-4, 4), y: v.y - 1, z: zEsc + U.azar(-3, 3), vx: -v.dir * U.azar(30, 90) - v.vx * 0.2, vy: U.azar(-10, 10), vz: U.azar(10, 60), vida: U.azar(0.35, 0.7), tam: U.azar(3, v.miniTurbo > 0 ? 9 : 6), color: col });
      if (vel < 60 && Math.random() < 0.5) Pa.crear({ tipo: 'polvo', x: atrasX, y: v.y, z: zEsc, vx: -v.dir * 20, vz: 30, vida: 0.6, tam: 5, color: '255,240,250' });
    }
    // chispas del derrape (azul → naranja → rosa)
    if (v.derrape) {
      let nivel = 0; for (const n of K.CARGA_NIVELES) if (v.carga >= n) nivel++;
      v.tChispa -= dt;
      if (v.tChispa <= 0) {
        v.tChispa = 0.03;
        const col = nivel ? colorCarga(nivel) : '#ffffff';
        for (const k of [-30, 32]) Pa.crear({ tipo: 'chispa', x: v.x + v.dir * k * es + U.azar(-6, 6), y: v.y, z: v.z + 4, vx: U.azar(-60, 60), vz: U.azar(80, 200), g: 700, vida: U.azar(0.2, 0.4), tam: U.azar(3, 6), color: col });
      }
    }
    // humo y marcas al patinar
    const patina = v.enSuelo && (Math.abs(v.lateral) > 110 || v.derrape || v.trompo > 0) && vel > 120;
    v.tHumo -= dt;
    if (patina && v.tHumo <= 0) { v.tHumo = 0.06; Pa.polvo(v.x - v.dir * 30 * es, v.y, 1); }
    if (patina) {
      const c = Math.cos(v.ang), s = Math.sin(v.ang), rx = v.x - c * 30, ry = v.y - s * 15;
      const p = { ax: rx - s * 14, ay: ry + c * 7, bx: rx + s * 14, by: ry - c * 7 };
      if (v._ultMarca) {
        V.marcas.push({ x1: v._ultMarca.ax, y1: v._ultMarca.ay, x2: p.ax, y2: p.ay, vida: 3.5 });
        V.marcas.push({ x1: v._ultMarca.bx, y1: v._ultMarca.by, x2: p.bx, y2: p.by, vida: 3.5 });
        if (V.marcas.length > 260) V.marcas.splice(0, V.marcas.length - 260);
        if (Math.random() < dt * 8) Son.derrape();
      }
      v._ultMarca = p;
    } else v._ultMarca = null;
  }

  // ============================================================
  //  Unicornio mágico (galopa, salta con Espacio, muy ágil)
  // ============================================================
  function montarCaballo(v, dt, ix, iy, correr, saltar, Ju) {
    const K = VEHICULOS.caballo, Pa = P();
    let vmax = correr ? K.VEL_GALOPE : K.VEL_MAX;
    if (Ju && Ju.turbo > 0) vmax *= K.TURBO_COMIDA;
    const ag = v.granSalto ? K.AGIL_AIRE : K.AGIL;
    v.vx += (ix * vmax - v.vx) * Math.min(1, ag * dt);
    v.vy += (iy * vmax - v.vy) * Math.min(1, ag * dt);
    const vel = Math.hypot(v.vx, v.vy);
    if (vel > 30) v.ang += difAng(Math.atan2(v.vy, v.vx), v.ang) * Math.min(1, dt * 14);

    if (saltar) v.buffer = 0.15;
    v.buffer -= dt;
    // galopando hacia el río: salta solo para cruzarlo
    if (v.enSuelo && vel > K.SALTO_ORILLA && M() && !M().salaActiva) {
      const ax = v.x + (v.vx / vel) * 70, ay = v.y + (v.vy / vel) * 60;
      if (M().enAgua(ax, ay, -8) && !M().enPuente(ax, ay)) v.buffer = 0.15;
    }
    // salto grande (sube a colinas/plataformas). Se puede pedir también al bajar de un saltito.
    if (v.buffer > 0 && (v.enSuelo || (!v.granSalto && v.z - (M() ? M().altura(v.x, v.y) : 0) < 14))) {
      v.vz = K.SALTO; v.enSuelo = false; v.granSalto = true; v.buffer = 0; v.rebote = 0.8;
      v.angSalto = vel > 30 ? Math.atan2(v.vy, v.vx) : v.ang;
      if (J.Audio && J.Audio.salto) J.Audio.salto();
      Pa && Pa.chispas(v.x, v.y, v.z + 10, 12, '#fff6b0');
    }
    // galope: las patas avanzan según la distancia recorrida; un "clop" por cada pisada
    if (v.enSuelo && vel > 20) {
      const antes = Math.floor((v.zancada || 0) / PI);
      v.zancada = (v.zancada || 0) + (vel * dt) / 34;
      if (Math.floor(v.zancada / PI) !== antes) {
        v.paso = !v.paso; Son.clop(v.paso);
        Pa && Pa.polvo(v.x - v.dir * 20, v.y, 1);
      }
    }
    v.fase += dt * (2 + vel * 0.02);
  }

  function efectosCaballo(v, dt, t) {
    const Pa = P(), K = VEHICULOS.caballo; if (!Pa) return;
    const vel = Math.hypot(v.vx, v.vy), es = K.ESCALA * v.escorzo;
    v.tChispa -= dt;
    if (vel > 50 && v.tChispa <= 0) {
      v.tChispa = 0.035;
      Pa.crear({ tipo: 'chispa', x: v.x - v.dir * 46 * es + U.azar(-6, 6), y: v.y - 1, z: v.z + U.azar(40, 70) * K.ESCALA, vx: -v.vx * 0.15, vy: 0, vz: U.azar(-10, 25), vida: U.azar(0.5, 0.9), tam: U.azar(4, 8), color: `hsl(${(t * 260 + Math.random() * 60) % 360},100%,74%)` });
    } else if (vel <= 50 && v.tChispa <= 0) {
      v.tChispa = 0.4; // quieto: algún destello mágico
      Pa.crear({ tipo: 'chispa', x: v.x + U.azar(-40, 40), y: v.y, z: v.z + U.azar(30, 110), vz: 20, vida: 0.6, tam: U.azar(3, 6), color: `hsl(${(t * 90) % 360},100%,80%)` });
    }
  }

  // ============================================================
  //  Actualizar (llamar cada fotograma). Devuelve true si controló a Julieth
  //  (en ese caso NO hay que llamar a J.Jul.actualizar).
  // ============================================================
  function sincronizar(v, Ju) {
    Ju.x = v.x; Ju.y = v.y; Ju.z = v.z; Ju.vz = v.vz; Ju.vx = v.vx; Ju.vy = v.vy;
    Ju.enSuelo = v.enSuelo; Ju.dir = v.dir;
    v._jx = Ju.x; v._jy = Ju.y; v._jz = Ju.z; v._jvz = Ju.vz;
  }
  // Si otro módulo tocó a Julieth (hongo-trampolín, caja, teletransporte de depuración), el vehículo lo acompaña
  function adoptarExterno(v, Ju) {
    if (Ju.x !== v._jx || Ju.y !== v._jy) { v.x = Ju.x; v.y = Ju.y; }
    if (Ju.z !== v._jz || Ju.vz !== v._jvz) { v.z = Ju.z; v.vz = Ju.vz; v.enSuelo = false; v.granSalto = Ju.vz > 600 || v.granSalto; }
  }

  // Portales arcoíris también en auto o en caballito: el vehículo cruza con Julieth
  function portales(v, ju) {
    const Mu = M();
    if (!Mu || !Mu.portales || (ju.enfriarPortal || 0) > 0 || v.z >= 30) return;
    for (const p of Mu.portales) {
      if (U.dist(v.x, v.y, p.x, p.y - 4) > 46) continue;
      const d = p.par, Pa = P();
      if (Pa) Pa.chispas(p.x, p.y, 40, 20, p.color);
      if (J.Audio && J.Audio.tunel) J.Audio.tunel();
      const libre = buscarLibre(d.x, d.y + 80, 30) || { x: d.x, y: d.y + 80 };
      v.x = libre.x; v.y = libre.y; v.z = 0; v.vz = 0; v.enSuelo = true;
      v.vx *= 0.4; v.vy *= 0.4; v.derrape = false; v.carga = 0; v.trompo = 0;
      ju.enfriarPortal = 3; ju.invul = Math.max(ju.invul || 0, 1);
      if (Pa) Pa.chispas(v.x, v.y, 40, 22, '#ffffff');
      if (J.Camara) J.Camara.saltarA(v.x, v.y);
      break;
    }
  }

  V.actualizar = function (dt, ju, E) {
    ju = ju || J.Jul; E = E || J.Entrada;
    V.t += dt;
    if (!V.lista.length && !V._iniciado && J.Mundo && J.Mundo.castillos && J.Mundo.castillos.length) V.iniciar(J.Mundo);

    // marcas de derrape se desvanecen
    for (let i = V.marcas.length - 1; i >= 0; i--) { V.marcas[i].vida -= dt; if (V.marcas[i].vida <= 0) V.marcas.splice(i, 1); }

    // pedido de subir/bajar (tecla propia o botón)
    if (V._pedido) { V._pedido = false; if (ju) V.alternar(ju); }

    let v = V._montado;
    // si Julieth cambió de estado por otra regla mientras va montada
    if (v && ju) {
      if (ju.estado === 'celebra') { v.celebra = ju.tEstado || 2; ju.estado = 'montada'; }
      else if (ju.estado !== 'montada') { V._montado = null; if (v.tipo === 'auto') Son.motorParar(); v = null; }
    }

    for (const w of V.lista) {
      w.golpe = Math.max(0, w.golpe - dt); w.rebote = Math.max(0, w.rebote - dt * 3); w.celebra = Math.max(0, w.celebra - dt);
      if (w === v) continue;
      // estacionado o abandonado: frena solo, cae y se acomoda
      const fr = Math.exp(-3.5 * dt); w.vx *= fr; w.vy *= fr;
      if (Math.abs(w.vx) + Math.abs(w.vy) > 2) { const ch = mover(w, dt); if (ch && ch.tipo === 'rio') { w.vx = w.vy = 0; } }
      gravedad(w, dt);
      if (w.tipo === 'auto') { w.rueda += ((w.vx * Math.cos(w.ang) + w.vy * Math.sin(w.ang)) * dt) / 13; w.derrape = false; w.miniTurbo = 0; }
      w.fase += dt * 1.6;
      // vuelve a su parada si quedó abandonado lejos y nadie mira
      if (U.dist(w.x, w.y, w.casa.x, w.casa.y) > 300) {
        w.solo += dt;
        if (w.solo > VEHICULOS.VOLVER_SEG && ju && U.dist(ju.x, ju.y, w.x, w.y) > 1000 && U.dist(ju.x, ju.y, w.casa.x, w.casa.y) > 1000) {
          w.x = w.casa.x; w.y = w.casa.y; w.z = 0; w.vx = w.vy = w.vz = 0; w.ang = w.casa.dir > 0 ? 0 : PI; w.solo = 0;
        }
      } else w.solo = 0;
      actualizarDir(w, dt);
    }

    if (!v || !ju) {
      V._cercano = ju ? V.cercano(ju) : null;
      refrescarBoton();
      return false;
    }

    // ---- Julieth montada: el vehículo manda ----
    adoptarExterno(v, ju);
    const bloqueo = (J.Dialogo && J.Dialogo.abierto) || (J.Mapa && J.Mapa.abierto) || !document.body.classList.contains('jugando');
    const ix = bloqueo ? 0 : E.x || 0, iy = bloqueo ? 0 : E.y || 0, correr = !bloqueo && !!E.correr;
    const saltar = E.consumirSalto ? E.consumirSalto() && !bloqueo : false;

    if (v.tipo === 'auto') conducirAuto(v, dt, ix, iy, correr, saltar, ju);
    else montarCaballo(v, dt, ix, iy, correr, saltar, ju);

    desatascar(v);
    efectoChoque(v, mover(v, dt));
    const impacto = gravedad(v, dt);
    if (impacto > 600 && P()) { P().polvo(v.x, v.y, 6); v.rebote = 1; if (v.tipo === 'caballo') Son.clop(true); }
    peligros(v, dt);
    portales(v, ju);
    actualizarDir(v, dt);
    if (v.tipo === 'auto') efectosAuto(v, dt, V.t); else efectosCaballo(v, dt, V.t);

    // Julieth: relojes que normalmente avanza julieth.js
    ju.invul = Math.max(0, (ju.invul || 0) - dt); ju.turbo = Math.max(0, (ju.turbo || 0) - dt);
    ju.aturdida = 0; ju.resbala = 0; ju.enfriarPortal = Math.max(0, (ju.enfriarPortal || 0) - dt);
    ju.parpadeo = (ju.parpadeo || 0) + dt; ju.fase = (ju.fase || 0) + dt * 3; ju.corriendo = false;
    const k = Math.min(1, Math.hypot(v.vx, v.vy) / 520);
    ju.velTrenza += (k - (ju.velTrenza || 0)) * Math.min(1, dt * 6);
    sincronizar(v, ju);

    V._cercano = null;
    refrescarBoton();
    return true;
  };

  // Hacia dónde mira el dibujo. El auto usa el escorzo original (de frente/espaldas se ve más corto);
  // el unicornio no se estira: se inclina un poco hacia arriba/abajo de la pantalla según el rumbo.
  const INCL_MAX_CABALLO = 0.32;
  function actualizarDir(v, dt) {
    const c = Math.cos(v.ang), s = Math.sin(v.ang) * 0.85;
    if (c > 0.2) v.dir = 1; else if (c < -0.2) v.dir = -1;
    if (v.tipo === 'auto') {
      v.escorzo = 1 - 0.26 * Math.abs(Math.sin(v.ang));
      v.incl = 0;
    } else {
      v.escorzo = 1;
      const obj = Math.hypot(v.vx, v.vy) > 25 ? U.limitar(Math.atan2(s * v.dir, c * v.dir), -INCL_MAX_CABALLO, INCL_MAX_CABALLO) : 0;
      v.incl = (v.incl || 0) + (obj - (v.incl || 0)) * Math.min(1, (dt || 0.016) * 10);
    }
    v.orden = v.y;
  }

  // ============================================================
  //  Dibujo
  // ============================================================
  const TINTA = '#5b2a4e';

  function rueda(g, x, y, r, giro, lejos) {
    const D = J.Dibujo;
    D.circ(g, x, y, r, lejos ? '#1c1420' : '#2b2030');
    D.circ(g, x, y, r * 0.62, lejos ? '#b98a2a' : '#fff6e5');
    g.save(); g.translate(x, y); g.rotate(giro);
    g.fillStyle = lejos ? '#9c6f14' : '#ffc93c'; D.estrella(g, 0, 0, r * 0.55, 5, 0.45); g.fill();
    D.circ(g, 0, 0, r * 0.16, lejos ? '#7a5010' : '#ff5d8f');
    g.restore();
    if (!lejos) { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, r * 0.84, PI * 1.1, PI * 1.5); g.stroke(); }
  }

  function coronita(g, x, y, s, rot) {
    const D = J.Dibujo;
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#d98500'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-10, 3); g.lineTo(-11, -8); g.lineTo(-5, -3); g.lineTo(0, -12); g.lineTo(5, -3); g.lineTo(11, -8); g.lineTo(10, 3); g.closePath(); g.fill(); g.stroke();
    D.circ(g, -11, -9, 2, '#ff5d8f'); D.circ(g, 11, -9, 2, '#ff5d8f'); D.circ(g, 0, -13, 2.3, '#5ad1ff'); D.circ(g, 0, -1, 2, '#ff8fb8');
    g.restore();
  }

  function poseJulieth(v) {
    if (v.celebra > 0) return 'celebra';
    if (v.tipo === 'caballo' && v.granSalto && v.vz > 0) return 'salta';
    return 'quieta';
  }
  function figuraSentada(g, v, t, tx, ty, s) {
    const Ju = J.Jul; if (!Ju || !Ju.figura) return;
    g.save(); g.translate(tx, ty + 21 * s); g.scale(s, s);
    Ju.figura(g, { t, fase: Ju.fase || 0, pose: poseJulieth(v), velTrenza: Ju.velTrenza || 0 });
    g.restore();
  }

  // Kart de perfil (mirando a la derecha) con los pies del piso en (0,0)
  function dibAutoForma(g, v, t, conJ) {
    const D = J.Dibujo, mov = Math.hypot(v.vx, v.vy);
    const temblor = conJ ? Math.sin(t * 60) * Math.min(1, mov / 200 + 0.25) * 0.8 : 0;
    g.save(); g.translate(0, temblor);
    // ruedas del otro lado (asoman detrás)
    rueda(g, -27, -16, 12, v.rueda + 0.4, true); rueda(g, 35, -14, 10, v.rueda + 0.4, true);
    // tubos de escape dorados
    g.fillStyle = '#ffc93c'; g.strokeStyle = '#d98500'; g.lineWidth = 1.5;
    D.redondo(g, -56, -27, 16, 7, 3.5); g.fill(); g.stroke(); D.redondo(g, -54, -19, 13, 6, 3); g.fill(); g.stroke();
    D.circ(g, -56, -23.5, 2.6, '#5b3a10'); D.circ(g, -54, -16, 2.2, '#5b3a10');
    // la Duquesa Giulia Bebé sentada atrás (asoma detrás del respaldo)
    if (J.Giulia) J.Giulia.dibujarPasajera(g, v, t);
    // respaldo del asiento con corona
    g.fillStyle = '#e0467a'; D.redondo(g, -38, -62, 15, 40, 7); g.fill();
    g.fillStyle = '#ff7fae'; D.redondo(g, -36, -60, 7, 34, 4); g.fill();
    coronita(g, -30.5, -64, 0.75, -0.1);
    // Julieth sentada
    if (conJ) figuraSentada(g, v, t, -12, -30, 0.92);
    // carrocería rosa
    g.fillStyle = '#d9386d';
    g.beginPath(); g.moveTo(-48, -10); g.lineTo(-48, -30); g.quadraticCurveTo(-48, -38, -40, -38); g.lineTo(-20, -38);
    g.quadraticCurveTo(-14, -30, 2, -32); g.lineTo(22, -36); g.quadraticCurveTo(40, -32, 52, -20); g.lineTo(54, -10); g.closePath(); g.fill();
    g.fillStyle = '#ff5d8f';
    g.beginPath(); g.moveTo(-46, -12); g.lineTo(-46, -29); g.quadraticCurveTo(-46, -36, -39, -36); g.lineTo(-21, -36);
    g.quadraticCurveTo(-14, -28, 2, -30); g.lineTo(21, -34); g.quadraticCurveTo(38, -30, 50, -19); g.lineTo(51, -12); g.closePath(); g.fill();
    // brillo superior
    g.strokeStyle = '#ffb3cf'; g.lineWidth = 3; g.beginPath(); g.moveTo(-42, -32); g.lineTo(-24, -32); g.moveTo(6, -29); g.lineTo(20, -31.5); g.quadraticCurveTo(32, -29, 42, -22); g.stroke();
    // franja dorada
    g.strokeStyle = '#ffc93c'; g.lineWidth = 4; g.beginPath(); g.moveTo(-46, -21); g.lineTo(50, -16); g.stroke();
    g.strokeStyle = '#fff6b0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-44, -22.4); g.lineTo(48, -17.4); g.stroke();
    // corazón y estrellitas
    g.fillStyle = '#fff'; D.corazon(g, 10, -24, 5.5); g.fill(); g.fillStyle = '#ff8fb8'; D.corazon(g, 10, -24, 3.2); g.fill();
    g.fillStyle = '#fff6b0'; D.estrella(g, -8, -26, 3, 4, 0.4); g.fill(); D.estrella(g, 30, -25, 2.5, 4, 0.4); g.fill();
    // parachoques dorado con faro
    g.fillStyle = '#ffc93c'; g.strokeStyle = '#d98500'; g.lineWidth = 1.5; D.redondo(g, 46, -16, 12, 7, 3.5); g.fill(); g.stroke();
    D.circ(g, 47, -24, 4, '#fff6b0', '#d98500', 1.3);
    if (J.Cielo && J.Cielo.noche > 0.3) { g.fillStyle = 'rgba(255,246,176,0.35)'; g.beginPath(); g.moveTo(50, -26); g.lineTo(110, -40); g.lineTo(110, -6); g.closePath(); g.fill(); }
    // volante (lo sostiene Julieth)
    g.strokeStyle = '#5b2a4e'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(12, -31); g.lineTo(4, -38); g.stroke();
    g.strokeStyle = '#ffc93c'; g.lineWidth = 3; g.beginPath(); g.ellipse(2, -40, 3.4, 8, 0.35, 0, U.TAU); g.stroke();
    // ruedas de este lado
    rueda(g, -27, -14, 14, v.rueda, false); rueda(g, 35, -12, 11.5, v.rueda, false);
    // guardabarros
    g.strokeStyle = '#ffc93c'; g.lineWidth = 3.5; g.beginPath(); g.arc(-27, -14, 17, PI * 1.08, PI * 1.92); g.stroke();
    g.beginPath(); g.arc(35, -12, 14, PI * 1.1, PI * 1.9); g.stroke();
    g.restore();
  }

  // Una pata de unicornio: muslo + caña + casco dorado, desde la cadera (hx, hy) hasta el piso (y ≈ 0).
  // a = ángulo del muslo (+ = hacia adelante), b = flexión de la rodilla/corvejón (+ = el casco se va hacia atrás)
  function pataUnicornio(g, hx, hy, a, b, col, lw, lejos) {
    const D = J.Dibujo, L1 = 21, L2 = 22;
    const kx = hx + Math.sin(a) * L1, ky = hy + Math.cos(a) * L1;
    const a2 = a - b, fx = kx + Math.sin(a2) * L2, fy = ky + Math.cos(a2) * L2;
    g.strokeStyle = col; g.lineCap = 'round';
    g.lineWidth = lw + 2; g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.stroke();
    g.lineWidth = lw; g.beginPath(); g.moveTo(kx, ky); g.lineTo(fx, fy); g.stroke();
    // mechoncito arcoíris sobre el casco y casco dorado
    D.circ(g, fx, fy - 3, lw * 0.55, lejos ? '#c9a4e8' : '#e7c8ff');
    D.elip(g, fx + 1.5, fy + 1, lw * 0.75, lw * 0.5, lejos ? '#c9971f' : '#ffc93c');
  }

  // Pose de las cuatro patas: galope según la zancada, encogidas en el aire, quietas paradas
  function posePatas(v, mov) {
    const z = v.zancada || 0, aire = !v.enSuelo && v.granSalto;
    if (aire) { // salto: delanteras recogidas hacia adelante, traseras estiradas atrás
      const k = U.limitar(v.vz / 600, -1, 1);
      return [[-0.5 - 0.2 * k, 0.3], [-0.65 - 0.2 * k, 0.4], [0.8, 1.5], [0.6, 1.3]];
    }
    if (mov < 0.05) return [[-0.04, 0.05], [0.04, 0.05], [0.03, 0.05], [-0.03, 0.05]];
    const amp = 0.25 + 0.4 * mov, out = [];
    // [trasera lejos, trasera cerca, delantera lejos, delantera cerca] con desfase de galope
    const desf = [0, 0.5, 1.7, 2.2];
    for (let i = 0; i < 4; i++) {
      const ph = z + desf[i], del = i >= 2;
      const a = Math.sin(ph) * amp;
      const lev = Math.max(0, Math.cos(ph)) * (0.4 + 0.9 * mov); // la pata que vuelve se dobla
      out.push([a, del ? lev : -lev * 0.6]);
    }
    return out;
  }

  // Unicornio de perfil (mirando a la derecha) con los cascos en el piso (0,0)
  function dibCaballoForma(g, v, t, conJ) {
    const D = J.Dibujo, mov = Math.min(1, Math.hypot(v.vx, v.vy) / 400);
    const K = VEHICULOS.caballo;
    const z = v.zancada || 0;
    const balanceo = !v.enSuelo && v.granSalto ? -U.limitar(v.vz / K.SALTO, -1, 1) * 0.2 : Math.sin(z * 2) * 0.035 * mov;
    const bote = v.enSuelo ? -Math.abs(Math.sin(z)) * 3.5 * mov : 0; // el lomo sube y baja al galopar
    const ondea = (i) => Math.sin(t * (5 + mov * 9) + i * 0.9) * (2 + mov * 4);
    const patas = posePatas(v, mov);
    g.save(); g.translate(0, bote); g.translate(0, -44); g.rotate(balanceo); g.translate(0, 44);

    // cola arcoíris (detrás)
    const arco = ['#ff5d8f', '#ffa12e', '#ffd23f', '#6fdc6f', '#5ad1ff', '#b07cff'];
    g.lineCap = 'round';
    arco.forEach((col, i) => {
      g.strokeStyle = col; g.lineWidth = 5;
      const y0 = -60 + i * 2.2;
      g.beginPath(); g.moveTo(-34, y0);
      g.quadraticCurveTo(-52 - mov * 10, y0 - 6 + ondea(i), -58 - mov * 16, y0 + 18 + i * 2 + ondea(i + 2) - mov * 10); g.stroke();
    });
    // patas del otro lado (más oscuras, asoman detrás)
    pataUnicornio(g, -20, -44, patas[0][0], patas[0][1], '#e8cfa8', 6, true);
    pataUnicornio(g, 22, -44, patas[2][0], patas[2][1], '#e8cfa8', 6, true);
    // la Duquesa Giulia Bebé en el lomo, detrás de Julieth
    if (J.Giulia) J.Giulia.dibujarPasajera(g, v, t);
    // Julieth sentada en la montura
    if (conJ) figuraSentada(g, v, t, -6, -67, 0.92);
    // patas de este lado
    pataUnicornio(g, -26, -44, patas[1][0], patas[1][1], '#fff3e0', 7, false);
    pataUnicornio(g, 16, -44, patas[3][0], patas[3][1], '#fff3e0', 7, false);
    // cuello
    g.fillStyle = '#fff3e0';
    g.beginPath(); g.moveTo(14, -62); g.quadraticCurveTo(30, -78, 34, -100); g.lineTo(48, -94); g.quadraticCurveTo(40, -74, 34, -50); g.closePath(); g.fill();
    // cuerpo de madera mágica
    D.elip(g, 0, -52, 37, 17, '#fff3e0');
    g.strokeStyle = '#f0d9b5'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-28, -50); g.quadraticCurveTo(0, -44, 26, -52); g.moveTo(-20, -42); g.quadraticCurveTo(4, -38, 22, -44); g.stroke();
    g.fillStyle = '#ffc0d6'; D.corazon(g, -14, -50, 4); g.fill(); D.corazon(g, 12, -46, 3); g.fill();
    // montura rosa con borde dorado
    g.fillStyle = '#ff5d8f'; g.beginPath(); g.moveTo(-22, -64); g.quadraticCurveTo(-4, -58, 14, -64); g.lineTo(12, -44); g.quadraticCurveTo(-4, -38, -20, -44); g.closePath(); g.fill();
    g.strokeStyle = '#ffc93c'; g.lineWidth = 2.2; g.stroke();
    g.fillStyle = '#ffd23f'; D.estrella(g, -4, -50, 4.5, 5, 0.45); g.fill();
    // pierna de Julieth sobre el costado (media rosa + zapatito a lunares) y estribo
    if (conJ) {
      g.strokeStyle = '#f6cfae'; g.lineWidth = 7; g.beginPath(); g.moveTo(-2, -62); g.quadraticCurveTo(8, -52, 4, -40); g.stroke();
      g.strokeStyle = '#ff7fb0'; g.lineWidth = 7.5; g.beginPath(); g.moveTo(5.5, -48); g.lineTo(4, -40); g.stroke();
      D.elip(g, 7, -37, 7, 4.5, '#2b2030'); D.circ(g, 5, -37.5, 1.1, '#fff'); D.circ(g, 9.5, -36, 1.1, '#fff');
      g.strokeStyle = '#ffc93c'; g.lineWidth = 2; g.beginPath(); g.moveTo(1, -44); g.lineTo(1, -34); g.lineTo(12, -34); g.stroke();
    }
    // cabeza
    g.save(); g.translate(44, -98); g.rotate(0.35);
    D.elip(g, 0, 0, 15, 10.5, '#fff3e0');
    D.elip(g, 11, 3, 8.5, 7.5, '#ffd6e0');
    D.circ(g, 15, 2, 1.4, '#c0567a');
    g.strokeStyle = '#c0567a'; g.lineWidth = 1.5; g.beginPath(); g.arc(11, 6, 3.5, 0.3, PI - 0.6); g.stroke();
    g.restore();
    // oreja y cuernito dorado
    g.fillStyle = '#fff3e0'; g.beginPath(); g.moveTo(32, -104); g.lineTo(34, -118); g.lineTo(41, -106); g.closePath(); g.fill();
    g.fillStyle = '#ffb3c9'; g.beginPath(); g.moveTo(34, -106); g.lineTo(35, -114); g.lineTo(39, -107); g.closePath(); g.fill();
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#d98500'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(42, -107); g.lineTo(52, -124); g.lineTo(47, -105); g.closePath(); g.fill(); g.stroke();
    D.circ(g, 52, -125, 1.8 + Math.sin(t * 6) * 0.6, '#fff6b0');
    // ojito con pestañas y cachete
    D.elip(g, 45, -100, 3, 3.8, '#2a1810'); D.circ(g, 46, -101.5, 1.2, '#fff');
    g.strokeStyle = '#2a1810'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(43, -104); g.lineTo(41, -107); g.moveTo(45.5, -104.5); g.lineTo(45, -108); g.stroke();
    D.elip(g, 46, -93, 3.5, 2.2, 'rgba(255,120,150,0.55)');
    // crin arcoíris (mechones que ondean con la velocidad)
    arco.forEach((col, i) => {
      const k = i / (arco.length - 1), x = 36 - k * 20, y = -106 + k * 40;
      g.strokeStyle = col; g.lineWidth = 6;
      g.beginPath(); g.moveTo(x + 4, y); g.quadraticCurveTo(x - 8 - mov * 6, y - 2 + ondea(i), x - 12 - mov * 12, y + 8 + ondea(i + 1)); g.stroke();
    });
    // riendas hasta la mano de Julieth
    if (conJ) { g.strokeStyle = '#ff5d8f'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(52, -91); g.quadraticCurveTo(26, -70, 5, -76); g.stroke(); }
    g.restore();
  }

  function dibVehiculo(ctx, v, t, conJ) {
    const D = J.Dibujo, Mu = M(); if (!D) return;
    const K = cfg(v), suelo = Mu ? Mu.altura(v.x, v.y) : 0, alto = v.z - suelo;
    D.sombra(ctx, v.x, v.y - suelo, Math.max(16, (v.tipo === 'auto' ? 52 : 46) * K.ESCALA - alto * 0.06), 0.26);
    const rb = Math.sin(v.rebote * 14) * v.rebote; // aplaste al subirse o chocar
    ctx.save();
    ctx.translate(v.x, v.y - v.z);
    ctx.rotate(v.incl || 0); // solo el unicornio se inclina (el auto tiene incl = 0)
    ctx.scale(v.dir * K.ESCALA * v.escorzo * (1 + rb * 0.06), K.ESCALA * (1 - rb * 0.08));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (v.tipo === 'auto') {
      // se inclina al subir/bajar por la pantalla y al derrapar
      ctx.rotate((v.derrape ? -0.06 : 0) + (!v.enSuelo ? -0.05 : 0));
      if (v.miniTurbo > 0) { ctx.strokeStyle = `hsla(${(t * 500) % 360},100%,72%,0.7)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(-4, -36, 66, 44, 0, 0, U.TAU); ctx.stroke(); }
      dibAutoForma(ctx, v, t, conJ);
    } else {
      if (conJ && J.Jul && J.Jul.turbo > 0) { ctx.strokeStyle = `hsla(${(t * 300) % 360},100%,75%,0.7)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(4, -70, 62, 62, 0, 0, U.TAU); ctx.stroke(); }
      dibCaballoForma(ctx, v, t, conJ);
    }
    ctx.restore();
  }

  function burbuja(ctx, v, t) {
    const tactil = document.body.classList.contains('tactil');
    const txt = tactil ? '¡Toca Subir!' : 'E  Subir';
    const x = v.x, y = v.y - v.z - (v.tipo === 'auto' ? 120 : 175) + Math.sin(t * 4) * 4;
    ctx.save();
    ctx.font = '900 18px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(txt).width + 26;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = TINTA; ctx.lineWidth = 3;
    J.Dibujo.redondo(ctx, x - w / 2, y - 16, w, 32, 16); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 7, y + 15); ctx.lineTo(x, y + 25); ctx.lineTo(x + 7, y + 15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5d8f'; ctx.fillText(txt, x, y + 1);
    ctx.restore();
  }

  function normalizarVista(v) {
    if (v && v.x0 !== undefined) return v;
    if (v && v.x !== undefined) return { x0: v.x - 1500, x1: v.x + 1500, y0: v.y - 1100, y1: v.y + 1100 };
    return { x0: -Infinity, x1: Infinity, y0: -Infinity, y1: Infinity };
  }
  const enVista = (o, w) => o.x > w.x0 - 160 && o.x < w.x1 + 160 && o.y - o.z > w.y0 - 60 && o.y - o.z < w.y1 + 260;

  // Dibuja un vehículo estacionado (sin Julieth) + la burbuja "Subir" si está cerca
  V.dibujarUno = function (ctx, v, t) {
    t = t === undefined ? V.t : t;
    dibVehiculo(ctx, v, t, false);
    if (v === V._cercano) burbuja(ctx, v, t);
  };
  // Dibuja el vehículo con Julieth montada encima (reemplaza a J.Jul.dibujar mientras va montada)
  V.dibujarConJulieth = function (ctx, v, ju, t) {
    t = t === undefined ? V.t : t;
    v = v || V._montado; if (!v) return false;
    dibVehiculo(ctx, v, t, true);
    return true;
  };
  // Gancho para main.js: en el case 'julieth' → if (!J.Vehiculos.dibujarJulieth(ctx, t)) Ju.dibujar(ctx, t);
  V.dibujarJulieth = function (ctx, t) { return V._montado ? V.dibujarConJulieth(ctx, V._montado, J.Jul, t) : false; };

  // Mete los vehículos estacionados visibles en la lista que main.js ordena por profundidad.
  // Cada entrada es { tipo: 'vehiculo', vehiculo, orden } → dibujar con J.Vehiculos.dibujarUno(ctx, o.vehiculo, t)
  V.agregarVisibles = function (vista, lista) {
    const w = normalizarVista(vista);
    for (const v of V.lista) {
      if (v === V._montado || !enVista(v, w)) continue;
      const e = v._entrada || (v._entrada = { tipo: 'vehiculo', vehiculo: v, orden: v.y });
      e.orden = v.y; lista.push(e);
    }
    return lista;
  };

  // Alternativa sencilla: dibuja todos los estacionados visibles (ordenados entre sí, sin mezclarse con el mundo).
  // El montado NO se dibuja aquí: va con dibujarJulieth en el lugar de Julieth.
  const _tmp = [];
  V.dibujar = function (ctx, vista, t) {
    _tmp.length = 0; V.agregarVisibles(vista, _tmp);
    _tmp.sort((a, b) => a.orden - b.orden);
    for (const e of _tmp) V.dibujarUno(ctx, e.vehiculo, t);
  };

  // Capa del suelo (llamar justo después de D.suelo): paradas y marcas de derrape
  V.dibujarSuelo = function (ctx, vista, t) {
    t = t === undefined ? V.t : t;
    const w = normalizarVista(vista), Mu = M();
    if (Mu && Mu.salaActiva) return;
    ctx.save();
    for (const v of V.lista) {
      const c = v.casa;
      if (c.x < w.x0 - 120 || c.x > w.x1 + 120 || c.y < w.y0 - 60 || c.y > w.y1 + 60) continue;
      ctx.fillStyle = 'rgba(255,246,229,0.45)'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 74, 30, 0, 0, U.TAU); ctx.fill();
      ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 12; ctx.strokeStyle = v.tipo === 'auto' ? 'rgba(255,93,143,0.8)' : 'rgba(176,124,255,0.8)';
      ctx.lineWidth = 3.5; ctx.stroke(); ctx.setLineDash([]);
      coronita(ctx, c.x, c.y + 22, 0.7, 0);
    }
    for (const m of V.marcas) {
      if (m.x2 < w.x0 || m.x2 > w.x1 || m.y2 < w.y0 || m.y2 > w.y1) continue;
      ctx.strokeStyle = `rgba(70,40,60,${Math.min(1, m.vida / 1.5) * 0.22})`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(m.x1, m.y1); ctx.lineTo(m.x2, m.y2); ctx.stroke();
    }
    ctx.restore();
  };

  // Para el minimapa (opcional): [{ tipo, x, y, montado }]
  V.posiciones = () => V.lista.map((v) => ({ tipo: v.tipo, x: v.x, y: v.y, montado: v === V._montado }));
  // Activa/desactiva el manejo propio de las teclas E/F (apagar si entrada.js unifica la acción "montar")
  V.usarTecladoPropio = function (si) { V.tecladoPropio = !!si; };

  J.Vehiculos = V;
})();
