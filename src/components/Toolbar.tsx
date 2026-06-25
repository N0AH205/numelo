import { Editor } from '@tiptap/react'

interface ToolbarProps {
  editor: Editor | null
  fontSize: number
  setFontSize: (size: number) => void
  spacing: number
  setSpacing: (spacing: number) => void
}

export const Toolbar = ({ editor, fontSize, setFontSize, spacing, setSpacing }: ToolbarProps) => {
  if (!editor) return null

  const btnIcon = (active: boolean) =>
    `p-1.5 rounded transition-all duration-200 ${active
      ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400'
      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`

  const btnText = (active: boolean) =>
    `px-3 py-1.5 rounded text-sm transition-all duration-200 ${active
      ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400'
      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`

  // Custom marks should only appear active when there's a real selection;
  // otherwise collapsed-cursor state bleeds through and confuses users.
  const isMarkActive = (mark: string) =>
    !editor.state.selection.empty && editor.isActive(mark)

  // Prevent toolbar clicks from stealing focus from the editor
  const noFocusSteal = (e: React.MouseEvent) => e.preventDefault()

  const sep = <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

  return (
    <div className="flex flex-wrap items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 transition-colors duration-300">
      <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-2 mr-1">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded overflow-hidden shadow-sm h-6">
          <button onMouseDown={noFocusSteal} onClick={() => { const s = Math.max(10, fontSize - 1); setFontSize(s); localStorage.setItem('notangka_font_size', String(s)) }} className="px-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">-</button>
          <span className="px-1 text-xs text-center min-w-[2rem] font-medium leading-none flex items-center justify-center">{fontSize}</span>
          <button onMouseDown={noFocusSteal} onClick={() => { const s = Math.min(32, fontSize + 1); setFontSize(s); localStorage.setItem('notangka_font_size', String(s)) }} className="px-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">+</button>
        </div>
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded overflow-hidden shadow-sm h-6">
          <button onMouseDown={noFocusSteal} onClick={() => { const s = Math.max(1.0, Math.round((spacing - 0.1) * 10) / 10); setSpacing(s); localStorage.setItem('notangka_spacing', String(s)) }} className="px-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">-</button>
          <span className="px-1 text-xs text-center min-w-[2.2rem] font-medium leading-none flex items-center justify-center">{spacing.toFixed(1)}</span>
          <button onMouseDown={noFocusSteal} onClick={() => { const s = Math.min(3.0, Math.round((spacing + 0.1) * 10) / 10); setSpacing(s); localStorage.setItem('notangka_spacing', String(s)) }} className="px-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">+</button>
        </div>
      </div>

      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleBold().run()} className={btnIcon(editor.isActive('bold'))} title="Bold">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/></svg>
      </button>
      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleItalic().run()} className={btnIcon(editor.isActive('italic'))} title="Italic">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>
      </button>
      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnIcon(editor.isActive('underline'))} title="Underline">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/></svg>
      </button>

      {sep}

      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnIcon(editor.isActive({ textAlign: 'left' }))} title="Align Left">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg>
      </button>
      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnIcon(editor.isActive({ textAlign: 'center' }))} title="Align Center">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/></svg>
      </button>
      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnIcon(editor.isActive({ textAlign: 'right' }))} title="Align Right">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/></svg>
      </button>

      {sep}

      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleMark('dotAbove').run()} className={btnText(isMarkActive('dotAbove'))}>1&gt; (Atas)</button>
      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleMark('dotBelow').run()} className={btnText(isMarkActive('dotBelow'))}>1&lt; (Bawah)</button>

      {sep}

      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleMark('beam1').run()} className={btnText(isMarkActive('beam1'))} title="Garis Nilai Atas (Blok teks lalu klik)">Garis Atas 1</button>
      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleMark('beam2').run()} className={btnText(isMarkActive('beam2'))} title="Garis Nilai Ganda (Blok teks lalu klik)">Garis Atas 2</button>

      {sep}

      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleMark('slashUp').run()} className={btnText(isMarkActive('slashUp'))}>1/ (Naik)</button>
      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleMark('slashDown').run()} className={btnText(isMarkActive('slashDown'))}>1\ (Turun)</button>

      {sep}

      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleMark('fermata').run()} className={btnText(isMarkActive('fermata'))}>1$ (Fermata)</button>
      <button onMouseDown={noFocusSteal} onClick={() => editor.chain().focus().toggleMark('slur').run()} className={btnText(isMarkActive('slur'))} title="Garis Lengkung (Blok teks lalu klik)">Slur (Lengkung)</button>
    </div>
  )
}
