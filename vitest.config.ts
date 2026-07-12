import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const fontStub = fileURLToPath(
  new URL('./test/fixtures/nextFontStub.ts', import.meta.url),
)

export default defineConfig({
  test: {
    environment: 'node',
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      'next/font/google': fontStub,
    },
  },
})
