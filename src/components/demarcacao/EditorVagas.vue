<script setup>
/**
 * Área de desenho da demarcação. Usa o editor fornecido pela `DemarcacaoView` (`inject('editor')`).
 * Os eventos de ponteiro são convertidos com `pontoNoFrame`, o que também atende o toque (tablet).
 * Atalhos: N nova vaga, Esc cancela o desenho, Delete remove a selecionada, Ctrl+Z desfaz o último ponto.
 */
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { pontoNoFrame } from '@/composables/useEditorVagas'
import { centroide, pontosSvg } from '@/utils/geometria'

const props = defineProps({
  urlFrame: { type: String, required: true },
  largura: { type: Number, required: true },
  altura: { type: Number, required: true },
})

const {
  vagas,
  selecionada,
  pontosEmDesenho,
  modo,
  erros,
  novaVaga,
  clicar,
  desfazerPonto,
  cancelarDesenho,
  selecionar,
  iniciarArraste,
  mover,
  soltar,
  remover,
} = inject('editor')

const svg = ref(null)
const cursor = ref(null)
const larguraNaTela = ref(0)

/** Pixels do frame por pixel de tela: mantém vértices e rótulos do mesmo tamanho na tela. */
const escala = computed(() => (larguraNaTela.value ? props.largura / larguraNaTela.value : 1))

const itens = computed(() =>
  vagas.value.map((vaga) => ({
    chave: vaga.chave,
    rotulo: vaga.rotulo,
    pontos: pontosSvg(vaga.poligono),
    centro: centroide(vaga.poligono),
    erro: erros.value[vaga.chave],
  })),
)

const vagaSelecionada = computed(() => vagas.value.find((vaga) => vaga.chave === selecionada.value))

/** Pontos já clicados seguidos do cursor; fecha o contorno quando falta só o último ponto. */
const rascunho = computed(() => {
  const pontos = [...pontosEmDesenho.value]
  if (cursor.value) pontos.push(cursor.value)
  if (pontos.length === 4) pontos.push(pontos[0])
  return pontosSvg(pontos)
})

function pontoDoEvento(evento) {
  const { x, y } = pontoNoFrame(evento, svg.value)
  return {
    x: Math.min(Math.max(x, 0), props.largura),
    y: Math.min(Math.max(y, 0), props.altura),
  }
}

function aoPressionar(evento) {
  if (evento.button !== 0) return
  if (modo.value === 'desenho') {
    clicar(pontoDoEvento(evento))
  } else {
    selecionar(null)
  }
}

function aoPressionarVaga(evento, chave) {
  if (modo.value === 'desenho' || evento.button !== 0) return
  evento.stopPropagation()
  selecionar(chave)
}

function aoPressionarVertice(evento, indice) {
  if (evento.button !== 0) return
  evento.stopPropagation()
  iniciarArraste(selecionada.value, indice)
  svg.value.setPointerCapture(evento.pointerId)
}

function aoMover(evento) {
  const ponto = pontoDoEvento(evento)
  cursor.value = modo.value === 'desenho' ? ponto : null
  mover(ponto)
}

function aoSoltar(evento) {
  soltar()
  if (svg.value.hasPointerCapture(evento.pointerId)) {
    svg.value.releasePointerCapture(evento.pointerId)
  }
}

function aoTeclar(evento) {
  // Não intercepta a digitação nos campos de rótulo
  if (evento.target.closest?.('input, textarea, select, [contenteditable="true"]')) return

  if (evento.ctrlKey || evento.metaKey) {
    if (evento.key.toLowerCase() === 'z' && pontosEmDesenho.value.length) {
      evento.preventDefault()
      desfazerPonto()
    }
    return
  }

  if ((evento.key === 'n' || evento.key === 'N') && !evento.repeat) {
    novaVaga()
  } else if (evento.key === 'Escape' && modo.value === 'desenho') {
    cancelarDesenho()
  } else if (evento.key === 'Delete' && selecionada.value) {
    remover(selecionada.value)
  } else {
    return
  }
  evento.preventDefault()
}

let observador = null
onMounted(() => {
  observador = new ResizeObserver(([entrada]) => {
    larguraNaTela.value = entrada.contentRect.width
  })
  observador.observe(svg.value)
  window.addEventListener('keydown', aoTeclar)
})
onUnmounted(() => {
  observador?.disconnect()
  window.removeEventListener('keydown', aoTeclar)
})
</script>

<template>
  <svg
    ref="svg"
    class="editor-vagas"
    :class="`editor-vagas--${modo}`"
    :viewBox="`0 0 ${largura} ${altura}`"
    role="application"
    aria-label="Editor de vagas. N cria uma vaga, Esc cancela o desenho, Delete remove a vaga selecionada."
    @pointerdown="aoPressionar"
    @pointermove="aoMover"
    @pointerup="aoSoltar"
    @pointercancel="aoSoltar"
    @pointerleave="cursor = null"
  >
    <image :href="urlFrame" x="0" y="0" :width="largura" :height="altura" />

    <g
      v-for="item in itens"
      :key="item.chave"
      class="vaga"
      :class="{ 'vaga--selecionada': item.chave === selecionada, 'vaga--erro': item.erro }"
      @pointerdown="aoPressionarVaga($event, item.chave)"
    >
      <polygon class="vaga__area" :points="item.pontos" />
      <text
        class="vaga__rotulo"
        :x="item.centro.x"
        :y="item.centro.y"
        :font-size="14 * escala"
        :stroke-width="3 * escala"
      >
        {{ item.rotulo }}
      </text>
    </g>

    <template v-if="vagaSelecionada && modo === 'selecao'">
      <circle
        v-for="(ponto, indice) in vagaSelecionada.poligono"
        :key="indice"
        class="vertice"
        :cx="ponto.x"
        :cy="ponto.y"
        :r="8 * escala"
        @pointerdown="aoPressionarVertice($event, indice)"
      />
    </template>

    <template v-if="modo === 'desenho'">
      <polyline class="rascunho" :points="rascunho" />
      <circle
        v-for="(ponto, indice) in pontosEmDesenho"
        :key="indice"
        class="rascunho__ponto"
        :cx="ponto.x"
        :cy="ponto.y"
        :r="5 * escala"
      />
    </template>
  </svg>
</template>

<style scoped>
.editor-vagas {
  display: block;
  width: 100%;
  height: auto;
  touch-action: none;
  user-select: none;
}

.editor-vagas--desenho {
  cursor: crosshair;
}

.vaga {
  cursor: pointer;
}

.editor-vagas--desenho .vaga {
  cursor: crosshair;
}

.vaga__area {
  fill: rgba(var(--v-theme-primary), 0.25);
  stroke: rgb(var(--v-theme-primary));
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.vaga--selecionada .vaga__area {
  fill: rgba(var(--v-theme-secondary), 0.35);
  stroke: rgb(var(--v-theme-secondary));
  stroke-width: 3;
}

.vaga--erro .vaga__area {
  stroke: rgb(var(--v-theme-error));
  stroke-dasharray: 6 4;
}

.vaga__rotulo {
  fill: white;
  stroke: rgba(0, 0, 0, 0.7);
  paint-order: stroke;
  font-weight: 600;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
}

.vertice {
  fill: white;
  stroke: rgb(var(--v-theme-secondary));
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  cursor: move;
}

.rascunho {
  fill: none;
  stroke: rgb(var(--v-theme-secondary));
  stroke-width: 2;
  stroke-dasharray: 6 4;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.rascunho__ponto {
  fill: rgb(var(--v-theme-secondary));
  pointer-events: none;
}
</style>
