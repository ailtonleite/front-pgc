/**
 * Constantes compartilhadas pela interface. Sem dependências de Vue.
 */

/**
 * Apresentação de cada `SpotStatus` do back-end.
 * - `cor`: token do tema Vuetify (ver `plugins/vuetify.js`)
 * - `icone`: ícone mdi
 * - `padrao`: id do `<pattern>` SVG usado no preenchimento (`null` = cor sólida),
 *   para que o status não seja indicado só pela cor (RNF02)
 */
export const STATUS = Object.freeze({
  LIVRE: Object.freeze({
    rotulo: 'Livre',
    cor: 'livre',
    icone: 'mdi-check-circle',
    padrao: null,
  }),
  OCUPADA: Object.freeze({
    rotulo: 'Ocupada',
    cor: 'ocupada',
    icone: 'mdi-car',
    padrao: 'padrao-hachura',
  }),
  DESCONHECIDA: Object.freeze({
    rotulo: 'Desconhecida',
    cor: 'desconhecida',
    icone: 'mdi-help-circle',
    padrao: 'padrao-pontilhado',
  }),
})

/** Papéis de usuário (`usuario.papel`). */
export const PAPEIS = Object.freeze({
  ADMIN: 'ADMIN',
  MOTORISTA: 'MOTORISTA',
})

/** Opções do `v-select` de tipo de fonte da câmera (`title`/`value` do Vuetify). */
export const TIPOS_FONTE = Object.freeze([
  { value: 'arquivo', title: 'Arquivo de vídeo' },
  { value: 'rtsp', title: 'Câmera IP (RTSP)' },
  { value: 'kinesis', title: 'Amazon Kinesis Video' },
])

/** Opções de granularidade do histórico (`title`/`value` do Vuetify). */
export const GRANULARIDADES = Object.freeze([
  { value: 'hora', title: 'Por hora' },
  { value: 'dia', title: 'Por dia' },
  { value: 'semana', title: 'Por semana' },
])

/**
 * Placa no formato antigo (`AAA1234`) ou Mercosul (`AAA1A23`).
 * Aceita minúsculas e hífen, como o back-end, que normaliza a placa antes de validar.
 */
export const REGEX_PLACA = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/i
