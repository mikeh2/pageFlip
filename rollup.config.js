import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "dist/index.js",
  output: {
    file: "dist/bundle.js",
    format: "esm"
  },
  external: ["./Style/stPageFlip.css"], // 👈 Ignore CSS imports
  plugins: [
    resolve(),
    commonjs()
  ]
};
