/* Max Verstappen Racing — 3D hero car (the garage is a photo now: see garage-photo.js).
   Cars are built from primitives in code (no model files needed), painted in the MV livery. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MV = window.MV;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cssVar = n => getComputedStyle(html).getPropertyValue(n).trim();
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* ---------------- materials (shared, recoloured on theme change) ---------------- */
const M = {
  navy: new THREE.MeshPhysicalMaterial({ color: 0x0e1430, metalness: .55, roughness: .3, clearcoat: 1, clearcoatRoughness: .08 }),
  red: new THREE.MeshPhysicalMaterial({ color: 0xe4002b, metalness: .4, roughness: .3, clearcoat: 1, clearcoatRoughness: .1 }),
  orange: new THREE.MeshPhysicalMaterial({ color: 0xff6b00, metalness: .4, roughness: .3, clearcoat: 1 }),
  yellow: new THREE.MeshPhysicalMaterial({ color: 0xffc906, metalness: .35, roughness: .3, clearcoat: 1 }),
  carbon: new THREE.MeshStandardMaterial({ color: 0x121214, metalness: .35, roughness: .45 }),
  tyre: new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0, roughness: .85 }),
  rim: new THREE.MeshStandardMaterial({ color: 0xb8bcc6, metalness: 1, roughness: .28 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x0b0d14, metalness: .9, roughness: .06, clearcoat: 1 }),
  visor: new THREE.MeshPhysicalMaterial({ color: 0x2a5cff, metalness: 1, roughness: .08, iridescence: 1, iridescenceIOR: 1.6 }),
  helmetShell: new THREE.MeshPhysicalMaterial({ color: 0xf4f6fb, metalness: .05, roughness: .25, clearcoat: 1, clearcoatRoughness: .05 }),
  helmetBlue: new THREE.MeshPhysicalMaterial({ color: 0x1f3fa8, metalness: .2, roughness: .3, clearcoat: 1 }),
  helmetBand: new THREE.MeshPhysicalMaterial({ color: 0x14182c, metalness: .3, roughness: .35 }),
  light: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 }),
  tail: new THREE.MeshStandardMaterial({ color: 0xff2030, emissive: 0xff1020, emissiveIntensity: 2 }),
  brake: new THREE.MeshStandardMaterial({ color: 0x552211, emissive: 0xff4a10, emissiveIntensity: .6, metalness: .6, roughness: .4 })
};
function applyTheme() {
  const set = (m, v, fb) => { try { m.color.set(v || fb); } catch (e) { m.color.set(fb); } };
  set(M.red, cssVar('--accent'), '#e4002b');
  set(M.orange, cssVar('--accent-2'), '#ff6b00');
  set(M.yellow, cssVar('--accent-3'), '#ffc906');
}

function numberTexture(n, bg = null) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.beginPath(); x.arc(128, 128, 118, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = '#fff'; x.font = 'italic 900 200px "Archivo", Arial, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(n, 128, 140);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/* ---------------- builders ---------------- */
const box = (w, h, d, mat, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent && parent.add(m); return m; };
function wheel(r, w, x, y, z, parent, stripe = true) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 40), M.tyre); tyre.rotation.x = Math.PI / 2; tyre.castShadow = true; g.add(tyre);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * .66, r * .66, w * 1.02, 32), M.rim); rim.rotation.x = Math.PI / 2; g.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * .18, r * .18, w * 1.08, 16), M.carbon); hub.rotation.x = Math.PI / 2; g.add(hub);
  if (stripe) [1, -1].forEach(s => { const ring = new THREE.Mesh(new THREE.TorusGeometry(r * .8, r * .035, 6, 48), M.yellow); ring.position.z = s * w * .51; g.add(ring); });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r * .5, r * .5, w * .2, 24), M.brake); disc.rotation.x = Math.PI / 2; disc.position.z = -Math.sign(z) * w * .3; g.add(disc);
  parent.add(g); return g;
}
function arm(a, b, parent, r = .018) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), M.carbon);
  m.position.copy(va).add(vb).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  parent.add(m);
}
function helmet(x, y, z, r, parent) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  // matches his white helmet with blue pattern, dark brow band and blue visor
  const shell = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), M.helmetShell); shell.castShadow = true; g.add(shell);
  const band = new THREE.Mesh(new THREE.TorusGeometry(r * .98, r * .1, 8, 40), M.helmetBand); band.rotation.x = Math.PI / 2; band.position.y = r * .15; g.add(band);
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(r * .99, r * .035, 6, 40), M.helmetBlue); stripe.rotation.x = Math.PI / 2; stripe.position.y = r * .5; g.add(stripe);
  const chin = new THREE.Mesh(new THREE.TorusGeometry(r * .97, r * .04, 6, 40), M.helmetBlue); chin.rotation.x = Math.PI / 2; chin.position.y = -r * .35; g.add(chin);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 24, 12, -.9, 1.8, 1.2, .55), M.visor); visor.rotation.y = Math.PI / 2; g.add(visor);
  parent.add(g); return g;
}
function profile(points, depth, mat, bevel = .05) {
  const s = new THREE.Shape(); points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 12 });
  geo.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m;
}

