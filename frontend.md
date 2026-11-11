# Especificação do front-end

**Projeto:** Desenvolvimento de sistema de controle de estacionamento utilizando visão computacional (TCC — UFABC)
**Arquitetura:** SPA em camadas (api → stores → composables → componentes → views)
**Stack:** Vue 3 (Composition API, `<script setup>`) + Vuetify 3 + Vite + Pinia + Vue Router + Axios + SSE (`EventSource`) + vue-chartjs
**Versão:** 1 (25/10/2026) — compatível com `routes.py` e `schemas.py` do back-end e com o `classes_backend.md` v2

---

## 1. Visão geral

```
frontend/
├── src/
│   ├── api/                   # uma função por rota do back-end
│   │   ├── http.js            # instância do Axios + interceptadores
│   │   ├── auth.js
│   │   ├── estacionamentos.js
│   │   ├── cameras.js
│   │   ├── ocupacao.js
│   │   ├── historico.js
│   │   └── sessao.js
│   ├── stores/                # estado global (Pinia)
│   │   ├── auth.js
│   │   ├── ocupacao.js
│   │   ├── sessao.js
│   │   └── notificacao.js
│   ├── composables/           # lógica reutilizável com estado próprio
│   │   ├── useEventosVagas.js
│   │   ├── useEditorVagas.js
│   │   ├── useFrameCamera.js
│   │   └── usePeriodo.js
│   ├── utils/                 # funções puras, sem Vue
│   │   ├── constantes.js
│   │   ├── geometria.js
│   │   └── datas.js
│   ├── components/
│   │   ├── comum/             # AppBarra, NotificacaoSnackbar, ConfirmarDialog, EstadoVazio
│   │   ├── mapa/              # MapaVagas, LegendaStatus, CardsTotais, CardMinhaVaga, DetalheVagaDialog
│   │   ├── demarcacao/        # EditorVagas, ListaVagas, BarraDemarcacao
│   │   ├── historico/         # FiltroPeriodo, CardsRelatorio, GraficoOcupacao, TabelaHistorico
│   │   └── admin/             # EstacionamentoDialog, AdminsDialog, CameraDialog
│   ├── views/                 # uma tela por caso de uso
│   ├── router/index.js
│   ├── plugins/vuetify.js
│   ├── App.vue
│   └── main.js
├── tests/
├── .env.development
├── .env.production
├── vite.config.js
└── package.json
```

### Regra de dependência

```
views  ──►  components  ──►  composables  ──►  stores  ──►  api  ──►  back-end
   └────────────┴───────────────┴──────────────┴────────► utils
```

- **Somente `api/` conhece URLs e o Axios.** Componentes, views e stores chamam funções como `cameras.listarVagas(id)`, nunca `http.get('/cameras/...')`.
- **`utils/` não importa nada de Vue.** São funções puras, fáceis de testar.
- **Componentes de `components/` recebem dados por props e avisam por eventos.** Quem busca dados e chama a API são as views e as stores. As exceções são os componentes da demarcação, que compartilham o editor via `provide/inject` (ver 5.3).

### Fluxo de dados do mapa em tempo real

```
MapaView ──onMounted──► ocupacaoStore.carregar(id) ──► GET /estacionamentos/{id}/vagas
    │
    └──► useEventosVagas(id) ──► EventSource /estacionamentos/{id}/eventos
                                     │ evento "vaga"
                                     ▼
                        ocupacaoStore.atualizarVaga(...)
                                     │ (reatividade)
                                     ▼
                     MapaVagas e CardsTotais se atualizam sozinhos
```

### Convenções deste documento

- Componentes usam `<script setup>`; stores usam a sintaxe *setup* do Pinia (`defineStore('nome', () => {...})`).
- **Estado** = `ref`/`reactive`; **derivado** = `computed`; **ação** = função.
- Os tipos de dados (`UsuarioOut`, `VagaOut` etc.) são os mesmos de `api/schemas.py`. Nomes de campos são mantidos em português e iguais aos do back-end, para não haver conversão.
- Coordenadas de polígonos são sempre em **pixels do frame original da câmera**, como no back-end.

---

## 2. `utils/` — Funções puras

### 2.1 `utils/constantes.js`

| Constante | Conteúdo |
|---|---|
| `STATUS` | Para cada `SpotStatus` (`LIVRE`, `OCUPADA`, `DESCONHECIDA`): `rotulo` ("Livre"), `cor` (token do tema Vuetify), `icone` (mdi) e `padrao` (id do padrão SVG; `OCUPADA` usa hachura) |
| `PAPEIS` | `ADMIN`, `MOTORISTA` |
| `TIPOS_FONTE` | Opções do `v-select` de câmera: `arquivo`, `rtsp`, `kinesis`, com rótulo amigável |
| `GRANULARIDADES` | `hora`, `dia`, `semana`, com rótulo amigável |
| `REGEX_PLACA` | Formatos Mercosul (`AAA1A23`) e antigo (`AAA1234`), para validação imediata no formulário |

### 2.2 `utils/geometria.js`

| Função | Retorno | Descrição |
|---|---|---|
| `pontosSvg(poligono)` | `string` | Converte `[{x,y}, ...]` em `"x1,y1 x2,y2 ..."` para o atributo `points` do `<polygon>` |
| `area(poligono)` | `number` | Área pela fórmula do laço (*shoelace*) |
| `centroide(poligono)` | `{x, y}` | Ponto central, usado para posicionar o rótulo da vaga |
| `caixaEnvolvente(poligonos, margem = 20)` | `{x, y, largura, altura}` | Retângulo que contém todos os polígonos; vira o `viewBox` do mapa |
| `validarPoligono(poligono)` | `string \| null` | Mensagem de erro se não tiver 4 pontos ou tiver área zero; `null` se válido (mesma regra de `_validar_poligono`) |

