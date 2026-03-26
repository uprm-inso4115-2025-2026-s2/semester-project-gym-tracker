/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_PUBLIC_PATH?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
