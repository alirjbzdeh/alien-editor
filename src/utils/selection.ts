export function isAtStart(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!range.collapsed) return false
  const testRange = document.createRange()
  testRange.selectNodeContents(el)
  testRange.collapse(true)
  return range.compareBoundaryPoints(Range.START_TO_START, testRange) === 0
}

export function isAtEnd(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!range.collapsed) return false
  const testRange = document.createRange()
  testRange.selectNodeContents(el)
  testRange.collapse(false)
  return range.compareBoundaryPoints(Range.END_TO_END, testRange) === 0
}
