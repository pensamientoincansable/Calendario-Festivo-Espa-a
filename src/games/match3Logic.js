let nextCellId = 1;

function makeCell(kind, special = null) {
  nextCellId += 1;
  return { id: nextCellId, kind, special };
}

export function areAdjacent(a, b) {
  if (!a || !b) return false;
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function findMatchGroups(board) {
  const size = board.length;
  const horizontal = [];
  const vertical = [];

  for (let r = 0; r < size; r += 1) {
    let c = 0;
    while (c < size) {
      const cell = board[r][c];
      if (!cell || cell.special === 'bomb') {
        c += 1;
        continue;
      }
      let end = c + 1;
      while (end < size && board[r][end] && board[r][end].special !== 'bomb' && board[r][end].kind === cell.kind) {
        end += 1;
      }
      const len = end - c;
      if (len >= 3) {
        const cells = [];
        for (let col = c; col < end; col += 1) cells.push({ r, c: col });
        horizontal.push({ kind: cell.kind, orientation: 'row', cells });
      }
      c = end;
    }
  }

  for (let c = 0; c < size; c += 1) {
    let r = 0;
    while (r < size) {
      const cell = board[r][c];
      if (!cell || cell.special === 'bomb') {
        r += 1;
        continue;
      }
      let end = r + 1;
      while (end < size && board[end][c] && board[end][c].special !== 'bomb' && board[end][c].kind === cell.kind) {
        end += 1;
      }
      const len = end - r;
      if (len >= 3) {
        const cells = [];
        for (let row = r; row < end; row += 1) cells.push({ r: row, c });
        vertical.push({ kind: cell.kind, orientation: 'col', cells });
      }
      r = end;
    }
  }

  // Combinar grupos en L o T del mismo tipo que comparten casilla
  const all = [...horizontal, ...vertical];
  const merged = [];
  const used = new Set();

  for (let i = 0; i < all.length; i += 1) {
    if (used.has(i)) continue;
    const base = all[i];
    const coords = new Map(base.cells.map((p) => [`${p.r},${p.c}`, p]));
    let hasRow = base.orientation === 'row';
    let hasCol = base.orientation === 'col';
    let maxRun = base.cells.length;
    used.add(i);

    let changed = true;
    while (changed) {
      changed = false;
      for (let j = i + 1; j < all.length; j += 1) {
        if (used.has(j) || all[j].kind !== base.kind) continue;
        const intersects = all[j].cells.some((p) => coords.has(`${p.r},${p.c}`));
        if (intersects) {
          all[j].cells.forEach((p) => coords.set(`${p.r},${p.c}`, p));
          if (all[j].orientation === 'row') hasRow = true;
          if (all[j].orientation === 'col') hasCol = true;
          maxRun = Math.max(maxRun, all[j].cells.length);
          used.add(j);
          changed = true;
        }
      }
    }

    let spawnSpecial = null;
    if (maxRun >= 5 || (hasRow && hasCol)) {
      spawnSpecial = 'bomb';
    } else if (maxRun === 4) {
      spawnSpecial = hasRow ? 'col' : 'row';
    }

    merged.push({
      kind: base.kind,
      cells: Array.from(coords.values()),
      spawnSpecial,
    });
  }

  return merged;
}

export function findValidMove(board) {
  const size = board.length;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const cell = board[r][c];
      if (!cell) continue;
      const neighbors = [
        { r, c: c + 1 },
        { r: r + 1, c },
      ];
      for (const n of neighbors) {
        if (n.r >= size || n.c >= size || !board[n.r][n.c]) continue;
        if (cell.special === 'bomb' || board[n.r][n.c].special === 'bomb') {
          return [{ r, c }, n];
        }
        if (cell.special && board[n.r][n.c].special) {
          return [{ r, c }, n];
        }
        if (cell.kind === board[n.r][n.c].kind) continue;
        const test = cloneBoard(board);
        [test[r][c], test[n.r][n.c]] = [test[n.r][n.c], test[r][c]];
        if (findMatchGroups(test).length > 0) {
          return [{ r, c }, n];
        }
      }
    }
  }
  return null;
}

export function createMatch3Board(size = 7, kindCount = 6, rng = Math.random) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const board = Array.from({ length: size }, () => Array(size).fill(null));
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const forbidden = new Set();
        if (c >= 2 && board[r][c - 1].kind === board[r][c - 2].kind) {
          forbidden.add(board[r][c - 1].kind);
        }
        if (r >= 2 && board[r - 1][c].kind === board[r - 2][c].kind) {
          forbidden.add(board[r - 1][c].kind);
        }
        const candidates = [];
        for (let k = 0; k < kindCount; k += 1) {
          if (!forbidden.has(k)) candidates.push(k);
        }
        const picked = candidates[Math.floor(rng() * candidates.length)];
        board[r][c] = makeCell(picked, null);
      }
    }
    if (findValidMove(board)) return board;
  }
  // Tablero de respaldo garantizado con jugada válida
  const fallback = Array.from({ length: size }, (_, r) => (
    Array.from({ length: size }, (_, c) => makeCell((r * 2 + c) % kindCount, null))
  ));
  fallback[0][0] = makeCell(0);
  fallback[0][1] = makeCell(0);
  fallback[1][2] = makeCell(0);
  fallback[0][2] = makeCell(1);
  return fallback;
}

