import { ref, watch, nextTick, type Ref, type ComputedRef } from 'vue'
import type { Block } from '@/types'

// Returns how many HTML characters precede the cursor within a contenteditable element
function getCursorHtmlOffset(contentEl: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return 0
  try {
    const cursorRange = sel.getRangeAt(0)
    const range = document.createRange()
    range.setStart(contentEl, 0)
    range.setEnd(cursorRange.startContainer, cursorRange.startOffset)
    const temp = document.createElement('div')
    temp.appendChild(range.cloneContents())
    return temp.innerHTML.length
  } catch {
    return 0
  }
}

// Strips HTML tags up to htmlOffset and returns the equivalent text character count
function htmlOffsetToTextOffset(html: string, htmlOffset: number): number {
  let text = 0
  let i = 0
  const cap = Math.min(htmlOffset, html.length)
  while (i < cap) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i)
      i = end === -1 ? html.length : end + 1
    } else if (html[i] === '&') {
      const end = html.indexOf(';', i)
      text++
      i = end === -1 ? i + 1 : end + 1
    } else {
      text++
      i++
    }
  }
  return text
}

// Places the cursor at a given text character offset inside a contenteditable element
function setCursorAtTextOffset(el: HTMLElement, targetOffset: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let remaining = targetOffset
  let node = walker.nextNode() as Text | null
  while (node) {
    if (remaining <= node.length) {
      const range = document.createRange()
      range.setStart(node, remaining)
      range.collapse(true)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      return
    }
    remaining -= node.length
    node = walker.nextNode() as Text | null
  }
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function getContentEl(blockId: string): HTMLElement | null {
  const el = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement | null
  if (!el) return null
  return el.contentEditable === 'true' ? el : (el.querySelector('[contenteditable]') as HTMLElement | null)
}

export function useCodeMode(
  mode: Ref<'edit' | 'code' | 'preview'>,
  blocks: Ref<Block[]>,
  activeBlockId: Ref<string | null>,
  serializedHtml: ComputedRef<string>,
  serializeBlock: (block: Block) => string,
  parse: (html: string) => Block[],
  pushSnapshot: () => void,
) {
  const codeEditorValue = ref('')
  const codeTextareaRef = ref<HTMLTextAreaElement | null>(null)
  let codeUpdateTimer: ReturnType<typeof setTimeout> | null = null

  function editToCodeCursorPos(): number {
    const sel = window.getSelection()
    let cursorBlockId: string | null = null
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).startContainer
      while (node) {
        if (node instanceof Element && node.getAttribute('data-block-id')) {
          cursorBlockId = node.getAttribute('data-block-id')
          break
        }
        node = node.parentNode
      }
    }
    if (!cursorBlockId) cursorBlockId = activeBlockId.value

    let running = 0
    for (const block of blocks.value) {
      const html = serializeBlock(block)
      if (!html) continue
      if (block.id === cursorBlockId) {
        const openingTagEnd = html.indexOf('>') + 1
        const contentEl = getContentEl(cursorBlockId!)
        const htmlOffsetInContent = contentEl ? getCursorHtmlOffset(contentEl) : 0
        return running + openingTagEnd + htmlOffsetInContent
      }
      running += html.length + 1
    }
    return 0
  }

  function codeToEditCursor(parsedBlocks: Block[], textareaPos: number): { blockId: string; htmlOffset: number } | null {
    let running = 0
    for (const block of parsedBlocks) {
      const html = serializeBlock(block)
      if (!html) continue
      if (textareaPos <= running + html.length) {
        const openingTagEnd = html.indexOf('>') + 1
        const innerEnd = html.lastIndexOf('<')
        const rawOffset = textareaPos - running - openingTagEnd
        return {
          blockId: block.id,
          htmlOffset: Math.max(0, Math.min(rawOffset, innerEnd - openingTagEnd)),
        }
      }
      running += html.length + 1
    }
    if (parsedBlocks.length > 0) {
      const last = parsedBlocks[parsedBlocks.length - 1]
      const html = serializeBlock(last)
      const openingTagEnd = html.indexOf('>') + 1
      return { blockId: last.id, htmlOffset: html.lastIndexOf('<') - openingTagEnd }
    }
    return null
  }

  watch(mode, async (newMode, oldMode) => {
    if (newMode === 'code') {
      const cursorPos = editToCodeCursorPos()
      codeEditorValue.value = serializedHtml.value
      await nextTick()
      if (codeTextareaRef.value) {
        codeTextareaRef.value.focus()
        codeTextareaRef.value.setSelectionRange(cursorPos, cursorPos)
      }
    } else if (oldMode === 'code') {
      const textareaPos = codeTextareaRef.value?.selectionStart ?? 0
      if (codeUpdateTimer) {
        clearTimeout(codeUpdateTimer)
        codeUpdateTimer = null
      }
      const parsedBlocks = parse(codeEditorValue.value)
      const cursor = codeToEditCursor(parsedBlocks, textareaPos)
      blocks.value = parsedBlocks

      await nextTick()
      if (cursor) {
        activeBlockId.value = cursor.blockId
        const contentEl = getContentEl(cursor.blockId)
        if (contentEl) {
          contentEl.focus()
          const textOffset = htmlOffsetToTextOffset(contentEl.innerHTML, cursor.htmlOffset)
          setCursorAtTextOffset(contentEl, textOffset)
        }
      }
    }
  })

  function onCodeInput(e: Event) {
    const html = (e.target as HTMLTextAreaElement).value
    codeEditorValue.value = html
    if (codeUpdateTimer) clearTimeout(codeUpdateTimer)
    codeUpdateTimer = setTimeout(() => {
      pushSnapshot()
      blocks.value = parse(html)
    }, 300)
  }

  return { codeEditorValue, codeTextareaRef, onCodeInput }
}
