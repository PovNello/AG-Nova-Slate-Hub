import { getConfig } from '../lib/config.js';
import { allow, html, query, send } from '../lib/http.js';
import { buildDashboardHtml } from '../lib/render.js';
import { safeEqual } from '../lib/security.js';

// Reached at /dashboard?k=TOKEN via the rewrite rule in vercel.json
export default async function handler(req, res) {
  if (!allow(req, res, ['GET', 'HEAD'])) return;
  if (!safeEqual(query(req).get('k') || '', process.env.DASHBOARD_TOKEN || '')) {
    return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  }
  html(res, 200, await buildDashboardHtml(await getConfig()));
}
