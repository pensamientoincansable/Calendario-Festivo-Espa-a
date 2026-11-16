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

export const GAME_TYPES = [
  'chimes',
  'reyes',
  'santa',
  'race',
  'cooking',
  'match3',
  'runner',
  'stacker',
  'fireworks',
  'catcher',
  'breakout',
  'candles',
  'lights',
];

export const GAME_TYPE_META = {
  chimes: { label: 'Campanadas', badge: 'RITMO', goalLabel: '12 UVAS' },
  reyes: { label: 'Reyes Magos', badge: 'REYES MAGOS', goalLabel: '12 BALCONES' },
  santa: { label: 'Papá Noel', badge: 'PAPÁ NOEL', goalLabel: '10 CHIMENEAS' },
  race: { label: 'Carreras', badge: 'CARRERAS', goalLabel: 'CIRCUITO' },
  cooking: { label: 'Cocina', badge: 'COCINA', goalLabel: 'RECETARIO' },
  match3: { label: 'Dulces Match-3', badge: 'CANDY MATCH', goalLabel: 'COMBOS' },
  runner: { label: 'Saltos', badge: 'AVENTURA', goalLabel: 'DOBLE SALTO' },
  stacker: { label: 'Equilibrio', badge: 'TORRE', goalLabel: '10 PISOS' },
  fireworks: { label: 'Pirotecnia', badge: 'PIROTECNIA', goalLabel: 'CASTILLO' },
  catcher: { label: 'Cosecha', badge: 'REFLEJOS', goalLabel: 'CESTO LLENO' },
  breakout: { label: 'Vitral', badge: 'ARCADE', goalLabel: '24 VITRALES' },
  candles: { label: 'Cirios', badge: 'PULSO', goalLabel: '05 LLAMAS' },
  lights: { label: 'Luminarias', badge: 'INGENIO', goalLabel: '16 LUCES' },
};

const HALLOWEEN_CANDIES = [
  { icon: '🎃', label: 'Calabaza', bg: 'linear-gradient(145deg, #ffb55a, #df5a1b)', border: '#be4610' },
  { icon: '🍬', label: 'Caramelo brujo', bg: 'linear-gradient(145deg, #ca8fff, #7a38c4)', border: '#5e24a1' },
  { icon: '👻', label: 'Fantasma', bg: 'linear-gradient(145deg, #f5f8ff, #b4c5e8)', border: '#8b9fc9' },
  { icon: '🧪', label: 'Poción verde', bg: 'linear-gradient(145deg, #7be69d, #249654)', border: '#1a7740' },
  { icon: '🍭', label: 'Piruleta', bg: 'linear-gradient(145deg, #ff85a2, #d42c5a)', border: '#ae1d45' },
  { icon: '⭐', label: 'Hechizo dorado', bg: 'linear-gradient(145deg, #ffe97d, #d8991c)', border: '#b37b0e' },
];

const VINEYARD_CANDIES = [
  { icon: '🍇', label: 'Tempranillo', bg: 'linear-gradient(145deg, #b565a7, #6d2e6d)', border: '#531f53' },
  { icon: '🍷', label: 'Crianza', bg: 'linear-gradient(145deg, #e0576a, #941b2f)', border: '#741122' },
  { icon: '🌿', label: 'Pámpano', bg: 'linear-gradient(145deg, #95d582, #468947)', border: '#346d35' },
  { icon: '☀️', label: 'Sol del Ebro', bg: 'linear-gradient(145deg, #ffe57f, #da9422)', border: '#b37512' },
  { icon: '🧀', label: 'Camerano', bg: 'linear-gradient(145deg, #fff1c9, #d4ab6a)', border: '#b38948' },
  { icon: '🍑', label: 'Melocotón', bg: 'linear-gradient(145deg, #ffad76, #d9643a)', border: '#b54c26' },
];

const PASCHAL_CANDIES = [
  { icon: '🥚', label: 'Huevo pintado', bg: 'linear-gradient(145deg, #ffe8a3, #e09f3e)', border: '#bd7e24' },
  { icon: '🍫', label: 'Mona de cacao', bg: 'linear-gradient(145deg, #b07d62, #6f4530)', border: '#55311f' },
  { icon: '🐣', label: 'Pollito', bg: 'linear-gradient(145deg, #fff275, #e6b800)', border: '#bf9600' },
  { icon: '🍓', label: 'Fresa fresca', bg: 'linear-gradient(145deg, #ff8597, #d63447)', border: '#b02233' },
  { icon: '🪶', label: 'Pluma de color', bg: 'linear-gradient(145deg, #90e0ef, #3a86a8)', border: '#296987' },
  { icon: '🌸', label: 'Flor de almendro', bg: 'linear-gradient(145deg, #ffc8dd, #c96892)', border: '#a64d74' },
];

