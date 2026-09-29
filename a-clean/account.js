// Buyer account pages for look A (UI-40 overview, UI-41 My designs, then UI-42 to UI-44; spec C-10): our pages, not Shopify's customer account pages (D-28).
// One sample account drawn from one set of data, so every account page tells the same story. Prices are examples (OQ-3).
// The account pages always show this demo account, never an empty view (owner's note on UI-40; sample data D-63).
(function () {
  'use strict';

  var ACCOUNT = { name: 'Alex Morgan', first: 'Alex', club: 'Pinecrest Golf Club', email: 'alex@pinecrestgolf.example' };

  // Newest first. A design keeps its code and updates until it's ordered (D-29).
  var DESIGNS = [
    { code: 'HGS-10431', product: 'hat', created: '2026-09-26', order: '1047', preview: 'img/hat-hgs-10431.webp', logo: 'pinecrest-script.png',
      summary: 'Forest hat, white rope. Rectangle rubber (PVC) patch with pinecrest-script.png.' },
    { code: 'HGS-10423', product: 'hat', created: '2026-09-16', order: '1042', preview: 'img/hat-3d-still.webp', logo: 'pinecrest-logo.jpg',
      summary: 'Forest hat, white rope. Round embroidered patch with pinecrest-logo.jpg.' },
    { code: 'HGS-10412', product: 'ball', kind: 'text', line1: 'Pinecrest Club', line2: 'Club Championship', font: 'classic', color: 'navy', created: '2026-09-15' },
    { code: 'HGS-10398', product: 'ball', kind: 'logo', logo: 'pinecrest-logo.jpg', created: '2026-09-12' },
    { code: 'HGS-10377', product: 'ball', kind: 'monogram', mono: 'PGC', font: 'classic', color: 'navy', order: '1036' }
  ];
  // Buyers see three stages only: Received, In production, Shipped (D-31).
  var STAGES = [{ id: 'received', name: 'Received' }, { id: 'production', name: 'In production' }, { id: 'shipped', name: 'Shipped' }];
  // Newest first. The price is what the order was placed at (example prices).
  var ORDERS = [
    { number: '1047', placed: '2026-09-27', design: 'HGS-10431', qty: 24, price: 22, stage: 'received' },
    { number: '1042', placed: '2026-09-18', design: 'HGS-10423', qty: 48, price: 20, stage: 'production' },
    { number: '1036', placed: '2026-09-05', design: 'HGS-10377', qty: 12, price: 49, stage: 'shipped', shipped: '2026-09-15' }
  ];
  // Most recent first, as every designer lists them (C-10).
  var LOGOS = [
    { name: 'pinecrest-script.png', art: 'script', uploaded: '2026-09-20' },
    { name: 'pinecrest-logo.jpg', art: 'ring', uploaded: '2026-09-12' },
    { name: 'pinecrest-crest.svg', art: 'crest', uploaded: '2026-09-02' }
  ];

  function byId(id) { return document.getElementById(id); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function day(iso, withYear) {
    var o = { month: 'short', day: 'numeric', timeZone: 'UTC' }; if (withYear) o.year = 'numeric';
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', o);
  }
  function isHat(d) { return d.product === 'hat'; }
  function designOf(code) { return DESIGNS.filter(function (d) { return d.code === code; })[0]; }
  function usedIn(logoName) { return DESIGNS.filter(function (d) { return d.logo === logoName; }); }

  // ---- Pictures: the real product with the print on it, as the cart draws them ----
  var FONTS = { classic: "'Marcellus', Georgia, serif", block: "'Alfa Slab One', Georgia, serif", script: "'Pinyon Script', cursive", clean: "'Figtree', 'Helvetica Neue', sans-serif" };
  var INKS = { black: '#1A1B1F', navy: '#1F2E55', oxblood: '#6B1E2A', red: '#C8262B', green: '#1E5B3F', gold: '#9A7128' };
  // The sample logo (pinecrest-logo.jpg): the same art as the designers draw, centred on 0,0.
  var RING = '<circle r="64" fill="none" stroke="#1F2E55" stroke-width="4"/>' +
    '<g fill="#1F2E55"><polygon points="0,-50 20,-18 11,-18 27,6 -27,6 -11,-18 -20,-18"/><rect x="-5" y="6" width="10" height="11"/>' +
    '<text y="36" font-size="12" font-weight="700" letter-spacing="2" text-anchor="middle" font-family="Figtree, sans-serif">PINECREST</text>' +
    '<text y="50" font-size="8" letter-spacing="2" text-anchor="middle" font-family="Figtree, sans-serif">GOLF CLUB</text></g>';
  function fitSize(text, max) { var len = Math.max(text.length, 1); return Math.round(Math.min(max, 250 / (len * 0.56))); }
  function printSvg(d) {
    if (d.kind === 'logo') return '<g transform="translate(200 196)">' + RING + '</g>';
    var ink = INKS[d.color] || INKS.navy, font = esc(FONTS[d.font] || FONTS.classic);
    if (d.kind === 'monogram') return '<text x="200" y="228" font-size="92" letter-spacing="4" text-anchor="middle" font-family="' + font + '" fill="' + ink + '">' + esc(d.mono) + '</text>';
    var s1 = fitSize(d.line1 || '', 46), s2 = d.line2 ? Math.min(Math.round(s1 * 1.25), fitSize(d.line2, 40)) : 0;
    var y1 = Math.round(196 - (s1 + (d.line2 ? 10 + s2 : 0)) / 2 + s1 * 0.8);
    return '<g text-anchor="middle" font-family="' + font + '" fill="' + ink + '">' +
      '<text x="200" y="' + y1 + '" font-size="' + s1 + '">' + esc(d.line1 || '') + '</text>' +
      (d.line2 ? '<text x="200" y="' + (y1 + 10 + s2) + '" font-size="' + s2 + '">' + esc(d.line2) + '</text>' : '') + '</g>';
  }
  // The ball render (D-46) with the print laid on in multiply, so the ink picks up the dimples; the hat is its own picture.
  function thumb(d) {
    if (isHat(d)) return '<img class="acct-hat" src="' + esc(d.preview) + '" alt="">';
    return '<div class="ball acct-ball"><svg class="ball-svg" viewBox="0 0 400 400" aria-hidden="true">' +
      '<image href="../shared/ball.webp" width="400" height="400"/>' +
      '<g style="mix-blend-mode: multiply">' + printSvg(d) + '</g></svg></div>';
  }
  // A saved logo as its file looks: the JPG on its white ground, the PNG and SVG on a clear one.
  function logoArt(l) {
    if (l.art === 'crest') return '<svg class="logo-art is-svg" viewBox="0 0 120 140" aria-hidden="true">' +
      '<path d="M10 8h100v56c0 36-22 57-50 70C32 121 10 100 10 64V8z" fill="#1F4A36"/>' +
      '<path d="M17 15h86v49c0 31-18 49-43 61-25-12-43-30-43-61V15z" fill="none" stroke="#FFFFFF" stroke-width="2"/>' +
      '<text x="60" y="80" text-anchor="middle" font-family="\'Marcellus\', Georgia, serif" font-size="34" letter-spacing="2" fill="#FFFFFF">PGC</text></svg>';
    if (l.art === 'ring') return '<svg class="logo-art is-jpg" viewBox="-80 -80 160 160" aria-hidden="true"><rect x="-80" y="-80" width="160" height="160" fill="#FFFFFF"/>' + RING + '</svg>';
    return '<svg class="logo-art is-png" viewBox="0 0 320 130" aria-hidden="true"><text x="160" y="86" text-anchor="middle" font-family="\'Pinyon Script\', cursive" font-size="84" fill="#1F4A36">Pinecrest</text></svg>';
  }
  function productName(d) { return isHat(d) ? 'Custom rope hats' : 'Custom golf balls'; }
  // The same wording as the cart's lines.
  var INK_NAMES = { black: 'black', navy: 'navy', oxblood: 'oxblood', red: 'red', green: 'green', gold: 'gold' };
  var FONT_NAMES = { classic: 'Classic', block: 'Block', script: 'Script', clean: 'Clean' };
  function describe(d) {
    if (isHat(d)) return d.summary;
    if (d.kind === 'logo') return 'Your logo (' + d.logo + '), printed in its own colors.';
    var how = ' in ' + (INK_NAMES[d.color] || 'navy') + ', ' + (FONT_NAMES[d.font] || 'Classic') + ' lettering.';
    if (d.kind === 'monogram') return 'Monogram “' + d.mono + '”' + how;
    return '“' + d.line1 + (d.line2 ? ' / ' + d.line2 : '') + '”' + how;
  }
  function orderOf(d) { return ORDERS.filter(function (o) { return o.number === d.order; })[0]; }
  // The designer in its signed-in view, on the design's own tab. The prototype designers can't open a given design.
  function designerHref(d) {
    var page = isHat(d) ? 'hat.html' : 'index.html';
    return page + '?buyer=signed-in' + (d.kind === 'logo' && !isHat(d) ? '&tab=logo' : d.kind === 'monogram' ? '&tab=monogram' : '');
  }
  // The flag on the pin: the finish of a hole, and the sign of an ordered design.
  var FLAG = '<svg class="flag-ic" width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d="M2.5 1v14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M3 1.5l9 3.2L3 8z" fill="currentColor"/></svg>';
  // The flagstick at the end of each hole: tall enough that the flag flies above a ball in the cup.
  var PIN = '<svg class="pin-ic" width="20" height="40" viewBox="0 0 20 40" aria-hidden="true"><path d="M2.5 2v38" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3.2 2l14.5 5.5L3.2 13z" fill="currentColor"/></svg>';
  function countOf(d, qty) { return isHat(d) ? qty + ' rope hats' : qty + ' dozen golf balls'; }

  // ---- Orders, drawn as a hole: tee (Received), fairway (In production), flag (Shipped), the ball where the order is ----
  var AT = { received: 0, production: 50, shipped: 100 };
  function holeHtml(o) {
    var at = STAGES.map(function (s) { return s.id; }).indexOf(o.stage);
    return '<div class="hole" style="--at: ' + AT[o.stage] + '%" data-stage="' + o.stage + '">' +
      '<div class="hole-line" aria-hidden="true"><span class="hole-mid' + (at >= 1 ? ' is-played' : '') + '"></span>' +
        '<span class="hole-pin">' + PIN + '</span><img class="hole-ball" src="../shared/ball.webp" alt=""></div>' +
      '<ol class="hole-stages" aria-label="Order stage: ' + STAGES[at].name + '">' + STAGES.map(function (s, i) {
        return '<li' + (i === at ? ' class="is-current" aria-current="step"' : i < at ? ' class="is-done"' : '') + '>' + s.name + '</li>';
      }).join('') + '</ol></div>';
  }
  function orderLane(o) {
    var d = designOf(o.design) || { product: 'ball' };
    var when = o.shipped ? 'Shipped ' + day(o.shipped, true) : 'Placed ' + day(o.placed, true);
    return '<li class="lane">' +
      '<span class="lane-pic">' + thumb(d) + '</span>' +
      '<div class="lane-main">' +
        '<div class="lane-top"><h3 class="lane-num"><a class="lane-link" href="account-orders.html#order-' + esc(o.number) + '">#' + esc(o.number) + '</a></h3>' +
          '<p class="lane-what">' + countOf(d, o.qty) + ', design ' + esc(o.design) + '</p></div>' +
        holeHtml(o) +
      '</div>' +
      '<div class="lane-side"><p class="lane-total">' + money(o.qty * o.price) + '</p><p class="lane-date">' + when + '</p></div></li>';
  }

  // ---- The overview's shelf: the chosen designs standing on one stage ----
  function shelfItem(d) {
    var status = d.order ? '<span class="shelf-status is-ordered">' + FLAG + 'Ordered in #' + esc(d.order) + '</span>'
      : '<span class="shelf-status">Saved ' + day(d.created, true) + '</span>';
    return '<li class="shelf-item"><a class="shelf-link" href="account-designs.html#' + esc(d.code) + '">' +
      '<span class="shelf-pic">' + thumb(d) + '</span>' +
      '<span class="shelf-name">' + productName(d) + '</span>' +
      '<span class="shelf-code">Design ' + esc(d.code) + '</span>' + status + '</a></li>';
  }
  // ---- The club's logos, each as its file looks ----
  function logoItem(l) {
    var n = usedIn(l.name).length;
    return '<li class="logo-item"><a class="logo-link" href="account-logos.html">' +
      '<span class="logo-pic">' + logoArt(l) + '</span>' +
      '<span class="logo-name">' + esc(l.name) + '</span>' +
      '<span class="logo-meta">Uploaded ' + day(l.uploaded, true) + '. ' + (n ? 'Used in ' + n + (n === 1 ? ' design.' : ' designs.') : 'Not used yet.') + '</span></a></li>';
  }

  // ---- My designs (UI-41): a gallery of every design. Designs not yet ordered can be edited and keep their number
  // (D-29); an ordered design stays as it was made, so Duplicate & edit makes a new one from it (C-2). ----
  function designTile(d) {
    var o = orderOf(d), code = esc(d.code);
    var tag = d.order ? '<span class="tile-tag is-ordered">' + FLAG + 'Ordered</span>' : '<span class="tile-tag">Not ordered yet</span>';
    var meta = d.order
      ? countOf(d, o ? o.qty : 0) + ' in order <a href="account-orders.html#order-' + esc(d.order) + '">#' + esc(d.order) + '</a>, placed ' + (o ? day(o.placed, true) : '') + '.'
      : 'Saved ' + day(d.created, true) + '. You can still change it, and it keeps its number.';
    return '<li class="tile" id="' + code + '">' +
      '<div class="tile-pic">' + tag + thumb(d) + '</div>' +
      '<h2 class="tile-name">' + productName(d) + '</h2>' +
      '<p class="tile-code">Design ' + code + '</p>' +
      '<p class="tile-desc">' + esc(describe(d)) + '</p>' +
      '<p class="tile-meta">' + meta + '</p>' +
      '<div class="tile-actions">' +
        '<button type="button" class="btn btn-primary" data-act="reorder" aria-label="Reorder design ' + code + '">Reorder</button>' +
        '<div class="tile-more">' +
          (d.order ? '' : '<a class="text-btn" href="' + designerHref(d) + '" aria-label="Edit design ' + code + '">Edit design</a>') +
          '<a class="text-btn" href="' + designerHref(d) + '" aria-label="Duplicate and edit design ' + code + '">Duplicate &amp; edit</a>' +
        '</div></div></li>';
  }

  // ---- My orders (UI-44; C-10, D-31): one short list, orders in progress first, then shipped (owner's note on the first
  // version). Each order is a compact row that opens in place on its hole (the overview's own tracker), what it is, and
  // the way to its receipt and tracking on Shopify's order status page (SH-3; Shopify's page, not built here: D-88). ----
  function stageNow(o, d) {
    if (o.stage === 'received') return 'Honors has your order. It moves to In production when making starts.';
    if (o.stage === 'production') return (isHat(d) ? 'Your hats are being made.' : 'Your golf balls are being printed.') + ' When the order ships, tracking is on its status page.';
    return 'Shipped ' + day(o.shipped, true) + '. Tracking is on the order status page.';
  }
  // The hole drawn small for a compact row: the same tee, fairway and flag, the ball where the order is (the words carry
  // the stage; the drawing is decorative).
  var MINI_PIN = '<svg class="od-mini-pin" width="12" height="26" viewBox="0 0 12 26" aria-hidden="true"><path d="M1.5 1.5v24" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M2.1 1.5l8.6 3.3-8.6 3.3z" fill="currentColor"/></svg>';
  var CHEVRON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  function stageMini(o) {
    return '<span class="od-mini" style="--at: ' + AT[o.stage] + '%" aria-hidden="true"><span class="od-mini-line">' +
      '<span class="od-mini-mid' + (o.stage !== 'received' ? ' is-played' : '') + '"></span>' +
      '<img class="od-mini-ball" src="../shared/ball.webp" alt=""></span>' + MINI_PIN + '</span>';
  }
  // One order: a compact row (picture, number, what, stage, total) that opens in place on where it is (the overview's
  // own hole tracker) and what's in it, with the way to its receipt and tracking.
  function orderRow(o) {
    var d = designOf(o.design) || { product: 'ball' }, n = esc(o.number), code = esc(o.design), t = money(o.price).replace('.00', '');
    var stage = STAGES.filter(function (s) { return s.id === o.stage; })[0].name;
    var when = o.shipped ? 'Shipped ' + day(o.shipped, true) : 'Placed ' + day(o.placed, true);
    return '<li class="od" id="order-' + n + '">' +
      '<h3 class="od-h"><button type="button" class="od-row" id="od-row-' + n + '" aria-expanded="false" aria-controls="od-more-' + n + '">' +
        '<span class="od-pic">' + thumb(d) + '</span>' +
        '<span class="od-id"><span class="od-num">#' + n + '</span><span class="od-what">' + countOf(d, o.qty) + '</span></span>' +
        '<span class="od-stage"><span class="od-stage-name">' + stage + '</span>' + stageMini(o) + '</span>' +
        '<span class="od-sum"><span class="od-total">' + money(o.qty * o.price) + '</span><span class="od-when">' + when + '</span></span>' +
        '<span class="od-chev">' + CHEVRON + '</span>' +
      '</button></h3>' +
      '<div class="od-more" id="od-more-' + n + '" role="region" aria-labelledby="od-row-' + n + '" hidden>' +
        '<div class="od-where">' + holeHtml(o) + '<p class="od-now">' + stageNow(o, d) + '</p>' +
          '<a class="text-link od-status" href="#" data-status="' + n + '">Order status and receipt</a></div>' +
        '<div class="od-design"><p class="od-name">' + productName(d) + '</p>' +
          '<p class="od-code"><a href="account-designs.html#' + code + '">Design ' + code + '</a></p>' +
          '<p class="od-desc">' + esc(describe(d)) + '</p>' +
          '<p class="od-qty">' + countOf(d, o.qty) + ' at ' + t + (isHat(d) ? ' each' : ' a dozen') + '</p></div>' +
      '</div></li>';
  }
  // Open one order at a time, so the page stays one short list; arriving at account-orders.html#order-… (from the
  // overview's rows or a design on Designs) opens that order.
  function initOrders() {
    var now = ORDERS.filter(function (o) { return o.stage !== 'shipped'; }), shipped = ORDERS.filter(function (o) { return o.stage === 'shipped'; });
    fill('orders-now', now.map(orderRow).join(''));
    fill('orders-shipped', shipped.map(orderRow).join(''));
    $$('[data-od-count]').forEach(function (c) { c.textContent = String(c.getAttribute('data-od-count') === 'now' ? now.length : shipped.length); });
    function setOpen(li, open) {
      li.classList.toggle('is-open', open);
      li.querySelector('.od-row').setAttribute('aria-expanded', String(open));
      li.querySelector('.od-more').hidden = !open;
    }
    function openOnly(li) { $$('.od.is-open').forEach(function (x) { if (x !== li) setOpen(x, false); }); setOpen(li, true); }
    $$('.od-row').forEach(function (b) {
      b.addEventListener('click', function () { var li = b.closest('.od'); if (li.classList.contains('is-open')) setOpen(li, false); else openOnly(li); });
    });
    function fromHash() { var li = /^#order-\d+$/.test(location.hash) && document.querySelector('.od' + location.hash); if (li) openOnly(li); }
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  // ---- Fill the page: the overview (UI-40) runs orders, then designs, then logos (D-66); My designs lists them all ----
  // The overview's shelf shows the logo hat and the logo ball only (owner's choice, D-66).
  var OVERVIEW_DESIGNS = ['HGS-10423', 'HGS-10398'];
  function fill(name, html) { var list = document.querySelector('[data-list="' + name + '"]'); if (list) list.innerHTML = html; }
  fill('orders', ORDERS.slice(0, 3).map(orderLane).join(''));
  fill('designs', OVERVIEW_DESIGNS.map(designOf).map(shelfItem).join(''));
  fill('logos', LOGOS.slice(0, 3).map(logoItem).join(''));
  fill('all-designs', DESIGNS.map(designTile).join(''));
  if (document.querySelector('[data-list="orders-now"]')) initOrders();
  // The receipt and tracking live on Shopify's order status page (SH-3), which the prototype doesn't build (D-88).
  $$('[data-status]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); showToast('In the real store, this opens Shopify’s order status page for #' + a.getAttribute('data-status') + '.'); });
  });
  // The club's mark in the masthead: its own logo, pinecrest-logo.jpg.
  $$('[data-club-mark]').forEach(function (n) { n.innerHTML = '<svg viewBox="-72 -72 144 144" aria-hidden="true">' + RING + '</svg>'; });

  // The counts in the account menu.
  var counts = { designs: DESIGNS.length, logos: LOGOS.length, orders: ORDERS.length };
  $$('[data-count]').forEach(function (n) { n.textContent = String(counts[n.getAttribute('data-count')]); });

  // Sign out goes through Shopify's customer accounts in the real store.
  var toastTimer;
  function showToast(msg) {
    var t = byId('toast'); if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }
  var out = byId('sign-out');
  if (out) out.addEventListener('click', function () { showToast('In the real store, this signs you out and takes you to the home page.'); });

  // ---- Reorder (UI-42): the same design at a chosen quantity, added to the cart (C-10); minimum and price breaks
  // apply (C-3). The prices come from cart.js's own rules (the page reads them in cart.js's export mode, see
  // account-designs.html), so the dialog prices exactly as the cart and its drawer do. If an option of the design is
  // no longer sold, the reorder stops and points to the designer (D-33).
  var RULES = window.HonorsCartRules;
  var reorderButtons = $$('[data-act="reorder"]');
  if (RULES && reorderButtons.length) initReorder();

  function initReorder() {
    var params = new URLSearchParams(location.search);
    // Review state ?state=discontinued: the ball HGS-10377 was printed on is no longer sold.
    var GONE = params.get('state') === 'discontinued'
      ? { 'HGS-10377': 'The ball this design was printed on, [ball model from Chuck’s lineup], is no longer sold, so it can’t be reordered as it is.' } : {};
    var X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var WARN = '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>';
    var dlg = document.createElement('dialog');
    dlg.className = 'ro'; dlg.setAttribute('aria-labelledby', 'ro-title');
    dlg.innerHTML =
      '<div class="ro-box">' +
        '<div class="ro-pic" data-ro="pic"></div>' +
        '<div class="ro-body">' +
          '<button type="button" class="icon-btn ro-close" data-ro="close" aria-label="Close">' + X + '</button>' +
          '<h2 class="ro-title" id="ro-title" data-ro="title"></h2>' +
          '<p class="ro-code" data-ro="code"></p>' +
          '<p class="ro-desc" data-ro="desc"></p>' +
          '<p class="ro-last" data-ro="last"></p>' +
          '<div class="ro-order" data-ro="order">' +
            '<div class="ro-head"><label class="ro-label" for="ro-qty">How many?</label><span class="review-note">Example prices, until Chuck sets them</span></div>' +
            '<div class="ro-qty-row"><div class="stepper ro-stepper" role="group" aria-label="Quantity">' +
              '<button type="button" data-ro="dec">&minus;</button>' +
              '<input id="ro-qty" type="number" inputmode="numeric" min="1" max="9999" step="1" data-ro="qty" aria-describedby="ro-min">' +
              '<button type="button" data-ro="inc">+</button></div>' +
              '<span class="ro-unit" data-ro="unit"></span></div>' +
            '<p class="ro-min" id="ro-min" data-ro="min"></p>' +
            '<div class="ro-breaks" data-ro="breaks">' +
              '<div class="ro-line" aria-hidden="true"><span class="ro-tick" style="left: 33.333%"></span><span class="ro-tick" style="left: 66.667%"></span>' +
                '<img class="ro-ball" src="../shared/ball.webp" alt=""></div>' +
              '<div class="ro-tiers" data-ro="tiers" role="group" aria-label="Price breaks"></div></div>' +
            '<div class="ro-total"><p class="ro-each" data-ro="each"></p><p class="ro-sum" data-ro="sum" aria-live="polite"></p></div>' +
            '<button type="button" class="btn btn-primary ro-add" data-ro="add">Add to cart</button>' +
          '</div>' +
          '<div class="ro-stop" data-ro="stop" hidden>' +
            '<div class="notice ro-notice" role="alert">' + WARN + '<div><p class="ro-stop-title">No longer available</p><p data-ro="stop-what"></p>' +
              '<p data-ro="stop-how"></p></div></div>' +
            '<a class="btn btn-primary" data-ro="stop-link" href="#"></a>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(dlg);
    var q = function (name) { return dlg.querySelector('[data-ro="' + name + '"]'); };
    var cur = null, trigger = null, qty = 0;

    function rules(d) { return RULES.PRODUCTS[isHat(d) ? 'hat' : 'ball']; }
    function unit(d, n) { return isHat(d) ? (n === 1 ? 'hat' : 'hats') : 'dozen'; }
    function each(d, price) { return money(price).replace('.00', '') + (isHat(d) ? ' each' : ' a dozen'); }
    // Where the quantity sits on the line: each price break gets a third; the last one fills at twice its start.
    function pos(d, n) {
      var tiers = rules(d).tiers; if (n < tiers[0].min) return 0;
      var i = 0; tiers.forEach(function (t, k) { if (n >= t.min) i = k; });
      var lo = tiers[i].min, hi = i + 1 < tiers.length ? tiers[i + 1].min : tiers[i].min * 2;
      return (i + Math.min(1, (n - lo) / (hi - lo))) / tiers.length * 100;
    }
    function update() {
      var d = cur, r = rules(d), short = !(qty >= r.min), t = RULES.tierFor(Math.max(qty, r.min), isHat(d) ? 'hat' : 'ball');
      q('qty').value = qty ? String(qty) : '';
      q('unit').textContent = unit(d, qty);
      q('dec').disabled = qty <= r.min;
      q('min').textContent = short ? 'Minimum ' + r.min + ' ' + unit(d, r.min) + ' per design. Add more to reorder.' : 'Minimum ' + r.min + ' ' + unit(d, r.min) + ' per design.';
      q('min').classList.toggle('is-short', short);
      q('breaks').style.setProperty('--at', pos(d, qty || 0).toFixed(2) + '%');
      $$('.ro-tier').forEach(function (b) { b.setAttribute('aria-pressed', String(!short && Number(b.dataset.min) === t.min)); });
      q('each').textContent = short ? 'Choose at least ' + r.min + ' ' + unit(d, r.min) + '.' : qty + ' ' + unit(d, qty) + ' at ' + each(d, t.price);
      q('sum').textContent = short ? '' : money(qty * t.price);
      q('add').disabled = short;
    }
    function setQty(n) { qty = Math.max(0, Math.min(9999, Math.round(n) || 0)); update(); }

    function openFor(d, btn) {
      cur = d; trigger = btn;
      var o = orderOf(d), gone = GONE[d.code];
      q('pic').innerHTML = thumb(d);
      q('title').textContent = isHat(d) ? 'Reorder these hats' : 'Reorder these golf balls';
      q('code').textContent = 'Design ' + d.code;
      // File names stay on one line (they'd otherwise break at their hyphen).
      q('desc').innerHTML = esc(describe(d)).replace(/([\w-]+\.(?:jpg|png|svg))/g, '<span class="ro-file">$1</span>');
      q('last').innerHTML = o ? FLAG + 'Last ordered: ' + countOf(d, o.qty) + ' in #' + esc(o.number) + ', ' + day(o.placed, true) + '.' : '';
      q('last').hidden = !o;
      q('order').hidden = !!gone; q('stop').hidden = !gone;
      if (gone) {
        var name = isHat(d) ? 'hat designer' : 'ball designer';
        q('stop-what').textContent = gone;
        q('stop-how').textContent = 'Open the ' + name + ' to make it again with what’s sold today. It’s saved as a new design with its own number.';
        q('stop-link').textContent = 'Open the ' + name;
        q('stop-link').setAttribute('href', designerHref(d));
      } else {
        q('tiers').innerHTML = rules(d).tiers.map(function (t) {
          return '<button type="button" class="ro-tier" data-min="' + t.min + '" aria-pressed="false"><span class="ro-tier-range">' + esc(t.name) + '</span>' +
            '<span class="ro-tier-price">' + each(d, t.price) + '</span></button>';
        }).join('');
        q('dec').setAttribute('aria-label', isHat(d) ? 'One hat fewer' : 'One dozen fewer');
        q('inc').setAttribute('aria-label', isHat(d) ? 'One hat more' : 'One dozen more');
        setQty(o ? o.qty : rules(d).min);          // the last order's quantity, or the minimum
      }
      // The ball is placed, not slid, when the dialog opens; it glides only when the buyer changes the quantity.
      q('breaks').classList.add('is-placing');
      dlg.showModal();
      requestAnimationFrame(function () { requestAnimationFrame(function () { q('breaks').classList.remove('is-placing'); }); });
      (gone ? q('stop-link') : q('qty')).focus();
    }
    function closeDialog() { if (dlg.open) dlg.close(); if (trigger && document.activeElement !== trigger) trigger.focus(); }

    reorderButtons.forEach(function (b) {
      b.addEventListener('click', function () { var tile = b.closest('[id]'); openFor(designOf(tile && tile.id), b); });
    });
    q('close').addEventListener('click', closeDialog);
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(); });   // Escape
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(); });  // the backdrop
    q('dec').addEventListener('click', function () { setQty(RULES.stepQty(qty, -1, isHat(cur) ? 'hat' : 'ball')); if (q('dec').disabled) q('inc').focus(); });
    q('inc').addEventListener('click', function () { setQty(qty + 1); });
    q('qty').addEventListener('input', function () { qty = Math.max(0, Math.min(9999, parseInt(q('qty').value, 10) || 0)); var v = q('qty').value; update(); q('qty').value = v; });
    q('qty').addEventListener('change', function () { setQty(qty); });
    q('tiers').addEventListener('click', function (e) { var b = e.target.closest('.ro-tier'); if (b) setQty(Number(b.dataset.min)); });

    // Add to cart: the approved cart drawer (cart.js) takes the design and slides in, as it does from the designers.
    q('add').addEventListener('click', function () {
      var d = cur, n = qty, btn = trigger;
      var design = isHat(d) ? { code: d.code, product: 'hat', preview: d.preview, summary: d.summary }
        : { code: d.code, kind: d.kind, line1: d.line1, line2: d.line2, mono: d.mono, font: d.font, color: d.color, logo: d.kind === 'logo' ? { sample: true, name: d.logo } : undefined };
      dlg.close();
      var handled = !document.dispatchEvent(new CustomEvent('honors:add-to-cart', { cancelable: true, detail: { design: design, qty: n, trigger: btn } }));
      if (!handled) { btn.focus(); showToast('Added ' + countOf(d, n) + ' to your cart. Design ' + d.code + '.'); }
    });

    // Review link ?reorder=HGS-…: open the dialog for that design on arrival.
    var start = params.get('reorder'), startBtn = start && document.querySelector('#' + CSS.escape(start) + ' [data-act="reorder"]');
    if (startBtn) { startBtn.scrollIntoView({ block: 'center' }); openFor(designOf(start), startBtn); }
    $$('.review-switch a[data-review]').forEach(function (a) {
      if (a.getAttribute('data-review') === (params.get('state') || '') + '|' + (start || '')) a.setAttribute('aria-current', 'true');
    });
  }

  // ---- My logos (UI-43; C-10): each saved logo as its file looks, tried on the club's real gear (the ball render and
  // the rope hat's patch, as the home page's Try your logo does); upload a new one (UI-21's rules); remove one, with
  // logos used in orders kept for production. Changes last while the page is open (the demo account comes back). ----
  var logoList = document.querySelector('[data-list="logo-rows"]');
  if (logoList) initLogos();

  function initLogos() {
    var params = new URLSearchParams(location.search);
    var MARKS = {   // the saved logos' own art, as inline SVG so the page's fonts apply
      ring: { box: '-70 -70 140 140', art: RING },
      script: { box: '0 0 320 130', art: '<text x="160" y="86" text-anchor="middle" font-family="\'Pinyon Script\', cursive" font-size="84" fill="#1F4A36">Pinecrest</text>' },
      crest: { box: '0 0 120 140', art: '<path d="M10 8h100v56c0 36-22 57-50 70C32 121 10 100 10 64V8z" fill="#1F4A36"/><path d="M17 15h86v49c0 31-18 49-43 61-25-12-43-30-43-61V15z" fill="none" stroke="#FFFFFF" stroke-width="2"/>' +
        '<text x="60" y="80" text-anchor="middle" font-family="\'Marcellus\', Georgia, serif" font-size="34" letter-spacing="2" fill="#FFFFFF">PGC</text>' }
    };
    var MIN_PX = 264;   // as the ball designer: shorter than this on its long side prints soft (spec GB-2 example)
    var ERRORS = {
      convert: ['That file couldn’t be converted.', 'It may be damaged or saved in an unusual way. Try a PNG of your logo.'],
      type: ['That file isn’t a PNG, JPG, SVG or PDF.', 'Try a PNG of your logo.'],
      size: ['That file is over 25 MB.', 'Try a smaller PNG or a PDF.']
    };
    var slug = function (name) { return 'logo-' + name.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); };
    var typeOf = function (name) { var m = /\.(\w+)$/.exec(name); return m ? m[1].toUpperCase().replace('JPEG', 'JPG') : 'File'; };

    // The logo on a golf ball (multiply, so the ink takes the dimples) and on the hat's round patch.
    function markSvg(l, x, y, w, h) {
      if (l.url) return '<image href="' + esc(l.url) + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid meet"/>';
      var m = MARKS[l.art]; if (!m) return '';
      return '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" viewBox="' + m.box + '" preserveAspectRatio="xMidYMid meet">' + m.art + '</svg>';
    }
    function onBall(l) {
      return '<div class="ball lg-ball"><svg class="ball-svg" viewBox="0 0 400 400" aria-hidden="true"><image href="../shared/ball.webp" width="400" height="400"/>' +
        '<g style="mix-blend-mode: multiply">' + markSvg(l, 95, 116, 210, 160) + '</g></svg></div>';
    }
    function onHat(l) {
      return '<img class="lg-hat" src="img/hat-front-blank.webp" alt=""><span class="lg-patch"><svg viewBox="0 0 100 100" aria-hidden="true">' + markSvg(l, 12, 12, 76, 76) + '</svg></span>';
    }
    function fileArt(l) {
      if (l.isPdf) return '<span class="lg-pdf"><svg width="40" height="48" viewBox="0 0 40 48" aria-hidden="true"><path d="M4 2h22l10 10v32a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#fff" stroke="#7F918C" stroke-width="2"/><path d="M26 2v10h10" fill="none" stroke="#7F918C" stroke-width="2"/></svg><span>PDF</span></span>';
      if (l.url) return '<img class="lg-upload" src="' + esc(l.url) + '" alt="">';
      return logoArt(l);
    }
    function tries(l, asLinks) {
      if (l.isPdf) return '<p class="lg-try-note">A PDF shows on the products once Honors converts it for print.</p>';
      var tile = function (href, pic, label) {
        return asLinks ? '<a class="lg-try" href="' + href + '"><span class="lg-try-pic">' + pic + '</span><span class="lg-try-label">' + label + '</span></a>'
          : '<div class="lg-try"><span class="lg-try-pic">' + pic + '</span><span class="lg-try-label is-plain">' + label + '</span></div>';
      };
      return tile('index.html?buyer=signed-in&tab=logo', onBall(l), asLinks ? 'Use on golf balls' : 'On golf balls') +
        tile('hat.html?buyer=signed-in', onHat(l), asLinks ? 'Use on a hat' : 'On a hat');
    }
    function usedLine(l) {
      var ds = usedIn(l.name);
      if (!ds.length) return 'Not used yet.';
      var one = function (d) { return '<a href="account-designs.html#' + esc(d.code) + '">' + esc(d.code) + '</a>' + (d.order ? ' (in order #' + esc(d.order) + ')' : ''); };
      return 'Used in ' + (ds.length === 1 ? '' : ds.length + ' designs: ') + ds.map(one).join(' and ') + '.';
    }
    function ordersOf(l) { return usedIn(l.name).filter(function (d) { return d.order; }).map(function (d) { return '#' + d.order; }); }
    function confirmText(l) {
      var orders = ordersOf(l), used = usedIn(l.name).length;
      if (orders.length) return 'Remove ' + l.name + ' from your logos? It’s part of order ' + orders.join(' and ') + ', so Honors keeps a copy to make ' + (orders.length === 1 ? 'that order' : 'those orders') + '. Designs that use it keep it too.';
      if (used) return 'Remove ' + l.name + ' from your logos? Designs that use it keep it.';
      return 'Remove ' + l.name + '? It isn’t in any design or order, so it’s deleted.';
    }
    function row(l) {
      var id = slug(l.name);
      return '<li class="lg-row" id="' + id + '" data-logo="' + esc(l.name) + '">' +
        '<div class="lg-file">' + fileArt(l) + '</div>' +
        '<div class="lg-info">' +
          '<h2 class="lg-name">' + esc(l.name) + '</h2>' +
          '<p class="lg-meta">' + typeOf(l.name) + ', ' + (l.uploaded ? 'uploaded ' + day(l.uploaded, true) : 'uploaded just now') + '.</p>' +
          '<p class="lg-used">' + usedLine(l) + '</p>' +
          '<button type="button" class="text-btn lg-remove" data-lg="remove" aria-label="Remove ' + esc(l.name) + '">Remove</button>' +
          '<div class="lg-confirm" data-lg="confirm" hidden>' +
            '<p class="lg-confirm-text" tabindex="-1" id="' + id + '-confirm">' + esc(confirmText(l)) + '</p>' +
            '<div class="lg-confirm-actions"><button type="button" class="btn btn-secondary btn-small lg-danger" data-lg="really">Remove logo</button>' +
            '<button type="button" class="text-btn" data-lg="keep">Keep it</button></div></div>' +
        '</div>' + tries(l, true) + '</li>';
    }
    function draw() {
      logoList.innerHTML = LOGOS.map(row).join('');
      $$('[data-count="logos"]').forEach(function (n) { n.textContent = String(LOGOS.length); });
    }
    draw();

    // Remove, with the rule said plainly before it happens.
    function askRemove(name) {
      var li = logoList.querySelector('[data-logo="' + CSS.escape(name) + '"]'); if (!li) return;
      li.querySelector('[data-lg="remove"]').hidden = true;
      li.querySelector('[data-lg="confirm"]').hidden = false;
      li.classList.add('is-confirming');
      li.querySelector('.lg-confirm-text').focus();
    }
    logoList.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lg]'); if (!b) return;
      var li = b.closest('.lg-row'), name = li.getAttribute('data-logo'), l = LOGOS.filter(function (x) { return x.name === name; })[0];
      var act = b.getAttribute('data-lg');
      if (act === 'remove') askRemove(name);
      if (act === 'keep') { li.querySelector('[data-lg="confirm"]').hidden = true; li.classList.remove('is-confirming'); var r = li.querySelector('[data-lg="remove"]'); r.hidden = false; r.focus(); }
      if (act === 'really') {
        var orders = ordersOf(l), next = li.nextElementSibling || li.previousElementSibling;
        LOGOS.splice(LOGOS.indexOf(l), 1);
        if (l.url) URL.revokeObjectURL(l.url);
        draw();
        showToast('Removed ' + name + '.' + (orders.length ? ' Honors keeps a copy for order ' + orders.join(' and ') + '.' : ''));
        var to = next && logoList.querySelector('[data-logo="' + CSS.escape(next.getAttribute('data-logo')) + '"] [data-lg="remove"]');
        (to || byId('lg-upload-btn')).focus();
      }
    });

    // Upload a new logo: the file is checked (UI-21: PNG, JPG, SVG or PDF up to 25 MB, a damaged file refused), shown on
    // the products before it's saved, and saved only with the artwork-rights box ticked.
    var input = byId('lg-file'), panel = byId('lg-new'), pending = null;
    function sniff(file, done) {   // what a file really is, from its first and last bytes (as the designers check)
      Promise.all([file.slice(0, 4096).arrayBuffer(), file.slice(-4096).arrayBuffer()]).then(function (parts) {
        var b = new Uint8Array(parts[0]), end = Array.prototype.slice.call(new Uint8Array(parts[1])).join(',');
        var ends = function (seq) { return end.indexOf(seq.join(',')) !== -1; };
        if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return done(ends([0x49, 0x45, 0x4E, 0x44]) ? 'png' : 'damaged');
        if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return done(ends([0xFF, 0xD9]) ? 'jpg' : 'damaged');
        if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return done('pdf');
        done(/<svg[\s>]/i.test(new TextDecoder().decode(b)) ? 'svg' : null);
      }, function () { done(null); });
    }
    var ERR_IC = '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.5"/></svg>';
    var WARN_IC = '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>';
    function showError(kind) {
      clearPending();
      panel.className = 'lg-new is-error';
      panel.innerHTML = '<div class="upload-error" role="alert">' + ERR_IC + '<p><strong>' + ERRORS[kind][0] + '</strong> ' + ERRORS[kind][1] + ' Your saved logos haven’t changed.</p></div>' +
        '<div class="lg-new-actions"><label class="btn btn-secondary btn-small" for="lg-file">Choose another file</label><button type="button" class="text-btn" data-new="cancel">Cancel</button></div>';
      panel.hidden = false;
      panel.querySelector('.lg-new-actions label').setAttribute('tabindex', '0');
      panel.querySelector('.lg-new-actions label').focus();
    }
    function clearPending() { if (pending && pending.url) URL.revokeObjectURL(pending.url); pending = null; }
    function showPending(l, size) {
      pending = l;
      panel.className = 'lg-new';
      panel.innerHTML =
        '<div class="lg-file">' + fileArt(l) + '</div>' +
        '<div class="lg-info">' +
          '<h2 class="lg-name" tabindex="-1">' + esc(l.name) + '</h2>' +
          '<p class="lg-meta">' + typeOf(l.name) + (size ? ', ' + size[0].toLocaleString('en-US') + ' × ' + size[1].toLocaleString('en-US') + ' px' : '') + '. Not saved yet.</p>' +
          (l.lowRes ? '<div class="notice lg-lowres" role="status">' + WARN_IC + '<span>This logo is low-resolution for the print size, so edges may look soft. A larger file or a PDF prints sharper. You can still use it.</span></div>' : '') +
          '<label class="tick"><input type="checkbox" id="lg-rights"><span>I own this logo or have permission to use it. <a href="#">Read the terms</a></span></label>' +
          '<p class="field-error" id="lg-rights-error" hidden>Tick the box to confirm you can use this logo.</p>' +
          '<div class="lg-new-actions"><button type="button" class="btn btn-primary btn-small" data-new="save">Save to my logos</button><button type="button" class="text-btn" data-new="cancel">Cancel</button></div>' +
        '</div>' + tries(l, false);
      panel.hidden = false;
      panel.querySelector('.lg-name').focus();
    }
    input.addEventListener('change', function () {
      var file = input.files && input.files[0]; input.value = '';
      if (!file) return;
      if (file.size > 25 * 1024 * 1024) { showError('size'); return; }
      sniff(file, function (kind) {
        if (!kind) { showError('type'); return; }
        if (kind === 'damaged') { showError('convert'); return; }
        clearPending();
        if (kind === 'pdf') { showPending({ name: file.name, isPdf: true }); return; }
        var url = URL.createObjectURL(file), probe = new Image();
        probe.onload = function () {
          var w = probe.naturalWidth, h = probe.naturalHeight;
          showPending({ name: file.name, url: url, lowRes: kind !== 'svg' && Math.max(w, h) < MIN_PX }, kind === 'svg' ? null : [w, h]);
        };
        probe.onerror = function () { URL.revokeObjectURL(url); showError('convert'); };
        probe.src = url;
      });
    });
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-new]'); if (!b) return;
      if (b.getAttribute('data-new') === 'cancel') { clearPending(); panel.hidden = true; panel.innerHTML = ''; byId('lg-upload-btn').focus(); return; }
      var tick = byId('lg-rights');
      if (!tick.checked) { byId('lg-rights-error').hidden = false; tick.focus(); return; }
      var l = pending; pending = null;
      LOGOS.unshift({ name: l.name, url: l.url, isPdf: l.isPdf, art: null, uploaded: null });
      panel.hidden = true; panel.innerHTML = '';
      draw();
      showToast('Saved ' + l.name + ' to your logos.');
      logoList.querySelector('.lg-row .lg-remove').closest('.lg-row').querySelector('.lg-try').focus();
    });
    panel.addEventListener('change', function (e) { if (e.target.id === 'lg-rights' && e.target.checked) byId('lg-rights-error').hidden = true; });
    // The Upload buttons are labels for the hidden file field; Enter and Space open the file picker, as a button would.
    document.addEventListener('keydown', function (e) {
      var lab = e.target.closest && e.target.closest('label[for="lg-file"]');
      if (lab && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); input.click(); }
    });

    // Review links: ?remove=<file name> opens that logo's confirm; ?state=upload-failed shows a refused file.
    if (params.get('remove')) askRemove(params.get('remove'));
    if (params.get('state') === 'upload-failed') showError('convert');
    $$('.review-switch a[data-review]').forEach(function (a) {
      if (a.getAttribute('data-review') === (params.get('state') || '') + '|' + (params.get('remove') || '')) a.setAttribute('aria-current', 'true');
    });
  }

  window.HonorsAccount = { account: ACCOUNT, designs: DESIGNS, orders: ORDERS, logos: LOGOS, stages: STAGES, thumb: thumb, logoArt: logoArt, describe: describe, designerHref: designerHref, money: money, day: day };
})();