### 2.3 `utils/datas.js`

| Função | Retorno | Descrição |
|---|---|---|
| `paraIsoLocal(data)` | `string` | `"2026-10-25T00:00:00"`, **sem fuso**. O back-end interpreta no fuso do histórico. Nunca usar `toISOString()`, que converte para UTC |
| `inicioDoDia(data)` / `fimDoDia(data)` | `Date` | 00:00:00 e 23:59:59 do dia |
| `formatarDataHora(iso)` | `string` | `"25/10/2026 14:30"` (`Intl.DateTimeFormat('pt-BR')`) |
| `formatarDuracao(minutos)` | `string` | `"1 h 35 min"` |
| `formatarPercentual(taxa)` | `string` | `0.734` → `"73,4%"`; `null` → `"—"` |

---

## 3. `api/` — Comunicação com o back-end

Cada arquivo exporta funções assíncronas que retornam diretamente o `data` da resposta. Nenhuma função trata erros; isso fica no interceptador.

### 3.1 `api/http.js`

| Item | Descrição |
|---|---|
| `http` | `axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true })`. O `withCredentials` envia o cookie `access_token` |
| Interceptador de resposta | **401:** redireciona para `/login` (exceto se já estiver lá). **Demais erros:** mostra `erro.response.data.detail` no snackbar (`notificacaoStore.erro`). Sempre rejeita a promessa para quem chamou poder reagir |
| Opção `silencioso` | Requisições com `{ silencioso: true }` na configuração não redirecionam nem mostram snackbar. Usada no `GET /me` inicial, em que o 401 é esperado |

### 3.2 `api/auth.js`

| Função | Rota | Retorno |
|---|---|---|
| `login(email, senha)` | `POST /auth/login` | `UsuarioOut` |
| `logout()` | `POST /auth/logout` | — |
| `cadastrar({ nome, email, senha, placa })` | `POST /auth/cadastro` | `UsuarioOut` |
| `me({ silencioso })` | `GET /me` | `UsuarioOut` |
| `atualizarPlaca(placa)` | `PUT /me/placa` | `UsuarioOut` (`placa = null` remove) |

### 3.3 `api/estacionamentos.js`

| Função | Rota | Retorno |
|---|---|---|
| `listar()` | `GET /estacionamentos` | `EstacionamentoOut[]` |
| `criar({ nome, endereco, ativo })` | `POST /estacionamentos` | `EstacionamentoOut` |
| `editar(id, campos)` | `PUT /estacionamentos/{id}` | `EstacionamentoOut` (só os campos enviados mudam) |
| `remover(id)` | `DELETE /estacionamentos/{id}` | — |
| `atribuirAdmin(id, usuarioId)` | `POST /estacionamentos/{id}/admins` | — |
| `removerAdmin(id, adminId)` | `DELETE /estacionamentos/{id}/admins/{adminId}` | — |

### 3.4 `api/cameras.js`

| Função | Rota | Retorno |
|---|---|---|
| `listar(estacionamentoId)` | `GET /estacionamentos/{id}/cameras` | `CameraOut[]` |
| `cadastrar(estacionamentoId, { nome, stream_url, tipo_fonte })` | `POST /estacionamentos/{id}/cameras` | `CameraOut` |
| `atualizar(id, { nome, stream_url, tipo_fonte })` | `PUT /cameras/{id}` | `CameraOut` (todos os campos são obrigatórios) |
| `remover(id)` | `DELETE /cameras/{id}` | — |
| `capturarFrame(id)` | `GET /cameras/{id}/frame` com `responseType: 'blob'` | `Blob` (JPEG) |
| `iniciar(id)` / `parar(id)` | `POST /cameras/{id}/iniciar` e `/parar` | — |
| `listarVagas(id)` | `GET /cameras/{id}/vagas` | `VagaOut[]` |
| `definirVagas(id, vagas)` | `PUT /cameras/{id}/vagas` | `VagaOut[]` (substitui todas as vagas da câmera) |

### 3.5 `api/ocupacao.js`

| Função | Rota | Retorno |
|---|---|---|
| `estadoAtual(estacionamentoId)` | `GET /estacionamentos/{id}/vagas` | `VagaOut[]` |
| `totais(estacionamentoId)` | `GET /estacionamentos/{id}/totais` | `TotaisOut` |
| `urlEventos(estacionamentoId)` | — | `string` com a URL completa do SSE (o `EventSource` não passa pelo Axios) |

### 3.6 `api/historico.js`

| Função | Rota | Retorno |
|---|---|---|
| `consultar(estacionamentoId, { inicio, fim, granularidade })` | `GET /estacionamentos/{id}/historico` | `SnapshotOut[]` |
| `relatorio(estacionamentoId, { inicio, fim })` | `GET /estacionamentos/{id}/relatorios` | `RelatorioOut` |

`inicio` e `fim` são recebidos como `Date` e convertidos com `paraIsoLocal` dentro da função.

### 3.7 `api/sessao.js`

| Função | Rota | Retorno |
|---|---|---|
| `atual()` | `GET /me/sessao` | `SessaoOut \| null` |
| `registrar(vagaId)` | `POST /me/sessao` | `SessaoOut` |
| `encerrar()` | `DELETE /me/sessao` | — |

> As rotas de sessão são exclusivas de motorista (403 para admin). Só devem ser chamadas quando `authStore.eMotorista` for verdadeiro.

---

## 4. `stores/` — Estado global (Pinia)

### 4.1 `stores/auth.js` — `useAuthStore`

Usuário logado. Fonte da verdade para as guardas de rota e para a interface mudar conforme o perfil.

| Estado | Tipo | Descrição |
|---|---|---|
| `usuario` | `UsuarioOut \| null` | Usuário logado |
| `carregado` | `boolean` | Se o `GET /me` inicial já foi feito (evita repetir a cada navegação) |

