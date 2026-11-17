/* =====================================================================
   downloaderV Soporte · Panel del equipo (app instalable)
   · Bandeja en tiempo real: cada mensaje llega al instante.
   · Sonido, aviso del sistema y aviso push aunque el panel esté cerrado.
   · Respuestas rápidas, imágenes, "escribiendo…", visto.
   · Finalizar = se borra todo al instante para los dos.
   ===================================================================== */
import { SOPORTE } from '../soporte-config.js';

const CDN = 'https://www.gstatic.com/firebasejs/10.12.2/';
const [A, U, F] = await Promise.all([import(CDN + 'firebase-app.js'), import(CDN + 'firebase-auth.js'), import(CDN + 'firebase-firestore.js')]);
const app = A.getApps().find((a) => a.name === 'panel') || A.initializeApp(SOPORTE.firebase, 'panel');
const auth = U.getAuth(app);
const db = F.getFirestore(app);

const $ = (s) => document.querySelector(s);
const pn = $('#pn');
const LIMITE = SOPORTE.limiteDia || 3;
const DIAS_CHAT = 7;
const RAPIDAS = [
  ['👋 Saludo', '¡Hola! 👋 Soy del equipo de downloaderV. Cuéntame qué te pasa y lo miramos ahora mismo.'],
  ['Versión', '¿Qué versión de la app tienes y en qué dispositivo la usas (Windows o Android)?'],
  ['Captura', '¿Me puedes enviar una captura del error? Así lo vemos mucho antes.'],
  ['Enlace', '¿Me pasas el enlace del vídeo que no se descarga?'],
  ['Actualizar', 'Prueba a actualizar a la última versión desde https://downloaderv.com y dime si se soluciona.'],
  ['Resuelto', '¡Genial, solucionado! 🙌 Si necesitas algo más, aquí estamos. Cuando quieras, pulsa «Finalizar» y la conversación se borra por completo.'],
];
const ls = (k, v) => { try { return localStorage.getItem(k) ?? v; } catch (_) { return v; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

const P = {
  user: null, chats: new Map(), sel: null, msgs: [], unsubMsgs: null, unsubChats: null,
  filtro: 'espera', busca: '', sonido: ls('pn_sonido', '1') === '1', disponible: ls('pn_disponible', '1') === '1',
  inicial: true, imagen: null, urls: new Map(), escribiendo: false, escribiendoT: 0, enviando: false,
  reg: null, avisos: 'default', tLatido: null, hashHecho: false, instalar: null,
};

/* ------------------------------ Vistas ------------------------------ */
function vista(v) { pn.dataset.vista = v; }

U.onAuthStateChanged(auth, (u) => {
  if (!u) { parar(); vista('login'); return; }
  if (!esAdmin(u)) { parar(); $('#pnDenegadoT').textContent = `Has entrado como ${u.email || 'una cuenta sin correo'}. Usa la cuenta de soporte de downloaderV.`; vista('denegado'); return; }
  if (P.user && P.user.uid === u.uid) return;
  P.user = u; vista('app'); arrancar();
});

function esAdmin(u) {
  return !!u && u.email === SOPORTE.adminEmail && u.emailVerified && (u.providerData || []).some((p) => p.providerId === 'google.com');
}

$('#pnEntrar').addEventListener('click', entrar);
$('#pnCambiar').addEventListener('click', async () => { await U.signOut(auth); entrar(); });

async function entrar() {
  const prov = new U.GoogleAuthProvider();
  prov.setCustomParameters({ prompt: 'select_account', login_hint: SOPORTE.adminEmail });
  const nota = $('#pnLoginNota');
  try {
    await U.signInWithPopup(auth, prov);
  } catch (e) {
    const c = e && e.code;
    if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') return U.signInWithRedirect(auth, prov);
    if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return;
    nota.textContent = c === 'auth/unauthorized-domain' ? 'Falta autorizar este dominio: Firebase → Authentication → Configuración → Dominios autorizados.'
      : c === 'auth/operation-not-allowed' ? 'Activa el acceso con Google: Firebase → Authentication → Método de acceso → Google.'
      : 'No se pudo entrar (' + (c || 'error') + '). Inténtalo otra vez.';
    nota.classList.add('mal');
  }
}

/* ------------------------------ Arranque ------------------------------ */
function arrancar() {
  const u = P.user;
  const img = $('#pnYoImg');
  if (u.photoURL) { img.src = u.photoURL; img.hidden = false; $('#pnYoIni').textContent = ''; }
  else { img.hidden = true; $('#pnYoIni').textContent = (u.displayName || u.email || '?').slice(0, 1).toUpperCase(); }
  $('#pnYoMail').textContent = u.email;
  $('#pnDisponible').checked = P.disponible; pintarEstado();
  $('#pnSonido').setAttribute('aria-pressed', P.sonido ? 'true' : 'false');
  pintarRapidas();
  escucharChats();
  latido(); clearInterval(P.tLatido); P.tLatido = setInterval(latido, 60e3);
  avisosIniciales();
  setTimeout(() => limpieza(false).catch(() => {}), 4000);
}

function parar() {
  if (P.unsubChats) P.unsubChats(); if (P.unsubMsgs) P.unsubMsgs();
  P.unsubChats = P.unsubMsgs = null; P.user = null; P.chats.clear(); P.sel = null; P.inicial = true;
  clearInterval(P.tLatido);
}

/* ------------------------------ En línea ------------------------------ */
function latido() {
  if (!P.user) return;
  F.setDoc(F.doc(db, 'soporte_estado', 'publico'), { online: P.disponible, visto: F.serverTimestamp() }).catch(() => {});
}
addEventListener('pagehide', () => { if (P.user) F.setDoc(F.doc(db, 'soporte_estado', 'publico'), { online: false, visto: F.serverTimestamp() }).catch(() => {}); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { latido(); marcarVisto(); } });
$('#pnDisponible').addEventListener('change', (e) => { P.disponible = e.target.checked; lsSet('pn_disponible', P.disponible ? '1' : '0'); pintarEstado(); latido(); });
function pintarEstado() {
  $('#pnEstadoT').textContent = P.disponible ? 'Disponible' : 'Ausente';
  pn.classList.toggle('ausente', !P.disponible);
}

/* ------------------------------ Bandeja ------------------------------ */
function escucharChats() {
  P.unsubChats = F.onSnapshot(F.query(F.collection(db, 'soporte_chats'), F.orderBy('actualizado', 'desc'), F.limit(300)), (s) => {
    const nuevos = [];
    s.docChanges().forEach((ch) => {
      const id = ch.doc.id;
      if (ch.type === 'removed') {
        P.chats.delete(id);
        if (P.sel === id) { cerrarSel(); if (P.borrando !== id) toast('El usuario ha finalizado la conversación y se ha borrado'); }
        return;
      }
      const d = ch.doc.data({ serverTimestamps: 'estimate' });
      const prev = P.chats.get(id);
      P.chats.set(id, d);
      if (!P.inicial && d.ultimoDe === 'cliente' && (!prev || ms(prev.actualizado) < ms(d.actualizado))) nuevos.push(id);
    });
    P.inicial = false;
    pintarLista();
    if (nuevos.length) avisar(nuevos);
    if (P.sel && P.chats.has(P.sel)) { pintarCabeceraChat(); marcarVisto(); }
    abrirDesdeHash();
  }, (e) => toast('No se pueden leer los chats (' + (e.code || 'error') + '). Revisa las reglas de Firestore.', 6000));
}

function filtrados() {
  const q = P.busca.trim().toLowerCase();
  let arr = [...P.chats.entries()].map(([id, d]) => ({ id, ...d }));
  if (P.filtro === 'espera') arr = arr.filter((c) => c.estado === 'espera').sort((a, b) => ms(a.actualizado) - ms(b.actualizado));
  else arr.sort((a, b) => ms(b.actualizado) - ms(a.actualizado));
  if (q) arr = arr.filter((c) => (nombre(c) + ' ' + (c.ultimoTexto || '') + ' ' + (c.dispositivo || '')).toLowerCase().includes(q));
  return arr;
}

function pintarLista() {
  const arr = filtrados(), box = $('#pnItems');
  const espera = [...P.chats.values()].filter((c) => c.estado === 'espera').length;
  $('#pnNEspera').textContent = espera; $('#pnNTodas').textContent = P.chats.size;
  document.title = (espera ? `(${espera}) ` : '') + 'downloaderV Soporte';
  if (navigator.setAppBadge) (espera ? navigator.setAppBadge(espera) : navigator.clearAppBadge()).catch(() => {});
  if (!arr.length) {
    box.innerHTML = `<div class="pn-items-vacio">${P.busca ? 'Sin resultados' : P.filtro === 'espera' ? 'Nadie esperando ✨' : 'Aún no hay conversaciones'}</div>`;
  } else {
    box.innerHTML = arr.map((c) => {
      const esp = c.estado === 'espera';
      return `<button type="button" class="pn-it${c.id === P.sel ? ' sel' : ''}${esp ? ' espera' : ''}${c.noLeidos ? ' con-badge' : ''}" data-id="${c.id}">
        ${avatar(c)}
        <span class="pn-it-c"><span class="pn-it-l1"><b>${esc(nombre(c))}</b><time>${haceCorto(c.actualizado)}</time></span>
        <span class="pn-it-l2">${c.ultimoDe === 'soporte' ? '<em>Tú:</em> ' : ''}${esc(c.ultimoTexto || '')}</span>
        <span class="pn-it-l3">${esp ? `<i class="pn-reloj"></i>Esperando ${hace(c.actualizado)}` : '<i class="pn-ok"></i>Respondido'}${c.dispositivo ? ' · ' + esc(c.dispositivo) : ''}</span></span>
        ${c.noLeidos ? `<i class="pn-badge">${c.noLeidos}</i>` : ''}
      </button>`;
    }).join('');
  }
  $('#pnVacioT').textContent = espera ? `${espera} ${espera === 1 ? 'persona espera' : 'personas esperan'} respuesta` : 'Todo al día';
  $('#pnVacioP').textContent = espera ? 'Elige una conversación de la lista para responder.' : 'Cuando alguien escriba, aparecerá aquí al momento.';
}

$('#pnItems').addEventListener('click', (e) => { const b = e.target.closest('.pn-it'); if (b) abrir(b.dataset.id); });
document.querySelectorAll('.pn-tabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.pn-tabs button').forEach((x) => x.classList.toggle('on', x === b));
  P.filtro = b.dataset.filtro; pintarLista();
}));
$('#pnBuscar').addEventListener('input', (e) => { P.busca = e.target.value; pintarLista(); });
setInterval(() => { if (P.user) { pintarLista(); if (P.sel) pintarCabeceraChat(); } }, 30e3);

