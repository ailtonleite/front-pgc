<script setup>
/**
 * Dados da conta. Motorista: placa do veículo. Admin: estacionamentos sob sua responsabilidade.
 */
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import * as estacionamentosApi from '@/api/estacionamentos'
import { useAuthStore } from '@/stores/auth'
import { useNotificacaoStore } from '@/stores/notificacao'
import BotaoIcone from '@/components/comum/BotaoIcone.vue'
import { vFormatar } from '@/directives/formatar'
import { PAPEIS_EXIBICAO, REGEX_PLACA } from '@/utils/constantes'
import { formatarEndereco } from '@/utils/endereco'
import { formatarPlaca } from '@/utils/placa'

const authStore = useAuthStore()
const { usuario, eAdmin, eMotorista } = storeToRefs(authStore)
const notificacao = useNotificacaoStore()

const papel = computed(() => PAPEIS_EXIBICAO[usuario.value?.papel] ?? null)

// --- Motorista: placa ---

const formulario = ref(null)
const placa = ref('')
const enviando = ref(false)

const regrasPlaca = [(v) => !v?.trim() || REGEX_PLACA.test(v.trim()) || 'Use o formato AAA1234 ou AAA1A23.']

watch(() => usuario.value?.placa, (atual) => {
  placa.value = formatarPlaca(atual)
}, { immediate: true })

async function enviar(novaPlaca, mensagem) {
  enviando.value = true
  try {
    await authStore.atualizarPlaca(novaPlaca)
    notificacao.sucesso(mensagem)
  } catch {
    // Erro já mostrado pelo interceptador
  } finally {
    enviando.value = false
  }
}

async function salvar() {
  const { valid } = await formulario.value.validate()
  if (!valid) return
  const novaPlaca = formatarPlaca(placa.value) || null
  await enviar(novaPlaca, novaPlaca ? 'Placa atualizada.' : 'Placa removida.')
}

function remover() {
  enviar(null, 'Placa removida.')
}

// --- Admin: estacionamentos administrados ---

const estacionamentos = ref([])
const carregandoEstacionamentos = ref(false)
const erroEstacionamentos = ref(false)

/** Para o admin, `GET /estacionamentos` devolve só os estacionamentos sob sua responsabilidade. */
async function carregarEstacionamentos() {
  carregandoEstacionamentos.value = true
  erroEstacionamentos.value = false
  try {
    const lista = await estacionamentosApi.listar()
    estacionamentos.value = [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  } catch {
    erroEstacionamentos.value = true
  } finally {
    carregandoEstacionamentos.value = false
  }
}

watch(eAdmin, (admin) => {
  if (admin) carregarEstacionamentos()
}, { immediate: true })

const resumoEstacionamentos = computed(() => {
  const total = estacionamentos.value.length
  const ativos = estacionamentos.value.filter((e) => e.ativo).length
  const nome = total === 1 ? 'estacionamento' : 'estacionamentos'
  if (ativos === total) return `${total} ${nome}`
  return `${total} ${nome} (${ativos} ${ativos === 1 ? 'ativo' : 'ativos'})`
})
</script>

<template>
  <v-container class="perfil">
    <h1 class="text-h5 mb-4">Meu perfil</h1>

    <v-card class="mb-4" title="Conta">
      <v-list density="compact">
        <v-list-item prepend-icon="mdi-account" title="Nome" :subtitle="usuario?.nome" />
        <v-list-item prepend-icon="mdi-email-outline" title="E-mail" :subtitle="usuario?.email" />
        <v-list-item v-if="papel" :prepend-icon="papel.icone" title="Tipo de conta" :subtitle="papel.rotulo" />
      </v-list>
    </v-card>

    <v-card v-if="eMotorista" title="Placa do veículo">
      <v-form ref="formulario" @submit.prevent="salvar">
        <v-card-text>
          <p class="text-body-2 mb-4">
            A placa é opcional e serve apenas para identificação da sua conta. Ela não é exibida a
            outros usuários.
          </p>
          <v-text-field
            v-model="placa"
            v-formatar="formatarPlaca"
            label="Placa"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
            :rules="regrasPlaca"
            hint="AAA1234 ou AAA1A23"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="error"
            variant="text"
            :disabled="!usuario?.placa || enviando"
            @click="remover"
          >
            Remover placa
          </v-btn>
          <v-spacer />
          <v-btn type="submit" color="primary" variant="flat" :loading="enviando">Salvar</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>

    <v-card v-if="eAdmin">
      <v-card-item>
        <v-card-title as="h2" class="text-h6">Estacionamentos que administro</v-card-title>
        <v-card-subtitle v-if="!carregandoEstacionamentos && estacionamentos.length">
          {{ resumoEstacionamentos }}
        </v-card-subtitle>
        <template #append>
          <v-btn variant="text" color="primary" prepend-icon="mdi-cog" :to="{ name: 'admin-estacionamentos' }">
            Gerenciar
          </v-btn>
        </template>
      </v-card-item>

      <v-progress-linear v-if="carregandoEstacionamentos" indeterminate color="primary" />

      <v-card-text v-else-if="erroEstacionamentos">
        <v-alert type="warning" variant="tonal" density="compact">
          Não foi possível carregar os estacionamentos.
          <template #append>
            <v-btn variant="text" size="small" @click="carregarEstacionamentos">Tentar novamente</v-btn>
          </template>
        </v-alert>
      </v-card-text>

      <v-card-text v-else-if="!estacionamentos.length" class="text-body-2 text-medium-emphasis">
        Você ainda não é responsável por nenhum estacionamento. Crie um em "Gerenciar" ou peça a outro
        administrador para incluir você.
      </v-card-text>

      <v-list v-else aria-label="Estacionamentos que administro" lines="two">
        <v-list-item
          v-for="estacionamento in estacionamentos"
          :key="estacionamento.id"
          prepend-icon="mdi-parking"
          :title="estacionamento.nome"
          :subtitle="formatarEndereco(estacionamento.endereco) || 'Sem endereço cadastrado'"
        >
          <template #append>
            <div class="d-flex align-center flex-wrap justify-end ga-1">
              <v-chip
                size="small"
                :color="estacionamento.ativo ? 'success' : 'warning'"
                class="mr-1"
              >
                {{ estacionamento.ativo ? 'Ativo' : 'Inativo' }}
              </v-chip>
              <!-- O admin responsável vê o mapa mesmo com o estacionamento inativo -->
              <BotaoIcone
                icone="mdi-map"
                dica="Mapa de vagas"
                :rotulo="`Mapa de vagas de ${estacionamento.nome}`"
                size="small"
                :to="{ name: 'mapa', params: { id: estacionamento.id } }"
              />
              <BotaoIcone
                icone="mdi-cctv"
                dica="Câmeras"
                :rotulo="`Câmeras de ${estacionamento.nome}`"
                size="small"
                :to="{ name: 'admin-cameras', params: { id: estacionamento.id } }"
              />
              <BotaoIcone
                icone="mdi-chart-line"
                dica="Histórico de ocupação"
                :rotulo="`Histórico de ${estacionamento.nome}`"
                size="small"
                :to="{ name: 'admin-historico', params: { id: estacionamento.id } }"
              />
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<style scoped>
.perfil {
  max-width: 800px;
}
</style>
