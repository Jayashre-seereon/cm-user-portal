import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const isProdBuild = command === "build" && mode === "production";

  if (isProdBuild) {
    // Fail the production build instead of silently shipping a wrong API target.
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const apiBase = process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL;
    if (!apiBase || !String(apiBase).trim()) {
      throw new Error(
        "VITE_API_BASE_URL is not set. Define it in the environment (or .env.production) before building for production."
      );
    }
  }

  return {
    plugins: [react()],
    build: isProdBuild
      ? {
          rolldownOptions: {
            output: {
              // Strip console.* and debugger statements from production bundles.
              minify: {
                compress: { dropConsole: true, dropDebugger: true },
                mangle: true,
                codegen: true,
              },
            },
          },
        }
      : undefined,
  };
});
