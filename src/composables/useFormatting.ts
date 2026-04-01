import { type Ref } from 'vue'
import { useSelection } from './useSelection'
import { tailwindMap } from '@/utils/tailwindMap'

export function useFormatting(savedRange: Ref<Range | null>) {
  const { restoreSelection, getRange, isCollapsed } = useSelection(savedRange)

  function notifyContentEditable(node: Node | null) {
    let el: Node | null = node
    while (el) {
      if ((el as HTMLElement).contentEditable === 'true') {
        ;(el as HTMLElement).dispatchEvent(new Event('input', { bubbles: true }))
        return
      }
      el = el.parentNode
    }
  }

  /**
   * Wrap the current selection in a <span> with the given Tailwind class.
   * Uses Range.extractContents() to avoid document.execCommand (deprecated).
   */
  function stripSpansFromFragment(fragment: DocumentFragment, predicate: (cls: string) => boolean) {
    const spans = Array.from(fragment.querySelectorAll('span'))
    for (const span of spans) {
      if (Array.from(span.classList).some(predicate)) {
        const parent = span.parentNode!
        while (span.firstChild) parent.insertBefore(span.firstChild, span)
        parent.removeChild(span)
      }
    }
  }

  function wrapSelectionWithClass(className: string, stripPredicate?: (cls: string) => boolean) {
    restoreSelection()
    const range = getRange()
    if (!range || isCollapsed()) return

    const fragment = range.extractContents()

    if (stripPredicate) {
      stripSpansFromFragment(fragment, stripPredicate)
    }

    const span = document.createElement('span')
    span.className = className
    span.appendChild(fragment)
    range.insertNode(span)

    // Keep the new span selected
    const newRange = document.createRange()
    newRange.selectNodeContents(span)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(newRange)

    notifyContentEditable(span)
    return span
  }

  /**
   * Check if the selection's common ancestor already has a given class.
   * Walks up until it finds a matching span or hits a contenteditable boundary.
   */
  function findAncestorWithClass(className: string): HTMLSpanElement | null {
    restoreSelection()
    const range = getRange()
    if (!range) return null

    let node: Node | null =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer

    while (node && (node as HTMLElement).contentEditable !== 'true') {
      const el = node as HTMLElement
      if (el.tagName === 'SPAN' && el.classList.contains(className)) {
        return el as HTMLSpanElement
      }
      node = node.parentNode
    }
    return null
  }

  /**
   * Toggle a Tailwind class on the current selection.
   * If the selection is already wrapped in a matching span, unwraps it.
   */
  function toggleClass(className: string) {
    const existing = findAncestorWithClass(className)
    if (existing) {
      // Unwrap: replace span with its children
      const parent = existing.parentNode!
      while (existing.firstChild) {
        parent.insertBefore(existing.firstChild, existing)
      }
      parent.removeChild(existing)
      // Normalize adjacent text nodes
      parent.normalize()
      notifyContentEditable(parent)
    } else {
      wrapSelectionWithClass(className)
    }
  }

  function applyBold() {
    toggleClass(tailwindMap.bold)
  }

  function applyItalic() {
    toggleClass(tailwindMap.italic)
  }

  function applyUnderline() {
    toggleClass(tailwindMap.underline)
  }

  function applyStrikethrough() {
    toggleClass(tailwindMap.strikethrough)
  }

  function applyFontSize(sizeKey: string) {
    const fontSizeClasses = new Set(Object.keys(tailwindMap.fontSizes).map(k => `text-${k}`))
    wrapSelectionWithClass(`text-${sizeKey}`, cls => fontSizeClasses.has(cls))
  }

  function applyFontWeight(weightKey: string) {
    wrapSelectionWithClass(`font-${weightKey}`)
  }

  function applyColor(colorClass: string) {
    const fontSizeClasses = new Set(Object.keys(tailwindMap.fontSizes).map(k => `text-${k}`))
    const alignClasses = new Set(['text-left', 'text-center', 'text-right', 'text-justify'])
    const isColorClass = (cls: string) =>
      cls.startsWith('text-') && !fontSizeClasses.has(cls) && !alignClasses.has(cls)
    wrapSelectionWithClass(colorClass, isColorClass)
  }

  /**
   * Insert a link at the current saved selection position.
   */
  function insertLink(href: string, text: string) {
    restoreSelection()
    const range = getRange()
    if (!range) return

    const anchor = document.createElement('a')
    anchor.href = href
    anchor.className = 'text-blue-600 underline hover:text-blue-800'
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'

    if (!isCollapsed()) {
      // Replace selected text with link
      range.deleteContents()
    }
    anchor.textContent = text || href
    range.insertNode(anchor)

    // Place cursor after the link
    const newRange = document.createRange()
    newRange.setStartAfter(anchor)
    newRange.collapse(true)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(newRange)

    notifyContentEditable(anchor)
  }

  /**
   * Check if a given format class is currently active at the selection.
   */
  function isActive(className: string): boolean {
    return findAncestorWithClass(className) !== null
  }

  return {
    wrapSelectionWithClass,
    toggleClass,
    applyBold,
    applyItalic,
    applyUnderline,
    applyStrikethrough,
    applyFontSize,
    applyFontWeight,
    applyColor,
    insertLink,
    isActive,
  }
}
