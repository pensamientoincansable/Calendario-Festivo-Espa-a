import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Gift, Play, RotateCcw } from 'lucide-react';
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

const KINGS = [
  { name: 'Melchor', robe: '#c94a3e', skin: '#f7d5c4', beard: '#f4f4f6', gift: '#e9c46a', label: 'Oro' },
  { name: 'Gaspar', robe: '#2e7d62', skin: '#f2c6ac', beard: '#b5653d', gift: '#e76f51', label: 'Incienso' },
  { name: 'Baltasar', robe: '#5e4b8b', skin: '#6b442a', beard: null, gift: '#74c0fc', label: 'Mirra' },
];

function drawReyesCaravan(ctx, centerX, y, time, activeKing) {
  ctx.save();
  ctx.translate(centerX, y);

  // Dibujar los tres Reyes Magos sobre su carroza-camello real
  [-32, 0, 32].forEach((dx, idx) => {
    const king = KINGS[idx];
    const bob = Math.sin(time * 7 + idx * 1.3) * 2.2;
    const isCurrent = idx === activeKing;

    ctx.save();
    ctx.translate(dx, bob - (isCurrent ? 4 : 0));

    // Camello estilizado debajo
    ctx.fillStyle = idx === 1 ? '#d4a373' : '#bc8a5f';
    roundRect(ctx, -13, 6, 26, 15, 7);
    ctx.fill();
    // Patas en paso
    ctx.strokeStyle = '#8d5b34';
    ctx.lineWidth = 2.5;
    const step = Math.sin(time * 9 + idx) * 3;
    ctx.beginPath();
    ctx.moveTo(-7, 20);
    ctx.lineTo(-7 + step, 29);
    ctx.moveTo(7, 20);
    ctx.lineTo(7 - step, 29);
    ctx.stroke();

    // Manto real
    ctx.fillStyle = king.robe;
    ctx.beginPath();
    ctx.moveTo(-11, 10);
    ctx.lineTo(-8, -9);
    ctx.lineTo(8, -9);
    ctx.lineTo(11, 10);
    ctx.closePath();
    ctx.fill();
    // Armiño blanco
    ctx.fillStyle = '#fffdf8';
    roundRect(ctx, -9, -10, 18, 4, 2);
    ctx.fill();

    // Rostro
    ctx.fillStyle = king.skin;
    ctx.beginPath();
    ctx.arc(0, -16, 6.2, 0, Math.PI * 2);
    ctx.fill();

    // Barba de Melchor y Gaspar
    if (king.beard) {
      ctx.fillStyle = king.beard;
      ctx.beginPath();
      ctx.arc(0, -13, 5.4, 0, Math.PI);
      ctx.fill();
    }

    // Corona dorada
    ctx.fillStyle = isCurrent ? '#ffe066' : '#e9c46a';
    ctx.beginPath();
    ctx.moveTo(-6, -20);
    ctx.lineTo(-7, -27);
    ctx.lineTo(-2, -23);
    ctx.lineTo(0, -28);
    ctx.lineTo(2, -23);
    ctx.lineTo(7, -27);
    ctx.lineTo(6, -20);
    ctx.closePath();
    ctx.fill();

    // Regalo iluminado en manos del Rey que lanza ahora
    if (isCurrent) {
      ctx.fillStyle = king.gift;
      roundRect(ctx, -5, -3, 10, 10, 2);
      ctx.fill();
      ctx.fillStyle = '#fffdf8';
      ctx.fillRect(-1.2, -3, 2.4, 10);
      ctx.fillRect(-5, 0.8, 10, 2.4);
    }

    ctx.restore();
  });

  ctx.restore();
}

