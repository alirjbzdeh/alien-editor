import { ref, type Ref } from 'vue'
import type { Block, HistorySnapshot } from '@/types'

const MAX_HISTORY = 100

export function useHistory(blocks: Ref<Block[]>) {
  const past = ref<HistorySnapshot[]>([])
  const future = ref<HistorySnapshot[]>([])

  function snapshot(): HistorySnapshot {
    return {
      blocks: JSON.parse(JSON.stringify(blocks.value)),
      timestamp: Date.now(),
    }
  }

  function pushSnapshot() {
    past.value.push(snapshot())
    if (past.value.length > MAX_HISTORY) {
      past.value.shift()
    }
    future.value = []
  }

  function undo() {
    if (!past.value.length) return
    future.value.push(snapshot())
    blocks.value = past.value.pop()!.blocks
  }

  function redo() {
    if (!future.value.length) return
    past.value.push(snapshot())
    blocks.value = future.value.pop()!.blocks
  }

  function canUndo() {
    return past.value.length > 0
  }

  function canRedo() {
    return future.value.length > 0
  }

  return { pushSnapshot, undo, redo, canUndo, canRedo }
}
