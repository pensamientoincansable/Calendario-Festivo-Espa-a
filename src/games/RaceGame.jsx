import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, RotateCcw, Zap } from 'lucide-react';
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
const LANES = 4;
const ROAD_X = 96;
const ROAD_W = 308;
const LANE_W = ROAD_W / LANES;

const TRACK_PRESETS = {
  highway: {
    sideBg: '#6b8e55',
    sideAccent: '#52733f',
    surface: '#383d42',
    kerbA: '#d9534f',
    kerbB: '#f7f3e8',
    laneColor: 'rgba(255, 248, 224, 0.55)',
    playerColor: '#d9483b',
    playerStripe: '#fff4d8',
    vehicleKind: 'car',
    speedUnit: 'km/h',
    speedScale: 0.52,
    rivals: ['#3d7ea6', '#e09f3e', '#6c757d', '#5c946e'],
    tokenIcon: '🏅',
    hazardKind: 'cone',
    allowTrucks: true,
  },
  soapbox: {
    sideBg: '#c98b52',
    sideAccent: '#f2c96b',
    surface: '#4a4552',
    kerbA: '#e85d75',
    kerbB: '#ffd966',
    laneColor: 'rgba(255, 245, 220, 0.55)',
    playerColor: '#e85d75',
    playerStripe: '#ffe66d',
    vehicleKind: 'soapbox',
    speedUnit: 'km/h',
    speedScale: 0.48,
    rivals: ['#6c5ce7', '#00b894', '#fdcb6e', '#0984e3'],
    tokenIcon: '🎭',
    hazardKind: 'cone',
  },
  rally: {
    sideBg: '#7a8462',
    sideAccent: '#5d6649',
    surface: '#3d3f47',
    kerbA: '#9e3a5c',
    kerbB: '#faf5ea',
    laneColor: 'rgba(255, 248, 230, 0.52)',
    playerColor: '#8e3b68',
    playerStripe: '#ffd98a',
    vehicleKind: 'car',
    speedUnit: 'km/h',
    speedScale: 0.55,
    rivals: ['#d9534f', '#f4f1ea', '#4a7c9b', '#d99b38'],
    tokenIcon: '⭐',
    hazardKind: 'cone',
  },
  sea: {
    sideBg: '#d8be8b',
    sideAccent: '#6ea36a',
    surface: '#1d6f8a',
    kerbA: '#64c2d1',
    kerbB: '#e9fbff',
    laneColor: 'rgba(215, 249, 255, 0.34)',
    playerColor: '#d96b43',
    playerStripe: '#fff7e6',
    vehicleKind: 'boat',
    speedUnit: 'nudos',
    speedScale: 0.14,
    rivals: ['#f4d35e', '#ee964b', '#faf0ca', '#52b788'],
    tokenIcon: '🐚',
    hazardKind: 'buoy',
  },
  bike: {
    sideBg: '#588157',
    sideAccent: '#3a5a40',
    surface: '#6b645c',
    kerbA: '#dad7cd',
    kerbB: '#a3b18a',
    laneColor: 'rgba(255, 250, 232, 0.45)',
    playerColor: '#e09f3e',
    playerStripe: '#ffffff',
    vehicleKind: 'bike',
    speedUnit: 'km/h',
    speedScale: 0.24,
    rivals: ['#457b9d', '#e63946', '#2a9d8f', '#f4a261'],
    tokenIcon: '🐚',
    hazardKind: 'cone',
  },
};

function laneCenter(lane) {
  return ROAD_X + LANE_W * (lane + 0.5);
}

