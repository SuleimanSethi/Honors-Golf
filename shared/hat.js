// The hat page (UI-11, D-55): describes the rope hat to the shared designer (designer.js) and paints the patch.
// The buyer designs only the patch: a logo, text or monogram on it, its shape and material, the patch and edge
// colors, and the thread color. The hat itself is always Forest with a white rope.
// The artwork is painted on a square canvas that the 3D view (hat3d.js) projects straight onto the patch from the
// front, so nothing ever stretches. A second canvas holds the raised areas (a height map) for the stitched or molded
// look. Colors, color limits, patch sizes and the smallest stitchable lettering are examples until the patch maker
// sets them (OQ-7); prices are examples until Chuck sets them (OQ-3).
(function () {
  'use strict';

  // Review state ?state=no-3d (UI-26): the browser refuses WebGL, as on a machine without 3D support, so the page
  // takes its real fallback path (hat3d.js can't start and shows the still picture). Nothing else changes.
  var REVIEW_STATE = (function () { try { return new URLSearchParams(window.location.search).get('state') || ''; } catch (e) { return ''; } })();
  if (REVIEW_STATE === 'no-3d') {
    var getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type) { return /webgl/i.test(type) ? null : getContext.apply(this, arguments); };
  }

  var SIZE = 1024;
  // Each patch's share of the square canvas, measured from the model (width and height over the larger of the two),
  // and the patch's real width in inches (the model is in meters).
  var SHAPES = {
    round: { name: 'Round', mesh: 'Round', w: 1, h: 0.998, inches: 1.96 },
    square: { name: 'Square', mesh: 'Square', w: 1, h: 0.921, inches: 1.97 },
    rect: { name: 'Rectangle', mesh: 'Rectangular', w: 1, h: 0.699, inches: 2.68 }
  };
  var MATERIALS = {
    embroidered: { name: 'Embroidered', short: 'embroidered', colors: 8, verb: 'stitched', color: 'Thread color' },
    pvc: { name: 'Rubber (PVC)', short: 'PVC', colors: 6, verb: 'molded', color: 'Lettering color' }
  };
  var PATCH_COLORS = {
    offwhite: { name: 'Off-white', hex: '#F4F2EC' }, forest: { name: 'Forest', hex: '#1F4A36' },
    navy: { name: 'Navy', hex: '#232B40' }, black: { name: 'Black', hex: '#262626' },
    khaki: { name: 'Khaki', hex: '#BCB29D' }, grey: { name: 'Grey', hex: '#A3A6A8' }
  };
  var THREADS = {
    white: { name: 'White', hex: '#F4F2EC' }, black: { name: 'Black', hex: '#1A1B1F' },
    forest: { name: 'Forest', hex: '#1F4A36' }, navy: { name: 'Navy', hex: '#1F2E55' },
    gold: { name: 'Gold', hex: '#9A7128' }, red: { name: 'Red', hex: '#C8262B' }
  };
  var FONTS = {
    classic: "'Marcellus', Georgia, serif", block: "'Alfa Slab One', Georgia, serif",
    script: "'Pinyon Script', cursive", clean: "'Figtree', 'Helvetica Neue', sans-serif"
  };
  var FONT_NAMES = { classic: 'Classic', block: 'Block', script: 'Script', clean: 'Clean' };
  // Capitals smaller than this (about 3.3 mm) are hard to stitch or mold cleanly. Two short lines such as
  // "Pinecrest / Golf Club" pass in every lettering on a round patch; "Pinecrest Country Club" doesn't.
  var MIN_CAP_INCHES = 0.13;

  function byId(id) { return document.getElementById(id); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function canvas() { var c = document.createElement('canvas'); c.width = c.height = SIZE; return c; }
  var colorCanvas = canvas(), heightCanvas = canvas(), artCanvas = canvas();

  // ---- Where artwork may go: the patch minus a margin (the safe area, spec H-3) ----
  function region(shape) {
    var s = SHAPES[shape], pw = s.w * SIZE, ph = s.h * SIZE, m = 0.12 * Math.min(pw, ph);
    return { shape: shape, round: shape === 'round', pw: pw, ph: ph, x: (SIZE - pw) / 2, y: (SIZE - ph) / 2,
      r: pw / 2 - m, sw: pw - 2 * m, sh: ph - 2 * m, pxPerInch: SIZE / s.inches };
  }
  // The largest box of this width-to-height ratio that fits the safe area, so artwork re-fits every shape unstretched.
  function fit(aspect, R) {
    if (R.round) { var h = 2 * R.r / Math.sqrt(1 + aspect * aspect); return { w: aspect * h, h: h }; }
    var w = R.sw, hh = w / aspect;
    if (hh > R.sh) { hh = R.sh; w = hh * aspect; }
    return { w: w, h: hh };
  }
  // The scale that fits a logo's visible part (its footprint) to the safe area: on a round patch by how far the
  // logo reaches from its centre, so a round logo fills a round patch; otherwise by its visible box.
  function fitScale(fp, R) {
    return R.round ? R.r / fp.reach : Math.min(R.sw / fp.w, R.sh / fp.h);
  }
  // The sample logo's footprint in its own units: the ring (radius 66), or its white square when that's kept.
  function sampleFootprint(white) {
    return white ? { cx: 0, cy: 0, w: 156, h: 156, reach: 78 * Math.SQRT2 } : { cx: 0, cy: 0, w: 132, h: 132, reach: 66 };
  }
  // An uploaded logo's footprint, measured from a small copy: the box around its visible pixels, and the farthest
  // visible pixel from that box's centre (in the image's own pixels).
  var footprints = {};
  function footprint(img, key) {
    if (footprints[key]) return footprints[key];
    var n = 128, c = document.createElement('canvas'); c.width = c.height = n;
    var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, n, n);
    var d = g.getImageData(0, 0, n, n).data, x0 = n, y0 = n, x1 = -1, y1 = -1, pts = [];
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      if (d[(y * n + x) * 4 + 3] < 40) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; pts.push(x, y);
    }
    if (x1 < 0) { x0 = y0 = 0; x1 = y1 = n - 1; pts = [0, 0, n - 1, n - 1]; }
    var sx = img.naturalWidth / n, sy = img.naturalHeight / n, mx = (x0 + x1 + 1) / 2, my = (y0 + y1 + 1) / 2, reach = 0;
    for (var i = 0; i < pts.length; i += 2) {
      // The pixel's far corner from the centre.
      var dx = (Math.abs(pts[i] + 0.5 - mx) + 0.5) * sx, dy = (Math.abs(pts[i + 1] + 0.5 - my) + 0.5) * sy;
      reach = Math.max(reach, Math.sqrt(dx * dx + dy * dy));
    }
    return (footprints[key] = { cx: mx * sx, cy: my * sy, w: (x1 - x0 + 1) * sx, h: (y1 - y0 + 1) * sy, reach: reach });
  }

  // ---- Images: the sample logo is drawn directly; uploads load once and repaint when ready ----
  var images = {}, api = null;
  function image(url) {
    if (!images[url]) {
      var img = new Image();
      images[url] = { img: img, ready: false };
      img.onload = function () { images[url].ready = true; if (api) api.render(); };
      img.src = url;
    }
    return images[url].ready ? images[url].img : null;
  }
  // The same sample art as the ball designer, centred on (cx, cy) at k pixels per unit.
  function drawSampleLogo(g, cx, cy, k, withWhite) {
    g.save(); g.translate(cx, cy); g.scale(k, k);
    if (withWhite) { g.fillStyle = '#FFFFFF'; g.fillRect(-78, -78, 156, 156); }
    g.strokeStyle = g.fillStyle = '#1F2E55';
    g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 64, 0, Math.PI * 2); g.stroke();
    g.beginPath(); [[0, -50], [20, -18], [11, -18], [27, 6], [-27, 6], [-11, -18], [-20, -18]].forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); });
    g.closePath(); g.fill(); g.fillRect(-5, 6, 10, 11);
    g.textAlign = 'center'; g.font = '700 12px Figtree, sans-serif'; spacing(g, 2); g.fillText('PINECREST', 0, 36);
    g.font = '400 8px Figtree, sans-serif'; g.fillText('GOLF CLUB', 0, 50);
    g.restore();
  }
  function spacing(g, px) { if ('letterSpacing' in g) g.letterSpacing = px + 'px'; }

  // ---- Logo colors (spec H-5): reduced to the material's limit, with a notice ----
  var paletteCache = {};
  function logoPalette(img, key, limit) {
    var id = key + '|' + limit;
    if (paletteCache[id]) return paletteCache[id];
    var c = document.createElement('canvas'), n = 64; c.width = c.height = n;
    var g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, n, n);
    var d = g.getImageData(0, 0, n, n).data, clusters = [], total = 0;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      total++;
      var hit = null;
      for (var j = 0; j < clusters.length && !hit; j++) {
        var cl = clusters[j], dr = cl.r - d[i], dg = cl.g - d[i + 1], db = cl.b - d[i + 2];
        if (dr * dr + dg * dg + db * db < 40 * 40) hit = cl;
      }
      if (hit) { hit.n++; } else clusters.push({ r: d[i], g: d[i + 1], b: d[i + 2], n: 1 });
    }
    // Colors that cover at least 2% of the logo count; anti-aliased edges don't.
    var real = clusters.filter(function (cl) { return cl.n >= total * 0.02; }).sort(function (a, b) { return b.n - a.n; });
    var out = { count: real.length, palette: real.length > limit ? real.slice(0, limit) : null };
    paletteCache[id] = out;
    return out;
  }
  function reduceColors(g, x, y, w, h, palette) {
    x = Math.floor(x); y = Math.floor(y); w = Math.ceil(w); h = Math.ceil(h);
    var data = g.getImageData(x, y, w, h), d = data.data;
    for (var i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      var best = palette[0], bestD = Infinity;
      for (var j = 0; j < palette.length; j++) {
        var p = palette[j], dr = p.r - d[i], dg = p.g - d[i + 1], db = p.b - d[i + 2], dd = dr * dr + dg * dg + db * db;
        if (dd < bestD) { bestD = dd; best = p; }
      }
      d[i] = best.r; d[i + 1] = best.g; d[i + 2] = best.b;
    }
    g.putImageData(data, x, y);
  }

  // ---- Surface textures: twill for the fabric, satin stitches for embroidered artwork ----
  function pattern(g, draw, size) {
    var c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
    return g.createPattern(c, 'repeat');
  }
  function twill(p, s) { p.strokeStyle = 'rgba(0,0,0,0.5)'; p.lineWidth = 1.2; for (var i = -s; i <= s; i += 5) { p.beginPath(); p.moveTo(i, s); p.lineTo(i + s, 0); p.stroke(); } }
  function satin(p, s) {
    p.lineWidth = 1.6;
    for (var i = -s; i <= s * 2; i += 4) {
      p.strokeStyle = (i / 4) % 2 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
      p.beginPath(); p.moveTo(i, 0); p.lineTo(i - s * 0.55, s); p.stroke();
    }
  }

  // ---- The artwork, painted on its own transparent canvas; answers whether text is too small to stitch ----
  function paintArt(state, R) {
    var g = artCanvas.getContext('2d', { willReadFrequently: true }), cx = SIZE / 2, cy = SIZE / 2, small = false;
    var thread = THREADS[state.color] ? THREADS[state.color].hex : THREADS.forest.hex, fam = FONTS[state.font] || FONTS.classic;
    g.clearRect(0, 0, SIZE, SIZE);
    g.fillStyle = thread; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; spacing(g, 0);
    var info = { reducedFrom: 0 };

    if (state.tab === 'logo') {
      var pct = (state.logoSize || 85) / 100;
      if (state.logo.sample) {
        var white = !state.logo.bgRemoved;
        drawSampleLogo(g, cx, cy, fitScale(sampleFootprint(white), R) * pct, white);
      } else if (state.logo.url && !state.logo.isPdf) {
        var img = image(state.logo.url);
        if (img && img.naturalWidth) {
          var fp = footprint(img, state.logo.url), s = fitScale(fp, R) * pct;
          var x = cx - fp.cx * s, y = cy - fp.cy * s, w = img.naturalWidth * s, h = img.naturalHeight * s;
          g.drawImage(img, x, y, w, h);
          var pal = logoPalette(img, state.logo.url, MATERIALS[state.material].colors);
          if (pal.palette) {
            var rx = Math.max(0, x), ry = Math.max(0, y);
            reduceColors(g, rx, ry, Math.min(SIZE, x + w) - rx, Math.min(SIZE, y + h) - ry, pal.palette);
            info.reducedFrom = pal.count;
          }
        }
      }
    } else if (state.tab === 'monogram') {
      var letters = state.mono || '';
      if (letters) {
        g.font = '100px ' + fam; spacing(g, 6);
        var m = g.measureText(letters), mw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, mh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        var mf = fit(mw / mh, R), k = mf.h / mh;
        g.font = Math.round(100 * k) + 'px ' + fam; spacing(g, Math.round(6 * k));
        g.fillText(letters, cx + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) * k / 2, cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) * k / 2);
      }
    } else {
      // Two lines: the second at 72% of the first, like a club patch. The block fits the safe area.
      var lines = [state.line1 || '', state.line2 || ''].filter(function (t) { return t.trim(); });
      if (lines.length) {
        var scale = [1, 0.72], gap = 26;
        var ms = lines.map(function (t, i) { g.font = (100 * scale[i]) + 'px ' + fam; return g.measureText(t); });
        var bw = Math.max.apply(null, ms.map(function (x) { return x.actualBoundingBoxLeft + x.actualBoundingBoxRight; }));
        var hs = ms.map(function (x) { return x.actualBoundingBoxAscent + x.actualBoundingBoxDescent; });
        var bh = hs.reduce(function (a, b) { return a + b; }, 0) + (lines.length - 1) * gap;
        var tf = fit(bw / bh, R), kk = tf.h / bh, y = cy - tf.h / 2;
        lines.forEach(function (t, i) {
          var size = 100 * scale[i] * kk;
          g.font = size + 'px ' + fam;
          g.fillText(t, cx, y + ms[i].actualBoundingBoxAscent * kk);
          y += hs[i] * kk + gap * kk;
          if (size * 0.7 / R.pxPerInch < MIN_CAP_INCHES) small = true;
        });
      }
    }
    info.small = small;
    return info;
  }

  // ---- The whole patch: color canvas and height canvas, in the chosen material ----
  function paint(state) {
    var R = region(state.shape), mat = state.material, info = paintArt(state, R);
    var c = colorCanvas.getContext('2d'), h = heightCanvas.getContext('2d');
    var patchHex = PATCH_COLORS[state.patch].hex;

    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.fillStyle = patchHex; c.fillRect(0, 0, SIZE, SIZE);
    h.globalCompositeOperation = 'source-over'; h.globalAlpha = 1; h.filter = 'none';
    h.fillStyle = '#404040'; h.fillRect(0, 0, SIZE, SIZE);

    if (mat === 'embroidered') {
      // Twill fabric under the stitches.
      c.globalAlpha = 0.06; c.fillStyle = pattern(c, twill, 40); c.fillRect(0, 0, SIZE, SIZE); c.globalAlpha = 1;
      h.globalAlpha = 0.35; h.fillStyle = pattern(h, twill, 40); h.fillRect(0, 0, SIZE, SIZE); h.globalAlpha = 1;
      // Thread: the artwork with satin-stitch light and shade laid over it.
      var lit = document.createElement('canvas'); lit.width = lit.height = SIZE; var l = lit.getContext('2d');
      l.drawImage(artCanvas, 0, 0);
      l.globalCompositeOperation = 'source-atop'; l.globalAlpha = 0.16; l.fillStyle = pattern(l, satin, 48); l.fillRect(0, 0, SIZE, SIZE);
      c.shadowColor = 'rgba(0,0,0,0.28)'; c.shadowBlur = 3; c.shadowOffsetY = 2;
      c.drawImage(lit, 0, 0);
      c.shadowColor = 'transparent';
      // Raised thread in the height map, rippled by the stitches.
      h.filter = 'blur(1.5px)'; h.globalCompositeOperation = 'lighter';
      h.drawImage(whiteOf(artCanvas, 0.55), 0, 0); h.filter = 'none';
      var rip = whiteOf(artCanvas, 1); var rg = rip.getContext('2d');
      rg.globalCompositeOperation = 'source-atop'; rg.globalAlpha = 0.5; rg.fillStyle = pattern(rg, satin, 48); rg.fillRect(0, 0, SIZE, SIZE);
      h.globalAlpha = 0.18; h.drawImage(rip, 0, 0); h.globalAlpha = 1;
    } else {
      // PVC: flat molded color, raised with soft rounded edges.
      c.drawImage(artCanvas, 0, 0);
      h.filter = 'blur(5px)'; h.globalCompositeOperation = 'lighter';
      h.drawImage(whiteOf(artCanvas, 0.7), 0, 0); h.filter = 'none';
    }
    h.globalCompositeOperation = 'source-over';
    return info;
  }
  // The artwork's shape in white (for the height map).
  var whiteCanvas = null;
  function whiteOf(src, alpha) {
    whiteCanvas = whiteCanvas || canvas();
    var w = whiteCanvas.getContext('2d');
    w.globalCompositeOperation = 'source-over'; w.globalAlpha = 1; w.clearRect(0, 0, SIZE, SIZE);
    w.drawImage(src, 0, 0);
    w.globalCompositeOperation = 'source-in'; w.fillStyle = 'rgba(255,255,255,' + alpha + ')'; w.fillRect(0, 0, SIZE, SIZE);
    return whiteCanvas;
  }

  // ---- What the 3D view needs, and a way for it to listen ----
  var H = window.HonorsHat = { SHAPES: SHAPES, latest: null, listen: null, version: 0 };
  function publish(state) {
    H.version++;
    H.latest = { version: H.version, shape: state.shape, mesh: SHAPES[state.shape].mesh, material: state.material,
      edge: PATCH_COLORS[state.edge].hex, color: colorCanvas, height: heightCanvas };
    if (H.listen) H.listen(H.latest);
    drawPatchCard(state);
  }

  // ---- When the 3D view can't load (UI-26): the still picture shows the hat but not the buyer's patch, so the patch
  // itself is shown flat beside it (the same artwork the 3D view would use, with its edge), updated as they design.
  // It's on the page only while the stage is in its failed state (hat.css).
  function outline(g, shape, x, y, w, h) {
    g.beginPath();
    if (shape === 'round') { g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); return; }
    var r = Math.min(w, h) * 0.09;
    if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
  }
  function drawPatchCard(state) {
    var c = document.querySelector('[data-hat-patch] canvas');
    if (!c) return;
    var n = c.width, s = SHAPES[state.shape], rim = n * 0.024;
    var pw = s.w * SIZE, ph = s.h * SIZE, k = (n - 2 * rim - n * 0.12) / Math.max(pw, ph);
    var w = pw * k, h = ph * k, ch = Math.ceil(h + 2 * rim + n * 0.12);
    if (c.height !== ch) c.height = ch;   // as tall as the patch, so the caption sits just under it
    var g = c.getContext('2d'), x = (n - w) / 2, y = (ch - h) / 2 - n * 0.02;
    g.clearRect(0, 0, n, ch);
    // The patch lies on the stage like the product renders do, with a soft contact shadow.
    g.save(); g.shadowColor = 'rgba(18, 52, 42, 0.28)'; g.shadowBlur = n * 0.045; g.shadowOffsetY = n * 0.02;
    outline(g, state.shape, x - rim, y - rim, w + 2 * rim, h + 2 * rim); g.fillStyle = PATCH_COLORS[state.edge].hex; g.fill(); g.restore();
    g.save(); outline(g, state.shape, x, y, w, h); g.clip();
    g.drawImage(colorCanvas, (SIZE - pw) / 2, (SIZE - ph) / 2, pw, ph, x, y, w, h);
    g.restore();
    outline(g, state.shape, x, y, w, h);
    g.lineWidth = rim * 2; g.strokeStyle = PATCH_COLORS[state.edge].hex; g.stroke();
  }
  // If the 3D code can't be fetched at all (e.g. the three.js server is unreachable), hat3d.js never runs and the stage
  // would say "Loading" for ever, so it takes the same fallback hat3d.js shows when WebGL fails.
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'SCRIPT' || !/hat3d\.js/.test(t.src || '')) return;
    var stage = document.querySelector('[data-hat-stage]'), msg = stage && stage.querySelector('[data-hat-msg]');
    if (!stage || stage.classList.contains('is-3d')) return;
    stage.classList.remove('is-loading'); stage.classList.add('is-failed');
    if (msg) msg.hidden = false;
  }, true);

  // ---- The panel's own controls (shape, material, patch and edge colors, logo size) and notes ----
  function describe(state) {
    var patch = SHAPES[state.shape].name + ' ' + MATERIALS[state.material].short + ' patch, ' +
      PATCH_COLORS[state.patch].name.toLowerCase() + ' with a ' + PATCH_COLORS[state.edge].name.toLowerCase() + ' edge';
    var what, thread = THREADS[state.color].name.toLowerCase(), font = FONT_NAMES[state.font];
    var inWord = state.material === 'embroidered' ? ' thread' : '';
    if (state.tab === 'logo') what = 'your logo (' + state.logo.name + ')';
    else if (state.tab === 'monogram') what = 'the monogram “' + (state.mono || '') + '” in ' + thread + inWord + ', ' + font + ' lettering';
    else what = '“' + [state.line1, state.line2].filter(Boolean).join(' / ') + '” in ' + thread + inWord + ', ' + font + ' lettering';
    return patch + ', with ' + what + '. Forest hat, white rope.';
  }
  function syncControls(state, info) {
    var mat = MATERIALS[state.material];
    $$('[data-shape]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.shape === state.shape)); });
    $$('[data-material]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.material === state.material)); });
    $$('[data-patch]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.patch === state.patch)); });
    $$('[data-edge]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.edge === state.edge)); });
    byId('patch-name').textContent = PATCH_COLORS[state.patch].name;
    byId('edge-name').textContent = PATCH_COLORS[state.edge].name;
    byId('color-kind').textContent = mat.color;
    byId('logo-color-note').textContent = 'Logos are ' + mat.verb + ' in their own colors, up to ' + mat.colors + '.';
    byId('logo-size').value = String(state.logoSize);
    byId('logo-size-out').textContent = state.logoSize + '%';
    var notice = byId('colors-notice');
    notice.hidden = !(state.tab === 'logo' && info.reducedFrom);
    if (!notice.hidden) {
      byId('colors-text').textContent = 'Your logo has ' + info.reducedFrom + ' colors. ' + (state.material === 'embroidered' ? 'An embroidered' : 'A PVC') +
        ' patch can use up to ' + mat.colors + ', so the preview shows the closest ' + mat.colors + '. You can still use it.';
    }
    var view = document.querySelector('[data-hat-canvas]');
    if (view) view.setAttribute('aria-label', 'Preview of your hat: ' + describe(state) + ' Drag or use the arrow keys to turn it.');
  }

  window.HonorsProduct = {
    product: 'hat',
    colors: THREADS,
    // Example prices until Chuck sets them (OQ-3); the same as cart.js.
    tiers: [{ min: 24, price: 22 }, { min: 48, price: 20 }, { min: 144, price: 18 }],
    min: 24,
    minPx: 500,   // about 250 pixels per inch across a 2-inch patch
    nextLabel: { 1: 'Next: patch', 2: 'Next: quantity' },
    unit: {
      count: function (n) { return n + (n === 1 ? ' hat' : ' hats'); },
      each: function (price) { return '$' + price + ' each'; },
      best: 'You’re getting the best price per hat.'
    },
    state: { tab: 'logo', qty: 48, color: 'forest', font: 'classic', code: 'HGS-10451',
      shape: 'round', material: 'embroidered', patch: 'offwhite', edge: 'forest', logoSize: 85 },
    draw: function (state) {
      var info = paint(state);
      publish(state);
      syncControls(state, info);
      return info.small;
    },
    design: function (d, state) {
      var shot = window.HonorsHat3D ? window.HonorsHat3D.snapshot() : null;
      Object.assign(d, { product: 'hat', shape: state.shape, material: state.material, patch: state.patch, edge: state.edge,
        logoSize: state.logoSize, summary: describe(state), preview: shot, noPreview: !shot });
    },
    init: function (a) {
      api = a;
      $$('[data-shape]').forEach(function (b) { b.addEventListener('click', function () { a.set({ shape: b.dataset.shape }); }); });
      $$('[data-material]').forEach(function (b) { b.addEventListener('click', function () { a.set({ material: b.dataset.material }); }); });
      $$('[data-patch]').forEach(function (b) { b.addEventListener('click', function () { a.set({ patch: b.dataset.patch }); }); });
      $$('[data-edge]').forEach(function (b) { b.addEventListener('click', function () { a.set({ edge: b.dataset.edge }); }); });
      byId('logo-size').addEventListener('input', function (e) { a.set({ logoSize: Number(e.target.value) }); });
      // Lettering uses web fonts: repaint once they've loaded.
      if (document.fonts) {
        Object.keys(FONTS).forEach(function (k) { document.fonts.load('100px ' + FONTS[k]); });
        document.fonts.load('700 12px Figtree');
        document.fonts.ready.then(function () { a.render(); });
      }
    }
  };
})();
