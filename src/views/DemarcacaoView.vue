<script setup>
/**
 * Demarcação das vagas de uma câmera (RF02, UC08).
 * Salvar substitui todas as vagas da câmera, e o back-end cria ids novos.
 */
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import * as camerasApi from '@/api/cameras'
import { useEditorVagas } from '@/composables/useEditorVagas'
import { useFrameCamera } from '@/composables/useFrameCamera'
import { useNotificacaoStore } from '@/stores/notificacao'
import ConfirmarDialog from '@/components/comum/ConfirmarDialog.vue'
import EstadoVazio from '@/components/comum/EstadoVazio.vue'
import BarraDemarcacao from '@/components/demarcacao/BarraDemarcacao.vue'
import EditorVagas from '@/components/demarcacao/EditorVagas.vue'
import ListaVagas from '@/components/demarcacao/ListaVagas.vue'

const route = useRoute()
const notificacao = useNotificacaoStore()

const cameraId = computed(() => route.params.id)
/** Vem da `CamerasView`; sem ele, a tela funciona, mas sem nome e status da câmera. */
const estacionamentoId = computed(() => route.query.estacionamento ?? null)

const frame = useFrameCamera(cameraId)
const editor = useEditorVagas()
provide('editor', editor)

const camera = ref(null)
const carregandoVagas = ref(true)
const salvando = ref(false)
const confirmarSalvar = ref(false)
const confirmarSaida = ref(false)

async function carregarVagas() {
  carregandoVagas.value = true
  try {
    editor.carregar(await camerasApi.listarVagas(cameraId.value))
  } catch {
    // Erro já mostrado pelo interceptador
  } finally {
    carregandoVagas.value = false
  }
}

watch(cameraId, carregarVagas, { immediate: true })

watch([estacionamentoId, cameraId], async ([estacionamento, id]) => {
  camera.value = null
  if (!estacionamento) return
  try {
    camera.value = (await camerasApi.listar(estacionamento)).find((c) => c.id === id) ?? null
  } catch {
    // Só complementa o título e o aviso de monitoramento
  }
}, { immediate: true })

/** Com a câmera em monitoramento, avisa antes de trocar as vagas (e seus ids). */
function pedirSalvar() {
  if (camera.value?.ativa) confirmarSalvar.value = true
  else salvar()
}

async function salvar() {
  salvando.value = true
  try {
    editor.carregar(await camerasApi.definirVagas(cameraId.value, editor.paraPayload()))
    notificacao.sucesso('Vagas salvas.')
  } catch {
    // Erro já mostrado (ex.: rótulo repetido em outra câmera do estacionamento)
  } finally {
    salvando.value = false
  }
}

// Saída com alterações não salvas: navegação interna (diálogo) e fechamento da aba (navegador)
let responderSaida = null

onBeforeRouteLeave(() => {
  if (!editor.alterado.value) return true
  // Outra navegação com o diálogo aberto: a anterior fica cancelada
  responderSaida?.(false)
  confirmarSaida.value = true
  return new Promise((resolve) => {
    responderSaida = resolve
  })
})

// O `ConfirmarDialog` emite `confirmar` antes de fechar; fechar sem confirmar é cancelar
watch(confirmarSaida, (aberto) => {
  if (!aberto) {
    responderSaida?.(false)
    responderSaida = null
  }
})

function sairSemSalvar() {
  responderSaida?.(true)
  responderSaida = null
}

function aoFecharAba(evento) {
  if (!editor.alterado.value) return
  evento.preventDefault()
  evento.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', aoFecharAba))
onUnmounted(() => window.removeEventListener('beforeunload', aoFecharAba))
</script>

<template>
  <v-container fluid>
    <div class="d-flex flex-wrap align-center ga-2 mb-2">
      <v-btn
        v-if="estacionamentoId"
        icon="mdi-arrow-left"
        variant="text"
        aria-label="Voltar para as câmeras"
        :to="{ name: 'admin-cameras', params: { id: estacionamentoId } }"
      />
      <div>
        <h1 class="text-h5">Demarcar vagas</h1>
        <div v-if="camera" class="text-body-2 text-medium-emphasis">{{ camera.nome }}</div>
      </div>
    </div>

    <BarraDemarcacao
      @salvar="pedirSalvar"
      @descartar="carregarVagas"
      @recarregar-frame="frame.recarregar()"
    />
    <v-progress-linear
      v-if="salvando || carregandoVagas || frame.carregando.value"
      indeterminate
      color="primary"
      class="mb-2"
    />

    <v-row>
      <v-col cols="12" md="8">
        <EstadoVazio
          v-if="frame.erro.value"
          icone="mdi-camera-off"
          titulo="Não foi possível conectar à câmera"
          :texto="frame.erro.value"
        >
          <v-btn color="primary" :loading="frame.carregando.value" @click="frame.recarregar()">
            Tentar novamente
          </v-btn>
        </EstadoVazio>
        <v-card v-else-if="frame.url.value">
          <EditorVagas
            :url-frame="frame.url.value"
            :largura="frame.largura.value"
            :altura="frame.altura.value"
          />
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card title="Vagas">
          <ListaVagas />
        </v-card>
      </v-col>
    </v-row>

    <ConfirmarDialog
      v-model="confirmarSalvar"
      titulo="Salvar vagas?"
      texto-confirmar="Salvar"
      @confirmar="salvar"
    >
      Esta câmera está em monitoramento. Salvar substitui todas as vagas e cria novos ids: os motoristas
      que registraram uma vaga desta câmera perdem a referência a ela.
    </ConfirmarDialog>
    <ConfirmarDialog
      v-model="confirmarSaida"
      titulo="Sair sem salvar?"
      mensagem="As alterações nas vagas serão perdidas."
      texto-confirmar="Sair"
      perigoso
      @confirmar="sairSemSalvar"
    />
  </v-container>
</template>
