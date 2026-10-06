// Chuck's form (docs/design/chuck-form-questions.md), one question at a time. Six jobs:
// 1. Screens: Welcome, the 13 questions, Review and Sent, one at a time. The address bar's #q1..#q13 / #review keeps
//    the browser's Back button working; Enter moves on (Ctrl or Cmd + Enter in a text box). Picking an answer never
//    moves on by itself: Chuck presses Next (owner, 2026-10-06).
// 2. Side navigation: the four parts and their questions, each a link; a tick for answered, Forest for the open one.
//    On narrow screens it slides in from "All questions".
// 3. Required answers: every question except 7 and 10 to 13 needs one. Next on an empty required question says what to do and
//    stays; the review lists what's missing, and Send waits until nothing is.
// 4. Links between questions: 2 offers only the buyers ticked in 1 (tick any number); 5 is "keep it" or a new version; 6 adds
//    categories as chips (or "no other categories"); 7 gives every category except Hats a brands box; 8 and 9 open
//    their follow-up on Yes.
// 5. The draft is kept in this browser (localStorage) as Chuck types, so he can stop and come back.
// 6. Send posts the answers to ENDPOINT, the Google Sheet's script (a row, and an email to the owner with a PDF; D-110).
//    With ENDPOINT empty, Send is a demo that succeeds; ?state=sent and ?state=failed show the two results for review.
(function () {
  'use strict';
  // The Google Sheet's script (design/looks/tools/form-sheet/, D-110), deployed 2026-10-07 in the owner's Google account.
  // A new version of the same deployment keeps this address; a new deployment would need it changed here.
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbwLjsXcuS0U_qCEJBzHJlpOhtbfQ5PQOGh43Jh6EdOLrPh3SNCTpbAmVL2iZH-uoSxf/exec';
  var KEY = 'honors-chuck-form-v2';
  // Screen ids stay as they were first numbered; the owner removed q3 ("who's behind Honors") and added qai (Suggested
  // AI features, after Products and brands) on 2026-10-06. The number Chuck sees comes from the position in this list,
  // so q4 shows as question 3 and qai as question 9.
  var QS = ['q1', 'q2', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'qai', 'q10', 'q11', 'q12', 'q13'];
  var OPTIONAL = ['q7', 'qai', 'q10', 'q11', 'q12', 'q13'];   // the owner's choice (2026-10-06): brands, AI features and Your take are optional; every other question needs an answer
  var ORDER = ['welcome'].concat(QS, ['review', 'sent']);
  var FIXED = ['Golf balls', 'Apparel'];   // brands boxes in question 7 that are always there (Hats take none)
  var SET = ['Hats', 'Golf balls'];        // question 6's fixed chips (owner took Apparel out, 2026-10-06)
  var PARTS = [
    { name: 'Who Honors is for', qs: ['q1', 'q2'] },
    { name: 'Your story', qs: ['q4', 'q5'] },
    { name: 'Products and brands', qs: ['q6', 'q7', 'q8', 'q9'] },
    { name: 'Suggested AI features', qs: ['qai'] },
    { name: 'Your take on the site', qs: ['q10', 'q11', 'q12', 'q13'] }
  ];
  // Column names for the Sheet, in the order Chuck sees the questions
  var SHEET = {
    q1: 'Who buys from Honors', q2: 'Who the home page speaks to first',
    q4: 'What makes Honors different', q5: 'The About page line', q6: 'Other product categories', q7: 'Shortlisted brands',
    q8: 'Bundles and event packs', q9: 'Requests for products not on the site', qai: 'AI features he would like', q10: 'What he likes most',
    q11: 'What feels off', q12: 'What else the site should do', q13: 'Sites he likes, competitors'
  };
  var PLACEHOLDER = { 'Golf balls': 'For example: Titleist, Callaway', 'Apparel': 'For example: Peter Millar' };
  var X_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function blank() { return { q1: [], q1Other: '', q2: [], q4: '', q5Choice: '', q5: '', added: [], q6None: false, brands: {}, q8: '', q8More: '', q9: '', q9More: '', qai: [], q10: '', q11: '', q12: '', q13: '' }; }
  var d = blank();
  var meta = { sentAt: null, changedSinceSent: false, last: '' };
  var storageOk = true, touched = false, sending = false, failed = false, fromReview = false, current = '';
  var saveTimer = null;
  var forced = new URLSearchParams(location.search).get('state');   // review only: 'sent' or 'failed'

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  var form = $('#qf-form');
  var screens = $all('[data-screen]');
  var nav = $('[data-nav]'), backBtn = $('[data-back]'), nextBtn = $('[data-next]'), saved = $('[data-saved]');
  var progress = $('[data-progress]'), fillBar = $('[data-fill]'), ball = $('[data-ball]'), count = $('[data-count]');
  var side = $('[data-side]'), sideOpen = $('[data-side-open]'), sideClose = $('[data-side-close]'), scrim = $('[data-side-scrim]'), sideCount = $('[data-side-count]');
  var otherToggle = $('[data-other-toggle]'), otherBox = $('[data-other]'), otherInput = $('#q1-other');
  var q2Box = $('[data-q2-options]'), q2Empty = $('[data-q2-empty]');
  var chips = $('[data-chips]'), addInput = $('[data-add-input]'), addBtn = $('[data-add]'), addNote = $('[data-add-note]'), noneBox = $('[data-none]');
  var brandRows = $('[data-brand-rows]'), review = $('[data-review]'), sendError = $('[data-send-error]');
  var missingBox = $('[data-missing]'), missingText = $('[data-missing-text]'), firstMissing = $('[data-first-missing]');
  var startBtn = $('[data-start]'), resumeNote = $('[data-resume-note]'), sentWhen = $('[data-sent-when]');
  var announcer = $('[data-announce]');
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  function say(msg) { announcer.textContent = ''; setTimeout(function () { announcer.textContent = msg; }, 30); }
  function when(ts) {
    var t = new Date(ts), now = new Date();
    var time = t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return t.toDateString() === now.toDateString() ? 'today at ' + time : t.toLocaleDateString([], { month: 'long', day: 'numeric' }) + ' at ' + time;
  }
  function same(a, b) { return a.toLowerCase() === b.toLowerCase(); }
  // Question 7's boxes: the fixed ones, then his own categories (one box only if he adds e.g. Apparel himself)
  function brandCategories() { return FIXED.concat(d.added.filter(function (n) { return !FIXED.some(function (f) { return same(f, n); }); })); }
  function buyerLabel(v) { return v === 'Other' ? (d.q1Other.trim() || 'Other') : v; }
  function isRequired(q) { return OPTIONAL.indexOf(q) === -1; }
  function screenEl(name) { return $('[data-screen="' + name + '"]'); }

  // ---- What counts as answered, and how each answer reads ----
  function isAnswered(q) {
    if (q === 'q1') return d.q1.length > 0 && (d.q1.indexOf('Other') === -1 || !!d.q1Other.trim());
    if (q === 'q2') return d.q2.some(function (v) { return d.q1.indexOf(v) !== -1; });
    if (q === 'q5') return d.q5Choice === 'Keep it' || (d.q5Choice === 'Change it' && !!d.q5.trim());
    if (q === 'q6') return d.added.length > 0 || d.q6None;
    if (q === 'qai') return d.qai.length > 0;
    if (q === 'q7') return brandCategories().some(function (n) { return (d.brands[n] || '').trim(); });
    return !!String(d[q] || '').trim();
  }
  function missing() { return QS.filter(function (q) { return isRequired(q) && !isAnswered(q); }); }
  function answerText(q) {
    if (q === 'q1') return d.q1.map(buyerLabel).join(', ');
    if (q === 'q2') return d.q1.filter(function (v) { return d.q2.indexOf(v) !== -1; }).map(buyerLabel).join(', ');
    if (q === 'q5') return d.q5Choice === 'Keep it' ? 'Keep it as it is' : d.q5.trim();
    if (q === 'q6') return d.added.length ? d.added.join(', ') : d.q6None ? 'No other categories for now' : '';
    if (q === 'qai') return d.qai.join(', ');
    if (q === 'q7') return brandCategories().filter(function (n) { return (d.brands[n] || '').trim(); }).map(function (n) { return n + ': ' + d.brands[n].trim(); }).join('\n');
    if (q === 'q8' || q === 'q9') { var more = d[q + 'More'].trim(); return d[q] === 'Yes' && more ? 'Yes. ' + more : d[q]; }
    return String(d[q] || '').trim();
  }
  // What to do when Next is pressed on an empty required question
  function needs(q) {
    if (q === 'q1') return d.q1.indexOf('Other') !== -1 && !d.q1Other.trim() ? 'Tell us who else, or untick Other.' : 'Tick at least one to go on.';
    if (q === 'q2') return d.q1.length ? 'Tick at least one to go on.' : 'Tick at least one buyer in question 1 first.';
    if (q === 'q5') return d.q5Choice === 'Change it' ? 'Write your version, or pick Yes, keep it.' : 'Pick one to go on.';
    if (q === 'q6') return 'Add a category, or tick No other categories for now.';
    if (q === 'q8' || q === 'q9') return 'Pick one to go on.';
    return 'Write an answer to go on. A few words is fine.';
  }

  // ---- The draft, kept in this browser ----
  function save() {
    if (forced) return;   // the review states never overwrite a real draft
    try { localStorage.setItem(KEY, JSON.stringify({ v: 2, data: d, meta: meta })); storageOk = true; }
    catch (e) { storageOk = false; }
    renderSaved();
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.data) {
        d = Object.assign(blank(), s.data);
        if (!Array.isArray(d.q1)) d.q1 = [];
        if (!Array.isArray(d.q2)) d.q2 = d.q2 ? [d.q2] : [];   // drafts from when question 2 was pick-one
        if (!Array.isArray(d.added)) d.added = [];
        if (!Array.isArray(d.qai)) d.qai = [];
        if (!d.brands || typeof d.brands !== 'object') d.brands = {};
        if (!d.q5Choice && d.q5.trim()) d.q5Choice = 'Change it';   // drafts from before question 5 had choices
        meta = Object.assign(meta, s.meta || {});
      }
    } catch (e) { storageOk = false; }
  }
  function changed() {
    touched = true;
    if (meta.sentAt) meta.changedSinceSent = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 300);
    clearError();
    renderNav(); renderSide();
  }

  // ---- Putting the draft on the page ----
  function fill() {
    $all('[data-field]').forEach(function (el) { el.value = d[el.getAttribute('data-field')] || ''; });
    $all('input[name="q1"]').forEach(function (i) { i.checked = d.q1.indexOf(i.value) !== -1; });
    $all('input[name="qai"]').forEach(function (i) { i.checked = d.qai.indexOf(i.value) !== -1; });
    ['q5Choice', 'q8', 'q9'].forEach(function (n) { $all('input[name="' + n + '"]').forEach(function (i) { i.checked = i.value === d[n]; }); });
    noneBox.checked = !!d.q6None;
    $all('.qf-chip.is-added', chips).forEach(function (c) { c.remove(); });
    d.added.forEach(function (n) { chips.appendChild(chip(n, false)); });
    syncOther(); syncFollow();
  }
  function syncOther() { otherBox.hidden = !otherToggle.checked; }
  function syncFollow() {
    $all('[data-follow]').forEach(function (box) { box.hidden = d[box.getAttribute('data-follow')] !== (box.getAttribute('data-follow-when') || 'Yes'); });
  }
  function grow(el) { el.style.height = 'auto'; el.style.height = (el.scrollHeight + 3) + 'px'; }   // 3px = the two 1.5px edges

  // Next on an empty required question: say what to do, beside the answer
  function showError(q) {
    var el = screenEl(q), box = el.querySelector('[data-error]');
    if (!box) { box = document.createElement('p'); box.className = 'qf-error'; box.setAttribute('data-error', ''); box.setAttribute('role', 'alert'); el.querySelector('.qf-answer').appendChild(box); }
    box.textContent = needs(q);
    box.hidden = false;
  }
  function clearError() { $all('[data-error]').forEach(function (b) { b.hidden = true; }); }

  // Question 2: a tick box per buyer ticked in question 1
  function renderQ2() {
    q2Box.textContent = '';
    d.q1.forEach(function (v) {
      var label = document.createElement('label'); label.className = 'qf-opt';
      var input = document.createElement('input'); input.type = 'checkbox'; input.name = 'q2'; input.value = v; input.checked = d.q2.indexOf(v) !== -1;
      var box = document.createElement('span'); box.className = 'qf-opt-box';
      var name = document.createElement('span'); name.className = 'qf-opt-name'; name.textContent = buyerLabel(v);
      box.appendChild(name); label.appendChild(input); label.appendChild(box); q2Box.appendChild(label);
    });
    q2Box.hidden = !d.q1.length;
    q2Empty.hidden = d.q1.length > 0;
  }

  // Question 6: categories as chips, or "no other categories"
  function chip(name, isNew) {
    var li = document.createElement('li');
    li.className = 'qf-chip is-added' + (isNew ? ' is-new' : '');
    var span = document.createElement('span'); span.textContent = name;
    var x = document.createElement('button'); x.type = 'button'; x.className = 'qf-chip-x';
    x.setAttribute('data-remove', name); x.setAttribute('aria-label', 'Remove ' + name); x.innerHTML = X_ICON;
    li.appendChild(span); li.appendChild(x);
    return li;
  }
  function addCategory() {
    var v = addInput.value.trim().replace(/\s+/g, ' ');
    if (!v) { addNote.textContent = 'Type a category first, then press Add.'; addInput.focus(); return; }
    if (SET.concat(d.added).some(function (n) { return same(n, v); })) { addNote.textContent = v + ' is already on the list.'; return; }
    d.added.push(v);
    d.q6None = false; noneBox.checked = false;
    chips.appendChild(chip(v, true));
    addInput.value = ''; addNote.textContent = v + ' added.'; addInput.focus();
    changed();
  }
  addBtn.addEventListener('click', addCategory);
  chips.addEventListener('click', function (e) {
    var x = e.target.closest('[data-remove]');
    if (!x) return;
    var name = x.getAttribute('data-remove');
    d.added = d.added.filter(function (n) { return n !== name; });
    if (!FIXED.some(function (f) { return same(f, name); })) delete d.brands[name];   // Apparel's brands box stays in question 7
    x.closest('li').remove();
    addNote.textContent = name + ' removed.'; addInput.focus();
    changed();
  });

  // Question 7: a brands box per category, Hats excluded
  function renderBrands() {
    brandRows.textContent = '';
    brandCategories().forEach(function (name, i) {
      var row = document.createElement('div'); row.className = 'qf-brand-row';
      var label = document.createElement('label'); label.htmlFor = 'brand-' + i; label.textContent = name;
      var input = document.createElement('input'); input.type = 'text'; input.id = 'brand-' + i; input.autocomplete = 'off';
      input.setAttribute('data-brand', name); input.value = d.brands[name] || '';
      input.placeholder = PLACEHOLDER[name] || 'Brands, separated by commas';
      row.appendChild(label); row.appendChild(input); brandRows.appendChild(row);
    });
  }

  // Review: every answer by part, each with Change; what's missing on top
  function renderReview() {
    review.textContent = '';
    PARTS.forEach(function (part) {
      var sec = document.createElement('section'); sec.className = 'qf-review-part';
      var h = document.createElement('h2'); h.textContent = part.name; sec.appendChild(h);
      var dl = document.createElement('dl');
      part.qs.forEach(function (q) {
        var item = document.createElement('div'); item.className = 'qf-review-item'; item.id = 'review-' + q;
        var question = $('#' + q + '-title').textContent;
        var dt = document.createElement('dt'); dt.textContent = question;
        var dd = document.createElement('dd'); var a = isAnswered(q) ? answerText(q) : '';
        var gap = isRequired(q) && !a;
        dd.textContent = a || (gap ? 'Needs an answer' : 'Skipped (optional)');
        if (!a) dd.className = gap ? 'is-missing' : 'is-skipped';
        var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'qf-text-btn';
        btn.setAttribute('data-change', q); btn.textContent = gap ? 'Answer' : a ? 'Change' : 'Add';
        btn.setAttribute('aria-label', (gap ? 'Answer: ' : 'Change your answer to: ') + question);
        item.appendChild(dt); item.appendChild(dd); item.appendChild(btn); dl.appendChild(item);
      });
      sec.appendChild(dl); review.appendChild(sec);
    });
    var m = missing();
    missingBox.hidden = !m.length;
    missingText.textContent = m.length === 1 ? '1 question still needs an answer before you can send.' : m.length + ' questions still need an answer before you can send.';
    sendError.hidden = !failed;
  }
  review.addEventListener('click', function (e) {
    var b = e.target.closest('[data-change]');
    if (!b) return;
    fromReview = true;
    go(b.getAttribute('data-change'));
  });
  firstMissing.addEventListener('click', function () { var m = missing(); if (m.length) { fromReview = true; go(m[0]); } });

  function renderWelcome() {
    var n = QS.filter(isAnswered).length;
    if (meta.sentAt) { startBtn.textContent = 'Change an answer'; resumeNote.textContent = 'You sent your answers ' + when(meta.sentAt) + '.'; }
    else if (n > 0) { startBtn.textContent = 'Continue'; resumeNote.textContent = 'You’ve answered ' + n + ' of ' + QS.length + '.'; }
    else { startBtn.textContent = 'Start'; resumeNote.textContent = ''; }
    resumeNote.hidden = !resumeNote.textContent;
  }
  startBtn.addEventListener('click', function () {
    if (meta.sentAt) go('review');
    else go(QS.indexOf(meta.last) !== -1 ? meta.last : 'q1');
  });
  $all('[data-go]').forEach(function (b) { b.addEventListener('click', function () { fromReview = false; go(b.getAttribute('data-go')); }); });

  // ---- Side navigation ----
  function renderSide() {
    var on = QS.indexOf(current) !== -1 || current === 'review';
    side.hidden = !on;
    sideOpen.hidden = !on;
    document.body.classList.toggle('no-side', !on);
    if (!on) return;
    var reviewed = current === 'review';
    $all('[data-side-link]').forEach(function (a) {
      var q = a.getAttribute('data-side-link');
      if (q === current) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      if (q === 'review') return;
      var done = isAnswered(q);
      a.classList.toggle('is-done', done);
      a.classList.toggle('is-missing', reviewed && !done && isRequired(q));   // after a visit to the review, mark the gaps
      a.setAttribute('aria-label', a.textContent.replace(/\s+/g, ' ').trim() + (done ? ', answered' : isRequired(q) ? ', not answered yet' : ', optional'));
    });
    var m = missing().length;
    sideCount.textContent = m ? m + ' to go' : 'Ready';
  }
  function openSide(open) {
    document.body.classList.toggle('side-open', open);
    scrim.hidden = !open;
    sideOpen.setAttribute('aria-expanded', String(open));
    if (open) { var a = side.querySelector('[aria-current]') || side.querySelector('a'); a.focus(); }
  }
  sideOpen.addEventListener('click', function () { openSide(true); });
  sideClose.addEventListener('click', function () { openSide(false); sideOpen.focus(); });
  scrim.addEventListener('click', function () { openSide(false); });
  side.addEventListener('click', function (e) { if (e.target.closest('a')) { fromReview = false; openSide(false); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('side-open')) { openSide(false); sideOpen.focus(); } });

  // ---- Controls and progress ----
  function renderSaved() {
    saved.classList.toggle('is-warn', !storageOk);
    saved.textContent = !storageOk ? 'Not saved on this computer' : touched ? 'Saved on this computer' : '';
  }
  function renderNav() {
    var isQ = QS.indexOf(current) !== -1;
    nav.hidden = !(isQ || current === 'review');
    if (nav.hidden) return;
    var label, primary = true;
    if (current === 'review') label = sending ? 'Sending…' : failed ? 'Try again' : (meta.sentAt && !meta.changedSinceSent) ? 'Send again' : 'Send answers';
    else if (fromReview) label = 'Back to review';
    else label = current === 'q13' ? 'Review answers' : 'Next';   // optional questions say Next too (owner, 2026-10-06): no Skip button
    nextBtn.textContent = label;
    nextBtn.classList.toggle('is-primary', primary);
    nextBtn.classList.toggle('is-skip', !primary);
    nextBtn.disabled = sending;
    renderSaved();
  }
  function renderProgress() {
    var qi = QS.indexOf(current);
    var on = qi !== -1 || current === 'review';
    progress.hidden = !on;
    if (!on) return;
    var step = current === 'review' ? 1 : qi / QS.length;
    var pos = 'calc((100% - 14px) * ' + step + ')';   // the line stops 14px short of the flag
    fillBar.style.width = pos; ball.style.left = pos;
    count.textContent = current === 'review' ? 'Review' : 'Question ' + (qi + 1) + ' of ' + QS.length;
  }

  // ---- Moving between screens ----
  function show(name) {
    if (ORDER.indexOf(name) === -1) name = 'welcome';
    if (name === 'sent' && !meta.sentAt) name = 'review';
    var goingBack = ORDER.indexOf(name) < ORDER.indexOf(current);
    current = name;
    var el = null;
    screens.forEach(function (s) {
      var on = s.getAttribute('data-screen') === name;
      s.hidden = !on;
      if (on) { el = s; s.classList.remove('is-in', 'is-back'); void s.offsetWidth; s.classList.add('is-in'); s.classList.toggle('is-back', goingBack); }
    });
    document.body.classList.toggle('on-welcome', name === 'welcome');
    document.body.classList.toggle('on-review', name === 'review');
    document.body.classList.toggle('on-sent', name === 'sent');
    clearError();
    if (name === 'q2') renderQ2();
    if (name === 'q6') addNote.textContent = '';
    if (name === 'q7') renderBrands();
    if (name === 'review') renderReview();
    if (name === 'welcome') renderWelcome();
    if (name === 'sent') sentWhen.textContent = 'Sent ' + when(meta.sentAt) + '. Your answers are with Suleiman. If anything changes, come back to this page, change an answer and send again.';
    if (QS.indexOf(name) !== -1 && meta.last !== name) { meta.last = name; save(); }
    $all('textarea', el).forEach(grow);
    renderNav(); renderProgress(); renderSide(); markReviewLink();
    window.scrollTo(0, 0);
    // Focus: straight into the box on a typing question (with a mouse; on phones the keyboard would cover the
    // question), otherwise the question itself, so a screen reader reads it
    var field = el.querySelector('textarea, input[type="text"]');
    if (finePointer && field && !field.closest('[hidden]') && !el.querySelector('.qf-options')) field.focus({ preventScroll: true });
    else { var h = el.querySelector('h1'); if (h) h.focus({ preventScroll: true }); }
  }
  function go(name) { if (location.hash.slice(1) === name) show(name); else location.hash = name; }
  window.addEventListener('hashchange', function () { show(location.hash.slice(1) || 'welcome'); });

  function next() {
    if (current === 'q6' && addInput.value.trim()) addCategory();   // typed but not added yet: keep it
    if (QS.indexOf(current) !== -1 && isRequired(current) && !isAnswered(current)) { showError(current); return; }
    if (fromReview && QS.indexOf(current) !== -1) { fromReview = false; go('review'); return; }
    go(ORDER[ORDER.indexOf(current) + 1]);
  }
  function back() { fromReview = false; go(ORDER[Math.max(0, ORDER.indexOf(current) - 1)]); }
  backBtn.addEventListener('click', back);
  nextBtn.addEventListener('click', function () { if (current === 'review') sendNow(); else next(); });

  // ---- Typing and picking ----
  form.addEventListener('input', function (e) {
    var t = e.target, f = t.getAttribute('data-field');
    if (t.matches('[data-add-input]')) { addNote.textContent = ''; clearError(); renderNav(); return; }   // not an answer until added
    if (f) { d[f] = t.value; if (t.tagName === 'TEXTAREA') grow(t); }
    if (t.hasAttribute('data-brand')) d.brands[t.getAttribute('data-brand')] = t.value;
    changed();
  });
  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'q1') {
      d.q1 = $all('input[name="q1"]:checked').map(function (i) { return i.value; });
      d.q2 = d.q2.filter(function (v) { return d.q1.indexOf(v) !== -1; });   // an unticked buyer leaves question 2 too
      syncOther();
      if (t === otherToggle && t.checked) otherInput.focus();
      changed();
    } else if (t === noneBox) {
      d.q6None = t.checked;
      changed();
    } else if (t.name === 'qai') {
      d.qai = $all('input[name="qai"]:checked').map(function (i) { return i.value; });
      changed();
    } else if (t.name === 'q2') {
      d.q2 = $all('input[name="q2"]:checked').map(function (i) { return i.value; });
      changed();
    } else if (t.name === 'q5Choice' || t.name === 'q8' || t.name === 'q9') {
      d[t.name] = t.value;
      syncFollow(); changed();
      var follow = $('[data-follow="' + t.name + '"]');
      if (follow && !follow.hidden) { var box = follow.querySelector('textarea'); grow(box); box.focus(); }
    }
  });
  // Enter moves on. In a text box Enter is a new line, so Ctrl or Cmd + Enter moves on; in question 6's box Enter adds
  // the category; in question 7 it steps to the next brands box.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.isComposing || QS.indexOf(current) === -1) return;
    var t = e.target;
    if (t.closest('a, button, .review-switch, [data-side]')) return;
    if (t.tagName === 'TEXTAREA') { if (e.metaKey || e.ctrlKey) { e.preventDefault(); next(); } return; }
    e.preventDefault();
    if (t.matches('[data-add-input]')) { if (t.value.trim()) addCategory(); else next(); return; }
    if (t.matches('[data-brand]')) { var ins = $all('[data-brand]'), i = ins.indexOf(t); if (i < ins.length - 1) ins[i + 1].focus(); else next(); return; }
    next();
  });

  // ---- Sending ----
  function rows() { return QS.map(function (q, i) { return [(i + 1) + '. ' + SHEET[q], isAnswered(q) ? answerText(q) : '']; }); }
  function send(body) {
    if (forced === 'failed') return new Promise(function (_, reject) { setTimeout(function () { reject(new Error('review')); }, 700); });
    if (!ENDPOINT) return new Promise(function (resolve) { setTimeout(resolve, 700); });   // demo until the Sheet exists
    if (navigator.onLine === false) return Promise.reject(new Error('offline'));
    // A plain-text body keeps this a simple request (no preflight), which Apps Script web apps accept
    return fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { if (!j || j.ok !== true) throw new Error('not saved'); });
  }
  function sendNow() {
    if (sending) return;
    if (missing().length) {   // nothing goes until every required question has an answer
      renderReview();
      missingBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      missingBox.focus({ preventScroll: true });
      return;
    }
    sending = true; failed = false; sendError.hidden = true; renderNav();
    send({ form: 'honors-chuck-v2', sentAt: new Date().toISOString(), answers: rows(), raw: d }).then(function () {
      sending = false; meta.sentAt = Date.now(); meta.changedSinceSent = false; save();
      go('sent'); say('Sent. Your answers are with Suleiman.');
    }, function () {
      sending = false; failed = true; sendError.hidden = false; renderNav();
      say('Your answers didn’t send. Everything you wrote is still here.');
    });
  }

  // ---- Review-only bar: mark the state on show ----
  function markReviewLink() {
    var key = forced || location.hash || '';
    $all('[data-review-link]').forEach(function (a) {
      if (a.getAttribute('data-review-link') === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  // ---- Start ----
  load();
  if (forced === 'sent') meta = Object.assign({}, meta, { sentAt: meta.sentAt || Date.now(), changedSinceSent: false });
  if (forced === 'failed') failed = true;   // review only: show the failed-send message straight away
  fill();
  show(location.hash.slice(1) || 'welcome');
})();
