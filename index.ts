import type { App } from 'vue'
import AlienEditor from './src/components/AlienEditor.vue'
export { AlienEditor }
export * from './src/types/index'

// Vue plugin: app.use(AlienEditorPlugin)
export default {
  install(app: App) {
    app.component('AlienEditor', AlienEditor)
  },
}
