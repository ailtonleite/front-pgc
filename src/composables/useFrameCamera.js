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
 */
export function useFrameCamera(cameraId) {
  const url = ref(null)
  const largura = ref(0)
  const altura = ref(0)
  const carregando = ref(false)
  const erro = ref(null)

  // Identifica a requisição mais recente, para descartar respostas atrasadas
  let versao = 0

  function liberarUrl() {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = null
  }

  /** Captura um novo frame (revoga a URL anterior). */
  async function recarregar() {
    const minhaVersao = ++versao
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
      if (minhaVersao === versao) carregando.value = false
    }
  }

  watch(() => toValue(cameraId), recarregar, { immediate: true })

  // Equivale ao `onUnmounted` em um componente, e também funciona dentro de um `effectScope`
  onScopeDispose(() => {
    versao++
    liberarUrl()
  })

  return { url, largura, altura, carregando, erro, recarregar }
}