function abrirDesdeHash() {
  if (P.hashHecho) return;
  const m = /#chat=([A-Za-z0-9]+)/.exec(location.hash);
  if (m && P.chats.has(m[1])) { P.hashHecho = true; abrir(m[1]); }
}
addEventListener('hashchange', () => { P.hashHecho = false; abrirDesdeHash(); });

/* ------------------------------ Conversación ------------------------------ */
function abrir(uid) {
  if (P.sel !== uid) {
    if (P.unsubMsgs) P.unsubMsgs();
    P.urls.forEach((u) => URL.revokeObjectURL(u)); P.urls.clear();
    escribiendo(false);
    P.sel = uid; P.msgs = [];
    history.replaceState(null, '', '#chat=' + uid);
    P.unsubMsgs = F.onSnapshot(F.query(F.collection(db, 'soporte_chats', uid, 'mensajes'), F.orderBy('hora')), (s) => {
      P.msgs = s.docs.map((x) => ({ id: x.id, ...x.data({ serverTimestamps: 'estimate' }) }));
      pintarMsgs(); pintarCabeceraChat();
    }, () => {});
  }
  pn.classList.add('ver-chat');
  ['.pn-chat-h', '#pnMsgs', '.pn-comp'].forEach((s) => { $(s).hidden = false; });
  $('#pnVacio').hidden = true;
  pintarCabeceraChat(); pintarLista(); marcarVisto();
  if (matchMedia('(pointer:fine)').matches) setTimeout(() => $('#pnTa').focus(), 30);
}

