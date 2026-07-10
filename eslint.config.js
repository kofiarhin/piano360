import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

const vitestGlobals = {
  afterAll: "readonly",
  afterEach: "readonly",
  beforeAll: "readonly",
  beforeEach: "readonly",
  describe: "readonly",
  expect: "readonly",
  it: "readonly",
  test: "readonly",
  vi: "readonly"
};

export default [
  {
    ignores: ["**/.agents/**", "**/.codex/**", "**/coverage/**", "**/dist/**", "**/node_modules/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["apps/api/**/*.{ts,tsx}", "apps/api/**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      }
    }
  },
  {
    files: ["apps/client/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024
      }
    }
  },
  {
    files: ["apps/client/**/*.test.{ts,tsx}", "apps/client/vitest.setup.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...vitestGlobals
      }
    }
  }
];
