<script setup>
/**
 * Lista de estacionamentos com as vagas livres de cada um (UC01).
 */
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import * as estacionamentosApi from '@/api/estacionamentos'
import * as ocupacaoApi from '@/api/ocupacao'
import { useAuthStore } from '@/stores/auth'
import EstadoVazio from '@/components/comum/EstadoVazio.vue'
import CardsTotais from '@/components/mapa/CardsTotais.vue'

const { eAdmin } = storeToRefs(useAuthStore())

const estacionamentos = ref([])
const totaisPorId = ref({})
const carregando = ref(true)

async function carregar() {
  carregando.value = true
  try {
    estacionamentos.value = await estacionamentosApi.listar()
  } catch {
    return
  } finally {
    carregando.value = false
  }

  // Estacionamentos inativos não têm ocupação (404); uma falha não impede os demais cards
  const ativos = estacionamentos.value.filter((estacionamento) => estacionamento.ativo)
  const resultados = await Promise.allSettled(ativos.map((estacionamento) => ocupacaoApi.totais(estacionamento.id)))
  totaisPorId.value = Object.fromEntries(
    resultados.flatMap((resultado, i) =>
      resultado.status === 'fulfilled' ? [[ativos[i].id, resultado.value]] : [],
    ),
  )
}

onMounted(carregar)
</script>

<template>
  <v-container>
    <h1 class="text-h5 mb-4">Estacionamentos</h1>

    <v-progress-linear v-if="carregando" indeterminate color="primary" />

    <EstadoVazio
      v-else-if="!estacionamentos.length"
      icone="mdi-parking"
      titulo="Nenhum estacionamento disponível"
      :texto="eAdmin ? 'Cadastre um estacionamento para começar.' : 'Tente novamente mais tarde.'"
    >
      <v-btn v-if="eAdmin" color="primary" :to="{ name: 'admin-estacionamentos' }">Gerenciar estacionamentos</v-btn>
    </EstadoVazio>

    <v-row v-else>
      <v-col v-for="estacionamento in estacionamentos" :key="estacionamento.id" cols="12" sm="6" lg="4">
        <v-card class="h-100 d-flex flex-column">
          <v-card-item>
            <v-card-title as="h2" class="text-h6">{{ estacionamento.nome }}</v-card-title>
            <v-card-subtitle v-if="estacionamento.endereco">{{ estacionamento.endereco }}</v-card-subtitle>
            <template v-if="!estacionamento.ativo" #append>
              <v-chip size="small" color="warning">Inativo</v-chip>
            </template>
          </v-card-item>
          <v-card-text class="flex-grow-1">
            <CardsTotais v-if="totaisPorId[estacionamento.id]" :totais="totaisPorId[estacionamento.id]" compacto />
            <span v-else-if="!estacionamento.ativo" class="text-medium-emphasis">
              Não visível para os motoristas.
            </span>
          </v-card-text>
          <v-card-actions class="flex-wrap">
            <v-btn
              v-if="estacionamento.ativo"
              color="primary"
              variant="flat"
              prepend-icon="mdi-map"
              :to="{ name: 'mapa', params: { id: estacionamento.id } }"
            >
              Ver mapa
            </v-btn>
            <template v-if="eAdmin">
              <v-btn
                prepend-icon="mdi-cctv"
                :to="{ name: 'admin-cameras', params: { id: estacionamento.id } }"
              >
                Câmeras
              </v-btn>
              <v-btn
                prepend-icon="mdi-chart-line"
                :to="{ name: 'admin-historico', params: { id: estacionamento.id } }"
              >
                Histórico
              </v-btn>
            </template>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
