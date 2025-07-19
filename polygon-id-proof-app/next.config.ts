import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  env: {
    RHS_URL: process.env.RHS_URL,
    RPC_URL: process.env.RPC_URL,
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    CHAIN_ID: process.env.CHAIN_ID,
    CIRCUITS_PATH: process.env.CIRCUITS_PATH,
    NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
    NEXT_PUBLIC_RPC_KRNL: process.env.NEXT_PUBLIC_RPC_KRNL,
    NEXT_PUBLIC_KRNL_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_KRNL_CONTRACT_ADDRESS,
    NEXT_PUBLIC_KRNL_ENTRY_ID: process.env.NEXT_PUBLIC_KRNL_ENTRY_ID,
    NEXT_PUBLIC_KRNL_ACCESS_TOKEN: process.env.NEXT_PUBLIC_KRNL_ACCESS_TOKEN,
  },
  webpack: (config, { isServer }) => {
    // Add polyfill for TextEncoder/TextDecoder in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "text-encoding": require.resolve("fast-text-encoding"),
      };
    }
    return config;
  },
};

export default nextConfig;
