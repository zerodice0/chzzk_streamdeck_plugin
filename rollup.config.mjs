import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

const isWatching = process.env.ROLLUP_WATCH === "true";

/**
 * @type {import("rollup").RollupOptions}
 */
const config = {
  input: "src/plugin.ts",
  output: {
    file: "com.zerodice0.chzzk.sdPlugin/plugin.js",
    format: "esm",
    sourcemap: isWatching,
  },
  plugins: [
    nodeResolve({
      exportConditions: ["node"],
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: "tsconfig.json",
      outputToFilesystem: true,
    }),
  ],
  external: [],
};

export default config;
