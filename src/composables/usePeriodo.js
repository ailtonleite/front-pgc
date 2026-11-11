/**
 * Estado do filtro de período do histórico.
 */

import { computed, ref, watch } from 'vue'
import { GRANULARIDADES } from '@/utils/constantes'
import { fimDoDia, inicioDoDia } from '@/utils/datas'

/** Intervalo e granularidade sugerida de cada atalho (`personalizado` mantém o que estiver). */
const ATALHOS = {
  hoje: () => ({ inicio: inicioDoDia(new Date()), granularidade: 'hora' }),
  '7dias': () => {
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - 6)
    return { inicio: inicioDoDia(inicio), granularidade: 'dia' }
  },
  mes: () => {
    const inicio = new Date()
    inicio.setDate(1)
    return { inicio: inicioDoDia(inicio), granularidade: 'dia' }
  },
}

const formatarData = (data) => data.toLocaleDateString('pt-BR')

export function usePeriodo() {
  const atalho = ref('hoje')
  const inicio = ref(new Date())
  const fim = ref(new Date())
  const granularidade = ref('hora')

  function aplicarAtalho(nome) {
    const calcular = ATALHOS[nome]
    if (!calcular) return
    const sugestao = calcular()
    inicio.value = sugestao.inicio
    fim.value = fimDoDia(new Date())
    granularidade.value = sugestao.granularidade
  }

  watch(atalho, aplicarAtalho, { immediate: true })

  /** Pronto para `api/historico.js`. Dias inteiros, mesmo que o seletor devolva 00:00 no fim. */
  const params = computed(() => ({
    inicio: inicioDoDia(inicio.value),
    fim: fimDoDia(fim.value),
    granularidade: granularidade.value,
  }))

  /** Ex.: "25/10/2026, por hora" ou "19/10/2026 a 25/10/2026, por dia". */
  const descricao = computed(() => {
    const de = formatarData(inicio.value)
    const ate = formatarData(fim.value)
    const intervalo = de === ate ? de : `${de} a ${ate}`
    const rotulo = GRANULARIDADES.find((g) => g.value === granularidade.value)?.title ?? ''
    return `${intervalo}, ${rotulo.toLowerCase()}`
  })

  return { atalho, inicio, fim, granularidade, params, descricao }
}
