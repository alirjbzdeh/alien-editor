import { defineNuxtModule, addComponent } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'alien-editor',
    configKey: 'alienEditor',
  },
  setup() {
    addComponent({
      name: 'AlienEditor',
      export: 'AlienEditor',
      filePath: 'alien-editor',
    })
  },
})
