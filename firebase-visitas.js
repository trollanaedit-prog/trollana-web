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
  function formatoDuracion(seg){
    if(seg < 60) return seg + ' s';
    const m = Math.floor(seg/60), s = seg%60;
    if(m < 60) return s ? `${m} min ${s} s` : `${m} min`;
    const h = Math.floor(m/60), mm = m%60;
    return mm ? `${h} h ${mm} min` : `${h} h`;
  }

  (function(){
    const inicio = Date.now();
    let ref = null;            // referencia al documento de la visita
    let descargo = false;      // ¿pulsó Descargar?
    const segundos = ()=> Math.max(0, Math.round((Date.now()-inicio)/1000));
    const textoDescarga = ()=> descargo ? '✅ SÍ — pulsó descargar' : '❌ NO — solo visitó';
    let ultimaDur = -1;        // evita escribir la misma duración dos veces

    // Actualiza el documento (cuando ya exista la referencia). Nunca rompe nada.
    function actualizar(campos){
      if(!ref) return;
      updateDoc(ref, campos).catch(err=> console.log('visita update:', err && err.code));
    }
    function guardarDuracion(){
      const s = segundos();
      if(s === ultimaDur) return;   // si no ha cambiado, no escribe (ahorra)
      ultimaDur = s;
      actualizar({ _duracion: formatoDuracion(s), duracion_segundos: s,
                   _descarga: textoDescarga(), descargo });
    }
    function marcarDescarga(){
      if(descargo) return; descargo = true;
      actualizar({ _descarga: textoDescarga(), descargo: true,
                   _duracion: formatoDuracion(segundos()), duracion_segundos: segundos() });
    }

    // --- Detectar clic en botones de descarga (pointerdown = lo antes posible) ---
    function esDescarga(e){
      return e.target.closest('#heroDl, #ctaDl, .dl-btn, a[href*=".exe"], a[href*=".apk"], a[href*="releases/download"]');
    }
    document.addEventListener('pointerdown', e=>{ if(esDescarga(e)) marcarDescarga(); }, true);
    document.addEventListener('click',       e=>{ if(esDescarga(e)) marcarDescarga(); }, true);

    // --- Guardar la duración al salir / cambiar de pestaña / ocultar ---
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') guardarDuracion(); });
    window.addEventListener('pagehide', guardarDuracion);
    window.addEventListener('beforeunload', guardarDuracion);

    // --- Guardar la duración en hitos (por si cierra de golpe). Pocas escrituras. ---
    [10, 30, 60, 120, 300, 900, 1800].forEach(seg=>{
      setTimeout(()=> guardarDuracion(), seg*1000);
    });

    (async ()=>{
      try{
        const app = initializeApp(firebaseConfig);
        const db  = getFirestore(app);

        let vid = localStorage.getItem('dv_visitante_id') || '';
        if(!vid){ vid = Date.now()+'_'+Math.floor(Math.random()*900000+100000); localStorage.setItem('dv_visitante_id', vid); }
        const recurrente = localStorage.getItem('dv_ya_visito')==='si';
        localStorage.setItem('dv_ya_visito','si');

        const datos = {
          // ===== ARRIBA DEL TODO ("_" hace que salgan los primeros en Firestore) =====
          _descarga: textoDescarga(),
          _duracion: '0 s',
          // ===== resto =====
          descargo: descargo,
          duracion_segundos: 0,
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

        // 1) CREAR EL DOCUMENTO YA (rápido) -> la referencia queda lista al instante
        ref = await addDoc(collection(db,'visitas'), datos);

        // Si ya pulsó descargar o ya pasó tiempo mientras se creaba, lo reflejamos
        if(descargo || segundos()>0) guardarDuracion();

        // 2) Ubicación aproximada por IP (sin clave) -> se añade después con updateDoc
        try{
          const ctrl = new AbortController();
          const t = setTimeout(()=>ctrl.abort(), 5000);
          const r = await fetch('https://ipwho.is/', {signal: ctrl.signal});
          clearTimeout(t);
          if(r.ok){
            const g = await r.json();
            if(g && g.success){
              actualizar({
                ip: g.ip, pais: g.country, pais_codigo: g.country_code,
                region: g.region, ciudad: g.city,
                latitud: g.latitude, longitud: g.longitude,
                isp: g.connection?.isp, organizacion: g.connection?.org,
              });
            }
          }
        }catch(_){ /* sin geo, seguimos */ }

      }catch(e){
        console.log('Registro de visita falló (no crítico):', e);
      }
    })();
  })();
