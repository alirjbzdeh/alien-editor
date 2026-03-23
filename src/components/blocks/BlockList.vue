<script setup lang="ts">
import { inject } from 'vue'
import type { EditorContext } from '@/types'
import BlockWrapper from './BlockWrapper.vue'
import TextBlock from './TextBlock.vue'
import HeadingBlock from './HeadingBlock.vue'
import ListBlock from './ListBlock.vue'
import ImageBlock from './ImageBlock.vue'
import VideoBlock from './VideoBlock.vue'
import CodeBlock from './CodeBlock.vue'
import DividerBlock from './DividerBlock.vue'
import ButtonBlock from './ButtonBlock.vue'

const editor = inject<EditorContext>('alienEditor')!

function addFirstBlock() {
  if (editor.blocks.value.length === 0) {
    editor.addBlockAt(0, 'paragraph')
  }
}
</script>

<template>
  <div class="ae-block-list" @click.self="addFirstBlock">
    <BlockWrapper
      v-for="block in editor.blocks.value"
      :key="block.id"
      :block="block"
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
      <!-- Module block: render raw HTML -->
      <div
        v-else-if="block.type === 'module'"
        class="ae-module-block"
        v-html="(block as any).html"
      />
    </BlockWrapper>

    <!-- Click below last block to add new paragraph -->
    <div
      class="ae-block-add-area h-8 cursor-text"
      @click="editor.addBlockAfter(editor.blocks.value[editor.blocks.value.length - 1]?.id ?? '', 'paragraph')"
    />
  </div>
</template>
