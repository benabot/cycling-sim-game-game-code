<template>
  <div class="reset-page">
    <div class="reset-card">
      <h1 class="reset-title">Nouveau mot de passe</h1>

      <!-- Success state -->
      <div v-if="status === 'success'" class="reset-success">
        <UIIcon type="check" size="xl" />
        <p class="success-message">Votre mot de passe a été mis à jour avec succès.</p>
        <button type="button" class="btn btn-primary btn-full" @click="goToLogin">
          Se connecter
        </button>
      </div>

      <!-- Error state (invalid/expired token) -->
      <div v-else-if="status === 'error'" class="reset-error-state">
        <UIIcon type="warning" size="xl" />
        <p class="error-message">{{ errorMessage }}</p>
        <button type="button" class="btn btn-secondary btn-full" @click="goToLogin">
          Retour à l'accueil
        </button>
      </div>

      <!-- Form state -->
      <form v-else class="reset-form" @submit.prevent="handleSubmit">
        <p class="reset-intro">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        <!-- Server error -->
        <div v-if="serverError" class="form-error">
          <UIIcon type="warning" size="sm" />
          <span>{{ serverError }}</span>
        </div>

        <div class="form-group">
          <label for="new-password" class="form-label">Nouveau mot de passe</label>
          <input
            id="new-password"
            v-model="form.password"
            type="password"
            class="form-input"
            :class="{ 'form-input--error': errors.password }"
            placeholder="8 caractères minimum"
            autocomplete="new-password"
            @blur="validateField('password')"
          />
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label for="confirm-password" class="form-label">Confirmer le mot de passe</label>
          <input
            id="confirm-password"
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            :class="{ 'form-input--error': errors.confirmPassword }"
            placeholder="Répétez le mot de passe"
            autocomplete="new-password"
            @blur="validateField('confirmPassword')"
          />
          <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="btn-spinner"></span>
          <span v-else>Mettre à jour le mot de passe</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import UIIcon from '../components/icons/UIIcon.vue';
import { useAuth } from '../composables/useAuth.js';
import { supabase } from '../lib/supabase.js';

const emit = defineEmits(['go-to-login']);

const { updatePassword, logout } = useAuth();

// Status: 'form' | 'success' | 'error'
const status = ref('form');
const isSubmitting = ref(false);
const serverError = ref(null);
const errorMessage = ref('');

const form = reactive({
  password: '',
  confirmPassword: ''
});

const errors = reactive({
  password: null,
  confirmPassword: null
});

function validateField(field) {
  switch (field) {
    case 'password':
      if (!form.password) {
        errors.password = 'Mot de passe requis';
      } else if (form.password.length < 8) {
        errors.password = '8 caractères minimum';
      } else {
        errors.password = null;
      }
      // Re-validate confirm if password changed
      if (form.confirmPassword) {
        validateField('confirmPassword');
      }
      break;
    case 'confirmPassword':
      if (!form.confirmPassword) {
        errors.confirmPassword = 'Confirmation requise';
      } else if (form.confirmPassword !== form.password) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      } else {
        errors.confirmPassword = null;
      }
      break;
  }
}

async function handleSubmit() {
  validateField('password');
  validateField('confirmPassword');

  if (errors.password || errors.confirmPassword) {
    return;
  }

  isSubmitting.value = true;
  serverError.value = null;

  const result = await updatePassword(form.password);

  isSubmitting.value = false;

  if (result.success) {
    status.value = 'success';
    // Déconnecter après le reset pour forcer une nouvelle connexion
    await logout();
  } else {
    serverError.value = result.error;
  }
}

function goToLogin() {
  emit('go-to-login');
}

onMounted(async () => {
  // Vérifier si on a un token de recovery valide
  // Supabase gère automatiquement le token dans l'URL
  if (!supabase) {
    status.value = 'error';
    errorMessage.value = 'Service d\'authentification non disponible.';
    return;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      status.value = 'error';
      errorMessage.value = 'Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.';
    }
  } catch (err) {
    console.error('Session check error:', err);
    status.value = 'error';
    errorMessage.value = 'Une erreur est survenue. Veuillez réessayer.';
  }
});
</script>

<style scoped>
.reset-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: var(--color-canvas);
}

.reset-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-md);
}

.reset-title {
  font-family: var(--font-display, inherit);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 var(--space-lg);
  text-align: center;
}

.reset-intro {
  font-size: 14px;
  color: var(--color-ink-soft);
  margin: 0 0 var(--space-lg);
  line-height: 1.5;
  text-align: center;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-ink);
}

.form-input {
  padding: 10px 12px;
  font-size: 14px;
  font-family: var(--font-body, inherit);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-ink);
  transition: var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.form-input::placeholder {
  color: var(--color-ink-muted);
}

.form-input--error {
  border-color: var(--team-red-print);
}

.form-input--error:focus {
  box-shadow: 0 0 0 3px var(--team-red-light);
}

.field-error {
  font-size: 12px;
  color: var(--team-red-print);
}

.form-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: rgba(216, 74, 74, 0.08);
  border: 1px solid var(--team-red-print);
  border-radius: var(--radius-sm);
  color: var(--team-red-print);
  font-size: 13px;
}

.form-error :deep(svg) {
  flex-shrink: 0;
}

/* Success state */
.reset-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  text-align: center;
}

.reset-success :deep(svg) {
  color: var(--team-green-print);
}

.success-message {
  font-size: 14px;
  color: var(--color-ink-soft);
  margin: 0;
  line-height: 1.5;
}

/* Error state */
.reset-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  text-align: center;
}

.reset-error-state :deep(svg) {
  color: var(--team-red-print);
  opacity: 0.6;
}

.error-message {
  font-size: 14px;
  color: var(--color-ink-soft);
  margin: 0;
  line-height: 1.5;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  font-family: var(--font-body, inherit);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-primary {
  background: var(--color-ink);
  border: 1px solid var(--color-ink);
  color: var(--color-paper);
}

.btn-primary:hover:not(:disabled) {
  background: #2d3339;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  color: var(--color-ink);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-canvas);
  border-color: var(--color-line-strong);
}

.btn-full {
  width: 100%;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-paper);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile */
@media (max-width: 720px) {
  .reset-page {
    padding: var(--space-md);
    align-items: flex-start;
    padding-top: 15vh;
  }

  .reset-card {
    padding: var(--space-lg);
  }
}
</style>
