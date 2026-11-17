import { useCallback, useEffect, useRef, useState } from 'react';
import { capturePointer } from './inputUtils.js';
import { useGameClock, HoldButton, ActionButton, useGridNavigation } from './GameSession.jsx';
import {
  ArrowUp,
  Bell,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  clamp,
  isModalChromeTarget,
  roundRect,
  setupHiDPICanvas,
  spawnParticles,
  spawnPopup,
  updateAndDrawParticles,
  updateAndDrawPopups,
} from './canvasUtils.js';
import { computePoweredGrid, createLightsPuzzle, currentCellMask } from './lightsLogic.js';
import { sfx } from '../sound.js';

const W = 500;
const H = 300;
const DEFAULT_GOOD_ICONS = ['🌰', '🍬', '🥨'];

/* =========================================================================
   1. LAS DOCE UVAS · Reloj de la Puerta del Sol (Ritmo y reflejos)
   ========================================================================= */
export function ChimesGame({ game, onProgress, onComplete }) {
  const clock = useGameClock();
  const totalChimes = 12;
  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [grapes, setGrapes] = useState(() => Array(totalChimes).fill('pending')); // pending | perfect | good | miss
  const [statusText, setStatusText] = useState('Pulsa justo cuando la aguja dorada cruce la campana superior.');

  const stateRef = useRef({
    phase: 0.55, // 0..1; la campana suena en 0.5
    dir: 1,
    chimeIndex: 0,
    results: Array(totalChimes).fill('pending'),
    score: 0,
    particles: [],
    popups: [],
    flash: 0,
  });
  const doneRef = useRef(false);
  const lastGrapeRef = useRef(-Infinity);
  const endTimerRef = useRef(0);

  useEffect(() => () => clock.clearTimeout(endTimerRef.current), [clock]);

  const reset = useCallback(() => {
    clock.clearTimeout(endTimerRef.current);
    doneRef.current = false;
    lastGrapeRef.current = -Infinity;
    stateRef.current = {
      phase: 0.12,
      dir: 1,
      chimeIndex: 0,
      results: Array(totalChimes).fill('pending'),
      score: 0,
      particles: [],
      popups: [],
      flash: 0,
    };
    setGrapes(Array(totalChimes).fill('pending'));
    setStatusText('¡Empiezan las campanadas! Come una uva en cada toque de campana.');
    onProgress?.(0);
    setStarted(true);
  }, [clock, onProgress]);

  const eatGrape = useCallback(() => {
    if (!started) {
      reset();
      return;
    }
    if (clock.now() - lastGrapeRef.current < 150) return;
    lastGrapeRef.current = clock.now();
    const s = stateRef.current;
    if (doneRef.current || s.chimeIndex >= totalChimes) return;

    const diff = Math.abs(s.phase - 0.5);
    let outcome = 'miss';
    if (diff <= 0.1) {
      outcome = 'perfect';
      s.score += 120;
      s.flash = 1;
      sfx.chime(true);
      spawnParticles(s.particles, W / 2, 74, ['#ffe066', '#ffd43b', '#ffffff', '#b2f2bb'], 18, 150);
      spawnPopup(s.popups, W / 2, 58, `¡UVA ${s.chimeIndex + 1} PERFECTA!`, '#ffe066');
      setStatusText(`¡Campanada ${s.chimeIndex + 1} clavada al segundo!`);
    } else if (diff <= 0.2) {
      outcome = 'good';
      s.score += 80;
      s.flash = 0.6;
      sfx.chime(false);
      spawnParticles(s.particles, W / 2, 74, ['#d8f5a2', '#ffe066'], 12, 110);
      spawnPopup(s.popups, W / 2, 58, `¡UVA ${s.chimeIndex + 1} A TIEMPO!`, '#d8f5a2');
      setStatusText(`¡Bien! Uva ${s.chimeIndex + 1} dentro, atento al siguiente badajo.`);
    } else {
      sfx.invalid();
      spawnPopup(s.popups, W / 2, 58, '¡TE ADELANTASTE!', '#ffa8a8');
      setStatusText('¡Casi eran los cuartos! Espera a que el péndulo entre en el arco dorado.');
    }

    s.results[s.chimeIndex] = outcome;
    s.chimeIndex += 1;
    // Reposicionar suavemente el péndulo hacia el extremo opuesto para la siguiente campanada
    s.phase = s.dir > 0 ? 0.04 : 0.96;
    s.dir = s.phase < 0.5 ? 1 : -1;

    const eaten = s.results.filter((r) => r === 'perfect' || r === 'good').length;
    setGrapes([...s.results]);
    onProgress?.(eaten);

    if (s.chimeIndex >= totalChimes) {
      doneRef.current = true;
      const perfects = s.results.filter((r) => r === 'perfect').length;
      const won = eaten >= 8;
      const stars = eaten === 12 && perfects >= 7 ? 3 : eaten >= 10 ? 2 : eaten >= 7 ? 1 : 0;
      clock.clearTimeout(endTimerRef.current);
      endTimerRef.current = clock.setTimeout(() => {
        if (won) sfx.win();
        else sfx.end();
        onComplete({
          won,
          score: eaten,
          maxScore: totalChimes,
          stars,
          unit: 'uvas a tiempo',
          summary: eaten === 12
            ? `¡Feliz Año Nuevo! Te has tomado las 12 uvas sin atragantarte (${perfects} perfectas).`
            : `Has tomado ${eaten} de las 12 uvas al son del reloj de la Puerta del Sol.`,
        });
      }, 420);
    }
  }, [clock, onComplete, onProgress, reset, started]);

  useEffect(() => {
    function onKey(e) {
      if (e.repeat || clock.isPaused() || isModalChromeTarget(e)) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        eatGrape();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clock, eatGrape]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let rafId = 0;
    let last = clock.now();

    const loop = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (started && !doneRef.current) {
        const speed = 0.72 + s.chimeIndex * 0.055;
        s.phase += s.dir * speed * dt;
        if (s.phase >= 1) {
          s.phase = 1;
          s.dir = -1;
        } else if (s.phase <= 0) {
          s.phase = 0;
          s.dir = 1;
        }
      }
      if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 2.5);

      const ctx = setupHiDPICanvas(canvas, W, 235);
      if (!ctx) return;
      const sky = ctx.createLinearGradient(0, 0, 0, 235);
      sky.addColorStop(0, '#161b33');
      sky.addColorStop(1, '#2d2642');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, 235);

      // Torreta del reloj de la Puerta del Sol
      ctx.fillStyle = '#3d3145';
      roundRect(ctx, W / 2 - 115, 138, 230, 100, 12);
      ctx.fill();

      // Esfera iluminada del reloj
      ctx.save();
      ctx.translate(W / 2, 152);
      if (s.flash > 0) {
        ctx.fillStyle = `rgba(255, 224, 102, ${s.flash * 0.35})`;
        ctx.beginPath();
        ctx.arc(0, 0, 118, 0, Math.PI * 2);
        ctx.fill();
      }

      // Arco de ritmo semicircular
      const radius = 92;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.arc(0, 0, radius, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();

      // Zona buena
      ctx.strokeStyle = 'rgba(181, 228, 140, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, radius, Math.PI * 1.35, Math.PI * 1.65);
      ctx.stroke();

      // Zona perfecta central (las XII)
      ctx.strokeStyle = '#ffd43b';
      ctx.beginPath();
      ctx.arc(0, 0, radius, Math.PI * 1.43, Math.PI * 1.57);
      ctx.stroke();

      // Esfera marfil interior
      ctx.fillStyle = '#fff9ec';
      ctx.beginPath();
      ctx.arc(0, 8, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d9a648';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.fillStyle = '#292d27';
      ctx.font = '700 13px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.fillText('XII', 0, -30);
      ctx.font = '700 22px "DM Sans", sans-serif';
      ctx.fillStyle = '#c95846';
      ctx.fillText(`${Math.min(12, s.chimeIndex + 1)}/12`, 0, 15);
      ctx.font = '700 8px "DM Sans", sans-serif';
      ctx.fillStyle = '#7c786d';
      ctx.fillText('CAMPANADA', 0, 30);

      // Aguja/badajo en movimiento sobre el arco
      const angle = Math.PI * (1.12 + s.phase * 0.76);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      ctx.strokeStyle = '#f4d35e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.fillStyle = '#fffdf8';
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cf634d';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = '18px sans-serif';
      ctx.fillText('🔔', 0, -110);
      ctx.restore();

      updateAndDrawParticles(ctx, s.particles, dt, 110);
      updateAndDrawPopups(ctx, s.popups, dt);

      if (started) rafId = clock.requestFrame(loop);
    };

    rafId = clock.requestFrame(loop);
    return () => clock.cancelFrame(rafId);
  }, [clock, started]);

  const eatenCount = grapes.filter((g) => g === 'perfect' || g === 'good').length;

  return (
    <div className="arcade-wrap">
      <div className="game-stats-line">
        <span>UVAS A TIEMPO <strong>{eatenCount}/12</strong></span>
        <span>PERFECTAS <strong>{grapes.filter((g) => g === 'perfect').length}</strong></span>
        <button type="button" onClick={reset} aria-label="Reiniciar campanadas"><RotateCcw size={14} /></button>
      </div>

      <div className="canvas-frame canvas-frame-compact">
        <canvas ref={canvasRef} className="game-canvas game-canvas-compact" onPointerDown={eatGrape} aria-label={game.title} />
        {!started && (
          <div className="canvas-overlay">
            <button type="button" className="canvas-start-btn" onClick={reset}>
              <Play size={16} /> Sonar las campanadas
            </button>
            <span>Pulsa Espacio o toca cuando la aguja pase por el oro de las XII</span>
          </div>
        )}
      </div>

      <div className="grapes-tray" aria-label="Cuenco de las doce uvas">
        {grapes.map((state, idx) => (
          <span key={idx} className={`grape-dot grape-${state}`} title={`Uva ${idx + 1}`}>
            {state === 'miss' ? '×' : '🍇'}
          </span>
        ))}
      </div>

      <ActionButton type="button" className="game-primary-button full-action-btn" onAction={eatGrape}>
        <Bell size={16} /> ¡Tomar uva #{Math.min(12, grapes.filter((g) => g !== 'pending').length + 1)}!
      </ActionButton>
      <p className="game-hint"><span className="hint-sparkle">✦</span> {statusText}</p>
    </div>
  );
}

