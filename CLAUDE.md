# alien-editor — Claude Code Guide

A Vue 3 block-based rich text editor published as an npm library.
**Stack:** Vue 3 + TypeScript + Tailwind CSS + Vite. No external editor library — uses native `contenteditable` + Range API.

---

## Commands

```bash
npm run dev          # local dev server
npm run type-check   # vue-tsc --noEmit (run this after any type changes)
npm run build        # type-check + vite build (both ESM and Nuxt targets)
```

---

## Project Structure

```
src/
├── components/
│   ├── AlienEditor.vue          # Root component — owns all state, provides context
│   ├── blocks/
│   │   ├── BlockList.vue        # Routes block.type → component (v-if chain)
│   │   ├── BlockWrapper.vue     # Drag handle + add/delete buttons for every block
│   │   ├── TextBlock.vue        # paragraph, blockquote
│   │   ├── HeadingBlock.vue     # heading (h1–h6)
│   │   ├── ListBlock.vue        # ordered-list, unordered-list
│   │   ├── CodeBlock.vue        # code (textarea + language selector)
│   │   ├── ImageBlock.vue       # image (upload / URL / media provider)
│   │   ├── VideoBlock.vue       # video
│   │   ├── ButtonBlock.vue      # button (label + href)
│   │   ├── DividerBlock.vue     # hr
│   │   ├── ModuleBlock.vue      # raw HTML module
│   │   └── TableBlock.vue       # table (contenteditable cells, header toggle)
│   ├── toolbar/
│   │   ├── AlienToolbar.vue     # Main toolbar — all formatting, block insert, mode toggle
│   │   ├── ToolbarButton.vue    # Reusable toolbar button (mousedown.prevent to keep focus)
│   │   ├── ColorPicker.vue      # Text color picker
│   │   ├── ModuleDropdown.vue   # Custom HTML module inserter
│   │   ├── ModeToggle.vue       # Edit / Code / Preview switcher
│   │   └── SearchBar.vue        # Find bar (Ctrl+F)
│   └── modals/
│       ├── LinkModal.vue
│       ├── ImageUrlModal.vue
│       └── MediaInsertModal.vue
├── composables/
│   ├── useEditorState.ts        # Core refs: blocks, mode, activeBlockId, savedRange, activeTableCell
│   ├── useBlocks.ts             # CRUD: addBlockAfter/At, removeBlock, moveBlock, updateBlock, replaceBlock
│   ├── useHistory.ts            # Undo/redo snapshot stack (max 100)
│   ├── useSelection.ts          # saveSelection / restoreSelection via Range API
│   ├── useFormatting.ts         # Bold, italic, underline, strike, font size/weight, color, link
│   ├── useSerializer.ts         # Block[] → HTML string
│   ├── useParser.ts             # HTML string → Block[]
│   ├── useCodeMode.ts           # Code tab logic + bidirectional cursor mapping
│   ├── useDragDrop.ts           # Drag-and-drop block reordering
│   ├── useTypingSnapshot.ts     # Debounced undo snapshot (1s burst grouping while typing)
│   ├── useKeyboardShortcuts.ts  # Global: Ctrl+Z/Y (undo/redo), Ctrl+F (search)
│   └── useSearch.ts             # Find in editor (CSS Custom Highlight API + textarea selection)
├── types/
│   └── index.ts                 # All TypeScript interfaces (Block union, EditorContext, etc.)
└── utils/
    ├── tailwindMap.ts           # Font size / weight / heading Tailwind class maps
    └── selection.ts             # Low-level selection helpers
```

---

## How the Editor Works

### State & Context

`AlienEditor.vue` is the single owner of all state. It calls every composable and **provides** a single `EditorContext` object (via `provide('alienEditor', ...)`) that every child component **injects**.

```typescript
const editor = inject<EditorContext>('alienEditor')!
```

`EditorContext` (defined in `src/types/index.ts`) contains:
- `blocks` — the full block array ref
- `mode` — `'edit' | 'code' | 'preview'`
- `activeBlockId` — which block has focus
- `activeTableCell` — `{ row, col } | null` for table cells
- `savedRange` — last known selection Range (for toolbar formatting)
- `updateBlock`, `addBlockAfter`, `addBlockAt`, `removeBlock`, `replaceBlock`, `moveBlock`
- `pushSnapshot`, `undo`, `redo`, `canUndo`, `canRedo`
- `saveSelection`, `restoreSelection`
- `openSearch` — opens the search bar
- All modal state refs and callbacks

### Data Flow

