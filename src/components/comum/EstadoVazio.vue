<script setup>
/**
 * Mensagem para listas vazias. O slot padrão recebe um botão de ação.
 */
defineProps({
  icone: { type: String, default: 'mdi-information-outline' },
  titulo: { type: String, required: true },
  texto: { type: String, default: '' },
})
</script>

<template>
  <div class="text-center py-8 px-4">
    <v-icon :icon="icone" size="56" class="text-medium-emphasis mb-3" />
    <h2 class="text-h6 mb-1">{{ titulo }}</h2>
    <p v-if="texto" class="text-body-2 text-medium-emphasis mb-4">{{ texto }}</p>
    <slot />
  </div>
</template>
