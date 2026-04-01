import { type Ref } from 'vue'
import type { Block, BlockType } from '@/types'

let idCounter = 0
function generateId(): string {
  return `ae-${Date.now()}-${++idCounter}`
}

function createDefaultBlock(type: BlockType, overrides: Partial<Block> = {}): Block {
  const id = generateId()
  switch (type) {
    case 'paragraph':
      return { id, type: 'paragraph', html: '', align: 'left', classes: [], ...overrides } as Block
    case 'blockquote':
      return { id, type: 'blockquote', html: '', align: 'left', classes: [], ...overrides } as Block
    case 'heading':
      return { id, type: 'heading', level: 2, html: '', align: 'left', classes: [], ...overrides } as Block
    case 'ordered-list':
      return { id, type: 'ordered-list', items: [''], ...overrides } as Block
    case 'unordered-list':
      return { id, type: 'unordered-list', items: [''], ...overrides } as Block
    case 'image':
      return { id, type: 'image', src: '', alt: '', classes: [], ...overrides } as Block
    case 'video':
      return { id, type: 'video', src: '', classes: [], ...overrides } as Block
    case 'code':
      return { id, type: 'code', code: '', language: 'plaintext', ...overrides } as Block
    case 'divider':
      return { id, type: 'divider', classes: [], ...overrides } as Block
    case 'button':
      return { id, type: 'button', label: 'Button', href: '#', classes: ['inline-block', 'px-4', 'py-2', 'bg-blue-600', 'text-white', 'rounded'], ...overrides } as Block
    case 'module':
      return { id, type: 'module', html: '', ...overrides } as Block
    default:
      return { id, type: 'paragraph', html: '', align: 'left', classes: [] } as Block
  }
}

export function useBlocks(blocks: Ref<Block[]>, pushSnapshot: () => void) {
  function addBlockAfter(afterId: string, type: BlockType, overrides: Partial<Block> = {}): string {
    pushSnapshot()
    const idx = blocks.value.findIndex(b => b.id === afterId)
    const newBlock = createDefaultBlock(type, overrides)
    blocks.value.splice(idx + 1, 0, newBlock)
    return newBlock.id
  }

  function addBlockAt(index: number, type: BlockType, overrides: Partial<Block> = {}): string {
    pushSnapshot()
    const newBlock = createDefaultBlock(type, overrides)
    blocks.value.splice(index, 0, newBlock)
    return newBlock.id
  }

  function removeBlock(id: string) {
    const idx = blocks.value.findIndex(b => b.id === id)
    if (idx === -1) return
    pushSnapshot()
    blocks.value.splice(idx, 1)
  }

  function moveBlock(fromId: string, toId: string) {
    const fromIdx = blocks.value.findIndex(b => b.id === fromId)
    const toIdx = blocks.value.findIndex(b => b.id === toId)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
    pushSnapshot()
    const [moved] = blocks.value.splice(fromIdx, 1)
    blocks.value.splice(toIdx, 0, moved)
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    const block = blocks.value.find(b => b.id === id)
    if (block) Object.assign(block, patch)
  }

  function replaceBlock(id: string, type: BlockType, overrides: Partial<Block> = {}): string {
    const idx = blocks.value.findIndex(b => b.id === id)
    if (idx === -1) return id
    pushSnapshot()
    const newBlock = createDefaultBlock(type, overrides)
    blocks.value.splice(idx, 1, newBlock)
    return newBlock.id
  }

  return { addBlockAfter, addBlockAt, removeBlock, moveBlock, updateBlock, replaceBlock }
}
