/**
 * "Onde estacionei" do motorista (UC03).
 * Rotas exclusivas de motorista (403 para admin): só chamar quando `authStore.eMotorista` for verdadeiro.
 */

import { http } from './http'

/** @returns {Promise<SessaoOut | null>} */
export async function atual() {
  const { data } = await http.get('/me/sessao')
  return data
}

/** @returns {Promise<SessaoOut>} */
export async function registrar(vagaId) {
  const { data } = await http.post('/me/sessao', { vaga_id: vagaId })
  return data
}

/** @returns {Promise<void>} */
export async function encerrar() {
  await http.delete('/me/sessao')
}
