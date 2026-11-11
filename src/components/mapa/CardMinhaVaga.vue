<script setup>
/**
 * "Onde estacionei": vaga da sessão ativa e há quanto tempo.
 * O tempo é atualizado a cada minuto localmente, a partir de `sessao.inicio`.
 */
import { computed, onUnmounted, ref } from 'vue'
import { formatarDuracao } from '@/utils/datas'

const props = defineProps({
  /** `SessaoOut` */
  sessao: { type: Object, required: true },
})
const emit = defineEmits(['encerrar'])

const agora = ref(Date.now())
const relogio = setInterval(() => {
  agora.value = Date.now()
}, 60_000)
onUnmounted(() => clearInterval(relogio))

const tempo = computed(() => {
  const minutos = (agora.value - Date.parse(props.sessao.inicio)) / 60_000
  return formatarDuracao(Math.max(0, minutos))
})
</script>

<template>
  <v-card color="primary" variant="tonal">
    <v-card-text class="d-flex flex-wrap align-center ga-3">
      <v-icon icon="mdi-car" size="32" aria-hidden="true" />
      <div class="flex-grow-1 text-body-1">
        Seu carro está na vaga <strong>{{ sessao.vaga_rotulo }}</strong> há {{ tempo }}
        <div v-if="sessao.estacionamento_nome" class="text-body-2">{{ sessao.estacionamento_nome }}</div>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-exit-run" @click="emit('encerrar')">
        Saí do estacionamento
      </v-btn>
    </v-card-text>
  </v-card>
</template>
