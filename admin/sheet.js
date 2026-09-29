// UI-53 Production sheet (spec C-7, H-8, H-5; D-31, D-67). ?order=<number> picks the order (#1047 by default).
// Per design: the product picture, the patch or ball print drawn to scale with its measurements, and a table of every
// option by name and code (vendor codes are Chuck's, OQ-8, so they show as [brackets]). Artwork: a download per design and
// one ZIP per order (a small store-only ZIP written here). "Print or save as PDF" calls the browser's print.
(function () {
  'use strict';
  var A = window.HonorsAdmin, esc = A.esc;
  var sorted = A.ORDERS.slice().sort(function (a, b) { return a.no - b.no; });
  var wanted = Number(new URLSearchParams(location.search).get('order'));
  var o = sorted.filter(function (x) { return x.no === wanted; })[0] || sorted.filter(function (x) { return x.no === 1047; })[0];
  var club = A.BUYERS[o.buyer].club;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function longDate(s) { var t = typeof s === 'string' ? A.at(s) : s; return MONTHS[t.getMonth()].slice(0, 3) + ' ' + t.getDate() + ', ' + t.getFullYear(); }
  function qty(code) { return o.lines.reduce(function (s, l) { return s + (l.design === code ? l.qty : 0); }, 0); }
  var files = o.designs.map(function (c) { return A.DESIGNS[c]; }).filter(function (d) { return d.kind === 'logo'; }).map(function (d) { return d.logo; })
    .filter(function (f, i, a) { return a.indexOf(f) === i; });
  var ICON = {
    back: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15.5 10h-11M9 5.5 4.5 10 9 14.5"/></svg>',
    print: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 7.5v-4h9v4M5.5 14h-2v-6.5h13V14h-2"/><path d="M5.5 11.5h9v5h-9z"/></svg>',
    zip: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5v9M6 8.5l4 4 4-4M4 16.5h12"/></svg>'
  };

  // ---- The patch drawn to scale (80 px to the inch) with its measurements ----
  var PX = 80;
  function patchDrawing(d) {
    var size = A.PATCH_SIZES[d.shape], w = size.w * PX, h = size.h * PX, W = 340, H = 232;
    var x = (W - w) / 2 - (d.shape === 'Round' ? 0 : 14), y = (H - h) / 2 - 12, cx = x + w / 2, cy = y + h / 2;
    var fill = '#F4F2EC', edge = '#C9CEC9';
    var shape = d.shape === 'Round'
      ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + w / 2 + '" fill="' + fill + '" stroke="' + edge + '"/>'
      : '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + 0.14 * PX + '" fill="' + fill + '" stroke="' + edge + '"/>';
    // The artwork, as drawn on the hat pictures (a round patch is 232 units across there, a rectangle 316).
    var k = d.shape === 'Round' ? w / 232 : w / 316;
    var art = '<g transform="translate(' + cx + ' ' + cy + ') scale(' + k.toFixed(3) + ')">' + A.patchArt(d) + '</g>';
    var by = y + h + 18, bx = x + w + 18;
    var dims = '<path class="dim" d="M' + x + ' ' + (by - 5) + 'v10M' + (x + w) + ' ' + (by - 5) + 'v10M' + x + ' ' + by + 'H' + (x + w) + '"/>' +
      '<text class="dim-label" x="' + cx + '" y="' + (by + 16) + '" text-anchor="middle">' + size.w.toFixed(2) + ' in</text>';
    if (d.shape !== 'Round') {
      dims += '<path class="dim" d="M' + (bx - 5) + ' ' + y + 'h10M' + (bx - 5) + ' ' + (y + h) + 'h10M' + bx + ' ' + y + 'V' + (y + h) + '"/>' +
        '<text class="dim-label" x="' + (bx + 10) + '" y="' + (cy + 4) + '">' + size.h.toFixed(2) + ' in</text>';
    }
    return '<svg class="drawing" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(d.shape + ' patch, ' + size.w + ' by ' + size.h + ' inches, drawn to scale') + '">' + shape + art + dims + '</svg>';
  }
  // ---- The ball print, inside its imprint area (its size is Chuck's, OQ-2) ----
  function printDrawing(d) {
    return '<svg class="drawing" viewBox="0 0 340 232" role="img" aria-label="The ball print and its imprint area">' +
      '<rect class="imprint-box" x="50" y="26" width="240" height="150" rx="10"/>' +
      '<svg class="imprint-art" x="62" y="36" width="216" height="130" viewBox="70 118 260 160">' + A.ballPrint(d) + '</svg>' +
      '<text class="dim-label" x="170" y="206" text-anchor="middle">[Imprint size]</text></svg>';
  }

  // ---- The spec table: every option by name and code ----
  var VENDOR = '<span class="placeholder">[vendor code]</span>';
  function swatch(hex) { return '<span class="swatch" style="background:' + hex + '"></span>'; }
  function artworkRow(d) {
    return ['Artwork', esc(d.logo), '<span class="screen-only"><button type="button" class="dl-link" data-artwork="' + esc(d.logo) + '">Download</button></span><span class="print-only">Sent as a separate file</span>'];
  }
  function rows(d) {
    var q = function (s) { return '“' + esc(s) + '”'; };
    if (d.product === 'hat') {
      var size = A.PATCH_SIZES[d.shape], material = d.material === 'PVC' ? 'Rubber (PVC)' : 'Embroidered';
      var r = [['Hat color', d.hat, VENDOR], ['Rope', d.rope, VENDOR], ['Patch', d.shape + ', ' + (d.material === 'PVC' ? 'rubber (PVC)' : 'embroidered'), size.w.toFixed(2) + ' × ' + size.h.toFixed(2) + ' in'], ['Patch color', d.patch, VENDOR]];
      if (d.kind === 'logo') {
        var inks = A.LOGO_COLORS[d.logo] || [];
        r.push(artworkRow(d));
        r.push(['Logo colors', inks.map(function (c) { return swatch(c[1]) + c[0]; }).join('<br>') +
          '<span class="caption">' + inks.length + (inks.length === 1 ? ' color. ' : ' colors. ') + material + ' patches take up to ' + A.COLOR_LIMITS[d.material] + '.</span>',
          inks.map(function (c) { return c[1]; }).join('<br>')]);
      } else {
        var thread = A.INKS[d.thread];
        r.push([d.kind === 'monogram' ? 'Monogram' : 'Text', d.kind === 'monogram' ? q(d.mono) : q(d.line1) + (d.line2 ? ' / ' + q(d.line2) : ''), 'Figtree Bold'],
          ['Thread', swatch(thread) + A.INK_NAMES[d.thread], thread]);
      }
      return r;
    }
    var ink = A.INKS[d.color];
    var out = [['Ball', '<span class="placeholder">[Ball model]</span>', VENDOR], ['Imprint', 'One side, centered', '<span class="placeholder">[Imprint size]</span>']];
    if (d.kind === 'logo') out.push(artworkRow(d));
    else out.push(['Print', d.kind === 'monogram' ? 'Monogram ' + q(d.mono) : q(d.line1) + (d.line2 ? '<br>' + q(d.line2) : ''), ''],
      ['Lettering', A.FONT_NAMES[d.font], A.FONT_FILES[d.font]], ['Ink', swatch(ink) + A.INK_NAMES[d.color], ink]);
    return out;
  }

  function design(code, i) {
    var d = A.DESIGNS[code], n = qty(code), hat = d.product === 'hat';
    var render = A.RENDERS[code];
    var pic = render ? '<img src="' + render + '" alt="">' : A.thumb(d);
    var notes = d.artNotes && d.artNotes.length ? '<div class="art-notes"><h3>Artwork notes the buyer saw</h3><ul>' +
      d.artNotes.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '';
    return '<section class="design" aria-labelledby="d-' + code + '">' +
      (i ? '<div class="runhead print-only"><span class="wordmark-sm">Honors</span><span>Production sheet, order #' + o.no + ', ' + esc(club) + '</span></div>' : '') +
      '<div class="design-head"><h2 id="d-' + code + '">' + code + '</h2><span class="product">' + A.productName(d) + '</span>' +
        '<div class="design-qty">' + (hat ? n + ' hats' : n + ' dozen') + (hat ? '' : '<span>' + (n * 12).toLocaleString('en-US') + ' balls</span>') + '</div></div>' +
      '<div class="visuals">' +
        '<figure class="visual"><div class="visual-frame">' + pic + '</div><figcaption>' + (hat ? (render ? 'Three-quarter view' : 'Front view') : 'Preview on the ball') + '</figcaption></figure>' +
        '<figure class="visual"><div class="visual-frame is-drawing">' + (hat ? patchDrawing(d) : printDrawing(d)) + '</div><figcaption>' + (hat ? 'Patch, drawn to scale' : 'Print, centered in the imprint area') + '</figcaption></figure>' +
      '</div>' +
      '<table class="spec-table"><thead><tr><th scope="col">Option</th><th scope="col">Choice</th><th scope="col">Code</th></tr></thead><tbody>' +
        rows(d).map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; }).join('') +
      '</tbody></table>' + notes + '</section>';
  }

  // ---- The page ----
  var items = o.designs.map(function (c) { var d = A.DESIGNS[c], n = qty(c); return d.product === 'hat' ? n + ' rope hats' : n + ' dozen golf balls'; }).join(', ');
  document.title = 'Production sheet, order #' + o.no + ' · Honors Golf Supply';
  document.querySelector('[data-out="toolbar"]').innerHTML =
    '<a class="toolbar-back" href="order.html?order=' + o.no + '">' + ICON.back + 'Order #' + o.no + '</a>' +
    '<span class="toolbar-title">Production sheet</span>' +
    '<div class="toolbar-end"><span class="review-note">Sample order</span>' +
      (files.length ? '<button type="button" class="tbtn" data-zip>' + ICON.zip + 'Download artwork (ZIP)</button>' : '') +
      '<button type="button" class="tbtn is-primary" data-print>' + ICON.print + 'Print or save as PDF</button></div>';
  document.querySelector('[data-out="paper"]').innerHTML =
    '<header class="sheet-head"><div class="wordmark"><strong>Honors</strong><span>GOLF SUPPLY</span></div>' +
      '<div class="sheet-title"><h1>Production sheet</h1><p>Order #' + o.no + '</p></div></header>' +
    '<dl class="facts"><div><dt>Club</dt><dd>' + esc(club) + '</dd></div><div><dt>Paid</dt><dd>' + longDate(o.placed) + '</dd></div>' +
      '<div><dt>' + (o.designs.length > 1 ? 'Designs' : 'Design') + '</dt><dd>' + o.designs.join(', ') + '</dd></div><div><dt>Items</dt><dd>' + items + '</dd></div></dl>' +
    o.designs.map(design).join('') +
    '<footer class="sheet-foot"><span>Honors Golf Supply. Questions about this order: <span class="placeholder">[Chuck’s email]</span></span><span>Printed ' + longDate(A.NOW) + '</span></footer>';

  // Fit each ball print to its imprint box by its measured size, once the lettering's font has loaded.
  document.fonts.ready.then(function () {
    document.querySelectorAll('svg.imprint-art').forEach(function (svg) {
      var b = svg.firstElementChild.getBBox(), pad = Math.max(b.width, b.height) * 0.06;
      svg.setAttribute('viewBox', [b.x - pad, b.y - pad, b.width + 2 * pad, b.height + 2 * pad].map(function (v) { return v.toFixed(1); }).join(' '));
    });
  });

  // ---- Print, and the artwork files ----
  document.querySelector('[data-print]').addEventListener('click', function () { window.print(); });
  function save(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  document.addEventListener('click', function (e) {
    var one = e.target.closest('[data-artwork]');
    if (one) { var name = one.getAttribute('data-artwork'); A.artworkFile(name, function (b) { save(b, name); }); return; }
    if (!e.target.closest('[data-zip]')) return;
    Promise.all(files.map(function (name) {
      return new Promise(function (res) { A.artworkFile(name, function (b) { b.arrayBuffer().then(function (buf) { res({ name: name, data: new Uint8Array(buf) }); }); }); });
    })).then(function (list) { save(zip(list), 'honors-order-' + o.no + '-artwork.zip'); });
  });

  // A store-only ZIP (no compression): local headers, the files, the central directory, the end record.
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(list) {
    var t = A.NOW, dosTime = (t.getHours() << 11) | (t.getMinutes() << 5), dosDate = ((t.getFullYear() - 1980) << 9) | ((t.getMonth() + 1) << 5) | t.getDate();
    var parts = [], central = [], offset = 0;
    list.forEach(function (f) {
      var name = new TextEncoder().encode(f.name), crc = crc32(f.data), size = f.data.length;
      var head = new DataView(new ArrayBuffer(30));
      head.setUint32(0, 0x04034b50, true); head.setUint16(4, 20, true); head.setUint16(6, 0, true); head.setUint16(8, 0, true);
      head.setUint16(10, dosTime, true); head.setUint16(12, dosDate, true); head.setUint32(14, crc, true);
      head.setUint32(18, size, true); head.setUint32(22, size, true); head.setUint16(26, name.length, true); head.setUint16(28, 0, true);
      var cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0, true); cen.setUint16(10, 0, true);
      cen.setUint16(12, dosTime, true); cen.setUint16(14, dosDate, true); cen.setUint32(16, crc, true); cen.setUint32(20, size, true); cen.setUint32(24, size, true);
      cen.setUint16(28, name.length, true); cen.setUint16(30, 0, true); cen.setUint16(32, 0, true); cen.setUint16(34, 0, true); cen.setUint16(36, 0, true);
      cen.setUint32(38, 0, true); cen.setUint32(42, offset, true);
      parts.push(head.buffer, name, f.data); central.push(cen.buffer, name);
      offset += 30 + name.length + size;
    });
    var cenSize = central.reduce(function (s, p) { return s + (p.byteLength || p.length); }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, list.length, true); end.setUint16(10, list.length, true);
    end.setUint32(12, cenSize, true); end.setUint32(16, offset, true); end.setUint16(20, 0, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }
})();
