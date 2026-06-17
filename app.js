/* ============================================================
   downloaderV — lógica ULTRA (detección + animaciones premium)
   ============================================================ */

/* ====== ENLACES DE DESCARGA ====== */
const CONFIG = {
  descargaWindows: 'https://github.com/trollanaedit-prog/trollana-releases/releases/download/2.0.3/DownloaderV.2.0.3.exe',
  descargaAndroid: 'https://github.com/trollanaedit-prog/trollana-releases/releases/download/1.0.6/DownloaderV.1.0.6.apk',
};

const ICON_WIN = '<svg viewBox="0 0 24 24" fill="#1A73E8"><path d="M3 5.5 10.5 4.5v7H3zM10.5 12.5v7L3 18.5v-6zM11.8 4.3 21 3v8.5h-9.2zM21 12.5V21l-9.2-1.3v-7.2z"/></svg>';
const ICON_AND = '<svg viewBox="0 0 24 24" fill="#10B981"><path d="M12 2 9 7h6l-3-5zM6 8h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"/></svg>';

/* ====== DETECCIÓN PC vs MÓVIL (a prueba de balas) ======
   1º API moderna (Chrome/Edge): navigator.userAgentData.mobile
   2º si no, user-agent con tokens de móvil fiables.
   NO usamos tamaño de pantalla (puede fallar en PC). */
const esMovil = (() => {
  try {
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
      return navigator.userAgentData.mobile;
    }
  } catch (_) {}
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent || '');
})();

function configurarBoton(iconEl, labelEl, btnEl){
  if(!btnEl) return;
  const url = esMovil ? CONFIG.descargaAndroid : CONFIG.descargaWindows;
  if(iconEl) iconEl.innerHTML = esMovil ? ICON_AND : ICON_WIN;
  if(labelEl) labelEl.textContent = esMovil ? 'Android' : 'Windows';
  btnEl.onclick = ()=>{ if(url && url !== '#') location.href = url; };
}
configurarBoton(document.getElementById('heroDlIcon'), document.getElementById('heroDlLabel'), document.getElementById('heroDl'));
configurarBoton(document.getElementById('ctaDlIcon'),  document.getElementById('ctaDlLabel'),  document.getElementById('ctaDl'));

/* ====== Barra de progreso + textura ====== */
const prog = document.createElement('div'); prog.className = 'scroll-progress'; document.body.appendChild(prog);
const grain = document.createElement('div'); grain.className = 'grain'; document.body.appendChild(grain);

/* ====== Nav sombra + progreso al hacer scroll ====== */
const nav = document.querySelector('.nav');
function onScroll(){
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  prog.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  if(nav) nav.classList.toggle('scrolled', scrollY > 12);
}
addEventListener('scroll', onScroll, {passive:true}); onScroll();

/* ====== Aparición al hacer scroll ====== */
const io = new IntersectionObserver((es)=>{ es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:.12});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ====== Barra de descarga animada ====== */
const ioBar = new IntersectionObserver((es)=>{ es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); ioBar.unobserve(e.target); } }); }, {threshold:.4});
document.querySelectorAll('.dlbar').forEach(el => ioBar.observe(el));

/* ====== Contadores ====== */
function animarContador(el){
  const fin = parseFloat(el.dataset.count);
  const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
  const dur = 1500, t0 = performance.now();
  (function tick(now){
    const p = Math.min((now - t0)/dur, 1);
    const v = Math.round(fin * (1 - Math.pow(1 - p, 3)));
    el.textContent = pre + v.toLocaleString('es-ES') + suf;
    if(p < 1) requestAnimationFrame(tick);
  })(performance.now());
}
const ioNum = new IntersectionObserver((es)=>{ es.forEach(e=>{ if(e.isIntersecting){ animarContador(e.target); ioNum.unobserve(e.target); } }); }, {threshold:.6});
document.querySelectorAll('[data-count]').forEach(el => ioNum.observe(el));

/* ====== Inyectar "sheen" (brillo interior) en tarjetas ====== */
document.querySelectorAll('.feat, .os, .stat, .step').forEach(card=>{
  const s = document.createElement('span'); s.className = 'sheen'; card.prepend(s);
});

