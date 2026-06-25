import { Mark, mergeAttributes, markInputRule, Extension, textInputRule } from '@tiptap/core'

export const DotAbove = Mark.create({
  name: 'dotAbove',
  inclusive: false,
  excludes: 'dotBelow',
  parseHTML() { return [{ tag: 'span.na-dot-above' }] },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'na-dot-above na-number' }), 0]
  },
  addInputRules() {
    return [markInputRule({ find: /([1-7])>/, type: this.type })]
  },
})

export const DotBelow = Mark.create({
  name: 'dotBelow',
  inclusive: false,
  excludes: 'dotAbove',
  parseHTML() { return [{ tag: 'span.na-dot-below' }] },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'na-dot-below na-number' }), 0]
  },
  addInputRules() {
    return [markInputRule({ find: /([1-7])</, type: this.type })]
  },
})

export const Fermata = Mark.create({
  name: 'fermata',
  inclusive: false,
  parseHTML() { return [{ tag: 'span.na-fermata' }] },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'na-fermata na-number' }), 0]
  },
  addInputRules() {
    return [markInputRule({ find: /([1-7])\$/, type: this.type })]
  },
})

export const Beam1 = Mark.create({
  name: 'beam1',
  inclusive: false,
  parseHTML() { return [{ tag: 'span.na-beam-1' }] },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'na-beam-1' }), 0]
  },
})

export const Beam2 = Mark.create({
  name: 'beam2',
  inclusive: false,
  parseHTML() { return [{ tag: 'span.na-beam-2' }] },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'na-beam-2' }), 0]
  },
})

export const SlashUp = Mark.create({
  name: 'slashUp',
  inclusive: false,
  excludes: 'slashDown',
  parseHTML() { return [{ tag: 'span.na-slash-up' }] },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'na-slash-up na-number' }), 0]
  },
  addInputRules() {
    return [markInputRule({ find: /([1-7])\//, type: this.type })]
  },
})

export const SlashDown = Mark.create({
  name: 'slashDown',
  inclusive: false,
  excludes: 'slashUp',
  parseHTML() { return [{ tag: 'span.na-slash-down' }] },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'na-slash-down na-number' }), 0]
  },
  addInputRules() {
    return [markInputRule({ find: /([1-7])\\/, type: this.type })]
  },
})

export const Slur = Mark.create({
  name: 'slur',
  inclusive: false,
  parseHTML() { return [{ tag: 'span.na-slur' }] },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'na-slur' }), 0]
  },
})

export const Barlines = Extension.create({
  name: 'barlines',
  addInputRules() {
    return [
      textInputRule({ find: /{/, replace: '||' }),
      textInputRule({ find: /}/, replace: '|]' }),
      // | and : are left as-is — they already represent single bar and repeat
    ]
  },
})
