import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("./src", import.meta.url));
/** @type {import('next').NextConfig} */
export default {
  serverExternalPackages: ["@libsql/client"],
  poweredByHeader: false,
  webpack(config) {
    config.resolve.alias["@"] = src;
    return config;
  },
};
