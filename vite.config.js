import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Assets relativos: el sitio funciona tanto en la raíz como en el subpath
  // de GitHub Pages (/Calendario-Festivo-Espa-a/).
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app'],
    // Las trazas HTML de Playwright no deben recargar las partidas ni otras pruebas.
    watch: { ignored: ['**/.cache/**', '**/playwright-report/**', '**/test-results/**'] },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app'],
  },
});
