<script setup lang="ts">
import { ref, inject } from 'vue'
import type { VideoBlock, EditorContext } from '@/types'

const props = defineProps<{ block: VideoBlock }>()

const editor = inject<EditorContext>('alienEditor')!
const activeTab = ref<'url' | 'embed'>('url')
const embedPlaceholder = '<iframe src="https://www.youtube.com/embed/..." ...></iframe>'
const urlInput = ref('')
const embedInput = ref('')

function onUrlSubmit() {
  const url = urlInput.value.trim()
  if (!url) return
  editor.pushSnapshot()
  editor.updateBlock(props.block.id, { src: url, embed: undefined } as any)
  urlInput.value = ''
}

function onEmbedSubmit() {
  const code = embedInput.value.trim()
  if (!code) return
  editor.pushSnapshot()
  editor.updateBlock(props.block.id, { embed: code, src: '' } as any)
  embedInput.value = ''
}

function onUrlKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') onUrlSubmit()
}

function onEmbedKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) onEmbedSubmit()
}

function removeVideo() {
  editor.pushSnapshot()
  editor.updateBlock(props.block.id, { src: '', embed: undefined } as any)
}
</script>

<template>
  <div class="ae-video-block">
    <!-- Filled state: direct video -->
    <div v-if="block.src" class="relative group/vid">
      <video
        :src="block.src"
        controls
        class="w-full rounded"
        :class="block.classes"
      />
      <button
        class="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/vid:opacity-100 transition-opacity"
        @mousedown.prevent="removeVideo"
      >
        Remove
      </button>
    </div>

    <!-- Filled state: embed code -->
    <div v-else-if="block.embed" class="relative group/vid">
      <div class="w-full rounded overflow-hidden" v-html="block.embed" />
      <button
        class="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/vid:opacity-100 transition-opacity"
        @mousedown.prevent="removeVideo"
      >
        Remove
      </button>
    </div>

    <!-- Empty state -->
    <div v-else class="ae-video-empty border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center gap-3 bg-gray-50">
      <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
      </svg>

      <!-- Tabs -->
      <div class="flex gap-0 border border-gray-200 rounded overflow-hidden text-xs">
        <button
          class="px-3 py-1 transition-colors"
          :class="activeTab === 'url' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
          @mousedown.prevent="activeTab = 'url'"
        >
          URL
        </button>
        <button
          class="px-3 py-1 transition-colors"
          :class="activeTab === 'embed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
          @mousedown.prevent="activeTab = 'embed'"
        >
          Embed Code
        </button>
      </div>

      <!-- URL tab -->
      <div v-if="activeTab === 'url'" class="w-full flex gap-2">
        <input
          v-model="urlInput"
          type="url"
          placeholder="https://example.com/video.mp4"
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

      <!-- Embed tab -->
      <div v-else class="w-full flex flex-col gap-2">
        <textarea
          v-model="embedInput"
          :placeholder="embedPlaceholder"
          rows="3"
          class="w-full text-sm border border-gray-300 rounded px-3 py-1.5 outline-none focus:border-blue-500 resize-none font-mono"
          @keydown="onEmbedKeydown"
          @mousedown.stop
        />
        <button
          class="self-end text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          @mousedown.prevent="onEmbedSubmit"
        >
          Insert
        </button>
      </div>
    </div>
  </div>
</template>
