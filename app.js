/*
 * ==================== GANADERO ÉLITE v3.0 ====================
 * IA Local + Diseño Mejorado
 * 1. Utilidades  2. DB  3. Catálogos  4. Fórmulas + IA
 * 5. Navegación  6. Render Lote  7. Render Insumos
 * 8. Render Sanidad  9. Render Ajustes  10. Perfil
 * 11. Aplicar productos  12. Auto-guardado
 */
console.log('🧠 GANADERO ÉLITE v3.0 - IA Local');

// ==================== 1. UTILIDADES ====================
function fm(n) { if (isNaN(n) || n === null || n === undefined) return '0'; n = Math.round(n); var s = String(n), r = '', c = 0; for (var i = s.length - 1; i >= 0; i--) { if (c > 0 && c % 3 === 0) r = '.' + r; r = s.charAt(i) + r; c++; } return r; }
function showToast(m, d) { d = d || 3000; var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = m; document.getElementById('toastContainer').appendChild(t); setTimeout(function() { t.remove(); }, d); }
function showModal(h) { var o = document.createElement('div'); o.className = 'modal-overlay'; o.innerHTML = '<div class="modal">' + h + '</div>'; o.onclick = function(e) { if (e.target === o) o.remove(); }; document.getElementById('modalContainer').appendChild(o); }

// ==================== 2. BASE DE DATOS ====================
var DB = {
    animales: [], aplicaciones: [],
    precios: { pasto:1200, salvado:2500, melaza:3800, levadura:8000, bicarb:4500, sal:6200, urea:9500 },
    stock: { pasto:500, salvado:200, melaza:50, levadura:10, bicarb:5, sal:2, urea:20 },
    stockSanidad: {}, preciosSanidad: {},
    suplementosAlimento: [], suplementosSanidad: [],
    precioKG: 9800
};
function cargarDatos() { try { var s = localStorage.getItem('ganadero_elite_v5'); if (s) { DB = JSON.parse(s); return; } var b = sessionStorage.getItem('ganadero_elite_backup'); if (b) { DB = JSON.parse(b); save(); } } catch(e) {} }
function save() { try { var d = JSON.stringify(DB); localStorage.setItem('ganadero_elite_v5', d); sessionStorage.setItem('ganadero_elite_backup', d); localStorage.setItem('ganadero_elite_lastSave', new Date().toLocaleString()); } catch(e) {} }

// ==================== 3. CATÁLOGOS ====================
var ALIMENTOS = ['pasto','salvado','melaza','levadura','bicarb','sal','urea'];
var IC_ALIMENTOS = { pasto:'fa-seedling', salvado:'fa-wheat-awn', melaza:'fa-droplet', levadura:'fa-flask', bicarb:'fa-cubes', sal:'fa-vial-circle-check', urea:'fa-flask-vial' };
var NM_ALIMENTOS = { pasto:'Pasto Picado', salvado:'Salvado Trigo', melaza:'Melaza', levadura:'Levadura', bicarb:'Bicarbonato', sal:'Sal Mineral', urea:'UREA' };
var CATALOGO_SANIDAD = [
    { id:'modificador', nombre:'Modificador Orgánico', dosis:50, diasEfecto:90, retiro:0, icono:'fa-flask', color:'#22c55e', tipo:'fijo' },
    { id:'vitaminaA', nombre:'Vitamina ADE', dosis:50, diasEfecto:60, retiro:30, icono:'fa-sun', color:'#fbbf24', tipo:'fijo' },
    { id:'complejoB', nombre:'Complejo B (B12)', dosis:50, diasEfecto:20, retiro:0, icono:'fa-capsules', color:'#3b82f6', tipo:'fijo' },
    { id:'ivermectina1', nombre:'Ivermectina 1%', dosis:50, diasEfecto:30, retiro:28, icono:'fa-shield-virus', color:'#ef4444', tipo:'fijo' },
    { id:'ivermectina315', nombre:'Ivermectina 3.15%', dosis:50, diasEfecto:90, retiro:122, icono:'fa-shield-halved', color:'#dc2626', tipo:'fijo' },
    { id:'fosforo', nombre:'Fósforo B12', dosis:20, diasEfecto:30, retiro:0, icono:'fa-bone', color:'#a78bfa', tipo:'fijo' },
    { id:'hierro', nombre:'Hierro Dextrano', dosis:100, diasEfecto:30, retiro:0, icono:'fa-droplet', color:'#f87171', tipo:'fijo' }
];
function getCatalogoSanidadCompleto() { return CATALOGO_SANIDAD.concat(DB.suplementosSanidad); }

