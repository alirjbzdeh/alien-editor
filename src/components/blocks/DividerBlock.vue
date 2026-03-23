<script setup lang="ts">
import type { DividerBlock } from '@/types'

defineProps<{ block: DividerBlock }>()
</script>

<template>
  <hr class="ae-divider border-t border-gray-300 my-2 w-full" :class="block.classes" />
</template>
