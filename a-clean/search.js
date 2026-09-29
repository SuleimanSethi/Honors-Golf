// Search results (UI-07): find products by name in the sample catalog.
// shop.js (loaded first, unchanged) renders every product as its approved Shop all tile into #products and keeps
// each tile's product on li._p; this script only shows the tiles that match the query, live as the buyer types.
// A query matches when each of its words starts a word in the product's name or its category.
// Review views: ?q=ball (results) and ?q=umbrella (no match). With no query, every product shows.
(function () {
  'use strict';

  var CATEGORY = { hats: 'Hats', balls: 'Golf balls', apparel: 'Apparel', accessories: 'Accessories' };  // the header's names
  var input = document.getElementById('q');
  var clear = document.querySelector('[data-clear]');
  var count = document.getElementById('search-count');
  var none = document.querySelector('[data-none]');
  var tiles = [].slice.call(document.querySelectorAll('#products .tile'));

  function words(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean)
      .map(function (w) { return w.length > 3 ? w.replace(/s$/, '') : w; });   // "hats" finds "hat", "tees" finds "tee"
  }
  tiles.forEach(function (li) { li._words = words(li._p.name + ' ' + CATEGORY[li._p.cat]); });

  function matches(li, q) {
    return q.every(function (w) { return li._words.some(function (v) { return v.indexOf(w) === 0; }); });
  }

  function quoted(s) { return '“' + s + '”'; }

  function update(push) {
    var raw = input.value.trim(), q = words(raw), n = 0;
    tiles.forEach(function (li) { var on = !q.length || matches(li, q); li.hidden = !on; if (on) n++; });
    clear.hidden = !raw;
    none.hidden = !(q.length && !n);
    document.body.classList.toggle('no-match', !none.hidden);
    if (!q.length) count.textContent = 'All ' + tiles.length + ' products';
    else if (!n) count.textContent = 'No products match ' + quoted(raw) + '.';
    else count.textContent = n + (n === 1 ? ' product' : ' products') + ' for ' + quoted(raw);
    document.title = (raw ? 'Search: ' + raw : 'Search') + ' | Honors Golf Supply';
    if (push !== false) history.replaceState(null, '', raw ? 'search.html?q=' + encodeURIComponent(raw) : 'search.html');
    document.querySelectorAll('.review-switch [data-q]').forEach(function (a) {
      if (a.getAttribute('data-q') === raw) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  input.addEventListener('input', function () { update(); });
  input.form.addEventListener('submit', function (e) { e.preventDefault(); update(); });
  clear.addEventListener('click', function () { input.value = ''; update(); input.focus(); });
  // On this page the header's search button goes to the search field
  var headerSearch = document.querySelector('.top button[aria-label="Search"]');
  if (headerSearch) headerSearch.addEventListener('click', function () { input.focus(); input.select(); });

  input.value = new URLSearchParams(location.search).get('q') || '';
  update(false);
  if (!input.value) input.focus();
})();
