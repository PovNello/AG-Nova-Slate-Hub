import { getConfig, saveConfig } from '../lib/config.js';
import { allow, json, readJson } from '../lib/http.js';
import { hasSession } from '../lib/security.js';

// GET: current config + Kindle URL. PUT: save. Both require an active session.
export default async function handler(req, res) {
  if (!allow(req, res, ['GET', 'PUT'])) return;
  if (!hasSession(req)) return json(res, 401, { error: 'Unauthorized' });

  if (req.method === 'GET') {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const token = process.env.DASHBOARD_TOKEN;
    return json(res, 200, {
      config: await getConfig(),
      kindleUrl: token ? `https://${host}/dashboard?k=${encodeURIComponent(token)}` : null,
    });
  }
  const body = await readJson(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON' });
  json(res, 200, { config: await saveConfig(body) });
}