```
User types → block component onInput
  → editor.updateBlock(id, { html: el.innerHTML })
    → blocks.value mutated reactively
      → serializedHtml computed → emit('update:modelValue', html)
```

### Three Editor Modes

| Mode | What renders | Editable |
|------|-------------|---------|
| `edit` | `BlockList` with all block components | Yes (contenteditable) |
| `code` | Raw `<textarea>` showing serialized HTML | Yes (raw HTML) |
| `preview` | `v-html` of serialized HTML | No |

Switching modes triggers `useCodeMode` which handles bidirectional cursor position mapping.

---

## Block System

### Block Data Shapes

Every block has `{ id: string, type: BlockType }`. Extra fields by type:

| Type | Extra fields |
|------|-------------|
| `paragraph`, `blockquote` | `html`, `align`, `classes` |
| `heading` | `html`, `align`, `classes`, `level` (1–6) |
| `ordered-list`, `unordered-list` | `items: string[]` (each item is HTML) |
| `code` | `code`, `language` |
| `image` | `src`, `alt`, `classes` |
| `video` | `src`, `classes` |
| `button` | `label`, `href`, `classes` |
| `divider` | `classes` |
| `module` | `html` (raw outer HTML, preserved as-is) |
| `table` | `rows: TableCell[][]`, `hasHeader: boolean` |

`TableCell` = `{ html: string, align: TextAlign }`

### Serialized HTML Tags

| Block type | HTML output |
|------------|------------|
| paragraph | `<p class="...">` |
| blockquote | `<blockquote class="border-l-4 border-gray-300 pl-4 italic ...">` |
| heading | `<h1>`–`<h6>` |
| ordered-list | `<ol class="list-decimal list-inside"><li>...</li></ol>` |
| unordered-list | `<ul class="list-disc list-inside"><li>...</li></ul>` |
| code | `<pre class="bg-gray-900 ..."><code class="language-xxx">` |
| image | `<img src="..." alt="..." />` |
| video | `<video src="..." controls class="w-full">` |
| button | `<a href="..." data-alien-block="button" class="...">` |
| divider | `<hr class="border-t border-gray-300 my-4 ...">` |
| module | raw HTML string (unchanged) |
| table | `<table class="w-full border-collapse"><thead>/<tbody>` |

---

## How to Add a New Block Type

Follow these 9 steps — in this order:

### 1. `src/types/index.ts`
Add to `BlockType` union and create the interface:
```typescript
export type BlockType = ... | 'my-block'

export interface MyBlock extends BaseBlock {
  type: 'my-block'
  // ...fields
}

export type Block = ... | MyBlock
```

### 2. `src/composables/useBlocks.ts`
Add a `case 'my-block':` to `createDefaultBlock()` with sensible defaults.

### 3. `src/composables/useParser.ts`
Add detection inside the `switch(true)` loop (look for the existing `case tag === 'table':` pattern):
```typescript
case tag === 'my-tag': {
  blocks.push({ id: pid(), type: 'my-block', /* parse from el */ })
  break
}
```

### 4. `src/composables/useSerializer.ts`
Add `case 'my-block':` to `serializeBlock()` returning the HTML string.

### 5. `src/components/blocks/MyBlock.vue`
Create the component. Pattern to follow based on content type:
- **Single contenteditable** (like paragraph): copy `TextBlock.vue`
- **Array of contenteditables** (like list items or table cells): copy `ListBlock.vue` — key patterns: `itemRefs` array, `isUpdatingFromInput` flag, `watch(block.items)` to sync external changes, `setItemRef(el, index)` callback
- **Non-editable config UI** (like image, button): copy `ImageBlock.vue` or `ButtonBlock.vue`

All block components must:
- `defineProps<{ block: MyBlock }>()`
- `inject<EditorContext>('alienEditor')!`
- Call `editor.activeBlockId.value = block.id` on focus
- Call `editor.updateBlock(block.id, patch)` on any data change
- Use `editor.saveSelection()` on mousedown/keyup for toolbar formatting to work

### 6. `src/components/blocks/BlockList.vue`
Import and add to the routing chain:
```vue
<MyBlock v-else-if="block.type === 'my-block'" :block="block as any" />
```

### 7. `src/components/toolbar/AlienToolbar.vue`
Add to the `blockTypes` array:
```typescript
{ type: 'my-block', label: 'My Block' }
```
If the block needs special toolbar behavior (e.g. per-cell alignment like TableBlock), modify `setAlign()` and `currentAlign` in the toolbar.

### 8. Run type check
```bash
npm run type-check
```

