// UI-57 Buyers list and (later) UI-58 Buyer detail (spec C-9; D-35, D-67). Shared by buyers.html and buyer.html.
// A buyer is someone who signed in to save a design, so we have their name and email. Designs and orders without a buyer
// (`buyer` null or missing in admin.js) belong to "guests", shown together as one row with no email (C-9 known limit);
// the row appears only when the data has some. Sample data from admin.js; nothing is saved.
(function () {
  'use strict';
  var A = window.HonorsAdmin, esc = A.esc;

  var designs = Object.keys(A.DESIGNS).map(function (c) { return A.DESIGNS[c]; });

  function newest(key) { return function (a, b) { return A.at(b[key]) - A.at(a[key]); }; }

  // ---- One buyer (or 'guest') in numbers: designs newest first, the ones never ordered, orders, spend, last activity ----
  function summary(id) {
    var guest = id === 'guest', b = guest ? null : A.BUYERS[id];
    var mine = designs.filter(function (d) { return guest ? !d.buyer : d.buyer === id; }).sort(newest('created'));
    var orders = A.ORDERS.filter(function (o) { return guest ? !o.buyer : o.buyer === id; });
    var events = [];
    mine.forEach(function (d) {
      events.push({ at: d.created, text: 'Saved ' + d.code });
      if (d.cart) events.push({ at: d.cart.at, text: 'Added ' + d.code + ' to cart' });
    });
    orders.forEach(function (o) { events.push({ at: o.placed, text: 'Placed order #' + o.no }); });
    events.sort(newest('at'));
    return {
      id: id, guest: guest, name: guest ? 'Guests' : b.name, club: guest ? 'Saved without signing in' : b.club, email: guest ? '' : b.email,
      designs: mine, open: mine.filter(function (d) { return !d.order; }), orders: orders,
      spent: orders.reduce(function (s, o) { return s + o.total; }, 0), last: events[0] || null
    };
  }
  var buyers = Object.keys(A.BUYERS).map(summary), guests = summary('guest');
  guests.any = guests.designs.length + guests.orders.length > 0;
  var api = { designs: designs, summary: summary, buyers: buyers, guests: guests };
  window.HonorsBuyers = api;

  if (document.body.getAttribute('data-admin-page') !== 'buyers' || !document.querySelector('[data-out="table"]')) return;

  // ================= UI-57 Buyers list =================
  var params = new URLSearchParams(location.search);
  var SORTS = {
    last: { name: 'Last activity', dir: 'desc', key: function (x) { return x.last ? A.at(x.last.at).getTime() : 0; } },
    name: { name: 'Buyer', dir: 'asc', key: function (x) { return x.name.toLowerCase(); } },
    designs: { name: 'Designs', dir: 'desc', key: function (x) { return x.designs.length; } },
    orders: { name: 'Orders', dir: 'desc', key: function (x) { return x.orders.length; } },
    spent: { name: 'Amount spent', dir: 'desc', key: function (x) { return x.spent; } }
  };
  var TABS = [
    { id: 'all', name: 'All buyers', test: function () { return true; } },
    { id: 'never-ordered', name: 'With never-ordered designs', test: function (x) { return x.open.length > 0; } }
  ];
  var state = {
    tab: TABS.some(function (t) { return t.id === params.get('tab'); }) ? params.get('tab') : 'all',
    q: params.get('q') || '',
    sort: SORTS[params.get('sort')] ? params.get('sort') : 'last'
  };
  state.dir = params.get('dir') === 'asc' || params.get('dir') === 'desc' ? params.get('dir') : SORTS[state.sort].dir;

  var out = function (n) { return document.querySelector('[data-out="' + n + '"]'); };
  var search = document.getElementById('buyer-search');
  search.value = state.q;
  var ARROW = '<svg class="ic sort-arrow" width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4.5v11M5.5 11l4.5 4.5 4.5-4.5"/></svg>';

  function matches(x, q) {
    if (!q) return true;
    q = q.toLowerCase();
    return [x.name, x.club, x.email, x.guest ? 'guest' : ''].some(function (s) { return s.toLowerCase().indexOf(q) !== -1; });
  }
  function head(id, extra) {
    var s = SORTS[id], on = state.sort === id;
    return '<th class="col-' + id + (extra ? ' ' + extra : '') + (on ? ' is-sorted' : '') + '"' + (on ? ' aria-sort="' + (state.dir === 'asc' ? 'ascending' : 'descending') + '"' : '') + '>' +
      '<button type="button" class="sort' + (on && state.dir === 'asc' ? ' is-asc' : '') + '" data-sort="' + id + '">' + s.name + ARROW + '</button></th>';
  }
  // The buyer's goods: up to three saved designs (newest first) as the real product, fanned.
  function fan(list) {
    return '<span class="fan">' + list.slice(0, 3).map(function (d) { return A.thumb(d).replace('<span class="thumb"', '<span class="thumb" title="' + d.code + '"'); }).join('') + '</span>';
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function row(x, focus) {
    var href = 'buyer.html?buyer=' + x.id, shown = focus ? x.open : x.designs, n = x.designs.length, open = x.open.length;
    var designWords = focus
      ? '<span>' + plural(open, 'design', 'designs') + ' never ordered</span><span class="subdued">of ' + n + ' saved</span>'
      : '<span>' + n + ' saved</span><span class="subdued">' + (open === 0 ? 'All ordered' : open === n ? 'None ordered' : open + ' never ordered') + '</span>';
    return '<tr data-href="' + href + '">' +
      '<td class="col-goods">' + fan(shown) + '</td>' +
      '<td><div class="cell-2"><a class="row-link" href="' + href + '">' + esc(x.name) + '</a><span class="subdued">' + esc(x.club) + '</span></div></td>' +
      '<td>' + (x.guest ? '<span class="subdued">No email</span>' : '<a class="buyer-email" href="mailto:' + esc(x.email) + '">' + esc(x.email) + '</a>') + '</td>' +
      '<td><div class="cell-2 nowrap">' + designWords + '</div></td>' +
      '<td class="num">' + x.orders.length + '</td>' +
      '<td class="num">' + A.money(x.spent) + '</td>' +
      '<td>' + (x.last ? '<div class="cell-2"><span class="nowrap">' + A.when(x.last.at) + '</span><span class="subdued nowrap">' + esc(x.last.text) + '</span></div>' : '') + '</td>' +
      '</tr>';
  }

  function render() {
    var tab = TABS.filter(function (t) { return t.id === state.tab; })[0], focus = tab.id === 'never-ordered', q = state.q.trim();
    out('tabs').innerHTML = TABS.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (t.id === state.tab) + '" data-tab="' + t.id + '">' + t.name +
        ' <span class="n">' + buyers.filter(t.test).length + '</span></button>';
    }).join('');

    var s = SORTS[state.sort], sign = state.dir === 'asc' ? 1 : -1;
    var list = buyers.filter(tab.test).filter(function (x) { return matches(x, q); }).sort(function (a, b) {
      var ka = s.key(a), kb = s.key(b);
      return (ka < kb ? -1 : ka > kb ? 1 : 0) * sign || a.name.localeCompare(b.name);
    });
    var showGuests = !focus && guests.any && matches(guests, q);

    var none = !list.length && !showGuests;   // a search with no match: the message alone, without headings
    var html = '<table class="table btable">' + (none ? '' : '<thead><tr><th class="col-goods"><span class="visually-hidden">Saved designs</span></th>' +
      head('name') + '<th class="col-email">Email</th>' + head('designs') + head('orders', 'num') + head('spent', 'num') + head('last') + '</tr></thead>');
    html += '<tbody>' + list.map(function (x) { return row(x, focus); }).join('');
    if (none) {
      html += '<tr class="is-empty"><td colspan="7"><p class="strong">No buyers match “' + esc(q) + '”</p>' +
        '<p class="subdued">Try a name, a club or part of an email address.</p>' +
        '<button type="button" class="btn" data-clear>Clear search</button></td></tr>';
    }
    html += '</tbody>';
    if (showGuests) html += '<tbody class="guests">' + row(guests, false) + '</tbody>';
    out('table').innerHTML = html + '</table>';

    // Keep the view in the address so a reload (or a link) opens it the same way.
    var p = [];
    if (state.tab !== 'all') p.push('tab=' + state.tab);
    if (q) p.push('q=' + encodeURIComponent(q));
    if (state.sort !== 'last' || state.dir !== SORTS.last.dir) p.push('sort=' + state.sort, 'dir=' + state.dir);
    history.replaceState(null, '', 'buyers.html' + (p.length ? '?' + p.join('&') : ''));
  }

  out('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]'); if (!b) return;
    state.tab = b.getAttribute('data-tab'); render();
    out('tabs').querySelector('[data-tab="' + state.tab + '"]').focus();
  });
  out('table').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sort]');
    if (b) {
      var id = b.getAttribute('data-sort');
      if (state.sort === id) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
      else { state.sort = id; state.dir = SORTS[id].dir; }
      render();
      out('table').querySelector('[data-sort="' + id + '"]').focus();
      return;
    }
    if (e.target.closest('[data-clear]')) { state.q = ''; search.value = ''; render(); search.focus(); }
  });
  search.addEventListener('input', function () { state.q = search.value; render(); });

  render();
})();
