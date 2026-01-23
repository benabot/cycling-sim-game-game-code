<template>
  <ModalShell
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Compte"
    max-width="400px"
  >
    <div class="auth-modal">
      <!-- Tabs (hidden in forgot mode) -->
      <div v-if="mode !== 'forgot'" class="auth-tabs">
        <button
          type="button"
          :class="['auth-tab', { 'auth-tab--active': mode === 'login' }]"
          @click="switchMode('login')"
        >
          Connexion
        </button>
        <button
          type="button"
          :class="['auth-tab', { 'auth-tab--active': mode === 'register' }]"
          @click="switchMode('register')"
        >
          Inscription
        </button>
      </div>

      <!-- Forgot password header -->
      <div v-else class="forgot-header">
        <h3 class="forgot-title">Mot de passe oublié</h3>
      </div>

      <!-- Server error -->
      <div v-if="serverError" class="auth-error">
        <UIIcon type="warning" size="sm" />
        <span>{{ serverError }}</span>
      </div>
      <div v-if="serverNotice" class="auth-notice">
        <UIIcon type="check" size="sm" />
        <span>{{ serverNotice }}</span>
      </div>

      <!-- Login form -->
      <form v-if="mode === 'login'" class="auth-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="login-email" class="form-label">Email</label>
          <input
            id="login-email"
            v-model="loginForm.email"
            type="email"
            class="form-input"
            :class="{ 'form-input--error': loginErrors.email }"
            placeholder="votre@email.com"
            autocomplete="email"
            @blur="validateLoginField('email')"
          />
          <span v-if="loginErrors.email" class="field-error">{{ loginErrors.email }}</span>
        </div>

        <div class="form-group">
          <label for="login-password" class="form-label">Mot de passe</label>
          <input
            id="login-password"
            v-model="loginForm.password"
            type="password"
            class="form-input"
            :class="{ 'form-input--error': loginErrors.password }"
            placeholder="Votre mot de passe"
            autocomplete="current-password"
            @blur="validateLoginField('password')"
          />
          <span v-if="loginErrors.password" class="field-error">{{ loginErrors.password }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="btn-spinner"></span>
          <span v-else>Se connecter</span>
        </button>

        <button
          type="button"
          class="forgot-password-link"
          @click="switchMode('forgot')"
        >
          Mot de passe oublié ?
        </button>
      </form>

      <!-- Forgot password form -->
      <div v-else-if="mode === 'forgot'" class="auth-form">
        <p class="forgot-intro">
          Entrez votre adresse email pour recevoir un lien de réinitialisation.
        </p>

        <form @submit.prevent="handleForgotPassword">
          <div class="form-group">
            <label for="forgot-email" class="form-label">Email</label>
            <input
              id="forgot-email"
              v-model="forgotForm.email"
              type="email"
              class="form-input"
              :class="{ 'form-input--error': forgotErrors.email }"
              placeholder="votre@email.com"
              autocomplete="email"
              @blur="validateForgotField('email')"
            />
            <span v-if="forgotErrors.email" class="field-error">{{ forgotErrors.email }}</span>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-full"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="btn-spinner"></span>
            <span v-else>Envoyer le lien</span>
          </button>
        </form>

        <button
          type="button"
          class="back-to-login-link"
          @click="switchMode('login')"
        >
          ← Retour à la connexion
        </button>
      </div>

      <!-- Register form -->
      <form v-else class="auth-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="register-email" class="form-label">Email</label>
          <input
            id="register-email"
            v-model="registerForm.email"
            type="email"
            class="form-input"
            :class="{ 'form-input--error': registerErrors.email }"
            placeholder="votre@email.com"
            autocomplete="email"
            @blur="validateRegisterField('email')"
          />
          <span v-if="registerErrors.email" class="field-error">{{ registerErrors.email }}</span>
        </div>

        <div class="form-group">
          <label for="register-username" class="form-label">Pseudo</label>
          <input
            id="register-username"
            v-model="registerForm.username"
            type="text"
            class="form-input"
            :class="{
              'form-input--error': registerErrors.username,
              'form-input--success': usernameAvailable === true
            }"
            placeholder="VotreNomDeJoueur"
            autocomplete="username"
            @blur="validateRegisterField('username')"
            @input="debouncedCheckUsername"
          />
          <span v-if="registerErrors.username" class="field-error">{{ registerErrors.username }}</span>
          <span v-else-if="usernameAvailable === true && registerForm.username" class="field-success">
            Pseudo disponible
          </span>
          <span v-else-if="isCheckingUsername" class="field-info">Vérification...</span>
        </div>

        <div class="form-group">
          <label for="register-password" class="form-label">Mot de passe</label>
          <input
            id="register-password"
            v-model="registerForm.password"
            type="password"
            class="form-input"
            :class="{ 'form-input--error': registerErrors.password }"
            placeholder="8 caractères minimum"
            autocomplete="new-password"
            @blur="validateRegisterField('password')"
          />
          <span v-if="registerErrors.password" class="field-error">{{ registerErrors.password }}</span>
        </div>

        <div class="form-group">
          <label for="register-confirm" class="form-label">Confirmer le mot de passe</label>
          <input
            id="register-confirm"
            v-model="registerForm.confirmPassword"
            type="password"
            class="form-input"
            :class="{ 'form-input--error': registerErrors.confirmPassword }"
            placeholder="Répétez le mot de passe"
            autocomplete="new-password"
            @blur="validateRegisterField('confirmPassword')"
          />
          <span v-if="registerErrors.confirmPassword" class="field-error">{{ registerErrors.confirmPassword }}</span>
        </div>

        <div class="form-group form-group--checkbox">
          <label class="checkbox-label">
            <input
              id="accept-privacy"
              v-model="registerForm.acceptPrivacy"
              type="checkbox"
              class="checkbox-input"
              @change="validateRegisterField('acceptPrivacy')"
            />
            <span class="checkbox-text">
              J'accepte la
              <a href="/confidentialite.html" target="_blank" rel="noopener noreferrer" class="privacy-link">
                politique de confidentialité
              </a>
            </span>
          </label>
          <span v-if="registerErrors.acceptPrivacy" class="field-error">{{ registerErrors.acceptPrivacy }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="isSubmitting || !isRegisterValid"
        >
          <span v-if="isSubmitting" class="btn-spinner"></span>
          <span v-else>Créer mon compte</span>
        </button>
      </form>
    </div>
  </ModalShell>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import ModalShell from './ModalShell.vue';
import UIIcon from './icons/UIIcon.vue';
import { useAuth } from '../composables/useAuth.js';
import { trackEvent } from '../analytics/goatcounter.js';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);

