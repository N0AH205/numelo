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

export class NotAngkaParseError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'NotAngkaParseError'
  }
}

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

  if (obj.appId !== 'notangka-editor') throw new NotAngkaParseError('File ini bukan file Not Angka Editor.')
  if (typeof obj.content !== 'string') throw new NotAngkaParseError('File tidak mengandung konten yang valid.')
  if (typeof obj.title !== 'string') throw new NotAngkaParseError('File tidak mengandung judul yang valid.')

  const s = (obj.settings ?? {}) as Record<string, unknown>

  return {
    version: Number(obj.version ?? 1),
    appId: 'notangka-editor',
    title: obj.title as string,
    savedAt: (obj.savedAt as string) ?? new Date().toISOString(),
    settings: {
      fontSize: typeof s.fontSize === 'number' ? s.fontSize : 16,
      spacing: typeof s.spacing === 'number' ? s.spacing : 1.8,
      theme: (s.theme as 'light' | 'dark') ?? 'light',
    },
    content: obj.content as string,
  }
}

export function downloadNotAngka(
  title: string,
  content: string,
  settings: NotAngkaSettings,
): void {
  const blob = new Blob([serializeNotAngka(title, content, settings)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const safeName = title.replace(/[\\/:*?"<>|]/g, '_') || 'untitled'

  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName}.notangka`
  a.click()

  // Small delay before revoking so the download can start
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function openNotAngkaFile(): Promise<NotAngkaFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.notangka,application/json'

    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) { resolve(null); return }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          resolve(deserializeNotAngka(e.target?.result as string))
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new NotAngkaParseError('Gagal membaca file.'))
      reader.readAsText(file, 'utf-8')
    }

    // onchange won't fire if the user dismisses the picker — use focus as a heuristic
    const onFocus = () => {
      window.removeEventListener('focus', onFocus)
      setTimeout(() => { if (!input.files?.length) resolve(null) }, 500)
    }
    window.addEventListener('focus', onFocus)

    input.click()
  })
}
