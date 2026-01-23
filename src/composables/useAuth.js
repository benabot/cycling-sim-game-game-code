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

  // Envoi d'un email de réinitialisation de mot de passe
  async function resetPasswordForEmail(email) {
    if (!supabase) {
      return { success: false, error: 'Supabase non configuré' }
    }

    try {
      // Déterminer l'URL de redirection selon l'environnement
      const redirectTo = import.meta.env.PROD
        ? 'https://bordur.fr/app/reset-password'
        : `${window.location.origin}/app/reset-password`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      })

      if (resetError) throw resetError

      return { success: true, error: null }
    } catch (err) {
      console.error('Reset password error:', err)
      return { success: false, error: 'Erreur lors de l\'envoi du lien' }
    }
  }

  // Mise à jour du mot de passe (après clic sur le lien email)
  async function updatePassword(newPassword) {
    if (!supabase) {
      return { success: false, error: 'Supabase non configuré' }
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      return { success: true, error: null }
    } catch (err) {
      console.error('Update password error:', err)
      const message = err?.message || ''
      if (message.includes('New password should be different')) {
        return { success: false, error: 'Le nouveau mot de passe doit être différent de l\'ancien' }
      }
      return { success: false, error: 'Erreur lors de la mise à jour du mot de passe' }
    }
  }

  // Suppression complète du compte utilisateur via Edge Function
  async function deleteAccount() {
    if (!supabase || !user.value) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    try {
      // Récupérer le token d'accès
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        return { success: false, error: 'Session expirée' }
      }

      // Construire l'URL de l'edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const functionUrl = `${supabaseUrl}/functions/v1/delete-account`

      // Appeler l'Edge Function via fetch direct (pour passer apikey + Authorization)
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey
        }
      })

      const data = await response.json()
      const error = !response.ok ? { message: data.error || 'Erreur serveur' } : null

      if (error) {
        console.error('Delete account error:', error)
        return { success: false, error: 'Erreur lors de la suppression du compte' }
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Erreur lors de la suppression' }
      }

      // Nettoyer l'état local
      user.value = null
      profile.value = null

      return { success: true, error: null }
    } catch (err) {
      console.error('Delete account error:', err)
      return { success: false, error: 'Erreur lors de la suppression du compte' }
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
    fetchProfile,
    resetPasswordForEmail,
    updatePassword,
    deleteAccount
  }
}
