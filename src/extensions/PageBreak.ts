import { Node, mergeAttributes } from '@tiptap/core'

export interface PageBreakOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType
    }
  }
}

export const PageBreak = Node.create<PageBreakOptions>({
  name: 'pageBreak',
  group: 'block',

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-break', class: 'page-break-node' })]
  },

  addCommands() {
    return {
      setPageBreak: () => ({ chain }) => {
        return chain()
          .insertContent({ type: this.name })
          .run()
      },
    }
  },
})
