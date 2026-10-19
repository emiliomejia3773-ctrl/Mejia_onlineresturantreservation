import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSlots, findFreeTable, isOpenOn, slotTimes } from '../src/utils/availability.js';

const tables = [
  { code: 'T1', area: 'indoor', seats: 2 },
  { code: 'T3', area: 'indoor', seats: 4 },
  { code: 'T7', area: 'indoor', seats: 4, outOfService: true },
  { code: 'V1', area: 'private', seats: 12 },
];

test('closed on Mondays, open Tuesday', () => {
  assert.equal(isOpenOn('2030-01-07'), false); // Monday
  assert.equal(isOpenOn('2030-01-08'), true); // Tuesday
  assert.deepEqual(slotTimes('2030-01-07'), []);
  assert.equal(slotTimes('2030-01-08')[0], '17:00');
  assert.equal(slotTimes('2030-01-08').at(-1), '21:00');
});

test('picks the smallest fitting table and skips out-of-service ones', () => {
  const t = findFreeTable({ tables, reservations: [], time: '18:00', guests: 3, area: 'indoor' });
  assert.equal(t.code, 'T3');
  assert.equal(findFreeTable({ tables, reservations: [], time: '18:00', guests: 2, area: 'indoor' }).code, 'T1');
});

test('overlapping bookings block a table, non-overlapping do not', () => {
  const res = [{ table: 'T3', time: '18:00' }];
  assert.equal(findFreeTable({ tables, reservations: res, time: '19:00', guests: 3, area: 'indoor' }), null);
  assert.equal(findFreeTable({ tables, reservations: res, time: '19:30', guests: 3, area: 'indoor' }).code, 'T3');
});

test('slots reflect capacity', () => {
  const slots = buildSlots({
    date: '2030-01-08', guests: 12, area: 'private', tables,
    reservations: [{ table: 'V1', time: '18:00' }], now: new Date('2029-12-01T12:00:00Z'),
  });
  const by = Object.fromEntries(slots.map((s) => [s.time, s.available]));
  assert.equal(by['17:00'], false); // within 90 min of 18:00
  assert.equal(by['19:30'], true);
  assert.equal(by['18:30'], false);
});

test('freeTables lists every free table, smallest first', async () => {
  const { freeTables } = await import('../src/utils/availability.js');
  const more = [...tables, { code: 'T4', area: 'indoor', seats: 4 }];
  const list = freeTables({ tables: more, reservations: [{ table: 'T3', time: '18:00' }], time: '18:30', guests: 3, area: 'indoor' });
  assert.deepEqual(list.map((t) => t.code), ['T4']);
});
