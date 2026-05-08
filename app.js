/*
 * ==================== GANADERO ÉLITE v2.0 - LÓGICA PRINCIPAL ====================
 * 
 * ORGANIZACIÓN DEL CÓDIGO:
 * 1. Inicialización y limpieza
 * 2. Utilidades (formateo, toast, modales)
 * 3. Base de datos (cargar, guardar, respaldo)
 * 4. Catálogos fijos
 * 5. Fórmulas de cálculo (etapas, dieta, costos, rendimiento)
 * 6. Navegación (menú inferior)
 * 7. Renderizado de páginas (lote, stock, sanidad, config)
 * 8. Perfil del animal
 * 9. Aplicación de productos
 * 10. Configuración (suplementos, exportar/importar)
 * 11. Auto-guardado
 * 
 * Para modificar una función, busca la sección correspondiente.
 * Cada sección tiene un comentario que la identifica.
 */

console.log('🚀 GANADERO ÉLITE v2.0 iniciando...');

// ==================== 1. INICIALIZACIÓN Y LIMPIEZA ====================
// Elimina Service Workers viejos que puedan causar conflictos
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
        for (var i = 0; i < regs.length; i++) {
            if (!regs[i].active || !regs[i].active.scriptURL.includes('sw-v2')) {
                regs[i].unregister();
            }
        }
    });
}

// Oculta la pantalla de carga después de 800ms
setTimeout(function() {
    var splash = document.getElementById('splash');
    if (splash) splash.classList.add('hide');
}, 800);

// ==================== 2. UTILIDADES ====================

/**
 * Formatea un número con puntos de miles (estilo colombiano)
 * @param {number} n - Número a formatear
 * @returns {string} Número formateado (ej: 3.332.000)
 */
function fm(n) {
    if (isNaN(n) || n === null || n === undefined) return '0';
    n = Math.round(n);
    var s = String(n), r = '', c = 0;
    for (var i = s.length - 1; i >= 0; i--) {
        if (c > 0 && c % 3 === 0) r = '.' + r;
        r = s.charAt(i) + r; c++;
    }
    return r;
}

/**
 * Muestra una notificación tipo toast
 * @param {string} m - Mensaje a mostrar
 * @param {number} d - Duración en ms (por defecto 3000)
 */
function showToast(m, d) {
    d = d || 3000;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = m;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(function() { t.remove(); }, d);
}

/**
 * Muestra un modal con contenido personalizado
 * @param {string} h - HTML del contenido del modal
 */
function showModal(h) {
    var o = document.createElement('div');
    o.className = 'modal-overlay';
    o.innerHTML = '<div class="modal">' + h + '</div>';
    o.onclick = function(e) { if (e.target === o) o.remove(); };
    document.getElementById('modalContainer').appendChild(o);
}

// ==================== 3. BASE DE DATOS ====================

// Estructura principal de datos. Aquí se guarda TODO.
var DB = {
    animales: [],           // Lista de animales del lote
    aplicaciones: [],       // Historial de aplicaciones veterinarias
    precios: {              // Precios de alimentos (COP/kg)
        pasto: 1200, salvado: 2500, melaza: 3800,
        levadura: 8000, bicarb: 4500, sal: 6200, urea: 9500
    },
    stock: {                // Stock disponible de alimentos (kg)
        pasto: 500, salvado: 200, melaza: 50,
        levadura: 10, bicarb: 5, sal: 2, urea: 20
    },
    stockSanidad: {},       // Stock de productos veterinarios fijos (ml)
    preciosSanidad: {},     // Precios de productos veterinarios ($/ml)
    suplementos: [],        // Suplementos personalizados agregados por el usuario
    stockSuplementos: [],   // Stock de suplementos personalizados
    precioKG: 9800          // Precio del kg en pie (COP)
};

/**
 * Carga los datos desde localStorage al iniciar la app.
 * Si hay datos corruptos, intenta recuperar desde sessionStorage.
 */
function cargarDatos() {
    try {
        var saved = localStorage.getItem('ganadero_elite_v2');
        if (saved) { DB = JSON.parse(saved); console.log('✅ Datos cargados'); return; }
        var backup = sessionStorage.getItem('ganadero_elite_backup');
        if (backup) { DB = JSON.parse(backup); console.log('⚠️ Restaurado desde respaldo'); save(); return; }
        console.log('📦 Sin datos previos');
    } catch(e) {
        console.error('❌ Error al cargar');
        try {
            var backup = sessionStorage.getItem('ganadero_elite_backup');
            if (backup) { DB = JSON.parse(backup); save(); }
        } catch(e2) {}
    }
}

/**
 * Guarda los datos en localStorage y sessionStorage (doble respaldo).
 * Si el almacenamiento está lleno, limpia datos antiguos.
 */
function save() {
    try {
        var data = JSON.stringify(DB);
        localStorage.setItem('ganadero_elite_v2', data);
        sessionStorage.setItem('ganadero_elite_backup', data);
        localStorage.setItem('ganadero_elite_lastSave', new Date().toLocaleString());
    } catch(e) {
        if (e.name === 'QuotaExceededError') {
            limpiarDatosAntiguos();
            try { localStorage.setItem('ganadero_elite_v2', JSON.stringify(DB)); } catch(e2) {}
        }
    }
}

/** Elimina registros antiguos si el almacenamiento está lleno */
function limpiarDatosAntiguos() {
    if (DB.aplicaciones && DB.aplicaciones.length > 50) DB.aplicaciones = DB.aplicaciones.slice(-50);
    DB.animales.forEach(function(a) {
        if (a.historial && a.historial.length > 10) a.historial = a.historial.slice(-10);
    });
}

// ==================== 4. CATÁLOGOS FIJOS ====================

// Lista de alimentos (no se puede modificar por el usuario)
var ALIMENTOS = ['pasto','salvado','melaza','levadura','bicarb','sal','urea'];

