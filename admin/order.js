// UI-52 Order page (spec C-7, C-8; D-31, D-67). ?order=<number> picks the order (#1047 by default). Each design is a
// plate: a large picture of the club's product beside its spec in words, the artwork file and the line price. The stage
// badge and the header's next move (the board's words) change the stage in one click, with Undo; the ⋯ menu moves it to
// any stage. History lists every move (who and when) and Chuck's notes, newest first. Nothing is saved.
(function () {
  'use strict';
  var A = window.HonorsAdmin, esc = A.esc, icon = A.icon, badge = A.badge;
  var NOW_S = '2026-09-29 11:40';
  var sorted = A.ORDERS.slice().sort(function (a, b) { return a.no - b.no; });
  var wanted = Number(new URLSearchParams(location.search).get('order'));
  var o = sorted.filter(function (x) { return x.no === wanted; })[0] || sorted.filter(function (x) { return x.no === 1047; })[0];
  var b = A.BUYERS[o.buyer];
  var toast = document.querySelector('.admin-toast'), toastTimer = null, undo = null, menu = null;
  var session = [];                                  // moves and notes made on this page: { at, by, text, note, stage }
  var TONES = { received: 'info', vendor: '', production: 'attention', hold: 'warning', shipped: 'success' };
  var MOVES = {
    received: { to: 'vendor', label: 'Send to vendor', done: 'sent to vendor', says: 'Chuck sent it to the vendor.' },
    vendor: { to: 'production', label: 'Mark in production', done: 'marked in production', says: 'Chuck marked it in production.' },
    production: { to: 'shipped', label: 'Fulfill in Shopify', done: 'fulfilled in Shopify, moved to Shipped', by: 'Shopify', says: 'Fulfilled in Shopify. The order is Shipped.' }
  };

  function out(name) { return document.querySelector('[data-out="' + name + '"]'); }
  function stage(id) { return A.STAGES.filter(function (s) { return s.id === id; })[0]; }
  function lower(w) { return w.replace(/^(Today|Yesterday)/, function (x) { return x.toLowerCase(); }); }
  function qty(code) { return o.lines.reduce(function (s, l) { return s + (l.design === code ? l.qty : 0); }, 0); }
  function amount(code, n) {
    var d = A.DESIGNS[code];
    return d.product === 'hat' ? n + ' rope hats' : n + ' dozen golf balls';
  }
  function nextMove() {
    if (o.stage === 'hold') { var back = o.heldFrom || 'received'; return { to: back, label: 'Take off hold', done: 'taken off hold, back in ' + stage(back).name, says: 'Chuck took it off hold. It’s back in ' + stage(back).name + '.' }; }
    return MOVES[o.stage] || null;
  }

  // ---- Header ----
  function header() {
    document.title = 'Order #' + o.no + ' · Honors · Honors Golf Supply · Shopify';
    out('title').textContent = '#' + o.no;
    out('stage-badge').innerHTML = badge(stage(o.stage).name, TONES[o.stage]);
    out('sub').textContent = b.club + ', paid ' + lower(A.when(o.placed));
    var i = sorted.indexOf(o), prev = sorted[i - 1], next = sorted[i + 1], mv = nextMove();
    var pager = function (to, ic, label) {
      return to ? '<a class="btn" href="order.html?order=' + to.no + '" aria-label="' + label + ', #' + to.no + '" title="' + label + ', #' + to.no + '">' + icon(ic, 16) + '</a>'
        : '<span class="btn" aria-disabled="true" aria-label="' + label + '">' + icon(ic, 16) + '</span>';
    };
    out('actions').innerHTML = '<span class="pager">' + pager(prev, 'prev', 'Previous order') + pager(next, 'chevron', 'Next order') + '</span>' +
      '<a class="btn" href="sheet.html?order=' + o.no + '">' + icon('sheet', 16) + 'Production sheet</a>' +
      '<button type="button" class="btn" data-menu aria-haspopup="true" aria-expanded="false" aria-label="More actions">' + icon('more', 16) + '</button>' +
      (mv ? '<button type="button" class="btn btn-primary" data-move>' + mv.label + '</button>' : '');
  }

  // ---- Designs: one plate each ----
  function designs() {
    out('designs-title').textContent = o.designs.length > 1 ? o.designs.length + ' designs' : 'Design';
    out('designs').innerHTML = o.designs.map(function (code) {
      var d = A.DESIGNS[code], n = qty(code), line = o.lines.filter(function (l) { return l.design === code; })[0];
      var tier = A.PRODUCTS[d.product].tiers.filter(function (t) { return t.min === line.tier; })[0];
      var art = d.kind === 'logo'
        ? '<button type="button" class="btn" data-artwork="' + esc(d.logo) + '">' + icon('download', 16) + 'Download ' + esc(d.logo) + '</button>'
        : '<p class="plate-none">No artwork file. The lettering is set from this design.</p>';
      return '<article class="plate" aria-label="Design ' + code + '">' +
        '<div class="plate-pic">' + A.picture(d) + '</div>' +
        '<div class="plate-body"><h3 class="plate-code">' + code + '</h3><p class="plate-qty">' + amount(code, n) + '</p>' +
          '<dl class="spec">' + A.specs(d).map(function (s) { return '<dt>' + s[0] + '</dt><dd>' + esc(s[1]) + '</dd>'; }).join('') + '</dl>' +
          '<div class="plate-foot"><div class="plate-links">' + art + '</div>' +
            '<div class="plate-price"><strong>' + A.money(n * line.price) + '</strong><span>' + (d.product === 'hat' ? '$' + line.price + ' each' : '$' + line.price + ' a dozen') + ', ' + tier.name + ' price</span></div></div>' +
        '</div></article>';
    }).join('');
  }

  // ---- History: every stage move and note, newest first ----
  var SAYS = {
    received: 'Paid in Shopify. The order is in Received.',
    vendor: 'Chuck sent it to the vendor.',
    production: 'Chuck marked it in production.',
    hold: 'Chuck put it on hold.',
    shipped: 'Fulfilled in Shopify. The order is Shipped.'
  };
  function timeline() {
    var events = A.stageTrail(o).map(function (e) { return { at: e.at, text: SAYS[e.stage] }; })
      .concat((A.NOTES[o.no] || []).map(function (n) { return { at: A.at(n.at), note: true, by: n.by, text: n.text }; }))
      .concat(session);
    events.sort(function (x, y) { return (y.at - x.at) || ((y.seq || 0) - (x.seq || 0)); });
    out('timeline').innerHTML = events.map(function (e) {
      var time = e.fresh ? 'Just now' : A.when(e.at);
      if (e.note) {
        return '<li class="tl tl-note' + (e.fresh ? ' is-new' : '') + '"><span class="avatar avatar-chuck" aria-hidden="true">C</span>' +
          '<div class="tl-bubble"><strong>' + esc(e.by) + '</strong> ' + esc(e.text) + '</div><span class="tl-time">' + time + '</span></li>';
      }
      return '<li class="tl' + (e.fresh ? ' is-new' : '') + '"><span class="tl-dot" aria-hidden="true"></span><span class="tl-text">' + esc(e.text) + '</span><span class="tl-time">' + time + '</span></li>';
    }).join('');
  }

  // ---- Side: buyer and order facts ----
  function side() {
    out('buyer').innerHTML = '<h2 id="buyer-title">Buyer</h2><p class="strong">' + esc(b.name) + '</p><p>' + esc(b.club) + '</p>' +
      '<p><a class="link" href="mailto:' + esc(b.email) + '?subject=' + encodeURIComponent('Your Honors order #' + o.no) + '">' + esc(b.email) + '</a></p>' +
      '<div class="side-links"><a class="link" href="buyer.html?buyer=' + o.buyer + '">View buyer</a></div>';
    var items = o.designs.map(function (c) { return amount(c, qty(c)); }).join(', ');
    out('facts').innerHTML = '<h2 id="facts-title">Order</h2><dl class="facts">' +
      '<dt>Placed</dt><dd>' + A.when(o.placed) + '</dd>' +
      '<dt>Items</dt><dd>' + items + '</dd>' +
      '<dt>Payment</dt><dd>' + badge('Paid', '') + '</dd>' +
      '<dt>Total</dt><dd class="total">' + A.money(o.total) + '</dd></dl>' +
      '<div class="side-links"><a class="link link-arrow" href="shopify-order.html?order=' + o.no + '">Open in Shopify' + icon('external', 16) + '</a></div>';
  }

  function render() { closeMenu(); header(); timeline(); }

  // ---- Moving the order: one action, recorded with who and when; Undo takes it back ----
  var seq = 0;
  function move(to, words, says, by) {
    var ev = { at: A.NOW, text: says, fresh: true, seq: ++seq, by: by || 'Chuck' };
    undo = { stage: o.stage, since: o.since, heldFrom: o.heldFrom, ev: ev };
    if (to === 'hold') o.heldFrom = o.stage;
    o.stage = to; o.since = NOW_S;
    session.forEach(function (e) { e.fresh = false; });
    session.push(ev);
    render(); say('#' + o.no + ' ' + words);
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
    o.stage = undo.stage; o.since = undo.since; o.heldFrom = undo.heldFrom;
    var ev = undo.ev; session = session.filter(function (e) { return e !== ev; });
    undo = null; toast.hidden = true; render();
  });

  // ---- The ⋯ menu: move to any stage (Shipped only through Shopify) ----
  function closeMenu() {
    if (!menu) return;
    menu.remove(); menu = null;
    var btn = document.querySelector('[data-menu]'); if (btn) btn.setAttribute('aria-expanded', 'false');
  }
  function showMenu(btn) {
    menu = document.createElement('div');
    menu.className = 'menu'; menu.setAttribute('role', 'menu');
    var targets = A.STAGES.filter(function (s) { return s.id !== o.stage && s.id !== 'shipped'; });
    menu.innerHTML = (o.stage === 'shipped' ? '' : '<div class="menu-label">Move to</div>' + targets.map(function (s) {
        return '<button type="button" class="menu-item" role="menuitem" data-menu-move="' + s.id + '"><span class="dot ' + s.tone + '"></span>' + s.name + '</button>';
      }).join('') + '<div class="menu-sep"></div>') +
      '<a class="menu-item" role="menuitem" href="shopify-order.html?order=' + o.no + '">Open in Shopify</a>' +
      '<a class="menu-item" role="menuitem" href="board.html">Back to the board</a>';
    out('actions').appendChild(menu);
    btn.setAttribute('aria-expanded', 'true');
    menu.querySelector('.menu-item').focus();
  }
  out('actions').addEventListener('click', function (e) {
    var el = e.target.closest('[data-menu], [data-menu-move], [data-move]');
    if (!el) return;
    if (el.hasAttribute('data-menu')) { e.stopPropagation(); if (menu) closeMenu(); else showMenu(el); return; }
    if (el.hasAttribute('data-menu-move')) {
      var t = el.getAttribute('data-menu-move');
      return move(t, t === 'hold' ? 'put on hold' : 'moved to ' + stage(t).name, t === 'hold' ? 'Chuck put it on hold.' : 'Chuck moved it to ' + stage(t).name + '.');
    }
    var mv = nextMove();
    move(mv.to, mv.done, mv.says, mv.by);
  });
  document.addEventListener('click', function (e) { if (menu && !menu.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu) { closeMenu(); document.querySelector('[data-menu]').focus(); } });

  // ---- Artwork: the original file, downloaded ----
  out('designs').addEventListener('click', function (e) {
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

  // ---- Notes ----
  var form = out('note-form'), field = form.querySelector('textarea'), post = form.querySelector('[type="submit"]');
  field.addEventListener('input', function () { post.disabled = !field.value.trim(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = field.value.trim();
    if (!text) return;
    session.forEach(function (x) { x.fresh = false; });
    session.push({ at: A.NOW, note: true, by: 'Chuck', text: text, fresh: true, seq: ++seq });
    field.value = ''; post.disabled = true; timeline();
  });

  header(); designs(); timeline(); side();
})();
