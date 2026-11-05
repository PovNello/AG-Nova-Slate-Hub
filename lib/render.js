import { describeCode, getWeather } from './weather.js';
import { activeModules, rotationOf } from './config.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n, l = 2) => String(n).padStart(l, '0');

function zoned(date, tz) {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const p = {};
  for (const x of f.formatToParts(date)) p[x.type] = x.value;
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second };
}

function offsetMinutes(date, tz) {
  const z = zoned(date, tz);
  const asUtc = Date.UTC(z.y, z.mo - 1, z.d, z.h, z.mi, z.s);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

function timeText(h, m, hour24) {
  if (hour24) return pad(h) + ':' + pad(m);
  const hh = h % 12 === 0 ? 12 : h % 12;
  return hh + ':' + pad(m) + (h < 12 ? ' AM' : ' PM');
}

// `scale` sets the panel font-size in vmin; module typography is expressed in em so it follows the box size
const panel = (id, label, body, extra, scale) =>
  `<section class="panel ${extra}" style="font-size:${scale}vmin"><div class="tag">[${id}] ${label}</div><div class="body">${body}</div></section>`;

function clockModule(cfg, z, now, scale) {
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: cfg.timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);
  return panel('CHR', 'CHRONOMETER',
    `<div class="clock nova-clock">${timeText(z.h, z.mi, cfg.clock.hour24)}</div>` +
    (cfg.clock.showDate ? `<div class="date">${esc(date)}</div>` : '') +
    `<div class="dim">ZONE ${esc(cfg.timezone.toUpperCase())}</div>`, 'm-clock', scale);
}

function weatherModule(cfg, w, scale) {
  const title = 'ATMOS // ' + esc(cfg.weather.label.toUpperCase());
  if (!w || !w.ok) return panel('ATM', title, '<div class="warn">! WEATHER TELEMETRY OFFLINE</div><div class="dim">Next retry at upcoming refresh cycle</div>', 'm-weather', scale);
  const rows = w.next.map((n) =>
    `<tr><td>${n.time}</td><td class="r">${n.temp}&deg;</td><td>${esc(describeCode(n.code))}</td><td class="r">${n.rain == null ? '' : n.rain + '%'}</td></tr>`
  ).join('');
  return panel('ATM', title,
    `<div class="wx-now"><span class="wx-temp">${w.temp}&deg;</span><span class="wx-desc">${esc(describeCode(w.code))}</span></div>` +
    `<div class="wx-meta">MIN ${w.min}&deg; / MAX ${w.max}&deg; &middot; FEELS ${w.feels}&deg; &middot; HUM ${w.humidity}% &middot; WIND ${w.wind} km/h</div>` +
    (rows ? `<table class="wx-next">${rows}</table>` : ''), 'm-weather', scale);
}

function reportModule(cfg, scale) {
  const lines = cfg.report.lines;
  const line = lines[Math.floor(Math.random() * lines.length)];
  return panel('NVA', 'N.O.V.A. REPORT', `<div class="report">&ldquo;${esc(line)}&rdquo;</div>`, 'm-report', scale);
}