/* =========================================================================
   2. SALTO FESTIVO · Runner lateral con doble salto
   ========================================================================= */
const RUNNER_THEMES = {
  bonfire: {
    skyTop: '#131d3b', skyBottom: '#354973', ground: '#d4b483', groundLine: '#e9c46a',
    hero: '🏃', obstacle: '🔥', obstacleAlt: '🌊', token: '🏮', label: 'hogueras saltadas',
  },
  dragon: {
    skyTop: '#2b1e33', skyBottom: '#6c3b47', ground: '#6d6875', groundLine: '#e5989b',
    hero: '🏇', obstacle: '🔥', obstacleAlt: '🐉', token: '🌹', label: 'llamas esquivadas',
  },
  windmill: {
    skyTop: '#3d5a80', skyBottom: '#e09f3e', ground: '#b08968', groundLine: '#f4d35e',
    hero: '🐎', obstacle: '🪨', obstacleAlt: '🌪️', token: '🌾', label: 'obstáculos superados',
  },
  valley: {
    skyTop: '#264653', skyBottom: '#52796f', ground: '#6b705c', groundLine: '#e63946',
    hero: '🏃', obstacle: '🪵', obstacleAlt: '🪨', token: '🧣', label: 'vallados saltados',
  },
};

export function RunnerGame({ game, onProgress, onComplete }) {
  const clock = useGameClock();
  const theme = RUNNER_THEMES[game.scene ?? 'bonfire'] ?? RUNNER_THEMES.bonfire;
  const goal = game.goal ?? 12;
  const GROUND_Y = 242;

  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({ cleared: 0, tokens: 0, lives: 3, score: 0 });
  const stateRef = useRef(null);
  const doneRef = useRef(false);

  const init = useCallback(() => ({
    y: GROUND_Y,
    vy: 0,
    jumps: 0,
    jumpBuffer: 0,
    cleared: 0,
    tokens: 0,
    score: 0,
    lives: 3,
    invuln: 0,
    time: 0,
    spawnTimer: 0.9,
    obstacles: [],
    pickups: [],
    particles: [],
    popups: [],
  }), [GROUND_Y]);

  useEffect(() => { stateRef.current = init(); }, [clock, init]);

  const jump = useCallback(() => {
    if (!started) {
      setStarted(true);
    }
    const s = stateRef.current;
    if (!s || doneRef.current) return;
    if (s.jumps < 2) {
      s.vy = s.jumps === 0 ? -435 : -375;
      s.jumps += 1;
      s.jumpBuffer = 0;
      sfx.jump();
      spawnParticles(s.particles, 96, s.y, ['#ffe066', '#ffffff'], 8, 90);
    } else {
      s.jumpBuffer = 0.12;
    }
  }, [started]);

  const reset = useCallback(() => {
    doneRef.current = false;
    stateRef.current = init();
    setHud({ cleared: 0, tokens: 0, lives: 3, score: 0 });
    onProgress?.(0);
    setStarted(true);
  }, [init, onProgress]);

  useEffect(() => {
    function onKey(e) {
      if (e.repeat || clock.isPaused() || isModalChromeTarget(e)) return;
      if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) {
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clock, jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let rafId = 0;
    let last = clock.now();

    const tick = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (started && !doneRef.current && s) {
        s.time += dt;
        if (s.invuln > 0) s.invuln = Math.max(0, s.invuln - dt);

        s.jumpBuffer = Math.max(0, s.jumpBuffer - dt);
        // Gravedad y aterrizaje
        s.vy += 1080 * dt;
        s.y += s.vy * dt;
        if (s.y >= GROUND_Y) {
          s.y = GROUND_Y;
          s.vy = 0;
          s.jumps = 0;
          if (s.jumpBuffer > 0) {
            s.vy = -435;
            s.jumps = 1;
            s.jumpBuffer = 0;
            sfx.jump();
          }
        }

        const speed = 225 + s.cleared * 8;
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          s.spawnTimer = 1.15 + Math.random() * 0.55;
          const icon = Math.random() < 0.72 ? theme.obstacle : theme.obstacleAlt;
          s.obstacles.push({ x: W + 26, y: GROUND_Y - 14, icon, passed: false });
          if (Math.random() < 0.75) {
            s.pickups.push({ x: W + 30 + Math.random() * 70, y: GROUND_Y - 76 - Math.random() * 38 });
          }
        }

        for (let i = s.pickups.length - 1; i >= 0; i -= 1) {
          const p = s.pickups[i];
          p.x -= speed * dt;
          if (Math.abs(p.x - 96) < 28 && Math.abs(p.y - (s.y - 20)) < 28) {
            s.tokens += 1;
            s.score += 75;
            sfx.collect(s.tokens);
            spawnParticles(s.particles, p.x, p.y, ['#ffe066', '#ff8fab', '#ffffff'], 12);
            spawnPopup(s.popups, p.x, p.y - 10, `+75 ${theme.token}`, '#ffe066');
            s.pickups.splice(i, 1);
            setHud({ cleared: s.cleared, tokens: s.tokens, lives: s.lives, score: s.score });
            continue;
          }
          if (p.x < -30) s.pickups.splice(i, 1);
        }

        for (let i = s.obstacles.length - 1; i >= 0; i -= 1) {
          const ob = s.obstacles[i];
          ob.x -= speed * dt;
          if (s.invuln <= 0 && Math.abs(ob.x - 96) < 22 && Math.abs(ob.y - (s.y - 16)) < 22) {
            s.lives -= 1;
            s.invuln = 1.25;
            sfx.hit();
            spawnParticles(s.particles, 96, s.y - 16, ['#ff8787', '#ffd43b'], 14);
            spawnPopup(s.popups, 96, s.y - 44, '¡UY!', '#ffa8a8');
            s.obstacles.splice(i, 1);
            setHud({ cleared: s.cleared, tokens: s.tokens, lives: s.lives, score: s.score });
            if (s.lives <= 0) {
              doneRef.current = true;
              sfx.end();
              onComplete({
                won: false,
                score: s.score,
                maxScore: goal * 120,
                stars: s.cleared >= Math.ceil(goal * 0.6) ? 1 : 0,
                unit: 'puntos festivos',
                summary: `Superaste ${s.cleared} de ${goal} ${theme.label}. ¡Recuerda que puedes hacer doble salto en el aire!`,
              });
              return;
            }
            continue;
          }
          if (!ob.passed && ob.x < 68) {
            ob.passed = true;
            s.cleared += 1;
            s.score += 100;
            spawnPopup(s.popups, 96, s.y - 42, `${s.cleared}/${goal}`, '#d8f5a2');
            setHud({ cleared: s.cleared, tokens: s.tokens, lives: s.lives, score: s.score });
            onProgress?.(s.cleared);
            if (s.cleared >= goal) {
              doneRef.current = true;
              const stars = s.lives === 3 ? 3 : s.lives === 2 ? 2 : 1;
              sfx.win();
              onComplete({
                won: true,
                score: s.score + s.lives * 100,
                maxScore: goal * 120,
                stars,
                unit: 'puntos festivos',
                summary: `¡Reto superado! Saltaste los ${goal} obstáculos y reuniste ${s.tokens} ${theme.token} por el camino.`,
              });
              return;
            }
          }
          if (ob.x < -34) s.obstacles.splice(i, 1);
        }
      }

      if (s) {
        const ctx = setupHiDPICanvas(canvas, W, H);
        if (ctx) {
          const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        sky.addColorStop(0, theme.skyTop);
        sky.addColorStop(1, theme.skyBottom);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // Luna / sol y molinos si es Castilla-La Mancha
        ctx.fillStyle = 'rgba(255, 245, 210, 0.85)';
        ctx.beginPath();
        ctx.arc(415, 58, 24, 0, Math.PI * 2);
        ctx.fill();

        if (game.scene === 'windmill') {
          [200, 340].forEach((mx, idx) => {
            ctx.fillStyle = '#f8f5ee';
            ctx.beginPath();
            ctx.moveTo(mx - 14, GROUND_Y);
            ctx.lineTo(mx - 9, GROUND_Y - 58);
            ctx.lineTo(mx + 9, GROUND_Y - 58);
            ctx.lineTo(mx + 14, GROUND_Y);
            ctx.closePath();
            ctx.fill();
            ctx.save();
            ctx.translate(mx, GROUND_Y - 54);
            ctx.rotate(s.time * 1.1 + idx);
            ctx.strokeStyle = '#fffdf8';
            ctx.lineWidth = 3;
            for (let a = 0; a < 4; a += 1) {
              ctx.rotate(Math.PI / 2);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(0, -26);
              ctx.stroke();
            }
            ctx.restore();
          });
        }

        // Suelo
        ctx.fillStyle = theme.ground;
        ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
        ctx.fillStyle = theme.groundLine;
        ctx.fillRect(0, GROUND_Y, W, 4);

        // Coleccionables
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const p of s.pickups) {
          ctx.fillText(theme.token, p.x, p.y + Math.sin(s.time * 6 + p.x) * 4);
        }

        // Obstáculos con resplandor
        for (const ob of s.obstacles) {
          ctx.fillStyle = 'rgba(255, 169, 77, 0.25)';
          ctx.beginPath();
          ctx.arc(ob.x, ob.y, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '28px sans-serif';
          ctx.fillText(ob.icon, ob.x, ob.y);
        }

        // Protagonista (mirando hacia la derecha)
        const blink = s.invuln > 0 && Math.floor(s.invuln * 14) % 2 === 0;
        if (!blink) {
          ctx.save();
          ctx.translate(96, s.y - 18);
          ctx.scale(-1, 1);
          ctx.font = '32px sans-serif';
          ctx.fillText(theme.hero, 0, 0);
          ctx.restore();
        }

          const fxDt = started && !doneRef.current ? dt : 0;
          updateAndDrawParticles(ctx, s.particles, fxDt, 220);
          updateAndDrawPopups(ctx, s.popups, fxDt);
        }
      }

      if (started) rafId = clock.requestFrame(tick);
    };

    rafId = clock.requestFrame(tick);
    return () => clock.cancelFrame(rafId);
  }, [clock, GROUND_Y, game.scene, goal, onComplete, onProgress, started, theme]);

  return (
    <div className="arcade-wrap">
      <div className="game-stats-line">
        <span>SALTOS <strong>{hud.cleared}/{goal}</strong></span>
        <span>TESOROS <strong>{hud.tokens} {theme.token}</strong></span>
        <span>VIDAS <strong>{'❤️'.repeat(hud.lives)}</strong></span>
        <button type="button" onClick={reset} aria-label="Reiniciar carrera de saltos"><RotateCcw size={14} /></button>
      </div>

      <div className="canvas-frame">
        <canvas ref={canvasRef} className="game-canvas" onPointerDown={jump} aria-label={game.title} />
        {!started && (
          <div className="canvas-overlay">
            <button type="button" className="canvas-start-btn" onClick={jump}>
              <Play size={16} /> Empezar a saltar
            </button>
            <span>Toca o pulsa Espacio para saltar · Pulsa dos veces para doble salto</span>
          </div>
        )}
      </div>

      <ActionButton type="button" className="game-primary-button full-action-btn" onAction={jump}>
        <ArrowUp size={16} /> Saltar (doble salto activo)
      </ActionButton>
    </div>
  );
}

