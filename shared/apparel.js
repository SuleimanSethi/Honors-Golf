// The apparel page (UI-13; spec A-1 to A-4): describes a garment to the shared designer (designer.js) and draws it.
// The garment is data (APPAREL below): a photo for each color and view, the named logo spots placed on the photo with
// their size in inches and decoration method, the allowed styles, the sizes and the tier ladder. Another garment is
// another APPAREL plus its photos; the drawing code below stays as it is.
// Shown with one garment: the performance polo. Its spots, sizes and methods are examples until Chuck confirms them
// (OQ-9); its prices are examples until he sets them (OQ-3).
// Each spot is switched on or off and carries its own artwork (A-3). The designer's artwork controls edit the spot
// that's selected; its artwork is copied into that spot on every change. Embroidered and printed spots both show the
// artwork flat, with the polo's own shading (A-4; the stitched look was cut, D-35). The buyer enters a quantity per
// size; the minimum and the price break apply to the total across sizes (A-2).
(function () {
  'use strict';

  var APPAREL = {
    product: 'polo',
    name: 'Custom polos',               // as the cart and the recent-design cards name it
    noun: 'polo',
    page: 'apparel.html',
    code: 'HGS-10453',                  // the next free sample design code (ball 10450, hat 10451, tumbler 10452)
    styles: ['logo', 'text', 'monogram'],
    min: 12,
    tiers: [{ min: 12, price: 38 }, { min: 24, price: 34 }, { min: 48, price: 30 }],   // examples, the same as cart.js
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    // The photos are one CC0 polo render, recolored (img/CREDITS.md). `lit` is the fabric's lit tone in each photo,
    // which the artwork's shading is measured against; `light` polos take Pine thread and ink for text, dark ones white.
    colors: {
      white: { name: 'White', hex: '#FFFFFF', lit: '#EEEEEC', light: true },
      navy: { name: 'Navy', hex: '#232B40' },
      forest: { name: 'Forest', hex: '#1F4A36' },
      black: { name: 'Black', hex: '#262626' },
      grey: { name: 'Grey', hex: '#A3A6A8', light: true }
    },
    photo: 'img/polo-{color}-{view}.webp',
    size: 1600,                         // the photos are this many pixels square
    pxPerIn: 27,                        // about 22 inches across the chest
    views: { front: 'Front', back: 'Back' },
    // The spots: centre (x, y) on its view's photo, size in inches, and method. The sleeve is seen at an angle from the
    // front, so its artwork turns with the sleeve and is narrowed to the part of it that faces the camera.
    spots: [
      { id: 'chest', name: 'Left chest', view: 'front', x: 935, y: 478, width: 4, height: 4, method: 'embroidery' },
      { id: 'sleeve', name: 'Left sleeve', view: 'front', x: 1266, y: 500, width: 3, height: 2, turn: -25, squeeze: 0.62, method: 'embroidery' },
      { id: 'back', name: 'Back', view: 'back', x: 800, y: 322, width: 10, height: 4, method: 'print' }
    ],
    start: {
      tab: 'logo', color: 'white', font: 'classic', logoSize: 85, line1: 'Pinecrest', line2: 'Golf Club', mono: 'PGC',
      sizes: { S: 4, M: 10, L: 8, XL: 0, '2XL': 0 },
      spots: {
        chest: { on: true, tab: 'logo' },
        sleeve: { on: true, tab: 'monogram' },
        back: { on: false, tab: 'text', line1: 'Pinecrest Golf Club', line2: '' }
      }
    }
  };
  // Decoration methods, as the buyer reads them.
  var METHODS = { embroidery: { name: 'embroidered', minCap: 0.25 }, print: { name: 'printed', minCap: 0.15 } };
  var THREAD = { light: '#12342A', dark: '#FFFFFF' };   // text and monograms: Pine on light polos, white on dark ones

  var A = APPAREL, Q = 3, INK = 0.9;   // artwork is painted at 3x the photo's resolution, then placed
  var FONTS = {
    classic: "'Marcellus', Georgia, serif", block: "'Alfa Slab One', Georgia, serif",
    script: "'Pinyon Script', cursive", clean: "'Figtree', 'Helvetica Neue', sans-serif"
  };
  var FONT_NAMES = { classic: 'Classic', block: 'Block', script: 'Script', clean: 'Clean' };
  var ART = ['tab', 'line1', 'line2', 'mono', 'font', 'logo', 'logoSize'];   // what each spot keeps of the designer's state

  function byId(id) { return document.getElementById(id); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function spotById(id) { return A.spots.filter(function (s) { return s.id === id; })[0]; }
  function photoUrl(color, view) { return A.photo.replace('{color}', color).replace('{view}', view); }
  function total(sizes) { return A.sizes.reduce(function (n, k) { return n + (sizes[k] || 0); }, 0); }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  // ---- Color math: sRGB <-> linear light ----
  var LIN = [];
  for (var i = 0; i < 256; i++) { var v = i / 255; LIN[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function srgb(x) { x = x <= 0 ? 0 : x >= 1 ? 1 : x; return Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255); }
  function hexLum(hex) { var n = parseInt(hex.slice(1), 16); return 0.2126 * LIN[n >> 16] + 0.7152 * LIN[(n >> 8) & 255] + 0.0722 * LIN[n & 255]; }

  // ---- Photos: every color and view loaded once ----
  var photos = {}, api = null;
  function photo(color, view) {
    var key = color + '/' + view;
    if (!photos[key]) {
      var img = new Image();
      photos[key] = img;
      img.onload = function () { if (api) api.render(); };
      img.src = photoUrl(color, view);
    }
    return photos[key].complete && photos[key].naturalWidth ? photos[key] : null;
  }
  // The photo's pixels under a box (kept per color and box), for the shading.
  var under = {};
  function pixelsUnder(color, view, b) {
    var key = color + '/' + view + '/' + [b.x, b.y, b.w, b.h].join(',');
    if (under[key]) return under[key];
    var img = photo(color, view);
    if (!img) return null;
    var c = document.createElement('canvas'); c.width = b.w; c.height = b.h;
    var g = c.getContext('2d', { willReadFrequently: true }), k = img.naturalWidth / A.size;
    g.drawImage(img, b.x * k, b.y * k, b.w * k, b.h * k, 0, 0, b.w, b.h);
    return (under[key] = g.getImageData(0, 0, b.w, b.h).data);
  }

  // ---- A spot's place on the photo: its corners and the box of pixels it covers ----
  function corners(spot) {
    var w = spot.width * A.pxPerIn * (spot.squeeze || 1) / 2, h = spot.height * A.pxPerIn / 2, t = (spot.turn || 0) * Math.PI / 180;
    var c = Math.cos(t), s = Math.sin(t);
    return [[-w, -h], [w, -h], [w, h], [-w, h]].map(function (p) { return [spot.x + p[0] * c - p[1] * s, spot.y + p[0] * s + p[1] * c]; });
  }
  function boxOf(spot) {
    var pts = corners(spot), xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var x = Math.floor(Math.min.apply(null, xs)) - 2, y = Math.floor(Math.min.apply(null, ys)) - 2;
    return { x: x, y: y, w: Math.ceil(Math.max.apply(null, xs)) + 2 - x, h: Math.ceil(Math.max.apply(null, ys)) + 2 - y };
  }

  // ---- The artwork, flat, in its own colors ----
  // An uploaded logo in its own colors. A file without transparency has its white background left off, as a
  // decorator would (the sample logo keeps its own Undo for that).
  var logoCache = {};
  function logoImage(url) {
    if (!logoCache[url]) {
      var entry = logoCache[url] = { ready: false }, img = new Image();
      img.onload = function () {
        var k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
        var data = g.getImageData(0, 0, c.width, c.height), d = data.data, clear = 0, p;
        for (p = 3; p < d.length; p += 4) if (d[p] < 128) clear++;
        if (clear < d.length / 4 * 0.02) {
          for (p = 0; p < d.length; p += 4) {
            var L = (0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2]) / 255;
            d[p + 3] = Math.round(d[p + 3] * Math.max(0, Math.min(1, (0.95 - L) / 0.12)));
          }
          g.putImageData(data, 0, 0);
        }
        entry.canvas = c; entry.ready = true;
        if (api) api.render();
      };
      img.src = url;
    }
    return logoCache[url].ready ? logoCache[url].canvas : null;
  }
  // The sample logo (pinecrest-logo.jpg), as on the other designers: navy, on its white square when that's kept.
  function sampleLogo(g, k, white) {
    g.save(); g.scale(k, k);
    if (white) { g.fillStyle = '#FFFFFF'; g.fillRect(-78, -78, 156, 156); }
    g.fillStyle = g.strokeStyle = '#1F2E55';
    g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 64, 0, Math.PI * 2); g.stroke();
    g.beginPath(); [[0, -50], [20, -18], [11, -18], [27, 6], [-27, 6], [-11, -18], [-20, -18]].forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); });
    g.closePath(); g.fill(); g.fillRect(-5, 6, 10, 11);
    g.textAlign = 'center'; g.font = '700 12px Figtree, sans-serif'; spacing(g, 2); g.fillText('PINECREST', 0, 36);
    g.font = '400 8px Figtree, sans-serif'; g.fillText('GOLF CLUB', 0, 50);
    g.restore();
  }
  function spacing(g, px) { if ('letterSpacing' in g) g.letterSpacing = px + 'px'; }

  // Paints one spot's artwork into its own canvas; answers whether its lettering comes out too small.
  function paintArt(art, spot, color) {
    var W = Math.round(spot.width * A.pxPerIn * Q), H = Math.round(spot.height * A.pxPerIn * Q);
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), m = 0.05 * Math.min(W, H), sw = W - 2 * m, sh = H - 2 * m, cx = W / 2, cy = H / 2;
    var fam = FONTS[art.font] || FONTS.classic, small = false, ppi = A.pxPerIn * Q;
    g.fillStyle = A.colors[color].light ? THREAD.light : THREAD.dark;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; spacing(g, 0);
    if (art.tab === 'logo') {
      var pct = (art.logoSize || 85) / 100, logo = art.logo || {};
      if (logo.sample) {
        var white = !logo.bgRemoved, size = white ? 156 : 132;
        g.save(); g.translate(cx, cy); sampleLogo(g, Math.min(sw, sh) / size * pct, white); g.restore();
      } else if (logo.url && !logo.isPdf) {
        var img = logoImage(logo.url);
        if (img) {
          var k = Math.min(sw / img.width, sh / img.height) * pct;
          g.drawImage(img, cx - img.width * k / 2, cy - img.height * k / 2, img.width * k, img.height * k);
        }
      }
    } else if (art.tab === 'monogram') {
      var letters = art.mono || '';
      if (letters) {
        g.font = '100px ' + fam; spacing(g, 6);
        var mm = g.measureText(letters), mw = mm.actualBoundingBoxLeft + mm.actualBoundingBoxRight, mh = mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent;
        var km = Math.min(sw / mw, sh * 0.62 / mh);
        g.font = Math.round(100 * km) + 'px ' + fam; spacing(g, Math.round(6 * km));
        g.fillText(letters, cx + (mm.actualBoundingBoxLeft - mm.actualBoundingBoxRight) * km / 2, cy + (mm.actualBoundingBoxAscent - mm.actualBoundingBoxDescent) * km / 2);
        if (mh * km / ppi < METHODS[spot.method].minCap) small = true;
      }
    } else {
      // Two lines, the second at 72% of the first; as wide as the spot allows, and at most 64% as tall.
      var lines = [art.line1 || '', art.line2 || ''].filter(function (t) { return t.trim(); });
      if (lines.length) {
        var scale = [1, 0.72], gap = 24;
        var ms = lines.map(function (t, i) { g.font = (100 * scale[i]) + 'px ' + fam; return g.measureText(t); });
        var bw = Math.max.apply(null, ms.map(function (x) { return x.actualBoundingBoxLeft + x.actualBoundingBoxRight; }));
        var hs = ms.map(function (x) { return x.actualBoundingBoxAscent + x.actualBoundingBoxDescent; });
        var bh = hs.reduce(function (a, b) { return a + b; }, 0) + (lines.length - 1) * gap;
        var kk = Math.min(sw / bw, sh * 0.64 / bh), y = cy - bh * kk / 2;
        lines.forEach(function (t, i) {
          var px = 100 * scale[i] * kk;
          g.font = px + 'px ' + fam;
          g.fillText(t, cx, y + ms[i].actualBoundingBoxAscent * kk);
          y += hs[i] * kk + gap * kk;
          if (px * 0.7 / ppi < METHODS[spot.method].minCap) small = true;
        });
      }
    }
    return { canvas: c, small: small };
  }

  // ---- A spot on the polo: the artwork placed on the photo, then given the fabric's shading ----
  // Each pixel keeps the artwork's color, darkened or lightened by how the fabric under it is lit (its brightness
  // against the fabric's lit tone, in linear light), and only where there's fabric. Thread and ink sit a touch below
  // their own white in the studio light (INK), so white lettering keeps the folds too.
  function layerFor(spot, art, color) {
    var b = boxOf(spot), fabric = pixelsUnder(color, spot.view, b);
    if (!fabric) return null;
    var painted = paintArt(art, spot, color);
    var c = document.createElement('canvas'); c.width = b.w; c.height = b.h;
    var g = c.getContext('2d', { willReadFrequently: true });
    var w = spot.width * A.pxPerIn * (spot.squeeze || 1), h = spot.height * A.pxPerIn;
    g.translate(spot.x - b.x, spot.y - b.y); g.rotate((spot.turn || 0) * Math.PI / 180);
    g.drawImage(painted.canvas, -w / 2, -h / 2, w, h);
    var data = g.getImageData(0, 0, b.w, b.h), d = data.data;
    var lit = hexLum(A.colors[color].lit || A.colors[color].hex) / INK;
    for (var p = 0; p < d.length; p += 4) {
      if (!d[p + 3]) continue;
      var s = (0.2126 * LIN[fabric[p]] + 0.7152 * LIN[fabric[p + 1]] + 0.0722 * LIN[fabric[p + 2]]) / lit;
      s = s < 0.3 ? 0.3 : s > 1.2 ? 1.2 : s;
      d[p] = srgb(LIN[d[p]] * s); d[p + 1] = srgb(LIN[d[p + 1]] * s); d[p + 2] = srgb(LIN[d[p + 2]] * s);
      d[p + 3] = Math.round(d[p + 3] * fabric[p + 3] / 255);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.putImageData(data, 0, 0);
    return { canvas: c, box: b, small: painted.small };
  }

  // ---- Drawing: the stage, the close-up of the spot being edited, and each spot's picture in the list ----
  var view = null, layers = {};
  function outline(g, spot, light, alpha, k) {
    g.save(); g.beginPath();
    corners(spot).forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0] * k.s + k.x, p[1] * k.s + k.y); });
    g.closePath(); g.setLineDash([12 * k.d, 9 * k.d]); g.lineWidth = 3 * k.d;
    g.strokeStyle = light ? 'rgba(18, 52, 42, ' + alpha + ')' : 'rgba(255, 255, 255, ' + (alpha + 0.1) + ')';
    g.stroke(); g.restore();
  }
  // Part of a view, photo and artwork, drawn into a canvas: the region is a square of `side` photo pixels around x, y.
  function crop(canvas, state, v, x, y, side, dashed) {
    var g = canvas.getContext('2d'), img = photo(state.color, v), k = canvas.width / side, x0 = x - side / 2, y0 = y - side / 2;
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (!img) return;
    var f = img.naturalWidth / A.size;
    g.drawImage(img, x0 * f, y0 * f, side * f, side * f, 0, 0, canvas.width, canvas.height);
    A.spots.forEach(function (sp) {
      var l = layers[sp.id];
      if (sp.view === v && l) g.drawImage(l.canvas, (l.box.x - x0) * k, (l.box.y - y0) * k, l.box.w * k, l.box.h * k);
    });
    if (dashed) outline(g, dashed, !!A.colors[state.color].light, 0.55, { s: k, x: -x0 * k, y: -y0 * k, d: Math.max(0.5, k * 0.9) });
  }
  function cropSide(spot) { return Math.max(spot.width * (spot.squeeze || 1), spot.height) * A.pxPerIn * 1.7 + 40; }

  function drawStage(state) {
    var st = document.querySelector('[data-app-stage]'); if (!st) return;
    var active = spotById(state.spot);
    if (!view) view = active.view;
    var img = st.querySelector('[data-app-photo]'), src = photoUrl(state.color, view);
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    var canvas = st.querySelector('[data-app-art]'), g = canvas.getContext('2d');
    g.clearRect(0, 0, canvas.width, canvas.height);
    A.spots.forEach(function (sp) {
      var l = layers[sp.id];
      if (sp.view === view && l) g.drawImage(l.canvas, l.box.x, l.box.y);
    });
    var light = !!A.colors[state.color].light;
    if (active.view === view) outline(g, active, light, 0.42, { s: 1, x: 0, y: 0, d: 1 });
    st.querySelector('[data-app-chip]').textContent = active.view === view
      ? 'Dashed line: the ' + lower(active.name) + ', up to ' + active.width + ' × ' + active.height + ' in'
      : 'The ' + lower(active.name) + ' is on the ' + A.views[active.view].toLowerCase();
    $$('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === view)); });
    canvas.setAttribute('aria-label', 'Preview of your polo, ' + A.views[view].toLowerCase() + ' view: ' + describe(state));
    // The close-up of the spot being edited, on whichever side it is.
    var close = st.querySelector('[data-app-closeup]');
    if (close) {
      crop(close, state, active.view, active.x, active.y, cropSide(active), null);
      st.querySelector('[data-app-closeup-name]').textContent = active.name;
    }
  }
  function drawSpotList(state) {
    A.spots.forEach(function (sp) {
      var art = state.spots[sp.id], row = document.querySelector('[data-spot-row="' + sp.id + '"]');
      if (!row) return;
      var pick = row.querySelector('[data-spot]'), sw = row.querySelector('[data-spot-toggle]');
      pick.setAttribute('aria-pressed', String(sp.id === state.spot));
      row.classList.toggle('is-on', art.on); row.classList.toggle('is-editing', sp.id === state.spot);
      sw.setAttribute('aria-checked', String(art.on));
      row.querySelector('[data-spot-what]').textContent = art.on ? whatOn(art, sp) : 'Off';
      crop(row.querySelector('canvas'), state, sp.view, sp.x, sp.y, cropSide(sp), art.on ? null : sp);
    });
    var active = spotById(state.spot);
    byId('spot-editing').textContent = 'Artwork for the ' + lower(active.name);
  }

  // The picture the cart and the recent-design cards keep: the side with the first spot that's on.
  function snapshot(state) {
    var first = A.spots.filter(function (sp) { return state.spots[sp.id].on; })[0] || A.spots[0], v = first.view, img = photo(state.color, v);
    if (!img) return null;
    var c = document.createElement('canvas'); c.width = 432; c.height = 400;
    var g = c.getContext('2d'), sh = 1330, sw = sh * 432 / 400, sx = A.size / 2 - sw / 2, sy = 120, k = 400 / sh, f = img.naturalWidth / A.size;
    g.drawImage(img, sx * f, sy * f, sw * f, sh * f, 0, 0, 432, 400);
    A.spots.forEach(function (sp) {
      var l = layers[sp.id];
      if (sp.view === v && l) g.drawImage(l.canvas, (l.box.x - sx) * k, (l.box.y - sy) * k, l.box.w * k, l.box.h * k);
    });
    try { return c.toDataURL('image/webp', 0.9); } catch (e) { return null; }
  }

  // ---- Words: a spot's artwork, the design in a sentence ----
  function whatOn(art, spot) {
    var how = METHODS[spot.method].name;
    if (art.tab === 'logo') return (art.logo ? art.logo.name : 'Your logo') + ', ' + how;
    if (art.tab === 'monogram') return 'Monogram ' + (art.mono || '(blank)') + ', ' + how;
    var t = [art.line1, art.line2].filter(Boolean).join(' / ');
    return '“' + (t || '(blank)') + '”, ' + how;
  }
  function describe(state) {
    var parts = A.spots.filter(function (sp) { return state.spots[sp.id].on; }).map(function (sp) {
      var art = state.spots[sp.id], how = METHODS[sp.method].name, font = FONT_NAMES[art.font] || 'Classic', what;
      if (art.tab === 'logo') what = 'your logo (' + (art.logo ? art.logo.name : 'logo') + ')';
      else if (art.tab === 'monogram') what = 'the monogram “' + (art.mono || '') + '” in ' + font + ' lettering';
      else what = '“' + [art.line1, art.line2].filter(Boolean).join(' / ') + '” in ' + font + ' lettering';
      return sp.name + ': ' + what + ', ' + how + '.';
    });
    return A.colors[state.color].name + ' polo. ' + parts.join(' ');
  }

  // ---- Keeping the designer's artwork and the spots in step ----
  function syncActive(state) { var s = state.spots[state.spot]; ART.forEach(function (k) { s[k] = state[k]; }); }
  function loadSpot(state, id) {
    state.spot = id;
    var s = state.spots[id];
    ART.forEach(function (k) { if (s[k] != null) state[k] = s[k]; });
    byId('line1').value = state.line1; byId('line2').value = state.line2; byId('mono').value = state.mono;
    var err = byId('upload-error'); if (err) err.hidden = true;
  }
  // A new set of spots, each with its own artwork, from the starting state (the logo is the page's sample logo).
  function startSpots(state) {
    var out = {};
    A.spots.forEach(function (sp) {
      var st = A.start.spots[sp.id] || {}, s = { on: !!st.on };
      ART.forEach(function (k) { s[k] = st[k] != null ? st[k] : state[k]; });
      out[sp.id] = s;
    });
    return out;
  }

  // ---- Sizes: the quantity is their total; a price-break click spreads the new total over the same sizes ----
  function spread(sizes, qty) {
    var base = total(sizes) ? sizes : A.start.sizes, sum = total(base), out = {}, rest = [], given = 0;
    A.sizes.forEach(function (k) { var exact = (base[k] || 0) * qty / sum; out[k] = Math.floor(exact); given += out[k]; rest.push([exact - out[k], k]); });
    rest.sort(function (a, b) { return b[0] - a[0]; });
    for (var n = 0; given < qty; n++, given++) out[rest[n % rest.length][1]]++;
    return out;
  }
  function syncSizes(state) {
    if (total(state.sizes) !== state.qty) state.sizes = spread(state.sizes, state.qty);
    $$('input[data-size]').forEach(function (inp) {
      if (document.activeElement !== inp) inp.value = String(state.sizes[inp.dataset.size] || 0);
      inp.closest('.size-cell').classList.toggle('is-zero', !state.sizes[inp.dataset.size]);
    });
    var short = state.qty < A.min, note = byId('size-min');
    note.hidden = !short; byId('size-min-hint').hidden = short;
    if (short) byId('size-min-text').textContent = 'The minimum is ' + A.min + ' polos per design, across sizes. Add ' + (A.min - state.qty) + ' more to any size.';
    byId('add-to-cart').disabled = short;
  }

  function syncControls(state) {
    byId('logo-size').value = String(state.logoSize);
    byId('logo-size-out').textContent = state.logoSize + '%';
    var active = spotById(state.spot);
    byId('logo-color-note').textContent = 'Your logo is ' + METHODS[active.method].name + ' in its own colors, and shows flat here.';
    byId('thread-note').textContent = 'Lettering is ' + METHODS[active.method].name + ' in ' +
      (A.colors[state.color].light ? 'Pine on a light polo.' : 'white on a dark polo.');
  }
  // Review links: mark the one that matches this address (once the designer has tidied it, on the first draw).
  var marked = false;
  function markReview() {
    if (marked) return; marked = true;
    $$('.review-switch a[data-review]').forEach(function (a) {
      if (a.getAttribute('data-review') === location.search) a.setAttribute('aria-current', 'page');
    });
  }

  // The spot rows come from the configuration, so another garment's spots appear without new markup.
  var TICK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function buildSpots() {
    var root = document.querySelector('[data-spots]');
    if (!root) return;
    root.innerHTML = A.spots.map(function (sp) {
      return '<li class="spot" data-spot-row="' + sp.id + '">' +
        '<button type="button" class="spot-pick" data-spot="' + sp.id + '" aria-pressed="false">' +
          '<canvas class="spot-thumb" width="120" height="120" aria-hidden="true"></canvas>' +
          '<span class="spot-text"><span class="spot-name">' + sp.name + '</span><span class="spot-what" data-spot-what></span></span>' +
          '<span class="spot-editing">Editing</span></button>' +
        '<button type="button" class="switch" role="switch" aria-checked="false" data-spot-toggle="' + sp.id + '" aria-label="' + sp.name + ' on">' +
          '<span class="switch-knob">' + TICK + '</span></button></li>';
    }).join('');
    // Which spots are embroidered and which printed, in one sentence (each spot's size shows on the stage).
    var by = {};
    A.spots.forEach(function (sp) { (by[sp.method] = by[sp.method] || []).push(lower(sp.name)); });
    var said = Object.keys(by).map(function (m) { var n = by[m]; return (n.length > 1 ? n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1] : n[0]) + (n.length > 1 ? ' are ' : ' is ') + METHODS[m].name; });
    byId('spots-hint').textContent = said.join('; the ').replace(/^./, function (c) { return 'The ' + c; }) + '. Every spot you turn on is in the price per polo.';
    var views = document.querySelector('[data-app-views]'), keys = Object.keys(A.views);
    if (views) {
      views.innerHTML = keys.map(function (v) { return '<button type="button" data-view="' + v + '" aria-pressed="false">' + A.views[v] + '</button>'; }).join('');
      views.hidden = keys.length < 2;
    }
  }

  window.HonorsProduct = {
    product: A.product, name: A.name, noun: A.noun, page: A.page,
    keep: ['spots', 'spot', 'sizes', 'logoSize'],
    colors: A.colors,
    tiers: A.tiers,
    min: A.min,
    minPx: 400,   // about 100 pixels per inch across the 4-inch chest
    nextLabel: { 1: 'Next: polo', 2: 'Next: sizes' },
    unit: {
      count: function (n) { return n + (n === 1 ? ' polo' : ' polos'); },
      each: function (price) { return '$' + price + ' each'; },
      best: 'You’re getting the best price per polo.'
    },
    state: {
      code: A.code, tab: A.start.tab, color: A.start.color, font: A.start.font, logoSize: A.start.logoSize,
      line1: A.start.line1, line2: A.start.line2, mono: A.start.mono,
      sizes: Object.assign({}, A.start.sizes), qty: total(A.start.sizes), spot: 'chest'
    },
    draw: function (state) {
      if (!A.colors[state.color]) state.color = Object.keys(A.colors)[0];
      if (!state.spots || !state.spots[A.spots[0].id]) state.spots = startSpots(state);
      if (!spotById(state.spot)) state.spot = A.spots[0].id;
      syncActive(state);
      syncSizes(state);
      syncControls(state);
      markReview();
      layers = {};
      var small = false;
      A.spots.forEach(function (sp) {
        if (!state.spots[sp.id].on) return;
        var l = layerFor(sp, state.spots[sp.id], state.color);
        if (l) { layers[sp.id] = l; if (sp.id === state.spot && l.small) small = true; }
      });
      drawStage(state);
      drawSpotList(state);
      return small;
    },
    design: function (d, state) {
      syncActive(state);
      var shot = snapshot(state);
      var spots = JSON.parse(JSON.stringify(state.spots));
      Object.keys(spots).forEach(function (k) { if (spots[k].logo && !spots[k].logo.sample) spots[k].logo.url = null; });
      Object.assign(d, { product: A.product, sizes: Object.assign({}, state.sizes), spots: spots, spot: state.spot, logoSize: state.logoSize,
        summary: describe(state), preview: shot, noPreview: !shot });
    },
    init: function (a) {
      api = a;
      a.state.spots = startSpots(a.state);
      buildSpots();
      // Only the allowed styles are offered.
      $$('button[data-tab]').forEach(function (b) { if (A.styles.indexOf(b.dataset.tab) === -1) b.hidden = true; });
      // Load every photo now, so a color or side changes at once.
      Object.keys(A.colors).forEach(function (c) { Object.keys(A.views).forEach(function (v) { photo(c, v); }); });
      // Choosing a spot edits its artwork (an off spot is switched on first) and turns the polo to its side.
      $$('[data-spot]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.dataset.spot, s = a.state.spots[id];
          syncActive(a.state);
          loadSpot(a.state, id);
          view = spotById(id).view;
          if (!s.on) { s.on = true; a.set({ spots: a.state.spots }); } else a.render();
        });
      });
      $$('[data-spot-toggle]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.dataset.spotToggle, s = a.state.spots[id];
          var others = A.spots.filter(function (sp) { return sp.id !== id && a.state.spots[sp.id].on; });
          if (s.on && !others.length) return;   // one spot always stays on
          syncActive(a.state);
          s.on = !s.on;
          if (s.on) { loadSpot(a.state, id); view = spotById(id).view; }
          else if (a.state.spot === id) { loadSpot(a.state, others[0].id); view = others[0].view; }
          a.set({ spots: a.state.spots });
        });
      });
      $$('[data-view]').forEach(function (b) { b.addEventListener('click', function () { view = b.dataset.view; a.render(); }); });
      byId('logo-size').addEventListener('input', function (e) { a.set({ logoSize: Number(e.target.value) }); });
      // Quantity per size: typed, or nudged with the arrow keys; the total sets the price break.
      $$('input[data-size]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var n = Math.max(0, Math.min(999, parseInt(inp.value.replace(/\D/g, ''), 10) || 0)), next = Object.assign({}, a.state.sizes);
          if (inp.value !== '' && String(n) !== inp.value) inp.value = String(n);
          next[inp.dataset.size] = n;
          a.set({ sizes: next, qty: total(next) });
        });
        inp.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault();
          inp.value = String(Math.max(0, (a.state.sizes[inp.dataset.size] || 0) + (e.key === 'ArrowUp' ? 1 : -1)));
          inp.dispatchEvent(new Event('input'));
        });
        inp.addEventListener('blur', function () { inp.value = String(a.state.sizes[inp.dataset.size] || 0); });
        inp.addEventListener('focus', function () { inp.select(); });
      });
      if (document.fonts) {
        Object.keys(FONTS).forEach(function (k) { document.fonts.load('100px ' + FONTS[k]); });
        document.fonts.load('700 12px Figtree');
        document.fonts.ready.then(function () { a.render(); });
      }
    }
  };
})();