| Derivado | Tipo | Descrição |
|---|---|---|
| `autenticado` | `boolean` | `usuario !== null` |
| `eAdmin` | `boolean` | `usuario?.papel === 'ADMIN'` |
| `eMotorista` | `boolean` | `usuario?.papel === 'MOTORISTA'` |

| Ação | Retorno | Descrição |
|---|---|---|
| `carregar()` | `Promise<void>` | Chama `auth.me({ silencioso: true })` uma única vez; em 401, deixa `usuario = null` |
| `entrar(email, senha)` | `Promise<void>` | Login; guarda o usuário |
| `cadastrar(dados)` | `Promise<void>` | Cadastro seguido de login automático |
| `sair()` | `Promise<void>` | Logout, limpa todas as stores (`$reset`) e vai para `/login` |
| `atualizarPlaca(placa)` | `Promise<void>` | Atualiza e guarda o usuário retornado |

### 4.2 `stores/ocupacao.js` — `useOcupacaoStore`

Estado em tempo real das vagas do estacionamento aberto no mapa.

| Estado | Tipo | Descrição |
|---|---|---|
| `estacionamentoId` | `string \| null` | Estacionamento carregado |
| `vagasPorId` | `Record<string, VagaOut>` | Vagas indexadas por id (atualização em O(1) a cada evento SSE) |
| `carregando` | `boolean` | Carga inicial em andamento |
| `conectado` | `boolean` | Estado da conexão SSE (mostrado como indicador "ao vivo") |
| `ultimaAtualizacao` | `string \| null` | Timestamp do último evento recebido |

| Derivado | Tipo | Descrição |
|---|---|---|
| `vagas` | `VagaOut[]` | Lista ordenada por rótulo |
| `vagasPorCamera` | `Record<string, VagaOut[]>` | Vagas agrupadas por `camera_id` (um painel do mapa por câmera) |
| `totais` | `{ total, livres, ocupadas, taxa_ocupacao }` | Calculado localmente a partir das vagas, com a mesma regra do back-end (`ocupadas / total`). Dispensa novas requisições a cada evento |

| Ação | Retorno | Descrição |
|---|---|---|
| `carregar(estacionamentoId)` | `Promise<void>` | `GET /vagas` e preenche `vagasPorId` |
| `atualizarVaga(vagaId, status, timestamp)` | `void` | Aplica um evento SSE; ignora vagas desconhecidas (ex.: recém-demarcadas, até a próxima carga) |
| `limpar()` | `void` | Zera o estado ao sair do mapa |

### 4.3 `stores/sessao.js` — `useSessaoStore`

"Onde estacionei" do motorista (UC03).

| Estado | Tipo | Descrição |
|---|---|---|
| `sessao` | `SessaoOut \| null` | Sessão ativa |

| Derivado | Tipo | Descrição |
|---|---|---|
| `vagaId` | `string \| null` | Vaga da sessão, usada para destacá-la no mapa |

| Ação | Retorno | Descrição |
|---|---|---|
| `carregar()` | `Promise<void>` | `GET /me/sessao` (só para motorista) |
| `registrar(vagaId)` | `Promise<void>` | `POST /me/sessao` + snackbar de sucesso |
| `encerrar()` | `Promise<void>` | `DELETE /me/sessao` |

> Quando um evento SSE indica que a vaga da sessão ficou `LIVRE`, o back-end encerra a sessão sozinho. O `useEventosVagas` detecta esse caso e chama `sessaoStore.carregar()` para refletir isso na tela.

### 4.4 `stores/notificacao.js` — `useNotificacaoStore`

| Estado | Tipo | Descrição |
|---|---|---|
| `visivel` | `boolean` | Snackbar aberto |
| `mensagem` | `string` | Texto |
| `cor` | `string` | `success`, `error`, `info` |

| Ação | Descrição |
|---|---|
| `sucesso(mensagem)` / `erro(mensagem)` / `info(mensagem)` | Abre o snackbar com a cor correspondente |
| `fechar()` | Fecha o snackbar |

---

## 5. `composables/` — Lógica reutilizável

### 5.1 `useEventosVagas(estacionamentoId)`

Conexão SSE com `/estacionamentos/{id}/eventos`.

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `estacionamentoId` | `Ref<string>` | Se mudar, a conexão é fechada e reaberta para o novo estacionamento |

| Retorno | Tipo | Descrição |
|---|---|---|
| `conectado` | `Ref<boolean>` | Espelha `ocupacaoStore.conectado` |

Comportamento:

1. Abre `new EventSource(url, { withCredentials: true })`.
2. No evento `vaga`: `ocupacaoStore.atualizarVaga(...)`. Se a vaga for a da sessão do motorista e ficar `LIVRE`, recarrega a sessão.
3. Em `onerror`: marca `conectado = false` e deixa o `EventSource` reconectar sozinho.
4. Em `onopen` após uma queda: chama `ocupacaoStore.carregar()` para ressincronizar, já que eventos perdidos durante a queda não são reenviados.
5. Se continuar desconectado por mais de 30 s: chama `authStore.carregar()` para verificar se a sessão expirou (o `EventSource` não passa pelo interceptador de 401 do Axios).
6. Em `onUnmounted`: `fonte.close()`.

### 5.2 `useFrameCamera(cameraId)`

Busca o frame de referência e descobre suas dimensões originais.

| Retorno | Tipo | Descrição |
|---|---|---|
| `url` | `Ref<string \| null>` | `URL.createObjectURL(blob)` para usar no `<image>` do SVG |
| `largura` / `altura` | `Ref<number>` | Dimensões naturais do frame (lidas com `new Image()` + `onload`); definem o `viewBox` |
| `carregando` | `Ref<boolean>` | Requisição em andamento |
| `erro` | `Ref<string \| null>` | Mensagem quando a câmera não responde (503, UC08 fluxo E1) |
| `recarregar()` | `Promise<void>` | Captura um novo frame (revoga a URL anterior) |