const RECIPES_HISPANIDAD = [
  {
    id: 'tortilla', name: 'Tortilla de patatas', origin: 'Clásico imprescindible', dishIcon: '🍳', vessel: 'Sartén de hierro',
    ingredients: [
      { id: 'patata', icon: '🥔', label: 'Patatas' },
      { id: 'huevo', icon: '🥚', label: 'Huevos camperos' },
      { id: 'aceite', icon: '🫒', label: 'Aceite de oliva' },
      { id: 'cebolla', icon: '🧅', label: 'Cebolla pochada' },
      { id: 'sal', icon: '🧂', label: 'Pizca de sal' },
    ],
    decoys: [
      { id: 'pina', icon: '🍍', label: 'Piña', quip: '¡¿Piña en la tortilla?! ¡La abuela nos deshereda!' },
      { id: 'choco', icon: '🍫', label: 'Chocolate', quip: '¡Guarda el chocolate para los churros!' },
      { id: 'refresco', icon: '🥤', label: 'Refresco', quip: '¡En esta sartén solo entra aceite de oliva!' },
    ],
    technique: 'flip',
    actionTitle: '¡Voltea la tortilla en su punto jugoso!',
    actionButton: '¡Dar la vuelta a la sartén!',
    zoneLabel: 'JUGOSA Y DORADA',
  },
  {
    id: 'paella', name: 'Paella al fuego de leña', origin: 'Receta mediterránea', dishIcon: '🥘', vessel: 'Paellera ancha',
    ingredients: [
      { id: 'arroz', icon: '🍚', label: 'Arroz bomba' },
      { id: 'azafran', icon: '🌼', label: 'Azafrán en hebra' },
      { id: 'pollo', icon: '🍗', label: 'Pollo dorado' },
      { id: 'judia', icon: '🫛', label: 'Judía verde' },
      { id: 'tomate', icon: '🍅', label: 'Tomate rallado' },
    ],
    decoys: [
      { id: 'ketchup', icon: '🌭', label: 'Kétchup', quip: '¡Alto ahí! El sofrito lleva tomate natural.' },
      { id: 'helado', icon: '🍦', label: 'Vainilla', quip: '¡Eso apagaría las brasas del naranjo!' },
      { id: 'donut', icon: '🍩', label: 'Glaseado', quip: '¡El único oro aquí lo pone el azafrán!' },
    ],
    technique: 'simmer',
    actionTitle: 'Vigila las brasas y clava el socarrat',
    actionButton: '¡Apartar en el socarrat!',
    zoneLabel: 'SOCARRAT PERFECTO',
  },
  {
    id: 'gazpacho', name: 'Gazpacho andaluz', origin: 'Huerta de verano', dishIcon: '🥣', vessel: 'Lebrillo de barro',
    ingredients: [
      { id: 'tomates', icon: '🍅', label: 'Tomate maduro' },
      { id: 'pepino', icon: '🥒', label: 'Pepino fresco' },
      { id: 'pimiento', icon: '🫑', label: 'Pimiento verde' },
      { id: 'ajo', icon: '🧄', label: 'Diente de ajo' },
      { id: 'aove', icon: '🫒', label: 'AOVE virgen extra' },
    ],
    decoys: [
      { id: 'cupcake', icon: '🧁', label: 'Merengue', quip: '¡Se emulsiona con buen aceite, no con nata!' },
      { id: 'palomitas', icon: '🍿', label: 'Palomitas', quip: '¡Para acompañar mejor picatostes de pan!' },
      { id: 'caramelo', icon: '🍬', label: 'Caramelo', quip: '¡Los tomates de huerta ya dan todo el sabor!' },
    ],
    technique: 'blend',
    actionTitle: 'Pulsa al ritmo para mantener la aguja en la emulsión',
    actionButton: '¡Emulsionar el gazpacho!',
    zoneLabel: 'EMULSIÓN SEDOSA',
  },
];

const RECIPES_ANDALUCIA = [
  {
    id: 'mollete', name: 'Pan con aceite y tomate', origin: 'Desayuno andaluz', dishIcon: '🥖', vessel: 'Tostador de pan',
    ingredients: [
      { id: 'pan', icon: '🥖', label: 'Mollete artesano' },
      { id: 'aove', icon: '🫒', label: 'AOVE temprano' },
      { id: 'tomate', icon: '🍅', label: 'Tomate triturado' },
      { id: 'sal', icon: '🧂', label: 'Sal en escamas' },
    ],
    decoys: [
      { id: 'gominola', icon: '🍬', label: 'Gominola', quip: '¡Con nuestro oro líquido no hace falta nada más!' },
      { id: 'helado', icon: '🍧', label: 'Granizado', quip: '¡Deja el mollete calentito y crujiente!' },
    ],
    technique: 'simmer',
    actionTitle: 'Tuesta el mollete hasta dejarlo crujiente y dorado',
    actionButton: '¡Sacar tostada dorada!',
    zoneLabel: 'TOSTADO PERFECTO',
  },
  {
    id: 'salmorejo', name: 'Salmorejo cordobés', origin: 'Córdoba', dishIcon: '🥣', vessel: 'Mortero y batidora',
    ingredients: [
      { id: 'tomate', icon: '🍅', label: 'Tomate en rama' },
      { id: 'telera', icon: '🍞', label: 'Pan de telera' },
      { id: 'aove', icon: '🫒', label: 'Aceite virgen extra' },
      { id: 'ajo', icon: '🧄', label: 'Ajo de Montalbán' },
      { id: 'huevo', icon: '🥚', label: 'Huevo picado' },
    ],
    decoys: [
      { id: 'choco', icon: '🍫', label: 'Cacao', quip: '¡El salmorejo brilla en rojo vivo!' },
      { id: 'pina', icon: '🍍', label: 'Piña', quip: '¡Mejor coronarlo con huevo duro y jamón!' },
    ],
    technique: 'blend',
    actionTitle: 'Pulsa para ligar una crema espesa y aterciopelada',
    actionButton: '¡Ligar el salmorejo!',
    zoneLabel: 'CREMA SEDOSA',
  },
];

