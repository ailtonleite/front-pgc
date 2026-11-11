/**
 * Conexão SSE com `/estacionamentos/{id}/eventos`, que mantém a `ocupacaoStore` atualizada.
 */

import { onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { urlEventos } from '@/api/ocupacao'
import { useAuthStore } from '@/stores/auth'
import { useOcupacaoStore } from '@/stores/ocupacao'
import { useSessaoStore } from '@/stores/sessao'

const LIMITE_DESCONECTADO_MS = 30_000
const ESPERA_REABRIR_MS = 5_000

/**
 * @param {import('vue').Ref<string>} estacionamentoId se mudar, a conexão é reaberta
 * @returns {{ conectado: import('vue').Ref<boolean> }}
 */
export function useEventosVagas(estacionamentoId) {
  const ocupacaoStore = useOcupacaoStore()
  const sessaoStore = useSessaoStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  const { conectado } = storeToRefs(ocupacaoStore)

  let fonte = null
  let houveQueda = false
  let timerVerificacao = null
  let timerReabrir = null

  function aoReceberVaga(evento) {
    const { vaga_id, status_novo, timestamp } = JSON.parse(evento.data)
    ocupacaoStore.atualizarVaga(vaga_id, status_novo, timestamp)
    // O back-end encerra sozinho a sessão quando a vaga do motorista fica livre
    if (status_novo === 'LIVRE' && vaga_id === sessaoStore.vagaId) {
      sessaoStore.carregar()
    }
  }

  function aoAbrir() {
    conectado.value = true
    clearTimeout(timerVerificacao)
    timerVerificacao = null
    // Eventos perdidos durante a queda não são reenviados
    if (houveQueda) {
      houveQueda = false
      ocupacaoStore.carregar()
    }
  }

  function aoFalhar() {
    conectado.value = false
    houveQueda = true

    // O `EventSource` não passa pelo interceptador de 401 do Axios
    timerVerificacao ??= setTimeout(verificarSessao, LIMITE_DESCONECTADO_MS)

    // Em erros HTTP (ex.: 401, 502) o navegador desiste (CLOSED) em vez de reconectar
    if (fonte.readyState === EventSource.CLOSED) {
      clearTimeout(timerReabrir)
      timerReabrir = setTimeout(() => abrir(estacionamentoId.value), ESPERA_REABRIR_MS)
    }
  }

  async function verificarSessao() {
    timerVerificacao = null
    await authStore.carregar({ forcar: true })
    if (!authStore.autenticado) {
      router.push({ name: 'login', query: { redirect: route.fullPath } })
    }
  }

  function fecharFonte() {
    fonte?.close()
    fonte = null
    clearTimeout(timerReabrir)
    timerReabrir = null
  }

  /** Abre a conexão. Ao reabrir após uma queda, mantém a verificação de sessão em andamento. */
  function abrir(id) {
    fecharFonte()
    if (!id) return

    fonte = new EventSource(urlEventos(id), { withCredentials: true })
    fonte.addEventListener('vaga', aoReceberVaga)
    fonte.onopen = aoAbrir
    fonte.onerror = aoFalhar
  }

  function fechar() {
    fecharFonte()
    clearTimeout(timerVerificacao)
    timerVerificacao = null
    houveQueda = false
    conectado.value = false
  }

  watch(estacionamentoId, (id) => {
    fechar()
    abrir(id)
  }, { immediate: true })

  onUnmounted(fechar)

  return { conectado }
}
