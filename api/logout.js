import { allow, json } from '../lib/http.js';
import { clearSessionCookie } from '../lib/security.js';

export default function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  json(res, 200, { ok: true }, { 'set-cookie': clearSessionCookie() });
}
