// Shop all page (UI-03): product tiles with starting price, minimum and colors (D-34), category filters and sort.
// Sample catalog with example prices and minimums (balls from the ball designer; the rest until Chuck sets them, OQ-3, OQ-9).
(function () {
  'use strict';

  var BALL = '<svg viewBox="0 0 400 400" aria-hidden="true"><image href="../shared/ball.webp" width="400" height="400"/>' +
    '<g style="mix-blend-mode:multiply" fill="#1F4A36" text-anchor="middle" font-family="Figtree, sans-serif">' +
    '<text x="200" y="206" font-size="44" font-weight="800" letter-spacing="-1">Honors</text></g></svg>';

  var PRODUCTS = [
    // One hat, Forest with a white rope: buyers design only its patch (D-55).
    { name: 'The Honors Rope Hat', cat: 'hats', href: 'hat.html', each: 22, price: '$22 each', min: 24, minText: 'Minimum 24 per design',
      colors: [['Forest', '#1F4A36', 'img/hat-forest.webp']] },
    { name: 'Tour golf balls', cat: 'balls', href: './', each: 44 / 12, price: '$44 a dozen', min: 72, minText: 'Minimum 6 dozen per design', svg: BALL,
      colors: [['White', '#FFFFFF']] },
    { name: 'The performance polo', cat: 'apparel', href: 'apparel.html', each: 38, price: '$38 each', min: 12, minText: 'Minimum 12 per design', polo: true,
      colors: [['White', '#FFFFFF'], ['Navy', '#232B40'], ['Forest', '#1F4A36'], ['Black', '#262626'], ['Grey', '#A3A6A8']] },
    { name: 'Stainless tumbler', cat: 'accessories', href: 'accessory.html', each: 19, price: '$19 each', min: 24, minText: 'Minimum 24 per design', pad: true,
      colors: [['Forest', '#1F4A36', 'img/tumbler-forest.webp'], ['White', '#EFEDE8', 'img/tumbler-white.webp'], ['Black', '#262626', 'img/tumbler-black.webp'], ['Stainless', '#C9CCCF', 'img/tumbler-steel.webp']] },
    { name: 'Waffle golf towel', cat: 'accessories', href: '#', each: 14, price: '$14 each', min: 24, minText: 'Minimum 24 per design',
      colors: [['Forest', '#1F4A36', 'img/towel-forest.webp'], ['White', '#F4F2EC', 'img/towel-white.webp'], ['Navy', '#232B40', 'img/towel-navy.webp']] },
    { name: 'Divot tool with ball marker', cat: 'accessories', href: '#', each: 6, price: '$6 each', min: 50, minText: 'Minimum 50 per design',
      colors: [['Stainless', '#C9CCCF', 'img/divot-tool.webp']] },
    { name: 'Enamel ball markers', cat: 'accessories', href: '#', each: 2.5, price: '$2.50 each', min: 100, minText: 'Minimum 100 per design',
      colors: [['Forest', '#1F4A36', 'img/ball-markers.webp'], ['Navy', '#232B40'], ['White', '#F4F2EC']] },
    { name: 'Wooden golf tees', cat: 'accessories', href: '#', each: 0.09, price: '$0.09 each', min: 500, minText: 'Minimum 500 per design',
      colors: [['Natural', '#D8B88A', 'img/tees.webp'], ['White', '#F4F2EC'], ['Forest', '#1F4A36']] }
  ];
  PRODUCTS.forEach(function (p, i) { p.order = i; });

  var TITLES = { all: ['Shop all', 'Hats, golf balls, apparel and accessories, all made with your logo.'],
    hats: ['Hats', 'The Honors rope hat with your own patch: your logo, text or monogram.'],
    balls: ['Golf balls', 'Printed with your logo, text or monogram. Sold by the dozen.'],
    apparel: ['Apparel', 'Polos with your logo on the left chest.'],
    accessories: ['Accessories', 'Tumblers, towels, divot tools, markers and tees, all with your logo.'] };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function firstImg(p) { var c = p.colors.filter(function (x) { return x[2]; })[0]; return c ? c[2] : ''; }

  function tileHtml(p) {
    var img = p.svg ? p.svg
      : p.polo ? '<img class="tile-polo" src="img/polo-front.webp" alt="">'
      : '<img src="' + firstImg(p) + '" alt="" data-tile-img' + (p.pad ? ' class="is-tall"' : '') + '>';
    var sw = p.colors.map(function (c, i) {
      return '<button type="button" class="sw" data-color="' + i + '" aria-label="' + esc(c[0]) + '" aria-pressed="' + (i === 0) + '"' + (c[2] ? '' : ' data-no-img') + '><span style="background:' + c[1] + '"></span></button>';
    }).join('');
    return '<li class="tile" data-cat="' + p.cat + '">' +
      '<a class="tile-link" href="' + p.href + '"><span class="tile-img' + (p.polo ? ' is-polo' : '') + '">' + img + '</span>' +
      '<span class="tile-name">' + esc(p.name) + '</span>' +
      '<span class="tile-price">From ' + esc(p.price) + '</span>' +
      '<span class="tile-min">' + esc(p.minText) + '</span></a>' +
      '<div class="swatches-row"><div class="sw-group" role="group" aria-label="Colors for ' + esc(p.name) + '">' + sw + '</div>' +
      '<span class="sw-label" data-sw-label>' + esc(p.colors[0][0]) + (p.more ? ' <span class="sw-more">+' + p.more + ' more colors</span>' : '') + '</span></div>' +
      '</li>';
  }

  var grid = document.getElementById('products'), sortSel = document.getElementById('sort');
  var params = new URLSearchParams(location.search);
  var filter = TITLES[params.get('c')] ? params.get('c') : 'all';

  function render() {
    var list = PRODUCTS.filter(function (p) { return filter === 'all' || p.cat === filter; });
    var s = sortSel.value;
    list.sort(function (a, b) {
      if (s === 'price-asc') return a.each - b.each;
      if (s === 'price-desc') return b.each - a.each;
      if (s === 'min-asc') return a.min - b.min;
      return a.order - b.order;
    });
    grid.innerHTML = list.map(tileHtml).join('');
    grid.querySelectorAll('.tile').forEach(function (li, i) { li._p = list[i]; });
    document.getElementById('count').textContent = list.length + (list.length === 1 ? ' product' : ' products');
    document.getElementById('shop-title').textContent = TITLES[filter][0];
    document.getElementById('shop-lede').textContent = TITLES[filter][1];
    document.getElementById('crumb-current').textContent = TITLES[filter][0];
    document.title = TITLES[filter][0] + ' | Honors Golf Supply';
    document.querySelectorAll('[data-filter]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === filter)); });
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === filter) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.getAttribute('data-filter');
      history.replaceState(null, '', filter === 'all' ? 'shop.html' : 'shop.html?c=' + filter);
      render();
    });
  });
  sortSel.addEventListener('change', render);

  // A color swatch switches the tile's picture when that color has a render, and names the color.
  grid.addEventListener('click', function (e) {
    var sw = e.target.closest('.sw'); if (!sw) return;
    var li = sw.closest('.tile'), p = li._p, c = p.colors[Number(sw.getAttribute('data-color'))];
    li.querySelectorAll('.sw').forEach(function (b) { b.setAttribute('aria-pressed', String(b === sw)); });
    var img = li.querySelector('[data-tile-img]');
    if (img && c[2]) img.src = c[2];
    li.querySelector('[data-sw-label]').innerHTML = esc(c[0]) + (c[2] || p.svg ? '' : ' <span class="sw-more">(shown in ' + esc(p.colors[0][0]).toLowerCase() + ')</span>') + (p.more ? ' <span class="sw-more">+' + p.more + ' more colors</span>' : '');
  });

  render();
})();
