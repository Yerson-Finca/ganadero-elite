console.log('GANADERO ÉLITE v3.2.1');

// ==================== UTILIDADES ====================
function fm(n) { if (isNaN(n) || n === null || n === undefined) return '0'; n = Math.round(n); var s = String(n), r = '', c = 0; for (var i = s.length - 1; i >= 0; i--) { if (c > 0 && c % 3 === 0) r = '.' + r; r = s.charAt(i) + r; c++; } return r; }
function showToast(m, d) { d = d || 3000; var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = m; document.getElementById('toastContainer').appendChild(t); setTimeout(function() { t.remove(); }, d); }
function showModal(h) { var o = document.createElement('div'); o.className = 'modal-overlay'; o.innerHTML = '<div class="modal">' + h + '</div>'; o.onclick = function(e) { if (e.target === o) o.remove(); }; document.getElementById('modalContainer').appendChild(o); }
function getIconoAnimal(a) {
    if (a.foto) return '<img src="' + a.foto + '" alt="' + a.nombre + '" style="width:100%;height:100%;object-fit:cover;">';
    var etapa = getEtapaCompleta(a.historial[a.historial.length-1].peso, a.tipo, a.estadoRepro);
    return etapa.icono;
}

// ==================== BASE DE DATOS ====================
var DB = { animales: [], aplicaciones: [], lotes: [], precios: { pasto:1200, salvado:2500, melaza:3800, levadura:8000, bicarb:4500, sal:6200, urea:9500 }, stock: { pasto:500, salvado:200, melaza:50, levadura:10, bicarb:5, sal:2, urea:20 }, stockSanidad: {}, preciosSanidad: {}, suplementosAlimento: [], suplementosSanidad: [], precioKG: 9800, litroLeche: 1500 };
function cargarDatos() { try { var s = localStorage.getItem('ganadero_elite_v8'); if (s) { DB = JSON.parse(s); return; } } catch(e) {} }
function save() { try { localStorage.setItem('ganadero_elite_v8', JSON.stringify(DB)); } catch(e) {} }

// ==================== CATÁLOGOS ====================
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

// ==================== MATRIZ DE SUPLEMENTACIÓN ====================
var MATRIZ_ENGORDE = { 'Cría': { melaza:2, urea:0, bicarb:0.10, sal:0.15 }, 'Levante': { melaza:3, urea:0.11, bicarb:0.125, sal:0.20 }, 'Ceba': { melaza:5, urea:0.11, bicarb:0.15, sal:0.20 }, 'Venta': { melaza:5, urea:0.11, bicarb:0.15, sal:0.20 } };
var MATRIZ_LECHE = { 'Novilla': { melaza:1, urea:0.05, bicarb:0.10, sal:0.25 }, 'Parida': { melaza:3, urea:0.08, bicarb:0.20, sal:0.50 }, 'Seca': { melaza:1, urea:0.05, bicarb:0.10, sal:0.20 }, 'Venta': { melaza:5, urea:0.11, bicarb:0.15, sal:0.20 } };

function getEtapa(pv, tipo) { if (tipo === 'leche') { if (pv < 350) return 'Novilla'; return 'Parida'; } if (pv < 150) return 'Cría'; if (pv < 350) return 'Levante'; if (pv < 500) return 'Ceba'; return 'Venta'; }
function getEtapaCompleta(pv, tipo, estadoRepro) {
    if (tipo === 'leche') {
        if (estadoRepro === 'venta') return { nombre:'Venta', clase:'etapa-madurez', icono:'🦬', rango:'Venta (Descarte)', color:'#f87171', cardClass:'etapa-madurez-card' };
        if (estadoRepro === 'seca') return { nombre:'Seca', clase:'etapa-desarrollo', icono:'🐄', rango:'Seca (Descanso)', color:'#60a5fa', cardClass:'etapa-desarrollo-card' };
        if (estadoRepro === 'parida') return { nombre:'Parida', clase:'etapa-ceba', icono:'🐄', rango:'Parida (Producción)', color:'#fb923c', cardClass:'etapa-ceba-card' };
        if (pv < 350) return { nombre:'Novilla', clase:'etapa-inicio', icono:'🐄', rango:'Novilla', color:'#fbbf24', cardClass:'etapa-inicio-card' };
        return { nombre:'Parida', clase:'etapa-ceba', icono:'🐄', rango:'Parida', color:'#fb923c', cardClass:'etapa-ceba-card' };
    }
    if (pv < 150) return { nombre:'Cría', clase:'etapa-inicio', icono:'🐮', rango:'Cría', min:0, max:150, ureaBloqueada:true, color:'#fbbf24', cardClass:'etapa-inicio-card', siguienteEtapa:'Levante' };
    if (pv < 350) return { nombre:'Levante', clase:'etapa-desarrollo', icono:'🐂', rango:'Levante', min:150, max:350, ureaBloqueada:false, color:'#60a5fa', cardClass:'etapa-desarrollo-card', siguienteEtapa:'Ceba' };
    if (pv < 500) return { nombre:'Ceba', clase:'etapa-ceba', icono:'🐃', rango:'Ceba', min:350, max:500, ureaBloqueada:false, color:'#fb923c', cardClass:'etapa-ceba-card', siguienteEtapa:'Venta' };
    return { nombre:'Venta', clase:'etapa-madurez', icono:'🦬', rango:'Venta', min:500, max:9999, ureaBloqueada:false, color:'#f87171', cardClass:'etapa-madurez-card', siguienteEtapa:'Venta' };
}
function getProgresoEtapa(pv, e) { return Math.min(100, Math.max(0, ((pv - (e.min||0)) / ((e.max||9999) - (e.min||0))) * 100)); }
function getDietaCompleta(pv, tipo, estadoRepro) {
    var etapa = getEtapa(pv, tipo);
    var matriz = tipo === 'leche' ? MATRIZ_LECHE : MATRIZ_ENGORDE;
    if (tipo === 'leche' && estadoRepro === 'seca') etapa = 'Seca';
    if (tipo === 'leche' && estadoRepro === 'venta') etapa = 'Venta';
    if (tipo === 'leche' && estadoRepro === 'parida') etapa = 'Parida';
    var m = matriz[etapa] || matriz['Levante'];
    var consumoTotal = pv * 0.03;
    return { pasto: consumoTotal * 0.90, salvado: consumoTotal * 0.10, melaza: consumoTotal * (m.melaza / 100), urea: (pv < 150 && tipo === 'engorde') ? 0 : (pv * m.urea), bicarb: pv * m.bicarb, sal: pv * m.sal, levadura: pv * 0.05, consumoTotal: consumoTotal };
}
function getDiasDesde(f) { if (!f) return 999; var p = f.split('/'); if (p.length < 3) return 999; return Math.floor((new Date() - new Date(p[2], p[1]-1, p[0])) / 86400000); }
function getGMD(h) { return h.length < 2 ? 0 : (h[h.length-1].peso - h[h.length-2].peso) / 30; }
function getCostoDiario(pv, tipo, estadoRepro) { var d = getDietaCompleta(pv, tipo, estadoRepro); return (d.pasto||0)*(DB.precios.pasto||0) + (d.salvado||0)*(DB.precios.salvado||0) + ((d.melaza||0)/1000)*(DB.precios.melaza||0) + ((d.urea||0)/1000)*(DB.precios.urea||0) + ((d.bicarb||0)/1000)*(DB.precios.bicarb||0) + ((d.sal||0)/1000)*(DB.precios.sal||0) + ((d.levadura||0)/1000)*(DB.precios.levadura||0); }
function getRendimiento(h) { if (h.length < 2) return { nivel:'azul', texto:'Registre más pesajes', icono:'fa-circle-info', cm:0, color:'azul', tendencia:'stable' }; var act = h[h.length-1].peso, ant = h[h.length-2].peso, cm = ((act-ant)/ant)*100; var tend = cm > 0 ? 'up' : cm < 0 ? 'down' : 'stable'; if (act < ant) return { nivel:'gris', texto:'Pérdida', icono:'fa-circle-exclamation', cm:cm, color:'gris', tendencia:tend }; if (cm >= 5) return { nivel:'verde', texto:'Excelente', icono:'fa-crown', cm:cm, color:'verde', tendencia:tend }; if (cm >= 3.5) return { nivel:'azul', texto:'Bueno', icono:'fa-circle-check', cm:cm, color:'azul', tendencia:tend }; if (cm >= 2.5) return { nivel:'naranja', texto:'Regular', icono:'fa-triangle-exclamation', cm:cm, color:'naranja', tendencia:tend }; return { nivel:'rojo', texto:'Bajo', icono:'fa-circle-exclamation', cm:cm, color:'rojo', tendencia:tend }; }

