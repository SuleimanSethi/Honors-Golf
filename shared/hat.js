// The hat page (UI-11): describes the hat to the shared designer (designer.js) and paints its decoration.
// After the lock (D-130, D-137) the page opens on the hat the buyer clicked in Shop all, as it's made: its style is
// fixed here (no style picker; the breadcrumb leads back to the hats), its colorway can change, and nothing else about
// the hat can (no hat, rope or strap colors). The front is decorated with a patch (D-55: a logo, text or monogram on
// it, its shape and material, the patch and edge colors, and the thread color) or with direct embroidery (D-121): the
// same artwork stitched straight onto the front, in one thread color, inside an example area.
// The decoration is painted on a square canvas that the 3D view (hat3d.js) projects straight onto the patch, or onto
// the front of the crown, from the front, so nothing ever stretches. A second canvas holds the raised areas (a height
// map) for the stitched or molded look. The Origin is the only style with a 3D model; the others show their photo,
// front on, with the decoration drawn on it (D-138; hat-colorways.js has the styles, colorways and placements).
// Embroidered work (direct embroidery and the embroidered patch) goes through the shared embroidery designer and
// stitched preview (embroidery.js, UI-36, UI-37, D-139): the artwork is split into parts, each with a thread from the
// example chart and standard stitches for its shape (D-141: the buyer doesn't pick a stitch), and the stitches are
// painted from the stitch plan. Direct embroidery is painted by
// one replaceable function, HonorsHat.paintEmbroidery. PVC patches are painted as before.
// The decoration is picked first (D-140): the page opens with nothing picked, the hat as made with nothing on it, and
// Artwork and the details wait until the buyer picks a patch or direct embroidery. An address or a design that already
// says which opens with it picked (?deco=, a cart line being edited, a saved or recent design); the review states open
// with the patch unless they name one. Switching after that keeps the artwork.
// Colors, color limits, patch and area sizes and the smallest stitchable lettering are examples until the patch maker
// and embroiderer set them (OQ-7); prices are examples until Chuck sets them (OQ-3).
(function () {
  'use strict';

  var QUERY = (function () { try { return new URLSearchParams(window.location.search); } catch (e) { return new URLSearchParams(''); } })();
  // Review state ?state=no-3d (UI-26): the browser refuses WebGL, as on a machine without 3D support, so the page
  // takes its real fallback path (hat3d.js can't start and shows the still picture). Nothing else changes.
  var REVIEW_STATE = QUERY.get('state') || '';
  if (REVIEW_STATE === 'no-3d') {
    var getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type) { return /webgl/i.test(type) ? null : getContext.apply(this, arguments); };
  }

  // ---- The hat the buyer clicked (D-137): ?style= from Shop all (none or unknown = The Origin, as the header's Hats
  // link opens it), ?colorway=NNN optional. A saved design opened with ?design= opens on its own hat. ----
  var STYLES = window.HonorsHatStyles || {};
  function savedDesign(code) {
    try { return (JSON.parse(localStorage.getItem('honors-recent-designs') || '[]') || []).filter(function (d) { return d.code === code; })[0] || null; }
    catch (e) { return null; }
  }
  var fromDesign = QUERY.get('design') && savedDesign(QUERY.get('design'));
  var STYLE_ID = fromDesign && fromDesign.product === 'hat' && STYLES[fromDesign.style] ? fromDesign.style
    : STYLES[QUERY.get('style')] ? QUERY.get('style') : 'the-origin';
  var STYLE = STYLES[STYLE_ID];
  // Preview a model from the 3D session (session 12): ?glb=<url> on this computer only (127.0.0.1 or localhost) shows that
  // file as this style's 3D hat, e.g. hat.html?style=the-axis&glb=http://127.0.0.1:5300/work/axis.glb
  var GLB = QUERY.get('glb');
  if (GLB && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(GLB) && STYLE) STYLE = Object.assign({}, STYLE, { model: GLB });
  function colorway(num) { return STYLE.colorways.filter(function (c) { return c.num === num; })[0] || STYLE.colorways[0]; }
  var START_COLORWAY = colorway(QUERY.get('colorway')).num;

  // ---- Which decoration the page opens with (D-140): none, unless something already says ----
  // A cart line being edited: the cart's Edit design link names the hat's style, colorway and artwork tab (cart.js) but
  // not its decoration, so the line is looked up in the sample cart (cart.js keeps it in sessionStorage). A hat line
  // that doesn't name one is a patch (it was added before direct embroidery). Once the link carries ?deco= this can go.
  function editedCartLine() {
    var from = null; try { from = new URL(document.referrer); } catch (e) { return null; }
    if (from.origin !== window.location.origin || !/\/cart\.html$/.test(from.pathname) || !QUERY.get('style')) return null;
    var lines = []; try { lines = JSON.parse(sessionStorage.getItem('honors-sample-cart')) || []; } catch (e) { lines = []; }
    var kind = QUERY.get('tab') || 'text', cw = QUERY.get('colorway');
    var line = (Array.isArray(lines) ? lines : []).filter(function (l) {
      return l && l.product === 'hat' && (STYLES[l.style] ? l.style : 'the-origin') === STYLE_ID && (!cw || l.colorway === cw) && (l.kind || 'text') === kind;
    })[0];
    return line && line.deco === 'embroidery' ? 'embroidery' : 'patch';
  }
  // The review states show a designed hat, so they open with the patch unless the address names a decoration.
  var REVIEW_STATES = ['upload-failed', 'cart-unreachable', 'no-3d', 'stitch-failed'];
  function startDeco() {
    var asked = QUERY.get('deco');
    if (asked === 'patch' || asked === 'embroidery') return asked;
    if (REVIEW_STATES.indexOf(REVIEW_STATE) !== -1 || QUERY.get('buyer') === 'signed-in') return 'patch';
    return editedCartLine();   // a saved or recent design brings its own (designer.js restores it)
  }

  var SIZE = 2048;   // the decoration's canvases; 2048 keeps small lettering sharp when the buyer zooms in (was 1024, session 12)
  // Each patch's printed face as a share of the square canvas (height over width) and its real width in inches, from
  // the 3D session's v7 model (the-origin.glb, D-143): the whole patch with its rim is 2¼, 2¼ × 2¼ and 3 × 1¾ in, the
  // face a little inside that. The model is 1.40× real size, so these are its sizes ÷ 1.40 (its deliver/the-origin.md).
  var SHAPES = {
    round: { name: 'Round', mesh: 'Round', w: 1, h: 1.000, inches: 2.095 },
    square: { name: 'Square', mesh: 'Square', w: 1, h: 0.994, inches: 2.119 },
    rect: { name: 'Rectangle', mesh: 'Rectangular', w: 1, h: 0.567, inches: 2.869 }
  };
  // Direct embroidery's example area on the front (OQ-7): 4 by 2.25 inches, centred where the patch sits. The square
  // canvas spans its width; the artwork fits inside it, with a hair of margin, never stretched.
  var AREA = { name: 'Embroidery area', w: 1, h: 2.25 / 4, inches: 4, tall: 2.25, margin: 0.03 };
  var MATERIALS = {
    fabric: { name: 'Fabric', short: 'fabric', colors: 8, verb: 'printed', color: 'Lettering color' },   // Angle3D's "Fabric patch" (D-144; was "Embroidered")
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

  // ---- Where artwork may go: the patch minus a margin (the safe area, spec H-3), or the embroidery area ----
  function region(shape, deco) {
    var emb = deco === 'embroidery', s = emb ? AREA : SHAPES[shape], pw = s.w * SIZE, ph = s.h * SIZE, m = (emb ? AREA.margin : 0.12) * Math.min(pw, ph);
    return { shape: emb ? 'area' : shape, round: !emb && shape === 'round', pw: pw, ph: ph, x: (SIZE - pw) / 2, y: (SIZE - ph) / 2,
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

  // ---- Surface texture: twill for the patch fabric (the stitches come from embroidery.js) ----
  function pattern(g, draw, size) {
    var c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
    return g.createPattern(c, 'repeat');
  }
  function twill(p, s) { p.strokeStyle = 'rgba(0,0,0,0.5)'; p.lineWidth = 1.2; for (var i = -s; i <= s; i += 5) { p.beginPath(); p.moveTo(i, s); p.lineTo(i + s, 0); p.stroke(); } }

  // ---- The artwork, painted on its own transparent canvas; answers whether text is too small to stitch ----
  function paintArt(state, R) {
    var g = artCanvas.getContext('2d', { willReadFrequently: true }), cx = SIZE / 2, cy = SIZE / 2, small = false;
    var thread = THREADS[state.color] ? THREADS[state.color].hex : THREADS.forest.hex, fam = FONTS[state.font] || FONTS.classic;
    g.clearRect(0, 0, SIZE, SIZE);
    g.fillStyle = thread; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; spacing(g, 0);
    var info = { reducedFrom: 0 }, emb = state.deco === 'embroidery';

    if (state.tab === 'logo') {
      var pct = (state.logoSize || 85) / 100;
      if (state.logo.sample) {
        var white = !state.logo.bgRemoved, sk = fitScale(sampleFootprint(white), R) * pct;
        drawSampleLogo(g, cx, cy, sk, white);
        info.sample = { cx: cx, cy: cy, k: sk };
      } else if (state.logo.url && !state.logo.isPdf) {
        var img = image(state.logo.url);
        if (img && img.naturalWidth) {
          var fp = footprint(img, state.logo.url), s = fitScale(fp, R) * pct;
          var x = cx - fp.cx * s, y = cy - fp.cy * s, w = img.naturalWidth * s, h = img.naturalHeight * s;
          g.drawImage(img, x, y, w, h);
          // Embroidery (patch or direct) is stitched in up to 8 threads (EMB_COLORS), PVC molded in up to 6.
          var pal = logoPalette(img, state.logo.url, emb ? EMB_COLORS : MATERIALS[state.material].colors);
          if (pal && pal.palette) {
            var rx = Math.max(0, x), ry = Math.max(0, y);
            reduceColors(g, rx, ry, Math.min(SIZE, x + w) - rx, Math.min(SIZE, y + h) - ry, pal.palette);
            info.reducedFrom = pal.count;
          }
        }
      }
      // Embroidered work keeps the logo's own colors here: the embroidery designer splits it into parts, one thread
      // each. White or very light areas (a kept white background) aren't stitched; the fabric shows there.
    } else if (state.tab === 'monogram') {
      var letters = state.mono || '';
      if (letters) {
        g.font = '100px ' + fam; spacing(g, 6);
        var m = g.measureText(letters), mw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, mh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        var mf = fit(mw / mh, R), k = mf.h / mh;
        g.font = Math.round(100 * k) + 'px ' + fam; spacing(g, Math.round(6 * k));
        g.fillText(letters, cx + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) * k / 2, cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) * k / 2);
        info.capInches = mf.h / R.pxPerInch;   // monogram letters are capitals: their height is the block's
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
          info.capInches = Math.min(info.capInches || Infinity, size * 0.7 / R.pxPerInch);
        });
        info.twoLines = lines.length > 1;
      }
    }
    info.small = small;
    return info;
  }

  // ---- The sample logo's parts, for the embroidery designer: the same drawing as drawSampleLogo, one part per canvas
  // (the ring, the tree and the lettering), so each can take its own thread and its own standard stitch. ----
  var sampleCanvases = {};
  function sampleLayers(sp) {
    return [['ring', 'Ring'], ['tree', 'Tree'], ['lettering', 'Lettering']].map(function (p) {
      var c = sampleCanvases[p[0]] = sampleCanvases[p[0]] || canvas(), g = c.getContext('2d', { willReadFrequently: true });   // read back by the designer
      g.clearRect(0, 0, SIZE, SIZE);
      g.save(); g.translate(sp.cx, sp.cy); g.scale(sp.k, sp.k); g.strokeStyle = g.fillStyle = '#1F2E55';
      if (p[0] === 'ring') { g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 64, 0, Math.PI * 2); g.stroke(); }
      else if (p[0] === 'tree') {
        g.beginPath(); [[0, -50], [20, -18], [11, -18], [27, 6], [-27, 6], [-11, -18], [-20, -18]].forEach(function (q, i) { g[i ? 'lineTo' : 'moveTo'](q[0], q[1]); });
        g.closePath(); g.fill(); g.fillRect(-5, 6, 10, 11);
      } else {
        g.textAlign = 'center'; g.font = '700 12px Figtree, sans-serif'; spacing(g, 2); g.fillText('PINECREST', 0, 36);
        g.font = '400 8px Figtree, sans-serif'; g.fillText('GOLF CLUB', 0, 50);
      }
      g.restore();
      return { id: p[0], name: p[1], canvas: c };
    });
  }

  // ---- Embroidered work (UI-36, UI-37): the artwork goes through the shared embroidery designer (embroidery.js),
  // which splits it into parts, applies the buyer's threads, plans the standard stitches and checks the rules. ----
  var EMB = window.HonorsEmbroidery, EMB_COLORS = 8, stitched = null;
  function designerOn(state) { return state.deco === 'embroidery'; }   // only direct embroidery is stitched (D-144)
  // What the stitches lie on: the crown's color, or the patch's.
  function groundHex(state) { return state.deco === 'embroidery' ? crownHex(state) : PATCH_COLORS[state.patch].hex; }
  function stitchArt(state, R, info) {
    var emb = state.deco === 'embroidery', s = emb ? AREA : SHAPES[state.shape];
    return EMB.stitch({
      art: artCanvas, layers: state.tab === 'logo' && info.sample ? sampleLayers(info.sample) : null, kind: state.tab,
      area: { x: R.x, y: R.y, w: R.pw, h: R.ph }, inches: emb ? { w: AREA.inches, h: AREA.tall } : { w: s.inches, h: s.inches * s.h },
      pxPerInch: R.pxPerInch, base: groundHex(state), ground: emb ? 'hat' : 'patch', choices: state.emb || {}, limit: EMB_COLORS,
      letters: state.tab === 'logo' ? null : { font: state.font, capInches: info.capInches || 0, twoLines: !!info.twoLines },
      logoSize: state.tab === 'logo' ? state.logoSize : null, fail: REVIEW_STATE === 'stitch-failed'
    });
  }

  // ---- Direct embroidery (H-10): the one place its artwork is painted, replaceable as HonorsHat.paintEmbroidery.
  // `job` carries everything it needs: job.color and job.height (the two square canvases the 3D view and the photo
  // read, SIZE px; this paints them both), job.art (the artwork alone, fitted to the area in its own colors, on a
  // transparent canvas the same size), job.stitched (the embroidery designer's result: parts, threads, stitch plan),
  // job.thread (the first part's thread),
  // job.area (the area in canvas pixels and inches), the artwork the buyer chose (job.artwork), and the hat
  // (job.style, job.colorway). Return nothing. The default paints the stitches from the stitch plan (UI-37).
  function paintStitched(job) {
    var c = job.color.getContext('2d'), h = job.height.getContext('2d'), n = job.size;
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, n, n);
    h.globalCompositeOperation = 'source-over'; h.globalAlpha = 1; h.filter = 'none';
    h.fillStyle = '#404040'; h.fillRect(0, 0, n, n);
    EMB.paint(job.stitched, job.color, job.height);
  }
  function embroideryJob(state, R) {
    var cw = colorway(state.colorway), first = stitched && stitched.parts[0];
    return { size: SIZE, color: colorCanvas, height: heightCanvas, art: artCanvas, stitched: stitched,
      // The first part's thread, for a painter that stitches in one thread (each part has its own in job.stitched).
      thread: first ? { key: first.thread.code, name: first.thread.name, hex: first.thread.hex } : null,
      area: { x: R.x, y: R.y, w: R.pw, h: R.ph, inches: { w: AREA.inches, h: AREA.tall }, pxPerInch: R.pxPerInch },
      artwork: { kind: state.tab, line1: state.line1, line2: state.line2, mono: state.mono, font: state.font, logoSize: state.logoSize,
        logo: { sample: state.logo.sample, name: state.logo.name, url: state.logo.isPdf ? null : state.logo.url, bgRemoved: state.logo.bgRemoved } },
      style: { id: STYLE_ID, name: STYLE.name, model: !!STYLE.model }, colorway: { num: cw.num, name: cw.name } };
  }

  // ---- The whole decoration: color canvas and height canvas, for the patch in its material or the embroidery ----
  function paint(state) {
    // Nothing picked yet (D-140): the hat as made, with nothing painted for it.
    if (!state.deco) {
      stitched = H.embroidery = null;
      colorCanvas.getContext('2d').clearRect(0, 0, SIZE, SIZE);
      var bare = heightCanvas.getContext('2d'); bare.globalCompositeOperation = 'source-over'; bare.globalAlpha = 1; bare.filter = 'none';
      bare.fillStyle = '#404040'; bare.fillRect(0, 0, SIZE, SIZE);
      return { small: false, reducedFrom: 0 };
    }
    var R = region(state.shape, state.deco), mat = state.material, info = paintArt(state, R);
    stitched = designerOn(state) ? stitchArt(state, R, info) : null;
    H.embroidery = stitched;
    if (state.deco === 'embroidery') { H.paintEmbroidery(embroideryJob(state, R)); return info; }
    var c = colorCanvas.getContext('2d'), h = heightCanvas.getContext('2d');
    var patchHex = PATCH_COLORS[state.patch].hex;

    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.fillStyle = patchHex; c.fillRect(0, 0, SIZE, SIZE);
    h.globalCompositeOperation = 'source-over'; h.globalAlpha = 1; h.filter = 'none';
    h.fillStyle = '#404040'; h.fillRect(0, 0, SIZE, SIZE);

    if (mat === 'fabric') {
      // Fabric patch (D-144): the artwork printed flat on twill, the weave showing through the print.
      c.drawImage(artCanvas, 0, 0);
      c.globalAlpha = 0.08; c.fillStyle = pattern(c, twill, 40); c.fillRect(0, 0, SIZE, SIZE); c.globalAlpha = 1;
      h.globalAlpha = 0.35; h.fillStyle = pattern(h, twill, 40); h.fillRect(0, 0, SIZE, SIZE); h.globalAlpha = 1;
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
  var H = window.HonorsHat = { SHAPES: SHAPES, AREA: AREA, latest: null, listen: null, version: 0,
    style: { id: STYLE_ID, name: STYLE.name, model: typeof STYLE.model === 'string' ? STYLE.model : !!STYLE.model },
    paintEmbroidery: paintStitched, embroidery: null,
    repaint: function () { if (api) api.render(); } };
  function publish(state) {
    var cw = colorway(state.colorway);
    H.version++;
    // Nothing picked: a decoration that isn't embroidery and a mesh that names no badge, so the 3D hat shows neither.
    H.latest = { version: H.version, deco: state.deco, shape: state.shape, mesh: state.deco === 'patch' ? SHAPES[state.shape].mesh : null, material: state.material,
      edge: PATCH_COLORS[state.edge].hex, color: colorCanvas, height: heightCanvas,
      colorway: { num: cw.num, name: cw.name, paint: cw.paint || null } };
    if (H.listen) H.listen(H.latest);
    drawPatchCard(state);
    drawOnPhoto(state);
  }

  // ---- When the 3D view can't load (UI-26): the still picture shows the hat but not the buyer's decoration, so it's
  // shown flat beside it (the same artwork the 3D view would use: the patch with its edge, or the embroidery on a
  // swatch of the hat's own color), updated as they design. It's on the page only while the stage is in its failed
  // state (hat.css).
  function outline(g, shape, x, y, w, h) {
    g.beginPath();
    if (shape === 'round') { g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); return; }
    var r = Math.min(w, h) * 0.09;
    if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
  }
  function crownHex(state) { var m = colorway(state.colorway).swatch.match(/#[0-9A-Fa-f]{6}/); return m ? m[0] : '#F4F4F6'; }
  function drawPatchCard(state) {
    var c = document.querySelector('[data-hat-patch] canvas');
    if (!c) return;
    c.parentNode.hidden = !state.deco;   // the fallback figure waits for a pick (D-140)
    if (!state.deco) return;
    var emb = state.deco === 'embroidery', s = emb ? AREA : SHAPES[state.shape], rim = emb ? 0 : c.width * 0.024, n = c.width;
    var pw = s.w * SIZE, ph = s.h * SIZE, k = (n - 2 * rim - n * 0.12) / Math.max(pw, ph);
    var w = pw * k, h = ph * k, ch = Math.ceil(h + 2 * rim + n * 0.12);
    if (c.height !== ch) c.height = ch;   // as tall as the patch, so the caption sits just under it
    var g = c.getContext('2d'), x = (n - w) / 2, y = (ch - h) / 2 - n * 0.02;
    g.clearRect(0, 0, n, ch);
    var ground = emb ? crownHex(state) : PATCH_COLORS[state.edge].hex, shape = emb ? 'rect' : state.shape;
    // The patch (or a swatch of the hat) lies on the stage like the product renders do, with a soft contact shadow.
    g.save(); g.shadowColor = 'rgba(18, 52, 42, 0.28)'; g.shadowBlur = n * 0.045; g.shadowOffsetY = n * 0.02;
    outline(g, shape, x - rim, y - rim, w + 2 * rim, h + 2 * rim); g.fillStyle = ground; g.fill(); g.restore();
    g.save(); outline(g, shape, x, y, w, h); g.clip();
    g.drawImage(colorCanvas, (SIZE - pw) / 2, (SIZE - ph) / 2, pw, ph, x, y, w, h);
    g.restore();
    if (emb) return;
    outline(g, state.shape, x, y, w, h);
    g.lineWidth = rim * 2; g.strokeStyle = PATCH_COLORS[state.edge].hex; g.stroke();
  }

  // ---- A style without a 3D model (D-138): its photo, front on, with the decoration drawn on the front of the crown
  // at that style's place, at the same size in inches as on the 3D hat. It wraps a little round the crown (a slight
  // cylinder, so it narrows towards its sides), with the light falling off at the sides and a soft shadow. ----
  function drawOnPhoto(state) {
    var cv = document.querySelector('[data-hat-decor]');
    if (!cv || STYLE.model) return;
    var g = cv.getContext('2d'), k = cv.width / 800, place = STYLE.place, emb = state.deco === 'embroidery';
    g.clearRect(0, 0, cv.width, cv.height);
    if (!state.deco) return;   // nothing picked: the photo as it is (D-140)
    var s = emb ? AREA : SHAPES[state.shape], pw = s.w * SIZE, ph = s.h * SIZE;
    var inches = s.inches, w = inches * place.ppi * k, h = w * ph / pw, rim = emb ? 0 : w * 0.024;
    // The flat decoration first: the patch with its edge, or the embroidery alone.
    var flat = document.createElement('canvas'); flat.width = Math.ceil(w + 2 * rim + 2); flat.height = Math.ceil(h + 2 * rim + 2);
    var f = flat.getContext('2d'), fx = rim + 1, fy = rim + 1;
    if (designerOn(state)) f.imageSmoothingQuality = 'high';   // stitches are fine detail: scale them down smoothly
    if (!emb) {
      outline(f, state.shape, fx - rim, fy - rim, w + 2 * rim, h + 2 * rim); f.fillStyle = PATCH_COLORS[state.edge].hex; f.fill();
      f.save(); outline(f, state.shape, fx, fy, w, h); f.clip();
    }
    f.drawImage(colorCanvas, (SIZE - pw) / 2, (SIZE - ph) / 2, pw, ph, fx, fy, w, h);
    if (!emb) {
      f.restore(); outline(f, state.shape, fx, fy, w, h); f.lineWidth = rim * 2; f.strokeStyle = PATCH_COLORS[state.edge].hex; f.stroke();
    }
    // Wrapped round the crown, one column at a time.
    var R = place.curve * place.ppi * k, fw = flat.width, out = document.createElement('canvas');
    out.width = fw; out.height = flat.height;
    var o = out.getContext('2d');
    for (var i = 0; i < fw; i++) {
      var a0 = (i - fw / 2) / R, a1 = (i + 1 - fw / 2) / R, x0 = R * Math.sin(a0) + fw / 2, x1 = R * Math.sin(a1) + fw / 2;
      o.drawImage(flat, i, 0, 1, flat.height, x0, 0, Math.max(0.5, x1 - x0) + 0.35, flat.height);
    }
    var shade = o.createLinearGradient(0, 0, fw, 0);
    shade.addColorStop(0, 'rgba(0,0,0,0.16)'); shade.addColorStop(0.22, 'rgba(0,0,0,0)'); shade.addColorStop(0.78, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,0.16)');
    o.globalCompositeOperation = 'source-atop'; o.fillStyle = shade; o.fillRect(0, 0, fw, flat.height);
    g.save();
    g.shadowColor = emb ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.3)'; g.shadowBlur = (emb ? 2 : 6) * k; g.shadowOffsetY = (emb ? 1 : 3) * k;
    g.drawImage(out, place.x * k - fw / 2, place.y * k - flat.height / 2);
    g.restore();
  }
  // The cart's picture of a photo style: the photo with the decoration on it.
  function photoSnapshot(size) {
    var still = document.querySelector('[data-hat-still]'), cv = document.querySelector('[data-hat-decor]');
    if (!still || !still.complete || !still.naturalWidth || !cv) return null;
    var c = document.createElement('canvas'); c.width = c.height = size;
    var g = c.getContext('2d'); g.drawImage(still, 0, 0, size, size); g.drawImage(cv, 0, 0, size, size);
    try { return c.toDataURL('image/webp', 0.9); } catch (e) { return null; }
  }
  // If the 3D code can't be fetched at all (e.g. the three.js server is unreachable), hat3d.js never runs and the stage
  // would say "Loading" for ever, so it takes the same fallback hat3d.js shows when WebGL fails.
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'SCRIPT' || !/hat3d\.js/.test(t.src || '')) return;
    var stage = document.querySelector('[data-hat-stage]'), msg = stage && stage.querySelector('[data-hat-msg]');
    if (!stage || stage.classList.contains('is-3d') || stage.classList.contains('is-photo')) return;
    stage.classList.remove('is-loading'); stage.classList.add('is-failed');
    if (msg) msg.hidden = false;
  }, true);

  // ---- The page names the hat it was opened for (D-137) ----
  function setUpPage() {
    var n = STYLE.colorways.length, kind = STYLE.kind.charAt(0).toLowerCase() + STYLE.kind.slice(1);
    $$('[data-style-name]').forEach(function (e) { e.textContent = STYLE.name; });
    var lede = document.querySelector('[data-style-lede]');
    if (lede) lede.textContent = (/^[aeiou]/i.test(kind) ? 'An ' : 'A ') + kind + ' in ' + n + (n === 1 ? ' colorway' : ' colorways') + '.';   // D-142: no second sentence
    document.title = STYLE.name + ' | Honors (A. Clean)';
    var list = document.querySelector('[data-colorways]');
    if (list) {
      list.innerHTML = '';
      STYLE.colorways.forEach(function (c) {
        var b = document.createElement('button'), sw = document.createElement('span');
        b.type = 'button'; b.className = 'swatch'; b.dataset.colorway = c.num; b.setAttribute('aria-label', c.num + ' ' + c.name); b.setAttribute('aria-pressed', 'false');
        sw.setAttribute('style', 'background:' + c.swatch);
        b.appendChild(sw); list.appendChild(b);
      });
    }
    var stage = document.querySelector('[data-hat-stage]');
    if (stage && !STYLE.model) { stage.classList.remove('is-loading'); stage.classList.add('is-photo'); photoZoom(stage); }
    if (stage && STYLE.model && STYLE.photos && STYLE.photos.length) setUpViews(stage);
  }
  // Real photos beside the 3D hat (D-148): thumbnails beside the stage, 3D first, then the B2B store's photos of
  // the colorway picked, plain, as the hat is made. A photo covers the stage until the buyer clicks 3D or changes the
  // design (init); a new colorway swaps the photos. ?photo=front or ?photo=angle opens on a photo, for review.
  var views = null;
  function setUpViews(stage) {
    var row = document.querySelector('[data-hat-views]'), photo = stage.querySelector('[data-hat-photo]');
    if (!row || !photo) return;
    var list = [{ view: '3d', label: '3D' }].concat(STYLE.photos), current = '3d', cw = null;
    var pending = list.some(function (v) { return v.view !== '3d' && v.view === QUERY.get('photo'); }) ? QUERY.get('photo') : null;
    function src(c, view) { return 'img/hat-' + STYLE_ID.replace(/^the-/, '') + '-' + c.num + '-' + view + '.webp'; }
    row.innerHTML = '';
    var buttons = list.map(function (v) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'hat-view'; b.dataset.photoView = v.view; b.setAttribute('aria-pressed', String(v.view === '3d'));
      if (v.view === '3d') {
        b.setAttribute('aria-label', '3D view, with your design');
        b.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg><span>3D</span>';
      } else {
        b.setAttribute('aria-label', 'Photo of the hat, ' + v.label.toLowerCase());
        var img = document.createElement('img'); img.alt = ''; b.appendChild(img);
      }
      b.addEventListener('click', function () { show(v.view); });
      row.appendChild(b); return b;
    });
    row.hidden = false; row.parentNode.classList.add('has-views');
    function show(view) {
      current = view;
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.photoView === view)); });
      stage.classList.toggle('is-real', view !== '3d');
      if (view === '3d' || !cw) return;
      var v = list.filter(function (x) { return x.view === view; })[0];
      photo.src = src(cw, view);
      photo.alt = 'Photo of ' + STYLE.name + ' in ' + cw.num + ' ' + cw.name + ', ' + v.label.toLowerCase() + ', before decoration';
    }
    views = {
      show: show,
      colorway: function (c) {
        if (cw && cw.num === c.num) return;
        cw = c;
        buttons.forEach(function (b, i) { var img = b.querySelector('img'); if (img) img.src = src(c, list[i].view); });
        if (pending) { var p = pending; pending = null; show(p); } else if (current !== '3d') show(current);
      }
    };
  }
  // Zoom on the photo styles (session 12): scroll or pinch to zoom toward the pointer, drag to move around when zoomed in,
  // double-click to reset. The photo and its decoration move together, so the logo stays on the hat.
  function photoZoom(stage) {
    var els = [stage.querySelector('[data-hat-still]'), stage.querySelector('[data-hat-decor]')].filter(Boolean);
    var z = 1, tx = 0, ty = 0, MAX = 3, drag = null, pts = {}, pinch = null;
    var hint = stage.querySelector('.stage-hint .hint-ready'); if (hint) hint.textContent = 'Scroll to zoom.';
    function apply() {
      var r = stage.getBoundingClientRect(), mx = (z - 1) * r.width / 2, my = (z - 1) * r.height / 2;
      tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty));
      els.forEach(function (e) { e.style.transform = z === 1 ? '' : 'translate(' + tx + 'px,' + ty + 'px) scale(' + z + ')'; });
      stage.classList.toggle('is-zoomed', z > 1);
    }
    function zoomAt(nz, cx, cy) {
      var r = stage.getBoundingClientRect(), px = cx - r.left - r.width / 2, py = cy - r.top - r.height / 2;
      nz = Math.max(1, Math.min(MAX, nz)); tx = px - (px - tx) * nz / z; ty = py - (py - ty) * nz / z; z = nz; apply();
    }
    stage.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY); }, { passive: false });
    stage.addEventListener('dblclick', function () { z = 1; tx = ty = 0; apply(); });
    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, a')) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY }; var ids = Object.keys(pts);
      if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: z }; drag = null; }
      else if (z > 1) drag = { x: e.clientX - tx, y: e.clientY - ty };
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY }; var ids = Object.keys(pts);
      if (pinch && ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; zoomAt(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); }
      else if (drag) { tx = e.clientX - drag.x; ty = e.clientY - drag.y; apply(); }
    });
    function up(e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; drag = null; }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  }

  // ---- The panel's own controls (colorway, decoration, shape, material, patch and edge colors, logo size) and notes ----
  function describe(state) {
    var cw = colorway(state.colorway), hat = STYLE.name + ', colorway ' + cw.num + ' ' + cw.name + '. ';
    var what, thread = THREADS[state.color].name.toLowerCase(), font = FONT_NAMES[state.font];
    // Embroidered work names each part's stitch and thread, and the stitch file (UI-36).
    var sewn = stitched && designerOn(state) ? ' Stitched as: ' + EMB.partsText(stitched) + '. ' + EMB.line(stitched) + '.' : '';
    if (!state.deco) return hat.trim();   // nothing picked: the hat as made
    if (state.deco === 'embroidery') {
      if (state.tab === 'logo') what = 'your logo (' + state.logo.name + ')';
      else if (state.tab === 'monogram') what = 'the monogram “' + (state.mono || '') + '”, ' + font + ' lettering';
      else what = '“' + [state.line1, state.line2].filter(Boolean).join(' / ') + '”, ' + font + ' lettering';
      return hat + 'Direct embroidery on the front: ' + what + ', in a 4 × 2¼ in area.' + sewn;
    }
    var patch = SHAPES[state.shape].name + ' ' + MATERIALS[state.material].short + ' patch, ' +
      PATCH_COLORS[state.patch].name.toLowerCase() + ' with a ' + PATCH_COLORS[state.edge].name.toLowerCase() + ' edge';
    if (state.tab === 'logo') what = 'your logo (' + state.logo.name + ')';
    else if (sewn) what = (state.tab === 'monogram' ? 'the monogram “' + (state.mono || '') + '”' : '“' + [state.line1, state.line2].filter(Boolean).join(' / ') + '”') + ', ' + font + ' lettering';
    else if (state.tab === 'monogram') what = 'the monogram “' + (state.mono || '') + '” in ' + thread + ', ' + font + ' lettering';
    else what = '“' + [state.line1, state.line2].filter(Boolean).join(' / ') + '” in ' + thread + ', ' + font + ' lettering';
    return hat + patch + ', with ' + what + '.' + sewn;
  }
  var shownColorway = null, chipHtml = null, ui = null;
  function syncControls(state, info) {
    var mat = MATERIALS[state.material], emb = state.deco === 'embroidery', cw = colorway(state.colorway);
    $$('[data-colorway]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.colorway === cw.num)); });
    byId('colorway-name').textContent = cw.num + ' ' + cw.name;
    $$('[data-deco]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.deco === state.deco && (!b.dataset.material || b.dataset.material === state.material))); });
    // Decoration first (D-140): Artwork and the details show once it's picked; Quantity and the bar always show.
    byId('block-1').hidden = byId('block-2').hidden = !state.deco;
    if (state.deco) byId('deco-error').hidden = true;
    // Headings keep their second lines (owner, session 12: D-142 cut them, then "I didn't want it to go away")
    byId('h-2').firstChild.nodeValue = emb ? 'Your embroidery. ' : 'Your patch. ';
    byId('details-q').textContent = emb ? 'A thread for each part.' : 'Shape and colors.';
    byId('artwork-q').textContent = emb ? 'What goes on the front?' : 'What goes on the patch?';
    $$('[data-deco-pane]').forEach(function (p) { p.hidden = p.dataset.decoPane !== state.deco; });
    // The embroidery designer (UI-36) shows for embroidered work: direct embroidery and the embroidered patch.
    var sewing = designerOn(state), hook = document.querySelector('[data-embroidery-designer]');
    if (hook) hook.hidden = !sewing;
    if (ui && stitched) ui.update(stitched);
    $$('[data-shape]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.shape === state.shape)); });
    $$('[data-patch]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.patch === state.patch)); });
    $$('[data-edge]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.edge === state.edge)); });
    byId('patch-name').textContent = PATCH_COLORS[state.patch].name;
    byId('edge-name').textContent = PATCH_COLORS[state.edge].name;
    // The words follow the decoration: a patch's artwork, or what's stitched on the front.
    $$('[data-deco-noun]').forEach(function (e) { e.textContent = emb ? 'embroidery' : 'patch'; });
    $$('[data-deco-small]').forEach(function (e) { e.textContent = emb ? 'the front' : 'a patch'; });
    byId('size-hint').textContent = emb ? 'At 100% your logo fills the embroidery area, never past it.' : 'At 100% your logo fills the patch up to its safe edge, never past it.';
    byId('color-kind').textContent = emb ? 'Thread color' : mat.color;
    // A PVC logo keeps its own colors; embroidered work takes each part's thread in the embroidery designer instead.
    byId('thread-field').hidden = sewing || state.tab === 'logo';
    // Embroidered work says nothing here: its threads are picked part by part just below (D-142). PVC keeps its limit.
    byId('logo-color-note').textContent = sewing ? '' : 'Logos are ' + mat.verb + ' in their own colors, up to ' + mat.colors + '.';
    // Embroidery lettering: each lettering's smallest stitchable capitals, and how tall these are.
    $$('[data-font-min]').forEach(function (e) { e.hidden = !sewing; });
    var letterHint = byId('emb-letter-hint');
    if (letterHint) { letterHint.hidden = !sewing || !info.capInches; letterHint.textContent = info.capInches ? 'Your capitals are ' + info.capInches.toFixed(2) + ' in tall. Each lettering shows the smallest it stitches cleanly (examples).' : ''; }
    // The stage's note: embroidered work is drawn from its stitch file (UI-37); PVC is an approximation, as before.
    var chip = document.querySelector('.stage-chip > span');
    if (chip) {
      if (chipHtml === null) chipHtml = chip.innerHTML;
      // The stage names its preview only when it's an approximation (D-142): PVC (D-55), or embroidery whose stitch
      // file couldn't be made. Stitches drawn from the file need no label.
      var drawn = sewing && stitched && stitched.ok;
      if (sewing && !drawn) chip.textContent = 'Approximate stitched look';
      else if (!sewing && chip.innerHTML !== chipHtml) {
        // The saved copy may come from a page opened on embroidery: name the decoration again after restoring it.
        chip.innerHTML = chipHtml;
        $$('.stage-chip [data-deco-noun]').forEach(function (e) { e.textContent = emb ? 'embroidery' : 'patch'; });
      }
      chip.parentNode.hidden = !state.deco || drawn;   // nothing on the hat yet, or nothing to qualify
    }
    window.HonorsProduct.noun = emb ? 'hat' : 'patch';
    byId('logo-size').value = String(state.logoSize);
    byId('logo-size-out').textContent = state.logoSize + '%';
    var notice = byId('colors-notice');
    notice.hidden = !(state.tab === 'logo' && info.reducedFrom);
    if (!notice.hidden) {
      byId('colors-text').textContent = emb ? 'Your logo has ' + info.reducedFrom + ' colors. Embroidery can use up to ' + EMB_COLORS + ' threads, so the preview shows the closest ' + EMB_COLORS + '. You can still use it.'
        : 'Your logo has ' + info.reducedFrom + ' colors. ' + (state.material === 'fabric' ? 'A fabric' : 'A PVC') +
        ' patch can use up to ' + mat.colors + ', so the preview shows the closest ' + mat.colors + '. You can still use it.';
    }
    // The colorway: the still picture (The Origin) or the photo follows it, and the address keeps it.
    if (shownColorway !== cw.num) {
      shownColorway = cw.num;
      var still = document.querySelector('[data-hat-still]');
      if (still) still.src = STYLE.model ? cw.still || cw.photo : cw.photo;
      try {
        var q = new URLSearchParams(window.location.search); q.set('style', STYLE_ID); q.set('colorway', cw.num);
        history.replaceState(history.state, '', window.location.pathname + '?' + q.toString() + window.location.hash);
      } catch (e) { /* the address just doesn't follow */ }
    }
    if (views) views.colorway(cw);
    var label = 'Preview of your hat: ' + describe(state);
    var view = document.querySelector('[data-hat-canvas]');
    if (view) view.setAttribute('aria-label', label + ' Drag or use the arrow keys to turn it.');
    var pic = document.querySelector('[data-hat-still]');
    if (pic && !STYLE.model) pic.alt = label;
  }

  window.HonorsProduct = {
    product: 'hat',
    colors: THREADS,
    // Example prices until Chuck sets them (OQ-3); the same as cart.js.
    tiers: [{ min: 24, price: 22 }, { min: 48, price: 20 }, { min: 144, price: 18 }],
    min: 24,
    minPx: 500,   // about 250 pixels per inch across a 2-inch patch
    nextLabel: { 1: 'Next: decoration', 2: 'Next: quantity' },
    noun: 'patch',
    // Recent designs (UI-27) name the hat and keep which hat and decoration they were, and the embroidery's threads
    // (a stitch pick saved before D-141 is ignored by embroidery.js).
    name: STYLE.name, page: 'hat.html', keep: ['style', 'colorway', 'deco', 'emb'],
    unit: {
      count: function (n) { return n + (n === 1 ? ' hat' : ' hats'); },
      each: function (price) { return '$' + price + ' each'; },
      best: 'You’re getting the best price per hat.'
    },
    state: { tab: 'logo', qty: 48, color: 'forest', font: 'classic', code: 'HGS-10451',
      shape: 'round', material: 'fabric', patch: 'offwhite', edge: 'forest', logoSize: 85,
      style: STYLE_ID, colorway: START_COLORWAY, deco: startDeco(),
      // The embroidery designer's choices (UI-36): each part's thread where the buyer picked one, and the
      // flags they chose to keep. Parts left alone follow the artwork and the hat.
      emb: {} },
    draw: function (state) {
      // The style is the page's own (D-137); a colorway this style doesn't have falls back to its first.
      state.style = STYLE_ID; state.colorway = colorway(state.colorway).num;
      // Nothing picked is null (D-140). A saved design always has one: one that doesn't name it predates direct
      // embroidery, so it's a patch.
      if (state.deco !== 'embroidery' && state.deco !== 'patch') state.deco = state.saved ? 'patch' : null;
      // The patch materials are Fabric and Rubber (PVC), as on Angle3D (D-144); a design saved as "embroidered" is fabric.
      if (!MATERIALS[state.material]) state.material = 'fabric';
      var info = paint(state);
      publish(state);
      syncControls(state, info);
      return info.small;
    },
    design: function (d, state) {
      var shot = STYLE.model ? (window.HonorsHat3D ? window.HonorsHat3D.snapshot() : null) : photoSnapshot(480);
      Object.assign(d, { product: 'hat', style: STYLE_ID, colorway: state.colorway, deco: state.deco, shape: state.shape, material: state.material,
        patch: state.patch, edge: state.edge, logoSize: state.logoSize, summary: describe(state), preview: shot, noPreview: !shot });
      // Embroidered work carries its stitch file (UI-36): saved with the design for the production sheet, never sent
      // to the vendor automatically (spec B-3).
      if (designerOn(state) && stitched) { d.stitch = EMB.file(stitched, state.code); d.emb = state.emb; }
    },
    init: function (a) {
      api = a;
      setUpPage();
      $$('[data-colorway]').forEach(function (b) { b.addEventListener('click', function () { a.set({ colorway: b.dataset.colorway }); }); });
      // A change to the design brings the 3D back from a photo, so the buyer sees it (the photos are the plain hat).
      ['block-deco', 'block-1', 'block-2'].forEach(function (id) {
        var block = byId(id); if (!block) return;
        ['click', 'input'].forEach(function (type) {
          block.addEventListener(type, function (e) { if (views && e.target.closest('button, input, select, textarea')) views.show('3d'); });
        });
      });
      // One choice of three (D-144): Fabric patch, Rubber (PVC) patch, Embroidered on the hat.
      $$('[data-deco]').forEach(function (b) { b.addEventListener('click', function () { a.set(b.dataset.material ? { deco: b.dataset.deco, material: b.dataset.material } : { deco: b.dataset.deco }); }); });
      // Before a pick (D-140), Add to cart and Save design stay on the bar but add or save nothing: they point to the
      // Decoration step, as the logo-rights box does (designer.js rightsOk). This listener catches the click on its way
      // down, before designer.js's own on the buttons; the phone's Next waits for the pick too.
      document.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('#add-to-cart, #save-design, #step-next') : null;
        if (!b || a.state.deco) return;
        e.preventDefault(); e.stopImmediatePropagation();
        byId('deco-error').hidden = false;
        if (a.state.step !== 1) { a.state.step = 1; a.render(); }
        var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        byId('block-deco').scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' });
        document.querySelector('[data-deco]').focus({ preventScroll: true });
      }, true);
      $$('[data-shape]').forEach(function (b) { b.addEventListener('click', function () { a.set({ shape: b.dataset.shape }); }); });
      $$('[data-patch]').forEach(function (b) { b.addEventListener('click', function () { a.set({ patch: b.dataset.patch }); }); });
      $$('[data-edge]').forEach(function (b) { b.addEventListener('click', function () { a.set({ edge: b.dataset.edge }); }); });
      byId('logo-size').addEventListener('input', function (e) { a.set({ logoSize: Number(e.target.value) }); });
      // The embroidery designer (UI-36): a part's thread changes the design; a fix it offers for the artwork
      // itself (the logo's size, the lettering, one line) is applied here.
      var hook = document.querySelector('[data-embroidery-designer]');
      if (hook) ui = EMB.designer(hook, {
        plain: true,   // D-142: no review label, no parts hint, no stitch-file line on the hat page
        onChange: function (choices) { a.set({ emb: choices }); },
        onFix: function (fix) {
          if (fix.line2 === '') byId('line2').value = '';
          a.set(fix);
        }
      });
      // Each lettering's smallest stitchable capitals, shown while the work is embroidered.
      $$('[data-font]').forEach(function (b) {
        var f = EMB.FONTS[b.dataset.font]; if (!f || b.querySelector('[data-font-min]')) return;
        var m = document.createElement('span'); m.className = 'chip-min'; m.setAttribute('data-font-min', ''); m.hidden = true;
        m.textContent = 'from ' + f.min.toFixed(2) + ' in'; b.appendChild(m);
      });
      // A recent design of another hat style opens on that hat's own page, since this page can't switch styles.
      var recent = document.querySelector('[data-recent-list]');
      if (recent) recent.addEventListener('click', function (e) {
        var link = e.target.closest('[data-recent-code]'), d = link && savedDesign(link.dataset.recentCode);
        if (!d || d.product !== 'hat' || !d.style || d.style === STYLE_ID || !STYLES[d.style]) return;
        e.preventDefault(); e.stopPropagation();
        window.location.href = 'hat.html?style=' + d.style + '&design=' + encodeURIComponent(d.code);
      }, true);
      // The photo styles repaint once the photo is in, so the cart picture has it.
      var still = document.querySelector('[data-hat-still]');
      if (still && !STYLE.model) still.addEventListener('load', function () { a.render(); });
      // Lettering uses web fonts: repaint once they've loaded.
      if (document.fonts) {
        Object.keys(FONTS).forEach(function (k) { document.fonts.load('100px ' + FONTS[k]); });
        document.fonts.load('700 12px Figtree');
        document.fonts.ready.then(function () { a.render(); });
      }
    }
  };
})();
