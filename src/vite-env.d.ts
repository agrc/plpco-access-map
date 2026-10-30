/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/// <reference types="vite/client" />

import '@arcgis/map-components/types/react';

declare const APP_VERSION: string;

interface ImportMetaEnv {
  readonly VITE_APP_DEPLOY?: 'VIEWER' | 'INTERNAL' | 'BELLWETHER';
  readonly VITE_APP_MAP_ID: string;
  readonly VITE_APP_OAUTH_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    APP_VERSION: string;
    YT: any;
  }

  const YT: any;
}

export {};
