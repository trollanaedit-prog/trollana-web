/* ============================================================
   downloaderV · web 2026  (dv.js)
   Enlaces de descarga, menú, galería, demos y ventanas.
   Sin "scroll" artificial: el desplazamiento es el nativo del navegador.
   ============================================================ */
(function () {
  'use strict';
  const d = document, html = d.documentElement;
  const $ = (s, r) => (r || d).querySelector(s);
  const $$ = (s, r) => Array.from((r || d).querySelectorAll(s));
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const EMAIL = 'downloadervtrollana@gmail.com';
  const E = window.DVEmoji;

  /* Visibilidad: activa/pausa lo que está en pantalla */
  const visIO = new IntersectionObserver((es) => es.forEach((e) => {
    e.target.classList.toggle('is-vis', e.isIntersecting);
    const cb = e.target._onVis; if (cb) cb(e.isIntersecting);
  }), { rootMargin: '120px 0px' });
  function watch(el, cb) { if (!el) return; if (cb) el._onVis = cb; visIO.observe(el); }
  $$('[data-anim], .marquee').forEach((el) => watch(el));

  /* ============================================================
     1 · ENLACES DE DESCARGA (se leen de LINKSSSSSSSSSSS.txt)
     ============================================================ */
  const LINKS = {
    windows: 'https://github.com/trollanaedit-prog/trollana-releases/releases/download/2.0.11/DownloaderV.2.0.11.exe',
    android: 'https://github.com/trollanaedit-prog/trollana-releases/releases/download/1.0.11/DownloaderV.1.0.11.apk',
  };
  const UA = navigator.userAgent || '';
  const esMovil = (() => {
    try { if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') return navigator.userAgentData.mobile; } catch (_) {}
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(UA);
  })();
  const esIOS = /iPhone|iPad|iPod/i.test(UA) || (/Macintosh/i.test(UA) && navigator.maxTouchPoints > 1);
  const esMac = !esIOS && /Macintosh|Mac OS X/i.test(UA);
  const MAIN = esMovil ? 'android' : 'windows', OTHER = MAIN === 'android' ? 'windows' : 'android';
  const NAME = { windows: 'Windows', android: 'Android' };
  const ICON = {
    windows: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5.5 10.5 4.5v7H3zM10.5 12.5v7L3 18.5v-6zM11.8 4.3 21 3v8.5h-9.2zM21 12.5V21l-9.2-1.3v-7.2z"/></svg>',
    android: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.86 3.22a11.43 11.43 0 0 0-8.92 0L6.14 5.92a.38.38 0 1 0-.66.38L7.32 9.48A10.83 10.83 0 0 0 1.94 18h20.12a10.83 10.83 0 0 0-5.38-8.52zM7.32 14.84a1.18 1.18 0 1 1 1.18-1.18 1.18 1.18 0 0 1-1.18 1.18zm9.36 0a1.18 1.18 0 1 1 1.18-1.18 1.18 1.18 0 0 1-1.18 1.18z"/></svg>',
  };
  function paintLinks() {
    $$('[data-dl]').forEach((el) => {
      const k = el.dataset.dl, plat = k === 'auto' ? MAIN : k === 'other' ? OTHER : k;
      el.dataset.plat = plat;
      if (el.tagName === 'A') el.href = LINKS[plat];
      if (k === 'other') el.textContent = 'También para ' + NAME[plat];
      const lab = $('[data-dl-label]', el), ic = $('[data-dl-icon]', el);
      if (lab) lab.textContent = NAME[plat];
      if (ic) ic.innerHTML = ICON[plat];
    });
    const cta = $('.hs-cta');
    if (cta && (esIOS || esMac) && !$('.hs-ios', cta)) {
      cta.insertAdjacentHTML('beforeend', `<p class="hs-ios">${esIOS ? 'La versión para iPhone' : 'La versión para Mac'} llega pronto. Mientras, puedes usar la de ${esIOS ? 'Android' : 'Windows'}.</p>`);
    }
  }
  const linksReady = fetch('LINKSSSSSSSSSSS.txt?v=' + Date.now(), { cache: 'no-store' })
    .then((r) => (r.ok ? r.text() : ''))
    .then((t) => {
      const urls = (t.match(/https?:\/\/[^\s()"'<>]+/gi) || []).map((u) => u.replace(/[),.;]+$/, ''));
      const exe = urls.find((u) => /\.exe(\?|$)/i.test(u)), apk = urls.find((u) => /\.apk(\?|$)/i.test(u));
      if (exe) LINKS.windows = exe; if (apk) LINKS.android = apk;
      paintLinks();
    }).catch(() => {});
  paintLinks();
  const COLORS = ['#E91E63', '#FF5C8A', '#8B5CF6', '#A78BFA', '#EC4899', '#F472B6', '#F59E0B', '#22D3EE'];
  const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v14M6 12l6 6 6-6"/></svg>';
  function burst(cx, cy) {
    if (REDUCE) return;
    const N = innerWidth < 600 ? 18 : 26;
    for (let i = 0; i < N; i++) {
      const p = d.createElement('span'); p.className = 'pro-particle';
      const c = COLORS[i % COLORS.length], arrow = i % 4 === 0, sz = arrow ? 16 : 5 + Math.random() * 6;
      p.style.width = p.style.height = sz + 'px';
      if (arrow) { p.innerHTML = ARROW; p.style.color = c; } else { p.style.background = c; p.style.borderRadius = Math.random() > .5 ? '50%' : '2px'; p.style.boxShadow = '0 0 10px ' + c; }
      d.body.appendChild(p);
      const a = (Math.PI * 2 * i) / N + Math.random() * .4, dist = 70 + Math.random() * 110;
      const dx = Math.cos(a) * dist, dy = Math.sin(a) * dist - 40, rot = (Math.random() - .5) * 540, x0 = cx - sz / 2, y0 = cy - sz / 2;
      p.animate([
        { transform: `translate(${x0}px,${y0}px) scale(.3) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x0 + dx}px,${y0 + dy}px) scale(1) rotate(${rot / 2}deg)`, opacity: 1, offset: .55 },
        { transform: `translate(${x0 + dx * 1.15}px,${y0 + dy + 90}px) scale(.4) rotate(${rot}deg)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
    }
  }
  const toast = d.createElement('div'); toast.className = 'pro-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = '<span class="ok"><img src="icono.png" alt=""><i><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><path d="M5 12l5 5L20 6"/></svg></i></span><span><b>¡Tu descarga ha comenzado!</b><small></small></span><span class="tb"></span>';
  d.body.appendChild(toast);
  let toastT = null;
  function showToast(plat) {
    $('small', toast).textContent = plat === 'android' ? 'downloaderV para Android · abre el APK desde tus descargas' : 'downloaderV para Windows · revisa tu carpeta de descargas';
    toast.classList.remove('show'); void toast.offsetWidth; toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 4300);
  }
  d.addEventListener('click', (e) => {
    const el = e.target.closest('[data-dl]'); if (!el) return;
    const plat = el.dataset.plat || MAIN, r = el.getBoundingClientRect();
    const cx = e.clientX || (r.left + r.width / 2), cy = e.clientY || (r.top + r.height / 2);
    if (el.classList.contains('dl-btn') && !REDUCE) {
      const rp = d.createElement('span'); rp.className = 'pro-ripple'; const dd = Math.max(r.width, r.height) * 2.2;
      rp.style.width = rp.style.height = dd + 'px'; rp.style.left = (cx - r.left - dd / 2) + 'px'; rp.style.top = (cy - r.top - dd / 2) + 'px';
      el.appendChild(rp); setTimeout(() => rp.remove(), 850);
    }
    burst(cx, cy); showToast(plat);
    if (el.tagName === 'BUTTON') Promise.race([linksReady, sleep(1500)]).then(() => { location.href = LINKS[plat]; });
  });

  /* ============================================================
     2 · CABECERA: fondo al bajar, menú móvil y sección activa
     ============================================================ */
  const nav = $('.nav'), menuBtn = $('#navMenu');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { nav.classList.toggle('scrolled', scrollY > 8); ticking = false; });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar el menú' : 'Abrir el menú');
  }
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
  const navMap = new Map($$('#navLinks a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
  const secIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    navMap.forEach((a, id) => a.classList.toggle('on', id === e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  navMap.forEach((_, id) => { const s = d.getElementById(id); if (s) secIO.observe(s); });

  /* Caras estáticas sueltas (bento, ajustes, llamada final) */
  if (E) $$('[data-face]').forEach((el) => { el.innerHTML = E.svg(el.dataset.face); });

  /* ============================================================
     3 · INTRO CON EL LOGO → ENTRADA DEL HERO
     ============================================================ */
  (function intro() {
    const el = $('#intro');
    const heroGo = () => { html.classList.remove('pro-loading'); requestAnimationFrame(() => html.classList.add('hero-go')); };
    if (REDUCE || !html.classList.contains('pro-loading') || !el) { if (el && !html.classList.contains('pro-loading')) el.remove(); heroGo(); return; }
    const t0 = performance.now(); let done = false;
    const finish = () => {
      if (done) return; done = true;
      setTimeout(() => {
        el.classList.add('out');
        try { sessionStorage.setItem('dv_intro', '1'); } catch (_) {}
        setTimeout(heroGo, 260); setTimeout(() => el.remove(), 1200);
      }, Math.max(0, 1550 - (performance.now() - t0)));
    };
    if (d.readyState === 'complete') finish(); else { addEventListener('load', finish, { once: true }); setTimeout(finish, 2400); }
  })();

  (function hero() {
    const stage = $('#hstage'), slot = $('#heroEmo'); if (!stage) return;
    // chispas que suben
    const sp = $('#hsSparks');
    if (sp && !REDUCE) {
      const N = innerWidth < 700 ? 8 : 18; let h = '';
      for (let i = 0; i < N; i++) {
        const sz = (1.5 + Math.random() * 2.5).toFixed(1);
        const side = Math.random() < .5, band = innerWidth < 700 ? 3.5 : 11, x = side ? 1 + Math.random() * band : 99 - Math.random() * band;
        h += `<i style="left:${x.toFixed(1)}%;width:${sz}px;height:${sz}px;animation-duration:${(9 + Math.random() * 10).toFixed(1)}s;animation-delay:${(-Math.random() * 18).toFixed(1)}s;--dx:${((side ? -1 : 1) * Math.random() * (innerWidth < 700 ? 14 : 50)).toFixed(0)}px"></i>`;
      }
      sp.innerHTML = h;
    }
    // paralaje suave con el ratón (solo PC)
    if (!REDUCE && matchMedia('(hover:hover) and (pointer:fine)').matches) {
      let raf = 0, nx = 0, ny = 0, mx = 50, my = 30;
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        nx = (x - .5) * 2; ny = (y - .5) * 2; mx = x * 100; my = y * 100;
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; stage.style.setProperty('--px', nx.toFixed(3)); stage.style.setProperty('--py', ny.toFixed(3)); stage.style.setProperty('--hx', mx.toFixed(1) + '%'); stage.style.setProperty('--hy', my.toFixed(1) + '%'); });
      }, { passive: true });
      stage.addEventListener('pointerleave', () => { stage.style.setProperty('--px', 0); stage.style.setProperty('--py', 0); });
    }
    // emoji 3D que se estampa al final del titular
    if (!slot || !E) return;
    if (REDUCE) { slot.innerHTML = E.svg('cool', { final: true }); return; }
    let handle = null;
    const stamp = () => E.play(slot, 'cool', { hold: Infinity }).then((h) => { handle = h; });
    const wait = () => { if (html.classList.contains('hero-go')) setTimeout(stamp, 1500); else setTimeout(wait, 120); };
    wait();
    watch($('.hero'), (on) => { if (handle && handle.anims) handle.anims.forEach((a) => a && (on ? a.play() : a.pause())); });
  })();

  /* ============================================================
     4 · HERO: demo "pega el enlace"
     ============================================================ */
  (function pasteDemo() {
    const root = $('#pasteDemo'); if (!root) return;
    const urlEl = $('.pd-url', root), plat = $('.pd-plat', root), go = $('.pd-go', root), res = $('.pd-res', root),
      thumb = $('.pd-thumb', root), dur = $('.pd-thumb b', root), title = $('.pd-meta strong', root), meta = $('.pd-meta small', root),
      qs = $('.pd-qs', root), bar = $('.pd-track i', root), pct = $('.pd-pct', root);
    const ITEMS = [
      { k: 'yt', bg: '#FF0000', url: 'youtube.com/watch?v=aurora-noruega-8k', t: 'Aurora boreal sobre los fiordos · 8K HDR', m: 'YouTube · 60 fps · HDR', d: '12:48', th: 'linear-gradient(160deg,#06281f,#0f5a43 40%,#3b2a86 75%,#0b1030)', q: ['8K', '4K', '1080p', '720p', 'MP3'], s: '8K' },
      { k: 'tt', bg: '#000', url: 'tiktok.com/@viajes.4k/video/7291', t: 'Amanecer en la montaña', m: 'TikTok · sin marca de agua', d: '0:34', th: 'linear-gradient(160deg,#3a1b4f,#c2410c 55%,#f59e0b)', q: ['1080p', '720p', 'MP3', 'WAV'], s: '1080p' },
      { k: 'ig', bg: 'radial-gradient(120% 120% at 28% 105%,#FFD85F,#FF5E3A 28%,#FF2A86 56%,#A036C9 80%,#5B4BE8)', url: 'instagram.com/reel/C9xV2kLmQ', t: '3 recetas en 60 segundos', m: 'Instagram Reels · audio original', d: '1:00', th: 'linear-gradient(160deg,#7c2d12,#db2777 60%,#7c3aed)', q: ['4K', '1080p', '720p', 'MP3'], s: '4K' },
      { k: 'fb', bg: '#1877F2', url: 'facebook.com/watch/?v=10293847', t: 'Timelapse urbano de noche', m: 'Facebook · vídeo público', d: '4:12', th: 'linear-gradient(160deg,#0b1a3a,#1d4ed8 55%,#06b6d4)', q: ['4K', '1080p', '720p', 'MP3'], s: '4K' },
      { k: 'x', bg: '#000', url: 'x.com/creator/status/17893456', t: 'Los mejores momentos del directo', m: 'X · vídeo + subtítulos IA', d: '2:27', th: 'linear-gradient(160deg,#111827,#4c1d95 60%,#be185d)', q: ['1080p', '720p', '480p', 'MP3'], s: '1080p' },
    ];
    let gen = 0, visible = false, running = false;
    const setPlat = (k, bg) => { $$('svg', plat).forEach((s) => s.classList.toggle('on', s.dataset.k === k)); plat.style.background = bg || '#fff'; plat.classList.add('bump'); setTimeout(() => plat.classList.remove('bump'), 260); };
    const write = (txt, caret) => { urlEl.textContent = txt; if (caret !== false) urlEl.insertAdjacentHTML('beforeend', '<span class="caret"></span>'); urlEl.scrollLeft = urlEl.scrollWidth; };
    const placeholder = () => { urlEl.innerHTML = '<span class="ph">Pega aquí el enlace de cualquier vídeo…</span><span class="caret"></span>'; };
    const fill = (it) => { thumb.style.setProperty('--thumb', it.th); dur.textContent = it.d; title.textContent = it.t; meta.textContent = it.m; qs.innerHTML = it.q.map((q) => '<span class="pd-q">' + q + '</span>').join(''); };
    function reset() { res.classList.remove('open'); bar.style.width = '0'; pct.textContent = ''; pct.classList.remove('done'); go.classList.remove('busy'); setPlat('link'); placeholder(); }
    async function cycle() {
      const my = ++gen, ok = () => my === gen && visible; running = true; let i = 0;
      while (ok()) {
        const it = ITEMS[i++ % ITEMS.length];
        reset(); await sleep(1000); if (!ok()) break;
        let shown = false;
        for (let c = 1; c <= it.url.length; c++) { write(it.url.slice(0, c)); if (!shown && c >= 5) { shown = true; setPlat(it.k, it.bg); } await sleep(26 + Math.random() * 28); if (!ok()) break; }
        if (!ok()) break;
        write(it.url, false); await sleep(360);
        go.classList.add('press'); await sleep(170); go.classList.remove('press');
        go.classList.add('busy'); await sleep(800); if (!ok()) break; go.classList.remove('busy');
        fill(it); res.classList.add('open'); await sleep(420);
        const chips = $$('.pd-q', qs);
        for (const ch of chips) { ch.classList.add('in'); await sleep(90); }
        await sleep(360); if (!ok()) break;
        const sel = chips.find((c) => c.textContent === it.s); if (sel) sel.classList.add('sel');
        await sleep(420); if (!ok()) break;
        const D = 2000, t0 = performance.now();
        await new Promise((done) => { (function f(now) { const p = clamp((now - t0) / D, 0, 1), e = 1 - Math.pow(1 - p, 2.2); bar.style.width = (e * 100) + '%'; pct.textContent = 'Descargando ' + Math.round(e * 100) + '%'; if (p < 1 && ok()) requestAnimationFrame(f); else done(); })(t0); });
        if (!ok()) break;
        pct.textContent = 'Guardado · ' + it.s; pct.classList.add('done');
        await sleep(2000);
      }
      running = false;
    }
    reset(); fill(ITEMS[0]); // contenido desde el principio: la tarjeta no cambia de alto
    if (REDUCE) { const it = ITEMS[0]; setPlat(it.k, it.bg); write(it.url, false); fill(it); $$('.pd-q', qs).forEach((q) => q.classList.add('in', ...(q.textContent === it.s ? ['sel'] : []))); res.classList.add('open'); bar.style.width = '100%'; pct.textContent = 'Guardado · 8K'; pct.classList.add('done'); return; }
    watch(root, (on) => { visible = on; if (on && !running) setTimeout(() => { if (visible && !running) cycle(); }, 900); });
  })();

  /* ============================================================
     5 · GALERÍA DE FOTOS (Windows / Android) + visor
     ============================================================ */
  const GAL = {
    win: [
      ['01_portada', 'El descargador más completo que has visto', 'Vídeos, música, canales enteros e historias de más de 1.500 plataformas, en calidad original y sin marcas de agua.'],
      ['02_copia_pega_descarga', 'Copia. Pega. Descarga.', 'Sin cuenta, sin marcas de agua y en la mejor calidad: hasta 8K.'],
      ['03_plataformas', 'Más de 1.500 webs compatibles', 'Pega cualquier enlace y la app reconoce la plataforma al instante.'],
      ['04_calidad', 'Hasta 8K y 60 fps, sin perder nada', 'Descarga el vídeo y el audio por separado y únelos sin recomprimir.'],
      ['05_8k', 'Cada píxel, en 8K', 'Si el vídeo existe en 8K, lo bajas en 8K, con su miniatura original.'],
      ['06_canales', 'Canales enteros, en un toque', 'Abre cualquier canal o perfil y descarga todo, o solo lo que elijas.'],
      ['09_gestor_descargas', 'Cientos de vídeos, sin esperar', 'Elige la calidad una vez y descarga 8, 80 o 630 vídeos seguidos.'],
      ['10_mejor_momento', 'Baja solo el momento que importa', 'Descubre la parte más vista del vídeo y bájala en vídeo o en audio.'],
      ['11_subtitulos', 'Subtítulos que enganchan, solos', 'Más de 80 estilos que salen dentro del vídeo descargado.'],
      ['12_emojis', 'Emojis 3D que reaccionan a lo que dices', 'Caras animadas bajo el subtítulo cuando se dicen palabras como risa, miedo o dinero.'],
      ['14_creator_studio', 'Un editor de vídeo completo', 'Filtros, efectos VFX, subtítulos con IA y stickers, sin salir de la app.'],
      ['17_boveda', 'Tu bóveda secreta y cifrada', 'Vídeos, fotos y notas que no quieres que vea nadie, con tu propia clave.'],
      ['23_todo', 'Todo en una sola app', 'Mucho más que un descargador: una suite para descargar, editar y proteger tus vídeos.'],
    ],
    and: [
      ['01_portada', 'El descargador más completo que has visto', 'Vídeos, música, canales enteros e historias de más de 1.500 plataformas, en tu Android.'],
      ['03_flash_download', 'Descarga sin abrir la app', 'Comparte o pega el enlace desde la notificación y se descarga solo.'],
      ['04_plataformas', 'Más de 1.500 webs compatibles', 'Pega cualquier enlace y la app reconoce la plataforma al instante.'],
      ['06_8k', 'Cada píxel, en 8K', 'Si el vídeo existe en 8K, lo bajas en 8K, también desde el móvil.'],
      ['07_canales', 'Canales enteros, en un toque', 'Abre cualquier perfil o canal y descarga lo que elijas.'],
      ['12_subtitulos', 'Subtítulos que enganchan, solos', 'Más de 80 estilos con vista previa en directo.'],
      ['13_emojis', 'Emojis 3D que reaccionan a lo que dices', 'Caras, objetos, mapas y números en 3D debajo del subtítulo.'],
      ['15_creator_studio', 'Un editor de vídeo completo', 'Monta y dale estilo a tus vídeos sin salir de la app.'],
      ['18_boveda', 'Tu bóveda secreta y cifrada', 'Cifrado con clave propia, fuera de la galería del móvil.'],
      ['24_todo', 'Todo en una sola app', 'Descarga, edita y protege tus vídeos desde Android.'],
    ],
  };
  const imgPath = (set, f, w) => `img/app/${set}/${f}-${w}.webp`;
  const srcset = (set, f) => [480, 960, 1600].map((w) => `${imgPath(set, f, w)} ${w}w`).join(', ');
  (function gallery() {
    const root = $('#gal'); if (!root) return;
    const img = $('#galImg'), fig = $('#galOpen'), T = $('#galT'), D = $('#galD'), Nn = $('#galN'), thumbs = $('#galThumbs');
    let set = esMovil ? 'and' : 'win', idx = 0;
    function renderThumbs() {
      thumbs.innerHTML = GAL[set].map((g, i) => `<button type="button" class="gal-th" aria-label="Foto ${i + 1}: ${g[1]}"><img src="${imgPath(set, g[0], 480)}" alt="" width="480" height="270" loading="lazy" decoding="async"></button>`).join('');
      $$('.gal-th', thumbs).forEach((b, i) => b.addEventListener('click', () => show(i)));
    }
    function show(i, focusThumb) {
      const L = GAL[set]; idx = (i + L.length) % L.length; const g = L[idx];
      fig.classList.add('wait');
      const pre = new Image(); pre.decoding = 'async'; pre.sizes = img.sizes; pre.srcset = srcset(set, g[0]); pre.src = imgPath(set, g[0], 960);
      const swap = () => { img.srcset = pre.srcset; img.src = pre.src; img.alt = g[1]; fig.classList.remove('wait'); };
      if (pre.complete) swap(); else { pre.onload = swap; pre.onerror = swap; }
      T.textContent = g[1]; D.textContent = g[2]; Nn.textContent = `${idx + 1} / ${L.length}`;
      $$('.gal-th', thumbs).forEach((b, k) => b.setAttribute('aria-current', String(k === idx)));
      const th = $$('.gal-th', thumbs)[idx];
      if (th) { const left = th.offsetLeft - (thumbs.clientWidth - th.offsetWidth) / 2; thumbs.scrollTo({ left, behavior: REDUCE ? 'auto' : 'smooth' }); if (focusThumb) th.focus(); }
      const nx = L[(idx + 1) % L.length]; const p2 = new Image(); p2.sizes = img.sizes; p2.srcset = srcset(set, nx[0]);
    }
    function setSet(s) {
      set = s; $$('.gal-tab', root).forEach((t) => t.setAttribute('aria-selected', String(t.dataset.set === s)));
      renderThumbs(); show(0);
    }
    $$('.gal-tab', root).forEach((t) => t.addEventListener('click', () => setSet(t.dataset.set)));
    $('.gal-nav.prev', root).addEventListener('click', () => show(idx - 1));
    $('.gal-nav.next', root).addEventListener('click', () => show(idx + 1));
    root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { show(idx - 1); e.preventDefault(); } if (e.key === 'ArrowRight') { show(idx + 1); e.preventDefault(); } });
    // deslizar con el dedo
    let sx = 0, sy = 0, moved = false;
    fig.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; moved = false; });
    fig.addEventListener('pointerup', (e) => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { moved = true; show(idx + (dx < 0 ? 1 : -1)); } });
    fig.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; return; } openLB(); });
    setSet(set);

    // Visor a pantalla completa
    const lb = $('#lb'), lbImg = $('#lbImg'), lbN = $('#lbN'), lbT = $('#lbT');
    let lastFocus = null;
    function lbShow() { const L = GAL[set], g = L[idx]; lbImg.src = imgPath(set, g[0], 1600); lbImg.alt = g[1]; lbN.textContent = `${idx + 1} / ${L.length}`; lbT.textContent = g[1]; }
    function openLB() { lastFocus = d.activeElement; lbShow(); lb.hidden = false; d.body.style.overflow = 'hidden'; $('#lbX').focus(); }
    function closeLB() { lb.hidden = true; d.body.style.overflow = ''; show(idx); if (lastFocus) lastFocus.focus(); }
    $('#lbX').addEventListener('click', closeLB);
    $('#lbP').addEventListener('click', () => { idx = (idx - 1 + GAL[set].length) % GAL[set].length; lbShow(); });
    $('#lbN2').addEventListener('click', () => { idx = (idx + 1) % GAL[set].length; lbShow(); });
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
    addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowLeft') $('#lbP').click();
      if (e.key === 'ArrowRight') $('#lbN2').click();
    });
    let lx = 0;
    lb.addEventListener('pointerdown', (e) => { lx = e.clientX; });
    lb.addEventListener('pointerup', (e) => { const dx = e.clientX - lx; if (Math.abs(dx) > 50) (dx < 0 ? $('#lbN2') : $('#lbP')).click(); });
  })();

  /* ============================================================
     6 · DEMO DE SUBTÍTULOS EN EL MONITOR / TELÉFONO
     ============================================================ */
  $$('.subdemo').forEach((el) => {
    const cap = $('.sd-cap', el), host = el.closest('[data-anim]') || el;
    const phrases = ['Hola chicos, ¿qué tal?', 'Bienvenidos al canal.', 'Hoy probamos los subtítulos automáticos.'];
    let running = false, visible = false;
    if (REDUCE) { el.classList.add('is-playing'); cap.innerHTML = phrases[2].split(' ').map((w, i, a) => `<span class="w${i === a.length - 1 ? ' hot' : ''}">${w}</span>`).join(''); return; }
    async function speak(text) {
      cap.innerHTML = '';
      for (const word of text.split(' ')) {
        if (!visible) return;
        const prev = $('.w.hot', cap); if (prev) prev.classList.remove('hot');
        const w = d.createElement('span'); w.className = 'w hot'; w.textContent = word; cap.appendChild(w);
        await sleep(word.length > 7 ? 240 : 190);
      }
      await sleep(600); const last = $('.w.hot', cap); if (last) last.classList.remove('hot'); await sleep(220);
    }
    async function cycle() {
      while (running && visible) {
        el.classList.remove('is-proc', 'is-playing'); cap.innerHTML = '';
        await sleep(1300); if (!visible) break;
        el.classList.add('is-proc'); await sleep(1600); if (!visible) break;
        el.classList.remove('is-proc'); el.classList.add('is-playing');
        for (const p of phrases) { await speak(p); if (!visible) break; }
        cap.innerHTML = ''; await sleep(600);
      }
      running = false;
    }
    watch(host, (on) => { visible = on; if (on && !running) { running = true; cycle(); } });
  });

  /* ============================================================
     7 · REPRODUCTOR: base común (onda, tiempo, controles)
     ============================================================ */
  function makeWave(el, n, seed) {
    const bars = $('.wv-bars', el); let s = seed || 7, h = '';
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < n; i++) {
      const env = .45 + .55 * Math.abs(Math.sin(i / n * Math.PI * 3.2 + 1)) * (i % 17 < 2 ? .25 : 1);
      h += `<i style="--h:${Math.round((14 + rnd() * 70) * env + 8)}%"></i>`;
    }
    bars.innerHTML = h;
    const items = $$('i', bars), head = $('.wv-head', el);
    let lastP = -1;
    return {
      set(p) {
        const k = Math.round(p * items.length);
        if (k !== lastP) {
          const a = Math.min(k, lastP < 0 ? 0 : lastP), b = Math.max(k, lastP < 0 ? items.length : lastP);
          for (let i = a; i < b; i++) if (items[i]) items[i].classList.toggle('p', i < k);
          lastP = k;
        }
        head.style.setProperty('--x', (p * bars.clientWidth) + 'px');
      },
      marks(list) { items.forEach((it) => it.classList.remove('mk')); list.forEach((p) => { const it = items[Math.min(items.length - 1, Math.round(p * items.length))]; if (it) it.classList.add('mk'); }); },
    };
  }
  const fmt = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`; };

  /* ============================================================
     8 · SUBTÍTULOS SIN DESCARGAR: subtítulo arrastrable
     ============================================================ */
  (function subPlayer() {
    const root = $('#subPlayer'); if (!root) return;
    const stage = $('#subStage'), cap = $('#subCap'), capIn = $('#subCapIn'), timeEl = $('#subTime'), posTx = $('#subPosTx'), ppBtn = $('.pp', root);
    const wave = makeWave($('#subWave'), 96, 11);
    const TEXT = 'Hola chicos qué tal bienvenidos al canal hoy os enseño subtítulos que se mueven donde tú quieras y se descargan así'.toUpperCase().split(' ');
    const DUR = 8;
    let per = 2, styleK = 'sticker', t = 0, playing = true, visible = false, raf = 0, last = 0, lastGroup = -1;
    const STY = { sticker: 'Caja Sticker · Clásico', d3: '3D · Relieve', paint: 'Pintura · Brocha', neon: 'Neón · Brillo', fire: 'Fuego Viral · Llamas', kara: 'Karaoke · Palabra a palabra' };
    const groups = () => { const g = []; for (let i = 0; i < TEXT.length; i += per) g.push(TEXT.slice(i, i + per)); return g; };
    let G = groups();
    function renderGroup(gi, wi) {
      const words = G[gi] || [];
      let l1 = words, l2 = [];
      if (styleK !== 'kara' && words.length > 1) { const cut = Math.ceil(words.length / 2); l1 = words.slice(0, cut); l2 = words.slice(cut); }
      const w = (arr, off) => arr.map((x, k) => `<span class="w${styleK === 'kara' && off + k === wi ? ' now' : ''}">${x}</span>`).join(' ');
      capIn.innerHTML = `<span class="ln l1">${w(l1, 0)}</span>${l2.length ? `<span class="ln l2">${w(l2, l1.length)}</span>` : ''}`;
    }
    function frame(now) {
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (playing) t = (t + dt) % DUR;
      const p = t / DUR, slot = DUR / G.length, gi = Math.floor(t / slot), wi = Math.floor(((t % slot) / slot) * (G[gi] || []).length);
      const key = gi * 10 + (styleK === 'kara' ? wi : 0);
      if (key !== lastGroup) { renderGroup(gi, wi); if (Math.floor(lastGroup / 10) !== gi && !REDUCE) { capIn.classList.remove('cap-pop'); void capIn.offsetWidth; capIn.classList.add('cap-pop'); } lastGroup = key; }
      wave.set(p); timeEl.textContent = `${fmt(t)} / ${fmt(DUR)}`;
      if (visible) raf = requestAnimationFrame(frame);
    }
    function start() { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); }
    watch(root, (on) => { visible = on; if (on) start(); else cancelAnimationFrame(raf); });
    function setPlaying(v) { playing = v; ppBtn.innerHTML = `<span class="ms">${v ? 'pause' : 'play_arrow'}</span>`; ppBtn.setAttribute('aria-label', v ? 'Pausar' : 'Reproducir'); }
    $$('.pl-tr button', root).forEach((b) => b.addEventListener('click', () => {
      const slot = DUR / G.length, gi = Math.floor(t / slot);
      if (b.dataset.act === 'play') setPlaying(!playing);
      if (b.dataset.act === 'start') t = 0;
      if (b.dataset.act === 'back') t = ((gi - 1 + G.length) % G.length) * slot;
      if (b.dataset.act === 'next') t = ((gi + 1) % G.length) * slot;
      lastGroup = -1; if (!visible) frame(performance.now());
    }));
    // estilos, palabras y posiciones
    function radio(group, btn) { $$('.pill', group).forEach((p) => { const on = p === btn; p.classList.toggle('on', on); p.setAttribute('aria-checked', String(on)); }); }
    $$('#subStyles .pill').forEach((b) => b.addEventListener('click', () => { radio($('#subStyles'), b); styleK = b.dataset.st; cap.className = 'cap-drag st-' + styleK; $('#subStyleName').textContent = STY[styleK]; lastGroup = -1; }));
    $$('#subWords .pill').forEach((b) => b.addEventListener('click', () => { radio($('#subWords'), b); per = +b.dataset.w; G = groups(); lastGroup = -1; }));
    const POS = { top: [50, 20, 'Centro · arriba'], left: [30, 52, 'Izquierda · centro'], bottom: [50, 80, 'Centro · abajo'] };
    let cx = 50, cy = 80;
    function place(x, y, label) {
      const r = stage.getBoundingClientRect(), c = cap.getBoundingClientRect();
      const hw = r.width ? (c.width / 2 / r.width) * 100 : 20, hh = r.height ? (c.height / 2 / r.height) * 100 : 10;
      cx = clamp(x, hw + 2, 98 - hw); cy = clamp(y, hh + 3, 97 - hh);
      cap.style.left = cx + '%'; cap.style.top = cy + '%';
      posTx.textContent = label || (cx < 40 ? 'Izquierda' : cx > 60 ? 'Derecha' : 'Centro') + ' · ' + (cy < 40 ? 'arriba' : cy > 62 ? 'abajo' : 'centro');
    }
    $$('#subPos .pill').forEach((b) => b.addEventListener('click', () => { radio($('#subPos'), b); const p = POS[b.dataset.p]; place(p[0], p[1], p[2]); stage.classList.add('touched'); }));
    $('#subPosBtn').addEventListener('click', () => { const b = $('#subPos .pill[data-p="bottom"]'); radio($('#subPos'), b); place(50, 80, POS.bottom[2]); });
    let drag = false, ox = 0, oy = 0;
    const pct = (e) => { const r = stage.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100]; };
    cap.addEventListener('pointerdown', (e) => { drag = true; stage.classList.add('dragging', 'touched'); cap.setPointerCapture(e.pointerId); const p = pct(e); ox = p[0] - cx; oy = p[1] - cy; $$('#subPos .pill').forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); }); e.preventDefault(); });
    cap.addEventListener('pointermove', (e) => { if (!drag) return; const p = pct(e); place(p[0] - ox, p[1] - oy); });
    const end = () => { drag = false; stage.classList.remove('dragging'); };
    cap.addEventListener('pointerup', end); cap.addEventListener('pointercancel', end);
    cap.addEventListener('keydown', (e) => { const m = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key]; if (m) { e.preventDefault(); stage.classList.add('touched'); place(cx + m[0], cy + m[1]); } });
    setPlaying(!REDUCE); renderGroup(0, 0);
  })();

  /* ============================================================
     9 · EMOJIS 3D: reproductor, ajustes y muestra
     ============================================================ */
  (function emojiPlayer() {
    const root = $('#emoPlayer'); if (!root || !E) return;
    const capEl = $('#emoCap'), slot = $('#emoSlot'), timeEl = $('#emoTime'), nowEl = $('#emoNow'), ppBtn = $('.pp', root);
    const wave = makeWave($('#emoWave'), 110, 23);
    // lv: 1 = emoción muy clara · 2 = normal · 3 = más · 4 = cada frase
    const SCRIPT = [
      { t: 'Me muero de risa con esto', h: 'risa', e: 'risa', c: 'face', lv: 1 },
      { t: 'Qué frío hace aquí arriba', h: 'frío', e: 'frio', c: 'face', lv: 1 },
      { t: 'Este vídeo está que arde', h: 'arde', e: 'fuego', c: 'obj', lv: 1 },
      { t: 'Nos vamos de viaje a Madrid', h: 'madrid', e: 'mapa', c: 'map', lv: 1, data: { city: 'MADRID', country: 'España', flag: 'es' } },
      { t: 'Me encanta este sitio', h: 'encanta', e: 'amor', c: 'face', lv: 2 },
      { t: 'Hoy hay un 50% de descuento', h: '50%', e: 'numero', c: 'num', lv: 1, data: { num: '50%', word: 'DESCUENTO' } },
      { t: 'Qué miedo da esta casa', h: 'miedo', e: 'miedo', c: 'face', lv: 1 },
      { t: 'Ganamos mucho dinero', h: 'dinero', e: 'dinero', c: 'face', lv: 1 },
      { t: 'Tengo un hambre que no veas', h: 'hambre', e: 'hambre', c: 'face', lv: 2 },
      { t: 'Y luego una pizza enorme', h: 'pizza', e: 'pizza', c: 'obj', lv: 2 },
      { t: '¡No me lo puedo creer!', h: 'creer', e: 'sorpresa', c: 'face', lv: 2 },
      { t: 'Cuidado, peligro en la carretera', h: 'peligro', e: 'peligro', c: 'obj', lv: 2 },
      { t: 'Esto me tiene muy enfadado', h: 'enfadado', e: 'enfado', c: 'face', lv: 2 },
      { t: 'Qué vergüenza he pasado', h: 'vergüenza', e: 'verguenza', c: 'face', lv: 3 },
      { t: 'Ese tío es un diablo', h: 'diablo', e: 'diablo', c: 'face', lv: 3 },
      { t: 'Qué asco de comida', h: 'asco', e: 'asco', c: 'face', lv: 2 },
      { t: 'Esto me pone muy triste', h: 'triste', e: 'llorar', c: 'face', lv: 3 },
      { t: 'Y no olvides suscribirte', h: 'suscribirte', e: 'suscribir', c: 'num', lv: 1 },
      { t: 'Nos vemos en el próximo vídeo', h: null, e: 'charla', c: 'face', lv: 4 },
    ];
    const HINT = {
      1: 'Solo cuando se dice una palabra con una emoción muy clara.',
      2: 'Cuando se dice una palabra con emoción y en los momentos clave.',
      3: 'Más caras y objetos a lo largo de todo el vídeo.',
      4: 'Un emoji en cada frase, aunque no haya una palabra clave.',
    };
    const st = { on: true, amount: 2, cats: { obj: true, map: true, num: true } };
    const allowed = (s) => st.on && s.lv <= st.amount && (s.c === 'face' || st.cats[s.c]);
    // duración aproximada de cada frase para la onda y el tiempo
    const WORD = 330, TAIL = 1500;
    const durs = SCRIPT.map((s) => s.t.split(' ').length * WORD + TAIL);
    const TOTAL = durs.reduce((a, b) => a + b, 0);
    const starts = durs.reduce((acc, x, i) => { acc.push(i ? acc[i - 1] + durs[i - 1] : 0); return acc; }, []);
    const markWave = () => wave.marks(SCRIPT.map((s, i) => allowed(s) ? (starts[i] + durs[i] * .45) / TOTAL : -1).filter((p) => p >= 0));
    markWave();
    let idx = 0, gen = 0, visible = false, playing = !REDUCE, running = false, tStart = 0, tPaused = 0, pausedAt = 0, current = null;
    const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¡!¿?.,]/g, '').toLowerCase();
    function setPlaying(v) {
      playing = v; ppBtn.innerHTML = `<span class="ms">${v ? 'pause' : 'play_arrow'}</span>`; ppBtn.setAttribute('aria-label', v ? 'Pausar' : 'Reproducir');
      if (!v) pausedAt = performance.now(); else if (pausedAt) { tPaused += performance.now() - pausedAt; pausedAt = 0; }
      if (v && visible && !running) loop();
    }
    const waitPlay = async (my) => { while (!playing && my === gen) await sleep(120); };
    async function wait(ms, my) { const end = performance.now() + ms; while (performance.now() < end) { if (my !== gen) return; await sleep(Math.min(80, end - performance.now())); if (!playing) { const left = end - performance.now(); await waitPlay(my); return wait(left, my); } } }
    function clearStage() { capEl.innerHTML = ''; if (current && current.stop) current.stop(); slot.innerHTML = ''; }
    async function phrase(i, my) {
      const s = SCRIPT[i], words = s.t.split(' ');
      const per = 3, chunks = [];
      for (let k = 0; k < words.length; k += per) chunks.push(words.slice(k, k + per));
      tStart = performance.now() - starts[i]; tPaused = 0;
      let fired = null;
      for (const ch of chunks) {
        if (my !== gen) return;
        const hasHot = s.h && ch.some((w) => norm(w) === norm(s.h));
        capEl.innerHTML = '<span class="ln"></span>';
        const ln = $('.ln', capEl);
        for (const w of ch) {
          if (my !== gen) return;
          const isHot = s.h && norm(w) === norm(s.h);
          const sp = d.createElement('span'); sp.className = 'w new' + (isHot ? ' hot' : ''); sp.textContent = w.toUpperCase();
          if (ln.childNodes.length) ln.appendChild(d.createTextNode(' '));
          ln.appendChild(sp);
          if (isHot && allowed(s) && !fired) {
            nowEl.textContent = E.name(s.e);
            fired = E.play(slot, s.e, { hold: 1500, data: s.data, onStart: (h) => { current = h; } });
          }
          await wait(WORD, my);
        }
        if (!hasHot || ch === chunks[chunks.length - 1]) await wait(240, my);
      }
      if (!s.h && allowed(s) && !fired) { nowEl.textContent = E.name(s.e); fired = E.play(slot, s.e, { hold: 1300, onStart: (h) => { current = h; } }); }
      if (fired) { await Promise.race([fired, sleep(3200)]); }
      else await wait(700, my);
      await wait(200, my);
    }
    async function loop() {
      if (running) return; running = true; const my = gen;
      while (visible && my === gen) {
        if (!playing) { await waitPlay(my); continue; }
        const i = idx;
        // salta frases sin emoji permitido cuando la cantidad es baja, para que la demo no se haga larga
        if (!allowed(SCRIPT[i]) && st.amount < 4 && SCRIPT[i].lv === 4) { idx = (idx + 1) % SCRIPT.length; continue; }
        await phrase(i, my);
        if (my !== gen) break;
        idx = (idx + 1) % SCRIPT.length;
      }
      running = false;
    }
    function restart(newIdx) { gen++; running = false; clearStage(); if (newIdx != null) idx = (newIdx + SCRIPT.length) % SCRIPT.length; if (visible && playing) loop(); }
    // tiempo y onda
    let raf = 0;
    function tick() {
      const now = pausedAt || performance.now();
      const t = clamp(now - tStart - tPaused, 0, TOTAL);
      wave.set(t / TOTAL); timeEl.textContent = fmt(t / 1000) + ' / ' + fmt(TOTAL / 1000);
      if (visible) raf = requestAnimationFrame(tick);
    }
    watch(root, (on) => {
      visible = on;
      if (on) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); if (playing && !running) { gen++; loop(); } }
      else { cancelAnimationFrame(raf); gen++; running = false; clearStage(); }
    });
    $$('.pl-tr button', root).forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'play') { setPlaying(!playing); return; }
      if (a === 'start') restart(0);
      if (a === 'back') restart(idx - 1);
      if (a === 'next') restart(idx + 1);
    }));
    setPlaying(playing);
    if (REDUCE) { capEl.innerHTML = '<span class="ln"><span class="w">ME MUERO DE</span></span><span class="ln"><span class="w hot">RISA</span></span>'; slot.innerHTML = `<div class="emo emo-risa on">${E.svg('risa', { final: true })}</div>`; }

    // Ajustes
    const hint = $('#esHint');
    $$('#esAmount button').forEach((b) => b.addEventListener('click', () => {
      $$('#esAmount button').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); });
      st.amount = +b.dataset.a; hint.textContent = HINT[st.amount]; markWave();
    }));
    $$('.es-row input[data-cat]').forEach((inp) => inp.addEventListener('change', () => { st.cats[inp.dataset.cat] = inp.checked; markWave(); }));
    $('#esOn').addEventListener('change', (e) => { st.on = e.target.checked; nowEl.textContent = st.on ? 'Emojis activos' : 'Emojis desactivados'; markWave(); if (!st.on) { if (current && current.stop) current.stop(); slot.innerHTML = ''; } });
    hint.textContent = HINT[st.amount];

    // Muestra: toca una cara u objeto para verla
    const FACES = ['amor', 'risa', 'miedo', 'sorpresa', 'diablo', 'hambre', 'verguenza', 'enfado', 'dinero', 'frio', 'asco', 'llorar'];
    const OBJS = [['fuego', 'Fuego'], ['saco', 'Dinero'], ['pizza', 'Comida'], ['peligro', 'Peligro'], ['mapa', 'Mapa y bandera', { city: 'MADRID', country: 'España', flag: 'es' }], ['numero', 'Número 3D', { num: '50%', word: 'DESCUENTO' }], ['suscribir', 'Botón suscribirse']];
    const mf = $('#muFaces'), mo = $('#muObjs');
    mf.innerHTML = FACES.map((k) => `<button type="button" class="mu-it" data-k="${k}"><span class="mu-box"><span class="prev">${E.svg(k)}</span></span>${E.name(k)}</button>`).join('');
    mo.innerHTML = OBJS.map((o) => `<button type="button" class="mu-it" data-k="${o[0]}"><span class="mu-box"><span class="prev${['mapa', 'numero', 'suscribir'].includes(o[0]) ? ' wide' : ''}">${E.svg(o[0], o[2])}</span></span>${o[1]}</button>`).join('');
    const DATA = Object.fromEntries(OBJS.map((o) => [o[0], o[2]]));
    $$('.mu-it').forEach((b) => b.addEventListener('click', async () => {
      if (b.classList.contains('playing')) return;
      b.classList.add('playing');
      await E.play($('.mu-box', b), b.dataset.k, { hold: 1500, data: DATA[b.dataset.k] });
      b.classList.remove('playing');
    }));
    $$('.mu-objs .prev .emo, .mu-objs .obj-mapa').forEach((m) => m.classList.add('drop'));
  })();

  /* ============================================================
     10 · LISTAS Y CANALES: selección y calidad por vídeo
     ============================================================ */
  (function bulk() {
    const box = $('#bkRows'); if (!box) return;
    const rows = Array.from(box.children), segs = $$('.bk-s'), cnt = $('#bkCount');
    const Q = ['4K', '2K', '1080p', '720p', '360p'];
    let timer = null, i = 0, touched = false;
    const count = () => { cnt.textContent = rows.filter((r) => r.classList.contains('on')).length; };
    const toggle = (r) => { r.setAttribute('aria-checked', String(r.classList.toggle('on'))); count(); };
    const setQ = (r, q) => { const b = $('.bk-q', r); b.textContent = q; r.dataset.q = q; };
    const stop = () => { clearInterval(timer); timer = null; };
    rows.forEach((r) => {
      r.addEventListener('click', (e) => { touched = true; stop(); if (e.target.closest('.bk-q')) { setQ(r, Q[(Q.indexOf(r.dataset.q) + 1) % Q.length]); segs.forEach((s) => s.classList.remove('on')); } else toggle(r); });
      r.addEventListener('keydown', (e) => { if (e.target === r && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); touched = true; stop(); toggle(r); } });
    });
    segs.forEach((s) => s.addEventListener('click', () => { touched = true; stop(); segs.forEach((x) => x.classList.toggle('on', x === s)); rows.forEach((r) => setQ(r, s.dataset.q)); }));
    if (!REDUCE) watch($('.bk-demo'), (on) => { stop(); if (on && !touched) timer = setInterval(() => { const r = rows[i % rows.length]; toggle(r); setQ(r, Q[(i * 2 + 1) % Q.length]); i++; }, 1900); });
  })();

  /* ============================================================
     11 · Contadores y barra del motor
     ============================================================ */
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (REDUCE) return;
    let done = false;
    watch(el, (on) => {
      if (!on || done) return; done = true;
      const t0 = performance.now(), D = 1400;
      (function f(now) { const p = Math.min((now - t0) / D, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3))); el.textContent = pre + v.toLocaleString('es-ES') + suf; if (p < 1) requestAnimationFrame(f); })(t0);
    });
  });
  (function engine() {
    const m = $('.dlm'); if (!m) return; const p = $('.dlm-pct', m); let done = false;
    watch(m, (on) => {
      if (!on || done) return; done = true;
      const to = +p.dataset.to || 78, t0 = performance.now();
      (function f(now) { const k = Math.min((now - t0) / 2400, 1), e = 1 - Math.pow(1 - k, 3); p.textContent = Math.round(to * e) + '%'; if (k < 1) requestAnimationFrame(f); })(t0);
    });
  })();

  /* ============================================================
     12 · CLONACIÓN DE VOZ: estudio en directo y biblioteca
     ============================================================ */
  (function voice() {
    const root = $('#vStudio'); if (!root) return;
    const waveEl = $('#vsWave'), label = $('#vsLabel'), time = $('#vsTime'), line = $('#vsLine'), bar = $('#vsBar'), steps = $$('.vs-steps span', root);
    const N = innerWidth < 600 ? 34 : 48;
    waveEl.innerHTML = '<i></i>'.repeat(N); const bars = $$('i', waveEl);
    let visible = false, running = false, gen = 0;
    const setPhase = (ph) => {
      root.dataset.ph = ph; const order = ['rec', 'train', 'ready'], k = order.indexOf(ph);
      steps.forEach((s, i) => { s.classList.toggle('on', i === k); s.classList.toggle('ok', i < k); });
    };
    async function run() {
      const my = ++gen; running = true; const ok = () => my === gen && visible;
      while (ok()) {
        // 1 · grabar
        setPhase('rec'); label.textContent = 'Grabando muestra'; line.textContent = 'Lee en voz alta: «Hola, esta es mi voz»';
        for (let f = 0; f <= 60 && ok(); f++) {
          bars.forEach((b, i) => { const env = .35 + .65 * Math.abs(Math.sin(f / 5 + i / 4)); b.style.setProperty('--h', Math.round(8 + Math.random() * 80 * env) + '%'); });
          time.textContent = `00:${String(Math.round(f / 2)).padStart(2, '0')} / 00:30`; bar.style.width = (f / 60 * 100) + '%';
          await sleep(95);
        }
        if (!ok()) break;
        // 2 · entrenar
        setPhase('train'); label.textContent = 'Entrenando modelo'; line.textContent = 'Analizando el timbre, el tono y el acento…'; bar.style.width = '0';
        for (let f = 0; f <= 44 && ok(); f++) {
          const pos = Math.round(f / 44 * (N - 1));
          bars.forEach((b, i) => { const dd = Math.abs(i - pos); b.classList.toggle('scan', dd < 3); b.style.setProperty('--h', (dd < 3 ? 70 - dd * 15 : 14) + '%'); });
          bar.style.width = (f / 44 * 100) + '%'; time.textContent = `${Math.round(f / 44 * 100)}%`;
          await sleep(70);
        }
        bars.forEach((b) => b.classList.remove('scan'));
        if (!ok()) break;
        // 3 · lista
        setPhase('ready'); label.textContent = 'Voz lista'; time.textContent = 'Modelo · 30 s de audio'; bar.style.width = '100%';
        line.innerHTML = '<span class="say"></span>'; const say = $('.say', line), txt = 'Bienvenidos a mi canal, hoy os enseño algo nuevo.';
        for (let c = 1; c <= txt.length && ok(); c++) {
          say.textContent = txt.slice(0, c);
          if (c % 2 === 0) bars.forEach((b, i) => { b.style.setProperty('--h', Math.round(10 + Math.random() * 60 * (.5 + .5 * Math.sin(c / 3 + i / 5))) + '%'); });
          await sleep(55);
        }
        await sleep(1800);
      }
      running = false;
    }
    if (REDUCE) { setPhase('ready'); label.textContent = 'Voz lista'; bars.forEach((b, i) => b.style.setProperty('--h', (20 + (i * 37) % 60) + '%')); return; }
    watch(root, (on) => { visible = on; if (on && !running) run(); });
    // biblioteca de voces
    let playing = null, tm = null;
    $$('#vLib .vrow').forEach((r) => r.addEventListener('click', () => {
      const was = playing === r;
      if (playing) { playing.classList.remove('playing'); $('.vplay', playing).textContent = 'play_arrow'; }
      clearTimeout(tm); playing = null;
      if (was) return;
      void r.offsetWidth; r.classList.add('playing'); $('.vplay', r).textContent = 'pause'; playing = r;
      tm = setTimeout(() => { r.classList.remove('playing'); $('.vplay', r).textContent = 'play_arrow'; playing = null; }, 3200);
    }));
  })();

  /* ============================================================
     13 · PREGUNTAS FRECUENTES: buscador
     ============================================================ */
  (function faq() {
    const q = $('#faqQ'), list = $$('#faqList details'), n = $('#faqN'), empty = $('#faqEmpty'); if (!q) return;
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const texts = list.map((dl) => norm(dl.textContent));
    q.addEventListener('input', () => {
      const terms = norm(q.value).split(/\s+/).filter(Boolean); let shown = 0;
      list.forEach((dl, i) => { const ok = terms.every((t) => texts[i].includes(t)); dl.hidden = !ok; if (ok) shown++; if (ok && terms.length) dl.open = shown === 1; });
      n.textContent = terms.length ? `${shown} de ${list.length}` : '';
      empty.hidden = shown > 0;
    });
  })();

  /* ============================================================
     14 · VENTANAS (soporte, reportes, chat, novedades) y copiar correo
     ============================================================ */
  (function modals() {
    const root = $('#modalRoot'); if (!root) return;
    const modals = $$('.modal', root); let opener = null;
    function open(name, from) {
      const m = $('.modal[data-name="' + name + '"]', root); if (!m) return;
      if (!root.classList.contains('open')) opener = from || d.activeElement;
      modals.forEach((x) => x.classList.remove('show'));
      m.classList.add('show'); root.classList.add('open'); root.setAttribute('aria-hidden', 'false');
      d.body.style.overflow = 'hidden'; m.scrollTop = 0;
      const f = m.querySelector('.modal-x, [data-close], button, a'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 30);
    }
    function close() {
      root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); d.body.style.overflow = '';
      setTimeout(() => modals.forEach((x) => x.classList.remove('show')), 300);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
    d.addEventListener('click', (e) => {
      const a = e.target.closest('[data-modal]'); if (a) { e.preventDefault(); open(a.getAttribute('data-modal'), a); return; }
      if (e.target.closest('#modalRoot [data-close]')) close();
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('open')) close(); });
  })();
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise((ok, ko) => { try { const ta = d.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '-999px'; d.body.appendChild(ta); ta.select(); d.execCommand('copy'); ta.remove(); ok(); } catch (er) { ko(er); } });
  }
  $$('[data-copy-email]').forEach((b) => {
    const lab = $('span:not(.ms)', b) || b, orig = lab.textContent;
    b.addEventListener('click', () => copyText(EMAIL).then(() => {
      b.classList.add('copied'); lab.textContent = '¡Copiado!';
      clearTimeout(b._t); b._t = setTimeout(() => { b.classList.remove('copied'); lab.textContent = orig; }, 1900);
    }).catch(() => { lab.textContent = EMAIL; }));
  });

  /* ============================================================
     14b · APARICIONES AL BAJAR: títulos palabra a palabra y bloques
     ============================================================ */
  (function reveal() {
    if (REDUCE) return;
    $$('.sh h2, .split-copy h2, .h2s, .cta h2').forEach((h) => {
      let n = 0; const frag = d.createDocumentFragment();
      const wrap = (node) => { const w = d.createElement('span'); w.className = 'wm'; const s2 = d.createElement('span'); s2.style.setProperty('--i', n++); s2.appendChild(node); w.appendChild(s2); return w; };
      Array.from(h.childNodes).forEach((node) => {
        if (node.nodeType === 3) node.textContent.split(/(\s+)/).forEach((part) => { if (!part) return; if (/^\s+$/.test(part)) frag.appendChild(d.createTextNode(' ')); else frag.appendChild(wrap(d.createTextNode(part))); });
        else frag.appendChild(wrap(node));
      });
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      h.innerHTML = ''; h.appendChild(frag); h.classList.add('wsplit');
    });
    const sel = '.sh p, .split-copy .lead, .split-copy .ticks, .split-copy .tags, .split-copy .steps-mini, .split-copy .note-ok, .split-copy .stats, .split-vis, .bx, .extras, .steps li, .cards3 article, .cards4 article, .bk-card, .bk-demo, .bk-grid .flist, .bk-plat, .os, .stats .stat, .gal, .subs .flist li, .example, .player, .es-card, .mu, .emo-facts li, .emo-note, .warn, .vrow, .clog li, .sup-l, .status, .faq-search, .faq details, .cta-btns, .cta-feats';
    const els = $$(sel).filter((el) => !el.closest('.hero'));
    const groups = new Map();
    els.forEach((el) => { const k = el.parentElement; const i = groups.get(k) || 0; groups.set(k, i + 1); el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms'); el.classList.add('rv'); });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; e.target.classList.add(e.target.classList.contains('wsplit') ? 'split-in' : 'in'); io.unobserve(e.target); }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
    $$('.wsplit').forEach((h) => io.observe(h));
  })();

  /* ============================================================
     15 · BARRA DE DESCARGA FIJA EN MÓVIL
     ============================================================ */
  (function mbar() {
    const bar = $('#mbar'), hero = $('#heroDl'), cta = $('#ctaDl'); if (!bar || !hero) return;
    let heroVis = true, ctaVis = false;
    const upd = () => { const show = !heroVis && !ctaVis; bar.classList.toggle('show', show); bar.setAttribute('aria-hidden', String(!show)); $('button', bar).tabIndex = show ? 0 : -1; };
    new IntersectionObserver((es) => es.forEach((e) => { if (e.target === hero) heroVis = e.isIntersecting; else ctaVis = e.isIntersecting; upd(); })).observe(hero);
    if (cta) new IntersectionObserver((es) => es.forEach((e) => { ctaVis = e.isIntersecting; upd(); })).observe(cta);
  })();
})();
