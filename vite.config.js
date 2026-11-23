import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // Relative paths ("./assets/...") so the built site works from any address,
  // e.g. panpan123nick.github.io/FitnessTracker/, without knowing the repo name.
  base: './',
  plugins: [
    react(),
    // Phones only allow camera access on https pages. `npm run dev:phone` turns on
    // a self-made https certificate (your phone will warn about it once; that's expected).
    mode === 'phone' && basicSsl(),
  ],
  build: {
    // GitHub Pages can publish a "docs" folder, so the built site goes there,
    // right next to the source code.
    outDir: 'docs',
  },
  server: {
    // Listen on the local network too, so a phone on the same Wi-Fi can open the app.
    host: true,
  },
  test: {
    // jsdom gives tests a fake browser (with localStorage) so we can test storage code.
    environment: 'jsdom',
  },
}));
