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
            alert("Acceso concedido. Panel en construcción en el siguiente archivo.");
            // Aquí enlazaremos la lógica del administrador luego.
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
