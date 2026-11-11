<script setup>
/**
 * Câmeras de um estacionamento (RF01, UC08).
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as camerasApi from '@/api/cameras'
import * as estacionamentosApi from '@/api/estacionamentos'
import { useNotificacaoStore } from '@/stores/notificacao'
import { TIPOS_FONTE } from '@/utils/constantes'
import CameraDialog from '@/components/admin/CameraDialog.vue'
import ConfirmarDialog from '@/components/comum/ConfirmarDialog.vue'
import EstadoVazio from '@/components/comum/EstadoVazio.vue'

const route = useRoute()
const router = useRouter()
const notificacao = useNotificacaoStore()

const estacionamentoId = computed(() => route.params.id)

const nomeEstacionamento = ref('')
const cameras = ref([])
const carregando = ref(true)
const alternando = ref(null)

const dialogoCamera = ref(false)
const emEdicao = ref(null)
const dialogoRemocao = ref(false)
const aRemover = ref(null)
const dialogoDemarcar = ref(false)
const recemCriada = ref(null)

const rotuloTipo = (tipo) => TIPOS_FONTE.find((opcao) => opcao.value === tipo)?.title ?? tipo

/** A demarcação recebe o estacionamento para mostrar o nome e o status da câmera. */
function rotaDemarcacao(camera) {
  return { name: 'admin-demarcacao', params: { id: camera.id }, query: { estacionamento: estacionamentoId.value } }
}

async function carregar(id) {
  carregando.value = true
  estacionamentosApi.listar().then((lista) => {
    if (id === estacionamentoId.value) nomeEstacionamento.value = lista.find((e) => e.id === id)?.nome ?? ''
  }).catch(() => {})
  try {
    cameras.value = await camerasApi.listar(id)
  } catch {
    cameras.value = []
  } finally {
    carregando.value = false
  }
}

watch(estacionamentoId, carregar, { immediate: true })

function substituir(atualizada) {
  const indice = cameras.value.findIndex((camera) => camera.id === atualizada.id)
  if (indice >= 0) cameras.value[indice] = atualizada
  else cameras.value.push(atualizada)
}

function abrirDialogo(camera = null) {
  emEdicao.value = camera
  dialogoCamera.value = true
}

async function salvar(dados) {
  try {
    if (emEdicao.value) {
      substituir(await camerasApi.atualizar(emEdicao.value.id, dados))
      notificacao.sucesso('Câmera atualizada.')
      dialogoCamera.value = false
    } else {
      const camera = await camerasApi.cadastrar(estacionamentoId.value, dados)
      substituir(camera)
      dialogoCamera.value = false
      // Oferece ir direto para a demarcação
      recemCriada.value = camera
      dialogoDemarcar.value = true
    }
  } catch {
    // Mantém o diálogo aberto; erro já mostrado
  }
}

async function alternarMonitoramento(camera, ativar) {
  alternando.value = camera.id
  try {
    await (ativar ? camerasApi.iniciar(camera.id) : camerasApi.parar(camera.id))
    camera.ativa = ativar
  } catch {
    // Ex.: câmera inacessível (503); o switch volta ao valor anterior
  } finally {
    alternando.value = null
  }
}

function confirmarRemocao(camera) {
  aRemover.value = camera
  dialogoRemocao.value = true
}

async function remover() {
  const { id } = aRemover.value
  try {
    await camerasApi.remover(id)
    cameras.value = cameras.value.filter((camera) => camera.id !== id)
    notificacao.sucesso('Câmera removida.')
  } catch {
    // Erro já mostrado pelo interceptador
  }
}
</script>

<template>
  <v-container>
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" aria-label="Voltar" :to="{ name: 'admin-estacionamentos' }" />
      <div>
        <h1 class="text-h5">Câmeras</h1>
        <div v-if="nomeEstacionamento" class="text-body-2 text-medium-emphasis">{{ nomeEstacionamento }}</div>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="abrirDialogo()">Nova câmera</v-btn>
    </div>

    <v-progress-linear v-if="carregando" indeterminate color="primary" />

    <EstadoVazio
      v-else-if="!cameras.length"
      icone="mdi-cctv"
      titulo="Nenhuma câmera cadastrada"
      texto="Cadastre uma câmera para demarcar as vagas e iniciar o monitoramento."
    >
      <v-btn color="primary" @click="abrirDialogo()">Cadastrar câmera</v-btn>
    </EstadoVazio>

    <v-row v-else>
      <v-col v-for="camera in cameras" :key="camera.id" cols="12" sm="6" lg="4">
        <v-card class="h-100 d-flex flex-column">
          <v-card-item>
            <v-card-title as="h2" class="text-h6">{{ camera.nome }}</v-card-title>
            <v-card-subtitle>{{ rotuloTipo(camera.tipo_fonte) }}</v-card-subtitle>
            <template #append>
              <v-chip size="small" :color="camera.ativa ? 'success' : undefined">
                {{ camera.ativa ? 'Monitorando' : 'Parada' }}
              </v-chip>
            </template>
          </v-card-item>
          <v-card-text class="flex-grow-1">
            <v-switch
              :model-value="camera.ativa"
              label="Monitorando"
              color="primary"
              :loading="alternando === camera.id"
              :disabled="alternando === camera.id"
              hide-details
              @update:model-value="alternarMonitoramento(camera, $event)"
            />
          </v-card-text>
          <v-card-actions class="flex-wrap">
            <v-btn color="primary" variant="flat" prepend-icon="mdi-vector-square" :to="rotaDemarcacao(camera)">
              Demarcar vagas
            </v-btn>
            <v-btn prepend-icon="mdi-pencil" @click="abrirDialogo(camera)">Editar</v-btn>
            <v-spacer />
            <v-btn
              icon="mdi-delete"
              color="error"
              variant="text"
              :aria-label="`Remover ${camera.nome}`"
              @click="confirmarRemocao(camera)"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <CameraDialog v-model="dialogoCamera" :camera="emEdicao" @salvar="salvar" />
    <ConfirmarDialog
      v-model="dialogoRemocao"
      titulo="Remover câmera?"
      :mensagem="`As vagas demarcadas em “${aRemover?.nome}” também serão removidas.`"
      texto-confirmar="Remover"
      perigoso
      @confirmar="remover"
    />
    <ConfirmarDialog
      v-model="dialogoDemarcar"
      titulo="Câmera cadastrada"
      mensagem="Deseja demarcar as vagas desta câmera agora?"
      texto-confirmar="Demarcar vagas"
      @confirmar="router.push(rotaDemarcacao(recemCriada))"
    />
  </v-container>
</template>
