# Festeja · Calendario festivo de España

Una guía interactiva de festivos nacionales, grandes celebraciones y fechas autonómicas de España. Explora el calendario por mes, año y territorio; al abrir cada fecha encontrarás su tradición y un minijuego interactivo diseñado a medida (carreras arcade, el trineo de Papá Noel, la cabalgata de los Reyes Magos, cocina de recetas españolas, match-3 de dulces de Halloween, las doce uvas, pirotecnia, castells, luminarias y más).

## Una experiencia para móvil y PC

- **Modo diurno y nocturno:** selector en la cabecera y dentro de cada minijuego. La primera visita respeta el aspecto del sistema; tu elección se guarda en el dispositivo y se sincroniza entre pestañas. También funciona si el navegador bloquea el almacenamiento.
- **Pantalla completa en todos los minijuegos:** botón de ampliar o tecla **F**, sin reiniciar la partida. Se utiliza la API del navegador cuando está permitida y una vista inmersiva alternativa si no lo está. **Esc** sale de la vista ampliada antes de cerrar el juego.
- **Pausa real:** tecla **P** o botón de pausa. Cambiar de pestaña o salir de la ventana pausa automáticamente; al volver, pulsa *Continuar jugando*. Se detienen tanto las físicas y cronómetros como las animaciones encadenadas y los resultados pendientes.
- **Controles adaptados:** flechas/WASD, ratón y teclado en PC; arrastre, botones grandes y controles multitáctiles en Android. Los controles mantenidos capturan el dedo y se liberan al cancelar, pausar o perder el foco. Los puzles admiten flechas, Inicio/Fin y Espacio/Intro; en Candy Match, Mayús + flecha intercambia dos piezas.
- **Ayuda por juego:** el botón **?** muestra los controles de PC y de móvil/Android, además de un consejo. **M** activa o silencia los efectos de sonido.
- **Diseño adaptable:** vertical y horizontal, áreas seguras y altura útil del navegador móvil, sin obligar a girar el dispositivo. Los lienzos ajustan su resolución al tamaño visible, limitan el dibujo a 60 Hz y no animan escenarios sin iniciar ni partidas pausadas.

La vista ampliada alternativa ocupa la página, pero no puede ocultar las barras del navegador si este deniega la pantalla completa. Los récords se guardan localmente cuando el almacenamiento está disponible.

## Desarrollo

Usa Node.js 22.13+ o 24 LTS (también compatible con Node 20.19+).

```bash
npm install
npm run dev
```

## Comprobaciones

```bash
npm run lint
npm test
npm run build
```

Pruebas de navegador con Playwright (PC y emulación Android):

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

Cubren los 13 tipos de minijuego, tema persistente y almacenamiento bloqueado, pantalla completa nativa y alternativa, pausa de cronómetros/cascadas, multitáctil, cancelación de pulsaciones, navegación por teclado, foco del diálogo, reintentos y tamaños desde 320 px. La emulación no sustituye una comprobación en un dispositivo físico. Si ya tienes un Chromium compatible instalado, puedes indicar su ruta con `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Los temporizadores y fotogramas de los juegos usan `src/games/gameClock.js`: cualquier nueva animación o espera debe utilizar el reloj del contexto `useGameClock()` para respetar la pausa. Los controles comunes están en `GameSession.jsx` y su ayuda en `controls.js`.

El workflow `checks.yml` ejecuta lint, pruebas unitarias, compilación y Playwright en cada pull request. En CI, el navegador prueba la compilación de producción. Para comprobar un servidor ya iniciado, usa `E2E_BASE_URL=https://tu-servidor npm run test:e2e`; así Playwright no inicia otro servidor. Los récords se validan al cargarlos para que datos locales dañados no bloqueen la aplicación.

### Aviso de dependencias de desarrollo

A fecha de 17 de noviembre de 2026, `npm audit --omit=dev` no detecta vulnerabilidades de producción. La auditoría completa señala [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) en `picomatch`, una dependencia transitiva de Vite usada al desarrollar/compilar, no incluida en la web estática. El aviso afecta a todas las versiones publicadas hasta `4.0.7` y todavía no tiene una versión corregida publicada; `npm audit fix` no lo resuelve. No se ha ocultado el aviso ni forzado una sustitución insegura: queda pendiente actualizar cuando el proveedor publique la corrección.

## Despliegue en GitHub Pages

La aplicación es un proyecto Vite: hay que **compilarla** antes de publicarla. Si se sirve directamente la rama `main`, el navegador intenta cargar `/src/main.jsx` (un fichero JSX que además no existe en la raíz del dominio) y la página queda en blanco.

El workflow `.github/workflows/deploy-pages.yml` ejecuta `npm ci`, `npm test` y `npm run build`, y publica `dist/` con `actions/deploy-pages`. Para activarlo:

1. En *Settings → Pages*, cambia **Build and deployment → Source** a **GitHub Actions**.
2. Fusiona estos cambios en `main` (o ejecuta el workflow con `workflow_dispatch`).

`vite.config.js` usa `base: './'` para que los assets funcionen tanto en la raíz como bajo `/Calendario-Festivo-Espa-a/`. Para comprobar el resultado en local:

```bash
npm run build
npm run preview
```

El calendario calcula las fechas móviles de Semana Santa y permite navegar entre años. Las fechas autonómicas se muestran como referencia; los festivos trasladados y locales pueden variar según el calendario laboral oficial de cada comunidad y municipio.
