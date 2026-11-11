/**
 * Vuetify: tema UFABC, cores de status, locale pt-BR e componentes de laboratório.
 */

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { pt } from 'vuetify/locale'
import { VDateInput } from 'vuetify/labs/VDateInput'

export default createVuetify({
  // Componente de laboratório: não entra na importação automática do `vite-plugin-vuetify`
  components: { VDateInput },
  locale: {
    locale: 'pt',
    fallback: 'en',
    messages: { pt },
  },
  // Formato das datas do seletor (dd/mm/aaaa)
  date: {
    locale: { pt: 'pt-BR' },
  },
  theme: {
    defaultTheme: 'ufabc',
    themes: {
      ufabc: {
        dark: false,
        colors: {
          primary: '#006747', // verde UFABC
          secondary: '#FDB515', // amarelo UFABC
          // Status das vagas: contraste mínimo de 4,5:1 com o texto branco do rótulo
          livre: '#2E7D32',
          ocupada: '#C62828',
          desconhecida: '#757575',
        },
      },
    },
  },
})
