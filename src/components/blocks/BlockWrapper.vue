<script setup lang="ts">
import { inject } from 'vue'
import type { Block, EditorContext } from '@/types'

const props = defineProps<{ block: Block }>()

const editor = inject<EditorContext>('alienEditor')!
</script>

<template>
  <div
    class="ae-block-wrapper group relative"
    :class="{
      'ae-block--drag-over': editor.dragState.value.overId === block.id,
      'ae-block--dragging': editor.dragState.value.draggedId === block.id,
    }"
    @dragover="editor.onDragOver(block.id, $event)"
    @dragleave="editor.onDragLeave()"
    @drop.prevent="editor.onDrop(block.id)"
  >
    <!-- Drop indicator line -->
    <div
      v-if="editor.dragState.value.overId === block.id"
      class="ae-drop-indicator absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10 pointer-events-none"
    />

    <!-- Drag handle -->
    <div class="ae-block-controls absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5">
      <button
        class="ae-drag-handle cursor-grab active:cursor-grabbing w-5 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
        draggable="true"
        title="Drag to reorder"
        @mousedown.stop
        @dragstart="editor.onDragStart(block.id, $event)"
        @dragend="editor.onDragEnd()"
      >
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <circle cx="3" cy="3" r="1.5"/>
          <circle cx="7" cy="3" r="1.5"/>
          <circle cx="3" cy="8" r="1.5"/>
          <circle cx="7" cy="8" r="1.5"/>
          <circle cx="3" cy="13" r="1.5"/>
          <circle cx="7" cy="13" r="1.5"/>
        </svg>
      </button>
    </div>

    <!-- Block content -->
    <div class="ae-block-content">
      <slot />
    </div>

    <!-- Block action buttons -->
    <div class="ae-block-actions absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
      <button
        class="ae-btn-add w-6 h-6 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded text-lg leading-none"
        title="Add block below"
        @mousedown.prevent="editor.addBlockAfter(block.id, 'paragraph')"
      >
        +
      </button>
      <button
        class="ae-btn-delete w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded text-sm leading-none"
        title="Delete block"
        @mousedown.prevent="editor.removeBlock(block.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>