function cerrarSel() {
  if (P.unsubMsgs) P.unsubMsgs(); P.unsubMsgs = null;
  P.urls.forEach((u) => URL.revokeObjectURL(u)); P.urls.clear();
  P.sel = null; P.msgs = [];
  pn.classList.remove('ver-chat');
  ['.pn-chat-h', '#pnMsgs', '.pn-comp'].forEach((s) => { $(s).hidden = true; });
  $('#pnVacio').hidden = false;
  history.replaceState(null, '', location.pathname);
  pintarLista();
}
$('#pnAtras').addEventListener('click', cerrarSel);

function pintarCabeceraChat() {
  const c = P.chats.get(P.sel); if (!c) return;
  $('#pnChatAv').innerHTML = avatar({ id: P.sel, ...c }, true);
  $('#pnChatNombre').textContent = nombre(c);
  const hoyIni = inicioHoy();
  const usados = P.msgs.filter((m) => m.de === 'cliente' && ms(m.hora) >= hoyIni).length;
  const partes = [];
  if (c.dispositivo) partes.push(c.dispositivo);
  partes.push(c.estado === 'espera' ? `Esperando ${hace(c.actualizado)}` : 'Respondido');
  partes.push(`Hoy ha enviado ${Math.min(usados, LIMITE)} de ${LIMITE}`);
  $('#pnChatMeta').textContent = partes.join(' · ');
}

