import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from './firebase-config.js';

/* =========================================
   ESTADO GLOBAL DE LA APLICACIÓN
   ========================================= */
let carrito = [];
let listaProductosYakuza = [];
let nombreEmpresa = "Yakuza Fade Co.";
let subtituloEmpresa = "Barbería, Ropa Oficial & Combos Urbanos";
let headerBannerUrl = "";
let colorAcento = "#ff3333";
let fondoUrl = "";
let tasaManualBs = 0;
let tasaBCVActual = parseFloat(localStorage.getItem('bcv_tasa_cache')) || 36.50;
let metodosPago = { pm: true, binance: true, paypal: true, trans: true, efectivo: true, otro: "" };
let bannersTop = [];
let bannersBottom = [];
let categoriasTienda = ["Combos", "Ropa", "Medias", "Barbería"];
let redesEmpresa = { wsp: "584123167126", ig: "", tk: "", fb: "", yt: "" };

/* =========================================
   1. SEGURIDAD: SANITIZACIÓN DE DATOS
   ========================================= */
// Evita ataques XSS limpiando los textos antes de enviarlos a la base de datos
function sanitizarTexto(texto) {
    if (typeof texto !== 'string') return texto;
    const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', "/": '&#x2F;' };
    return texto.replace(/[&<>"'/]/ig, (match) => (mapa[match]));
}

/* =========================================
   2. CONEXIÓN A FIREBASE (LECTURA EN TIEMPO REAL)
   ========================================= */
onSnapshot(doc(db, "yakuza_store", "catalogo_productos"), (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.nombreEmpresa) nombreEmpresa = data.nombreEmpresa;
        if (data.subtituloEmpresa) subtituloEmpresa = data.subtituloEmpresa;
        if (data.headerBannerUrl !== undefined) headerBannerUrl = data.headerBannerUrl;
        if (data.colorAcento) colorAcento = data.colorAcento;
        if (data.fondoUrl !== undefined) fondoUrl = data.fondoUrl;
        if (data.tasaManualBs !== undefined) tasaManualBs = parseFloat(data.tasaManualBs) || 0;
        if (data.metodosPago) metodosPago = data.metodosPago;
        if (data.bannersTop) bannersTop = data.bannersTop;
        if (data.bannersBottom) bannersBottom = data.bannersBottom;
        if (data.categorias) categoriasTienda = data.categorias;
        if (data.productos) listaProductosYakuza = data.productos;
        if (data.redes) redesEmpresa = data.redes;
        
        obtenerTasaBCV();
    } else {
        renderizarPaginaCompleta();
    }
});

/* =========================================
   3. ANIMACIONES CON ANIME.JS
   ========================================= */
function animarReboteBolita() {
    // Efecto elástico súper profesional al agregar al carrito
    anime({
        targets: '#bolitaCarrito',
        scale: [1, 1.4, 1],
        duration: 600,
        easing: 'easeOutElastic(1, .5)'
    });
}

function animarEntradaModal(idModal) {
    const modal = document.getElementById(idModal);
    modal.style.display = 'flex';
    anime({
        targets: modal,
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
    });
}

function cerrarModalAnimado(idModal) {
    const modal = document.getElementById(idModal);
    anime({
        targets: modal,
        opacity: [1, 0],
        duration: 200,
        easing: 'easeInQuad',
        complete: () => { modal.style.display = 'none'; }
    });
}

/* =========================================
   4. RENDERIZADO DE INTERFAZ (UI)
   ========================================= */
function formatearPrecioUSD(monto) {
    let val = parseFloat(monto) || 0;
    return (val % 1 === 0) ? "$" + val.toFixed(0) : "$" + val.toFixed(2);
}

