module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: ["./tsconfig/tsconfig-src.json", "./tsconfig/tsconfig-test.json"],
  },
  root: true,
};
