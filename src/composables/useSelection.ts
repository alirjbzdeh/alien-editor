import { type Ref } from 'vue'

export function useSelection(savedRange: Ref<Range | null>) {
  function saveSelection() {
    if (typeof window === 'undefined') return
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRange.value = sel.getRangeAt(0).cloneRange()
    }
  }

  function restoreSelection() {
    if (typeof window === 'undefined' || !savedRange.value) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    sel.addRange(savedRange.value)
  }

  function getRange(): Range | null {
    if (typeof window === 'undefined') return null
    const sel = window.getSelection()
    return sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null
  }

  function isCollapsed(): boolean {
    if (typeof window === 'undefined') return true
    const sel = window.getSelection()
    return !sel || sel.isCollapsed
  }

  function getSelectedText(): string | null {
    if (typeof window === 'undefined') return null
    const sel = window.getSelection()
    return sel && sel.rangeCount > 0 ? sel.toString() : null
  }

  return { saveSelection, restoreSelection, getRange, isCollapsed, getSelectedText }
}
