/**
 * Histórico e relatórios (RF04, UC06, UC07).
 * `inicio` e `fim` são `Date`, enviados sem fuso (ver `paraIsoLocal`).
 */

import { paraIsoLocal } from '@/utils/datas'
import { http } from './http'

/** @returns {Promise<SnapshotOut[]>} */
export async function consultar(estacionamentoId, { inicio, fim, granularidade }) {
  const { data } = await http.get(`/estacionamentos/${estacionamentoId}/historico`, {
    params: { inicio: paraIsoLocal(inicio), fim: paraIsoLocal(fim), granularidade },
  })
  return data
}

/** @returns {Promise<RelatorioOut>} */
export async function relatorio(estacionamentoId, { inicio, fim }) {
  const { data } = await http.get(`/estacionamentos/${estacionamentoId}/relatorios`, {
    params: { inicio: paraIsoLocal(inicio), fim: paraIsoLocal(fim) },
  })
  return data
}
