import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  server: {
    proxy: {
      '/sophos-api': {
        target: 'https://apimanager.sophos-med.ru',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/sophos-api/, ''),
      },
    },
  },
});
