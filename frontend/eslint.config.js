// ESLint desactivado - todas las reglas deshabilitadas
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['**/*']), // Ignorar todos los archivos
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      // Todas las reglas desactivadas
    },
  },
])
