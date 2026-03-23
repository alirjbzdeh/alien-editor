import { ref, type Ref } from 'vue'
import type { Block, DragState } from '@/types'

export function useDragDrop(blocks: Ref<Block[]>, moveBlock: (fromId: string, toId: string) => void) {
  const dragState = ref<DragState>({ draggedId: null, overId: null })

  function onDragStart(blockId: string, event: DragEvent) {
    dragState.value.draggedId = blockId
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', blockId)
    }
  }

  function onDragOver(blockId: string, event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    if (dragState.value.draggedId && dragState.value.draggedId !== blockId) {
      dragState.value.overId = blockId
    }
  }

  function onDragLeave() {
    dragState.value.overId = null
  }

  function onDrop(targetId: string) {
    const { draggedId } = dragState.value
    if (draggedId && draggedId !== targetId) {
      moveBlock(draggedId, targetId)
    }
    dragState.value = { draggedId: null, overId: null }
  }

  function onDragEnd() {
    dragState.value = { draggedId: null, overId: null }
  }

  return { dragState, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd }
}
