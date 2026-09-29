// UI-54 Order-page panel (spec C-8; SH-6), shown on a static mock of Shopify's order details page. ?order=<number>
// (#1042 by default). Everything except the Honors block mirrors Shopify's page. The block (an admin block extension:
// Shopify draws its card, heading and collapse control) shows the order's stage with who and when, each design's picture,
// code and what it is, the artwork for logo designs, and links to the production sheet and the full Honors order page.
(function () {
  'use strict';
  var A = window.HonorsAdmin, esc = A.esc, icon = A.icon, badge = A.badge;
  var sorted = A.ORDERS.slice().sort(function (a, b) { return a.no - b.no; });
  var wanted = Number(new URLSearchParams(location.search).get('order'));
  var o = sorted.filter(function (x) { return x.no === wanted; })[0] || sorted.filter(function (x) { return x.no === 1042; })[0];
  var b = A.BUYERS[o.buyer], shipped = o.stage === 'shipped';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var TONES = { received: 'info', vendor: '', production: 'attention', hold: 'warning', shipped: 'success' };
  function out(n) { return document.querySelector('[data-out="' + n + '"]'); }
  function clock(t) { var h = t.getHours(), m = t.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' am' : ' pm'); }
  function longDay(t) { return MONTHS[t.getMonth()] + ' ' + t.getDate(); }
  function money(n) { return A.money(n); }
  // Polaris progress markers on badges: complete (filled) and incomplete (hollow).
  var PROG = {
    complete: '<svg class="prog" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="currentColor"/></svg>',
    incomplete: '<svg class="prog" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.2 1.4"/></svg>'
  };
  function progBadge(text, tone, kind) { return '<span class="badge ' + tone + '">' + PROG[kind] + esc(text) + '</span>'; }
  function qty(code) { return o.lines.reduce(function (s, l) { return s + (l.design === code ? l.qty : 0); }, 0); }
  var units = o.lines.reduce(function (s, l) { return s + l.qty; }, 0);

  // ---- Shopify's header ----
  var i = sorted.indexOf(o), prev = sorted[i - 1], next = sorted[i + 1], placed = A.at(o.placed);
  var pager = function (to, ic, label) {
    return to ? '<a class="btn" href="shopify-order.html?order=' + to.no + '" aria-label="' + label + '">' + icon(ic, 16) + '</a>'
      : '<span class="btn" aria-disabled="true" aria-label="' + label + '">' + icon(ic, 16) + '</span>';
  };
  document.title = 'Order #' + o.no + ' · Orders · Honors Golf Supply · Shopify';
  out('head').innerHTML = '<a class="sh-back" href="#" data-shopify aria-label="Orders">' + icon('back') + '</a>' +
    '<div><div class="sh-title"><h1>#' + o.no + '</h1>' + progBadge('Paid', '', 'complete') +
      (shipped ? progBadge('Fulfilled', '', 'complete') : progBadge('Unfulfilled', 'attention', 'incomplete')) + '</div>' +
      '<p class="sh-sub">' + longDay(placed) + ', ' + placed.getFullYear() + ' at ' + clock(placed) + ' from Online Store</p></div>' +
    '<div class="sh-actions"><span class="review-note">Shopify’s order page, mocked for review</span>' +
      '<a class="btn" href="#" data-shopify>Refund</a><a class="btn" href="#" data-shopify>Edit</a>' +
      '<a class="btn" href="#" data-shopify>More actions' + icon('chevron', 16).replace('class="ic"', 'class="ic" style="transform:rotate(90deg)"') + '</a>' +
      '<span class="pager">' + pager(prev, 'prev', 'Previous order') + pager(next, 'chevron', 'Next order') + '</span></div>';

  // ---- Shopify's main column: fulfillment, payment, then the app block, then the timeline ----
  var lines = o.lines.map(function (l) {
    var d = A.DESIGNS[l.design], tier = A.PRODUCTS[d.product].tiers.filter(function (t) { return t.min === l.tier; })[0];
    return '<div class="sh-line">' + A.thumb(d) +
      '<div><a class="sh-name" href="#" data-shopify>' + (d.product === 'hat' ? 'Custom rope hat' : 'Custom golf balls') + '</a>' +
        '<div class="sh-meta">' + tier.name + '</div><div class="sh-meta">Design: ' + l.design + '</div></div>' +
      '<span class="sh-each">' + money(l.price) + ' × ' + l.qty + '</span><span class="sh-total">' + money(l.price * l.qty) + '</span></div>';
  }).join('');
  var fulfil = '<section class="card sh-card" aria-label="' + (shipped ? 'Fulfilled' : 'Unfulfilled') + '">' +
    '<div class="sh-card-head">' + (shipped ? progBadge('Fulfilled', '', 'complete') : progBadge('Unfulfilled', 'attention', 'incomplete')) + '<span class="n">' + units + '</span>' +
      '<button type="button" class="icon-btn" data-shopify aria-label="More">' + icon('more') + '</button></div>' +
    '<div class="sh-box">' + lines + '</div>' +
    (shipped ? '' : '<div class="sh-foot"><a class="btn btn-primary" href="#" data-shopify>Fulfill items</a></div>') + '</section>';
  var payment = '<section class="card sh-card" aria-label="Payment"><div class="sh-card-head">' + progBadge('Paid', '', 'complete') + '</div>' +
    '<div class="sh-box sh-sum"><span>Subtotal</span><span class="sub">' + units + ' items</span><span>' + money(o.total) + '</span>' +
      '<span class="strong">Total</span><span></span><span class="strong">' + money(o.total) + '</span><hr>' +
      '<span>Paid</span><span></span><span>' + money(o.total) + '</span></div></section>';

  // ---- The Honors block (ours) ----
  var trail = A.stageTrail(o), last = trail[trail.length - 1], lt = last.at;
  var when = longDay(lt).slice(0, 3) + ' ' + lt.getDate() + ' at ' + clock(lt);
  var stageLine = o.stage === 'received' ? 'Since it was paid, ' + when
    : o.stage === 'shipped' ? 'Fulfilled in Shopify, ' + when
    : o.stage === 'hold' ? 'Since ' + when + ', put on hold by Chuck'
    : 'Since ' + when + ', moved by Chuck';
  var stageName = A.STAGES.filter(function (s) { return s.id === o.stage; })[0].name;
  var summary = stageName + ', ' + o.designs.length + (o.designs.length === 1 ? ' design' : ' designs');
  function what(d, n) {
    if (d.product === 'hat') return n + ' rope hats, ' + d.shape.toLowerCase() + ' ' + (d.material === 'PVC' ? 'rubber' : 'embroidered') + ' patch';
    return n + ' dozen golf balls, ' + (d.kind === 'logo' ? 'logo' : d.kind === 'monogram' ? 'monogram' : 'text') + ' print';
  }
  var block = '<div class="review-row"><span class="review-note">The Honors panel (ours)</span></div>' +
    '<section class="card hblock" aria-labelledby="hblock-title">' +
    '<div class="hblock-head"><span class="app-icon" aria-hidden="true">H</span><h2 id="hblock-title">Honors designs</h2>' +
      '<span class="hblock-summary" hidden>' + summary + '</span>' +
      '<button type="button" class="hblock-toggle" aria-expanded="true" aria-controls="hblock-body" aria-label="Collapse">' + icon('chevron', 16) + '</button></div>' +
    '<div class="hblock-body" id="hblock-body">' +
      '<div class="hblock-stage">' + badge(stageName, TONES[o.stage]) + '<span class="sh-muted">' + stageLine + '</span></div>' +
      '<div class="hblock-designs">' + o.designs.map(function (code) {
        var d = A.DESIGNS[code];
        return '<div class="hdesign">' + A.thumb(d) + '<div><div class="hdesign-code">' + code + '</div><div class="hdesign-what">' + what(d, qty(code)) + '</div></div>' +
          (d.kind === 'logo' ? '<button type="button" class="btn btn-sm" data-artwork="' + esc(d.logo) + '" title="Download ' + esc(d.logo) + '">' + icon('download', 16) + 'Artwork</button>' : '<span></span>') + '</div>';
      }).join('') + '</div>' +
      '<div class="hblock-foot"><a class="btn" href="sheet.html?order=' + o.no + '">' + icon('sheet', 16) + 'Production sheet</a>' +
        '<a class="link" href="order.html?order=' + o.no + '">Open in Honors</a></div>' +
    '</div></section>';

  // ---- Shopify's timeline ----
  var events = [
    { at: placed, text: esc(b.name) + ' placed this order on Online Store.' },
    { at: new Date(placed.getTime() + 60e3), text: 'Order confirmation email was sent to ' + esc(b.name) + ' (' + esc(b.email) + ').' },
    { at: new Date(placed.getTime() + 60e3), text: money(o.total) + ' USD was captured.' }
  ];
  if (shipped) events.push({ at: A.at(o.since), text: 'Fulfilled ' + units + ' items.' }, { at: new Date(A.at(o.since).getTime() + 60e3), text: 'Shipping confirmation email was sent to ' + esc(b.name) + '.' });
  events.sort(function (x, y) { return y.at - x.at; });
  var day = '', tl = events.map(function (e) {
    var d = longDay(e.at), head = d !== day ? '<p class="sh-tl-day">' + d + '</p>' : '';
    day = d;
    return head + '<div class="sh-tl"><span class="sh-tl-dot" aria-hidden="true"></span><span>' + e.text + '</span><span class="sh-muted">' + clock(e.at) + '</span></div>';
  }).join('');
  var timeline = '<section class="card sh-card" aria-labelledby="tl-title"><div class="sh-card-head"><h2 id="tl-title">Timeline</h2></div>' +
    '<div class="sh-comment"><span class="avatar avatar-store" aria-hidden="true">HG</span><input type="text" placeholder="Leave a comment..." aria-label="Leave a comment"><button type="button" class="btn" data-shopify disabled>Post</button></div>' +
    tl + '</section>';
  out('main').innerHTML = fulfil + payment + block + timeline;

  // ---- Shopify's sidebar: notes and customer ----
  var orders = A.ORDERS.filter(function (x) { return x.buyer === o.buyer; }).length;
  out('side').innerHTML =
    '<section class="card sh-card" aria-labelledby="notes-title"><div class="sh-card-head"><h2 id="notes-title">Notes</h2><button type="button" class="icon-btn" data-shopify aria-label="Edit notes">' + icon('content') + '</button></div>' +
      '<p class="sh-muted">No notes from customer</p></section>' +
    '<section class="card sh-card" aria-labelledby="cust-title"><div class="sh-card-head"><h2 id="cust-title">Customer</h2><button type="button" class="icon-btn" data-shopify aria-label="Remove customer">' + icon('close') + '</button></div>' +
      '<div class="sh-side-block"><p><a class="link" href="#" data-shopify>' + esc(b.name) + '</a></p><p class="sh-muted">' + orders + ' orders</p></div>' +
      '<div class="sh-side-block"><h3>Contact information</h3><p><a class="link" href="mailto:' + esc(b.email) + '">' + esc(b.email) + '</a></p><p class="sh-muted">No phone number</p></div>' +
      '<div class="sh-side-block"><h3>Shipping address</h3><p>' + esc(b.name) + '</p><p>' + esc(b.club) + '</p><p class="sh-muted">[Shipping address]</p></div>' +
      '<div class="sh-side-block"><h3>Billing address</h3><p class="sh-muted">Same as shipping address</p></div></section>';

  // ---- The block's own behaviour: collapse, artwork ----
  var blockEl = document.querySelector('.hblock'), toggle = blockEl.querySelector('.hblock-toggle'), sum = blockEl.querySelector('.hblock-summary');
  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') === 'true';
    blockEl.classList.toggle('is-collapsed', open);
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Expand' : 'Collapse');
    sum.hidden = !open;
  });
  blockEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-artwork]');
    if (!btn) return;
    var name = btn.getAttribute('data-artwork');
    A.artworkFile(name, function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    });
  });
})();
