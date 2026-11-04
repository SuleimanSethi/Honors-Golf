// The embroidery designer (UI-36, spec AI-3) and the stitched preview (UI-37, AI-4): one shared piece for everything
// embroidered (D-139). The hat page uses it for direct embroidery and the embroidered patch; the towel, caddy kit and
// apparel pages reuse it in their own rounds. It knows nothing about any page: a page hands it the artwork, the area
// and the product's color, and gets back the parts, a stitch plan, the problems with their fixes, and stitches painted
// from that plan.
//
//   var E = window.HonorsEmbroidery;
//   var result = E.stitch({
//     art: canvas,                     // the artwork fitted to the area, in its own colors, on a transparent ground
//     layers: [{ id, name, canvas }],  // optional: parts the page already knows (else a logo is split by its colors)
//     kind: 'logo' | 'text' | 'monogram',
//     area: { x, y, w, h },            // where the area is on `art`, in canvas pixels
//     inches: { w, h },                // the area's real size
//     pxPerInch: 256,
//     base: '#F4F4F6',                 // the product under the stitches (hat crown, patch, towel)
//     ground: 'hat',                   // what to call it in the flags ('hat', 'patch', 'towel'; 'fabric' if left out)
//     choices: { parts: { id: { thread } }, kept: { issueKey: true } },   // what the buyer picked (or {})
//     letters: { font: 'classic', capInches: 0.62 },   // text and monogram: the lettering and its capital height
//     logoSize: 85,                    // the logo's size control, if the page has one (for the size fixes)
//     limit: 8,                        // most threads in one design
//     fail: false                      // true: behave as if the stitch file couldn't be made (review state)
//   });
//   E.paint(result, colorCanvas, heightCanvas);   // stitches (or the approximate look) onto two canvases the same
//                                                 // size as `art`: color, and height for the raised thread
//   E.line(result)        // 'Stitch file ready: 6,240 stitches, 3 threads, 3.8 × 1.9 in'
//   E.file(result, code)  // the stitch file's summary, saved on the design (d.stitch)
//   var ui = E.designer(element, { onChange(choices), onFix(hostChange), plain: false });   ui.update(result);
//                         plain: true leaves out the designer's review label, its "stitched in N parts" hint and the
//                         "Stitch file ready" line with its note (the hat page, D-142); the file is still made and
//                         saved (E.file), and the can't-be-made note still shows. Left out, everything shows.
//
// The buyer picks each part's thread; the stitches are standard (D-141): each part is stitched the way an embroiderer
// would set it up, satin for lettering and narrow parts, filled rows for wide shapes, a single running line for hairline
// detail in a logo. The buyer never picks or sees the stitch kind; the stitch file still records it for production.
// A stitch pick saved before D-141 (choices.parts[id].style) is ignored.
// `result.ok` is false when the stitch file can't be made: the parts and threads still come back, and E.paint draws an
// approximate stitched look. A stitch plan here is made in the browser to drive the preview; no machine file is
// written, and nothing is sent to the vendor (spec B-3). The thread chart, stitch kinds, limits and lettering minimums
// are examples until Chuck's embroiderer gives the real ones (OQ-7, OQ-23).
(function () {
  'use strict';

  // ---- The example thread chart: made-up names and codes, not a real vendor's chart ----
  var CHART = [
    ['EX-101', 'White', '#F7F6F2'], ['EX-102', 'Natural', '#E9E0CB'], ['EX-103', 'Silver', '#B8BCBF'], ['EX-104', 'Pewter', '#7C8186'],
    ['EX-105', 'Charcoal', '#3C3E43'], ['EX-106', 'Black', '#18191C'], ['EX-107', 'Navy', '#1E2A4F'], ['EX-108', 'Royal', '#2446A4'],
    ['EX-109', 'Sky', '#7DB0DF'], ['EX-110', 'Teal', '#1C7676'], ['EX-111', 'Forest', '#1F4A36'], ['EX-112', 'Kelly', '#1D8A4B'],
    ['EX-113', 'Sage', '#8EA489'], ['EX-114', 'Olive', '#5A6131'], ['EX-115', 'Khaki', '#BBAE8B'], ['EX-116', 'Tan', '#A68863'],
    ['EX-117', 'Brown', '#583A25'], ['EX-118', 'Gold', '#C99B39'], ['EX-119', 'Old gold', '#97702A'], ['EX-120', 'Yellow', '#E9C329'],
    ['EX-121', 'Orange', '#DF6A1F'], ['EX-122', 'Red', '#C8262B'], ['EX-123', 'Cardinal', '#9C1B2F'], ['EX-124', 'Maroon', '#5D1A26'],
    ['EX-125', 'Pink', '#E49AB2'], ['EX-126', 'Purple', '#5A3A8B'], ['EX-127', 'Lavender', '#A89BCF'], ['EX-128', 'Copper', '#AF613A']
  ].map(function (t) { return { code: t[0], name: t[1], hex: t[2] }; });
  var BY_CODE = {}; CHART.forEach(function (t) { BY_CODE[t.code] = t; });
  // The default thread when the artwork's own color doesn't show on the product: the first of these that does.
  var PREFERRED = ['EX-111', 'EX-101', 'EX-107', 'EX-106', 'EX-118'];

  // The stitch kinds the file uses, chosen for each part by autoStyle (D-141: standard stitching, never the buyer's
  // pick). Their names and directions go only into the stitch file, for the production sheet.
  var STYLES = {
    satin: { name: 'Flat satin', dir: 'across each stroke' },
    fill: { name: 'Fill', dir: 'in rows' },
    outline: { name: 'Outline', dir: 'along the edge' }
  };
  // Example limits (OQ-7, OQ-23), all in inches unless noted.
  var LIMITS = {
    satinMin: 0.035,   // narrowest stroke flat satin covers cleanly
    satinMax: 0.3,     // widest a satin stitch spans before a shape is better filled
    gapMin: 0.04,      // smallest gap between two parts before they run together
    contrast: 3,       // thread against the product, as a contrast ratio
    threads: 8,        // most threads in one design
    pull: 0.01,        // how far satin and fill spread past their outline, each side
    spacing: 0.016,    // between satin stitches and fill rows
    fillStitch: 0.12,  // length of a fill stitch
    runStitch: 0.08    // length of an outline stitch
  };
  // The page's four letterings, with the smallest capitals each stitches cleanly (examples).
  var FONTS = { classic: { name: 'Classic', min: 0.13 }, block: { name: 'Block', min: 0.14 }, script: { name: 'Script', min: 0.25 }, clean: { name: 'Clean', min: 0.12 } };

  // ---- Colors ----
  function rgb(hex) { var n = parseInt(String(hex).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function hexOf(r, g, b) { return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase(); }
  function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function luminance(hex) { var c = rgb(hex); return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
  function contrast(a, b) { var x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function nearest(c) {
    var best = CHART[0], bd = Infinity;
    CHART.forEach(function (t) {
      var d = rgb(t.hex), rm = (c[0] + d[0]) / 2, dr = c[0] - d[0], dg = c[1] - d[1], db = c[2] - d[2];
      var dist = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (dist < bd) { bd = dist; best = t; }
    });
    return best;
  }
  function contrasting(base) {
    for (var i = 0; i < PREFERRED.length; i++) if (contrast(BY_CODE[PREFERRED[i]].hex, base) >= LIMITS.contrast) return BY_CODE[PREFERRED[i]];
    return CHART.slice().sort(function (a, b) { return contrast(b.hex, base) - contrast(a.hex, base); })[0];
  }
  // A thread color lit to a factor: below 1 towards black, above 1 towards white (light on a dark thread shows more,
  // as sheen does on real thread).
  function shade(c, f) {
    var o = f <= 1 ? c.map(function (v) { return v * f; }) : c.map(function (v) { return v + (255 - v) * Math.min(1, (f - 1) * (1.1 + 0.9 * (1 - v / 255))); });
    return 'rgb(' + Math.round(o[0]) + ',' + Math.round(o[1]) + ',' + Math.round(o[2]) + ')';
  }

  // ---- Small helpers ----
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function inch(v) { return (Math.round(v * 100) / 100).toFixed(2) + ' in'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Exact distance from each inside pixel to the nearest outside pixel (Felzenszwalb and Huttenlocher), with a
  // border of outside pixels so shapes touching the edge are measured too.
  function edt(mask, W, H, invert) {
    var PW = W + 2, PH = H + 2, g = new Float64Array(PW * PH), INF = 1e20, x, y, q;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (!mask[y * W + x] !== !invert) g[(y + 1) * PW + x + 1] = INF;
    if (invert) { for (x = 0; x < PW; x++) { g[x] = INF; g[(PH - 1) * PW + x] = INF; } for (y = 0; y < PH; y++) { g[y * PW] = INF; g[y * PW + PW - 1] = INF; } }
    var n = Math.max(PW, PH), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    function pass(len) {
      var k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
      for (q = 1; q < len; q++) {
        var s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
        k++; v[k] = q; z[k] = s; z[k + 1] = INF;
      }
      k = 0;
      for (q = 0; q < len; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    }
    for (x = 0; x < PW; x++) { for (y = 0; y < PH; y++) f[y] = g[y * PW + x]; pass(PH); for (y = 0; y < PH; y++) g[y * PW + x] = d[y]; }
    for (y = 0; y < PH; y++) { for (x = 0; x < PW; x++) f[x] = g[y * PW + x]; pass(PW); for (x = 0; x < PW; x++) g[y * PW + x] = d[x]; }
    var out = new Float32Array(W * H);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) out[y * W + x] = Math.sqrt(Math.min(g[(y + 1) * PW + x + 1], 1e12));
    return out;
  }
  // A box blur of one channel inside a rectangle, twice (close to a Gaussian).
  function blur(a, W, H, r, x0, y0, x1, y1) {
    var t = new Float32Array(a.length), x, y, i, s, n;
    for (var pass = 0; pass < 2; pass++) {
      for (y = y0; y <= y1; y++) { s = 0; n = 0; for (x = x0; x <= Math.min(x1, x0 + r); x++) { s += a[y * W + x]; n++; }
        for (x = x0; x <= x1; x++) { t[y * W + x] = s / n; if (x + r + 1 <= x1) { s += a[y * W + x + r + 1]; n++; } if (x - r >= x0) { s -= a[y * W + x - r]; n--; } } }
      for (x = x0; x <= x1; x++) { s = 0; n = 0; for (y = y0; y <= Math.min(y1, y0 + r); y++) { s += t[y * W + x]; n++; }
        for (y = y0; y <= y1; y++) { a[y * W + x] = s / n; if (y + r + 1 <= y1) { s += t[(y + r + 1) * W + x]; n++; } if (y - r >= y0) { s -= t[(y - r) * W + x]; n--; } } }
    }
    void i;
  }

  // ---- The artwork, read at analysis size, split into parts ----
  function grab(src, A, W, H) {
    var c = mk(W, H), g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingQuality = 'high';
    g.drawImage(src, A.x, A.y, A.w, A.h, 0, 0, W, H);
    return g.getImageData(0, 0, W, H).data;
  }
  function fingerprint(datas, extra) {
    var h = 2166136261;
    datas.forEach(function (d) { for (var i = 0; i < d.length; i += 29) { h ^= d[i]; h = Math.imul(h, 16777619); } });
    return (h >>> 0).toString(36) + '|' + extra;
  }
  function splitColors(d, W, H, limit) {
    var clusters = [], ink = 0, i, j;
    for (i = 0; i < d.length; i += 8) {
      if (d[i + 3] < 128) continue;
      ink++;
      var hit = null;
      for (j = 0; j < clusters.length && !hit; j++) { var c = clusters[j], dr = c.r - d[i], dg = c.g - d[i + 1], db = c.b - d[i + 2]; if (dr * dr + dg * dg + db * db < 1600) hit = c; }
      if (hit) { hit.n++; hit.sr += d[i]; hit.sg += d[i + 1]; hit.sb += d[i + 2]; }
      else clusters.push({ r: d[i], g: d[i + 1], b: d[i + 2], n: 1, sr: d[i], sg: d[i + 1], sb: d[i + 2] });
    }
    var kept = clusters.filter(function (c) { return c.n >= ink * 0.01; }).sort(function (a, b) { return b.n - a.n; }).slice(0, limit);
    kept.forEach(function (c) { c.r = c.sr / c.n; c.g = c.sg / c.n; c.b = c.sb / c.n; c.white = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b > 225; c.mask = new Uint8Array(W * H); c.count = 0; });
    if (!kept.length) return [];
    for (i = 0, j = 0; i < d.length; i += 4, j++) {
      if (d[i + 3] < 110) continue;
      var best = kept[0], bd = Infinity;
      for (var k = 0; k < kept.length; k++) { var q = kept[k], er = q.r - d[i], eg = q.g - d[i + 1], eb = q.b - d[i + 2], dd = er * er + eg * eg + eb * eb; if (dd < bd) { bd = dd; best = q; } }
      if (!best.white) { best.mask[j] = 1; best.count++; }
    }
    var total = kept.reduce(function (s, c) { return s + c.count; }, 0), names = {};
    return kept.filter(function (c) { return !c.white && c.count >= Math.max(12, total * 0.002); }).map(function (c) {
      var src = [Math.round(c.r), Math.round(c.g), Math.round(c.b)], t = nearest(src), base = t.name.toLowerCase();
      names[base] = (names[base] || 0) + 1;
      var name = names[base] > 1 ? base + ' ' + names[base] : base;
      return { id: 'c-' + t.code + (names[base] > 1 ? '-' + names[base] : ''), name: name.charAt(0).toUpperCase() + name.slice(1), src: hexOf(src[0], src[1], src[2]), mask: c.mask, count: c.count };
    });
  }
  function maskOf(d, W, H) {
    var m = new Uint8Array(W * H), n = 0, sr = 0, sg = 0, sb = 0;
    for (var i = 0, j = 0; i < d.length; i += 4, j++) if (d[i + 3] >= 110) { m[j] = 1; n++; sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; }
    return { mask: m, count: n, src: n ? hexOf(Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)) : '#000000' };
  }

  // Each part's shape: distance to its edge, the widths of its strokes, and which way its strokes run.
  function study(p, W, H, s, ppi) {
    var D = edt(p.mask, W, H), x0 = W, y0 = H, x1 = -1, y1 = -1, maxD = 0, widths = [], x, y, i;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x; if (!p.mask[i]) continue;
      var d = D[i]; if (d > maxD) maxD = d;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      var ridge = true;
      for (var dy = -1; dy <= 1 && ridge; dy++) for (var dx = -1; dx <= 1; dx++) {
        var xx = x + dx, yy = y + dy;
        if ((dx || dy) && xx >= 0 && yy >= 0 && xx < W && yy < H && D[yy * W + xx] > d + 1e-3) { ridge = false; break; }
      }
      if (ridge) { widths.push(d); (p.ridge = p.ridge || []).push(i); }
    }
    widths.sort(function (a, b) { return a - b; });
    var k = s / ppi, pick = function (q) { return widths.length ? widths[Math.min(widths.length - 1, Math.floor(widths.length * q))] : 0; };
    p.D = D; p.bbox = { x0: x0, y0: y0, x1: x1, y1: y1 }; p.maxD = maxD;
    p.wMed = Math.max(0, 2 * pick(0.5) - 0.5) * k; p.wLow = Math.max(0, 2 * pick(0.15) - 0.5) * k; p.wMax = Math.max(0, 2 * maxD - 0.5) * k;
    // Stroke direction: the distance's gradient runs across each stroke; its doubled angle is averaged so opposite
    // sides of a stroke agree.
    var r = Math.max(2, Math.min(10, Math.round(pick(0.5)))), bx0 = Math.max(0, x0 - r - 1), by0 = Math.max(0, y0 - r - 1), bx1 = Math.min(W - 1, x1 + r + 1), by1 = Math.min(H - 1, y1 + r + 1);
    var C = new Float32Array(W * H), S = new Float32Array(W * H);
    for (y = by0; y <= by1; y++) for (x = bx0; x <= bx1; x++) {
      i = y * W + x; if (!p.mask[i]) continue;
      var gx = (x + 1 < W ? D[i + 1] : 0) - (x > 0 ? D[i - 1] : 0), gy = (y + 1 < H ? D[i + W] : 0) - (y > 0 ? D[i - W] : 0);
      C[i] = gx * gx - gy * gy; S[i] = 2 * gx * gy;
    }
    blur(C, W, H, r, bx0, by0, bx1, by1); blur(S, W, H, r, bx0, by0, bx1, by1);
    var T = new Float32Array(W * H);
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) { i = y * W + x; if (p.mask[i]) T[i] = 0.5 * Math.atan2(S[i], C[i]); }
    p.theta = T;
  }
  // How much of each part's edge meets the bare fabric rather than another part: a part inside another (a yellow
  // dot on a navy badge) doesn't need to stand out against the product, only one on the fabric does.
  function exposure(parts, W, H) {
    var own = new Int16Array(W * H).fill(-1);
    parts.forEach(function (p, n) { for (var i = 0; i < p.mask.length; i++) if (p.mask[i]) own[i] = n; });
    parts.forEach(function (p, n) {
      var edge = 0, bare = 0, b = p.bbox;
      for (var y = b.y0; y <= b.y1; y++) for (var x = b.x0; x <= b.x1; x++) {
        var i = y * W + x; if (own[i] !== n) continue;
        var nb = [x > 0 ? own[i - 1] : -1, x < W - 1 ? own[i + 1] : -1, y > 0 ? own[i - W] : -1, y < H - 1 ? own[i + W] : -1];
        if (nb.every(function (v) { return v === n; })) continue;
        edge++;
        // Look two pixels out, past anti-aliasing between touching parts.
        var outer = [x > 1 ? own[i - 2] : -1, x < W - 2 ? own[i + 2] : -1, y > 1 ? own[i - 2 * W] : -1, y < H - 2 ? own[i + 2 * W] : -1];
        if (nb.some(function (v, k) { return v === -1 && outer[k] === -1; })) bare++;
      }
      p.exposed = edge ? bare / edge : 1;
    });
  }
  // The stitch a digitizer would start from: fill for wide shapes, satin otherwise. Thin strokes in a logo (small
  // lettering) are satin too: a digitizer widens a thin column to stitch it solid rather than tracing its edge,
  // which left small logo lettering broken and see-through (session 12).
  function autoStyle(p, kind) {
    if (p.wMax > LIMITS.satinMax * 1.15) return 'fill';
    return 'satin';
  }

  // ---- Stitches, in analysis pixels: [x1, y1, x2, y2] ----
  function stitchSatin(p, W, H, sp, maxLen) {
    var M = p.mask, T = p.theta, occ = new Uint8Array(W * H), out = [];
    function inside(x, y) { if (x < 0 || y < 0) return false; var xi = x | 0, yi = y | 0; return xi < W && yi < H && M[yi * W + xi] === 1; }
    function reach(x, y, dx, dy) { var t = 0, lim = maxLen * 6; while (t < lim && inside(x + dx * (t + 0.5), y + dy * (t + 0.5))) t += 0.5; return t; }
    function mark(x1, y1, x2, y2, rad) {
      var len = Math.hypot(x2 - x1, y2 - y1), steps = Math.max(1, Math.ceil(len * 2)), r2 = rad * rad, R = Math.ceil(rad);
      for (var k = 0; k <= steps; k++) {
        var cx = x1 + (x2 - x1) * k / steps, cy = y1 + (y2 - y1) * k / steps;
        for (var yy = Math.floor(cy - R); yy <= cy + R; yy++) for (var xx = Math.floor(cx - R); xx <= cx + R; xx++) {
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          var ex = xx + 0.5 - cx, ey = yy + 0.5 - cy; if (ex * ex + ey * ey <= r2) occ[yy * W + xx] = 1;
        }
      }
    }
    function seed(i) {
      if (!M[i] || occ[i]) return;
      var x = i % W, y = (i / W) | 0, a = T[i], dx = Math.cos(a), dy = Math.sin(a), cx = x + 0.5, cy = y + 0.5;
      var t1 = reach(cx, cy, -dx, -dy), t2 = reach(cx, cy, dx, dy), len = t1 + t2 + 0.5;
      // Satin crosses a stroke the short way: near a stroke's end the direction field can point along it, so a
      // stitch much longer than the crossing at right angles takes that crossing instead.
      var u1 = reach(cx, cy, dy, -dx), u2 = reach(cx, cy, -dy, dx);
      if (len > 1.6 * (u1 + u2 + 0.5)) { var ox = dx; dx = -dy; dy = ox; t1 = u1; t2 = u2; len = t1 + t2 + 0.5; }
      var ax = cx - dx * (t1 + 0.25), ay = cy - dy * (t1 + 0.25), bx = cx + dx * (t2 + 0.25), by = cy + dy * (t2 + 0.25);
      var n = Math.max(1, Math.ceil(len / maxLen));
      if (n === 1) out.push([ax, ay, bx, by]);
      else {
        // Split satin: long stitches broken into staggered lengths.
        var off = (out.length % 3) / 3, cuts = [0];
        for (var k = 1; k < n; k++) cuts.push(Math.min(1, (k - 0.5 + off) / n));
        cuts.push(1);
        for (k = 0; k < cuts.length - 1; k++) out.push([ax + (bx - ax) * cuts[k], ay + (by - ay) * cuts[k], ax + (bx - ax) * cuts[k + 1], ay + (by - ay) * cuts[k + 1]]);
      }
      mark(ax, ay, bx, by, sp * 0.74);
    }
    (p.ridge || []).forEach(seed);
    var b = p.bbox;
    for (var y = b.y0; y <= b.y1; y++) for (var x = b.x0; x <= b.x1; x++) seed(y * W + x);
    return out;
  }
  function stitchFill(p, W, H, sp, L, deg) {
    var M = p.mask, a = deg * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, b = p.bbox, out = [];
    var cs = [[b.x0, b.y0], [b.x1 + 1, b.y0], [b.x0, b.y1 + 1], [b.x1 + 1, b.y1 + 1]];
    var n0 = Infinity, n1 = -Infinity, t0 = Infinity, t1 = -Infinity;
    cs.forEach(function (c) { var n = c[0] * nx + c[1] * ny, t = c[0] * dx + c[1] * dy; n0 = Math.min(n0, n); n1 = Math.max(n1, n); t0 = Math.min(t0, t); t1 = Math.max(t1, t); });
    function inside(x, y) { if (x < 0 || y < 0) return false; var xi = x | 0, yi = y | 0; return xi < W && yi < H && M[yi * W + xi] === 1; }
    var row = 0;
    for (var nn = n0 + sp / 2; nn <= n1; nn += sp, row++) {
      var phase = ((row * 2) % 5) / 5 * L, run = null, t;
      var emit = function (ta, tb) {
        var prev = ta;
        for (var cut = phase + Math.floor((ta - phase) / L + 1) * L; cut < tb - L * 0.3; cut += L) { out.push(seg(prev, cut)); prev = cut; }
        out.push(seg(prev, tb));
      };
      var seg = function (u, w) { return [nx * nn + dx * u, ny * nn + dy * u, nx * nn + dx * w, ny * nn + dy * w]; };
      for (t = t0; t <= t1 + 0.5; t += 0.5) {
        var ins = inside(nx * nn + dx * t, ny * nn + dy * t);
        if (ins && run === null) run = t; else if (!ins && run !== null) { if (t - run > 0.6) emit(run, t); run = null; }
      }
      if (run !== null) emit(run, t1);
    }
    return out;
  }
  // Outline: a run of stitches along the part's edge, a little inside it; a part thinner than that is the line
  // itself, so the run follows its middle. The line comes from thinning the edge band to one pixel (Zhang and Suen),
  // traced into chains, then cut into stitches.
  function stitchRun(p, W, H, sp, L) {
    var M = p.mask, D = p.D, b = p.bbox, band = Math.max(1, sp * 0.75), x0 = Math.max(1, b.x0 - 1), y0 = Math.max(1, b.y0 - 1), x1 = Math.min(W - 2, b.x1 + 1), y1 = Math.min(H - 2, b.y1 + 1);
    var m = new Uint8Array(W * H), x, y, i;
    for (y = b.y0; y <= b.y1; y++) for (x = b.x0; x <= b.x1; x++) { i = y * W + x; if (M[i] && D[i] <= band * 2) m[i] = 1; }
    var del = [], changed = true;
    while (changed) {
      changed = false;
      for (var step = 0; step < 2; step++) {
        del.length = 0;
        for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
          i = y * W + x; if (!m[i]) continue;
          var p2 = m[i - W], p3 = m[i - W + 1], p4 = m[i + 1], p5 = m[i + W + 1], p6 = m[i + W], p7 = m[i + W - 1], p8 = m[i - 1], p9 = m[i - W - 1];
          var B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9; if (B < 2 || B > 6) continue;
          var A = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2); if (A !== 1) continue;
          if (step === 0 ? (p2 && p4 && p6) || (p4 && p6 && p8) : (p2 && p4 && p8) || (p2 && p6 && p8)) continue;
          del.push(i);
        }
        for (var k = 0; k < del.length; k++) m[del[k]] = 0;
        if (del.length) changed = true;
      }
    }
    // Chains: from each loose end first, then round any closed loops.
    var N = [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1], seen = new Uint8Array(W * H), ends = [], rest = [], out = [];
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) { i = y * W + x; if (!m[i]) continue; var n = 0; for (k = 0; k < 8; k++) n += m[i + N[k]]; (n === 1 ? ends : rest).push(i); }
    ends.concat(rest).forEach(function (s0) {
      if (seen[s0]) return;
      var chain = [s0], cur = s0; seen[s0] = 1;
      for (;;) {
        var next = -1;
        for (var k2 = 0; k2 < 8 && next < 0; k2++) { var j = cur + N[[1, 3, 4, 6, 0, 2, 5, 7][k2]]; if (m[j] && !seen[j]) next = j; }
        if (next < 0) break;
        seen[next] = 1; chain.push(next); cur = next;
      }
      // Stitches along the chain: shorter on short chains, so small curves stay round.
      var pts = chain.map(function (c) { return [c % W + 0.5, ((c / W) | 0) + 0.5]; }), total = 0;
      for (var a = 1; a < pts.length; a++) total += Math.hypot(pts[a][0] - pts[a - 1][0], pts[a][1] - pts[a - 1][1]);
      if (pts.length === 1) { out.push([pts[0][0] - 0.6, pts[0][1], pts[0][0] + 0.6, pts[0][1]]); return; }
      var len = Math.max(Math.min(L, total / 4), L * 0.35), from = pts[0], acc = 0;
      for (a = 1; a < pts.length; a++) {
        acc += Math.hypot(pts[a][0] - pts[a - 1][0], pts[a][1] - pts[a - 1][1]);
        if (acc >= len || a === pts.length - 1) { out.push([from[0], from[1], pts[a][0], pts[a][1]]); from = pts[a]; acc = 0; }
      }
    });
    return out;
  }

  // ---- The whole job: parts, choices, stitch plan, problems ----
  var cache = { key: null, parts: null, plans: {} };
  function stitch(input) {
    var A = input.area, kind = input.kind || 'logo', ppi = input.pxPerInch, limit = input.limit || LIMITS.threads;
    var s = Math.max(1, Math.max(A.w, A.h) / 1200), /* fine enough for small lettering (was 600, session 12) */ W = Math.max(1, Math.round(A.w / s)), H = Math.max(1, Math.round(A.h / s));
    s = A.w / W;
    var datas = input.layers && input.layers.length ? input.layers.map(function (l) { return grab(l.canvas, A, W, H); }) : [grab(input.art, A, W, H)];
    var key = fingerprint(datas, [kind, W, H, Math.round(ppi), limit, (input.layers || []).map(function (l) { return l.id; }).join(',')].join('|'));
    var parts;
    if (cache.key === key) parts = cache.parts;
    else {
      if (input.layers && input.layers.length) parts = input.layers.map(function (l, i) { var m = maskOf(datas[i], W, H); return { id: l.id, name: l.name, src: m.src, mask: m.mask, count: m.count }; });
      else if (kind === 'logo') parts = splitColors(datas[0], W, H, limit);
      else { var m = maskOf(datas[0], W, H); parts = [{ id: kind === 'monogram' ? 'monogram' : 'lettering', name: kind === 'monogram' ? 'Monogram' : 'Lettering', src: m.src, mask: m.mask, count: m.count }]; }
      parts = parts.filter(function (p) { return p.count > 0; });
      parts.forEach(function (p) { study(p, W, H, s, ppi); });
      exposure(parts, W, H);
      cache = { key: key, parts: parts, plans: {} };
    }
    var choices = input.choices || {}, picked = choices.parts || {}, base = input.base || '#FFFFFF';
    var res = { ok: !input.fail, key: key, area: A, inches: input.inches, ppi: ppi, s: s, W: W, H: H, base: base, kind: kind,
      letters: input.letters || null, logoSize: input.logoSize, ground: input.ground || 'fabric', choices: choices, parts: [], issues: [] };
    res.parts = parts.map(function (p, n) {
      var pick = picked[p.id] || {}, auto = autoStyle(p, kind), own = nearest(rgb(p.src));
      // The default thread: a logo keeps its own colors where they show on the product; anything else that would
      // barely show takes a thread that does (spec AI-3; the low-contrast rule below flags a picked one).
      var onFabric = p.exposed >= 0.3, autoThread = kind === 'logo' && (!onFabric || contrast(own.hex, base) >= LIMITS.contrast) ? own : contrasting(base);
      // Standard stitching (D-141): the kind for the part's shape; a stitch pick saved before D-141 is ignored.
      var thread = BY_CODE[pick.thread] || autoThread, style = auto;
      var q = { id: p.id, name: p.name, src: p.src, part: p, thread: thread, style: style, auto: auto, autoThread: autoThread, onFabric: onFabric,
        pickedThread: !!BY_CODE[pick.thread], wMed: p.wMed, wLow: p.wLow, wMax: p.wMax };
      // Fill rows turn from part to part, so neighbouring fills catch the light differently; each part keeps its angle.
      if (style === 'fill') q.angle = n % 2 ? 135 : 45;
      return q;
    });
    if (!res.parts.length) { res.ok = false; res.reason = 'empty'; }
    if (res.ok) plan(res);
    check(res);
    return res;
  }
  function plan(res) {
    var sp = LIMITS.spacing * res.ppi / res.s, total = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, spread = LIMITS.pull;
    res.parts.forEach(function (q) {
      var p = q.part, id = q.style + '|' + (q.angle || 0), st = cache.plans[p.id + '|' + id];
      if (!st) {
        if (q.style === 'fill') st = stitchFill(p, res.W, res.H, sp, LIMITS.fillStitch * res.ppi / res.s, q.angle);
        else if (q.style === 'outline') st = stitchRun(p, res.W, res.H, sp, LIMITS.runStitch * res.ppi / res.s);
        else st = stitchSatin(p, res.W, res.H, sp, LIMITS.satinMax * 1.2 * res.ppi / res.s);
        cache.plans[p.id + '|' + id] = st;
      }
      q.stitches = st;
      // Needle stitches: the top stitches, the underlay beneath satin and fill, and the ties at each start and end.
      q.count = Math.round(st.length * (q.style === 'outline' ? 1 : 1.3) + 14);
      total += q.count;
      var b = p.bbox;
      x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1 + 1); y1 = Math.max(y1, b.y1 + 1);
    });
    if (total > 60000) { res.ok = false; res.reason = 'too-many'; return; }
    var k = res.s / res.ppi, codes = [];
    res.parts.forEach(function (q) { if (codes.indexOf(q.thread.code) === -1) codes.push(q.thread.code); });
    // Thread changes: the parts are sewn grouped by thread, so each new thread is one change.
    res.plan = { stitches: total, threads: codes.length, changes: Math.max(0, codes.length - 1),
      w: (x1 - x0) * k + 2 * spread, h: (y1 - y0) * k + 2 * spread, spread: spread,
      parts: res.parts.map(function (q) { return { id: q.id, name: q.name, thread: q.thread, style: q.style, angle: q.angle || null,
        direction: q.style === 'fill' ? 'rows at ' + q.angle + '°' : STYLES[q.style].dir, stitches: q.count }; }) };
  }

  // ---- The rules: each problem says what's wrong and offers a fix; the buyer decides (AI-3) ----
  function the(q) { return 'the ' + q.name.toLowerCase() + (/^c-/.test(q.id) ? ' part' : ''); }
  function The(q) { var t = the(q); return t.charAt(0).toUpperCase() + t.slice(1); }
  function check(res) {
    var kept = (res.choices && res.choices.kept) || {}, out = [];
    function add(key, part, text, fix) { if (!kept[key]) out.push({ key: key, part: part, text: text, fix: fix }); else (res.kept = res.kept || []).push(key); }
    res.parts.forEach(function (q) {
      // Low contrast: a thread the buyer picked that barely shows on the product.
      var ratio = contrast(q.thread.hex, res.base);
      if (q.pickedThread && q.onFabric && ratio < LIMITS.contrast) {
        var alt = contrasting(res.base);
        add('contrast:' + q.id + ':' + q.thread.code, q.id, (res.parts.length > 1 ? q.thread.name + ' thread on ' + the(q) : q.thread.name + ' thread') + ' barely shows on this ' + (res.ground || 'fabric') + ' (contrast ' + ratio.toFixed(1) + ' to 1; aim for ' + LIMITS.contrast + ' to 1, an example limit).',
          { label: 'Use ' + alt.name + ' (' + alt.code + ')', part: q.id, set: { thread: alt.code } });
      }
    });
    // No stitch-width flags (D-141): standard stitching already gives a logo's hairlines a running line instead of
    // satin, and lettering is checked by its capitals' height below.
    // Lettering too small to stitch cleanly (text and monogram).
    var L = res.letters;
    if (res.kind !== 'logo' && L && FONTS[L.font] && L.capInches) {
      var f = FONTS[L.font];
      if (L.capInches < f.min) {
        var smaller = Object.keys(FONTS).filter(function (k) { return k !== L.font && FONTS[k].min <= L.capInches; }).sort(function (a, b) { return FONTS[a].min - FONTS[b].min; })[0];
        var q0 = res.parts[0];
        add('letters:' + L.font + ':' + Math.round(L.capInches * 100), q0 && q0.id, 'Capitals are ' + inch(L.capInches) + ' tall. ' + f.name + ' lettering stitches cleanly from ' + inch(f.min) + ' (an example limit).',
          smaller ? { label: 'Switch to ' + FONTS[smaller].name + ' lettering', host: { font: smaller } }
            : L.twoLines ? { label: 'Put it on one line', host: { line2: '' } } : null);
      }
    }
    // A gap between two parts too narrow to stay open.
    if (res.kind === 'logo' && res.parts.length > 1) {
      var k = res.s / res.ppi, worst = null;
      res.parts.forEach(function (a) {
        var out2 = a.part.out || (a.part.out = edt(a.part.mask, res.W, res.H, true));
        res.parts.forEach(function (b) {
          if (a === b || a.id > b.id) return;
          var m = Infinity, M = b.part.mask; for (var i = 0; i < M.length; i++) if (M[i] && out2[i] < m) m = out2[i];
          if (m > 1.5 && m * k < LIMITS.gapMin && (!worst || m < worst.m)) worst = { m: m, a: a, b: b };
        });
      });
      if (worst) {
        var gap = worst.m * k, size = res.logoSize, need = size ? Math.min(100, Math.ceil(size * LIMITS.gapMin / gap)) : null;
        add('gap:' + worst.a.id + ':' + worst.b.id, worst.a.id, The(worst.a) + ' and ' + the(worst.b) + ' are ' + inch(gap) + ' apart. Parts closer than ' + inch(LIMITS.gapMin) + ' can run together (an example limit).',
          need && need > size ? { label: 'Make the logo ' + need + '%', host: { logoSize: need } } : null);
      }
    }
    // The stitches must stay inside the area.
    if (res.plan && res.inches && (res.plan.w > res.inches.w + 1e-3 || res.plan.h > res.inches.h + 1e-3)) {
      var over = Math.max(res.plan.w / res.inches.w, res.plan.h / res.inches.h);
      var shrink = res.logoSize ? Math.max(40, Math.floor(res.logoSize / over) - 1) : null;
      add('area:' + Math.round(res.plan.w * 100) + 'x' + Math.round(res.plan.h * 100), null,
        'The stitches measure ' + res.plan.w.toFixed(2) + ' × ' + res.plan.h.toFixed(2) + ' in, past the ' + areaName(res.inches) + ' area.',
        res.kind === 'logo' && shrink ? { label: 'Make the logo ' + shrink + '%', host: { logoSize: shrink } } : null);
    }
    res.issues = out;
  }
  function frac(v) { var w = Math.floor(v + 1e-6), r = v - w; var f = Math.abs(r - 0.25) < 0.01 ? '¼' : Math.abs(r - 0.5) < 0.01 ? '½' : Math.abs(r - 0.75) < 0.01 ? '¾' : ''; return f ? (w ? w + '' : '') + f : (Math.round(v * 100) / 100) + ''; }
  function areaName(i) { return frac(i.w) + ' × ' + frac(i.h) + ' in'; }

  // ---- Painting from the stitch plan (UI-37) ----
  // Light falls from the left, a little above: a thread lying across that direction catches it, one along it
  // doesn't, so upright strokes (stitched across) and level ones read differently, as real satin does.
  var LX = -0.92, LY = -0.39;
  function sheen(dx, dy) { var c = dx * LX + dy * LY; return Math.pow(1 - c * c * 0.85, 3); }
  var layers = {};
  function layer(res, q) {
    var k = [res.key, q.id, q.style, q.angle || 0, q.thread.code, res.ok ? 1 : 0].join('|');
    if (layers[k]) return layers[k];
    var p = q.part, A = res.area, s = res.s, b = p.bbox, pad = 4;
    var x = Math.floor(A.x + b.x0 * s) - pad, y = Math.floor(A.y + b.y0 * s) - pad, w = Math.ceil((b.x1 - b.x0 + 1) * s) + 2 * pad, h = Math.ceil((b.y1 - b.y0 + 1) * s) + 2 * pad;
    var col = mk(w, h), hgt = mk(w, h), c = col.getContext('2d'), g = hgt.getContext('2d'), base = rgb(q.thread.hex);
    // The part's shape at canvas size, for clipping and for the light and shade at its edges.
    var shape = mk(res.W, res.H), sg = shape.getContext('2d'), sd = sg.createImageData(res.W, res.H);
    for (var i = 0; i < p.mask.length; i++) if (p.mask[i]) { sd.data[i * 4] = sd.data[i * 4 + 1] = sd.data[i * 4 + 2] = 255; sd.data[i * 4 + 3] = 255; }
    sg.putImageData(sd, 0, 0);
    var ox = A.x - x, oy = A.y - y;
    function drawShape(ctx, dx, dy, blurPx) { ctx.save(); if (blurPx) ctx.filter = 'blur(' + blurPx + 'px)'; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(shape, ox + (dx || 0), oy + (dy || 0), res.W * s, res.H * s); ctx.restore(); }
    var spPx = LIMITS.spacing * res.ppi;
    if (!res.ok) {
      // Approximate stitched look: the part in its thread with a satin sheen, as before there was a stitch file.
      drawShape(c); c.globalCompositeOperation = 'source-in'; c.fillStyle = q.thread.hex; c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'source-atop'; c.globalAlpha = 0.16; c.fillStyle = c.createPattern(satinTile(), 'repeat'); c.fillRect(0, 0, w, h); c.globalAlpha = 1;
      drawShape(g); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, w, h);
      return (layers[k] = { color: col, height: hgt, x: x, y: y, w: w, h: h });
    }
    var tw = spPx * (q.style === 'outline' ? 1.5 : 1.4), rand = rng(hashStr(k)), LEVELS = 12, buckets = [];
    q.stitches.forEach(function (st) {
      var x1 = ox + st[0] * s, y1 = oy + st[1] * s, x2 = ox + st[2] * s, y2 = oy + st[3] * s, len = Math.hypot(x2 - x1, y2 - y1);
      if (len < 0.3) return;
      var dx = (x2 - x1) / len, dy = (y2 - y1) / len, cut = Math.min(q.style === 'fill' ? 0.2 : 0.3, len * 0.1);
      var f = 0.7 + 0.5 * sheen(dx, dy) + (rand() - 0.5) * 0.08, lv = Math.max(0, Math.min(LEVELS - 1, Math.round((f - 0.65) / 0.6 * (LEVELS - 1))));
      var nx = -dy, ny = dx; if (nx * LX + ny * LY < 0) { nx = -nx; ny = -ny; }
      (buckets[lv] = buckets[lv] || []).push([x1 + dx * cut, y1 + dy * cut, x2 - dx * cut, y2 - dy * cut, nx, ny]);
    });
    function path(ctx, list, off) { ctx.beginPath(); list.forEach(function (t) { ctx.moveTo(t[0] + t[4] * off, t[1] + t[5] * off); ctx.lineTo(t[2] + t[4] * off, t[3] + t[5] * off); }); }
    c.lineCap = g.lineCap = 'butt';
    buckets.forEach(function (list, lv) {
      if (!list) return;
      var f = 0.65 + lv / (LEVELS - 1) * 0.6;
      // Each thread: darker where it dips into the fabric at its sides, its own color, then a fine glint on top.
      c.lineWidth = tw; c.strokeStyle = shade(base, f * 0.8); path(c, list, 0); c.stroke();
      c.lineWidth = tw * 0.68; c.strokeStyle = shade(base, f); path(c, list, tw * 0.05); c.stroke();
      c.lineWidth = Math.max(0.6, tw * 0.2); c.strokeStyle = shade(base, f * 1.08 + 0.2); path(c, list, tw * 0.17); c.stroke();
      // Twisted strands along each thread.
      if (tw >= 3.2) { c.lineWidth = 0.55; c.strokeStyle = 'rgba(0,0,0,0.12)'; path(c, list, -tw * 0.22); c.stroke(); }
      // Height: each thread a little ridge.
      g.lineWidth = tw; g.strokeStyle = 'rgb(116,116,116)'; path(g, list, 0); g.stroke();
      g.lineWidth = tw * 0.5; g.strokeStyle = 'rgb(146,146,146)'; path(g, list, 0); g.stroke();
    });
    // Only inside the part (an outline's run lies along the edge or the middle of a line, so it keeps its own width).
    if (q.style !== 'outline') {
      c.globalCompositeOperation = 'destination-in'; drawShape(c); c.globalCompositeOperation = 'source-over';
      g.globalCompositeOperation = 'destination-in'; drawShape(g); g.globalCompositeOperation = 'source-over';
    }
    // The edges: thread rolls down into the fabric, shaded on the side away from the light.
    var e = mk(w, h), eg = e.getContext('2d'), soft = Math.max(1.2, spPx * 0.5), off = soft * 0.5;
    eg.fillStyle = '#000'; eg.fillRect(0, 0, w, h); eg.globalCompositeOperation = 'destination-out'; drawShape(eg, LX * off, LY * off, soft);
    c.globalCompositeOperation = 'source-atop'; c.globalAlpha = 0.4; c.drawImage(e, 0, 0); c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over'; g.globalCompositeOperation = 'source-over';
    return (layers[k] = { color: col, height: hgt, x: x, y: y, w: w, h: h });
  }
  var satinCache = null;
  function satinTile() {
    if (satinCache) return satinCache;
    var t = mk(48, 48), p = t.getContext('2d'); p.lineWidth = 1.6;
    for (var i = -48; i <= 96; i += 4) { p.strokeStyle = (i / 4) % 2 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'; p.beginPath(); p.moveTo(i, 0); p.lineTo(i - 26.4, 48); p.stroke(); }
    return (satinCache = t);
  }
  function paint(res, color, height) {
    if (Object.keys(layers).length > 60) layers = {};
    // Thread stands about a thirty-second of an inch off the fabric, so it casts a soft shadow.
    var c = color.getContext('2d'), h = height.getContext('2d'), k = res.ppi;
    res.parts.forEach(function (q) {
      var L = layer(res, q);
      c.save(); c.shadowColor = 'rgba(0,0,0,0.42)'; c.shadowBlur = 0.024 * k; c.shadowOffsetX = 0.008 * k; c.shadowOffsetY = 0.013 * k;
      c.drawImage(L.color, L.x, L.y); c.restore();
      h.save(); h.globalCompositeOperation = 'lighten'; h.drawImage(L.height, L.x, L.y); h.restore();
    });
  }
  // A part on its own, on the product's color, for the designer's list (drawn into the given canvas, or a new one).
  function thumb(res, q, size, into) {
    var L = layer(res, q), t = into || mk(size, size), g = t.getContext('2d');
    g.fillStyle = res.base; g.fillRect(0, 0, size, size);
    var sc = Math.min((size * 0.8) / L.w, (size * 0.8) / L.h, 3);
    g.imageSmoothingQuality = 'high';
    g.drawImage(L.color, (size - L.w * sc) / 2, (size - L.h * sc) / 2, L.w * sc, L.h * sc);
    return t;
  }

  // ---- What the stitch file says ----
  function line(res) {
    if (!res.ok || !res.plan) return 'Stitch file to be made by the embroiderer';
    var p = res.plan;
    return 'Stitch file ready: ' + fmt(Math.round(p.stitches / 10) * 10) + ' stitches, ' + p.threads + (p.threads === 1 ? ' thread, ' : ' threads, ') + p.w.toFixed(1) + ' × ' + p.h.toFixed(1) + ' in';
  }
  function file(res, code) {
    var parts = res.parts.map(function (q) { return { name: q.name, thread: q.thread.name, code: q.thread.code, hex: q.thread.hex, style: STYLES[q.style].name,
      direction: q.style === 'fill' ? 'rows at ' + q.angle + '°' : STYLES[q.style].dir, stitches: res.ok && q.count ? q.count : null }; });
    if (!res.ok || !res.plan) return { status: 'failed', line: line(res), parts: parts, kept: res.kept || [] };
    return { status: 'ready', file: (code || 'design') + '.dst', line: line(res), stitches: Math.round(res.plan.stitches / 10) * 10, threads: res.plan.threads,
      changes: res.plan.changes, size: { w: Math.round(res.plan.w * 100) / 100, h: Math.round(res.plan.h * 100) / 100 }, parts: parts, kept: res.kept || [],
      sent: false };
  }
  // 'ring in Navy thread (EX-107); …' (buyer-facing, so no stitch kinds, D-141)
  function partsText(res) {
    return res.parts.map(function (q) { return q.name.toLowerCase() + (/^c-/.test(q.id) ? ' part' : '') + ' in ' + q.thread.name + ' thread (' + q.thread.code + ')'; }).join('; ');
  }

  // ---- The designer (UI-36): the parts, each with its thread from the chart (the stitches are standard, D-141) ----
  function designer(el, on) {
    on = on || {};
    var open = null, last = null;
    el.classList.add('emb');
    el.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t || !last) return;
      var row = t.closest('[data-part]'), id = row && row.dataset.part;
      var choices = clone(last.choices);
      if (t.hasAttribute('data-toggle')) { open = open === id ? '' : id; render(last); focusKey('toggle:' + id); return; }
      if (t.dataset.thread) { setPart(choices, id, { thread: t.dataset.thread }); if (on.onChange) on.onChange(choices); return; }
      var issue = t.dataset.fix || t.dataset.keep ? last.issues.filter(function (x) { return x.key === (t.dataset.fix || t.dataset.keep); })[0] : null;
      if (!issue) return;
      if (t.dataset.keep) { choices.kept = Object.assign({}, choices.kept || {}); choices.kept[issue.key] = true; if (on.onChange) on.onChange(choices); return; }
      if (issue.fix && issue.fix.part) { setPart(choices, issue.fix.part, issue.fix.set); if (on.onChange) on.onChange(choices); }
      else if (issue.fix && issue.fix.host && on.onFix) on.onFix(issue.fix.host);
    });
    function setPart(choices, id, set) { choices.parts = Object.assign({}, choices.parts || {}); choices.parts[id] = Object.assign({}, choices.parts[id] || {}, set); }
    function clone(c) { return { parts: Object.assign({}, (c && c.parts) || {}), kept: Object.assign({}, (c && c.kept) || {}) }; }
    function focusKey(k) { var f = el.querySelector('[data-k="' + k + '"]'); if (f) f.focus(); }
    function render(res) {
      last = res;
      var active = document.activeElement && el.contains(document.activeElement) ? document.activeElement.getAttribute('data-k') : null;
      if (open === null || (open && !res.parts.some(function (q) { return q.id === open; }))) open = res.parts[0] ? res.parts[0].id : '';
      var plain = !!on.plain;   // the page asked for the bare designer: threads, flags and the can't-be-made note only
      var html = '<div class="emb-head"><span class="label">Threads</span>' + (plain ? '' :
        '<span class="review-note">Example threads and limits, until the embroiderer sets them</span>' +
        '<p class="hint">' + (res.parts.length > 1 ? 'Your artwork is stitched in ' + res.parts.length + ' parts. Pick a thread from the chart for each.' : 'Pick a thread from the chart.') + '</p>') + '</div>';
      if (!res.ok) {
        html += '<div class="notice emb-failed" data-stitch-failed role="status">' + warnIcon() + '<div><strong>The stitch file couldn&rsquo;t be made for this artwork.</strong> ' +
          'The preview shows an approximate stitched look instead. You can still order it, and the embroiderer will make the file by hand. ' +
          'Or ask Chuck first: <a href="#" data-quote-link>Request a quote</a>.</div></div>';
      }
      if (res.issues.length) {
        html += '<ul class="emb-flags" aria-label="Things to check">' + res.issues.map(function (x) {
          return '<li class="notice emb-flag" data-issue="' + esc(x.key) + '">' + warnIcon() + '<div class="emb-flag-body"><p>' + esc(x.text) + '</p><div class="emb-flag-actions">' +
            (x.fix ? '<button type="button" class="emb-fix" data-fix="' + esc(x.key) + '" data-k="fix:' + esc(x.key) + '">' + esc(x.fix.label) + '</button>' : '') +
            '<button type="button" class="emb-keep" data-keep="' + esc(x.key) + '" data-k="keep:' + esc(x.key) + '">Keep it</button></div></div></li>';
        }).join('') + '</ul>';
      }
      html += '<ul class="emb-parts">' + res.parts.map(function (q) {
        var isOpen = q.id === open, flagged = res.issues.some(function (x) { return x.part === q.id; }), bodyId = 'emb-part-' + q.id.replace(/[^a-z0-9-]/gi, '');
        var sub = q.thread.name + ' (' + q.thread.code + ')';
        return '<li class="emb-part' + (isOpen ? ' is-open' : '') + (flagged ? ' is-flagged' : '') + '" data-part="' + esc(q.id) + '">' +
          '<button type="button" class="emb-part-head" data-toggle aria-expanded="' + isOpen + '" aria-controls="' + bodyId + '" data-k="toggle:' + esc(q.id) + '">' +
          '<canvas class="emb-thumb" width="112" height="112" data-thumb="' + esc(q.id) + '" aria-hidden="true"></canvas>' +
          '<span class="emb-part-text"><span class="emb-part-name">' + esc(q.name) + (flagged ? '<span class="emb-dot" aria-label="needs a look"></span>' : '') + '</span><span class="emb-part-sub" data-part-sub>' + esc(sub) + '</span></span>' +
          '<svg class="emb-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>' +
          '<div class="emb-part-body" id="' + bodyId + '"' + (isOpen ? '' : ' hidden') + '>' +
          '<div class="field"><span class="label" id="' + bodyId + '-t">Thread: <span data-thread-name>' + esc(q.thread.name) + ' (' + q.thread.code + ')</span></span>' +
          '<div class="swatches emb-chart" role="group" aria-labelledby="' + bodyId + '-t">' + CHART.map(function (t) {
            return '<button type="button" class="swatch" data-thread="' + t.code + '" aria-label="' + t.name + ', ' + t.code + '" aria-pressed="' + (t.code === q.thread.code) + '" data-k="t:' + esc(q.id) + ':' + t.code + '"><span style="background:' + t.hex + '"></span></button>';
          }).join('') + '</div></div>' +
          '</div></li>';
      }).join('') + '</ul>';
      html += res.ok && !plain ? '<p class="emb-file" data-stitch-line><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg><span>' + esc(line(res)) + '</span></p>' +
        '<p class="hint emb-file-note">The preview is drawn from this file. It&rsquo;s saved with your design for the embroiderer, who checks it before anything is stitched.</p>' : '';
      el.innerHTML = html;
      Array.prototype.forEach.call(el.querySelectorAll('[data-thumb]'), function (c) {
        var q = res.parts.filter(function (x) { return x.id === c.dataset.thumb; })[0]; if (q) thumb(res, q, 112, c);
      });
      if (active) focusKey(active);
    }
    return { update: render };
  }
  function warnIcon() { return '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>'; }

  window.HonorsEmbroidery = { CHART: CHART, STYLES: STYLES, LIMITS: LIMITS, FONTS: FONTS, thread: function (code) { return BY_CODE[code] || null; },
    contrast: contrast, contrasting: contrasting, stitch: stitch, paint: paint, line: line, file: file, partsText: partsText, designer: designer, thumb: thumb };
})();