function marcarVisto() {
  if (!P.sel || document.hidden || !document.hasFocus()) return;
  const c = P.chats.get(P.sel); if (!c) return;
  if ((c.noLeidos || 0) > 0 || ms(c.vistoSoporte) < ms(c.actualizado)) {
    F.updateDoc(F.doc(db, 'soporte_chats', P.sel), { noLeidos: 0, vistoSoporte: F.serverTimestamp() }).catch(() => {});
  }
}
addEventListener('focus', marcarVisto);

function pintarMsgs() {
  const box = $('#pnMsgs');
  const abajo = box.scrollHeight - box.scrollTop - box.clientHeight < 100 || P.bajar;
  const c = P.chats.get(P.sel) || {};
  let html = `<div class="pn-ini">Conversación iniciada ${c.creado ? fechaLarga(c.creado) : ''}. Se borra entera al finalizar o tras ${DIAS_CHAT} días sin actividad.</div>`;
  let dia = '';
  for (const m of P.msgs) {
    const f = fecha(m.hora), kd = f.toDateString();
    if (kd !== dia) { dia = kd; html += `<div class="pn-dia"><span>${etiquetaDia(f)}</span></div>`; }
    const yo = m.de === 'soporte';
    let img = '';
    const url = urlImagen(m);
    if (url) img = `<span class="pn-img" style="aspect-ratio:${m.imgW || 4}/${m.imgH || 3}"><img src="${url}" alt="Imagen"></span>`;
    else if (m.imgPendiente) img = `<span class="pn-img cargando" style="aspect-ratio:${m.imgW || 4}/${m.imgH || 3}"><span class="pn-spin"></span></span>`;
    html += `<div class="pn-m ${yo ? 'yo' : 'el'}">${yo ? '' : avatar({ id: P.sel, ...c }, false, 'pn-m-av')}<div class="pn-b">${img}${m.texto ? `<p>${enlaces(m.texto)}</p>` : ''}<span class="pn-h">${hora(f)}</span></div></div>`;
  }
  box.innerHTML = html;
  if (abajo) { box.scrollTop = box.scrollHeight; P.bajar = false; }
}
$('#pnMsgs').addEventListener('click', (e) => {
  const im = e.target.closest('.pn-img img'); if (!im) return;
  const lb = $('#pnLb'); lb.querySelector('img').src = im.src; lb.hidden = false;
});
$('#pnLb').addEventListener('click', () => { $('#pnLb').hidden = true; });

