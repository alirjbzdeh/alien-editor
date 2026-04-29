<script setup lang="ts">
import { inject, watch, nextTick, computed, onMounted } from 'vue'
import type { EditorContext, TableBlock, TableCell, TextAlign } from '@/types'

const props = defineProps<{ block: TableBlock }>()
const editor = inject<EditorContext>('alienEditor')!

// ─── Cell refs — plain (non-reactive) 2D array ───────────────────────────────
// Intentionally NOT ref() — Vue's deep reactive proxy wrapping HTMLElements
// inside nested arrays causes unreliable reads. DOM refs don't need reactivity.
const cellRefs: (HTMLElement | null)[][] = []
let isUpdatingFromInput = false

function setCellRef(el: HTMLElement | null, row: number, col: number) {
  if (!cellRefs[row]) cellRefs[row] = []
  cellRefs[row][col] = el
  // Set content immediately when Vue binds the element — covers remount after tab switch
  if (el) {
    const html = props.block.rows[row]?.[col]?.html ?? ''
    if (el.innerHTML !== html) el.innerHTML = html
  }
}

// ─── Sync rows to DOM ─────────────────────────────────────────────────────────
function syncRowsToDom(rows: typeof props.block.rows) {
  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const el = cellRefs[ri]?.[ci]
      if (el && el.innerHTML !== cell.html) el.innerHTML = cell.html
    })
  })
}

// On external change (undo/redo, code-mode edits that replace blocks.value)
watch(
  () => props.block.rows,
  (newRows) => {
    if (isUpdatingFromInput) return
    nextTick(() => syncRowsToDom(newRows))
  },
  { deep: true },
)

// On mount — rAF ensures we run after Vue has fully committed and the browser
// has finished its own layout/paint pass, so cellRefs are all populated.
onMounted(() => {
  requestAnimationFrame(() => syncRowsToDom(props.block.rows))
})

// ─── Focus / blur ─────────────────────────────────────────────────────────────
let blurTimer: ReturnType<typeof setTimeout> | null = null

function onCellFocus(row: number, col: number) {
  if (blurTimer) clearTimeout(blurTimer)
  editor.activeBlockId.value = props.block.id
  editor.activeTableCell.value = { row, col }
}

function onCellBlur() {
  blurTimer = setTimeout(() => {
    editor.activeTableCell.value = null
  }, 150)
}

// ─── Input handling ───────────────────────────────────────────────────────────
function onCellInput(row: number, col: number, e: Event) {
  const el = e.target as HTMLElement
  const newRows = props.block.rows.map((r, ri) =>
    r.map((c, ci) => ri === row && ci === col ? { ...c, html: el.innerHTML } : c),
  )
  isUpdatingFromInput = true
  editor.updateBlock(props.block.id, { rows: newRows } as any)
  isUpdatingFromInput = false
}

// ─── Keyboard: Tab navigation ─────────────────────────────────────────────────
function onCellKeydown(row: number, col: number, e: KeyboardEvent) {
  if (e.key !== 'Tab') return
  e.preventDefault()

  const rowCount = props.block.rows.length
  const colCount = props.block.rows[0]?.length ?? 0

  let nextRow = row
  let nextCol = col

  if (e.shiftKey) {
    if (col > 0) {
      nextCol = col - 1
    } else if (row > 0) {
      nextRow = row - 1
      nextCol = colCount - 1
    } else {
      return
    }
  } else {
    if (col < colCount - 1) {
      nextCol = col + 1
    } else if (row < rowCount - 1) {
      nextRow = row + 1
      nextCol = 0
    } else {
      // Tab on last cell — add new row and focus its first cell
      addRow()
      nextTick(() => {
        cellRefs[rowCount]?.[0]?.focus()
      })
      return
    }
  }

  nextTick(() => {
    cellRefs[nextRow]?.[nextCol]?.focus()
  })
}

// ─── Row / column operations ──────────────────────────────────────────────────
function addRow() {
  const colCount = props.block.rows[0]?.length ?? 2
  const newRow: TableCell[] = Array.from({ length: colCount }, () => ({
    html: '',
    align: 'left' as TextAlign,
  }))
  editor.updateBlock(props.block.id, { rows: [...props.block.rows, newRow] } as any)
  editor.pushSnapshot()
}

function addCol() {
  const newRows = props.block.rows.map(row => [
    ...row,
    { html: '', align: 'left' as TextAlign },
  ])
  editor.updateBlock(props.block.id, { rows: newRows } as any)
  editor.pushSnapshot()
}

function deleteRow(rowIndex: number) {
  if (props.block.rows.length <= 1) return
  editor.pushSnapshot()
  const newRows = props.block.rows.filter((_, i) => i !== rowIndex)
  editor.updateBlock(props.block.id, { rows: newRows } as any)
}

function deleteCol(colIndex: number) {
  if ((props.block.rows[0]?.length ?? 0) <= 1) return
  editor.pushSnapshot()
  const newRows = props.block.rows.map(row => row.filter((_, i) => i !== colIndex))
  editor.updateBlock(props.block.id, { rows: newRows } as any)
}

