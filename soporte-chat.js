/* ============================================================
   soporte-chat.js  ·  Chat de soporte de downloaderV (con cola)
   Flujo:
     1) "Contactar con el soporte"  -> crea una solicitud en Firestore (estado: "pendiente")
     2) Sala de espera con tiempo corriendo, esperando a que TÚ la aceptes
     3) Tú la aceptas (estado: "aceptado") desde la consola de Firestore o tu panel
     4) Se desbloquea el chat: el usuario ya puede escribir
     5) "Finalizar" o "Cancelar" -> borra TODO (gratis: nada queda guardado)
   ============================================================ */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, collection, addDoc,
         query, orderBy, serverTimestamp, getDocs, deleteDoc, Timestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyD9sWd6hiiQLds6-4NwYyTyhtt7mifHYs0",
  authDomain: "downloaderv-analytics.firebaseapp.com",
  projectId: "downloaderv-analytics",
  storageBucket: "downloaderv-analytics.firebasestorage.app",
  messagingSenderId: "10457429159",
  appId: "1:10457429159:web:c7225988bc22f8f7e85782",
  measurementId: "G-6J5FX3S3Q0"
};

const MAXLEN = 1000;      // caracteres por mensaje
const MAXMSG = 30;        // mensajes por sesión
const SESSION_SEG = 15*60;// duración del chat ya aceptado
const WAIT_MAX = 180;     // segundos máx. esperando a un agente
const TTL_HORAS = 24;     // auto-borrado si activas TTL en Firestore

