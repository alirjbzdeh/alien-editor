# alien-editor

A Vue 3 block-based rich text editor with native Tailwind CSS integration. No heavy dependencies — built entirely on `contenteditable` and the browser's Selection/Range APIs.

## Features

- **Block-based editing** — paragraphs, headings (H1–H6), images, videos, code blocks, dividers, buttons, blockquotes, ordered/unordered lists
- **Rich text formatting** — bold, italic, underline, strikethrough, font size, font weight, text alignment, links
- **Tailwind CSS** — all styles are applied as Tailwind utility classes in the HTML output
- **Custom colors** — searchable color picker driven by a prop
- **Module injection** — insert custom HTML blocks from a searchable dropdown
- **Media upload** — file input + URL paste for images; emits `@upload` for parent handling
- **Drag & drop** — reorder blocks with native HTML5 drag-and-drop
- **Undo / Redo** — full history with Ctrl+Z / Ctrl+Y
- **Three view modes** — Edit, Code (raw HTML), Preview (rendered output)
- **v-model support** — emits raw HTML string on every change
- **Nuxt 3 compatible** — SSR-safe, ships a Nuxt module

---

## Installation

```bash
npm install alien-editor
```

---

## Usage — Vue 3

### Global registration (recommended)

```js
// main.js / main.ts
import { createApp } from 'vue'
import AlienEditorPlugin from 'alien-editor'
import 'alien-editor/dist/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(AlienEditorPlugin)
app.mount('#app')
```

### Per-component import

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { AlienEditor } from 'alien-editor'
import 'alien-editor/dist/style.css'

const html = ref('<p>Hello world!</p>')

const colors = [
  { title: 'Rose', key: 'rose', class: 'text-rose-500' },
  { title: 'Blue', key: 'blue', class: 'text-blue-600' },
  { title: 'Green', key: 'green', class: 'text-green-600' },
]

const modules = [
  {
    title: 'Call to Action',
    key: 'cta',
    module: '<div class="bg-blue-600 text-white p-6 rounded-xl text-center"><h2 class="text-2xl font-bold">Get Started</h2><p>Sign up today.</p></div>',
  },
]

function handleUpload(file: File) {
  // Upload the file to your server, then update v-model with the returned URL
  console.log('File selected:', file.name)
}
</script>

<template>
  <AlienEditor
    v-model="html"
    placeholder="Start writing..."
    :colors="colors"
    :modules="modules"
    @upload="handleUpload"
  />
</template>
```

---

## Usage — Nuxt 3

Add the module to `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['alien-editor/nuxt'],
  css: ['alien-editor/dist/style.css'],
})
```

Then use the component anywhere — it's auto-imported:

```vue
<script setup lang="ts">
const html = ref('')

function handleUpload(file: File) {
  // Upload to your storage, get URL, then set it via v-model
}
</script>

<template>
  <AlienEditor
    v-model="html"
    placeholder="Write something..."
    @upload="handleUpload"
  />
</template>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | The HTML content of the editor. Supports `v-model`. |
| `placeholder` | `string` | `'Start writing...'` | Placeholder text shown in empty blocks. |
| `colors` | `ColorOption[]` | `[]` | Custom color options for the text color picker. When empty, the picker is hidden. |
| `modules` | `ModuleOption[]` | `[]` | Custom HTML blocks for the module inserter dropdown. When empty, the dropdown is hidden. |

### `ColorOption`

```ts
interface ColorOption {
  title: string  // Display name, e.g. "Rose Red"
  key: string    // Short identifier, e.g. "rose"
  class: string  // Tailwind class, e.g. "text-rose-500"
}
```

### `ModuleOption`

```ts
interface ModuleOption {
  title: string  // Display name, e.g. "Call to Action"
  key: string    // Short identifier, e.g. "cta"
  module: string // Raw HTML string to inject as a block
}
```

---

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string` | Emitted on every content change with the full HTML output. Used by `v-model`. |
| `upload` | `File` | Emitted when the user selects an image file. The parent is responsible for uploading and providing a URL back via `v-model`. |

### Handling `@upload`

```vue
<script setup lang="ts">
const html = ref('')

async function handleUpload(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const { url } = await res.json()

  // Replace the temporary local blob URL with the real URL
  html.value = html.value.replace(/blob:[^"]+/, url)
}
</script>

<template>
  <AlienEditor v-model="html" @upload="handleUpload" />
</template>
```

---

## Tailwind CSS Setup

`alien-editor` writes Tailwind utility classes directly into the HTML output. Because Tailwind purges unused classes by default, you must include the package in your `tailwind.config.js` `content` array so that class names like `font-bold`, `text-center`, `text-rose-500` etc. are preserved:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{vue,js,ts}',
    './node_modules/alien-editor/dist/**/*.js',  // ← add this
  ],
  // ...
}
```

Or use `safelist` if you need specific dynamic classes:

```js
module.exports = {
  content: ['./src/**/*.{vue,js,ts}'],
  safelist: [
    // Alignment classes (dynamically assembled)
    'text-left', 'text-center', 'text-right', 'text-justify',
    // Font size classes
    { pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)$/ },
    // Font weight classes
    { pattern: /^font-(thin|light|normal|medium|semibold|bold|extrabold|black)$/ },
    // Your custom color classes
    'text-rose-500', 'text-blue-600', 'text-green-600',
  ],
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Y` / `Cmd+Y` or `Ctrl+Shift+Z` | Redo |
| `Enter` in a text block | Create new paragraph below |
| `Backspace` on empty block | Delete block, focus previous |
| `Enter` in a list item | Add new list item |

---

## Building from Source

```bash
cd alien-editor
npm install
npm run build
```

Output is placed in `dist/`:
- `dist/alien-editor.js` — ESM bundle
- `dist/alien-editor.umd.cjs` — UMD bundle
- `dist/style.css` — component styles

---

## License

MIT