Em `onUnmounted`, chama `URL.revokeObjectURL` para liberar memória.

### 5.3 `useEditorVagas()`

Toda a lógica de demarcação, separada do desenho. A `DemarcacaoView` cria o editor e o disponibiliza com `provide('editor', editor)`; `EditorVagas`, `ListaVagas` e `BarraDemarcacao` o recebem com `inject('editor')`.

| Estado | Tipo | Descrição |
|---|---|---|
| `vagas` | `Ref<{ chave, rotulo, poligono }[]>` | Vagas em edição (`chave` é um id local, pois vagas novas ainda não têm id do servidor) |
| `selecionada` | `Ref<string \| null>` | Chave da vaga selecionada |
| `pontosEmDesenho` | `Ref<{x, y}[]>` | Pontos já clicados da vaga que está sendo criada (0 a 3) |
| `modo` | `Ref<'selecao' \| 'desenho'>` | Modo atual da ferramenta |
| `alterado` | `Ref<boolean>` | Há mudanças não salvas (usado para avisar ao sair da página) |
| `_arraste` | `{ chave, indice } \| null` | Vértice sendo arrastado |

| Derivado | Tipo | Descrição |
|---|---|---|
| `erros` | `Record<chave, string>` | Erros por vaga: polígono inválido (`validarPoligono`), rótulo vazio ou repetido |
| `valido` | `boolean` | Sem erros; habilita o botão Salvar |

| Método | Descrição |
|---|---|
| `carregar(vagasOut)` | Preenche o editor a partir de `GET /cameras/{id}/vagas` |
| `novaVaga()` | Entra no modo desenho |
| `clicar(ponto)` | No modo desenho, adiciona o ponto; ao completar 4, cria a vaga com rótulo sugerido (próximo da sequência, ex.: "A-04") e volta ao modo seleção |
| `desfazerPonto()` | Remove o último ponto em desenho |
| `cancelarDesenho()` | Descarta os pontos (tecla Esc) |
| `selecionar(chave)` | Seleciona uma vaga |
| `iniciarArraste(chave, indice)` / `mover(ponto)` / `soltar()` | Ajuste fino de vértices |
| `renomear(chave, rotulo)` | Altera o rótulo |
| `remover(chave)` | Remove a vaga (tecla Delete) |
| `paraPayload()` | Converte para `VagaIn[]` (`{ rotulo, poligono }`), pronto para `PUT /cameras/{id}/vagas` |

Função auxiliar `pontoNoFrame(evento, svg)`: converte o clique da tela para coordenadas do frame original com `svg.getScreenCTM().inverse()`. É o que garante coordenadas corretas qualquer que seja o tamanho da imagem na tela.

### 5.4 `usePeriodo()`

Estado do filtro de período do histórico.

| Estado | Tipo | Descrição |
|---|---|---|
| `atalho` | `Ref<'hoje' \| '7dias' \| 'mes' \| 'personalizado'>` | Padrão: `hoje` |
| `inicio` / `fim` | `Ref<Date>` | Calculados pelo atalho ou escolhidos manualmente |
| `granularidade` | `Ref<'hora' \| 'dia' \| 'semana'>` | Sugerida pelo atalho (hoje → hora; 7 dias e mês → dia), mas editável |

| Derivado | Descrição |
|---|---|
| `params` | `{ inicio, fim, granularidade }`, pronto para `api/historico.js` |
| `descricao` | Texto do período para o título da tela (ex.: "25/10/2026, por hora") |

---

## 6. `components/` — Componentes

Cada componente é descrito por suas **props** (entradas), **eventos** (saídas) e comportamento.

### 6.1 `components/comum/`

#### `AppBarra.vue`

Barra superior (`v-app-bar`) com menu lateral (`v-navigation-drawer`).

| Prop | Tipo | Descrição |
|---|---|---|
| — | — | Lê `authStore` diretamente |

Mostra os itens de menu conforme o perfil (admin vê "Gerenciar estacionamentos"; motorista vê "Meu perfil"), o nome do usuário e o botão Sair (`authStore.sair()`).

#### `NotificacaoSnackbar.vue`

`v-snackbar` ligado à `notificacaoStore`. Fica em `App.vue`, uma única vez.

#### `ConfirmarDialog.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `modelValue` | `boolean` | Abre/fecha (`v-model`) |
| `titulo`, `mensagem` | `string` | Textos |
| `textoConfirmar` | `string` | Padrão: "Confirmar" |
| `perigoso` | `boolean` | Botão em vermelho (remoções) |

| Evento | Descrição |
|---|---|
| `confirmar` | Usuário confirmou |

#### `EstadoVazio.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `icone`, `titulo`, `texto` | `string` | Mensagem para listas vazias ("Nenhuma câmera cadastrada") |

Slot padrão para um botão de ação.

### 6.2 `components/mapa/`

#### `MapaVagas.vue`

Desenha as vagas de **uma câmera** em SVG. A `MapaView` cria um `MapaVagas` por câmera.

| Prop | Tipo | Descrição |
|---|---|---|
| `vagas` | `VagaOut[]` | Vagas da câmera |
| `urlFundo` | `string \| null` | Frame da câmera como fundo (somente admin); `null` mostra o desenho esquemático |
| `largura`, `altura` | `number \| null` | Dimensões do frame, quando há fundo. Sem fundo, o `viewBox` vem de `caixaEnvolvente(vagas)` |
| `vagaDestacada` | `string \| null` | Id da vaga da sessão do motorista (borda grossa + ícone de carro) |
| `interativo` | `boolean` | Se as vagas respondem a clique e teclado |

