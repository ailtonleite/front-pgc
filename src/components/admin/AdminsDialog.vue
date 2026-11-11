<script setup>
/**
 * Atribui ou retira administradores de um estacionamento.
 * O back-end só aceita o id do usuário e não lista os administradores atuais (ver seção 12).
 */
import { ref, watch } from 'vue'

defineProps({
  /** `EstacionamentoOut` */
  estacionamento: { type: Object, required: true },
})
const emit = defineEmits(['atribuir', 'remover'])
const aberto = defineModel({ type: Boolean, default: false })

const formulario = ref(null)
const usuarioId = ref('')

const obrigatorio = (valor) => Boolean(valor?.trim()) || 'Informe o id do usuário.'

watch(aberto, (valor) => {
  if (!valor) return
  usuarioId.value = ''
  formulario.value?.resetValidation()
})

async function enviar(evento) {
  const { valid } = await formulario.value.validate()
  if (valid) emit(evento, usuarioId.value.trim())
}
</script>

<template>
  <v-dialog v-model="aberto" max-width="480">
    <v-card title="Administradores" :subtitle="estacionamento.nome">
      <v-form ref="formulario" @submit.prevent="enviar('atribuir')">
        <v-card-text>
          <p class="text-body-2 mb-4">
            Informe o id de um usuário para torná-lo responsável por este estacionamento,
            ou para retirar a responsabilidade.
          </p>
          <v-text-field v-model="usuarioId" label="Id do usuário" :rules="[obrigatorio]" autofocus />
        </v-card-text>
        <v-card-actions class="flex-wrap">
          <v-btn variant="text" @click="aberto = false">Fechar</v-btn>
          <v-spacer />
          <v-btn color="error" variant="text" @click="enviar('remover')">Remover</v-btn>
          <v-btn type="submit" color="primary" variant="flat">Atribuir</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