const RECIPES_CANARIAS = [
  {
    id: 'papas', name: 'Papas arrugadas con mojo', origin: 'Ocho islas', dishIcon: '🥔', vessel: 'Caldero isleño',
    ingredients: [
      { id: 'papa', icon: '🥔', label: 'Papa bonita' },
      { id: 'sal', icon: '🧂', label: 'Sal marina gruesa' },
      { id: 'pimiento', icon: '🌶️', label: 'Pimienta picona' },
      { id: 'ajo', icon: '🧄', label: 'Ajo y comino' },
      { id: 'aceite', icon: '🫒', label: 'Aceite y vinagre' },
    ],
    decoys: [
      { id: 'donut', icon: '🍩', label: 'Azúcar glas', quip: '¡La costra blanca de las papas es de sal marina!' },
      { id: 'sushi', icon: '🍣', label: 'Soja', quip: '¡Aquí se moja en mojo rojo o mojo verde!' },
    ],
    technique: 'simmer',
    actionTitle: 'Seca las papas al fuego hasta arrugar la piel',
    actionButton: '¡Papas en su punto!',
    zoneLabel: 'PIEL ARRUGADITA',
  },
  {
    id: 'gofio', name: 'Escaldón de gofio', origin: 'Tradición canaria', dishIcon: '🥣', vessel: 'Lebrillo de barro',
    ingredients: [
      { id: 'gofio', icon: '🌾', label: 'Gofio tostado' },
      { id: 'caldo', icon: '🍲', label: 'Caldo caliente' },
      { id: 'cebolla', icon: '🧅', label: 'Cebolla roja' },
      { id: 'yerba', icon: '🌿', label: 'Hierbahuerto' },
    ],
    decoys: [
      { id: 'piruleta', icon: '🍭', label: 'Piruleta', quip: '¡El gofio lleva aroma de cereal tostado!' },
      { id: 'hielo', icon: '🧊', label: 'Cubitos', quip: '¡Para escaldar hace falta el caldo bien caliente!' },
    ],
    technique: 'blend',
    actionTitle: 'Amasa con brío hasta lograr una textura suave',
    actionButton: '¡Remover el escaldón!',
    zoneLabel: 'AMASADO SUAVE',
  },
];

const RECIPES_MURCIA = [
  {
    id: 'zarangollo', name: 'Zarangollo de la huerta', origin: 'Huerta de Murcia', dishIcon: '🍳', vessel: 'Sartén huertana',
    ingredients: [
      { id: 'calabacin', icon: '🥒', label: 'Calabacín tierno' },
      { id: 'cebolla', icon: '🧅', label: 'Cebolla dulce' },
      { id: 'huevo', icon: '🥚', label: 'Huevos de corral' },
      { id: 'aceite', icon: '🫒', label: 'Aceite de oliva' },
      { id: 'sal', icon: '🧂', label: 'Sal fina' },
    ],
    decoys: [
      { id: 'caramelo', icon: '🍬', label: 'Regaliz', quip: '¡En el zarangollo manda la verdura pochadita!' },
      { id: 'palomita', icon: '🍿', label: 'Palomitas', quip: '¡A fuego lento, sin prisas!' },
    ],
    technique: 'simmer',
    actionTitle: 'Cuaja el huevo suavemente para que quede meloso',
    actionButton: '¡Retirar meloso!',
    zoneLabel: 'PUNTO MELOSO',
  },
  {
    id: 'paparajotes', name: 'Paparajotes murcianos', origin: 'Dulce de barraca', dishIcon: '🍋', vessel: 'Sartén honda',
    ingredients: [
      { id: 'hoja', icon: '🍋', label: 'Hoja de limonero' },
      { id: 'harina', icon: '🌾', label: 'Harina y leche' },
      { id: 'huevo', icon: '🥚', label: 'Huevo batido' },
      { id: 'canela', icon: '✨', label: 'Azúcar y canela' },
    ],
    decoys: [
      { id: 'ajo', icon: '🧄', label: 'Ajo crudo', quip: '¡Cuidado, que los paparajotes son dulces!' },
      { id: 'guindilla', icon: '🌶️', label: 'Guindilla', quip: '¡Solo aroma de limón y canela! (Y no te comas la hoja).' },
    ],
    technique: 'flip',
    actionTitle: '¡Voltea el paparajote cuando la masa esté dorada!',
    actionButton: '¡Dar la vuelta!',
    zoneLabel: 'CRUJIENTE Y DORADO',
  },
];

const RECIPES_VALENCIA = [
  {
    id: 'mocadora', name: 'Mazapanes de la Mocadorà', origin: 'Sant Donís · 9 d’Octubre', dishIcon: '🍊', vessel: 'Horno artesano',
    ingredients: [
      { id: 'almendra', icon: '🌰', label: 'Almendra marcona' },
      { id: 'azucar', icon: '✨', label: 'Azúcar fino' },
      { id: 'limon', icon: '🍋', label: 'Ralladura cítrica' },
      { id: 'huevo', icon: '🥚', label: 'Clara fresca' },
    ],
    decoys: [
      { id: 'cebolla', icon: '🧅', label: 'Cebolla', quip: '¡Las frutitas de Sant Donís son de puro mazapán!' },
      { id: 'picante', icon: '🌶️', label: 'Guindilla', quip: '¡Los piuets petan en la fiesta, no en el paladar!' },
    ],
    technique: 'simmer',
    actionTitle: 'Hornea las figuritas de mazapán sin pasarlas',
    actionButton: '¡Sacar del horno!',
    zoneLabel: 'DORADO ARTESANO',
  },
  {
    id: 'horchata', name: 'Orxata fresca de chufa', origin: 'L’Horta de València', dishIcon: '🥛', vessel: 'Prensa tradicional',
    ingredients: [
      { id: 'chufa', icon: '🥜', label: 'Chufa de Alboraya' },
      { id: 'agua', icon: '🧊', label: 'Agua bien fría' },
      { id: 'limon', icon: '🍋', label: 'Piel de limón' },
      { id: 'canela', icon: '✨', label: 'Toque de canela' },
    ],
    decoys: [
      { id: 'ketchup', icon: '🍅', label: 'Tomate', quip: '¡A la horchata solo la acompañan unos buenos fartons!' },
      { id: 'queso', icon: '🧀', label: 'Queso', quip: '¡La horchata auténtica es 100% de chufa!' },
    ],
    technique: 'blend',
    actionTitle: 'Tritura y emulsiona la chufa bien fresquita',
    actionButton: '¡Batir la horchata!',
    zoneLabel: 'FRESCA Y CREMOSA',
  },
];

