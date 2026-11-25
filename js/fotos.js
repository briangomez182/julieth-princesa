/* Fotos de la cámara: persistencia de las fotos que se saca Julieth.
   La ubicación (x, y del mundo) vive en localStorage; la imagen va al servidor
   Node (carpeta img/cameraShot) y, si no hay servidor, a IndexedDB. */
(function () {
  window.J = window.J || {};

  const CLAVE = 'julieth-fotos';
  const BASE = 'julieth-fotos', STORE = 'imagenes';

  const F = {
    hayServidor: false,
    alCambiar: []
  };

  let fotos = [];
  const cache = {};    // id -> { img, listo, roto, url }
  let dbProm = null;

  // ---------- localStorage ----------
  function cargarLista() {
    try {
      const crudo = window.localStorage && localStorage.getItem(CLAVE);
      const arr = crudo ? JSON.parse(crudo) : [];
      if (!Array.isArray(arr)) return;
      fotos.length = 0;
      for (const f of arr) {
        if (!f || typeof f.id !== 'string' || !isFinite(f.x) || !isFinite(f.y)) continue;
        fotos.push({
          id: f.id, x: +f.x, y: +f.y,
          fecha: +f.fecha || 0,
          archivo: typeof f.archivo === 'string' ? f.archivo : null,
          local: !!f.local
        });
      }
    } catch (e) { /* lista corrupta o sin acceso: arrancamos vacía */ }
  }

  function guardarLista() {
    try { localStorage.setItem(CLAVE, JSON.stringify(fotos)); } catch (e) { /* sin lugar o bloqueado */ }
  }

  function avisar() {
    for (const cb of F.alCambiar.slice()) {
      try { cb(fotos); } catch (e) { console.error('J.Fotos.alCambiar', e); }
    }
  }

  // ---------- IndexedDB ----------
  function abrirDB() {
    if (dbProm) return dbProm;
    dbProm = new Promise((ok, mal) => {
      let idb = null;
      try { idb = window.indexedDB; } catch (e) { idb = null; }
      if (!idb) { mal(new Error('Sin IndexedDB')); return; }
      let pedido;
      try { pedido = idb.open(BASE, 1); } catch (e) { mal(e); return; }
      pedido.onupgradeneeded = () => {
        const db = pedido.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      pedido.onsuccess = () => ok(pedido.result);
      pedido.onerror = () => mal(pedido.error || new Error('No abrió IndexedDB'));
      pedido.onblocked = () => mal(new Error('IndexedDB bloqueada'));
    });
    dbProm.catch(() => { dbProm = null; }); // si falla, que pueda reintentar más adelante
    return dbProm;
  }

  function operacionDB(modo, hacer) {
    return abrirDB().then((db) => new Promise((ok, mal) => {
      let tx;
      try { tx = db.transaction(STORE, modo); } catch (e) { mal(e); return; }
      const pedido = hacer(tx.objectStore(STORE));
      tx.oncomplete = () => ok(pedido ? pedido.result : undefined);
      tx.onerror = () => mal(tx.error || new Error('Falló IndexedDB'));
      tx.onabort = () => mal(tx.error || new Error('IndexedDB abortada'));
    }));
  }

  const dbPoner = (id, blob) => operacionDB('readwrite', (s) => s.put(blob, id));
  const dbLeer = (id) => operacionDB('readonly', (s) => s.get(id));
  const dbBorrar = (id) => operacionDB('readwrite', (s) => s.delete(id));

  // ---------- servidor ----------
  function puedeFetch() {
    return typeof fetch === 'function' && !(window.location && window.location.protocol === 'file:');
  }

  function detectarServidor() {
    if (!puedeFetch()) { F.hayServidor = false; return Promise.resolve(false); }
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    let reloj = null;
    const tiempo = new Promise((ok) => {
      reloj = setTimeout(() => { if (ctrl) ctrl.abort(); ok(null); }, 1500);
    });
    const consulta = fetch('api/estado', { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    return Promise.race([consulta, tiempo]).then((res) => {
      clearTimeout(reloj);
      F.hayServidor = !!(res && res.ok === true);
      return F.hayServidor;
    });
  }

  function blobADataURL(blob) {
    return new Promise((ok, mal) => {
      try {
        const lector = new FileReader();
        lector.onload = () => ok(lector.result);
        lector.onerror = () => mal(lector.error || new Error('No se pudo leer el blob'));
        lector.readAsDataURL(blob);
      } catch (e) { mal(e); }
    });
  }

  function subir(id, blob) {
    if (!F.hayServidor || !puedeFetch()) return Promise.reject(new Error('Sin servidor'));
    return blobADataURL(blob)
      .then((imagen) => fetch('api/fotos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, imagen })
      }))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((res) => {
        if (!res || !res.ok || typeof res.archivo !== 'string') throw new Error('Respuesta inválida');
        return res.archivo;
      });
  }

  // ---------- imágenes ----------
  function cargarImagen(foto) {
    if (cache[foto.id]) return;
    const ent = { img: null, listo: false, roto: false, url: null };
    cache[foto.id] = ent;
    if (typeof Image !== 'function') { ent.roto = true; return; }

    const usar = (src, esObjeto) => {
      const img = new Image();
      img.onload = () => {
        if (cache[foto.id] !== ent) return; // la borraron mientras cargaba
        ent.listo = true;
        avisar();
      };
      img.onerror = () => {
        ent.roto = true; // no reintentamos: queda rota hasta recargar la página
        if (esObjeto) { try { URL.revokeObjectURL(src); } catch (e) { /* nada */ } }
      };
      ent.img = img;
      if (esObjeto) ent.url = src;
      img.src = src;
    };

    if (foto.archivo) {
      usar(foto.archivo, false);
    } else if (foto.local) {
      dbLeer(foto.id).then((blob) => {
        if (cache[foto.id] !== ent) return;
        if (!blob) { ent.roto = true; return; }
        usar(URL.createObjectURL(blob), true);
      }).catch(() => { ent.roto = true; });
    } else {
      ent.roto = true;
    }
  }

  function soltarImagen(id) {
    const ent = cache[id];
    if (!ent) return;
    if (ent.url) { try { URL.revokeObjectURL(ent.url); } catch (e) { /* nada */ } }
    delete cache[id];
  }

  // ---------- API pública ----------
  F.iniciar = function () {
    cargarLista();
    return detectarServidor()
      .catch(() => { F.hayServidor = false; return false; })
      .then(() => {
        for (const f of fotos) cargarImagen(f);
        return fotos;
      });
  };

  F.lista = () => fotos;

  F.agregar = function (blob, x, y) {
    const id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const foto = { id, x: +x || 0, y: +y || 0, fecha: Date.now(), archivo: null, local: false };
    const enLocal = () => dbPoner(id, blob).then(() => { foto.local = true; });
    return subir(id, blob)
      .then((archivo) => { foto.archivo = archivo; })
      .catch(() => enLocal())
      .then(() => {
        fotos.push(foto);
        guardarLista();
        // si la imagen ya la tenemos en memoria, la cacheamos directo desde el blob
        try {
          if (typeof Image === 'function' && typeof URL !== 'undefined' && URL.createObjectURL) {
            const ent = { img: new Image(), listo: false, roto: false, url: URL.createObjectURL(blob) };
            cache[id] = ent;
            ent.img.onload = () => { if (cache[id] === ent) { ent.listo = true; avisar(); } };
            ent.img.onerror = () => { ent.roto = true; };
            ent.img.src = ent.url;
          } else {
            cargarImagen(foto);
          }
        } catch (e) { cargarImagen(foto); }
        avisar();
        return foto;
      });
  };

  F.borrar = function (id) {
    const i = fotos.findIndex((f) => f.id === id);
    if (i < 0) return Promise.resolve(false);
    const foto = fotos[i];
    fotos.splice(i, 1);
    guardarLista();
    soltarImagen(id);
    const tareas = [];
    if (foto.archivo && puedeFetch()) {
      tareas.push(fetch('api/fotos/' + encodeURIComponent(id), { method: 'DELETE' }).catch(() => null));
    }
    if (foto.local) tareas.push(dbBorrar(id).catch(() => null));
    avisar();
    return Promise.all(tareas).then(() => true);
  };

  F.imagen = function (foto) {
    if (!foto) return null;
    const ent = cache[foto.id];
    if (!ent) { cargarImagen(foto); return null; }
    return ent.listo && !ent.roto ? ent.img : null;
  };

  F.cerca = function (x, y, radio) {
    let mejor = null, mejorD = radio * radio;
    for (const f of fotos) {
      const dx = f.x - x, dy = f.y - y, d = dx * dx + dy * dy;
      if (d <= mejorD) { mejor = f; mejorD = d; }
    }
    return mejor;
  };

  J.Fotos = F;
})();
