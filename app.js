import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from './firebase-config.js';

/* =========================================
   ESTADO GLOBAL
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
let metodosPago = { pm: true, binance: true, paypal: false, trans: false, efectivo: true, otro: "" };
let bannersTop = [];
let bannersBottom = [];
let categoriasTienda = ["Combos", "Ropa", "Medias", "Barbería"];
let redesEmpresa = { wsp: "584123167126", ig: "", tk: "", fb: "", yt: "" };

let indicesCarrusel = {};

/* =========================================
   1. SEGURIDAD: SANITIZACIÓN DE DATOS
   ========================================= */
function sanitizarTexto(texto) {
    if (typeof texto !== 'string') return texto;
    const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', "/": '&#x2F;' };
    return texto.replace(/[&<>"'/]/ig, (match) => (mapa[match]));
}

/* =========================================
   2. CONEXIÓN A FIREBASE
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
        
        obtenerTasaBCV(false);
    } else {
        renderizarPaginaCompleta();
    }
});

/* =========================================
   3. ANIMACIONES (ANIME.JS)
   ========================================= */
function animarReboteBolita() {
    anime({ targets: '#bolitaCarrito', scale: [1, 1.4, 1], duration: 600, easing: 'easeOutElastic(1, .5)' });
}
function animarEntradaModal(idModal) {
    const modal = document.getElementById(idModal);
    modal.style.display = 'flex';
    anime({ targets: modal, opacity: [0, 1], duration: 300, easing: 'easeOutQuad' });
}
function cerrarModalAnimado(idModal) {
    const modal = document.getElementById(idModal);
    anime({ targets: modal, opacity: [1, 0], duration: 200, easing: 'easeInQuad', complete: () => { modal.style.display = 'none'; }});
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
    return ((parseFloat(montoUSD) || 0) * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function obtenerTasaBCV(forzarAlert = false) {
    if(tasaManualBs > 0) {
        document.getElementById('tasaText').innerText = `Fija: ${tasaManualBs.toFixed(2)}`;
        if(forzarAlert) alert("Usando Tasa Manual Fija.");
        renderizarPaginaCompleta();
        return;
    }
    try {
        let resp = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        let data = await resp.json();
        if(data && data.promedio) {
            tasaBCVActual = parseFloat(data.promedio);
            localStorage.setItem('bcv_tasa_cache', tasaBCVActual);
            if(forzarAlert) alert("Tasa BCV actualizada desde internet con éxito.");
        }
    } catch(e) {
        if(forzarAlert) alert("Fallo al conectar con BCV. Usando última tasa guardada.");
    }
    document.getElementById('tasaText').innerText = `Oficial: ${tasaBCVActual.toFixed(2)}`;
    renderizarPaginaCompleta();
}

function renderizarCarruselPublicitario(wrapId, slidesId, dotsId, listaImgs) {
    const wrap = document.getElementById(wrapId);
    const slidesBox = document.getElementById(slidesId);
    const dotsBox = document.getElementById(dotsId);

    if(!listaImgs || listaImgs.length === 0) {
        wrap.style.display = 'none';
        return;
    }

    wrap.style.display = 'block';
    slidesBox.innerHTML = listaImgs.map(img => `<img src="${img}" alt="Anuncio">`).join('');
    dotsBox.innerHTML = listaImgs.map((_, i) => `<div class="dot ${i===0?'activo':''}"></div>`).join('');
    
    // Lógica básica de auto-play omitida para brevedad, se añade con CSS/JS en el swipe
}

function renderizarPaginaCompleta() {
    document.documentElement.style.setProperty('--color-acento', colorAcento);
    document.body.style.backgroundImage = fondoUrl ? `url('${fondoUrl}')` : 'none';

    if(headerBannerUrl) {
        document.getElementById('imgHeaderBannerTarget').src = headerBannerUrl;
        document.getElementById('headerBannerBox').style.display = 'block';
        document.getElementById('logoPrincipal').style.display = 'none';
    } else {
        document.getElementById('headerBannerBox').style.display = 'none';
        document.getElementById('logoPrincipal').style.display = 'block';
    }
    document.getElementById('brandSubHeader').innerText = subtituloEmpresa;
    
    renderizarCarruselPublicitario('bannerTopWrapper', 'bannerTopSlides', 'bannerTopDots', bannersTop);
    renderizarCarruselPublicitario('bannerBottomWrapper', 'bannerBottomSlides', 'bannerBottomDots', bannersBottom);

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
        container.innerHTML = '<div style="color:var(--text-muted); font-size:13px; grid-column:1/-1;">No hay productos disponibles.</div>';
        return;
    }

    let html = "";
    listaProductosYakuza.forEach(p => {
        const estaAgotado = p.stock < 1;
        const btnTexto = estaAgotado ? "AGOTADO" : "Añadir al Carrito";
        const badgeHtml = p.badge ? `<div class="badge-combo">${p.badge}</div>` : '';
        const slidesHtml = p.imgs.map((img, i) => `<img src="${img}" alt="Producto" data-action="zoom-img" data-src="${img}">`).join('');
        
        let tallasOpt = (p.tallas && p.tallas.length > 0) ? p.tallas.map(t => `<a href="#" data-action="select-opt" data-val="${t}">${t}</a>`).join('') : `<a href="#" data-action="select-opt" data-val="Única">Única</a>`;
        let listaOpciones = p.opciones || [];
        let labelOpcion = p.tipoOpcion === 'material' ? 'Material' : 'Color';
        
        let opcionesGridHtml = `
            <div class="dropdown-contenedor">
                <button type="button" data-action="toggle-drop" class="btn-desplegable">Talla: <span class="talla-elegida">${p.tallas ? p.tallas[0] : "Única"}</span> ▾</button>
                <div class="dropdown-content">${tallasOpt}</div>
            </div>
        `;

        if(p.tipoOpcion && p.tipoOpcion !== 'ninguna' && listaOpciones.length > 0) {
            let opcItems = listaOpciones.map(c => `<a href="#" data-action="select-opt" data-val="${c}">${c}</a>`).join('');
            opcionesGridHtml += `
                <div class="dropdown-contenedor">
                    <button type="button" data-action="toggle-drop" class="btn-desplegable">${labelOpcion}: <span class="opcion-elegida">${listaOpciones[0]}</span> ▾</button>
                    <div class="dropdown-content">${opcItems}</div>
                </div>
            `;
        }

        html += `
            <div class="producto" data-categoria="${p.categoria.toLowerCase().trim()}" data-nombre="${p.nombre.toLowerCase()}">
                ${badgeHtml}
                <div class="carrusel-container swipe-area" data-id="${p.id}">
                    <div class="carrusel-slides" id="slides-${p.id}">
                        ${slidesHtml}
                    </div>
                </div>
                
                <div class="stock-indicator ${estaAgotado ? 'agotado' : ''}">
                    Stock: <span>${estaAgotado ? 'Agotado' : p.stock + ' unids.'}</span>
                </div>

                <h3>${p.nombre}</h3>
                <p>${p.desc}</p>
                
                <div class="precio-box">
                    <span class="precio-usd">${formatearPrecioUSD(p.precio)}</span>
                    <span class="precio-bs">≈ ${formatearPrecioBS(p.precio)} Bs.</span>
                </div>
                
                <div class="opciones-grid">
                    ${opcionesGridHtml}
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
    activarSwipeCarruseles();
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
                    <small style="color:var(--text-muted);">${i.variacion} | Cant: ${i.cantidad}</small><br>
                    <span style="color:var(--text-light); font-weight:bold;">${formatearPrecioUSD(subUSD)}</span>
                    <span style="color:var(--text-success); font-size:11px; margin-left:4px;">(≈ ${subBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.)</span>
                </div>
                <button class="btn-icon-danger" data-action="remove-cart" data-idx="${idx}">
                    <svg width="16" height="16"><use href="#icon-close"></use></svg>
                </button>
            </div>
        `;
    });
    cont.innerHTML = html || '<p style="color:var(--text-muted); text-align:center;">Carrito vacío.</p>';

    document.getElementById('btnVaciarCarrito').style.display = carrito.length > 0 ? 'inline-block' : 'none';

    // Botones de pago 100% Gráficos (Sin Texto)
    const btnPagoContainer = document.getElementById('contenedorMetodosPagoModal');
    let btnHtml = "";
    if(metodosPago.pm) btnHtml += `<button class="btn-pago-img" data-action="pay" data-method="Pago Móvil"><img src="pagomovil.png" alt="Pago Móvil"></button>`;
    if(metodosPago.binance) btnHtml += `<button class="btn-pago-img" data-action="pay" data-method="Binance P2P"><img src="binance.png" alt="Binance"></button>`;
    if(metodosPago.efectivo) btnHtml += `<button class="btn-pago-img" data-action="pay" data-method="Efectivo"><img src="efectivo.png" alt="Efectivo"></button>`;
    
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
        msj += `▪️ *${i.nombre}*\n   ${i.variacion} | Cant: ${i.cantidad} = ${formatearPrecioUSD(subUSD)}\n`;
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
    const target = e.target.closest('[data-action]');
    
    // Si haces clic fuera de un menú desplegable, ciérralos todos
    if(!e.target.closest('.dropdown-contenedor')) {
        document.querySelectorAll('.dropdown-content').forEach(c => c.classList.remove('show'));
    }

    if(e.target.closest('#bolitaCarrito')) {
        renderizarModalCarrito();
        animarEntradaModal('modalCarrito');
        return;
    }

    if(e.target.closest('#btnCerrarCarrito')) {
        cerrarModalAnimado('modalCarrito');
        return;
    }

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

        case 'toggle-drop':
            e.stopPropagation();
            const menu = target.nextElementSibling;
            document.querySelectorAll('.dropdown-content').forEach(c => { if(c!==menu) c.classList.remove('show'); });
            menu.classList.toggle('show');
            break;

        case 'select-opt':
            e.preventDefault();
            const val = target.dataset.val;
            const parent = target.closest('.dropdown-contenedor');
            const span = parent.querySelector('.talla-elegida') || parent.querySelector('.opcion-elegida');
            if(span) span.innerText = val;
            parent.querySelector('.dropdown-content').classList.remove('show');
            break;

        case 'qty-change':
            const dir = parseInt(target.dataset.dir);
            const qtySpan = target.parentNode.querySelector('.contador-val');
            let cantNum = parseInt(qtySpan.innerText) + dir;
            if(cantNum < 1) cantNum = 1;
            qtySpan.innerText = cantNum;
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

            const spanTalla = tarjeta.querySelector('.talla-elegida');
            const spanOpc = tarjeta.querySelector('.opcion-elegida');
            const txtTalla = spanTalla ? spanTalla.innerText : "Única";
            let varStr = `Talla: ${txtTalla}`;
            if(spanOpc) varStr += ` | Opción: ${spanOpc.innerText}`;

            const existente = carrito.find(i => i.id === idProd && i.variacion === varStr);
            if(existente) {
                if(existente.cantidad + c > prodObj.stock) {
                    alert("Stock insuficiente.");
                    return;
                }
                existente.cantidad += c;
            } else {
                carrito.push({ id: idProd, nombre: prodObj.nombre, precio: prodObj.precio, cantidad: c, variacion: varStr });
            }

            actualizarBarraCarrito();
            animarReboteBolita();
            
            const txtOriginal = target.innerText;
            target.innerText = "¡Agregado!";
            target.style.background = "var(--text-success)";
            setTimeout(() => { target.innerText = txtOriginal; target.style.background = "var(--color-acento)"; }, 1000);
            break;

        case 'remove-cart':
            carrito.splice(parseInt(target.dataset.idx), 1);
            actualizarBarraCarrito();
            renderizarModalCarrito();
            break;
            
        case 'empty-cart':
            if(confirm("¿Seguro que deseas eliminar todos los productos?")) {
                carrito = [];
                actualizarBarraCarrito();
                renderizarModalCarrito();
            }
            break;

        case 'pay':
            enviarPedidoWhatsApp(target.dataset.method);
            break;

        case 'zoom-img':
            document.getElementById('imgZoomTarget').src = target.dataset.src;
            animarEntradaModal('modalZoom');
            break;

        case 'close-zoom':
            cerrarModalAnimado('modalZoom');
            break;

        case 'update-bcv-api':
            obtenerTasaBCV(true);
            break;
    }
});

document.getElementById('inputBuscador').addEventListener('keyup', (e) => {
    const txt = e.target.value.toLowerCase();
    document.querySelectorAll('.producto').forEach(p => {
        p.style.display = p.dataset.nombre.includes(txt) ? 'flex' : 'none';
    });
});

/* =========================================
   7. SWIPE EN FOTOS DE PRODUCTOS
   ========================================= */
function activarSwipeCarruseles() {
    document.querySelectorAll('.swipe-area').forEach(box => {
        let startX = 0;
        let idProd = box.dataset.id;
        box.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive: true});
        box.addEventListener('touchend', e => {
            let endX = e.changedTouches[0].clientX;
            if(startX - endX > 40) moverCarrusel(`slides-${idProd}`, 1);
            else if(endX - startX > 40) moverCarrusel(`slides-${idProd}`, -1);
        }, {passive: true});
    });
}
function moverCarrusel(idCarrusel, dir) {
    if (!indicesCarrusel[idCarrusel]) indicesCarrusel[idCarrusel] = 0;
    const el = document.getElementById(idCarrusel);
    if(!el) return;
    const total = el.children.length;
    indicesCarrusel[idCarrusel] += dir;
    if(indicesCarrusel[idCarrusel] >= total) indicesCarrusel[idCarrusel] = 0;
    if(indicesCarrusel[idCarrusel] < 0) indicesCarrusel[idCarrusel] = total - 1;
    el.style.transform = `translateX(${-indicesCarrusel[idCarrusel] * 100}%)`;
}

