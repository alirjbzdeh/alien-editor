<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import type { EditorContext } from '@/types'

const editor = inject<EditorContext>('alienEditor')!

const url = ref('')

watch(editor.showImageUrlModal, (visible) => {
  if (visible) url.value = ''
})

function onConfirm() {
  if (!url.value.trim()) return

  if (editor.imageUrlCallback.value) {
    editor.imageUrlCallback.value(url.value.trim())
  } else {
    const activeId = editor.activeBlockId.value
    if (activeId) {
      editor.addBlockAfter(activeId, 'image', { src: url.value.trim() } as any)
    } else {
      editor.addBlockAt(editor.blocks.value.length, 'image', { src: url.value.trim() } as any)
    }
  }
  close()
}

function close() {
  editor.showImageUrlModal.value = false
  url.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') onConfirm()
  if (e.key === 'Escape') close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="editor.showImageUrlModal.value"
      class="ae-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      @mousedown.self="close"
    >
      <div class="ae-modal bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4" @mousedown.stop>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Insert Image URL</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input
            v-model="url"
            type="url"
            placeholder="https://example.com/image.jpg"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            @keydown="onKeydown"
          />
        </div>

        <div class="flex gap-3 justify-end mt-6">
          <button
            class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            @click="close"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            :disabled="!url.trim()"
            @click="onConfirm"
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
