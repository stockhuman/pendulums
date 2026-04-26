import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // @ts-expect-error - Babel plugin will warn
      babel: {
        plugins: [
          [
            'babel-plugin-styled-components',
            {
              ssr: false,
              pure: true,
              displayName: true,
              fileName: false,
              meaninglessFileNames: ['index', 'styles'],
            },
          ],
        ],
      },
    }),
    babel({ presets: [reactCompilerPreset()], exclude: /node_modules/ }),
  ],
})
