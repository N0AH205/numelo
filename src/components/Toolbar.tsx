import { Editor } from '@tiptap/react'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface ToolbarProps {
  editor: Editor | null;
  fontSize: number;
  setFontSize: (size: number) => void;
  spacing: number;
  setSpacing: (spacing: number) => void;
}

export const Toolbar = ({ editor, fontSize, setFontSize, spacing, setSpacing }: ToolbarProps) => {
  if (!editor) return null

  const iconBtnClass = (isActive: boolean) =>
    `p-1.5 rounded transition-all duration-200 ${isActive
      ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400'
      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`

  const textBtnClass = (isActive: boolean) =>
    `px-3 py-1.5 rounded text-sm transition-all duration-200 ${isActive
      ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400'
      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`

  const isCustomMarkActive = (mark: string) => {
    // Only light up custom marks if there is an actual selection,
    // otherwise the user gets confused thinking they have to turn it off.
    if (editor.state.selection.empty) return false;
    return editor.isActive(mark);
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 transition-colors duration-300">
      {/* Settings inline with toolbar */}
      <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-2 mr-1">
        <div className="flex flex-col items-center">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded overflow-hidden shadow-sm h-6">
            <button onMouseDown={handleMouseDown} onClick={() => {
              const newSize = Math.max(10, fontSize - 1);
              setFontSize(newSize);
              localStorage.setItem('notangka_font_size', newSize.toString());
            }} className="px-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">-</button>
            <span className="px-1 text-xs text-center min-w-[2rem] font-medium leading-none flex items-center justify-center">{fontSize}</span>
            <button onMouseDown={handleMouseDown} onClick={() => {
              const newSize = Math.min(32, fontSize + 1);
              setFontSize(newSize);
              localStorage.setItem('notangka_font_size', newSize.toString());
            }} className="px-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">+</button>
          </div>
        </div>
        <div className="flex flex-col items-center">

          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded overflow-hidden shadow-sm h-6">
            <button onMouseDown={handleMouseDown} onClick={() => {
              const newSpacing = Math.max(1.0, Math.round((spacing - 0.1) * 10) / 10);
              setSpacing(newSpacing);
              localStorage.setItem('notangka_spacing', newSpacing.toString());
            }} className="px-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">-</button>
            <span className="px-1 text-xs text-center min-w-[2.2rem] font-medium leading-none flex items-center justify-center">{spacing.toFixed(1)}</span>
            <button onMouseDown={handleMouseDown} onClick={() => {
              const newSpacing = Math.min(3.0, Math.round((spacing + 0.1) * 10) / 10);
              setSpacing(newSpacing);
              localStorage.setItem('notangka_spacing', newSpacing.toString());
            }} className="px-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">+</button>
          </div>
        </div>
      </div>

      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleBold().run()} className={iconBtnClass(editor.isActive('bold'))} title="Bold"><Bold size={18} /></button>
      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleItalic().run()} className={iconBtnClass(editor.isActive('italic'))} title="Italic"><Italic size={18} /></button>
      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleUnderline().run()} className={iconBtnClass(editor.isActive('underline'))} title="Underline"><Underline size={18} /></button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().setTextAlign('left').run()} className={iconBtnClass(editor.isActive({ textAlign: 'left' }))} title="Align Left"><AlignLeft size={18} /></button>
      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().setTextAlign('center').run()} className={iconBtnClass(editor.isActive({ textAlign: 'center' }))} title="Align Center"><AlignCenter size={18} /></button>
      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().setTextAlign('right').run()} className={iconBtnClass(editor.isActive({ textAlign: 'right' }))} title="Align Right"><AlignRight size={18} /></button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {/* Custom Not Angka Buttons */}
      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleMark('dotAbove').run()} className={textBtnClass(isCustomMarkActive('dotAbove'))}>1&gt; (Atas)</button>
      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleMark('dotBelow').run()} className={textBtnClass(isCustomMarkActive('dotBelow'))}>1&lt; (Bawah)</button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleMark('beam1').run()} className={textBtnClass(isCustomMarkActive('beam1'))} title="Garis Nilai Atas (Blok teks lalu klik)">Garis Atas 1</button>
      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleMark('beam2').run()} className={textBtnClass(isCustomMarkActive('beam2'))} title="Garis Nilai Ganda (Blok teks lalu klik)">Garis Atas 2</button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleMark('slashUp').run()} className={textBtnClass(isCustomMarkActive('slashUp'))}>1/ (Naik)</button>
      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleMark('slashDown').run()} className={textBtnClass(isCustomMarkActive('slashDown'))}>1\ (Turun)</button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleMark('fermata').run()} className={textBtnClass(isCustomMarkActive('fermata'))}>1$ (Fermata)</button>
      <button onMouseDown={handleMouseDown} onClick={() => editor.chain().focus().toggleMark('slur').run()} className={textBtnClass(isCustomMarkActive('slur'))} title="Garis Lengkung (Blok teks lalu klik)">Slur (Lengkung)</button>
    </div>
  )
}
