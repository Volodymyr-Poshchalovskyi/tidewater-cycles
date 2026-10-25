import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES, getBike, validateDates, isBlocked, checkAvailability, validateCustomer, makeReference } from '../api/_lib.js';

const today = '2026-10-25';
const iso = t => new Date(t).toISOString().slice(0, 10);

test('data has six bikes with required fields', () => {
  assert.equal(BIKES.length, 6);
  for (const b of BIKES) for (const k of ['id', 'name', 'type', 'pricePerDay', 'description', 'specs', 'image']) assert.ok(b[k], `${b.id} missing ${k}`);
  assert.equal(getBike('coast-cruiser').type, 'cruiser');
  assert.equal(getBike('nope'), undefined);
});

test('validateDates rejects bad input', () => {
  assert.equal(validateDates('', '', today).ok, false);
  assert.equal(validateDates('2026-10-20', '2026-10-22', today).fields.from, 'Pickup date cannot be in the past');
  assert.equal(validateDates('2026-10-27', '2026-10-27', today).fields.to, 'Return date must be after pickup');
  assert.equal(validateDates('2026-10-27', '2026-11-20', today).fields.to, 'Maximum rental is 14 days');
  assert.equal(validateDates('not-a-date', '2026-10-27', today).fields.from, 'Enter a valid date');
});

test('validateDates counts days', () => {
  assert.deepEqual(validateDates('2026-10-27', '2026-10-30', today), { ok: true, days: 3 });
});

test('isBlocked is deterministic and sparse', () => {
  assert.equal(isBlocked('coast-cruiser', '2026-11-03'), isBlocked('coast-cruiser', '2026-11-03'));
  let blocked = 0;
  for (let d = 1; d <= 30; d++) if (isBlocked('coast-cruiser', `2026-11-${String(d).padStart(2, '0')}`)) blocked++;
  assert.ok(blocked >= 1 && blocked <= 10, `blocked=${blocked}`);
});

test('checkAvailability prices with weekly discount', () => {
  let from, to;
  for (let d = 1; d < 60 && !from; d++) {
    const start = Date.UTC(2026, 10, d);
    const days = Array.from({ length: 7 }, (_, i) => iso(start + i * 864e5));
    if (days.every(x => !isBlocked('road-carbon', x))) { from = days[0]; to = iso(start + 7 * 864e5); }
  }
  assert.ok(from, 'no free week found');
  const q = checkAvailability('road-carbon', from, to, today);
  assert.equal(q.available, true);
  assert.equal(q.days, 7);
  assert.equal(q.pricePerDay, 55);
  assert.equal(q.discount, Math.round(55 * 7 * 0.15));
  assert.equal(q.total, 55 * 7 - Math.round(55 * 7 * 0.15));
});

test('checkAvailability reports blocked dates and unknown bike', () => {
  assert.equal(checkAvailability('nope', '2026-10-27', '2026-10-28', today).reason, 'Unknown bike');
  let day;
  for (let d = 1; d <= 31 && !day; d++) { const x = `2026-12-${String(d).padStart(2, '0')}`; if (isBlocked('coast-cruiser', x)) day = x; }
  assert.ok(day, 'no blocked day found');
  const next = iso(Date.parse(day) + 864e5);
  const q = checkAvailability('coast-cruiser', day, next, today);
  assert.equal(q.available, false);
  assert.match(q.reason, /not available/i);
});

test('validateCustomer', () => {
  assert.deepEqual(validateCustomer({ name: 'Al', email: 'al@example.com' }), { ok: true, fields: {} });
  const r = validateCustomer({ name: 'A', email: 'nope' });
  assert.equal(r.ok, false);
  assert.equal(r.fields.name, 'Enter your full name');
  assert.equal(r.fields.email, 'Enter a valid email');
});

test('makeReference format', () => {
  assert.match(makeReference(), /^TW-[A-Z0-9]{6}$/);
});
