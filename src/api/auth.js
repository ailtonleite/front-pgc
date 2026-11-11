/**
 * Autenticação e conta do usuário (UC04).
 */

import { http } from './http'

/** @returns {Promise<UsuarioOut>} */
export async function login(email, senha) {
  const { data } = await http.post('/auth/login', { email, senha })
  return data
}

/** @returns {Promise<void>} */
export async function logout() {
  await http.post('/auth/logout')
}

/** @returns {Promise<UsuarioOut>} */
export async function cadastrar({ nome, email, senha, placa }) {
  const { data } = await http.post('/auth/cadastro', { nome, email, senha, placa })
  return data
}

/** @returns {Promise<UsuarioOut>} */
export async function me({ silencioso = false } = {}) {
  const { data } = await http.get('/me', { silencioso })
  return data
}

/**
 * @param {string | null} placa `null` remove a placa
 * @returns {Promise<UsuarioOut>}
 */
export async function atualizarPlaca(placa) {
  const { data } = await http.put('/me/placa', { placa })
  return data
}
