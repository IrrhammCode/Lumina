import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Allow iPhone/other devices on the same WiFi (HMR websocket + dev assets)
  allowedDevOrigins: [
    "192.168.100.*",
    "192.168.1.*",
    "192.168.0.*",
    "10.0.*",
  ],
  webpack: (config, { webpack, isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@particle-network/universal-account-sdk": path.resolve(
        process.cwd(),
        "node_modules/@particle-network/universal-account-sdk/dist/index.mjs"
      ),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        stream: false,
        child_process: false,
      };

      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource: { request: string }) => {
            resource.request = resource.request.replace(/^node:/, "");
          }
        )
      );
    }
    return config;
  },
};

export default nextConfig;
