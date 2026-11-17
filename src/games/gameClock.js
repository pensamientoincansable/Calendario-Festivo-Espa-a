// Reloj virtual de la partida. Animaciones, temporizadores y cascadas comparten
// el mismo tiempo: una pausa nunca consume segundos ni reinicia el escenario.
export function createGameClock(
  driver = {
    now: () => performance.now(),
    requestFrame: (callback) => window.requestAnimationFrame(callback),
    cancelFrame: (id) => window.cancelAnimationFrame(id),
    setTimer: (callback, ms) => window.setTimeout(callback, ms),
    clearTimer: (id) => window.clearTimeout(id),
  },
) {
  let nextId = 1;
  let pausedAt = null;
  let pausedDuration = 0;
  let nativeFrame = null;
  let lastFrame = -Infinity;
  const frames = new Map();
  const timers = new Map();
  const now = () => (pausedAt ?? driver.now()) - pausedDuration;

  function scheduleFrame() {
    if (pausedAt !== null || nativeFrame !== null || !frames.size) return;
    nativeFrame = driver.requestFrame(() => {
      nativeFrame = null;
      if (pausedAt !== null) return;
      const time = now();
      // No duplicar el coste de dibujo en pantallas Android/PC de 90–144 Hz.
      if (time - lastFrame >= 1000 / 60 - 0.5) {
        lastFrame = time;
        const ready = [...frames];
        for (const [id, callback] of ready) {
          if (!frames.delete(id)) continue;
          callback(time);
        }
      }
      scheduleFrame();
    });
  }

  function armTimer(id, task) {
    if (pausedAt !== null) return;
    task.nativeId = driver.setTimer(
      () => {
        if (!timers.delete(id)) return;
        task.callback();
      },
      Math.max(0, task.due - now()),
    );
  }

  function setTimer(callback, ms = 0) {
    const id = nextId++;
    const task = { callback, due: now() + Math.max(0, ms), nativeId: null };
    timers.set(id, task);
    armTimer(id, task);
    return id;
  }

  function clearTimer(id) {
    const task = timers.get(id);
    if (!task) return;
    if (task.nativeId !== null) driver.clearTimer(task.nativeId);
    timers.delete(id);
    task.onCancel?.();
  }

  return {
    now,
    isPaused: () => pausedAt !== null,
    requestFrame(callback) {
      const id = nextId++;
      frames.set(id, callback);
      scheduleFrame();
      return id;
    },
    cancelFrame(id) {
      frames.delete(id);
      if (!frames.size && nativeFrame !== null) {
        driver.cancelFrame(nativeFrame);
        nativeFrame = null;
      }
    },
    setTimeout: setTimer,
    clearTimeout: clearTimer,
    delay(ms) {
      return new Promise((resolve) => {
        const id = setTimer(() => resolve(true), ms);
        timers.get(id).onCancel = () => resolve(false);
      });
    },
    setPaused(paused) {
      if (paused === (pausedAt !== null)) return;
      if (paused) {
        pausedAt = driver.now();
        if (nativeFrame !== null) driver.cancelFrame(nativeFrame);
        nativeFrame = null;
        for (const task of timers.values()) {
          if (task.nativeId !== null) driver.clearTimer(task.nativeId);
          task.nativeId = null;
        }
      } else {
        pausedDuration += driver.now() - pausedAt;
        pausedAt = null;
        for (const [id, task] of timers) armTimer(id, task);
        scheduleFrame();
      }
    },
    cancelAll() {
      if (nativeFrame !== null) driver.cancelFrame(nativeFrame);
      nativeFrame = null;
      frames.clear();
      for (const id of timers.keys()) clearTimer(id);
      // Permite el ciclo montaje/limpieza/montaje de React StrictMode.
      lastFrame = -Infinity;
    },
  };
}
