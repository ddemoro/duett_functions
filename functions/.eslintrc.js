module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["warn", "double", { "avoidEscape": true }],
    "import/no-unresolved": 0,
    "indent": ["warn", 2],
    "max-len": ["warn", 200],
    "@typescript-eslint/no-explicit-any": "off",
    "no-console": "off", // Allow console statements
    "eqeqeq": ["warn", "always"], // Downgraded to warn
    "prefer-const": "error", // Keep this as error
    "no-var": "error", // Keep this as error
    "no-unused-vars": "off", // Turn off base rule
    "@typescript-eslint/no-unused-vars": ["warn"], // Downgraded to warn
    "object-curly-spacing": ["warn", "always"], // Downgraded to warn
    "comma-dangle": ["warn", "always-multiline"], // Downgraded to warn
    "arrow-parens": ["warn", "always"], // Downgraded to warn
    "import/first": "warn",
    "import/newline-after-import": "warn",
    "import/no-duplicates": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-non-null-assertion": "off", // Allow non-null assertions
    "@typescript-eslint/ban-ts-comment": ["warn", {
      "ts-ignore": "allow-with-description",
      "ts-expect-error": "allow-with-description",
    }],
    "no-trailing-spaces": "warn", // Downgraded to warn
    "key-spacing": "warn", // Downgraded to warn
    "keyword-spacing": "warn", // Downgraded to warn
    "operator-linebreak": "off", // Turned off
  },
};