// ==================== 4. FÓRMULAS + IA LOCAL ====================
function getEtapa(pv) {
    if (pv < 150) return { nombre:'Iniciación', clase:'etapa-inicio', icono:'🐮', rango:'Levante Temprano', min:0, max:150, ureaBloqueada:true, color:'#fbbf24', siguienteEtapa:'Desarrollo', cardClass:'etapa-inicio-card' };
    if (pv < 350) return { nombre:'Desarrollo', clase:'etapa-desarrollo', icono:'🐂', rango:'Levante', min:150, max:350, ureaBloqueada:false, color:'#60a5fa', siguienteEtapa:'Ceba', cardClass:'etapa-desarrollo-card' };
    if (pv < 500) return { nombre:'Ceba', clase:'etapa-ceba', icono:'🐃', rango:'Finalización', min:350, max:500, ureaBloqueada:false, color:'#fb923c', siguienteEtapa:'Madurez', cardClass:'etapa-ceba-card' };
    return { nombre:'Madurez', clase:'etapa-madurez', icono:'🦬', rango:'Venta', min:500, max:9999, ureaBloqueada:false, color:'#f87171', siguienteEtapa:'Venta', cardClass:'etapa-madurez-card' };
}
function getProgresoEtapa(pv, e) { return Math.min(100, Math.max(0, ((pv - e.min) / (e.max - e.min)) * 100)); }
function getDiet(pv) {
    if (pv < 20) return { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 };
    var d = { pasto:pv*0.03, salvado:pv*0.0045, sal:pv*0.2, melaza:0, urea:0, levadura:0, bicarb:0 };
    if (pv >= 130 && pv < 150) d.melaza = 50;
    if (pv >= 150) { var f = pv*1.1; d.melaza = Math.max(d.melaza, f*0.85); d.levadura = f*0.05; d.bicarb = 20; d.urea = pv > 800 ? 150 : f*0.10; if (d.urea > 150) d.urea = 150; }
    return d;
}
function getDiasDesde(f) { if (!f) return 999; var p = f.split('/'); if (p.length < 3) return 999; return Math.floor((new Date() - new Date(p[2], p[1]-1, p[0])) / 86400000); }
function getGMD(h) { return h.length < 2 ? 0 : (h[h.length-1].peso - h[h.length-2].peso) / 30; }
function getCostoDiario(pv) {
    var d = getDiet(pv);
    return (d.pasto||0)*(DB.precios.pasto||0) + (d.salvado||0)*(DB.precios.salvado||0) + ((d.melaza||0)/1000)*(DB.precios.melaza||0) + ((d.levadura||0)/1000)*(DB.precios.levadura||0) + ((d.bicarb||0)/1000)*(DB.precios.bicarb||0) + ((d.sal||0)/1000)*(DB.precios.sal||0) + ((d.urea||0)/1000)*(DB.precios.urea||0);
}
function getDosisSuplemento(peso, sup) { return (peso * sup.gramosPorKg) / 1000; }
function getCostoSuplementoDiario(peso, sup) { return getDosisSuplemento(peso, sup) * (sup.precioPorKg || 0); }
function getCostoSanidadDiario(animalId) {
    var t = 0; var c = getCatalogoSanidadCompleto();
    for (var i = 0; i < DB.aplicaciones.length; i++) {
        if (DB.aplicaciones[i].animalId === animalId) {
            var p = c.find(function(x) { return x.id === DB.aplicaciones[i].productoId; });
            if (p && p.diasEfecto > 0) t += (DB.aplicaciones[i].costo || 0) / p.diasEfecto;
        }
    }
    return t;
}
function getRendimiento(h) {
    if (h.length < 2) return { nivel:'azul', texto:'Registre más pesajes', icono:'fa-circle-info', cm:0, color:'azul', tendencia:'stable' };
    var act = h[h.length-1].peso, ant = h[h.length-2].peso, cm = ((act-ant)/ant)*100;
    var tend = cm > 0 ? 'up' : cm < 0 ? 'down' : 'stable';
    if (act < ant) return { nivel:'gris', texto:'Pérdida de Peso', icono:'fa-circle-exclamation', cm:cm, color:'gris', tendencia:tend };
    if (cm >= 5) return { nivel:'verde', texto:'Excelente', icono:'fa-crown', cm:cm, color:'verde', tendencia:tend };
    if (cm >= 3.5) return { nivel:'azul', texto:'Bueno', icono:'fa-circle-check', cm:cm, color:'azul', tendencia:tend };
    if (cm >= 2.5) return { nivel:'naranja', texto:'Regular', icono:'fa-triangle-exclamation', cm:cm, color:'naranja', tendencia:tend };
    return { nivel:'rojo', texto:'Bajo', icono:'fa-circle-exclamation', cm:cm, color:'rojo', tendencia:tend };
}
function getCostoTotalSuplementosDiario(peso) { var t = 0; for (var i = 0; i < DB.suplementosAlimento.length; i++) { t += getCostoSuplementoDiario(peso, DB.suplementosAlimento[i]); } return t; }

// ==================== IA: PREDICCIÓN POR REGRESIÓN LINEAL ====================
function predecirPeso(historial, diasFuturo) {
    if (historial.length < 3) return null;
    var n = historial.length;
    var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    var fechaBase = new Date(historial[0].fecha.split('/').reverse().join('-'));
    for (var i = 0; i < n; i++) {
        var fechaActual = new Date(historial[i].fecha.split('/').reverse().join('-'));
        var diasReales = Math.floor((fechaActual - fechaBase) / 86400000);
        var x = diasReales;
        var y = historial[i].peso;
        sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
    }
    var m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    var b = (sumY - m * sumX) / n;
    var ultimaFecha = new Date(historial[n-1].fecha.split('/').reverse().join('-'));
    var diasDesdeUltimo = Math.floor((new Date() - ultimaFecha) / 86400000);
    var diaFuturo = Math.floor((new Date() - fechaBase) / 86400000) + diasFuturo;
    return m * diaFuturo + b;
}
function getConfianzaPrediccion(historial) {
    if (historial.length < 3) return 'Baja';
    var n = historial.length;
    var cambios = [];
    for (var i = 1; i < n; i++) { cambios.push(historial[i].peso - historial[i-1].peso); }
    var media = cambios.reduce(function(a,b) { return a+b; }, 0) / cambios.length;
    var varianza = cambios.reduce(function(a,b) { return a + Math.pow(b-media,2); }, 0) / cambios.length;
    var cv = Math.sqrt(varianza) / Math.abs(media);
    if (cv < 0.3) return 'Alta';
    if (cv < 0.6) return 'Media';
    return 'Baja';
}
function getTendenciaTexto(historial) {
    var r = getRendimiento(historial);
    if (r.tendencia === 'up') return '📈 Mejorando';
    if (r.tendencia === 'down') return '📉 Empeorando';
    return '📊 Estable';
}

