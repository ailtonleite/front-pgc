/**
 * Rotas e guarda global.
 * A guarda só melhora a experiência: a segurança real continua no back-end, que valida o perfil
 * e a responsabilidade pelo estacionamento em todas as rotas.
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificacaoStore } from '@/stores/notificacao'
import { PAPEIS } from '@/utils/constantes'

// Views carregadas sob demanda: as telas de admin e o Chart.js só são baixados por quem usa
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { publica: true },
  },
  {
    path: '/cadastro',
    name: 'cadastro',
    component: () => import('@/views/CadastroView.vue'),
    meta: { publica: true },
  },
  {
    path: '/',
    name: 'inicio',
    component: () => import('@/views/EstacionamentosView.vue'),
  },
  {
    path: '/estacionamentos/:id',
    name: 'mapa',
    component: () => import('@/views/MapaView.vue'),
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('@/views/PerfilView.vue'),
    meta: { papel: PAPEIS.MOTORISTA },
  },
  {
    path: '/admin/estacionamentos',
    name: 'admin-estacionamentos',
    component: () => import('@/views/GerenciarEstacionamentosView.vue'),
    meta: { papel: PAPEIS.ADMIN },
  },
  {
    path: '/admin/estacionamentos/:id/cameras',
    name: 'admin-cameras',
    component: () => import('@/views/CamerasView.vue'),
    meta: { papel: PAPEIS.ADMIN },
  },
  {
    path: '/admin/cameras/:id/vagas',
    name: 'admin-demarcacao',
    component: () => import('@/views/DemarcacaoView.vue'),
    meta: { papel: PAPEIS.ADMIN },
  },
  {
    path: '/admin/estacionamentos/:id/historico',
    name: 'admin-historico',
    component: () => import('@/views/HistoricoView.vue'),
    meta: { papel: PAPEIS.ADMIN },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'nao-encontrado',
    component: () => import('@/views/NaoEncontradoView.vue'),
    meta: { publica: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, posicaoSalva) => posicaoSalva ?? { top: 0 },
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // 1. Só faz a requisição na primeira navegação
  await authStore.carregar()

  // 2. Rota protegida sem login
  if (!to.meta.publica && !authStore.autenticado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 3. Usuário logado não precisa de login nem de cadastro
  if (authStore.autenticado && (to.name === 'login' || to.name === 'cadastro')) {
    return { name: 'inicio' }
  }

  // 4. Rota de outro perfil
  if (to.meta.papel && to.meta.papel !== authStore.usuario?.papel) {
    useNotificacaoStore().erro('Acesso restrito.')
    return { name: 'inicio' }
  }

  return true
})

export default router
