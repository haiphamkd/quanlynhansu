// Reference to vite/client removed to fix "Cannot find type definition" error

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    NODE_ENV: string;
    [key: string]: string | undefined;
  }
}