export const PROGRESS_KEY = 'festeja:records:v2';

function finiteNumber(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function clampStars(value) {
  return Math.max(0, Math.min(3, Math.floor(finiteNumber(value))));
}

export function normalizeRecords(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, record]) => record && typeof record === 'object' && !Array.isArray(record))
      .map(([id, record]) => [
        id,
        {
          bestScore: Math.max(0, Math.round(finiteNumber(record.bestScore))),
          stars: clampStars(record.stars),
          won: record.won === true,
        },
      ]),
  );
}

export function loadRecords(storage) {
  try {
    const raw = (storage ?? window.localStorage).getItem(PROGRESS_KEY);
    return normalizeRecords(raw ? JSON.parse(raw) : null);
  } catch {
    // Almacenamiento bloqueado, datos dañados o ejecución sin navegador.
    return {};
  }
}

export function saveRecords(records, storage) {
  try {
    (storage ?? window.localStorage).setItem(
      PROGRESS_KEY,
      JSON.stringify(normalizeRecords(records)),
    );
  } catch {
    // Los récords de esta sesión siguen funcionando aunque no puedan guardarse.
  }
}
