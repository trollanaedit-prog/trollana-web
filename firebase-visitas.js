import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
  import { getFirestore, collection, addDoc, doc, updateDoc, serverTimestamp }
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

  function infoGpu(){
    try{
      const c=document.createElement('canvas');
      const gl=c.getContext('webgl')||c.getContext('experimental-webgl');
      if(gl){ const e=gl.getExtension('WEBGL_debug_renderer_info');
        if(e){ const r=gl.getParameter(e.UNMASKED_RENDERER_WEBGL); if(r) return r; } }
    }catch(_){}
    return 'desconocida';
  }
  function zonaHoraria(){
    try{
      const off = -new Date().getTimezoneOffset()/60;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      return `UTC${off>=0?'+':''}${off} (${tz})`;
    }catch(_){ return 'desconocida'; }
  }
  // Texto bonito para la duración (15 s · 7 min 32 s · 1 h 4 min)
  function formatoDuracion(seg){
    if(seg < 60) return seg + ' s';
    const m = Math.floor(seg/60), s = seg%60;
    if(m < 60) return s ? `${m} min ${s} s` : `${m} min`;
    const h = Math.floor(m/60), mm = m%60;
    return mm ? `${h} h ${mm} min` : `${h} h`;
  }

  (async ()=>{
    let db=null, ref=null;
    const inicio = Date.now();
    let descargo = false;     // ¿pulsó Descargar?
    let cerrado  = false;     // para no escribir la duración dos veces

    const segundos = ()=> Math.max(0, Math.round((Date.now()-inicio)/1000));
    const textoDescarga = ()=> descargo ? '✅ SÍ — pulsó descargar' : '❌ NO — solo visitó';

    // --- Detectar clic en los botones de descarga (#heroDl, #ctaDl, .dl-btn, enlaces .exe/.apk) ---
    function marcarDescarga(){
      if(descargo) return; descargo = true;
      if(ref){
        updateDoc(ref, {
          _descarga: textoDescarga(),
          descargo: true,
          _duracion: formatoDuracion(segundos()),
          duracion_segundos: segundos()
        }).catch(()=>{});
      }
    }
    document.addEventListener('click', (e)=>{
      const t = e.target.closest('#heroDl, #ctaDl, .dl-btn, a[href*=".exe"], a[href*=".apk"], a[href*="releases/download"]');
      if(t) marcarDescarga();
    }, true);

    // --- Guardar la duración al salir / cambiar de pestaña ---
    function guardarSalida(){
      if(cerrado || !ref) return; cerrado = true;
      updateDoc(ref, {
        _descarga: textoDescarga(),
        _duracion: formatoDuracion(segundos()),
        descargo,
        duracion_segundos: segundos()
      }).catch(()=>{});
    }
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') guardarSalida(); });
    window.addEventListener('pagehide', guardarSalida);

    try{
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);

      let vid = localStorage.getItem('dv_visitante_id') || '';
      if(!vid){ vid = Date.now()+'_'+Math.floor(Math.random()*900000+100000); localStorage.setItem('dv_visitante_id', vid); }
      const recurrente = localStorage.getItem('dv_ya_visito')==='si';
      localStorage.setItem('dv_ya_visito','si');

      const datos = {
        // ===== ARRIBA DEL TODO (el "_" hace que salgan los primeros en Firestore) =====
        _descarga: textoDescarga(),       // ✅ SÍ / ❌ NO  (si pulsó descargar)
        _duracion: '0 s',                 // tiempo que estuvo en la página
        // ===== resto de datos =====
        descargo: descargo,               // versión booleana (para tu app)
        duracion_segundos: 0,             // versión numérica (para tu app)
        fecha: serverTimestamp(),
        fecha_local: new Date().toISOString(),
        visitante_id: vid,
        es_recurrente: recurrente,
        user_agent: navigator.userAgent,
        plataforma: navigator.platform,
        idioma: navigator.language,
        idiomas: (navigator.languages||[]).join(', '),
        nucleos_cpu: navigator.hardwareConcurrency || null,
        pantalla_ancho: screen.width,
        pantalla_alto: screen.height,
        densidad_pixel: window.devicePixelRatio,
        referrer: document.referrer,
        url: location.href,
        zona_horaria: zonaHoraria(),
        gpu: infoGpu(),
      };

      // Ubicación aproximada por IP (sin clave)
      try{
        const ctrl = new AbortController();
        const t = setTimeout(()=>ctrl.abort(), 5000);
        const r = await fetch('https://ipwho.is/', {signal: ctrl.signal});
        clearTimeout(t);
        if(r.ok){
          const g = await r.json();
          if(g && g.success){
            Object.assign(datos, {
              ip: g.ip, pais: g.country, pais_codigo: g.country_code,
              region: g.region, ciudad: g.city,
              latitud: g.latitude, longitud: g.longitude,
              isp: g.connection?.isp, organizacion: g.connection?.org,
            });
          }
        }
      }catch(_){ /* sin geo, seguimos */ }

      // Crear el documento de la visita y guardar su referencia
      ref = await addDoc(collection(db,'visitas'), datos);

      // Si ya había pulsado descargar mientras cargaba, lo reflejamos
      if(descargo){ updateDoc(ref, { _descarga: textoDescarga(), descargo:true }).catch(()=>{}); }

      // Guardar la duración en hitos (1, 5, 15, 30 min) por si cierra de golpe.
      // Pocas escrituras = entra de sobra en el plan GRATUITO de Firebase.
      [60, 300, 900, 1800].forEach(seg=>{
        setTimeout(()=>{
          if(cerrado || !ref) return;
          updateDoc(ref, { _duracion: formatoDuracion(segundos()), duracion_segundos: segundos() }).catch(()=>{});
        }, seg*1000);
      });

    }catch(e){
      console.log('Registro de visita falló (no crítico):', e);
    }
  })();
