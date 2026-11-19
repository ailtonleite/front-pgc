/**
 * Constantes compartilhadas pela interface. Sem dependências de Vue.
 */

/** Nome do sistema, usado no título da aba e no texto alternativo do logo. */
export const NOME_SISTEMA = 'EstacionAI'

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

/**
 * Apresentação das vagas preferenciais (idosos, PcD etc.). É uma característica da vaga,
 * independente do status: o mapa mostra o selo por cima da cor de livre/ocupada.
 */
export const PREFERENCIAL = Object.freeze({
  rotulo: 'Preferencial',
  cor: 'preferencial',
  icone: 'mdi-wheelchair-accessibility',
})

/** Papéis de usuário (`usuario.papel`), iguais ao `Role` do back-end. */
export const PAPEIS = Object.freeze({
  ADMIN: 'ADMIN',
  MOTORISTA: 'MOTORISTA',
  VISITANTE: 'VISITANTE',
})

/** Rótulo e ícone de cada papel, para exibição. */
export const PAPEIS_EXIBICAO = Object.freeze({
  ADMIN: Object.freeze({ rotulo: 'Administrador', icone: 'mdi-shield-account' }),
  MOTORISTA: Object.freeze({ rotulo: 'Motorista', icone: 'mdi-car' }),
  VISITANTE: Object.freeze({ rotulo: 'Visitante', icone: 'mdi-account-outline' }),
})

/** Opções do `v-select` de tipo de fonte da câmera (`title`/`value` do Vuetify). */
export const TIPOS_FONTE = Object.freeze([
  { value: 'arquivo', title: 'Arquivo de vídeo' },
  { value: 'rtsp', title: 'Câmera IP (RTSP)' },
  { value: 'kinesis', title: 'Amazon Kinesis Video' },
])

/**
 * Opções de granularidade do histórico (`title`/`value` do Vuetify).
 * `minuto` só vale para intervalos de até `LIMITE_POR_MINUTO_MS` (60 pontos no gráfico).
 */
export const GRANULARIDADES = Object.freeze([
  { value: 'minuto', title: 'Por minuto' },
  { value: 'hora', title: 'Por hora' },
  { value: 'dia', title: 'Por dia' },
  { value: 'semana', title: 'Por semana' },
])

/** Maior intervalo do histórico com granularidade `minuto`: 1 hora. */
export const LIMITE_POR_MINUTO_MS = 60 * 60 * 1000

/**
 * Placa no formato antigo (`AAA1234`) ou Mercosul (`AAA1A23`).
 * Aceita minúsculas e hífen, como o back-end, que normaliza a placa antes de validar.
 */
export const REGEX_PLACA = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/i
