import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuth } from './composables/useAuth'
import './style.css'

// Inicializa autenticação antes de montar o app
initAuth().then(() => {
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
})
