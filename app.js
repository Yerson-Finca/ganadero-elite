// 📂 ganadero-elite/app.js - GANADERO ÉLITE v5.1
console.log('👑 GANADERO ÉLITE v5.1 - IA PREDICTIVA TOTAL');

// ==================== UTILIDADES ====================
function fm(n) { if (isNaN(n) || n === null) return '0'; n = Math.round(n); var s = String(n), r = '', c = 0; for (var i = s.length - 1; i >= 0; i--) { if (c > 0 && c % 3 === 0) r = '.' + r; r = s.charAt(i) + r; c++; } return r; }
function showToast(m, d) { d = d || 3000; var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = m; document.getElementById('toastContainer').appendChild(t); setTimeout(function() { if (t.parentNode) t.remove(); }, d); }
function showModal(h) { var o = document.createElement('div'); o.className = 'modal-overlay'; o.innerHTML = '<div class="modal">' + h + '</div>'; o.querySelector('.modal').onclick = function(e) { e.stopPropagation(); }; o.onclick = function(e) { if (e.target === o) o.remove(); }; document.getElementById('modalContainer').appendChild(o); }
function showConfirm(msg, cb) { showModal('<div class="modal-title">⚠️ Confirmar</div><p style="margin-bottom:12px;font-size:.8rem;">' + msg + '</p><div class="flex-col gap10"><button class="btn btn-green" id="confirmYes">SÍ</button><button class="btn btn-gray" id="confirmNo">CANCELAR</button></div>'); setTimeout(function() { document.getElementById('confirmYes').onclick = function() { document.querySelector('.modal-overlay').remove(); cb(true); }; document.getElementById('confirmNo').onclick = function() { document.querySelector('.modal-overlay').remove(); cb(false); }; }, 50); }
function getIconoAnimal(a) { if (a.foto && a.foto.length > 100) return '<img src="' + a.foto + '" alt="' + a.nombre + '" style="width:100%;height:100%;object-fit:cover;">'; var etapa = getEtapaCompleta(a.historial[a.historial.length-1].peso, a.tipo, a.estadoRepro); return etapa.icono; }

// ==================== BASE DE DATOS ====================
var DB = { animales: [], aplicaciones: [], lotes: [], precios: { pasto:1200, salvado:2500, melaza:3800, levadura:8000, bicarb:4500, sal:6200, urea:9500 }, stock: { pasto:500, salvado:200, melaza:50, levadura:10, bicarb:5, sal:2, urea:20 }, stockSanidad: {}, preciosSanidad: {}, suplementosAlimento: [], suplementosSanidad: [], precioKG: 9800, litroLeche: 1500 };
var fotosDB = {};
function cargarDatos() { try { var s = localStorage.getItem('ganadero_elite_v9'); if (s) DB = JSON.parse(s); } catch(e) {} try { var f = localStorage.getItem('ganadero_fotos'); if (f) { fotosDB = JSON.parse(f); for (var i = 0; i < DB.animales.length; i++) { if (fotosDB[DB.animales[i].id]) DB.animales[i].foto = fotosDB[DB.animales[i].id]; } } } catch(e) {} }
function save() { try { var copia = JSON.parse(JSON.stringify(DB)); for (var i = 0; i < copia.animales.length; i++) { if (copia.animales[i].foto && copia.animales[i].foto.length > 100) { fotosDB[copia.animales[i].id] = copia.animales[i].foto; copia.animales[i].foto = '[FOTO]'; } } localStorage.setItem('ganadero_elite_v9', JSON.stringify(copia)); localStorage.setItem('ganadero_fotos', JSON.stringify(fotosDB)); } catch(e) {} }

// ==================== CATÁLOGOS ====================
var ALIMENTOS = ['pasto','salvado','melaza','levadura','bicarb','sal','urea'];
var IC_ALIMENTOS = { pasto:'🌱', salvado:'🌾', melaza:'💧', levadura:'🧪', bicarb:'🧊', sal:'🧂', urea:'⚗️' };
var NM_ALIMENTOS = { pasto:'Pasto Picado', salvado:'Salvado Trigo', melaza:'Melaza', levadura:'Levadura', bicarb:'Bicarbonato', sal:'Sal Mineral', urea:'UREA' };
var CATALOGO_SANIDAD = [
    { id:'modificador', nombre:'Modificador Orgánico', dosis:50, diasEfecto:90, retiro:0, icono:'🧪', color:'#22c55e', tipo:'fijo' },
    { id:'vitaminaA', nombre:'Vitamina ADE', dosis:50, diasEfecto:60, retiro:30, icono:'☀️', color:'#fbbf24', tipo:'fijo' },
    { id:'complejoB', nombre:'Complejo B (B12)', dosis:50, diasEfecto:20, retiro:0, icono:'💊', color:'#3b82f6', tipo:'fijo' },
    { id:'ivermectina1', nombre:'Ivermectina 1%', dosis:50, diasEfecto:30, retiro:28, icono:'🛡️', color:'#ef4444', tipo:'fijo' },
    { id:'ivermectina315', nombre:'Ivermectina 3.15%', dosis:50, diasEfecto:90, retiro:122, icono:'🛡️', color:'#dc2626', tipo:'fijo' },
    { id:'fosforo', nombre:'Fósforo B12', dosis:20, diasEfecto:30, retiro:0, icono:'🦴', color:'#a78bfa', tipo:'fijo' },
    { id:'hierro', nombre:'Hierro Dextrano', dosis:100, diasEfecto:30, retiro:0, icono:'💧', color:'#f87171', tipo:'fijo' }
];
function getCatalogoSanidadCompleto() { return CATALOGO_SANIDAD.concat(DB.suplementosSanidad); }

// ==================== MATRICES ====================
var MATRIZ_ENGORDE = { 'Cría': { melaza:2, urea:0, bicarb:0.10, sal:0.15 }, 'Levante': { melaza:3, urea:0.11, bicarb:0.125, sal:0.20 }, 'Ceba': { melaza:5, urea:0.11, bicarb:0.15, sal:0.20 }, 'Venta': { melaza:5, urea:0.11, bicarb:0.15, sal:0.20 } };
var MATRIZ_LECHE = { 'Novilla': { melaza:1, urea:0.05, bicarb:0.10, sal:0.25 }, 'Parida': { melaza:3, urea:0.08, bicarb:0.20, sal:0.50 }, 'Seca': { melaza:1, urea:0.05, bicarb:0.10, sal:0.20 }, 'Venta': { melaza:5, urea:0.11, bicarb:0.15, sal:0.20 } };

