<script setup>
/**
 * Snackbar ligado à `notificacaoStore`. Fica em `App.vue`, uma única vez.
 */
import { storeToRefs } from 'pinia'
import { useNotificacaoStore } from '@/stores/notificacao'

const notificacao = useNotificacaoStore()
const { visivel, mensagem, cor } = storeToRefs(notificacao)
</script>

<template>
  <v-snackbar v-model="visivel" :color="cor" :timeout="5000">
    {{ mensagem }}
    <template #actions>
      <v-btn variant="text" @click="notificacao.fechar()">Fechar</v-btn>
    </template>
  </v-snackbar>
</template>
