import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameClock, useGridNavigation } from './GameSession.jsx';
import { Check, RotateCcw, Sparkles, Star } from 'lucide-react';
import {
  areAdjacent,
  cloneBoard,
  createMatch3Board,
  findValidMove,
  resolveBoardStep,
  resolveSpecialSwap,
} from './match3Logic.js';
import { sfx } from '../sound.js';

const DEFAULT_CANDIES = [
  { icon: '🎃', label: 'Calabaza', bg: 'linear-gradient(145deg, #ffb35c, #e05d1f)', border: '#c74d14' },
  { icon: '🍬', label: 'Caramelo', bg: 'linear-gradient(145deg, #c78dff, #7d3cc7)', border: '#6529aa' },
  { icon: '👻', label: 'Fantasma', bg: 'linear-gradient(145deg, #f3f7ff, #b8c7e8)', border: '#8fa3cf' },
  { icon: '🧪', label: 'Poción', bg: 'linear-gradient(145deg, #7be69d, #289957)', border: '#1d7d44' },
  { icon: '🍭', label: 'Piruleta', bg: 'linear-gradient(145deg, #ff85a2, #d42f5c)', border: '#b02049' },
  { icon: '⭐', label: 'Hechizo', bg: 'linear-gradient(145deg, #ffe97d, #d99b1e)', border: '#b67d10' },
];

const COMBO_CALLOUTS = ['', '', '¡DULCE ×2!', '¡DELICIOSO ×3!', '¡MÁGICO ×4!', '¡LEGENDARIO ×5!'];