/* ====== Inyectar foco de luz en secciones oscuras ====== */
document.querySelectorAll('.sec-dark').forEach(sec=>{
  const sp = document.createElement('div'); sp.className = 'spotlight'; sec.prepend(sp);
});

/* ============================================================
   EFECTOS DE CURSOR — SOLO EN PC (en móvil no se ejecutan)
   ============================================================ */
const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
if(!esMovil && finePointer){

  document.querySelectorAll('.sec-dark').forEach(sec=>{
    sec.addEventListener('mousemove', (e)=>{
      const r = sec.getBoundingClientRect();
      sec.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      sec.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, {passive:true});
  });

  document.querySelectorAll('.feat, .os, .stat').forEach(card=>{
    card.classList.add('tilt');
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (px*100) + '%');
      card.style.setProperty('--my', (py*100) + '%');
      const rx = (py - .5) * -6, ry = (px - .5) * 6;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px)`;
    }, {passive:true});
    card.addEventListener('mouseleave', ()=>{ card.style.transform = ''; }, {passive:true});
  });

  document.querySelectorAll('.step').forEach(card=>{
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left)/r.width*100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top)/r.height*100) + '%');
    }, {passive:true});
  });

  /* Botones magnéticos (un pelín más de libertad, con tope) */
  const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));
  document.querySelectorAll('.dl-btn, .btn-ghost').forEach(btn=>{
    btn.classList.add('magnetic');
    btn.addEventListener('mousemove', (e)=>{
      const r = btn.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width/2);
      const my = e.clientY - (r.top + r.height/2);
      btn.style.transform = `translate(${clamp(mx*.32, 22)}px, ${clamp(my*.5, 16)}px)`;
    }, {passive:true});
    btn.addEventListener('mouseleave', ()=>{ btn.style.transform = ''; }, {passive:true});
  });
}

/* ============================================================
   FAQ — acordeón
   ============================================================ */
document.querySelectorAll('.faq-item').forEach(item=>{
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.addEventListener('click', ()=>{
    const abierto = item.classList.contains('open');
    // cerrar todos
    document.querySelectorAll('.faq-item.open').forEach(o=>{
      o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = '0px';
    });
    if(!abierto){
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

/* ============================================================
   SCROLL FLUIDO Y SEGUIDO — solo en PC (en móvil: nativo)
   ============================================================ */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!esMovil && finePointer && !reduce){
  /* CLAVE: desactivar el scroll-behavior:smooth del CSS. Si no, el
     navegador intenta animar cada scrollTo y pelea con este motor
     (eso es lo que lo dejaba bugeado). Aquí mandamos nosotros. */
  document.documentElement.style.scrollBehavior = 'auto';

  let target = window.scrollY;
  let current = window.scrollY;
  let raf = null;
  const EASE = 0.19;        // más alto = más rápido y directo (antes 0.13)
  const SPEED = 1.5;        // multiplicador de la rueda (va más rápido)
  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  function loop(){
    const diff = target - current;
    if(Math.abs(diff) < 0.5){
      current = target;
      window.scrollTo(0, current);
      raf = null;
      return;
    }
    current += diff * EASE;
    window.scrollTo(0, current);
    raf = requestAnimationFrame(loop);
  }
  function start(){ if(raf === null) raf = requestAnimationFrame(loop); }

  addEventListener('wheel', (e)=>{
    if(e.ctrlKey) return;             // dejar el zoom del navegador
    e.preventDefault();
    let dy = e.deltaY;
    if(e.deltaMode === 1) dy *= 32;    // deltas en líneas -> px (más rápido)
    else if(e.deltaMode === 2) dy *= window.innerHeight;
    target = Math.max(0, Math.min(target + dy * SPEED, maxScroll()));
    start();
  }, {passive:false});

  /* Enlaces internos (#) con el mismo movimiento suave */
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href');
      if(id.length < 2) return;
      const el = document.querySelector(id);
      if(!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY - 76;
      target = Math.max(0, Math.min(y, maxScroll()));
      start();
    });
  });

  /* Cuando NO estamos animando (teclado, barra de scroll, etc.) re-sincronizamos */
  addEventListener('scroll', ()=>{ if(raf === null){ target = current = window.scrollY; } }, {passive:true});
  addEventListener('resize', ()=>{ if(raf === null){ target = current = window.scrollY; } }, {passive:true});
}

/* ============================================================
   TELÉFONO ANIMADO — "vídeo" por código (Flash Download)
   Secuencia: baja la notificación → pega el enlace → descarga
   → "Descargado · guardado en la carpeta downloaderV". En bucle.
   ============================================================ */
(function(){
  const phone = document.getElementById('flashPhone');
  if(!phone) return;
  const linkEl = phone.querySelector('.plink');
  const pctEl  = phone.querySelector('.ppct');
  const LINK = 'tiktok.com/@user/video/7291';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let running = false, visible = false;

  function clearAll(){
    phone.classList.remove('s-open','s-type','s-paste','s-down','s-done','s-close');
    if(linkEl) linkEl.textContent = '';
    if(pctEl)  pctEl.textContent = '0%';
  }
  async function typeLink(){
    if(!linkEl) return;
    linkEl.textContent = '';
    for(let i = 0; i <= LINK.length; i++){
      if(!visible) return;
      linkEl.textContent = LINK.slice(0, i);
      await sleep(42);
    }
  }
  function countPct(){
    if(!pctEl) return;
    const dur = 1600, t0 = performance.now();
    function tick(now){
      const p = Math.min((now - t0) / dur, 1);
      pctEl.textContent = Math.round(p * 100) + '%';
      if(p < 1 && visible) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  async function cycle(){
    while(running && visible){
      clearAll();                                   await sleep(1100); if(!visible) break;
      phone.classList.add('s-open');                await sleep(1000); if(!visible) break;
      phone.classList.add('s-type'); await typeLink();                 if(!visible) break;
      await sleep(260);
      phone.classList.add('s-paste');               await sleep(220);
      phone.classList.remove('s-paste','s-type');
      phone.classList.add('s-down'); countPct();    await sleep(1750); if(!visible) break;
      phone.classList.add('s-done');                await sleep(2300); if(!visible) break;
      phone.classList.add('s-close');               await sleep(650);
    }
    running = false;
  }

  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    // Sin animación: dejamos el estado final visible
    phone.classList.add('s-open','s-down','s-done');
    if(linkEl) linkEl.textContent = LINK;
    if(pctEl)  pctEl.textContent = '100%';
    return;
  }
  const io = new IntersectionObserver((es)=>{
    es.forEach(e=>{
      visible = e.isIntersecting;
      if(visible && !running){ running = true; cycle(); }
    });
  }, { threshold:.35 });
  io.observe(phone);
})();

/* ============================================================
   CARRUSEL DE CHATS (soporte) — varias conversaciones
   ============================================================ */
(function(){
  const track = document.getElementById('chatTrack');
  const dotsWrap = document.getElementById('chatDots');
  if(!track || !dotsWrap) return;
  const slides = Array.from(track.querySelectorAll('.chat-slide'));
  if(!slides.length) return;
  let idx = 0, timer = null;

  slides.forEach((_, i)=>{
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Conversación ' + (i+1));
    btn.addEventListener('click', ()=>{ go(i); restart(); });
    dotsWrap.appendChild(btn);
  });
  const dots = Array.from(dotsWrap.children);

  function go(i){
    slides[idx].classList.remove('active');
    dots[idx].classList.remove('active');
    idx = (i + slides.length) % slides.length;
    slides[idx].classList.add('active');
    dots[idx].classList.add('active');
  }
  function next(){ go(idx + 1); }
  function restart(){ clearInterval(timer); timer = setInterval(next, 5500); }

  slides[0].classList.add('active');
  dots[0].classList.add('active');
  restart();

  const car = track.closest('.chat-carousel');
  car.addEventListener('mouseenter', ()=> clearInterval(timer));
  car.addEventListener('mouseleave', restart);
})();
