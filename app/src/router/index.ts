import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/PublicLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/login'
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('../views/LoginView.vue')
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('../views/RegisterView.vue')
        }
      ]
    },
    {
      path: '/',
      component: () => import('../layouts/PrivateLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue')
        },
        {
          path: 'repertoire',
          name: 'repertoire',
          component: () => import('../views/RepertoireView.vue')
        },
        {
          path: 'selections',
          name: 'selections',
          component: () => import('../views/SelectionsView.vue')
        },
        {
          path: 'selections/:id',
          name: 'selection-detail',
          component: () => import('../views/SelectionDetailView.vue')
        },
        {
          path: 'study',
          name: 'study',
          component: () => import('../views/StudyView.vue')
        },
        {
          path: 'practice',
          name: 'practice',
          component: () => import('../views/PracticeView.vue')
        },
        {
          path: 'members',
          name: 'members',
          component: () => import('../views/MembersView.vue')
        },
        {
          path: 'integrations',
          name: 'integrations',
          redirect: '/integrations/spotify',
          children: [
            {
              path: 'spotify',
              name: 'integrations-spotify',
              component: () => import('../views/IntegrationsView.vue')
            }
          ]
        }
      ]
    }
  ]
})

// Guarda de navegação - aguarda autenticação ser verificada
router.beforeEach((to, from, next) => {
  const auth = useAuth()

  // Aguarda a autenticação ser verificada antes de decidir
  if (auth.state.loading) {
    next()
    return
  }

  // Verificar se registro está desabilitado
  const isRegistrationDisabled = (import.meta as any).env?.VITE_DISABLE_REGISTRATION === 'true'

  // Redirecionar /register para /login se registro estiver desabilitado
  if (to.path === '/register' && isRegistrationDisabled) {
    next('/login')
    return
  }

  // Rotas protegidas requerem autenticação
  if (to.meta.requiresAuth && !auth.isAuthenticated()) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && auth.isAuthenticated()) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
