import { describeCode, getWeather } from './weather.js';

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

const panel = (id, label, body, extra = '') =>
  `<section class="panel ${extra}"><div class="tag">[${id}] ${label}</div><div class="body">${body}</div></section>`;

function clockModule(cfg, z, now) {
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: cfg.timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);
  return panel('CHR', 'CHRONOMETER',
    `<div class="clock" id="nova-clock">${timeText(z.h, z.mi, cfg.clock.hour24)}</div>` +
    (cfg.clock.showDate ? `<div class="date">${esc(date)}</div>` : '') +
    `<div class="dim">ZONE ${esc(cfg.timezone.toUpperCase())}</div>`, 'm-clock');
}

function weatherModule(cfg, w) {
  const title = 'ATMOS // ' + esc(cfg.weather.label.toUpperCase());
  if (!w || !w.ok) return panel('ATM', title, '<div class="warn">! WEATHER TELEMETRY OFFLINE</div><div class="dim">Next retry at upcoming refresh cycle</div>', 'm-weather');
  const rows = w.next.map((n) =>
    `<tr><td>${n.time}</td><td class="r">${n.temp}&deg;</td><td>${esc(describeCode(n.code))}</td><td class="r">${n.rain == null ? '' : n.rain + '%'}</td></tr>`
  ).join('');
  return panel('ATM', title,
    `<div class="wx-now"><span class="wx-temp">${w.temp}&deg;</span><span class="wx-desc">${esc(describeCode(w.code))}</span></div>` +
    `<div class="wx-meta">MIN ${w.min}&deg; / MAX ${w.max}&deg; &middot; FEELS ${w.feels}&deg; &middot; HUM ${w.humidity}% &middot; WIND ${w.wind} km/h</div>` +
    (rows ? `<table class="wx-next">${rows}</table>` : ''), 'm-weather');
}

function reportModule(cfg) {
  const lines = cfg.report.lines;
  const line = lines[Math.floor(Math.random() * lines.length)];
  return panel('NVA', 'N.O.V.A. REPORT', `<div class="report">&ldquo;${esc(line)}&rdquo;</div>`, 'm-report');
}

function moduleHtml(type, cfg, ctx) {
  if (type === 'clock') return clockModule(cfg, ctx.z, ctx.now);
  if (type === 'weather') return weatherModule(cfg, ctx.weather);
  if (type === 'report') return reportModule(cfg);
  return '';
}

// CSS with -webkit- prefixes for legacy Kindle WebKit browser engine
const CSS = `
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#fff;color:#000}
body{font-family:"Courier New",Courier,monospace}
.frame{position:absolute;top:0;left:0;width:100%;height:100%;box-sizing:border-box;padding:1.4vmin;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column}
.rot90{width:100vh;height:100vw;-webkit-transform-origin:0 0;transform-origin:0 0;-webkit-transform:rotate(90deg) translateY(-100%);transform:rotate(90deg) translateY(-100%)}
.rot270{width:100vh;height:100vw;-webkit-transform-origin:0 0;transform-origin:0 0;-webkit-transform:rotate(-90deg) translateX(-100%);transform:rotate(-90deg) translateX(-100%)}

.bar{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between;font-size:2vmin;font-weight:bold;letter-spacing:.12vmin;border-bottom:.4vmin solid #000;padding-bottom:.6vmin;margin-bottom:1vmin;white-space:nowrap;overflow:hidden}
.bar.bottom{border-bottom:0;border-top:.25vmin dashed #000;padding:.6vmin 0 0;margin:1vmin 0 0;font-weight:normal}

/* Portrait Grid Engine */
.grid-portrait{-webkit-box-flex:1;-webkit-flex:1;flex:1;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;min-height:0}
.grid-portrait .slot-row{-webkit-box-flex:1;-webkit-flex:1;flex:1;display:-webkit-box;display:-webkit-flex;display:flex;min-height:0}
.grid-portrait .slot-row+.slot-row{margin-top:1.2vmin}
.grid-portrait .slot-row .panel{width:100%;height:100%}

/* Landscape Grid Engine */
.grid{-webkit-box-flex:1;-webkit-flex:1;flex:1;display:-webkit-box;display:-webkit-flex;display:flex;min-height:0}
.col-main{-webkit-box-flex:3;-webkit-flex:3;flex:3;display:-webkit-box;display:-webkit-flex;display:flex;min-width:0}
.col-side{-webkit-box-flex:2;-webkit-flex:2;flex:2;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;margin-left:1.6vmin;min-width:0}
.col-side.solo{margin-left:0}
.col-main .panel,.col-side .panel{-webkit-box-flex:1;-webkit-flex:1;flex:1}
.col-side .panel+.panel{margin-top:1.6vmin}
.footer-slot{margin-top:1.6vmin}

/* Universal Panel Structure */
.panel{position:relative;border:.4vmin solid #000;box-sizing:border-box;padding:3.8vmin 1.8vmin 1.2vmin;overflow:hidden;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;min-height:0}
.panel:after{content:"";position:absolute;right:0;bottom:0;width:0;height:0;border-style:solid;border-width:0 0 2.4vmin 2.4vmin;border-color:transparent transparent #000 transparent}
.tag{position:absolute;top:0;left:0;background:#000;color:#fff;font-size:1.9vmin;font-weight:bold;letter-spacing:.15vmin;padding:.4vmin 1.2vmin}
.body{-webkit-box-flex:1;-webkit-flex:1;flex:1;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;flex-direction:column;min-height:0;overflow:hidden}

/* Chronometer Module */
.m-clock .body{-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between}
.is-portrait .clock{font-size:15vmin;font-weight:bold;line-height:1;letter-spacing:-.4vmin;margin:auto 0;white-space:nowrap}
.is-portrait .date{font-size:2.8vmin;font-weight:bold;text-transform:uppercase;border-top:.25vmin dashed #000;padding-top:.8vmin;margin-top:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.is-portrait .dim{font-size:1.9vmin;color:#444;margin-top:.6vmin;letter-spacing:.12vmin;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.is-landscape .clock{font-size:24vmin;font-weight:bold;line-height:1;letter-spacing:-1vmin;margin-top:1vmin}
.is-landscape .date{font-size:4vmin;font-weight:bold;margin-top:1.4vmin;text-transform:uppercase;border-top:.3vmin dashed #000;padding-top:1vmin}
.is-landscape .dim{font-size:2.2vmin;color:#444;margin-top:.8vmin;letter-spacing:.18vmin}

/* Weather Module */
.m-weather .body{-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between}
.wx-now{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center}
.is-portrait .wx-temp{font-size:8.5vmin;font-weight:bold;line-height:1;margin-right:1.4vmin}
.is-portrait .wx-desc{font-size:2.6vmin;font-weight:bold;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.is-portrait .wx-meta{font-size:1.8vmin;border-top:.25vmin dashed #000;border-bottom:.25vmin dashed #000;padding:.5vmin 0;margin:.6vmin 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.is-portrait .wx-next{width:100%;border-collapse:collapse;font-size:2vmin}
.is-portrait .wx-next td{padding:.2vmin .4vmin;border-bottom:.2vmin dotted #000;line-height:1.2}
.is-portrait .wx-next .r{text-align:right;font-weight:bold}

.is-landscape .wx-temp{font-size:12vmin;font-weight:bold;line-height:1;margin-right:2vmin}
.is-landscape .wx-desc{font-size:3.4vmin;font-weight:bold;text-transform:uppercase}
.is-landscape .wx-meta{font-size:2.2vmin;border-top:.3vmin dashed #000;border-bottom:.3vmin dashed #000;padding:.8vmin 0;margin:1vmin 0}
.is-landscape .wx-next{width:100%;border-collapse:collapse;font-size:2.6vmin}
.is-landscape .wx-next td{padding:.4vmin .6vmin;border-bottom:.2vmin dotted #000}
.is-landscape .wx-next .r{text-align:right;font-weight:bold}

.warn{font-size:2.6vmin;font-weight:bold}

/* Report Module */
.m-report .body{-webkit-box-pack:center;-webkit-justify-content:center;justify-content:center}
.is-portrait .report{font-size:2.6vmin;font-style:italic;line-height:1.35;margin:auto 0}
.is-landscape .report{font-size:3.2vmin;font-style:italic;line-height:1.35}
`;

