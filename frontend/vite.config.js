import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    historyApiFallback: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          streamChat: ['stream-chat-react'],
          streamVideo: ['@stream-io/video-react-sdk'],
        },
      },
    },
  },
})