export default function ReyesGame({ game, onProgress, onComplete }) {
  const goalGifts = game.goal ?? 12;
  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({ delivered: 0, score: 0, timeLeft: 48, king: 'Melchor' });

  const keysRef = useRef({ left: false, right: false });
  const targetXRef = useRef(null);
  const stateRef = useRef(null);
  const doneRef = useRef(false);

  const makeBalcony = (x, row) => {
    const isRoyal = Math.random() < 0.25;
    return {
      x,
      y: row === 0 ? 74 : 138,
      w: 64,
      h: 34,
      row,
      dir: row === 0 ? 1 : -1,
      speed: row === 0 ? 58 : 74,
      filled: false,
      royal: isRoyal,
    };
  };

  const initState = useCallback(() => ({
    x: W / 2,
    time: 0,
    timeLeft: 48,
    delivered: 0,
    score: 0,
    streak: 0,
    activeKing: 0,
    cooldown: 0,
    balconies: [
      makeBalcony(60, 0),
      makeBalcony(230, 0),
      makeBalcony(400, 0),
      makeBalcony(120, 1),
      makeBalcony(310, 1),
      makeBalcony(480, 1),
    ],
    gifts: [],
    falling: [],
    fallTimer: 1.0,
    particles: [],
    popups: [],
    starX: 90,
  }), []);

  useEffect(() => {
    stateRef.current = initState();
  }, [initState]);

  const tossGift = useCallback(() => {
    const s = stateRef.current;
    if (!s || doneRef.current || s.cooldown > 0) return;
    s.cooldown = 0.26;
    const king = KINGS[s.activeKing];
    sfx.toss();
    s.gifts.push({
      x: s.x,
      y: 238,
      vy: -345,
      color: king.gift,
      ribbon: king.robe,
      kingName: king.name,
    });
    s.activeKing = (s.activeKing + 1) % KINGS.length;
  }, []);

  const reset = useCallback(() => {
    doneRef.current = false;
    keysRef.current = { left: false, right: false };
    stateRef.current = initState();
    targetXRef.current = null;
    setHud({ delivered: 0, score: 0, timeLeft: 48, king: 'Melchor' });
    onProgress?.(0);
    setStarted(true);
  }, [initState, onProgress]);

  useEffect(() => {
    function onKeyDown(e) {
      if (isModalChromeTarget(e)) return;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        keysRef.current.left = true;
        targetXRef.current = null;
        if (!started) setStarted(true);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        keysRef.current.right = true;
        targetXRef.current = null;
        if (!started) setStarted(true);
      } else if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) {
        e.preventDefault();
        if (e.repeat) return;
        if (!started) {
          setStarted(true);
          return;
        }
        tossGift();
      }
    }
    function onKeyUp(e) {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
    }
    function clearHeld() {
      keysRef.current = { left: false, right: false };
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
    };
  }, [started, tossGift]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let rafId = 0;
    let last = performance.now();
    let hudAcc = 0;

    const render = (s, fxDt) => {
      const ctx = setupHiDPICanvas(canvas, W, H);
      if (!ctx) return;

      // Noche de Reyes azul índigo y dorada
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#131633');
      sky.addColorStop(0.55, '#242b59');
      sky.addColorStop(1, '#362d4f');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Estrella de Oriente con estela dorada
      const starX = 70 + ((s.time * 22) % (W - 100));
      const tail = ctx.createLinearGradient(starX - 75, 28, starX, 28);
      tail.addColorStop(0, 'rgba(255, 224, 102, 0)');
      tail.addColorStop(1, 'rgba(255, 224, 102, 0.72)');
      ctx.strokeStyle = tail;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(starX - 75, 32);
      ctx.lineTo(starX, 26);
      ctx.stroke();
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌟', starX, 32);

      // Guirnaldas luminosas entre balcones
      ctx.strokeStyle = 'rgba(255, 232, 163, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 56);
      ctx.quadraticCurveTo(W / 2, 70, W, 56);
      ctx.stroke();

      // Balcones españoles con zapatos preparados
      for (const b of s.balconies) {
        ctx.save();
        ctx.translate(b.x, b.y);

        // Ventanal iluminado
        ctx.fillStyle = b.filled
          ? 'rgba(116, 198, 157, 0.35)'
          : b.royal
            ? 'rgba(255, 212, 59, 0.36)'
            : 'rgba(255, 236, 179, 0.22)';
        roundRect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 7);
        ctx.fill();
        ctx.strokeStyle = b.filled ? '#74c69d' : b.royal ? '#ffd43b' : 'rgba(255, 232, 178, 0.65)';
        ctx.lineWidth = b.royal ? 2.2 : 1.5;
        ctx.stroke();

        // Barandilla de forja
        ctx.strokeStyle = '#1b1a2e';
        ctx.lineWidth = 2;
        ctx.strokeRect(-b.w / 2 - 3, 2, b.w + 6, 14);
        for (let rx = -b.w / 2 + 6; rx < b.w / 2; rx += 9) {
          ctx.beginPath();
          ctx.moveTo(rx, 2);
          ctx.lineTo(rx, 16);
          ctx.stroke();
        }

        // Zapatos esperando o regalo entregado
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (b.filled) {
          ctx.fillText('🎁✨', 0, -2);
        } else if (b.royal) {
          ctx.fillText('👑👟', 0, -2);
        } else {
          ctx.fillText('👟', 0, -2);
        }

        ctx.restore();
      }

      // Caramelos y carbón cayendo
      for (const item of s.falling) {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.kind === 'coal' ? '🪨' : item.kind === 'roscón' ? '🥯' : '🍬', 0, 0);
        ctx.restore();
      }

      // Regalos volando hacia los balcones
      for (const g of s.gifts) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.fillStyle = g.color;
        roundRect(ctx, -8, -8, 16, 16, 3);
        ctx.fill();
        ctx.fillStyle = g.ribbon;
        ctx.fillRect(-2, -8, 4, 16);
        ctx.fillRect(-8, -2, 16, 4);
        ctx.restore();
      }

      // Calle adoquinada de cabalgata
      ctx.fillStyle = '#252138';
      ctx.fillRect(0, H - 30, W, 30);
      ctx.strokeStyle = 'rgba(255, 224, 150, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, H - 30);
      ctx.lineTo(W, H - 30);
      ctx.stroke();

      // Línea sutil de puntería vertical
      ctx.strokeStyle = 'rgba(255, 229, 138, 0.22)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(s.x, 222);
      ctx.lineTo(s.x, 90);
      ctx.stroke();
      ctx.setLineDash([]);

      // Sus Majestades Melchor, Gaspar y Baltasar
      drawReyesCaravan(ctx, s.x, 256, s.time, s.activeKing);

      updateAndDrawParticles(ctx, s.particles, fxDt, 100);
      updateAndDrawPopups(ctx, s.popups, fxDt);
    };

    const tick = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (started && !doneRef.current && s) {
        s.time += dt;
        s.timeLeft = Math.max(0, s.timeLeft - dt);
        if (s.cooldown > 0) s.cooldown = Math.max(0, s.cooldown - dt);

        // Movimiento de la comitiva real
        let dir = 0;
        if (keysRef.current.left) dir -= 1;
        if (keysRef.current.right) dir += 1;
        if (dir !== 0) {
          s.x = clamp(s.x + dir * 255 * dt, 54, W - 54);
        } else if (targetXRef.current != null) {
          const diff = targetXRef.current - s.x;
          s.x = clamp(s.x + clamp(diff * 9, -290, 290) * dt, 54, W - 54);
        }

        // Balcones en movimiento
        for (const b of s.balconies) {
          b.x += b.dir * b.speed * dt;
          if (b.dir > 0 && b.x > W + 45) {
            b.x = -45;
            b.filled = false;
            b.royal = Math.random() < 0.28;
          } else if (b.dir < 0 && b.x < -45) {
            b.x = W + 45;
            b.filled = false;
            b.royal = Math.random() < 0.28;
          }
        }

        // Lluvia de caramelos, roscón y algún carbón travieso
        s.fallTimer -= dt;
        if (s.fallTimer <= 0) {
          s.fallTimer = 1.15 + Math.random() * 0.55;
          const roll = Math.random();
          const kind = roll < 0.34 ? 'coal' : roll < 0.82 ? 'candy' : 'roscón';
          s.falling.push({ x: 50 + Math.random() * (W - 100), y: 26, vy: 118 + Math.random() * 45, kind });
        }
        for (let i = s.falling.length - 1; i >= 0; i -= 1) {
          const item = s.falling[i];
          item.y += item.vy * dt;
          if (Math.abs(item.x - s.x) < 46 && Math.abs(item.y - 252) < 28) {
            if (item.kind === 'coal') {
              s.score = Math.max(0, s.score - 40);
              s.streak = 0;
              sfx.hit();
              spawnParticles(s.particles, item.x, item.y, ['#495057', '#adb5bd'], 10);
              spawnPopup(s.popups, item.x, item.y - 14, '¡CARBÓN! -40', '#ced4da');
            } else {
              const pts = item.kind === 'roscón' ? 90 : 45;
              s.score += pts;
              sfx.collect(2);
              spawnParticles(s.particles, item.x, item.y, ['#ffe066', '#ff8fab', '#72efdd'], 12);
              spawnPopup(s.popups, item.x, item.y - 14, item.kind === 'roscón' ? '¡ROSCÓN +90!' : '+45 🍬', '#ffe066');
            }
            s.falling.splice(i, 1);
            continue;
          }
          if (item.y > H) s.falling.splice(i, 1);
        }

        // Regalos lanzados a los balcones
        for (let i = s.gifts.length - 1; i >= 0; i -= 1) {
          const g = s.gifts[i];
          g.y += g.vy * dt;
          let landed = false;

          for (const b of s.balconies) {
            if (b.filled) continue;
            if (Math.abs(g.x - b.x) < b.w / 2 + 4 && Math.abs(g.y - b.y) < b.h / 2 + 4) {
              b.filled = true;
              landed = true;
              s.delivered += 1;
              s.streak += 1;
              const pts = (b.royal ? 160 : 100) + Math.min(s.streak - 1, 5) * 20;
              s.score += pts;
              sfx.gift();
              spawnParticles(s.particles, b.x, b.y, ['#ffe066', '#f4a261', '#74c0fc', '#ffffff'], 16, 145);
              spawnPopup(
                s.popups,
                b.x,
                b.y - 16,
                b.royal ? `¡BALCÓN REAL +${pts}!` : `¡${g.kingName}! +${pts}`,
                '#ffe066',
              );
              onProgress?.(s.delivered);
              break;
            }
          }

          if (landed) {
            s.gifts.splice(i, 1);
            if (s.delivered >= goalGifts) {
              doneRef.current = true;
              const finalScore = s.score + Math.round(s.timeLeft * 12);
              const stars = s.timeLeft >= 16 ? 3 : s.timeLeft >= 6 ? 2 : 1;
              sfx.win();
              onComplete({
                won: true,
                score: finalScore,
                maxScore: 1600,
                stars,
                unit: 'puntos de ilusión',
                summary: `¡Melchor, Gaspar y Baltasar han llenado ${goalGifts} balcones de regalos y caramelos antes del alba!`,
              });
              return;
            }
            continue;
          }
          if (g.y < -16) {
            s.streak = 0;
            s.gifts.splice(i, 1);
          }
        }

        if (s.timeLeft <= 0) {
          doneRef.current = true;
          sfx.end();
          onComplete({
            won: s.delivered >= goalGifts,
            score: s.score,
            maxScore: 1600,
            stars: s.delivered >= Math.ceil(goalGifts * 0.65) ? 1 : 0,
            unit: 'puntos de ilusión',
            summary: `¡Amaneció el 6 de enero! Llegaste a ${s.delivered} de ${goalGifts} balcones. ¡Otra cabalgata!`,
          });
          return;
        }

        hudAcc += dt;
        if (hudAcc >= 0.1) {
          hudAcc = 0;
          setHud({
            delivered: s.delivered,
            score: s.score,
            timeLeft: Math.ceil(s.timeLeft),
            king: KINGS[s.activeKing].name,
          });
        }
      }

      if (s) render(s, started && !doneRef.current ? dt : 0);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [goalGifts, onComplete, onProgress, started]);

  function handlePointerMove(e) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    targetXRef.current = clamp(((e.clientX - rect.left) / rect.width) * W, 54, W - 54);
  }

  function handleCanvasClick(e) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      const aimX = clamp(((e.clientX - rect.left) / rect.width) * W, 54, W - 54);
      targetXRef.current = aimX;
      if (e.pointerType === 'touch' && stateRef.current) {
        stateRef.current.x = aimX;
      }
    }
    if (!started) {
      setStarted(true);
      return;
    }
    tossGift();
  }

  return (
    <div className="arcade-wrap">
      <div className="game-stats-line">
        <span>BALCONES <strong>{hud.delivered}/{goalGifts}</strong></span>
        <span>REY <strong>{hud.king}</strong></span>
        <span>PUNTOS <strong>{hud.score}</strong></span>
        <span>ALBA <strong className={hud.timeLeft <= 10 ? 'stat-urgent' : ''}>{hud.timeLeft}s</strong></span>
        <button type="button" onClick={reset} aria-label="Reiniciar cabalgata"><RotateCcw size={14} /></button>
      </div>

      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          onPointerMove={handlePointerMove}
          onPointerDown={handleCanvasClick}
          aria-label={game.title}
        />
        {!started && (
          <div className="canvas-overlay">
            <button type="button" className="canvas-start-btn" onClick={() => { sfx.gift(); setStarted(true); }}>
              <Play size={16} /> Iniciar la Cabalgata
            </button>
            <span>Mueve a los Reyes y pulsa clic o Espacio para lanzar regalos a los zapatos 👟</span>
          </div>
        )}
      </div>

      <div className="touch-controls" aria-label="Controles de los Reyes Magos">
        <button
          type="button"
          className="touch-btn"
          onPointerDown={() => { setStarted(true); targetXRef.current = null; keysRef.current.left = true; }}
          onPointerUp={() => { keysRef.current.left = false; }}
          onPointerCancel={() => { keysRef.current.left = false; }}
          onPointerLeave={() => { keysRef.current.left = false; }}
          aria-label="Mover a la izquierda"
        >
          <ChevronLeft size={18} /> Izq.
        </button>
        <button
          type="button"
          className="touch-btn touch-btn-accent"
          onClick={() => { setStarted(true); tossGift(); }}
          aria-label="Lanzar regalo al balcón"
        >
          <Gift size={16} /> Lanzar ({hud.king})
        </button>
        <button
          type="button"
          className="touch-btn"
          onPointerDown={() => { setStarted(true); targetXRef.current = null; keysRef.current.right = true; }}
          onPointerUp={() => { keysRef.current.right = false; }}
          onPointerCancel={() => { keysRef.current.right = false; }}
          onPointerLeave={() => { keysRef.current.right = false; }}
          aria-label="Mover a la derecha"
        >
          Der. <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
