<script setup>
/**
 * `<defs>` com os padrões SVG dos status (ver `STATUS[...].padrao`), para usar dentro de um `<svg>`.
 * Os ids recebem o `prefixo` porque cada SVG precisa dos seus: um padrão definido em um SVG
 * oculto (ex.: aba inativa) não é desenhado nos outros.
 */
defineProps({
  prefixo: { type: String, required: true },
  /** Lado do padrão, nas unidades do `viewBox` do SVG. */
  tamanho: { type: Number, default: 8 },
})
</script>

<template>
  <defs>
    <pattern
      :id="`${prefixo}-padrao-hachura`"
      patternUnits="userSpaceOnUse"
      :width="tamanho"
      :height="tamanho"
      patternTransform="rotate(45)"
    >
      <line x1="0" y1="0" x2="0" :y2="tamanho" stroke="white" stroke-opacity="0.6" :stroke-width="tamanho / 3" />
    </pattern>
    <pattern
      :id="`${prefixo}-padrao-pontilhado`"
      patternUnits="userSpaceOnUse"
      :width="tamanho"
      :height="tamanho"
    >
      <circle :cx="tamanho / 2" :cy="tamanho / 2" :r="tamanho / 5" fill="white" fill-opacity="0.6" />
    </pattern>
  </defs>
</template>
