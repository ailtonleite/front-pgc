/**
 * Usuário logado. Fonte da verdade para as guardas de rota e para a interface mudar conforme o perfil.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import router from '@/router'
import { PAPEIS } from '@/utils/constantes'
import { useNotificacaoStore } from './notificacao'
import { useOcupacaoStore } from './ocupacao'
import { useSessaoStore } from './sessao'

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref(null)
  const carregado = ref(false)

  const autenticado = computed(() => usuario.value !== null)
  const eAdmin = computed(() => usuario.value?.papel === PAPEIS.ADMIN)
  const eMotorista = computed(() => usuario.value?.papel === PAPEIS.MOTORISTA)

  /**
   * Faz o `GET /me` uma única vez. Com `forcar`, consulta de novo, para verificar se a sessão
   * expirou (ver `useEventosVagas`). Só um 401 desloga: uma falha de rede mantém o usuário atual.
   */
  async function carregar({ forcar = false } = {}) {
    if (carregado.value && !forcar) return
    try {
      usuario.value = await authApi.me({ silencioso: true })
    } catch (erro) {
      if (erro.response?.status === 401) usuario.value = null
    } finally {
      carregado.value = true
    }
  }

  async function entrar(email, senha) {
    usuario.value = await authApi.login(email, senha)
  }

  async function cadastrar(dados) {
    await authApi.cadastrar(dados)
    await entrar(dados.email, dados.senha)
  }

  async function sair() {
    await authApi.logout()
    usuario.value = null
    useOcupacaoStore().$reset()
    useSessaoStore().$reset()
    useNotificacaoStore().$reset()
    await router.push('/login')
  }

  async function atualizarPlaca(placa) {
    usuario.value = await authApi.atualizarPlaca(placa)
  }

  return {
    usuario,
    carregado,
    autenticado,
    eAdmin,
    eMotorista,
    carregar,
    entrar,
    cadastrar,
    sair,
    atualizarPlaca,
  }
})
