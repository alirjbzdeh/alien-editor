// ─── Prop types ─────────────────────────────────────────────────────────────

export interface ColorOption {
  title: string
  key: string
  class: string // e.g. "text-rose-500"
}

export interface ModuleOption {
  title: string
  key: string
  module: string // raw HTML string
}

// ─── Block types ─────────────────────────────────────────────────────────────

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'image'
  | 'video'
  | 'code'
  | 'divider'
  | 'button'
  | 'module'
  | 'blockquote'
  | 'ordered-list'
  | 'unordered-list'

export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface BaseBlock {
  id: string
  type: BlockType
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph'
  html: string
  align: TextAlign
  classes: string[]
}

export interface BlockquoteBlock extends BaseBlock {
  type: 'blockquote'
  html: string
  align: TextAlign
  classes: string[]
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading'
  level: HeadingLevel
  html: string
  align: TextAlign
  classes: string[]
}

export interface OrderedListBlock extends BaseBlock {
  type: 'ordered-list'
  items: string[]
}

export interface UnorderedListBlock extends BaseBlock {
  type: 'unordered-list'
  items: string[]
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  src: string
  alt: string
  classes: string[]
}

export interface VideoBlock extends BaseBlock {
  type: 'video'
  src: string
  classes: string[]
}

export interface CodeBlock extends BaseBlock {
  type: 'code'
  code: string
  language: string
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
  classes: string[]
}

export interface ButtonBlock extends BaseBlock {
  type: 'button'
  label: string
  href: string
  classes: string[]
}

export interface ModuleBlock extends BaseBlock {
  type: 'module'
  html: string
}

export type Block =
  | ParagraphBlock
  | BlockquoteBlock
  | HeadingBlock
  | OrderedListBlock
  | UnorderedListBlock
  | ImageBlock
  | VideoBlock
  | CodeBlock
  | DividerBlock
  | ButtonBlock
  | ModuleBlock

// ─── Editor state ────────────────────────────────────────────────────────────

export type EditorMode = 'edit' | 'code' | 'preview'

export interface HistorySnapshot {
  blocks: Block[]
  timestamp: number
}

export interface DragState {
  draggedId: string | null
  overId: string | null
}

// ─── Editor context (provided/injected) ──────────────────────────────────────

export interface EditorContext {
  blocks: import('vue').Ref<Block[]>
  mode: import('vue').Ref<EditorMode>
  activeBlockId: import('vue').Ref<string | null>
  savedRange: import('vue').Ref<Range | null>
  colors: ColorOption[]
  modules: ModuleOption[]
  placeholder: string
  pushSnapshot: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  updateBlock: (id: string, patch: Partial<Block>) => void
  addBlockAfter: (afterId: string, type: BlockType, overrides?: Partial<Block>) => string
  addBlockAt: (index: number, type: BlockType, overrides?: Partial<Block>) => string
  removeBlock: (id: string) => void
  moveBlock: (fromId: string, toId: string) => void
  saveSelection: () => void
  restoreSelection: () => void
  onUpload: (file: File) => void
  showLinkModal: import('vue').Ref<boolean>
  showImageUrlModal: import('vue').Ref<boolean>
  linkModalCallback: import('vue').Ref<((href: string, text: string) => void) | null>
  imageUrlCallback: import('vue').Ref<((url: string) => void) | null>
  dragState: import('vue').Ref<DragState>
  onDragStart: (blockId: string, event: DragEvent) => void
  onDragOver: (blockId: string, event: DragEvent) => void
  onDragLeave: () => void
  onDrop: (targetId: string) => void
  onDragEnd: () => void
}