function formatearPrecioBS(montoUSD) {
    let tasa = (tasaManualBs > 0) ? tasaManualBs : tasaBCVActual;
    if(!tasa || tasa <= 0) tasa = 36.50;
    return ((parseFloat(montoUSD) || 0) * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Bs.";
}

async function obtenerTasaBCV() {
    if(tasaManualBs > 0) {
        document.getElementById('tasaText').innerText = `Tasa Fija: ${tasaManualBs.toFixed(2)} Bs./$`;
        renderizarPaginaCompleta();
        return;
    }
    try {
        let resp = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        let data = await resp.json();
        if(data && data.promedio) {
            tasaBCVActual = parseFloat(data.promedio);
            localStorage.setItem('bcv_tasa_cache', tasaBCVActual);
        }
    } catch(e) {
        console.warn("API BCV falló, usando caché.");
    }
    document.getElementById('tasaText').innerText = `BCV Oficial: ${tasaBCVActual.toFixed(2)} Bs./$`;
    renderizarPaginaCompleta();
}

function renderizarPaginaCompleta() {
    // Aplicar variables de CSS
    document.documentElement.style.setProperty('--color-acento', colorAcento);
    document.body.style.backgroundImage = fondoUrl ? `url('${fondoUrl}')` : 'none';

    // Textos de encabezado
    if(headerBannerUrl) {
        document.getElementById('imgHeaderBannerTarget').src = headerBannerUrl;
        document.getElementById('headerBannerBox').style.display = 'block';
        document.getElementById('headerTextBox').style.display = 'none';
    } else {
        document.getElementById('headerBannerBox').style.display = 'none';
        document.getElementById('headerTextBox').style.display = 'block';
        document.getElementById('brandHeader').innerText = nombreEmpresa;
        document.getElementById('brandSubHeader').innerText = subtituloEmpresa;
    }

    document.getElementById('pageTitle').innerText = `${nombreEmpresa} - Tienda`;
    document.getElementById('footerCopy').innerText = `${nombreEmpresa}. Todos los derechos reservados.`;

    // Filtros
    const filtrosContainer = document.getElementById('contenedorFiltrosCat');
    let btnFiltrosHtml = `<button class="btn-filtro activo" data-action="filter-cat" data-cat="todos">Todos</button>`;
    categoriasTienda.forEach(c => {
        btnFiltrosHtml += `<button class="btn-filtro" data-action="filter-cat" data-cat="${c.toLowerCase().trim()}">${c.trim()}</button>`;
    });
    filtrosContainer.innerHTML = btnFiltrosHtml;

    renderizarProductosTienda();
}

function renderizarProductosTienda() {
    const container = document.getElementById('listaProductosContainer');
    if(!container) return;
    
    if(listaProductosYakuza.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); font-size:13px; grid-column:1/-1;">No hay productos disponibles en el catálogo.</div>';
        return;
    }

    let html = "";
    listaProductosYakuza.forEach(p => {
        const estaAgotado = p.stock < 1;
        const btnTexto = estaAgotado ? "AGOTADO" : "Añadir al Carrito";
        const badgeHtml = p.badge ? `<div class="badge-combo">${p.badge}</div>` : '';
        const slidesHtml = p.imgs.map((img, i) => `<img src="${img}" alt="Producto" data-action="zoom-img" data-id="${p.id}" data-idx="${i}">`).join('');
        
        // Estructura segura y limpia con data-actions (Sin onclick inline)
        html += `
            <div class="producto" data-categoria="${p.categoria.toLowerCase().trim()}" data-nombre="${p.nombre.toLowerCase()}">
                ${badgeHtml}
                <div class="carrusel-container">
                    <div class="carrusel-slides" id="slides-${p.id}">${slidesHtml}</div>
                </div>
                
                <div class="stock-indicator ${estaAgotado ? 'agotado' : ''}">
                    Stock: <span>${estaAgotado ? 'Agotado' : p.stock + ' unids.'}</span>
                </div>

                <h3>${p.nombre}</h3>
                <p>${p.desc}</p>
                
                <div class="precio-box">
                    <span class="precio-usd">${formatearPrecioUSD(p.precio)}</span>
                    <span class="precio-bs">≈ ${formatearPrecioBS(p.precio)}</span>
                </div>

                <div class="cantidad-container">
                    <span>Cant:</span>
                    <div>
                        <button type="button" data-action="qty-change" data-dir="-1">-</button>
                        <span class="contador-val">1</span>
                        <button type="button" data-action="qty-change" data-dir="1">+</button>
                    </div>
                </div>

                <button type="button" class="btn-agregar-carrito" ${estaAgotado ? 'disabled' : ''} data-action="add-cart" data-id="${p.id}">
                    ${btnTexto}
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

/* =========================================
   5. LÓGICA DEL CARRITO
   ========================================= */
function actualizarBarraCarrito() {
    let totalItems = 0; let totalMontoUSD = 0;
    carrito.forEach(i => { totalItems += i.cantidad; totalMontoUSD += (i.precio * i.cantidad); });
    
    let tasa = (tasaManualBs > 0) ? tasaManualBs : tasaBCVActual;
    let totalMontoBS = totalMontoUSD * tasa;

    document.getElementById('badgeBolitaTotal').innerText = totalItems;
    document.getElementById('modalMontoTotalUSD').innerText = formatearPrecioUSD(totalMontoUSD);
    document.getElementById('modalMontoTotalBS').innerText = totalMontoBS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Bs.";
    
    const bolita = document.getElementById('bolitaCarrito');
    if(totalItems > 0 && bolita.style.display === 'none') {
        bolita.style.display = 'flex';
        // Animación suave de entrada de la bolita
        anime({ targets: bolita, scale: [0, 1], duration: 400 });
    } else if (totalItems === 0) {
        bolita.style.display = 'none';
    }
}

function renderizarModalCarrito() {
    const cont = document.getElementById('listaItemsModal');
    let html = "";
    let tasa = (tasaManualBs > 0) ? tasaManualBs : tasaBCVActual;

    carrito.forEach((i, idx) => {
        let subUSD = i.precio * i.cantidad;
        let subBS = subUSD * tasa;
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #222; padding:8px 0; font-size:12px;">
                <div>
                    <strong style="color:var(--text-light);">${i.nombre}</strong><br>
                    <small style="color:var(--text-muted);">Cant: ${i.cantidad}</small><br>
                    <span style="color:var(--text-light); font-weight:bold;">${formatearPrecioUSD(subUSD)}</span>
                    <span style="color:var(--text-success); font-size:11px; margin-left:4px;">(≈ ${subBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.)</span>
                </div>
                <button style="background:var(--color-acento); color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" data-action="remove-cart" data-idx="${idx}">Quitar</button>
            </div>
        `;
    });
    cont.innerHTML = html || '<p style="color:var(--text-muted); text-align:center;">Carrito vacío.</p>';

    // Botones de pago limpios (Sin emojis)
    const btnPagoContainer = document.getElementById('contenedorMetodosPagoModal');
    let btnHtml = "";
    if(metodosPago.pm !== false) btnHtml += `<button class="btn-agregar-carrito" style="background:#25d366; margin-bottom:6px;" data-action="pay" data-method="Pago Móvil">Pagar con Pago Móvil (Bs.)</button>`;
    if(metodosPago.binance !== false) btnHtml += `<button class="btn-agregar-carrito" style="background:#f3ba2f; color:#000; margin-bottom:6px;" data-action="pay" data-method="Binance P2P">Pagar con Binance / USDT</button>`;
    if(metodosPago.efectivo !== false) btnHtml += `<button class="btn-agregar-carrito" style="background:#20bf6b; margin-bottom:6px;" data-action="pay" data-method="Efectivo">Pago en Efectivo</button>`;
    
    btnPagoContainer.innerHTML = btnHtml || '<div style="color:var(--text-muted); font-size:11px;">Consulte métodos al vendedor.</div>';
}

