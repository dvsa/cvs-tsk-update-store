module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'jest'],
    extends: [
      '@dvsa/eslint-config-ts',
    ],
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-commented-out-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "no-restricted-syntax": "off"
    },
  };