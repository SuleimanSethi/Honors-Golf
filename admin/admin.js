// Chuck's admin pages (UI-50 to UI-59): shared sample data, product thumbnails and the
// Shopify admin frame around each page (D-62). Everything here is sample data at example prices (OQ-3); nothing is saved.
// A page puts its content in <div class="page" id="page"> inside <body class="admin" data-admin-page="…">, and this
// script draws the admin's top bar, side navigation (with the app listed under Apps as "Honors") and the app's title bar.
(function (root) {
  'use strict';

  // ---- Pricing: the same example rules as shared/cart.js (golf balls by the dozen, hats one by one) ----
  var PRODUCTS = {
    ball: { name: 'Golf balls', unit: 'dozen', min: 6, tiers: [
      { min: 6, price: 54, name: '6–11 dozen' }, { min: 12, price: 49, name: '12–23 dozen' }, { min: 24, price: 44, name: '24 dozen or more' }
    ] },
    hat: { name: 'Rope hats', unit: 'hats', min: 24, tiers: [
      { min: 24, price: 22, name: '24–47 hats' }, { min: 48, price: 20, name: '48–143 hats' }, { min: 144, price: 18, name: '144 hats or more' }
    ] }
  };
  function tierFor(qty, product) { var t = PRODUCTS[product].tiers, out = t[0]; t.forEach(function (x) { if (qty >= x.min) out = x; }); return out; }
  function count(n, product) { return product === 'hat' ? n + (n === 1 ? ' hat' : ' hats') : n + ' dozen'; }

  // ---- The sample clock: the prototype's "now" ----
  function at(s) { var p = s.split(/[- :]/).map(Number); return new Date(p[0], p[1] - 1, p[2], p[3] || 0, p[4] || 0); }
  var NOW = at('2026-09-29 11:40');

  // ---- Sample buyers (fictional; clubs from the home page's sample clients) ----
  var BUYERS = {
    alex: { name: 'Alex Morgan', club: 'Pinecrest Golf Club', email: 'alex@pinecrestgolf.example' },
    megan: { name: 'Megan Doyle', club: 'Harbor Oaks CC', email: 'megan@harboroaks.example' },
    dana: { name: 'Dana Whitfield', club: 'Blue Heron Links', email: 'dana@blueheronlinks.example' },
    sam: { name: 'Sam Okafor', club: 'Cedar Ridge', email: 'sam@cedarridgegolf.example' },
    riley: { name: 'Riley Brooks', club: 'The Marsh Club', email: 'riley@themarshclub.example' }
  };

  // ---- Saved logos (Alex's three, from the shared sample story) ----
  var LOGOS = [
    { file: 'pinecrest-crest.svg', buyer: 'alex', uploaded: '2026-09-02' },
    { file: 'pinecrest-logo.jpg', buyer: 'alex', uploaded: '2026-09-12' },
    { file: 'pinecrest-script.png', buyer: 'alex', uploaded: '2026-09-20' }
  ];

  // ---- Sample designs. Codes follow the order they were created (gaps are other buyers and guests).
  //      `cart`: the buyer added it to their cart (a C-12 event) ----
  var HAT = { hat: 'Forest', rope: 'White', shape: 'Round', material: 'Embroidered', patch: 'Off-white' };
  function hat(o) { return Object.assign({ product: 'hat' }, HAT, o); }
  var DESIGNS = {
    'HGS-10377': { product: 'ball', kind: 'monogram', mono: 'PGC', font: 'classic', color: 'navy', buyer: 'alex', created: '2026-09-03 15:20' },
    'HGS-10381': { product: 'ball', kind: 'text', line1: 'Harbor Oaks CC', font: 'classic', color: 'navy', buyer: 'megan', created: '2026-09-06 10:05' },
    'HGS-10386': { product: 'ball', kind: 'monogram', mono: 'TMC', font: 'classic', color: 'green', buyer: 'riley', created: '2026-09-08 14:40' },
    'HGS-10392': hat({ kind: 'text', line1: 'BLUE HERON', thread: 'navy', buyer: 'dana', created: '2026-09-10 09:30' }),
    'HGS-10398': { product: 'ball', kind: 'logo', logo: 'pinecrest-logo.jpg', buyer: 'alex', created: '2026-09-12 16:10', cart: { qty: 6, at: '2026-09-12 16:14' } },
    'HGS-10401': { product: 'ball', kind: 'text', line1: 'Cedar Ridge', font: 'clean', color: 'green', buyer: 'sam', created: '2026-09-13 11:25' },
    'HGS-10412': { product: 'ball', kind: 'text', line1: 'Pinecrest Club', line2: 'Club Championship', font: 'classic', color: 'navy', buyer: 'alex', created: '2026-09-15 10:02', cart: { qty: 12, at: '2026-09-15 10:09' } },
    'HGS-10417': hat({ kind: 'monogram', mono: 'HO', thread: 'navy', buyer: 'megan', created: '2026-09-15 15:48' }),
    'HGS-10423': hat({ kind: 'logo', logo: 'pinecrest-logo.jpg', buyer: 'alex', created: '2026-09-16 13:30' }),
    'HGS-10424': { product: 'ball', kind: 'text', line1: 'The Marsh Club', font: 'classic', color: 'green', buyer: 'riley', created: '2026-09-18 17:05' },
    'HGS-10426': hat({ kind: 'monogram', mono: 'CR', thread: 'forest', buyer: 'sam', created: '2026-09-19 09:50' }),
    'HGS-10428': { product: 'ball', kind: 'monogram', mono: 'BHL', font: 'classic', color: 'navy', buyer: 'dana', created: '2026-09-20 14:15' },
    'HGS-10430': hat({ kind: 'text', line1: 'HARBOR', line2: 'OAKS', thread: 'navy', buyer: 'megan', created: '2026-09-21 11:32' }),
    'HGS-10431': hat({ kind: 'logo', logo: 'pinecrest-script.png', shape: 'Rectangle', material: 'PVC', buyer: 'alex', created: '2026-09-26 09:40' }),
    'HGS-10433': hat({ kind: 'monogram', mono: 'TMC', thread: 'forest', buyer: 'riley', created: '2026-09-26 14:20' }),
    'HGS-10434': { product: 'ball', kind: 'text', line1: 'The Marsh Club', line2: 'Member-Guest', font: 'classic', color: 'green', buyer: 'riley', created: '2026-09-26 14:41' },
    'HGS-10437': { product: 'ball', kind: 'text', line1: 'Blue Heron Links', font: 'clean', color: 'navy', buyer: 'dana', created: '2026-09-27 15:12' },
    'HGS-10439': { product: 'ball', kind: 'monogram', mono: 'CR', font: 'block', color: 'green', buyer: 'sam', created: '2026-09-27 17:30', cart: { qty: 12, at: '2026-09-27 17:36' } },
    'HGS-10442': { product: 'ball', kind: 'text', line1: 'Harbor Oaks CC', line2: 'Client Day', font: 'classic', color: 'navy', buyer: 'megan', created: '2026-09-28 16:27' }
  };
  Object.keys(DESIGNS).forEach(function (code) { DESIGNS[code].code = code; });

  // ---- Stages (C-7, D-31). Buyers see Received, In production and Shipped only ----
  var STAGES = [
    { id: 'received', name: 'Received', tone: 'info' },
    { id: 'vendor', name: 'Sent to vendor', tone: 'default' },
    { id: 'production', name: 'In production', tone: 'attention' },
    { id: 'hold', name: 'On hold', tone: 'warning' },
    { id: 'shipped', name: 'Shipped', tone: 'success' }
  ];

  // ---- Sample orders. Every line is priced at the break for its design's total quantity (C-3). `since`: when the order
  //      entered its stage (Received: when it was paid; Shipped: the Shopify fulfillment); `heldFrom`: the stage before On hold ----
  var ORDERS = [
    { no: 1036, buyer: 'alex', placed: '2026-09-05 10:22', stage: 'shipped', since: '2026-09-15 14:02', lines: [{ design: 'HGS-10377', qty: 12 }] },
    { no: 1037, buyer: 'megan', placed: '2026-09-07 09:48', stage: 'shipped', since: '2026-09-17 11:30', lines: [{ design: 'HGS-10381', qty: 24 }] },
    { no: 1038, buyer: 'riley', placed: '2026-09-09 15:03', stage: 'shipped', since: '2026-09-19 16:45', lines: [{ design: 'HGS-10386', qty: 12 }] },
    { no: 1039, buyer: 'dana', placed: '2026-09-11 13:37', stage: 'hold', since: '2026-09-23 09:15', heldFrom: 'vendor', lines: [{ design: 'HGS-10392', qty: 36 }] },
    { no: 1040, buyer: 'sam', placed: '2026-09-14 08:55', stage: 'production', since: '2026-09-24 10:10', lines: [{ design: 'HGS-10401', qty: 6 }] },
    { no: 1041, buyer: 'megan', placed: '2026-09-16 17:20', stage: 'production', since: '2026-09-25 13:40', lines: [{ design: 'HGS-10417', qty: 144 }] },
    { no: 1042, buyer: 'alex', placed: '2026-09-18 11:06', stage: 'production', since: '2026-09-26 09:30', lines: [{ design: 'HGS-10423', qty: 48 }] },
    { no: 1043, buyer: 'riley', placed: '2026-09-22 14:51', stage: 'vendor', since: '2026-09-25 08:45', lines: [{ design: 'HGS-10424', qty: 12 }] },
    { no: 1044, buyer: 'sam', placed: '2026-09-24 16:18', stage: 'received', since: '2026-09-24 16:18', lines: [{ design: 'HGS-10426', qty: 48 }] },
    { no: 1045, buyer: 'dana', placed: '2026-09-25 10:12', stage: 'vendor', since: '2026-09-26 15:20', lines: [{ design: 'HGS-10428', qty: 6 }] },
    { no: 1046, buyer: 'riley', placed: '2026-09-27 11:03', stage: 'received', since: '2026-09-27 11:03', lines: [{ design: 'HGS-10433', qty: 72 }, { design: 'HGS-10434', qty: 12 }] },
    { no: 1047, buyer: 'alex', placed: '2026-09-27 15:40', stage: 'received', since: '2026-09-27 15:40', lines: [{ design: 'HGS-10431', qty: 24 }] },
    { no: 1048, buyer: 'dana', placed: '2026-09-28 16:52', stage: 'received', since: '2026-09-28 16:52', lines: [{ design: 'HGS-10437', qty: 6 }] },
    { no: 1049, buyer: 'megan', placed: '2026-09-29 09:14', stage: 'received', since: '2026-09-29 09:14', lines: [{ design: 'HGS-10442', qty: 24 }] }
  ];

  function designTotal(order, code) { return order.lines.reduce(function (s, l) { return s + (l.design === code ? l.qty : 0); }, 0); }
  // Fill in each line's product, price break and price, and the order total.
  ORDERS.forEach(function (o) {
    o.lines.forEach(function (l) {
      var d = DESIGNS[l.design]; l.product = d.product;
      var right = tierFor(designTotal(o, l.design), l.product);
      l.tier = right.min; l.price = right.price;
      if (!d.order) d.order = o.no;
    });
    o.total = o.lines.reduce(function (s, l) { return s + l.qty * l.price; }, 0);
    o.designs = o.lines.map(function (l) { return l.design; }).filter(function (c, i, a) { return a.indexOf(c) === i; });
  });

  // ---- Formatting ----
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function money(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function time(t) { var h = t.getHours(), m = t.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' am' : ' pm'); }
  function dayDiff(t) { var a = new Date(t.getFullYear(), t.getMonth(), t.getDate()), b = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()); return Math.round((b - a) / 864e5); }
  function day(s) { var t = typeof s === 'string' ? at(s) : s; return MONTHS[t.getMonth()] + ' ' + t.getDate(); }
  // Shopify's style: "Today at 9:14 am", "Yesterday at 4:52 pm", "Sep 27 at 11:03 am".
  function when(s) { var t = typeof s === 'string' ? at(s) : s, n = dayDiff(t); return (n === 0 ? 'Today' : n === 1 ? 'Yesterday' : day(t)) + ' at ' + time(t); }
  // How long ago, in the unit a person would use: "2 hours", "3 days".
  function age(s) {
    var mins = Math.round((NOW - at(s)) / 6e4);
    if (mins < 60) return mins <= 1 ? '1 minute' : mins + ' minutes';
    var hours = Math.floor(mins / 60); if (hours < 24) return hours === 1 ? '1 hour' : hours + ' hours';
    var days = Math.floor(hours / 24); return days === 1 ? '1 day' : days + ' days';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---- Design words ----
  var FONTS = { classic: "'Marcellus', Georgia, serif", block: "'Alfa Slab One', Georgia, serif", script: "'Pinyon Script', cursive", clean: "'Figtree', 'Helvetica Neue', sans-serif" };
  var INKS = { black: '#1A1B1F', navy: '#1F2E55', oxblood: '#6B1E2A', red: '#C8262B', green: '#1E5B3F', gold: '#9A7128', forest: '#1F4A36' };
  function styleName(d) {
    var q = function (s) { return '“' + s + '”'; };
    if (d.kind === 'logo') return 'Logo, ' + d.logo;
    if (d.kind === 'monogram') return 'Monogram ' + q(d.mono);
    return 'Text ' + q(d.line1 + (d.line2 ? ' / ' + d.line2 : ''));
  }
  function productName(d) { return PRODUCTS[d.product].name; }

  // ---- Thumbnails: the real product with the design on it (as the cart draws its lines) ----
  // The Pinecrest sample logo, drawn in code as on the ball designer and the hat page, centred on 0,0 (ring radius 66).
  var SAMPLE_LOGO = '<circle r="64" fill="none" stroke="#1F2E55" stroke-width="4"/>' +
    '<polygon fill="#1F2E55" points="0,-50 20,-18 11,-18 27,6 -27,6 -11,-18 -20,-18"/><rect fill="#1F2E55" x="-5" y="6" width="10" height="11"/>' +
    '<text fill="#1F2E55" y="36" font-size="12" font-weight="700" letter-spacing="2" text-anchor="middle" font-family="Figtree, sans-serif">PINECREST</text>' +
    '<text fill="#1F2E55" y="50" font-size="8" letter-spacing="2" text-anchor="middle" font-family="Figtree, sans-serif">GOLF CLUB</text>';
  function fitSize(text, max) { var len = Math.max(text.length, 1); return Math.round(Math.min(max, 250 / (len * 0.56))); }
  // The ball print, in the same layout as the ball designer and the cart (400-unit box).
  function ballPrint(d) {
    if (d.kind === 'logo') return '<g transform="translate(200 196)">' + SAMPLE_LOGO + '</g>';
    var ink = INKS[d.color] || INKS.navy, font = esc(FONTS[d.font] || FONTS.classic);
    if (d.kind === 'monogram') return '<text x="200" y="228" font-size="92" letter-spacing="4" text-anchor="middle" font-family="' + font + '" fill="' + ink + '">' + esc(d.mono) + '</text>';
    var s1 = fitSize(d.line1 || '', 46), s2 = d.line2 ? Math.min(Math.round(s1 * 1.25), fitSize(d.line2, 40)) : 0;
    var y1 = Math.round(196 - (s1 + (d.line2 ? 10 + s2 : 0)) / 2 + s1 * 0.8);
    return '<g text-anchor="middle" font-family="' + font + '" fill="' + ink + '">' +
      '<text x="200" y="' + y1 + '" font-size="' + s1 + '">' + esc(d.line1) + '</text>' +
      (d.line2 ? '<text x="200" y="' + (y1 + 10 + s2) + '" font-size="' + s2 + '">' + esc(d.line2) + '</text>' : '') + '</g>';
  }
  // The hat's patch artwork, centred on the patch (radius about 116 in the 1600-pixel hat picture).
  function patchArt(d) {
    var thread = INKS[d.thread] || INKS.forest, sans = "Figtree, 'Helvetica Neue', sans-serif";
    // pinecrest-script.png: the word "Pinecrest" in Pinyon Script, Forest ink.
    if (d.kind === 'logo' && d.logo === 'pinecrest-script.png') return '<text y="22" font-size="92" text-anchor="middle" textLength="250" lengthAdjust="spacingAndGlyphs" font-family="\'Pinyon Script\', cursive" fill="' + INKS.forest + '">Pinecrest</text>';
    if (d.kind === 'logo') return '<g transform="scale(1.42)">' + SAMPLE_LOGO + '</g>';
    if (d.kind === 'monogram') {
      var size = d.mono.length > 2 ? 64 : 84;
      return '<text y="' + Math.round(size * 0.36) + '" font-size="' + size + '" font-weight="700" letter-spacing="2" text-anchor="middle" font-family="' + sans + '" fill="' + thread + '">' + esc(d.mono) + '</text>';
    }
    return '<g text-anchor="middle" font-family="' + sans + '" font-weight="700" letter-spacing="3" fill="' + thread + '">' +
      (d.line2 ? '<text y="-6" font-size="34">' + esc(d.line1) + '</text><text y="34" font-size="34">' + esc(d.line2) + '</text>'
        : '<text y="10" font-size="' + Math.min(36, Math.round(170 / (d.line1.length * 0.68))) + '">' + esc(d.line1) + '</text>') + '</g>';
  }
  var uid = 0;
  function thumb(d) {
    var cls = 'thumb', label = esc(productName(d) + ', design ' + d.code);
    if (d.product === 'hat') {
      // The Forest rope hat seen from the front, with its round off-white patch. A rectangle patch (2.68 in wide,
      // 0.7 as tall, as on the hat page) first covers the round one with the crown's own shading.
      var id = d.code + '-' + (++uid);
      var rect = d.shape === 'Rectangle' ? '<defs><linearGradient id="crown-' + id + '" x1="0" y1="0" x2="0.25" y2="1">' +
          '<stop offset="0" stop-color="#36614A"/><stop offset="1" stop-color="#1E4430"/></linearGradient>' +
          '<filter id="soft-' + id + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>' +
          '<filter id="lift-' + id + '" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.35"/></filter></defs>' +
          '<circle cx="800" cy="847" r="124" fill="url(#crown-' + id + ')" filter="url(#soft-' + id + ')"/>' +
          '<rect x="642" y="736" width="316" height="221" rx="30" fill="#F4F2EC" filter="url(#lift-' + id + ')"/>' : '';
      return '<span class="' + cls + '" role="img" aria-label="' + label + '"><svg viewBox="238 296 1120 1120" aria-hidden="true">' +
        '<image href="../a-clean/img/hat-front-blank.webp" width="1600" height="1600"/>' + rect +
        '<g transform="translate(800 847)">' + patchArt(d) + '</g></svg></span>';
    }
    return '<span class="' + cls + '" role="img" aria-label="' + label + '"><svg viewBox="6 6 388 388" aria-hidden="true">' +
      '<image href="../shared/ball.webp" width="400" height="400"/>' +
      '<g style="mix-blend-mode: multiply">' + ballPrint(d) + '</g></svg></span>';
  }

  // ---- An order's story: its stage moves (who and when) and Chuck's notes ----
  var ROUTE = ['received', 'vendor', 'production', 'shipped'];
  var NOTES = {
    1039: [{ by: 'Chuck', at: '2026-09-23 09:18', text: 'Dana asked us to wait: the club may switch the thread from navy to white.' }],
    1042: [{ by: 'Chuck', at: '2026-09-26 09:35', text: 'Vendor confirmed they ship on Oct 3.' }]
  };
  // A working-hours time part of the way between two moments, so earlier moves read naturally.
  function between(start, end, f, seed) {
    var t = new Date(start.getTime() + (end - start) * f);
    var d = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 9 + seed % 4, (seed * 13) % 60);
    return d > start && d < end ? d : t;
  }
  // Every stage the order entered, oldest first: { stage, at (Date), by }.
  function stageTrail(o) {
    var target = o.stage === 'hold' ? (o.heldFrom || 'received') : o.stage;
    var idx = ROUTE.indexOf(target), start = at(o.placed), end = at(o.since), before = o.stage === 'hold' ? idx : idx - 1;
    var trail = [{ stage: 'received', at: start, by: 'Shopify' }];
    for (var i = 1; i <= idx; i++) {
      var t = o.stage !== 'hold' && i === idx ? end : between(start, end, i / (before + 1), o.no + i);
      trail.push({ stage: ROUTE[i], at: t, by: ROUTE[i] === 'shipped' ? 'Shopify' : 'Chuck' });
    }
    if (o.stage === 'hold') trail.push({ stage: 'hold', at: end, by: 'Chuck' });
    return trail;
  }

  // ---- A design's specification in words, as the vendor needs it ----
  var FONT_NAMES = { classic: 'Classic', block: 'Block', script: 'Script', clean: 'Clean' };
  var INK_NAMES = { black: 'Black', navy: 'Navy', oxblood: 'Oxblood', red: 'Red', green: 'Green', gold: 'Gold', forest: 'Forest' };
  function specs(d) {
    var q = function (s) { return '“' + s + '”'; }, out = [];
    if (d.product === 'hat') {
      out.push(['Hat', d.hat], ['Rope', d.rope], ['Patch', d.shape + ', ' + (d.material === 'PVC' ? 'rubber (PVC)' : 'embroidered')], ['Patch color', d.patch]);
      if (d.kind === 'logo') out.push(['Logo', d.logo]);
      else if (d.kind === 'monogram') out.push(['Monogram', q(d.mono)], ['Thread', INK_NAMES[d.thread]]);
      else out.push(['Text', q(d.line1 + (d.line2 ? ' / ' + d.line2 : ''))], ['Thread', INK_NAMES[d.thread]]);
      return out;
    }
    out.push(['Ball', '[Ball model]']);
    if (d.kind === 'logo') out.push(['Print', 'Logo, in its own colors'], ['Logo', d.logo]);
    else if (d.kind === 'monogram') out.push(['Print', 'Monogram ' + q(d.mono)], ['Lettering', FONT_NAMES[d.font]], ['Ink', INK_NAMES[d.color]]);
    else out.push(['Print', q(d.line1) + (d.line2 ? ', ' + q(d.line2) : '')], ['Lettering', FONT_NAMES[d.font]], ['Ink', INK_NAMES[d.color]]);
    return out;
  }

  // ---- Production facts the sheet needs: patch sizes (measured from the model, as on the hat page), the color limit of
  //      each patch material, and the inks in each sample logo ----
  var PATCH_SIZES = { Round: { w: 1.96, h: 1.96 }, Square: { w: 1.97, h: 1.81 }, Rectangle: { w: 2.68, h: 1.87 } };
  var COLOR_LIMITS = { Embroidered: 8, PVC: 6 };
  var LOGO_COLORS = { 'pinecrest-logo.jpg': [['Navy', '#1F2E55']], 'pinecrest-script.png': [['Forest', '#1F4A36']] };
  var FONT_FILES = { classic: 'Marcellus', block: 'Alfa Slab One', script: 'Pinyon Script', clean: 'Figtree' };

  // ---- Large product pictures: the hat renders the buyer pages use where they exist, otherwise the drawn product ----
  var RENDERS = { 'HGS-10423': '../a-clean/img/hat-3d-still.webp', 'HGS-10431': '../a-clean/img/hat-hgs-10431.webp' };
  function picture(d) {
    if (RENDERS[d.code]) return '<img class="picture" src="' + RENDERS[d.code] + '" alt="' + esc(productName(d) + ', design ' + d.code) + '">';
    return thumb(d).replace('class="thumb"', 'class="thumb picture"');
  }

  // ---- Original artwork: the sample logos are drawn in code, so their files are made on request ----
  function artworkFile(name, done) {
    var c = document.createElement('canvas'), g = c.getContext('2d');
    if (name === 'pinecrest-script.png') {
      document.fonts.load("200px 'Pinyon Script'").then(function () {
        c.width = 1600; c.height = 600;
        g.fillStyle = INKS.forest; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = "240px 'Pinyon Script'";
        g.fillText('Pinecrest', 800, 300);
        c.toBlob(function (b) { done(b); }, 'image/png');
      });
      return;
    }
    // pinecrest-logo.jpg: the ring, pine and lettering in navy on white, as on the ball designer.
    document.fonts.load("700 12px Figtree").then(function () {
      c.width = c.height = 1200;
      g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 1200, 1200);
      g.translate(600, 600); g.scale(7.5, 7.5);
      g.strokeStyle = g.fillStyle = '#1F2E55'; g.lineWidth = 4;
      g.beginPath(); g.arc(0, 0, 64, 0, Math.PI * 2); g.stroke();
      g.beginPath(); [[0, -50], [20, -18], [11, -18], [27, 6], [-27, 6], [-11, -18], [-20, -18]].forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); });
      g.closePath(); g.fill(); g.fillRect(-5, 6, 10, 11);
      g.textAlign = 'center'; g.font = '700 12px Figtree, sans-serif'; if ('letterSpacing' in g) g.letterSpacing = '2px'; g.fillText('PINECREST', 0, 36);
      g.font = '400 8px Figtree, sans-serif'; g.fillText('GOLF CLUB', 0, 50);
      c.toBlob(function (b) { done(b); }, 'image/jpeg', 0.95);
    });
  }

  // ---- Icons (20-unit outline icons in the Polaris style) ----
  var ICONS = {
    home: '<path d="M3.5 9.2 10 3.8l6.5 5.4V16a1 1 0 0 1-1 1H12v-4.5H8V17H4.5a1 1 0 0 1-1-1z"/>',
    orders: '<path d="M3.5 11.5 5.3 4.8a1 1 0 0 1 1-.8h7.4a1 1 0 0 1 1 .8l1.8 6.7V15a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 15z"/><path d="M3.5 11.5H7l1 1.75h4l1-1.75h3.5"/>',
    products: '<path d="M3.5 4.5v5l7 7 6-6-7-7h-5a1 1 0 0 0-1 1z"/><circle cx="7" cy="7" r="1"/>',
    customers: '<circle cx="10" cy="7" r="3"/><path d="M4.5 16.5c.7-2.8 2.9-4.5 5.5-4.5s4.8 1.7 5.5 4.5"/>',
    content: '<path d="M5 3.5h6.5L15 7v9.5H5z"/><path d="M11.5 3.5V7H15M7.5 10.5h5M7.5 13.5h3"/>',
    finance: '<path d="M3 8 10 4l7 4M4.5 8.5v6M8.2 8.5v6M11.8 8.5v6M15.5 8.5v6M3 16.5h14"/>',
    analytics: '<path d="M4.5 16V11M8.2 16V6.5M11.8 16V9.5M15.5 16V4"/>',
    marketing: '<circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="3.5"/><circle cx="10" cy="10" r=".6"/>',
    discounts: '<path d="M10 2.8l1.9 1.4 2.3-.1.7 2.2 1.9 1.4-.7 2.3.7 2.3-1.9 1.4-.7 2.2-2.3-.1L10 17.2l-1.9-1.4-2.3.1-.7-2.2-1.9-1.4.7-2.3-.7-2.3 1.9-1.4.7-2.2 2.3.1z"/><path d="M7.8 12.2l4.4-4.4"/><circle cx="8" cy="8" r=".4"/><circle cx="12" cy="12" r=".4"/>',
    store: '<path d="M3.5 8 4.6 4h10.8l1.1 4"/><path d="M3.5 8a2.15 2 0 0 0 4.3 0 2.2 2 0 0 0 4.4 0 2.15 2 0 0 0 4.3 0"/><path d="M4.5 10v6.5h11V10M8.5 16.5V13h3v3.5"/>',
    settings: '<path d="M17.03 8.43v3.14l-1.85.56.9 1.73-2.22 2.22-1.7-.91-.56 1.86H8.43l-.56-1.85-1.73.9-2.22-2.22.91-1.7-1.86-.56V8.43l1.85-.56-.9-1.73 2.22-2.22 1.7.91.56-1.86h3.14l.56 1.85 1.73-.9 2.22 2.22-.91 1.7z"/><circle cx="10" cy="10" r="2.4"/>',
    search: '<circle cx="8.75" cy="8.75" r="5.25"/><path d="m12.5 12.5 4 4"/>',
    bell: '<path d="M5.5 13.5V9a4.5 4.5 0 0 1 9 0v4.5l1.5 2h-12z"/><path d="M8.3 17.5a1.9 1.9 0 0 0 3.4 0"/>',
    chevron: '<path d="m8 5.5 4.5 4.5L8 14.5"/>',
    arrow: '<path d="M4.5 10h11M11 5.5l4.5 4.5-4.5 4.5"/>',
    check: '<circle cx="10" cy="10" r="7"/><path d="m7 10.2 2 2 4-4.4"/>',
    info: '<circle cx="10" cy="10" r="7"/><path d="M10 9v4.5"/><circle cx="10" cy="6.6" r=".35"/>',
    email: '<rect x="3" y="4.5" width="14" height="11" rx="1.5"/><path d="m3.5 5.5 6.5 5 6.5-5"/>',
    pin: '<path d="M12.5 3.5 16.5 7.5l-2.4 1-2.6 2.6.2 3.4-1.2 1.2-6.3-6.3 1.2-1.2 3.4.2 2.6-2.6z"/><path d="m6.7 13.3-3.2 3.2"/>',
    more: '<circle cx="5" cy="10" r=".6"/><circle cx="10" cy="10" r=".6"/><circle cx="15" cy="10" r=".6"/>',
    clock: '<circle cx="10" cy="10" r="6.5"/><path d="M10 6.5V10l2.5 1.5"/>',
    close: '<path d="m5.5 5.5 9 9M14.5 5.5l-9 9"/>',
    back: '<path d="M15.5 10h-11M9 5.5 4.5 10 9 14.5"/>',
    prev: '<path d="m12 5.5-4.5 4.5 4.5 4.5"/>',
    download: '<path d="M10 3.5v9M6 8.5l4 4 4-4M4 16.5h12"/>',
    sheet: '<path d="M5 3.5h7l3 3v10H5z"/><path d="M12 3.5v3h3M7.5 10h5M7.5 13h5"/>',
    external: '<path d="M11 4.5h4.5V9M15.5 4.5 9 11M13.5 12v3.5h-9v-9H8"/>',
    kanban: '<rect x="3" y="3.5" width="4" height="13" rx="1"/><rect x="8.5" y="3.5" width="4" height="9" rx="1"/><rect x="14" y="3.5" width="3" height="6" rx="1"/>',
    list: '<path d="M7 5.5h10M7 10h10M7 14.5h10"/><circle cx="3.8" cy="5.5" r=".4"/><circle cx="3.8" cy="10" r=".4"/><circle cx="3.8" cy="14.5" r=".4"/>',
    truck: '<path d="M2.5 5.5h9v8h-9zM11.5 8.5h3.2l2.8 2.8v2.2h-6z"/><circle cx="6" cy="14.5" r="1.5"/><circle cx="14" cy="14.5" r="1.5"/>',
    inbox: '<path d="M3.5 11.5 5.3 4.8a1 1 0 0 1 1-.8h7.4a1 1 0 0 1 1 .8l1.8 6.7V15a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 15z"/><path d="M3.5 11.5H7l1 1.75h4l1-1.75h3.5"/>',
    person: '<circle cx="10" cy="7" r="3"/><path d="M4.5 16.5c.7-2.8 2.9-4.5 5.5-4.5s4.8 1.7 5.5 4.5"/>'
  };
  function icon(name, size) {
    var s = size || 20;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 20 20" aria-hidden="true">' + ICONS[name] + '</svg>';
  }
  function badge(text, tone, ic) { return '<span class="badge ' + (tone || '') + '">' + (ic ? icon(ic, 14) : '') + esc(text) + '</span>'; }

  // ---- The admin frame ----
  var APP_PAGES = [
    { id: 'board', label: 'Production board', href: 'board.html' },
    { id: 'buyers', label: 'Buyers', href: 'buyers.html' },
    { id: 'scorecard', label: 'Scorecard', href: 'scorecard.html' }
  ];
  function frame(pageId) {
    var page = document.getElementById('page');
    if (!page) return;
    var unfulfilled = ORDERS.filter(function (o) { return o.stage !== 'shipped'; }).length;
    // pageId 'shopify-order' is Shopify's own order page (SH-6, mocked for UI-54): Orders is open and the app isn't.
    var inShopify = pageId === 'shopify-order';
    var shop = function (ic, label, extra, sub) {   // Shopify's own sections: not part of the prototype
      return '<li><a class="nav-item" href="#" data-shopify title="Shopify’s own page (not part of this prototype)"' + (sub ? ' aria-current="page"' : '') + '>' + icon(ic) + '<span>' + label + '</span>' + (extra || '') + '</a>' +
        (sub ? '<ul class="nav-sub">' + sub.map(function (t) { return '<li><a href="#" data-shopify>' + t + '</a></li>'; }).join('') + '</ul>' : '') + '</li>';
    };
    var top = document.createElement('header');
    top.className = 'topbar';
    top.innerHTML =
      '<a class="topbar-logo" href="#" data-shopify aria-label="Shopify admin home">' +
        '<svg viewBox="0 0 22 24" aria-hidden="true"><path fill="#95BF47" d="M3.2 6.6 17.9 5l1.9 16.3L2 23.2z"/><path fill="#5E8E3E" d="M17.9 5 20.9 6l.9 15.2-2 .1z"/>' +
        '<path fill="none" stroke="#95BF47" stroke-width="1.6" stroke-linecap="round" d="M7.6 7.4c-.1-3 1.3-5.4 3.4-5.6 2.1-.2 3.7 2.1 4 5"/>' +
        '<path fill="#fff" d="M12.9 11.3c-.5-.3-1.2-.4-1.9-.4-1.5.1-2.6 1-2.5 2.2.1 1.8 3.2 1.7 3.3 2.8 0 .5-.4.9-1 .9-.8.1-1.7-.4-1.7-.4l-.5 1.4s.8.6 2.3.5c1.6-.1 2.7-1.1 2.6-2.6-.1-2-3.1-1.9-3.2-2.8 0-.3.2-.7 1-.8.6 0 1.3.2 1.3.2z"/></svg>' +
        '<span>shopify</span></a>' +
      '<label class="topbar-search">' + icon('search', 18) + '<input type="search" placeholder="Search" aria-label="Search the admin"><kbd><span>⌘</span><span>K</span></kbd></label>' +
      '<div class="topbar-end"><button type="button" class="topbar-icon" aria-label="Notifications">' + icon('bell') + '</button>' +
        '<button type="button" class="topbar-store"><span class="avatar avatar-store" aria-hidden="true">HG</span>Honors Golf Supply</button></div>';
    var shell = document.createElement('div');
    shell.className = 'frame';
    shell.innerHTML =
      '<nav class="sidenav" aria-label="Admin">' +
        '<ul class="nav-list">' + shop('home', 'Home') + shop('orders', 'Orders', '<span class="nav-count">' + unfulfilled + '</span>', inShopify ? ['Drafts', 'Abandoned checkouts'] : null) + shop('products', 'Products') +
          shop('customers', 'Customers') + shop('content', 'Content') + shop('finance', 'Finance') + shop('analytics', 'Analytics') +
          shop('marketing', 'Marketing') + shop('discounts', 'Discounts') + '</ul>' +
        '<div class="nav-head">Sales channels' + icon('chevron', 16) + '</div>' +
        '<ul class="nav-list">' + shop('store', 'Online Store') + '</ul>' +
        '<div class="nav-head">Apps' + icon('chevron', 16) + '</div>' +
        '<ul class="nav-list"><li><a class="nav-item" href="index.html"' + (pageId === 'overview' ? ' aria-current="page"' : '') + '><span class="app-icon" aria-hidden="true">H</span><span>Honors</span></a>' +
          (inShopify ? '' : '<ul class="nav-sub">' + APP_PAGES.map(function (p) {
            return '<li><a href="' + p.href + '"' + (p.id === pageId ? ' aria-current="page"' : '') + '>' + p.label + '</a></li>';
          }).join('') + '</ul>') + '</li></ul>' +
        '<ul class="nav-list nav-foot">' + shop('settings', 'Settings') + '</ul>' +
      '</nav>' +
      '<main class="main">' + (inShopify ? '' :
        '<div class="app-bar"><span class="app-icon" aria-hidden="true">H</span><span class="app-bar-name">Honors</span>' +
          '<div class="app-bar-end"><button type="button" class="icon-btn" aria-label="Pin to your navigation">' + icon('pin') + '</button>' +
          '<button type="button" class="icon-btn" aria-label="More actions">' + icon('more') + '</button></div></div>') +
      '</main>';
    page.parentNode.insertBefore(top, page);
    page.parentNode.insertBefore(shell, page);
    shell.querySelector('.main').appendChild(page);
    // Shopify's own sections aren't part of the prototype: clicking them does nothing.
    document.addEventListener('click', function (e) { if (e.target.closest('[data-shopify]')) e.preventDefault(); });
    // A row in an index table opens its page, unless a link or button inside it was clicked.
    document.addEventListener('click', function (e) {
      var row = e.target.closest('tr[data-href]');
      if (!row || e.target.closest('a, button')) return;
      location.href = row.getAttribute('data-href');
    });
  }

  var api = {
    PRODUCTS: PRODUCTS, BUYERS: BUYERS, LOGOS: LOGOS, DESIGNS: DESIGNS, ORDERS: ORDERS, STAGES: STAGES, NOW: NOW, at: at, tierFor: tierFor, count: count, money: money, when: when, age: age,
    day: day, esc: esc, styleName: styleName, productName: productName, thumb: thumb, icon: icon, badge: badge, frame: frame,
    ROUTE: ROUTE, NOTES: NOTES, stageTrail: stageTrail, specs: specs, picture: picture, artworkFile: artworkFile,
    RENDERS: RENDERS, PATCH_SIZES: PATCH_SIZES, COLOR_LIMITS: COLOR_LIMITS, LOGO_COLORS: LOGO_COLORS, FONT_FILES: FONT_FILES,
    FONT_NAMES: FONT_NAMES, INK_NAMES: INK_NAMES, INKS: INKS, patchArt: patchArt, ballPrint: ballPrint
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  root.HonorsAdmin = api;
  frame(document.body.getAttribute('data-admin-page'));
})(this);
