<script setup>
/**
 * Página 404.
 */
import EstadoVazio from '@/components/comum/EstadoVazio.vue'
</script>

<template>
  <v-container class="fill-height justify-center">
    <EstadoVazio
      icone="mdi-map-marker-question"
      titulo="Página não encontrada"
      texto="O endereço acessado não existe ou foi removido."
    >
      <v-btn color="primary" :to="{ name: 'inicio' }">Ir para o início</v-btn>
    </EstadoVazio>
  </v-container>
</template>
