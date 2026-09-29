// Contact page (UI-05). A prototype form: sending checks the fields and shows a confirmation on the page;
// nothing is sent or uploaded. The form opens blank, as a visitor sees it. Review-only: ?state=sent shows the
// confirmation with the shared sample buyer's message. Also runs the questions' topic tabs (the questions
// themselves are native <details>, one open at a time).
(function () {
  'use strict';

  var SAMPLE = {
    topic: 'An order I’ve placed', order: '1042',
    name: 'Alex Morgan', email: 'alex@pinecrestgolf.example', club: 'Pinecrest Golf Club', phone: '',
    message: 'Hi, our member-guest hats (48 Forest rope hats, design HGS-10423) are in production. Our event is on October 12. Could they reach us by October 9? If that’s tight, we’re happy to take 24 early and the rest after. Thanks, Alex'
  };
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function $(id) { return document.getElementById(id); }
  function out(name) { return document.querySelector('[data-out-' + name + ']'); }

  var form = $('contact-form');
  var sent = document.querySelector('[data-sent-view]');
  var orderField = document.querySelector('[data-order-field]');
  var topics = form.querySelectorAll('input[name="topic"]');
  var attach = $('attach'), attachFile = document.querySelector('[data-attach-file]');

  function pickedTopic() { return form.querySelector('input[name="topic"]:checked'); }
  function syncOrderField() {
    var t = pickedTopic();
    orderField.hidden = !(t && t.hasAttribute('data-needs-order'));
  }

  function syncAttach() {
    var f = attach && attach.files && attach.files[0];
    if (!attachFile) return;
    attachFile.hidden = !f;
    document.querySelector('[data-attach-label]').hidden = !!f;
    if (f) document.querySelector('[data-attach-name]').textContent = f.name;
  }

  function fill(d) {
    topics.forEach(function (t) { t.checked = !!d && t.value === d.topic; });
    ['order', 'name', 'email', 'club', 'phone', 'message'].forEach(function (k) { $(k).value = d ? d[k] : ''; });
    if (attach) attach.value = '';
    clearErrors(); syncOrderField(); syncAttach();
  }

  function setError(id, text) {
    $(id).setAttribute('aria-invalid', 'true');
    var msg = $(id + '-error'); msg.textContent = text; msg.hidden = false;
  }
  function clearErrors() {
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    form.querySelectorAll('.field-error').forEach(function (el) { el.hidden = true; });
  }

  function validate() {
    clearErrors();
    var bad = [];
    if (!$('name').value.trim()) { setError('name', 'Enter your name.'); bad.push('name'); }
    var email = $('email').value.trim();
    if (!email) { setError('email', 'Enter your email address.'); bad.push('email'); }
    else if (!EMAIL.test(email)) { setError('email', 'Enter a full email address.'); bad.push('email'); }
    if (!$('message').value.trim()) { setError('message', 'Write a short message.'); bad.push('message'); }
    return bad;
  }

  function showSent() {
    var t = pickedTopic();
    var order = $('order').value.trim().replace(/^#/, '');
    var file = attach && attach.files && attach.files[0];
    out('name').textContent = $('name').value.trim().split(/\s+/)[0];
    out('email').textContent = $('email').value.trim();
    out('topic').textContent = t ? t.value : 'General question';
    out('order-row').hidden = !(t && t.hasAttribute('data-needs-order') && order);
    out('order').textContent = '#' + order;
    out('file-row').hidden = !file;
    out('file').textContent = file ? file.name : '';
    out('message').textContent = $('message').value.trim();
    form.hidden = true; sent.hidden = false;
    document.querySelectorAll('[data-form-head]').forEach(function (h) { h.hidden = true; });
  }

  topics.forEach(function (t) { t.addEventListener('change', syncOrderField); });
  ['name', 'email', 'message'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      if ($(id).getAttribute('aria-invalid')) { $(id).removeAttribute('aria-invalid'); $(id + '-error').hidden = true; }
    });
  });
  if (attach) {
    attach.addEventListener('change', syncAttach);
    document.querySelector('[data-attach-clear]').addEventListener('click', function () { attach.value = ''; syncAttach(); attach.focus(); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();   // a prototype: nothing leaves the page
    var bad = validate();
    if (bad.length) { $(bad[0]).focus(); return; }
    showSent();
    $('sent-title').focus();
  });

  document.querySelector('[data-send-another]').addEventListener('click', function () {
    fill(null); sent.hidden = true; form.hidden = false;
    document.querySelectorAll('[data-form-head]').forEach(function (h) { h.hidden = false; });
    $('name').focus();
  });

  // Common questions: tabs (arrow keys move between them)
  document.querySelectorAll('[data-tabs]').forEach(function (list) {
    var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        $(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (e.key === 'Home') step = -i; if (e.key === 'End') step = tabs.length - 1 - i;
        if (step === undefined) return;
        e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
  });

  // Review-only state, marked in the review bar
  var state = new URLSearchParams(location.search).get('state') === 'sent' ? 'sent' : '';
  fill(null);
  if (state === 'sent') { fill(SAMPLE); showSent(); }
  document.querySelectorAll('.review-switch [data-state]').forEach(function (a) {
    if (a.getAttribute('data-state') === state) a.setAttribute('aria-current', 'true');
  });
})();
