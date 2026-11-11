<script setup>
/**
 * Tabela do histórico: alternativa acessível ao gráfico (RNF02), com exportação CSV no navegador.
 */
import { formatarDataHora, formatarPercentual } from '@/utils/datas'

const props = defineProps({
  /** `SnapshotOut[]` */
  snapshots: { type: Array, required: true },
})

const CABECALHOS = [
  { title: 'Período', key: 'timestamp' },
  { title: 'Livres', key: 'livres', align: 'end' },
  { title: 'Ocupadas', key: 'ocupadas', align: 'end' },
  { title: 'Taxa de ocupação', key: 'taxa_ocupacao', align: 'end' },
]

/** CSV com `;` e vírgula decimal, que o Excel em português abre direto. */
function exportarCsv() {
  const linhas = [
    ['Período', 'Livres', 'Ocupadas', 'Taxa de ocupação (%)'],
    ...props.snapshots.map((snapshot) => [
      formatarDataHora(snapshot.timestamp),
      snapshot.livres,
      snapshot.ocupadas,
      (snapshot.taxa_ocupacao * 100).toFixed(1).replace('.', ','),
    ]),
  ]
  const csv = linhas.map((linha) => linha.join(';')).join('\r\n')
  // BOM para o Excel reconhecer o UTF-8
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'historico-ocupacao.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url))
}
</script>

<template>
  <div>
    <div class="d-flex justify-end mb-2">
      <v-btn
        prepend-icon="mdi-download"
        variant="tonal"
        :disabled="!snapshots.length"
        @click="exportarCsv"
      >
        Exportar CSV
      </v-btn>
    </div>
    <v-data-table
      :headers="CABECALHOS"
      :items="snapshots"
      :items-per-page="25"
      density="compact"
      aria-label="Histórico de ocupação"
      no-data-text="Sem dados no período"
    >
      <template #[`item.timestamp`]="{ value }">{{ formatarDataHora(value) }}</template>
      <template #[`item.taxa_ocupacao`]="{ value }">{{ formatarPercentual(value) }}</template>
    </v-data-table>
  </div>
</template>
