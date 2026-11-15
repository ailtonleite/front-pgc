<script setup>
/**
 * Botão só com ícone, com dica (tooltip) ao passar o mouse ou focar pelo teclado.
 *
 * - `rotulo`: nome acessível do botão (`aria-label`), lido pelo leitor de tela.
 *   Deve ser específico, ex.: "Editar Bloco A".
 * - `dica`: texto curto exibido no tooltip, ex.: "Editar". Sem ela, o tooltip mostra o `rotulo`.
 *
 * Os demais atributos (`color`, `size`, `to`, `@click`, `disabled`…) vão para o `v-btn`.
 */
defineOptions({ inheritAttrs: false })

defineProps({
  /** Ícone mdi, ex.: `mdi-pencil` */
  icone: { type: String, required: true },
  rotulo: { type: String, required: true },
  dica: { type: String, default: null },
})
</script>

<template>
  <v-tooltip :text="dica ?? rotulo" location="top">
    <template #activator="{ props: ativador }">
      <v-btn
        variant="text"
        v-bind="{ ...ativador, ...$attrs }"
        :icon="icone"
        :aria-label="rotulo"
      />
    </template>
  </v-tooltip>
</template>
