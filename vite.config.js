import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

/**
 * Todos os componentes públicos do Vuetify (`vuetify/components/VBtn`, ...), lidos do índice
 * do pacote instalado. Pastas fora do índice são internas (ex.: `VOverflowBtn`, incompleta).
 *
 * O `vite-plugin-vuetify` só insere os imports ao compilar cada `.vue`, então o Vite não os
 * enxerga na varredura inicial. Sem esta lista, a primeira visita a uma tela com um
 * componente novo faz o Vite empacotá-lo e recarregar a página ("optimized dependencies
 * changed. reloading"), cancelando a navegação. Afeta só o `npm run dev`.
 */
const componentesVuetify = [
  ...readFileSync(
    fileURLToPath(new URL('./node_modules/vuetify/lib/components/index.js', import.meta.url)),
    'utf8',
  ).matchAll(/^export \* from "\.\/(V\w+)\/index\.js";/gm),
].map(([, nome]) => `vuetify/components/${nome}`)

export default defineConfig({
  // `vite-plugin-vuetify` importa automaticamente só os componentes usados
  plugins: [vue(), vuetify({ autoImport: true })],
  optimizeDeps: {
    include: ['vuetify', 'vuetify/locale', 'vuetify/labs/VDateInput', ...componentesVuetify],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Front e API na mesma origem em desenvolvimento: cookie, CORS e SSE funcionam sem configuração extra
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
})
