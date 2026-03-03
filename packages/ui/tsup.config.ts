import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/css.ts", "src/css-dark.ts", "src/css-telecom.ts", "src/web-components/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom", "sor-reader"],
});
