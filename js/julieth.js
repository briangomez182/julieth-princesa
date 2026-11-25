/* La princesa Julieth: movimiento, salto, energía, corazones, siesta y dibujo.
   Diseño tomado de sus fotos: pelo oscuro recogido en moño con moño rosa,
   trenza larga con mechón violeta, tutú rosa, estrella dorada en el pecho,
   cinturón dorado, medias rosas y zapatitos a lunares. */
(function () {
  const U = J.U, C = J.CFG, D = J.Dibujo, P = J.Part, S = J.Audio;
  const PIEL = '#f6cfae', PIEL_S = '#e6b08c', PELO = '#2a1a1c', PELO_L = '#5a3a36', VIOLETA = '#8a4fd6';

  const Ju = {
    x: 2600, y: 1960, z: 0, vx: 0, vy: 0, vz: 0, dir: 1,
    enSuelo: true, corriendo: false, estado: 'normal', tEstado: 0,
    corazones: C.CORAZONES, energia: 100, turbo: 0, invul: 0, aturdida: 0, resbala: 0,
    monedas: 0, coronas: 0, fase: 0, coyote: 0, bufferSalto: 0, tPolvo: 0, tPaso: 0, tChapuzon: 0,
    parpadeo: 0, velTrenza: 0, enfriarPortal: 0, portalDestino: null, cortoSalto: false
  };

  Ju.velocidadMax = function () {
    let v = Ju.corriendo ? C.VEL_CORRER : C.VEL_CAMINAR;
    if (Ju.turbo > 0) v *= 1.32;
    if (Ju.energia < 12) v *= 0.8;
    return v;
  };

  // ---------- Lógica ----------
  Ju.actualizar = function (dt, E) {
    const M = J.Mundo;
    Ju.invul = Math.max(0, Ju.invul - dt);
    Ju.aturdida = Math.max(0, Ju.aturdida - dt);
    Ju.resbala = Math.max(0, Ju.resbala - dt);
    Ju.turbo = Math.max(0, Ju.turbo - dt);
    Ju.enfriarPortal = Math.max(0, Ju.enfriarPortal - dt);
    Ju.tChapuzon = Math.max(0, Ju.tChapuzon - dt);
    Ju.parpadeo += dt;

    // subiendo o bajando una escalera: interior.js la mueve paso a paso
    if (Ju.estado === 'escalera') {
      Ju.vx = Ju.vy = 0; E.consumirSalto();
      if (Ju.poseEscalera === 'camina') Ju.fase += dt * 9;
      return;
    }

    let ix = 0, iy = 0, quiereSaltar = false;

    // red de seguridad: si por algo quedó dentro de un obstáculo, sale al lugar libre más cercano
    if (M.bloqueado(Ju.x, Ju.y, Ju.z)) {
      buscar: for (let r = 12; r < 400; r += 12) for (let a = 0; a < 8; a++) {
        const x = Ju.x + Math.cos(a * 0.785) * r, y = Ju.y + Math.sin(a * 0.785) * r;
        if (!M.bloqueado(x, y, Ju.z)) { Ju.x = x; Ju.y = y; break buscar; }
      }
    }

    if (Ju.estado === 'siesta') {
      Ju.tEstado -= dt; Ju.vx = Ju.vy = 0;
      Ju.tPolvo -= dt;
      if (Ju.tPolvo <= 0) { Ju.tPolvo = 0.55; P.zzz(Ju.x + 16 * Ju.dir, Ju.y, Ju.z + 62); }
      Ju.corazones = Math.min(C.CORAZONES, Math.round((1 - Ju.tEstado / C.SIESTA_SEG) * C.CORAZONES));
      Ju.energia = Math.min(100, Ju.energia + (70 / C.SIESTA_SEG) * dt);
      if (Ju.tEstado <= 0) Ju.despertar();
    } else if (Ju.estado === 'tunel') {
      Ju.tEstado -= dt; Ju.vx = Ju.vy = 0;
      if (Ju.portalDestino && Ju.tEstado <= 0.4) {
        Ju.x = Ju.portalDestino.x; Ju.y = Ju.portalDestino.y + 46; Ju.z = 0; Ju.portalDestino = null;
        P.chispas(Ju.x, Ju.y, 40, 22, '#ffffff'); J.Camara.saltarA(Ju.x, Ju.y);
      }
      if (Ju.tEstado <= 0) { Ju.estado = 'normal'; Ju.invul = Math.max(Ju.invul, 1); }
    } else if (Ju.estado === 'celebra') {
      Ju.tEstado -= dt; Ju.vx *= 0.8; Ju.vy *= 0.8;
      if (Ju.enSuelo && Ju.tEstado > 0.3) { Ju.vz = 430; Ju.enSuelo = false; }
      if (Ju.tEstado <= 0) Ju.estado = 'normal';
    } else if (Ju.estado === 'puerta' || Ju.estado === 'charla') {
      Ju.vx = Ju.vy = 0; // cruzando una puerta o conversando: quieta
    } else {
      if (Ju.aturdida <= 0) { ix = E.x; iy = E.y; }
      quiereSaltar = E.consumirSalto();
    }
    if (Ju.estado !== 'normal') E.consumirSalto();

    // --- Movimiento horizontal ---
    const mag = Math.hypot(ix, iy);
    Ju.corriendo = E.correr && mag > 0.1 && Ju.energia > 0 && Ju.estado === 'normal';
    const vmax = Ju.velocidadMax();
    let ax = Ju.enSuelo ? 13 : 6;
    if (Ju.resbala > 0) ax = 1.2;
    if (Ju.enSuelo && J.Clima) ax *= J.Clima.friccion(); // nieve: el suelo resbala
    if (Ju.estado === 'normal') {
      Ju.vx += (ix * vmax - Ju.vx) * Math.min(1, ax * dt);
      Ju.vy += (iy * vmax * 0.82 - Ju.vy) * Math.min(1, ax * dt);
    }
    if (Math.abs(ix) > 0.15) Ju.dir = ix > 0 ? 1 : -1;

    // empujoncito del viento (solo caminando normal)
    const w = Ju.estado === 'normal' && J.Clima ? J.Clima.viento() : null, wx = w ? w.x : 0, wy = w ? w.y : 0;
    const nx = Ju.x + (Ju.vx + wx) * dt, ny = Ju.y + (Ju.vy + wy) * dt;
    const bx = M.bloqueado(nx, Ju.y, Ju.z) || M.altura(nx, Ju.y) > Ju.z + 16;
    if (!bx) Ju.x = nx; else { if (bx === 'rio' && Math.abs(Ju.vx) > 20) Ju.chapuzon(nx, Ju.y); Ju.vx = 0; }
    const by = M.bloqueado(Ju.x, ny, Ju.z) || M.altura(Ju.x, ny) > Ju.z + 16;
    if (!by) Ju.y = ny; else { if (by === 'rio' && Math.abs(Ju.vy) > 20) Ju.chapuzon(Ju.x, ny); Ju.vy = 0; }

    // --- Salto ---
    if (quiereSaltar) Ju.bufferSalto = 0.13;
    Ju.bufferSalto -= dt; Ju.coyote -= dt;
    if (Ju.bufferSalto > 0 && Ju.coyote > 0 && Ju.estado === 'normal') {
      Ju.vz = C.IMPULSO_SALTO; Ju.enSuelo = false; Ju.coyote = 0; Ju.bufferSalto = 0; Ju.cortoSalto = true;
      S.salto(); P.polvo(Ju.x, Ju.y - Ju.z, 3);
    }
    // salto más bajo si se suelta el botón
    if (Ju.cortoSalto && Ju.vz > 0 && !E.saltoAbajo && Ju.estado === 'normal') Ju.vz -= C.GRAVEDAD * 1.3 * dt;

    // --- Gravedad y suelo ---
    const suelo = M.altura(Ju.x, Ju.y);
    if (!Ju.enSuelo || Ju.z > suelo + 0.5) {
      Ju.vz -= C.GRAVEDAD * dt; Ju.z += Ju.vz * dt; Ju.enSuelo = false;
      if (Ju.z <= suelo && Ju.vz <= 0) {
        if (Ju.vz < -500) P.polvo(Ju.x, Ju.y - suelo, 5);
        Ju.z = suelo; Ju.vz = 0; Ju.enSuelo = true; Ju.cortoSalto = false;
      }
    } else { Ju.z = suelo; Ju.vz = 0; }
    if (Ju.enSuelo) Ju.coyote = 0.11;

    // --- Animación, polvo y pasos ---
    const vel = Math.hypot(Ju.vx, Ju.vy);
    Ju.fase += dt * (4 + vel * 0.045);
    Ju.velTrenza += (Math.min(1, vel / C.VEL_CORRER) - Ju.velTrenza) * Math.min(1, dt * 6);
    if (Ju.enSuelo && vel > 60 && Ju.estado === 'normal') {
      Ju.tPaso -= dt * (vel / 200);
      if (Ju.tPaso <= 0) { Ju.tPaso = 0.3; S.paso(); }
      if (Ju.corriendo || Ju.turbo > 0) {
        Ju.tPolvo -= dt;
        if (Ju.tPolvo <= 0) {
          Ju.tPolvo = 0.055;
          P.polvo(Ju.x - Ju.dir * 10, Ju.y - Ju.z, 1);
          if (Math.random() < 0.6) P.crear({ tipo: 'chispa', x: Ju.x - Ju.dir * 14 + U.azar(-8, 8), y: Ju.y, z: Ju.z + U.azar(8, 50), vz: U.azar(10, 50), vida: 0.5, tam: U.azar(4, 8), color: Ju.turbo > 0 ? ['#ff9dcb', '#ffe873', '#7fc8ff', '#b79aff'][Math.random() * 4 | 0] : '#fff6b0' });
        }
      }
    }

    // --- Energía ---
    if (Ju.estado === 'normal') {
      const gasto = vel < 30 ? C.GASTO_QUIETA : Ju.corriendo ? C.GASTO_CORRER : C.GASTO_CAMINAR;
      Ju.energia = Math.max(0, Ju.energia - gasto * dt);
      if ((Ju.corazones <= 0 || Ju.energia <= 0) && Ju.enSuelo && Ju.aturdida <= 0) Ju.dormir();
    }
  };

  Ju.chapuzon = function (x, y) {
    if (Ju.tChapuzon > 0) return;
    Ju.tChapuzon = 0.6; P.gotas(x, y, 9); S.chapuzon();
  };

  // Daño amigable: saltito de sorpresa, suelta monedas, parpadea 3 s. Nunca hay Game Over.
  Ju.herir = function (ox, oy, resbalon) {
    if (Ju.invul > 0 || Ju.estado !== 'normal') return false;
    Ju.corazones = Math.max(0, Ju.corazones - 1);
    Ju.invul = C.INVULNERABLE_SEG; Ju.aturdida = 0.4;
    const a = Math.atan2(Ju.y - oy, Ju.x - ox) || 0;
    if (resbalon) {
      Ju.resbala = 1.1; const v = Math.max(260, Math.hypot(Ju.vx, Ju.vy) * 1.25), d = Math.atan2(Ju.vy, Ju.vx || Ju.dir);
      Ju.vx = Math.cos(d) * v; Ju.vy = Math.sin(d) * v * 0.82; Ju.vz = 300; S.resbalon();
    } else { Ju.vx = Math.cos(a) * 230; Ju.vy = Math.sin(a) * 190; Ju.vz = 440; S.auch(); }
    Ju.enSuelo = false; Ju.cortoSalto = false;
    P.chispas(Ju.x, Ju.y, Ju.z + 50, 8, '#ffffff');
    P.texto(Ju.x, Ju.y, Ju.z + 110, resbalon ? '¡Uy, resbalé!' : '¡Ay!', '#ffe0ec', 22);
    // suelta un par de monedas que se pueden volver a recoger
    const n = Math.min(2, Ju.monedas);
    Ju.monedas -= n;
    for (let i = 0; i < n; i++) {
      const b = a + (i ? 0.9 : -0.9);
      J.Mundo.crearItem('moneda', Ju.x, Ju.y, 40, { z: Ju.z + 40, vx: Math.cos(b) * 150, vy: Math.sin(b) * 110, vz: 520, temporal: 9, espera: 0.7, suelta: true });
    }
    J.HUD.sacudir('corazones');
    return true;
  };

  Ju.dormir = function () {
    Ju.estado = 'siesta'; Ju.tEstado = C.SIESTA_SEG; Ju.tPolvo = 0.2; Ju.invul = C.SIESTA_SEG + 2;
    S.siesta(); J.HUD.aviso('Julieth toma una siestita… 💤', 3.2);
  };
  Ju.despertar = function () {
    Ju.estado = 'normal'; Ju.corazones = C.CORAZONES; Ju.energia = Math.max(Ju.energia, 70);
    Ju.vz = 380; Ju.enSuelo = false; Ju.invul = 2;
    S.despertar(); P.corazones(Ju.x, Ju.y, Ju.z + 60, 6);
    P.texto(Ju.x, Ju.y, Ju.z + 120, '¡A jugar!', '#fff6b0', 26);
  };
  Ju.celebrar = function (seg) {
    if (Ju.estado === 'siesta' || Ju.estado === 'tunel') return;
    Ju.estado = 'celebra'; Ju.tEstado = seg || 2.2; S.fiesta();
    P.confeti(Ju.x, Ju.y, Ju.z + 50, 46);
  };
  Ju.comer = function (clase) {
    const c = C.COMIDA[clase];
    Ju.energia = Math.min(100, Ju.energia + c.energia);
    Ju.turbo = Math.max(Ju.turbo, c.turbo);
    J.HUD.sacudir('energia');
  };
  Ju.entrarPortal = function (portal) {
    Ju.estado = 'tunel'; Ju.tEstado = 0.85; Ju.portalDestino = portal.par; Ju.enfriarPortal = 3;
    Ju.x = portal.x; Ju.y = portal.y + 2; S.tunel(); P.chispas(portal.x, portal.y, 40, 20, portal.color);
  };

  // ---------- Dibujo ----------
  function pierna(g, hx, ang, encoge) {
    const L = 19 * (1 - encoge * 0.45), fx = hx + Math.sin(ang) * L, fy = -20 + Math.cos(ang) * L;
    g.strokeStyle = PIEL; g.lineWidth = 7; g.beginPath(); g.moveTo(hx, -21); g.lineTo(fx, fy); g.stroke();
    g.strokeStyle = '#ff7fb0'; g.lineWidth = 7.5; g.beginPath(); g.moveTo(hx + (fx - hx) * 0.72, -21 + (fy + 21) * 0.72); g.lineTo(fx, fy); g.stroke();
    // zapatito a lunares
    g.save(); g.translate(fx, fy); g.rotate(-ang * 0.6);
    D.elip(g, 3.5, 1.5, 8.5, 5, '#2b2030'); D.circ(g, 1, 0.5, 1.2, '#fff'); D.circ(g, 6, 2.2, 1.2, '#fff'); D.circ(g, 5.5, -1.2, 1.1, '#fff');
    g.restore();
  }
  function brazo(g, sx, ang, color, largo) {
    largo = largo || 16;
    const hx = sx + Math.sin(ang) * largo, hy = -41 + Math.cos(ang) * largo;
    g.strokeStyle = color; g.lineWidth = 6; g.beginPath(); g.moveTo(sx, -41); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = '#ff9dc0'; g.lineWidth = 7.5; g.beginPath(); g.moveTo(sx, -41); g.lineTo(sx + Math.sin(ang) * 6, -41 + Math.cos(ang) * 6); g.stroke();
    D.circ(g, hx, hy, 3.6, color);
  }

  // Dibuja a Julieth con los pies en (0,0) mirando a la derecha
  Ju.figura = function (g, o) {
    const t = o.t, f = o.fase, sen = Math.sin(f), pose = o.pose;
    let rebote = 0, inclina = 0, pA = 0, pB = 0, bA = 0.25, bB = -0.25, encoge = 0, falda = 0, trenza = 0.2 + Math.sin(t * 1.8) * 0.06;
    let ojos = 'abiertos', boca = 'sonrisa', sentada = false, arriba = false;

    if (pose === 'camina') { pA = sen * 0.55; pB = -sen * 0.55; bA = -sen * 0.6; bB = sen * 0.6; rebote = Math.abs(Math.cos(f)) * 2.5; }
    else if (pose === 'corre') { pA = sen * 0.95; pB = -sen * 0.95; bA = -sen * 1.1 - 0.3; bB = sen * 1.1 - 0.3; rebote = Math.abs(Math.cos(f)) * 4; inclina = 0.16; boca = 'feliz'; }
    else if (pose === 'salta') { pA = 0.5; pB = -0.35; bA = 2.35; bB = -2.35; arriba = true; encoge = 0.45; falda = 4; boca = 'feliz'; }
    else if (pose === 'cae') { pA = 0.25; pB = -0.25; bA = 1.95; bB = -1.95; arriba = true; falda = 6; boca = 'feliz'; }
    else if (pose === 'celebra') { bA = 2.45 + Math.sin(t * 14) * 0.3; bB = -2.45 - Math.sin(t * 14) * 0.3; arriba = true; pA = 0.3; pB = -0.3; encoge = 0.3; falda = 4; boca = 'feliz'; ojos = 'felices'; }
    else if (pose === 'auch') { bA = 2.0; bB = -2.0; arriba = true; pA = 0.6; pB = -0.6; encoge = 0.3; ojos = 'sorpresa'; boca = 'o'; falda = 4; }
    else if (pose === 'siesta') { sentada = true; ojos = 'cerrados'; boca = 'chica'; bA = 0.5; bB = 0.2; trenza = 0.1; }
    else { rebote = Math.sin(t * 2.4) * 1.2 + 1.2; bA = 0.22 + Math.sin(t * 2.4) * 0.05; bB = -0.22 - Math.sin(t * 2.4) * 0.05; }
    trenza += o.velTrenza * 0.95 + (pose === 'cae' ? -0.5 : 0) + (pose === 'salta' ? 0.3 : 0);
    if (!sentada && (t + 1.3) % 3.6 < 0.13 && ojos === 'abiertos') ojos = 'cerrados';

    g.save();
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (sentada) { g.translate(0, 16); }
    g.translate(0, -rebote); g.rotate(inclina);

    // trenza larga (detrás) con mechón violeta
    {
      let bx = -14, by = -66, a = trenza;
      for (let i = 0; i < 8; i++) {
        const r = 6.6 - i * 0.48;
        D.elip(g, bx, by, r, r * 0.85, i % 2 ? VIOLETA : PELO);
        a += o.velTrenza * 0.09 + Math.sin(t * 3 + i * 0.6) * 0.03;
        bx -= Math.sin(a) * 6.6; by += Math.cos(a) * 6.6;
      }
      g.fillStyle = '#ff5d8f'; g.beginPath(); g.moveTo(bx, by - 2); g.lineTo(bx - 6, by - 6); g.lineTo(bx - 6, by + 3); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(bx, by - 2); g.lineTo(bx + 6, by - 6); g.lineTo(bx + 6, by + 3); g.closePath(); g.fill();
    }
    // pelo de atrás
    D.circ(g, -2, -62, 20.5, PELO);

    if (!arriba) brazo(g, -7, bB, PIEL_S); // brazo de atrás

    // piernas
    if (sentada) {
      g.strokeStyle = PIEL; g.lineWidth = 7; g.beginPath(); g.moveTo(-3, -21); g.lineTo(18, -19); g.moveTo(3, -19); g.lineTo(22, -15); g.stroke();
      g.strokeStyle = '#ff7fb0'; g.lineWidth = 7.5; g.beginPath(); g.moveTo(13, -19.5); g.lineTo(18, -19); g.moveTo(17, -16); g.lineTo(22, -15); g.stroke();
      D.elip(g, 22, -21, 5, 7.5, '#2b2030'); D.elip(g, 26, -17, 5, 7.5, '#2b2030'); D.circ(g, 22, -23, 1.2, '#fff'); D.circ(g, 26, -18, 1.2, '#fff');
    } else { pierna(g, -4, pB, encoge); pierna(g, 4, pA, encoge); }

    // tutú en capas
    const fr = 22.5 + falda;
    g.fillStyle = '#ff9dbb';
    for (let i = 0; i < 7; i++) { const a = Math.PI * (i / 6); D.circ(g, Math.cos(a) * (fr - 3), -19 + Math.sin(a) * 6 - falda * 0.5, 7, '#ff9dbb'); }
    D.elip(g, 0, -21 - falda * 0.4, fr, 9.5, '#ffb3c9');
    for (let i = 0; i < 6; i++) { const a = Math.PI * ((i + 0.5) / 6); D.circ(g, Math.cos(a) * (fr - 7), -22 + Math.sin(a) * 5 - falda * 0.5, 5.5, '#ffd3df'); }
    D.elip(g, 0, -24 - falda * 0.4, fr - 5, 6.5, '#ffe3ea');
    g.fillStyle = '#fff'; [[-13, -19], [10, -17], [-2, -15], [17, -21]].forEach((p) => g.fillRect(p[0], p[1] - falda * 0.4, 1.8, 1.8));

    // torso
    g.fillStyle = '#ff7fae'; D.redondo(g, -10.5, -47, 21, 24, 8); g.fill();
    g.fillStyle = '#ff9dc0'; D.redondo(g, -10.5, -47, 12, 24, 7); g.fill();
    g.fillStyle = '#ffc93c'; D.redondo(g, -11.5, -28, 23, 5, 2.5); g.fill();
    g.fillStyle = '#ffd23f'; D.estrella(g, 2, -37, 5.5, 5, 0.5); g.fill(); g.strokeStyle = '#e08a00'; g.lineWidth = 1; g.stroke();

    // cabeza
    const cab = sentada ? 0.22 : 0;
    g.save(); g.translate(1, -48); g.rotate(cab); g.translate(0, -13);
    D.circ(g, 0, 0, 19, PIEL);
    // pelo tirante hacia atrás
    g.fillStyle = PELO; g.beginPath(); g.arc(0, 0, 19.6, Math.PI * 0.98, Math.PI * 1.9); g.quadraticCurveTo(4, -15, -16, -3); g.closePath(); g.fill();
    g.strokeStyle = PELO_L; g.lineWidth = 1.6; g.beginPath(); g.arc(-1, 0, 16, Math.PI * 1.15, Math.PI * 1.6); g.stroke();
    D.circ(g, -17, 2, 3.4, PIEL_S); // orejita
    D.circ(g, -17.5, 5.5, 1.3, '#ffd23f'); // aro
    // moño alto con cinta rosa
    D.circ(g, -6, -22, 9, PELO); D.circ(g, -8, -24, 3, PELO_L);
    g.fillStyle = '#ff5d8f'; g.beginPath(); g.moveTo(-6, -15); g.lineTo(-17, -20); g.lineTo(-15, -9); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-6, -15); g.lineTo(4, -21); g.lineTo(3, -10); g.closePath(); g.fill(); D.circ(g, -6, -15, 3, '#ff8fb0');
    // corona de princesa
    g.save(); g.translate(5, -17); g.rotate(0.16);
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#d98500'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-11, 2); g.lineTo(-12, -9); g.lineTo(-6, -4); g.lineTo(0, -13); g.lineTo(6, -4); g.lineTo(12, -9); g.lineTo(11, 2); g.closePath(); g.fill(); g.stroke();
    D.circ(g, -12, -10, 2, '#ff5d8f'); D.circ(g, 12, -10, 2, '#ff5d8f'); D.circ(g, 0, -14, 2.4, '#ff5d8f'); D.circ(g, 0, -3, 2.2, '#ff8fb8');
    g.fillStyle = '#fff6b0'; g.fillRect(-9, -0.5, 18, 1.6);
    g.restore();
    // carita
    D.elip(g, 0, 8, 4.2, 2.6, 'rgba(255,120,150,0.55)'); D.elip(g, 15, 7, 3.4, 2.4, 'rgba(255,120,150,0.55)');
    if (ojos === 'abiertos' || ojos === 'sorpresa') {
      const k = ojos === 'sorpresa' ? 1.25 : 1;
      D.elip(g, 4, 1, 3.3 * k, 4.4 * k, '#2a1810'); D.elip(g, 13, 1, 3 * k, 4.2 * k, '#2a1810');
      D.circ(g, 5, -0.6, 1.4, '#fff'); D.circ(g, 14, -0.6, 1.3, '#fff');
      g.strokeStyle = '#2a1810'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(1, -2.5); g.lineTo(-1, -4.5); g.moveTo(15.5, -2.5); g.lineTo(17, -4.5); g.stroke();
    } else if (ojos === 'felices') {
      g.strokeStyle = '#2a1810'; g.lineWidth = 2.2; g.beginPath(); g.arc(4, 2, 3.4, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(13, 2, 3.2, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    } else {
      g.strokeStyle = '#2a1810'; g.lineWidth = 2.2; g.beginPath(); g.arc(4, 0, 3.4, 0.15, Math.PI - 0.15); g.stroke(); g.beginPath(); g.arc(13, 0, 3.2, 0.15, Math.PI - 0.15); g.stroke();
    }
    g.strokeStyle = PELO; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0.5, -6.5); g.quadraticCurveTo(4, -8.5, 7.5, -7); g.moveTo(10.5, -7); g.quadraticCurveTo(13.5, -8.5, 16, -6.5); g.stroke();
    if (boca === 'sonrisa') { g.strokeStyle = '#8c2f3f'; g.lineWidth = 2; g.beginPath(); g.arc(8.5, 6.5, 5.5, 0.2, Math.PI - 0.2); g.stroke(); }
    else if (boca === 'feliz') { g.fillStyle = '#8c2f3f'; g.beginPath(); g.arc(8.5, 7, 5.8, 0, Math.PI); g.closePath(); g.fill(); g.fillStyle = '#ff8fa8'; g.beginPath(); g.arc(8.5, 10.5, 3, 0, Math.PI); g.fill(); g.fillStyle = '#fff'; g.fillRect(5, 7, 7, 1.8); }
    else if (boca === 'o') D.elip(g, 9, 9.5, 3, 3.8, '#8c2f3f');
    else { g.strokeStyle = '#8c2f3f'; g.lineWidth = 1.8; g.beginPath(); g.arc(8.5, 8.5, 2.5, 0.2, Math.PI - 0.2); g.stroke(); }
    g.restore();

    if (arriba) { brazo(g, -8, bB, PIEL_S, 23); brazo(g, 9, bA, PIEL, 23); } else brazo(g, 8, bA, PIEL); // brazo de adelante
    g.restore();
  };

  Ju.pose = function () {
    if (Ju.estado === 'escalera') return Ju.poseEscalera || 'quieta';
    if (Ju.estado === 'siesta') return 'siesta';
    if (Ju.estado === 'celebra') return 'celebra';
    if (Ju.aturdida > 0 || Ju.resbala > 0.5) return 'auch';
    if (!Ju.enSuelo) return Ju.vz > 0 ? 'salta' : 'cae';
    const v = Math.hypot(Ju.vx, Ju.vy);
    if (v > 250) return 'corre';
    if (v > 35) return 'camina';
    return 'quieta';
  };

  Ju.dibujar = function (ctx, t) {
    const suelo = J.Mundo.altura(Ju.x, Ju.y), alto = Ju.z - suelo;
    if (Ju.estado === 'escalera') { if (Ju.z >= 0) D.sombra(ctx, Ju.x, Ju.y - Ju.z, 15, 0.22); } // sombra sobre el escalón
    else D.sombra(ctx, Ju.x, Ju.y - suelo, Math.max(9, 21 - alto * 0.05), 0.28);
    if (Ju.invul > 0 && Ju.estado === 'normal' && Math.floor(t * 12) % 2 === 0) ctx.globalAlpha = 0.35;
    let esc = 1.25, giro = 0;
    if (Ju.estado === 'tunel') { const k = Math.abs(Ju.tEstado - 0.4) / 0.45; esc *= U.limitar(k, 0.05, 1); giro = (1 - k) * 9; }
    if (Ju.resbala > 0.5) giro = (1.1 - Ju.resbala) * 10;
    ctx.save(); ctx.translate(Ju.x, Ju.y - Ju.z);
    if (giro) { ctx.translate(0, -40 * esc); ctx.rotate(giro * Ju.dir); ctx.translate(0, 40 * esc); }
    ctx.scale(Ju.dir * esc, esc);
    // aura arcoíris con estrella de energía
    if (Ju.turbo > 0 && Ju.estado === 'normal') {
      ctx.strokeStyle = `hsla(${(t * 300) % 360},100%,75%,0.75)`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, -40, 30 + Math.sin(t * 10) * 2, 48, 0, 0, U.TAU); ctx.stroke();
    }
    Ju.figura(ctx, { t, fase: Ju.fase, pose: Ju.pose(), velTrenza: Ju.velTrenza });
    ctx.restore(); ctx.globalAlpha = 1;
  };

  // Posición de la corona (para su halo de luz nocturno)
  Ju.corona = () => ({ x: Ju.x + 6 * Ju.dir, y: Ju.y - Ju.z - 104 + (Ju.estado === 'siesta' ? 18 : 0) });

  J.Jul = Ju;
})();