/* =========================================
   8. REGISTRO DEL SERVICE WORKER (PWA)
   ========================================= */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW Error', e));
    });
}

/* =========================================
   9. SISTEMA DE ADMINISTRADOR MEJORADO
   ========================================= */
let idProductoEdicion = null;

function guardarEnNubeYakuza() {
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
        alert("Cambios guardados en la nube con éxito.");
    }).catch(e => alert("Error al guardar en la base de datos."));
}

function abrirPanelAdmin() {
    const contenedor = document.getElementById('modalAdminPanel');
    
    contenedor.innerHTML = `
        <div class="modal-contenido" style="max-width: 500px; padding-bottom: 40px;">
            <div class="modal-header">
                <h2>Panel de Control</h2>
                <button class="btn-cerrar-modal" onclick="document.getElementById('modalAdminPanel').style.display='none'">
                    <svg width="20" height="20"><use href="#icon-close"></use></svg>
                </button>
            </div>
            
            <!-- CONFIGURACIÓN GLOBAL -->
            <div style="background: var(--bg-input); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--border-color);">
                <h3 style="color: var(--color-acento); font-size: 14px; margin-bottom: 10px;">CONFIGURACIÓN GLOBAL</h3>
                
                <label style="font-size:11px; color:var(--text-muted);">Tasa Dólar Manual (0 = Automático BCV):</label>
                <div style="display:flex; gap:6px; margin-bottom:10px;">
                    <input type="number" step="0.01" id="adm-tasa" value="${tasaManualBs}" style="flex:1; padding:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                    <button data-action="update-bcv-api" style="padding:8px 12px; background:#333; color:var(--text-success); border:1px solid #444; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;">API</button>
                </div>
                
                <label style="font-size:11px; color:var(--text-muted);">Color Principal (Acento):</label>
                <input type="color" id="adm-color" value="${colorAcento}" style="width:100%; height:35px; border:none; background:none; cursor:pointer; margin-bottom:10px;">
                
                <label style="font-size:11px; color:var(--text-muted);">URL Banner Promocional (Opcional - Arriba):</label>
                <input type="text" id="adm-banner-top" value="${bannersTop[0] || ''}" placeholder="Pega el link de la imagen aquí" style="width:100%; padding:8px; margin-bottom:10px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                
                <h4 style="font-size:12px; color:#fff; margin-bottom:5px; margin-top:5px;">Métodos de Pago Activos</h4>
                <label style="font-size:12px; display:block;"><input type="checkbox" id="adm-pm" ${metodosPago.pm ? 'checked' : ''}> Pago Móvil</label>
                <label style="font-size:12px; display:block;"><input type="checkbox" id="adm-binance" ${metodosPago.binance ? 'checked' : ''}> Binance P2P</label>
                <label style="font-size:12px; display:block; margin-bottom:5px;"><input type="checkbox" id="adm-efectivo" ${metodosPago.efectivo ? 'checked' : ''}> Efectivo</label>
            </div>

            <!-- AGREGAR/EDITAR PRODUCTO -->
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
                
                <select id="adm-p-tipo-opc" style="width:100%; padding:8px; margin-bottom:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                    <option value="ninguna">Sin opciones extra</option>
                    <option value="color">Opción de Color</option>
                    <option value="material">Opción de Material</option>
                </select>
                <input type="text" id="adm-p-opciones" placeholder="Opciones por coma (Verde, Azul | Oro, Plata)" style="width:100%; padding:8px; margin-bottom:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">

                <input type="text" id="adm-p-img1" placeholder="URL Imagen Principal 1" style="width:100%; padding:8px; margin-bottom:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                <input type="text" id="adm-p-img2" placeholder="URL Imagen Adicional 2 (Opcional)" style="width:100%; padding:8px; margin-bottom:8px; background:#111; color:#fff; border:1px solid #333; border-radius:4px;">
                
                <button onclick="guardarProductoDesdeAdmin()" class="btn-agregar-carrito">Guardar en Lista</button>
                <button onclick="limpiarFormAdmin()" style="width:100%; padding:10px; margin-top:8px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer;">Limpiar Formulario</button>
            </div>

            <!-- CATÁLOGO -->
            <div style="background: var(--bg-input); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
                <h3 style="color: var(--color-acento); font-size: 14px; margin-bottom: 10px;">CATÁLOGO ACTUAL</h3>
                <div id="adminTarjetasProductos"></div>
            </div>
            
            <!-- BOTÓN MAESTRO DE GUARDADO -->
            <button onclick="guardarConfiguracionTotal()" style="width:100%; padding:14px; margin-top:15px; background:var(--text-success); color:#000; font-weight:bold; border:none; border-radius:6px; cursor:pointer; font-size:14px;">
                [ SUBIR TODO A LA NUBE ]
            </button>
        </div>
    `;

    animarEntradaModal('modalAdminPanel');
    renderizarTarjetasAdmin();
}

