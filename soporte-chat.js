/* =====================================================================
   soporte-chat.js · Chat de soporte en directo de downloaderV
   ---------------------------------------------------------------------
   · Escribes y tu mensaje queda EN ESPERA hasta que el equipo responde.
   · 3 conversaciones al día por persona (lo controla el servidor por IP).
     Dentro de una conversación abierta puede escribir lo que quiera.
   · Puedes adjuntar imágenes (se comprimen en tu navegador).
   · "Finalizar" borra la conversación entera al instante. No queda nada.
   Firebase solo se carga cuando abres el chat (la web no va más lenta).
   ===================================================================== */
import { SOPORTE } from './soporte-config.js';

const CDN = 'https://www.gstatic.com/firebasejs/10.12.2/';
const LIMITE = SOPORTE.limiteDia || 3;
const MAX_TEXTO = 1000;
const MAX_IMG = 700 * 1024;
const LS_ACTIVO = 'dv_soporte_activo';
const d = document;

const root = d.getElementById('soporteChat');
const modal = root && root.closest('.modal');

/* ------------------------------ Iconos ------------------------------ */
const I = {
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  enviar: '<path d="M4.5 12h11M12 5.5l6.5 6.5-6.5 6.5"/>',
  foto: '<rect x="3.5" y="4.5" width="17" height="15" rx="3.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 15.5l-5-5-9 9"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  doble: '<path d="M2.5 12.5l4.5 4.5 9.5-9.5M12 16.5l.5.5 9.5-9.5"/>',
  borrar: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5"/>',
  candado: '<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  correo: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M4 7.5l8 6 8-6"/>',
  copiar: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  ok: '<path d="M7 12.5l3.5 3.5L17.5 9"/>',
  chat: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.2A8 8 0 1 1 20 12z"/>',
  reintentar: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4"/>',
  verificado: '<path d="M12 2.8l2.3 1.7 2.9-.1.9 2.7 2.3 1.8-.9 2.7.9 2.7-2.3 1.8-.9 2.7-2.9-.1L12 21.2l-2.3-1.7-2.9.1-.9-2.7-2.3-1.8.9-2.7-.9-2.7 2.3-1.8.9-2.7 2.9.1z" fill="currentColor" stroke="none"/><path d="M8.6 12.2l2.3 2.3 4.6-4.8" stroke="#fff"/>',
};
const ic = (k, extra = '') => `<svg class="scx-i ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;

/* ------------------------------ Estado ------------------------------ */
const S = {
  fb: null, user: null, abierto: false, vista: 'cargando',
  chat: null, chatVisto: false, mensajes: [], locales: [], urls: new Map(),
  quedan: null, reinicio: null, enCurso: false, online: false, imagen: null, enviando: false,
  subs: [], noLeidas: 0, tituloBase: d.title, finTexto: '',
};

/* ------------------------------ Arranque ------------------------------ */
function iniciar() {
  root.classList.add('scx');
  root.innerHTML = plantilla();
  enlazar();
  pintar();
  // Abrir/cerrar el modal
  if (modal) {
    new MutationObserver(() => {
      const ab = modal.classList.contains('show');
      if (ab && !S.abierto) alAbrir(); else if (!ab && S.abierto) alCerrar();
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
  // Precarga si la persona va a abrir el chat
  d.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest('[data-modal="chat"]')) precargar(); }, { passive: true });
  // Si ya tenía una conversación abierta, la recuperamos sin molestar
  try { if (localStorage.getItem(LS_ACTIVO) && SOPORTE.worker) (window.requestIdleCallback || setTimeout)(() => conectar().catch(() => {}), { timeout: 3000 }); } catch (_) {}
  d.addEventListener('visibilitychange', () => { if (!d.hidden && S.abierto) marcarLeidas(); });
}

function precargar() {
  if (S._pre || !SOPORTE.worker) return; S._pre = true;
  ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].forEach((f) => {
    const l = d.createElement('link'); l.rel = 'modulepreload'; l.href = CDN + f; l.crossOrigin = 'anonymous'; d.head.appendChild(l);
  });
}

async function alAbrir() {
  S.abierto = true; marcarLeidas(); lanzador();
  if (!SOPORTE.worker) { S.vista = 'off'; pintar(); return; }
  if (!S.fb) { S.vista = 'cargando'; pintar(); }
  try { await conectar(); } catch (e) { console.log('soporte · no conecta', e && (e.code || e.message)); S.vista = 'off'; pintar(); return; }
  if (S.vista === 'cargando') S.vista = S.chat ? 'chat' : 'inicio';
  S.bajar = true; pintar(); pedirCuota();
  setTimeout(() => { const ta = $('.scx-ta'); if (ta && !ta.disabled && matchMedia('(pointer:fine)').matches) ta.focus({ preventScroll: true }); }, 260);
}
function alCerrar() { S.abierto = false; lanzador(); }

/* ------------------------------ Firebase ------------------------------ */
let conectando = null;
function conectar() {
  if (conectando) return conectando;
  conectando = (async () => {
    const [A, U, F] = await Promise.all([import(CDN + 'firebase-app.js'), import(CDN + 'firebase-auth.js'), import(CDN + 'firebase-firestore.js')]);
    const app = A.getApps().find((a) => a.name === 'soporte') || A.initializeApp(SOPORTE.firebase, 'soporte');
    S.fb = { A, U, F, app, auth: U.getAuth(app), db: F.getFirestore(app) };
    await new Promise((ok) => { const off = U.onAuthStateChanged(S.fb.auth, (u) => { off(); ok(u); }); });
    S.user = S.fb.auth.currentUser;
    let teniaChat = false;
    try { teniaChat = !!localStorage.getItem(LS_ACTIVO); } catch (_) {}
    escucharEstado();
    if (S.user) {
      await escucharChat();
      if (!S.chat && teniaChat && S.chatServidor) {
        // La conversación se cerró (o caducó) mientras no estabas: se borra también tu identificador anónimo
        S.subs.splice(1).forEach((u) => { try { u(); } catch (_) {} });
        try { await U.deleteUser(S.fb.auth.currentUser); } catch (_) { try { await U.signOut(S.fb.auth); } catch (__) {} }
        S.user = null;
        try { localStorage.removeItem(LS_ACTIVO); } catch (_) {}
      }
    } else { try { localStorage.removeItem(LS_ACTIVO); } catch (_) {} }
  })();
  conectando.catch(() => { conectando = null; });
  return conectando;
}

function escucharEstado() {
  const { F, db } = S.fb;
  S.subs.push(F.onSnapshot(F.doc(db, 'soporte_estado', 'publico'), (s) => {
    const x = s.data();
    const visto = x && x.visto && x.visto.toMillis ? x.visto.toMillis() : 0;
    S.online = !!(x && x.online && Date.now() - visto < 4 * 60e3);
    pintarCabecera();
  }, () => {}));
}

function escucharChat() {
  const { F, db } = S.fb, uid = S.user.uid;
  return new Promise((listo) => {
    let primero = true;
    setTimeout(() => { if (primero) { primero = false; listo(); } }, 8000);
    S.subs.push(F.onSnapshot(F.doc(db, 'soporte_chats', uid), (s) => {
      if (!s.exists() && s.metadata.fromCache && primero) return;   // esperamos la respuesta del servidor
      if (!s.metadata.fromCache) S.chatServidor = true;
      if (s.exists()) {
        S.chat = s.data(); S.chatVisto = true;
        try { localStorage.setItem(LS_ACTIVO, '1'); } catch (_) {}
        if (S.vista === 'inicio' || S.vista === 'cargando') S.vista = 'chat';
      } else if (S.chatVisto && !s.metadata.fromCache && !S.finalizando) {
        // El equipo ha finalizado la conversación: se ha borrado entera
        cerrarConversacion('El equipo de soporte ha finalizado la conversación y se ha eliminado por completo: mensajes, imágenes y tu identificador anónimo.');
        return;
      } else S.chat = null;
      if (primero) { primero = false; listo(); }
      pintar();
    }, () => { if (primero) { primero = false; listo(); } }));
    S.subs.push(F.onSnapshot(F.query(F.collection(db, 'soporte_chats', uid, 'mensajes'), F.orderBy('hora')), (s) => {
      const antes = new Set(S.mensajes.map((m) => m.id));
      S.mensajes = s.docs.map((x) => ({ id: x.id, ...x.data({ serverTimestamps: 'estimate' }) }));
      const nuevas = S.mensajes.filter((m) => m.de === 'soporte' && !antes.has(m.id));
      if (antes.size && nuevas.length) avisoRespuesta(nuevas.length);
      S.locales = S.locales.filter((l) => !S.mensajes.some((m) => m.id === l.id));
      pintarMensajes();
    }, () => {}));
  });
}

async function token(forzar) { return S.user ? S.user.getIdToken(!!forzar) : null; }

async function pedirCuota() {
  try {
    const t = await token();
    const r = await fetch(SOPORTE.worker + '/cuota', { headers: t ? { Authorization: 'Bearer ' + t } : {} });
    if (!r.ok) return;
    const j = await r.json(); S.quedan = j.quedan; S.reinicio = j.reinicio; S.enCurso = !!j.enCurso; pintarCuota();
  } catch (_) {}
}

/* ------------------------------ Enviar ------------------------------ */
async function enviar() {
  if (S.enviando) return;
  const ta = $('.scx-ta');
  const texto = ta.value.trim();
  const img = S.imagen;
  if (!texto && !img) return;
  if (texto.length > MAX_TEXTO) return aviso(`Máximo ${MAX_TEXTO} caracteres por mensaje.`);
  if (bloqueado()) return pintarCuota();
  S.enviando = true; pintarComposer();
  const local = { id: 'l' + Date.now(), de: 'cliente', texto, local: 'enviando', imgUrl: img ? img.url : null, imgW: img && img.w, imgH: img && img.h, hora: new Date() };
  S.locales.push(local); S.bajar = true;
  if (S.vista !== 'chat') { S.vista = 'chat'; pintar(); }
  ta.value = ''; autoAlto(); quitarImagen(false); pintarMensajes();
  try {
    if (!S.user) {
      await conectar();
      const cred = await S.fb.U.signInAnonymously(S.fb.auth);
      S.user = cred.user; await escucharChat();
    }
    const nombreEl = $('.scx-nombre');
    const cuerpo = { texto, nombre: nombreEl ? nombreEl.value.trim().slice(0, 40) : '', dispositivo: dispositivo() };
    if (img) cuerpo.imagen = { tipo: img.tipo, w: img.w, h: img.h };
    let r = await llamar('/enviar', cuerpo);
    if (r.status === 401) r = await llamar('/enviar', cuerpo, true);
    const j = await r.json().catch(() => ({}));
    if (r.status === 429 && j.error === 'limite') { S.quedan = 0; S.enCurso = false; S.reinicio = j.reinicio; local.local = 'limite'; pintarCuota(); pintarMensajes(); return; }
    if (r.status === 429 && j.error === 'rapido') { local.local = 'error'; local.reintento = { texto, img }; aviso('Espera un segundo entre mensaje y mensaje.'); pintarMensajes(); return; }
    if (r.status === 429 && j.error === 'imagenes') { local.local = 'error'; local.reintento = { texto, img: null }; aviso('Has llegado al máximo de 10 imágenes en esta conversación. Puedes seguir escribiendo.'); pintarMensajes(); return; }
    if (r.status === 429 && j.error === 'conversacion') { local.local = 'error'; local.reintento = { texto, img }; aviso('Esta conversación ha llegado al máximo de mensajes. Finalízala y abre otra.'); pintarMensajes(); return; }
    if (!r.ok) throw new Error(j.error || 'http' + r.status);
    S.quedan = j.quedan; S.reinicio = j.reinicio; S.enCurso = true; local.id = j.id; local.local = img ? 'subiendo' : 'enviado';
    try { localStorage.setItem(LS_ACTIVO, '1'); } catch (_) {}
    pintarCuota(); pintarMensajes();
    if (img) {
      const { F, db } = S.fb;
      await F.updateDoc(F.doc(db, 'soporte_chats', S.user.uid, 'mensajes', j.id), { img: F.Bytes.fromUint8Array(new Uint8Array(await img.blob.arrayBuffer())), imgPendiente: false });
      S.urls.set(j.id, img.url);
      local.local = 'enviado'; pintarMensajes();
    }
  } catch (e) {
    console.log('soporte · envío', e && (e.code || e.message));
    local.local = 'error'; local.reintento = { texto, img }; pintarMensajes();
  } finally {
    S.enviando = false; pintarComposer();
  }
}

async function llamar(ruta, cuerpo, forzar) {
  const t = await token(forzar);
  return fetch(SOPORTE.worker + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: cuerpo ? JSON.stringify(cuerpo) : '{}' });
}

async function finalizar() {
  const b = $('.scx-si'); b.disabled = true; b.innerHTML = '<span class="scx-spin"></span>Borrando…';
  S.finalizando = true;
  try {
    if (S.user) {
      let r = await llamar('/finalizar');
      if (r.status === 401) r = await llamar('/finalizar', null, true);
      if (!r.ok) throw new Error('http' + r.status);
    }
    await cerrarConversacion('Hemos borrado tus mensajes, tus imágenes y tu identificador anónimo. No queda ninguna copia guardada.');
  } catch (e) {
    console.log('soporte · finalizar', e && (e.code || e.message));
    b.disabled = false; b.textContent = 'Reintentar';
    aviso('No se ha podido borrar. Revisa tu conexión e inténtalo de nuevo.');
  } finally { S.finalizando = false; b.disabled = false; b.textContent = 'Finalizar y borrar'; }
}

async function cerrarConversacion(texto) {
  if (S.vista === 'fin' && !S.subs.length) return;
  S.subs.forEach((u) => { try { u(); } catch (_) {} }); S.subs = [];
  S.urls.forEach((u) => URL.revokeObjectURL(u)); S.urls.clear();
  S.locales.forEach((l) => l.imgUrl && URL.revokeObjectURL(l.imgUrl));
  Object.assign(S, { chat: null, chatVisto: false, enCurso: false, mensajes: [], locales: [], noLeidas: 0, vista: 'fin', finTexto: texto });
  try { localStorage.removeItem(LS_ACTIVO); } catch (_) {}
  if (S.fb && S.fb.auth.currentUser) {
    try { await S.fb.U.deleteUser(S.fb.auth.currentUser); } catch (_) { try { await S.fb.U.signOut(S.fb.auth); } catch (__) {} }
  }
  S.user = null; d.title = S.tituloBase;
  if (S.fb) escucharEstado();
  pintar(); lanzador();
}

/* ------------------------------ Imágenes ------------------------------ */
async function elegirImagen(file) {
  if (!file) return;
  if (!/^image\//.test(file.type)) return aviso('Solo se pueden enviar imágenes.');
  if (file.size > 25 * 1024 * 1024) return aviso('La imagen es demasiado grande (máx. 25 MB).');
  try {
    const c = await comprimir(file);
    quitarImagen(false);
    S.imagen = { ...c, url: URL.createObjectURL(c.blob) };
    pintarComposer();
  } catch (_) { aviso('No se ha podido leer esa imagen. Prueba con otra o haz una captura.'); }
}

async function comprimir(file) {
  const fuente = await new Promise((ok, ko) => {
    if (window.createImageBitmap) createImageBitmap(file).then(ok, () => cargarImg(file).then(ok, ko));
    else cargarImg(file).then(ok, ko);
  });
  const W0 = fuente.width, H0 = fuente.height;
  let lado = 1600, q = 0.82, blob = null, w = W0, h = H0;
  for (let i = 0; i < 7; i++) {
    const k = Math.min(1, lado / Math.max(W0, H0)); w = Math.max(1, Math.round(W0 * k)); h = Math.max(1, Math.round(H0 * k));
    const cv = d.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(fuente, 0, 0, w, h);
    blob = await new Promise((ok) => cv.toBlob(ok, 'image/webp', q));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', q));
    if (blob && blob.size <= MAX_IMG) break;
    lado = Math.round(lado * 0.8); q = Math.max(0.6, q - 0.06);
  }
  if (!blob || blob.size > MAX_IMG) throw new Error('grande');
  return { blob, w, h, tipo: blob.type };
}
function cargarImg(file) {
  return new Promise((ok, ko) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { ok(im); setTimeout(() => URL.revokeObjectURL(u), 1000); }; im.onerror = ko; im.src = u; });
}
function quitarImagen(revocar = true) {
  if (S.imagen && revocar) URL.revokeObjectURL(S.imagen.url);
  S.imagen = null; const f = $('.scx-file'); if (f) f.value = ''; pintarComposer();
}
function urlImagen(m) {
  if (S.urls.has(m.id)) return S.urls.get(m.id);
  if (!m.img || !m.img.toUint8Array) return null;
  const u = URL.createObjectURL(new Blob([m.img.toUint8Array()], { type: m.imgTipo || 'image/jpeg' }));
  S.urls.set(m.id, u); return u;
}

/* ------------------------------ Plantilla ------------------------------ */
function plantilla() {
  const mail = SOPORTE.email;
  return `
  <div class="scx-card">
    <header class="scx-head">
      <div class="scx-brand">
        <span class="scx-ava"><img src="icono.png" alt="" width="44" height="44"><i class="scx-dot"></i></span>
        <span class="scx-id">
          <b>downloaderV <span class="scx-ver" title="Soporte oficial">${ic('verificado')}</span></b>
          <span class="scx-st"><span class="scx-st-t">Soporte oficial</span><span class="scx-st-eq"> · Equipo Trollana</span></span>
        </span>
      </div>
      <div class="scx-acts">
        <button type="button" class="scx-fin" hidden>${ic('borrar')}<span>Finalizar</span></button>
        <button type="button" class="scx-x" data-close aria-label="Cerrar el chat">${ic('x')}</button>
      </div>
    </header>
    <div class="scx-espera" hidden><span class="scx-pulse"></span><span class="scx-espera-t"></span></div>
    <div class="scx-body">
      <div class="scx-cargando"><span class="scx-spin"></span>Conectando con el soporte…</div>
      <section class="scx-intro">
        <div class="scx-hola">
          <img src="icono.png" alt="" width="64" height="64">
          <h3>¿En qué te ayudamos?</h3>
          <p>Somos el equipo de downloaderV. Cuéntanos qué te pasa: un fallo, una duda o una idea. Si puedes, adjunta una captura y lo vemos antes.</p>
        </div>
        <ul class="scx-pills">
          <li>${ic('chat')}<span><b>${LIMITE} conversaciones</b> al día</span></li>
          <li>${ic('foto')}<span>Puedes enviar <b>imágenes</b></span></li>
          <li>${ic('borrar')}<span>Se borra <b>todo</b> al finalizar</span></li>
        </ul>
        <label class="scx-campo"><span>¿Cómo te llamas? <em>(opcional)</em></span><input class="scx-nombre" type="text" maxlength="40" autocomplete="given-name" placeholder="Tu nombre"></label>
      </section>
      <div class="scx-msgs" role="log" aria-live="polite" aria-label="Conversación con el soporte"></div>
      <section class="scx-off">
        <span class="scx-off-ic">${ic('correo')}</span>
        <h3>El chat no está disponible ahora mismo</h3>
        <p>Escríbenos por correo y te respondemos lo antes posible.</p>
        <a class="scx-mail" href="mailto:${mail}?subject=${encodeURIComponent('Consulta de soporte · downloaderV')}">${ic('correo')}${mail}</a>
        <button type="button" class="scx-copia">${ic('copiar')}<span>Copiar correo</span></button>
      </section>
      <section class="scx-done">
        <span class="scx-done-ic"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="M15 27l7.5 7.5L38 19"/></svg></span>
        <h3>Conversación eliminada</h3>
        <p class="scx-done-t"></p>
        <div class="scx-done-b"><button type="button" class="scx-nueva">Nueva consulta</button><button type="button" class="scx-cerrar" data-close>Cerrar</button></div>
      </section>
    </div>
    <footer class="scx-foot">
      <div class="scx-prev" hidden><img alt=""><span>Imagen lista para enviar</span><button type="button" class="scx-prev-x" aria-label="Quitar la imagen">${ic('x')}</button></div>
      <div class="scx-comp">
        <button type="button" class="scx-adj" aria-label="Adjuntar una imagen" title="Adjuntar imagen">${ic('foto')}</button>
        <input class="scx-file" type="file" accept="image/*" hidden>
        <textarea class="scx-ta" rows="1" maxlength="${MAX_TEXTO + 50}" placeholder="Escribe tu mensaje…" aria-label="Tu mensaje"></textarea>
        <button type="button" class="scx-send" aria-label="Enviar" disabled>${ic('enviar')}</button>
      </div>
      <div class="scx-meta">
        <span class="scx-cuota"><span class="scx-dots"></span><span class="scx-cuota-t"></span></span>
        <span class="scx-len"></span>
      </div>
      <p class="scx-legal">${ic('candado')}<span>Tu IP solo se usa, cifrada, para el límite de ${LIMITE} conversaciones al día. Al finalizar se borra todo. <a href="privacidad.html#soporte" target="_blank" rel="noopener">Privacidad</a></span></p>
    </footer>
    <div class="scx-ov" hidden>
      <div class="scx-dlg" role="alertdialog" aria-modal="true" aria-labelledby="scxDlgT">
        <span class="scx-dlg-ic">${ic('borrar')}</span>
        <h3 id="scxDlgT">¿Finalizar y borrar la conversación?</h3>
        <p>Se eliminarán al instante todos los mensajes e imágenes, en tu dispositivo y en nuestro servidor. No queda copia y no se puede deshacer.</p>
        <div class="scx-dlg-b"><button type="button" class="scx-no">Cancelar</button><button type="button" class="scx-si">Finalizar y borrar</button></div>
      </div>
    </div>
    <div class="scx-lb" hidden><img alt="Imagen enviada"><button type="button" class="scx-lb-x" aria-label="Cerrar la imagen">${ic('x')}</button></div>
    <div class="scx-toast" role="status" aria-live="polite"></div>
  </div>`;
}

/* ------------------------------ Eventos ------------------------------ */
function $(s) { return root.querySelector(s); }
function enlazar() {
  const ta = $('.scx-ta');
  ta.addEventListener('input', () => { autoAlto(); pintarComposer(); });
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(pointer:fine)').matches) { e.preventDefault(); enviar(); } });
  ta.addEventListener('paste', (e) => { const f = [...(e.clipboardData ? e.clipboardData.files : [])].find((x) => /^image\//.test(x.type)); if (f) { e.preventDefault(); elegirImagen(f); } });
  $('.scx-send').addEventListener('click', enviar);
  $('.scx-adj').addEventListener('click', () => $('.scx-file').click());
  $('.scx-file').addEventListener('change', (e) => elegirImagen(e.target.files && e.target.files[0]));
  $('.scx-prev-x').addEventListener('click', () => quitarImagen());
  $('.scx-fin').addEventListener('click', () => { $('.scx-ov').hidden = false; setTimeout(() => $('.scx-no').focus(), 30); });
  $('.scx-no').addEventListener('click', () => { $('.scx-ov').hidden = true; });
  $('.scx-si').addEventListener('click', finalizar);
  $('.scx-nueva').addEventListener('click', () => { S.vista = 'inicio'; pintar(); pedirCuota(); setTimeout(() => $('.scx-ta').focus(), 50); });
  $('.scx-copia').addEventListener('click', () => copiar(SOPORTE.email).then(() => aviso('Correo copiado')));
  $('.scx-lb').addEventListener('click', () => { $('.scx-lb').hidden = true; });
  $('.scx-msgs').addEventListener('click', (e) => {
    const im = e.target.closest('.scx-img img'); if (im) { const lb = $('.scx-lb'); lb.querySelector('img').src = im.src; lb.hidden = false; lb.querySelector('button').focus(); return; }
    const re = e.target.closest('.scx-retry'); if (re) reintentar(re.dataset.id);
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('.scx-lb').hidden) { $('.scx-lb').hidden = true; e.stopPropagation(); } else if (!$('.scx-ov').hidden) { $('.scx-ov').hidden = true; e.stopPropagation(); } } }, true);
}

function reintentar(id) {
  const l = S.locales.find((x) => x.id === id); if (!l || !l.reintento) return;
  S.locales = S.locales.filter((x) => x !== l);
  const ta = $('.scx-ta'); ta.value = l.reintento.texto || '';
  if (l.reintento.img) { S.imagen = l.reintento.img; }
  pintarMensajes(); pintarComposer(); enviar();
}

/* ------------------------------ Pintar ------------------------------ */
function pintar() {
  root.dataset.vista = S.vista;
  const conChat = S.vista === 'chat';
  $('.scx-fin').hidden = !(conChat && (S.chat || S.mensajes.length));
  $('.scx-ov').hidden = true;
  if (S.vista === 'fin') textoFin();
  $('.scx-nueva').hidden = S.quedan === 0;
  pintarCabecera(); pintarMensajes(); pintarComposer(); pintarCuota();
}

function pintarCabecera() {
  const st = $('.scx-st-t'), dot = $('.scx-dot');
  dot.classList.toggle('on', S.online);
  st.textContent = S.online ? 'En línea ahora' : 'Soporte oficial';
  pintarEspera();
}

function pintarEspera() {
  const el = $('.scx-espera');
  const ultimo = [...S.mensajes].reverse()[0];
  const enEspera = S.vista === 'chat' && S.chat && S.chat.estado === 'espera' && ultimo && ultimo.de === 'cliente';
  el.hidden = !enEspera;
  if (!enEspera) { clearInterval(S._tEspera); S._tEspera = null; return; }
  const pinta = () => {
    const ms = ultimo.hora && ultimo.hora.toMillis ? Date.now() - ultimo.hora.toMillis() : 0;
    const min = Math.max(0, Math.floor(ms / 60e3));
    const t = min < 1 ? 'hace un momento' : min < 60 ? `hace ${min} min` : `hace ${Math.floor(min / 60)} h`;
    $('.scx-espera-t').innerHTML = `<b>En espera</b> · ${S.online ? 'el equipo está conectado' : 'te responderemos aquí mismo'} <em>(${t})</em>`;
  };
  pinta(); if (!S._tEspera) S._tEspera = setInterval(pinta, 30e3);
}

function pintarMensajes() {
  const box = $('.scx-msgs');
  if (!box) return;
  const abajo = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  const todos = [...S.mensajes, ...S.locales.filter((l) => !S.mensajes.some((m) => m.id === l.id))];
  const visto = S.chat && S.chat.vistoSoporte && S.chat.vistoSoporte.toMillis ? S.chat.vistoSoporte.toMillis() : 0;
  let html = '', dia = '';
  const ultCliente = [...todos].reverse().find((m) => m.de === 'cliente');
  for (const m of todos) {
    const f = fecha(m.hora), kd = f.toDateString();
    if (kd !== dia) { dia = kd; html += `<div class="scx-dia"><span>${etiquetaDia(f)}</span></div>`; }
    const yo = m.de === 'cliente';
    const ms = f.getTime();
    let estado = '';
    if (yo) {
      if (m.local === 'enviando') estado = `<span class="scx-est">${ic('reloj')}Enviando</span>`;
      else if (m.local === 'subiendo') estado = `<span class="scx-est">${ic('reloj')}Subiendo imagen</span>`;
      else if (m.local === 'error') estado = `<button type="button" class="scx-retry" data-id="${m.id}">${ic('reintentar')}No se envió · Reintentar</button>`;
      else if (m.local === 'limite') estado = `<span class="scx-est err">Ya has usado tus ${LIMITE} conversaciones de hoy</span>`;
      else if (visto && visto >= ms) estado = `<span class="scx-est visto">${ic('doble')}${m === ultCliente ? 'Visto' : ''}</span>`;
      else estado = `<span class="scx-est">${ic('check')}${m === ultCliente ? 'Enviado' : ''}</span>`;
    }
    let img = '';
    const url = m.imgUrl || (m.img ? urlImagen(m) : null);
    if (url) img = `<span class="scx-img" style="aspect-ratio:${m.imgW || 4}/${m.imgH || 3}"><img src="${url}" alt="Imagen" loading="lazy"></span>`;
    else if (m.imgPendiente || m.local === 'subiendo') img = `<span class="scx-img cargando" style="aspect-ratio:${m.imgW || 4}/${m.imgH || 3}"><span class="scx-spin"></span></span>`;
    html += `<div class="scx-m ${yo ? 'yo' : 'el'}">${yo ? '' : '<img class="scx-m-ava" src="icono.png" alt="" width="28" height="28">'}<div class="scx-b">${img}${m.texto ? `<p>${enlaces(m.texto)}</p>` : ''}<span class="scx-h">${hora(f)}${estado}</span></div></div>`;
  }
  const escribe = !!(S.chat && S.chat.escribiendo && S.chat.escribiendoHora && S.chat.escribiendoHora.toMillis && Date.now() - S.chat.escribiendoHora.toMillis() < 12e3);
  if (escribe) {
    html += '<div class="scx-m el"><img class="scx-m-ava" src="icono.png" alt="" width="28" height="28"><div class="scx-b scx-typing" aria-label="El equipo está escribiendo"><i></i><i></i><i></i></div></div>';
  }
  box.innerHTML = html;
  if (abajo || S.bajar) { box.scrollTop = box.scrollHeight; S.bajar = false; }
  if (escribe) { clearTimeout(S._tEscribe); S._tEscribe = setTimeout(pintarMensajes, 12500); }
  $('.scx-fin').hidden = !(S.vista === 'chat' && (S.chat || S.mensajes.length));
  pintarEspera();
}

function pintarComposer() {
  const ta = $('.scx-ta'), send = $('.scx-send'), prev = $('.scx-prev'), len = $('.scx-len');
  const sinCuota = bloqueado();
  ta.disabled = sinCuota;
  $('.scx-adj').disabled = sinCuota || S.enviando;
  ta.placeholder = sinCuota ? `Has usado tus ${LIMITE} conversaciones de hoy` : (S.vista === 'chat' ? 'Escribe tu mensaje…' : 'Cuéntanos qué te pasa…');
  const n = ta.value.length;
  send.disabled = S.enviando || sinCuota || n > MAX_TEXTO || (!ta.value.trim() && !S.imagen);
  len.textContent = n > MAX_TEXTO * 0.8 ? `${n} / ${MAX_TEXTO}` : '';
  len.classList.toggle('mal', n > MAX_TEXTO);
  prev.hidden = !S.imagen;
  if (S.imagen) prev.querySelector('img').src = S.imagen.url;
  send.classList.toggle('cargando', S.enviando);
}

function enCurso() { return !!(S.chat || S.enCurso); }
function textoFin() {
  $('.scx-done-t').textContent = S.finTexto + (S.quedan === 0 ? ` Ya has usado tus ${LIMITE} conversaciones de hoy: podrás abrir otra ${S.reinicio ? 'mañana a partir de las ' + new Date(S.reinicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'mañana'}.` : '');
}
function bloqueado() { return S.quedan === 0 && !enCurso(); }

function pintarCuota() {
  const t = $('.scx-cuota-t'), dots = $('.scx-dots');
  if (S.quedan == null) { t.textContent = enCurso() ? 'Conversación en curso' : `${LIMITE} conversaciones al día`; dots.innerHTML = ''; pintarComposer(); return; }
  dots.innerHTML = Array.from({ length: LIMITE }, (_, i) => `<i class="${i < LIMITE - S.quedan ? 'usado' : ''}"></i>`).join('');
  if (enCurso()) t.textContent = 'Conversación en curso · escribe lo que necesites';
  else if (S.quedan > 0) t.textContent = S.quedan === 1 ? 'Te queda 1 conversación hoy' : `Te quedan ${S.quedan} conversaciones hoy`;
  else t.textContent = 'Sin conversaciones nuevas hasta ' + (S.reinicio ? 'mañana a las ' + new Date(S.reinicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'mañana');
  root.classList.toggle('scx-agotado', bloqueado());
  if (S.vista === 'fin') textoFin();
  $('.scx-nueva').hidden = S.quedan === 0;
  pintarComposer();
}

/* ------------------------------ Avisos ------------------------------ */
function avisoRespuesta(n) {
  if (S.abierto && !d.hidden) { sonido(); return; }
  S.noLeidas += n; sonido();
  d.title = `(${S.noLeidas}) Nueva respuesta · ${S.tituloBase}`;
  lanzador(true);
}
function marcarLeidas() { S.noLeidas = 0; d.title = S.tituloBase; lanzador(); }

let lz = null;
function lanzador(destacar) {
  const activo = !!(S.chat || S.mensajes.length) && S.vista !== 'fin';
  if (!activo || S.abierto) { if (lz) lz.classList.remove('on'); return; }
  if (!lz) {
    lz = d.createElement('button'); lz.type = 'button'; lz.className = 'scx-lz'; lz.setAttribute('data-modal', 'chat');
    lz.innerHTML = `<img src="icono.png" alt="" width="40" height="40"><span><b>Soporte</b><em></em></span><i class="scx-lz-n"></i>`;
    d.body.appendChild(lz);
  }
  const espera = S.chat && S.chat.estado === 'espera';
  lz.querySelector('em').textContent = S.noLeidas ? 'Tienes una respuesta nueva' : espera ? 'En espera de respuesta' : 'Conversación abierta';
  lz.querySelector('.scx-lz-n').textContent = S.noLeidas || '';
  lz.classList.toggle('nuevo', !!S.noLeidas);
  requestAnimationFrame(() => lz.classList.add('on'));
  if (destacar) { lz.classList.remove('bote'); void lz.offsetWidth; lz.classList.add('bote'); }
}

let ctxAudio = null;
function sonido() {
  try {
    ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
    const t = ctxAudio.currentTime;
    [[880, 0], [1320, 0.11]].forEach(([f, dt]) => {
      const o = ctxAudio.createOscillator(), g = ctxAudio.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + dt);
      g.gain.exponentialRampToValueAtTime(0.12, t + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.25);
      o.connect(g).connect(ctxAudio.destination); o.start(t + dt); o.stop(t + dt + 0.3);
    });
  } catch (_) {}
}

function aviso(t) {
  const el = $('.scx-toast'); el.textContent = t; el.classList.add('on');
  clearTimeout(S._tAviso); S._tAviso = setTimeout(() => el.classList.remove('on'), 3200);
}

/* ------------------------------ Utilidades ------------------------------ */
function autoAlto() { const ta = $('.scx-ta'); ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 132) + 'px'; }
function fecha(h) { return h && h.toDate ? h.toDate() : h instanceof Date ? h : new Date(); }
function hora(f) { return f.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
function etiquetaDia(f) {
  const hoyD = new Date(); const ayer = new Date(Date.now() - 864e5);
  if (f.toDateString() === hoyD.toDateString()) return 'Hoy';
  if (f.toDateString() === ayer.toDateString()) return 'Ayer';
  return f.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
function esc(t) { return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function enlaces(t) {
  return esc(t).replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, (u) => `<a href="${u}" target="_blank" rel="noopener nofollow">${u}</a>`).replace(/\n/g, '<br>');
}
function dispositivo() {
  const ua = navigator.userAgent;
  const so = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iPhone/iPad' : /Windows/i.test(ua) ? 'Windows' : /Mac OS X/i.test(ua) ? 'Mac' : /Linux/i.test(ua) ? 'Linux' : 'Otro';
  const nav = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
  return so + ' · ' + nav;
}
function copiar(t) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
  return new Promise((ok) => { const x = d.createElement('textarea'); x.value = t; x.style.position = 'fixed'; x.style.top = '-999px'; d.body.appendChild(x); x.select(); try { d.execCommand('copy'); } catch (_) {} x.remove(); ok(); });
}

if (root) iniciar();
