import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampStars,
  loadRecords,
  normalizeRecords,
  PROGRESS_KEY,
  saveRecords,
} from '../src/records.js';

test('normaliza los récords antiguos sin perder las puntuaciones válidas', () => {
  assert.deepEqual(normalizeRecords({ carnaval: { bestScore: '123.7', stars: '2', won: true } }), {
    carnaval: { bestScore: 124, stars: 2, won: true },
  });
});

test('los valores dañados del almacenamiento no se convierten en puntuaciones ni victorias', () => {
  const records = JSON.parse(
    '{"fiesta":{"bestScore":{"toString":null,"valueOf":null},"stars":{},"won":"false"},"otra":{"bestScore":-8,"stars":100,"won":false},"nula":null,"lista":[],"texto":"error"}',
  );
  assert.deepEqual(normalizeRecords(records), {
    fiesta: { bestScore: 0, stars: 0, won: false },
    otra: { bestScore: 0, stars: 3, won: false },
  });
  for (const value of [null, [], 'error', 2]) assert.deepEqual(normalizeRecords(value), {});
  for (const value of [NaN, Infinity, -Infinity, {}, [], null]) assert.equal(clampStars(value), 0);
});

test('cargar récords acepta datos válidos y recupera errores de JSON o almacenamiento', () => {
  const storage = {
    getItem: (key) => {
      assert.equal(key, PROGRESS_KEY);
      return '{"fiesta":{"bestScore":42,"stars":1,"won":true}}';
    },
  };
  assert.equal(loadRecords(storage).fiesta.bestScore, 42);
  assert.deepEqual(loadRecords({ getItem: () => '{json roto' }), {});
  assert.deepEqual(loadRecords({ getItem: () => null }), {});
  assert.deepEqual(
    loadRecords({
      getItem: () => {
        throw new Error('Bloqueado');
      },
    }),
    {},
  );
});

test('guardar elimina valores no válidos y tolera cuotas agotadas o almacenamiento bloqueado', () => {
  let saved;
  saveRecords(
    { fiesta: { bestScore: Infinity, stars: 2.8, won: true } },
    {
      setItem: (key, value) => {
        assert.equal(key, PROGRESS_KEY);
        saved = JSON.parse(value);
      },
    },
  );
  assert.deepEqual(saved, { fiesta: { bestScore: 0, stars: 2, won: true } });
  assert.doesNotThrow(() =>
    saveRecords(
      {},
      {
        setItem: () => {
          throw new Error('Cuota agotada');
        },
      },
    ),
  );
});
