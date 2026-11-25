/* Conversaciones con los príncipes: cada uno cuenta la historia y el
   secreto de su castillo, y tiene un regalo para Julieth.
   Los textos se pueden cambiar libremente aquí abajo. */
(function () {
  const HISTORIAS = {
    real: {
      saludo: '¡Hola, princesa Julieth! Soy el príncipe Leo. ¡Bienvenida al Castillo Real!',
      historia: [
        'Hace muchísimos años, aquí solo había una pradera llena de flores.',
        'Mi bisabuela, la reina Aurora, puso la primera piedra. Después, cada vecino del reino trajo una piedra más.',
        'Por eso tiene tantas torres: ¡lo construimos entre todos! Y los techos son rosas porque era su color favorito.'
      ],
      secreto: [
        '¿Viste el corazón que hay sobre la puerta? De noche brilla un poquito.',
        'Dicen que late más fuerte cuando entra alguien de buen corazón. ¡Hoy está latiendo muchísimo!'
      ],
      regalo: '¡Claro que sí! En el tesoro real siempre hay monedas para las princesas valientes.',
      adios: '¡Hasta pronto!'
    },
    bosque: {
      saludo: '¡Hola, princesa Julieth! Soy el príncipe Roble, guardián del bosque. ¡Pasa, pasa!',
      historia: [
        'Este castillo no se construyó… ¡creció! Era el árbol más viejo y más grande de todo el bosque.',
        'Los pájaros carpinteros tallaron las ventanas y las ardillas hicieron las escaleras.',
        'Cada primavera le sale una torre nueva. ¡Ni yo sé cuántas habitaciones tiene!'
      ],
      secreto: [
        'Shhh… las luciérnagas duermen de día, escondidas en las paredes.',
        'Cuando llega la noche salen todas juntas a iluminar el reino. Si paseas de noche, vuelan a tu lado.'
      ],
      regalo: 'Las ardillas guardaron esto para ti. ¡No son bellotas, son monedas gigantes!',
      adios: '¡Vuelve cuando quieras!'
    },
    cristal: {
      saludo: '¡Hola, princesa Julieth! Soy el príncipe Zafiro. ¿No es brillante mi castillo?',
      historia: [
        'Una noche cayó una estrella fugaz justo aquí, y se partió en mil cristales.',
        'Mi abuelo los juntó uno por uno, como un rompecabezas gigante.',
        'Tardó cien inviernos en terminarlo. Por eso el castillo brilla igual que el cielo.'
      ],
      secreto: [
        'Si cantas bajito, las paredes cantan contigo.',
        'Cada cristal guarda una nota. Todas juntas forman la canción del reino. ¿La escuchas mientras caminas?'
      ],
      regalo: 'Estas monedas brillan casi tanto como mis cristales. ¡Son para ti!',
      adios: '¡Que brilles mucho!'
    },
    nubes: {
      saludo: '¡Hola, princesa Julieth! Soy el príncipe Nimbo. ¡Llegaste hasta las nubes!',
      historia: [
        'Antes, este castillo flotaba altísimo y viajaba por el mundo con el viento.',
        'Un día vio este reino tan lindo que quiso quedarse, y bajó despacito, despacito.',
        'El arcoíris es su ancla: lo sujeta con cariño para que no se vaya volando.'
      ],
      secreto: [
        'Las nubes sonrientes que pasan por el cielo son nuestras mensajeras.',
        'Si las saludas con la mano, les llevan tu saludo a los otros nueve castillos del reino.'
      ],
      regalo: 'Atrapé estas monedas con una red de nubes. ¡Te las regalo!',
      adios: '¡Buen viaje!'
    },
    hielo: {
      saludo: '¡Hola, princesa Julieth! Soy el príncipe Escarcha. ¡Abrígate, que aquí hace fresquito!',
      historia: [
        'Hace mucho, mucho tiempo, un copo de nieve gigante cayó en estas colinas y no se quiso derretir.',
        'Los muñecos de nieve del reino lo pulieron con sus manitas de rama hasta dejarlo brillante como un espejo.',
        'Cada invierno le crece una torre de hielo nueva, ¡y cada una es diferente, como los copos de nieve!'
      ],
      secreto: [
        'Mis paredes de hielo nunca están frías por dentro: el castillo guarda el calorcito de los abrazos.',
        'Si soplas despacito sobre una ventana, aparece un dibujo de escarcha solo para ti.'
      ],
      regalo: '¡Encontré estas monedas congeladas en un carámbano! Ya se descongelaron: ¡son tuyas!',
      adios: '¡Que tengas un día muy fresquito!'
    },
    luna: {
      saludo: '¡Hola, princesa Julieth! Soy el príncipe Lucero. ¡Bienvenida al Castillo de la Luna!',
      historia: [
        'Una noche, la Luna se asomó tanto para mirar el reino que se le cayó un pedacito de luz.',
        'Las estrellas bajaron a buscarlo, y les gustó tanto este valle que se quedaron a vivir en sus torres.',
        'Por eso el castillo brilla plateado toda la noche, como una lamparita que cuida los sueños de todos.'
      ],
      secreto: [
        'Las estrellitas de mis torres son muy tímidas: de día duermen y de noche salen a jugar.',
        'Si pides un deseo bonito mirando al cielo, ellas se lo llevan a la Luna en un abracito de luz.'
      ],
      regalo: 'Estas monedas las juntaron las estrellas. ¡Brillan como la luna llena!',
      adios: '¡Dulces sueños, princesa!'
    },
    fuego: {
      saludo: '¡Hola, princesa Julieth! Soy el príncipe Brasa. ¡Qué calentito que llegaste al Castillo del Volcán!',
      historia: [
        'Este volcán es muy simpático: en vez de enojarse, estornuda chispitas de colores.',
        'Un día estornudó tan fuerte que las chispas se juntaron y formaron este castillo calentito.',
        'Desde entonces, el volcán y yo somos mejores amigos. ¡Él calienta el chocolate y yo le cuento chistes!'
      ],
      secreto: [
        'Cuando el volcán está contento, hace burbujitas de luz naranja que suben como globos.',
        'Si le cantas una canción, ¡se pone colorado de la vergüenza y sale humito en forma de corazón!'
      ],
      regalo: 'El volcán las dejó calentitas para ti. ¡Cuidado, que todavía brillan!',
      adios: '¡Hasta pronto, que sigas calentita!'
    },
    trueno: {
      saludo: '¡Hola, princesa Julieth! Soy el príncipe Centella. ¡Bienvenida al Castillo del Trueno!',
      historia: [
        'Antes, las nubes de tormenta no tenían casa y andaban por todo el cielo jugando a las escondidas.',
        'Un rayo juguetón dibujó estas torres en el aire con su luz, y las nubes se quedaron a vivir aquí.',
        'Ahora los truenos no asustan a nadie: ¡son las risas de las nubes cuando juegan a la mancha!'
      ],
      secreto: [
        'Los rayitos de mi castillo tienen cosquillas: si tocas las torres, chisporrotean de alegría.',
        'Y después de cada tormenta, sale un arcoíris para pedir perdón por tanto ruido.'
      ],
      regalo: '¡Un rayito trajo estas monedas volando! Son rapidísimas, ¡atrápalas!',
      adios: '¡Chau, chau, a toda velocidad!'
    },
    mar: {
      saludo: '¡Hola, princesa Julieth! Soy el príncipe Coral. ¡Bienvenida al Castillo del Mar!',
      historia: [
        'Hace muchos años, este castillo vivía en el fondo del mar, entre peces de colores y caballitos de mar.',
        'Una ola grandota y cariñosa lo subió hasta la orilla para que todos pudieran visitarlo.',
        'Los caracoles le pusieron sus conchas como tejas, y las sirenas lo pintaron de rosa coral.'
      ],
      secreto: [
        'Si acercas una concha de mi castillo a tu oreja, escuchas al mar cantándote una canción de cuna.',
        'Y en la Bahía Coral, los delfines saludan con la colita a los que pasean en el bote-cisne.'
      ],
      regalo: 'Las encontré dentro de una ostra gigante. ¡Son perlas de oro para ti!',
      adios: '¡Que te vaya bonito, como una ola!'
    },
    arena: {
      saludo: '¡Hola, princesa Julieth! Soy el príncipe Oasis. ¡Llegaste al Castillo de las Dunas!',
      historia: [
        'Al principio, este desierto era tan grande que los viajeros no tenían dónde descansar.',
        'Entonces el viento juntó granito por granito de arena dorada, como quien hace un castillo en la playa.',
        'Al terminar, brotó un oasis con palmeras y agua fresquita, ¡y el castillo se convirtió en la casa de todos!'
      ],
      secreto: [
        'Cuando el sol se esconde, la arena de mis torres se vuelve de color miel y huele a galletitas.',
        'Si escuchas bien, las dunas cantan bajito cuando el viento les hace cosquillas.'
      ],
      regalo: '¡Las desenterré de una duna mágica! Son monedas doradas como la arena.',
      adios: '¡Hasta la próxima aventura!'
    }
  };
  const ESPERA_REGALO = 180; // segundos entre un regalo y el siguiente

  const Dg = { abierto: false, cerca: null, principe: null, escribiendo: false, texto: '', vis: 0, opciones: [], sel: 0, t: 0, _cerca: undefined };
  const $ = (id) => document.getElementById(id);

  // Lee en voz alta si el dispositivo tiene una voz en español
  function voz(texto) {
    try {
      const ss = window.speechSynthesis;
      if (!ss) return;
      ss.cancel();
      if (!texto || !J.Audio.sonidoOn) return;
      const v = ss.getVoices().find((k) => /^es/i.test(k.lang));
      if (!v) return;
      const u = new SpeechSynthesisUtterance(texto.replace(/[^\p{L}\p{N}\p{P}\s]/gu, ''));
      u.voice = v; u.lang = v.lang; u.rate = 0.95; u.pitch = 1.15;
      ss.speak(u);
    } catch (_) { /* sin voz: solo texto */ }
  }

  function decir(texto, opciones) {
    Dg.texto = texto; Dg.vis = 0; Dg.escribiendo = true; Dg.opciones = opciones; Dg.sel = 0;
    Dg.textoEl.textContent = '';
    Dg.opcEl.innerHTML = '';
    opciones.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = o.t; b.className = i === 0 ? 'sel' : '';
      b.addEventListener('click', (ev) => { ev.stopPropagation(); elegir(i); });
      Dg.opcEl.appendChild(b);
    });
    Dg.opcEl.classList.toggle('una', opciones.length === 1);
    voz(texto);
  }
  function elegir(i) {
    const o = Dg.opciones[i];
    if (o) o.f();
  }
  function marcar(i) {
    const n = Dg.opciones.length; if (!n) return;
    Dg.sel = (i + n) % n;
    [...Dg.opcEl.children].forEach((b, k) => b.classList.toggle('sel', k === Dg.sel));
  }

  function menu(texto) {
    decir(texto, [
      { t: '📖 La historia del castillo', f: () => contar('historia', 0) },
      { t: '🔑 Cuéntame un secreto', f: () => contar('secreto', 0) },
      { t: '🎁 ¿Tienes un regalo?', f: regalo },
      { t: '👋 ¡Adiós!', f: despedir }
    ]);
  }
  function contar(tema, i) {
    const pag = HISTORIAS[Dg.principe.id][tema];
    decir(pag[i], [i < pag.length - 1
      ? { t: 'Siguiente ▶', f: () => contar(tema, i + 1) }
      : { t: '¡Qué lindo! ¿Y qué más?', f: () => menu('¿Qué más quieres saber?') }]);
  }
  function regalo() {
    const p = Dg.principe, Ju = J.Jul, volver = [{ t: '¡Gracias!', f: () => menu('¿Qué más quieres saber?') }];
    if (p.regalo && Dg.t - p.regalo < ESPERA_REGALO) return decir('Ya te di mi regalo. ¡Vuelve más tarde y tendré otro!', volver);
    p.regalo = Dg.t || 0.01;
    decir(HISTORIAS[p.id].regalo, volver);
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.15 + 0.7 * (i / 4));
      J.Mundo.crearItem('moneda', Ju.x, Ju.y, 40, { z: 150, vx: Math.cos(a) * 150, vy: Math.sin(a) * 90 + 30, vz: 420, temporal: 30, espera: 0.6 });
    }
    J.Audio.estrella(); J.Part.chispas(Ju.x, Ju.y, 120, 24, '#ffe873');
  }
  function despedir() {
    const p = Dg.principe;
    Dg.cerrar();
    J.Part.texto(p.x, p.y, 150, HISTORIAS[p.id].adios, '#fff6b0', 22);
    J.Part.corazones(p.x, p.y, 100, 4);
  }

  Dg.abrir = function (p) {
    if (Dg.abierto || !p) return;
    if (p.tipo === 'espejo') return J.Espejo.abrir(p); // el espejo mágico tiene su propia escena
    if (p.tipo === 'seno') return J.Aula && J.Aula.abrir(p); // las seños del Huerto dan clase en su propia escena
    if (!HISTORIAS[p.id] || !(J.Dibujo.PRINCIPE && J.Dibujo.PRINCIPE[p.id])) return; // sin príncipe (p. ej. El Huerto)
    const Ju = J.Jul;
    Dg.abierto = true; Dg.principe = p;
    Ju.estado = 'charla'; Ju.vx = Ju.vy = 0; Ju.dir = p.x >= Ju.x ? 1 : -1;
    J.Entrada.teclas = {}; if (J.Entrada._soltarPalanca) J.Entrada._soltarPalanca();
    Dg.nombreEl.textContent = J.Dibujo.PRINCIPE[p.id].nombre;
    Dg.nombreEl.style.background = J.Dibujo.PRINCIPE[p.id].tunica;
    document.body.classList.add('charla');
    if (J.Audio.busMusica) J.Audio.busMusica.gain.value = 0.18;
    menu(HISTORIAS[p.id].saludo);
  };
  Dg.cerrar = function () {
    if (!Dg.abierto) return;
    Dg.abierto = false; Dg.escribiendo = false; voz('');
    document.body.classList.remove('charla');
    if (J.Audio.busMusica) J.Audio.busMusica.gain.value = 0.5;
    if (J.Jul.estado === 'charla') J.Jul.estado = 'normal';
    J.Entrada.consumirSalto();
  };

  Dg.iniciar = function () {
    Dg.panel = $('dialogo'); Dg.textoEl = $('dialogo-texto'); Dg.opcEl = $('dialogo-opciones'); Dg.nombreEl = $('dialogo-nombre');
    Dg.retrato = $('dialogo-retrato'); Dg.retratoG = Dg.retrato.getContext('2d'); Dg.boton = $('btn-hablar');
    Dg.boton.addEventListener('click', () => { Dg.boton.blur(); Dg.abrir(Dg.cerca); });
    // tocar el texto lo completa de una vez
    Dg.panel.addEventListener('click', () => { if (Dg.escribiendo) Dg.vis = Dg.texto.length; });
    // teclado: mientras se conversa, las teclas manejan el diálogo
    window.addEventListener('keydown', (e) => {
      if (!Dg.abierto) {
        if ((e.code === 'KeyE' || e.code === 'Enter') && Dg.cerca && !(J.Aula && J.Aula.abierto) && J.Jul.estado === 'normal' && document.body.classList.contains('jugando')) { e.preventDefault(); e.stopImmediatePropagation(); Dg.abrir(Dg.cerca); }
        return;
      }
      e.stopImmediatePropagation();
      const c = e.code;
      if (c === 'ArrowDown' || c === 'ArrowRight' || c === 'KeyS' || c === 'KeyD') marcar(Dg.sel + 1);
      else if (c === 'ArrowUp' || c === 'ArrowLeft' || c === 'KeyW' || c === 'KeyA') marcar(Dg.sel - 1);
      else if (c === 'Enter' || c === 'Space' || c === 'KeyE') { if (e.repeat) return e.preventDefault(); if (Dg.escribiendo) Dg.vis = Dg.texto.length; else elegir(Dg.sel); }
      else if (/^(Digit|Numpad)[1-9]$/.test(c)) elegir(+c.slice(-1) - 1);
      else if (c === 'Escape') Dg.cerrar();
      else return;
      e.preventDefault();
    }, true);
  };

  Dg.actualizar = function (dt, t) {
    Dg.t = t;
    // botón "Hablar" cuando hay un príncipe cerca
    const mostrar = !!Dg.cerca && !Dg.abierto && !(J.Aula && J.Aula.abierto);
    if (mostrar !== Dg._cerca) { Dg._cerca = mostrar; Dg.boton.classList.toggle('visible', mostrar); }
    const etiqueta = Dg.cerca && Dg.cerca.tipo === 'seno' ? 'Clase' : 'Hablar';
    if (etiqueta !== Dg._etiqueta) { Dg._etiqueta = etiqueta; const sp = Dg.boton.querySelector('span'); if (sp) sp.textContent = etiqueta; }
    if (!Dg.abierto) return;
    if (Dg.escribiendo) {
      const antes = Math.floor(Dg.vis);
      Dg.vis = Math.min(Dg.texto.length, Dg.vis + dt * 42);
      const ahora = Math.floor(Dg.vis);
      if (ahora !== antes) {
        Dg.textoEl.textContent = Dg.texto.slice(0, ahora);
        const ss = window.speechSynthesis;
        if (ahora % 3 === 0 && !(ss && ss.speaking)) J.Audio.blip();
      }
      if (Dg.vis >= Dg.texto.length) { Dg.escribiendo = false; Dg.textoEl.textContent = Dg.texto; }
    }
    // retrato animado del príncipe
    const g = Dg.retratoG, T = Dg.retrato.width;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, T, T);
    g.setTransform(T / 88, 0, 0, T / 88, 0, 0);
    g.translate(38, 150); g.scale(1.75, 1.75);
    J.Dibujo.figuraPrincipe(g, Dg.principe.id, { t, hablando: Dg.escribiendo, saluda: false });
  };

  J.Dialogo = Dg;
})();
