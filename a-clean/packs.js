// Event packs (UI-16, PK-1, D-125): three sample mixes for Chuck to react to (owner, session 15: "Yes, these three").
// A pack's price per player is the sum of its products' example prices (OQ-3) at the price break the field reaches: one
// of each product per player, so 72 players means 72 hats, 72 dozen balls and so on. The ladders are the same examples
// as each product page and cart.js. Each pack asks about itself on the Contact page; how a pack is ordered is settled
// once Chuck has seen them (PK-1).
(function () {
  'use strict';
  var TIERS = {
    balls: [[6, 54], [12, 49], [24, 44]], hat: [[24, 22], [48, 20], [144, 18]], towel: [[24, 14], [72, 12], [144, 11]],
    tumbler: [[24, 19], [72, 17], [144, 15]], caddy: [[24, 32], [72, 29], [144, 27]]
  };
  var PACKS = { essentials: ['balls', 'towel'], clubhouse: ['hat', 'balls', 'towel'], 'full-bag': ['hat', 'balls', 'tumbler', 'towel', 'caddy'] };
  var MIN = 24;
  function price(item, n) { var p = TIERS[item][0][1]; TIERS[item].forEach(function (t) { if (n >= t[0]) p = t[1]; }); return p; }
  function money(n) { return '$' + n.toLocaleString('en-US'); }
  var input = document.getElementById('players'), hint = document.getElementById('players-hint');
  function render() {
    var n = Math.max(0, Math.min(9999, parseInt(input.value.replace(/\D/g, ''), 10) || 0)), short = n < MIN, at = Math.max(n, MIN);
    hint.textContent = short ? 'The minimum is ' + MIN + ' players. Prices below are for ' + MIN + '.' : 'Minimum ' + MIN + ' players.';
    hint.classList.toggle('players-short', short);
    Object.keys(PACKS).forEach(function (id) {
      var card = document.querySelector('[data-pack="' + id + '"]'); if (!card) return;
      var each = PACKS[id].reduce(function (s, item) { return s + price(item, at); }, 0);
      card.querySelector('[data-pack-each]').textContent = money(each);
      card.querySelector('[data-pack-total]').textContent = at + ' players: ' + money(each * at) + ' in all';
      card.querySelector('[data-pack-cta]').href = 'contact.html?pack=' + id + '&players=' + at;
    });
  }
  input.addEventListener('input', function () { if (input.value !== '' && String(parseInt(input.value.replace(/\D/g, ''), 10) || '') !== input.value) input.value = input.value.replace(/\D/g, ''); render(); });
  input.addEventListener('blur', function () { if (!input.value) input.value = String(MIN); render(); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-players-step]'), function (b) {
    b.addEventListener('click', function () { input.value = String(Math.max(MIN, (parseInt(input.value, 10) || MIN) + Number(b.dataset.playersStep))); render(); });
  });
  render();
})();
