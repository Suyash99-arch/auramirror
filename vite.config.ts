import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "mediapipe",
              test: /node_modules[\\/]@mediapipe[\\/]/,
              priority: 30,
            },
            {
              name: "three",
              test: /node_modules[\\/]three[\\/]/,
              priority: 20,
              maxSize: 400 * 1024,
            },
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^three$/,
        replacement: new URL(
          "./node_modules/three/src/Three.js",
          import.meta.url,
        ).pathname,
      },
    ],
  },
});
