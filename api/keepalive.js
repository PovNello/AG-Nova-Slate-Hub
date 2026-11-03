import { json } from '../lib/http.js';
import { redis } from '../lib/redis.js';

// Daily cron job (vercel.json). Vercel dispatches "Authorization: Bearer <CRON_SECRET>".
// Performs real SET + GET operations so Upstash free tier records genuine activity.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== 'Bearer ' + secret) {
    return json(res, 401, { error: 'Unauthorized' });
  }
  const r = redis();
  const stamp = new Date().toISOString();
  await r.set('nova:keepalive', stamp, { ex: 60 * 60 * 24 * 40 });
  const back = await r.get('nova:keepalive');
  json(res, back === stamp ? 200 : 500, { ok: back === stamp, stamp });
}
