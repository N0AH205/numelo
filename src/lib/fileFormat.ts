/**
 * .notangka file format (v1)
 *
 * A JSON file that saves everything needed to perfectly restore an editor tab:
 *   - title        : string   — song/document title
 *   - content      : string   — full TipTap HTML
 *   - settings     : object   — fontSize, spacing, theme
 *   - version      : number   — format version (currently 1)
 *   - appId        : string   — "notangka-editor" identifier
 *   - savedAt      : string   — ISO 8601 timestamp
 */

export interface NotAngkaSettings {
  fontSize: number
  spacing: number
  theme: 'light' | 'dark'
}

export interface NotAngkaFile {
  version: number
  appId: 'notangka-editor'
  title: string
  savedAt: string
  settings: NotAngkaSettings
  content: string
}

// ─── Serialization ────────────────────────────────────────────────────────────

export function serializeNotAngka(
  title: string,
  content: string,
  settings: NotAngkaSettings,
): string {
  const file: NotAngkaFile = {
    version: 1,
    appId: 'notangka-editor',
    title,
    savedAt: new Date().toISOString(),
    settings,
    content,
  }
  return JSON.stringify(file, null, 2)
}

// ─── Deserialization ──────────────────────────────────────────────────────────

export class NotAngkaParseError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'NotAngkaParseError'
  }
}

export function deserializeNotAngka(raw: string): NotAngkaFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new NotAngkaParseError('File bukan JSON yang valid.')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new NotAngkaParseError('Format file tidak dikenal.')
  }

  const obj = parsed as Record<string, unknown>

  if (obj.appId !== 'notangka-editor') {
    throw new NotAngkaParseError('File ini bukan file Not Angka Editor.')
  }
  if (typeof obj.content !== 'string') {
    throw new NotAngkaParseError('File tidak mengandung konten yang valid.')
  }
  if (typeof obj.title !== 'string') {
    throw new NotAngkaParseError('File tidak mengandung judul yang valid.')
  }

  const rawSettings = (obj.settings ?? {}) as Record<string, unknown>

  return {
    version: Number(obj.version ?? 1),
    appId: 'notangka-editor',
    title: obj.title as string,
    savedAt: (obj.savedAt as string) ?? new Date().toISOString(),
    settings: {
      fontSize: typeof rawSettings.fontSize === 'number' ? rawSettings.fontSize : 16,
      spacing: typeof rawSettings.spacing === 'number' ? rawSettings.spacing : 1.8,
      theme: (rawSettings.theme as 'light' | 'dark') ?? 'light',
    },
    content: obj.content as string,
  }
}

// ─── Download ─────────────────────────────────────────────────────────────────

export function downloadNotAngka(
  title: string,
  content: string,
  settings: NotAngkaSettings,
): void {
  const json = serializeNotAngka(title, content, settings)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // Sanitise filename: replace characters that are invalid in filenames
  const safeName = title.replace(/[\\/:*?"<>|]/g, '_') || 'untitled'
  const filename = `${safeName}.notangka`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  // Small delay before revoking so the download can start
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ─── Open / Import ─────────────────────────────────────────────────────────────

/**
 * Opens a native file-picker filtered to `.notangka` files,
 * reads the selected file, and returns the parsed data.
 *
 * Resolves to `null` if the user cancels without picking a file.
 */
export function openNotAngkaFile(): Promise<NotAngkaFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.notangka,application/json'

    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const raw = e.target?.result as string
          const data = deserializeNotAngka(raw)
          resolve(data)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new NotAngkaParseError('Gagal membaca file.'))
      reader.readAsText(file, 'utf-8')
    }

    // If the user dismisses the picker without selecting, onchange won't fire.
    // We listen for the window regaining focus as a heuristic.
    const onFocus = () => {
      window.removeEventListener('focus', onFocus)
      // Give the browser time to fire onchange if a file was selected
      setTimeout(() => {
        if (!input.files?.length) resolve(null)
      }, 500)
    }
    window.addEventListener('focus', onFocus)

    input.click()
  })
}