// ==================== IA ====================
function predecirPeso(historial, diasFuturo) { if (historial.length < 3) return null; var n = historial.length, sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0; var p0 = historial[0].fecha.split('/'); var fb = new Date(parseInt(p0[2]), parseInt(p0[1])-1, parseInt(p0[0])); if (isNaN(fb.getTime())) return null; for (var i = 0; i < n; i++) { var pi = historial[i].fecha.split('/'); var fa = new Date(parseInt(pi[2]), parseInt(pi[1])-1, parseInt(pi[0])); if (isNaN(fa.getTime())) continue; var dr = Math.floor((fa - fb) / 86400000); sumX += dr; sumY += historial[i].peso; sumXY += dr * historial[i].peso; sumX2 += dr * dr; } var den = (n * sumX2 - sumX * sumX); if (den === 0) return null; var m = (n * sumXY - sumX * sumY) / den; var b = (sumY - m * sumX) / n; var pu = historial[n-1].fecha.split('/'); var fu = new Date(parseInt(pu[2]), parseInt(pu[1])-1, parseInt(pu[0])); return m * (Math.floor((fu - fb) / 86400000) + diasFuturo) + b; }
function getConfianzaPrediccion(historial) { if (historial.length < 3) return 'Baja'; var cm = []; for (var i = 1; i < historial.length; i++) cm.push(historial[i].peso - historial[i-1].peso); var med = cm.reduce(function(a,b){return a+b;},0)/cm.length; if (med === 0) return 'Baja'; var vr = cm.reduce(function(a,b){return a+Math.pow(b-med,2);},0)/cm.length; var cv = Math.sqrt(vr)/Math.abs(med); if (cv < 0.3) return 'Alta'; if (cv < 0.6) return 'Media'; return 'Baja'; }
function getTendenciaTexto(historial) { if (historial.length < 2) return '📊 Estable'; var c = 0; for (var i = 1; i < historial.length; i++) { if (historial[i].peso > historial[i-1].peso) c++; else if (historial[i].peso < historial[i-1].peso) c--; } if (c > 0) return '📈 Mejorando'; if (c < 0) return '📉 Empeorando'; return '📊 Estable'; }

// ==================== SEMÁFORO ====================
function getSemaforo(animal) { if (animal.tipo !== 'leche' || animal.estadoRepro !== 'parida' || !animal.fechaParto) return null; var diasPostParto = getDiasDesde(animal.fechaParto); if (diasPostParto > 365) diasPostParto = 365; if (diasPostParto <= 150) return { color:'verde', texto:'Ventana óptima', dias:diasPostParto }; if (diasPostParto <= 180) return { color:'amarillo', texto:'Revisar nutrición', dias:diasPostParto }; return { color:'rojo', texto:'Evaluar rentabilidad', dias:diasPostParto }; }