function enviarPedidoWhatsApp(metodo) {
    if(carrito.length === 0) return;
    let tasa = (tasaManualBs > 0) ? tasaManualBs : tasaBCVActual;
    let msj = `*${nombreEmpresa.toUpperCase()} - NUEVO PEDIDO*\n\n`;
    let totalUSD = 0;

    carrito.forEach(i => {
        let subUSD = i.precio * i.cantidad;
        totalUSD += subUSD;
        msj += `▪️ *${i.nombre}* | Cant: ${i.cantidad} = ${formatearPrecioUSD(subUSD)}\n`;
    });

    msj += `\n💵 *TOTAL USD:* ${formatearPrecioUSD(totalUSD)}\n`;
    msj += `🇻🇪 *TOTAL BS:* ${(totalUSD * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs. (Tasa: ${tasa.toFixed(2)})\n`;
    msj += `💳 *Método:* ${metodo}`;

    carrito = [];
    actualizarBarraCarrito();
    cerrarModalAnimado('modalCarrito');
    window.open(`https://wa.me/${redesEmpresa.wsp}?text=${encodeURIComponent(msj)}`, '_blank');
}

/* =========================================
   6. DELEGACIÓN DE EVENTOS (El Motor)
   ========================================= */
document.addEventListener('click', (e) => {
    // Buscamos si el elemento clicado o su padre tiene un 'data-action'
    const target = e.target.closest('[data-action]');
    
    // Si hicieron click en la bolita del carrito (abrir modal)
    if(e.target.closest('#bolitaCarrito')) {
        renderizarModalCarrito();
        animarEntradaModal('modalCarrito');
        return;
    }

    // Si hicieron click en cerrar carrito
    if(e.target.closest('#btnCerrarCarrito')) {
        cerrarModalAnimado('modalCarrito');
        return;
    }

        // Click en la zona secreta del administrador
    if(e.target.id === 'btnAreaAdmin') {
        const clave = prompt("Clave Administrador:");
        if(clave === "612003" || clave === "yakuza") {
            abrirPanelAdmin();
        } else if (clave) {
            alert("Clave incorrecta.");
        }
        return;
    }
   

    if (!target) return;
    const action = target.dataset.action;

    switch(action) {
        case 'filter-cat':
            document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('activo'));
            target.classList.add('activo');
            const cat = target.dataset.cat;
            document.querySelectorAll('.producto').forEach(p => {
                p.style.display = (cat === 'todos' || p.dataset.categoria === cat) ? 'flex' : 'none';
            });
            break;

        case 'qty-change':
            const dir = parseInt(target.dataset.dir);
            const span = target.parentNode.querySelector('.contador-val');
            let cant = parseInt(span.innerText) + dir;
            if(cant < 1) cant = 1;
            span.innerText = cant;
            break;

        case 'add-cart':
            const idProd = parseInt(target.dataset.id);
            const tarjeta = target.closest('.producto');
            const prodObj = listaProductosYakuza.find(p => p.id === idProd);
            const c = parseInt(tarjeta.querySelector('.contador-val').innerText);
            
            if(c > prodObj.stock) {
                alert(`Solo quedan ${prodObj.stock} unidades disponibles.`);
                return;
            }

            const existente = carrito.find(i => i.id === idProd);
            if(existente) {
                existente.cantidad += c;
            } else {
                carrito.push({ id: idProd, nombre: prodObj.nombre, precio: prodObj.precio, cantidad: c });
            }

            actualizarBarraCarrito();
            animarReboteBolita(); // <--- ANIMACIÓN AQUÍ
            
            // Efecto de botón añadido
            const txtOriginal = target.innerText;
            target.innerText = "¡Agregado!";
            target.style.background = "var(--text-success)";
            setTimeout(() => { 
                target.innerText = txtOriginal; 
                target.style.background = "var(--color-acento)"; 
            }, 1000);
            break;

        case 'remove-cart':
            carrito.splice(parseInt(target.dataset.idx), 1);
            actualizarBarraCarrito();
            renderizarModalCarrito();
            break;

        case 'pay':
            enviarPedidoWhatsApp(target.dataset.method);
            break;
    }
});

