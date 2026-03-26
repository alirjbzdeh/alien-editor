<script setup lang="ts">
import { provide, watch, ref, onMounted, onUnmounted, computed } from 'vue'
import type { ColorOption, ModuleOption, EditorContext, Block } from '@/types'
import { useEditorState } from '@/composables/useEditorState'
import { useHistory } from '@/composables/useHistory'
import { useSelection } from '@/composables/useSelection'
import { useBlocks } from '@/composables/useBlocks'
import { useDragDrop } from '@/composables/useDragDrop'
import { useSerializer } from '@/composables/useSerializer'
import { useParser } from '@/composables/useParser'
import AlienToolbar from './toolbar/AlienToolbar.vue'
import BlockList from './blocks/BlockList.vue'
import LinkModal from './modals/LinkModal.vue'
import ImageUrlModal from './modals/ImageUrlModal.vue'

// ─── Props ────────────────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    colors?: ColorOption[]
    modules?: ModuleOption[]
  }>(),
  {
    modelValue: '',
    placeholder: 'Start writing...',
    colors: () => [],
    modules: () => [],
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  upload: [file: File]
}>()

// ─── Core state ───────────────────────────────────────────────────────────────
const { blocks, mode, activeBlockId, savedRange } = useEditorState()
const { pushSnapshot, undo, redo, canUndo, canRedo } = useHistory(blocks)
const { saveSelection, restoreSelection, getRange } = useSelection(savedRange)
const { addBlockAfter, addBlockAt, removeBlock, moveBlock, updateBlock } = useBlocks(blocks, pushSnapshot)
const { dragState, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } = useDragDrop(blocks, moveBlock)
const { serialize } = useSerializer()
const { parse } = useParser()

// ─── Modal state ──────────────────────────────────────────────────────────────
const showLinkModal = ref(false)
const showImageUrlModal = ref(false)
const linkModalCallback = ref<((href: string, text: string) => void) | null>(null)
const imageUrlCallback = ref<((url: string) => void) | null>(null)

// ─── Serialized HTML output ───────────────────────────────────────────────────
const serializedHtml = computed(() => serialize(blocks.value))

// ─── Code mode editable state ─────────────────────────────────────────────────
const codeEditorValue = ref('')
let codeUpdateTimer: ReturnType<typeof setTimeout> | null = null

watch(mode, (newMode, oldMode) => {
  if (newMode === 'code') {
    codeEditorValue.value = serializedHtml.value
  } else if (oldMode === 'code') {
    if (codeUpdateTimer) {
      clearTimeout(codeUpdateTimer)
      codeUpdateTimer = null
    }
    blocks.value = parse(codeEditorValue.value)
  }
})

function onCodeInput(e: Event) {
  const html = (e.target as HTMLTextAreaElement).value
  codeEditorValue.value = html
  if (codeUpdateTimer) clearTimeout(codeUpdateTimer)
  codeUpdateTimer = setTimeout(() => {
    pushSnapshot()
    blocks.value = parse(html)
  }, 300)
}

// ─── Initialize blocks from modelValue ───────────────────────────────────────
let isInitialized = false

function initBlocks(html: string) {
  const parsed = parse(html)
  blocks.value = parsed
}

onMounted(() => {
  initBlocks(props.modelValue || '')
  isInitialized = true
})

// ─── Emit on change ───────────────────────────────────────────────────────────
watch(
  serializedHtml,
  (newHtml) => {
    if (isInitialized) {
      emit('update:modelValue', newHtml)
    }
  },
)

// ─── Sync external modelValue changes ────────────────────────────────────────
watch(
  () => props.modelValue,
  (newVal) => {
    if (!isInitialized) return
    const currentHtml = serializedHtml.value
    // Only re-parse if the external value is truly different
    if (newVal !== currentHtml) {
      initBlocks(newVal || '')
    }
  },
)

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
    e.preventDefault()
    redo()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