const NATIONAL_HOLIDAYS = [
  {
    id: 'ano-nuevo', month: 1, day: 1, name: 'Año Nuevo', shortName: 'Año Nuevo',
    icon: '🎆', color: '#e7795f',
    description: 'Estrenamos el año con doce campanadas y una página en blanco.',
    tradition: 'En España, las doce uvas acompañan las últimas campanadas del reloj de la Puerta del Sol. Una por cada mes, y un deseo —o una risa— para empezar de nuevo.',
    game: {
      type: 'chimes',
      title: 'Las Doce Uvas del Sol',
      instruction: 'Sincroniza tu pulso con el badajo del reloj y tómate las doce uvas justo cuando cruce las XII.',
    },
  },
  {
    id: 'epifania', month: 1, day: 6, name: 'Epifanía del Señor · Reyes', shortName: 'Día de Reyes',
    icon: '👑', color: '#d9a648',
    description: 'Una mañana de ilusión, cabalgata mágica y roscón compartido.',
    tradition: 'La noche del 5 de enero, Melchor, Gaspar y Baltasar recorren pueblos y ciudades. Al despertar, los regalos esperan junto a los zapatos y se comparte el roscón.',
    game: {
      type: 'reyes',
      title: 'Cabalgata de los Reyes Magos',
      instruction: 'Guía a Melchor, Gaspar y Baltasar bajo la Estrella de Oriente, lanza regalos a los balcones con zapatos, atrapa caramelos y roscón y esquiva el carbón.',
      goal: 12,
    },
  },
  {
    id: 'viernes-santo', easterOffset: -2, name: 'Viernes Santo', shortName: 'Viernes Santo',
    icon: '🕯️', color: '#8072a7',
    description: 'Una jornada de recogimiento y luz serena en plena Semana Santa.',
    tradition: 'La Semana Santa se vive de formas distintas en cada rincón: pasos, tambores, saetas, silencio y la luz cálida de los cirios al caer la noche.',
    game: {
      type: 'candles',
      title: 'Guardián de los Cirios',
      instruction: 'Desliza el guardabrisa dorado para proteger las cinco llamas de las ráfagas nocturnas hasta llegar a la plaza.',
      duration: 24,
    },
  },
  {
    id: 'trabajo', month: 5, day: 1, name: 'Fiesta del Trabajo', shortName: 'Día del Trabajo',
    icon: '🧰', color: '#588a73',
    description: 'Un día para celebrar los oficios y lo que levantamos en equipo.',
    tradition: 'El Primero de Mayo reconoce los derechos laborales y el pulso colectivo de cada oficio, taller y profesión.',
    game: {
      type: 'stacker',
      title: 'La Torre de los Oficios',
      instruction: 'Coloca cada planta en el instante exacto para levantar un edificio firme de diez alturas sin perder base.',
      style: 'guild',
      crownIcon: '🏛️',
      goal: 10,
    },
  },
  {
    id: 'asuncion', month: 8, day: 15, name: 'Asunción de la Virgen', shortName: 'La Asunción',
    icon: '🎆', color: '#c7839a',
    description: 'Fiestas patronales, plazas iluminadas y noches de verbena en agosto.',
    tradition: 'El 15 de agosto llena cientos de pueblos y ciudades de verbenas, reencuentros y castillos de fuegos artificiales bajo el cielo de verano.',
    game: {
      type: 'fireworks',
      title: 'Cielo de Verbena',
      instruction: 'Haz estallar los cohetes cuando entren en su aro dorado para iluminar la plaza con palmeras de colores.',
      goal: 14,
    },
  },
  {
    id: 'fiesta-nacional', month: 10, day: 12, name: 'Fiesta Nacional · Hispanidad', shortName: 'Hispanidad',
    icon: '🇪🇸', color: '#d9854b',
    description: 'La fecha común del calendario y un homenaje a nuestra cultura y mesa.',
    tradition: 'El 12 de octubre celebra el Día de la Fiesta Nacional y la Hispanidad: historia, lengua compartida y una gastronomía célebre en todo el mundo.',
    game: {
      type: 'cooking',
      title: 'Fogones de España',
      instruction: 'Prepara tres recetas españolas míticas: elige los ingredientes auténticos, voltea la tortilla, clava el socarrat de la paella y emulsiona el gazpacho.',
      recipes: RECIPES_HISPANIDAD,
    },
  },
  {
    id: 'todos-santos', month: 11, day: 1, name: 'Todos los Santos', shortName: 'Todos los Santos',
    icon: '🌰', color: '#84728f',
    description: 'Memoria, flores de otoño y el aroma cálido de las castañas asadas.',
    tradition: 'Además del recuerdo a los seres queridos, el 1 de noviembre huele a castañada, magosto, panellets, buñuelos de viento y huesos de santo.',
    game: {
      type: 'catcher',
      title: 'El Puesto de la Castañera',
      instruction: 'Mueve el cesto de mimbre para recoger castañas asadas, buñuelos y dulces de otoño mientras esquivas los erizos pinchudos.',
      goodIcons: ['🌰', '🥨', '🧁'],
      goldIcon: '🍯',
      badIcon: '🦔',
      vesselLabel: 'CASTAÑAS',
      bgTop: '#2f2228',
      bgBottom: '#6a4534',
      goal: 15,
    },
  },
  {
    id: 'constitucion', month: 12, day: 6, name: 'Día de la Constitución', shortName: 'Constitución',
    icon: '🏛️', color: '#5c7794',
    description: 'La jornada cívica que conmemora la Constitución de 1978.',
    tradition: 'El 6 de diciembre recuerda la ratificación de la Constitución española, con jornadas de puertas abiertas bajo la gran bóveda acristalada del Congreso.',
    game: {
      type: 'breakout',
      title: 'La Bóveda de Cristal',
      instruction: 'Desliza la plataforma de mármol, haz rebotar la esfera dorada e ilumina las 24 vidrieras de colores.',
    },
  },
  {
    id: 'inmaculada', month: 12, day: 8, name: 'Inmaculada Concepción', shortName: 'La Inmaculada',
    icon: '✨', color: '#7c9caa',
    description: 'El puente luminoso en el que los hogares encienden la Navidad.',
    tradition: 'En el calendario popular español, el 8 de diciembre es la tarde elegida por muchísimas familias para montar el belén, el árbol y encender las luces.',
    game: {
      type: 'lights',
      title: 'Enciende el Árbol',
      instruction: 'Gira los tramos de guirnalda dorada hasta conectar la estrella central con todos los adornos luminosos.',
      size: 4,
      bulbIcon: '🎄',
    },
  },
  {
    id: 'navidad', month: 12, day: 25, name: 'Natividad del Señor · Navidad', shortName: 'Navidad',
    icon: '🎅', color: '#4f8c71',
    description: 'Noche mágica de chimeneas encendidas, regalos, villancicos y hogar.',
    tradition: 'Entre Nochebuena y la mañana de Navidad, las casas se llenan de luces y sobremesas mientras el trineo de Papá Noel sobrevuela los tejados.',
    game: {
      type: 'santa',
      title: 'El Trineo de Papá Noel',
      instruction: 'Pilota a Papá Noel y a Rodolfo sobre los tejados nevados, esquiva las ventiscas y suelta los regalos justo por las chimeneas.',
      goal: 10,
    },
  },
];