function drawCar(ctx, x, y, bodyColor, stripeColor, isPlayer, tilt = 0, turbo = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  if (turbo) {
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath();
    ctx.moveTo(-7, 24);
    ctx.lineTo(0, 38 + Math.random() * 10);
    ctx.lineTo(7, 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.moveTo(-4, 24);
    ctx.lineTo(0, 32 + Math.random() * 6);
    ctx.lineTo(4, 24);
    ctx.closePath();
    ctx.fill();
  }

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(ctx, -14, -21, 32, 48, 9);
  ctx.fill();

  // Ruedas
  ctx.fillStyle = '#1b1d1f';
  roundRect(ctx, -18, -17, 5, 12, 2);
  ctx.fill();
  roundRect(ctx, 13, -17, 5, 12, 2);
  ctx.fill();
  roundRect(ctx, -18, 6, 5, 12, 2);
  ctx.fill();
  roundRect(ctx, 13, 6, 5, 12, 2);
  ctx.fill();

  // Carrocería
  ctx.fillStyle = bodyColor;
  roundRect(ctx, -15, -24, 30, 48, 9);
  ctx.fill();

  // Franja de competición
  if (stripeColor) {
    ctx.fillStyle = stripeColor;
    ctx.fillRect(-3, -23, 6, 46);
  }

  // Parabrisas y techo
  ctx.fillStyle = '#1f2d3a';
  roundRect(ctx, -11, -11, 22, 11, 4);
  ctx.fill();
  ctx.fillStyle = bodyColor;
  roundRect(ctx, -10, -2, 20, 13, 4);
  ctx.fill();
  ctx.fillStyle = '#253646';
  roundRect(ctx, -9, 11, 18, 6, 3);
  ctx.fill();

  // Faros delanteros
  ctx.fillStyle = isPlayer ? '#fff3b0' : '#ffe8a3';
  ctx.fillRect(-12, -24, 6, 3);
  ctx.fillRect(6, -24, 6, 3);

  ctx.restore();
}

function drawTruck(ctx, x, y, cabColor) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(ctx, -15, -26, 34, 56, 7);
  ctx.fill();

  // Remolque blanco engalanado
  ctx.fillStyle = '#f8f5ee';
  roundRect(ctx, -15, -8, 30, 36, 5);
  ctx.fill();
  ctx.fillStyle = cabColor;
  ctx.fillRect(-13, 6, 26, 5);

  // Cabina delantera
  ctx.fillStyle = cabColor;
  roundRect(ctx, -14, -27, 28, 18, 6);
  ctx.fill();
  ctx.fillStyle = '#20303f';
  roundRect(ctx, -11, -22, 22, 8, 3);
  ctx.fill();

  // Faros
  ctx.fillStyle = '#fff3b0';
  ctx.fillRect(-11, -27, 5, 2.5);
  ctx.fillRect(6, -27, 5, 2.5);

  ctx.restore();
}