### 9. Verify end-to-end
- Insert via `+ Block → My Block`
- Edit content
- Switch to Code mode — check HTML is correct
- Edit HTML in Code mode, switch back — check re-parse works
- Undo/Redo works

---

## Key Patterns & Conventions

### Toolbar buttons use `mousedown.prevent`
All toolbar buttons use `@mousedown.prevent` (not `@click`) to prevent the editor from losing focus/selection before the action fires. This is critical — changing to `@click` breaks formatting.

### `isUpdatingFromInput` flag
Components with contenteditable use this flag to break the reactivity loop:
```
user types → updateBlock() → watch fires → would overwrite DOM → isUpdatingFromInput prevents it
```

### History / undo snapshots
- `editor.updateBlock()` does **not** auto-snapshot (it's for fast per-keystroke updates)
- `editor.pushSnapshot()` is called explicitly before destructive mutations (delete row, add col, etc.)
- `useTypingSnapshot` provides 1-second debounced snapshots during typing

### Cell/selection state for formatting
For the toolbar alignment buttons to work on a block, the block component must:
1. Call `editor.activeBlockId.value = block.id` on focus
2. Call `editor.saveSelection()` on mousedown and keyup

For **table cells** specifically, also set `editor.activeTableCell.value = { row, col }` on focus and clear it (with 150ms delay) on blur — the delay allows toolbar clicks to read the value before it clears.

### Scoped CSS for contenteditable placeholders
Empty contenteditable elements show placeholder text via CSS `::before`. These must be **global** (not scoped) because contenteditable doesn't accept Vue's scoped attribute. They live in `AlienEditor.vue`'s non-scoped `<style>` block.

### CSS Custom Highlight API (search)
The search feature uses `CSS.highlights.set('ae-search', new Highlight(...ranges))` for non-destructive highlighting in edit mode. The corresponding styles are in `AlienEditor.vue`:
```css
::highlight(ae-search) { background-color: rgba(253, 224, 71, 0.7); }
::highlight(ae-search-current) { background-color: rgba(249, 115, 22, 0.85); color: #fff; }
```
Feature-detected at runtime — gracefully degrades if browser doesn't support it.

---

## EditorContext Interface (full reference)

Defined in `src/types/index.ts`. Everything a block/toolbar component needs:

```typescript
interface EditorContext {
  // State
  blocks: Ref<Block[]>
  mode: Ref<'edit' | 'code' | 'preview'>
  activeBlockId: Ref<string | null>
  activeTableCell: Ref<{ row: number; col: number } | null>
  savedRange: Ref<Range | null>

  // Config (from props)
  colors: ColorOption[]
  modules: ModuleOption[]
  placeholder: string
  mediaProvider?: MediaProvider

  // Block operations
  updateBlock(id: string, patch: Partial<Block>): void
  replaceBlock(id: string, type: BlockType, overrides?: Partial<Block>): string
  addBlockAfter(afterId: string, type: BlockType, overrides?: Partial<Block>): string
  addBlockAt(index: number, type: BlockType, overrides?: Partial<Block>): string
  removeBlock(id: string): void
  moveBlock(fromId: string, toId: string): void

  // History
  pushSnapshot(): void
  undo(): void
  redo(): void
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>

  // Selection
  saveSelection(): void
  restoreSelection(): void

  // Search
  openSearch(): void

  // Modals
  showLinkModal: Ref<boolean>
  showImageUrlModal: Ref<boolean>
  showMediaInsertModal: Ref<boolean>
  linkModalCallback: Ref<((href: string, text: string) => void) | null>
  imageUrlCallback: Ref<((url: string) => void) | null>
  mediaInsertCallback: Ref<((html: string) => void) | null>
  onUpload(file: File): void
}
```

---

## Current Features (v1.3.0+)

- **12 block types:** paragraph, heading (h1–h6), blockquote, ordered/unordered list, code, image, video, button, divider, module, **table**
- **Rich text formatting:** bold, italic, underline, strikethrough, font size, font weight, text color, link
- **Text alignment:** left, center, right, justify (per block; per cell for tables)
- **Table:** contenteditable cells with rich text, toggleable header row, add/delete rows and columns, Tab navigation, per-cell alignment
- **Drag-and-drop** block reordering
- **Undo/redo** (100-snapshot history, 1s typing burst debounce)
- **Three modes:** Edit, Code (raw HTML textarea), Preview (read-only)
- **Search (Ctrl+F / Cmd+F):** CSS Custom Highlight API in edit mode, textarea selection in code mode
- **Media provider API:** external gallery/upload integration
- **RTL support** via `rtl` prop
- **Nuxt support** via separate build target