export default function Match3Game({ game, onProgress, onComplete }) {
  const clock = useGameClock();
  const delay = clock.delay;
  const gridNavigation = useGridNavigation(game.size ?? 7);
  const size = game.size ?? 7;
  const candies = game.candies ?? DEFAULT_CANDIES;
  const bombIcon = game.bombIcon ?? '🔮';
  const target = game.target ?? 1200;
  const totalMoves = game.moves ?? 16;
  const theme = game.boardTheme ?? 'spooky';

  const [board, setBoard] = useState(() => createMatch3Board(size, candies.length));
  const [selected, setSelected] = useState(null);
  const [movesLeft, setMovesLeft] = useState(totalMoves);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [burstKeys, setBurstKeys] = useState(() => new Set());
  const [invalidPair, setInvalidPair] = useState(() => new Set());
  const [hintKeys, setHintKeys] = useState(() => new Set());
  const [callout, setCallout] = useState('');
  const [laserLine, setLaserLine] = useState(null);

  const boardRef = useRef(null);
  const mountedRef = useRef(true);
  const dragStartRef = useRef(null);
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef(0);
  const calloutTimerRef = useRef(0);
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);
  const busyRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clock.clearTimeout(calloutTimerRef.current);
      clock.clearTimeout(suppressTimerRef.current);
    };
  }, [clock]);

  useEffect(() => {
    // Las piezas se reemplazan durante las cascadas; conservar el foco lógico
    // evita dejar al jugador de teclado fuera del diálogo al desaparecer un dulce.
    if (document.activeElement === document.body) {
      boardRef.current?.querySelector(`[data-grid-index="${gridNavigation.focusedIndex}"]`)?.focus({ preventScroll: true });
    }
  }, [board, busy, gridNavigation.focusedIndex]);

  const showCallout = useCallback((text) => {
    clock.clearTimeout(calloutTimerRef.current);
    setCallout(text);
  }, [clock]);

  // Pista sutil si el jugador lleva unos segundos buscando jugada
  useEffect(() => {
    setHintKeys(new Set());
    if (busyRef.current || finishedRef.current || movesLeft <= 0) return undefined;
    const timer = clock.setTimeout(() => {
      const move = findValidMove(board);
      if (move && mountedRef.current) {
        setHintKeys(new Set(move.map((p) => `${p.r},${p.c}`)));
      }
    }, 4500);
    return () => clock.clearTimeout(timer);
  }, [clock, board, busy, movesLeft]);

  const finishGame = useCallback((finalScore, remainingMoves = 0) => {
    if (finishedRef.current || !mountedRef.current) return;
    finishedRef.current = true;
    const totalScore = finalScore + remainingMoves * 55;
    const won = totalScore >= target;
    const stars = totalScore >= Math.round(target * 1.45)
      ? 3
      : totalScore >= target
        ? 2
        : totalScore >= Math.round(target * 0.65)
          ? 1
          : 0;
    if (won) sfx.win();
    else sfx.end();
    onComplete({
      won,
      score: totalScore,
      maxScore: target,
      stars,
      unit: 'puntos dulces',
      summary: won
        ? remainingMoves > 0
          ? `¡Objetivo superado con ${remainingMoves} movimientos de sobra (+${remainingMoves * 55} pts de bono)!`
          : '¡Has arrasado el tablero a base de combos y caramelos especiales!'
        : `Te quedaste a ${target - totalScore} puntos de la meta. ¡Combina 4 o 5 iguales para desatar explosiones!`,
    });
  }, [onComplete, target]);

  const runCascade = useCallback(async (initialBoard, preferred, firstSpecialResult, nextMoves) => {
    let working = initialBoard;
    let combo = 0;
    let runningScore = scoreRef.current;

    if (firstSpecialResult) {
      combo += 1;
      const gained = firstSpecialResult.clearedCells.length * 32;
      runningScore += gained;
      scoreRef.current = runningScore;
      sfx.special();
      setBurstKeys(new Set(firstSpecialResult.clearedCells.map((p) => `${p.r},${p.c}`)));
      showCallout(`¡EXPLOSIÓN +${gained}!`);
      setScore(runningScore);
      onProgress?.(runningScore);
      if (!(await delay(230)) || !mountedRef.current) return;
      setBurstKeys(new Set());
      working = firstSpecialResult.refilledBoard;
      setBoard(working);
      if (!(await delay(190)) || !mountedRef.current) return;
    }

    while (combo < 14) {
      const step = resolveBoardStep(working, combo === 0 ? preferred : [], candies.length);
      if (!step) break;
      combo += 1;
      const multiplier = 1 + (combo - 1) * 0.45;
      const specialBonus = step.triggeredSpecial ? 85 : step.createdSpecial ? 45 : 0;
      const gained = Math.round(step.clearedCells.length * 24 * multiplier) + specialBonus;
      runningScore += gained;
      scoreRef.current = runningScore;

      const specialCell = step.clearedCells.find((item) => item.special === 'row' || item.special === 'col');
      if (specialCell) {
        setLaserLine({ type: specialCell.special, index: specialCell.special === 'row' ? specialCell.r : specialCell.c });
      }

      if (step.triggeredSpecial) sfx.special();
      else sfx.match(combo);

      setBurstKeys(new Set(step.clearedCells.map((p) => `${p.r},${p.c}`)));
      const label = step.createdSpecial
        ? `¡ESPECIAL +${gained}!`
        : combo >= 2
          ? `${COMBO_CALLOUTS[Math.min(combo, COMBO_CALLOUTS.length - 1)]} +${gained}`
          : `+${gained}`;
      showCallout(label);
      setScore(runningScore);
      onProgress?.(runningScore);

      if (!(await delay(210)) || !mountedRef.current) return;
      setBurstKeys(new Set());
      setLaserLine(null);
      working = step.refilledBoard;
      setBoard(working);
      if (!(await delay(180)) || !mountedRef.current) return;
    }

    // Reordenar automáticamente si no quedan jugadas
    if (!findValidMove(working)) {
      showCallout('¡Mezclando dulces!');
      if (!(await delay(320)) || !mountedRef.current) return;
      working = createMatch3Board(size, candies.length);
      setBoard(working);
    }

    clock.clearTimeout(calloutTimerRef.current);
    calloutTimerRef.current = clock.setTimeout(() => {
      if (mountedRef.current) setCallout('');
    }, 650);

    const threeStarScore = Math.round(target * 1.45);
    if (nextMoves <= 0 || runningScore >= threeStarScore) {
      if (await delay(340)) finishGame(runningScore, nextMoves);
      return;
    }
    busyRef.current = false;
    setBusy(false);
  }, [clock, target, showCallout, onProgress, delay, candies.length, size, finishGame]);

  const attemptSwap = useCallback(async (a, b) => {
    if (busyRef.current || finishedRef.current || movesLeft <= 0 || !areAdjacent(a, b)) return;
    busyRef.current = true;
    setBusy(true);
    setSelected(null);
    setHintKeys(new Set());
    sfx.swap();

    // Comprobar primero si se intercambian caramelos especiales
    const specialResult = resolveSpecialSwap(board, a, b, candies.length);
    if (specialResult) {
      const nextMoves = movesLeft - 1;
      setMovesLeft(nextMoves);
      await runCascade(board, [b, a], specialResult, nextMoves);
      return;
    }

    const swapped = cloneBoard(board);
    swapped[a.r][a.c].dropped = 0;
    swapped[b.r][b.c].dropped = 0;
    [swapped[a.r][a.c], swapped[b.r][b.c]] = [swapped[b.r][b.c], swapped[a.r][a.c]];
    setBoard(swapped);

    const probe = resolveBoardStep(swapped, [b, a], candies.length);
    if (!probe) {
      setInvalidPair(new Set([`${a.r},${a.c}`, `${b.r},${b.c}`]));
      sfx.invalid();
      if (!(await delay(230)) || !mountedRef.current) return;
      setInvalidPair(new Set());
      setBoard(board);
      busyRef.current = false;
      setBusy(false);
      return;
    }

    const nextMoves = movesLeft - 1;
    setMovesLeft(nextMoves);
    await runCascade(swapped, [b, a], null, nextMoves);
  }, [movesLeft, board, candies.length, runCascade, delay]);

  function handleTileClick(r, c) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (busyRef.current || finishedRef.current || movesLeft <= 0) return;
    if (!selected) {
      sfx.tap();
      setSelected({ r, c });
      return;
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }
    if (areAdjacent(selected, { r, c })) {
      attemptSwap(selected, { r, c });
    } else {
      sfx.tap();
      setSelected({ r, c });
    }
  }

  function handleGridKeyDown(event) {
    const cell = event.target.closest('[data-grid-index]');
    if (!cell) return;
    if (event.key === 'Escape' && selected) {
      event.preventDefault();
      event.stopPropagation();
      setSelected(null);
      return;
    }
    if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      const index = Number(cell.dataset.gridIndex);
      const from = { r: Math.floor(index / size), c: index % size };
      const to = { r: from.r + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0), c: from.c + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0) };
      if (to.r >= 0 && to.r < size && to.c >= 0 && to.c < size) attemptSwap(from, to);
      return;
    }
    gridNavigation.onKeyDown(event);
  }

  function handlePointerDown(event, r, c) {
    if (event.button !== 0) return;
    if (busyRef.current || finishedRef.current || movesLeft <= 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragStartRef.current = { r, c, x: event.clientX, y: event.clientY, pointerId: event.pointerId, threshold: Math.max(10, Math.min(22, event.currentTarget.clientWidth * 0.35)), swapped: false };
  }

  function handlePointerMove(event) {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== event.pointerId || start.swapped || busyRef.current) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const threshold = start.threshold;
    if (Math.hypot(dx, dy) < threshold) return;

    let targetR = start.r;
    let targetC = start.c;
    if (Math.abs(dx) > Math.abs(dy)) {
      targetC += dx > 0 ? 1 : -1;
    } else {
      targetR += dy > 0 ? 1 : -1;
    }

    start.swapped = true;
    suppressClickRef.current = true;
    clock.clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = clock.setTimeout(() => { suppressClickRef.current = false; }, 320);
    dragStartRef.current = null;
    if (targetR >= 0 && targetR < size && targetC >= 0 && targetC < size) {
      attemptSwap({ r: start.r, c: start.c }, { r: targetR, c: targetC });
    }
  }

  function handlePointerUp() {
    dragStartRef.current = null;
  }

  function resetGame() {
    if (busyRef.current) return;
    clock.clearTimeout(calloutTimerRef.current);
    clock.clearTimeout(suppressTimerRef.current);
    suppressClickRef.current = false;
    finishedRef.current = false;
    scoreRef.current = 0;
    setScore(0);
    setMovesLeft(totalMoves);
    setSelected(null);
    setCallout('');
    setLaserLine(null);
    setHintKeys(new Set());
    setInvalidPair(new Set());
    setBurstKeys(new Set());
    setBoard(createMatch3Board(size, candies.length));
    onProgress?.(0);
  }

  const threeStar = Math.round(target * 1.45);
  const progressPct = useMemo(() => Math.min(100, Math.round((score / threeStar) * 100)), [score, threeStar]);
  const reachedGoal = score >= target;

  return (
    <div className={`m3-wrap m3-theme-${theme}`} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <div className="game-stats-line">
        <span>PUNTOS <strong>{score}</strong></span>
        <span>META <strong>{target}</strong></span>
        <span>MOVIMIENTOS <strong className={movesLeft <= 4 ? 'stat-urgent' : ''}>{movesLeft}</strong></span>
        <button type="button" onClick={resetGame} aria-label="Reiniciar tablero" disabled={busy}>
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="m3-meter" aria-label={`Progreso: ${score} de ${target} puntos`}>
        <div className="m3-meter-fill" style={{ width: `${progressPct}%` }} />
        <span className={`m3-star-mark ${score >= Math.round(target * 0.65) ? 'is-lit' : ''}`} style={{ left: '45%' }}>
          <Star size={11} />
        </span>
        <span className={`m3-star-mark ${reachedGoal ? 'is-lit' : ''}`} style={{ left: '69%' }}>
          <Star size={11} />
        </span>
        <span className={`m3-star-mark ${score >= threeStar ? 'is-lit' : ''}`} style={{ left: '96%' }}>
          <Star size={11} />
        </span>
      </div>

      <div className="m3-board-shell">
        {callout && (
          <div className="m3-callout" role="status" aria-live="polite">
            <Sparkles size={12} /> {callout}
          </div>
        )}
        <div
          className="m3-board"
          ref={boardRef}
          style={{ '--m3-size': size }}
          onPointerMove={handlePointerMove}
          role="group"
          aria-roledescription="tablero"
          aria-busy={busy}
          onKeyDown={handleGridKeyDown}
          aria-label={game.title}
        >
          {laserLine && (
            <div
              className={`m3-laser m3-laser-${laserLine.type}`}
              style={{ '--laser-index': laserLine.index }}
              aria-hidden="true"
            />
          )}
          {board.map((row, r) => row.map((cell, c) => {
            const key = `${r},${c}`;
            const candy = candies[cell.kind] ?? candies[0];
            const isSelected = selected?.r === r && selected?.c === c;
            const isBurst = burstKeys.has(key);
            const isInvalid = invalidPair.has(key);
            const isHint = hintKeys.has(key);
            const isBomb = cell.special === 'bomb';
            const classes = [
              'm3-tile',
              isSelected ? 'is-selected' : '',
              isBurst ? 'is-burst' : '',
              isInvalid ? 'is-invalid' : '',
              isHint ? 'is-hint' : '',
              cell.dropped > 0 ? 'is-dropped' : '',
              cell.special ? `is-special-${cell.special}` : '',
            ].filter(Boolean).join(' ');

            return (
              <button
                {...gridNavigation.cellProps(r * size + c)}
                key={cell.id}
                type="button"
                className={classes}
                style={{
                  '--candy-bg': isBomb
                    ? 'conic-gradient(from 45deg, #ff7eb3, #ffd966, #72efdd, #a78bfa, #ff7eb3)'
                    : candy.bg,
                  '--candy-border': isBomb ? '#fff2b2' : candy.border,
                }}
                onPointerDown={(event) => handlePointerDown(event, r, c)}
                onClick={() => handleTileClick(r, c)}
                aria-pressed={isSelected}
                aria-label={`${isBomb ? 'Caldero mágico' : candy.label} fila ${r + 1} columna ${c + 1}${cell.special === 'row' ? ' rayado horizontal' : cell.special === 'col' ? ' rayado vertical' : ''}`}
              >
                <span className="m3-tile-gloss" aria-hidden="true" />
                <span className="m3-tile-icon" aria-hidden="true">{isBomb ? bombIcon : candy.icon}</span>
                {cell.special === 'row' && <span className="m3-special-badge" aria-hidden="true">↔</span>}
                {cell.special === 'col' && <span className="m3-special-badge" aria-hidden="true">↕</span>}
              </button>
            );
          }))}
        </div>
      </div>

      {reachedGoal && !busy && movesLeft > 0 ? (
        <button
          type="button"
          className="game-primary-button m3-claim-button"
          onClick={() => finishGame(score, movesLeft)}
        >
          ¡Meta superada! Cobrar bono (+{movesLeft * 55} pts) <Check size={15} />
        </button>
      ) : (
        <p className="game-hint">
          <span className="hint-sparkle">✦</span>
          Arrastra o toca dos piezas contiguas. Junta 4 para crear un rayo de fila y 5 para un {bombIcon} mágico.
        </p>
      )}
    </div>
  );
}
