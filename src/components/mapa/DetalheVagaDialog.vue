<script setup>
/**
 * Detalhe da vaga clicada no mapa, com a opção "Estacionei aqui" (UC03).
 */
import { computed, ref, watch } from 'vue'
import { STATUS } from '@/utils/constantes'
import { formatarDuracao } from '@/utils/datas'

const props = defineProps({
  /** `VagaOut` */
  vaga: { type: Object, default: null },
  /** Usuário é motorista **e** a vaga está `OCUPADA`. */
  podeRegistrar: { type: Boolean, default: false },
  /** A vaga é a da sessão ativa. */
  eMinhaVaga: { type: Boolean, default: false },
  /** Mostra a explicação de por que uma vaga livre não pode ser registrada. */
  eMotorista: { type: Boolean, default: false },
})
const emit = defineEmits(['registrar'])
const aberto = defineModel({ type: Boolean, default: false })

const status = computed(() => STATUS[props.vaga?.status] ?? STATUS.DESCONHECIDA)

// Atualizado a cada abertura, para o "há X min" não ficar parado
const agora = ref(Date.now())
watch(aberto, (valor) => {
  if (valor) agora.value = Date.now()
})

const atualizacao = computed(() => {
  if (!props.vaga) return ''
  const minutos = Math.floor((agora.value - Date.parse(props.vaga.atualizado_em)) / 60_000)
  return minutos < 1 ? 'Atualizado agora há pouco' : `Atualizado há ${formatarDuracao(minutos)}`
})
</script>

<template>
  <v-dialog v-model="aberto" max-width="400">
    <v-card v-if="vaga" :title="`Vaga ${vaga.rotulo}`" :subtitle="atualizacao">
      <v-card-text>
        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-chip :color="status.cor" :prepend-icon="status.icone" variant="flat">{{ status.rotulo }}</v-chip>
          <v-chip v-if="eMinhaVaga" color="secondary" prepend-icon="mdi-car" variant="flat">Sua vaga</v-chip>
        </div>
        <p v-if="eMotorista && !eMinhaVaga && vaga.status === 'LIVRE'" class="text-body-2">
          Só é possível registrar uma vaga ocupada: o sistema usa a detecção do seu carro como confirmação.
          Se você acabou de estacionar, aguarde alguns instantes.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="aberto = false">Fechar</v-btn>
        <v-btn
          v-if="podeRegistrar && !eMinhaVaga"
          color="primary"
          variant="flat"
          prepend-icon="mdi-map-marker"
          @click="emit('registrar')"
        >
          Estacionei aqui
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
