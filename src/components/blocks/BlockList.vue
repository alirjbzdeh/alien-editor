<script setup lang="ts">
import { inject } from 'vue'
import type { EditorContext, DragState } from '@/types'
import BlockWrapper from './BlockWrapper.vue'
import TextBlock from './TextBlock.vue'
import HeadingBlock from './HeadingBlock.vue'
import ListBlock from './ListBlock.vue'
import ImageBlock from './ImageBlock.vue'
import VideoBlock from './VideoBlock.vue'
import CodeBlock from './CodeBlock.vue'
import DividerBlock from './DividerBlock.vue'
import ButtonBlock from './ButtonBlock.vue'
import ModuleBlock from './ModuleBlock.vue'

const props = defineProps<{
  dragState: DragState
  onDragStart: (blockId: string, event: DragEvent) => void
  onDragOver: (blockId: string, event: DragEvent) => void
  onDragLeave: () => void
  onDrop: (targetId: string) => void
  onDragEnd: () => void
}>()

const editor = inject<EditorContext>('alienEditor')!
</script>

<template>
  <div class="ae-block-list">
    <BlockWrapper
      v-for="block in editor.blocks.value"
      :key="block.id"
      :block="block"
      :drag-state="props.dragState"
      :on-drag-start="props.onDragStart"
      :on-drag-over="props.onDragOver"
      :on-drag-leave="props.onDragLeave"
      :on-drop="props.onDrop"
      :on-drag-end="props.onDragEnd"
    >
      <TextBlock
        v-if="block.type === 'paragraph' || block.type === 'blockquote'"
        :block="block as any"
      />
      <HeadingBlock
        v-else-if="block.type === 'heading'"
        :block="block as any"
      />
      <ListBlock
        v-else-if="block.type === 'ordered-list' || block.type === 'unordered-list'"
        :block="block as any"
      />
      <ImageBlock
        v-else-if="block.type === 'image'"
        :block="block as any"
      />
      <VideoBlock
        v-else-if="block.type === 'video'"
        :block="block as any"
      />
      <CodeBlock
        v-else-if="block.type === 'code'"
        :block="block as any"
      />
      <DividerBlock
        v-else-if="block.type === 'divider'"
        :block="block as any"
      />
      <ButtonBlock
        v-else-if="block.type === 'button'"
        :block="block as any"
      />
      <ModuleBlock
        v-else-if="block.type === 'module'"
        :block="block as any"
      />
    </BlockWrapper>

  </div>
</template>
