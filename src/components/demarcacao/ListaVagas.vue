<script setup>
/**
 * Painel lateral da demarcação: rótulo, preferencial, erros e remoção de cada vaga (`inject('editor')`).
 */
import { inject } from 'vue'
import BotaoIcone from '@/components/comum/BotaoIcone.vue'
import EstadoVazio from '@/components/comum/EstadoVazio.vue'
import { PREFERENCIAL } from '@/utils/constantes'

const { vagas, selecionada, erros, selecionar, renomear, definirPreferencial, remover } = inject('editor')
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
        class="mt-1"
        @update:model-value="renomear(vaga.chave, $event)"
        @focus="selecionar(vaga.chave)"
      />
      <!-- `.stop`: marcar não deve disparar o clique do item (que só seleciona a vaga) -->
      <v-checkbox
        :model-value="vaga.preferencial"
        :aria-label="`Vaga ${vaga.rotulo} preferencial`"
        color="preferencial"
        density="compact"
        hide-details
        class="mb-1"
        @update:model-value="definirPreferencial(vaga.chave, Boolean($event))"
        @click.stop
        @focus="selecionar(vaga.chave)"
      >
        <template #label>
          <v-icon :icon="PREFERENCIAL.icone" color="preferencial" size="small" class="mr-1" aria-hidden="true" />
          {{ PREFERENCIAL.rotulo }}
        </template>
      </v-checkbox>
      <template #append>
        <BotaoIcone
          icone="mdi-delete"
          dica="Remover vaga"
          :rotulo="`Remover vaga ${vaga.rotulo}`"
          size="small"
          @click.stop="remover(vaga.chave)"
        />
      </template>
    </v-list-item>
  </v-list>
</template>
