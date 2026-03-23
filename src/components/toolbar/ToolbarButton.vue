<script setup lang="ts">
defineProps<{
  title?: string
  active?: boolean
  disabled?: boolean
}>()

defineEmits<{
  action: []
}>()
</script>

<template>
  <button
    class="ae-toolbar-btn inline-flex items-center justify-center w-8 h-8 rounded text-sm transition-colors"
    :class="[
      active
        ? 'bg-gray-800 text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
    ]"
    :title="title"
    :disabled="disabled"
    @mousedown.prevent="$emit('action')"
  >
    <slot />
  </button>
</template>
