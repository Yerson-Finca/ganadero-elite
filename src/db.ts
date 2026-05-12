import Dexie, { Table } from 'dexie'

export interface Pesaje {
  fecha: string
  peso: number
}

export interface Animal {
  id?: number
  nombre: string
  tipo: 'engorde' | 'leche'
  origen: 'nacimiento' | 'comprado'
  historial: Pesaje[]
  lote: string | null
  foto: string | null
  madre?: string | null
  fechaNacimiento?: string
  precioCompra?: number
  fechaCompra?: string
  estadoRepro?: 'novilla' | 'parida' | 'seca' | 'venta'
  produccionLeche?: { fecha: string; litros: number }[]
  fechaPrenez?: string | null
  fechaPartoEstimada?: string | null
  fechaSecado?: string | null
  fechaSecadoInicio?: string | null
  fechaParto?: string | null
}

export interface Lote {
  id: string
  nombre: string
  tipo: 'engorde' | 'leche'
}

export interface Aplicacion {
  id?: number
  animalId: number
  productoId: string
  producto: string
  cantidad: number
  unidad: string
  costo: number
  fecha: string
  tipo: string
}

export interface SuplementoAlimento {
  id: string
  nombre: string
  gramosPorKg: number
  precioPorKg: number
  stock: number
}

export interface SuplementoSanidad {
  id: string
  nombre: string
  dosis: number
  diasEfecto: number
  retiro: number
  stock: number
  precioML: number
  icono: string
  color: string
  tipo: string
}

export interface PreciosAlimento {
  pasto: number
  salvado: number
  melaza: number
  levadura: number
  bicarb: number
  sal: number
  urea: number
}

export interface AppData {
  id?: number
  key: string
  value: any
}

class GanaderoDB extends Dexie {
  animales!: Table<Animal, number>
  lotes!: Table<Lote, string>
  aplicaciones!: Table<Aplicacion, number>
  suplementosAlimento!: Table<SuplementoAlimento, string>
  suplementosSanidad!: Table<SuplementoSanidad, string>
  appData!: Table<AppData, number>

  constructor() {
    super('ganadero_elite_v6')
    this.version(1).stores({
      animales: '++id, nombre, tipo, lote',
      lotes: 'id, nombre, tipo',
      aplicaciones: '++id, animalId, productoId, fecha',
      suplementosAlimento: 'id, nombre',
      suplementosSanidad: 'id, nombre',
      appData: '++id, key'
    })
  }
}

export const db = new GanaderoDB()

// Datos iniciales por defecto
export const DEFAULT_APP_DATA = {
  preciosAlimento: {
    pasto: 1200, salvado: 2500, melaza: 3800,
    levadura: 8000, bicarb: 4500, sal: 6200, urea: 9500
  },
  stockAlimento: {
    pasto: 500, salvado: 200, melaza: 50,
    levadura: 10, bicarb: 5, sal: 2, urea: 20
  },
  stockSanidad: {} as Record<string, number>,
  preciosSanidad: {} as Record<string, number>,
  precioKG: 9800,
  litroLeche: 1500
}

// Función para cargar datos iniciales si no existen
export async function inicializarDB() {
  const count = await db.animales.count()
  const dataExists = await db.appData.where('key').equals('inicializado').first()
  
  if (!dataExists) {
    await db.appData.put({ key: 'inicializado', value: true })
    await db.appData.put({ key: 'preciosAlimento', value: DEFAULT_APP_DATA.preciosAlimento })
    await db.appData.put({ key: 'stockAlimento', value: DEFAULT_APP_DATA.stockAlimento })
    await db.appData.put({ key: 'stockSanidad', value: DEFAULT_APP_DATA.stockSanidad })
    await db.appData.put({ key: 'preciosSanidad', value: DEFAULT_APP_DATA.preciosSanidad })
    await db.appData.put({ key: 'precioKG', value: DEFAULT_APP_DATA.precioKG })
    await db.appData.put({ key: 'litroLeche', value: DEFAULT_APP_DATA.litroLeche })
    console.log('✅ DB inicializada con datos por defecto')
  }
}

// Funciones helper para obtener/guardar configuración
export async function getConfig<T>(key: string, defaultValue: T): Promise<T> {
  const data = await db.appData.where('key').equals(key).first()
  return data ? data.value : defaultValue
}

export async function setConfig(key: string, value: any) {
  const existing = await db.appData.where('key').equals(key).first()
  if (existing) {
    await db.appData.update(existing.id!, { value })
  } else {
    await db.appData.put({ key, value })
  }
}
