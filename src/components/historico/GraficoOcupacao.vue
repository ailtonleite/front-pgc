<script setup>
/**
 * Gráfico de linha da taxa de ocupação (0 a 100%). A `TabelaHistorico` é a alternativa acessível.
 */
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { Line } from 'vue-chartjs'
import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { formatarDataHora, formatarPercentual } from '@/utils/datas'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps({
  /** `SnapshotOut[]` */
  snapshots: { type: Array, required: true },
  granularidade: { type: String, required: true },
})

const tema = useTheme()

const doisDigitos = (n) => String(n).padStart(2, '0')

/** Cor do tema (`#rgb` ou `#rrggbb`) com transparência, no formato do Chart.js. */
function comAlfa(hex, alfa) {
  let digitos = hex.replace('#', '')
  if (digitos.length === 3) digitos = [...digitos].map((d) => d + d).join('')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(digitos.slice(i, i + 2), 16))
  return `rgba(${r}, ${g}, ${b}, ${alfa})`
}

/** Número da semana ISO 8601 (semana começa na segunda-feira, como no back-end). */
function semanaIso(data) {
  const dia = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()))
  dia.setUTCDate(dia.getUTCDate() + 4 - (dia.getUTCDay() || 7))
  const inicioAno = new Date(Date.UTC(dia.getUTCFullYear(), 0, 1))
  return Math.ceil(((dia - inicioAno) / 86_400_000 + 1) / 7)
}

/** Eixo X: hora "14h", dia "25/10", semana "sem. 43". */
function rotuloEixo(iso) {
  const data = new Date(iso)
  if (props.granularidade === 'hora') return `${data.getHours()}h`
  if (props.granularidade === 'dia') return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`
  return `sem. ${semanaIso(data)}`
}

const dados = computed(() => {
  const { primary } = tema.current.value.colors
  return {
    labels: props.snapshots.map((snapshot) => rotuloEixo(snapshot.timestamp)),
    datasets: [
      {
        label: 'Taxa de ocupação',
        data: props.snapshots.map((snapshot) => snapshot.taxa_ocupacao * 100),
        borderColor: primary,
        backgroundColor: comAlfa(primary, 0.2),
        fill: true,
        tension: 0.3,
        pointRadius: props.snapshots.length > 60 ? 0 : 3,
      },
    ],
  }
})

const opcoes = computed(() => {
  const cores = tema.current.value.colors
  const texto = cores['on-surface']
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: texto, callback: (valor) => `${valor}%` },
        grid: { color: comAlfa(texto, 0.12) },
      },
      x: {
        ticks: { color: texto },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: ([item]) => formatarDataHora(props.snapshots[item.dataIndex].timestamp),
          label: (item) => `Ocupação: ${formatarPercentual(props.snapshots[item.dataIndex].taxa_ocupacao)}`,
          afterLabel: (item) => {
            const { livres, ocupadas } = props.snapshots[item.dataIndex]
            return `Livres: ${livres} · Ocupadas: ${ocupadas}`
          },
        },
      },
    },
  }
})
</script>

<template>
  <div
    class="grafico-ocupacao"
    role="img"
    aria-label="Gráfico da taxa de ocupação no período. Os mesmos dados estão disponíveis na visualização em tabela."
  >
    <Line :data="dados" :options="opcoes" />
  </div>
</template>

<style scoped>
.grafico-ocupacao {
  position: relative;
  height: 320px;
}
</style>