function getEtapa(pv, tipo) { if (tipo === 'leche') { if (pv < 350) return 'Novilla'; return 'Parida'; } if (pv < 150) return 'Cría'; if (pv < 350) return 'Levante'; if (pv < 500) return 'Ceba'; return 'Venta'; }
function getEtapaCompleta(pv, tipo, estadoRepro) {
    if (tipo === 'leche') {
        if (estadoRepro === 'venta') return { nombre:'Venta', clase:'etapa-madurez', icono:'🦬', rango:'Venta', color:'#f87171', cardClass:'etapa-madurez-card' };
        if (estadoRepro === 'seca') return { nombre:'Seca', clase:'etapa-desarrollo', icono:'🐄', rango:'Seca', color:'#60a5fa', cardClass:'etapa-desarrollo-card' };
        if (estadoRepro === 'parida') return { nombre:'Parida', clase:'etapa-ceba', icono:'🐄', rango:'Parida', color:'#fb923c', cardClass:'etapa-ceba-card' };
        if (pv < 350) return { nombre:'Novilla', clase:'etapa-inicio', icono:'🐄', rango:'Novilla', color:'#fbbf24', cardClass:'etapa-inicio-card' };
        return { nombre:'Parida', clase:'etapa-ceba', icono:'🐄', rango:'Parida', color:'#fb923c', cardClass:'etapa-ceba-card' };
    }
    if (pv < 150) return { nombre:'Cría', clase:'etapa-inicio', icono:'🐮', rango:'Cría', min:0, max:150, ureaBloqueada:true, color:'#fbbf24', cardClass:'etapa-inicio-card', siguienteEtapa:'Levante' };
    if (pv < 350) return { nombre:'Levante', clase:'etapa-desarrollo', icono:'🐂', rango:'Levante', min:150, max:350, ureaBloqueada:false, color:'#60a5fa', cardClass:'etapa-desarrollo-card', siguienteEtapa:'Ceba' };
    if (pv < 500) return { nombre:'Ceba', clase:'etapa-ceba', icono:'🐃', rango:'Ceba', min:350, max:500, ureaBloqueada:false, color:'#fb923c', cardClass:'etapa-ceba-card', siguienteEtapa:'Venta' };
    return { nombre:'Venta', clase:'etapa-madurez', icono:'🦬', rango:'Venta', min:500, max:9999, ureaBloqueada:false, color:'#f87171', cardClass:'etapa-madurez-card' };
}
function getProgresoEtapa(pv, e) { return Math.min(100, Math.max(0, ((pv - (e.min||0)) / ((e.max||9999) - (e.min||0))) * 100)); }
function getDietaCompleta(pv, tipo, estadoRepro) { var etapa = getEtapa(pv, tipo); var matriz = tipo === 'leche' ? MATRIZ_LECHE : MATRIZ_ENGORDE; if (tipo === 'leche' && estadoRepro === 'seca') etapa = 'Seca'; if (tipo === 'leche' && estadoRepro === 'venta') etapa = 'Venta'; if (tipo === 'leche' && estadoRepro === 'parida') etapa = 'Parida'; var m = matriz[etapa] || matriz['Levante']; if (!m) m = { melaza:0, urea:0, bicarb:0, sal:0 }; var consumoTotal = pv * 0.03; var melazaKg = consumoTotal * (m.melaza / 100); return { pasto: consumoTotal * 0.90, salvado: consumoTotal * 0.10, melaza: melazaKg * 1000, urea: (pv < 150 && tipo === 'engorde') ? 0 : (pv * m.urea), bicarb: pv * m.bicarb, sal: pv * m.sal, levadura: pv * 0.05, consumoTotal: consumoTotal }; }
function getDiasDesde(f) { if (!f) return 999; var p = f.split('/'); if (p.length < 3) return 999; return Math.floor((new Date() - new Date(p[2], p[1]-1, p[0])) / 86400000); }
function getGMD(h) { return h.length < 2 ? 0 : (h[h.length-1].peso - h[h.length-2].peso) / 30; }
function getCostoDiario(pv, tipo, estadoRepro) { var d = getDietaCompleta(pv, tipo, estadoRepro); return (d.pasto||0)*(DB.precios.pasto||0) + (d.salvado||0)*(DB.precios.salvado||0) + ((d.melaza||0)/1000)*(DB.precios.melaza||0) + ((d.urea||0)/1000)*(DB.precios.urea||0) + ((d.bicarb||0)/1000)*(DB.precios.bicarb||0) + ((d.sal||0)/1000)*(DB.precios.sal||0) + ((d.levadura||0)/1000)*(DB.precios.levadura||0); }
function getRendimiento(h) { if (h.length < 2) return { nivel:'azul', texto:'Registre más', icono:'ℹ️', cm:0, color:'azul' }; var act = h[h.length-1].peso, ant = h[h.length-2].peso, cm = ((act-ant)/ant)*100; if (act < ant) return { nivel:'gris', texto:'Pérdida', icono:'⚠️', cm:cm, color:'gris' }; if (cm >= 5) return { nivel:'verde', texto:'Excelente', icono:'👑', cm:cm, color:'verde' }; if (cm >= 3.5) return { nivel:'azul', texto:'Bueno', icono:'✅', cm:cm, color:'azul' }; if (cm >= 2.5) return { nivel:'naranja', texto:'Regular', icono:'⚠️', cm:cm, color:'naranja' }; return { nivel:'rojo', texto:'Bajo', icono:'❌', cm:cm, color:'rojo' }; }

// ==================== IA ====================
function predecirPeso(historial, diasFuturo) { if (historial.length < 3) return null; var n = historial.length, sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0; var p0 = historial[0].fecha.split('/'); var fb = new Date(parseInt(p0[2]), parseInt(p0[1])-1, parseInt(p0[0])); if (isNaN(fb.getTime())) return null; for (var i = 0; i < n; i++) { var pi = historial[i].fecha.split('/'); var fa = new Date(parseInt(pi[2]), parseInt(pi[1])-1, parseInt(pi[0])); if (isNaN(fa.getTime())) continue; var dr = Math.floor((fa - fb) / 86400000); sumX += dr; sumY += historial[i].peso; sumXY += dr * historial[i].peso; sumX2 += dr * dr; } var den = (n * sumX2 - sumX * sumX); if (den === 0) return null; var m = (n * sumXY - sumX * sumY) / den; var b = (sumY - m * sumX) / n; var pu = historial[n-1].fecha.split('/'); var fu = new Date(parseInt(pu[2]), parseInt(pu[1])-1, parseInt(pu[0])); return m * (Math.floor((fu - fb) / 86400000) + diasFuturo) + b; }
function getConfianzaPrediccion(historial) { if (historial.length < 3) return 'Baja'; var cm = []; for (var i = 1; i < historial.length; i++) cm.push(historial[i].peso - historial[i-1].peso); var med = cm.reduce(function(a,b){return a+b;},0)/cm.length; if (med === 0) return 'Baja'; var vr = cm.reduce(function(a,b){return a+Math.pow(b-med,2);},0)/cm.length; var cv = Math.sqrt(vr)/Math.abs(med); if (cv < 0.3) return 'Alta'; if (cv < 0.6) return 'Media'; return 'Baja'; }
function getTendenciaTexto(historial) { if (historial.length < 2) return '📊 Estable'; var c = 0; for (var i = 1; i < historial.length; i++) { if (historial[i].peso > historial[i-1].peso) c++; else if (historial[i].peso < historial[i-1].peso) c--; } if (c > 0) return '📈 Mejorando'; if (c < 0) return '📉 Empeorando'; return '📊 Estable'; }
function getEficiencia(pct) { if (pct >= 85) return { texto:'Excelente', color:'#22c55e' }; if (pct >= 70) return { texto:'Buena', color:'#60a5fa' }; if (pct >= 50) return { texto:'Regular', color:'#f59e0b' }; return { texto:'Crítica', color:'#ef4444' }; }
function getSemaforo(animal) { if (animal.tipo !== 'leche' || animal.estadoRepro !== 'parida' || !animal.fechaParto) return null; var diasPostParto = getDiasDesde(animal.fechaParto); if (diasPostParto > 365) diasPostParto = 365; if (diasPostParto <= 150) return { color:'verde', texto:'Ventana óptima', dias:diasPostParto }; if (diasPostParto <= 180) return { color:'amarillo', texto:'Revisar nutrición', dias:diasPostParto }; return { color:'rojo', texto:'Evaluar rentabilidad', dias:diasPostParto }; }

// ==================== ALERTAS ====================
function getAlertasLote() {
    var alertas = [], mez = { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 };
    DB.animales.forEach(function(a) { var d = getDietaCompleta(a.historial[a.historial.length-1].peso, a.tipo, a.estadoRepro); for (var k in mez) mez[k] += (d[k] || 0); });
    for (var j = 0; j < ALIMENTOS.length; j++) { var st = DB.stock[ALIMENTOS[j]] || 0, co = mez[ALIMENTOS[j]] || 0, cr = (ALIMENTOS[j] === 'pasto' || ALIMENTOS[j] === 'salvado') ? co : co/1000; if (st > 0 && cr > 0 && st/cr < 3) alertas.push({ t:'r', m:'<b>' + NM_ALIMENTOS[ALIMENTOS[j]] + '</b>: Stock ' + Math.round(st/cr) + 'd', icon:IC_ALIMENTOS[ALIMENTOS[j]] }); }
    DB.animales.forEach(function(a) { var du = getDiasDesde(a.historial[a.historial.length-1].fecha); if (du > 30) alertas.push({ t:'w', m:'<b>' + a.nombre + '</b>: Pesaje vencido (' + du + 'd)', icon:'📅' }); var ti = false; for (var i = DB.aplicaciones.length-1; i >= 0; i--) { if (DB.aplicaciones[i].animalId === a.id && (DB.aplicaciones[i].productoId === 'ivermectina1' || DB.aplicaciones[i].productoId === 'ivermectina315') && getDiasDesde(DB.aplicaciones[i].fecha) < 90) { ti = true; break; } } if (!ti && a.historial[a.historial.length-1].peso >= 150) alertas.push({ t:'purple', m:'<b>' + a.nombre + '</b>: Desparasitación vencida', icon:'🛡️' }); });
    return alertas;
}