| Evento | Payload | Descrição |
|---|---|---|
| `selecionar` | `VagaOut` | Clique ou Enter sobre uma vaga |

Para cada vaga: `<polygon>` com cor e padrão vindos de `STATUS`, `<text>` com o rótulo no `centroide`, `role="button"`, `tabindex="0"` e `aria-label="Vaga A-12, livre"`. Mudanças de status têm uma transição curta de cor (respeitando `prefers-reduced-motion`).

#### `LegendaStatus.vue`

Legenda com cor, padrão e texto de cada status. Sem props.

#### `CardsTotais.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `totais` | `{ total, livres, ocupadas, taxa_ocupacao }` | Valores exibidos |
| `conectado` | `boolean` | Mostra o indicador "ao vivo" (ponto verde) ou "reconectando" |
| `compacto` | `boolean` | Versão reduzida, usada nos cards da lista de estacionamentos |

Três `v-card`: vagas livres, vagas ocupadas e taxa de ocupação (`v-progress-linear`). A região tem `aria-live="polite"` para leitores de tela anunciarem mudanças.

#### `CardMinhaVaga.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `sessao` | `SessaoOut` | Sessão ativa |

| Evento | Descrição |
|---|---|
| `encerrar` | Botão "Saí do estacionamento" |

Mostra "Seu carro está na vaga **A-12** há 1 h 35 min". O tempo é atualizado a cada minuto localmente, a partir de `sessao.inicio`, sem novas requisições.

#### `DetalheVagaDialog.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `modelValue` | `boolean` | Abre/fecha |
| `vaga` | `VagaOut \| null` | Vaga clicada |
| `podeRegistrar` | `boolean` | Usuário é motorista **e** a vaga está `OCUPADA` |
| `eMinhaVaga` | `boolean` | A vaga é a da sessão ativa |

| Evento | Descrição |
|---|---|
| `registrar` | "Estacionei aqui" (UC03) |

Mostra rótulo, status e "atualizado há X min". Se a vaga estiver livre, explica que só é possível registrar uma vaga ocupada, já que o sistema usa a detecção como confirmação.

### 6.3 `components/demarcacao/`

Os três componentes usam `inject('editor')` (ver 5.3).

#### `EditorVagas.vue`

Área de desenho.

| Prop | Tipo | Descrição |
|---|---|---|
| `urlFrame` | `string` | Imagem da câmera |
| `largura`, `altura` | `number` | Dimensões naturais do frame (`viewBox="0 0 largura altura"`) |

Estrutura: um `<svg>` responsivo (largura 100%) contendo a `<image>` do frame, um `<polygon>` por vaga (com rótulo), círculos arrastáveis nos vértices da vaga selecionada e a linha tracejada da vaga em desenho, seguindo o cursor. Os eventos de ponteiro (`pointerdown`, `pointermove`, `pointerup`) são convertidos com `pontoNoFrame` e repassados ao editor. Usar *pointer events* faz o editor funcionar também com toque (tablet).

Atalhos: `N` nova vaga, `Esc` cancela desenho, `Delete` remove a selecionada, `Ctrl+Z` desfaz o último ponto.

#### `ListaVagas.vue`

Painel lateral (`v-list`): uma linha por vaga, com `v-text-field` para o rótulo, mensagem de erro (de `editor.erros`) e botão de remover. Clicar em uma linha seleciona a vaga no desenho.

#### `BarraDemarcacao.vue`

| Evento | Descrição |
|---|---|
| `salvar` | Habilitado só quando `editor.valido && editor.alterado` |
| `descartar` | Recarrega as vagas do servidor |
| `recarregar-frame` | Captura um novo frame |

Botões "Nova vaga", "Desfazer ponto", "Recarregar frame", "Descartar" e "Salvar", além do contador de vagas.

### 6.4 `components/historico/`

#### `FiltroPeriodo.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `periodo` | retorno de `usePeriodo()` | Estado do filtro |

`v-btn-toggle` com os atalhos (Hoje, 7 dias, Mês, Personalizado), `v-date-input` (intervalo, só no modo personalizado) e `v-select` de granularidade. Locale `pt-BR`.

#### `CardsRelatorio.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `relatorio` | `RelatorioOut \| null` | Dados do `GET /relatorios` |
| `carregando` | `boolean` | Mostra `v-skeleton-loader` |

Três cards: ocupação média, pico de ocupação e horário de pico. Campos `null` mostram "Sem dados no período".

#### `GraficoOcupacao.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `snapshots` | `SnapshotOut[]` | Dados do `GET /historico` |
| `granularidade` | `string` | Define o formato do eixo X (hora: "14h"; dia: "25/10"; semana: "sem. 43") |

Gráfico de linha (`Line` do vue-chartjs) da `taxa_ocupacao` em percentual, com eixo Y fixo de 0 a 100%. O tooltip mostra também livres e ocupadas. Cores vêm do tema.

#### `TabelaHistorico.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `snapshots` | `SnapshotOut[]` | Mesmos dados do gráfico |

`v-data-table` com período, livres, ocupadas e taxa. É a **alternativa acessível ao gráfico** (RNF02): a `HistoricoView` alterna entre os dois com um `v-btn-toggle`. Inclui botão "Exportar CSV", gerado no próprio navegador.

### 6.5 `components/admin/`

#### `EstacionamentoDialog.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `modelValue` | `boolean` | Abre/fecha |
| `estacionamento` | `EstacionamentoOut \| null` | `null` = criar; preenchido = editar |

| Evento | Payload | Descrição |
|---|---|---|
| `salvar` | `{ nome, endereco, ativo }` | Dados do formulário (`v-form` com validação de nome obrigatório) |

#### `AdminsDialog.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `modelValue` | `boolean` | Abre/fecha |
| `estacionamento` | `EstacionamentoOut` | Estacionamento em gestão |

