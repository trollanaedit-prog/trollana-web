/* ============================================================
   downloaderV — lógica de la página
   ============================================================ */

/* ====== ENLACES DE DESCARGA (ya configurados) ====== */
const CONFIG = {
  descargaWindows: 'https://github.com/trollanaedit-prog/trollana-releases/releases/download/2.0.3/DownloaderV.2.0.3.exe',
  descargaAndroid: 'https://github.com/trollanaedit-prog/trollana-releases/releases/download/1.0.6/DownloaderV.1.0.6.apk',
};

const ICON_WIN = '<svg viewBox="0 0 24 24" fill="#1A73E8"><path d="M3 5.5 10.5 4.5v7H3zM10.5 12.5v7L3 18.5v-6zM11.8 4.3 21 3v8.5h-9.2zM21 12.5V21l-9.2-1.3v-7.2z"/></svg>';
const ICON_AND = '<svg viewBox="0 0 24 24" fill="#10B981"><path d="M12 2 9 7h6l-3-5zM6 8h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"/></svg>';

const esMovil = /mobi|android|iphone|ipad|ipod/i.test(navigator.userAgent) || screen.width < 700;

function configurarBoton(iconEl, labelEl, btnEl){
  if(!btnEl) return;
  const url = esMovil ? CONFIG.descargaAndroid : CONFIG.descargaWindows;
  if(iconEl) iconEl.innerHTML = esMovil ? ICON_AND : ICON_WIN;
  if(labelEl) labelEl.textContent = esMovil ? 'Android' : 'Windows';
  btnEl.onclick = ()=>{ if(url && url !== '#') location.href = url; };
}
configurarBoton(document.getElementById('heroDlIcon'), document.getElementById('heroDlLabel'), document.getElementById('heroDl'));
configurarBoton(document.getElementById('ctaDlIcon'),  document.getElementById('ctaDlLabel'),  document.getElementById('ctaDl'));

/* ====== Animaciones de aparición al hacer scroll ====== */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ====== Barra de descarga animada (se rellena al verse) ====== */
const ioBar = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      ioBar.unobserve(e.target);
    }
  });
}, { threshold: .4 });
document.querySelectorAll('.dlbar').forEach(el => ioBar.observe(el));
