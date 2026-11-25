/* ============================================================
   La Aventura de la Princesa Julieth — configuración general
   Todos los números "ajustables" del juego viven aquí.
   ============================================================ */
window.J = window.J || {};

J.CFG = {
  // Tamaño del mundo (unidades de mundo ≈ píxeles a zoom 1)
  MUNDO_W: 11000, // el reino original (5200×3800) quedó arriba a la izquierda; luego creció a 8400×6000
  MUNDO_H: 8000,  // y ahora a 11000×8000 con 11 castillos (Luna y Volcán al este, Trueno, Mar y Dunas al sur, y El Huerto)
  SEMILLA: 20261115,

  // Ciclo día / noche: segundos que dura CADA etapa (amanecer, mañana, tarde, atardecer y noche).
  // 600 = 10 minutos por etapa → un día completo dura 50 minutos.
  ETAPA_SEG: 600,
  HORA_INICIAL: 0.12, // 0 = amanecer, 0.3 = mediodía, 0.58 = atardecer, 0.8 = noche

  // Julieth
  VEL_CAMINAR: 200,
  VEL_CORRER: 345,
  IMPULSO_SALTO: 730,
  GRAVEDAD: 2250,
  CORAZONES: 5,
  INVULNERABLE_SEG: 3,
  SIESTA_SEG: 4.5,

  // Energía (0–100)
  GASTO_QUIETA: 0.0,
  GASTO_CAMINAR: 0.55,
  GASTO_CORRER: 2.1,

  // Comida: cuánta energía da cada cosa y cuántos segundos de velocidad extra
  COMIDA: {
    manzana:  { energia: 16, turbo: 3 },
    fresa:    { energia: 12, turbo: 3 },
    pastel:   { energia: 32, turbo: 4 },
    estrella: { energia: 55, turbo: 9 }
  },

  // Monedas gigantes: cuántas hay en el reino (sube o baja estos números a gusto)
  MONEDAS: {
    cadaCuantoEnCamino: 480,  // distancia entre monedas a lo largo de los caminos
    porPatio: 4,              // monedas en el patio de cada castillo
    sueltasEnCampo: 35,       // monedas repartidas por las praderas
    reaparecenSeg: 150        // segundos que tarda en volver una moneda recogida
  },

  // Corazones flotantes: solo dentro de los salones de los castillos (cada uno da 1 corazón)
  CORAZONES_CASTILLO: {
    porCastillo: 3,           // cuántos corazones flotan en cada salón
    reaparecenSeg: 90         // segundos que tarda en volver un corazón recogido
  },

  // Recursos de la carpeta ./mundo/: se declaran en mundo/recursos.js.
  // Lo que no esté allí (o no cargue) se dibuja por código.
  CARPETA_MUNDO: 'mundo/',

  // Paleta del mundo (tomada de los tonos del arte de referencia de ./mundo)
  COLOR: {
    pasto: '#5fcf5a', pastoOscuro: '#3fae4a', pastoClaro: '#8be36a',
    bosque: '#2f8f4e', cristal: '#bfe9ff', nube: '#ffffff',
    agua: '#3ec9f0', aguaClara: '#a8f0ff', aguaBorde: '#1e9ad1',
    ladrillo: '#ffd23f', ladrilloOscuro: '#e8a81c', ladrilloClaro: '#fff0a0',
    oro: '#ffc93c', oroOscuro: '#e08a00', oroClaro: '#fff6b0',
    rosa: '#ff5d8f', baya: '#7a2b6b', crema: '#fff6e5'
  }
};
