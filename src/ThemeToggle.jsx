import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ theme, onChange }) {
  return (
    <div className="theme-switch" role="group" aria-label="Aspecto de la interfaz">
      <button
        type="button"
        aria-pressed={theme === 'light'}
        onClick={() => onChange('light')}
        title="Modo diurno"
        aria-label="Modo diurno"
      >
        <Sun size={16} />
        <span>Diurno</span>
      </button>
      <button
        type="button"
        aria-pressed={theme === 'dark'}
        onClick={() => onChange('dark')}
        title="Modo nocturno"
        aria-label="Modo nocturno"
      >
        <Moon size={15} />
        <span>Nocturno</span>
      </button>
    </div>
  );
}
