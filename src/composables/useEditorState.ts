import { ref } from 'vue'
import type { Block, EditorMode } from '@/types'

export function useEditorState() {
  const blocks = ref<Block[]>([])
  const mode = ref<EditorMode>('edit')
  const activeBlockId = ref<string | null>(null)
  const savedRange = ref<Range | null>(null)

  return { blocks, mode, activeBlockId, savedRange }
}
