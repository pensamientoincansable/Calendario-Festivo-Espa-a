const horizontal = ['← → o A / D', 'Mantén para moverte a izquierda o derecha.'];

export const GAME_CONTROLS = {
  race: {
    pc: [
      horizontal,
      ['Espacio o ↑ / W', 'Mantén para activar el turbo. También puedes arrastrar el vehículo.'],
    ],
    touch: [
      ['Desliza por la pista', 'Arrastra para dirigir el vehículo.'],
      ['Botones de dirección + Turbo', 'Puedes mantener dirección y turbo a la vez con dos dedos.'],
    ],
    tip: 'El turbo se recarga al soltarlo. Conserva tus escudos y busca un carril libre.',
  },
  santa: {
    pc: [
      ['↑ ↓ o W / S', 'Controla la altura del trineo.'],
      ['Espacio o Intro', 'Suelta un regalo. También puedes hacer clic a la derecha del trineo.'],
    ],
    touch: [
      ['Lado izquierdo del cielo', 'Arrastra hacia arriba o abajo para ajustar la altura.'],
      [
        'Soltar regalo',
        'Toca el botón o el lado derecho del cielo. Puedes volar y repartir a la vez.',
      ],
    ],
    tip: 'Suelta el regalo un poco antes de llegar a la chimenea: tarda en caer.',
  },
  reyes: {
    pc: [
      horizontal,
      ['Espacio, ↑ o clic', 'Lanza un regalo al balcón. El ratón también mueve la comitiva.'],
    ],
    touch: [
      ['Desliza para apuntar', 'Mueve a los Reyes bajo los balcones.'],
      ['Lanzar', 'Toca el botón para regalar; mantén la dirección con el otro dedo.'],
    ],
    tip: 'Anticípate a los balcones en movimiento y evita el carbón.',
  },
  match3: {
    pc: [
      ['Ratón', 'Haz clic en dos dulces contiguos o arrastra uno sobre su vecino.'],
      [
        'Flechas + Espacio / Intro',
        'Recorre el tablero y selecciona dos piezas. Mayús + flecha intercambia directamente.',
      ],
    ],
    touch: [
      ['Toca dos dulces vecinos', 'O desliza una pieza en la dirección del intercambio.'],
      ['Sin prisa', 'No hay límite de tiempo. Una jugada inválida no gasta movimientos.'],
    ],
    tip: 'Combina 4 o 5 dulces para crear especiales. Si te atascas, aparece una pista.',
  },
  cooking: {
    pc: [
      ['Clic o Tab + Intro', 'Escoge los ingredientes de la despensa.'],
      ['Espacio o Intro', 'En la zona de juego, actúa cuando la aguja esté en la franja verde.'],
    ],
    touch: [
      ['Toca los ingredientes', 'Añade los auténticos y evita los intrusos.'],
      [
        'Botón de cocción',
        'Voltea, aparta del fuego o bate al pulsar, sin esperar a levantar el dedo.',
      ],
    ],
    tip: 'Para emulsionar, pulsa rítmicamente y mantén la aguja en la franja verde.',
  },
  chimes: {
    pc: [
      ['Espacio, Intro o clic', 'Toma una uva cuando la aguja cruce el arco dorado de las XII.'],
    ],
    touch: [
      ['Toca el reloj o Tomar uva', 'Pulsa una sola vez por campanada, justo al cruzar el oro.'],
    ],
    tip: 'La zona verde también puntúa. No hace falta pulsar deprisa, sino a tiempo.',
  },
  runner: {
    pc: [
      ['Espacio, ↑ o W', 'Pulsa para saltar. Una segunda pulsación en el aire hace doble salto.'],
    ],
    touch: [
      ['Toca la escena o Saltar', 'Pulsa otra vez en el aire para superar obstáculos más altos.'],
    ],
    tip: 'Guarda el segundo salto para corregir la caída y recoger los tesoros.',
  },
  stacker: {
    pc: [['Espacio, Intro, ↓ o clic', 'Coloca la pieza móvil sobre la anterior.']],
    touch: [
      [
        'Toca la escena o Colocar pieza',
        'La pieza cae al presionar: alinea los bordes antes de tocar.',
      ],
    ],
    tip: 'Los encajes perfectos recuperan un poco de anchura para la siguiente pieza.',
  },
  fireworks: {
    pc: [
      ['Clic sobre un cohete', 'Hazlo estallar junto al aro dorado.'],
      ['Espacio o Intro', 'Detona el cohete más próximo a su punto perfecto.'],
    ],
    touch: [
      ['Toca un cohete', 'Hazlo estallar al alcanzar su aro.'],
      ['Estallar cohete', 'El botón elige el cohete mejor colocado.'],
    ],
    tip: 'Encadena estallidos sin dejar escapar cohetes para multiplicar tu puntuación.',
  },
  catcher: {
    pc: [horizontal, ['Ratón', 'Mueve la cesta con el puntero y evita los objetos peligrosos.']],
    touch: [['Desliza la cesta', 'O mantén los botones Izquierda / Derecha.']],
    tip: 'Los objetos dorados cuentan el doble; no necesitas recogerlo todo.',
  },
  breakout: {
    pc: [horizontal, ['Ratón', 'Mueve la pala bajo la esfera para mantenerla en juego.']],
    touch: [['Desliza la pala', 'O mantén los botones de dirección para devolver la esfera.']],
    tip: 'Golpear con los extremos de la pala cambia la dirección de la esfera.',
  },
  candles: {
    pc: [
      horizontal,
      ['Espacio o Intro', 'Reaviva un cirio apagado. El ratón mueve el guardabrisa.'],
    ],
    touch: [
      ['Desliza el arco dorado', 'Bloquea las ráfagas antes de que alcancen las llamas.'],
      ['Toca un cirio apagado', 'O pulsa Reavivar para encenderlo de nuevo.'],
    ],
    tip: 'Acerca el guardabrisa a las llamas débiles para que recuperen fuerza.',
  },
  lights: {
    pc: [['Clic o flechas + Espacio / Intro', 'Recorre las piezas y gíralas un cuarto de vuelta.']],
    touch: [['Toca una pieza', 'Cada toque gira sus cables. Une la estrella con todas las luces.']],
    tip: 'Empieza por la estrella y sigue los cables dorados. No hay límite de tiempo.',
  },
};