// ---------- Box sizing engine ----------
// Logical canvas in vmin units (Kindle Paperwhite 11 panel is 1236x1648, ratio 3:4).
// Grid area = canvas minus frame padding and the two status bars.
const LONG_SIDE = 133.3;
const GRID = {
  portrait: { w: 100 - 2.8, h: LONG_SIDE - 12 },
  landscape: { w: LONG_SIDE - 2.8, h: 100 - 12 },
};
const GAP = 1.2;
// Reference box each orientation's typography was designed for (scale = 1)
const REF = {
  portrait: { w: 97.2, h: 39.6 },
  landscape: { w: 77, h: 60 },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Big-number modules must fit both dimensions; flowing text (report) follows the box area more gently
function scaleFor(type, orientation, w, h) {
  const r = REF[orientation];
  const wr = w / r.w, hr = h / r.h;
  const s = type === 'report' ? clamp(Math.sqrt(wr * hr), 0.7, 1.4) : clamp(Math.min(wr, hr), 0.45, 1.6);
  return Math.round(s * 100) / 100;
}

function moduleHtml(type, cfg, ctx, scale) {
  if (type === 'clock') return clockModule(cfg, ctx.z, ctx.now, scale);
  if (type === 'weather') return weatherModule(cfg, ctx.weather, scale);
  if (type === 'report') return reportModule(cfg, scale);
  return '';
}

// Flex weights must be integers for the legacy -webkit-box-flex engine: heights use 0.5 steps, so x2
const flexStyle = (w) => `-webkit-box-flex:${w};-webkit-flex:${w} 1 0;flex:${w} 1 0`;

function rowsHeights(rows, gridH) {
  const total = rows.reduce((a, r) => a + r.height, 0);
  const free = gridH - GAP * (rows.length - 1);
  return rows.map((r) => (free * r.height) / total);
}

function portraitGrid(cfg, ctx) {
  // Rows whose module is "none" collapse; the remaining rows share the height by weight
  const rows = cfg.layout.portrait.rows.filter((r) => r.module !== 'none');
  const hs = rowsHeights(rows, GRID.portrait.h);
  const html = rows.map((r, i) =>
    `<div class="slot-row" style="${flexStyle(Math.round(r.height * 2))}">` +
    moduleHtml(r.module, cfg, ctx, scaleFor(r.module, 'portrait', GRID.portrait.w, hs[i])) +
    '</div>').join('');
  return `<div class="grid-rows">${html}</div>`;
}

function landscapeGrid(cfg, ctx) {
  // Rows with both columns empty collapse; a single filled column auto-expands to 100% width
  const rows = cfg.layout.landscape.rows.filter((r) => r.cols[0] !== 'none' || r.cols[1] !== 'none');
  const hs = rowsHeights(rows, GRID.landscape.h);
  const html = rows.map((r, i) => {
    const filled = r.cols.map((m, c) => ({ m, w: r.split[c] })).filter((x) => x.m !== 'none');
    const totalW = filled.reduce((a, x) => a + x.w, 0);
    const freeW = GRID.landscape.w - GAP * (filled.length - 1);
    const cells = filled.map((x) =>
      `<div class="slot-cell" style="${flexStyle(filled.length === 1 ? 1 : x.w)}">` +
      moduleHtml(x.m, cfg, ctx, scaleFor(x.m, 'landscape', filled.length === 1 ? freeW : (freeW * x.w) / totalW, hs[i])) +
      '</div>').join('');
    return `<div class="slot-row" style="${flexStyle(Math.round(r.height * 2))}">${cells}</div>`;
  }).join('');
  return `<div class="grid-rows">${html}</div>`;
}

// CSS with -webkit- prefixes for legacy Kindle WebKit browser engine.
// Frame chrome (bars, tags, borders) is in vmin. Module typography is in em and follows each panel's
// inline font-size (scale), so the same module reads well in a large row or a narrow column.
const CSS = `
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#fff;color:#000}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:400;src:url(/fonts/ibm-plex-mono-400.woff2) format("woff2"),url(/fonts/ibm-plex-mono-400.woff) format("woff")}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:700;src:url(/fonts/ibm-plex-mono-700.woff2) format("woff2"),url(/fonts/ibm-plex-mono-700.woff) format("woff")}
body{font-family:"IBM Plex Mono","Courier New",Courier,monospace}
.frame{position:absolute;top:0;left:0;width:100%;height:100%;box-sizing:border-box;padding:1.4vmin;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column}

/* Device rotation: portrait 0/180, landscape 90/270 */
.rot180{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-transform:rotate(180deg);transform:rotate(180deg)}
.rot90{width:100vh;height:100vw;-webkit-transform-origin:0 0;transform-origin:0 0;-webkit-transform:rotate(90deg) translateY(-100%);transform:rotate(90deg) translateY(-100%)}
.rot270{width:100vh;height:100vw;-webkit-transform-origin:0 0;transform-origin:0 0;-webkit-transform:rotate(-90deg) translateX(-100%);transform:rotate(-90deg) translateX(-100%)}

.bar{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between;font-size:2vmin;font-weight:bold;letter-spacing:.12vmin;border-bottom:.4vmin solid #000;padding-bottom:.6vmin;margin-bottom:1vmin;white-space:nowrap;overflow:hidden}
.bar.bottom{border-bottom:0;border-top:.25vmin dashed #000;padding:.6vmin 0 0;margin:1vmin 0 0;font-weight:normal}

/* Row engine: rows share height by weight (inline flex), cells share row width by split (inline flex) */
.grid-rows{-webkit-box-flex:1;-webkit-flex:1 1 0;flex:1 1 0;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;min-height:0}
.slot-row{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:horizontal;-webkit-flex-direction:row;flex-direction:row;min-height:0;height:0}
.slot-row+.slot-row{margin-top:1.2vmin}
.slot-row>.panel{width:100%;height:100%}
.slot-cell{display:-webkit-box;display:-webkit-flex;display:flex;min-width:0;width:0}
.slot-cell+.slot-cell{margin-left:1.2vmin}
.slot-cell>.panel{width:100%;height:100%}

/* Universal Panel Structure */
.panel{position:relative;border:.4vmin solid #000;box-sizing:border-box;padding:3.8vmin 1.8vmin 1.2vmin;overflow:hidden;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;min-height:0}
.panel:after{content:"";position:absolute;right:0;bottom:0;width:0;height:0;border-style:solid;border-width:0 0 2.4vmin 2.4vmin;border-color:transparent transparent #000 transparent}
.tag{position:absolute;top:0;left:0;background:#000;color:#fff;font-size:1.9vmin;font-weight:bold;letter-spacing:.15vmin;padding:.4vmin 1.2vmin;white-space:nowrap}
.body{-webkit-box-flex:1;-webkit-flex:1 1 0;flex:1 1 0;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;min-height:0;overflow:hidden}

/* Chronometer Module */
.m-clock .body{-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between}
.clock{font-weight:bold;line-height:1;white-space:nowrap}
.date{font-weight:bold;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dim{color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.is-portrait .clock{font-size:15em;letter-spacing:-.027em;margin:auto 0}
.is-portrait .date{font-size:2.8em;border-top:.09em dashed #000;padding-top:.29em;margin-top:auto}
.is-portrait .dim{font-size:1.9em;margin-top:.32em;letter-spacing:.06em}
.is-landscape .clock{font-size:24em;letter-spacing:-.042em;margin-top:.04em}
.is-landscape .date{font-size:4em;margin-top:.35em;border-top:.075em dashed #000;padding-top:.25em}
.is-landscape .dim{font-size:2.2em;margin-top:.36em;letter-spacing:.08em}

/* Weather Module */
.m-weather .body{-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between}
.wx-now{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center}
.wx-temp{font-weight:bold;line-height:1}
.wx-desc{font-weight:bold;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wx-meta{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wx-next{width:100%;border-collapse:collapse}
.wx-next td{border-bottom:.08em dotted #000;line-height:1.2}
.wx-next .r{text-align:right;font-weight:bold}
.is-portrait .wx-temp{font-size:8.5em;margin-right:.16em}
.is-portrait .wx-desc{font-size:2.6em}
.is-portrait .wx-meta{font-size:1.8em;border-top:.14em dashed #000;border-bottom:.14em dashed #000;padding:.28em 0;margin:.33em 0}
.is-portrait .wx-next{font-size:2em}
.is-portrait .wx-next td{padding:.1em .2em}
.is-landscape .wx-temp{font-size:12em;margin-right:.17em}
.is-landscape .wx-desc{font-size:3.4em}
.is-landscape .wx-meta{font-size:2.2em;border-top:.14em dashed #000;border-bottom:.14em dashed #000;padding:.36em 0;margin:.45em 0}
.is-landscape .wx-next{font-size:2.6em}
.is-landscape .wx-next td{padding:.15em .23em}

.warn{font-size:2.6em;font-weight:bold}

/* Report Module */
.m-report .body{-webkit-box-pack:center;-webkit-justify-content:center;justify-content:center}
.report{font-style:italic;line-height:1.35}
.is-portrait .report{font-size:2.6em;margin:auto 0}
.is-landscape .report{font-size:3.2em}
`;

// ES5 script: updates every clock element each minute using the server time offset
function clockScript(serverMs, offMin, hour24) {
  return `<script>(function(){var b=${serverMs},o=${offMin}*60000,t=new Date().getTime(),h24=${hour24 ? 'true' : 'false'};
function p(n){return n<10?'0'+n:''+n}
function k(){var d=new Date(b+(new Date().getTime()-t)+o),h=d.getUTCHours(),m=d.getUTCMinutes(),x;
if(h24){x=p(h)+':'+p(m)}else{var q=h%12;if(q===0)q=12;x=q+':'+p(m)+(h<12?' AM':' PM')}
var a=document.getElementsByTagName('div'),i;for(i=0;i<a.length;i++){if((' '+a[i].className+' ').indexOf(' nova-clock ')>-1&&a[i].innerHTML!==x)a[i].innerHTML=x}
setTimeout(k,(60-d.getUTCSeconds())*1000+300)}
k()})();</script>`;
}

// options.preview: render the logical layout without device rotation (admin preview frame
// already has the target aspect ratio, so text stays readable while editing)
export function renderDashboard(cfg, weather, now = new Date(), options = {}) {
  const z = zoned(now, cfg.timezone);
  const ctx = { z, now, weather };
  const doy = Math.round((Date.UTC(z.y, z.mo - 1, z.d) - Date.UTC(z.y, 0, 1)) / 864e5) + 1;
  const stardate = pad(z.y % 100) + '.' + pad(doy, 3);
  const isLandscape = cfg.orientation === 'landscape';

  const gridHtml = isLandscape ? landscapeGrid(cfg, ctx) : portraitGrid(cfg, ctx);
  const hasClock = activeModules(cfg).includes('clock');

  const deg = options.preview ? 0 : rotationOf(cfg);
  const rot = deg ? ' rot' + deg : '';
  const orientClass = isLandscape ? ' is-landscape' : ' is-portrait';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="${cfg.refreshMinutes * 60}">
<meta name="robots" content="noindex,nofollow">
<title>AG Nova Slate Hub // ${esc(cfg.terminalId)}</title>
<style>${CSS}</style></head>
<body><div class="frame${orientClass}${rot}">
<div class="bar"><span>AG NOVA SLATE HUB // N.O.V.A. OS</span><span>TERMINAL ${esc(cfg.terminalId)} // STARDATE ${stardate}</span></div>
${gridHtml}
<div class="bar bottom"><span>LINK ACTIVE &middot; SYNC ${pad(z.h)}:${pad(z.mi)}</span><span>NEXT SYNC +${cfg.refreshMinutes} MIN</span></div>
</div>${hasClock ? clockScript(now.getTime(), offsetMinutes(now, cfg.timezone), cfg.clock.hour24) : ''}</body></html>`;
}

export async function buildDashboardHtml(cfg, options = {}) {
  const weather = activeModules(cfg).includes('weather') ? await getWeather(cfg.weather) : null;
  return renderDashboard(cfg, weather, new Date(), options);
}