// Funciones globales inyectadas al window para los botones de HTML del Admin
window.guardarConfiguracionTotal = function() {
    tasaManualBs = parseFloat(document.getElementById('adm-tasa').value) || 0;
    colorAcento = document.getElementById('adm-color').value || "#ff3333";
    
    const bannerTop = document.getElementById('adm-banner-top').value.trim();
    bannersTop = bannerTop ? [bannerTop] : [];

    metodosPago = {
        pm: document.getElementById('adm-pm').checked,
        binance: document.getElementById('adm-binance').checked,
        paypal: false, trans: false,
        efectivo: document.getElementById('adm-efectivo').checked,
        otro: ""
    };

    guardarEnNubeYakuza();
    cerrarModalAnimado('modalAdminPanel');
    renderizarPaginaCompleta();
};

window.guardarProductoDesdeAdmin = function() {
    const nom = sanitizarTexto(document.getElementById('adm-p-nombre').value.trim());
    const desc = sanitizarTexto(document.getElementById('adm-p-desc').value.trim());
    const precio = parseFloat(document.getElementById('adm-p-precio').value) || 0;
    const stock = parseInt(document.getElementById('adm-p-stock').value) || 0;
    const cat = sanitizarTexto(document.getElementById('adm-p-cat').value);
    const tallasStr = sanitizarTexto(document.getElementById('adm-p-tallas').value.trim());
    const tipoOpc = sanitizarTexto(document.getElementById('adm-p-tipo-opc').value);
    const opcionesStr = sanitizarTexto(document.getElementById('adm-p-opciones').value.trim());
    
    const img1 = sanitizarTexto(document.getElementById('adm-p-img1').value.trim());
    const img2 = sanitizarTexto(document.getElementById('adm-p-img2').value.trim());

    if(nom && precio > 0) {
        const tallas = tallasStr ? tallasStr.split(',').map(s=>s.trim()) : ["Única"];
        const opcionesList = opcionesStr ? opcionesStr.split(',').map(s=>s.trim()) : [];
        let imgs = [];
        if(img1) imgs.push(img1);
        if(img2) imgs.push(img2);
        if(imgs.length === 0) imgs.push("https://files.catbox.moe/8j9706.jpg");

        const itemData = {
            id: idProductoEdicion || Date.now(),
            nombre: nom, desc: desc, precio: precio, stock: stock,
            categoria: cat, tallas: tallas, tipoOpcion: tipoOpc, opciones: opcionesList, imgs: imgs
        };

        if(idProductoEdicion !== null) {
            const index = listaProductosYakuza.findIndex(x => x.id === idProductoEdicion);
            if(index !== -1) listaProductosYakuza[index] = itemData;
        } else {
            listaProductosYakuza.push(itemData);
        }

        limpiarFormAdmin();
        renderizarTarjetasAdmin();
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
    document.getElementById('adm-p-tipo-opc').value = "ninguna";
    document.getElementById('adm-p-opciones').value = "";
    document.getElementById('adm-p-img1').value = "";
    document.getElementById('adm-p-img2').value = "";
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
    document.getElementById('adm-p-tipo-opc').value = p.tipoOpcion || "ninguna";
    document.getElementById('adm-p-opciones').value = p.opciones ? p.opciones.join(', ') : "";
    document.getElementById('adm-p-img1').value = p.imgs[0] || "";
    document.getElementById('adm-p-img2').value = p.imgs[1] || "";
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
                <div style="display: flex; gap: 6px;">
                    <button style="background:var(--color-acento); color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer;" onclick="cargarProductoParaEditar(${p.id})">Editar</button>
                    <button class="btn-icon-danger" onclick="eliminarProductoAdmin(${p.id})" title="Borrar Producto">
                        <svg width="14" height="14"><use href="#icon-close"></use></svg>
                    </button>
                </div>
            </div>
        `;
    });
    cont.innerHTML = html || '<div style="color:#aaa; font-size:11px;">No hay productos registrados.</div>';
}
