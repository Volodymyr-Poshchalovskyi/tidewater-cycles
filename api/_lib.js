// Pure booking logic: validation, fake availability, pricing. No I/O.
import { BIKES } from './_data.js';
export { BIKES };

const DAY = 864e5;
const MAX_DAYS = 14;
const WEEKLY_DISCOUNT = 0.15;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getBike(id) {
  return BIKES.find(b => b.id === id);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parse(iso) {
  if (typeof iso !== 'string' || !ISO.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

export function validateDates(from, to, today = todayISO()) {
  const fields = {};
  const f = parse(from);
  const t = parse(to);
  const now = parse(today);
  if (f === null) fields.from = 'Enter a valid date';
  if (t === null) fields.to = 'Enter a valid date';
  if (f !== null && f < now) fields.from = 'Pickup date cannot be in the past';
  if (f !== null && t !== null && t <= f) fields.to = 'Return date must be after pickup';
  const days = f !== null && t !== null ? Math.round((t - f) / DAY) : 0;
  if (days > MAX_DAYS) fields.to = `Maximum rental is ${MAX_DAYS} days`;
  if (Object.keys(fields).length) return { ok: false, error: 'Check the dates', fields };
  return { ok: true, days };
}

// Deterministic fake availability: FNV-1a hash of bike + date blocks roughly 1 day in 7.
export function isBlocked(bikeId, iso) {
  let h = 2166136261;
  for (const ch of `${bikeId}:${iso}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 7 === 0;
}

export function checkAvailability(bikeId, from, to, today = todayISO()) {
  const bike = getBike(bikeId);
  if (!bike) return { available: false, reason: 'Unknown bike' };
  const v = validateDates(from, to, today);
  if (!v.ok) return { available: false, reason: v.error, fields: v.fields };
  const start = parse(from);
  for (let i = 0; i < v.days; i++) {
    const d = new Date(start + i * DAY).toISOString().slice(0, 10);
    if (isBlocked(bikeId, d)) {
      return { available: false, days: v.days, reason: `${bike.name} is not available on ${d}. Try shifting your dates.` };
    }
  }
  const gross = bike.pricePerDay * v.days;
  const discount = v.days >= 7 ? Math.round(gross * WEEKLY_DISCOUNT) : 0;
  return { available: true, days: v.days, pricePerDay: bike.pricePerDay, discount, total: gross - discount };
}

export function validateCustomer({ name, email, phone } = {}) {
  const fields = {};
  if (typeof name !== 'string' || name.trim().length < 2) fields.name = 'Enter your full name';
  if (typeof email !== 'string' || !EMAIL.test(email.trim())) fields.email = 'Enter a valid email';
  if (phone && (typeof phone !== 'string' || phone.replace(/\D/g, '').length < 7)) fields.phone = 'Enter a valid phone number';
  return { ok: Object.keys(fields).length === 0, fields };
}

export function makeReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `TW-${s}`;
}
