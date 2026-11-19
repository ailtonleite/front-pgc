<script setup>
/**
 * Filtro de período do histórico. Recebe o retorno de `usePeriodo()` e altera seus refs.
 */
import { computed } from 'vue'
import { GRANULARIDADES } from '@/utils/constantes'

const props = defineProps({
  periodo: { type: Object, required: true },
})

// O objeto de `usePeriodo()` não muda; desestruturar mantém os refs (e o desembrulho no template)
const { atalho, inicio, fim, horaInicio, horaFim, granularidade, permitePorMinuto, erro } = props.periodo

const ATALHOS = [
  { valor: 'ultimaHora', titulo: 'Última hora' },
  { valor: 'hoje', titulo: 'Hoje' },
  { valor: '7dias', titulo: '7 dias' },
  { valor: 'mes', titulo: 'Mês' },
  { valor: 'personalizado', titulo: 'Personalizado' },
]

const hoje = new Date()

/** O seletor em modo intervalo trabalha com uma lista de datas; usa a primeira e a última. */
const intervalo = computed({
  get: () => [inicio.value, fim.value],
  set: (datas) => {
    if (!datas?.length) return
    const ordenadas = [...datas].sort((a, b) => a - b)
    inicio.value = ordenadas[0]
    fim.value = ordenadas.at(-1)
  },
})

/** "Por minuto" fica desabilitado (com explicação) em períodos maiores que 1 hora. */
const opcoesGranularidade = computed(() =>
  GRANULARIDADES.map((opcao) => {
    const bloqueada = opcao.value === 'minuto' && !permitePorMinuto.value
    return { ...opcao, props: bloqueada ? { disabled: true, subtitle: 'Períodos de até 1 hora' } : {} }
  }),
)

/** Erro mostrado junto do campo responsável. */
const erroHoras = computed(() => (erro.value && granularidade.value !== 'minuto' ? erro.value : null))
const erroGranularidade = computed(() =>
  erro.value && granularidade.value === 'minuto' && !permitePorMinuto.value ? erro.value : null,
)
</script>

<template>
  <v-row dense align="start">
    <v-col cols="12">
      <v-btn-toggle
        v-model="atalho"
        mandatory
        color="primary"
        variant="outlined"
        density="comfortable"
        divided
        class="atalhos"
      >
        <v-btn v-for="opcao in ATALHOS" :key="opcao.valor" :value="opcao.valor">{{ opcao.titulo }}</v-btn>
      </v-btn-toggle>
    </v-col>
    <template v-if="atalho === 'personalizado'">
      <v-col cols="12" sm="6" md="4">
        <v-date-input
          v-model="intervalo"
          multiple="range"
          label="Período"
          :max="hoje"
          prepend-icon=""
          prepend-inner-icon="mdi-calendar"
          density="comfortable"
          hide-details
        />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-text-field
          v-model="horaInicio"
          type="time"
          label="Das"
          density="comfortable"
          :error-messages="erroHoras ?? undefined"
          :hide-details="!erroHoras"
        />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-text-field
          v-model="horaFim"
          type="time"
          label="Até"
          density="comfortable"
          :error="Boolean(erroHoras)"
          hide-details
        />
      </v-col>
    </template>
    <v-col cols="12" sm="6" md="3">
      <v-select
        v-model="granularidade"
        :items="opcoesGranularidade"
        label="Agrupar"
        density="comfortable"
        :error-messages="erroGranularidade ?? undefined"
        :hide-details="!erroGranularidade"
      />
    </v-col>
  </v-row>
</template>

<style scoped>
/* Em telas estreitas, os atalhos quebram linha em vez de estourar a largura */
.atalhos {
  flex-wrap: wrap;
  height: auto;
}

.atalhos :deep(.v-btn) {
  min-height: 48px;
}
</style>
