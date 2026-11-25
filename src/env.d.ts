interface ImportMetaEnv {
  /** Directus, when it isn't beside the app, such as a CI stack's. */
  readonly VITE_DIRECTUS_URL?: string;
  /** Authentik, when it isn't beside the app, such as a CI stack's. */
  readonly VITE_AUTHENTIK_URL?: string;
}
