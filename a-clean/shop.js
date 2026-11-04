// Shop all page (UI-03): product tiles with starting price, minimum and colors (D-34), category filters and sort.
// Sample catalog after the lock: six categories (D-115), every hat style and colorway (D-130), brands (D-116 to D-119).
// Prices and minimums are examples (balls from the ball designer; the rest until Chuck sets them, OQ-3, OQ-9).
(function () {
  'use strict';

  // Each ball tile shows its brand's ball (session 12, D-146), with YOUR LOGO printed on it (D-145).
  var BALL_FOR = function (img) { return BALL.replace('../shared/ball.webp', img); };
  var BALL = '<svg viewBox="0 0 400 400" aria-hidden="true"><image href="../shared/ball.webp" width="400" height="400"/>' +
    '<g style="mix-blend-mode:multiply" fill="#1F4A36" text-anchor="middle" font-family="Figtree, sans-serif">' +
    '<text x="200" y="212" font-size="34" font-weight="800" letter-spacing="1.5">YOUR LOGO</text></g></svg>';

  // Hat swatches: the crown, with the rope across one corner on rope styles. Every swatch color is our approximation of
  // the colorway's name (photographed hats were sampled from the photo), not a brand color value.
  function hat(crown, rope) { return rope ? 'linear-gradient(135deg, ' + crown + ' 0 60%, ' + rope + ' 60% 100%)' : crown; }
  var WHITE = '#F4F4F6', ROPE_W = '#F4F2EC', NAVY = '#232B40', BLACK = '#262626', GREEN = '#2E8B57', RED = '#C8343C', POWDER = '#A9C8E8';

  var PRODUCTS = [
    // Hats (D-130): four styles, each colorway picked as made, with its rope where it has one; decorated with a patch or
    // direct embroidery. Colorways as the B2B hat survey lists them (docs/research/2026-10-30-b2b-hat-survey.md). The
    // Origin shows our renders of its 3D model where one exists (D-135); the other three show the B2B store's photos.
    // Which hats Honors sells, and under whose label, is Chuck's (OQ-8). Prices are examples (OQ-3).
    { name: 'The Origin', kind: 'Structured 5-panel rope hat', cat: 'hats', href: 'hat.html?style=the-origin', each: 22, price: '$22 each', min: 24, minText: 'Minimum 24 per design',
      colors: [['Slate / White Rope', hat('#5F6B78', ROPE_W), 'img/hat-origin-001.webp'], ['White / Navy Rope', hat(WHITE, '#23305A'), 'img/hat-origin-002.webp'],
        ['White / Blue-White Dash Rope', hat(WHITE, '#3A6FB0')], ['Grey / White Rope', hat('#46474A', ROPE_W)],
        ['Navy / White Rope', hat(NAVY, ROPE_W), 'img/hat-rope-navy.webp'], ['Powder Blue / White-Red Twist Rope', hat(POWDER, RED)],
        ['Black / White-Black Dash Rope', hat(BLACK, ROPE_W)], ['Powder Blue / White Rope', hat(POWDER, ROPE_W), 'img/hat-origin-008.webp'],
        ['White / Black-White Dash Rope', hat(WHITE, BLACK)], ['White / Navy-White Dash Rope', hat(WHITE, '#23305A')],
        ['White / Green-White Dash Rope', hat(WHITE, GREEN)], ['Black / Black-White Twist Rope', hat(BLACK, '#9A9A9A')],
        ['White / Red-White-Blue Rope', hat(WHITE, RED)], ['White Camo / White Rope', hat('#DADCE0', ROPE_W)],
        ['White Camo / Navy Rope', hat('#DADCE0', '#23305A')], ['Grey / Navy Rope', hat('#B9BDC1', '#23305A'), 'img/hat-origin-016.webp'],
        ['Grey / White-Black Dash Rope', hat('#B9BDC1', BLACK)], ['White / Orange-White Dash Rope', hat(WHITE, '#E07A2E')],
        ['White / Black-White Twist Rope', hat(WHITE, '#555555')], ['White / Black Rope', hat(WHITE, BLACK), 'img/hat-origin-020.webp'],
        ['White / Green Rope', hat(WHITE, GREEN), 'img/hat-origin-021.webp'], ['White / Forest Green Rope', hat(WHITE, '#1F4A36'), 'img/hat-rope-white.webp'],
        ['Black / White Rope', hat(BLACK, ROPE_W), 'img/hat-rope-black.webp'], ['Powder Blue / Red Rope', hat(POWDER, RED), 'img/hat-origin-026.webp'],
        ['Bone-Slate / Green Rope', hat('#E6DFCF', GREEN)], ['White-Gold / Gold Rope', hat(WHITE, '#C9A245')],
        ['Bone-Green / Brown Rope', hat('#E6DFCF', '#7A5233')], ['Green Camo / Black Rope', hat('#5E6B4A', BLACK)],
        ['Brown Camo / Brown Rope', hat('#7A6650', '#7A5233')]] },
    { name: 'The Local', kind: 'Unstructured 5-panel rope hat', cat: 'hats', href: 'hat.html?style=the-local', each: 22, price: '$22 each', min: 24, minText: 'Minimum 24 per design',
      colors: [['White-Green / Green Rope', hat(WHITE, GREEN), 'img/hat-local-001.webp'], ['Navy / White Rope', hat('#282747', ROPE_W), 'img/hat-local-002.webp'],
        ['White-Powder Blue / Red Rope', hat('#E3ECF3', RED), 'img/hat-local-003.webp'], ['White / Black-Blue Rope', hat(WHITE, '#2B3A5E'), 'img/hat-local-004.webp']] },
    { name: 'The Axis', kind: 'Structured 6-panel hat', cat: 'hats', href: 'hat.html?style=the-axis', each: 22, price: '$22 each', min: 24, minText: 'Minimum 24 per design',
      colors: [['White', WHITE, 'img/hat-axis-001.webp'], ['Navy', '#1B203C', 'img/hat-axis-002.webp'], ['Powder Blue', '#98BAD7', 'img/hat-axis-003.webp'],
        ['Stone', '#8E9587', 'img/hat-axis-004.webp'], ['Black', '#171718', 'img/hat-axis-005.webp'], ['Desert Tan', '#AB906B', 'img/hat-axis-006.webp'],
        ['Grey', '#494848', 'img/hat-axis-007.webp'], ['White Camo', '#DADCE0', 'img/hat-axis-008.webp'], ['Pink', '#EFC7CA', 'img/hat-axis-009.webp'],
        // 010 is tagged "Pink" on the B2B store, like 009, but its photo shows a mint hat: the swatch follows the photo (OQ-8, for Chuck)
        ['Pink', '#B9D7D8', 'img/hat-axis-010.webp'], ['Bone', '#EBE8DC', 'img/hat-axis-011.webp']] },
    { name: 'The Performance Dad', kind: 'Unstructured low-profile hat', cat: 'hats', href: 'hat.html?style=the-performance-dad', each: 22, price: '$22 each', min: 24, minText: 'Minimum 24 per design',
      colors: [['White', WHITE, 'img/hat-dad-001.webp'], ['Black', '#1E1F1F', 'img/hat-dad-002.webp'], ['Grey', '#63696C', 'img/hat-dad-003.webp'],
        ['Slate', '#587CA1', 'img/hat-dad-004.webp'], ['Beige', '#E8DFD5', 'img/hat-dad-005.webp'], ['Navy', '#252836', 'img/hat-dad-006.webp'],
        ['Light Blue', '#CCDDF3', 'img/hat-dad-007.webp'], ['Purple', '#B5A9BD', 'img/hat-dad-008.webp']] },
    // Golf balls (D-116): Titleist or Callaway, one ball each, chosen by Chuck. Our ball render stands in until Chuck
    // sends real photos; a brand is named in words only, never drawn on the product.
    { name: 'Titleist golf balls', brand: 'Titleist', cat: 'balls', href: './?brand=titleist', each: 44 / 12, price: '$44 a dozen', min: 72, minText: 'Minimum 6 dozen per design', svg: BALL_FOR('../shared/ball-titleist.webp'),
      colors: [['White', '#FFFFFF']] },
    { name: 'Callaway golf balls', brand: 'Callaway', cat: 'balls', href: './?brand=callaway', each: 44 / 12, price: '$44 a dozen', min: 72, minText: 'Minimum 6 dozen per design', svg: BALL_FOR('../shared/ball-callaway.webp'),
      colors: [['White', '#FFFFFF']] },
    // Tumblers (D-117): one per brand, chosen by Chuck. Each brand's own product photos, logos painted out, stand in
    // until his (session 14; the same pictures as the tumbler page, at tile size).
    { name: 'Brawn & Fox tumbler', brand: 'Brawn & Fox', cat: 'tumblers', href: 'accessory.html?brand=brawn-and-fox', each: 19, price: '$19 each', min: 24, minText: 'Minimum 24 per design', pad: true,
      colors: [['White', '#F2F2F0', 'img/tumbler-brawn-and-fox-white-tile.webp']] },
    { name: 'Stanley tumbler', brand: 'Stanley', cat: 'tumblers', href: 'accessory.html?brand=stanley', each: 19, price: '$19 each', min: 24, minText: 'Minimum 24 per design', pad: true,
      colors: [['Stainless Steel Ash', '#B9BCBE', 'img/tumbler-stanley-steel-tile.webp'], ['Frost', '#ECECE8', 'img/tumbler-stanley-white-tile.webp'], ['Black', '#232323', 'img/tumbler-stanley-black-tile.webp'], ['Dried Pine', '#7E8F6E', 'img/tumbler-stanley-green-tile.webp']] },
    { name: 'Corkcicle tumbler', brand: 'Corkcicle', cat: 'tumblers', href: 'accessory.html?brand=corkcicle', each: 19, price: '$19 each', min: 24, minText: 'Minimum 24 per design', pad: true,
      colors: [['Gloss White', '#F3F3F1', 'img/tumbler-corkcicle-white-tile.webp'], ['Matte Black', '#3A3B3D', 'img/tumbler-corkcicle-black-tile.webp'], ['Gloss Midnight Navy', '#1C2550', 'img/tumbler-corkcicle-navy-tile.webp'], ['Oat Milk', '#E8E3D8', 'img/tumbler-corkcicle-oat-tile.webp']] },
    // Apparel (D-119): a polo from each brand, ending in a quote request, so no price. Our polo render stands in for each.
    { name: 'Straight Down polo', brand: 'Straight Down', cat: 'apparel', href: 'apparel.html?brand=straight-down', each: null, price: 'Priced by quote', min: 12, minText: 'Minimum 12 per design',
      colors: [['White', '#FFFFFF', 'img/polo-white-yourlogo.webp'], ['Navy', '#232B40', 'img/polo-navy-yourlogo.webp'], ['Grey', '#A3A6A8', 'img/polo-grey-yourlogo.webp']] },
    { name: 'Redvanly polo', brand: 'Redvanly', cat: 'apparel', href: 'apparel.html?brand=redvanly', each: null, price: 'Priced by quote', min: 12, minText: 'Minimum 12 per design',
      colors: [['Navy', '#232B40', 'img/polo-navy-yourlogo.webp'], ['White', '#FFFFFF', 'img/polo-white-yourlogo.webp'], ['Black', '#262626', 'img/polo-black-yourlogo.webp']] },
    { name: 'Peter Millar polo', brand: 'Peter Millar', cat: 'apparel', href: 'apparel.html?brand=peter-millar', each: null, price: 'Priced by quote', min: 12, minText: 'Minimum 12 per design',
      colors: [['Forest', '#1F4A36', 'img/polo-forest-yourlogo.webp'], ['White', '#FFFFFF', 'img/polo-white-yourlogo.webp'], ['Navy', '#232B40', 'img/polo-navy-yourlogo.webp']] },
    { name: 'Holderness & Bourne polo', brand: 'Holderness & Bourne', cat: 'apparel', href: 'apparel.html?brand=holderness-and-bourne', each: null, price: 'Priced by quote', min: 12, minText: 'Minimum 12 per design',
      colors: [['Black', '#262626', 'img/polo-black-yourlogo.webp'], ['White', '#FFFFFF', 'img/polo-white-yourlogo.webp'], ['Grey', '#A3A6A8', 'img/polo-grey-yourlogo.webp']] },
    // Towels and Caddy Kit (D-118): from Brawn & Fox, designed and ordered at checkout; their pages are new screens (UI-14,
    // UI-15). The towel shows Brawn & Fox's own MagnaTowel photos, marks painted out, as stand-ins until Chuck's (session 15;
    // the same pictures as the towel page, at tile size).
    { name: 'Brawn & Fox golf towel', brand: 'Brawn & Fox', cat: 'towels', href: 'towel.html', each: 14, price: '$14 each', min: 24, minText: 'Minimum 24 per design',
      colors: [['White', '#EDEDED', 'img/towel-bf-white-tile.webp'], ['Black', '#282828', 'img/towel-bf-black-tile.webp'], ['Blue Camo', '#4D6384', 'img/towel-bf-blue-camo-tile.webp'], ['Green Camo', '#4D5F4D', 'img/towel-bf-green-camo-tile.webp']] },
    // The caddy kit is Brawn & Fox's hard zip case (owner, session 15), shown upright as on its page.
    { name: 'Brawn & Fox caddy kit', brand: 'Brawn & Fox', cat: 'caddy-kit', href: 'caddy.html', each: 32, price: '$32 a kit', min: 24, minText: 'Minimum 24 per design', pad: true,
      colors: [['White', '#F5F7FB', 'img/caddy-bf-white-tile.webp'], ['Black', '#2C272B', 'img/caddy-bf-black-tile.webp'], ['Blue', '#13529E', 'img/caddy-bf-blue-tile.webp'], ['Green Camo', '#373F49', 'img/caddy-bf-green-camo-tile.webp']] }
  ];
  PRODUCTS.forEach(function (p, i) { p.order = i; });

  var TITLES = { all: ['Shop all', 'Hats, golf balls, tumblers, apparel, towels and caddy kits, all made with your logo.'],
    hats: ['Hats', 'Four styles, each picked as it\u2019s made, with your patch or direct embroidery.'],
    balls: ['Golf balls', 'Titleist or Callaway, printed with your logo, text or monogram. Sold by the dozen.'],
    tumblers: ['Tumblers', 'Brawn & Fox, Stanley or Corkcicle, laser-engraved with your logo.'],
    apparel: ['Apparel', 'Polos from four golf brands with your logo. Design yours, then send it to us for a quote.'],
    towels: ['Towels', 'Golf towels from Brawn & Fox, with your logo.'],
    'caddy-kit': ['Caddy Kit', 'Bag essentials from Brawn & Fox, with your logo, in one kit for every player.'] };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function firstImg(p) { var c = p.colors.filter(function (x) { return x[2]; })[0]; return c ? c[2] : ''; }

  function tileHtml(p) {
    var img = p.svg ? p.svg
      : p.polo ? '<img class="tile-polo" src="img/polo-front.webp" alt="">'
      : '<img src="' + firstImg(p) + '" alt="" data-tile-img' + (p.pad ? ' class="is-tall"' : '') + '>';
    var sw = p.colors.map(function (c, i) {
      return '<button type="button" class="sw" data-color="' + i + '" aria-label="' + esc(c[0]) + '" aria-pressed="' + (i === 0) + '"' + (c[2] ? '' : ' data-no-img') + '><span style="background:' + c[1] + '"></span></button>';
    }).join('');
    return '<li class="tile" data-cat="' + p.cat + '"' + (p.brand ? ' data-brand="' + esc(p.brand) + '"' : '') + '>' +
      '<a class="tile-link" href="' + p.href + '"><span class="tile-img' + (p.polo ? ' is-polo' : '') + '">' + img + '</span>' +
      '<span class="tile-name">' + esc(p.name) + '</span>' +
      (p.kind ? '<span class="tile-kind">' + esc(p.kind) + '</span>' : '') +
      '<span class="tile-price">' + (p.each == null ? '' : 'From ') + esc(p.price) + '</span>' +
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
      var far = s === 'price-asc' ? Infinity : -Infinity;   // priced by quote: last either way
      var pa = a.each == null ? far : a.each, pb = b.each == null ? far : b.each;
      if (s === 'price-asc') return pa - pb || a.order - b.order;
      if (s === 'price-desc') return pb - pa || a.order - b.order;
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

  // A color swatch switches the tile's picture to that color's render or photo and names the color. A color without a
  // picture yet shows the first color's picture and says so.
  grid.addEventListener('click', function (e) {
    var sw = e.target.closest('.sw'); if (!sw) return;
    var li = sw.closest('.tile'), p = li._p, c = p.colors[Number(sw.getAttribute('data-color'))];
    li.querySelectorAll('.sw').forEach(function (b) { b.setAttribute('aria-pressed', String(b === sw)); });
    var img = li.querySelector('[data-tile-img]');
    if (img) img.src = c[2] || firstImg(p);
    li.querySelector('[data-sw-label]').innerHTML = esc(c[0]) + (c[2] || p.svg ? '' : ' <span class="sw-more">(picture to come)</span>') + (p.more ? ' <span class="sw-more">+' + p.more + ' more colors</span>' : '');
  });

  render();
})();