// Buscador en tiempo real
document.getElementById('inputBuscador').addEventListener('keyup', (e) => {
    const txt = e.target.value.toLowerCase();
    document.querySelectorAll('.producto').forEach(p => {
        p.style.display = p.dataset.nombre.includes(txt) ? 'flex' : 'none';
    });
});
/* =========================================
   7. REGISTRO DEL SERVICE WORKER (PWA)
   ========================================= */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registro => {
                console.log('Service Worker registrado con éxito.', registro.scope);
            })
            .catch(error => {
                console.warn('Error al registrar el Service Worker', error);
            });
    });
}
/* =========================================
   8. SISTEMA DE ADMINISTRADOR SEGURIZADO
   ========================================= */
let idProductoEdicion = null;

function guardarEnNubeYakuza() {
    // Sanitizamos variables globales antes de subir
    setDoc(doc(db, "yakuza_store", "catalogo_productos"), {
        nombreEmpresa: sanitizarTexto(nombreEmpresa) || "Yakuza Fade Co.",
        subtituloEmpresa: sanitizarTexto(subtituloEmpresa) || "Barbería, Ropa Oficial",
        headerBannerUrl: headerBannerUrl || "",
        colorAcento: colorAcento || "#ff3333",
        fondoUrl: fondoUrl || "",
        tasaManualBs: parseFloat(tasaManualBs) || 0,
        metodosPago: metodosPago,
        bannersTop: bannersTop,
        bannersBottom: bannersBottom,
        categorias: categoriasTienda,
        productos: listaProductosYakuza,
        redes: redesEmpresa
    }).then(() => {
        alert("Configuración y productos guardados en la nube con éxito.");
    }).catch(e => {
        console.error("Error al guardar:", e);
        alert("Hubo un error al guardar en la base de datos.");
    });
}