// Iconos de FontAwesome para cada alimento
var IC_ALIMENTOS = {
    pasto: 'fa-seedling', salvado: 'fa-wheat-awn', melaza: 'fa-droplet',
    levadura: 'fa-flask', bicarb: 'fa-cubes', sal: 'fa-vial-circle-check', urea: 'fa-flask-vial'
};

// Nombres en español de cada alimento
var NM_ALIMENTOS = {
    pasto: 'Pasto Picado', salvado: 'Salvado Trigo', melaza: 'Melaza',
    levadura: 'Levadura', bicarb: 'Bicarbonato', sal: 'Sal Mineral', urea: 'UREA'
};

// Catálogo de productos veterinarios fijos
var CATALOGO_SANIDAD = [
    { id:'modificador', nombre:'Modificador Orgánico', dosis:50, diasEfecto:90, retiro:0, icono:'fa-flask', color:'#22c55e', tipo:'fijo' },
    { id:'vitaminaA', nombre:'Vitamina ADE', dosis:50, diasEfecto:60, retiro:30, icono:'fa-sun', color:'#fbbf24', tipo:'fijo' },
    { id:'complejoB', nombre:'Complejo B (B12)', dosis:50, diasEfecto:20, retiro:0, icono:'fa-capsules', color:'#3b82f6', tipo:'fijo' },
    { id:'ivermectina1', nombre:'Ivermectina 1%', dosis:50, diasEfecto:30, retiro:28, icono:'fa-shield-virus', color:'#ef4444', tipo:'fijo' },
    { id:'ivermectina315', nombre:'Ivermectina 3.15%', dosis:50, diasEfecto:90, retiro:122, icono:'fa-shield-halved', color:'#dc2626', tipo:'fijo' },
    { id:'fosforo', nombre:'Fósforo B12', dosis:20, diasEfecto:30, retiro:0, icono:'fa-bone', color:'#a78bfa', tipo:'fijo' },
    { id:'hierro', nombre:'Hierro Dextrano', dosis:100, diasEfecto:30, retiro:0, icono:'fa-droplet', color:'#f87171', tipo:'fijo' }
];

/** Retorna el catálogo completo (fijos + personalizados) */
function getCatalogoCompleto() { return CATALOGO_SANIDAD.concat(DB.suplementos); }

// ==================== 5. FÓRMULAS DE CÁLCULO ====================

/**
 * Determina la etapa del animal según su peso vivo
 * @param {number} pv - Peso vivo en kg
 * @returns {object} Datos de la etapa
 */
function getEtapa(pv) {
    if (pv < 150) return { nombre:'Iniciación', clase:'etapa-inicio', icono:'🐮', rango:'Levante Temprano', min:0, max:150, ureaBloqueada:true, color:'#fbbf24', siguienteEtapa:'Desarrollo' };
    if (pv < 350) return { nombre:'Desarrollo', clase:'etapa-desarrollo', icono:'🐂', rango:'Levante', min:150, max:350, ureaBloqueada:false, color:'#60a5fa', siguienteEtapa:'Ceba' };
    if (pv < 500) return { nombre:'Ceba', clase:'etapa-ceba', icono:'🐃', rango:'Finalización', min:350, max:500, ureaBloqueada:false, color:'#fb923c', siguienteEtapa:'Madurez' };
    return { nombre:'Madurez', clase:'etapa-madurez', icono:'🦬', rango:'Venta', min:500, max:9999, ureaBloqueada:false, color:'#f87171', siguienteEtapa:'Venta' };
}

/** Calcula el porcentaje de progreso dentro de la etapa actual */
function getProgresoEtapa(pv, e) { return Math.min(100, Math.max(0, ((pv - e.min) / (e.max - e.min)) * 100)); }

/**
 * Calcula la dieta diaria según el peso del animal
 * @param {number} pv - Peso vivo en kg
 * @returns {object} Cantidades de cada alimento
 */
function getDiet(pv) {
    if (pv < 20) return { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 };
    var d = { pasto: pv*0.03, salvado: pv*0.0045, sal: pv*0.2, melaza:0, urea:0, levadura:0, bicarb:0 };
    if (pv >= 130 && pv < 150) d.melaza = 50;  // Melaza energética para pre-desarrollo
    if (pv >= 150) {
        var f = pv * 1.1;
        d.melaza = Math.max(d.melaza, f*0.85);
        d.levadura = f*0.05;
        d.bicarb = 20;
        d.urea = pv > 800 ? 150 : f*0.10;
        if (d.urea > 150) d.urea = 150;  // Techo máximo de urea
    }
    return d;
}

/** Calcula días transcurridos desde una fecha */
function getDiasDesde(f) {
    if (!f) return 999;
    var p = f.split('/');
    if (p.length < 3) return 999;
    return Math.floor((new Date() - new Date(p[2], p[1]-1, p[0])) / 86400000);
}

/** Ganancia Media Diaria (kg/día) */
function getGMD(h) { return h.length < 2 ? 0 : (h[h.length-1].peso - h[h.length-2].peso) / 30; }

/** Costo diario de alimentación según peso */
function getCostoDiario(pv) {
    var d = getDiet(pv);
    return (d.pasto||0)*(DB.precios.pasto||0) + (d.salvado||0)*(DB.precios.salvado||0) +
           ((d.melaza||0)/1000)*(DB.precios.melaza||0) + ((d.levadura||0)/1000)*(DB.precios.levadura||0) +
           ((d.bicarb||0)/1000)*(DB.precios.bicarb||0) + ((d.sal||0)/1000)*(DB.precios.sal||0) +
           ((d.urea||0)/1000)*(DB.precios.urea||0);
}

/** Costo diario de sanidad distribuido en los días de efecto */
function getCostoSanidadDiario(animalId) {
    var t = 0; var catalogo = getCatalogoCompleto();
    for (var i = 0; i < DB.aplicaciones.length; i++) {
        if (DB.aplicaciones[i].animalId === animalId) {
            var p = catalogo.find(function(x) { return x.id === DB.aplicaciones[i].productoId; });
            if (p && p.diasEfecto > 0) t += (DB.aplicaciones[i].costo || 0) / p.diasEfecto;
        }
    }
    return t;
}