// ES5 script: updates minute clock tick using server time offset
function clockScript(serverMs, offMin, hour24) {
  return `<script>(function(){var b=${serverMs},o=${offMin}*60000,t=new Date().getTime(),h24=${hour24 ? 'true' : 'false'};
function p(n){return n<10?'0'+n:''+n}
function k(){var d=new Date(b+(new Date().getTime()-t)+o),h=d.getUTCHours(),m=d.getUTCMinutes(),x;
if(h24){x=p(h)+':'+p(m)}else{var q=h%12;if(q===0)q=12;x=q+':'+p(m)+(h<12?' AM':' PM')}
var e=document.getElementById('nova-clock');if(e&&e.innerHTML!==x)e.innerHTML=x;
setTimeout(k,(60-d.getUTCSeconds())*1000+300)}
k()})();</script>`;
}

export function renderDashboard(cfg, weather, now = new Date()) {
  const z = zoned(now, cfg.timezone);
  const ctx = { z, now, weather };
  const doy = Math.round((Date.UTC(z.y, z.mo - 1, z.d) - Date.UTC(z.y, 0, 1)) / 864e5) + 1;
  const stardate = pad(z.y % 100) + '.' + pad(doy, 3);
  const isLandscape = cfg.orientation === 'landscape';

  let gridHtml = '';
  let hasClock = false;

  if (isLandscape) {
    const s = cfg.slots?.landscape || {};
    const main = moduleHtml(s.main, cfg, ctx);
    const side = [moduleHtml(s.side1, cfg, ctx), moduleHtml(s.side2, cfg, ctx)].filter(Boolean).join('');
    const footer = moduleHtml(s.footer, cfg, ctx);
    gridHtml = `<div class="grid">${main ? `<div class="col-main">${main}</div>` : ''}${side ? `<div class="col-side${main ? '' : ' solo'}">${side}</div>` : ''}</div>${footer ? `<div class="footer-slot">${footer}</div>` : ''}`;
    hasClock = Object.values(s).includes('clock');
  } else {
    const s = cfg.slots?.portrait || {};
    const top = moduleHtml(s.top, cfg, ctx);
    const middle = moduleHtml(s.middle, cfg, ctx);
    const bottom = moduleHtml(s.bottom, cfg, ctx);
    const rows = [top, middle, bottom].filter(Boolean).map((h) => `<div class="slot-row">${h}</div>`).join('');
    gridHtml = `<div class="grid-portrait">${rows}</div>`;
    hasClock = [s.top, s.middle, s.bottom].includes('clock');
  }

  const rot = cfg.rotation === 90 ? ' rot90' : cfg.rotation === 270 ? ' rot270' : '';
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

export async function buildDashboardHtml(cfg) {
  const isLandscape = cfg.orientation === 'landscape';
  const activeSlots = isLandscape
    ? Object.values(cfg.slots?.landscape || {})
    : Object.values(cfg.slots?.portrait || {});
  const needsWeather = activeSlots.includes('weather');
  const weather = needsWeather ? await getWeather(cfg.weather) : null;
  return renderDashboard(cfg, weather, new Date());
}