| Evento | Payload | Descrição |
|---|---|---|
| `atribuir` | `usuarioId` | Torna o usuário responsável |
| `remover` | `usuarioId` | Retira a responsabilidade |

> Hoje o back-end só aceita o **id** do usuário e não lista os administradores de um estacionamento. Ver a seção 12.

#### `CameraDialog.vue`

| Prop | Tipo | Descrição |
|---|---|---|
| `modelValue` | `boolean` | Abre/fecha |
| `camera` | `CameraOut \| null` | `null` = criar; preenchido = editar |

| Evento | Payload | Descrição |
|---|---|---|
| `salvar` | `{ nome, stream_url, tipo_fonte }` | Dados do formulário |

O campo `stream_url` muda de rótulo e dica conforme o `tipo_fonte` ("Caminho do arquivo", "rtsp://...", "Nome do stream Kinesis"). Na edição, o `stream_url` precisa ser digitado de novo, porque o `CameraOut` não o devolve.

---

## 7. `views/` — Telas

Cada view corresponde a um caso de uso. Ela busca os dados (via stores ou `api/`), compõe os componentes e trata as ações.

### 7.1 `LoginView.vue` — UC04

| Estado | Descrição |
|---|---|
| `email`, `senha`, `enviando` | Formulário |

Ao enviar: `authStore.entrar()` e redireciona para a rota pedida antes do login (`route.query.redirect`) ou para `/`. Em 401, mostra "E-mail ou senha inválidos" abaixo do formulário, sem indicar qual campo errou (UC04, fluxo A1). Link para o cadastro.

### 7.2 `CadastroView.vue` — UC04

Formulário de nome, e-mail, senha, confirmação de senha e placa (opcional, validada com `REGEX_PLACA`). Ao enviar: `authStore.cadastrar()`. Texto curto de consentimento sobre o uso da placa (LGPD).

### 7.3 `EstacionamentosView.vue` — UC01

| Estado | Descrição |
|---|---|
| `estacionamentos` | `EstacionamentoOut[]` |
| `totaisPorId` | `Record<id, TotaisOut>` |

Ao montar: `estacionamentos.listar()` e, em paralelo, `ocupacao.totais(id)` de cada um. Mostra um card por estacionamento com nome, endereço e `CardsTotais` compacto ("12 vagas livres de 40"). Clicar abre o mapa. Para admin, cada card tem também atalhos para câmeras e histórico.

### 7.4 `MapaView.vue` — RF03, RF05, UC01, UC02, UC03, UC05

| Estado | Descrição |
|---|---|
| `vagaSelecionada` | Vaga clicada (abre o `DetalheVagaDialog`) |
| `cameraAtiva` | Aba selecionada |
| `frames` | Admin: `useFrameCamera` por câmera, para usar como fundo (opcional, ligado por um `v-switch` "Mostrar imagem da câmera") |

Ao montar:

1. `ocupacaoStore.carregar(id)`
2. `useEventosVagas(id)`
3. Se motorista: `sessaoStore.carregar()`

Composição: `CardMinhaVaga` (se houver sessão), `CardsTotais`, `v-tabs` com uma aba por câmera e, em cada aba, um `MapaVagas`. Abaixo, a `LegendaStatus`.

Ações: `registrar` → `sessaoStore.registrar(vaga.id)`; `encerrar` → `sessaoStore.encerrar()`. Ao sair: `ocupacaoStore.limpar()`.

### 7.5 `PerfilView.vue` — motorista

Dados da conta (`GET /me`) e campo de placa com botões "Salvar" e "Remover placa" (`PUT /me/placa`). Explica que a placa é opcional e serve apenas para identificação da conta.

### 7.6 `GerenciarEstacionamentosView.vue` — UC09 (admin)

`v-data-table` dos estacionamentos sob responsabilidade do admin, com colunas nome, endereço e ativo (`v-switch` que chama `editar(id, { ativo })`).

Ações por linha: editar (`EstacionamentoDialog`), administradores (`AdminsDialog`), câmeras (navega), histórico (navega), remover (`ConfirmarDialog`). A remoção só funciona sem câmeras; o erro do back-end aparece no snackbar.

### 7.7 `CamerasView.vue` — RF01, UC08 (admin)

Lista as câmeras do estacionamento (`GET /cameras`), uma por card, com nome, tipo de fonte e status.

Ações por câmera:

| Ação | Rota | Observação |
|---|---|---|
| Editar | `PUT /cameras/{id}` | `CameraDialog` |
| Demarcar vagas | navega para `/admin/cameras/:id/vagas` | — |
| Iniciar / parar | `POST /iniciar` ou `/parar` | `v-switch` "Monitorando" |
| Remover | `DELETE /cameras/{id}` | `ConfirmarDialog` avisando que as vagas também serão removidas |

Botão "Nova câmera" (`CameraDialog`). Depois de cadastrar, oferece ir direto para a demarcação.

### 7.8 `DemarcacaoView.vue` — RF02, UC08 (admin)

Layout em duas colunas (empilhadas no celular): `EditorVagas` à esquerda, `ListaVagas` à direita, `BarraDemarcacao` no topo.

Ao montar:

1. `const frame = useFrameCamera(cameraId)`
2. `const editor = useEditorVagas(); provide('editor', editor)`
3. `editor.carregar(await cameras.listarVagas(cameraId))`

| Ação | Descrição |
|---|---|
| Salvar | `cameras.definirVagas(cameraId, editor.paraPayload())`, recarrega o editor com a resposta (vagas agora com id) e mostra sucesso |
| Descartar | `editor.carregar(await cameras.listarVagas(cameraId))` |
| Erro no frame | Mostra `EstadoVazio` com "Não foi possível conectar à câmera" e botão "Tentar novamente" (UC08, fluxo E1) |

