const DB_NAME = 'notangka_autosave'
const DB_VERSION = 1
const STORE_NAME = 'autosave'
const STORAGE_KEY = 'notangka_tabs'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(value: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const req = tx.objectStore(STORE_NAME).put(value, STORAGE_KEY)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      tx.oncomplete = () => db.close()
    })
  } catch (err) {
    // IDB unavailable — LocalStorage is the fallback
    console.warn('[autosave] IndexedDB write failed:', err)
  }
}

async function idbGet(): Promise<string | null> {
  try {
    const db = await openDB()
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(STORAGE_KEY)
      req.onsuccess = () => { resolve(req.result ?? null); db.close() }
      req.onerror = () => { reject(req.error); db.close() }
    })
  } catch (err) {
    console.warn('[autosave] IndexedDB read failed:', err)
    return null
  }
}

// IDB is written async; LS is synchronous so it's always current even if IDB lags
export async function autosaveAll(data: object): Promise<void> {
  const serialized = JSON.stringify(data)
  try {
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (err) {
    console.warn('[autosave] LocalStorage write failed:', err)
  }
  await idbSet(serialized)
}

// IDB first — more durable; falls back to LS if IDB is empty or corrupt
export async function loadAutosave(): Promise<object | null> {
  const idbRaw = await idbGet()
  if (idbRaw) {
    try { return JSON.parse(idbRaw) } catch {
      console.warn('[autosave] IDB data corrupt, falling back to LocalStorage')
    }
  }

  const lsRaw = localStorage.getItem(STORAGE_KEY)
  if (lsRaw) {
    try { return JSON.parse(lsRaw) } catch {
      console.warn('[autosave] LocalStorage data corrupt')
    }
  }

  return null
}
