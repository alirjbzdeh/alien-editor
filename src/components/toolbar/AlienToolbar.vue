<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import type { EditorContext, BlockType, HeadingLevel, TextAlign } from '@/types'
import { useFormatting } from '@/composables/useFormatting'
import { tailwindMap } from '@/utils/tailwindMap'
import ToolbarButton from './ToolbarButton.vue'
import ColorPicker from './ColorPicker.vue'
import ModuleDropdown from './ModuleDropdown.vue'
import ModeToggle from './ModeToggle.vue'

const editor = inject<EditorContext>('alienEditor')!
const formatting = useFormatting(editor.savedRange)

// ─── Block type insertion dropdown ────────────────────────────────────────────
const showBlockMenu = ref(false)
const blockTypes: { type: BlockType; label: string }[] = [
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'heading', label: 'Heading' },
  { type: 'unordered-list', label: 'Bullet List' },
  { type: 'ordered-list', label: 'Numbered List' },
  { type: 'blockquote', label: 'Blockquote' },
  { type: 'code', label: 'Code Block' },
  { type: 'image', label: 'Image' },
  { type: 'video', label: 'Video' },
  { type: 'button', label: 'Button' },
  { type: 'divider', label: 'Divider' },
]

function insertBlock(type: BlockType) {
  const activeId = editor.activeBlockId.value
  if (activeId) {
    editor.addBlockAfter(activeId, type)
  } else {
    const blocks = editor.blocks.value
    const lastId = blocks[blocks.length - 1]?.id
    if (lastId) editor.addBlockAfter(lastId, type)
    else editor.addBlockAt(0, type)
  }
  showBlockMenu.value = false
}

// ─── Heading level dropdown ────────────────────────────────────────────────────
const showHeadingMenu = ref(false)
const headingLevels: HeadingLevel[] = [1, 2, 3, 4, 5, 6]

function setHeadingLevel(level: HeadingLevel) {
  const activeId = editor.activeBlockId.value
  if (!activeId) return
  const block = editor.blocks.value.find(b => b.id === activeId)
  if (block?.type === 'heading') {
    editor.updateBlock(activeId, { level } as any)
  } else {
    // Convert current block to heading or insert new heading
    editor.pushSnapshot()
    editor.updateBlock(activeId, { type: 'heading', level, html: (block as any)?.html ?? '' } as any)
  }
  showHeadingMenu.value = false
}

// ─── Font size dropdown ────────────────────────────────────────────────────────
const showSizeMenu = ref(false)
const fontSizeOptions = Object.entries(tailwindMap.fontSizes)

// ─── Font weight dropdown ──────────────────────────────────────────────────────
const showWeightMenu = ref(false)
const fontWeightOptions = Object.entries(tailwindMap.fontWeights)

// ─── Alignment ────────────────────────────────────────────────────────────────
function setAlign(align: TextAlign) {
  const activeId = editor.activeBlockId.value
  if (!activeId) return
  editor.updateBlock(activeId, { align } as any)
}

// ─── Link modal ───────────────────────────────────────────────────────────────
function openLinkModal() {
  editor.saveSelection()
  editor.showLinkModal.value = true
}

// ─── Image block insertion ─────────────────────────────────────────────────────
function insertImage() {
  const activeId = editor.activeBlockId.value
  if (activeId) editor.addBlockAfter(activeId, 'image')
  else editor.addBlockAt(editor.blocks.value.length, 'image')
}

// ─── HR ───────────────────────────────────────────────────────────────────────
function insertDivider() {
  const activeId = editor.activeBlockId.value
  if (activeId) editor.addBlockAfter(activeId, 'divider')
  else editor.addBlockAt(editor.blocks.value.length, 'divider')
}

// ─── Current active block info ────────────────────────────────────────────────
const activeBlock = computed(() => {
  if (!editor.activeBlockId.value) return null
  return editor.blocks.value.find(b => b.id === editor.activeBlockId.value) ?? null
})

const currentAlign = computed<TextAlign>(() => {
  return (activeBlock.value as any)?.align ?? 'left'
})

const isEditMode = computed(() => editor.mode.value === 'edit')

// Close dropdowns on outside click
function closeDropdowns() {
  showBlockMenu.value = false
  showHeadingMenu.value = false
  showSizeMenu.value = false
  showWeightMenu.value = false
}
</script>

