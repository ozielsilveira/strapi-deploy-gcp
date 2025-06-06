import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 120000, // Aumenta o timeout global para 2 minutos
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});