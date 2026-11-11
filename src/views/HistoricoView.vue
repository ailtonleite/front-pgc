<script setup>
/**
 * Histórico e relatórios de ocupação (RF04, UC06, UC07).
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as estacionamentosApi from '@/api/estacionamentos'
import * as historicoApi from '@/api/historico'
import { usePeriodo } from '@/composables/usePeriodo'
import EstadoVazio from '@/components/comum/EstadoVazio.vue'
import CardsRelatorio from '@/components/historico/CardsRelatorio.vue'
import FiltroPeriodo from '@/components/historico/FiltroPeriodo.vue'
import GraficoOcupacao from '@/components/historico/GraficoOcupacao.vue'
import TabelaHistorico from '@/components/historico/TabelaHistorico.vue'

const route = useRoute()
const estacionamentoId = computed(() => route.params.id)

const periodo = usePeriodo()
const { descricao } = periodo

const nomeEstacionamento = ref('')
const snapshots = ref([])
/** Granularidade dos dados exibidos (a do filtro muda antes de a nova consulta responder). */
const granularidadeDosDados = ref('hora')
const relatorio = ref(null)
const carregando = ref(false)
const visualizacao = ref('grafico')

watch(estacionamentoId, (id) => {
  nomeEstacionamento.value = ''
  estacionamentosApi.listar().then((lista) => {
    if (id === estacionamentoId.value) nomeEstacionamento.value = lista.find((e) => e.id === id)?.nome ?? ''
  }).catch(() => {})
}, { immediate: true })

// Identifica a consulta mais recente, para descartar respostas de filtros anteriores
let versao = 0

watch([estacionamentoId, periodo.params], async ([id, params]) => {
  const minhaVersao = ++versao
  carregando.value = true
  try {
    const [novosSnapshots, novoRelatorio] = await Promise.all([
      historicoApi.consultar(id, params),
      historicoApi.relatorio(id, params),
    ])
    if (minhaVersao !== versao) return
    snapshots.value = novosSnapshots
    granularidadeDosDados.value = params.granularidade
    relatorio.value = novoRelatorio
  } catch {
    if (minhaVersao !== versao) return
    snapshots.value = []
    relatorio.value = null
  } finally {
    if (minhaVersao === versao) carregando.value = false
  }
}, { immediate: true })
</script>

<template>
  <v-container>
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" aria-label="Voltar" :to="{ name: 'admin-estacionamentos' }" />
      <div>
        <h1 class="text-h5">Histórico{{ nomeEstacionamento ? ` — ${nomeEstacionamento}` : '' }}</h1>
        <div class="text-body-2 text-medium-emphasis">{{ descricao }}</div>
      </div>
    </div>

    <FiltroPeriodo :periodo="periodo" class="mb-4" />
    <CardsRelatorio :relatorio="relatorio" :carregando="carregando" class="mb-4" />

    <v-card>
      <div class="d-flex align-center pa-2">
        <v-btn-toggle v-model="visualizacao" mandatory density="compact" variant="outlined" divided>
          <v-btn value="grafico" prepend-icon="mdi-chart-line">Gráfico</v-btn>
          <v-btn value="tabela" prepend-icon="mdi-table">Tabela</v-btn>
        </v-btn-toggle>
      </div>
      <v-progress-linear v-if="carregando" indeterminate color="primary" />
      <v-card-text>
        <EstadoVazio
          v-if="!carregando && !snapshots.length"
          icone="mdi-chart-line-variant"
          titulo="Sem dados no período"
          texto="Escolha outro período ou verifique se as câmeras estão em monitoramento."
        />
        <template v-else-if="snapshots.length">
          <GraficoOcupacao v-if="visualizacao === 'grafico'" :snapshots="snapshots" :granularidade="granularidadeDosDados" />
          <TabelaHistorico v-else :snapshots="snapshots" />
        </template>
      </v-card-text>
    </v-card>
  </v-container>
</template>
