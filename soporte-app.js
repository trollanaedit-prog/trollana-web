/* =====================================================================
   soporte-app.js · El chat de soporte dentro de la app (Android y Windows)
   ---------------------------------------------------------------------
   La app abre soporte-app.html?app=android&v=1.0.11 (o app=windows).
   Es exactamente el mismo chat de la web, con el mismo servidor y el
   mismo panel. Aquí solo se abre a pantalla completa y se indica desde
   qué app escribe la persona. No hay ningún puente con la app.
   ===================================================================== */
const p = new URLSearchParams(location.search);
const app = p.get('app');
const so = app === 'android' ? 'Android' : app === 'windows' ? 'Windows' : '';
const v = p.get('v') || '';
if (so) window.SOPORTE_DISPOSITIVO = 'App ' + so + (/^\d{1,3}(\.\d{1,3}){1,3}$/.test(v) ? ' ' + v : '');

// Abre el chat nada más cargar (el chat se abre al mostrarse su ventana)
const ventana = document.querySelector('.scx-modal');
if (ventana) ventana.classList.add('show');