// ─── Provide editor context to all children ───────────────────────────────────
const editorContext: EditorContext = {
  blocks,
  mode,
  activeBlockId,
  savedRange,
  colors: props.colors,
  modules: props.modules,
  placeholder: props.placeholder,
  pushSnapshot,
  undo,
  redo,
  canUndo,
  canRedo,
  updateBlock,
  addBlockAfter,
  addBlockAt,
  removeBlock,
  moveBlock,
  saveSelection,
  restoreSelection,
  onUpload: (file: File) => emit('upload', file),
  showLinkModal,
  showImageUrlModal,
  linkModalCallback,
  imageUrlCallback,
  dragState,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}

provide('alienEditor', editorContext)
</script>

<template>
  <div class="alien-editor ae-root border border-gray-200 rounded-xl bg-white shadow-sm">
    <!-- Toolbar -->
    <AlienToolbar />

    <!-- Edit mode -->
    <div
      v-if="mode === 'edit'"
      class="ae-edit-area min-h-[300px] px-8 py-6"
    >
      <BlockList />
    </div>

    <!-- Code mode: editable raw HTML -->
    <div
      v-else-if="mode === 'code'"
      class="ae-code-mode bg-gray-950 min-h-[300px] p-6"
    >
      <textarea
        class="w-full bg-transparent text-green-400 font-mono text-sm leading-relaxed resize-y outline-none min-h-[276px] whitespace-pre"
        :value="codeEditorValue"
        @input="onCodeInput"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      />
    </div>

    <!-- Preview mode: rendered output -->
    <div
      v-else
      class="ae-preview-mode min-h-[300px] px-8 py-6 prose prose-gray max-w-none"
    >
      <div v-if="serializedHtml" v-html="serializedHtml" />
      <p v-else class="text-gray-400 italic">Nothing to preview yet.</p>
    </div>

    <!-- Modals -->
    <LinkModal />
    <ImageUrlModal />
  </div>
</template>

<style>
/* ─── Contenteditable placeholder ─────────────────────────────────────────── */
.ae-text-block:empty::before,
.ae-heading-content:empty::before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

/* List item placeholder */
.ae-list-block li:empty::before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

/* ─── Block wrapper layout ─────────────────────────────────────────────────── */
.ae-block-wrapper {
  position: relative;
  padding: 2px 0;
  margin: 0 0 2px;
}

/* ─── Drag states ──────────────────────────────────────────────────────────── */
.ae-block--dragging {
  opacity: 0.4;
}

.ae-block--drag-over {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

/* ─── Prose output in preview mode ────────────────────────────────────────── */
.ae-preview-mode h1 { font-size: 3rem; font-weight: 700; margin-bottom: 0.5em; }
.ae-preview-mode h2 { font-size: 2.25rem; font-weight: 700; margin-bottom: 0.5em; }
.ae-preview-mode h3 { font-size: 1.875rem; font-weight: 600; margin-bottom: 0.5em; }
.ae-preview-mode h4 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5em; }
.ae-preview-mode h5 { font-size: 1.25rem; font-weight: 500; margin-bottom: 0.5em; }
.ae-preview-mode h6 { font-size: 1.125rem; font-weight: 500; margin-bottom: 0.5em; }
.ae-preview-mode p  { margin-bottom: 0.75em; }
.ae-preview-mode ul { list-style: disc; padding-left: 1.5em; margin-bottom: 0.75em; }
.ae-preview-mode ol { list-style: decimal; padding-left: 1.5em; margin-bottom: 0.75em; }
.ae-preview-mode blockquote { border-left: 4px solid #d1d5db; padding-left: 1em; color: #6b7280; font-style: italic; }
.ae-preview-mode pre { background: #111827; color: #f3f4f6; padding: 1em; border-radius: 0.5em; overflow-x: auto; }
.ae-preview-mode a { color: #2563eb; text-decoration: underline; }
.ae-preview-mode img { max-width: 100%; border-radius: 0.375rem; }
.ae-preview-mode hr { border-top: 1px solid #d1d5db; margin: 1em 0; }
</style>
