/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_DEBUG_ENABLED: string;
  readonly VITE_HEAP_ID: string;
  // put vite env variables here to allow intellisense
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
