<script setup>
/**
 * Mapa em tempo real de um estacionamento (RF03, RF05, UC01, UC02, UC03, UC05).
 */
import { computed, effectScope, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import * as camerasApi from '@/api/cameras'
import * as estacionamentosApi from '@/api/estacionamentos'
import { useEventosVagas } from '@/composables/useEventosVagas'
import { useFrameCamera } from '@/composables/useFrameCamera'
import { useAuthStore } from '@/stores/auth'
import { useNotificacaoStore } from '@/stores/notificacao'
import { useOcupacaoStore } from '@/stores/ocupacao'
import { useSessaoStore } from '@/stores/sessao'
import EstadoVazio from '@/components/comum/EstadoVazio.vue'
import CardMinhaVaga from '@/components/mapa/CardMinhaVaga.vue'
import CardsTotais from '@/components/mapa/CardsTotais.vue'
import DetalheVagaDialog from '@/components/mapa/DetalheVagaDialog.vue'
import LegendaStatus from '@/components/mapa/LegendaStatus.vue'
import MapaVagas from '@/components/mapa/MapaVagas.vue'

const route = useRoute()
const { eAdmin, eMotorista } = storeToRefs(useAuthStore())
const notificacao = useNotificacaoStore()
const ocupacaoStore = useOcupacaoStore()
const { vagas, vagasPorId, vagasPorCamera, totais, carregando } = storeToRefs(ocupacaoStore)
const sessaoStore = useSessaoStore()
const { sessao, vagaId: vagaDaSessao } = storeToRefs(sessaoStore)

const estacionamentoId = computed(() => route.params.id)
const { conectado } = useEventosVagas(estacionamentoId)

const nomeEstacionamento = ref('')
const nomesCameras = ref({})
const cameraAtiva = ref(null)
const vagaSelecionadaId = ref(null)
const dialogoAberto = ref(false)
const mostrarImagem = ref(false)

const idsCameras = computed(() => Object.keys(vagasPorCamera.value))

// Lida da store, para o diálogo acompanhar as mudanças de status em tempo real
const vagaSelecionada = computed(() => vagasPorId.value[vagaSelecionadaId.value] ?? null)

watch(idsCameras, (ids) => {
  if (!ids.includes(cameraAtiva.value)) cameraAtiva.value = ids[0] ?? null
})

/** O motorista não acessa `GET /cameras`, então as abas ficam numeradas (ver seção 12). */
function nomeCamera(cameraId, indice) {
  return nomesCameras.value[cameraId] ?? `Câmera ${indice + 1}`
}

async function carregar(id) {
  nomeEstacionamento.value = ''
  nomesCameras.value = {}
  mostrarImagem.value = false

  // Complementos do mapa: uma falha aqui não impede a exibição das vagas
  estacionamentosApi.listar().then((lista) => {
    if (id === estacionamentoId.value) nomeEstacionamento.value = lista.find((e) => e.id === id)?.nome ?? ''
  }).catch(() => {})
  if (eAdmin.value) {
    camerasApi.listar(id).then((lista) => {
      if (id === estacionamentoId.value) {
        nomesCameras.value = Object.fromEntries(lista.map((camera) => [camera.id, camera.nome]))
      }
    }).catch(() => {})
  }
  if (eMotorista.value) sessaoStore.carregar().catch(() => {})

  try {
    await ocupacaoStore.carregar(id)
  } catch {
    // Erro já mostrado pelo interceptador
  }
}

watch(estacionamentoId, carregar, { immediate: true })
onUnmounted(() => ocupacaoStore.limpar())

// Imagens das câmeras (somente admin), buscadas sob demanda para a aba aberta.
// O escopo é filho do componente: é encerrado (e as URLs liberadas) ao sair da tela.
const escopoFrames = effectScope()
const frames = reactive({})

watch([mostrarImagem, cameraAtiva], ([mostrar, cameraId]) => {
  if (mostrar && cameraId && !frames[cameraId]) {
    frames[cameraId] = escopoFrames.run(() => useFrameCamera(cameraId))
  }
})

function fundo(cameraId) {
  const frame = mostrarImagem.value ? frames[cameraId] : null
  return frame?.url ? frame : null
}

function abrirVaga(vaga) {
  vagaSelecionadaId.value = vaga.id
  dialogoAberto.value = true
}

async function registrar() {
  try {
    await sessaoStore.registrar(vagaSelecionadaId.value)
    dialogoAberto.value = false
  } catch {
    // Erro já mostrado pelo interceptador
  }
}

async function encerrar() {
  try {
    await sessaoStore.encerrar()
    notificacao.info('Sessão encerrada.')
  } catch {
    // Erro já mostrado pelo interceptador
  }
}
</script>

<template>
  <v-container>
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" aria-label="Voltar" :to="{ name: 'inicio' }" />
      <h1 class="text-h5">{{ nomeEstacionamento || 'Mapa de vagas' }}</h1>
      <v-spacer />
      <v-switch
        v-if="eAdmin"
        v-model="mostrarImagem"
        label="Mostrar imagem da câmera"
        color="primary"
        density="compact"
        hide-details
      />
    </div>

    <CardMinhaVaga v-if="sessao" :sessao="sessao" class="mb-4" @encerrar="encerrar" />
    <CardsTotais :totais="totais" :conectado="conectado" class="mb-4" />

    <v-progress-linear v-if="carregando" indeterminate color="primary" />

    <EstadoVazio
      v-else-if="!vagas.length"
      icone="mdi-vector-square"
      titulo="Nenhuma vaga demarcada"
      :texto="eAdmin ? 'Demarque as vagas nas câmeras deste estacionamento.' : 'Este estacionamento ainda não tem vagas cadastradas.'"
    />

    <v-card v-else>
      <v-tabs v-model="cameraAtiva" color="primary" show-arrows>
        <v-tab v-for="(cameraId, indice) in idsCameras" :key="cameraId" :value="cameraId">
          {{ nomeCamera(cameraId, indice) }}
        </v-tab>
      </v-tabs>
      <v-divider />
      <v-window v-model="cameraAtiva">
        <v-window-item v-for="cameraId in idsCameras" :key="cameraId" :value="cameraId">
          <div class="pa-4">
            <v-progress-linear
              v-if="mostrarImagem && frames[cameraId]?.carregando"
              indeterminate
              color="primary"
              class="mb-2"
            />
            <v-alert
              v-if="mostrarImagem && frames[cameraId]?.erro"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-2"
            >
              {{ frames[cameraId].erro }}
            </v-alert>
            <MapaVagas
              :vagas="vagasPorCamera[cameraId]"
              :url-fundo="fundo(cameraId)?.url ?? null"
              :largura="fundo(cameraId)?.largura ?? null"
              :altura="fundo(cameraId)?.altura ?? null"
              :vaga-destacada="vagaDaSessao"
              interativo
              @selecionar="abrirVaga"
            />
          </div>
        </v-window-item>
      </v-window>
    </v-card>

    <LegendaStatus class="mt-4" />

    <DetalheVagaDialog
      v-model="dialogoAberto"
      :vaga="vagaSelecionada"
      :pode-registrar="eMotorista && vagaSelecionada?.status === 'OCUPADA'"
      :e-minha-vaga="Boolean(vagaSelecionada) && vagaSelecionada.id === vagaDaSessao"
      :e-motorista="eMotorista"
      @registrar="registrar"
    />
  </v-container>
</template>