<template>
  <div
    class="ae-toolbar flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-gray-200 bg-white sticky top-0 z-20"
    @mouseleave="closeDropdowns"
  >
    <!-- Formatting: Bold, Italic, Underline, Strikethrough -->
    <template v-if="isEditMode">
      <ToolbarButton title="Bold (Ctrl+B)" @action="formatting.applyBold()">
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton title="Italic (Ctrl+I)" @action="formatting.applyItalic()">
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton title="Underline" @action="formatting.applyUnderline()">
        <span class="underline">U</span>
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" @action="formatting.applyStrikethrough()">
        <span class="line-through">S</span>
      </ToolbarButton>

      <div class="ae-divider-v w-px h-5 bg-gray-200 mx-1" />

      <!-- Heading level dropdown -->
      <div class="relative">
        <button
          class="ae-toolbar-btn inline-flex items-center gap-1 px-2 h-8 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          title="Heading level"
          @mousedown.prevent="showHeadingMenu = !showHeadingMenu; showSizeMenu = false; showWeightMenu = false; showBlockMenu = false"
        >
          H <span class="text-gray-400 text-xs">▾</span>
        </button>
        <div
          v-if="showHeadingMenu"
          class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[100px]"
          @mousedown.stop
        >
          <button
            v-for="level in headingLevels"
            :key="level"
            class="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
            @mousedown.prevent="setHeadingLevel(level)"
          >
            <span :class="tailwindMap.headingDefaults[level]" class="leading-tight">H{{ level }}</span>
          </button>
        </div>
      </div>

      <!-- Font size dropdown -->
      <div class="relative">
        <button
          class="ae-toolbar-btn inline-flex items-center gap-1 px-2 h-8 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          title="Font size"
          @mousedown.prevent="showSizeMenu = !showSizeMenu; showHeadingMenu = false; showWeightMenu = false; showBlockMenu = false"
        >
          Size <span class="text-gray-400 text-xs">▾</span>
        </button>
        <div
          v-if="showSizeMenu"
          class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[120px]"
          @mousedown.stop
        >
          <button
            v-for="[key] in fontSizeOptions"
            :key="key"
            class="w-full text-left px-3 py-1 hover:bg-gray-50"
            :class="`text-${key}`"
            @mousedown.prevent="formatting.applyFontSize(key)"
          >
            {{ key }}
          </button>
        </div>
      </div>

      <!-- Font weight dropdown -->
      <div class="relative">
        <button
          class="ae-toolbar-btn inline-flex items-center gap-1 px-2 h-8 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          title="Font weight"
          @mousedown.prevent="showWeightMenu = !showWeightMenu; showHeadingMenu = false; showSizeMenu = false; showBlockMenu = false"
        >
          Weight <span class="text-gray-400 text-xs">▾</span>
        </button>
        <div
          v-if="showWeightMenu"
          class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[130px]"
          @mousedown.stop
        >
          <button
            v-for="[key] in fontWeightOptions"
            :key="key"
            class="w-full text-left px-3 py-1 hover:bg-gray-50 text-sm"
            :class="`font-${key}`"
            @mousedown.prevent="formatting.applyFontWeight(key)"
          >
            {{ key }}
          </button>
        </div>
      </div>

      <div class="ae-divider-v w-px h-5 bg-gray-200 mx-1" />

      <!-- Text alignment -->
      <ToolbarButton
        title="Align left"
        :active="currentAlign === 'left'"
        @action="setAlign('left')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="1" width="14" height="2" rx="1"/>
          <rect x="0" y="5" width="10" height="2" rx="1"/>
          <rect x="0" y="9" width="14" height="2" rx="1"/>
          <rect x="0" y="13" width="8" height="2" rx="1"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        title="Align center"
        :active="currentAlign === 'center'"
        @action="setAlign('center')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="1" width="14" height="2" rx="1"/>
          <rect x="2" y="5" width="10" height="2" rx="1"/>
          <rect x="0" y="9" width="14" height="2" rx="1"/>
          <rect x="3" y="13" width="8" height="2" rx="1"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        title="Align right"
        :active="currentAlign === 'right'"
        @action="setAlign('right')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="1" width="14" height="2" rx="1"/>
          <rect x="4" y="5" width="10" height="2" rx="1"/>
          <rect x="0" y="9" width="14" height="2" rx="1"/>
          <rect x="6" y="13" width="8" height="2" rx="1"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        title="Justify"
        :active="currentAlign === 'justify'"
        @action="setAlign('justify')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="1" width="14" height="2" rx="1"/>
          <rect x="0" y="5" width="14" height="2" rx="1"/>
          <rect x="0" y="9" width="14" height="2" rx="1"/>
          <rect x="0" y="13" width="14" height="2" rx="1"/>
        </svg>
      </ToolbarButton>

      <div class="ae-divider-v w-px h-5 bg-gray-200 mx-1" />

      <!-- Link -->
      <ToolbarButton title="Insert link" @action="openLinkModal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
        </svg>
      </ToolbarButton>

      <!-- Insert image -->
      <ToolbarButton title="Insert image" @action="insertImage">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </ToolbarButton>

      <!-- HR/Divider -->
      <ToolbarButton title="Insert divider" @action="insertDivider">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="6" width="14" height="2" rx="1"/>
        </svg>
      </ToolbarButton>

      <!-- Block type inserter -->
      <div class="relative">
        <button
          class="ae-toolbar-btn inline-flex items-center gap-1 px-2 h-8 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          title="Insert block"
          @mousedown.prevent="showBlockMenu = !showBlockMenu; showHeadingMenu = false; showSizeMenu = false; showWeightMenu = false"
        >
          + Block <span class="text-gray-400 text-xs">▾</span>
        </button>
        <div
          v-if="showBlockMenu"
          class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[150px]"
          @mousedown.stop
        >
          <button
            v-for="bt in blockTypes"
            :key="bt.type"
            class="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
            @mousedown.prevent="insertBlock(bt.type)"
          >
            {{ bt.label }}
          </button>
        </div>
      </div>

      <div class="ae-divider-v w-px h-5 bg-gray-200 mx-1" />

      <!-- Colors -->
      <ColorPicker />

      <!-- Modules -->
      <ModuleDropdown />

      <div class="ae-divider-v w-px h-5 bg-gray-200 mx-1" />

      <!-- Undo / Redo -->
      <ToolbarButton title="Undo (Ctrl+Z)" :disabled="!editor.canUndo()" @action="editor.undo()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 14 4 9 9 4"/>
          <path d="M20 20v-7a4 4 0 00-4-4H4"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton title="Redo (Ctrl+Y)" :disabled="!editor.canRedo()" @action="editor.redo()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 14 20 9 15 4"/>
          <path d="M4 20v-7a4 4 0 014-4h12"/>
        </svg>
      </ToolbarButton>

      <div class="ae-divider-v w-px h-5 bg-gray-200 mx-1" />
    </template>

    <!-- Mode toggle — always visible -->
    <div class="ml-auto">
      <ModeToggle />
    </div>
  </div>
</template>
