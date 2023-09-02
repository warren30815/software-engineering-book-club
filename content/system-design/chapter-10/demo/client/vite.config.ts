import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({

  plugins: [react()],
  server: {
    proxy: {
      '/todos': 'https://jsonplaceholder.typicode.com/todos/1',
    }
  }
})
