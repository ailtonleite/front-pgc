<script setup>
/**
 * Painel lateral da demarcação: rótulo, erros e remoção de cada vaga (`inject('editor')`).
 */
import { inject } from 'vue'
import EstadoVazio from '@/components/comum/EstadoVazio.vue'

const { vagas, selecionada, erros, selecionar, renomear, remover } = inject('editor')
</script>

<template>
  <EstadoVazio
    v-if="!vagas.length"
    icone="mdi-vector-square"
    titulo="Nenhuma vaga demarcada"
    texto="Clique em &quot;Nova vaga&quot; e marque os 4 cantos da vaga na imagem."
  />
  <v-list v-else density="compact" aria-label="Vagas demarcadas">
    <v-list-item
      v-for="vaga in vagas"
      :key="vaga.chave"
      :active="vaga.chave === selecionada"
      color="secondary"
      @click="selecionar(vaga.chave)"
    >
      <v-text-field
        :model-value="vaga.rotulo"
        label="Rótulo"
        density="compact"
        variant="outlined"
        hide-details="auto"
        :error-messages="erros[vaga.chave]"
        class="my-1"
        @update:model-value="renomear(vaga.chave, $event)"
        @focus="selecionar(vaga.chave)"
      />
      <template #append>
        <v-btn
          icon="mdi-delete"
          variant="text"
          size="small"
          :aria-label="`Remover vaga ${vaga.rotulo}`"
          @click.stop="remover(vaga.chave)"
        />
      </template>
    </v-list-item>
  </v-list>
</template>
