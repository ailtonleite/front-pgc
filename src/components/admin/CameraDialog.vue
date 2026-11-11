<script setup>
/**
 * Formulário de câmera: `camera = null` cria; preenchida edita.
 * Na edição, o `stream_url` precisa ser digitado de novo, porque o `CameraOut` não o devolve.
 * Não fecha sozinho ao salvar: a view fecha depois que a API responder.
 */
import { computed, ref, watch } from 'vue'
import { TIPOS_FONTE } from '@/utils/constantes'

const props = defineProps({
  /** `CameraOut` */
  camera: { type: Object, default: null },
})
const emit = defineEmits(['salvar'])
const aberto = defineModel({ type: Boolean, default: false })

const CAMPO_ENDERECO = {
  arquivo: { rotulo: 'Caminho do arquivo', dica: 'Caminho do vídeo no servidor, ex.: videos/estacionamento.mp4' },
  rtsp: { rotulo: 'URL RTSP', dica: 'rtsp://usuario:senha@endereco:554/stream' },
  kinesis: { rotulo: 'Nome do stream Kinesis', dica: 'Nome do stream no Amazon Kinesis Video Streams' },
}

const formulario = ref(null)
const nome = ref('')
const streamUrl = ref('')
const tipoFonte = ref('rtsp')

const titulo = computed(() => (props.camera ? 'Editar câmera' : 'Nova câmera'))
const campoEndereco = computed(() => CAMPO_ENDERECO[tipoFonte.value])
const dicaEndereco = computed(() =>
  props.camera
    ? `Por segurança, o endereço atual não é exibido. Digite-o novamente. ${campoEndereco.value.dica}`
    : campoEndereco.value.dica,
)

const regrasNome = [(valor) => Boolean(valor?.trim()) || 'Informe o nome.']
const regrasEndereco = computed(() => [
  (valor) => Boolean(valor?.trim()) || `Informe o ${campoEndereco.value.rotulo.toLowerCase()}.`,
  (valor) =>
    tipoFonte.value !== 'rtsp' || /^rtsps?:\/\//i.test((valor ?? '').trim()) || 'A URL deve começar com rtsp://',
])

watch(aberto, (valor) => {
  if (!valor) return
  nome.value = props.camera?.nome ?? ''
  tipoFonte.value = props.camera?.tipo_fonte ?? 'rtsp'
  streamUrl.value = ''
  formulario.value?.resetValidation()
}, { immediate: true })

async function salvar() {
  const { valid } = await formulario.value.validate()
  if (!valid) return
  emit('salvar', {
    nome: nome.value.trim(),
    stream_url: streamUrl.value.trim(),
    tipo_fonte: tipoFonte.value,
  })
}
</script>

<template>
  <v-dialog v-model="aberto" max-width="520">
    <v-card :title="titulo">
      <v-form ref="formulario" @submit.prevent="salvar">
        <v-card-text>
          <v-text-field v-model="nome" label="Nome" :rules="regrasNome" autofocus />
          <v-select v-model="tipoFonte" :items="TIPOS_FONTE" label="Tipo de fonte" />
          <v-text-field
            v-model="streamUrl"
            :label="campoEndereco.rotulo"
            :hint="dicaEndereco"
            :rules="regrasEndereco"
            persistent-hint
            autocomplete="off"
            spellcheck="false"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="aberto = false">Cancelar</v-btn>
          <v-btn type="submit" color="primary" variant="flat">Salvar</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
