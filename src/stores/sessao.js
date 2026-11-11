/**
 * "Onde estacionei" do motorista (UC03).
 * As rotas são exclusivas de motorista: só chamar quando `authStore.eMotorista` for verdadeiro.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as sessaoApi from '@/api/sessao'
import { useNotificacaoStore } from './notificacao'

export const useSessaoStore = defineStore('sessao', () => {
  const sessao = ref(null)

  const vagaId = computed(() => sessao.value?.vaga_id ?? null)

  async function carregar() {
    sessao.value = await sessaoApi.atual()
  }

  async function registrar(novaVagaId) {
    sessao.value = await sessaoApi.registrar(novaVagaId)
    useNotificacaoStore().sucesso(`Vaga ${sessao.value.vaga_rotulo} registrada.`)
  }

  async function encerrar() {
    await sessaoApi.encerrar()
    sessao.value = null
  }

  // Stores com sintaxe setup não têm `$reset` próprio
  function $reset() {
    sessao.value = null
  }

  return { sessao, vagaId, carregar, registrar, encerrar, $reset }
})