/* =========================================================================
   3. TORRE FESTIVA · Apilador de precisión (Oficios, Castell, Castillo, Faro)
   ========================================================================= */
const STACK_PALETTES = {
  guild: ['#cf634d', '#d98a55', '#e2b16c', '#6e9a7b', '#588a73', '#5c7794'],
  castell: ['#c93b3b', '#d94f4f', '#b83232', '#e05a47', '#c43e3e'],
  castle: ['#b08968', '#c49a6c', '#a47855', '#d4a373', '#9c6644'],
  lighthouse: ['#e9eef2', '#457b9d', '#f8f9fa', '#d97b54', '#e9c46a'],
};

export function StackerGame({ game, onProgress, onComplete }) {
  const clock = useGameClock();
  const goalFloors = game.goal ?? 10;
  const colors = STACK_PALETTES[game.style ?? 'guild'] ?? STACK_PALETTES.guild;
  const crownIcon = game.crownIcon ?? '🏁';
  const BLOCK_H = 22;

  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const lastDropRef = useRef(-Infinity);
  const [hud, setHud] = useState({ floors: 0, perfects: 0, score: 0 });
  const doneRef = useRef(false);
  const endTimerRef = useRef(0);

  useEffect(() => () => clock.clearTimeout(endTimerRef.current), [clock]);

  const makeInitial = useCallback(() => ({
    stack: [{ x: W / 2 - 90, w: 180, color: '#344e41' }],
    active: { x: 60, w: 180, dir: 1, speed: 175, color: colors[0] },
    debris: [],
    particles: [],
    popups: [],
    perfects: 0,
    score: 0,
  }), [colors]);

  const stateRef = useRef(null);
  useEffect(() => { stateRef.current = makeInitial(); }, [clock, makeInitial]);

  const reset = useCallback(() => {
    clock.clearTimeout(endTimerRef.current);
    doneRef.current = false;
    lastDropRef.current = -Infinity;
    setStarted(true);
    stateRef.current = makeInitial();
    setHud({ floors: 0, perfects: 0, score: 0 });
    onProgress?.(0);
  }, [clock, makeInitial, onProgress]);

  const dropBlock = useCallback(() => {
    if (!started) { setStarted(true); return; }
    if (clock.now() - lastDropRef.current < 150) return;
    lastDropRef.current = clock.now();
    const s = stateRef.current;
    if (!s || doneRef.current || !s.active) return;

    const prev = s.stack[s.stack.length - 1];
    const cur = s.active;
    const left = Math.max(prev.x, cur.x);
    const right = Math.min(prev.x + prev.w, cur.x + cur.w);
    const overlap = right - left;
    const cameraShift = Math.max(0, (s.stack.length - 6) * BLOCK_H);
    const blockTopY = (H - 28 + cameraShift) - (s.stack.length + 1) * BLOCK_H;

    if (overlap <= 8) {
      // Falló la base
      s.debris.push({ x: cur.x, y: blockTopY, w: cur.w, vy: 40, color: cur.color });
      s.active = null;
      doneRef.current = true;
      const built = s.stack.length - 1;
      sfx.end();
      clock.clearTimeout(endTimerRef.current);
      endTimerRef.current = clock.setTimeout(() => {
        onComplete({
          won: false,
          score: s.score,
          maxScore: goalFloors * 140,
          stars: built >= Math.ceil(goalFloors * 0.65) ? 1 : 0,
          unit: 'puntos de equilibrio',
          summary: `Levantaste ${built} de ${goalFloors} niveles antes de perder el equilibrio. ¡Prueba tu pulso otra vez!`,
        });
      }, 320);
      return;
    }

    const isPerfect = Math.abs(cur.x - prev.x) <= 7;
    let placedX = left;
    let placedW = overlap;

    if (isPerfect) {
      placedX = prev.x;
      placedW = Math.min(185, prev.w + 4);
      s.perfects += 1;
      s.score += 150;
      sfx.stack(true);
      spawnParticles(s.particles, placedX + placedW / 2, blockTopY, ['#ffe066', '#fff9db', '#63e6be'], 16, 140);
      spawnPopup(s.popups, placedX + placedW / 2, Math.max(24, blockTopY - 12), '¡PERFECTO! +150', '#ffe066');
    } else {
      s.score += 90;
      sfx.stack(false);
      // Pieza sobrante cae con gravedad desde su posición real
      const cutX = cur.x < prev.x ? cur.x : right;
      const cutW = cur.w - overlap;
      s.debris.push({ x: cutX, y: blockTopY, w: cutW, vy: 20, color: cur.color });
    }

    s.stack.push({ x: placedX, w: placedW, color: cur.color });
    const floors = s.stack.length - 1;
    setHud({ floors, perfects: s.perfects, score: s.score });
    onProgress?.(floors);

    if (floors >= goalFloors) {
      s.active = null;
      doneRef.current = true;
      const stars = s.perfects >= 4 ? 3 : s.perfects >= 1 || placedW >= 80 ? 2 : 1;
      sfx.win();
      clock.clearTimeout(endTimerRef.current);
      endTimerRef.current = clock.setTimeout(() => {
        onComplete({
          won: true,
          score: s.score + Math.round(placedW * 2),
          maxScore: goalFloors * 140,
          stars,
          unit: 'puntos de equilibrio',
          summary: `¡Coronaste los ${goalFloors} pisos con ${s.perfects} encajes perfectos!`,
        });
      }, 420);
      return;
    }

    const nextColor = colors[floors % colors.length];
    s.active = {
      x: floors % 2 === 0 ? 30 : W - 30 - placedW,
      w: placedW,
      dir: floors % 2 === 0 ? 1 : -1,
      speed: 175 + floors * 18,
      color: nextColor,
    };
  }, [clock, BLOCK_H, colors, goalFloors, onComplete, onProgress, started]);

  useEffect(() => {
    function onKey(e) {
      if (e.repeat || clock.isPaused() || isModalChromeTarget(e)) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
        e.preventDefault();
        dropBlock();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clock, dropBlock]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let rafId = 0;
    let last = clock.now();

    const tick = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (s) {
        if (started && s.active && !doneRef.current) {
          s.active.x += s.active.dir * s.active.speed * dt;
          if (s.active.x + s.active.w >= W - 24) {
            s.active.x = W - 24 - s.active.w;
            s.active.dir = -1;
          } else if (s.active.x <= 24) {
            s.active.x = 24;
            s.active.dir = 1;
          }
        }

        const ctx = setupHiDPICanvas(canvas, W, H);
        if (!ctx) return;
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1f332b');
        bg.addColorStop(1, '#364f42');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Línea de meta
        const cameraShift = Math.max(0, (s.stack.length - 6) * BLOCK_H);
        const baseY = H - 28 + cameraShift;

        s.stack.forEach((block, idx) => {
          const by = baseY - idx * BLOCK_H;
          if (by > H + 20) return;
          ctx.fillStyle = block.color;
          roundRect(ctx, block.x, by - BLOCK_H, block.w, BLOCK_H - 2, 4);
          ctx.fill();
          // Ventanitas o fajines decorativos
          ctx.fillStyle = 'rgba(255, 250, 235, 0.35)';
          for (let wx = block.x + 12; wx < block.x + block.w - 14; wx += 22) {
            ctx.fillRect(wx, by - BLOCK_H + 6, 8, 9);
          }
        });

        if (doneRef.current && s.stack.length - 1 >= goalFloors) {
          const top = s.stack[s.stack.length - 1];
          const topY = baseY - (s.stack.length - 1) * BLOCK_H;
          ctx.font = '26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(crownIcon, top.x + top.w / 2, topY - 28);
        }

        if (s.active) {
          const ay = baseY - s.stack.length * BLOCK_H;
          ctx.fillStyle = s.active.color;
          roundRect(ctx, s.active.x, ay - BLOCK_H, s.active.w, BLOCK_H - 2, 4);
          ctx.fill();
          ctx.strokeStyle = '#fff5d6';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        for (let i = s.debris.length - 1; i >= 0; i -= 1) {
          const d = s.debris[i];
          d.vy += 520 * dt;
          d.y += d.vy * dt;
          ctx.fillStyle = d.color;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(d.x, d.y, d.w, BLOCK_H - 2);
          ctx.globalAlpha = 1;
          if (d.y > H + 30) s.debris.splice(i, 1);
        }

        updateAndDrawParticles(ctx, s.particles, dt, 140);
        updateAndDrawPopups(ctx, s.popups, dt);
      }

      if (started) rafId = clock.requestFrame(tick);
    };

    rafId = clock.requestFrame(tick);
    return () => clock.cancelFrame(rafId);
  }, [clock, BLOCK_H, crownIcon, goalFloors, started]);

  return (
    <div className="arcade-wrap">
      <div className="game-stats-line">
        <span>NIVEL <strong>{hud.floors}/{goalFloors}</strong></span>
        <span>PERFECTOS <strong>{hud.perfects}</strong></span>
        <span>PUNTOS <strong>{hud.score}</strong></span>
        <button type="button" onClick={reset} aria-label="Reiniciar torre"><RotateCcw size={14} /></button>
      </div>
      <div className="canvas-frame">
        <canvas ref={canvasRef} className="game-canvas" onPointerDown={dropBlock} aria-label={game.title} />
        {!started && (
          <div className="canvas-overlay">
            <button type="button" className="canvas-start-btn" onClick={() => setStarted(true)}><Play size={16} /> Empezar a construir</button>
            <span>Alinea la pieza con la base y pulsa Espacio o toca para colocarla</span>
          </div>
        )}
      </div>
      <ActionButton type="button" className="game-primary-button full-action-btn" onAction={dropBlock}>
        <Layers size={16} /> Colocar pieza (Espacio o clic)
      </ActionButton>
    </div>
  );
}

