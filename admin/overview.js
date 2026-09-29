// UI-50 Admin overview (spec C-7, C-9; D-31): orders by stage, new orders and warm leads,
// each linking to its own page. Demo data only, so there are no empty states (D-63).
(function () {
  'use strict';
  var A = window.HonorsAdmin, esc = A.esc, icon = A.icon, badge = A.badge, orders = A.ORDERS;
  function out(name) { return document.querySelector('[data-out="' + name + '"]'); }
  function orderHref(o) { return 'order.html?order=' + o.no; }
  function byNewest(key) { return function (a, b) { return A.at(b[key]) - A.at(a[key]); }; }

  // ---- Orders by stage: a summary of the production board ----
  var month = new Date(A.NOW - 30 * 864e5);
  out('stages').innerHTML = A.STAGES.map(function (s) {
    var inStage = orders.filter(function (o) { return o.stage === s.id; }), note;
    if (s.id === 'shipped') {
      inStage = inStage.filter(function (o) { return A.at(o.since) >= month; });
      note = 'In the last 30 days';
    } else {
      note = 'Oldest: ' + A.age(inStage.map(function (o) { return o.since; }).sort()[0]);
    }
    return '<a class="stage" href="board.html?stage=' + s.id + '">' +
      '<span class="stage-name"><span class="dot ' + s.tone + '"></span>' + s.name + '</span>' +
      '<span class="stage-count">' + inStage.length + '</span><span class="stage-note">' + note + '</span></a>';
  }).join('');

  // ---- New orders: paid and still in Received, newest first ----
  var fresh = orders.filter(function (o) { return o.stage === 'received'; }).sort(byNewest('placed'));
  function items(o) {
    return o.designs.map(function (code) {
      var d = A.DESIGNS[code], n = o.lines.reduce(function (s, l) { return s + (l.design === code ? l.qty : 0); }, 0);
      return d.product === 'hat' ? n + ' rope hats' : n + ' dozen golf balls';
    });
  }
  out('new-orders').innerHTML = '<table class="table"><thead><tr><th>Order</th><th>Buyer</th><th>Designs</th><th>Items</th>' +
    '<th class="num">Total</th><th class="num">In Received</th></tr></thead><tbody>' +
    fresh.map(function (o) {
      var b = A.BUYERS[o.buyer];
      return '<tr data-href="' + orderHref(o) + '">' +
        '<td><div class="cell-2"><a class="row-link" href="' + orderHref(o) + '">#' + o.no + '</a><span class="subdued nowrap">' + A.when(o.placed) + '</span></div></td>' +
        '<td><div class="cell-2"><span>' + esc(b.name) + '</span><span class="subdued">' + esc(b.club) + '</span></div></td>' +
        '<td><div class="cell-thumb"><span class="thumb-stack">' + o.designs.map(function (c) { return A.thumb(A.DESIGNS[c]); }).join('') + '</span>' +
          '<div class="cell-2">' + o.designs.map(function (c) { return '<span class="subdued nowrap">' + c + '</span>'; }).join('') + '</div></div></td>' +
        '<td><div class="cell-2">' + items(o).map(function (t) { return '<span class="nowrap">' + t + '</span>'; }).join('') + '</div></td>' +
        '<td class="num">' + A.money(o.total) + '</td>' +
        '<td class="num nowrap">' + A.age(o.since) + '</td></tr>';
    }).join('') + '</tbody></table>';

  // ---- Warm leads: designs with a known buyer email that were never ordered (C-9), latest activity first ----
  var leads = Object.keys(A.DESIGNS).map(function (c) { return A.DESIGNS[c]; })
    .filter(function (d) { return !d.order && d.buyer && A.BUYERS[d.buyer].email; })
    .map(function (d) { return { d: d, last: d.cart ? d.cart.at : d.created }; })
    .sort(byNewest('last'));
  out('leads').innerHTML = '<table class="table"><thead><tr><th>Design</th><th>Buyer</th><th>Furthest step</th><th>Last activity</th><th><span class="visually-hidden">Follow up</span></th></tr></thead><tbody>' +
    leads.map(function (x) {
      var d = x.d, b = A.BUYERS[d.buyer], href = 'buyer.html?buyer=' + d.buyer;   // the design pages were dropped (D-91)
      var subject = encodeURIComponent('Your ' + A.productName(d).toLowerCase() + ' design ' + d.code);
      return '<tr data-href="' + href + '">' +
        '<td><div class="cell-thumb">' + A.thumb(d) + '<div class="cell-2"><a class="row-link" href="' + href + '">' + d.code + '</a>' +
          '<span class="subdued clip" title="' + esc(A.styleName(d)) + '">' + A.productName(d) + ' · ' + esc(A.styleName(d)) + '</span></div></div></td>' +
        '<td><div class="cell-2"><span class="nowrap"><a class="lead-buyer" href="buyer.html?buyer=' + d.buyer + '">' + esc(b.name) + '</a><span class="subdued"> · ' + esc(b.club) + '</span></span><span class="lead-email">' + esc(b.email) + '</span></div></td>' +
        '<td>' + (d.cart ? badge('Added to cart, ' + A.count(d.cart.qty, d.product), 'info') : badge('Saved', '')) + '</td>' +
        '<td><div class="cell-2"><span class="nowrap">' + A.age(x.last) + ' ago</span><span class="subdued nowrap">' + A.day(x.last) + '</span></div></td>' +
        '<td class="num"><a class="btn" href="mailto:' + esc(b.email) + '?subject=' + subject + '">' + icon('email', 16) + 'Email</a></td></tr>';
    }).join('') + '</tbody></table>';
})();
