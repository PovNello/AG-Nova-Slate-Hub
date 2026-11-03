import { allow, json, readJson } from '../lib/http.js';
import { registerAttempt, resetAttempts } from '../lib/ratelimit.js';
import { clientIp, safeEqual, sessionCookie } from '../lib/security.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  const expected = process.env.ADMIN_PIN;
  if (!expected || !process.env.SESSION_SECRET) {
    return json(res, 500, { error: 'ADMIN_PIN or SESSION_SECRET not configured' });
  }
  const ip = clientIp(req);
  // Attempt is counted before comparison: while locked out even the correct PIN is rejected
  const rl = await registerAttempt(ip);
  if (!rl.allowed) {
    return json(res, 429, { error: 'Too many attempts', retryAfter: rl.retryAfter }, { 'retry-after': String(rl.retryAfter) });
  }
  const body = await readJson(req);
  if (!safeEqual(String(body?.pin ?? ''), expected)) {
    return json(res, 401, { error: 'Invalid PIN', remaining: rl.remaining });
  }
  await resetAttempts(ip);
  json(res, 200, { ok: true }, { 'set-cookie': sessionCookie() });
}