function abrirPanelAdmin() {
    const contenedor = document.getElementById('modalAdminPanel');
    
    // Inyectamos el HTML del panel usando diseño limpio sin emojis (Regla 7)
    contenedor.innerHTML = `
        <div class="modal-contenido" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Panel de Control</h2>
                <button class="btn-cerrar-modal" onclick="document.getElementById('modalAdminPanel').style.display='none'">
                    <svg width="20" height="20"><use href="#icon-close"></use></svg>
                </button>
            </div>
            
            <div style="background: var(--bg-input); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--border-color);">
                <h3 style="color: var(--color-acento); font-size: 14px; margin-bottom: 10px;">CONFIGURACIÓN GLOBAL</h3>
                
                <label style="font-size:11px; color:var(--text-muted);">Nombre de la Empresa:</label>
                <input type="text" id="adm-empresa" value="${nombreEmpresa}" style="width:100%; padding:8px; margin-bottom:10px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                
                <label style="font-size:11px; color:var(--text-muted);">Tasa Dólar Manual (0 = Automático BCV):</label>
                <input type="number" step="0.01" id="adm-tasa" value="${tasaManualBs}" style="width:100%; padding:8px; margin-bottom:10px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                
                <label style="font-size:11px; color:var(--text-muted);">Color Principal (Acento):</label>
                <input type="color" id="adm-color" value="${colorAcento}" style="width:100%; height:35px; border:none; background:none; cursor:pointer; margin-bottom:10px;">
                
                <h4 style="font-size:12px; color:#fff; margin-bottom:5px; margin-top:10px;">Métodos de Pago Activos</h4>
                <label style="font-size:12px; display:block;"><input type="checkbox" id="adm-pm" ${metodosPago.pm ? 'checked' : ''}> Pago Móvil</label>
                <label style="font-size:12px; display:block;"><input type="checkbox" id="adm-binance" ${metodosPago.binance ? 'checked' : ''}> Binance P2P</label>
                <label style="font-size:12px; display:block; margin-bottom:10px;"><input type="checkbox" id="adm-efectivo" ${metodosPago.efectivo ? 'checked' : ''}> Efectivo</label>
            </div>

            <div style="background: var(--bg-input); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--border-color);">
                <h3 id="titulo-form-admin" style="color: var(--color-acento); font-size: 14px; margin-bottom: 10px;">AGREGAR / EDITAR PRODUCTO</h3>
                
                <input type="text" id="adm-p-nombre" placeholder="Nombre del Producto" style="width:100%; padding:8px; margin-bottom:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                <input type="text" id="adm-p-desc" placeholder="Descripción corta" style="width:100%; padding:8px; margin-bottom:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                
                <div style="display:flex; gap:8px; margin-bottom:8px;">
                    <input type="number" step="0.01" id="adm-p-precio" placeholder="Precio ($)" style="width:50%; padding:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                    <input type="number" id="adm-p-stock" placeholder="Stock (Cant)" style="width:50%; padding:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                </div>

                <select id="adm-p-cat" style="width:100%; padding:8px; margin-bottom:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                    ${categoriasTienda.map(c => `<option value="${c.toLowerCase().trim()}">${c.trim()}</option>`).join('')}
                </select>

                <input type="text" id="adm-p-tallas" placeholder="Tallas separadas por coma (S, M, L)" style="width:100%; padding:8px; margin-bottom:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                <input type="text" id="adm-p-img1" placeholder="URL Imagen Principal" style="width:100%; padding:8px; margin-bottom:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                
                <button onclick="guardarProductoDesdeAdmin()" class="btn-agregar-carrito">Guardar Producto en Catálogo</button>
                <button onclick="limpiarFormAdmin()" style="width:100%; padding:10px; margin-top:8px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer;">Limpiar Formulario</button>
            </div>

            <div style="background: var(--bg-input); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
                <h3 style="color: var(--color-acento); font-size: 14px; margin-bottom: 10px;">CATÁLOGO ACTUAL</h3>
                <div id="adminTarjetasProductos"></div>
            </div>
            
            <button onclick="guardarConfiguracionTotal()" style="width:100%; padding:12px; margin-top:15px; background:var(--text-success); color:#fff; font-weight:bold; border:none; border-radius:6px; cursor:pointer;">
                [ SUBIR TODO A LA NUBE ]
            </button>
        </div>
    `;

    contenedor.style.display = 'flex';
    anime({ targets: contenedor, opacity: [0, 1], duration: 300, easing: 'easeOutQuad' });
    renderizarTarjetasAdmin();
}

