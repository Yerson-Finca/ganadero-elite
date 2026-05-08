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

function getEtapa(pv) {
    if (pv < 150) return { nombre: 'Iniciación', clase: 'etapa-inicio', icono: '🐮', rango: 'Levante Temprano', min: 0, max: 150, ureaBloqueada: true, color: '#fbbf24', siguienteEtapa: 'Desarrollo' };
    if (pv < 350) return { nombre: 'Desarrollo', clase: 'etapa-desarrollo', icono: '🐂', rango: 'Levante', min: 150, max: 350, ureaBloqueada: false, color: '#60a5fa', siguienteEtapa: 'Ceba' };
    if (pv < 500) return { nombre: 'Ceba', clase: 'etapa-ceba', icono: '🐃', rango: 'Finalización', min: 350, max: 500, ureaBloqueada: false, color: '#fb923c', siguienteEtapa: 'Madurez' };
    return { nombre: 'Madurez', clase: 'etapa-madurez', icono: '🦬', rango: 'Venta', min: 500, max: 9999, ureaBloqueada: false, color: '#f87171', siguienteEtapa: 'Venta' };
}

function getProgresoEtapa(pv, e) { return Math.min(100, Math.max(0, ((pv - e.min) / (e.max - e.min)) * 100)); }

function getDiet(pv) {
    if (pv < 20) return { pasto: 0, salvado: 0, sal: 0, melaza: 0, urea: 0, levadura: 0, bicarb: 0 };
    var d = { pasto: pv * 0.03, salvado: pv * 0.0045, sal: pv * 0.2, melaza: 0, urea: 0, levadura: 0, bicarb: 0 };
    if (pv >= 130 && pv < 150) d.melaza = 50;
    if (pv >= 150) { var f = pv * 1.1; d.melaza = Math.max(d.melaza, f * 0.85); d.levadura = f * 0.05; d.bicarb = 20; d.urea = pv > 800 ? 150 : f * 0.10; if (d.urea > 150) d.urea = 150; }
    return d;
}

function getDiasDesde(f) { if (!f) return 999; var p = f.split('/'); if (p.length < 3) return 999; return Math.floor((new Date() - new Date(p[2], p[1] - 1, p[0])) / 86400000); }
function getGMD(h) { return h.length < 2 ? 0 : (h[h.length - 1].peso - h[h.length - 2].peso) / 30; }

function getCostoDiario(pv, precios) {
    if (!precios) return 0;
    var d = getDiet(pv);
    return (d.pasto || 0) * (precios.pasto || 0) + (d.salvado || 0) * (precios.salvado || 0) + ((d.melaza || 0) / 1000) * (precios.melaza || 0) + ((d.levadura || 0) / 1000) * (precios.levadura || 0) + ((d.bicarb || 0) / 1000) * (precios.bicarb || 0) + ((d.sal || 0) / 1000) * (precios.sal || 0) + ((d.urea || 0) / 1000) * (precios.urea || 0);
}

function getCostoSanidadDiario(animalId, aplicaciones, catalogo) {
    var t = 0;
    if (!aplicaciones || !catalogo) return 0;
    for (var i = 0; i < aplicaciones.length; i++) {
        if (aplicaciones[i].animalId === animalId) {
            var p = catalogo.find(function(x) { return x.id === aplicaciones[i].productoId; });
            if (p && p.diasEfecto > 0) t += (aplicaciones[i].costo || 0) / p.diasEfecto;
        }
    }
    return t;
}

function getCkp(animalId, historial, precios, aplicaciones, catalogo, precioKG) {
    if (!historial || historial.length < 2) return 0;
    var gmd = getGMD(historial);
    if (gmd <= 0) return 999999;
    var pv = historial[historial.length - 1].peso;
    return (getCostoDiario(pv, precios) + getCostoSanidadDiario(animalId, aplicaciones, catalogo)) / gmd;
}

function getRendimiento(h) {
    if (h.length < 2) return { nivel: 'azul', texto: 'Registre más pesajes', icono: 'fa-circle-info', cm: 0, color: 'azul' };
    var act = h[h.length - 1].peso, ant = h[h.length - 2].peso, cm = ((act - ant) / ant) * 100;
    if (act < ant) return { nivel: 'gris', texto: 'Pérdida de Peso', icono: 'fa-circle-exclamation', cm: cm, color: 'gris' };
    if (cm >= 5) return { nivel: 'verde', texto: 'Excelente', icono: 'fa-crown', cm: cm, color: 'verde' };
    if (cm >= 3.5) return { nivel: 'azul', texto: 'Bueno', icono: 'fa-circle-check', cm: cm, color: 'azul' };
    if (cm >= 2.5) return { nivel: 'naranja', texto: 'Regular', icono: 'fa-triangle-exclamation', cm: cm, color: 'naranja' };
    return { nivel: 'rojo', texto: 'Bajo', icono: 'fa-circle-exclamation', cm: cm, color: 'rojo' };
}

function getIneficienciaConsecutiva(animalId, historial, precios, aplicaciones, catalogo, precioKG) {
    if (!historial || historial.length < 3) return false;
    var count = 0;
    for (var i = historial.length - 1; i >= 1 && count < 2; i--) {
        var ckp = getCkp(animalId, historial.slice(0, i + 1), precios, aplicaciones, catalogo, precioKG);
        if (ckp > precioKG) count++; else break;
    }
    return count >= 2;
}
