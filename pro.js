/* ============================================================
   downloaderV · CAPA PRO  (pro.js)
   Motor de animaciones premium. Se carga DESPUÉS de app.js.
   No toca la lógica de descargas, Firebase ni soporte.
   ============================================================ */
(function () {
  'use strict';
  const html = document.documentElement;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const io = (cb, opt) => new IntersectionObserver(es => es.forEach(cb), opt);

  /* ==========================================================
     1 · INTRO DE MARCA → ENTRADA DEL HERO
     ========================================================== */
  const intro = $('#proIntro');
  function heroGo() {
    html.classList.remove('pro-loading');
    requestAnimationFrame(() => html.classList.add('pro-hero-go'));
  }
  if (REDUCE) {
    if (intro) intro.remove();
    html.classList.remove('pro-loading');
  } else if (html.classList.contains('pro-loading') && intro) {
    const t0 = performance.now();
    const finish = () => {
      const wait = Math.max(0, 1650 - (performance.now() - t0));
      setTimeout(() => {
        intro.classList.add('out');
        try { sessionStorage.setItem('dv_intro', '1'); } catch (_) {}
        setTimeout(heroGo, 280);
        setTimeout(() => intro.remove(), 1200);
      }, wait);
    };
    if (document.readyState === 'complete') finish();
    else { addEventListener('load', finish, { once: true }); setTimeout(finish, 2600); }
  } else {
    if (intro) intro.remove();
    heroGo();
  }

  /* ==========================================================
     2 · HERO · cascada de chips, paralaje, chispas, scroll
     ========================================================== */
  const hero = $('.hero');
  if (hero) {
    $$('.chips .chip', hero).forEach((c, i) => { c.style.animationDelay = (0.72 + i * 0.07) + 's'; });

    if (!REDUCE) {
      const light = document.createElement('div'); light.className = 'pro-hero-light'; hero.prepend(light);
      const sparks = document.createElement('div'); sparks.className = 'pro-sparks';
      const N = innerWidth < 700 ? 10 : 22;
      for (let i = 0; i < N; i++) {
        const s = document.createElement('i');
        s.style.left = (Math.random() * 100) + '%';
        s.style.animationDuration = (9 + Math.random() * 10) + 's';
        s.style.animationDelay = (-Math.random() * 18) + 's';
        s.style.setProperty('--dx', ((Math.random() - .5) * 120) + 'px');
        const sz = 1.5 + Math.random() * 2.5; s.style.width = s.style.height = sz + 'px';
        sparks.appendChild(s);
      }
      hero.prepend(sparks);

      if (FINE) {
        hero.addEventListener('pointermove', e => {
          const r = hero.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          hero.style.setProperty('--px', ((x - .5) * 2).toFixed(3));
          hero.style.setProperty('--py', ((y - .5) * 2).toFixed(3));
          hero.style.setProperty('--hx', (x * 100).toFixed(1) + '%');
          hero.style.setProperty('--hy', (y * 100).toFixed(1) + '%');
        }, { passive: true });
        hero.addEventListener('pointerleave', () => { hero.style.setProperty('--px', 0); hero.style.setProperty('--py', 0); });
      }
    }
  }

  /* ==========================================================
     3 · DEMO VIVA "Pega el enlace"
     ========================================================== */
  (function demo() {
    const root = $('#proDemo'); if (!root) return;
    const urlEl = $('.pro-url', root), plat = $('.pro-plat', root), go = $('.pro-go', root),
          res = $('.pro-res', root), thumb = $('.pro-thumb', root), dur = $('.pro-thumb b', root),
          title = $('.pro-meta strong', root), meta = $('.pro-meta small', root), qs = $('.pro-qs', root),
          bar = $('.pro-track i', root), pct = $('.pro-pct', root);
    const ITEMS = [
      { k: 'yt', bg: '#FF0000', url: 'youtube.com/watch?v=aurora-noruega-8k', t: 'Aurora boreal sobre los fiordos · 8K HDR', m: 'YouTube · 60 FPS · HDR', d: '12:48',
        th: 'linear-gradient(160deg,#06281f,#0f5a43 40%,#3b2a86 75%,#0b1030)', q: ['8K', '4K', '1080p', '720p', 'MP3'], s: '8K' },
      { k: 'tt', bg: '#000000', url: 'tiktok.com/@viajes.4k/video/7291', t: 'Amanecer en la montaña 🌄', m: 'TikTok · sin marca de agua', d: '0:34',
        th: 'linear-gradient(160deg,#3a1b4f,#c2410c 55%,#f59e0b)', q: ['1080p', '720p', 'MP3', 'WAV'], s: '1080p' },
      { k: 'ig', bg: 'radial-gradient(120% 120% at 28% 105%,#FFD85F,#FF5E3A 28%,#FF2A86 56%,#A036C9 80%,#5B4BE8)', url: 'instagram.com/reel/C9xV2kLmQ', t: '3 recetas en 60 segundos 🍳', m: 'Instagram Reels · audio original', d: '1:00',
        th: 'linear-gradient(160deg,#7c2d12,#db2777 60%,#7c3aed)', q: ['4K', '1080p', '720p', 'MP3'], s: '4K' },
      { k: 'fb', bg: '#1877F2', url: 'facebook.com/watch/?v=10293847', t: 'Timelapse urbano de noche', m: 'Facebook · vídeo público', d: '4:12',
        th: 'linear-gradient(160deg,#0b1a3a,#1d4ed8 55%,#06b6d4)', q: ['4K', '1080p', '720p', 'MP3'], s: '4K' },
      { k: 'x', bg: '#000000', url: 'x.com/creator/status/17893456', t: 'Los mejores momentos del directo', m: 'X · vídeo + subtítulos IA', d: '2:27',
        th: 'linear-gradient(160deg,#111827,#4c1d95 60%,#be185d)', q: ['1080p', '720p', '480p', 'MP3'], s: '1080p' },
    ];
    const PH = 'Pega aquí el enlace de cualquier vídeo…';
    let gen = 0, visible = false, running = false;

    function setPlat(k, bg) {
      $$('svg', plat).forEach(s => s.classList.toggle('on', s.dataset.k === k));
      plat.style.background = bg || '#FCE4EC';
      plat.classList.add('bump'); setTimeout(() => plat.classList.remove('bump'), 260);
    }
    const write = (txt, caret = true) => { urlEl.innerHTML = ''; urlEl.append(document.createTextNode(txt)); if (caret) urlEl.insertAdjacentHTML('beforeend', '<span class="caret"></span>'); urlEl.scrollLeft = urlEl.scrollWidth; };
    const placeholder = () => { urlEl.innerHTML = '<span class="ph">' + PH + '</span><span class="caret"></span>'; };

    function reset() {
      res.classList.remove('open'); bar.style.transition = 'none'; bar.style.width = '0';
      pct.textContent = ''; pct.classList.remove('done'); go.classList.remove('busy');
      setPlat('link'); placeholder();
    }

    async function cycle() {
      const my = ++gen; const ok = () => my === gen && visible;
      running = true; let i = 0;
      while (ok()) {
        const it = ITEMS[i++ % ITEMS.length];
        reset(); await sleep(1100); if (!ok()) break;
        // escribir el enlace
        let shown = false;
        for (let c = 1; c <= it.url.length; c++) {
          write(it.url.slice(0, c));
          if (!shown && c >= 5) { shown = true; setPlat(it.k, it.bg); }
          await sleep(28 + Math.random() * 30); if (!ok()) break;
        }
        if (!ok()) break;
        write(it.url, false); await sleep(380);
        go.classList.add('press'); await sleep(170); go.classList.remove('press');
        go.classList.add('busy'); await sleep(850); if (!ok()) break;
        go.classList.remove('busy');
        // resultado
        thumb.style.setProperty('--thumb', it.th); dur.textContent = it.d;
        title.textContent = it.t; meta.textContent = it.m;
        qs.innerHTML = it.q.map(q => '<span class="pro-q">' + q + '</span>').join('');
        res.classList.add('open'); await sleep(420);
        const chips = $$('.pro-q', qs);
        for (const ch of chips) { ch.classList.add('in'); await sleep(95); }
        await sleep(380); if (!ok()) break;
        const sel = chips.find(c => c.textContent === it.s); if (sel) sel.classList.add('sel');
        await sleep(450); if (!ok()) break;
        // progreso
        const D = 2100, t0 = performance.now();
        bar.style.transition = 'none';
        await new Promise(done => {
          (function f(now) {
            const p = clamp((now - t0) / D, 0, 1), e = 1 - Math.pow(1 - p, 2.2);
            bar.style.width = (e * 100) + '%';
            pct.textContent = 'Descargando ' + Math.round(e * 100) + '%';
            if (p < 1 && ok()) requestAnimationFrame(f); else done();
          })(t0);
        });
        if (!ok()) break;
        pct.textContent = '✓ Guardado · ' + it.s; pct.classList.add('done');
        await sleep(2100);
      }
      running = false;
    }

    reset();
    if (REDUCE) {
      const it = ITEMS[0]; setPlat(it.k, it.bg); write(it.url, false);
      thumb.style.setProperty('--thumb', it.th); dur.textContent = it.d; title.textContent = it.t; meta.textContent = it.m;
      qs.innerHTML = it.q.map(q => '<span class="pro-q in' + (q === it.s ? ' sel' : '') + '">' + q + '</span>').join('');
      res.classList.add('open'); bar.style.width = '100%'; pct.textContent = '✓ Guardado · 8K'; pct.classList.add('done');
      return;
    }
    io(e => { visible = e.isIntersecting; if (visible && !running) setTimeout(() => { if (visible && !running) cycle(); }, 1500); }, { threshold: .25 }).observe(root);
  })();

  if (REDUCE) return;

  /* ==========================================================
     4 · TITULARES palabra a palabra
     ========================================================== */
  $$('.sec-head h2, .split h2, .cta h2, .bk-head h2').forEach(h => {
    if (h.dataset.proSplit) return; h.dataset.proSplit = '1';
    let n = 0; const frag = document.createDocumentFragment();
    const wrap = node => {
      const w = document.createElement('span'); w.className = 'pro-w';
      const s = document.createElement('span'); s.style.setProperty('--i', n++);
      s.appendChild(node); w.appendChild(s); return w;
    };
    Array.from(h.childNodes).forEach(node => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
          else frag.appendChild(wrap(document.createTextNode(part)));
        });
      } else if (node.nodeName === 'BR') frag.appendChild(node);
      else frag.appendChild(wrap(node));
    });
    h.innerHTML = ''; h.appendChild(frag); h.classList.add('pro-split');
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  });
  const splitIO = io(e => { if (e.isIntersecting) { e.target.classList.add('in'); splitIO.unobserve(e.target); } }, { threshold: .35 });
  $$('.pro-split').forEach(h => splitIO.observe(h));

  /* ==========================================================
     5 · REJILLAS en cascada
     ========================================================== */
  const grids = $$('.features, .os-grid, .stats, .support-steps, .steps');
  const gridIO = io(e => {
    if (!e.isIntersecting) return;
    const g = e.target; g.classList.add('in'); gridIO.unobserve(g);
    setTimeout(() => g.classList.add('done'), g.children.length * 90 + 1150);
  }, { threshold: .12 });
  grids.forEach(g => { g.classList.add('pro-stagger'); Array.from(g.children).forEach((c, i) => c.style.setProperty('--si', i)); gridIO.observe(g); });


  /* ==========================================================
     6 · CURSOR PERSONALIZADO
     ========================================================== */
  if (FINE) {
    const ring = document.createElement('div'); ring.className = 'pro-cursor'; 
    const dot = document.createElement('div'); dot.className = 'pro-cursor-dot';
    document.body.append(ring, dot);
    let mx = -100, my = -100, rx = -100, ry = -100, moving = false;
    const HOV = 'a, button, [role="button"], .chip, .faq-q, .sx-chip, .bk-s, .bk-row, .bk-q, label, summary, .pro-rail button';
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      if (!moving) { moving = true; rx = mx; ry = my; html.classList.add('pro-has-cursor'); }
      const t = e.target;
      const dl = t.closest && t.closest('.dl-btn');
      ring.classList.toggle('label', !!dl);
      ring.classList.toggle('hover', !dl && !!(t.closest && t.closest(HOV)));
      const typing = t.closest && t.closest('textarea, input, select, iframe');
      ring.classList.toggle('hide', !!typing); dot.classList.toggle('hide', !!typing);
    }, { passive: true });
    addEventListener('pointerdown', () => ring.classList.add('down'));
    addEventListener('pointerup', () => ring.classList.remove('down'));
    document.addEventListener('mouseleave', () => html.classList.remove('pro-has-cursor'));
    document.addEventListener('mouseenter', () => { if (moving) html.classList.add('pro-has-cursor'); });
    (function loop() {
      rx = lerp(rx, mx, .18); ry = lerp(ry, my, .18);
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ==========================================================
     7 · MARQUEE con inercia y velocidad del scroll
     ========================================================== */
  (function marquee() {
    const mq = $('.marquee'), track = mq && $('.track', mq); if (!track) return;
    let x = 0, dir = 1, speedMul = 1, skew = 0, hover = false, vis = true, last = performance.now(), lastY = scrollY, vel = 0;
    track.classList.add('pro-skew');
    mq.addEventListener('mouseenter', () => hover = true);
    mq.addEventListener('mouseleave', () => hover = false);
    io(e => vis = e.isIntersecting, { rootMargin: '100px' }).observe(mq);
    (function loop(now) {
      const dt = Math.min(64, now - last) / 1000; last = now;
      const dy = scrollY - lastY; lastY = scrollY;
      vel = lerp(vel, dy, .2);
      if (Math.abs(vel) > .6) dir = vel > 0 ? 1 : -1;
      const half = track.scrollWidth / 2 || 1;
      const base = half / 30;
      const target = hover ? 0 : 1 + Math.min(Math.abs(vel) / 6, 6);
      speedMul = lerp(speedMul, target, .08);
      skew = lerp(skew, clamp(-vel * .5, -12, 12), .12);
      if (vis) {
        x -= base * speedMul * dt * dir;
        if (x <= -half) x += half; if (x > 0) x -= half;
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        track.style.setProperty('--skew', skew.toFixed(2) + 'deg');
      }
      requestAnimationFrame(loop);
    })(last);
  })();

  /* ==========================================================
     8 · SCROLL: hero que se aleja, nav inteligente, raíl y "arriba"
     ========================================================== */
  const nav = $('.nav');
  const modalOpen = () => { const m = $('#modalRoot'); return m && m.classList.contains('open'); };

  // raíl de secciones
  const secs = [hero, ...$$('section.section')].filter(Boolean);
  const rail = document.createElement('nav'); rail.className = 'pro-rail'; rail.setAttribute('aria-label', 'Secciones');
  secs.forEach((s, i) => {
    const eb = $('.eyebrow', s), h = $('h2', s);
    let label = i === 0 ? 'Inicio' : (eb ? eb.textContent : (h ? (h.getAttribute('aria-label') || h.textContent) : 'Sección'));
    label = label.replace(/\s+/g, ' ').trim(); label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    if (label.length > 34) label = label.slice(0, 32) + '…';
    const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<span>' + label + '</span>'; b.setAttribute('aria-label', label);
    b.addEventListener('click', () => {
      const y = s.getBoundingClientRect().top + scrollY - (i === 0 ? 30 : 70);
      scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    });
    rail.appendChild(b);
  });
  document.body.appendChild(rail);
  const railBtns = Array.from(rail.children);
  const navMap = {}; $$('.nav-links a[href^="#"]').forEach(a => navMap[a.getAttribute('href').slice(1)] = a);
  const railIO = io(e => {
    if (!e.isIntersecting) return;
    const i = secs.indexOf(e.target);
    railBtns.forEach((b, k) => b.classList.toggle('on', k === i));
    Object.values(navMap).forEach(a => a.classList.remove('pro-active'));
    if (e.target.id && navMap[e.target.id]) navMap[e.target.id].classList.add('pro-active');
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => railIO.observe(s));

  // volver arriba con anillo de progreso
  const top = document.createElement('button'); top.className = 'pro-top'; top.type = 'button'; top.setAttribute('aria-label', 'Volver arriba');
  top.innerHTML = '<svg class="ring" viewBox="0 0 54 54"><defs><linearGradient id="proRingG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E91E63"/><stop offset=".5" stop-color="#8B5CF6"/><stop offset="1" stop-color="#EC4899"/></linearGradient></defs>' +
    '<circle cx="27" cy="27" r="24" stroke="rgba(10,14,26,.08)"/><circle class="p" cx="27" cy="27" r="24" stroke="url(#proRingG)" stroke-linecap="round" stroke-dasharray="150.8" stroke-dashoffset="150.8"/></svg>' +
    '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(top);
  const ringP = $('circle.p', top);

  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = scrollY, d = y - lastY, max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (hero) {
      const p = clamp((y - 260) / 760, 0, 1);   // empieza a alejarse cuando ya se ve la demo
      hero.style.transform = p > 0 ? 'translateY(' + (p * 46).toFixed(1) + 'px) scale(' + (1 - p * .07).toFixed(4) + ')' : '';
    }
    if (nav && !modalOpen()) {
      if (y > 420 && d > 6) nav.classList.add('pro-hidden');
      else if (d < -6 || y < 200) nav.classList.remove('pro-hidden');
    }
    top.classList.toggle('show', y > 700);
    rail.classList.toggle('show', y > 300);
    ringP.style.strokeDashoffset = (150.8 * (1 - y / max)).toFixed(1);
    lastY = y; ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ==========================================================
     9 · BOTÓN DE DESCARGA: onda + ráfaga + aviso
     ========================================================== */
  const COLORS = ['#E91E63', '#FF5C8A', '#8B5CF6', '#A78BFA', '#EC4899', '#F472B6', '#F59E0B', '#22D3EE'];
  const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v14M6 12l6 6 6-6"/></svg>';
  function burst(cx, cy) {
    const N = 26;
    for (let i = 0; i < N; i++) {
      const p = document.createElement('span'); p.className = 'pro-particle';
      const c = COLORS[i % COLORS.length], arrow = i % 4 === 0, sz = arrow ? 16 : 5 + Math.random() * 6;
      p.style.width = p.style.height = sz + 'px';
      if (arrow) { p.innerHTML = ARROW; p.style.color = c; }
      else { p.style.background = c; p.style.borderRadius = Math.random() > .5 ? '50%' : '2px'; p.style.boxShadow = '0 0 10px ' + c; }
      document.body.appendChild(p);
      const a = (Math.PI * 2 * i) / N + Math.random() * .4, dist = 70 + Math.random() * 110;
      const dx = Math.cos(a) * dist, dy = Math.sin(a) * dist - 40, rot = (Math.random() - .5) * 540;
      const x0 = cx - sz / 2, y0 = cy - sz / 2;
      p.animate([
        { transform: `translate(${x0}px,${y0}px) scale(.3) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x0 + dx}px,${y0 + dy}px) scale(1) rotate(${rot / 2}deg)`, opacity: 1, offset: .55 },
        { transform: `translate(${x0 + dx * 1.15}px,${y0 + dy + 90}px) scale(.4) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
    }
  }
  const toast = document.createElement('div'); toast.className = 'pro-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = '<span class="ok"><img src="icono.png" alt=""><i><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><path d="M5 12l5 5L20 6"/></svg></i></span><span><b>¡Tu descarga ha comenzado!</b><small></small></span><span class="tb"></span>';
  document.body.appendChild(toast);
  let toastT = null;
  function showToast(plat) {
    $('small', toast).textContent = plat === 'Android'
      ? 'downloaderV para Android · abre el APK desde tus descargas'
      : 'downloaderV para ' + plat + ' · revisa tu carpeta de descargas';
    toast.classList.remove('show'); void toast.offsetWidth; toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 4300);
  }
  $$('#heroDl, #ctaDl').forEach(btn => {
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect();
      const cx = e.clientX || (r.left + r.width / 2), cy = e.clientY || (r.top + r.height / 2);
      const rp = document.createElement('span'); rp.className = 'pro-ripple';
      const d = Math.max(r.width, r.height) * 2.2;
      rp.style.width = rp.style.height = d + 'px';
      rp.style.left = (cx - r.left - d / 2) + 'px'; rp.style.top = (cy - r.top - d / 2) + 'px';
      btn.appendChild(rp); setTimeout(() => rp.remove(), 850);
      burst(cx, cy);
      const lbl = $('b', btn); showToast(lbl ? lbl.textContent.trim() : 'Windows');
    });
  });

  /* ==========================================================
     10 · FOOTER: la marca gigante se escribe y sigue la luz
     ========================================================== */
  (function footerSign() {
    const wm = $('.foot-watermark'); if (!wm) return;
    const txt = wm.textContent.trim(); wm.setAttribute('data-t', txt); wm.setAttribute('aria-hidden', 'true');
    wm.innerHTML = Array.from(txt).map((ch, i) => '<span class="pro-l" style="--i:' + i + '">' + ch + '</span>').join('');
    io(e => { if (e.isIntersecting) wm.classList.add('in'); }, { threshold: .2 }).observe(wm);
    const foot = wm.closest('footer');
    if (foot && FINE) foot.addEventListener('pointermove', e => {
      const r = wm.getBoundingClientRect(); wm.style.setProperty('--fx', (e.clientX - r.left) + 'px');
    }, { passive: true });
  })();
})();

/* ############################################################
   PARTE 2 · TODA LA PARTE DE ABAJO AL MISMO NIVEL
   ############################################################ */
(function () {
  'use strict';
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const io = (cb, opt) => new IntersectionObserver(es => es.forEach(cb), opt);
  const onScrollFns = [];

  /* ---------- FAQ: buscador (también sin animaciones) ---------- */
  (function faqSearch() {
    const faq = $('.faq'); if (!faq) return;
    const items = $$('.faq-item', faq);
    const norm = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const box = document.createElement('label'); box.className = 'pro-faq-search';
    box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>' +
      '<input type="search" placeholder="Busca tu duda: calidad, cuenta, Android, Creator Studio…" aria-label="Buscar en preguntas frecuentes"><span class="cnt"></span><kbd>/</kbd>';
    faq.parentNode.insertBefore(box, faq);
    const empty = document.createElement('div'); empty.className = 'pro-faq-empty';
    empty.innerHTML = '<b>No encontramos esa duda… todavía.</b>Escríbenos y te respondemos en minutos.<br><button type="button">Preguntar al soporte</button>';
    faq.after(empty);
    $('button', empty).addEventListener('click', () => { const t = $('[data-modal="soporte"]'); if (t) t.click(); });
    const input = $('input', box), cnt = $('.cnt', box);
    const data = items.map(it => {
      const q = $('.faq-q', it), tn = Array.from(q.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
      const span = document.createElement('span'); span.className = 'pro-qt'; span.textContent = tn ? tn.textContent : '';
      if (tn) q.replaceChild(span, tn);
      return { it, span, q: span.textContent, all: norm(it.textContent) };
    });
    const esc = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    function run() {
      const v = norm(input.value.trim()); let n = 0;
      data.forEach(d => {
        const hit = !v || v.split(/\s+/).every(w => d.all.includes(w));
        d.it.classList.toggle('pro-hide', !hit); if (hit) n++;
        if (!v) { d.span.textContent = d.q; return; }
        const nq = norm(d.q); let out = '', i = 0; const w = v.split(/\s+/)[0]; let k = nq.indexOf(w);
        if (k < 0 || !w) { d.span.textContent = d.q; return; }
        out = esc(d.q.slice(0, k)) + '<mark>' + esc(d.q.slice(k, k + w.length)) + '</mark>' + esc(d.q.slice(k + w.length));
        d.span.innerHTML = out; i++;
      });
      cnt.textContent = v ? (n === 1 ? '1 resultado' : n + ' resultados') : '';
      empty.classList.toggle('show', n === 0);
    }
    input.addEventListener('input', run);
    addEventListener('keydown', e => {
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) {
        const r = box.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { e.preventDefault(); input.focus(); }
      }
    });
  })();

  if (REDUCE) return;

  /* ---------- A · Secciones oscuras: rejilla viva + expansión al entrar ---------- */
  const darks = $$('.sec-dark');
  darks.forEach(sec => {
    const g = document.createElement('div'); g.className = 'pro-grid-bg'; g.innerHTML = '<i></i><i></i><i></i>'; sec.prepend(g);
  });
  onScrollFns.push(() => {
    darks.forEach(sec => {
      const r = sec.getBoundingClientRect(), vh = innerHeight;
      if (r.bottom < -50 || r.top > vh + 50) return;
      const k = Math.min(clamp((vh - r.top) / (vh * .75), 0, 1), clamp(r.bottom / (vh * .75), 0, 1));
      const e = 1 - Math.pow(1 - k, 3);
      sec.style.setProperty('--cx', ((1 - e) * 4.5).toFixed(2) + '%');
      sec.style.setProperty('--cr', ((1 - e) * 52).toFixed(1) + 'px');
    });
  });

  /* ---------- B · Borde de luz en todas las tarjetas ---------- */
  const HOSTS = '.feat, .step, .stat, .os, .sup-card, .faq-item, .vrow, .mock, .support-panel';
  $$(HOSTS).forEach(h => {
    if (h.closest('.hero') || h.closest('.modal-root')) return;
    if (getComputedStyle(h).position === 'static') h.classList.add('pro-edge-host');
    const e = document.createElement('span'); e.className = 'pro-edge'; h.appendChild(e);
    const z = h.parentElement; z.classList.add('pro-edge-zone'); (z._proHosts = z._proHosts || []).push(h);
  });
  if (FINE) {
    let pend = null;
    addEventListener('pointermove', e => {
      if (pend) return;
      pend = requestAnimationFrame(() => {
        pend = null;
        const z = e.target.closest && e.target.closest('.pro-edge-zone'); if (!z || !z._proHosts) return;
        z._proHosts.forEach(h => {
          const r = h.getBoundingClientRect();
          h.style.setProperty('--ex', (e.clientX - r.left) + 'px'); h.style.setProperty('--ey', (e.clientY - r.top) + 'px');
          const ed = h.lastElementChild; if (ed && ed.classList.contains('pro-edge')) { ed.style.setProperty('--ex', (e.clientX - r.left) + 'px'); ed.style.setProperty('--ey', (e.clientY - r.top) + 'px'); }
        });
      });
    }, { passive: true });
  }

  /* ---------- C · Línea de tiempo en los pasos ---------- */
  const COLS = { green: ['#10B981', 'rgba(16,185,129,.7)'], purple: ['#8B5CF6', 'rgba(139,92,246,.7)'], blue: ['#E91E63', 'rgba(233,30,99,.7)'],
                 amber: ['#F59E0B', 'rgba(245,158,11,.7)'], pink: ['#EC4899', 'rgba(236,72,153,.7)'], cyan: ['#06B6D4', 'rgba(6,182,212,.7)'] };
  const timelines = $$('.steps').map(st => {
    const steps = $$(':scope > .step', st), nums = steps.map(s => $('.num', s));
    if (steps.length < 2 || nums.some(n => !n)) return null;
    const tl = document.createElement('div'); tl.className = 'pro-tl'; tl.innerHTML = '<span class="fill"></span>' + steps.map(() => '<b></b>').join('');
    st.appendChild(tl);
    const key = (nums[0].className.match(/bg-(\w+)/) || [])[1];
    const c = COLS[key];
    if (c) { tl.style.setProperty('--tlc', 'linear-gradient(180deg,' + c[0] + ',' + c[0] + ')'); tl.style.setProperty('--tlg', c[1]); }
    steps.forEach(s => { if (c) s.style.setProperty('--tld', c[0]); });
    if (c) tl.style.setProperty('--tld', c[0]);
    const T = { st, steps, nums, tl, fill: $('.fill', tl), nodes: $$('b', tl), cs: [] };
    T.layout = () => {
      T.cs = steps.map((s, i) => s.offsetTop + nums[i].offsetTop + nums[i].offsetHeight / 2);
      const f = T.cs[0], h = T.cs[T.cs.length - 1] - f;
      tl.style.top = f + 'px'; tl.style.height = h + 'px';
      T.nodes.forEach((b, i) => b.style.top = (T.cs[i] - f) + 'px');
    };
    T.layout(); return T;
  }).filter(Boolean);
  onScrollFns.push(() => {
    timelines.forEach(T => {
      const r = T.st.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const f = T.cs[0], h = T.cs[T.cs.length - 1] - f, line = innerHeight * .62 - (r.top + f);
      T.fill.style.height = clamp(line, 0, h) + 'px';
      T.cs.forEach((c, i) => { const on = c - f <= line + 2; T.nodes[i].classList.toggle('on', on); T.steps[i].classList.toggle('pro-lit', on); });
    });
  });

  /* ---------- D · Estudio de clonación de voz en directo ---------- */
  (function voiceStudio() {
    const wave = $('.wave'); const mock = wave && wave.closest('.mock'); if (!mock) return;
    const body = $('.mock-body', mock), label = $('.mock-label', mock);
    body.innerHTML = '<div class="pro-vs" data-ph="rec">' +
      '<div class="pro-vs-top"><span class="pro-vs-st"><span class="rec"></span><span class="tx">Grabando tu voz</span></span><span class="pro-vs-t">00:00</span></div>' +
      '<canvas></canvas><div class="pro-vs-scan"></div>' +
      '<div class="pro-vs-line"></div><div class="pro-vs-bar"><i></i></div>' +
      '<div class="pro-vs-steps"><span>1 · Grabar</span><span>2 · Entrenar</span><span>3 · Usar</span></div></div>';
    const vs = $('.pro-vs', body), cv = $('canvas', vs), ctx = cv.getContext('2d'), st = $('.tx', vs), tm = $('.pro-vs-t', vs),
          line = $('.pro-vs-line', vs), bar = $('.pro-vs-bar i', vs), pills = $$('.pro-vs-steps span', vs);
    let amp = .6, ampT = .6, phase = 'rec', visible = false, gen = 0, t0 = performance.now();
    function size() { const d = Math.min(2, devicePixelRatio || 1); cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; }
    size(); addEventListener('resize', size);
    function draw(now) {
      if (!visible) return;
      const t = (now - t0) / 1000, W = cv.width, H = cv.height, N = 56, gap = W / N, bw = Math.max(2, gap * .55);
      amp += (ampT - amp) * .08;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      if (phase === 'train') { g.addColorStop(0, '#FCD34D'); g.addColorStop(1, '#F59E0B'); }
      else { g.addColorStop(0, '#F0ABFC'); g.addColorStop(.5, '#A78BFA'); g.addColorStop(1, '#6D28D9'); }
      ctx.fillStyle = g;
      for (let i = 0; i < N; i++) {
        const env = Math.sin(Math.PI * (i + .5) / N);
        const n = Math.abs(Math.sin(i * .55 + t * 6.1) * .6 + Math.sin(i * .21 - t * 3.7) * .4 + (phase === 'rec' ? Math.sin(i * 1.7 + t * 11) * .25 : 0));
        const h = Math.max(H * .04, H * .92 * amp * env * (.25 + .75 * n));
        const x = i * gap + (gap - bw) / 2, y = (H - h) / 2;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, bw, h, bw / 2); else ctx.rect(x, y, bw, h); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    const setPh = (p, i) => { phase = p; vs.dataset.ph = p; pills.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('ok', k < i); }); };
    async function cycle() {
      const my = ++gen, ok = () => my === gen && visible;
      while (ok()) {
        // 1 · grabar
        setPh('rec', 0); if (label) label.textContent = 'Studio de clonación · GRABANDO';
        st.textContent = 'Grabando tu voz'; line.textContent = 'Habla con naturalidad · con 30 segundos es suficiente'; bar.style.width = '0';
        ampT = .85;
        for (let s = 0; s <= 30; s++) { tm.textContent = '00:' + String(s).padStart(2, '0'); bar.style.width = (s / 30 * 100) + '%'; ampT = .55 + Math.random() * .45; await sleep(115); if (!ok()) return; }
        await sleep(300); if (!ok()) return;
        // 2 · entrenar
        setPh('train', 1); if (label) label.textContent = 'Studio de clonación · ENTRENANDO';
        st.textContent = 'Entrenando el modelo'; ampT = .22; bar.style.width = '0';
        const words = ['Analizando el timbre…', 'Analizando el tono…', 'Aprendiendo tu acento…', 'Capturando matices únicos…'];
        for (let p = 0; p <= 100; p += 2) { tm.textContent = p + '%'; bar.style.width = p + '%'; line.textContent = words[Math.min(3, Math.floor(p / 26))]; await sleep(62); if (!ok()) return; }
        // 3 · lista
        setPh('ready', 2); if (label) label.textContent = 'Studio de clonación · LISTA';
        st.textContent = 'Tu voz clonada está lista'; tm.textContent = '✓ IA'; bar.style.width = '100%';
        line.innerHTML = '<span class="say"></span>'; const say = $('.say', line);
        const txt = '«Hola, soy tu voz clonada. Puedo narrar tus vídeos por ti.»';
        for (let c = 1; c <= txt.length; c++) { say.textContent = txt.slice(0, c); ampT = /[\s,.»]/.test(txt[c - 1]) ? .2 : .65 + Math.random() * .35; await sleep(42); if (!ok()) return; }
        ampT = .12; await sleep(2600);
      }
    }
    io(e => {
      const was = visible; visible = e.isIntersecting;
      if (visible && !was) { size(); requestAnimationFrame(draw); cycle(); }
    }, { threshold: .3 }).observe(mock);
  })();

  /* ---------- E · Biblioteca de voces que "suena" ---------- */
  (function voiceLib() {
    const rows = $$('.vrow'); if (!rows.length) return;
    let touched = false, timer = null, current = null, vis = false;
    rows.forEach(r => {
      r.insertAdjacentHTML('beforeend', '<span class="pro-eq"><i></i><i></i><i></i><i></i><i></i></span><span class="pro-vbar"></span>');
      r.setAttribute('role', 'button'); r.setAttribute('tabindex', '0');
      r.setAttribute('aria-label', 'Escuchar ' + ($('.vmeta b', r) || r).textContent.trim());
    });
    const icon = (r, n) => { const m = $('.vplay .material-symbols-rounded', r); if (m) m.textContent = n; };
    function stop(r) { if (!r) return; r.classList.remove('playing'); icon(r, 'play_arrow'); if (current === r) current = null; }
    function play(r) {
      if (current) stop(current);
      const bar = $('.pro-vbar', r); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      r.classList.add('playing'); icon(r, 'pause'); current = r;
      clearTimeout(timer); timer = setTimeout(() => { stop(r); if (!touched && vis) timer = setTimeout(() => play(rows[(rows.indexOf(r) + 1) % rows.length]), 700); }, 3200);
    }
    rows.forEach(r => {
      const act = () => { touched = true; clearTimeout(timer); if (r.classList.contains('playing')) stop(r); else { play(r); } };
      r.addEventListener('click', act);
      r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });
    io(e => { vis = e.isIntersecting; if (vis && !touched && !current) timer = setTimeout(() => play(rows[0]), 900); if (!vis && !touched) { clearTimeout(timer); stop(current); } },
       { threshold: .5 }).observe(rows[0].parentElement);
  })();

  /* ---------- F · Estadísticas con línea que se dibuja ---------- */
  $$('.stat').forEach((s, k) => {
    const pts = []; for (let i = 0; i <= 8; i++) pts.push([i * 15, 26 - i * 2.2 - Math.sin(i * 1.3 + k) * 4.5]);
    let d = 'M' + pts[0][0] + ' ' + pts[0][1].toFixed(1);
    for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i], mx = (p[0] + q[0]) / 2; d += ' C' + mx + ' ' + p[1].toFixed(1) + ' ' + mx + ' ' + q[1].toFixed(1) + ' ' + q[0] + ' ' + q[1].toFixed(1); }
    const last = pts[pts.length - 1], id = 'proSpk' + k;
    s.insertAdjacentHTML('beforeend', '<svg class="pro-spark" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + 'l" x1="0" x2="1"><stop offset="0" stop-color="#E91E63"/><stop offset=".6" stop-color="#8B5CF6"/><stop offset="1" stop-color="#EC4899"/></linearGradient>' +
      '<linearGradient id="' + id + 'a" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8B5CF6" stop-opacity=".28"/><stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="a" d="' + d + ' L120 32 L0 32 Z" fill="url(#' + id + 'a)"/><path class="l" d="' + d + '" stroke="url(#' + id + 'l)"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1].toFixed(1) + '" r="3.2" fill="#EC4899"/></svg>');
  });

  /* ---------- G · Novedades con línea de progreso ---------- */
  (function changelog() {
    const cl = $('.changelog'); if (!cl) return;
    const items = $$('.clog', cl), dots = items.map(i => $('.cdot', i)); if (!items.length) return;
    const first = $('.cmeta b', items[0]); if (first) first.insertAdjacentHTML('beforeend', '<span class="pro-new">NUEVO</span>');
    const ln = document.createElement('div'); ln.className = 'pro-cl-line'; ln.innerHTML = '<i></i>'; cl.prepend(ln);
    const fill = $('i', ln); let cs = [];
    const layout = () => {
      cs = items.map((it, i) => it.offsetTop + dots[i].offsetTop + dots[i].offsetHeight / 2);
      ln.style.top = cs[0] + 'px'; ln.style.height = (cs[cs.length - 1] - cs[0]) + 'px';
      ln.style.left = (dots[0].offsetLeft + dots[0].offsetWidth / 2 - 1) + 'px';
    };
    layout(); addEventListener('resize', layout);
    onScrollFns.push(() => {
      const r = cl.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const line = innerHeight * .7 - (r.top + cs[0]), h = cs[cs.length - 1] - cs[0];
      fill.style.height = clamp(line, 0, h) + 'px';
      cs.forEach((c, i) => items[i].classList.toggle('pro-on', c - cs[0] <= line + 2));
    });
  })();

  /* ---------- H · Panel de soporte ---------- */
  (function supportPanel() {
    const sp = $('.support-panel'); if (!sp) return;
    const lt = document.createElement('div'); lt.className = 'pro-sp-light'; sp.prepend(lt);
    if (FINE) sp.addEventListener('pointermove', e => { const r = sp.getBoundingClientRect(); sp.style.setProperty('--sx', (e.clientX - r.left) + 'px'); sp.style.setProperty('--sy', (e.clientY - r.top) + 'px'); }, { passive: true });
    const foot = $('.sps-foot', sp);
    if (foot) foot.insertAdjacentHTML('beforebegin', '<svg class="pro-ecg" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="proEcgG" x1="0" x2="1"><stop offset="0" stop-color="#10B981" stop-opacity="0"/><stop offset=".3" stop-color="#10B981"/><stop offset=".7" stop-color="#22D3EE"/><stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="base" d="M0 22 H48 L56 22 L61 8 L67 34 L72 15 L77 22 H138 L146 22 L151 6 L157 36 L162 13 L167 22 H228 L236 22 L241 9 L247 33 L252 16 L257 22 H300"/><path class="run" d="M0 22 H48 L56 22 L61 8 L67 34 L72 15 L77 22 H138 L146 22 L151 6 L157 36 L162 13 L167 22 H228 L236 22 L241 9 L247 33 L252 16 L257 22 H300"/></svg>');
    const rows = $$('.sps-row', sp), pills = rows.map(r => $('.sps-pill', r)), ok = $('.sps-ok', sp);
    let done = false;
    io(async e => {
      if (!e.isIntersecting || done) return; done = true;
      pills.forEach(p => { p.dataset.t = p.textContent; p.textContent = 'Comprobando'; p.classList.add('pro-chk'); });
      if (ok) { ok.style.transition = 'opacity .5s'; ok.style.opacity = '0'; }
      await sleep(500);
      for (let i = 0; i < rows.length; i++) {
        rows[i].classList.add('pro-scan'); await sleep(620);
        pills[i].classList.remove('pro-chk'); pills[i].textContent = pills[i].dataset.t; pills[i].classList.add('pro-pop');
        rows[i].classList.remove('pro-scan');
      }
      if (ok) ok.style.opacity = '1';
    }, { threshold: .45 }).observe(sp);
  })();

  /* ---------- J · CTA final con el nivel del hero ---------- */
  (function cta() {
    const c = $('.cta'); if (!c) return;
    const P = {
      yt: ['#FF0000', '<svg viewBox="0 0 24 24" fill="#FF0000"><path d="M23 12s0-3.8-.5-5.6a3 3 0 0 0-2.1-2.1C18.6 3.8 12 3.8 12 3.8s-6.6 0-8.4.5A3 3 0 0 0 1.5 6.4C1 8.2 1 12 1 12s0 3.8.5 5.6a3 3 0 0 0 2.1 2.1c1.8.5 8.4.5 8.4.5s6.6 0 8.4-.5a3 3 0 0 0 2.1-2.1C23 15.8 23 12 23 12zM10 15.5v-7l6 3.5z"/></svg>'],
      tt: ['', '<svg viewBox="0 0 24 24" fill="#fff"><path d="M16.6 5.8a4.3 4.3 0 0 1-1-2.8h-3.3v13.4a2.4 2.4 0 1 1-2.4-2.4c.2 0 .5 0 .7.1V8.3a5.8 5.8 0 1 0 5 5.7V8.7a7.5 7.5 0 0 0 4.4 1.4V6.8a4.3 4.3 0 0 1-3.4-1z"/></svg>'],
      ig: ['', '<svg viewBox="0 0 24 24" fill="none" stroke="#F472B6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#F472B6" stroke="none"/></svg>'],
      fb: ['', '<svg viewBox="0 0 24 24" fill="#FF5C8A"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.4v1.7h2.6l-.4 2.9h-2.2v7A10 10 0 0 0 22 12z"/></svg>'],
      x: ['', '<svg viewBox="0 0 24 24" fill="#fff"><path d="M18.2 2h3.3l-7.2 8.3L23 22h-6.6l-5.2-6.8L5.3 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2zm-1.2 18h1.8L7.1 3.9H5.2z"/></svg>'],
      tw: ['', '<svg viewBox="0 0 24 24" fill="#A78BFA"><path d="M4.3 2 3 5.4V20h5v2.6h2.8L13.4 20h4L23 14.4V2zm16.8 11.5-3.2 3.2h-5l-2.8 2.8v-2.8H5.9V3.9h15.2z"/><path d="M15.4 7.1h1.9v5.6h-1.9zm-5.2 0h1.9v5.6h-1.9z"/></svg>']
    };
    const POS = [['yt', 'left:7%;top:16%', 26, -8, 0], ['tt', 'left:13%;bottom:16%', 40, 6, 1.2], ['ig', 'left:24%;top:6%', 18, 10, 2.1],
                 ['fb', 'right:8%;top:20%', 34, 8, .6], ['x', 'right:14%;bottom:14%', 22, -6, 1.7], ['tw', 'right:25%;top:7%', 46, -10, 2.6]];
    const fx = document.createElement('div'); fx.className = 'pro-cta-fx';
    fx.innerHTML = '<span class="bl"></span><span class="bl"></span><span class="bl"></span><span class="gr"></span><span class="lt"></span><span class="pro-cta-ring"></span>' +
      POS.map(p => '<span class="pro-bub" style="' + p[1] + ';--d:' + p[2] + 'px;--r:' + p[3] + 'deg;animation-delay:' + p[4] + 's">' + P[p[0]][1] + '</span>').join('');
    c.prepend(fx);
    if (FINE) {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--px', ((x - .5) * 2).toFixed(3)); c.style.setProperty('--py', ((y - .5) * 2).toFixed(3));
        c.style.setProperty('--hx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--hy', (y * 100).toFixed(1) + '%');
      }, { passive: true });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--px', 0); c.style.setProperty('--py', 0); });
    }
  })();

  /* ---------- K · Paralaje de visuales + footer ---------- */
  const visuals = innerWidth > 900 ? $$('.split .visual') : [];
  onScrollFns.push(() => {
    visuals.forEach(v => {
      const r = v.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const d = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      v.style.setProperty('--pv', clamp(-d * 70, -45, 45).toFixed(1) + 'px');
    });
  });
  const fg = $('.foot-grid');
  if (fg) io(e => { if (e.isIntersecting) fg.classList.add('in'); }, { threshold: .15 }).observe(fg);

  /* ---------- bucle único de scroll ---------- */
  let tick = false;
  const run = () => { onScrollFns.forEach(f => f()); tick = false; };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
  addEventListener('resize', () => { timelines.forEach(T => T.layout()); run(); });
  addEventListener('load', () => { timelines.forEach(T => T.layout()); run(); });
  run();
})();

/* ############################################################
   PARTE 3 · TEMA ROSA: iconos en etiquetas y menú
   ############################################################ */
(function () {
  'use strict';
  const MAP = [
    [/funcionalidades/, 'bolt'], [/opciones/, 'tune'], [/motor propio/, 'memory'], [/c[oó]mo funciona/, 'settings_suggest'],
    [/disponibilidad|multiplataforma/, 'devices'], [/creator studio/, 'movie_edit'], [/cinco pasos|flujo/, 'route'],
    [/flash/, 'flash_on'], [/configuraci[oó]n/, 'settings'], [/razones/, 'favorite'], [/clonaci[oó]n/, 'graphic_eq'],
    [/clon perfecto/, 'record_voice_over'], [/biblioteca/, 'library_music'], [/casos de uso/, 'lightbulb'],
    [/siempre al d[ií]a/, 'update'], [/changelog|releases/, 'history'], [/soporte|reportes/, 'support_agent'],
    [/preguntas/, 'help'], [/masiva/, 'playlist_add'], [/listas|canales/, 'playlist_play'], [/subt[ií]tulos/, 'subtitles']
  ];
  const ms = n => '<span class="pro-ms">' + n + '</span>';
  document.querySelectorAll('.eyebrow').forEach(e => {
    if (e.querySelector('.pro-ei')) return;
    const t = e.textContent.toLowerCase();
    const hit = MAP.find(m => m[0].test(t));
    e.insertAdjacentHTML('afterbegin', '<span class="pro-ei" aria-hidden="true">' + ms(hit ? hit[1] : 'auto_awesome') + '</span>');
  });
  const NAV = { '#funciones': 'apps', '#flash': 'flash_on', '#voz': 'graphic_eq', '#soporte': 'support_agent', '#faq': 'help', '#descargar': 'download' };
  document.querySelectorAll('.nav-links a').forEach(a => {
    const ic = NAV[a.getAttribute('href')]; if (!ic || a.querySelector('.pro-ni')) return;
    a.insertAdjacentHTML('afterbegin', '<span class="pro-ms pro-ni" aria-hidden="true">' + ic + '</span>');
  });
})();

/* ############################################################
   PARTE 4 · ACABADOS NIVEL GOOGLE
   ############################################################ */
(function () {
  'use strict';
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (q, r = document) => r.querySelector(q);

  /* ---------- Ondas Material al pulsar ---------- */
  const RPL = '.chip:not(.hl), .pchip:not(.more), .sx-chip, .bk-s, .faq-q, .btn-ghost, .vrow, .feat, .sup-card, .step, .os, .stat, .nav-cta, .pro-faq-empty button, .dl-btn:not(#heroDl):not(#ctaDl), .pro-mbar button';
  if (!REDUCE) document.addEventListener('pointerdown', e => {
    const h = e.target.closest && e.target.closest(RPL); if (!h || h.closest('.hero .chips .chip.hl')) return;
    if (getComputedStyle(h).position === 'static') h.style.position = 'relative';
    if (getComputedStyle(h).overflow === 'visible') h.style.overflow = 'hidden';
    const r = h.getBoundingClientRect(), d = Math.hypot(r.width, r.height) * 2;
    const s = document.createElement('span'); s.className = 'pro-rpl';
    s.style.width = s.style.height = d + 'px';
    s.style.left = (e.clientX - r.left - d / 2) + 'px'; s.style.top = (e.clientY - r.top - d / 2) + 'px';
    const pinkBg = h.matches('.dl-btn, .nav-cta, .pro-mbar button') && !h.closest('.cta');
    if (pinkBg) s.style.setProperty('--rpl', 'rgba(255,255,255,.35)');
    h.appendChild(s); setTimeout(() => s.remove(), 700);
  }, { passive: true });

  /* ---------- Menú: indicador que se desliza ---------- */
  const links = $('.nav-links');
  if (links) {
    const ind = document.createElement('span'); ind.className = 'pro-nav-ind'; links.prepend(ind);
    const items = Array.from(links.querySelectorAll('a:not(.nav-cta)'));
    const go = a => {
      if (!a || a.offsetParent === null) { ind.style.opacity = '0'; return; }
      ind.style.left = a.offsetLeft + 'px'; ind.style.width = a.offsetWidth + 'px'; ind.style.opacity = '1';
    };
    const active = () => items.find(a => a.classList.contains('pro-active'));
    let hovering = false, last = null;
    items.forEach(a => a.addEventListener('mouseenter', () => { hovering = true; go(a); }));
    links.addEventListener('mouseleave', () => { hovering = false; go(active()); });
    const tick = () => { const a = active(); if (!hovering && a !== last) { last = a; go(a); } };
    addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true });
    addEventListener('resize', () => go(active()));
    tick();
  }

  /* ---------- Barra de descarga fija en móvil ---------- */
  const heroBtn = $('#heroDl'), hero = $('.hero'), cta = $('#descargar'), foot = $('footer');
  if (heroBtn && hero) {
    const bar = document.createElement('div'); bar.className = 'pro-mbar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Descargar downloaderV');
    const lbl = ($('#heroDlLabel') || {}).textContent || 'Android';
    bar.innerHTML = '<img src="icono.png" alt=""><span class="t"><b>downloaderV</b><small>Gratis · Sin marca de agua · ' + lbl + '</small></span>' +
      '<button type="button"><span class="pro-ms">download</span>Descargar</button>';
    document.body.appendChild(bar);
    $('button', bar).addEventListener('click', () => heroBtn.click());
    let ctaIn = false, footIn = false;
    const ob = new IntersectionObserver(es => es.forEach(e => { if (e.target === cta) ctaIn = e.isIntersecting; else footIn = e.isIntersecting; upd(); }), { threshold: .05 });
    if (cta) ob.observe(cta); if (foot) ob.observe(foot);
    function upd() {
      const show = hero.getBoundingClientRect().bottom < 0 && !ctaIn && !footIn;
      bar.classList.toggle('show', show); document.documentElement.classList.toggle('pro-mbar-on', show && innerWidth <= 720);
    }
    addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); upd();
  }
})();
