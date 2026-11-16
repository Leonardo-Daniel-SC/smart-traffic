import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { loadEnv } from 'vite'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, globalThis.process.cwd(), '')
  const configuredOrigin = env.FIWARE_ORIGIN?.trim()
  let fiwareOrigin
  let originError

  if (configuredOrigin) {
    try {
      const parsedOrigin = new URL(configuredOrigin)
      if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.username || parsedOrigin.password || parsedOrigin.pathname !== '/' || parsedOrigin.search || parsedOrigin.hash) {
        throw new Error('Use somente protocolo, host e porta do Orion.')
      }
      fiwareOrigin = parsedOrigin.origin
    } catch {
      originError = 'FIWARE_ORIGIN inválida. Informe uma URL base como http://184.195.90.61:1026.'
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'fiware-local-proxy-configuration',
        configureServer(server) {
          if (!fiwareOrigin) {
            server.middlewares.use('/api/traffic', (_req, res) => {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 500
              res.end(JSON.stringify({ erro: originError || 'Defina FIWARE_ORIGIN no arquivo .env.local para conectar ao Orion.' }))
            })
          }
        },
      },
    ],
    server: {
      proxy: fiwareOrigin
        ? {
            '/api/traffic': {
              target: fiwareOrigin,
              changeOrigin: true,
              rewrite: () => '/v2/entities/urn:ngsi-ld:Traffic:003?options=keyValues',
              headers: {
                'fiware-service': 'smart',
                'fiware-servicepath': '/',
                accept: 'application/json',
              },
            },
          }
        : {},
    },
  }
})
