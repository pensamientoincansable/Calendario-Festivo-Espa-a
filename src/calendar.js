const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const REGIONS = [
  { id: 'all', label: 'Toda España', kind: 'national' },
  { id: 'andalucia', label: 'Andalucía' },
  { id: 'aragon', label: 'Aragón' },
  { id: 'asturias', label: 'Asturias' },
  { id: 'baleares', label: 'Illes Balears' },
  { id: 'canarias', label: 'Canarias' },
  { id: 'cantabria', label: 'Cantabria' },
  { id: 'castilla-la-mancha', label: 'Castilla-La Mancha' },
  { id: 'castilla-y-leon', label: 'Castilla y León' },
  { id: 'cataluna', label: 'Cataluña' },
  { id: 'valencia', label: 'Comunitat Valenciana' },
  { id: 'extremadura', label: 'Extremadura' },
  { id: 'galicia', label: 'Galicia' },
  { id: 'madrid', label: 'Comunidad de Madrid' },
  { id: 'murcia', label: 'Región de Murcia' },
  { id: 'navarra', label: 'Navarra' },
  { id: 'pais-vasco', label: 'País Vasco' },
  { id: 'rioja', label: 'La Rioja' },
  { id: 'ceuta', label: 'Ceuta' },
  { id: 'melilla', label: 'Melilla' },
];

