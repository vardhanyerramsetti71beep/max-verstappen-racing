/* Max Verstappen Racing — photo garage.
   The RB18 studio shot, brought to life: the car drives in when the section appears, the frame
   tilts with the mouse (drag to look around), a studio light follows the cursor, a reflection
   sweeps across the bodywork and the whole car hums at idle. */
(() => {
  'use strict';
  const MV = window.MV;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const section = $('[data-garage]'), bay = $('[data-bay]');
  const stage = $('[data-grg-stage]'), photo = $('[data-grg-photo]'), light = $('[data-grg-light]');
  const img = $('img', photo);
  const readout = $('[data-readout]');
  const hots = $$('.grg-hs', photo);
  if (!section || !photo) return;

  // Where the car sits in the photo (fractions of the image), and where that point should land in the bay.
  const IMG_RATIO = 2000 / 1333;
  const FOCUS = { x: .52, y: .55 };
  const SPOTS = { frontwing: [.2, .6], brakes: [.485, .56], livery: [.69, .47], cockpit: [.54, .37] };

  // ---------- spec panel
  const car = MV.lineup[0];
  const nameEl = $('[data-name]');
  $('[data-kick]').textContent = car.kicker;
  nameEl.style.setProperty('--wd', car.wd || 72);
  nameEl.setAttribute('aria-label', car.name);
  nameEl.innerHTML = car.name.split(' ').map(w => `<span class="w">${[...w].map(ch => `<span class="ch"><span class="ci">${ch}</span></span>`).join('')}</span>`).join(' ');
  const noteEl = $('[data-note]'); noteEl.hidden = !car.note; noteEl.textContent = car.note || '';
  $('[data-spec]').innerHTML = car.specs.map(([k, v]) => `<div class="row"><dt><span class="mk mono">${k}</span></dt><dd><span class="mv">${v}</span></dd></div>`).join('');
  $('[data-credit]').textContent = car.credit || '';
  hots.forEach(h => {
    const key = h.dataset.hot, t = car.hotspots[key], p = SPOTS[key];
    $('[data-hot-text]', h).textContent = t; h.setAttribute('aria-label', t);
    if (p) { h.style.left = p[0] * 100 + '%'; h.style.top = p[1] * 100 + '%'; }
    h.addEventListener('click', () => { const o = !h.classList.contains('open'); hots.forEach(x => x.classList.remove('open')); h.classList.toggle('open', o); });
  });

  // ---------- sizing: photo covers the bay with room to move
  let W = 0, H = 0, PW = 0, PH = 0, baseX = 0, baseY = 0;
  function size() {
    W = bay.clientWidth; H = bay.clientHeight;
    const narrow = W < 860;
    // whole car in view: the photo's black studio blends into the dark bay, so it doesn't need to cover
    PW = narrow ? W * 1.2 : Math.min(W * .9, H * IMG_RATIO * 1.05);
    PH = PW / IMG_RATIO;
    photo.style.width = PW + 'px'; photo.style.height = PH + 'px';
    const land = narrow ? { x: .5, y: .44 } : { x: .44, y: .54 };
    baseX = land.x * W - FOCUS.x * PW;
    baseY = land.y * H - FOCUS.y * PH;
  }
  addEventListener('resize', size); size();
  if (!img.complete) img.addEventListener('load', size);

  // ---------- input
  const st = { mx: 0, my: 0, sx: 0, sy: 0, drag: false, lastX: 0, dragX: 0, dragV: 0, lx: .5, ly: .45, tlx: .5, tly: .45, hover: false, enter: 0, entered: false, t0: 0 };
  bay.addEventListener('pointermove', e => {
    const r = bay.getBoundingClientRect();
    st.mx = (e.clientX - r.left) / r.width * 2 - 1;
    st.my = (e.clientY - r.top) / r.height * 2 - 1;
    st.tlx = (e.clientX - r.left) / r.width; st.tly = (e.clientY - r.top) / r.height;
    st.hover = true;
    if (st.drag) { const dx = e.clientX - st.lastX; st.lastX = e.clientX; st.dragV = dx * .004; st.dragX = clamp(st.dragX + st.dragV, -1, 1); }
  });
  bay.addEventListener('pointerleave', () => { st.hover = false; st.mx = 0; st.my = 0; });
  bay.addEventListener('pointerdown', e => {
    if (e.target.closest('.grg-hs')) return;
    st.drag = true; st.lastX = e.clientX; st.dragV = 0;
    bay.classList.add('is-drag'); bay.setPointerCapture(e.pointerId);
  });
  const end = () => { st.drag = false; bay.classList.remove('is-drag'); };
  bay.addEventListener('pointerup', end); bay.addEventListener('pointercancel', end);

  // ---------- entrance
  let visible = false;
  new IntersectionObserver(es => es.forEach(e => {
    visible = e.isIntersecting;
    if (visible && !st.entered && e.intersectionRatio > .25) {
      st.entered = true; st.t0 = performance.now();
      section.classList.add('is-photo-in');
      const stripe = $('[data-stripe]');
      if (stripe && !reduce) {
        stripe.style.visibility = 'visible';
        $$('i', stripe).forEach((s, i) => s.animate([{ transform: 'scaleX(0)', transformOrigin: 'left' }, { transform: 'scaleX(1)', transformOrigin: 'left', offset: .5 }, { transform: 'scaleX(0)', transformOrigin: 'right' }], { duration: 1000, delay: i * 70, easing: 'cubic-bezier(.76,0,.24,1)' }).finished.then(() => { if (i === 2) stripe.style.visibility = 'hidden'; }));
      }
      $$('.ci', nameEl).forEach((c, i) => c.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: reduce ? 0 : 800, delay: 500 + i * 35, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }));
      $$('.mv, .mk', $('[data-spec]')).forEach((el, i) => el.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: reduce ? 0 : 700, delay: 700 + i * 45, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }));
      setTimeout(() => section.classList.add('hot-on'), reduce ? 0 : 1500);
    }
  }), { threshold: [0, .25, .5] }).observe(bay);
  // names start hidden until the entrance runs
  $$('.ci', nameEl).forEach(c => { c.style.transform = 'translateY(110%)'; });

  // ---------- frame loop
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = now / 1000;
    const k = reduce ? 1 : .07;
    st.sx = lerp(st.sx, st.mx, k); st.sy = lerp(st.sy, st.my, k);
    if (!st.drag) { st.dragX *= .985; st.dragX += st.dragV; st.dragV *= .9; st.dragX = clamp(st.dragX, -1, 1); }

    // drive-in: slides from the right, de-blurs, settles with a small overshoot
    const e = st.entered ? clamp((now - st.t0) / 1800) : 0;
    const drive = reduce ? 0 : (1 - easeOut(e));
    const blur = reduce ? 0 : drive * 10;

    // scroll through the section adds a slow dolly
    const r = section.getBoundingClientRect();
    const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
    const idle = reduce ? 0 : Math.sin(t * 38) * .35 + Math.sin(t * 23) * .25;   // engine idle hum (px)
    const breathe = reduce ? 0 : Math.sin(t * .5) * .008;

    const yaw = st.sx * 5 + st.dragX * 9;
    const pitch = -st.sy * 3;
    const x = baseX + drive * W * .35 - st.sx * 26 - st.dragX * 70 + (p - .5) * -60;
    const y = baseY + st.sy * -14 + idle;
    const s = 1.02 + breathe + (1 - p) * .05 + drive * .06;
    photo.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotateY(${yaw.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg) scale(${s.toFixed(4)})`;
    photo.style.filter = blur > .1 ? `blur(${blur.toFixed(1)}px) brightness(${(1 - drive * .5).toFixed(2)})` : '';

    // studio light: follows the cursor, or orbits slowly when idle
    if (!st.hover) { st.tlx = .5 + Math.cos(t * .4) * .22; st.tly = .48 + Math.sin(t * .55) * .12; }
    st.lx = lerp(st.lx, st.tlx, .06); st.ly = lerp(st.ly, st.tly, .06);
    light.style.background =
      `radial-gradient(38% 46% at ${(st.lx * 100).toFixed(1)}% ${(st.ly * 100).toFixed(1)}%, rgba(255,240,220,.22), rgba(255,240,220,.06) 45%, transparent 70%)`;

    readout.textContent = String(Math.round(((41 + yaw * 4) % 360 + 360) % 360)).padStart(3, '0');
    hots.forEach(h => {
      const on = section.classList.contains('hot-on') && e >= 1;
      h.style.opacity = on ? '1' : '0';
      h.style.pointerEvents = on ? 'auto' : 'none';
    });
  }
  requestAnimationFrame(frame);
})();
