import { test, expect } from '@playwright/test';
import { GAME_TYPES, getHolidays } from '../../src/calendar.js';
import { findValidMove } from '../../src/games/match3Logic.js';

const errors = new WeakMap();

test.beforeEach(async ({ page }) => {
  const messages = [];
  errors.set(page, messages);
  page.on('pageerror', (error) => messages.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(message.text());
  });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page), 'La interfaz no debe producir errores de JavaScript').toEqual([]);
});

async function fallbackFullscreen(page) {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () =>
      Promise.reject(new DOMException('Bloqueado por el navegador', 'NotAllowedError'));
  });
}
async function openGame(page, type) {
  await page.goto('/');
  const card = page.locator(`.gallery-card[data-game-type="${type}"]`).first();
  await card.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator(`.game-stage[data-game-type="${type}"]`)).toBeVisible();
  return card;
}
function stat(page, label) {
  return page.locator('.game-stats-line > span').filter({ hasText: label }).locator('strong');
}

for (const type of GAME_TYPES) {
  test(`${type}: ayuda, ampliación y cierre sin desmontar la partida`, async ({ page }) => {
    await fallbackFullscreen(page);
    const card = await openGame(page, type);
    await page.locator('.game-stage').evaluate((element) => {
      window.originalGameStage = element;
    });
    await page.getByRole('button', { name: 'Cómo jugar', exact: true }).click();
    await expect(page.locator('#session-panel-title')).toHaveText('Así se juega.');
    await expect(page.locator('.game-modal')).toHaveAttribute('data-paused', 'true');
    await page.getByRole('button', { name: 'Móvil / Android', exact: true }).click();
    await expect(page.locator('.control-guide-list')).not.toBeEmpty();
    await page.getByRole('button', { name: 'PC', exact: true }).click();
    await expect(page.locator('.control-guide-list')).not.toBeEmpty();
    await page.getByRole('button', { name: 'Continuar jugando', exact: true }).click();
    await page.getByRole('button', { name: 'Ampliar a pantalla completa', exact: true }).click();
    await expect(page.locator('.game-modal')).toHaveClass(/is-expanded/);
    await expect(page.locator('.game-view-notice')).toContainText('Vista ampliada');
    expect(
      await page.locator('.game-stage').evaluate((element) => element === window.originalGameStage),
    ).toBe(true);
    await expect
      .poll(() =>
        page
          .locator('.game-modal')
          .evaluate((element) => Math.abs(element.getBoundingClientRect().width - innerWidth)),
      )
      .toBeLessThanOrEqual(1);
    await expect
      .poll(() =>
        page
          .locator('.game-modal')
          .evaluate((element) => Math.abs(element.getBoundingClientRect().height - innerHeight)),
      )
      .toBeLessThanOrEqual(1);
    await expect(
      page.getByRole('button', { name: 'Cerrar minijuego', exact: true }),
    ).toBeInViewport();
    const start = page.locator('.canvas-start-btn');
    if (await start.count()) {
      await start.click();
      await expect(page.locator('.canvas-overlay')).toHaveCount(0);
      await page.waitForTimeout(200);
      await page.keyboard.press('Space');
      await page.getByRole('button', { name: 'Pausar partida', exact: true }).click();
      const frame = await page.locator('canvas').evaluate((canvas) => canvas.toDataURL());
      await page.waitForTimeout(200);
      expect(await page.locator('canvas').evaluate((canvas) => canvas.toDataURL())).toBe(frame);
      await page.getByRole('button', { name: 'Continuar jugando', exact: true }).click();
      await page.locator('.game-stats-line > button').click();
      await expect(page.locator('.game-stage')).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(page.locator('.game-modal')).not.toHaveClass(/is-expanded/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar minijuego', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(card).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(await page.locator('[inert]').count()).toBe(0);
  });
}

test('el aspecto se guarda, se restaura y puede cambiarse desde el juego', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Modo nocturno', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Modo nocturno', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.gallery-card[data-game-type="race"]').first().click();
  await page.getByRole('button', { name: 'Cambiar a modo diurno', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('festeja:theme'))).toBe('light');
  await page.getByRole('button', { name: 'Cerrar minijuego' }).click();
  await expect(page.getByRole('button', { name: 'Modo diurno', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('se respeta el tema del sistema y funciona sin localStorage', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Bloqueado', 'SecurityError');
    };
    Storage.prototype.setItem = () => {
      throw new DOMException('Bloqueado', 'SecurityError');
    };
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Modo diurno', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('.gallery-card[data-game-type="lights"]').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('pausa manual, ayuda y cambio de pestaña congelan el cronómetro y el lienzo', async ({
  page,
}) => {
  await openGame(page, 'reyes');
  await page.getByRole('button', { name: 'Iniciar la Cabalgata', exact: true }).click();
  await expect(stat(page, 'ALBA')).not.toHaveText('48s', { timeout: 5000 });
  await page.keyboard.press('p');
  await expect(page.locator('.game-modal')).toHaveAttribute('data-paused', 'true');
  const before = await stat(page, 'ALBA').textContent();
  const image = await page.locator('canvas').evaluate((canvas) => canvas.toDataURL());
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(1100);
  expect(await stat(page, 'ALBA').textContent()).toBe(before);
  expect(await page.locator('canvas').evaluate((canvas) => canvas.toDataURL())).toBe(image);
  await page.keyboard.press('p');
  await expect(page.locator('.game-modal')).toHaveAttribute('data-paused', 'false');
  await expect(stat(page, 'ALBA')).not.toHaveText(before, { timeout: 5000 });
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('.game-modal')).toHaveAttribute('data-paused', 'true');
  await expect(page.locator('#session-panel-title')).toHaveText('Partida en pausa.');
});

test('las teclas de los botones no activan dos veces una acción y los puzles se recorren con flechas', async ({
  page,
}) => {
  await openGame(page, 'lights');
  const tiles = page.locator('.lights-tile');
  await tiles.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tiles.nth(1)).toBeFocused();
  await page.keyboard.press('Space');
  await expect(stat(page, 'GIROS')).toHaveText('1');
  await page.keyboard.press('End');
  await expect(tiles.nth(3)).toBeFocused();
  await page.getByRole('button', { name: 'Cerrar minijuego' }).click();
  await page.locator('.gallery-card[data-game-type="match3"]').first().click();
  const sweets = page.locator('.m3-tile');
  await sweets.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(sweets.nth(1)).toBeFocused();
  const moves = await stat(page, 'MOVIMIENTOS').textContent();
  await page.keyboard.press('Space');
  await expect(sweets.nth(1)).toHaveAttribute('aria-pressed', 'true');
  expect(await stat(page, 'MOVIMIENTOS').textContent()).toBe(moves);
  await page.keyboard.press('Escape');
  await expect(sweets.nth(1)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('el match-3 conserva movimientos y cascadas al pausar y ampliar', async ({ page }) => {
  await fallbackFullscreen(page);
  await openGame(page, 'match3');
  const icons = await page.locator('.m3-tile-icon').allTextContents();
  const kinds = [...new Set(icons)];
  const size = Math.sqrt(icons.length);
  const board = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({
      id: r * size + c,
      kind: kinds.indexOf(icons[r * size + c]),
      special: null,
    })),
  );
  const [a, b] = findValidMove(board);
  await page
    .locator('.m3-tile')
    .nth(a.r * size + a.c)
    .click();
  await page
    .locator('.m3-tile')
    .nth(b.r * size + b.c)
    .click();
  await page.getByRole('button', { name: 'Pausar partida', exact: true }).click();
  const stats = await page.locator('.game-stats-line').textContent();
  const pieces = await page.locator('.m3-tile-icon').allTextContents();
  await page.waitForTimeout(650);
  expect(await page.locator('.game-stats-line').textContent()).toBe(stats);
  expect(await page.locator('.m3-tile-icon').allTextContents()).toEqual(pieces);
  await page.getByRole('button', { name: 'Ampliar a pantalla completa' }).click();
  expect(await page.locator('.m3-tile-icon').allTextContents()).toEqual(pieces);
  await page.getByRole('button', { name: 'Continuar jugando', exact: true }).click();
  await expect(stat(page, 'PUNTOS')).not.toHaveText('0');
});

test('un control mantenido captura el puntero y se libera al pausar o perder el foco', async ({
  page,
}) => {
  await openGame(page, 'race');
  const left = page.getByRole('button', { name: 'Girar a la izquierda', exact: true });
  await left.focus();
  await page.keyboard.down('Space');
  await expect(left).toHaveAttribute('data-held', 'true');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(left).not.toHaveAttribute('data-held', 'true');
  await page.keyboard.up('Space');
  await page.getByRole('button', { name: 'Continuar jugando', exact: true }).click();
  const box = await left.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(left).toHaveAttribute('data-held', 'true');
  await page.mouse.move(box.x + box.width / 2, box.y - 70);
  await expect(left).toHaveAttribute('data-held', 'true');
  await page.mouse.up();
  await expect(left).not.toHaveAttribute('data-held', 'true');
});

test('Android: dos dedos para dirección y turbo, y diseño apaisado sin recortar controles', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'Android', 'Interacción multitáctil en la emulación Android');
  await fallbackFullscreen(page);
  await openGame(page, 'race');
  await page.getByRole('button', { name: 'Ampliar a pantalla completa' }).click();
  const left = page.getByRole('button', { name: 'Girar a la izquierda', exact: true });
  const turbo = page.getByRole('button', { name: 'Activar turbo', exact: true });
  const a = await left.boundingBox();
  const b = await turbo.boundingBox();
  const session = await context.newCDPSession(page);
  const points = [
    { id: 1, x: a.x + a.width / 2, y: a.y + a.height / 2 },
    { id: 2, x: b.x + b.width / 2, y: b.y + b.height / 2 },
  ];
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
  await expect(left).toHaveAttribute('data-held', 'true');
  await expect(turbo).toHaveAttribute('data-held', 'true');
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(left).not.toHaveAttribute('data-held', 'true');
  await expect(turbo).not.toHaveAttribute('data-held', 'true');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(async () => {
      const controls = await page.locator('.touch-controls').boundingBox();
      return controls.y + controls.height;
    })
    .toBeLessThanOrEqual(391);
  const frame = await page.locator('.canvas-frame').boundingBox();
  expect(Math.abs(frame.width / frame.height - 500 / 310)).toBeLessThan(0.02);
  await expect(page.getByRole('button', { name: 'Cerrar minijuego' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('el puzle apaisado mantiene las piezas grandes y sus marcadores fuera de la barra de controles', async ({
  page,
}) => {
  await fallbackFullscreen(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await openGame(page, 'match3');
  await page.getByRole('button', { name: 'Ampliar a pantalla completa' }).click();
  await expect
    .poll(async () => {
      const toolbar = await page.locator('.game-content-topline').boundingBox();
      const stats = await page.locator('.game-stats-line').boundingBox();
      return stats.y - toolbar.y - toolbar.height;
    })
    .toBeGreaterThanOrEqual(-1);
  const board = await page.locator('.m3-board-shell').boundingBox();
  const tile = await page.locator('.m3-tile').first().boundingBox();
  expect(board.y + board.height).toBeLessThanOrEqual(390);
  expect(tile.width).toBeGreaterThanOrEqual(36);
  expect(tile.height).toBeGreaterThanOrEqual(36);
  await expect(page.getByRole('button', { name: 'Reiniciar tablero' })).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.m3-board-shell')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('PC: pantalla completa nativa y salida del navegador sin cerrar el minijuego', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'PC', 'Fullscreen nativo en escritorio');
  await openGame(page, 'race');
  await page.getByRole('button', { name: 'Ampliar a pantalla completa' }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.locator('.game-modal')).not.toHaveClass(/is-expanded/);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('el foco queda dentro del diálogo durante la pausa y vuelve al juego al reanudar', async ({
  page,
}) => {
  await openGame(page, 'runner');
  await page.getByRole('button', { name: 'Pausar partida', exact: true }).click();
  for (let index = 0; index < 15; index += 1) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement.closest('.game-modal')))).toBe(
      true,
    );
    expect(await page.evaluate(() => Boolean(document.activeElement.closest('[inert]')))).toBe(
      false,
    );
  }
  await page.getByRole('button', { name: 'Continuar jugando', exact: true }).click();
  await expect(page.locator('.game-play-surface')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('.canvas-overlay')).toHaveCount(0);
});

test('una partida terminada guarda el récord y permite reintentar sin salir de la vista ampliada', async ({
  page,
}) => {
  await fallbackFullscreen(page);
  await openGame(page, 'stacker');
  await page.getByRole('button', { name: 'Ampliar a pantalla completa' }).click();
  await page.getByRole('button', { name: 'Empezar a construir', exact: true }).click();
  await page.keyboard.press('Space');
  await expect(stat(page, 'NIVEL')).toHaveText(/1\//);
  await page.waitForTimeout(170);
  await page.keyboard.press('Space');
  await expect(page.locator('.game-result')).toBeVisible();
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('festeja:records:v2')));
  expect(Object.values(records).some((record) => record.bestScore > 0)).toBe(true);
  await page.getByRole('button', { name: 'Reintentar ahora', exact: true }).click();
  await expect(page.locator('.game-stage[data-game-type="stacker"]')).toBeVisible();
  await expect(page.locator('.game-modal')).toHaveClass(/is-expanded/);
  await expect(stat(page, 'NIVEL')).toHaveText(/0\//);
});

test('la cabecera y el juego no desbordan en una pantalla de 320 px', async ({ page }) => {
  await fallbackFullscreen(page);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  const brand = await page.locator('.brand-lockup').boundingBox();
  const actions = await page.locator('.header-actions').boundingBox();
  expect(brand.x + brand.width).toBeLessThanOrEqual(actions.x);
  await expect(page.getByRole('button', { name: 'Modo nocturno', exact: true })).toBeInViewport();
  await page.locator('.gallery-card[data-game-type="race"]').first().click();
  await page.getByRole('button', { name: 'Ampliar a pantalla completa' }).click();
  const toolbar = await page.locator('.game-top-actions').boundingBox();
  expect(toolbar.x).toBeGreaterThanOrEqual(0);
  expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(320);
  await expect(page.getByRole('button', { name: 'Cerrar minijuego' })).toBeInViewport();
});

test('las acciones de precisión responden una sola vez al dedo, clic o teclado', async ({
  page,
}) => {
  await openGame(page, 'chimes');
  await page.getByRole('button', { name: 'Sonar las campanadas', exact: true }).click();
  const action = page.locator('.full-action-btn');
  await action.click();
  await expect(page.locator('.grape-pending')).toHaveCount(11);
  await page.waitForTimeout(170);
  await page.locator('canvas').click({ button: 'right' });
  await expect(page.locator('.grape-pending')).toHaveCount(11);
  await action.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.grape-pending')).toHaveCount(10);
});

test('se puede cocinar el menú completo, pausar la aguja y servir el resultado', async ({
  page,
}) => {
  await fallbackFullscreen(page);
  await openGame(page, 'cooking');
  await page.getByRole('button', { name: 'Ampliar a pantalla completa' }).click();
  const recipes = getHolidays(2026).find((holiday) => holiday.game.type === 'cooking').game.recipes;
  for (const [index, recipe] of recipes.entries()) {
    for (const ingredient of recipe.ingredients) {
      await page
        .locator('.cook-pantry')
        .getByRole('button', { name: new RegExp(ingredient.label) })
        .click();
    }
    await expect(page.locator('.cook-action-box')).toBeVisible();
    if (index === 0) {
      await page.keyboard.press('p');
      const needle = await page.locator('.cook-gauge-needle').getAttribute('style');
      await page.waitForTimeout(300);
      expect(await page.locator('.cook-gauge-needle').getAttribute('style')).toBe(needle);
      await page.keyboard.press('p');
    }
    if (recipe.technique === 'blend') {
      for (
        let count = 0;
        count < 80 && (await page.locator('.cook-action-box').isVisible());
        count += 1
      ) {
        const position = await page
          .locator('.cook-gauge-needle')
          .evaluate((element) => parseFloat(element.style.left));
        if (position < 64) await page.locator('.cook-action-box .cook-action-btn').click();
        await page.waitForTimeout(80);
      }
    } else {
      await page.locator('.cook-action-box .cook-action-btn').click();
    }
    await expect(page.locator('.cook-plated-box')).toBeVisible();
    await page.locator('.cook-plated-box .cook-action-btn').click();
  }
  await expect(page.locator('.game-result')).toBeVisible();
  await expect(page.locator('.game-result .game-content-kicker')).toContainText('VICTORIA');
});

test('el tema sigue los cambios del sistema con almacenamiento bloqueado hasta que eliges uno', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Bloqueado', 'SecurityError');
    };
    Storage.prototype.setItem = () => {
      throw new DOMException('Bloqueado', 'SecurityError');
    };
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Modo diurno', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('una preferencia de tema inválida no impide seguir el sistema y las pestañas se sincronizan', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('festeja:theme', 'invalido'));
  await page.reload();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const other = await context.newPage();
  try {
    await other.goto('/');
    await other.getByRole('button', { name: 'Modo nocturno', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Modo nocturno', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await other.evaluate(() => localStorage.removeItem('festeja:theme'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  } finally {
    await other.close();
  }
});

test('los récords dañados no impiden abrir juegos ni guardar una nueva partida', async ({
  page,
}) => {
  const holiday = getHolidays(new Date().getFullYear()).find(
    (item) => item.game.type === 'stacker',
  );
  await page.addInitScript(
    ({ id }) => {
      localStorage.setItem(
        'festeja:records:v2',
        JSON.stringify({
          [id]: {
            bestScore: { toString: null, valueOf: null },
            stars: { toString: null },
            won: 'false',
          },
          rota: null,
        }),
      );
    },
    { id: holiday.id },
  );
  await openGame(page, 'stacker');
  await page.getByRole('button', { name: 'Empezar a construir', exact: true }).click();
  await page.keyboard.press('Space');
  await expect(stat(page, 'NIVEL')).toHaveText(/1\//);
  await page.waitForTimeout(170);
  await page.keyboard.press('Space');
  await expect(page.locator('.game-result')).toBeVisible();
  const record = await page.evaluate(
    (id) => JSON.parse(localStorage.getItem('festeja:records:v2'))[id],
    holiday.id,
  );
  expect(record.bestScore).toBeGreaterThan(0);
  expect(typeof record.stars).toBe('number');
  expect(record.won).toBe(false);
});
