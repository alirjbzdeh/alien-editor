<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { EditorContext, ModuleOption } from '@/types'

const editor = inject<EditorContext>('alienEditor')!

const isOpen = ref(false)
const search = ref('')

const filtered = computed<ModuleOption[]>(() =>
  editor.modules.filter(m =>
    m.title.toLowerCase().includes(search.value.toLowerCase()) ||
    m.key.toLowerCase().includes(search.value.toLowerCase()),
  ),
)

function insertModule(m: ModuleOption) {
  const activeId = editor.activeBlockId.value
  if (activeId) {
    editor.addBlockAfter(activeId, 'module', { html: m.module } as any)
  } else {
    const blocks = editor.blocks.value
    const lastId = blocks[blocks.length - 1]?.id ?? ''
    if (lastId) {
      editor.addBlockAfter(lastId, 'module', { html: m.module } as any)
    } else {
      editor.addBlockAt(0, 'module', { html: m.module } as any)
    }
  }
  isOpen.value = false
  search.value = ''
}

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) search.value = ''
}

function closeOnClickOutside() {
  isOpen.value = false
}
</script>

<template>
  <div v-if="editor.modules.length" class="ae-module-dropdown relative">
    <button
      class="ae-toolbar-btn inline-flex items-center gap-1 px-2 h-8 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      title="Insert module"
      @mousedown.prevent="toggle"
    >
      <span class="text-xs font-medium">{ }</span>
      <span class="text-gray-400">▾</span>
    </button>

    <div
      v-if="isOpen"
      class="ae-module-dropdown-panel absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
      @mousedown.stop
    >
      <div class="p-2 border-b border-gray-100">
        <input
          v-model="search"
          type="text"
          placeholder="Search modules..."
          class="w-full text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
          @mousedown.stop
        />
      </div>
      <ul class="max-h-60 overflow-y-auto py-1">
        <li
          v-for="m in filtered"
          :key="m.key"
          class="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
          @mousedown.prevent="insertModule(m)"
        >
          <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 text-xs flex-shrink-0 mt-0.5">
            {{ m.key.slice(0, 2).toUpperCase() }}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-800">{{ m.title }}</p>
            <p class="text-xs text-gray-400">{{ m.key }}</p>
          </div>
        </li>
        <li v-if="filtered.length === 0" class="px-3 py-2 text-sm text-gray-400 text-center">
          No modules found
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
