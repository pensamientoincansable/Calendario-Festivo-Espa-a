# Festeja · Calendario festivo de España

Una guía interactiva de festivos nacionales y fechas autonómicas de referencia. Explora el calendario por mes, año y territorio; al abrir un día festivo encontrarás una tradición y un minijuego temático (memoria, orden o trivia).

## Desarrollo

```bash
npm install
npm run dev
```

## Comprobaciones

```bash
npm test
npm run build
```

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