function expandSpecialClears(board, initialSet, kindCount = 6, rng = Math.random) {
  const size = board.length;
  const clearSet = new Set(initialSet);
  const queue = Array.from(initialSet);
  const processed = new Set();
  let triggeredSpecial = false;

  while (queue.length > 0) {
    const key = queue.shift();
    if (processed.has(key)) continue;
    processed.add(key);
    const [r, c] = key.split(',').map(Number);
    const cell = board[r]?.[c];
    if (!cell || !cell.special) continue;

    if (cell.special === 'row') {
      triggeredSpecial = true;
      for (let col = 0; col < size; col += 1) {
        const k = `${r},${col}`;
        if (!clearSet.has(k)) {
          clearSet.add(k);
          queue.push(k);
        }
      }
    } else if (cell.special === 'col') {
      triggeredSpecial = true;
      for (let row = 0; row < size; row += 1) {
        const k = `${row},${c}`;
        if (!clearSet.has(k)) {
          clearSet.add(k);
          queue.push(k);
        }
      }
    } else if (cell.special === 'bomb') {
      triggeredSpecial = true;
      const targetKind = Math.floor(rng() * kindCount);
      for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
          if (board[row][col]?.kind === targetKind) {
            const k = `${row},${col}`;
            if (!clearSet.has(k)) {
              clearSet.add(k);
              queue.push(k);
            }
          }
        }
      }
    }
  }

  return { clearSet, triggeredSpecial };
}

export function resolveBoardStep(board, preferredPositions = [], kindCount = 6, rng = Math.random) {
  const groups = findMatchGroups(board);
  if (groups.length === 0) return null;

  const rawKeys = new Set();
  const spawns = [];

  for (const group of groups) {
    group.cells.forEach((p) => rawKeys.add(`${p.r},${p.c}`));
    if (group.spawnSpecial) {
      const preferred = preferredPositions.find((pos) => (
        group.cells.some((p) => p.r === pos.r && p.c === pos.c)
      ));
      const anchor = preferred ?? group.cells[Math.floor(group.cells.length / 2)];
      spawns.push({
        r: anchor.r,
        c: anchor.c,
        kind: group.kind,
        special: group.spawnSpecial,
      });
    }
  }

  const { clearSet, triggeredSpecial } = expandSpecialClears(board, rawKeys, kindCount, rng);
  const next = cloneBoard(board);
  const clearedCells = [];

  for (const key of clearSet) {
    const [r, c] = key.split(',').map(Number);
    if (next[r][c]) {
      clearedCells.push({ r, c, kind: next[r][c].kind, special: next[r][c].special });
      next[r][c] = null;
    }
  }

  for (const sp of spawns) {
    next[sp.r][sp.c] = makeCell(sp.kind, sp.special);
  }

  return {
    clearedBoard: next,
    refilledBoard: applyGravityAndRefill(next, kindCount, rng),
    clearedCells,
    createdSpecial: spawns.length > 0,
    triggeredSpecial,
  };
}

export function resolveSpecialSwap(board, a, b, kindCount = 6, rng = Math.random) {
  const size = board.length;
  const cellA = board[a.r]?.[a.c];
  const cellB = board[b.r]?.[b.c];
  if (!cellA || !cellB) return null;

  const hasBomb = cellA.special === 'bomb' || cellB.special === 'bomb';
  const bothSpecial = Boolean(cellA.special && cellB.special);
  if (!hasBomb && !bothSpecial) return null;

  const rawKeys = new Set([`${a.r},${a.c}`, `${b.r},${b.c}`]);

  if (cellA.special === 'bomb' && cellB.special === 'bomb') {
    // Doble caldero mágico: limpia todo el tablero
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) rawKeys.add(`${r},${c}`);
    }
  } else if (hasBomb) {
    const other = cellA.special === 'bomb' ? cellB : cellA;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const candidate = board[r][c];
        if (candidate && candidate.special !== 'bomb' && candidate.kind === other.kind) {
          rawKeys.add(`${r},${c}`);
        }
      }
    }
  } else if (bothSpecial) {
    // Cruce de dos caramelos rayados: explota fila y columna completas
    for (let col = 0; col < size; col += 1) rawKeys.add(`${b.r},${col}`);
    for (let row = 0; row < size; row += 1) rawKeys.add(`${row},${b.c}`);
  }

  // Evitar que el caldero elija otro color aleatorio encima
  const temp = cloneBoard(board);
  if (temp[a.r][a.c]?.special === 'bomb') temp[a.r][a.c].special = null;
  if (temp[b.r][b.c]?.special === 'bomb') temp[b.r][b.c].special = null;

  const { clearSet } = expandSpecialClears(temp, rawKeys, kindCount, rng);
  const clearedCells = [];
  for (const key of clearSet) {
    const [r, c] = key.split(',').map(Number);
    if (temp[r][c]) {
      clearedCells.push({ r, c, kind: temp[r][c].kind, special: temp[r][c].special });
      temp[r][c] = null;
    }
  }

  return {
    clearedBoard: temp,
    refilledBoard: applyGravityAndRefill(temp, kindCount, rng),
    clearedCells,
    createdSpecial: false,
    triggeredSpecial: true,
  };
}

export function applyGravityAndRefill(board, kindCount = 6, rng = Math.random) {
  const size = board.length;
  const next = Array.from({ length: size }, () => Array(size).fill(null));

  for (let c = 0; c < size; c += 1) {
    let writeRow = size - 1;
    for (let r = size - 1; r >= 0; r -= 1) {
      if (board[r][c]) {
        next[writeRow][c] = { ...board[r][c], dropped: writeRow - r };
        writeRow -= 1;
      }
    }
    while (writeRow >= 0) {
      const fresh = makeCell(Math.floor(rng() * kindCount), null);
      fresh.dropped = writeRow + 2;
      next[writeRow][c] = fresh;
      writeRow -= 1;
    }
  }

  return next;
}
