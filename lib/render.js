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
.frame{position:absolute;top:0;left:0;width:100%;height:100%;box-sizing:border-box;padding:1.6vmin;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-flex-direction:column;flex-direction:column}
.rot90{width:100vh;height:100vw;-webkit-transform-origin:0 0;transform-origin:0 0;-webkit-transform:rotate(90deg) translateY(-100%);transform:rotate(90deg) translateY(-100%)}
.rot270{width:100vh;height:100vw;-webkit-transform-origin:0 0;transform-origin:0 0;-webkit-transform:rotate(-90deg) translateX(-100%);transform:rotate(-90deg) translateX(-100%)}
.bar{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;justify-content:space-between;font-size:2.6vmin;font-weight:bold;letter-spacing:.3vmin;border-bottom:.5vmin solid #000;padding-bottom:1vmin;margin-bottom:1.4vmin}
.bar.bottom{border-bottom:0;border-top:.3vmin dashed #000;padding:1vmin 0 0;margin:1.4vmin 0 0;font-weight:normal}
.grid{-webkit-box-flex:1;-webkit-flex:1;flex:1;display:-webkit-box;display:-webkit-flex;display:flex;min-height:0}
.col-main{-webkit-box-flex:3;-webkit-flex:3;flex:3;display:-webkit-box;display:-webkit-flex;display:flex;min-width:0}
.col-side{-webkit-box-flex:2;-webkit-flex:2;flex:2;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-orient:vertical;-webkit-flex-direction:column;flex-direction:column;margin-left:1.6vmin;min-width:0}
.col-side.solo{margin-left:0}
.col-main .panel,.col-side .panel{-webkit-box-flex:1;-webkit-flex:1;flex:1}
.col-side .panel+.panel{margin-top:1.6vmin}
.footer-slot{margin-top:1.6vmin}
.panel{position:relative;border:.5vmin solid #000;box-sizing:border-box;padding:4.6vmin 2vmin 1.6vmin;overflow:hidden}
.panel:after{content:"";position:absolute;right:0;bottom:0;width:0;height:0;border-style:solid;border-width:0 0 3vmin 3vmin;border-color:transparent transparent #000 transparent}
.tag{position:absolute;top:0;left:0;background:#000;color:#fff;font-size:2.2vmin;font-weight:bold;letter-spacing:.3vmin;padding:.6vmin 1.4vmin}
.clock{font-size:26vmin;font-weight:bold;line-height:1;letter-spacing:-1vmin;margin-top:2vmin}
.date{font-size:4.4vmin;font-weight:bold;margin-top:2vmin;text-transform:uppercase;border-top:.3vmin dashed #000;padding-top:1.4vmin}
.dim{font-size:2.4vmin;color:#555;margin-top:1.2vmin;letter-spacing:.2vmin}
.warn{font-size:3.4vmin;font-weight:bold}
.wx-now{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center}
.wx-temp{font-size:13vmin;font-weight:bold;line-height:1;margin-right:2vmin}
.wx-desc{font-size:3.6vmin;font-weight:bold;text-transform:uppercase}
.wx-meta{font-size:2.4vmin;border-top:.3vmin dashed #000;border-bottom:.3vmin dashed #000;padding:.8vmin 0;margin:1.2vmin 0}
.wx-next{width:100%;border-collapse:collapse;font-size:2.8vmin}
.wx-next td{padding:.5vmin .6vmin;border-bottom:.2vmin dotted #000}
.wx-next .r{text-align:right;font-weight:bold}
.report{font-size:3.4vmin;font-style:italic;line-height:1.35}
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
  const s = cfg.slots;
  const main = moduleHtml(s.main, cfg, ctx);
  const side = [moduleHtml(s.side1, cfg, ctx), moduleHtml(s.side2, cfg, ctx)].filter(Boolean).join('');
  const footer = moduleHtml(s.footer, cfg, ctx);
  const rot = cfg.rotation === 90 ? ' rot90' : cfg.rotation === 270 ? ' rot270' : '';
  const hasClock = Object.values(s).includes('clock');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="${cfg.refreshMinutes * 60}">
<meta name="robots" content="noindex,nofollow">
<title>AG Nova Slate Hub // ${esc(cfg.terminalId)}</title>
<style>${CSS}</style></head>
<body><div class="frame${rot}">
<div class="bar"><span>AG NOVA SLATE HUB // N.O.V.A. OS</span><span>TERMINAL ${esc(cfg.terminalId)} // STARDATE ${stardate}</span></div>
<div class="grid">${main ? `<div class="col-main">${main}</div>` : ''}${side ? `<div class="col-side${main ? '' : ' solo'}">${side}</div>` : ''}</div>
${footer ? `<div class="footer-slot">${footer}</div>` : ''}
<div class="bar bottom"><span>LINK ACTIVE &middot; SYNC ${pad(z.h)}:${pad(z.mi)}</span><span>NEXT SYNC +${cfg.refreshMinutes} MIN</span></div>
</div>${hasClock ? clockScript(now.getTime(), offsetMinutes(now, cfg.timezone), cfg.clock.hour24) : ''}</body></html>`;
}

export async function buildDashboardHtml(cfg) {
  const needsWeather = Object.values(cfg.slots).includes('weather');
  const weather = needsWeather ? await getWeather(cfg.weather) : null;
  return renderDashboard(cfg, weather, new Date());
}
