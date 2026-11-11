<script setup>
/**
 * Estacionamentos sob responsabilidade do admin (UC09).
 */
import { onMounted, ref } from 'vue'
import * as estacionamentosApi from '@/api/estacionamentos'
import { useNotificacaoStore } from '@/stores/notificacao'
import AdminsDialog from '@/components/admin/AdminsDialog.vue'
import EstacionamentoDialog from '@/components/admin/EstacionamentoDialog.vue'
import ConfirmarDialog from '@/components/comum/ConfirmarDialog.vue'
import EstadoVazio from '@/components/comum/EstadoVazio.vue'

const notificacao = useNotificacaoStore()

const CABECALHOS = [
  { title: 'Nome', key: 'nome' },
  { title: 'Endereço', key: 'endereco' },
  { title: 'Ativo', key: 'ativo', width: 100 },
  { title: 'Ações', key: 'acoes', sortable: false, align: 'end' },
]

const estacionamentos = ref([])
const carregando = ref(true)
const alternando = ref(null)

const dialogoEdicao = ref(false)
const emEdicao = ref(null)
const dialogoAdmins = ref(false)
const emGestao = ref(null)
const dialogoRemocao = ref(false)
const aRemover = ref(null)

async function carregar() {
  carregando.value = true
  try {
    estacionamentos.value = await estacionamentosApi.listar()
  } catch {
    // Erro já mostrado pelo interceptador
  } finally {
    carregando.value = false
  }
}

function substituir(atualizado) {
  const indice = estacionamentos.value.findIndex((e) => e.id === atualizado.id)
  if (indice >= 0) estacionamentos.value[indice] = atualizado
  else estacionamentos.value.push(atualizado)
}

async function alternarAtivo(estacionamento, ativo) {
  alternando.value = estacionamento.id
  try {
    // `nome` vai junto porque o `EstacionamentoIn` do back-end o exige também na edição
    substituir(await estacionamentosApi.editar(estacionamento.id, { nome: estacionamento.nome, ativo }))
  } catch {
    // Erro já mostrado; o switch volta ao valor anterior
  } finally {
    alternando.value = null
  }
}

function abrirEdicao(estacionamento = null) {
  emEdicao.value = estacionamento
  dialogoEdicao.value = true
}

async function salvar(dados) {
  try {
    if (emEdicao.value) {
      substituir(await estacionamentosApi.editar(emEdicao.value.id, dados))
      notificacao.sucesso('Estacionamento atualizado.')
    } else {
      substituir(await estacionamentosApi.criar(dados))
      notificacao.sucesso('Estacionamento criado.')
    }
    dialogoEdicao.value = false
  } catch {
    // Mantém o diálogo aberto; erro já mostrado
  }
}

function abrirAdmins(estacionamento) {
  emGestao.value = estacionamento
  dialogoAdmins.value = true
}

async function atribuirAdmin(usuarioId) {
  try {
    await estacionamentosApi.atribuirAdmin(emGestao.value.id, usuarioId)
    notificacao.sucesso('Administrador atribuído.')
  } catch {
    // Erro já mostrado pelo interceptador
  }
}

async function removerAdmin(usuarioId) {
  try {
    await estacionamentosApi.removerAdmin(emGestao.value.id, usuarioId)
    notificacao.sucesso('Administrador removido.')
  } catch {
    // Erro já mostrado pelo interceptador
  }
}

function confirmarRemocao(estacionamento) {
  aRemover.value = estacionamento
  dialogoRemocao.value = true
}

async function remover() {
  const { id } = aRemover.value
  try {
    await estacionamentosApi.remover(id)
    estacionamentos.value = estacionamentos.value.filter((e) => e.id !== id)
    notificacao.sucesso('Estacionamento removido.')
  } catch {
    // Ex.: estacionamento com câmeras; erro do back-end já mostrado
  }
}

onMounted(carregar)
</script>

<template>
  <v-container>
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <h1 class="text-h5">Gerenciar estacionamentos</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="abrirEdicao()">Novo estacionamento</v-btn>
    </div>

    <EstadoVazio
      v-if="!carregando && !estacionamentos.length"
      icone="mdi-parking"
      titulo="Nenhum estacionamento sob sua responsabilidade"
      texto="Crie um estacionamento para cadastrar câmeras e demarcar vagas."
    />

    <v-card v-else>
      <v-data-table
        :headers="CABECALHOS"
        :items="estacionamentos"
        :loading="carregando"
        loading-text="Carregando…"
        aria-label="Estacionamentos"
      >
        <template #[`item.endereco`]="{ value }">{{ value || '—' }}</template>
        <template #[`item.ativo`]="{ item }">
          <v-switch
            :model-value="item.ativo"
            :loading="alternando === item.id"
            :disabled="alternando === item.id"
            :aria-label="`${item.nome} ativo`"
            color="primary"
            density="compact"
            hide-details
            @update:model-value="alternarAtivo(item, $event)"
          />
        </template>
        <template #[`item.acoes`]="{ item }">
          <div class="d-flex justify-end">
            <v-btn icon="mdi-pencil" variant="text" size="small" :aria-label="`Editar ${item.nome}`" @click="abrirEdicao(item)" />
            <v-btn icon="mdi-account-key" variant="text" size="small" :aria-label="`Administradores de ${item.nome}`" @click="abrirAdmins(item)" />
            <v-btn icon="mdi-cctv" variant="text" size="small" :aria-label="`Câmeras de ${item.nome}`" :to="{ name: 'admin-cameras', params: { id: item.id } }" />
            <v-btn icon="mdi-chart-line" variant="text" size="small" :aria-label="`Histórico de ${item.nome}`" :to="{ name: 'admin-historico', params: { id: item.id } }" />
            <v-btn icon="mdi-delete" variant="text" size="small" color="error" :aria-label="`Remover ${item.nome}`" @click="confirmarRemocao(item)" />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <EstacionamentoDialog v-model="dialogoEdicao" :estacionamento="emEdicao" @salvar="salvar" />
    <AdminsDialog
      v-if="emGestao"
      v-model="dialogoAdmins"
      :estacionamento="emGestao"
      @atribuir="atribuirAdmin"
      @remover="removerAdmin"
    />
    <ConfirmarDialog
      v-model="dialogoRemocao"
      titulo="Remover estacionamento?"
      :mensagem="`“${aRemover?.nome}” será removido. Só é possível remover um estacionamento sem câmeras.`"
      texto-confirmar="Remover"
      perigoso
      @confirmar="remover"
    />
  </v-container>
</template>
