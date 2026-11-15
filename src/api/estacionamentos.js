/**
 * Estacionamentos e seus administradores (UC01, UC09).
 */

import { http } from './http'

/** @returns {Promise<EstacionamentoOut[]>} */
export async function listar() {
  const { data } = await http.get('/estacionamentos')
  return data
}

/**
 * `EnderecoIn`: `{ rua, numero, complemento?, bairro, cidade, estado, cep }`
 * (ver `utils/endereco.js#paraEnderecoIn`).
 * @param {{nome: string, endereco?: object | null, ativo?: boolean}} dados
 * @returns {Promise<EstacionamentoOut>}
 */
export async function criar({ nome, endereco, ativo }) {
  const { data } = await http.post('/estacionamentos', { nome, endereco, ativo })
  return data
}

/**
 * O `endereco` é substituído por inteiro (envie todos os campos); `endereco: null` remove o endereço.
 * @param {string} id
 * @param {{nome?: string, endereco?: object | null, ativo?: boolean}} campos só os campos enviados mudam
 * @returns {Promise<EstacionamentoOut>}
 */
export async function editar(id, campos) {
  const { data } = await http.put(`/estacionamentos/${id}`, campos)
  return data
}

/** @returns {Promise<void>} */
export async function remover(id) {
  await http.delete(`/estacionamentos/${id}`)
}

/** @returns {Promise<void>} */
export async function atribuirAdmin(id, usuarioId) {
  await http.post(`/estacionamentos/${id}/admins`, { usuario_id: usuarioId })
}

/** @returns {Promise<void>} */
export async function removerAdmin(id, adminId) {
  await http.delete(`/estacionamentos/${id}/admins/${adminId}`)
}