// ==================== NAVEGACIÓN ====================
document.getElementById('bottomNav').addEventListener('click', function(e) { var btn = e.target.closest('button'); if (!btn || !btn.hasAttribute('data-p')) return; goPage(btn.getAttribute('data-p')); });
function goPage(p) { ['v-lote','v-insumos','v-sanidad','v-ajustes','v-perfil'].forEach(function(id) { document.getElementById(id).classList.add('hidden'); }); document.getElementById('v-' + p).classList.remove('hidden'); var btns = document.querySelectorAll('#bottomNav .bn-btn'); for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active'); var ab = document.querySelector('#bottomNav button[data-p="' + p + '"]'); if (ab) ab.classList.add('active'); if (p === 'lote') renderDashboard(); if (p === 'insumos') renderInsumos(); if (p === 'sanidad') renderSanidad(); if (p === 'ajustes') renderAjustes(); window.scrollTo(0, 0); }

// ==================== MODAL AGREGAR ANIMAL ====================
function toggleAdd() { var m = document.getElementById('addAnimalModal'); m.classList.toggle('hidden'); if (!m.classList.contains('hidden')) { actualizarSelectLotes(); document.getElementById('newN').focus(); } }
function closeAddModal() { document.getElementById('addAnimalModal').classList.add('hidden'); }
function toggleOrigen() { var o = document.getElementById('newOrigen').value; document.getElementById('origenNacimiento').classList.toggle('hidden', o !== 'nacimiento'); document.getElementById('origenComprado').classList.toggle('hidden', o !== 'comprado'); }
function actualizarSelectLotes() { var sel = document.getElementById('newLote'); sel.innerHTML = '<option value="">Sin lote (por defecto)</option>'; for (var i = 0; i < DB.lotes.length; i++) { sel.innerHTML += '<option value="' + DB.lotes[i].id + '">' + DB.lotes[i].nombre + ' (' + (DB.lotes[i].tipo === 'engorde' ? '🥩' : '🥛') + ')</option>'; } }
function addAnimal() { var n = document.getElementById('newN').value.trim(), p = parseFloat(document.getElementById('newW').value); if (!n || n.length < 2) { alert('⚠️ Nombre válido'); return; } if (isNaN(p) || p < 20 || p > 2000) { alert('⚠️ Peso 20-2000 kg'); return; } var tipo = document.getElementById('newTipo').value; var origen = document.getElementById('newOrigen').value; var loteId = document.getElementById('newLote').value; var animal = { id: Date.now(), nombre: n, tipo: tipo, origen: origen, historial: [{ fecha: new Date().toLocaleDateString(), peso: p }], lote: loteId || null, foto: null }; if (origen === 'nacimiento') { animal.madre = document.getElementById('newMadre').value.trim() || null; animal.fechaNacimiento = new Date().toLocaleDateString(); } if (origen === 'comprado') { animal.precioCompra = parseFloat(document.getElementById('newPrecio').value) || 0; animal.fechaCompra = new Date().toLocaleDateString(); } if (tipo === 'leche') { animal.estadoRepro = (p < 350) ? 'novilla' : 'parida'; animal.produccionLeche = []; } DB.animales.push(animal); save(); closeAddModal(); renderDashboard(); showToast('✅ ' + n + ' registrado'); }
// ==================== RENDER DASHBOARD (LOTES + MÉTRICAS) ====================
function renderDashboard() {
    var price = DB.precioKG, totalKg = 0, mez = { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 };
    var costoTotal = 0, est = { verde:0, azul:0, naranja:0, rojo:0, gris:0 };
    var csTotal = 0, cards = '', mejorA = null, peorA = null, pesoProy30 = 0;
    for (var i = 0; i < DB.aplicaciones.length; i++) { if (DB.aplicaciones[i].tipo === 'sanidad') csTotal += (DB.aplicaciones[i].costo || 0); }
    var cSuplTotal = 0;

    // Calcular métricas por lote
    var metricasLotes = [];
    for (var i = 0; i < DB.lotes.length; i++) {
        var lote = DB.lotes[i];
        var animalesLote = DB.animales.filter(function(a) { return a.lote === lote.id; });
        var kgLote = 0, costoDiarioLote = 0, gmdLote = 0, countGMD = 0, litrosLote = 0;
        for (var j = 0; j < animalesLote.length; j++) {
            var a = animalesLote[j], cp = a.historial[a.historial.length-1].peso;
            kgLote += cp;
            costoDiarioLote += getCostoDiario(cp, a.tipo, a.estadoRepro);
            var g = getGMD(a.historial);
            if (a.historial.length >= 2) { gmdLote += g; countGMD++; }
            if (a.tipo === 'leche' && a.produccionLeche && a.produccionLeche.length > 0) litrosLote += a.produccionLeche[a.produccionLeche.length-1].litros;
        }
        var promGMD = countGMD > 0 ? gmdLote / countGMD : 0;
        var valorLote = kgLote * price;
        var ingresoLote = promGMD * 30 * price * animalesLote.length;
        var gananciaLote = ingresoLote - (costoDiarioLote * 30);
        metricasLotes.push({ lote: lote, animales: animalesLote.length, kg: kgLote, valor: valorLote, gmd: promGMD, costoDiario: costoDiarioLote, ganancia: gananciaLote, litros: litrosLote });
    }
    // Ordenar por ganancia
    metricasLotes.sort(function(a, b) { return b.ganancia - a.ganancia; });

    // Calcular animales sin lote
    var animalesSinLote = DB.animales.filter(function(a) { return !a.lote; });
    var kgSinLote = 0; for (var i = 0; i < animalesSinLote.length; i++) kgSinLote += animalesSinLote[i].historial[animalesSinLote[i].historial.length-1].peso;

    // Tarjetas de lotes
    var lotesHTML = '';
    for (var i = 0; i < metricasLotes.length; i++) {
        var m = metricasLotes[i];
        var tipoIcono = m.lote.tipo === 'engorde' ? '🥩' : '🥛';
        lotesHTML += '<div class="lote-card" onclick="verLote(\'' + m.lote.id + '\')"><div class="lote-nombre">' + tipoIcono + ' ' + m.lote.nombre + ' <span style="font-size:.65rem;color:var(--muted);">(' + m.animales + ')</span></div><div class="lote-stats"><span>⚖️ ' + fm(m.kg) + ' kg</span><span>📈 GMD: ' + m.gmd.toFixed(2) + '</span><span>💵 ' + (m.ganancia >= 0 ? '+' : '') + '$' + fm(m.ganancia) + '/mes</span>' + (m.litros > 0 ? '<span>🥛 ' + m.litros + ' L/d</span>' : '') + '</div></div>';
    }
    if (animalesSinLote.length > 0) {
        lotesHTML += '<div class="lote-card" onclick="verAnimalesSinLote()"><div class="lote-nombre">📋 SIN LOTE <span style="font-size:.65rem;color:var(--muted);">(' + animalesSinLote.length + ')</span></div><div class="lote-stats"><span>⚖️ ' + fm(kgSinLote) + ' kg</span></div></div>';
    }
    lotesHTML += '<button class="btn btn-sm" style="width:100%;background:rgba(255,255,255,.03);color:var(--muted);" onclick="verTodosAnimales()"><i class="fa-solid fa-list"></i> VER TODOS LOS ANIMALES (' + DB.animales.length + ')</button>';

    // Métricas generales
    for (var i = 0; i < DB.animales.length; i++) {
        var a = DB.animales[i], cp = a.historial[a.historial.length-1].peso; totalKg += cp;
        var d = getDietaCompleta(cp, a.tipo, a.estadoRepro); for (var k in mez) mez[k] += (d[k] || 0);
        costoTotal += getCostoDiario(cp, a.tipo, a.estadoRepro);
        var r = getRendimiento(a.historial); est[r.nivel] = (est[r.nivel] || 0) + 1;
        var gmd = getGMD(a.historial); if (!mejorA || gmd > mejorA.gmd) mejorA = { nombre: a.nombre, gmd: gmd, id: a.id }; if (!peorA || gmd < peorA.gmd) peorA = { nombre: a.nombre, gmd: gmd, id: a.id };
        var p30 = predecirPeso(a.historial, 30); if (p30) pesoProy30 += p30;
    }
    var ta = DB.animales.length, prom = ta > 0 ? totalKg/ta : 0;
    var gmdL = ta > 0 ? DB.animales.reduce(function(s,a) { return s + getGMD(a.historial); }, 0) / ta : 0;
    var ingM = gmdL * 30 * price * ta, cosM = costoTotal * 30, gan = ingM - cosM - (csTotal/12) - (cSuplTotal/12);
    var valorProy30 = pesoProy30 * price;

    // IA del lote
    var iaHTML = '';
    if (pesoProy30 > 0) {
        var gan30 = valorProy30 - (totalKg * price);
        iaHTML = '<div class="ia-card"><div class="ia-title"><i class="fa-solid fa-brain"></i> PREDICCIÓN IA DEL LOTE</div><div class="row"><span class="row-label">Peso en 30d</span><span class="row-val">' + fm(pesoProy30) + ' kg</span></div><div class="row"><span class="row-label">Valor en 30d</span><span class="row-val" style="color:var(--accent);">$ ' + fm(valorProy30) + '</span></div><div class="row"><span class="row-label">Ganancia est.</span><span class="row-val" style="color:' + (gan30 >= 0 ? '#22c55e' : '#ef4444') + '">' + (gan30 >= 0 ? '+' : '') + '$ ' + fm(gan30) + '</span></div>';
        if (mejorA) iaHTML += '<div class="ranking-item" onclick="showProfile(' + mejorA.id + ')" style="cursor:pointer;"><span class="ranking-emoji">🏆</span> Mejor animal: <b>' + mejorA.nombre + '</b> (+' + mejorA.gmd.toFixed(2) + ' kg/d)</div>';
        if (peorA && ta > 1) iaHTML += '<div class="ranking-item" onclick="showProfile(' + peorA.id + ')" style="cursor:pointer;"><span class="ranking-emoji">⚠️</span> Atención: <b>' + peorA.nombre + '</b> (+' + peorA.gmd.toFixed(2) + ' kg/d)</div>';
        iaHTML += '</div>';
    }

    // Ranking de lotes
    var rankingHTML = '';
    if (metricasLotes.length > 1) {
        rankingHTML = '<div class="card card-sm"><div style="font-weight:700;font-size:.65rem;margin-bottom:4px;color:var(--muted);"><i class="fa-solid fa-trophy"></i> RANKING DE LOTES</div>';
        for (var i = 0; i < Math.min(metricasLotes.length, 3); i++) {
            var medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            rankingHTML += '<div class="ranking-item">' + medalla + ' <b>' + metricasLotes[i].lote.nombre + '</b>: ' + (metricasLotes[i].ganancia >= 0 ? '+' : '') + '$' + fm(metricasLotes[i].ganancia) + '/mes</div>';
        }
        rankingHTML += '</div>';
    }

    // Consumo diario
    var mezHTML = '';
    for (var z = 0; z < ALIMENTOS.length; z++) mezHTML += '<div class="row"><span class="row-label"><i class="fa-solid ' + IC_ALIMENTOS[ALIMENTOS[z]] + '"></i> ' + NM_ALIMENTOS[ALIMENTOS[z]] + '</span><span class="row-val">' + (ALIMENTOS[z] === 'pasto' || ALIMENTOS[z] === 'salvado' ? mez[ALIMENTOS[z]].toFixed(1) + ' kg' : Math.round(mez[ALIMENTOS[z]]) + ' g') + '</span></div>';

    var html = '<div class="card card-sm"><div style="font-weight:600;"><i class="fa-solid fa-coins"></i> PRECIO KG EN PIE</div><div style="display:flex;align-items:center;gap:6px;"><span style="font-size:1.1rem;font-weight:800;color:var(--accent);">$</span><input id="inpPKG" type="number" value="' + price + '" style="font-size:1.1rem;font-weight:700;text-align:center;"><span style="font-size:.7rem;color:var(--muted);">COP</span></div><button class="btn btn-green mt8" onclick="savePKG()"><i class="fa-solid fa-check"></i> ACTUALIZAR</button></div>' +
        '<div class="card card-sm"><div class="capital-value">$ ' + fm(totalKg * price) + '</div><div class="stats-grid"><div class="stat-item"><div class="row-label"><i class="fa-solid fa-users"></i> Cabezas</div><div class="row-val">' + ta + '</div></div><div class="stat-item"><div class="row-label"><i class="fa-solid fa-weight-scale"></i> Peso Total</div><div class="row-val">' + fm(totalKg) + ' kg</div></div></div></div>' +
        '<div class="section-title"><i class="fa-solid fa-layer-group"></i> LOTES</div>' + lotesHTML + rankingHTML + iaHTML +
        '<div class="card card-sm"><div style="font-weight:700;font-size:.65rem;margin-bottom:4px;color:var(--muted);"><i class="fa-solid fa-coins"></i> FINANZAS</div><div class="row"><span class="row-label"><i class="fa-solid fa-receipt"></i> Alimentación/día</span><span class="row-val">$ ' + fm(costoTotal) + '</span></div><div class="row"><span class="row-label"><i class="fa-solid fa-chart-line"></i> Ganancia/mes</span><span class="row-val" style="color:' + (gan >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gan) + '</span></div></div>' +
        '<div class="card card-sm"><div style="font-weight:700;font-size:.65rem;margin-bottom:4px;color:var(--accent);"><i class="fa-solid fa-blender"></i> CONSUMO DIARIO</div>' + mezHTML + '</div>';
    document.getElementById('v-lote').innerHTML = html;
}
function savePKG() { var el = document.getElementById('inpPKG'); if (el) { DB.precioKG = parseFloat(el.value) || 0; save(); renderDashboard(); showToast('✅ Precio actualizado'); } }

// ==================== VER LOTES / ANIMALES ====================
function verLote(loteId) { var lote = DB.lotes.find(function(l) { return l.id === loteId; }); if (!lote) return; var animales = DB.animales.filter(function(a) { return a.lote === loteId; }); renderAnimalesGrid(animales, (lote.tipo === 'engorde' ? '🥩 ' : '🥛 ') + lote.nombre); }
function verAnimalesSinLote() { var animales = DB.animales.filter(function(a) { return !a.lote; }); renderAnimalesGrid(animales, '📋 Sin Lote'); }
function verTodosAnimales() { renderAnimalesGrid(DB.animales, '📋 Todos los Animales'); }
function renderAnimalesGrid(animales, titulo) {
    var cards = '';
    for (var i = 0; i < animales.length; i++) {
        var a = animales[i], cp = a.historial[a.historial.length-1].peso;
        var etapa = getEtapaCompleta(cp, a.tipo, a.estadoRepro);
        var r = getRendimiento(a.historial);
        var lm = { verde:'ml-g', azul:'ml-b', naranja:'ml-o', rojo:'ml-r', gris:'ml-x' }, sg = r.cm >= 0 ? '+' : '';
        var semaforo = getSemaforo(a); var semaforoHTML = semaforo ? '<span class="semaforo semaforo-' + semaforo.color + '"></span>' : '';
        cards += '<div class="animal-card ' + etapa.cardClass + '" onclick="showProfile(' + a.id + ')"><div class="mini-led ' + lm[r.nivel] + '"></div><div class="animal-avatar">' + getIconoAnimal(a) + '</div><div class="name">' + a.nombre + ' ' + semaforoHTML + '</div><span class="etapa-tag ' + etapa.clase + '">' + etapa.rango + '</span><div class="weight">' + fm(cp) + ' kg</div><div class="cm" style="color:' + (r.cm >= 0 ? '#22c55e' : '#ef4444') + '">' + sg + r.cm.toFixed(1) + '%</div></div>';
    }
    var html = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;"><div style="font-weight:700;font-size:.8rem;color:var(--accent);">' + titulo + ' (' + animales.length + ')</div><button class="btn btn-gray btn-sm" onclick="renderDashboard()">← Volver</button></div></div><div class="grid">' + cards + '</div>';
    document.getElementById('v-lote').innerHTML = html;
}
// ==================== PERFIL DEL ANIMAL ====================
function showProfile(id) {
    var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return;
    var p = a.historial[a.historial.length-1].peso;
    var etapa = getEtapaCompleta(p, a.tipo, a.estadoRepro);
    var r = getRendimiento(a.historial), gmd = getGMD(a.historial);
    var d = getDietaCompleta(p, a.tipo, a.estadoRepro);
    var cd = getCostoDiario(p, a.tipo, a.estadoRepro);
    var csd = 0; for (var i = 0; i < DB.aplicaciones.length; i++) { if (DB.aplicaciones[i].animalId === id) { var prod = getCatalogoSanidadCompleto().find(function(x) { return x.id === DB.aplicaciones[i].productoId; }); if (prod && prod.diasEfecto > 0) csd += (DB.aplicaciones[i].costo || 0) / prod.diasEfecto; } }
    var cst = 0; for (var i = 0; i < DB.aplicaciones.length; i++) { if (DB.aplicaciones[i].animalId === id) cst += (DB.aplicaciones[i].costo || 0); }
    var ckp = gmd > 0 ? (cd + csd) / gmd : 999999;
    var ingM = gmd * 30 * DB.precioKG, gan = ingM - (cd * 30) - (cst / 12);
    var valorActual = p * DB.precioKG;
    var diasUltimo = getDiasDesde(a.historial[a.historial.length-1].fecha);
    var pred30 = predecirPeso(a.historial, 30), pred60 = predecirPeso(a.historial, 60), pred90 = predecirPeso(a.historial, 90);
    var confianza = getConfianzaPrediccion(a.historial), tendTxt = getTendenciaTexto(a.historial), hayIA = pred30 !== null && pred30 > 0;
    var semaforo = getSemaforo(a);

    // Edad
    var edadHTML = '';
    if (a.origen === 'nacimiento' && a.fechaNacimiento) { var diasEdad = getDiasDesde(a.fechaNacimiento); var meses = Math.floor(diasEdad / 30); edadHTML = '<div class="row"><span class="row-label"><i class="fa-solid fa-cake-candles"></i> Edad</span><span class="row-val">' + meses + ' meses (' + diasEdad + ' días)</span></div>'; }
    if (a.origen === 'comprado' && a.fechaCompra) { var diasFinca = getDiasDesde(a.fechaCompra); edadHTML = '<div class="row"><span class="row-label"><i class="fa-solid fa-truck"></i> Días en finca</span><span class="row-val">' + diasFinca + ' días</span></div>'; if (a.precioCompra) { var roi = ((valorActual - a.precioCompra - cst) / a.precioCompra * 100).toFixed(1); edadHTML += '<div class="row"><span class="row-label"><i class="fa-solid fa-sack-dollar"></i> Precio compra</span><span class="row-val">$ ' + fm(a.precioCompra) + '</span></div><div class="row"><span class="row-label"><i class="fa-solid fa-chart-line"></i> ROI</span><span class="row-val" style="color:' + (roi >= 0 ? '#22c55e' : '#ef4444') + '">' + roi + '%</span></div>'; } }
    if (a.madre) { var madre = DB.animales.find(function(x) { return x.nombre === a.madre || x.id === a.madre; }); if (madre) edadHTML += '<div class="row"><span class="row-label"><i class="fa-solid fa-cow"></i> Madre</span><span class="row-val" style="cursor:pointer;color:var(--accent);" onclick="showProfile(' + madre.id + ')">' + madre.nombre + '</span></div>'; }

    // Crías
    var criasHTML = '';
    if (a.tipo === 'leche') { var crias = DB.animales.filter(function(x) { return x.madre === a.nombre || x.madre === a.id; }); if (crias.length > 0) { criasHTML = '<div class="section-title"><i class="fa-solid fa-baby"></i> CRÍAS (' + crias.length + ')</div>'; for (var c = 0; c < crias.length; c++) criasHTML += '<div class="row" style="cursor:pointer;" onclick="showProfile(' + crias[c].id + ')"><span class="row-label"><div class="animal-avatar" style="width:24px;height:24px;font-size:.8rem;">' + getIconoAnimal(crias[c]) + '</div> ' + crias[c].nombre + '</span><span class="row-val">' + fm(crias[c].historial[crias[c].historial.length-1].peso) + ' kg</span></div>'; } }

    // Producción leche
    var lecheHTML = '';
    if (a.tipo === 'leche' && a.estadoRepro === 'parida') {
        var litrosHoy = a.produccionLeche && a.produccionLeche.length > 0 ? a.produccionLeche[a.produccionLeche.length-1].litros : 0;
        var ingresoLeche = litrosHoy * (DB.litroLeche || 1500);
        lecheHTML = '<div class="card card-sm" style="background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.2);"><div style="font-weight:700;font-size:.65rem;margin-bottom:4px;color:var(--accent);"><i class="fa-solid fa-glass-water-droplet"></i> PRODUCCIÓN DE LECHE</div><div class="row"><span class="row-label">Litros hoy</span><span class="row-val">' + litrosHoy + ' L</span></div><div class="row"><span class="row-label">Ingreso diario</span><span class="row-val" style="color:var(--accent);">$ ' + fm(ingresoLeche) + '</span></div><button class="btn btn-green btn-sm mt8" onclick="registrarLeche(' + id + ')" style="width:100%;"><i class="fa-solid fa-plus"></i> REGISTRAR LITROS</button></div>';
    }

    // Botones dinámicos
    var botonesHTML = '';
    if (a.tipo === 'leche' && (a.estadoRepro === 'seca' || a.estadoRepro === 'parida')) { botonesHTML += '<button class="btn btn-gray btn-sm" onclick="cambiarAEngorde(' + id + ')" style="flex:1;"><i class="fa-solid fa-rotate"></i> Cambiar a Engorde</button>'; }
    if (a.tipo === 'leche' && a.estadoRepro === 'parida' && semaforo && semaforo.dias >= 60 && !a.fechaPrenez) { botonesHTML += '<button class="btn btn-purple btn-sm" onclick="quedoPrenada(' + id + ')" style="flex:1;"><i class="fa-solid fa-baby"></i> Quedó Preñada</button>'; }
    if (a.tipo === 'leche' && a.fechaPrenez && a.fechaSecado) { var diasParaSecado = getDiasDesde(a.fechaSecado); if (diasParaSecado <= 7 && a.estadoRepro === 'parida') { botonesHTML += '<button class="btn btn-warning btn-sm" onclick="iniciarSecado(' + id + ')" style="flex:1;"><i class="fa-solid fa-pause"></i> Iniciar Secado</button>'; } }
    if (a.tipo === 'leche' && a.estadoRepro === 'seca') { botonesHTML += '<button class="btn btn-green btn-sm" onclick="yaPario(' + id + ')" style="flex:1;"><i class="fa-solid fa-calendar-check"></i> Ya Parió</button>'; }

    // Apps recientes
    var apps = DB.aplicaciones.filter(function(app) { return app.animalId === id; }).slice(-5).reverse();
    var appsHTML = '';
    if (apps.length > 0) { appsHTML = '<div class="section-title"><i class="fa-solid fa-syringe"></i> APLICACIONES</div>'; var cat = getCatalogoSanidadCompleto(); for (var ap = 0; ap < apps.length; ap++) { var ico = 'fa-circle', col = '#fff'; if (apps[ap].tipo === 'sanidad') { var p2 = cat.find(function(p3) { return p3.id === apps[ap].productoId; }); if (p2) { ico = p2.icono; col = p2.color; } } else { ico = 'fa-flask'; col = '#a78bfa'; } appsHTML += '<div class="aplicacion-item"><span><i class="fa-solid ' + ico + '" style="color:' + col + ';"></i> ' + apps[ap].producto + '</span><span style="font-size:.63rem;">' + (apps[ap].cantidad || apps[ap].ml || '') + ' ' + (apps[ap].unidad || 'ml') + ' · $' + fm(apps[ap].costo || 0) + ' · ' + apps[ap].fecha + '</span></div>'; } }

    // Historial
    var hist = '', rev = a.historial.slice().reverse();
    for (var i = 0; i < rev.length; i++) { var h = rev[i], ch = '', di = ''; if (i === 0) di = '<span style="font-size:.58rem;color:var(--muted);margin-left:4px;">hace ' + getDiasDesde(h.fecha) + ' d</span>'; if (i < a.historial.length-1) { var ant = a.historial[a.historial.length-2-i].peso, dif = h.peso - ant, cls = dif >= 0 ? 'badge-up' : 'badge-down', sig = dif >= 0 ? '+' : ''; ch = '<span class="badge ' + cls + '">' + sig + ((dif/ant)*100).toFixed(1) + '%</span>'; } hist += '<div class="hist-item"><span><i class="fa-regular fa-calendar"></i> ' + h.fecha + di + '</span><div><span class="row-val">' + fm(h.peso) + ' kg</span>' + ch + '</div></div>'; }

    // Dieta
    var dietaHTML = '<div class="card card-sm"><div style="font-weight:700;font-size:.65rem;margin-bottom:6px;color:var(--accent);"><i class="fa-solid fa-mortar-pestle"></i> DIETA DIARIA</div>';
    var items = [{ icono:'fa-seedling', nombre:'Pasto Picado', valor: (d.pasto||0).toFixed(1) + ' kg', costo: (d.pasto||0)*(DB.precios.pasto||0) }, { icono:'fa-wheat-awn', nombre:'Salvado Trigo', valor: (d.salvado||0).toFixed(2) + ' kg', costo: (d.salvado||0)*(DB.precios.salvado||0) }, { icono:'fa-droplet', nombre:'Melaza', valor: Math.round(d.melaza||0) + ' g', costo: ((d.melaza||0)/1000)*(DB.precios.melaza||0) }, { icono:'fa-flask-vial', nombre:'UREA', valor: Math.round(d.urea||0) + ' g', costo: ((d.urea||0)/1000)*(DB.precios.urea||0) }, { icono:'fa-cubes', nombre:'Bicarbonato', valor: Math.round(d.bicarb||0) + ' g', costo: ((d.bicarb||0)/1000)*(DB.precios.bicarb||0) }, { icono:'fa-vial-circle-check', nombre:'Sal Mineral', valor: Math.round(d.sal||0) + ' g', costo: ((d.sal||0)/1000)*(DB.precios.sal||0) }, { icono:'fa-flask', nombre:'Levadura', valor: Math.round(d.levadura||0) + ' g', costo: ((d.levadura||0)/1000)*(DB.precios.levadura||0) }];
    for (var x = 0; x < items.length; x++) { var it = items[x]; var bloqueado = (it.nombre === 'UREA' && etapa.ureaBloqueada); dietaHTML += '<div class="row"><span class="row-label"><i class="fa-solid ' + it.icono + '"></i> ' + it.nombre + '</span><span class="row-val" style="' + (bloqueado ? 'color:#6b7280;text-decoration:line-through' : '') + '">' + (bloqueado ? '0 g (🔒)' : it.valor + ' · $' + fm(it.costo)) + '</span></div>'; }
    dietaHTML += '</div>';

    document.getElementById('v-lote').classList.add('hidden'); document.getElementById('v-insumos').classList.add('hidden'); document.getElementById('v-sanidad').classList.add('hidden'); document.getElementById('v-ajustes').classList.add('hidden'); document.getElementById('v-perfil').classList.remove('hidden');
    var html = '<div class="card"><div class="profile-cover"><div class="profile-avatar" onclick="abrirFoto(' + id + ')">' + getIconoAnimal(a) + '</div><div class="profile-name">' + a.nombre + '</div><div class="profile-sub">' + etapa.rango + ' · ' + (a.tipo === 'engorde' ? '🥩 Engorde' : '🥛 Leche');
    if (semaforo) html += ' · <span class="semaforo semaforo-' + semaforo.color + '"></span> ' + semaforo.texto + ' (' + semaforo.dias + 'd)';
    html += '</div><div class="profile-stats"><div class="profile-stat"><div class="val">' + fm(p) + ' kg</div><div class="lbl">Peso</div></div><div class="profile-stat"><div class="val">' + gmd.toFixed(2) + '</div><div class="lbl">GMD</div></div><div class="profile-stat"><div class="val">$ ' + fm(valorActual) + '</div><div class="lbl">Valor</div></div></div>' + (etapa.min !== undefined ? '<div class="progress"><div class="progress-fill" style="width:' + getProgresoEtapa(p, etapa) + '%;background:' + etapa.color + ';"></div></div><div style="font-size:.6rem;color:var(--muted);text-align:center;margin-top:4px;">Faltan ' + fm((etapa.max||9999) - p) + ' kg para ' + etapa.siguienteEtapa + '</div>' : '') + '</div>' +
        edadHTML + lecheHTML + criasHTML +
        '<div class="alerta-card ' + r.color + '" style="margin-bottom:10px;"><div class="alerta-led ' + r.color + '"><i class="fa-solid ' + r.icono + '"></i></div><div><div class="alerta-titulo">' + r.texto + '</div><div class="alerta-met">' + (r.cm >= 0 ? '+' : '') + r.cm.toFixed(1) + '% · $' + fm(ckp) + '/kg</div></div></div>';
    // IA Predicción
    if (hayIA) { html += '<div class="ia-card"><div class="ia-title"><i class="fa-solid fa-brain"></i> PREDICCIÓN IA</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:6px;"><div class="proyeccion-item"><div class="dias">30 DÍAS</div><div class="peso">' + fm(pred30) + ' kg</div><div class="ganancia" style="color:' + ((pred30 - p) * DB.precioKG >= 0 ? '#22c55e' : '#ef4444') + '">' + ((pred30 - p) * DB.precioKG >= 0 ? '+' : '') + '$ ' + fm(Math.abs((pred30 - p) * DB.precioKG)) + '</div></div><div class="proyeccion-item"><div class="dias">60 DÍAS</div><div class="peso">' + fm(pred60) + ' kg</div><div class="ganancia" style="color:' + ((pred60 - p) * DB.precioKG >= 0 ? '#22c55e' : '#ef4444') + '">' + ((pred60 - p) * DB.precioKG >= 0 ? '+' : '') + '$ ' + fm(Math.abs((pred60 - p) * DB.precioKG)) + '</div></div><div class="proyeccion-item"><div class="dias">90 DÍAS</div><div class="peso">' + fm(pred90) + ' kg</div><div class="ganancia" style="color:' + ((pred90 - p) * DB.precioKG >= 0 ? '#22c55e' : '#ef4444') + '">' + ((pred90 - p) * DB.precioKG >= 0 ? '+' : '') + '$ ' + fm(Math.abs((pred90 - p) * DB.precioKG)) + '</div></div></div><div class="ia-confidence">📊 ' + tendTxt + ' · Confianza: ' + confianza + '</div></div>'; }
    else if (a.historial.length >= 1) { var p30s = p + (gmd * 30), p60s = p + (gmd * 60), p90s = p + (gmd * 90); html += '<div class="card card-sm"><div style="font-weight:700;font-size:.65rem;margin-bottom:4px;color:var(--muted);"><i class="fa-solid fa-chart-line"></i> PROYECCIÓN SIMPLE</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;"><div class="proyeccion-item"><div class="dias">30 DÍAS</div><div class="peso">' + fm(p30s) + ' kg</div><div class="ganancia" style="color:' + ((p30s - p) * DB.precioKG >= 0 ? '#22c55e' : '#ef4444') + '">' + ((p30s - p) * DB.precioKG >= 0 ? '+' : '') + '$ ' + fm(Math.abs((p30s - p) * DB.precioKG)) + '</div></div><div class="proyeccion-item"><div class="dias">60 DÍAS</div><div class="peso">' + fm(p60s) + ' kg</div><div class="ganancia" style="color:' + ((p60s - p) * DB.precioKG >= 0 ? '#22c55e' : '#ef4444') + '">' + ((p60s - p) * DB.precioKG >= 0 ? '+' : '') + '$ ' + fm(Math.abs((p60s - p) * DB.precioKG)) + '</div></div><div class="proyeccion-item"><div class="dias">90 DÍAS</div><div class="peso">' + fm(p90s) + ' kg</div><div class="ganancia" style="color:' + ((p90s - p) * DB.precioKG >= 0 ? '#22c55e' : '#ef4444') + '">' + ((p90s - p) * DB.precioKG >= 0 ? '+' : '') + '$ ' + fm(Math.abs((p90s - p) * DB.precioKG)) + '</div></div></div><div style="font-size:.55rem;color:var(--muted);margin-top:4px;">⚠️ 3+ pesajes para IA</div></div>'; }
    html += '<div class="card card-sm"><div style="font-weight:700;font-size:.65rem;margin-bottom:4px;color:var(--muted);"><i class="fa-solid fa-calculator"></i> RENTABILIDAD</div><div class="row"><span class="row-label"><i class="fa-solid fa-receipt"></i> Costo alim./día</span><span class="row-val">$ ' + fm(cd) + '</span></div><div class="row"><span class="row-label"><i class="fa-solid fa-sack-dollar"></i> Ganancia/mes</span><span class="row-val" style="color:' + (gan >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gan) + '</span></div></div>' +
        appsHTML + '<div class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> HISTORIAL</div>' + hist + dietaHTML +
        '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">' + botonesHTML + '<button class="btn btn-purple btn-sm" onclick="openAplicarSanidad(' + id + ')" style="flex:1;"><i class="fa-solid fa-syringe"></i> Sanidad</button><button class="btn btn-gold btn-sm" onclick="updateWeight(' + id + ')" style="flex:2;"><i class="fa-solid fa-gauge-high"></i> REGISTRAR PESAJE</button></div></div>';
    document.getElementById('v-perfil').innerHTML = html; window.scrollTo(0, 0); save();
}
// ==================== FOTO DEL ANIMAL ====================
function abrirFoto(id) { var input = document.getElementById('fotoInput'); input.setAttribute('data-animal', id); input.click(); }
function guardarFoto() { var input = document.getElementById('fotoInput'); var id = parseInt(input.getAttribute('data-animal')); var file = input.files[0]; if (!file) return; var reader = new FileReader(); reader.onload = function(e) { var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.foto = e.target.result; save(); showProfile(id); showToast('📸 Foto guardada'); }; reader.readAsDataURL(file); }

// ==================== REGISTRAR LECHE ====================
function registrarLeche(id) { var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; var litrosHoy = a.produccionLeche && a.produccionLeche.length > 0 ? a.produccionLeche[a.produccionLeche.length-1].litros : 0; var html = '<div class="modal-title">🥛 REGISTRAR LECHE - ' + a.nombre + '</div><div class="flex-col gap10"><input id="lecheLitros" type="number" placeholder="Litros producidos hoy" step="0.5" value="' + litrosHoy + '"><input id="lechePrecio" type="number" placeholder="Precio por litro ($)" value="' + (DB.litroLeche || 1500) + '"><button class="btn btn-gold mt8" onclick="guardarLeche(' + id + ')"><i class="fa-solid fa-check"></i> GUARDAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); }
function guardarLeche(id) { var litros = parseFloat(document.getElementById('lecheLitros').value); var precio = parseFloat(document.getElementById('lechePrecio').value); if (isNaN(litros) || litros < 0) { alert('⚠️ Litros válidos'); return; } if (precio && !isNaN(precio)) DB.litroLeche = precio; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; if (!a.produccionLeche) a.produccionLeche = []; a.produccionLeche.push({ fecha: new Date().toLocaleDateString(), litros: litros }); save(); document.querySelector('.modal-overlay').remove(); showProfile(id); showToast('✅ ' + litros + ' L registrados'); }

// ==================== FUNCIONES REPRODUCTIVAS ====================
function quedoPrenada(id) { if (!confirm('🤰 ¿Confirmar que esta vaca quedó preñada?\n\nSe calculará la fecha de parto (285 días) y la fecha de secado (60 días antes).')) return; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; var hoy = new Date(); a.fechaPrenez = hoy.toLocaleDateString(); var parto = new Date(hoy.getTime() + 285 * 86400000); a.fechaPartoEstimada = parto.toLocaleDateString(); var secado = new Date(parto.getTime() - 60 * 86400000); a.fechaSecado = secado.toLocaleDateString(); save(); showProfile(id); showToast('✅ Preñez registrada · Parto: ' + a.fechaPartoEstimada); }
function iniciarSecado(id) { if (!confirm('🔴 ¿Iniciar secado de esta vaca?\n\nCambiará a dieta de Seca (1% Melaza, 0.20g Sal).')) return; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.estadoRepro = 'seca'; a.fechaSecadoInicio = new Date().toLocaleDateString(); save(); showProfile(id); showToast('✅ Secado iniciado · Dieta ajustada'); }
function yaPario(id) { if (!confirm('✅ ¿Confirmar que esta vaca ya parió?\n\nSe reiniciará el ciclo reproductivo.')) return; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.estadoRepro = 'parida'; a.fechaParto = new Date().toLocaleDateString(); a.fechaPrenez = null; a.fechaPartoEstimada = null; a.fechaSecado = null; a.fechaSecadoInicio = null; if (confirm('🐮 ¿Desea registrar la cría recién nacida?')) { var pesoCria = parseFloat(prompt('⚖️ Peso de la cría al nacer (kg):')); if (!isNaN(pesoCria) && pesoCria > 10) { var nombreCria = prompt('📝 Nombre de la cría:') || ('Cría de ' + a.nombre); var idCria = Date.now() + 1; DB.animales.push({ id: idCria, nombre: nombreCria, tipo: 'leche', origen: 'nacimiento', madre: a.nombre, fechaNacimiento: new Date().toLocaleDateString(), historial: [{ fecha: new Date().toLocaleDateString(), peso: pesoCria }], estadoRepro: 'novilla', lote: a.lote, produccionLeche: [] }); } } save(); showProfile(id); showToast('✅ Parto registrado · Ciclo reiniciado'); }
function cambiarAEngorde(id) { if (!confirm('🔄 ¿Cambiar esta vaca a ENGORDE para venta?\n\nSe aplicará dieta de ceba (5% Melaza, 0.11g Urea).')) return; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.tipo = 'engorde'; a.estadoRepro = 'venta'; save(); showProfile(id); showToast('✅ Cambiada a Engorde · Dieta ajustada'); }

// ==================== ACCIONES DEL PERFIL ====================
function updateWeight(id) { var p = prompt('⚖️ Nuevo pesaje (kg):'); if (!p) return; p = parseFloat(p); if (isNaN(p) || p < 20 || p > 2000) { alert('⚠️ Peso 20-2000 kg'); return; } var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.historial.push({ fecha: new Date().toLocaleDateString(), peso: p }); save(); showProfile(id); }
function deleteAnimal(id) { if (confirm('⚠️ ¿Eliminar este animal?')) { DB.animales = DB.animales.filter(function(x) { return x.id !== id; }); save(); goPage('lote'); } }

// ==================== SANIDAD ====================
function renderSanidad() { var cat = getCatalogoSanidadCompleto(); var html = '<div class="card"><div style="font-weight:700;font-size:.8rem;margin-bottom:12px;color:var(--accent);"><i class="fa-solid fa-syringe"></i> INVENTARIO SANIDAD</div>'; for (var i = 0; i < cat.length; i++) { var p = cat[i], st = p.tipo === 'fijo' ? (DB.stockSanidad[p.id] || 0) : (p.stock || 0), pr = p.tipo === 'fijo' ? (DB.preciosSanidad[p.id] || 0) : (p.precioML || 0); html += '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03);"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><i class="fa-solid ' + p.icono + '" style="color:' + p.color + ';font-size:1.1rem;width:20px;"></i><div style="flex:1;"><span style="font-size:.76rem;font-weight:600;">' + p.nombre + '</span><span style="font-size:.58rem;color:var(--muted);">Stock: <b>' + fm(st) + ' ml</b> · $<b>' + fm(pr) + '/ml</b></span></div></div><div style="display:flex;gap:4px;"><input id="cm-' + p.id + '" type="number" placeholder="ml" style="flex:1;padding:6px;font-size:.65rem;"><input id="ccs-' + p.id + '" type="number" placeholder="Costo $" style="flex:1;padding:6px;font-size:.65rem;"><button class="btn btn-green btn-sm" onclick="agregarCompraSanidad(\'' + p.id + '\')" style="padding:4px 8px;"><i class="fa-solid fa-cart-shopping"></i></button></div></div>'; } html += '<button class="btn btn-purple mt12" onclick="openAgregarSuplementoSanidad()"><i class="fa-solid fa-plus"></i> AGREGAR INYECTABLE</button></div>'; document.getElementById('v-sanidad').innerHTML = html; }
function openAgregarSuplementoSanidad() { var html = '<div class="modal-title">💉 NUEVO INYECTABLE</div><div class="flex-col gap10"><input id="supSanNombre" type="text" placeholder="Nombre"><input id="supSanDosis" type="number" placeholder="Dosis (ml/kg)" step="1" value="50"><input id="supSanDiasEfecto" type="number" placeholder="Días de efecto" step="1" value="30"><input id="supSanRetiro" type="number" placeholder="Días de retiro" step="1" value="0"><button class="btn btn-purple mt8" onclick="agregarSuplementoSanidad()"><i class="fa-solid fa-check"></i> AGREGAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); }
function agregarSuplementoSanidad() { var n = document.getElementById('supSanNombre').value.trim(), dosis = parseFloat(document.getElementById('supSanDosis').value) || 50, de = parseInt(document.getElementById('supSanDiasEfecto').value) || 30, ret = parseInt(document.getElementById('supSanRetiro').value) || 0; if (!n) { alert('⚠️ Nombre'); return; } DB.suplementosSanidad.push({ id:'supSan_'+Date.now(), nombre:n, dosis:dosis, diasEfecto:de, retiro:ret, stock:0, precioML:0, icono:'fa-syringe', color:'#a78bfa', tipo:'personalizado' }); save(); document.querySelector('.modal-overlay').remove(); renderSanidad(); showToast('✅ Agregado'); }
function agregarCompraSanidad(prodId) { var me = document.getElementById('cm-' + prodId), ce = document.getElementById('ccs-' + prodId); if (!me || !ce) return; var ml = parseFloat(me.value), co = parseFloat(ce.value); if (isNaN(ml) || ml <= 0 || isNaN(co) || co <= 0) { alert('⚠️ Datos válidos'); return; } var sp = DB.suplementosSanidad.find(function(s) { return s.id === prodId; }); if (sp) { sp.stock = (sp.stock || 0) + ml; sp.precioML = co / ml; } else { DB.stockSanidad[prodId] = (DB.stockSanidad[prodId] || 0) + ml; DB.preciosSanidad[prodId] = co / ml; } save(); me.value = ''; ce.value = ''; renderSanidad(); showToast('✅ Compra registrada'); }
function openAplicarSanidad(animalId) { var a = DB.animales.find(function(x) { return x.id === animalId; }); if (!a) return; var peso = a.historial[a.historial.length-1].peso; var cat = getCatalogoSanidadCompleto(); var opts = ''; for (var i = 0; i < cat.length; i++) opts += '<option value="' + cat[i].id + '">' + cat[i].nombre + '</option>'; var html = '<div class="modal-title">💉 APLICAR A ' + a.nombre + ' (' + fm(peso) + ' kg)</div><div class="flex-col gap10"><select id="aplProducto" onchange="calcularDosisModal(' + peso + ')">' + opts + '</select><div id="dosisInfo" style="font-size:.7rem;color:var(--muted);"></div><input id="aplML" type="number" placeholder="ml aplicados" step=".1"><button class="btn btn-gold mt8" onclick="aplicarProductoSanidad(' + animalId + ')"><i class="fa-solid fa-check"></i> CONFIRMAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); setTimeout(function() { calcularDosisModal(peso); }, 100); }
function calcularDosisModal(peso) { var sel = document.getElementById('aplProducto'), info = document.getElementById('dosisInfo'); if (!sel || !info) return; var cat = getCatalogoSanidadCompleto(); var p = cat.find(function(x) { return x.id === sel.value; }); if (p) info.innerHTML = '📋 Dosis: <b>' + (peso / p.dosis).toFixed(1) + ' ml</b>'; }
function aplicarProductoSanidad(animalId) { var sel = document.getElementById('aplProducto'), mlEl = document.getElementById('aplML'); if (!sel || !mlEl) return; var pid = sel.value, ml = parseFloat(mlEl.value); if (isNaN(ml) || ml <= 0) { alert('⚠️ ml válidos'); return; } var cat = getCatalogoSanidadCompleto(); var p = cat.find(function(x) { return x.id === pid; }); var a = DB.animales.find(function(x) { return x.id === animalId; }); if (!p || !a) return; var prc = p.tipo === 'fijo' ? (DB.preciosSanidad[pid] || 0) : (p.precioML || 0); var ct = prc * ml; DB.aplicaciones.push({ animalId: animalId, productoId: pid, producto: p.nombre, cantidad: ml, unidad: 'ml', costo: ct, fecha: new Date().toLocaleDateString(), tipo: 'sanidad' }); if (p.tipo === 'fijo') { DB.stockSanidad[pid] = Math.max(0, (DB.stockSanidad[pid] || 0) - ml); } else { p.stock = Math.max(0, (p.stock || 0) - ml); } save(); document.querySelector('.modal-overlay').remove(); showToast('✅ ' + p.nombre + ': ' + ml + ' ml ($' + fm(ct) + ')'); showProfile(animalId); }

// ==================== INSUMOS (CON SUPLEMENTOS RESTAURADOS) ====================
function renderInsumos() { var mez = { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 }; DB.animales.forEach(function(a) { var d = getDietaCompleta(a.historial[a.historial.length-1].peso, a.tipo, a.estadoRepro); for (var k in mez) mez[k] += (d[k] || 0); }); var html = '<div class="card"><div style="font-weight:700;margin-bottom:14px;color:var(--accent);"><i class="fa-solid fa-boxes"></i> ALIMENTOS FIJOS</div>'; for (var i = 0; i < ALIMENTOS.length; i++) { var st = DB.stock[ALIMENTOS[i]] || 0, co = mez[ALIMENTOS[i]] || 0, cr = (ALIMENTOS[i] === 'pasto' || ALIMENTOS[i] === 'salvado') ? co : co/1000; var dias = cr > 0 && st > 0 ? st/cr : 999, dCol = dias < 3 ? '#ef4444' : dias < 7 ? '#f59e0b' : '#22c55e'; html += '<div class="insumo-row"><i class="fa-solid ' + IC_ALIMENTOS[ALIMENTOS[i]] + '"></i><div class="insumo-info"><span class="insumo-nombre">' + NM_ALIMENTOS[ALIMENTOS[i]] + '</span><span class="insumo-detalle">$' + fm(DB.precios[ALIMENTOS[i]] || 0) + '/kg · <b style="color:' + dCol + '">' + (dias === 999 ? '--' : Math.round(dias) + 'd') + '</b></span></div><div class="insumo-inputs"><input id="pr-' + ALIMENTOS[i] + '" type="number" value="' + (DB.precios[ALIMENTOS[i]] || 0) + '"><input id="st-' + ALIMENTOS[i] + '" type="number" value="' + Math.round(st) + '"></div></div>'; } html += '<button class="btn btn-gold mt12" onclick="saveAlimentos()"><i class="fa-solid fa-check"></i> GUARDAR</button></div>';
    html += '<div class="card"><div style="font-weight:700;margin-bottom:14px;color:var(--accent);"><i class="fa-solid fa-flask"></i> SUPLEMENTOS PERSONALIZADOS (g/kg)</div>';
    for (var s = 0; s < DB.suplementosAlimento.length; s++) { var sup = DB.suplementosAlimento[s], stk = sup.stock || 0, dosisEj = (160 * sup.gramosPorKg) / 1000; html += '<div class="sup-card"><div class="sup-card-header"><span class="sup-nombre"><i class="fa-solid ' + (sup.icono || 'fa-flask') + '" style="color:' + (sup.color || '#a78bfa') + ';"></i> ' + sup.nombre + '</span><div class="sup-card-actions"><button onclick="editarSuplementoAlimento(\'' + sup.id + '\')"><i class="fa-solid fa-pen-to-square"></i></button><button onclick="eliminarSuplementoAlimento(\'' + sup.id + '\')"><i class="fa-solid fa-trash"></i></button></div></div><div class="sup-card-body"><span>📐 ' + sup.gramosPorKg + ' g/kg</span><span>💰 $' + fm(sup.precioPorKg || 0) + '/kg</span><span>📦 ' + fm(stk) + ' kg</span><span>📋 160kg→' + dosisEj.toFixed(2) + ' kg/d</span></div><div style="display:flex;gap:4px;margin-top:6px;"><input id="ccs-' + sup.id + '" type="number" placeholder="kg" style="flex:1;padding:6px;font-size:.65rem;"><input id="ccos-' + sup.id + '" type="number" placeholder="Costo $" style="flex:1;padding:6px;font-size:.65rem;"><button class="btn btn-green btn-sm" onclick="comprarSuplementoAlimento(\'' + sup.id + '\')" style="padding:4px 8px;"><i class="fa-solid fa-cart-shopping"></i></button></div></div>'; }
    html += '<button class="btn btn-purple mt12" onclick="openAgregarSuplementoAlimento()"><i class="fa-solid fa-plus"></i> AGREGAR SUPLEMENTO</button></div>';
    document.getElementById('v-insumos').innerHTML = html; }
function saveAlimentos() { for (var i = 0; i < ALIMENTOS.length; i++) { var pel = document.getElementById('pr-' + ALIMENTOS[i]), sel = document.getElementById('st-' + ALIMENTOS[i]); if (pel) DB.precios[ALIMENTOS[i]] = parseFloat(pel.value) || 0; if (sel) DB.stock[ALIMENTOS[i]] = parseFloat(sel.value) || 0; } save(); showToast('✅ Guardado'); }
function openAgregarSuplementoAlimento() { var html = '<div class="modal-title">➕ NUEVO SUPLEMENTO (g/kg)</div><div class="flex-col gap10"><input id="supAlimNombre" type="text" placeholder="Nombre"><input id="supAlimGramos" type="number" placeholder="g/kg de peso vivo" step="1" value="50"><input id="supAlimPrecio" type="number" placeholder="Precio por kg ($)" step="1"><button class="btn btn-purple mt8" onclick="agregarSuplementoAlimento()"><i class="fa-solid fa-check"></i> AGREGAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); }
function agregarSuplementoAlimento() { var n = document.getElementById('supAlimNombre').value.trim(), g = parseInt(document.getElementById('supAlimGramos').value) || 50, pr = parseFloat(document.getElementById('supAlimPrecio').value) || 0; if (!n) { alert('⚠️ Nombre'); return; } DB.suplementosAlimento.push({ id:'supAlim_'+Date.now(), nombre:n, gramosPorKg:g, precioPorKg:pr, stock:0, icono:'fa-flask', color:'#a78bfa' }); save(); document.querySelector('.modal-overlay').remove(); renderInsumos(); showToast('✅ Agregado'); }
function editarSuplementoAlimento(id) { var sup = DB.suplementosAlimento.find(function(s) { return s.id === id; }); if (!sup) return; var html = '<div class="modal-title">✏️ EDITAR ' + sup.nombre + '</div><div class="flex-col gap10"><input id="editSupNombre" type="text" value="' + sup.nombre + '"><input id="editSupGramos" type="number" value="' + sup.gramosPorKg + '"><input id="editSupPrecio" type="number" value="' + (sup.precioPorKg || 0) + '"><button class="btn btn-gold mt8" onclick="guardarEdicionSuplemento(\'' + id + '\')"><i class="fa-solid fa-check"></i> GUARDAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); }
function guardarEdicionSuplemento(id) { var sup = DB.suplementosAlimento.find(function(s) { return s.id === id; }); if (!sup) return; sup.nombre = document.getElementById('editSupNombre').value.trim(); sup.gramosPorKg = parseInt(document.getElementById('editSupGramos').value) || 50; sup.precioPorKg = parseFloat(document.getElementById('editSupPrecio').value) || 0; save(); document.querySelector('.modal-overlay').remove(); renderInsumos(); showToast('✅ Actualizado'); }
function eliminarSuplementoAlimento(id) { if (confirm('⚠️ ¿Eliminar?')) { DB.suplementosAlimento = DB.suplementosAlimento.filter(function(s) { return s.id !== id; }); save(); renderInsumos(); showToast('✅ Eliminado'); } }
function comprarSuplementoAlimento(id) { var ce = document.getElementById('ccs-' + id), coe = document.getElementById('ccos-' + id); if (!ce || !coe) return; var kg = parseFloat(ce.value), costo = parseFloat(coe.value); if (isNaN(kg) || kg <= 0 || isNaN(costo) || costo <= 0) { alert('⚠️ Datos válidos'); return; } var sup = DB.suplementosAlimento.find(function(s) { return s.id === id; }); if (!sup) return; sup.stock = (sup.stock || 0) + kg; if (!sup.precioPorKg || sup.precioPorKg === 0) sup.precioPorKg = costo / kg; save(); ce.value = ''; coe.value = ''; renderInsumos(); showToast('✅ Stock +' + fm(kg) + ' kg'); }

// ==================== AJUSTES (CON LOTES) ====================
function renderAjustes() {
    var lotesHTML = '';
    for (var i = 0; i < DB.lotes.length; i++) { var l = DB.lotes[i]; var count = DB.animales.filter(function(a) { return a.lote === l.id; }).length; lotesHTML += '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.03);"><i class="fa-solid ' + (l.tipo === 'engorde' ? 'fa-cow' : 'fa-glass-water-droplet') + '" style="color:var(--accent);"></i><span style="flex:1;font-size:.75rem;">' + l.nombre + ' (' + count + ')</span><button class="btn btn-danger btn-sm" onclick="eliminarLote(\'' + l.id + '\')" style="padding:4px 8px;"><i class="fa-solid fa-trash"></i></button></div>'; }
    var html = '<div class="card config-section"><h3><i class="fa-solid fa-layer-group"></i> LOTES</h3>' + lotesHTML + '<button class="btn btn-purple btn-sm mt8" onclick="openCrearLote()" style="width:100%;"><i class="fa-solid fa-plus"></i> CREAR LOTE</button></div>' +
        '<div class="card config-section"><h3><i class="fa-solid fa-database"></i> RESPALDO</h3><button class="btn btn-gold" onclick="exportarDatos()"><i class="fa-solid fa-download"></i> EXPORTAR</button><button class="btn btn-gray" onclick="importarDatos()"><i class="fa-solid fa-upload"></i> IMPORTAR</button></div>' +
        '<div class="card config-section"><h3><i class="fa-solid fa-info-circle"></i> INFORMACIÓN</h3><p style="font-size:.7rem;color:var(--muted);">GANADERO ÉLITE v3.2.1</p><p style="font-size:.6rem;color:var(--muted);">🥩 Engorde + 🥛 Leche · IA + Ciclo Reproductivo</p></div>';
    document.getElementById('v-ajustes').innerHTML = html;
}
function openCrearLote() { var html = '<div class="modal-title">📦 NUEVO LOTE</div><div class="flex-col gap10"><input id="loteNombre" type="text" placeholder="Nombre del lote"><select id="loteTipo"><option value="engorde">🥩 Engorde (Carne)</option><option value="leche">🥛 Leche</option></select><button class="btn btn-gold mt8" onclick="crearLote()"><i class="fa-solid fa-check"></i> CREAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); }
function crearLote() { var n = document.getElementById('loteNombre').value.trim(), t = document.getElementById('loteTipo').value; if (!n) { alert('⚠️ Nombre del lote'); return; } DB.lotes.push({ id: 'lote_' + Date.now(), nombre: n, tipo: t }); save(); document.querySelector('.modal-overlay').remove(); renderAjustes(); showToast('✅ Lote creado'); }
function eliminarLote(id) { if (confirm('⚠️ ¿Eliminar este lote? Los animales quedarán sin lote.')) { DB.lotes = DB.lotes.filter(function(l) { return l.id !== id; }); DB.animales.forEach(function(a) { if (a.lote === id) a.lote = null; }); save(); renderAjustes(); showToast('✅ Lote eliminado'); } }
function exportarDatos() { var b = new Blob([JSON.stringify(DB,null,2)],{type:'application/json'}); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ganadero-elite-respaldo.json'; a.click(); showToast('✅ Exportado'); }
function importarDatos() { var i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = function(e) { var r = new FileReader(); r.onload = function(e) { try { DB = JSON.parse(e.target.result); save(); renderDashboard(); showToast('✅ Importado'); } catch(err) { alert('❌ Error'); } }; r.readAsText(e.target.files[0]); }; i.click(); }

// ==================== AUTO-GUARDADO ====================
cargarDatos(); renderDashboard();
window.addEventListener('beforeunload', function() { save(); });
document.addEventListener('visibilitychange', function() { if (document.hidden) save(); });
setInterval(function() { save(); }, 30000);
console.log('✅ GANADERO ÉLITE v3.2.1 listo');
