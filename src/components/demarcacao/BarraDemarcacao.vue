<script setup>
/**
 * Barra de ações da demarcação (`inject('editor')`).
 */
import { computed, inject } from 'vue'

const emit = defineEmits(['salvar', 'descartar', 'recarregar-frame'])

const { vagas, pontosEmDesenho, modo, alterado, valido, novaVaga, desfazerPonto, cancelarDesenho } =
  inject('editor')

const contador = computed(() => `${vagas.value.length} ${vagas.value.length === 1 ? 'vaga' : 'vagas'}`)
</script>

<template>
  <div class="d-flex flex-wrap align-center ga-2 py-2">
    <v-btn
      v-if="modo === 'desenho'"
      prepend-icon="mdi-close"
      variant="tonal"
      title="Esc"
      @click="cancelarDesenho()"
    >
      Cancelar desenho
    </v-btn>
    <v-btn v-else prepend-icon="mdi-plus" color="primary" variant="tonal" title="N" @click="novaVaga()">
      Nova vaga
    </v-btn>
    <v-btn
      prepend-icon="mdi-undo"
      variant="text"
      title="Ctrl+Z"
      :disabled="!pontosEmDesenho.length"
      @click="desfazerPonto()"
    >
      Desfazer ponto
    </v-btn>
    <v-btn prepend-icon="mdi-camera-retake" variant="text" @click="emit('recarregar-frame')">
      Recarregar frame
    </v-btn>

    <span class="text-body-2 text-medium-emphasis" aria-live="polite">
      <template v-if="modo === 'desenho'">Marque os 4 cantos da vaga ({{ pontosEmDesenho.length }}/4)</template>
      <template v-else>{{ contador }}</template>
    </span>

    <v-spacer />

    <v-btn variant="text" :disabled="!alterado" @click="emit('descartar')">Descartar</v-btn>
    <v-btn
      color="primary"
      variant="flat"
      prepend-icon="mdi-content-save"
      :disabled="!(valido && alterado)"
      @click="emit('salvar')"
    >
      Salvar
    </v-btn>
  </div>
</template>
