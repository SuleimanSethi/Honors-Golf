// Cart behavior for look A: the cart page (UI-31) and the slide-in cart drawer (UI-30), spec C-3 and C-4.
// Sample data at example prices. The cart page and the drawer share one sample cart through sessionStorage.
// Cart page review links: ?state=below-min, ?state=no-preview, ?state=reprice-failed, ?state=empty, ?state=reset.
// A page gets the drawer with <body data-cart-drawer>; a designer (golf ball or hat) then sends 'honors:add-to-cart'.
(function () {
  'use strict';

  // Same example prices as the ball designer (designer.js) and the hat page (hat.js), until Chuck sets them
  // (spec OQ-3). A line without a product is a golf ball, counted in dozens; hats are counted one by one.
  var PRODUCTS = {
    ball: { min: 6, tiers: [
      { min: 6, price: 54, name: '6–11 dozen' },
      { min: 12, price: 49, name: '12–23 dozen' },
      { min: 24, price: 44, name: '24 dozen or more' }
    ] },
    hat: { min: 24, tiers: [
      { min: 24, price: 22, name: '24–47 hats' },
      { min: 48, price: 20, name: '48–143 hats' },
      { min: 144, price: 18, name: '144 hats or more' }
    ] },
    // Accessories (UI-12) are counted one by one like hats and bring their own picture and description; `own` holds
    // their words and page. Example prices until Chuck sets them, the same as accessory.js.
    tumbler: { min: 24, own: { name: 'Custom tumblers', one: 'tumbler', many: 'tumblers', page: 'accessory.html' }, tiers: [
      { min: 24, price: 19, name: '24–71 tumblers' },
      { min: 72, price: 17, name: '72–143 tumblers' },
      { min: 144, price: 15, name: '144 tumblers or more' }
    ] },
    // Apparel (UI-13) is counted one by one, and a polo line also carries its sizes (A-2): one line per design,
    // showing the size split, priced at the tier for the total across sizes. Example prices, the same as apparel.js.
    polo: { min: 12, own: { name: 'Custom polos', one: 'polo', many: 'polos', page: 'apparel.html' }, tiers: [
      { min: 12, price: 38, name: '12–23 polos' },
      { min: 24, price: 34, name: '24–47 polos' },
      { min: 48, price: 30, name: '48 polos or more' }
    ] }
  };
  var TIERS = PRODUCTS.ball.tiers;
  var MIN_DOZEN = PRODUCTS.ball.min;
  function product(name) { return PRODUCTS[name] || PRODUCTS.ball; }

  // The break always comes from the design's own quantity (C-3).
  function tierFor(qty, name) { var tiers = product(name).tiers, t = tiers[0]; tiers.forEach(function (x) { if (qty >= x.min) t = x; }); return t; }
  function lineTotal(line) { return line.qty * tierFor(line.qty, line.product).price; }
  function subtotal(lines) { return lines.reduce(function (sum, l) { return sum + lineTotal(l); }, 0); }
  // Going down stops at the minimum; a design already below it can only go up (C-4).
  function stepQty(qty, delta, name) { var next = qty + delta; return delta < 0 && next < product(name).min ? qty : next; }
  function canCheckout(lines, repriceFailed) {
    return lines.length > 0 && !repriceFailed && lines.every(function (l) { return l.qty >= product(l.product).min; });
  }
  // Adding a design that's already in the cart adds to its one line (C-4) and takes the design's latest
  // version (D-29). Either way the design moves to the top, where the drawer shows it.
  function addLine(lines, design, qty) {
    var found = lines.filter(function (l) { return l.code === design.code; })[0];
    var line = Object.assign({}, found || {}, design, { qty: (found ? found.qty : 0) + qty });
    // A design with sizes adds size by size, so its sizes still sum to its quantity.
    if (found && found.sizes && design.sizes) {
      line.sizes = {};
      Object.keys(found.sizes).concat(Object.keys(design.sizes)).forEach(function (k) { line.sizes[k] = (found.sizes[k] || 0) + (design.sizes[k] || 0); });
    }
    return { lines: [line].concat(lines.filter(function (l) { return l !== found; })), merged: !!found };
  }
  function money(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PRODUCTS: PRODUCTS, TIERS: TIERS, MIN_DOZEN: MIN_DOZEN, tierFor: tierFor, lineTotal: lineTotal, subtotal: subtotal, stepQty: stepQty, canCheckout: canCheckout, addLine: addLine, money: money };
    return;
  }

  var FONTS = {
    classic: "'Marcellus', Georgia, serif", block: "'Alfa Slab One', Georgia, serif",
    script: "'Pinyon Script', cursive", clean: "'Figtree', 'Helvetica Neue', sans-serif"
  };
  var FONT_NAMES = { classic: 'Classic', block: 'Block', script: 'Script', clean: 'Clean' };
  var COLORS = {
    black: { name: 'Black', hex: '#1A1B1F' }, navy: { name: 'Navy', hex: '#1F2E55' }, oxblood: { name: 'Oxblood', hex: '#6B1E2A' },
    red: { name: 'Red', hex: '#C8262B' }, green: { name: 'Green', hex: '#1E5B3F' }, gold: { name: 'Gold', hex: '#9A7128' }
  };
  var SAMPLE = [
    { code: 'HGS-10412', kind: 'text', line1: 'Pinecrest Club', line2: 'Club Championship', font: 'classic', color: 'navy', qty: 12 },
    { code: 'HGS-10398', kind: 'logo', logo: { sample: true, name: 'pinecrest-logo.jpg' }, qty: 6 }
  ];
  var KEY = 'honors-sample-cart';

  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function byId(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var cartPage = !!byId('cart-lines');
  var state = cartPage ? new URLSearchParams(location.search).get('state') || '' : '';
  var lines, repriceFailed = false;
  if (state === 'reset') {
    try { sessionStorage.removeItem(KEY); } catch (e) { /* storage blocked: the sample shows anyway */ }
    state = ''; history.replaceState(null, '', 'cart.html');
  }
  if (state) {
    lines = copy(SAMPLE);                                  // review states always start from the sample, unsaved
    if (state === 'below-min') lines[1].qty = 4;
    if (state === 'no-preview') lines[1].noPreview = true;
    if (state === 'reprice-failed') repriceFailed = true;
    if (state === 'empty') lines = [];
  } else {
    try { lines = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { lines = null; }
    if (!Array.isArray(lines)) lines = copy(SAMPLE);
  }
  function save() {
    if (state) return;
    // An uploaded logo only exists in the page that uploaded it, so other pages show the placeholder.
    // A hat's preview is a picture taken when it was added, so it survives.
    var out = lines.map(function (l) {
      if (!l.logo || !l.logo.url) return l;
      return Object.assign({}, l, { logo: Object.assign({}, l.logo, { url: null }), noPreview: ownPicture(l) ? !!l.noPreview : true });
    });
    try { sessionStorage.setItem(KEY, JSON.stringify(out)); } catch (e) { /* storage blocked: the cart lasts for this page */ }
  }

  // The same print layout as the ball designer, on the same rendered ball (D-46).
  function fitSize(text, max) { var len = Math.max(text.length, 1); return Math.round(Math.min(max, 250 / (len * 0.56))); }
  function printSvg(line) {
    if (line.kind === 'logo') {
      if (line.logo && line.logo.url) return '<image href="' + esc(line.logo.url) + '" x="120" y="116" width="160" height="160" preserveAspectRatio="xMidYMid meet"/>';
      return '<g transform="translate(200 196)" fill="#1F2E55">' +
        '<circle r="64" fill="none" stroke="#1F2E55" stroke-width="4"/>' +
        '<polygon points="0,-50 20,-18 11,-18 27,6 -27,6 -11,-18 -20,-18"/><rect x="-5" y="6" width="10" height="11"/>' +
        '<text y="36" font-size="12" font-weight="700" letter-spacing="2" text-anchor="middle" font-family="Figtree, sans-serif">PINECREST</text>' +
        '<text y="50" font-size="8" letter-spacing="2" text-anchor="middle" font-family="Figtree, sans-serif">GOLF CLUB</text></g>';
    }
    var ink = COLORS[line.color] ? COLORS[line.color].hex : COLORS.navy.hex, font = esc(FONTS[line.font] || FONTS.classic);
    if (line.kind === 'monogram') {
      return '<text x="200" y="228" font-size="92" letter-spacing="4" text-anchor="middle" font-family="' + font + '" fill="' + ink + '">' + esc(line.mono || '') + '</text>';
    }
    var s1 = fitSize(line.line1 || '', 46), s2 = line.line2 ? Math.min(Math.round(s1 * 1.25), fitSize(line.line2, 40)) : 0;
    var y1 = Math.round(196 - (s1 + (line.line2 ? 10 + s2 : 0)) / 2 + s1 * 0.8);
    return '<g text-anchor="middle" font-family="' + font + '" fill="' + ink + '">' +
      '<text x="200" y="' + y1 + '" font-size="' + s1 + '">' + esc(line.line1 || '') + '</text>' +
      (line.line2 ? '<text x="200" y="' + (y1 + 10 + s2) + '" font-size="' + s2 + '">' + esc(line.line2) + '</text>' : '') + '</g>';
  }
  function thumbSvg(line) {
    if (line.noPreview) {
      return '<svg class="thumb-missing" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5L6 19.5"/></svg><span class="thumb-missing-label">Preview unavailable</span>';
    }
    if (ownPicture(line)) return '<img class="hat-thumb" src="' + esc(line.preview) + '" alt="">';
    return '<div class="ball"><svg class="ball-svg" viewBox="0 0 400 400" aria-hidden="true">' +
      '<image href="../shared/ball.webp" width="400" height="400"/>' +
      '<g style="mix-blend-mode: multiply">' + printSvg(line) + '</g></svg></div>';
  }
  function describe(line) {
    if (ownPicture(line)) return esc(line.summary || '');   // the hat and accessory pages write their own description
    var ink = COLORS[line.color] ? COLORS[line.color].name.toLowerCase() : 'navy', font = FONT_NAMES[line.font] || 'Classic';
    if (line.kind === 'logo') return 'Your logo (' + esc(line.logo ? line.logo.name : 'logo') + '), printed in its own colors.';
    if (line.kind === 'monogram') return 'Monogram “' + esc(line.mono || '') + '” in ' + ink + ', ' + font + ' lettering.';
    return '“' + esc(line.line1 || '') + (line.line2 ? ' / ' + esc(line.line2) : '') + '” in ' + ink + ', ' + font + ' lettering.';
  }
  function editHref(line) {
    var page = line.product === 'hat' ? 'hat.html' : words(line) ? words(line).page : './';
    return line.kind === 'logo' ? page + '?tab=logo' : line.kind === 'monogram' ? page + '?tab=monogram' : page;
  }
  // How a product's quantity reads: golf balls in dozens, hats and accessories one by one, each in its own words.
  function isHat(line) { return line.product === 'hat'; }
  function words(line) { var p = PRODUCTS[line.product]; return p && p.own ? p.own : null; }
  function ownPicture(line) { return isHat(line) || !!words(line); }
  function unitName(line, n) { var w = words(line); return w ? (n === 1 ? w.one : w.many) : n === 1 ? 'hat' : 'hats'; }
  function count(n, line) { return n + (ownPicture(line) ? ' ' + unitName(line, n) : ' dozen'); }
  function each(price, line) { return price + (ownPicture(line) ? ' each' : ' a dozen'); }

  // One line of the cart. The drawer uses the compact version: smaller picture, no description or edit link.
  function lineHtml(line, compact) {
    var thumb = compact
      ? '<div class="line-thumb">' + thumbSvg(line) + '</div>'
      : '<a class="line-thumb" href="' + editHref(line) + '" aria-label="Edit design ' + line.code + '">' + thumbSvg(line) + '</a>';
    var heading = compact ? 'h3' : 'h2', one = ownPicture(line) ? 'One ' + unitName(line, 1) : 'One dozen';
    return '<li class="cart-line' + (compact ? ' is-compact' : '') + '" data-code="' + line.code + '">' + thumb +
      '<div class="line-body">' +
        '<div class="line-top"><div><' + heading + ' class="line-name">' + (words(line) ? words(line).name : isHat(line) ? 'Custom rope hats' : 'Custom golf balls') + '</' + heading + '><p class="line-code">Design ' + line.code + '</p></div>' +
          '<p class="line-total" data-f="total"></p></div>' +
        (compact ? '' : '<p class="line-desc">' + describe(line) + '</p>') +
        '<div class="line-qty">' +
          (line.sizes ? '<span class="line-sizes" data-f="sizes"></span>'   // sizes are changed on the design's page
            : '<div class="stepper" role="group" aria-label="Quantity in ' + (ownPicture(line) ? unitName(line, 2) : 'dozens') + ', design ' + line.code + '">' +
            '<button type="button" data-act="dec" aria-label="' + one + ' fewer">&minus;</button><output data-f="qty" aria-live="polite"></output>' +
            '<button type="button" data-act="inc" aria-label="' + one + ' more">+</button></div>') +
          '<span class="line-unit" data-f="unit"></span></div>' +
        '<p class="hint line-min" data-f="min">Minimum ' + count(product(line.product).min, line) + ' per design.</p>' +
        '<div class="notice" data-f="below" role="status"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg><span data-f="below-text"></span></div>' +
        '<div class="line-actions">' + (compact ? '' : '<a class="text-btn" href="' + editHref(line) + '">Edit design</a>') +
          '<button type="button" class="text-btn" data-act="remove">Remove</button></div>' +
      '</div></li>';
  }
  function updateLine(li, line) {
    var f = function (name) { return li.querySelector('[data-f="' + name + '"]'); };
    var t = tierFor(line.qty, line.product), price = money(t.price).replace('.00', ''), min = product(line.product).min;
    f('total').textContent = money(lineTotal(line));
    if (!line.sizes) f('qty').textContent = String(line.qty);
    f('unit').textContent = li.classList.contains('is-compact') ? each(price, line) : (ownPicture(line) ? unitName(line, 2) : 'dozen') + ' at ' + each(price, line) + ' (' + t.name + ' price)';
    if (line.sizes) {
      // No stepper: the size split, then the total across sizes and its price.
      f('sizes').textContent = Object.keys(line.sizes).filter(function (k) { return line.sizes[k] > 0; }).map(function (k) { return k + ' ' + line.sizes[k]; }).join(' · ');
      f('unit').textContent = li.classList.contains('is-compact') ? count(line.qty, line) + ', ' + each(price, line) : count(line.qty, line) + ' at ' + each(price, line) + ' (' + t.name + ' price)';
    }
    f('min').hidden = line.qty !== min;
    f('below').hidden = line.qty >= min;
    f('below-text').textContent = 'Minimum ' + count(min, line) + ' per design. Add ' + count(min - line.qty, line).replace(' ', ' more ') + ' or remove this design to check out.';
    if (!line.sizes) li.querySelector('[data-act="dec"]').disabled = line.qty <= min;
  }

  // A view is a list of lines plus its summary (the cart page, or the drawer). Both follow the same cart.
  var views = [];
  function drawList(view) {
    view.list.innerHTML = lines.map(function (l) { return lineHtml(l, view.compact); }).join('');
    lines.forEach(function (l) { updateLine(view.list.querySelector('[data-code="' + l.code + '"]'), l); });
  }
  function updateView(view) {
    var c = function (name) { return view.root.querySelector('[data-c="' + name + '"]'); };
    var ok = canCheckout(lines, repriceFailed), note = c('checkout-note');
    c('subtotal').textContent = money(subtotal(lines));
    c('checkout').disabled = !ok;
    note.hidden = ok;
    var short = lines.filter(function (l) { return l.qty < product(l.product).min; });
    var oneKind = short.length && short.every(function (l) { return count(1, l) === count(1, short[0]); });
    note.textContent = repriceFailed ? 'Refresh your cart to check out.'
      : 'Bring every design up to ' + (oneKind ? count(product(short[0].product).min, short[0]) : 'its minimum') + ' to check out.';
    c('filled').hidden = !lines.length;
    c('empty').hidden = lines.length > 0;
    if (view.onUpdate) view.onUpdate();
  }
  function updateAll() {
    views.forEach(updateView);
    document.querySelectorAll('[data-out="cart-count"]').forEach(function (n) { n.textContent = String(lines.length); });
    document.querySelectorAll('[data-cart-link]').forEach(function (a) { a.setAttribute('aria-label', 'Cart, ' + lines.length + (lines.length === 1 ? ' item' : ' items')); });
  }

  var toastTimer;
  function showToast(text) {
    var t = byId('toast'); if (!t) return;
    t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  function addView(view) {
    views.push(view);
    drawList(view);
    view.list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]'); if (!btn) return;
      var li = btn.closest('.cart-line'), code = li.getAttribute('data-code');
      var line = lines.filter(function (l) { return l.code === code; })[0];
      if (btn.getAttribute('data-act') === 'remove') {
        lines = lines.filter(function (l) { return l !== line; });
        save();
        views.forEach(function (v) { var gone = v.list.querySelector('[data-code="' + code + '"]'); if (gone) gone.remove(); });
        updateAll();
        showToast('Removed design ' + code + '.');
        var next = view.list.querySelector('[data-act="remove"]'); (next || view.root.querySelector('[data-c="after-empty"]')).focus();
        return;
      }
      line.qty = stepQty(line.qty, btn.getAttribute('data-act') === 'inc' ? 1 : -1, line.product);
      save();
      views.forEach(function (v) { var el = v.list.querySelector('[data-code="' + code + '"]'); if (el) updateLine(el, line); });
      updateAll();
      if (btn.disabled) btn.closest('.stepper').querySelector('[data-act="inc"]').focus();
    });
    view.root.querySelector('[data-c="checkout"]').addEventListener('click', function () {
      showToast('In the real store, this opens Shopify’s checkout.');
    });
  }

  // The cart page (UI-31).
  if (cartPage) {
    var page = byId('cart');
    addView({
      root: page, list: byId('cart-lines'), compact: false,
      onUpdate: function () {
        var sum = function (test) { return lines.reduce(function (s, l) { return test(l) ? s + l.qty : s; }, 0); };
        var dozens = sum(function (l) { return !ownPicture(l); }), hats = sum(isHat), parts = [];
        if (dozens) parts.push(dozens + ' dozen golf balls');
        if (hats) parts.push(hats + (hats === 1 ? ' hat' : ' hats'));
        Object.keys(PRODUCTS).forEach(function (key) {   // accessories, in their own words
          var w = PRODUCTS[key].own, n = w ? sum(function (l) { return l.product === key; }) : 0;
          if (n) parts.push(n + ' ' + (n === 1 ? w.one : w.many));
        });
        var list = parts.length > 2 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts.join(' and ');
        byId('cart-sub').textContent = lines.length + (lines.length === 1 ? ' design, ' : ' designs, ') + list;
        byId('cart-sub').hidden = !lines.length;
        byId('reprice-notice').hidden = !repriceFailed;
      }
    });
    byId('refresh-cart').addEventListener('click', function () { repriceFailed = false; updateAll(); showToast('Prices updated.'); });
    document.querySelectorAll('.review-switch a[data-state]').forEach(function (a) {
      if (a.getAttribute('data-state') === state) a.setAttribute('aria-current', 'page');
    });
  }

  // The slide-in drawer (UI-30), on pages with <body data-cart-drawer>.
  if (document.body.hasAttribute('data-cart-drawer')) {
    var CHECK = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="drawer-scrim" data-drawer-close></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" inert>' +
        '<div class="drawer-head"><h2 id="drawer-title" tabindex="-1">' + CHECK + '<span>Added to your cart</span></h2>' +
          '<button type="button" class="icon-btn" data-drawer-close aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
        '<p class="drawer-msg" data-drawer-msg aria-live="polite"></p>' +
        '<div class="drawer-body"><ul class="cart-lines drawer-lines" data-drawer-lines></ul>' +
          '<div class="drawer-empty" data-c="empty" hidden><p>Your cart is empty.</p><button type="button" class="text-btn" data-drawer-close data-c="after-empty">Keep designing</button></div></div>' +
        '<div class="drawer-foot" data-c="filled">' +
          '<div class="sum-row"><span class="sum-label">Subtotal</span><span class="sum-value" data-c="subtotal"></span></div>' +
          '<p class="hint">Shipping and tax are added at checkout.</p>' +
          '<button type="button" class="btn btn-primary btn-block" data-c="checkout" aria-describedby="drawer-checkout-note">Check out</button>' +
          '<p class="checkout-note" id="drawer-checkout-note" data-c="checkout-note" hidden></p>' +
          '<a class="btn btn-secondary btn-block" href="cart.html">View cart</a>' +
          '<p class="hint pay-note">Shop Pay, Apple Pay and Google Pay are offered at checkout.</p>' +
        '</div>' +
      '</aside>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    var drawer = document.querySelector('.drawer'), msg = drawer.querySelector('[data-drawer-msg]'), returnTo = null;
    var drawerView = { root: drawer, list: drawer.querySelector('[data-drawer-lines]'), compact: true };
    addView(drawerView);

    var open = function (trigger) {
      returnTo = trigger || document.activeElement;
      drawer.removeAttribute('inert');
      document.body.classList.add('drawer-open');
      drawer.querySelector('#drawer-title').focus();
    };
    var close = function () {
      if (!document.body.classList.contains('drawer-open')) return;
      document.body.classList.remove('drawer-open');
      drawer.setAttribute('inert', '');
      if (returnTo && returnTo.focus) returnTo.focus();
    };
    document.querySelectorAll('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (!document.body.classList.contains('drawer-open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      // Keep keyboard focus inside the open drawer.
      var items = Array.prototype.filter.call(drawer.querySelectorAll('button, a[href], [tabindex="-1"]'), function (n) { return !n.disabled && n.offsetParent !== null; });
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // A designer's Add to cart (golf ball or hat) hands its design over here; cancelling the event tells it the drawer took it.
    document.addEventListener('honors:add-to-cart', function (e) {
      e.preventDefault();
      var d = e.detail, qty = d.qty, before = lines.filter(function (l) { return l.code === d.design.code; })[0];
      var r = addLine(lines, d.design, qty);
      lines = r.lines; save();
      drawList(drawerView); updateAll();
      var top = r.lines[0];
      if (r.merged) {
        var cheaper = tierFor(top.qty, top.product).price < tierFor(before.qty, top.product).price;
        msg.textContent = 'Added ' + count(qty, top) + '. Design ' + top.code + ' now has ' + count(top.qty, top) +
          (cheaper ? ', so it’s ' + each(money(tierFor(top.qty, top.product).price).replace('.00', ''), top) + '.' : '.');
      } else {
        msg.textContent = count(qty, top) + ' of design ' + top.code + '.';
      }
      drawerView.list.querySelector('.cart-line').classList.add('is-new');
      open(d.trigger);
    });
  }

  updateAll();
  window.HonorsCart = { count: function () { return lines.length; } };
})();
