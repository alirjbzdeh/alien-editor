<script setup lang="ts">
import { ref, inject } from 'vue'
import type { ButtonBlock, EditorContext } from '@/types'

const props = defineProps<{ block: ButtonBlock }>()

const editor = inject<EditorContext>('alienEditor')!
const isEditing = ref(false)
const labelInput = ref(props.block.label)
const hrefInput = ref(props.block.href)

function startEdit() {
  labelInput.value = props.block.label
  hrefInput.value = props.block.href
  isEditing.value = true
}

function saveEdit() {
  editor.pushSnapshot()
  editor.updateBlock(props.block.id, {
    label: labelInput.value,
    href: hrefInput.value,
  } as any)
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') saveEdit()
  if (e.key === 'Escape') cancelEdit()
}
</script>

<template>
  <div class="ae-button-block">
    <div v-if="isEditing" class="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
      <div class="flex gap-2">
        <input
          v-model="labelInput"
          type="text"
          placeholder="Button label"
          class="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 outline-none focus:border-blue-500"
          @keydown="onKeydown"
          @mousedown.stop
        />
        <input
          v-model="hrefInput"
          type="url"
          placeholder="https://..."
          class="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 outline-none focus:border-blue-500"
          @keydown="onKeydown"
          @mousedown.stop
        />
      </div>
      <div class="flex gap-2 justify-end">
        <button
          class="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
          @mousedown.prevent="cancelEdit"
        >
          Cancel
        </button>
        <button
          class="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          @mousedown.prevent="saveEdit"
        >
          Save
        </button>
      </div>
    </div>

    <div v-else class="flex items-center gap-2">
      <a
        :href="block.href"
        class="inline-block"
        :class="block.classes.length ? block.classes : ['px-4', 'py-2', 'bg-blue-600', 'text-white', 'rounded', 'hover:bg-blue-700', 'transition-colors']"
        @click.prevent
      >
        {{ block.label }}
      </a>
      <button
        class="text-xs text-gray-400 hover:text-gray-600 underline"
        @mousedown.prevent="startEdit"
      >
        Edit
      </button>
    </div>
  </div>
</template>
