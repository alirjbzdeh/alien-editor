<script setup lang="ts">
import { ref, inject, watch, computed } from 'vue'
import type { EditorContext } from '@/types'

const editor = inject<EditorContext>('alienEditor')!

const urls = ref<string[]>([])
const alt = ref('')
const caption = ref('')
const width = ref('')
const height = ref('')
const loading = ref('')
const decoding = ref('')
const imgClass = ref('')

const showUrlInput = ref(false)
const urlInputValue = ref('')

const fileInput = ref<HTMLInputElement | null>(null)

watch(editor.showMediaInsertModal, (visible) => {
  if (visible) {
    urls.value = []
    alt.value = ''
    caption.value = ''
    width.value = ''
    height.value = ''
    loading.value = ''
    decoding.value = ''
    imgClass.value = ''
    showUrlInput.value = false
    urlInputValue.value = ''
  }
})

const canUpload = computed(() => !!editor.mediaProvider?.upload)
const canBrowse = computed(() => !!editor.mediaProvider?.browse)

async function onFileChange(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (!files.length) return

  const uploadFn = editor.mediaProvider?.upload
  if (!uploadFn) return

  const uploaded = await Promise.all(files.map(f => uploadFn(f)))
  urls.value.push(...uploaded)
  if (fileInput.value) fileInput.value.value = ''
}

async function onBrowse() {
  const browseFn = editor.mediaProvider?.browse
  if (!browseFn) return

  const result = await browseFn()
  urls.value.push(...result)
}

function onUrlSubmit() {
  const val = urlInputValue.value.trim()
  if (!val) return
  urls.value.push(val)
  showUrlInput.value = false
  urlInputValue.value = ''
}

function onUrlKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') onUrlSubmit()
  if (e.key === 'Escape') {
    showUrlInput.value = false
    urlInputValue.value = ''
  }
}

function removeUrl(index: number) {
  urls.value.splice(index, 1)
}

function buildHtml(src: string): string {
  const attrs: string[] = [`src="${src}"`]
  if (alt.value) attrs.push(`alt="${alt.value}"`)
  if (width.value) attrs.push(`width="${width.value}"`)
  if (height.value) attrs.push(`height="${height.value}"`)
  if (loading.value) attrs.push(`loading="${loading.value}"`)
  if (decoding.value) attrs.push(`decoding="${decoding.value}"`)
  if (imgClass.value) attrs.push(`class="${imgClass.value}"`)

  const imgTag = `<img ${attrs.join(' ')}>`

  if (caption.value) {
    return `<figure class="img-footnote">\n  ${imgTag}\n  <figcaption class="footnote">${caption.value}</figcaption>\n</figure>`
  }
  return `<figure class="img-footnote">\n  ${imgTag}\n</figure>`
}

function onConfirm() {
  if (!urls.value.length) return

  const activeId = editor.activeBlockId.value
  let afterId = activeId ?? editor.blocks.value[editor.blocks.value.length - 1]?.id

  for (const src of urls.value) {
    const html = buildHtml(src)
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
</script>

<template>
  <Teleport to="body">
    <div
      v-if="editor.showMediaInsertModal.value"
      class="ae-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-[2399]"
      @mousedown.self="close"
    >
      <div class="ae-modal bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" @mousedown.stop>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Insert Media</h3>

        <!-- Selected thumbnails -->
        <div v-if="urls.length" class="flex flex-wrap gap-2 mb-4">
          <div
            v-for="(src, i) in urls"
            :key="i"
            class="relative group w-20 h-20 shrink-0"
          >
            <img :src="src" class="w-20 h-20 object-cover rounded border border-gray-200" />
            <button
              class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              @mousedown.prevent="removeUrl(i)"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Upload area -->
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center gap-3 bg-gray-50 mb-4">
          <p class="text-sm text-gray-500">{{ urls.length ? 'Add more images' : 'Upload images or paste a URL' }}</p>

          <div class="flex gap-2 flex-wrap justify-center">
            <button
              v-if="canUpload"
              class="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              @mousedown.prevent="fileInput?.click()"
            >
              Upload file
            </button>

            <button
              v-if="canBrowse"
              class="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              @mousedown.prevent="onBrowse()"
            >
              Browse
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
              v-model="urlInputValue"
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
              Add
            </button>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="onFileChange"
          />
        </div>

        <!-- Optional fields -->
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Alt text (optional)</label>
            <input
              v-model="alt"
              type="text"
              placeholder="Describe the image"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
            <input
              v-model="caption"
              type="text"
              placeholder="Image caption / footnote"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Width (optional)</label>
              <input
                v-model="width"
                type="text"
                placeholder="e.g. 800"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Height (optional)</label>
              <input
                v-model="height"
                type="text"
                placeholder="e.g. 600"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Loading (optional)</label>
              <select
                v-model="loading"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">— none —</option>
                <option value="lazy">lazy</option>
                <option value="eager">eager</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Decoding (optional)</label>
              <select
                v-model="decoding"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">— none —</option>
                <option value="async">async</option>
                <option value="sync">sync</option>
                <option value="auto">auto</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">CSS class (optional)</label>
            <input
              v-model="imgClass"
              type="text"
              placeholder="e.g. w-100 h-100"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!urls.length"
            @click="onConfirm"
          >
            Insert{{ urls.length > 1 ? ` (${urls.length})` : '' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
