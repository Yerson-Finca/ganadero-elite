// ==================== BASE DE DATOS INDEXEDDB ====================
var DB_NAME = 'GanaderoElite';
var DB_VERSION = 1;
var db = null;

function initDB(callback) {
    var request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = function(e) {
        var database = e.target.result;
        if (!database.objectStoreNames.contains('animales')) {
            database.createObjectStore('animales', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('aplicaciones')) {
            var appStore = database.createObjectStore('aplicaciones', { keyPath: 'id', autoIncrement: true });
            appStore.createIndex('animalId', 'animalId', { unique: false });
        }
        if (!database.objectStoreNames.contains('config')) {
            database.createObjectStore('config', { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains('suplementos')) {
            var supStore = database.createObjectStore('suplementos', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('stockSuplementos')) {
            database.createObjectStore('stockSuplementos', { keyPath: 'id' });
        }
    };
    
    request.onsuccess = function(e) {
        db = e.target.result;
        console.log('IndexedDB lista');
        migrarLocalStorage(callback);
    };
    
    request.onerror = function() {
        console.error('Error abriendo IndexedDB');
        if (callback) callback();
    };
}

function migrarLocalStorage(callback) {
    var oldData = localStorage.getItem('ganadero_elite');
    if (!oldData) { if (callback) callback(); return; }
    
    try {
        var data = JSON.parse(oldData);
        var tx = db.transaction(['animales', 'aplicaciones', 'config'], 'readwrite');
        
        if (data.animales) {
            var animalStore = tx.objectStore('animales');
            data.animales.forEach(function(a) { animalStore.put(a); });
        }
        if (data.aplicaciones) {
            var appStore = tx.objectStore('aplicaciones');
            data.aplicaciones.forEach(function(a) { appStore.put(a); });
        }
        if (data.precioKG) {
            var configStore = tx.objectStore('config');
            configStore.put({ key: 'precioKG', value: data.precioKG });
            configStore.put({ key: 'precios', value: data.precios || {} });
            configStore.put({ key: 'stock', value: data.stock || {} });
            configStore.put({ key: 'preciosSanidad', value: data.preciosSanidad || {} });
            configStore.put({ key: 'stockSanidad', value: data.stockSanidad || {} });
            configStore.put({ key: 'etapasAnteriores', value: data.etapasAnteriores || {} });
        }
        
        tx.oncomplete = function() {
            localStorage.removeItem('ganadero_elite');
            console.log('Migración completada');
            if (callback) callback();
        };
    } catch(e) {
        console.error('Error migrando:', e);
        if (callback) callback();
    }
}

// ==================== OPERACIONES CRUD ====================
function getStore(storeName, mode) { return db.transaction(storeName, mode).objectStore(storeName); }

function getAnimales(callback) {
    var store = getStore('animales', 'readonly');
    var request = store.getAll();
    request.onsuccess = function() { callback(request.result || []); };
    request.onerror = function() { callback([]); };
}

function guardarAnimal(animal, callback) {
    var store = getStore('animales', 'readwrite');
    var request = store.put(animal);
    request.onsuccess = function() { if (callback) callback(); };
}

function eliminarAnimal(id, callback) {
    var store = getStore('animales', 'readwrite');
    store.delete(id);
    if (callback) setTimeout(callback, 100);
}

function getAplicaciones(callback) {
    var store = getStore('aplicaciones', 'readonly');
    var request = store.getAll();
    request.onsuccess = function() { callback(request.result || []); };
    request.onerror = function() { callback([]); };
}

function guardarAplicacion(app, callback) {
    var store = getStore('aplicaciones', 'readwrite');
    var request = store.add(app);
    request.onsuccess = function() { if (callback) callback(); };
}

function getConfig(key, callback) {
    var store = getStore('config', 'readonly');
    var request = store.get(key);
    request.onsuccess = function() { callback(request.result ? request.result.value : null); };
    request.onerror = function() { callback(null); };
}

function setConfig(key, value, callback) {
    var store = getStore('config', 'readwrite');
    store.put({ key: key, value: value });
    if (callback) setTimeout(callback, 100);
}

function getSuplementos(callback) {
    var store = getStore('suplementos', 'readonly');
    var request = store.getAll();
    request.onsuccess = function() { callback(request.result || []); };
    request.onerror = function() { callback([]); };
}

function guardarSuplemento(sup, callback) {
    var store = getStore('suplementos', 'readwrite');
    store.put(sup);
    if (callback) setTimeout(callback, 100);
}

function eliminarSuplemento(id, callback) {
    var store = getStore('suplementos', 'readwrite');
    store.delete(id);
    if (callback) setTimeout(callback, 100);
}

function getStockSuplementos(callback) {
    var store = getStore('stockSuplementos', 'readonly');
    var request = store.getAll();
    request.onsuccess = function() { callback(request.result || []); };
    request.onerror = function() { callback([]); };
}

function guardarStockSuplemento(stock, callback) {
    var store = getStore('stockSuplementos', 'readwrite');
    store.put(stock);
    if (callback) setTimeout(callback, 100);
}

// ==================== EXPORTAR / IMPORTAR ====================
function exportarDatos() {
    getAnimales(function(animales) {
        getAplicaciones(function(aplicaciones) {
            getConfig('precioKG', function(precioKG) {
                getConfig('precios', function(precios) {
                    getConfig('stock', function(stock) {
                        getConfig('preciosSanidad', function(preciosSanidad) {
                            getConfig('stockSanidad', function(stockSanidad) {
                                getSuplementos(function(suplementos) {
                                    getStockSuplementos(function(stockSuplementos) {
                                        var data = {
                                            animales: animales,
                                            aplicaciones: aplicaciones,
                                            precioKG: precioKG || 9800,
                                            precios: precios || {},
                                            stock: stock || {},
                                            preciosSanidad: preciosSanidad || {},
                                            stockSanidad: stockSanidad || {},
                                            suplementos: suplementos,
                                            stockSuplementos: stockSuplementos,
                                            fechaExport: new Date().toISOString()
                                        };
                                        var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                                        var url = URL.createObjectURL(blob);
                                        var a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'ganadero-elite-respaldo-' + new Date().toLocaleDateString().replace(/\//g,'-') + '.json';
                                        a.click();
                                        URL.revokeObjectURL(url);
                                        showToast('✅ Respaldo descargado');
                                    }));
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function importarDatos() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                var txAnimales = getStore('animales', 'readwrite');
                data.animales.forEach(function(a) { txAnimales.put(a); });
                
                var txApps = getStore('aplicaciones', 'readwrite');
                data.aplicaciones.forEach(function(a) { txApps.put(a); });
                
                setConfig('precioKG', data.precioKG || 9800);
                setConfig('precios', data.precios || {});
                setConfig('stock', data.stock || {});
                setConfig('preciosSanidad', data.preciosSanidad || {});
                setConfig('stockSanidad', data.stockSanidad || {});
                
                if (data.suplementos) {
                    var txSup = getStore('suplementos', 'readwrite');
                    data.suplementos.forEach(function(s) { txSup.put(s); });
                }
                if (data.stockSuplementos) {
                    var txStSup = getStore('stockSuplementos', 'readwrite');
                    data.stockSuplementos.forEach(function(s) { txStSup.put(s); });
                }
                
                setTimeout(function() {
                    showToast('✅ Datos importados correctamente');
                    renderLote();
                }, 500);
            } catch(err) {
                showToast('❌ Error al importar: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
