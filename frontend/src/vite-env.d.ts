/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EPISODE_VIEWER_URL: string;
  // add other env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 