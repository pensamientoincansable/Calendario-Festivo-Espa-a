import test from 'node:test';
import assert from 'node:assert/strict';
import {
  easterSunday,
  formatLongDate,
  GAME_TYPE_META,
  GAME_TYPES,
  getHolidays,
  getMonthCells,
  isoDate,
  REGIONS,
} from '../src/calendar.js';
import {
  areAdjacent,
  createMatch3Board,
  findMatchGroups,
  findValidMove,
  resolveBoardStep,
  resolveSpecialSwap,
} from '../src/games/match3Logic.js';
import {
  computePoweredGrid,
  createLightsPuzzle,
} from '../src/games/lightsLogic.js';
import { clamp, roundRect } from '../src/games/canvasUtils.js';
import { isSoundMuted, setSoundMuted, sfx } from '../src/sound.js';

test('calcula correctamente el Domingo de Resurrección en fechas conocidas', () => {
  assert.equal(easterSunday(2024).toISOString().slice(0, 10), '2024-03-31');
  assert.equal(easterSunday(2025).toISOString().slice(0, 10), '2025-04-20');
  assert.equal(easterSunday(2026).toISOString().slice(0, 10), '2026-04-05');
});

test('genera los 10 festivos nacionales y las celebraciones destacadas para 2026', () => {
  const holidays = getHolidays(2026);
  const national = holidays.filter((holiday) => holiday.scope === 'national');
  const popular = holidays.filter((holiday) => holiday.scope === 'popular');

  assert.equal(national.length, 10);
  assert.equal(popular.length, 4);
  assert.ok(national.some((holiday) => holiday.name === 'Viernes Santo' && holiday.date === '2026-04-03'));
  assert.ok(holidays.some((holiday) => holiday.id === 'navidad' && holiday.game.type === 'santa'));
  assert.ok(holidays.some((holiday) => holiday.id === 'epifania' && holiday.game.type === 'reyes'));
  assert.ok(holidays.some((holiday) => holiday.id === 'fiesta-nacional' && holiday.game.type === 'cooking'));
  assert.ok(holidays.some((holiday) => holiday.id === 'halloween' && holiday.date === '2026-10-31' && holiday.game.type === 'match3'));
  assert.ok(holidays.some((holiday) => holiday.id === 'san-cristobal' && holiday.date === '2026-07-10' && holiday.game.type === 'race'));
  assert.ok(holidays.some((holiday) => holiday.id === 'carnaval' && holiday.date === '2026-02-17' && holiday.game.type === 'race'));
});

test('suma fechas autonómicas y días móviles según el territorio', () => {
  const andalucia = getHolidays(2026, 'andalucia');
  assert.ok(andalucia.some((holiday) => holiday.name === 'Día de Andalucía' && holiday.date === '2026-02-28'));
  assert.ok(andalucia.some((holiday) => holiday.name === 'Jueves Santo' && holiday.date === '2026-04-02'));
  assert.ok(andalucia.some((holiday) => holiday.name === 'Viernes Santo' && holiday.date === '2026-04-03'));

  const cataluna = getHolidays(2026, 'cataluna');
  assert.ok(!cataluna.some((holiday) => holiday.name === 'Jueves Santo'));
  assert.ok(cataluna.some((holiday) => holiday.name === 'Lunes de Pascua' && holiday.date === '2026-04-06'));
});

test('todos los festivos tienen un minijuego interactivo válido y ninguno es de preguntas', () => {
  for (const region of REGIONS) {
    const holidays = getHolidays(2026, region.id);
    assert.ok(holidays.length >= 14, `${region.label} debería incluir nacionales y celebraciones`);
    for (const holiday of holidays) {
      assert.match(holiday.date, /^2026-\d{2}-\d{2}$/);
      assert.notEqual(holiday.game.type, 'quiz', `${holiday.name} no debe ser un trivial de preguntas`);
      assert.ok(GAME_TYPES.includes(holiday.game.type), `Tipo inesperado: ${holiday.game.type}`);
      assert.ok(GAME_TYPE_META[holiday.game.type], `Faltan metadatos para ${holiday.game.type}`);
      assert.ok(holiday.game.title && holiday.game.instruction);

      if (holiday.game.type === 'cooking') {
        assert.ok(holiday.game.recipes.length >= 2);
        for (const recipe of holiday.game.recipes) {
          assert.ok(recipe.ingredients.length >= 4);
          assert.ok(recipe.decoys.length >= 2);
          assert.ok(['flip', 'simmer', 'blend'].includes(recipe.technique));
          const allItemIds = [...recipe.ingredients, ...recipe.decoys].map((it) => it.id);
          assert.equal(new Set(allItemIds).size, allItemIds.length, `IDs duplicados en ${recipe.name}`);
        }
      }
      if (holiday.game.type === 'match3') {
        assert.ok(holiday.game.candies.length >= 5);
        assert.ok(holiday.game.moves >= 12);
        assert.ok(holiday.game.target >= 800);
      }
    }
  }
});

