import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameClock } from '../src/games/gameClock.js';
import { getNextGridIndex } from '../src/games/inputUtils.js';
import {
  isModalChromeTarget,
  observeCanvasSize,
  setupHiDPICanvas,
} from '../src/games/canvasUtils.js';
import { GAME_CONTROLS } from '../src/games/controls.js';
import { GAME_TYPES } from '../src/calendar.js';
import { getInitialTheme, THEME_KEY } from '../src/theme.js';

function fakeDriver() {
  let time = 1000;
  let nextId = 1;
  const frames = new Map();
  const timers = new Map();
  const driver = {
    now: () => time,
    requestFrame(callback) {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    },
    cancelFrame: (id) => frames.delete(id),
    setTimer(callback, ms) {
      const id = nextId++;
      timers.set(id, { callback, due: time + ms });
      return id;
    },
    clearTimer: (id) => timers.delete(id),
  };
  function advance(ms) {
    const end = time + ms;
    for (;;) {
      const task = [...timers]
        .filter(([, item]) => item.due <= end)
        .sort((a, b) => a[1].due - b[1].due)[0];
      if (!task) break;
      timers.delete(task[0]);
      time = task[1].due;
      task[1].callback();
    }
    time = end;
  }
  return {
    driver,
    advance,
    frame(ms = 1000 / 60) {
      advance(ms);
      const ready = [...frames.values()];
      frames.clear();
      ready.forEach((callback) => callback(time));
    },
    pending: () => ({ frames: frames.size, timers: timers.size }),
  };
}

test('pausar congela el tiempo virtual, los fotogramas y los temporizadores sin perder su avance', () => {
  const fake = fakeDriver();
  const clock = createGameClock(fake.driver);
  const seen = [];
  clock.setTimeout(() => seen.push('fin'), 100);
  fake.advance(40);
  clock.requestFrame((now) => seen.push(now));
  clock.setPaused(true);
  assert.equal(clock.isPaused(), true);
  assert.equal(clock.now(), 1040);
  assert.deepEqual(fake.pending(), { frames: 0, timers: 0 });
  fake.frame(60000);
  assert.deepEqual(seen, []);
  assert.equal(clock.now(), 1040);
  clock.setPaused(false);
  fake.frame(20);
  assert.deepEqual(seen, [1060]);
  fake.advance(39);
  assert.deepEqual(seen, [1060]);
  fake.advance(1);
  assert.deepEqual(seen, [1060, 'fin']);
  assert.equal(clock.now(), 1100);
});

test('los temporizadores creados durante una pausa esperan a reanudar y se pueden cancelar', () => {
  const fake = fakeDriver();
  const clock = createGameClock(fake.driver);
  let calls = 0;
  clock.setPaused(true);
  clock.setPaused(true); // Pausar dos veces no altera la duración pendiente.
  const cancelled = clock.setTimeout(() => {
    calls += 50;
  }, 1);
  clock.clearTimeout(cancelled);
  clock.setTimeout(() => {
    calls += 1;
  }, 80);
  fake.advance(5000);
  assert.equal(calls, 0);
  clock.setPaused(false);
  clock.setPaused(false);
  fake.advance(79);
  assert.equal(calls, 0);
  fake.advance(1);
  assert.equal(calls, 1);
});

test('las cascadas asíncronas también se pausan, y cancelar libera sus promesas', async () => {
  const fake = fakeDriver();
  const clock = createGameClock(fake.driver);
  let resolved = false;
  const delay = clock.delay(210).then((value) => {
    resolved = value;
  });
  fake.advance(100);
  clock.setPaused(true);
  fake.advance(5000);
  await Promise.resolve();
  assert.equal(resolved, false);
  clock.setPaused(false);
  fake.advance(110);
  await delay;
  assert.equal(resolved, true);
  const cancelledDelay = clock.delay(500);
  clock.cancelAll();
  assert.equal(await cancelledDelay, false);
  assert.deepEqual(fake.pending(), { frames: 0, timers: 0 });
});

test('el reloj limita el dibujo a 60 Hz, comparte un RAF y permite desmontar/remontar en StrictMode', () => {
  const fake = fakeDriver();
  const clock = createGameClock(fake.driver);
  const times = [];
  const loop = (now) => {
    times.push(now);
    clock.requestFrame(loop);
  };
  const cancelled = clock.requestFrame(() =>
    assert.fail('Un fotograma cancelado no debe ejecutarse'),
  );
  clock.cancelFrame(cancelled);
  clock.requestFrame(loop);
  assert.equal(fake.pending().frames, 1);
  for (let i = 0; i < 120; i += 1) fake.frame(1000 / 120);
  assert.ok(times.length >= 59 && times.length <= 61, `${times.length} dibujos por segundo`);
  assert.ok(times.slice(1).every((time, index) => time - times[index] >= 16));
  clock.cancelAll();
  assert.deepEqual(fake.pending(), { frames: 0, timers: 0 });
  let remounted = false;
  clock.requestFrame(() => {
    remounted = true;
  });
  fake.frame();
  assert.equal(remounted, true);
  clock.cancelAll();
});

