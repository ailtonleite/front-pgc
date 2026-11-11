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
const { atalho, inicio, fim, granularidade } = props.periodo

const ATALHOS = [
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
</script>

<template>
  <v-row dense align="center">
    <v-col cols="12" md="auto">
      <v-btn-toggle v-model="atalho" mandatory color="primary" variant="outlined" density="comfortable" divided>
        <v-btn v-for="opcao in ATALHOS" :key="opcao.valor" :value="opcao.valor">{{ opcao.titulo }}</v-btn>
      </v-btn-toggle>
    </v-col>
    <v-col v-if="atalho === 'personalizado'" cols="12" sm="6" md="4">
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
    <v-col cols="12" sm="6" md="3">
      <v-select
        v-model="granularidade"
        :items="GRANULARIDADES"
        label="Agrupar"
        density="comfortable"
        hide-details
      />
    </v-col>
  </v-row>
</template>