/** Clasifica el rendimiento según el crecimiento mensual */
function getRendimiento(h) {
    if (h.length < 2) return { nivel:'azul', texto:'Registre más pesajes', icono:'fa-circle-info', cm:0, color:'azul' };
    var act = h[h.length-1].peso, ant = h[h.length-2].peso, cm = ((act-ant)/ant)*100;
    if (act < ant) return { nivel:'gris', texto:'Pérdida de Peso', icono:'fa-circle-exclamation', cm:cm, color:'gris' };
    if (cm >= 5) return { nivel:'verde', texto:'Excelente', icono:'fa-crown', cm:cm, color:'verde' };
    if (cm >= 3.5) return { nivel:'azul', texto:'Bueno', icono:'fa-circle-check', cm:cm, color:'azul' };
    if (cm >= 2.5) return { nivel:'naranja', texto:'Regular', icono:'fa-triangle-exclamation', cm:cm, color:'naranja' };
    return { nivel:'rojo', texto:'Bajo', icono:'fa-circle-exclamation', cm:cm, color:'rojo' };
}

// ==================== 6. NAVEGACIÓN (MENÚ INFERIOR) ====================

/** Maneja los clics en el menú inferior */
document.getElementById('bottomNav').addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn || !btn.hasAttribute('data-p')) return;
    goPage(btn.getAttribute('data-p'));
});

