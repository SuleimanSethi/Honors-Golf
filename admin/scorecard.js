// UI-59 Scorecard (spec C-12, B-6; D-31, D-32, D-93). Three numbers for the last 30 or 90 days: the design-to-order
// rate, sales, and Chuck's hands-on time per order. No targets (D-32). A setup warning appears only when Shopify's prices
// or products stop matching our price breaks (the drift check, technical design T-2.2); it never lists or flags orders
// (D-67). Reads the shared sample data from admin.js and adds the few sample figures that admin.js doesn't hold.
(function () {
  'use strict';
  var A = window.HonorsAdmin, esc = A.esc, DAY = 864e5;
  function out(name) { return document.querySelector('[data-out="' + name + '"]'); }
  var params = new URLSearchParams(location.search);
  var period = params.get('period') === '90' ? 90 : 30;
  var setupOk = params.get('setup') === 'ok';

  // ================= SAMPLE FIGURES (example data for this page only; admin.js covers September only) =================
  // Chuck's hands-on minutes for each September order that has reached Sent to vendor (paid → specs sent).
  var MINUTES = { 1036: 12, 1037: 10, 1038: 9, 1039: 11, 1040: 8, 1041: 14, 1042: 7, 1043: 8, 1045: 6 };
  // Earlier orders, July and August, all shipped: [order, paid, product, quantity, hands-on minutes]. Priced by tierFor.
  var EARLIER = [
    [1017, '2026-07-03 10:12', 'ball', 12, 19], [1018, '2026-07-08 14:40', 'hat', 24, 22], [1019, '2026-07-10 09:05', 'ball', 6, 16],
    [1020, '2026-07-15 16:22', 'ball', 24, 17], [1021, '2026-07-17 11:48', 'hat', 48, 18], [1022, '2026-07-22 13:30', 'ball', 12, 14],
    [1023, '2026-07-25 10:02', 'hat', 36, 15], [1024, '2026-07-29 15:15', 'ball', 6, 13], [1025, '2026-07-31 08:50', 'ball', 12, 15],
    [1026, '2026-08-04 12:34', 'hat', 72, 14], [1027, '2026-08-06 17:10', 'ball', 24, 12], [1028, '2026-08-10 09:44', 'ball', 6, 11],
    [1029, '2026-08-12 14:05', 'hat', 24, 13], [1030, '2026-08-14 10:27', 'ball', 12, 10], [1031, '2026-08-18 15:52', 'hat', 144, 16],
    [1032, '2026-08-20 11:18', 'ball', 6, 9], [1033, '2026-08-24 13:41', 'ball', 12, 11], [1034, '2026-08-26 16:03', 'hat', 48, 10],
    [1035, '2026-08-29 10:36', 'ball', 18, 12]
  ];
  // People who saved a design besides the five signed-in buyers in admin.js: guests (counted once per browser) and
  // earlier signed-in buyers. `days`: how many days ago they first saved (from, to); `ordered`: paid within 30 days.
  var OTHER_SAVERS = [
    { who: 'guest', days: [0, 29], saved: 22, ordered: 0 },
    { who: 'signed-in', days: [30, 89], saved: 12, ordered: 8 },
    { who: 'guest', days: [30, 89], saved: 47, ordered: 4 }
  ];
  // The drift check's one example finding: a hat price break whose Shopify variant price was edited by hand.
  var DRIFT = { product: 'hat', tier: 48, shopify: 21, checked: '2026-09-29 06:00' };
  // =====================================================================================================================

  // ---- The window: today and the days before it ----
  var today = new Date(A.NOW.getFullYear(), A.NOW.getMonth(), A.NOW.getDate());
  var start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (period - 1));
  function inWindow(t) { return t >= start && t <= A.NOW; }
  function daysAgo(t) { return Math.round((today - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / DAY); }
  function dollars(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // ---- Every paid order, the shared September ones and the earlier samples, in one shape ----
  var orders = A.ORDERS.map(function (o) {
    var by = { ball: 0, hat: 0 };
    o.lines.forEach(function (l) { by[l.product] += l.qty * l.price; });
    var sent = A.stageTrail(o).some(function (s) { return s.stage === 'vendor'; });
    return { no: o.no, paid: A.at(o.placed), total: o.total, by: by, minutes: sent ? MINUTES[o.no] : null, waiting: o.stage === 'received' };
  }).concat(EARLIER.map(function (e) {
    var total = e[3] * A.tierFor(e[3], e[2]).price, by = { ball: 0, hat: 0 };
    by[e[2]] = total;
    return { no: e[0], paid: A.at(e[1]), total: total, by: by, minutes: e[4], waiting: false };
  }));
  var paid = orders.filter(function (o) { return inWindow(o.paid); }).sort(function (a, b) { return a.paid - b.paid; });

  // ---- 1. Design-to-order rate: buyers who saved a design in the window, and those who paid within 30 days of it ----
  var savers = 0, ordered = 0;
  Object.keys(A.BUYERS).forEach(function (id) {
    var saves = Object.keys(A.DESIGNS).map(function (c) { return A.DESIGNS[c]; })
      .filter(function (d) { return d.buyer === id && inWindow(A.at(d.created)); })
      .map(function (d) { return A.at(d.created); }).sort(function (a, b) { return a - b; });
    if (!saves.length) return;
    savers++;
    if (A.ORDERS.some(function (o) { var t = A.at(o.placed); return o.buyer === id && t >= saves[0] && t - saves[0] <= 30 * DAY; })) ordered++;
  });
  OTHER_SAVERS.forEach(function (g) {
    if (g.days[0] > period - 1) return;
    savers += g.saved; ordered += g.ordered;
  });
  var rate = savers ? Math.round(ordered / savers * 100) : 0;

  // ---- 2. Sales ----
  var revenue = paid.reduce(function (s, o) { return s + o.total; }, 0);
  var balls = paid.reduce(function (s, o) { return s + o.by.ball; }, 0), hats = revenue - balls;

  // ---- 3. Chuck's time per order: the median of the orders that reached Sent to vendor ----
  var timed = paid.filter(function (o) { return o.minutes != null; });
  var mins = timed.map(function (o) { return o.minutes; }).sort(function (a, b) { return a - b; });
  var median = !mins.length ? 0 : mins.length % 2 ? mins[(mins.length - 1) / 2] : Math.round((mins[mins.length / 2 - 1] + mins[mins.length / 2]) / 2);
  var waiting = paid.filter(function (o) { return o.waiting; }).length;

  // ================= Page head: the period switch and its dates =================
  out('periods').innerHTML = [30, 90].map(function (n) {
    return '<button type="button" data-period="' + n + '" aria-pressed="' + (n === period) + '">Last ' + n + ' days</button>';
  }).join('');
  out('dates').textContent = A.day(start) + ' to ' + A.day(today) + ', ' + today.getFullYear();
  out('periods').addEventListener('click', function (e) {
    var b = e.target.closest('[data-period]');
    if (!b || b.getAttribute('aria-pressed') === 'true') return;
    var p = new URLSearchParams(location.search);
    if (b.getAttribute('data-period') === '90') p.set('period', '90'); else p.delete('period');
    var q = p.toString();
    location.href = location.pathname + (q ? '?' + q : '');
  });

  // ================= Setup warning (only when Shopify doesn't match our price breaks) =================
  var ALERT = '<svg class="ic" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M8.7 4.2a1.5 1.5 0 0 1 2.6 0l5.6 9.8a1.5 1.5 0 0 1-1.3 2.2H4.4a1.5 1.5 0 0 1-1.3-2.2z"/><path d="M10 8v3.5"/><circle cx="10" cy="13.9" r=".4"/></svg>';
  if (!setupOk) {
    var prod = A.PRODUCTS[DRIFT.product], tier = prod.tiers.filter(function (t) { return t.min === DRIFT.tier; })[0];
    var unit = DRIFT.product === 'hat' ? 'a hat' : 'a dozen';
    out('setup').innerHTML =
      '<section class="sc-setup" aria-labelledby="setup-title">' +
        '<span class="review-note">Example: appears only when Shopify stops matching</span>' +
        '<span class="sc-setup-icon">' + ALERT + '</span>' +
        '<div class="sc-setup-body">' +
          '<h2 id="setup-title">A price in Shopify doesn’t match your price breaks</h2>' +
          '<p><strong>' + esc(prod.name) + ', ' + esc(tier.name) + ':</strong> Shopify charges ' + A.money(DRIFT.shopify) + ' ' + unit + ', but your pages show ' +
            A.money(tier.price) + '. Buyers see ' + A.money(tier.price) + ' while they design and pay ' + A.money(DRIFT.shopify) + ' at checkout.</p>' +
          '<div class="sc-setup-foot"><a class="btn" href="#" data-shopify>Open ' + esc(prod.name) + ' in Shopify</a>' +
            '<span>Set that price back to ' + A.money(tier.price) + ' on the product. Checked ' + A.when(DRIFT.checked).replace(/^Today/, 'today') + '.</span></div>' +
        '</div>' +
      '</section>';
  }
  document.querySelectorAll('[data-setup]').forEach(function (a) {
    if (a.getAttribute('data-setup') === (setupOk ? 'ok' : '')) a.setAttribute('aria-current', 'page');
  });

  // ================= The three rows =================
  function row(id, name, num, says, viz) {
    return '<div class="sc-row" data-metric="' + id + '">' +
      '<div class="sc-fig"><h2 class="sc-name">' + name + '</h2><p class="sc-num" data-num>' + num + '</p><p class="sc-says">' + says + '</p></div>' +
      '<figure class="sc-viz">' + viz + '</figure></div>';
  }

  // 1. Every saver as a dot; those who ordered first, filled.
  var dots = '';
  for (var i = 0; i < savers; i++) dots += '<i class="' + (i < ordered ? 'is-on' : '') + '"></i>';
  var rateViz =
    '<figcaption class="sc-cap">Each dot is a buyer who saved a design</figcaption>' +
    '<div class="sc-units" role="img" aria-label="' + savers + ' buyers saved a design; ' + ordered + ' of them ordered">' + dots + '</div>' +
    '<div class="sc-key"><span><i class="is-on"></i>Ordered, ' + ordered + '</span><span><i></i>Hasn’t ordered yet, ' + (savers - ordered) + '</span></div>' +
    '<p class="sc-note">Anyone who saved in the last 30 days can still order, so this rate can rise.</p>';

  // 2. Revenue by day (30 days) or by week (90 days), from zero, with clean gridlines.
  // Weekly bins run back from today, so the oldest one may be short; it starts on the window's first day.
  var bins = [], step = period === 30 ? 1 : 7;
  function ago(n) { return new Date(today.getFullYear(), today.getMonth(), today.getDate() - n); }
  for (var d = 0; d < period; d += step) {
    var near = d, far = Math.min(d + step - 1, period - 1);
    var inBin = paid.filter(function (o) { var n = daysAgo(o.paid); return n >= near && n <= far; });
    bins.unshift({ from: ago(far), to: ago(near), orders: inBin, total: inBin.reduce(function (s, o) { return s + o.total; }, 0) });
  }
  var top = Math.max.apply(null, bins.map(function (b) { return b.total; }).concat([1]));
  var raw = top / 3, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  var tick = [1, 2, 2.5, 5, 10].map(function (m) { return m * mag; }).filter(function (v) { return v >= raw; })[0];
  var ceil = Math.ceil(top / tick) * tick, ticks = [];
  for (var t = 0; t <= ceil + 0.5; t += tick) ticks.push(t);
  var labelAt = period === 30 ? [0, 7, 14, 21, 29] : [0, 4, 8, 12];
  var salesViz =
    '<figcaption class="sc-cap">Revenue by ' + (period === 30 ? 'day' : 'week') + '</figcaption>' +
    '<div class="sc-bars">' +
      '<div class="sc-grid" aria-hidden="true">' + ticks.map(function (v) {
        return '<span style="bottom:' + (v / ceil * 100) + '%"><b>' + dollars(v) + '</b></span>';
      }).join('') + '</div>' +
      '<div class="sc-cols" tabindex="0" data-marks role="img" aria-label="Revenue by ' + (period === 30 ? 'day' : 'week') + ', highest ' + dollars(top) + '. Use the arrow keys to read each ' + (period === 30 ? 'day' : 'week') + '.">' +
        bins.map(function (b, i) {
          var when = step === 1 ? A.day(b.from) : A.day(b.from) + ' to ' + A.day(b.to);
          var nos = b.orders.map(function (o) { return '#' + o.no; }).join(', ');
          return '<span class="sc-col" data-tip="' + esc(dollars(b.total) + '|' + when + '|' + (b.orders.length ? plural(b.orders.length, 'order', 'orders') + ': ' + nos : 'No orders')) + '">' +
            (b.total ? '<i style="height:' + (b.total / ceil * 100).toFixed(2) + '%"></i>' : '') + '</span>';
        }).join('') +
      '</div>' +
      '<div class="sc-x" aria-hidden="true">' + labelAt.map(function (i) {
        return '<span style="left:' + ((i + 0.5) / bins.length * 100).toFixed(2) + '%">' + A.day(bins[i].from) + '</span>';
      }).join('') + '</div>' +
    '</div>';

  // 3. Each timed order as a dot at its minutes, stacked where orders share a minute; the median marked.
  var maxX = Math.max(20, Math.ceil(Math.max.apply(null, mins.concat([0])) / 5) * 5), seen = {};
  var stack = 0;
  var marks = timed.slice().sort(function (a, b) { return a.minutes - b.minutes || a.no - b.no; }).map(function (o) {
    var k = seen[o.minutes] = (seen[o.minutes] || 0) + 1; stack = Math.max(stack, k);
    return '<span class="sc-dot" style="left:' + (o.minutes / maxX * 100).toFixed(2) + '%;bottom:' + ((k - 1) * 14) + 'px" data-tip="' +
      esc(o.minutes + ' min|Order #' + o.no + '|Paid ' + A.day(o.paid)) + '"></span>';
  }).join('');
  var xt = []; for (var m = 0; m <= maxX; m += 5) xt.push(m);
  var timeViz =
    '<figcaption class="sc-cap">Each dot is an order, placed at its hands-on minutes</figcaption>' +
    '<div class="sc-strip" style="--rows:' + stack + '">' +
      '<div class="sc-median" style="left:' + (median / maxX * 100).toFixed(2) + '%" aria-hidden="true"><b>Median ' + median + ' min</b></div>' +
      '<div class="sc-plot" tabindex="0" data-marks role="img" aria-label="' + plural(timed.length, 'order', 'orders') + ', from ' + mins[0] + ' to ' + mins[mins.length - 1] + ' minutes, median ' + median + '. Use the arrow keys to read each order.">' + marks + '</div>' +
      '<div class="sc-axis" aria-hidden="true">' + xt.map(function (v) {
        return '<span style="left:' + (v / maxX * 100) + '%">' + v + (v === maxX ? ' min' : '') + '</span>';
      }).join('') + '</div>' +
    '</div>' +
    (waiting ? '<p class="sc-note">' + plural(waiting, 'newer order is', 'newer orders are') + ' still in Received, so ' + (waiting === 1 ? 'it isn’t' : 'they aren’t') + ' counted yet.</p>' : '');

  out('card').innerHTML =
    row('rate', 'Design-to-order rate', rate + '%',
      ordered + ' of ' + savers + ' buyers who saved a design paid for an order within 30 days. Guests count once per browser.', rateViz) +
    row('sales', 'Sales', dollars(revenue),
      'From ' + plural(paid.length, 'custom order', 'custom orders') + ': golf balls ' + dollars(balls) + ', rope hats ' + dollars(hats) + '.', salesViz) +
    row('time', 'Your time per order', median + ' min',
      'Median hands-on time from paid to Sent to vendor, across ' + plural(timed.length, 'order', 'orders') + '.', timeViz);

  // ================= Hover and keyboard readouts for the bars and dots =================
  var tip = document.querySelector('.sc-tip');
  function show(mark) {
    // Anchor on the bar itself (a day without orders has none: its baseline), or on the dot.
    var p = mark.getAttribute('data-tip').split('|'), bar = mark.querySelector('i'), r = (bar || mark).getBoundingClientRect();
    if (mark.classList.contains('sc-col') && !bar) r = { left: r.left, width: r.width, top: r.bottom };
    tip.innerHTML = '<strong>' + esc(p[0]) + '</strong><span>' + esc(p[1]) + '</span><span>' + esc(p[2]) + '</span>';
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight, x = r.left + r.width / 2 - w / 2;
    tip.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px';
    tip.style.top = (r.top - h - 10) + 'px';
    document.querySelectorAll('.is-hot').forEach(function (m) { m.classList.remove('is-hot'); });
    mark.classList.add('is-hot');
  }
  function hide() { tip.hidden = true; document.querySelectorAll('.is-hot').forEach(function (m) { m.classList.remove('is-hot'); }); }
  document.querySelectorAll('[data-marks]').forEach(function (box) {
    var list = [].slice.call(box.querySelectorAll('[data-tip]')), at = list.length - 1;
    box.addEventListener('pointerover', function (e) { var m = e.target.closest('[data-tip]'); if (m) { at = list.indexOf(m); show(m); } });
    box.addEventListener('pointerleave', hide);
    box.addEventListener('focus', function () { show(list[at]); });
    box.addEventListener('blur', hide);
    box.addEventListener('keydown', function (e) {
      var k = { ArrowLeft: -1, ArrowRight: 1, Home: -at, End: list.length - 1 - at }[e.key];
      if (k === undefined) { if (e.key === 'Escape') hide(); return; }
      e.preventDefault(); at = Math.max(0, Math.min(list.length - 1, at + k)); show(list[at]);
    });
  });
  addEventListener('scroll', hide, { passive: true });
})();
