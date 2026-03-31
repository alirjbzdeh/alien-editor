# alien-editor

A Vue 3 block-based rich text editor with Tailwind CSS integration.

## Installation

```bash
npm install alien-editor
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { AlienEditor } from 'alien-editor'

const html = ref('')

const colors = [
  { title: 'Rose', key: 'rose', class: 'text-rose-500' },
  { title: 'Blue', key: 'blue', class: 'text-blue-600' },
]

const modules = [
  {
    title: 'Call to Action',
    key: 'cta',
    module: '<div class="bg-blue-600 text-white p-6 rounded-xl text-center"><h2 class="text-2xl font-bold">Get Started</h2></div>',
  },
]

function handleUpload(file: File) {
  // upload file to your server, then update v-model with the returned URL
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

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | The HTML content. Use with `v-model`. |
| `placeholder` | `string` | `'Start writing...'` | Placeholder shown in empty blocks. |
| `colors` | `ColorOption[]` | `[]` | Color options for the text color picker. Hidden when empty. |
| `modules` | `ModuleOption[]` | `[]` | Custom HTML blocks for the module inserter dropdown. Hidden when empty. |

### `ColorOption`

```ts
interface ColorOption {
  title: string  // Display name, e.g. "Rose Red"
  key: string    // Short identifier, e.g. "rose"
  class: string  // Tailwind class applied to text, e.g. "text-rose-500"
}
```

### `ModuleOption`

```ts
interface ModuleOption {
  title: string  // Display name shown in the dropdown
  key: string    // Short identifier
  module: string // Raw HTML string inserted as a block
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string` | Emitted on every change with the full HTML output. Used by `v-model`. |
| `upload` | `File` | Emitted when the user selects an image. Parent is responsible for uploading and updating `v-model` with the URL. |

## License

MIT
