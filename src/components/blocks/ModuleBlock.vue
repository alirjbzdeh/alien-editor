<script setup lang="ts">
import { ref, onMounted, watch, inject } from 'vue'
import type { ModuleBlock, EditorContext } from '@/types'
import { isAtStart, isAtEnd } from '@/utils/selection'

const props = defineProps<{ block: ModuleBlock }>()

const editor = inject<EditorContext>('alienEditor')!
const el = ref<HTMLElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let isUpdatingFromModel = false

onMounted(() => {
  if (el.value && el.value.innerHTML !== props.block.html) {
    el.value.innerHTML = props.block.html
  }
})

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

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    editor.pushSnapshot()
  }, 500)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Backspace' && el.value) {
    if (el.value.innerHTML === '' || isAtStart(el.value)) {
      e.preventDefault()
    }
  }

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
  <div
    ref="el"
    class="ae-module-block outline-none"
    contenteditable="true"
    spellcheck="true"
    @input="onInput"
    @keydown="onKeydown"
    @focus="onFocus"
    @mousedown="editor.saveSelection()"
    @keyup="editor.saveSelection()"
  />
</template>
