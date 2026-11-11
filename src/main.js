import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

// Pinia antes do router: a primeira navegação começa na instalação do router, e a guarda usa as stores
createApp(App)
  .use(createPinia())
  .use(vuetify)
  .use(router)
  .mount('#app')
