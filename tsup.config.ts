import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "register.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  splitting: false,
  sourcemap: false,
});
