<script setup lang="ts">
import { inject } from 'vue'
import type { EditorContext, EditorMode } from '@/types'

const editor = inject<EditorContext>('alienEditor')!

const modes: { key: EditorMode; label: string; title: string }[] = [
  { key: 'edit', label: 'Edit', title: 'Edit mode' },
  { key: 'code', label: 'Code', title: 'View raw HTML' },
  { key: 'preview', label: 'Preview', title: 'Preview rendered output' },
]
</script>

<template>
  <div class="ae-mode-toggle flex rounded-md border border-gray-200 overflow-hidden">
    <button
      v-for="m in modes"
      :key="m.key"
      class="px-3 py-1 text-xs font-medium transition-colors"
      :class="editor.mode.value === m.key
        ? 'bg-gray-800 text-white'
        : 'text-gray-600 hover:bg-gray-100'"
      :title="m.title"
      @mousedown.prevent="editor.mode.value = m.key"
    >
      {{ m.label }}
    </button>
  </div>
</template>
