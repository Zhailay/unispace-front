/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Базовый URL API. По умолчанию /api через прокси Vite. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
