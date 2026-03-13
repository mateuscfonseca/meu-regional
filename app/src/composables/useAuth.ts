import { reactive, readonly } from 'vue'
import api from '../services/api'

export interface User {
  id: number
  username: string
  nome: string
  instrumento: string
  regional_id: number
}

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
}

const state = reactive<AuthState>({
  user: null,
  loading: true,
  initialized: false,
})

/**
 * Inicializa a autenticação - sempre revalida na API
 * Deve ser chamado uma vez ao carregar a aplicação
 */
export async function initAuth() {
  state.loading = true
  try {
    const response = await api.get('/auth/me')
    state.user = response.data.user
    console.log('[Auth] User loaded:', state.user?.username ?? 'none')
  } catch (error) {
    console.log('[Auth] Not authenticated')
    state.user = null
  } finally {
    state.loading = false
    state.initialized = true
  }
}

/**
 * Logout - limpa estado local
 * O cookie é removido pelo backend
 */
export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    state.user = null
    state.initialized = false
  }
}

/**
 * Login - atualiza estado local após sucesso
 */
export async function login(username: string, password: string) {
  const response = await api.post('/auth/login', { username, password })
  state.user = response.data.user
  return response.data
}

/**
 * Registro - atualiza estado local após sucesso
 */
export async function register(data: {
  regionalNome: string
  regionalDescricao?: string
  membroNome: string
  username: string
  password: string
  instrumento: string
}) {
  const response = await api.post('/auth/register', data)
  state.user = response.data.user
  return response.data
}

/**
 * Composable para usar autenticação nos componentes
 */
export function useAuth() {
  return {
    state: readonly(state),
    initAuth,
    login,
    register,
    logout,
    isAuthenticated: () => !!state.user,
  }
}