function drawBoat(ctx, x, y, bodyColor, stripeColor, tilt = 0, turbo = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  // Estela de espuma
  ctx.strokeStyle = turbo ? 'rgba(255,255,255,0.85)' : 'rgba(230,252,255,0.55)';
  ctx.lineWidth = turbo ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(-6, 22);
  ctx.lineTo(-14, 38 + (turbo ? 10 : 0));
  ctx.moveTo(6, 22);
  ctx.lineTo(14, 38 + (turbo ? 10 : 0));
  ctx.stroke();

  // Casco
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(0, -27);
  ctx.quadraticCurveTo(16, -6, 13, 22);
  ctx.lineTo(-13, 22);
  ctx.quadraticCurveTo(-16, -6, 0, -27);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = stripeColor || '#fffdf5';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cubierta y vela latina
  ctx.fillStyle = '#f4e3c1';
  ctx.beginPath();
  ctx.ellipse(0, 2, 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fffdf8';
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(13, -2, 2, 11);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawBike(ctx, x, y, bodyColor, tilt = 0, turbo = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  if (turbo) {
    ctx.strokeStyle = '#ffe66d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-5, 22);
    ctx.lineTo(-5, 36);
    ctx.moveTo(5, 22);
    ctx.lineTo(5, 36);
    ctx.stroke();
  }

  // Ruedas
  ctx.fillStyle = '#1d1f21';
  roundRect(ctx, -3, -24, 6, 14, 3);
  ctx.fill();
  roundRect(ctx, -3, 10, 6, 14, 3);
  ctx.fill();

  // Manillar
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, -12);
  ctx.lineTo(12, -12);
  ctx.stroke();

  // Ciclista (maillot + casco)
  ctx.fillStyle = bodyColor;
  roundRect(ctx, -10, -8, 20, 18, 8);
  ctx.fill();
  ctx.fillStyle = '#fffdf5';
  ctx.beginPath();
  ctx.arc(0, -8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, -9, 5, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

export default function RaceGame({ game, onProgress, onComplete }) {
  const preset = TRACK_PRESETS[game.track ?? 'highway'] ?? TRACK_PRESETS.highway;
  const goalDistance = game.distance ?? 2400;
  const tokenIcon = game.tokenIcon ?? preset.tokenIcon;

  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({
    pct: 0,
    speed: 0,
    shields: 3,
    nitro: 100,
    score: 0,
  });

  const keysRef = useRef({ left: false, right: false, boost: false });
  const draggingRef = useRef(false);
  const targetXRef = useRef(null);
  const stateRef = useRef(null);
  const doneRef = useRef(false);

  const initState = useCallback(() => ({
    playerX: laneCenter(1.5),
    vx: 0,
    speed: 220,
    distance: 0,
    scroll: 0,
    shields: 3,
    invuln: 0,
    spinTimer: 0,
    nitro: 100,
    turboActive: false,
    padBoost: 0,
    score: 0,
    tokens: 0,
    overtakes: 0,
    entities: [],
    particles: [],
    popups: [],
    spawnTimer: 0.45,
    scenery: Array.from({ length: 10 }, (_, idx) => ({
      y: idx * 34,
      side: idx % 2 === 0 ? -1 : 1,
      offset: 18 + ((idx * 19) % 42),
      size: 10 + (idx % 3) * 4,
    })),
  }), []);

  const reset = useCallback(() => {
    doneRef.current = false;
    keysRef.current = { left: false, right: false, boost: false };
    draggingRef.current = false;
    stateRef.current = initState();
    targetXRef.current = null;
    setHud({ pct: 0, speed: 0, shields: 3, nitro: 100, score: 0 });
    onProgress?.(0);
    setStarted(true);
  }, [initState, onProgress]);

  useEffect(() => {
    stateRef.current = initState();
  }, [initState]);

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
      } else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        if (!started) {
          setStarted(true);
          return;
        }
        if (!keysRef.current.boost && stateRef.current?.nitro > 18) {
          sfx.boost();
        }
        keysRef.current.boost = true;
      } else if (e.code === 'Enter' && !started && !e.repeat) {
        e.preventDefault();
        setStarted(true);
      }
    }
    function onKeyUp(e) {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) keysRef.current.boost = false;
    }
    function clearHeld() {
      keysRef.current = { left: false, right: false, boost: false };
      draggingRef.current = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
    };
  }, [started]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let rafId = 0;
    let last = performance.now();
    let hudTimer = 0;

    const render = (s, fxDt) => {
      const ctx = setupHiDPICanvas(canvas, W, H);
      if (!ctx) return;

      // Márgenes del circuito o costa
      ctx.fillStyle = preset.sideBg;
      ctx.fillRect(0, 0, W, H);

      // Árboles / público / rocas laterales
      for (const item of s.scenery) {
        const sx = item.side < 0 ? item.offset : W - item.offset;
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.beginPath();
        ctx.arc(sx + 3, item.y + 3, item.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = preset.sideAccent;
        ctx.beginPath();
        ctx.arc(sx, item.y, item.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pianos laterales rojiblancos o espuma costera (sin parpadeo de paridad)
      const kerbH = 22;
      const offset = s.scroll % (kerbH * 2);
      const count = Math.ceil(H / kerbH) + 3;
      for (let i = -2; i < count; i += 1) {
        const ky = i * kerbH + offset;
        ctx.fillStyle = ((i % 2) + 2) % 2 === 0 ? preset.kerbA : preset.kerbB;
        ctx.fillRect(ROAD_X - 9, ky, 9, kerbH + 0.5);
        ctx.fillRect(ROAD_X + ROAD_W, ky, 9, kerbH + 0.5);
      }

      // Asfalto o canal de regata
      ctx.fillStyle = preset.surface;
      ctx.fillRect(ROAD_X, 0, ROAD_W, H);

      // Líneas de carril
      ctx.strokeStyle = preset.laneColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([18, 18]);
      ctx.lineDashOffset = -(s.scroll % 36);
      for (let lane = 1; lane < LANES; lane += 1) {
        const lx = ROAD_X + lane * LANE_W;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, H);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Arco de META cuando está cerca
      const remaining = goalDistance - s.distance;
      if (remaining < 320) {
        const finishY = 248 - remaining;
        const sq = 11;
        for (let col = 0; col < Math.ceil(ROAD_W / sq); col += 1) {
          for (let row = 0; row < 2; row += 1) {
            ctx.fillStyle = (col + row) % 2 === 0 ? '#fffdf8' : '#1f2421';
            ctx.fillRect(ROAD_X + col * sq, finishY + row * sq, Math.min(sq, ROAD_W - col * sq), sq);
          }
        }
        ctx.fillStyle = '#cf634d';
        roundRect(ctx, ROAD_X + 86, finishY - 20, ROAD_W - 172, 18, 5);
        ctx.fill();
        ctx.fillStyle = '#fffdf8';
        ctx.font = '800 10px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★ META FESTIVA ★', ROAD_X + ROAD_W / 2, finishY - 7);
      }

      // Entidades en pista (turbo pads primero, luego objetos y rivales)
      for (const ent of s.entities) {
        if (ent.kind === 'pad') {
          ctx.save();
          ctx.translate(ent.x, ent.y);
          ctx.fillStyle = 'rgba(56, 217, 169, 0.25)';
          roundRect(ctx, -18, -22, 36, 44, 6);
          ctx.fill();
          ctx.strokeStyle = '#63e6be';
          ctx.lineWidth = 3;
          for (const dy of [-8, 3, 14]) {
            ctx.beginPath();
            ctx.moveTo(-11, dy + 4);
            ctx.lineTo(0, dy - 5);
            ctx.lineTo(11, dy + 4);
            ctx.stroke();
          }
          ctx.restore();
        } else if (ent.kind === 'token' || ent.kind === 'nitro') {
          ctx.save();
          ctx.translate(ent.x, ent.y);
          ctx.fillStyle = ent.kind === 'nitro' ? 'rgba(77, 171, 247, 0.34)' : 'rgba(255, 212, 59, 0.32)';
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = ent.kind === 'nitro' ? '#74c0fc' : '#ffe066';
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ent.kind === 'nitro' ? '⚡' : tokenIcon, 0, 1);
          ctx.restore();
        } else if (ent.kind === 'hazard') {
          ctx.save();
          ctx.translate(ent.x, ent.y);
          if (preset.hazardKind === 'buoy') {
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fffdf8';
            ctx.lineWidth = 3;
            ctx.stroke();
          } else {
            ctx.fillStyle = '#f76707';
            ctx.beginPath();
            ctx.moveTo(0, -13);
            ctx.lineTo(12, 11);
            ctx.lineTo(-12, 11);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fffdf8';
            ctx.fillRect(-7, -1, 14, 4);
          }
          ctx.restore();
        } else if (ent.kind === 'rival') {
          if (preset.vehicleKind === 'boat') {
            drawBoat(ctx, ent.x, ent.y, ent.color, '#ffffff', 0, false);
          } else if (preset.vehicleKind === 'bike') {
            drawBike(ctx, ent.x, ent.y, ent.color, 0, false);
          } else if (ent.isTruck) {
            drawTruck(ctx, ent.x, ent.y, ent.color);
          } else {
            drawCar(ctx, ent.x, ent.y, ent.color, null, false, 0, false);
          }
        }
      }

      // Vehículo del jugador
      const playerY = 248;
      const blink = s.invuln > 0 && Math.floor(s.invuln * 14) % 2 === 0;
      if (!blink) {
        const tilt = s.spinTimer > 0
          ? Math.sin(s.spinTimer * 26) * 0.45
          : clamp(s.vx / 480, -0.22, 0.22);
        const boosting = s.turboActive || s.padBoost > 0;
        if (preset.vehicleKind === 'boat') {
          drawBoat(ctx, s.playerX, playerY, preset.playerColor, preset.playerStripe, tilt, boosting);
        } else if (preset.vehicleKind === 'bike') {
          drawBike(ctx, s.playerX, playerY, preset.playerColor, tilt, boosting);
        } else {
          drawCar(ctx, s.playerX, playerY, preset.playerColor, preset.playerStripe, true, tilt, boosting);
        }
      }

      // Líneas de velocidad cuando va en turbo
      if (s.turboActive || s.padBoost > 0) {
        ctx.strokeStyle = 'rgba(255, 250, 220, 0.35)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i += 1) {
          const lx = i < 3 ? 18 + i * 24 : W - 18 - (i - 3) * 24;
          const ly = ((s.scroll * 1.6 + i * 67) % H);
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx, ly + 28);
          ctx.stroke();
        }
      }

      updateAndDrawParticles(ctx, s.particles, fxDt, 40);
      updateAndDrawPopups(ctx, s.popups, fxDt);

      // Barra de progreso hacia la meta en la parte superior del lienzo
      ctx.fillStyle = 'rgba(24, 32, 27, 0.72)';
      roundRect(ctx, 14, 12, W - 28, 22, 11);
      ctx.fill();
      const ratio = clamp(s.distance / goalDistance, 0, 1);
      ctx.fillStyle = '#f2c572';
      roundRect(ctx, 18, 16, Math.max(14, (W - 36) * ratio), 14, 7);
      ctx.fill();
      ctx.font = '700 9px "DM Sans", sans-serif';
      ctx.fillStyle = '#fffdf8';
      ctx.textAlign = 'right';
      ctx.fillText('🏁 META', W - 22, 26);
    };

    const tick = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (started && !doneRef.current && s) {
        // Turbo y velocidad
        const wantsBoost = keysRef.current.boost && s.nitro > 4;
        s.turboActive = wantsBoost;
        if (wantsBoost) {
          s.nitro = Math.max(0, s.nitro - 42 * dt);
        } else {
          s.nitro = Math.min(100, s.nitro + 12 * dt);
        }
        if (s.padBoost > 0) s.padBoost = Math.max(0, s.padBoost - dt);
        if (s.invuln > 0) s.invuln = Math.max(0, s.invuln - dt);
        if (s.spinTimer > 0) s.spinTimer = Math.max(0, s.spinTimer - dt);

        const targetSpeed = 245 + (wantsBoost ? 140 : 0) + (s.padBoost > 0 ? 155 : 0) - (s.spinTimer > 0 ? 90 : 0);
        s.speed += (targetSpeed - s.speed) * Math.min(1, dt * 6);
        s.distance += s.speed * dt * 0.36;
        s.scroll += s.speed * dt;

        // Dirección lateral suave
        const lateralSpeed = 270;
        let dir = 0;
        if (keysRef.current.left) dir -= 1;
        if (keysRef.current.right) dir += 1;

        if (dir !== 0) {
          s.vx = dir * lateralSpeed;
        } else if (targetXRef.current != null) {
          const diff = targetXRef.current - s.playerX;
          s.vx = clamp(diff * 9, -lateralSpeed * 1.15, lateralSpeed * 1.15);
        } else {
          s.vx *= 0.8;
        }
        s.playerX = clamp(s.playerX + s.vx * dt, ROAD_X + 20, ROAD_X + ROAD_W - 20);

        for (const item of s.scenery) {
          item.y += s.speed * dt;
          if (item.y > H + 20) item.y -= H + 40;
        }

        // Generación justa de rivales, turbos y medallas (sin solapamientos y siempre con paso libre)
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0 && goalDistance - s.distance > 180) {
          s.spawnTimer = clamp(0.62 - (s.distance / goalDistance) * 0.14, 0.44, 0.68);
          const busyLanes = new Set(
            s.entities.filter((e) => e.y < 82).map((e) => e.lane),
          );
          const freeLanes = [0, 1, 2, 3].filter((l) => !busyLanes.has(l));
          if (freeLanes.length > 0) {
            const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
            const blockersNearTop = s.entities.filter(
              (e) => (e.kind === 'rival' || e.kind === 'hazard') && e.y < 105,
            ).length;
            const roll = Math.random();
            if (roll < 0.44 && blockersNearTop < 2) {
              s.entities.push({
                kind: 'rival',
                lane,
                x: laneCenter(lane),
                y: -36,
                speed: 110 + Math.random() * 35,
                color: preset.rivals[Math.floor(Math.random() * preset.rivals.length)],
                isTruck: Boolean(preset.allowTrucks) && Math.random() < 0.35,
                passed: false,
              });
            } else if (roll < 0.62 && blockersNearTop < 2) {
              s.entities.push({ kind: 'hazard', lane, x: laneCenter(lane), y: -24 });
            } else if (roll < 0.82) {
              s.entities.push({ kind: 'token', lane, x: laneCenter(lane), y: -24 });
            } else if (roll < 0.92) {
              s.entities.push({ kind: 'pad', lane, x: laneCenter(lane), y: -26 });
            } else {
              s.entities.push({ kind: 'nitro', lane, x: laneCenter(lane), y: -24 });
            }
          }
        }

        const playerY = 248;
        for (let i = s.entities.length - 1; i >= 0; i -= 1) {
          const ent = s.entities[i];
          if (ent.kind === 'rival') {
            // Mantener distancia de seguridad entre rivales del mismo carril
            const ahead = s.entities.find(
              (other) => other !== ent && other.lane === ent.lane && other.y > ent.y && other.y - ent.y < 68,
            );
            if (ahead && ahead.kind === 'rival' && ent.speed < ahead.speed) {
              ent.speed = ahead.speed;
            }
          }
          const relSpeed = ent.kind === 'rival' ? s.speed - ent.speed : s.speed;
          ent.y += relSpeed * dt;

          const dx = Math.abs(ent.x - s.playerX);
          const dy = Math.abs(ent.y - playerY);

          if (ent.kind === 'token' && dx < 28 && dy < 30) {
            s.tokens += 1;
            s.score += 100;
            sfx.collect(s.tokens);
            spawnParticles(s.particles, ent.x, ent.y, ['#ffe066', '#ffa94d', '#fffdf8'], 12);
            spawnPopup(s.popups, ent.x, ent.y - 10, '+100', '#ffe066');
            s.entities.splice(i, 1);
            continue;
          }
          if (ent.kind === 'nitro' && dx < 28 && dy < 30) {
            s.nitro = Math.min(100, s.nitro + 45);
            s.score += 60;
            sfx.collect(3);
            spawnPopup(s.popups, ent.x, ent.y - 10, '+TURBO', '#74c0fc');
            s.entities.splice(i, 1);
            continue;
          }
          if (ent.kind === 'pad' && dx < 26 && dy < 30 && s.padBoost < 0.6) {
            s.padBoost = 1.25;
            s.score += 75;
            sfx.boost();
            spawnPopup(s.popups, s.playerX, playerY - 26, '¡ACELERÓN!', '#63e6be');
            s.entities.splice(i, 1);
            continue;
          }
          if ((ent.kind === 'rival' || ent.kind === 'hazard') && s.invuln <= 0) {
            const hitW = ent.kind === 'rival' ? 24 : 21;
            const hitH = ent.kind === 'rival' ? 38 : 26;
            if (dx < hitW && dy < hitH) {
              s.shields -= 1;
              s.invuln = 1.4;
              s.spinTimer = 0.45;
              s.speed = 135;
              sfx.hit();
              spawnParticles(s.particles, s.playerX, playerY - 12, ['#ff8787', '#ffd43b', '#ffffff'], 16);
              spawnPopup(s.popups, s.playerX, playerY - 24, '¡ROCE!', '#ffa8a8');
              s.entities.splice(i, 1);
              if (s.shields <= 0) {
                doneRef.current = true;
                sfx.end();
                onComplete({
                  won: false,
                  score: s.score + Math.round(s.distance * 0.25),
                  maxScore: 1200,
                  stars: s.distance > goalDistance * 0.6 ? 1 : 0,
                  unit: 'puntos de carrera',
                  summary: `Recorriste el ${Math.round((s.distance / goalDistance) * 100)}% del circuito. ¡Esquiva el tráfico y aprovecha el turbo!`,
                });
                return;
              }
              continue;
            }
          }
          if (ent.kind === 'rival' && !ent.passed && ent.y > playerY + 32) {
            ent.passed = true;
            s.overtakes += 1;
            const nearMiss = dx < 54;
            const bonus = nearMiss ? 55 : 25;
            s.score += bonus;
            if (nearMiss) spawnPopup(s.popups, s.playerX, playerY - 28, '¡ADELANTAMIENTO! +55', '#fff3bf');
          }
          if (ent.y > H + 60) s.entities.splice(i, 1);
        }

        if (s.distance >= goalDistance) {
          doneRef.current = true;
          const finalScore = s.score + Math.round(goalDistance * 0.25) + s.shields * 150;
          const stars = s.shields === 3 && s.tokens >= 4 ? 3 : s.shields >= 2 ? 2 : 1;
          sfx.win();
          onComplete({
            won: true,
            score: finalScore,
            maxScore: 1400,
            stars,
            unit: 'puntos de carrera',
            summary: `¡Bandera a cuadros! Adelantaste a ${s.overtakes} rivales y recogiste ${s.tokens} ${tokenIcon} rumbo a la meta.`,
          });
          return;
        }

        hudTimer += dt;
        if (hudTimer >= 0.08) {
          hudTimer = 0;
          const displayScore = s.score + Math.round(s.distance * 0.25);
          setHud({
            pct: Math.min(100, Math.round((s.distance / goalDistance) * 100)),
            speed: Math.round(s.speed * preset.speedScale),
            shields: s.shields,
            nitro: Math.round(s.nitro),
            score: displayScore,
          });
          onProgress?.(displayScore);
        }
      }

      if (s) render(s, started && !doneRef.current ? dt : 0);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [goalDistance, onComplete, onProgress, preset, started, tokenIcon]);

  function handleCanvasPointer(event) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const relX = ((event.clientX - rect.left) / rect.width) * W;
    targetXRef.current = clamp(relX, ROAD_X + 20, ROAD_X + ROAD_W - 20);
    if (!started) setStarted(true);
  }

  return (
    <div className="arcade-wrap">
      <div className="game-stats-line">
        <span>VEL. <strong>{hud.speed} {preset.speedUnit}</strong></span>
        <span>PUNTOS <strong>{hud.score}</strong></span>
        <span>TURBO <strong>{hud.nitro}%</strong></span>
        <span>ESCUDOS <strong>{'🛡️'.repeat(hud.shields)}</strong></span>
        <button type="button" onClick={reset} aria-label="Reiniciar carrera"><RotateCcw size={14} /></button>
      </div>

      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          onPointerDown={(e) => { draggingRef.current = true; handleCanvasPointer(e); }}
          onPointerMove={(e) => { if (draggingRef.current || e.buttons > 0) handleCanvasPointer(e); }}
          onPointerUp={() => { draggingRef.current = false; }}
          onPointerCancel={() => { draggingRef.current = false; }}
          onPointerLeave={() => { draggingRef.current = false; }}
          aria-label={game.title}
        />
        {!started && (
          <div className="canvas-overlay">
            <button type="button" className="canvas-start-btn" onClick={() => { sfx.boost(); setStarted(true); }}>
              <Play size={16} /> Arrancar carrera
            </button>
            <span>Flechas ← → o arrastra para girar · Espacio para TURBO</span>
          </div>
        )}
      </div>

      <div className="touch-controls" aria-label="Controles de carrera">
        <button
          type="button"
          className="touch-btn"
          onPointerDown={() => { setStarted(true); targetXRef.current = null; keysRef.current.left = true; }}
          onPointerUp={() => { keysRef.current.left = false; }}
          onPointerCancel={() => { keysRef.current.left = false; }}
          onPointerLeave={() => { keysRef.current.left = false; }}
          aria-label="Girar a la izquierda"
        >
          <ChevronLeft size={18} /> Izq.
        </button>
        <button
          type="button"
          className="touch-btn touch-btn-accent"
          onPointerDown={() => { setStarted(true); if (stateRef.current?.nitro > 15) sfx.boost(); keysRef.current.boost = true; }}
          onPointerUp={() => { keysRef.current.boost = false; }}
          onPointerCancel={() => { keysRef.current.boost = false; }}
          onPointerLeave={() => { keysRef.current.boost = false; }}
          aria-label="Activar turbo"
        >
          <Zap size={16} /> Turbo
        </button>
        <button
          type="button"
          className="touch-btn"
          onPointerDown={() => { setStarted(true); targetXRef.current = null; keysRef.current.right = true; }}
          onPointerUp={() => { keysRef.current.right = false; }}
          onPointerCancel={() => { keysRef.current.right = false; }}
          onPointerLeave={() => { keysRef.current.right = false; }}
          aria-label="Girar a la derecha"
        >
          Der. <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
