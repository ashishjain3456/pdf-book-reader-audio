declare module 'expo-file-system' {
  export class File {
    constructor(...parts: string[]);
    readonly uri: string;
    static downloadFileAsync(
      url: string,
      destination: File,
      options?: { idempotent?: boolean }
    ): Promise<File>;
  }

  export const Paths: {
    cache: string;
  };
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
}

declare module 'expo-sharing' {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(
    url: string,
    options?: {
      mimeType?: string;
      dialogTitle?: string;
      UTI?: string;
    }
  ): Promise<void>;
}

declare module 'expo-audio' {
  export type AudioStatus = {
    isLoaded: boolean;
    playing: boolean;
    currentTime: number;
  };

  export type AudioPlayer = {
    pause: () => void;
    play: () => void;
    replace: (source: string | null) => void;
    seekTo: (seconds: number) => Promise<void>;
  };

  export function useAudioPlayer(
    source: string | null,
    options?: { updateInterval?: number }
  ): AudioPlayer;
  export function useAudioPlayerStatus(player: AudioPlayer): AudioStatus;
}

declare module 'react-native-webview' {
  import * as React from 'react';

  export class WebView extends React.Component<Record<string, unknown>> {
    injectJavaScript(script: string): void;
  }
}

declare module 'react-native' {
  import type { ComponentType } from 'react';

  export const View: ComponentType<Record<string, unknown>>;
  export const Text: ComponentType<Record<string, unknown>>;
  export const Pressable: ComponentType<Record<string, unknown>>;
  export const ActivityIndicator: ComponentType<Record<string, unknown>>;
  export const PanResponder: {
    create: (handlers: any) => {
      panHandlers: Record<string, unknown>;
    };
  };
  export const Platform: {
    OS: 'ios' | 'android' | 'web' | string;
  };
  export const NativeModules: {
    FPStaticServer?: {
      start?: unknown;
      stop?: unknown;
    };
    [name: string]: unknown;
  };

  export const Alert: {
    alert: (title: string, message?: string) => void;
  };

  export const StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T) => T;
  };
}

declare module 'react-native-static-server' {
  export default class StaticServer {
    constructor(
      port: number,
      root: string,
      options?: { localOnly?: boolean }
    );

    start(): Promise<string>;
    stop(): Promise<void>;
  }
}

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  const pdfjs: {
    version: string;
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (src: string | Record<string, unknown>) => { promise: Promise<unknown> };
  };

  export default pdfjs;
}
