export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function isModalChromeTarget(event) {
  const target = event?.target;
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('.game-top-actions, .game-stats-line'));
}

export function setupHiDPICanvas(canvas, width, height) {
  if (!canvas || width <= 0 || height <= 0) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(width * dpr);
  const targetH = Math.round(height * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function roundRect(ctx, x, y, w, h, r) {
  const safeW = Math.max(0, w);
  const safeH = Math.max(0, h);
  const radius = Math.max(0, Math.min(r, safeW / 2, safeH / 2));
  ctx.beginPath();
  if (safeW === 0 || safeH === 0) return;
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + safeW, y, x + safeW, y + safeH, radius);
  ctx.arcTo(x + safeW, y + safeH, x, y + safeH, radius);
  ctx.arcTo(x, y + safeH, x, y, radius);
  ctx.arcTo(x, y, x + safeW, y, radius);
  ctx.closePath();
}

export function spawnParticles(list, x, y, colors, count = 14, speed = 130) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
    const vel = speed * (0.45 + Math.random() * 0.75);
    const life = 0.45 + Math.random() * 0.35;
    list.push({
      x,
      y,
      vx: Math.cos(angle) * vel,
      vy: Math.sin(angle) * vel - 25,
      size: 2.2 + Math.random() * 3.4,
      color: colors[i % colors.length],
      life,
      maxLife: life,
    });
  }
}

export function updateAndDrawParticles(ctx, list, dt, gravity = 160) {
  const safeDt = Math.max(0, dt);
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const p = list[i];
    if (safeDt > 0) {
      p.life -= safeDt;
      if (p.life <= 0) {
        list.splice(i, 1);
        continue;
      }
      p.vy += gravity * safeDt;
      p.x += p.vx * safeDt;
      p.y += p.vy * safeDt;
    }
    ctx.save();
    ctx.globalAlpha = clamp(p.life / (p.maxLife || 0.75), 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function spawnPopup(list, x, y, text, color = '#fff5cc') {
  list.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
}

export function updateAndDrawPopups(ctx, list, dt) {
  const safeDt = Math.max(0, dt);
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const item = list[i];
    if (safeDt > 0) {
      item.life -= safeDt;
      if (item.life <= 0) {
        list.splice(i, 1);
        continue;
      }
      item.y -= 34 * safeDt;
    }
    ctx.save();
    ctx.globalAlpha = clamp((item.life / (item.maxLife || 0.9)) * 1.3, 0, 1);
    ctx.font = '700 13px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(20, 28, 22, 0.72)';
    ctx.lineWidth = 3;
    ctx.strokeText(item.text, item.x, item.y);
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }
}
