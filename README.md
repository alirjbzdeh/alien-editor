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
import type { MediaProvider } from 'alien-editor'

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

// Optional — omit this prop to keep the default @upload event behavior
const mediaProvider: MediaProvider = {
  async browse() {
    // open your gallery UI and return the selected image URL
    return 'https://example.com/image.jpg'
  },
  async upload(file: File) {
    // upload file to your server and return the URL
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    return data.url
  },
}

function handleUpload(file: File) {
  // called only when mediaProvider.upload is not provided
}
</script>

<template>
  <AlienEditor
    v-model="html"
    placeholder="Start writing..."
    :colors="colors"
    :modules="modules"
    :media-provider="mediaProvider"
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
| `mediaProvider` | `MediaProvider` | `undefined` | External gallery/upload bridge. See [Media Provider](#media-provider). |

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
| `upload` | `File` | Emitted when the user selects an image file and `mediaProvider.upload` is not provided. Parent is responsible for uploading and updating `v-model` with the URL. |

## Media Provider

The `mediaProvider` prop connects Alien Editor to an external gallery or media service. It is fully optional — omitting it preserves the original `@upload` event behavior exactly.

### Interface

```ts
interface MediaProvider {
  browse: () => Promise<string>          // opens external gallery, returns selected media URL
  upload?: (file: File) => Promise<string>  // optional: uploads file, returns URL
}
```

### Behavior

**`mediaProvider.browse`**

When provided, clicking the image toolbar button calls `await mediaProvider.browse()` instead of inserting an empty image block. The returned URL is injected into the editor as an image block automatically. While the promise is pending the toolbar button shows a loading spinner and is disabled. If the promise rejects, the button briefly shows an error indicator for 2 seconds.

**`mediaProvider.upload`**

When provided, dragging & dropping a file or using the file input in an image block calls `await mediaProvider.upload(file)` instead of emitting `@upload`. The returned URL is used to populate the image block automatically. While the promise is pending the upload button shows a spinner and loading text. If the promise rejects, an error message is shown briefly.

If `mediaProvider` is provided but `mediaProvider.upload` is **not**, file selection still falls back to emitting `@upload` as before.

### Backward Compatibility

Existing users who rely on `@upload` are completely unaffected. The `mediaProvider` prop is optional and defaults to `undefined`. All existing behavior is preserved when the prop is not passed.

### Custom Implementation Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { AlienEditor } from 'alien-editor'
import type { MediaProvider } from 'alien-editor'

const html = ref('')

const mediaProvider: MediaProvider = {
  async browse() {
    // Open your own gallery UI and return the selected URL
    return new Promise((resolve, reject) => {
      openMyGallery({
        onSelect: (url: string) => resolve(url),
        onCancel: () => reject(new Error('Cancelled')),
      })
    })
  },
  async upload(file: File) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    return data.url
  },
}
</script>

<template>
  <AlienEditor v-model="html" :media-provider="mediaProvider" />
</template>
```

### Integration with `alien-gallery`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { AlienEditor } from 'alien-editor'
import { useAlienGallery } from 'alien-gallery'

const html = ref('')
const mediaProvider = useAlienGallery()
</script>

<template>
  <AlienEditor v-model="html" :media-provider="mediaProvider" />
</template>
```

`useAlienGallery()` returns an object that satisfies the `MediaProvider` interface, wiring up the gallery's browse and upload capabilities directly.

## License

MIT