function urlImagen(m) {
  if (P.urls.has(m.id)) return P.urls.get(m.id);
  if (!m.img || !m.img.toUint8Array) return null;
  const u = URL.createObjectURL(new Blob([m.img.toUint8Array()], { type: m.imgTipo || 'image/jpeg' }));
  P.urls.set(m.id, u); return u;
}

/* ------------------------------ Responder ------------------------------ */
const ta = $('#pnTa');
ta.addEventListener('input', () => {
  ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  pintarEnviar();
  escribiendo(!!ta.value.trim());
  clearTimeout(P.tEsc); P.tEsc = setTimeout(() => escribiendo(false), 3500);
});
ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(pointer:fine)').matches) { e.preventDefault(); responder(); } });
ta.addEventListener('paste', (e) => { const f = [...(e.clipboardData ? e.clipboardData.files : [])].find((x) => /^image\//.test(x.type)); if (f) { e.preventDefault(); elegirImagen(f); } });
$('#pnSend').addEventListener('click', responder);
$('#pnAdj').addEventListener('click', () => $('#pnFile').click());
$('#pnFile').addEventListener('change', (e) => elegirImagen(e.target.files && e.target.files[0]));
$('#pnPrevX').addEventListener('click', () => quitarImagen());
function pintarEnviar() { $('#pnSend').disabled = P.enviando || (!ta.value.trim() && !P.imagen); }

function pintarRapidas() {
  $('#pnRapidas').innerHTML = RAPIDAS.map(([t], i) => `<button type="button" data-i="${i}">${esc(t)}</button>`).join('');
}
$('#pnRapidas').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  ta.value = RAPIDAS[+b.dataset.i][1]; ta.dispatchEvent(new Event('input')); ta.focus();
});

function escribiendo(v) {
  if (!P.sel || !P.user) return;
  const ahora = Date.now();
  if (v && P.escribiendo && ahora - P.escribiendoT < 4000) return;
  if (!v && !P.escribiendo) return;
  P.escribiendo = v; P.escribiendoT = ahora;
  F.updateDoc(F.doc(db, 'soporte_chats', P.sel), v ? { escribiendo: true, escribiendoHora: F.serverTimestamp() } : { escribiendo: false }).catch(() => {});
}

async function responder() {
  const texto = ta.value.trim(), img = P.imagen, uid = P.sel;
  if ((!texto && !img) || !uid || P.enviando) return;
  P.enviando = true; pintarEnviar();
  try {
    const b = F.writeBatch(db);
    const ref = F.doc(F.collection(db, 'soporte_chats', uid, 'mensajes'));
    const expira = F.Timestamp.fromMillis(Date.now() + DIAS_CHAT * 864e5);
    const msg = { de: 'soporte', texto, hora: F.serverTimestamp(), expira };
    if (img) Object.assign(msg, { img: F.Bytes.fromUint8Array(new Uint8Array(await img.blob.arrayBuffer())), imgTipo: img.tipo, imgW: img.w, imgH: img.h });
    b.set(ref, msg);
    b.update(F.doc(db, 'soporte_chats', uid), {
      estado: 'respondido', ultimoTexto: texto ? recortar(texto.replace(/\s+/g, ' '), 140) : '📷 Imagen', ultimoDe: 'soporte',
      actualizado: F.serverTimestamp(), escribiendo: false, noLeidos: 0, vistoSoporte: F.serverTimestamp(), expira,
    });
    if (img) P.urls.set(ref.id, img.url);
    ta.value = ''; ta.style.height = 'auto'; P.imagen = null; $('#pnPrev').hidden = true; $('#pnFile').value = '';
    P.escribiendo = false; P.bajar = true;
    await b.commit();
  } catch (e) {
    toast('No se pudo enviar (' + (e.code || e.message) + ')');
    if (!ta.value) ta.value = texto;
  } finally { P.enviando = false; pintarEnviar(); }
}

/* ------------------------------ Finalizar ------------------------------ */
$('#pnFin').addEventListener('click', () => { $('#pnOv').hidden = false; $('#pnNo').focus(); });
$('#pnNo').addEventListener('click', () => { $('#pnOv').hidden = true; });
$('#pnSi').addEventListener('click', async () => {
  const uid = P.sel, b = $('#pnSi'); if (!uid) return;
  b.disabled = true; b.textContent = 'Borrando…'; P.borrando = uid;
  try { await borrarChat(uid); cerrarSel(); toast('Conversación finalizada y borrada por completo'); }
  catch (e) { toast('No se pudo borrar (' + (e.code || e.message) + ')'); }
  finally { b.disabled = false; b.textContent = 'Finalizar y borrar'; $('#pnOv').hidden = true; }
});

async function borrarChat(uid) {
  const s = await F.getDocs(F.collection(db, 'soporte_chats', uid, 'mensajes'));
  const refs = [...s.docs.map((x) => x.ref), F.doc(db, 'soporte_chats', uid)];
  for (let i = 0; i < refs.length; i += 450) {
    const b = F.writeBatch(db); refs.slice(i, i + 450).forEach((r) => b.delete(r)); await b.commit();
  }
}

async function limpieza(manual) {
  const ahora = F.Timestamp.now();
  const viejos = await F.getDocs(F.query(F.collection(db, 'soporte_chats'), F.where('expira', '<', ahora), F.limit(20)));
  for (const c of viejos.docs) await borrarChat(c.id);
  const lim = await F.getDocs(F.query(F.collection(db, 'soporte_limites'), F.where('expira', '<', ahora), F.limit(400)));
  if (lim.size) { const b = F.writeBatch(db); lim.docs.forEach((x) => b.delete(x.ref)); await b.commit(); }
  if (manual) toast(`Limpieza hecha: ${viejos.size} chats y ${lim.size} contadores caducados`);
}

/* ------------------------------ Imágenes ------------------------------ */
async function elegirImagen(file) {
  if (!file || !/^image\//.test(file.type)) return toast('Solo imágenes');
  try {
    const c = await comprimir(file);
    if (P.imagen) URL.revokeObjectURL(P.imagen.url);
    P.imagen = { ...c, url: URL.createObjectURL(c.blob) };
    $('#pnPrev').hidden = false; $('#pnPrev img').src = P.imagen.url; pintarEnviar();
  } catch (_) { toast('No se pudo leer esa imagen'); }
}
function quitarImagen() { if (P.imagen) URL.revokeObjectURL(P.imagen.url); P.imagen = null; $('#pnPrev').hidden = true; $('#pnFile').value = ''; pintarEnviar(); }
async function comprimir(file) {
  const fuente = await (window.createImageBitmap ? createImageBitmap(file) : new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = URL.createObjectURL(file); }));
  let lado = 1600, q = 0.82, blob = null, w = 1, h = 1;
  for (let i = 0; i < 7; i++) {
    const k = Math.min(1, lado / Math.max(fuente.width, fuente.height)); w = Math.round(fuente.width * k); h = Math.round(fuente.height * k);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(fuente, 0, 0, w, h);
    blob = await new Promise((ok) => cv.toBlob(ok, 'image/webp', q));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', q));
    if (blob && blob.size <= 700 * 1024) break;
    lado = Math.round(lado * 0.8); q = Math.max(0.6, q - 0.06);
  }
  if (!blob || blob.size > 700 * 1024) throw new Error('grande');
  return { blob, w, h, tipo: blob.type };
}

