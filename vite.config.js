import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // <--- ESTO LE DICE: "Escucha a toda la red local (0.0.0.0)"
    port: 5173
  }
})