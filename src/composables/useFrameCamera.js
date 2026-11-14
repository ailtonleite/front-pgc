/**
 * Frame de referência de uma câmera e suas dimensões originais.
 */

import { onScopeDispose, ref, toValue, watch } from 'vue'
import * as cameras from '@/api/cameras'

/** Lê as dimensões naturais da imagem. */
function medirImagem(url) {
  return new Promise((resolve, reject) => {
    const imagem = new Image()
    imagem.onload = () => resolve({ largura: imagem.naturalWidth, altura: imagem.naturalHeight })
    imagem.onerror = reject
    imagem.src = url
  })
}

/**
 * @param {string | import('vue').Ref<string>} cameraId se for um ref e mudar, o frame é recarregado
 * @param {object} [opcoes]
 * @param {number | null | import('vue').MaybeRefOrGetter<number | null>} [opcoes.atualizarACada]
 *   intervalo em ms entre capturas (contado a partir do fim da anterior); `null` desliga.
 *   Para depois de um erro, para não repetir a falha; `recarregar()` retoma.
 */
export function useFrameCamera(cameraId, { atualizarACada = null } = {}) {
  const url = ref(null)
  const largura = ref(0)
  const altura = ref(0)
  const carregando = ref(false)
  const erro = ref(null)

  // Identifica a requisição mais recente, para descartar respostas atrasadas
  let versao = 0
  let timer = null

  function liberarUrl() {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = null
  }

  /** Agenda a próxima captura automática, se ligada. */
  function agendar() {
    clearTimeout(timer)
    timer = null
    const intervalo = toValue(atualizarACada)
    if (intervalo && !erro.value && !carregando.value) timer = setTimeout(recarregar, intervalo)
  }

  /** Captura um novo frame. A imagem anterior continua na tela até a nova carregar. */
  async function recarregar() {
    const minhaVersao = ++versao
    clearTimeout(timer)
    carregando.value = true
    erro.value = null

    let novaUrl = null
    try {
      const blob = await cameras.capturarFrame(toValue(cameraId))
      novaUrl = URL.createObjectURL(blob)
      const dimensoes = await medirImagem(novaUrl)
      if (minhaVersao !== versao) {
        URL.revokeObjectURL(novaUrl)
        return
      }
      liberarUrl()
      url.value = novaUrl
      largura.value = dimensoes.largura
      altura.value = dimensoes.altura
    } catch (falha) {
      if (novaUrl) URL.revokeObjectURL(novaUrl)
      if (minhaVersao !== versao) return
      erro.value = falha?.response?.status === 503
        ? 'Não foi possível conectar à câmera.'
        : 'Não foi possível obter a imagem da câmera.'
    } finally {
      if (minhaVersao === versao) {
        carregando.value = false
        agendar()
      }
    }
  }

  watch(() => toValue(cameraId), recarregar, { immediate: true })
  watch(() => toValue(atualizarACada), agendar)

  // Equivale ao `onUnmounted` em um componente, e também funciona dentro de um `effectScope`
  onScopeDispose(() => {
    versao++
    clearTimeout(timer)
    liberarUrl()
  })

  return { url, largura, altura, carregando, erro, recarregar }
}
