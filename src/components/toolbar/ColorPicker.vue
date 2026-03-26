<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { EditorContext, ColorOption } from '@/types'
import { useFormatting } from '@/composables/useFormatting'

const editor = inject<EditorContext>('alienEditor')!
const formatting = useFormatting(editor.savedRange)

const isOpen = ref(false)
const search = ref('')

const filtered = computed<ColorOption[]>(() =>
  editor.colors.filter(c =>
    c.title.toLowerCase().includes(search.value.toLowerCase()) ||
    c.key.toLowerCase().includes(search.value.toLowerCase()),
  ),
)

function selectColor(color: ColorOption) {
  formatting.applyColor(color.class)
  isOpen.value = false
  search.value = ''
}

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    search.value = ''
  }
}

function closeOnClickOutside() {
  isOpen.value = false
}
</script>

<template>
  <div v-if="editor.colors.length" class="ae-color-picker relative">
    <button
      class="ae-toolbar-btn inline-flex items-center gap-1 px-2 h-8 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      title="Text color"
      @mousedown.prevent="toggle"
    >
      <span class="text-xs font-medium">A</span>
      <span class="text-gray-400">▾</span>
    </button>

    <div
      v-if="isOpen"
      class="ae-color-dropdown absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
      @mousedown.stop
    >
      <div class="p-2 border-b border-gray-100">
        <input
          v-model="search"
          type="text"
          placeholder="Search colors..."
          class="w-full text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
          @mousedown.stop
        />
      </div>
      <ul class="max-h-48 overflow-y-auto py-1">
        <li
          v-for="color in filtered"
          :key="color.key"
          class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm"
          @mousedown.prevent="selectColor(color)"
        >
          <span class="font-bold text-base" :class="color.class">A</span>
          <span class="text-gray-700">{{ color.title }}</span>
          <span class="text-gray-400 text-xs ml-auto">{{ color.key }}</span>
        </li>
        <li v-if="filtered.length === 0" class="px-3 py-2 text-sm text-gray-400 text-center">
          No colors found
        </li>
      </ul>
    </div>

    <!-- Click outside to close -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @mousedown="closeOnClickOutside"
    />
  </div>
</template>
