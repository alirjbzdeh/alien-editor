<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'

const props = defineProps<{
  searchQuery: string
  matchCount: number
  currentMatchIndex: number
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  close: []
  next: []
  prev: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.searchQuery,
  () => {},
  { immediate: false },
)

function focusInput() {
  nextTick(() => inputRef.value?.focus())
}

defineExpose({ focusInput })

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (e.shiftKey) emit('prev')
    else emit('next')
  }
}
</script>

<template>
  <div
    class="ae-search-bar flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg shadow-lg"
    @mousedown.stop
    @keydown.stop
  >
    <!-- Search icon -->
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class="text-gray-400 flex-shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>

    <!-- Input -->
    <input
      ref="inputRef"
      type="text"
      placeholder="Find..."
      class="w-36 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
      :value="searchQuery"
      @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      @keydown="handleKeydown"
    />

    <!-- Match counter -->
    <span
      v-if="searchQuery"
      class="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 min-w-[44px] text-right"
    >
      {{ matchCount === 0 ? 'No results' : `${currentMatchIndex + 1} / ${matchCount}` }}
    </span>

    <div class="flex items-center gap-0.5">
      <!-- Previous -->
      <button
        class="w-6 h-6 inline-flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors"
        :class="matchCount === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'"
        title="Previous match (Shift+Enter)"
        :disabled="matchCount === 0"
        @click="emit('prev')"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M5 3L1.5 7h7L5 3z" />
        </svg>
      </button>

      <!-- Next -->
      <button
        class="w-6 h-6 inline-flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors"
        :class="matchCount === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'"
        title="Next match (Enter)"
        :disabled="matchCount === 0"
        @click="emit('next')"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M5 7L1.5 3h7L5 7z" />
        </svg>
      </button>

      <!-- Close -->
      <button
        class="w-6 h-6 inline-flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
        title="Close (Escape)"
        @click="emit('close')"
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1 1l7 7M8 1L1 8" />
        </svg>
      </button>
    </div>
  </div>
</template>
