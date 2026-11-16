// Direcciones en sentido horario: 0=arriba, 1=derecha, 2=abajo, 3=izquierda
const DIRS = [
  { dr: -1, dc: 0, bit: 1, opp: 4 },
  { dr: 0, dc: 1, bit: 2, opp: 8 },
  { dr: 1, dc: 0, bit: 4, opp: 1 },
  { dr: 0, dc: -1, bit: 8, opp: 2 },
];

export function rotateMask(mask, steps = 1) {
  let current = mask & 15;
  const turns = ((steps % 4) + 4) % 4;
  for (let i = 0; i < turns; i += 1) {
    current = ((current << 1) & 15) | ((current >> 3) & 1);
  }
  return current;
}

export function currentCellMask(cell) {
  return rotateMask(cell.baseMask, cell.rotation);
}

export function computePoweredGrid(grid) {
  const size = grid.length;
  const powered = Array.from({ length: size }, () => Array(size).fill(false));
  const queue = [];

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (grid[r][c].isSource) {
        powered[r][c] = true;
        queue.push({ r, c });
      }
    }
  }

  while (queue.length > 0) {
    const { r, c } = queue.shift();
    const mask = currentCellMask(grid[r][c]);
    for (const d of DIRS) {
      if (!(mask & d.bit)) continue;
      const nr = r + d.dr;
      const nc = c + d.dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size || powered[nr][nc]) continue;
      const neighborMask = currentCellMask(grid[nr][nc]);
      if (neighborMask & d.opp) {
        powered[nr][nc] = true;
        queue.push({ r: nr, c: nc });
      }
    }
  }

  let litCount = 0;
  const total = size * size;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (powered[r][c]) litCount += 1;
    }
  }

  return { powered, litCount, total, solved: litCount === total };
}

export function createLightsPuzzle(size = 4, rng = Math.random) {
  // Árbol generador aleatorio desde el centro para garantizar solución 100% conectada
  const masks = Array.from({ length: size }, () => Array(size).fill(0));
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const sourceR = Math.floor((size - 1) / 2);
  const sourceC = Math.floor(size / 2);

  visited[sourceR][sourceC] = true;
  const frontier = [{ r: sourceR, c: sourceC }];

  while (frontier.length > 0) {
    // Mezcla de Prim/DFS para ramificaciones atractivas con bombillas en las puntas
    const pickIndex = rng() < 0.65 ? frontier.length - 1 : Math.floor(rng() * frontier.length);
    const current = frontier[pickIndex];
    const available = DIRS.filter((d) => {
      const nr = current.r + d.dr;
      const nc = current.c + d.dc;
      return nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc];
    });

    if (available.length === 0) {
      frontier.splice(pickIndex, 1);
      continue;
    }

    const chosen = available[Math.floor(rng() * available.length)];
    const nr = current.r + chosen.dr;
    const nc = current.c + chosen.dc;
    masks[current.r][current.c] |= chosen.bit;
    masks[nr][nc] |= chosen.opp;
    visited[nr][nc] = true;
    frontier.push({ r: nr, c: nc });
  }

  const grid = masks.map((row, r) => row.map((mask, c) => {
    const degree = ((mask & 1) ? 1 : 0) + ((mask & 2) ? 1 : 0) + ((mask & 4) ? 1 : 0) + ((mask & 8) ? 1 : 0);
    const isFullCross = mask === 15;
    const rotation = isFullCross ? 0 : Math.floor(rng() * 4);
    return {
      r,
      c,
      baseMask: mask,
      rotation,
      isSource: r === sourceR && c === sourceC,
      isBulb: degree === 1 && !(r === sourceR && c === sourceC),
    };
  }));

  // Asegurar que al menos 5 piezas empiecen giradas para que siempre haya juego
  let rotatedCount = 0;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (currentCellMask(grid[r][c]) !== grid[r][c].baseMask) rotatedCount += 1;
    }
  }
  if (rotatedCount < 5 || computePoweredGrid(grid).solved) {
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c].baseMask !== 15 && (r + c) % 2 === 0) {
          grid[r][c].rotation = (grid[r][c].rotation + 1) % 4;
        }
      }
    }
  }

  return grid;
}
