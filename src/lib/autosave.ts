/**
 * autosave.ts
 *
 * Multi-tier autosave for Not Angka Editor:
 *   - Tier 1 (primary)   : IndexedDB  — survives cache clears, much more durable
 *   - Tier 2 (secondary) : LocalStorage — fast, synchronous fallback
 *
 * IndexedDB is accessed via a tiny hand-rolled helper so we don't need an
 * extra dependency.  All async operations return Promises.
 */

const DB_NAME = 'notangka_autosave'
const DB_VERSION = 1
const STORE_NAME = 'autosave'

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

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

export async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(value, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      tx.oncomplete = () => db.close()
    })
  } catch (err) {
    // IDB unavailable — swallow silently, LocalStorage is the fallback
    console.warn('[autosave] IndexedDB write failed:', err)
  }
}

export async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDB()
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => {
        resolve(req.result ?? null)
        db.close()
      }
      req.onerror = () => {
        reject(req.error)
        db.close()
      }
    })
  } catch (err) {
    console.warn('[autosave] IndexedDB read failed:', err)
    return null
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(key)
      req.onsuccess = () => { resolve(); db.close() }
      req.onerror = () => { reject(req.error); db.close() }
    })
  } catch (err) {
    console.warn('[autosave] IndexedDB delete failed:', err)
  }
}

// ─── Multi-tier save / load ───────────────────────────────────────────────────

const LS_KEY = 'notangka_tabs'
const IDB_KEY = 'notangka_tabs'

/**
 * Persists `data` to both IndexedDB and LocalStorage.
 * IDB is written asynchronously; LS is written synchronously so it's always
 * up-to-date even if IDB hasn't completed yet.
 */
export async function autosaveAll(data: object): Promise<void> {
  const serialized = JSON.stringify(data)

  // Tier 2: LocalStorage — synchronous, immediate
  try {
    localStorage.setItem(LS_KEY, serialized)
  } catch (err) {
    console.warn('[autosave] LocalStorage write failed:', err)
  }

  // Tier 1: IndexedDB — async, more durable
  await idbSet(IDB_KEY, serialized)
}

/**
 * Loads autosaved data. Tries IndexedDB first; falls back to LocalStorage.
 * Returns the parsed object, or `null` if nothing is found.
 */
export async function loadAutosave(): Promise<object | null> {
  // Tier 1: Try IndexedDB first
  const idbData = await idbGet(IDB_KEY)
  if (idbData) {
    try {
      return JSON.parse(idbData)
    } catch {
      console.warn('[autosave] IDB data corrupt, falling back to LocalStorage')
    }
  }

  // Tier 2: Fall back to LocalStorage
  const lsData = localStorage.getItem(LS_KEY)
  if (lsData) {
    try {
      return JSON.parse(lsData)
    } catch {
      console.warn('[autosave] LocalStorage data corrupt')
    }
  }

  return null
}
