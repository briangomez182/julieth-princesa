# La Aventura de la Princesa Julieth

Videojuego web de mundo abierto protagonizado por la princesa Julieth.
Funciona directo en el navegador, sin instalar nada y sin conexión.

## Cómo jugar

Abre `index.html` con doble clic (Chrome, Safari, Edge o Firefox).

| Acción  | Teclado                  | Tablet / celular           |
|---------|--------------------------|----------------------------|
| Caminar | `W A S D` o flechas      | Palanca (lado izquierdo)   |
| Correr  | `Shift` (mantener)       | Botón **Correr**           |
| Saltar  | `Espacio`                | Botón **Saltar**           |
| Hablar  | `E` o `Enter`            | Botón **Hablar**           |
| Subir / bajar (auto, caballito, bote) | `E` o `F` | Botón **Subir** / **Bajar** |
| Cambiar el clima | `C`             | —                          |
| Mapa    | `M`                      | Botón del minimapa (abajo a la izquierda) |
| Pausa   | `Esc` o `P`              | Botón de pausa             |

- **Monedas gigantes**: tócalas para sumarlas al contador.
- **Cajas sorpresa doradas**: salta desde abajo para que suelten frutas o monedas.
- **Hongos gigantes**: cae encima para rebotar muy alto (mantén Saltar para subir más).
- **Portales arcoíris**: atajos; los del mismo color están conectados. Hay varios pares repartidos
  por el reino para llegar rápido a los castillos más lejanos.
- **Comida** (manzana, fresa, pastel, estrella): recarga la energía y da velocidad extra.
- **Corazones flotantes**: solo dentro de los salones de los castillos (3 en cada uno). Cada uno
  devuelve 1 corazón; si los corazones están llenos, el corazón se queda esperando. Vuelven a aparecer
  a los 90 segundos (números en `js/config.js`, en `CORAZONES_CASTILLO`).
- **Peligros** (cactus dormilón, caracol gruñón, zarza, charco): quitan un corazón, pero
  nunca hay Game Over. Sin corazones o sin energía, Julieth toma una siesta y sigue.
  A los caracoles se les puede saltar encima.
- **Castillos por dentro**: camina hasta la puerta de un castillo para entrar a su salón.
  Para salir, baja por la alfombra hasta las flechas.
- **Príncipes**: en cada salón vive un príncipe (ver la tabla de castillos). Acércate y
  pulsa **Hablar**: cuenta la historia del castillo, un secreto y tiene un regalo.
  En la conversación se elige con las flechas y `Enter`/`Espacio`, con los números `1`–`4`,
  o tocando los botones. Si el dispositivo tiene una voz en español, el príncipe lee en voz
  alta (se apaga con el botón de sonidos).
- **Espejo mágico**: cada salón tiene un espejo dorado a la izquierda del trono. Acércate y pulsa
  **Hablar**: el Espejito Mágico aparece en primer plano y con voz pregunta *"¿quién es la más bonita
  de todo el reino?"*, piensa 5 segundos y responde *"¡Julieth y Giulia!"*. Después abre la cámara
  frontal para que se vean reflejadas en el espejo (el navegador pide permiso la primera vez).
  Se cierra con `E`, `Esc` o el botón **Cerrar**. Los textos y la espera están al principio de `js/espejo.js`.
  Si la cámara no abre con doble clic en `index.html`, abre el juego desde un servidor local
  (por ejemplo `python3 -m http.server` y luego `http://localhost:8000`).
- **Minimapa**: abajo a la izquierda (arriba, en pantallas táctiles). Muestra la zona donde estás
  y los castillos: los que faltan tienen un aro dorado, y los visitados llevan una tilde verde.
  Al tocarlo (o pulsar `M`) se abre el mapa completo del reino. Mientras está abierto, Julieth se queda quieta.
- **Meta**: visitar los 10 castillos para ganar una corona. Luego se puede repetir.
  Los iconos de arriba muestran cuáles faltan (en pantallas angostas van en 2 filas de 5).

Las monedas y coronas se guardan en el navegador.

## Mundo ampliado

El reino mide 11000 × 8000 (el mapa original quedó arriba a la izquierda). Hay zonas nuevas:
**Pradera de las Flores**, **Llanura del Sur** y **Campo del Este** (praderas abiertas, sin
obstáculos, ideales para ir en auto), las **Colinas Nevadas** al noreste, el **Lago Espejo**
y un río que cruza todo el reino y sale por el este. Más allá están el **Valle de la Luna**,
la **Montaña de Fuego** (un volcán simpático), la **Llanura de la Tormenta**, la **Costa Coral**
con la **Bahía Coral** (se navega en el bote-cisne, tiene muelle) y el **Desierto Dorado**.
El mapa completo (`M`) muestra los nombres, los muelles y dónde están los vehículos
(punto rosa = auto, lila = caballito, blanco = bote).

## Los 10 castillos

