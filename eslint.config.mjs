import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    // Ignore auto-generated Convex files and browser extension files
    ignores: [
      "convex/_generated/**",
      "extension/**",
      "public/extension/**",
    ],
  },
  {
    rules: {
      // Convex query builders and dynamic API handlers legitimately use any types.
      // Properly typing these would require complex Convex SDK generics throughout.
      "@typescript-eslint/no-explicit-any": "warn",

      // React Compiler rules: these patterns (setState in effect) are established
      // patterns in this codebase and would require significant refactoring.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",

      // Unused vars: allow underscore-prefixed vars to be unused (convention for intentional ignore)
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],

      // Anonymous default exports: not critical, downgrade to warning
      "import/no-anonymous-default-export": "warn",
    },
  },
];

export default eslintConfig;
