<script setup>
/**
 * Formulário de estacionamento: `estacionamento = null` cria; preenchido edita.
 * Não fecha sozinho ao salvar: a view fecha depois que a API responder.
 *
 * O endereço é opcional como um todo: com todos os campos vazios, vai `endereco: null`
 * (na edição, isso remove o endereço). Basta preencher um campo para os obrigatórios
 * (todos menos o complemento) passarem a ser exigidos.
 */
import { computed, reactive, ref, watch } from 'vue'
import { vFormatar } from '@/directives/formatar'
import {
  CAMPOS_ENDERECO,
  UFS,
  cepValido,
  enderecoEstaVazio,
  enderecoVazio,
  mascararCep,
  paraEnderecoIn,
} from '@/utils/endereco'

const props = defineProps({
  /** `EstacionamentoOut` */
  estacionamento: { type: Object, default: null },
})
const emit = defineEmits(['salvar'])
const aberto = defineModel({ type: Boolean, default: false })

const formulario = ref(null)
const nome = ref('')
const endereco = reactive(enderecoVazio())
const ativo = ref(true)

const titulo = computed(() => (props.estacionamento ? 'Editar estacionamento' : 'Novo estacionamento'))
const semEndereco = computed(() => enderecoEstaVazio(endereco))

const obrigatorio = (mensagem) => (valor) => Boolean(valor?.trim()) || mensagem
/** Exigido só quando algum campo do endereço foi preenchido. */
const obrigatorioNoEndereco = (mensagem) => (valor) => semEndereco.value || Boolean(valor?.trim()) || mensagem

const regras = {
  nome: [obrigatorio('Informe o nome.')],
  rua: [obrigatorioNoEndereco('Informe a rua.')],
  numero: [obrigatorioNoEndereco('Informe o número (ou "s/n").')],
  bairro: [obrigatorioNoEndereco('Informe o bairro.')],
  cidade: [obrigatorioNoEndereco('Informe a cidade.')],
  estado: [
    (valor) => semEndereco.value || Boolean(valor) || 'Informe o estado.',
    (valor) => !valor || UFS.includes(valor.toUpperCase()) || 'Use a sigla da UF.',
  ],
  cep: [
    obrigatorioNoEndereco('Informe o CEP.'),
    (valor) => !valor?.trim() || cepValido(valor) || 'Use 8 dígitos (ex.: 09210-580).',
  ],
}

watch(aberto, (valor) => {
  if (!valor) return
  const atual = props.estacionamento
  nome.value = atual?.nome ?? ''
  Object.assign(endereco, enderecoVazio())
  if (atual?.endereco) {
    for (const campo of CAMPOS_ENDERECO) endereco[campo] = atual.endereco[campo] ?? ''
    endereco.cep = mascararCep(endereco.cep)
  }
  ativo.value = atual?.ativo ?? true
  formulario.value?.resetValidation()
}, { immediate: true })

// Ao esvaziar o endereço, os erros de "campo obrigatório" dos outros campos deixam de valer
watch(semEndereco, (vazio) => {
  if (vazio) formulario.value?.resetValidation()
})

async function salvar() {
  const { valid } = await formulario.value.validate()
  if (!valid) return
  emit('salvar', {
    nome: nome.value.trim(),
    endereco: paraEnderecoIn(endereco),
    ativo: ativo.value,
  })
}
</script>

<template>
  <v-dialog v-model="aberto" max-width="600" scrollable>
    <v-card :title="titulo">
      <v-form ref="formulario" @submit.prevent="salvar">
        <v-card-text>
          <v-text-field v-model="nome" label="Nome" :rules="regras.nome" autofocus />

          <fieldset class="endereco">
            <legend class="text-subtitle-2 mb-2">Endereço (opcional)</legend>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="endereco.cep"
                  v-formatar="mascararCep"
                  label="CEP"
                  placeholder="00000-000"
                  inputmode="numeric"
                  autocomplete="postal-code"
                  :rules="regras.cep"
                />
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field v-model="endereco.rua" label="Rua" :rules="regras.rua" />
              </v-col>
              <v-col cols="5" sm="4">
                <v-text-field v-model="endereco.numero" label="Número" :rules="regras.numero" />
              </v-col>
              <v-col cols="7" sm="8">
                <v-text-field v-model="endereco.complemento" label="Complemento (opcional)" />
              </v-col>
              <v-col cols="12" sm="5">
                <v-text-field v-model="endereco.bairro" label="Bairro" :rules="regras.bairro" />
              </v-col>
              <v-col cols="8" sm="5">
                <v-text-field v-model="endereco.cidade" label="Cidade" :rules="regras.cidade" />
              </v-col>
              <v-col cols="4" sm="2">
                <v-autocomplete
                  v-model="endereco.estado"
                  :items="UFS"
                  label="UF"
                  :rules="regras.estado"
                  auto-select-first
                  clearable
                />
              </v-col>
            </v-row>
          </fieldset>

          <v-switch
            v-model="ativo"
            label="Ativo (visível para os motoristas)"
            color="primary"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="aberto = false">Cancelar</v-btn>
          <v-btn type="submit" color="primary" variant="flat">Salvar</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.endereco {
  border: 0;
  padding: 0;
  margin: 0;
}
</style>
