import test from 'node:test';
import assert from 'node:assert/strict';
import {
  easterSunday,
  formatLongDate,
  getHolidays,
  getMonthCells,
  isoDate,
  REGIONS,
} from '../src/calendar.js';

test('calcula correctamente el Domingo de Resurrección en fechas conocidas', () => {
  assert.equal(easterSunday(2024).toISOString().slice(0, 10), '2024-03-31');
  assert.equal(easterSunday(2025).toISOString().slice(0, 10), '2025-04-20');
  assert.equal(easterSunday(2026).toISOString().slice(0, 10), '2026-04-05');
});

test('genera los festivos nacionales y el Viernes Santo para 2026', () => {
  const holidays = getHolidays(2026);
  assert.equal(holidays.length, 10);
  assert.ok(holidays.some((holiday) => holiday.name === 'Viernes Santo' && holiday.date === '2026-04-03'));
  assert.ok(holidays.every((holiday) => holiday.scope === 'national'));
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

test('todos los festivos tienen un minijuego y fechas ISO válidas', () => {
  for (const region of REGIONS) {
    const holidays = getHolidays(2026, region.id);
    assert.ok(holidays.length >= 10, `${region.label} debería incluir los festivos nacionales`);
    assert.ok(holidays.every((holiday) => /^2026-\d{2}-\d{2}$/.test(holiday.date)));
    assert.ok(holidays.every((holiday) => ['memory', 'order', 'quiz'].includes(holiday.game.type)));
    for (const holiday of holidays) {
      if (holiday.game.type === 'memory') assert.ok(holiday.game.pairs.length >= 3);
      if (holiday.game.type === 'order') assert.ok(holiday.game.steps.length >= 3);
      if (holiday.game.type === 'quiz') {
        assert.equal(holiday.game.questions.length, 3);
        assert.ok(holiday.game.questions.every((question) => question.options.length === 3 && question.options[question.answer]));
      }
    }
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