function buildF1() {
  const g = new THREE.Group(), H = {};
  box(3.7, .05, 1.3, M.carbon, -.1, .1, 0, g);                                     // floor
  const tub = profile([[1.0, .2], [1.0, .5], [.55, .58], [-.2, .62], [-.6, .7], [-1.9, .55], [-2.2, .32], [-2.1, .2]], .62, M.navy, .06); g.add(tub);
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(.07, .21, 1.25, 16), M.navy); nose.rotation.z = -Math.PI / 2; nose.scale.set(1, 1, .75); nose.position.set(1.6, .33, 0); nose.castShadow = true; g.add(nose);
  box(.6, .06, .14, M.red, 1.45, .44, 0, g);                                        // nose stripe
  [1, -1].forEach(s => {
    const pod = profile([[.35, .16], [.35, .46], [-.3, .5], [-1.2, .4], [-1.3, .16]], .4, M.navy, .05); pod.position.z = s * .5; g.add(pod);
    box(.04, .26, .38, M.carbon, .4, .31, s * .5, g);                                // inlet
    box(1.2, .035, .01, M.red, -.45, .42, s * .725, g);                             // livery stripes
    box(1.05, .035, .01, M.orange, -.5, .37, s * .725, g);
    box(.9, .035, .01, M.yellow, -.55, .32, s * .725, g);
    const num = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), new THREE.MeshBasicMaterial({ map: numberTexture(MV.number), transparent: true }));
    num.position.set(-1.25, .5, s * .37); num.rotation.y = s > 0 ? 0 : Math.PI; g.add(num);
  });
  box(.95, .3, .03, M.navy, -1.35, .78, 0, g);                                       // fin
  box(.95, .04, .035, M.red, -1.35, .9, 0, g);
  box(.3, .3, .3, M.navy, -.45, .82, 0, g);                                          // airbox
  box(.06, .2, .2, M.carbon, -.28, .86, 0, g);
  box(.62, .04, .44, M.carbon, .25, .62, 0, g);                                       // cockpit opening
  H.cockpit = helmet(.08, .72, 0, .15, g);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.26, .026, 10, 40), M.carbon); halo.rotation.x = Math.PI / 2; halo.scale.set(1.25, 1, 1); halo.position.set(.12, .86, 0); g.add(halo);
  arm([.45, .62, 0], [.45, .86, 0], g, .025);
  // front wing
  box(.38, .035, 1.9, M.red, 2.18, .12, 0, g);
  box(.26, .03, 1.75, M.navy, 2.06, .2, 0, g);
  box(.2, .03, 1.6, M.yellow, 1.98, .26, 0, g);
  [1, -1].forEach(s => box(.45, .24, .025, M.navy, 2.1, .2, s * .96, g));
  // rear wing
  box(.42, .045, 1.15, M.navy, -2.12, 1.0, 0, g);
  box(.3, .035, 1.15, M.red, -2.2, 1.1, 0, g);
  [1, -1].forEach(s => { box(.6, .55, .03, M.navy, -2.12, .82, s * .58, g); box(.6, .06, .035, M.yellow, -2.12, 1.06, s * .58, g); });
  box(.1, .45, .06, M.carbon, -2.02, .62, 0, g);
  box(.5, .2, 1.05, M.carbon, -2.15, .2, 0, g);                                      // diffuser
  // wheels + suspension
  const fw = [], rw = [];
  [1, -1].forEach(s => {
    fw.push(wheel(.34, .36, 1.42, .34, s * .82, g));
    rw.push(wheel(.37, .44, -1.55, .37, s * .8, g));
    arm([1.0, .45, s * .3], [1.42, .4, s * .66], g); arm([1.0, .25, s * .3], [1.42, .28, s * .66], g);
    arm([-1.2, .45, s * .45], [-1.55, .42, s * .62], g); arm([-1.2, .25, s * .45], [-1.55, .3, s * .62], g);
  });
  H.frontwing = new THREE.Vector3(2.3, .2, .7);
  H.brakes = new THREE.Vector3(1.42, .34, 1.0);
  H.livery = new THREE.Vector3(-.5, .45, .74);
  H.cockpitPt = new THREE.Vector3(.08, .9, 0);
  H.tyre = new THREE.Vector3(1.42, .34, 1.0);
  return { group: g, hot: { frontwing: H.frontwing, brakes: H.brakes, livery: H.livery, cockpit: H.cockpitPt }, callout: { tyre: H.tyre, fwing: H.frontwing } };
}