(function(){
  const root = document.getElementById('soporteChat');
  if(!root) return;
  const $ = s => root.querySelector(s);

  const msgs=$('#scMsgs'), ta=$('#scTa'), send=$('#scSend'), count=$('#scCount'), left=$('#scLeft'),
        clockEl=$('#scClock'), waitClock=$('#scWaitClock'), statusEl=$('#scStatus'),
        ovFin=$('#scOvFin'), ovCancel=$('#scOvCancel'),
        doneEl=$('#scDone'), doneT=$('#scDoneT'), doneP=$('#scDoneP');

  let app, auth, db, uid=null, fbReady=false;
  let sesionRef=null, msgsRef=null, unsubDoc=null, unsubMsgs=null;
  let sentCount=0, remaining=SESSION_SEG, sessTimer=null;
  let waitSec=0, waitTimer=null, accepted=false, ended=false, greeted=false;
  const rendered = new Set();
  const hhmm = () => new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  const fmt = s => String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  const scroll = () => { msgs.scrollTop = msgs.scrollHeight; };
  const setState = s => root.dataset.state = s;
  function setStatus(t){ if(statusEl) statusEl.innerHTML = '<i></i>'+t; }

  /* ---------- Firebase ---------- */
  function initFirebase(){
    if(app) return;
    try{
      app  = initializeApp(firebaseConfig, 'soporte');
      auth = getAuth(app);
      db   = getFirestore(app);
      onAuthStateChanged(auth, u=>{ if(u){ uid=u.uid; fbReady=true; } });
      signInAnonymously(auth).catch(err=>{ console.log('Soporte · auth falló:', err && err.code); });
    }catch(e){ console.log('Soporte · init falló:', e); }
  }
  function waitAuth(){
    return new Promise((res,rej)=>{
      if(fbReady && uid) return res();
      let n=0; const iv=setInterval(()=>{ n++;
        if(fbReady && uid){ clearInterval(iv); res(); }
        else if(n>50){ clearInterval(iv); rej(new Error('sin-auth')); }   // ~5s
      },100);
    });
  }

  /* ---------- Mensajes (UI) ---------- */
  function bubble(text, me){
    const row=document.createElement('div'); row.className='sc-row'+(me?' me':'');
    const ava = me ? '' : '<div class="sc-ava"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/></svg></div>';
    const safe = (text||'').replace(/[<>&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
    row.innerHTML = ava + '<div class="sc-bub">'+safe+'<span class="sc-time">'+hhmm()+'</span></div>';
    msgs.appendChild(row); scroll();
  }

  /* ---------- 1) Contactar -> crear solicitud + esperar ---------- */
  async function contactar(){
    setState('waiting'); setStatus('En cola…'); startWait();
    try{
      await waitAuth();
      sesionRef = doc(db, 'soporte', uid);
      msgsRef   = collection(sesionRef, 'mensajes');
      const expira = Timestamp.fromMillis(Date.now() + TTL_HORAS*3600*1000);
      await setDoc(sesionRef, {
        estado:'pendiente', creado:serverTimestamp(), actualizado:serverTimestamp(),
        expira, dispositivo:(navigator.userAgent||'').slice(0,200)
      }, { merge:true });
      // escuchar el estado de la solicitud
      unsubDoc = onSnapshot(sesionRef, snap=>{
        const d = snap.data();
        if(d && d.estado==='aceptado' && !accepted) onAccepted();
      }, err=> console.log('Soporte · doc snap:', err && err.code));
    }catch(e){
      console.log('Soporte · contactar falló:', e && (e.code||e.message));
      stopWait(); setState('noagents');
    }
  }

  function startWait(){
    waitSec=0; waitClock.textContent='00:00';
    waitTimer=setInterval(()=>{
      waitSec++; waitClock.textContent=fmt(waitSec);
      if(waitSec>=WAIT_MAX){ stopWait(); cancelarSolicitud(); setState('noagents'); }
    },1000);
  }
  function stopWait(){ if(waitTimer){ clearInterval(waitTimer); waitTimer=null; } }

  async function cancelarSolicitud(){
    try{ if(unsubDoc){ unsubDoc(); unsubDoc=null; } await borrarTodo(); }catch(_){}
  }

  /* ---------- 3) Aceptado -> desbloquear chat ---------- */
  function onAccepted(){
    accepted=true; stopWait(); setState('chat'); setStatus('En línea · respondemos en minutos');
    if(!greeted){ greeted=true;
      const d=document.createElement('div'); d.className='sc-day'; d.textContent='Hoy'; msgs.appendChild(d);
      bubble('👋 ¡Hola! Ya estoy contigo. Cuéntame en qué puedo ayudarte.', false);
    }
    // escuchar mensajes (incluye tus respuestas con de:"soporte")
    unsubMsgs = onSnapshot(query(msgsRef, orderBy('hora')), snap=>{
      snap.docChanges().forEach(ch=>{
        if(ch.type!=='added') return;
        const id=ch.doc.id; if(rendered.has(id)) return; rendered.add(id);
        const m=ch.doc.data(); bubble(m.texto, m.de==='usuario');
      });
    }, err=> console.log('Soporte · msgs snap:', err && err.code));
    startSession(); updateBtn(); setTimeout(()=> ta.focus(), 200);
  }

  /* ---------- Enviar ---------- */
  async function doSend(){
    const text = ta.value.trim();
    if(!text || ended || !accepted) return;
    if(text.length > MAXLEN) return;
    if(sentCount >= MAXMSG){ bubble('Has alcanzado el límite de mensajes de esta sesión. 🙏', false); return; }
    ta.value=''; resize(); updateBtn();
    try{
      await addDoc(msgsRef, { de:'usuario', texto:text, hora:serverTimestamp() });
      updateDoc(sesionRef, { actualizado:serverTimestamp() }).catch(()=>{});
      sentCount++; left.textContent='Te quedan '+(MAXMSG-sentCount)+' mensajes';
    }catch(e){ console.log('Soporte · envío falló:', e && (e.code||e.message)); }
  }

  /* ---------- Borrar TODO ---------- */
  async function borrarTodo(){
    try{
      if(msgsRef){ const qs = await getDocs(msgsRef); await Promise.all(qs.docs.map(d=> deleteDoc(d.ref))); }
      if(sesionRef) await deleteDoc(sesionRef);
    }catch(e){ console.log('Soporte · borrado falló:', e && (e.code||e.message)); }
  }
  function finalize(title, text){
    ended=true; stopWait(); if(sessTimer) clearInterval(sessTimer);
    if(unsubDoc){ unsubDoc(); unsubDoc=null; } if(unsubMsgs){ unsubMsgs(); unsubMsgs=null; }
    ovFin.classList.remove('on'); ovCancel.classList.remove('on');
    msgs.style.transition='opacity .4s ease'; msgs.style.opacity='.2';
    borrarTodo(); sesionRef=null; msgsRef=null;
    doneT.textContent=title; doneP.textContent=text;
    setTimeout(()=> doneEl.classList.add('on'), 250);
  }

  /* ---------- Temporizador del chat ---------- */
  function startSession(){ remaining=SESSION_SEG; sessTimer=setInterval(()=>{
    remaining--; clockEl.textContent=fmt(remaining);
    clockEl.classList.toggle('warn', remaining<=120 && remaining>30);
    clockEl.classList.toggle('crit', remaining<=30);
    if(remaining<=0){ clearInterval(sessTimer);
      finalize('⏰ Sesión caducada','El chat se ha cerrado por tiempo y todo se ha eliminado automáticamente.'); }
  },1000); }

  /* ---------- Inputs ---------- */
  function resize(){ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,96)+'px'; }
  function updateBtn(){
    const len = ta.value.trim().length;
    send.disabled = len===0 || ta.value.length>MAXLEN || ended || !accepted;
    count.textContent = ta.value.length+' / '+MAXLEN;
    count.classList.toggle('over', ta.value.length>MAXLEN);
  }
  ta.addEventListener('input', ()=>{ resize(); updateBtn(); });
  ta.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); doSend(); } });
  send.addEventListener('click', doSend);

  /* ---------- Botones de pantalla ---------- */
  $('#scContact').addEventListener('click', ()=>{ initFirebase(); contactar(); });
  $('#scWaitCancel').addEventListener('click', ()=>{ stopWait(); cancelarSolicitud(); resetToConnect(); });
  $('#scRetry').addEventListener('click', resetToConnect);

  $('#scFin').addEventListener('click', ()=> ovFin.classList.add('on'));
  $('#scCancel').addEventListener('click', ()=> ovCancel.classList.add('on'));
  root.querySelectorAll('[data-sc-close-ov]').forEach(b=> b.addEventListener('click', ()=>{ ovFin.classList.remove('on'); ovCancel.classList.remove('on'); }));
  $('#scFinYes').addEventListener('click', ()=> finalize('Soporte finalizado','Gracias por contactar con downloaderV. La conversación se ha eliminado por completo.'));
  $('#scCancelYes').addEventListener('click', ()=> finalize('Chat cancelado','Has cancelado el chat. Todo lo escrito se ha borrado y no se puede recuperar.'));
  $('#scRestart').addEventListener('click', ()=>{ resetToConnect(); const m=root.closest('.modal'); if(m){ const r=document.getElementById('modalRoot'); if(r){ r.classList.remove('open'); r.setAttribute('aria-hidden','true'); document.body.style.overflow=''; setTimeout(()=>m.classList.remove('show'),300); } } });

  function resetToConnect(){
    accepted=false; ended=false; greeted=false; sentCount=0; rendered.clear();
    stopWait(); if(sessTimer) clearInterval(sessTimer);
    if(unsubDoc){ unsubDoc(); unsubDoc=null; } if(unsubMsgs){ unsubMsgs(); unsubMsgs=null; }
    msgs.innerHTML=''; msgs.style.opacity='1'; ta.value=''; resize();
    clockEl.textContent='15:00'; clockEl.className='sc-clock'; left.textContent='Te quedan '+MAXMSG+' mensajes';
    waitClock.textContent='00:00'; doneEl.classList.remove('on');
    sesionRef=null; msgsRef=null; setStatus('Chat en directo'); updateBtn();
    setState('connect');
  }

  /* ---------- Apertura del modal ---------- */
  function onOpen(){ initFirebase(); if(root.dataset.state==='chat') setTimeout(()=> ta.focus(), 250); }
  document.querySelectorAll('[data-modal="chat"]').forEach(b=> b.addEventListener('click', onOpen));
  const modal = root.closest('.modal');
  if(modal){
    new MutationObserver(()=>{ if(modal.classList.contains('show')) onOpen(); })
      .observe(modal, { attributes:true, attributeFilter:['class'] });
  }
})();
