<script setup lang="ts">
import { ref, onMounted, watch, inject, nextTick } from 'vue'
import type { HeadingBlock, HeadingLevel, EditorContext } from '@/types'
import { isAtStart, isAtEnd } from '@/utils/selection'
import { useTypingSnapshot } from '@/composables/useTypingSnapshot'

const props = defineProps<{ block: HeadingBlock }>()

const editor = inject<EditorContext>('alienEditor')!
const el = ref<HTMLElement | null>(null)
const { onTypingStart } = useTypingSnapshot(editor.pushSnapshot)
let isUpdatingFromModel = false

const headingClasses: Record<HeadingLevel, string> = {
  1: 'text-5xl font-bold',
  2: 'text-4xl font-bold',
  3: 'text-3xl font-semibold',
  4: 'text-2xl font-semibold',
  5: 'text-xl font-medium',
  6: 'text-lg font-medium',
}

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
  onTypingStart()
  isUpdatingFromModel = true
  editor.updateBlock(props.block.id, { html: el.value.innerHTML } as any)
  isUpdatingFromModel = false
}

function onKeydown(e: KeyboardEvent) {
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

function setLevel(level: HeadingLevel) {
  editor.pushSnapshot()
  editor.updateBlock(props.block.id, { level } as any)
}
</script>

<template>
  <div class="ae-heading-block">
    <!-- Level selector shown on hover/focus -->
    <div class="ae-heading-level-selector flex gap-1 mb-1 opacity-0 focus-within:opacity-100 hover:opacity-100 transition-opacity">
      <button
        v-for="level in [1, 2, 3, 4, 5, 6]"
        :key="level"
        class="text-xs px-1.5 py-0.5 rounded border transition-colors"
        :class="block.level === level
          ? 'bg-gray-800 text-white border-gray-800'
          : 'border-gray-300 text-gray-500 hover:border-gray-500'"
        @mousedown.prevent="setLevel(level as HeadingLevel)"
      >
        H{{ level }}
      </button>
    </div>

    <component
      :is="`h${block.level}`"
      ref="el"
      :data-block-id="block.id"
      :data-placeholder="`Heading ${block.level}`"
      contenteditable="true"
      spellcheck="true"
      class="ae-heading-content outline-none min-h-[1.2em] w-full"
      :class="[
        headingClasses[block.level],
        block.align !== 'left' ? `text-${block.align}` : '',
        ...block.classes,
      ]"
      @input="onInput"
      @keydown="onKeydown"
      @focus="onFocus"
      @mousedown="editor.saveSelection()"
      @mouseup="editor.saveSelection()"
      @keyup="editor.saveSelection()"
    />
  </div>
</template>
