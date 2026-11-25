/* Visor de fotos: muestra en grande las fotos guardadas con la cámara.
   Se abre tocando una foto en el mundo (la camarita o el cuadrito enmarcado)
   o con el botón 🖼️ del HUD (álbum). Flechas ◀ ▶ y miniaturas para pasar
   de una foto a otra; Esc o ✕ cierra. Mientras está abierto, el juego queda en pausa. */
(function () {
  const V = { abierto: false, i: 0, lista: [] };
  const $ = (id) => document.getElementById(id);
  let raiz, lienzo, cargando, contador, fechaEl, tiras, btnAnt, btnSig, btnAlbum;

  const lista = () => { try { return (J.Fotos && J.Fotos.lista && J.Fotos.lista().slice()) || []; } catch (_) { return []; } };
  const imagen = (f) => { try { return J.Fotos.imagen(f); } catch (_) { return null; } };
  function listaImagen(im) { return im && !(im.tagName === 'IMG' && !(im.complete && im.naturalWidth)); }

  function puedeAbrir() {
    const b = document.body;
    if (!b.classList.contains('jugando')) return false;
    if (J.Dialogo && J.Dialogo.abierto) return false;
    if (J.Mapa && J.Mapa.abierto) return false;
    if (J.Espejo && J.Espejo.abierto) return false;
    if (J.Aula && J.Aula.abierto) return false;
    if (J.CamaraFotos && J.CamaraFotos.abierto) return false;
    if (J.FotosMundo && J.FotosMundo.confirmando) return false;
    return true;
  }

  function el(tag, clase, padre, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    if (padre) padre.appendChild(e);
    return e;
  }

  function crear() {
    raiz = el('div', '', document.body); raiz.id = 'visor-foto';
    raiz.setAttribute('role', 'dialog'); raiz.setAttribute('aria-modal', 'true'); raiz.setAttribute('aria-label', 'Fotos guardadas');
    const caja = el('div', 'visor-caja', raiz);
    const arriba = el('div', 'visor-arriba', caja);
    el('span', 'visor-titulo', arriba, '🖼️ Mis fotos');
    contador = el('span', 'visor-contador', arriba);
    const cerrar = el('button', 'visor-cerrar', arriba, '✕'); cerrar.type = 'button'; cerrar.setAttribute('aria-label', 'Cerrar');
    const centro = el('div', 'visor-centro', caja);
    btnAnt = el('button', 'visor-flecha', centro, '◀'); btnAnt.type = 'button'; btnAnt.setAttribute('aria-label', 'Foto anterior');
    const marco = el('div', 'visor-marco', centro);
    lienzo = el('canvas', 'visor-lienzo', marco);
    cargando = el('div', 'visor-cargando', marco, '✨ Cargando foto…');
    btnSig = el('button', 'visor-flecha', centro, '▶'); btnSig.type = 'button'; btnSig.setAttribute('aria-label', 'Foto siguiente');
    fechaEl = el('p', 'visor-fecha', caja);
    tiras = el('div', 'visor-tira', caja);

    const clic = (b, f) => b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); b.blur(); f(); });
    clic(cerrar, () => V.cerrar());
    clic(btnAnt, () => ir(V.i - 1));
    clic(btnSig, () => ir(V.i + 1));
    raiz.addEventListener('pointerdown', (e) => { if (e.target === raiz) V.cerrar(); }); // tocar afuera cierra
    // deslizar con el dedo para pasar de foto
    let x0 = null;
    marco.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    marco.addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) ir(V.i + (dx < 0 ? 1 : -1)); });

    window.addEventListener('keydown', (e) => {
      if (!V.abierto) return;
      e.stopImmediatePropagation();
      const c = e.code;
      if (c === 'Escape' || c === 'Enter' || c === 'Space') V.cerrar();
      else if (c === 'ArrowLeft' || c === 'KeyA') ir(V.i - 1);
      else if (c === 'ArrowRight' || c === 'KeyD') ir(V.i + 1);
      else return;
      e.preventDefault();
    }, true);

    // botón del álbum en el HUD, junto a la cámara
    const cont = $('botones');
    if (cont) {
      btnAlbum = el('button', ''); btnAlbum.id = 'btn-album'; btnAlbum.type = 'button';
      btnAlbum.title = 'Mis fotos'; btnAlbum.setAttribute('aria-label', 'Mis fotos');
      el('span', 'emoji', btnAlbum, '🖼️').setAttribute('aria-hidden', 'true');
      const cam = $('btn-camara');
      cont.insertBefore(btnAlbum, cam ? cam.nextSibling : cont.firstChild);
      btnAlbum.addEventListener('click', (e) => { e.stopPropagation(); btnAlbum.blur(); V.abrir(); });
    }
  }

  function fecha(f) {
    if (!f || !f.fecha) return '';
    try { return new Date(f.fecha).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch (_) { return ''; }
  }

  // dibuja la foto actual a tamaño completo (o espera a que cargue)
  function pintar() {
    if (!V.abierto) return;
    const f = V.lista[V.i], im = f && imagen(f);
    if (!listaImagen(im)) { cargando.hidden = false; lienzo.hidden = true; V._espera = requestAnimationFrame(pintar); return; }
    const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, k = Math.min(1, 1600 / Math.max(w, h));
    lienzo.width = Math.round(w * k); lienzo.height = Math.round(h * k);
    lienzo.getContext('2d').drawImage(im, 0, 0, lienzo.width, lienzo.height);
    cargando.hidden = true; lienzo.hidden = false;
    lienzo.classList.remove('entra'); void lienzo.offsetWidth; lienzo.classList.add('entra');
  }

  function miniaturas() {
    tiras.innerHTML = '';
    V.lista.forEach((f, k) => {
      const b = el('button', 'visor-mini' + (k === V.i ? ' activa' : ''), tiras); b.type = 'button';
      b.setAttribute('aria-label', 'Foto ' + (k + 1));
      const c = el('canvas', '', b); c.width = 96; c.height = 72;
      const dib = () => {
        const im = imagen(f);
        if (!listaImagen(im)) { if (V.abierto) requestAnimationFrame(dib); return; }
        const g = c.getContext('2d'), w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, s = Math.max(96 / w, 72 / h);
        g.drawImage(im, (96 - w * s) / 2, (72 - h * s) / 2, w * s, h * s);
      };
      dib();
      b.addEventListener('click', (e) => { e.stopPropagation(); b.blur(); ir(k); });
    });
  }

  function ir(k) {
    const n = V.lista.length; if (!n) return;
    V.i = (k + n) % n;
    cancelAnimationFrame(V._espera);
    contador.textContent = (V.i + 1) + ' de ' + n;
    fechaEl.textContent = fecha(V.lista[V.i]);
    btnAnt.hidden = btnSig.hidden = n < 2;
    [...tiras.children].forEach((b, j) => b.classList.toggle('activa', j === V.i));
    const act = tiras.children[V.i]; if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest', inline: 'center' });
    pintar();
    if (J.Audio && J.Audio.blip) try { J.Audio.blip(); } catch (_) {}
  }

  // abre el visor en una foto (o en la última sacada)
  V.abrir = function (foto) {
    if (V.abierto || !raiz || !puedeAbrir()) return;
    V.lista = lista().sort((a, b) => (a.fecha || 0) - (b.fecha || 0));
    if (!V.lista.length) { if (J.HUD) J.HUD.aviso('Todavía no hay fotos. ¡Sácate una con la cámara 📷!', 3); return; }
    let k = foto ? V.lista.findIndex((f) => f.id === foto.id) : -1;
    if (k < 0) k = V.lista.length - 1;
    V.abierto = true;
    const Ju = J.Jul; if (Ju) { Ju.vx = Ju.vy = 0; }
    J.Entrada.teclas = {}; if (J.Entrada._soltarPalanca) J.Entrada._soltarPalanca();
    raiz.classList.add('visible'); document.body.classList.add('viendo-foto');
    miniaturas(); ir(k);
  };
  V.cerrar = function () {
    if (!V.abierto) return;
    V.abierto = false; cancelAnimationFrame(V._espera);
    raiz.classList.remove('visible'); document.body.classList.remove('viendo-foto');
    if (J.Entrada && J.Entrada.consumirSalto) J.Entrada.consumirSalto();
  };

  V.iniciar = function () {
    if (raiz) return;
    crear();
    // tocar una foto en el mundo la abre en grande
    const juego = $('juego');
    if (juego) juego.addEventListener('pointerup', (e) => {
      if (V.abierto || !puedeAbrir() || !J.FotosMundo || !J.FotosMundo.fotoEn || !J.pantallaAMundo) return;
      const p = J.pantallaAMundo(e.clientX, e.clientY), f = J.FotosMundo.fotoEn(p.x, p.y);
      if (f) { e.preventDefault(); V.abrir(f); }
    });
  };

  J.VisorFotos = V;
})();