// Fechas populares muy celebradas en toda España con su propio minijuego temático.
const POPULAR_HOLIDAYS = [
  {
    id: 'carnaval', easterOffset: -47, name: 'Martes de Carnaval', shortName: 'Carnaval',
    icon: '🎭', color: '#d4627a',
    description: 'Disfraces, chirigotas, comparsas y desfiles de carrozas y autos locos.',
    tradition: 'De Cádiz a Santa Cruz de Tenerife, Águilas o Xinzo de Limia, el Carnaval toma las calles con ingenio, música y bajadas de autos locos.',
    game: {
      type: 'race',
      title: 'Carrera de Autos Locos',
      instruction: 'Ponte al volante de tu bólido carnavalero, adelanta carrozas, pisa los aceleradores y usa el turbo hasta cruzar la meta.',
      track: 'soapbox',
      tokenIcon: '🎭',
      distance: 2200,
    },
  },
  {
    id: 'san-juan', month: 6, day: 24, name: 'Noche de San Juan', shortName: 'San Juan',
    icon: '🔥', color: '#e07a47',
    description: 'La noche más corta del año da la bienvenida al verano junto al fuego.',
    tradition: 'La víspera del 24 de junio, playas y plazas se iluminan con hogueras que se saltan pidiendo deseos y dando la bienvenida al solsticio.',
    game: {
      type: 'runner',
      title: 'Las Hogueras de San Juan',
      instruction: 'Corre por la orilla a medianoche, salta las hogueras y las olas (con doble salto) y atrapa farolillos de los deseos.',
      scene: 'bonfire',
      goal: 12,
    },
  },
  {
    id: 'san-cristobal', month: 7, day: 10, name: 'San Cristóbal · Fiesta del Motor', shortName: 'San Cristóbal',
    icon: '🏎️', color: '#cf5340',
    description: 'La gran fiesta de los conductores, transportistas y vehículos engalanados.',
    tradition: 'Cada 10 de julio, numerosos municipios de España celebran a San Cristóbal, patrón de los conductores, con caravanas, bocinazos y exhibiciones de motor.',
    game: {
      type: 'race',
      title: 'Gran Premio de San Cristóbal',
      instruction: 'Acelera por los cuatro carriles, esquiva conos y tráfico, recoge medallas doradas y activa el turbo para ganar el trofeo del motor.',
      track: 'highway',
      tokenIcon: '🏅',
      distance: 2500,
    },
  },
  {
    id: 'halloween', month: 10, day: 31, name: 'Halloween · Noche de Brujas', shortName: 'Halloween',
    icon: '🎃', color: '#d96b27',
    description: 'Calabazas encendidas, disfraces, Samaín y un festín de dulces embrujados.',
    tradition: 'La noche del 31 de octubre une el truco o trato de Halloween con tradiciones ancestrales como el Samaín o la víspera de ánimas.',
    game: {
      type: 'match3',
      title: 'Dulce Embrujo',
      instruction: 'Intercambia caramelos, calabazas y pociones de 3 en 3. Junta 4 para crear rayos explosivos y 5 para invocar el caldero mágico.',
      boardTheme: 'spooky',
      candies: HALLOWEEN_CANDIES,
      bombIcon: '🔮',
      size: 7,
      moves: 16,
      target: 1150,
    },
  },
];

