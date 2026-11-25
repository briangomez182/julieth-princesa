/* Generación del mundo abierto: río, lago, caminos, castillos, colinas,
   plataformas, decoración, objetos y peligros. Todo sale de una semilla,
   así el reino es siempre el mismo.

   Consultas públicas útiles (J.Mundo):
     enAgua(x, y, margen)      ¿es agua (río o lago)? margen>0 agranda, <0 achica
     navegable(x, y, radio)    ¿cabe un bote de ese radio entero en el agua?
     enRio / enLago / distRio  consultas sueltas del río y de los lagos
     enPuente(x, y)            puentes y muelles (se caminan por encima del agua)
     enCamino(x, y, margen)    ¿sobre un camino de ladrillos?
     praderaEn(x, y)           pradera abierta (sin obstáculos) en ese punto, o null
     tipoSuelo(x, y)           'agua' | 'puente' | 'camino' | 'patio' | id de zona
     zonaEn(x, y)              'pradera' | 'bosque' | 'cristal' | 'nubes' | 'flores' | 'nieve'
                               | 'luna' | 'volcan' | 'tormenta' | 'mar' | 'desierto'
     bloqueado(x, y, z, rad)   colisión (true, 'rio' o false)
   Datos: lagos, praderasAbiertas, muelles, lugares, flores, caminos, puentes, rio. */
