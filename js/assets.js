/* Cargador de recursos de ./mundo/ con respaldo procedural.
   Lee la lista de mundo/recursos.js (J.RECURSOS). Nunca bloquea el juego:
   si una imagen falta o no carga, ese elemento se dibuja por código. */
(function () {
  const A = { img: {}, alCambiar: [] };
  const HUECOS = ['fondoTitulo', 'pasto', 'camino', 'agua'];

  A.cargar = function () {
    const lista = J.RECURSOS || {};
    HUECOS.forEach((k) => {
      const nombre = lista[k];
      if (!nombre) return; // sin recurso: respaldo procedural
      const im = new Image();
      im.onload = () => {
        if (!im.naturalWidth) return;
        A.img[k] = im;
        A.alCambiar.forEach((f) => f(k, im));
      };
      im.onerror = () => console.info('[mundo] no se pudo cargar "' + nombre + '": se dibuja por código');
      im.src = J.CFG.CARPETA_MUNDO + encodeURI(nombre);
    });
  };

  J.Assets = A;
})();