const NATIONAL_HOLIDAYS = [
  {
    id: 'ano-nuevo', month: 1, day: 1, name: 'Año Nuevo', shortName: 'Año Nuevo',
    icon: '🎆', color: '#e7795f',
    description: 'Estrenamos el año con doce campanadas y una página en blanco.',
    tradition: 'En España, las doce uvas acompañan las últimas campanadas del reloj. Una por cada mes, y un deseo —o una risa— para empezar de nuevo.',
    trivia: {
      question: '¿Qué se come tradicionalmente al ritmo de las doce campanadas?',
      answer: 'Doce uvas', wrong: ['Doce aceitunas', 'Doce almendras'],
      explanation: 'La costumbre de las doce uvas se sigue en Nochevieja para dar la bienvenida al año nuevo.',
    },
    game: {
      type: 'memory', title: 'Parejas de medianoche',
      instruction: 'Encuentra las cuatro parejas que encienden la Nochevieja.',
      pairs: [
        [{ icon: '🍇', label: 'Las uvas' }, { icon: '🕛', label: 'Las campanadas' }],
        [{ icon: '🥂', label: 'El brindis' }, { icon: '✨', label: 'El deseo' }],
        [{ icon: '🎆', label: 'Los fuegos' }, { icon: '🎉', label: 'La celebración' }],
        [{ icon: '📝', label: 'El propósito' }, { icon: '🌱', label: 'El nuevo comienzo' }],
      ],
    },
  },
  {
    id: 'epifania', month: 1, day: 6, name: 'Epifanía del Señor · Reyes', shortName: 'Día de Reyes',
    icon: '👑', color: '#d9a648',
    description: 'Una mañana de ilusión, cartas abiertas y roscón compartido.',
    tradition: 'La noche del 5 de enero, las cabalgatas recorren pueblos y ciudades. A la mañana siguiente, muchas familias parten el roscón: ¡ojo con el haba!',
    trivia: {
      question: '¿Qué dulce suele compartirse en España el Día de Reyes?',
      answer: 'El roscón de Reyes', wrong: ['La coca de San Juan', 'Los buñuelos de viento'],
      explanation: 'El roscón de Reyes suele esconder una sorpresa y un haba; la tradición cambia un poco de casa en casa.',
    },
    game: {
      type: 'order', title: 'La ruta de los Reyes',
      instruction: 'Ordena los pequeños gestos de la víspera hasta la mañana de Reyes.',
      steps: [
        { id: 'zapatos', icon: '👟', label: 'Dejar los zapatos preparados' },
        { id: 'cabalgata', icon: '🐫', label: 'Esperar la cabalgata de la noche' },
        { id: 'regalos', icon: '🎁', label: 'Despertar y encontrar los regalos' },
      ],
    },
  },
  {
    id: 'viernes-santo', easterOffset: -2, name: 'Viernes Santo', shortName: 'Viernes Santo',
    icon: '🕯️', color: '#8072a7',
    description: 'Una jornada de recogimiento que atraviesa la Semana Santa.',
    tradition: 'La Semana Santa se vive de formas distintas en cada rincón: procesiones, música, silencio y encuentros que pasan de generación en generación.',
    trivia: {
      question: 'En la tradición cristiana, ¿qué conmemora el Viernes Santo?',
      answer: 'La Pasión y muerte de Jesús', wrong: ['La llegada de los Reyes Magos', 'El nacimiento de Jesús'],
      explanation: 'El Viernes Santo recuerda la Pasión y muerte de Jesús dentro de las celebraciones de Semana Santa.',
    },
  },
  {
    id: 'trabajo', month: 5, day: 1, name: 'Fiesta del Trabajo', shortName: 'Día del Trabajo',
    icon: '🧰', color: '#588a73',
    description: 'Un día para reconocer los derechos y la aportación de quienes trabajan.',
    tradition: 'El Primero de Mayo es una jornada internacional de reivindicación y celebración de los derechos laborales, construidos colectivamente.',
    trivia: {
      question: '¿Qué pone en el centro la Fiesta del Trabajo?',
      answer: 'Los derechos de las personas trabajadoras', wrong: ['El inicio de la vendimia', 'La llegada de la primavera'],
      explanation: 'La jornada recuerda las reivindicaciones históricas y los derechos de las personas trabajadoras.',
    },
    game: {
      type: 'memory', title: 'Un equipo, muchas piezas',
      instruction: 'Empareja herramientas y valores que construyen un trabajo digno.',
      pairs: [
        [{ icon: '🛠️', label: 'Las herramientas' }, { icon: '🧰', label: 'El oficio' }],
        [{ icon: '🤝', label: 'La unión' }, { icon: '👥', label: 'El equipo' }],
        [{ icon: '⚖️', label: 'La justicia' }, { icon: '📜', label: 'Los derechos' }],
        [{ icon: '🧠', label: 'El talento' }, { icon: '🌱', label: 'El aprendizaje' }],
      ],
    },
  },
  {
    id: 'asuncion', month: 8, day: 15, name: 'Asunción de la Virgen', shortName: 'La Asunción',
    icon: '🌼', color: '#c7839a',
    description: 'Una celebración de tradición religiosa en pleno corazón del verano.',
    tradition: 'En muchos lugares, agosto reúne fiestas patronales, música y reencuentros. La Asunción se celebra el 15 de agosto en numerosos municipios.',
    trivia: {
      question: '¿Qué solemnidad católica se celebra el 15 de agosto?',
      answer: 'La Asunción de la Virgen', wrong: ['La Epifanía', 'La Inmaculada Concepción'],
      explanation: 'El 15 de agosto es la solemnidad de la Asunción de la Virgen María.',
    },
  },
  {
    id: 'fiesta-nacional', month: 10, day: 12, name: 'Fiesta Nacional de España', shortName: 'Fiesta Nacional',
    icon: '🇪🇸', color: '#d9854b',
    description: 'La fecha común del calendario cívico de todo el país.',
    tradition: 'El 12 de octubre es la Fiesta Nacional de España. Una fecha cívica que cada territorio vive también desde su propia historia y pluralidad.',
    trivia: {
      question: '¿En qué fecha se celebra la Fiesta Nacional de España?',
      answer: '12 de octubre', wrong: ['6 de diciembre', '2 de mayo'],
      explanation: 'La Fiesta Nacional de España se celebra cada año el 12 de octubre.',
    },
  },
  {
    id: 'todos-santos', month: 11, day: 1, name: 'Todos los Santos', shortName: 'Todos los Santos',
    icon: '🕯️', color: '#84728f',
    description: 'Un día para recordar a quienes siguen presentes en la memoria.',
    tradition: 'Es habitual visitar los cementerios y llevar flores. En distintas regiones también se comparten dulces tradicionales como huesos de santo, panellets o buñuelos.',
    trivia: {
      question: '¿Qué gesto es habitual en Todos los Santos?',
      answer: 'Recordar a los seres queridos y llevar flores', wrong: ['Encender hogueras en la playa', 'Compartir doce uvas'],
      explanation: 'Muchas familias visitan los cementerios y llevan flores para recordar a sus seres queridos.',
    },
    game: {
      type: 'memory', title: 'Recuerdos que florecen',
      instruction: 'Encuentra las cuatro parejas de símbolos de esta jornada de memoria.',
      pairs: [
        [{ icon: '🕯️', label: 'La luz' }, { icon: '💛', label: 'El recuerdo' }],
        [{ icon: '🌼', label: 'Las flores' }, { icon: '🪦', label: 'El homenaje' }],
        [{ icon: '🌰', label: 'Los frutos de otoño' }, { icon: '🍬', label: 'El dulce compartido' }],
        [{ icon: '🍂', label: 'El otoño' }, { icon: '🌾', label: 'La cosecha' }],
      ],
    },
  },
  {
    id: 'constitucion', month: 12, day: 6, name: 'Día de la Constitución', shortName: 'Constitución',
    icon: '📜', color: '#5c7794',
    description: 'La jornada que recuerda la Constitución aprobada en referéndum en 1978.',
    tradition: 'El 6 de diciembre de 1978 se celebró el referéndum de ratificación de la Constitución española. Un día para acercarse a la historia democrática reciente.',
    trivia: {
      question: '¿En qué año se ratificó en referéndum la Constitución española vigente?',
      answer: '1978', wrong: ['1982', '1931'],
      explanation: 'La Constitución fue ratificada en referéndum el 6 de diciembre de 1978.',
    },
  },
  {
    id: 'inmaculada', month: 12, day: 8, name: 'Inmaculada Concepción', shortName: 'La Inmaculada',
    icon: '🤍', color: '#7c9caa',
    description: 'Una solemnidad mariana que abre una de las semanas más luminosas del año.',
    tradition: 'La Inmaculada Concepción es una solemnidad católica. En el calendario popular, su fecha marca para muchas familias el comienzo de los preparativos navideños.',
    trivia: {
      question: '¿Qué solemnidad católica se celebra el 8 de diciembre?',
      answer: 'La Inmaculada Concepción de María', wrong: ['La Asunción de María', 'La Anunciación'],
      explanation: 'El 8 de diciembre la Iglesia católica celebra la Inmaculada Concepción de María.',
    },
  },
  {
    id: 'navidad', month: 12, day: 25, name: 'Natividad del Señor · Navidad', shortName: 'Navidad',
    icon: '🎄', color: '#4f8c71',
    description: 'Una fecha para encontrarse, compartir la mesa y encender luces.',
    tradition: 'La Navidad se celebra de maneras distintas en cada hogar. Villancicos, belenes, sobremesas largas y recetas familiares forman parte de muchas de ellas.',
    trivia: {
      question: '¿Qué celebración cristiana tiene lugar el 25 de diciembre?',
      answer: 'La Natividad de Jesús', wrong: ['La Epifanía', 'La Resurrección'],
      explanation: 'La Navidad celebra la Natividad de Jesús en la tradición cristiana.',
    },
    game: {
      type: 'memory', title: 'Luces de Navidad',
      instruction: 'Enciende el recuerdo: reúne cuatro detalles navideños con su pareja.',
      pairs: [
        [{ icon: '⭐', label: 'La estrella' }, { icon: '🎄', label: 'El árbol' }],
        [{ icon: '🎁', label: 'El regalo' }, { icon: '🎀', label: 'El lazo' }],
        [{ icon: '🔔', label: 'La campana' }, { icon: '🎶', label: 'El villancico' }],
        [{ icon: '🕯️', label: 'La luz' }, { icon: '🏠', label: 'El hogar' }],
      ],
    },
  },
];

