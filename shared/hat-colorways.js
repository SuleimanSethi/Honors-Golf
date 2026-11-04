// The hats the hat page (UI-11) can open, each picked as it's made (D-130): four styles, every colorway, with the
// same numbers as the B2B hat survey (docs/research/2026-10-30-b2b-hat-survey.md) and the same names and swatch
// colors as Shop all (a-clean/shop.js, D-136; tools/check_hat.mjs checks all 52 against it). The page opens on the
// style the buyer clicked (?style=), which can't be switched here (D-137), and the colorway can change (?colorway=).
// The Origin is drawn in 3D from its model (D-57): `paint` gives each colorway's colors in Angle3D's convention
// (hex read as linear), solved so the render at the front of the crown matches a photo of the real hat (H-9):
// the crown (and the brim and button unless a two-tone hat gives its own), the rope (one color, or a dash, twist or
// stripe pattern of several), or a camo crown (base color first, then the blotches). Its loading picture per
// colorway is captured from the page itself, like the approved one (D-30, D-57). The other three styles have no
// model yet (D-138): they show the B2B store's photo of that colorway, front on (D-135), and `place` puts the
// decoration on the front of the crown in the photo. Which hats Honors sells is Chuck's (OQ-8).
(function () {
  'use strict';
  // Hat colors (Angle3D's convention), each solved against the reference photos.
  var C = { slate: '#0c121d', white: '#ffffff', charcoal: '#0e0e0f', navy: '#05060c', powder: '#3581ff', black: '#040505',
    grey: '#363439', bone: '#987b60', slateBrim: '#0f0f10', goldBrim: '#563c18', greenBrim: '#06100b' };
  // Camo crowns: the base color, then the blotches from light to dark.
  var CAMO = { white: ['#ffffff', '#b4b8d0', '#8a8da3'], green: ['#0f110b', '#161a0f', '#0a0c07', '#080806'],
    brown: ['#572c13', '#2a160a', '#140c09', '#080705'] };
  // Rope colors; white is Angle3D's own White 3.
  var R = { white: '#ffffff', navy: '#090915', black: '#080809', green: '#092415', forest: '#08150d', red: '#6a0a0a',
    gold: '#6b461c', brown: '#1c100b', orange: '#b53709', blue: '#2876d6' };

  window.HonorsHatStyles = {
  // The model: the 3D session's The Origin (v7, patches at real size, D-143), not the original hat.glb.
  'the-origin': { name: 'The Origin', kind: 'Structured 5-panel rope hat', rope: true, model: '../tools/the-origin.glb',
    // Real photos beside the 3D hat (D-148): the B2B store's two photos of each colorway, plain, as the
    // hat is made, at img/hat-origin-NNN-<view>.webp (hat.js builds the thumbnails beside the stage).
    photos: [{ view: 'front', label: 'Front' }, { view: 'angle', label: 'Side' }],
    colorways: [
      { num: '001', name: 'Slate / White Rope', swatch: 'linear-gradient(135deg, #5F6B78 0 60%, #F4F2EC 60% 100%)', still: 'img/hat-3d-still-001.webp', paint: { crown: C.slate, rope: R.white } },
      { num: '002', name: 'White / Navy Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #23305A 60% 100%)', still: 'img/hat-3d-still-002.webp', paint: { crown: C.white, rope: R.navy } },
      { num: '003', name: 'White / Blue-White Dash Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #3A6FB0 60% 100%)', still: 'img/hat-3d-still-003.webp', paint: { crown: C.white, rope: { kind: 'dash', colors: [R.blue, R.white] } } },
      { num: '004', name: 'Grey / White Rope', swatch: 'linear-gradient(135deg, #46474A 0 60%, #F4F2EC 60% 100%)', still: 'img/hat-3d-still-004.webp', paint: { crown: C.charcoal, rope: R.white } },
      { num: '005', name: 'Navy / White Rope', swatch: 'linear-gradient(135deg, #232B40 0 60%, #F4F2EC 60% 100%)', still: 'img/hat-3d-still-005.webp', paint: { crown: C.navy, rope: R.white } },
      { num: '006', name: 'Powder Blue / White-Red Twist Rope', swatch: 'linear-gradient(135deg, #A9C8E8 0 60%, #C8343C 60% 100%)', still: 'img/hat-3d-still-006.webp', paint: { crown: C.powder, rope: { kind: 'twist', colors: [R.white, R.red] } } },
      { num: '007', name: 'Black / White-Black Dash Rope', swatch: 'linear-gradient(135deg, #262626 0 60%, #F4F2EC 60% 100%)', still: 'img/hat-3d-still-007.webp', paint: { crown: C.black, rope: { kind: 'dash', colors: [R.white, R.black] } } },
      { num: '008', name: 'Powder Blue / White Rope', swatch: 'linear-gradient(135deg, #A9C8E8 0 60%, #F4F2EC 60% 100%)', still: 'img/hat-3d-still-008.webp', paint: { crown: C.powder, rope: R.white } },
      { num: '009', name: 'White / Black-White Dash Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #262626 60% 100%)', still: 'img/hat-3d-still-009.webp', paint: { crown: C.white, rope: { kind: 'dash', colors: [R.black, R.white] } } },
      { num: '010', name: 'White / Navy-White Dash Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #23305A 60% 100%)', still: 'img/hat-3d-still-010.webp', paint: { crown: C.white, rope: { kind: 'dash', colors: [R.navy, R.white] } } },
      { num: '011', name: 'White / Green-White Dash Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #2E8B57 60% 100%)', still: 'img/hat-3d-still-011.webp', paint: { crown: C.white, rope: { kind: 'dash', colors: [R.green, R.white] } } },
      { num: '012', name: 'Black / Black-White Twist Rope', swatch: 'linear-gradient(135deg, #262626 0 60%, #9A9A9A 60% 100%)', still: 'img/hat-3d-still-012.webp', paint: { crown: C.black, rope: { kind: 'twist', colors: [R.black, R.white] } } },
      { num: '013', name: 'White / Red-White-Blue Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #C8343C 60% 100%)', still: 'img/hat-3d-still-013.webp', paint: { crown: C.white, rope: { kind: 'stripes', colors: [R.white, R.red, R.white, R.navy] } } },
      { num: '014', name: 'White Camo / White Rope', swatch: 'linear-gradient(135deg, #DADCE0 0 60%, #F4F2EC 60% 100%)', still: 'img/hat-3d-still-014.webp', paint: { camo: CAMO.white, rope: R.white } },
      { num: '015', name: 'White Camo / Navy Rope', swatch: 'linear-gradient(135deg, #DADCE0 0 60%, #23305A 60% 100%)', still: 'img/hat-3d-still-015.webp', paint: { camo: CAMO.white, rope: R.navy } },
      { num: '016', name: 'Grey / Navy Rope', swatch: 'linear-gradient(135deg, #B9BDC1 0 60%, #23305A 60% 100%)', still: 'img/hat-3d-still-016.webp', paint: { crown: C.grey, rope: R.navy } },
      { num: '017', name: 'Grey / White-Black Dash Rope', swatch: 'linear-gradient(135deg, #B9BDC1 0 60%, #262626 60% 100%)', still: 'img/hat-3d-still-017.webp', paint: { crown: C.grey, rope: { kind: 'dash', colors: [R.white, R.black] } } },
      { num: '018', name: 'White / Orange-White Dash Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #E07A2E 60% 100%)', still: 'img/hat-3d-still-018.webp', paint: { crown: C.white, rope: { kind: 'dash', colors: [R.orange, R.white] } } },
      { num: '019', name: 'White / Black-White Twist Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #555555 60% 100%)', still: 'img/hat-3d-still-019.webp', paint: { crown: C.white, rope: { kind: 'twist', colors: [R.black, R.white] } } },
      { num: '020', name: 'White / Black Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #262626 60% 100%)', still: 'img/hat-3d-still-020.webp', paint: { crown: C.white, rope: R.black } },
      { num: '021', name: 'White / Green Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #2E8B57 60% 100%)', still: 'img/hat-3d-still-021.webp', paint: { crown: C.white, rope: R.green } },
      { num: '023', name: 'White / Forest Green Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #1F4A36 60% 100%)', still: 'img/hat-3d-still-023.webp', paint: { crown: C.white, rope: R.forest } },
      { num: '025', name: 'Black / White Rope', swatch: 'linear-gradient(135deg, #262626 0 60%, #F4F2EC 60% 100%)', still: 'img/hat-3d-still-025.webp', paint: { crown: C.black, rope: R.white } },
      { num: '026', name: 'Powder Blue / Red Rope', swatch: 'linear-gradient(135deg, #A9C8E8 0 60%, #C8343C 60% 100%)', still: 'img/hat-3d-still-026.webp', paint: { crown: C.powder, rope: R.red } },
      { num: '033', name: 'Bone-Slate / Green Rope', swatch: 'linear-gradient(135deg, #E6DFCF 0 60%, #2E8B57 60% 100%)', still: 'img/hat-3d-still-033.webp', paint: { crown: C.bone, brim: C.slateBrim, rope: R.forest } },
      { num: '034', name: 'White-Gold / Gold Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #C9A245 60% 100%)', still: 'img/hat-3d-still-034.webp', paint: { crown: C.white, brim: C.goldBrim, rope: R.gold } },
      { num: '035', name: 'Bone-Green / Brown Rope', swatch: 'linear-gradient(135deg, #E6DFCF 0 60%, #7A5233 60% 100%)', still: 'img/hat-3d-still-035.webp', paint: { crown: C.bone, brim: C.greenBrim, rope: R.brown } },
      { num: '036', name: 'Green Camo / Black Rope', swatch: 'linear-gradient(135deg, #5E6B4A 0 60%, #262626 60% 100%)', still: 'img/hat-3d-still-036.webp', paint: { camo: CAMO.green, button: CAMO.green[2], rope: R.black } },
      { num: '037', name: 'Brown Camo / Brown Rope', swatch: 'linear-gradient(135deg, #7A6650 0 60%, #7A5233 60% 100%)', still: 'img/hat-3d-still-037.webp', paint: { camo: CAMO.brown, button: CAMO.brown[2], rope: R.brown } }
    ] },
  'the-local': { name: 'The Local', kind: 'Unstructured 5-panel rope hat', rope: true, model: false,
    // Where the decoration sits on the photo (800 px, front on): its centre, and pixels per inch at the crown front.
    place: { x: 400, y: 392, ppi: 54, curve: 5.2 },
    colorways: [
      { num: '001', name: 'White-Green / Green Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #2E8B57 60% 100%)', photo: 'img/hat-local-001.webp' },
      { num: '002', name: 'Navy / White Rope', swatch: 'linear-gradient(135deg, #282747 0 60%, #F4F2EC 60% 100%)', photo: 'img/hat-local-002.webp' },
      { num: '003', name: 'White-Powder Blue / Red Rope', swatch: 'linear-gradient(135deg, #E3ECF3 0 60%, #C8343C 60% 100%)', photo: 'img/hat-local-003.webp' },
      { num: '004', name: 'White / Black-Blue Rope', swatch: 'linear-gradient(135deg, #F4F4F6 0 60%, #2B3A5E 60% 100%)', photo: 'img/hat-local-004.webp' }
    ] },
  'the-axis': { name: 'The Axis', kind: 'Structured 6-panel hat', rope: false, model: false,
    place: { x: 400, y: 338, ppi: 54, curve: 4.6 },
    colorways: [
      { num: '001', name: 'White', swatch: '#F4F4F6', photo: 'img/hat-axis-001.webp' },
      { num: '002', name: 'Navy', swatch: '#1B203C', photo: 'img/hat-axis-002.webp' },
      { num: '003', name: 'Powder Blue', swatch: '#98BAD7', photo: 'img/hat-axis-003.webp' },
      { num: '004', name: 'Stone', swatch: '#8E9587', photo: 'img/hat-axis-004.webp' },
      { num: '005', name: 'Black', swatch: '#171718', photo: 'img/hat-axis-005.webp' },
      { num: '006', name: 'Desert Tan', swatch: '#AB906B', photo: 'img/hat-axis-006.webp' },
      { num: '007', name: 'Grey', swatch: '#494848', photo: 'img/hat-axis-007.webp' },
      { num: '008', name: 'White Camo', swatch: '#DADCE0', photo: 'img/hat-axis-008.webp' },
      { num: '009', name: 'Pink', swatch: '#EFC7CA', photo: 'img/hat-axis-009.webp' },
      { num: '010', name: 'Pink', swatch: '#B9D7D8', photo: 'img/hat-axis-010.webp' },
      { num: '011', name: 'Bone', swatch: '#EBE8DC', photo: 'img/hat-axis-011.webp' }
    ] },
  'the-performance-dad': { name: 'The Performance Dad', kind: 'Unstructured low-profile hat', rope: false, model: false,
    place: { x: 400, y: 362, ppi: 57, curve: 4.8 },
    colorways: [
      { num: '001', name: 'White', swatch: '#F4F4F6', photo: 'img/hat-dad-001.webp' },
      { num: '002', name: 'Black', swatch: '#1E1F1F', photo: 'img/hat-dad-002.webp' },
      { num: '003', name: 'Grey', swatch: '#63696C', photo: 'img/hat-dad-003.webp' },
      { num: '004', name: 'Slate', swatch: '#587CA1', photo: 'img/hat-dad-004.webp' },
      { num: '005', name: 'Beige', swatch: '#E8DFD5', photo: 'img/hat-dad-005.webp' },
      { num: '006', name: 'Navy', swatch: '#252836', photo: 'img/hat-dad-006.webp' },
      { num: '007', name: 'Light Blue', swatch: '#CCDDF3', photo: 'img/hat-dad-007.webp' },
      { num: '008', name: 'Purple', swatch: '#B5A9BD', photo: 'img/hat-dad-008.webp' }
    ] }
  };
})();
