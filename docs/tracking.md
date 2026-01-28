# Tracking (GoatCounter)

## Opt-out

- Clé locale : `localStorage.analytics_optout`
- Valeur active : `"1"`
- Comportement : si opt-out actif, aucun chargement du script GoatCounter et aucun event/pageview n’est envoyé.

## Wrapper

- `src/analytics/goatcounter.js`
  - `isOptedOut()`
  - `trackEvent(name)`
  - `trackPageview(path)`

## Anti-bruit

- `setup_option_confirm` est dédupliqué par session (1 envoi max par session).

## Événements conservés (macro)

- `landing_prepare_click`
- `lexique_page_cta_app_click`
- `rules_page_cta_app_click`
- `setup_open`
- `setup_complete`
- `rules_open`
- `race_finish`
- `auth_open`
- `auth_success`

## Privacy

- Aucun event ne contient de données personnelles.
