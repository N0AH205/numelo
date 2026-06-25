import { useEditor, EditorContent } from '@tiptap/react'
import { useRef, useEffect } from 'react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import { DotAbove, DotBelow, Fermata, Beam1, Beam2, SlashUp, SlashDown, Slur, Barlines } from '../extensions/NotAngkaMarks'
import { Toolbar } from './Toolbar'

// Disable markdown shortcuts — users type note numbers like 1> 1< which conflict
const CustomBold = Bold.extend({ addInputRules() { return [] }, addPasteRules() { return [] } })
const CustomItalic = Italic.extend({ addInputRules() { return [] }, addPasteRules() { return [] } })

// New paragraph should lose any centering/right-align set on the previous line
const ResetAlignmentOnEnter = Extension.create({
  name: 'resetAlignmentOnEnter',
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => editor.chain().splitBlock().unsetTextAlign().run(),
    }
  },
})

interface EditorProps {
  initialContent?: string
  onChange: (content: string) => void
  fontSize: number
  setFontSize: (size: number) => void
  spacing: number
  setSpacing: (spacing: number) => void
}

export default function Editor({
  initialContent = '<p></p>',
  onChange,
  fontSize,
  setFontSize,
  spacing,
  setSpacing,
}: EditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const syncPageWidth = (dom: HTMLElement) => {
    // scrollWidth covers all column widths + gaps in the paginated layout
    const pages = Math.max(1, Math.ceil(dom.scrollWidth / 834))
    if (wrapperRef.current) {
      const w = `calc(${pages} * 834px - 40px)`
      if (wrapperRef.current.style.width !== w) wrapperRef.current.style.width = w
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ bold: false, italic: false, strike: false, code: false }),
      CustomBold,
      CustomItalic,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      DotAbove, DotBelow, Fermata, Beam1, Beam2, SlashUp, SlashDown, Slur, Barlines,
      ResetAlignmentOnEnter,
    ],
    content: initialContent,
    parseOptions: { preserveWhitespace: 'full' },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      syncPageWidth(editor.view.dom)
    },
    editorProps: { attributes: { class: 'focus:outline-none' } },
  })

  useEffect(() => {
    if (!editor) return
    syncPageWidth(editor.view.dom)
    // Fonts can load after mount and shift dimensions
    const observer = new ResizeObserver(() => syncPageWidth(editor.view.dom))
    observer.observe(editor.view.dom)
    return () => observer.disconnect()
  }, [editor])

  return (
    <div className="flex flex-col h-full print:h-auto bg-gray-50 dark:bg-gray-900 print:bg-white relative transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 z-10 print:hidden shrink-0 sticky top-0 transition-colors duration-300">
        <Toolbar
          editor={editor}
          fontSize={fontSize}
          setFontSize={setFontSize}
          spacing={spacing}
          setSpacing={setSpacing}
        />
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto bg-gray-200 dark:bg-gray-900 print:bg-white transition-colors duration-300 p-8 print:p-0 custom-scrollbar text-center">
        <div
          ref={wrapperRef}
          className="editor-wrapper inline-block text-left print:w-auto print:block transition-all duration-300 relative isolate"
          style={{ width: '794px' }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
