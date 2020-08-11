module.exports = {
  env: {
    es2020: true,
    node: true,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': ['error', { singleQuote: true }],
    // console メソッドを許可
    'no-console': 0,
  },
};