const BUILD = { f1: buildF1 };

/* Normalise a car: length → target, wheels on y = 0, centred. */
function fit(car, len = 4.4) {
  const b = new THREE.Box3().setFromObject(car.group), size = b.getSize(new THREE.Vector3());
  const s = len / size.x;
  const holder = new THREE.Group();
  car.group.scale.setScalar(s);
  car.group.position.set(-(b.min.x + size.x / 2) * s, -b.min.y * s, -(b.min.z + size.z / 2) * s);
  holder.add(car.group);
  car.holder = holder; car.scale = s;
  return car;
}

function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  return r;
}

/* =========================================================
   HERO CAR — peeks in from the right edge of the hero
   ========================================================= */
const heroWrap = $('[data-hero-carview]'), hero = $('[data-hero]');
if (heroWrap) {
  const c2 = document.createElement('canvas'); heroWrap.appendChild(c2);
  let r2;
  try { r2 = makeRenderer(c2); } catch (e) { r2 = null; }
  if (r2) {
    hero.classList.add('has-car');
    const scene = new THREE.Scene();
    scene.environment = new THREE.PMREMGenerator(r2).fromScene(new RoomEnvironment(), .04).texture;
    const cam = new THREE.PerspectiveCamera(28, 1.6, .1, 100);
    cam.position.set(5.2, 1.5, 6.2); cam.lookAt(.3, .45, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9aa8, 1.1));
    const k = new THREE.DirectionalLight(0xffffff, 2); k.position.set(3, 6, 5); k.castShadow = true; scene.add(k);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: .18 }));
    shadow.rotation.x = -Math.PI / 2; shadow.receiveShadow = true; scene.add(shadow);
    const hc = {};
    MV.lineup.forEach(c => { hc[c.id] = fit(BUILD[c.id](), 4.4); hc[c.id].holder.visible = false; scene.add(hc[c.id].holder); });
    const cur = hc[MV.lineup[0].id]; cur.holder.visible = true;
    const callouts = { tyre: $('[data-callout="tyre"]'), fwing: $('[data-callout="fwing"]') };
    const size = () => { const w = heroWrap.clientWidth, h = heroWrap.clientHeight; if (!w || !h) return; r2.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    addEventListener('resize', size); size();
    let inView = true;
    new IntersectionObserver(es => es.forEach(e => { inView = e.isIntersecting; })).observe(hero);
    const v = new THREE.Vector3();
    const tick = now => {
      if (inView && heroWrap.offsetParent) {
        const t = now / 1000;
        cur.holder.rotation.y = -.55 + Math.sin(t * .35) * .12;
        cur.holder.position.y = Math.sin(t * 2.1) * .006;
        r2.render(scene, cam);
        const hr = hero.getBoundingClientRect(), wr = heroWrap.getBoundingClientRect();
        cur.holder.updateMatrixWorld();
        Object.entries(callouts).forEach(([key, el]) => {
          const p = cur.callout[key]; if (!p || !el) return;
          v.copy(p).applyMatrix4(cur.group.matrixWorld).project(cam);
          const x = wr.left - hr.left + (v.x * .5 + .5) * wr.width, y = wr.top - hr.top + (-v.y * .5 + .5) * wr.height;
          el.style.transform = `translate(${x}px, ${y}px)`;
          el.classList.toggle('hero__callout--left', x > hr.width * .9);
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
