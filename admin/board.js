// UI-51 Production board (spec C-7; D-31, D-67): the same paid orders in two views.
// Kanban (default): three working columns (Received, Sent to vendor, In production) and a narrow Shipped column; an order
// on hold stays in the column where it paused, marked On hold. List: an index table filtered by stage with tabs.
// Both: a one-click move to the next stage with Undo, the ⋯ menu (buyer, any stage, who and when), and Shipped only
// through a Shopify fulfillment ("Fulfill in Shopify" simulates it). ?view=kanban|list, ?stage=<id> (highlight in
// Kanban, filter in List). Nothing is saved: moves last until the page is reloaded.
(function () {
  'use strict';
  var A = window.HonorsAdmin, esc = A.esc, icon = A.icon, badge = A.badge;
  var NOW_S = '2026-09-29 11:40';            // the sample clock (admin.js NOW)
  var params = new URLSearchParams(location.search);
  var view = params.get('view') === 'list' ? 'list' : 'kanban';
  var picked = params.get('stage') || '';
  var out = document.querySelector('[data-out="board"]'), views = document.querySelector('[data-out="views"]');
  var toast = document.querySelector('.admin-toast'), toastTimer = null, undo = null, openMenu = null;
  var month = new Date(A.NOW - 30 * 864e5);
  var ORDER = ['received', 'vendor', 'production', 'hold', 'shipped'];
  // The next move from each stage, and the toast's words once it's done.
  var MOVES = {
    received: { to: 'vendor', label: 'Send to vendor', done: 'sent to vendor' },
    vendor: { to: 'production', label: 'Mark in production', done: 'marked in production' },
    production: { to: 'shipped', label: 'Fulfill in Shopify', done: 'fulfilled in Shopify, moved to Shipped', by: 'Shopify' }
  };
  var TONES = { received: 'info', vendor: '', production: 'attention', hold: 'warning', shipped: 'success' };

  function stage(id) { return A.STAGES.filter(function (s) { return s.id === id; })[0]; }
  function find(no) { return A.ORDERS.filter(function (o) { return o.no === no; })[0]; }
  function orderHref(o) { return 'order.html?order=' + o.no; }
  function visible(o) { return o.stage !== 'shipped' || A.at(o.since) >= month; }
  function count(id) { return A.ORDERS.filter(function (o) { return o.stage === id && visible(o); }).length; }
  // "today at 9:14 am", "yesterday at 4:52 pm", "on Sep 24 at 4:18 pm"
  function stamp(s) { var w = A.when(s); return /^(Today|Yesterday)/.test(w) ? w.charAt(0).toLowerCase() + w.slice(1) : 'on ' + w; }
  function record(o) {
    if (o.stage === 'received' && !o.by) return 'Paid ' + stamp(o.placed);
    if (o.stage === 'shipped') return 'Fulfilled in Shopify ' + stamp(o.since);
    return (o.stage === 'hold' ? 'Put on hold by ' : 'Moved here by ') + (o.by || 'Chuck') + ' ' + (o.just ? 'just now' : stamp(o.since));
  }
  function items(o) {
    return o.designs.map(function (code) {
      var d = A.DESIGNS[code], n = o.lines.reduce(function (s, l) { return s + (l.design === code ? l.qty : 0); }, 0);
      return d.product === 'hat' ? n + ' rope hats' : n + ' dozen golf balls';
    });
  }
  function goods(o) { return '<div class="goods">' + o.designs.map(function (c) { return A.thumb(A.DESIGNS[c]); }).join('') + '</div>'; }
  function inStage(o) {
    if (o.stage === 'shipped') return A.day(o.since);
    return o.just ? 'Just now' : A.age(o.since);
  }
  function nextMove(o) {
    if (o.stage === 'hold') { var back = o.heldFrom || 'received'; return { to: back, label: 'Take off hold', done: 'taken off hold, back in ' + stage(back).name }; }
    return MOVES[o.stage] || null;
  }
  function moveBtn(o) {
    var mv = nextMove(o);
    return mv ? '<button type="button" class="btn btn-sm" data-move>' + mv.label + '</button>' : '';
  }
  function menuBtn(o) {
    return '<button type="button" class="icon-btn" data-menu aria-haspopup="true" aria-expanded="false" aria-label="More for order #' + o.no + '">' + icon('more') + '</button>';
  }
  function byTime(a, b) { var d = A.at(a.since) - A.at(b.since); return a.stage === 'shipped' ? -d : d; }

  // ---- Kanban ----
  function kcard(o) {
    var hold = o.stage === 'hold';
    var cls = 'kcard' + (hold ? ' is-hold' : '') + (hold && picked === 'hold' ? ' is-marked' : '') + (o.flash ? ' is-moved' : '');
    if (o.stage === 'shipped') {
      return '<article class="kcard is-shipped' + (o.flash ? ' is-moved' : '') + '" data-order="' + o.no + '" title="Open order #' + o.no + '">' + A.thumb(A.DESIGNS[o.designs[0]]) +
        '<div class="kcard-text"><h3 class="kcard-club">' + esc(A.BUYERS[o.buyer].club) + '</h3>' +
        '<a class="kcard-no" href="' + orderHref(o) + '">#' + o.no + ', ' + A.day(o.since) + '</a></div></article>';
    }
    return '<article class="' + cls + '" data-order="' + o.no + '">' +
      '<div class="kcard-main">' + goods(o) +
        '<div class="kcard-text"><h3 class="kcard-club">' + esc(A.BUYERS[o.buyer].club) + '</h3>' +
          '<a class="kcard-no" href="' + orderHref(o) + '">#' + o.no + '</a>' +
          '<p class="kcard-items">' + items(o).join('<br>') + '</p></div></div>' +
      '<div class="kcard-foot">' + (hold ? '<span class="kcard-time">' + badge('On hold', 'warning') + ' ' + inStage(o) + '</span>'
        : '<span class="kcard-time">' + icon('clock', 16) + inStage(o) + '</span>') + '<span class="kcard-actions">' + moveBtn(o) + menuBtn(o) + '</span></div></article>';
  }
  function kanban() {
    var cols = ['received', 'vendor', 'production', 'shipped'].map(function (id) {
      var s = stage(id), list = A.ORDERS.filter(function (o) { return o.stage === id && visible(o); }).sort(byTime);
      var held = A.ORDERS.filter(function (o) { return o.stage === 'hold' && (o.heldFrom || 'received') === id; }).sort(byTime);
      return '<section class="kcol' + (picked === id ? ' is-picked' : '') + '" data-stage="' + id + '" aria-labelledby="kcol-' + id + '">' +
        '<div class="kcol-head"><span class="dot ' + s.tone + '"></span><h2 id="kcol-' + id + '">' + s.name + '</h2><span class="n">' + list.length + '</span>' +
          (held.length ? badge(held.length + ' on hold', 'warning') : '') + '</div>' +
        (id === 'shipped' ? '<p class="kcol-note">Last 30 days</p>' : '') +
        list.concat(held).map(kcard).join('') + '</section>';
    });
    return '<div class="kanban">' + cols.join('') + '</div>';
  }

  // ---- List ----
  function list() {
    var tabs = [{ id: '', name: 'All', n: A.ORDERS.filter(visible).length }].concat(ORDER.map(function (id) { return { id: id, name: stage(id).name, n: count(id) }; }));
    var rows = A.ORDERS.filter(function (o) { return visible(o) && (!picked || o.stage === picked); }).sort(function (a, b) {
      return (ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage)) || byTime(a, b);
    });
    return '<div class="card"><div class="card-clip">' +
      '<div class="tabs" role="tablist" aria-label="Stages">' + tabs.map(function (t) {
        return '<button type="button" role="tab" aria-selected="' + (t.id === picked) + '" data-filter="' + t.id + '">' + t.name + ' <span class="n">' + t.n + '</span></button>';
      }).join('') + '</div>' +
      '<table class="table ltable"><thead><tr><th class="col-goods"><span class="visually-hidden">Products</span></th><th>Order</th><th>Club</th><th>Items</th><th>Stage</th><th>In stage</th><th class="col-act"><span class="visually-hidden">Next step</span></th></tr></thead><tbody>' +
      rows.map(function (o) {
        var b = A.BUYERS[o.buyer];
        return '<tr data-order="' + o.no + '"' + (o.flash ? ' class="is-moved"' : '') + '>' +
          '<td class="col-goods">' + goods(o) + '</td>' +
          '<td><a class="row-link" href="' + orderHref(o) + '">#' + o.no + '</a></td>' +
          '<td><div class="cell-2"><span class="strong">' + esc(b.club) + '</span><span class="subdued">' + esc(b.name) + '</span></div></td>' +
          '<td><div class="cell-2">' + items(o).map(function (t) { return '<span class="nowrap">' + t + '</span>'; }).join('') + '</div></td>' +
          '<td>' + badge(stage(o.stage).name, TONES[o.stage]) + '</td>' +
          '<td class="nowrap">' + inStage(o) + '</td>' +
          '<td class="col-act">' + moveBtn(o) + menuBtn(o) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function render() {
    closeMenu();
    views.innerHTML = [['kanban', 'Kanban'], ['list', 'List']].map(function (v) {
      return '<button type="button" data-view="' + v[0] + '" aria-pressed="' + (view === v[0]) + '">' + icon(v[0], 16) + v[1] + '</button>';
    }).join('');
    out.innerHTML = view === 'list' ? list() : kanban();
    A.ORDERS.forEach(function (o) { delete o.flash; });
  }
  function syncUrl() {
    var q = [];
    if (view === 'list') q.push('view=list');
    if (picked) q.push('stage=' + picked);
    history.replaceState(null, '', 'board.html' + (q.length ? '?' + q.join('&') : ''));
  }

  // ---- Moving an order: one action, recorded with who and when ----
  function move(no, to, words, by) {
    var o = find(no);
    undo = { o: o, stage: o.stage, since: o.since, by: o.by, just: o.just, heldFrom: o.heldFrom };
    if (to === 'hold') o.heldFrom = o.stage;
    o.stage = to; o.since = NOW_S; o.by = by || 'Chuck'; o.just = true; o.flash = true;
    render(); say('#' + no + ' ' + words);
  }
  function say(text) {
    toast.querySelector('[data-toast-text]').textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.hidden = true; }, 6000);
  }
  toast.querySelector('[data-toast-close]').innerHTML = icon('close', 16);
  toast.querySelector('[data-toast-close]').addEventListener('click', function () { toast.hidden = true; });
  toast.querySelector('[data-undo]').addEventListener('click', function () {
    if (!undo) return;
    var o = undo.o;
    o.stage = undo.stage; o.since = undo.since; o.by = undo.by; o.just = undo.just; o.heldFrom = undo.heldFrom; o.flash = true;
    undo = null; toast.hidden = true; render();
  });

  // ---- The ⋯ menu: the buyer, move to any stage, open the order or its sheet, who and when ----
  function closeMenu() {
    if (!openMenu) return;
    openMenu.menu.remove(); openMenu.btn.setAttribute('aria-expanded', 'false'); openMenu = null;
  }
  function showMenu(btn, o) {
    closeMenu();
    var b = A.BUYERS[o.buyer], menu = document.createElement('div');
    menu.className = 'menu'; menu.setAttribute('role', 'menu');
    var targets = A.STAGES.filter(function (s) { return s.id !== o.stage && s.id !== 'shipped'; });
    menu.innerHTML = '<div class="menu-who"><strong>' + esc(b.name) + '</strong><span>' + esc(b.email) + '</span><span>Designs ' + o.designs.join(', ') + '</span></div><div class="menu-sep"></div>' +
      (o.stage === 'shipped' ? '' : '<div class="menu-label">Move to</div>' + targets.map(function (s) {
        return '<button type="button" class="menu-item" role="menuitem" data-menu-move="' + s.id + '"><span class="dot ' + s.tone + '"></span>' + s.name + '</button>';
      }).join('') + '<div class="menu-sep"></div>') +
      '<a class="menu-item" role="menuitem" href="' + orderHref(o) + '">Open order</a>' +
      '<a class="menu-item" role="menuitem" href="sheet.html?order=' + o.no + '">Production sheet</a>' +
      '<div class="menu-sep"></div><p class="menu-note">' + esc(record(o)) + '</p>';
    (btn.closest('.kcard') || btn.closest('td')).appendChild(menu);
    btn.setAttribute('aria-expanded', 'true');
    openMenu = { menu: menu, btn: btn };
    var first = menu.querySelector('.menu-item'); if (first) first.focus();
  }

  views.addEventListener('click', function (e) {
    var b = e.target.closest('[data-view]');
    if (!b || b.getAttribute('data-view') === view) return;
    view = b.getAttribute('data-view'); syncUrl(); render();
  });
  out.addEventListener('click', function (e) {
    var tab = e.target.closest('[data-filter]');
    if (tab) { picked = tab.getAttribute('data-filter'); syncUrl(); return render(); }
    var item = e.target.closest('[data-order]');
    if (!item) return;
    var o = find(Number(item.getAttribute('data-order'))), el = e.target.closest('[data-menu], [data-menu-move], [data-move]');
    if (el && el.hasAttribute('data-menu')) { e.stopPropagation(); if (openMenu && openMenu.btn === el) closeMenu(); else showMenu(el, o); return; }
    if (el && el.hasAttribute('data-menu-move')) { var t = el.getAttribute('data-menu-move'); return move(o.no, t, t === 'hold' ? 'put on hold' : 'moved to ' + stage(t).name); }
    if (el && el.hasAttribute('data-move')) { var mv = nextMove(o); return move(o.no, mv.to, mv.done, mv.by); }
    if (e.target.closest('a, .menu')) return;
    location.href = orderHref(o);                          // the rest of a card or row opens the order
  });
  document.addEventListener('click', function (e) { if (openMenu && !openMenu.menu.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openMenu) { var b = openMenu.btn; closeMenu(); b.focus(); }
  });

  render();
})();
