<script setup>
/**
 * Legenda com cor, padrão, ícone e texto de cada status.
 */
import { useId } from 'vue'
import { STATUS } from '@/utils/constantes'
import PadroesStatus from './PadroesStatus.vue'

const prefixo = useId()
</script>

<template>
  <ul class="legenda d-flex flex-wrap ga-4" aria-label="Legenda do mapa">
    <li v-for="(status, chave) in STATUS" :key="chave" class="d-flex align-center ga-2">
      <svg width="28" height="18" viewBox="0 0 28 18" aria-hidden="true">
        <PadroesStatus :prefixo="prefixo" :tamanho="6" />
        <rect width="28" height="18" rx="3" :style="{ fill: `rgb(var(--v-theme-${status.cor}))` }" />
        <rect v-if="status.padrao" width="28" height="18" rx="3" :fill="`url(#${prefixo}-${status.padrao})`" />
      </svg>
      <v-icon :icon="status.icone" :color="status.cor" size="small" aria-hidden="true" />
      <span class="text-body-2">{{ status.rotulo }}</span>
    </li>
  </ul>
</template>

<style scoped>
.legenda {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
