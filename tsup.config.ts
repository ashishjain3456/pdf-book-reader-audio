import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react/index.ts',
    'react-web': 'src/react/web/index.ts',
    'react-native': 'src/react/native/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-native',
    'react-native-webview',
    'expo-file-system',
    'expo-secure-store',
    'expo-sharing',
    'pdfjs-dist',
  ],
  treeshake: true,
  target: 'es2022',
});
