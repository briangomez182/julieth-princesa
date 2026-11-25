/* Preguntas del espejo mágico: "¿Quién ...? ¿Julieth o Giulia?".
   Cada castillo tiene su propia lista (algunas tematizadas). Las preguntas
   de edad tienen respuesta fija; el resto se decide al azar (~75% Julieth).

   API (J.EspejoPreguntas):
     lista(castilloId)                    preguntas del castillo (o las de 'real')
     azar(castilloId, excluirIds)         una al azar, evitando esos ids
     opciones(castilloId, excluirIds, n)  n distintas al azar (por defecto 4)
     ganadora(pregunta)                   'Julieth' | 'Giulia'
     respuesta(pregunta, ganadora)        frase que dice el espejo */
(function () {
  var J_ = 'Julieth', G_ = 'Giulia';

  // Arma una pregunta. 'que' es lo que va después de "¿Quién ".
  function q(id, que, corta, rJ, rG, fija) {
    var r = {};
    if (rJ) r[J_] = rJ;
    if (rG) r[G_] = rG;
    return { id: id, texto: '¿Quién ' + que + '? ¿Julieth o Giulia?', corta: corta, fija: fija, respuesta: r };
  }

  // Preguntas de edad (respuesta real), reutilizables en varios castillos.
  function menor(id) {
    return q(id, 'es la menor', 'Quién es la menor', null,
      '¡Giulia! Tiene 1 añito y Julieth tiene 5.', G_);
  }
  function mayor(id) {
    return q(id, 'es la mayor', 'Quién es la mayor',
      '¡Julieth! Tiene 5 años y Giulia tiene 1 añito.', null, J_);
  }
  function chiquitita(id) {
    return q(id, 'es la más chiquitita', 'Quién es la más chiquitita', null,
      '¡Giulia! Es la bebé del reino, con su añito.', G_);
  }
  function hermanaMayor(id) {
    return q(id, 'es la hermana mayor', 'Quién es la hermana mayor',
      '¡Julieth! Con sus 5 años cuida a su hermanita.', null, J_);
  }

  var DATOS = {
    real: [
      menor('real-1'),
      mayor('real-2'),
      q('real-3', 'quiere más a papá', 'Quién quiere más a papá',
        '¡Julieth! Quiere a papá más que a todas las estrellas.',
        '¡Giulia! Le da a papá besitos de mariposa.'),
      q('real-4', 'ama más a mamá', 'Quién ama más a mamá',
        '¡Julieth! Ama a mamá con todo su corazón de princesa.',
        '¡Giulia! Ama a mamá desde la cabecita hasta los pies.'),
      q('real-5', 'da los abrazos más fuertes', 'Quién abraza más fuerte',
        '¡Julieth! Sus abrazos son fuertes como un oso dorado.',
        '¡Giulia! Abraza tan fuerte que no te suelta más.'),
      q('real-6', 'se porta como una princesa', 'Quién se porta de princesa',
        '¡Julieth! Saluda, sonríe y comparte como una princesa.',
        '¡Giulia! Es una princesita con corona de rulos.'),
      q('real-7', 'tiene la sonrisa más grande', 'Quién sonríe más grande',
        '¡Julieth! Su sonrisa ilumina todo el castillo.',
        '¡Giulia! Su sonrisa tiene dientitos nuevos.'),
      q('real-8', 'baila mejor en el gran salón', 'Quién baila mejor en salón',
        '¡Julieth! Gira y gira como una reina del baile.',
        '¡Giulia! Baila moviendo la colita sin parar.'),
      q('real-9', 'cuida mejor a su hermana', 'Quién cuida a su hermana',
        '¡Julieth! Siempre cuida a Giulia con mucho amor.',
        '¡Giulia! Le lleva sus juguetes a Julieth para que no esté triste.')
    ],
    bosque: [
      q('bosque-1', 'corre más rápido', 'Quién corre más rápido',
        '¡Julieth! Corre tan rápido como el viento del reino.',
        '¡Giulia! Gatea más rápido que un conejito.'),
      q('bosque-2', 'trepa como una ardillita', 'Quién trepa como ardillita',
        '¡Julieth! Sube a los árboles como una ardillita valiente.',
        '¡Giulia! Trepa al sillón como una ardillita bebé.'),
      q('bosque-3', 'encuentra más hongitos', 'Quién encuentra más hongitos',
        '¡Julieth! Encontró hongitos rojos detrás de cada árbol.',
        '¡Giulia! Encontró un hongito y le dio un besito.'),
      q('bosque-4', 'se hace amiga de los pajaritos', 'Quién es amiga de pajaritos',
        '¡Julieth! Los pajaritos le cantan cuando pasa.',
        '¡Giulia! Los pajaritos vienen a escuchar sus balbuceos.'),
      q('bosque-5', 'salta más alto', 'Quién salta más alto',
        '¡Julieth! Salta tan alto que toca las hojas.',
        '¡Giulia! Salta en los brazos de papá hasta el cielo.'),
      q('bosque-6', 'junta las flores más lindas', 'Quién junta flores lindas',
        '¡Julieth! Hizo un ramo de flores para mamá.',
        '¡Giulia! Agarró una flor chiquita con su manito.'),
      q('bosque-7', 'imita mejor al búho', 'Quién imita mejor al búho',
        '¡Julieth! Hace uh uh como el búho más sabio.',
        '¡Giulia! Abre los ojotes como un búho bebé.'),
      q('bosque-8', 'ama más a los animalitos', 'Quién ama a los animalitos',
        '¡Julieth! Quiere a todos los animalitos del bosque.',
        '¡Giulia! Abraza a cada animalito que ve.'),
      chiquitita('bosque-9')
    ],
    cristal: [
      q('cristal-1', 'tiene los ojos más brillantes', 'Quién tiene ojos brillantes',
        '¡Julieth! Sus ojos brillan más que mil cristales.',
        '¡Giulia! Sus ojitos brillan como diamantes chiquitos.'),
      q('cristal-2', 'es la más ordenada', 'Quién es más ordenada',
        '¡Julieth! Guarda sus juguetes como una princesa.',
        '¡Giulia! Pone cada cosita en su lugar, a su manera.'),
      q('cristal-3', 'dibuja más lindo', 'Quién dibuja más lindo',
        '¡Julieth! Dibuja castillos, soles y corazones.',
        '¡Giulia! Hace garabatos mágicos de colores.'),
      q('cristal-4', 'cuenta mejor hasta diez', 'Quién cuenta hasta diez',
        '¡Julieth! Cuenta hasta diez y más todavía.',
        '¡Giulia! Ya dice uno, y eso es un montón.'),
      q('cristal-5', 'canta más bonito', 'Quién canta más bonito',
        '¡Julieth! Canta y los cristales tintinean de alegría.',
        '¡Giulia! Canta la la la y todos aplauden.'),
      q('cristal-6', 'es la más curiosa', 'Quién es más curiosa',
        '¡Julieth! Siempre pregunta por qué, por qué y por qué.',
        '¡Giulia! Todo lo quiere tocar y mirar.'),
      q('cristal-7', 'comparte más sus juguetes', 'Quién comparte sus juguetes',
        '¡Julieth! Le presta sus juguetes a todos.',
        '¡Giulia! Te da su chupete para compartir.'),
      q('cristal-8', 'hace las caritas más graciosas', 'Quién hace caritas graciosas',
        '¡Julieth! Hace caritas que hacen reír al espejo.',
        '¡Giulia! Arruga la nariz y todos se ríen.'),
      mayor('cristal-9')
    ],
    nubes: [
      q('nubes-1', 'se ríe más fuerte', 'Quién se ríe más fuerte',
        '¡Julieth! Se ríe tan fuerte que tiemblan las nubes.',
        '¡Giulia! Su risita se escucha en todo el cielo.'),
      q('nubes-2', 'vuela más alto en la hamaca', 'Quién vuela alto en hamaca',
        '¡Julieth! Se hamaca tan alto que toca las nubes.',
        '¡Giulia! Se hamaca con papá y grita de alegría.'),
      q('nubes-3', 'es la más suavecita', 'Quién es más suavecita',
        '¡Julieth! Es suave como una nube de algodón.',
        '¡Giulia! Tiene cachetitos suaves como nubecitas.'),
      q('nubes-4', 've más formas en las nubes', 'Quién ve formas en las nubes',
        '¡Julieth! Vio un dragón, un gatito y un corazón.',
        '¡Giulia! Señala las nubes y dice ahí, ahí.'),
      q('nubes-5', 'da los besos más dulces', 'Quién da besos más dulces',
        '¡Julieth! Da besos dulces como algodón de azúcar.',
        '¡Giulia! Da besitos babosos llenos de amor.'),
      q('nubes-6', 'es la más alegre', 'Quién es más alegre',
        '¡Julieth! Está alegre como un día de sol.',
        '¡Giulia! Aplaude feliz por cualquier cosita.'),
      q('nubes-7', 'sopla mejor los globos', 'Quién sopla mejor los globos',
        '¡Julieth! Sopla globos grandotes de colores.',
        '¡Giulia! Sopla fuerte y salen burbujitas.'),
      q('nubes-8', 'llega más alto en puntitas', 'Quién llega alto en puntitas',
        '¡Julieth! Se pone en puntitas y casi llega al cielo.',
        '¡Giulia! Levanta los bracitos para que la alcen.'),
      menor('nubes-9')
    ],
    hielo: [
      q('hielo-1', 'hace el muñeco de nieve más grande', 'Quién hace el mejor muñeco',
        '¡Julieth! Hizo un muñeco de nieve más alto que papá.',
        '¡Giulia! Hizo una bolita de nieve chiquitita y perfecta.'),
      q('hielo-2', 'patina mejor sobre el hielo', 'Quién patina sobre el hielo',
        '¡Julieth! Patina dando vueltas como una reina de hielo.',
        '¡Giulia! Se desliza sentadita y se ríe.'),
      q('hielo-3', 'aguanta mejor el frío', 'Quién aguanta mejor el frío',
        '¡Julieth! No le tiene miedo al frío del reino.',
        '¡Giulia! Con su gorrito no siente nada de frío.'),
      q('hielo-4', 'hace los ángeles de nieve más lindos', 'Quién hace ángeles de nieve',
        '¡Julieth! Hizo un ángel de nieve con alas gigantes.',
        '¡Giulia! Hizo un angelito de nieve chiquito.'),
      q('hielo-5', 'toma más chocolatada caliente', 'Quién toma más chocolatada',
        '¡Julieth! Toma chocolatada y queda con bigotes.',
        '¡Giulia! Toma su leche tibia toda enterita.'),
      q('hielo-6', 'tira más bolas de nieve', 'Quién tira bolas de nieve',
        '¡Julieth! Tira bolas de nieve con mucha puntería.',
        '¡Giulia! Tira nieve para arriba y le cae encima.'),
      q('hielo-7', 'abriga mejor a su muñeca', 'Quién abriga a su muñeca',
        '¡Julieth! Le puso bufanda y gorro a su muñeca.',
        '¡Giulia! Tapa a su muñeca con su mantita.'),
      q('hielo-8', 'tiene la nariz más coloradita', 'Quién tiene nariz coloradita',
        '¡Julieth! Tiene la nariz colorada como una frutilla.',
        '¡Giulia! Tiene la naricita roja como una cerecita.'),
      hermanaMayor('hielo-9')
    ],
    luna: [
      q('luna-1', 'duerme más', 'Quién duerme más',
        '¡Julieth! Duerme toda la noche abrazada a su peluche.',
        '¡Giulia! Duerme siestitas largas como un osito.'),
      q('luna-2', 'sueña los sueños más lindos', 'Quién sueña sueños lindos',
        '¡Julieth! Sueña con unicornios y castillos.',
        '¡Giulia! Sueña con mamá, papá y su hermana.'),
      q('luna-3', 'cuenta más estrellas', 'Quién cuenta más estrellas',
        '¡Julieth! Contó estrellas hasta quedarse dormida.',
        '¡Giulia! Señala cada estrella con su dedito.'),
      q('luna-4', 'le dice buenas noches a la luna', 'Quién saluda a la luna',
        '¡Julieth! Le dice buenas noches a la luna cada día.',
        '¡Giulia! Le tira besitos a la luna desde la ventana.'),
      q('luna-5', 'escucha mejor los cuentos', 'Quién escucha los cuentos',
        '¡Julieth! Escucha cuentos y pide otro y otro más.',
        '¡Giulia! Escucha los cuentos con los ojitos grandes.'),
      q('luna-6', 'bosteza más grande', 'Quién bosteza más',
        '¡Julieth! Bosteza como una leona dormilona.',
        '¡Giulia! Bosteza chiquito como un gatito.'),
      q('luna-7', 'se acurruca mejor con mamá', 'Quién se acurruca con mamá',
        '¡Julieth! Se acurruca con mamá como un pancito.',
        '¡Giulia! Se acurruca en el pecho de mamá.'),
      q('luna-8', 'brilla como una estrellita', 'Quién brilla como estrellita',
        '¡Julieth! Brilla como la estrella más grande.',
        '¡Giulia! Es la estrellita más chiquita del cielo.'),
      chiquitita('luna-9')
    ],
    fuego: [
      q('fuego-1', 'es más valiente', 'Quién es más valiente',
        '¡Julieth! Es tan valiente como un dragón del volcán.',
        '¡Giulia! No le tiene miedo a nada de nada.'),
      q('fuego-2', 'come más', 'Quién come más',
        '¡Julieth! Come tanto que crece como una princesa fuerte.',
        '¡Giulia! Se come toda la papilla y pide más.'),
      q('fuego-3', 'come menos', 'Quién come menos',
        '¡Julieth! Come como un pajarito cuando juega.',
        '¡Giulia! Come poquito porque su pancita es chiquita.'),
      q('fuego-4', 'ruge como un dragón', 'Quién ruge como un dragón',
        '¡Julieth! Ruge tan fuerte que el volcán se asusta.',
        '¡Giulia! Hace grrr chiquito y todos se derriten.'),
      q('fuego-5', 'tiene más energía', 'Quién tiene más energía',
        '¡Julieth! Tiene energía como lava que no para.',
        '¡Giulia! Gatea por toda la casa sin cansarse.'),
      q('fuego-6', 'tiene el corazón más calentito', 'Quién tiene el corazón tibio',
        '¡Julieth! Su corazón es calentito como una fogata.',
        '¡Giulia! Su corazoncito da calor a toda la familia.'),
      q('fuego-7', 'sopla mejor las velitas', 'Quién sopla las velitas',
        '¡Julieth! Sopló sus cinco velitas de un soplido.',
        '¡Giulia! Sopló su primera velita con ayuda.'),
      q('fuego-8', 'es la más fuerte', 'Quién es más fuerte',
        '¡Julieth! Levanta su mochila como una guerrera.',
        '¡Giulia! Agarra el dedo de papá con mucha fuerza.'),
      mayor('fuego-9')
    ],
    trueno: [
      q('trueno-1', 'aplaude más fuerte', 'Quién aplaude más fuerte',
        '¡Julieth! Aplaude fuerte como un trueno feliz.',
        '¡Giulia! Aplaude con sus manitos y suena plaf plaf.'),
      q('trueno-2', 'no le tiene miedo a los truenos', 'Quién no teme a los truenos',
        '¡Julieth! Escucha los truenos y dice qué divertido.',
        '¡Giulia! Con mamá cerca no le teme a nada.'),
      q('trueno-3', 'salta más en los charcos', 'Quién salta en los charcos',
        '¡Julieth! Salta en los charcos y salpica todo.',
        '¡Giulia! Chapotea en el charco con sus botitas.'),
      q('trueno-4', 'es más rápida como un rayo', 'Quién es rápida como un rayo',
        '¡Julieth! Es rápida como un rayo del cielo.',
        '¡Giulia! Gatea rapidísimo como un rayito.'),
      q('trueno-5', 'grita más fuerte de alegría', 'Quién grita de alegría',
        '¡Julieth! Grita de alegría más fuerte que el trueno.',
        '¡Giulia! Hace grititos que despiertan a las nubes.'),
      q('trueno-6', 'toca mejor el tambor', 'Quién toca mejor el tambor',
        '¡Julieth! Toca el tambor como en un desfile real.',
        '¡Giulia! Golpea las ollas como una gran baterista.'),
      q('trueno-7', 've primero el arcoíris', 'Quién ve primero el arcoíris',
        '¡Julieth! Vio el arcoíris antes que nadie.',
        '¡Giulia! Señaló el arcoíris con su dedito.'),
      q('trueno-8', 'hace más lío jugando', 'Quién hace más lío jugando',
        '¡Julieth! Arma castillos de juguetes por toda la casa.',
        '¡Giulia! Desparrama todos los juguetes en un segundo.'),
      menor('trueno-9')
    ],
    mar: [
      q('mar-1', 'nada como una sirenita', 'Quién nada como una sirenita',
        '¡Julieth! Nada como una sirenita del mar mágico.',
        '¡Giulia! Patalea en el agua como una sirenita bebé.'),
      q('mar-2', 'junta más caracolitos', 'Quién junta más caracolitos',
        '¡Julieth! Llenó un balde entero de caracolitos.',
        '¡Giulia! Encontró un caracolito y no lo suelta.'),
      q('mar-3', 'se hace amiga de los delfines', 'Quién es amiga de delfines',
        '¡Julieth! Los delfines saltan para saludarla.',
        '¡Giulia! Los delfines le hacen cosquillas.'),
      q('mar-4', 'salta más olas', 'Quién salta más olas',
        '¡Julieth! Salta las olas de la mano de papá.',
        '¡Giulia! Se ríe cuando las olitas le tocan los pies.'),
      q('mar-5', 'chapotea más en la bañadera', 'Quién chapotea en la bañera',
        '¡Julieth! Hace olas en la bañadera como un océano.',
        '¡Giulia! Chapotea y moja a mamá de pies a cabeza.'),
      q('mar-6', 'busca mejor los tesoros', 'Quién busca mejor tesoros',
        '¡Julieth! Encontró el cofre del tesoro del mar.',
        '¡Giulia! Su mejor tesoro es su hermana Julieth.'),
      q('mar-7', 'canta como las sirenas', 'Quién canta como las sirenas',
        '¡Julieth! Canta y las sirenas le hacen coro.',
        '¡Giulia! Balbucea canciones que los peces aman.'),
      q('mar-8', 'nada mejor como un pececito', 'Quién nada como un pececito',
        '¡Julieth! Nada como un pececito de colores.',
        '¡Giulia! Hace burbujitas como un pececito.'),
      hermanaMayor('mar-9')
    ],
    arena: [
      q('arena-1', 'hace el castillo de arena más alto', 'Quién hace castillos altos',
        '¡Julieth! Hizo un castillo de arena con torres y todo.',
        '¡Giulia! Hizo un montoncito de arena y lo aplaudió.'),
      q('arena-2', 'cava el pozo más profundo', 'Quién cava el pozo más hondo',
        '¡Julieth! Cavó un pozo que casi llega al otro lado.',
        '¡Giulia! Cava con su palita sin parar.'),
      q('arena-3', 'se hace amiga del camello', 'Quién es amiga del camello',
        '¡Julieth! El camello la lleva a pasear por las dunas.',
        '¡Giulia! Le da besitos al camello en la nariz.'),
      q('arena-4', 'aguanta más el sol', 'Quién aguanta más el sol',
        '¡Julieth! Con su sombrero aguanta el sol del desierto.',
        '¡Giulia! Bajo su sombrilla juega feliz.'),
      q('arena-5', 'toma más agüita', 'Quién toma más agüita',
        '¡Julieth! Toma agüita como una exploradora.',
        '¡Giulia! Toma de su mamadera hasta la última gota.'),
      q('arena-6', 'rueda más por las dunas', 'Quién rueda por las dunas',
        '¡Julieth! Rueda por las dunas riéndose a carcajadas.',
        '¡Giulia! Rueda despacito y queda llena de arena.'),
      q('arena-7', 'es la mejor exploradora', 'Quién es la exploradora',
        '¡Julieth! Explora todo el desierto con su mapa.',
        '¡Giulia! Explora cada rincón de la casa gateando.'),
      q('arena-8', 'es la más mimosa', 'Quién es más mimosa',
        '¡Julieth! Pide mimos a papá y a mamá todo el día.',
        '¡Giulia! Se acurruca y pide upa a cada rato.'),
      chiquitita('arena-9')
    ]
  };

  function lista(castilloId) {
    return DATOS[castilloId] || DATOS.real;
  }

  function mezclar(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function libres(castilloId, excluirIds) {
    var ex = excluirIds || [];
    var todas = lista(castilloId);
    var ok = [], fuera = [];
    for (var i = 0; i < todas.length; i++) {
      (ex.indexOf(todas[i].id) === -1 ? ok : fuera).push(todas[i]);
    }
    return { ok: ok, fuera: fuera };
  }

  function azar(castilloId, excluirIds) {
    var l = libres(castilloId, excluirIds);
    var pool = l.ok.length ? l.ok : lista(castilloId);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function opciones(castilloId, excluirIds, n) {
    if (n == null) n = 4;
    var l = libres(castilloId, excluirIds);
    return mezclar(l.ok).concat(mezclar(l.fuera)).slice(0, n);
  }

  function ganadora(pregunta) {
    if (pregunta && pregunta.fija) return pregunta.fija;
    return Math.random() < 0.75 ? J_ : G_;
  }

  function respuesta(pregunta, gana) {
    gana = gana || ganadora(pregunta);
    var r = pregunta && pregunta.respuesta;
    if (r && r[gana]) return r[gana];
    return '¡' + gana + '! Así lo dice el espejo mágico.';
  }

  var P = {
    lista: lista,
    azar: azar,
    opciones: opciones,
    ganadora: ganadora,
    respuesta: respuesta
  };

  J.EspejoPreguntas = P;
})();
