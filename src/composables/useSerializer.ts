import type {
  Block,
  ParagraphBlock,
  BlockquoteBlock,
  HeadingBlock,
  OrderedListBlock,
  UnorderedListBlock,
  ImageBlock,
  VideoBlock,
  CodeBlock,
  DividerBlock,
  ButtonBlock,
  ModuleBlock,
  TextAlign,
} from '@/types'

function alignClass(align: TextAlign): string {
  if (align === 'left') return ''
  return `text-${align}`
}

function classAttr(classes: string[]): string {
  const filtered = classes.filter(Boolean)
  return filtered.length ? ` class="${filtered.join(' ')}"` : ''
}

function serializeBlock(block: Block): string {
  switch (block.type) {
    case 'paragraph': {
      const b = block as ParagraphBlock
      const cls = [alignClass(b.align), ...b.classes].filter(Boolean)
      return `<p${classAttr(cls)}>${b.html || ''}</p>`
    }

    case 'blockquote': {
      const b = block as BlockquoteBlock
      const cls = ['border-l-4', 'border-gray-300', 'pl-4', 'italic', alignClass(b.align), ...b.classes].filter(Boolean)
      return `<blockquote${classAttr(cls)}>${b.html || ''}</blockquote>`
    }

    case 'heading': {
      const b = block as HeadingBlock
      const cls = [alignClass(b.align), ...b.classes].filter(Boolean)
      return `<h${b.level}${classAttr(cls)}>${b.html || ''}</h${b.level}>`
    }

    case 'ordered-list': {
      const b = block as OrderedListBlock
      const items = b.items.map(item => `<li>${item}</li>`).join('')
      return `<ol class="list-decimal list-inside">${items}</ol>`
    }

    case 'unordered-list': {
      const b = block as UnorderedListBlock
      const items = b.items.map(item => `<li>${item}</li>`).join('')
      return `<ul class="list-disc list-inside">${items}</ul>`
    }

    case 'image': {
      const b = block as ImageBlock
      const cls = b.classes.filter(Boolean)
      if (!b.src) return ''
      return `<img src="${escapeAttr(b.src)}" alt="${escapeAttr(b.alt)}"${classAttr(cls)} />`
    }

    case 'video': {
      const b = block as VideoBlock
      if (!b.src) return ''
      return `<video src="${escapeAttr(b.src)}" controls class="w-full"></video>`
    }

    case 'code': {
      const b = block as CodeBlock
      const escaped = b.code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return `<pre class="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto"><code class="language-${escapeAttr(b.language)}">${escaped}</code></pre>`
    }

    case 'divider': {
      const b = block as DividerBlock
      const cls = ['border-t', 'border-gray-300', 'my-4', ...b.classes].filter(Boolean)
      return `<hr${classAttr(cls)} />`
    }

    case 'button': {
      const b = block as ButtonBlock
      const cls = b.classes.filter(Boolean)
      return `<a href="${escapeAttr(b.href)}"${classAttr(cls)}>${b.label || 'Button'}</a>`
    }

    case 'module': {
      const b = block as ModuleBlock
      return b.html || ''
    }

    default:
      return ''
  }
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function useSerializer() {
  function serialize(blocks: Block[]): string {
    return blocks
      .map(block => serializeBlock(block))
      .filter(Boolean)
      .join('\n')
  }

  return { serialize, serializeBlock }
}