Cada castillo tiene su elemento, su salón y su príncipe. El orden es el de los iconos del HUD.

| # | id        | Castillo               | Dónde está             | Príncipe          | Elemento               |
|---|-----------|------------------------|------------------------|-------------------|------------------------|
| 0 | `real`    | Castillo Real          | Centro del reino       | Príncipe Leo      | Corazón y amor         |
| 1 | `bosque`  | Castillo del Bosque    | Bosque                 | Príncipe Roble    | Naturaleza             |
| 2 | `cristal` | Castillo de Cristal    | Zona de cristal        | Príncipe Zafiro   | Gemas                  |
| 3 | `nubes`   | Castillo de las Nubes  | Zona de las nubes      | Príncipe Nimbo    | Aire                   |
| 4 | `hielo`   | Castillo de Hielo      | Colinas Nevadas        | Príncipe Escarcha | Hielo                  |
| 5 | `luna`    | Castillo de la Luna    | Valle de la Luna       | Príncipe Lucero   | Estrellas y luz de luna |
| 6 | `fuego`   | Castillo del Volcán    | Montaña de Fuego       | Príncipe Brasa    | Fuego                  |
| 7 | `trueno`  | Castillo del Trueno    | Llanura de la Tormenta | Príncipe Centella | Rayo y tormenta        |
| 8 | `mar`     | Castillo del Mar       | Costa Coral            | Príncipe Coral    | Agua y mar             |
| 9 | `arena`   | Castillo de las Dunas  | Desierto Dorado        | Príncipe Oasis    | Arena y tierra         |

## Clima

El clima cambia solo, con transiciones suaves, y siempre vuelve el sol entre un clima y otro.
Con `C` se pasa al siguiente a mano (despejado → lluvia → viento → nieve).

- **Lluvia**: gotas, cielo gris y charquitos que se pueden salpicar (no hacen daño).
- **Viento**: hojas y pétalos volando; empuja suavemente a Julieth cuando camina.
- **Nieve**: copos y el suelo se cubre de blanco poco a poco; mientras haya nieve, el piso resbala.
- **Floración**: al volver el sol después de la lluvia o la nieve, las flores se abren de forma especial
  (más grandes y brillantes con rocío, o con colores fríos y escarcha).
- Dentro de los castillos no llueve ni nieva.

Los números del clima están al principio de `js/clima.js`, en `CLIMA`.

## Vehículos

Junto a la salida, cerca de los castillos y en cada pradera abierta hay vehículos estacionados
(un círculo punteado marca su parada). Acércate y pulsa `E` (o el botón **Subir**). Para bajar, `E` otra vez.

- **Auto de princesa** (kart rosa): casi el doble de rápido que correr. Con `Shift` + girar derrapa;
  al soltar sale un mini-turbo (azul, naranja o rosa según cuánto derrapó). `Espacio` toca la bocina y da un saltito.
- **Caballito balancín**: gira al instante, galopa con `Shift` y con `Espacio` da un salto grande
  (sube a colinas y rebota en los hongos).
- Mientras va montada, los peligros no le quitan corazones (el vehículo rebota). Los vehículos no entran al agua.
- Un vehículo abandonado lejos vuelve solo a su parada después de un rato.

Los números están al principio de `js/vehiculos.js`, en `VEHICULOS`.

## Bote-cisne

Hay muelles de madera en el río y en el Lago Espejo. Camina por un muelle hacia el agua (o pulsa `E`
cerca de él) y el bote-cisne acude para que Julieth suba. Se rema con las flechas, `Shift` rema más rápido
y la corriente del río lo lleva despacito. Para bajar: empuja contra la orilla, pulsa `Espacio` cerca de
tierra o pulsa `E`. Si no hay orilla cerca, el cisne la lleva al muelle más próximo. De noche, los muelles
tienen farolitos. Los números están al principio de `js/bote.js`, en `BOTE`.

## Duquesa Giulia Bebé

Una duquesita bebé (vestido lila, tiara plateada, pelo negro corto con rulos, piel morena y chupete) acompaña a Julieth a
todas partes. Repite lo que hace Julieth **1 segundo después** (camina por el mismo camino, salta,
celebra, duerme la siesta) y siempre se queda un par de metros atrás, sin pegarse ni separarse.
Se sube al auto, al caballito y al bote-cisne sentada detrás de Julieth (también 1 segundo después),
y se baja de un saltito. En los portales arcoíris el túnel la succiona junto con Julieth (se achica
y gira) y sale girando del otro lado con ella. Si queda lejos (por ejemplo al entrar a un castillo),
aparece a su lado con brillitos.
Los números están al principio de `js/giulia.js`, en `GIULIA` (`DEMORA`, `DISTANCIA`, `LEJOS`).

## Cámara de fotos

Julieth puede sacarse fotos con la cámara frontal en cualquier punto del mapa. Para que queden
guardadas como archivos, inicia el servidor local (solo hace falta Node.js, sin instalar nada más):

```
node servidor.js
```

