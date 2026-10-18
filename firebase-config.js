// Importar funciones principales de Firebase desde el CDN oficial
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, initializeFirestore, persistentLocalCache } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de tu proyecto (Extraída de tu código original)
const firebaseConfig = {
    apiKey: "AIzaSyAsBnD8C_E_o5oHzmw7bWmKrmW2JAjdcaU",
    authDomain: "geomercado-9d642.firebaseapp.com",
    projectId: "geomercado-9d642",
    storageBucket: "geomercado-9d642.firebasestorage.app",
    messagingSenderId: "521126834575",
    appId: "1:521126834575:web:4c847dec3dd57d9a439bfa"
};

// Inicializar la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore con caché local persistente (Crucial para PWA offline)
const db = initializeFirestore(app, { 
    localCache: persistentLocalCache() 
});

// Exportamos 'db' para que nuestro app.js pueda consumirlo de forma segura.
// Al usar 'export', evitamos contaminar el objeto global 'window', 
// previniendo manipulaciones maliciosas desde la consola del navegador.
export { db };
