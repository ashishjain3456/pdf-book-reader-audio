declare module "expo-file-system" {
  export class File {
    constructor(...parts: string[]);
    readonly uri: string;
    readonly exists: boolean;
    static downloadFileAsync(
      url: string,
      destination: File,
      options?: { idempotent?: boolean },
    ): Promise<File>;
  }

  export const Paths: {
    cache: string;
  };
}

declare module "expo-secure-store" {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
}

declare module "expo-sharing" {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(
    url: string,
    options?: {
      mimeType?: string;
      dialogTitle?: string;
      UTI?: string;
    },
  ): Promise<void>;
}

declare module "expo-audio" {
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
    options?: { updateInterval?: number },
  ): AudioPlayer;
  export function useAudioPlayerStatus(player: AudioPlayer): AudioStatus;
}

declare module "react-native-webview" {
  import * as React from "react";

  export class WebView extends React.Component<Record<string, unknown>> {
    injectJavaScript(script: string): void;
  }
}

declare module "react-native" {
  import type { Component, ComponentType } from "react";

  export type PanResponderGestureState = {
    dx: number;
    dy: number;
    vy: number;
  };

  export type PanResponderEvent = {
    nativeEvent: { locationX?: number; [key: string]: unknown };
  };

  export type PanResponderHandlers = {
    onStartShouldSetPanResponder?: () => boolean;
    onStartShouldSetPanResponderCapture?: () => boolean;
    onMoveShouldSetPanResponderCapture?: (
      event: PanResponderEvent,
      gestureState: PanResponderGestureState,
    ) => boolean;
    onMoveShouldSetPanResponder?: (
      event: PanResponderEvent,
      gestureState: PanResponderGestureState,
    ) => boolean;
    onPanResponderGrant?: (
      event: PanResponderEvent,
      gestureState: PanResponderGestureState,
    ) => void;
    onPanResponderMove?: (
      event: PanResponderEvent,
      gestureState: PanResponderGestureState,
    ) => void;
    onPanResponderRelease?: (
      event: PanResponderEvent,
      gestureState: PanResponderGestureState,
    ) => void;
    onPanResponderTerminationRequest?: () => boolean;
  };

  export class View extends Component<Record<string, unknown>> {
    measureInWindow(callback: (x: number, y: number) => void): void;
  }
  export const Text: ComponentType<Record<string, unknown>>;
  export const Pressable: ComponentType<Record<string, unknown>>;
  export const ActivityIndicator: ComponentType<Record<string, unknown>>;
  export const Modal: ComponentType<Record<string, unknown>>;
  export class ScrollView extends Component<Record<string, unknown>> {
    scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
  }
  export const Animated: {
    View: ComponentType<Record<string, unknown>>;
    Value: new (value: number) => {
      setValue: (value: number) => void;
      stopAnimation: () => void;
      interpolate: (config: {
        inputRange: number[];
        outputRange: (number | string)[];
      }) => object;
    };
    timing: (
      value: InstanceType<typeof Animated.Value>,
      config: {
        toValue: number;
        duration: number;
        easing: (value: number) => number;
        useNativeDriver: boolean;
      },
    ) => {
      start: (callback: (result: { finished: boolean }) => void) => void;
      stop: () => void;
    };
  };
  export const Easing: {
    cubic: (value: number) => number;
    inOut: (easing: (value: number) => number) => (value: number) => number;
  };
  export const Dimensions: {
    get: (dimension: "window" | "screen") => {
      width: number;
      height: number;
      scale: number;
      fontScale: number;
    };
    addEventListener: (
      event: "change",
      listener: (metrics: {
        window: { width: number; height: number; scale: number; fontScale: number };
        screen: { width: number; height: number; scale: number; fontScale: number };
      }) => void,
    ) => { remove: () => void };
  };
  export const PanResponder: {
    create: (handlers: PanResponderHandlers) => {
      panHandlers: Record<string, unknown>;
    };
  };
  export const Platform: {
    OS: "ios" | "android" | "web" | string;
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

declare module "@dr.pogodin/react-native-static-server" {
  export default class StaticServer {
    constructor(options: {
      fileDir: string;
      hostname?: string;
      nonLocal?: boolean;
      port?: number;
      stopInBackground?: boolean;
    });

    start(): Promise<string>;
    stop(): Promise<void>;
  }
}

declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  const pdfjs: {
    version: string;
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (src: string | Record<string, unknown>) => {
      promise: Promise<unknown>;
    };
  };

  export default pdfjs;
}
