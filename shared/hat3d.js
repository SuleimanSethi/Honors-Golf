// The hat page's 3D view (UI-11, spec H-1), drawn the way Angle3D's customizer draws this hat (D-57). The model is
// the original Angle3D file, byte for byte (D-37, D-56), and so is the lighting: studio.hdr, from Angle3D's viewer.
// The recipe is Angle3D's own, read from its storefront config for the Brawn & Fox B2B hat: ACES tone mapping at
// exposure 2 (its "stage light intensity"), the studio lighting only (no lamps, no floor shadow), and colors applied
// as Angle3D does, with the hex read as a linear value: the hat color on the crown, brim and button, the strap and
// rope on their own; the seams (the light tape inside) and the label keep the file's own texture.
// The camera orbits like Angle3D's <model-viewer>: all the way round, and from 22.5° to 157.5° down from straight
// above, so the buyer can turn the hat over and look underneath. Drag, scroll or pinch, arrow keys, or
// Front / Side / Back. The still picture shows until the model is ready (D-30); if 3D can't load, the picture stays
// with a message (UI-26). The patch comes from hat.js.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const MODEL = '../tools/hat.glb', LIGHTING = '../tools/studio.hdr';
// Angle3D-style colors. HAT is measured so the crown comes out Honors Forest #1F4A36 (31, 73, 55 against 31, 74, 54;
// Angle3D's nearest hat color is Green 193, #06180f); ROPE is Angle3D's "White 3".
const HAT = '#06130c', ROPE = '#ffffff';
// The patch and its edge are artwork in screen colors (hat.js), so they're left out of the ACES treatment, which
// crushes dark colors, and lifted by this level; measured so the six swatches come out within about 1.4 of 255 on
// average (Forest 30, 74, 54).
const PATCH_LEVEL = 1.8;
const VIEWS = { front: [0, 80], side: [-90, 80], back: [180, 80] };   // [around, down from straight above], degrees
const START = { theta: -28, phi: 80, zoom: 0.8 };                   // the three-quarter view of the still picture
const LIMITS = { phi: [22.5, 157.5], zoom: [0.45, 1.05] };          // <model-viewer>'s own range
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A color the way Angle3D applies it: the hex digits used directly as linear values.
export function a3dColor(hex) {
  const c = parseInt(hex.slice(1), 16);
  return new THREE.Color().setRGB(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255, THREE.LinearSRGBColorSpace);
}
// Which parts each color goes on, as in Angle3D's options (Hat Color, Back Strap Color, Rope Styles).
export const PARTS = { hat: /^(head|visor|button)/i, strap: /^strap/i, rope: /^cord/i };
export function paintParts(root, colors) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const k of Object.keys(PARTS)) if (colors[k] && PARTS[k].test(o.name)) o.material.color.copy(a3dColor(colors[k]));
  });
}
// Angle3D's lighting: its studio environment, ACES tone mapping, exposure 2.
export async function angle3dLighting(renderer, scene, url = LIGHTING) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const hdr = await new RGBELoader().loadAsync(url), pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromEquirectangular(hdr).texture;
  hdr.dispose(); pm.dispose();
}

// The Brawn & Fox woven label baked into the base texture: one small label inside the hat, both faces (H-7).
// Measured in texture pixels. The Honors text is turned so it reads upright when the hat is turned over in the viewer
// (the camera never flips the hat crown-down); the back face is the same turn, mirrored.
const LABEL_FACES = [{ x: 1497, y: 181, w: 297, h: 112, turn: 'none' }, { x: 29, y: 1533, w: 131, h: 50, turn: 'mirror' }];

// The label's own copy of the base texture, with an Honors woven label painted over both faces. Only the label
// reads it; every other part of the hat keeps the original texture exactly as loaded.
export function honorsLabelTexture(texture) {
  const src = texture.image, c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(src, 0, 0);
  for (const f of LABEL_FACES) {
    const inset = Math.round(f.h * 0.14), iw = f.w - 2 * inset, ih = f.h - 2 * inset;   // inside the stitched border
    const d = g.getImageData(f.x + inset, f.y + inset, iw, ih);
    for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) {    // plain charcoal weave where the old mark was
      const i = (y * iw + x) * 4, v = 47 + (((x + y) & 3) < 2 ? 6 : -6) + (((x * 7 + y * 13) % 5) - 2);
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255;
    }
    g.putImageData(d, f.x + inset, f.y + inset);
    g.save(); g.translate(f.x + f.w / 2, f.y + f.h / 2);
    if (f.turn === 'mirror') g.scale(-1, 1);
    g.fillStyle = '#DAD7CE'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 ' + Math.round(f.h * 0.3) + 'px Figtree, Helvetica, Arial, sans-serif';
    if ('letterSpacing' in g) g.letterSpacing = Math.round(f.h * 0.06) + 'px';
    g.fillText('HONORS', 0, -f.h * 0.07);
    g.font = '600 ' + Math.round(f.h * 0.1) + 'px Figtree, Helvetica, Arial, sans-serif';
    if ('letterSpacing' in g) g.letterSpacing = Math.round(f.h * 0.03) + 'px';
    g.fillText('GOLF SUPPLY', 0, f.h * 0.2);
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  Object.assign(t, { flipY: false, colorSpace: texture.colorSpace, wrapS: texture.wrapS, wrapT: texture.wrapT,
    magFilter: texture.magFilter, minFilter: texture.minFilter, anisotropy: texture.anisotropy, channel: texture.channel });
  return t;
}

