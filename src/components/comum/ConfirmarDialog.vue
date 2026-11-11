<script setup>
/**
 * Diálogo de confirmação. O slot padrão substitui a `mensagem` quando o texto precisa de formatação.
 */
defineProps({
  titulo: { type: String, required: true },
  mensagem: { type: String, default: '' },
  textoConfirmar: { type: String, default: 'Confirmar' },
  perigoso: { type: Boolean, default: false },
})
const emit = defineEmits(['confirmar'])
const aberto = defineModel({ type: Boolean, default: false })

/** Emite antes de fechar: quem trata o fechamento como "cancelar" já recebeu a confirmação. */
function confirmar() {
  emit('confirmar')
  aberto.value = false
}
</script>

<template>
  <v-dialog v-model="aberto" max-width="440">
    <v-card :title="titulo">
      <v-card-text>
        <slot>{{ mensagem }}</slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="aberto = false">Cancelar</v-btn>
        <v-btn :color="perigoso ? 'error' : 'primary'" variant="flat" @click="confirmar">
          {{ textoConfirmar }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
