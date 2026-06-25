'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Editor from './Editor'
import { Plus, X, Moon, Sun, Save, FolderOpen, CheckCircle, Loader2 } from 'lucide-react'
import { downloadNotAngka, openNotAngkaFile, NotAngkaParseError } from '../lib/fileFormat'
import { autosaveAll, loadAutosave } from '../lib/autosave'

export type TabData = {
  id: string;
  title: string;
  content: string;
}

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const DEFAULT_CONTENT = '<p></p>'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Debounce delay: save N ms after the last keystroke */
const DEBOUNCE_MS = 1500
/** Periodic flush: also save every N ms regardless of changes */
const PERIODIC_MS = 30_000

export default function Workspace() {
  const [tabs, setTabs] = useState<TabData[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [spacing, setSpacing] = useState(1.8)
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle')

  // Keep a ref to tabs + settings for the periodic flush (avoids stale closures)
  const stateRef = useRef({ tabs, activeTabId, isDark, fontSize, spacing })
  useEffect(() => {
    stateRef.current = { tabs, activeTabId, isDark, fontSize, spacing }
  }, [tabs, activeTabId, isDark, fontSize, spacing])

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const buildPayload = useCallback(
    (t: TabData[], aid: string | null, fs: number, sp: number, dark: boolean) => ({
      tabs: t,
      activeTabId: aid,
      fontSize: fs,
      spacing: sp,
      theme: dark ? 'dark' : 'light',
    }),
    [],
  )

  const doSave = useCallback(
    async (t: TabData[], aid: string | null, fs: number, sp: number, dark: boolean) => {
      setAutosaveStatus('saving')
      try {
        await autosaveAll(buildPayload(t, aid, fs, sp, dark))
        setAutosaveStatus('saved')
        // Reset to idle after 2 s
        setTimeout(() => setAutosaveStatus('idle'), 2000)
      } catch {
        setAutosaveStatus('error')
      }
    },
    [buildPayload],
  )

  const createDefaultTab = () => {
    const newId = Date.now().toString()
    setTabs([{ id: newId, title: 'Lagu Baru 1', content: DEFAULT_CONTENT }])
    setActiveTabId(newId)
  }

  // ─── Load from storage on mount ──────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const saved = await loadAutosave() as {
        tabs?: TabData[]
        activeTabId?: string
        fontSize?: number
        spacing?: number
        theme?: string
      } | null

      if (saved) {
        if (saved.theme === 'dark') setIsDark(true)
        if (typeof saved.fontSize === 'number') setFontSize(saved.fontSize)
        if (typeof saved.spacing === 'number') setSpacing(saved.spacing)

        if (saved.tabs && saved.tabs.length > 0) {
          setTabs(saved.tabs)
          setActiveTabId(saved.activeTabId ?? saved.tabs[0].id)
        } else {
          createDefaultTab()
        }
      } else {
        createDefaultTab()
      }

      setIsLoaded(true)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Dark mode side-effect ────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded) return
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark, isLoaded])

  // ─── Debounced autosave ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded) return
    const timer = setTimeout(() => {
      doSave(tabs, activeTabId, fontSize, spacing, isDark)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [tabs, activeTabId, fontSize, spacing, isDark, isLoaded, doSave])

  // ─── Periodic autosave (every 30 s) ──────────────────────────────────────

  useEffect(() => {
    if (!isLoaded) return
    const interval = setInterval(() => {
      const { tabs: t, activeTabId: aid, fontSize: fs, spacing: sp, isDark: dark } = stateRef.current
      doSave(t, aid, fs, sp, dark)
    }, PERIODIC_MS)
    return () => clearInterval(interval)
  }, [isLoaded, doSave])

  // ─── Tab management ───────────────────────────────────────────────────────

  const handleAddTab = () => {
    const newId = Date.now().toString()
    setTabs(prev => [...prev, { id: newId, title: `Lagu Baru ${prev.length + 1}`, content: DEFAULT_CONTENT }])
    setActiveTabId(newId)
  }

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newTabs = tabs.filter(t => t.id !== id)
    if (newTabs.length === 0) {
      const newId = Date.now().toString()
      setTabs([{ id: newId, title: 'Lagu Baru 1', content: DEFAULT_CONTENT }])
      setActiveTabId(newId)
    } else {
      setTabs(newTabs)
      if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id)
      }
    }
  }

  const updateTabContent = useCallback((id: string, newContent: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, content: newContent } : t))
  }, [])

  const updateTabTitle = (id: string, newTitle: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t))
  }

  // ─── File operations ──────────────────────────────────────────────────────

  const handleSave = () => {
    if (!activeTab) return
    downloadNotAngka(activeTab.title, activeTab.content, {
      fontSize,
      spacing,
      theme: isDark ? 'dark' : 'light',
    })
  }

  const handleOpen = async () => {
    try {
      const data = await openNotAngkaFile()
      if (!data) return // user cancelled

      // Apply settings from the file
      setFontSize(data.settings.fontSize)
      setSpacing(data.settings.spacing)
      setIsDark(data.settings.theme === 'dark')

      // Open as a new tab
      const newId = Date.now().toString()
      setTabs(prev => [...prev, { id: newId, title: data.title, content: data.content }])
      setActiveTabId(newId)
    } catch (err) {
      if (err instanceof NotAngkaParseError) {
        alert(`Gagal membuka file:\n${err.message}`)
      } else {
        alert('Terjadi kesalahan saat membuka file.')
      }
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 px-4 py-2 flex items-center z-10 border-b border-gray-300 dark:border-gray-700 transition-colors duration-300 print:hidden">
        {/* Logo */}
        <div className="w-10 h-10 bg-blue-600 rounded text-white flex items-center justify-center mr-4 shrink-0 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <circle cx="7" cy="16.5" r="2.5" />
            <circle cx="17" cy="16.5" r="2.5" />
            <rect x="8" y="6.5" width="1.5" height="10" />
            <rect x="18" y="6.5" width="1.5" height="10" />
            <rect x="8" y="5" width="11.5" height="2" />
          </svg>
        </div>

        {/* Title input */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {activeTab && (
            <input
              className="text-lg text-gray-800 dark:text-gray-100 font-medium bg-transparent border-none outline-none hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 px-1.5 py-0.5 rounded cursor-text w-64 max-w-full transition-colors duration-300"
              value={activeTab.title}
              onChange={(e) => updateTabTitle(activeTab.id, e.target.value)}
            />
          )}
        </div>

        {/* Right-side actions */}
        <div className="ml-auto flex items-center gap-2 print:hidden">

          {/* Autosave status badge */}
          <AutosaveBadge status={autosaveStatus} />

          {/* Open */}
          <button
            onClick={handleOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Buka file .notangka"
          >
            <FolderOpen size={16} />
            Buka
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
            title="Simpan sebagai file .notangka"
          >
            <Save size={16} />
            Simpan
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Print / PDF */}
          <button
            onClick={() => window.print()}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Print
          </button>
          <button
            onClick={() => window.print()}
            className="bg-emerald-600 text-white px-4 py-2 rounded font-medium hover:bg-emerald-700 transition-colors text-sm"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Tabs Bar ───────────────────────────────────────────────────── */}
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
            <button
              onClick={(e) => handleCloseTab(tab.id, e)}
              className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={handleAddTab}
          className="p-1.5 ml-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* ── Editor Area ────────────────────────────────────────────────── */}
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
              onChange={(content) => updateTabContent(tab.id, content)}
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

// ─── Autosave Status Badge ────────────────────────────────────────────────────

function AutosaveBadge({ status }: { status: AutosaveStatus }) {
  if (status === 'idle') return null

  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 animate-pulse select-none">
        <Loader2 size={12} className="animate-spin" />
        Menyimpan…
      </span>
    )
  }

  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 select-none">
        <CheckCircle size={12} />
        Tersimpan
      </span>
    )
  }

  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-red-500 select-none">
        ⚠ Gagal simpan
      </span>
    )
  }

  return null
}
