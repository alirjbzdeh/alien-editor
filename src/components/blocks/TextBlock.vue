<script setup lang="ts">
import { ref, onMounted, watch, inject, nextTick } from 'vue'
import type { ParagraphBlock, BlockquoteBlock, EditorContext } from '@/types'

const props = defineProps<{ block: ParagraphBlock | BlockquoteBlock }>()

const editor = inject<EditorContext>('alienEditor')!
const el = ref<HTMLElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let isUpdatingFromModel = false

onMounted(() => {
  if (el.value && el.value.innerHTML !== props.block.html) {
    el.value.innerHTML = props.block.html
  }
})

// Sync model → DOM only on external changes (undo/redo), not from typing
watch(
  () => props.block.html,
  (newHtml) => {
    if (el.value && !isUpdatingFromModel && el.value.innerHTML !== newHtml) {
      el.value.innerHTML = newHtml
    }
  },
)

function onInput() {
  if (!el.value) return
  isUpdatingFromModel = true
  editor.updateBlock(props.block.id, { html: el.value.innerHTML } as any)
  isUpdatingFromModel = false

  // Debounced snapshot for typing
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    editor.pushSnapshot()
  }, 500)
}

function isAtStart(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!range.collapsed) return false
  const testRange = document.createRange()
  testRange.selectNodeContents(el)
  testRange.collapse(true)
  return range.compareBoundaryPoints(Range.START_TO_START, testRange) === 0
}

function isAtEnd(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!range.collapsed) return false
  const testRange = document.createRange()
  testRange.selectNodeContents(el)
  testRange.collapse(false)
  return range.compareBoundaryPoints(Range.END_TO_END, testRange) === 0
}

function onKeydown(e: KeyboardEvent) {
  // Enter without Shift → add new paragraph below
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    const newId = editor.addBlockAfter(props.block.id, 'paragraph')
    nextTick(() => {
      const newEl = document.querySelector(`[data-block-id="${newId}"]`) as HTMLElement | null
      newEl?.focus()
    })
    return
  }

  // Prevent Backspace from deleting the block or merging with the previous block
  if (e.key === 'Backspace' && el.value) {
    if (el.value.innerHTML === '' || isAtStart(el.value)) {
      e.preventDefault()
    }
  }

  // Prevent Delete from merging with the next block
  if (e.key === 'Delete' && el.value) {
    if (el.value.innerHTML === '' || isAtEnd(el.value)) {
      e.preventDefault()
    }
  }
}

function onFocus() {
  editor.activeBlockId.value = props.block.id
}
</script>

<template>
  <component
    :is="block.type === 'blockquote' ? 'blockquote' : 'p'"
    ref="el"
    :data-block-id="block.id"
    :data-placeholder="editor.placeholder || 'Type something...'"
    contenteditable="true"
    spellcheck="true"
    class="ae-text-block outline-none min-h-[1.5em] w-full"
    :class="[
      block.align !== 'left' ? `text-${block.align}` : '',
      ...block.classes,
      block.type === 'blockquote' ? 'border-l-4 border-gray-300 pl-4 italic text-gray-600' : '',
    ]"
    @input="onInput"
    @keydown="onKeydown"
    @focus="onFocus"
    @mousedown="editor.saveSelection()"
    @keyup="editor.saveSelection()"
  />
</template>
