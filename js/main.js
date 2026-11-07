/* Max Verstappen Racing — page behaviour.
   Drives the reference site's markup/CSS: loader, header, theme/car/sound toggles, hero,
   marquees, manifesto, career timeline, on/off split, reveals and the scroll-driven racing line.
   The 3D garage lives in garage.js. */
(() => {
  'use strict';
  const MV = window.MV;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const cssVar = n => getComputedStyle(html).getPropertyValue(n).trim();
  let vw = html.clientWidth, vh = innerHeight;
  const docTop = el => el.getBoundingClientRect().top + scrollY;
  const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0');
  const fmtLap = ms => `${pad(ms / 60000)}:${pad((ms / 1000) % 60)}.${pad(ms % 1000, 3)}`;

  /* ---------- image placeholders ---------- */
  function wireImg(img) {
    const ph = img.dataset.ph;
    if (!ph) return;
    const fail = () => {
      if (img.hasAttribute('data-ph-active')) return;
      img.setAttribute('data-ph-active', '');
      img.src = ph;
    };
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
  }

  /* ---------- text scramble ---------- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/—';
  function scramble(el, to = el.textContent, dur = 700) {
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = now => {
      const p = clamp((now - t0) / dur);
      const n = Math.floor(p * to.length);
      let s = to.slice(0, n);
      for (let i = n; i < to.length; i++) s += to[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = s;
      if (p < 1) requestAnimationFrame(step); else el.textContent = to;
    };
    requestAnimationFrame(step);
  }

  /* ---------- run once when an element enters the viewport ---------- */
  function onEnter(el, fn, margin = '-12% 0px') {
    if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { io.disconnect(); fn(); }
    }), { rootMargin: margin });
    io.observe(el);
  }

  /* =========================================================
     BUILD DYNAMIC MARKUP
     ========================================================= */
  // Menu tiles
  const tiles = $('[data-menu-tiles]');
  for (let i = 0; i < 96; i++) tiles.appendChild(Object.assign(document.createElement('span'), { className: 'mnu__tile' }));

  // Manifesto words ("|word|" = accent)
  $$('.mfo__line[data-words]').forEach(line => {
    line.dataset.words.split(' ').forEach((w, i, arr) => {
      const accent = /^\|.*\|$/.test(w);
      const span = document.createElement('span');
      span.className = 'mfo__word' + (accent ? ' mfo__word--accent' : '');
      span.textContent = accent ? w.slice(1, -1) : w;
      line.appendChild(span);
      if (i < arr.length - 1) line.appendChild(document.createTextNode(' '));
    });
  });

  // Journey cards (desktop track + mobile list)
  const jTrack = $('[data-jny-track]'), jList = $('[data-jny-m-list]');
  MV.journey.forEach(j => {
    const cap = `<span class="jny__cap-line"><span class="jny__tick" style="background:${j.tick}" aria-hidden="true"></span><span>${j.year}</span> — ${j.title}</span>${j.note ? `<span class="jny__cap-note">${j.note}</span>` : ''}`;
    jTrack.insertAdjacentHTML('beforeend',
      `<figure class="jny__card" data-jny-card data-year="${j.year}" style="--h:${j.h}vh; --top:${j.top}%"><div class="jny__frame"><img src="${j.img}" data-ph="${j.ph}" alt="${j.year} — ${j.title}" width="1500" height="1000" decoding="async"></div><figcaption class="mono jny__cap">${cap}</figcaption></figure>`);
    jList.insertAdjacentHTML('beforeend',
      `<li class="jny__m-card" data-jny-m-card data-year="${j.year}"><div class="jny__m-frame"><img src="${j.img}" data-ph="${j.ph}" alt="" width="1500" height="1000" loading="lazy" decoding="async"></div><p class="mono jny__cap">${cap}</p></li>`);
  });

  // Career numbers + timing sheet
  const stsGrid = $('[data-sts-grid]'), stsSheet = $('[data-sts-sheet]');
  const barCols = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)'];
  MV.stats.forEach((s, i) => {
    const years = s.feature && s.note ? `<span class="sts__years mono">${s.note.split(' · ').map(y => `<span>${y}</span>`).join('')}</span>` : '';
    const note = !s.feature && s.note ? `<span class="sts__n mono">${s.note}</span>` : '';
    stsGrid.insertAdjacentHTML('beforeend',
      `<div class="sts__tile${s.feature ? ' sts__tile--feature' : ''}"><span class="sts__bar" style="background:${barCols[i % 3]};transition-delay:${i * 90}ms"></span><span class="sts__k mono">${s.k}</span><span class="sts__v" data-count="${s.v}" data-dp="${s.dp || 0}">${s.v.toLocaleString('en-GB', { minimumFractionDigits: s.dp || 0, maximumFractionDigits: s.dp || 0 })}</span>${note}${years}</div>`);
  });
  MV.sheet.forEach(([k, v], i) => {
    stsSheet.insertAdjacentHTML('beforeend', `<div class="sts__row"><span class="sts__pos mono">${String(i + 1).padStart(2, '0')}</span><dt class="mono">${k}</dt><dd>${v}</dd></div>`);
  });

  // Social fan cards
  const fan = $('[data-soc-fan]');
  const fanZ = [3, 4, 5, 4, 3];
  MV.socials.forEach((s, i) => {
    fan.insertAdjacentHTML('beforeend',
      `<a class="soc__card" data-soc-card href="${s.handle.startsWith('@Max33') ? 'https://x.com/Max33Verstappen' : 'https://instagram.com/maxverstappen1'}" target="_blank" rel="noopener" style="z-index:${fanZ[i]}"><div class="soc__bar"><span class="soc__avatar"><img src="images/ph/mv-monogram.svg" alt="" width="64" height="64"></span><span class="mono soc__handle">${s.handle}</span></div><div class="soc__media"><img src="${s.img}" data-ph="${s.ph}" alt="" width="800" height="1400" loading="lazy" decoding="async"></div></a>`);
  });

  $$('img[data-ph]').forEach(wireImg);

  /* =========================================================
     SMOOTH SCROLL
     ========================================================= */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: .1, smoothWheel: true });
    html.classList.add('lenis', 'lenis-smooth');
  }
  const scrollToEl = el => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    if (html.classList.contains('is-open')) setMenu(false);
    scrollToEl(target);
  }));

  /* =========================================================
     THEME TOGGLE
     ========================================================= */
  const THEMES = { livery: 'MV Livery', night: 'Night Race', orange: 'Orange Army', mono: 'Monochrome' };
  function placeThemeIndicators(t) {
    $$('[data-theme-toggle]').forEach(tg => {
      const dot = $(`.ttg__dot[data-theme-dot="${t}"]`, tg);
      const ind = $('[data-theme-indicator]', tg);
      if (dot && ind) ind.style.transform = `translateX(${dot.offsetLeft - 5}px)`;
      const lab = $('[data-theme-label]', tg);
      if (lab) lab.textContent = THEMES[t];
      const sw = $('[data-theme-mobile-swatch]', tg);
      if (sw) sw.className = 'ttg__swatch ttg__swatch--' + t;
    });
  }
  function setTheme(t) {
    if (!THEMES[t]) t = 'livery';
    html.dataset.theme = t;
    try { localStorage.setItem('mv-theme', t); } catch (e) { /* storage blocked */ }
    placeThemeIndicators(t);
    window.dispatchEvent(new CustomEvent('mv:theme', { detail: t }));
  }
  $$('[data-theme-dot]').forEach(b => b.addEventListener('click', () => {
    setTheme(b.dataset.themeDot);
    $$('[data-theme-popover]').forEach(p => p.classList.remove('is-open'));
  }));
  $$('[data-theme-mobile]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const pop = b.parentElement.querySelector('[data-theme-popover]');
    const open = !pop.classList.contains('is-open');
    pop.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', open);
  }));
  document.addEventListener('click', () => $$('[data-theme-popover].is-open').forEach(p => p.classList.remove('is-open')));
  placeThemeIndicators(html.dataset.theme || 'livery');

  /* The garage shows a single car (the F1); the number badge jumps to it. */
  window.MVgetCar = () => MV.lineup[0].id;
  $('[data-badge]').addEventListener('click', () => scrollToEl($('#garage')));

  /* =========================================================
     SOUND — a synthesised engine note that follows scroll speed
     ========================================================= */
  const sound = { on: false, ctx: null, gain: null, osc: [], filter: null, rpm: 0 };
  function soundInit() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    const gain = ctx.createGain(); gain.gain.value = 0;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = 6;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.detune.value = -1200;
    const g2 = ctx.createGain(); g2.gain.value = .35;
    o1.connect(filter); o2.connect(g2).connect(filter);
    filter.connect(gain).connect(ctx.destination);
    o1.start(); o2.start();
    Object.assign(sound, { ctx, gain, filter, osc: [o1, o2] });
    return true;
  }
  function setSound(on) {
    if (on && !sound.ctx && !soundInit()) return;
    sound.on = on;
    if (sound.ctx) {
      if (on) sound.ctx.resume();
      sound.gain.gain.setTargetAtTime(on ? .045 : 0, sound.ctx.currentTime, .15);
    }
    $$('[data-sound-toggle]').forEach(b => {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', on ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on');
    });
    $$('[data-sound-label]').forEach(l => (l.textContent = on ? 'Sound on' : 'Sound off'));
  }
  $$('[data-sound-toggle]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setSound(!sound.on); }));
  function soundTick(speed) {
    if (!sound.ctx || !sound.on) return;
    sound.rpm = lerp(sound.rpm, clamp(Math.abs(speed) / 45), .08);
    const f = 48 + sound.rpm * 190, t = sound.ctx.currentTime;
    sound.osc[0].frequency.setTargetAtTime(f, t, .05);
    sound.osc[1].frequency.setTargetAtTime(f, t, .05);
    sound.filter.frequency.setTargetAtTime(500 + sound.rpm * 2600, t, .05);
  }

  /* =========================================================
     HEADER + MENU
     ========================================================= */
  const hdr = $('[data-header]'), menu = $('[data-menu]');
  let lastHdrY = 0;
  function headerTick(y) {
    hdr.classList.toggle('is-stuck', y > 10);
    if (y > lastHdrY + 4 && y > vh * .9) hdr.classList.add('is-hidden');
    else if (y < lastHdrY - 4) hdr.classList.remove('is-hidden');
    lastHdrY = y;
  }
  function setMenu(open) {
    html.classList.toggle('is-open', open);
    $$('.hdr__burger').forEach(b => { b.classList.toggle('is-active', open); b.setAttribute('aria-expanded', open); });
    const tileEls = $$('.mnu__tile', menu), words = $$('.mnu__word', menu);
    if (open) {
      menu.classList.add('is-open'); menu.removeAttribute('inert'); menu.setAttribute('aria-hidden', 'false');
      lenis && lenis.stop();
      tileEls.forEach((t, i) => t.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
        { duration: reduce ? 0 : 450, delay: reduce ? 0 : (i % 12) * 18 + Math.floor(i / 12) * 10, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' }));
      words.forEach((w, i) => w.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }],
        { duration: reduce ? 0 : 700, delay: reduce ? 0 : 300 + i * 60, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }));
    } else {
      const anims = tileEls.map((t, i) => t.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }],
        { duration: reduce ? 0 : 380, delay: reduce ? 0 : (11 - (i % 12)) * 14, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' }));
      words.forEach(w => w.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }));
      Promise.all(anims.map(a => a.finished)).then(() => {
        if (html.classList.contains('is-open')) return;
        menu.classList.remove('is-open'); menu.setAttribute('inert', ''); menu.setAttribute('aria-hidden', 'true');
        words.forEach(w => w.getAnimations().forEach(a => a.cancel()));
      });
      lenis && lenis.start();
    }
  }
  $$('[data-menu-toggle]').forEach(b => b.addEventListener('click', () => setMenu(!html.classList.contains('is-open'))));
  addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('is-open')) setMenu(false); });

  /* =========================================================
     TOP-VIEW CAR SPRITE (loader + racing line)
     Car points along +x. Unit length ≈ 64.
     ========================================================= */
  function drawCar(ctx, x, y, ang, s, c, opts = {}) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    const tyre = '#141414';
    ctx.fillStyle = tyre;
    if (!opts.noTyres) {
      ctx.fillRect(-27, -17, 13, 7); ctx.fillRect(-27, 10, 13, 7);   // rear tyres
      ctx.fillRect(12, -16, 11, 6); ctx.fillRect(12, 10, 11, 6);     // front tyres
    }
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = c.body;                                         // rear wing
    ctx.fillRect(-33, -12, 6, 24);
    ctx.fillStyle = c.a1; ctx.fillRect(-33, -12, 6, 3); ctx.fillRect(-33, 9, 6, 3);
    ctx.fillStyle = c.body;                                         // floor + sidepods
    ctx.beginPath();
    ctx.moveTo(-25, -6); ctx.lineTo(-14, -11); ctx.lineTo(4, -11); ctx.lineTo(10, -5);
    ctx.lineTo(10, 5); ctx.lineTo(4, 11); ctx.lineTo(-14, 11); ctx.lineTo(-25, 6); ctx.closePath(); ctx.fill();
    ctx.beginPath();                                                // nose
    ctx.moveTo(8, -4); ctx.lineTo(30, -1.6); ctx.lineTo(30, 1.6); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.a1;                                           // front wing
    ctx.fillRect(28, -15, 4, 30);
    ctx.fillStyle = c.a3; ctx.fillRect(28, -15, 4, 4); ctx.fillRect(28, 11, 4, 4);
    ctx.fillStyle = c.a1;                                           // livery stripe
    ctx.fillRect(-22, -1.2, 40, 2.4);
    ctx.fillStyle = c.a2; ctx.fillRect(-14, -8, 12, 2); ctx.fillRect(-14, 6, 12, 2);
    ctx.fillStyle = '#0a0a0a';                                      // cockpit
    ctx.beginPath(); ctx.ellipse(-3, 0, 6.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4f6ff';                                      // helmet: white shell, blue visor
    ctx.beginPath(); ctx.arc(-4, 0, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1f55e0';
    ctx.beginPath(); ctx.arc(-4, 0, 2.8, -.9, .9); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; // halo
    ctx.beginPath(); ctx.ellipse(-2, 0, 7.5, 5, 0, -1.2, 1.2); ctx.stroke();
    ctx.restore();
  }
  /* Pit stop, seen from above, in the car's own coordinates (car points along +x).
     t = seconds into the current stop; loops so the crew keep changing tyres. */
  const PIT_WHEELS = [
    { x: 17.5, y: -13, w: 11, h: 6 }, { x: 17.5, y: 13, w: 11, h: 6 },
    { x: -20.5, y: -13.5, w: 13, h: 7 }, { x: -20.5, y: 13.5, w: 13, h: 7 }
  ];
  function drawCrewMember(ctx, x, y, face, c, reach = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(face);
    ctx.strokeStyle = '#c9d2f0'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';   // arms reaching forward
    ctx.beginPath(); ctx.moveTo(.5, -2.4); ctx.lineTo(2.4 + reach, -1.4); ctx.moveTo(.5, 2.4); ctx.lineTo(2.4 + reach, 1.4); ctx.stroke();
    ctx.fillStyle = '#4c63b8';                                                  // overalls (shoulders)
    ctx.beginPath(); ctx.ellipse(0, 0, 2.1, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = .4; ctx.stroke();
    ctx.fillStyle = c.a2; ctx.fillRect(-.6, -3.3, 1.2, 6.6);                     // orange stripe across the shoulders
    ctx.fillStyle = '#f4f6ff';                                                   // helmet
    ctx.beginPath(); ctx.arc(.3, 0, 1.75, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1f55e0'; ctx.fillRect(.9, -.9, .8, 1.8);                   // visor
    ctx.restore();
  }
  function drawTyre(ctx, x, y, w, h, fresh, c) {
    ctx.fillStyle = '#141414'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = .5; ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = fresh ? c.a1 : '#8a8a8a'; ctx.fillRect(x - w / 2, y - .5, w, 1);   // compound stripe
  }
  function drawPitStop(ctx, x, y, ang, s, c, t, stopTime, alpha) {
    const ease = v => 1 - Math.pow(1 - clamp(v), 3);
    const enter = ease(t / .45);
    const jack = clamp((t - .45) / .2) - clamp((t - 2.05) / .2);
    const off = ease((t - .8) / .32), on = ease((t - 1.15) / .32);
    const back = ease((t - 2.2) / .5);
    const gun = (t > .6 && t < .9) || (t > 1.5 && t < 1.85);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    // shadow grows a little while the car is up on the jacks
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(-2, 2 + jack * 1.5, 36 + jack * 3, 17 + jack * 2, 0, 0, Math.PI * 2); ctx.fill();
    // jacks
    ctx.strokeStyle = '#9aa0aa'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(44 + 10 * (1 - enter), 0); ctx.lineTo(31, 0); ctx.moveTo(-48 - 10 * (1 - enter), 0); ctx.lineTo(-33, 0); ctx.stroke();
    // tyres: old ones come off and are carried away, new ones go on
    PIT_WHEELS.forEach(wh => {
      const sy = Math.sign(wh.y);
      const oldX = wh.x + 9 * off, oldY = wh.y + sy * 17 * off + sy * 14 * back;
      ctx.globalAlpha = alpha * (1 - back * .9);
      if (off < 1 || back < 1) drawTyre(ctx, oldX, oldY, wh.w, wh.h, false, c);
      ctx.globalAlpha = alpha;
      const newX = wh.x - 9 * (1 - on), newY = wh.y + sy * 17 * (1 - on);
      drawTyre(ctx, newX, newY, wh.w, wh.h, true, c);
    });
    ctx.restore();
    // the car itself, lifted slightly on the jacks
    ctx.save(); ctx.globalAlpha = alpha;
    drawCar(ctx, x, y, ang, s * (1 + .035 * jack), c, { noTyres: true });
    ctx.restore();
    // crew
    ctx.save(); ctx.globalAlpha = alpha * enter;
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    const spread = 1 + (1 - enter) * 1.4 + back * .5;
    PIT_WHEELS.forEach((wh, i) => {
      const sy = Math.sign(wh.y);
      // wheel gun
      const gx = wh.x, gy = wh.y + sy * 10 * spread;
      drawCrewMember(ctx, gx, gy, -sy * Math.PI / 2, c, gun ? 1.5 : .6);
      if (gun) {
        ctx.strokeStyle = c.a3; ctx.lineWidth = .7;
        for (let k = 0; k < 3; k++) {
          const a = Math.random() * Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(wh.x, wh.y + sy * 4); ctx.lineTo(wh.x + Math.cos(a) * 3.5, wh.y + sy * 4 + Math.sin(a) * 3.5); ctx.stroke();
        }
      }
      // tyre off / tyre on carriers stand with their tyres
      drawCrewMember(ctx, wh.x + 9 * off + 6, (wh.y + sy * (17 * off + 6)) * (off ? 1 : spread) + sy * 14 * back, -sy * Math.PI / 2, c, .3);
      drawCrewMember(ctx, wh.x - 9 * (1 - on) - 6, (wh.y + sy * (17 * (1 - on) + 6)) * spread, -sy * Math.PI / 2 + (i < 2 ? .4 : -.4) * sy, c, .3);
    });
    drawCrewMember(ctx, 46 * spread, 0, Math.PI, c, .5);          // front jack
    drawCrewMember(ctx, -50 * spread, 0, 0, c, .5);               // rear jack
    drawCrewMember(ctx, 30 * spread, -30 * spread, Math.PI * .75, c, .8);   // release / lollipop
    ctx.fillStyle = t > 2.05 ? '#19c45a' : c.a1;                   // lollipop light: red → green
    ctx.beginPath(); ctx.arc(26 * spread, -26 * spread, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // timer, upright on screen
    const shown = Math.min(Math.max(0, t - .45), stopTime);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = `600 10px ${cssVar('--f-mono')}`; ctx.fillStyle = 'rgba(244,244,242,.6)';
    ctx.fillText('PIT STOP', x, y - 66 * s);
    ctx.font = `700 15px ${cssVar('--f-mono')}`; ctx.fillStyle = t > 2.05 ? '#19c45a' : '#f4f4f2';
    ctx.fillText(shown.toFixed(2) + 's', x, y - 66 * s + 17);
    ctx.restore();
  }
  const carColors = () => ({ body: '#0e1430', a1: cssVar('--accent') || '#e4002b', a2: cssVar('--accent-2') || '#ff6b00', a3: cssVar('--accent-3') || '#ffc906' });

  /* =========================================================
     LOADER
     ========================================================= */
  const ldr = $('[data-loader]');
  const ldrCanvas = $('[data-ldr-canvas]');
  let loaderDone = false;
  const afterLoader = [];
  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    ldr.classList.add('is-wiping', 'is-done');
    setTimeout(() => { ldr.style.display = 'none'; }, 700);
    lenis && lenis.start();
    html.style.overflow = '';
    afterLoader.forEach(fn => fn());
  }

  function runLoader() {
    if (reduce) { ldr.style.display = 'none'; loaderDone = true; afterLoader.forEach(fn => fn()); return; }
    lenis && lenis.stop();
    html.style.overflow = 'hidden';
    const ctx = ldrCanvas.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    let W, H;
    const size = () => {
      W = innerWidth; H = innerHeight;
      ldrCanvas.width = W * dpr; ldrCanvas.height = H * dpr;
    };
    size(); addEventListener('resize', size);

    // asphalt noise pattern
    const nz = document.createElement('canvas'); nz.width = nz.height = 96;
    const nctx = nz.getContext('2d'), id = nctx.createImageData(96, 96);
    for (let i = 0; i < id.data.length; i += 4) { const v = 18 + Math.random() * 34; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    nctx.putImageData(id, 0, 0);
    const asphalt = ctx.createPattern(nz, 'repeat');

    // Letter tracks in a 1000×600 design box
    const M = [[110, 520], [110, 90], [300, 360], [490, 90], [490, 520]];
    const V = [[590, 90], [750, 520], [910, 90]];
    const route = new Path2D('M 40 400 C 210 330, 330 420, 500 360 S 760 250, 960 270');
    const routeEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    routeEl.setAttribute('d', 'M 40 400 C 210 330, 330 420, 500 360 S 760 250, 960 270');
    const routeLen = routeEl.getTotalLength();
    const T = { pre: 900, track: 900, run: 2600, hold: 450 };
    const total = T.pre + T.track + T.run + T.hold;
    const sectors = [null, null, null];
    const lapTarget = 72845; // displayed lap time at the flag (ms)
    const t0 = performance.now();
    ldr.classList.add('is-painted');
    ldr.addEventListener('click', () => finishLoader());

    const poly = (pts, d) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (d) ctx.setLineDash(d); };

    function frame(now) {
      if (loaderDone) return;
      const t = now - t0;
      const ink = cssVar('--ink'), ground = cssVar('--ground'), muted = cssVar('--muted');
      const col = carColors();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // background + vignette
      ctx.fillStyle = ground; ctx.fillRect(0, 0, W, H);
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.09)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      const pPre = clamp(t / T.pre);
      const pTrack = clamp((t - T.pre) / T.track);
      const pRun = clamp((t - T.pre - T.track * .6) / T.run);

      // ---- pre: streak flying in towards the grid dot
      if (pTrack < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - easeOut(pTrack);
        const cx = W / 2, cy = H * .53, head = lerp(-W * .2, cx, easeOut(pPre));
        const grad = ctx.createLinearGradient(0, 0, head, 0);
        grad.addColorStop(0, ink); grad.addColorStop(1, ink);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.moveTo(0, cy - 22); ctx.lineTo(head - 80, cy - 4); ctx.lineTo(head, cy); ctx.lineTo(head - 80, cy + 4); ctx.lineTo(0, cy + 26); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = col.a1; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(head - 80, cy); ctx.lineTo(head, cy); ctx.stroke();
        ctx.strokeStyle = muted; ctx.setLineDash([2, 6]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(head + 14, cy); ctx.lineTo(W, cy + 18); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(head, cy - 26, W - head, 52);
        const glow = ctx.createRadialGradient(head, cy, 0, head, cy, 28);
        glow.addColorStop(0, col.a1); glow.addColorStop(.35, col.a1 + 'aa'); glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(head, cy, 28, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // ---- MV letters as track
      if (pTrack > 0) {
        const s = Math.min(W * .62 / 1000, H * .5 / 600);
        ctx.save();
        ctx.translate(W / 2 - 500 * s, H * .5 - 300 * s); ctx.scale(s, s);
        ctx.globalAlpha = easeOut(pTrack);
        const reveal = easeIO(pTrack);
        const drawLetter = pts => {
          const segLen = pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
          ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
          // kerbs (white base + red dashes), then asphalt on top
          poly(pts, [segLen * reveal, segLen]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 92; ctx.stroke();
          ctx.save(); ctx.setLineDash([]);
          const k = 8 / s;
          poly(pts, null); ctx.setLineDash([k, k]); ctx.lineDashOffset = 0;
          ctx.globalCompositeOperation = 'source-atop'; ctx.strokeStyle = col.a1; ctx.lineWidth = 92; ctx.stroke();
          ctx.restore();
          poly(pts, [segLen * reveal, segLen]); ctx.strokeStyle = asphalt; ctx.lineWidth = 74; ctx.stroke();
          ctx.setLineDash([]);
        };
        drawLetter(M); drawLetter(V);

        // racing line trail across the letters
        if (pRun > 0) {
          const drawn = routeLen * easeIO(pRun);
          const band = (w, c) => { ctx.setLineDash([drawn, routeLen]); ctx.lineCap = 'butt'; ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(route); };
          band(40, col.a1); band(20, col.a2); band(7, col.a3); ctx.setLineDash([]);
          const p = routeEl.getPointAtLength(drawn), q = routeEl.getPointAtLength(Math.min(routeLen, drawn + 1));
          const ang = Math.atan2(q.y - p.y, q.x - p.x) || 0;
          drawCar(ctx, p.x, p.y, ang, 1.15, col);
          // sector splits
          for (let i = 0; i < 3; i++) if (!sectors[i] && pRun >= (i + 1) / 3 - .001) sectors[i] = lapTarget * (i + 1) / 3 * (0.97 + Math.random() * .05);
        }
        ctx.restore();
      }

      // ---- HUD text
      const g = Math.max(16, Math.min(32, W * .022));
      ctx.fillStyle = ink; ctx.font = `600 11px ${cssVar('--f-mono')}`; ctx.textBaseline = 'top';
      ctx.fillText('MAX VERSTAPPEN RACING', g, g);
      const sCols = ['#19c45a', '#9b2cff', col.a3];
      for (let i = 0; i < 3; i++) {
        const y = g + 20 + i * 15;
        ctx.fillStyle = sectors[i] ? sCols[i] : 'rgba(128,128,128,.35)'; ctx.fillRect(g, y + 1, 7, 7);
        ctx.fillStyle = ink; ctx.font = `600 10px ${cssVar('--f-mono')}`; ctx.fillText('S' + (i + 1), g + 14, y);
        ctx.fillStyle = muted; ctx.fillText(sectors[i] ? fmtLap(sectors[i]) : '--:--.---', g + 36, y);
      }
      const lapMs = lapTarget * clamp(pRun);
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = muted; ctx.font = `500 10px ${cssVar('--f-mono')}`;
      ctx.fillText(`LOAD ${pad(Math.round(clamp(t / (total - T.hold)) * 100), 3)}%`, g, H - g);
      ctx.textAlign = 'right'; ctx.fillText(`#${MV.number} / SINGLE-SEATER`, W - g, H - g);
      ctx.textAlign = 'center'; ctx.fillText('LAP 1', W / 2 - 70, H - g);
      ctx.fillStyle = ink; ctx.font = `600 16px ${cssVar('--f-mono')}`; ctx.fillText(fmtLap(lapMs), W / 2 + 20, H - g + 1);
      ctx.textAlign = 'left';

      // ---- wipe out
      if (t > total) {
        const w = clamp((t - total) / 500);
        ctx.fillStyle = ground; ctx.fillRect(0, H * (1 - easeIO(w)), W, H);
        if (w >= 1) { finishLoader(); return; }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* =========================================================
     HERO
     ========================================================= */
  const hero = $('[data-hero]');
  // contour field
  const field = $('[data-hero-field]');
  function drawField() {
    const ctx = field.getContext('2d');
    const r = hero.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = r.width, H = r.height;
    field.width = W * dpr; field.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // value noise
    const seed = 7, hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453; return s - Math.floor(s); };
    const sm = t => t * t * (3 - 2 * t);
    const noise = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return lerp(lerp(a, b, sm(xf)), lerp(c, d, sm(xf)), sm(yf));
    };
    const f = (x, y) => {
      const nx = x / W, ny = y / H;
      let v = noise(nx * 3.2, ny * 2.4) * .6 + noise(nx * 7, ny * 6) * .25;
      v += Math.exp(-((nx - .72) ** 2 + (ny - .3) ** 2) * 9) * .55;
      v += Math.exp(-((nx - .22) ** 2 + (ny - .62) ** 2) * 7) * .45;
      return v;
    };
    const cell = 9, cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
    const grid = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) grid[j * cols + i] = f(i * cell, j * cell);
    const ink = cssVar('--ink'), acc = cssVar('--accent');
    const levels = 18;
    for (let L = 1; L < levels; L++) {
      const iso = .15 + L * .07;
      ctx.beginPath();
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
        const a = grid[j * cols + i], b = grid[j * cols + i + 1], c = grid[(j + 1) * cols + i + 1], d = grid[(j + 1) * cols + i];
        const idx = (a > iso) | ((b > iso) << 1) | ((c > iso) << 2) | ((d > iso) << 3);
        if (idx === 0 || idx === 15) continue;
        const x = i * cell, y = j * cell;
        const e = [
          [x + cell * (iso - a) / (b - a), y],
          [x + cell, y + cell * (iso - b) / (c - b)],
          [x + cell * (iso - d) / (c - d), y + cell],
          [x, y + cell * (iso - a) / (d - a)]
        ];
        const segs = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]], 9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[1, 2]], 12: [[1, 3]], 13: [[0, 1]], 14: [[0, 3]] }[idx];
        segs.forEach(([p, q]) => { ctx.moveTo(e[p][0], e[p][1]); ctx.lineTo(e[q][0], e[q][1]); });
      }
      const hot = L === 9 || L === 13;
      ctx.strokeStyle = hot ? acc : ink;
      ctx.globalAlpha = hot ? .55 : .13;
      ctx.lineWidth = hot ? 1.3 : 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // hero line + sector ticks
  const heroLine = $('[data-hero-line]'), heroGhost = $('[data-hero-ghost]');
  const heroD = 'M -40 300 C 320 320, 700 420, 980 430 S 1300 470, 1480 520';
  heroLine.setAttribute('d', heroD); heroGhost.setAttribute('d', heroD);
  function placeTicks() {
    const r = hero.getBoundingClientRect(), len = heroGhost.getTotalLength();
    $$('.hero__tick', hero).forEach(t => {
      const p = heroGhost.getPointAtLength(len * parseFloat(t.dataset.tick));
      t.style.left = (p.x / 1440 * r.width) + 'px';
      t.style.top = (p.y / 900 * r.height) + 'px';
    });
  }

  // Helmet lens: the helmet sits lined up over his head, but only a soft circle around the cursor shows it.
  // The circle grows as the cursor nears his face and follows it, so moving to the chin reveals the chin bar.
  const portrait = $('[data-hero-portrait]');
  const helmetImg = $('.hero__img--helmet', portrait);
  const lens = { x: .5, y: .45, tx: .5, ty: .45, r: 0, tr: 0 };
  portrait.classList.add('is-helmet');
  hero.addEventListener('pointermove', e => {
    const r = helmetImg.getBoundingClientRect();
    if (!r.width) return;
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    lens.tx = fx; lens.ty = fy;
    // how close the cursor is to the face (centre of the helmet box), in helmet widths
    const d = Math.hypot(fx - .5, (fy - .5) * 1.05);
    lens.tr = clamp(1 - (d - .32) / .6);
  });
  hero.addEventListener('pointerleave', () => { lens.tr = 0; });
  function lensTick() {
    const k = reduce ? 1 : .16;
    lens.x = lerp(lens.x, lens.tx, k);
    lens.y = lerp(lens.y, lens.ty, k);
    lens.r = lerp(lens.r, lens.tr, reduce ? 1 : .08);
    if (lens.r < .004) {
      if (helmetImg.style.visibility !== 'hidden') helmetImg.style.visibility = 'hidden';
      return;
    }
    helmetImg.style.visibility = 'visible';
    const w = helmetImg.offsetWidth, h = helmetImg.offsetHeight;
    const R = w * (.1 + .27 * easeOut(lens.r));
    const cx = lens.x * w, cy = lens.y * h;
    const m = `radial-gradient(circle at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, #000 ${(R * .45).toFixed(1)}px, rgba(0,0,0,.75) ${(R * .7).toFixed(1)}px, transparent ${R.toFixed(1)}px)`;
    helmetImg.style.webkitMaskImage = m;
    helmetImg.style.maskImage = m;
    helmetImg.style.transformOrigin = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
    helmetImg.style.transform = `scale(${(1.08 - .08 * lens.r).toFixed(4)})`;
  }

  // race card
  const race = $('[data-hero-race]');
  $('[data-race-ghost]').setAttribute('d', MV.mapPath);
  $('[data-hero-track]').setAttribute('d', MV.mapPath);
  $('[data-race-car]').style.offsetPath = `path('${MV.mapPath}')`;
  let raceIdx = -2;
  function raceTick() {
    const now = Date.now();
    const i = MV.races.findIndex(r => Date.parse(r.start) > now);
    if (i !== raceIdx) {
      raceIdx = i;
      const r = MV.races[i];
      const kicker = $('[data-race-kicker]'), ev = $('[data-race-event]'), circ = $('[data-race-circuit]'), date = $('[data-race-date]');
      if (r) {
        const d = new Date(r.start);
        kicker.textContent = 'Next race';
        ev.textContent = r.event; circ.textContent = r.circuit;
        date.textContent = d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase() + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        race.setAttribute('aria-label', `Next race: ${r.event}, ${r.circuit}`);
      } else {
        const o = MV.offseason;
        kicker.textContent = o.kicker; ev.textContent = o.event; circ.textContent = o.circuit; date.textContent = o.date;
      }
    }
    const r = MV.races[raceIdx];
    const cd = { d: '--', h: '--', m: '--', s: '--' };
    if (r) {
      const left = Math.max(0, Date.parse(r.start) - now) / 1000;
      cd.d = pad(left / 86400); cd.h = pad((left % 86400) / 3600); cd.m = pad((left % 3600) / 60); cd.s = pad(left % 60);
    }
    $$('[data-cd]', race).forEach(n => { if (n.textContent !== cd[n.dataset.cd]) n.textContent = cd[n.dataset.cd]; });
  }
  raceTick(); setInterval(raceTick, 1000);

  function heroIntro() {
    hero.dataset.js = ''; hero.dataset.ready = '';
    const dur = reduce ? 0 : 1;
    heroLine.style.transition = `stroke-dashoffset ${1.8 * dur}s cubic-bezier(.16,1,.3,1) .2s`;
    requestAnimationFrame(() => { heroLine.style.strokeDashoffset = '0'; });
    const trackLine = $('[data-hero-track]');
    trackLine.style.transition = `stroke-dashoffset ${2.2 * dur}s ease .4s`;
    requestAnimationFrame(() => { trackLine.style.strokeDashoffset = '0'; });
    race.classList.add('is-running');
    const anim = (el, kf, o) => el && el.animate(kf, Object.assign({ duration: 1000 * dur, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }, o));
    anim($('.hero__name'), [{ transform: 'translateY(40%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { delay: 150 * dur });
    anim($('.hero__racing'), [{ transform: 'translateY(30%)', opacity: 0, fontStretch: '125%' }, { transform: 'none', opacity: 1, fontStretch: '62%' }], { delay: 250 * dur, duration: 1300 * dur });
    $$('.hero__stripes i').forEach((i, k) => anim(i, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { delay: (400 + k * 90) * dur }));
    anim(race, [{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { delay: 300 * dur });
    anim($('.hero__portrait'), [{ transform: 'translate(-50%, 6%)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1 }], { duration: 1400 * dur });
    $$('.hero__tick').forEach((t, k) => anim(t, [{ opacity: 0 }, { opacity: 1 }], { delay: (700 + k * 250) * dur }));
    scramble($('[data-race-kicker]'));
    scramble($('[data-race-date]'));
  }

  // mouse parallax in the hero
  let mx = 0, my = 0, pmx = 0, pmy = 0;
  hero.addEventListener('pointermove', e => { mx = e.clientX / vw - .5; my = e.clientY / vh - .5; });
  function heroTick(y) {
    if (y > vh * 1.2) return;
    lensTick();
    pmx = lerp(pmx, mx, .06); pmy = lerp(pmy, my, .06);
    field.style.transform = `translate3d(${pmx * -18}px, ${pmy * -12 + y * .15}px, 0)`;
    $('[data-hero-stage]').style.transform = `translate3d(${pmx * 10}px, ${y * .08}px, 0)`;
  }

  /* =========================================================
     MARQUEES
     ========================================================= */
  const rows = $$('[data-mq-row]').map(row => ({ row, track: $('[data-mq-track]', row), dir: +row.dataset.dir || 1, x: 0, w: 0 }));
  const measureRows = () => rows.forEach(r => { r.w = r.track.firstElementChild.offsetWidth; });
  function marqueeTick(dt, speed) {
    if (reduce) return;
    rows.forEach(r => {
      if (!r.w) return;
      const rect = r.row.getBoundingClientRect();
      if (rect.bottom < -50 || rect.top > vh + 50) return;
      r.x -= r.dir * (0.045 * dt + Math.abs(speed) * .35 * Math.sign(speed || 1));
      r.x = ((r.x % r.w) - r.w) % r.w;
      r.track.style.transform = `translate3d(${r.x}px,0,0)`;
    });
  }

  /* =========================================================
     MARQUEE CARD
     ========================================================= */
  const mqcCard = $('[data-mqc-card]');
  onEnter(mqcCard, () => {
    const clip = $('[data-mqc-clip]');
    clip.animate([{ clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }], { duration: reduce ? 0 : 1100, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'both' });
    $('.mqc__img').animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: reduce ? 0 : 1600, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    const line = $('[data-mqc-mark-line]');
    line.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.65,0,.35,1) .6s';
    line.style.strokeDashoffset = '0';
    const num = $('.mqc__mark-num'); num.style.transition = 'opacity .6s 1.6s'; num.style.opacity = '1';
    scramble($('[data-mqc-caption]'));
  });
  $('[data-mqc-clip]').style.clipPath = 'inset(100% 0% 0% 0%)';

  /* =========================================================
     MANIFESTO
     ========================================================= */
  const mfo = $('[data-mfo]');
  const mWords = $$('.mfo__word', mfo);
  const mLines = $$('.mfo__line', mfo);
  const mChips = $$('.mfo__chip', mfo);
  mWords.forEach(w => { w.style.transition = 'opacity .35s, color .35s, background-position 1.2s cubic-bezier(.16,1,.3,1)'; });
  let mLit = -1;
  function manifestoTick() {
    const r = mfo.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp((vh * .75 - r.top) / (r.height * .7));
    const n = Math.round(p * mWords.length);
    if (n === mLit) return;
    mLit = n;
    mWords.forEach((w, i) => {
      const on = i < n;
      if (w.classList.contains('mfo__word--accent')) {
        w.style.opacity = on ? '1' : '';
        w.style.backgroundPosition = on ? '0% 0' : '';
        clearTimeout(w._t);
        if (on) w._t = setTimeout(() => w.classList.add('is-done'), 900); else w.classList.remove('is-done');
      } else {
        w.style.opacity = on ? '1' : '';
        w.style.color = on ? 'var(--ink)' : '';
      }
    });
    mLines.forEach((line, k) => {
      const ws = $$('.mfo__word', line);
      const last = mWords.indexOf(ws[ws.length - 1]);
      mChips[k] && mChips[k].classList.toggle('is-lit', last < n);
    });
  }

  /* =========================================================
     JOURNEY (pinned horizontal timeline)
     ========================================================= */
  const jny = $('[data-jny]'), jPin = $('[data-jny-pin]'), jCards = $$('[data-jny-card]');
  const jDraw = $('[data-jny-line-draw]'), jGhost = $('.jny__line .jny__line-ghost'), jComet = $('[data-jny-comet]'), jYear = $('[data-jny-year]');
  const jLineSvg = $('[data-jny-line]');
  let jDist = 0, jYearNow = '2013';
  const desktop = () => matchMedia('(min-width: 721px)').matches;
  function measureJourney() {
    if (!desktop()) { jny.style.height = ''; return; }
    jDist = Math.max(0, jTrack.scrollWidth - vw);
    jny.style.height = (vh + jDist) + 'px';
  }
  function journeyTick() {
    if (!desktop()) { mobileJourneyTick(); return; }
    const r = jny.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const p = clamp(-r.top / Math.max(1, r.height - vh));
    jTrack.style.transform = `translate3d(${-p * jDist}px,0,0)`;
    jDraw.style.strokeDashoffset = String(1 - p);
    const len = jGhost.getTotalLength(), pt = jGhost.getPointAtLength(len * p);
    const sr = jLineSvg.getBoundingClientRect(), pr = jPin.getBoundingClientRect();
    jComet.style.transform = `translate3d(${sr.left - pr.left + pt.x / 2000 * sr.width}px, ${sr.top - pr.top + pt.y / 300 * sr.height}px, 0)`;
    let best = null, bd = Infinity;
    jCards.forEach(c => { const cr = c.getBoundingClientRect(); const d = Math.abs(cr.left + cr.width / 2 - vw / 2); if (d < bd) { bd = d; best = c; } });
    if (best && best.dataset.year !== jYearNow) { jYearNow = best.dataset.year; scramble(jYear, jYearNow, 450); }
  }
  const jmLine = $('[data-jny-m-line]'), jmYear = $('[data-jny-m-year]'), jmCards = $$('[data-jny-m-card]');
  function mobileJourneyTick() {
    const st = $('.jny__m-stage').getBoundingClientRect();
    if (st.bottom < 0 || st.top > vh) return;
    jmLine.style.strokeDashoffset = String(1 - clamp((vh * .6 - st.top) / st.height));
    const cur = jmCards.filter(c => c.getBoundingClientRect().top < vh * .6).pop();
    const y = cur ? cur.dataset.year : '2013';
    const txt = `SINCE 2013 — ${y}`;
    if (jmYear.textContent !== txt) jmYear.textContent = txt;
  }

  /* =========================================================
     ON TRACK / OFF TRACK
     ========================================================= */
  const onoff = $('[data-onoff]');
  const halves = $$('[data-onoff-half]', onoff);
  halves.forEach((h, i) => {
    h.addEventListener('pointerenter', () => {
      if (!desktop()) return;
      halves.forEach((o, k) => {
        o.style.flexGrow = k === i ? '62' : '38';
        $('.onoff__title', o).style.fontStretch = k === i ? '100%' : '62%';
      });
      onoff.style.setProperty('--seam', i === 0 ? '62%' : '38%');
    });
  });
  onoff.addEventListener('pointerleave', () => {
    halves.forEach(o => { o.style.flexGrow = ''; $('.onoff__title', o).style.fontStretch = ''; });
    onoff.style.setProperty('--seam', '50%');
  });
  const scribble = $('[data-onoff-scribble]');
  scribble.style.transition = 'left .9s cubic-bezier(.76,0,.24,1)';
  onEnter(onoff, () => {
    const l = $('[data-onoff-scribble-line]');
    l.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.65,0,.35,1) .2s'; l.style.strokeDashoffset = '0';
    const t = $('[data-onoff-scribble-text]');
    t.style.transition = 'clip-path 1s cubic-bezier(.76,0,.24,1) .7s'; t.style.clipPath = 'inset(0 0% 0 0)';
    $$('.onoff__title', onoff).forEach((h, i) => h.animate([{ transform: 'translateY(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: reduce ? 0 : 1000, delay: i * 120, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }));
  }, '-25% 0px');

  /* =========================================================
     REVEALS (headings, tiles), MAGNETIC BUTTON, SOCIAL FAN
     ========================================================= */
  $$('[data-reveal-head]').forEach(h => {
    const words = $$('.pcta__word, .soc__word, .ftr__head-word, .sts__word', h);
    words.forEach(w => { w.style.transform = 'translateY(105%)'; });
    onEnter(h, () => words.forEach((w, i) => w.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: reduce ? 0 : 1100, delay: i * 120, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }).finished.then(() => { w.style.transform = 'none'; })));
  });
  // stats: numbers count up from zero, rows rise in, sector bars draw
  const sts = $('[data-sts]');
  onEnter($('[data-sts-grid]'), () => {
    sts.classList.add('is-in');
    $$('[data-count]', sts).forEach((el, i) => {
      const to = parseFloat(el.dataset.count), dp = +el.dataset.dp, t0 = performance.now() + i * 90, dur = reduce ? 0 : 1600;
      const fmt = v => v.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
      const step = now => {
        const p = dur ? clamp((now - t0) / dur) : 1;
        el.textContent = fmt(dp ? to * easeOut(p) : Math.round(to * easeOut(p)));
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = fmt(0);
      requestAnimationFrame(step);
    });
    $$('.sts__row', sts).forEach((r, i) => r.animate([{ transform: 'translateY(16px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: reduce ? 0 : 700, delay: 300 + i * 50, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }));
  }, '-15% 0px');

  $$('[data-rise]').forEach((t, i) => {
    t.style.opacity = '0';
    onEnter(t, () => t.animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: reduce ? 0 : 900, delay: (i % 3) * 110, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }).finished.then(() => { t.style.opacity = '1'; }));
  });
  $$('[data-mg="scramble"]').forEach(el => { if (!el.closest('[data-mqc]')) onEnter(el, () => scramble(el)); });
  $$('[data-magnetic]').forEach(m => {
    const k = parseFloat(m.dataset.magnetic) || .3, inner = $('[data-magnetic-inner]', m);
    m.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
    if (inner) inner.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
    m.addEventListener('pointermove', e => {
      const r = m.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      m.style.transform = `translate(${x * k}px, ${y * k}px)`;
      if (inner) inner.style.transform = `translate(${x * k * .4}px, ${y * k * .4}px)`;
    });
    m.addEventListener('pointerleave', () => { m.style.transform = ''; if (inner) inner.style.transform = ''; });
  });

  const socCards = $$('[data-soc-card]');
  const pmqWord = $('[data-pmq-word]');
  function fanTick() {
    const r = fan.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const p = easeOut(clamp((vh - r.top) / (vh * .75)));
    const mobile = vw <= 720;
    const xs = mobile ? [-34, -17, 0, 17, 34] : [-30, -15, 0, 15, 30];
    const rs = mobile ? [-9, -4.5, 0, 4.5, 9] : [-12, -6, 0, 6, 12];
    socCards.forEach((c, i) => {
      const lift = c.matches(':hover') ? -18 : 0;
      c.style.transform = `translate(-50%, calc(-50% + ${lift + (1 - p) * 60}px)) translateX(${xs[i] * p * vw / 100}px) rotate(${rs[i] * p}deg)`;
    });
    const pr = pmqWord.parentElement.getBoundingClientRect();
    if (pr.bottom > 0 && pr.top < vh) {
      const q = clamp((vh - pr.top) / (vh + pr.height));
      pmqWord.style.transform = `translate(calc(-50% + ${(q - .5) * -20}vw), -50%)`;
      pmqWord.style.fontVariationSettings = `"wdth" ${62 + q * 60}`;
    }
  }
  socCards.forEach(c => { c.style.transition = 'transform .45s cubic-bezier(.16,1,.3,1)'; });

  /* =========================================================
     RACING LINE — one lap down the whole page
     ========================================================= */
  const lap = $('[data-lap]'), lapSvg = $('[data-lap-svg]'), lapLabels = $('[data-lap-labels]');
  const lapBox = $('[data-lap-box]'), lapBoxTime = $('[data-lap-box-time]');
  const carCanvas = $('[data-lap-car]');
  const tbar = $('[data-tbar]'), tbarSegs = $$('[data-tbar-seg]');
  const tTime = $('[data-tbar-time]'), tSec = $('[data-tbar-sec]'), tTurn = $('[data-tbar-turn]');
  const SHAPES = {
    start: [[.47, .04], [.46, .22], [.3, .5], [.1, .76], [.05, .98]],
    hairpin: [[.04, .3], [.06, .66], [.15, .84], [.4, .9], [.74, .935], [.94, .99]],
    pit: [[.97, .25], [.96, .75]],
    esses: [[.96, .12], [.89, .32], [.96, .52], [.89, .72], [.95, .96]],
    eau: [[.9, .25], [.62, .55], [.7, .9]],
    ninety: [[.97, .3], [.97, .74], [.82, .9], [.3, .97]],
    sweep: [[.08, .15], [.04, .5], [.06, .95]],
    straight: [[.06, .3], [.06, .7]],
    final: [[.06, .1], [.04, .45], [.2, .82], [.5, .97]]
  };
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const L = { samples: [], anchors: [], total: 0, segs: [], kerbs: [], labels: [], sectorS: [], built: false, carS: 0, targetS: 0, startTime: 0, parked: false, parkedAt: 0, drawEls: [] };

  function buildLap() {
    lap.style.height = '0px';
    const W = html.clientWidth, docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    lap.style.height = docH + 'px';
    lapSvg.setAttribute('width', W); lapSvg.setAttribute('height', docH);
    lapSvg.innerHTML = ''; lapLabels.innerHTML = '';
    const pts = [], meta = [];
    const segEls = $$('[data-lap-seg]');
    L.segs = segEls.map(seg => {
      const sec = seg.firstElementChild;
      const top = docTop(sec), h = sec.offsetHeight;
      return { el: sec, top, h, shape: seg.dataset.lapShape, sector: +seg.dataset.lapSector, turn: seg.dataset.lapTurn, track: seg.dataset.lapTrack, dark: seg.dataset.lapDark === '1' };
    });
    L.segs.forEach((s, si) => (SHAPES[s.shape] || SHAPES.straight).forEach(([fx, fy], k) => { pts.push([fx * W, s.top + fy * s.h]); meta.push({ si, k }); }));
    const ftHero = $('.ft-hero'), fr = ftHero.getBoundingClientRect();
    const end = [fr.left + fr.width / 2, docTop(ftHero) + fr.height * .55];
    const BOX = W < 720 ? { w: 120, h: 190 } : { w: 190, h: 280 };   // pit box, sized for the car + crew
    pts.push([end[0], end[1] - 160]); meta.push({ si: L.segs.length - 1, k: 99 });
    pts.push(end); meta.push({ si: L.segs.length - 1, k: 100 });
    // keep y strictly increasing so scroll maps cleanly to the lap
    for (let i = 1; i < pts.length; i++) if (pts[i][1] <= pts[i - 1][1]) pts[i][1] = pts[i - 1][1] + 2;
    // Catmull-Rom → cubic Bézier
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    const probe = mk('path', { d });
    lapSvg.appendChild(probe);
    const total = probe.getTotalLength();
    const step = 6, samples = [];
    for (let s = 0; s <= total; s += step) { const p = probe.getPointAtLength(s); samples.push({ s, x: p.x, y: p.y }); }
    samples.push({ s: total, ...(() => { const p = probe.getPointAtLength(total); return { x: p.x, y: p.y }; })() });
    probe.remove();
    // anchors: waypoint y ↔ arc length
    const anchors = []; let j = 0;
    pts.forEach(([x, y]) => {
      let best = j, bd = Infinity;
      for (let k = j; k < samples.length; k++) {
        const dd = Math.hypot(samples[k].x - x, samples[k].y - y);
        if (dd < bd) { bd = dd; best = k; }
        if (samples[k].y > y + 200) break;
      }
      j = best; anchors.push({ y, s: samples[best].s });
    });
    Object.assign(L, { samples, anchors, total, pts, meta });

    // clip regions: dark sections + footer use panel colours
    const defs = mk('defs', {}, lapSvg);
    const cDark = mk('clipPath', { id: 'lapDark' }, defs), cLight = mk('clipPath', { id: 'lapLight' }, defs);
    const darkRanges = L.segs.filter(s => s.dark).map(s => [s.top, s.top + s.h]);
    const ftr = $('[data-footer]'); darkRanges.push([docTop(ftr), docH]);
    darkRanges.sort((a, b) => a[0] - b[0]);
    let cursor = 0;
    darkRanges.forEach(([a, b]) => {
      mk('rect', { x: -50, y: a, width: W + 100, height: b - a }, cDark);
      if (a > cursor) mk('rect', { x: -50, y: cursor, width: W + 100, height: a - cursor }, cLight);
      cursor = b;
    });
    if (cursor < docH) mk('rect', { x: -50, y: cursor, width: W + 100, height: docH - cursor }, cLight);

    // kerbs on the tighter corners
    const kerbRuns = []; let run = null;
    for (let i = 2; i < samples.length - 2; i++) {
      const a1 = Math.atan2(samples[i].y - samples[i - 2].y, samples[i].x - samples[i - 2].x);
      const a2 = Math.atan2(samples[i + 2].y - samples[i].y, samples[i + 2].x - samples[i].x);
      let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      const curv = da / (step * 2);
      if (Math.abs(curv) > .0045) { if (!run) run = { from: i, sign: Math.sign(curv) }; run.to = i; }
      else if (run) { if (run.to - run.from > 5) kerbRuns.push(run); run = null; }
    }
    L.kerbs = [];
    const kerbPath = (r, off) => {
      let kd = '';
      for (let i = r.from; i <= r.to; i++) {
        const a = samples[Math.max(0, i - 1)], b = samples[Math.min(samples.length - 1, i + 1)];
        const ang = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(ang) * -r.sign, ny = Math.cos(ang) * -r.sign;
        kd += `${i === r.from ? 'M' : 'L'} ${(samples[i].x + nx * off).toFixed(1)} ${(samples[i].y + ny * off).toFixed(1)} `;
      }
      return kd;
    };

    const groups = [['lapLight', 'lap__ink'], ['lapDark', 'lap__panel']];
    L.drawEls = [];
    groups.forEach(([clip, cls]) => {
      const g = mk('g', { class: cls, 'clip-path': `url(#${clip})` }, lapSvg);
      mk('path', { d, class: 'lap__band', 'stroke-width': 54 }, g);
      mk('path', { d, class: 'lap__ghost', 'stroke-width': 1.2 }, g);
      const draw = mk('path', { d, class: 'lap__draw', 'stroke-width': 1.8, 'stroke-dasharray': `0 ${total + 10}` }, g);
      L.drawEls.push(draw);
      kerbRuns.forEach((r, ki) => {
        const kg = mk('g', { class: 'lap__kerbs', 'data-kerb': ki }, g);
        const kd = kerbPath(r, 30);
        mk('path', { d: kd, class: 'lap__kerb-base' }, kg);
        mk('path', { d: kd, class: 'lap__kerb' }, kg);
        L.kerbs.push({ el: kg, s: samples[r.from].s });
      });
      // grid slot + start line
      const s0 = samples[0];
      mk('rect', { x: s0.x - 13, y: s0.y - 22, width: 26, height: 40, class: 'lap__grid', fill: 'none' }, g);
      const gt = mk('text', { x: s0.x + 22, y: s0.y - 12, class: 'lap__sector-t' }, g); gt.textContent = `GRID ${MV.number}`;
      const gs = mk('text', { x: s0.x + 22, y: s0.y + 1, class: 'lap__sector-t' }, g); gs.textContent = 'S1';
      for (let c = 0; c < 8; c++) mk('rect', { x: s0.x - 16 + c * 4, y: s0.y + 24 + (c % 2) * 4, width: 4, height: 4, class: 'lap__chk-a0' }, g);
      // parc fermé box
      mk('rect', { x: end[0] - BOX.w / 2, y: end[1] - BOX.h / 2, width: BOX.w, height: BOX.h, rx: 4, class: 'lap__box', fill: 'none' }, g);
    });

    // sector lines where the sector number changes
    L.sectorS = [0];
    L.segs.forEach((s, si) => {
      if (si === 0 || s.sector === L.segs[si - 1].sector) return;
      const firstPt = pts[meta.findIndex(m => m.si === si)];
      const a = L.anchors[meta.findIndex(m => m.si === si)];
      L.sectorS.push(a.s);
      groups.forEach(([clip]) => {
        const g = mk('g', { 'clip-path': `url(#${clip})`, class: clip === 'lapDark' ? 'lap__panel' : 'lap__ink' }, lapSvg);
        mk('line', { x1: firstPt[0] - 22, y1: firstPt[1], x2: firstPt[0] + 22, y2: firstPt[1], class: 'lap__sector' }, g);
        const tx = mk('text', { x: firstPt[0] + (firstPt[0] > W / 2 ? -54 : 28), y: firstPt[1] + 3, class: 'lap__sector-t' }, g);
        tx.textContent = 'S' + s.sector;
      });
    });

    // turn labels
    L.labels = L.segs.map((s, si) => {
      const idx = meta.findIndex(m => m.si === si && m.k === 1);
      const p = pts[idx], a = L.anchors[idx];
      const right = p[0] > W / 2;
      const el = document.createElement('div');
      el.className = 'lap__turn' + (right ? ' is-r' : '') + (s.dark ? ' is-dark' : '');
      el.style.left = (p[0] + (right ? -42 : 42)) + 'px';
      el.style.top = p[1] + 'px';
      el.innerHTML = `<span class="lap__turn-s">S${s.sector}</span><span class="lap__turn-n">${s.turn}</span><span class="lap__turn-t">${s.track}</span>`;
      lapLabels.appendChild(el);
      return { el, s: a.s, seg: s };
    });

    lapBox.style.left = (end[0] - BOX.w / 2) + 'px'; lapBox.style.top = (end[1] - BOX.h / 2) + 'px';
    lapBox.style.width = BOX.w + 'px'; lapBox.style.height = BOX.h + 'px';
    L.end = end; L.built = true;
    sizeCarCanvas();
  }

  const dprC = Math.min(2, devicePixelRatio || 1);
  function sizeCarCanvas() { carCanvas.width = vw * dprC; carCanvas.height = vh * dprC; carCanvas.style.width = vw + 'px'; carCanvas.style.height = vh + 'px'; }
  function sampleAt(s) {
    const smp = L.samples, i = clamp(Math.floor(s / 6), 0, smp.length - 2);
    const a = smp[i], b = smp[i + 1], t = clamp((s - a.s) / Math.max(1e-6, b.s - a.s));
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }
  function sFromY(y) {
    const A = L.anchors;
    if (y <= A[0].y) return 0;
    for (let i = 1; i < A.length; i++) if (y <= A[i].y) return lerp(A[i - 1].s, A[i].s, (y - A[i - 1].y) / (A[i].y - A[i - 1].y));
    return L.total;
  }
  const trail = [];
  function lapTick(y, now) {
    if (!L.built || !loaderDone) return;
    // the car rides ~58% down the viewport, then eases into parc fermé over the last screen of scroll
    const maxY = Math.max(1, document.documentElement.scrollHeight - vh);
    const kEnd = (L.end[1] - maxY) / vh + .01;
    const ramp = clamp((y - (maxY - vh)) / vh);
    L.targetS = sFromY(y + vh * lerp(.58, Math.max(.58, kEnd), ramp * ramp));
    L.carS = lerp(L.carS, L.targetS, .12);
    if (Math.abs(L.carS - L.targetS) < .3) L.carS = L.targetS;
    const s = L.carS;
    L.drawEls.forEach(d => d.setAttribute('stroke-dasharray', `${s.toFixed(1)} ${L.total + 10}`));
    L.kerbs.forEach(k => k.el.classList.toggle('is-on', s > k.s - 500));
    L.labels.forEach(l => l.el.classList.toggle('is-on', s > l.s - 260));

    // car
    const ctx = carCanvas.getContext('2d');
    ctx.setTransform(dprC, 0, 0, dprC, 0, 0); ctx.clearRect(0, 0, vw, vh);
    const p = sampleAt(s), sy = p.y - y;
    const masked = html.classList.contains('is-open') || s <= 1;
    carCanvas.classList.toggle('is-masked', masked);
    trail.unshift({ x: p.x, y: p.y }); trail.length = Math.min(trail.length, 14);
    if (!masked && sy > -80 && sy < vh + 80) {
      const col = carColors();
      for (let i = trail.length - 1; i > 0; i--) {
        const a = trail[i], b = trail[i - 1];
        ctx.strokeStyle = col.a1; ctx.globalAlpha = (1 - i / trail.length) * .35; ctx.lineWidth = 6 * (1 - i / trail.length);
        ctx.beginPath(); ctx.moveTo(a.x, a.y - y); ctx.lineTo(b.x, b.y - y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // in parc fermé (under "LIGHTS OUT.") the car grows and the pit crew get to work
      const base = vw < 720 ? .62 : .82, big = vw < 720 ? 1.6 : 2.6;
      const inBox = s >= L.total - 4;
      L.pitScale = lerp(L.pitScale || base, inBox ? big : base, .08);
      const pit = clamp((L.pitScale - base) / (big - base));
      if (pit > .05 && L.pitT0) {
        const LOOP = 4.6, el = (now - L.pitT0) / 1000, k = Math.floor(el / LOOP);
        const stopTime = 1.86 + ((k * 7919) % 37) / 100;
        drawPitStop(ctx, p.x, sy, p.ang, L.pitScale, col, el % LOOP, stopTime, pit);
        if (pit < 1) { ctx.save(); ctx.globalAlpha = 1 - pit; drawCar(ctx, p.x, sy, p.ang, L.pitScale, col); ctx.restore(); }
      } else {
        drawCar(ctx, p.x, sy, p.ang, L.pitScale, col);
      }
    }

    // timing bar
    const secIdx = L.sectorS.filter(v => s >= v).length - 1;
    const bounds = [...L.sectorS, L.total];
    tbarSegs.forEach((seg, i) => {
      const f = clamp((s - bounds[i]) / Math.max(1, bounds[i + 1] - bounds[i]));
      seg.firstElementChild.style.transform = `scaleX(${f})`;
      seg.classList.toggle(['is-green', 'is-purple', 'is-yellow'][i], f >= 1);
    });
    const parked = s >= L.total - 4;
    if (parked && !L.parked) { L.parked = true; L.parkedAt = now - L.startTime; L.pitT0 = now; lapBoxTime.textContent = fmtLap(L.parkedAt); }
    if (!parked && L.parked) { L.parked = false; L.pitT0 = 0; }
    lapBox.classList.toggle('is-parked', parked);
    tbar.classList.toggle('is-parked', parked);
    tTime.textContent = fmtLap(parked ? L.parkedAt : now - L.startTime);
    const seg = L.labels.filter(l => s >= l.s - 260).pop();
    tSec.textContent = 'S' + (secIdx + 1);
    const turn = s < 2 ? 'GRID' : parked ? 'PARC FERMÉ' : (seg ? seg.seg.turn : 'GRID');
    if (tTurn.textContent !== turn.toUpperCase()) tTurn.textContent = turn.toUpperCase();
  }

  /* =========================================================
     MAIN LOOP + LAYOUT
     ========================================================= */
  let lastY = scrollY, lastT = performance.now();
  function loop(now) {
    lenis && lenis.raf(now);
    const y = scrollY, dt = Math.min(64, now - lastT), speed = y - lastY;
    headerTick(y); heroTick(y); marqueeTick(dt, speed); manifestoTick(); journeyTick(); fanTick(); lapTick(y, now); soundTick(speed);
    lastY = y; lastT = now;
    requestAnimationFrame(loop);
  }

  let rto;
  function layout() {
    vw = html.clientWidth; vh = innerHeight;
    measureRows(); measureJourney(); drawField(); placeTicks(); placeThemeIndicators(html.dataset.theme || 'livery');
    buildLap();
  }
  addEventListener('resize', () => { clearTimeout(rto); rto = setTimeout(layout, 150); });
  addEventListener('mv:theme', () => drawField());
  // re-measure when images or fonts change sizes
  $$('.jny__card img, img[data-ph]').forEach(img => img.addEventListener('load', () => { clearTimeout(rto); rto = setTimeout(layout, 120); }));
  if (document.fonts) document.fonts.ready.then(() => { clearTimeout(rto); rto = setTimeout(layout, 50); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(rto); rto = setTimeout(layout, 150); }).observe(document.body);

  afterLoader.push(() => {
    heroIntro();
    lap.classList.add('is-on'); tbar.classList.add('is-on'); carCanvas.classList.add('is-on');
    L.startTime = performance.now();
  });

  layout();
  runLoader();
  requestAnimationFrame(loop);
})();
