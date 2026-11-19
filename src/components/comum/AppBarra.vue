<script setup>
/**
 * Barra superior com menu lateral. Lê a `authStore` diretamente.
 * O logo fica no menu lateral; na barra verde, só o nome (o logo verde não teria contraste).
 */
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { NOME_SISTEMA, PAPEIS_EXIBICAO } from '@/utils/constantes'
import logo from '@/images/logo-estacionai.png'

const authStore = useAuthStore()
const { usuario, eAdmin } = storeToRefs(authStore)

const menuAberto = ref(false)

const papel = computed(() => PAPEIS_EXIBICAO[usuario.value?.papel] ?? null)

const itens = computed(() => [
  { titulo: 'Estacionamentos', icone: 'mdi-parking', rota: { name: 'inicio' } },
  eAdmin.value && {
    titulo: 'Gerenciar estacionamentos',
    icone: 'mdi-cog',
    rota: { name: 'admin-estacionamentos' },
  },
  { titulo: 'Meu perfil', icone: 'mdi-account', rota: { name: 'perfil' } },
].filter(Boolean))
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-tooltip text="Menu" location="bottom">
      <template #activator="{ props: ativador }">
        <v-app-bar-nav-icon
          v-bind="ativador"
          :aria-label="menuAberto ? 'Fechar menu' : 'Abrir menu'"
          :aria-expanded="menuAberto"
          @click="menuAberto = !menuAberto"
        />
      </template>
    </v-tooltip>
    <v-app-bar-title>{{ NOME_SISTEMA }}</v-app-bar-title>
    <template #append>
      <span class="d-none d-sm-inline mr-2">{{ usuario?.nome }}</span>
      <v-btn prepend-icon="mdi-logout" variant="text" @click="authStore.sair()">Sair</v-btn>
    </template>
  </v-app-bar>

  <v-navigation-drawer v-model="menuAberto" temporary>
    <div class="d-flex justify-center pt-5 pb-2">
      <img :src="logo" :alt="NOME_SISTEMA" width="128" height="64">
    </div>
    <v-list-item
      :title="usuario?.nome"
      :subtitle="usuario?.email"
      prepend-icon="mdi-account-circle"
      class="py-4"
    >
      <v-chip
        v-if="papel"
        :prepend-icon="papel.icone"
        color="primary"
        size="small"
        variant="tonal"
        class="mt-2"
      >
        {{ papel.rotulo }}
      </v-chip>
    </v-list-item>
    <v-divider />
    <v-list nav>
      <v-list-item
        v-for="item in itens"
        :key="item.titulo"
        :title="item.titulo"
        :prepend-icon="item.icone"
        :to="item.rota"
        exact
        @click="menuAberto = false"
      />
    </v-list>
  </v-navigation-drawer>
</template>
