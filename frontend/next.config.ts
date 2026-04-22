import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@stellar/stellar-sdk", "@stellar/freighter-api"],
};

export default nextConfig;
