import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vite';

const isLibraryBuild = process.env.BUILD_TARGET === 'lib';

export default defineConfig({
  base: process.env.GITHUB_PAGES_BASE || '/roi-calculator/',
  plugins: [
    react(),
    isLibraryBuild &&
      dts({
        include: ['src'],
        rollupTypes: true
      })
  ].filter(Boolean),
  build: isLibraryBuild
    ? {
        lib: {
          entry: 'src/index.ts',
          name: 'MyDecisiveRoiCalculator',
          fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
          formats: ['es', 'cjs']
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              'react/jsx-runtime': 'jsxRuntime'
            }
          }
        }
      }
    : undefined
});