const REGIONAL_HOLIDAYS = {
  andalucia: {
    month: 2, day: 28, name: 'Día de Andalucía', shortName: 'Día de Andalucía', icon: '💚', color: '#67956f',
    description: 'Una fecha para celebrar la identidad, la cultura y la diversidad andaluzas.',
    tradition: 'El verde y el blanco de la bandera llenan balcones y plazas. En los colegios es habitual compartir pan con aceite de oliva para celebrar el día.',
    trivia: { question: '¿En qué fecha se celebra el Día de Andalucía?', answer: '28 de febrero', wrong: ['23 de abril', '9 de junio'], explanation: 'El Día de Andalucía se celebra cada 28 de febrero.' },
  },
  aragon: {
    month: 4, day: 23, name: 'Día de Aragón · San Jorge', shortName: 'San Jorge · Aragón', icon: '🐉', color: '#c85e50',
    description: 'San Jorge, patrón de Aragón, comparte fecha con el Día del Libro.',
    tradition: 'El 23 de abril, rosas y libros salen a las calles. La leyenda de San Jorge y el dragón acompaña una jornada de cultura y celebración.',
    trivia: { question: '¿Qué santo se celebra en Aragón el 23 de abril?', answer: 'San Jorge', wrong: ['San Fermín', 'San Isidro'], explanation: 'San Jorge es el patrón de Aragón y su festividad coincide con el Día de Aragón.' },
  },
  asturias: {
    month: 9, day: 8, name: 'Día de Asturias', shortName: 'Día de Asturias', icon: '⛰️', color: '#5f8a9d',
    description: 'Asturias celebra su día junto a la festividad de la Virgen de Covadonga.',
    tradition: 'La Santina, como se conoce cariñosamente a la Virgen de Covadonga, es una figura muy querida. El 8 de septiembre se celebra también el Día de Asturias.',
    trivia: { question: '¿Qué advocación mariana se celebra en Asturias el 8 de septiembre?', answer: 'La Virgen de Covadonga', wrong: ['La Virgen del Pilar', 'La Virgen de Montserrat'], explanation: 'La Virgen de Covadonga, conocida como la Santina, es la patrona de Asturias.' },
  },
  baleares: {
    month: 3, day: 1, name: 'Día de las Illes Balears', shortName: 'Día de Illes Balears', icon: '🐚', color: '#59a2a1',
    description: 'Una jornada para celebrar la cultura plural de las islas.',
    tradition: 'El 1 de marzo recuerda la entrada en vigor del Estatuto de Autonomía de las Illes Balears. Mercados, música y actividades acercan las tradiciones de cada isla.',
    trivia: { question: '¿Qué hito recuerda el Día de las Illes Balears?', answer: 'El Estatuto de Autonomía', wrong: ['La primera travesía del Mediterráneo', 'La fundación de Palma'], explanation: 'La fecha conmemora la entrada en vigor del Estatuto de Autonomía balear, en 1983.' },
  },
  canarias: {
    month: 5, day: 30, name: 'Día de Canarias', shortName: 'Día de Canarias', icon: '🌋', color: '#d17c54',
    description: 'Un archipiélago, ocho islas y un patrimonio cultural compartido.',
    tradition: 'La música, los bailes, la artesanía y la gastronomía canarias se encuentran en una celebración común que se vive isla a isla.',
    trivia: { question: '¿Cuándo se celebra el Día de Canarias?', answer: '30 de mayo', wrong: ['15 de agosto', '12 de octubre'], explanation: 'El Día de Canarias se celebra cada 30 de mayo.' },
  },
  cantabria: {
    month: 7, day: 28, name: 'Día de las Instituciones de Cantabria', shortName: 'Instituciones de Cantabria', icon: '🌊', color: '#478e9a',
    description: 'La memoria de una reunión histórica que impulsó la identidad cántabra.',
    tradition: 'El 28 de julio recuerda la reunión de las jurisdicciones de Cantabria celebrada en Puente San Miguel en 1778, un antecedente de la organización regional.',
    trivia: { question: '¿Qué lugar acogió la reunión de 1778 que recuerda esta fecha?', answer: 'Puente San Miguel', wrong: ['Santillana del Mar', 'Potes'], explanation: 'La reunión se celebró en Puente San Miguel, en 1778.' },
  },
  'castilla-la-mancha': {
    month: 5, day: 31, name: 'Día de Castilla-La Mancha', shortName: 'Día de Castilla-La Mancha', icon: '🌾', color: '#ae8e55',
    description: 'Una jornada para compartir el patrimonio y las tradiciones manchegas.',
    tradition: 'El 31 de mayo es el Día de Castilla-La Mancha. La fecha recuerda la constitución de las primeras Cortes regionales en 1983.',
    trivia: { question: '¿Qué se conmemora el 31 de mayo en Castilla-La Mancha?', answer: 'El Día de Castilla-La Mancha', wrong: ['El Día de Aragón', 'La Fiesta Nacional'], explanation: 'El 31 de mayo es el día de la comunidad autónoma.' },
  },
  'castilla-y-leon': {
    month: 4, day: 23, name: 'Día de Castilla y León', shortName: 'Día de Castilla y León', icon: '🏰', color: '#a47855',
    description: 'Una fecha ligada a la historia comunera y a la cultura castellana y leonesa.',
    tradition: 'El 23 de abril, Villalar de los Comuneros acoge encuentros y actos culturales. El Día de Castilla y León coincide con la festividad de San Jorge.',
    trivia: { question: '¿Qué localidad acoge la celebración popular más emblemática del 23 de abril?', answer: 'Villalar de los Comuneros', wrong: ['Burgos', 'Salamanca'], explanation: 'Villalar de los Comuneros es escenario de la celebración del Día de Castilla y León.' },
  },
  cataluna: {
    month: 9, day: 11, name: 'Diada Nacional de Catalunya', shortName: 'Diada de Catalunya', icon: '🌹', color: '#b85b55',
    description: 'La Diada llena de cultura y memoria las calles de Cataluña.',
    tradition: 'Libros y rosas son protagonistas el 23 de abril; el 11 de septiembre, la Diada reúne actos cívicos, cultura y reivindicación en toda Cataluña.',
    trivia: { question: '¿Qué ciudad cayó el 11 de septiembre de 1714, fecha que recuerda la Diada?', answer: 'Barcelona', wrong: ['Girona', 'Tarragona'], explanation: 'La Diada recuerda la caída de Barcelona durante la Guerra de Sucesión, en 1714.' },
  },
  valencia: {
    month: 10, day: 9, name: 'Día de la Comunitat Valenciana', shortName: 'Día de la Comunitat', icon: '🧡', color: '#d57d4e',
    description: 'La fecha de entrada de Jaume I en Valencia, en 1238.',
    tradition: 'El 9 de octubre recuerda la entrada de Jaume I en la ciudad de Valencia. La mocadorà, con mazapán envuelto en un pañuelo, es una tradición valenciana.',
    trivia: { question: '¿Qué dulce tradicional se regala en la mocadorà valenciana?', answer: 'Mazapán', wrong: ['Turrón de Jijona', 'Horchata'], explanation: 'La mocadorà incluye mazapán con formas de frutas y verduras, envuelto en un pañuelo.' },
  },
  extremadura: {
    month: 9, day: 8, name: 'Día de Extremadura', shortName: 'Día de Extremadura', icon: '🌿', color: '#76925e',
    description: 'Extremadura celebra su día junto a la festividad de la Virgen de Guadalupe.',
    tradition: 'El 8 de septiembre es una fecha de encuentro en Extremadura y coincide con la festividad de la Virgen de Guadalupe, patrona de la región.',
    trivia: { question: '¿Qué patrona se celebra en Extremadura el 8 de septiembre?', answer: 'La Virgen de Guadalupe', wrong: ['La Virgen del Pilar', 'La Virgen de Covadonga'], explanation: 'La Virgen de Guadalupe es la patrona de Extremadura.' },
  },
  galicia: {
    month: 7, day: 25, name: 'Día Nacional de Galicia · Santiago Apóstol', shortName: 'Día de Galicia', icon: '🐚', color: '#5a8a76',
    description: 'Una celebración de la cultura gallega en la festividad de Santiago Apóstol.',
    tradition: 'El 25 de julio se celebra el Día Nacional de Galicia y la festividad de Santiago Apóstol. Música, encuentros y cultura llenan la jornada.',
    trivia: { question: '¿Qué apóstol da nombre a la festividad del 25 de julio en Galicia?', answer: 'Santiago', wrong: ['San Andrés', 'San Pablo'], explanation: 'El 25 de julio es la festividad de Santiago Apóstol y el Día Nacional de Galicia.' },
  },
  madrid: {
    month: 5, day: 2, name: 'Día de la Comunidad de Madrid', shortName: 'Día de Madrid', icon: '🏙️', color: '#8b6d93',
    description: 'Una jornada que recuerda el levantamiento del 2 de mayo de 1808.',
    tradition: 'El 2 de mayo recuerda el levantamiento popular de 1808. La Comunidad de Madrid celebra su día con actos culturales y memoria histórica.',
    trivia: { question: '¿Qué año recuerda el levantamiento del 2 de mayo?', answer: '1808', wrong: ['1812', '1898'], explanation: 'El levantamiento del 2 de mayo de Madrid tuvo lugar en 1808.' },
  },
  murcia: {
    month: 6, day: 9, name: 'Día de la Región de Murcia', shortName: 'Día de Murcia', icon: '🍋', color: '#c8a34f',
    description: 'Una fecha para celebrar la cultura y la identidad de la Región de Murcia.',
    tradition: 'El 9 de junio es el Día de la Región de Murcia. La huerta, el mar y las tradiciones de sus municipios forman parte de una identidad diversa.',
    trivia: { question: '¿En qué fecha se celebra el Día de la Región de Murcia?', answer: '9 de junio', wrong: ['9 de octubre', '28 de febrero'], explanation: 'El Día de la Región de Murcia se celebra el 9 de junio.' },
  },
  navarra: {
    month: 12, day: 3, name: 'San Francisco Javier · Día de Navarra', shortName: 'Día de Navarra', icon: '⛰️', color: '#a7544f',
    description: 'Navarra celebra su día en la festividad de San Francisco Javier.',
    tradition: 'El 3 de diciembre es el Día de Navarra y la festividad de San Francisco Javier, patrón de la comunidad. Una fecha de cultura y encuentro.',
    trivia: { question: '¿Qué santo se celebra en Navarra el 3 de diciembre?', answer: 'San Francisco Javier', wrong: ['San Fermín', 'San Jorge'], explanation: 'San Francisco Javier es el patrón de Navarra.' },
  },
  'pais-vasco': null,
  rioja: {
    month: 6, day: 9, name: 'Día de La Rioja', shortName: 'Día de La Rioja', icon: '🍇', color: '#8b4f64',
    description: 'Una jornada que celebra la identidad y la cultura riojanas.',
    tradition: 'El 9 de junio es el Día de La Rioja. La cultura, el paisaje y la tradición vitivinícola forman parte de la celebración.',
    trivia: { question: '¿En qué fecha se celebra el Día de La Rioja?', answer: '9 de junio', wrong: ['23 de abril', '12 de octubre'], explanation: 'El Día de La Rioja se celebra cada 9 de junio.' },
  },
  ceuta: {
    month: 9, day: 2, name: 'Día de Ceuta', shortName: 'Día de Ceuta', icon: '🌉', color: '#58859a',
    description: 'La ciudad autónoma celebra su historia y su singularidad entre dos orillas.',
    tradition: 'El 2 de septiembre es el Día de Ceuta. La convivencia de culturas y la historia fronteriza forman parte de su identidad.',
    trivia: { question: '¿En qué fecha celebra Ceuta su día autonómico?', answer: '2 de septiembre', wrong: ['17 de septiembre', '30 de mayo'], explanation: 'Ceuta celebra su día autonómico el 2 de septiembre.' },
  },
  melilla: {
    month: 9, day: 17, name: 'Día de Melilla', shortName: 'Día de Melilla', icon: '🏛️', color: '#b27a58',
    description: 'Una jornada para celebrar la historia y la diversidad de Melilla.',
    tradition: 'El 17 de septiembre es el Día de Melilla. La ciudad celebra su historia y una convivencia cultural que mira a ambas orillas del Mediterráneo.',
    trivia: { question: '¿En qué fecha celebra Melilla su día autonómico?', answer: '17 de septiembre', wrong: ['2 de septiembre', '9 de junio'], explanation: 'Melilla celebra su día autonómico el 17 de septiembre.' },
  },
};

