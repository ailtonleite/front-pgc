<script setup>
/**
 * Vagas de uma câmera desenhadas em SVG. Coordenadas em pixels do frame original.
 */
import { computed, useId } from 'vue'
import { STATUS } from '@/utils/constantes'
import { area, caixaEnvolvente, centroide, pontosSvg } from '@/utils/geometria'
import PadroesStatus from './PadroesStatus.vue'

const props = defineProps({
  vagas: { type: Array, required: true },
  /** Frame da câmera como fundo (somente admin); `null` mostra o desenho esquemático. */
  urlFundo: { type: String, default: null },
  largura: { type: Number, default: null },
  altura: { type: Number, default: null },
  /** Id da vaga da sessão do motorista. */
  vagaDestacada: { type: String, default: null },
  interativo: { type: Boolean, default: false },
})
const emit = defineEmits(['selecionar'])

const prefixo = useId()

const comFundo = computed(() => Boolean(props.urlFundo && props.largura && props.altura))

const caixa = computed(() =>
  comFundo.value
    ? { x: 0, y: 0, largura: props.largura, altura: props.altura }
    : caixaEnvolvente(props.vagas.map((vaga) => vaga.poligono)),
)

const viewBox = computed(() => {
  const { x, y, largura, altura } = caixa.value
  return largura && altura ? `${x} ${y} ${largura} ${altura}` : undefined
})

const tamanhoPadrao = computed(() => Math.max(caixa.value.largura, caixa.value.altura) / 80 || 8)

const itens = computed(() =>
  props.vagas.map((vaga) => {
    const status = STATUS[vaga.status] ?? STATUS.DESCONHECIDA
    const destacada = vaga.id === props.vagaDestacada
    const fonte = Math.max(Math.sqrt(area(vaga.poligono)) / 4, 1)
    return {
      vaga,
      status,
      destacada,
      fonte,
      pontos: pontosSvg(vaga.poligono),
      centro: centroide(vaga.poligono),
      cor: `rgb(var(--v-theme-${status.cor}))`,
      padrao: status.padrao && `url(#${prefixo}-${status.padrao})`,
      descricao: `Vaga ${vaga.rotulo}, ${status.rotulo.toLowerCase()}${destacada ? ', sua vaga' : ''}`,
    }
  }),
)

function selecionar(vaga) {
  if (props.interativo) emit('selecionar', vaga)
}
</script>

<template>
  <svg
    class="mapa-vagas"
    :class="{ 'mapa-vagas--com-fundo': comFundo }"
    :viewBox="viewBox"
    preserveAspectRatio="xMidYMid meet"
    role="group"
    aria-label="Mapa de vagas"
  >
    <PadroesStatus :prefixo="prefixo" :tamanho="tamanhoPadrao" />
    <image v-if="comFundo" :href="urlFundo" x="0" y="0" :width="largura" :height="altura" />

    <g
      v-for="item in itens"
      :key="item.vaga.id"
      class="vaga"
      :class="{ 'vaga--interativa': interativo, 'vaga--destacada': item.destacada }"
      :role="interativo ? 'button' : 'img'"
      :tabindex="interativo ? 0 : undefined"
      :aria-label="item.descricao"
      @click="selecionar(item.vaga)"
      @keydown.enter.prevent="selecionar(item.vaga)"
      @keydown.space.prevent="selecionar(item.vaga)"
    >
      <polygon class="vaga__fundo" :points="item.pontos" :style="{ fill: item.cor }" />
      <polygon v-if="item.padrao" class="vaga__padrao" :points="item.pontos" :fill="item.padrao" />
      <polygon class="vaga__borda" :points="item.pontos" />
      <text
        class="vaga__rotulo"
        :x="item.centro.x"
        :y="item.centro.y"
        :font-size="item.fonte"
        :stroke-width="item.fonte / 6"
      >
        {{ item.vaga.rotulo }}
      </text>
      <foreignObject
        v-if="item.destacada"
        :x="item.centro.x - item.fonte * 0.75"
        :y="item.centro.y - item.fonte * 2.2"
        :width="item.fonte * 1.5"
        :height="item.fonte * 1.5"
      >
        <div class="vaga__icone">
          <v-icon icon="mdi-car" :size="item.fonte * 1.4" color="white" />
        </div>
      </foreignObject>
    </g>
  </svg>
</template>

<style scoped>
.mapa-vagas {
  display: block;
  width: 100%;
  height: auto;
}

.vaga__fundo {
  transition: fill 0.4s ease;
}

.mapa-vagas--com-fundo .vaga__fundo {
  fill-opacity: 0.55;
}

.vaga__padrao,
.vaga__rotulo,
.vaga__icone {
  pointer-events: none;
}

.vaga__borda {
  fill: none;
  stroke: rgba(0, 0, 0, 0.45);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.vaga--destacada .vaga__borda {
  stroke: rgb(var(--v-theme-secondary));
  stroke-width: 5;
}

.vaga__rotulo {
  fill: white;
  stroke: rgba(0, 0, 0, 0.6);
  paint-order: stroke;
  font-weight: 600;
  text-anchor: middle;
  dominant-baseline: central;
  user-select: none;
}

.vaga__icone {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.vaga--interativa {
  cursor: pointer;
  outline: none;
}

.vaga--interativa:hover .vaga__borda,
.vaga--interativa:focus-visible .vaga__borda {
  stroke: rgb(var(--v-theme-primary));
  stroke-width: 4;
}

@media (prefers-reduced-motion: reduce) {
  .vaga__fundo {
    transition: none;
  }
}
</style>