Guarda `onBeforeRouteLeave`: se `editor.alterado`, pede confirmação antes de sair. Também registra `beforeunload` para o fechamento da aba.

> Salvar substitui todas as vagas da câmera, e o back-end cria ids novos. Sessões de motoristas em vagas dessa câmera deixam de apontar para uma vaga existente. Vale um aviso no diálogo de confirmação quando a câmera estiver em monitoramento.

### 7.9 `HistoricoView.vue` — RF04, UC06, UC07 (admin)

| Estado | Descrição |
|---|---|
| `periodo` | `usePeriodo()` |
| `snapshots` | `SnapshotOut[]` |
| `relatorio` | `RelatorioOut \| null` |
| `visualizacao` | `'grafico' \| 'tabela'` |

Um `watch(periodo.params, ..., { immediate: true })` dispara `historico.consultar()` e `historico.relatorio()` em paralelo sempre que o filtro muda.

Composição: `FiltroPeriodo`, `CardsRelatorio`, alternância entre `GraficoOcupacao` e `TabelaHistorico`. Sem dados no período: `EstadoVazio`.

### 7.10 `NaoEncontradoView.vue`

Página 404 com link para o início.

---

## 8. `router/index.js` — Rotas e guardas

| Caminho | Nome | View | `meta` |
|---|---|---|---|
| `/login` | `login` | `LoginView` | `{ publica: true }` |
| `/cadastro` | `cadastro` | `CadastroView` | `{ publica: true }` |
| `/` | `inicio` | `EstacionamentosView` | — |
| `/estacionamentos/:id` | `mapa` | `MapaView` | — |
| `/perfil` | `perfil` | `PerfilView` | `{ papel: 'MOTORISTA' }` |
| `/admin/estacionamentos` | `admin-estacionamentos` | `GerenciarEstacionamentosView` | `{ papel: 'ADMIN' }` |
| `/admin/estacionamentos/:id/cameras` | `admin-cameras` | `CamerasView` | `{ papel: 'ADMIN' }` |
| `/admin/cameras/:id/vagas` | `admin-demarcacao` | `DemarcacaoView` | `{ papel: 'ADMIN' }` |
| `/admin/estacionamentos/:id/historico` | `admin-historico` | `HistoricoView` | `{ papel: 'ADMIN' }` |
| `/:pathMatch(.*)*` | `nao-encontrado` | `NaoEncontradoView` | `{ publica: true }` |

Todas as views são carregadas sob demanda (`component: () => import(...)`), o que reduz o carregamento inicial. As telas de admin e o Chart.js só são baixados por quem usa.

**Guarda global (`router.beforeEach`):**

1. `await authStore.carregar()` (só faz a requisição na primeira navegação).
2. Rota não pública e usuário não autenticado → `/login?redirect=<rota>`.
3. Usuário autenticado indo para `/login` ou `/cadastro` → `/`.
4. `meta.papel` diferente do papel do usuário → `/` com snackbar "Acesso restrito".

> A guarda só melhora a experiência. A segurança real continua no back-end, que valida o perfil e a responsabilidade pelo estacionamento em todas as rotas.

---

## 9. Configuração

### 9.1 `plugins/vuetify.js`

| Item | Valor |
|---|---|
| Tema `ufabc` (claro) | `primary: #006747` (verde UFABC), `secondary: #FDB515` (amarelo UFABC) |
| Cores de status | `livre: #2E7D32`, `ocupada: #C62828`, `desconhecida: #757575` (contraste mínimo de 4,5:1 com o texto branco do rótulo) |
| Tema escuro | Opcional, com as mesmas chaves |
| Locale | `pt-BR` (`vuetify/locale`), usado pelo seletor de datas |
| Componentes de laboratório | `VDateInput` (importado de `vuetify/labs/components`) |

### 9.2 Variáveis de ambiente

| Arquivo | `VITE_API_URL` | Uso |
|---|---|---|
| `.env.development` | `/api` | Passa pelo proxy do Vite |
| `.env.production` | `https://api.seudominio.com` | API publicada |

### 9.3 `vite.config.js`

- **Plugins:** `@vitejs/plugin-vue` e `vite-plugin-vuetify` (importação automática dos componentes usados).
- **Alias:** `@` → `src/`.
- **Proxy de desenvolvimento:** `server.proxy['/api'] = { target: 'http://localhost:8000', changeOrigin: true, rewrite: p => p.replace(/^\/api/, '') }`. Front e API ficam na mesma origem durante o desenvolvimento, e cookie, CORS e SSE funcionam sem configuração extra.

### 9.4 `main.js` e `App.vue`

- **`main.js`:** cria o app e registra Pinia, router e Vuetify.
- **`App.vue`:** `v-app` com `AppBarra` (oculta nas rotas públicas), `v-main` com `<router-view>` e `NotificacaoSnackbar`.

### 9.5 Dependências (`package.json`)

`vue`, `vue-router`, `pinia`, `vuetify`, `@mdi/font`, `axios`, `chart.js`, `vue-chartjs`.
Desenvolvimento: `vite`, `@vitejs/plugin-vue`, `vite-plugin-vuetify`, `vitest`, `@vue/test-utils`, `jsdom`, `eslint`, `eslint-plugin-vue`.

---

## 10. Acessibilidade (RNF02) e privacidade (LGPD)

### Acessibilidade

| Ponto | Onde |
|---|---|
| Status nunca indicado só por cor: rótulo, padrão hachurado e ícone | `MapaVagas`, `LegendaStatus` |
| Vagas navegáveis por teclado (`tabindex`, Enter) e com `aria-label` | `MapaVagas` |
| Mudanças de ocupação anunciadas a leitores de tela (`aria-live="polite"`) | `CardsTotais` |
| Tabela como alternativa ao gráfico | `TabelaHistorico` |
| Contraste mínimo de 4,5:1 nas cores do tema | `plugins/vuetify.js` |
| Animações desligadas com `prefers-reduced-motion` | `MapaVagas` |
| Layout responsivo (grade do Vuetify), utilizável no celular | Todas as views |
| Formulários com `label` e mensagens de erro associadas | Componentes Vuetify |

