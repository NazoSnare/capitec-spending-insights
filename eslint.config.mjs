import next from "eslint-config-next";

const config = [
  { ignores: [".next/**", "node_modules/**", "coverage/**", "playwright-report/**", "test-results/**"] },
  ...next,
];

export default config;
