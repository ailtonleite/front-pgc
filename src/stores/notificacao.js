/**
 * Snackbar global de avisos ao usuário.
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useNotificacaoStore = defineStore('notificacao', () => {
  const visivel = ref(false)
  const mensagem = ref('')
  const cor = ref('info')

  function abrir(texto, novaCor) {
    mensagem.value = texto
    cor.value = novaCor
    visivel.value = true
  }

  function sucesso(texto) {
    abrir(texto, 'success')
  }

  function erro(texto) {
    abrir(texto, 'error')
  }

  function info(texto) {
    abrir(texto, 'info')
  }

  function fechar() {
    visivel.value = false
  }

  // Stores com sintaxe setup não têm `$reset` próprio
  function $reset() {
    visivel.value = false
    mensagem.value = ''
    cor.value = 'info'
  }

  return { visivel, mensagem, cor, sucesso, erro, info, fechar, $reset }
})
