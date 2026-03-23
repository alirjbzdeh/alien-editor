<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import type { EditorContext } from '@/types'
import { useFormatting } from '@/composables/useFormatting'

const editor = inject<EditorContext>('alienEditor')!
const formatting = useFormatting(editor.savedRange)

const href = ref('')
const text = ref('')

watch(editor.showLinkModal, (visible) => {
  if (visible) {
    href.value = ''
    text.value = ''
  }
})

function onConfirm() {
  if (!href.value.trim()) return

  if (editor.linkModalCallback.value) {
    editor.linkModalCallback.value(href.value.trim(), text.value.trim())
  } else {
    editor.pushSnapshot()
    formatting.insertLink(href.value.trim(), text.value.trim())
  }
  close()
}

function close() {
  editor.showLinkModal.value = false
  href.value = ''
  text.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') onConfirm()
  if (e.key === 'Escape') close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="editor.showLinkModal.value"
      class="ae-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      @mousedown.self="close"
    >
      <div class="ae-modal bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4" @mousedown.stop>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Insert Link</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              v-model="href"
              type="url"
              placeholder="https://example.com"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              @keydown="onKeydown"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Link text (optional)</label>
            <input
              v-model="text"
              type="text"
              placeholder="Leave empty to use URL as text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              @keydown="onKeydown"
            />
          </div>
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
            :disabled="!href.trim()"
            @click="onConfirm"
          >
            Insert Link
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
