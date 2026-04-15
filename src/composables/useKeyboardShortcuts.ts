import { onMounted, onUnmounted } from 'vue'

export function useKeyboardShortcuts(undo: () => void, redo: () => void, openSearch: () => void) {
  function onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault()
      redo()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault()
      openSearch()
    }
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}
