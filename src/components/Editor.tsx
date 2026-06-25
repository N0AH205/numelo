import { useEditor, EditorContent } from '@tiptap/react'
import { useRef, useEffect } from 'react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'

const CustomBold = Bold.extend({
  addInputRules() { return [] },
  addPasteRules() { return [] },
})

const CustomItalic = Italic.extend({
  addInputRules() { return [] },
  addPasteRules() { return [] },
})
import { DotAbove, DotBelow, Fermata, Beam1, Beam2, SlashUp, SlashDown, Slur, Barlines } from '../extensions/NotAngkaMarks'
import { Toolbar } from './Toolbar'

const ResetAlignmentOnEnter = Extension.create({
  name: 'resetAlignmentOnEnter',
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        return editor.chain().splitBlock().unsetTextAlign().run()
      },
    }
  },
})

interface EditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  spacing: number;
  setSpacing: (spacing: number) => void;
}

export default function Editor({ 
  initialContent = '<p></p>',
  onChange,
  fontSize,
  setFontSize,
  spacing,
  setSpacing
}: EditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const updatePageCount = (dom: HTMLElement) => {
    // scrollWidth matches the full width of all columns and gaps
    const pages = Math.max(1, Math.ceil(dom.scrollWidth / 834));
    
    if (wrapperRef.current) {
      const newWidth = `calc(${pages} * 834px - 40px)`;
      if (wrapperRef.current.style.width !== newWidth) {
        wrapperRef.current.style.width = newWidth;
      }
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        code: false,
      }),
      CustomBold,
      CustomItalic,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      DotAbove,
      DotBelow,
      Fermata,
      Beam1,
      Beam2,
      SlashUp,
      SlashDown,
      Slur,
      Barlines,
      ResetAlignmentOnEnter,
    ],
    content: initialContent,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      updatePageCount(editor.view.dom)
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
  })

  // Set initial page count on mount
  useEffect(() => {
    if (editor) {
      updatePageCount(editor.view.dom)
      
      // Also observe resize just in case fonts load late and change dimensions
      const observer = new ResizeObserver(() => updatePageCount(editor.view.dom));
      observer.observe(editor.view.dom);
      return () => observer.disconnect();
    }
  }, [editor])

  const scrollRef = useRef<HTMLDivElement>(null)

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

      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto bg-gray-200 dark:bg-gray-900 print:bg-white transition-colors duration-300 p-8 print:p-0 custom-scrollbar text-center"
      >
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
