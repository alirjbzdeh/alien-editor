<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import type { EditorContext } from '@/types'

const editor = inject<EditorContext>('alienEditor')!

// ─── Per-image metadata ───────────────────────────────────────────────────────
interface MediaItem {
  src: string
  alt: string
  caption: string
  width: string
  height: string
  loading: string
  decoding: string
  imgClass: string
}

function emptyItem(src: string): MediaItem {
  return { src, alt: '', caption: '', width: '', height: '', loading: '', decoding: '', imgClass: '' }
}

const items = ref<MediaItem[]>([])
const expandedIndex = ref<number | null>(null)

const showUrlInput = ref(false)
const urlInputValue = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

watch(editor.showMediaInsertModal, (visible) => {
  if (visible) {
    items.value = []
    expandedIndex.value = null
    showUrlInput.value = false
    urlInputValue.value = ''
  }
})

// ─── Adding images ─────────────────────────────────────────────────────────────
function addItems(srcs: (string | { url: string; caption?: string; alt?: string; width?: string; height?: string })[]) {
  const start = items.value.length
  srcs.forEach(src => {
    if (typeof src === 'string') {
      items.value.push(emptyItem(src))
    } else {
      items.value.push({ ...emptyItem(src.url), caption: src.caption ?? '', alt: src.alt ?? "", width: src.width ?? '', height: src.height ?? '' })
    }
  })
  // Auto-expand the first newly added item
  expandedIndex.value = start
}

async function onFileChange(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (!files.length) return
  const uploadFn = editor.mediaProvider?.upload
  if (!uploadFn) return
  const uploaded = await Promise.all(files.map(f => uploadFn(f)))
  addItems(uploaded)
  if (fileInput.value) fileInput.value.value = ''
}

async function onBrowse() {
  const browseFn = editor.mediaProvider?.browse
  if (!browseFn) return
  const result = await browseFn()
  addItems(result)
}

function onUrlSubmit() {
  const val = urlInputValue.value.trim()
  if (!val) return
  addItems([val])
  showUrlInput.value = false
  urlInputValue.value = ''
}

function onUrlKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') onUrlSubmit()
  if (e.key === 'Escape') { showUrlInput.value = false; urlInputValue.value = '' }
}

function removeItem(index: number) {
  items.value.splice(index, 1)
  if (expandedIndex.value === index) expandedIndex.value = null
  else if (expandedIndex.value !== null && expandedIndex.value > index) expandedIndex.value--
}

function toggleExpand(index: number) {
  expandedIndex.value = expandedIndex.value === index ? null : index
}

// ─── Build & insert ────────────────────────────────────────────────────────────
function buildHtml(item: MediaItem): string {
  const attrs: string[] = [`src="${item.src}"`]
  if (item.alt) attrs.push(`alt="${item.alt}"`)
  if (item.width) attrs.push(`width="${item.width}"`)
  if (item.height) attrs.push(`height="${item.height}"`)
  if (item.loading) attrs.push(`loading="${item.loading}"`)
  if (item.decoding) attrs.push(`decoding="${item.decoding}"`)
  if (item.imgClass) attrs.push(`class="${item.imgClass}"`)

  const imgTag = `<img ${attrs.join(' ')}>`
  if (item.caption) {
    return `<figure class="img-footnote">\n  ${imgTag}\n  <figcaption class="footnote">${item.caption}</figcaption>\n</figure>`
  }
  return `<figure class="img-footnote">\n  ${imgTag}\n</figure>`
}

function onConfirm() {
  if (!items.value.length) return

  const activeId = editor.activeBlockId.value
  let afterId = activeId ?? editor.blocks.value[editor.blocks.value.length - 1]?.id

  for (const item of items.value) {
    const html = buildHtml(item)
    if (editor.mediaInsertCallback.value) {
      editor.mediaInsertCallback.value(html)
    } else if (afterId) {
      afterId = editor.addBlockAfter(afterId, 'module', { html } as any)
    } else {
      afterId = editor.addBlockAt(editor.blocks.value.length, 'module', { html } as any)
    }
  }
  close()
}

function close() {
  editor.showMediaInsertModal.value = false
}

const canUpload = () => !!editor.mediaProvider?.upload
const canBrowse = () => !!editor.mediaProvider?.browse

