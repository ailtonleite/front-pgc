<script setup>
/**
 * Formulário de estacionamento: `estacionamento = null` cria; preenchido edita.
 * Não fecha sozinho ao salvar: a view fecha depois que a API responder.
 */
import { computed, ref, watch } from 'vue'

const props = defineProps({
  /** `EstacionamentoOut` */
  estacionamento: { type: Object, default: null },
})
const emit = defineEmits(['salvar'])
const aberto = defineModel({ type: Boolean, default: false })

const formulario = ref(null)
const nome = ref('')
const endereco = ref('')
const ativo = ref(true)

const titulo = computed(() => (props.estacionamento ? 'Editar estacionamento' : 'Novo estacionamento'))

const obrigatorio = (valor) => Boolean(valor?.trim()) || 'Informe o nome.'

watch(aberto, (valor) => {
  if (!valor) return
  nome.value = props.estacionamento?.nome ?? ''
  endereco.value = props.estacionamento?.endereco ?? ''
  ativo.value = props.estacionamento?.ativo ?? true
  formulario.value?.resetValidation()
}, { immediate: true })

async function salvar() {
  const { valid } = await formulario.value.validate()
  if (!valid) return
  emit('salvar', {
    nome: nome.value.trim(),
    endereco: endereco.value.trim() || null,
    ativo: ativo.value,
  })
}
</script>

<template>
  <v-dialog v-model="aberto" max-width="480">
    <v-card :title="titulo">
      <v-form ref="formulario" @submit.prevent="salvar">
        <v-card-text>
          <v-text-field v-model="nome" label="Nome" :rules="[obrigatorio]" autofocus />
          <v-text-field v-model="endereco" label="Endereço (opcional)" />
          <v-switch
            v-model="ativo"
            label="Ativo (visível para os motoristas)"
            color="primary"
            hide-details
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
