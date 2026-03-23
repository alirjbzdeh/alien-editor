<script setup lang="ts">
import { inject } from 'vue'
import type { CodeBlock, EditorContext } from '@/types'

const props = defineProps<{ block: CodeBlock }>()

const editor = inject<EditorContext>('alienEditor')!

const languages = [
  'plaintext', 'javascript', 'typescript', 'html', 'css', 'scss',
  'python', 'ruby', 'php', 'java', 'go', 'rust', 'c', 'cpp',
  'json', 'yaml', 'markdown', 'bash', 'shell', 'sql',
]

function onCodeInput(e: Event) {
  editor.updateBlock(props.block.id, { code: (e.target as HTMLTextAreaElement).value } as any)
}

function onLanguageChange(e: Event) {
  editor.pushSnapshot()
  editor.updateBlock(props.block.id, { language: (e.target as HTMLSelectElement).value } as any)
}

function onFocus() {
  editor.activeBlockId.value = props.block.id
}
</script>

<template>
  <div class="ae-code-block bg-gray-900 rounded-lg overflow-hidden">
    <!-- Language selector header -->
    <div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
      <select
        :value="block.language"
        class="bg-transparent text-gray-300 text-xs outline-none cursor-pointer"
        @change="onLanguageChange"
        @mousedown.stop
      >
        <option
          v-for="lang in languages"
          :key="lang"
          :value="lang"
          class="bg-gray-800"
        >
          {{ lang }}
        </option>
      </select>
      <div class="flex gap-1.5">
        <div class="w-3 h-3 rounded-full bg-red-500 opacity-70" />
        <div class="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
        <div class="w-3 h-3 rounded-full bg-green-500 opacity-70" />
      </div>
    </div>

    <!-- Code textarea -->
    <textarea
      :value="block.code"
      class="w-full bg-gray-900 text-gray-100 font-mono text-sm p-4 outline-none resize-none min-h-[120px] leading-relaxed"
      placeholder="// Enter your code here..."
      spellcheck="false"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      @input="onCodeInput"
      @focus="onFocus"
      @mousedown.stop
    />
  </div>
</template>
