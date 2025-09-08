/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
  outputFileTracingRoot: "/root/plinko-dapp-zama-fhevm/plinko-dapp-zama",
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://37.27.224.233:3000", // IPv4
    "http://[2a01:4f9:3100:191b::2]:3000", // IPv6 với ngoặc vuông
    "http://0.0.0.0:3000"
  ],
};

export default nextConfig;
