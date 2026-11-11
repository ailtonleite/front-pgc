/**
 * Lógica da demarcação de vagas, separada do desenho.
 * A `DemarcacaoView` cria o editor e o disponibiliza com `provide('editor', editor)`.
 * Coordenadas sempre em pixels do frame original da câmera.
 */

import { computed, ref } from 'vue'
import { validarPoligono } from '@/utils/geometria'

const PONTOS_POR_VAGA = 4

/**
 * Converte a posição do ponteiro na tela para coordenadas do frame original,
 * qualquer que seja o tamanho em que o SVG está sendo exibido.
 * @param {PointerEvent | MouseEvent} evento
 * @param {SVGSVGElement} svg elemento com `viewBox="0 0 largura altura"`
 * @returns {{x: number, y: number}}
 */
export function pontoNoFrame(evento, svg) {
  const ponto = new DOMPoint(evento.clientX, evento.clientY)
    .matrixTransform(svg.getScreenCTM().inverse())
  return { x: ponto.x, y: ponto.y }
}

export function useEditorVagas() {
  /** `chave` é um id local, pois vagas novas ainda não têm id do servidor. */
  const vagas = ref([])
  const selecionada = ref(null)
  const pontosEmDesenho = ref([])
  const modo = ref('selecao')
  const alterado = ref(false)

  let _arraste = null
  let contador = 0

  const erros = computed(() => {
    const contagem = {}
    for (const vaga of vagas.value) {
      const rotulo = vaga.rotulo.trim()
      contagem[rotulo] = (contagem[rotulo] ?? 0) + 1
    }

    const resultado = {}
    for (const vaga of vagas.value) {
      const rotulo = vaga.rotulo.trim()
      const erro = validarPoligono(vaga.poligono)
        ?? (!rotulo ? 'Informe o rótulo da vaga.' : null)
        ?? (contagem[rotulo] > 1 ? 'Rótulo repetido.' : null)
      if (erro) resultado[vaga.chave] = erro
    }
    return resultado
  })

  const valido = computed(() => Object.keys(erros.value).length === 0)

  function buscar(chave) {
    return vagas.value.find((vaga) => vaga.chave === chave)
  }

  /** Próximo rótulo da sequência da última vaga ("A-03" → "A-04"), sem repetir um existente. */
  function sugerirRotulo() {
    const partes = vagas.value.at(-1)?.rotulo.trim().match(/^(.*?)(\d+)$/)
    const prefixo = partes ? partes[1] : 'A-'
    const digitos = partes ? partes[2].length : 2
    let numero = partes ? Number(partes[2]) + 1 : 1

    const existentes = new Set(vagas.value.map((vaga) => vaga.rotulo.trim()))
    let rotulo
    do {
      rotulo = prefixo + String(numero++).padStart(digitos, '0')
    } while (existentes.has(rotulo))
    return rotulo
  }

  /** Preenche o editor a partir de `GET /cameras/{id}/vagas`. */
  function carregar(vagasOut) {
    vagas.value = vagasOut.map((vaga) => ({
      chave: vaga.id,
      rotulo: vaga.rotulo,
      poligono: vaga.poligono.map(({ x, y }) => ({ x, y })),
    }))
    selecionada.value = null
    pontosEmDesenho.value = []
    modo.value = 'selecao'
    alterado.value = false
    _arraste = null
  }

  function novaVaga() {
    selecionada.value = null
    pontosEmDesenho.value = []
    modo.value = 'desenho'
  }

  /** No modo desenho, adiciona o ponto; no quarto ponto, cria a vaga. */
  function clicar(ponto) {
    if (modo.value !== 'desenho') return
    pontosEmDesenho.value.push({ x: ponto.x, y: ponto.y })
    if (pontosEmDesenho.value.length < PONTOS_POR_VAGA) return

    const chave = `nova-${++contador}`
    vagas.value.push({ chave, rotulo: sugerirRotulo(), poligono: pontosEmDesenho.value })
    pontosEmDesenho.value = []
    modo.value = 'selecao'
    selecionada.value = chave
    alterado.value = true
  }

  function desfazerPonto() {
    pontosEmDesenho.value.pop()
  }

  function cancelarDesenho() {
    pontosEmDesenho.value = []
    modo.value = 'selecao'
  }

  function selecionar(chave) {
    selecionada.value = chave
  }

  function iniciarArraste(chave, indice) {
    _arraste = { chave, indice }
    selecionada.value = chave
  }

  function mover(ponto) {
    if (!_arraste) return
    const vaga = buscar(_arraste.chave)
    if (!vaga) return
    vaga.poligono[_arraste.indice] = { x: ponto.x, y: ponto.y }
    alterado.value = true
  }

  function soltar() {
    _arraste = null
  }

  function renomear(chave, rotulo) {
    const vaga = buscar(chave)
    if (!vaga) return
    vaga.rotulo = rotulo
    alterado.value = true
  }

  function remover(chave) {
    vagas.value = vagas.value.filter((vaga) => vaga.chave !== chave)
    if (selecionada.value === chave) selecionada.value = null
    if (_arraste?.chave === chave) _arraste = null
    alterado.value = true
  }

  /** Converte para `VagaIn[]`, pronto para `PUT /cameras/{id}/vagas`. */
  function paraPayload() {
    return vagas.value.map((vaga) => ({
      rotulo: vaga.rotulo.trim(),
      poligono: vaga.poligono.map(({ x, y }) => ({ x, y })),
    }))
  }

  return {
    vagas,
    selecionada,
    pontosEmDesenho,
    modo,
    alterado,
    erros,
    valido,
    carregar,
    novaVaga,
    clicar,
    desfazerPonto,
    cancelarDesenho,
    selecionar,
    iniciarArraste,
    mover,
    soltar,
    renomear,
    remover,
    paraPayload,
  }
}