y abre `http://localhost:8000` (otro puerto: `PORT=9000 node servidor.js`).

- Las fotos se guardan en la carpeta `img/cameraShot/`, y el lugar del mapa donde se sacó cada una
  queda en el `localStorage` del navegador.
- El navegador solo deja usar la cámara en `localhost` o con `https`. El servidor también muestra
  la dirección de la red (para abrirlo desde una tablet), pero por IP de red sin `https` la cámara
  puede no funcionar.
- Si no hay servidor (por ejemplo, abriendo `index.html` con doble clic), las fotos se guardan
  igual en el navegador (IndexedDB) como respaldo.

## Carpeta `mundo/` (recursos visuales)

El archivo `mundo/recursos.js` indica qué imágenes de la carpeta usa el juego:

```js
J.RECURSOS = {
  fondoTitulo: 'representacion-3d-escenario-carretera_23-2151293959.avif',
  pasto: null,   // textura repetible del pasto
  camino: null,  // textura repetible del camino
  agua: null     // textura repetible del río
};
```

Pon el nombre del archivo en el hueco que quieras cambiar. Lo que quede en `null`
(o no cargue) se dibuja por código, así el juego siempre funciona.
Las texturas deben ser cuadradas y sin costuras (256×256 o 512×512 px).

## Estructura del código

```
index.html          Página, HUD y controles táctiles
css/estilo.css      Estilos de la interfaz
mundo/recursos.js   Lista de recursos de la carpeta mundo/
js/config.js        Todos los números ajustables (velocidad, duración del día, etc.)
js/util.js          Matemática, colores y azar con semilla
js/assets.js        Carga de recursos con respaldo procedural
js/audio.js         Efectos y música sintetizados con Web Audio API
js/entrada.js       Teclado y controles táctiles
js/particulas.js    Polvo, destellos, confeti, burbujas Zzz
js/dibujo.js        Arte del mundo: suelo, castillos, árboles, objetos, peligros
js/mundo.js         Generación del mapa (11000 × 8000), agua, muelles, zonas y colisiones
js/interior_arte.js Arte de los salones, tronos, columnas y los diez príncipes
js/julieth.js       La princesa: movimiento, energía, corazones, siesta y dibujo
js/giulia.js        La Duquesa Giulia Bebé: la sigue con 1 s de demora y viaja en los vehículos
js/entidades.js     Reglas de monedas, comida, cajas, hongos, portales y castillos
js/vehiculos.js     Auto de princesa y caballito balancín (manejo, sonido y dibujo)
js/bote.js          Bote-cisne, muelles, ondas y corriente del río
js/clima.js         Lluvia, viento, nieve, charcos y floración de las flores
js/mapa.js          Minimapa y mapa completo del reino
js/interior.js      Entrar y salir de los castillos por la puerta
js/dialogo.js       Conversaciones con los príncipes (aquí están los textos)
js/espejo.js        Espejo mágico: voz, suspenso, respuesta y cámara frontal
js/cielo.js         Ciclo día/noche, luces, nubes, estrellas y luciérnagas
js/hud.js           Corazones, energía, contador de monedas y avisos
js/main.js          Cámara, bucle principal y subir/bajar unificado (E, F, botón)
```

## Ajustes rápidos (`js/config.js`)

- `ETAPA_SEG`: segundos que dura cada etapa del día (amanecer, mañana, tarde, atardecer y noche).
  600 por defecto = 10 minutos cada una, así un día completo dura 50 minutos.
- `VEL_CAMINAR`, `VEL_CORRER`, `IMPULSO_SALTO`: movimiento de Julieth.
- `CORAZONES`, `INVULNERABLE_SEG`, `SIESTA_SEG`: daño amigable y siesta.
- `GASTO_CAMINAR`, `GASTO_CORRER`, `COMIDA`: sistema de energía.
- `SEMILLA`: cambia el número para generar un reino distinto.

## Cantidad de monedas

Los números están en `js/config.js`, en `MONEDAS`: cuántas monedas hay en los caminos,
en cada patio, y sueltas por el campo, y cada cuánto vuelven las que recojas.

## Cambiar las historias de los príncipes

Los textos están al principio de `js/dialogo.js`, en `HISTORIAS`. Cada castillo tiene
`saludo`, `historia` (una frase por pantalla), `secreto`, `regalo` y `adios`.
Los nombres y colores de los príncipes están en `PRINCIPE`, en `js/interior_arte.js`.

Para probar desde la consola: `J.depurar.clima('nieve')`, `J.depurar.ir(x, y)`, `J.depurar.hora(0.85)` (noche),
`J.depurar.castillo('luna')` (lleva a Julieth al patio de ese castillo).
Ids de los castillos: `real`, `bosque`, `cristal`, `nubes`, `hielo`, `luna`, `fuego`, `trueno`, `mar`, `arena`.

Agrega `?fps` a la dirección (`index.html?fps`) para ver los cuadros por segundo.
