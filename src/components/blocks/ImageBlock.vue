<script setup lang="ts">
import { ref, inject } from 'vue'
import type { ImageBlock, EditorContext } from '@/types'

const props = defineProps<{ block: ImageBlock }>()

const editor = inject<EditorContext>('alienEditor')!
const urlInput = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const showUrlInput = ref(false)
const mediaIsLoading = ref(false)
const mediaHasError = ref(false)

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const uploadFn = editor.mediaProvider?.upload

  if (uploadFn) {
    mediaIsLoading.value = true
    mediaHasError.value = false
    try {
      const url = await uploadFn(file)
      editor.updateBlock(props.block.id, { src: url, alt: file.name } as any)
      editor.pushSnapshot()
    } catch {
      mediaHasError.value = true
      setTimeout(() => { mediaHasError.value = false }, 2000)
    } finally {
      mediaIsLoading.value = false
    }
  } else {
    // Default: emit @upload and show local preview
    editor.onUpload(file)
    const localUrl = URL.createObjectURL(file)
    editor.updateBlock(props.block.id, { src: localUrl, alt: file.name } as any)
    editor.pushSnapshot()
  }
}

function onUrlSubmit() {
  const url = urlInput.value.trim()
  if (!url) return
  editor.pushSnapshot()
  editor.updateBlock(props.block.id, { src: url } as any)
  showUrlInput.value = false
  urlInput.value = ''
}

function onUrlKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') onUrlSubmit()
  if (e.key === 'Escape') {
    showUrlInput.value = false
    urlInput.value = ''
  }
}

function onAltChange(e: Event) {
  editor.updateBlock(props.block.id, { alt: (e.target as HTMLInputElement).value } as any)
}

function removeImage() {
  editor.pushSnapshot()
  editor.updateBlock(props.block.id, { src: '' } as any)
}
</script>

<template>
  <div class="ae-image-block">
    <!-- Image with src -->
    <div v-if="block.src" class="relative group/img">
      <img
        :src="block.src"
        :alt="block.alt"
        class="max-w-full rounded"
        :class="block.classes"
      />
      <div class="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors rounded flex items-center justify-center gap-2 opacity-0 group-hover/img:opacity-100">
        <button
          class="bg-white text-gray-700 text-xs px-2 py-1 rounded shadow hover:bg-gray-100"
          @mousedown.prevent="removeImage"
        >
          Replace
        </button>
      </div>
      <!-- Alt text input -->
      <input
        type="text"
        :value="block.alt"
        placeholder="Alt text (optional)"
        class="mt-1 w-full text-sm text-gray-500 border-0 border-b border-gray-200 outline-none focus:border-gray-400 bg-transparent"
        @change="onAltChange"
        @mousedown.stop
      />
    </div>

    <!-- Empty state -->
    <div v-else class="ae-image-empty border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center gap-3 bg-gray-50">
      <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <p class="text-sm text-gray-500">Upload an image or paste a URL</p>

      <div class="flex gap-2">
        <button
          class="text-sm px-3 py-1.5 bg-blue-600 text-white rounded transition-colors inline-flex items-center gap-1.5"
          :class="mediaIsLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'"
          :disabled="mediaIsLoading"
          @mousedown.prevent="!mediaIsLoading && fileInput?.click()"
        >
          <svg v-if="mediaIsLoading" class="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          <span v-if="mediaIsLoading">Uploading...</span>
          <span v-else-if="mediaHasError" class="text-red-200">Upload failed</span>
          <span v-else>Upload file</span>
        </button>
        <button
          class="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          @mousedown.prevent="showUrlInput = !showUrlInput"
        >
          Paste URL
        </button>
      </div>

      <div v-if="showUrlInput" class="w-full flex gap-2">
        <input
          v-model="urlInput"
          type="url"
          placeholder="https://example.com/image.jpg"
          class="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 outline-none focus:border-blue-500"
          @keydown="onUrlKeydown"
          @mousedown.stop
        />
        <button
          class="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          @mousedown.prevent="onUrlSubmit"
        >
          Insert
        </button>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />
    </div>
  </div>
</template>