/* =========================================================================
   4. CIELO DE PÓLVORA · Pirotecnia interactiva (Verbena, Fallas, Corpus)
   ========================================================================= */
const FIREWORK_PALETTES = [
  ['#ffd43b', '#ffa94d', '#fff9db'],
  ['#ff6b6b', '#ff8fab', '#ffe066'],
  ['#63e6be', '#74c0fc', '#ffffff'],
  ['#da77f2', '#ffd43b', '#ff8787'],
];

export function FireworksGame({ game, onProgress, onComplete }) {
  const clock = useGameClock();
  const goalBursts = game.goal ?? 14;
  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({ bursts: 0, combo: 0, score: 0, timeLeft: 36 });
  const stateRef = useRef(null);
  const doneRef = useRef(false);
  const endTimerRef = useRef(0);

  useEffect(() => () => clock.clearTimeout(endTimerRef.current), [clock]);

  const init = useCallback(() => ({
    rockets: [],
    particles: [],
    popups: [],
    bursts: 0,
    combo: 0,
    score: 0,
    timeLeft: 36,
    spawnTimer: 0.3,
    skyGlow: 0,
  }), []);

  useEffect(() => { stateRef.current = init(); }, [clock, init]);

  const reset = useCallback(() => {
    clock.clearTimeout(endTimerRef.current);
    doneRef.current = false;
    stateRef.current = init();
    setHud({ bursts: 0, combo: 0, score: 0, timeLeft: 36 });
    onProgress?.(0);
    setStarted(true);
  }, [clock, init, onProgress]);

  const triggerBurst = useCallback((rocket) => {
    const s = stateRef.current;
    if (!s) return;
    const distToApex = Math.abs(rocket.y - rocket.targetY);
    const perfect = distToApex < 28;
    s.bursts += 1;
    s.combo += 1;
    const pts = (perfect ? 130 : 85) + Math.min(s.combo, 6) * 15;
    s.score += pts;
    s.skyGlow = 0.45;
    sfx.firework();
    spawnParticles(s.particles, rocket.x, rocket.y, rocket.palette, perfect ? 34 : 22, perfect ? 185 : 140);
    spawnPopup(
      s.popups,
      rocket.x,
      rocket.y - 12,
      perfect ? `¡PALMERA DE ORO! +${pts}` : `+${pts}`,
      rocket.palette[0],
    );
    onProgress?.(s.bursts);

    if (s.bursts >= goalBursts && !doneRef.current) {
      doneRef.current = true;
      setHud({ bursts: s.bursts, combo: s.combo, score: s.score, timeLeft: Math.ceil(s.timeLeft) });
      const stars = s.timeLeft >= 11 ? 3 : s.timeLeft >= 4 ? 2 : 1;
      clock.clearTimeout(endTimerRef.current);
      endTimerRef.current = clock.setTimeout(() => {
        sfx.win();
        onComplete({
          won: true,
          score: s.score + Math.round(s.timeLeft * 15),
          maxScore: goalBursts * 120,
          stars,
          unit: 'puntos de pólvora',
          summary: `¡Apoteosis final! Encendiste el cielo con ${s.bursts} carcasas luminosas.`,
        });
      }, 450);
    }
  }, [clock, goalBursts, onComplete, onProgress]);

  const handleCanvasDown = useCallback((e) => {
    if (!started) {
      setStarted(true);
      return;
    }
    const s = stateRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!s || !rect || rect.width <= 0 || rect.height <= 0 || doneRef.current) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;

    let bestIdx = -1;
    let bestDist = 56;
    s.rockets.forEach((rk, idx) => {
      const d = Math.hypot(rk.x - x, rk.y - y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    if (bestIdx >= 0) {
      const [rk] = s.rockets.splice(bestIdx, 1);
      triggerBurst(rk);
    }
  }, [started, triggerBurst]);

  const detonateBest = useCallback(() => {
    if (!started) {
      setStarted(true);
      return;
    }
    const s = stateRef.current;
    if (!s || doneRef.current || s.rockets.length === 0) return;
    let bestIdx = 0;
    let bestGap = Infinity;
    s.rockets.forEach((rk, idx) => {
      const gap = Math.abs(rk.y - rk.targetY);
      if (gap < bestGap) {
        bestGap = gap;
        bestIdx = idx;
      }
    });
    const [rk] = s.rockets.splice(bestIdx, 1);
    triggerBurst(rk);
  }, [started, triggerBurst]);

  useEffect(() => {
    function onKey(e) {
      if (e.repeat || clock.isPaused() || isModalChromeTarget(e)) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        detonateBest();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clock, detonateBest]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let rafId = 0;
    let last = clock.now();
    let hudAcc = 0;

    const tick = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (started && !doneRef.current && s) {
        s.timeLeft = Math.max(0, s.timeLeft - dt);
        if (s.skyGlow > 0) s.skyGlow = Math.max(0, s.skyGlow - dt * 1.4);

        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0 && s.rockets.length < 4) {
          s.spawnTimer = 0.68 + Math.random() * 0.35;
          const x = 64 + Math.random() * (W - 128);
          s.rockets.push({
            x,
            y: H - 26,
            targetY: 58 + Math.random() * 82,
            vy: 145 + Math.random() * 55,
            palette: FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)],
          });
        }

        for (let i = s.rockets.length - 1; i >= 0; i -= 1) {
          const rk = s.rockets[i];
          rk.y -= rk.vy * dt;
          if (Math.random() < 1 - Math.exp(-55 * dt)) {
            s.particles.push({
              x: rk.x + (Math.random() - 0.5) * 3,
              y: rk.y + 8,
              vx: (Math.random() - 0.5) * 14,
              vy: 28,
              size: 1.8,
              color: '#ffd43b',
              life: 0.22,
              maxLife: 0.22,
            });
          }
          if (rk.y < rk.targetY - 42) {
            s.combo = 0;
            s.rockets.splice(i, 1);
          }
        }

        if (s.timeLeft <= 0) {
          doneRef.current = true;
          sfx.end();
          onComplete({
            won: s.bursts >= goalBursts,
            score: s.score,
            maxScore: goalBursts * 120,
            stars: s.bursts >= Math.ceil(goalBursts * 0.65) ? 1 : 0,
            unit: 'puntos de pólvora',
            summary: `Prendiste ${s.bursts} de ${goalBursts} cohetes sobre la plaza del pueblo.`,
          });
          return;
        }

        hudAcc += dt;
        if (hudAcc >= 0.1) {
          hudAcc = 0;
          setHud({ bursts: s.bursts, combo: s.combo, score: s.score, timeLeft: Math.ceil(s.timeLeft) });
        }
      }

      if (s) {
        const ctx = setupHiDPICanvas(canvas, W, H);
        if (!ctx) return;
        ctx.fillStyle = '#111428';
        ctx.fillRect(0, 0, W, H);
        if (s.skyGlow > 0) {
          ctx.fillStyle = `rgba(255, 192, 105, ${s.skyGlow * 0.25})`;
          ctx.fillRect(0, 0, W, H);
        }

        // Anillos de diana y cohetes subiendo
        for (const rk of s.rockets) {
          const near = Math.abs(rk.y - rk.targetY) < 28;
          ctx.strokeStyle = near ? '#ffe066' : 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = near ? 2.4 : 1.3;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(rk.x, rk.targetY, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = rk.palette[0];
          ctx.beginPath();
          ctx.arc(rk.x, rk.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(rk.x, rk.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        const fxDt = started ? dt : 0;
        updateAndDrawParticles(ctx, s.particles, fxDt, 72);
        updateAndDrawPopups(ctx, s.popups, fxDt);

        // Silueta de tejados y campanario
        ctx.fillStyle = '#1b1a2e';
        ctx.fillRect(0, H - 28, W, 28);
        ctx.fillRect(222, H - 64, 34, 38);
        ctx.beginPath();
        ctx.moveTo(218, H - 64);
        ctx.lineTo(239, H - 84);
        ctx.lineTo(260, H - 64);
        ctx.closePath();
        ctx.fill();
      }

      if (started) rafId = clock.requestFrame(tick);
    };

    rafId = clock.requestFrame(tick);
    return () => clock.cancelFrame(rafId);
  }, [clock, goalBursts, onComplete, started]);

  return (
    <div className="arcade-wrap">
      <div className="game-stats-line">
        <span>CARCASAS <strong>{hud.bursts}/{goalBursts}</strong></span>
        <span>RACHA <strong>×{Math.max(1, hud.combo)}</strong></span>
        <span>PUNTOS <strong>{hud.score}</strong></span>
        <span>TIEMPO <strong>{hud.timeLeft}s</strong></span>
        <button type="button" onClick={reset} aria-label="Reiniciar castillo de fuegos"><RotateCcw size={14} /></button>
      </div>
      <div className="canvas-frame">
        <canvas ref={canvasRef} className="game-canvas" onPointerDown={handleCanvasDown} aria-label={game.title} />
        {!started && (
          <div className="canvas-overlay">
            <button type="button" className="canvas-start-btn" onClick={() => { sfx.firework(); setStarted(true); }}>
              <Play size={16} /> Prender la mecha
            </button>
            <span>Toca los cohetes al llegar a su aro dorado (o pulsa Espacio)</span>
          </div>
        )}
      </div>
      <ActionButton type="button" className="game-primary-button full-action-btn" onAction={detonateBest}>
        <Sparkles size={16} /> ¡Estallar cohete en el cielo!
      </ActionButton>
    </div>
  );
}

/* =========================================================================
   5. CESTA FESTIVA · Atrapa-tesoros arcade (Castañera, Sidra, Dehesa)
   ========================================================================= */
export function CatcherGame({ game, onProgress, onComplete }) {
  const clock = useGameClock();
  const goalCount = game.goal ?? 15;
  const goodIcons = game.goodIcons ?? DEFAULT_GOOD_ICONS;
  const goldIcon = game.goldIcon ?? '🌟';
  const badIcon = game.badIcon ?? '🌵';
  const vesselLabel = game.vesselLabel ?? 'CESTA';
  const bgTop = game.bgTop ?? '#3c2a21';
  const bgBottom = game.bgBottom ?? '#6c4a36';

  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({ caught: 0, score: 0, lives: 3 });
  const keysRef = useRef({ left: false, right: false });
  const targetXRef = useRef(null);
  const stateRef = useRef(null);
  const doneRef = useRef(false);

  const init = useCallback(() => ({
    x: W / 2,
    caught: 0,
    streak: 0,
    score: 0,
    lives: 3,
    invuln: 0,
    bounce: 0,
    spawnTimer: 0.4,
    items: [],
    particles: [],
    popups: [],
  }), []);

  useEffect(() => { stateRef.current = init(); }, [clock, init]);

  const reset = useCallback(() => {
    doneRef.current = false;
    keysRef.current = { left: false, right: false };
    stateRef.current = init();
    targetXRef.current = null;
    setHud({ caught: 0, score: 0, lives: 3 });
    onProgress?.(0);
    setStarted(true);
  }, [init, onProgress]);

  useEffect(() => {
    function onDown(e) {
      if (clock.isPaused() || isModalChromeTarget(e)) return;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); keysRef.current.left = true; targetXRef.current = null; setStarted(true); }
      if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); keysRef.current.right = true; targetXRef.current = null; setStarted(true); }
      if ((e.code === 'Space' || e.code === 'Enter') && !started && !e.repeat) { e.preventDefault(); setStarted(true); }
    }
    function onUp(e) {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
    }
    function clearHeld() {
      keysRef.current = { left: false, right: false };
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clearHeld);
    window.addEventListener('festeja:release-input', clearHeld);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clearHeld);
      window.removeEventListener('festeja:release-input', clearHeld);
    };
  }, [clock, started]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let rafId = 0;
    let last = clock.now();

    const tick = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (started && !doneRef.current && s) {
        s.invuln = Math.max(0, s.invuln - dt);
        if (s.bounce > 0) s.bounce = Math.max(0, s.bounce - dt * 5);
        let dir = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
        if (dir !== 0) {
          s.x = clamp(s.x + dir * 310 * dt, 46, W - 46);
        } else if (targetXRef.current != null) {
          s.x = clamp(s.x + clamp((targetXRef.current - s.x) * 11, -350, 350) * dt, 46, W - 46);
        }

        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          s.spawnTimer = 0.52 + Math.random() * 0.28;
          const r = Math.random();
          const kind = r < 0.24 ? 'bad' : r < 0.38 ? 'gold' : 'good';
          const icon = kind === 'bad'
            ? badIcon
            : kind === 'gold'
              ? goldIcon
              : goodIcons[Math.floor(Math.random() * goodIcons.length)];
          s.items.push({
            x: 38 + Math.random() * (W - 76),
            y: -18,
            vy: 145 + Math.random() * 68 + s.caught * 3,
            kind,
            icon,
          });
        }

        for (let i = s.items.length - 1; i >= 0; i -= 1) {
          const it = s.items[i];
          it.y += it.vy * dt;
          if (Math.abs(it.x - s.x) < 42 && Math.abs(it.y - (H - 38)) < 24) {
            if (it.kind === 'bad') {
              if (s.invuln > 0) continue;
              s.lives -= 1;
              s.invuln = 0.9;
              s.streak = 0;
              sfx.hit();
              spawnParticles(s.particles, it.x, it.y, ['#ff8787', '#ffa94d'], 12);
              spawnPopup(s.popups, it.x, it.y - 12, '¡AY!', '#ffa8a8');
              s.items.splice(i, 1);
              setHud({ caught: s.caught, score: s.score, lives: s.lives });
              if (s.lives <= 0) {
                doneRef.current = true;
                sfx.end();
                onComplete({
                  won: false,
                  score: s.score,
                  maxScore: goalCount * 95,
                  stars: s.caught >= Math.ceil(goalCount * 0.6) ? 1 : 0,
                  unit: 'puntos de cosecha',
                  summary: `Reuniste ${s.caught} de ${goalCount}. ¡Esquiva los ${badIcon} y llena el cesto!`,
                });
                return;
              }
              continue;
            }
            const addCount = it.kind === 'gold' ? 2 : 1;
            s.caught = Math.min(goalCount, s.caught + addCount);
            s.streak += 1;
            s.bounce = 1;
            const pts = (it.kind === 'gold' ? 150 : 75) + Math.min(s.streak, 6) * 10;
            s.score += pts;
            sfx.collect(s.streak);
            spawnParticles(s.particles, it.x, it.y, ['#ffe066', '#f4a261', '#fff9db'], 14);
            spawnPopup(s.popups, it.x, it.y - 12, it.kind === 'gold' ? `¡DOBLE! +${pts}` : `+${pts}`, '#ffe066');
            s.items.splice(i, 1);
            setHud({ caught: s.caught, score: s.score, lives: s.lives });
            onProgress?.(s.caught);

            if (s.caught >= goalCount) {
              doneRef.current = true;
              const stars = s.lives === 3 ? 3 : s.lives === 2 ? 2 : 1;
              sfx.win();
              onComplete({
                won: true,
                score: s.score + s.lives * 100,
                maxScore: goalCount * 95,
                stars,
                unit: 'puntos de cosecha',
                summary: `¡Cesto rebosante! Recogiste las ${goalCount} delicias de temporada con gran reflejo.`,
              });
              return;
            }
            continue;
          }
          if (it.y > H + 24) s.items.splice(i, 1);
        }
      }

      if (s) {
        const ctx = setupHiDPICanvas(canvas, W, H);
        if (!ctx) return;
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, bgTop);
        bg.addColorStop(1, bgBottom);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        ctx.font = '25px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const it of s.items) {
          if (it.kind === 'gold') {
            ctx.fillStyle = 'rgba(255, 224, 102, 0.28)';
            ctx.beginPath();
            ctx.arc(it.x, it.y, 18, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillText(it.icon, it.x, it.y);
        }

        ctx.globalAlpha = s.invuln > 0 && Math.floor(s.invuln * 12) % 2 === 0 ? 0.45 : 1;
        // Cesta de mimbre o vaso de sidra
        const basketY = H - 36 + s.bounce * 5;
        ctx.fillStyle = game.vessel === 'glass' ? 'rgba(225, 248, 235, 0.82)' : '#d4a373';
        roundRect(ctx, s.x - 38, basketY - 12, 76, 26, 8);
        ctx.fill();
        ctx.strokeStyle = game.vessel === 'glass' ? '#b2f2bb' : '#8d5b34';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.globalAlpha = 1;
        const fxDt = started && !doneRef.current ? dt : 0;
        updateAndDrawParticles(ctx, s.particles, fxDt, 120);
        updateAndDrawPopups(ctx, s.popups, fxDt);
      }

      if (started) rafId = clock.requestFrame(tick);
    };

    rafId = clock.requestFrame(tick);
    return () => clock.cancelFrame(rafId);
  }, [clock, badIcon, bgBottom, bgTop, game.vessel, goalCount, goldIcon, goodIcons, onComplete, onProgress, started]);

  function movePointer(e) {
    if (e.type === 'pointerdown') {
      if (e.button !== 0) return;
      capturePointer(e);
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    targetXRef.current = clamp(((e.clientX - rect.left) / rect.width) * W, 46, W - 46);
    if (!started && e.type === 'pointerdown') setStarted(true);
  }

  return (
    <div className="arcade-wrap">
      <div className="game-stats-line">
        <span>{vesselLabel} <strong>{hud.caught}/{goalCount}</strong></span>
        <span>PUNTOS <strong>{hud.score}</strong></span>
        <span>VIDAS <strong>{'❤️'.repeat(hud.lives)}</strong></span>
        <button type="button" onClick={reset} aria-label="Reiniciar juego"><RotateCcw size={14} /></button>
      </div>
      <div className="canvas-frame">
        <canvas ref={canvasRef} className="game-canvas" onPointerMove={movePointer} onPointerDown={movePointer} aria-label={game.title} />
        {!started && (
          <div className="canvas-overlay">
            <button type="button" className="canvas-start-btn" onClick={() => { sfx.collect(1); setStarted(true); }}>
              <Play size={16} /> Empezar a recoger
            </button>
            <span>Desliza o usa ← → · Atrapa {goodIcons[0]} y esquiva {badIcon}</span>
          </div>
        )}
      </div>
      <div className="touch-controls">
        <HoldButton type="button" className="touch-btn" onPress={() => { setStarted(true); targetXRef.current = null; keysRef.current.left = true; }} onRelease={() => { keysRef.current.left = false; }}>
          <ChevronLeft size={18} /> Izquierda
        </HoldButton>
        <HoldButton type="button" className="touch-btn" onPress={() => { setStarted(true); targetXRef.current = null; keysRef.current.right = true; }} onRelease={() => { keysRef.current.right = false; }}>
          Derecha <ChevronRight size={18} />
        </HoldButton>
      </div>
    </div>
  );
}

