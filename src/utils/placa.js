/**
 * Placa de veículo. Sem dependências de Vue.
 */

/** Tamanho da placa sem hífen (`AAA1234` ou `AAA1A23`). */
export const TAMANHO_PLACA = 7

/**
 * Normaliza a placa enquanto é digitada: maiúsculas, só letras e números (o hífen
 * é descartado) e no máximo 7 caracteres. Assim `abc1d23` e `ABC-1D23` viram a
 * mesma placa, `ABC1D23`, tanto na tela quanto no que é enviado ao back-end.
 * @param {string | null | undefined} valor
 * @returns {string}
 */
export function formatarPlaca(valor) {
  return (valor ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, TAMANHO_PLACA)
}
