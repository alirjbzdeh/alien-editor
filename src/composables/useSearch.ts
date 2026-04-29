import { ref, computed, watch, nextTick, type Ref } from 'vue'
import type { Block, EditorMode } from '@/types'

export function useSearch(
  blocks: Ref<Block[]>,
  mode: Ref<EditorMode>,
) {
  const isSearchOpen = ref(false)
  const searchQuery = ref('')
  const currentMatchIndex = ref(0)
  const editMatchRanges = ref<Range[]>([])

  // ─── Open / Close ─────────────────────────────────────────────────────────
  function openSearch() {
    isSearchOpen.value = true
  }

  function closeSearch() {
    isSearchOpen.value = false
    searchQuery.value = ''
    clearEditHighlights()
  }

  // ─── Edit mode: CSS Custom Highlight API ──────────────────────────────────
  function clearEditHighlights() {
    if (typeof CSS !== 'undefined' && CSS.highlights) {
      CSS.highlights.delete('ae-search')
      CSS.highlights.delete('ae-search-current')
    }
    editMatchRanges.value = []
    currentMatchIndex.value = 0
  }

  function findEditRanges(query: string): Range[] {
    const ranges: Range[] = []
    if (!query) return ranges

    const editArea = document.querySelector('.ae-edit-area')
    if (!editArea) return ranges

    const lowerQuery = query.toLowerCase()
    const walker = document.createTreeWalker(editArea, NodeFilter.SHOW_TEXT)
    let node: Node | null

    while ((node = walker.nextNode())) {
      const textNode = node as Text
      const text = textNode.textContent ?? ''
      const lowerText = text.toLowerCase()
      let idx = 0
      while ((idx = lowerText.indexOf(lowerQuery, idx)) !== -1) {
        const range = document.createRange()
        range.setStart(textNode, idx)
        range.setEnd(textNode, idx + query.length)
        ranges.push(range)
        idx += query.length
      }
    }
    return ranges
  }

  function applyEditHighlights(ranges: Range[], currentIdx: number) {
    if (typeof CSS === 'undefined' || !CSS.highlights) return

    CSS.highlights.delete('ae-search')
    CSS.highlights.delete('ae-search-current')

    if (ranges.length === 0) return

    CSS.highlights.set('ae-search', new Highlight(...ranges))

    const current = ranges[currentIdx]
    if (current) {
      CSS.highlights.set('ae-search-current', new Highlight(current))
      const node = current.startContainer
      const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }

  // ─── Match count ──────────────────────────────────────────────────────────
  const matchCount = computed(() => {
    if (mode.value === 'edit') return editMatchRanges.value.length
    return 0
  })

  // ─── Execute search (edit mode only) ──────────────────────────────────────
  async function executeSearch() {
    clearEditHighlights()
    currentMatchIndex.value = 0

    if (!searchQuery.value || mode.value !== 'edit') return

    await nextTick()
    const ranges = findEditRanges(searchQuery.value)
    editMatchRanges.value = ranges
    applyEditHighlights(ranges, 0)
  }

  function nextMatch() {
    if (matchCount.value === 0) return
    currentMatchIndex.value = (currentMatchIndex.value + 1) % matchCount.value
    applyEditHighlights(editMatchRanges.value, currentMatchIndex.value)
  }

  function prevMatch() {
    if (matchCount.value === 0) return
    currentMatchIndex.value = (currentMatchIndex.value - 1 + matchCount.value) % matchCount.value
    applyEditHighlights(editMatchRanges.value, currentMatchIndex.value)
  }

  // ─── Watchers ─────────────────────────────────────────────────────────────
  watch(searchQuery, () => executeSearch())

  watch(mode, () => {
    clearEditHighlights()
    if (searchQuery.value && isSearchOpen.value) nextTick(() => executeSearch())
  })

  watch(
    blocks,
    () => {
      if (mode.value === 'edit' && searchQuery.value && isSearchOpen.value) {
        nextTick(() => executeSearch())
      }
    },
    { deep: true },
  )

  watch(isSearchOpen, (open) => {
    if (!open) clearEditHighlights()
  })

  return {
    isSearchOpen,
    searchQuery,
    currentMatchIndex,
    matchCount,
    openSearch,
    closeSearch,
    nextMatch,
    prevMatch,
  }
}
