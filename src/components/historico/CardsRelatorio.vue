<script setup>
/**
 * Ocupação média, pico e horário de pico do período (`GET /relatorios`).
 */
import { computed } from 'vue'
import { formatarDataHora, formatarPercentual } from '@/utils/datas'

const props = defineProps({
  /** `RelatorioOut` */
  relatorio: { type: Object, default: null },
  carregando: { type: Boolean, default: false },
})

const SEM_DADOS = 'Sem dados no período'

const cards = computed(() => {
  const { media = null, pico = null, horario_pico = null } = props.relatorio ?? {}
  return [
    { titulo: 'Ocupação média', icone: 'mdi-chart-line', valor: media === null ? null : formatarPercentual(media) },
    { titulo: 'Pico de ocupação', icone: 'mdi-arrow-up-bold', valor: pico === null ? null : formatarPercentual(pico) },
    { titulo: 'Horário de pico', icone: 'mdi-clock-outline', valor: horario_pico && formatarDataHora(horario_pico) },
  ]
})
</script>

<template>
  <v-row dense>
    <v-col v-for="card in cards" :key="card.titulo" cols="12" sm="4">
      <v-skeleton-loader v-if="carregando" type="list-item-two-line" />
      <v-card v-else variant="tonal">
        <v-card-text class="d-flex align-center ga-3">
          <v-icon :icon="card.icone" size="28" color="primary" aria-hidden="true" />
          <div>
            <div class="text-body-2">{{ card.titulo }}</div>
            <div v-if="card.valor" class="text-h5 font-weight-bold">{{ card.valor }}</div>
            <div v-else class="text-body-1 text-medium-emphasis">{{ SEM_DADOS }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
