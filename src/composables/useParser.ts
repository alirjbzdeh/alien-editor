import type { Block, TextAlign, HeadingLevel } from '@/types'

let parseIdCounter = 0
function pid(): string {
  return `ae-p-${Date.now()}-${++parseIdCounter}`
}

function extractAlign(el: Element): TextAlign {
  if (el.classList.contains('text-center')) return 'center'
  if (el.classList.contains('text-right')) return 'right'
  if (el.classList.contains('text-justify')) return 'justify'
  return 'left'
}

function extractExtraClasses(el: Element, exclude: string[] = []): string[] {
  const alignClasses = ['text-left', 'text-center', 'text-right', 'text-justify']
  return Array.from(el.classList).filter(c => ![...alignClasses, ...exclude].includes(c))
}

export function useParser() {
  function parse(html: string): Block[] {
    if (!html || !html.trim()) {
      return []
    }

    // SSR safety: return a single paragraph block on server
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return [{ id: pid(), type: 'paragraph', html, align: 'left', classes: [] }]
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')
    const children = Array.from(doc.body.childNodes)

    const blocks: Block[] = []

    for (const node of children) {
      // Skip pure whitespace text nodes between blocks
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node as Text).textContent?.trim()
        if (text) {
          blocks.push({ id: pid(), type: 'paragraph', html: text, align: 'left', classes: [] })
        }
        continue
      }

      const el = node as Element
      const tag = el.tagName?.toLowerCase()

      switch (true) {
        case tag === 'p': {
          blocks.push({
            id: pid(),
            type: 'paragraph',
            html: el.innerHTML,
            align: extractAlign(el),
            classes: extractExtraClasses(el),
          })
          break
        }

        case /^h[1-6]$/.test(tag): {
          const level = parseInt(tag[1]) as HeadingLevel
          blocks.push({
            id: pid(),
            type: 'heading',
            level,
            html: el.innerHTML,
            align: extractAlign(el),
            classes: extractExtraClasses(el),
          })
          break
        }

        case tag === 'blockquote': {
          blocks.push({
            id: pid(),
            type: 'blockquote',
            html: el.innerHTML,
            align: extractAlign(el),
            classes: extractExtraClasses(el, ['border-l-4', 'border-gray-300', 'pl-4', 'italic']),
          })
          break
        }

        case tag === 'ul': {
          const items = Array.from(el.querySelectorAll(':scope > li')).map(li => li.innerHTML)
          blocks.push({
            id: pid(),
            type: 'unordered-list',
            items: items.length ? items : [''],
          })
          break
        }

        case tag === 'ol': {
          const items = Array.from(el.querySelectorAll(':scope > li')).map(li => li.innerHTML)
          blocks.push({
            id: pid(),
            type: 'ordered-list',
            items: items.length ? items : [''],
          })
          break
        }

        case tag === 'img': {
          blocks.push({
            id: pid(),
            type: 'image',
            src: el.getAttribute('src') || '',
            alt: el.getAttribute('alt') || '',
            classes: extractExtraClasses(el),
          })
          break
        }

        case tag === 'video': {
          blocks.push({
            id: pid(),
            type: 'video',
            src: el.getAttribute('src') || '',
            classes: extractExtraClasses(el, ['w-full']),
          })
          break
        }

        case tag === 'pre': {
          const codeEl = el.querySelector('code')
          const language = codeEl?.className.replace('language-', '') || 'plaintext'
          // Decode HTML entities for display in textarea
          const tmp = document.createElement('div')
          tmp.innerHTML = codeEl?.innerHTML || ''
          blocks.push({
            id: pid(),
            type: 'code',
            code: tmp.textContent || '',
            language,
          })
          break
        }

        case tag === 'hr': {
          blocks.push({
            id: pid(),
            type: 'divider',
            classes: extractExtraClasses(el, ['border-t', 'border-gray-300', 'my-4']),
          })
          break
        }

        case tag === 'a' && (el as HTMLElement).dataset?.alienBlock === 'button': {
          blocks.push({
            id: pid(),
            type: 'button',
            label: el.textContent || 'Button',
            href: el.getAttribute('href') || '#',
            classes: Array.from(el.classList),
          })
          break
        }

        case tag === 'table': {
          const rows: import('@/types').TableCell[][] = []
          let hasHeader = false

          const thead = el.querySelector(':scope > thead')
          if (thead) {
            hasHeader = true
            const ths = Array.from(thead.querySelectorAll(':scope > tr > th'))
            if (ths.length > 0) {
              rows.push(ths.map(th => ({ html: th.innerHTML, align: extractAlign(th) })))
            }
          }

          const tbody = el.querySelector(':scope > tbody') ?? el
          const trs = Array.from(tbody.querySelectorAll(':scope > tr'))
          trs.forEach(tr => {
            const cells = Array.from(tr.querySelectorAll(':scope > td'))
            if (cells.length > 0) {
              rows.push(cells.map(td => ({ html: td.innerHTML, align: extractAlign(td) })))
            }
          })

          if (rows.length === 0) {
            rows.push(
              [{ html: '', align: 'left' }, { html: '', align: 'left' }],
              [{ html: '', align: 'left' }, { html: '', align: 'left' }],
            )
          }

          blocks.push({ id: pid(), type: 'table', rows, hasHeader })
          break
        }

        default: {
          // Unknown or module HTML — preserve as module block
          blocks.push({
            id: pid(),
            type: 'module',
            html: (el as HTMLElement).outerHTML,
          })
        }
      }
    }

    return blocks
  }

  return { parse }
}
