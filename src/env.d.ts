/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly DATABASE_URL?: string;
  readonly DATABASE_SSL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
