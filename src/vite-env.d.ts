/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_DEBUG_ENABLED: string;
  // put vite env variables here to allow intellisense
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