// Expulsamos las funciones al entorno global (window) para que los botones inyectados puedan leerlas
window.guardarConfiguracionTotal = function() {
    nombreEmpresa = document.getElementById('adm-empresa').value.trim() || "Yakuza Fade Co.";
    tasaManualBs = parseFloat(document.getElementById('adm-tasa').value) || 0;
    colorAcento = document.getElementById('adm-color').value || "#ff3333";
    
    metodosPago = {
        pm: document.getElementById('adm-pm').checked,
        binance: document.getElementById('adm-binance').checked,
        paypal: metodosPago.paypal,
        trans: metodosPago.trans,
        efectivo: document.getElementById('adm-efectivo').checked,
        otro: metodosPago.otro
    };

    guardarEnNubeYakuza();
    document.getElementById('modalAdminPanel').style.display = 'none';
    renderizarPaginaCompleta();
};

window.guardarProductoDesdeAdmin = function() {
    const nom = sanitizarTexto(document.getElementById('adm-p-nombre').value.trim());
    const desc = sanitizarTexto(document.getElementById('adm-p-desc').value.trim());
    const precio = parseFloat(document.getElementById('adm-p-precio').value) || 0;
    const stock = parseInt(document.getElementById('adm-p-stock').value) || 0;
    const cat = sanitizarTexto(document.getElementById('adm-p-cat').value);
    const tallasStr = sanitizarTexto(document.getElementById('adm-p-tallas').value.trim());
    const img1 = sanitizarTexto(document.getElementById('adm-p-img1').value.trim());

    if(nom && precio > 0) {
        const tallas = tallasStr ? tallasStr.split(',').map(s=>s.trim()) : ["Única"];
        const imgs = img1 ? [img1] : ["https://files.catbox.moe/8j9706.jpg"];

        const itemData = {
            id: idProductoEdicion || Date.now(),
            nombre: nom, 
            desc: desc, 
            precio: precio, 
            stock: stock,
            categoria: cat, 
            tallas: tallas, 
            imgs: imgs,
            tipoOpcion: "ninguna"
        };

        if(idProductoEdicion !== null) {
            const index = listaProductosYakuza.findIndex(x => x.id === idProductoEdicion);
            if(index !== -1) listaProductosYakuza[index] = itemData;
        } else {
            listaProductosYakuza.push(itemData);
        }

        limpiarFormAdmin();
        renderizarTarjetasAdmin();
        alert("Producto agregado a la lista temporal. Recuerda presionar [ SUBIR TODO A LA NUBE ] para guardar los cambios.");
    } else {
        alert("El nombre y el precio son obligatorios.");
    }
};

