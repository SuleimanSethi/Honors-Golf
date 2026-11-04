// The caddy kit page (UI-15; spec A-1, A-4, A-7): describes Brawn & Fox's Caddy Kit to the shared designer (designer.js)
// and draws it. Built from the approved towel page (towel.js): the color first, the artwork printed in
// the buyer's pick of colors, Brawn & Fox's other photos beside the stage, price breaks and checkout (D-118).
// The kit is Brawn & Fox's own hard zip case with its glove holder (owner, session 15: "Yes, Brawn & Fox's case"). The
// design is shown on the case standing upright with its lid facing the camera straight on: Brawn & Fox's photo of each
// color redrawn that way, with a plain lid (owner, session 15: "make it straight and vertical so it clearly shows the
// caddy, and then add the logo there"; tools/caddy/redraw.py, img/CREDITS.md). Brawn & Fox's own photos (at an angle,
// the fox taken out of the lid, and the open case) are beside the stage. The logo spot is centred on the lid, a
// placeholder until Chuck says where (meeting item 9); its size and the prices are examples (OQ-3). `u` and `v` are the
// lid's directions along and across it, in photo pixels per inch (straight on: plain right and down).
// Printed, like the towel (A-4): the artwork shows flat with the lid's weave showing through the ink.
(function () {
  'use strict';

  // A camo swatch shows its three tones as blobs (measured from each photo), not one flat color.
  function camo(light, mid, dark) {
    return 'radial-gradient(circle at 30% 32%, ' + dark + ' 0 26%, transparent 27%), radial-gradient(circle at 74% 70%, ' + light + ' 0 30%, transparent 31%), ' + mid;
  }
  var CADDY = {
    product: 'caddy-kit',
    name: 'Brawn & Fox caddy kit',      // as the cart and the recent-design cards name it
    noun: 'caddy kit',
    page: 'caddy.html',
    code: 'HGS-10455',                  // the next free sample design code (… polo 10453, towel 10454)
    styles: ['logo', 'text', 'monogram'],
    min: 24,
    tiers: [{ min: 24, price: 32 }, { min: 72, price: 29 }, { min: 144, price: 27 }],   // examples, the same as cart.js
    w: 1800, h: 1200,                   // the design pictures' size in pixels
    spot: { name: 'Logo spot', width: 3, height: 2 },   // an example, until Chuck says (meeting item 9)
    // Each color: its design picture, the spot's centre on it (x, y) and the lid's directions there, along it (u) and
    // across it (v), in pixels per inch (printed by tools/caddy/make.py, the case taken as 4.5 in wide); `light` cases
    // take Pine for text and monograms unless the buyer picks another ink, the others white. `views`: Brawn & Fox's own
    // photos, shown beside the stage (the open case is the same for every color).
    colors: {
      white: { name: 'White', hex: '#F5F7FB', light: true, photo: 'img/caddy-bf-white.webp', at: { x: 948, y: 622, u: [105.1, 0], v: [0, 105.1] }, views: ['angle', 'open', 'inside'] },
      black: { name: 'Black', hex: '#2C272B', photo: 'img/caddy-bf-black.webp', at: { x: 948, y: 622, u: [105.1, 0], v: [0, 105.1] }, views: ['angle', 'open', 'inside'] },
      blue: { name: 'Blue', hex: '#13529E', photo: 'img/caddy-bf-blue.webp', at: { x: 948, y: 622, u: [104.7, 0], v: [0, 104.7] }, views: ['angle', 'open', 'inside'] },
      'green-camo': { name: 'Green Camo', hex: '#373F49', swatch: camo('#4E5861', '#373F49', '#262A35'), photo: 'img/caddy-bf-green-camo.webp', at: { x: 949, y: 627, u: [104.9, 0], v: [0, 104.9] }, views: ['angle', 'open', 'inside'] }
    },
    views: {
      angle: { label: 'At an angle', src: 'img/caddy-bf-{c}-angle.webp', thumb: 'img/caddy-bf-{c}-angle-thumb.webp' },
      open: { label: 'Open, with what it holds', src: 'img/caddy-bf-open.webp', thumb: 'img/caddy-bf-open-thumb.webp' },
      inside: { label: 'The glove holder inside', src: 'img/caddy-bf-inside.webp', thumb: 'img/caddy-bf-inside-thumb.webp' }
    },
    // The print colors (examples until Chuck's printer gives his): `own` is a logo's own colors.
    inks: {
      white: { name: 'White', hex: '#FFFFFF' }, black: { name: 'Black', hex: '#1B1B1B' }, navy: { name: 'Navy', hex: '#1F2E55' },
      pine: { name: 'Pine', hex: '#12342A' }, gold: { name: 'Gold', hex: '#B08D3C' }, grey: { name: 'Grey', hex: '#9EA2A6' }
    },
    start: { tab: 'logo', color: 'white', qty: 48, font: 'classic', logoSize: 85, line1: 'Pinecrest', line2: 'Golf Club', mono: 'PGC', ink: 'own' }
  };
  var A = CADDY;
  // The colors as swatches, before the designer wires them up.
  (function () {
    var root = document.querySelector('.swatches'); if (!root) return;
    root.innerHTML = Object.keys(A.colors).map(function (k) {
      var c = A.colors[k];
      return '<button type="button" class="swatch" data-color="' + k + '" aria-label="' + c.name + '" aria-pressed="' + (k === A.start.color) + '"><span style="background:' + (c.swatch || c.hex) + '"></span></button>';
    }).join('');
  })();

  // The ink a design prints in: the buyer's pick, or for text and monograms left on "own colors", Pine on the white case
  // and white on the others; null = a logo in its own colors.
  function inkOf(state) {
    if (A.inks[state.ink]) return state.ink;
    return state.tab === 'logo' ? null : A.colors[state.color].light ? 'pine' : 'white';
  }
  var MIN_CAP = 0.15;                                // capitals smaller than this (inches) blur in the lid's weave
  var FONTS = {
    classic: "'Marcellus', Georgia, serif", block: "'Alfa Slab One', Georgia, serif",
    script: "'Pinyon Script', cursive", clean: "'Figtree', 'Helvetica Neue', sans-serif"
  };
  var FONT_NAMES = { classic: 'Classic', block: 'Block', script: 'Script', clean: 'Clean' };

  function byId(id) { return document.getElementById(id); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  // The spot on a color's photo: its centre and the lid's directions there (pixels per inch), with the spot's size; `ppi`
  // is the larger of the two scales, for painting the artwork.
  function spotOn(color) {
    var at = A.colors[color].at;
    return { x: at.x, y: at.y, u: at.u, v: at.v, ppi: Math.max(Math.hypot(at.u[0], at.u[1]), Math.hypot(at.v[0], at.v[1])), width: A.spot.width, height: A.spot.height };
  }
  // A point given in inches from the spot's centre (along, across), on the photo.
  function onLid(sp, a, b) { return [sp.x + a * sp.u[0] + b * sp.v[0], sp.y + a * sp.u[1] + b * sp.v[1]]; }

  // ---- Photos: every color loaded once ----
  var photos = {}, api = null;
  function photo(color) {
    if (!photos[color]) {
      var img = new Image();
      photos[color] = img;
      img.onload = function () { if (api) api.render(); };
      img.src = A.colors[color].photo;
    }
    return photos[color].complete && photos[color].naturalWidth ? photos[color] : null;
  }

  // ---- The spot's place on the photo: its corners and the box of pixels it covers ----
  function corners(sp) {
    var w = sp.width / 2, h = sp.height / 2;
    return [[-w, -h], [w, -h], [w, h], [-w, h]].map(function (p) { return onLid(sp, p[0], p[1]); });
  }
  function boxOf(sp, pad) {
    var pts = corners(sp), xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var x = Math.floor(Math.min.apply(null, xs)) - pad, y = Math.floor(Math.min.apply(null, ys)) - pad;
    return { x: x, y: y, w: Math.ceil(Math.max.apply(null, xs)) + pad - x, h: Math.ceil(Math.max.apply(null, ys)) + pad - y };
  }

  // ---- The artwork, flat, in its own colors (as on the polo page) ----
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
        if (clear < d.length / 4 * 0.02) {   // no transparency: the white background is left off, as a printer would
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
  // A logo in one ink: its dark parts take the ink and its light parts stay the case, as a one-color print separates it.
  var maskCache = {};
  function logoMask(url, hex) {
    var key = url + hex, src = logoImage(url);
    if (!src) return null;
    if (maskCache[key]) return maskCache[key];
    var c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0);
    var data = g.getImageData(0, 0, c.width, c.height), d = data.data, n = parseInt(hex.slice(1), 16);
    for (var p = 0; p < d.length; p += 4) {
      var L = (0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2]) / 255;
      d[p + 3] = Math.round(d[p + 3] * Math.max(0, Math.min(1, (0.88 - L) / 0.3)));
      d[p] = n >> 16; d[p + 1] = (n >> 8) & 255; d[p + 2] = n & 255;
    }
    g.putImageData(data, 0, 0);
    return (maskCache[key] = c);
  }
  // The sample logo (pinecrest-logo.jpg), as on the other designers: navy, on its white square when that's kept. In one
  // ink, a kept square prints in the ink with the logo left the case's own color inside it.
  function sampleLogo(g, k, white, hex) {
    g.save(); g.scale(k, k);
    if (white) { g.fillStyle = hex || '#FFFFFF'; g.fillRect(-78, -78, 156, 156); if (hex) g.globalCompositeOperation = 'destination-out'; }
    g.fillStyle = g.strokeStyle = hex || '#1F2E55';
    g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 64, 0, Math.PI * 2); g.stroke();
    g.beginPath(); [[0, -50], [20, -18], [11, -18], [27, 6], [-27, 6], [-11, -18], [-20, -18]].forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); });
    g.closePath(); g.fill(); g.fillRect(-5, 6, 10, 11);
    g.textAlign = 'center'; g.font = '700 12px Figtree, sans-serif'; spacing(g, 2); g.fillText('PINECREST', 0, 36);
    g.font = '400 8px Figtree, sans-serif'; g.fillText('GOLF CLUB', 0, 50);
    g.restore();
  }
  function spacing(g, px) { if ('letterSpacing' in g) g.letterSpacing = px + 'px'; }

  // Paints the artwork for the spot at `ppi`; answers whether its lettering comes out too small, and its capital height.
  function paintArt(state, ppi) {
    var W = Math.round(A.spot.width * ppi), H = Math.round(A.spot.height * ppi), cap = 0, small = false, twoLines = false;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), m = 0.05 * Math.min(W, H), sw = W - 2 * m, sh = H - 2 * m, cx = W / 2, cy = H / 2;
    var fam = FONTS[state.font] || FONTS.classic;
    var ink = inkOf(state), hex = ink ? A.inks[ink].hex : null;
    g.fillStyle = hex || '#12342A';
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; spacing(g, 0);
    if (state.tab === 'logo') {
      var pct = (state.logoSize || 85) / 100, logo = state.logo || {};
      if (logo.sample) {
        var white = !logo.bgRemoved, size = white ? 156 : 132;
        g.save(); g.translate(cx, cy); sampleLogo(g, Math.min(sw, sh) / size * pct, white, hex); g.restore();
      } else if (logo.url && !logo.isPdf) {
        var img = hex ? logoMask(logo.url, hex) : logoImage(logo.url);
        if (img) {
          var k = Math.min(sw / img.width, sh / img.height) * pct;
          g.drawImage(img, cx - img.width * k / 2, cy - img.height * k / 2, img.width * k, img.height * k);
        }
      }
    } else if (state.tab === 'monogram') {
      var letters = state.mono || '';
      if (letters) {
        g.font = '100px ' + fam; spacing(g, 6);
        var mm = g.measureText(letters), mw = mm.actualBoundingBoxLeft + mm.actualBoundingBoxRight, mh = mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent;
        var km = Math.min(sw / mw, sh * 0.7 / mh);
        g.font = Math.round(100 * km) + 'px ' + fam; spacing(g, Math.round(6 * km));
        g.fillText(letters, cx + (mm.actualBoundingBoxLeft - mm.actualBoundingBoxRight) * km / 2, cy + (mm.actualBoundingBoxAscent - mm.actualBoundingBoxDescent) * km / 2);
        cap = mh * km / ppi;
        if (cap < MIN_CAP) small = true;
      }
    } else {
      // Two lines, the second at 72% of the first; as wide as the spot allows, and at most 70% as tall.
      var lines = [state.line1 || '', state.line2 || ''].filter(function (t) { return t.trim(); });
      if (lines.length) {
        var scale = [1, 0.72], gap = 22;
        var ms = lines.map(function (t, i) { g.font = (100 * scale[i]) + 'px ' + fam; return g.measureText(t); });
        var bw = Math.max.apply(null, ms.map(function (x) { return x.actualBoundingBoxLeft + x.actualBoundingBoxRight; }));
        var hs = ms.map(function (x) { return x.actualBoundingBoxAscent + x.actualBoundingBoxDescent; });
        var bh = hs.reduce(function (a, b) { return a + b; }, 0) + (lines.length - 1) * gap;
        var kk = Math.min(sw / bw, sh * 0.7 / bh), y = cy - bh * kk / 2;
        lines.forEach(function (t, i) {
          var px = 100 * scale[i] * kk;
          g.font = px + 'px ' + fam;
          g.fillText(t, cx, y + ms[i].actualBoundingBoxAscent * kk);
          y += hs[i] * kk + gap * kk;
          if (i === 0) cap = px * 0.7 / ppi;
          if (px * 0.7 / ppi < MIN_CAP) small = true;
        });
        twoLines = lines.length > 1;
      }
    }
    return { canvas: c, small: small, cap: cap, twoLines: twoLines };
  }

  // ---- The print (A-4): the artwork in its own colors on the spot, with the lid's weave showing through the ink ----
  // sRGB <-> linear light, for the weave's shading.
  var LIN = [];
  for (var i = 0; i < 256; i++) { var v = i / 255; LIN[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function srgb(x) { x = x <= 0 ? 0 : x >= 1 ? 1 : x; return Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255); }
  var S = 2, INK_COVER = 0.96, weaves = {}, memo = null;   // the print is drawn at twice the photo's pixels, for the close-up
  // The weave under the spot: each pixel's brightness against its neighbourhood's (the photo against a blurred copy), so
  // the weave's pits darken the ink and its ridges lift it, while the lid's light and a camo print's patches don't.
  function weaveOf(color) {
    if (weaves[color]) return weaves[color];
    var img = photo(color); if (!img) return null;
    var b = boxOf(spotOn(color), 4), W = b.w * S, H = b.h * S, f = img.naturalWidth / A.w, pad = 16;
    function region(blur) {
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var g = c.getContext('2d', { willReadFrequently: true }); if (blur) g.filter = 'blur(' + blur + 'px)';
      g.drawImage(img, (b.x - pad) * f, (b.y - pad) * f, (b.w + 2 * pad) * f, (b.h + 2 * pad) * f, -pad * S, -pad * S, W + 2 * pad * S, H + 2 * pad * S);
      return g.getImageData(0, 0, W, H).data;
    }
    var sharp = region(0), soft = region(5 * S), ratio = new Float32Array(W * H), cover = new Uint8ClampedArray(W * H);
    for (var p = 0, q = 0; q < ratio.length; p += 4, q++) {
      var l = 0.2126 * LIN[sharp[p]] + 0.7152 * LIN[sharp[p + 1]] + 0.0722 * LIN[sharp[p + 2]];
      var m = 0.2126 * LIN[soft[p]] + 0.7152 * LIN[soft[p + 1]] + 0.0722 * LIN[soft[p + 2]];
      var r = m > 0.0005 ? l / m : 1; ratio[q] = r < 0.6 ? 0.6 : r > 1.3 ? 1.3 : r; cover[q] = sharp[p + 3];
    }
    return (weaves[color] = { box: b, W: W, H: H, ratio: ratio, cover: cover });
  }
  // The print layer for the design, over the spot's box (kept until the artwork or the case's color change).
  function printed(state) {
    var logo = state.logo || {}, wv = weaveOf(state.color);
    var sig = JSON.stringify([state.tab, state.line1, state.line2, state.mono, state.font, logo.name, logo.bgRemoved, !!logo.url, state.logoSize,
      state.color, inkOf(state), !!wv, !!(logo.url && logoImage(logo.url))]);
    if (memo && memo.sig === sig) return memo;
    var sp = spotOn(state.color), b = boxOf(sp, 4), art = paintArt(state, sp.ppi * S);
    var c = document.createElement('canvas'); c.width = b.w * S; c.height = b.h * S;
    var g = c.getContext('2d', { willReadFrequently: true });
    var P = sp.ppi * S;   // the artwork's pixels per inch: each inch along and across goes onto the lid's directions
    g.setTransform(S * sp.u[0] / P, S * sp.u[1] / P, S * sp.v[0] / P, S * sp.v[1] / P, (sp.x - b.x) * S, (sp.y - b.y) * S);
    g.drawImage(art.canvas, -art.canvas.width / 2, -art.canvas.height / 2);
    if (wv) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      var data = g.getImageData(0, 0, c.width, c.height), d = data.data;
      for (var p = 0, q = 0; p < d.length; p += 4, q++) {
        if (!d[p + 3]) continue;
        var r = wv.ratio[q];
        d[p] = srgb(LIN[d[p]] * r); d[p + 1] = srgb(LIN[d[p + 1]] * r); d[p + 2] = srgb(LIN[d[p + 2]] * r);
        d[p + 3] = Math.round(d[p + 3] * INK_COVER * wv.cover[q] / 255);
      }
      g.putImageData(data, 0, 0);
    }
    return (memo = { sig: sig, canvas: c, box: b, small: art.small, bounds: bounds(art.canvas, sp.ppi * S) });
  }
  // Where the artwork is in its canvas, in inches from the spot's centre (for the close-up's framing).
  function bounds(c, ppi) {
    var d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (var y = 0; y < c.height; y++) for (var x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return null;
    return { cx: ((x0 + x1) / 2 - c.width / 2) / ppi, cy: ((y0 + y1) / 2 - c.height / 2) / ppi, w: (x1 - x0) / ppi, h: (y1 - y0) / ppi };
  }
  // The print drawn into a canvas with a 2D transform `k` (scale s, offset x, y from photo pixels).
  function drawPrint(g, state, k) {
    var m = printed(state);
    g.save(); g.imageSmoothingQuality = 'high';
    g.drawImage(m.canvas, m.box.x * k.s + k.x, m.box.y * k.s + k.y, m.box.w * k.s, m.box.h * k.s);
    g.restore();
    return m;
  }
  function outline(g, state, alpha, k) {
    var light = !!A.colors[state.color].light;
    g.save(); g.beginPath();
    corners(spotOn(state.color)).forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0] * k.s + k.x, p[1] * k.s + k.y); });
    g.closePath(); g.setLineDash([12 * k.d, 9 * k.d]); g.lineWidth = 3 * k.d;
    g.strokeStyle = light ? 'rgba(18, 52, 42, ' + alpha + ')' : 'rgba(255, 255, 255, ' + (alpha + 0.12) + ')';
    g.stroke(); g.restore();
  }

  // ---- Drawing: the stage, and the close-up of the spot ----
  function drawStage(state) {
    var st = document.querySelector('[data-app-stage]'); if (!st) return false;
    var img = st.querySelector('[data-app-photo]'), src = A.colors[state.color].photo;
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    var canvas = st.querySelector('[data-app-art]'), g = canvas.getContext('2d');
    g.clearRect(0, 0, canvas.width, canvas.height);
    var m = drawPrint(g, state, { s: 1, x: 0, y: 0 });
    outline(g, state, 0.4, { s: 1, x: 0, y: 0, d: 1 });
    st.querySelector('[data-app-chip]').textContent = 'Dashed line: the logo spot, up to ' + A.spot.width + ' × ' + A.spot.height + ' in';
    canvas.setAttribute('aria-label', 'Preview of your caddy kit: ' + describe(state));
    var close = st.querySelector('[data-app-closeup]');
    if (close) {
      // Framed on the artwork itself (a round logo is much smaller than the spot), so the print shows close up.
      var sp = spotOn(state.color), b = m.bounds || { cx: 0, cy: 0, w: sp.width, h: sp.height }, mid = onLid(sp, b.cx, b.cy);
      var side = Math.max(b.w * Math.hypot(sp.u[0], sp.u[1]), b.h * Math.hypot(sp.v[0], sp.v[1]) * 1.6, 0.8 * sp.ppi) * 1.3;
      var x0 = mid[0] - side / 2, y0 = mid[1] - side / 2;
      var cg = close.getContext('2d'), ph = photo(state.color), s = close.width / side;
      cg.clearRect(0, 0, close.width, close.height);
      if (ph) {
        var f = ph.naturalWidth / A.w;
        cg.drawImage(ph, x0 * f, y0 * f, side * f, side * f, 0, 0, close.width, close.height);
        drawPrint(cg, state, { s: s, x: -x0 * s, y: -y0 * s });
      }
    }
    return m.small;
  }

  // The picture the cart and the recent-design cards keep: the whole case.
  function snapshot(state) {
    var img = photo(state.color); if (!img) return null;
    var sp = spotOn(state.color), sh = A.h * 0.96, sw = sh * 432 / 400, sx = sp.x - sw / 2, sy = (A.h - sh) / 2;
    var c = document.createElement('canvas'); c.width = 432; c.height = 400;
    var g = c.getContext('2d'), k = 400 / sh, f = img.naturalWidth / A.w;
    g.fillStyle = '#F2F2F0'; g.fillRect(0, 0, 432, 400);   // the stage's grey where the photo has none
    g.drawImage(img, sx * f, sy * f, sw * f, sh * f, 0, 0, 432, 400);
    drawPrint(g, state, { s: k, x: -sx * k, y: -sy * k });
    try { return c.toDataURL('image/webp', 0.9); } catch (e) { return null; }
  }

  // ---- Words: the design in a sentence ----
  function describe(state) {
    var font = FONT_NAMES[state.font] || 'Classic', what;
    var ink = inkOf(state), inkName = ink ? A.inks[ink].name : 'its own colors';
    if (state.tab === 'logo') what = 'your logo (' + (state.logo ? state.logo.name : 'logo') + ') in ' + inkName;
    else if (state.tab === 'monogram') what = 'the monogram “' + (state.mono || '') + '” in ' + font + ' lettering, in ' + inkName;
    else what = '“' + [state.line1, state.line2].filter(Boolean).join(' / ') + '” in ' + font + ' lettering, in ' + inkName;
    return A.colors[state.color].name + ' caddy kit, printed with ' + what + '.';
  }
  function syncControls(state) {
    byId('logo-size').value = String(state.logoSize);
    byId('logo-size-out').textContent = state.logoSize + '%';
    // The print color: "Its own colors" is for logos only; text and monograms show the ink they print in.
    var ink = inkOf(state), own = document.querySelector('[data-ink="own"]');
    if (own) own.hidden = state.tab !== 'logo';
    $$('[data-ink]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.ink === (ink || 'own'))); });
    byId('ink-name').textContent = ink ? A.inks[ink].name : 'Its own colors';
    byId('logo-color-note').textContent = ink ? 'Your logo is printed in one color: its dark parts in ' + A.inks[ink].name + ', its light parts left as the case.' : 'Your logo is printed in its own colors.';
  }
  // Review links: mark the one that matches this address (once the designer has tidied it, on the first draw).
  var marked = false;
  function markReview() {
    if (marked) return; marked = true;
    $$('.review-switch a[data-review]').forEach(function (a) {
      if (a.getAttribute('data-review') === location.search) a.setAttribute('aria-current', 'page');
    });
  }

  // ---- Real photos beside the stage (as the hat page's, D-148; owner, session 15): thumbnails left of the stage, your
  // design first, then Brawn & Fox's other photos of the color picked, plain. A photo covers the stage until the buyer
  // clicks Your design or changes the artwork (init); a new color swaps the photos, and goes back to the
  // design if that color has no such photo. ----
  var views = null;
  function setUpViews() {
    var row = document.querySelector('[data-towel-views]'), stage = document.querySelector('[data-app-stage]');
    var real = stage && stage.querySelector('[data-towel-real]');
    if (!row || !real) return;
    var current = 'design', color = null;
    function src(c, v, kind) { return A.views[v][kind].replace('{c}', c); }
    function build() {
      var list = ['design'].concat(A.colors[color].views || []);
      row.innerHTML = list.map(function (v) {
        var img = v === 'design' ? A.colors[color].photo : src(color, v, 'thumb');
        return '<button type="button" class="towel-view" data-towel-view="' + v + '" aria-pressed="' + (v === current) + '" aria-label="' +
          (v === 'design' ? 'Your design on the caddy kit' : 'Photo of the caddy kit, ' + A.views[v].label.toLowerCase()) + '"><img src="' + img + '" alt="">' +
          (v === 'design' ? '<span class="view-tag">Yours</span>' : '') + '</button>';
      }).join('');
      $$('[data-towel-view]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.towelView); }); });
      row.hidden = list.length < 2; row.parentNode.classList.toggle('has-views', list.length > 1);
    }
    function show(v) {
      if (v !== 'design' && (A.colors[color].views || []).indexOf(v) === -1) v = 'design';
      current = v;
      $$('[data-towel-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.towelView === v)); });
      stage.classList.toggle('is-real', v !== 'design');
      if (v === 'design') return;
      real.src = src(color, v, 'src');
      real.alt = 'Photo of the caddy kit, ' + A.views[v].label.toLowerCase() + ', before your logo';
    }
    views = {
      show: show,
      color: function (c) { if (c === color) return; color = c; build(); show(current); }
    };
  }

  window.HonorsProduct = {
    product: A.product, name: A.name, noun: A.noun, page: A.page,
    keep: ['logoSize', 'ink'],
    colors: A.colors,
    tiers: A.tiers,
    min: A.min,
    minPx: 300,   // about 100 pixels per inch across the 3-inch spot
    nextLabel: { 1: 'Next: quantity', 2: 'Next: quantity' },
    unit: {
      count: function (n) { return n + (n === 1 ? ' caddy kit' : ' caddy kits'); },
      each: function (price) { return '$' + price + ' each'; },
      best: 'You’re getting the best price per caddy kit.'
    },
    state: Object.assign({ code: A.code }, A.start),
    draw: function (state) {
      if (!A.colors[state.color]) state.color = Object.keys(A.colors)[0];
      syncControls(state);
      markReview();
      if (views) views.color(state.color);
      var small = drawStage(state);
      return small;
    },
    design: function (d, state) {
      var shot = snapshot(state);
      Object.assign(d, { product: A.product, method: 'print', ink: inkOf(state) || 'own', logoSize: state.logoSize, summary: describe(state), preview: shot, noPreview: !shot });
    },
    init: function (a) {
      api = a;
      setUpViews();
      // A change to the artwork brings the design back from a photo, so the buyer sees it (the photos are the plain case).
      ['block-1'].forEach(function (id) {
        var block = byId(id); if (!block) return;
        ['click', 'input'].forEach(function (type) {
          block.addEventListener(type, function (e) { if (views && e.target.closest('button, input, select, textarea')) views.show('design'); });
        });
      });
      // Only the allowed styles are offered.
      $$('button[data-tab]').forEach(function (b) { if (A.styles.indexOf(b.dataset.tab) === -1) b.hidden = true; });
      // Load every photo now, so a color changes at once.
      Object.keys(A.colors).forEach(photo);
      byId('logo-size').addEventListener('input', function (e) { a.set({ logoSize: Number(e.target.value) }); });
      // The print colors, as swatches.
      var inks = document.querySelector('[data-inks]');
      if (inks) {
        inks.innerHTML = '<button type="button" class="swatch" data-ink="own" aria-label="Its own colors" aria-pressed="true"><span style="background:conic-gradient(#1F2E55 0 25%, #C8262B 0 50%, #B08D3C 0 75%, #1F4A36 0)"></span></button>' +
          Object.keys(A.inks).map(function (k) { return '<button type="button" class="swatch" data-ink="' + k + '" aria-label="' + A.inks[k].name + '" aria-pressed="false"><span style="background:' + A.inks[k].hex + '"></span></button>'; }).join('');
        $$('[data-ink]').forEach(function (b) { b.addEventListener('click', function () { a.set({ ink: b.dataset.ink }); }); });
      }
      if (document.fonts) {
        Object.keys(FONTS).forEach(function (k) { document.fonts.load('100px ' + FONTS[k]); });
        document.fonts.load('700 12px Figtree');
        document.fonts.ready.then(function () { a.render(); });
      }
    }
  };
})();