(function () {
  const U = J.U, C = J.CFG;
  const M = {
    objetos: [],      // todo lo que se dibuja ordenado por profundidad
    flores: [], charcos: [], antorchas: [], castillos: [], colinas: [], plataformas: [],
    salas: [], principes: [], espejos: [], salaActiva: null,
    aulas: [], senos: [], escaleras: [], // El Huerto (jardín de infantes): aulas por piso, seños y escaleras
    items: [], cajas: [], hongos: [], portales: [], portalesRio: [], peligros: [],
    zonas: [], caminos: [], puentes: [], rio: [], RIO_ANCHO: 150,
    lagos: [],             // {x, y, rx, ry, nombre}: agua navegable
    praderasAbiertas: [],  // {x, y, rx, ry, nombre}: campo libre de obstáculos (para vehículos)
    muelles: [],           // {x, y (agua junto a la punta), tx, ty (tierra), puente}
    lugares: []            // rótulos para el mapa completo {nombre, x, y}
  };

  const CELDA = 256;
  let rejilla = {};       // sólidos por celda
  let ocupados = [];      // círculos ya usados al repartir cosas

  // ---------- Consultas de terreno ----------
  M.distRio = (x, y) => (x < M.rioCaja.x0 || x > M.rioCaja.x1 ? Infinity : U.distALinea(M.rio, x, y));
  M.enRio = (x, y, margen) => M.distRio(x, y) < M.RIO_ANCHO / 2 + (margen || 0);
  M.enLago = function (x, y, margen) {
    margen = margen || 0;
    for (const l of M.lagos) {
      const dx = (x - l.x) / (l.rx + margen), dy = (y - l.y) / (l.ry + margen);
      if (dx * dx + dy * dy < 1) return l;
    }
    return null;
  };
  M.enAgua = (x, y, margen) => M.enRio(x, y, margen) || !!M.enLago(x, y, margen);
  M.navegable = (x, y, radio) => M.enAgua(x, y, -(radio || 0));
  // Puente = rectángulo girado: centro (x, y), largo L a lo largo de ang, ancho A
  M.enPuente = function (x, y) {
    for (const p of M.puentes) {
      const dx = x - p.x, dy = y - p.y, c = Math.cos(p.ang || 0), s = Math.sin(p.ang || 0);
      if (Math.abs(dx * c + dy * s) < p.L / 2 && Math.abs(-dx * s + dy * c) < p.A / 2) return true;
    }
    return false;
  };
  M.enCamino = (x, y, margen) => distCaminos(x, y) < 44 + (margen || 0);
  M.praderaEn = function (x, y, margen) {
    margen = margen || 0;
    for (const p of M.praderasAbiertas) {
      const dx = (x - p.x) / (p.rx + margen), dy = (y - p.y) / (p.ry + margen);
      if (dx * dx + dy * dy < 1) return p;
    }
    return null;
  };
  M.tipoSuelo = function (x, y) {
    if (M.enPuente(x, y)) return 'puente';
    if (M.enAgua(x, y)) return 'agua';
    if (M.enCamino(x, y)) return 'camino';
    for (const c of M.castillos) {
      const dx = (x - c.patio.x) / 215, dy = (y - c.patio.y) / 135;
      if (dx * dx + dy * dy < 1) return 'patio';
    }
    return M.zonaEn(x, y);
  };

  // Altura del suelo en un punto (colinas redondas y plataformas)
  M.altura = function (x, y) {
    let h = 0;
    for (const c of M.colinas) {
      const dx = (x - c.x) / c.rx, dy = (y - c.y) / c.ry;
      if (dx * dx + dy * dy < 1 && c.cima > h) h = c.cima;
    }
    for (const p of M.plataformas) {
      if (x > p.x0 && x < p.x1 && y > p.y0 && y < p.y1 && p.cima > h) h = p.cima;
    }
    return h;
  };

  // ¿Puede caer aquí un objeto (moneda soltada, fruta de una caja)?
  M.lugarValido = function (x, y) {
    const sa = M.salaActiva;
    if (sa) return x > sa.x0 + 30 && x < sa.x1 - 30 && y > sa.y0 + 30 && y < sa.y1 - 20;
    return !M.enAgua(x, y, 20) && x > 100 && x < C.MUNDO_W - 100 && y > 130 && y < C.MUNDO_H - 90;
  };

  function celdas(x0, y0, x1, y1, f) {
    for (let cx = Math.floor(x0 / CELDA); cx <= Math.floor(x1 / CELDA); cx++)
      for (let cy = Math.floor(y0 / CELDA); cy <= Math.floor(y1 / CELDA); cy++) f(cx + ',' + cy);
  }
  function solidoCirculo(x, y, r, alto) {
    const s = { x, y, r, alto: alto || Infinity };
    celdas(x - r, y - r, x + r, y + r, (k) => (rejilla[k] = rejilla[k] || []).push(s));
    return s;
  }
  function solidoRect(x0, y0, x1, y1, alto) {
    const s = { x0, y0, x1, y1, alto: alto || Infinity };
    celdas(x0, y0, x1, y1, (k) => (rejilla[k] = rejilla[k] || []).push(s));
  }

  // ¿Puede estar Julieth (radio rad, altura z) en este punto?
  M.bloqueado = function (x, y, z, rad) {
    rad = rad || 14;
    const sa = M.salaActiva;
    if (sa) { // dentro de un castillo: las paredes del salón
      if (x < sa.x0 + 24 || x > sa.x1 - 24 || y < sa.y0 + 16 || y > sa.y1 - 8) return true;
    } else {
      if (x < 70 || y < 90 || x > C.MUNDO_W - 70 || y > C.MUNDO_H - 60) return true;
      if (M.enAgua(x, y, -8) && !M.enPuente(x, y)) return 'rio';
    }
    const lista = rejilla[Math.floor(x / CELDA) + ',' + Math.floor(y / CELDA)];
    if (lista) {
      for (const s of lista) {
        if (z >= s.alto - 12) continue;
        if (s.r !== undefined) {
          const dx = x - s.x, dy = y - s.y, rr = s.r + rad;
          if (dx * dx + dy * dy < rr * rr) return true;
        } else if (x > s.x0 - rad && x < s.x1 + rad && y > s.y0 - rad && y < s.y1 + rad) return true;
      }
    }
    return false;
  };

  // ---------- Ayudas para repartir cosas sin encimarlas ----------
  function distCaminos(x, y) {
    let d = Infinity;
    for (let i = 0; i < M.caminos.length; i++) {
      const c = M.caminos[i], b = M.caminosCaja && M.caminosCaja[i];
      if (b && (x < b.x0 - d || x > b.x1 + d || y < b.y0 - d || y > b.y1 + d)) continue;
      d = Math.min(d, U.distALinea(c, x, y));
    }
    return d;
  }
  // Rejilla gruesa para los círculos ocupados (el mundo grande tiene miles)
  const CO = 200;
  let ocupRej = {};
  function libre(x, y, r, o) {
    o = o || {};
    if (x < 150 + r || y < 170 + r || x > C.MUNDO_W - 150 - r || y > C.MUNDO_H - 130 - r) return false;
    if (M.enAgua(x, y, r + 25)) return false;
    if (!o.abierto && M.praderaEn(x, y, r)) return false; // las praderas abiertas quedan despejadas
    if (!o.enCamino && distCaminos(x, y) < r + (o.margenCamino === undefined ? 62 : o.margenCamino)) return false;
    for (const c of M.castillos) {
      if (Math.abs(x - c.x) < 290 + r && y > c.y - 250 - r && y < c.y + 40 + r) return false;
      if (!o.enPatio && U.dist(x, y, c.patio.x, c.patio.y) < 185 + r) return false;
    }
    if (U.dist(x, y, 2600, 1960) < 150 + r) return false; // zona de salida
    const i0 = Math.floor((x - r - 160) / CO), i1 = Math.floor((x + r + 160) / CO);
    const j0 = Math.floor((y - r - 160) / CO), j1 = Math.floor((y + r + 160) / CO);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const L = ocupRej[i + ',' + j]; if (!L) continue;
      for (const q of L) {
        const rr = q.r + r;
        if ((q.x - x) * (q.x - x) + (q.y - y) * (q.y - y) < rr * rr) return false;
      }
    }
    return true;
  }
  // círculos de más de 160 de radio se registran en todas las celdas que tocan
  const ocupar = (x, y, r) => {
    const q = { x, y, r };
    const e = Math.max(0, r - 160);
    for (let i = Math.floor((x - e) / CO); i <= Math.floor((x + e) / CO); i++)
      for (let j = Math.floor((y - e) / CO); j <= Math.floor((y + e) / CO); j++) (ocupRej[i + ',' + j] = ocupRej[i + ',' + j] || []).push(q);
  };

  function repartir(rnd, n, r, o, f) {
    o = o || {};
    const a = o.area || { x0: 0, y0: 0, x1: C.MUNDO_W, y1: C.MUNDO_H };
    let puestos = 0, intentos = 0;
    while (puestos < n && intentos < n * 60) {
      intentos++;
      const x = rnd.rango(a.x0, a.x1), y = rnd.rango(a.y0, a.y1);
      if (o.filtro && !o.filtro(x, y)) continue;
      if (!libre(x, y, r, o)) continue;
      ocupar(x, y, o.reserva === undefined ? r : o.reserva);
      f(x, y, puestos++);
    }
  }

  M.zonaEn = function (x, y) {
    for (const z of M.zonas) {
      const dx = (x - z.x) / z.rx, dy = (y - z.y) / z.ry;
      if (dx * dx + dy * dy < 1) return z.id;
    }
    return 'pradera';
  };

  const obj = (o) => { if (o.orden === undefined) o.orden = o.y; M.objetos.push(o); return o; };

  function item(clase, x, y, zExtra, extra) {
    const base = M.altura(x, y);
    const it = Object.assign({
      tipo: 'item', clase, x, y, z: base + (zExtra === undefined ? 30 : zExtra),
      activa: true, respawn: 0, fase: (x * 0.013 + y * 0.007) % U.TAU
    }, extra || {});
    M.items.push(it);
    return obj(it);
  }
  M.crearItem = item;

  // ---------- Generar todo ----------
  M.generar = function () {
    const rnd = U.semilla(C.SEMILLA);
    const P = (x, y) => ({ x, y });
    const W = C.MUNDO_W, H = C.MUNDO_H;
    rejilla = {}; ocupados = []; ocupRej = {};

    // Zonas temáticas (las tres originales + la pradera de flores, las colinas nevadas y las cinco tierras nuevas)
    M.zonas = [
      { id: 'bosque', x: 720, y: 1180, rx: 880, ry: 860 },
      { id: 'cristal', x: 4480, y: 2960, rx: 640, ry: 620 },
      { id: 'nubes', x: 4300, y: 800, rx: 720, ry: 560 },
      { id: 'nieve', x: 7250, y: 700, rx: 1050, ry: 620 },
      { id: 'flores', x: 6450, y: 2750, rx: 1250, ry: 950 },
      { id: 'luna', x: 9700, y: 900, rx: 850, ry: 600 },
      { id: 'volcan', x: 9700, y: 2650, rx: 900, ry: 700 },
      { id: 'tormenta', x: 9800, y: 6800, rx: 900, ry: 750 },
      { id: 'mar', x: 5200, y: 7100, rx: 1100, ry: 700 },
      { id: 'desierto', x: 1800, y: 7000, rx: 1200, ry: 750 }
    ];
    // tierras nuevas (las que se sumaron al pasar de 8400×6000 a 11000×8000)
    const nuevas = (x, y) => x > 8400 || y > 6000;

    // Praderas abiertas: sin árboles, rocas, colinas ni peligros (ideales para ir rápido)
    M.praderasAbiertas = [
      { id: 'flores', nombre: 'Pradera de las Flores', x: 6450, y: 2750, rx: 1050, ry: 760 },
      { id: 'sur', nombre: 'Llanura del Sur', x: 1700, y: 4950, rx: 1200, ry: 640 },
      { id: 'este', nombre: 'Campo del Este', x: 7550, y: 3950, rx: 600, ry: 430 },
      { id: 'brisa', nombre: 'Prado de la Brisa', x: 9150, y: 4250, rx: 680, ry: 460 }
    ];

    // Río cristalino: baja del norte, cruza el reino, llena el Lago Espejo y sale por el este
    M.rio = U.suavizarLinea([P(1500, -80), P(1380, 600), P(1650, 1300), P(1500, 2000), P(1900, 2700),
      P(3200, 3000), P(3750, 3450), P(3950, 4050), P(4500, 4550), P(5300, 4800), P(5900, 4950),
      P(6600, 5050), P(7300, 5350), P(7900, 5500), P(8700, 5580), P(9500, 5480), P(10300, 5330), P(W + 200, 5280)], 14);
    M.rioCaja = { x0: Math.min(...M.rio.map((p) => p.x)) - 400, x1: Math.max(...M.rio.map((p) => p.x)) + 400 };
    M.lagos = [
      { id: 'espejo', nombre: 'Lago Espejo', x: 5900, y: 4950, rx: 640, ry: 400 },
      { id: 'coral', nombre: 'Bahía Coral', x: 5200, y: 7560, rx: 950, ry: 320 }
    ];

    // Castillos (x,y = centro de la base del muro frontal)
    M.castillos = [
      { id: 'real', nombre: 'Castillo Real', x: 2600, y: 1650 },
      { id: 'bosque', nombre: 'Castillo del Bosque', x: 720, y: 1150 },
      { id: 'cristal', nombre: 'Castillo de Cristal', x: 4480, y: 2900 },
      { id: 'nubes', nombre: 'Castillo de las Nubes', x: 4300, y: 760 },
      { id: 'hielo', nombre: 'Castillo de Hielo', x: 7500, y: 950 },
      { id: 'luna', nombre: 'Castillo de la Luna', x: 9700, y: 900 },
      { id: 'fuego', nombre: 'Castillo del Volcán', x: 9700, y: 2600 },
      { id: 'trueno', nombre: 'Castillo del Trueno', x: 9800, y: 6700 },
      { id: 'mar', nombre: 'Castillo del Mar', x: 5200, y: 6750 },
      { id: 'arena', nombre: 'Castillo de las Dunas', x: 1800, y: 6900 },
      // jardín de infantes rodeado de huerta, entre el río y el camino del sur-este
      { id: 'huerto', nombre: 'El Huerto', x: 7600, y: 6150 }
    ];
    M.castillos.forEach((c, i) => {
      c.tipo = 'castillo'; c.indice = i; c.patio = { x: c.x, y: c.y + 190 }; c.visitado = false; c.enfriar = 0;
      solidoRect(c.x - 235, c.y - 120, c.x + 235, c.y - 6);
      obj(c);
    });

    // Caminos de ladrillos amarillos
    const pat = (id) => M.castillos.find((c) => c.id === id).patio;
    const real = pat('real'), cris = pat('cristal'), nub = pat('nubes'), hie = pat('hielo'), lun = pat('luna');
    const fue = pat('fuego'), tru = pat('trueno'), mar = pat('mar'), are = pat('arena'), hue = pat('huerto');
    M.caminos = [
      [P(real.x, real.y), P(2250, 1620), P(1900, 1310), P(1650, 1300), P(1400, 1300), P(1100, 1380), P(720, 1340)],
      [P(real.x, real.y), P(2590, 2300), P(2550, 2650), P(2550, 2850), P(2550, 3050), P(2420, 3330)],
      [P(real.x, real.y), P(3150, 2080), P(3850, 2560), P(4250, 2960), P(4480, 3090)],
      [P(real.x, real.y), P(3050, 1760), P(3500, 1330), P(3950, 1060), P(4300, 950)],
      [P(real.x, real.y), P(2600, 2000)],
      // nuevos: hacia la pradera de flores y las colinas nevadas
      [P(cris.x, cris.y), P(4560, 3300), P(5050, 3330), P(5700, 2960), P(6450, 2600), P(7100, 2250), P(7550, 1700), P(hie.x, hie.y)],
      [P(nub.x, nub.y), P(4900, 830), P(5700, 760), P(6500, 820), P(6900, 1020), P(7150, 1200), P(hie.x, hie.y)],
      // gran vuelta por el sur: llanura, puente sobre el río y regreso al Castillo de Cristal
      [P(2420, 3330), P(2250, 3800), P(2000, 4350), P(1900, 4900), P(2300, 5350), P(3200, 5450), P(4100, 5330),
        P(4700, 5150), P(4880, 4700), P(5000, 4200), P(5000, 3700), P(5050, 3330)],
      // de la pradera de flores al muelle del Lago Espejo
      [P(6450, 2600), P(6600, 3300), P(6300, 3950), P(5900, 4400)],
      // tierras nuevas: Hielo → Luna → Volcán → Trueno → Mar → Dunas (rodeando los castillos por el costado)
      [P(hie.x, hie.y), P(8000, 1260), P(8700, 1280), P(9250, 1180), P(lun.x, lun.y)],
      [P(lun.x, lun.y), P(9250, 1500), P(9050, 2100), P(9150, 2720), P(fue.x, fue.y)],
      [P(fue.x, fue.y), P(10150, 3200), P(10250, 4200), P(10300, 5300), P(10400, 6200), P(10350, 6880), P(tru.x, tru.y)],
      [P(tru.x, tru.y), P(9000, 7050), P(8000, 7000), P(7000, 6900), P(6100, 6950), P(mar.x, mar.y)],
      [P(mar.x, mar.y), P(4300, 7000), P(3300, 6950), P(2450, 7060), P(are.x, are.y)],
      // de las Dunas a la gran vuelta del sur
      [P(2450, 7060), P(2650, 6450), P(2550, 5850), P(2300, 5350)],
      // de El Huerto al camino Trueno → Mar
      [P(hue.x, hue.y), P(7620, 6600), P(7560, 6960)]
    ].map((c) => U.suavizarLinea(c, 12));
    M.caminosCaja = M.caminos.map((c) => ({
      x0: Math.min(...c.map((p) => p.x)), x1: Math.max(...c.map((p) => p.x)),
      y0: Math.min(...c.map((p) => p.y)), y1: Math.max(...c.map((p) => p.y))
    }));

    // Puentes de madera: uno en cada cruce de camino y río (se calculan solos).
    // Siguen el ángulo exacto del camino y se estiran hasta cubrir toda el agua, aunque el río cruce en diagonal.
    M.puentes = [];
    const ANCHO_PUENTE = 110, ORILLA_PUENTE = 70;
    const puenteDe = (x, y, ang, L, A, extra) => Object.assign({ x, y, ang, L, A, w: L, h: A, vertical: Math.abs(Math.sin(ang)) > 0.7 }, extra);
    M.caminos.forEach((c) => {
      let ini = -1;
      for (let i = 0; i < c.length; i++) {
        const w = M.enRio(c[i].x, c[i].y, 14);
        if (w && ini < 0) ini = i;
        if ((!w || i === c.length - 1) && ini >= 0) {
          const a = c[Math.max(0, ini - 1)], b = c[i];
          const ang = Math.atan2(b.y - a.y, b.x - a.x), ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
          // tramo de agua a lo largo del eje (revisando el centro y los dos bordes del tablero)
          const mx0 = (a.x + b.x) / 2, my0 = (a.y + b.y) / 2;
          let t0 = 0, t1 = 0;
          for (const o of [-ANCHO_PUENTE / 2, 0, ANCHO_PUENTE / 2]) {
            for (let t = -600; t <= 600; t += 4) {
              if (M.enRio(mx0 + ux * t + nx * o, my0 + uy * t + ny * o, 0)) { t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
            }
          }
          const tc = (t0 + t1) / 2, mx = mx0 + ux * tc, my = my0 + uy * tc;
          const L = Math.max(260, t1 - t0 + ORILLA_PUENTE * 2);
          if (!M.puentes.some((q) => U.dist(q.x, q.y, mx, my) < 200)) M.puentes.push(puenteDe(mx, my, ang, L, ANCHO_PUENTE));
          ini = -1;
        }
      }
    });
    M.puentes.forEach((p) => ocupar(p.x, p.y, p.L / 2 + 20));

    // Muelles: pasarelas de madera desde la orilla hacia el agua (para subir a un bote)
    // (ax, ay) = punto en el agua; (dx, dy) = dirección hacia tierra firme
    const muelle = (nombre, ax, ay, dx, dy) => {
      let k = 0;
      while (M.enAgua(ax + dx * k, ay + dy * k) && k < 900) k += 4;
      const bx = ax + dx * k, by = ay + dy * k;         // orilla
      const x0 = ax + dx * 30, y0 = ay + dy * 30;       // punta, ya sobre el agua
      const x1 = bx + dx * 80, y1 = by + dy * 80;       // anclaje en tierra
      const vert = dy !== 0, largo = Math.hypot(x1 - x0, y1 - y0);
      const pu = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, ang: Math.atan2(dy, dx), L: largo, A: 96, w: vert ? 96 : largo, h: vert ? largo : 96, vertical: vert, muelle: true };
      M.puentes.push(pu); ocupar(pu.x, pu.y, largo / 2 + 50);
      M.muelles.push({ nombre, x: ax - dx * 30, y: ay - dy * 30, tx: x1 - dx * 30, ty: y1 - dy * 30, puente: pu });
    };
    // punto del cauce (centro del río) más cercano a (x, y)
    const cauce = (x, y) => M.rio.reduce((m, q) => (U.dist(q.x, q.y, x, y) < U.dist(m.x, m.y, x, y) ? q : m), M.rio[0]);
    const enCauce = (nombre, x, y, dx, dy) => { const q = cauce(x, y); muelle(nombre, q.x, q.y, dx, dy); };
    M.muelles = [];
    muelle('Muelle del Lago Espejo', 5900, 4700, 0, -1);
    enCauce('Muelle del Río', 1520, 2060, 1, 0);
    enCauce('Muelle del Este', 7300, 5340, 0, -1);
    enCauce('Muelle del Sur', 3500, 3260, 0, 1);
    muelle('Muelle de Bahía Coral', 5560, 7420, 0, -1);

    M.lugares = M.praderasAbiertas.map((p) => ({ nombre: p.nombre, x: p.x, y: p.y - p.ry * 0.35 }))
      .concat([{ nombre: 'Colinas Nevadas', x: 6900, y: 400 }, { nombre: 'Lago Espejo', x: 5900, y: 5080 }, { nombre: 'Bosque Encantado', x: 640, y: 700 },
        { nombre: 'Valle de la Luna', x: 9700, y: 380 }, { nombre: 'Montaña de Fuego', x: 9700, y: 2030 },
        { nombre: 'Llanura de la Tormenta', x: 9800, y: 6120 }, { nombre: 'Costa Coral', x: 4250, y: 6650 },
        { nombre: 'Desierto Dorado', x: 1800, y: 6350 }, { nombre: 'Bahía Coral', x: 5200, y: 7640 },
        { nombre: 'Huerta de la Escuela', x: 7600, y: 5700 }]);

    // ---- Portales arcoíris (atajos entre zonas) ----
    [[P(1010, 1560), P(4130, 3250), '#ff6fb5'], [P(2830, 2010), P(2700, 3420), '#5ad1ff'], [P(3900, 1250), P(520, 1600), '#ffd23f'],
      [P(2330, 2120), P(5950, 2350), '#6be07a'], [P(1100, 4300), P(6900, 1500), '#c38bff'],
      // atajos a los castillos lejanos
      [P(2950, 2350), P(9150, 3000), '#ff8a3d'], [P(1900, 2400), P(9200, 6350), '#2ee6c8'], [P(3600, 1900), P(5900, 6550), '#ff4d6d']]
      .forEach((par) => {
        const a = { tipo: 'portal', x: par[0].x, y: par[0].y, color: par[2], par: null };
        const b = { tipo: 'portal', x: par[1].x, y: par[1].y, color: par[2], par: a };
        a.par = b;
        [a, b].forEach((p) => { M.portales.push(p); obj(p); ocupar(p.x, p.y, 90); });
      });

    // ---- Portales del río: uno en cada punta; el bote que entra sale por el otro extremo ----
    M.portalesRio = [];
    {
      const R = M.rio, iN = R.findIndex((q) => q.y >= 260);
      let iE = R.length - 1; while (iE > 0 && R[iE].x > W - 430) iE--;
      const hacia = (i, j) => { const dx = R[j].x - R[i].x, dy = R[j].y - R[i].y, d = Math.hypot(dx, dy) || 1; return { x: dx / d, y: dy / d }; };
      const a = { tipo: 'portal', rio: true, x: R[iN].x, y: R[iN].y, color: '#4fc3ff', adentro: hacia(iN, Math.min(R.length - 1, iN + 3)), par: null };
      const b = { tipo: 'portal', rio: true, x: R[iE].x, y: R[iE].y, color: '#4fc3ff', adentro: hacia(iE, Math.max(0, iE - 3)), par: a };
      a.par = b;
      [a, b].forEach((p) => { M.portalesRio.push(p); obj(p); });
    }

    // ---- Colinas redondas (mesetas de pasto o de nieve) ----
    const colina = (x, y) => {
      const rx = rnd.rango(120, 175), ry = rx * rnd.rango(0.55, 0.68);
      const c1 = { tipo: 'colina', x, y, rx, ry, base: 0, cima: 55, orden: y - ry, zona: M.zonaEn(x, y) };
      M.colinas.push(c1); obj(c1);
      if (rnd() < 0.6) {
        const k = rnd.rango(0.48, 0.6);
        const c2 = { tipo: 'colina', x: x + rnd.rango(-20, 20), y: y - ry * 0.12, rx: rx * k, ry: ry * k, base: 55, cima: 110, zona: c1.zona };
        c2.orden = c2.y - c2.ry; M.colinas.push(c2); obj(c2);
      }
    };
    const enZona = (id) => (x, y) => M.zonaEn(x, y) === id;
    repartir(rnd, 13, 190, { reserva: 150, area: { x0: 0, y0: 0, x1: 5200, y1: 3800 } }, colina);
    repartir(rnd, 9, 190, { reserva: 150, filtro: enZona('nieve') }, colina);
    repartir(rnd, 12, 190, { reserva: 150, filtro: (x, y) => (x > 5200 || y > 3800) && !nuevas(x, y) }, colina);
    repartir(rnd, 14, 190, { reserva: 150, filtro: (x, y) => nuevas(x, y) && M.zonaEn(x, y) !== 'mar' }, colina);

    // ---- Plataformas de ladrillo (escalones) ----
    const plataforma = (x, y) => {
      const p1 = { tipo: 'plataforma', x0: x - 120, y0: y - 45, x1: x, y1: y + 45, base: 0, cima: 55 };
      const p2 = { tipo: 'plataforma', x0: x, y0: y - 45, x1: x + 120, y1: y + 45, base: 0, cima: 110 };
      [p1, p2].forEach((p) => { p.x = (p.x0 + p.x1) / 2; p.y = p.y0; p.orden = p.y0; M.plataformas.push(p); obj(p); });
    };
    repartir(rnd, 18, 170, { reserva: 140, filtro: (x, y) => !nuevas(x, y) }, plataforma);
    repartir(rnd, 12, 170, { reserva: 140, filtro: nuevas }, plataforma);

    // ---- Monedas gigantes ----
    // A lo largo de los caminos
    M.caminos.forEach((c, i) => {
      U.puntosCada(c, C.MONEDAS.cadaCuantoEnCamino, 200 + i * 90).forEach((p) => {
        if (!M.enAgua(p.x, p.y, 30) || M.enPuente(p.x, p.y)) item('moneda', p.x, p.y);
      });
    });
    // En los patios reales (anillo) y jardines con comida
    M.castillos.forEach((c) => {
      const nPatio = C.MONEDAS.porPatio;
      for (let i = 0; i < nPatio; i++) {
        const a = (i / nPatio) * U.TAU + 0.4;
        item('moneda', c.patio.x + Math.cos(a) * 120, c.patio.y + Math.sin(a) * 75);
      }
      const comidas = ['manzana', 'fresa', 'pastel', 'fresa', 'manzana', 'estrella'];
      comidas.forEach((cl, i) => {
        const lado = i % 2 ? 1 : -1;
        const gx = c.x + lado * (300 + (i >> 1) * 62), gy = c.y + 40 + ((i >> 1) % 2) * 50;
        item(cl, gx, gy); ocupar(gx, gy, 40);
      });
    });
    // Sobre colinas y plataformas
    M.colinas.forEach((c, i) => {
      if (c.base === 0) {
        if (i % 2 === 0) item('moneda', c.x - c.rx * 0.55, c.y + c.ry * 0.25);
        item(rnd.elige(['manzana', 'fresa', 'pastel']), c.x, c.y + c.ry * 0.6);
      } else item(rnd() < 0.5 ? 'estrella' : 'moneda', c.x, c.y);
    });
    M.plataformas.forEach((p) => {
      if (p.cima > 60) item('moneda', p.x, (p.y0 + p.y1) / 2); // solo en el escalón alto
    });
    // Hileras de monedas en curva por las praderas abiertas (para recogerlas a toda velocidad)
    M.praderasAbiertas.forEach((pr, k) => {
      const filas = Math.max(2, Math.round((pr.rx * pr.ry) / 160000));
      for (let f = 0; f < filas; f++) {
        const a0 = rnd() * U.TAU, rad = rnd.rango(0.35, 0.75);
        for (let n = 0; n < 7; n++) {
          const a = a0 + n * 0.16;
          const x = pr.x + Math.cos(a) * pr.rx * rad, y = pr.y + Math.sin(a) * pr.ry * rad;
          if (!M.enAgua(x, y, 30) && !M.enCamino(x, y, 10)) { item('moneda', x, y); ocupar(x, y, 36); }
        }
      }
    });

    // ---- Hongos-trampolín con monedas en lo alto ----
    const hongo = (x, y) => {
      const h = { tipo: 'hongo', x, y, aplasta: 0, tinte: rnd.entero(0, 2) };
      M.hongos.push(h); obj(h); solidoCirculo(x, y, 26, 46);
      (M.hongos.length % 2 ? [230] : [190, 270]).forEach((z) => item('moneda', x, y + 1, z));
    };
    repartir(rnd, 30, 70, { filtro: (x, y) => !nuevas(x, y) }, hongo);
    repartir(rnd, 20, 70, { filtro: nuevas }, hongo);

    // ---- Cajas sorpresa doradas flotantes (no estorban: también en las praderas) ----
    const cajas = (x, y, i) => {
      const n = i % 3 === 0 ? 3 : 1;
      for (let k = 0; k < n; k++) {
        const cx = x + (k - (n - 1) / 2) * 52;
        const c = { tipo: 'caja', x: cx, y, z: 122, usos: 3, recarga: 0, golpe: 0 };
        M.cajas.push(c); obj(c);
      }
    };
    repartir(rnd, 50, 60, { margenCamino: 75, abierto: true, filtro: (x, y) => !nuevas(x, y) }, cajas);
    repartir(rnd, 36, 60, { margenCamino: 75, abierto: true, filtro: nuevas }, cajas);

    // ---- Comida por los campos ----
    const clases = ['manzana', 'manzana', 'fresa', 'fresa', 'pastel', 'manzana', 'fresa', 'estrella'];
    const viejas = (x, y) => !nuevas(x, y);
    repartir(rnd, 170, 42, { margenCamino: 40, abierto: true, filtro: viejas }, (x, y, i) => item(clases[i % clases.length], x, y));
    repartir(rnd, 125, 42, { margenCamino: 40, abierto: true, filtro: nuevas }, (x, y, i) => item(clases[i % clases.length], x, y));
    // Monedas sueltas por los campos (las tierras nuevas ocupan ~43% del reino)
    const nSueltas = C.MONEDAS.sueltasEnCampo, nSueltasNuevas = Math.round(nSueltas * 0.43);
    repartir(rnd, nSueltas - nSueltasNuevas, 42, { margenCamino: 40, abierto: true, filtro: viejas }, (x, y) => item('moneda', x, y));
    repartir(rnd, nSueltasNuevas, 42, { margenCamino: 40, abierto: true, filtro: nuevas }, (x, y) => item('moneda', x, y));

    // ---- Peligros cómicos (lejos de caminos, patios y praderas abiertas) ----
    // Densidad de obstáculos (árboles, arbustos, rocas, cactus, zarzas, caracoles): 40% de la original
    const OBST = (n) => Math.round(n * 0.4);
    const lejosPatio = (x, y) => M.castillos.every((c) => U.dist(x, y, c.patio.x, c.patio.y) > 330) && U.dist(x, y, 2600, 1960) > 420;
    // (las tierras nuevas reciben su propia tanda, para que la densidad sea pareja)
    const sinCactus = { nieve: 1, luna: 1, mar: 1 };
    const enViejas = (f) => (x, y) => !nuevas(x, y) && f(x, y), enNuevas = (f) => (x, y) => nuevas(x, y) && f(x, y);
    const cactus = (x, y) => { const p = { tipo: 'cactus', x, y, r: 26, alto: 62, fase: rnd() * 6 }; M.peligros.push(p); obj(p); };
    const zarza = (x, y) => { const p = { tipo: 'zarza', x, y, r: 32, alto: 44, fase: rnd() * 6 }; M.peligros.push(p); obj(p); };
    const caracol = (x, y) => {
      const p = { tipo: 'caracol', x, y, x0: x - 90, x1: x + 90, dir: rnd() < 0.5 ? 1 : -1, r: 24, alto: 40, fase: rnd() * 6, mareado: 0 };
      M.peligros.push(p); obj(p);
    };
    const charco = (x, y) => { const p = { tipo: 'charco', x, y, r: 40, fase: rnd() * 6 }; M.peligros.push(p); M.charcos.push(p); };
    const filCactus = (x, y) => lejosPatio(x, y) && !sinCactus[M.zonaEn(x, y)];
    repartir(rnd, OBST(32), 60, { filtro: enViejas(filCactus), margenCamino: 95 }, cactus);
    repartir(rnd, OBST(14), 60, { filtro: enNuevas(filCactus), margenCamino: 95 }, cactus);
    repartir(rnd, OBST(18), 60, { filtro: (x, y) => lejosPatio(x, y) && M.zonaEn(x, y) === 'desierto', margenCamino: 95 }, cactus);
    repartir(rnd, OBST(32), 60, { filtro: enViejas(lejosPatio), margenCamino: 95 }, zarza);
    repartir(rnd, OBST(24), 60, { filtro: (x, y) => nuevas(x, y) && lejosPatio(x, y) && M.zonaEn(x, y) !== 'desierto', margenCamino: 95 }, zarza);
    repartir(rnd, OBST(36), 110, { filtro: enViejas(lejosPatio), margenCamino: 110, reserva: 60 }, caracol);
    repartir(rnd, OBST(28), 110, { filtro: enNuevas(lejosPatio), margenCamino: 110, reserva: 60 }, caracol);
    repartir(rnd, 28, 70, { filtro: enViejas(lejosPatio), margenCamino: 95 }, charco);
    repartir(rnd, 18, 70, { filtro: (x, y) => nuevas(x, y) && lejosPatio(x, y) && M.zonaEn(x, y) !== 'desierto' && M.zonaEn(x, y) !== 'volcan', margenCamino: 95 }, charco);

    // ---- Antorchas (castillos y bordes de camino) ----
    const antorcha = (x, y) => { const a = { tipo: 'antorcha', x, y, fase: rnd() * 6 }; M.antorchas.push(a); obj(a); solidoCirculo(x, y, 6); ocupar(x, y, 26); };
    M.castillos.forEach((c) => {
      antorcha(c.x - 70, c.y + 14); antorcha(c.x + 70, c.y + 14);
      antorcha(c.patio.x - 190, c.patio.y + 40); antorcha(c.patio.x + 190, c.patio.y + 40);
    });
    M.caminos.forEach((c) => U.puntosCada(c, 520, 300).forEach((p, k) => {
      const s = k % 2 ? 1 : -1, x = p.x + p.nx * 74 * s, y = p.y + p.ny * 74 * s;
      if (libre(x, y, 20, { enCamino: true, abierto: true })) antorcha(x, y);
    }));

    // ---- Decoración: árboles, arbustos con ojos, rocas ----
    const arbol = (x, y, variante) => {
      obj({ tipo: 'arbol', x, y, variante, fase: rnd() * 6, esc: rnd.rango(0.85, 1.2) });
      solidoCirculo(x, y - 4, 13);
    };
    const VARIANTE = {
      bosque: () => (rnd() < 0.7 ? 'pino' : 'redondo'), cristal: () => 'cristal', nubes: () => 'algodon',
      nieve: () => (rnd() < 0.8 ? 'nevado' : 'pino'), flores: () => (rnd() < 0.5 ? 'frutal' : 'redondo'),
      luna: () => 'lunar', volcan: () => 'volcanico', tormenta: () => 'tormenta',
      mar: () => (rnd() < 0.55 ? 'coral' : 'palmera'), desierto: () => 'palmera'
    };
    const varianteEn = (x, y) => { const f = VARIANTE[M.zonaEn(x, y)]; return f ? f() : (rnd() < 0.8 ? 'redondo' : 'frutal'); };
    // cada zona se sortea solo dentro de su rectángulo (si no, en un mundo tan grande casi nunca se acierta)
    const caja = (id) => { const z = M.zonas.find((q) => q.id === id); return { x0: z.x - z.rx, y0: z.y - z.ry, x1: z.x + z.rx, y1: z.y + z.ry }; };
    const enZonaNueva = (id, n, r, reserva, f) => repartir(rnd, n, r, { filtro: enZona(id), area: caja(id), reserva }, f);
    enZonaNueva('bosque', OBST(95), 62, 46, (x, y) => arbol(x, y, varianteEn(x, y)));
    enZonaNueva('cristal', OBST(28), 70, 52, (x, y) => arbol(x, y, 'cristal'));
    enZonaNueva('nubes', OBST(26), 70, 52, (x, y) => arbol(x, y, 'algodon'));
    enZonaNueva('nieve', OBST(70), 66, 50, (x, y) => arbol(x, y, varianteEn(x, y)));
    enZonaNueva('flores', OBST(26), 70, 58, (x, y) => arbol(x, y, varianteEn(x, y)));
    // zonas nuevas
    enZonaNueva('luna', OBST(60), 66, 50, (x, y) => arbol(x, y, 'lunar'));
    enZonaNueva('volcan', OBST(55), 66, 50, (x, y) => arbol(x, y, 'volcanico'));
    enZonaNueva('tormenta', OBST(60), 66, 50, (x, y) => arbol(x, y, 'tormenta'));
    enZonaNueva('mar', OBST(50), 66, 50, (x, y) => arbol(x, y, varianteEn(x, y)));
    enZonaNueva('desierto', OBST(36), 70, 58, (x, y) => arbol(x, y, 'palmera')); // oasis ralos
    const enPradera = enZona('pradera');
    repartir(rnd, OBST(330), 70, { filtro: (x, y) => !nuevas(x, y) && enPradera(x, y), reserva: 58 }, (x, y) => arbol(x, y, varianteEn(x, y)));
    repartir(rnd, OBST(230), 70, { filtro: (x, y) => nuevas(x, y) && enPradera(x, y), reserva: 58 }, (x, y) => arbol(x, y, varianteEn(x, y)));
    // Bosquecillos alrededor de los lagos
    M.lagos.forEach((L) => repartir(rnd, OBST(24), 66, { area: { x0: L.x - L.rx - 500, y0: L.y - L.ry - 400, x1: L.x + L.rx + 500, y1: L.y + L.ry + 400 }, reserva: 50 }, (x, y) => arbol(x, y, varianteEn(x, y))));
    // Borde del mundo: una hilera tupida
    const borde = (x, y, vx, vy) => {
      if (!M.enAgua(x, y, 60)) obj({ tipo: 'arbol', x, y, variante: varianteEn(vx, vy), fase: rnd() * 6, esc: rnd.rango(1, 1.3) });
    };
    for (let x = 40; x < W; x += 88) {
      borde(x + rnd.rango(-14, 14), 78 + rnd.rango(-14, 14), x, 120);
      borde(x + rnd.rango(-14, 14), H - 8 + rnd.rango(-10, 10), x, H - 120);
    }
    for (let y = 130; y < H; y += 82) {
      borde(42 + rnd.rango(-12, 12), y + rnd.rango(-12, 12), 120, y);
      borde(W - 42 + rnd.rango(-12, 12), y + rnd.rango(-12, 12), W - 120, y);
    }

    const arbusto = (x, y) => {
      obj({ tipo: 'arbusto', x, y, fase: rnd() * 6, parpadeo: rnd() * 5, esc: rnd.rango(0.85, 1.2), zona: M.zonaEn(x, y) });
      solidoCirculo(x, y - 4, 20, 40);
    };
    const roca = (x, y) => {
      obj({ tipo: 'roca', x, y, variante: rnd.entero(0, 2), esc: rnd.rango(0.8, 1.25) });
      solidoCirculo(x, y - 3, 17, 30);
    };
    repartir(rnd, OBST(220), 46, { margenCamino: 48, filtro: viejas }, arbusto);
    repartir(rnd, OBST(110), 46, { margenCamino: 48, filtro: nuevas }, arbusto);
    ['luna', 'volcan', 'tormenta', 'mar', 'desierto'].forEach((id) => repartir(rnd, OBST(16), 46, { margenCamino: 48, filtro: enZona(id), area: caja(id) }, arbusto));
    repartir(rnd, OBST(110), 40, { margenCamino: 45, filtro: viejas }, roca);
    repartir(rnd, OBST(90), 40, { margenCamino: 45, filtro: nuevas }, roca);

    // ---- Flores que se mecen (muchas más en la Pradera de las Flores) ----
    const colores = ['#ff5d8f', '#ffd23f', '#ffffff', '#c38bff', '#ff8a3d', '#6fd3ff'];
    const sinFlores = { nieve: 1, volcan: 1, desierto: 1 };
    const sembrar = (total, x0, y0, x1, y1, filtro) => {
      let intentos = 0, n0 = M.flores.length;
      while (M.flores.length - n0 < total && intentos++ < total * 15) {
        const x = rnd.rango(x0, x1), y = rnd.rango(y0, y1);
        if (filtro && !filtro(x, y)) continue;
        if (M.enAgua(x, y, 14) || distCaminos(x, y) < 50 || M.altura(x, y) > 0 || sinFlores[M.zonaEn(x, y)]) continue;
        if (M.castillos.some((c) => Math.abs(x - c.x) < 250 && y > c.y - 240 && y < c.y + 5)) continue;
        // racimos de 1–4 flores
        const n = rnd.entero(1, 4), col = rnd.elige(colores);
        for (let k = 0; k < n; k++) {
          const fx = x + rnd.rango(-26, 26), fy = y + rnd.rango(-18, 18);
          if (M.altura(fx, fy) > 0 || M.enAgua(fx, fy, 8)) continue;
          M.flores.push({ x: fx, y: fy, color: col, fase: rnd() * 6, t: rnd.rango(0.8, 1.25) });
        }
      }
    };
    sembrar(1500, 120, 150, W - 120, H - 100, viejas);
    sembrar(1000, 120, 150, W - 120, H - 100, nuevas);
    const fz = M.zonas.find((z) => z.id === 'flores');
    sembrar(1400, fz.x - fz.rx, fz.y - fz.ry, fz.x + fz.rx, fz.y + fz.ry, enZona('flores'));
    M.flores.sort((a, b) => a.y - b.y);

    // ---- Salones interiores de los castillos ----
    // Viven fuera del mapa (a la derecha), en una grilla de columnas de 5 filas; se entra por la puerta.
    // (El Huerto, índice 10, cae en la 3.ª columna, fila 0; sus 4 aulas ocupan las filas 1–4 de esa columna)
    const nuevaSala = (col, fila, extra) => {
      const x0 = W + 1200 + col * 1600, y0 = 800 + fila * 1500, w = 1100, h = 600;
      const s = Object.assign({ x0, y0, x1: x0 + w, y1: y0 + h, cx: x0 + w / 2, alto: 250 }, extra);
      s.ventanas = [0.12, 0.29, 0.71, 0.88].map((f) => x0 + w * f);
      M.salas.push(s);
      obj({ tipo: 'sala', sala: s, x: s.cx, y: s.y0, orden: s.y0 - 9999 });
      return s;
    };
    M.castillos.forEach((c, i) => {
      const col = Math.floor(i / 5), fila = i % 5;
      if (c.id === 'huerto') { construirHuerto(c, col, fila); return; }
      const s = nuevaSala(col, fila, { id: c.id, castillo: c }), x0 = s.x0, y0 = s.y0, w = s.x1 - s.x0, h = s.y1 - s.y0;
      c.sala = s;
      obj({ tipo: 'trono', id: c.id, x: s.cx, y: y0 + 74 }); solidoRect(s.cx - 56, y0 + 16, s.cx + 56, y0 + 78);
      [[190, 170], [w - 190, 170], [190, 440], [w - 190, 440]].forEach((p) => { obj({ tipo: 'columna', id: c.id, x: x0 + p[0], y: y0 + p[1] }); solidoCirculo(x0 + p[0], y0 + p[1] - 4, 24); });
      [[70, 60], [w - 70, 60], [70, h - 50], [w - 70, h - 50]].forEach((p) => { obj({ tipo: 'adorno', id: c.id, x: x0 + p[0], y: y0 + p[1] }); solidoCirculo(x0 + p[0], y0 + p[1] - 4, 22, 60); });
      [[s.cx - 150, y0 + 52], [s.cx + 150, y0 + 52], [s.cx - 120, s.y1 - 26], [s.cx + 120, s.y1 - 26]].forEach((p) => {
        const a = { tipo: 'antorcha', x: p[0], y: p[1], fase: rnd() * 6 }; M.antorchas.push(a); obj(a); solidoCirculo(p[0], p[1], 6);
      });
      const pr = { tipo: 'principe', id: c.id, sala: s, x: s.cx + 132, y: y0 + 150, dir: -1, fase: i * 1.7, regalo: 0 };
      M.principes.push(pr); obj(pr); solidoCirculo(pr.x, pr.y - 2, 16);
      // espejo mágico (a la izquierda del trono, frente al príncipe)
      const es = { tipo: 'espejo', id: c.id, sala: s, x: s.cx - 250, y: y0 + 150, fase: i * 0.9 };
      M.espejos.push(es); obj(es); solidoRect(es.x - 40, es.y - 14, es.x + 40, es.y + 6);
      // tesoros del salón
      for (let k = 0; k < 3; k++) { item('moneda', x0 + 310 + k * 44, y0 + 260 + k * 60); item('moneda', s.x1 - 310 - k * 44, y0 + 260 + k * 60); }
      item('pastel', x0 + 120, y0 + 300); item('fresa', s.x1 - 120, y0 + 300); item('estrella', s.cx + 250, y0 + 90);
      // corazones flotantes (solo existen dentro de los castillos)
      [[s.cx, y0 + 250], [x0 + 470, y0 + 470], [s.x1 - 470, y0 + 470], [x0 + 300, y0 + 120], [s.x1 - 300, y0 + 120]]
        .slice(0, C.CORAZONES_CASTILLO.porCastillo).forEach((p) => item('corazon', p[0], p[1], 55));
      [s.cx + 300, s.cx + 352].forEach((bx) => { const b = { tipo: 'caja', x: bx, y: y0 + 330, z: 122, usos: 3, recarga: 0, golpe: 0 }; M.cajas.push(b); obj(b); });
    });

    // ---- El Huerto: planta baja (hall) con 4 escaleras y un aula por piso con su seño ----
    function construirHuerto(c, col, fila) {
      const MATERIAS = ['matematica', 'lectura', 'modales', 'ingles'];
      const hall = nuevaSala(col, fila, { id: 'huerto', castillo: c, huerto: true, piso: 0 });
      c.sala = hall;
      const { x0, y0 } = hall, w = hall.x1 - hall.x0;
      // escaleras de subida a lo ancho del fondo; (x, y) = pie de la escalera, se sube tocándola por el frente
      MATERIAS.forEach((materia, k) => {
        const ex = x0 + w * (0.2 + k * 0.2), ey = y0 + 120;
        const e = obj({ tipo: 'escalera', sala: hall, x: ex, y: ey, piso: k + 1, materia, sube: true });
        M.escaleras.push(e);
        solidoRect(ex - 62, y0 + 16, ex + 62, ey - 34);      // el cuerpo de la escalera
        solidoRect(ex - 70, ey - 34, ex - 56, ey + 6);       // barandas: solo se entra por el frente
        solidoRect(ex + 56, ey - 34, ex + 70, ey + 6);
      });
      // tesoros del hall
      for (let k = 0; k < 3; k++) { item('moneda', x0 + 200 + k * 50, y0 + 330 + k * 40); item('moneda', hall.x1 - 200 - k * 50, y0 + 330 + k * 40); }
      item('manzana', x0 + 110, y0 + 470); item('fresa', hall.x1 - 110, y0 + 470);
      [[hall.cx, y0 + 300], [x0 + 420, y0 + 480], [hall.x1 - 420, y0 + 480]]
        .slice(0, C.CORAZONES_CASTILLO.porCastillo).forEach((p) => item('corazon', p[0], p[1], 55));

      MATERIAS.forEach((materia, k) => {
        const piso = k + 1;
        const s = nuevaSala(col, fila + piso, { id: 'huerto', castillo: c, huerto: true, aula: materia, piso });
        M.aulas.push(s);
        const ay0 = s.y0;
        // pizarrón arriba al centro
        obj({ tipo: 'pizarron', materia, sala: s, x: s.cx, y: ay0 + 80 }); solidoRect(s.cx - 140, ay0 + 16, s.cx + 140, ay0 + 82);
        // pupitres de Julieth y Giulia frente al pizarrón
        const pupitres = [['julieth', -80], ['giulia', 80]].map(([quien, dx]) => {
          const pu = obj({ tipo: 'pupitre', sala: s, x: s.cx + dx, y: ay0 + 290, quien });
          solidoRect(pu.x - 30, pu.y - 22, pu.x + 30, pu.y + 2, 70);
          return pu;
        });
        // la seño, al lado del pizarrón
        const sn = obj({ tipo: 'seno', materia, sala: s, x: s.cx + 220, y: ay0 + 150, dir: -1, fase: k * 1.3, pupitres });
        M.senos.push(sn); solidoCirculo(sn.x, sn.y - 2, 16);
        // escalera de bajada abajo al centro (donde en los salones está la puerta)
        const eb = obj({ tipo: 'escalera', sala: s, x: s.cx, y: s.y1 - 12, piso, materia, baja: true });
        M.escaleras.push(eb);
        // un par de monedas por aula
        item('moneda', s.x0 + 160, ay0 + 420); item('moneda', s.x1 - 160, ay0 + 420);
      });
    }

    ocupados = null; // ya no se necesita
  };

  J.Mundo = M;
})();
