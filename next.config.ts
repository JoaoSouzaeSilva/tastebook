import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Origins allowed to reach the dev server from another device — your phone on the
  // same wifi, or a tunnel hostname. Dev-only; production ignores this entirely.
  // Wildcards keep it working when the DHCP lease changes.
  allowedDevOrigins: [
    "10.155.*.*",
    "192.168.*.*",
    "*.trycloudflare.com",
    "127.0.2.2"
  ],
};

export default nextConfig;
