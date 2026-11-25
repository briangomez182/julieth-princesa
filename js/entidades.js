/* Reglas de los objetos del mundo: monedas, comida, cajas sorpresa,
   hongos-trampolín, portales, peligros cómicos y visitas a castillos. */
(function () {
  const U = J.U, P = J.Part, S = J.Audio;
  const Ent = { hayMuertos: false, fiestaFinal: 0 };

  function recoger(it) {
    const Ju = J.Jul;
    if (it.clase === 'corazon') {
      Ju.corazones = Math.min(J.CFG.CORAZONES, Ju.corazones + 1);
      S.corazon(); P.corazones(it.x, it.y, it.z, 8); P.chispas(it.x, it.y, it.z, 10, '#ffc0d6');
      P.texto(it.x, it.y, it.z + 40, '+1 ❤', '#ffd0e0', 26);
      J.HUD.sacudir('corazones');
    } else if (it.clase === 'moneda') {
      Ju.monedas++; S.moneda(); P.oro(it.x, it.y, it.z, 16);
      J.HUD.sacudir('monedas');
      if (Ju.monedas % 50 === 0) { J.HUD.aviso('¡' + Ju.monedas + ' monedas gigantes! 🎉', 3); Ju.celebrar(1.8); }
    } else {
      Ju.comer(it.clase);
      if (it.clase === 'estrella') { S.estrella(); P.chispas(it.x, it.y, it.z, 22, '#ffe873'); P.texto(it.x, it.y, it.z + 40, '¡Súper veloz!', '#fff6b0', 24); }
      else { S.comida(); P.chispas(it.x, it.y, it.z, 12, '#ffffff'); P.texto(it.x, it.y, it.z + 36, '¡Ñam!', '#ffe0ec', 22); }
    }
    if (it.temporal !== undefined) { it.muerta = true; Ent.hayMuertos = true; }
    else { it.activa = false; it.respawn = it.clase === 'moneda' ? J.CFG.MONEDAS.reaparecenSeg : it.clase === 'corazon' ? J.CFG.CORAZONES_CASTILLO.reaparecenSeg : 55; }
  }

  function soltarDeCaja(c) {
    const r = Math.random();
    const clase = r < 0.5 ? 'moneda' : r < 0.68 ? 'manzana' : r < 0.82 ? 'fresa' : r < 0.92 ? 'pastel' : 'estrella';
    J.Mundo.crearItem(clase, c.x, c.y + 4, 0, {
      z: c.z + 62, vx: U.azar(-90, 90), vy: U.azar(50, 120), vz: 430, temporal: 16, espera: 0.45
    });
    P.chispas(c.x, c.y, c.z + 50, 10, '#fff6b0');
  }

  Ent.actualizar = function (dt, t, E) {
    const M = J.Mundo, Ju = J.Jul, normal = Ju.estado === 'normal';
    const cuerpo = Ju.z + 48, cabeza = Ju.z + 100;

    // ----- Monedas y comida -----
    for (const it of M.items) {
      if (it.muerta) continue;
      if (!it.activa) {
        it.respawn -= dt;
        if (it.respawn <= 0 && Math.abs(it.x - Ju.x) + Math.abs(it.y - Ju.y) > 500) it.activa = true;
        continue;
      }
      if (it.vz !== undefined) { // recién salido de una caja o soltado
        it.vz -= 1500 * dt;
        const nx = it.x + it.vx * dt, ny = it.y + it.vy * dt;
        if (M.lugarValido(nx, ny)) { it.x = nx; it.y = ny; } else { it.vx *= -0.5; it.vy *= -0.5; }
        it.z += it.vz * dt; it.orden = it.y;
        const piso = M.altura(it.x, it.y) + 30;
        if (it.z <= piso) {
          it.z = piso;
          if (Math.abs(it.vz) < 150) { it.vz = undefined; it.vx = it.vy = 0; } else { it.vz *= -0.45; it.vx *= 0.55; it.vy *= 0.55; }
        }
      }
      if (it.temporal !== undefined) {
        it.temporal -= dt;
        if (it.temporal <= 0) { it.muerta = true; Ent.hayMuertos = true; P.chispas(it.x, it.y, it.z, 5); continue; }
      }
      if (it.espera > 0) { it.espera -= dt; continue; }
      const dx = it.x - Ju.x, dy = (it.y - Ju.y) * 1.35;
      if (dx * dx + dy * dy < 36 * 36 && Math.abs(cuerpo - it.z) < 62 && Ju.estado !== 'tunel') {
        // con los corazones llenos, el corazón se queda esperando para más tarde
        if (it.clase === 'corazon' && Ju.corazones >= J.CFG.CORAZONES) {
          if (!(it.aviso > 0)) { P.texto(it.x, it.y, it.z + 40, '¡Corazones llenos!', '#ffe0ec', 18); it.aviso = 2.5; }
        } else recoger(it);
      }
      if (it.aviso > 0) it.aviso -= dt;
    }

    // ----- Cajas sorpresa: se golpean saltando desde abajo -----
    for (const c of M.cajas) {
      if (c.golpe > 0) c.golpe = Math.max(0, c.golpe - dt);
      if (c.usos <= 0) { c.recarga -= dt; if (c.recarga <= 0) { c.usos = 3; P.chispas(c.x, c.y, c.z + 23, 8, '#ffe873'); } }
      if (Ju.vz > 0 && Math.abs(c.x - Ju.x) < 33 && Math.abs(c.y - Ju.y) < 24 && cabeza >= c.z && cabeza <= c.z + 36) {
        Ju.vz = -150; Ju.z = c.z - 100; c.golpe = 0.22;
        if (c.usos > 0) { c.usos--; if (c.usos === 0) c.recarga = 40; S.caja(); soltarDeCaja(c); } else S.cajaVacia();
      }
    }

    // ----- Hongos gigantes: rebote alto -----
    for (const h of M.hongos) {
      if (h.aplasta > 0) h.aplasta = Math.max(0, h.aplasta - dt);
      const dx = h.x - Ju.x, dy = (h.y - Ju.y) * 1.5;
      if (Ju.vz < 0 && dx * dx + dy * dy < 46 * 46 && Ju.z <= 54 && Ju.z > 16) {
        Ju.z = 54; Ju.vz = E.saltoAbajo ? 1240 : 1080; Ju.enSuelo = false; Ju.cortoSalto = false;
        h.aplasta = 0.35; S.rebote(); P.chispas(h.x, h.y, 56, 12, '#ffffff');
      }
    }

    // ----- Portales arcoíris -----
    if (normal && Ju.enfriarPortal <= 0 && Ju.z < 30) {
      for (const p of M.portales) {
        if (Math.abs(p.x - Ju.x) < 26 && Math.abs(p.y - 4 - Ju.y) < 16) { Ju.entrarPortal(p); break; }
      }
    }

    // ----- Peligros cómicos -----
    for (const p of M.peligros) {
      if (p.tipo === 'caracol') {
        if (p.mareado > 0) p.mareado -= dt;
        else { p.x += p.dir * 26 * dt; if (p.x > p.x1) p.dir = -1; else if (p.x < p.x0) p.dir = 1; }
      }
      if (!normal) continue;
      const dx = p.x - Ju.x, dy = p.y - Ju.y;
      if (Math.abs(dx) > 90 || Math.abs(dy) > 70) continue;
      if (p.tipo === 'charco') {
        if (Ju.z < 3 && (dx * dx) / (44 * 44) + (dy * dy) / (21 * 21) < 1 && Ju.herir(p.x, p.y, true)) P.gotas(Ju.x, Ju.y, 10);
        continue;
      }
      const d2 = dx * dx + dy * dy * 1.7, rr = p.r + 13;
      if (d2 > rr * rr) continue;
      if (p.tipo === 'caracol') {
        if (Ju.vz < -60 && Ju.z > 12) { // pisotón: el caracol se esconde, mareado
          p.mareado = 4.5; Ju.vz = 560; Ju.cortoSalto = false; S.pisoton();
          P.chispas(p.x, p.y, 40, 12, '#ffe873'); P.texto(p.x, p.y, 80, '¡Boing!', '#fff6b0', 22);
        } else if (p.mareado <= 0 && Ju.z < p.alto) Ju.herir(p.x, p.y);
      } else if (Ju.z < p.alto) Ju.herir(p.x, p.y);
    }

    // ----- Príncipes, espejos y seños: ¿hay alguno cerca para conversar? -----
    let cerca = null;
    if (M.salaActiva && normal && Ju.enSuelo) {
      for (const p of M.principes) if (p.sala === M.salaActiva && Math.hypot(p.x - Ju.x, (p.y - Ju.y) * 1.2) < 96) cerca = p;
      for (const e of M.espejos) if (e.sala === M.salaActiva && Math.hypot(e.x - Ju.x, (e.y - Ju.y) * 1.2) < 100) cerca = e;
      for (const sn of M.senos || []) if (sn.sala === M.salaActiva && Math.hypot(sn.x - Ju.x, (sn.y - Ju.y) * 1.2) < 100) cerca = sn; // seños del Huerto
    }
    J.Dialogo.cerca = cerca;

    // ----- Visitas a los castillos -----
    if (Ent.fiestaFinal > 0) {
      Ent.fiestaFinal -= dt;
      if (Math.random() < dt * 5) P.confeti(Ju.x + U.azar(-260, 260), Ju.y + U.azar(-120, 120), U.azar(120, 260), 14);
      if (Ent.fiestaFinal <= 0) { M.castillos.forEach((c) => { c.visitado = false; J.HUD.castillo(c.indice, false); }); J.HUD.aviso('¡Los castillos te esperan otra vez!', 3); }
    }
    for (const c of M.castillos) {
      if (c.enfriar > 0) c.enfriar -= dt;
      const dx = (c.patio.x - Ju.x) / 190, dy = (c.patio.y - Ju.y) / 112;
      if (dx * dx + dy * dy > 1 || !Ju.enSuelo || !(normal || Ju.estado === 'montada')) continue; // también llegando en auto o caballito
      if (!c.visitado) {
        c.visitado = true; c.enfriar = 25; J.HUD.castillo(c.indice, true);
        if (M.castillos.every((k) => k.visitado)) {
          Ju.coronas++; Ent.fiestaFinal = 12; J.HUD.coronas(Ju.coronas);
          J.HUD.aviso('👑 ¡Julieth visitó los ' + M.castillos.length + ' castillos! 👑', 6); Ju.celebrar(3.4); P.confeti(Ju.x, Ju.y, 80, 90);
        } else { J.HUD.aviso('¡Llegaste al ' + c.nombre + '!', 3.4); Ju.celebrar(2.2); }
      } else if (c.enfriar <= 0) { J.HUD.aviso(c.nombre, 2); c.enfriar = 25; }
      else c.enfriar = Math.max(c.enfriar, 6);
    }

    // limpiar objetos temporales ya recogidos o vencidos
    if (Ent.hayMuertos) {
      M.items = M.items.filter((o) => !o.muerta);
      M.objetos = M.objetos.filter((o) => !o.muerta);
      Ent.hayMuertos = false;
    }
  };

  J.Ent = Ent;
})();
