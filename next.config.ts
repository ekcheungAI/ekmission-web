import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ssh2", "node-ssh"],
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "ekmission.com" }],
        destination: "https://sync.ekmission.com",
        permanent: true,
      },
      {
        source: "/",
        has: [{ type: "host", value: "www.ekmission.com" }],
        destination: "https://sync.ekmission.com",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
