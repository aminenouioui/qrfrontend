import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/add": "http://localhost:8000",
      "/list": "http://localhost:8000",
      "/levels": "http://localhost:8000",
      "/media": "http://localhost:8000",
      "/delete": "http://localhost:8000",
      "/edit": "http://localhost:8000", // Added for edit endpoint
      "/add-classe": "http://localhost:8000",
      "/add-classe-list": "http://localhost:8000",
     
    },
  },
});