/** Cambia la página visible */
function goPage(p) {
    ['v-lote','v-stock','v-sanidad','v-config','v-perfil'].forEach(function(id) {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById('v-' + p).classList.remove('hidden');
    
    // Actualizar botón activo en el menú
    var btns = document.querySelectorAll('#bottomNav .bn-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    var ab = document.querySelector('#bottomNav button[data-p="' + p + '"]');
    if (ab) ab.classList.add('active');
    
    if (p === 'lote') renderLote();
    if (p === 'stock') renderStock();
    if (p === 'sanidad') renderSanidad();
    if (p === 'config') renderConfig();
    window.scrollTo(0, 0);
}

// ==================== 7. RENDERIZADO DE PÁGINAS ====================

/** Dashboard principal del lote */
function renderLote() {
    var price = DB.precioKG, totalKg = 0;
    var mez = { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 };
    var costoTotal = 0, est = { verde:0, azul:0, naranja:0, rojo:0, gris:0 };
    var etapas = { Iniciación:0, Desarrollo:0, Ceba:0, Madurez:0 };
    var csTotal = 0, cards = '';

    // Calcular costo total de sanidad
    for (var i = 0; i < DB.animales.length; i++) {
        for (var j = 0; j < DB.aplicaciones.length; j++) {
            if (DB.aplicaciones[j].animalId === DB.animales[i].id) csTotal += (DB.aplicaciones[j].costo || 0);
        }
    }

    // Generar tarjetas de animales
    for (var i = 0; i < DB.animales.length; i++) {
        var a = DB.animales[i], cp = a.historial[a.historial.length-1].peso; totalKg += cp;
        var d = getDiet(cp); for (var k in mez) mez[k] += d[k]; costoTotal += getCostoDiario(cp);
        var r = getRendimiento(a.historial); est[r.nivel] = (est[r.nivel] || 0) + 1;
        var etapa = getEtapa(cp); etapas[etapa.nombre] = (etapas[etapa.nombre] || 0) + 1;
        var lm = { verde:'ml-g', azul:'ml-b', naranja:'ml-o', rojo:'ml-r', gris:'ml-x' };
        var sg = r.cm >= 0 ? '+' : '';
        
        // Verificar si el animal está en período de retiro (no apto para venta)
        var ret = false; var catalogo = getCatalogoCompleto();
        for (var j = DB.aplicaciones.length-1; j >= 0; j--) {
            if (DB.aplicaciones[j].animalId === a.id) {
                var pr = catalogo.find(function(p) { return p.id === DB.aplicaciones[j].productoId; });
                if (pr && pr.retiro > 0 && getDiasDesde(DB.aplicaciones[j].fecha) < pr.retiro) { ret = true; break; }
            }
        }
        
        cards += '<div class="animal-card" onclick="showProfile(' + a.id + ')"><div class="mini-led ' + lm[r.nivel] + '"></div>' +
            (etapa.ureaBloqueada ? '<div class="lock-icon"><i class="fa-solid fa-lock"></i></div>' : '') +
            '<span style="font-size:1.5rem;">' + etapa.icono + '</span><div class="name">' + a.nombre + '</div>' +
            '<span class="etapa-tag ' + etapa.clase + '">' + etapa.rango + '</span><div class="weight">' + fm(cp) + ' kg</div>' +
            (ret ? '<div class="retiro-badge">🚫 EN VEDA</div>' : '') +
            '<div class="cm" style="color:' + (r.cm >= 0 ? '#22c55e' : '#ef4444') + '">' + sg + r.cm.toFixed(1) + '%</div></div>';
    }

    var ta = DB.animales.length, prom = ta > 0 ? totalKg/ta : 0;
    var gmdL = ta > 0 ? DB.animales.reduce(function(s,a) { return s + getGMD(a.historial); }, 0) / ta : 0;
    var ingM = gmdL * 30 * price * ta, cosM = costoTotal * 30, gan = ingM - cosM - (csTotal/12);
    var pctB = ta > 0 ? ((est.verde + est.azul) / ta) * 100 : 0;

    // Construir tabla de consumo diario
    var mezHTML = '';
    for (var z = 0; z < ALIMENTOS.length; z++) {
        mezHTML += '<div class="row"><span class="row-label"><i class="fa-solid ' + IC_ALIMENTOS[ALIMENTOS[z]] + '"></i> ' + NM_ALIMENTOS[ALIMENTOS[z]] + '</span><span class="row-val">' +
            (ALIMENTOS[z] === 'pasto' || ALIMENTOS[z] === 'salvado' ? mez[ALIMENTOS[z]].toFixed(1) + ' kg' : Math.round(mez[ALIMENTOS[z]]) + ' g') + '</span></div>';
    }

    // Construir HTML completo del dashboard
    var html = '<div class="card"><div class="row-label mb6" style="font-weight:600;"><i class="fa-solid fa-coins"></i> PRECIO KG EN PIE</div>' +
        '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:1.1rem;font-weight:800;color:var(--accent);">$</span>' +
        '<input id="inpPKG" type="number" value="' + price + '" style="font-size:1.1rem;font-weight:700;text-align:center;">' +
        '<span style="font-size:.7rem;color:var(--muted);">COP</span></div>' +
        '<button class="btn btn-green mt12" onclick="savePKG()"><i class="fa-solid fa-check"></i> ACTUALIZAR</button></div>' +
        
        '<div class="card"><div class="row-label mb6" style="font-weight:600;"><i class="fa-solid fa-chart-pie"></i> CAPITAL</div>' +
        '<div class="capital-value">$ ' + fm(totalKg * price) + '</div><div class="stats-grid">' +
        '<div class="stat-item"><div class="row-label"><i class="fa-solid fa-users"></i> Cabezas</div><div class="row-val">' + ta + '</div></div>' +
        '<div class="stat-item"><div class="row-label"><i class="fa-solid fa-weight-scale"></i> Peso Total</div><div class="row-val">' + fm(totalKg) + ' kg</div></div>' +
        '<div class="stat-item"><div class="row-label"><i class="fa-solid fa-calculator"></i> Promedio</div><div class="row-val">' + fm(prom) + ' kg</div></div>' +
        '<div class="stat-item"><div class="row-label"><i class="fa-solid fa-layer-group"></i> Etapas</div><div class="row-val" style="font-size:.7rem;">🐮' + etapas.Iniciación + ' 🐂' + etapas.Desarrollo + ' 🐃' + etapas.Ceba + ' 🦬' + etapas.Madurez + '</div></div></div></div>' +
        
        '<div class="card"><div style="font-weight:700;font-size:.7rem;margin-bottom:10px;color:var(--muted);"><i class="fa-solid fa-chart-simple"></i> ESTADO</div>' +
        '<div class="estado-simple"><div class="estado-pildora e"><div class="num">' + est.verde + '</div><div class="lbl">Excelente</div></div>' +
        '<div class="estado-pildora b"><div class="num">' + est.azul + '</div><div class="lbl">Bueno</div></div>' +
        '<div class="estado-pildora r"><div class="num">' + est.naranja + '</div><div class="lbl">Regular</div></div>' +
        '<div class="estado-pildora m"><div class="num">' + est.rojo + '</div><div class="lbl">Bajo</div></div></div>' +
        '<div class="progress"><div class="progress-fill" style="width:' + pctB + '%;background:var(--info);"></div></div></div>' +
        
        '<div class="card"><div style="font-weight:700;font-size:.7rem;margin-bottom:10px;color:var(--muted);"><i class="fa-solid fa-coins"></i> FINANZAS</div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-receipt"></i> Alimentación/día</span><span class="row-val">$ ' + fm(costoTotal) + '</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-syringe"></i> Sanidad total</span><span class="row-val">$ ' + fm(csTotal) + '</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-chart-line"></i> Ganancia neta/mes</span><span class="row-val" style="color:' + (gan >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gan) + '</span></div></div>' +
        
        '<div class="card"><div style="font-weight:700;font-size:.7rem;margin-bottom:10px;color:var(--accent);"><i class="fa-solid fa-blender"></i> CONSUMO DIARIO</div>' + mezHTML + '</div>' +
        '<div class="section-title"><i class="fa-solid fa-layer-group"></i> INVENTARIO</div><div class="grid">' + cards + '</div>';
    
    document.getElementById('v-lote').innerHTML = html;
}

/** Guarda el precio del kg en pie */
function savePKG() {
    var el = document.getElementById('inpPKG');
    if (el) { DB.precioKG = parseFloat(el.value) || 0; save(); renderLote(); showToast('✅ Precio actualizado'); }
}

/** Abre/cierra el modal de agregar animal */
function toggleAdd() {
    var modal = document.getElementById('addAnimalModal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) document.getElementById('newN').focus();
}

/** Cierra el modal de agregar animal */
function closeAddModal() {
    document.getElementById('addAnimalModal').classList.add('hidden');
}

/** Agrega un nuevo animal al lote */
function addAnimal() {
    var n = document.getElementById('newN').value.trim();
    var p = parseFloat(document.getElementById('newW').value);
    if (!n || n.length < 2) { alert('⚠️ Nombre válido'); return; }
    if (isNaN(p) || p < 20 || p > 2000) { alert('⚠️ Peso 20-2000 kg'); return; }
    DB.animales.push({ id: Date.now(), nombre: n, historial: [{ fecha: new Date().toLocaleDateString(), peso: p }] });
    save(); closeAddModal();
    document.getElementById('newN').value = ''; document.getElementById('newW').value = '';
    renderLote(); showToast('✅ ' + n + ' registrado');
}

/** Página unificada de PRECIOS + STOCK */
function renderStock() {
    var mez = { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 };
    DB.animales.forEach(function(a) { var d = getDiet(a.historial[a.historial.length-1].peso); for (var k in mez) mez[k] += d[k]; });
    
    // SECCIÓN PRECIOS
    var html = '<div class="card"><div style="font-weight:700;margin-bottom:14px;color:var(--accent);"><i class="fa-solid fa-tags"></i> PRECIOS ALIMENTOS (COP/kg)</div>';
    for (var i = 0; i < ALIMENTOS.length; i++) {
        html += '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03);"><i class="fa-solid ' + IC_ALIMENTOS[ALIMENTOS[i]] + '" style="width:18px;"></i><span style="flex:1;font-size:.78rem;">' + NM_ALIMENTOS[ALIMENTOS[i]] + '</span><input id="pr-' + ALIMENTOS[i] + '" type="number" value="' + (DB.precios[ALIMENTOS[i]] || 0) + '" style="width:85px;text-align:right;padding:8px;"></div>';
    }
    html += '<button class="btn btn-gold mt12" onclick="savePrecios()"><i class="fa-solid fa-check"></i> GUARDAR PRECIOS</button></div>';
    
    // SECCIÓN STOCK
    html += '<div class="card"><div style="font-weight:700;margin-bottom:14px;color:var(--accent);"><i class="fa-solid fa-boxes"></i> STOCK ALIMENTOS (kg)</div>';
    for (var j = 0; j < ALIMENTOS.length; j++) {
        var st = DB.stock[ALIMENTOS[j]] || 0, co = mez[ALIMENTOS[j]] || 0, cr = (ALIMENTOS[j] === 'pasto' || ALIMENTOS[j] === 'salvado') ? co : co/1000;
        var dias = cr > 0 && st > 0 ? st/cr : 999, dCol = dias < 3 ? '#ef4444' : dias < 7 ? '#f59e0b' : '#22c55e';
        html += '<div class="stock-row"><i class="fa-solid ' + IC_ALIMENTOS[ALIMENTOS[j]] + '"></i><div class="stock-info"><span class="stock-name">' + NM_ALIMENTOS[ALIMENTOS[j]] + '</span><span class="stock-consumo">Consumo: ' + cr.toFixed(1) + ' kg/d</span></div><input id="st-' + ALIMENTOS[j] + '" type="number" value="' + Math.round(st) + '" style="width:80px;text-align:right;padding:8px;" step="1"><span style="font-size:.68rem;font-weight:600;color:' + dCol + ';">' + (dias === 999 ? '--' : Math.round(dias) + 'd') + '</span></div>';
    }
    html += '<button class="btn btn-gold mt12" onclick="saveStock()"><i class="fa-solid fa-check"></i> GUARDAR STOCK</button></div>';
    
    document.getElementById('v-stock').innerHTML = html;
}

function savePrecios() { for (var i = 0; i < ALIMENTOS.length; i++) { var el = document.getElementById('pr-' + ALIMENTOS[i]); if (el) DB.precios[ALIMENTOS[i]] = parseFloat(el.value) || 0; } save(); showToast('✅ Precios actualizados'); }
function saveStock() { for (var i = 0; i < ALIMENTOS.length; i++) { var el = document.getElementById('st-' + ALIMENTOS[i]); if (el) DB.stock[ALIMENTOS[i]] = parseFloat(el.value) || 0; } save(); showToast('✅ Stock actualizado'); }

/** Página de sanidad (productos veterinarios) */
function renderSanidad() {
    var catalogo = getCatalogoCompleto();
    var html = '<div class="card"><div style="font-weight:700;font-size:.8rem;margin-bottom:12px;color:var(--accent);"><i class="fa-solid fa-syringe"></i> INVENTARIO SANIDAD</div>';
    for (var i = 0; i < catalogo.length; i++) {
        var prod = catalogo[i];
        var stock = DB.stockSanidad[prod.id] || 0;
        var supStock = DB.stockSuplementos.find(function(s) { return s.id === prod.id; });
        if (supStock) stock = supStock.cantidad || 0;
        var precioML = DB.preciosSanidad[prod.id] || 0;
        if (supStock) precioML = supStock.precioML || 0;
        html += '<div style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,.03);"><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;"><i class="fa-solid ' + prod.icono + '" style="color:' + prod.color + ';font-size:1.2rem;width:22px;"></i><div style="flex:1;"><span style="font-size:.78rem;font-weight:600;">' + prod.nombre + '</span><span style="font-size:.6rem;color:var(--muted);display:block;">Stock: <b>' + fm(stock) + ' ml</b> · $<b>' + fm(precioML) + '/ml</b> · Efecto: ' + prod.diasEfecto + 'd · Venta: ' + prod.retiro + 'd</span></div></div>' +
            '<div style="font-size:.65rem;color:var(--muted);margin-bottom:6px;">➕ Comprar:</div><div style="display:flex;gap:6px;align-items:center;">' +
            '<input id="compraML-' + prod.id + '" type="number" placeholder="ml" style="flex:1;padding:8px 10px;font-size:.7rem;min-height:36px;">' +
            '<input id="compraCosto-' + prod.id + '" type="number" placeholder="Costo total ($)" style="flex:1;padding:8px 10px;font-size:.7rem;min-height:36px;">' +
            '<button class="btn btn-green" onclick="agregarCompraSanidad(\'' + prod.id + '\')" style="width:auto;padding:8px 12px;font-size:.65rem;"><i class="fa-solid fa-plus"></i></button></div></div>';
    }
    html += '</div>'; document.getElementById('v-sanidad').innerHTML = html;
}

function agregarCompraSanidad(prodId) {
    var mlEl = document.getElementById('compraML-' + prodId), costoEl = document.getElementById('compraCosto-' + prodId);
    if (!mlEl || !costoEl) return;
    var ml = parseFloat(mlEl.value), costo = parseFloat(costoEl.value);
    if (isNaN(ml) || ml <= 0) { alert('⚠️ Cantidad válida'); return; }
    if (isNaN(costo) || costo <= 0) { alert('⚠️ Costo válido'); return; }
    var supStock = DB.stockSuplementos.find(function(s) { return s.id === prodId; });
    if (supStock) { supStock.cantidad = (supStock.cantidad || 0) + ml; supStock.precioML = costo / ml; }
    else { DB.stockSanidad[prodId] = (DB.stockSanidad[prodId] || 0) + ml; DB.preciosSanidad[prodId] = costo / ml; }
    save(); mlEl.value = ''; costoEl.value = ''; showToast('✅ Compra registrada ($' + fm(costo/ml) + '/ml)'); renderSanidad();
}

/** Página de configuración */
function renderConfig() {
    var supsHTML = '';
    for (var i = 0; i < DB.suplementos.length; i++) {
        var s = DB.suplementos[i];
        supsHTML += '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.03);"><i class="fa-solid ' + s.icono + '" style="color:' + s.color + ';"></i><span style="flex:1;font-size:.75rem;">' + s.nombre + ' (' + s.unidad + ')</span><button class="btn btn-danger btn-sm" onclick="eliminarSuplementoConfig(\'' + s.id + '\')" style="padding:4px 10px;"><i class="fa-solid fa-trash"></i></button></div>';
    }
    var html = '<div class="card config-section"><h3><i class="fa-solid fa-flask"></i> SUPLEMENTOS PERSONALIZADOS</h3>' +
        '<div class="flex-col gap8"><input id="supNombre" type="text" placeholder="Nombre del suplemento"><input id="supDosis" type="number" placeholder="Dosis (ml o g por kg)" step="1"><input id="supEfecto" type="number" placeholder="Días de efecto" step="1"><input id="supRetiro" type="number" placeholder="Días de retiro (0=sin retiro)" step="1">' +
        '<select id="supUnidad"><option value="ml">Mililitros (ml)</option><option value="g">Gramos (g)</option></select>' +
        '<button class="btn btn-purple" onclick="agregarSuplemento()"><i class="fa-solid fa-plus"></i> AGREGAR SUPLEMENTO</button>' + supsHTML + '</div></div>' +
        '<div class="card config-section"><h3><i class="fa-solid fa-database"></i> RESPALDO</h3>' +
        '<button class="btn btn-gold" onclick="exportarDatos()"><i class="fa-solid fa-download"></i> EXPORTAR DATOS</button>' +
        '<button class="btn btn-gray" onclick="importarDatos()"><i class="fa-solid fa-upload"></i> IMPORTAR DATOS</button></div>' +
        '<div class="card config-section"><h3><i class="fa-solid fa-info-circle"></i> INFORMACIÓN</h3>' +
        '<p style="font-size:.7rem;color:var(--muted);">GANADERO ÉLITE v2.0</p>' +
        '<p style="font-size:.6rem;color:var(--muted);">Último guardado: ' + (localStorage.getItem('ganadero_elite_lastSave') || 'Nunca') + '</p></div>';
    document.getElementById('v-config').innerHTML = html;
}

function agregarSuplemento() {
    var n = document.getElementById('supNombre').value.trim();
    var dosis = parseFloat(document.getElementById('supDosis').value);
    var efecto = parseInt(document.getElementById('supEfecto').value);
    var retiro = parseInt(document.getElementById('supRetiro').value);
    var unidad = document.getElementById('supUnidad').value;
    if (!n || isNaN(dosis) || isNaN(efecto)) { alert('⚠️ Complete todos los campos'); return; }
    DB.suplementos.push({ id: 'sup_' + Date.now(), nombre: n, dosis: dosis, diasEfecto: efecto || 30, retiro: retiro || 0, unidad: unidad, icono: 'fa-flask', color: '#a78bfa', tipo: 'personalizado' });
    save(); renderConfig(); showToast('✅ Suplemento agregado');
}
function eliminarSuplementoConfig(id) { if (confirm('⚠️ ¿Eliminar?')) { DB.suplementos = DB.suplementos.filter(function(s) { return s.id !== id; }); save(); renderConfig(); showToast('✅ Eliminado'); } }

function exportarDatos() {
    var blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'ganadero-elite-respaldo.json'; a.click(); showToast('✅ Respaldo descargado');
}
function importarDatos() {
    var input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = function(e) {
        var reader = new FileReader();
        reader.onload = function(e) { try { DB = JSON.parse(e.target.result); save(); renderLote(); showToast('✅ Importado'); } catch(err) { alert('❌ Error'); } };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
}

// ==================== 8. PERFIL DEL ANIMAL ====================
function showProfile(id) {
    var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return;
    var p = a.historial[a.historial.length-1].peso, etapa = getEtapa(p);
    var r = getRendimiento(a.historial), gmd = getGMD(a.historial), cd = getCostoDiario(p);
    var csd = getCostoSanidadDiario(id);
    var cst = 0; for (var i = 0; i < DB.aplicaciones.length; i++) { if (DB.aplicaciones[i].animalId === id) cst += (DB.aplicaciones[i].costo || 0); }
    var ckp = gmd > 0 ? (cd + csd) / gmd : 999999;
    var ingM = gmd * 30 * DB.precioKG, gan = ingM - (cd * 30) - (cst / 12);
    var proy30 = p + (gmd * 30), proy60 = p + (gmd * 60), proy90 = p + (gmd * 90), valorActual = p * DB.precioKG;
    var diasUltimo = getDiasDesde(a.historial[a.historial.length-1].fecha);

    var apps = DB.aplicaciones.filter(function(app) { return app.animalId === id; }).slice(-5).reverse();
    var appsHTML = '';
    if (apps.length > 0) {
        appsHTML = '<div class="section-title"><i class="fa-solid fa-syringe"></i> APLICACIONES</div>';
        var catalogo = getCatalogoCompleto();
        for (var ap = 0; ap < apps.length; ap++) {
            var prod = catalogo.find(function(p2) { return p2.id === apps[ap].productoId; });
            appsHTML += '<div class="aplicacion-item"><span><i class="fa-solid ' + (prod ? prod.icono : 'fa-circle') + '" style="color:' + (prod ? prod.color : '#fff') + ';"></i> ' + apps[ap].producto + '</span><span style="font-size:.65rem;">' + apps[ap].ml + ' ml · $' + fm(apps[ap].costo || 0) + ' · ' + apps[ap].fecha + '</span></div>';
        }
    }

    var hist = '', rev = a.historial.slice().reverse();
    for (var i = 0; i < rev.length; i++) {
        var h = rev[i], ch = '', diasInfo = '';
        if (i === 0) diasInfo = '<span style="font-size:.6rem;color:var(--muted);margin-left:4px;">hace ' + getDiasDesde(h.fecha) + ' d</span>';
        if (i < a.historial.length-1) {
            var ant = a.historial[a.historial.length-2-i].peso, dif = h.peso - ant;
            var cls = dif >= 0 ? 'badge-up' : 'badge-down', sig = dif >= 0 ? '+' : '';
            ch = '<span class="badge ' + cls + '">' + sig + ((dif/ant)*100).toFixed(1) + '%</span>';
        }
        hist += '<div class="hist-item"><span><i class="fa-regular fa-calendar"></i> ' + h.fecha + diasInfo + '</span><div><span class="row-val">' + fm(h.peso) + ' kg</span>' + ch + '</div></div>';
    }

    var dietaHTML = '';
    for (var x = 0; x < ALIMENTOS.length; x++) {
        var d = getDiet(p);
        var bl = (ALIMENTOS[x] === 'urea' || ALIMENTOS[x] === 'melaza') && etapa.ureaBloqueada;
        dietaHTML += '<div class="row"><span class="row-label"><i class="fa-solid ' + IC_ALIMENTOS[ALIMENTOS[x]] + '"></i> ' + NM_ALIMENTOS[ALIMENTOS[x]] + '</span><span class="row-val" style="' + (bl ? 'color:#6b7280;text-decoration:line-through' : '') + '">' + (bl ? '0 g (🔒)' : (ALIMENTOS[x] === 'pasto' || ALIMENTOS[x] === 'salvado' ? d[ALIMENTOS[x]].toFixed(1) + ' kg' : Math.round(d[ALIMENTOS[x]]) + ' g')) + '</span></div>';
    }

    document.getElementById('v-lote').classList.add('hidden');
    document.getElementById('v-stock').classList.add('hidden');
    document.getElementById('v-sanidad').classList.add('hidden');
    document.getElementById('v-config').classList.add('hidden');
    document.getElementById('v-perfil').classList.remove('hidden');
    document.getElementById('bottomNav').style.display = 'none';

    var html = '<div class="card"><div class="profile-header"><div><div class="profile-name">' + a.nombre + ' ' + etapa.icono + '</div><div class="profile-sub">' + etapa.rango + ' · ' + etapa.nombre + '</div></div>' +
        '<div style="display:flex;gap:6px;"><button class="btn btn-purple btn-sm" onclick="openAplicarProducto(' + id + ')"><i class="fa-solid fa-syringe"></i></button>' +
        '<button class="btn btn-gray btn-sm" onclick="deleteAnimal(' + id + ')" style="background:rgba(255,0,0,.06);color:#ef4444;"><i class="fa-solid fa-trash-can"></i></button></div></div>' +
        '<div style="margin-bottom:14px;"><div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--muted);margin-bottom:4px;"><span>Progreso</span><span>Faltan ' + fm(etapa.max - p) + ' kg para ' + etapa.siguienteEtapa + '</span></div>' +
        '<div class="progress"><div class="progress-fill" style="width:' + getProgresoEtapa(p, etapa) + '%;background:' + etapa.color + ';"></div></div></div>' +
        '<div class="alerta-card ' + r.color + '"><div class="alerta-led ' + r.color + '"><i class="fa-solid ' + r.icono + '"></i></div><div><div class="alerta-titulo">' + r.texto + '</div>' +
        '<div class="alerta-met">Ganancia: ' + gmd.toFixed(2) + ' kg/d | Crecimiento: ' + (r.cm >= 0 ? '+' : '') + r.cm.toFixed(1) + '% | Costo/kg: $' + fm(ckp) + '</div></div></div>' +
        '<div class="mb14"><div class="row"><span class="row-label"><i class="fa-solid fa-weight-scale"></i> Peso</span><span class="row-val">' + fm(p) + ' kg</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-sack-dollar"></i> Valor</span><span class="row-val" style="color:var(--accent);">$ ' + fm(valorActual) + '</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-calendar-check"></i> Último pesaje</span><span class="row-val">' + a.historial[a.historial.length-1].fecha + ' (' + diasUltimo + ' d)</span></div></div>' +
        '<div class="card" style="background:rgba(255,255,255,.02);margin-bottom:14px;"><div style="font-weight:700;font-size:.7rem;margin-bottom:10px;color:var(--muted);"><i class="fa-solid fa-chart-line"></i> PROYECCIÓN</div><div class="proyeccion-grid">' +
        '<div class="proyeccion-item"><div class="dias">30 DÍAS</div><div class="peso">' + fm(proy30) + ' kg</div><div class="ganancia" style="color:' + ((proy30 * DB.precioKG - valorActual) >= 0 ? '#22c55e' : '#ef4444') + '">' + ((proy30 * DB.precioKG - valorActual) >= 0 ? '+' : '') + '$ ' + fm(Math.abs(proy30 * DB.precioKG - valorActual)) + '</div></div>' +
        '<div class="proyeccion-item"><div class="dias">60 DÍAS</div><div class="peso">' + fm(proy60) + ' kg</div><div class="ganancia" style="color:' + ((proy60 * DB.precioKG - valorActual) >= 0 ? '#22c55e' : '#ef4444') + '">' + ((proy60 * DB.precioKG - valorActual) >= 0 ? '+' : '') + '$ ' + fm(Math.abs(proy60 * DB.precioKG - valorActual)) + '</div></div>' +
        '<div class="proyeccion-item"><div class="dias">90 DÍAS</div><div class="peso">' + fm(proy90) + ' kg</div><div class="ganancia" style="color:' + ((proy90 * DB.precioKG - valorActual) >= 0 ? '#22c55e' : '#ef4444') + '">' + ((proy90 * DB.precioKG - valorActual) >= 0 ? '+' : '') + '$ ' + fm(Math.abs(proy90 * DB.precioKG - valorActual)) + '</div></div></div></div>' +
        '<div class="card" style="background:rgba(255,255,255,.02);margin-bottom:14px;"><div style="font-weight:700;font-size:.7rem;margin-bottom:8px;color:var(--muted);">RENTABILIDAD</div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-receipt"></i> Costo alim./día</span><span class="row-val">$ ' + fm(cd) + '</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-syringe"></i> Costo san./día</span><span class="row-val">$ ' + fm(csd) + '</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-calculator"></i> Costo por kilo</span><span class="row-val" style="color:' + (ckp < DB.precioKG ? '#22c55e' : '#ef4444') + '">$ ' + fm(ckp) + '/kg</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-sack-dollar"></i> Ganancia neta/mes</span><span class="row-val" style="color:' + (gan >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gan) + '</span></div></div>' +
        appsHTML + '<div class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> HISTORIAL</div>' + hist +
        '<div class="section-title"><i class="fa-solid fa-mortar-pestle"></i> DIETA</div>' + dietaHTML +
        '<div class="flex-col gap10 mt20 pt12 bt"><button class="btn btn-gold" onclick="updateWeight(' + id + ')"><i class="fa-solid fa-gauge-high"></i> REGISTRAR PESAJE</button></div></div>';

    document.getElementById('v-perfil').innerHTML = html;
    
    // Botón flotante para volver
    var oldBtn = document.getElementById('btnBackFloat'); if (oldBtn) oldBtn.remove();
    var btnBack = document.createElement('button'); btnBack.className = 'btn-back-float'; btnBack.id = 'btnBackFloat';
    btnBack.innerHTML = '<i class="fa-solid fa-arrow-left"></i>'; btnBack.onclick = closeProfile;
    document.body.appendChild(btnBack);
    window.scrollTo(0, 0);
    save();
}

function updateWeight(id) {
    var p = prompt('⚖️ Nuevo pesaje (kg):'); if (!p) return;
    p = parseFloat(p); if (isNaN(p) || p < 20 || p > 2000) { alert('⚠️ Peso 20-2000 kg'); return; }
    var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return;
    a.historial.push({ fecha: new Date().toLocaleDateString(), peso: p }); save(); showProfile(id);
}
function deleteAnimal(id) { if (confirm('⚠️ ¿Eliminar?')) { DB.animales = DB.animales.filter(function(x) { return x.id !== id; }); save(); closeProfile(); } }
function closeProfile() { var btn = document.getElementById('btnBackFloat'); if (btn) btn.remove(); document.getElementById('v-perfil').classList.add('hidden'); document.getElementById('bottomNav').style.display = 'flex'; renderLote(); save(); }

// ==================== 9. APLICACIÓN DE PRODUCTOS ====================
function openAplicarProducto(animalId) {
    var a = DB.animales.find(function(x) { return x.id === animalId; }); if (!a) return;
    var peso = a.historial[a.historial.length-1].peso;
    var catalogo = getCatalogoCompleto();
    var prodOptions = '';
    for (var i = 0; i < catalogo.length; i++) prodOptions += '<option value="' + catalogo[i].id + '">' + catalogo[i].nombre + '</option>';
    var html = '<div style="font-weight:700;font-size:.9rem;margin-bottom:12px;color:var(--accent);">💉 APLICAR A ' + a.nombre + ' (' + fm(peso) + ' kg)</div><div class="flex-col gap10">' +
        '<select id="aplProducto" onchange="calcularDosisModal(' + peso + ')">' + prodOptions + '</select>' +
        '<div id="dosisInfo" style="font-size:.7rem;color:var(--muted);"></div>' +
        '<input id="aplML" type="number" placeholder="ml aplicados" step=".1">' +
        '<button class="btn btn-gold mt8" onclick="aplicarProducto(' + animalId + ')"><i class="fa-solid fa-check"></i> CONFIRMAR</button>' +
        '<button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>';
    showModal(html); setTimeout(function() { calcularDosisModal(peso); }, 100);
}
function calcularDosisModal(peso) {
    var sel = document.getElementById('aplProducto'), info = document.getElementById('dosisInfo');
    if (!sel || !info) return;
    var catalogo = getCatalogoCompleto();
    var prod = catalogo.find(function(p) { return p.id === sel.value; });
    if (prod) info.innerHTML = '📋 Dosis: <b>' + (peso / prod.dosis).toFixed(1) + ' ml</b> (1 ml/' + prod.dosis + ' kg)';
}
function aplicarProducto(animalId) {
    var sel = document.getElementById('aplProducto'), mlInput = document.getElementById('aplML');
    if (!sel || !mlInput) return;
    var prodId = sel.value, ml = parseFloat(mlInput.value);
    if (isNaN(ml) || ml <= 0) { alert('⚠️ Ingrese ml válidos'); return; }
    var catalogo = getCatalogoCompleto();
    var prod = catalogo.find(function(p) { return p.id === prodId; });
    var a = DB.animales.find(function(x) { return x.id === animalId; });
    if (!prod || !a) return;
    var precioML = DB.preciosSanidad[prodId] || 0;
    var supStock = DB.stockSuplementos.find(function(s) { return s.id === prodId; });
    if (supStock) precioML = supStock.precioML || 0;
    var costoTotal = precioML * ml;
    DB.aplicaciones.push({ animalId: animalId, productoId: prodId, producto: prod.nombre, ml: ml, costo: costoTotal, fecha: new Date().toLocaleDateString() });
    if (supStock) { supStock.cantidad = Math.max(0, (supStock.cantidad || 0) - ml); }
    else { DB.stockSanidad[prodId] = Math.max(0, (DB.stockSanidad[prodId] || 0) - ml); }
    save(); document.querySelector('.modal-overlay').remove();
    showToast('✅ ' + prod.nombre + ': ' + ml + ' ml ($' + fm(costoTotal) + ')'); showProfile(animalId);
}

// ==================== 10. AUTO-GUARDADO ====================
cargarDatos();
renderLote();

window.addEventListener('beforeunload', function() { save(); });
document.addEventListener('visibilitychange', function() { if (document.hidden) save(); });
setInterval(function() { save(); }, 30000);

console.log('✅ GANADERO ÉLITE v2.0 listo - Auto-guardado cada 30s');