function toggleHeader() {
  editor.pushSnapshot()
  editor.updateBlock(props.block.id, { hasHeader: !props.block.hasHeader } as any)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function alignClass(align: TextAlign): string {
  if (align === 'left') return ''
  return `text-${align}`
}

const bodyRows = computed(() =>
  props.block.hasHeader ? props.block.rows.slice(1) : props.block.rows,
)

// Real row index in the full rows array for body rows
function bodyRowIndex(bodyIndex: number): number {
  return props.block.hasHeader ? bodyIndex + 1 : bodyIndex
}

const colCount = computed(() => props.block.rows[0]?.length ?? 0)
</script>

<template>
  <div class="ae-table-wrapper relative w-full overflow-x-auto select-none" @mousedown="editor.activeBlockId.value = block.id">
    <!-- Top controls bar -->
    <div class="flex items-center gap-2 mb-1.5">
      <button
        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border transition-colors"
        :class="block.hasHeader
          ? 'border-gray-800 bg-gray-800 text-white'
          : 'border-gray-300 text-gray-500 hover:border-gray-400'"
        title="Toggle header row"
        @mousedown.prevent="toggleHeader"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <rect x="0" y="0" width="10" height="4" rx="1" />
          <rect x="0" y="5" width="10" height="2" rx="0.5" opacity="0.4" />
          <rect x="0" y="8" width="10" height="2" rx="0.5" opacity="0.4" />
        </svg>
        Header
      </button>
    </div>

    <!-- Table -->
    <div class="relative inline-block min-w-full">
      <table class="w-full border-collapse text-sm select-text">

        <!-- Header row -->
        <thead v-if="block.hasHeader && block.rows.length > 0">
          <tr class="group/row">
            <th
              v-for="(cell, ci) in block.rows[0]"
              :key="ci"
              :ref="(el) => setCellRef(el as HTMLElement, 0, ci)"
              contenteditable="true"
              spellcheck="true"
              class="ae-table-cell border border-gray-300 px-3 py-2 bg-gray-100 font-semibold outline-none min-w-[80px] min-h-[2em] relative group/cell"
              :class="alignClass(cell.align)"
              @focus="onCellFocus(0, ci)"
              @blur="onCellBlur"
              @input="onCellInput(0, ci, $event)"
              @keydown="onCellKeydown(0, ci, $event)"
              @mousedown="editor.saveSelection()"
              @mouseup="editor.saveSelection()"
              @keyup="editor.saveSelection()"
            >
              <!-- Delete column button (appears on header cell hover) -->
              <span
                v-if="colCount > 1"
                class="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity z-10 cursor-pointer"
                title="Delete column"
                contenteditable="false"
                @mousedown.prevent.stop="deleteCol(ci)"
              >
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 text-xs leading-none select-none">×</span>
              </span>
            </th>
            <!-- Delete row button for header -->
            <td class="border-0 pl-1 w-0 align-middle" contenteditable="false">
              <span
                v-if="block.rows.length > 1"
                class="opacity-0 group-hover/row:opacity-100 transition-opacity inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 text-xs cursor-pointer select-none"
                title="Delete row"
                @mousedown.prevent.stop="deleteRow(0)"
              >×</span>
            </td>
          </tr>
        </thead>

        <!-- Body rows -->
        <tbody>
          <tr
            v-for="(row, bi) in bodyRows"
            :key="bi"
            class="group/row"
          >
            <td
              v-for="(cell, ci) in row"
              :key="ci"
              :ref="(el) => setCellRef(el as HTMLElement, bodyRowIndex(bi), ci)"
              contenteditable="true"
              spellcheck="true"
              class="ae-table-cell border border-gray-300 px-3 py-2 outline-none min-w-[80px] min-h-[2em]"
              :class="alignClass(cell.align)"
              @focus="onCellFocus(bodyRowIndex(bi), ci)"
              @blur="onCellBlur"
              @input="onCellInput(bodyRowIndex(bi), ci, $event)"
              @keydown="onCellKeydown(bodyRowIndex(bi), ci, $event)"
              @mousedown="editor.saveSelection()"
              @mouseup="editor.saveSelection()"
              @keyup="editor.saveSelection()"
            />
            <!-- Delete row button -->
            <td class="border-0 pl-1 w-0 align-middle" contenteditable="false">
              <span
                v-if="block.rows.length > 1"
                class="opacity-0 group-hover/row:opacity-100 transition-opacity inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 text-xs cursor-pointer select-none"
                title="Delete row"
                @mousedown.prevent.stop="deleteRow(bodyRowIndex(bi))"
              >×</span>
            </td>
          </tr>
        </tbody>
      </table>

    </div>

    <!-- Bottom controls -->
    <div class="mt-1 flex items-center gap-2">
      <button
        class="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
        title="Add row"
        @mousedown.prevent="addRow"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <rect x="4" y="0" width="2" height="10" rx="1"/>
          <rect x="0" y="4" width="10" height="2" rx="1"/>
        </svg>
        Add row
      </button>
      <button
        class="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
        title="Add column"
        @mousedown.prevent="addCol"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <rect x="4" y="0" width="2" height="10" rx="1"/>
          <rect x="0" y="4" width="10" height="2" rx="1"/>
        </svg>
        Add column
      </button>
    </div>
  </div>
</template>

<style scoped>
.ae-table-cell:empty::before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}
</style>
