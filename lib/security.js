import crypto from 'node:crypto';
import { cookie } from './http.js';

export const SESSION_COOKIE = 'nova_admin';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

// Constant-time string comparison safe against timing attacks even with mismatched lengths
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is missing');
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function isValidSession(value) {
  if (!value || typeof value !== 'string') return false;
  const [exp, sig] = value.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  try { return safeEqual(sig, sign(exp)); } catch { return false; }
}

export const hasSession = (req) => isValidSession(cookie(req, SESSION_COOKIE));

export function sessionCookie() {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return `${SESSION_COOKIE}=${exp}.${sign(exp)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export const clearSessionCookie = () => `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return String((fwd ? String(fwd).split(',')[0] : req.headers['x-real-ip']) || 'unknown').trim();
}
