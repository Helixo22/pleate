import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: { name: "node", environment: "node", include: ["src/**/*.test.ts"] },
      },
      {
        extends: true,
        test: {
          name: "react",
          environment: "happy-dom",
          // Same origin as the mock API (http://localhost/api), so no CORS preflight.
          environmentOptions: { happyDOM: { url: "http://localhost/" } },
          include: ["src/**/*.test.tsx"],
        },
      },
    ],
  },
});
