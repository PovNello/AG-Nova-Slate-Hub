// Minimal HTTP helpers over Node req/res: zero frameworks
export function send(res, status, body, type = 'application/json; charset=utf-8', extra = {}) {
  res.statusCode = status;
  res.setHeader('content-type', type);
  res.setHeader('cache-control', 'no-store');
  for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

export const json = (res, status, obj, extra) => send(res, status, obj, undefined, extra);
export const html = (res, status, str) => send(res, status, str, 'text/html; charset=utf-8');

export function allow(req, res, methods) {
  if (methods.includes(req.method)) return true;
  json(res, 405, { error: 'Method not allowed' }, { allow: methods.join(', ') });
  return false;
}

// Works whether Vercel pre-parsed the body or it arrives as a stream
export async function readJson(req, limit = 64 * 1024) {
  const b = req.body;
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  let raw = typeof b === 'string' ? b : Buffer.isBuffer(b) ? b.toString('utf8') : null;
  if (raw === null) {
    raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > limit) return null;
    }
  }
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export const query = (req) => new URL(req.url, 'http://local').searchParams;

export function cookie(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}
