import { ref, computed, watch, nextTick, type Ref } from 'vue'
import type { Block, EditorMode } from '@/types'

export function useSearch(
  blocks: Ref<Block[]>,
  mode: Ref<EditorMode>,
  codeEditorValue: Ref<string>,
  codeTextareaRef: Ref<HTMLTextAreaElement | null>,
) {
  const isSearchOpen = ref(false)
  const searchQuery = ref('')
  const currentMatchIndex = ref(0)
  const editMatchRanges = ref<Range[]>([])
  const codeMatchPositions = ref<number[]>([])

  // ─── Open / Close ─────────────────────────────────────────────────────────
  function openSearch() {
    isSearchOpen.value = true
  }

  function closeSearch() {
    isSearchOpen.value = false
    searchQuery.value = ''
    clearEditHighlights()
    codeMatchPositions.value = []
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

  // ─── Code mode search ─────────────────────────────────────────────────────
  function findCodePositions(query: string): number[] {
    if (!query) return []
    const text = codeEditorValue.value
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const positions: number[] = []
    let idx = 0
    while ((idx = lowerText.indexOf(lowerQuery, idx)) !== -1) {
      positions.push(idx)
      idx += query.length
    }
    return positions
  }

  function navigateCodeMatch(positions: number[], idx: number) {
    const textarea = codeTextareaRef.value
    if (!textarea || positions.length === 0) return
    const pos = positions[idx]
    textarea.focus()
    textarea.setSelectionRange(pos, pos + searchQuery.value.length)
    const textBefore = codeEditorValue.value.substring(0, pos)
    const lineCount = textBefore.split('\n').length
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
    textarea.scrollTop = Math.max(0, (lineCount - 5) * lineHeight)
  }

  // ─── Match count ──────────────────────────────────────────────────────────
  const matchCount = computed(() => {
    if (mode.value === 'edit') return editMatchRanges.value.length
    if (mode.value === 'code') return codeMatchPositions.value.length
    return 0
  })

  // ─── Execute search ───────────────────────────────────────────────────────
  async function executeSearch() {
    clearEditHighlights()
    codeMatchPositions.value = []
    currentMatchIndex.value = 0

    if (!searchQuery.value) return

    if (mode.value === 'edit') {
      await nextTick()
      const ranges = findEditRanges(searchQuery.value)
      editMatchRanges.value = ranges
      applyEditHighlights(ranges, 0)
    } else if (mode.value === 'code') {
      const positions = findCodePositions(searchQuery.value)
      codeMatchPositions.value = positions
      if (positions.length > 0) navigateCodeMatch(positions, 0)
    }
  }

  function nextMatch() {
    if (matchCount.value === 0) return
    currentMatchIndex.value = (currentMatchIndex.value + 1) % matchCount.value
    if (mode.value === 'edit') {
      applyEditHighlights(editMatchRanges.value, currentMatchIndex.value)
    } else if (mode.value === 'code') {
      navigateCodeMatch(codeMatchPositions.value, currentMatchIndex.value)
    }
  }

  function prevMatch() {
    if (matchCount.value === 0) return
    currentMatchIndex.value = (currentMatchIndex.value - 1 + matchCount.value) % matchCount.value
    if (mode.value === 'edit') {
      applyEditHighlights(editMatchRanges.value, currentMatchIndex.value)
    } else if (mode.value === 'code') {
      navigateCodeMatch(codeMatchPositions.value, currentMatchIndex.value)
    }
  }

  // ─── Watchers ─────────────────────────────────────────────────────────────
  watch(searchQuery, () => executeSearch())

  watch(mode, () => {
    clearEditHighlights()
    codeMatchPositions.value = []
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
    if (!open) {
      clearEditHighlights()
      codeMatchPositions.value = []
    }
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
