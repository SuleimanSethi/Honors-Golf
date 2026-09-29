// Shared behavior for every look option. Each option supplies its own markup and CSS
// but uses the same element ids and data attributes, so the designer works identically.
// It designs a golf ball unless the page describes another product first, in window.HonorsProduct
// (the hat page does, in hat.js): its colors, prices, wording, starting state, how to draw it, and
// init(api) / design(payload, state) hooks for its own controls and cart details. An accessory (accessory.js) also
// gives its noun, its name and page for the recent-design cards, and the state keys its saved designs keep.
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var P = window.HonorsProduct || {};

  var FONTS = {
    classic: "'Marcellus', Georgia, serif",
    block: "'Alfa Slab One', Georgia, serif",
    script: "'Pinyon Script', cursive",
    clean: "'Figtree', 'Helvetica Neue', sans-serif"
  };
  var BALL_COLORS = {
    black: { name: 'Black', hex: '#1A1B1F' },
    navy: { name: 'Navy', hex: '#1F2E55' },
    oxblood: { name: 'Oxblood', hex: '#6B1E2A' },
    red: { name: 'Red', hex: '#C8262B' },
    green: { name: 'Green', hex: '#1E5B3F' },
    gold: { name: 'Gold', hex: '#9A7128' }
  };
  var COLORS = P.colors || BALL_COLORS;
  // Example prices until Chuck sets them (spec OQ-3).
  var TIERS = P.tiers || [{ min: 6, price: 54 }, { min: 12, price: 49 }, { min: 24, price: 44 }];
  var MIN_QTY = P.min || 6;
  var MIN_PX = P.minPx || 264; // 0.88 in print at 300 DPI (spec GB-2 example)
  var NEXT_LABEL = P.nextLabel || { 1: 'Next: ball and color', 2: 'Next: quantity' };
  // How quantities read: golf balls in dozens.
  var UNIT = P.unit || {
    count: function (n) { return n + ' dozen'; },
    each: function (price) { return '$' + price + ' a dozen'; },
    best: 'You’re getting the best price per dozen.'
  };

  // The ball is a studio-style render of a real dimpled sphere (tools/render_ball.py, D-46). The print sits
  // on top with a multiply blend, so the ink picks up the ball's shading and dimples like real print does.
  // The sample logo (pinecrest-logo.jpg), centred on 0,0; also drawn on the recent-design cards (UI-27).
  var SAMPLE_LOGO =
    '<circle r="64" fill="none" stroke="#1F2E55" stroke-width="4"/>' +
    '<polygon points="0,-50 20,-18 11,-18 27,6 -27,6 -11,-18 -20,-18" fill="#1F2E55"/>' +
    '<rect x="-5" y="6" width="10" height="11" fill="#1F2E55"/>' +
    '<text y="36" font-size="12" font-weight="700" letter-spacing="2" text-anchor="middle" fill="#1F2E55" font-family="Figtree, sans-serif">PINECREST</text>' +
    '<text y="50" font-size="8" letter-spacing="2" text-anchor="middle" fill="#1F2E55" font-family="Figtree, sans-serif">GOLF CLUB</text>';
  var BALL_SVG =
    '<svg class="ball-svg" viewBox="0 0 400 400" role="img" aria-labelledby="ball-title">' +
    '<title id="ball-title">Preview of your golf ball</title>' +
    '<defs><clipPath id="ballClip"><circle cx="200" cy="196" r="174"/></clipPath></defs>' +
    '<image href="../shared/ball.webp" width="400" height="400"/>' +
    '<g clip-path="url(#ballClip)" style="mix-blend-mode: multiply">' +
    '<g id="art-text" text-anchor="middle"><text id="t-line1" x="200" y="190"></text><text id="t-line2" x="200" y="230"></text></g>' +
    '<g id="art-mono" text-anchor="middle"><text id="t-mono" x="200" y="228" font-size="92" letter-spacing="4"></text></g>' +
    '<g id="art-logo" transform="translate(200 196)">' +
    '<rect id="logo-white-box" x="-78" y="-78" width="156" height="156" fill="#FFFFFF"/>' +
    '<g id="logo-sample">' + SAMPLE_LOGO +
    '</g>' +
    '<image id="logo-upload" x="-80" y="-80" width="160" height="160" preserveAspectRatio="xMidYMid meet"/>' +
    '</g>' +
    '</g>' +
    '</svg>';

  var mount = $('[data-ball]');
  if (mount) mount.innerHTML = BALL_SVG;

  function initial(id, fallback) { var n = document.getElementById(id); return n && n.value ? n.value : fallback; }
  var state = Object.assign({
    tab: 'text', line1: initial('line1', 'Pinecrest Golf Club'), line2: initial('line2', 'Member-Guest 2026'), mono: initial('mono', 'PGC'),
    font: 'classic', color: 'navy', qty: 12, step: 1,
    saved: false, dirty: false, code: 'HGS-10450', cart: 2,
    logo: { sample: true, name: 'pinecrest-logo.jpg', url: null, bgRemoved: true, lowRes: false, isPdf: false }
  }, P.state);

  function byId(id) { return document.getElementById(id); }
  var el = {
    panel: byId('panel'),
    tLine1: byId('t-line1'), tLine2: byId('t-line2'), tMono: byId('t-mono'),
    artText: byId('art-text'), artMono: byId('art-mono'), artLogo: byId('art-logo'),
    logoSample: byId('logo-sample'), logoUpload: byId('logo-upload'), logoWhite: byId('logo-white-box'),
    line1: byId('line1'), line2: byId('line2'), mono: byId('mono'),
    count1: byId('count1'), count2: byId('count2'), smallNotice: byId('small-text-notice'),
    lettering: byId('lettering'), logoColorNote: byId('logo-color-note'), colorName: byId('color-name'),
    fileName: byId('file-name'), fileNote: byId('file-note'), bgToggle: byId('bg-toggle'),
    thumbSample: byId('thumb-sample'), thumbUpload: byId('thumb-upload'),
    lowres: byId('lowres-notice'), rights: byId('rights'), rightsError: byId('rights-error'),
    qty: byId('qty'), dec: byId('qty-dec'), inc: byId('qty-inc'), total: byId('total'),
    save: byId('save-design'), add: byId('add-to-cart'), next: byId('step-next'), back: byId('step-back'),
    toast: byId('toast')
  };
  function setText(sel, text) { $$(sel).forEach(function (n) { n.textContent = text; }); }

  function tierIndex(qty) { var idx = 0; TIERS.forEach(function (t, i) { if (qty >= t.min) idx = i; }); return idx; }
  function money(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fitSize(text, max) { var len = Math.max(text.length, 1); return Math.round(Math.min(max, 250 / (len * 0.56))); }

  function renderBall() {
    var fam = FONTS[state.font], ink = COLORS[state.color].hex;
    var size1 = fitSize(state.line1, 46);
    var size2 = state.line2 ? Math.min(Math.round(size1 * 1.25), fitSize(state.line2, 40)) : 0;
    var block = size1 + (state.line2 ? 10 + size2 : 0);
    var y1 = Math.round(196 - block / 2 + size1 * 0.8);
    el.artText.setAttribute('font-family', fam); el.artText.setAttribute('fill', ink);
    el.tLine1.textContent = state.line1; el.tLine1.setAttribute('font-size', size1); el.tLine1.setAttribute('y', y1);
    el.tLine2.textContent = state.line2; el.tLine2.setAttribute('font-size', size2 || 1); el.tLine2.setAttribute('y', y1 + 10 + size2);
    el.artMono.setAttribute('font-family', fam); el.artMono.setAttribute('fill', ink);
    el.tMono.textContent = state.mono;
    el.artText.style.display = state.tab === 'text' ? '' : 'none';
    el.artMono.style.display = state.tab === 'monogram' ? '' : 'none';
    el.artLogo.style.display = state.tab === 'logo' ? '' : 'none';
    el.logoSample.style.display = state.logo.sample ? '' : 'none';
    el.logoWhite.style.display = state.logo.sample && !state.logo.bgRemoved ? '' : 'none';
    if (state.logo.url && !state.logo.isPdf) { el.logoUpload.setAttribute('href', state.logo.url); el.logoUpload.style.display = ''; }
    else { el.logoUpload.removeAttribute('href'); el.logoUpload.style.display = 'none'; }
    return size1;
  }

  function render() {
    // Draw the product. It answers whether the text comes out too small to read.
    var smallText = P.draw ? P.draw(state) : renderBall() < 24;
    $$('[data-tab]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tab === state.tab)); });
    $$('[data-pane]').forEach(function (p) { p.hidden = p.dataset.pane !== state.tab; });
    el.count1.textContent = state.line1.length + ' of 20 characters';
    el.count2.textContent = state.line2.length + ' of 20 characters';
    el.smallNotice.hidden = !(state.tab === 'text' && smallText);
    el.lettering.hidden = state.tab === 'logo';
    el.logoColorNote.hidden = state.tab !== 'logo';
    $$('[data-font]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.font === state.font)); });
    $$('[data-color]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.color === state.color)); });
    el.colorName.textContent = COLORS[state.color].name;

    el.fileName.textContent = state.logo.name;
    if (state.logo.sample) {
      el.fileNote.textContent = state.logo.bgRemoved ? 'White background removed' : 'White background kept';
      el.bgToggle.textContent = state.logo.bgRemoved ? 'Undo' : 'Remove it';
      el.bgToggle.hidden = false;
    } else {
      el.fileNote.textContent = state.logo.isPdf ? 'PDF received. This review build can’t preview PDFs.' : 'Uploaded';
      el.bgToggle.hidden = true;
    }
    el.thumbSample.style.display = state.logo.sample ? '' : 'none';
    el.thumbUpload.hidden = state.logo.sample || !state.logo.url || state.logo.isPdf;
    el.lowres.hidden = !state.logo.lowRes || state.tab !== 'logo';
    if (picker.on) renderSaved();

    var fontName = { classic: 'Classic', block: 'Block', script: 'Script', clean: 'Clean' }[state.font];
    var desc = state.tab === 'logo'
      ? 'Golf ball printed with your logo, ' + state.logo.name
      : state.tab === 'monogram'
        ? 'Golf ball with the monogram ' + (state.mono || 'blank') + ' in ' + COLORS[state.color].name.toLowerCase() + ' ' + fontName + ' lettering'
        : 'Golf ball printed with \u201c' + state.line1 + (state.line2 ? ' / ' + state.line2 : '') + '\u201d in ' + COLORS[state.color].name.toLowerCase() + ' ' + fontName + ' lettering';
    var title = document.getElementById('ball-title');
    if (title) title.textContent = desc;

    var ti = tierIndex(state.qty);
    var nextTier = TIERS[ti + 1];
    setText('[data-out="tier-hint"]', nextTier
      ? 'Add ' + UNIT.count(nextTier.min - state.qty).replace(' ', ' more ') + ' to pay ' + UNIT.each(nextTier.price) + '.'
      : UNIT.best);
    $$('[data-tier]').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.tier) === ti)); });
    el.qty.textContent = state.qty;
    el.dec.disabled = state.qty <= MIN_QTY;
    el.total.textContent = money(state.qty * TIERS[ti].price);
    setText('[data-out="qty-summary"]', UNIT.count(state.qty) + ' at ' + UNIT.each(TIERS[ti].price));
    setText('[data-out="total"]', money(state.qty * TIERS[ti].price));

    var main, sub;
    if (state.saved) {
      main = 'Saved as ' + state.code; sub = 'Updates as you edit, until it’s ordered';
      el.save.textContent = state.dirty ? 'Save changes' : 'Saved';
      el.save.disabled = !state.dirty;
    } else {
      main = 'Not saved yet'; sub = 'Save to get a design number';
      el.save.textContent = 'Save design'; el.save.disabled = false;
    }
    setText('[data-out="status-main"]', main);
    setText('[data-out="status-sub"]', sub);
    $$('[data-out="status-dot"]').forEach(function (d) { d.dataset.saved = String(state.saved); });

    el.panel.dataset.step = String(state.step);
    document.body.dataset.step = String(state.step);
    document.body.dataset.tab = state.tab;
    $$('[data-step-marker]').forEach(function (li) {
      var n = Number(li.dataset.stepMarker);
      li.classList.toggle('is-current', n === state.step);
      li.classList.toggle('is-done', n < state.step);
      if (n === state.step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    if (NEXT_LABEL[state.step]) el.next.textContent = NEXT_LABEL[state.step];
    var cartCount = window.HonorsCart ? window.HonorsCart.count() : state.cart;   // look A shares one sample cart (cart.js)
    setText('[data-out="cart-count"]', String(cartCount));
    $$('[data-cart-link]').forEach(function (a) { a.setAttribute('aria-label', 'Cart, ' + cartCount + (cartCount === 1 ? ' item' : ' items')); });
  }

  function edited() { if (state.saved) state.dirty = true; }
  function set(patch) { Object.keys(patch).forEach(function (k) { state[k] = patch[k]; }); edited(); render(); }

  $$('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { set({ tab: b.dataset.tab }); }); });
  el.line1.addEventListener('input', function () { set({ line1: el.line1.value.slice(0, 20) }); });
  el.line2.addEventListener('input', function () { set({ line2: el.line2.value.slice(0, 20) }); });
  el.mono.addEventListener('input', function () {
    var v = el.mono.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
    el.mono.value = v; set({ mono: v });
  });
  el.bgToggle.addEventListener('click', function () { state.logo.bgRemoved = !state.logo.bgRemoved; edited(); render(); });
  // ---- Upload errors (UI-26; spec C-11) ----
  // A file is checked by what it contains, not its name: one that isn't a PNG, JPG, SVG or PDF, is over 25 MB, or
  // can't be opened is turned away with a plain message and "try a PNG", and the logo already on the product stays.
  // It needs #upload-error on the page; looks B to D keep their toast. Review: ?state=upload-failed.
  var uploadError = { el: byId('upload-error'), title: byId('upload-error-title'), text: byId('upload-error-text') };
  var UPLOAD_ERRORS = {
    convert: ['That file couldn’t be converted.', 'It may be damaged or saved in an unusual way. Try a PNG of your logo.'],
    type: ['That file isn’t a PNG, JPG, SVG or PDF.', 'Try a PNG of your logo.'],
    size: ['That file is over 25 MB.', 'Try a smaller PNG or a PDF.']
  };
  function showUploadError(kind) {
    if (!uploadError.el) { showToast(UPLOAD_ERRORS[kind].join(' ')); return; }
    uploadError.title.textContent = UPLOAD_ERRORS[kind][0];
    uploadError.text.textContent = UPLOAD_ERRORS[kind][1] + ' Your current logo stays on the ' + (P.noun || (P.product === 'hat' ? 'patch' : 'ball')) + '.';
    uploadError.el.hidden = false;
  }
  function clearUploadError() { if (uploadError.el) uploadError.el.hidden = true; }
  // What a file really is, from its first bytes; a PNG or JPG that stops short of its end marker is damaged (the browser
  // would still show the part it has).
  function sniff(file, done) {
    Promise.all([file.slice(0, 4096).arrayBuffer(), file.slice(-4096).arrayBuffer()]).then(function (parts) {
      var b = new Uint8Array(parts[0]), end = Array.prototype.slice.call(new Uint8Array(parts[1]));
      var ends = function (seq) { return end.join(',').indexOf(seq.join(',')) !== -1; };
      if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return done(ends([0x49, 0x45, 0x4E, 0x44]) ? 'png' : 'damaged');   // IEND
      if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return done(ends([0xFF, 0xD9]) ? 'jpg' : 'damaged');
      if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return done('pdf');   // %PDF
      done(/<svg[\s>]/i.test(new TextDecoder().decode(b)) ? 'svg' : null);
    }, function () { done(null); });
  }
  // Put an accepted file on the product. An image already opened for the check comes with its probe.
  function acceptUpload(file, isPdf, url, probe) {
    clearUploadError();
    // A signed-in buyer's logos stay in their list (UI-22), so only a guest's replaced upload is let go.
    if (state.logo.url && !picker.on) URL.revokeObjectURL(state.logo.url);
    var logo = state.logo = { sample: false, name: file.name, url: isPdf ? null : url || URL.createObjectURL(file), bgRemoved: false, lowRes: false, isPdf: isPdf };
    if (!isPdf) {
      el.thumbUpload.src = logo.url;
      var measure = function (img) { logo.lowRes = Math.max(img.naturalWidth, img.naturalHeight) < MIN_PX && !/\.svg$/i.test(file.name); };
      if (probe) measure(probe);
      else { var p = new Image(); p.onload = function () { measure(p); render(); }; p.src = logo.url; }
    }
    if (picker.on) { picker.items.unshift({ logo: logo, added: 'Added just now', used: 'Not used yet' }); buildSaved(); }
    edited(); render();
  }
  byId('logo-file').addEventListener('change', function (e) {
    var input = e.target, file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { input.value = ''; showUploadError('size'); return; }
    if (!uploadError.el) { acceptUpload(file, file.type === 'application/pdf' || /\.pdf$/i.test(file.name)); return; }
    sniff(file, function (kind) {
      if (!kind) { input.value = ''; showUploadError('type'); return; }
      if (kind === 'damaged') { input.value = ''; showUploadError('convert'); return; }
      if (kind === 'pdf') { acceptUpload(file, true); return; }
      // An image is used only once it decodes in full (a damaged file can still "load" part-way).
      var url = URL.createObjectURL(file), probe = new Image();
      probe.src = url;
      probe.decode().then(function () {
        if (!probe.naturalWidth) throw new Error('empty image');
        acceptUpload(file, false, url, probe);
      }).catch(function () { URL.revokeObjectURL(url); input.value = ''; showUploadError('convert'); });
    });
  });
  el.rights.addEventListener('change', function () { el.rightsError.hidden = true; });

  $$('[data-font]').forEach(function (b) { b.addEventListener('click', function () { set({ font: b.dataset.font }); }); });
  $$('[data-color]').forEach(function (b) { b.addEventListener('click', function () { set({ color: b.dataset.color }); }); });
  el.dec.addEventListener('click', function () { set({ qty: Math.max(MIN_QTY, state.qty - 1) }); });
  el.inc.addEventListener('click', function () { set({ qty: Math.min(999, state.qty + 1) }); });
  $$('[data-tier]').forEach(function (b) {
    b.addEventListener('click', function () { var i = Number(b.dataset.tier); if (tierIndex(state.qty) !== i) set({ qty: TIERS[i].min }); });
  });

  function rightsOk() {
    if (state.tab !== 'logo' || el.rights.checked) return true;
    el.rightsError.hidden = false;
    if (state.step !== 1) { state.step = 1; render(); }
    el.rights.focus();
    return false;
  }
  // The design as the cart takes it; the product adds its own details (the hat: its picture, patch and summary).
  function designPayload() {
    var design = { code: state.code, kind: state.tab, line1: state.line1, line2: state.line2, mono: state.mono, font: state.font, color: state.color,
      logo: { sample: state.logo.sample, name: state.logo.name, url: state.logo.isPdf ? null : state.logo.url } };
    if (P.design) P.design(design, state);
    return design;
  }
  el.save.addEventListener('click', function () {
    if (!rightsOk()) return;
    var first = !state.saved;
    state.saved = true; state.dirty = false; render();
    if (recent.on) rememberDesign(designPayload());
    showToast(first ? 'Saved as ' + state.code + '.' : 'Changes saved to ' + state.code + '.');
  });
  function addToCart() {
    state.saved = true; state.dirty = false;
    // With the cart drawer on the page (cart.js), it takes the design and slides in; otherwise a toast confirms.
    var design = designPayload();
    if (recent.on) rememberDesign(design);
    var handled = !document.dispatchEvent(new CustomEvent('honors:add-to-cart', { cancelable: true, detail: { design: design, qty: state.qty, trigger: el.add } }));
    if (!handled) { state.cart += 1; showToast('Added ' + UNIT.count(state.qty) + ' to your cart. Design ' + state.code + '.'); }
    render();
  }
  // ---- The store can't be reached on Add to cart (UI-26; spec C-2) ----
  // Nothing is added and the design isn't marked saved; everything on the page stays. The message sits in the bar
  // beside the button, which becomes Try again. It needs #add-error on the page. Review: ?state=cart-unreachable
  // opens as if the buyer's Add to cart had just failed; Try again then goes through.
  var addError = byId('add-error'), ADD_LABEL = el.add.textContent;
  function showAddError() { addError.hidden = false; el.add.textContent = 'Try again'; }
  el.add.addEventListener('click', function () {
    if (!rightsOk()) return;
    if (addError && !addError.hidden) {
      el.add.disabled = true; el.add.textContent = 'Trying again…';
      setTimeout(function () { addError.hidden = true; el.add.disabled = false; el.add.textContent = ADD_LABEL; addToCart(); }, 900);
      return;
    }
    addToCart();
  });

  function goStep(n) {
    state.step = Math.max(1, Math.min(3, n)); render();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  el.next.addEventListener('click', function () { if (state.step === 1 && !rightsOk()) return; goStep(state.step + 1); });
  el.back.addEventListener('click', function () { goStep(state.step - 1); });
  el.panel.addEventListener('submit', function (e) { e.preventDefault(); });
  $$('[data-jump-step]').forEach(function (b) { b.addEventListener('click', function () { goStep(Number(b.dataset.jumpStep)); }); });

  var toastTimer = null;
  function showToast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg; el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.hidden = true; }, 3500);
  }

  // ---- Saved-logo picker (UI-22; spec C-10, GB-1, H-3) ----
  // A signed-in buyer's saved logos come first, most recent at the top, as file cards to choose from; choosing one
  // puts it on the product exactly as an upload would, and a new upload joins the top of the list. It switches on
  // only on a page with #saved-logos and a signed-in buyer. The prototype has no sign-in, so for review
  // ?buyer=signed-in shows the sample account (Alex Morgan, Pinecrest Golf Club); without it the page is a guest's,
  // with no saved logos, and looks as before.
  var picker = { root: byId('saved-logos'), on: false, list: null, items: [] };
  function signedIn() { try { return new URLSearchParams(window.location.search).get('buyer') === 'signed-in'; } catch (e) { return false; } }

  function buildSaved() {
    picker.list.innerHTML = '';
    picker.items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'saved-logo';
      row.innerHTML = '<label class="saved-pick"><input type="radio" name="saved-logo" class="visually-hidden">' +
        '<span class="file-thumb" aria-hidden="true"></span>' +
        '<span class="file-meta"><span class="file-name"></span><span class="hint saved-when"></span><span class="hint saved-note"></span></span></label>' +
        '<button type="button" class="text-btn saved-undo"></button>';
      var q = function (sel) { return row.querySelector(sel); };
      q('.file-name').textContent = item.logo.name;
      q('.saved-when').textContent = item.added + ' · ' + item.used;
      item.row = row; item.thumb = q('.file-thumb'); item.input = q('input'); item.note = q('.saved-note'); item.undo = q('.saved-undo');
      fillThumb(item);
      item.input.addEventListener('change', function () { if (item.input.checked) choose(item); });
      item.undo.addEventListener('click', function () { state.logo.bgRemoved = !state.logo.bgRemoved; edited(); render(); });
      picker.list.appendChild(row);
    });
  }
  function fillThumb(item) {
    item.thumb.innerHTML = '';
    if (item.logo.sample) {
      var art = el.thumbSample.cloneNode(true);
      art.removeAttribute('id'); art.removeAttribute('style');
      item.thumb.appendChild(art);
    } else if (item.logo.url && !item.logo.isPdf) {
      var img = document.createElement('img'); img.alt = ''; img.src = item.logo.url;
      item.thumb.appendChild(img);
    }
  }
  function choose(item) {
    clearUploadError();
    state.logo = item.logo;
    if (!item.logo.sample && item.logo.url) el.thumbUpload.src = item.logo.url;
    edited(); render();
  }
  // The chosen card carries what the file card shows for a guest: the background note with Undo, or the PDF note.
  function renderSaved() {
    picker.items.forEach(function (item) {
      var on = item.logo === state.logo, note = '', action = '';
      item.row.classList.toggle('is-selected', on);
      item.input.checked = on;
      if (on && item.logo.sample) {
        note = item.logo.bgRemoved ? 'White background removed' : 'White background kept';
        action = item.logo.bgRemoved ? 'Undo' : 'Remove it';
      } else if (on && item.logo.isPdf) note = 'PDF received. This review build can’t preview PDFs.';
      item.note.textContent = note; item.note.hidden = !note;
      item.undo.textContent = action; item.undo.hidden = !action;
    });
  }

  if (picker.root && signedIn()) {
    picker.on = true;
    picker.list = picker.root.querySelector('[data-saved-list]');
    picker.root.hidden = false;
    el.fileName.closest('.file-row').hidden = true;   // the chosen card in the list takes its place
    var uploadName = document.querySelector('label[for="logo-file"] span');
    if (uploadName) uploadName.textContent = 'Upload a new logo';
    // The sample account's saved logo: the page's demo logo, pinecrest-logo.jpg, which the page starts with.
    picker.items = [
      { logo: state.logo, added: 'Added Sep 12', used: 'Used in 2 designs' }
    ];
    buildSaved();
  }

  // ---- Your recent designs (UI-27; spec C-2, D-30) ----
  // For a guest: the designs saved on this browser, newest first, in a section below the designer, so they can get
  // back to them. Save design and Add to cart remember the design (the hat with the picture the cart takes); opening
  // one loads it into its designer, in place on the same product or on the other designer's page (?design=CODE).
  // The list starts with the two designs in the sample cart (cart.js; saved dates as on the account page) and adds
  // what the reviewer saves, kept in this browser's localStorage. Review: ?recent=reset forgets those. Signed-in buyers
  // find their designs in their account (C-10), so the list is for guests. It needs #recent-designs on the page.
  var PRODUCT = P.product || 'ball';
  var RECENT_KEY = 'honors-recent-designs', RECENT_MAX = 8;
  var RECENT_SAMPLE = [
    { code: 'HGS-10412', product: 'ball', kind: 'text', line1: 'Pinecrest Club', line2: 'Club Championship', mono: '', font: 'classic', color: 'navy', qty: 12, saved: '2026-09-15' },
    { code: 'HGS-10398', product: 'ball', kind: 'logo', logo: { sample: true, name: 'pinecrest-logo.jpg', bgRemoved: true }, font: 'classic', color: 'navy', qty: 6, saved: '2026-09-12' }
  ];
  var recent = { root: byId('recent-designs'), on: false, list: null };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function readRecent() { try { var x = JSON.parse(localStorage.getItem(RECENT_KEY)); return Array.isArray(x) ? x : []; } catch (e) { return []; } }
  function writeRecent(list) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); return true; } catch (e) { return false; } }
  function allRecent() {
    var stored = readRecent(), codes = stored.map(function (d) { return d.code; });
    return stored.concat(RECENT_SAMPLE.filter(function (d) { return codes.indexOf(d.code) === -1; }))
      .sort(function (a, b) { return a.saved < b.saved ? 1 : a.saved > b.saved ? -1 : 0; }).slice(0, RECENT_MAX);
  }
  function findRecent(code) { return allRecent().filter(function (d) { return d.code === code; })[0]; }
  function savedText(when) {
    var d = /^\d{4}-\d\d-\d\d$/.test(when) ? new Date(when + 'T12:00:00') : new Date(when), now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Saved today';
    return 'Saved ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Remember the design that was just saved. An uploaded logo exists only in this page, so a copy goes with it.
  function storeRecent(rec) {
    var list = [rec].concat(readRecent().filter(function (d) { return d.code !== rec.code; })).slice(0, RECENT_MAX);
    if (!writeRecent(list) && rec.logo.url) { rec.logo.url = null; writeRecent(list); }   // storage full: keep it without the logo copy
  }
  function rememberDesign(design) {
    var logo = state.logo;
    var rec = { code: state.code, product: PRODUCT, kind: state.tab, line1: state.line1, line2: state.line2, mono: state.mono,
      font: state.font, color: state.color, qty: state.qty, saved: new Date().toISOString(),
      logo: { sample: logo.sample, name: logo.name, bgRemoved: logo.bgRemoved, isPdf: logo.isPdf, url: null } };
    ['shape', 'material', 'patch', 'edge', 'logoSize'].concat(P.keep || []).forEach(function (k) { if (k in state) rec[k] = state[k]; });
    if (design.preview) rec.preview = design.preview;
    if (P.page) { rec.name = P.name; rec.page = P.page; }   // an accessory's card names it and opens its page
    storeRecent(rec); renderRecent();
    if (logo.sample || !logo.url || logo.isPdf) return;
    var img = new Image();
    img.onload = function () {
      var k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      var latest = readRecent().filter(function (d) { return d.code === rec.code; })[0];
      if (!latest || latest.logo.name !== rec.logo.name || latest.logo.url) return;
      latest.logo.url = c.toDataURL('image/png');
      storeRecent(latest); renderRecent();
    };
    img.src = logo.url;
  }

  // The card's picture: the ball with its print (as in the cart), or the picture of the hat (or an accessory, which
  // names its own page) taken when it was saved.
  function ballPrint(d) {
    var ink = (COLORS[d.color] || BALL_COLORS[d.color] || BALL_COLORS.navy).hex, fam = esc(FONTS[d.font] || FONTS.classic);
    if (d.kind === 'logo') {
      var lg = d.logo || { sample: true, bgRemoved: true };
      if (lg.sample) return '<g transform="translate(200 196)">' + (lg.bgRemoved === false ? '<rect x="-78" y="-78" width="156" height="156" fill="#FFFFFF"/>' : '') + SAMPLE_LOGO + '</g>';
      return lg.url ? '<image href="' + esc(lg.url) + '" x="120" y="116" width="160" height="160" preserveAspectRatio="xMidYMid meet"/>' : '';
    }
    if (d.kind === 'monogram') return '<text x="200" y="228" font-size="92" letter-spacing="4" text-anchor="middle" font-family="' + fam + '" fill="' + ink + '">' + esc(d.mono) + '</text>';
    var s1 = fitSize(d.line1 || '', 46), s2 = d.line2 ? Math.min(Math.round(s1 * 1.25), fitSize(d.line2, 40)) : 0;
    var y1 = Math.round(196 - (s1 + (d.line2 ? 10 + s2 : 0)) / 2 + s1 * 0.8);
    return '<g text-anchor="middle" font-family="' + fam + '" fill="' + ink + '"><text x="200" y="' + y1 + '" font-size="' + s1 + '">' + esc(d.line1) + '</text>' +
      (d.line2 ? '<text x="200" y="' + (y1 + 10 + s2) + '" font-size="' + s2 + '">' + esc(d.line2) + '</text>' : '') + '</g>';
  }
  function recentThumb(d) {
    var missing = d.product === 'hat' || d.page ? !d.preview : d.kind === 'logo' && d.logo && !d.logo.sample && !d.logo.url;
    if (missing) {
      return '<span class="recent-missing"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5L6 19.5"/></svg>Preview unavailable</span>';
    }
    if (d.product === 'hat' || d.page) return '<img class="recent-hat" src="' + esc(d.preview) + '" alt="">';
    return '<span class="ball"><svg class="ball-svg" viewBox="0 0 400 400" aria-hidden="true"><image href="../shared/ball.webp" width="400" height="400"/>' +
      '<g style="mix-blend-mode: multiply">' + ballPrint(d) + '</g></svg></span>';
  }
  // One design on the shelf: the product, its code and when it was saved (or that it's the one open now).
  function recentCard(d) {
    var hat = d.product === 'hat', here = (d.product || 'ball') === PRODUCT, open = here && state.saved && d.code === state.code;
    var name = d.name || (hat ? 'Custom rope hats' : 'Custom golf balls'), status = open ? 'Open now' : savedText(d.saved);
    var href = (here ? '' : d.page || (hat ? 'hat.html' : './')) + '?design=' + encodeURIComponent(d.code);
    return '<li class="recent-item' + (open ? ' is-open' : '') + '"><a class="recent-link" href="' + esc(href) + '" data-recent-code="' + esc(d.code) + '"' +
      (open ? ' aria-current="true"' : '') + ' aria-label="' + esc((open ? '' : 'Open ') + 'design ' + d.code + ', ' + name + ', ' + status.toLowerCase()) + '">' +
      '<span class="recent-img">' + recentThumb(d) + '</span><span class="recent-code">Design ' + esc(d.code) + '</span>' +
      '<span class="recent-status">' + (open ? '<span class="recent-dot" aria-hidden="true"></span>' : '') + status + '</span></a></li>';
  }
  // Up to four designs stand side by side on one shelf; more start a second row on the same shelf.
  function renderRecent() {
    if (!recent.on) return;
    var items = allRecent();
    recent.list.style.setProperty('--n', String(Math.min(items.length, 4)));
    recent.list.innerHTML = items.map(recentCard).join('');
  }

  // Put a saved design back into this designer; it keeps its code and updates until it's ordered (D-29).
  function applyDesign(d) {
    clearUploadError();
    ['line1', 'line2', 'mono', 'font', 'color', 'qty', 'shape', 'material', 'patch', 'edge', 'logoSize'].concat(P.keep || []).forEach(function (k) { if (d[k] != null) state[k] = d[k]; });
    if (!COLORS[state.color]) state.color = Object.keys(COLORS)[0];
    state.tab = d.kind; state.code = d.code; state.saved = true; state.dirty = false;
    el.line1.value = state.line1; el.line2.value = state.line2; el.mono.value = state.mono;
    if (d.logo) {
      var logo = state.logo = { sample: !!d.logo.sample, name: d.logo.name, url: d.logo.sample ? null : d.logo.url || null,
        bgRemoved: d.logo.sample ? d.logo.bgRemoved !== false : false, lowRes: false, isPdf: !!d.logo.isPdf };
      if (logo.url) {
        el.thumbUpload.src = logo.url;
        var probe = new Image();
        probe.onload = function () { logo.lowRes = Math.max(probe.naturalWidth, probe.naturalHeight) < MIN_PX && !/\.svg$/i.test(logo.name); render(); };
        probe.src = logo.url;
      }
    }
  }
  function recentStart() {
    var q = new URLSearchParams(window.location.search);
    if (q.get('recent') === 'reset') {
      try { localStorage.removeItem(RECENT_KEY); } catch (e) { /* storage blocked: nothing was kept */ }
      q.delete('recent'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    }
    // A new design takes the next free code, so it never lands on one already saved here.
    var codes = readRecent().map(function (d) { return Number(String(d.code).replace(/\D/g, '')); });
    if (codes.indexOf(Number(state.code.replace(/\D/g, ''))) !== -1) state.code = 'HGS-' + (Math.max.apply(null, codes) + 1);
    var asked = q.get('design') && findRecent(q.get('design'));
    if (asked && (asked.product || 'ball') === PRODUCT) applyDesign(asked);
    renderRecent();
  }
  if (recent.root && !signedIn()) {
    recent.on = true;
    recent.list = recent.root.querySelector('[data-recent-list]');
    recent.root.hidden = false;
    recent.list.addEventListener('click', function (e) {
      var a = e.target.closest('[data-recent-code]'), d = a && findRecent(a.dataset.recentCode);
      if (!d || (d.product || 'ball') !== PRODUCT) return;   // the other designer opens on its own page
      e.preventDefault();
      var already = state.saved && state.code === d.code;
      if (!already) { applyDesign(d); render(); renderRecent(); showToast('Opened design ' + d.code + '.'); }
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }

  try {
    var q = new URLSearchParams(window.location.search);
    var qs = Number(q.get('step'));
    if (qs >= 1 && qs <= 3) state.step = qs;
    if (['logo', 'text', 'monogram'].indexOf(q.get('tab')) !== -1) state.tab = q.get('tab');
    var reviewState = q.get('state') || '';   // UI-26 error states, for review only
    if (reviewState === 'upload-failed' && uploadError.el) state.tab = 'logo';
  } catch (e) { /* ignore */ }

  if (P.init) P.init({ state: state, set: set, render: render });
  if (recent.on) recentStart();
  render();
  if (reviewState === 'upload-failed' && uploadError.el) showUploadError('convert');
  if (reviewState === 'cart-unreachable' && addError) showAddError();
})();