// ==================== 5. NAVEGACIÓN ====================
document.getElementById('bottomNav').addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn || !btn.hasAttribute('data-p')) return;
    goPage(btn.getAttribute('data-p'));
});
function goPage(p) {
    ['v-lote','v-insumos','v-sanidad','v-ajustes','v-perfil'].forEach(function(id) { document.getElementById(id).classList.add('hidden'); });
    document.getElementById('v-' + p).classList.remove('hidden');
    var btns = document.querySelectorAll('#bottomNav .bn-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    var ab = document.querySelector('#bottomNav button[data-p="' + p + '"]');
    if (ab) ab.classList.add('active');
    if (p === 'lote') renderLote();
    if (p === 'insumos') renderInsumos();
    if (p === 'sanidad') renderSanidad();
    if (p === 'ajustes') renderAjustes();
    window.scrollTo(0, 0);
}

// ==================== 6. RENDER LOTE ====================
function renderLote() {
    var price = DB.precioKG, totalKg = 0;
    var mez = { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 };
    var costoTotal = 0, est = { verde:0, azul:0, naranja:0, rojo:0, gris:0 };
    var etapas = { Iniciación:0, Desarrollo:0, Ceba:0, Madurez:0 };
    var csTotal = 0, cards = '';

    for (var i = 0; i < DB.aplicaciones.length; i++) {
        if (DB.aplicaciones[i].tipo === 'sanidad') csTotal += (DB.aplicaciones[i].costo || 0);
    }
    var cSuplTotal = 0;
    for (var i = 0; i < DB.animales.length; i++) {
        cSuplTotal += getCostoTotalSuplementosDiario(DB.animales[i].historial[DB.animales[i].historial.length-1].peso) * 30;
    }

    for (var i = 0; i < DB.animales.length; i++) {
        var a = DB.animales[i], cp = a.historial[a.historial.length-1].peso; totalKg += cp;
        var d = getDiet(cp); for (var k in mez) mez[k] += d[k]; costoTotal += getCostoDiario(cp);
        var r = getRendimiento(a.historial); est[r.nivel] = (est[r.nivel] || 0) + 1;
        var etapa = getEtapa(cp); etapas[etapa.nombre] = (etapas[etapa.nombre] || 0) + 1;
        var lm = { verde:'ml-g', azul:'ml-b', naranja:'ml-o', rojo:'ml-r', gris:'ml-x' };
        var sg = r.cm >= 0 ? '+' : '';
        var tendenciaHTML = r.tendencia === 'up' ? '<span class="trend-indicator trend-up">▲</span>' : r.tendencia === 'down' ? '<span class="trend-indicator trend-down">▼</span>' : '';

        // Mini gráfico de barras (últimos 3 pesajes)
        var miniChartHTML = '';
        if (a.historial.length >= 2) {
            var ultimos = a.historial.slice(-3);
            var maxPeso = Math.max.apply(null, ultimos.map(function(h) { return h.peso; }));
            var minPeso = Math.min.apply(null, ultimos.map(function(h) { return h.peso; }));
            var rango = maxPeso - minPeso || 1;
            miniChartHTML = '<div class="mini-chart">';
            for (var j = 0; j < ultimos.length; j++) {
                var altura = ((ultimos[j].peso - minPeso) / rango) * 20 + 8;
                miniChartHTML += '<div class="mini-chart-bar" style="height:' + altura + 'px;"></div>';
            }
            miniChartHTML += '</div>';
        }

        // Retiro
        var ret = false; var catalogo = getCatalogoSanidadCompleto();
        for (var j = DB.aplicaciones.length-1; j >= 0; j--) {
            if (DB.aplicaciones[j].animalId === a.id) {
                var pr = catalogo.find(function(p) { return p.id === DB.aplicaciones[j].productoId; });
                if (pr && pr.retiro > 0 && getDiasDesde(DB.aplicaciones[j].fecha) < pr.retiro) { ret = true; break; }
            }
        }

        cards += '<div class="animal-card ' + etapa.cardClass + '" onclick="showProfile(' + a.id + ')"><div class="mini-led ' + lm[r.nivel] + '"></div>' +
            (etapa.ureaBloqueada ? '<div class="lock-icon"><i class="fa-solid fa-lock"></i></div>' : '') +
            '<span style="font-size:1.5rem;">' + etapa.icono + '</span><div class="name">' + a.nombre + '</div>' +
            '<span class="etapa-tag ' + etapa.clase + '">' + etapa.rango + '</span><div class="weight">' + fm(cp) + ' kg ' + tendenciaHTML + '</div>' +
            (ret ? '<div class="retiro-badge">🚫 EN VEDA</div>' : '') +
            '<div class="cm" style="color:' + (r.cm >= 0 ? '#22c55e' : '#ef4444') + '">' + sg + r.cm.toFixed(1) + '%</div>' +
            miniChartHTML + '</div>';
    }

    var ta = DB.animales.length, prom = ta > 0 ? totalKg/ta : 0;
    var gmdL = ta > 0 ? DB.animales.reduce(function(s,a) { return s + getGMD(a.historial); }, 0) / ta : 0;
    var ingM = gmdL * 30 * price * ta, cosM = costoTotal * 30, gan = ingM - cosM - (csTotal/12) - (cSuplTotal/12);
    var pctB = ta > 0 ? ((est.verde + est.azul) / ta) * 100 : 0;

    var mezHTML = '';
    for (var z = 0; z < ALIMENTOS.length; z++) {
        mezHTML += '<div class="row"><span class="row-label"><i class="fa-solid ' + IC_ALIMENTOS[ALIMENTOS[z]] + '"></i> ' + NM_ALIMENTOS[ALIMENTOS[z]] + '</span><span class="row-val">' +
            (ALIMENTOS[z] === 'pasto' || ALIMENTOS[z] === 'salvado' ? mez[ALIMENTOS[z]].toFixed(1) + ' kg' : Math.round(mez[ALIMENTOS[z]]) + ' g') + '</span></div>';
    }

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
        '<div class="row"><span class="row-label"><i class="fa-solid fa-flask"></i> Suplementos total</span><span class="row-val">$ ' + fm(cSuplTotal) + '</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-chart-line"></i> Ganancia neta/mes</span><span class="row-val" style="color:' + (gan >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gan) + '</span></div></div>' +
        '<div class="card"><div style="font-weight:700;font-size:.7rem;margin-bottom:10px;color:var(--accent);"><i class="fa-solid fa-blender"></i> CONSUMO DIARIO</div>' + mezHTML + '</div>' +
        '<div class="section-title"><i class="fa-solid fa-layer-group"></i> INVENTARIO</div><div class="grid">' + cards + '</div>';
    document.getElementById('v-lote').innerHTML = html;
}
function savePKG() { var el = document.getElementById('inpPKG'); if (el) { DB.precioKG = parseFloat(el.value) || 0; save(); renderLote(); showToast('✅ Precio actualizado'); } }
function toggleAdd() { var m = document.getElementById('addAnimalModal'); m.classList.toggle('hidden'); if (!m.classList.contains('hidden')) document.getElementById('newN').focus(); }
function closeAddModal() { document.getElementById('addAnimalModal').classList.add('hidden'); }
function addAnimal() { var n = document.getElementById('newN').value.trim(), p = parseFloat(document.getElementById('newW').value); if (!n || n.length < 2) { alert('⚠️ Nombre válido'); return; } if (isNaN(p) || p < 20 || p > 2000) { alert('⚠️ Peso 20-2000 kg'); return; } DB.animales.push({ id: Date.now(), nombre: n, historial: [{ fecha: new Date().toLocaleDateString(), peso: p }] }); save(); closeAddModal(); renderLote(); showToast('✅ ' + n + ' registrado'); }
// ==================== 7. RENDER INSUMOS ====================
function renderInsumos() {
    var mez = { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 };
    DB.animales.forEach(function(a) { var d = getDiet(a.historial[a.historial.length-1].peso); for (var k in mez) mez[k] += d[k]; });
    var html = '<div class="card"><div style="font-weight:700;margin-bottom:14px;color:var(--accent);"><i class="fa-solid fa-boxes"></i> ALIMENTOS FIJOS</div>';
    for (var i = 0; i < ALIMENTOS.length; i++) {
        var st = DB.stock[ALIMENTOS[i]] || 0, co = mez[ALIMENTOS[i]] || 0, cr = (ALIMENTOS[i] === 'pasto' || ALIMENTOS[i] === 'salvado') ? co : co/1000;
        var dias = cr > 0 && st > 0 ? st/cr : 999, dCol = dias < 3 ? '#ef4444' : dias < 7 ? '#f59e0b' : '#22c55e';
        html += '<div class="insumo-row"><i class="fa-solid ' + IC_ALIMENTOS[ALIMENTOS[i]] + '"></i><div class="insumo-info"><span class="insumo-nombre">' + NM_ALIMENTOS[ALIMENTOS[i]] + '</span><span class="insumo-detalle">$' + fm(DB.precios[ALIMENTOS[i]] || 0) + '/kg · Consumo: ' + cr.toFixed(1) + ' kg/d · Stock: ' + Math.round(st) + 'kg · <b style="color:' + dCol + '">' + (dias === 999 ? '--' : Math.round(dias) + 'd') + '</b></span></div>' +
            '<div class="insumo-inputs"><input id="pr-' + ALIMENTOS[i] + '" type="number" value="' + (DB.precios[ALIMENTOS[i]] || 0) + '" placeholder="$/kg"><input id="st-' + ALIMENTOS[i] + '" type="number" value="' + Math.round(st) + '" placeholder="kg"></div></div>';
    }
    html += '<button class="btn btn-gold mt12" onclick="saveAlimentos()"><i class="fa-solid fa-check"></i> GUARDAR ALIMENTOS</button></div>';
    html += '<div class="card"><div style="font-weight:700;margin-bottom:14px;color:var(--accent);"><i class="fa-solid fa-flask"></i> SUPLEMENTOS (g/kg peso vivo)</div>';
    for (var s = 0; s < DB.suplementosAlimento.length; s++) {
        var sup = DB.suplementosAlimento[s], stockKg = sup.stock || 0, dosisEj = getDosisSuplemento(160, sup);
        html += '<div class="sup-card"><div class="sup-card-header"><span class="sup-nombre"><i class="fa-solid ' + (sup.icono || 'fa-flask') + '" style="color:' + (sup.color || '#a78bfa') + ';"></i> ' + sup.nombre + '</span>' +
            '<div class="sup-card-actions"><button onclick="editarSuplementoAlimento(\'' + sup.id + '\')" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button><button onclick="eliminarSuplementoAlimento(\'' + sup.id + '\')" title="Eliminar"><i class="fa-solid fa-trash"></i></button></div></div>' +
            '<div class="sup-card-body"><span>📐 ' + sup.gramosPorKg + ' g/kg</span><span>💰 $' + fm(sup.precioPorKg || 0) + '/kg</span><span>📦 Stock: ' + fm(stockKg) + ' kg</span><span>📋 160kg → ' + dosisEj.toFixed(2) + ' kg/d</span></div>' +
            '<div style="display:flex;gap:6px;margin-top:8px;"><input id="compraCantSup-' + sup.id + '" type="number" placeholder="kg a comprar" style="flex:1;padding:8px;font-size:.7rem;min-height:32px;"><input id="compraCostoSup-' + sup.id + '" type="number" placeholder="Costo total ($)" style="flex:1;padding:8px;font-size:.7rem;min-height:32px;"><button class="btn btn-green btn-sm" onclick="comprarSuplementoAlimento(\'' + sup.id + '\')" style="padding:6px 10px;"><i class="fa-solid fa-cart-shopping"></i></button></div></div>';
    }
    html += '<button class="btn btn-purple mt12" onclick="openAgregarSuplementoAlimento()"><i class="fa-solid fa-plus"></i> AGREGAR SUPLEMENTO</button></div>';
    document.getElementById('v-insumos').innerHTML = html;
}
function saveAlimentos() { for (var i = 0; i < ALIMENTOS.length; i++) { var pel = document.getElementById('pr-' + ALIMENTOS[i]), sel = document.getElementById('st-' + ALIMENTOS[i]); if (pel) DB.precios[ALIMENTOS[i]] = parseFloat(pel.value) || 0; if (sel) DB.stock[ALIMENTOS[i]] = parseFloat(sel.value) || 0; } save(); showToast('✅ Alimentos guardados'); }
function openAgregarSuplementoAlimento() { var html = '<div class="modal-title">➕ NUEVO SUPLEMENTO (g/kg)</div><div class="flex-col gap10"><input id="supAlimNombre" type="text" placeholder="Nombre del suplemento"><input id="supAlimGramos" type="number" placeholder="Gramos por kg de peso vivo (g/kg)" step="1" value="50"><input id="supAlimPrecio" type="number" placeholder="Precio por kg ($)" step="1"><button class="btn btn-purple mt8" onclick="agregarSuplementoAlimento()"><i class="fa-solid fa-check"></i> AGREGAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); }
function agregarSuplementoAlimento() { var n = document.getElementById('supAlimNombre').value.trim(), g = parseInt(document.getElementById('supAlimGramos').value) || 50, precio = parseFloat(document.getElementById('supAlimPrecio').value) || 0; if (!n) { alert('⚠️ Nombre'); return; } DB.suplementosAlimento.push({ id:'supAlim_'+Date.now(), nombre:n, gramosPorKg:g, precioPorKg:precio, stock:0, icono:'fa-flask', color:'#a78bfa' }); save(); document.querySelector('.modal-overlay').remove(); renderInsumos(); showToast('✅ Agregado'); }
function editarSuplementoAlimento(id) { var sup = DB.suplementosAlimento.find(function(s) { return s.id === id; }); if (!sup) return; var html = '<div class="modal-title">✏️ EDITAR ' + sup.nombre + '</div><div class="flex-col gap10"><input id="editSupNombre" type="text" value="' + sup.nombre + '"><input id="editSupGramos" type="number" value="' + sup.gramosPorKg + '" placeholder="g/kg"><input id="editSupPrecio" type="number" value="' + (sup.precioPorKg || 0) + '" placeholder="Precio/kg"><button class="btn btn-gold mt8" onclick="guardarEdicionSuplemento(\'' + id + '\')"><i class="fa-solid fa-check"></i> GUARDAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); }
function guardarEdicionSuplemento(id) { var sup = DB.suplementosAlimento.find(function(s) { return s.id === id; }); if (!sup) return; sup.nombre = document.getElementById('editSupNombre').value.trim(); sup.gramosPorKg = parseInt(document.getElementById('editSupGramos').value) || 50; sup.precioPorKg = parseFloat(document.getElementById('editSupPrecio').value) || 0; save(); document.querySelector('.modal-overlay').remove(); renderInsumos(); showToast('✅ Actualizado'); }
function eliminarSuplementoAlimento(id) { if (confirm('⚠️ ¿Eliminar?')) { DB.suplementosAlimento = DB.suplementosAlimento.filter(function(s) { return s.id !== id; }); save(); renderInsumos(); showToast('✅ Eliminado'); } }
function comprarSuplementoAlimento(id) { var cantEl = document.getElementById('compraCantSup-' + id), costoEl = document.getElementById('compraCostoSup-' + id); if (!cantEl || !costoEl) return; var kg = parseFloat(cantEl.value), costo = parseFloat(costoEl.value); if (isNaN(kg) || kg <= 0) { alert('⚠️ Cantidad'); return; } if (isNaN(costo) || costo <= 0) { alert('⚠️ Costo'); return; } var sup = DB.suplementosAlimento.find(function(s) { return s.id === id; }); if (!sup) return; sup.stock = (sup.stock || 0) + kg; if (!sup.precioPorKg || sup.precioPorKg === 0) sup.precioPorKg = costo / kg; save(); cantEl.value = ''; costoEl.value = ''; renderInsumos(); showToast('✅ Stock +' + fm(kg) + ' kg'); }

// ==================== 8. RENDER SANIDAD ====================
function renderSanidad() {
    var catalogo = getCatalogoSanidadCompleto();
    var html = '<div class="card"><div style="font-weight:700;font-size:.8rem;margin-bottom:12px;color:var(--accent);"><i class="fa-solid fa-syringe"></i> INVENTARIO SANIDAD</div>';
    for (var i = 0; i < catalogo.length; i++) {
        var prod = catalogo[i], stock = prod.tipo === 'fijo' ? (DB.stockSanidad[prod.id] || 0) : (prod.stock || 0);
        var precioML = prod.tipo === 'fijo' ? (DB.preciosSanidad[prod.id] || 0) : (prod.precioML || 0);
        html += '<div style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,.03);"><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;"><i class="fa-solid ' + prod.icono + '" style="color:' + prod.color + ';font-size:1.2rem;width:22px;"></i><div style="flex:1;"><span style="font-size:.78rem;font-weight:600;">' + prod.nombre + '</span><span style="font-size:.6rem;color:var(--muted);display:block;">Stock: <b>' + fm(stock) + ' ml</b> · $<b>' + fm(precioML) + '/ml</b> · Efecto: ' + prod.diasEfecto + 'd · Venta: ' + prod.retiro + 'd</span></div></div>' +
            '<div style="font-size:.65rem;color:var(--muted);margin-bottom:6px;">➕ Comprar:</div><div style="display:flex;gap:6px;align-items:center;"><input id="compraML-' + prod.id + '" type="number" placeholder="ml" style="flex:1;padding:8px 10px;font-size:.7rem;min-height:36px;"><input id="compraCostoS-' + prod.id + '" type="number" placeholder="Costo total ($)" style="flex:1;padding:8px 10px;font-size:.7rem;min-height:36px;"><button class="btn btn-green" onclick="agregarCompraSanidad(\'' + prod.id + '\')" style="width:auto;padding:8px 12px;font-size:.65rem;"><i class="fa-solid fa-cart-shopping"></i></button></div></div>';
    }
    html += '<button class="btn btn-purple mt12" onclick="openAgregarSuplementoSanidad()"><i class="fa-solid fa-plus"></i> AGREGAR INYECTABLE</button></div>';
    document.getElementById('v-sanidad').innerHTML = html;
}
function openAgregarSuplementoSanidad() { var html = '<div class="modal-title">💉 NUEVO INYECTABLE</div><div class="flex-col gap10"><input id="supSanNombre" type="text" placeholder="Nombre"><input id="supSanDosis" type="number" placeholder="Dosis (ml/kg)" step="1" value="50"><input id="supSanDiasEfecto" type="number" placeholder="Días de efecto" step="1" value="30"><input id="supSanRetiro" type="number" placeholder="Días de retiro" step="1" value="0"><button class="btn btn-purple mt8" onclick="agregarSuplementoSanidad()"><i class="fa-solid fa-check"></i> AGREGAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); }
function agregarSuplementoSanidad() { var n = document.getElementById('supSanNombre').value.trim(), dosis = parseFloat(document.getElementById('supSanDosis').value) || 50, diasEf = parseInt(document.getElementById('supSanDiasEfecto').value) || 30, ret = parseInt(document.getElementById('supSanRetiro').value) || 0; if (!n) { alert('⚠️ Nombre'); return; } DB.suplementosSanidad.push({ id:'supSan_'+Date.now(), nombre:n, dosis:dosis, diasEfecto:diasEf, retiro:ret, stock:0, precioML:0, icono:'fa-syringe', color:'#a78bfa', tipo:'personalizado' }); save(); document.querySelector('.modal-overlay').remove(); renderSanidad(); showToast('✅ Agregado'); }
function agregarCompraSanidad(prodId) { var mlEl = document.getElementById('compraML-' + prodId), costoEl = document.getElementById('compraCostoS-' + prodId); if (!mlEl || !costoEl) return; var ml = parseFloat(mlEl.value), costo = parseFloat(costoEl.value); if (isNaN(ml) || ml <= 0) { alert('⚠️ Cantidad'); return; } if (isNaN(costo) || costo <= 0) { alert('⚠️ Costo'); return; } var supPers = DB.suplementosSanidad.find(function(s) { return s.id === prodId; }); if (supPers) { supPers.stock = (supPers.stock || 0) + ml; supPers.precioML = costo / ml; } else { DB.stockSanidad[prodId] = (DB.stockSanidad[prodId] || 0) + ml; DB.preciosSanidad[prodId] = costo / ml; } save(); mlEl.value = ''; costoEl.value = ''; renderSanidad(); showToast('✅ Compra registrada'); }

// ==================== 9. RENDER AJUSTES ====================
function renderAjustes() {
    var html = '<div class="card config-section"><h3><i class="fa-solid fa-database"></i> RESPALDO</h3>' +
        '<button class="btn btn-gold" onclick="exportarDatos()"><i class="fa-solid fa-download"></i> EXPORTAR</button>' +
        '<button class="btn btn-gray" onclick="importarDatos()"><i class="fa-solid fa-upload"></i> IMPORTAR</button></div>' +
        '<div class="card config-section"><h3><i class="fa-solid fa-info-circle"></i> INFORMACIÓN</h3>' +
        '<p style="font-size:.7rem;color:var(--muted);">GANADERO ÉLITE v3.0</p>' +
        '<p style="font-size:.6rem;color:var(--muted);">IA Local · Regresión Lineal</p>' +
        '<p style="font-size:.6rem;color:var(--muted);">Guardado: ' + (localStorage.getItem('ganadero_elite_lastSave') || 'Nunca') + '</p></div>';
    document.getElementById('v-ajustes').innerHTML = html;
}
function exportarDatos() { var b = new Blob([JSON.stringify(DB,null,2)],{type:'application/json'}); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ganadero-elite-respaldo.json'; a.click(); showToast('✅ Exportado'); }
function importarDatos() { var i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = function(e) { var r = new FileReader(); r.onload = function(e) { try { DB = JSON.parse(e.target.result); save(); renderLote(); showToast('✅ Importado'); } catch(err) { alert('❌ Error'); } }; r.readAsText(e.target.files[0]); }; i.click(); }
// ==================== 10. PERFIL DEL ANIMAL ====================
function showProfile(id) {
    var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return;
    var p = a.historial[a.historial.length-1].peso, etapa = getEtapa(p);
    var r = getRendimiento(a.historial), gmd = getGMD(a.historial), cd = getCostoDiario(p);
    var csd = getCostoSanidadDiario(id);
    var cspld = getCostoTotalSuplementosDiario(p);
    var cst = 0; for (var i = 0; i < DB.aplicaciones.length; i++) { if (DB.aplicaciones[i].animalId === id) cst += (DB.aplicaciones[i].costo || 0); }
    var ckp = gmd > 0 ? (cd + csd + cspld) / gmd : 999999;
    var ingM = gmd * 30 * DB.precioKG, gan = ingM - (cd * 30) - (cst / 12) - (cspld * 30);
    var proy30Simple = p + (gmd * 30), proy60Simple = p + (gmd * 60), proy90Simple = p + (gmd * 90);
    var valorActual = p * DB.precioKG;
    var diasUltimo = getDiasDesde(a.historial[a.historial.length-1].fecha);

    // IA: Predicción con regresión lineal
    var pred30 = predecirPeso(a.historial, 30);
    var pred60 = predecirPeso(a.historial, 60);
    var pred90 = predecirPeso(a.historial, 90);
    var confianza = getConfianzaPrediccion(a.historial);
    var tendenciaTxt = getTendenciaTexto(a.historial);
    var hayIA = pred30 !== null;

    var apps = DB.aplicaciones.filter(function(app) { return app.animalId === id; }).slice(-5).reverse();
    var appsHTML = '';
    if (apps.length > 0) {
        appsHTML = '<div class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> APLICACIONES RECIENTES</div>';
        var catalogo = getCatalogoSanidadCompleto();
        for (var ap = 0; ap < apps.length; ap++) {
            var icono = 'fa-circle', color = '#fff';
            if (apps[ap].tipo === 'sanidad') { var prod = catalogo.find(function(p2) { return p2.id === apps[ap].productoId; }); if (prod) { icono = prod.icono; color = prod.color; } }
            else { icono = 'fa-flask'; color = '#a78bfa'; }
            appsHTML += '<div class="aplicacion-item"><span><i class="fa-solid ' + icono + '" style="color:' + color + ';"></i> ' + apps[ap].producto + '</span><span style="font-size:.65rem;">' + (apps[ap].cantidad || apps[ap].ml || '') + ' ' + (apps[ap].unidad || 'ml') + ' · $' + fm(apps[ap].costo || 0) + ' · ' + apps[ap].fecha + '</span></div>';
        }
    }

    var hist = '', rev = a.historial.slice().reverse();
    for (var i = 0; i < rev.length; i++) {
        var h = rev[i], ch = '', diasInfo = '';
        if (i === 0) diasInfo = '<span style="font-size:.6rem;color:var(--muted);margin-left:4px;">hace ' + getDiasDesde(h.fecha) + ' d</span>';
        if (i < a.historial.length-1) { var ant = a.historial[a.historial.length-2-i].peso, dif = h.peso - ant; var cls = dif >= 0 ? 'badge-up' : 'badge-down', sig = dif >= 0 ? '+' : ''; ch = '<span class="badge ' + cls + '">' + sig + ((dif/ant)*100).toFixed(1) + '%</span>'; }
        hist += '<div class="hist-item"><span><i class="fa-regular fa-calendar"></i> ' + h.fecha + diasInfo + '</span><div><span class="row-val">' + fm(h.peso) + ' kg</span>' + ch + '</div></div>';
    }

    // Dieta con alimentos fijos + suplementos
    var dietaHTML = '';
    for (var x = 0; x < ALIMENTOS.length; x++) {
        var d = getDiet(p); var bl = (ALIMENTOS[x] === 'urea' || ALIMENTOS[x] === 'melaza') && etapa.ureaBloqueada;
        var cant = (ALIMENTOS[x] === 'pasto' || ALIMENTOS[x] === 'salvado') ? d[ALIMENTOS[x]].toFixed(1) + ' kg' : Math.round(d[ALIMENTOS[x]]) + ' g';
        var costo = (d[ALIMENTOS[x]] || 0) * (DB.precios[ALIMENTOS[x]] || 0);
        if (ALIMENTOS[x] !== 'pasto' && ALIMENTOS[x] !== 'salvado') costo = ((d[ALIMENTOS[x]] || 0) / 1000) * (DB.precios[ALIMENTOS[x]] || 0);
        dietaHTML += '<div class="row"><span class="row-label"><i class="fa-solid ' + IC_ALIMENTOS[ALIMENTOS[x]] + '"></i> ' + NM_ALIMENTOS[ALIMENTOS[x]] + '</span><span class="row-val" style="' + (bl ? 'color:#6b7280;text-decoration:line-through' : '') + '">' + (bl ? '0 g (🔒)' : cant + ' · $' + fm(costo)) + '</span></div>';
    }
    if (DB.suplementosAlimento.length > 0) {
        dietaHTML += '<div class="section-divider"></div><div class="section-subtitle"><i class="fa-solid fa-flask"></i> SUPLEMENTOS (g/kg)</div>';
        for (var s = 0; s < DB.suplementosAlimento.length; s++) {
            var sup = DB.suplementosAlimento[s], dosis = getDosisSuplemento(p, sup), costoDosis = dosis * (sup.precioPorKg || 0);
            dietaHTML += '<div class="row"><span class="row-label"><i class="fa-solid ' + (sup.icono || 'fa-flask') + '" style="color:' + (sup.color || '#a78bfa') + ';"></i> ' + sup.nombre + ' <span style="font-size:.6rem;color:var(--muted);">(' + sup.gramosPorKg + ' g/kg)</span></span><span class="row-val">' + dosis.toFixed(2) + ' kg · $' + fm(costoDosis) + '</span></div>';
        }
    }

    document.getElementById('v-lote').classList.add('hidden');
    document.getElementById('v-insumos').classList.add('hidden');
    document.getElementById('v-sanidad').classList.add('hidden');
    document.getElementById('v-ajustes').classList.add('hidden');
    document.getElementById('v-perfil').classList.remove('hidden');
    document.getElementById('bottomNav').style.display = 'none';

    // Construir HTML del perfil
    var html = '<div class="card"><div class="profile-header"><div><div class="profile-name">' + a.nombre + ' ' + etapa.icono + '</div><div class="profile-sub">' + etapa.rango + ' · ' + etapa.nombre + ' · ' + fm(p) + ' kg</div></div>' +
        '<div style="display:flex;gap:6px;"><button class="btn btn-purple btn-sm" onclick="openAplicarSanidad(' + id + ')"><i class="fa-solid fa-syringe"></i></button>' +
        '<button class="btn btn-gray btn-sm" onclick="deleteAnimal(' + id + ')" style="background:rgba(255,0,0,.06);color:#ef4444;"><i class="fa-solid fa-trash-can"></i></button></div></div>' +
        '<div style="margin-bottom:14px;"><div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--muted);margin-bottom:4px;"><span>Progreso</span><span>Faltan ' + fm(etapa.max - p) + ' kg para ' + etapa.siguienteEtapa + '</span></div>' +
        '<div class="progress"><div class="progress-fill" style="width:' + getProgresoEtapa(p, etapa) + '%;background:' + etapa.color + ';"></div></div></div>' +
        '<div class="alerta-card ' + r.color + '"><div class="alerta-led ' + r.color + '"><i class="fa-solid ' + r.icono + '"></i></div><div><div class="alerta-titulo">' + r.texto + '</div>' +
        '<div class="alerta-met">Ganancia: ' + gmd.toFixed(2) + ' kg/d | Crecimiento: ' + (r.cm >= 0 ? '+' : '') + r.cm.toFixed(1) + '% | Costo/kg: $' + fm(ckp) + '</div></div></div>' +
        '<div class="section-divider"></div>' +
        '<div class="mb14"><div class="row"><span class="row-label"><i class="fa-solid fa-weight-scale"></i> Peso</span><span class="row-val">' + fm(p) + ' kg</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-sack-dollar"></i> Valor</span><span class="row-val" style="color:var(--accent);">$ ' + fm(valorActual) + '</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-calendar-check"></i> Último pesaje</span><span class="row-val">' + a.historial[a.historial.length-1].fecha + ' (' + diasUltimo + ' d)</span></div></div>';

    // Sección IA
    if (hayIA) {
        html += '<div class="ia-card"><div class="ia-title"><i class="fa-solid fa-brain"></i> PREDICCIÓN IA (Regresión Lineal)</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;">' +
            '<div style="text-align:center;"><div style="font-size:.6rem;color:var(--muted);">30 DÍAS</div><div class="ia-prediction">' + fm(pred30) + ' kg</div></div>' +
            '<div style="text-align:center;"><div style="font-size:.6rem;color:var(--muted);">60 DÍAS</div><div class="ia-prediction">' + fm(pred60) + ' kg</div></div>' +
            '<div style="text-align:center;"><div style="font-size:.6rem;color:var(--muted);">90 DÍAS</div><div class="ia-prediction">' + fm(pred90) + ' kg</div></div></div>' +
            '<div class="ia-confidence">📊 Tendencia: ' + tendenciaTxt + ' · Confianza: ' + confianza + ' (basado en ' + a.historial.length + ' pesajes)</div></div>';
    }

    html += '<div class="section-divider"></div>' +
        '<div class="card" style="background:rgba(255,255,255,.02);margin-bottom:14px;"><div style="font-weight:700;font-size:.7rem;margin-bottom:8px;color:var(--muted);">RENTABILIDAD</div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-receipt"></i> Costo alim./día</span><span class="row-val">$ ' + fm(cd) + '</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-syringe"></i> Costo san./día</span><span class="row-val">$ ' + fm(csd) + '</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-flask"></i> Costo supl./día</span><span class="row-val">$ ' + fm(cspld) + '</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-calculator"></i> Costo por kilo</span><span class="row-val" style="color:' + (ckp < DB.precioKG ? '#22c55e' : '#ef4444') + '">$ ' + fm(ckp) + '/kg</span></div>' +
        '<div class="row"><span class="row-label"><i class="fa-solid fa-sack-dollar"></i> Ganancia neta/mes</span><span class="row-val" style="color:' + (gan >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gan) + '</span></div></div>' +
        '<div class="section-divider"></div>' +
        appsHTML + '<div class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> HISTORIAL PESAJES</div>' + hist +
        '<div class="section-divider"></div>' +
        '<div class="section-title"><i class="fa-solid fa-mortar-pestle"></i> DIETA DIARIA</div>' + dietaHTML +
        '<div class="section-divider"></div>' +
        '<div class="flex-col gap10 mt20 pt12 bt"><button class="btn btn-gold" onclick="updateWeight(' + id + ')"><i class="fa-solid fa-gauge-high"></i> REGISTRAR PESAJE</button></div></div>';

    document.getElementById('v-perfil').innerHTML = html;
    var oldBtn = document.getElementById('btnBackFloat'); if (oldBtn) oldBtn.remove();
    var btnBack = document.createElement('button'); btnBack.className = 'btn-back-float'; btnBack.id = 'btnBackFloat';
    btnBack.innerHTML = '<i class="fa-solid fa-arrow-left"></i>'; btnBack.onclick = closeProfile;
    document.body.appendChild(btnBack);
    window.scrollTo(0, 0); save();
}

function updateWeight(id) { var p = prompt('⚖️ Nuevo pesaje (kg):'); if (!p) return; p = parseFloat(p); if (isNaN(p) || p < 20 || p > 2000) { alert('⚠️ Peso 20-2000 kg'); return; } var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.historial.push({ fecha: new Date().toLocaleDateString(), peso: p }); save(); showProfile(id); }
function deleteAnimal(id) { if (confirm('⚠️ ¿Eliminar?')) { DB.animales = DB.animales.filter(function(x) { return x.id !== id; }); save(); closeProfile(); } }
function closeProfile() { var btn = document.getElementById('btnBackFloat'); if (btn) btn.remove(); document.getElementById('v-perfil').classList.add('hidden'); document.getElementById('bottomNav').style.display = 'flex'; renderLote(); save(); }

// ==================== 11. APLICAR SANIDAD ====================
function openAplicarSanidad(animalId) {
    var a = DB.animales.find(function(x) { return x.id === animalId; }); if (!a) return;
    var peso = a.historial[a.historial.length-1].peso;
    var catalogo = getCatalogoSanidadCompleto();
    var prodOptions = '';
    for (var i = 0; i < catalogo.length; i++) prodOptions += '<option value="' + catalogo[i].id + '">' + catalogo[i].nombre + '</option>';
    var html = '<div class="modal-title">💉 APLICAR A ' + a.nombre + ' (' + fm(peso) + ' kg)</div><div class="flex-col gap10">' +
        '<select id="aplProducto" onchange="calcularDosisModal(' + peso + ')">' + prodOptions + '</select>' +
        '<div id="dosisInfo" style="font-size:.7rem;color:var(--muted);"></div>' +
        '<input id="aplML" type="number" placeholder="ml aplicados" step=".1">' +
        '<button class="btn btn-gold mt8" onclick="aplicarProductoSanidad(' + animalId + ')"><i class="fa-solid fa-check"></i> CONFIRMAR</button>' +
        '<button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>';
    showModal(html); setTimeout(function() { calcularDosisModal(peso); }, 100);
}
function calcularDosisModal(peso) { var sel = document.getElementById('aplProducto'), info = document.getElementById('dosisInfo'); if (!sel || !info) return; var catalogo = getCatalogoSanidadCompleto(); var prod = catalogo.find(function(p) { return p.id === sel.value; }); if (prod) info.innerHTML = '📋 Dosis: <b>' + (peso / prod.dosis).toFixed(1) + ' ml</b> (1 ml/' + prod.dosis + ' kg)'; }
function aplicarProductoSanidad(animalId) {
    var sel = document.getElementById('aplProducto'), mlInput = document.getElementById('aplML'); if (!sel || !mlInput) return;
    var prodId = sel.value, ml = parseFloat(mlInput.value); if (isNaN(ml) || ml <= 0) { alert('⚠️ ml válidos'); return; }
    var catalogo = getCatalogoSanidadCompleto(); var prod = catalogo.find(function(p) { return p.id === prodId; });
    var a = DB.animales.find(function(x) { return x.id === animalId; }); if (!prod || !a) return;
    var precioML = prod.tipo === 'fijo' ? (DB.preciosSanidad[prodId] || 0) : (prod.precioML || 0);
    var costoTotal = precioML * ml;
    DB.aplicaciones.push({ animalId: animalId, productoId: prodId, producto: prod.nombre, cantidad: ml, unidad: 'ml', costo: costoTotal, fecha: new Date().toLocaleDateString(), tipo: 'sanidad' });
    if (prod.tipo === 'fijo') { DB.stockSanidad[prodId] = Math.max(0, (DB.stockSanidad[prodId] || 0) - ml); }
    else { prod.stock = Math.max(0, (prod.stock || 0) - ml); }
    save(); document.querySelector('.modal-overlay').remove();
    showToast('✅ ' + prod.nombre + ': ' + ml + ' ml ($' + fm(costoTotal) + ')'); showProfile(animalId);
}

// ==================== 12. AUTO-GUARDADO ====================
cargarDatos();
renderLote();
window.addEventListener('beforeunload', function() { save(); });
document.addEventListener('visibilitychange', function() { if (document.hidden) save(); });
setInterval(function() { save(); }, 30000);
console.log('✅ GANADERO ÉLITE v3.0 listo - IA Local activa');
