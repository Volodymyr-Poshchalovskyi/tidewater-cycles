import { checkAvailability, getBike } from './_lib.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { bike, from, to } = req.query || {};
  if (!getBike(bike)) return res.status(404).json({ error: 'Unknown bike' });
  const quote = checkAvailability(bike, from, to);
  if (quote.fields) return res.status(400).json({ error: quote.reason, fields: quote.fields });
  res.status(200).json(quote);
}
