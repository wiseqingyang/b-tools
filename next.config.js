/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
}

module.exports = nextConfig

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
