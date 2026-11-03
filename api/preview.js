import { sanitizeConfig } from '../lib/config.js';
import { allow, html, json, readJson } from '../lib/http.js';
import { buildDashboardHtml } from '../lib/render.js';
import { hasSession } from '../lib/security.js';

// Live preview of unsaved configuration draft
export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  if (!hasSession(req)) return json(res, 401, { error: 'Unauthorized' });
  html(res, 200, await buildDashboardHtml(sanitizeConfig(await readJson(req))));
}
