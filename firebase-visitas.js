import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
  import { getFirestore, collection, addDoc, serverTimestamp }
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

  (async ()=>{
    try{
      const app = initializeApp(firebaseConfig);
      const db  = getFirestore(app);

      // ID anónimo persistente
      let vid = localStorage.getItem('dv_visitante_id') || '';
      if(!vid){ vid = Date.now()+'_'+Math.floor(Math.random()*900000+100000); localStorage.setItem('dv_visitante_id', vid); }
      const recurrente = localStorage.getItem('dv_ya_visito')==='si';
      localStorage.setItem('dv_ya_visito','si');

      const datos = {
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

      await addDoc(collection(db,'visitas'), datos);
    }catch(e){
      console.log('Registro de visita falló (no crítico):', e);
    }
  })();
