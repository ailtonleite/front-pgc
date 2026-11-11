<script setup>
/**
 * Totais de vagas. A região é `aria-live` para leitores de tela anunciarem as mudanças.
 */
import { computed } from 'vue'
import { formatarPercentual } from '@/utils/datas'

const props = defineProps({
  /** `{ total, livres, ocupadas, taxa_ocupacao }` */
  totais: { type: Object, required: true },
  conectado: { type: Boolean, default: true },
  /** Versão reduzida, usada nos cards da lista de estacionamentos. */
  compacto: { type: Boolean, default: false },
})

const resumo = computed(() => {
  const { livres, total } = props.totais
  return `${livres} ${livres === 1 ? 'vaga livre' : 'vagas livres'} de ${total}`
})

const percentual = computed(() => props.totais.taxa_ocupacao * 100)
</script>

<template>
  <div aria-live="polite">
    <template v-if="compacto">
      <div class="d-flex align-center ga-2 mb-1">
        <v-icon icon="mdi-car-outline" color="livre" aria-hidden="true" />
        <span class="text-body-1">{{ resumo }}</span>
      </div>
      <v-progress-linear
        :model-value="percentual"
        color="ocupada"
        bg-color="livre"
        bg-opacity="1"
        height="6"
        rounded
        :aria-label="`Ocupação de ${formatarPercentual(totais.taxa_ocupacao)}`"
      />
    </template>

    <template v-else>
      <div class="d-flex justify-end align-center ga-2 mb-2 text-body-2">
        <span class="indicador" :class="conectado ? 'bg-success' : 'bg-warning'" aria-hidden="true" />
        {{ conectado ? 'Ao vivo' : 'Reconectando…' }}
      </div>
      <v-row dense>
        <v-col cols="12" sm="4">
          <v-card variant="tonal" color="livre">
            <v-card-text class="d-flex align-center ga-3">
              <v-icon icon="mdi-check-circle" size="32" aria-hidden="true" />
              <div>
                <div class="text-h4 font-weight-bold">{{ totais.livres }}</div>
                <div class="text-body-2">Vagas livres</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card variant="tonal" color="ocupada">
            <v-card-text class="d-flex align-center ga-3">
              <v-icon icon="mdi-car" size="32" aria-hidden="true" />
              <div>
                <div class="text-h4 font-weight-bold">{{ totais.ocupadas }}</div>
                <div class="text-body-2">Vagas ocupadas</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card variant="tonal">
            <v-card-text>
              <div class="text-h4 font-weight-bold">{{ formatarPercentual(totais.taxa_ocupacao) }}</div>
              <div class="text-body-2 mb-2">Taxa de ocupação ({{ totais.total }} vagas)</div>
              <v-progress-linear :model-value="percentual" color="primary" height="8" rounded aria-hidden="true" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<style scoped>
.indicador {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