/* ------------------------------ Avisos ------------------------------ */
function avisar(ids) {
  if (P.sonido) sonido();
  ids.forEach((id) => {
    const c = P.chats.get(id); if (!c) return;
    if (!document.hidden && document.hasFocus() && P.sel === id) return;
    notificar(nombre(c) + ' · Soporte downloaderV', c.ultimoTexto || 'Nuevo mensaje', id);
  });
}

async function notificar(titulo, cuerpo, id) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body: cuerpo, icon: '../icon-192.png', tag: 'chat-' + id, data: { url: location.pathname + '#chat=' + id } };
  try {
    const reg = P.reg || (navigator.serviceWorker && await navigator.serviceWorker.getRegistration('./'));
    if (reg) return reg.showNotification(titulo, opts);
    const n = new Notification(titulo, opts); n.onclick = () => { focus(); location.hash = 'chat=' + id; };
  } catch (_) {}
}

let ctxAudio = null;
function sonido() {
  try {
    ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
    if (ctxAudio.state === 'suspended') ctxAudio.resume();
    const t = ctxAudio.currentTime;
    [[784, 0], [1046, 0.12], [1318, 0.24]].forEach(([f, dt]) => {
      const o = ctxAudio.createOscillator(), g = ctxAudio.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + dt);
      g.gain.exponentialRampToValueAtTime(0.16, t + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.3);
      o.connect(g).connect(ctxAudio.destination); o.start(t + dt); o.stop(t + dt + 0.32);
    });
  } catch (_) {}
}
$('#pnSonido').addEventListener('click', () => {
  P.sonido = !P.sonido; lsSet('pn_sonido', P.sonido ? '1' : '0');
  $('#pnSonido').setAttribute('aria-pressed', P.sonido ? 'true' : 'false');
  if (P.sonido) sonido();
  toast(P.sonido ? 'Sonido activado' : 'Sonido desactivado');
});