/* =========================================================================
   6. BÓVEDA DE CRISTAL · Arkanoid de vidriera histórica (Constitución)
   ========================================================================= */
export function BreakoutGame({ game, onProgress, onComplete }) {
  const clock = useGameClock();
  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({ cleared: 0, total: 24, lives: 3, score: 0 });
  const keysRef = useRef({ left: false, right: false });
  const targetXRef = useRef(null);
  const stateRef = useRef(null);
  const doneRef = useRef(false);

  const init = useCallback(() => {
    const colors = ['#d9534f', '#e9c46a', '#52b788', '#4ea8de'];
    const bricks = [];
    const cols = 6;
    const rows = 4;
    const bw = 66;
    const bh = 18;
    const startX = (W - (cols * bw + (cols - 1) * 6)) / 2;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        bricks.push({
          x: startX + c * (bw + 6),
          y: 34 + r * (bh + 6),
          w: bw,
          h: bh,
          color: colors[r % colors.length],
          alive: true,
        });
      }
    }
    return {
      paddleX: W / 2,
      paddleW: 96,
      serveDelay: 0.7,
      ball: { x: W / 2, y: H - 52, vx: 165, vy: -225, r: 7 },
      bricks,
      total: bricks.length,
      cleared: 0,
      lives: 3,
      score: 0,
      powerups: [],
      particles: [],
    };
  }, []);

  useEffect(() => { stateRef.current = init(); }, [clock, init]);

  const reset = useCallback(() => {
    doneRef.current = false;
    keysRef.current = { left: false, right: false };
    targetXRef.current = null;
    stateRef.current = init();
    setHud({ cleared: 0, total: 24, lives: 3, score: 0 });
    onProgress?.(0);
    setStarted(true);
  }, [init, onProgress]);

  useEffect(() => {
    function onDown(e) {
      if (clock.isPaused() || isModalChromeTarget(e)) return;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); keysRef.current.left = true; targetXRef.current = null; setStarted(true); }
      if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); keysRef.current.right = true; targetXRef.current = null; setStarted(true); }
      if ((e.code === 'Space' || e.code === 'Enter') && !started && !e.repeat) { e.preventDefault(); setStarted(true); }
    }
    function onUp(e) {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
    }
    function clearHeld() {
      keysRef.current = { left: false, right: false };
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clearHeld);
    window.addEventListener('festeja:release-input', clearHeld);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clearHeld);
      window.removeEventListener('festeja:release-input', clearHeld);
    };
  }, [clock, started]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let rafId = 0;
    let last = clock.now();

    const tick = (now) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (started && !doneRef.current && s) {
        const dir = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
        if (dir !== 0) {
          s.paddleX = clamp(s.paddleX + dir * 340 * dt, s.paddleW / 2 + 8, W - s.paddleW / 2 - 8);
        } else if (targetXRef.current != null) {
          s.paddleX = clamp(targetXRef.current, s.paddleW / 2 + 8, W - s.paddleW / 2 - 8);
        }

        const b = s.ball;
        if (s.serveDelay > 0) {
          s.serveDelay = Math.max(0, s.serveDelay - dt);
          b.x = s.paddleX;
        } else {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
        }

        if (b.x - b.r < 6) { b.x = 6 + b.r; b.vx = Math.abs(b.vx); sfx.tap(); }
        if (b.x + b.r > W - 6) { b.x = W - 6 - b.r; b.vx = -Math.abs(b.vx); sfx.tap(); }
        if (b.y - b.r < 6) { b.y = 6 + b.r; b.vy = Math.abs(b.vy); sfx.tap(); }

        // Rebote en la base de mármol
        const py = H - 28;
        if (b.vy > 0 && b.y + b.r >= py - 6 && b.y - b.r <= py + 8 && Math.abs(b.x - s.paddleX) <= s.paddleW / 2 + 4) {
          const hit = (b.x - s.paddleX) / (s.paddleW / 2);
          const speed = Math.min(340, Math.hypot(b.vx, b.vy) + 4);
          b.vx = hit * speed * 0.78;
          b.vy = -Math.sqrt(Math.max(16000, speed * speed - b.vx * b.vx));
          b.y = py - 6 - b.r;
          sfx.tap();
        }

        // Vitrales (rebote lateral o vertical según solapamiento)
        for (const br of s.bricks) {
          if (!br.alive) continue;
          if (b.x + b.r > br.x && b.x - b.r < br.x + br.w && b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
            br.alive = false;
            const overlapX = Math.min(b.x + b.r - br.x, br.x + br.w - (b.x - b.r));
            const overlapY = Math.min(b.y + b.r - br.y, br.y + br.h - (b.y - b.r));
            if (overlapX < overlapY) b.vx = -b.vx;
            else b.vy = -b.vy;
            s.cleared += 1;
            s.score += 65;
            sfx.collect((s.cleared % 6) + 1);
            spawnParticles(s.particles, br.x + br.w / 2, br.y + br.h / 2, [br.color, '#fff9db'], 12, 120);
            if (Math.random() < 0.2) {
              s.powerups.push({ x: br.x + br.w / 2, y: br.y, vy: 120 });
            }
            setHud({ cleared: s.cleared, total: s.total, lives: s.lives, score: s.score });
            onProgress?.(s.cleared);
            if (s.cleared >= s.total) {
              doneRef.current = true;
              const stars = s.lives === 3 ? 3 : s.lives === 2 ? 2 : 1;
              sfx.win();
              onComplete({
                won: true,
                score: s.score + s.lives * 120,
                maxScore: s.total * 65,
                stars,
                unit: 'puntos de vitral',
                summary: '¡Has iluminado las 24 vidrieras de la bóveda histórica sin dejar ni una a oscuras!',
              });
              return;
            }
            break;
          }
        }

        for (let i = s.powerups.length - 1; i >= 0; i -= 1) {
          const p = s.powerups[i];
          p.y += p.vy * dt;
          if (Math.abs(p.x - s.paddleX) < s.paddleW / 2 + 10 && Math.abs(p.y - py) < 16) {
            s.paddleW = Math.min(142, s.paddleW + 22);
            s.score += 80;
            sfx.gift();
            s.powerups.splice(i, 1);
            continue;
          }
          if (p.y > H) s.powerups.splice(i, 1);
        }

        if (b.y > H + 16) {
          s.lives -= 1;
          sfx.hit();
          setHud({ cleared: s.cleared, total: s.total, lives: s.lives, score: s.score });
          if (s.lives <= 0) {
            doneRef.current = true;
            sfx.end();
            onComplete({
              won: false,
              score: s.score,
              maxScore: s.total * 65,
              stars: s.cleared >= 15 ? 1 : 0,
              unit: 'puntos de vitral',
              summary: `Iluminaste ${s.cleared} de las ${s.total} piezas del vitral. ¡Vuelve a lanzar la esfera!`,
            });
            return;
          }
          s.serveDelay = 0.7;
          s.ball = { x: s.paddleX, y: H - 52, vx: 165, vy: -225, r: 7 };
        }
      }

      if (s) {
        const ctx = setupHiDPICanvas(canvas, W, H);
        if (!ctx) return;
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1b263b');
        bg.addColorStop(1, '#2d3a4b');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        for (const br of s.bricks) {
          if (!br.alive) continue;
          ctx.fillStyle = br.color;
          roundRect(ctx, br.x, br.y, br.w, br.h, 4);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 248, 220, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        for (const p of s.powerups) {
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✨', p.x, p.y);
        }

        ctx.fillStyle = '#f4e4c1';
        roundRect(ctx, s.paddleX - s.paddleW / 2, H - 34, s.paddleW, 12, 6);
        ctx.fill();

        ctx.fillStyle = '#ffe066';
        ctx.beginPath();
        ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
        ctx.fill();

        updateAndDrawParticles(ctx, s.particles, started && !doneRef.current ? dt : 0, 80);
      }

      if (started) rafId = clock.requestFrame(tick);
    };

    rafId = clock.requestFrame(tick);
    return () => clock.cancelFrame(rafId);
  }, [clock, onComplete, onProgress, started]);

  function onMove(e) {
    if (e.type === 'pointerdown') {
      if (e.button !== 0) return;
      capturePointer(e);
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    targetXRef.current = ((e.clientX - rect.left) / rect.width) * W;
    if (!started && e.type === 'pointerdown') setStarted(true);
  }

  return (
    <div className="arcade-wrap">
      <div className="game-stats-line">
        <span>VITRALES <strong>{hud.cleared}/{hud.total}</strong></span>
        <span>PUNTOS <strong>{hud.score}</strong></span>
        <span>ESFERAS <strong>{'🟡'.repeat(hud.lives)}</strong></span>
        <button type="button" onClick={reset} aria-label="Reiniciar vitral"><RotateCcw size={14} /></button>
      </div>
      <div className="canvas-frame">
        <canvas ref={canvasRef} className="game-canvas" onPointerMove={onMove} onPointerDown={onMove} aria-label={game.title} />
        {!started && (
          <div className="canvas-overlay">
            <button type="button" className="canvas-start-btn" onClick={() => { sfx.collect(1); setStarted(true); }}>
              <Play size={16} /> Lanzar esfera de luz
            </button>
            <span>Desliza o usa ← → para rebotar e iluminar toda la bóveda</span>
          </div>
        )}
      </div>
      <div className="touch-controls">
        <HoldButton type="button" className="touch-btn" onPress={() => { setStarted(true); targetXRef.current = null; keysRef.current.left = true; }} onRelease={() => { keysRef.current.left = false; }}>
          <ChevronLeft size={18} /> Izquierda
        </HoldButton>
        <HoldButton type="button" className="touch-btn" onPress={() => { setStarted(true); targetXRef.current = null; keysRef.current.right = true; }} onRelease={() => { keysRef.current.right = false; }}>
          Derecha <ChevronRight size={18} />
        </HoldButton>
      </div>
    </div>
  );
}

