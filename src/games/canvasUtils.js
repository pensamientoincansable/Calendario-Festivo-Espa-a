export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function isModalChromeTarget(event) {
  if (event?.defaultPrevented || event?.ctrlKey || event?.metaKey || event?.altKey) return true;
  const target = event?.target;
  if (typeof Element === 'undefined' || !(target instanceof Element)) return false;
  if (target.closest('[data-game-chrome], .game-top-actions, .game-stats-line, [inert], input, select, textarea, [contenteditable="true"]')) return true;
  // Espacio/Intro activan el botón enfocado de forma nativa, no dos acciones.
  return ['Space', 'Enter'].includes(event.code) && Boolean(target.closest('button, a[href]'));
}

const canvasMetrics = new WeakMap();

// ResizeObserver mide solo al cambiar el tamaño, nunca en cada fotograma.
export function observeCanvasSize(canvas) {
  const metrics = { width: canvas.clientWidth, height: canvas.clientHeight, ctx: null };
  canvasMetrics.set(canvas, metrics);
  const observer = new ResizeObserver(([entry]) => {
    metrics.width = entry.contentRect.width;
    metrics.height = entry.contentRect.height;
  });
  observer.observe(canvas);
  return () => {
    observer.disconnect();
    canvasMetrics.delete(canvas);
  };
}

export function setupHiDPICanvas(canvas, width, height) {
  if (!canvas || width <= 0 || height <= 0) return null;
  const metrics = canvasMetrics.get(canvas);
  const cssW = metrics?.width || width;
  const cssH = metrics?.height || height;
  // Nitidez a pantalla completa sin crear buffers enormes en móviles de alta densidad.
  const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2500000 / (cssW * cssH)));
  const targetW = Math.max(1, Math.round(cssW * dpr));
  const targetH = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = metrics?.ctx || canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;
  if (metrics) metrics.ctx = ctx;
  ctx.setTransform(targetW / width, 0, 0, targetH / height, 0, 0);
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
