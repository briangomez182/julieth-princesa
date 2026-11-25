/* HUD: corazones, barra de energía, contador gigante de monedas,
   emblemas de castillos, relojito de día/noche y avisos. */
(function () {
  const H = { _c: -1, _e: -1, _m: -1, _turbo: null, _momento: '', tAviso: 0 };
  const $ = (id) => document.getElementById(id);

  H.iniciar = function () {
    H.corazonesEl = $('corazones'); H.energiaEl = $('energia-relleno'); H.monedasEl = $('monedas-num');
    H.avisoEl = $('aviso'); H.reloj = $('reloj'); H.momentoEl = $('momento'); H.coronasEl = $('coronas');
    const cor = '<svg viewBox="0 0 32 30"><path d="M16 28C4 19 1 13 1 8.5 1 4 4.5 1 8.5 1 11.5 1 14.5 2.8 16 5.5 17.500 2.800 20.500 1 23.500 1 27.500 1 31 4 31 8.500 31 13 28 19 16 28Z"/></svg>';
    H.corazonesEl.innerHTML = new Array(J.CFG.CORAZONES).fill(cor).join('');
    // emblemas de los castillos (11, en el mismo orden que M.castillos)
    document.querySelectorAll('#castillos canvas').forEach((c) => {
      const g = c.getContext('2d'); g.scale(c.width / 40, c.height / 40);
      try { J.Dibujo.emblema(g, c.dataset.id, 20, 20, 11); } catch (_) { /* emblema aún sin arte */ }
    });
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    H.reloj.width = H.reloj.height = 52 * DPR; H.relojG = H.reloj.getContext('2d'); H.relojG.scale(DPR, DPR);
  };

  H.sacudir = function (cual) {
    const el = cual === 'monedas' ? $('panel-monedas') : cual === 'energia' ? $('energia') : H.corazonesEl;
    el.classList.remove('sacude'); void el.offsetWidth; el.classList.add('sacude');
  };
  H.aviso = function (texto, seg) {
    H.avisoEl.textContent = texto; H.avisoEl.classList.add('visible'); H.tAviso = seg || 2.5;
  };
  H.castillo = function (i, ok) {
    const el = document.querySelectorAll('#castillos canvas')[i];
    if (el) el.classList.toggle('ok', ok);
  };
  H.coronas = function (n) { H.coronasEl.textContent = n > 0 ? '👑 × ' + n : ''; };

  H.actualizar = function (dt, cuadro) {
    const Ju = J.Jul;
    if (H.tAviso > 0) { H.tAviso -= dt; if (H.tAviso <= 0) H.avisoEl.classList.remove('visible'); }
    if (Ju.corazones !== H._c) {
      H._c = Ju.corazones;
      [...H.corazonesEl.children].forEach((el, i) => el.classList.toggle('vacio', i >= Ju.corazones));
    }
    const e = Math.round(Ju.energia);
    if (e !== H._e) {
      H._e = e; H.energiaEl.style.width = e + '%';
      H.energiaEl.className = e < 22 ? 'baja' : e < 50 ? 'media' : '';
    }
    const turbo = Ju.turbo > 0;
    if (turbo !== H._turbo) { H._turbo = turbo; document.getElementById('energia').classList.toggle('turbo', turbo); }
    if (Ju.monedas !== H._m) { H._m = Ju.monedas; H.monedasEl.textContent = Ju.monedas; }
    if (cuadro % 6 === 0) {
      J.Cielo.dibReloj(H.relojG, 52);
      const m = J.Cielo.momento();
      if (m !== H._momento) { H._momento = m; H.momentoEl.textContent = m; }
    }
  };

  J.HUD = H;
})();
