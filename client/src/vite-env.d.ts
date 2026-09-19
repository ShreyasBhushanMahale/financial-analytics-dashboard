/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where the API lives. Defaults to `/api`, which the Vite dev server proxies to port 4000. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
