import { ref, computed, readonly } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const user = ref(null)
const profile = ref(null)
const loading = ref(true)
const error = ref(null)

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value)
  const isConfigured = computed(() => isSupabaseConfigured())
  const confirmationNotice = 'Compte créé. Confirmez votre email pour vous connecter.'

  // Initialiser la session au chargement
  async function initSession() {
    if (!supabase) {
      loading.value = false
      return
    }

    try {
      loading.value = true
      error.value = null

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        user.value = session.user
        await fetchProfile()
      }

      // Écouter les changements d'auth
      supabase.auth.onAuthStateChange(async (event, session) => {
        user.value = session?.user || null
        if (session?.user) {
          await fetchProfile()
        } else {
          profile.value = null
        }
      })
    } catch (err) {
      console.error('Init session error:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Récupérer le profil utilisateur
  async function fetchProfile() {
    if (!supabase || !user.value) return null

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (fetchError) throw fetchError
      profile.value = data
      return data
    } catch (err) {
      console.error('Fetch profile error:', err)
      return null
    }
  }

  // Vérifier disponibilité du username
  async function checkUsernameAvailable(username) {
    if (!supabase) return { available: false, error: 'Supabase non configuré' }

    try {
      const { data, error: checkError } = await supabase
        .rpc('is_username_available', { check_username: username })

      if (checkError) throw checkError
      return { available: data, error: null }
    } catch (err) {
      return { available: false, error: 'Impossible de vérifier le pseudo' }
    }
  }

  function formatAuthError(err, fallback) {
    const message = err?.message || ''
    if (message.includes('User already registered')) return 'Cet email est déjà utilisé'
    if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect'
    return fallback
  }

  // Inscription
  async function register(email, password, username) {
    if (!supabase) {
      return { success: false, error: 'Supabase non configuré' }
    }

    try {
      error.value = null

      // Vérifier username disponible
      const trimmedUsername = username.trim()
      const { available, error: usernameError } = await checkUsernameAvailable(trimmedUsername)
      if (usernameError) {
        return { success: false, error: usernameError }
      }
      if (!available) {
        return { success: false, error: 'Ce pseudo est déjà pris' }
      }

      // Créer l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: trimmedUsername
          }
        }
      })

      if (authError) throw authError

      if (authData?.session?.user) {
        user.value = authData.session.user
        await fetchProfile()
        return { success: true, error: null, confirmationRequired: false }
      }

      return {
        success: true,
        error: null,
        confirmationRequired: true,
        message: confirmationNotice
      }
    } catch (err) {
      const friendlyError = formatAuthError(err, "Erreur lors de l'inscription")
      error.value = friendlyError
      return { success: false, error: friendlyError }
    }
  }

  // Connexion
  async function login(email, password) {
    if (!supabase) {
      return { success: false, error: 'Supabase non configuré' }
    }

    try {
      error.value = null

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      user.value = data.user
      await fetchProfile()

      return { success: true, error: null }
    } catch (err) {
      const friendlyError = formatAuthError(err, 'Erreur de connexion')
      error.value = friendlyError
      return { success: false, error: friendlyError }
    }
  }

  // Déconnexion
  async function logout() {
    if (!supabase) return

    try {
      await supabase.auth.signOut()
      user.value = null
      profile.value = null
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return {
    // State (readonly)
    user: readonly(user),
    profile: readonly(profile),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    isAuthenticated,
    isConfigured,

    // Actions
    initSession,
    register,
    login,
    logout,
    checkUsernameAvailable,
    fetchProfile
  }
}
