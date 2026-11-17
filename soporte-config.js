/* =====================================================================
   Configuración del soporte de downloaderV (es pública, no es secreta)
   ---------------------------------------------------------------------
   firebase -> app web del proyecto Trollana Edit (la misma que usa tu app)
   worker   -> la dirección de tu servidor de Cloudflare cuando lo crees,
               por ejemplo: 'https://downloaderv-soporte.TU-NOMBRE.workers.dev'
               Mientras esté vacío, el chat muestra el correo de soporte.
   vapidKey -> Firebase -> Configuración del proyecto -> Cloud Messaging ->
               Certificados push web -> "Generar par de claves" (solo panel)
   ===================================================================== */
export const SOPORTE = {
  firebase: {
    apiKey: 'AIzaSyDM5M6tunqXhIDKbu_htEDp9nKmM7IAh6o',
    authDomain: 'trollana-edit-d7049.firebaseapp.com',
    projectId: 'trollana-edit-d7049',
    storageBucket: 'trollana-edit-d7049.firebasestorage.app',
    messagingSenderId: '36633920453',
    appId: '1:36633920453:web:33c2b45da785a7ae0b01ac',
  },
  worker: 'https://downloaderv-soporte.downloaderv.workers.dev',
  vapidKey: 'BD5Xt4njpp23kStA6oxp3Hu7s_jAFyniTLIxT7ShEwxDEPE-bgILf4_u6E_mc-LUMNg-xdZLYcBI95qPJLfrIS4',
  email: 'downloadervtrollana@gmail.com',
  panelUrl: 'https://downloaderv.com/soporte-panel/',
  limiteDia: 3,
};
