/**
 * Câmeras e demarcação de vagas (RF01, RF02, UC08).
 */

import { http } from './http'

/** @returns {Promise<CameraOut[]>} */
export async function listar(estacionamentoId) {
  const { data } = await http.get(`/estacionamentos/${estacionamentoId}/cameras`)
  return data
}

/** @returns {Promise<CameraOut>} */
export async function cadastrar(estacionamentoId, { nome, stream_url, tipo_fonte }) {
  const { data } = await http.post(`/estacionamentos/${estacionamentoId}/cameras`, {
    nome,
    stream_url,
    tipo_fonte,
  })
  return data
}

/**
 * Todos os campos são obrigatórios.
 * @returns {Promise<CameraOut>}
 */
export async function atualizar(id, { nome, stream_url, tipo_fonte }) {
  const { data } = await http.put(`/cameras/${id}`, { nome, stream_url, tipo_fonte })
  return data
}

/** @returns {Promise<void>} */
export async function remover(id) {
  await http.delete(`/cameras/${id}`)
}

/** @returns {Promise<Blob>} frame em JPEG */
export async function capturarFrame(id) {
  const { data } = await http.get(`/cameras/${id}/frame`, { responseType: 'blob' })
  return data
}

/** @returns {Promise<void>} */
export async function iniciar(id) {
  await http.post(`/cameras/${id}/iniciar`)
}

/** @returns {Promise<void>} */
export async function parar(id) {
  await http.post(`/cameras/${id}/parar`)
}

/** @returns {Promise<VagaOut[]>} */
export async function listarVagas(id) {
  const { data } = await http.get(`/cameras/${id}/vagas`)
  return data
}

/**
 * Substitui todas as vagas da câmera.
 * @param {string} id
 * @param {{rotulo: string, poligono: {x: number, y: number}[]}[]} vagas
 * @returns {Promise<VagaOut[]>}
 */
export async function definirVagas(id, vagas) {
  const { data } = await http.put(`/cameras/${id}/vagas`, vagas)
  return data
}
