import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // workspace 包以 TS 源码形式发布(main 指向 src/index.ts),需让 Next 转译
  transpilePackages: ['@nks/api-client', '@nks/api-types'],
};

export default nextConfig;