// Filename from URL for display
function fileName(src: string): string {
  try {
    const parts = src.split('/')
    const name = parts[parts.length - 1].split('?')[0]
    return name || src
  } catch {
    return src
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="editor.showMediaInsertModal.value"
      class="ae-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-[2399]"
      @mousedown.self="close">
      <div class="ae-modal bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        @mousedown.stop>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Insert Media</h3>

        <!-- Upload area -->
        <div
          class="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center gap-3 bg-gray-50 mb-4">
          <p class="text-sm text-gray-500">
            {{ items.length ? 'Add more images' : 'Upload images or paste a URL' }}
          </p>

          <div class="flex gap-2 flex-wrap justify-center">
            <button v-if="canUpload()"
              class="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              @mousedown.prevent="fileInput?.click()">
              Upload file
            </button>
            <button v-if="canBrowse()"
              class="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              @mousedown.prevent="onBrowse()">
              Browse
            </button>
            <button class="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              @mousedown.prevent="showUrlInput = !showUrlInput">
              Paste URL
            </button>
          </div>

          <div v-if="showUrlInput" class="w-full flex gap-2">
            <input v-model="urlInputValue" type="url" placeholder="https://example.com/image.jpg"
              class="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 outline-none focus:border-blue-500"
              @keydown="onUrlKeydown" @mousedown.stop />
            <button class="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
              @mousedown.prevent="onUrlSubmit">
              Add
            </button>
          </div>

          <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFileChange" />
        </div>

        <!-- Accordion list of images -->
        <div v-if="items.length" class="space-y-2 mb-4">
          <div v-for="(item, i) in items" :key="i" class="border border-gray-200 rounded-lg overflow-hidden">
            <!-- Accordion header -->
            <div class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors select-none"
              @mousedown.prevent="toggleExpand(i)">
              <!-- Thumbnail -->
              <img :src="item.src" class="w-10 h-10 object-cover rounded shrink-0 border border-gray-200" />

              <!-- Filename -->
              <span class="flex-1 text-sm text-gray-700 truncate min-w-0">
                {{ fileName(item.src) }}
              </span>

              <!-- Meta summary (shown when collapsed and has data) -->
              <span v-if="expandedIndex !== i && (item.alt || item.caption)"
                class="text-xs text-gray-400 truncate max-w-[100px] shrink-0">
                {{ item.alt || item.caption }}
              </span>

              <!-- Remove button -->
              <button
                class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-base leading-none"
                title="Remove" @mousedown.prevent.stop="removeItem(i)">
                ×
              </button>

              <!-- Chevron -->
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                class="shrink-0 text-gray-400 transition-transform duration-200"
                :class="expandedIndex === i ? 'rotate-180' : ''">
                <path d="M6 8L1 3h10L6 8z" />
              </svg>
            </div>

            <!-- Accordion body (metadata fields) -->
            <div v-if="expandedIndex === i" class="px-3 pb-3 pt-1 border-t border-gray-100 space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Alt text</label>
                <input v-model="item.alt" type="text" placeholder="Describe the image"
                  class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  @mousedown.stop />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Caption</label>
                <input v-model="item.caption" type="text" placeholder="Image caption / footnote"
                  class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  @mousedown.stop />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Width</label>
                  <input v-model="item.width" type="text" placeholder="e.g. 800"
                    class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    @mousedown.stop />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Height</label>
                  <input v-model="item.height" type="text" placeholder="e.g. 600"
                    class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    @mousedown.stop />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Loading</label>
                  <select v-model="item.loading"
                    class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    @mousedown.stop>
                    <option value="">— none —</option>
                    <option value="lazy">lazy</option>
                    <option value="eager">eager</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Decoding</label>
                  <select v-model="item.decoding"
                    class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    @mousedown.stop>
                    <option value="">— none —</option>
                    <option value="async">async</option>
                    <option value="sync">sync</option>
                    <option value="auto">auto</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">CSS class</label>
                <input v-model="item.imgClass" type="text" placeholder="e.g. w-full rounded-lg"
                  class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  @mousedown.stop />
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <button class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            @click="close">
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!items.length" @click="onConfirm">
            Insert{{ items.length > 1 ? ` (${items.length})` : '' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
