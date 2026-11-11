<script setup>
/**
 * Login (UC04). Em 401, mostra uma mensagem única, sem indicar qual campo errou (fluxo A1).
 */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const senha = ref('')
const senhaVisivel = ref(false)
const enviando = ref(false)
const erro = ref('')

/** Só aceita caminhos internos, para o `redirect` não levar a outro site. */
function destino() {
  const { redirect } = route.query
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/'
}

async function entrar() {
  erro.value = ''
  enviando.value = true
  try {
    await authStore.entrar(email.value.trim(), senha.value)
    await router.replace(destino())
  } catch (falha) {
    // Os demais erros já aparecem no snackbar
    if (falha.response?.status === 401) erro.value = 'E-mail ou senha inválidos.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <v-container class="fill-height justify-center">
    <v-card width="100%" max-width="420" class="pa-2">
      <v-card-item>
        <v-card-title as="h1" class="text-h5">Entrar</v-card-title>
        <v-card-subtitle>Estacionamento UFABC</v-card-subtitle>
      </v-card-item>
      <v-form @submit.prevent="entrar">
        <v-card-text>
          <v-text-field
            v-model="email"
            label="E-mail"
            type="email"
            autocomplete="username"
            prepend-inner-icon="mdi-email-outline"
            autofocus
          />
          <v-text-field
            v-model="senha"
            label="Senha"
            :type="senhaVisivel ? 'text' : 'password'"
            autocomplete="current-password"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="senhaVisivel ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="senhaVisivel = !senhaVisivel"
          />
          <v-alert v-if="erro" type="error" variant="tonal" density="compact" role="alert">{{ erro }}</v-alert>
        </v-card-text>
        <v-card-actions class="flex-column align-stretch ga-2 px-4">
          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            size="large"
            :loading="enviando"
            :disabled="!email || !senha"
          >
            Entrar
          </v-btn>
          <v-btn variant="text" :to="{ name: 'cadastro' }">Criar conta</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>
