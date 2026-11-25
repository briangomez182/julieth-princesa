/* Entrar y salir de los castillos: se cruza la puerta con un fundido
   y Julieth aparece en el salón (o de vuelta en el patio).
   En El Huerto (jardín de infantes) Julieth y Giulia suben y bajan las escaleras caminando
   escalón por escalón; recién al llegar arriba (o abajo) se cambia de piso con el fundido. */
(function () {
  const I = { cortina: 0, t: 0, pendiente: null, enfriar: 0, yaExplico: false };
  const DUR = 0.7;
  const MATERIA = { matematica: 'Matemática', lectura: 'Lectura', modales: 'Modales', ingles: 'Inglés' };
  let yaExplicoAula = false;

  function cruzar(destino) {
    const Ju = J.Jul;
    Ju.estado = 'puerta'; Ju.vx = Ju.vy = 0; I.t = DUR; I.pendiente = destino;
    J.Audio.puerta();
  }

  // ---- Escaleras animadas: tramos que mueven a las dos princesas (Giulia va un poquito detrás) ----
  const ALTO_ESC = 150;  // lo que se sube en la escalera del hall (6 escalones)
  const HONDO = -80;     // lo que se baja por la abertura del aula
  const G = () => J.Giulia;
  function posG() { const g = G(); return g && g.listo ? { x: g.x, y: g.y, z: g.z || 0 } : null; }
  function animar(tramos, fin) {
    const Ju = J.Jul;
    Ju.estado = 'escalera'; Ju.vx = Ju.vy = 0; Ju.vz = 0; Ju.enSuelo = true;
    I.anim = { tramos, i: -1, t: 0, fin, tPaso: 0 };
    siguienteTramo();
  }
  function siguienteTramo() {
    const a = I.anim, Ju = J.Jul;
    a.i++; a.t = 0;
    const tr = a.tramos[a.i];
    if (!tr) { const f = a.fin; I.anim = null; f(); return; }
    if (tr.jDesde) { Ju.x = tr.jDesde.x; Ju.y = tr.jDesde.y; Ju.z = tr.jDesde.z; }
    tr.j0 = { x: Ju.x, y: Ju.y, z: Ju.z };
    if (tr.gDesde) ponerG(tr.gDesde, 1, 'quieta');
    tr.g0 = tr.gDesde ? { x: tr.gDesde.x, y: tr.gDesde.y, z: tr.gDesde.z } : posG();
  }
  function ponerG(p, dir, pose) {
    const g = G(); if (!g || !g.listo) return;
    g.guion = { x: p.x, y: p.y, z: p.z, dir: dir || g.dir || 1, pose: pose || 'camina' };
  }
  const mezcla = (a, b, k) => a + (b - a) * k;
  function avanzarAnim(dt) {
    const a = I.anim, Ju = J.Jul, tr = a.tramos[a.i];
    a.t += dt;
    const fase = (t, r) => J.U.limitar((t - r[0]) / Math.max(0.01, r[1] - r[0]), 0, 1);
    const kj = J.U.suave(fase(a.t, tr.jT || [0, tr.d]));
    const mov = kj > 0 && kj < 1;
    Ju.x = mezcla(tr.j0.x, tr.j.x, kj); Ju.y = mezcla(tr.j0.y, tr.j.y, kj); Ju.z = mezcla(tr.j0.z, tr.j.z, kj);
    if (Math.abs(tr.j.x - tr.j0.x) > 4) Ju.dir = tr.j.x > tr.j0.x ? 1 : -1;
    Ju.poseEscalera = mov ? 'camina' : 'quieta';
    if (tr.g && tr.g0) {
      const kg = J.U.suave(fase(a.t, tr.gT || [0, tr.d]));
      const gx = mezcla(tr.g0.x, tr.g.x, kg), gy = mezcla(tr.g0.y, tr.g.y, kg), gz = mezcla(tr.g0.z, tr.g.z, kg);
      ponerG({ x: gx, y: gy, z: gz }, Math.abs(tr.g.x - tr.g0.x) > 4 ? (tr.g.x > tr.g0.x ? 1 : -1) : Ju.dir, kg > 0 && kg < 1 ? 'camina' : 'quieta');
    }
    a.tPaso -= dt;
    if (mov && a.tPaso <= 0) { a.tPaso = 0.2; J.Audio.paso(); }
    if (a.t >= tr.d) siguienteTramo();
  }
  function soltar() {
    const Ju = J.Jul, g = G();
    Ju.estado = 'normal'; Ju.poseEscalera = null; Ju.z = 0; Ju.vz = 0; Ju.enSuelo = true; I.enfriar = 1.2;
    if (g && g.soltarGuion) g.soltarGuion();
  }
  // fundido de piso con las nenas quietas; al terminar arranca la llegada
  function fundir(destino, llegada) {
    I.t = DUR; I.pendiente = destino; I.llegada = llegada; J.Audio.puerta();
  }

  function subir(e) { // hall → aula: caminan hasta el pie, suben los 6 escalones y entran por la puertita
    const yP = e.y + 4, g = posG();
    animar([
      { d: 0.35, j: { x: e.x, y: yP, z: 0 }, g: g ? { x: e.x + 40, y: e.y + 70, z: 0 } : null },
      { d: 1.6, jT: [0, 1.15], j: { x: e.x, y: yP, z: ALTO_ESC }, gT: [0.55, 1.6], g: g ? { x: e.x, y: yP + 2, z: ALTO_ESC } : null }
    ], () => fundir({ subir: e }, () => {
      const s = J.Mundo.salaActiva, yb = s.y1 - 12;
      animar([ // salen por la abertura del aula
        { d: 1.5, jDesde: { x: s.cx, y: yb - 30, z: HONDO }, jT: [0, 1.0], j: { x: s.cx, y: s.y1 - 110, z: 0 },
          gDesde: { x: s.cx, y: yb - 28, z: HONDO }, gT: [0.4, 1.5], g: { x: s.cx - 105, y: s.y1 - 100, z: 0 } }
      ], soltar);
    }));
  }
  function bajar(s) { // aula → hall: bajan por la abertura y aparecen arriba de su escalera, bajando
    const yb = s.y1 - 12, g = posG();
    animar([
      { d: 0.4, j: { x: s.cx, y: yb - 70, z: 0 }, g: g ? { x: s.cx - 40, y: yb - 120, z: 0 } : null },
      { d: 1.5, jT: [0, 1.0], j: { x: s.cx, y: yb - 30, z: HONDO }, gT: [0.4, 1.5], g: g ? { x: s.cx, y: yb - 28, z: HONDO } : null }
    ], () => fundir({ bajar: s }, () => {
      const e = J.Mundo.escaleras.find((q) => q.sube && q.piso === s.piso);
      if (!e) { soltar(); return; }
      const yP = e.y + 4;
      animar([
        { d: 1.7, jDesde: { x: e.x, y: yP, z: ALTO_ESC }, jT: [0, 1.1], j: { x: e.x, y: e.y + 50, z: 0 },
          gDesde: { x: e.x, y: yP + 2, z: ALTO_ESC }, gT: [0.6, 1.7], g: { x: e.x + 105, y: e.y + 62, z: 0 } }
      ], soltar);
    }));
  }

  function aplicar(d) {
    const M = J.Mundo, Ju = J.Jul;
    if (d.subir) { // del hall del Huerto a un aula: aparece junto a la escalera de bajada
      const e = d.subir, s = M.aulas.find((a) => a.piso === e.piso);
      M.salaActiva = s; Ju.x = s.cx; Ju.y = s.y1 - 70; Ju.z = 0; Ju.vz = 0; Ju.enSuelo = true;
      J.HUD.aviso(yaExplicoAula ? '¡Subiste al piso ' + s.piso + ': ' + (MATERIA[s.aula] || s.aula) + '!' : 'Acércate a la seño para empezar la clase', 3.6);
      yaExplicoAula = true;
    } else if (d.bajar) { // de un aula al hall, frente a la escalera de ese piso
      const s = d.bajar, hall = s.castillo.sala;
      const e = M.escaleras.find((q) => q.sube && q.piso === s.piso);
      M.salaActiva = hall; Ju.x = e ? e.x : hall.cx; Ju.y = e ? e.y + 46 : hall.y1 - 70; Ju.z = 0; Ju.vz = 0; Ju.enSuelo = true;
      J.HUD.aviso('Planta baja', 2);
    } else if (d.entrar) {
      const s = d.entrar;
      M.salaActiva = s; Ju.x = s.cx; Ju.y = s.y1 - 70; Ju.z = 0; Ju.vz = 0; Ju.enSuelo = true;
      if (s.huerto) J.HUD.aviso('¡Bienvenida a ' + s.castillo.nombre + '! Sube una escalera para ir a clase', 3.6);
      else { J.HUD.aviso(I.yaExplico ? '¡Entraste al ' + s.castillo.nombre + '!' : 'Acércate al príncipe para conversar', 3.6); I.yaExplico = true; }
    } else {
      const c = d.salir.castillo;
      M.salaActiva = null; Ju.x = c.x; Ju.y = c.y + 52; Ju.z = 0; Ju.vz = 0; Ju.enSuelo = true;
    }
    Ju.dir = 1; I.enfriar = 1.2;
    J.Camara.saltarA(Ju.x, Ju.y);
  }

  I.actualizar = function (dt) {
    const M = J.Mundo, Ju = J.Jul;
    I.enfriar = Math.max(0, I.enfriar - dt);
    if (Ju.estado === 'puerta' || (Ju.estado === 'escalera' && !I.anim)) {
      I.t -= dt;
      if (I.pendiente && I.t <= DUR / 2) { aplicar(I.pendiente); I.pendiente = null; }
      I.cortina = J.U.limitar(1 - Math.abs(I.t - DUR / 2) / (DUR / 2), 0, 1);
      if (I.t <= 0) {
        I.cortina = 0;
        if (Ju.estado === 'puerta') Ju.estado = 'normal';
        else if (I.llegada) { const f = I.llegada; I.llegada = null; f(); }
        else soltar();
      }
      return;
    }
    if (Ju.estado === 'escalera') { avanzarAnim(dt); return; }
    if (Ju.estado !== 'normal' || I.enfriar > 0 || Ju.z > 30) return;
    const s = M.salaActiva;
    if (!s) {
      // afuera: tocar la puerta del castillo
      for (const c of M.castillos) {
        if (Math.abs(Ju.x - c.x) < 34 && Ju.y < c.y + 16 && Ju.y > c.y - 20) { cruzar({ entrar: c.sala }); break; }
      }
    } else if (s.aula) {
      // aula del Huerto: la escalera de bajada está abajo al centro
      if (Ju.y > s.y1 - 14 && Math.abs(Ju.x - s.cx) < 54) bajar(s);
    } else {
      if (s.huerto) { // hall del Huerto: tocar el frente de una escalera para subir
        for (const e of M.escaleras) {
          if (e.sube && e.sala === s && Math.abs(Ju.x - e.x) < 40 && Ju.y < e.y - 12 && Ju.y > e.y - 40) { subir(e); return; }
        }
      }
      if (Ju.y > s.y1 - 14 && Math.abs(Ju.x - s.cx) < 54) cruzar({ salir: s }); // adentro: la salida está abajo, al final de la alfombra
    }
  };

  J.Interior = I;
})();
