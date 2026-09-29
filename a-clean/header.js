// Store header (UI-01, D-101, D-106). Three jobs:
// 1. The Shop menu (any [data-menu] item): opens on hover (after a short pause, so a pointer passing over doesn't flash
//    it) or on its arrow button (click, Enter or Space), and closes on Escape, a click elsewhere, or when focus or the
//    pointer leaves. The word itself stays a link (Shop -> shop.html).
// 2. The menu's preview: the product under the pointer (or focus) in the list is shown large on the stage, and the stage
//    links to it. It opens on the page's own product when a row is marked aria-current (the designers), else the hat. The last one stays when the pointer leaves the list, so the picture never flickers back.
// 3. The scrolled state: past the top of the page the strip tightens to 64px (header.css, .is-scrolled).
(function () {
  var header = document.querySelector('[data-header]');
  if (!header) return;
  var items = [].slice.call(header.querySelectorAll('[data-menu]'));
  var hoverable = window.matchMedia('(hover: hover)');

  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('[aria-expanded]').setAttribute('aria-expanded', String(open));
  }
  function closeAll(except) { items.forEach(function (it) { if (it !== except) { clearTimeout(it._t); setOpen(it, false); } }); }

  items.forEach(function (item) {
    var toggle = item.querySelector('[aria-expanded]');
    toggle.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      closeAll(item); setOpen(item, open);
    });
    item.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || !hoverable.matches) return;
      clearTimeout(item._t);
      item._t = setTimeout(function () { closeAll(item); setOpen(item, true); }, 90);
    });
    item.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(item._t);
      item._t = setTimeout(function () { if (!item.contains(document.activeElement)) setOpen(item, false); }, 220);
    });
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) setOpen(item, false);
    });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && item.classList.contains('is-open')) { setOpen(item, false); toggle.focus(); }
    });

    // The preview: rows carry data-preview="<key>", the stage holds one <img data-preview-img="<key>"> per product
    var rows = [].slice.call(item.querySelectorAll('[data-preview]'));
    var stage = item.querySelector('[data-preview-stage]');
    if (!stage || !rows.length) return;
    function show(row) {
      var key = row.getAttribute('data-preview');
      rows.forEach(function (r) { r.classList.toggle('is-active', r === row); });
      [].slice.call(stage.querySelectorAll('[data-preview-img]')).forEach(function (img) {
        img.classList.toggle('is-shown', img.getAttribute('data-preview-img') === key);
      });
      stage.setAttribute('href', row.getAttribute('href'));
    }
    rows.forEach(function (row) {
      row.addEventListener('pointerenter', function () { show(row); });
      row.addEventListener('focus', function () { show(row); });
    });
    show(rows.find(function (r) { return r.getAttribute('aria-current') === 'page'; }) || rows[0]);   // the page's own product first, if it marks one
  });
  document.addEventListener('pointerdown', function (e) {
    if (!(e.target instanceof Element) || !e.target.closest('[data-menu]')) closeAll();
  });

  var ticking = false;
  function onScroll() {
    ticking = false;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