test('la navegación de los puzles respeta filas, bordes y atajos Inicio/Fin', () => {
  assert.equal(getNextGridIndex(0, 'ArrowLeft', 7), 0);
  assert.equal(getNextGridIndex(6, 'ArrowRight', 7), 6);
  assert.equal(getNextGridIndex(8, 'ArrowUp', 7), 1);
  assert.equal(getNextGridIndex(48, 'ArrowDown', 7), 48);
  assert.equal(getNextGridIndex(11, 'Home', 7), 7);
  assert.equal(getNextGridIndex(11, 'End', 7), 13);
  assert.equal(getNextGridIndex(11, 'Home', 7, true), 0);
  assert.equal(getNextGridIndex(11, 'End', 7, true), 48);
  assert.equal(getNextGridIndex(11, 'Space', 7), null);
});

test('todos los tipos tienen ayuda específica de teclado y táctil', () => {
  for (const type of GAME_TYPES) {
    assert.ok(GAME_CONTROLS[type]?.tip, `Falta consejo de ${type}`);
    for (const device of ['pc', 'touch']) {
      assert.ok(GAME_CONTROLS[type][device].length > 0, `Faltan controles ${device} de ${type}`);
      assert.ok(GAME_CONTROLS[type][device].every(([label, description]) => label && description));
    }
  }
});

test('el lienzo se adapta a la resolución visible y limita la memoria en pantalla completa', () => {
  const oldWindow = globalThis.window;
  const oldObserver = globalThis.ResizeObserver;
  let resize;
  let disconnected = false;
  let transform;
  globalThis.window = { devicePixelRatio: 3 };
  globalThis.ResizeObserver = class {
    constructor(callback) {
      resize = callback;
    }
    observe() {}
    disconnect() {
      disconnected = true;
    }
  };
  try {
    const canvas = {
      clientWidth: 1000,
      clientHeight: 620,
      width: 0,
      height: 0,
      getContext: () => ({
        setTransform: (...args) => {
          transform = args;
        },
      }),
    };
    const cleanup = observeCanvasSize(canvas);
    setupHiDPICanvas(canvas, 500, 310);
    assert.equal(canvas.width, 2000);
    assert.equal(canvas.height, 1240);
    assert.deepEqual(transform, [4, 0, 0, 4, 0, 0]);
    resize([{ contentRect: { width: 2000, height: 1240 } }]);
    setupHiDPICanvas(canvas, 500, 310);
    assert.ok(canvas.width * canvas.height <= 2504000);
    cleanup();
    assert.equal(disconnected, true);
  } finally {
    globalThis.window = oldWindow;
    globalThis.ResizeObserver = oldObserver;
  }
});

test('los botones, SVG del menú y modificadores no disparan acciones globales del juego', () => {
  const oldElement = globalThis.Element;
  class FakeElement {
    constructor(chrome = false, button = false) {
      this.chrome = chrome;
      this.button = button;
    }
    closest(selector) {
      return selector.includes('[data-game-chrome]') ? this.chrome : this.button;
    }
  }
  globalThis.Element = FakeElement;
  try {
    assert.equal(isModalChromeTarget({ code: 'Space', target: new FakeElement(true) }), true);
    assert.equal(
      isModalChromeTarget({ code: 'Space', target: new FakeElement(false, true) }),
      true,
    );
    assert.equal(
      isModalChromeTarget({ code: 'ArrowLeft', target: new FakeElement(false, true) }),
      false,
    );
    assert.equal(isModalChromeTarget({ defaultPrevented: true }), true);
    assert.equal(isModalChromeTarget({ ctrlKey: true, code: 'Space' }), true);
  } finally {
    globalThis.Element = oldElement;
  }
});

test('el aspecto respeta la preferencia guardada, el sistema y el almacenamiento bloqueado', () => {
  const oldStorage = globalThis.localStorage;
  const oldWindow = globalThis.window;
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  try {
    globalThis.localStorage = {
      getItem: (key) => {
        assert.equal(key, THEME_KEY);
        return 'light';
      },
    };
    assert.equal(getInitialTheme(), 'light');
    globalThis.localStorage = { getItem: () => 'dark' };
    assert.equal(getInitialTheme(), 'dark');
    globalThis.localStorage = { getItem: () => 'invalido' };
    assert.equal(getInitialTheme(), 'dark');
    globalThis.localStorage = {
      getItem: () => {
        throw new Error('Almacenamiento bloqueado');
      },
    };
    assert.equal(getInitialTheme(), 'dark');
  } finally {
    globalThis.localStorage = oldStorage;
    globalThis.window = oldWindow;
  }
});