### Privacidade

| Ponto | Onde |
|---|---|
| Motorista nunca vê imagens das câmeras (que podem conter placas de terceiros); vê apenas o mapa esquemático | `MapaView`, `MapaVagas` |
| Placa opcional, com texto de consentimento no cadastro e opção de remover | `CadastroView`, `PerfilView` |
| Token em cookie `HttpOnly`: inacessível ao JavaScript (protege contra XSS); nada sensível no `localStorage` | `api/http.js` |
| `stream_url` das câmeras nunca exibido fora do formulário de edição do admin | `CameraDialog` |

---

## 11. Testes (`tests/`)

| Tipo | O que testar | Ferramenta |
|---|---|---|
| Unitário | `geometria.js` (`area`, `validarPoligono`, `caixaEnvolvente`) e `datas.js` (`paraIsoLocal` sem fuso) | Vitest |
| Unitário | `ocupacaoStore`: `atualizarVaga` e recálculo de `totais`; `vagasPorCamera` | Vitest + Pinia de teste |
| Unitário | `useEditorVagas`: criar vaga com 4 cliques, arrastar vértice, detectar rótulo repetido, `paraPayload` | Vitest |
| Componente | `MapaVagas` renderiza um polígono por vaga com o `aria-label` correto e emite `selecionar` | Vue Test Utils |
| Componente | Guarda de rotas: motorista redirecionado ao tentar abrir `/admin/...` | Vue Test Utils + router de memória |
| Manual | Fluxos completos com o back-end rodando, seguindo os casos de uso | Navegador + coleção do Insomnia para preparar dados |

---

## 12. Ajustes necessários no back-end

| Ajuste | Motivo | Sugestão |
|---|---|---|
| Nome da câmera no mapa do motorista | O motorista não acessa `GET /cameras`; as abas do mapa ficariam como "Câmera 1, 2..." | Incluir `camera_nome` em `VagaOut` |
| Atribuição de admin por e-mail | `AdminIn` exige o id, que o admin não tem como descobrir | Aceitar `email` em `AdminIn` ou criar `GET /usuarios?email=` (somente admin) |
| Listar admins de um estacionamento | `AdminsDialog` não consegue mostrar quem já é responsável | Criar `GET /estacionamentos/{id}/admins` |
| Cookie entre domínios em produção | Com `SameSite=lax`, o cookie só é enviado se front e API forem do mesmo site | Usar subdomínios do mesmo domínio (`app.` e `api.`) ou `SameSite=None; Secure` |
| CORS | Necessário em produção, com credenciais | `CORSMiddleware` com `allow_origins=[URL do front]` e `allow_credentials=True` (nunca `*`) |

---

## 13. Rastreabilidade: front-end × requisitos

| Requisito / caso de uso | Views | Componentes e lógica |
|---|---|---|
| RF01 — captura em tempo real | `CamerasView` | `CameraDialog`, `api/cameras` (iniciar/parar) |
| RF02 — classificar vagas | `DemarcacaoView` | `EditorVagas`, `ListaVagas`, `useEditorVagas`, `useFrameCamera` |
| RF03 — totais de vagas | `EstacionamentosView`, `MapaView` | `CardsTotais`, `ocupacaoStore.totais` |
| RF04 — histórico diário | `HistoricoView` | `FiltroPeriodo`, `GraficoOcupacao`, `TabelaHistorico`, `usePeriodo` |
| RF05 — mapa em tempo real | `MapaView` | `MapaVagas`, `useEventosVagas`, `ocupacaoStore` |
| RNF02 — acessibilidade | Todas | Ver seção 10 |
| RNF03 — segurança | — | Guardas de rota, cookie `HttpOnly`, interceptador de 401 |
| UC01 — consultar vagas disponíveis | `EstacionamentosView`, `MapaView` | `CardsTotais` |
| UC02 — visualizar mapa | `MapaView` | `MapaVagas`, `LegendaStatus`, `DetalheVagaDialog` |
| UC03 — registrar e consultar onde estacionei | `MapaView` | `CardMinhaVaga`, `DetalheVagaDialog`, `sessaoStore` |
| UC04 — autenticar | `LoginView`, `CadastroView`, `PerfilView` | `authStore`, `api/http.js` |
| UC05 — monitorar ocupação (admin) | `MapaView` | `MapaVagas` com fundo da câmera |
| UC06 — consultar histórico | `HistoricoView` | `GraficoOcupacao`, `TabelaHistorico` |
| UC07 — gerar relatórios | `HistoricoView` | `CardsRelatorio`, exportação CSV |
| UC08 — gerenciar câmeras e vagas | `CamerasView`, `DemarcacaoView` | `CameraDialog`, editor de vagas |
| UC09 — gerenciar estacionamentos | `GerenciarEstacionamentosView` | `EstacionamentoDialog`, `AdminsDialog` |

---

## 14. Trabalhos futuros previstos pela arquitetura

| Evolução | Onde entra |
|---|---|
| Planta única do estacionamento (todas as câmeras em um só desenho) | Novo componente de planta + coordenadas de planta por vaga no back-end; `MapaVagas` continua para a visão por câmera |
| Sugestão automática de vagas a partir das detecções | Botão na `BarraDemarcacao` que preenche o `useEditorVagas` com polígonos sugeridos |
| Notificações quando o estacionamento lotar | Novo tipo de evento no mesmo SSE, tratado em `useEventosVagas` |
| Aplicativo instalável (PWA) | `vite-plugin-pwa`, sem mudança na arquitetura |
