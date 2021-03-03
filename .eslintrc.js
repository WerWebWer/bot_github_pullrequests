module.exports = {
  env: {
    es6: true,
    node: true,
    jest: true
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'no-console': 'off',
    'multiline-comment-style': ['error', 'starred-block']
  }
}
