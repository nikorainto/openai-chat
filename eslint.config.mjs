import pluginJs from '@eslint/js'
import importOrder from 'eslint-plugin-import'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: globals.browser } },
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
  {
    plugins: { import: importOrder },
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
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
]
