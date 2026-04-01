<script setup lang="ts">
import { ref, nextTick, inject, watch } from 'vue'
import type { OrderedListBlock, UnorderedListBlock, EditorContext } from '@/types'

const props = defineProps<{ block: OrderedListBlock | UnorderedListBlock }>()

const editor = inject<EditorContext>('alienEditor')!
const itemRefs = ref<HTMLElement[]>([])
let isUpdatingFromInput = false

watch(
  () => props.block.items,
  (newItems) => {
    if (isUpdatingFromInput) return
    nextTick(() => {
      newItems.forEach((html, i) => {
        const el = itemRefs.value[i]
        if (el && el.innerHTML !== html) el.innerHTML = html
      })
    })
  },
)

function setItemRef(el: HTMLElement | null, index: number) {
  if (el) itemRefs.value[index] = el
}

function onItemInput(index: number, e: Event) {
  const target = e.target as HTMLElement
  const newItems = [...props.block.items]
  newItems[index] = target.innerHTML
  isUpdatingFromInput = true
  editor.updateBlock(props.block.id, { items: newItems } as any)
  isUpdatingFromInput = false
}

function onItemKeydown(index: number, e: KeyboardEvent) {
  const items = props.block.items

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    editor.pushSnapshot()
    const newItems = [...items]
    newItems.splice(index + 1, 0, '')
    editor.updateBlock(props.block.id, { items: newItems } as any)
    nextTick(() => {
      itemRefs.value[index + 1]?.focus()
    })
    return
  }

  if (e.key === 'Backspace') {
    const target = e.target as HTMLElement
    if (target.innerHTML === '' && items.length > 1) {
      e.preventDefault()
      editor.pushSnapshot()
      const newItems = [...items]
      newItems.splice(index, 1)
      editor.updateBlock(props.block.id, { items: newItems } as any)
      nextTick(() => {
        const focusIdx = Math.max(0, index - 1)
        itemRefs.value[focusIdx]?.focus()
      })
    } else if (target.innerHTML === '' && items.length === 1) {
      // Last item is empty — block can only be removed via the delete button
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
    :is="block.type === 'ordered-list' ? 'ol' : 'ul'"
    class="ae-list-block pl-6"
    :class="block.type === 'ordered-list' ? 'list-decimal' : 'list-disc'"
  >
    <li
      v-for="(item, index) in block.items"
      :key="index"
      :ref="(el) => setItemRef(el as HTMLElement, index)"
      contenteditable="true"
      spellcheck="true"
      class="outline-none min-h-[1.5em]"
      :data-placeholder="'List item'"
      @input="onItemInput(index, $event)"
      @keydown="onItemKeydown(index, $event)"
      @focus="onFocus"
      @mousedown="editor.saveSelection()"
      @keyup="editor.saveSelection()"
    />
  </component>
</template>
