/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly DATABASE_URL?: string;
  readonly DATABASE_SSL?: string;
  readonly PUBLIC_APP_NAME?: string;
  readonly PUBLIC_APP_SHORT_NAME?: string;
  readonly PUBLIC_APP_TAGLINE?: string;
  readonly COMPOSE_PROJECT_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