function avisosIniciales() {
  if (!('Notification' in window)) return estadoAvisos('no');
  if (Notification.permission === 'granted') registrarPush(false);
  else { estadoAvisos(Notification.permission); if (Notification.permission === 'default' && ls('pn_banner_no', '') !== '1') $('#pnBanner').hidden = false; }
}
$('#pnBannerSi').addEventListener('click', () => { $('#pnBanner').hidden = true; registrarPush(true); });
$('#pnBannerNo').addEventListener('click', () => { $('#pnBanner').hidden = true; lsSet('pn_banner_no', '1'); });
$('#pnAvisos').addEventListener('click', () => {
  if (P.avisos === 'push') return toast('Avisos activados en este dispositivo: te llegan aunque cierres el panel');
  if (P.avisos === 'local') return toast(SOPORTE.vapidKey ? 'Avisos solo con el panel abierto en este navegador' : 'Avisos con el panel abierto. Para recibirlos con el panel cerrado, añade la clave «vapidKey» en soporte-config.js');
  if (P.avisos === 'denied') return toast('Los avisos están bloqueados: actívalos en el candado de la barra de direcciones');
  registrarPush(true);
});

async function registrarPush(interactivo) {
  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return estadoAvisos('no');
    let perm = Notification.permission;
    if (perm === 'default' && interactivo) perm = await Notification.requestPermission();
    if (perm !== 'granted') return estadoAvisos(perm);
    P.reg = await navigator.serviceWorker.register('sw.js?c=' + encodeURIComponent(JSON.stringify(SOPORTE.firebase)), { scope: './' });
    if (!SOPORTE.vapidKey) return estadoAvisos('local');
    const M = await import(CDN + 'firebase-messaging.js');
    if (!(await M.isSupported())) return estadoAvisos('local');
    const messaging = M.getMessaging(app);
    await navigator.serviceWorker.ready;
    const token = await M.getToken(messaging, { vapidKey: SOPORTE.vapidKey, serviceWorkerRegistration: P.reg });
    if (!token) return estadoAvisos('local');
    const id = (await sha256(token)).slice(0, 40);
    await F.setDoc(F.doc(db, 'soporte_admin_tokens', id), { token, creado: F.serverTimestamp(), dispositivo: dispositivo() });
    M.onMessage(messaging, () => {});
    estadoAvisos('push');
    if (interactivo) toast('¡Listo! Te avisaremos al instante en este dispositivo');
  } catch (e) {
    console.log('avisos', e && (e.code || e.message));
    estadoAvisos(Notification.permission === 'granted' ? 'local' : Notification.permission);
    if (interactivo) toast('No se pudieron activar los avisos push (' + (e.code || e.message) + ')');
  }
}
function estadoAvisos(e) {
  P.avisos = e;
  const b = $('#pnAvisos'); b.dataset.estado = e;
  b.title = e === 'push' ? 'Avisos activados (también con el panel cerrado)' : e === 'local' ? 'Avisos con el panel abierto' : e === 'denied' ? 'Avisos bloqueados' : 'Activar avisos';
}

