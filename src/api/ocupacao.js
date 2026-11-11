/**
 * Ocupação em tempo real (RF03, RF05, UC01, UC02, UC05).
 */

import { http } from './http'

/** @returns {Promise<VagaOut[]>} */
export async function estadoAtual(estacionamentoId) {
  const { data } = await http.get(`/estacionamentos/${estacionamentoId}/vagas`)
  return data
}

/** @returns {Promise<TotaisOut>} */
export async function totais(estacionamentoId) {
  const { data } = await http.get(`/estacionamentos/${estacionamentoId}/totais`)
  return data
}

/**
 * URL do SSE, já com a base da API (o `EventSource` não passa pelo Axios).
 * @returns {string}
 */
export function urlEventos(estacionamentoId) {
  return http.getUri({ url: `/estacionamentos/${estacionamentoId}/eventos` })
}
