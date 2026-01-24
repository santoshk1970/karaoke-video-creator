import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/__tests__/**/*.ts'],
        exclude: [
            'node_modules/',
            'dist/',
            'web-ui/',
            '**/*.js'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.test.ts',
                '**/*.config.ts',
                'web-ui/',
                'timing-tool.js',
                'adjust-timing.js',
                '*.js'
            ]
        }
    }
});
