<script setup>
/**
 * Dados da conta do motorista e placa do veículo.
 */
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useNotificacaoStore } from '@/stores/notificacao'
import { REGEX_PLACA } from '@/utils/constantes'

const authStore = useAuthStore()
const { usuario } = storeToRefs(authStore)
const notificacao = useNotificacaoStore()

const formulario = ref(null)
const placa = ref('')
const enviando = ref(false)

const regrasPlaca = [(v) => !v?.trim() || REGEX_PLACA.test(v.trim()) || 'Use o formato AAA1234 ou AAA1A23.']

watch(() => usuario.value?.placa, (atual) => {
  placa.value = atual ?? ''
}, { immediate: true })

async function enviar(novaPlaca, mensagem) {
  enviando.value = true
  try {
    await authStore.atualizarPlaca(novaPlaca)
    notificacao.sucesso(mensagem)
  } catch {
    // Erro já mostrado pelo interceptador
  } finally {
    enviando.value = false
  }
}

async function salvar() {
  const { valid } = await formulario.value.validate()
  if (!valid) return
  const novaPlaca = placa.value.trim() || null
  await enviar(novaPlaca, novaPlaca ? 'Placa atualizada.' : 'Placa removida.')
}

function remover() {
  enviar(null, 'Placa removida.')
}
</script>

<template>
  <v-container class="perfil">
    <h1 class="text-h5 mb-4">Meu perfil</h1>

    <v-card class="mb-4" title="Conta">
      <v-list density="compact">
        <v-list-item prepend-icon="mdi-account" title="Nome" :subtitle="usuario?.nome" />
        <v-list-item prepend-icon="mdi-email-outline" title="E-mail" :subtitle="usuario?.email" />
      </v-list>
    </v-card>

    <v-card title="Placa do veículo">
      <v-form ref="formulario" @submit.prevent="salvar">
        <v-card-text>
          <p class="text-body-2 mb-4">
            A placa é opcional e serve apenas para identificação da sua conta. Ela não é exibida a
            outros usuários.
          </p>
          <v-text-field
            v-model="placa"
            label="Placa"
            :rules="regrasPlaca"
            hint="AAA1234 ou AAA1A23"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="error"
            variant="text"
            :disabled="!usuario?.placa || enviando"
            @click="remover"
          >
            Remover placa
          </v-btn>
          <v-spacer />
          <v-btn type="submit" color="primary" variant="flat" :loading="enviando">Salvar</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>

<style scoped>
.perfil {
  max-width: 640px;
}
</style>
