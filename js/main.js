/* Bucle principal: cámara, actualización y dibujo por capas */
(function () {
  const U = J.U, C = J.CFG, D = J.Dibujo, M = J.Mundo, Ju = J.Jul, Ci = J.Cielo, P = J.Part, E = J.Entrada;
  const Cl = J.Clima, Ve = J.Vehiculos, Bo = J.Bote;
  const lienzo = document.getElementById('juego');
  const ctx = lienzo.getContext('2d', { alpha: false });
  let W = 0, H = 0, DPR = 1, zoom = 1;
  let jugando = false, pausa = false, t = 0, ultimo = 0, cuadro = 0;
  let calidad = 1, lentoT = 0, lentoN = 0; // calidad adaptable: baja la resolución si el equipo no llega a 60 FPS
  const visibles = [];
  const yoJulieth = { tipo: 'julieth', orden: 0 };

  const Cam = { x: Ju.x, y: Ju.y, saltarA(x, y) { Cam.x = x; Cam.y = y - 60; limitarCamara(); } };
  J.Camara = Cam;
  // punto de la pantalla (px CSS) → punto del mundo (para tocar cosas del mundo, como las fotos)
  J.pantallaAMundo = (sx, sy) => ({ x: Cam.x + (sx - W / 2) / zoom, y: Cam.y + (sy - H / 2) / zoom });

  function limitarCamara() {
    const vw = W / zoom, vh = H / zoom, s = M.salaActiva;
    if (s) { // dentro de un salón: la cámara no sale de la sala
      const x0 = s.x0 - 50, x1 = s.x1 + 50, y0 = s.y0 - s.alto - 50, y1 = s.y1 + 70;
      Cam.x = vw >= x1 - x0 ? (x0 + x1) / 2 : U.limitar(Cam.x, x0 + vw / 2, x1 - vw / 2);
      Cam.y = vh >= y1 - y0 ? (y0 + y1) / 2 : U.limitar(Cam.y, y0 + vh / 2, y1 - vh / 2);
      return;
    }
    Cam.x = vw >= C.MUNDO_W ? C.MUNDO_W / 2 : U.limitar(Cam.x, vw / 2, C.MUNDO_W - vw / 2);
    Cam.y = vh >= C.MUNDO_H ? C.MUNDO_H / 2 : U.limitar(Cam.y, vh / 2, C.MUNDO_H - vh / 2);
  }

  function ajustar() {
    W = window.innerWidth; H = window.innerHeight;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    if (W * DPR * H * DPR > 2600000) DPR = Math.max(1, Math.sqrt(2600000 / (W * H))); // cuida el rendimiento
    DPR *= calidad;
    lienzo.width = Math.round(W * DPR); lienzo.height = Math.round(H * DPR);
    zoom = U.limitar(Math.sqrt((W * H) / (1420 * 780)), 0.5, 1.6); // misma "cantidad de mundo" en cualquier pantalla
    if (Math.min(W, H) < 520) zoom = Math.max(zoom, 0.62);
    limitarCamara();
  }

  // ---------- Guardado (monedas y coronas) ----------
  function cargarPartida() {
    try {
      const d = JSON.parse(localStorage.getItem('julieth-princesa') || 'null');
      if (d) { Ju.monedas = d.monedas | 0; Ju.coronas = d.coronas | 0; }
    } catch (_) { /* sin almacenamiento: se juega igual */ }
  }
  function guardarPartida() {
    try { localStorage.setItem('julieth-princesa', JSON.stringify({ monedas: Ju.monedas, coronas: Ju.coronas })); } catch (_) {}
  }

  // ---------- Subir / bajar (auto, caballito o bote) con E, F o el botón táctil ----------
  let btnMontar = null, btnEstado = '';
  function charlaOMapa() { return J.Dialogo.abierto || !!J.Dialogo.cerca || J.Mapa.abierto || J.Espejo.abierto || !!(J.Aula && J.Aula.abierto); }
  function manejarMontar() {
    if (!E.consumirMontar() || charlaOMapa()) return;
    if (Bo.montado()) { Bo.bajar(Ju); return; }
    if (Ve.montado()) { Ve.bajar(Ju); return; }
    if (Ju.estado !== 'normal' || M.salaActiva) return;
    if (Ve.alternar(Ju)) return;            // primero un vehículo cercano...
    const b = Bo.cercano(Ju);               // ...y si no, el bote (o un muelle)
    if (b) Bo.subir(Ju, b);
  }
  function refrescarBotonMontar() {
    if (!btnMontar) return;
    let est = '';
    if (jugando && !pausa && !charlaOMapa()) {
      if (Bo.montado() || Ve.montado()) est = 'Bajar';
      else if (Ju.estado === 'normal' && !M.salaActiva && (Ve.cercano(Ju) || Bo.cercano(Ju))) est = 'Subir';
    }
    if (est === btnEstado) return;
    btnEstado = est;
    btnMontar.classList.toggle('visible', !!est);
    if (est) btnMontar.querySelector('span').textContent = est;
  }

  // ---------- Actualizar ----------
  function actualizar(dt) {
    t += dt;
    E.leer();
    Ci.actualizar(dt);
    const enCamara = !!((J.CamaraFotos && J.CamaraFotos.abierto) || (J.FotosMundo && J.FotosMundo.confirmando) || (J.VisorFotos && J.VisorFotos.abierto)); // con la cámara o la confirmación de borrado abiertas, el juego queda en pausa
    if (jugando && !enCamara) {
      J.Interior.actualizar(dt);
      manejarMontar();
      // el vehículo o el bote mueven a Julieth; si ninguno la lleva, camina sola
      const enVehiculo = Ve.actualizar(dt, Ju, E);
      Bo.actualizar(dt, Ju, E);
      if (!enVehiculo && !Bo.montado()) Ju.actualizar(dt, E);
      J.Giulia.actualizar(dt);            // la Duquesa Giulia Bebé repite todo 1 segundo después
      J.Ent.actualizar(dt, t, E);
      if (J.FotosMundo) J.FotosMundo.actualizar(dt, Ju); // camaritas de las fotos: borrar al pasar cerca
      J.Ruta.actualizar(dt);              // ruta hacia el destino elegido en el mapa
    } else E.consumirMontar();
    refrescarBotonMontar();
    P.actualizar(dt);
    // la cámara sigue a Julieth con suavidad, mirando un poco hacia adelante
    // cerca de un castillo sube la mirada para que se vea entero
    let cerca = 0;
    for (const c of M.castillos) cerca = Math.max(cerca, 1 - U.dist(Ju.x, Ju.y, c.patio.x, c.patio.y) / 560);
    const vh = H / zoom;
    const enMarcha = !!Ve.montado(), mira = enMarcha ? 0.4 : 0.28; // en vehículo mira más adelante
    const mx = Ju.x + Ju.vx * mira; let my = Ju.y - vh * 0.07 - vh * 0.25 * U.suave(Math.max(0, cerca)) - Ju.z * 0.45 + Ju.vy * mira;
    const k = Math.min(1, dt * (enMarcha ? 6 : 4.5));
    if (J.Dialogo.abierto) my += vh * 0.2; // deja a los personajes por encima del cuadro de diálogo
    Cam.x += (mx - Cam.x) * k; Cam.y += (my - Cam.y) * k;
    limitarCamara();
    Cl.actualizar(dt, Cam, jugando ? Ju : null);
    J.Dialogo.actualizar(dt, t);
    J.HUD.actualizar(dt, cuadro);
    if (jugando) J.Mapa.dibMini(t);
    if (J.Mapa.abierto) J.Mapa.dibGrande(t);
    if (cuadro % 600 === 599) guardarPartida();
  }

  // ---------- Dibujar ----------
  function dibItem(it) {
    const suelo = M.altura(it.x, it.y), alto = it.z - suelo;
    D.sombra(ctx, it.x, it.y - suelo, Math.max(7, 17 - alto * 0.03), 0.2);
    const y = it.y - it.z + Math.sin(t * 2.6 + it.fase) * 3.5;
    if (it.temporal !== undefined && it.temporal < 3 && Math.floor(t * 10) % 2) return; // parpadea antes de irse
    if (it.clase === 'moneda') D.dibMoneda(ctx, it.x, y, t, it.fase, it.suelta ? 0.85 : 1);
    else if (it.clase === 'corazon') D.dibCorazon(ctx, it.x, y, t, it.fase);
    else D.dibComida(ctx, it.clase, it.x, y, t, it.fase);
  }

  function dibujar() {
    const vw = W / zoom, vh = H / zoom;
    const v = { x0: Cam.x - vw / 2, y0: Cam.y - vh / 2, x1: Cam.x + vw / 2, y1: Cam.y + vh / 2, w: vw, h: vh, cx: Cam.x, cy: Cam.y };
    const e = DPR * zoom;
    // redondear el desplazamiento evita líneas entre baldosas
    ctx.setTransform(e, 0, 0, e, Math.round(-v.x0 * e), Math.round(-v.y0 * e));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    D.suelo(ctx, v, t, e);
    Cl.dibujarSuelo(ctx, v, t);   // nieve acumulada y charcos de lluvia
    Bo.dibujarSuelo(ctx, v);      // muelles, ondas y estelas
    Ve.dibujarSuelo(ctx, v, t);   // paradas y marcas de derrape
    J.Ruta.dibujarSuelo(ctx, v, t); // ruta al destino: verde la más corta, celeste la alternativa

    // objetos visibles, ordenados de atrás hacia adelante
    visibles.length = 0;
    const L = M.objetos;
    for (let i = 0; i < L.length; i++) {
      const o = L[i];
      let mx = 110, arriba = 80, abajo = 330;
      if (o.tipo === 'castillo') { mx = 360; abajo = 640; }
      else if (o.tipo === 'sala') { mx = 700; arriba = 800; abajo = 500; }
      else if (o.tipo === 'colina') { mx = o.rx + 20; arriba = o.ry * 2 + 30; abajo = o.ry + 150; }
      else if (o.tipo === 'item' && !o.activa) continue;
      if (o.x < v.x0 - mx || o.x > v.x1 + mx || o.y < v.y0 - arriba || o.y > v.y1 + abajo) continue;
      visibles.push(o);
    }
    Ve.agregarVisibles(v, visibles);   // OJO: (vista, lista)
    Bo.agregarVisibles(visibles, v);   // OJO: (lista, vista)
    if (J.FotosMundo) J.FotosMundo.agregarVisibles(v, visibles); // OJO: (vista, lista)
    yoJulieth.orden = Ju.y + 0.5; visibles.push(yoJulieth);
    J.Giulia.agregarVisibles(visibles);
    visibles.sort((a, b) => a.orden - b.orden);

    const luces = Ci.luces; luces.length = 0;
    const noche = Ci.noche, hayLuz = noche > 0.02;
    const luz = (x, y, r, f, halo, titila) => luces.push({ x: (x - v.x0) * zoom, y: (y - v.y0) * zoom, r: r * zoom, f, halo, titila });

    for (let i = 0; i < visibles.length; i++) {
      const o = visibles[i];
      switch (o.tipo) {
        case 'julieth': if (!Bo.montado() && !Ve.dibujarJulieth(ctx, t)) Ju.dibujar(ctx, t); break; // montada: la dibuja su vehículo o el bote
        case 'giulia': J.Giulia.dibujar(ctx, t); break;
        case 'vehiculo': Ve.dibujarUno(ctx, o.vehiculo, t); break;
        case 'bote': Bo.dibujarObjeto(ctx, o); break;
        case 'foto': J.FotosMundo.dibujar(ctx, o, t); break;
        case 'item': dibItem(o); if (hayLuz) luz(o.x, o.y - o.z, o.clase === 'estrella' ? 95 : 62, o.clase === 'estrella' ? 0.8 : 0.5); break;
        case 'arbol': D.dibArbol(ctx, o, t); break;
        case 'arbusto': D.dibArbusto(ctx, o, t, Ju.x, Ju.y); break;
        case 'roca': D.dibRoca(ctx, o); break;
        case 'antorcha': D.dibAntorcha(ctx, o, t); if (hayLuz) luz(o.x, o.y - 66, 215, 1, 46, 1); break;
        case 'colina': D.dibColina(ctx, o); break;
        case 'plataforma': D.dibPlataforma(ctx, o); break;
        case 'caja': D.dibCaja(ctx, o, t); if (hayLuz && o.usos > 0) luz(o.x, o.y - o.z - 23, 80, 0.6); break;
        case 'hongo': D.dibHongo(ctx, o, t); break;
        case 'portal': D.dibPortal(ctx, o, t); if (hayLuz) luz(o.x, o.y - 40, 130, 0.9, 40); break;
        case 'cactus': D.dibCactus(ctx, o, t); break;
        case 'zarza': D.dibZarza(ctx, o, t); break;
        case 'caracol': D.dibCaracol(ctx, o, t); break;
        case 'sala': D.dibSala(ctx, o.sala, t); break;
        case 'trono': D.dibTrono(ctx, o); break;
        case 'columna': D.dibColumna(ctx, o); break;
        case 'adorno': D.dibAdorno(ctx, o, t); if (hayLuz && (o.id === 'bosque' || o.id === 'luna' || o.id === 'fuego')) luz(o.x, o.y - 50, 130, 0.8, 30); break;
        case 'principe': D.dibPrincipe(ctx, o, t, Ju.x, Ju.y); break;
        case 'espejo': D.dibEspejo(ctx, o, t, Ju.x, Ju.y); if (hayLuz) luz(o.x, o.y - 110, 140, 0.7, 30); break;
        // El Huerto (jardín de infantes)
        case 'escalera': D.dibEscalera && D.dibEscalera(ctx, o, t); break;
        case 'pizarron': D.dibPizarron && D.dibPizarron(ctx, o, t); break;
        case 'pupitre': D.dibPupitre && D.dibPupitre(ctx, o); break;
        case 'seno': D.dibSeno && D.dibSeno(ctx, o, t, Ju.x, Ju.y); break;
        case 'castillo':
          D.dibCastillo(ctx, o, t, noche);
          if (hayLuz) { luz(o.x, o.y - 150, 360, 0.75); luz(o.x - 150, o.y - 60, 170, 0.6); luz(o.x + 150, o.y - 60, 170, 0.6); }
          break;
      }
    }
    P.dibujar(ctx, v);

    // halo cálido de la corona de Julieth
    if (hayLuz) {
      const c = Ju.corona(); luz(c.x, c.y + 40, 200, 1, 36);
      for (const l of Bo.luces(v)) luz(l.x, l.y, l.r, l.f); // farolitos de los muelles y coronita del cisne
    }

    // capas en coordenadas de pantalla
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const dentro = !!M.salaActiva;
    if (!dentro) Ci.dibNubes(ctx, W, H, { x: Cam.x * zoom, y: Cam.y * zoom }, (Ju.x - v.x0) * zoom, (Ju.y - 50 - v.y0) * zoom);
    if (!dentro) Cl.dibujarPantalla(ctx, W, H, zoom, t); // lluvia, nieve y hojas (nunca dentro de los castillos)
    Ci.iluminar(ctx, W, H, t, dentro);
    if (!dentro) Ci.dibNoche(ctx, W, H, t, Cam, zoom);
    // fundido al cruzar una puerta
    if (J.Interior.cortina > 0) { ctx.fillStyle = `rgba(42,24,56,${J.Interior.cortina})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- Bucle ----------
  let fpsT = 0, fpsN = 0;
  function cuadroNuevo(ahora) {
    requestAnimationFrame(cuadroNuevo);
    const real = (ahora - ultimo) / 1000 || 0.016;
    const dt = Math.min(0.034, real);
    ultimo = ahora;
    if (pausa) return;
    if (real < 0.1) { lentoT += real; lentoN++; }
    if (lentoN >= 150) {
      if (lentoT / lentoN > 0.0205 && calidad > 0.55) { calidad *= 0.85; ajustar(); }
      lentoT = 0; lentoN = 0;
    }
    cuadro++;
    actualizar(dt);
    dibujar();
    if (J.verFPS) { fpsT += dt; fpsN++; if (fpsT >= 0.5) { J.fps = Math.round(fpsN / fpsT); document.getElementById('fps').textContent = J.fps + ' FPS'; fpsT = 0; fpsN = 0; } }
  }

  // ---------- Pantallas y botones ----------
  function empezar() {
    J.Audio.iniciar();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.getElementById('inicio').classList.add('oculto');
    document.body.classList.add('jugando');
    if (!jugando) { jugando = true; J.HUD.aviso('¡Explora el reino y visita los ' + M.castillos.length + ' castillos!', 4.5); }
    pausa = false; ultimo = performance.now();
  }
  function abrirAyuda() {
    J.Dialogo.cerrar();
    J.Espejo.cerrar();
    if (J.Aula && J.Aula.cerrar) J.Aula.cerrar();
    pausa = true; guardarPartida();
    document.getElementById('btn-jugar').textContent = '¡Seguir jugando!';
    document.getElementById('inicio').classList.remove('oculto');
    document.body.classList.remove('jugando');
  }

  function retrato() { // Julieth saludando en la pantalla de inicio
    const c = document.getElementById('retrato'); if (!c) return;
    const g = c.getContext('2d'), S = c.width / 150;
    (function anima(ms) {
      if (!document.getElementById('inicio').classList.contains('oculto')) {
        const tt = ms / 1000;
        g.setTransform(S, 0, 0, S, 0, 0); g.clearRect(0, 0, 150, 170);
        g.translate(72, 150 - Math.abs(Math.sin(tt * 3)) * 10); g.scale(1.35, 1.35);
        Ju.figura(g, { t: tt, fase: tt * 5, pose: 'celebra', velTrenza: 0.15 });
        // la Duquesa Giulia Bebé la imita 1 segundo después
        const tg = Math.max(0, tt - 1);
        g.setTransform(S, 0, 0, S, 0, 0); g.translate(128, 158 - Math.abs(Math.sin(tg * 3)) * 10); g.scale(1.15, 1.15);
        J.Giulia.figura(g, { t: tg, fase: tg * 5, pose: tt < 1 ? 'quieta' : 'celebra' });
      }
      requestAnimationFrame(anima);
    })(0);
  }

  function iniciar() {
    J.verFPS = /[?&]fps/.test(location.search);
    if (J.verFPS) document.getElementById('fps').style.display = 'block';
    J.Assets.alCambiar.push((k, im) => {
      if (k === 'fondoTitulo') { const f = document.getElementById('inicio-fondo'); f.style.backgroundImage = 'url("' + im.src + '")'; f.classList.add('con-imagen'); }
      else D.refrescarPatrones(ctx);
    });
    J.Assets.cargar();
    M.generar();
    D.construirSprites(); D.construirComida(); D.refrescarPatrones(ctx);
    Ci.iniciar(); E.iniciar(); J.HUD.iniciar(); J.Dialogo.iniciar(); J.Espejo.iniciar(); if (J.Aula) J.Aula.iniciar();
    if (J.Fotos) J.Fotos.iniciar(); // antes del mapa: así ya tiene la lista de fotos guardadas
    J.Mapa.iniciar();
    if (J.CamaraFotos) J.CamaraFotos.iniciar();
    if (J.FotosMundo) J.FotosMundo.iniciar();
    if (J.VisorFotos) J.VisorFotos.iniciar();
    Cl.iniciar();
    Ve.usarTecladoPropio(false); // E/F y el botón #btn-montar los maneja manejarMontar()
    Ve.iniciar(M);
    // además de las paradas junto a la salida y los castillos, un auto y un caballito en cada pradera abierta
    for (const pr of M.praderasAbiertas || []) {
      Ve.agregar('auto', pr.x - 140, pr.y, 1);
      Ve.agregar('caballo', pr.x + 140, pr.y + 40, -1);
    }
    Bo.iniciar(M);
    J.Giulia.iniciar();
    btnMontar = document.getElementById('btn-montar');
    if (btnMontar) btnMontar.addEventListener('click', (ev) => ev.currentTarget.blur());
    cargarPartida(); J.HUD.coronas(Ju.coronas);
    ajustar(); Cam.saltarA(Ju.x, Ju.y);
    window.addEventListener('resize', ajustar);
    window.addEventListener('orientationchange', () => setTimeout(ajustar, 200));
    window.addEventListener('pagehide', guardarPartida);
    document.addEventListener('visibilitychange', () => {
      const a = J.Audio.ctx;
      if (document.hidden) { guardarPartida(); E.teclas = {}; if (a) a.suspend(); }
      else { ultimo = performance.now(); if (a && jugando) a.resume(); }
    });

    document.getElementById('btn-jugar').addEventListener('click', empezar);
    document.getElementById('btn-ayuda').addEventListener('click', abrirAyuda);
    const alternar = (id, prop) => document.getElementById(id).addEventListener('click', (ev) => {
      J.Audio.iniciar(); J.Audio[prop] = !J.Audio[prop]; ev.currentTarget.classList.toggle('apagado', !J.Audio[prop]); ev.currentTarget.blur();
    });
    alternar('btn-sonido', 'sonidoOn'); alternar('btn-musica', 'musicaOn');
    document.getElementById('btn-pantalla').addEventListener('click', (ev) => {
      ev.currentTarget.blur();
      const d = document.documentElement;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (d.requestFullscreen) d.requestFullscreen().catch(() => {});
    });
    window.addEventListener('keydown', (ev) => {
      if (ev.code === 'Enter' && !document.getElementById('inicio').classList.contains('oculto')) empezar();
      if (ev.code === 'Escape' || ev.code === 'KeyP') { if (pausa) empezar(); else if (jugando) abrirAyuda(); }
    });
    lienzo.addEventListener('contextmenu', (ev) => ev.preventDefault());

    retrato();
    requestAnimationFrame(cuadroNuevo);
  }

  // Para pruebas y curiosos: J.depurar.hora(0.8) pone la noche, J.depurar.castillo('luna') lleva a ese patio, J.depurar.huerto(2) al aula del piso 2, etc.
  J.depurar = { hora: (h) => { Ci.hora = h; }, ir: (x, y) => { if (Bo.montado()) Bo.bajar(Ju); if (Ve.montado()) Ve.bajar(Ju); Ju.x = x; Ju.y = y; Cam.saltarA(x, y); J.Giulia.iniciar(); }, clima: (c, s) => Cl.forzar(c, s), castillo: (id) => { const c = M.castillos.find((q) => q.id === id || q.indice === id); if (!c) return null; M.salaActiva = null; J.depurar.ir(c.patio.x, c.patio.y); return c.nombre; }, entrar: (i) => { const s = M.castillos[i].sala; M.salaActiva = s; Ju.x = s.cx; Ju.y = s.y1 - 70; Ju.z = 0; Cam.saltarA(Ju.x, Ju.y); },
    // J.depurar.huerto(0) = hall de El Huerto; huerto(1..4) = aula de ese piso
    huerto: (piso) => { piso = piso | 0; if (Bo.montado()) Bo.bajar(Ju); if (Ve.montado()) Ve.bajar(Ju); const hall = M.castillos.find((c) => c.id === 'huerto').sala; const s = piso > 0 ? M.aulas.find((a) => a.piso === piso) : hall; if (!s) return null; M.salaActiva = s; Ju.x = s.cx; Ju.y = s.y1 - 70; Ju.z = 0; Ju.vz = 0; Ju.enSuelo = true; Ju.estado = 'normal'; Cam.saltarA(Ju.x, Ju.y); return s.aula || 'hall'; }, estado: () => ({ jugando, pausa, zoom, W, H, calidad }) };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
