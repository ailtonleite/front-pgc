/**
 * Estado do filtro de período do histórico.
 *
 * O período é sempre `inicio`/`fim` (datas) + `horaInicio`/`horaFim` (`"HH:MM"`).
 * Os atalhos só preenchem esses campos; no "Personalizado" a pessoa os edita.
 * Assim, ao trocar de um atalho para "Personalizado", o período atual é mantido.
 */

import { computed, ref, watch } from 'vue'
import { GRANULARIDADES, LIMITE_POR_MINUTO_MS } from '@/utils/constantes'
import { comHora, paraHoraMinuto } from '@/utils/datas'

const DIA_INTEIRO = { horaInicio: '00:00', horaFim: '23:59' }

/** Período e granularidade sugerida de cada atalho (`personalizado` mantém o que estiver). */
const ATALHOS = {
  ultimaHora: () => {
    const agora = new Date()
    // Os 60 minutos que terminam no minuto atual (ex.: 14:06 a 15:05, se agora são 15:05)
    const inicio = new Date(agora.getTime() - LIMITE_POR_MINUTO_MS + 60_000)
    return {
      inicio,
      fim: agora,
      horaInicio: paraHoraMinuto(inicio),
      horaFim: paraHoraMinuto(agora),
      granularidade: 'minuto',
    }
  },
  hoje: () => ({ inicio: new Date(), fim: new Date(), ...DIA_INTEIRO, granularidade: 'hora' }),
  '7dias': () => {
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - 6)
    return { inicio, fim: new Date(), ...DIA_INTEIRO, granularidade: 'dia' }
  },
  mes: () => {
    const inicio = new Date()
    inicio.setDate(1)
    return { inicio, fim: new Date(), ...DIA_INTEIRO, granularidade: 'dia' }
  },
}

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function usePeriodo() {
  const atalho = ref('hoje')
  const inicio = ref(new Date())
  const fim = ref(new Date())
  const horaInicio = ref(DIA_INTEIRO.horaInicio)
  const horaFim = ref(DIA_INTEIRO.horaFim)
  const granularidade = ref('hora')

  function aplicarAtalho(nome) {
    const calcular = ATALHOS[nome]
    if (!calcular) return
    const sugestao = calcular()
    inicio.value = sugestao.inicio
    fim.value = sugestao.fim
    horaInicio.value = sugestao.horaInicio
    horaFim.value = sugestao.horaFim
    granularidade.value = sugestao.granularidade
  }

  watch(atalho, aplicarAtalho, { immediate: true })

  /** Instantes exatos do período (`null` se alguma hora estiver incompleta). */
  const momentoInicio = computed(() => comHora(inicio.value, horaInicio.value))
  const momentoFim = computed(() => comHora(fim.value, horaFim.value, { fimDoMinuto: true }))

  /** Duração do período em ms (0 se inválido). */
  const duracao = computed(() =>
    momentoInicio.value && momentoFim.value ? momentoFim.value - momentoInicio.value : 0,
  )

  /**
   * "Por minuto" só para períodos de até 1 hora. O minuto final conta inteiro, então
   * "14:00 a 15:00" (61 minutos) ainda é aceito como 1 hora.
   */
  const permitePorMinuto = computed(() => duracao.value > 0 && duracao.value <= LIMITE_POR_MINUTO_MS + 60_000)

  /** Mensagem do problema que impede a consulta, ou `null`. */
  const erro = computed(() => {
    if (!momentoInicio.value || !momentoFim.value) return 'Informe as horas de início e fim.'
    if (duracao.value <= 0) return 'O início do período deve ser anterior ao fim.'
    if (granularidade.value === 'minuto' && !permitePorMinuto.value) {
      return '"Por minuto" só vale para períodos de até 1 hora.'
    }
    return null
  })

  /** Pronto para `api/historico.js`; `null` enquanto houver `erro`. */
  const params = computed(() => {
    if (erro.value) return null
    return { inicio: momentoInicio.value, fim: momentoFim.value, granularidade: granularidade.value }
  })

  /**
   * Ex.: "25/10/2026, por hora", "19/10/2026 a 25/10/2026, por dia" ou
   * "25/10/2026 14:06 a 15:05, por minuto".
   */
  const descricao = computed(() => {
    const de = formatoData.format(inicio.value)
    const ate = formatoData.format(fim.value)
    const diaInteiro = horaInicio.value === DIA_INTEIRO.horaInicio && horaFim.value === DIA_INTEIRO.horaFim
    let intervalo
    if (diaInteiro) intervalo = de === ate ? de : `${de} a ${ate}`
    else if (de === ate) intervalo = `${de} ${horaInicio.value} a ${horaFim.value}`
    else intervalo = `${de} ${horaInicio.value} a ${ate} ${horaFim.value}`
    const rotulo = GRANULARIDADES.find((g) => g.value === granularidade.value)?.title ?? ''
    return `${intervalo}, ${rotulo.toLowerCase()}`
  })

  return {
    atalho,
    inicio,
    fim,
    horaInicio,
    horaFim,
    granularidade,
    permitePorMinuto,
    erro,
    params,
    descricao,
  }
}
