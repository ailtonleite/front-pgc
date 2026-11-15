<script setup>
/**
 * Barra superior com menu lateral. Lê a `authStore` diretamente.
 */
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { PAPEIS_EXIBICAO } from '@/utils/constantes'

const authStore = useAuthStore()
const { usuario, eAdmin, eMotorista } = storeToRefs(authStore)

const menuAberto = ref(false)

const papel = computed(() => PAPEIS_EXIBICAO[usuario.value?.papel] ?? null)

const itens = computed(() => [
  { titulo: 'Estacionamentos', icone: 'mdi-parking', rota: { name: 'inicio' } },
  eAdmin.value && {
    titulo: 'Gerenciar estacionamentos',
    icone: 'mdi-cog',
    rota: { name: 'admin-estacionamentos' },
  },
  eMotorista.value && { titulo: 'Meu perfil', icone: 'mdi-account', rota: { name: 'perfil' } },
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
    <v-app-bar-title>Estacionamento UFABC</v-app-bar-title>
    <template #append>
      <span class="d-none d-sm-inline mr-2">{{ usuario?.nome }}</span>
      <v-btn prepend-icon="mdi-logout" variant="text" @click="authStore.sair()">Sair</v-btn>
    </template>
  </v-app-bar>

  <v-navigation-drawer v-model="menuAberto" temporary>
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