/* =========================================================================
   7. GUARDIÁN DE LOS CIRIOS · Protege las llamas del viento (Viernes Santo)
   ========================================================================= */
export function CandlesGame({ game, onProgress, onComplete }) {
  const clock = useGameClock();
  const duration = game.duration ?? 24;
  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({ lit: 5, timeLeft: duration });
  const stateRef = useRef(null);
  const keysRef = useRef({ left: false, right: false });
  const doneRef = useRef(false);

  const init = useCallback(() => ({
    shieldX: W / 2,
    timeLeft: duration,
    time: 0,
    candles: [90, 170, 250, 330, 410].map((x) => ({ x, flame: 100 })),
    gusts: [],
    gustTimer: 0.5,
    particles: [],
  }), [duration]);

  useEffect(() => { stateRef.current = init(); }, [clock, init]);

  const reset = useCallback(() => {
    doneRef.current = false;
    keysRef.current = { left: false, right: false };
    stateRef.current = init();
    setHud({ lit: 5, timeLeft: duration });
    onProgress?.(5);
    setStarted(true);
  }, [duration, init, onProgress]);

  const relight = useCallback(() => {
    if (!started) { setStarted(true); return; }
    const s = stateRef.current;
    const unlit = s?.candles.find((c) => c.flame === 0);
    if (!unlit || doneRef.current) return;
    unlit.flame = 85;
    s.shieldX = unlit.x;
    sfx.sizzle();
    spawnParticles(s.particles, unlit.x, 164, ['#ffe066', '#ff9f1c'], 12, 95);
  }, [started]);

  useEffect(() => {
    function onDown(e) {
      if (clock.isPaused() || isModalChromeTarget(e)) return;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); keysRef.current.left = true; setStarted(true); }
      if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); keysRef.current.right = true; setStarted(true); }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (e.repeat) return;
        relight();
      }
    }
    function onUp(e) {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
    }
    function clearHeld() {
      keysRef.current = { left: false, right: false };
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clearHeld);
    window.addEventListener('festeja:release-input', clearHeld);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clearHeld);
      window.removeEventListener('festeja:release-input', clearHeld);
    };
  }, [clock, started, relight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let rafId = 0;
    let last = clock.now();
    let hudAcc = 0;

    const tick = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (started && !doneRef.current && s) {
        s.time += dt;
        s.timeLeft = Math.max(0, s.timeLeft - dt);
        const kdir = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
        if (kdir !== 0) {
          s.shieldX = clamp(s.shieldX + kdir * 320 * dt, 54, W - 54);
        }

        s.gustTimer -= dt;
        if (s.gustTimer <= 0) {
          s.gustTimer = 0.65 + Math.random() * 0.35;
          const target = s.candles[Math.floor(Math.random() * s.candles.length)];
          s.gusts.push({ x: target.x + (Math.random() - 0.5) * 20, y: 12, vy: 135 + Math.random() * 45 });
        }

        // El farol protector aviva las llamas cercanas
        for (const c of s.candles) {
          if (c.flame > 0 && Math.abs(c.x - s.shieldX) < 46) {
            c.flame = Math.min(100, c.flame + 28 * dt);
          }
        }

        for (let i = s.gusts.length - 1; i >= 0; i -= 1) {
          const g = s.gusts[i];
          g.y += g.vy * dt;
          // Bloqueado por la pantalla de latón
          if (Math.abs(g.x - s.shieldX) < 52 && Math.abs(g.y - 128) < 18) {
            sfx.tap();
            spawnParticles(s.particles, g.x, 124, ['#ffe066', '#d0ebff'], 8, 80);
            s.gusts.splice(i, 1);
            continue;
          }
          if (g.y >= 166) {
            const hit = s.candles.find((c) => Math.abs(c.x - g.x) < 34);
            if (hit && hit.flame > 0) {
              hit.flame = Math.max(0, hit.flame - 48);
              sfx.hit();
              spawnParticles(s.particles, hit.x, 168, ['#adb5bd', '#ffd43b'], 8, 70);
            }
            s.gusts.splice(i, 1);
          }
        }

        const lit = s.candles.filter((c) => c.flame > 0).length;
        if (lit === 0) {
          doneRef.current = true;
          sfx.end();
          onComplete({
            won: false,
            score: 0,
            maxScore: 5,
            stars: 0,
            unit: 'cirios encendidos',
            summary: 'La brisa de primavera apagó los cirios. ¡Cúbrelos con el guardabrisa y toca una mecha para reavivarla!',
          });
          return;
        }

        if (s.timeLeft <= 0) {
          doneRef.current = true;
          const stars = lit === 5 ? 3 : lit >= 3 ? 2 : 1;
          sfx.win();
          onComplete({
            won: true,
            score: lit,
            maxScore: 5,
            stars,
            unit: 'cirios encendidos',
            summary: `Llegaste a la plaza con ${lit} de los 5 cirios iluminando la noche en calma.`,
          });
          return;
        }

        hudAcc += dt;
        if (hudAcc >= 0.12) {
          hudAcc = 0;
          setHud({ lit, timeLeft: Math.ceil(s.timeLeft) });
          onProgress?.(lit);
        }
      }

      if (s) {
        const ctx = setupHiDPICanvas(canvas, W, H);
        if (!ctx) return;
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#181426');
        bg.addColorStop(1, '#2e2540');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Ráfagas de brisa nocturna
        for (const g of s.gusts) {
          ctx.fillStyle = 'rgba(186, 224, 255, 0.78)';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💨', g.x, g.y);
        }

        // Guardabrisa dorado del jugador
        ctx.strokeStyle = '#f2c572';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(s.shieldX, 152, 46, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();

        // Cinco cirios
        for (const c of s.candles) {
          ctx.fillStyle = '#f7f1e1';
          roundRect(ctx, c.x - 13, 184, 26, 98, 5);
          ctx.fill();
          ctx.fillStyle = '#b08968';
          ctx.fillRect(c.x - 18, 276, 36, 10);
          ctx.fillStyle = '#2b2d42';
          ctx.fillRect(c.x - 1, 174, 2, 10);

          if (c.flame > 0) {
            const scale = 0.55 + (c.flame / 100) * 0.55;
            const sway = Math.sin(s.time * 9 + c.x) * 2;
            ctx.fillStyle = 'rgba(255, 209, 102, 0.22)';
            ctx.beginPath();
            ctx.arc(c.x, 164, 26 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff9f1c';
            ctx.beginPath();
            ctx.ellipse(c.x + sway, 164, 7 * scale, 14 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff3b0';
            ctx.beginPath();
            ctx.ellipse(c.x + sway * 0.5, 167, 3.5 * scale, 7 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = '700 8px "DM Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PRENDER', c.x, 166);
          }
        }

        updateAndDrawParticles(ctx, s.particles, started && !doneRef.current ? dt : 0, 40);
      }

      if (started) rafId = clock.requestFrame(tick);
    };

    rafId = clock.requestFrame(tick);
    return () => clock.cancelFrame(rafId);
  }, [clock, onComplete, onProgress, started]);

  function onPointer(e) {
    if (e.type === 'pointerdown') {
      if (e.button !== 0) return;
      capturePointer(e);
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    const s = stateRef.current;
    if (!rect || rect.width <= 0 || !s) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    s.shieldX = clamp(x, 54, W - 54);
    if (e.type === 'pointerdown') {
      if (!started) {
        setStarted(true);
        return;
      }
      const unlit = s.candles.find((c) => c.flame === 0 && Math.abs(c.x - x) < 34);
      if (unlit) {
        unlit.flame = 85;
        sfx.sizzle();
        spawnParticles(s.particles, unlit.x, 164, ['#ffe066', '#ff9f1c'], 12, 95);
      }
    }
  }

  return (
    <div className="arcade-wrap">
      <div className="game-stats-line">
        <span>CIRIOS VIVOS <strong>{hud.lit}/5</strong></span>
        <span>TRAMO FINAL <strong>{hud.timeLeft}s</strong></span>
        <button type="button" onClick={reset} aria-label="Reiniciar cirios"><RotateCcw size={14} /></button>
      </div>
      <div className="canvas-frame">
        <canvas ref={canvasRef} className="game-canvas" onPointerMove={onPointer} onPointerDown={onPointer} aria-label={game.title} />
        {!started && (
          <div className="canvas-overlay">
            <button type="button" className="canvas-start-btn" onClick={() => { sfx.sizzle(); setStarted(true); }}>
              <Flame size={16} /> Encender los cirios
            </button>
            <span>Mueve el arco dorado para cortar las ráfagas 💨 · Toca un cirio apagado para reavivarlo</span>
          </div>
        )}
      </div>
      <div className="touch-controls" aria-label="Controles del guardabrisa">
        <HoldButton className="touch-btn" aria-label="Mover guardabrisa a la izquierda" onPress={() => { setStarted(true); keysRef.current.left = true; }} onRelease={() => { keysRef.current.left = false; }}><ChevronLeft size={18} /> Izq.</HoldButton>
        <ActionButton className="touch-btn touch-btn-accent" onAction={relight}><Flame size={16} /> Reavivar</ActionButton>
        <HoldButton className="touch-btn" aria-label="Mover guardabrisa a la derecha" onPress={() => { setStarted(true); keysRef.current.right = true; }} onRelease={() => { keysRef.current.right = false; }}>Der. <ChevronRight size={18} /></HoldButton>
      </div>
      <p className="game-hint"><span className="hint-sparkle">✦</span> Desliza el guardabrisa para proteger las cinco llamas hasta llegar a la plaza.</p>
    </div>
  );
}

/* =========================================================================
   8. CIRCUITO DE LUZ · Puzle de guirnaldas luminosas (Inmaculada / Jueves Santo)
   ========================================================================= */
export function LightsGame({ game, onProgress, onComplete }) {
  const clock = useGameClock();
  const size = game.size ?? 4;
  const gridNavigation = useGridNavigation(size);
  const bulbIcon = game.bulbIcon ?? '🎄';
  const [grid, setGrid] = useState(() => createLightsPuzzle(size));
  const [moves, setMoves] = useState(0);
  const finishedRef = useRef(false);
  const endTimerRef = useRef(0);

  useEffect(() => () => clock.clearTimeout(endTimerRef.current), [clock]);

  const status = computePoweredGrid(grid);

  function rotateTile(r, c) {
    if (finishedRef.current) return;
    sfx.rotate();
    const next = grid.map((row, ri) => row.map((cell, ci) => (
      ri === r && ci === c ? { ...cell, rotation: (cell.rotation + 1) % 4 } : cell
    )));
    const nextMoves = moves + 1;
    setGrid(next);
    setMoves(nextMoves);
    const nextStatus = computePoweredGrid(next);
    onProgress?.(nextStatus.litCount);

    if (nextStatus.solved) {
      finishedRef.current = true;
      const stars = nextMoves <= size * size + 2 ? 3 : nextMoves <= size * size * 2 ? 2 : 1;
      sfx.win();
      clock.clearTimeout(endTimerRef.current);
      endTimerRef.current = clock.setTimeout(() => {
        onComplete({
          won: true,
          score: nextStatus.total,
          maxScore: nextStatus.total,
          stars,
          unit: 'luces encendidas',
          summary: `¡Todo iluminado en ${nextMoves} giros! La guirnalda brilla de punta a punta.`,
        });
      }, 480);
    }
  }

  function reset() {
    clock.clearTimeout(endTimerRef.current);
    finishedRef.current = false;
    const fresh = createLightsPuzzle(size);
    setGrid(fresh);
    setMoves(0);
    onProgress?.(computePoweredGrid(fresh).litCount);
  }

  return (
    <div className="lights-wrap">
      <div className="game-stats-line">
        <span>ENCENDIDAS <strong>{status.litCount}/{status.total}</strong></span>
        <span>GIROS <strong>{moves}</strong></span>
        <button type="button" onClick={reset} aria-label="Nuevo circuito de luces"><RotateCcw size={14} /></button>
      </div>

      <div className="lights-board" style={{ '--lights-size': size }} role="group" aria-roledescription="tablero" aria-label={game.title} onKeyDown={gridNavigation.onKeyDown}>
        {grid.map((row, r) => row.map((cell, c) => {
          const mask = currentCellMask(cell);
          const lit = status.powered[r][c];
          return (
            <button
              {...gridNavigation.cellProps(r * size + c)}
              key={`${r}-${c}`}
              type="button"
              className={`lights-tile ${lit ? 'is-lit' : ''} ${cell.isSource ? 'is-source' : ''}`}
              onClick={() => rotateTile(r, c)}
              aria-label={`Pieza fila ${r + 1} columna ${c + 1}, ${lit ? 'encendida' : 'apagada'}. Tocar para girar.`}
            >
              <svg viewBox="0 0 64 64" className="lights-svg" aria-hidden="true">
                {Boolean(mask & 1) && <line x1="32" y1="32" x2="32" y2="0" />}
                {Boolean(mask & 2) && <line x1="32" y1="32" x2="64" y2="32" />}
                {Boolean(mask & 4) && <line x1="32" y1="32" x2="32" y2="64" />}
                {Boolean(mask & 8) && <line x1="32" y1="32" x2="0" y2="32" />}
                <circle cx="32" cy="32" r={cell.isSource ? 12 : cell.isBulb ? 10 : 5.5} />
              </svg>
              {cell.isSource && <span className="lights-node-icon" aria-hidden="true">⭐</span>}
              {cell.isBulb && <span className={`lights-node-icon ${lit ? 'is-glowing' : 'is-dim'}`} aria-hidden="true">{lit ? bulbIcon : '💡'}</span>}
            </button>
          );
        }))}
      </div>

      <p className="game-hint">
        <span className="hint-sparkle">✦</span>
        Toca cada casilla para girar los cables dorados y llevar la luz de la estrella ⭐ a todas las luminarias.
      </p>
    </div>
  );
}
