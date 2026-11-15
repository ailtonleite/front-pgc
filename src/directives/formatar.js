/**
 * `v-formatar="fn"`: formata o texto de um campo enquanto a pessoa digita.
 *
 * Funciona em `<input>` e em componentes que o envolvem (`v-text-field`): o evento
 * `input` é tratado na fase de captura, no elemento raiz, ou seja, antes dos ouvintes
 * do próprio campo. Assim o `v-model` já recebe o valor formatado, e caracteres
 * recusados nem chegam a aparecer.
 *
 * `fn(texto) => texto` deve ser idempotente (`fn(fn(x)) === fn(x)`). O cursor é
 * reposicionado formatando o trecho antes dele, então a digitação no meio do texto
 * continua natural.
 *
 * Não use `maxlength` junto: o navegador corta o texto colado antes da formatação
 * (ex.: `09.210-580` viraria `09210-58`). O limite de tamanho fica na própria `fn`.
 *
 * @example
 * <v-text-field v-model="placa" v-formatar="formatarPlaca" />
 */

function aplicar(campo, formatar) {
  const original = campo.value
  const formatado = formatar(original)
  if (formatado === original) return
  const cursor = campo.selectionStart ?? original.length
  campo.value = formatado
  // Campos `type="email"`/`number` não permitem posicionar o cursor
  try {
    const posicao = formatar(original.slice(0, cursor)).length
    campo.setSelectionRange(posicao, posicao)
  } catch {
    // Ignora
  }
}

function aoDigitar(evento) {
  const campo = evento.target
  // Durante uma composição (teclados com acentuação/IME) o texto ainda não está pronto
  if (evento.isComposing || !(campo instanceof HTMLInputElement)) return
  aplicar(campo, evento.currentTarget._formatar)
}

function aoComporFim(evento) {
  const campo = evento.target
  if (!(campo instanceof HTMLInputElement)) return
  const antes = campo.value
  aplicar(campo, evento.currentTarget._formatar)
  // Avisa o v-model do valor final, que já não passa pelo `input` da composição
  if (campo.value !== antes) campo.dispatchEvent(new Event('input', { bubbles: true }))
}

export const vFormatar = {
  mounted(el, { value }) {
    el._formatar = value
    el.addEventListener('input', aoDigitar, true)
    el.addEventListener('compositionend', aoComporFim, true)
  },
  updated(el, { value }) {
    el._formatar = value
  },
  unmounted(el) {
    el.removeEventListener('input', aoDigitar, true)
    el.removeEventListener('compositionend', aoComporFim, true)
    delete el._formatar
  },
}