/* ------------------------------ Menú, instalar ------------------------------ */
$('#pnYo').addEventListener('click', (e) => { e.stopPropagation(); $('#pnMenu').hidden = !$('#pnMenu').hidden; });
document.addEventListener('click', (e) => { if (!e.target.closest('#pnMenu')) $('#pnMenu').hidden = true; });
$('#pnSalir').addEventListener('click', async () => { latidoFuera(); await U.signOut(auth); });
$('#pnLimpiar').addEventListener('click', () => { $('#pnMenu').hidden = true; limpieza(true).catch((e) => toast('No se pudo limpiar (' + (e.code || e.message) + ')')); });
function latidoFuera() { F.setDoc(F.doc(db, 'soporte_estado', 'publico'), { online: false, visto: F.serverTimestamp() }).catch(() => {}); }
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); P.instalar = e; $('#pnInstalar').hidden = false; });
$('#pnInstalar').addEventListener('click', async () => { if (!P.instalar) return; P.instalar.prompt(); await P.instalar.userChoice.catch(() => {}); P.instalar = null; $('#pnInstalar').hidden = true; });
addEventListener('appinstalled', () => { $('#pnInstalar').hidden = true; toast('App instalada. Ábrela desde tu escritorio o menú de inicio'); });
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#pnLb').hidden) $('#pnLb').hidden = true;
  else if (!$('#pnOv').hidden) $('#pnOv').hidden = true;
  else if (!$('#pnMenu').hidden) $('#pnMenu').hidden = true;
});

/* ------------------------------ Utilidades ------------------------------ */
function toast(t, ms2 = 3200) { const el = $('#pnToast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), ms2); }
function ms(t) { return t && t.toMillis ? t.toMillis() : t instanceof Date ? t.getTime() : 0; }
function fecha(t) { return t && t.toDate ? t.toDate() : new Date(); }
function nombre(c) { return c.nombre || 'Visitante ' + String(c.id || '').slice(-4).toUpperCase(); }
function tono(id) { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; }
function avatar(c, grande, cls = '') {
  const n = c.nombre ? c.nombre.trim().slice(0, 1).toUpperCase() : '#';
  return `<span class="pn-av ${grande ? 'g' : ''} ${cls}" style="--h:${tono(c.id)}">${esc(n)}</span>`;
}
function hace(t) {
  const m = Math.max(0, Math.floor((Date.now() - ms(t)) / 60e3));
  if (m < 1) return 'ahora mismo'; if (m < 60) return `${m} min`; const h = Math.floor(m / 60); if (h < 24) return `${h} h`; return `${Math.floor(h / 24)} d`;
}
function haceCorto(t) {
  const f = fecha(t), m = Math.floor((Date.now() - f.getTime()) / 60e3);
  if (m < 1) return 'ahora'; if (m < 60) return m + ' min';
  if (f.toDateString() === new Date().toDateString()) return hora(f);
  return f.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
function hora(f) { return f.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
function fechaLarga(t) { return fecha(t).toLocaleString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); }
function etiquetaDia(f) {
  if (f.toDateString() === new Date().toDateString()) return 'Hoy';
  if (f.toDateString() === new Date(Date.now() - 864e5).toDateString()) return 'Ayer';
  return f.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
}
function inicioHoy() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const ahora = Date.now();
  return ahora - ((+p.hour % 24) * 3600 + +p.minute * 60 + +p.second) * 1000 - (ahora % 1000);
}
function esc(t) { return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function enlaces(t) { return esc(t).replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, (u) => `<a href="${u}" target="_blank" rel="noopener nofollow">${u}</a>`).replace(/\n/g, '<br>'); }
function recortar(t, n) { const a = Array.from(t); return a.length > n ? a.slice(0, n - 1).join('') + '…' : t; }
async function sha256(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join(''); }
function dispositivo() {
  const ua = navigator.userAgent;
  return (/Android/i.test(ua) ? 'Android' : /Windows/i.test(ua) ? 'Windows' : /iPhone|iPad/i.test(ua) ? 'iPhone/iPad' : /Mac/i.test(ua) ? 'Mac' : 'Otro') + ' · ' + (matchMedia('(display-mode: standalone)').matches ? 'app instalada' : 'navegador');
}