const EASTER_THURSDAY_EXCEPTIONS = new Set(['cataluna', 'valencia']);
const EASTER_MONDAY_REGIONS = new Set(['baleares', 'cataluna', 'valencia', 'navarra', 'pais-vasco', 'rioja']);

export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

export function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function shiftIsoDate(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function stableOffset(seed, length) {
  let value = 0;
  for (const character of seed) value = (value * 31 + character.charCodeAt(0)) >>> 0;
  return value % length;
}

function choicesWithAnswer(answer, alternatives, seed) {
  const options = [answer, ...alternatives];
  const offset = stableOffset(seed, options.length);
  const rotated = [...options.slice(offset), ...options.slice(0, offset)];
  return { options: rotated, answer: rotated.indexOf(answer) };
}

function makeGame(definition, iso, id) {
  const gameDefinition = definition.game ?? {
    type: 'quiz',
    title: 'La pista festiva',
    instruction: 'Resuelve tres pistas para descubrir cuánto sabes de esta fecha.',
  };

  if (gameDefinition.type === 'memory' || gameDefinition.type === 'order') {
    return { ...gameDefinition };
  }

  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(`${iso}T00:00:00Z`);
  const trivia = definition.trivia;
  const first = choicesWithAnswer(trivia.answer, trivia.wrong, `${id}-trivia`);
  const monthOptions = choicesWithAnswer(
    MONTHS[month - 1][0].toUpperCase() + MONTHS[month - 1].slice(1),
    [MONTHS[(month + 10) % 12], MONTHS[month % 12]].map((name) => name[0].toUpperCase() + name.slice(1)),
    `${id}-month`,
  );
  const weekDay = WEEKDAYS[date.getUTCDay()];
  const weekDayOptions = choicesWithAnswer(
    weekDay[0].toUpperCase() + weekDay.slice(1),
    [WEEKDAYS[(date.getUTCDay() + 6) % 7], WEEKDAYS[(date.getUTCDay() + 1) % 7]].map((name) => name[0].toUpperCase() + name.slice(1)),
    `${id}-weekday`,
  );

  return {
    ...gameDefinition,
    type: 'quiz',
    questions: [
      { prompt: trivia.question, ...first, explanation: trivia.explanation },
      {
        prompt: `¿En qué mes se celebra ${definition.name}?`,
        ...monthOptions,
        explanation: `${definition.name} se celebra en ${MONTHS[month - 1]}.`,
      },
      {
        prompt: `En ${year}, ¿qué día de la semana cae ${day} de ${MONTHS[month - 1]}?`,
        ...weekDayOptions,
        explanation: `En ${year}, la fecha cae en ${weekDay}.`,
      },
    ],
  };
}

function createHoliday(definition, date, scope, regionLabel) {
  const iso = isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  const id = scope === 'national' ? definition.id : `${definition.id}-${scope === 'regional' ? 'regional' : 'national'}`;
  return {
    ...definition,
    id,
    date: iso,
    scope,
    regionLabel,
    game: makeGame(definition, iso, id),
  };
}

function dateForFixed(year, definition) {
  return new Date(Date.UTC(year, definition.month - 1, definition.day));
}

function dateForEaster(year, offset) {
  const date = easterSunday(year);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

function regionalEasterDefinition(id, name, shortName, description, trivia, color) {
  return {
    id,
    name,
    shortName,
    icon: '🕊️',
    color,
    description,
    tradition: 'La Semana Santa reúne celebraciones y costumbres distintas en cada comunidad. La fecha sigue el calendario lunar y cambia cada año.',
    trivia,
    game: {
      type: 'quiz',
      title: 'Reto de Semana Santa',
      instruction: 'Resuelve tres pistas sobre esta fecha móvil y sus tradiciones.',
    },
  };
}

export function getHolidays(year, region = 'all') {
  const national = NATIONAL_HOLIDAYS.map((holiday) => {
    const date = holiday.easterOffset == null
      ? dateForFixed(year, holiday)
      : dateForEaster(year, holiday.easterOffset);
    return createHoliday(holiday, date, 'national', 'Ámbito nacional');
  });

  if (region === 'all' || !REGIONAL_HOLIDAYS[region] && region !== 'pais-vasco') {
    return national.sort((a, b) => a.date.localeCompare(b.date));
  }

  const regionLabel = REGIONS.find((item) => item.id === region)?.label ?? 'Autonómico';
  const regional = [];
  const regionalDefinition = REGIONAL_HOLIDAYS[region];
  if (regionalDefinition) {
    regional.push(createHoliday(regionalDefinition, dateForFixed(year, regionalDefinition), 'regional', regionLabel));

    if (region === 'castilla-la-mancha') {
      const corpusDate = dateForEaster(year, 60);
      const corpus = {
        id: 'corpus-christi', name: 'Corpus Christi', shortName: 'Corpus Christi', icon: '🌿', color: '#7a9960',
        description: 'Una solemnidad que se vive con especial arraigo en muchas localidades manchegas.',
        tradition: 'El Corpus Christi se celebra el jueves posterior a la solemnidad de la Trinidad. En Castilla-La Mancha, Toledo es uno de los lugares donde la jornada se vive con especial intensidad.',
        trivia: { question: '¿Qué ciudad de Castilla-La Mancha es especialmente conocida por su celebración del Corpus Christi?', answer: 'Toledo', wrong: ['Albacete', 'Cuenca'], explanation: 'La procesión del Corpus Christi de Toledo es una celebración de gran arraigo.' },
      };
      regional.push(createHoliday(corpus, corpusDate, 'regional', regionLabel));
    }

    if (region === 'valencia') {
      const sanJose = {
        id: 'san-jose', name: 'San José · Fallas', shortName: 'San José · Fallas', icon: '🔥', color: '#d8864f',
        description: 'El calendario valenciano se enciende en torno a San José y las Fallas.',
        tradition: 'Las Fallas llenan marzo de monumentos, pólvora, música y sátira. La Cremà, la noche del 19 de marzo, despide las fiestas.',
        trivia: { question: '¿Qué acto pone fin a las Fallas la noche del 19 de marzo?', answer: 'La Cremà', wrong: ['La mascletà', 'La plantà'], explanation: 'La Cremà es el acto en el que se queman los monumentos falleros.' },
      };
      regional.push(createHoliday(sanJose, dateForFixed(year, { month: 3, day: 19 }), 'regional', regionLabel));
    }
  }

  if (!EASTER_THURSDAY_EXCEPTIONS.has(region)) {
    const maundyThursday = regionalEasterDefinition(
      'jueves-santo', 'Jueves Santo', 'Jueves Santo',
      'El inicio de los días centrales de la Semana Santa en esta comunidad.',
      {
        question: '¿Qué día de la semana cae Jueves Santo?', answer: 'Jueves', wrong: ['Miércoles', 'Viernes'],
        explanation: 'Jueves Santo es el jueves de la Semana Santa y precede al Viernes Santo.',
      }, '#8b7798',
    );
    regional.push(createHoliday(maundyThursday, dateForEaster(year, -3), 'regional', regionLabel));
  }

  if (EASTER_MONDAY_REGIONS.has(region)) {
    const easterMonday = regionalEasterDefinition(
      'lunes-pascua', 'Lunes de Pascua', 'Lunes de Pascua',
      'Una fecha móvil que prolonga las celebraciones de Semana Santa en esta comunidad.',
      {
        question: '¿Qué día de la semana cae el Lunes de Pascua?', answer: 'Lunes', wrong: ['Domingo', 'Martes'],
        explanation: 'El Lunes de Pascua es el día siguiente al Domingo de Resurrección.',
      }, '#779379',
    );
    regional.push(createHoliday(easterMonday, dateForEaster(year, 1), 'regional', regionLabel));
  }

  return [...national, ...regional].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

export function getMonthName(monthIndex) {
  return MONTHS[monthIndex];
}

export function getWeekdayName(iso) {
  return WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()];
}

export function formatLongDate(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${getWeekdayName(iso)}, ${day} de ${month} de ${year}`;
}

export function getMonthCells(year, monthIndex) {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const mondayOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(Date.UTC(year, monthIndex, index - mondayOffset + 1));
    const cellYear = date.getUTCFullYear();
    const cellMonth = date.getUTCMonth();
    const day = date.getUTCDate();
    return {
      year: cellYear,
      month: cellMonth,
      day,
      iso: isoDate(cellYear, cellMonth + 1, day),
      inMonth: cellMonth === monthIndex,
    };
  });
}

export function getDaysBetween(startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}
