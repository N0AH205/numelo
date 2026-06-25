'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Editor from './Editor'
import { Plus, X, Moon, Sun, Save, FolderOpen, CheckCircle, Loader2 } from 'lucide-react'
import { downloadNotAngka, openNotAngkaFile, NotAngkaParseError } from '../lib/fileFormat'
import { autosaveAll, loadAutosave } from '../lib/autosave'

export type TabData = {
  id: string
  title: string
  content: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const EMPTY_DOC = '<p></p>'
const DEBOUNCE_MS = 1500
const PERIODIC_MS = 30_000

export default function Workspace() {
  const [tabs, setTabs] = useState<TabData[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [spacing, setSpacing] = useState(1.8)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Ref so the periodic flush always reads current state without re-registering the interval
  const stateRef = useRef({ tabs, activeTabId, isDark, fontSize, spacing })
  useEffect(() => {
    stateRef.current = { tabs, activeTabId, isDark, fontSize, spacing }
  }, [tabs, activeTabId, isDark, fontSize, spacing])

  const buildPayload = useCallback(
    (t: TabData[], aid: string | null, fs: number, sp: number, dark: boolean) => ({
      tabs: t, activeTabId: aid, fontSize: fs, spacing: sp, theme: dark ? 'dark' : 'light',
    }),
    [],
  )

  const persist = useCallback(
    async (t: TabData[], aid: string | null, fs: number, sp: number, dark: boolean) => {
      setSaveStatus('saving')
      try {
        await autosaveAll(buildPayload(t, aid, fs, sp, dark))
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    },
    [buildPayload],
  )

  const newTab = (title = 'Lagu Baru 1'): TabData => ({ id: Date.now().toString(), title, content: EMPTY_DOC })

  useEffect(() => {
    async function init() {
      const saved = await loadAutosave() as {
        tabs?: TabData[]; activeTabId?: string; fontSize?: number; spacing?: number; theme?: string
      } | null

      if (saved) {
        if (saved.theme === 'dark') setIsDark(true)
        if (typeof saved.fontSize === 'number') setFontSize(saved.fontSize)
        if (typeof saved.spacing === 'number') setSpacing(saved.spacing)

        if (saved.tabs?.length) {
          setTabs(saved.tabs)
          setActiveTabId(saved.activeTabId ?? saved.tabs[0].id)
        } else {
          const tab = newTab()
          setTabs([tab]); setActiveTabId(tab.id)
        }
      } else {
        const tab = newTab()
        setTabs([tab]); setActiveTabId(tab.id)
      }

      setIsLoaded(true)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    const timer = setTimeout(() => persist(tabs, activeTabId, fontSize, spacing, isDark), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [tabs, activeTabId, fontSize, spacing, isDark, isLoaded, persist])

  useEffect(() => {
    if (!isLoaded) return
    const interval = setInterval(() => {
      const { tabs: t, activeTabId: aid, fontSize: fs, spacing: sp, isDark: dark } = stateRef.current
      persist(t, aid, fs, sp, dark)
    }, PERIODIC_MS)
    return () => clearInterval(interval)
  }, [isLoaded, persist])

  const addTab = () => {
    const tab = newTab(`Lagu Baru ${tabs.length + 1}`)
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
  }

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const remaining = tabs.filter(t => t.id !== id)
    if (!remaining.length) {
      const tab = newTab()
      setTabs([tab]); setActiveTabId(tab.id)
    } else {
      setTabs(remaining)
      if (activeTabId === id) setActiveTabId(remaining[remaining.length - 1].id)
    }
  }

  const updateContent = useCallback((id: string, content: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, content } : t))
  }, [])

  const updateTitle = (id: string, title: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, title } : t))
  }

  const handleSave = () => {
    if (!activeTab) return
    downloadNotAngka(activeTab.title, activeTab.content, { fontSize, spacing, theme: isDark ? 'dark' : 'light' })
  }

  const handleOpen = async () => {
    try {
      const data = await openNotAngkaFile()
      if (!data) return
      setFontSize(data.settings.fontSize)
      setSpacing(data.settings.spacing)
      setIsDark(data.settings.theme === 'dark')
      const tab = { id: Date.now().toString(), title: data.title, content: data.content }
      setTabs(prev => [...prev, tab])
      setActiveTabId(tab.id)
    } catch (err) {
      alert(err instanceof NotAngkaParseError ? `Gagal membuka file:\n${err.message}` : 'Terjadi kesalahan saat membuka file.')
    }
  }

  if (!isLoaded) return null

  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <div
      className="flex flex-col h-screen print:h-auto bg-gray-50 dark:bg-gray-900 overflow-hidden print:overflow-visible text-gray-900 dark:text-gray-100 transition-colors duration-300"
      style={{
        '--na-font-size': `${fontSize}px`,
        '--na-line-spacing': spacing,
        '--na-para-margin': `${spacing * 0.25}em`,
      } as React.CSSProperties}
    >
      <div className="bg-white dark:bg-gray-800 px-4 py-2 flex items-center z-10 border-b border-gray-300 dark:border-gray-700 transition-colors duration-300 print:hidden">
        <div className="w-10 h-10 bg-blue-600 rounded text-white flex items-center justify-center mr-4 shrink-0 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <circle cx="7" cy="16.5" r="2.5" />
            <circle cx="17" cy="16.5" r="2.5" />
            <rect x="8" y="6.5" width="1.5" height="10" />
            <rect x="18" y="6.5" width="1.5" height="10" />
            <rect x="8" y="5" width="11.5" height="2" />
          </svg>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          {activeTab && (
            <input
              className="text-lg text-gray-800 dark:text-gray-100 font-medium bg-transparent border-none outline-none hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 px-1.5 py-0.5 rounded cursor-text w-64 max-w-full transition-colors duration-300"
              value={activeTab.title}
              onChange={(e) => updateTitle(activeTab.id, e.target.value)}
            />
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 print:hidden">
          <SaveBadge status={saveStatus} />

          <button onClick={handleOpen} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="Buka file .notangka">
            <FolderOpen size={16} />Buka
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm" title="Simpan sebagai file .notangka">
            <Save size={16} />Simpan
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" title="Toggle Dark Mode">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => window.print()} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">Print</button>
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-4 py-2 rounded font-medium hover:bg-emerald-700 transition-colors text-sm">Download PDF</button>
        </div>
      </div>

      <div className="flex items-center bg-blue-50 dark:bg-gray-950 border-b border-gray-300 dark:border-gray-700 px-2 overflow-x-auto overflow-y-hidden print:hidden shrink-0 transition-colors duration-300">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`group flex items-center max-w-[200px] cursor-pointer px-4 py-2 border-r border-gray-300 dark:border-gray-700 text-sm whitespace-nowrap transition-colors duration-300 ${
              activeTabId === tab.id
                ? 'bg-white dark:bg-gray-800 font-medium border-t-2 border-t-blue-600 border-b-white dark:border-b-gray-800 -mb-px relative z-10'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="truncate mr-2">{tab.title}</span>
            <button onClick={(e) => closeTab(tab.id, e)} className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </div>
        ))}
        <button onClick={addTab} className="p-1.5 ml-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-900 print:bg-white print:overflow-visible transition-colors duration-300">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`absolute print:relative inset-0 flex flex-col ${
              activeTabId === tab.id ? 'z-10 print:block' : 'opacity-0 pointer-events-none -z-10 print:hidden'
            }`}
          >
            <Editor
              initialContent={tab.content}
              onChange={(content) => updateContent(tab.id, content)}
              fontSize={fontSize}
              setFontSize={setFontSize}
              spacing={spacing}
              setSpacing={setSpacing}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  if (status === 'saving') return (
    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 animate-pulse select-none">
      <Loader2 size={12} className="animate-spin" />Menyimpan…
    </span>
  )
  if (status === 'saved') return (
    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 select-none">
      <CheckCircle size={12} />Tersimpan
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs text-red-500 select-none">⚠ Gagal simpan</span>
  )
}
