// The accessory page (UI-12; spec A-1, A-4, A-6): describes an accessory to the shared designer (designer.js) and draws it.
// The accessory is data (ACCESSORY below, with each brand's part in BRANDS): a photo for each color, how those photos
// were taken, the named print areas placed on the photo with their size in inches and decoration method, the allowed
// styles and the tier ladder. Another accessory is another ACCESSORY plus its photos; the drawing code stays as it is.
// Shown with the tumbler, laser engraved, from three brands. Its print areas and method are examples until Chuck
// confirms them (OQ-9); its prices are examples until he sets them (OQ-3).
// Engraved areas show the artwork flat, with the product's shading (A-4): the laser takes the coating off, so the
// artwork shows the bare steel, taken from a picture of the same tumbler in bare steel at the same spot, curve and
// highlights included.
(function () {
  'use strict';

  var ACCESSORY = {
    product: 'tumbler',
    name: 'Custom tumblers',            // as the cart and the recent-design cards name it (set by brand below)
    noun: 'tumbler',
    page: 'accessory.html',
    code: 'HGS-10452',                  // the next free sample design code (ball HGS-10450, hat HGS-10451)
    styles: ['logo', 'text', 'monogram'],
    min: 24,
    tiers: [{ min: 24, price: 19 }, { min: 72, price: 17 }, { min: 144, price: 15 }],   // examples, the same as cart.js
    views: { front: 'Front', back: 'Back' },
    // The print areas: each faces the camera in its own view, `width` measured around the body and `height` up it,
    // centred `center` inches above the base (each brand sets its own centre).
    areas: [
      { id: 'front', name: 'Front', note: 'The side facing you', view: 'front', width: 2.75, height: 3, center: 3.4, method: 'laser' },
      { id: 'back', name: 'Back', note: 'The opposite side', view: 'back', width: 2.75, height: 3, center: 3.4, method: 'laser' }
    ],
    start: { tab: 'logo', color: 'white', areas: ['front'], qty: 48, font: 'classic', logoSize: 85,
      line1: 'Pinecrest', line2: 'Golf Club' }
  };
  // Decoration methods, as the buyer reads them. This page draws laser engraving; printing (flat color with the
  // product's shading) and embroidery come with the first accessory that uses them.
  var METHODS = { laser: { name: 'laser engraved', verb: 'engraved' } };

  // The brand the buyer clicked on Shop all (D-117, D-137): ?brand=brawn-and-fox, stanley or corkcicle, one tumbler per
  // brand; a saved design (?design=) opens on its own brand; none or unknown opens the first, Brawn & Fox. The page has no
  // brand switch; the buyer changes the color. Each brand opens on the color its Shop all tile shows first.
  // The pictures are each brand's own product photos, logos painted out, as stand-ins until Chuck chooses the tumbler
  // and sends his photos (session 14; tools/tumblers/, img/CREDITS.md): Brawn & Fox's white tumbler (brawnandfox.com,
  // the Azalea Tumbler with its print removed), Stanley's Everyday Tumbler 20 oz (stanley1913.com), Corkcicle's Classic
  // Tumbler 16 oz (corkcicle.com). Only front photos exist, so the back view shows the same picture. `light` colors take
  // a dark dashed edge; `bare` = uncoated steel, engraved darker. `body` and `camera` say how the photos were taken, so
  // artwork follows the body: its shape in inches (a cone, narrower at the base, standing on the floor with its axis at
  // 0, 0) and the camera, in the same inches, for a photo `size` pixels square (straight on, from far away), as
  // measured by tools/tumblers/make.py.
  var BRANDS = {
    'brawn-and-fox': { name: 'Brawn & Fox', color: 'white',
      colors: { white: { name: 'White', hex: '#F2F2F0', light: true } },
      photo: 'img/tumbler-brawn-and-fox-{color}.webp', steel: 'img/tumbler-brawn-and-fox-bare.webp', center: 3.0,
      body: { shape: 'cone', height: 5.814, rBottom: 1.322, rTop: 1.772 },
      camera: { size: 1600, fov: 1.6557, eye: [0, 3.777, 300], target: [0, 3.777, 0] } },
    stanley: { name: 'Stanley', color: 'steel',
      colors: {
        steel: { name: 'Stainless Steel Ash', hex: '#B9BCBE', light: true, bare: true },
        white: { name: 'Frost', hex: '#ECECE8', light: true },
        black: { name: 'Black', hex: '#232323' },
        green: { name: 'Dried Pine', hex: '#7E8F6E' }
      },
      photo: 'img/tumbler-stanley-{color}.webp', steel: 'img/tumbler-stanley-bare.webp', center: 3.3,
      body: { shape: 'cone', height: 6.353, rBottom: 1.3, rTop: 1.772 },
      camera: { size: 1600, fov: 1.8108, eye: [0, 4.131, 300], target: [0, 4.131, 0] } },
    corkcicle: { name: 'Corkcicle', color: 'white',
      colors: {
        white: { name: 'Gloss White', hex: '#F3F3F1', light: true },
        black: { name: 'Matte Black', hex: '#3A3B3D' },
        navy: { name: 'Gloss Midnight Navy', hex: '#1C2550' },
        oat: { name: 'Oat Milk', hex: '#E8E3D8', light: true }
      },
      photo: 'img/tumbler-corkcicle-{color}.webp', steel: 'img/tumbler-corkcicle-bare.webp', center: 3.2,
      body: { shape: 'cone', height: 6.106, rBottom: 1.35, rTop: 1.772 },
      camera: { size: 1600, fov: 1.7421, eye: [0, 3.974, 300], target: [0, 3.974, 0] } }
  };
  var brand = (function () {
    var q = new URLSearchParams(location.search), b = q.get('brand'), code = q.get('design'), d = null;
    try { d = code && (JSON.parse(localStorage.getItem('honors-recent-designs') || '[]') || []).filter(function (x) { return x.code === code; })[0]; } catch (e) { d = null; }
    if (d && d.product === ACCESSORY.product && BRANDS[d.brand]) b = d.brand;
    return BRANDS[b] ? b : 'brawn-and-fox';
  })();
  var BRAND = BRANDS[brand], TITLE = BRAND.name + ' tumbler';
  ['colors', 'photo', 'steel', 'body', 'camera'].forEach(function (k) { ACCESSORY[k] = BRAND[k]; });
  ACCESSORY.areas.forEach(function (a) { a.center = BRAND.center; });
  ACCESSORY.name = TITLE;
  ACCESSORY.start.color = BRAND.color;
  document.title = TITLE + ' | Honors (A. Clean)';
  // The brand's colors as swatches, before the designer wires them up.
  (function () {
    var root = document.querySelector('.swatches'); if (!root) return;
    root.innerHTML = Object.keys(BRAND.colors).map(function (k) {
      var c = BRAND.colors[k];
      return '<button type="button" class="swatch" data-color="' + k + '" aria-label="' + c.name + '" aria-pressed="' + (k === BRAND.color) + '"><span style="background:' + c.hex + '"></span></button>';
    }).join('');
    var name = document.getElementById('color-name'); if (name) name.textContent = BRAND.colors[BRAND.color].name;
  })();

  var A = ACCESSORY, PX_PER_IN = 200, SAFE = 0.06;
  var FONTS = {
    classic: "'Marcellus', Georgia, serif", block: "'Alfa Slab One', Georgia, serif",
    script: "'Pinyon Script', cursive", clean: "'Figtree', 'Helvetica Neue', sans-serif"
  };
  var FONT_NAMES = { classic: 'Classic', block: 'Block', script: 'Script', clean: 'Clean' };
  var MIN_CAP_INCHES = 0.1;   // capitals smaller than this lose their detail when engraved

  function byId(id) { return document.getElementById(id); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function areaById(id) { return A.areas.filter(function (a) { return a.id === id; })[0]; }
  function areasOn(state) { return A.areas.filter(function (a) { return state.areas.indexOf(a.id) !== -1; }); }
  function photoUrl(color, view) { return A.photo.replace('{color}', color).replace('{view}', view); }
  function steelUrl(view) { return A.steel.replace('{view}', view); }

  // ---- The camera: where a point on the body lands in the photo, and which point of the body a pixel shows ----
  var cam = (function (c) {
    var sub = function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };
    var norm = function (a) { var l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
    var cross = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    var f = norm(sub(c.target, c.eye)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
    return { E: c.eye, f: f, r: r, u: u, t: Math.tan(c.fov * Math.PI / 360), half: c.size / 2, size: c.size };
  })(A.camera);
  var B = A.body, SLOPE = (B.rTop - B.rBottom) / B.height;
  function radiusAt(y) { return B.rBottom + SLOPE * y; }
  function project(theta, y) {
    var rr = radiusAt(y), d = [rr * Math.sin(theta) - cam.E[0], y - cam.E[1], rr * Math.cos(theta) - cam.E[2]];
    var z = d[0] * cam.f[0] + d[1] * cam.f[1] + d[2] * cam.f[2];
    return [cam.half + (d[0] * cam.r[0] + d[1] * cam.r[1] + d[2] * cam.r[2]) / z / cam.t * cam.half,
      cam.half - (d[0] * cam.u[0] + d[1] * cam.u[1] + d[2] * cam.u[2]) / z / cam.t * cam.half];
  }
  // An area's outline in the photo, as points around its edge, and the box of pixels it covers.
  function outlinePoints(area) {
    var pts = [], n = 32, half = area.width / 2, y0 = area.center - area.height / 2, y1 = area.center + area.height / 2, i;
    var th = function (y, s) { return s / radiusAt(y); };
    for (i = 0; i <= n; i++) pts.push(project(th(y1, -half + area.width * i / n), y1));
    for (i = 0; i <= n; i++) pts.push(project(th(y1 - area.height * i / n, half), y1 - area.height * i / n));
    for (i = 0; i <= n; i++) pts.push(project(th(y0, half - area.width * i / n), y0));
    for (i = 0; i <= n; i++) pts.push(project(th(y0 + area.height * i / n, -half), y0 + area.height * i / n));
    return pts;
  }
  var geometry = {};
  function geo(area) {
    if (geometry[area.id]) return geometry[area.id];
    var pts = outlinePoints(area), xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var x = Math.max(0, Math.floor(Math.min.apply(null, xs)) - 3), y = Math.max(0, Math.floor(Math.min.apply(null, ys)) - 3);
    var w = Math.min(cam.size, Math.ceil(Math.max.apply(null, xs)) + 3) - x, h = Math.min(cam.size, Math.ceil(Math.max.apply(null, ys)) + 3) - y;
    return (geometry[area.id] = { outline: pts, x: x, y: y, w: w, h: h });
  }

  // ---- Photos: every color and view loaded once; the brand's bare-steel picture gives the steel's pixels ----
  var photos = {}, steel = {}, api = null;
  function load(url) {
    if (!photos[url]) {
      var img = new Image();
      photos[url] = img;
      img.onload = function () { if (api) api.render(); };
      img.src = url;
    }
    return photos[url].complete && photos[url].naturalWidth ? photos[url] : null;
  }
  function photo(color, view) { return load(photoUrl(color, view)); }
  // The steel under an area, from the bare-steel picture of that area's view (only the area's own box is kept).
  function steelUnder(area) {
    var key = area.id;
    if (steel[key]) return steel[key];
    var img = load(steelUrl(area.view));
    if (!img) return null;
    var g = geo(area), c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, g.x * img.naturalWidth / cam.size, g.y * img.naturalHeight / cam.size, g.w * img.naturalWidth / cam.size, g.h * img.naturalHeight / cam.size, 0, 0, g.w, g.h);
    return (steel[key] = ctx.getImageData(0, 0, g.w, g.h).data);
  }

  // ---- The artwork, flat, as what the laser marks (opaque = engraved), at 200 pixels per inch ----
  var logoCache = {};
  // An uploaded logo as an engraving: its own transparency if it has some; otherwise its dark parts (a white
  // background is left as the tumbler). Returns the mark and the box around its visible part, or null while loading.
  function logoMark(url) {
    if (logoCache[url]) return logoCache[url].ready ? logoCache[url] : null;
    var entry = logoCache[url] = { ready: false }, img = new Image();
    img.onload = function () {
      var k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
      var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
      var data = g.getImageData(0, 0, c.width, c.height), d = data.data, clear = 0, n = d.length / 4, i;
      for (i = 3; i < d.length; i += 4) if (d[i] < 128) clear++;
      var useAlpha = clear > n * 0.02, x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (i = 0; i < n; i++) {
        var a = d[i * 4 + 3] / 255;
        if (!useAlpha) { var L = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255; a *= Math.max(0, Math.min(1, (0.82 - L) / 0.3)); }
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0; d[i * 4 + 3] = Math.round(a * 255);
        if (a > 0.16) { var x = i % c.width, y = (i / c.width) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      g.putImageData(data, 0, 0);
      if (x1 < 0) { x0 = y0 = 0; x1 = c.width - 1; y1 = c.height - 1; }
      entry.canvas = c; entry.box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; entry.ready = true;
      if (api) api.render();
    };
    img.src = url;
    return null;
  }
  // The sample logo (pinecrest-logo.jpg), as on the other designers. With its white background kept, the square
  // is engraved too and the logo shows in the tumbler's own color inside it.
  function sampleLogo(g, k, white) {
    g.save(); g.scale(k, k);
    if (white) { g.fillRect(-78, -78, 156, 156); g.globalCompositeOperation = 'destination-out'; }
    g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 64, 0, Math.PI * 2); g.stroke();
    g.beginPath(); [[0, -50], [20, -18], [11, -18], [27, 6], [-27, 6], [-11, -18], [-20, -18]].forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); });
    g.closePath(); g.fill(); g.fillRect(-5, 6, 10, 11);
    g.textAlign = 'center'; g.font = '700 12px Figtree, sans-serif'; spacing(g, 2); g.fillText('PINECREST', 0, 36);
    g.font = '400 8px Figtree, sans-serif'; g.fillText('GOLF CLUB', 0, 50);
    g.restore();
  }
  function spacing(g, px) { if ('letterSpacing' in g) g.letterSpacing = px + 'px'; }

  var artCanvas = document.createElement('canvas');
  // Paints the artwork for an area of this size; answers whether text comes out too small to engrave well.
  function paintArt(state, area) {
    var W = Math.round(area.width * PX_PER_IN), H = Math.round(area.height * PX_PER_IN);
    if (artCanvas.width !== W || artCanvas.height !== H) { artCanvas.width = W; artCanvas.height = H; }
    var g = artCanvas.getContext('2d', { willReadFrequently: true }), m = SAFE * Math.min(W, H);
    var sw = W - 2 * m, sh = H - 2 * m, cx = W / 2, cy = H / 2, fam = FONTS[state.font] || FONTS.classic, small = false;
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    g.fillStyle = g.strokeStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; spacing(g, 0);
    if (state.tab === 'logo') {
      var pct = (state.logoSize || 85) / 100;
      if (state.logo.sample) {
        var white = !state.logo.bgRemoved, size = white ? 156 : 132;
        g.save(); g.translate(cx, cy); sampleLogo(g, Math.min(sw, sh) / size * pct, white); g.restore();
      } else if (state.logo.url && !state.logo.isPdf) {
        var mark = logoMark(state.logo.url);
        if (mark) {
          var b = mark.box, s = Math.min(sw / b.w, sh / b.h) * pct;
          g.drawImage(mark.canvas, cx - (b.x + b.w / 2) * s, cy - (b.y + b.h / 2) * s, mark.canvas.width * s, mark.canvas.height * s);
        }
      }
    } else if (state.tab === 'monogram') {
      var letters = state.mono || '';
      if (letters) {
        g.font = '100px ' + fam; spacing(g, 6);
        var mm = g.measureText(letters), mw = mm.actualBoundingBoxLeft + mm.actualBoundingBoxRight, mh = mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent;
        var k = Math.min(sw / mw, sh * 0.45 / mh);   // a monogram stays under half the area's height
        g.font = Math.round(100 * k) + 'px ' + fam; spacing(g, Math.round(6 * k));
        g.fillText(letters, cx + (mm.actualBoundingBoxLeft - mm.actualBoundingBoxRight) * k / 2, cy + (mm.actualBoundingBoxAscent - mm.actualBoundingBoxDescent) * k / 2);
      }
    } else {
      // Two lines, the second at 72% of the first; the block is as wide as the area allows, and at most 60% as tall.
      var lines = [state.line1 || '', state.line2 || ''].filter(function (t) { return t.trim(); });
      if (lines.length) {
        var scale = [1, 0.72], gap = 26;
        var ms = lines.map(function (t, i) { g.font = (100 * scale[i]) + 'px ' + fam; return g.measureText(t); });
        var bw = Math.max.apply(null, ms.map(function (x) { return x.actualBoundingBoxLeft + x.actualBoundingBoxRight; }));
        var hs = ms.map(function (x) { return x.actualBoundingBoxAscent + x.actualBoundingBoxDescent; });
        var bh = hs.reduce(function (a, c) { return a + c; }, 0) + (lines.length - 1) * gap;
        var kk = Math.min(sw / bw, sh * 0.6 / bh), y = cy - bh * kk / 2;
        lines.forEach(function (t, i) {
          var px = 100 * scale[i] * kk;
          g.font = px + 'px ' + fam;
          g.fillText(t, cx, y + ms[i].actualBoundingBoxAscent * kk);
          y += hs[i] * kk + gap * kk;
          if (px * 0.7 / PX_PER_IN < MIN_CAP_INCHES) small = true;
        });
      }
    }
    return { small: small, alpha: g.getImageData(0, 0, W, H).data, W: W, H: H };
  }

  // ---- The engraving: every pixel of the area's box traced back to the point of the body it shows ----
  // (a ray from the camera meeting the cone), then to the artwork there. Engraved pixels show the bare steel.
  function engrave(art, area, bare) {
    var g = geo(area), metal = steelUnder(area);
    var out = new ImageData(g.w, g.h), o = out.data;
    if (!metal) return { image: out, g: g };
    var E = cam.E, W = art.W, H = art.H, A8 = art.alpha, top = area.center + area.height / 2;
    for (var j = 0; j < g.h; j++) {
      var ny = (cam.half - (g.y + j + 0.5)) / cam.half * cam.t;
      for (var i = 0; i < g.w; i++) {
        var nx = (g.x + i + 0.5 - cam.half) / cam.half * cam.t;
        var dx = cam.f[0] + nx * cam.r[0] + ny * cam.u[0], dy = cam.f[1] + nx * cam.r[1] + ny * cam.u[1], dz = cam.f[2] + nx * cam.r[2] + ny * cam.u[2];
        var r0 = B.rBottom + SLOPE * E[1];
        var a = dx * dx + dz * dz - SLOPE * SLOPE * dy * dy, b = 2 * (E[0] * dx + E[2] * dz - SLOPE * dy * r0), c = E[0] * E[0] + E[2] * E[2] - r0 * r0;
        var disc = b * b - 4 * a * c;
        if (disc < 0) continue;
        var t = (-b - Math.sqrt(disc)) / (2 * a), px = E[0] + t * dx, py = E[1] + t * dy, pz = E[2] + t * dz;
        var u = radiusAt(py) * Math.atan2(px, pz) / area.width + 0.5, v = (top - py) / area.height;
        if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
        // Bilinear sample of the artwork.
        var sx = u * W - 0.5, sy = v * H - 0.5, x0 = Math.max(0, Math.floor(sx)), y0 = Math.max(0, Math.floor(sy));
        var x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1), fx = Math.min(1, Math.max(0, sx - x0)), fy = Math.min(1, Math.max(0, sy - y0));
        var m = ((A8[(y0 * W + x0) * 4 + 3] * (1 - fx) + A8[(y0 * W + x1) * 4 + 3] * fx) * (1 - fy) +
          (A8[(y1 * W + x0) * 4 + 3] * (1 - fx) + A8[(y1 * W + x1) * 4 + 3] * fx) * fy);
        if (m < 1) continue;
        var p = (j * g.w + i) * 4;
        if (bare) {   // on bare steel the laser leaves a darker, matte mark
          o[p] = metal[p] * 0.56 + 10; o[p + 1] = metal[p + 1] * 0.56 + 11; o[p + 2] = metal[p + 2] * 0.56 + 12;
        } else {      // through the coating: the steel itself, a touch brighter where it's freshly cut
          o[p] = Math.min(255, metal[p] * 1.02 + 6); o[p + 1] = Math.min(255, metal[p + 1] * 1.02 + 6); o[p + 2] = Math.min(255, metal[p + 2] * 1.02 + 6);
        }
        o[p + 3] = m;
      }
    }
    return { image: out, g: g };
  }
  function layerOf(res) {
    var c = document.createElement('canvas'); c.width = res.g.w; c.height = res.g.h;
    c.getContext('2d').putImageData(res.image, 0, 0);
    return c;
  }

  // ---- The stage: the photo for the color and view, the engraving over it, and the area's outline ----
  var view = null;
  function stage() { return document.querySelector('[data-acc-stage]'); }
  function drawStage(state) {
    var st = stage(); if (!st) return false;
    if (!view) view = areasOn(state)[0].view;
    var area = A.areas.filter(function (a) { return a.view === view; })[0], on = state.areas.indexOf(area.id) !== -1;
    var img = st.querySelector('[data-acc-photo]'), src = photoUrl(state.color, view);
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    photo(state.color, view);
    var canvas = st.querySelector('[data-acc-engrave]'), g = canvas.getContext('2d');
    g.clearRect(0, 0, canvas.width, canvas.height);
    var art = paintArt(state, area);
    if (on) {
      var res = engrave(art, area, !!A.colors[state.color].bare);
      g.drawImage(layerOf(res), res.g.x, res.g.y);
    }
    // The area's edge, dashed: light on the dark colors, Pine on the light ones.
    var light = !!A.colors[state.color].light;
    g.save(); g.beginPath();
    geo(area).outline.forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); });
    g.closePath(); g.setLineDash([12, 9]); g.lineWidth = 3;
    g.strokeStyle = light ? 'rgba(18, 52, 42, ' + (on ? 0.34 : 0.5) + ')' : 'rgba(255, 255, 255, ' + (on ? 0.42 : 0.6) + ')';
    g.stroke(); g.restore();
    var chip = st.querySelector('[data-acc-chip]');
    chip.textContent = on ? 'Dashed line: the ' + area.width + ' × ' + area.height + ' in engraving area' : 'Nothing is engraved on the ' + area.name.toLowerCase();
    $$('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === view)); });
    canvas.setAttribute('aria-label', 'Preview of your tumbler, ' + A.views[view].toLowerCase() + ' view: ' + describe(state));
    return art.small;
  }

  // The picture the cart and the recent-design cards keep: the first engraved side, cropped around the tumbler.
  function snapshot(state) {
    var area = areasOn(state)[0], img = photo(state.color, area.view);
    if (!img || !steelUnder(area)) return null;
    var c = document.createElement('canvas'); c.width = 432; c.height = 400;
    var g = c.getContext('2d'), sy = 100, sh = 1440, sw = sh * 432 / 400, sx = cam.half - sw / 2, k = 400 / sh;
    g.drawImage(img, sx * img.naturalWidth / cam.size, sy * img.naturalHeight / cam.size, sw * img.naturalWidth / cam.size, sh * img.naturalHeight / cam.size, 0, 0, 432, 400);
    var res = engrave(paintArt(state, area), area, !!A.colors[state.color].bare);
    g.drawImage(layerOf(res), (res.g.x - sx) * k, (res.g.y - sy) * k, res.g.w * k, res.g.h * k);
    try { return c.toDataURL('image/webp', 0.9); } catch (e) { return null; }
  }

  // ---- Words: the design in a sentence, and the panel's own controls ----
  function sides(state) {
    var on = areasOn(state).map(function (a) { return 'the ' + a.name.toLowerCase(); });
    return on.length > 1 ? on.slice(0, -1).join(', ') + ' and ' + on[on.length - 1] : on[0];
  }
  function describe(state) {
    var method = METHODS[areasOn(state)[0].method], font = FONT_NAMES[state.font], what;
    if (state.tab === 'logo') what = 'your logo (' + state.logo.name + ')';
    else if (state.tab === 'monogram') what = 'the monogram “' + (state.mono || '') + '” in ' + font + ' lettering';
    else what = '“' + [state.line1, state.line2].filter(Boolean).join(' / ') + '” in ' + font + ' lettering';
    return A.colors[state.color].name + ' tumbler, ' + method.name + ' on ' + sides(state) + ' with ' + what + '.';
  }
  function syncControls(state) {
    $$('[data-area]').forEach(function (b) {
      var on = state.areas.indexOf(b.dataset.area) !== -1;
      b.setAttribute('aria-pressed', String(on));
    });
    byId('logo-size').value = String(state.logoSize);
    byId('logo-size-out').textContent = state.logoSize + '%';
    var bare = !!A.colors[state.color].bare;
    byId('logo-color-note').textContent = 'Engraving is one tone: your logo shows as ' + (bare ? 'a darker etch in the steel' : 'bare steel') + ', whatever its colors.';
  }
  // The area cards come from the configuration, so another accessory's areas appear without new markup.
  function buildAreas() {
    var root = document.querySelector('[data-acc-areas]');
    if (!root) return;
    root.innerHTML = A.areas.map(function (a) {
      return '<button type="button" class="chip acc-area" data-area="' + a.id + '" aria-pressed="false">' +
        '<span class="acc-area-top"><span class="chip-title">' + a.name + '</span><span class="acc-tick" aria-hidden="true">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></span>' +
        '<span class="chip-name">' + a.note + '</span></button>';
    }).join('');
    var sizes = A.areas.map(function (a) { return a.width + ' × ' + a.height + ' in, ' + METHODS[a.method].name; });
    var same = sizes.every(function (s) { return s === sizes[0]; });
    byId('areas-hint').textContent = (same ? 'Each side takes up to ' + sizes[0] + '.' : A.areas.map(function (a, i) { return a.name + ': ' + sizes[i] + '.'; }).join(' ')) +
      ' With both on, each side gets the same design.';
    // One button per view on the stage, to turn the tumbler round (hidden when there's only one view).
    var views = document.querySelector('[data-acc-views]'), keys = Object.keys(A.views);
    if (views) {
      views.innerHTML = keys.map(function (v) { return '<button type="button" data-view="' + v + '" aria-pressed="false">' + A.views[v] + '</button>'; }).join('');
      views.hidden = keys.length < 2;
    }
  }
  // Review links: mark the one that matches this address (once the designer has tidied it, on the first draw).
  var marked = false;
  function markReview() {
    if (marked) return; marked = true;
    $$('.review-switch a[data-review]').forEach(function (a) {
      if (a.getAttribute('data-review') === location.search) a.setAttribute('aria-current', 'page');
    });
  }

  window.HonorsProduct = {
    product: A.product, name: A.name, noun: A.noun, page: A.page,
    keep: ['areas', 'logoSize', 'brand'],
    colors: A.colors,
    tiers: A.tiers,
    min: A.min,
    minPx: 600,   // about 220 pixels per inch across the 2.75-inch area
    nextLabel: { 1: 'Next: tumbler', 2: 'Next: quantity' },
    unit: {
      count: function (n) { return n + (n === 1 ? ' tumbler' : ' tumblers'); },
      each: function (price) { return '$' + price + ' each'; },
      best: 'You’re getting the best price per tumbler.'
    },
    state: Object.assign({ code: A.code, brand: brand }, A.start),
    draw: function (state) {
      if (!A.colors[state.color]) state.color = Object.keys(A.colors)[0];
      if (!Array.isArray(state.areas) || !areasOn(state).length) state.areas = [A.areas[0].id];
      syncControls(state);
      markReview();
      return drawStage(state);
    },
    design: function (d, state) {
      var shot = snapshot(state);
      Object.assign(d, { product: A.product, brand: brand, areas: state.areas.slice(), logoSize: state.logoSize, summary: describe(state), preview: shot, noPreview: !shot });
    },
    init: function (a) {
      api = a;
      buildAreas();
      $$('[data-acc-brand]').forEach(function (e) { e.textContent = BRAND.name; });
      $$('[data-acc-name]').forEach(function (e) { e.textContent = TITLE; });
      // A recent design of another brand opens on its own brand's page rather than in this one.
      document.addEventListener('click', function (e) {
        var link = e.target.closest && e.target.closest('[data-recent-code]'), code = link && link.dataset.recentCode, r = null;
        if (!code) return;
        try { r = (JSON.parse(localStorage.getItem('honors-recent-designs') || '[]') || []).filter(function (x) { return x.code === code; })[0]; } catch (err) { r = null; }
        if (r && r.product === A.product && BRANDS[r.brand] && r.brand !== brand) {
          e.preventDefault(); e.stopPropagation();
          location.href = A.page + '?brand=' + r.brand + '&design=' + encodeURIComponent(code);
        }
      }, true);
      // Only the allowed styles are offered.
      $$('button[data-tab]').forEach(function (b) { if (A.styles.indexOf(b.dataset.tab) === -1) b.hidden = true; });
      // Load every photo now, so a color or side changes at once.
      Object.keys(A.colors).forEach(function (c) { Object.keys(A.views).forEach(function (v) { photo(c, v); load(steelUrl(v)); }); });
      $$('[data-area]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.dataset.area, on = a.state.areas.indexOf(id) !== -1;
          if (on && a.state.areas.length === 1) return;   // one side always stays engraved
          var next = on ? a.state.areas.filter(function (x) { return x !== id; }) : A.areas.map(function (x) { return x.id; }).filter(function (x) { return x === id || a.state.areas.indexOf(x) !== -1; });
          if (!on) view = areaById(id).view;               // turn the tumbler to the side just added
          else if (view === areaById(id).view) view = areaById(next[0]).view;
          a.set({ areas: next });
        });
      });
      $$('[data-view]').forEach(function (b) { b.addEventListener('click', function () { view = b.dataset.view; a.render(); }); });
      byId('logo-size').addEventListener('input', function (e) { a.set({ logoSize: Number(e.target.value) }); });
      if (document.fonts) {
        Object.keys(FONTS).forEach(function (k) { document.fonts.load('100px ' + FONTS[k]); });
        document.fonts.load('700 12px Figtree');
        document.fonts.ready.then(function () { a.render(); });
      }
    }
  };
})();
