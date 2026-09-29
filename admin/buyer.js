// UI-58 Buyer detail (spec C-9; D-35, D-67, D-91): one buyer, from buyer.html?buyer=<id>. The designs they saved and never
// ordered come first, large, since they are the follow-up; the ordered ones follow as compact rows (each names its order);
// then their saved logos, drawn as the files look on the buyer's own My logos page (UI-43). The side column holds the
// email and a short list of their orders, each opening its order page (UI-52). `guest` gathers the designs and orders
// saved without signing in (no name, no email: C-9's known limit). Numbers come from buyers.js (HonorsBuyers.summary),
// data and helpers from admin.js. Sample data only; nothing is saved. No design pages (D-91) and no flags (D-67).
(function () {
  'use strict';
  var A = window.HonorsAdmin, B = window.HonorsBuyers, root = document.querySelector('[data-out="buyer"]');
  if (!A || !B || !root) return;
  var esc = A.esc, icon = A.icon;
  var TITLE = ' · Buyers · Honors · Honors Golf Supply · Shopify';

  var params = new URLSearchParams(location.search);
  var id = params.get('buyer') || 'alex';   // as the order page opens #1047 when no order is given
  var known = id === 'guest' || Object.prototype.hasOwnProperty.call(A.BUYERS, id);

  // Review bar: mark the state on show (review only).
  [].forEach.call(document.querySelectorAll('.review-switch a[data-review]'), function (a) {
    if (a.getAttribute('data-review') === (known ? id : 'nobody')) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });

  if (!known) {
    document.title = 'Buyer not found' + TITLE;
    root.innerHTML = '<div class="page-head"><div><h1 class="page-title">Buyer not found</h1></div></div>' +
      '<section class="card empty-card" aria-label="Buyer not found">' +
        '<p class="strong">This link doesn’t match any buyer.</p>' +
        '<p class="subdued">It may be out of date. Everyone who signed in to save a design is on the Buyers list.</p>' +
        '<a class="btn" href="buyers.html">Go to Buyers</a></section>';
    return;
  }

  var x = B.summary(id), guest = x.guest, first = guest ? '' : x.name.split(' ')[0];
  document.title = x.name + TITLE;
  var open = x.designs.filter(function (d) { return !d.order; }), ordered = x.designs.filter(function (d) { return d.order; });
  var logos = guest ? [] : A.LOGOS.filter(function (l) { return l.buyer === id; })
    .sort(function (a, b) { return A.at(b.uploaded) - A.at(a.uploaded); });
  var orders = x.orders.slice().sort(function (a, b) { return A.at(b.placed) - A.at(a.placed); });

  function n(k) { return k ? ' <span class="n">' + k + '</span>' : ''; }   // a count, shown when there is one
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function subject(d) { return encodeURIComponent('Your ' + A.productName(d).toLowerCase() + ' design ' + d.code); }

  // ---- Never ordered: each design large, with how far it got and a ready email ----
  function lead(d) {
    var step = d.cart ? A.badge('Added to cart, ' + A.count(d.cart.qty, d.product), 'info') : A.badge('Saved', '');
    return '<article class="lead" id="' + d.code + '" aria-labelledby="t-' + d.code + '">' +
      '<div class="lead-pic">' + A.picture(d) + '</div>' +
      '<div class="lead-body">' +
        '<h3 class="lead-code" id="t-' + d.code + '">' + d.code + '</h3>' +
        '<p class="lead-product">' + A.productName(d) + '</p>' +
        '<dl class="spec lead-spec">' +
          '<dt>Design</dt><dd>' + esc(A.styleName(d)) + '</dd>' +
          '<dt>Saved</dt><dd>' + A.when(d.created) + '</dd>' +
          '<dt>Furthest step</dt><dd>' + step + '</dd>' +
        '</dl>' +
        '<div class="lead-foot">' +
          (guest ? '<span class="subdued">No email to follow up with</span>'
            : '<a class="btn" href="mailto:' + esc(x.email) + '?subject=' + subject(d) + '">' + icon('email', 16) + 'Email ' + esc(first) + '</a>') +
          '<span class="lead-age">Last activity ' + A.age(d.cart ? d.cart.at : d.created) + ' ago</span>' +
        '</div>' +
      '</div></article>';
  }

  // ---- Ordered: compact rows, each naming the order it was bought in ----
  function row(d) {
    return '<li class="drow" id="' + d.code + '">' + A.thumb(d) +
      '<div class="cell-2"><span class="drow-code">' + d.code + '</span>' +
        '<span class="subdued clip" title="' + esc(A.styleName(d)) + '">' + A.productName(d) + ', ' + esc(lower(A.styleName(d))) + '</span></div>' +
      '<span class="drow-saved">Saved ' + A.day(d.created) + '</span>' +
      '<a class="link drow-order" href="order.html?order=' + d.order + '">Order #' + d.order + '</a></li>';
  }

  // ---- Logos: the saved files as they look (the JPG on its white ground, the PNG and SVG on a clear one), newest first ----
  var RING = '<circle r="64" fill="none" stroke="#1F2E55" stroke-width="4"/>' +
    '<g fill="#1F2E55"><polygon points="0,-50 20,-18 11,-18 27,6 -27,6 -11,-18 -20,-18"/><rect x="-5" y="6" width="10" height="11"/>' +
    '<text y="36" font-size="12" font-weight="700" letter-spacing="2" text-anchor="middle" font-family="Figtree, sans-serif">PINECREST</text>' +
    '<text y="50" font-size="8" letter-spacing="2" text-anchor="middle" font-family="Figtree, sans-serif">GOLF CLUB</text></g>';
  var MARKS = {   // the same art as the buyer's My logos page (a-clean/account.js)
    'pinecrest-logo.jpg': '<svg class="logo-art is-jpg" viewBox="-80 -80 160 160" aria-hidden="true"><rect x="-80" y="-80" width="160" height="160" fill="#FFFFFF"/>' + RING + '</svg>',
    'pinecrest-script.png': '<svg class="logo-art is-png" viewBox="0 0 320 130" aria-hidden="true"><text x="160" y="86" text-anchor="middle" font-family="\'Pinyon Script\', cursive" font-size="84" fill="#1F4A36">Pinecrest</text></svg>',
    'pinecrest-crest.svg': '<svg class="logo-art is-svg" viewBox="0 0 120 140" aria-hidden="true">' +
      '<path d="M10 8h100v56c0 36-22 57-50 70C32 121 10 100 10 64V8z" fill="#1F4A36"/>' +
      '<path d="M17 15h86v49c0 31-18 49-43 61-25-12-43-30-43-61V15z" fill="none" stroke="#FFFFFF" stroke-width="2"/>' +
      '<text x="60" y="80" text-anchor="middle" font-family="\'Marcellus\', Georgia, serif" font-size="34" letter-spacing="2" fill="#FFFFFF">PGC</text></svg>'
  };
  function logo(l) {
    var used = x.designs.filter(function (d) { return d.logo === l.file; }).map(function (d) { return d.code; });
    var usedText = used.length ? 'Used in ' + used.join(' and ') : 'Not used in a design yet';
    return '<li class="logo">' +
      '<div class="logo-tile" role="img" aria-label="' + esc(l.file) + '">' + (MARKS[l.file] || '<span class="subdued">' + esc(l.file) + '</span>') + '</div>' +
      '<p class="logo-name">' + esc(l.file) + '</p>' +
      '<p class="logo-meta">Uploaded ' + A.day(l.uploaded) + '</p>' +
      '<p class="logo-meta">' + usedText + '</p></li>';
  }

  // ---- Orders, in brief: newest first, each opening its order page ----
  function orderRow(o) {
    var st = A.STAGES.filter(function (s) { return s.id === o.stage; })[0];
    return '<li><a class="orow" href="order.html?order=' + o.no + '">' + A.thumb(A.DESIGNS[o.designs[0]]) +
      '<span class="cell-2"><span class="orow-no">#' + o.no + '</span><span class="subdued">' + A.day(o.placed) + '</span></span>' +
      '<span class="orow-end"><span class="orow-total">' + A.money(o.total) + '</span>' + A.badge(st.name, st.tone) + '</span></a></li>';
  }

  function card(titleId, title, count, sub, body) {
    return '<section class="card" aria-labelledby="' + titleId + '">' +
      '<div class="card-head' + (sub ? ' has-sub' : '') + '"><div><h2 class="card-title" id="' + titleId + '">' + title + (count === null ? '' : n(count)) + '</h2>' +
        (sub ? '<p class="card-sub">' + sub + '</p>' : '') + '</div></div>' + body + '</section>';
  }
  function empty(text) { return '<p class="card-empty">' + text + '</p>'; }

  var main = '';
  if (!x.designs.length) {
    main += card('designs-title', 'Designs', null, '',
      empty(guest ? 'No designs have been saved without signing in yet.' : esc(first) + ' hasn’t saved a design yet.'));
  } else {
    main += card('open-title', 'Never ordered', open.length,
      open.length ? (guest ? 'Saved without signing in and not bought yet.' : 'Saved by ' + esc(first) + ' but not bought yet, so worth a follow-up.') : '',
      open.length ? '<div class="leads">' + open.map(lead).join('') + '</div>'
        : empty('Every design ' + (guest ? 'saved without signing in' : esc(first) + ' saved') + ' has been ordered.'));
    main += card('ordered-title', 'Ordered designs', ordered.length, '',
      ordered.length ? '<ul class="drows">' + ordered.map(row).join('') + '</ul>'
        : empty('None of ' + (guest ? 'these designs' : esc(first) + '’s designs') + ' has been ordered yet.'));
  }
  main += card('logos-title', 'Logos', guest ? null : logos.length, logos.length ? 'Saved to ' + esc(first) + '’s account, newest first.' : '',
    logos.length ? '<ul class="logos">' + logos.map(logo).join('') + '</ul>'
      : empty(guest ? 'Saved logos belong to a buyer’s account, so guests have none.' : esc(first) + ' hasn’t saved any logos.'));

  var side = '<section class="card side-card" aria-labelledby="contact-title"><h2 id="contact-title">Contact</h2>' +
    (guest ? '<p>No email</p><p class="subdued">These were saved without signing in, so there’s no name or email to follow up with.</p>'
      : '<p><a class="link buyer-mail" href="mailto:' + esc(x.email) + '">' + esc(x.email) + '</a></p>') +
    (x.last ? '<p class="contact-last">Last active ' + A.when(x.last.at) + '</p>' : '') +
    (guest ? '' : '<div class="side-links"><a class="link link-arrow" href="#" data-shopify title="Shopify’s own customer page (not part of this prototype)">Open in Shopify' + icon('external', 16) + '</a></div>') +
    '</section>' +
    '<section class="card side-card" aria-labelledby="orders-title"><h2 id="orders-title">Orders' + n(orders.length) + '</h2>' +
    (orders.length
      ? '<ul class="olist">' + orders.map(orderRow).join('') + '</ul>' +
        '<dl class="facts orders-total"><dt>Amount spent</dt><dd class="total">' + A.money(x.spent) + '</dd></dl>'
      : '<p class="subdued">' + (guest ? 'No orders placed without signing in.' : 'No orders yet.') + '</p>') +
    '</section>';

  root.innerHTML = '<div class="page-head"><div><h1 class="page-title">' + esc(x.name) + '</h1><p class="page-sub">' + esc(x.club) + '</p></div>' +
    '<span class="review-note">' + (guest ? 'Sample data, example prices' : 'Sample buyer, example prices') + '</span></div>' +
    '<div class="buyer-layout"><div class="buyer-main">' + main + '</div><aside class="buyer-side">' + side + '</aside></div>';
})();
