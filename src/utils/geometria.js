/**
 * Funções puras sobre polígonos de vagas.
 * Um polígono é uma lista de pontos `{x, y}` em pixels do frame original da câmera.
 */

/**
 * Converte o polígono para o atributo `points` de um `<polygon>` SVG.
 * @param {{x: number, y: number}[]} poligono
 * @returns {string} `"x1,y1 x2,y2 ..."`
 */
export function pontosSvg(poligono) {
  return poligono.map(({ x, y }) => `${x},${y}`).join(' ')
}

/** Soma do laço (*shoelace*) com sinal: positiva ou negativa conforme o sentido dos vértices. */
function areaComSinal(poligono) {
  let soma = 0
  for (let i = 0; i < poligono.length; i++) {
    const a = poligono[i]
    const b = poligono[(i + 1) % poligono.length]
    soma += a.x * b.y - b.x * a.y
  }
  return soma / 2
}

/**
 * Área do polígono pela fórmula do laço (*shoelace*).
 * @param {{x: number, y: number}[]} poligono
 * @returns {number} área em pixels²
 */
export function area(poligono) {
  return Math.abs(areaComSinal(poligono))
}

/**
 * Centroide do polígono, usado para posicionar o rótulo da vaga.
 * Se a área for zero (pontos alinhados), usa a média dos vértices.
 * @param {{x: number, y: number}[]} poligono
 * @returns {{x: number, y: number}}
 */
export function centroide(poligono) {
  if (poligono.length === 0) return { x: 0, y: 0 }

  const a = areaComSinal(poligono)
  if (a === 0) {
    const soma = poligono.reduce((s, p) => ({ x: s.x + p.x, y: s.y + p.y }), { x: 0, y: 0 })
    return { x: soma.x / poligono.length, y: soma.y / poligono.length }
  }

  let cx = 0
  let cy = 0
  for (let i = 0; i < poligono.length; i++) {
    const p = poligono[i]
    const q = poligono[(i + 1) % poligono.length]
    const cruzado = p.x * q.y - q.x * p.y
    cx += (p.x + q.x) * cruzado
    cy += (p.y + q.y) * cruzado
  }
  return { x: cx / (6 * a), y: cy / (6 * a) }
}

/**
 * Retângulo que contém todos os polígonos, com uma margem em volta.
 * Usado como `viewBox` do mapa esquemático.
 * @param {{x: number, y: number}[][]} poligonos
 * @param {number} [margem=20]
 * @returns {{x: number, y: number, largura: number, altura: number}}
 */
export function caixaEnvolvente(poligonos, margem = 20) {
  const pontos = poligonos.flat()
  if (pontos.length === 0) return { x: 0, y: 0, largura: 0, altura: 0 }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const { x, y } of pontos) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  return {
    x: minX - margem,
    y: minY - margem,
    largura: maxX - minX + 2 * margem,
    altura: maxY - minY + 2 * margem,
  }
}

/**
 * Valida o polígono com a mesma regra de `_validar_poligono` do back-end.
 * @param {{x: number, y: number}[]} poligono
 * @returns {string | null} mensagem de erro, ou `null` se válido
 */
export function validarPoligono(poligono) {
  if (!Array.isArray(poligono) || poligono.length !== 4) {
    return 'A vaga deve ter exatamente 4 pontos.'
  }
  if (area(poligono) <= 0) {
    return 'O polígono da vaga deve ter área positiva.'
  }
  return null
}