const { login, register, checkUsernameAvailable, resetPasswordForEmail } = useAuth();

const mode = ref('login');
const isSubmitting = ref(false);
const serverError = ref(null);
const serverNotice = ref(null);
const isCheckingUsername = ref(false);
const usernameAvailable = ref(null);
let usernameCheckTimeout = null;

// Login form
const loginForm = reactive({
  email: '',
  password: ''
});

const loginErrors = reactive({
  email: null,
  password: null
});

// Register form
const registerForm = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  acceptPrivacy: false
});

const registerErrors = reactive({
  email: null,
  username: null,
  password: null,
  confirmPassword: null,
  acceptPrivacy: null
});

// Forgot password form
const forgotForm = reactive({
  email: ''
});

const forgotErrors = reactive({
  email: null
});

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Username: 3-20 chars, alphanumeric + underscores
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

const isRegisterValid = computed(() => {
  return (
    registerForm.email &&
    registerForm.username &&
    registerForm.password &&
    registerForm.confirmPassword &&
    registerForm.acceptPrivacy &&
    !registerErrors.email &&
    !registerErrors.username &&
    !registerErrors.password &&
    !registerErrors.confirmPassword &&
    !registerErrors.acceptPrivacy &&
    usernameAvailable.value === true
  );
});

function switchMode(newMode) {
  mode.value = newMode;
  serverError.value = null;
  serverNotice.value = null;
  // Reset errors when switching
  Object.keys(loginErrors).forEach(k => loginErrors[k] = null);
  Object.keys(registerErrors).forEach(k => registerErrors[k] = null);
  Object.keys(forgotErrors).forEach(k => forgotErrors[k] = null);
}

