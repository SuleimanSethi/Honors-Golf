// Home page: Try your logo (UI-28). The sample Pinecrest logo shows first; an uploaded logo replaces it on the
// hat, the ball and the polo at once. The file never leaves the page (it's shown from a local object URL).
(function () {
  'use strict';

  var SAMPLE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-70 -70 140 140" fill="#1F2E55">' +
    '<circle r="64" fill="none" stroke="#1F2E55" stroke-width="4"/>' +
    '<polygon points="0,-50 20,-18 11,-18 27,6 -27,6 -11,-18 -20,-18"/><rect x="-5" y="6" width="10" height="11"/>' +
    '<text y="36" font-size="12" font-weight="700" letter-spacing="2" text-anchor="middle" font-family="Helvetica, Arial, sans-serif">PINECREST</text>' +
    '<text y="50" font-size="8" letter-spacing="2" text-anchor="middle" font-family="Helvetica, Arial, sans-serif">GOLF CLUB</text></svg>');

  function show(url) {
    document.querySelectorAll('[data-try-logo]').forEach(function (img) { img.src = url; });
    document.querySelectorAll('[data-try-logo-svg]').forEach(function (im) { im.setAttribute('href', url); });
  }
  show(SAMPLE);

  var input = document.getElementById('try-file'), status = document.getElementById('try-status'), current = null;
  input.addEventListener('change', function () {
    var file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { status.textContent = 'That file is over 25 MB. Try a smaller PNG or an SVG.'; return; }
    if (current) URL.revokeObjectURL(current);
    current = URL.createObjectURL(file);
    show(current);
    status.textContent = 'Showing ' + file.name + '. Open a product to start a design with it.';
  });
})();
