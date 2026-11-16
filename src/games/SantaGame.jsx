import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Gift, Play, RotateCcw } from 'lucide-react';
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
import { sfx } from '../sound.js';

const W = 500;
const H = 310;
const SLEIGH_X = 112;

function drawSantaSleigh(ctx, x, y, time, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  // Riendas doradas hacia el reno
  ctx.strokeStyle = 'rgba(255, 224, 130, 0.75)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(16, -2);
  ctx.quadraticCurveTo(36, 4, 54, -4);
  ctx.stroke();

  // Reno Rodolfo delante
  const gallop = Math.sin(time * 11) * 4;
  ctx.save();
  ctx.translate(58, -2 + gallop * 0.35);
  // Patas
  ctx.strokeStyle = '#7c4d2b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-7, 6);
  ctx.lineTo(-12 - gallop * 0.5, 14);
  ctx.moveTo(7, 6);
  ctx.lineTo(13 + gallop * 0.5, 13);
  ctx.stroke();
  // Cuerpo y cabeza
  ctx.fillStyle = '#9c6644';
  ctx.beginPath();
  ctx.ellipse(0, 2, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(13, -5, 7, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Astas
  ctx.strokeStyle = '#e6ccb2';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(11, -9);
  ctx.lineTo(9, -17);
  ctx.moveTo(14, -9);
  ctx.lineTo(18, -16);
  ctx.stroke();
  // Nariz roja luminosa de Rodolfo
  ctx.fillStyle = '#ff4d4d';
  ctx.shadowColor = '#ff4d4d';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(20, -5, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Patines dorados del trineo
  ctx.strokeStyle = '#f2c572';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-30, 14);
  ctx.lineTo(20, 14);
  ctx.quadraticCurveTo(30, 14, 30, 5);
  ctx.stroke();

  // Saco de regalos
  ctx.fillStyle = '#52b788';
  ctx.beginPath();
  ctx.arc(-18, -5, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-23, -13, 8, 6);

  // Papá Noel
  ctx.fillStyle = '#d62828';
  ctx.beginPath();
  ctx.arc(2, -5, 10, 0, Math.PI * 2);
  ctx.fill();
  // Cara y barba blanca
  ctx.fillStyle = '#fcd5ce';
  ctx.beginPath();
  ctx.arc(4, -14, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(6, -11, 5.5, -0.2, Math.PI + 0.2);
  ctx.fill();
  // Gorro navideño
  ctx.fillStyle = '#d62828';
  ctx.beginPath();
  ctx.moveTo(-2, -17);
  ctx.lineTo(10, -17);
  ctx.lineTo(-5, -26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-3, -18, 13, 3);
  ctx.beginPath();
  ctx.arc(-6, -26, 3, 0, Math.PI * 2);
  ctx.fill();

  // Cuerpo rojo del trineo
  ctx.fillStyle = '#c1121f';
  roundRect(ctx, -28, -2, 48, 14, 6);
  ctx.fill();
  ctx.strokeStyle = '#f4d35e';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.restore();
}

export default function SantaGame({ game, onProgress, onComplete }) {
  const goalGifts = game.goal ?? 10;
  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({ delivered: 0, score: 0, lives: 3, streak: 0 });

  const keysRef = useRef({ up: false, down: false });
  const stateRef = useRef(null);
  const doneRef = useRef(false);

  const makeHouse = (x) => {
    const w = 78 + Math.floor(Math.random() * 34);
    const h = 54 + Math.floor(Math.random() * 32);
    return {
      x,
      w,
      h,
      color: ['#5c4742', '#4a5759', '#6d597a', '#5a4d41'][Math.floor(Math.random() * 4)],
      chimneyOffset: w * (0.55 + Math.random() * 0.2),
      delivered: false,
    };
  };

  const initState = useCallback(() => ({
    y: 92,
    vy: 0,
    time: 0,
    delivered: 0,
    score: 0,
    streak: 0,
    lives: 3,
    invuln: 0,
    dropCooldown: 0,
    gifts: [],
    houses: [makeHouse(180), makeHouse(355), makeHouse(530)],
    hazards: [],
    stars: [],
    particles: [],
    popups: [],
    snow: Array.from({ length: 42 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 2.2,
      s: 26 + Math.random() * 36,
    })),
    hazardTimer: 1.4,
    starTimer: 0.8,
  }), []);

  useEffect(() => {
    stateRef.current = initState();
  }, [initState]);

  const dropGift = useCallback(() => {
    const s = stateRef.current;
    if (!s || doneRef.current) return;
    if (s.dropCooldown > 0) return;
    s.dropCooldown = 0.28;
    sfx.drop();
    const palette = [
      { box: '#e63946', ribbon: '#ffd166' },
      { box: '#2a9d8f', ribbon: '#fff3b0' },
      { box: '#7209b7', ribbon: '#ffd166' },
    ][s.gifts.length % 3];
    s.gifts.push({
      x: SLEIGH_X - 4,
      y: s.y + 14,
      vx: 38,
      vy: 45,
      rot: 0,
      ...palette,
    });
  }, []);

  const reset = useCallback(() => {
    doneRef.current = false;
    keysRef.current = { up: false, down: false };
    stateRef.current = initState();
    setHud({ delivered: 0, score: 0, lives: 3, streak: 0 });
    onProgress?.(0);
    setStarted(true);
  }, [initState, onProgress]);

  useEffect(() => {
    function onKeyDown(e) {
      if (isModalChromeTarget(e)) return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        keysRef.current.up = true;
        if (!started) setStarted(true);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        keysRef.current.down = true;
        if (!started) setStarted(true);
      } else if (['Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
        if (e.repeat) return;
        if (!started) {
          setStarted(true);
          return;
        }
        dropGift();
      }
    }
    function onKeyUp(e) {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.down = false;
    }
    function clearHeld() {
      keysRef.current = { up: false, down: false };
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
    };
  }, [dropGift, started]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let rafId = 0;
    let last = performance.now();

    const draw = (s, fxDt) => {
      const ctx = setupHiDPICanvas(canvas, W, H);
      if (!ctx) return;

      // Cielo invernal estrellado con aurora suave
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0d1b2a');
      sky.addColorStop(0.58, '#1b314b');
      sky.addColorStop(1, '#2c4969');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Luna llena navideña
      ctx.fillStyle = 'rgba(255, 246, 209, 0.14)';
      ctx.beginPath();
      ctx.arc(418, 56, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff5d1';
      ctx.beginPath();
      ctx.arc(418, 56, 25, 0, Math.PI * 2);
      ctx.fill();

      // Colinas nevadas al fondo
      ctx.fillStyle = '#203852';
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.quadraticCurveTo(130, 205, 270, 245);
      ctx.quadraticCurveTo(400, 200, W, 238);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Casas y chimeneas iluminadas
      for (const h of s.houses) {
        const topY = H - h.h;
        const chimX = h.x + h.chimneyOffset;
        const chimY = topY - 22;

        // Chimenea de ladrillo
        ctx.fillStyle = h.delivered ? '#52b788' : '#b5483a';
        roundRect(ctx, chimX - 13, chimY, 26, 26, 3);
        ctx.fill();
        ctx.fillStyle = '#f8f9fa';
        roundRect(ctx, chimX - 16, chimY - 4, 32, 7, 3);
        ctx.fill();

        // Indicador dorado sobre chimeneas pendientes
        if (!h.delivered) {
          const pulse = Math.sin(s.time * 6 + h.x * 0.02) * 3;
          ctx.strokeStyle = 'rgba(255, 224, 102, 0.85)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(chimX - 6, chimY - 16 + pulse);
          ctx.lineTo(chimX, chimY - 9 + pulse);
          ctx.lineTo(chimX + 6, chimY - 16 + pulse);
          ctx.stroke();
        } else {
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🎄', chimX, chimY - 11);
        }

        // Fachada y tejado nevado
        ctx.fillStyle = h.color;
        ctx.fillRect(h.x, topY, h.w, h.h);
        ctx.fillStyle = '#eef4fa';
        roundRect(ctx, h.x - 5, topY - 7, h.w + 10, 11, 5);
        ctx.fill();

        // Ventanas cálidas
        ctx.fillStyle = h.delivered ? '#ffe066' : '#f4c97d';
        const cols = Math.max(2, Math.floor(h.w / 30));
        for (let c = 0; c < cols; c += 1) {
          const wx = h.x + 12 + c * 26;
          roundRect(ctx, wx, topY + 14, 13, 16, 2);
          ctx.fill();
        }
      }

      // Suelo nevado
      ctx.fillStyle = '#eef4fa';
      ctx.fillRect(0, H - 8, W, 8);

      // Estrellas coleccionables
      for (const star of s.stars) {
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.font = '19px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', 0, 0);
        ctx.restore();
      }

      // Nubes de ventisca
      for (const hz of s.hazards) {
        ctx.save();
        ctx.translate(hz.x, hz.y);
        ctx.fillStyle = '#8fa6c2';
        ctx.beginPath();
        ctx.arc(-11, 2, 11, 0, Math.PI * 2);
        ctx.arc(2, -4, 13, 0, Math.PI * 2);
        ctx.arc(14, 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe066';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', 2, 11);
        ctx.restore();
      }

      // Regalos cayendo con lazo
      for (const g of s.gifts) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.rot);
        ctx.fillStyle = g.box;
        roundRect(ctx, -8, -8, 16, 16, 3);
        ctx.fill();
        ctx.fillStyle = g.ribbon;
        ctx.fillRect(-2, -8, 4, 16);
        ctx.fillRect(-8, -2, 16, 4);
        ctx.restore();
      }

      // Estela punteada dorada de caída bajo el trineo para calcular el tiro
      if (started) {
        ctx.fillStyle = 'rgba(255, 229, 138, 0.36)';
        const simScroll = 138 + s.delivered * 4;
        for (let step = 1; step <= 5; step += 1) {
          const t = step * 0.12;
          const gx = (SLEIGH_X - 4) + (38 - simScroll * 0.35) * t;
          const gy = (s.y + 14) + 45 * t + 0.5 * 380 * t * t;
          if (gy < H - 24) {
            ctx.beginPath();
            ctx.arc(gx, gy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Trineo de Papá Noel
      const blink = s.invuln > 0 && Math.floor(s.invuln * 14) % 2 === 0;
      if (!blink) {
        drawSantaSleigh(ctx, SLEIGH_X, s.y, s.time, clamp(s.vy / 520, -0.22, 0.22));
      }

      // Copos de nieve
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (const flake of s.snow) {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fill();
      }

      updateAndDrawParticles(ctx, s.particles, fxDt, 90);
      updateAndDrawPopups(ctx, s.popups, fxDt);
    };

    const tick = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (started && !doneRef.current && s) {
        s.time += dt;
        if (s.invuln > 0) s.invuln = Math.max(0, s.invuln - dt);
        if (s.dropCooldown > 0) s.dropCooldown = Math.max(0, s.dropCooldown - dt);

        // Movimiento vertical suave
        let dir = 0;
        if (keysRef.current.up) dir -= 1;
        if (keysRef.current.down) dir += 1;
        const targetVy = dir * 210;
        s.vy += (targetVy - s.vy) * Math.min(1, dt * 10);
        s.y = clamp(s.y + s.vy * dt, 34, 174);

        const scrollSpeed = 138 + s.delivered * 4;

        // Nieve
        for (const flake of s.snow) {
          flake.x -= scrollSpeed * 0.55 * dt;
          flake.y += flake.s * dt;
          if (flake.x < 0) flake.x += W;
          if (flake.y > H) flake.y -= H;
        }

        // Casas
        for (const h of s.houses) {
          h.x -= scrollSpeed * dt;
        }
        if (s.houses[0].x + s.houses[0].w < -20) {
          s.houses.shift();
          const lastHouse = s.houses[s.houses.length - 1];
          s.houses.push(makeHouse(lastHouse.x + lastHouse.w + 55 + Math.random() * 48));
        }

        // Nubes de ventisca
        s.hazardTimer -= dt;
        if (s.hazardTimer <= 0) {
          s.hazardTimer = 1.65 + Math.random() * 0.7;
          s.hazards.push({ x: W + 30, y: 36 + Math.random() * 126 });
        }
        for (let i = s.hazards.length - 1; i >= 0; i -= 1) {
          const hz = s.hazards[i];
          hz.x -= (scrollSpeed + 42) * dt;
          if (s.invuln <= 0 && Math.abs(hz.x - (SLEIGH_X + 14)) < 38 && Math.abs(hz.y - s.y) < 22) {
            s.lives -= 1;
            s.streak = 0;
            s.invuln = 1.4;
            sfx.hit();
            spawnParticles(s.particles, SLEIGH_X + 10, s.y, ['#a5d8ff', '#ffffff', '#ffd43b'], 14);
            spawnPopup(s.popups, SLEIGH_X, s.y - 20, '¡VENTISCA!', '#a5d8ff');
            s.hazards.splice(i, 1);
            setHud({ delivered: s.delivered, score: s.score, lives: s.lives, streak: s.streak });
            if (s.lives <= 0) {
              doneRef.current = true;
              sfx.end();
              onComplete({
                won: false,
                score: s.score,
                maxScore: goalGifts * 130,
                stars: s.delivered >= Math.ceil(goalGifts * 0.6) ? 1 : 0,
                unit: 'puntos navideños',
                summary: `Repartiste ${s.delivered} de ${goalGifts} regalos antes de que arreciara la nevada. ¡Vuelve a despegar!`,
              });
              return;
            }
            continue;
          }
          if (hz.x < -40) s.hazards.splice(i, 1);
        }

        // Estrellas navideñas
        s.starTimer -= dt;
        if (s.starTimer <= 0) {
          s.starTimer = 1.2 + Math.random() * 0.7;
          s.stars.push({ x: W + 20, y: 34 + Math.random() * 130 });
        }
        for (let i = s.stars.length - 1; i >= 0; i -= 1) {
          const st = s.stars[i];
          st.x -= scrollSpeed * dt;
          if (Math.abs(st.x - (SLEIGH_X + 16)) < 42 && Math.abs(st.y - s.y) < 26) {
            s.score += 50;
            sfx.collect(2);
            spawnParticles(s.particles, st.x, st.y, ['#ffe066', '#fff9db'], 10);
            spawnPopup(s.popups, st.x, st.y - 10, '+50 ⭐', '#ffe066');
            s.stars.splice(i, 1);
            setHud({ delivered: s.delivered, score: s.score, lives: s.lives, streak: s.streak });
            continue;
          }
          if (st.x < -30) s.stars.splice(i, 1);
        }

        // Física de regalos y entrada por la chimenea
        for (let i = s.gifts.length - 1; i >= 0; i -= 1) {
          const g = s.gifts[i];
          g.vy += 380 * dt;
          g.x += (g.vx - scrollSpeed * 0.35) * dt;
          g.y += g.vy * dt;
          g.rot += 4 * dt;

          let caught = false;
          for (const h of s.houses) {
            if (h.delivered) continue;
            const chimX = h.x + h.chimneyOffset;
            const chimY = H - h.h - 22;
            if (Math.abs(g.x - chimX) < 24 && Math.abs(g.y - chimY) < 20) {
              h.delivered = true;
              caught = true;
              s.delivered += 1;
              s.streak += 1;
              const pts = 100 + Math.min(s.streak - 1, 5) * 35;
              s.score += pts;
              sfx.gift();
              spawnParticles(s.particles, chimX, chimY, ['#ffe066', '#ff6b6b', '#63e6be', '#ffffff'], 18, 150);
              spawnPopup(
                s.popups,
                chimX,
                chimY - 14,
                s.streak >= 2 ? `¡HO HO HO ×${s.streak}!` : '¡DENTRO! 🎁',
                '#ffe066',
              );
              setHud({ delivered: s.delivered, score: s.score, lives: s.lives, streak: s.streak });
              onProgress?.(s.delivered);
              break;
            }
          }
          if (caught) {
            s.gifts.splice(i, 1);
            if (s.delivered >= goalGifts) {
              doneRef.current = true;
              const stars = s.lives === 3 ? 3 : s.lives === 2 ? 2 : 1;
              sfx.win();
              onComplete({
                won: true,
                score: s.score + s.lives * 100,
                maxScore: goalGifts * 130,
                stars,
                unit: 'puntos navideños',
                summary: `¡Jo, jo, jo! Papá Noel y Rodolfo han colado los ${goalGifts} regalos por las chimeneas antes del amanecer.`,
              });
              return;
            }
            continue;
          }
          if (g.y > H - 6) {
            s.streak = 0;
            spawnParticles(s.particles, g.x, H - 8, ['#ffffff', '#dee2e6'], 6, 60);
            s.gifts.splice(i, 1);
          }
        }
      }

      if (s) draw(s, started && !doneRef.current ? dt : 0);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [goalGifts, onComplete, onProgress, started]);

  function handleCanvasTap(event) {
    if (!started) {
      setStarted(true);
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0 && stateRef.current) {
      const relX = ((event.clientX - rect.left) / rect.width) * W;
      const relY = ((event.clientY - rect.top) / rect.height) * H;
      if (relX < 185) {
        stateRef.current.y = clamp(relY, 34, 174);
        return;
      }
    }
    dropGift();
  }

  return (
    <div className="arcade-wrap">
      <div className="game-stats-line">
        <span>CHIMENEAS <strong>{hud.delivered}/{goalGifts}</strong></span>
        <span>PUNTOS <strong>{hud.score}</strong></span>
        <span>VIDAS <strong>{'❤️'.repeat(hud.lives)}</strong></span>
        <button type="button" onClick={reset} aria-label="Reiniciar vuelo de Papá Noel"><RotateCcw size={14} /></button>
      </div>

      <div className="canvas-frame">
        <canvas ref={canvasRef} className="game-canvas" onPointerDown={handleCanvasTap} aria-label={game.title} />
        {!started && (
          <div className="canvas-overlay">
            <button type="button" className="canvas-start-btn" onClick={() => { sfx.gift(); setStarted(true); }}>
              <Play size={16} /> Despegar el trineo
            </button>
            <span>↑ ↓ para volar y esquivar nubes · Espacio o clic para soltar regalos 🎁</span>
          </div>
        )}
      </div>

      <div className="touch-controls" aria-label="Controles del trineo">
        <button
          type="button"
          className="touch-btn"
          onPointerDown={() => { setStarted(true); keysRef.current.up = true; }}
          onPointerUp={() => { keysRef.current.up = false; }}
          onPointerCancel={() => { keysRef.current.up = false; }}
          onPointerLeave={() => { keysRef.current.up = false; }}
          aria-label="Subir trineo"
        >
          <ChevronUp size={18} /> Subir
        </button>
        <button
          type="button"
          className="touch-btn touch-btn-accent"
          onClick={() => { setStarted(true); dropGift(); }}
          aria-label="Soltar regalo por la chimenea"
        >
          <Gift size={16} /> Soltar regalo
        </button>
        <button
          type="button"
          className="touch-btn"
          onPointerDown={() => { setStarted(true); keysRef.current.down = true; }}
          onPointerUp={() => { keysRef.current.down = false; }}
          onPointerCancel={() => { keysRef.current.down = false; }}
          onPointerLeave={() => { keysRef.current.down = false; }}
          aria-label="Bajar trineo"
        >
          <ChevronDown size={18} /> Bajar
        </button>
      </div>
    </div>
  );
}