function validateLoginField(field) {
  switch (field) {
    case 'email':
      if (!loginForm.email) {
        loginErrors.email = 'Email requis';
      } else if (!emailRegex.test(loginForm.email)) {
        loginErrors.email = 'Email invalide';
      } else {
        loginErrors.email = null;
      }
      break;
    case 'password':
      if (!loginForm.password) {
        loginErrors.password = 'Mot de passe requis';
      } else {
        loginErrors.password = null;
      }
      break;
  }
}

function validateRegisterField(field) {
  switch (field) {
    case 'email':
      if (!registerForm.email) {
        registerErrors.email = 'Email requis';
      } else if (!emailRegex.test(registerForm.email)) {
        registerErrors.email = 'Email invalide';
      } else {
        registerErrors.email = null;
      }
      break;
    case 'username':
      if (!registerForm.username) {
        registerErrors.username = 'Pseudo requis';
      } else if (!usernameRegex.test(registerForm.username)) {
        registerErrors.username = '3-20 caractères (lettres, chiffres, _)';
      } else {
        registerErrors.username = null;
      }
      break;
    case 'password':
      if (!registerForm.password) {
        registerErrors.password = 'Mot de passe requis';
      } else if (registerForm.password.length < 8) {
        registerErrors.password = '8 caractères minimum';
      } else {
        registerErrors.password = null;
      }
      // Re-validate confirm if password changed
      if (registerForm.confirmPassword) {
        validateRegisterField('confirmPassword');
      }
      break;
    case 'confirmPassword':
      if (!registerForm.confirmPassword) {
        registerErrors.confirmPassword = 'Confirmation requise';
      } else if (registerForm.confirmPassword !== registerForm.password) {
        registerErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      } else {
        registerErrors.confirmPassword = null;
      }
      break;
    case 'acceptPrivacy':
      if (!registerForm.acceptPrivacy) {
        registerErrors.acceptPrivacy = 'Vous devez accepter la politique de confidentialité';
      } else {
        registerErrors.acceptPrivacy = null;
      }
      break;
  }
}

function validateForgotField(field) {
  if (field === 'email') {
    if (!forgotForm.email) {
      forgotErrors.email = 'Email requis';
    } else if (!emailRegex.test(forgotForm.email)) {
      forgotErrors.email = 'Email invalide';
    } else {
      forgotErrors.email = null;
    }
  }
}

async function handleForgotPassword() {
  validateForgotField('email');

  if (forgotErrors.email) {
    return;
  }

  isSubmitting.value = true;
  serverError.value = null;
  serverNotice.value = null;

  const result = await resetPasswordForEmail(forgotForm.email);

  isSubmitting.value = false;

  if (result.success) {
    // Message volontairement vague pour des raisons de sécurité
    serverNotice.value = 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.';
    forgotForm.email = '';
  } else {
    serverError.value = result.error;
  }
}

function debouncedCheckUsername() {
  // Clear previous timeout
  if (usernameCheckTimeout) {
    clearTimeout(usernameCheckTimeout);
  }

  usernameAvailable.value = null;

  // Validate format first
  if (!registerForm.username || !usernameRegex.test(registerForm.username)) {
    return;
  }

  isCheckingUsername.value = true;

  usernameCheckTimeout = setTimeout(async () => {
    const result = await checkUsernameAvailable(registerForm.username);
    isCheckingUsername.value = false;

    if (result.error) {
      registerErrors.username = result.error;
      usernameAvailable.value = false;
    } else {
      usernameAvailable.value = result.available;
      if (!result.available) {
        registerErrors.username = 'Ce pseudo est déjà pris';
      }
    }
  }, 500);
}

async function handleLogin() {
  // Validate all fields
  validateLoginField('email');
  validateLoginField('password');

  if (loginErrors.email || loginErrors.password) {
    return;
  }

  isSubmitting.value = true;
  serverError.value = null;
  serverNotice.value = null;

  const result = await login(loginForm.email, loginForm.password);

  isSubmitting.value = false;

  if (result.success) {
    trackEvent('auth_success');
    emit('update:modelValue', false);
  } else {
    serverError.value = result.error || 'Erreur de connexion';
  }
}

