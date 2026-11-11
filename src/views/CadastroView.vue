<script setup>
/**
 * Cadastro de motorista (UC04), seguido de login automático.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { REGEX_PLACA } from '@/utils/constantes'

const TAMANHO_MIN_SENHA = 8 // mesma regra do back-end

const authStore = useAuthStore()
const router = useRouter()

const formulario = ref(null)
const nome = ref('')
const email = ref('')
const senha = ref('')
const confirmacao = ref('')
const placa = ref('')
const senhaVisivel = ref(false)
const enviando = ref(false)

const regras = {
  nome: [(v) => Boolean(v?.trim()) || 'Informe seu nome.'],
  email: [(v) => /^\S+@\S+\.\S+$/.test(v?.trim() ?? '') || 'Informe um e-mail válido.'],
  senha: [(v) => (v?.length ?? 0) >= TAMANHO_MIN_SENHA || `Use ao menos ${TAMANHO_MIN_SENHA} caracteres.`],
  confirmacao: [(v) => v === senha.value || 'As senhas não conferem.'],
  placa: [(v) => !v?.trim() || REGEX_PLACA.test(v.trim()) || 'Use o formato AAA1234 ou AAA1A23.'],
}

async function cadastrar() {
  const { valid } = await formulario.value.validate()
  if (!valid) return
  enviando.value = true
  try {
    await authStore.cadastrar({
      nome: nome.value.trim(),
      email: email.value.trim(),
      senha: senha.value,
      placa: placa.value.trim() || null,
    })
    await router.replace('/')
  } catch {
    // Erro já mostrado pelo interceptador (ex.: e-mail já cadastrado)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <v-container class="fill-height justify-center">
    <v-card width="100%" max-width="480" class="pa-2">
      <v-card-item>
        <v-card-title as="h1" class="text-h5">Criar conta</v-card-title>
        <v-card-subtitle>Cadastro de motorista</v-card-subtitle>
      </v-card-item>
      <v-form ref="formulario" @submit.prevent="cadastrar">
        <v-card-text>
          <v-text-field v-model="nome" label="Nome" autocomplete="name" :rules="regras.nome" autofocus />
          <v-text-field v-model="email" label="E-mail" type="email" autocomplete="email" :rules="regras.email" />
          <v-text-field
            v-model="senha"
            label="Senha"
            :type="senhaVisivel ? 'text' : 'password'"
            autocomplete="new-password"
            :rules="regras.senha"
            :append-inner-icon="senhaVisivel ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="senhaVisivel = !senhaVisivel"
          />
          <v-text-field
            v-model="confirmacao"
            label="Confirmar senha"
            :type="senhaVisivel ? 'text' : 'password'"
            autocomplete="new-password"
            :rules="regras.confirmacao"
          />
          <v-text-field
            v-model="placa"
            label="Placa do veículo (opcional)"
            :rules="regras.placa"
            hint="AAA1234 ou AAA1A23"
            persistent-hint
          />
          <p class="text-caption text-medium-emphasis mt-4">
            A placa é opcional e serve apenas para identificar sua conta. Ela não é exibida a outros
            usuários e pode ser removida a qualquer momento no seu perfil (LGPD).
          </p>
        </v-card-text>
        <v-card-actions class="flex-column align-stretch ga-2 px-4">
          <v-btn type="submit" color="primary" variant="flat" size="large" :loading="enviando">
            Cadastrar
          </v-btn>
          <v-btn variant="text" :to="{ name: 'login' }">Já tenho conta</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>
