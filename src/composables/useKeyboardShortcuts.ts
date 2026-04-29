import { onMounted, onUnmounted, type Ref } from 'vue'
import type { EditorMode } from '@/types'

export function useKeyboardShortcuts(undo: () => void, redo: () => void, openSearch: () => void, mode: Ref<EditorMode>) {
  function onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault()
      redo()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && mode.value === 'edit') {
      e.preventDefault()
      openSearch()
    }
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}
