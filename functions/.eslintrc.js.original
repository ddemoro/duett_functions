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
    "google",
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
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "max-len": ["error", 200],
    "@typescript-eslint/no-explicit-any": "off",
    "no-console": ["warn"], // Warns about console statements but doesn't error
    "eqeqeq": ["error", "always"], // Requires === and !== instead of == and !=
    "prefer-const": "error", // Use const when variables aren't reassigned
    "no-var": "error", // Prefer let/const over var
    "no-unused-vars": "off", // Turn off base rule
    "@typescript-eslint/no-unused-vars": ["error"], // Use TypeScript-specific version
    "object-curly-spacing": ["error", "always"], // Enforce spacing in object literals
    "comma-dangle": ["error", "always-multiline"], // Trailing commas in multiline objects
    "arrow-parens": ["error", "always"], // Consistent arrow function params with parens
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",
    "@typescript-eslint/explicit-function-return-type": "off", // Type inference is often sufficient
    "@typescript-eslint/no-non-null-assertion": "warn", // Warn about non-null assertions
    "@typescript-eslint/ban-ts-comment": ["error", {
      "ts-ignore": "allow-with-description",
      "ts-expect-error": "allow-with-description",
    }], // Require comments on ts-ignore
  },
};
