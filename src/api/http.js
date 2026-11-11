/**
 * Instância do Axios usada por todos os módulos de `api/`.
 * O `withCredentials` envia o cookie `access_token`.
 */

import axios from 'axios'
import { useNotificacaoStore } from '@/stores/notificacao'

const MENSAGEM_PADRAO = 'Não foi possível concluir a operação.'
const MENSAGEM_SEM_CONEXAO = 'Não foi possível conectar ao servidor.'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

/** Extrai do erro o texto a ser mostrado no snackbar. */
async function mensagemDeErro(erro) {
  if (!erro.response) return MENSAGEM_SEM_CONEXAO

  let dados = erro.response.data
  // Com `responseType: 'blob'`, o corpo do erro também chega como Blob
  if (dados instanceof Blob) {
    try {
      dados = JSON.parse(await dados.text())
    } catch {
      return MENSAGEM_PADRAO
    }
  }

  const detalhe = dados?.detail
  if (typeof detalhe === 'string') return detalhe
  // Erros de validação do FastAPI vêm como lista de `{ loc, msg, type }`
  if (Array.isArray(detalhe)) return detalhe.map((item) => item.msg).join(' ')
  return MENSAGEM_PADRAO
}

/**
 * Sessão expirada: recarrega a página em vez de usar o router. Assim todas as stores
 * são zeradas, e a guarda de rotas não devolve para `/` um usuário ainda marcado como logado.
 */
function redirecionarParaLogin() {
  const { pathname, search } = window.location
  if (pathname === '/login') return
  window.location.assign(`/login?redirect=${encodeURIComponent(pathname + search)}`)
}

http.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    // `silencioso: true` na configuração: quem chamou espera o erro (ex.: `GET /me` inicial)
    if (!erro.config?.silencioso) {
      if (erro.response?.status === 401) {
        redirecionarParaLogin()
      } else {
        useNotificacaoStore().erro(await mensagemDeErro(erro))
      }
    }
    throw erro
  },
)
