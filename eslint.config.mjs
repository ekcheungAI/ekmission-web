import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow Date.now() and Math.random() in async event handlers (legitimate use for IDs/timestamps)
      "react-hooks/purity": "off",
      // Allow setState in useEffect for async data fetching (standard pattern)
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "mcp-servers/**",
  ]),
]);

export default eslintConfig;
