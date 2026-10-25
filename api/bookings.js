import { checkAvailability, getBike, validateCustomer, makeReference } from './_lib.js';
import { PICKUP_ADDRESS } from './_data.js';

// Validates and prices a booking. Nothing is stored; the client keeps its own history.
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const { bike, from, to, name, email, phone } = body;
  const b = getBike(bike);
  if (!b) return res.status(404).json({ error: 'Unknown bike' });
  const quote = checkAvailability(bike, from, to);
  const customer = validateCustomer({ name, email, phone });
  if (quote.fields || !customer.ok) {
    return res.status(400).json({ error: 'Please fix the highlighted fields', fields: { ...(quote.fields || {}), ...customer.fields } });
  }
  if (!quote.available) return res.status(409).json({ error: quote.reason });
  res.status(201).json({
    reference: makeReference(),
    bike: { id: b.id, name: b.name },
    from, to,
    days: quote.days,
    discount: quote.discount,
    total: quote.total,
    pickup: PICKUP_ADDRESS,
    name: name.trim(),
  });
}
