/**
 * Estado em tempo real das vagas do estacionamento aberto no mapa.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as ocupacaoApi from '@/api/ocupacao'

export const useOcupacaoStore = defineStore('ocupacao', () => {
  const estacionamentoId = ref(null)
  const vagasPorId = ref({})
  const carregando = ref(false)
  const conectado = ref(false)
  const ultimaAtualizacao = ref(null)

  /** Ordenadas por rótulo, com "A-2" antes de "A-10". */
  const vagas = computed(() =>
    Object.values(vagasPorId.value).sort((a, b) =>
      a.rotulo.localeCompare(b.rotulo, 'pt-BR', { numeric: true }),
    ),
  )

  const vagasPorCamera = computed(() => {
    const grupos = {}
    for (const vaga of vagas.value) {
      ;(grupos[vaga.camera_id] ??= []).push(vaga)
    }
    return grupos
  })

  /** Mesma regra de `OccupancySnapshot` no back-end: `DESCONHECIDA` conta só no total. */
  const totais = computed(() => {
    const total = vagas.value.length
    const livres = vagas.value.filter((vaga) => vaga.status === 'LIVRE').length
    const ocupadas = vagas.value.filter((vaga) => vaga.status === 'OCUPADA').length
    return { total, livres, ocupadas, taxa_ocupacao: total ? ocupadas / total : 0 }
  })

  /**
   * Busca as vagas. Sem argumento, ressincroniza o estacionamento atual (ex.: após queda do SSE),
   * mantendo as vagas na tela até a resposta chegar.
   */
  async function carregar(id = estacionamentoId.value) {
    if (id !== estacionamentoId.value) {
      estacionamentoId.value = id
      vagasPorId.value = {}
    }
    carregando.value = true
    try {
      const lista = await ocupacaoApi.estadoAtual(id)
      // Descarta a resposta se o usuário saiu do mapa ou trocou de estacionamento
      if (id === estacionamentoId.value) {
        vagasPorId.value = Object.fromEntries(lista.map((vaga) => [vaga.id, vaga]))
      }
    } finally {
      if (id === estacionamentoId.value) carregando.value = false
    }
  }

  /** Aplica um evento SSE. Ignora vagas desconhecidas (ex.: recém-demarcadas, até a próxima carga). */
  function atualizarVaga(vagaId, status, timestamp) {
    const vaga = vagasPorId.value[vagaId]
    if (!vaga) return
    vaga.status = status
    vaga.atualizado_em = timestamp
    ultimaAtualizacao.value = timestamp
  }

  function limpar() {
    estacionamentoId.value = null
    vagasPorId.value = {}
    carregando.value = false
    conectado.value = false
    ultimaAtualizacao.value = null
  }

  return {
    estacionamentoId,
    vagasPorId,
    carregando,
    conectado,
    ultimaAtualizacao,
    vagas,
    vagasPorCamera,
    totais,
    carregar,
    atualizarVaga,
    limpar,
    // Stores com sintaxe setup não têm `$reset` próprio
    $reset: limpar,
  }
})