async function handleRegister() {
  // Validate all fields
  validateRegisterField('email');
  validateRegisterField('username');
  validateRegisterField('password');
  validateRegisterField('confirmPassword');
  validateRegisterField('acceptPrivacy');

  if (
    registerErrors.email ||
    registerErrors.username ||
    registerErrors.password ||
    registerErrors.confirmPassword ||
    registerErrors.acceptPrivacy ||
    usernameAvailable.value !== true
  ) {
    return;
  }

  isSubmitting.value = true;
  serverError.value = null;
  serverNotice.value = null;

  const result = await register(
    registerForm.email,
    registerForm.password,
    registerForm.username
  );

  isSubmitting.value = false;

  if (result.success) {
    trackEvent('auth_success');
    if (result.confirmationRequired) {
      serverNotice.value = result.message || 'Confirmez votre email pour vous connecter.';
    } else {
      emit('update:modelValue', false);
    }
  } else {
    serverError.value = result.error || "Erreur lors de l'inscription";
  }
}

// Reset forms when modal closes
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    loginForm.email = '';
    loginForm.password = '';
    registerForm.email = '';
    registerForm.username = '';
    registerForm.password = '';
    registerForm.confirmPassword = '';
    registerForm.acceptPrivacy = false;
    forgotForm.email = '';
    Object.keys(loginErrors).forEach(k => loginErrors[k] = null);
    Object.keys(registerErrors).forEach(k => registerErrors[k] = null);
    Object.keys(forgotErrors).forEach(k => forgotErrors[k] = null);
    serverError.value = null;
    serverNotice.value = null;
    usernameAvailable.value = null;
    mode.value = 'login'; // Reset to login mode
  }
});
</script>

<style scoped>
.auth-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.auth-tabs {
  display: flex;
  gap: var(--space-xs);
  border-bottom: 1px solid var(--color-line);
  margin: calc(-1 * var(--space-lg));
  margin-bottom: 0;
  padding: 0 var(--space-lg);
}

.auth-tab {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-body, inherit);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-ink-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: var(--transition-fast);
}

.auth-tab:hover {
  color: var(--color-ink-soft);
}

.auth-tab--active {
  color: var(--color-ink);
  border-bottom-color: var(--color-accent);
}

.auth-error {
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

.auth-error :deep(svg) {
  flex-shrink: 0;
}

.auth-notice {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: rgba(46, 125, 50, 0.08);
  border: 1px solid rgba(46, 125, 50, 0.4);
  border-radius: var(--radius-sm);
  color: #2e7d32;
  font-size: 13px;
}

.auth-notice :deep(svg) {
  flex-shrink: 0;
}

.auth-form {
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

.form-input--success {
  border-color: var(--team-green-print);
}

.form-input--success:focus {
  box-shadow: 0 0 0 3px var(--team-green-light);
}

.field-error {
  font-size: 12px;
  color: var(--team-red-print);
}

.field-success {
  font-size: 12px;
  color: var(--team-green-print);
}

.field-info {
  font-size: 12px;
  color: var(--color-ink-muted);
}

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

/* Forgot password styles */
.forgot-password-link {
  background: none;
  border: none;
  padding: 0;
  margin-top: var(--space-xs);
  font-size: 13px;
  color: var(--color-ink-muted);
  cursor: pointer;
  text-align: center;
  transition: var(--transition-fast);
}

.forgot-password-link:hover {
  color: var(--color-ink);
  text-decoration: underline;
}

.forgot-intro {
  font-size: 14px;
  color: var(--color-ink-soft);
  margin: 0;
  line-height: 1.5;
}

.back-to-login-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: var(--color-ink-muted);
  cursor: pointer;
  text-align: center;
  transition: var(--transition-fast);
}

.back-to-login-link:hover {
  color: var(--color-ink);
}

.forgot-header {
  margin: calc(-1 * var(--space-lg));
  margin-bottom: 0;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-line);
}

.forgot-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
  text-align: center;
}

/* Checkbox styles */
.form-group--checkbox {
  margin-top: var(--space-sm);
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--color-ink-soft);
  line-height: 1.5;
}

.checkbox-input {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.checkbox-text {
  flex: 1;
}

.privacy-link {
  color: var(--color-accent);
  text-decoration: none;
  transition: var(--transition-fast);
}

.privacy-link:hover {
  text-decoration: underline;
}

.privacy-link:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 2px;
}
</style>
