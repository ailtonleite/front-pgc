<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import AppBarra from '@/components/comum/AppBarra.vue'
import NotificacaoSnackbar from '@/components/comum/NotificacaoSnackbar.vue'

// A barra depende do login, e não de a rota ser pública: um usuário logado na página 404 mantém o menu
const { autenticado } = storeToRefs(useAuthStore())
</script>

<template>
  <v-app>
    <AppBarra v-if="autenticado" />
    <v-main>
      <router-view />
    </v-main>
    <NotificacaoSnackbar />
  </v-app>
</template>