window.limpiarFormAdmin = function() {
    idProductoEdicion = null;
    document.getElementById('titulo-form-admin').innerText = "AGREGAR NUEVO PRODUCTO";
    document.getElementById('adm-p-nombre').value = "";
    document.getElementById('adm-p-desc').value = "";
    document.getElementById('adm-p-precio').value = "";
    document.getElementById('adm-p-stock').value = "";
    document.getElementById('adm-p-tallas').value = "";
    document.getElementById('adm-p-img1').value = "";
};

window.cargarProductoParaEditar = function(id) {
    const p = listaProductosYakuza.find(x => x.id === id);
    if(!p) return;
    idProductoEdicion = p.id;
    document.getElementById('titulo-form-admin').innerText = "EDITANDO: " + p.nombre.toUpperCase();
    document.getElementById('adm-p-nombre').value = p.nombre;
    document.getElementById('adm-p-desc').value = p.desc;
    document.getElementById('adm-p-precio').value = p.precio;
    document.getElementById('adm-p-stock').value = p.stock;
    document.getElementById('adm-p-cat').value = p.categoria;
    document.getElementById('adm-p-tallas').value = p.tallas ? p.tallas.join(', ') : "";
    document.getElementById('adm-p-img1').value = p.imgs[0] || "";
};

window.eliminarProductoAdmin = function(id) {
    if(confirm("¿Seguro que deseas eliminar este producto de la lista?")) {
        listaProductosYakuza = listaProductosYakuza.filter(x => x.id !== id);
        renderizarTarjetasAdmin();
    }
};

function renderizarTarjetasAdmin() {
    const cont = document.getElementById('adminTarjetasProductos');
    if(!cont) return;
    let html = "";
    listaProductosYakuza.forEach(p => {
        html += `
            <div style="background:#1e1e1e; border:1px solid #333; padding:10px; border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color:#fff; font-size:12px;">${p.nombre}</strong><br>
                    <span style="color:var(--text-success); font-size:11px;">$${p.precio} | Stock: ${p.stock}</span>
                </div>
                <div>
                    <button style="background:var(--color-acento); color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer;" onclick="cargarProductoParaEditar(${p.id})">Editar</button>
                    <button style="background:#333; color:var(--color-acento); border:1px solid #444; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer;" onclick="eliminarProductoAdmin(${p.id})">Borrar</button>
                </div>
            </div>
        `;
    });
    cont.innerHTML = html || '<div style="color:#aaa; font-size:11px;">No hay productos registrados.</div>';
       }
