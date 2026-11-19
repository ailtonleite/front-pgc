<script setup>
/**
 * Mensagem para listas vazias. O slot padrão recebe um botão de ação.
 *
 * Mostra `imagem` (URL importada de `src/images`) quando informada; senão, o `icone`.
 * A ilustração é decorativa (`alt=""`): o título já transmite a mensagem.
 */
defineProps({
  icone: { type: String, default: 'mdi-information-outline' },
  imagem: { type: String, default: null },
  titulo: { type: String, required: true },
  texto: { type: String, default: '' },
})
</script>

<template>
  <div class="text-center py-8 px-4">
    <img v-if="imagem" :src="imagem" alt="" width="160" height="160" class="ilustracao mb-3">
    <v-icon v-else :icon="icone" size="56" class="text-medium-emphasis mb-3" />
    <h2 class="text-h6 mb-1">{{ titulo }}</h2>
    <p v-if="texto" class="text-body-2 text-medium-emphasis mb-4">{{ texto }}</p>
    <slot />
  </div>
</template>

<style scoped>
.ilustracao {
  display: block;
  margin-inline: auto;
  max-width: 40vw;
  height: auto;
}
</style>