const REGIONAL_HOLIDAYS = {
  andalucia: {
    month: 2, day: 28, name: 'Día de Andalucía', shortName: 'Día de Andalucía', icon: '💚', color: '#67956f',
    description: 'Identidad, alegría y el aroma del pan con aceite de oliva virgen extra.',
    tradition: 'El verde y el blanco llenan balcones y patios. Es tradición compartir molletes con aceite de oliva y celebrar la cultura de las ocho provincias.',
    game: {
      type: 'cooking',
      title: 'Desayuno Andaluz y Salmorejo',
      instruction: 'Tuesta un mollete con AOVE en su punto exacto y emulsiona un auténtico salmorejo cordobés.',
      recipes: RECIPES_ANDALUCIA,
    },
  },
  aragon: {
    month: 4, day: 23, name: 'Día de Aragón · San Jorge', shortName: 'San Jorge · Aragón', icon: '🐉', color: '#c85e50',
    description: 'La leyenda del caballero y el dragón junto a calles llenas de libros y rosas.',
    tradition: 'El 23 de abril, Aragón celebra a su patrón San Jorge entre puestos de libros, rosas rojas, cultura y la célebre leyenda del dragón.',
    game: {
      type: 'runner',
      title: 'La Leyenda de San Jorge',
      instruction: 'Galopa sorteando las llamaradas del dragón con saltos y dobles saltos mientras recoges rosas rojas.',
      scene: 'dragon',
      goal: 12,
    },
  },
  asturias: {
    month: 9, day: 8, name: 'Día de Asturias', shortName: 'Día de Asturias', icon: '🍏', color: '#5f8a9d',
    description: 'Asturias celebra a la Santina entre montañas verdes, gaitas y sidra.',
    tradition: 'El 8 de septiembre honra a la Virgen de Covadonga y reúne romerías, folclore y el arte de escanciar sidra natural.',
    game: {
      type: 'catcher',
      title: 'El Escanciador de Sidra',
      instruction: 'Mueve el vaso fino de sidra para atrapar manzanas de pomarada y culines dorados esquivando las avispas.',
      vessel: 'glass',
      vesselLabel: 'CULINES',
      goodIcons: ['🍏', '🍎', '🥂'],
      goldIcon: '🍾',
      badIcon: '🐝',
      bgTop: '#1d3b34',
      bgBottom: '#3e6b54',
      goal: 15,
    },
  },
  baleares: {
    month: 3, day: 1, name: 'Día de las Illes Balears', shortName: 'Día de Illes Balears', icon: '⛵', color: '#59a2a1',
    description: 'Cuatro islas unidas por la brisa y la tradición marinera del Mediterráneo.',
    tradition: 'El 1 de marzo celebra el Estatuto balear con mercados artesanos, música, gastronomía isleña y regatas de vela latina.',
    game: {
      type: 'race',
      title: 'Regata de Llaüts',
      instruction: 'Gobierna tu llaüt por aguas turquesas, esquiva boyas, aprovecha las corrientes y activa la racha de viento hasta la meta.',
      track: 'sea',
      tokenIcon: '🐚',
      distance: 2200,
    },
  },
  canarias: {
    month: 5, day: 30, name: 'Día de Canarias', shortName: 'Día de Canarias', icon: '🌋', color: '#d17c54',
    description: 'Ocho islas atlánticas con parrandas, romerías y sabores inconfundibles.',
    tradition: 'El 30 de mayo suenan timples e isas y se comparten enyesques con papas arrugadas, mojos, quesos y gofio.',
    game: {
      type: 'cooking',
      title: 'Fogones de las Ocho Islas',
      instruction: 'Prepara unas papas arrugadas con mojo picón y amasa un escaldón de gofio en su punto.',
      recipes: RECIPES_CANARIAS,
    },
  },
  cantabria: {
    month: 7, day: 28, name: 'Día de las Instituciones de Cantabria', shortName: 'Instituciones de Cantabria', icon: '🌊', color: '#478e9a',
    description: 'Mar Cantábrico, valles verdes y la memoria histórica de Puente San Miguel.',
    tradition: 'El 28 de julio recuerda la unión de los valles cántabros en 1778, en pleno verano de traineras y fiestas marineras.',
    game: {
      type: 'race',
      title: 'Bandera del Cantábrico',
      instruction: 'Surca el canal de regatas a toda palada, esquiva las balizas y encadena olas favorables rumbo a la bandera.',
      track: 'sea',
      tokenIcon: '⚓',
      distance: 2300,
    },
  },
  'castilla-la-mancha': {
    month: 5, day: 31, name: 'Día de Castilla-La Mancha', shortName: 'Día de Castilla-La Mancha', icon: '🌾', color: '#ae8e55',
    description: 'Llanuras doradas, molinos de viento, artesanía e ingenio quijotesco.',
    tradition: 'El 31 de mayo celebra la identidad manchega entre patrimonio histórico, azafrán y los icónicos molinos blancos.',
    game: {
      type: 'runner',
      title: 'Galope entre Molinos',
      instruction: 'Cabalga bajo las aspas manchegas, salta torbellinos y peñascos y recoge espigas doradas.',
      scene: 'windmill',
      goal: 12,
    },
  },
  'castilla-y-leon': {
    month: 4, day: 23, name: 'Día de Castilla y León', shortName: 'Día de Castilla y León', icon: '🏰', color: '#a47855',
    description: 'Historia comunera, piedra dorada y patrimonio monumental.',
    tradition: 'El 23 de abril reúne música y cultura en Villalar de los Comuneros y en toda una tierra de castillos y plazas mayores.',
    game: {
      type: 'stacker',
      title: 'El Torreón del Castillo',
      instruction: 'Asienta sillar sobre sillar con pulso firme hasta alzar las diez alturas de la torre del homenaje.',
      style: 'castle',
      crownIcon: '🏰',
      goal: 10,
    },
  },
  cataluna: {
    month: 9, day: 11, name: 'Diada Nacional de Catalunya', shortName: 'Diada de Catalunya', icon: '🌹', color: '#b85b55',
    description: 'Cultura, plazas vivas, música y fuerza colectiva en cada rincón.',
    tradition: 'El 11 de septiembre llena Cataluña de actos cívicos y cultura popular, con los castells como símbolo de equilibrio y equipo.',
    game: {
      type: 'stacker',
      title: 'El Castell hasta l’Enxaneta',
      instruction: 'Equilibra cada piso de la colla con precisión milimétrica hasta coronar los diez niveles del castell.',
      style: 'castell',
      crownIcon: '🙌',
      goal: 10,
    },
  },
  valencia: {
    month: 10, day: 9, name: 'Día de la Comunitat Valenciana', shortName: 'Día de la Comunitat', icon: '🧡', color: '#d57d4e',
    description: 'Historia, pólvora festiva y el dulzor artesano de la mocadorà.',
    tradition: 'El 9 de octubre conmemora la entrada de Jaume I en Valencia y celebra Sant Donís regalando mazapanes envueltos en un pañuelo.',
    game: {
      type: 'cooking',
      title: 'Obrador de la Mocadorà',
      instruction: 'Hornea los mazapanes artesanos de Sant Donís y prepara una horchata fresca de chufa de Alboraya.',
      recipes: RECIPES_VALENCIA,
    },
  },
  extremadura: {
    month: 9, day: 8, name: 'Día de Extremadura', shortName: 'Día de Extremadura', icon: '🍒', color: '#76925e',
    description: 'Dehesas infinitas, patrimonio bimilenario y la fiesta de Guadalupe.',
    tradition: 'El 8 de septiembre celebra el Día de Extremadura junto a la Virgen de Guadalupe y los frutos únicos de su tierra.',
    game: {
      type: 'catcher',
      title: 'Cosecha de la Dehesa',
      instruction: 'Desliza la cesta para atrapar cerezas del Jerte, bellotas y pimentón dorado evitando los cardos.',
      vesselLabel: 'COSECHA',
      goodIcons: ['🍒', '🌰', '🌶️'],
      goldIcon: '⭐',
      badIcon: '🌵',
      bgTop: '#243a27',
      bgBottom: '#526f43',
      goal: 15,
    },
  },
  galicia: {
    month: 7, day: 25, name: 'Día Nacional de Galicia · Santiago', shortName: 'Día de Galicia', icon: '🐚', color: '#5a8a76',
    description: 'Caminos verdes, gaitas y la gran fiesta de Santiago Apóstol.',
    tradition: 'El 25 de julio culminan rutas y celebraciones en la plaza del Obradoiro para festejar el Día Nacional de Galicia.',
    game: {
      type: 'race',
      title: 'Sprint a Compostela',
      instruction: 'Pedalea a toda velocidad hacia el Obradoiro, recoge conchas de vieira, esquiva obstáculos y lanza el sprint final.',
      track: 'bike',
      tokenIcon: '🐚',
      distance: 2200,
    },
  },
  madrid: {
    month: 5, day: 2, name: 'Día de la Comunidad de Madrid', shortName: 'Día de Madrid', icon: '⭐', color: '#8b6d93',
    description: 'Calles vibrantes, sierra cercana y la memoria histórica del Dos de Mayo.',
    tradition: 'El 2 de mayo llena Madrid de conciertos, fiestas populares y escapadas entre sus bulevares y los puertos de la sierra.',
    game: {
      type: 'race',
      title: 'Rally Clásico de la Sierra',
      instruction: 'Conduce un clásico madrileño por los cuatro carriles, atrapa las estrellas doradas y exprime el turbo hasta la meta.',
      track: 'rally',
      tokenIcon: '⭐',
      distance: 2400,
    },
  },
  murcia: {
    month: 6, day: 9, name: 'Día de la Región de Murcia', shortName: 'Día de Murcia', icon: '🍋', color: '#c8a34f',
    description: 'Sol mediterráneo, dos mares y la despensa viva de la huerta murciana.',
    tradition: 'El 9 de junio celebra el Estatuto murciano con cultura y el sabor inconfundible de sus barracas y limoneros.',
    game: {
      type: 'cooking',
      title: 'Sabores de la Huerta',
      instruction: 'Cocina un zarangollo meloso y voltea unos auténticos paparajotes dorados con aroma de limón.',
      recipes: RECIPES_MURCIA,
    },
  },
  navarra: {
    month: 12, day: 3, name: 'San Francisco Javier · Día de Navarra', shortName: 'Día de Navarra', icon: '🧣', color: '#a7544f',
    description: 'De los Pirineos a la Ribera, Navarra celebra su historia y su carácter.',
    tradition: 'El 3 de diciembre festeja a San Francisco Javier con música coral, danzas y tradiciones de toda la Comunidad Foral.',
    game: {
      type: 'runner',
      title: 'Carrera por los Valles',
      instruction: 'Corre a buen ritmo saltando los vallados de madera (con doble salto) y recogiendo pañuelicos rojos.',
      scene: 'valley',
      goal: 12,
    },
  },
  'pais-vasco': null,
  rioja: {
    month: 6, day: 9, name: 'Día de La Rioja', shortName: 'Día de La Rioja', icon: '🍇', color: '#8b4f64',
    description: 'Viñedos junto al Ebro, cuna de la lengua y hospitalidad riojana.',
    tradition: 'El 9 de junio celebra la identidad de La Rioja entre monasterios históricos, huertas y cultura vitivinícola.',
    game: {
      type: 'match3',
      title: 'Vendimia de Colores',
      instruction: 'Combina racimos de tempranillo, copas y soles del Ebro de 3 en 3 y desata barricas explosivas para superar la meta.',
      boardTheme: 'vineyard',
      candies: VINEYARD_CANDIES,
      bombIcon: '🛢️',
      size: 7,
      moves: 16,
      target: 1150,
    },
  },
  ceuta: {
    month: 9, day: 2, name: 'Día de Ceuta', shortName: 'Día de Ceuta', icon: '⚓', color: '#58859a',
    description: 'Donde se abrazan el Atlántico y el Mediterráneo entre dos continentes.',
    tradition: 'El 2 de septiembre festeja la historia marinera y la convivencia de culturas de la ciudad autónoma.',
    game: {
      type: 'race',
      title: 'Travesía del Estrecho',
      instruction: 'Navega a toda vela entre el Atlántico y el Mediterráneo, esquiva boyas y usa las rachas de levante para ganar.',
      track: 'sea',
      tokenIcon: '🧭',
      distance: 2300,
    },
  },
  melilla: {
    month: 9, day: 17, name: 'Día de Melilla', shortName: 'Día de Melilla', icon: '🏛️', color: '#b27a58',
    description: 'Murallas sobre el mar, arquitectura modernista y luz mediterránea.',
    tradition: 'El 17 de septiembre celebra la historia abierta y plural de Melilla junto a las murallas y el faro de Melilla la Vieja.',
    game: {
      type: 'stacker',
      title: 'El Faro de Melilla la Vieja',
      instruction: 'Apila con precisión los diez cuerpos de piedra del faro hasta encender su linterna sobre el Mediterráneo.',
      style: 'lighthouse',
      crownIcon: '🚨',
      goal: 10,
    },
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

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createHoliday(definition, date, scope, regionLabel) {
  const iso = isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  const id = scope === 'national' || scope === 'popular'
    ? definition.id
    : `${slugify(regionLabel)}-${definition.id ?? slugify(definition.name)}`;
  return {
    ...definition,
    id,
    date: iso,
    scope,
    regionLabel,
    game: { ...definition.game },
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

function resolveDate(year, definition) {
  return definition.easterOffset == null
    ? dateForFixed(year, definition)
    : dateForEaster(year, definition.easterOffset);
}

export function getHolidays(year, region = 'all') {
  const national = NATIONAL_HOLIDAYS.map((holiday) => (
    createHoliday(holiday, resolveDate(year, holiday), 'national', 'Ámbito nacional')
  ));
  const popular = POPULAR_HOLIDAYS.map((holiday) => (
    createHoliday(holiday, resolveDate(year, holiday), 'popular', 'Celebración popular')
  ));
  const common = [...national, ...popular];

  if (region === 'all' || (!REGIONAL_HOLIDAYS[region] && region !== 'pais-vasco')) {
    return common.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  }

  const regionLabel = REGIONS.find((item) => item.id === region)?.label ?? 'Autonómico';
  const regional = [];
  const regionalDefinition = REGIONAL_HOLIDAYS[region];

  if (regionalDefinition) {
    regional.push(createHoliday(regionalDefinition, resolveDate(year, regionalDefinition), 'regional', regionLabel));

    if (region === 'castilla-la-mancha') {
      const corpus = {
        id: 'corpus-christi', name: 'Corpus Christi', shortName: 'Corpus Christi', icon: '🏮', color: '#7a9960',
        description: 'Calles entoldadas, tomillo, flores y faroles históricos.',
        tradition: 'El Corpus Christi se vive con enorme arraigo en Toledo y toda Castilla-La Mancha entre tapices, flores y luminarias.',
        game: {
          type: 'fireworks',
          title: 'Luminarias de Toledo',
          instruction: 'Enciende las luminarias doradas al alcanzar su punto más alto para iluminar los tejados históricos.',
          goal: 13,
        },
      };
      regional.push(createHoliday(corpus, dateForEaster(year, 60), 'regional', regionLabel));
    }

    if (region === 'valencia') {
      const sanJose = {
        id: 'san-jose', name: 'San José · Fallas', shortName: 'San José · Fallas', icon: '🔥', color: '#d8864f',
        description: 'Monumentos falleros, música de banda, pólvora y la Nit del Foc.',
        tradition: 'Marzo enciende Valencia con mascletaes, castillos nocturnos y la Cremà del 19 de marzo que renueva el ciclo festivo.',
        game: {
          type: 'fireworks',
          title: 'La Nit del Foc',
          instruction: 'Dirige el gran castillo fallero: toca las carcasas justo en su aro dorado para encadenar palmeras de fuego.',
          goal: 15,
        },
      };
      regional.push(createHoliday(sanJose, dateForFixed(year, { month: 3, day: 19 }), 'regional', regionLabel));
    }
  }

  if (!EASTER_THURSDAY_EXCEPTIONS.has(region)) {
    const maundyThursday = {
      id: 'jueves-santo', name: 'Jueves Santo', shortName: 'Jueves Santo', icon: '🏮', color: '#8b7798',
      description: 'El pórtico iluminado de los días centrales de la Semana Santa.',
      tradition: 'Al anochecer del Jueves Santo, los faroles y balcones engalanados trazan recorridos de luz por los cascos históricos.',
      game: {
        type: 'lights',
        title: 'Faroles de la Travesía',
        instruction: 'Gira las piezas doradas hasta llevar la luz desde la estrella central a todos los faroles del barrio antiguo.',
        size: 4,
        bulbIcon: '🏮',
      },
    };
    regional.push(createHoliday(maundyThursday, dateForEaster(year, -3), 'regional', regionLabel));
  }

  if (EASTER_MONDAY_REGIONS.has(region)) {
    const easterMonday = {
      id: 'lunes-pascua', name: 'Lunes de Pascua', shortName: 'Lunes de Pascua', icon: '🐣', color: '#779379',
      description: 'Día de campo, cometas al viento y monas de Pascua de chocolate.',
      tradition: 'El Lunes de Pascua reúne a familias y padrinos para compartir la tradicional mona decorada con huevos de chocolate y plumas.',
      game: {
        type: 'match3',
        title: 'Obrador de la Mona de Pascua',
        instruction: 'Combina huevos de chocolate, pollitos y fresas de 3 en 3 y crea dulces especiales para completar el escaparate.',
        boardTheme: 'paschal',
        candies: PASCHAL_CANDIES,
        bombIcon: '🎁',
        size: 7,
        moves: 16,
        target: 1150,
      },
    };
    regional.push(createHoliday(easterMonday, dateForEaster(year, 1), 'regional', regionLabel));
  }

  return [...common, ...regional].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
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
