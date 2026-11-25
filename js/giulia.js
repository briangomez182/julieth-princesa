/* La Duquesa Giulia Bebé: acompaña a Julieth a todas partes.
   Repite lo que hizo Julieth con 1 segundo de demora (camina por el mismo
   camino, salta, celebra, duerme la siesta), siempre un par de metros atrás.
   También se sube al auto, al caballito y al bote, sentada detrás de Julieth.
   Si por algo queda lejos (portal, castillo), aparece junto a ella con brillitos. */
(function () {
  const U = J.U, D = J.Dibujo, P = J.Part;

  // ---------- Números ajustables ----------
  const GIULIA = {
    DEMORA: 1.0,        // segundos que tarda en repetir lo que hace Julieth
    DISTANCIA: 105,     // "un par de metros": nunca se acerca más que esto
    LEJOS: 650,         // si queda más lejos que esto, aparece junto a Julieth
    ESCALA: 1.25,       // mismo tamaño de dibujo que Julieth (ella es más bajita)
    SALTO_SEG: 0.38,    // duración del saltito para subir o bajar de un vehículo
    NOMBRE_SEG: 6       // segundos que se ve su nombre al empezar
  };

  // piel un poco más morena que la de Julieth; pelo negro, corto y con rulos
  const PIEL = '#e8b890', PIEL_S = '#d39d74', PELO = '#16100f', PELO_S = '#3b2c2a';
  const VESTIDO = '#c9a2f2', VESTIDO_C = '#e4d0ff', VESTIDO_S = '#a67fd8', CINTA = '#7fe0c4';

  const G = {
    GIULIA,
    x: 0, y: 0, z: 0, vx: 0, vy: 0, dir: 1, fase: 0, pose: 'quieta',
    abordo: null,      // vehículo (o el bote) en el que va sentada
    salto: null,       // { t, x0, y0, z0, hacia: 'vehiculo'|'suelo', destino, tx, ty }
    sala: null, nombre: 0, listo: false,
    tunel: null,       // viaje por un portal junto con Julieth
    corte: -1,         // tras un portal, ignora los recuerdos de antes de cruzarlo
    esc: 1, giro: 0,   // achicarse y girar dentro del portal
    objeto: { tipo: 'giulia', orden: 0 }
  };
  const hist = [];     // recuerdos de Julieth: { t, x, y, alto, vz, dir, pose, montura, sala }
  let reloj = 0;

  const Ju = () => J.Jul;
  const Mu = () => J.Mundo;

  function monturaDe() {
    const Bo = J.Bote, Ve = J.Vehiculos;
    if (Bo && Bo.montado && Bo.montado()) return Bo;
    if (Ve && Ve.montado) return Ve.montado() || null;
    return null;
  }
  const esBote = (o) => o && o === J.Bote;

  // Un lugar libre "un par de metros" detrás de Julieth
  function detras(j) {
    const M = Mu();
    for (let i = 0; i < 9; i++) {
      const a = (j.dir > 0 ? Math.PI : 0) + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.55;
      const x = j.x + Math.cos(a) * GIULIA.DISTANCIA, y = j.y + Math.sin(a) * GIULIA.DISTANCIA * 0.6;
      if (!M.bloqueado(x, y, 0)) return { x, y };
    }
    return { x: j.x, y: j.y };
  }

  function aparecer(texto) {
    const j = Ju(), p = detras(j);
    P.chispas(G.x, G.y, 30, 10, '#e4d0ff');
    G.x = p.x; G.y = p.y; G.z = Mu().altura(p.x, p.y); G.vx = G.vy = 0;
    G.abordo = null; G.salto = null;
    P.chispas(G.x, G.y, 30, 18, '#ffffff');
    if (texto) P.texto(G.x, G.y, 95, texto, '#efe2ff', 20);
  }

  G.soltarGuion = function () {
    if (!G.guion) return;
    G.guion = null; G.corte = reloj; G.z = Mu().altura(G.x, G.y); G.vx = G.vy = 0; G.pose = 'quieta'; G.sala = Mu().salaActiva;
  };

  G.iniciar = function () {
    const j = Ju();
    G.x = j.x - GIULIA.DISTANCIA; G.y = j.y - 8; G.z = 0; G.dir = 1;
    G.sala = Mu().salaActiva; G.nombre = GIULIA.NOMBRE_SEG; G.listo = true;
  };

  function recordar(j, montura) {
    const M = Mu();
    hist.push({
      t: reloj, x: j.x, y: j.y, alto: Math.max(0, j.z - M.altura(j.x, j.y)), vz: j.vz || 0, dir: j.dir,
      pose: montura ? 'sentada' : j.pose(), montura, sala: M.salaActiva
    });
    // se queda solo con lo justo para mirar 1 segundo atrás
    while (hist.length > 2 && hist[1].t <= reloj - GIULIA.DEMORA) hist.shift();
  }

  // ---------- Portales: la succiona junto con Julieth y sale girando del otro lado ----------
  // Va sincronizada con el tiempo de túnel de Julieth (0.85 s; a los 0.45 s cruza al otro portal)
  function viajarPortal(j, dt) {
    const M = Mu();
    if (!G.tunel) {
      G.abordo = null; G.salto = null;
      G.tunel = { x0: G.x, y0: G.y, z0: G.z, px: j.x, py: j.y, dest: null, sale: null };
      P.chispas(G.x, G.y, 30, 10, '#e4d0ff');
    }
    const h = G.tunel;
    if (j.estado !== 'tunel') { // ya salió: queda un par de metros detrás de Julieth
      if (h.dest) { G.x = h.dest.x; G.y = h.dest.y; }
      G.tunel = null; G.corte = reloj; G.esc = 1; G.giro = 0;
      G.z = M.altura(G.x, G.y); G.vx = G.vy = 0; G.pose = 'quieta';
      P.texto(G.x, G.y, 100, '¡Wiii!', '#efe2ff', 20);
      return;
    }
    const te = j.tEstado;
    G.esc = U.limitar(Math.abs(te - 0.4) / 0.45, 0.05, 1);
    G.giro = (1 - G.esc) * 9;
    G.pose = 'auch';
    G.fase += dt * 8;
    if (te > 0.4 || j.portalDestino) {
      // succionada hacia el portal, achicándose y girando
      const k = U.limitar((0.85 - te) / 0.45, 0, 1);
      G.x = h.x0 + (h.px - h.x0) * k; G.y = h.y0 + (h.py - h.y0) * k;
      G.z = h.z0 * (1 - k) + Math.sin(k * Math.PI) * 40;
      if (Math.abs(h.px - h.x0) > 4) G.dir = h.px > h.x0 ? 1 : -1;
    } else {
      // sale girando del otro portal y se acomoda detrás de Julieth
      if (!h.dest) {
        h.sale = { x: j.x, y: j.y - 44 }; h.dest = detras(j);
        P.chispas(h.sale.x, h.sale.y, 40, 18, '#e4d0ff');
      }
      const k = U.limitar((0.4 - te) / 0.4, 0, 1);
      G.x = h.sale.x + (h.dest.x - h.sale.x) * k; G.y = h.sale.y + (h.dest.y - h.sale.y) * k;
      G.z = M.altura(G.x, G.y) + Math.sin(k * Math.PI) * 50;
      G.dir = j.x >= G.x ? 1 : -1;
    }
  }

  // ---------- Lógica ----------
  G.actualizar = function (dt) {
    const j = Ju(), M = Mu();
    if (!G.listo || !j) return;
    reloj += dt;
    G.nombre = Math.max(0, G.nombre - dt);
    recordar(j, monturaDe());

    // subiendo o bajando una escalera del Huerto: interior.js la lleva de la mano
    if (G.guion) {
      const q = G.guion;
      G.sala = M.salaActiva; G.abordo = null; G.salto = null;
      G.vx = (q.x - G.x) / Math.max(dt, 1e-4); G.vy = (q.y - G.y) / Math.max(dt, 1e-4);
      G.x = q.x; G.y = q.y; G.z = q.z; G.dir = q.dir; G.pose = q.pose;
      if (q.pose === 'camina') G.fase += dt * 9;
      return;
    }

    // entró o salió de un castillo: la duquesita la acompaña enseguida
    if (M.salaActiva !== G.sala) { G.sala = M.salaActiva; aparecer(); G.nombre = 2.5; return; }

    // un portal: Giulia entra y sale junto con Julieth
    if (j.estado === 'tunel' || G.tunel) { viajarPortal(j, dt); return; }

    const s = hist[0].t <= reloj - GIULIA.DEMORA ? hist[0] : null;
    if (!s) return; // todavía no pasó el primer segundo
    G.fase += dt * (4 + Math.hypot(G.vx, G.vy) * 0.05);

    // ----- saltito para subir o bajar -----
    if (G.salto) {
      const h = G.salto; h.t += dt;
      const k = Math.min(1, h.t / GIULIA.SALTO_SEG);
      const dx = h.hacia === 'vehiculo' ? h.destino.x : h.tx, dy = h.hacia === 'vehiculo' ? h.destino.y : h.ty;
      G.x = U.lerp ? U.lerp(h.x0, dx, k) : h.x0 + (dx - h.x0) * k;
      G.y = h.y0 + (dy - h.y0) * k;
      G.z = h.z0 * (1 - k) + Math.sin(k * Math.PI) * 70;
      if (Math.abs(dx - h.x0) > 4) G.dir = dx > h.x0 ? 1 : -1;
      G.pose = k < 0.5 ? 'salta' : 'cae';
      if (k >= 1) {
        G.salto = null;
        if (h.hacia === 'vehiculo') { G.abordo = h.destino; P.texto(G.x, G.y, 110, '¡Yupi!', '#efe2ff', 20); }
        else { G.z = M.altura(G.x, G.y); P.polvo(G.x, G.y - G.z, 3); }
      }
      return;
    }

    // ----- ¿va a bordo? (1 segundo después que Julieth) -----
    const viejo = s.t < G.corte; // recuerdo de antes de cruzar un portal: no sirve
    const quiere = viejo ? null : s.montura;
    if (G.abordo && quiere !== G.abordo) {
      // bajarse: salta desde el asiento a donde bajó Julieth
      const desde = G.abordo, z0 = esBote(desde) ? 10 : (desde.z || 0) + 30;
      let tx = s.x, ty = s.y;
      if (M.bloqueado(tx, ty, 0) || quiere) { const p = detras(j); tx = p.x; ty = p.y; }
      G.abordo = null;
      G.salto = { t: 0, x0: desde.x, y0: desde.y, z0, hacia: 'suelo', tx, ty };
      return;
    }
    if (!G.abordo && quiere) {
      G.salto = { t: 0, x0: G.x, y0: G.y, z0: G.z, hacia: 'vehiculo', destino: quiere };
      return;
    }
    if (G.abordo) {
      G.x = G.abordo.x; G.y = G.abordo.y; G.z = G.abordo.z || 0; G.dir = G.abordo.dir || 1;
      G.vx = G.abordo.vx || 0; G.vy = G.abordo.vy || 0; G.pose = s.pose;
      return;
    }

    // ----- caminando: repite el camino de Julieth un par de metros atrás -----
    let tx = s.x, ty = s.y;
    const dJ = U.dist(G.x, G.y, j.x, j.y);
    if (dJ > GIULIA.LEJOS && !monturaDe()) { aparecer('¡Espérame!'); return; }
    if (viejo) { tx = G.x; ty = G.y; } // recién salida del portal: se queda detrás de Julieth
    else if (s.sala !== M.salaActiva || U.dist(tx, ty, j.x, j.y) > GIULIA.LEJOS) { const p = detras(j); tx = p.x; ty = p.y; }
    const dT = U.dist(tx, ty, j.x, j.y);
    if (dT < GIULIA.DISTANCIA) {
      // nunca se le pega: se queda a su distancia, del lado donde ya está
      let ax = G.x - j.x, ay = G.y - j.y, l = Math.hypot(ax, ay);
      if (l < 1) { ax = -j.dir; ay = 0; l = 1; }
      const cx = j.x + (ax / l) * GIULIA.DISTANCIA, cy = j.y + (ay / l) * GIULIA.DISTANCIA;
      if (!M.bloqueado(cx, cy, 0)) { tx = cx; ty = cy; }
      else if (dJ < GIULIA.DISTANCIA) { tx = G.x; ty = G.y; }
      else { tx = G.x + (tx - G.x) * (1 - GIULIA.DISTANCIA / Math.max(GIULIA.DISTANCIA, dJ)); ty = G.y + (ty - G.y) * (1 - GIULIA.DISTANCIA / Math.max(GIULIA.DISTANCIA, dJ)); }
    }
    // no se mete en el agua ni en los árboles (espera en la orilla)
    if (M.bloqueado(tx, ty, 0) && !M.bloqueado(G.x, G.y, 0)) { tx = G.x; ty = G.y; }
    const k = Math.min(1, dt * 12);
    const nx = G.x + (tx - G.x) * k, ny = G.y + (ty - G.y) * k;
    G.vx = (nx - G.x) / Math.max(dt, 1e-4); G.vy = (ny - G.y) / Math.max(dt, 1e-4);
    G.x = nx; G.y = ny;
    G.z = M.altura(G.x, G.y) + (viejo ? 0 : s.alto);

    const vel = Math.hypot(G.vx, G.vy);
    if (Math.abs(G.vx) > 25) G.dir = G.vx > 0 ? 1 : -1;
    else if (vel < 25) G.dir = j.x >= G.x ? 1 : -1; // quieta: mira a Julieth
    // la pose es la de Julieth hace 1 segundo; caminar o correr según su propio paso
    if (viejo) G.pose = vel > 260 ? 'corre' : vel > 35 ? 'camina' : 'quieta';
    else if (s.alto > 3) G.pose = s.vz > 0 ? 'salta' : 'cae';
    else if (s.pose === 'quieta' || s.pose === 'camina' || s.pose === 'corre' || s.pose === 'sentada') G.pose = vel > 260 ? 'corre' : vel > 35 ? 'camina' : 'quieta';
    else G.pose = s.pose;
  };

  // ---------- Dibujo ----------
  function pierna(g, hx, ang) {
    const L = 11, fx = hx + Math.sin(ang) * L, fy = -14 + Math.cos(ang) * L;
    g.strokeStyle = '#fff4fa'; g.lineWidth = 6; g.beginPath(); g.moveTo(hx, -14); g.lineTo(fx, fy); g.stroke();
    g.save(); g.translate(fx, fy); g.rotate(-ang * 0.6);
    D.elip(g, 2.5, 0.5, 5.5, 3.6, '#9b6ad6'); D.circ(g, 3.5, -0.6, 1.3, '#ffe3f4');
    g.restore();
  }
  function brazo(g, sx, ang, color, largo) {
    const hx = sx + Math.sin(ang) * largo, hy = -34 + Math.cos(ang) * largo;
    g.strokeStyle = color; g.lineWidth = 5; g.beginPath(); g.moveTo(sx, -34); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = VESTIDO_C; g.lineWidth = 6.5; g.beginPath(); g.moveTo(sx, -34); g.lineTo(sx + Math.sin(ang) * 4, -34 + Math.cos(ang) * 4); g.stroke();
    D.circ(g, hx, hy, 3.2, color);
  }

  // Dibuja a Giulia con los pies en (0,0) mirando a la derecha (en 'sentada', (0,0) es el asiento)
  G.figura = function (g, o) {
    const t = o.t, f = o.fase || 0, sen = Math.sin(f), pose = o.pose;
    let rebote = 0, inclina = 0, pA = 0, pB = 0, bA = 0.3, bB = -0.3, arriba = false, sentada = false;
    let ojos = 'abiertos', boca = 'chupete';
    if (pose === 'camina') { pA = sen * 0.6; pB = -sen * 0.6; bA = -sen * 0.7; bB = sen * 0.7; rebote = Math.abs(Math.cos(f)) * 2.5; }
    else if (pose === 'corre') { pA = sen * 1; pB = -sen * 1; bA = -sen * 1.1 - 0.3; bB = sen * 1.1 - 0.3; rebote = Math.abs(Math.cos(f)) * 3.5; inclina = 0.14; boca = 'feliz'; }
    else if (pose === 'salta') { pA = 0.5; pB = -0.35; bA = 2.4; bB = -2.4; arriba = true; boca = 'feliz'; }
    else if (pose === 'cae') { pA = 0.25; pB = -0.25; bA = 2; bB = -2; arriba = true; boca = 'o'; }
    else if (pose === 'celebra') { bA = 2.5 + Math.sin(t * 14) * 0.3; bB = -2.5 - Math.sin(t * 14) * 0.3; arriba = true; boca = 'feliz'; ojos = 'felices'; rebote = Math.abs(Math.sin(t * 7)) * 4; }
    else if (pose === 'auch') { bA = 2; bB = -2; arriba = true; pA = 0.6; pB = -0.6; ojos = 'sorpresa'; boca = 'o'; }
    else if (pose === 'siesta') { sentada = true; ojos = 'cerrados'; bA = 0.6; bB = 0.3; }
    else if (pose === 'sentada') { sentada = true; boca = 'feliz'; bA = 0.9 + Math.sin(t * 5) * 0.35; bB = 0.5; }
    else { rebote = Math.sin(t * 2.6) * 1 + 1; bA = 0.25 + Math.sin(t * 2.6) * 0.06; bB = -0.25; }
    if (!sentada && (t + 0.4) % 3.2 < 0.13 && ojos === 'abiertos') ojos = 'cerrados';

    g.save();
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (sentada) g.translate(0, 12);
    g.translate(0, -rebote); g.rotate(inclina);

    if (!arriba) brazo(g, -5, bB, PIEL_S, 10);

    // piernitas
    if (sentada) {
      g.strokeStyle = '#fff4fa'; g.lineWidth = 6; g.beginPath(); g.moveTo(-2, -14); g.lineTo(11, -13); g.moveTo(3, -13); g.lineTo(14, -10); g.stroke();
      D.elip(g, 13, -14, 3.6, 5, '#9b6ad6'); D.elip(g, 16, -11, 3.6, 5, '#9b6ad6');
    } else { pierna(g, -3.5, pB); pierna(g, 3.5, pA); }

    // vestido de campana lila con volados
    g.fillStyle = VESTIDO;
    g.beginPath(); g.moveTo(-8, -32); g.lineTo(8, -32); g.quadraticCurveTo(13, -22, 16, -13); g.lineTo(-16, -13); g.quadraticCurveTo(-13, -22, -8, -32); g.closePath(); g.fill();
    for (let i = 0; i < 6; i++) D.circ(g, -13.5 + i * 5.4, -13, 3.3, VESTIDO_S);
    g.fillStyle = VESTIDO_C; g.beginPath(); g.moveTo(-3, -31); g.quadraticCurveTo(-7, -22, -9, -15); g.lineTo(-3, -15); g.closePath(); g.fill();
    g.fillStyle = '#fff'; [[-6, -20], [5, -18], [9, -24], [-1, -16]].forEach((p) => D.circ(g, p[0], p[1], 0.9, '#fff'));
    // torso y faja menta con moño
    g.fillStyle = VESTIDO; D.redondo(g, -7.5, -39, 15, 10, 5); g.fill();
    g.fillStyle = CINTA; D.redondo(g, -8.5, -31, 17, 3.6, 1.8); g.fill();
    g.beginPath(); g.moveTo(-8, -29.5); g.lineTo(-14, -34); g.lineTo(-14, -25); g.closePath(); g.fill();
    // medallón de duquesa
    D.circ(g, 1.5, -35, 2.4, '#ffd23f', '#d98500', 0.8);

    // cabeza grande de bebé
    g.save(); g.translate(1, -51); if (sentada && ojos === 'cerrados') g.rotate(0.25);
    // rulos de atrás (pelo corto: llegan apenas a la nuca)
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI * (0.62 + i * 0.12);
      D.circ(g, Math.cos(a) * 13, Math.sin(a) * 13, 5.4 - (i === 0 ? 1.4 : 0), PELO);
    }
    D.circ(g, 0, 0, 15, PIEL);
    // casquete de pelo negro con rulitos arriba y flequillo enrulado
    g.fillStyle = PELO; g.beginPath(); g.arc(0, 0, 15.5, Math.PI * 0.95, Math.PI * 1.85); g.quadraticCurveTo(3, -10, -13, -1); g.closePath(); g.fill();
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI * (1.0 + i * 0.13), r = i === 6 ? 3.2 : 4.4;
      const cx = Math.cos(a) * 14, cy = Math.sin(a) * 14;
      D.circ(g, cx, cy, r, PELO);
      g.strokeStyle = PELO_S; g.lineWidth = 1.1; g.beginPath(); g.arc(cx, cy, r * 0.5, a, a + Math.PI * 1.3); g.stroke(); // brillo del rulo
    }
    D.circ(g, 9, -10, 3.3, PELO); // rulito del flequillo
    g.strokeStyle = PELO_S; g.lineWidth = 1; g.beginPath(); g.arc(9, -10, 1.6, 0, Math.PI * 1.3); g.stroke();
    // broche menta en los rulos
    g.fillStyle = CINTA; g.beginPath(); g.moveTo(-10, -8); g.lineTo(-15, -12); g.lineTo(-15, -4); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-10, -8); g.lineTo(-5, -12); g.lineTo(-5, -4); g.closePath(); g.fill(); D.circ(g, -10, -8, 1.6, '#c8f5e6');
    D.circ(g, -13, 2, 2.8, PIEL_S); // orejita
    // tiara de duquesa (plateada con gema)
    g.save(); g.translate(1, -13.5); g.rotate(0.12);
    g.fillStyle = '#eef3fb'; g.strokeStyle = '#9aa8c0'; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(-8, 2); g.lineTo(-7, -4); g.lineTo(-3.5, -1.5); g.lineTo(0, -7); g.lineTo(3.5, -1.5); g.lineTo(7, -4); g.lineTo(8, 2); g.closePath(); g.fill(); g.stroke();
    D.circ(g, 0, -1, 1.9, '#b07cff'); D.circ(g, -7, -4.5, 1.2, '#7fe0c4'); D.circ(g, 7, -4.5, 1.2, '#7fe0c4');
    g.restore();
    // carita
    D.elip(g, 2, 6, 3.6, 2.4, 'rgba(255,120,150,0.5)'); D.elip(g, 13, 5.5, 3, 2.2, 'rgba(255,120,150,0.5)');
    if (ojos === 'abiertos' || ojos === 'sorpresa') {
      const e = ojos === 'sorpresa' ? 1.2 : 1;
      D.elip(g, 5, 0, 2.8 * e, 3.7 * e, '#2a1810'); D.elip(g, 12, 0, 2.5 * e, 3.5 * e, '#2a1810');
      D.circ(g, 6, -1.4, 1.2, '#fff'); D.circ(g, 12.8, -1.4, 1.1, '#fff');
    } else if (ojos === 'felices') {
      g.strokeStyle = '#2a1810'; g.lineWidth = 2; g.beginPath(); g.arc(5, 1, 2.8, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(12, 1, 2.6, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    } else {
      g.strokeStyle = '#2a1810'; g.lineWidth = 2; g.beginPath(); g.arc(5, -0.5, 2.8, 0.15, Math.PI - 0.15); g.stroke(); g.beginPath(); g.arc(12, -0.5, 2.6, 0.15, Math.PI - 0.15); g.stroke();
    }
    if (boca === 'chupete') {
      D.elip(g, 9.5, 7.5, 3.8, 2.6, '#ff8fc4', '#e0559a', 1); D.circ(g, 9.5, 7.5, 1.3, '#ffd3ea');
    } else if (boca === 'feliz') {
      g.fillStyle = '#8c2f3f'; g.beginPath(); g.arc(9, 6, 3.8, 0, Math.PI); g.closePath(); g.fill();
      g.fillStyle = '#ff8fa8'; g.beginPath(); g.arc(9, 8.2, 2, 0, Math.PI); g.fill();
    } else D.elip(g, 9.5, 7.5, 2.2, 2.8, '#8c2f3f');
    g.restore();

    if (arriba) { brazo(g, -6, bB, PIEL_S, 13); brazo(g, 7, bA, PIEL, 13); } else brazo(g, 6, bA, PIEL, 10);
    g.restore();
  };

  G.dibujar = function (ctx, t) {
    const M = Mu(), suelo = M.altura(G.x, G.y), alto = Math.max(0, G.z - suelo);
    if (G.guion) { if (G.z >= 0) D.sombra(ctx, G.x, G.y - G.z, 11, 0.2); } // en la escalera: sombra sobre el escalón
    else D.sombra(ctx, G.x, G.y - suelo, Math.max(7, 15 - alto * 0.05), 0.24);
    ctx.save(); ctx.translate(G.x, G.y - G.z);
    const esc = GIULIA.ESCALA * G.esc;
    if (G.giro) { ctx.translate(0, -32 * esc); ctx.rotate(G.giro * G.dir); ctx.translate(0, 32 * esc); } // girando en el portal
    ctx.scale(G.dir * esc, esc);
    G.figura(ctx, { t, fase: G.fase, pose: G.pose });
    ctx.restore();
    if (G.nombre > 0) {
      const a = Math.min(1, G.nombre);
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = '900 15px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#5b2a4e'; ctx.fillStyle = '#efe2ff';
      const y = G.y - G.z - 102 + Math.sin(t * 4) * 2;
      ctx.strokeText('Duquesa Giulia Bebé', G.x, y); ctx.fillText('Duquesa Giulia Bebé', G.x, y);
      ctx.restore();
    }
  };

  // Gancho para vehiculos.js y bote.js: dibuja a Giulia sentada detrás de Julieth
  // (en las coordenadas locales del vehículo, que mira a la derecha)
  G.dibujarPasajera = function (g, vehiculo, t) {
    if (!G.listo || G.salto || G.abordo !== vehiculo) return;
    let x, y, s;
    if (esBote(vehiculo)) { x = -43; y = -15; s = GIULIA.ESCALA / vehiculo.BOTE.ESC; }
    else if (vehiculo.tipo === 'caballo') { x = -36; y = -60; s = 0.92; }
    else { x = -47; y = -36; s = 0.92; }
    g.save(); g.translate(x, y); g.scale(s, s);
    G.figura(g, { t, fase: G.fase, pose: G.pose === 'celebra' ? 'celebra' : 'sentada' });
    g.restore();
  };

  // Para el ordenado por profundidad de main.js (cuando no va sentada en un vehículo)
  G.agregarVisibles = function (lista) {
    if (!G.listo || (G.abordo && !G.salto)) return;
    G.objeto.orden = G.y + 0.4; lista.push(G.objeto);
  };

  J.Giulia = G;
})();
