import globals from 'globals';
import pluginJs from '@eslint/js';
import daStyle from 'eslint-config-dicodingacademy';


export default [
  daStyle,
  { files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules:{
      'no-console': 'off',
      'linebreak-style': 'off',
      'no-underscore-dangle': 'off',
      'camelcase': 'off',
    } },
  { languageOptions:
    { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
];