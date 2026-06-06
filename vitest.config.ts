import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'src/main.ts',
        'src/polyfills.ts',
        'src/test-setup.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/*.html',
        '**/*.scss',
        'dist/**',
        'node_modules/**',
        'src/app/app.routes.ts'
      ]
    }
  }
});
