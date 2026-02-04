import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Cloudflare Workers globals
        console: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortController: 'readonly',
        ReadableStream: 'readonly',
        DurableObjectState: 'readonly',
        DurableObjectNamespace: 'readonly',
        DurableObjectStub: 'readonly',
        D1Database: 'readonly',
        D1Result: 'readonly',
        D1PreparedStatement: 'readonly',
        KVNamespace: 'readonly',
        KVNamespacePutOptions: 'readonly',
        R2Bucket: 'readonly',
        R2Object: 'readonly',
        R2ObjectBody: 'readonly',
        R2ListOptions: 'readonly',
        R2Objects: 'readonly',
        R2PutOptions: 'readonly',
        Fetcher: 'readonly',
        RequestInit: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', '.wrangler/', '**/*.js', '**/*.mjs'],
  }
);
