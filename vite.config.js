import { defineConfig } from 'vite'

// Multi-page app (MPA): alle tre HTML-sider bygges som separate inngangspunkter.
// Vite resolves paths relativt til der config-filen ligger (prosjektroten).
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:      'index.html',
        pengeprat: 'pengeprat/index.html',
        uventetSum: 'uventet-sum/index.html',
      }
    }
  }
})
