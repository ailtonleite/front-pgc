/**
 * Endereço de estacionamento (`EnderecoOut` do back-end):
 * `{ rua, numero, complemento, bairro, cidade, estado, cep }`, com `complemento` opcional,
 * `estado` como sigla da UF e `cep` só com os 8 dígitos. Sem dependências de Vue.
 */

/** Siglas das UFs aceitas pelo back-end, em ordem alfabética. */
export const UFS = Object.freeze([
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
])

/** Campos do endereço, na ordem em que o back-end os declara. */
export const CAMPOS_ENDERECO = Object.freeze(['rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep'])

/**
 * CEP com 8 dígitos, aceitando hífen, ponto e espaços como separadores (mesma regra do back-end).
 * @param {string | null | undefined} cep
 * @returns {boolean}
 */
export function cepValido(cep) {
  return /^\d{8}$/.test((cep ?? '').replace(/[\s.-]/g, ''))
}

/**
 * Remove tudo que não é dígito do CEP.
 * @param {string | null | undefined} cep
 * @returns {string}
 */
export function somenteDigitosCep(cep) {
  return (cep ?? '').replace(/\D/g, '')
}

/**
 * `09210580` → `09210-580`. Devolve o valor original se não tiver 8 dígitos.
 * @param {string | null | undefined} cep
 * @returns {string}
 */
export function formatarCep(cep) {
  const digitos = somenteDigitosCep(cep)
  return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : (cep ?? '')
}

/**
 * Endereço vazio, para iniciar o formulário.
 * @returns {Record<string, string>}
 */
export function enderecoVazio() {
  return Object.fromEntries(CAMPOS_ENDERECO.map((campo) => [campo, '']))
}

/**
 * Indica se nenhum campo do endereço foi preenchido (o endereço todo é opcional).
 * @param {Record<string, string | null> | null | undefined} endereco
 * @returns {boolean}
 */
export function enderecoEstaVazio(endereco) {
  return !endereco || CAMPOS_ENDERECO.every((campo) => !endereco[campo]?.trim())
}

/**
 * Converte o formulário no `EnderecoIn` do back-end: textos aparados, UF em maiúsculas,
 * CEP só com dígitos e complemento vazio como `null`. Formulário vazio vira `null`.
 * @param {Record<string, string | null>} formulario
 * @returns {object | null}
 */
export function paraEnderecoIn(formulario) {
  if (enderecoEstaVazio(formulario)) return null
  const texto = (campo) => (formulario[campo] ?? '').trim()
  return {
    rua: texto('rua'),
    numero: texto('numero'),
    complemento: texto('complemento') || null,
    bairro: texto('bairro'),
    cidade: texto('cidade'),
    estado: texto('estado').toUpperCase(),
    cep: somenteDigitosCep(formulario.cep),
  }
}

/**
 * Linha principal: `Av. dos Estados, 5001 - Bloco A`.
 * @param {object | null | undefined} endereco `EnderecoOut`
 * @returns {string}
 */
export function formatarLogradouro(endereco) {
  if (!endereco) return ''
  const linha = `${endereco.rua}, ${endereco.numero}`
  return endereco.complemento ? `${linha} - ${endereco.complemento}` : linha
}

/**
 * Linha secundária: `Bangu, Santo André - SP, 09210-580`.
 * @param {object | null | undefined} endereco `EnderecoOut`
 * @returns {string}
 */
export function formatarLocalidade(endereco) {
  if (!endereco) return ''
  return `${endereco.bairro}, ${endereco.cidade} - ${endereco.estado}, ${formatarCep(endereco.cep)}`
}

/**
 * Endereço completo em uma linha. `null` vira texto vazio.
 * @param {object | null | undefined} endereco `EnderecoOut`
 * @returns {string}
 */
export function formatarEndereco(endereco) {
  if (!endereco) return ''
  return `${formatarLogradouro(endereco)} - ${formatarLocalidade(endereco)}`
}