// ==================== NAVEGACIÓN ====================
document.getElementById('bottomNav').addEventListener('click', function(e) { var btn = e.target.closest('button'); if (!btn || !btn.hasAttribute('data-p')) return; goPage(btn.getAttribute('data-p')); });
function goPage(p) { ['v-lote','v-animales','v-insumos','v-ajustes','v-perfil'].forEach(function(id) { var el = document.getElementById(id); if (el) el.classList.add('hidden'); }); var target = document.getElementById('v-' + p); if (target) target.classList.remove('hidden'); var btns = document.querySelectorAll('#bottomNav .bn-btn'); for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active'); var ab = document.querySelector('#bottomNav button[data-p="' + p + '"]'); if (ab) ab.classList.add('active'); if (p === 'lote') renderDashboard(); if (p === 'animales') renderAnimales(); if (p === 'insumos') renderInsumos(); if (p === 'ajustes') renderAjustes(); window.scrollTo(0, 0); }

// ==================== MODAL AGREGAR ====================
function toggleAdd() { var m = document.getElementById('addAnimalModal'); m.classList.toggle('hidden'); if (!m.classList.contains('hidden')) { actualizarSelectLotes(); document.getElementById('newN').focus(); } }
function closeAddModal() { document.getElementById('addAnimalModal').classList.add('hidden'); }
function toggleOrigen() { var o = document.getElementById('newOrigen').value; document.getElementById('origenNacimiento').classList.toggle('hidden', o !== 'nacimiento'); document.getElementById('origenComprado').classList.toggle('hidden', o !== 'comprado'); }
function actualizarSelectLotes() { var sel = document.getElementById('newLote'); sel.innerHTML = '<option value="">Sin lote</option>'; for (var i = 0; i < DB.lotes.length; i++) { sel.innerHTML += '<option value="' + DB.lotes[i].id + '">' + DB.lotes[i].nombre + ' (' + (DB.lotes[i].tipo === 'engorde' ? '🥩' : '🥛') + ')</option>'; } }
function addAnimal() { var n = document.getElementById('newN').value.trim(), p = parseFloat(document.getElementById('newW').value); if (!n || n.length < 2) { showToast('⚠️ Nombre válido'); return; } if (isNaN(p) || p < 20 || p > 2000) { showToast('⚠️ Peso 20-2000 kg'); return; } var tipo = document.getElementById('newTipo').value; var origen = document.getElementById('newOrigen').value; var loteId = document.getElementById('newLote').value; var animal = { id: Date.now(), nombre: n, tipo: tipo, origen: origen, historial: [{ fecha: new Date().toLocaleDateString(), peso: p }], lote: loteId || null, foto: null }; if (origen === 'nacimiento') { animal.madre = document.getElementById('newMadre').value.trim() || null; animal.fechaNacimiento = new Date().toLocaleDateString(); } if (origen === 'comprado') { animal.precioCompra = parseFloat(document.getElementById('newPrecio').value) || 0; animal.fechaCompra = new Date().toLocaleDateString(); } if (tipo === 'leche') { animal.estadoRepro = (p < 350) ? 'novilla' : 'parida'; animal.produccionLeche = []; } DB.animales.push(animal); save(); closeAddModal(); renderDashboard(); showToast('✅ ' + n + ' registrado'); }

// ==================== DASHBOARD MEJORADO ====================
function renderDashboard() {
    var price = DB.precioKG, totalKg = 0, mez = { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 };
    var costoTotal = 0, csTotal = 0, pesoProy30 = 0;
    for (var i = 0; i < DB.aplicaciones.length; i++) { if (DB.aplicaciones[i].tipo === 'sanidad') csTotal += (DB.aplicaciones[i].costo || 0); }
    var mejorA = null, peorA = null;
    var distRend = { verde:0, azul:0, naranja:0, rojo:0, gris:0 };

    var metricasLotes = [];
    for (var i = 0; i < DB.lotes.length; i++) {
        var lote = DB.lotes[i], animalesLote = DB.animales.filter(function(a) { return a.lote === lote.id; });
        var kgL = 0, cdL = 0, gmdL = 0, cg = 0;
        for (var j = 0; j < animalesLote.length; j++) { var a = animalesLote[j], cp = a.historial[a.historial.length-1].peso; kgL += cp; cdL += getCostoDiario(cp, a.tipo, a.estadoRepro); var g = getGMD(a.historial); if (a.historial.length >= 2) { gmdL += g; cg++; } }
        var pGMD = cg > 0 ? gmdL / cg : 0, ganL = pGMD * 30 * price * animalesLote.length - (cdL * 30);
        var ef = cg > 0 ? Math.min(100, Math.round(50 + pGMD * 100)) : 0;
        metricasLotes.push({ lote:lote, animales:animalesLote.length, kg:kgL, gmd:pGMD, ganancia:ganL, eficiencia:ef });
    }
    var animalesSinLote = DB.animales.filter(function(a) { return !a.lote; }), kgSL = 0;
    for (var i = 0; i < animalesSinLote.length; i++) kgSL += animalesSinLote[i].historial[animalesSinLote[i].historial.length-1].peso;

    for (var i = 0; i < DB.animales.length; i++) {
        var a = DB.animales[i], cp = a.historial[a.historial.length-1].peso; totalKg += cp;
        var d = getDietaCompleta(cp, a.tipo, a.estadoRepro); for (var k in mez) mez[k] += (d[k] || 0);
        costoTotal += getCostoDiario(cp, a.tipo, a.estadoRepro);
        var r = getRendimiento(a.historial); distRend[r.nivel] = (distRend[r.nivel] || 0) + 1;
        var gmd = getGMD(a.historial); if (!mejorA || gmd > mejorA.gmd) mejorA = { nombre:a.nombre, gmd:gmd, id:a.id }; if (!peorA || gmd < peorA.gmd) peorA = { nombre:a.nombre, gmd:gmd, id:a.id };
        var p30 = predecirPeso(a.historial, 30); if (p30) pesoProy30 += p30;
    }
    var ta = DB.animales.length, gmdL = ta > 0 ? DB.animales.reduce(function(s,a) { return s + getGMD(a.historial); },0)/ta : 0;
    var ingM = gmdL * 30 * price * ta, cosM = costoTotal * 30, gan = ingM - cosM - (csTotal/12);
    var valorProy30 = pesoProy30 * price, gan30 = valorProy30 - (totalKg * price);
    var eficienciaGlobal = ta > 0 ? Math.round(DB.animales.reduce(function(s,a) { var r = getRendimiento(a.historial); return s + Math.min(100, Math.max(0, 50 + r.cm * 10)); },0) / ta) : 0;
    var efData = getEficiencia(eficienciaGlobal);
    var alertasL = getAlertasLote();
    var tendenciaGlobal = gmdL > 0.35 ? '🚀 Acelerando' : gmdL > 0.25 ? '📊 Estable' : '📉 Cayendo';
    var pctTendencia = gmdL > 0 ? Math.round((gmdL / 0.45) * 100) : 0;

    // IA AMPLIADA
    var iaHTML = '<div class="ia-card"><div class="ia-title">🧠 IA DEL SISTEMA</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">' +
        '<div class="proyeccion-item"><div class="dias">EFICIENCIA GLOBAL</div><div class="peso" style="color:' + efData.color + '">' + eficienciaGlobal + '%</div><div class="ganancia">' + efData.texto + '</div></div>' +
        '<div class="proyeccion-item"><div class="dias">TENDENCIA</div><div class="peso">' + tendenciaGlobal + '</div><div class="ganancia">GMD: ' + gmdL.toFixed(2) + '</div></div>' +
        '<div class="proyeccion-item"><div class="dias">PESO HOY</div><div class="peso">' + fm(totalKg) + ' kg</div><div class="ganancia">$ ' + fm(totalKg * price) + '</div></div>' +
        '<div class="proyeccion-item"><div class="dias">30 DÍAS</div><div class="peso">' + fm(pesoProy30) + ' kg</div><div class="ganancia" style="color:' + (gan30 >= 0 ? '#22c55e' : '#ef4444') + '">' + (gan30 >= 0 ? '+' : '') + '$ ' + fm(Math.abs(gan30)) + '</div></div>' +
        '</div>' +
        '<div style="font-size:.62rem;color:var(--muted);margin-bottom:4px;">📊 Distribución: 🟢' + (distRend.verde||0) + ' 🟡' + (distRend.naranja||0) + ' 🔵' + (distRend.azul||0) + ' 🔴' + (distRend.rojo||0) + '</div>';
    if (mejorA) iaHTML += '<div class="ranking-item" onclick="showProfile(' + mejorA.id + ')">🏆 Mejor: <b>' + mejorA.nombre + '</b> (+' + mejorA.gmd.toFixed(2) + ' kg/d)</div>';
    if (peorA && ta > 1) iaHTML += '<div class="ranking-item" onclick="showProfile(' + peorA.id + ')">⚠️ Atención: <b>' + peorA.nombre + '</b> (+' + peorA.gmd.toFixed(2) + ' kg/d)</div>';
    if (eficienciaGlobal < 70) iaHTML += '<div class="ia-sugerencia"><span>💡</span> Para mejorar: Revisar desparasitación y aumentar melaza en Ceba.</div>';
    iaHTML += '</div>';

    // ALERTAS
    var alHTML = '';
    if (alertasL.length > 0) { alHTML = '<div class="card card-sm"><div style="font-weight:700;font-size:.68rem;margin-bottom:6px;color:var(--muted);">🔔 ALERTAS (' + alertasL.length + ')</div>'; for (var x = 0; x < Math.min(alertasL.length, 3); x++) { var cls = alertasL[x].t === 'r' ? 'alert-danger' : alertasL[x].t === 'purple' ? 'alert-purple' : 'alert-warning'; alHTML += '<div class="alert-item ' + cls + '">' + alertasL[x].icon + ' ' + alertasL[x].m + '</div>'; } alHTML += '</div>'; }

    // TARJETAS DE LOTES
    var lotesHTML = '';
    for (var i = 0; i < metricasLotes.length; i++) {
        var m = metricasLotes[i], tipoIcono = m.lote.tipo === 'engorde' ? '🥩' : '🥛';
        lotesHTML += '<div class="lote-card" onclick="verLote(\'' + m.lote.id + '\')"><div class="lote-nombre">' + tipoIcono + ' ' + m.lote.nombre + '<span style="font-size:.6rem;color:var(--muted);">' + m.animales + ' anim.</span></div>' +
        '<div class="lote-stats"><div class="lote-stat"><div class="val">' + fm(m.kg) + ' kg</div><div class="lbl">Peso</div></div><div class="lote-stat"><div class="val">' + m.gmd.toFixed(2) + '</div><div class="lbl">GMD</div></div><div class="lote-stat"><div class="val" style="color:' + (m.ganancia >= 0 ? '#22c55e' : '#ef4444') + '">$' + fm(m.ganancia) + '</div><div class="lbl">Gan/mes</div></div><div class="lote-stat"><div class="val">' + m.eficiencia + '%</div><div class="lbl">Efic.</div></div></div>' +
        '<button class="btn btn-sm btn-gray" style="width:100%;margin-top:8px;" onclick="event.stopPropagation();verLote(\'' + m.lote.id + '\')">VER DETALLE →</button></div>';
    }
    if (animalesSinLote.length > 0) lotesHTML += '<div class="lote-card" onclick="verAnimalesSinLote()"><div class="lote-nombre">📋 SIN LOTE <span style="font-size:.6rem;color:var(--muted);">' + animalesSinLote.length + '</span></div><div class="lote-stats"><div class="lote-stat"><div class="val">' + fm(kgSL) + ' kg</div><div class="lbl">Peso total</div></div></div></div>';

    // ANIMALES DESTACADOS
    var rankingTodos = DB.animales.slice().sort(function(a,b) { return getGMD(b.historial) - getGMD(a.historial); });
    var destHTML = '';
    if (rankingTodos.length > 0) {
        destHTML = '<div class="card card-sm"><div style="font-weight:700;font-size:.68rem;margin-bottom:6px;color:var(--muted);">🐄 ANIMALES DESTACADOS</div>';
        for (var rk = 0; rk < Math.min(rankingTodos.length, 3); rk++) {
            var an = rankingTodos[rk], gmdAn = getGMD(an.historial), pesoAn = an.historial[an.historial.length-1].peso;
            var medalla = rk === 0 ? '🥇' : rk === 1 ? '🥈' : '🥉';
            destHTML += '<div class="ranking-item" onclick="showProfile(' + an.id + ')" style="cursor:pointer;">' + medalla + ' <b>' + an.nombre + '</b>: ' + fm(pesoAn) + ' kg · +' + gmdAn.toFixed(2) + ' kg/d</div>';
        }
        destHTML += '<button class="btn btn-sm btn-gray mt8" style="width:100%;" onclick="goPage(\'animales\')">VER TODOS →</button></div>';
    }

    var html = '<div class="card card-sm"><div style="font-weight:600;">💰 PRECIO KG EN PIE</div><div style="display:flex;align-items:center;gap:6px;"><span style="font-size:1.1rem;font-weight:800;color:var(--accent);">$</span><input id="inpPKG" type="number" value="' + price + '" style="font-size:1.1rem;font-weight:700;text-align:center;"><span style="font-size:.7rem;color:var(--muted);">COP</span></div><button class="btn btn-green mt8" onclick="savePKG()">✅ ACTUALIZAR</button></div>' +
        '<div class="card card-sm"><div class="capital-value">$ ' + fm(totalKg * price) + '</div><div class="stats-grid"><div class="stat-item"><div class="row-label">🐄 Cabezas</div><div class="row-val">' + ta + '</div></div><div class="stat-item"><div class="row-label">⚖️ Peso Total</div><div class="row-val">' + fm(totalKg) + ' kg</div></div></div></div>' +
        iaHTML + alHTML +
        '<div class="section-title">📊 LOTES</div>' + lotesHTML + destHTML +
        '<div class="card card-sm"><div style="font-weight:700;font-size:.65rem;margin-bottom:4px;color:var(--muted);">💰 FINANZAS</div><div class="row"><span class="row-label">Alimentación/día</span><span class="row-val">$ ' + fm(costoTotal) + '</span></div><div class="row"><span class="row-label">Ganancia/mes</span><span class="row-val" style="color:' + (gan >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gan) + '</span></div></div>';
    document.getElementById('v-lote').innerHTML = html;
}
function savePKG() { var el = document.getElementById('inpPKG'); if (el) { DB.precioKG = parseFloat(el.value) || 0; save(); renderDashboard(); showToast('✅ Precio actualizado'); } }

// ==================== VER LOTES / ANIMALES ====================
function verLote(loteId) { var lote = DB.lotes.find(function(l) { return l.id === loteId; }); if (!lote) return; var animales = DB.animales.filter(function(a) { return a.lote === loteId; }); renderAnimalesGrid(animales, (lote.tipo === 'engorde' ? '🥩 ' : '🥛 ') + lote.nombre); }
function verAnimalesSinLote() { var animales = DB.animales.filter(function(a) { return !a.lote; }); renderAnimalesGrid(animales, '📋 Sin Lote'); }
function renderAnimalesGrid(animales, titulo) {
    var cards = '';
    for (var i = 0; i < animales.length; i++) { var a = animales[i], cp = a.historial[a.historial.length-1].peso, etapa = getEtapaCompleta(cp, a.tipo, a.estadoRepro), r = getRendimiento(a.historial), lm = { verde:'ml-g', azul:'ml-b', naranja:'ml-o', rojo:'ml-r', gris:'ml-x' }, sg = r.cm >= 0 ? '+' : '', sem = getSemaforo(a), semHTML = sem ? '<span class="semaforo semaforo-' + sem.color + '"></span>' : ''; cards += '<div class="animal-card ' + etapa.cardClass + '" onclick="showProfile(' + a.id + ')"><div class="mini-led ' + lm[r.nivel] + '"></div><div class="animal-avatar">' + getIconoAnimal(a) + '</div><div class="name">' + a.nombre + ' ' + semHTML + '</div><span class="etapa-tag ' + etapa.clase + '">' + etapa.rango + '</span><div class="weight">' + fm(cp) + ' kg</div><div class="cm" style="color:' + (r.cm >= 0 ? '#22c55e' : '#ef4444') + '">' + sg + r.cm.toFixed(1) + '%</div></div>'; }
    var html = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;"><div style="font-weight:700;font-size:.8rem;color:var(--accent);">' + titulo + ' (' + animales.length + ')</div><button class="btn btn-gray btn-sm" onclick="renderDashboard()">← Volver</button></div></div><div class="grid">' + cards + '</div>';
    document.getElementById('v-lote').innerHTML = html;
}
function renderAnimales() {
    var price = DB.precioKG, totalKg = 0, gmdTotal = 0, countGMD = 0;
    for (var i = 0; i < DB.animales.length; i++) { var a = DB.animales[i]; totalKg += a.historial[a.historial.length-1].peso; var g = getGMD(a.historial); if (a.historial.length >= 2) { gmdTotal += g; countGMD++; } }
    var ranking = DB.animales.slice().sort(function(a,b) { return getGMD(b.historial) - getGMD(a.historial); });
    var cards = '';
    for (var i = 0; i < DB.animales.length; i++) { var a = DB.animales[i], cp = a.historial[a.historial.length-1].peso, etapa = getEtapaCompleta(cp, a.tipo, a.estadoRepro), r = getRendimiento(a.historial), lm = { verde:'ml-g', azul:'ml-b', naranja:'ml-o', rojo:'ml-r', gris:'ml-x' }; cards += '<div class="animal-card ' + etapa.cardClass + '" onclick="showProfile(' + a.id + ')"><div class="mini-led ' + lm[r.nivel] + '"></div><div class="animal-avatar">' + getIconoAnimal(a) + '</div><div class="name">' + a.nombre + '</div><span class="etapa-tag ' + etapa.clase + '">' + etapa.rango + '</span><div class="weight">' + fm(cp) + ' kg</div><div class="cm" style="color:' + (r.cm >= 0 ? '#22c55e' : '#ef4444') + '">' + (r.cm >= 0 ? '+' : '') + r.cm.toFixed(1) + '%</div></div>'; }
    var rankingHTML = '';
    for (var i = 0; i < Math.min(ranking.length, 3); i++) { var medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'; rankingHTML += '<div class="ranking-item" onclick="showProfile(' + ranking[i].id + ')">' + medalla + ' <b>' + ranking[i].nombre + '</b>: +' + getGMD(ranking[i].historial).toFixed(2) + ' kg/d</div>'; }
    var html = '<div class="card card-sm"><div class="capital-value">$ ' + fm(totalKg * DB.precioKG) + '</div><div class="stats-grid"><div class="stat-item"><div class="row-label">🐄 Cabezas</div><div class="row-val">' + DB.animales.length + '</div></div><div class="stat-item"><div class="row-label">⚖️ Peso</div><div class="row-val">' + fm(totalKg) + ' kg</div></div></div></div>' +
        '<div class="ia-card"><div class="ia-title">🏆 RANKING</div>' + rankingHTML + '</div>' +
        '<div class="section-title">🐄 TODOS</div><div class="grid">' + cards + '</div>';
    document.getElementById('v-animales').innerHTML = html;
}

// ==================== PERFIL DEL ANIMAL ====================
function showProfile(id) {
    var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return;
    try {
        var p = a.historial[a.historial.length-1].peso, etapa = getEtapaCompleta(p, a.tipo, a.estadoRepro), r = getRendimiento(a.historial), gmd = getGMD(a.historial);
        var d = getDietaCompleta(p, a.tipo, a.estadoRepro), cd = getCostoDiario(p, a.tipo, a.estadoRepro);
        var csd = 0; try { for (var i = 0; i < DB.aplicaciones.length; i++) { if (DB.aplicaciones[i].animalId === id) { var prod = getCatalogoSanidadCompleto().find(function(x) { return x.id === DB.aplicaciones[i].productoId; }); if (prod && prod.diasEfecto > 0) csd += (DB.aplicaciones[i].costo || 0) / prod.diasEfecto; } } } catch(e) { csd = 0; }
        var cst = 0; try { for (var i = 0; i < DB.aplicaciones.length; i++) { if (DB.aplicaciones[i].animalId === id) cst += (DB.aplicaciones[i].costo || 0); } } catch(e) { cst = 0; }
        var ckp = gmd > 0 ? (cd + csd) / gmd : 999999, ingM = gmd * 30 * DB.precioKG, gan = ingM - (cd * 30) - (cst / 12), valorActual = p * DB.precioKG;
        var pred30 = predecirPeso(a.historial, 30), pred60 = predecirPeso(a.historial, 60), pred90 = predecirPeso(a.historial, 90);
        var confianza = getConfianzaPrediccion(a.historial), tendTxt = getTendenciaTexto(a.historial), hayIA = pred30 !== null && pred30 > 0;
        var semaforo = getSemaforo(a), loteActual = DB.lotes.find(function(l) { return l.id === a.lote; });

        var edadHTML = '';
        try { if (a.origen === 'nacimiento' && a.fechaNacimiento) { var diasEdad = getDiasDesde(a.fechaNacimiento); edadHTML = '<div class="row"><span class="row-label">🎂 Edad</span><span class="row-val">' + Math.floor(diasEdad/30) + ' meses (' + diasEdad + ' d)</span></div>'; } if (a.origen === 'comprado' && a.fechaCompra) { var diasFinca = getDiasDesde(a.fechaCompra); edadHTML += '<div class="row"><span class="row-label">🚚 Días en finca</span><span class="row-val">' + diasFinca + ' d</span></div>'; if (a.precioCompra) { var roi = ((valorActual - a.precioCompra - cst) / a.precioCompra * 100).toFixed(1); edadHTML += '<div class="row"><span class="row-label">💰 ROI</span><span class="row-val" style="color:' + (roi >= 0 ? '#22c55e' : '#ef4444') + '">' + roi + '%</span></div>'; } } if (a.madre) { var madre = DB.animales.find(function(x) { return x.nombre === a.madre || x.id === a.madre; }); if (madre) edadHTML += '<div class="row"><span class="row-label">🐄 Madre</span><span class="row-val" style="cursor:pointer;color:var(--accent);" onclick="showProfile(' + madre.id + ')">' + madre.nombre + '</span></div>'; } } catch(e) { edadHTML = ''; }

        var loteHTML = '<div class="row"><span class="row-label">📊 Lote</span><span class="row-val">' + (loteActual ? loteActual.nombre : 'Sin lote') + ' <button class="btn btn-purple btn-sm" onclick="cambiarLote(' + id + ')" style="padding:2px 8px;font-size:.6rem;">✏️</button></span></div>';

        var criasHTML = '';
        try { if (a.tipo === 'leche') { var crias = DB.animales.filter(function(x) { return x.madre === a.nombre || x.madre === a.id; }); if (crias.length > 0) { criasHTML = '<div class="section-title">👶 CRÍAS (' + crias.length + ')</div>'; for (var c = 0; c < crias.length; c++) criasHTML += '<div class="row" style="cursor:pointer;" onclick="showProfile(' + crias[c].id + ')"><span class="row-label"><div class="animal-avatar" style="width:24px;height:24px;font-size:.8rem;">' + getIconoAnimal(crias[c]) + '</div> ' + crias[c].nombre + '</span><span class="row-val">' + fm(crias[c].historial[crias[c].historial.length-1].peso) + ' kg</span></div>'; } } } catch(e) { criasHTML = ''; }

        var lecheHTML = '';
        try { if (a.tipo === 'leche' && a.estadoRepro === 'parida') { var litrosHoy = a.produccionLeche && a.produccionLeche.length > 0 ? a.produccionLeche[a.produccionLeche.length-1].litros : 0; lecheHTML = '<div class="card card-sm" style="background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.2);"><div style="font-weight:700;font-size:.65rem;color:var(--accent);">🥛 LECHE</div><div class="row"><span class="row-label">Litros hoy</span><span class="row-val">' + litrosHoy + ' L</span></div><button class="btn btn-green btn-sm mt8" onclick="registrarLeche(' + id + ')" style="width:100%;">➕ REGISTRAR</button></div>'; } } catch(e) { lecheHTML = ''; }

        var botonesHTML = '';
        try { if (a.tipo === 'leche' && a.estadoRepro === 'parida' && semaforo && semaforo.dias >= 60 && !a.fechaPrenez) botonesHTML += '<button class="btn btn-purple btn-sm" onclick="quedoPrenada(' + id + ')" style="flex:1;">👶 Preñada</button>'; if (a.tipo === 'leche' && a.estadoRepro === 'seca') botonesHTML += '<button class="btn btn-green btn-sm" onclick="yaPario(' + id + ')" style="flex:1;">✅ Parió</button>'; if (a.tipo === 'leche') botonesHTML += '<button class="btn btn-gray btn-sm" onclick="cambiarAEngorde(' + id + ')" style="flex:1;">🔄 Engorde</button>'; } catch(e) { botonesHTML = ''; }

        var appsHTML = '';
        try { var apps = DB.aplicaciones.filter(function(app) { return app.animalId === id; }).slice(-5).reverse(); if (apps.length > 0) { appsHTML = '<div class="section-title">💉 APLICACIONES</div>'; for (var ap = 0; ap < apps.length; ap++) { appsHTML += '<div class="aplicacion-item"><span>' + apps[ap].producto + '</span><span style="font-size:.63rem;">' + apps[ap].fecha + ' · $' + fm(apps[ap].costo||0) + '</span></div>'; } } } catch(e) { appsHTML = ''; }

        var hist = '', rev = a.historial.slice().reverse();
        try { for (var i = 0; i < rev.length; i++) { var h = rev[i], ch = '', di = ''; if (i === 0) di = '<span style="font-size:.58rem;color:var(--muted);margin-left:4px;">hace ' + getDiasDesde(h.fecha) + ' d</span>'; if (i < a.historial.length-1) { var ant = a.historial[a.historial.length-2-i].peso, dif = h.peso - ant, cls = dif >= 0 ? 'badge-up' : 'badge-down', sig = dif >= 0 ? '+' : ''; ch = '<span class="badge ' + cls + '">' + sig + ((dif/ant)*100).toFixed(1) + '%</span>'; } hist += '<div class="hist-item"><span>📅 ' + h.fecha + di + '</span><div><span class="row-val">' + fm(h.peso) + ' kg</span>' + ch + '</div></div>'; } } catch(e) { hist = ''; }

        var dietaHTML = '<div class="card card-sm"><div style="font-weight:700;font-size:.65rem;margin-bottom:6px;color:var(--accent);">🧪 DIETA DIARIA</div>';
        var items = [
            { icono:'🌱', nombre:'Pasto', valor:(d.pasto||0).toFixed(1)+' kg' },
            { icono:'🌾', nombre:'Salvado', valor:(d.salvado||0).toFixed(2)+' kg' },
            { icono:'💧', nombre:'Melaza', valor:Math.round(d.melaza||0)+' g' },
            { icono:'⚗️', nombre:'UREA', valor:Math.round(d.urea||0)+' g' },
            { icono:'🧊', nombre:'Bicarbonato', valor:Math.round(d.bicarb||0)+' g' },
            { icono:'🧂', nombre:'Sal Mineral', valor:Math.round(d.sal||0)+' g' }
        ];
        for (var x = 0; x < items.length; x++) { var it = items[x]; var bloqueado = (it.nombre === 'UREA' && etapa.ureaBloqueada); dietaHTML += '<div class="row"><span class="row-label">' + it.icono + ' ' + it.nombre + '</span><span class="row-val" style="' + (bloqueado ? 'color:#6b7280;text-decoration:line-through' : '') + '">' + (bloqueado ? '0 g (🔒)' : it.valor) + '</span></div>'; }
        dietaHTML += '</div>';

        document.getElementById('v-lote').classList.add('hidden'); document.getElementById('v-animales').classList.add('hidden'); document.getElementById('v-insumos').classList.add('hidden'); document.getElementById('v-ajustes').classList.add('hidden'); document.getElementById('v-perfil').classList.remove('hidden');

        var html = '<div class="card"><div class="profile-cover"><div class="profile-avatar" onclick="abrirFoto(' + id + ')">' + getIconoAnimal(a) + '<div class="foto-overlay">📸</div></div><div class="profile-name">' + a.nombre + '</div><div class="profile-sub">' + etapa.rango + ' · ' + (a.tipo === 'engorde' ? '🥩 Engorde' : '🥛 Leche') + (semaforo ? ' · <span class="semaforo semaforo-' + semaforo.color + '"></span>' + semaforo.texto : '') + '</div><div class="profile-stats"><div class="profile-stat"><div class="val">' + fm(p) + ' kg</div><div class="lbl">Peso</div></div><div class="profile-stat"><div class="val">' + gmd.toFixed(2) + '</div><div class="lbl">GMD</div></div><div class="profile-stat"><div class="val">$ ' + fm(valorActual) + '</div><div class="lbl">Valor</div></div></div>' + (etapa.min !== undefined ? '<div class="progress"><div class="progress-fill" style="width:' + getProgresoEtapa(p, etapa) + '%;background:' + etapa.color + ';"></div></div><div style="font-size:.6rem;color:var(--muted);text-align:center;">Faltan ' + fm((etapa.max||9999) - p) + ' kg para ' + etapa.siguienteEtapa + '</div>' : '') + '</div>' +
            edadHTML + loteHTML + lecheHTML + criasHTML +
            '<div class="alerta-card ' + r.color + '"><div class="alerta-led ' + r.color + '">' + r.icono + '</div><div><div class="alerta-titulo">' + r.texto + '</div><div class="alerta-met">' + (r.cm >= 0 ? '+' : '') + r.cm.toFixed(1) + '% · $' + fm(ckp) + '/kg</div></div></div>';
        if (hayIA) { var gan30 = (pred30 - p) * DB.precioKG, gan60 = (pred60 - p) * DB.precioKG, gan90 = (pred90 - p) * DB.precioKG; html += '<div class="ia-card"><div class="ia-title">🧠 IA · Confianza: ' + confianza + '</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;"><div class="proyeccion-item"><div class="dias">30 DÍAS</div><div class="peso">' + fm(pred30) + ' kg</div><div class="ganancia" style="color:' + (gan30 >= 0 ? '#22c55e' : '#ef4444') + '">' + (gan30 >= 0 ? '+' : '') + '$ ' + fm(Math.abs(gan30)) + '</div></div><div class="proyeccion-item"><div class="dias">60 DÍAS</div><div class="peso">' + fm(pred60) + ' kg</div><div class="ganancia" style="color:' + (gan60 >= 0 ? '#22c55e' : '#ef4444') + '">' + (gan60 >= 0 ? '+' : '') + '$ ' + fm(Math.abs(gan60)) + '</div></div><div class="proyeccion-item"><div class="dias">90 DÍAS</div><div class="peso">' + fm(pred90) + ' kg</div><div class="ganancia" style="color:' + (gan90 >= 0 ? '#22c55e' : '#ef4444') + '">' + (gan90 >= 0 ? '+' : '') + '$ ' + fm(Math.abs(gan90)) + '</div></div></div></div>'; }
        html += '<div class="card card-sm"><div style="font-weight:700;font-size:.65rem;margin-bottom:4px;color:var(--muted);">💰 RENTABILIDAD</div><div class="row"><span class="row-label">Costo/día</span><span class="row-val">$ ' + fm(cd) + '</span></div><div class="row"><span class="row-label">Ganancia/mes</span><span class="row-val" style="color:' + (gan >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gan) + '</span></div></div>' +
            appsHTML + '<div class="section-title">🕐 HISTORIAL</div>' + hist + dietaHTML +
            '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">' + botonesHTML + '<button class="btn btn-purple btn-sm" onclick="openAplicarSanidad(' + id + ')" style="flex:1;">💉 Sanidad</button><button class="btn btn-green btn-sm" onclick="updateWeight(' + id + ')" style="flex:2;">⚖️ PESAJE</button></div>';
        document.getElementById('v-perfil').innerHTML = html;
        window.scrollTo(0, 0); save();
    } catch(e) { console.error('Error en perfil:', e); showToast('⚠️ Error cargando perfil'); }
}

// ==================== ACCIONES ====================
function updateWeight(id) { var p = prompt('⚖️ Nuevo pesaje (kg):'); if (!p) return; p = parseFloat(p); if (isNaN(p) || p < 20 || p > 2000) { showToast('⚠️ Peso 20-2000 kg'); return; } var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.historial.push({ fecha: new Date().toLocaleDateString(), peso: p }); save(); showProfile(id); showToast('✅ Pesaje guardado'); }
function abrirFoto(id) { var input = document.getElementById('fotoInput'); input.setAttribute('data-animal', id); input.click(); }
function guardarFoto() { var input = document.getElementById('fotoInput'); var id = parseInt(input.getAttribute('data-animal')); var file = input.files[0]; if (!file) return; var reader = new FileReader(); reader.onload = function(e) { var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.foto = e.target.result; fotosDB[id] = e.target.result; save(); showProfile(id); showToast('📸 Foto guardada'); }; reader.readAsDataURL(file); }
function cambiarLote(id) { var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; var loteActual = DB.lotes.find(function(l) { return l.id === a.lote; }); var html = '<div class="modal-title">🔄 CAMBIAR LOTE - ' + a.nombre + '</div><div style="font-size:.7rem;color:var(--muted);margin-bottom:8px;">Actual: ' + (loteActual ? loteActual.nombre : 'Sin lote') + '</div><div class="flex-col gap10"><div style="font-weight:600;font-size:.7rem;color:var(--accent);">COMPATIBLES:</div>'; var lotes = DB.lotes.filter(function(l) { return l.tipo === a.tipo; }); for (var i = 0; i < lotes.length; i++) html += '<button class="btn btn-sm ' + (a.lote === lotes[i].id ? 'btn-green' : 'btn-gray') + '" onclick="confirmarCambioLote(' + id + ',\'' + lotes[i].id + '\')">' + lotes[i].nombre + '</button>'; html += '<button class="btn btn-sm btn-gray" onclick="confirmarCambioLote(' + id + ',null)">📋 Sin lote</button>'; var otroTipo = a.tipo === 'engorde' ? 'leche' : 'engorde'; var lotesOtro = DB.lotes.filter(function(l) { return l.tipo === otroTipo; }); html += '<div style="font-weight:600;font-size:.7rem;color:var(--accent);margin-top:8px;">CAMBIAR A ' + (otroTipo === 'engorde' ? '🥩 ENGORDE' : '🥛 LECHE') + ':</div>'; for (var j = 0; j < lotesOtro.length; j++) html += '<button class="btn btn-sm btn-gray" onclick="confirmarCambioLoteTipo(' + id + ',\'' + lotesOtro[j].id + '\',\'' + otroTipo + '\')">' + lotesOtro[j].nombre + '</button>'; html += '<button class="btn btn-sm btn-gray" onclick="confirmarCambioLoteTipo(' + id + ',null,\'' + otroTipo + '\')">📋 Sin lote</button>'; html += '<button class="btn btn-gray btn-sm mt8" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); }
function confirmarCambioLote(id, loteId) { var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.lote = loteId; save(); document.querySelector('.modal-overlay').remove(); showProfile(id); showToast('✅ Lote actualizado'); }
function confirmarCambioLoteTipo(id, loteId, nuevoTipo) { if (!confirm('⚠️ ¿Cambiar a ' + (nuevoTipo === 'engorde' ? '🥩 Engorde' : '🥛 Leche') + '?')) return; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.tipo = nuevoTipo; a.lote = loteId; if (nuevoTipo === 'engorde') { a.estadoRepro = 'venta'; a.produccionLeche = []; } else { a.estadoRepro = 'novilla'; } save(); document.querySelector('.modal-overlay').remove(); showProfile(id); showToast('✅ Actualizado'); }
function registrarLeche(id) { var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; var litrosHoy = a.produccionLeche && a.produccionLeche.length > 0 ? a.produccionLeche[a.produccionLeche.length-1].litros : 0; var html = '<div class="modal-title">🥛 LECHE - ' + a.nombre + '</div><div class="flex-col gap10"><input id="lecheLitros" type="number" placeholder="Litros hoy" step="0.5" value="' + litrosHoy + '"><input id="lechePrecio" type="number" placeholder="Precio por litro ($)" value="' + (DB.litroLeche || 1500) + '"><button class="btn btn-green mt8" onclick="guardarLeche(' + id + ')">✅ GUARDAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); }
function guardarLeche(id) { var litros = parseFloat(document.getElementById('lecheLitros').value); var precio = parseFloat(document.getElementById('lechePrecio').value); if (isNaN(litros) || litros < 0) { showToast('⚠️ Litros válidos'); return; } if (precio && !isNaN(precio)) DB.litroLeche = precio; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; if (!a.produccionLeche) a.produccionLeche = []; a.produccionLeche.push({ fecha: new Date().toLocaleDateString(), litros: litros }); save(); document.querySelector('.modal-overlay').remove(); showProfile(id); showToast('✅ ' + litros + ' L'); }
function quedoPrenada(id) { if (!confirm('🤰 ¿Confirmar preñez?')) return; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; var hoy = new Date(); a.fechaPrenez = hoy.toLocaleDateString(); var parto = new Date(hoy.getTime() + 285 * 86400000); a.fechaPartoEstimada = parto.toLocaleDateString(); a.fechaSecado = new Date(parto.getTime() - 60 * 86400000).toLocaleDateString(); save(); showProfile(id); showToast('✅ Preñez registrada'); }
function iniciarSecado(id) { if (!confirm('🔴 ¿Iniciar secado?')) return; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.estadoRepro = 'seca'; a.fechaSecadoInicio = new Date().toLocaleDateString(); save(); showProfile(id); showToast('✅ Secado iniciado'); }
function yaPario(id) { if (!confirm('✅ ¿Confirmar parto?')) return; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.estadoRepro = 'parida'; a.fechaParto = new Date().toLocaleDateString(); a.fechaPrenez = null; a.fechaPartoEstimada = null; a.fechaSecado = null; if (confirm('🐮 ¿Registrar cría?')) { var pesoCria = parseFloat(prompt('⚖️ Peso al nacer (kg):')); if (!isNaN(pesoCria) && pesoCria > 10) { var nombreCria = prompt('📝 Nombre:') || ('Cría de ' + a.nombre); DB.animales.push({ id: Date.now()+1, nombre: nombreCria, tipo: 'leche', origen: 'nacimiento', madre: a.nombre, fechaNacimiento: new Date().toLocaleDateString(), historial: [{ fecha: new Date().toLocaleDateString(), peso: pesoCria }], estadoRepro: 'novilla', lote: a.lote, produccionLeche: [] }); } } save(); showProfile(id); showToast('✅ Parto registrado'); }
function cambiarAEngorde(id) { if (!confirm('🔄 ¿Cambiar a Engorde?')) return; var a = DB.animales.find(function(x) { return x.id === id; }); if (!a) return; a.tipo = 'engorde'; a.estadoRepro = 'venta'; save(); showProfile(id); showToast('✅ Cambiado a Engorde'); }
function deleteAnimal(id) { if (confirm('⚠️ ¿Eliminar animal?')) { DB.animales = DB.animales.filter(function(x) { return x.id !== id; }); save(); goPage('lote'); showToast('✅ Eliminado'); } }

// ==================== SANIDAD (dentro de Insumos) ====================
function renderInsumos() {
    var mez = { pasto:0, salvado:0, sal:0, melaza:0, urea:0, levadura:0, bicarb:0 };
    DB.animales.forEach(function(a) { var d = getDietaCompleta(a.historial[a.historial.length-1].peso, a.tipo, a.estadoRepro); for (var k in mez) mez[k] += (d[k] || 0); });
    
    var html = '';
    
    // ALIMENTOS
    html += '<div class="card"><div style="font-weight:700;margin-bottom:14px;color:var(--accent);">🍽️ ALIMENTOS</div>';
    for (var i = 0; i < ALIMENTOS.length; i++) { var st = DB.stock[ALIMENTOS[i]] || 0, co = mez[ALIMENTOS[i]] || 0, cr = (ALIMENTOS[i] === 'pasto' || ALIMENTOS[i] === 'salvado') ? co : co/1000; var dias = cr > 0 && st > 0 ? st/cr : 999, dCol = dias < 3 ? '#ef4444' : dias < 7 ? '#f59e0b' : '#22c55e'; html += '<div class="insumo-row"><span>' + IC_ALIMENTOS[ALIMENTOS[i]] + '</span><div class="insumo-info"><span class="insumo-nombre">' + NM_ALIMENTOS[ALIMENTOS[i]] + '</span><span class="insumo-detalle">$' + fm(DB.precios[ALIMENTOS[i]]||0) + '/kg · <b style="color:' + dCol + '">' + (dias===999?'--':Math.round(dias)+'d') + '</b></span></div><div class="insumo-inputs"><input id="pr-' + ALIMENTOS[i] + '" type="number" value="' + (DB.precios[ALIMENTOS[i]]||0) + '"><input id="st-' + ALIMENTOS[i] + '" type="number" value="' + Math.round(st) + '"></div></div>'; }
    html += '<button class="btn btn-green mt12" onclick="saveAlimentos()">✅ GUARDAR</button></div>';
    
    // SUPLEMENTOS
    html += '<div class="card"><div style="font-weight:700;margin-bottom:14px;color:var(--accent);">🧪 SUPLEMENTOS (g/kg)</div>';
    for (var s = 0; s < DB.suplementosAlimento.length; s++) { var sup = DB.suplementosAlimento[s]; html += '<div class="sup-card"><div class="sup-card-header"><span class="sup-nombre">🧪 ' + sup.nombre + '</span><div class="sup-card-actions"><button onclick="eliminarSuplementoAlimento(\'' + sup.id + '\')">🗑️</button></div></div><div class="sup-card-body"><span>' + sup.gramosPorKg + ' g/kg</span><span>$' + fm(sup.precioPorKg||0) + '/kg</span><span>Stock: ' + fm(sup.stock||0) + ' kg</span></div><div style="display:flex;gap:4px;margin-top:6px;"><input id="ccs-' + sup.id + '" type="number" placeholder="kg" style="flex:1;padding:6px;font-size:.65rem;"><input id="ccos-' + sup.id + '" type="number" placeholder="Costo $" style="flex:1;padding:6px;font-size:.65rem;"><button class="btn btn-purple btn-sm" onclick="comprarSuplementoAlimento(\'' + sup.id + '\')" style="padding:4px 8px;">🛒</button></div></div>'; }
    html += '<button class="btn btn-purple mt12" onclick="openAgregarSuplementoAlimento()">➕ AGREGAR</button></div>';
    
    // SANIDAD
    var cat = getCatalogoSanidadCompleto();
    html += '<div class="card"><div style="font-weight:700;margin-bottom:14px;color:var(--accent);">💉 SANIDAD</div>';
    for (var i = 0; i < cat.length; i++) { var p = cat[i], stS = p.tipo === 'fijo' ? (DB.stockSanidad[p.id]||0) : (p.stock||0), prS = p.tipo === 'fijo' ? (DB.preciosSanidad[p.id]||0) : (p.precioML||0); html += '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03);"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span>' + p.icono + '</span><div style="flex:1;"><span style="font-size:.76rem;font-weight:600;">' + p.nombre + '</span><span style="font-size:.58rem;color:var(--muted);">Stock: <b>' + fm(stS) + ' ml</b> · $<b>' + fm(prS) + '/ml</b></span></div></div><div style="display:flex;gap:4px;"><input id="cm-' + p.id + '" type="number" placeholder="ml" style="flex:1;padding:6px;font-size:.65rem;"><input id="ccsS-' + p.id + '" type="number" placeholder="Costo $" style="flex:1;padding:6px;font-size:.65rem;"><button class="btn btn-purple btn-sm" onclick="agregarCompraSanidad(\'' + p.id + '\')" style="padding:4px 8px;">🛒</button></div></div>'; }
    html += '<button class="btn btn-purple mt12" onclick="openAgregarSuplementoSanidad()">➕ AGREGAR</button></div>';
    
    document.getElementById('v-insumos').innerHTML = html;
}
function saveAlimentos() { for (var i = 0; i < ALIMENTOS.length; i++) { var pel = document.getElementById('pr-' + ALIMENTOS[i]), sel = document.getElementById('st-' + ALIMENTOS[i]); if (pel) DB.precios[ALIMENTOS[i]] = parseFloat(pel.value) || 0; if (sel) DB.stock[ALIMENTOS[i]] = parseFloat(sel.value) || 0; } save(); showToast('✅ Guardado'); }
function openAgregarSuplementoAlimento() { showModal('<div class="modal-title">🧪 NUEVO SUPLEMENTO</div><div class="flex-col gap10"><input id="supAlimNombre" type="text" placeholder="Nombre"><input id="supAlimGramos" type="number" placeholder="g/kg" step="1"><input id="supAlimPrecio" type="number" placeholder="Precio por kg ($)"><button class="btn btn-purple mt8" onclick="agregarSuplementoAlimento()">✅ AGREGAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'); }
function agregarSuplementoAlimento() { var n = document.getElementById('supAlimNombre').value.trim(), g = parseInt(document.getElementById('supAlimGramos').value) || 50, pr = parseFloat(document.getElementById('supAlimPrecio').value) || 0; if (!n) { showToast('⚠️ Nombre'); return; } DB.suplementosAlimento.push({ id:'supAlim_'+Date.now(), nombre:n, gramosPorKg:g, precioPorKg:pr, stock:0 }); save(); document.querySelector('.modal-overlay').remove(); renderInsumos(); showToast('✅ Agregado'); }
function eliminarSuplementoAlimento(id) { DB.suplementosAlimento = DB.suplementosAlimento.filter(function(s) { return s.id !== id; }); save(); renderInsumos(); showToast('✅ Eliminado'); }
function comprarSuplementoAlimento(id) { var ce = document.getElementById('ccs-' + id), coe = document.getElementById('ccos-' + id); if (!ce || !coe) return; var kg = parseFloat(ce.value), costo = parseFloat(coe.value); if (isNaN(kg) || kg <= 0 || isNaN(costo) || costo <= 0) { showToast('⚠️ Datos válidos'); return; } var sup = DB.suplementosAlimento.find(function(s) { return s.id === id; }); if (!sup) return; sup.stock = (sup.stock || 0) + kg; if (!sup.precioPorKg || sup.precioPorKg === 0) sup.precioPorKg = costo / kg; save(); ce.value = ''; coe.value = ''; renderInsumos(); showToast('✅ Stock +' + fm(kg) + ' kg'); }
function openAgregarSuplementoSanidad() { showModal('<div class="modal-title">💉 NUEVO INYECTABLE</div><div class="flex-col gap10"><input id="supSanNombre" type="text" placeholder="Nombre"><input id="supSanDosis" type="number" placeholder="Dosis (ml/kg)"><input id="supSanDiasEfecto" type="number" placeholder="Días efecto"><input id="supSanRetiro" type="number" placeholder="Días retiro"><button class="btn btn-purple mt8" onclick="agregarSuplementoSanidad()">✅ AGREGAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'); }
function agregarSuplementoSanidad() { var n = document.getElementById('supSanNombre').value.trim(), d = parseFloat(document.getElementById('supSanDosis').value) || 50, de = parseInt(document.getElementById('supSanDiasEfecto').value) || 30, ret = parseInt(document.getElementById('supSanRetiro').value) || 0; if (!n) { showToast('⚠️ Nombre'); return; } DB.suplementosSanidad.push({ id:'supSan_'+Date.now(), nombre:n, dosis:d, diasEfecto:de, retiro:ret, stock:0, precioML:0, icono:'💉', color:'#a78bfa', tipo:'personalizado' }); save(); document.querySelector('.modal-overlay').remove(); renderInsumos(); showToast('✅ Agregado'); }
function agregarCompraSanidad(prodId) { var me = document.getElementById('cm-' + prodId), ce = document.getElementById('ccsS-' + prodId); if (!me || !ce) return; var ml = parseFloat(me.value), co = parseFloat(ce.value); if (isNaN(ml) || ml <= 0 || isNaN(co) || co <= 0) { showToast('⚠️ Datos válidos'); return; } var sp = DB.suplementosSanidad.find(function(s) { return s.id === prodId; }); if (sp) { sp.stock = (sp.stock || 0) + ml; sp.precioML = co / ml; } else { DB.stockSanidad[prodId] = (DB.stockSanidad[prodId] || 0) + ml; DB.preciosSanidad[prodId] = co / ml; } save(); me.value = ''; ce.value = ''; renderInsumos(); showToast('✅ Compra registrada'); }
function openAplicarSanidad(animalId) { var a = DB.animales.find(function(x) { return x.id === animalId; }); if (!a) return; var peso = a.historial[a.historial.length-1].peso; var cat = getCatalogoSanidadCompleto(); var opts = ''; for (var i = 0; i < cat.length; i++) opts += '<option value="' + cat[i].id + '">' + cat[i].nombre + '</option>'; var html = '<div class="modal-title">💉 APLICAR A ' + a.nombre + ' (' + fm(peso) + ' kg)</div><div class="flex-col gap10"><select id="aplProducto" onchange="calcularDosisModal(' + peso + ')">' + opts + '</select><div id="dosisInfo" style="font-size:.7rem;color:var(--muted);"></div><input id="aplML" type="number" placeholder="ml aplicados" step=".1"><button class="btn btn-green mt8" onclick="aplicarProductoSanidad(' + animalId + ')">✅ CONFIRMAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'; showModal(html); setTimeout(function() { calcularDosisModal(peso); }, 100); }
function calcularDosisModal(peso) { var sel = document.getElementById('aplProducto'), info = document.getElementById('dosisInfo'); if (!sel || !info) return; var p = getCatalogoSanidadCompleto().find(function(x) { return x.id === sel.value; }); if (p) info.innerHTML = '📋 Dosis sugerida: <b>' + (peso / p.dosis).toFixed(1) + ' ml</b>'; }
function aplicarProductoSanidad(animalId) { var sel = document.getElementById('aplProducto'), mlEl = document.getElementById('aplML'); if (!sel || !mlEl) return; var pid = sel.value, ml = parseFloat(mlEl.value); if (isNaN(ml) || ml <= 0) { showToast('⚠️ ml válidos'); return; } var p = getCatalogoSanidadCompleto().find(function(x) { return x.id === pid; }); var a = DB.animales.find(function(x) { return x.id === animalId; }); if (!p || !a) return; var prc = p.tipo === 'fijo' ? (DB.preciosSanidad[pid] || 0) : (p.precioML || 0); var ct = prc * ml; DB.aplicaciones.push({ animalId: animalId, productoId: pid, producto: p.nombre, cantidad: ml, unidad: 'ml', costo: ct, fecha: new Date().toLocaleDateString(), tipo: 'sanidad' }); if (p.tipo === 'fijo') { DB.stockSanidad[pid] = Math.max(0, (DB.stockSanidad[pid] || 0) - ml); } else { p.stock = Math.max(0, (p.stock || 0) - ml); } save(); document.querySelector('.modal-overlay').remove(); showToast('✅ ' + p.nombre + ': ' + ml + ' ml ($' + fm(ct) + ')'); showProfile(animalId); }

// ==================== AJUSTES ====================
function renderAjustes() { var lotesHTML = ''; for (var i = 0; i < DB.lotes.length; i++) { var l = DB.lotes[i], count = DB.animales.filter(function(a) { return a.lote === l.id; }).length; lotesHTML += '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.03);"><span>' + (l.tipo==='engorde'?'🥩':'🥛') + '</span><span style="flex:1;">' + l.nombre + ' (' + count + ')</span><button class="btn btn-danger btn-sm" onclick="eliminarLote(\'' + l.id + '\')" style="padding:4px 8px;">🗑️</button></div>'; } var html = '<div class="card config-section"><h3>📊 LOTES</h3>' + lotesHTML + '<button class="btn btn-purple btn-sm mt8" onclick="openCrearLote()" style="width:100%;">➕ CREAR LOTE</button></div>' + '<div class="card config-section"><h3>💾 RESPALDO</h3><button class="btn btn-purple" onclick="exportarDatos()">📥 EXPORTAR</button><button class="btn btn-gray" onclick="importarDatos()">📤 IMPORTAR</button></div>' + '<div class="card config-section"><h3>📲 INSTALAR</h3><button class="btn btn-purple" onclick="instalarApp()">📱 INSTALAR PWA</button></div>' + '<div class="card config-section"><h3>ℹ️ INFO</h3><p style="font-size:.7rem;color:var(--muted);">👑 GANADERO ÉLITE v5.1</p><p style="font-size:.6rem;color:var(--muted);">🥩 Engorde + 🥛 Leche · 🧠 IA Predictiva</p><p style="font-size:.6rem;color:var(--muted);">📡 100% Offline · Auto-guardado 15s</p></div>'; document.getElementById('v-ajustes').innerHTML = html; }
function openCrearLote() { showModal('<div class="modal-title">📊 NUEVO LOTE</div><div class="flex-col gap10"><input id="loteNombre" type="text" placeholder="Nombre"><select id="loteTipo"><option value="engorde">🥩 Engorde</option><option value="leche">🥛 Leche</option></select><button class="btn btn-purple mt8" onclick="crearLote()">✅ CREAR</button><button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>'); }
function crearLote() { var n = document.getElementById('loteNombre').value.trim(), t = document.getElementById('loteTipo').value; if (!n) { showToast('⚠️ Nombre'); return; } DB.lotes.push({ id: 'lote_' + Date.now(), nombre: n, tipo: t }); save(); document.querySelector('.modal-overlay').remove(); renderAjustes(); showToast('✅ Lote creado'); }
function eliminarLote(id) { if (confirm('⚠️ ¿Eliminar lote?')) { DB.lotes = DB.lotes.filter(function(l) { return l.id !== id; }); DB.animales.forEach(function(a) { if (a.lote === id) a.lote = null; }); save(); renderAjustes(); showToast('✅ Eliminado'); } }
function exportarDatos() { var b = new Blob([JSON.stringify(DB,null,2)],{type:'application/json'}); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ganadero-elite-respaldo.json'; a.click(); showToast('✅ Exportado'); }
function importarDatos() { var i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = function(e) { var r = new FileReader(); r.onload = function(e) { try { DB = JSON.parse(e.target.result); save(); renderDashboard(); showToast('✅ Importado'); } catch(err) { showToast('❌ Error'); } }; r.readAsText(e.target.files[0]); }; i.click(); }

// ==================== INIT ====================
cargarDatos(); renderDashboard();
window.addEventListener('beforeunload', function() { save(); });
document.addEventListener('visibilitychange', function() { if (document.hidden) save(); });
setInterval(function() { save(); }, 15000);
console.log('👑 GANADERO ÉLITE v5.1 LISTO');
