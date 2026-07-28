/** @type {import('next').NextConfig} */
const nextConfig = {
  // CF 构建时用默认 .next，本地开发用 .next-dev（避免沙箱缓存问题）
  ...(process.env.CF_PAGES !== '1' ? { distDir: '.next-dev' } : {}),
  images: {
    domains: ['localhost'],
  },
  // 安全响应头
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  // 隐藏 X-Powered-By 头
  poweredByHeader: false,
}

module.exports = nextConfig
