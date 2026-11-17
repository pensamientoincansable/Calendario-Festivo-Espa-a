import { useState } from 'react';
import { Keyboard, Smartphone, Sparkles } from 'lucide-react';
import { GAME_CONTROLS } from './controls.js';

export default function ControlGuide({ type }) {
  const [device, setDevice] = useState(() =>
    window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'pc',
  );
  const controls = GAME_CONTROLS[type] ?? GAME_CONTROLS.match3;
  return (
    <div className="control-guide">
      <div className="control-device-switch" role="group" aria-label="Ver controles para">
        <button type="button" aria-pressed={device === 'pc'} onClick={() => setDevice('pc')}>
          <Keyboard size={16} /> PC
        </button>
        <button type="button" aria-pressed={device === 'touch'} onClick={() => setDevice('touch')}>
          <Smartphone size={16} /> Móvil / Android
        </button>
      </div>
      <dl className="control-guide-list">
        {controls[device].map(([label, text]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <p className="control-guide-tip">
        <Sparkles size={16} />
        {controls.tip}
      </p>
    </div>
  );
}