test('todos los festivos tienen identificadores y fechas ISO válidas en un rango amplio de años', () => {
  for (const region of REGIONS) {
    for (const year of [2024, 2025, 2026, 2027, 2032, 2038]) {
      const holidays = getHolidays(year, region.id);
      const ids = holidays.map((holiday) => holiday.id);
      assert.ok(ids.every((id) => id && !id.includes('undefined')), `${region.label} ${year} tiene un id inválido`);
      assert.equal(new Set(ids).size, ids.length, `${region.label} ${year} tiene ids duplicados`);
      for (const holiday of holidays) {
        assert.match(holiday.date, new RegExp(`^${year}-\\d{2}-\\d{2}$`));
        assert.ok(!Number.isNaN(Date.parse(`${holiday.date}T00:00:00Z`)));
      }
      // Verificar orden cronológico ascendente
      for (let i = 1; i < holidays.length; i += 1) {
        assert.ok(holidays[i].date >= holidays[i - 1].date, 'los festivos deben ir ordenados por fecha');
      }
    }
  }
});

test('el motor Match-3 crea tableros jugables y genera caramelos especiales', () => {
  const board = createMatch3Board(7, 6);
  assert.equal(board.length, 7);
  assert.equal(findMatchGroups(board).length, 0, 'no debe arrancar con tríos ya formados');
  const move = findValidMove(board);
  assert.ok(move && areAdjacent(move[0], move[1]), 'siempre debe haber una jugada válida inicial');

  // Comprobar creación determinista de caramelo rayado (4 iguales) y caldero (5 iguales)
  const custom = Array.from({ length: 7 }, (_, r) => (
    Array.from({ length: 7 }, (_, c) => ({ id: r * 10 + c + 1, kind: ((r * 2 + c) % 4) + 1, special: null }))
  ));
  custom[2][1] = { id: 901, kind: 0, special: null };
  custom[2][2] = { id: 902, kind: 0, special: null };
  custom[2][3] = { id: 903, kind: 0, special: null };
  custom[2][4] = { id: 904, kind: 0, special: null };
  const step = resolveBoardStep(custom, [{ r: 2, c: 2 }], 6);
  assert.ok(step && step.createdSpecial);
  assert.equal(step.clearedBoard[2][2].special, 'col');

  custom[2][5] = { id: 905, kind: 0, special: null };
  const stepFive = resolveBoardStep(custom, [{ r: 2, c: 3 }], 6);
  assert.ok(stepFive && stepFive.createdSpecial);
  assert.equal(stepFive.clearedBoard[2][3].special, 'bomb');

  // Comprobar explosión de caldero mágico sin consumir otro caldero ajeno
  const bombBoard = Array.from({ length: 7 }, (_, r) => (
    Array.from({ length: 7 }, (_, c) => ({ id: r * 10 + c + 1, kind: ((r + c) % 4) + 1, special: null }))
  ));
  bombBoard[3][3] = { id: 910, kind: 1, special: 'bomb' };
  bombBoard[3][4] = { id: 911, kind: 2, special: null };
  bombBoard[0][0] = { id: 912, kind: 2, special: 'bomb' };
  const boom = resolveSpecialSwap(bombBoard, { r: 3, c: 3 }, { r: 3, c: 4 }, 6);
  assert.ok(boom && boom.triggeredSpecial && boom.clearedCells.length >= 2);
  assert.ok(!boom.clearedCells.some((cell) => cell.r === 0 && cell.c === 0), 'no debe borrar otro caldero independiente');

  // Intercambio de dos rayados limpia fila y columna completas (13 casillas en 7x7)
  const crossBoard = Array.from({ length: 7 }, (_, r) => (
    Array.from({ length: 7 }, (_, c) => ({ id: r * 10 + c + 1, kind: (r + c) % 5, special: null }))
  ));
  crossBoard[2][2] = { id: 920, kind: 0, special: 'row' };
  crossBoard[2][3] = { id: 921, kind: 1, special: 'col' };
  const cross = resolveSpecialSwap(crossBoard, { r: 2, c: 2 }, { r: 2, c: 3 }, 6);
  assert.equal(cross.clearedCells.length, 13);
});

test('utilidades de canvas y sonido son seguras ante valores límite y entorno sin navegador', () => {
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(25, 0, 10), 10);
  const calls = [];
  const mockCtx = {
    beginPath: () => calls.push('begin'),
    moveTo: () => calls.push('move'),
    arcTo: (_x1, _y1, _x2, _y2, r) => {
      assert.ok(r >= 0, 'el radio nunca debe ser negativo');
      calls.push('arc');
    },
    closePath: () => calls.push('close'),
  };
  roundRect(mockCtx, 0, 0, -10, 20, 8);
  roundRect(mockCtx, 0, 0, 12, 8, 99);
  assert.ok(calls.includes('arc'));

  assert.equal(setSoundMuted(true), true);
  assert.equal(isSoundMuted(), true);
  sfx.win();
  assert.equal(setSoundMuted(false), false);
});

test('el puzle de luces genera circuitos resolubles al 100%', () => {
  for (let i = 0; i < 8; i += 1) {
    const grid = createLightsPuzzle(4);
    assert.equal(computePoweredGrid(grid).solved, false, 'debe empezar desordenado');
    const solvedGrid = grid.map((row) => row.map((cell) => ({ ...cell, rotation: 0 })));
    assert.equal(computePoweredGrid(solvedGrid).solved, true, 'la orientación original conecta las 16 luces');
  }
});

test('el calendario empieza en lunes y completa las semanas del mes', () => {
  const november = getMonthCells(2026, 10);
  assert.equal(november.length, 42);
  assert.equal(november[0].iso, '2026-10-26');
  assert.equal(november[6].iso, '2026-11-01');
  assert.equal(november.at(-1).iso, '2026-12-06');
  assert.equal(isoDate(2026, 11, 16), '2026-11-16');
  assert.equal(formatLongDate('2026-11-16'), 'lunes, 16 de noviembre de 2026');
});