// A flat, front-facing second UV set on a patch: artwork is projected straight on, centred and never stretched.
function planarUV(mesh) {
  mesh.updateWorldMatrix(true, false);
  const pos = mesh.geometry.attributes.position, pts = [], v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).clone());
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const size = Math.max(maxx - minx, maxy - miny), cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
  const uv = new Float32Array(pos.count * 2);
  pts.forEach((p, i) => { uv[2 * i] = (p.x - cx) / size + 0.5; uv[2 * i + 1] = 0.5 - (p.y - cy) / size; });
  mesh.geometry = mesh.geometry.clone(); mesh.geometry.setAttribute('uv1', new THREE.BufferAttribute(uv, 2));
}

const stage = document.querySelector('[data-hat-stage]');
if (stage) start();

function start() {
  const mount = stage.querySelector('[data-hat-canvas]'), msg = stage.querySelector('[data-hat-msg]');
  const fail = () => { stage.classList.remove('is-loading'); stage.classList.add('is-failed'); msg.hidden = false; };
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { fail(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(24, 1, 0.01, 100);

  const now = { ...START }, goal = { ...START };
  let model = null, radius = 1, badges = {}, fronts = [], edges = [], colorTex = null, heightTex = null, dirty = true, frame = 0;

  // ---- The patch from hat.js ----
  function applyPatch(p) {
    if (!model || !p) return;
    Object.entries(badges).forEach(([name, meshes]) => meshes.forEach((m) => { m.visible = name === p.mesh; }));
    const pvc = p.material === 'pvc';
    edges.forEach((m) => {
      m.material.color.set(p.edge).multiplyScalar(PATCH_LEVEL); m.material.toneMapped = false;
      Object.assign(m.material, pvc ? { roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 } : { roughness: 0.9, clearcoat: 0 });
    });
    fronts.forEach((m) => {
      Object.assign(m.material, pvc
        ? { roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.18, sheen: 0, bumpScale: 5 }
        : { roughness: 0.95, clearcoat: 0, sheen: 0.35, sheenRoughness: 0.7, bumpScale: 3 });
    });
    colorTex.needsUpdate = true; heightTex.needsUpdate = true;
    request();
  }

  // ---- The camera orbits the hat; the hat fits the stage's shorter side, like the still picture ----
  function place() {
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    const half = Math.min(THREE.MathUtils.degToRad(12), Math.atan(Math.tan(THREE.MathUtils.degToRad(12)) * cam.aspect));
    const dist = radius / Math.sin(half) * now.zoom, th = THREE.MathUtils.degToRad(now.theta), ph = THREE.MathUtils.degToRad(now.phi);
    cam.position.set(dist * Math.sin(ph) * Math.sin(th), dist * Math.cos(ph), dist * Math.sin(ph) * Math.cos(th));
    cam.lookAt(0, 0, 0);
    cam.near = dist / 50; cam.far = dist * 50; cam.updateProjectionMatrix();
  }
  function draw() { place(); renderer.render(scene, cam); }
  function request() { dirty = true; if (!frame) frame = requestAnimationFrame(tick); }
  function tick() {
    frame = 0;
    let moving = false;
    for (const k of ['theta', 'phi', 'zoom']) {
      const d = goal[k] - now[k];
      if (Math.abs(d) > (k === 'zoom' ? 0.0005 : 0.05)) { now[k] += d * (REDUCED ? 1 : 0.2); moving = true; } else now[k] = goal[k];
    }
    if (dirty || moving) { draw(); dirty = false; }
    if (moving) frame = requestAnimationFrame(tick);
  }
  new ResizeObserver(request).observe(mount);

  // ---- Turning and zooming ----
  const clamp = (v, [a, b]) => Math.min(b, Math.max(a, v));
  function turnTo(theta, phi) {
    const d = ((theta - goal.theta) % 360 + 540) % 360 - 180;   // the shortest way round to the view
    goal.theta += d; goal.phi = phi; goal.zoom = START.zoom; request();
  }
  let drag = null;
  mount.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY }; mount.setPointerCapture(e.pointerId); stage.classList.add('is-dragging');
  });
  mount.addEventListener('pointermove', (e) => {
    if (!drag) return;
    // Sideways turns the hat; dragging up tips it over to show the underside, as in Angle3D.
    goal.theta -= (e.clientX - drag.x) * 0.45; goal.phi = clamp(goal.phi - (e.clientY - drag.y) * 0.35, LIMITS.phi);
    now.theta = goal.theta; now.phi = goal.phi;
    drag = { x: e.clientX, y: e.clientY }; request();
  });
  const endDrag = () => { drag = null; stage.classList.remove('is-dragging'); };
  mount.addEventListener('pointerup', endDrag); mount.addEventListener('pointercancel', endDrag);
  mount.addEventListener('wheel', (e) => {
    e.preventDefault();
    goal.zoom = clamp(goal.zoom * Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), LIMITS.zoom); request();
  }, { passive: false });
  mount.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [15, 0, 1], ArrowRight: [-15, 0, 1], ArrowUp: [0, -10, 1], ArrowDown: [0, 10, 1], '+': [0, 0, 0.9], '=': [0, 0, 0.9], '-': [0, 0, 1.1] }[e.key];
    if (!step) return;
    e.preventDefault();
    goal.theta += step[0]; goal.phi = clamp(goal.phi + step[1], LIMITS.phi); goal.zoom = clamp(goal.zoom * step[2], LIMITS.zoom); request();
  });
  stage.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    const [theta, phi] = VIEWS[b.dataset.view]; turnTo(theta, phi);
  }));

  // ---- The picture for the cart: the three-quarter view, taken the moment the design is added (spec H-6) ----
  function snapshot(size = 480) {
    if (!model) return null;
    const keep = { ...now };
    Object.assign(now, START); draw();
    const src = renderer.domElement, side = Math.min(src.width, src.height), out = document.createElement('canvas');
    out.width = out.height = size;
    out.getContext('2d').drawImage(src, (src.width - side) / 2, (src.height - side) / 2, side, side, 0, 0, size, size);
    Object.assign(now, keep); draw();
    return out.toDataURL('image/webp', 0.9);
  }

  // ---- The lighting and the model ----
  Promise.all([angle3dLighting(renderer, scene), new GLTFLoader().loadAsync(MODEL)]).then(([, gltf]) => {
    const root = gltf.scene, maxAniso = renderer.capabilities.getMaxAnisotropy();
    const H = window.HonorsHat;
    colorTex = new THREE.CanvasTexture(H.latest.color); heightTex = new THREE.CanvasTexture(H.latest.height);
    for (const t of [colorTex, heightTex]) { t.flipY = false; t.channel = 1; t.anisotropy = maxAniso; }
    colorTex.colorSpace = THREE.SRGBColorSpace;
    let base = null; const labels = [];
    root.traverse((o) => {
      if (!o.isMesh) return;
      for (const t of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) if (o.material[t]) o.material[t].anisotropy = maxAniso;
      base = base || o.material.map;
      const m = o.material.clone(); o.material = m;
      const b = o.name.match(/^Badge_(Round|Square|Rectangular)_(Front|Outline)/);
      if (b) {
        (badges[b[1]] = badges[b[1]] || []).push(o);
        if (b[2] === 'Front') {
          planarUV(o); fronts.push(o);
          Object.assign(m, { map: colorTex, bumpMap: heightTex, normalMap: null, toneMapped: false }); m.color.setScalar(PATCH_LEVEL);
        } else edges.push(o);
      } else if (/^Label/.test(o.name)) labels.push(m);
    });
    paintParts(root, { hat: HAT, strap: HAT, rope: ROPE });
    if (base && labels.length) { const t = honorsLabelTexture(base); labels.forEach((m) => { m.map = t; }); }
    const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    root.position.sub(center); scene.add(root);
    model = root; radius = size.length() / 2;

    H.listen = applyPatch; applyPatch(H.latest);
    draw();
    stage.classList.remove('is-loading'); stage.classList.add('is-3d');
    window.HonorsHat3D = { snapshot, view: () => ({ ...now }) };
  }).catch(fail);
}
