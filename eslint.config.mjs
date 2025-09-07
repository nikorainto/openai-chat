import pluginJs from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import importOrder from 'eslint-plugin-import'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    ignores: [
      'dist',
      '.next',
      'node_modules',
      'public',
      'test',
      'yarn.lock',
      'next-env.d.ts',
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importOrder,
      '@next/next': nextPlugin,
    },
    rules: {
      'require-await': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      // Next.js specific rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-unwanted-polyfillio': 'error',
      '@next/next/no-page-custom-font': 'error',
    },
  },
]
